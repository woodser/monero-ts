"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _GenUtils = _interopRequireDefault(require("../../common/GenUtils"));

/**
 * Models a Monero fee estimate.
 */
class MoneroFeeEstimate {





  constructor(feeEstimate) {
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

  getFee() {
    return this.fee;
  }

  setFee(fee) {
    this.fee = fee;
    return this;
  }

  getFees() {
    return this.fees;
  }

  setFees(fees) {
    this.fees = fees;
    return this;
  }

  getQuantizationMask() {
    return this.quantizationMask;
  }

  setQuantizationMask(quantizationMask) {
    this.quantizationMask = quantizationMask;
    return this;
  }

  copy() {
    return new MoneroFeeEstimate(this);
  }

  toJson() {
    let json = Object.assign({}, this);
    if (this.getFee()) json.fee = this.getFee().toString();
    if (this.getFees()) for (let i = 0; i < this.getFees().length; i++) json.fees[i] = this.getFees()[i].toString();
    if (this.getQuantizationMask()) json.quantizationMask = this.getQuantizationMask().toString();
    return json;
  }

  toString(indent = 0) {
    let str = "";
    let json = this.toJson();
    str += _GenUtils.default.kvLine("Fee", json.fee, indent);
    str += _GenUtils.default.kvLine("Fees", json.fees, indent);
    str += _GenUtils.default.kvLine("Quantization mask", json.quantizationMask, indent);
    return str.slice(0, str.length - 1); // strip last newline
  }
}exports.default = MoneroFeeEstimate;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIk1vbmVyb0ZlZUVzdGltYXRlIiwiY29uc3RydWN0b3IiLCJmZWVFc3RpbWF0ZSIsIk9iamVjdCIsImFzc2lnbiIsImZlZSIsInVuZGVmaW5lZCIsIkJpZ0ludCIsImZlZXMiLCJpIiwibGVuZ3RoIiwicXVhbnRpemF0aW9uTWFzayIsImdldEZlZSIsInNldEZlZSIsImdldEZlZXMiLCJzZXRGZWVzIiwiZ2V0UXVhbnRpemF0aW9uTWFzayIsInNldFF1YW50aXphdGlvbk1hc2siLCJjb3B5IiwidG9Kc29uIiwianNvbiIsInRvU3RyaW5nIiwiaW5kZW50Iiwic3RyIiwiR2VuVXRpbHMiLCJrdkxpbmUiLCJzbGljZSIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvZGFlbW9uL21vZGVsL01vbmVyb0ZlZUVzdGltYXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi4vLi4vY29tbW9uL0dlblV0aWxzXCI7XG5cbi8qKlxuICogTW9kZWxzIGEgTW9uZXJvIGZlZSBlc3RpbWF0ZS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvRmVlRXN0aW1hdGUge1xuXG4gIGZlZTogYmlnaW50O1xuICBmZWVzOiBiaWdpbnRbXTtcbiAgcXVhbnRpemF0aW9uTWFzazogYmlnaW50O1xuICBcbiAgY29uc3RydWN0b3IoZmVlRXN0aW1hdGU/OiBQYXJ0aWFsPE1vbmVyb0ZlZUVzdGltYXRlPikge1xuICAgIE9iamVjdC5hc3NpZ24odGhpcywgZmVlRXN0aW1hdGUpO1xuICAgIFxuICAgIC8vIGRlc2VyaWFsaXplXG4gICAgaWYgKHRoaXMuZmVlICE9PSB1bmRlZmluZWQgJiYgdHlwZW9mIHRoaXMuZmVlICE9PSBcImJpZ2ludFwiKSB0aGlzLmZlZSA9IEJpZ0ludCh0aGlzLmZlZSk7XG4gICAgaWYgKHRoaXMuZmVlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuZmVlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAodHlwZW9mIHRoaXMuZmVlc1tpXSAhPT0gXCJiaWdpbnRcIikgdGhpcy5mZWVzW2ldID0gQmlnSW50KHRoaXMuZmVlc1tpXSk7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICh0aGlzLnF1YW50aXphdGlvbk1hc2sgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgdGhpcy5xdWFudGl6YXRpb25NYXNrICE9PSBcImJpZ2ludFwiKSB0aGlzLnF1YW50aXphdGlvbk1hc2sgPSBCaWdJbnQodGhpcy5xdWFudGl6YXRpb25NYXNrKTtcbiAgfVxuXG4gIGdldEZlZSgpOiBiaWdpbnQge1xuICAgIHJldHVybiB0aGlzLmZlZTtcbiAgfVxuXG4gIHNldEZlZShmZWU6IGJpZ2ludCk6IE1vbmVyb0ZlZUVzdGltYXRlIHtcbiAgICB0aGlzLmZlZSA9IGZlZTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldEZlZXMoKTogYmlnaW50W10ge1xuICAgIHJldHVybiB0aGlzLmZlZXM7XG4gIH1cblxuICBzZXRGZWVzKGZlZXMpIHtcbiAgICB0aGlzLmZlZXMgPSBmZWVzO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRRdWFudGl6YXRpb25NYXNrKCk6IGJpZ2ludCB7XG4gICAgcmV0dXJuIHRoaXMucXVhbnRpemF0aW9uTWFzaztcbiAgfVxuXG4gIHNldFF1YW50aXphdGlvbk1hc2socXVhbnRpemF0aW9uTWFzayk6IE1vbmVyb0ZlZUVzdGltYXRlIHtcbiAgICB0aGlzLnF1YW50aXphdGlvbk1hc2sgPSBxdWFudGl6YXRpb25NYXNrO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBjb3B5KCk6IE1vbmVyb0ZlZUVzdGltYXRlIHtcbiAgICByZXR1cm4gbmV3IE1vbmVyb0ZlZUVzdGltYXRlKHRoaXMpO1xuICB9XG4gIFxuICB0b0pzb24oKTogYW55IHtcbiAgICBsZXQganNvbjogYW55ID0gT2JqZWN0LmFzc2lnbih7fSwgdGhpcyk7XG4gICAgaWYgKHRoaXMuZ2V0RmVlKCkpIGpzb24uZmVlID0gdGhpcy5nZXRGZWUoKS50b1N0cmluZygpO1xuICAgIGlmICh0aGlzLmdldEZlZXMoKSkgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmdldEZlZXMoKS5sZW5ndGg7IGkrKykganNvbi5mZWVzW2ldID0gdGhpcy5nZXRGZWVzKClbaV0udG9TdHJpbmcoKTtcbiAgICBpZiAodGhpcy5nZXRRdWFudGl6YXRpb25NYXNrKCkpIGpzb24ucXVhbnRpemF0aW9uTWFzayA9IHRoaXMuZ2V0UXVhbnRpemF0aW9uTWFzaygpLnRvU3RyaW5nKCk7XG4gICAgcmV0dXJuIGpzb247XG4gIH1cbiAgXG4gIHRvU3RyaW5nKGluZGVudCA9IDApIHtcbiAgICBsZXQgc3RyID0gXCJcIjtcbiAgICBsZXQganNvbiA9IHRoaXMudG9Kc29uKCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIkZlZVwiLCBqc29uLmZlZSwgaW5kZW50KTtcbiAgICBzdHIgKz0gR2VuVXRpbHMua3ZMaW5lKFwiRmVlc1wiLCBqc29uLmZlZXMsIGluZGVudCk7XG4gICAgc3RyICs9IEdlblV0aWxzLmt2TGluZShcIlF1YW50aXphdGlvbiBtYXNrXCIsIGpzb24ucXVhbnRpemF0aW9uTWFzaywgaW5kZW50KTtcbiAgICByZXR1cm4gc3RyLnNsaWNlKDAsIHN0ci5sZW5ndGggLSAxKTsgIC8vIHN0cmlwIGxhc3QgbmV3bGluZVxuICB9XG59Il0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsU0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNlLE1BQU1DLGlCQUFpQixDQUFDOzs7Ozs7RUFNckNDLFdBQVdBLENBQUNDLFdBQXdDLEVBQUU7SUFDcERDLE1BQU0sQ0FBQ0MsTUFBTSxDQUFDLElBQUksRUFBRUYsV0FBVyxD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