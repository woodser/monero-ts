"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _assert = _interopRequireDefault(require("assert"));




var _MoneroOutputQuery = _interopRequireDefault(require("./MoneroOutputQuery"));
var _MoneroTransferQuery = _interopRequireDefault(require("./MoneroTransferQuery"));

var _MoneroTxWallet = _interopRequireDefault(require("./MoneroTxWallet"));

/**
 * <p>Configuration to query transactions.</p>
 */
class MoneroTxQuery extends _MoneroTxWallet.default {























  /**
   * <p>Construct the transaction query.</p>
   * 
   * <p>Example:</p>
   * 
   * <code>
   * &sol;&sol; get transactions with unlocked incoming transfers to account 0<br>
   * let txs = await wallet.getTxs({<br>
   * &nbsp;&nbsp; isLocked: false,<br>
   * &nbsp;&nbsp; transferQuery: {<br>
   * &nbsp;&nbsp;&nbsp;&nbsp; isIncoming: true,<br>
   * &nbsp;&nbsp;&nbsp;&nbsp; accountIndex: 0<br>
   * &nbsp;&nbsp; }<br>
   * });
   * </code>
   * 
   * <p>All configuration is optional.  All transactions are returned except those that don't meet criteria defined in this query.</p>
   * 
   * @param {MoneroTxQuery} [query] - tx query configuration
   * @param {string} [query.hash] - get a tx with this hash
   * @param {string[]} [query.txHashes] - get txs with these hashes
   * @param {number} [query.height] - get txs with this height
   * @param {number} [query.minHeight] - get txs with height greater than or equal to this height
   * @param {number} [query.maxHeight] - get txs with height less than or equal to this height
   * @param {boolean} [query.isConfirmed] - get confirmed or unconfirmed txs
   * @param {boolean} [query.inTxPool] - get txs in or out of the tx pool
   * @param {boolean} [query.relay] - get txs with the same relay status
   * @param {boolean} [query.isRelayed] - get relayed or non-relayed txs
   * @param {boolean} [query.isFailed] - get failed or non-failed txs
   * @param {boolean} [query.isMinerTx] - get miner or non-miner txs
   * @param {boolean} [query.isLocked] - get locked or unlocked txs
   * @param {boolean} [query.isIncoming] - get txs with or without incoming transfers
   * @param {boolean} [query.isOutgoing] - get txs with or without outgoing transfers
   * @param {string} [query.paymentId] - get txs with this payment ID
   * @param {string} [query.paymentIds] - get txs with a payment ID among these payment IDs
   * @param {boolean} [query.hasPaymentId] - get txs with or without payment IDs
   * @param {Partial<MoneroTransferQuery>} [query.transferQuery] - get txs with transfers matching this transfer query
   * @param {Partial<MoneroOutputQuery>} [query.inputQuery] - get txs with inputs matching this input query
   * @param {Partial<MoneroOutputQuery>} [query.outputQuery] - get txs with outputs matching this output query
   */
  constructor(query) {
    super(query);

    // copy queries
    if (this.transferQuery) this.transferQuery = new _MoneroTransferQuery.default(this.transferQuery);
    if (this.inputQuery) this.inputQuery = new _MoneroOutputQuery.default(this.inputQuery);
    if (this.outputQuery) this.outputQuery = new _MoneroOutputQuery.default(this.outputQuery);

    // link cycles
    if (this.transferQuery) this.getTransferQuery().setTxQuery(this);
    if (this.inputQuery) this.getInputQuery().setTxQuery(this);
    if (this.outputQuery) this.getOutputQuery().setTxQuery(this);

    // alias 'hash' to hashes
    if (this.hash) {
      this.setHashes([this.hash]);
      delete this.hash;
    }
  }

  copy() {
    return new MoneroTxQuery(this);
  }

  toJson() {
    let json = Object.assign({}, this, super.toJson()); // merge json onto inherited state
    if (this.getTransferQuery() !== undefined) json.transferQuery = this.getTransferQuery().toJson();
    if (this.getInputQuery() !== undefined) json.inputQuery = this.getInputQuery().toJson();
    if (this.getOutputQuery() !== undefined) json.outputQuery = this.getOutputQuery().toJson();
    delete json.block; // do not serialize parent block
    return json;
  }

  getIsIncoming() {
    return this.isIncoming;
  }

  setIsIncoming(isIncoming) {
    this.isIncoming = isIncoming;
    return this;
  }

  getIsOutgoing() {
    return this.isOutgoing;
  }

  setIsOutgoing(isOutgoing) {
    this.isOutgoing = isOutgoing;
    return this;
  }

  getHashes() {
    return this.hashes;
  }

  setHashes(hashes) {
    this.hashes = hashes;
    return this;
  }

  setHash(hash) {
    if (hash === undefined) return this.setHashes(undefined);
    (0, _assert.default)(typeof hash === "string");
    return this.setHashes([hash]);
  }

  getHasPaymentId() {
    return this.hasPaymentId;
  }

  setHasPaymentId(hasPaymentId) {
    this.hasPaymentId = hasPaymentId;
    return this;
  }

  getPaymentIds() {
    return this.paymentIds;
  }

  setPaymentIds(paymentIds) {
    this.paymentIds = paymentIds;
    return this;
  }

  setPaymentId(paymentId) {
    if (paymentId === undefined) return this.setPaymentIds(undefined);
    (0, _assert.default)(typeof paymentId === "string");
    return this.setPaymentIds([paymentId]);
  }

  getHeight() {
    return this.height;
  }

  setHeight(height) {
    this.height = height;
    return this;
  }

  getMinHeight() {
    return this.minHeight;
  }

  setMinHeight(minHeight) {
    this.minHeight = minHeight;
    return this;
  }

  getMaxHeight() {
    return this.maxHeight;
  }

  setMaxHeight(maxHeight) {
    this.maxHeight = maxHeight;
    return this;
  }

  getIncludeOutputs() {
    return this.includeOutputs;
  }

  setIncludeOutputs(includeOutputs) {
    this.includeOutputs = includeOutputs;
    return this;
  }

  getTransferQuery() {
    return this.transferQuery;
  }

  setTransferQuery(transferQuery) {
    this.transferQuery = transferQuery === undefined ? undefined : transferQuery instanceof _MoneroTransferQuery.default ? transferQuery : new _MoneroTransferQuery.default(transferQuery);
    if (transferQuery) this.transferQuery.txQuery = this;
    return this;
  }

  getInputQuery() {
    return this.inputQuery;
  }

  setInputQuery(inputQuery) {
    this.inputQuery = inputQuery;
    if (inputQuery) inputQuery.txQuery = this;
    return this;
  }

  getOutputQuery() {
    return this.outputQuery;
  }

  setOutputQuery(outputQuery) {
    this.outputQuery = outputQuery === undefined ? undefined : outputQuery instanceof _MoneroOutputQuery.default ? outputQuery : new _MoneroOutputQuery.default(outputQuery);
    if (outputQuery) this.outputQuery.txQuery = this;
    return this;
  }

  meetsCriteria(tx, queryChildren) {
    if (!(tx instanceof _MoneroTxWallet.default)) throw new Error("Tx not given to MoneroTxQuery.meetsCriteria(tx)");
    if (queryChildren === undefined) queryChildren = true;

    // filter on tx
    if (this.getHash() !== undefined && this.getHash() !== tx.getHash()) return false;
    if (this.getPaymentId() !== undefined && this.getPaymentId() !== tx.getPaymentId()) return false;
    if (this.getIsConfirmed() !== undefined && this.getIsConfirmed() !== tx.getIsConfirmed()) return false;
    if (this.getInTxPool() !== undefined && this.getInTxPool() !== tx.getInTxPool()) return false;
    if (this.getRelay() !== undefined && this.getRelay() !== tx.getRelay()) return false;
    if (this.getIsRelayed() !== undefined && this.getIsRelayed() !== tx.getIsRelayed()) return false;
    if (this.getIsFailed() !== undefined && this.getIsFailed() !== tx.getIsFailed()) return false;
    if (this.getIsMinerTx() !== undefined && this.getIsMinerTx() !== tx.getIsMinerTx()) return false;
    if (this.getIsLocked() !== undefined && this.getIsLocked() !== tx.getIsLocked()) return false;

    // filter on having a payment id
    if (this.getHasPaymentId() !== undefined) {
      if (this.getHasPaymentId() && tx.getPaymentId() === undefined) return false;
      if (!this.getHasPaymentId() && tx.getPaymentId() !== undefined) return false;
    }

    // filter on incoming
    if (this.getIsIncoming() !== undefined) {
      if (this.getIsIncoming() && !tx.getIsIncoming()) return false;
      if (!this.getIsIncoming() && tx.getIsIncoming()) return false;
    }

    // filter on outgoing
    if (this.getIsOutgoing() !== undefined) {
      if (this.getIsOutgoing() && !tx.getIsOutgoing()) return false;
      if (!this.getIsOutgoing() && tx.getIsOutgoing()) return false;
    }

    // filter on remaining fields
    let txHeight = tx.getBlock() === undefined ? undefined : tx.getBlock().getHeight();
    if (this.getHashes() !== undefined && !this.getHashes().includes(tx.getHash())) return false;
    if (this.getPaymentIds() !== undefined && !this.getPaymentIds().includes(tx.getPaymentId())) return false;
    if (this.getHeight() !== undefined && (txHeight === undefined || txHeight !== this.getHeight())) return false;
    if (this.getMinHeight() !== undefined && txHeight !== undefined && txHeight < this.getMinHeight()) return false; // do not filter unconfirmed
    if (this.getMaxHeight() !== undefined && (txHeight === undefined || txHeight > this.getMaxHeight())) return false;
    // TODO: filtering not complete

    // done if not querying transfers or outputs
    if (!queryChildren) return true;

    // at least one transfer must meet transfer filter if defined
    if (this.getTransferQuery() !== undefined) {
      let matchFound = false;
      if (tx.getOutgoingTransfer() && this.getTransferQuery().meetsCriteria(tx.getOutgoingTransfer(), false)) matchFound = true;else
      if (tx.getIncomingTransfers()) {
        for (let incomingTransfer of tx.getIncomingTransfers()) {
          if (this.getTransferQuery().meetsCriteria(incomingTransfer, false)) {
            matchFound = true;
            break;
          }
        }
      }
      if (!matchFound) return false;
    }

    // at least one input must meet input query if defined
    if (this.getInputQuery() !== undefined) {
      if (tx.getInputs() === undefined || tx.getInputs().length === 0) return false;
      let matchFound = false;
      for (let input of tx.getInputsWallet()) {
        if (this.getInputQuery().meetsCriteria(input, false)) {
          matchFound = true;
          break;
        }
      }
      if (!matchFound) return false;
    }

    // at least one output must meet output query if defined
    if (this.getOutputQuery() !== undefined) {
      if (tx.getOutputs() === undefined || tx.getOutputs().length === 0) return false;
      let matchFound = false;
      for (let output of tx.getOutputsWallet()) {
        if (this.getOutputQuery().meetsCriteria(output, false)) {
          matchFound = true;
          break;
        }
      }
      if (!matchFound) return false;
    }

    return true; // transaction meets filter criteria
  }

  // ------------------- OVERRIDE CO-VARIANT RETURN TYPES ---------------------

  setIncomingTransfers(incomingTransfers) {
    super.setIncomingTransfers(incomingTransfers);
    return this;
  }

  setOutgoingTransfer(outgoingTransfer) {
    super.setOutgoingTransfer(outgoingTransfer);
    return this;
  }

  setOutputs(outputs) {
    super.setOutputs(outputs);
    return this;
  }

  setNote(note) {
    super.setNote(note);
    return this;
  }

  setIsLocked(isLocked) {
    super.setIsLocked(isLocked);
    return this;
  }

  setBlock(block) {
    super.setBlock(block);
    return this;
  }

  setVersion(version) {
    super.setVersion(version);
    return this;
  }

  setIsMinerTx(isMinerTx) {
    super.setIsMinerTx(isMinerTx);
    return this;
  }

  setFee(fee) {
    super.setFee(fee);
    return this;
  }

  setRingSize(ringSize) {
    super.setRingSize(ringSize);
    return this;
  }

  setRelay(relay) {
    super.setRelay(relay);
    return this;
  }

  setIsRelayed(isRelayed) {
    super.setIsRelayed(isRelayed);
    return this;
  }

  setIsConfirmed(isConfirmed) {
    super.setIsConfirmed(isConfirmed);
    return this;
  }

  setInTxPool(inTxPool) {
    super.setInTxPool(inTxPool);
    return this;
  }

  setNumConfirmations(numConfirmations) {
    super.setNumConfirmations(numConfirmations);
    return this;
  }

  setUnlockTime(unlockTime) {
    super.setUnlockTime(unlockTime);
    return this;
  }

  setLastRelayedTimestamp(lastRelayedTimestamp) {
    super.setLastRelayedTimestamp(lastRelayedTimestamp);
    return this;
  }

  setReceivedTimestamp(receivedTimestamp) {
    super.setReceivedTimestamp(receivedTimestamp);
    return this;
  }

  setIsDoubleSpendSeen(isDoubleSpendSeen) {
    super.setIsDoubleSpendSeen(isDoubleSpendSeen);
    return this;
  }

  setKey(key) {
    super.setKey(key);
    return this;
  }

  setFullHex(hex) {
    super.setFullHex(hex);
    return this;
  }

  setPrunedHex(prunedHex) {
    super.setPrunedHex(prunedHex);
    return this;
  }

  setPrunableHex(prunableHex) {
    super.setPrunableHex(prunableHex);
    return this;
  }

  setPrunableHash(prunableHash) {
    super.setPrunableHash(prunableHash);
    return this;
  }

  setSize(size) {
    super.setSize(size);
    return this;
  }

  setWeight(weight) {
    super.setWeight(weight);
    return this;
  }

  setInputs(inputs) {
    super.setInputs(inputs);
    return this;
  }

  setOutputIndices(outputIndices) {
    super.setOutputIndices(outputIndices);
    return this;
  }

  setMetadata(metadata) {
    super.setMetadata(metadata);
    return this;
  }

  setTxSet(txSet) {
    super.setTxSet(txSet);
    return this;
  }

  setExtra(extra) {
    super.setExtra(extra);
    return this;
  }

  setRctSignatures(rctSignatures) {
    super.setRctSignatures(rctSignatures);
    return this;
  }

  setRctSigPrunable(rctSigPrunable) {
    super.setRctSigPrunable(rctSigPrunable);
    return this;
  }

  setIsKeptByBlock(isKeptByBlock) {
    super.setIsKeptByBlock(isKeptByBlock);
    return this;
  }

  setIsFailed(isFailed) {
    super.setIsFailed(isFailed);
    return this;
  }

  setLastFailedHeight(lastFailedHeight) {
    super.setLastFailedHeight(lastFailedHeight);
    return this;
  }

  setLastFailedHash(lastFailedId) {
    super.setLastFailedHash(lastFailedId);
    return this;
  }

  setMaxUsedBlockHeight(maxUsedBlockHeight) {
    super.setMaxUsedBlockHeight(maxUsedBlockHeight);
    return this;
  }

  setMaxUsedBlockHash(maxUsedBlockId) {
    super.setMaxUsedBlockHash(maxUsedBlockId);
    return this;
  }

  setSignatures(signatures) {
    super.setSignatures(signatures);
    return this;
  }
}exports.default = MoneroTxQuery;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfTW9uZXJvT3V0cHV0UXVlcnkiLCJfTW9uZXJvVHJhbnNmZXJRdWVyeSIsIl9Nb25lcm9UeFdhbGxldCIsIk1vbmVyb1R4UXVlcnkiLCJNb25lcm9UeFdhbGxldCIsImNvbnN0cnVjdG9yIiwicXVlcnkiLCJ0cmFuc2ZlclF1ZXJ5IiwiTW9uZXJvVHJhbnNmZXJRdWVyeSIsImlucHV0UXVlcnkiLCJNb25lcm9PdXRwdXRRdWVyeSIsIm91dHB1dFF1ZXJ5IiwiZ2V0VHJhbnNmZXJRdWVyeSIsInNldFR4UXVlcnkiLCJnZXRJbnB1dFF1ZXJ5IiwiZ2V0T3V0cHV0UXVlcnkiLCJoYXNoIiwic2V0SGFzaGVzIiwiY29weSIsInRvSnNvbiIsImpzb24iLCJPYmplY3QiLCJhc3NpZ24iLCJ1bmRlZmluZWQiLCJibG9jayIsImdldElzSW5jb21pbmciLCJpc0luY29taW5nIiwic2V0SXNJbmNvbWluZyIsImdldElzT3V0Z29pbmciLCJpc091dGdvaW5nIiwic2V0SXNPdXRnb2luZyIsImdldEhhc2hlcyIsImhhc2hlcyIsInNldEhhc2giLCJhc3NlcnQiLCJnZXRIYXNQYXltZW50SWQiLCJoYXNQYXltZW50SWQiLCJzZXRIYXNQYXltZW50SWQiLCJnZXRQYXltZW50SWRzIiwicGF5bWVudElkcyIsInNldFBheW1lbnRJZHMiLCJzZXRQYXltZW50SWQiLCJwYXltZW50SWQiLCJnZXRIZWlnaHQiLCJoZWlnaHQiLCJzZXRIZWlnaHQiLCJnZXRNaW5IZWlnaHQiLCJtaW5IZWlnaHQiLCJzZXRNaW5IZWlnaHQiLCJnZXRNYXhIZWlnaHQiLCJtYXhIZWlnaHQiLCJzZXRNYXhIZWlnaHQiLCJnZXRJbmNsdWRlT3V0cHV0cyIsImluY2x1ZGVPdXRwdXRzIiwic2V0SW5jbHVkZU91dHB1dHMiLCJzZXRUcmFuc2ZlclF1ZXJ5IiwidHhRdWVyeSIsInNldElucHV0UXVlcnkiLCJzZXRPdXRwdXRRdWVyeSIsIm1lZXRzQ3JpdGVyaWEiLCJ0eCIsInF1ZXJ5Q2hpbGRyZW4iLCJFcnJvciIsImdldEhhc2giLCJnZXRQYXltZW50SWQiLCJnZXRJc0NvbmZpcm1lZCIsImdldEluVHhQb29sIiwiZ2V0UmVsYXkiLCJnZXRJc1JlbGF5ZWQiLCJnZXRJc0ZhaWxlZCIsImdldElzTWluZXJUeCIsImdldElzTG9ja2VkIiwidHhIZWlnaHQiLCJnZXRCbG9jayIsImluY2x1ZGVzIiwibWF0Y2hGb3VuZCIsImdldE91dGdvaW5nVHJhbnNmZXIiLCJnZXRJbmNvbWluZ1RyYW5zZmVycyIsImluY29taW5nVHJhbnNmZXIiLCJnZXRJbnB1dHMiLCJsZW5ndGgiLCJpbnB1dCIsImdldElucHV0c1dhbGxldCIsImdldE91dHB1dHMiLCJvdXRwdXQiLCJnZXRPdXRwdXRzV2FsbGV0Iiwic2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJpbmNvbWluZ1RyYW5zZmVycyIsInNldE91dGdvaW5nVHJhbnNmZXIiLCJvdXRnb2luZ1RyYW5zZmVyIiwic2V0T3V0cHV0cyIsIm91dHB1dHMiLCJzZXROb3RlIiwibm90ZSIsInNldElzTG9ja2VkIiwiaXNMb2NrZWQiLCJzZXRCbG9jayIsInNldFZlcnNpb24iLCJ2ZXJzaW9uIiwic2V0SXNNaW5lclR4IiwiaXNNaW5lclR4Iiwic2V0RmVlIiwiZmVlIiwic2V0UmluZ1NpemUiLCJyaW5nU2l6ZSIsInNldFJlbGF5IiwicmVsYXkiLCJzZXRJc1JlbGF5ZWQiLCJpc1JlbGF5ZWQiLCJzZXRJc0NvbmZpcm1lZCIsImlzQ29uZmlybWVkIiwic2V0SW5UeFBvb2wiLCJpblR4UG9vbCIsInNldE51bUNvbmZpcm1hdGlvbnMiLCJudW1Db25maXJtYXRpb25zIiwic2V0VW5sb2NrVGltZSIsInVubG9ja1RpbWUiLCJzZXRMYXN0UmVsYXllZFRpbWVzdGFtcCIsImxhc3RSZWxheWVkVGltZXN0YW1wIiwic2V0UmVjZWl2ZWRUaW1lc3RhbXAiLCJyZWNlaXZlZFRpbWVzdGFtcCIsInNldElzRG91YmxlU3BlbmRTZWVuIiwiaXNEb3VibGVTcGVuZFNlZW4iLCJzZXRLZXkiLCJrZXkiLCJzZXRGdWxsSGV4IiwiaGV4Iiwic2V0UHJ1bmVkSGV4IiwicHJ1bmVkSGV4Iiwic2V0UHJ1bmFibGVIZXgiLCJwcnVuYWJsZUhleCIsInNldFBydW5hYmxlSGFzaCIsInBydW5hYmxlSGFzaCIsInNldFNpemUiLCJzaXplIiwic2V0V2VpZ2h0Iiwid2VpZ2h0Iiwic2V0SW5wdXRzIiwiaW5wdXRzIiwic2V0T3V0cHV0SW5kaWNlcyIsIm91dHB1dEluZGljZXMiLCJzZXRNZXRhZGF0YSIsIm1ldGFkYXRhIiwic2V0VHhTZXQiLCJ0eFNldCIsInNldEV4dHJhIiwiZXh0cmEiLCJzZXRSY3RTaWduYXR1cmVzIiwicmN0U2lnbmF0dXJlcyIsInNldFJjdFNpZ1BydW5hYmxlIiwicmN0U2lnUHJ1bmFibGUiLCJzZXRJc0tlcHRCeUJsb2NrIiwiaXNLZXB0QnlCbG9jayIsInNldElzRmFpbGVkIiwiaXNGYWlsZWQiLCJzZXRMYXN0RmFpbGVkSGVpZ2h0IiwibGFzdEZhaWxlZEhlaWdodCIsInNldExhc3RGYWlsZWRIYXNoIiwibGFzdEZhaWxlZElkIiwic2V0TWF4VXNlZEJsb2NrSGVpZ2h0IiwibWF4VXNlZEJsb2NrSGVpZ2h0Iiwic2V0TWF4VXNlZEJsb2NrSGFzaCIsIm1heFVzZWRCbG9ja0lkIiwic2V0U2lnbmF0dXJlcyIsInNpZ25hdHVyZXMiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9UeFF1ZXJ5LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuLi8uLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9PdXRwdXQgZnJvbSBcIi4uLy4uL2RhZW1vbi9tb2RlbC9Nb25lcm9PdXRwdXRcIjtcbmltcG9ydCBNb25lcm9JbmNvbWluZ1RyYW5zZmVyIGZyb20gXCIuL01vbmVyb0luY29taW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9PdXRnb2luZ1RyYW5zZmVyIGZyb20gXCIuL01vbmVyb091dGdvaW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRRdWVyeSBmcm9tIFwiLi9Nb25lcm9PdXRwdXRRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyUXVlcnkgZnJvbSBcIi4vTW9uZXJvVHJhbnNmZXJRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4U2V0IGZyb20gXCIuL01vbmVyb1R4U2V0XCI7XG5pbXBvcnQgTW9uZXJvVHhXYWxsZXQgZnJvbSBcIi4vTW9uZXJvVHhXYWxsZXRcIjtcblxuLyoqXG4gKiA8cD5Db25maWd1cmF0aW9uIHRvIHF1ZXJ5IHRyYW5zYWN0aW9ucy48L3A+XG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vbmVyb1R4UXVlcnkgZXh0ZW5kcyBNb25lcm9UeFdhbGxldCB7XG5cbiAgaGFzaDogc3RyaW5nO1xuICBoYXNoZXM6IHN0cmluZ1tdO1xuICBoZWlnaHQ6IG51bWJlcjtcbiAgbWluSGVpZ2h0OiBudW1iZXI7XG4gIG1heEhlaWdodDogbnVtYmVyO1xuICBpbmNsdWRlT3V0cHV0czogYm9vbGVhbjtcbiAgaXNDb25maXJtZWQ6IGJvb2xlYW47XG4gIGluVHhQb29sOiBib29sZWFuO1xuICByZWxheTogYm9vbGVhbjtcbiAgaXNSZWxheWVkOiBib29sZWFuO1xuICBpc0ZhaWxlZDogYm9vbGVhbjtcbiAgaXNNaW5lclR4OiBib29sZWFuO1xuICBpc0xvY2tlZDogYm9vbGVhbjtcbiAgaXNJbmNvbWluZzogYm9vbGVhbjtcbiAgaXNPdXRnb2luZzogYm9vbGVhbjtcbiAgcGF5bWVudElkOiBzdHJpbmc7XG4gIHBheW1lbnRJZHM6IHN0cmluZ1tdO1xuICBoYXNQYXltZW50SWQ6IGJvb2xlYW47XG4gIHRyYW5zZmVyUXVlcnk6IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT47XG4gIGlucHV0UXVlcnk6IFBhcnRpYWw8TW9uZXJvT3V0cHV0UXVlcnk+O1xuICBvdXRwdXRRdWVyeTogUGFydGlhbDxNb25lcm9PdXRwdXRRdWVyeT47XG5cbiAgLyoqXG4gICAqIDxwPkNvbnN0cnVjdCB0aGUgdHJhbnNhY3Rpb24gcXVlcnkuPC9wPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZTo8L3A+XG4gICAqIFxuICAgKiA8Y29kZT5cbiAgICogJnNvbDsmc29sOyBnZXQgdHJhbnNhY3Rpb25zIHdpdGggdW5sb2NrZWQgaW5jb21pbmcgdHJhbnNmZXJzIHRvIGFjY291bnQgMDxicj5cbiAgICogbGV0IHR4cyA9IGF3YWl0IHdhbGxldC5nZXRUeHMoezxicj5cbiAgICogJm5ic3A7Jm5ic3A7IGlzTG9ja2VkOiBmYWxzZSw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyB0cmFuc2ZlclF1ZXJ5OiB7PGJyPlxuICAgKiAmbmJzcDsmbmJzcDsmbmJzcDsmbmJzcDsgaXNJbmNvbWluZzogdHJ1ZSw8YnI+XG4gICAqICZuYnNwOyZuYnNwOyZuYnNwOyZuYnNwOyBhY2NvdW50SW5kZXg6IDA8YnI+XG4gICAqICZuYnNwOyZuYnNwOyB9PGJyPlxuICAgKiB9KTtcbiAgICogPC9jb2RlPlxuICAgKiBcbiAgICogPHA+QWxsIGNvbmZpZ3VyYXRpb24gaXMgb3B0aW9uYWwuICBBbGwgdHJhbnNhY3Rpb25zIGFyZSByZXR1cm5lZCBleGNlcHQgdGhvc2UgdGhhdCBkb24ndCBtZWV0IGNyaXRlcmlhIGRlZmluZWQgaW4gdGhpcyBxdWVyeS48L3A+XG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4UXVlcnl9IFtxdWVyeV0gLSB0eCBxdWVyeSBjb25maWd1cmF0aW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcXVlcnkuaGFzaF0gLSBnZXQgYSB0eCB3aXRoIHRoaXMgaGFzaFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBbcXVlcnkudHhIYXNoZXNdIC0gZ2V0IHR4cyB3aXRoIHRoZXNlIGhhc2hlc1xuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LmhlaWdodF0gLSBnZXQgdHhzIHdpdGggdGhpcyBoZWlnaHRcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5taW5IZWlnaHRdIC0gZ2V0IHR4cyB3aXRoIGhlaWdodCBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gdGhpcyBoZWlnaHRcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5tYXhIZWlnaHRdIC0gZ2V0IHR4cyB3aXRoIGhlaWdodCBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gdGhpcyBoZWlnaHRcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNDb25maXJtZWRdIC0gZ2V0IGNvbmZpcm1lZCBvciB1bmNvbmZpcm1lZCB0eHNcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaW5UeFBvb2xdIC0gZ2V0IHR4cyBpbiBvciBvdXQgb2YgdGhlIHR4IHBvb2xcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkucmVsYXldIC0gZ2V0IHR4cyB3aXRoIHRoZSBzYW1lIHJlbGF5IHN0YXR1c1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc1JlbGF5ZWRdIC0gZ2V0IHJlbGF5ZWQgb3Igbm9uLXJlbGF5ZWQgdHhzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzRmFpbGVkXSAtIGdldCBmYWlsZWQgb3Igbm9uLWZhaWxlZCB0eHNcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNNaW5lclR4XSAtIGdldCBtaW5lciBvciBub24tbWluZXIgdHhzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzTG9ja2VkXSAtIGdldCBsb2NrZWQgb3IgdW5sb2NrZWQgdHhzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzSW5jb21pbmddIC0gZ2V0IHR4cyB3aXRoIG9yIHdpdGhvdXQgaW5jb21pbmcgdHJhbnNmZXJzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzT3V0Z29pbmddIC0gZ2V0IHR4cyB3aXRoIG9yIHdpdGhvdXQgb3V0Z29pbmcgdHJhbnNmZXJzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcXVlcnkucGF5bWVudElkXSAtIGdldCB0eHMgd2l0aCB0aGlzIHBheW1lbnQgSURcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtxdWVyeS5wYXltZW50SWRzXSAtIGdldCB0eHMgd2l0aCBhIHBheW1lbnQgSUQgYW1vbmcgdGhlc2UgcGF5bWVudCBJRHNcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaGFzUGF5bWVudElkXSAtIGdldCB0eHMgd2l0aCBvciB3aXRob3V0IHBheW1lbnQgSURzXG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pn0gW3F1ZXJ5LnRyYW5zZmVyUXVlcnldIC0gZ2V0IHR4cyB3aXRoIHRyYW5zZmVycyBtYXRjaGluZyB0aGlzIHRyYW5zZmVyIHF1ZXJ5XG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9PdXRwdXRRdWVyeT59IFtxdWVyeS5pbnB1dFF1ZXJ5XSAtIGdldCB0eHMgd2l0aCBpbnB1dHMgbWF0Y2hpbmcgdGhpcyBpbnB1dCBxdWVyeVxuICAgKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvT3V0cHV0UXVlcnk+fSBbcXVlcnkub3V0cHV0UXVlcnldIC0gZ2V0IHR4cyB3aXRoIG91dHB1dHMgbWF0Y2hpbmcgdGhpcyBvdXRwdXQgcXVlcnlcbiAgICovXG4gIGNvbnN0cnVjdG9yKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9UeFF1ZXJ5Pikge1xuICAgIHN1cGVyKHF1ZXJ5KTtcbiAgICBcbiAgICAvLyBjb3B5IHF1ZXJpZXNcbiAgICBpZiAodGhpcy50cmFuc2ZlclF1ZXJ5KSB0aGlzLnRyYW5zZmVyUXVlcnkgPSBuZXcgTW9uZXJvVHJhbnNmZXJRdWVyeSh0aGlzLnRyYW5zZmVyUXVlcnkpO1xuICAgIGlmICh0aGlzLmlucHV0UXVlcnkpIHRoaXMuaW5wdXRRdWVyeSA9IG5ldyBNb25lcm9PdXRwdXRRdWVyeSh0aGlzLmlucHV0UXVlcnkpO1xuICAgIGlmICh0aGlzLm91dHB1dFF1ZXJ5KSB0aGlzLm91dHB1dFF1ZXJ5ID0gbmV3IE1vbmVyb091dHB1dFF1ZXJ5KHRoaXMub3V0cHV0UXVlcnkpO1xuICAgIFxuICAgIC8vIGxpbmsgY3ljbGVzXG4gICAgaWYgKHRoaXMudHJhbnNmZXJRdWVyeSkgdGhpcy5nZXRUcmFuc2ZlclF1ZXJ5KCkuc2V0VHhRdWVyeSh0aGlzKTtcbiAgICBpZiAodGhpcy5pbnB1dFF1ZXJ5KSB0aGlzLmdldElucHV0UXVlcnkoKS5zZXRUeFF1ZXJ5KHRoaXMpO1xuICAgIGlmICh0aGlzLm91dHB1dFF1ZXJ5KSB0aGlzLmdldE91dHB1dFF1ZXJ5KCkuc2V0VHhRdWVyeSh0aGlzKTtcbiAgICBcbiAgICAvLyBhbGlhcyAnaGFzaCcgdG8gaGFzaGVzXG4gICAgaWYgKHRoaXMuaGFzaCkge1xuICAgICAgdGhpcy5zZXRIYXNoZXMoW3RoaXMuaGFzaF0pO1xuICAgICAgZGVsZXRlIHRoaXMuaGFzaDtcbiAgICB9XG4gIH1cbiAgXG4gIGNvcHkoKTogTW9uZXJvVHhRdWVyeSB7XG4gICAgcmV0dXJuIG5ldyBNb25lcm9UeFF1ZXJ5KHRoaXMpO1xuICB9XG4gIFxuICB0b0pzb24oKTogYW55IHtcbiAgICBsZXQganNvbiA9IE9iamVjdC5hc3NpZ24oe30sIHRoaXMsIHN1cGVyLnRvSnNvbigpKTsgLy8gbWVyZ2UganNvbiBvbnRvIGluaGVyaXRlZCBzdGF0ZVxuICAgIGlmICh0aGlzLmdldFRyYW5zZmVyUXVlcnkoKSAhPT0gdW5kZWZpbmVkKSBqc29uLnRyYW5zZmVyUXVlcnkgPSB0aGlzLmdldFRyYW5zZmVyUXVlcnkoKS50b0pzb24oKTtcbiAgICBpZiAodGhpcy5nZXRJbnB1dFF1ZXJ5KCkgIT09IHVuZGVmaW5lZCkganNvbi5pbnB1dFF1ZXJ5ID0gdGhpcy5nZXRJbnB1dFF1ZXJ5KCkudG9Kc29uKCk7XG4gICAgaWYgKHRoaXMuZ2V0T3V0cHV0UXVlcnkoKSAhPT0gdW5kZWZpbmVkKSBqc29uLm91dHB1dFF1ZXJ5ID0gdGhpcy5nZXRPdXRwdXRRdWVyeSgpLnRvSnNvbigpO1xuICAgIGRlbGV0ZSBqc29uLmJsb2NrOyAgLy8gZG8gbm90IHNlcmlhbGl6ZSBwYXJlbnQgYmxvY2tcbiAgICByZXR1cm4ganNvbjtcbiAgfVxuICBcbiAgZ2V0SXNJbmNvbWluZygpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy5pc0luY29taW5nO1xuICB9XG4gIFxuICBzZXRJc0luY29taW5nKGlzSW5jb21pbmc6IGJvb2xlYW4pOiBNb25lcm9UeFF1ZXJ5IHtcbiAgICB0aGlzLmlzSW5jb21pbmcgPSBpc0luY29taW5nO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRJc091dGdvaW5nKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmlzT3V0Z29pbmc7XG4gIH1cbiAgXG4gIHNldElzT3V0Z29pbmcoaXNPdXRnb2luZzogYm9vbGVhbik6IE1vbmVyb1R4UXVlcnkge1xuICAgIHRoaXMuaXNPdXRnb2luZyA9IGlzT3V0Z29pbmc7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRIYXNoZXMoKTogc3RyaW5nW10ge1xuICAgIHJldHVybiB0aGlzLmhhc2hlcztcbiAgfVxuXG4gIHNldEhhc2hlcyhoYXNoZXM6IHN0cmluZ1tdKTogTW9uZXJvVHhRdWVyeSB7XG4gICAgdGhpcy5oYXNoZXMgPSBoYXNoZXM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHNldEhhc2goaGFzaDogc3RyaW5nKTogTW9uZXJvVHhRdWVyeSB7XG4gICAgaWYgKGhhc2ggPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRoaXMuc2V0SGFzaGVzKHVuZGVmaW5lZCk7XG4gICAgYXNzZXJ0KHR5cGVvZiBoYXNoID09PSBcInN0cmluZ1wiKTtcbiAgICByZXR1cm4gdGhpcy5zZXRIYXNoZXMoW2hhc2hdKTtcbiAgfVxuICBcbiAgZ2V0SGFzUGF5bWVudElkKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLmhhc1BheW1lbnRJZDtcbiAgfVxuICBcbiAgc2V0SGFzUGF5bWVudElkKGhhc1BheW1lbnRJZDogYm9vbGVhbik6IE1vbmVyb1R4UXVlcnkge1xuICAgIHRoaXMuaGFzUGF5bWVudElkID0gaGFzUGF5bWVudElkO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBnZXRQYXltZW50SWRzKCk6IHN0cmluZ1tdIHtcbiAgICByZXR1cm4gdGhpcy5wYXltZW50SWRzO1xuICB9XG5cbiAgc2V0UGF5bWVudElkcyhwYXltZW50SWRzOiBzdHJpbmdbXSk6IE1vbmVyb1R4UXVlcnkge1xuICAgIHRoaXMucGF5bWVudElkcyA9IHBheW1lbnRJZHM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHNldFBheW1lbnRJZChwYXltZW50SWQ6IHN0cmluZyk6IE1vbmVyb1R4UXVlcnkge1xuICAgIGlmIChwYXltZW50SWQgPT09IHVuZGVmaW5lZCkgcmV0dXJuIHRoaXMuc2V0UGF5bWVudElkcyh1bmRlZmluZWQpO1xuICAgIGFzc2VydCh0eXBlb2YgcGF5bWVudElkID09PSBcInN0cmluZ1wiKTtcbiAgICByZXR1cm4gdGhpcy5zZXRQYXltZW50SWRzKFtwYXltZW50SWRdKTtcbiAgfVxuICBcbiAgZ2V0SGVpZ2h0KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuaGVpZ2h0O1xuICB9XG4gIFxuICBzZXRIZWlnaHQoaGVpZ2h0OiBudW1iZXIpOiBNb25lcm9UeFF1ZXJ5IHtcbiAgICB0aGlzLmhlaWdodCA9IGhlaWdodDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgZ2V0TWluSGVpZ2h0KCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMubWluSGVpZ2h0O1xuICB9XG5cbiAgc2V0TWluSGVpZ2h0KG1pbkhlaWdodDogbnVtYmVyKTogTW9uZXJvVHhRdWVyeSB7XG4gICAgdGhpcy5taW5IZWlnaHQgPSBtaW5IZWlnaHQ7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXRNYXhIZWlnaHQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5tYXhIZWlnaHQ7XG4gIH1cblxuICBzZXRNYXhIZWlnaHQobWF4SGVpZ2h0OiBudW1iZXIpOiBNb25lcm9UeFF1ZXJ5IHtcbiAgICB0aGlzLm1heEhlaWdodCA9IG1heEhlaWdodDtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgZ2V0SW5jbHVkZU91dHB1dHMoKTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIHRoaXMuaW5jbHVkZU91dHB1dHM7XG4gIH1cblxuICBzZXRJbmNsdWRlT3V0cHV0cyhpbmNsdWRlT3V0cHV0czogYm9vbGVhbik6IE1vbmVyb1R4UXVlcnkge1xuICAgIHRoaXMuaW5jbHVkZU91dHB1dHMgPSBpbmNsdWRlT3V0cHV0cztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgZ2V0VHJhbnNmZXJRdWVyeSgpOiBNb25lcm9UcmFuc2ZlclF1ZXJ5IHtcbiAgICByZXR1cm4gdGhpcy50cmFuc2ZlclF1ZXJ5IGFzIE1vbmVyb1RyYW5zZmVyUXVlcnlcbiAgfVxuICBcbiAgc2V0VHJhbnNmZXJRdWVyeSh0cmFuc2ZlclF1ZXJ5OiBNb25lcm9UcmFuc2ZlclF1ZXJ5KTogTW9uZXJvVHhRdWVyeSB7XG4gICAgdGhpcy50cmFuc2ZlclF1ZXJ5ID0gdHJhbnNmZXJRdWVyeSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdHJhbnNmZXJRdWVyeSBpbnN0YW5jZW9mIE1vbmVyb1RyYW5zZmVyUXVlcnkgPyB0cmFuc2ZlclF1ZXJ5IDogbmV3IE1vbmVyb1RyYW5zZmVyUXVlcnkodHJhbnNmZXJRdWVyeSk7XG4gICAgaWYgKHRyYW5zZmVyUXVlcnkpIHRoaXMudHJhbnNmZXJRdWVyeS50eFF1ZXJ5ID0gdGhpcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgZ2V0SW5wdXRRdWVyeSgpOiBNb25lcm9PdXRwdXRRdWVyeSB7XG4gICAgcmV0dXJuIHRoaXMuaW5wdXRRdWVyeSBhcyBNb25lcm9PdXRwdXRRdWVyeTtcbiAgfVxuICBcbiAgc2V0SW5wdXRRdWVyeShpbnB1dFF1ZXJ5OiBNb25lcm9PdXRwdXRRdWVyeSk6IE1vbmVyb1R4UXVlcnkge1xuICAgIHRoaXMuaW5wdXRRdWVyeSA9IGlucHV0UXVlcnk7XG4gICAgaWYgKGlucHV0UXVlcnkpIGlucHV0UXVlcnkudHhRdWVyeSA9IHRoaXM7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIGdldE91dHB1dFF1ZXJ5KCk6IE1vbmVyb091dHB1dFF1ZXJ5IHtcbiAgICByZXR1cm4gdGhpcy5vdXRwdXRRdWVyeSBhcyBNb25lcm9PdXRwdXRRdWVyeTtcbiAgfVxuICBcbiAgc2V0T3V0cHV0UXVlcnkob3V0cHV0UXVlcnk6IE1vbmVyb091dHB1dFF1ZXJ5KTogTW9uZXJvVHhRdWVyeSB7XG4gICAgdGhpcy5vdXRwdXRRdWVyeSA9IG91dHB1dFF1ZXJ5ID09PSB1bmRlZmluZWQgPyB1bmRlZmluZWQgOiBvdXRwdXRRdWVyeSBpbnN0YW5jZW9mIE1vbmVyb091dHB1dFF1ZXJ5ID8gb3V0cHV0UXVlcnkgOiBuZXcgTW9uZXJvT3V0cHV0UXVlcnkob3V0cHV0UXVlcnkpO1xuICAgIGlmIChvdXRwdXRRdWVyeSkgdGhpcy5vdXRwdXRRdWVyeS50eFF1ZXJ5ID0gdGhpcztcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuICBcbiAgbWVldHNDcml0ZXJpYSh0eDogTW9uZXJvVHhXYWxsZXQsIHF1ZXJ5Q2hpbGRyZW4/OiBib29sZWFuKTogYm9vbGVhbiB7XG4gICAgaWYgKCEodHggaW5zdGFuY2VvZiBNb25lcm9UeFdhbGxldCkpIHRocm93IG5ldyBFcnJvcihcIlR4IG5vdCBnaXZlbiB0byBNb25lcm9UeFF1ZXJ5Lm1lZXRzQ3JpdGVyaWEodHgpXCIpO1xuICAgIGlmIChxdWVyeUNoaWxkcmVuID09PSB1bmRlZmluZWQpIHF1ZXJ5Q2hpbGRyZW4gPSB0cnVlO1xuICAgIFxuICAgIC8vIGZpbHRlciBvbiB0eFxuICAgIGlmICh0aGlzLmdldEhhc2goKSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZ2V0SGFzaCgpICE9PSB0eC5nZXRIYXNoKCkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAodGhpcy5nZXRQYXltZW50SWQoKSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZ2V0UGF5bWVudElkKCkgIT09IHR4LmdldFBheW1lbnRJZCgpKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHRoaXMuZ2V0SXNDb25maXJtZWQoKSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZ2V0SXNDb25maXJtZWQoKSAhPT0gdHguZ2V0SXNDb25maXJtZWQoKSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmICh0aGlzLmdldEluVHhQb29sKCkgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmdldEluVHhQb29sKCkgIT09IHR4LmdldEluVHhQb29sKCkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAodGhpcy5nZXRSZWxheSgpICE9PSB1bmRlZmluZWQgJiYgdGhpcy5nZXRSZWxheSgpICE9PSB0eC5nZXRSZWxheSgpKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHRoaXMuZ2V0SXNSZWxheWVkKCkgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmdldElzUmVsYXllZCgpICE9PSB0eC5nZXRJc1JlbGF5ZWQoKSkgcmV0dXJuIGZhbHNlO1xuICAgIGlmICh0aGlzLmdldElzRmFpbGVkKCkgIT09IHVuZGVmaW5lZCAmJiB0aGlzLmdldElzRmFpbGVkKCkgIT09IHR4LmdldElzRmFpbGVkKCkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAodGhpcy5nZXRJc01pbmVyVHgoKSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZ2V0SXNNaW5lclR4KCkgIT09IHR4LmdldElzTWluZXJUeCgpKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHRoaXMuZ2V0SXNMb2NrZWQoKSAhPT0gdW5kZWZpbmVkICYmIHRoaXMuZ2V0SXNMb2NrZWQoKSAhPT0gdHguZ2V0SXNMb2NrZWQoKSkgcmV0dXJuIGZhbHNlO1xuICAgIFxuICAgIC8vIGZpbHRlciBvbiBoYXZpbmcgYSBwYXltZW50IGlkXG4gICAgaWYgKHRoaXMuZ2V0SGFzUGF5bWVudElkKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHRoaXMuZ2V0SGFzUGF5bWVudElkKCkgJiYgdHguZ2V0UGF5bWVudElkKCkgPT09IHVuZGVmaW5lZCkgcmV0dXJuIGZhbHNlO1xuICAgICAgaWYgKCF0aGlzLmdldEhhc1BheW1lbnRJZCgpICYmIHR4LmdldFBheW1lbnRJZCgpICE9PSB1bmRlZmluZWQpIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgXG4gICAgLy8gZmlsdGVyIG9uIGluY29taW5nXG4gICAgaWYgKHRoaXMuZ2V0SXNJbmNvbWluZygpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0aGlzLmdldElzSW5jb21pbmcoKSAmJiAhdHguZ2V0SXNJbmNvbWluZygpKSByZXR1cm4gZmFsc2U7XG4gICAgICBpZiAoIXRoaXMuZ2V0SXNJbmNvbWluZygpICYmIHR4LmdldElzSW5jb21pbmcoKSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICAvLyBmaWx0ZXIgb24gb3V0Z29pbmdcbiAgICBpZiAodGhpcy5nZXRJc091dGdvaW5nKCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHRoaXMuZ2V0SXNPdXRnb2luZygpICYmICF0eC5nZXRJc091dGdvaW5nKCkpIHJldHVybiBmYWxzZTtcbiAgICAgIGlmICghdGhpcy5nZXRJc091dGdvaW5nKCkgJiYgdHguZ2V0SXNPdXRnb2luZygpKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIC8vIGZpbHRlciBvbiByZW1haW5pbmcgZmllbGRzXG4gICAgbGV0IHR4SGVpZ2h0ID0gdHguZ2V0QmxvY2soKSA9PT0gdW5kZWZpbmVkID8gdW5kZWZpbmVkIDogdHguZ2V0QmxvY2soKS5nZXRIZWlnaHQoKTtcbiAgICBpZiAodGhpcy5nZXRIYXNoZXMoKSAhPT0gdW5kZWZpbmVkICYmICF0aGlzLmdldEhhc2hlcygpLmluY2x1ZGVzKHR4LmdldEhhc2goKSkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAodGhpcy5nZXRQYXltZW50SWRzKCkgIT09IHVuZGVmaW5lZCAmJiAhdGhpcy5nZXRQYXltZW50SWRzKCkuaW5jbHVkZXModHguZ2V0UGF5bWVudElkKCkpKSByZXR1cm4gZmFsc2U7XG4gICAgaWYgKHRoaXMuZ2V0SGVpZ2h0KCkgIT09IHVuZGVmaW5lZCAmJiAodHhIZWlnaHQgPT09IHVuZGVmaW5lZCB8fCB0eEhlaWdodCAhPT0gdGhpcy5nZXRIZWlnaHQoKSkpIHJldHVybiBmYWxzZTtcbiAgICBpZiAodGhpcy5nZXRNaW5IZWlnaHQoKSAhPT0gdW5kZWZpbmVkICYmIHR4SGVpZ2h0ICE9PSB1bmRlZmluZWQgJiYgdHhIZWlnaHQgPCB0aGlzLmdldE1pbkhlaWdodCgpKSByZXR1cm4gZmFsc2U7IC8vIGRvIG5vdCBmaWx0ZXIgdW5jb25maXJtZWRcbiAgICBpZiAodGhpcy5nZXRNYXhIZWlnaHQoKSAhPT0gdW5kZWZpbmVkICYmICh0eEhlaWdodCA9PT0gdW5kZWZpbmVkIHx8IHR4SGVpZ2h0ID4gdGhpcy5nZXRNYXhIZWlnaHQoKSkpIHJldHVybiBmYWxzZTtcbiAgICAvLyBUT0RPOiBmaWx0ZXJpbmcgbm90IGNvbXBsZXRlXG4gICAgXG4gICAgLy8gZG9uZSBpZiBub3QgcXVlcnlpbmcgdHJhbnNmZXJzIG9yIG91dHB1dHNcbiAgICBpZiAoIXF1ZXJ5Q2hpbGRyZW4pIHJldHVybiB0cnVlO1xuICAgIFxuICAgIC8vIGF0IGxlYXN0IG9uZSB0cmFuc2ZlciBtdXN0IG1lZXQgdHJhbnNmZXIgZmlsdGVyIGlmIGRlZmluZWRcbiAgICBpZiAodGhpcy5nZXRUcmFuc2ZlclF1ZXJ5KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IG1hdGNoRm91bmQgPSBmYWxzZTtcbiAgICAgIGlmICh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCkgJiYgdGhpcy5nZXRUcmFuc2ZlclF1ZXJ5KCkubWVldHNDcml0ZXJpYSh0eC5nZXRPdXRnb2luZ1RyYW5zZmVyKCksIGZhbHNlKSkgbWF0Y2hGb3VuZCA9IHRydWU7XG4gICAgICBlbHNlIGlmICh0eC5nZXRJbmNvbWluZ1RyYW5zZmVycygpKSB7XG4gICAgICAgIGZvciAobGV0IGluY29taW5nVHJhbnNmZXIgb2YgdHguZ2V0SW5jb21pbmdUcmFuc2ZlcnMoKSkge1xuICAgICAgICAgIGlmICh0aGlzLmdldFRyYW5zZmVyUXVlcnkoKS5tZWV0c0NyaXRlcmlhKGluY29taW5nVHJhbnNmZXIsIGZhbHNlKSkge1xuICAgICAgICAgICAgbWF0Y2hGb3VuZCA9IHRydWU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghbWF0Y2hGb3VuZCkgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBcbiAgICAvLyBhdCBsZWFzdCBvbmUgaW5wdXQgbXVzdCBtZWV0IGlucHV0IHF1ZXJ5IGlmIGRlZmluZWRcbiAgICBpZiAodGhpcy5nZXRJbnB1dFF1ZXJ5KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgaWYgKHR4LmdldElucHV0cygpID09PSB1bmRlZmluZWQgfHwgdHguZ2V0SW5wdXRzKCkubGVuZ3RoID09PSAwKSByZXR1cm4gZmFsc2U7XG4gICAgICBsZXQgbWF0Y2hGb3VuZCA9IGZhbHNlO1xuICAgICAgZm9yIChsZXQgaW5wdXQgb2YgdHguZ2V0SW5wdXRzV2FsbGV0KCkpIHtcbiAgICAgICAgaWYgKHRoaXMuZ2V0SW5wdXRRdWVyeSgpLm1lZXRzQ3JpdGVyaWEoaW5wdXQsIGZhbHNlKSkge1xuICAgICAgICAgIG1hdGNoRm91bmQgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoIW1hdGNoRm91bmQpIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgXG4gICAgLy8gYXQgbGVhc3Qgb25lIG91dHB1dCBtdXN0IG1lZXQgb3V0cHV0IHF1ZXJ5IGlmIGRlZmluZWRcbiAgICBpZiAodGhpcy5nZXRPdXRwdXRRdWVyeSgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGlmICh0eC5nZXRPdXRwdXRzKCkgPT09IHVuZGVmaW5lZCB8fCB0eC5nZXRPdXRwdXRzKCkubGVuZ3RoID09PSAwKSByZXR1cm4gZmFsc2U7XG4gICAgICBsZXQgbWF0Y2hGb3VuZCA9IGZhbHNlO1xuICAgICAgZm9yIChsZXQgb3V0cHV0IG9mIHR4LmdldE91dHB1dHNXYWxsZXQoKSkge1xuICAgICAgICBpZiAodGhpcy5nZXRPdXRwdXRRdWVyeSgpLm1lZXRzQ3JpdGVyaWEob3V0cHV0LCBmYWxzZSkpIHtcbiAgICAgICAgICBtYXRjaEZvdW5kID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKCFtYXRjaEZvdW5kKSByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIFxuICAgIHJldHVybiB0cnVlOyAgLy8gdHJhbnNhY3Rpb24gbWVldHMgZmlsdGVyIGNyaXRlcmlhXG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tIE9WRVJSSURFIENPLVZBUklBTlQgUkVUVVJOIFRZUEVTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHNldEluY29taW5nVHJhbnNmZXJzKGluY29taW5nVHJhbnNmZXJzOiBNb25lcm9JbmNvbWluZ1RyYW5zZmVyW10pOiBNb25lcm9UeFF1ZXJ5IHtcbiAgICBzdXBlci5zZXRJbmNvbWluZ1RyYW5zZmVycyhpbmNvbWluZ1RyYW5zZmVycyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRPdXRnb2luZ1RyYW5zZmVyKG91dGdvaW5nVHJhbnNmZXI6IE1vbmVyb091dGdvaW5nVHJhbnNmZXIpOiBNb25lcm9UeFF1ZXJ5IHtcbiAgICBzdXBlci5zZXRPdXRnb2luZ1RyYW5zZmVyKG91dGdvaW5nVHJhbnNmZXIpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0T3V0cHV0cyhvdXRwdXRzOiBNb25lcm9PdXRwdXRbXSk6IE1vbmVyb1R4UXVlcnkge1xuICAgIHN1cGVyLnNldE91dHB1dHMob3V0cHV0cyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXROb3RlKG5vdGU6IHN0cmluZyk6IE1vbmVyb1R4UXVlcnkge1xuICAgIHN1cGVyLnNldE5vdGUobm90ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbiAgXG4gIHNldElzTG9ja2VkKGlzTG9ja2VkOiBib29sZWFuKTogTW9uZXJvVHhRdWVyeSB7XG4gICAgc3VwZXIuc2V0SXNMb2NrZWQoaXNMb2NrZWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0QmxvY2soYmxvY2s6IE1vbmVyb0Jsb2NrKTogTW9uZXJvVHhRdWVyeSB7XG4gICAgc3VwZXIuc2V0QmxvY2soYmxvY2spO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBzZXRWZXJzaW9uKHZlcnNpb246IG51bWJlcik6IE1vbmVyb1R4UXVlcnkge1xuICAgIHN1cGVyLnNldFZlcnNpb24odmVyc2lvbik7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRJc01pbmVyVHgoaXNNaW5lclR4OiBib29sZWFuKTogTW9uZXJvVHhRdWVyeSB7XG4gICAgc3VwZXIuc2V0SXNNaW5lclR4KGlzTWluZXJUeCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRGZWUoZmVlOiBiaWdpbnQpOiBNb25lcm9UeFF1ZXJ5IHtcbiAgICBzdXBlci5zZXRGZWUoZmVlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFJpbmdTaXplKHJpbmdTaXplOiBudW1iZXIpOiBNb25lcm9UeFF1ZXJ5IHtcbiAgICBzdXBlci5zZXRSaW5nU2l6ZShyaW5nU2l6ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRSZWxheShyZWxheTogYm9vbGVhbik6IE1vbmVyb1R4UXVlcnkge1xuICAgIHN1cGVyLnNldFJlbGF5KHJlbGF5KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldElzUmVsYXllZChpc1JlbGF5ZWQ6IGJvb2xlYW4pOiBNb25lcm9UeFF1ZXJ5IHtcbiAgICBzdXBlci5zZXRJc1JlbGF5ZWQoaXNSZWxheWVkKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldElzQ29uZmlybWVkKGlzQ29uZmlybWVkOiBib29sZWFuKTogTW9uZXJvVHhRdWVyeSB7XG4gICAgc3VwZXIuc2V0SXNDb25maXJtZWQoaXNDb25maXJtZWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0SW5UeFBvb2woaW5UeFBvb2w6IGJvb2xlYW4pOiBNb25lcm9UeFF1ZXJ5IHtcbiAgICBzdXBlci5zZXRJblR4UG9vbChpblR4UG9vbCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXROdW1Db25maXJtYXRpb25zKG51bUNvbmZpcm1hdGlvbnM6IG51bWJlcik6IE1vbmVyb1R4UXVlcnkge1xuICAgIHN1cGVyLnNldE51bUNvbmZpcm1hdGlvbnMobnVtQ29uZmlybWF0aW9ucyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRVbmxvY2tUaW1lKHVubG9ja1RpbWU6IGJpZ2ludCk6IE1vbmVyb1R4UXVlcnkge1xuICAgIHN1cGVyLnNldFVubG9ja1RpbWUodW5sb2NrVGltZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRMYXN0UmVsYXllZFRpbWVzdGFtcChsYXN0UmVsYXllZFRpbWVzdGFtcDogbnVtYmVyKTogTW9uZXJvVHhRdWVyeSB7XG4gICAgc3VwZXIuc2V0TGFzdFJlbGF5ZWRUaW1lc3RhbXAobGFzdFJlbGF5ZWRUaW1lc3RhbXApO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UmVjZWl2ZWRUaW1lc3RhbXAocmVjZWl2ZWRUaW1lc3RhbXA6IG51bWJlcik6IE1vbmVyb1R4UXVlcnkge1xuICAgIHN1cGVyLnNldFJlY2VpdmVkVGltZXN0YW1wKHJlY2VpdmVkVGltZXN0YW1wKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldElzRG91YmxlU3BlbmRTZWVuKGlzRG91YmxlU3BlbmRTZWVuOiBib29sZWFuKTogTW9uZXJvVHhRdWVyeSB7XG4gICAgc3VwZXIuc2V0SXNEb3VibGVTcGVuZFNlZW4oaXNEb3VibGVTcGVuZFNlZW4pO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0S2V5KGtleTogc3RyaW5nKTogTW9uZXJvVHhRdWVyeSB7XG4gICAgc3VwZXIuc2V0S2V5KGtleSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRGdWxsSGV4KGhleDogc3RyaW5nKTogTW9uZXJvVHhRdWVyeSB7XG4gICAgc3VwZXIuc2V0RnVsbEhleChoZXgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UHJ1bmVkSGV4KHBydW5lZEhleDogc3RyaW5nKTogTW9uZXJvVHhRdWVyeSB7XG4gICAgc3VwZXIuc2V0UHJ1bmVkSGV4KHBydW5lZEhleCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRQcnVuYWJsZUhleChwcnVuYWJsZUhleDogc3RyaW5nKTogTW9uZXJvVHhRdWVyeSB7XG4gICAgc3VwZXIuc2V0UHJ1bmFibGVIZXgocHJ1bmFibGVIZXgpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UHJ1bmFibGVIYXNoKHBydW5hYmxlSGFzaDogc3RyaW5nKTogTW9uZXJvVHhRdWVyeSB7XG4gICAgc3VwZXIuc2V0UHJ1bmFibGVIYXNoKHBydW5hYmxlSGFzaCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRTaXplKHNpemU6IG51bWJlcik6IE1vbmVyb1R4UXVlcnkge1xuICAgIHN1cGVyLnNldFNpemUoc2l6ZSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRXZWlnaHQod2VpZ2h0OiBudW1iZXIpOiBNb25lcm9UeFF1ZXJ5IHtcbiAgICBzdXBlci5zZXRXZWlnaHQod2VpZ2h0KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldElucHV0cyhpbnB1dHM6IE1vbmVyb091dHB1dFtdKTogTW9uZXJvVHhRdWVyeSB7XG4gICAgc3VwZXIuc2V0SW5wdXRzKGlucHV0cyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRPdXRwdXRJbmRpY2VzKG91dHB1dEluZGljZXM6IG51bWJlcltdKTogTW9uZXJvVHhRdWVyeSB7XG4gICAgc3VwZXIuc2V0T3V0cHV0SW5kaWNlcyhvdXRwdXRJbmRpY2VzKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldE1ldGFkYXRhKG1ldGFkYXRhOiBzdHJpbmcpOiBNb25lcm9UeFF1ZXJ5IHtcbiAgICBzdXBlci5zZXRNZXRhZGF0YShtZXRhZGF0YSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRUeFNldCh0eFNldDogTW9uZXJvVHhTZXQpOiBNb25lcm9UeFF1ZXJ5IHtcbiAgICBzdXBlci5zZXRUeFNldCh0eFNldCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRFeHRyYShleHRyYTogVWludDhBcnJheSk6IE1vbmVyb1R4UXVlcnkge1xuICAgIHN1cGVyLnNldEV4dHJhKGV4dHJhKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldFJjdFNpZ25hdHVyZXMocmN0U2lnbmF0dXJlczogYW55KTogTW9uZXJvVHhRdWVyeSB7XG4gICAgc3VwZXIuc2V0UmN0U2lnbmF0dXJlcyhyY3RTaWduYXR1cmVzKVxuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0UmN0U2lnUHJ1bmFibGUocmN0U2lnUHJ1bmFibGU6IGFueSk6IE1vbmVyb1R4UXVlcnkge1xuICAgIHN1cGVyLnNldFJjdFNpZ1BydW5hYmxlKHJjdFNpZ1BydW5hYmxlKTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldElzS2VwdEJ5QmxvY2soaXNLZXB0QnlCbG9jazogYm9vbGVhbik6IE1vbmVyb1R4UXVlcnkge1xuICAgIHN1cGVyLnNldElzS2VwdEJ5QmxvY2soaXNLZXB0QnlCbG9jaylcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldElzRmFpbGVkKGlzRmFpbGVkOiBib29sZWFuKTogTW9uZXJvVHhRdWVyeSB7XG4gICAgc3VwZXIuc2V0SXNGYWlsZWQoaXNGYWlsZWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG4gIFxuICBzZXRMYXN0RmFpbGVkSGVpZ2h0KGxhc3RGYWlsZWRIZWlnaHQ6IG51bWJlcik6IE1vbmVyb1R4UXVlcnkge1xuICAgIHN1cGVyLnNldExhc3RGYWlsZWRIZWlnaHQobGFzdEZhaWxlZEhlaWdodCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRMYXN0RmFpbGVkSGFzaChsYXN0RmFpbGVkSWQ6IHN0cmluZyk6IE1vbmVyb1R4UXVlcnkge1xuICAgIHN1cGVyLnNldExhc3RGYWlsZWRIYXNoKGxhc3RGYWlsZWRJZCk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBzZXRNYXhVc2VkQmxvY2tIZWlnaHQobWF4VXNlZEJsb2NrSGVpZ2h0OiBudW1iZXIpOiBNb25lcm9UeFF1ZXJ5IHtcbiAgICBzdXBlci5zZXRNYXhVc2VkQmxvY2tIZWlnaHQobWF4VXNlZEJsb2NrSGVpZ2h0KTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIHNldE1heFVzZWRCbG9ja0hhc2gobWF4VXNlZEJsb2NrSWQ6IHN0cmluZyk6IE1vbmVyb1R4UXVlcnkge1xuICAgIHN1cGVyLnNldE1heFVzZWRCbG9ja0hhc2gobWF4VXNlZEJsb2NrSWQpO1xuICAgIHJldHVybiB0aGlzO1xuICB9XG5cbiAgc2V0U2lnbmF0dXJlcyhzaWduYXR1cmVzOiBzdHJpbmdbXSk6IE1vbmVyb1R4UXVlcnkge1xuICAgIHN1cGVyLnNldFNpZ25hdHVyZXMoc2lnbmF0dXJlcyk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTs7Ozs7QUFLQSxJQUFBQyxrQkFBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FB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