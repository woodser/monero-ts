"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _GenUtils = _interopRequireDefault(require("./GenUtils"));

var _MoneroError = _interopRequireDefault(require("./MoneroError"));

var _MoneroRpcConnection = _interopRequireDefault(require("./MoneroRpcConnection"));

var _TaskLooper = _interopRequireDefault(require("./TaskLooper"));

var _ThreadPool = _interopRequireDefault(require("./ThreadPool"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/**
 * <p>Manages a collection of prioritized connections to daemon or wallet RPC endpoints.</p>
 *
 * <p>Example usage:</p>
 * 
 * <code>
 * // imports<br>
 *  * const MoneroRpcConnection = MoneroRpcConnection;<br>
 * const MoneroConnectionManager = MoneroConnectionManager;<br>
 * const MoneroConnectionManagerListener = MoneroConnectionManagerListener;<br><br>
 * 
 * // create connection manager<br>
 * let connectionManager = new MoneroConnectionManager();<br><br>
 * 
 * // add managed connections with priorities<br>
 * connectionManager.addConnection(new MoneroRpcConnection("http://localhost:38081").setPriority(1)); // use localhost as first priority<br>
 * connectionManager.addConnection(new MoneroRpcConnection("http://example.com")); // default priority is prioritized last<br><br>
 * 
 * // set current connection<br>
 * connectionManager.setConnection(new MoneroRpcConnection("http://foo.bar", "admin", "password")); // connection is added if new<br><br>
 * 
 * // check connection status<br>
 * await connectionManager.checkConnection();<br>
 * console.log("Connection manager is connected: " + connectionManager.isConnected());<br>
 * console.log("Connection is online: " + connectionManager.getConnection().isOnline());<br>
 * console.log("Connection is authenticated: " + connectionManager.getConnection().isAuthenticated());<br><br>
 * 
 * // receive notifications of any changes to current connection<br>
 * connectionManager.addListener(new class extends MoneroConnectionManagerListener {<br>
 * &nbsp;&nbsp; onConnectionChanged(connection) {<br>
 * &nbsp;&nbsp;&nbsp;&nbsp; console.log("Connection changed to: " + connection);<br>
 * &nbsp;&nbsp; }<br>
 * });<br><br>
 *  
 * // check connection status every 10 seconds<br>
 * await connectionManager.startCheckingConnection(10000);<br><br>
 * 
 * // automatically switch to best available connection if disconnected<br>
 * connectionManager.setAutoSwitch(true);<br><br>
 * 
 * // get best available connection in order of priority then response time<br>
 * let bestConnection = await connectionManager.getBestAvailableConnection();<br><br>
 * 
 * // check status of all connections<br>
 * await connectionManager.checkConnections();<br><br>
 * 
 * // get connections in order of current connection, online status from last check, priority, and name<br>
 * let connections = connectionManager.getConnections();<br><br>
 * 
 * // clear connection manager<br>
 * connectionManager.clear();
 * <code>
 */
var MoneroConnectionManager = /*#__PURE__*/function () {
  /**
   * Construct a connection manager.
   * 
   * @param {boolean} [proxyToWorker] - configure all connections to proxy to worker (default true)
   */
  function MoneroConnectionManager(proxyToWorker) {
    (0, _classCallCheck2["default"])(this, MoneroConnectionManager);
    this._proxyToWorker = proxyToWorker !== false;
    this._timeoutInMs = MoneroConnectionManager.DEFAULT_TIMEOUT;
    this._connections = [];
    this._listeners = [];
  }
  /**
   * Add a listener to receive notifications when the connection changes.
   * 
   * @param {MoneroConnectionManagerListener} listener - the listener to add
   * @return {MoneroConnectionManager} this connection manager for chaining
   */


  (0, _createClass2["default"])(MoneroConnectionManager, [{
    key: "addListener",
    value: function addListener(listener) {
      this._listeners.push(listener);

      return this;
    }
    /**
     * Remove a listener.
     * 
     * @param {MoneroConnectionManagerListener} listener - the listener to remove
     * @return {MoneroConnectionManager} this connection manager for chaining
     */

  }, {
    key: "removeListener",
    value: function removeListener(listener) {
      if (!_GenUtils["default"].remove(this._listeners, listener)) throw new _MoneroError["default"]("Monero connection manager does not contain listener to remove");
      return this;
    }
    /**
     * Remove all listeners.
     * 
     * @return {MoneroConnectionManager} this connection manager for chaining
     */

  }, {
    key: "removeListeners",
    value: function removeListeners() {
      this._listeners.splice(0, this._listeners.length);

      return this;
    }
    /**
     * Add a connection. The connection may have an elevated priority for this manager to use.
     * 
     * @param {MoneroRpcConnection} connection - the connection to add
     * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
     */

  }, {
    key: "addConnection",
    value: function () {
      var _addConnection = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(connection) {
        var _iterator, _step, aConnection;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _iterator = _createForOfIteratorHelper(this._connections);
                _context.prev = 1;

                _iterator.s();

              case 3:
                if ((_step = _iterator.n()).done) {
                  _context.next = 9;
                  break;
                }

                aConnection = _step.value;

                if (!(aConnection.getUri() === connection.getUri())) {
                  _context.next = 7;
                  break;
                }

                throw new _MoneroError["default"]("Connection URI already exists");

              case 7:
                _context.next = 3;
                break;

              case 9:
                _context.next = 14;
                break;

              case 11:
                _context.prev = 11;
                _context.t0 = _context["catch"](1);

                _iterator.e(_context.t0);

              case 14:
                _context.prev = 14;

                _iterator.f();

                return _context.finish(14);

              case 17:
                if (this._proxyToWorker !== undefined) connection.setProxyToWorker(this._proxyToWorker);

                this._connections.push(connection);

                return _context.abrupt("return", this);

              case 20:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[1, 11, 14, 17]]);
      }));

      function addConnection(_x) {
        return _addConnection.apply(this, arguments);
      }

      return addConnection;
    }()
    /**
     * Remove a connection.
     * 
     * @param {string} uri - of the the connection to remove
     * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
     */

  }, {
    key: "removeConnection",
    value: function () {
      var _removeConnection = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(uri) {
        var connection;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                connection = this.getConnectionByUri(uri);

                if (connection) {
                  _context2.next = 3;
                  break;
                }

                throw new _MoneroError["default"]("No connection exists with URI: " + uri);

              case 3:
                _GenUtils["default"].remove(connections, connection);

                if (connection === this._currentConnection) {
                  this._currentConnection = undefined;

                  this._onConnectionChanged(this._currentConnection);
                }

                return _context2.abrupt("return", this);

              case 6:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function removeConnection(_x2) {
        return _removeConnection.apply(this, arguments);
      }

      return removeConnection;
    }()
    /**
     * Indicates if the connection manager is connected to a node.
     * 
     * @return {boolean} true if the current connection is set, online, and not unauthenticated. false otherwise
     */

  }, {
    key: "isConnected",
    value: function isConnected() {
      return this._currentConnection && this._currentConnection.isConnected();
    }
    /**
     * Get the current connection.
     * 
     * @return {MoneroRpcConnection} the current connection or undefined if no connection set
     */

  }, {
    key: "getConnection",
    value: function getConnection() {
      return this._currentConnection;
    }
    /**
     * Get a connection by URI.
     * 
     * @param {string} uri is the URI of the connection to get
     * @return {MoneroRpcConnection} the connection with the URI or undefined if no connection with the URI exists
     */

  }, {
    key: "getConnectionByUri",
    value: function getConnectionByUri(uri) {
      var _iterator2 = _createForOfIteratorHelper(this._connections),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var connection = _step2.value;
          if (connection.getUri() === uri) return connection;
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }

      return undefined;
    }
    /**
     * Get all connections in order of current connection (if applicable), online status, priority, and name.
     * 
     * @return {MoneroRpcConnection[]} the list of sorted connections
     */

  }, {
    key: "getConnections",
    value: function getConnections() {
      var sortedConnections = _GenUtils["default"].copyArray(this._connections);

      sortedConnections.sort(this._compareConnections.bind(this));
      return sortedConnections;
    }
    /**
     * Get the best available connection in order of priority then response time.
     * 
     * @param {MoneroRpcConnection[]} [excludedConnections] - connections to be excluded from consideration (optional)
     * @return {Promise<MoneroRpcConnection>} the best available connection in order of priority then response time, undefined if no connections available
     */

  }, {
    key: "getBestAvailableConnection",
    value: function () {
      var _getBestAvailableConnection = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(excludedConnections) {
        var _this = this;

        var _iterator3, _step3, prioritizedConnections, _ret;

        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                // try connections within each ascending priority
                _iterator3 = _createForOfIteratorHelper(this._getConnectionsInAscendingPriority());
                _context5.prev = 1;

                _iterator3.s();

              case 3:
                if ((_step3 = _iterator3.n()).done) {
                  _context5.next = 18;
                  break;
                }

                prioritizedConnections = _step3.value;
                _context5.prev = 5;
                return _context5.delegateYield( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
                  var that, checkPromises, _iterator4, _step4, _loop, _ret2, firstAvailable;

                  return _regenerator["default"].wrap(function _callee4$(_context4) {
                    while (1) {
                      switch (_context4.prev = _context4.next) {
                        case 0:
                          // create promises to check connections
                          that = _this;
                          checkPromises = [];
                          _iterator4 = _createForOfIteratorHelper(prioritizedConnections);
                          _context4.prev = 3;

                          _loop = function _loop() {
                            var connection = _step4.value;
                            if (excludedConnections && _GenUtils["default"].arrayContains(excludedConnections, connection)) return "continue";
                            checkPromises.push(new Promise( /*#__PURE__*/function () {
                              var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(resolve, reject) {
                                return _regenerator["default"].wrap(function _callee3$(_context3) {
                                  while (1) {
                                    switch (_context3.prev = _context3.next) {
                                      case 0:
                                        _context3.next = 2;
                                        return connection.checkConnection(that._timeoutInMs);

                                      case 2:
                                        if (connection.isConnected()) resolve(connection);
                                        reject();

                                      case 4:
                                      case "end":
                                        return _context3.stop();
                                    }
                                  }
                                }, _callee3);
                              }));

                              return function (_x4, _x5) {
                                return _ref.apply(this, arguments);
                              };
                            }()));
                          };

                          _iterator4.s();

                        case 6:
                          if ((_step4 = _iterator4.n()).done) {
                            _context4.next = 12;
                            break;
                          }

                          _ret2 = _loop();

                          if (!(_ret2 === "continue")) {
                            _context4.next = 10;
                            break;
                          }

                          return _context4.abrupt("continue", 10);

                        case 10:
                          _context4.next = 6;
                          break;

                        case 12:
                          _context4.next = 17;
                          break;

                        case 14:
                          _context4.prev = 14;
                          _context4.t0 = _context4["catch"](3);

                          _iterator4.e(_context4.t0);

                        case 17:
                          _context4.prev = 17;

                          _iterator4.f();

                          return _context4.finish(17);

                        case 20:
                          _context4.next = 22;
                          return Promise.any(checkPromises);

                        case 22:
                          firstAvailable = _context4.sent;

                          if (!firstAvailable) {
                            _context4.next = 25;
                            break;
                          }

                          return _context4.abrupt("return", {
                            v: firstAvailable
                          });

                        case 25:
                        case "end":
                          return _context4.stop();
                      }
                    }
                  }, _callee4, null, [[3, 14, 17, 20]]);
                })(), "t0", 7);

              case 7:
                _ret = _context5.t0;

                if (!((0, _typeof2["default"])(_ret) === "object")) {
                  _context5.next = 10;
                  break;
                }

                return _context5.abrupt("return", _ret.v);

              case 10:
                _context5.next = 16;
                break;

              case 12:
                _context5.prev = 12;
                _context5.t1 = _context5["catch"](5);

                if (_context5.t1 instanceof AggregateError) {
                  _context5.next = 16;
                  break;
                }

                throw new _MoneroError["default"](_context5.t1);

              case 16:
                _context5.next = 3;
                break;

              case 18:
                _context5.next = 23;
                break;

              case 20:
                _context5.prev = 20;
                _context5.t2 = _context5["catch"](1);

                _iterator3.e(_context5.t2);

              case 23:
                _context5.prev = 23;

                _iterator3.f();

                return _context5.finish(23);

              case 26:
                return _context5.abrupt("return", undefined);

              case 27:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this, [[1, 20, 23, 26], [5, 12]]);
      }));

      function getBestAvailableConnection(_x3) {
        return _getBestAvailableConnection.apply(this, arguments);
      }

      return getBestAvailableConnection;
    }()
    /**
     * Set the current connection.
     * Provide a URI to select an existing connection without updating its credentials.
     * Provide a MoneroRpcConnection to add new connection or update credentials of existing connection with same URI.
     * Notify if current connection changes.
     * Does not check the connection.
     * 
     * @param {string|MoneroRpcConnection} [uriOrConnection] - is the uri of the connection or the connection to make current (default undefined for no current connection)
     * @return {MoneroConnectionManager} this connection manager for chaining
     */

  }, {
    key: "setConnection",
    value: function setConnection(uriOrConnection) {
      // handle uri
      if (uriOrConnection && typeof uriOrConnection === "string") {
        var _connection = this.getConnectionByUri(uriOrConnection);

        return this.setConnection(_connection === undefined ? new _MoneroRpcConnection["default"](uriOrConnection) : _connection);
      } // handle connection


      var connection = uriOrConnection;
      if (this._currentConnection === connection) return this; // check if setting undefined connection

      if (!connection) {
        this._currentConnection = undefined;

        this._onConnectionChanged(undefined);

        return this;
      } // validate connection


      if (!(connection instanceof _MoneroRpcConnection["default"])) throw new _MoneroError["default"]("Must provide string or MoneroRpcConnection to set connection");
      if (!connection.getUri()) throw new _MoneroError["default"]("Connection is missing URI"); // check if adding new connection

      var prevConnection = this.getConnectionByUri(connection.getUri());

      if (!prevConnection) {
        this.addConnection(connection);
        this._currentConnection = connection;
        if (this._proxyToWorker !== undefined) connection.setProxyToWorker(this._proxyToWorker);

        this._onConnectionChanged(this._currentConnection);

        return this;
      } // check if updating current connection


      if (prevConnection !== this._currentConnection || prevConnection.getUsername() !== connection.getUsername() || prevConnection.getPassword() !== connection.getPassword() || prevConnection.getPriority() !== connection.getPriority()) {
        prevConnection.setCredentials(connection.getUsername(), connection.getPassword());
        prevConnection.setPriority(connection.getPriority());
        this._currentConnection = prevConnection;
        if (this._proxyToWorker !== undefined) connection.setProxyToWorker(this._proxyToWorker);

        this._onConnectionChanged(this._currentConnection);
      }

      return this;
    }
    /**
     * Check the current connection. If disconnected and auto switch enabled, switches to best available connection.
     * 
     * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
     */

  }, {
    key: "checkConnection",
    value: function () {
      var _checkConnection = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
        var connectionChanged, connection, bestConnection;
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                connectionChanged = false;
                connection = this.getConnection();
                _context6.t0 = connection;

                if (!_context6.t0) {
                  _context6.next = 7;
                  break;
                }

                _context6.next = 6;
                return connection.checkConnection(this._timeoutInMs);

              case 6:
                _context6.t0 = _context6.sent;

              case 7:
                if (!_context6.t0) {
                  _context6.next = 9;
                  break;
                }

                connectionChanged = true;

              case 9:
                if (!(this._autoSwitch && !this.isConnected())) {
                  _context6.next = 16;
                  break;
                }

                _context6.next = 12;
                return this.getBestAvailableConnection([connection]);

              case 12:
                bestConnection = _context6.sent;

                if (!bestConnection) {
                  _context6.next = 16;
                  break;
                }

                this.setConnection(bestConnection);
                return _context6.abrupt("return", this);

              case 16:
                if (!connectionChanged) {
                  _context6.next = 19;
                  break;
                }

                _context6.next = 19;
                return this._onConnectionChanged(connection);

              case 19:
                return _context6.abrupt("return", this);

              case 20:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function checkConnection() {
        return _checkConnection.apply(this, arguments);
      }

      return checkConnection;
    }()
    /**
     * Check all managed connections.
     * 
     * @return {Promise<MoneroConnectionManager>} this connection manager for chaining
     */

  }, {
    key: "checkConnections",
    value: function () {
      var _checkConnections = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7() {
        var _iterator5, _step5, prioritizedConnections, bestConnection, _iterator6, _step6, prioritizedConnection;

        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.next = 2;
                return Promise.all(this.checkConnectionPromises());

              case 2:
                if (!(this._autoSwitch && !this.isConnected())) {
                  _context7.next = 24;
                  break;
                }

                _iterator5 = _createForOfIteratorHelper(this._getConnectionsInAscendingPriority());
                _context7.prev = 4;

                _iterator5.s();

              case 6:
                if ((_step5 = _iterator5.n()).done) {
                  _context7.next = 16;
                  break;
                }

                prioritizedConnections = _step5.value;
                bestConnection = void 0;
                _iterator6 = _createForOfIteratorHelper(prioritizedConnections);

                try {
                  for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                    prioritizedConnection = _step6.value;

                    if (prioritizedConnection.isConnected() && (!bestConnection || prioritizedConnection.getResponseTime() < bestConnection.getResponseTime())) {
                      bestConnection = prioritizedConnection;
                    }
                  }
                } catch (err) {
                  _iterator6.e(err);
                } finally {
                  _iterator6.f();
                }

                if (!bestConnection) {
                  _context7.next = 14;
                  break;
                }

                this.setConnection(bestConnection);
                return _context7.abrupt("break", 16);

              case 14:
                _context7.next = 6;
                break;

              case 16:
                _context7.next = 21;
                break;

              case 18:
                _context7.prev = 18;
                _context7.t0 = _context7["catch"](4);

                _iterator5.e(_context7.t0);

              case 21:
                _context7.prev = 21;

                _iterator5.f();

                return _context7.finish(21);

              case 24:
                return _context7.abrupt("return", this);

              case 25:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this, [[4, 18, 21, 24]]);
      }));

      function checkConnections() {
        return _checkConnections.apply(this, arguments);
      }

      return checkConnections;
    }()
    /**
     * Check all managed connections, returning a promise for each connection check.
     * Does not auto switch if disconnected.
     *
     * @return {Promise[]} a promise for each connection in the order of getConnections().
     */

  }, {
    key: "checkConnectionPromises",
    value: function checkConnectionPromises() {
      var that = this;
      var checkPromises = [];
      var pool = new _ThreadPool["default"](this._connections.length);

      var _iterator7 = _createForOfIteratorHelper(this.getConnections()),
          _step7;

      try {
        var _loop2 = function _loop2() {
          var connection = _step7.value;
          checkPromises.push(pool.submit( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8() {
            return _regenerator["default"].wrap(function _callee8$(_context8) {
              while (1) {
                switch (_context8.prev = _context8.next) {
                  case 0:
                    _context8.prev = 0;
                    _context8.next = 3;
                    return connection.checkConnection(that._timeoutInMs);

                  case 3:
                    _context8.t0 = _context8.sent;

                    if (!_context8.t0) {
                      _context8.next = 6;
                      break;
                    }

                    _context8.t0 = connection === this._currentConnection;

                  case 6:
                    if (!_context8.t0) {
                      _context8.next = 9;
                      break;
                    }

                    _context8.next = 9;
                    return that._onConnectionChanged(connection);

                  case 9:
                    _context8.next = 13;
                    break;

                  case 11:
                    _context8.prev = 11;
                    _context8.t1 = _context8["catch"](0);

                  case 13:
                  case "end":
                    return _context8.stop();
                }
              }
            }, _callee8, this, [[0, 11]]);
          }))));
        };

        for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
          _loop2();
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }

      Promise.all(checkPromises);
      return checkPromises;
    }
    /**
     * Check the connection and start checking the connection periodically.
     * 
     * @param {number} periodMs is the time between checks in milliseconds (default 10000 or 10 seconds)
     * @return {Promise<MoneroConnectionManager>} this connection manager for chaining (after first checking the connection)
     */

  }, {
    key: "startCheckingConnection",
    value: function () {
      var _startCheckingConnection = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10(periodMs) {
        var that, firstCheck;
        return _regenerator["default"].wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                _context10.next = 2;
                return this.checkConnection();

              case 2:
                if (!periodMs) periodMs = MoneroConnectionManager.DEFAULT_CHECK_CONNECTION_PERIOD;

                if (!this._checkLooper) {
                  _context10.next = 5;
                  break;
                }

                return _context10.abrupt("return", this);

              case 5:
                that = this;
                firstCheck = true;
                this._checkLooper = new _TaskLooper["default"]( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9() {
                  return _regenerator["default"].wrap(function _callee9$(_context9) {
                    while (1) {
                      switch (_context9.prev = _context9.next) {
                        case 0:
                          if (!firstCheck) {
                            _context9.next = 3;
                            break;
                          }

                          firstCheck = false; // skip first check

                          return _context9.abrupt("return");

                        case 3:
                          _context9.prev = 3;
                          _context9.next = 6;
                          return that.checkConnection();

                        case 6:
                          _context9.next = 11;
                          break;

                        case 8:
                          _context9.prev = 8;
                          _context9.t0 = _context9["catch"](3);
                          console.error("Error checking connection: " + _context9.t0);

                        case 11:
                        case "end":
                          return _context9.stop();
                      }
                    }
                  }, _callee9, null, [[3, 8]]);
                })));

                this._checkLooper.start(periodMs);

                return _context10.abrupt("return", this);

              case 10:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function startCheckingConnection(_x6) {
        return _startCheckingConnection.apply(this, arguments);
      }

      return startCheckingConnection;
    }()
    /**
     * Stop checking the connection status periodically.
     * 
     * @return {MoneroConnectionManager} this connection manager for chaining
     */

  }, {
    key: "stopCheckingConnection",
    value: function stopCheckingConnection() {
      if (this._checkLooper) this._checkLooper.stop();
      delete this._checkLooper;
      return this;
    }
    /**
     * Automatically switch to best available connection if current connection is disconnected after being checked.
     * 
     * @param {boolean} autoSwitch specifies if the connection should switch on disconnect
     * @return {MoneroConnectionManager} this connection manager for chaining
     */

  }, {
    key: "setAutoSwitch",
    value: function setAutoSwitch(autoSwitch) {
      this._autoSwitch = autoSwitch;
      return this;
    }
    /**
     * Get if auto switch is enabled or disabled.
     * 
     * @return {boolean} true if auto switch enabled, false otherwise
     */

  }, {
    key: "getAutoSwitch",
    value: function getAutoSwitch() {
      return this._autoSwitch;
    }
    /**
     * Set the maximum request time before its connection is considered offline.
     * 
     * @param {number} timeoutInMs - the timeout before the connection is considered offline
     * @return {MoneroConnectionManager} this connection manager for chaining
     */

  }, {
    key: "setTimeout",
    value: function setTimeout(timeoutInMs) {
      this._timeoutInMs = timeoutInMs;
      return this;
    }
    /**
     * Get the request timeout.
     * 
     * @return {int} the request timeout before a connection is considered offline
     */

  }, {
    key: "getTimeout",
    value: function getTimeout() {
      return this._timeoutInMs;
    }
    /**
     * Collect connectable peers of the managed connections.
     *
     * @return {MoneroRpcConnection[]} connectable peers
     */

  }, {
    key: "getPeerConnections",
    value: function () {
      var _getPeerConnections = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11() {
        return _regenerator["default"].wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                throw new _MoneroError["default"]("Not implemented");

              case 1:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11);
      }));

      function getPeerConnections() {
        return _getPeerConnections.apply(this, arguments);
      }

      return getPeerConnections;
    }()
    /**
     * Disconnect from the current connection.
     * 
     * @return {MoneroConnectionManager} this connection manager for chaining
     */

  }, {
    key: "disconnect",
    value: function disconnect() {
      this.setConnection(undefined);
      return this;
    }
    /**
     * Remove all connections.
     * 
     * @return {MoneroConnectonManager} this connection manager for chaining
     */

  }, {
    key: "clear",
    value: function clear() {
      this._connections.splice(0, this._connections.length);

      if (this._currentConnection) {
        this._currentConnection = undefined;

        this._onConnectionChanged(undefined);
      }

      return this;
    }
    /**
     * Reset to default state.
     * 
     * @return {MoneroConnectonManager} this connection manager for chaining
     */

  }, {
    key: "reset",
    value: function reset() {
      this.removeListeners();
      this.stopCheckingConnection();
      this.clear();
      this._timeoutMs = MoneroConnectionManager.DEFAULT_TIMEOUT;
      this._autoSwitch = false;
      return this;
    } // ------------------------------ PRIVATE HELPERS ---------------------------

  }, {
    key: "_onConnectionChanged",
    value: function () {
      var _onConnectionChanged2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee12(connection) {
        var promises, _iterator8, _step8, listener;

        return _regenerator["default"].wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                promises = [];
                _iterator8 = _createForOfIteratorHelper(this._listeners);

                try {
                  for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
                    listener = _step8.value;
                    promises.push(listener.onConnectionChanged(connection));
                  }
                } catch (err) {
                  _iterator8.e(err);
                } finally {
                  _iterator8.f();
                }

                return _context12.abrupt("return", Promise.all(promises));

              case 4:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function _onConnectionChanged(_x7) {
        return _onConnectionChanged2.apply(this, arguments);
      }

      return _onConnectionChanged;
    }()
  }, {
    key: "_getConnectionsInAscendingPriority",
    value: function _getConnectionsInAscendingPriority() {
      var connectionPriorities = new Map();

      var _iterator9 = _createForOfIteratorHelper(this._connections),
          _step9;

      try {
        for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
          var connection = _step9.value;
          if (!connectionPriorities.has(connection.getPriority())) connectionPriorities.set(connection.getPriority(), []);
          connectionPriorities.get(connection.getPriority()).push(connection);
        }
      } catch (err) {
        _iterator9.e(err);
      } finally {
        _iterator9.f();
      }

      var ascendingPriorities = new Map((0, _toConsumableArray2["default"])(connectionPriorities).sort(function (a, b) {
        return parseInt(a[0]) - parseInt(b[0]);
      })); // create map in ascending order

      var ascendingPrioritiesList = [];

      var _iterator10 = _createForOfIteratorHelper(ascendingPriorities.values()),
          _step10;

      try {
        for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
          var priorityConnections = _step10.value;
          ascendingPrioritiesList.push(priorityConnections);
        }
      } catch (err) {
        _iterator10.e(err);
      } finally {
        _iterator10.f();
      }

      if (connectionPriorities.has(0)) ascendingPrioritiesList.push(ascendingPrioritiesList.splice(0, 1)[0]); // move priority 0 to end

      return ascendingPrioritiesList;
    }
  }, {
    key: "_compareConnections",
    value: function _compareConnections(c1, c2) {
      // current connection is first
      if (c1 === this._currentConnection) return -1;
      if (c2 === this._currentConnection) return 1; // order by availability then priority then by name

      if (c1.isOnline() === c2.isOnline()) {
        if (c1.getPriority() === c2.getPriority()) return c1.getUri().localeCompare(c2.getUri());else return c1.getPriority() == 0 ? 1 : c2.getPriority() == 0 ? -1 : c1.getPriority() - c2.getPriority();
      } else {
        if (c1.isOnline()) return -1;else if (c2.isOnline()) return 1;else if (c1.isOnline() === undefined) return -1;else return 1; // c1 is offline
      }
    }
  }]);
  return MoneroConnectionManager;
}();

MoneroConnectionManager.DEFAULT_TIMEOUT = 5000;
MoneroConnectionManager.DEFAULT_CHECK_CONNECTION_PERIOD = 15000;
var _default = MoneroConnectionManager;
exports["default"] = _default;