import "@rainbow-me/rainbowkit/styles.css";
import { chain, createClient, configureChains, WagmiConfig } from "wagmi";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";

import { infuraProvider } from "wagmi/providers/infura";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";

import { ChakraProvider } from "@chakra-ui/react";
import { AppType } from "next/dist/shared/lib/utils";
import { QueryClientProvider } from "react-query";
import WebPushProvider from "../components/Provider";

const APP_NAME = "webpush.eth";

const { chains, provider } = configureChains(
  [chain.mainnet, chain.rinkeby],
  [
    infuraProvider({ infuraId: process.env.NEXT_PUBLIC_INFURA_ID }),
    alchemyProvider({ alchemyId: process.env.NEXT_PUBLIC_ALCHEMY_ID }),
    publicProvider(),
  ]
);

const { connectors } = getDefaultWallets({ appName: APP_NAME, chains });
const wagmiClient = createClient({ autoConnect: true, connectors, provider });

const App: AppType = ({ Component, pageProps }) => {
  return (
    <WagmiConfig client={wagmiClient}>
      <RainbowKitProvider chains={chains}>
        <QueryClientProvider client={wagmiClient.queryClient}>
          <ChakraProvider>
            <WebPushProvider worker="./sw.js">
              <Component {...pageProps} />
            </WebPushProvider>
          </ChakraProvider>
        </QueryClientProvider>
      </RainbowKitProvider>
    </WagmiConfig>
  );
};

export default App;
