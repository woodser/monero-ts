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

/**
 * Models a Monero block header which contains information about the block.
 * 
 * @class
 */
var MoneroBlockHeader = /*#__PURE__*/function () {
  /**
   * Construct the model.
   * 
   * @param {MoneroBlockHeader|object} state is existing state to initialize from (optional)
   */
  function MoneroBlockHeader(state) {
    (0, _classCallCheck2["default"])(this, MoneroBlockHeader);
    // initialize internal state
    if (!state) state = {};else if (state instanceof MoneroBlockHeader) state = state.toJson();else if ((0, _typeof2["default"])(state) === "object") state = Object.assign({}, state);else throw new MoneroError("state must be a MoneroBlockHeader or JavaScript object");
    this.state = state; // deserialize BigInts

    if (state.difficulty !== undefined && !(state.difficulty instanceof BigInt)) state.difficulty = BigInt(state.difficulty);
    if (state.cumulativeDifficulty !== undefined && !(state.cumulativeDifficulty instanceof BigInt)) state.cumulativeDifficulty = BigInt(state.cumulativeDifficulty);
    if (state.reward !== undefined && !(state.reward instanceof BigInt)) state.reward = BigInt(state.reward);
  }

  (0, _createClass2["default"])(MoneroBlockHeader, [{
    key: "copy",
    value: function copy() {
      return new MoneroBlockHeader(this);
    }
  }, {
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state);
      if (this.getDifficulty() !== undefined) json.difficulty = this.getDifficulty().toString();
      if (this.getCumulativeDifficulty() !== undefined) json.cumulativeDifficulty = this.getCumulativeDifficulty().toString();
      if (this.getReward() !== undefined) json.reward = this.getReward().toString();
      return json;
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
    /**
     * Return the block's height which is the total number of blocks that have occurred before.
     * 
     * @return {number} the block's height
     */

  }, {
    key: "getHeight",
    value: function getHeight() {
      return this.state.height;
    }
    /**
     * Set the block's height which is the total number of blocks that have occurred before.
     * 
     * @param {number} height is the block's height to set
     * @return {MoneroBlockHeader} a reference to this header for chaining
     */

  }, {
    key: "setHeight",
    value: function setHeight(height) {
      this.state.height = height;
      return this;
    }
  }, {
    key: "getTimestamp",
    value: function getTimestamp() {
      return this.state.timestamp;
    }
  }, {
    key: "setTimestamp",
    value: function setTimestamp(timestamp) {
      this.state.timestamp = timestamp;
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
    key: "getLongTermWeight",
    value: function getLongTermWeight() {
      return this.state.longTermWeight;
    }
  }, {
    key: "setLongTermWeight",
    value: function setLongTermWeight(longTermWeight) {
      this.state.longTermWeight = longTermWeight;
      return this;
    }
  }, {
    key: "getDepth",
    value: function getDepth() {
      return this.state.depth;
    }
  }, {
    key: "setDepth",
    value: function setDepth(depth) {
      this.state.depth = depth;
      return this;
    }
  }, {
    key: "getDifficulty",
    value: function getDifficulty() {
      return this.state.difficulty;
    }
  }, {
    key: "setDifficulty",
    value: function setDifficulty(difficulty) {
      this.state.difficulty = difficulty;
      return this;
    }
  }, {
    key: "getCumulativeDifficulty",
    value: function getCumulativeDifficulty() {
      return this.state.cumulativeDifficulty;
    }
  }, {
    key: "setCumulativeDifficulty",
    value: function setCumulativeDifficulty(cumulativeDifficulty) {
      this.state.cumulativeDifficulty = cumulativeDifficulty;
      return this;
    }
  }, {
    key: "getMajorVersion",
    value: function getMajorVersion() {
      return this.state.majorVersion;
    }
  }, {
    key: "setMajorVersion",
    value: function setMajorVersion(majorVersion) {
      this.state.majorVersion = majorVersion;
      return this;
    }
  }, {
    key: "getMinorVersion",
    value: function getMinorVersion() {
      return this.state.minorVersion;
    }
  }, {
    key: "setMinorVersion",
    value: function setMinorVersion(minorVersion) {
      this.state.minorVersion = minorVersion;
      return this;
    }
  }, {
    key: "getNonce",
    value: function getNonce() {
      return this.state.nonce;
    }
  }, {
    key: "setNonce",
    value: function setNonce(nonce) {
      this.state.nonce = nonce;
      return this;
    }
  }, {
    key: "getMinerTxHash",
    value: function getMinerTxHash() {
      return this.state.minerTxHash;
    }
  }, {
    key: "setMinerTxHash",
    value: function setMinerTxHash(minerTxHash) {
      this.state.minerTxHash = minerTxHash;
      return this;
    }
  }, {
    key: "getNumTxs",
    value: function getNumTxs() {
      return this.state.numTxs;
    }
  }, {
    key: "setNumTxs",
    value: function setNumTxs(numTxs) {
      this.state.numTxs = numTxs;
      return this;
    }
  }, {
    key: "getOrphanStatus",
    value: function getOrphanStatus() {
      return this.state.orphanStatus;
    }
  }, {
    key: "setOrphanStatus",
    value: function setOrphanStatus(orphanStatus) {
      this.state.orphanStatus = orphanStatus;
      return this;
    }
  }, {
    key: "getPrevHash",
    value: function getPrevHash() {
      return this.state.prevHash;
    }
  }, {
    key: "setPrevHash",
    value: function setPrevHash(prevHash) {
      this.state.prevHash = prevHash;
      return this;
    }
  }, {
    key: "getReward",
    value: function getReward() {
      return this.state.reward;
    }
  }, {
    key: "setReward",
    value: function setReward(reward) {
      this.state.reward = reward;
      return this;
    }
  }, {
    key: "getPowHash",
    value: function getPowHash() {
      return this.state.powHash;
    }
  }, {
    key: "setPowHash",
    value: function setPowHash(powHash) {
      this.state.powHash = powHash;
      return this;
    }
  }, {
    key: "merge",
    value: function merge(header) {
      (0, _assert["default"])(header instanceof MoneroBlockHeader);
      if (this === header) return this;
      this.setHash(_GenUtils["default"].reconcile(this.getHash(), header.getHash()));
      this.setHeight(_GenUtils["default"].reconcile(this.getHeight(), header.getHeight(), {
        resolveMax: true
      })); // height can increase

      this.setTimestamp(_GenUtils["default"].reconcile(this.getTimestamp(), header.getTimestamp(), {
        resolveMax: true
      })); // block timestamp can increase

      this.setSize(_GenUtils["default"].reconcile(this.getSize(), header.getSize()));
      this.setWeight(_GenUtils["default"].reconcile(this.getWeight(), header.getWeight()));
      this.setDepth(_GenUtils["default"].reconcile(this.getDepth(), header.getDepth()));
      this.setDifficulty(_GenUtils["default"].reconcile(this.getDifficulty(), header.getDifficulty()));
      this.setCumulativeDifficulty(_GenUtils["default"].reconcile(this.getCumulativeDifficulty(), header.getCumulativeDifficulty()));
      this.setMajorVersion(_GenUtils["default"].reconcile(this.getMajorVersion(), header.getMajorVersion()));
      this.setMinorVersion(_GenUtils["default"].reconcile(this.getMinorVersion(), header.getMinorVersion()));
      this.setNonce(_GenUtils["default"].reconcile(this.getNonce(), header.getNonce()));
      this.setMinerTxHash(_GenUtils["default"].reconcile(this.getMinerTxHash(), header.getMinerTxHash()));
      this.setNumTxs(_GenUtils["default"].reconcile(this.getNumTxs(), header.getNumTxs()));
      this.setOrphanStatus(_GenUtils["default"].reconcile(this.getOrphanStatus(), header.getOrphanStatus()));
      this.setPrevHash(_GenUtils["default"].reconcile(this.getPrevHash(), header.getPrevHash()));
      this.setReward(_GenUtils["default"].reconcile(this.getReward(), header.getReward()));
      this.setPowHash(_GenUtils["default"].reconcile(this.getPowHash(), header.getPowHash()));
      return this;
    }
  }, {
    key: "toString",
    value: function toString() {
      var indent = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;
      var str = "";
      str += _GenUtils["default"].kvLine("Hash", this.getHash(), indent);
      str += _GenUtils["default"].kvLine("Height", this.getHeight(), indent);
      str += _GenUtils["default"].kvLine("Timestamp", this.getTimestamp(), indent);
      str += _GenUtils["default"].kvLine("Size", this.getSize(), indent);
      str += _GenUtils["default"].kvLine("Weight", this.getWeight(), indent);
      str += _GenUtils["default"].kvLine("Depth", this.getDepth(), indent);
      str += _GenUtils["default"].kvLine("Difficulty", this.getDifficulty(), indent);
      str += _GenUtils["default"].kvLine("Cumulative difficulty", this.getCumulativeDifficulty(), indent);
      str += _GenUtils["default"].kvLine("Major version", this.getMajorVersion(), indent);
      str += _GenUtils["default"].kvLine("Minor version", this.getMinorVersion(), indent);
      str += _GenUtils["default"].kvLine("Nonce", this.getNonce(), indent);
      str += _GenUtils["default"].kvLine("Miner tx hash", this.getMinerTxHash(), indent);
      str += _GenUtils["default"].kvLine("Num txs", this.getNumTxs(), indent);
      str += _GenUtils["default"].kvLine("Orphan status", this.getOrphanStatus(), indent);
      str += _GenUtils["default"].kvLine("Prev hash", this.getPrevHash(), indent);
      str += _GenUtils["default"].kvLine("Reward", this.getReward(), indent);
      str += _GenUtils["default"].kvLine("Pow hash", this.getPowHash(), indent);
      return str[str.length - 1] === "\n" ? str.slice(0, str.length - 1) : str; // strip last newline
    }
  }]);
  return MoneroBlockHeader;
}();

var _default = MoneroBlockHeader;
exports["default"] = _default;