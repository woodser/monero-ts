const assert = require("assert");
const BigInteger = require("../../../external/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroUtils = require("../../utils/MoneroUtils");
const MoneroError = require("../../utils/MoneroError");
const MoneroDestination = require("./MoneroDestination");

/**
 * Models a base transfer of funds to or from the wallet.
 */
class MoneroTransfer {
  
  /**
   * Construct the model.
   * 
   * @param {MoneroTransfer|object} state is existing state to initialize from (optional)
   */
  constructor(state) {
    
    // initialize internal state
    if (!state) state = {};
    else if (state instanceof MoneroTransfer) state = state.toJson();
    else if (typeof state === "object") state = Object.assign({}, state);
    else throw new MoneroError("state must be a MoneroTransfer or JavaScript object");
    this.state = state;
    
    // deserialize fields if necessary
    if (state.amount && !(state.amount instanceof BigInteger)) state.amount = BigInteger.parse(state.amount);
  }
  
  getTx() {
    return this.state.tx;
  }
  
  setTx(tx) {
    this.state.tx = tx;
    return this;
  }
  
  isOutgoing() {
    let isIncoming = this.isIncoming();
    assert(typeof isIncoming === "boolean");
    return !isIncoming;
  }
  
  isIncoming() {
    throw new Error("Subclass must implement");
  }

  getAccountIndex() {
    return this.state.accountIndex;
  }

  setAccountIndex(accountIndex) {
    this.state.accountIndex = accountIndex;
    return this;
  }

  getAmount() {
    return this.state.amount;
  }

  setAmount(amount) {
    this.state.amount = amount;
    return this;
  }
  
  /**
   * Return how many confirmations till it's not economically worth re-writing the chain.
   * That is, the number of confirmations before the transaction is highly unlikely to be
   * double spent or overwritten and may be considered settled, e.g. for a merchant to trust
   * as finalized.
   * 
   * @return Integer is the number of confirmations before it's not worth rewriting the chain
   */
  getNumSuggestedConfirmations() {
    return this.state.numSuggestedConfirmations;
  }
  
  setNumSuggestedConfirmations(numSuggestedConfirmations) {
    this.state.numSuggestedConfirmations = numSuggestedConfirmations;
    return this;
  }
  
  copy() {
    return new MoneroTransfer(this);
  }
  
  toJson() {
    let json = Object.assign({}, this.state);
    if (this.getAmount()) json.amount = this.getAmount().toString()
    delete json.tx; // parent tx is not serialized
    return json;
  }

  /**
   * Updates this transaction by merging the latest information from the given
   * transaction.
   * 
   * Merging can modify or build references to the transfer given so it
   * should not be re-used or it should be copied before calling this method.
   * 
   * @param transfer is the transfer to merge into this one
   */
  merge(transfer) {
    assert(transfer instanceof MoneroTransfer);
    if (this === transfer) return this;
    
    // merge transactions if they're different which comes back to merging transfers
    if (this.getTx() !== transfer.getTx()) this.getTx().merge(transfer.getTx());
    
    // otherwise merge transfer fields
    else {
      this.setAccountIndex(MoneroUtils.reconcile(this.getAccountIndex(), transfer.getAccountIndex()));
      this.setAmount(MoneroUtils.reconcile(this.getAmount(), transfer.getAmount()));
      this.setNumSuggestedConfirmations(MoneroUtils.reconcile(this.getNumSuggestedConfirmations(), transfer.getNumSuggestedConfirmations(), {resolveMax: false}));
    }
    
    return this;
  }
  
  toString(indent = 0) {
    let str = "";
    str += MoneroUtils.kvLine("Is outgoing", this.isOutgoing(), indent);
    str += MoneroUtils.kvLine("Account index", this.getAccountIndex(), indent);
    str += MoneroUtils.kvLine("Amount", this.getAmount() ? this.getAmount().toString() : undefined, indent);
    str += MoneroUtils.kvLine("Num suggested confirmations", this.getNumSuggestedConfirmations(), indent);
    return str.slice(0, str.length - 1);  // strip last newline
  }
}

module.exports = MoneroTransfer;