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

var _MoneroDestination = _interopRequireDefault(require("./MoneroDestination"));

var _MoneroError = _interopRequireDefault(require("../../common/MoneroError"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/**
 * Configures a transaction to send, sweep, or create a payment URI.
 */
var MoneroTxConfig = /*#__PURE__*/function () {
  /**
   * <p>Generic request to transfer funds from a wallet.</p>
   * 
   * <p>Examples:</p>
   * 
   * <code>
   * let config1 = new MoneroTxConfig({<br>
   * &nbsp;&nbsp; accountIndex: 0,<br>
   * &nbsp;&nbsp; address: "59aZULsUF3YN...",<br>
   * &nbsp;&nbsp; amount: BigInt("500000"),<br>
   * &nbsp;&nbsp; priority: MoneroTxPriority.NORMAL,<br>
   * &nbsp;&nbsp; relay: true<br>
   * });<br><br>
   * </code>
   * 
   * @param {MoneroTxConfig|object} [config] - configures the transaction to create (optional)
   * @param {string} config.address - single destination address
   * @param {BigInt} config.amount - single destination amount
   * @param {number} config.accountIndex - source account index to transfer funds from
   * @param {number} config.subaddressIndex - source subaddress index to transfer funds from
   * @param {int[]} config.subaddressIndices - source subaddress indices to transfer funds from
   * @param {boolean} config.relay - relay the transaction to peers to commit to the blockchain
   * @param {MoneroTxPriority} [config.priority] - transaction priority (default MoneroTxPriority.NORMAL)
   * @param {MoneroDestination[]} config.destinations - addresses and amounts in a multi-destination tx
   * @param {string} config.paymentId - transaction payment ID
   * @param {number} [config.unlockHeight] - minimum height for the transaction to unlock (default 0)
   * @param {string} config.note - transaction note saved locally with the wallet
   * @param {string} config.recipientName - recipient name saved locally with the wallet
   * @param {boolean} config.canSplit - allow funds to be transferred using multiple transactions
   * @param {BigInt} config.belowAmount - for sweep requests, include outputs below this amount when sweeping wallet, account, subaddress, or all unlocked funds 
   * @param {boolean} config.sweepEachSubaddress - for sweep requests, sweep each subaddress individually instead of together if true
   * @param {string} config.keyImage - key image to sweep (ignored except in sweepOutput() requests)
   */
  function MoneroTxConfig(config, relaxValidation) {
    (0, _classCallCheck2["default"])(this, MoneroTxConfig);
    // relax validation for internal use to process json from rpc or cpp
    if (arguments.length > 2) throw new _MoneroError["default"]("MoneroTxConfig can be constructed with only two parameters but was given " + arguments.length); // initialize internal state

    if (!config) this.state = {};else if (config instanceof MoneroTxConfig) this.state = config.toJson();else if ((0, _typeof2["default"])(config) === "object") {
      this.state = Object.assign({}, config);
      if (relaxValidation && typeof this.state.amount === "number") this.state.amount = BigInt(this.state.amount);
    } else throw new _MoneroError["default"]("Invalid argument given to MoneroTxConfig: " + (0, _typeof2["default"])(config)); // deserialize if necessary

    if (this.state.destinations) {
      (0, _assert["default"])(this.state.address === undefined && this.state.amount === undefined, "Tx configuration may specify destinations or an address/amount but not both");
      this.setDestinations(this.state.destinations.map(function (destination) {
        return destination instanceof _MoneroDestination["default"] ? destination : new _MoneroDestination["default"](destination);
      }));
    } // alias 'address' and 'amount' to single destination to support e.g. createTx({address: "..."})


    if (this.state.address || this.state.amount) {
      (0, _assert["default"])(!this.state.destinations, "Tx configuration may specify destinations or an address/amount but not both");
      this.setAddress(this.state.address);
      this.setAmount(this.state.amount);
      delete this.state.address;
      delete this.state.amount;
    } // alias 'subaddressIndex' to subaddress indices


    if (this.state.subaddressIndex !== undefined) {
      this.setSubaddressIndices([this.state.subaddressIndex]);
      delete this.state.subaddressIndex;
    }
  }

  (0, _createClass2["default"])(MoneroTxConfig, [{
    key: "copy",
    value: function copy() {
      return new MoneroTxConfig(this);
    }
  }, {
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state); // copy state

      if (this.getDestinations() !== undefined) {
        json.destinations = [];

        var _iterator = _createForOfIteratorHelper(this.getDestinations()),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var destination = _step.value;
            json.destinations.push(destination.toJson());
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      }

      if (this.getFee() !== undefined) json.fee = this.getFee().toString();
      if (this.getBelowAmount() !== undefined) json.belowAmount = this.getBelowAmount().toString();
      return json;
    }
    /**
     * Set the address of a single-destination configuration.
     * 
     * @param {string} address - the address to set for the single destination
     * @return {MoneroTxConfig} this configuration for chaining
     */

  }, {
    key: "setAddress",
    value: function setAddress(address) {
      if (this.state.destinations !== undefined && this.state.destinations.length > 1) throw new _MoneroError["default"]("Cannot set address because MoneroTxConfig already has multiple destinations");
      if (this.state.destinations === undefined || this.state.destinations.length === 0) this.addDestination(new _MoneroDestination["default"](address));else this.state.destinations[0].setAddress(address);
      return this;
    }
    /**
     * Get the address of a single-destination configuration.
     * 
     * @return {string} the address of the single destination
     */

  }, {
    key: "getAddress",
    value: function getAddress() {
      if (this.state.destinations === undefined || this.state.destinations.length !== 1) throw new _MoneroError["default"]("Cannot get address because MoneroTxConfig does not have exactly one destination");
      return this.state.destinations[0].getAddress();
    }
    /**
     * Set the amount of a single-destination configuration.
     * 
     * @param {BigInt|string} amount - the amount to set for the single destination
     * @return {MoneroTxConfig} this configuration for chaining
     */

  }, {
    key: "setAmount",
    value: function setAmount(amount) {
      if (amount !== undefined && !(this.state.amount instanceof BigInt)) {
        if (typeof amount === "number") throw new _MoneroError["default"]("Destination amount must be BigInt or string");

        try {
          amount = BigInt(amount);
        } catch (err) {
          throw new _MoneroError["default"]("Invalid destination amount: " + amount);
        }
      }

      if (this.state.destinations !== undefined && this.state.destinations.length > 1) throw new _MoneroError["default"]("Cannot set amount because MoneroTxConfig already has multiple destinations");
      if (this.state.destinations === undefined || this.state.destinations.length === 0) this.addDestination(new _MoneroDestination["default"](undefined, amount));else this.state.destinations[0].setAmount(amount);
      return this;
    }
    /**
     * Get the amount of a single-destination configuration.
     * 
     * @return {BigInt} the amount of the single destination
     */

  }, {
    key: "getAmount",
    value: function getAmount() {
      if (this.state.destinations === undefined || this.state.destinations.length !== 1) throw new _MoneroError["default"]("Cannot get amount because MoneroTxConfig does not have exactly one destination");
      return this.state.destinations[0].getAmount();
    }
  }, {
    key: "addDestination",
    value: function addDestination(destinationOrAddress, amount) {
      if (typeof destinationOrAddress === "string") return this.addDestination(new _MoneroDestination["default"](destinationOrAddress, amount));
      (0, _assert["default"])(destinationOrAddress instanceof _MoneroDestination["default"]);
      if (this.state.destinations === undefined) this.state.destinations = [];
      this.state.destinations.push(destinationOrAddress);
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
      if (arguments.length > 1) destinations = Array.from(arguments);
      this.state.destinations = destinations;
      return this;
    }
  }, {
    key: "setDestination",
    value: function setDestination(destination) {
      return this.setDestinations(destination ? [destination] : destination);
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
    key: "getPriority",
    value: function getPriority() {
      return this.state.priority;
    }
  }, {
    key: "setPriority",
    value: function setPriority(priority) {
      this.state.priority = priority;
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
    key: "getAccountIndex",
    value: function getAccountIndex() {
      return this.state.accountIndex;
    }
  }, {
    key: "setAccountIndex",
    value: function setAccountIndex(accountIndex) {
      this.state.accountIndex = accountIndex;
      return this;
    }
  }, {
    key: "setSubaddressIndex",
    value: function setSubaddressIndex(subaddressIndex) {
      this.setSubaddressIndices([subaddressIndex]);
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
      if (arguments.length > 1) subaddressIndices = Array.from(arguments);
      this.state.subaddressIndices = subaddressIndices;
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
    key: "getCanSplit",
    value: function getCanSplit() {
      return this.state.canSplit;
    }
  }, {
    key: "setCanSplit",
    value: function setCanSplit(canSplit) {
      this.state.canSplit = canSplit;
      return this;
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
    key: "getRecipientName",
    value: function getRecipientName() {
      return this.state.recipientName;
    }
  }, {
    key: "setRecipientName",
    value: function setRecipientName(recipientName) {
      this.state.recipientName = recipientName;
      return this;
    } // --------------------------- SPECIFIC TO SWEEP ----------------------------

  }, {
    key: "getBelowAmount",
    value: function getBelowAmount() {
      return this.state.belowAmount;
    }
  }, {
    key: "setBelowAmount",
    value: function setBelowAmount(belowAmount) {
      this.state.belowAmount = belowAmount;
      return this;
    }
  }, {
    key: "getSweepEachSubaddress",
    value: function getSweepEachSubaddress() {
      return this.state.sweepEachSubaddress;
    }
  }, {
    key: "setSweepEachSubaddress",
    value: function setSweepEachSubaddress(sweepEachSubaddress) {
      this.state.sweepEachSubaddress = sweepEachSubaddress;
      return this;
    }
    /**
     * Get the key image hex of the output to sweep.
     * 
     * return {string} is the key image hex of the output to sweep
     */

  }, {
    key: "getKeyImage",
    value: function getKeyImage() {
      return this.state.keyImage;
    }
    /**
     * Set the key image hex of the output to sweep.
     * 
     * @param {string} keyImage is the key image hex of the output to sweep
     */

  }, {
    key: "setKeyImage",
    value: function setKeyImage(keyImage) {
      this.state.keyImage = keyImage;
      return this;
    }
  }]);
  return MoneroTxConfig;
}();

var _default = MoneroTxConfig;
exports["default"] = _default;