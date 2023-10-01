import GenUtils from "../../common/GenUtils";

/**
 * Models a Monero fee estimate.
 */
export default class MoneroFeeEstimate {

  fee: bigint;
  fees: bigint[];
  quantizationMask: bigint;
  
  constructor(feeEstimate?: Partial<MoneroFeeEstimate>) {
    Object.assign(this, feeEstimate);
    
    // deserialize
    if (this.fee !== undefined && typeof this.fee !== "bigint") this.fee = BigInt(this.fee);
    if (this.fees !== undefined) {
      for (let i = 0; i < this.fees.length; i++) {
        if (typeof this.fees[i] !== "bigint") this.fees[i] = BigInt(this.fees[i]);
      }
    }
    if (this.quantizationMask !== undefined && typeof this.quantizationMask !== "bigint") this.quantizationMask = BigInt(this.quantizationMask);
  }

  getFee(): bigint {
    return this.fee;
  }

  setFee(fee: bigint): MoneroFeeEstimate {
    this.fee = fee;
    return this;
  }

  getFees(): bigint[] {
    return this.fees;
  }

  setFees(fees) {
    this.fees = fees;
    return this;
  }
  
  getQuantizationMask(): bigint {
    return this.quantizationMask;
  }

  setQuantizationMask(quantizationMask): MoneroFeeEstimate {
    this.quantizationMask = quantizationMask;
    return this;
  }
  
  copy(): MoneroFeeEstimate {
    return new MoneroFeeEstimate(this);
  }
  
  toJson(): any {
    let json: any = Object.assign({}, this);
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