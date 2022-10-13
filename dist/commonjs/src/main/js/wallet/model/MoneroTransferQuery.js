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

var _MoneroIncomingTransfer = _interopRequireDefault(require("./MoneroIncomingTransfer"));

var _MoneroOutgoingTransfer = _interopRequireDefault(require("./MoneroOutgoingTransfer"));

var _MoneroTransfer2 = _interopRequireDefault(require("./MoneroTransfer"));

var _MoneroTxQuery = _interopRequireDefault(require("./MoneroTxQuery"));

var _MoneroError = _interopRequireDefault(require("../../common/MoneroError"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Configuration to query wallet transfers.
 * 
 * @extends {MoneroTransfer}
 */
var MoneroTransferQuery = /*#__PURE__*/function (_MoneroTransfer) {
  (0, _inherits2["default"])(MoneroTransferQuery, _MoneroTransfer);

  var _super = _createSuper(MoneroTransferQuery);

  /**
   * <p>Construct the transfer query.</p>
   * 
   * <p>Example:</p>
   * 
   * <code>
   * &sol;&sol; get incoming transfers to account 0, subaddress 1<br>
   * let transfers = await wallet.getTransfers({<br>
   * &nbsp;&nbsp; accountIndex: 0,<br>
   * &nbsp;&nbsp; subaddressIndex: 0<br>
   * });
   * </code>
   * 
   * <p>All configuration is optional.  All transfers are returned except those that don't meet criteria defined in this query.</p>
   * 
   * @param {object} [config] - transfer query configuration (optional)
   * @param {BigInt} config.amount - get transfers with this amount
   * @param {number} config.accountIndex - get transfers to/from this account index
   * @param {number} config.subaddressIndex - get transfers to/from this subaddress index
   * @param {int[]} config.subaddressIndices - get transfers to/from these subaddress indices
   * @param {string} config.address - get transfers to/from this wallet address
   * @param {string[]} config.addresses - get transfers to/from these wallet addresses
   * @param {boolean} config.isIncoming - get transfers which are incoming if true
   * @param {boolean} config.isOutgoing - get transfers which are outgoing if true
   * @param {boolean} config.hasDestinations - get transfers with known destinations if true (destinations are only stored locally with the wallet)
   * @param {object|MoneroTxQuery} config.txQuery - get transfers whose tx match this tx query
   */
  function MoneroTransferQuery(config) {
    var _this;

    (0, _classCallCheck2["default"])(this, MoneroTransferQuery);
    _this = _super.call(this, config); // deserialize if necessary
    //import MoneroTxQuery from "./MoneroTxQuery";

    if (_this.state.txQuery && !(_this.state.txQuery instanceof _MoneroTxQuery["default"])) _this.state.txQuery = new _MoneroTxQuery["default"](_this.state.txQuery);
    if (_this.state.txQuery) _this.state.txQuery.setTransferQuery((0, _assertThisInitialized2["default"])(_this)); // alias isOutgoing to isIncoming

    if (_this.state.isOutgoing !== undefined) _this.state.isIncoming = !_this.state.isOutgoing; // validate state

    _this._validate();

    return _this;
  }

  (0, _createClass2["default"])(MoneroTransferQuery, [{
    key: "copy",
    value: function copy() {
      return new MoneroTransferQuery(this);
    }
  }, {
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state, (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroTransferQuery.prototype), "toJson", this).call(this));
      delete json.txQuery;
      return json;
    }
  }, {
    key: "getTxQuery",
    value: function getTxQuery() {
      return this.state.txQuery;
    }
  }, {
    key: "setTxQuery",
    value: function setTxQuery(txQuery) {
      this.state.txQuery = txQuery;
      if (txQuery) txQuery.state.transferQuery = this;
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
      return this.state.isIncoming === undefined ? undefined : !this.state.isIncoming;
    }
  }, {
    key: "setIsOutgoing",
    value: function setIsOutgoing(isOutgoing) {
      this.state.isIncoming = isOutgoing === undefined ? undefined : !isOutgoing;
      return this;
    }
  }, {
    key: "getAddress",
    value: function getAddress() {
      return this.state.address;
    }
  }, {
    key: "setAddress",
    value: function setAddress(address) {
      this.state.address = address;
      return this;
    }
  }, {
    key: "getAddresses",
    value: function getAddresses() {
      return this.state.addresses;
    }
  }, {
    key: "setAddresses",
    value: function setAddresses(addresses) {
      this.state.addresses = addresses;
      return this;
    }
  }, {
    key: "getSubaddressIndex",
    value: function getSubaddressIndex() {
      return this.state.subaddressIndex;
    }
  }, {
    key: "setSubaddressIndex",
    value: function setSubaddressIndex(subaddressIndex) {
      this.state.subaddressIndex = subaddressIndex;

      this._validate();

      return this;
    }
  }, {
    key: "getSubaddressIndices",
    value: function getSubaddressIndices() {
      return this.state.subaddressIndices;
    }
  }, {
    key: "setSubaddressIndices",
    value: function setSubaddressIndices(subaddressIndices) {
      this.state.subaddressIndices = subaddressIndices;

      this._validate();

      return this;
    }
  }, {
    key: "getDestinations",
    value: function getDestinations() {
      return this.state.destinations;
    }
  }, {
    key: "setDestinations",
    value: function setDestinations(destinations) {
      this.state.destinations = destinations;
      return this;
    }
  }, {
    key: "hasDestinations",
    value: function hasDestinations() {
      return this.state.hasDestinations;
    }
  }, {
    key: "setHasDestinations",
    value: function setHasDestinations(hasDestinations) {
      this.state.hasDestinations = hasDestinations;
      return this;
    }
    /**
     * Convenience method to query outputs by the locked state of their tx.
     * 
     * @param isLocked specifies if the output's tx must be locked or unlocked (optional)
     * @return {MoneroOutputQuery} this query for chaining
     */

  }, {
    key: "setIsLocked",
    value: function setIsLocked(isLocked) {
      if (this.state.txQuery === undefined) this.state.txQuery = new _MoneroTxQuery["default"]();
      this.state.txQuery.setIsLocked(isLocked);
      return this;
    }
  }, {
    key: "meetsCriteria",
    value: function meetsCriteria(transfer, queryParent) {
      if (!(transfer instanceof _MoneroTransfer2["default"])) throw new Error("Transfer not given to MoneroTransferQuery.meetsCriteria(transfer)");
      if (queryParent === undefined) queryParent = true; // filter on common fields

      if (this.isIncoming() !== undefined && this.isIncoming() !== transfer.isIncoming()) return false;
      if (this.isOutgoing() !== undefined && this.isOutgoing() !== transfer.isOutgoing()) return false;
      if (this.getAmount() !== undefined && GenUtils.compareBigInt(this.getAmount(), transfer.getAmount()) !== 0) return false;
      if (this.getAccountIndex() !== undefined && this.getAccountIndex() !== transfer.getAccountIndex()) return false; // filter on incoming fields

      if (transfer instanceof _MoneroIncomingTransfer["default"]) {
        if (this.hasDestinations() !== undefined) return false;
        if (this.getAddress() !== undefined && this.getAddress() !== transfer.getAddress()) return false;
        if (this.getAddresses() !== undefined && !this.getAddresses().includes(transfer.getAddress())) return false;
        if (this.getSubaddressIndex() !== undefined && this.getSubaddressIndex() !== transfer.getSubaddressIndex()) return false;
        if (this.getSubaddressIndices() !== undefined && !this.getSubaddressIndices().includes(transfer.getSubaddressIndex())) return false;
      } // filter on outgoing fields
      else if (transfer instanceof _MoneroOutgoingTransfer["default"]) {
        // filter on addresses which must have overlap
        if (this.getAddress() !== undefined && (transfer.getAddresses() === undefined || !transfer.getAddresses().includes(this.getAddress()))) return false; // TODO: will filter all transfers that don't contain addresses (outgoing txs might not have this field initialized)

        if (this.getAddresses() !== undefined) {
          if (!transfer.getAddresses()) return false;
          if (!this.getAddresses().some(function (address) {
            return transfer.getAddresses().includes(address);
          })) return false;
        } // filter on subaddress indices


        if (this.getSubaddressIndex() !== undefined && (transfer.getSubaddressIndices() === undefined || !transfer.getSubaddressIndices().includes(this.getSubaddressIndex()))) return false;

        if (this.getSubaddressIndices() !== undefined) {
          if (!transfer.getSubaddressIndices()) return false;
          if (!this.getSubaddressIndices().some(function (subaddressIdx) {
            return transfer.getSubaddressIndices().includes(subaddressIdx);
          })) return false;
        } // filter on having destinations


        if (this.hasDestinations() !== undefined) {
          if (this.hasDestinations() && transfer.getDestinations() === undefined) return false;
          if (!this.hasDestinations() && transfer.getDestinations() !== undefined) return false;
        } // filter on destinations TODO: start with test for this
        //    if (this.getDestionations() !== undefined && this.getDestionations() !== transfer.getDestionations()) return false;

      } // otherwise invalid type
      else throw new Error("Transfer must be MoneroIncomingTransfer or MoneroOutgoingTransfer"); // filter with tx filter


      if (queryParent && this.getTxQuery() !== undefined && !this.getTxQuery().meetsCriteria(transfer.getTx())) return false;
      return true;
    }
  }, {
    key: "_validate",
    value: function _validate() {
      if (this.getSubaddressIndex() !== undefined && this.getSubaddressIndex() < 0) throw new _MoneroError["default"]("Subaddress index must be >= 0");

      if (this.getSubaddressIndices() !== undefined) {
        var _iterator = _createForOfIteratorHelper(this.getSubaddressIndices()),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var subaddressIdx = _step.value;
            if (subaddressIdx < 0) throw new _MoneroError["default"]("Subaddress indices must be >= 0");
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }
    }
  }]);
  return MoneroTransferQuery;
}(_MoneroTransfer2["default"]);

var _default = MoneroTransferQuery;
exports["default"] = _default;