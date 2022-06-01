import { useMutation, useQuery } from "react-query";
import Button from "../components/Button";
import { useAccount, useNetwork } from "wagmi";
import {
  Box,
  Container,
  Divider,
  VStack,
  StackDivider,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  List,
  ListItem,
  Select,
  Text,
  Textarea,
  IconButton,
} from "@chakra-ui/react";
import { BellIcon, CheckIcon } from "@chakra-ui/icons";

import { CreatableSelect } from "chakra-react-select";
import { useController, useForm } from "react-hook-form";
import {
  useRegisterPush,
  useSubscribe,
  useSubscriptions,
} from "../hooks/useWebPush";

const ControlledSelect = ({ control, name, id, label, rules, ...props }) => {
  const {
    field: { onChange, onBlur, value, ref },
    fieldState: { error },
  } = useController({
    name,
    control,
    rules,
  });
  return (
    <FormControl py={4} isInvalid={!!error} id={id}>
      <FormLabel>{label}</FormLabel>

      <CreatableSelect
        name={name}
        ref={ref}
        onChange={onChange}
        onBlur={onBlur}
        value={value}
        {...props}
      />

      <FormErrorMessage>{error && error.message}</FormErrorMessage>
    </FormControl>
  );
};

const demos = {
  1: {
    NounsDAO: {
      ProposalCreated: {
        contract: "",
        event: "ProposalCreated",
        args: [],
      },
    },
  },
  4: {
    ChainLink: {
      Transfer: {
        contract: "0x01BE23585060835E02B77ef475b0Cc51aA1e0709",
        event: "Transfer",
      },
    },
  },
};

const contractOptions = [
  {
    label: "ChainLink Token (LINK)",
    value: "0x01BE23585060835E02B77ef475b0Cc51aA1e0709",
  },
];

const eventOptions = [
  {
    label: "Transfer",
    value: "Transfer",
  },
];

const DemoCustom = () => {
  const { data } = useAccount();

  const { activeChain, chains } = useNetwork();
  const subscribe = useSubscribe();
  const approve = useRegisterPush();

  const { isApproved } = approve.data;
  const { handleSubmit, register, control, formState } = useForm({
    defaultValues: {
      contract: contractOptions[0],
      event: eventOptions[0],
      args: JSON.stringify([null, data?.address], null, 2),
      abi: JSON.stringify(
        [
          "event Transfer(address indexed from, address indexed to, uint amount)",
        ],
        null,
        2
      ),
      network: 4,
    },
  });

  return (
    <form
      onSubmit={handleSubmit((form) => {
        approve.mutate(undefined, {
          onSuccess: () =>
            subscribe.mutate({
              address: form.contract.value,
              event: form.event.value,
              abi: JSON.parse(form.abi),
              args: JSON.parse(form.args),
              network: form.network,
            }),
        });
      })}
    >
      <ControlledSelect
        control={control}
        name="contract"
        id="contract"
        options={contractOptions}
        rules={{ required: "Please select a contract." }}
        label="Select Contract (or enter address)"
      />
      <ControlledSelect
        control={control}
        name="event"
        id="event"
        options={eventOptions}
        rules={{ required: "Please select an event." }}
        label="Select Event (or enter custom)"
      />
      <FormControl>
        <FormLabel>ABI (in JSON)</FormLabel>
        <Textarea
          size={"sm"}
          fontFamily={"mono"}
          id="abi"
          {...register("abi")}
          rows={6}
        ></Textarea>
      </FormControl>
      <FormControl>
        <FormLabel>Event arguments (in JSON)</FormLabel>
        <Textarea
          size="sm"
          fontFamily={"mono"}
          id="args"
          {...register("args")}
          rows={6}
        ></Textarea>
      </FormControl>
      <FormControl>
        <FormLabel>Network</FormLabel>
        <Select {...register("network", { valueAsNumber: true })}>
          {chains.map((chain) => (
            <option key={chain.id} value={chain.id}>
              {chain.name}
            </option>
          ))}
        </Select>
      </FormControl>
      <HStack justify={"flex-end"} mt={4}>
        <Button
          disabled={isApproved}
          colorScheme={"gray"}
          onClick={() => approve.mutate()}
        >
          {isApproved ? "Approved!" : "Approve Push"}
        </Button>
        <Button
          disabled={!isApproved}
          type="submit"
          isLoading={formState.isSubmitting}
        >
          Subscribe to event
        </Button>
      </HStack>
    </form>
  );
};

const ListenerList = () => {
  const { data, error, isLoading } = useSubscriptions();
  console.log(data, error, isLoading);
  return (
    <Box>
      <Heading fontSize="lg" mb={4}>
        Subscriptions
      </Heading>
      <List>
        {!data?.length ? <ListItem>No listeners yet</ListItem> : null}
        {data?.map((sub) => (
          <ListItem key={sub.created_at}>
            <pre>{JSON.stringify(sub, null, 2)}</pre>
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

const Examples = () => (
  <VStack
    divider={<StackDivider borderColor="gray.200" />}
    spacing={2}
    align="stretch"
  >
    <Heading fontSize={"md"}>Notify me when:</Heading>
    <HStack justify={"space-between"}>
      <Text fontSize="sm">LINK transfers to me on Rinkeby</Text>
      <Button variant={"ghost"} leftIcon={<BellIcon />}>
        Notify
      </Button>
    </HStack>
    <HStack justify={"space-between"}>
      <Text fontSize="sm">New proposal is created in NounsDAO</Text>
      <Button variant={"ghost"} leftIcon={<CheckIcon />}>
        Unsub
      </Button>
    </HStack>
  </VStack>
);
const Demo = () => {
  return (
    <Container maxW="container.md">
      <DemoCustom />
      {/* <ListenerList /> */}
    </Container>
  );
};

export default Demo;
