"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Models a peer to the daemon.
 */
var MoneroPeer = /*#__PURE__*/function () {
  function MoneroPeer(state) {
    (0, _classCallCheck2["default"])(this, MoneroPeer);
    this.state = Object.assign({}, state);
    if (this.state.rpcCreditsPerHash !== undefined && !(this.state.rpcCreditsPerHash instanceof BigInt)) this.state.rpcCreditsPerHash = BigInt(this.state.rpcCreditsPerHash);
  }

  (0, _createClass2["default"])(MoneroPeer, [{
    key: "toJson",
    value: function toJson() {
      var json = Object.assign({}, this.state);
      if (json.rpcCreditsPerHash !== undefined) json.rpcCreditsPerHash = json.rpcCreditsPerHash.toString();
      return json;
    }
  }, {
    key: "getId",
    value: function getId() {
      return this.state.id;
    }
  }, {
    key: "setId",
    value: function setId(id) {
      this.state.id = id;
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
    key: "getHost",
    value: function getHost() {
      return this.state.host;
    }
  }, {
    key: "setHost",
    value: function setHost(host) {
      this.state.host = host;
      return this;
    }
  }, {
    key: "getPort",
    value: function getPort() {
      return this.state.port;
    }
  }, {
    key: "setPort",
    value: function setPort(port) {
      this.state.port = port;
      return this;
    }
    /**
     * Indicates if the peer was online when last checked (aka "white listed" as
     * opposed to "gray listed").
     * 
     * @return {boolean} true if peer was online when last checked, false otherwise
     */

  }, {
    key: "isOnline",
    value: function isOnline() {
      return this.state.isOnline;
    }
  }, {
    key: "setIsOnline",
    value: function setIsOnline(isOnline) {
      this.state.isOnline = isOnline;
      return this;
    }
  }, {
    key: "getLastSeenTimestamp",
    value: function getLastSeenTimestamp() {
      return this.state.lastSeenTimestamp;
    }
  }, {
    key: "setLastSeenTimestamp",
    value: function setLastSeenTimestamp(lastSeenTimestamp) {
      this.state.lastSeenTimestamp = lastSeenTimestamp;
      return this;
    }
  }, {
    key: "getPruningSeed",
    value: function getPruningSeed() {
      return this.state.pruningSeed;
    }
  }, {
    key: "setPruningSeed",
    value: function setPruningSeed(pruningSeed) {
      this.state.pruningSeed = pruningSeed;
      return this;
    }
  }, {
    key: "getRpcPort",
    value: function getRpcPort() {
      return this.state.rpcPort;
    }
  }, {
    key: "setRpcPort",
    value: function setRpcPort(rpcPort) {
      this.state.rpcPort = rpcPort;
      return this;
    }
  }, {
    key: "getRpcCreditsPerHash",
    value: function getRpcCreditsPerHash() {
      return this.state.rpcCreditsPerHash;
    }
  }, {
    key: "setRpcCreditsPerHash",
    value: function setRpcCreditsPerHash(rpcCreditsPerHash) {
      this.state.rpcCreditsPerHash = rpcCreditsPerHash;
      return this;
    }
  }, {
    key: "getAvgDownload",
    value: function getAvgDownload() {
      return this.state.avgDownload;
    }
  }, {
    key: "setAvgDownload",
    value: function setAvgDownload(avgDownload) {
      this.state.avgDownload = avgDownload;
      return this;
    }
  }, {
    key: "getAvgUpload",
    value: function getAvgUpload() {
      return this.state.avgUpload;
    }
  }, {
    key: "setAvgUpload",
    value: function setAvgUpload(avgUpload) {
      this.state.avgUpload = avgUpload;
      return this;
    }
  }, {
    key: "getCurrentDownload",
    value: function getCurrentDownload() {
      return this.state.currentDownload;
    }
  }, {
    key: "setCurrentDownload",
    value: function setCurrentDownload(currentDownload) {
      this.state.currentDownload = currentDownload;
      return this;
    }
  }, {
    key: "getCurrentUpload",
    value: function getCurrentUpload() {
      return this.state.currentUpload;
    }
  }, {
    key: "setCurrentUpload",
    value: function setCurrentUpload(currentUpload) {
      this.state.currentUpload = currentUpload;
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
    key: "getLiveTime",
    value: function getLiveTime() {
      return this.state.liveTime;
    }
  }, {
    key: "setLiveTime",
    value: function setLiveTime(liveTime) {
      this.state.liveTime = liveTime;
      return this;
    }
  }, {
    key: "isLocalIp",
    value: function isLocalIp() {
      return this.state.isLocalIp;
    }
  }, {
    key: "setIsLocalIp",
    value: function setIsLocalIp(isLocalIp) {
      this.state.isLocalIp = isLocalIp;
      return this;
    }
  }, {
    key: "isLocalHost",
    value: function isLocalHost() {
      return this.state.isLocalHost;
    }
  }, {
    key: "setIsLocalHost",
    value: function setIsLocalHost(isLocalHost) {
      this.state.isLocalHost = isLocalHost;
      return this;
    }
  }, {
    key: "getNumReceives",
    value: function getNumReceives() {
      return this.state.numReceives;
    }
  }, {
    key: "setNumReceives",
    value: function setNumReceives(numReceives) {
      this.state.numReceives = numReceives;
      return this;
    }
  }, {
    key: "getNumSends",
    value: function getNumSends() {
      return this.state.numSends;
    }
  }, {
    key: "setNumSends",
    value: function setNumSends(numSends) {
      this.state.numSends = numSends;
      return this;
    }
  }, {
    key: "getReceiveIdleTime",
    value: function getReceiveIdleTime() {
      return this.state.receiveIdleTime;
    }
  }, {
    key: "setReceiveIdleTime",
    value: function setReceiveIdleTime(receiveIdleTime) {
      this.state.receiveIdleTime = receiveIdleTime;
      return this;
    }
  }, {
    key: "getSendIdleTime",
    value: function getSendIdleTime() {
      return this.state.sendIdleTime;
    }
  }, {
    key: "setSendIdleTime",
    value: function setSendIdleTime(sendIdleTime) {
      this.state.sendIdleTime = sendIdleTime;
      return this;
    }
  }, {
    key: "getState",
    value: function getState() {
      return this.state.state;
    }
  }, {
    key: "setState",
    value: function setState(state) {
      this.state.state = state;
      return this;
    }
  }, {
    key: "getNumSupportFlags",
    value: function getNumSupportFlags() {
      return this.state.numSupportFlags;
    }
  }, {
    key: "setNumSupportFlags",
    value: function setNumSupportFlags(numSupportFlags) {
      this.state.numSupportFlags = numSupportFlags;
      return this;
    }
  }, {
    key: "getType",
    value: function getType() {
      return this.state.type;
    }
  }, {
    key: "setType",
    value: function setType(type) {
      this.state.type = type;
      return this;
    }
  }]);
  return MoneroPeer;
}();

var _default = MoneroPeer;
exports["default"] = _default;