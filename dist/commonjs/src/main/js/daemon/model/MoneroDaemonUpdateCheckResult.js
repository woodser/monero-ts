"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * Models the result of checking for a daemon update.
 */
var MoneroDaemonUpdateCheckResult = /*#__PURE__*/function () {
  /**
   * Deep copy constructor.
   * 
   * @param {MoneroDaemonUpdateCheckResult} is an existing result to deep copy from
   */
  function MoneroDaemonUpdateCheckResult(result) {
    (0, _classCallCheck2["default"])(this, MoneroDaemonUpdateCheckResult);
    this.state = {};

    if (result !== undefined) {
      assert(result instanceof MoneroDaemonUpdateCheckResult);
      this.setIsUpdateAvailable(result.isUpdateAvailable());
      this.setVersion(result.getVersion());
      this.setHash(result.getHash());
      this.setAutoUri(result.getAutoUri());
      this.setUserUri(result.getUserUri());
    }
  }
  /**
   * Indicates if an update is available.
   * 
   * @return {boolean} true if an update is available, false otherwise
   */


  (0, _createClass2["default"])(MoneroDaemonUpdateCheckResult, [{
    key: "isUpdateAvailable",
    value: function isUpdateAvailable() {
      return this.state.isUpdateAvailable;
    }
  }, {
    key: "setIsUpdateAvailable",
    value: function setIsUpdateAvailable(isUpdateAvailable) {
      this.state.isUpdateAvailable = isUpdateAvailable;
      return this;
    }
    /**
     * Get the update's version.
     * 
     * @return {string} is the update's version
     */

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
    /**
     * Get the update's hash.
     * 
     * @return {string} is the update's hash
     */

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
     * Get the uri to automatically download the update.
     * 
     * @return {string} is the uri to automatically download the update
     */

  }, {
    key: "getAutoUri",
    value: function getAutoUri() {
      return this.state.autoUri;
    }
  }, {
    key: "setAutoUri",
    value: function setAutoUri(autoUri) {
      this.state.autoUri = autoUri;
      return this;
    }
    /**
     * Get the uri to manually download the update.
     * 
     * @return {string} is the uri to manually download the update
     */

  }, {
    key: "getUserUri",
    value: function getUserUri() {
      return this.state.userUri;
    }
  }, {
    key: "setUserUri",
    value: function setUserUri(userUri) {
      this.state.userUri = userUri;
      return this;
    }
  }]);
  return MoneroDaemonUpdateCheckResult;
}();

var _default = MoneroDaemonUpdateCheckResult;
exports["default"] = _default;