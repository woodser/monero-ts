"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assert = _interopRequireDefault(require("assert"));

var _GenUtils = _interopRequireDefault(require("../../common/GenUtils"));

var _MoneroOutput = _interopRequireDefault(require("./MoneroOutput"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/**
 * Represents a transaction on the Monero network.
 * 
 * @class
 */
var MoneroTx = /*#__PURE__*/function () {
  /**
   * Construct the model.
   * 
   * @param {MoneroTx|object} state is existing state to initialize from (optional)
   */
  function MoneroTx(state) {
    (0, _classCallCheck2["default"])(this, MoneroTx);
    // initialize internal state
    if (!state) state = {};else if (state instanceof MoneroTx) state = state.toJson();else if ((0, _typeof2["default"])(state) === "object") state = Object.assign({}, state);else throw new MoneroError("state must be a MoneroTx or JavaScript object");
    this.state = state; // deserialize fee

    if (state.fee !== undefined && !(state.fee instanceof BigInt)) state.fee = BigInt(state.fee); // deserialize inputs

    if (state.inputs) {
      for (var i = 0; i < state.inputs.length; i++) {
        if (!(state.inputs[i] instanceof _MoneroOutput["default"])) {
          state.inputs[i] = new _MoneroOutput["default"](Object.assign(state.inputs[i], {
            tx: this
          }));
        }
      }
    } // deserialize outputs


    if (state.outputs) {
      for (var _i = 0; _i < state.outputs.length; _i++) {
        if (!(state.outputs[_i] instanceof _MoneroOutput["default"])) {
          state.outputs[_i] = new _MoneroOutput["default"](Object.assign(state.outputs[_i], {
            tx: this
          }));
        }
      }
    }
  }

  (0, _createClass2["default"])(MoneroTx, [{
    key: "getBlock",
    value: function getBlock() {
      return this.state.block;
    }
  }, {
    key: "setBlock",
    value: function setBlock(block) {
      this.state.block = block;
      return this;
    }
  }, {
    key: "getHeight",
    value: function getHeight() {
      return this.getBlock() === undefined ? undefined : this.getBlock().getHeight();
    }
  }, {
    key: "getHash",
    value: function getHash() {
      return this.state.hash;
    }
  }, {
    key: "setHash",
    value: function setHash(hash) {
      this.state.hash = hash;
      return this;
    }
  }, {
    key: "getVersion",
    value: function getVersion() {
      return this.state.version;
    }
  }, {
    key: "setVersion",
    value: function setVersion(version) {
      this.state.version = version;
      return this;
    }
  }, {
    key: "isMinerTx",
    value: function isMinerTx() {
      return this.state.isMinerTx;
    }
  }, {
    key: "setIsMinerTx",
    value: function setIsMinerTx(miner) {
      this.state.isMinerTx = miner;
      return this;
    }
  }, {
    key: "getPaymentId",
    value: function getPaymentId() {
      return this.state.paymentId;
    }
  }, {
    key: "setPaymentId",
    value: function setPaymentId(paymentId) {
      this.state.paymentId = paymentId;
      return this;
    }
  }, {
    key: "getFee",
    value: function getFee() {
      return this.state.fee;
    }
  }, {
    key: "setFee",
    value: function setFee(fee) {
      this.state.fee = fee;
      return this;
    }
  }, {
    key: "getRingSize",
    value: function getRingSize() {
      return this.state.ringSize;
    }
  }, {
    key: "setRingSize",
    value: function setRingSize(ringSize) {
      this.state.ringSize = ringSize;
      return this;
    }
  }, {
    key: "getRelay",
    value: function getRelay() {
      return this.state.relay;
    }
  }, {
    key: "setRelay",
    value: function setRelay(relay) {
      this.state.relay = relay;
      return this;
    }
  }, {
    key: "isRelayed",
    value: function isRelayed() {
      return this.state.isRelayed;
    }
  }, {
    key: "setIsRelayed",
    value: function setIsRelayed(isRelayed) {
      this.state.isRelayed = isRelayed;
      return this;
    }
  }, {
    key: "isConfirmed",
    value: function isConfirmed() {
      return this.state.isConfirmed;
    }
  }, {
    key: "setIsConfirmed",
    value: function setIsConfirmed(isConfirmed) {
      this.state.isConfirmed = isConfirmed;
      return this;
    }
  }, {
    key: "inTxPool",
    value: function inTxPool() {
      return this.state.inTxPool;
    }
  }, {
    key: "setInTxPool",
    value: function setInTxPool(inTxPool) {
      this.state.inTxPool = inTxPool;
      return this;
    }
  }, {
    key: "getNumConfirmations",
    value: function getNumConfirmations() {
      return this.state.numConfirmations;
    }
  }, {
    key: "setNumConfirmations",
    value: function setNumConfirmations(numConfirmations) {
      this.state.numConfirmations = numConfirmations;
      return this;
    }
  }, {
    key: "getUnlockHeight",
    value: function getUnlockHeight() {
      return this.state.unlockHeight;
    }
  }, {
    key: "setUnlockHeight",
    value: function setUnlockHeight(unlockHeight) {
      this.state.unlockHeight = unlockHeight;
      return this;
    }
  }, {
    key: "getLastRelayedTimestamp",
    value: function getLastRelayedTimestamp() {
      return this.state.lastRelayedTimestamp;
    }
  }, {
    key: "setLastRelayedTimestamp",
    value: function setLastRelayedTimestamp(lastRelayedTimestamp) {
      this.state.lastRelayedTimestamp = lastRelayedTimestamp;
      return this;
    }
  }, {
    key: "getReceivedTimestamp",
    value: function getReceivedTimestamp() {
      return this.state.receivedTimestamp;
    }
  }, {
    key: "setReceivedTimestamp",
    value: function setReceivedTimestamp(receivedTimestamp) {
      this.state.receivedTimestamp = receivedTimestamp;
      return this;
    }
  }, {
    key: "isDoubleSpendSeen",
    value: function isDoubleSpendSeen() {
      return this.state.isDoubleSpendSeen;
    }
  }, {
    key: "setIsDoubleSpend",
    value: function setIsDoubleSpend(isDoubleSpendSeen) {
      this.state.isDoubleSpendSeen = isDoubleSpendSeen;
      return this;
    }
  }, {
    key: "getKey",
    value: function getKey() {
      return this.state.key;
    }
  }, {
    key: "setKey",
    value: function setKey(key) {
      this.state.key = key;
      return this;
    }
    /**
     * Get full transaction hex.  Full hex = pruned hex + prunable hex.
     * 
     * @return {string} is full transaction hex
     */

  }, {
    key: "getFullHex",
    value: function getFullHex() {
      return this.state.fullHex;
    }
  }, {
    key: "setFullHex",
    value: function setFullHex(fullHex) {
      this.state.fullHex = fullHex;
      return this;
    }
    /**
     * Get pruned transaction hex.  Full hex = pruned hex + prunable hex.
     * 
     * @return {string} is pruned transaction hex
     */

  }, {
    key: "getPrunedHex",
    value: function getPrunedHex() {
      return this.state.prunedHex;
    }
  }, {
    key: "setPrunedHex",
    value: function setPrunedHex(prunedHex) {
      this.state.prunedHex = prunedHex;
      return this;
    }
    /**
     * Get prunable transaction hex which is hex that is removed from a pruned
     * transaction. Full hex = pruned hex + prunable hex.
     * 
     * @return {string} is the prunable transaction hex
     */

  }, {
    key: "getPrunableHex",
    value: function getPrunableHex() {
      return this.state.prunableHex;
    }
  }, {
    key: "setPrunableHex",
    value: function setPrunableHex(prunableHex) {
      this.state.prunableHex = prunableHex;
      return this;
    }
  }, {
    key: "getPrunableHash",
    value: function getPrunableHash() {
      return this.state.prunableHash;
    }
  }, {
    key: "setPrunableHash",
    value: function setPrunableHash(prunableHash) {
      this.state.prunableHash = prunableHash;
      return this;
    }
  }, {
    key: "getSize",
    value: function getSize() {
      return this.state.size;
    }
  }, {
    key: "setSize",
    value: function setSize(size) {
      this.state.size = size;
      return this;
    }
  }, {
    key: "getWeight",
    value: function getWeight() {
      return this.state.weight;
    }
  }, {
    key: "setWeight",
    value: function setWeight(weight) {
      this.state.weight = weight;
      return this;
    }
  }, {
    key: "getInputs",
    value: function getInputs() {
      return this.state.inputs;
    }
  }, {
    key: "setInputs",
    value: function setInputs(inputs) {
      this.state.inputs = inputs;
      return this;
    }
  }, {
    key: "getOutputs",
    value: function getOutputs() {
      return this.state.outputs;
    }
  }, {
    key: "setOutputs",
    value: function setOutputs(outputs) {
      this.state.outputs = outputs;
      return this;
    }
  }, {
    key: "getOutputIndices",
    value: function getOutputIndices() {
      return this.state.outputIndices;
    }
  }, {
    key: "setOutputIndices",
    value: function setOutputIndices(outputIndices) {
      this.state.outputIndices = outputIndices;
      return this;
    }
  }, {
    key: "getMetadata",
    value: function getMetadata() {
      return this.state.metadata;
    }
  }, {
    key: "setMetadata",
    value: function setMetadata(metadata) {
      this.state.metadata = metadata;
      return this;
    }
  }, {
    key: "getExtra",
    value: function getExtra() {
      return this.state.extra;
    }
  }, {
    key: "setExtra",
    value: function setExtra(extra) {
      this.state.extra = extra;
      return this;
    }
  }, {
    key: "getRctSignatures",
    value: function getRctSignatures() {
      return this.state.rctSignatures;
    }
  }, {
    key: "setRctSignatures",
    value: function setRctSignatures(rctSignatures) {
      this.state.rctSignatures = rctSignatures;
      return this;
    }
  }, {
    key: "getRctSigPrunable",
    value: function getRctSigPrunable() {
      return this.state.rctSigPrunable;
    }
  }, {
    key: "setRctSigPrunable",
    value: function setRctSigPrunable(rctSigPrunable) {
      this.state.rctSigPrunable = rctSigPrunable;
      return this;
    }
  }, {
    key: "isKeptByBlock",
    value: function isKeptByBlock() {
      return this.state.isKeptByBlock;
    }
  }, {
    key: "setIsKeptByBlock",
    value: function setIsKeptByBlock(isKeptByBlock) {
      this.state.isKeptByBlock = isKeptByBlock;
      return this;
    }
  }, {
    key: "isFailed",
    value: function isFailed() {
      return this.state.isFailed;
    }
  }, {
    key: "setIsFailed",
    value: function setIsFailed(isFailed) {
      this.state.isFailed = isFailed;
      return this;
    }
  }, {
    key: "getLastFailedHeight",
    value: function getLastFailedHeight() {
      return this.state.lastFailedHeight;
    }
  }, {
    key: "setLastFailedHeight",
    value: function setLastFailedHeight(lastFailedHeight) {
      this.state.lastFailedHeight = lastFailedHeight;
      return this;
    }
  }, {
    key: "getLastFailedHash",
    value: function getLastFailedHash() {
      return this.state.lastFailedHash;
    }
  }, {
    key: "setLastFailedHash",
    value: function setLastFailedHash(lastFailedHash) {
      this.state.lastFailedHash = lastFailedHash;
      return this;
    }
  }, {
    key: "getMaxUsedBlockHeight",
    value: function getMaxUsedBlockHeight() {
      return this.state.maxUsedBlockHeight;
    }
  }, {
    key: "setMaxUsedBlockHeight",
    value: function setMaxUsedBlockHeight(maxUsedBlockHeight) {
      this.state.maxUsedBlockHeight = maxUsedBlockHeight;
      return this;
    }
  }, {
    key: "getMaxUsedBlockHash",
    value: function getMaxUsedBlockHash() {
      return this.state.maxUsedBlockHash;
    }
  }, {
    key: "setMaxUsedBlockHash",
    value: function setMaxUsedBlockHash(maxUsedBlockHash) {
      this.state.maxUsedBlockHash = maxUsedBlockHash;
      return this;
    }
  }, {
    key: "getSignatures",
    value: function getSignatures() {
      return this.state.signatures;
    }
  }, {
    key: "setSignatures",
    value: function setSignatures(signatures) {
      this.state.signatures = signatures;
      return this;
    }
  }, {
    key: "copy",
    value: function copy() {
      return new MoneroTx(this);
    }
  }, {
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state);
      if (this.getFee() !== undefined) json.fee = this.getFee().toString();

      if (this.getInputs() !== undefined) {
        json.inputs = [];

        var _iterator = _createForOfIteratorHelper(this.getInputs()),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var input = _step.value;
            json.inputs.push(input.toJson());
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }

      if (this.getOutputs() !== undefined) {
        json.outputs = [];

        var _iterator2 = _createForOfIteratorHelper(this.getOutputs()),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var output = _step2.value;
            json.outputs.push(output.toJson());
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }
      }

      if (this.getExtra() !== undefined) json.extra = this.getExtra().slice();
      delete json.block; // do not serialize parent block

      return json;
    }
    /**
     * Updates this transaction by merging the latest information from the given
     * transaction.
     * 
     * @param tx is the transaction to update this transaction with
     * @return {MoneroTx} this for method chaining
     */

  }, {
    key: "merge",
    value: function merge(tx) {
      (0, _assert["default"])(tx instanceof MoneroTx);
      if (this === tx) return this; // merge blocks if they're different

      if (this.getBlock() !== tx.getBlock()) {
        if (this.getBlock() === undefined) {
          this.setBlock(tx.getBlock());
          this.getBlock().getTxs[this.getBlock().getTxs().indexOf(tx)] = this; // update block to point to this tx
        } else if (tx.getBlock() !== undefined) {
          this.getBlock().merge(tx.getBlock()); // comes back to merging txs

          return this;
        }
      } // otherwise merge tx fields


      this.setHash(_GenUtils["default"].reconcile(this.getHash(), tx.getHash()));
      this.setVersion(_GenUtils["default"].reconcile(this.getVersion(), tx.getVersion()));
      this.setPaymentId(_GenUtils["default"].reconcile(this.getPaymentId(), tx.getPaymentId()));
      this.setFee(_GenUtils["default"].reconcile(this.getFee(), tx.getFee()));
      this.setRingSize(_GenUtils["default"].reconcile(this.getRingSize(), tx.getRingSize()));
      this.setIsConfirmed(_GenUtils["default"].reconcile(this.isConfirmed(), tx.isConfirmed(), {
        resolveTrue: true
      })); // tx can become confirmed

      this.setIsMinerTx(_GenUtils["default"].reconcile(this.isMinerTx(), tx.isMinerTx(), null, null, null));
      this.setRelay(_GenUtils["default"].reconcile(this.getRelay(), tx.getRelay(), {
        resolveTrue: true
      })); // tx can become relayed

      this.setIsRelayed(_GenUtils["default"].reconcile(this.isRelayed(), tx.isRelayed(), {
        resolveTrue: true
      })); // tx can become relayed

      this.setIsDoubleSpend(_GenUtils["default"].reconcile(this.isDoubleSpendSeen(), tx.isDoubleSpendSeen(), {
        resolveTrue: true
      })); // double spend can become seen

      this.setKey(_GenUtils["default"].reconcile(this.getKey(), tx.getKey()));
      this.setFullHex(_GenUtils["default"].reconcile(this.getFullHex(), tx.getFullHex()));
      this.setPrunedHex(_GenUtils["default"].reconcile(this.getPrunedHex(), tx.getPrunedHex()));
      this.setPrunableHex(_GenUtils["default"].reconcile(this.getPrunableHex(), tx.getPrunableHex()));
      this.setPrunableHash(_GenUtils["default"].reconcile(this.getPrunableHash(), tx.getPrunableHash()));
      this.setSize(_GenUtils["default"].reconcile(this.getSize(), tx.getSize()));
      this.setWeight(_GenUtils["default"].reconcile(this.getWeight(), tx.getWeight()));
      this.setOutputIndices(_GenUtils["default"].reconcile(this.getOutputIndices(), tx.getOutputIndices()));
      this.setMetadata(_GenUtils["default"].reconcile(this.getMetadata(), tx.getMetadata()));
      this.setExtra(_GenUtils["default"].reconcile(this.getExtra(), tx.getExtra()));
      this.setRctSignatures(_GenUtils["default"].reconcile(this.getRctSignatures(), tx.getRctSignatures()));
      this.setRctSigPrunable(_GenUtils["default"].reconcile(this.getRctSigPrunable(), tx.getRctSigPrunable()));
      this.setIsKeptByBlock(_GenUtils["default"].reconcile(this.isKeptByBlock(), tx.isKeptByBlock()));
      this.setIsFailed(_GenUtils["default"].reconcile(this.isFailed(), tx.isFailed()));
      this.setLastFailedHeight(_GenUtils["default"].reconcile(this.getLastFailedHeight(), tx.getLastFailedHeight()));
      this.setLastFailedHash(_GenUtils["default"].reconcile(this.getLastFailedHash(), tx.getLastFailedHash()));
      this.setMaxUsedBlockHeight(_GenUtils["default"].reconcile(this.getMaxUsedBlockHeight(), tx.getMaxUsedBlockHeight()));
      this.setMaxUsedBlockHash(_GenUtils["default"].reconcile(this.getMaxUsedBlockHash(), tx.getMaxUsedBlockHash()));
      this.setSignatures(_GenUtils["default"].reconcile(this.getSignatures(), tx.getSignatures()));
      this.setUnlockHeight(_GenUtils["default"].reconcile(this.getUnlockHeight(), tx.getUnlockHeight()));
      this.setNumConfirmations(_GenUtils["default"].reconcile(this.getNumConfirmations(), tx.getNumConfirmations(), {
        resolveMax: true
      })); // num confirmations can increase
      // merge inputs

      if (tx.getInputs()) {
        var _iterator3 = _createForOfIteratorHelper(tx.getInputs()),
            _step3;

        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var merger = _step3.value;
            var merged = false;
            merger.setTx(this);
            if (!this.getInputs()) this.setInputs([]);

            var _iterator4 = _createForOfIteratorHelper(this.getInputs()),
                _step4;

            try {
              for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                var mergee = _step4.value;

                if (mergee.getKeyImage().getHex() === merger.getKeyImage().getHex()) {
                  mergee.merge(merger);
                  merged = true;
                  break;
                }
              }
            } catch (err) {
              _iterator4.e(err);
            } finally {
              _iterator4.f();
            }

            if (!merged) this.getInputs().push(merger);
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
      } // merge outputs


      if (tx.getOutputs()) {
        var _iterator5 = _createForOfIteratorHelper(tx.getOutputs()),
            _step5;

        try {
          for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
            var output = _step5.value;
            output.setTx(this);
          }
        } catch (err) {
          _iterator5.e(err);
        } finally {
          _iterator5.f();
        }

        if (!this.getOutputs()) this.setOutputs(tx.getOutputs());else {
          // merge outputs if key image or stealth public key present, otherwise append
          var _iterator6 = _createForOfIteratorHelper(tx.getOutputs()),
              _step6;

          try {
            for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
              var _merger = _step6.value;
              var _merged = false;

              _merger.setTx(this);

              var _iterator7 = _createForOfIteratorHelper(this.getOutputs()),
                  _step7;

              try {
                for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
                  var _mergee = _step7.value;

                  if (_merger.getKeyImage() && _mergee.getKeyImage().getHex() === _merger.getKeyImage().getHex() || _merger.getStealthPublicKey() && _mergee.getStealthPublicKey() === _merger.getStealthPublicKey()) {
                    _mergee.merge(_merger);

                    _merged = true;
                    break;
                  }
                }
              } catch (err) {
                _iterator7.e(err);
              } finally {
                _iterator7.f();
              }

              if (!_merged) this.getOutputs().push(_merger); // append output
            }
          } catch (err) {
            _iterator6.e(err);
          } finally {
            _iterator6.f();
          }
        }
      } // handle unrelayed -> relayed -> confirmed


      if (this.isConfirmed() !== undefined) {
        this.setInTxPool(false);
        this.setReceivedTimestamp(undefined);
        this.setLastRelayedTimestamp(undefined);
      } else {
        this.setInTxPool(_GenUtils["default"].reconcile(this.inTxPool(), tx.inTxPool(), {
          resolveTrue: true
        })); // unrelayed -> tx pool

        this.setReceivedTimestamp(_GenUtils["default"].reconcile(this.getReceivedTimestamp(), tx.getReceivedTimestamp(), {
          resolveMax: false
        })); // take earliest receive time

        this.setLastRelayedTimestamp(_GenUtils["default"].reconcile(this.getLastRelayedTimestamp(), tx.getLastRelayedTimestamp(), {
          resolveMax: true
        })); // take latest relay time
      }

      return this; // for chaining
    }
  }, {
    key: "toString",
    value: function toString() {
      var indent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var str = "";
      str += _GenUtils["default"].getIndent(indent) + "=== TX ===\n";
      str += _GenUtils["default"].kvLine("Tx hash", this.getHash(), indent);
      str += _GenUtils["default"].kvLine("Height", this.getHeight(), indent);
      str += _GenUtils["default"].kvLine("Version", this.getVersion(), indent);
      str += _GenUtils["default"].kvLine("Is miner tx", this.isMinerTx(), indent);
      str += _GenUtils["default"].kvLine("Payment ID", this.getPaymentId(), indent);
      str += _GenUtils["default"].kvLine("Fee", this.getFee(), indent);
      str += _GenUtils["default"].kvLine("Ring size", this.getRingSize(), indent);
      str += _GenUtils["default"].kvLine("Relay", this.getRelay(), indent);
      str += _GenUtils["default"].kvLine("Is relayed", this.isRelayed(), indent);
      str += _GenUtils["default"].kvLine("Is confirmed", this.isConfirmed(), indent);
      str += _GenUtils["default"].kvLine("In tx pool", this.inTxPool(), indent);
      str += _GenUtils["default"].kvLine("Num confirmations", this.getNumConfirmations(), indent);
      str += _GenUtils["default"].kvLine("Unlock height", this.getUnlockHeight(), indent);
      str += _GenUtils["default"].kvLine("Last relayed time", this.getLastRelayedTimestamp(), indent);
      str += _GenUtils["default"].kvLine("Received time", this.getReceivedTimestamp(), indent);
      str += _GenUtils["default"].kvLine("Is double spend", this.isDoubleSpendSeen(), indent);
      str += _GenUtils["default"].kvLine("Key", this.getKey(), indent);
      str += _GenUtils["default"].kvLine("Full hex", this.getFullHex(), indent);
      str += _GenUtils["default"].kvLine("Pruned hex", this.getPrunedHex(), indent);
      str += _GenUtils["default"].kvLine("Prunable hex", this.getPrunableHex(), indent);
      str += _GenUtils["default"].kvLine("Prunable hash", this.getPrunableHash(), indent);
      str += _GenUtils["default"].kvLine("Size", this.getSize(), indent);
      str += _GenUtils["default"].kvLine("Weight", this.getWeight(), indent);
      str += _GenUtils["default"].kvLine("Output indices", this.getOutputIndices(), indent);
      str += _GenUtils["default"].kvLine("Metadata", this.getMetadata(), indent);
      str += _GenUtils["default"].kvLine("Extra", this.getExtra(), indent);
      str += _GenUtils["default"].kvLine("RCT signatures", this.getRctSignatures(), indent);
      str += _GenUtils["default"].kvLine("RCT sig prunable", this.getRctSigPrunable(), indent);
      str += _GenUtils["default"].kvLine("Kept by block", this.isKeptByBlock(), indent);
      str += _GenUtils["default"].kvLine("Is failed", this.isFailed(), indent);
      str += _GenUtils["default"].kvLine("Last failed height", this.getLastFailedHeight(), indent);
      str += _GenUtils["default"].kvLine("Last failed hash", this.getLastFailedHash(), indent);
      str += _GenUtils["default"].kvLine("Max used block height", this.getMaxUsedBlockHeight(), indent);
      str += _GenUtils["default"].kvLine("Max used block hash", this.getMaxUsedBlockHash(), indent);
      str += _GenUtils["default"].kvLine("Signatures", this.getSignatures(), indent);

      if (this.getInputs() !== undefined) {
        str += _GenUtils["default"].kvLine("Inputs", "", indent);

        for (var i = 0; i < this.getInputs().length; i++) {
          str += _GenUtils["default"].kvLine(i + 1, "", indent + 1);
          str += this.getInputs()[i].toString(indent + 2);
          str += '\n';
        }
      }

      if (this.getOutputs() !== undefined) {
        str += _GenUtils["default"].kvLine("Outputs", "", indent);

        for (var _i2 = 0; _i2 < this.getOutputs().length; _i2++) {
          str += _GenUtils["default"].kvLine(_i2 + 1, "", indent + 1);
          str += this.getOutputs()[_i2].toString(indent + 2);
          str += '\n';
        }
      }

      return str.slice(0, str.length - 1); // strip last newline
    }
  }]);
  return MoneroTx;
}(); // default payment id


MoneroTx.DEFAULT_PAYMENT_ID = "0000000000000000";
var _default = MoneroTx;
exports["default"] = _default;