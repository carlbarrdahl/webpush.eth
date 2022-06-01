const templates = ({ event, payload }) => {
  const map = {
    Transfer: (p) => ({
      title: "LINK Received!",
      body: `You have received ${p.amount._hex / 1e18} LINK from ${p.from}`,
    }),
  };
  return map[event](payload) || { title: event, body: JSON.stringify(payload) };
};

self.addEventListener("push", function (e) {
  const { event, payload } = e.data ? e.data.json() : {};
  console.log(event, payload);
  const { title, body } = templates({ event, payload });
  console.log(title, body);
  e.waitUntil(self.registration.showNotification(title, { body }));
});

const testData = {
  from: "0x337F185907d7aFdfe9e3bEB6ADd75C652b4925B7",
  to: "0x0e7663040d6A5B2065DEA5c82c6328CfC3042C72",
  amount: { _hex: "0x0de0b6b3a7640000", _isBigNumber: true },
};

console.log(templates({ event: "Transfer", payload: testData }));
