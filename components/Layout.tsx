import React from "react";
import Head from "next/head";
import { Text, HStack, Flex, Container } from "@chakra-ui/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { useServiceWorker } from "../hooks/useServiceWorker";

const Layout = ({ children }: { children: React.ReactNode }) => {
  useServiceWorker("./sw.js");
  return (
    <Flex flexDirection={"column"} h="100vh">
      <Head>
        <title>webpush.eth</title>
        <meta name="description" content="gm your friENS!" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container maxW="container.md" mb={8}>
        <HStack as="header" justify={"space-between"} p={2}>
          <Text pl={0} fontWeight="bold">
            webpush.eth
          </Text>
          <ConnectButton />
        </HStack>
      </Container>
      {children}
    </Flex>
  );
};

export default Layout;
