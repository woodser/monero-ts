"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assert = _interopRequireDefault(require("assert"));

var _TestUtils = _interopRequireDefault(require("./utils/TestUtils"));

var _index = require("../../index");

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/**
 * Test the Monero RPC connection manager.
 */
var TestMoneroConnectionManager = /*#__PURE__*/function () {
  function TestMoneroConnectionManager() {
    (0, _classCallCheck2["default"])(this, TestMoneroConnectionManager);
  }

  (0, _createClass2["default"])(TestMoneroConnectionManager, [{
    key: "runTests",
    value: function runTests() {
      describe("Test connection manager", function () {
        it("Can manage connections", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
          var err, walletRpcs, i, connectionManager, listener, orderedConnections, _iterator, _step, _connection, connection, _i, _i2, isOnline, isAuthenticated, _i3, uri, _iterator2, _step2, _connection2, _i4, _walletRpcs, walletRpc;

          return _regenerator["default"].wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  walletRpcs = [];
                  _context.prev = 1;
                  i = 0;

                case 3:
                  if (!(i < 5)) {
                    _context.next = 12;
                    break;
                  }

                  _context.t0 = walletRpcs;
                  _context.next = 7;
                  return _TestUtils["default"].startWalletRpcProcess();

                case 7:
                  _context.t1 = _context.sent;

                  _context.t0.push.call(_context.t0, _context.t1);

                case 9:
                  i++;
                  _context.next = 3;
                  break;

                case 12:
                  // create connection manager
                  connectionManager = new _index.MoneroConnectionManager(); // listen for changes

                  listener = new ConnectionChangeCollector();
                  connectionManager.addListener(listener); // add prioritized connections

                  connectionManager.addConnection(walletRpcs[4].getRpcConnection().setPriority(1));
                  connectionManager.addConnection(walletRpcs[2].getRpcConnection().setPriority(2));
                  connectionManager.addConnection(walletRpcs[3].getRpcConnection().setPriority(2));
                  connectionManager.addConnection(walletRpcs[0].getRpcConnection()); // default priority is lowest

                  connectionManager.addConnection(new _index.MoneroRpcConnection(walletRpcs[1].getRpcConnection().getUri())); // test unauthenticated
                  // test connections and order

                  orderedConnections = connectionManager.getConnections();
                  (0, _assert["default"])(orderedConnections[0] === walletRpcs[4].getRpcConnection());
                  (0, _assert["default"])(orderedConnections[1] === walletRpcs[2].getRpcConnection());
                  (0, _assert["default"])(orderedConnections[2] === walletRpcs[3].getRpcConnection());
                  (0, _assert["default"])(orderedConnections[3] === walletRpcs[0].getRpcConnection());

                  _assert["default"].equal(orderedConnections[4].getUri(), walletRpcs[1].getRpcConnection().getUri());

                  _iterator = _createForOfIteratorHelper(orderedConnections);

                  try {
                    for (_iterator.s(); !(_step = _iterator.n()).done;) {
                      _connection = _step.value;

                      _assert["default"].equal(undefined, _connection.isOnline());
                    } // auto connect to best available connection

                  } catch (err) {
                    _iterator.e(err);
                  } finally {
                    _iterator.f();
                  }

                  connectionManager.setAutoSwitch(true);
                  _context.next = 31;
                  return connectionManager.startCheckingConnection(_TestUtils["default"].SYNC_PERIOD_IN_MS);

                case 31:
                  (0, _assert["default"])(connectionManager.isConnected());
                  connection = connectionManager.getConnection();
                  (0, _assert["default"])(connection.isOnline());
                  (0, _assert["default"])(connection === walletRpcs[4].getRpcConnection());

                  _assert["default"].equal(1, listener.changedConnections.length);

                  (0, _assert["default"])(listener.changedConnections[listener.changedConnections.length - 1] === connection);
                  connectionManager.setAutoSwitch(false);
                  connectionManager.stopCheckingConnection();
                  connectionManager.disconnect();

                  _assert["default"].equal(2, listener.changedConnections.length);

                  (0, _assert["default"])(listener.changedConnections[listener.changedConnections.length - 1] === undefined); // start periodically checking connection

                  _context.next = 44;
                  return connectionManager.startCheckingConnection(_TestUtils["default"].SYNC_PERIOD_IN_MS);

                case 44:
                  _context.next = 46;
                  return connectionManager.getBestAvailableConnection();

                case 46:
                  connection = _context.sent;
                  connectionManager.setConnection(connection);
                  (0, _assert["default"])(connection === walletRpcs[4].getRpcConnection());
                  (0, _assert["default"])(connection.isOnline());
                  (0, _assert["default"])(connection.isAuthenticated());

                  _assert["default"].equal(3, listener.changedConnections.length);

                  (0, _assert["default"])(listener.changedConnections[listener.changedConnections.length - 1] === connection); // test connections and order

                  orderedConnections = connectionManager.getConnections();
                  (0, _assert["default"])(orderedConnections[0] === walletRpcs[4].getRpcConnection());
                  (0, _assert["default"])(orderedConnections[1] === walletRpcs[2].getRpcConnection());
                  (0, _assert["default"])(orderedConnections[2] === walletRpcs[3].getRpcConnection());
                  (0, _assert["default"])(orderedConnections[3] === walletRpcs[0].getRpcConnection());

                  _assert["default"].equal(orderedConnections[4].getUri(), walletRpcs[1].getRpcConnection().getUri());

                  for (_i = 1; _i < orderedConnections.length; _i++) {
                    _assert["default"].equal(undefined, orderedConnections[_i].isOnline());
                  } // shut down prioritized servers


                  walletRpcs[2].getRpcConnection()._setFakeDisconnected(true); // browser does not start or stop instances


                  walletRpcs[3].getRpcConnection()._setFakeDisconnected(true);

                  walletRpcs[4].getRpcConnection()._setFakeDisconnected(true);

                  _context.next = 65;
                  return _index.GenUtils.waitFor(_TestUtils["default"].SYNC_PERIOD_IN_MS + 100);

                case 65:
                  _assert["default"].equal(false, connectionManager.isConnected());

                  _assert["default"].equal(false, connectionManager.getConnection().isOnline());

                  _assert["default"].equal(undefined, connectionManager.getConnection().isAuthenticated());

                  _assert["default"].equal(4, listener.changedConnections.length);

                  (0, _assert["default"])(listener.changedConnections[listener.changedConnections.length - 1] === connectionManager.getConnection()); // test connection order

                  orderedConnections = connectionManager.getConnections();
                  (0, _assert["default"])(orderedConnections[0] === walletRpcs[4].getRpcConnection());
                  (0, _assert["default"])(orderedConnections[1] === walletRpcs[2].getRpcConnection());
                  (0, _assert["default"])(orderedConnections[2] === walletRpcs[3].getRpcConnection());
                  (0, _assert["default"])(orderedConnections[3] === walletRpcs[0].getRpcConnection());

                  _assert["default"].equal(orderedConnections[4].getUri(), walletRpcs[1].getRpcConnection().getUri()); // check all connections


                  _context.next = 78;
                  return connectionManager.checkConnections();

                case 78:
                  // test connection order
                  orderedConnections = connectionManager.getConnections();
                  (0, _assert["default"])(orderedConnections[0] === walletRpcs[4].getRpcConnection());
                  (0, _assert["default"])(orderedConnections[1] === walletRpcs[0].getRpcConnection());
                  (0, _assert["default"])(orderedConnections[2].getUri() === walletRpcs[1].getRpcConnection().getUri());
                  (0, _assert["default"])(orderedConnections[3] === walletRpcs[2].getRpcConnection());
                  (0, _assert["default"])(orderedConnections[4] === walletRpcs[3].getRpcConnection()); // test online and authentication status

                  for (_i2 = 0; _i2 < orderedConnections.length; _i2++) {
                    isOnline = orderedConnections[_i2].isOnline();
                    isAuthenticated = orderedConnections[_i2].isAuthenticated();
                    if (_i2 === 1 || _i2 === 2) _assert["default"].equal(true, isOnline);else _assert["default"].equal(false, isOnline);
                    if (_i2 === 1) _assert["default"].equal(true, isAuthenticated);else if (_i2 === 2) _assert["default"].equal(false, isAuthenticated);else _assert["default"].equal(undefined, isAuthenticated);
                  } // test auto switch when disconnected


                  connectionManager.setAutoSwitch(true);
                  _context.next = 88;
                  return _index.GenUtils.waitFor(_TestUtils["default"].SYNC_PERIOD_IN_MS + 100);

                case 88:
                  // allow time to poll
                  (0, _assert["default"])(connectionManager.isConnected());
                  connection = connectionManager.getConnection();
                  (0, _assert["default"])(connection.isOnline());
                  (0, _assert["default"])(connection === walletRpcs[0].getRpcConnection());

                  _assert["default"].equal(5, listener.changedConnections.length);

                  (0, _assert["default"])(listener.changedConnections[listener.changedConnections.length - 1] === connection); // test connection order

                  orderedConnections = connectionManager.getConnections();
                  (0, _assert["default"])(orderedConnections[0] === connection);
                  (0, _assert["default"])(orderedConnections[0] === walletRpcs[0].getRpcConnection());
                  (0, _assert["default"])(orderedConnections[1].getUri() === walletRpcs[1].getRpcConnection().getUri());
                  (0, _assert["default"])(orderedConnections[2] === walletRpcs[4].getRpcConnection());
                  (0, _assert["default"])(orderedConnections[3] === walletRpcs[2].getRpcConnection());
                  (0, _assert["default"])(orderedConnections[4] === walletRpcs[3].getRpcConnection()); // connect to specific endpoint without authentication

                  connection = orderedConnections[1];

                  _assert["default"].equal(false, connection.isAuthenticated());

                  connectionManager.setConnection(connection);

                  _assert["default"].equal(false, connectionManager.isConnected());

                  _assert["default"].equal(6, listener.changedConnections.length); // connect to specific endpoint with authentication


                  connectionManager.setAutoSwitch(false);
                  orderedConnections[1].setCredentials("rpc_user", "abc123");
                  _context.next = 110;
                  return connectionManager.checkConnection();

                case 110:
                  _assert["default"].equal(connection.getUri(), walletRpcs[1].getRpcConnection().getUri());

                  (0, _assert["default"])(connection.isOnline());
                  (0, _assert["default"])(connection.isAuthenticated());

                  _assert["default"].equal(7, listener.changedConnections.length);

                  (0, _assert["default"])(listener.changedConnections[listener.changedConnections.length - 1] === connection); // test connection order

                  orderedConnections = connectionManager.getConnections();
                  (0, _assert["default"])(orderedConnections[0] === connectionManager.getConnection());

                  _assert["default"].equal(orderedConnections[0].getUri(), walletRpcs[1].getRpcConnection().getUri());

                  (0, _assert["default"])(orderedConnections[1] === walletRpcs[0].getRpcConnection());
                  (0, _assert["default"])(orderedConnections[2] === walletRpcs[4].getRpcConnection());
                  (0, _assert["default"])(orderedConnections[3] === walletRpcs[2].getRpcConnection());
                  (0, _assert["default"])(orderedConnections[4] === walletRpcs[3].getRpcConnection());

                  for (_i3 = 0; _i3 < orderedConnections.length; _i3++) {
                    (0, _assert["default"])(_i3 <= 1 ? orderedConnections[_i3].isOnline() : !orderedConnections[_i3].isOnline());
                  } // set connection to existing uri


                  connectionManager.setConnection(walletRpcs[0].getRpcConnection().getUri());
                  (0, _assert["default"])(connectionManager.isConnected());
                  (0, _assert["default"])(walletRpcs[0].getRpcConnection() === connectionManager.getConnection());

                  _assert["default"].equal(_TestUtils["default"].WALLET_RPC_CONFIG.username, connectionManager.getConnection().getUsername());

                  _assert["default"].equal(_TestUtils["default"].WALLET_RPC_CONFIG.password, connectionManager.getConnection().getPassword());

                  _assert["default"].equal(8, listener.changedConnections.length);

                  (0, _assert["default"])(listener.changedConnections[listener.changedConnections.length - 1] === walletRpcs[0].getRpcConnection()); // set connection to new uri

                  connectionManager.stopCheckingConnection();
                  uri = "http://localhost:49999";
                  connectionManager.setConnection(uri);

                  _assert["default"].equal(connectionManager.getConnection().getUri(), uri);

                  _assert["default"].equal(9, listener.changedConnections.length);

                  _assert["default"].equal(uri, listener.changedConnections[listener.changedConnections.length - 1].getUri()); // set connection to empty string


                  connectionManager.setConnection("");

                  _assert["default"].equal(undefined, connectionManager.getConnection());

                  _assert["default"].equal(10, listener.changedConnections.length); // check all connections and test auto switch


                  connectionManager.setAutoSwitch(true);
                  _context.next = 142;
                  return connectionManager.checkConnections();

                case 142:
                  _assert["default"].equal(11, listener.changedConnections.length);

                  (0, _assert["default"])(connectionManager.isConnected()); // check connection promises

                  _context.next = 146;
                  return Promise.all(connectionManager.checkConnectionPromises());

                case 146:
                  // shut down all connections
                  connection = connectionManager.getConnection();
                  _context.next = 149;
                  return connectionManager.startCheckingConnection(_TestUtils["default"].SYNC_PERIOD_IN_MS);

                case 149:
                  _iterator2 = _createForOfIteratorHelper(orderedConnections);

                  try {
                    for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                      _connection2 = _step2.value;

                      _connection2._setFakeDisconnected(true);
                    }
                  } catch (err) {
                    _iterator2.e(err);
                  } finally {
                    _iterator2.f();
                  }

                  _context.next = 153;
                  return _index.GenUtils.waitFor(_TestUtils["default"].SYNC_PERIOD_IN_MS + 100);

                case 153:
                  _assert["default"].equal(false, connection.isOnline());

                  _assert["default"].equal(12, listener.changedConnections.length);

                  (0, _assert["default"])(listener.changedConnections[listener.changedConnections.length - 1] === connection); // reset

                  connectionManager.reset();

                  _assert["default"].equal(connectionManager.getConnections().length, 0);

                  _assert["default"].equal(connectionManager.getConnection(), undefined);

                  _context.next = 164;
                  break;

                case 161:
                  _context.prev = 161;
                  _context.t2 = _context["catch"](1);
                  err = _context.t2;

                case 164:
                  _i4 = 0, _walletRpcs = walletRpcs;

                case 165:
                  if (!(_i4 < _walletRpcs.length)) {
                    _context.next = 177;
                    break;
                  }

                  walletRpc = _walletRpcs[_i4];
                  _context.prev = 167;
                  _context.next = 170;
                  return _TestUtils["default"].stopWalletRpcProcess(walletRpc);

                case 170:
                  _context.next = 174;
                  break;

                case 172:
                  _context.prev = 172;
                  _context.t3 = _context["catch"](167);

                case 174:
                  _i4++;
                  _context.next = 165;
                  break;

                case 177:
                  if (!err) {
                    _context.next = 179;
                    break;
                  }

                  throw err;

                case 179:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee, null, [[1, 161], [167, 172]]);
        })));
      });
    }
  }]);
  return TestMoneroConnectionManager;
}();

var ConnectionChangeCollector = /*#__PURE__*/function (_MoneroConnectionMana) {
  (0, _inherits2["default"])(ConnectionChangeCollector, _MoneroConnectionMana);

  var _super = _createSuper(ConnectionChangeCollector);

  function ConnectionChangeCollector() {
    var _this;

    (0, _classCallCheck2["default"])(this, ConnectionChangeCollector);
    _this = _super.call(this);
    _this.changedConnections = [];
    return _this;
  }

  (0, _createClass2["default"])(ConnectionChangeCollector, [{
    key: "onConnectionChanged",
    value: function () {
      var _onConnectionChanged = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(connection) {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                this.changedConnections.push(connection);

              case 1:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function onConnectionChanged(_x) {
        return _onConnectionChanged.apply(this, arguments);
      }

      return onConnectionChanged;
    }()
  }]);
  return ConnectionChangeCollector;
}(_index.MoneroConnectionManagerListener);

var _default = TestMoneroConnectionManager;
exports["default"] = _default;