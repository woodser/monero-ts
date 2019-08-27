package monero.wallet.model;

/**
 * Models the result of initializing a multisig wallet which results in the
 * multisig wallet's address xor another multisig hex to share with
 * participants to create the wallet.
 */
public class MoneroMultisigInitResult {

  constructor() {
    this.state = {};
  }
  
  getAddress() {
    return this.state.address;
  }
  
  setAddress(String address) {
    this.state.address = address;
    return this;
  }
  
  getMultisigHex() {
    return this.state.multisigHex;
  }
  
  setMultisigHex(multisigHex) {
    this.state.multisigHex = multisigHex;
    return this;
  }
}

module.exports = MoneroMultisigInitResult;