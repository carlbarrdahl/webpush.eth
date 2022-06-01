import { createContext } from "react";
import { useServiceWorker } from "../hooks/useServiceWorker";
import { useSession } from "../hooks/useWebPush";

const Context = createContext({});

const Provider = ({ children, worker = "./sw.js" }) => {
  useServiceWorker(worker);
  const session = useSession();
  const value = {};
  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export default Provider;
