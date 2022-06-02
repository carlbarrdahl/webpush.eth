import { createContext, useContext } from "react";
import { useServiceWorker } from "../hooks/useServiceWorker";
import { useRegisterPush, useSession } from "../hooks/useWebPush";

const Context = createContext({});

export const useWebPush = () => useContext(Context);

const Provider = ({ children, worker = "./sw.js" }) => {
  useServiceWorker(worker);
  const session = useSession();
  const register = useRegisterPush();
  const value = {
    session,
    register,
  };
  console.log("sess", session);
  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export default Provider;
