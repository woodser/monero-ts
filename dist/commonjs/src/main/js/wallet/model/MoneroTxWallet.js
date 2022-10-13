"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assertThisInitialized2 = _interopRequireDefault(require("@babel/runtime/helpers/assertThisInitialized"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _assert = _interopRequireDefault(require("assert"));

var _GenUtils = _interopRequireDefault(require("../../common/GenUtils"));

var _MoneroIncomingTransfer = _interopRequireDefault(require("./MoneroIncomingTransfer"));

var _MoneroOutgoingTransfer = _interopRequireDefault(require("./MoneroOutgoingTransfer"));

var _MoneroOutputWallet = _interopRequireDefault(require("./MoneroOutputWallet"));

var _MoneroTx2 = _interopRequireDefault(require("../../daemon/model/MoneroTx"));

var _MoneroTxSet = _interopRequireDefault(require("./MoneroTxSet"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Models a Monero transaction with wallet extensions.
 * 
 * @class
 * @extends {MoneroTx}
 */
var MoneroTxWallet = /*#__PURE__*/function (_MoneroTx) {
  (0, _inherits2["default"])(MoneroTxWallet, _MoneroTx);

  var _super = _createSuper(MoneroTxWallet);

  /**
   * Construct the model.
   * 
   * @param {MoneroTxWallet|object} state is existing state to initialize from (optional)
   */
  function MoneroTxWallet(state) {
    var _this;

    (0, _classCallCheck2["default"])(this, MoneroTxWallet);
    _this = _super.call(this, state);
    if (state instanceof MoneroTxWallet && state.getTxSet()) _this.setTxSet(state.getTxSet()); // preserve reference to tx set

    state = _this.state; // deserialize incoming transfers

    if (state.incomingTransfers) {
      for (var i = 0; i < state.incomingTransfers.length; i++) {
        if (!(state.incomingTransfers[i] instanceof _MoneroIncomingTransfer["default"])) {
          state.incomingTransfers[i] = new _MoneroIncomingTransfer["default"](Object.assign(state.incomingTransfers[i], {
            tx: (0, _assertThisInitialized2["default"])(_this)
          }));
        }
      }
    } // deserialize outgoing transfer


    if (state.outgoingTransfer && !(state.outgoingTransfer instanceof _MoneroOutgoingTransfer["default"])) {
      _this.setOutgoingTransfer(new _MoneroOutgoingTransfer["default"](Object.assign(state.outgoingTransfer, {
        tx: (0, _assertThisInitialized2["default"])(_this)
      })));
    } // deserialize inputs


    if (state.inputs) {
      for (var _i = 0; _i < state.inputs.length; _i++) {
        if (!(state.inputs[_i] instanceof _MoneroOutputWallet["default"])) {
          state.inputs[_i] = new _MoneroOutputWallet["default"](Object.assign(state.inputs[_i].toJson(), {
            tx: (0, _assertThisInitialized2["default"])(_this)
          }));
        }
      }
    } // deserialize outputs


    if (state.outputs) {
      for (var _i2 = 0; _i2 < state.outputs.length; _i2++) {
        if (!(state.outputs[_i2] instanceof _MoneroOutputWallet["default"])) {
          state.outputs[_i2] = new _MoneroOutputWallet["default"](Object.assign(state.outputs[_i2].toJson(), {
            tx: (0, _assertThisInitialized2["default"])(_this)
          }));
        }
      }
    } // deserialize BigInts


    if (state.inputSum !== undefined && !(state.inputSum instanceof BigInt)) state.inputSum = BigInt(state.inputSum);
    if (state.outputSum !== undefined && !(state.outputSum instanceof BigInt)) state.outputSum = BigInt(state.outputSum);
    if (state.changeAmount !== undefined && !(state.changeAmount instanceof BigInt)) state.changeAmount = BigInt(state.changeAmount);
    return _this;
  }

  (0, _createClass2["default"])(MoneroTxWallet, [{
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state, (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroTxWallet.prototype), "toJson", this).call(this)); // merge json onto inherited state

      if (this.getIncomingTransfers() !== undefined) {
        json.incomingTransfers = [];

        var _iterator = _createForOfIteratorHelper(this.getIncomingTransfers()),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var incomingTransfer = _step.value;
            json.incomingTransfers.push(incomingTransfer.toJson());
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }

      if (this.getOutgoingTransfer() !== undefined) json.outgoingTransfer = this.getOutgoingTransfer().toJson();
      if (this.getInputSum() !== undefined) json.inputSum = this.getInputSum().toString();
      if (this.getOutputSum() !== undefined) json.outputSum = this.getOutputSum().toString();
      if (this.getChangeAmount() !== undefined) json.changeAmount = this.getChangeAmount().toString();
      delete json.block; // do not serialize parent block

      delete json.txSet; // do not serialize parent tx set

      return json;
    }
  }, {
    key: "getTxSet",
    value: function getTxSet() {
      return this.state.txSet;
    }
  }, {
    key: "setTxSet",
    value: function setTxSet(txSet) {
      this.state.txSet = txSet;
      return this;
    }
  }, {
    key: "isIncoming",
    value: function isIncoming() {
      return this.state.isIncoming;
    }
  }, {
    key: "setIsIncoming",
    value: function setIsIncoming(isIncoming) {
      this.state.isIncoming = isIncoming;
      return this;
    }
  }, {
    key: "isOutgoing",
    value: function isOutgoing() {
      return this.state.isOutgoing;
    }
  }, {
    key: "setIsOutgoing",
    value: function setIsOutgoing(isOutgoing) {
      this.state.isOutgoing = isOutgoing;
      return this;
    }
  }, {
    key: "getIncomingAmount",
    value: function getIncomingAmount() {
      if (this.getIncomingTransfers() === undefined) return undefined;
      var incomingAmt = BigInt("0");

      var _iterator2 = _createForOfIteratorHelper(this.getIncomingTransfers()),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var transfer = _step2.value;
          incomingAmt = incomingAmt + transfer.getAmount();
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }

      return incomingAmt;
    }
  }, {
    key: "getOutgoingAmount",
    value: function getOutgoingAmount() {
      return this.getOutgoingTransfer() ? this.getOutgoingTransfer().getAmount() : undefined;
    }
  }, {
    key: "getTransfers",
    value: function getTransfers(transferQuery) {
      var transfers = [];
      if (this.getOutgoingTransfer() && (!transferQuery || transferQuery.meetsCriteria(this.getOutgoingTransfer()))) transfers.push(this.getOutgoingTransfer());

      if (this.getIncomingTransfers() !== undefined) {
        var _iterator3 = _createForOfIteratorHelper(this.getIncomingTransfers()),
            _step3;

        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var transfer = _step3.value;
            if (!transferQuery || transferQuery.meetsCriteria(transfer)) transfers.push(transfer);
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }
      }

      return transfers;
    }
  }, {
    key: "filterTransfers",
    value: function filterTransfers(transferQuery) {
      var transfers = []; // collect outgoing transfer or erase if filtered

      if (this.getOutgoingTransfer() && (!transferQuery || transferQuery.meetsCriteria(this.getOutgoingTransfer()))) transfers.push(this.getOutgoingTransfer());else this.setOutgoingTransfer(undefined); // collect incoming transfers or erase if filtered

      if (this.getIncomingTransfers() !== undefined) {
        var toRemoves = [];

        var _iterator4 = _createForOfIteratorHelper(this.getIncomingTransfers()),
            _step4;

        try {
          for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
            var transfer = _step4.value;
            if (transferQuery.meetsCriteria(transfer)) transfers.push(transfer);else toRemoves.push(transfer);
          }
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }

        this.setIncomingTransfers(this.getIncomingTransfers().filter(function (transfer) {
          return !toRemoves.includes(transfer);
        }));
        if (this.getIncomingTransfers().length === 0) this.setIncomingTransfers(undefined);
      }

      return transfers;
    }
  }, {
    key: "getIncomingTransfers",
    value: function getIncomingTransfers() {
      return this.state.incomingTransfers;
    }
  }, {
    key: "setIncomingTransfers",
    value: function setIncomingTransfers(incomingTransfers) {
      this.state.incomingTransfers = incomingTransfers;
      return this;
    }
  }, {
    key: "getOutgoingTransfer",
    value: function getOutgoingTransfer() {
      return this.state.outgoingTransfer;
    }
  }, {
    key: "setOutgoingTransfer",
    value: function setOutgoingTransfer(outgoingTransfer) {
      this.state.outgoingTransfer = outgoingTransfer;
      return this;
    }
  }, {
    key: "getInputs",
    value: function getInputs(outputQuery) {
      if (!outputQuery || !(0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroTxWallet.prototype), "getInputs", this).call(this)) return (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroTxWallet.prototype), "getInputs", this).call(this);
      var inputs = [];

      var _iterator5 = _createForOfIteratorHelper((0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroTxWallet.prototype), "getInputs", this).call(this)),
          _step5;

      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var output = _step5.value;
          if (!outputQuery || outputQuery.meetsCriteria(output)) inputs.push(output);
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }

      return inputs;
    }
  }, {
    key: "setInputs",
    value: function setInputs(inputs) {
      // validate that all inputs are wallet inputs
      if (inputs) {
        var _iterator6 = _createForOfIteratorHelper(inputs),
            _step6;

        try {
          for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
            var output = _step6.value;
            if (!(output instanceof _MoneroOutputWallet["default"])) throw new MoneroError("Wallet transaction inputs must be of type MoneroOutputWallet");
          }
        } catch (err) {
          _iterator6.e(err);
        } finally {
          _iterator6.f();
        }
      }

      (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroTxWallet.prototype), "setInputs", this).call(this, inputs);
      return this;
    }
  }, {
    key: "getOutputs",
    value: function getOutputs(outputQuery) {
      if (!outputQuery || !(0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroTxWallet.prototype), "getOutputs", this).call(this)) return (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroTxWallet.prototype), "getOutputs", this).call(this);
      var outputs = [];

      var _iterator7 = _createForOfIteratorHelper((0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroTxWallet.prototype), "getOutputs", this).call(this)),
          _step7;

      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
          var output = _step7.value;
          if (!outputQuery || outputQuery.meetsCriteria(output)) outputs.push(output);
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }

      return outputs;
    }
  }, {
    key: "setOutputs",
    value: function setOutputs(outputs) {
      // validate that all outputs are wallet outputs
      if (outputs) {
        var _iterator8 = _createForOfIteratorHelper(outputs),
            _step8;

        try {
          for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
            var output = _step8.value;
            if (!(output instanceof _MoneroOutputWallet["default"])) throw new MoneroError("Wallet transaction outputs must be of type MoneroOutputWallet");
          }
        } catch (err) {
          _iterator8.e(err);
        } finally {
          _iterator8.f();
        }
      }

      (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroTxWallet.prototype), "setOutputs", this).call(this, outputs);
      return this;
    }
  }, {
    key: "filterOutputs",
    value: function filterOutputs(outputQuery) {
      var outputs = [];

      if ((0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroTxWallet.prototype), "getOutputs", this).call(this)) {
        var toRemoves = [];

        var _iterator9 = _createForOfIteratorHelper((0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroTxWallet.prototype), "getOutputs", this).call(this)),
            _step9;

        try {
          for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
            var output = _step9.value;
            if (!outputQuery || outputQuery.meetsCriteria(output)) outputs.push(output);else toRemoves.push(output);
          }
        } catch (err) {
          _iterator9.e(err);
        } finally {
          _iterator9.f();
        }

        this.setOutputs((0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroTxWallet.prototype), "getOutputs", this).call(this).filter(function (output) {
          return !toRemoves.includes(output);
        }));
        if (this.getOutputs().length === 0) this.setOutputs(undefined);
      }

      return outputs;
    }
  }, {
    key: "getNote",
    value: function getNote() {
      return this.state.note;
    }
  }, {
    key: "setNote",
    value: function setNote(note) {
      this.state.note = note;
      return this;
    }
  }, {
    key: "isLocked",
    value: function isLocked() {
      return this.state.isLocked;
    }
  }, {
    key: "setIsLocked",
    value: function setIsLocked(isLocked) {
      this.state.isLocked = isLocked;
      return this;
    }
  }, {
    key: "getInputSum",
    value: function getInputSum() {
      return this.state.inputSum;
    }
  }, {
    key: "setInputSum",
    value: function setInputSum(inputSum) {
      this.state.inputSum = inputSum;
      return this;
    }
  }, {
    key: "getOutputSum",
    value: function getOutputSum() {
      return this.state.outputSum;
    }
  }, {
    key: "setOutputSum",
    value: function setOutputSum(outputSum) {
      this.state.outputSum = outputSum;
      return this;
    }
  }, {
    key: "getChangeAddress",
    value: function getChangeAddress() {
      return this.state.changeAddress;
    }
  }, {
    key: "setChangeAddress",
    value: function setChangeAddress(changeAddress) {
      this.state.changeAddress = changeAddress;
      return this;
    }
  }, {
    key: "getChangeAmount",
    value: function getChangeAmount() {
      return this.state.changeAmount;
    }
  }, {
    key: "setChangeAmount",
    value: function setChangeAmount(changeAmount) {
      this.state.changeAmount = changeAmount;
      return this;
    }
  }, {
    key: "getNumDummyOutputs",
    value: function getNumDummyOutputs() {
      return this.state.numDummyOutputs;
    }
  }, {
    key: "setNumDummyOutputs",
    value: function setNumDummyOutputs(numDummyOutputs) {
      this.state.numDummyOutputs = numDummyOutputs;
      return this;
    }
  }, {
    key: "getExtraHex",
    value: function getExtraHex() {
      return this.state.extraHex;
    }
  }, {
    key: "setExtraHex",
    value: function setExtraHex(extraHex) {
      this.state.extraHex = extraHex;
      return this;
    }
  }, {
    key: "copy",
    value: function copy() {
      return new MoneroTxWallet(this);
    }
    /**
     * Updates this transaction by merging the latest information from the given
     * transaction.
     * 
     * Merging can modify or build references to the transaction given so it
     * should not be re-used or it should be copied before calling this method.
     * 
     * @param tx is the transaction to merge into this transaction
     */

  }, {
    key: "merge",
    value: function merge(tx) {
      (0, _assert["default"])(tx instanceof MoneroTxWallet);
      if (this === tx) return this; // merge base classes

      (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroTxWallet.prototype), "merge", this).call(this, tx); // merge tx set if they're different which comes back to merging txs
      //import MoneroTxSet from "./MoneroTxSet";

      if (this.getTxSet() !== tx.getTxSet()) {
        if (this.getTxSet() == undefined) {
          this.setTxSet(new _MoneroTxSet["default"]().setTxs([this]));
        }

        if (tx.getTxSet() === undefined) {
          tx.setTxSet(new _MoneroTxSet["default"]().setTxs([tx]));
        }

        this.getTxSet().merge(tx.getTxSet());
        return this;
      } // merge incoming transfers


      if (tx.getIncomingTransfers()) {
        if (this.getIncomingTransfers() === undefined) this.setIncomingTransfers([]);

        var _iterator10 = _createForOfIteratorHelper(tx.getIncomingTransfers()),
            _step10;

        try {
          for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
            var transfer = _step10.value;
            transfer.setTx(this);

            MoneroTxWallet._mergeIncomingTransfer(this.getIncomingTransfers(), transfer);
          }
        } catch (err) {
          _iterator10.e(err);
        } finally {
          _iterator10.f();
        }
      } // merge outgoing transfer


      if (tx.getOutgoingTransfer()) {
        tx.getOutgoingTransfer().setTx(this);
        if (this.getOutgoingTransfer() === undefined) this.setOutgoingTransfer(tx.getOutgoingTransfer());else this.getOutgoingTransfer().merge(tx.getOutgoingTransfer());
      } // merge simple extensions


      this.setIsIncoming(_GenUtils["default"].reconcile(this.isIncoming(), tx.isIncoming()));
      this.setIsOutgoing(_GenUtils["default"].reconcile(this.isOutgoing(), tx.isOutgoing()));
      this.setNote(_GenUtils["default"].reconcile(this.getNote(), tx.getNote()));
      this.setIsLocked(_GenUtils["default"].reconcile(this.isLocked(), tx.isLocked(), {
        resolveTrue: false
      })); // tx can become unlocked

      this.setInputSum(_GenUtils["default"].reconcile(this.getInputSum(), tx.getInputSum()));
      this.setOutputSum(_GenUtils["default"].reconcile(this.getOutputSum(), tx.getOutputSum()));
      this.setChangeAddress(_GenUtils["default"].reconcile(this.getChangeAddress(), tx.getChangeAddress()));
      this.setChangeAmount(_GenUtils["default"].reconcile(this.getChangeAmount(), tx.getChangeAmount()));
      this.setNumDummyOutputs(_GenUtils["default"].reconcile(this.getNumDummyOutputs(), tx.getNumDummyOutputs()));
      this.setExtraHex(_GenUtils["default"].reconcile(this.getExtraHex(), tx.getExtraHex()));
      return this; // for chaining
    }
  }, {
    key: "toString",
    value: function toString() {
      var indent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var oneLine = arguments.length > 1 ? arguments[1] : undefined;
      var str = ""; // represent tx with one line string
      // TODO: proper csv export

      if (oneLine) {
        str += this.getHash() + ", ";
        str += (this.isConfirmed() ? this.getBlock().getTimestamp() : this.getReceivedTimestamp()) + ", ";
        str += this.isConfirmed() + ", ";
        str += (this.getOutgoingAmount() ? this.getOutgoingAmount().toString() : "") + ", ";
        str += this.getIncomingAmount() ? this.getIncomingAmount().toString() : "";
        return str;
      } // otherwise stringify all fields


      str += (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroTxWallet.prototype), "toString", this).call(this, indent) + "\n";
      str += _GenUtils["default"].kvLine("Is incoming", this.isIncoming(), indent);
      str += _GenUtils["default"].kvLine("Incoming amount", this.getIncomingAmount(), indent);

      if (this.getIncomingTransfers() !== undefined) {
        str += _GenUtils["default"].kvLine("Incoming transfers", "", indent);

        for (var i = 0; i < this.getIncomingTransfers().length; i++) {
          str += _GenUtils["default"].kvLine(i + 1, "", indent + 1);
          str += this.getIncomingTransfers()[i].toString(indent + 2) + "\n";
        }
      }

      str += _GenUtils["default"].kvLine("Is outgoing", this.isOutgoing(), indent);
      str += _GenUtils["default"].kvLine("Outgoing amount", this.getOutgoingAmount(), indent);

      if (this.getOutgoingTransfer() !== undefined) {
        str += _GenUtils["default"].kvLine("Outgoing transfer", "", indent);
        str += this.getOutgoingTransfer().toString(indent + 1) + "\n";
      }

      str += _GenUtils["default"].kvLine("Note", this.getNote(), indent);
      str += _GenUtils["default"].kvLine("Is locked", this.isLocked(), indent);
      str += _GenUtils["default"].kvLine("Input sum", this.getInputSum(), indent);
      str += _GenUtils["default"].kvLine("Output sum", this.getOutputSum(), indent);
      str += _GenUtils["default"].kvLine("Change address", this.getChangeAddress(), indent);
      str += _GenUtils["default"].kvLine("Change amount", this.getChangeAmount(), indent);
      str += _GenUtils["default"].kvLine("Num dummy outputs", this.getNumDummyOutputs(), indent);
      str += _GenUtils["default"].kvLine("Extra hex", this.getExtraHex(), indent);
      return str.slice(0, str.length - 1); // strip last newline
    } // private helper to merge transfers

  }], [{
    key: "_mergeIncomingTransfer",
    value: function _mergeIncomingTransfer(transfers, transfer) {
      var _iterator11 = _createForOfIteratorHelper(transfers),
          _step11;

      try {
        for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
          var aTransfer = _step11.value;

          if (aTransfer.getAccountIndex() === transfer.getAccountIndex() && aTransfer.getSubaddressIndex() === transfer.getSubaddressIndex()) {
            aTransfer.merge(transfer);
            return;
          }
        }
      } catch (err) {
        _iterator11.e(err);
      } finally {
        _iterator11.f();
      }

      transfers.push(transfer);
    }
  }]);
  return MoneroTxWallet;
}(_MoneroTx2["default"]);

var _default = MoneroTxWallet;
exports["default"] = _default;