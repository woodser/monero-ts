# Getting transactions, transfers, and outputs

Wallet [transactions, transfers, and outputs](data_model.md) can be queried by their properties using query objects.

## Getting transactions with queries

See [MoneroWallet.getTxs()](https://moneroecosystem.org/monero-ts/MoneroWallet.html#getTxs) for all query options.

```typescript
// get a transaction by hash
let tx = await wallet.getTx("48db7afb1e9eecb11303d4f49c955ffdee2ffc2fa513b8f05da35ff537744096");
```

```typescript
// get unconfirmed transactions
let txs = await wallet.getTxs({
  isConfirmed: false
});
```

```typescript
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

```typescript
// get transactions with available outputs
let txs = await wallet.getTxs({
  isLocked: false,
  outputQuery: {
    isSpent: false,
  }
});
```

## Getting transfers with queries

See [MoneroWallet.getTransfers()](https://moneroecosystem.org/monero-ts/MoneroWallet.html#getTransfers) for all query options.

```typescript
// get all transfers
let transfers = await wallet.getTransfers();
```

```typescript
// get incoming transfers to account 0, subaddress 1
let transfers = await wallet.getTransfers({
  isIncoming: true,
  accountIndex: 0,
  subaddressIndex: 1
});
```

```typescript
// get transfers in the tx pool
let transfers = await wallet.getTransfers({
  txQuery: {
    inTxPool: true
  }
});
```

```typescript
// get confirmed outgoing transfers since a block height
let transfers = await wallet.getTransfers({
  isIncoming: false,
  txQuery: {
    isConfirmed: true,
    minHeight: 582106,
  }
});
```

## Getting outputs with queries

See [MoneroWallet.getOutputs()](https://moneroecosystem.org/monero-ts/MoneroWallet.html#getOutputs) for all query options.

```typescript
// get all outputs
let outputs = await wallet.getOutputs();
```

```typescript
// get outputs available to be spent
let outputs = await wallet.getOutputs({
  isSpent: false,
  txQuery: {
    isLocked: false
  }
});
```

```typescript
// get outputs by amount
outputs = await wallet.getOutputs({
  amount: BigInt()"250000000000")
});
```

```typescript
// get outputs received to a specific subaddress
let outputs = await wallet.getOutputs({
  accountIndex: 0,
  subaddressIndex: 1
});
```

```typescript
// get outputs by their key image hex
let keyImage = outputs[0].getKeyImage().getHex();
outputs = await wallet.getOutputs({
  keyImage: keyImage
});
```