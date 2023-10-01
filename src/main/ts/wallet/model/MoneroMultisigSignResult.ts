/**
 * Models the result of signing multisig tx hex.
 */
export default class MoneroMultisigSignResult {

  signedMultisigTxHex: string;
  txHashes: string[];
  
  constructor(result?: Partial<MoneroMultisigSignResult>) {
    Object.assign(this, result);
  }
  
  toJson(): any {
    return Object.assign({}, this);
  }
  
  getSignedMultisigTxHex(): string {
    return this.signedMultisigTxHex;
  }

  setSignedMultisigTxHex(signedTxMultisigHex: string): MoneroMultisigSignResult {
    this.signedMultisigTxHex = signedTxMultisigHex;
    return this;
  }

  getTxHashes(): string[] {
    return this.txHashes;
  }

  setTxHashes(txHashes: string[]): MoneroMultisigSignResult {
    this.txHashes = txHashes;
    return this;
  }
}
