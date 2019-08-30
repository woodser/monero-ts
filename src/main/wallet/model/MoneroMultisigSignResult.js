/**
 * Models the result of signing multisig tx hex.
 */
class MoneroMultisigSignResult {
  
  constructor() {
    this.state = {};
  }

  getSignedMultisigTxHex() {
    return this.state.signedMultisigTxHex;
  }

  setSignedMultisigTxHex(signedTxMultisigHex) {
    this.state.signedMultisigTxHex = signedTxMultisigHex;
  }

  getTxIds() {
    return this.state.txIds;
  }

  setTxIds(txIds) {
    this.state.txIds = txIds;
  }
}

module.exports = MoneroMultisigSignResult;