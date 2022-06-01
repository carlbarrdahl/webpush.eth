import { useEffect } from "react";

export function useServiceWorker(path: string = "./sw.js") {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register(path).then((registration) => {
        console.log("SW registered: ", registration);
      });
    }
  }, [path]);
}
