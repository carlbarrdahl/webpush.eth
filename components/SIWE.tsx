import { useMutation, useQuery, useQueryClient } from "react-query";
import { useAccount, useNetwork, useSignMessage } from "wagmi";
import Button from "./Button";

import axios from "../lib/axios";
import { SiweMessage } from "siwe";

function useSignIn() {
  const { data } = useAccount();
  const { activeChain } = useNetwork();
  const { signMessageAsync } = useSignMessage();

  const nonce = useQuery<string>([queries.nonce], () =>
    axios.get(queries.nonce).then((r) => r.data)
  );

  const queryClient = useQueryClient();
  const signIn = useMutation(async () => {
    const message = new SiweMessage({
      domain: window.location.host,
      address: data?.address,
      statement: "Sign in with Ethereum to the app.",
      uri: window.location.origin,
      version: "1",
      chainId: activeChain?.id,
      nonce: nonce.data,
    });
    const signature = await signMessageAsync({
      message: message.prepareMessage(),
    });

    return axios
      .post(queries.verify, { message, signature })
      .then(() => queryClient.invalidateQueries([queries.me]));
  });

  return signIn;
}

const queries = {
  me: "/api/me",
  nonce: "/api/nonce",
  verify: "/api/verify",
};

export function useMe() {
  return useQuery<{ address: string }>([queries.me], () =>
    axios.get(queries.me).then((r) => r.data)
  );
}
const SignInWithEthereum = () => {
  const signIn = useSignIn();
  const me = useMe();

  function handleSignIn() {
    return signIn.mutate();
  }

  if (me.data?.address) {
    // Hide if signed in
    return null;
  }
  return (
    <Button isLoading={signIn.isLoading} onClick={handleSignIn}>
      Sign in
    </Button>
  );
};

export default SignInWithEthereum;
