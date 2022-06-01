import type { NextPage } from "next";
import UNISWAP_POOL from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json";
import { Contract, providers, Wallet, utils } from "ethers";
import { useCallback, useEffect, useState } from "react";

console.log(Contract);
const WALLET_MNEMONIC =
  process.env.WALLET_MNEMONIC ||
  "chase blossom meat mammal topic hedgehog judge hazard fever beef impact forward";

const wallet = Wallet.fromMnemonic(WALLET_MNEMONIC).connect(
  new providers.AlchemyProvider(1, "qYBIoyvvVH-BihiidSWWJnOkRMD2Zt5R")
);

// Client
/*
1. What contract (abi + address) to listen to? (+ chainId)
2. What to do on event? Eg. Push Notification

*/

// Server
/*
1. Receive address, abi and event from client
2. Setup Contract and register event listener
3. Send back to client
*/
function registerEvent(event, abi) {
  const contract = new Contract(event.address, abi, wallet);

  contract.on(event, (...args) => {
    console.log("Event");
    console.log("args", args);
  });
}

const Client = () => {
  return <div>Client</div>;
};
const SSR = ({ children = null }) => {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(true);
  }, []);
  if (!loaded) {
    return null;
  }

  return children;
};

const event = [
  "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
  {
    type: "BigNumber",
    hex: "-0x2240f91004",
  },
  {
    type: "BigNumber",
    hex: "0x0420cb258a3dff0000",
  },
  {
    type: "BigNumber",
    hex: "0x58bfc793de368bbd4a8d3a215aaa",
  },
  {
    type: "BigNumber",
    hex: "0xb430fbb0a3e8efa5",
  },
  200629,
  {
    blockNumber: 14836980,
    blockHash:
      "0x4ff6b469f3fe95655aee5adfe0c9e66680ef2669ee57614b73d014d76531514c",
    transactionIndex: 42,
    removed: false,
    address: "0x8ad599c3A0ff1De082011EFDDc58f1908eb6e6D8",
    data: "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffddbf06effc00000000000000000000000000000000000000000000000420cb258a3dff000000000000000000000000000000000000000058bfc793de368bbd4a8d3a215aaa000000000000000000000000000000000000000000000000b430fbb0a3e8efa50000000000000000000000000000000000000000000000000000000000030fb5",
    topics: [
      "0xc42079f94a6350d7e6235f29174924f928cc2ac818eb64fed8004e115fbcca67",
      "0x00000000000000000000000068b3465833fb72a70ecdf485e0e4c7bd8665fc45",
      "0x00000000000000000000000068b3465833fb72a70ecdf485e0e4c7bd8665fc45",
    ],
    transactionHash:
      "0xfd0780ef6f19a0cbc48e60c028cfdcbcde1ddd4addebd215c890fc51fb5cc9ac",
    logIndex: 60,
    event: "Swap",
    eventSignature: "Swap(address,address,int256,int256,uint160,uint128,int24)",
    args: [
      "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
      "0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45",
      {
        type: "BigNumber",
        hex: "-0x2240f91004",
      },
      {
        type: "BigNumber",
        hex: "0x0420cb258a3dff0000",
      },
      {
        type: "BigNumber",
        hex: "0x58bfc793de368bbd4a8d3a215aaa",
      },
      {
        type: "BigNumber",
        hex: "0xb430fbb0a3e8efa5",
      },
      200629,
    ],
  },
];

console.log(
  event.reduce(
    (acc, x, i) => ({
      ...acc,
    }),
    {}
  )
);
console.log(UNISWAP_POOL.abi.find((e) => e.name === "Swap"));
console.log(
  UNISWAP_POOL.abi
    .find((e) => e.name === "Swap")
    .inputs.reduce(
      (acc, x, i) => ({
        ...acc,
        [x.name]: event[i],
      }),
      {}
    )
);
const Home: NextPage = () => {
  useEffect(() => {
    const contract = new Contract(
      "0x8ad599c3a0ff1de082011efddc58f1908eb6e6d8",
      UNISWAP_POOL.abi,
      wallet
    );

    console.log(contract.filters.Swap());
    console.log(contract.interface.format(utils.FormatTypes.full));

    registerEvent(contract.filters.Swap(), UNISWAP_POOL.abi);
    // console.log(wallet);
    // console.log(1, contract);
    // console.log(contract.filters.Swap());

    contract.on(contract.filters.Swap(), (...args) => {
      console.log("Swap event");
      console.log("args", args);
    });
  }, []);
  return (
    <div>
      <SSR>
        <Client />
      </SSR>
    </div>
  );
};

export default Home;
