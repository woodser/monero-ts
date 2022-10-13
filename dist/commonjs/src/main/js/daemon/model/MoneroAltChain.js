"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Models an alternative chain seen by the node.
 */
var MoneroAltChain = /*#__PURE__*/function () {
  function MoneroAltChain(state) {
    (0, _classCallCheck2["default"])(this, MoneroAltChain);
    state = Object.assign({}, state);
    if (state.difficulty !== undefined && !(state.difficulty instanceof BigInt)) state.difficulty = BigInt(state.difficulty);
    this.state = state;
  }

  (0, _createClass2["default"])(MoneroAltChain, [{
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state);
      if (this.getDifficulty() !== undefined) json.difficulty = this.getDifficulty().toString();
      return json;
    }
  }, {
    key: "getBlockHashes",
    value: function getBlockHashes(blockHashes) {
      return this.state.blockHashes;
    }
  }, {
    key: "setBlockHashes",
    value: function setBlockHashes(blockHashes) {
      this.state.blockHashes = blockHashes;
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
    key: "getLength",
    value: function getLength() {
      return this.state.length;
    }
  }, {
    key: "setLength",
    value: function setLength(length) {
      this.state.length = length;
      return this;
    }
  }, {
    key: "getMainChainParentBlockHash",
    value: function getMainChainParentBlockHash() {
      return this.state.mainChainParentBlockHash;
    }
  }, {
    key: "setMainChainParentBlockHash",
    value: function setMainChainParentBlockHash(mainChainParentBlockHash) {
      this.state.mainChainParentBlockHash = mainChainParentBlockHash;
      return this;
    }
  }]);
  return MoneroAltChain;
}();

var _default = MoneroAltChain;
exports["default"] = _default;