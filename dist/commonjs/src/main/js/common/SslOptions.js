"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

/**
 * SSL options for remote endpoints.
 */
var SslOptions = /*#__PURE__*/function () {
  function SslOptions(state) {
    (0, _classCallCheck2["default"])(this, SslOptions);
    this.state = Object.assign({}, state);
  }

  (0, _createClass2["default"])(SslOptions, [{
    key: "getPrivateKeyPath",
    value: function getPrivateKeyPath() {
      return this.state.privateKeyPath;
    }
  }, {
    key: "setPrivateKeyPath",
    value: function setPrivateKeyPath(privateKeyPath) {
      this.state.privateKeyPath = privateKeyPath;
      return this;
    }
  }, {
    key: "getCertificatePath",
    value: function getCertificatePath() {
      return this.state.certificatePath;
    }
  }, {
    key: "setCertificatePath",
    value: function setCertificatePath(certificatePath) {
      this.state.certificatePath = certificatePath;
      return this;
    }
  }, {
    key: "getCertificateAuthorityFile",
    value: function getCertificateAuthorityFile() {
      return this.state.certificateAuthorityFile;
    }
  }, {
    key: "setCertificateAuthorityFile",
    value: function setCertificateAuthorityFile(certificateAuthorityFile) {
      this.state.certificateAuthorityFile = certificateAuthorityFile;
      return this;
    }
  }, {
    key: "getAllowedFingerprints",
    value: function getAllowedFingerprints() {
      return this.state.allowedFingerprints;
    }
  }, {
    key: "setAllowedFingerprints",
    value: function setAllowedFingerprints(allowedFingerprints) {
      this.state.allowedFingerprints = allowedFingerprints;
      return this;
    }
  }, {
    key: "getAllowAnyCert",
    value: function getAllowAnyCert() {
      return this.state.allowAnyCert;
    }
  }, {
    key: "setAllowAnyCert",
    value: function setAllowAnyCert(allowAnyCert) {
      this.state.allowAnyCert = allowAnyCert;
      return this;
    }
  }]);
  return SslOptions;
}();

var _default = SslOptions;
exports["default"] = _default;