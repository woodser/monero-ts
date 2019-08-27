package monero.wallet.model;

import java.util.List;

/**
 * Models the result of signing multisig tx hex.
 */
public class MoneroMultisigSignResult {
  
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

module.exports = MoneroMultisigInitResult;