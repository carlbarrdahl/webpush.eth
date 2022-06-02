import _axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "react-query";

const baseURL = "https://webpusheth.carlbarrdahl.repl.co";
const axios = _axios.create({ baseURL });
const QUERIES = {
  me: "/me",
  vapid: "/vapid",
  register: "/register",
  subscribe: "/subscribe",
  session: "/session",
  subscriptions: "/subscriptions",
  unsubscribe: "/unsubscribe",
};

export function useMe() {
  return useQuery<{ address: string }>([QUERIES.me], () =>
    axios.get(QUERIES.me).then((r) => r.data)
  );
}

/*
1. Get Vapid Key
2. Get Service Worker registration
  - Set PushManager
  - Check PermissionState
3. Create handler to get subscription (opens up Allow Notification dialog)
*/
export function useRegisterPush() {
  const [isApproved, setApproved] = useState(false);
  const [pushManager, setPush] = useState<PushManager | null>(null);
  const [subscription, setSub] = useState<PushSubscription | null>(null);

  const vapid = useQuery([QUERIES.vapid], () =>
    axios.get<{ vapidKey: string }>(QUERIES.vapid).then((r) => r.data.vapidKey)
  );
  const pushOpts = useMemo(
    () => ({
      userVisibleOnly: true,
      applicationServerKey: vapid.data,
    }),
    [vapid]
  );

  useEffect(() => {
    // @ts-ignore
    navigator.serviceWorker.ready.then((reg) => {
      setPush(reg.pushManager);
      return reg.pushManager.permissionState(pushOpts).then((state) => {
        setApproved(state === "granted");
      });
    });
  }, [pushOpts]);

  const register = useMutation(async () =>
    pushManager?.getSubscription().then(async (subscription) => {
      console.log("sub", subscription);
      return (
        subscription ||
        pushManager?.subscribe(pushOpts).then((subscription) => {
          setSub(subscription);
          setApproved(!!subscription);
        })
      );
    })
  );

  console.log("err", register.error);
  console.log("sub", subscription);

  return {
    ...register,
    data: { isApproved, subscription, allow: register.mutate },
  };
}

const STORAGE_UUID = "webpush.eth/uuid";
const storage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (error) {}
  },
  setItem: (key, val) => {
    try {
      return localStorage.setItem(key, val);
    } catch (error) {}
  },
};
export function useSession() {
  const [id, setId] = useState(() => storage.getItem(STORAGE_UUID));
  const session = useMutation(() =>
    axios.post(QUERIES.session).then((r) => {
      const { id } = r.data;
      if (!id) return null;
      storage.setItem(STORAGE_UUID, id);
      return setId(id);
    })
  );
  useEffect(() => {
    if (!id && !session.isLoading) {
      session.mutate();
    }
  }, [id, session]);

  return { id };
}

interface ContractSubscription {
  address: string;
  abi: string;
  event: string;
  args: string;
  network: number;
  // subscription: PushSubscription;
}

function useSubscription() {
  const [sub, setSub] = useState<PushSubscription | null>(null);
  useEffect(() => {
    navigator.serviceWorker.ready
      .then((sw) => sw.pushManager.getSubscription())
      .then(setSub);
  }, []);
  return sub;
}
export function useSubscribe() {
  const subscription = useSubscription();

  console.log("useSubscribe", subscription);
  return useMutation(async (params: ContractSubscription) => {
    console.log(params);
    return axios.post(QUERIES.subscribe, { ...params, subscription });
  });
}

export function useSubscriptions() {
  return useQuery([QUERIES.subscriptions], async () =>
    axios.get<any[]>(QUERIES.subscriptions).then((r) => r.data)
  );
}

export function useUnsubscribe() {
  return useMutation(async (id) => axios.post(QUERIES.unsubscribe, id));
}
