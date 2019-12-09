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

  getTxHashes() {
    return this.state.txHashes;
  }

  setTxHashes(txHashes) {
    this.state.txHashes = txHashes;
  }
}

module.exports = MoneroMultisigSignResult;