import { EventEmitter } from "events";
import { randomUUID } from "crypto";

import { NextApiRequest, NextApiResponse } from "next";
import nc from "next-connect";
import { ironSession } from "iron-session/express";

import webPush from "web-push";

import { Contract, providers, utils, Wallet } from "ethers";
import { JsonFragment } from "@ethersproject/abi";
import { getNetwork } from "@ethersproject/networks";

import { createClient } from "@supabase/supabase-js";

const VERCEL_URL = process.env.VERCEL_URL as string;
const NODE_ENV = process.env.NODE_ENV as string;
const IRON_SESSION_KEY = process.env.IRON_SESSION_KEY as string;
const WALLET_MNEMONIC = process.env.WALLET_MNEMONIC as string;
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY as string;
const VAPID_SECRET_KEY = process.env.VAPID_SECRET_KEY as string;
const NEXT_PUBLIC_INFURA_ID = process.env.NEXT_PUBLIC_INFURA_ID as string;
const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY as string;

// Setup Vapid Push
webPush.setVapidDetails(
  (NODE_ENV === "production" ? "https://" : "http://") + VERCEL_URL,
  VAPID_PUBLIC_KEY,
  VAPID_SECRET_KEY
);

// Setup Web3 wallets for different networks to listen to contract events
const supportedChains = [1, 4];
const wallets = supportedChains.reduce(
  (chains, chainId) => ({
    ...chains,
    [chainId]: Wallet.fromMnemonic(WALLET_MNEMONIC).connect(
      providers.InfuraProvider.getWebSocketProvider(
        getNetwork(chainId),
        NEXT_PUBLIC_INFURA_ID
      )
    ),
  }),
  {}
);

function getWallet(chainId: number) {
  return wallets[chainId || 1];
}

const events = new EventEmitter();
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default nc<NextApiRequest, NextApiResponse>({ attachParams: true })
  .use(
    ironSession({
      cookieName: "user",
      password: IRON_SESSION_KEY as string,
      cookieOptions: { secure: NODE_ENV === "production" },
    })
  )
  .post("/api/session", async (req, res) => {
    const id = randomUUID();
    req.session.user = { id };
    await req.session.save();
    res.send({ id });
  })
  .get("/api/me", (req, res) => res.send(req.session.user))
  .get("/api/logout", async (req, res) => {
    req.session.destroy();
    res.send({ ok: true });
  })
  .get("/api/vapid", async (req, res) => {
    res.status(200).json({ vapidKey: VAPID_PUBLIC_KEY });
  })
  .post("/api/register", async (req, res) => {
    const { subscription } = req.body;
    const user = req.session.user?.id;
    console.log("Registering subscription", subscription, user);
    if (!user || !subscription) {
      throw new Error("No session or subscription.");
    }
    console.log("Registering", user, subscription);
    // Store subscription
    return supabase
      .from("subscriptions")
      .insert({ user, subscription })
      .then((r) => res.json({ ok: true }));
  })
  .post("/api/subscribe", async (req, res) => {
    const user = req.session.user?.id;
    console.log("Subscribing", req.body, user);

    // Get SIWE session
    events.emit("subscribe", { ...req.body, user });
    res.json({ ok: true });
  })
  .get("/api/subscriptions", async (req, res) => {
    console.log("Getting subscriptions");
    const user = req.session.user?.id;
    if (!user) {
      throw new Error("No session");
    }
    supabase
      .from("subscriptions")
      .select("user, subscription, created_at")
      .eq("user", user)
      .then((r) => {
        console.log(r);
        res.json(r.data);
      });
  });

events.on("subscribe", async ({ abi, address, event, args, user }) => {
  console.log("Register contract topic listener", event, args);

  // Create contract and listener
  const contract = setupContract({
    contract: address,
    abi,
    event,
    args,
  });

  const topic_id = createTopicId({ address, event, abi: contract.abi, args });

  // Store topic
  await supabase
    .from("topics")
    .upsert({
      id: topic_id,
      contract: address,
      event,
      args,
      abi: contract.abi,
    })
    .then((r) => console.log("Stored topic", r));

  await supabase
    .from("topic_users")
    .upsert({ topic: topic_id, user })
    .then((r) => console.log("Stored topic_user", r));
});

function createTopicId(data) {
  return require("crypto")
    .createHash("sha256")
    .update(JSON.stringify(data))
    .digest("hex");
}

onStartup().then((r) =>
  console.log("Successfully started and listening to contracts")
);
async function onStartup() {
  // Fetch all stored topics
  const topics = await supabase
    .from("topics")
    .select("id, contract, event, args, abi, network, created_at")
    .then((r) => r.data);
  console.log("onStartup", topics);
  topics?.forEach(setupContract);
}
function setupContract(t) {
  const contract = new Contract(t.contract, t.abi, getWallet(t.network));
  const topic = contract.filters[t.event](...t.args);

  console.log("Setting up contract listener for", t);
  contract.on(topic, onEvent(t.abi, t.id));

  const abi = JSON.parse(
    contract.interface.format(utils.FormatTypes.json) as string
  );
  return { abi, topic };
}

function onEvent(abi, topicId) {
  return async (...args) => {
    console.log("Incoming event", args, topicId);

    // Get all subscribed users for this topic
    const users = await supabase
      .from("topic_users")
      .select("user")
      .eq("topic", topicId)
      .then((r) => r.data || []);

    console.log("users", users);

    // Get all subscriptions for all matching topics
    const subscriptions = (await Promise.all(
      users?.map(async (user) =>
        supabase
          .from("subscriptions")
          .select("user, subscription, created_at")
          .eq("user", user.user)
          .then((r) => r.data || [])
      )
    )) as { subscription: PushSubscription }[][];

    console.log("subscriptions", subscriptions);
    // Create payload to send
    const tx = args[args.length - 1];
    const payload = createPayload(tx.event, args, abi);

    console.log(payload);

    const notification = JSON.stringify({ event: tx.event, payload });
    console.log(notification);
    await Promise.all(
      subscriptions?.map((users) =>
        (users || []).map((user) =>
          webPush
            .sendNotification(user.subscription, notification)
            .catch(console.log)
        )
      )
    );
  };
}

function createPayload(event: string, args: any[], abi = []) {
  const fragment = abi.find((e: JsonFragment) => e.name === event) || {
    inputs: [],
  };
  return fragment.inputs.reduce(
    (acc: {}, x: JsonFragment, i: number) => ({
      ...acc,
      [x.name || i]: args[i],
    }),
    {}
  );
}

supabase
  .from("subs")
  .select(
    `
    subscription
  `
  )
  .eq("topic", "topicId")
  .then((r) => console.log(r));

const model = {
  subscriptions: {
    user: "uuid",
    topic: "id",
    subscription: "json",
  },
  topics: {
    id: "sha256",
    event: "Event",
    contract: "0x",
    abi: "json",
    args: "json",
  },
};
