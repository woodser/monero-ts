"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0; /**
 * Models the result from submitting a tx to a daemon.
 */
class MoneroSubmitTxResult {


















  constructor(result) {
    Object.assign(this, result);
    if (this.credits !== undefined && typeof this.credits !== "bigint") this.credits = BigInt(this.credits);
  }

  toJson() {
    let json = Object.assign({}, this);
    if (json.credits !== undefined) json.credits = json.credits.toString();
    return json;
  }

  getIsGood() {
    return this.isGood;
  }

  setIsGood(isGood) {
    this.isGood = isGood;
    return this;
  }

  getIsRelayed() {
    return this.isRelayed;
  }

  setIsRelayed(isRelayed) {
    this.isRelayed = isRelayed;
    return this;
  }

  getIsDoubleSpendSeen() {
    return this.isDoubleSpendSeen;
  }

  setIsDoubleSpendSeen(isDoubleSpendSeen) {
    this.isDoubleSpendSeen = isDoubleSpendSeen;
    return this;
  }

  getIsFeeTooLow() {
    return this.isFeeTooLow;
  }

  setIsFeeTooLow(isFeeTooLow) {
    this.isFeeTooLow = isFeeTooLow;
    return this;
  }

  getIsMixinTooLow() {
    return this.isMixinTooLow;
  }

  setIsMixinTooLow(isMixinTooLow) {
    this.isMixinTooLow = isMixinTooLow;
    return this;
  }

  getHasInvalidInput() {
    return this.hasInvalidInput;
  }

  setHasInvalidInput(hasInvalidInput) {
    this.hasInvalidInput = hasInvalidInput;
    return this;
  }

  getHasInvalidOutput() {
    return this.hasInvalidOutput;
  }

  setHasInvalidOutput(hasInvalidOutput) {
    this.hasInvalidOutput = hasInvalidOutput;
    return this;
  }

  getHasTooFewOutputs() {
    return this.hasTooFewOutputs;
  }

  setHasTooFewOutputs(hasTooFewOutputs) {
    this.hasTooFewOutputs = hasTooFewOutputs;
    return this;
  }

  getIsOverspend() {
    return this.isOverspend;
  }

  setIsOverspend(isOverspend) {
    this.isOverspend = isOverspend;
    return this;
  }

  getReason() {
    return this.reason;
  }

  setReason(reason) {
    this.reason = reason;
    return this;
  }

  getIsTooBig() {
    return this.isTooBig;
  }

  setIsTooBig(isTooBig) {
    this.isTooBig = isTooBig;
    return this;
  }

  getSanityCheckFailed() {
    return this.sanityCheckFailed;
  }

  setSanityCheckFailed(sanityCheckFailed) {
    this.sanityCheckFailed = sanityCheckFailed;
    return this;
  }

  getCredits() {
    return this.credits;
  }

  setCredits(credits) {
    this.credits = credits;
    return this;
  }

  getTopBlockHash() {
    return this.topBlockHash;
  }

  setTopBlockHash(topBlockHash) {
    this.topBlockHash = topBlockHash;
    return this;
  }

  getIsTxExtraTooBig() {
    return this.isTxExtraTooBig;
  }

  setIsTxExtraTooBig(isTxExtraTooBig) {
    this.isTxExtraTooBig = isTxExtraTooBig;
    return this;
  }

  getIsNonzeroUnlockTime() {
    return this.isNonzeroUnlockTime;
  }

  setIsNonzeroUnlockTime(isNonzeroUnlockTime) {
    this.isNonzeroUnlockTime = isNonzeroUnlockTime;
    return this;
  }
}exports.default = MoneroSubmitTxResult;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNb25lcm9TdWJtaXRUeFJlc3VsdCIsImNvbnN0cnVjdG9yIiwicmVzdWx0IiwiT2JqZWN0IiwiYXNzaWduIiwiY3JlZGl0cyIsInVuZGVmaW5lZCIsIkJpZ0ludCIsInRvSnNvbiIsImpzb24iLCJ0b1N0cmluZyIsImdldElzR29vZCIsImlzR29vZCIsInNldElzR29vZCIsImdldElzUmVsYXllZCIsImlzUmVsYXllZCIsInNldElzUmVsYXllZCIsImdldElzRG91YmxlU3BlbmRTZWVuIiwiaXNEb3VibGVTcGVuZFNlZW4iLCJzZXRJc0RvdWJsZVNwZW5kU2VlbiIsImdldElzRmVlVG9vTG93IiwiaXNGZWVUb29Mb3ciLCJzZXRJc0ZlZVRvb0xvdyIsImdldElzTWl4aW5Ub29Mb3ciLCJpc01peGluVG9vTG93Iiwic2V0SXNNaXhpblRvb0xvdyIsImdldEhhc0ludmFsaWRJbnB1dCIsImhhc0ludmFsaWRJbnB1dCIsInNldEhhc0ludmFsaWRJbnB1dCIsImdldEhhc0ludmFsaWRPdXRwdXQiLCJoYXNJbnZhbGlkT3V0cHV0Iiwic2V0SGFzSW52YWxpZE91dHB1dCIsImdldEhhc1Rvb0Zld091dHB1dHMiLCJoYXNUb29GZXdPdXRwdXRzIiwic2V0SGFzVG9vRmV3T3V0cHV0cyIsImdldElzT3ZlcnNwZW5kIiwiaXNPdmVyc3BlbmQiLCJzZXRJc092ZXJzcGVuZCIsImdldFJlYXNvbiIsInJlYXNvbiIsInNldFJlYXNvbiIsImdldElzVG9vQmlnIiwiaXNUb29CaWciLCJzZXRJc1Rvb0JpZyIsImdldFNhbml0eUNoZWNrRmFpbGVkIiwic2FuaXR5Q2hlY2tGYWlsZWQiLCJzZXRTYW5pdHlDaGVja0ZhaWxlZCIsImdldENyZWRpdHMiLCJzZXRDcmVkaXRzIiwiZ2V0VG9wQmxvY2tIYXNoIiwidG9wQmxvY2tIYXNoIiwic2V0VG9wQmxvY2tIYXNoIiwiZ2V0SXNUeEV4dHJhVG9vQmlnIiwiaXNUeEV4dHJhVG9vQmlnIiwic2V0SXNUeEV4dHJhVG9vQmlnIiwiZ2V0SXNOb256ZXJvVW5sb2NrVGltZSIsImlzTm9uemVyb1VubG9ja1RpbWUiLCJzZXRJc05vbnplcm9VbmxvY2tUaW1lIiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9kYWVtb24vbW9kZWwvTW9uZXJvU3VibWl0VHhSZXN1bHQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBNb2RlbHMgdGhlIHJlc3VsdCBmcm9tIHN1Ym1pdHRpbmcgYSB0eCB0byBhIGRhZW1vbi5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvU3VibWl0VHhSZXN1bHQge1xuXG4gIGlzR29vZDogYm9vbGVhbjtcbiAgaXNSZWxheWVkOiBib29sZWFuO1xuICBpc0RvdWJsZVNwZW5kU2VlbjogYm9vbGVhbjtcbiAgaXNGZWVUb29Mb3c6IGJvb2xlYW47XG4gIGlzTWl4aW5Ub29Mb3c6IGJvb2xlYW47XG4gIGhhc0ludmFsaWRJbnB1dDogYm9vbGVhbjtcbiAgaGFzSW52YWxpZE91dHB1dDogYm9vbGVhbjtcbiAgaGFzVG9vRmV3T3V0cHV0czogYm9vbGVhbjtcbiAgaXNPdmVyc3BlbmQ6IGJvb2xlYW47XG4gIHJlYXNvbjogc3RyaW5nO1xuICBpc1Rvb0JpZzogYm9vbGVhbjtcbiAgc2FuaXR5Q2hlY2tGYWlsZWQ6IGJvb2xlYW47XG4gIGNyZWRpdHM6IGJpZ2ludDtcbiAgdG9wQmxvY2tIYXNoOiBzdHJpbmc7XG4gIGlzVHhFeHRyYVRvb0JpZzogYm9vbGVhbjtcbiAgaXNOb256ZXJvVW5sb2NrVGltZTogYm9vbGVhbjtcbiAgXG4gIGNvbnN0cnVjdG9yKHJlc3VsdD86IFBhcnRpYWw8TW9uZXJvU3VibWl0VHhSZXN1bHQ+KSB7XG4gICAgT2JqZWN0LmFzc2lnbih0aGlzLCByZXN1bHQpO1xuICAgIGlmICh0aGlzLmNyZWRpdHMgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgdGhpcy5jcmVkaXRzICE9PSBcImJpZ2ludFwiKSB0aGlzLmNyZWRpdHMgPSBCaWdJbnQodGhpcy5jcmVkaXRzKTtcbiAgfVxuICBcbiAgdG9Kc29uKCk6IGFueSB7XG4gICAgbGV0IGpzb246IGFueSA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMpO1xuICAgIGlmIChqc29uLmNyZWRpdHMgIT09IHVuZGVmaW5lZCkganNvbi5jcmVkaXRzID0ganNvbi5jcmVkaXRzLnRvU3RyaW5nKCk7XG4gICAgcmV0dXJuIGpzb247XG4gIH1cbiAgXG4gIGdldElzR29vZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pc0dvb2Q7XG4gIH1cbiAgXG4gIHNldElzR29vZChpc0dvb2Q6IGJvb2xlYW4pOiBNb25lcm9TdWJtaXRUeFJlc3VsdCB7XG4gICAgdGhpcy5pc0dvb2QgPSBpc0dvb2Q7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldElzUmVsYXllZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pc1JlbGF5ZWQ7XG4gIH1cbiAgXG4gIHNldElzUmVsYXllZChpc1JlbGF5ZWQ6IGJvb2xlYW4pIHtcbiAgICB0aGlzLmlzUmVsYXllZCA9IGlzUmVsYXllZDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgZ2V0SXNEb3VibGVTcGVuZFNlZW4oKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaXNEb3VibGVTcGVuZFNlZW47XG4gIH1cbiAgXG4gIHNldElzRG91YmxlU3BlbmRTZWVuKGlzRG91YmxlU3BlbmRTZWVuOiBib29sZWFuKTogTW9uZXJvU3VibWl0VHhSZXN1bHQge1xuICAgIHRoaXMuaXNEb3VibGVTcGVuZFNlZW4gPSBpc0RvdWJsZVNwZW5kU2VlblxuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRJc0ZlZVRvb0xvdygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pc0ZlZVRvb0xvdztcbiAgfVxuICBcbiAgc2V0SXNGZWVUb29Mb3coaXNGZWVUb29Mb3c6IGJvb2xlYW4pOiBNb25lcm9TdWJtaXRUeFJlc3VsdCB7XG4gICAgdGhpcy5pc0ZlZVRvb0xvdyA9IGlzRmVlVG9vTG93O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRJc01peGluVG9vTG93KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmlzTWl4aW5Ub29Mb3c7XG4gIH1cbiAgXG4gIHNldElzTWl4aW5Ub29Mb3coaXNNaXhpblRvb0xvdzogYm9vbGVhbik6IE1vbmVyb1N1Ym1pdFR4UmVzdWx0IHtcbiAgICB0aGlzLmlzTWl4aW5Ub29Mb3cgPSBpc01peGluVG9vTG93O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRIYXNJbnZhbGlkSW5wdXQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaGFzSW52YWxpZElucHV0O1xuICB9XG4gIFxuICBzZXRIYXNJbnZhbGlkSW5wdXQoaGFzSW52YWxpZElucHV0OiBib29sZWFuKTogTW9uZXJvU3VibWl0VHhSZXN1bHQge1xuICAgIHRoaXMuaGFzSW52YWxpZElucHV0ID0gaGFzSW52YWxpZElucHV0O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRIYXNJbnZhbGlkT3V0cHV0KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhc0ludmFsaWRPdXRwdXQ7XG4gIH1cbiAgXG4gIHNldEhhc0ludmFsaWRPdXRwdXQoaGFzSW52YWxpZE91dHB1dDogYm9vbGVhbik6IE1vbmVyb1N1Ym1pdFR4UmVzdWx0IHtcbiAgICB0aGlzLmhhc0ludmFsaWRPdXRwdXQgPSBoYXNJbnZhbGlkT3V0cHV0O1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRIYXNUb29GZXdPdXRwdXRzKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhc1Rvb0Zld091dHB1dHM7XG4gIH1cbiAgXG4gIHNldEhhc1Rvb0Zld091dHB1dHMoaGFzVG9vRmV3T3V0cHV0czogYm9vbGVhbik6IE1vbmVyb1N1Ym1pdFR4UmVzdWx0IHtcbiAgICB0aGlzLmhhc1Rvb0Zld091dHB1dHMgPSBoYXNUb29GZXdPdXRwdXRzO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRJc092ZXJzcGVuZCgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pc092ZXJzcGVuZDtcbiAgfVxuICBcbiAgc2V0SXNPdmVyc3BlbmQoaXNPdmVyc3BlbmQ6IGJvb2xlYW4pOiBNb25lcm9TdWJtaXRUeFJlc3VsdCB7XG4gICAgdGhpcy5pc092ZXJzcGVuZCA9IGlzT3ZlcnNwZW5kO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRSZWFzb24oKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy5yZWFzb247XG4gIH1cbiAgXG4gIHNldFJlYXNvbihyZWFzb24pOiBNb25lcm9TdWJtaXRUeFJlc3VsdCB7XG4gICAgdGhpcy5yZWFzb24gPSByZWFzb247XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldElzVG9vQmlnKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmlzVG9vQmlnO1xuICB9XG4gIFxuICBzZXRJc1Rvb0JpZyhpc1Rvb0JpZzogYm9vbGVhbikge1xuICAgIHRoaXMuaXNUb29CaWcgPSBpc1Rvb0JpZztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgZ2V0U2FuaXR5Q2hlY2tGYWlsZWQoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuc2FuaXR5Q2hlY2tGYWlsZWQ7XG4gIH1cbiAgXG4gIHNldFNhbml0eUNoZWNrRmFpbGVkKHNhbml0eUNoZWNrRmFpbGVkKTogTW9uZXJvU3VibWl0VHhSZXN1bHQge1xuICAgIHRoaXMuc2FuaXR5Q2hlY2tGYWlsZWQgPSBzYW5pdHlDaGVja0ZhaWxlZDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgZ2V0Q3JlZGl0cygpOiBiaWdpbnQge1xuICAgIHJldHVybiB0aGlzLmNyZWRpdHM7XG4gIH1cbiAgXG4gIHNldENyZWRpdHMoY3JlZGl0cyk6IE1vbmVyb1N1Ym1pdFR4UmVzdWx0IHtcbiAgICB0aGlzLmNyZWRpdHMgPSBjcmVkaXRzO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRUb3BCbG9ja0hhc2goKTogc3RyaW5nIHtcbiAgICByZXR1cm4gdGhpcy50b3BCbG9ja0hhc2g7XG4gIH1cbiAgXG4gIHNldFRvcEJsb2NrSGFzaCh0b3BCbG9ja0hhc2g6IHN0cmluZyk6IE1vbmVyb1N1Ym1pdFR4UmVzdWx0IHtcbiAgICB0aGlzLnRvcEJsb2NrSGFzaCA9IHRvcEJsb2NrSGFzaDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGdldElzVHhFeHRyYVRvb0JpZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pc1R4RXh0cmFUb29CaWc7XG4gIH1cbiAgXG4gIHNldElzVHhFeHRyYVRvb0JpZyhpc1R4RXh0cmFUb29CaWc6IGJvb2xlYW4pOiBNb25lcm9TdWJtaXRUeFJlc3VsdCB7XG4gICAgdGhpcy5pc1R4RXh0cmFUb29CaWcgPSBpc1R4RXh0cmFUb29CaWc7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRJc05vbnplcm9VbmxvY2tUaW1lKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmlzTm9uemVyb1VubG9ja1RpbWU7XG4gIH1cbiAgXG4gIHNldElzTm9uemVyb1VubG9ja1RpbWUoaXNOb256ZXJvVW5sb2NrVGltZTogYm9vbGVhbik6IE1vbmVyb1N1Ym1pdFR4UmVzdWx0IHtcbiAgICB0aGlzLmlzTm9uemVyb1VubG9ja1RpbWUgPSBpc05vbnplcm9VbmxvY2tUaW1lO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG59XG4iXSwibWFwcGluZ3MiOiJxR0FBQTtBQUNBO0FBQ0E7QUFDZSxNQUFNQSxvQkFBb0IsQ0FBQzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQW1CeENDLFdBQVdBLENBQUNDLE1BQXNDLEVBQUU7SUFDbERDLE1BQU0sQ0FBQ0MsTUFBTSxDQUFDLElBQUksRUFBRUYsTUFBTSxDQUFDO0lBQzNCLElBQUksSUFBSSxDQUFDRyxP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