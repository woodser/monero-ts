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

var _MoneroOutputQuery = _interopRequireDefault(require("./MoneroOutputQuery"));

var _MoneroTransferQuery = _interopRequireDefault(require("./MoneroTransferQuery"));

var _MoneroTxWallet2 = _interopRequireDefault(require("./MoneroTxWallet"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * <p>Configuration to query transactions.</p>
 * 
 * @class
 * @extends {MoneroTxWallet}
 */
var MoneroTxQuery = /*#__PURE__*/function (_MoneroTxWallet) {
  (0, _inherits2["default"])(MoneroTxQuery, _MoneroTxWallet);

  var _super = _createSuper(MoneroTxQuery);

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
   * @param {object} config - tx query configuration
   * @param {string} config.hash - get a tx with this hash
   * @param {string[]} config.txHashes - get txs with these hashes
   * @param {number} config.height - get txs with this height
   * @param {number} config.minHeight - get txs with height greater than or equal to this height
   * @param {number} config.maxHeight - get txs with height less than or equal to this height
   * @param {boolean} config.isConfirmed - get confirmed or unconfirmed txs
   * @param {boolean} config.inTxPool - get txs in or out of the tx pool
   * @param {boolean} config.relay - get txs with the same relay status
   * @param {boolean} config.isRelayed - get relayed or non-relayed txs
   * @param {boolean} config.isFailed - get failed or non-failed txs
   * @param {boolean} config.isMinerTx - get miner or non-miner txs
   * @param {boolean} config.isLocked - get locked or unlocked txs
   * @param {boolean} config.isIncoming - get txs with or without incoming transfers
   * @param {boolean} config.isOutgoing - get txs with or without outgoing transfers
   * @param {string} config.paymentId - get txs with this payment ID
   * @param {string} config.paymentIds - get txs with a payment ID among these payment IDs
   * @param {boolean} config.hasPaymentId - get txs with or without payment IDs
   * @param {object|MoneroTransferQuery} config.transferQuery - get txs with transfers matching this transfer query
   * @param {object|MoneroOutputQuery} config.inputQuery - get txs with inputs matching this input query
   * @param {object|MoneroOutputQuery} config.outputQuery - get txs with outputs matching this output query
   */
  function MoneroTxQuery(config) {
    var _this;

    (0, _classCallCheck2["default"])(this, MoneroTxQuery);
    _this = _super.call(this, config); // deserialize if necessary

    if (_this.state.transferQuery && !(_this.state.transferQuery instanceof _MoneroTransferQuery["default"])) _this.state.transferQuery = new _MoneroTransferQuery["default"](_this.state.transferQuery);
    if (_this.state.inputQuery && !(_this.state.inputQuery instanceof _MoneroOutputQuery["default"])) _this.state.inputQuery = new _MoneroOutputQuery["default"](_this.state.inputQuery);
    if (_this.state.outputQuery && !(_this.state.outputQuery instanceof _MoneroOutputQuery["default"])) _this.state.outputQuery = new _MoneroOutputQuery["default"](_this.state.outputQuery); // link cycles

    if (_this.state.transferQuery) _this.state.transferQuery.setTxQuery((0, _assertThisInitialized2["default"])(_this));
    if (_this.state.inputQuery) _this.state.inputQuery.setTxQuery((0, _assertThisInitialized2["default"])(_this));
    if (_this.state.outputQuery) _this.state.outputQuery.setTxQuery((0, _assertThisInitialized2["default"])(_this)); // alias 'hash' to hashes

    if (_this.state.hash) {
      _this.setHashes([_this.state.hash]);

      delete _this.state.hash;
    }

    return _this;
  }

  (0, _createClass2["default"])(MoneroTxQuery, [{
    key: "copy",
    value: function copy() {
      return new MoneroTxQuery(this);
    }
  }, {
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state, (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroTxQuery.prototype), "toJson", this).call(this)); // merge json onto inherited state

      if (this.getTransferQuery() !== undefined) json.transferQuery = this.getTransferQuery().toJson();
      if (this.getInputQuery() !== undefined) json.inputQuery = this.getInputQuery().toJson();
      if (this.getOutputQuery() !== undefined) json.outputQuery = this.getOutputQuery().toJson();
      delete json.block; // do not serialize parent block

      return json;
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
    key: "getHashes",
    value: function getHashes() {
      return this.state.hashes;
    }
  }, {
    key: "setHashes",
    value: function setHashes(hashes) {
      this.state.hashes = hashes;
      return this;
    }
  }, {
    key: "setHash",
    value: function setHash(hash) {
      if (hash === undefined) return this.setHashes(undefined);
      (0, _assert["default"])(typeof hash === "string");
      return this.setHashes([hash]);
    }
  }, {
    key: "hasPaymentId",
    value: function hasPaymentId() {
      return this.state.hasPaymentId;
    }
  }, {
    key: "setHasPaymentId",
    value: function setHasPaymentId() {
      this.state.hasPaymentId = hasPaymentId;
      return this;
    }
  }, {
    key: "getPaymentIds",
    value: function getPaymentIds() {
      return this.state.paymentIds;
    }
  }, {
    key: "setPaymentIds",
    value: function setPaymentIds(paymentIds) {
      this.state.paymentIds = paymentIds;
      return this;
    }
  }, {
    key: "setPaymentId",
    value: function setPaymentId(paymentId) {
      if (paymentId === undefined) return this.setPaymentIds(undefined);
      (0, _assert["default"])(typeof paymentId === "string");
      return this.setPaymentIds([paymentId]);
    }
  }, {
    key: "getHeight",
    value: function getHeight() {
      return this.state.height;
    }
  }, {
    key: "setHeight",
    value: function setHeight(height) {
      this.state.height = height;
      return this;
    }
  }, {
    key: "getMinHeight",
    value: function getMinHeight() {
      return this.state.minHeight;
    }
  }, {
    key: "setMinHeight",
    value: function setMinHeight(minHeight) {
      this.state.minHeight = minHeight;
      return this;
    }
  }, {
    key: "getMaxHeight",
    value: function getMaxHeight() {
      return this.state.maxHeight;
    }
  }, {
    key: "setMaxHeight",
    value: function setMaxHeight(maxHeight) {
      this.state.maxHeight = maxHeight;
      return this;
    }
  }, {
    key: "getIncludeOutputs",
    value: function getIncludeOutputs() {
      return this.state.includeOutputs;
    }
  }, {
    key: "setIncludeOutputs",
    value: function setIncludeOutputs(includeOutputs) {
      this.state.includeOutputs = includeOutputs;
      return this;
    }
  }, {
    key: "getTransferQuery",
    value: function getTransferQuery() {
      return this.state.transferQuery;
    }
  }, {
    key: "setTransferQuery",
    value: function setTransferQuery(transferQuery) {
      this.state.transferQuery = transferQuery;
      if (transferQuery) transferQuery.state.txQuery = this;
      return this;
    }
  }, {
    key: "getInputQuery",
    value: function getInputQuery() {
      return this.state.inputQuery;
    }
  }, {
    key: "setInputQuery",
    value: function setInputQuery(inputQuery) {
      this.state.inputQuery = inputQuery;
      if (inputQuery) inputQuery.state.txQuery = this;
      return this;
    }
  }, {
    key: "getOutputQuery",
    value: function getOutputQuery() {
      return this.state.outputQuery;
    }
  }, {
    key: "setOutputQuery",
    value: function setOutputQuery(outputQuery) {
      this.state.outputQuery = outputQuery;
      if (outputQuery) outputQuery.state.txQuery = this;
      return this;
    }
  }, {
    key: "meetsCriteria",
    value: function meetsCriteria(tx, queryChildren) {
      if (!(tx instanceof _MoneroTxWallet2["default"])) throw new Error("Tx not given to MoneroTxQuery.meetsCriteria(tx)");
      if (queryChildren === undefined) queryChildren = true; // filter on tx

      if (this.getHash() !== undefined && this.getHash() !== tx.getHash()) return false;
      if (this.getPaymentId() !== undefined && this.getPaymentId() !== tx.getPaymentId()) return false;
      if (this.isConfirmed() !== undefined && this.isConfirmed() !== tx.isConfirmed()) return false;
      if (this.inTxPool() !== undefined && this.inTxPool() !== tx.inTxPool()) return false;
      if (this.getRelay() !== undefined && this.getRelay() !== tx.getRelay()) return false;
      if (this.isRelayed() !== undefined && this.isRelayed() !== tx.isRelayed()) return false;
      if (this.isFailed() !== undefined && this.isFailed() !== tx.isFailed()) return false;
      if (this.isMinerTx() !== undefined && this.isMinerTx() !== tx.isMinerTx()) return false;
      if (this.isLocked() !== undefined && this.isLocked() !== tx.isLocked()) return false; // filter on having a payment id

      if (this.hasPaymentId() !== undefined) {
        if (this.hasPaymentId() && tx.getPaymentId() === undefined) return false;
        if (!this.hasPaymentId() && tx.getPaymentId() !== undefined) return false;
      } // filter on incoming


      if (this.isIncoming() !== undefined) {
        if (this.isIncoming() && !tx.isIncoming()) return false;
        if (!this.isIncoming() && tx.isIncoming()) return false;
      } // filter on outgoing


      if (this.isOutgoing() !== undefined) {
        if (this.isOutgoing() && !tx.isOutgoing()) return false;
        if (!this.isOutgoing() && tx.isOutgoing()) return false;
      } // filter on remaining fields


      var txHeight = tx.getBlock() === undefined ? undefined : tx.getBlock().getHeight();
      if (this.getHashes() !== undefined && !this.getHashes().includes(tx.getHash())) return false;
      if (this.getPaymentIds() !== undefined && !this.getPaymentIds().includes(tx.getPaymentId())) return false;
      if (this.getHeight() !== undefined && (txHeight === undefined || txHeight !== this.getHeight())) return false;
      if (this.getMinHeight() !== undefined && txHeight !== undefined && txHeight < this.getMinHeight()) return false; // do not filter unconfirmed

      if (this.getMaxHeight() !== undefined && (txHeight === undefined || txHeight > this.getMaxHeight())) return false; // TODO: filtering not complete
      // done if not querying transfers or outputs

      if (!queryChildren) return true; // at least one transfer must meet transfer filter if defined

      if (this.getTransferQuery() !== undefined) {
        var matchFound = false;
        if (tx.getOutgoingTransfer() && this.getTransferQuery().meetsCriteria(tx.getOutgoingTransfer(), false)) matchFound = true;else if (tx.getIncomingTransfers()) {
          var _iterator = _createForOfIteratorHelper(tx.getIncomingTransfers()),
              _step;

          try {
            for (_iterator.s(); !(_step = _iterator.n()).done;) {
              var incomingTransfer = _step.value;

              if (this.getTransferQuery().meetsCriteria(incomingTransfer, false)) {
                matchFound = true;
                break;
              }
            }
          } catch (err) {
            _iterator.e(err);
          } finally {
            _iterator.f();
          }
        }
        if (!matchFound) return false;
      } // at least one input must meet input query if defined


      if (this.getInputQuery() !== undefined) {
        if (tx.getInputs() === undefined || tx.getInputs().length === 0) return false;
        var _matchFound = false;

        var _iterator2 = _createForOfIteratorHelper(tx.getInputs()),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var input = _step2.value;

            if (this.getInputQuery().meetsCriteria(input, false)) {
              _matchFound = true;
              break;
            }
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }

        if (!_matchFound) return false;
      } // at least one output must meet output query if defined


      if (this.getOutputQuery() !== undefined) {
        if (tx.getOutputs() === undefined || tx.getOutputs().length === 0) return false;
        var _matchFound2 = false;

        var _iterator3 = _createForOfIteratorHelper(tx.getOutputs()),
            _step3;

        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var output = _step3.value;

            if (this.getOutputQuery().meetsCriteria(output, false)) {
              _matchFound2 = true;
              break;
            }
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }

        if (!_matchFound2) return false;
      }

      return true; // transaction meets filter criteria
    }
  }]);
  return MoneroTxQuery;
}(_MoneroTxWallet2["default"]);

var _default = MoneroTxQuery;
exports["default"] = _default;