# webpush.eth

Simple way to subscribe to push notifications from your dApp.

Possible use-cases include:

- Get notified when DAO creates a new proposal or executes one
- Receive updates when tokens are transfered to or from an address
- When someone mints and NFT
- Or just simply when a transaction has finished.

## Getting started

```sh
yarn add @webpush.eth/react
```

### 1. Create Service Worker script

```ts
// public/sw.js

// Listen for incoming push events
self.addEventListener("push", function (e) {
  const { event, payload } = e.data ? e.data.json() : {};
  // Select template
  const { title, body } = templates({ event, payload });
  // Show notification
  e.waitUntil(self.registration.showNotification(title, { body }));
});

// Describe templates
const templates = ({ event, payload }) => {
  const map = {
    Transfer: (p) =>
      `You have received ${p.amount._hex / 1e18} LINK from ${p.from}`,
  };
  return map[event](payload) || { title: event, body: JSON.stringify(payload) };
};
```

### 2. Load worker in your app

```ts
// src/App.tsx
import { WebPushProvider } from "@webpush.eth/react";
function App() {
  return (
    <WebPushProvider worker="./sw.js">
      <SubscribeToPush />
    </WebPushProvider>
  );
}
```

### 3. Enable Push Notifications and subscribe to events

```tsx
import { useRegisterPush, useSubscribe } from "@webpush.eth/react";

function SubscribeToPush() {
  const approve = useRegisterPush();
  const subscribe = useSubscribe();

  return (
    <Button
      isLoading={approve.isLoading || subscribe.isLoading}
      onClick={async () => {
        // Trigger approval of push notifications
        approve.mutate().then(() =>
          // Subscribe to event
          subscribe.mutate({
            // Contract address
            address: "0x...",
            // Contract event to subscribe to
            event: "Transfer",
            // Contract ABI (or fragment of it)
            abi: [
              "event Transfer(address indexed from, address indexed to, uint amount)",
            ],
            // Arguments for event
            args: [null, "0x..."],
          })
        );
      }}
    >
      Subscribe to Push notifications
    </Button>
  );
}
```
