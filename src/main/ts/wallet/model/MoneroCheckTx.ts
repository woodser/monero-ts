import MoneroCheck from "./MoneroCheck";

/**
 * Results from checking a transaction key.
 */
export default class MoneroCheckTx extends MoneroCheck {

  inTxPool: boolean;
  numConfirmations: number;
  receivedAmount: bigint;
  
  constructor(check?: Partial<MoneroCheckTx>) {
    super(check);
    if (this.receivedAmount !== undefined && typeof this.receivedAmount !== "bigint") this.receivedAmount = BigInt(this.receivedAmount);
  }
  
  toJson(): any {
    let json: any = Object.assign({}, this);
    if (this.getReceivedAmount() !== undefined) json.receivedAmount = this.getReceivedAmount().toString();
    return json;
  }

  getInTxPool(): boolean {
    return this.inTxPool;
  }
  
  setInTxPool(inTxPool: boolean): MoneroCheckTx {
    this.inTxPool = inTxPool;
    return this;
  }
  
  getNumConfirmations(): number {
    return this.numConfirmations;
  }
  
  setNumConfirmations(numConfirmations: number): MoneroCheckTx {
    this.numConfirmations = numConfirmations;
    return this;
  }
  
  getReceivedAmount(): bigint {
    return this.receivedAmount;
  }
  
  setReceivedAmount(receivedAmount: bigint): MoneroCheckTx {
    this.receivedAmount = receivedAmount;
    return this;
  }
}
