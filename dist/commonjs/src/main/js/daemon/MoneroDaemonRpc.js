"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _get2 = _interopRequireDefault(require("@babel/runtime/helpers/get"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _assert = _interopRequireDefault(require("assert"));

var _GenUtils = _interopRequireDefault(require("../common/GenUtils"));

var _LibraryUtils = _interopRequireDefault(require("../common/LibraryUtils"));

var _TaskLooper = _interopRequireDefault(require("../common/TaskLooper"));

var _MoneroAltChain = _interopRequireDefault(require("./model/MoneroAltChain"));

var _MoneroBan = _interopRequireDefault(require("./model/MoneroBan"));

var _MoneroBlock = _interopRequireDefault(require("./model/MoneroBlock"));

var _MoneroBlockHeader = _interopRequireDefault(require("./model/MoneroBlockHeader"));

var _MoneroBlockTemplate = _interopRequireDefault(require("./model/MoneroBlockTemplate"));

var _MoneroDaemon3 = _interopRequireDefault(require("./MoneroDaemon"));

var _MoneroDaemonInfo = _interopRequireDefault(require("./model/MoneroDaemonInfo"));

var _MoneroDaemonListener2 = _interopRequireDefault(require("./model/MoneroDaemonListener"));

var _MoneroDaemonSyncInfo = _interopRequireDefault(require("./model/MoneroDaemonSyncInfo"));

var _MoneroError = _interopRequireDefault(require("../common/MoneroError"));

var _MoneroHardForkInfo = _interopRequireDefault(require("./model/MoneroHardForkInfo"));

var _MoneroKeyImage = _interopRequireDefault(require("./model/MoneroKeyImage"));

var _MoneroMinerTxSum = _interopRequireDefault(require("./model/MoneroMinerTxSum"));

var _MoneroMiningStatus = _interopRequireDefault(require("./model/MoneroMiningStatus"));

var _MoneroNetworkType = _interopRequireDefault(require("./model/MoneroNetworkType"));

var _MoneroOutput = _interopRequireDefault(require("./model/MoneroOutput"));

var _MoneroOutputHistogramEntry = _interopRequireDefault(require("./model/MoneroOutputHistogramEntry"));

var _MoneroPeer = _interopRequireDefault(require("./model/MoneroPeer"));

var _MoneroRpcConnection = _interopRequireDefault(require("../common/MoneroRpcConnection"));

var _MoneroSubmitTxResult = _interopRequireDefault(require("./model/MoneroSubmitTxResult"));

var _MoneroTx = _interopRequireDefault(require("./model/MoneroTx"));

var _MoneroTxPoolStats = _interopRequireDefault(require("./model/MoneroTxPoolStats"));

var _MoneroUtils = _interopRequireDefault(require("../common/MoneroUtils"));

var _MoneroVersion = _interopRequireDefault(require("./model/MoneroVersion"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Copyright (c) woodser
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Implements a MoneroDaemon as a client of monerod.
 * 
 * @implements {MoneroDaemon}
 * @hideconstructor
 */
var MoneroDaemonRpc = /*#__PURE__*/function (_MoneroDaemon) {
  (0, _inherits2["default"])(MoneroDaemonRpc, _MoneroDaemon);

  var _super = _createSuper(MoneroDaemonRpc);

  /**
   * <p>Construct a daemon RPC client (for internal use).<p>
   * 
   * @param {string|object|MoneroRpcConnection} uriOrConfig - uri of monerod or JS config object or MoneroRpcConnection
   * @param {string} uriOrConfig.uri - uri of monerod
   * @param {string} [uriOrConfig.username] - username to authenticate with monerod (optional)
   * @param {string} [uriOrConfig.password] - password to authenticate with monerod (optional)
   * @param {boolean} [uriOrConfig.rejectUnauthorized] - rejects self-signed certificates if true (default true)
   * @param {number} [uriOrConfig.pollInterval] - poll interval to query for updates in ms (default 5000)
   * @param {string} [username] - username to authenticate with monerod (optional)
   * @param {string} [password] - password to authenticate with monerod (optional)
   * @param {boolean} [rejectUnauthorized] - rejects self-signed certificates if true (default true)
   * @param {number} [pollInterval] - poll interval to query for updates in ms (default 5000)
   * @param {boolean} [proxyToWorker] - runs the daemon client in a worker if true (default true)
   */
  function MoneroDaemonRpc(uriOrConfig, username, password, rejectUnauthorized, pollInterval, proxyToWorker) {
    var _this;

    (0, _classCallCheck2["default"])(this, MoneroDaemonRpc);
    _this = _super.call(this);
    if (_GenUtils["default"].isArray(uriOrConfig)) throw new Error("Use connectToDaemonRpc(...) to use terminal parameters");
    _this.config = MoneroDaemonRpc._normalizeConfig(uriOrConfig, username, password, rejectUnauthorized, pollInterval, proxyToWorker);
    if (_this.config.proxyToWorker) throw new Error("Use connectToDaemonRpc(...) to proxy to worker");
    var rpcConfig = Object.assign({}, _this.config);
    delete rpcConfig.proxyToWorker;
    delete rpcConfig.pollInterval;
    _this.rpc = new _MoneroRpcConnection["default"](rpcConfig);
    _this.listeners = []; // block listeners

    _this.cachedHeaders = {}; // cached headers for fetching blocks in bound chunks

    return _this;
  }
  /**
   * <p>Create a client connected to monerod (for internal use).</p>
   * 
   * @param {string|string[]|object|MoneroRpcConnection} uriOrConfig - uri of monerod or terminal parameters or JS config object or MoneroRpcConnection
   * @param {string} uriOrConfig.uri - uri of monerod
   * @param {string} [uriOrConfig.username] - username to authenticate with monerod (optional)
   * @param {string} [uriOrConfig.password] - password to authenticate with monerod (optional)
   * @param {boolean} [uriOrConfig.rejectUnauthorized] - rejects self-signed certificates if true (default true)
   * @param {number} [uriOrConfig.pollInterval] - poll interval to query for updates in ms (default 5000)
   * @param {boolean} [uriOrConfig.proxyToWorker] - run the daemon client in a worker if true (default true)
   * @param {string} [username] - username to authenticate with monerod (optional)
   * @param {string} [password] - password to authenticate with monerod (optional)
   * @param {boolean} [rejectUnauthorized] - rejects self-signed certificates if true (default true)
   * @param {number} [pollInterval] - poll interval to query for updates in ms (default 5000)
   * @param {boolean} [proxyToWorker] - runs the daemon client in a worker if true (default true)
   * @return {MoneroDaemonRpc} the daemon RPC client
   */


  (0, _createClass2["default"])(MoneroDaemonRpc, [{
    key: "getProcess",
    value:
    /**
     * Get the internal process running monerod.
     * 
     * @return the process running monerod, undefined if not created from new process
     */
    function getProcess() {
      return this.process;
    }
    /**
     * Stop the internal process running monerod, if applicable.
     */

  }, {
    key: "stopProcess",
    value: function () {
      var _stopProcess = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        var listenersCopy, _iterator, _step, listener;

        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!(this.process === undefined)) {
                  _context.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("MoneroDaemonRpc instance not created from new process");

              case 2:
                listenersCopy = _GenUtils["default"].copyArray(this.getListeners());
                _iterator = _createForOfIteratorHelper(listenersCopy);
                _context.prev = 4;

                _iterator.s();

              case 6:
                if ((_step = _iterator.n()).done) {
                  _context.next = 12;
                  break;
                }

                listener = _step.value;
                _context.next = 10;
                return this.removeListener(listener);

              case 10:
                _context.next = 6;
                break;

              case 12:
                _context.next = 17;
                break;

              case 14:
                _context.prev = 14;
                _context.t0 = _context["catch"](4);

                _iterator.e(_context.t0);

              case 17:
                _context.prev = 17;

                _iterator.f();

                return _context.finish(17);

              case 20:
                return _context.abrupt("return", _GenUtils["default"].killProcess(this.process));

              case 21:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this, [[4, 14, 17, 20]]);
      }));

      function stopProcess() {
        return _stopProcess.apply(this, arguments);
      }

      return stopProcess;
    }()
  }, {
    key: "addListener",
    value: function () {
      var _addListener = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(listener) {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                (0, _assert["default"])(listener instanceof _MoneroDaemonListener2["default"], "Listener must be instance of MoneroDaemonListener");
                this.listeners.push(listener);

                this._refreshListening();

              case 3:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function addListener(_x) {
        return _addListener.apply(this, arguments);
      }

      return addListener;
    }()
  }, {
    key: "removeListener",
    value: function () {
      var _removeListener = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(listener) {
        var idx;
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                (0, _assert["default"])(listener instanceof _MoneroDaemonListener2["default"], "Listener must be instance of MoneroDaemonListener");
                idx = this.listeners.indexOf(listener);

                if (!(idx > -1)) {
                  _context3.next = 6;
                  break;
                }

                this.listeners.splice(idx, 1);
                _context3.next = 7;
                break;

              case 6:
                throw new _MoneroError["default"]("Listener is not registered with daemon");

              case 7:
                this._refreshListening();

              case 8:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function removeListener(_x2) {
        return _removeListener.apply(this, arguments);
      }

      return removeListener;
    }()
  }, {
    key: "getListeners",
    value: function getListeners() {
      return this.listeners;
    }
    /**
     * Get the daemon's RPC connection.
     * 
     * @return {MoneroRpcConnection} the daemon's rpc connection
     */

  }, {
    key: "getRpcConnection",
    value: function () {
      var _getRpcConnection = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                return _context4.abrupt("return", this.rpc);

              case 1:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function getRpcConnection() {
        return _getRpcConnection.apply(this, arguments);
      }

      return getRpcConnection;
    }()
  }, {
    key: "isConnected",
    value: function () {
      var _isConnected = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                _context5.prev = 0;
                _context5.next = 3;
                return this.getVersion();

              case 3:
                return _context5.abrupt("return", true);

              case 6:
                _context5.prev = 6;
                _context5.t0 = _context5["catch"](0);
                return _context5.abrupt("return", false);

              case 9:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5, this, [[0, 6]]);
      }));

      function isConnected() {
        return _isConnected.apply(this, arguments);
      }

      return isConnected;
    }()
  }, {
    key: "getVersion",
    value: function () {
      var _getVersion = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
        var resp;
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                _context6.next = 2;
                return this.rpc.sendJsonRequest("get_version");

              case 2:
                resp = _context6.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

                return _context6.abrupt("return", new _MoneroVersion["default"](resp.result.version, resp.result.release));

              case 5:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6, this);
      }));

      function getVersion() {
        return _getVersion.apply(this, arguments);
      }

      return getVersion;
    }()
  }, {
    key: "isTrusted",
    value: function () {
      var _isTrusted = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7() {
        var resp;
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                _context7.next = 2;
                return this.rpc.sendPathRequest("get_height");

              case 2:
                resp = _context7.sent;

                MoneroDaemonRpc._checkResponseStatus(resp);

                return _context7.abrupt("return", !resp.untrusted);

              case 5:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7, this);
      }));

      function isTrusted() {
        return _isTrusted.apply(this, arguments);
      }

      return isTrusted;
    }()
  }, {
    key: "getHeight",
    value: function () {
      var _getHeight = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8() {
        var resp;
        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                _context8.next = 2;
                return this.rpc.sendJsonRequest("get_block_count");

              case 2:
                resp = _context8.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

                return _context8.abrupt("return", resp.result.count);

              case 5:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8, this);
      }));

      function getHeight() {
        return _getHeight.apply(this, arguments);
      }

      return getHeight;
    }()
  }, {
    key: "getBlockHash",
    value: function () {
      var _getBlockHash = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9(height) {
        return _regenerator["default"].wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                _context9.next = 2;
                return this.rpc.sendJsonRequest("on_get_block_hash", [height]);

              case 2:
                return _context9.abrupt("return", _context9.sent.result);

              case 3:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9, this);
      }));

      function getBlockHash(_x3) {
        return _getBlockHash.apply(this, arguments);
      }

      return getBlockHash;
    }()
  }, {
    key: "getBlockTemplate",
    value: function () {
      var _getBlockTemplate = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10(walletAddress, reserveSize) {
        var resp;
        return _regenerator["default"].wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                (0, _assert["default"])(walletAddress && typeof walletAddress === "string", "Must specify wallet address to be mined to");
                _context10.next = 3;
                return this.rpc.sendJsonRequest("get_block_template", {
                  wallet_address: walletAddress,
                  reserve_size: reserveSize
                });

              case 3:
                resp = _context10.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

                return _context10.abrupt("return", MoneroDaemonRpc._convertRpcBlockTemplate(resp.result));

              case 6:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10, this);
      }));

      function getBlockTemplate(_x4, _x5) {
        return _getBlockTemplate.apply(this, arguments);
      }

      return getBlockTemplate;
    }()
  }, {
    key: "getLastBlockHeader",
    value: function () {
      var _getLastBlockHeader = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11() {
        var resp;
        return _regenerator["default"].wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                _context11.next = 2;
                return this.rpc.sendJsonRequest("get_last_block_header");

              case 2:
                resp = _context11.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

                return _context11.abrupt("return", MoneroDaemonRpc._convertRpcBlockHeader(resp.result.block_header));

              case 5:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11, this);
      }));

      function getLastBlockHeader() {
        return _getLastBlockHeader.apply(this, arguments);
      }

      return getLastBlockHeader;
    }()
  }, {
    key: "getBlockHeaderByHash",
    value: function () {
      var _getBlockHeaderByHash = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee12(blockHash) {
        var resp;
        return _regenerator["default"].wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                _context12.next = 2;
                return this.rpc.sendJsonRequest("get_block_header_by_hash", {
                  hash: blockHash
                });

              case 2:
                resp = _context12.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

                return _context12.abrupt("return", MoneroDaemonRpc._convertRpcBlockHeader(resp.result.block_header));

              case 5:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee12, this);
      }));

      function getBlockHeaderByHash(_x6) {
        return _getBlockHeaderByHash.apply(this, arguments);
      }

      return getBlockHeaderByHash;
    }()
  }, {
    key: "getBlockHeaderByHeight",
    value: function () {
      var _getBlockHeaderByHeight = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee13(height) {
        var resp;
        return _regenerator["default"].wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                _context13.next = 2;
                return this.rpc.sendJsonRequest("get_block_header_by_height", {
                  height: height
                });

              case 2:
                resp = _context13.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

                return _context13.abrupt("return", MoneroDaemonRpc._convertRpcBlockHeader(resp.result.block_header));

              case 5:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee13, this);
      }));

      function getBlockHeaderByHeight(_x7) {
        return _getBlockHeaderByHeight.apply(this, arguments);
      }

      return getBlockHeaderByHeight;
    }()
  }, {
    key: "getBlockHeadersByRange",
    value: function () {
      var _getBlockHeadersByRange = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee14(startHeight, endHeight) {
        var resp, headers, _iterator2, _step2, rpcHeader;

        return _regenerator["default"].wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                _context14.next = 2;
                return this.rpc.sendJsonRequest("get_block_headers_range", {
                  start_height: startHeight,
                  end_height: endHeight
                });

              case 2:
                resp = _context14.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result); // build headers


                headers = [];
                _iterator2 = _createForOfIteratorHelper(resp.result.headers);

                try {
                  for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                    rpcHeader = _step2.value;
                    headers.push(MoneroDaemonRpc._convertRpcBlockHeader(rpcHeader));
                  }
                } catch (err) {
                  _iterator2.e(err);
                } finally {
                  _iterator2.f();
                }

                return _context14.abrupt("return", headers);

              case 8:
              case "end":
                return _context14.stop();
            }
          }
        }, _callee14, this);
      }));

      function getBlockHeadersByRange(_x8, _x9) {
        return _getBlockHeadersByRange.apply(this, arguments);
      }

      return getBlockHeadersByRange;
    }()
  }, {
    key: "getBlockByHash",
    value: function () {
      var _getBlockByHash = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee15(blockHash) {
        var resp;
        return _regenerator["default"].wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                _context15.next = 2;
                return this.rpc.sendJsonRequest("get_block", {
                  hash: blockHash
                });

              case 2:
                resp = _context15.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

                return _context15.abrupt("return", MoneroDaemonRpc._convertRpcBlock(resp.result));

              case 5:
              case "end":
                return _context15.stop();
            }
          }
        }, _callee15, this);
      }));

      function getBlockByHash(_x10) {
        return _getBlockByHash.apply(this, arguments);
      }

      return getBlockByHash;
    }()
  }, {
    key: "getBlockByHeight",
    value: function () {
      var _getBlockByHeight = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee16(height) {
        var resp;
        return _regenerator["default"].wrap(function _callee16$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                _context16.next = 2;
                return this.rpc.sendJsonRequest("get_block", {
                  height: height
                });

              case 2:
                resp = _context16.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

                return _context16.abrupt("return", MoneroDaemonRpc._convertRpcBlock(resp.result));

              case 5:
              case "end":
                return _context16.stop();
            }
          }
        }, _callee16, this);
      }));

      function getBlockByHeight(_x11) {
        return _getBlockByHeight.apply(this, arguments);
      }

      return getBlockByHeight;
    }()
  }, {
    key: "getBlocksByHeight",
    value: function () {
      var _getBlocksByHeight = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee17(heights) {
        var respBin, rpcBlocks, blocks, blockIdx, block, txs, txIdx, tx, _i, _txs, _tx;

        return _regenerator["default"].wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                _context17.next = 2;
                return this.rpc.sendBinaryRequest("get_blocks_by_height.bin", {
                  heights: heights
                });

              case 2:
                respBin = _context17.sent;
                _context17.next = 5;
                return _MoneroUtils["default"].binaryBlocksToJson(respBin);

              case 5:
                rpcBlocks = _context17.sent;

                MoneroDaemonRpc._checkResponseStatus(rpcBlocks); // build blocks with transactions


                _assert["default"].equal(rpcBlocks.txs.length, rpcBlocks.blocks.length);

                blocks = [];

                for (blockIdx = 0; blockIdx < rpcBlocks.blocks.length; blockIdx++) {
                  // build block
                  block = MoneroDaemonRpc._convertRpcBlock(rpcBlocks.blocks[blockIdx]);
                  block.setHeight(heights[blockIdx]);
                  blocks.push(block); // build transactions

                  txs = [];

                  for (txIdx = 0; txIdx < rpcBlocks.txs[blockIdx].length; txIdx++) {
                    tx = new _MoneroTx["default"]();
                    txs.push(tx);
                    tx.setHash(rpcBlocks.blocks[blockIdx].tx_hashes[txIdx]);
                    tx.setIsConfirmed(true);
                    tx.setInTxPool(false);
                    tx.setIsMinerTx(false);
                    tx.setRelay(true);
                    tx.setIsRelayed(true);
                    tx.setIsFailed(false);
                    tx.setIsDoubleSpend(false);

                    MoneroDaemonRpc._convertRpcTx(rpcBlocks.txs[blockIdx][txIdx], tx);
                  } // merge into one block


                  block.setTxs([]);

                  for (_i = 0, _txs = txs; _i < _txs.length; _i++) {
                    _tx = _txs[_i];
                    if (_tx.getBlock()) block.merge(_tx.getBlock());else block.getTxs().push(_tx.setBlock(block));
                  }
                }

                return _context17.abrupt("return", blocks);

              case 11:
              case "end":
                return _context17.stop();
            }
          }
        }, _callee17, this);
      }));

      function getBlocksByHeight(_x12) {
        return _getBlocksByHeight.apply(this, arguments);
      }

      return getBlocksByHeight;
    }()
  }, {
    key: "getBlocksByRange",
    value: function () {
      var _getBlocksByRange = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee18(startHeight, endHeight) {
        var heights, height;
        return _regenerator["default"].wrap(function _callee18$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                if (startHeight === undefined) startHeight = 0;

                if (!(endHeight === undefined)) {
                  _context18.next = 6;
                  break;
                }

                _context18.next = 4;
                return this.getHeight();

              case 4:
                _context18.t0 = _context18.sent;
                endHeight = _context18.t0 - 1;

              case 6:
                heights = [];

                for (height = startHeight; height <= endHeight; height++) {
                  heights.push(height);
                }

                _context18.next = 10;
                return this.getBlocksByHeight(heights);

              case 10:
                return _context18.abrupt("return", _context18.sent);

              case 11:
              case "end":
                return _context18.stop();
            }
          }
        }, _callee18, this);
      }));

      function getBlocksByRange(_x13, _x14) {
        return _getBlocksByRange.apply(this, arguments);
      }

      return getBlocksByRange;
    }()
  }, {
    key: "getBlocksByRangeChunked",
    value: function () {
      var _getBlocksByRangeChunked = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee19(startHeight, endHeight, maxChunkSize) {
        var lastHeight, blocks, _iterator3, _step3, block;

        return _regenerator["default"].wrap(function _callee19$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                if (startHeight === undefined) startHeight = 0;

                if (!(endHeight === undefined)) {
                  _context19.next = 6;
                  break;
                }

                _context19.next = 4;
                return this.getHeight();

              case 4:
                _context19.t0 = _context19.sent;
                endHeight = _context19.t0 - 1;

              case 6:
                lastHeight = startHeight - 1;
                blocks = [];

              case 8:
                if (!(lastHeight < endHeight)) {
                  _context19.next = 18;
                  break;
                }

                _context19.t1 = _createForOfIteratorHelper;
                _context19.next = 12;
                return this._getMaxBlocks(lastHeight + 1, endHeight, maxChunkSize);

              case 12:
                _context19.t2 = _context19.sent;
                _iterator3 = (0, _context19.t1)(_context19.t2);

                try {
                  for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                    block = _step3.value;
                    blocks.push(block);
                  }
                } catch (err) {
                  _iterator3.e(err);
                } finally {
                  _iterator3.f();
                }

                lastHeight = blocks[blocks.length - 1].getHeight();
                _context19.next = 8;
                break;

              case 18:
                return _context19.abrupt("return", blocks);

              case 19:
              case "end":
                return _context19.stop();
            }
          }
        }, _callee19, this);
      }));

      function getBlocksByRangeChunked(_x15, _x16, _x17) {
        return _getBlocksByRangeChunked.apply(this, arguments);
      }

      return getBlocksByRangeChunked;
    }()
  }, {
    key: "getTxs",
    value: function () {
      var _getTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee20(txHashes, prune) {
        var resp, txs, txIdx, tx, poolTxs, _i2, _txs2, _tx2, _iterator4, _step4, poolTx;

        return _regenerator["default"].wrap(function _callee20$(_context20) {
          while (1) {
            switch (_context20.prev = _context20.next) {
              case 0:
                // validate input
                (0, _assert["default"])(Array.isArray(txHashes) && txHashes.length > 0, "Must provide an array of transaction hashes");
                (0, _assert["default"])(prune === undefined || typeof prune === "boolean", "Prune must be a boolean or undefined"); // fetch transactions

                _context20.next = 4;
                return this.rpc.sendPathRequest("get_transactions", {
                  txs_hashes: txHashes,
                  decode_as_json: true,
                  prune: prune
                });

              case 4:
                resp = _context20.sent;
                _context20.prev = 5;

                MoneroDaemonRpc._checkResponseStatus(resp);

                _context20.next = 14;
                break;

              case 9:
                _context20.prev = 9;
                _context20.t0 = _context20["catch"](5);

                if (!(_context20.t0.message.indexOf("Failed to parse hex representation of transaction hash") >= 0)) {
                  _context20.next = 13;
                  break;
                }

                throw new _MoneroError["default"]("Invalid transaction hash");

              case 13:
                throw _context20.t0;

              case 14:
                // build transaction models
                txs = [];

                if (resp.txs) {
                  for (txIdx = 0; txIdx < resp.txs.length; txIdx++) {
                    tx = new _MoneroTx["default"]();
                    tx.setIsMinerTx(false);
                    txs.push(MoneroDaemonRpc._convertRpcTx(resp.txs[txIdx], tx));
                  }
                } // fetch unconfirmed txs from pool and merge additional fields  // TODO monerod: merge rpc calls so this isn't necessary?


                _context20.next = 18;
                return this.getTxPool();

              case 18:
                poolTxs = _context20.sent;

                for (_i2 = 0, _txs2 = txs; _i2 < _txs2.length; _i2++) {
                  _tx2 = _txs2[_i2];
                  _iterator4 = _createForOfIteratorHelper(poolTxs);

                  try {
                    for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                      poolTx = _step4.value;
                      if (_tx2.getHash() === poolTx.getHash()) _tx2.merge(poolTx);
                    }
                  } catch (err) {
                    _iterator4.e(err);
                  } finally {
                    _iterator4.f();
                  }
                }

                return _context20.abrupt("return", txs);

              case 21:
              case "end":
                return _context20.stop();
            }
          }
        }, _callee20, this, [[5, 9]]);
      }));

      function getTxs(_x18, _x19) {
        return _getTxs.apply(this, arguments);
      }

      return getTxs;
    }()
  }, {
    key: "getTxHexes",
    value: function () {
      var _getTxHexes = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee21(txHashes, prune) {
        var hexes, _iterator5, _step5, tx;

        return _regenerator["default"].wrap(function _callee21$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
                hexes = [];
                _context21.t0 = _createForOfIteratorHelper;
                _context21.next = 4;
                return this.getTxs(txHashes, prune);

              case 4:
                _context21.t1 = _context21.sent;
                _iterator5 = (0, _context21.t0)(_context21.t1);

                try {
                  for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                    tx = _step5.value;
                    hexes.push(prune ? tx.getPrunedHex() : tx.getFullHex());
                  }
                } catch (err) {
                  _iterator5.e(err);
                } finally {
                  _iterator5.f();
                }

                return _context21.abrupt("return", hexes);

              case 8:
              case "end":
                return _context21.stop();
            }
          }
        }, _callee21, this);
      }));

      function getTxHexes(_x20, _x21) {
        return _getTxHexes.apply(this, arguments);
      }

      return getTxHexes;
    }()
  }, {
    key: "getMinerTxSum",
    value: function () {
      var _getMinerTxSum = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee22(height, numBlocks) {
        var resp, txSum;
        return _regenerator["default"].wrap(function _callee22$(_context22) {
          while (1) {
            switch (_context22.prev = _context22.next) {
              case 0:
                if (height === undefined) height = 0;else (0, _assert["default"])(height >= 0, "Height must be an integer >= 0");

                if (!(numBlocks === undefined)) {
                  _context22.next = 7;
                  break;
                }

                _context22.next = 4;
                return this.getHeight();

              case 4:
                numBlocks = _context22.sent;
                _context22.next = 8;
                break;

              case 7:
                (0, _assert["default"])(numBlocks >= 0, "Count must be an integer >= 0");

              case 8:
                _context22.next = 10;
                return this.rpc.sendJsonRequest("get_coinbase_tx_sum", {
                  height: height,
                  count: numBlocks
                });

              case 10:
                resp = _context22.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

                txSum = new _MoneroMinerTxSum["default"]();
                txSum.setEmissionSum(BigInt(resp.result.emission_amount));
                txSum.setFeeSum(BigInt(resp.result.fee_amount));
                return _context22.abrupt("return", txSum);

              case 16:
              case "end":
                return _context22.stop();
            }
          }
        }, _callee22, this);
      }));

      function getMinerTxSum(_x22, _x23) {
        return _getMinerTxSum.apply(this, arguments);
      }

      return getMinerTxSum;
    }()
  }, {
    key: "getFeeEstimate",
    value: function () {
      var _getFeeEstimate = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee23(graceBlocks) {
        var resp;
        return _regenerator["default"].wrap(function _callee23$(_context23) {
          while (1) {
            switch (_context23.prev = _context23.next) {
              case 0:
                _context23.next = 2;
                return this.rpc.sendJsonRequest("get_fee_estimate", {
                  grace_blocks: graceBlocks
                });

              case 2:
                resp = _context23.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

                return _context23.abrupt("return", BigInt(resp.result.fee));

              case 5:
              case "end":
                return _context23.stop();
            }
          }
        }, _callee23, this);
      }));

      function getFeeEstimate(_x24) {
        return _getFeeEstimate.apply(this, arguments);
      }

      return getFeeEstimate;
    }()
  }, {
    key: "submitTxHex",
    value: function () {
      var _submitTxHex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee24(txHex, doNotRelay) {
        var resp, result;
        return _regenerator["default"].wrap(function _callee24$(_context24) {
          while (1) {
            switch (_context24.prev = _context24.next) {
              case 0:
                _context24.next = 2;
                return this.rpc.sendPathRequest("send_raw_transaction", {
                  tx_as_hex: txHex,
                  do_not_relay: doNotRelay
                });

              case 2:
                resp = _context24.sent;
                result = MoneroDaemonRpc._convertRpcSubmitTxResult(resp); // set isGood based on status

                try {
                  MoneroDaemonRpc._checkResponseStatus(resp);

                  result.setIsGood(true);
                } catch (e) {
                  result.setIsGood(false);
                }

                return _context24.abrupt("return", result);

              case 6:
              case "end":
                return _context24.stop();
            }
          }
        }, _callee24, this);
      }));

      function submitTxHex(_x25, _x26) {
        return _submitTxHex.apply(this, arguments);
      }

      return submitTxHex;
    }()
  }, {
    key: "relayTxsByHash",
    value: function () {
      var _relayTxsByHash = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee25(txHashes) {
        var resp;
        return _regenerator["default"].wrap(function _callee25$(_context25) {
          while (1) {
            switch (_context25.prev = _context25.next) {
              case 0:
                _context25.next = 2;
                return this.rpc.sendJsonRequest("relay_tx", {
                  txids: txHashes
                });

              case 2:
                resp = _context25.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

              case 4:
              case "end":
                return _context25.stop();
            }
          }
        }, _callee25, this);
      }));

      function relayTxsByHash(_x27) {
        return _relayTxsByHash.apply(this, arguments);
      }

      return relayTxsByHash;
    }()
  }, {
    key: "getTxPool",
    value: function () {
      var _getTxPool = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee26() {
        var resp, txs, _iterator6, _step6, rpcTx, tx;

        return _regenerator["default"].wrap(function _callee26$(_context26) {
          while (1) {
            switch (_context26.prev = _context26.next) {
              case 0:
                _context26.next = 2;
                return this.rpc.sendPathRequest("get_transaction_pool");

              case 2:
                resp = _context26.sent;

                MoneroDaemonRpc._checkResponseStatus(resp); // build txs


                txs = [];

                if (resp.transactions) {
                  _iterator6 = _createForOfIteratorHelper(resp.transactions);

                  try {
                    for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                      rpcTx = _step6.value;
                      tx = new _MoneroTx["default"]();
                      txs.push(tx);
                      tx.setIsConfirmed(false);
                      tx.setIsMinerTx(false);
                      tx.setInTxPool(true);
                      tx.setNumConfirmations(0);

                      MoneroDaemonRpc._convertRpcTx(rpcTx, tx);
                    }
                  } catch (err) {
                    _iterator6.e(err);
                  } finally {
                    _iterator6.f();
                  }
                }

                return _context26.abrupt("return", txs);

              case 7:
              case "end":
                return _context26.stop();
            }
          }
        }, _callee26, this);
      }));

      function getTxPool() {
        return _getTxPool.apply(this, arguments);
      }

      return getTxPool;
    }()
  }, {
    key: "getTxPoolHashes",
    value: function () {
      var _getTxPoolHashes = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee27() {
        return _regenerator["default"].wrap(function _callee27$(_context27) {
          while (1) {
            switch (_context27.prev = _context27.next) {
              case 0:
                throw new _MoneroError["default"]("Not implemented");

              case 1:
              case "end":
                return _context27.stop();
            }
          }
        }, _callee27);
      }));

      function getTxPoolHashes() {
        return _getTxPoolHashes.apply(this, arguments);
      }

      return getTxPoolHashes;
    }()
  }, {
    key: "getTxPoolBacklog",
    value: function () {
      var _getTxPoolBacklog = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee28() {
        return _regenerator["default"].wrap(function _callee28$(_context28) {
          while (1) {
            switch (_context28.prev = _context28.next) {
              case 0:
                throw new _MoneroError["default"]("Not implemented");

              case 1:
              case "end":
                return _context28.stop();
            }
          }
        }, _callee28);
      }));

      function getTxPoolBacklog() {
        return _getTxPoolBacklog.apply(this, arguments);
      }

      return getTxPoolBacklog;
    }()
  }, {
    key: "getTxPoolStats",
    value: function () {
      var _getTxPoolStats = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee29() {
        var resp, stats;
        return _regenerator["default"].wrap(function _callee29$(_context29) {
          while (1) {
            switch (_context29.prev = _context29.next) {
              case 0:
                throw new _MoneroError["default"]("Response contains field 'histo' which is binary'");

              case 3:
                resp = _context29.sent;

                MoneroDaemonRpc._checkResponseStatus(resp);

                stats = MoneroDaemonRpc._convertRpcTxPoolStats(resp.pool_stats); // uninitialize some stats if not applicable

                if (stats.getHisto98pc() === 0) stats.setHisto98pc(undefined);

                if (stats.getNumTxs() === 0) {
                  stats.setBytesMin(undefined);
                  stats.setBytesMed(undefined);
                  stats.setBytesMax(undefined);
                  stats.setHisto98pc(undefined);
                  stats.setOldestTimestamp(undefined);
                }

                return _context29.abrupt("return", stats);

              case 9:
              case "end":
                return _context29.stop();
            }
          }
        }, _callee29, this);
      }));

      function getTxPoolStats() {
        return _getTxPoolStats.apply(this, arguments);
      }

      return getTxPoolStats;
    }()
  }, {
    key: "flushTxPool",
    value: function () {
      var _flushTxPool = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee30(hashes) {
        var resp;
        return _regenerator["default"].wrap(function _callee30$(_context30) {
          while (1) {
            switch (_context30.prev = _context30.next) {
              case 0:
                if (hashes) hashes = _GenUtils["default"].listify(hashes);
                _context30.next = 3;
                return this.rpc.sendJsonRequest("flush_txpool", {
                  txids: hashes
                });

              case 3:
                resp = _context30.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

              case 5:
              case "end":
                return _context30.stop();
            }
          }
        }, _callee30, this);
      }));

      function flushTxPool(_x28) {
        return _flushTxPool.apply(this, arguments);
      }

      return flushTxPool;
    }()
  }, {
    key: "getKeyImageSpentStatuses",
    value: function () {
      var _getKeyImageSpentStatuses = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee31(keyImages) {
        var resp;
        return _regenerator["default"].wrap(function _callee31$(_context31) {
          while (1) {
            switch (_context31.prev = _context31.next) {
              case 0:
                if (!(keyImages === undefined || keyImages.length === 0)) {
                  _context31.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("Must provide key images to check the status of");

              case 2:
                _context31.next = 4;
                return this.rpc.sendPathRequest("is_key_image_spent", {
                  key_images: keyImages
                });

              case 4:
                resp = _context31.sent;

                MoneroDaemonRpc._checkResponseStatus(resp);

                return _context31.abrupt("return", resp.spent_status);

              case 7:
              case "end":
                return _context31.stop();
            }
          }
        }, _callee31, this);
      }));

      function getKeyImageSpentStatuses(_x29) {
        return _getKeyImageSpentStatuses.apply(this, arguments);
      }

      return getKeyImageSpentStatuses;
    }()
  }, {
    key: "getOutputHistogram",
    value: function () {
      var _getOutputHistogram = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee32(amounts, minCount, maxCount, isUnlocked, recentCutoff) {
        var resp, entries, _iterator7, _step7, rpcEntry;

        return _regenerator["default"].wrap(function _callee32$(_context32) {
          while (1) {
            switch (_context32.prev = _context32.next) {
              case 0:
                _context32.next = 2;
                return this.rpc.sendJsonRequest("get_output_histogram", {
                  amounts: amounts,
                  min_count: minCount,
                  max_count: maxCount,
                  unlocked: isUnlocked,
                  recent_cutoff: recentCutoff
                });

              case 2:
                resp = _context32.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result); // build histogram entries from response


                entries = [];

                if (resp.result.histogram) {
                  _context32.next = 7;
                  break;
                }

                return _context32.abrupt("return", entries);

              case 7:
                _iterator7 = _createForOfIteratorHelper(resp.result.histogram);

                try {
                  for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
                    rpcEntry = _step7.value;
                    entries.push(MoneroDaemonRpc._convertRpcOutputHistogramEntry(rpcEntry));
                  }
                } catch (err) {
                  _iterator7.e(err);
                } finally {
                  _iterator7.f();
                }

                return _context32.abrupt("return", entries);

              case 10:
              case "end":
                return _context32.stop();
            }
          }
        }, _callee32, this);
      }));

      function getOutputHistogram(_x30, _x31, _x32, _x33, _x34) {
        return _getOutputHistogram.apply(this, arguments);
      }

      return getOutputHistogram;
    }()
  }, {
    key: "getOutputDistribution",
    value: function () {
      var _getOutputDistribution = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee33(amounts, cumulative, startHeight, endHeight) {
        return _regenerator["default"].wrap(function _callee33$(_context33) {
          while (1) {
            switch (_context33.prev = _context33.next) {
              case 0:
                throw new _MoneroError["default"]("Not implemented (response 'distribution' field is binary)");

              case 1:
              case "end":
                return _context33.stop();
            }
          }
        }, _callee33);
      }));

      function getOutputDistribution(_x35, _x36, _x37, _x38) {
        return _getOutputDistribution.apply(this, arguments);
      }

      return getOutputDistribution;
    }()
  }, {
    key: "getInfo",
    value: function () {
      var _getInfo = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee34() {
        var resp;
        return _regenerator["default"].wrap(function _callee34$(_context34) {
          while (1) {
            switch (_context34.prev = _context34.next) {
              case 0:
                _context34.next = 2;
                return this.rpc.sendJsonRequest("get_info");

              case 2:
                resp = _context34.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

                return _context34.abrupt("return", MoneroDaemonRpc._convertRpcInfo(resp.result));

              case 5:
              case "end":
                return _context34.stop();
            }
          }
        }, _callee34, this);
      }));

      function getInfo() {
        return _getInfo.apply(this, arguments);
      }

      return getInfo;
    }()
  }, {
    key: "getSyncInfo",
    value: function () {
      var _getSyncInfo = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee35() {
        var resp;
        return _regenerator["default"].wrap(function _callee35$(_context35) {
          while (1) {
            switch (_context35.prev = _context35.next) {
              case 0:
                _context35.next = 2;
                return this.rpc.sendJsonRequest("sync_info");

              case 2:
                resp = _context35.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

                return _context35.abrupt("return", MoneroDaemonRpc._convertRpcSyncInfo(resp.result));

              case 5:
              case "end":
                return _context35.stop();
            }
          }
        }, _callee35, this);
      }));

      function getSyncInfo() {
        return _getSyncInfo.apply(this, arguments);
      }

      return getSyncInfo;
    }()
  }, {
    key: "getHardForkInfo",
    value: function () {
      var _getHardForkInfo = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee36() {
        var resp;
        return _regenerator["default"].wrap(function _callee36$(_context36) {
          while (1) {
            switch (_context36.prev = _context36.next) {
              case 0:
                _context36.next = 2;
                return this.rpc.sendJsonRequest("hard_fork_info");

              case 2:
                resp = _context36.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

                return _context36.abrupt("return", MoneroDaemonRpc._convertRpcHardForkInfo(resp.result));

              case 5:
              case "end":
                return _context36.stop();
            }
          }
        }, _callee36, this);
      }));

      function getHardForkInfo() {
        return _getHardForkInfo.apply(this, arguments);
      }

      return getHardForkInfo;
    }()
  }, {
    key: "getAltChains",
    value: function () {
      var _getAltChains = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee37() {
        var resp, chains, _iterator8, _step8, rpcChain;

        return _regenerator["default"].wrap(function _callee37$(_context37) {
          while (1) {
            switch (_context37.prev = _context37.next) {
              case 0:
                _context37.next = 2;
                return this.rpc.sendJsonRequest("get_alternate_chains");

              case 2:
                resp = _context37.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

                chains = [];

                if (resp.result.chains) {
                  _context37.next = 7;
                  break;
                }

                return _context37.abrupt("return", chains);

              case 7:
                _iterator8 = _createForOfIteratorHelper(resp.result.chains);

                try {
                  for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
                    rpcChain = _step8.value;
                    chains.push(MoneroDaemonRpc._convertRpcAltChain(rpcChain));
                  }
                } catch (err) {
                  _iterator8.e(err);
                } finally {
                  _iterator8.f();
                }

                return _context37.abrupt("return", chains);

              case 10:
              case "end":
                return _context37.stop();
            }
          }
        }, _callee37, this);
      }));

      function getAltChains() {
        return _getAltChains.apply(this, arguments);
      }

      return getAltChains;
    }()
  }, {
    key: "getAltBlockHashes",
    value: function () {
      var _getAltBlockHashes = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee38() {
        var resp;
        return _regenerator["default"].wrap(function _callee38$(_context38) {
          while (1) {
            switch (_context38.prev = _context38.next) {
              case 0:
                _context38.next = 2;
                return this.rpc.sendPathRequest("get_alt_blocks_hashes");

              case 2:
                resp = _context38.sent;

                MoneroDaemonRpc._checkResponseStatus(resp);

                if (resp.blks_hashes) {
                  _context38.next = 6;
                  break;
                }

                return _context38.abrupt("return", []);

              case 6:
                return _context38.abrupt("return", resp.blks_hashes);

              case 7:
              case "end":
                return _context38.stop();
            }
          }
        }, _callee38, this);
      }));

      function getAltBlockHashes() {
        return _getAltBlockHashes.apply(this, arguments);
      }

      return getAltBlockHashes;
    }()
  }, {
    key: "getDownloadLimit",
    value: function () {
      var _getDownloadLimit = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee39() {
        return _regenerator["default"].wrap(function _callee39$(_context39) {
          while (1) {
            switch (_context39.prev = _context39.next) {
              case 0:
                _context39.next = 2;
                return this._getBandwidthLimits();

              case 2:
                return _context39.abrupt("return", _context39.sent[0]);

              case 3:
              case "end":
                return _context39.stop();
            }
          }
        }, _callee39, this);
      }));

      function getDownloadLimit() {
        return _getDownloadLimit.apply(this, arguments);
      }

      return getDownloadLimit;
    }()
  }, {
    key: "setDownloadLimit",
    value: function () {
      var _setDownloadLimit = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee40(limit) {
        return _regenerator["default"].wrap(function _callee40$(_context40) {
          while (1) {
            switch (_context40.prev = _context40.next) {
              case 0:
                if (!(limit == -1)) {
                  _context40.next = 4;
                  break;
                }

                _context40.next = 3;
                return this.resetDownloadLimit();

              case 3:
                return _context40.abrupt("return", _context40.sent);

              case 4:
                if (_GenUtils["default"].isInt(limit) && limit > 0) {
                  _context40.next = 6;
                  break;
                }

                throw new _MoneroError["default"]("Download limit must be an integer greater than 0");

              case 6:
                _context40.next = 8;
                return this._setBandwidthLimits(limit, 0);

              case 8:
                return _context40.abrupt("return", _context40.sent[0]);

              case 9:
              case "end":
                return _context40.stop();
            }
          }
        }, _callee40, this);
      }));

      function setDownloadLimit(_x39) {
        return _setDownloadLimit.apply(this, arguments);
      }

      return setDownloadLimit;
    }()
  }, {
    key: "resetDownloadLimit",
    value: function () {
      var _resetDownloadLimit = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee41() {
        return _regenerator["default"].wrap(function _callee41$(_context41) {
          while (1) {
            switch (_context41.prev = _context41.next) {
              case 0:
                _context41.next = 2;
                return this._setBandwidthLimits(-1, 0);

              case 2:
                return _context41.abrupt("return", _context41.sent[0]);

              case 3:
              case "end":
                return _context41.stop();
            }
          }
        }, _callee41, this);
      }));

      function resetDownloadLimit() {
        return _resetDownloadLimit.apply(this, arguments);
      }

      return resetDownloadLimit;
    }()
  }, {
    key: "getUploadLimit",
    value: function () {
      var _getUploadLimit = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee42() {
        return _regenerator["default"].wrap(function _callee42$(_context42) {
          while (1) {
            switch (_context42.prev = _context42.next) {
              case 0:
                _context42.next = 2;
                return this._getBandwidthLimits();

              case 2:
                return _context42.abrupt("return", _context42.sent[1]);

              case 3:
              case "end":
                return _context42.stop();
            }
          }
        }, _callee42, this);
      }));

      function getUploadLimit() {
        return _getUploadLimit.apply(this, arguments);
      }

      return getUploadLimit;
    }()
  }, {
    key: "setUploadLimit",
    value: function () {
      var _setUploadLimit = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee43(limit) {
        return _regenerator["default"].wrap(function _callee43$(_context43) {
          while (1) {
            switch (_context43.prev = _context43.next) {
              case 0:
                if (!(limit == -1)) {
                  _context43.next = 4;
                  break;
                }

                _context43.next = 3;
                return this.resetUploadLimit();

              case 3:
                return _context43.abrupt("return", _context43.sent);

              case 4:
                if (_GenUtils["default"].isInt(limit) && limit > 0) {
                  _context43.next = 6;
                  break;
                }

                throw new _MoneroError["default"]("Upload limit must be an integer greater than 0");

              case 6:
                _context43.next = 8;
                return this._setBandwidthLimits(0, limit);

              case 8:
                return _context43.abrupt("return", _context43.sent[1]);

              case 9:
              case "end":
                return _context43.stop();
            }
          }
        }, _callee43, this);
      }));

      function setUploadLimit(_x40) {
        return _setUploadLimit.apply(this, arguments);
      }

      return setUploadLimit;
    }()
  }, {
    key: "resetUploadLimit",
    value: function () {
      var _resetUploadLimit = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee44() {
        return _regenerator["default"].wrap(function _callee44$(_context44) {
          while (1) {
            switch (_context44.prev = _context44.next) {
              case 0:
                _context44.next = 2;
                return this._setBandwidthLimits(0, -1);

              case 2:
                return _context44.abrupt("return", _context44.sent[1]);

              case 3:
              case "end":
                return _context44.stop();
            }
          }
        }, _callee44, this);
      }));

      function resetUploadLimit() {
        return _resetUploadLimit.apply(this, arguments);
      }

      return resetUploadLimit;
    }()
  }, {
    key: "getPeers",
    value: function () {
      var _getPeers = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee45() {
        var resp, peers, _iterator9, _step9, rpcConnection;

        return _regenerator["default"].wrap(function _callee45$(_context45) {
          while (1) {
            switch (_context45.prev = _context45.next) {
              case 0:
                _context45.next = 2;
                return this.rpc.sendJsonRequest("get_connections");

              case 2:
                resp = _context45.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

                peers = [];

                if (resp.result.connections) {
                  _context45.next = 7;
                  break;
                }

                return _context45.abrupt("return", peers);

              case 7:
                _iterator9 = _createForOfIteratorHelper(resp.result.connections);

                try {
                  for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
                    rpcConnection = _step9.value;
                    peers.push(MoneroDaemonRpc._convertRpcConnection(rpcConnection));
                  }
                } catch (err) {
                  _iterator9.e(err);
                } finally {
                  _iterator9.f();
                }

                return _context45.abrupt("return", peers);

              case 10:
              case "end":
                return _context45.stop();
            }
          }
        }, _callee45, this);
      }));

      function getPeers() {
        return _getPeers.apply(this, arguments);
      }

      return getPeers;
    }()
  }, {
    key: "getKnownPeers",
    value: function () {
      var _getKnownPeers = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee46() {
        var resp, peers, _iterator10, _step10, rpcPeer, peer, _iterator11, _step11, _rpcPeer, _peer;

        return _regenerator["default"].wrap(function _callee46$(_context46) {
          while (1) {
            switch (_context46.prev = _context46.next) {
              case 0:
                _context46.next = 2;
                return this.rpc.sendPathRequest("get_peer_list");

              case 2:
                resp = _context46.sent;

                MoneroDaemonRpc._checkResponseStatus(resp); // build peers


                peers = [];

                if (resp.gray_list) {
                  _iterator10 = _createForOfIteratorHelper(resp.gray_list);

                  try {
                    for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
                      rpcPeer = _step10.value;
                      peer = MoneroDaemonRpc._convertRpcPeer(rpcPeer);
                      peer.setIsOnline(false); // gray list means offline last checked

                      peers.push(peer);
                    }
                  } catch (err) {
                    _iterator10.e(err);
                  } finally {
                    _iterator10.f();
                  }
                }

                if (resp.white_list) {
                  _iterator11 = _createForOfIteratorHelper(resp.white_list);

                  try {
                    for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
                      _rpcPeer = _step11.value;
                      _peer = MoneroDaemonRpc._convertRpcPeer(_rpcPeer);

                      _peer.setIsOnline(true); // white list means online last checked


                      peers.push(_peer);
                    }
                  } catch (err) {
                    _iterator11.e(err);
                  } finally {
                    _iterator11.f();
                  }
                }

                return _context46.abrupt("return", peers);

              case 8:
              case "end":
                return _context46.stop();
            }
          }
        }, _callee46, this);
      }));

      function getKnownPeers() {
        return _getKnownPeers.apply(this, arguments);
      }

      return getKnownPeers;
    }()
  }, {
    key: "setOutgoingPeerLimit",
    value: function () {
      var _setOutgoingPeerLimit = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee47(limit) {
        var resp;
        return _regenerator["default"].wrap(function _callee47$(_context47) {
          while (1) {
            switch (_context47.prev = _context47.next) {
              case 0:
                if (_GenUtils["default"].isInt(limit) && limit >= 0) {
                  _context47.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("Outgoing peer limit must be >= 0");

              case 2:
                _context47.next = 4;
                return this.rpc.sendPathRequest("out_peers", {
                  out_peers: limit
                });

              case 4:
                resp = _context47.sent;

                MoneroDaemonRpc._checkResponseStatus(resp);

              case 6:
              case "end":
                return _context47.stop();
            }
          }
        }, _callee47, this);
      }));

      function setOutgoingPeerLimit(_x41) {
        return _setOutgoingPeerLimit.apply(this, arguments);
      }

      return setOutgoingPeerLimit;
    }()
  }, {
    key: "setIncomingPeerLimit",
    value: function () {
      var _setIncomingPeerLimit = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee48(limit) {
        var resp;
        return _regenerator["default"].wrap(function _callee48$(_context48) {
          while (1) {
            switch (_context48.prev = _context48.next) {
              case 0:
                if (_GenUtils["default"].isInt(limit) && limit >= 0) {
                  _context48.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("Incoming peer limit must be >= 0");

              case 2:
                _context48.next = 4;
                return this.rpc.sendPathRequest("in_peers", {
                  in_peers: limit
                });

              case 4:
                resp = _context48.sent;

                MoneroDaemonRpc._checkResponseStatus(resp);

              case 6:
              case "end":
                return _context48.stop();
            }
          }
        }, _callee48, this);
      }));

      function setIncomingPeerLimit(_x42) {
        return _setIncomingPeerLimit.apply(this, arguments);
      }

      return setIncomingPeerLimit;
    }()
  }, {
    key: "getPeerBans",
    value: function () {
      var _getPeerBans = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee49() {
        var resp, bans, _iterator12, _step12, rpcBan, ban;

        return _regenerator["default"].wrap(function _callee49$(_context49) {
          while (1) {
            switch (_context49.prev = _context49.next) {
              case 0:
                _context49.next = 2;
                return this.rpc.sendJsonRequest("get_bans");

              case 2:
                resp = _context49.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

                bans = [];
                _iterator12 = _createForOfIteratorHelper(resp.result.bans);

                try {
                  for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
                    rpcBan = _step12.value;
                    ban = new _MoneroBan["default"]();
                    ban.setHost(rpcBan.host);
                    ban.setIp(rpcBan.ip);
                    ban.setSeconds(rpcBan.seconds);
                    bans.push(ban);
                  }
                } catch (err) {
                  _iterator12.e(err);
                } finally {
                  _iterator12.f();
                }

                return _context49.abrupt("return", bans);

              case 8:
              case "end":
                return _context49.stop();
            }
          }
        }, _callee49, this);
      }));

      function getPeerBans() {
        return _getPeerBans.apply(this, arguments);
      }

      return getPeerBans;
    }()
  }, {
    key: "setPeerBans",
    value: function () {
      var _setPeerBans = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee50(bans) {
        var rpcBans, _iterator13, _step13, ban, resp;

        return _regenerator["default"].wrap(function _callee50$(_context50) {
          while (1) {
            switch (_context50.prev = _context50.next) {
              case 0:
                rpcBans = [];
                _iterator13 = _createForOfIteratorHelper(bans);

                try {
                  for (_iterator13.s(); !(_step13 = _iterator13.n()).done;) {
                    ban = _step13.value;
                    rpcBans.push(MoneroDaemonRpc._convertToRpcBan(ban));
                  }
                } catch (err) {
                  _iterator13.e(err);
                } finally {
                  _iterator13.f();
                }

                _context50.next = 5;
                return this.rpc.sendJsonRequest("set_bans", {
                  bans: rpcBans
                });

              case 5:
                resp = _context50.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

              case 7:
              case "end":
                return _context50.stop();
            }
          }
        }, _callee50, this);
      }));

      function setPeerBans(_x43) {
        return _setPeerBans.apply(this, arguments);
      }

      return setPeerBans;
    }()
  }, {
    key: "startMining",
    value: function () {
      var _startMining = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee51(address, numThreads, isBackground, ignoreBattery) {
        var resp;
        return _regenerator["default"].wrap(function _callee51$(_context51) {
          while (1) {
            switch (_context51.prev = _context51.next) {
              case 0:
                (0, _assert["default"])(address, "Must provide address to mine to");
                (0, _assert["default"])(_GenUtils["default"].isInt(numThreads) && numThreads > 0, "Number of threads must be an integer greater than 0");
                (0, _assert["default"])(isBackground === undefined || typeof isBackground === "boolean");
                (0, _assert["default"])(ignoreBattery === undefined || typeof ignoreBattery === "boolean");
                _context51.next = 6;
                return this.rpc.sendPathRequest("start_mining", {
                  miner_address: address,
                  threads_count: numThreads,
                  do_background_mining: isBackground,
                  ignore_battery: ignoreBattery
                });

              case 6:
                resp = _context51.sent;

                MoneroDaemonRpc._checkResponseStatus(resp);

              case 8:
              case "end":
                return _context51.stop();
            }
          }
        }, _callee51, this);
      }));

      function startMining(_x44, _x45, _x46, _x47) {
        return _startMining.apply(this, arguments);
      }

      return startMining;
    }()
  }, {
    key: "stopMining",
    value: function () {
      var _stopMining = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee52() {
        var resp;
        return _regenerator["default"].wrap(function _callee52$(_context52) {
          while (1) {
            switch (_context52.prev = _context52.next) {
              case 0:
                _context52.next = 2;
                return this.rpc.sendPathRequest("stop_mining");

              case 2:
                resp = _context52.sent;

                MoneroDaemonRpc._checkResponseStatus(resp);

              case 4:
              case "end":
                return _context52.stop();
            }
          }
        }, _callee52, this);
      }));

      function stopMining() {
        return _stopMining.apply(this, arguments);
      }

      return stopMining;
    }()
  }, {
    key: "getMiningStatus",
    value: function () {
      var _getMiningStatus = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee53() {
        var resp;
        return _regenerator["default"].wrap(function _callee53$(_context53) {
          while (1) {
            switch (_context53.prev = _context53.next) {
              case 0:
                _context53.next = 2;
                return this.rpc.sendPathRequest("mining_status");

              case 2:
                resp = _context53.sent;

                MoneroDaemonRpc._checkResponseStatus(resp);

                return _context53.abrupt("return", MoneroDaemonRpc._convertRpcMiningStatus(resp));

              case 5:
              case "end":
                return _context53.stop();
            }
          }
        }, _callee53, this);
      }));

      function getMiningStatus() {
        return _getMiningStatus.apply(this, arguments);
      }

      return getMiningStatus;
    }()
  }, {
    key: "submitBlocks",
    value: function () {
      var _submitBlocks = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee54(blockBlobs) {
        var resp;
        return _regenerator["default"].wrap(function _callee54$(_context54) {
          while (1) {
            switch (_context54.prev = _context54.next) {
              case 0:
                (0, _assert["default"])(Array.isArray(blockBlobs) && blockBlobs.length > 0, "Must provide an array of mined block blobs to submit");
                _context54.next = 3;
                return this.rpc.sendJsonRequest("submit_block", blockBlobs);

              case 3:
                resp = _context54.sent;

                MoneroDaemonRpc._checkResponseStatus(resp.result);

              case 5:
              case "end":
                return _context54.stop();
            }
          }
        }, _callee54, this);
      }));

      function submitBlocks(_x48) {
        return _submitBlocks.apply(this, arguments);
      }

      return submitBlocks;
    }()
  }, {
    key: "checkForUpdate",
    value: function () {
      var _checkForUpdate = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee55() {
        var resp;
        return _regenerator["default"].wrap(function _callee55$(_context55) {
          while (1) {
            switch (_context55.prev = _context55.next) {
              case 0:
                _context55.next = 2;
                return this.rpc.sendPathRequest("update", {
                  command: "check"
                });

              case 2:
                resp = _context55.sent;

                MoneroDaemonRpc._checkResponseStatus(resp);

                return _context55.abrupt("return", MoneroDaemonRpc._convertRpcUpdateCheckResult(resp));

              case 5:
              case "end":
                return _context55.stop();
            }
          }
        }, _callee55, this);
      }));

      function checkForUpdate() {
        return _checkForUpdate.apply(this, arguments);
      }

      return checkForUpdate;
    }()
  }, {
    key: "downloadUpdate",
    value: function () {
      var _downloadUpdate = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee56(path) {
        var resp;
        return _regenerator["default"].wrap(function _callee56$(_context56) {
          while (1) {
            switch (_context56.prev = _context56.next) {
              case 0:
                _context56.next = 2;
                return this.rpc.sendPathRequest("update", {
                  command: "download",
                  path: path
                });

              case 2:
                resp = _context56.sent;

                MoneroDaemonRpc._checkResponseStatus(resp);

                return _context56.abrupt("return", MoneroDaemonRpc._convertRpcUpdateDownloadResult(resp));

              case 5:
              case "end":
                return _context56.stop();
            }
          }
        }, _callee56, this);
      }));

      function downloadUpdate(_x49) {
        return _downloadUpdate.apply(this, arguments);
      }

      return downloadUpdate;
    }()
  }, {
    key: "stop",
    value: function () {
      var _stop = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee57() {
        var resp;
        return _regenerator["default"].wrap(function _callee57$(_context57) {
          while (1) {
            switch (_context57.prev = _context57.next) {
              case 0:
                _context57.next = 2;
                return this.rpc.sendPathRequest("stop_daemon");

              case 2:
                resp = _context57.sent;

                MoneroDaemonRpc._checkResponseStatus(resp);

              case 4:
              case "end":
                return _context57.stop();
            }
          }
        }, _callee57, this);
      }));

      function stop() {
        return _stop.apply(this, arguments);
      }

      return stop;
    }()
  }, {
    key: "waitForNextBlockHeader",
    value: function () {
      var _waitForNextBlockHeader = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee60() {
        var that;
        return _regenerator["default"].wrap(function _callee60$(_context60) {
          while (1) {
            switch (_context60.prev = _context60.next) {
              case 0:
                that = this;
                return _context60.abrupt("return", new Promise( /*#__PURE__*/function () {
                  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee59(resolve) {
                    return _regenerator["default"].wrap(function _callee59$(_context59) {
                      while (1) {
                        switch (_context59.prev = _context59.next) {
                          case 0:
                            _context59.next = 2;
                            return that.addListener(new ( /*#__PURE__*/function (_MoneroDaemonListener) {
                              (0, _inherits2["default"])(_class, _MoneroDaemonListener);

                              var _super2 = _createSuper(_class);

                              function _class() {
                                (0, _classCallCheck2["default"])(this, _class);
                                return _super2.apply(this, arguments);
                              }

                              (0, _createClass2["default"])(_class, [{
                                key: "onBlockHeader",
                                value: function () {
                                  var _onBlockHeader = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee58(header) {
                                    return _regenerator["default"].wrap(function _callee58$(_context58) {
                                      while (1) {
                                        switch (_context58.prev = _context58.next) {
                                          case 0:
                                            _context58.next = 2;
                                            return that.removeListener(this);

                                          case 2:
                                            resolve(header);

                                          case 3:
                                          case "end":
                                            return _context58.stop();
                                        }
                                      }
                                    }, _callee58, this);
                                  }));

                                  function onBlockHeader(_x51) {
                                    return _onBlockHeader.apply(this, arguments);
                                  }

                                  return onBlockHeader;
                                }()
                              }]);
                              return _class;
                            }(_MoneroDaemonListener2["default"]))());

                          case 2:
                          case "end":
                            return _context59.stop();
                        }
                      }
                    }, _callee59);
                  }));

                  return function (_x50) {
                    return _ref.apply(this, arguments);
                  };
                }()));

              case 2:
              case "end":
                return _context60.stop();
            }
          }
        }, _callee60, this);
      }));

      function waitForNextBlockHeader() {
        return _waitForNextBlockHeader.apply(this, arguments);
      }

      return waitForNextBlockHeader;
    }() // ----------- ADD JSDOC FOR SUPPORTED DEFAULT IMPLEMENTATIONS --------------

  }, {
    key: "getTx",
    value: function () {
      var _getTx = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee61() {
        var _args61 = arguments;
        return _regenerator["default"].wrap(function _callee61$(_context61) {
          while (1) {
            switch (_context61.prev = _context61.next) {
              case 0:
                return _context61.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroDaemonRpc.prototype), "getTx", this).apply(this, _args61));

              case 1:
              case "end":
                return _context61.stop();
            }
          }
        }, _callee61, this);
      }));

      function getTx() {
        return _getTx.apply(this, arguments);
      }

      return getTx;
    }()
  }, {
    key: "getTxHex",
    value: function () {
      var _getTxHex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee62() {
        var _args62 = arguments;
        return _regenerator["default"].wrap(function _callee62$(_context62) {
          while (1) {
            switch (_context62.prev = _context62.next) {
              case 0:
                return _context62.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroDaemonRpc.prototype), "getTxHex", this).apply(this, _args62));

              case 1:
              case "end":
                return _context62.stop();
            }
          }
        }, _callee62, this);
      }));

      function getTxHex() {
        return _getTxHex.apply(this, arguments);
      }

      return getTxHex;
    }()
  }, {
    key: "getKeyImageSpentStatus",
    value: function () {
      var _getKeyImageSpentStatus = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee63() {
        var _args63 = arguments;
        return _regenerator["default"].wrap(function _callee63$(_context63) {
          while (1) {
            switch (_context63.prev = _context63.next) {
              case 0:
                return _context63.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroDaemonRpc.prototype), "getKeyImageSpentStatus", this).apply(this, _args63));

              case 1:
              case "end":
                return _context63.stop();
            }
          }
        }, _callee63, this);
      }));

      function getKeyImageSpentStatus() {
        return _getKeyImageSpentStatus.apply(this, arguments);
      }

      return getKeyImageSpentStatus;
    }()
  }, {
    key: "setPeerBan",
    value: function () {
      var _setPeerBan = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee64() {
        var _args64 = arguments;
        return _regenerator["default"].wrap(function _callee64$(_context64) {
          while (1) {
            switch (_context64.prev = _context64.next) {
              case 0:
                return _context64.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroDaemonRpc.prototype), "setPeerBan", this).apply(this, _args64));

              case 1:
              case "end":
                return _context64.stop();
            }
          }
        }, _callee64, this);
      }));

      function setPeerBan() {
        return _setPeerBan.apply(this, arguments);
      }

      return setPeerBan;
    }()
  }, {
    key: "submitBlock",
    value: function () {
      var _submitBlock = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee65() {
        var _args65 = arguments;
        return _regenerator["default"].wrap(function _callee65$(_context65) {
          while (1) {
            switch (_context65.prev = _context65.next) {
              case 0:
                return _context65.abrupt("return", (0, _get2["default"])((0, _getPrototypeOf2["default"])(MoneroDaemonRpc.prototype), "submitBlock", this).apply(this, _args65));

              case 1:
              case "end":
                return _context65.stop();
            }
          }
        }, _callee65, this);
      }));

      function submitBlock() {
        return _submitBlock.apply(this, arguments);
      }

      return submitBlock;
    }() // ------------------------------- PRIVATE ----------------------------------

  }, {
    key: "_refreshListening",
    value: function _refreshListening() {
      if (this.pollListener == undefined && this.listeners.length) this.pollListener = new DaemonPoller(this);
      if (this.pollListener !== undefined) this.pollListener.setIsPolling(this.listeners.length > 0);
    }
  }, {
    key: "_getBandwidthLimits",
    value: function () {
      var _getBandwidthLimits2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee66() {
        var resp;
        return _regenerator["default"].wrap(function _callee66$(_context66) {
          while (1) {
            switch (_context66.prev = _context66.next) {
              case 0:
                _context66.next = 2;
                return this.rpc.sendPathRequest("get_limit");

              case 2:
                resp = _context66.sent;

                MoneroDaemonRpc._checkResponseStatus(resp);

                return _context66.abrupt("return", [resp.limit_down, resp.limit_up]);

              case 5:
              case "end":
                return _context66.stop();
            }
          }
        }, _callee66, this);
      }));

      function _getBandwidthLimits() {
        return _getBandwidthLimits2.apply(this, arguments);
      }

      return _getBandwidthLimits;
    }()
  }, {
    key: "_setBandwidthLimits",
    value: function () {
      var _setBandwidthLimits2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee67(downLimit, upLimit) {
        var resp;
        return _regenerator["default"].wrap(function _callee67$(_context67) {
          while (1) {
            switch (_context67.prev = _context67.next) {
              case 0:
                if (downLimit === undefined) downLimit = 0;
                if (upLimit === undefined) upLimit = 0;
                _context67.next = 4;
                return this.rpc.sendPathRequest("set_limit", {
                  limit_down: downLimit,
                  limit_up: upLimit
                });

              case 4:
                resp = _context67.sent;

                MoneroDaemonRpc._checkResponseStatus(resp);

                return _context67.abrupt("return", [resp.limit_down, resp.limit_up]);

              case 7:
              case "end":
                return _context67.stop();
            }
          }
        }, _callee67, this);
      }));

      function _setBandwidthLimits(_x52, _x53) {
        return _setBandwidthLimits2.apply(this, arguments);
      }

      return _setBandwidthLimits;
    }()
    /**
     * Get a contiguous chunk of blocks starting from a given height up to a maximum
     * height or amount of block data fetched from the blockchain, whichever comes first.
     * 
     * @param {number} [startHeight] - start height to retrieve blocks (default 0)
     * @param {number} [maxHeight] - maximum end height to retrieve blocks (default blockchain height)
     * @param {number} [maxReqSize] - maximum amount of block data to fetch from the blockchain in bytes (default 3,000,000 bytes)
     * @return {MoneroBlock[]} are the resulting chunk of blocks
     */

  }, {
    key: "_getMaxBlocks",
    value: function () {
      var _getMaxBlocks2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee68(startHeight, maxHeight, maxReqSize) {
        var reqSize, endHeight, header;
        return _regenerator["default"].wrap(function _callee68$(_context68) {
          while (1) {
            switch (_context68.prev = _context68.next) {
              case 0:
                if (startHeight === undefined) startHeight = 0;

                if (!(maxHeight === undefined)) {
                  _context68.next = 6;
                  break;
                }

                _context68.next = 4;
                return this.getHeight();

              case 4:
                _context68.t0 = _context68.sent;
                maxHeight = _context68.t0 - 1;

              case 6:
                if (maxReqSize === undefined) maxReqSize = MoneroDaemonRpc.MAX_REQ_SIZE; // determine end height to fetch

                reqSize = 0;
                endHeight = startHeight - 1;

              case 9:
                if (!(reqSize < maxReqSize && endHeight < maxHeight)) {
                  _context68.next = 20;
                  break;
                }

                _context68.next = 12;
                return this._getBlockHeaderByHeightCached(endHeight + 1, maxHeight);

              case 12:
                header = _context68.sent;
                // block cannot be bigger than max request size
                (0, _assert["default"])(header.getSize() <= maxReqSize, "Block exceeds maximum request size: " + header.getSize()); // done iterating if fetching block would exceed max request size

                if (!(reqSize + header.getSize() > maxReqSize)) {
                  _context68.next = 16;
                  break;
                }

                return _context68.abrupt("break", 20);

              case 16:
                // otherwise block is included
                reqSize += header.getSize();
                endHeight++;
                _context68.next = 9;
                break;

              case 20:
                if (!(endHeight >= startHeight)) {
                  _context68.next = 26;
                  break;
                }

                _context68.next = 23;
                return this.getBlocksByRange(startHeight, endHeight);

              case 23:
                _context68.t1 = _context68.sent;
                _context68.next = 27;
                break;

              case 26:
                _context68.t1 = [];

              case 27:
                return _context68.abrupt("return", _context68.t1);

              case 28:
              case "end":
                return _context68.stop();
            }
          }
        }, _callee68, this);
      }));

      function _getMaxBlocks(_x54, _x55, _x56) {
        return _getMaxBlocks2.apply(this, arguments);
      }

      return _getMaxBlocks;
    }()
    /**
     * Retrieves a header by height from the cache or fetches and caches a header
     * range if not already in the cache.
     * 
     * @param {number} height - height of the header to retrieve from the cache
     * @param {number} maxHeight - maximum height of headers to cache
     */

  }, {
    key: "_getBlockHeaderByHeightCached",
    value: function () {
      var _getBlockHeaderByHeightCached2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee69(height, maxHeight) {
        var cachedHeader, endHeight, headers, _iterator14, _step14, header;

        return _regenerator["default"].wrap(function _callee69$(_context69) {
          while (1) {
            switch (_context69.prev = _context69.next) {
              case 0:
                // get header from cache
                cachedHeader = this.cachedHeaders[height];

                if (!cachedHeader) {
                  _context69.next = 3;
                  break;
                }

                return _context69.abrupt("return", cachedHeader);

              case 3:
                // fetch and cache headers if not in cache
                endHeight = Math.min(maxHeight, height + MoneroDaemonRpc.NUM_HEADERS_PER_REQ - 1); // TODO: could specify end height to cache to optimize small requests (would like to have time profiling in place though)

                _context69.next = 6;
                return this.getBlockHeadersByRange(height, endHeight);

              case 6:
                headers = _context69.sent;
                _iterator14 = _createForOfIteratorHelper(headers);

                try {
                  for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {
                    header = _step14.value;
                    this.cachedHeaders[header.getHeight()] = header;
                  } // return the cached header

                } catch (err) {
                  _iterator14.e(err);
                } finally {
                  _iterator14.f();
                }

                return _context69.abrupt("return", this.cachedHeaders[height]);

              case 10:
              case "end":
                return _context69.stop();
            }
          }
        }, _callee69, this);
      }));

      function _getBlockHeaderByHeightCached(_x57, _x58) {
        return _getBlockHeaderByHeightCached2.apply(this, arguments);
      }

      return _getBlockHeaderByHeightCached;
    }() // --------------------------------- STATIC ---------------------------------

  }], [{
    key: "_connectToDaemonRpc",
    value: function () {
      var _connectToDaemonRpc2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee70(uriOrConfig, username, password, rejectUnauthorized, pollInterval, proxyToWorker) {
        var config;
        return _regenerator["default"].wrap(function _callee70$(_context70) {
          while (1) {
            switch (_context70.prev = _context70.next) {
              case 0:
                console.log("Running _connectTODaemonRpc");
                _context70.prev = 1;

                if (!_GenUtils["default"].isArray(uriOrConfig)) {
                  _context70.next = 5;
                  break;
                }

                console.log("StartingMonerodProcess");
                return _context70.abrupt("return", MoneroDaemonRpc._startMonerodProcess(uriOrConfig, rejectUnauthorized, pollInterval, proxyToWorker));

              case 5:
                console.log("Creating new config");
                config = MoneroDaemonRpc._normalizeConfig(uriOrConfig, username, password, rejectUnauthorized, pollInterval, proxyToWorker);
                console.log("Config created");

                if (!config.proxyToWorker) {
                  _context70.next = 13;
                  break;
                }

                console.log("using MoneroDaemonRpcProxy.connect");
                return _context70.abrupt("return", MoneroDaemonRpcProxy.connect(config));

              case 13:
                console.log("Returning new MoneroDaemonRpc");
                return _context70.abrupt("return", new MoneroDaemonRpc(config));

              case 15:
                _context70.next = 20;
                break;

              case 17:
                _context70.prev = 17;
                _context70.t0 = _context70["catch"](1);
                console.log("_connectToDaemonRpc failed: " + _context70.t0);

              case 20:
              case "end":
                return _context70.stop();
            }
          }
        }, _callee70, null, [[1, 17]]);
      }));

      function _connectToDaemonRpc(_x59, _x60, _x61, _x62, _x63, _x64) {
        return _connectToDaemonRpc2.apply(this, arguments);
      }

      return _connectToDaemonRpc;
    }()
  }, {
    key: "_startMonerodProcess",
    value: function () {
      var _startMonerodProcess2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee72(cmd, rejectUnauthorized, pollInterval, proxyToWorker) {
        var uri, that, output;
        return _regenerator["default"].wrap(function _callee72$(_context72) {
          while (1) {
            switch (_context72.prev = _context72.next) {
              case 0:
                (0, _assert["default"])(_GenUtils["default"].isArray(cmd), "Must provide string array with command line parameters"); // start process

                this.process = require('child_process').spawn(cmd[0], cmd.slice(1), {});
                this.process.stdout.setEncoding('utf8');
                this.process.stderr.setEncoding('utf8'); // return promise which resolves after starting monerod

                that = this;
                output = "";
                return _context72.abrupt("return", new Promise(function (resolve, reject) {
                  // handle stdout
                  that.process.stdout.on('data', /*#__PURE__*/function () {
                    var _ref2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee71(data) {
                      var line, uriLineContains, uriLineContainsIdx, host, unformattedLine, port, sslIdx, sslEnabled, userPassIdx, userPass, username, password, daemon;
                      return _regenerator["default"].wrap(function _callee71$(_context71) {
                        while (1) {
                          switch (_context71.prev = _context71.next) {
                            case 0:
                              line = data.toString();

                              _LibraryUtils["default"].log(2, line);

                              output += line + '\n'; // capture output in case of error
                              // extract uri from e.g. "I Binding on 127.0.0.1 (IPv4):38085"

                              uriLineContains = "Binding on ";
                              uriLineContainsIdx = line.indexOf(uriLineContains);

                              if (uriLineContainsIdx >= 0) {
                                host = line.substring(uriLineContainsIdx + uriLineContains.length, line.lastIndexOf(' '));
                                unformattedLine = line.replace(/\u001b\[.*?m/g, '').trim(); // remove color formatting

                                port = unformattedLine.substring(unformattedLine.lastIndexOf(':') + 1);
                                sslIdx = cmd.indexOf("--rpc-ssl");
                                sslEnabled = sslIdx >= 0 ? "enabled" == cmd[sslIdx + 1].toLowerCase() : false;
                                uri = (sslEnabled ? "https" : "http") + "://" + host + ":" + port;
                              } // read success message


                              if (!(line.indexOf("core RPC server started ok") >= 0)) {
                                _context71.next = 17;
                                break;
                              }

                              // get username and password from params
                              userPassIdx = cmd.indexOf("--rpc-login");
                              userPass = userPassIdx >= 0 ? cmd[userPassIdx + 1] : undefined;
                              username = userPass === undefined ? undefined : userPass.substring(0, userPass.indexOf(':'));
                              password = userPass === undefined ? undefined : userPass.substring(userPass.indexOf(':') + 1); // create client connected to internal process

                              _context71.next = 13;
                              return that._connectToDaemonRpc(uri, username, password, rejectUnauthorized, pollInterval, proxyToWorker);

                            case 13:
                              daemon = _context71.sent;
                              daemon.process = that.process; // resolve promise with client connected to internal process 

                              this.isResolved = true;
                              resolve(daemon);

                            case 17:
                            case "end":
                              return _context71.stop();
                          }
                        }
                      }, _callee71, this);
                    }));

                    return function (_x69) {
                      return _ref2.apply(this, arguments);
                    };
                  }()); // handle stderr

                  that.process.stderr.on('data', function (data) {
                    if (_LibraryUtils["default"].getLogLevel() >= 2) console.error(data);
                  }); // handle exit

                  that.process.on("exit", function (code) {
                    if (!this.isResolved) reject(new Error("monerod process terminated with exit code " + code + (output ? ":\n\n" + output : "")));
                  }); // handle error

                  that.process.on("error", function (err) {
                    if (err.message.indexOf("ENOENT") >= 0) reject(new Error("monerod does not exist at path '" + cmd[0] + "'"));
                    if (!this.isResolved) reject(err);
                  }); // handle uncaught exception

                  that.process.on("uncaughtException", function (err, origin) {
                    console.error("Uncaught exception in monerod process: " + err.message);
                    console.error(origin);
                    reject(err);
                  });
                }));

              case 7:
              case "end":
                return _context72.stop();
            }
          }
        }, _callee72, this);
      }));

      function _startMonerodProcess(_x65, _x66, _x67, _x68) {
        return _startMonerodProcess2.apply(this, arguments);
      }

      return _startMonerodProcess;
    }()
  }, {
    key: "_normalizeConfig",
    value: function _normalizeConfig(uriOrConfigOrConnection, username, password, rejectUnauthorized, pollInterval, proxyToWorker) {
      var config;
      if (typeof uriOrConfigOrConnection === "string") config = {
        uri: uriOrConfigOrConnection,
        username: username,
        password: password,
        proxyToWorker: proxyToWorker,
        rejectUnauthorized: rejectUnauthorized,
        pollInterval: pollInterval
      };else {
        if ((0, _typeof2["default"])(uriOrConfigOrConnection) !== "object") throw new _MoneroError["default"]("Invalid configuration to create rpc client; must be string, object, or MoneroRpcConnection");
        if (username || password || rejectUnauthorized || pollInterval || proxyToWorker) throw new _MoneroError["default"]("Can provide config object or params or new MoneroDaemonRpc(...) but not both");
        if (uriOrConfigOrConnection instanceof _MoneroRpcConnection["default"]) config = Object.assign({}, uriOrConfigOrConnection.getConfig());else config = Object.assign({}, uriOrConfigOrConnection);
      }

      if (config.server) {
        config = Object.assign(config, new _MoneroRpcConnection["default"](config.server).getConfig());
        delete config.server;
      }

      if (config.pollInterval === undefined) config.pollInterval = 5000; // TODO: move to config

      if (config.proxyToWorker === undefined) config.proxyToWorker = true;
      return config;
    }
  }, {
    key: "_checkResponseStatus",
    value: function _checkResponseStatus(resp) {
      if (resp.status !== "OK") throw new _MoneroError["default"](resp.status);
    }
  }, {
    key: "_convertRpcBlockHeader",
    value: function _convertRpcBlockHeader(rpcHeader) {
      if (!rpcHeader) return undefined;
      var header = new _MoneroBlockHeader["default"]();

      for (var _i3 = 0, _Object$keys = Object.keys(rpcHeader); _i3 < _Object$keys.length; _i3++) {
        var key = _Object$keys[_i3];
        var val = rpcHeader[key];
        if (key === "block_size") _GenUtils["default"].safeSet(header, header.getSize, header.setSize, val);else if (key === "depth") _GenUtils["default"].safeSet(header, header.getDepth, header.setDepth, val);else if (key === "difficulty") {} // handled by wide_difficulty
        else if (key === "cumulative_difficulty") {} // handled by wide_cumulative_difficulty
        else if (key === "difficulty_top64") {} // handled by wide_difficulty
        else if (key === "cumulative_difficulty_top64") {} // handled by wide_cumulative_difficulty
        else if (key === "wide_difficulty") header.setDifficulty(_GenUtils["default"].reconcile(header.getDifficulty(), MoneroDaemonRpc._prefixedHexToBI(val)));else if (key === "wide_cumulative_difficulty") header.setCumulativeDifficulty(_GenUtils["default"].reconcile(header.getCumulativeDifficulty(), MoneroDaemonRpc._prefixedHexToBI(val)));else if (key === "hash") _GenUtils["default"].safeSet(header, header.getHash, header.setHash, val);else if (key === "height") _GenUtils["default"].safeSet(header, header.getHeight, header.setHeight, val);else if (key === "major_version") _GenUtils["default"].safeSet(header, header.getMajorVersion, header.setMajorVersion, val);else if (key === "minor_version") _GenUtils["default"].safeSet(header, header.getMinorVersion, header.setMinorVersion, val);else if (key === "nonce") _GenUtils["default"].safeSet(header, header.getNonce, header.setNonce, val);else if (key === "num_txes") _GenUtils["default"].safeSet(header, header.getNumTxs, header.setNumTxs, val);else if (key === "orphan_status") _GenUtils["default"].safeSet(header, header.getOrphanStatus, header.setOrphanStatus, val);else if (key === "prev_hash" || key === "prev_id") _GenUtils["default"].safeSet(header, header.getPrevHash, header.setPrevHash, val);else if (key === "reward") _GenUtils["default"].safeSet(header, header.getReward, header.setReward, BigInt(val));else if (key === "timestamp") _GenUtils["default"].safeSet(header, header.getTimestamp, header.setTimestamp, val);else if (key === "block_weight") _GenUtils["default"].safeSet(header, header.getWeight, header.setWeight, val);else if (key === "long_term_weight") _GenUtils["default"].safeSet(header, header.getLongTermWeight, header.setLongTermWeight, val);else if (key === "pow_hash") _GenUtils["default"].safeSet(header, header.getPowHash, header.setPowHash, val === "" ? undefined : val);else if (key === "tx_hashes") {} // used in block model, not header model
        else if (key === "miner_tx") {} // used in block model, not header model
        else if (key === "miner_tx_hash") header.setMinerTxHash(val);else console.log("WARNING: ignoring unexpected block header field: '" + key + "': " + val);
      }

      return header;
    }
  }, {
    key: "_convertRpcBlock",
    value: function _convertRpcBlock(rpcBlock) {
      // build block
      var block = new _MoneroBlock["default"](MoneroDaemonRpc._convertRpcBlockHeader(rpcBlock.block_header ? rpcBlock.block_header : rpcBlock));
      block.setHex(rpcBlock.blob);
      block.setTxHashes(rpcBlock.tx_hashes === undefined ? [] : rpcBlock.tx_hashes); // build miner tx

      var rpcMinerTx = rpcBlock.json ? JSON.parse(rpcBlock.json).miner_tx : rpcBlock.miner_tx; // may need to be parsed from json

      var minerTx = new _MoneroTx["default"]();
      block.setMinerTx(minerTx);
      minerTx.setIsConfirmed(true);
      minerTx.setIsMinerTx(true);

      MoneroDaemonRpc._convertRpcTx(rpcMinerTx, minerTx);

      return block;
    }
    /**
     * Transfers RPC tx fields to a given MoneroTx without overwriting previous values.
     * 
     * TODO: switch from safe set
     * 
     * @param rpcTx - RPC map containing transaction fields
     * @param tx  - MoneroTx to populate with values (optional)
     * @returns tx - same tx that was passed in or a new one if none given
     */

  }, {
    key: "_convertRpcTx",
    value: function _convertRpcTx(rpcTx, tx) {
      if (rpcTx === undefined) return undefined;
      if (tx === undefined) tx = new _MoneroTx["default"](); //    console.log("******** BUILDING TX ***********");
      //    console.log(rpcTx);
      //    console.log(tx.toString());
      // initialize from rpc map

      var header;

      for (var _i4 = 0, _Object$keys2 = Object.keys(rpcTx); _i4 < _Object$keys2.length; _i4++) {
        var key = _Object$keys2[_i4];
        var val = rpcTx[key];
        if (key === "tx_hash" || key === "id_hash") _GenUtils["default"].safeSet(tx, tx.getHash, tx.setHash, val);else if (key === "block_timestamp") {
          if (!header) header = new _MoneroBlockHeader["default"]();

          _GenUtils["default"].safeSet(header, header.getTimestamp, header.setTimestamp, val);
        } else if (key === "block_height") {
          if (!header) header = new _MoneroBlockHeader["default"]();

          _GenUtils["default"].safeSet(header, header.getHeight, header.setHeight, val);
        } else if (key === "last_relayed_time") _GenUtils["default"].safeSet(tx, tx.getLastRelayedTimestamp, tx.setLastRelayedTimestamp, val);else if (key === "receive_time" || key === "received_timestamp") _GenUtils["default"].safeSet(tx, tx.getReceivedTimestamp, tx.setReceivedTimestamp, val);else if (key === "confirmations") _GenUtils["default"].safeSet(tx, tx.getNumConfirmations, tx.setNumConfirmations, val);else if (key === "in_pool") {
          _GenUtils["default"].safeSet(tx, tx.isConfirmed, tx.setIsConfirmed, !val);

          _GenUtils["default"].safeSet(tx, tx.inTxPool, tx.setInTxPool, val);
        } else if (key === "double_spend_seen") _GenUtils["default"].safeSet(tx, tx.isDoubleSpendSeen, tx.setIsDoubleSpend, val);else if (key === "version") _GenUtils["default"].safeSet(tx, tx.getVersion, tx.setVersion, val);else if (key === "extra") {
          if (typeof val === "string") console.log("WARNING: extra field as string not being asigned to int[]: " + key + ": " + val); // TODO: how to set string to int[]? - or, extra is string which can encode int[]
          else _GenUtils["default"].safeSet(tx, tx.getExtra, tx.setExtra, val);
        } else if (key === "vin") {
          if (val.length !== 1 || !val[0].gen) {
            // ignore miner input TODO: why?
            tx.setInputs(val.map(function (rpcVin) {
              return MoneroDaemonRpc._convertRpcOutput(rpcVin, tx);
            }));
          }
        } else if (key === "vout") tx.setOutputs(val.map(function (rpcOutput) {
          return MoneroDaemonRpc._convertRpcOutput(rpcOutput, tx);
        }));else if (key === "rct_signatures") _GenUtils["default"].safeSet(tx, tx.getRctSignatures, tx.setRctSignatures, val);else if (key === "rctsig_prunable") _GenUtils["default"].safeSet(tx, tx.getRctSigPrunable, tx.setRctSigPrunable, val);else if (key === "unlock_time") _GenUtils["default"].safeSet(tx, tx.getUnlockHeight, tx.setUnlockHeight, val);else if (key === "as_json" || key === "tx_json") {} // handled last so tx is as initialized as possible
        else if (key === "as_hex" || key === "tx_blob") _GenUtils["default"].safeSet(tx, tx.getFullHex, tx.setFullHex, val ? val : undefined);else if (key === "blob_size") _GenUtils["default"].safeSet(tx, tx.getSize, tx.setSize, val);else if (key === "weight") _GenUtils["default"].safeSet(tx, tx.getWeight, tx.setWeight, val);else if (key === "fee") _GenUtils["default"].safeSet(tx, tx.getFee, tx.setFee, BigInt(val));else if (key === "relayed") _GenUtils["default"].safeSet(tx, tx.isRelayed, tx.setIsRelayed, val);else if (key === "output_indices") _GenUtils["default"].safeSet(tx, tx.getOutputIndices, tx.setOutputIndices, val);else if (key === "do_not_relay") _GenUtils["default"].safeSet(tx, tx.getRelay, tx.setRelay, !val);else if (key === "kept_by_block") _GenUtils["default"].safeSet(tx, tx.isKeptByBlock, tx.setIsKeptByBlock, val);else if (key === "signatures") _GenUtils["default"].safeSet(tx, tx.getSignatures, tx.setSignatures, val);else if (key === "last_failed_height") {
          if (val === 0) _GenUtils["default"].safeSet(tx, tx.isFailed, tx.setIsFailed, false);else {
            _GenUtils["default"].safeSet(tx, tx.isFailed, tx.setIsFailed, true);

            _GenUtils["default"].safeSet(tx, tx.getLastFailedHeight, tx.setLastFailedHeight, val);
          }
        } else if (key === "last_failed_id_hash") {
          if (val === MoneroDaemonRpc.DEFAULT_ID) _GenUtils["default"].safeSet(tx, tx.isFailed, tx.setIsFailed, false);else {
            _GenUtils["default"].safeSet(tx, tx.isFailed, tx.setIsFailed, true);

            _GenUtils["default"].safeSet(tx, tx.getLastFailedHash, tx.setLastFailedHash, val);
          }
        } else if (key === "max_used_block_height") _GenUtils["default"].safeSet(tx, tx.getMaxUsedBlockHeight, tx.setMaxUsedBlockHeight, val);else if (key === "max_used_block_id_hash") _GenUtils["default"].safeSet(tx, tx.getMaxUsedBlockHash, tx.setMaxUsedBlockHash, val);else if (key === "prunable_hash") _GenUtils["default"].safeSet(tx, tx.getPrunableHash, tx.setPrunableHash, val ? val : undefined);else if (key === "prunable_as_hex") _GenUtils["default"].safeSet(tx, tx.getPrunableHex, tx.setPrunableHex, val ? val : undefined);else if (key === "pruned_as_hex") _GenUtils["default"].safeSet(tx, tx.getPrunedHex, tx.setPrunedHex, val ? val : undefined);else console.log("WARNING: ignoring unexpected field in rpc tx: " + key + ": " + val);
      } // link block and tx


      if (header) tx.setBlock(new _MoneroBlock["default"](header).setTxs([tx])); // TODO monerod: unconfirmed txs misreport block height and timestamp

      if (tx.getBlock() && tx.getBlock().getHeight() !== undefined && tx.getBlock().getHeight() === tx.getBlock().getTimestamp()) {
        tx.setBlock(undefined);
        tx.setIsConfirmed(false);
      } // initialize remaining known fields


      if (tx.isConfirmed()) {
        _GenUtils["default"].safeSet(tx, tx.isRelayed, tx.setIsRelayed, true);

        _GenUtils["default"].safeSet(tx, tx.getRelay, tx.setRelay, true);

        _GenUtils["default"].safeSet(tx, tx.isFailed, tx.setIsFailed, false);
      } else {
        tx.setNumConfirmations(0);
      }

      if (tx.isFailed() === undefined) tx.setIsFailed(false);

      if (tx.getOutputIndices() && tx.getOutputs()) {
        _assert["default"].equal(tx.getOutputs().length, tx.getOutputIndices().length);

        for (var i = 0; i < tx.getOutputs().length; i++) {
          tx.getOutputs()[i].setIndex(tx.getOutputIndices()[i]); // transfer output indices to outputs
        }
      }

      if (rpcTx.as_json) MoneroDaemonRpc._convertRpcTx(JSON.parse(rpcTx.as_json), tx);
      if (rpcTx.tx_json) MoneroDaemonRpc._convertRpcTx(JSON.parse(rpcTx.tx_json), tx);
      if (!tx.isRelayed()) tx.setLastRelayedTimestamp(undefined); // TODO monerod: returns last_relayed_timestamp despite relayed: false, self inconsistent
      // return built transaction

      return tx;
    }
  }, {
    key: "_convertRpcOutput",
    value: function _convertRpcOutput(rpcOutput, tx) {
      var output = new _MoneroOutput["default"]();
      output.setTx(tx);

      for (var _i5 = 0, _Object$keys3 = Object.keys(rpcOutput); _i5 < _Object$keys3.length; _i5++) {
        var key = _Object$keys3[_i5];
        var val = rpcOutput[key];
        if (key === "gen") throw new _MoneroError["default"]("Output with 'gen' from daemon rpc is miner tx which we ignore (i.e. each miner input is undefined)");else if (key === "key") {
          _GenUtils["default"].safeSet(output, output.getAmount, output.setAmount, BigInt(val.amount));

          _GenUtils["default"].safeSet(output, output.getKeyImage, output.setKeyImage, new _MoneroKeyImage["default"](val.k_image));

          _GenUtils["default"].safeSet(output, output.getRingOutputIndices, output.setRingOutputIndices, val.key_offsets);
        } else if (key === "amount") _GenUtils["default"].safeSet(output, output.getAmount, output.setAmount, BigInt(val));else if (key === "target") {
          var pubKey = val.key === undefined ? val.tagged_key.key : val.key; // TODO (monerod): rpc json uses {tagged_key={key=...}}, binary blocks use {key=...}

          _GenUtils["default"].safeSet(output, output.getStealthPublicKey, output.setStealthPublicKey, pubKey);
        } else console.log("WARNING: ignoring unexpected field output: " + key + ": " + val);
      }

      return output;
    }
  }, {
    key: "_convertRpcBlockTemplate",
    value: function _convertRpcBlockTemplate(rpcTemplate) {
      var template = new _MoneroBlockTemplate["default"]();

      for (var _i6 = 0, _Object$keys4 = Object.keys(rpcTemplate); _i6 < _Object$keys4.length; _i6++) {
        var key = _Object$keys4[_i6];
        var val = rpcTemplate[key];
        if (key === "blockhashing_blob") template.setBlockTemplateBlob(val);else if (key === "blocktemplate_blob") template.setBlockHashingBlob(val);else if (key === "difficulty") template.setDifficulty(BigInt(val));else if (key === "expected_reward") template.setExpectedReward(val);else if (key === "difficulty") {} // handled by wide_difficulty
        else if (key === "difficulty_top64") {} // handled by wide_difficulty
        else if (key === "wide_difficulty") template.setDifficulty(_GenUtils["default"].reconcile(template.getDifficulty(), MoneroDaemonRpc._prefixedHexToBI(val)));else if (key === "height") template.setHeight(val);else if (key === "prev_hash") template.setPrevHash(val);else if (key === "reserved_offset") template.setReservedOffset(val);else if (key === "status") {} // handled elsewhere
        else if (key === "untrusted") {} // handled elsewhere
        else if (key === "seed_height") template.setSeedHeight(val);else if (key === "seed_hash") template.setSeedHash(val);else if (key === "next_seed_hash") template.setNextSeedHash(val);else console.log("WARNING: ignoring unexpected field in block template: " + key + ": " + val);
      }

      if ("" === template.getNextSeedHash()) template.setNextSeedHash(undefined);
      return template;
    }
  }, {
    key: "_convertRpcInfo",
    value: function _convertRpcInfo(rpcInfo) {
      if (!rpcInfo) return undefined;
      var info = new _MoneroDaemonInfo["default"]();

      for (var _i7 = 0, _Object$keys5 = Object.keys(rpcInfo); _i7 < _Object$keys5.length; _i7++) {
        var key = _Object$keys5[_i7];
        var val = rpcInfo[key];
        if (key === "version") info.setVersion(val);else if (key === "alt_blocks_count") info.setNumAltBlocks(val);else if (key === "block_size_limit") info.setBlockSizeLimit(val);else if (key === "block_size_median") info.setBlockSizeMedian(val);else if (key === "block_weight_limit") info.setBlockWeightLimit(val);else if (key === "block_weight_median") info.setBlockWeightMedian(val);else if (key === "bootstrap_daemon_address") {
          if (val) info.setBootstrapDaemonAddress(val);
        } else if (key === "difficulty") {} // handled by wide_difficulty
        else if (key === "cumulative_difficulty") {} // handled by wide_cumulative_difficulty
        else if (key === "difficulty_top64") {} // handled by wide_difficulty
        else if (key === "cumulative_difficulty_top64") {} // handled by wide_cumulative_difficulty
        else if (key === "wide_difficulty") info.setDifficulty(_GenUtils["default"].reconcile(info.getDifficulty(), MoneroDaemonRpc._prefixedHexToBI(val)));else if (key === "wide_cumulative_difficulty") info.setCumulativeDifficulty(_GenUtils["default"].reconcile(info.getCumulativeDifficulty(), MoneroDaemonRpc._prefixedHexToBI(val)));else if (key === "free_space") info.setFreeSpace(BigInt(val));else if (key === "database_size") info.setDatabaseSize(val);else if (key === "grey_peerlist_size") info.setNumOfflinePeers(val);else if (key === "height") info.setHeight(val);else if (key === "height_without_bootstrap") info.setHeightWithoutBootstrap(val);else if (key === "incoming_connections_count") info.setNumIncomingConnections(val);else if (key === "offline") info.setIsOffline(val);else if (key === "outgoing_connections_count") info.setNumOutgoingConnections(val);else if (key === "rpc_connections_count") info.setNumRpcConnections(val);else if (key === "start_time") info.setStartTimestamp(val);else if (key === "adjusted_time") info.setAdjustedTimestamp(val);else if (key === "status") {} // handled elsewhere
        else if (key === "target") info.setTarget(val);else if (key === "target_height") info.setTargetHeight(val);else if (key === "top_block_hash") info.setTopBlockHash(val);else if (key === "tx_count") info.setNumTxs(val);else if (key === "tx_pool_size") info.setNumTxsPool(val);else if (key === "untrusted") {} // handled elsewhere
        else if (key === "was_bootstrap_ever_used") info.setWasBootstrapEverUsed(val);else if (key === "white_peerlist_size") info.setNumOnlinePeers(val);else if (key === "update_available") info.setUpdateAvailable(val);else if (key === "nettype") _GenUtils["default"].safeSet(info, info.getNetworkType, info.setNetworkType, _MoneroDaemon3["default"].parseNetworkType(val));else if (key === "mainnet") {
          if (val) _GenUtils["default"].safeSet(info, info.getNetworkType, info.setNetworkType, _MoneroNetworkType["default"].MAINNET);
        } else if (key === "testnet") {
          if (val) _GenUtils["default"].safeSet(info, info.getNetworkType, info.setNetworkType, _MoneroNetworkType["default"].TESTNET);
        } else if (key === "stagenet") {
          if (val) _GenUtils["default"].safeSet(info, info.getNetworkType, info.setNetworkType, _MoneroNetworkType["default"].STAGENET);
        } else if (key === "credits") info.setCredits(BigInt(val));else if (key === "top_block_hash" || key === "top_hash") info.setTopBlockHash(_GenUtils["default"].reconcile(info.getTopBlockHash(), "" === val ? undefined : val));else if (key === "busy_syncing") info.setIsBusySyncing(val);else if (key === "synchronized") info.setIsSynchronized(val);else if (key === "restricted") info.setIsRestricted(val);else console.log("WARNING: Ignoring unexpected info field: " + key + ": " + val);
      }

      return info;
    }
    /**
     * Initializes sync info from RPC sync info.
     * 
     * @param rpcSyncInfo - rpc map to initialize the sync info from
     * @return {MoneroDaemonSyncInfo} is sync info initialized from the map
     */

  }, {
    key: "_convertRpcSyncInfo",
    value: function _convertRpcSyncInfo(rpcSyncInfo) {
      var syncInfo = new _MoneroDaemonSyncInfo["default"]();

      for (var _i8 = 0, _Object$keys6 = Object.keys(rpcSyncInfo); _i8 < _Object$keys6.length; _i8++) {
        var key = _Object$keys6[_i8];
        var val = rpcSyncInfo[key];
        if (key === "height") syncInfo.setHeight(val);else if (key === "peers") {
          syncInfo.setPeers([]);
          var rpcConnections = val;

          var _iterator15 = _createForOfIteratorHelper(rpcConnections),
              _step15;

          try {
            for (_iterator15.s(); !(_step15 = _iterator15.n()).done;) {
              var rpcConnection = _step15.value;
              syncInfo.getPeers().push(MoneroDaemonRpc._convertRpcConnection(rpcConnection.info));
            }
          } catch (err) {
            _iterator15.e(err);
          } finally {
            _iterator15.f();
          }
        } else if (key === "spans") {
          syncInfo.setSpans([]);
          var rpcSpans = val;

          var _iterator16 = _createForOfIteratorHelper(rpcSpans),
              _step16;

          try {
            for (_iterator16.s(); !(_step16 = _iterator16.n()).done;) {
              var rpcSpan = _step16.value;
              syncInfo.getSpans().push(MoneroDaemonRpc._convertRpcConnectionSpan(rpcSpan));
            }
          } catch (err) {
            _iterator16.e(err);
          } finally {
            _iterator16.f();
          }
        } else if (key === "status") {} // handled elsewhere
        else if (key === "target_height") syncInfo.setTargetHeight(BigInt(val));else if (key === "next_needed_pruning_seed") syncInfo.setNextNeededPruningSeed(val);else if (key === "overview") {
          // this returns [] without pruning
          var overview = void 0;

          try {
            overview = JSON.parse(val);
            if (overview !== undefined && overview.length > 0) console.error("Ignoring non-empty 'overview' field (not implemented): " + overview); // TODO
          } catch (e) {
            console.error("Failed to parse 'overview' field: " + overview + ": " + e.message);
          }
        } else if (key === "credits") syncInfo.setCredits(BigInt(val));else if (key === "top_hash") syncInfo.setTopBlockHash("" === val ? undefined : val);else if (key === "untrusted") {} // handled elsewhere
        else console.log("WARNING: ignoring unexpected field in sync info: " + key + ": " + val);
      }

      return syncInfo;
    }
  }, {
    key: "_convertRpcHardForkInfo",
    value: function _convertRpcHardForkInfo(rpcHardForkInfo) {
      var info = new _MoneroHardForkInfo["default"]();

      for (var _i9 = 0, _Object$keys7 = Object.keys(rpcHardForkInfo); _i9 < _Object$keys7.length; _i9++) {
        var key = _Object$keys7[_i9];
        var val = rpcHardForkInfo[key];
        if (key === "earliest_height") info.setEarliestHeight(val);else if (key === "enabled") info.setIsEnabled(val);else if (key === "state") info.setState(val);else if (key === "status") {} // handled elsewhere
        else if (key === "untrusted") {} // handled elsewhere
        else if (key === "threshold") info.setThreshold(val);else if (key === "version") info.setVersion(val);else if (key === "votes") info.setNumVotes(val);else if (key === "voting") info.setVoting(val);else if (key === "window") info.setWindow(val);else if (key === "credits") info.setCredits(BigInt(val));else if (key === "top_hash") info.setTopBlockHash("" === val ? undefined : val);else console.log("WARNING: ignoring unexpected field in hard fork info: " + key + ": " + val);
      }

      return info;
    }
  }, {
    key: "_convertRpcConnectionSpan",
    value: function _convertRpcConnectionSpan(rpcConnectionSpan) {
      var span = new MoneroConnectionSpan();

      for (var _i10 = 0, _Object$keys8 = Object.keys(rpcConnectionSpan); _i10 < _Object$keys8.length; _i10++) {
        var key = _Object$keys8[_i10];
        var val = rpcConnectionSpan[key];
        if (key === "connection_id") span.setConnectionId(val);else if (key === "nblocks") span.setNumBlocks(val);else if (key === "rate") span.setRate(val);else if (key === "remote_address") {
          if (val !== "") span.setRemoteAddress(val);
        } else if (key === "size") span.setSize(val);else if (key === "speed") span.setSpeed(val);else if (key === "start_block_height") span.setStartHeight(val);else console.log("WARNING: ignoring unexpected field in daemon connection span: " + key + ": " + val);
      }

      return span;
    }
  }, {
    key: "_convertRpcOutputHistogramEntry",
    value: function _convertRpcOutputHistogramEntry(rpcEntry) {
      var entry = new _MoneroOutputHistogramEntry["default"]();

      for (var _i11 = 0, _Object$keys9 = Object.keys(rpcEntry); _i11 < _Object$keys9.length; _i11++) {
        var key = _Object$keys9[_i11];
        var val = rpcEntry[key];
        if (key === "amount") entry.setAmount(BigInt(val));else if (key === "total_instances") entry.setNumInstances(val);else if (key === "unlocked_instances") entry.setNumUnlockedInstances(val);else if (key === "recent_instances") entry.setNumRecentInstances(val);else console.log("WARNING: ignoring unexpected field in output histogram: " + key + ": " + val);
      }

      return entry;
    }
  }, {
    key: "_convertRpcSubmitTxResult",
    value: function _convertRpcSubmitTxResult(rpcResult) {
      (0, _assert["default"])(rpcResult);
      var result = new _MoneroSubmitTxResult["default"]();

      for (var _i12 = 0, _Object$keys10 = Object.keys(rpcResult); _i12 < _Object$keys10.length; _i12++) {
        var key = _Object$keys10[_i12];
        var val = rpcResult[key];
        if (key === "double_spend") result.setIsDoubleSpend(val);else if (key === "fee_too_low") result.setIsFeeTooLow(val);else if (key === "invalid_input") result.setHasInvalidInput(val);else if (key === "invalid_output") result.setHasInvalidOutput(val);else if (key === "too_few_outputs") result.setHasTooFewOutputs(val);else if (key === "low_mixin") result.setIsMixinTooLow(val);else if (key === "not_relayed") result.setIsRelayed(!val);else if (key === "overspend") result.setIsOverspend(val);else if (key === "reason") result.setReason(val === "" ? undefined : val);else if (key === "too_big") result.setIsTooBig(val);else if (key === "sanity_check_failed") result.setSanityCheckFailed(val);else if (key === "credits") result.setCredits(BigInt(val));else if (key === "status" || key === "untrusted") {} // handled elsewhere
        else if (key === "top_hash") result.setTopBlockHash("" === val ? undefined : val);else console.log("WARNING: ignoring unexpected field in submit tx hex result: " + key + ": " + val);
      }

      return result;
    }
  }, {
    key: "_convertRpcTxPoolStats",
    value: function _convertRpcTxPoolStats(rpcStats) {
      (0, _assert["default"])(rpcStats);
      var stats = new _MoneroTxPoolStats["default"]();

      for (var _i13 = 0, _Object$keys11 = Object.keys(rpcStats); _i13 < _Object$keys11.length; _i13++) {
        var key = _Object$keys11[_i13];
        var val = rpcStats[key];
        if (key === "bytes_max") stats.setBytesMax(val);else if (key === "bytes_med") stats.setBytesMed(val);else if (key === "bytes_min") stats.setBytesMin(val);else if (key === "bytes_total") stats.setBytesTotal(val);else if (key === "histo_98pc") stats.setHisto98pc(val);else if (key === "num_10m") stats.setNum10m(val);else if (key === "num_double_spends") stats.setNumDoubleSpends(val);else if (key === "num_failing") stats.setNumFailing(val);else if (key === "num_not_relayed") stats.setNumNotRelayed(val);else if (key === "oldest") stats.setOldestTimestamp(val);else if (key === "txs_total") stats.setNumTxs(val);else if (key === "fee_total") stats.setFeeTotal(BigInt(val));else if (key === "histo") throw new _MoneroError["default"]("Not implemented");else console.log("WARNING: ignoring unexpected field in tx pool stats: " + key + ": " + val);
      }

      return stats;
    }
  }, {
    key: "_convertRpcAltChain",
    value: function _convertRpcAltChain(rpcChain) {
      (0, _assert["default"])(rpcChain);
      var chain = new _MoneroAltChain["default"]();

      for (var _i14 = 0, _Object$keys12 = Object.keys(rpcChain); _i14 < _Object$keys12.length; _i14++) {
        var key = _Object$keys12[_i14];
        var val = rpcChain[key];

        if (key === "block_hash") {} // using block_hashes instead
        else if (key === "difficulty") {} // handled by wide_difficulty
        else if (key === "difficulty_top64") {} // handled by wide_difficulty
        else if (key === "wide_difficulty") chain.setDifficulty(_GenUtils["default"].reconcile(chain.getDifficulty(), MoneroDaemonRpc._prefixedHexToBI(val)));else if (key === "height") chain.setHeight(val);else if (key === "length") chain.setLength(val);else if (key === "block_hashes") chain.setBlockHashes(val);else if (key === "main_chain_parent_block") chain.setMainChainParentBlockHash(val);else console.log("WARNING: ignoring unexpected field in alternative chain: " + key + ": " + val);
      }

      return chain;
    }
  }, {
    key: "_convertRpcPeer",
    value: function _convertRpcPeer(rpcPeer) {
      (0, _assert["default"])(rpcPeer);
      var peer = new _MoneroPeer["default"]();

      for (var _i15 = 0, _Object$keys13 = Object.keys(rpcPeer); _i15 < _Object$keys13.length; _i15++) {
        var key = _Object$keys13[_i15];
        var val = rpcPeer[key];
        if (key === "host") peer.setHost(val);else if (key === "id") peer.setId("" + val); // TODO monero-wallet-rpc: peer id is BigInt but string in `get_connections`
        else if (key === "ip") {} // host used instead which is consistently a string
        else if (key === "last_seen") peer.setLastSeenTimestamp(val);else if (key === "port") peer.setPort(val);else if (key === "rpc_port") peer.setRpcPort(val);else if (key === "pruning_seed") peer.setPruningSeed(val);else if (key === "rpc_credits_per_hash") peer.setRpcCreditsPerHash(BigInt(val));else console.log("WARNING: ignoring unexpected field in rpc peer: " + key + ": " + val);
      }

      return peer;
    }
  }, {
    key: "_convertRpcConnection",
    value: function _convertRpcConnection(rpcConnection) {
      var peer = new _MoneroPeer["default"]();
      peer.setIsOnline(true);

      for (var _i16 = 0, _Object$keys14 = Object.keys(rpcConnection); _i16 < _Object$keys14.length; _i16++) {
        var key = _Object$keys14[_i16];
        var val = rpcConnection[key];
        if (key === "address") peer.setAddress(val);else if (key === "avg_download") peer.setAvgDownload(val);else if (key === "avg_upload") peer.setAvgUpload(val);else if (key === "connection_id") peer.setId(val);else if (key === "current_download") peer.setCurrentDownload(val);else if (key === "current_upload") peer.setCurrentUpload(val);else if (key === "height") peer.setHeight(val);else if (key === "host") peer.setHost(val);else if (key === "ip") {} // host used instead which is consistently a string
        else if (key === "incoming") peer.setIsIncoming(val);else if (key === "live_time") peer.setLiveTime(val);else if (key === "local_ip") peer.setIsLocalIp(val);else if (key === "localhost") peer.setIsLocalHost(val);else if (key === "peer_id") peer.setId(val);else if (key === "port") peer.setPort(parseInt(val));else if (key === "rpc_port") peer.setRpcPort(val);else if (key === "recv_count") peer.setNumReceives(val);else if (key === "recv_idle_time") peer.setReceiveIdleTime(val);else if (key === "send_count") peer.setNumSends(val);else if (key === "send_idle_time") peer.setSendIdleTime(val);else if (key === "state") peer.setState(val);else if (key === "support_flags") peer.setNumSupportFlags(val);else if (key === "pruning_seed") peer.setPruningSeed(val);else if (key === "rpc_credits_per_hash") peer.setRpcCreditsPerHash(BigInt(val));else if (key === "address_type") peer.setType(val);else console.log("WARNING: ignoring unexpected field in peer: " + key + ": " + val);
      }

      return peer;
    }
  }, {
    key: "_convertToRpcBan",
    value: function _convertToRpcBan(ban) {
      var rpcBan = {};
      rpcBan.host = ban.getHost();
      rpcBan.ip = ban.getIp();
      rpcBan.ban = ban.isBanned();
      rpcBan.seconds = ban.getSeconds();
      return rpcBan;
    }
  }, {
    key: "_convertRpcMiningStatus",
    value: function _convertRpcMiningStatus(rpcStatus) {
      var status = new _MoneroMiningStatus["default"]();
      status.setIsActive(rpcStatus.active);
      status.setSpeed(rpcStatus.speed);
      status.setNumThreads(rpcStatus.threads_count);

      if (rpcStatus.active) {
        status.setAddress(rpcStatus.address);
        status.setIsBackground(rpcStatus.is_background_mining_enabled);
      }

      return status;
    }
  }, {
    key: "_convertRpcUpdateCheckResult",
    value: function _convertRpcUpdateCheckResult(rpcResult) {
      (0, _assert["default"])(rpcResult);
      var result = new MoneroDaemonUpdateCheckResult();

      for (var _i17 = 0, _Object$keys15 = Object.keys(rpcResult); _i17 < _Object$keys15.length; _i17++) {
        var key = _Object$keys15[_i17];
        var val = rpcResult[key];
        if (key === "auto_uri") result.setAutoUri(val);else if (key === "hash") result.setHash(val);else if (key === "path") {} // handled elsewhere
        else if (key === "status") {} // handled elsewhere
        else if (key === "update") result.setIsUpdateAvailable(val);else if (key === "user_uri") result.setUserUri(val);else if (key === "version") result.setVersion(val);else if (key === "untrusted") {} // handled elsewhere
        else console.log("WARNING: ignoring unexpected field in rpc check update result: " + key + ": " + val);
      }

      if (result.getAutoUri() === "") result.setAutoUri(undefined);
      if (result.getUserUri() === "") result.setUserUri(undefined);
      if (result.getVersion() === "") result.setVersion(undefined);
      if (result.getHash() === "") result.setHash(undefined);
      return result;
    }
  }, {
    key: "_convertRpcUpdateDownloadResult",
    value: function _convertRpcUpdateDownloadResult(rpcResult) {
      var result = new MoneroDaemonUpdateDownloadResult(MoneroDaemonRpc._convertRpcUpdateCheckResult(rpcResult));
      result.setDownloadPath(rpcResult["path"]);
      if (result.getDownloadPath() === "") result.setDownloadPath(undefined);
      return result;
    }
    /**
     * Converts a '0x' prefixed hexidecimal string to a BigInt.
     * 
     * @param hex is the '0x' prefixed hexidecimal string to convert
     * @return BigInt is the hexicedimal converted to decimal
     */

  }, {
    key: "_prefixedHexToBI",
    value: function _prefixedHexToBI(hex) {
      (0, _assert["default"])(hex.substring(0, 2) === "0x");
      return BigInt(hex, 16);
    }
  }]);
  return MoneroDaemonRpc;
}(_MoneroDaemon3["default"]); // static variables


MoneroDaemonRpc.DEFAULT_ID = "0000000000000000000000000000000000000000000000000000000000000000"; // uninitialized tx or block hash from daemon rpc

MoneroDaemonRpc.MAX_REQ_SIZE = "3000000"; // max request size when fetching blocks from daemon

MoneroDaemonRpc.NUM_HEADERS_PER_REQ = "750"; // number of headers to fetch and cache per request

/**
 * Implements a MoneroDaemon by proxying requests to a worker.
 * 
 * @private
 */

var MoneroDaemonRpcProxy = /*#__PURE__*/function (_MoneroDaemon2) {
  (0, _inherits2["default"])(MoneroDaemonRpcProxy, _MoneroDaemon2);

  var _super3 = _createSuper(MoneroDaemonRpcProxy);

  // ---------------------------- INSTANCE METHODS ----------------------------
  function MoneroDaemonRpcProxy(daemonId, worker) {
    var _this2;

    (0, _classCallCheck2["default"])(this, MoneroDaemonRpcProxy);
    _this2 = _super3.call(this);
    _this2.daemonId = daemonId;
    _this2.worker = worker;
    _this2.wrappedListeners = [];
    return _this2;
  }

  (0, _createClass2["default"])(MoneroDaemonRpcProxy, [{
    key: "getProcess",
    value: function () {
      var _getProcess = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee73() {
        return _regenerator["default"].wrap(function _callee73$(_context73) {
          while (1) {
            switch (_context73.prev = _context73.next) {
              case 0:
                return _context73.abrupt("return", undefined);

              case 1:
              case "end":
                return _context73.stop();
            }
          }
        }, _callee73);
      }));

      function getProcess() {
        return _getProcess.apply(this, arguments);
      }

      return getProcess;
    }()
  }, {
    key: "stopProcess",
    value: function () {
      var _stopProcess2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee74() {
        var listenersCopy, _iterator17, _step17, listener;

        return _regenerator["default"].wrap(function _callee74$(_context74) {
          while (1) {
            switch (_context74.prev = _context74.next) {
              case 0:
                if (!(this.process === undefined)) {
                  _context74.next = 2;
                  break;
                }

                throw new _MoneroError["default"]("MoneroDaemonRpcProxy instance not created from new process");

              case 2:
                listenersCopy = _GenUtils["default"].copyArray(this.getListeners());
                _iterator17 = _createForOfIteratorHelper(listenersCopy);
                _context74.prev = 4;

                _iterator17.s();

              case 6:
                if ((_step17 = _iterator17.n()).done) {
                  _context74.next = 12;
                  break;
                }

                listener = _step17.value;
                _context74.next = 10;
                return this.removeListener(listener);

              case 10:
                _context74.next = 6;
                break;

              case 12:
                _context74.next = 17;
                break;

              case 14:
                _context74.prev = 14;
                _context74.t0 = _context74["catch"](4);

                _iterator17.e(_context74.t0);

              case 17:
                _context74.prev = 17;

                _iterator17.f();

                return _context74.finish(17);

              case 20:
                this.process.kill();

              case 21:
              case "end":
                return _context74.stop();
            }
          }
        }, _callee74, this, [[4, 14, 17, 20]]);
      }));

      function stopProcess() {
        return _stopProcess2.apply(this, arguments);
      }

      return stopProcess;
    }()
  }, {
    key: "addListener",
    value: function () {
      var _addListener2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee75(listener) {
        var wrappedListener, listenerId;
        return _regenerator["default"].wrap(function _callee75$(_context75) {
          while (1) {
            switch (_context75.prev = _context75.next) {
              case 0:
                wrappedListener = new DaemonWorkerListener(listener);
                listenerId = wrappedListener.getId();
                _LibraryUtils["default"].WORKER_OBJECTS[this.daemonId].callbacks["onBlockHeader_" + listenerId] = [wrappedListener.onBlockHeader, wrappedListener];
                this.wrappedListeners.push(wrappedListener);
                return _context75.abrupt("return", this._invokeWorker("daemonAddListener", [listenerId]));

              case 5:
              case "end":
                return _context75.stop();
            }
          }
        }, _callee75, this);
      }));

      function addListener(_x70) {
        return _addListener2.apply(this, arguments);
      }

      return addListener;
    }()
  }, {
    key: "removeListener",
    value: function () {
      var _removeListener2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee76(listener) {
        var i, listenerId;
        return _regenerator["default"].wrap(function _callee76$(_context76) {
          while (1) {
            switch (_context76.prev = _context76.next) {
              case 0:
                i = 0;

              case 1:
                if (!(i < this.wrappedListeners.length)) {
                  _context76.next = 12;
                  break;
                }

                if (!(this.wrappedListeners[i].getListener() === listener)) {
                  _context76.next = 9;
                  break;
                }

                listenerId = this.wrappedListeners[i].getId();
                _context76.next = 6;
                return this._invokeWorker("daemonRemoveListener", [listenerId]);

              case 6:
                delete _LibraryUtils["default"].WORKER_OBJECTS[this.daemonId].callbacks["onBlockHeader_" + listenerId];
                this.wrappedListeners.splice(i, 1);
                return _context76.abrupt("return");

              case 9:
                i++;
                _context76.next = 1;
                break;

              case 12:
                throw new _MoneroError["default"]("Listener is not registered with daemon");

              case 13:
              case "end":
                return _context76.stop();
            }
          }
        }, _callee76, this);
      }));

      function removeListener(_x71) {
        return _removeListener2.apply(this, arguments);
      }

      return removeListener;
    }()
  }, {
    key: "getListeners",
    value: function getListeners() {
      var listeners = [];

      var _iterator18 = _createForOfIteratorHelper(this.wrappedListeners),
          _step18;

      try {
        for (_iterator18.s(); !(_step18 = _iterator18.n()).done;) {
          var wrappedListener = _step18.value;
          listeners.push(wrappedListener.getListener());
        }
      } catch (err) {
        _iterator18.e(err);
      } finally {
        _iterator18.f();
      }

      return listeners;
    }
  }, {
    key: "getRpcConnection",
    value: function () {
      var _getRpcConnection2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee77() {
        var config;
        return _regenerator["default"].wrap(function _callee77$(_context77) {
          while (1) {
            switch (_context77.prev = _context77.next) {
              case 0:
                _context77.next = 2;
                return this._invokeWorker("daemonGetRpcConnection");

              case 2:
                config = _context77.sent;
                return _context77.abrupt("return", new _MoneroRpcConnection["default"](config));

              case 4:
              case "end":
                return _context77.stop();
            }
          }
        }, _callee77, this);
      }));

      function getRpcConnection() {
        return _getRpcConnection2.apply(this, arguments);
      }

      return getRpcConnection;
    }()
  }, {
    key: "isConnected",
    value: function () {
      var _isConnected2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee78() {
        return _regenerator["default"].wrap(function _callee78$(_context78) {
          while (1) {
            switch (_context78.prev = _context78.next) {
              case 0:
                return _context78.abrupt("return", this._invokeWorker("daemonIsConnected"));

              case 1:
              case "end":
                return _context78.stop();
            }
          }
        }, _callee78, this);
      }));

      function isConnected() {
        return _isConnected2.apply(this, arguments);
      }

      return isConnected;
    }()
  }, {
    key: "getVersion",
    value: function () {
      var _getVersion2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee79() {
        var versionJson;
        return _regenerator["default"].wrap(function _callee79$(_context79) {
          while (1) {
            switch (_context79.prev = _context79.next) {
              case 0:
                _context79.next = 2;
                return this._invokeWorker("daemonGetVersion");

              case 2:
                versionJson = _context79.sent;
                return _context79.abrupt("return", new _MoneroVersion["default"](versionJson.number, versionJson.isRelease));

              case 4:
              case "end":
                return _context79.stop();
            }
          }
        }, _callee79, this);
      }));

      function getVersion() {
        return _getVersion2.apply(this, arguments);
      }

      return getVersion;
    }()
  }, {
    key: "isTrusted",
    value: function () {
      var _isTrusted2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee80() {
        return _regenerator["default"].wrap(function _callee80$(_context80) {
          while (1) {
            switch (_context80.prev = _context80.next) {
              case 0:
                return _context80.abrupt("return", this._invokeWorker("daemonIsTrusted"));

              case 1:
              case "end":
                return _context80.stop();
            }
          }
        }, _callee80, this);
      }));

      function isTrusted() {
        return _isTrusted2.apply(this, arguments);
      }

      return isTrusted;
    }()
  }, {
    key: "getHeight",
    value: function () {
      var _getHeight2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee81() {
        return _regenerator["default"].wrap(function _callee81$(_context81) {
          while (1) {
            switch (_context81.prev = _context81.next) {
              case 0:
                return _context81.abrupt("return", this._invokeWorker("daemonGetHeight"));

              case 1:
              case "end":
                return _context81.stop();
            }
          }
        }, _callee81, this);
      }));

      function getHeight() {
        return _getHeight2.apply(this, arguments);
      }

      return getHeight;
    }()
  }, {
    key: "getBlockHash",
    value: function () {
      var _getBlockHash2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee82(height) {
        var _args82 = arguments;
        return _regenerator["default"].wrap(function _callee82$(_context82) {
          while (1) {
            switch (_context82.prev = _context82.next) {
              case 0:
                return _context82.abrupt("return", this._invokeWorker("daemonGetBlockHash", Array.from(_args82)));

              case 1:
              case "end":
                return _context82.stop();
            }
          }
        }, _callee82, this);
      }));

      function getBlockHash(_x72) {
        return _getBlockHash2.apply(this, arguments);
      }

      return getBlockHash;
    }()
  }, {
    key: "getBlockTemplate",
    value: function () {
      var _getBlockTemplate2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee83(walletAddress, reserveSize) {
        var _args83 = arguments;
        return _regenerator["default"].wrap(function _callee83$(_context83) {
          while (1) {
            switch (_context83.prev = _context83.next) {
              case 0:
                _context83.t0 = _MoneroBlockTemplate["default"];
                _context83.next = 3;
                return this._invokeWorker("daemonGetBlockTemplate", Array.from(_args83));

              case 3:
                _context83.t1 = _context83.sent;
                return _context83.abrupt("return", new _context83.t0(_context83.t1));

              case 5:
              case "end":
                return _context83.stop();
            }
          }
        }, _callee83, this);
      }));

      function getBlockTemplate(_x73, _x74) {
        return _getBlockTemplate2.apply(this, arguments);
      }

      return getBlockTemplate;
    }()
  }, {
    key: "getLastBlockHeader",
    value: function () {
      var _getLastBlockHeader2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee84() {
        return _regenerator["default"].wrap(function _callee84$(_context84) {
          while (1) {
            switch (_context84.prev = _context84.next) {
              case 0:
                _context84.t0 = _MoneroBlockHeader["default"];
                _context84.next = 3;
                return this._invokeWorker("daemonGetLastBlockHeader");

              case 3:
                _context84.t1 = _context84.sent;
                return _context84.abrupt("return", new _context84.t0(_context84.t1));

              case 5:
              case "end":
                return _context84.stop();
            }
          }
        }, _callee84, this);
      }));

      function getLastBlockHeader() {
        return _getLastBlockHeader2.apply(this, arguments);
      }

      return getLastBlockHeader;
    }()
  }, {
    key: "getBlockHeaderByHash",
    value: function () {
      var _getBlockHeaderByHash2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee85(blockHash) {
        var _args85 = arguments;
        return _regenerator["default"].wrap(function _callee85$(_context85) {
          while (1) {
            switch (_context85.prev = _context85.next) {
              case 0:
                _context85.t0 = _MoneroBlockHeader["default"];
                _context85.next = 3;
                return this._invokeWorker("daemonGetBlockHeaderByHash", Array.from(_args85));

              case 3:
                _context85.t1 = _context85.sent;
                return _context85.abrupt("return", new _context85.t0(_context85.t1));

              case 5:
              case "end":
                return _context85.stop();
            }
          }
        }, _callee85, this);
      }));

      function getBlockHeaderByHash(_x75) {
        return _getBlockHeaderByHash2.apply(this, arguments);
      }

      return getBlockHeaderByHash;
    }()
  }, {
    key: "getBlockHeaderByHeight",
    value: function () {
      var _getBlockHeaderByHeight2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee86(height) {
        var _args86 = arguments;
        return _regenerator["default"].wrap(function _callee86$(_context86) {
          while (1) {
            switch (_context86.prev = _context86.next) {
              case 0:
                _context86.t0 = _MoneroBlockHeader["default"];
                _context86.next = 3;
                return this._invokeWorker("daemonGetBlockHeaderByHeight", Array.from(_args86));

              case 3:
                _context86.t1 = _context86.sent;
                return _context86.abrupt("return", new _context86.t0(_context86.t1));

              case 5:
              case "end":
                return _context86.stop();
            }
          }
        }, _callee86, this);
      }));

      function getBlockHeaderByHeight(_x76) {
        return _getBlockHeaderByHeight2.apply(this, arguments);
      }

      return getBlockHeaderByHeight;
    }()
  }, {
    key: "getBlockHeadersByRange",
    value: function () {
      var _getBlockHeadersByRange2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee87(startHeight, endHeight) {
        var blockHeadersJson,
            headers,
            _iterator19,
            _step19,
            blockHeaderJson,
            _args87 = arguments;

        return _regenerator["default"].wrap(function _callee87$(_context87) {
          while (1) {
            switch (_context87.prev = _context87.next) {
              case 0:
                _context87.next = 2;
                return this._invokeWorker("daemonGetBlockHeadersByRange", Array.from(_args87));

              case 2:
                blockHeadersJson = _context87.sent;
                headers = [];
                _iterator19 = _createForOfIteratorHelper(blockHeadersJson);

                try {
                  for (_iterator19.s(); !(_step19 = _iterator19.n()).done;) {
                    blockHeaderJson = _step19.value;
                    headers.push(new _MoneroBlockHeader["default"](blockHeaderJson));
                  }
                } catch (err) {
                  _iterator19.e(err);
                } finally {
                  _iterator19.f();
                }

                return _context87.abrupt("return", headers);

              case 7:
              case "end":
                return _context87.stop();
            }
          }
        }, _callee87, this);
      }));

      function getBlockHeadersByRange(_x77, _x78) {
        return _getBlockHeadersByRange2.apply(this, arguments);
      }

      return getBlockHeadersByRange;
    }()
  }, {
    key: "getBlockByHash",
    value: function () {
      var _getBlockByHash2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee88(blockHash) {
        var _args88 = arguments;
        return _regenerator["default"].wrap(function _callee88$(_context88) {
          while (1) {
            switch (_context88.prev = _context88.next) {
              case 0:
                _context88.t0 = _MoneroBlock["default"];
                _context88.next = 3;
                return this._invokeWorker("daemonGetBlockByHash", Array.from(_args88));

              case 3:
                _context88.t1 = _context88.sent;
                return _context88.abrupt("return", new _context88.t0(_context88.t1));

              case 5:
              case "end":
                return _context88.stop();
            }
          }
        }, _callee88, this);
      }));

      function getBlockByHash(_x79) {
        return _getBlockByHash2.apply(this, arguments);
      }

      return getBlockByHash;
    }()
  }, {
    key: "getBlocksByHash",
    value: function () {
      var _getBlocksByHash = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee89(blockHashes, startHeight, prune) {
        var blocksJson,
            blocks,
            _iterator20,
            _step20,
            blockJson,
            _args89 = arguments;

        return _regenerator["default"].wrap(function _callee89$(_context89) {
          while (1) {
            switch (_context89.prev = _context89.next) {
              case 0:
                _context89.next = 2;
                return this._invokeWorker("daemonGetBlocksByHash", Array.from(_args89));

              case 2:
                blocksJson = _context89.sent;
                blocks = [];
                _iterator20 = _createForOfIteratorHelper(blocksJson);

                try {
                  for (_iterator20.s(); !(_step20 = _iterator20.n()).done;) {
                    blockJson = _step20.value;
                    blocks.push(new _MoneroBlock["default"](blockJson));
                  }
                } catch (err) {
                  _iterator20.e(err);
                } finally {
                  _iterator20.f();
                }

                return _context89.abrupt("return", blocks);

              case 7:
              case "end":
                return _context89.stop();
            }
          }
        }, _callee89, this);
      }));

      function getBlocksByHash(_x80, _x81, _x82) {
        return _getBlocksByHash.apply(this, arguments);
      }

      return getBlocksByHash;
    }()
  }, {
    key: "getBlockByHeight",
    value: function () {
      var _getBlockByHeight2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee90(height) {
        var _args90 = arguments;
        return _regenerator["default"].wrap(function _callee90$(_context90) {
          while (1) {
            switch (_context90.prev = _context90.next) {
              case 0:
                _context90.t0 = _MoneroBlock["default"];
                _context90.next = 3;
                return this._invokeWorker("daemonGetBlockByHeight", Array.from(_args90));

              case 3:
                _context90.t1 = _context90.sent;
                return _context90.abrupt("return", new _context90.t0(_context90.t1));

              case 5:
              case "end":
                return _context90.stop();
            }
          }
        }, _callee90, this);
      }));

      function getBlockByHeight(_x83) {
        return _getBlockByHeight2.apply(this, arguments);
      }

      return getBlockByHeight;
    }()
  }, {
    key: "getBlocksByHeight",
    value: function () {
      var _getBlocksByHeight2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee91(heights) {
        var blocksJson,
            blocks,
            _iterator21,
            _step21,
            blockJson,
            _args91 = arguments;

        return _regenerator["default"].wrap(function _callee91$(_context91) {
          while (1) {
            switch (_context91.prev = _context91.next) {
              case 0:
                _context91.next = 2;
                return this._invokeWorker("daemonGetBlocksByHeight", Array.from(_args91));

              case 2:
                blocksJson = _context91.sent;
                blocks = [];
                _iterator21 = _createForOfIteratorHelper(blocksJson);

                try {
                  for (_iterator21.s(); !(_step21 = _iterator21.n()).done;) {
                    blockJson = _step21.value;
                    blocks.push(new _MoneroBlock["default"](blockJson));
                  }
                } catch (err) {
                  _iterator21.e(err);
                } finally {
                  _iterator21.f();
                }

                return _context91.abrupt("return", blocks);

              case 7:
              case "end":
                return _context91.stop();
            }
          }
        }, _callee91, this);
      }));

      function getBlocksByHeight(_x84) {
        return _getBlocksByHeight2.apply(this, arguments);
      }

      return getBlocksByHeight;
    }()
  }, {
    key: "getBlocksByRange",
    value: function () {
      var _getBlocksByRange2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee92(startHeight, endHeight) {
        var blocksJson,
            blocks,
            _iterator22,
            _step22,
            blockJson,
            _args92 = arguments;

        return _regenerator["default"].wrap(function _callee92$(_context92) {
          while (1) {
            switch (_context92.prev = _context92.next) {
              case 0:
                _context92.next = 2;
                return this._invokeWorker("daemonGetBlocksByRange", Array.from(_args92));

              case 2:
                blocksJson = _context92.sent;
                blocks = [];
                _iterator22 = _createForOfIteratorHelper(blocksJson);

                try {
                  for (_iterator22.s(); !(_step22 = _iterator22.n()).done;) {
                    blockJson = _step22.value;
                    blocks.push(new _MoneroBlock["default"](blockJson));
                  }
                } catch (err) {
                  _iterator22.e(err);
                } finally {
                  _iterator22.f();
                }

                return _context92.abrupt("return", blocks);

              case 7:
              case "end":
                return _context92.stop();
            }
          }
        }, _callee92, this);
      }));

      function getBlocksByRange(_x85, _x86) {
        return _getBlocksByRange2.apply(this, arguments);
      }

      return getBlocksByRange;
    }()
  }, {
    key: "getBlocksByRangeChunked",
    value: function () {
      var _getBlocksByRangeChunked2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee93(startHeight, endHeight, maxChunkSize) {
        var blocksJson,
            blocks,
            _iterator23,
            _step23,
            blockJson,
            _args93 = arguments;

        return _regenerator["default"].wrap(function _callee93$(_context93) {
          while (1) {
            switch (_context93.prev = _context93.next) {
              case 0:
                _context93.next = 2;
                return this._invokeWorker("daemonGetBlocksByRangeChunked", Array.from(_args93));

              case 2:
                blocksJson = _context93.sent;
                blocks = [];
                _iterator23 = _createForOfIteratorHelper(blocksJson);

                try {
                  for (_iterator23.s(); !(_step23 = _iterator23.n()).done;) {
                    blockJson = _step23.value;
                    blocks.push(new _MoneroBlock["default"](blockJson));
                  }
                } catch (err) {
                  _iterator23.e(err);
                } finally {
                  _iterator23.f();
                }

                return _context93.abrupt("return", blocks);

              case 7:
              case "end":
                return _context93.stop();
            }
          }
        }, _callee93, this);
      }));

      function getBlocksByRangeChunked(_x87, _x88, _x89) {
        return _getBlocksByRangeChunked2.apply(this, arguments);
      }

      return getBlocksByRangeChunked;
    }()
  }, {
    key: "getBlockHashes",
    value: function () {
      var _getBlockHashes = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee94(blockHashes, startHeight) {
        var _args94 = arguments;
        return _regenerator["default"].wrap(function _callee94$(_context94) {
          while (1) {
            switch (_context94.prev = _context94.next) {
              case 0:
                return _context94.abrupt("return", this._invokeWorker("daemonGetBlockHashes", Array.from(_args94)));

              case 1:
              case "end":
                return _context94.stop();
            }
          }
        }, _callee94, this);
      }));

      function getBlockHashes(_x90, _x91) {
        return _getBlockHashes.apply(this, arguments);
      }

      return getBlockHashes;
    }()
  }, {
    key: "getTxs",
    value: function () {
      var _getTxs2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee95(txHashes) {
        var prune,
            blocks,
            _iterator24,
            _step24,
            blockJson,
            txs,
            _i18,
            _blocks,
            block,
            _iterator25,
            _step25,
            tx,
            _args95 = arguments;

        return _regenerator["default"].wrap(function _callee95$(_context95) {
          while (1) {
            switch (_context95.prev = _context95.next) {
              case 0:
                prune = _args95.length > 1 && _args95[1] !== undefined ? _args95[1] : false;
                // deserialize txs from blocks
                blocks = [];
                _context95.t0 = _createForOfIteratorHelper;
                _context95.next = 5;
                return this._invokeWorker("daemonGetTxs", Array.from(_args95));

              case 5:
                _context95.t1 = _context95.sent;
                _iterator24 = (0, _context95.t0)(_context95.t1);

                try {
                  for (_iterator24.s(); !(_step24 = _iterator24.n()).done;) {
                    blockJson = _step24.value;
                    blocks.push(new _MoneroBlock["default"](blockJson));
                  } // collect txs

                } catch (err) {
                  _iterator24.e(err);
                } finally {
                  _iterator24.f();
                }

                txs = [];

                for (_i18 = 0, _blocks = blocks; _i18 < _blocks.length; _i18++) {
                  block = _blocks[_i18];
                  _iterator25 = _createForOfIteratorHelper(block.getTxs());

                  try {
                    for (_iterator25.s(); !(_step25 = _iterator25.n()).done;) {
                      tx = _step25.value;
                      if (!tx.isConfirmed()) tx.setBlock(undefined);
                      txs.push(tx);
                    }
                  } catch (err) {
                    _iterator25.e(err);
                  } finally {
                    _iterator25.f();
                  }
                }

                return _context95.abrupt("return", txs);

              case 11:
              case "end":
                return _context95.stop();
            }
          }
        }, _callee95, this);
      }));

      function getTxs(_x92) {
        return _getTxs2.apply(this, arguments);
      }

      return getTxs;
    }()
  }, {
    key: "getTxHexes",
    value: function () {
      var _getTxHexes2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee96(txHashes) {
        var prune,
            _args96 = arguments;
        return _regenerator["default"].wrap(function _callee96$(_context96) {
          while (1) {
            switch (_context96.prev = _context96.next) {
              case 0:
                prune = _args96.length > 1 && _args96[1] !== undefined ? _args96[1] : false;
                return _context96.abrupt("return", this._invokeWorker("daemonGetTxHexes", Array.from(_args96)));

              case 2:
              case "end":
                return _context96.stop();
            }
          }
        }, _callee96, this);
      }));

      function getTxHexes(_x93) {
        return _getTxHexes2.apply(this, arguments);
      }

      return getTxHexes;
    }()
  }, {
    key: "getMinerTxSum",
    value: function () {
      var _getMinerTxSum2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee97(height, numBlocks) {
        var _args97 = arguments;
        return _regenerator["default"].wrap(function _callee97$(_context97) {
          while (1) {
            switch (_context97.prev = _context97.next) {
              case 0:
                _context97.t0 = _MoneroMinerTxSum["default"];
                _context97.next = 3;
                return this._invokeWorker("daemonGetMinerTxSum", Array.from(_args97));

              case 3:
                _context97.t1 = _context97.sent;
                return _context97.abrupt("return", new _context97.t0(_context97.t1));

              case 5:
              case "end":
                return _context97.stop();
            }
          }
        }, _callee97, this);
      }));

      function getMinerTxSum(_x94, _x95) {
        return _getMinerTxSum2.apply(this, arguments);
      }

      return getMinerTxSum;
    }()
  }, {
    key: "getFeeEstimate",
    value: function () {
      var _getFeeEstimate2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee98(graceBlocks) {
        var _args98 = arguments;
        return _regenerator["default"].wrap(function _callee98$(_context98) {
          while (1) {
            switch (_context98.prev = _context98.next) {
              case 0:
                _context98.t0 = BigInt;
                _context98.next = 3;
                return this._invokeWorker("daemonGetFeeEstimate", Array.from(_args98));

              case 3:
                _context98.t1 = _context98.sent;
                return _context98.abrupt("return", (0, _context98.t0)(_context98.t1));

              case 5:
              case "end":
                return _context98.stop();
            }
          }
        }, _callee98, this);
      }));

      function getFeeEstimate(_x96) {
        return _getFeeEstimate2.apply(this, arguments);
      }

      return getFeeEstimate;
    }()
  }, {
    key: "submitTxHex",
    value: function () {
      var _submitTxHex2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee99(txHex, doNotRelay) {
        var _args99 = arguments;
        return _regenerator["default"].wrap(function _callee99$(_context99) {
          while (1) {
            switch (_context99.prev = _context99.next) {
              case 0:
                _context99.t0 = _MoneroSubmitTxResult["default"];
                _context99.next = 3;
                return this._invokeWorker("daemonSubmitTxHex", Array.from(_args99));

              case 3:
                _context99.t1 = _context99.sent;
                return _context99.abrupt("return", new _context99.t0(_context99.t1));

              case 5:
              case "end":
                return _context99.stop();
            }
          }
        }, _callee99, this);
      }));

      function submitTxHex(_x97, _x98) {
        return _submitTxHex2.apply(this, arguments);
      }

      return submitTxHex;
    }()
  }, {
    key: "relayTxsByHash",
    value: function () {
      var _relayTxsByHash2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee100(txHashes) {
        var _args100 = arguments;
        return _regenerator["default"].wrap(function _callee100$(_context100) {
          while (1) {
            switch (_context100.prev = _context100.next) {
              case 0:
                return _context100.abrupt("return", this._invokeWorker("daemonRelayTxsByHash", Array.from(_args100)));

              case 1:
              case "end":
                return _context100.stop();
            }
          }
        }, _callee100, this);
      }));

      function relayTxsByHash(_x99) {
        return _relayTxsByHash2.apply(this, arguments);
      }

      return relayTxsByHash;
    }()
  }, {
    key: "getTxPool",
    value: function () {
      var _getTxPool2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee101() {
        var blockJson, txs, _iterator26, _step26, tx;

        return _regenerator["default"].wrap(function _callee101$(_context101) {
          while (1) {
            switch (_context101.prev = _context101.next) {
              case 0:
                _context101.next = 2;
                return this._invokeWorker("daemonGetTxPool");

              case 2:
                blockJson = _context101.sent;
                txs = new _MoneroBlock["default"](blockJson).getTxs();
                _iterator26 = _createForOfIteratorHelper(txs);

                try {
                  for (_iterator26.s(); !(_step26 = _iterator26.n()).done;) {
                    tx = _step26.value;
                    tx.setBlock(undefined);
                  }
                } catch (err) {
                  _iterator26.e(err);
                } finally {
                  _iterator26.f();
                }

                return _context101.abrupt("return", txs ? txs : []);

              case 7:
              case "end":
                return _context101.stop();
            }
          }
        }, _callee101, this);
      }));

      function getTxPool() {
        return _getTxPool2.apply(this, arguments);
      }

      return getTxPool;
    }()
  }, {
    key: "getTxPoolHashes",
    value: function () {
      var _getTxPoolHashes2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee102() {
        var _args102 = arguments;
        return _regenerator["default"].wrap(function _callee102$(_context102) {
          while (1) {
            switch (_context102.prev = _context102.next) {
              case 0:
                return _context102.abrupt("return", this._invokeWorker("daemonGetTxPoolHashes", Array.from(_args102)));

              case 1:
              case "end":
                return _context102.stop();
            }
          }
        }, _callee102, this);
      }));

      function getTxPoolHashes() {
        return _getTxPoolHashes2.apply(this, arguments);
      }

      return getTxPoolHashes;
    }()
  }, {
    key: "getTxPoolBacklog",
    value: function () {
      var _getTxPoolBacklog2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee103() {
        return _regenerator["default"].wrap(function _callee103$(_context103) {
          while (1) {
            switch (_context103.prev = _context103.next) {
              case 0:
                throw new _MoneroError["default"]("Not implemented");

              case 1:
              case "end":
                return _context103.stop();
            }
          }
        }, _callee103);
      }));

      function getTxPoolBacklog() {
        return _getTxPoolBacklog2.apply(this, arguments);
      }

      return getTxPoolBacklog;
    }()
  }, {
    key: "getTxPoolStats",
    value: function () {
      var _getTxPoolStats2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee104() {
        return _regenerator["default"].wrap(function _callee104$(_context104) {
          while (1) {
            switch (_context104.prev = _context104.next) {
              case 0:
                _context104.t0 = _MoneroTxPoolStats["default"];
                _context104.next = 3;
                return this._invokeWorker("daemonGetTxPoolStats");

              case 3:
                _context104.t1 = _context104.sent;
                return _context104.abrupt("return", new _context104.t0(_context104.t1));

              case 5:
              case "end":
                return _context104.stop();
            }
          }
        }, _callee104, this);
      }));

      function getTxPoolStats() {
        return _getTxPoolStats2.apply(this, arguments);
      }

      return getTxPoolStats;
    }()
  }, {
    key: "flushTxPool",
    value: function () {
      var _flushTxPool2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee105(hashes) {
        var _args105 = arguments;
        return _regenerator["default"].wrap(function _callee105$(_context105) {
          while (1) {
            switch (_context105.prev = _context105.next) {
              case 0:
                return _context105.abrupt("return", this._invokeWorker("daemonFlushTxPool", Array.from(_args105)));

              case 1:
              case "end":
                return _context105.stop();
            }
          }
        }, _callee105, this);
      }));

      function flushTxPool(_x100) {
        return _flushTxPool2.apply(this, arguments);
      }

      return flushTxPool;
    }()
  }, {
    key: "getKeyImageSpentStatuses",
    value: function () {
      var _getKeyImageSpentStatuses2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee106(keyImages) {
        var _args106 = arguments;
        return _regenerator["default"].wrap(function _callee106$(_context106) {
          while (1) {
            switch (_context106.prev = _context106.next) {
              case 0:
                return _context106.abrupt("return", this._invokeWorker("daemonGetKeyImageSpentStatuses", Array.from(_args106)));

              case 1:
              case "end":
                return _context106.stop();
            }
          }
        }, _callee106, this);
      }));

      function getKeyImageSpentStatuses(_x101) {
        return _getKeyImageSpentStatuses2.apply(this, arguments);
      }

      return getKeyImageSpentStatuses;
    }()
  }, {
    key: "getOutputs",
    value: function () {
      var _getOutputs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee107(outputs) {
        return _regenerator["default"].wrap(function _callee107$(_context107) {
          while (1) {
            switch (_context107.prev = _context107.next) {
              case 0:
                throw new _MoneroError["default"]("Not implemented");

              case 1:
              case "end":
                return _context107.stop();
            }
          }
        }, _callee107);
      }));

      function getOutputs(_x102) {
        return _getOutputs.apply(this, arguments);
      }

      return getOutputs;
    }()
  }, {
    key: "getOutputHistogram",
    value: function () {
      var _getOutputHistogram2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee108(amounts, minCount, maxCount, isUnlocked, recentCutoff) {
        var entries, _iterator27, _step27, entryJson;

        return _regenerator["default"].wrap(function _callee108$(_context108) {
          while (1) {
            switch (_context108.prev = _context108.next) {
              case 0:
                entries = [];
                _context108.t0 = _createForOfIteratorHelper;
                _context108.next = 4;
                return this._invokeWorker("daemonGetOutputHistogram", [amounts, minCount, maxCount, isUnlocked, recentCutoff]);

              case 4:
                _context108.t1 = _context108.sent;
                _iterator27 = (0, _context108.t0)(_context108.t1);

                try {
                  for (_iterator27.s(); !(_step27 = _iterator27.n()).done;) {
                    entryJson = _step27.value;
                    entries.push(new _MoneroOutputHistogramEntry["default"](entryJson));
                  }
                } catch (err) {
                  _iterator27.e(err);
                } finally {
                  _iterator27.f();
                }

                return _context108.abrupt("return", entries);

              case 8:
              case "end":
                return _context108.stop();
            }
          }
        }, _callee108, this);
      }));

      function getOutputHistogram(_x103, _x104, _x105, _x106, _x107) {
        return _getOutputHistogram2.apply(this, arguments);
      }

      return getOutputHistogram;
    }()
  }, {
    key: "getOutputDistribution",
    value: function () {
      var _getOutputDistribution2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee109(amounts, cumulative, startHeight, endHeight) {
        return _regenerator["default"].wrap(function _callee109$(_context109) {
          while (1) {
            switch (_context109.prev = _context109.next) {
              case 0:
                throw new _MoneroError["default"]("Not implemented");

              case 1:
              case "end":
                return _context109.stop();
            }
          }
        }, _callee109);
      }));

      function getOutputDistribution(_x108, _x109, _x110, _x111) {
        return _getOutputDistribution2.apply(this, arguments);
      }

      return getOutputDistribution;
    }()
  }, {
    key: "getInfo",
    value: function () {
      var _getInfo2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee110() {
        return _regenerator["default"].wrap(function _callee110$(_context110) {
          while (1) {
            switch (_context110.prev = _context110.next) {
              case 0:
                _context110.t0 = _MoneroDaemonInfo["default"];
                _context110.next = 3;
                return this._invokeWorker("daemonGetInfo");

              case 3:
                _context110.t1 = _context110.sent;
                return _context110.abrupt("return", new _context110.t0(_context110.t1));

              case 5:
              case "end":
                return _context110.stop();
            }
          }
        }, _callee110, this);
      }));

      function getInfo() {
        return _getInfo2.apply(this, arguments);
      }

      return getInfo;
    }()
  }, {
    key: "getSyncInfo",
    value: function () {
      var _getSyncInfo2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee111() {
        return _regenerator["default"].wrap(function _callee111$(_context111) {
          while (1) {
            switch (_context111.prev = _context111.next) {
              case 0:
                _context111.t0 = _MoneroDaemonSyncInfo["default"];
                _context111.next = 3;
                return this._invokeWorker("daemonGetSyncInfo");

              case 3:
                _context111.t1 = _context111.sent;
                return _context111.abrupt("return", new _context111.t0(_context111.t1));

              case 5:
              case "end":
                return _context111.stop();
            }
          }
        }, _callee111, this);
      }));

      function getSyncInfo() {
        return _getSyncInfo2.apply(this, arguments);
      }

      return getSyncInfo;
    }()
  }, {
    key: "getHardForkInfo",
    value: function () {
      var _getHardForkInfo2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee112() {
        return _regenerator["default"].wrap(function _callee112$(_context112) {
          while (1) {
            switch (_context112.prev = _context112.next) {
              case 0:
                _context112.t0 = _MoneroHardForkInfo["default"];
                _context112.next = 3;
                return this._invokeWorker("daemonGetHardForkInfo");

              case 3:
                _context112.t1 = _context112.sent;
                return _context112.abrupt("return", new _context112.t0(_context112.t1));

              case 5:
              case "end":
                return _context112.stop();
            }
          }
        }, _callee112, this);
      }));

      function getHardForkInfo() {
        return _getHardForkInfo2.apply(this, arguments);
      }

      return getHardForkInfo;
    }()
  }, {
    key: "getAltChains",
    value: function () {
      var _getAltChains2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee113() {
        var altChains, _iterator28, _step28, altChainJson;

        return _regenerator["default"].wrap(function _callee113$(_context113) {
          while (1) {
            switch (_context113.prev = _context113.next) {
              case 0:
                altChains = [];
                _context113.t0 = _createForOfIteratorHelper;
                _context113.next = 4;
                return this._invokeWorker("daemonGetAltChains");

              case 4:
                _context113.t1 = _context113.sent;
                _iterator28 = (0, _context113.t0)(_context113.t1);

                try {
                  for (_iterator28.s(); !(_step28 = _iterator28.n()).done;) {
                    altChainJson = _step28.value;
                    altChains.push(new _MoneroAltChain["default"](altChainJson));
                  }
                } catch (err) {
                  _iterator28.e(err);
                } finally {
                  _iterator28.f();
                }

                return _context113.abrupt("return", altChains);

              case 8:
              case "end":
                return _context113.stop();
            }
          }
        }, _callee113, this);
      }));

      function getAltChains() {
        return _getAltChains2.apply(this, arguments);
      }

      return getAltChains;
    }()
  }, {
    key: "getAltBlockHashes",
    value: function () {
      var _getAltBlockHashes2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee114() {
        return _regenerator["default"].wrap(function _callee114$(_context114) {
          while (1) {
            switch (_context114.prev = _context114.next) {
              case 0:
                return _context114.abrupt("return", this._invokeWorker("daemonGetAltBlockHashes"));

              case 1:
              case "end":
                return _context114.stop();
            }
          }
        }, _callee114, this);
      }));

      function getAltBlockHashes() {
        return _getAltBlockHashes2.apply(this, arguments);
      }

      return getAltBlockHashes;
    }()
  }, {
    key: "getDownloadLimit",
    value: function () {
      var _getDownloadLimit2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee115() {
        return _regenerator["default"].wrap(function _callee115$(_context115) {
          while (1) {
            switch (_context115.prev = _context115.next) {
              case 0:
                return _context115.abrupt("return", this._invokeWorker("daemonGetDownloadLimit"));

              case 1:
              case "end":
                return _context115.stop();
            }
          }
        }, _callee115, this);
      }));

      function getDownloadLimit() {
        return _getDownloadLimit2.apply(this, arguments);
      }

      return getDownloadLimit;
    }()
  }, {
    key: "setDownloadLimit",
    value: function () {
      var _setDownloadLimit2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee116(limit) {
        var _args116 = arguments;
        return _regenerator["default"].wrap(function _callee116$(_context116) {
          while (1) {
            switch (_context116.prev = _context116.next) {
              case 0:
                return _context116.abrupt("return", this._invokeWorker("daemonSetDownloadLimit", Array.from(_args116)));

              case 1:
              case "end":
                return _context116.stop();
            }
          }
        }, _callee116, this);
      }));

      function setDownloadLimit(_x112) {
        return _setDownloadLimit2.apply(this, arguments);
      }

      return setDownloadLimit;
    }()
  }, {
    key: "resetDownloadLimit",
    value: function () {
      var _resetDownloadLimit2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee117() {
        return _regenerator["default"].wrap(function _callee117$(_context117) {
          while (1) {
            switch (_context117.prev = _context117.next) {
              case 0:
                return _context117.abrupt("return", this._invokeWorker("daemonResetDownloadLimit"));

              case 1:
              case "end":
                return _context117.stop();
            }
          }
        }, _callee117, this);
      }));

      function resetDownloadLimit() {
        return _resetDownloadLimit2.apply(this, arguments);
      }

      return resetDownloadLimit;
    }()
  }, {
    key: "getUploadLimit",
    value: function () {
      var _getUploadLimit2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee118() {
        return _regenerator["default"].wrap(function _callee118$(_context118) {
          while (1) {
            switch (_context118.prev = _context118.next) {
              case 0:
                return _context118.abrupt("return", this._invokeWorker("daemonGetUploadLimit"));

              case 1:
              case "end":
                return _context118.stop();
            }
          }
        }, _callee118, this);
      }));

      function getUploadLimit() {
        return _getUploadLimit2.apply(this, arguments);
      }

      return getUploadLimit;
    }()
  }, {
    key: "setUploadLimit",
    value: function () {
      var _setUploadLimit2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee119(limit) {
        var _args119 = arguments;
        return _regenerator["default"].wrap(function _callee119$(_context119) {
          while (1) {
            switch (_context119.prev = _context119.next) {
              case 0:
                return _context119.abrupt("return", this._invokeWorker("daemonSetUploadLimit", Array.from(_args119)));

              case 1:
              case "end":
                return _context119.stop();
            }
          }
        }, _callee119, this);
      }));

      function setUploadLimit(_x113) {
        return _setUploadLimit2.apply(this, arguments);
      }

      return setUploadLimit;
    }()
  }, {
    key: "resetUploadLimit",
    value: function () {
      var _resetUploadLimit2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee120() {
        return _regenerator["default"].wrap(function _callee120$(_context120) {
          while (1) {
            switch (_context120.prev = _context120.next) {
              case 0:
                return _context120.abrupt("return", this._invokeWorker("daemonResetUploadLimit"));

              case 1:
              case "end":
                return _context120.stop();
            }
          }
        }, _callee120, this);
      }));

      function resetUploadLimit() {
        return _resetUploadLimit2.apply(this, arguments);
      }

      return resetUploadLimit;
    }()
  }, {
    key: "getPeers",
    value: function () {
      var _getPeers2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee121() {
        var peers, _iterator29, _step29, peerJson;

        return _regenerator["default"].wrap(function _callee121$(_context121) {
          while (1) {
            switch (_context121.prev = _context121.next) {
              case 0:
                peers = [];
                _context121.t0 = _createForOfIteratorHelper;
                _context121.next = 4;
                return this._invokeWorker("daemonGetPeers");

              case 4:
                _context121.t1 = _context121.sent;
                _iterator29 = (0, _context121.t0)(_context121.t1);

                try {
                  for (_iterator29.s(); !(_step29 = _iterator29.n()).done;) {
                    peerJson = _step29.value;
                    peers.push(new _MoneroPeer["default"](peerJson));
                  }
                } catch (err) {
                  _iterator29.e(err);
                } finally {
                  _iterator29.f();
                }

                return _context121.abrupt("return", peers);

              case 8:
              case "end":
                return _context121.stop();
            }
          }
        }, _callee121, this);
      }));

      function getPeers() {
        return _getPeers2.apply(this, arguments);
      }

      return getPeers;
    }()
  }, {
    key: "getKnownPeers",
    value: function () {
      var _getKnownPeers2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee122() {
        var peers, _iterator30, _step30, peerJson;

        return _regenerator["default"].wrap(function _callee122$(_context122) {
          while (1) {
            switch (_context122.prev = _context122.next) {
              case 0:
                peers = [];
                _context122.t0 = _createForOfIteratorHelper;
                _context122.next = 4;
                return this._invokeWorker("daemonGetKnownPeers");

              case 4:
                _context122.t1 = _context122.sent;
                _iterator30 = (0, _context122.t0)(_context122.t1);

                try {
                  for (_iterator30.s(); !(_step30 = _iterator30.n()).done;) {
                    peerJson = _step30.value;
                    peers.push(new _MoneroPeer["default"](peerJson));
                  }
                } catch (err) {
                  _iterator30.e(err);
                } finally {
                  _iterator30.f();
                }

                return _context122.abrupt("return", peers);

              case 8:
              case "end":
                return _context122.stop();
            }
          }
        }, _callee122, this);
      }));

      function getKnownPeers() {
        return _getKnownPeers2.apply(this, arguments);
      }

      return getKnownPeers;
    }()
  }, {
    key: "setOutgoingPeerLimit",
    value: function () {
      var _setOutgoingPeerLimit2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee123(limit) {
        var _args123 = arguments;
        return _regenerator["default"].wrap(function _callee123$(_context123) {
          while (1) {
            switch (_context123.prev = _context123.next) {
              case 0:
                return _context123.abrupt("return", this._invokeWorker("daemonSetIncomingPeerLimit", Array.from(_args123)));

              case 1:
              case "end":
                return _context123.stop();
            }
          }
        }, _callee123, this);
      }));

      function setOutgoingPeerLimit(_x114) {
        return _setOutgoingPeerLimit2.apply(this, arguments);
      }

      return setOutgoingPeerLimit;
    }()
  }, {
    key: "setIncomingPeerLimit",
    value: function () {
      var _setIncomingPeerLimit2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee124(limit) {
        var _args124 = arguments;
        return _regenerator["default"].wrap(function _callee124$(_context124) {
          while (1) {
            switch (_context124.prev = _context124.next) {
              case 0:
                return _context124.abrupt("return", this._invokeWorker("daemonSetIncomingPeerLimit", Array.from(_args124)));

              case 1:
              case "end":
                return _context124.stop();
            }
          }
        }, _callee124, this);
      }));

      function setIncomingPeerLimit(_x115) {
        return _setIncomingPeerLimit2.apply(this, arguments);
      }

      return setIncomingPeerLimit;
    }()
  }, {
    key: "getPeerBans",
    value: function () {
      var _getPeerBans2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee125() {
        var bans, _iterator31, _step31, banJson;

        return _regenerator["default"].wrap(function _callee125$(_context125) {
          while (1) {
            switch (_context125.prev = _context125.next) {
              case 0:
                bans = [];
                _context125.t0 = _createForOfIteratorHelper;
                _context125.next = 4;
                return this._invokeWorker("daemonGetPeerBans");

              case 4:
                _context125.t1 = _context125.sent;
                _iterator31 = (0, _context125.t0)(_context125.t1);

                try {
                  for (_iterator31.s(); !(_step31 = _iterator31.n()).done;) {
                    banJson = _step31.value;
                    bans.push(new _MoneroBan["default"](banJson));
                  }
                } catch (err) {
                  _iterator31.e(err);
                } finally {
                  _iterator31.f();
                }

                return _context125.abrupt("return", bans);

              case 8:
              case "end":
                return _context125.stop();
            }
          }
        }, _callee125, this);
      }));

      function getPeerBans() {
        return _getPeerBans2.apply(this, arguments);
      }

      return getPeerBans;
    }()
  }, {
    key: "setPeerBans",
    value: function () {
      var _setPeerBans2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee126(bans) {
        var bansJson, _iterator32, _step32, ban;

        return _regenerator["default"].wrap(function _callee126$(_context126) {
          while (1) {
            switch (_context126.prev = _context126.next) {
              case 0:
                bansJson = [];
                _iterator32 = _createForOfIteratorHelper(bans);

                try {
                  for (_iterator32.s(); !(_step32 = _iterator32.n()).done;) {
                    ban = _step32.value;
                    bansJson.push(ban.toJson());
                  }
                } catch (err) {
                  _iterator32.e(err);
                } finally {
                  _iterator32.f();
                }

                return _context126.abrupt("return", this._invokeWorker("daemonSetPeerBans", [bansJson]));

              case 4:
              case "end":
                return _context126.stop();
            }
          }
        }, _callee126, this);
      }));

      function setPeerBans(_x116) {
        return _setPeerBans2.apply(this, arguments);
      }

      return setPeerBans;
    }()
  }, {
    key: "startMining",
    value: function () {
      var _startMining2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee127(address, numThreads, isBackground, ignoreBattery) {
        var _args127 = arguments;
        return _regenerator["default"].wrap(function _callee127$(_context127) {
          while (1) {
            switch (_context127.prev = _context127.next) {
              case 0:
                return _context127.abrupt("return", this._invokeWorker("daemonStartMining", Array.from(_args127)));

              case 1:
              case "end":
                return _context127.stop();
            }
          }
        }, _callee127, this);
      }));

      function startMining(_x117, _x118, _x119, _x120) {
        return _startMining2.apply(this, arguments);
      }

      return startMining;
    }()
  }, {
    key: "stopMining",
    value: function () {
      var _stopMining2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee128() {
        return _regenerator["default"].wrap(function _callee128$(_context128) {
          while (1) {
            switch (_context128.prev = _context128.next) {
              case 0:
                _context128.next = 2;
                return this._invokeWorker("daemonStopMining");

              case 2:
              case "end":
                return _context128.stop();
            }
          }
        }, _callee128, this);
      }));

      function stopMining() {
        return _stopMining2.apply(this, arguments);
      }

      return stopMining;
    }()
  }, {
    key: "getMiningStatus",
    value: function () {
      var _getMiningStatus2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee129() {
        return _regenerator["default"].wrap(function _callee129$(_context129) {
          while (1) {
            switch (_context129.prev = _context129.next) {
              case 0:
                _context129.t0 = _MoneroMiningStatus["default"];
                _context129.next = 3;
                return this._invokeWorker("daemonGetMiningStatus");

              case 3:
                _context129.t1 = _context129.sent;
                return _context129.abrupt("return", new _context129.t0(_context129.t1));

              case 5:
              case "end":
                return _context129.stop();
            }
          }
        }, _callee129, this);
      }));

      function getMiningStatus() {
        return _getMiningStatus2.apply(this, arguments);
      }

      return getMiningStatus;
    }()
  }, {
    key: "submitBlocks",
    value: function () {
      var _submitBlocks2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee130(blockBlobs) {
        return _regenerator["default"].wrap(function _callee130$(_context130) {
          while (1) {
            switch (_context130.prev = _context130.next) {
              case 0:
                throw new _MoneroError["default"]("Not implemented");

              case 1:
              case "end":
                return _context130.stop();
            }
          }
        }, _callee130);
      }));

      function submitBlocks(_x121) {
        return _submitBlocks2.apply(this, arguments);
      }

      return submitBlocks;
    }()
  }, {
    key: "checkForUpdate",
    value: function () {
      var _checkForUpdate2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee131() {
        return _regenerator["default"].wrap(function _callee131$(_context131) {
          while (1) {
            switch (_context131.prev = _context131.next) {
              case 0:
                throw new _MoneroError["default"]("Not implemented");

              case 1:
              case "end":
                return _context131.stop();
            }
          }
        }, _callee131);
      }));

      function checkForUpdate() {
        return _checkForUpdate2.apply(this, arguments);
      }

      return checkForUpdate;
    }()
  }, {
    key: "downloadUpdate",
    value: function () {
      var _downloadUpdate2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee132(path) {
        return _regenerator["default"].wrap(function _callee132$(_context132) {
          while (1) {
            switch (_context132.prev = _context132.next) {
              case 0:
                throw new _MoneroError["default"]("Not implemented");

              case 1:
              case "end":
                return _context132.stop();
            }
          }
        }, _callee132);
      }));

      function downloadUpdate(_x122) {
        return _downloadUpdate2.apply(this, arguments);
      }

      return downloadUpdate;
    }()
  }, {
    key: "stop",
    value: function () {
      var _stop2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee133() {
        return _regenerator["default"].wrap(function _callee133$(_context133) {
          while (1) {
            switch (_context133.prev = _context133.next) {
              case 0:
                if (!this.wrappedListeners.length) {
                  _context133.next = 5;
                  break;
                }

                _context133.next = 3;
                return this.removeBlockListener(this.wrappedListeners[0].getListener());

              case 3:
                _context133.next = 0;
                break;

              case 5:
                return _context133.abrupt("return", this._invokeWorker("daemonStop"));

              case 6:
              case "end":
                return _context133.stop();
            }
          }
        }, _callee133, this);
      }));

      function stop() {
        return _stop2.apply(this, arguments);
      }

      return stop;
    }()
  }, {
    key: "waitForNextBlockHeader",
    value: function () {
      var _waitForNextBlockHeader2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee134() {
        return _regenerator["default"].wrap(function _callee134$(_context134) {
          while (1) {
            switch (_context134.prev = _context134.next) {
              case 0:
                _context134.t0 = _MoneroBlockHeader["default"];
                _context134.next = 3;
                return this._invokeWorker("daemonWaitForNextBlockHeader");

              case 3:
                _context134.t1 = _context134.sent;
                return _context134.abrupt("return", new _context134.t0(_context134.t1));

              case 5:
              case "end":
                return _context134.stop();
            }
          }
        }, _callee134, this);
      }));

      function waitForNextBlockHeader() {
        return _waitForNextBlockHeader2.apply(this, arguments);
      }

      return waitForNextBlockHeader;
    }() // --------------------------- PRIVATE HELPERS ------------------------------
    // TODO: duplicated with MoneroWalletFullProxy

  }, {
    key: "_invokeWorker",
    value: function () {
      var _invokeWorker2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee135(fnName, args) {
        return _regenerator["default"].wrap(function _callee135$(_context135) {
          while (1) {
            switch (_context135.prev = _context135.next) {
              case 0:
                return _context135.abrupt("return", _LibraryUtils["default"].invokeWorker(this.daemonId, fnName, args));

              case 1:
              case "end":
                return _context135.stop();
            }
          }
        }, _callee135, this);
      }));

      function _invokeWorker(_x123, _x124) {
        return _invokeWorker2.apply(this, arguments);
      }

      return _invokeWorker;
    }()
  }], [{
    key: "connect",
    value: // --------------------------- STATIC UTILITIES -----------------------------
    function () {
      var _connect = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee136(config) {
        var daemonId;
        return _regenerator["default"].wrap(function _callee136$(_context136) {
          while (1) {
            switch (_context136.prev = _context136.next) {
              case 0:
                daemonId = _GenUtils["default"].getUUID();
                config = Object.assign({}, config, {
                  proxyToWorker: false
                });
                _context136.next = 4;
                return _LibraryUtils["default"].invokeWorker(daemonId, "connectDaemonRpc", [config]);

              case 4:
                _context136.t0 = MoneroDaemonRpcProxy;
                _context136.t1 = daemonId;
                _context136.next = 8;
                return _LibraryUtils["default"].getWorker();

              case 8:
                _context136.t2 = _context136.sent;
                return _context136.abrupt("return", new _context136.t0(_context136.t1, _context136.t2));

              case 10:
              case "end":
                return _context136.stop();
            }
          }
        }, _callee136);
      }));

      function connect(_x125) {
        return _connect.apply(this, arguments);
      }

      return connect;
    }()
  }]);
  return MoneroDaemonRpcProxy;
}(_MoneroDaemon3["default"]);
/**
 * Polls a Monero daemon for updates and notifies listeners as they occur.
 * 
 * @class
 * @ignore
 */


var DaemonPoller = /*#__PURE__*/function () {
  function DaemonPoller(daemon) {
    (0, _classCallCheck2["default"])(this, DaemonPoller);
    var that = this;
    this._daemon = daemon;
    this._looper = new _TaskLooper["default"]( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee137() {
      return _regenerator["default"].wrap(function _callee137$(_context137) {
        while (1) {
          switch (_context137.prev = _context137.next) {
            case 0:
              _context137.next = 2;
              return that.poll();

            case 2:
            case "end":
              return _context137.stop();
          }
        }
      }, _callee137);
    })));
  }

  (0, _createClass2["default"])(DaemonPoller, [{
    key: "setIsPolling",
    value: function setIsPolling(isPolling) {
      this._isPolling = isPolling;
      if (isPolling) this._looper.start(this._daemon.config.pollInterval);else this._looper.stop();
    }
  }, {
    key: "poll",
    value: function () {
      var _poll = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee138() {
        var header, _iterator33, _step33, listener;

        return _regenerator["default"].wrap(function _callee138$(_context138) {
          while (1) {
            switch (_context138.prev = _context138.next) {
              case 0:
                _context138.prev = 0;
                _context138.next = 3;
                return this._daemon.getLastBlockHeader();

              case 3:
                header = _context138.sent;

                if (this._lastHeader) {
                  _context138.next = 9;
                  break;
                }

                _context138.next = 7;
                return this._daemon.getLastBlockHeader();

              case 7:
                this._lastHeader = _context138.sent;
                return _context138.abrupt("return");

              case 9:
                if (!(header.getHash() !== this._lastHeader.getHash())) {
                  _context138.next = 28;
                  break;
                }

                this._lastHeader = header;
                _iterator33 = _createForOfIteratorHelper(this._daemon.getListeners());
                _context138.prev = 12;

                _iterator33.s();

              case 14:
                if ((_step33 = _iterator33.n()).done) {
                  _context138.next = 20;
                  break;
                }

                listener = _step33.value;
                _context138.next = 18;
                return listener.onBlockHeader(header);

              case 18:
                _context138.next = 14;
                break;

              case 20:
                _context138.next = 25;
                break;

              case 22:
                _context138.prev = 22;
                _context138.t0 = _context138["catch"](12);

                _iterator33.e(_context138.t0);

              case 25:
                _context138.prev = 25;

                _iterator33.f();

                return _context138.finish(25);

              case 28:
                _context138.next = 34;
                break;

              case 30:
                _context138.prev = 30;
                _context138.t1 = _context138["catch"](0);
                console.error("Failed to background poll daemon header");
                console.error(_context138.t1);

              case 34:
              case "end":
                return _context138.stop();
            }
          }
        }, _callee138, this, [[0, 30], [12, 22, 25, 28]]);
      }));

      function poll() {
        return _poll.apply(this, arguments);
      }

      return poll;
    }()
  }]);
  return DaemonPoller;
}();
/**
 * Internal listener to bridge notifications to external listeners.
 * 
 * @private
 */


var DaemonWorkerListener = /*#__PURE__*/function () {
  function DaemonWorkerListener(listener) {
    (0, _classCallCheck2["default"])(this, DaemonWorkerListener);
    this._id = _GenUtils["default"].getUUID();
    this._listener = listener;
  }

  (0, _createClass2["default"])(DaemonWorkerListener, [{
    key: "getId",
    value: function getId() {
      return this._id;
    }
  }, {
    key: "getListener",
    value: function getListener() {
      return this._listener;
    }
  }, {
    key: "onBlockHeader",
    value: function () {
      var _onBlockHeader2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee139(headerJson) {
        return _regenerator["default"].wrap(function _callee139$(_context139) {
          while (1) {
            switch (_context139.prev = _context139.next) {
              case 0:
                return _context139.abrupt("return", this._listener.onBlockHeader(new _MoneroBlockHeader["default"](headerJson)));

              case 1:
              case "end":
                return _context139.stop();
            }
          }
        }, _callee139, this);
      }));

      function onBlockHeader(_x126) {
        return _onBlockHeader2.apply(this, arguments);
      }

      return onBlockHeader;
    }()
  }]);
  return DaemonWorkerListener;
}();

var _default = MoneroDaemonRpc;
exports["default"] = _default;