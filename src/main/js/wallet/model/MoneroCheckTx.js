import MoneroCheck from "./MoneroCheck";

/**
 * Results from checking a transaction key.
 * 
 * @extends {MoneroCheck}
 */
class MoneroCheckTx extends MoneroCheck {
  
  constructor(state) {
    super(state);
    if (this.state.receivedAmount !== undefined && !(this.state.receivedAmount instanceof BigInt)) this.state.receivedAmount = BigInt(this.state.receivedAmount);
  }
  
  toJson() {
    let json = Object.assign({}, this.state);
    if (this.getReceivedAmount() !== undefined) json.receivedAmount = this.getReceivedAmount().toString();
    return json;
  }

  inTxPool() {
    return this.state.inTxPool;
  }
  
  setInTxPool(inTxPool) {
    this.state.inTxPool = inTxPool;
    return this;
  }
  
  getNumConfirmations() {
    return this.state.numConfirmations;
  }
  
  setNumConfirmations(numConfirmations) {
    this.state.numConfirmations = numConfirmations;
    return this;
  }
  
  getReceivedAmount() {
    return this.state.receivedAmount;
  }
  
  setReceivedAmount(receivedAmount) {
    this.state.receivedAmount = receivedAmount;
    return this;
  }
}

export default MoneroCheckTx;
