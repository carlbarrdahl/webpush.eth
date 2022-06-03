const templates = ({ address, event, payload }) => {
  const map = {
    "0x01BE23585060835E02B77ef475b0Cc51aA1e0709": {
      Transfer: (p) => ({
        title: "LINK Received!",
        body: `You have received ${p.amount?.hex / 1e18} LINK from ${p.from}`,
      }),
    },
    "0x6f3E6272A167e8AcCb32072d08E0957F9c79223d": {
      VoteCast: (p) => ({
        title: "Vote Cast!",
        body: `A Vote has been cast in NounsDAO`,
      }),
    },
    "0xDb46d1Dc155634FbC732f92E853b10B288AD5a1d": {
      PostCreated: (p) => ({
        title: "New Post!",
        body: `A new Lens Post has been created from profile: ${p.profileId} for publication: ${p.pubId}`,
      }),
    },
    "0xbce3781ae7ca1a5e050bd9c4c77369867ebc307e": {
      Transfer: (p) => ({
        title: "A Goblin was transfered!",
        body: `Token ${Number(p.tokenId?.hex)} was transfered from ${
          p.from
        } to: ${p.to}`,
      }),
    },
  };
  return (
    map[address][event](payload) || {
      title: event,
      body: JSON.stringify(payload),
    }
  );
};

self.addEventListener("push", function (e) {
  const { event, address, payload } = e.data ? e.data.json() : {};
  console.log(event, address, payload);
  const { title, body } = templates({ address, event, payload });
  console.log(title, body);
  e.waitUntil(self.registration.showNotification(title, { body }));
});

const testData = {
  from: "0x337F185907d7aFdfe9e3bEB6ADd75C652b4925B7",
  to: "0x0e7663040d6A5B2065DEA5c82c6328CfC3042C72",
  amount: { hex: "0x0de0b6b3a7640000", _isBigNumber: true },
};

console.log(
  "Test event",
  templates({
    address: "0x01BE23585060835E02B77ef475b0Cc51aA1e0709",
    event: "Transfer",
    payload: testData,
  })
);
