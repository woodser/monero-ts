const BigInteger = require("../../common/biginteger").BigInteger;
const GenUtils = require("../../common/GenUtils");

/**
 * Models a Monero fee estimate.
 */
class MoneroFeeEstimate {
  
  /**
   * Construct the model.
   * 
   * @param {MoneroFeeEstimate|object} state - MoneroFeeEstimate or JS object
   */
  constructor(state) {
    if (!state) this.state = {};
    else if (state instanceof MoneroFeeEstimate) this.state = state.toJson();
    else if (typeof state === "object") this.state = Object.assign({}, state);
    else throw new MoneroError("state must be a MoneroFeeEstimate or JavaScript object");
    
    // deserialize
    if (this.state.fee !== undefined && !(this.state.fee instanceof BigInteger)) this.state.fee = BigInteger.parse(this.state.fee);
    if (this.state.fees !== undefined) {
      for (let i = 0; i < this.state.fees.length; i++) {
        if (!(this.state.fees[i] instanceof BigInteger)) this.state.fees[i] = BigInteger.parse(this.state.fees[i]);
      }
    }
    if (this.state.quantizationMask !== undefined && !(this.state.quantizationMask instanceof BigInteger)) this.state.quantizationMask = BigInteger.parse(this.state.quantizationMask);
  }

  getFee() {
    return this.state.fee;
  }

  setFee(fee) {
    this.state.fee = fee;
    return this;
  }

  getFees() {
    return this.state.fees;
  }

  setFees(fees) {
    this.state.fees = fees;
    return this;
  }
  
  getQuantizationMask() {
    return this.state.quantizationMask;
  }

  setQuantizationMask(quantizationMask) {
    this.state.quantizationMask = quantizationMask;
    return this;
  }
  
  copy() {
    return new MoneroFeeEstimate(this);
  }
  
  toJson() {
    let json = Object.assign({}, this.state);
    if (this.getFee()) json.fee = this.getFee().toString();
    if (this.getFees()) for (let i = 0; i < this.getFees().length; i++) json.fees[i] = this.getFees()[i].toString();
    if (this.getQuantizationMask()) json.quantizationMask = this.getQuantizationMask().toString();
    return json;
  }
  
  toString(indent = 0) {
    let str = "";
    let json = this.toJson();
    str += GenUtils.kvLine("Fee", json.fee, indent);
    str += GenUtils.kvLine("Fees", json.fees, indent);
    str += GenUtils.kvLine("Quantization mask", json.quantizationMask, indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
}

module.exports = MoneroFeeEstimate;