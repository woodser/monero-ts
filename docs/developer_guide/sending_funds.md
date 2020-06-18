# Sending funds

The following are examples of sending funds using monero-javascript.

```javascript
// create a transaction to send funds to an address, but do not relay
let tx = await wallet.createTx({
  accountIndex: 0,  // source account to send funds from
  address: "55bcxMRhBWea6xxsot8moF1rdPprjJR2x4mfnNnTGgBJFgXa4gWXmWAYdUBKiRcJxy9AUAGJEg28DejvWdJU2VgUDrUvCHG",
  amount: "1000000000000" // send 1 XMR (denominated in atomic units)
});

// can confirm with the user
let fee = tx.getFee();  // "Are you sure you want to send... ?"

// relay the transaction
let hash = await wallet.relayTx(tx);
```

```javascript
// send funds to a single destination
let tx = await wallet.createTx({
  accountIndex: 0,  // source account to send funds from
  address: "55bcxMRhBWea6xxsot8moF1rdPprjJR2x4mfnNnTGgBJFgXa4gWXmWAYdUBKiRcJxy9AUAGJEg28DejvWdJU2VgUDrUvCHG",
  amount: "1000000000000", // send 1 XMR (denominated in atomic units)
  relay: true // relay the transaction to the network
});
```

```javascript
// send funds from a specific subaddress to multiple destinations,
// allowing transfers to be split across multiple transactions if needed
let txs = await wallet.createTxs({
  accountIndex: 0,    // source account to send funds from
  subaddressIndex: 1, // source subaddress to send funds from
  destinations: [{
      address: "55bcxMRhBWea6xxsot8moF1rdPprjJR2x4mfnNnTGgBJFgXa4gWXmWAYdUBKiRcJxy9AUAGJEg28DejvWdJU2VgUDrUvCHG",
      amount: "500000000000", // send 0.5 XMR (denominated in atomic units)
    }, {
      address: "52f7hei1UMrbvYUNtDMKZJMQjcfVyufYnezER8wVK271VmGbzE2kN7cMMG6qFjrb6Ub6qPkNt815a98kJmo874qG9GYZKD5",
      amount: "500000000000", // send 0.5 XMR (denominated in atomic units)
    }],
  priority: MoneroTxPriority.IMPORTANT,
  relay: true // relay the transaction to the network
});
```

```javascript
// sweep an output
let tx = await wallet.sweepOutput({
  address: "55bcxMRhBWea6xxsot8moF1rdPprjJR2x4mfnNnTGgBJFgXa4gWXmWAYdUBKiRcJxy9AUAGJEg28DejvWdJU2VgUDrUvCHG",
  keyImage: "b7afd6afbb1615c98b1c0350b81c98a77d6d4fc0ab92020d25fd76aca0914f1e",
  relay: true
});
```

```javascript
// sweep all unlocked funds in a wallet
let txs = await wallet.sweepUnlocked({
  address: "55bcxMRhBWea6xxsot8moF1rdPprjJR2x4mfnNnTGgBJFgXa4gWXmWAYdUBKiRcJxy9AUAGJEg28DejvWdJU2VgUDrUvCHG",
  relay: true
});
```

```javascript
// sweep unlocked funds in an account
let txs = await wallet.sweepUnlocked({
  accountIndex: 0,
  address: "55bcxMRhBWea6xxsot8moF1rdPprjJR2x4mfnNnTGgBJFgXa4gWXmWAYdUBKiRcJxy9AUAGJEg28DejvWdJU2VgUDrUvCHG",
  relay: true
});
```

```javascript
// sweep unlocked funds in a subaddress
let txs = await wallet.sweepUnlocked({
  accountIndex: 0,
  subaddressIndex: 0,
  address: "55bcxMRhBWea6xxsot8moF1rdPprjJR2x4mfnNnTGgBJFgXa4gWXmWAYdUBKiRcJxy9AUAGJEg28DejvWdJU2VgUDrUvCHG",
  relay: true
});
```