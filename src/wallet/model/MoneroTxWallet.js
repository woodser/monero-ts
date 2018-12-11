const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroTx = require("../../daemon/model/MoneroTx");

/**
 * Models a Monero transaction with additional fields in the context of a wallet.
 */
class MoneroTxWallet extends MoneroTx {
  
  constructor(json) {
    super(json);
  }
  
  getIsIncoming() {
    return this.json.isIncoming;
  }
  
  setIsIncoming(isIncoming) {
    this.json.isIncoming = isIncoming;
  }
  
  getIsOutgoing() {
    if (this.json.isIncoming === undefined) return undefined;
    return !this.json.isIncoming;
  }
  
  setIsOutgoing(isOutgoing) {
    this.setIsIncoming(isOutgoing === undefined ? undefined : !isOutgoing);
  }
  
  // wallet transactions are not in the mempool xor confirmed since both can be false, so we use another field
  getInMempool() {
    return this.json.inMempool;
  }
  
  setInMempool(inMempool) {
    this.json.inMempool = inMempool;
  }
  
  getIsRelayed() {
    return this.json.isRelayed;
  }
  
  setIsRelayed(isRelayed) {
    this.json.isRelayed = isRelayed;
  }
  
  getIsFailed() {
    return this.json.isFailed;
  }
  
  setIsFailed(isFailed) {
    this.json.isFailed = isFailed;
  }
  
  getTotalAmount() {
    return this.json.totalAmount;
  }
  
  setTotalAmount(totalAmount) {
    this.json.totalAmount = totalAmount;
  }
  
  getPayments() {
    return this.json.payments;
  }
  
  setPayments(payments) {
    this.json.payments = payments;
  }
  
  getNote() {
    return this.json.note;
  }
  
  setNote(note) {
    this.json.note = note;
  }
  
  getSrcAccountIndex() {
    return this.json.srcAccountIndex;
  }
  
  setSrcAccountIndex(srcAccountIndex) {
    this.json.srcAccountIndex = srcAccountIndex;
  }
  
  getSrcSubaddressIndex() {
    return this.json.srcSubaddrIndex;
  }
  
  setSrcSubaddressIndex(srcSubaddrIndex) {
    this.json.srcSubaddrIndex = srcSubaddrIndex;
  }
  
  getSrcAddress() {
    return this.json.srcAddress;
  }
  
  setSrcAddress(srcAddress) {
    this.json.srcAddress = srcAddress;
  }
  
  getIsCoinbase() {
    return this.json.coinbase;
  }
  
  setIsCoinbase(coinbase) {
    this.json.coinbase = coinbase;
  }
  
  getBlob() {
    return this.json.blob;
  }
  
  setBlob(blob) {
    this.json.blob = blob;
  }
  
  getMetadata() {
    return this.json.metadata;
  }
  
  setMetadata(metadata) {
    this.json.metadata = metadata;
  }
  
  toJson() {
    throw new Error("Not implemented");
  }
  
  merge(tx, mergePayments) {
    
    // merge base transaction
    super.merge(tx);
    
    // merge extensions which need no special handling
    MoneroUtils.safeSet(this, this.getIsIncoming, this.setIsIncoming, tx.getIsIncoming());
    MoneroUtils.safeSet(this, this.getNote, this.setNote, tx.getNote());
    MoneroUtils.safeSet(this, this.getSrcAccountIndex, this.setSrcAccountIndex, tx.getSrcAccountIndex());
    MoneroUtils.safeSet(this, this.getSrcSubaddressIndex, this.setSrcSubaddressIndex, tx.getSrcSubaddressIndex());
    MoneroUtils.safeSet(this, this.getSrcAddress, this.setSrcAddress, tx.getSrcAddress());
    MoneroUtils.safeSet(this, this.getIsCoinbase, this.setIsCoinbase, tx.getIsCoinbase());
    MoneroUtils.safeSet(this, this.getBlob, this.setBlob, tx.getBlob());
    MoneroUtils.safeSet(this, this.getMetadata, this.setMetadata, tx.getMetadata());
    
    // merge extensions which need special handling
    if (this.json.totalAmount === undefined) this.json.totalAmount = tx.getTotalAmount();
    else {
      if (mergePayments) assert(totalAmount.toJSValue() === 0);
      else this.json.totalAmount = this.json.totalAmount.add(tx.getTotalAmount());
    }
    if (this.json.payments === undefined) this.setPayments(tx.getPayments());
    else if (tx.getPayments() !== undefined) {
      if (mergePayments) {
        assert(tx.getPayments().length >= 0, "Tx " + tx.getId() + " cannot be merged because payments are different sizes");
        for (let i = 0; i < this.json.payments.length; i++) {
          this.json.payments[i].merge(tx.getPayments()[i]);
        }
      } else {
        for (let payment of tx.getPayments()) {
          this.json.payments.push(payment);
        }
      }
    }
  }
}

module.exports = MoneroTxWallet;