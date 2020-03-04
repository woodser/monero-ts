/**
 * Models the result of initializing a multisig wallet which results in the
 * multisig wallet's address xor another multisig hex to share with
 * participants to create the wallet.
 */
class MoneroMultisigInitResult {

  constructor(state) {
    this.state = Object.assign({}, state);
  }
  
  toJson() {
    return Object.assign({}, this.state);
  }
  
  getAddress() {
    return this.state.address;
  }
  
  setAddress(address) {
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