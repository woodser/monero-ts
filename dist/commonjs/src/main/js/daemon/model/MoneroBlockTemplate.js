"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Monero block template to mine.
 */
var MoneroBlockTemplate = /*#__PURE__*/function () {
  function MoneroBlockTemplate(state) {
    (0, _classCallCheck2["default"])(this, MoneroBlockTemplate);
    state = Object.assign({}, state);
    this.state = state; // deserialize BigInts

    if (state.expectedReward !== undefined && !(state.expectedReward instanceof BigInt)) state.expectedReward = BigInt(state.expectedReward);
    if (state.difficulty !== undefined && !(state.difficulty instanceof BigInt)) state.difficulty = BigInt(state.difficulty);
  }

  (0, _createClass2["default"])(MoneroBlockTemplate, [{
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state);
      if (this.getExpectedReward() !== undefined) json.expectedReward = this.getExpectedReward().toString();
      if (this.getDifficulty() !== undefined) json.difficulty = this.getDifficulty().toString();
      return json;
    }
  }, {
    key: "getBlockTemplateBlob",
    value: function getBlockTemplateBlob() {
      return this.state.blockTemplateBlob;
    }
  }, {
    key: "setBlockTemplateBlob",
    value: function setBlockTemplateBlob(blockTemplateBlob) {
      this.state.blockTemplateBlob = blockTemplateBlob;
      return this;
    }
  }, {
    key: "getBlockHashingBlob",
    value: function getBlockHashingBlob() {
      return this.state.blockHashingBlob;
    }
  }, {
    key: "setBlockHashingBlob",
    value: function setBlockHashingBlob(blockHashingBlob) {
      this.state.blockHashingBlob = blockHashingBlob;
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
    key: "getExpectedReward",
    value: function getExpectedReward() {
      return this.state.expectedReward;
    }
  }, {
    key: "setExpectedReward",
    value: function setExpectedReward(expectedReward) {
      this.state.expectedReward = expectedReward;
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
    key: "getPrevHash",
    value: function getPrevHash() {
      return this.state.prevId;
    }
  }, {
    key: "setPrevHash",
    value: function setPrevHash(prevId) {
      this.state.prevId = prevId;
      return this;
    }
  }, {
    key: "getReservedOffset",
    value: function getReservedOffset() {
      return this.state.reservedOffset;
    }
  }, {
    key: "setReservedOffset",
    value: function setReservedOffset(reservedOffset) {
      this.state.reservedOffset = reservedOffset;
      return this;
    }
  }, {
    key: "getSeedHeight",
    value: function getSeedHeight() {
      return this.state.height;
    }
  }, {
    key: "setSeedHeight",
    value: function setSeedHeight(seedHeight) {
      this.state.seedHeight = seedHeight;
      return this;
    }
  }, {
    key: "getSeedHash",
    value: function getSeedHash() {
      return this.state.seedHash;
    }
  }, {
    key: "setSeedHash",
    value: function setSeedHash(seedHash) {
      this.state.seedHash = seedHash;
      return this;
    }
  }, {
    key: "getNextSeedHash",
    value: function getNextSeedHash() {
      return this.state.nextSeedHash;
    }
  }, {
    key: "setNextSeedHash",
    value: function setNextSeedHash(nextSeedHash) {
      this.state.nextSeedHash = nextSeedHash;
      return this;
    }
  }]);
  return MoneroBlockTemplate;
}();

var _default = MoneroBlockTemplate;
exports["default"] = _default;