import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "react-query";

const QUERIES = {
  me: "/api/me",
  vapid: "/api/vapid",
  register: "/api/register",
  subscribe: "/api/subscribe",
  session: "/api/session",
  subscriptions: "/api/subscriptions",
  unsubscribe: "/api/unsubscribe",
};

export function useMe() {
  return useQuery<{ address: string }>([QUERIES.me], () =>
    axios.get(QUERIES.me).then((r) => r.data)
  );
}

export function useRegisterPush() {
  const [isApproved, setApproved] = useState(false);
  const [pushManager, setPush] = useState<PushManager | null>(null);

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
      return reg.pushManager
        .permissionState(pushOpts)
        .then((state) => setApproved(state === "granted"));
    });
  }, [pushOpts]);

  const register = useMutation(async () =>
    pushManager?.getSubscription().then(async (subscription) => {
      console.log("sub", subscription);
      return (
        subscription ||
        pushManager
          ?.subscribe(pushOpts)
          .then((subscription) =>
            axios.post(QUERIES.register, { subscription })
          )
          .then(() => setApproved(true))
      );
    })
  );

  return {
    ...register,
    data: { isApproved },
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
}
export function useSubscribe() {
  return useMutation(async (params: ContractSubscription) =>
    axios.post(QUERIES.subscribe, params)
  );
}

export function useSubscriptions() {
  return useQuery([QUERIES.subscriptions], async () =>
    axios.get<any[]>(QUERIES.subscriptions).then((r) => r.data)
  );
}

export function useUnsubscribe() {
  return useMutation(async (id) => axios.post(QUERIES.unsubscribe, id));
}
