/**
 * This file combines tx, transfer, and output queries because they directly reference each other.
 */

const assert = require("assert");
const Filter = require("../../utils/Filter");
const MoneroTxWallet = require("../model/MoneroTxWallet");
const MoneroTransfer = require("../model/MoneroTransfer");
const MoneroIncomingTransfer = require("../model/MoneroIncomingTransfer");
const MoneroOutgoingTransfer = require("../model/MoneroOutgoingTransfer");
const MoneroOutputWallet = require("../model/MoneroOutputWallet");

/**
 * Configures a query to retrieve transactions.
 * 
 * All transactions are returned except those that do not meet the criteria defined in this query.
 */
class MoneroTxQuery extends MoneroTxWallet {
  
  /**
   * Constructs the query.
   * 
   * @param state is model state or json to initialize from (optional)
   */
  constructor(state) {
    super(state);
    
    // deserialize if necessary
    if (this.state.transferQuery && !(this.state.transferQuery instanceof MoneroTransferQuery)) this.state.transferQuery = new MoneroTransferQuery(this.state.transferQuery);
    
    // alias 'txId' to txIds
    if (this.state.txId) {
      this.setTxIds([this.state.txId]);
      delete this.state.txId;
    }
  }
  
  copy() {
    return new MoneroTxQuery(this);
  }
  
  isIncoming() {
    return this.state.isIncoming;
  }
  
  setIsIncoming(isIncoming) {
    this.state.isIncoming = isIncoming;
    return this;
  }
  
  isOutgoing() {
    return this.state.isOutgoing;
  }
  
  setIsOutgoing(isOutgoing) {
    this.state.isOutgoing = isOutgoing;
    return this;
  }

  getTxIds() {
    return this.state.txIds;
  }

  setTxIds(txIds) {
    this.state.txIds = txIds;
    return this;
  }
  
  setTxId(txId) {
    if (txId === undefined) return this.setTxIds(undefined);
    assert(typeof txId === "string");
    return this.setTxIds([txId]);
  }
  
  hasPaymentId() {
    return this.state.hasPaymentId;
  }
  
  setHasPaymentId() {
    this.state.hasPaymentId = hasPaymentId;
    return this;
  }
  
  getPaymentIds() {
    return this.state.paymentIds;
  }

  setPaymentIds(paymentIds) {
    this.state.paymentIds = paymentIds;
    return this;
  }
  
  setPaymentId(paymentId) {
    if (paymentId === undefined) return this.setPaymentIds(undefined);
    assert(typeof paymentId === "string");
    return this.setPaymentIds([paymentId]);
  }
  
  getHeight() {
    return this.state.height;
  }
  
  setHeight(height) {
    this.state.height = height;
    return this;
  }
  
  getMinHeight() {
    return this.state.minHeight;
  }

  setMinHeight(minHeight) {
    this.state.minHeight = minHeight;
    return this;
  }

  getMaxHeight() {
    return this.state.maxHeight;
  }

  setMaxHeight(maxHeight) {
    this.state.maxHeight = maxHeight;
    return this;
  }
  
  getIncludeOutputs() {
    return this.state.includeOutputs;
  }

  setIncludeOutputs(includeOutputs) {
    this.state.includeOutputs = includeOutputs;
    return this;
  }
  
  getTransferQuery() {
    return this.state.transferQuery;
  }
  
  setTransferQuery(transferQuery) {
    this.state.transferQuery = transferQuery;
    return this;
  }
  
  getOutputQuery() {
    return this.state.outputQuery;
  }
  
  setOutputQuery(outputQuery) {
    this.state.outputQuery = outputQuery;
    return this;
  }
  
  // TODO: this filtering is not complete
  meetsCriteria(tx) {
    if (!(tx instanceof MoneroTxWallet)) return false;
    
    // filter on tx
    if (this.getId() !== undefined && this.getId() !== tx.getId()) return false;
    if (this.getPaymentId() !== undefined && this.getPaymentId() !== tx.getPaymentId()) return false;
    if (this.isConfirmed() !== undefined && this.isConfirmed() !== tx.isConfirmed()) return false;
    if (this.inTxPool() !== undefined && this.inTxPool() !== tx.inTxPool()) return false;
    if (this.getDoNotRelay() !== undefined && this.getDoNotRelay() !== tx.getDoNotRelay()) return false;
    if (this.isRelayed() !== undefined && this.isRelayed() !== tx.isRelayed()) return false;
    if (this.isFailed() !== undefined && this.isFailed() !== tx.isFailed()) return false;
    if (this.isMinerTx() !== undefined && this.isMinerTx() !== tx.isMinerTx()) return false;
    
    // at least one transfer must meet transfer filter if defined
    if (this.getTransferQuery()) {
      let matchFound = false;
      if (tx.getOutgoingTransfer() && this.getTransferQuery().meetsCriteria(tx.getOutgoingTransfer())) matchFound = true;
      else if (tx.getIncomingTransfers()) {
        for (let incomingTransfer of tx.getIncomingTransfers()) {
          if (this.getTransferQuery().meetsCriteria(incomingTransfer)) {
            matchFound = true;
            break;
          }
        }
      }
      if (!matchFound) return false;
    }
    
    // filter on having a payment id
    if (this.hasPaymentId() !== undefined) {
      if (this.hasPaymentId() && tx.getPaymentId() === undefined) return false;
      if (!this.hasPaymentId() && tx.getPaymentId() !== undefined) return false;
    }
    
    // filter on incoming
    if (this.isIncoming() !== undefined) {
      if (this.isIncoming() && !tx.isIncoming()) return false;
      if (!this.isIncoming() && tx.isIncoming()) return false;
    }
    
    // filter on outgoing
    if (this.isOutgoing() !== undefined) {
      if (this.isOutgoing() && !tx.isOutgoing()) return false;
      if (!this.isOutgoing() && tx.isOutgoing()) return false;
    }
    
    // filter on remaining fields
    let txHeight = tx.getBlock() === undefined ? undefined : tx.getBlock().getHeight();
    if (this.getTxIds() !== undefined && !this.getTxIds().includes(tx.getId())) return false;
    if (this.getPaymentIds() !== undefined && !this.getPaymentIds().includes(tx.getPaymentId())) return false;
    if (this.getHeight() !== undefined && (txHeight === undefined || txHeight !== this.getHeight())) return false;
    if (this.getMinHeight() !== undefined && (txHeight === undefined || txHeight < this.getMinHeight())) return false;
    if (this.getMaxHeight() !== undefined && (txHeight === undefined || txHeight > this.getMaxHeight())) return false;
    
    // transaction meets filter criteria
    return true;
  }
}

/**
 * Configures a query to retrieve transfers.
 * 
 * All transfers are returned except those that do not meet the criteria defined in this query.
 */
class MoneroTransferQuery extends MoneroTransfer {
  
  /**
   * Constructs the query.
   * 
   * @param state is model state or json to initialize from (optional)
   */
  constructor(state) {
    super(state);
    state = this.state;
    
    // deserialize if necessary
    if (state.txQuery && !(state.txQuery instanceof MoneroTxQuery)) state.txQuery = new MoneroTxQuery(state.transferQuery);
    
    // alias isOutgoing to isIncoming
    if (state.isOutgoing !== undefined) state.isIncoming = !state.isOutgoing;
  }
  
  copy() {
    return new MoneroTransferQuery(this);
  }
  
  isIncoming() {
    return this.state.isIncoming;
  }

  setIsIncoming(isIncoming) {
    this.state.isIncoming = isIncoming;
    return this;
  }
  
  isOutgoing() {
    return this.state.isIncoming === undefined ? undefined : !this.state.isIncoming;
  }
  
  setIsOutgoing(isOutgoing) {
    this.state.isIncoming = isOutgoing === undefined ? undefined : !isOutgoing;
    return this;
  }
  
  getAddress() {
    return this.state.address;
  }

  setAddress(address) {
    this.state.address = address;
    return this;
  }
  
  getAddresses() {
    return this.state.addresses;
  }

  setAddresses(addresses) {
    this.state.addresses = addresses;
    return this;
  }
  
  getSubaddressIndex() {
    return this.state.subaddressIndex;
  }
  
  setSubaddressIndex(subaddressIndex) {
    this.state.subaddressIndex = subaddressIndex;
    return this;
  }
  
  getSubaddressIndices() {
    return this.state.subaddressIndices;
  }
  
  setSubaddressIndices(subaddressIndices) {
    this.state.subaddressIndices = subaddressIndices;
    return this;
  }
  
  getDestinations() {
    return this.state.destinations;
  }
  
  setDestinations(destinations) {
    this.state.destinations = destinations;
    return this;
  }
  
  hasDestinations() {
    return this.state.hasDestinations;
  }
  
  setHasDestinations(hasDestinations) {
    this.state.hasDestinations = hasDestinations;
    return this;
  }
  
  getTxQuery() {
    return this.state.txQuery;
  }
  
  setTxQuery(txQuery) {
    this.state.txQuery = txQuery;
    return this;
  }
  
  meetsCriteria(transfer) {
    assert(transfer !== null, "transfer is null");
    assert(transfer instanceof MoneroTransfer);
    
    // filter on common fields
    if (this.isIncoming() !== undefined && this.isIncoming() !== transfer.isIncoming()) return false;
    if (this.isOutgoing() !== undefined && this.isOutgoing() !== transfer.isOutgoing()) return false;
    if (this.getAmount() !== undefined && this.getAmount().compare(transfer.getAmount()) !== 0) return false;
    if (this.getAccountIndex() !== undefined && this.getAccountIndex() !== transfer.getAccountIndex()) return false;
    
    // filter on incoming fields
    if (transfer instanceof MoneroIncomingTransfer) {
      if (this.hasDestinations()) return false;
      if (this.getAddress() !== undefined && this.getAddress() !== transfer.getAddress()) return false;
      if (this.getAddresses() !== undefined && !this.getAddresses().includes(transfer.getAddress())) return false;
      if (this.getSubaddressIndex() !== undefined && this.getSubaddressIndex() !== transfer.getSubaddressIndex()) return false;
      if (this.getSubaddressIndices() !== undefined && !this.getSubaddressIndices().includes(transfer.getSubaddressIndex())) return false;
    }

    // filter on outgoing fields
    else if (transfer instanceof MoneroOutgoingTransfer) {
      
      // filter on addresses which must have overlap
      if (this.getAddress() !== undefined && (transfer.getAddresses() === undefined || !transfer.getAddresses().includes(this.getAddress()))) return false;   // TODO: will filter all transfers that don't contain addresses (outgoing txs might not have this field initialized)
      if (this.getAddresses() !== undefined) {
        if (!transfer.getAddresses()) return false;
        if (!this.getAddresses().some(address => transfer.getAddresses().includes(address))) return false;
      }
      
      // filter on subaddress indices
      if (this.getSubaddressIndex() !== undefined && (transfer.getSubaddressIndices() === undefined || !transfer.getSubaddressIndices().includes(this.getSubaddressIndex()))) return false;
      if (this.getSubaddressIndices() !== undefined) {
        if (!transfer.getSubaddressIndices()) return false;
        if (!this.getSubaddressIndices().some(subaddressIdx => transfer.getSubaddressIndices().includes(subaddressIdx))) return false;
      }
      
      // filter on having destinations
      if (this.hasDestinations() !== undefined) {
        if (this.hasDestinations() && transfer.getDestinations() === undefined) return false;
        if (!this.hasDestinations() && transfer.getDestinations() !== undefined) return false;
      }
      
      // filter on destinations TODO: start with test for this
//    if (this.getDestionations() !== undefined && this.getDestionations() !== transfer.getDestionations()) return false;
    }
    
    // otherwise invalid type
    else throw new Error("Transfer must be MoneroIncomingTransfer or MoneroOutgoingTransfer");
    
    // filter with tx filter
    if (this.getTxQuery() !== undefined && !this.getTxQuery().meetsCriteria(transfer.getTx())) return false;    
    return true;
  }
}

/**
 * Configures a query to retrieve wallet outputs (i.e. outputs that the wallet has or had the
 * ability to spend).
 * 
 * All outputs are returned except those that do not meet the criteria defined in this query.
 */
class MoneroOutputQuery extends MoneroOutputWallet {
  
  /**
   * Constructs the query.
   * 
   * @param state is model state or json to initialize from (optional)
   */
  constructor(state) {
    super(state);
    
    // deserialize if necessary
    if (this.state.txQuery && !(this.state.txQuery instanceof MoneroTxQuery)) this.state.txQuery = new MoneroTxQuery(this.state.transferQuery);
  }
  
  copy() {
    return new MoneroOutputQuery(this);
  }
  
  getSubaddressIndices() {
    return this.state.subaddressIndices;
  }
  
  setSubaddressIndices(subaddressIndices) {
    this.state.subaddressIndices = subaddressIndices;
    return this;
  }
  
  getTxQuery() {
    return this.state.txQuery;
  }
  
  setTxQuery(txQuery) {
    this.state.txQuery = txQuery;
    return this;
  }
  
  meetsCriteria(output) {
    if (!(output instanceof MoneroOutputWallet)) return false;
    
    // filter on output
    if (this.getAccountIndex() !== undefined && this.getAccountIndex() !== output.getAccountIndex()) return false;
    if (this.getSubaddressIndex() !== undefined && this.getSubaddressIndex() !== output.getSubaddressIndex()) return false;
    if (this.getAmount() !== undefined && this.getAmount().compare(output.getAmount()) !== 0) return false;
    if (this.isSpent() != undefined && this.isSpent() !== output.isSpent()) return false;
    if (this.isUnlocked() !== undefined && this.isUnlocked() !== output.isUnlocked()) return false;
    
    // filter on output's key image
    if (this.getKeyImage() !== undefined) {
      if (output.getKeyImage() === undefined) return false;
      if (this.getKeyImage().getHex() !== undefined && this.getKeyImage().getHex() !== output.getKeyImage().getHex()) return false;
      if (this.getKeyImage().getSignature() !== undefined && this.getKeyImage().getSignature() !== output.getKeyImage().getSignature()) return false;
    }
    
    // filter on extensions
    if (this.getSubaddressIndices() !== undefined && !this.getSubaddressIndices().includes(output.getSubaddressIndex())) return false;
    
    // filter with tx query
    if (this.getTxQuery() && !this.getTxQuery().meetsCriteria(output.getTx())) return false;
    
    // output meets query
    return true;
  }
}

module.exports = { MoneroTxQuery, MoneroTransferQuery, MoneroOutputQuery };