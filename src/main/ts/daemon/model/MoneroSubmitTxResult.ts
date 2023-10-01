/**
 * Models the result from submitting a tx to a daemon.
 */
export default class MoneroSubmitTxResult {

  isGood: boolean;
  isRelayed: boolean;
  isDoubleSpendSeen: boolean;
  isFeeTooLow: boolean;
  isMixinTooLow: boolean;
  hasInvalidInput: boolean;
  hasInvalidOutput: boolean;
  hasTooFewOutputs: boolean;
  isOverspend: boolean;
  reason: string;
  isTooBig: boolean;
  sanityCheckFailed: boolean;
  credits: bigint;
  topBlockHash: string;
  isTxExtraTooBig: boolean;
  
  constructor(result?: Partial<MoneroSubmitTxResult>) {
    Object.assign(this, result);
    if (this.credits !== undefined && typeof this.credits !== "bigint") this.credits = BigInt(this.credits);
  }
  
  toJson(): any {
    let json: any = Object.assign({}, this);
    if (json.credits !== undefined) json.credits = json.credits.toString();
    return json;
  }
  
  getIsGood(): boolean {
    return this.isGood;
  }
  
  setIsGood(isGood: boolean): MoneroSubmitTxResult {
    this.isGood = isGood;
    return this;
  }
  
  getIsRelayed(): boolean {
    return this.isRelayed;
  }
  
  setIsRelayed(isRelayed: boolean) {
    this.isRelayed = isRelayed;
    return this;
  }
  
  getIsDoubleSpendSeen(): boolean {
    return this.isDoubleSpendSeen;
  }
  
  setIsDoubleSpendSeen(isDoubleSpendSeen: boolean): MoneroSubmitTxResult {
    this.isDoubleSpendSeen = isDoubleSpendSeen
    return this;
  }
  
  getIsFeeTooLow(): boolean {
    return this.isFeeTooLow;
  }
  
  setIsFeeTooLow(isFeeTooLow: boolean): MoneroSubmitTxResult {
    this.isFeeTooLow = isFeeTooLow;
    return this;
  }
  
  getIsMixinTooLow(): boolean {
    return this.isMixinTooLow;
  }
  
  setIsMixinTooLow(isMixinTooLow: boolean): MoneroSubmitTxResult {
    this.isMixinTooLow = isMixinTooLow;
    return this;
  }
  
  getHasInvalidInput(): boolean {
    return this.hasInvalidInput;
  }
  
  setHasInvalidInput(hasInvalidInput: boolean): MoneroSubmitTxResult {
    this.hasInvalidInput = hasInvalidInput;
    return this;
  }
  
  getHasInvalidOutput(): boolean {
    return this.hasInvalidOutput;
  }
  
  setHasInvalidOutput(hasInvalidOutput: boolean): MoneroSubmitTxResult {
    this.hasInvalidOutput = hasInvalidOutput;
    return this;
  }
  
  getHasTooFewOutputs(): boolean {
    return this.hasTooFewOutputs;
  }
  
  setHasTooFewOutputs(hasTooFewOutputs: boolean): MoneroSubmitTxResult {
    this.hasTooFewOutputs = hasTooFewOutputs;
    return this;
  }
  
  getIsOverspend(): boolean {
    return this.isOverspend;
  }
  
  setIsOverspend(isOverspend: boolean): MoneroSubmitTxResult {
    this.isOverspend = isOverspend;
    return this;
  }
  
  getReason(): string {
    return this.reason;
  }
  
  setReason(reason): MoneroSubmitTxResult {
    this.reason = reason;
    return this;
  }
  
  getIsTooBig(): boolean {
    return this.isTooBig;
  }
  
  setIsTooBig(isTooBig: boolean) {
    this.isTooBig = isTooBig;
    return this;
  }
  
  getSanityCheckFailed(): boolean {
    return this.sanityCheckFailed;
  }
  
  setSanityCheckFailed(sanityCheckFailed): MoneroSubmitTxResult {
    this.sanityCheckFailed = sanityCheckFailed;
    return this;
  }
  
  getCredits(): bigint {
    return this.credits;
  }
  
  setCredits(credits): MoneroSubmitTxResult {
    this.credits = credits;
    return this;
  }
  
  getTopBlockHash(): string {
    return this.topBlockHash;
  }
  
  setTopBlockHash(topBlockHash: string): MoneroSubmitTxResult {
    this.topBlockHash = topBlockHash;
    return this;
  }

  getIsTxExtraTooBig(): boolean {
    return this.isTxExtraTooBig;
  }
  
  setIsTxExtraTooBig(isTxExtraTooBig: boolean): MoneroSubmitTxResult {
    this.isTxExtraTooBig = isTxExtraTooBig;
    return this;
  }
}
