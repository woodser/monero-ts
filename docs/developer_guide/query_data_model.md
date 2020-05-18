# Query wallet transactions, transers, and outputs

Wallet [transactions, transfers, and outputs](data_model.md) can be queried by their attributes using query objects.

## Query transactions

See [getTxs()](https://moneroecosystem.org/monero-javascript/MoneroWallet.html#getTxs) in MoneroWallet.js for all query options.

```javascript
// get unconfirmed transactions
let txs = await wallet.getTxs({
  isConfirmed: false
});

// get confirmed transactions since height 582106 with
// incoming transfers to account 0, subaddress 1
txs = await wallet.getTxs({
  isConfirmed: true,
  minHeight: 582106,
  transferQuery: {
    isIncoming: true,
    accountIndex: 0,
    subaddressIndex: 1
  }
});

// get transactions with available outputs
txs = await wallet.getTxs({
  isLocked: false,
  outputQuery: {
    isSpent: false,
  }
});
```

## Query transfers

TODO

## Query outputs

TODO