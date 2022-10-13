"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _GenUtils = _interopRequireDefault(require("./GenUtils"));

var _HttpClient = _interopRequireDefault(require("./HttpClient"));

var _LibraryUtils = _interopRequireDefault(require("./LibraryUtils"));

var _MoneroError = _interopRequireDefault(require("../common/MoneroError"));

var _MoneroRpcError = _interopRequireDefault(require("../common/MoneroRpcError"));

var _MoneroUtils = _interopRequireDefault(require("./MoneroUtils"));

/**
 * Maintains a connection and sends requests to a Monero RPC API.
 */
var MoneroRpcConnection = /*#__PURE__*/function () {
  /**
   * <p>Construct a RPC connection.</p>
   * 
   * <p>Examples:</p>
   * 
   * <code>
   * let connection1 = new MoneroRpcConnection("http://localhost:38081", "daemon_user", "daemon_password_123")<br><br>
   * 
   * let connection2 = new MoneroRpcConnection({<br>
   * &nbsp;&nbsp; uri: http://localhost:38081,<br>
   * &nbsp;&nbsp; username: "daemon_user",<br>
   * &nbsp;&nbsp; password: "daemon_password_123",<br>
   * &nbsp;&nbsp; rejectUnauthorized: false, // accept self-signed certificates e.g. for local development<br>
   * &nbsp;&nbsp; proxyToWorker: true // proxy request to worker (default false)<br>
   * });
   * </code>
   * 
   * @param {string|object|MoneroRpcConnection} uriOrConfigOrConnection - RPC endpoint URI, MoneroRpcConnection, or equivalent JS object
   * @param {string} uriOrConfigOrConnection.uri - URI of the RPC endpoint
   * @param {string} [uriOrConfigOrConnection.username] - username to authenticate with the RPC endpoint (optional)
   * @param {string} [uriOrConfigOrConnection.password] - password to authenticate with the RPC endpoint (optional)
   * @param {boolean} [uriOrConfigOrConnection.rejectUnauthorized] - rejects self-signed certificates if true (default true)
   * @param {boolean} uriOrConfigOrConnection.proxyToWorker - proxy requests to worker
   * @param {string} [username] - username to authenticate with the RPC endpoint (optional)
   * @param {string} [password] - password to authenticate with the RPC endpoint (optional)
   * @param {boolean} [rejectUnauthorized] - reject self-signed certificates if true (default true)
   * @param {boolean} [proxyToWorker] - use web worker (default true);
   */
  function MoneroRpcConnection(uriOrConfigOrConnection, username, password, rejectUnauthorized, proxyToWorker) {
    (0, _classCallCheck2["default"])(this, MoneroRpcConnection);
    console.log("Creating new rpc connection"); // validate and normalize config

    if (typeof uriOrConfigOrConnection === "string") {
      this._config = {
        uri: uriOrConfigOrConnection
      };
      this.setCredentials(username, password);
      if (rejectUnauthorized !== undefined) this._config.rejectUnauthorized = rejectUnauthorized;
      if (proxyToWorker !== undefined) this._config.proxyToWorker = proxyToWorker;
    } else if ((0, _typeof2["default"])(uriOrConfigOrConnection) === "object") {
      if (username !== undefined || password !== undefined || rejectUnauthorized !== undefined || proxyToWorker !== undefined) throw new _MoneroError["default"]("Can provide config object or params but not both");
      if (uriOrConfigOrConnection instanceof MoneroRpcConnection) this._config = Object.assign({}, uriOrConfigOrConnection.getConfig());else this._config = Object.assign({}, uriOrConfigOrConnection);
      this.setCredentials(this._config.username, this._config.password);
    } else if (uriOrConfigOrConnection !== undefined) {
      throw new _MoneroError["default"]("Invalid configuration to MoneroRpcConnection; must be string or MoneroRpcConnection or equivalent JS object");
    } // merge default config


    this._config = Object.assign({}, MoneroRpcConnection.DEFAULT_CONFIG, this._config);
    console.log(JSON.stringify(this._config)); // normalize uri

    if (this._config.uri) {
      this._config.uri = this._config.uri.replace(/\/$/, ""); // strip trailing slash

      if (!new RegExp("^\\w+://.+").test(this._config.uri)) this._config.uri = "http://" + this._config.uri; // assume http if protocol not given
    } // fail with friendly message if using old api


    if (this._config.user || this._config.pass) throw new _MoneroError["default"]("Authentication fields 'user' and 'pass' have been renamed to 'username' and 'password'.  Please update to the new api"); // check for unsupported fields

    for (var _i = 0, _Object$keys = Object.keys(this._config); _i < _Object$keys.length; _i++) {
      var key = _Object$keys[_i];

      if (!_GenUtils["default"].arrayContains(MoneroRpcConnection.SUPPORTED_FIELDS, key)) {
        throw new _MoneroError["default"]("RPC connection includes unsupported field: '" + key + "'");
      }
    }

    console.log("Created new rpc connection");
  }

  (0, _createClass2["default"])(MoneroRpcConnection, [{
    key: "setCredentials",
    value: function setCredentials(username, password) {
      if (username === "") username = undefined;
      if (password === "") password = undefined;

      if (username || password) {
        if (!username) throw new _MoneroError["default"]("username must be defined because password is defined");
        if (!password) throw new _MoneroError["default"]("password must be defined because username is defined");
      }

      if (this._config.username === "") this._config.username = undefined;
      if (this._config.password === "") this._config.password = undefined;

      if (this._config.username !== username || this._config.password !== password) {
        this._isOnline = undefined;
        this._isAuthenticated = undefined;
      }

      this._config.username = username;
      this._config.password = password;
      return this;
    }
  }, {
    key: "getUri",
    value: function getUri() {
      return this._config.uri;
    }
  }, {
    key: "getUsername",
    value: function getUsername() {
      return this._config.username ? this._config.username : "";
    }
  }, {
    key: "getPassword",
    value: function getPassword() {
      return this._config.password ? this._config.password : "";
    }
  }, {
    key: "getRejectUnauthorized",
    value: function getRejectUnauthorized() {
      return this._config.rejectUnauthorized;
    }
  }, {
    key: "setProxyToWorker",
    value: function setProxyToWorker(proxyToWorker) {
      this._config.proxyToWorker = proxyToWorker;
      return this;
    }
  }, {
    key: "getProxyToWorker",
    value: function getProxyToWorker() {
      return this._config.proxyToWorker;
    }
  }, {
    key: "getConfig",
    value: function getConfig() {
      return this._config;
    }
  }, {
    key: "getPriority",
    value: function getPriority() {
      return this._config.priority;
    }
    /**
     * Set the connection's priority relative to other connections. Priority 1 is highest,
     * then priority 2, etc. The default priority of 0 is lowest priority.
     * 
     * @param {number} [priority] - the connection priority (default 0)
     * @return {MoneroRpcConnection} this connection
     */

  }, {
    key: "setPriority",
    value: function setPriority(priority) {
      if (!(priority >= 0)) throw new _MoneroError["default"]("Priority must be >= 0");
      this._config.priority = priority;
      return this;
    }
  }, {
    key: "setAttribute",
    value: function setAttribute(key, value) {
      if (!this.attributes) this.attributes = new Map();
      this.attributes.put(key, value);
      return this;
    }
  }, {
    key: "getAttribute",
    value: function getAttribute(key) {
      return this.attributes.get(key);
    }
    /**
     * Check the connection status to update isOnline, isAuthenticated, and response time.
     * 
     * @param {number} timeoutInMs - maximum response time before considered offline
     * @return {Promise<boolean>} true if there is a change in status, false otherwise
     */

  }, {
    key: "checkConnection",
    value: function () {
      var _checkConnection = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(timeoutInMs) {
        var isOnlineBefore, isAuthenticatedBefore, startTime;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                isOnlineBefore = this._isOnline;
                isAuthenticatedBefore = this._isAuthenticated;
                startTime = Date.now();
                _context.prev = 3;

                if (!this._fakeDisconnected) {
                  _context.next = 6;
                  break;
                }

                throw new Error("Connection is fake disconnected");

              case 6:
                _context.next = 8;
                return this.sendJsonRequest("get_version", undefined, timeoutInMs);

              case 8:
                this._isOnline = true;
                this._isAuthenticated = true;
                _context.next = 15;
                break;

              case 12:
                _context.prev = 12;
                _context.t0 = _context["catch"](3);

                if (_context.t0 instanceof _MoneroRpcError["default"] && _context.t0.getCode() === 401) {
                  this._isOnline = true;
                  this._isAuthenticated = false;
                } else {
                  this._isOnline = false;
                  this._isAuthenticated = undefined;
                  this._responseTime = undefined;
                }

              case 15:
                if (this._isOnline) this._responseTime = Date.now() - startTime;
                return _context.abrupt("return", isOnlineBefore !== this._isOnline || isAuthenticatedBefore !== this._isAuthenticated);

              case 17:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[3, 12]]);
      }));

      function checkConnection(_x) {
        return _checkConnection.apply(this, arguments);
      }

      return checkConnection;
    }()
    /**
     * Indicates if the connection is connected according to the last call to checkConnection().<br><br>
     * 
     * Note: must call checkConnection() manually unless using MoneroConnectionManager.
     * 
     * @return {boolean|undefined} true or false to indicate if connected, or undefined if checkConnection() has not been called
     */

  }, {
    key: "isConnected",
    value: function isConnected() {
      return this._isOnline === undefined ? undefined : this._isOnline && this._isAuthenticated !== false;
    }
    /**
     * Indicates if the connection is online according to the last call to checkConnection().<br><br>
     * 
     * Note: must call checkConnection() manually unless using MoneroConnectionManager.
     * 
     * @return {boolean|undefined} true or false to indicate if online, or undefined if checkConnection() has not been called
     */

  }, {
    key: "isOnline",
    value: function isOnline() {
      return this._isOnline;
    }
    /**
     * Indicates if the connection is authenticated according to the last call to checkConnection().<br><br>
     * 
     * Note: must call checkConnection() manually unless using MoneroConnectionManager.
     * 
     * @return {boolean|undefined} true if authenticated or no authentication, false if not authenticated, or undefined if checkConnection() has not been called
     */

  }, {
    key: "isAuthenticated",
    value: function isAuthenticated() {
      return this._isAuthenticated;
    }
  }, {
    key: "getResponseTime",
    value: function getResponseTime() {
      return this._responseTime;
    }
    /**
     * Send a JSON RPC request.
     * 
     * @param {string} method - JSON RPC method to invoke
     * @param {object} params - request parameters
     * @param {number} timeoutInMs - request timeout in milliseconds
     * @return {object} is the response map
     */

  }, {
    key: "sendJsonRequest",
    value: function () {
      var _sendJsonRequest = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(method, params, timeoutInMs) {
        var body, resp, respStr;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.prev = 0;
                // build request body
                body = JSON.stringify({
                  // body is stringified so text/plain is returned so BigInts are preserved
                  id: "0",
                  jsonrpc: "2.0",
                  method: method,
                  params: params
                }); // send http request

                if (_LibraryUtils["default"].getLogLevel() >= 2) _LibraryUtils["default"].log(2, "Sending json request with method '" + method + "' and body: " + body);
                _context2.next = 5;
                return _HttpClient["default"].request({
                  method: "POST",
                  uri: this.getUri() + '/json_rpc',
                  username: this.getUsername(),
                  password: this.getPassword(),
                  body: body,
                  timeout: timeoutInMs,
                  rejectUnauthorized: this._config.rejectUnauthorized,
                  requestApi: _GenUtils["default"].isFirefox() ? "xhr" : "fetch",
                  // firefox issue: https://bugzilla.mozilla.org/show_bug.cgi?id=1491010
                  proxyToWorker: this._config.proxyToWorker
                });

              case 5:
                resp = _context2.sent;

                // validate response
                MoneroRpcConnection._validateHttpResponse(resp); // deserialize response


                if (!(resp.body[0] != '{')) {
                  _context2.next = 9;
                  break;
                }

                throw resp.body;

              case 9:
                resp = JSON.parse(resp.body.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"')); // replace 16 or more digits with strings and parse

                if (_LibraryUtils["default"].getLogLevel() >= 3) {
                  respStr = JSON.stringify(resp);

                  _LibraryUtils["default"].log(3, "Received response: " + respStr.substring(0, Math.min(1000, respStr.length)));
                } // check rpc response for errors


                MoneroRpcConnection._validateRpcResponse(resp, method, params);

                return _context2.abrupt("return", resp);

              case 15:
                _context2.prev = 15;
                _context2.t0 = _context2["catch"](0);

                if (!(_context2.t0 instanceof _MoneroRpcError["default"])) {
                  _context2.next = 21;
                  break;
                }

                throw _context2.t0;

              case 21:
                throw new _MoneroRpcError["default"](_context2.t0, _context2.t0.statusCode, method, params);

              case 22:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[0, 15]]);
      }));

      function sendJsonRequest(_x2, _x3, _x4) {
        return _sendJsonRequest.apply(this, arguments);
      }

      return sendJsonRequest;
    }()
    /**
     * Send a RPC request to the given path and with the given paramters.
     * 
     * E.g. "/get_transactions" with params
     * 
     * @param {string} path - JSON RPC path to invoke
     * @param {object} params - request parameters
     * @param {number} timeoutInMs - request timeout in milliseconds
     * @return {object} is the response map
     */

  }, {
    key: "sendPathRequest",
    value: function () {
      var _sendPathRequest = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(path, params, timeoutInMs) {
        var resp, respStr;
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.prev = 0;
                // send http request
                if (_LibraryUtils["default"].getLogLevel() >= 2) _LibraryUtils["default"].log(2, "Sending path request with path '" + path + "' and params: " + JSON.stringify(params));
                _context3.next = 4;
                return _HttpClient["default"].request({
                  method: "POST",
                  uri: this.getUri() + '/' + path,
                  username: this.getUsername(),
                  password: this.getPassword(),
                  body: JSON.stringify(params),
                  // body is stringified so text/plain is returned so BigInts are preserved
                  timeout: timeoutInMs,
                  rejectUnauthorized: this._config.rejectUnauthorized,
                  requestApi: _GenUtils["default"].isFirefox() ? "xhr" : "fetch",
                  proxyToWorker: this._config.proxyToWorker
                });

              case 4:
                resp = _context3.sent;

                // validate response
                MoneroRpcConnection._validateHttpResponse(resp); // deserialize response


                if (!(resp.body[0] != '{')) {
                  _context3.next = 8;
                  break;
                }

                throw resp.body;

              case 8:
                resp = JSON.parse(resp.body.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"')); // replace 16 or more digits with strings and parse

                if (typeof resp === "string") resp = JSON.parse(resp); // TODO: some responses returned as strings?

                if (_LibraryUtils["default"].getLogLevel() >= 3) {
                  respStr = JSON.stringify(resp);

                  _LibraryUtils["default"].log(3, "Received response: " + respStr.substring(0, Math.min(1000, respStr.length)));
                } // check rpc response for errors


                MoneroRpcConnection._validateRpcResponse(resp, path, params);

                return _context3.abrupt("return", resp);

              case 15:
                _context3.prev = 15;
                _context3.t0 = _context3["catch"](0);

                if (!(_context3.t0 instanceof _MoneroRpcError["default"])) {
                  _context3.next = 21;
                  break;
                }

                throw _context3.t0;

              case 21:
                throw new _MoneroRpcError["default"](_context3.t0, _context3.t0.statusCode, path, params);

              case 22:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this, [[0, 15]]);
      }));

      function sendPathRequest(_x5, _x6, _x7) {
        return _sendPathRequest.apply(this, arguments);
      }

      return sendPathRequest;
    }()
    /**
     * Send a binary RPC request.
     * 
     * @param {string} path - path of the binary RPC method to invoke
     * @param {object} params - request parameters
     * @param {number} timeoutInMs - request timeout in milliseconds
     * @return {Uint8Array} the binary response
     */

  }, {
    key: "sendBinaryRequest",
    value: function () {
      var _sendBinaryRequest = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(path, params, timeoutInMs) {
        var paramsBin, resp;
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                _context4.next = 2;
                return _MoneroUtils["default"].jsonToBinary(params);

              case 2:
                paramsBin = _context4.sent;
                _context4.prev = 3;
                // send http request
                if (_LibraryUtils["default"].getLogLevel() >= 2) _LibraryUtils["default"].log(2, "Sending binary request with path '" + path + "' and params: " + JSON.stringify(params));
                _context4.next = 7;
                return _HttpClient["default"].request({
                  method: "POST",
                  uri: this.getUri() + '/' + path,
                  username: this.getUsername(),
                  password: this.getPassword(),
                  body: paramsBin,
                  timeout: timeoutInMs,
                  rejectUnauthorized: this._config.rejectUnauthorized,
                  requestApi: _GenUtils["default"].isFirefox() ? "xhr" : "fetch",
                  proxyToWorker: this._config.proxyToWorker
                });

              case 7:
                resp = _context4.sent;

                // validate response
                MoneroRpcConnection._validateHttpResponse(resp); // process response


                resp = resp.body;

                if (!(resp instanceof Uint8Array)) {
                  console.error("resp is not uint8array");
                  console.error(resp);
                }

                if (!resp.error) {
                  _context4.next = 13;
                  break;
                }

                throw new _MoneroRpcError["default"](resp.error.message, resp.error.code, path, params);

              case 13:
                return _context4.abrupt("return", resp);

              case 16:
                _context4.prev = 16;
                _context4.t0 = _context4["catch"](3);

                if (!(_context4.t0 instanceof _MoneroRpcError["default"])) {
                  _context4.next = 22;
                  break;
                }

                throw _context4.t0;

              case 22:
                throw new _MoneroRpcError["default"](_context4.t0, _context4.t0.statusCode, path, params);

              case 23:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this, [[3, 16]]);
      }));

      function sendBinaryRequest(_x8, _x9, _x10) {
        return _sendBinaryRequest.apply(this, arguments);
      }

      return sendBinaryRequest;
    }()
  }, {
    key: "toString",
    value: function toString() {
      return this.getUri() + " (username=" + this.getUsername() + ", password=" + (this.getPassword() ? "***" : this.getPassword()) + ", priority=" + this.getPriority() + ", isOnline=" + this.isOnline() + ", isAuthenticated=" + this.isAuthenticated() + ")";
    } // ------------------------------ PRIVATE HELPERS --------------------------

  }, {
    key: "_setFakeDisconnected",
    value: function _setFakeDisconnected(fakeDisconnected) {
      // used to test connection manager
      this._fakeDisconnected = fakeDisconnected;
    }
  }], [{
    key: "_validateHttpResponse",
    value: function _validateHttpResponse(resp) {
      var code = resp.statusCode;

      if (code < 200 || code > 299) {
        var content = resp.body;
        throw new _MoneroRpcError["default"](code + " " + resp.statusText + (!content ? "" : ": " + content), code, undefined, undefined);
      }
    }
  }, {
    key: "_validateRpcResponse",
    value: function _validateRpcResponse(resp, method, params) {
      if (!resp.error) return;
      throw new _MoneroRpcError["default"](resp.error.message, resp.error.code, method, params);
    }
  }]);
  return MoneroRpcConnection;
}();
/**
 * Default RPC configuration.
 */


MoneroRpcConnection.DEFAULT_CONFIG = {
  uri: undefined,
  username: undefined,
  password: undefined,
  rejectUnauthorized: true,
  // reject self-signed certificates if true
  proxyToWorker: false,
  priority: 0
};
MoneroRpcConnection.SUPPORTED_FIELDS = ["uri", "username", "password", "rejectUnauthorized", "priority", "proxyToWorker"];
var _default = MoneroRpcConnection;
exports["default"] = _default;