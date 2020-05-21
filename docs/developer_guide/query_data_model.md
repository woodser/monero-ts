# Getting transactions, transfers, and outputs

Wallet [transactions, transfers, and outputs](data_model.md) can be queried by their attributes using query objects.

## Transaction queries

See [MoneroWallet.getTxs()](https://moneroecosystem.org/monero-javascript/MoneroWallet.html#getTxs) for all query options.

```javascript
// get a transaction by hash
let tx = await wallet.getTx("0b30d7b7510a1aed88c87464dffdcfe9d24feffc8798e30e887e3c9c3558a814");
```

```javascript
// get unconfirmed transactions
let txs = await wallet.getTxs({
  isConfirmed: false
});
```

```javascript
// get transactions since height 582106 with incoming transfers to
// account 0, subaddress 0
let txs = await wallet.getTxs({
  minHeight: 582106,
  transferQuery: {
    isIncoming: true,
    accountIndex: 0,
    subaddressIndex: 1
  }
});
```

```javascript
// get transactions with available outputs
let txs = await wallet.getTxs({
  isLocked: false,
  outputQuery: {
    isSpent: false,
  }
});
```

## Transfer queries

See [MoneroWallet.getTransfers()](https://moneroecosystem.org/monero-javascript/MoneroWallet.html#getTransfers) for all query options.

```javascript
// get all transfers
let transfers = await wallet.getTransfers();
```

```javascript
// get incoming transfers to account 0, subaddress 1
let transfers = await wallet.getTransfers({
  isIncoming: true,
  accountIndex: 0,
  subaddressIndex: 1
});
```

```javascript
// get transfers in the tx pool
let transfers = await wallet.getTransfers({
  txQuery: {
    isConfirmed: false
  }
});
```

```javascript
// get confirmed outgoing transfers since a block height
let transfers = await wallet.getTransfers({
  isOutgoing: true,
  txQuery: {
    isConfirmed: true,
    minHeight: 582106,
  }
});
```

## Output queries

See [MoneroWallet.getOutputs()](https://moneroecosystem.org/monero-javascript/MoneroWallet.html#getOutputs) for all query options.

```javascript
// get all outputs
let outputs = await wallet.getOutputs();
```

```javascript
// get outputs available to be spent
let outputs = await wallet.getOutputs({
  isSpent: false,
  txQuery: {
    isLocked: false
  }
});
```

```javascript
// get outputs received to a specific subaddress
outputs = await wallet.getOutputs({
  accountIndex: 0,
  subaddressIndex: 1
});

let keyImage = outputs[0].getKeyImage().getHex();
outputs = await wallet.getOutputs({
  keyImage: keyImage
});
```