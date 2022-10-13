"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));

var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));

var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _assert = _interopRequireDefault(require("assert"));

var _GenUtils = _interopRequireDefault(require("./GenUtils"));

var _HttpClient = _interopRequireDefault(require("./HttpClient"));

var _LibraryUtils = _interopRequireDefault(require("./LibraryUtils"));

var _MoneroBan = _interopRequireDefault(require("../daemon/model/MoneroBan"));

var _MoneroBlock = _interopRequireDefault(require("../daemon/model/MoneroBlock"));

var _MoneroDaemonListener2 = _interopRequireDefault(require("../daemon/model/MoneroDaemonListener"));

var _MoneroDaemonRpc = _interopRequireDefault(require("../daemon/MoneroDaemonRpc"));

var _MoneroError = _interopRequireDefault(require("./MoneroError"));

var _MoneroKeyImage = _interopRequireDefault(require("../daemon/model/MoneroKeyImage"));

var _MoneroRpcConnection = _interopRequireDefault(require("./MoneroRpcConnection"));

var _MoneroTxConfig = _interopRequireDefault(require("../wallet/model/MoneroTxConfig"));

var _MoneroTxSet = _interopRequireDefault(require("../wallet/model/MoneroTxSet"));

var _MoneroUtils = _interopRequireDefault(require("../common/MoneroUtils"));

var _MoneroWalletConfig = _interopRequireDefault(require("../wallet/model/MoneroWalletConfig"));

var _MoneroWalletListener2 = _interopRequireDefault(require("../wallet/model/MoneroWalletListener"));

var _MoneroWalletFull = _interopRequireDefault(require("../wallet/MoneroWalletFull"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

/**
 * Worker to manage a daemon and wasm wallet off the main thread using messages.
 * 
 * Required message format: e.data[0] = object id, e.data[1] = function name, e.data[2+] = function args
 *
 * For browser applications, this file must be browserified and placed in the web app root.
 * 
 * @private
 */
self.onmessage = /*#__PURE__*/function () {
  var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(e) {
    var objectId, fnName, callbackId;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return self.initOneTime();

          case 2:
            // validate params
            objectId = e.data[0];
            fnName = e.data[1];
            callbackId = e.data[2];
            (0, _assert["default"])(fnName, "Must provide function name to worker");
            (0, _assert["default"])(callbackId, "Must provide callback id to worker");

            if (self[fnName]) {
              _context.next = 9;
              break;
            }

            throw new Error("Method '" + fnName + "' is not registered with worker");

          case 9:
            e.data.splice(1, 2); // remove function name and callback id to apply function with arguments
            // execute worker function and post result to callback

            _context.prev = 10;
            _context.t0 = postMessage;
            _context.t1 = objectId;
            _context.t2 = callbackId;
            _context.next = 16;
            return self[fnName].apply(null, e.data);

          case 16:
            _context.t3 = _context.sent;
            _context.t4 = {
              result: _context.t3
            };
            _context.t5 = [_context.t1, _context.t2, _context.t4];
            (0, _context.t0)(_context.t5);
            _context.next = 25;
            break;

          case 22:
            _context.prev = 22;
            _context.t6 = _context["catch"](10);
            postMessage([objectId, callbackId, {
              error: _context.t6.message
            }]);

          case 25:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[10, 22]]);
  }));

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}();

self.initOneTime = /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
  return _regenerator["default"].wrap(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          if (!self.isInitialized) {
            self.WORKER_OBJECTS = {};
            self.isInitialized = true;
            _MoneroUtils["default"].PROXY_TO_WORKER = false;
          }

        case 1:
        case "end":
          return _context2.stop();
      }
    }
  }, _callee2);
})); // --------------------------- STATIC UTILITIES -------------------------------
// TODO: object id not needed for static utilites, using throwaway uuid

self.httpRequest = /*#__PURE__*/function () {
  var _ref3 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(objectId, opts) {
    return _regenerator["default"].wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            _context3.next = 3;
            return _HttpClient["default"].request(Object.assign(opts, {
              proxyToWorker: false
            }));

          case 3:
            return _context3.abrupt("return", _context3.sent);

          case 6:
            _context3.prev = 6;
            _context3.t0 = _context3["catch"](0);
            throw _context3.t0.statusCode ? new Error(JSON.stringify({
              statusCode: _context3.t0.statusCode,
              statusMessage: _context3.t0.message
            })) : _context3.t0;

          case 9:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[0, 6]]);
  }));

  return function (_x2, _x3) {
    return _ref3.apply(this, arguments);
  };
}();

self.setLogLevel = /*#__PURE__*/function () {
  var _ref4 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4(objectId, level) {
    return _regenerator["default"].wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            return _context4.abrupt("return", _LibraryUtils["default"].setLogLevel(level));

          case 1:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));

  return function (_x4, _x5) {
    return _ref4.apply(this, arguments);
  };
}();

self.getWasmMemoryUsed = /*#__PURE__*/function () {
  var _ref5 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(objectId) {
    return _regenerator["default"].wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            return _context5.abrupt("return", _LibraryUtils["default"].getWasmModule() && _LibraryUtils["default"].getWasmModule().HEAP8 ? _LibraryUtils["default"].getWasmModule().HEAP8.length : undefined);

          case 1:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));

  return function (_x6) {
    return _ref5.apply(this, arguments);
  };
}(); // ----------------------------- MONERO UTILS ---------------------------------


self.moneroUtilsGetIntegratedAddress = /*#__PURE__*/function () {
  var _ref6 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(objectId, networkType, standardAddress, paymentId) {
    return _regenerator["default"].wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return _MoneroUtils["default"].getIntegratedAddress(networkType, standardAddress, paymentId);

          case 2:
            return _context6.abrupt("return", _context6.sent.toJson());

          case 3:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  }));

  return function (_x7, _x8, _x9, _x10) {
    return _ref6.apply(this, arguments);
  };
}();

self.moneroUtilsValidateAddress = /*#__PURE__*/function () {
  var _ref7 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(objectId, address, networkType) {
    return _regenerator["default"].wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            return _context7.abrupt("return", _MoneroUtils["default"].validateAddress(address, networkType));

          case 1:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7);
  }));

  return function (_x11, _x12, _x13) {
    return _ref7.apply(this, arguments);
  };
}();

self.moneroUtilsJsonToBinary = /*#__PURE__*/function () {
  var _ref8 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8(objectId, json) {
    return _regenerator["default"].wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            return _context8.abrupt("return", _MoneroUtils["default"].jsonToBinary(json));

          case 1:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8);
  }));

  return function (_x14, _x15) {
    return _ref8.apply(this, arguments);
  };
}();

self.moneroUtilsBinaryToJson = /*#__PURE__*/function () {
  var _ref9 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9(objectId, uint8arr) {
    return _regenerator["default"].wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            return _context9.abrupt("return", _MoneroUtils["default"].binaryToJson(uint8arr));

          case 1:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9);
  }));

  return function (_x16, _x17) {
    return _ref9.apply(this, arguments);
  };
}();

self.moneroUtilsBinaryBlocksToJson = /*#__PURE__*/function () {
  var _ref10 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10(objectId, uint8arr) {
    return _regenerator["default"].wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            return _context10.abrupt("return", _MoneroUtils["default"].binaryBlocksToJson(uint8arr));

          case 1:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee10);
  }));

  return function (_x18, _x19) {
    return _ref10.apply(this, arguments);
  };
}(); // ---------------------------- DAEMON METHODS --------------------------------


self.daemonAddListener = /*#__PURE__*/function () {
  var _ref11 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee12(daemonId, listenerId) {
    var listener;
    return _regenerator["default"].wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            listener = new ( /*#__PURE__*/function (_MoneroDaemonListener) {
              (0, _inherits2["default"])(_class, _MoneroDaemonListener);

              var _super = _createSuper(_class);

              function _class() {
                (0, _classCallCheck2["default"])(this, _class);
                return _super.apply(this, arguments);
              }

              (0, _createClass2["default"])(_class, [{
                key: "onBlockHeader",
                value: function () {
                  var _onBlockHeader = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11(blockHeader) {
                    return _regenerator["default"].wrap(function _callee11$(_context11) {
                      while (1) {
                        switch (_context11.prev = _context11.next) {
                          case 0:
                            self.postMessage([daemonId, "onBlockHeader_" + listenerId, blockHeader.toJson()]);

                          case 1:
                          case "end":
                            return _context11.stop();
                        }
                      }
                    }, _callee11);
                  }));

                  function onBlockHeader(_x22) {
                    return _onBlockHeader.apply(this, arguments);
                  }

                  return onBlockHeader;
                }()
              }]);
              return _class;
            }(_MoneroDaemonListener2["default"]))();
            if (!self.daemonListeners) self.daemonListeners = {};
            self.daemonListeners[listenerId] = listener;
            _context12.next = 5;
            return self.WORKER_OBJECTS[daemonId].addListener(listener);

          case 5:
          case "end":
            return _context12.stop();
        }
      }
    }, _callee12);
  }));

  return function (_x20, _x21) {
    return _ref11.apply(this, arguments);
  };
}();

self.daemonRemoveListener = /*#__PURE__*/function () {
  var _ref12 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee13(daemonId, listenerId) {
    return _regenerator["default"].wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            if (self.daemonListeners[listenerId]) {
              _context13.next = 2;
              break;
            }

            throw new _MoneroError["default"]("No daemon worker listener registered with id: " + listenerId);

          case 2:
            _context13.next = 4;
            return self.WORKER_OBJECTS[daemonId].removeListener(self.daemonListeners[listenerId]);

          case 4:
            delete self.daemonListeners[listenerId];

          case 5:
          case "end":
            return _context13.stop();
        }
      }
    }, _callee13);
  }));

  return function (_x23, _x24) {
    return _ref12.apply(this, arguments);
  };
}();

self.connectDaemonRpc = /*#__PURE__*/function () {
  var _ref13 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee14(daemonId, config) {
    return _regenerator["default"].wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            self.WORKER_OBJECTS[daemonId] = new _MoneroDaemonRpc["default"](config);

          case 1:
          case "end":
            return _context14.stop();
        }
      }
    }, _callee14);
  }));

  return function (_x25, _x26) {
    return _ref13.apply(this, arguments);
  };
}();

self.daemonGetRpcConnection = /*#__PURE__*/function () {
  var _ref14 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee15(daemonId) {
    var connection;
    return _regenerator["default"].wrap(function _callee15$(_context15) {
      while (1) {
        switch (_context15.prev = _context15.next) {
          case 0:
            _context15.next = 2;
            return self.WORKER_OBJECTS[daemonId].getRpcConnection();

          case 2:
            connection = _context15.sent;
            return _context15.abrupt("return", connection ? connection.getConfig() : undefined);

          case 4:
          case "end":
            return _context15.stop();
        }
      }
    }, _callee15);
  }));

  return function (_x27) {
    return _ref14.apply(this, arguments);
  };
}();

self.daemonIsConnected = /*#__PURE__*/function () {
  var _ref15 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee16(daemonId) {
    return _regenerator["default"].wrap(function _callee16$(_context16) {
      while (1) {
        switch (_context16.prev = _context16.next) {
          case 0:
            return _context16.abrupt("return", self.WORKER_OBJECTS[daemonId].isConnected());

          case 1:
          case "end":
            return _context16.stop();
        }
      }
    }, _callee16);
  }));

  return function (_x28) {
    return _ref15.apply(this, arguments);
  };
}();

self.daemonGetVersion = /*#__PURE__*/function () {
  var _ref16 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee17(daemonId) {
    return _regenerator["default"].wrap(function _callee17$(_context17) {
      while (1) {
        switch (_context17.prev = _context17.next) {
          case 0:
            _context17.next = 2;
            return self.WORKER_OBJECTS[daemonId].getVersion();

          case 2:
            return _context17.abrupt("return", _context17.sent.toJson());

          case 3:
          case "end":
            return _context17.stop();
        }
      }
    }, _callee17);
  }));

  return function (_x29) {
    return _ref16.apply(this, arguments);
  };
}();

self.daemonIsTrusted = /*#__PURE__*/function () {
  var _ref17 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee18(daemonId) {
    return _regenerator["default"].wrap(function _callee18$(_context18) {
      while (1) {
        switch (_context18.prev = _context18.next) {
          case 0:
            return _context18.abrupt("return", self.WORKER_OBJECTS[daemonId].isTrusted());

          case 1:
          case "end":
            return _context18.stop();
        }
      }
    }, _callee18);
  }));

  return function (_x30) {
    return _ref17.apply(this, arguments);
  };
}();

self.daemonGetHeight = /*#__PURE__*/function () {
  var _ref18 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee19(daemonId) {
    return _regenerator["default"].wrap(function _callee19$(_context19) {
      while (1) {
        switch (_context19.prev = _context19.next) {
          case 0:
            return _context19.abrupt("return", self.WORKER_OBJECTS[daemonId].getHeight());

          case 1:
          case "end":
            return _context19.stop();
        }
      }
    }, _callee19);
  }));

  return function (_x31) {
    return _ref18.apply(this, arguments);
  };
}();

self.daemonGetBlockHash = /*#__PURE__*/function () {
  var _ref19 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee20(daemonId, height) {
    return _regenerator["default"].wrap(function _callee20$(_context20) {
      while (1) {
        switch (_context20.prev = _context20.next) {
          case 0:
            return _context20.abrupt("return", self.WORKER_OBJECTS[daemonId].getBlockHash(height));

          case 1:
          case "end":
            return _context20.stop();
        }
      }
    }, _callee20);
  }));

  return function (_x32, _x33) {
    return _ref19.apply(this, arguments);
  };
}();

self.daemonGetBlockTemplate = /*#__PURE__*/function () {
  var _ref20 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee21(daemonId, walletAddress, reserveSize) {
    return _regenerator["default"].wrap(function _callee21$(_context21) {
      while (1) {
        switch (_context21.prev = _context21.next) {
          case 0:
            _context21.next = 2;
            return self.WORKER_OBJECTS[daemonId].getBlockTemplate(walletAddress, reserveSize);

          case 2:
            return _context21.abrupt("return", _context21.sent.toJson());

          case 3:
          case "end":
            return _context21.stop();
        }
      }
    }, _callee21);
  }));

  return function (_x34, _x35, _x36) {
    return _ref20.apply(this, arguments);
  };
}();

self.daemonGetLastBlockHeader = /*#__PURE__*/function () {
  var _ref21 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee22(daemonId) {
    return _regenerator["default"].wrap(function _callee22$(_context22) {
      while (1) {
        switch (_context22.prev = _context22.next) {
          case 0:
            _context22.next = 2;
            return self.WORKER_OBJECTS[daemonId].getLastBlockHeader();

          case 2:
            return _context22.abrupt("return", _context22.sent.toJson());

          case 3:
          case "end":
            return _context22.stop();
        }
      }
    }, _callee22);
  }));

  return function (_x37) {
    return _ref21.apply(this, arguments);
  };
}();

self.daemonGetBlockHeaderByHash = /*#__PURE__*/function () {
  var _ref22 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee23(daemonId, hash) {
    return _regenerator["default"].wrap(function _callee23$(_context23) {
      while (1) {
        switch (_context23.prev = _context23.next) {
          case 0:
            _context23.next = 2;
            return self.WORKER_OBJECTS[daemonId].getBlockHeaderByHash(hash);

          case 2:
            return _context23.abrupt("return", _context23.sent.toJson());

          case 3:
          case "end":
            return _context23.stop();
        }
      }
    }, _callee23);
  }));

  return function (_x38, _x39) {
    return _ref22.apply(this, arguments);
  };
}();

self.daemonGetBlockHeaderByHeight = /*#__PURE__*/function () {
  var _ref23 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee24(daemonId, height) {
    return _regenerator["default"].wrap(function _callee24$(_context24) {
      while (1) {
        switch (_context24.prev = _context24.next) {
          case 0:
            _context24.next = 2;
            return self.WORKER_OBJECTS[daemonId].getBlockHeaderByHeight(height);

          case 2:
            return _context24.abrupt("return", _context24.sent.toJson());

          case 3:
          case "end":
            return _context24.stop();
        }
      }
    }, _callee24);
  }));

  return function (_x40, _x41) {
    return _ref23.apply(this, arguments);
  };
}();

self.daemonGetBlockHeadersByRange = /*#__PURE__*/function () {
  var _ref24 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee25(daemonId, startHeight, endHeight) {
    var blockHeadersJson, _iterator, _step, blockHeader;

    return _regenerator["default"].wrap(function _callee25$(_context25) {
      while (1) {
        switch (_context25.prev = _context25.next) {
          case 0:
            blockHeadersJson = [];
            _context25.t0 = _createForOfIteratorHelper;
            _context25.next = 4;
            return self.WORKER_OBJECTS[daemonId].getBlockHeadersByRange(startHeight, endHeight);

          case 4:
            _context25.t1 = _context25.sent;
            _iterator = (0, _context25.t0)(_context25.t1);

            try {
              for (_iterator.s(); !(_step = _iterator.n()).done;) {
                blockHeader = _step.value;
                blockHeadersJson.push(blockHeader.toJson());
              }
            } catch (err) {
              _iterator.e(err);
            } finally {
              _iterator.f();
            }

            return _context25.abrupt("return", blockHeadersJson);

          case 8:
          case "end":
            return _context25.stop();
        }
      }
    }, _callee25);
  }));

  return function (_x42, _x43, _x44) {
    return _ref24.apply(this, arguments);
  };
}();

self.daemonGetBlockByHash = /*#__PURE__*/function () {
  var _ref25 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee26(daemonId, blockHash) {
    return _regenerator["default"].wrap(function _callee26$(_context26) {
      while (1) {
        switch (_context26.prev = _context26.next) {
          case 0:
            _context26.next = 2;
            return self.WORKER_OBJECTS[daemonId].getBlockByHash(blockHash);

          case 2:
            return _context26.abrupt("return", _context26.sent.toJson());

          case 3:
          case "end":
            return _context26.stop();
        }
      }
    }, _callee26);
  }));

  return function (_x45, _x46) {
    return _ref25.apply(this, arguments);
  };
}();

self.daemonGetBlocksByHash = /*#__PURE__*/function () {
  var _ref26 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee27(daemonId, blockHashes, startHeight, prune) {
    var blocksJson, _iterator2, _step2, block;

    return _regenerator["default"].wrap(function _callee27$(_context27) {
      while (1) {
        switch (_context27.prev = _context27.next) {
          case 0:
            blocksJson = [];
            _context27.t0 = _createForOfIteratorHelper;
            _context27.next = 4;
            return self.WORKER_OBJECTS[daemonId].getBlocksByHash(blockHashes, startHeight, prune);

          case 4:
            _context27.t1 = _context27.sent;
            _iterator2 = (0, _context27.t0)(_context27.t1);

            try {
              for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                block = _step2.value;
                blocksJson.push(block.toJson());
              }
            } catch (err) {
              _iterator2.e(err);
            } finally {
              _iterator2.f();
            }

            return _context27.abrupt("return", blocksJson);

          case 8:
          case "end":
            return _context27.stop();
        }
      }
    }, _callee27);
  }));

  return function (_x47, _x48, _x49, _x50) {
    return _ref26.apply(this, arguments);
  };
}();

self.daemonGetBlockByHeight = /*#__PURE__*/function () {
  var _ref27 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee28(daemonId, height) {
    return _regenerator["default"].wrap(function _callee28$(_context28) {
      while (1) {
        switch (_context28.prev = _context28.next) {
          case 0:
            _context28.next = 2;
            return self.WORKER_OBJECTS[daemonId].getBlockByHeight(height);

          case 2:
            return _context28.abrupt("return", _context28.sent.toJson());

          case 3:
          case "end":
            return _context28.stop();
        }
      }
    }, _callee28);
  }));

  return function (_x51, _x52) {
    return _ref27.apply(this, arguments);
  };
}();

self.daemonGetBlocksByHeight = /*#__PURE__*/function () {
  var _ref28 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee29(daemonId, heights) {
    var blocksJson, _iterator3, _step3, block;

    return _regenerator["default"].wrap(function _callee29$(_context29) {
      while (1) {
        switch (_context29.prev = _context29.next) {
          case 0:
            blocksJson = [];
            _context29.t0 = _createForOfIteratorHelper;
            _context29.next = 4;
            return self.WORKER_OBJECTS[daemonId].getBlocksByHeight(heights);

          case 4:
            _context29.t1 = _context29.sent;
            _iterator3 = (0, _context29.t0)(_context29.t1);

            try {
              for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                block = _step3.value;
                blocksJson.push(block.toJson());
              }
            } catch (err) {
              _iterator3.e(err);
            } finally {
              _iterator3.f();
            }

            return _context29.abrupt("return", blocksJson);

          case 8:
          case "end":
            return _context29.stop();
        }
      }
    }, _callee29);
  }));

  return function (_x53, _x54) {
    return _ref28.apply(this, arguments);
  };
}();

self.daemonGetBlocksByRange = /*#__PURE__*/function () {
  var _ref29 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee30(daemonId, startHeight, endHeight) {
    var blocksJson, _iterator4, _step4, block;

    return _regenerator["default"].wrap(function _callee30$(_context30) {
      while (1) {
        switch (_context30.prev = _context30.next) {
          case 0:
            blocksJson = [];
            _context30.t0 = _createForOfIteratorHelper;
            _context30.next = 4;
            return self.WORKER_OBJECTS[daemonId].getBlocksByRange(startHeight, endHeight);

          case 4:
            _context30.t1 = _context30.sent;
            _iterator4 = (0, _context30.t0)(_context30.t1);

            try {
              for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                block = _step4.value;
                blocksJson.push(block.toJson());
              }
            } catch (err) {
              _iterator4.e(err);
            } finally {
              _iterator4.f();
            }

            return _context30.abrupt("return", blocksJson);

          case 8:
          case "end":
            return _context30.stop();
        }
      }
    }, _callee30);
  }));

  return function (_x55, _x56, _x57) {
    return _ref29.apply(this, arguments);
  };
}();

self.daemonGetBlocksByRangeChunked = /*#__PURE__*/function () {
  var _ref30 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee31(daemonId, startHeight, endHeight, maxChunkSize) {
    var blocksJson, _iterator5, _step5, block;

    return _regenerator["default"].wrap(function _callee31$(_context31) {
      while (1) {
        switch (_context31.prev = _context31.next) {
          case 0:
            blocksJson = [];
            _context31.t0 = _createForOfIteratorHelper;
            _context31.next = 4;
            return self.WORKER_OBJECTS[daemonId].getBlocksByRangeChunked(startHeight, endHeight, maxChunkSize);

          case 4:
            _context31.t1 = _context31.sent;
            _iterator5 = (0, _context31.t0)(_context31.t1);

            try {
              for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                block = _step5.value;
                blocksJson.push(block.toJson());
              }
            } catch (err) {
              _iterator5.e(err);
            } finally {
              _iterator5.f();
            }

            return _context31.abrupt("return", blocksJson);

          case 8:
          case "end":
            return _context31.stop();
        }
      }
    }, _callee31);
  }));

  return function (_x58, _x59, _x60, _x61) {
    return _ref30.apply(this, arguments);
  };
}();

self.daemonGetBlockHashes = /*#__PURE__*/function () {
  var _ref31 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee32(daemonId, blockHashes, startHeight) {
    return _regenerator["default"].wrap(function _callee32$(_context32) {
      while (1) {
        switch (_context32.prev = _context32.next) {
          case 0:
            throw new Error("worker.getBlockHashes not implemented");

          case 1:
          case "end":
            return _context32.stop();
        }
      }
    }, _callee32);
  }));

  return function (_x62, _x63, _x64) {
    return _ref31.apply(this, arguments);
  };
}(); // TODO: factor common code with self.getTxs()


self.daemonGetTxs = /*#__PURE__*/function () {
  var _ref32 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee33(daemonId, txHashes, prune) {
    var txs, blocks, unconfirmedBlock, seenBlocks, _iterator6, _step6, tx, i;

    return _regenerator["default"].wrap(function _callee33$(_context33) {
      while (1) {
        switch (_context33.prev = _context33.next) {
          case 0:
            _context33.next = 2;
            return self.WORKER_OBJECTS[daemonId].getTxs(txHashes, prune);

          case 2:
            txs = _context33.sent;
            // collect unique blocks to preserve model relationships as trees (based on monero_wasm_bridge.cpp::get_txs)
            blocks = [];
            unconfirmedBlock = undefined;
            seenBlocks = new Set();
            _iterator6 = _createForOfIteratorHelper(txs);

            try {
              for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
                tx = _step6.value;

                if (!tx.getBlock()) {
                  if (!unconfirmedBlock) unconfirmedBlock = new _MoneroBlock["default"]().setTxs([]);
                  tx.setBlock(unconfirmedBlock);
                  unconfirmedBlock.getTxs().push(tx);
                }

                if (!seenBlocks.has(tx.getBlock())) {
                  seenBlocks.add(tx.getBlock());
                  blocks.push(tx.getBlock());
                }
              } // serialize blocks to json

            } catch (err) {
              _iterator6.e(err);
            } finally {
              _iterator6.f();
            }

            for (i = 0; i < blocks.length; i++) {
              blocks[i] = blocks[i].toJson();
            }

            return _context33.abrupt("return", blocks);

          case 10:
          case "end":
            return _context33.stop();
        }
      }
    }, _callee33);
  }));

  return function (_x65, _x66, _x67) {
    return _ref32.apply(this, arguments);
  };
}();

self.daemonGetTxHexes = /*#__PURE__*/function () {
  var _ref33 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee34(daemonId, txHashes, prune) {
    return _regenerator["default"].wrap(function _callee34$(_context34) {
      while (1) {
        switch (_context34.prev = _context34.next) {
          case 0:
            return _context34.abrupt("return", self.WORKER_OBJECTS[daemonId].getTxHexes(txHashes, prune));

          case 1:
          case "end":
            return _context34.stop();
        }
      }
    }, _callee34);
  }));

  return function (_x68, _x69, _x70) {
    return _ref33.apply(this, arguments);
  };
}();

self.daemonGetMinerTxSum = /*#__PURE__*/function () {
  var _ref34 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee35(daemonId, height, numBlocks) {
    return _regenerator["default"].wrap(function _callee35$(_context35) {
      while (1) {
        switch (_context35.prev = _context35.next) {
          case 0:
            _context35.next = 2;
            return self.WORKER_OBJECTS[daemonId].getMinerTxSum(height, numBlocks);

          case 2:
            return _context35.abrupt("return", _context35.sent.toJson());

          case 3:
          case "end":
            return _context35.stop();
        }
      }
    }, _callee35);
  }));

  return function (_x71, _x72, _x73) {
    return _ref34.apply(this, arguments);
  };
}();

self.daemonGetFeeEstimate = /*#__PURE__*/function () {
  var _ref35 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee36(daemonId, graceBlocks) {
    return _regenerator["default"].wrap(function _callee36$(_context36) {
      while (1) {
        switch (_context36.prev = _context36.next) {
          case 0:
            _context36.next = 2;
            return self.WORKER_OBJECTS[daemonId].getFeeEstimate(graceBlocks);

          case 2:
            return _context36.abrupt("return", _context36.sent.toString());

          case 3:
          case "end":
            return _context36.stop();
        }
      }
    }, _callee36);
  }));

  return function (_x74, _x75) {
    return _ref35.apply(this, arguments);
  };
}();

self.daemonSubmitTxHex = /*#__PURE__*/function () {
  var _ref36 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee37(daemonId, txHex, doNotRelay) {
    return _regenerator["default"].wrap(function _callee37$(_context37) {
      while (1) {
        switch (_context37.prev = _context37.next) {
          case 0:
            _context37.next = 2;
            return self.WORKER_OBJECTS[daemonId].submitTxHex(txHex, doNotRelay);

          case 2:
            return _context37.abrupt("return", _context37.sent.toJson());

          case 3:
          case "end":
            return _context37.stop();
        }
      }
    }, _callee37);
  }));

  return function (_x76, _x77, _x78) {
    return _ref36.apply(this, arguments);
  };
}();

self.daemonRelayTxsByHash = /*#__PURE__*/function () {
  var _ref37 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee38(daemonId, txHashes) {
    return _regenerator["default"].wrap(function _callee38$(_context38) {
      while (1) {
        switch (_context38.prev = _context38.next) {
          case 0:
            return _context38.abrupt("return", self.WORKER_OBJECTS[daemonId].relayTxsByHash(txHashes));

          case 1:
          case "end":
            return _context38.stop();
        }
      }
    }, _callee38);
  }));

  return function (_x79, _x80) {
    return _ref37.apply(this, arguments);
  };
}();

self.daemonGetTxPool = /*#__PURE__*/function () {
  var _ref38 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee39(daemonId) {
    var txs, block, _iterator7, _step7, tx;

    return _regenerator["default"].wrap(function _callee39$(_context39) {
      while (1) {
        switch (_context39.prev = _context39.next) {
          case 0:
            _context39.next = 2;
            return self.WORKER_OBJECTS[daemonId].getTxPool();

          case 2:
            txs = _context39.sent;
            block = new _MoneroBlock["default"]().setTxs(txs);
            _iterator7 = _createForOfIteratorHelper(txs);

            try {
              for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
                tx = _step7.value;
                tx.setBlock(block);
              }
            } catch (err) {
              _iterator7.e(err);
            } finally {
              _iterator7.f();
            }

            return _context39.abrupt("return", block.toJson());

          case 7:
          case "end":
            return _context39.stop();
        }
      }
    }, _callee39);
  }));

  return function (_x81) {
    return _ref38.apply(this, arguments);
  };
}();

self.daemonGetTxPoolHashes = /*#__PURE__*/function () {
  var _ref39 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee40(daemonId) {
    return _regenerator["default"].wrap(function _callee40$(_context40) {
      while (1) {
        switch (_context40.prev = _context40.next) {
          case 0:
            return _context40.abrupt("return", self.WORKER_OBJECTS[daemonId].getTxPoolHashes());

          case 1:
          case "end":
            return _context40.stop();
        }
      }
    }, _callee40);
  }));

  return function (_x82) {
    return _ref39.apply(this, arguments);
  };
}(); //async getTxPoolBacklog() {
//  throw new MoneroError("Not implemented");
//}


self.daemonGetTxPoolStats = /*#__PURE__*/function () {
  var _ref40 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee41(daemonId) {
    return _regenerator["default"].wrap(function _callee41$(_context41) {
      while (1) {
        switch (_context41.prev = _context41.next) {
          case 0:
            _context41.next = 2;
            return self.WORKER_OBJECTS[daemonId].getTxPoolStats();

          case 2:
            return _context41.abrupt("return", _context41.sent.toJson());

          case 3:
          case "end":
            return _context41.stop();
        }
      }
    }, _callee41);
  }));

  return function (_x83) {
    return _ref40.apply(this, arguments);
  };
}();

self.daemonFlushTxPool = /*#__PURE__*/function () {
  var _ref41 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee42(daemonId, hashes) {
    return _regenerator["default"].wrap(function _callee42$(_context42) {
      while (1) {
        switch (_context42.prev = _context42.next) {
          case 0:
            return _context42.abrupt("return", self.WORKER_OBJECTS[daemonId].flushTxPool(hashes));

          case 1:
          case "end":
            return _context42.stop();
        }
      }
    }, _callee42);
  }));

  return function (_x84, _x85) {
    return _ref41.apply(this, arguments);
  };
}();

self.daemonGetKeyImageSpentStatuses = /*#__PURE__*/function () {
  var _ref42 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee43(daemonId, keyImages) {
    return _regenerator["default"].wrap(function _callee43$(_context43) {
      while (1) {
        switch (_context43.prev = _context43.next) {
          case 0:
            return _context43.abrupt("return", self.WORKER_OBJECTS[daemonId].getKeyImageSpentStatuses(keyImages));

          case 1:
          case "end":
            return _context43.stop();
        }
      }
    }, _callee43);
  }));

  return function (_x86, _x87) {
    return _ref42.apply(this, arguments);
  };
}(); //
//async getOutputs(outputs) {
//  throw new MoneroError("Not implemented");
//}


self.daemonGetOutputHistogram = /*#__PURE__*/function () {
  var _ref43 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee44(daemonId, amounts, minCount, maxCount, isUnlocked, recentCutoff) {
    var entriesJson, _iterator8, _step8, entry;

    return _regenerator["default"].wrap(function _callee44$(_context44) {
      while (1) {
        switch (_context44.prev = _context44.next) {
          case 0:
            entriesJson = [];
            _context44.t0 = _createForOfIteratorHelper;
            _context44.next = 4;
            return self.WORKER_OBJECTS[daemonId].getOutputHistogram(amounts, minCount, maxCount, isUnlocked, recentCutoff);

          case 4:
            _context44.t1 = _context44.sent;
            _iterator8 = (0, _context44.t0)(_context44.t1);

            try {
              for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
                entry = _step8.value;
                entriesJson.push(entry.toJson());
              }
            } catch (err) {
              _iterator8.e(err);
            } finally {
              _iterator8.f();
            }

            return _context44.abrupt("return", entriesJson);

          case 8:
          case "end":
            return _context44.stop();
        }
      }
    }, _callee44);
  }));

  return function (_x88, _x89, _x90, _x91, _x92, _x93) {
    return _ref43.apply(this, arguments);
  };
}(); //
//async getOutputDistribution(amounts, cumulative, startHeight, endHeight) {
//  throw new MoneroError("Not implemented");
//}


self.daemonGetInfo = /*#__PURE__*/function () {
  var _ref44 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee45(daemonId) {
    return _regenerator["default"].wrap(function _callee45$(_context45) {
      while (1) {
        switch (_context45.prev = _context45.next) {
          case 0:
            _context45.next = 2;
            return self.WORKER_OBJECTS[daemonId].getInfo();

          case 2:
            return _context45.abrupt("return", _context45.sent.toJson());

          case 3:
          case "end":
            return _context45.stop();
        }
      }
    }, _callee45);
  }));

  return function (_x94) {
    return _ref44.apply(this, arguments);
  };
}();

self.daemonGetSyncInfo = /*#__PURE__*/function () {
  var _ref45 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee46(daemonId) {
    return _regenerator["default"].wrap(function _callee46$(_context46) {
      while (1) {
        switch (_context46.prev = _context46.next) {
          case 0:
            _context46.next = 2;
            return self.WORKER_OBJECTS[daemonId].getSyncInfo();

          case 2:
            return _context46.abrupt("return", _context46.sent.toJson());

          case 3:
          case "end":
            return _context46.stop();
        }
      }
    }, _callee46);
  }));

  return function (_x95) {
    return _ref45.apply(this, arguments);
  };
}();

self.daemonGetHardForkInfo = /*#__PURE__*/function () {
  var _ref46 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee47(daemonId) {
    return _regenerator["default"].wrap(function _callee47$(_context47) {
      while (1) {
        switch (_context47.prev = _context47.next) {
          case 0:
            _context47.next = 2;
            return self.WORKER_OBJECTS[daemonId].getHardForkInfo();

          case 2:
            return _context47.abrupt("return", _context47.sent.toJson());

          case 3:
          case "end":
            return _context47.stop();
        }
      }
    }, _callee47);
  }));

  return function (_x96) {
    return _ref46.apply(this, arguments);
  };
}();

self.daemonGetAltChains = /*#__PURE__*/function () {
  var _ref47 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee48(daemonId) {
    var altChainsJson, _iterator9, _step9, altChain;

    return _regenerator["default"].wrap(function _callee48$(_context48) {
      while (1) {
        switch (_context48.prev = _context48.next) {
          case 0:
            altChainsJson = [];
            _context48.t0 = _createForOfIteratorHelper;
            _context48.next = 4;
            return self.WORKER_OBJECTS[daemonId].getAltChains();

          case 4:
            _context48.t1 = _context48.sent;
            _iterator9 = (0, _context48.t0)(_context48.t1);

            try {
              for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
                altChain = _step9.value;
                altChainsJson.push(altChain.toJson());
              }
            } catch (err) {
              _iterator9.e(err);
            } finally {
              _iterator9.f();
            }

            return _context48.abrupt("return", altChainsJson);

          case 8:
          case "end":
            return _context48.stop();
        }
      }
    }, _callee48);
  }));

  return function (_x97) {
    return _ref47.apply(this, arguments);
  };
}();

self.daemonGetAltBlockHashes = /*#__PURE__*/function () {
  var _ref48 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee49(daemonId) {
    return _regenerator["default"].wrap(function _callee49$(_context49) {
      while (1) {
        switch (_context49.prev = _context49.next) {
          case 0:
            return _context49.abrupt("return", self.WORKER_OBJECTS[daemonId].getAltBlockHashes());

          case 1:
          case "end":
            return _context49.stop();
        }
      }
    }, _callee49);
  }));

  return function (_x98) {
    return _ref48.apply(this, arguments);
  };
}();

self.daemonGetDownloadLimit = /*#__PURE__*/function () {
  var _ref49 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee50(daemonId) {
    return _regenerator["default"].wrap(function _callee50$(_context50) {
      while (1) {
        switch (_context50.prev = _context50.next) {
          case 0:
            return _context50.abrupt("return", self.WORKER_OBJECTS[daemonId].getDownloadLimit());

          case 1:
          case "end":
            return _context50.stop();
        }
      }
    }, _callee50);
  }));

  return function (_x99) {
    return _ref49.apply(this, arguments);
  };
}();

self.daemonSetDownloadLimit = /*#__PURE__*/function () {
  var _ref50 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee51(daemonId, limit) {
    return _regenerator["default"].wrap(function _callee51$(_context51) {
      while (1) {
        switch (_context51.prev = _context51.next) {
          case 0:
            return _context51.abrupt("return", self.WORKER_OBJECTS[daemonId].setDownloadLimit(limit));

          case 1:
          case "end":
            return _context51.stop();
        }
      }
    }, _callee51);
  }));

  return function (_x100, _x101) {
    return _ref50.apply(this, arguments);
  };
}();

self.daemonResetDownloadLimit = /*#__PURE__*/function () {
  var _ref51 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee52(daemonId) {
    return _regenerator["default"].wrap(function _callee52$(_context52) {
      while (1) {
        switch (_context52.prev = _context52.next) {
          case 0:
            return _context52.abrupt("return", self.WORKER_OBJECTS[daemonId].resetDownloadLimit());

          case 1:
          case "end":
            return _context52.stop();
        }
      }
    }, _callee52);
  }));

  return function (_x102) {
    return _ref51.apply(this, arguments);
  };
}();

self.daemonGetUploadLimit = /*#__PURE__*/function () {
  var _ref52 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee53(daemonId) {
    return _regenerator["default"].wrap(function _callee53$(_context53) {
      while (1) {
        switch (_context53.prev = _context53.next) {
          case 0:
            return _context53.abrupt("return", self.WORKER_OBJECTS[daemonId].getUploadLimit());

          case 1:
          case "end":
            return _context53.stop();
        }
      }
    }, _callee53);
  }));

  return function (_x103) {
    return _ref52.apply(this, arguments);
  };
}();

self.daemonSetUploadLimit = /*#__PURE__*/function () {
  var _ref53 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee54(daemonId, limit) {
    return _regenerator["default"].wrap(function _callee54$(_context54) {
      while (1) {
        switch (_context54.prev = _context54.next) {
          case 0:
            return _context54.abrupt("return", self.WORKER_OBJECTS[daemonId].setUploadLimit(limit));

          case 1:
          case "end":
            return _context54.stop();
        }
      }
    }, _callee54);
  }));

  return function (_x104, _x105) {
    return _ref53.apply(this, arguments);
  };
}();

self.daemonResetUploadLimit = /*#__PURE__*/function () {
  var _ref54 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee55(daemonId) {
    return _regenerator["default"].wrap(function _callee55$(_context55) {
      while (1) {
        switch (_context55.prev = _context55.next) {
          case 0:
            return _context55.abrupt("return", self.WORKER_OBJECTS[daemonId].resetUploadLimit());

          case 1:
          case "end":
            return _context55.stop();
        }
      }
    }, _callee55);
  }));

  return function (_x106) {
    return _ref54.apply(this, arguments);
  };
}();

self.daemonGetPeers = /*#__PURE__*/function () {
  var _ref55 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee56(daemonId) {
    var peersJson, _iterator10, _step10, peer;

    return _regenerator["default"].wrap(function _callee56$(_context56) {
      while (1) {
        switch (_context56.prev = _context56.next) {
          case 0:
            peersJson = [];
            _context56.t0 = _createForOfIteratorHelper;
            _context56.next = 4;
            return self.WORKER_OBJECTS[daemonId].getPeers();

          case 4:
            _context56.t1 = _context56.sent;
            _iterator10 = (0, _context56.t0)(_context56.t1);

            try {
              for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
                peer = _step10.value;
                peersJson.push(peer.toJson());
              }
            } catch (err) {
              _iterator10.e(err);
            } finally {
              _iterator10.f();
            }

            return _context56.abrupt("return", peersJson);

          case 8:
          case "end":
            return _context56.stop();
        }
      }
    }, _callee56);
  }));

  return function (_x107) {
    return _ref55.apply(this, arguments);
  };
}();

self.daemonGetKnownPeers = /*#__PURE__*/function () {
  var _ref56 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee57(daemonId) {
    var peersJson, _iterator11, _step11, peer;

    return _regenerator["default"].wrap(function _callee57$(_context57) {
      while (1) {
        switch (_context57.prev = _context57.next) {
          case 0:
            peersJson = [];
            _context57.t0 = _createForOfIteratorHelper;
            _context57.next = 4;
            return self.WORKER_OBJECTS[daemonId].getKnownPeers();

          case 4:
            _context57.t1 = _context57.sent;
            _iterator11 = (0, _context57.t0)(_context57.t1);

            try {
              for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
                peer = _step11.value;
                peersJson.push(peer.toJson());
              }
            } catch (err) {
              _iterator11.e(err);
            } finally {
              _iterator11.f();
            }

            return _context57.abrupt("return", peersJson);

          case 8:
          case "end":
            return _context57.stop();
        }
      }
    }, _callee57);
  }));

  return function (_x108) {
    return _ref56.apply(this, arguments);
  };
}();

self.daemonSetOutgoingPeerLimit = /*#__PURE__*/function () {
  var _ref57 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee58(daemonId, limit) {
    return _regenerator["default"].wrap(function _callee58$(_context58) {
      while (1) {
        switch (_context58.prev = _context58.next) {
          case 0:
            return _context58.abrupt("return", self.WORKER_OBJECTS[daemonId].setOutgoingPeerLimit(limit));

          case 1:
          case "end":
            return _context58.stop();
        }
      }
    }, _callee58);
  }));

  return function (_x109, _x110) {
    return _ref57.apply(this, arguments);
  };
}();

self.daemonSetIncomingPeerLimit = /*#__PURE__*/function () {
  var _ref58 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee59(daemonId, limit) {
    return _regenerator["default"].wrap(function _callee59$(_context59) {
      while (1) {
        switch (_context59.prev = _context59.next) {
          case 0:
            return _context59.abrupt("return", self.WORKER_OBJECTS[daemonId].setIncomingPeerLimit(limit));

          case 1:
          case "end":
            return _context59.stop();
        }
      }
    }, _callee59);
  }));

  return function (_x111, _x112) {
    return _ref58.apply(this, arguments);
  };
}();

self.daemonGetPeerBans = /*#__PURE__*/function () {
  var _ref59 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee60(daemonId) {
    var bansJson, _iterator12, _step12, ban;

    return _regenerator["default"].wrap(function _callee60$(_context60) {
      while (1) {
        switch (_context60.prev = _context60.next) {
          case 0:
            bansJson = [];
            _context60.t0 = _createForOfIteratorHelper;
            _context60.next = 4;
            return self.WORKER_OBJECTS[daemonId].getPeerBans();

          case 4:
            _context60.t1 = _context60.sent;
            _iterator12 = (0, _context60.t0)(_context60.t1);

            try {
              for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
                ban = _step12.value;
                bansJson.push(ban.toJson());
              }
            } catch (err) {
              _iterator12.e(err);
            } finally {
              _iterator12.f();
            }

            return _context60.abrupt("return", bansJson);

          case 8:
          case "end":
            return _context60.stop();
        }
      }
    }, _callee60);
  }));

  return function (_x113) {
    return _ref59.apply(this, arguments);
  };
}();

self.daemonSetPeerBans = /*#__PURE__*/function () {
  var _ref60 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee61(daemonId, bansJson) {
    var bans, _iterator13, _step13, banJson;

    return _regenerator["default"].wrap(function _callee61$(_context61) {
      while (1) {
        switch (_context61.prev = _context61.next) {
          case 0:
            bans = [];
            _iterator13 = _createForOfIteratorHelper(bansJson);

            try {
              for (_iterator13.s(); !(_step13 = _iterator13.n()).done;) {
                banJson = _step13.value;
                bans.push(new _MoneroBan["default"](banJson));
              }
            } catch (err) {
              _iterator13.e(err);
            } finally {
              _iterator13.f();
            }

            return _context61.abrupt("return", self.WORKER_OBJECTS[daemonId].setPeerBans(bans));

          case 4:
          case "end":
            return _context61.stop();
        }
      }
    }, _callee61);
  }));

  return function (_x114, _x115) {
    return _ref60.apply(this, arguments);
  };
}();

self.daemonStartMining = /*#__PURE__*/function () {
  var _ref61 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee62(daemonId, address, numThreads, isBackground, ignoreBattery) {
    return _regenerator["default"].wrap(function _callee62$(_context62) {
      while (1) {
        switch (_context62.prev = _context62.next) {
          case 0:
            return _context62.abrupt("return", self.WORKER_OBJECTS[daemonId].startMining(address, numThreads, isBackground, ignoreBattery));

          case 1:
          case "end":
            return _context62.stop();
        }
      }
    }, _callee62);
  }));

  return function (_x116, _x117, _x118, _x119, _x120) {
    return _ref61.apply(this, arguments);
  };
}();

self.daemonStopMining = /*#__PURE__*/function () {
  var _ref62 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee63(daemonId) {
    return _regenerator["default"].wrap(function _callee63$(_context63) {
      while (1) {
        switch (_context63.prev = _context63.next) {
          case 0:
            return _context63.abrupt("return", self.WORKER_OBJECTS[daemonId].stopMining());

          case 1:
          case "end":
            return _context63.stop();
        }
      }
    }, _callee63);
  }));

  return function (_x121) {
    return _ref62.apply(this, arguments);
  };
}();

self.daemonGetMiningStatus = /*#__PURE__*/function () {
  var _ref63 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee64(daemonId) {
    return _regenerator["default"].wrap(function _callee64$(_context64) {
      while (1) {
        switch (_context64.prev = _context64.next) {
          case 0:
            _context64.next = 2;
            return self.WORKER_OBJECTS[daemonId].getMiningStatus();

          case 2:
            return _context64.abrupt("return", _context64.sent.toJson());

          case 3:
          case "end":
            return _context64.stop();
        }
      }
    }, _callee64);
  }));

  return function (_x122) {
    return _ref63.apply(this, arguments);
  };
}(); //
//async submitBlocks(blockBlobs) {
//  throw new MoneroError("Not implemented");
//}
//
//async checkForUpdate() {
//  throw new MoneroError("Not implemented");
//}
//
//async downloadUpdate(path) {
//  throw new MoneroError("Not implemented");
//}


self.daemonStop = /*#__PURE__*/function () {
  var _ref64 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee65(daemonId) {
    return _regenerator["default"].wrap(function _callee65$(_context65) {
      while (1) {
        switch (_context65.prev = _context65.next) {
          case 0:
            return _context65.abrupt("return", self.WORKER_OBJECTS[daemonId].stop());

          case 1:
          case "end":
            return _context65.stop();
        }
      }
    }, _callee65);
  }));

  return function (_x123) {
    return _ref64.apply(this, arguments);
  };
}();

self.daemonWaitForNextBlockHeader = /*#__PURE__*/function () {
  var _ref65 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee66(daemonId) {
    return _regenerator["default"].wrap(function _callee66$(_context66) {
      while (1) {
        switch (_context66.prev = _context66.next) {
          case 0:
            _context66.next = 2;
            return self.WORKER_OBJECTS[daemonId].waitForNextBlockHeader();

          case 2:
            return _context66.abrupt("return", _context66.sent.toJson());

          case 3:
          case "end":
            return _context66.stop();
        }
      }
    }, _callee66);
  }));

  return function (_x124) {
    return _ref65.apply(this, arguments);
  };
}(); //------------------------------ WALLET METHODS -------------------------------


self.openWalletData = /*#__PURE__*/function () {
  var _ref66 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee67(walletId, path, password, networkType, keysData, cacheData, daemonUriOrConfig) {
    var daemonConnection;
    return _regenerator["default"].wrap(function _callee67$(_context67) {
      while (1) {
        switch (_context67.prev = _context67.next) {
          case 0:
            daemonConnection = daemonUriOrConfig ? new _MoneroRpcConnection["default"](daemonUriOrConfig) : undefined;
            _context67.next = 3;
            return _MoneroWalletFull["default"].openWallet({
              path: "",
              password: password,
              networkType: networkType,
              keysData: keysData,
              cacheData: cacheData,
              server: daemonConnection,
              proxyToWorker: false
            });

          case 3:
            self.WORKER_OBJECTS[walletId] = _context67.sent;

            self.WORKER_OBJECTS[walletId]._setBrowserMainPath(path);

          case 5:
          case "end":
            return _context67.stop();
        }
      }
    }, _callee67);
  }));

  return function (_x125, _x126, _x127, _x128, _x129, _x130, _x131) {
    return _ref66.apply(this, arguments);
  };
}();

self._createWallet = /*#__PURE__*/function () {
  var _ref67 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee68(walletId, configJson) {
    var config, path;
    return _regenerator["default"].wrap(function _callee68$(_context68) {
      while (1) {
        switch (_context68.prev = _context68.next) {
          case 0:
            config = new _MoneroWalletConfig["default"](configJson);
            path = config.getPath();
            config.setPath("");
            config.setProxyToWorker(false);
            _context68.next = 6;
            return _MoneroWalletFull["default"].createWallet(config);

          case 6:
            self.WORKER_OBJECTS[walletId] = _context68.sent;

            self.WORKER_OBJECTS[walletId]._setBrowserMainPath(path);

          case 8:
          case "end":
            return _context68.stop();
        }
      }
    }, _callee68);
  }));

  return function (_x132, _x133) {
    return _ref67.apply(this, arguments);
  };
}();

self.isViewOnly = /*#__PURE__*/function () {
  var _ref68 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee69(walletId) {
    return _regenerator["default"].wrap(function _callee69$(_context69) {
      while (1) {
        switch (_context69.prev = _context69.next) {
          case 0:
            return _context69.abrupt("return", self.WORKER_OBJECTS[walletId].isViewOnly());

          case 1:
          case "end":
            return _context69.stop();
        }
      }
    }, _callee69);
  }));

  return function (_x134) {
    return _ref68.apply(this, arguments);
  };
}();

self.getNetworkType = /*#__PURE__*/function () {
  var _ref69 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee70(walletId) {
    return _regenerator["default"].wrap(function _callee70$(_context70) {
      while (1) {
        switch (_context70.prev = _context70.next) {
          case 0:
            return _context70.abrupt("return", self.WORKER_OBJECTS[walletId].getNetworkType());

          case 1:
          case "end":
            return _context70.stop();
        }
      }
    }, _callee70);
  }));

  return function (_x135) {
    return _ref69.apply(this, arguments);
  };
}(); //
//async getVersion() {
//  throw new Error("Not implemented");
//}


self.getMnemonic = /*#__PURE__*/function () {
  var _ref70 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee71(walletId) {
    return _regenerator["default"].wrap(function _callee71$(_context71) {
      while (1) {
        switch (_context71.prev = _context71.next) {
          case 0:
            return _context71.abrupt("return", self.WORKER_OBJECTS[walletId].getMnemonic());

          case 1:
          case "end":
            return _context71.stop();
        }
      }
    }, _callee71);
  }));

  return function (_x136) {
    return _ref70.apply(this, arguments);
  };
}();

self.getMnemonicLanguage = /*#__PURE__*/function () {
  var _ref71 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee72(walletId) {
    return _regenerator["default"].wrap(function _callee72$(_context72) {
      while (1) {
        switch (_context72.prev = _context72.next) {
          case 0:
            return _context72.abrupt("return", self.WORKER_OBJECTS[walletId].getMnemonicLanguage());

          case 1:
          case "end":
            return _context72.stop();
        }
      }
    }, _callee72);
  }));

  return function (_x137) {
    return _ref71.apply(this, arguments);
  };
}();

self.getMnemonicLanguages = /*#__PURE__*/function () {
  var _ref72 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee73(walletId) {
    return _regenerator["default"].wrap(function _callee73$(_context73) {
      while (1) {
        switch (_context73.prev = _context73.next) {
          case 0:
            return _context73.abrupt("return", self.WORKER_OBJECTS[walletId].getMnemonicLanguages());

          case 1:
          case "end":
            return _context73.stop();
        }
      }
    }, _callee73);
  }));

  return function (_x138) {
    return _ref72.apply(this, arguments);
  };
}();

self.getPrivateSpendKey = /*#__PURE__*/function () {
  var _ref73 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee74(walletId) {
    return _regenerator["default"].wrap(function _callee74$(_context74) {
      while (1) {
        switch (_context74.prev = _context74.next) {
          case 0:
            return _context74.abrupt("return", self.WORKER_OBJECTS[walletId].getPrivateSpendKey());

          case 1:
          case "end":
            return _context74.stop();
        }
      }
    }, _callee74);
  }));

  return function (_x139) {
    return _ref73.apply(this, arguments);
  };
}();

self.getPrivateViewKey = /*#__PURE__*/function () {
  var _ref74 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee75(walletId) {
    return _regenerator["default"].wrap(function _callee75$(_context75) {
      while (1) {
        switch (_context75.prev = _context75.next) {
          case 0:
            return _context75.abrupt("return", self.WORKER_OBJECTS[walletId].getPrivateViewKey());

          case 1:
          case "end":
            return _context75.stop();
        }
      }
    }, _callee75);
  }));

  return function (_x140) {
    return _ref74.apply(this, arguments);
  };
}();

self.getPublicViewKey = /*#__PURE__*/function () {
  var _ref75 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee76(walletId) {
    return _regenerator["default"].wrap(function _callee76$(_context76) {
      while (1) {
        switch (_context76.prev = _context76.next) {
          case 0:
            return _context76.abrupt("return", self.WORKER_OBJECTS[walletId].getPublicViewKey());

          case 1:
          case "end":
            return _context76.stop();
        }
      }
    }, _callee76);
  }));

  return function (_x141) {
    return _ref75.apply(this, arguments);
  };
}();

self.getPublicSpendKey = /*#__PURE__*/function () {
  var _ref76 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee77(walletId) {
    return _regenerator["default"].wrap(function _callee77$(_context77) {
      while (1) {
        switch (_context77.prev = _context77.next) {
          case 0:
            return _context77.abrupt("return", self.WORKER_OBJECTS[walletId].getPublicSpendKey());

          case 1:
          case "end":
            return _context77.stop();
        }
      }
    }, _callee77);
  }));

  return function (_x142) {
    return _ref76.apply(this, arguments);
  };
}();

self.getAddress = /*#__PURE__*/function () {
  var _ref77 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee78(walletId, accountIdx, subaddressIdx) {
    return _regenerator["default"].wrap(function _callee78$(_context78) {
      while (1) {
        switch (_context78.prev = _context78.next) {
          case 0:
            return _context78.abrupt("return", self.WORKER_OBJECTS[walletId].getAddress(accountIdx, subaddressIdx));

          case 1:
          case "end":
            return _context78.stop();
        }
      }
    }, _callee78);
  }));

  return function (_x143, _x144, _x145) {
    return _ref77.apply(this, arguments);
  };
}();

self.getAddressIndex = /*#__PURE__*/function () {
  var _ref78 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee79(walletId, address) {
    return _regenerator["default"].wrap(function _callee79$(_context79) {
      while (1) {
        switch (_context79.prev = _context79.next) {
          case 0:
            _context79.next = 2;
            return self.WORKER_OBJECTS[walletId].getAddressIndex(address);

          case 2:
            return _context79.abrupt("return", _context79.sent.toJson());

          case 3:
          case "end":
            return _context79.stop();
        }
      }
    }, _callee79);
  }));

  return function (_x146, _x147) {
    return _ref78.apply(this, arguments);
  };
}();

self.getIntegratedAddress = /*#__PURE__*/function () {
  var _ref79 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee80(walletId, standardAddress, paymentId) {
    return _regenerator["default"].wrap(function _callee80$(_context80) {
      while (1) {
        switch (_context80.prev = _context80.next) {
          case 0:
            _context80.next = 2;
            return self.WORKER_OBJECTS[walletId].getIntegratedAddress(standardAddress, paymentId);

          case 2:
            return _context80.abrupt("return", _context80.sent.toJson());

          case 3:
          case "end":
            return _context80.stop();
        }
      }
    }, _callee80);
  }));

  return function (_x148, _x149, _x150) {
    return _ref79.apply(this, arguments);
  };
}();

self.decodeIntegratedAddress = /*#__PURE__*/function () {
  var _ref80 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee81(walletId, integratedAddress) {
    return _regenerator["default"].wrap(function _callee81$(_context81) {
      while (1) {
        switch (_context81.prev = _context81.next) {
          case 0:
            _context81.next = 2;
            return self.WORKER_OBJECTS[walletId].decodeIntegratedAddress(integratedAddress);

          case 2:
            return _context81.abrupt("return", _context81.sent.toJson());

          case 3:
          case "end":
            return _context81.stop();
        }
      }
    }, _callee81);
  }));

  return function (_x151, _x152) {
    return _ref80.apply(this, arguments);
  };
}();

self.setDaemonConnection = /*#__PURE__*/function () {
  var _ref81 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee82(walletId, config) {
    return _regenerator["default"].wrap(function _callee82$(_context82) {
      while (1) {
        switch (_context82.prev = _context82.next) {
          case 0:
            return _context82.abrupt("return", self.WORKER_OBJECTS[walletId].setDaemonConnection(config ? new _MoneroRpcConnection["default"](config) : undefined));

          case 1:
          case "end":
            return _context82.stop();
        }
      }
    }, _callee82);
  }));

  return function (_x153, _x154) {
    return _ref81.apply(this, arguments);
  };
}();

self.getDaemonConnection = /*#__PURE__*/function () {
  var _ref82 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee83(walletId) {
    var connection;
    return _regenerator["default"].wrap(function _callee83$(_context83) {
      while (1) {
        switch (_context83.prev = _context83.next) {
          case 0:
            _context83.next = 2;
            return self.WORKER_OBJECTS[walletId].getDaemonConnection();

          case 2:
            connection = _context83.sent;
            return _context83.abrupt("return", connection ? connection.getConfig() : undefined);

          case 4:
          case "end":
            return _context83.stop();
        }
      }
    }, _callee83);
  }));

  return function (_x155) {
    return _ref82.apply(this, arguments);
  };
}();

self.isConnectedToDaemon = /*#__PURE__*/function () {
  var _ref83 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee84(walletId) {
    return _regenerator["default"].wrap(function _callee84$(_context84) {
      while (1) {
        switch (_context84.prev = _context84.next) {
          case 0:
            return _context84.abrupt("return", self.WORKER_OBJECTS[walletId].isConnectedToDaemon());

          case 1:
          case "end":
            return _context84.stop();
        }
      }
    }, _callee84);
  }));

  return function (_x156) {
    return _ref83.apply(this, arguments);
  };
}();

self.getSyncHeight = /*#__PURE__*/function () {
  var _ref84 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee85(walletId) {
    return _regenerator["default"].wrap(function _callee85$(_context85) {
      while (1) {
        switch (_context85.prev = _context85.next) {
          case 0:
            return _context85.abrupt("return", self.WORKER_OBJECTS[walletId].getSyncHeight());

          case 1:
          case "end":
            return _context85.stop();
        }
      }
    }, _callee85);
  }));

  return function (_x157) {
    return _ref84.apply(this, arguments);
  };
}();

self.setSyncHeight = /*#__PURE__*/function () {
  var _ref85 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee86(walletId, syncHeight) {
    return _regenerator["default"].wrap(function _callee86$(_context86) {
      while (1) {
        switch (_context86.prev = _context86.next) {
          case 0:
            return _context86.abrupt("return", self.WORKER_OBJECTS[walletId].setSyncHeight(syncHeight));

          case 1:
          case "end":
            return _context86.stop();
        }
      }
    }, _callee86);
  }));

  return function (_x158, _x159) {
    return _ref85.apply(this, arguments);
  };
}();

self.getDaemonHeight = /*#__PURE__*/function () {
  var _ref86 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee87(walletId) {
    return _regenerator["default"].wrap(function _callee87$(_context87) {
      while (1) {
        switch (_context87.prev = _context87.next) {
          case 0:
            return _context87.abrupt("return", self.WORKER_OBJECTS[walletId].getDaemonHeight());

          case 1:
          case "end":
            return _context87.stop();
        }
      }
    }, _callee87);
  }));

  return function (_x160) {
    return _ref86.apply(this, arguments);
  };
}();

self.getDaemonMaxPeerHeight = /*#__PURE__*/function () {
  var _ref87 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee88(walletId) {
    return _regenerator["default"].wrap(function _callee88$(_context88) {
      while (1) {
        switch (_context88.prev = _context88.next) {
          case 0:
            return _context88.abrupt("return", self.WORKER_OBJECTS[walletId].getDaemonMaxPeerHeight());

          case 1:
          case "end":
            return _context88.stop();
        }
      }
    }, _callee88);
  }));

  return function (_x161) {
    return _ref87.apply(this, arguments);
  };
}();

self.getHeightByDate = /*#__PURE__*/function () {
  var _ref88 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee89(walletId, year, month, day) {
    return _regenerator["default"].wrap(function _callee89$(_context89) {
      while (1) {
        switch (_context89.prev = _context89.next) {
          case 0:
            return _context89.abrupt("return", self.WORKER_OBJECTS[walletId].getHeightByDate(year, month, day));

          case 1:
          case "end":
            return _context89.stop();
        }
      }
    }, _callee89);
  }));

  return function (_x162, _x163, _x164, _x165) {
    return _ref88.apply(this, arguments);
  };
}();

self.isDaemonSynced = /*#__PURE__*/function () {
  var _ref89 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee90(walletId) {
    return _regenerator["default"].wrap(function _callee90$(_context90) {
      while (1) {
        switch (_context90.prev = _context90.next) {
          case 0:
            return _context90.abrupt("return", self.WORKER_OBJECTS[walletId].isDaemonSynced());

          case 1:
          case "end":
            return _context90.stop();
        }
      }
    }, _callee90);
  }));

  return function (_x166) {
    return _ref89.apply(this, arguments);
  };
}();

self.getHeight = /*#__PURE__*/function () {
  var _ref90 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee91(walletId) {
    return _regenerator["default"].wrap(function _callee91$(_context91) {
      while (1) {
        switch (_context91.prev = _context91.next) {
          case 0:
            return _context91.abrupt("return", self.WORKER_OBJECTS[walletId].getHeight());

          case 1:
          case "end":
            return _context91.stop();
        }
      }
    }, _callee91);
  }));

  return function (_x167) {
    return _ref90.apply(this, arguments);
  };
}();

self.addListener = /*#__PURE__*/function () {
  var _ref91 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee92(walletId, listenerId) {
    var WalletWorkerHelperListener, listener;
    return _regenerator["default"].wrap(function _callee92$(_context92) {
      while (1) {
        switch (_context92.prev = _context92.next) {
          case 0:
            /**
             * Internal listener to bridge notifications to external listeners.
             * 
             * TODO: MoneroWalletListener is not defined until scripts imported
             * 
             * @private
             */
            WalletWorkerHelperListener = /*#__PURE__*/function (_MoneroWalletListener) {
              (0, _inherits2["default"])(WalletWorkerHelperListener, _MoneroWalletListener);

              var _super2 = _createSuper(WalletWorkerHelperListener);

              function WalletWorkerHelperListener(walletId, id, worker) {
                var _this;

                (0, _classCallCheck2["default"])(this, WalletWorkerHelperListener);
                _this = _super2.call(this);
                _this.walletId = walletId;
                _this.id = id;
                _this.worker = worker;
                return _this;
              }

              (0, _createClass2["default"])(WalletWorkerHelperListener, [{
                key: "getId",
                value: function getId() {
                  return this.id;
                }
              }, {
                key: "onSyncProgress",
                value: function onSyncProgress(height, startHeight, endHeight, percentDone, message) {
                  this.worker.postMessage([this.walletId, "onSyncProgress_" + this.getId(), height, startHeight, endHeight, percentDone, message]);
                }
              }, {
                key: "onNewBlock",
                value: function onNewBlock(height) {
                  this.worker.postMessage([this.walletId, "onNewBlock_" + this.getId(), height]);
                }
              }, {
                key: "onBalancesChanged",
                value: function onBalancesChanged(newBalance, newUnlockedBalance) {
                  this.worker.postMessage([this.walletId, "onBalancesChanged_" + this.getId(), newBalance.toString(), newUnlockedBalance.toString()]);
                }
              }, {
                key: "onOutputReceived",
                value: function onOutputReceived(output) {
                  var block = output.getTx().getBlock();
                  if (block === undefined) block = new _MoneroBlock["default"]().setTxs([output.getTx()]);
                  this.worker.postMessage([this.walletId, "onOutputReceived_" + this.getId(), block.toJson()]); // serialize from root block
                }
              }, {
                key: "onOutputSpent",
                value: function onOutputSpent(output) {
                  var block = output.getTx().getBlock();
                  if (block === undefined) block = new _MoneroBlock["default"]().setTxs([output.getTx()]);
                  this.worker.postMessage([this.walletId, "onOutputSpent_" + this.getId(), block.toJson()]); // serialize from root block
                }
              }]);
              return WalletWorkerHelperListener;
            }(_MoneroWalletListener2["default"]);

            listener = new WalletWorkerHelperListener(walletId, listenerId, self);
            if (!self.listeners) self.listeners = [];
            self.listeners.push(listener);
            _context92.next = 6;
            return self.WORKER_OBJECTS[walletId].addListener(listener);

          case 6:
          case "end":
            return _context92.stop();
        }
      }
    }, _callee92);
  }));

  return function (_x168, _x169) {
    return _ref91.apply(this, arguments);
  };
}();

self.removeListener = /*#__PURE__*/function () {
  var _ref92 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee93(walletId, listenerId) {
    var i;
    return _regenerator["default"].wrap(function _callee93$(_context93) {
      while (1) {
        switch (_context93.prev = _context93.next) {
          case 0:
            i = 0;

          case 1:
            if (!(i < self.listeners.length)) {
              _context93.next = 11;
              break;
            }

            if (!(self.listeners[i].getId() !== listenerId)) {
              _context93.next = 4;
              break;
            }

            return _context93.abrupt("continue", 8);

          case 4:
            _context93.next = 6;
            return self.WORKER_OBJECTS[walletId].removeListener(self.listeners[i]);

          case 6:
            self.listeners.splice(i, 1);
            return _context93.abrupt("return");

          case 8:
            i++;
            _context93.next = 1;
            break;

          case 11:
            throw new _MoneroError["default"]("Listener is not registered with wallet");

          case 12:
          case "end":
            return _context93.stop();
        }
      }
    }, _callee93);
  }));

  return function (_x170, _x171) {
    return _ref92.apply(this, arguments);
  };
}();

self.isSynced = /*#__PURE__*/function () {
  var _ref93 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee94(walletId) {
    return _regenerator["default"].wrap(function _callee94$(_context94) {
      while (1) {
        switch (_context94.prev = _context94.next) {
          case 0:
            return _context94.abrupt("return", self.WORKER_OBJECTS[walletId].isSynced());

          case 1:
          case "end":
            return _context94.stop();
        }
      }
    }, _callee94);
  }));

  return function (_x172) {
    return _ref93.apply(this, arguments);
  };
}();

self.sync = /*#__PURE__*/function () {
  var _ref94 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee95(walletId, startHeight, allowConcurrentCalls) {
    return _regenerator["default"].wrap(function _callee95$(_context95) {
      while (1) {
        switch (_context95.prev = _context95.next) {
          case 0:
            _context95.next = 2;
            return self.WORKER_OBJECTS[walletId].sync(undefined, startHeight, allowConcurrentCalls);

          case 2:
            return _context95.abrupt("return", _context95.sent);

          case 3:
          case "end":
            return _context95.stop();
        }
      }
    }, _callee95);
  }));

  return function (_x173, _x174, _x175) {
    return _ref94.apply(this, arguments);
  };
}();

self.startSyncing = /*#__PURE__*/function () {
  var _ref95 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee96(walletId, syncPeriodInMs) {
    return _regenerator["default"].wrap(function _callee96$(_context96) {
      while (1) {
        switch (_context96.prev = _context96.next) {
          case 0:
            return _context96.abrupt("return", self.WORKER_OBJECTS[walletId].startSyncing(syncPeriodInMs));

          case 1:
          case "end":
            return _context96.stop();
        }
      }
    }, _callee96);
  }));

  return function (_x176, _x177) {
    return _ref95.apply(this, arguments);
  };
}();

self.stopSyncing = /*#__PURE__*/function () {
  var _ref96 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee97(walletId) {
    return _regenerator["default"].wrap(function _callee97$(_context97) {
      while (1) {
        switch (_context97.prev = _context97.next) {
          case 0:
            return _context97.abrupt("return", self.WORKER_OBJECTS[walletId].stopSyncing());

          case 1:
          case "end":
            return _context97.stop();
        }
      }
    }, _callee97);
  }));

  return function (_x178) {
    return _ref96.apply(this, arguments);
  };
}();

self.scanTxs = /*#__PURE__*/function () {
  var _ref97 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee98(walletId, txHashes) {
    return _regenerator["default"].wrap(function _callee98$(_context98) {
      while (1) {
        switch (_context98.prev = _context98.next) {
          case 0:
            return _context98.abrupt("return", self.WORKER_OBJECTS[walletId].scanTxs(txHashes));

          case 1:
          case "end":
            return _context98.stop();
        }
      }
    }, _callee98);
  }));

  return function (_x179, _x180) {
    return _ref97.apply(this, arguments);
  };
}();

self.rescanSpent = /*#__PURE__*/function () {
  var _ref98 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee99(walletId) {
    return _regenerator["default"].wrap(function _callee99$(_context99) {
      while (1) {
        switch (_context99.prev = _context99.next) {
          case 0:
            return _context99.abrupt("return", self.WORKER_OBJECTS[walletId].rescanSpent());

          case 1:
          case "end":
            return _context99.stop();
        }
      }
    }, _callee99);
  }));

  return function (_x181) {
    return _ref98.apply(this, arguments);
  };
}();

self.rescanBlockchain = /*#__PURE__*/function () {
  var _ref99 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee100(walletId) {
    return _regenerator["default"].wrap(function _callee100$(_context100) {
      while (1) {
        switch (_context100.prev = _context100.next) {
          case 0:
            return _context100.abrupt("return", self.WORKER_OBJECTS[walletId].rescanBlockchain());

          case 1:
          case "end":
            return _context100.stop();
        }
      }
    }, _callee100);
  }));

  return function (_x182) {
    return _ref99.apply(this, arguments);
  };
}();

self.getBalance = /*#__PURE__*/function () {
  var _ref100 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee101(walletId, accountIdx, subaddressIdx) {
    return _regenerator["default"].wrap(function _callee101$(_context101) {
      while (1) {
        switch (_context101.prev = _context101.next) {
          case 0:
            _context101.next = 2;
            return self.WORKER_OBJECTS[walletId].getBalance(accountIdx, subaddressIdx);

          case 2:
            return _context101.abrupt("return", _context101.sent.toString());

          case 3:
          case "end":
            return _context101.stop();
        }
      }
    }, _callee101);
  }));

  return function (_x183, _x184, _x185) {
    return _ref100.apply(this, arguments);
  };
}();

self.getUnlockedBalance = /*#__PURE__*/function () {
  var _ref101 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee102(walletId, accountIdx, subaddressIdx) {
    return _regenerator["default"].wrap(function _callee102$(_context102) {
      while (1) {
        switch (_context102.prev = _context102.next) {
          case 0:
            _context102.next = 2;
            return self.WORKER_OBJECTS[walletId].getUnlockedBalance(accountIdx, subaddressIdx);

          case 2:
            return _context102.abrupt("return", _context102.sent.toString());

          case 3:
          case "end":
            return _context102.stop();
        }
      }
    }, _callee102);
  }));

  return function (_x186, _x187, _x188) {
    return _ref101.apply(this, arguments);
  };
}();

self.getAccounts = /*#__PURE__*/function () {
  var _ref102 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee103(walletId, includeSubaddresses, tag) {
    var accountJsons, _iterator14, _step14, account;

    return _regenerator["default"].wrap(function _callee103$(_context103) {
      while (1) {
        switch (_context103.prev = _context103.next) {
          case 0:
            accountJsons = [];
            _context103.t0 = _createForOfIteratorHelper;
            _context103.next = 4;
            return self.WORKER_OBJECTS[walletId].getAccounts(includeSubaddresses, tag);

          case 4:
            _context103.t1 = _context103.sent;
            _iterator14 = (0, _context103.t0)(_context103.t1);

            try {
              for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {
                account = _step14.value;
                accountJsons.push(account.toJson());
              }
            } catch (err) {
              _iterator14.e(err);
            } finally {
              _iterator14.f();
            }

            return _context103.abrupt("return", accountJsons);

          case 8:
          case "end":
            return _context103.stop();
        }
      }
    }, _callee103);
  }));

  return function (_x189, _x190, _x191) {
    return _ref102.apply(this, arguments);
  };
}();

self.getAccount = /*#__PURE__*/function () {
  var _ref103 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee104(walletId, accountIdx, includeSubaddresses) {
    return _regenerator["default"].wrap(function _callee104$(_context104) {
      while (1) {
        switch (_context104.prev = _context104.next) {
          case 0:
            _context104.next = 2;
            return self.WORKER_OBJECTS[walletId].getAccount(accountIdx, includeSubaddresses);

          case 2:
            return _context104.abrupt("return", _context104.sent.toJson());

          case 3:
          case "end":
            return _context104.stop();
        }
      }
    }, _callee104);
  }));

  return function (_x192, _x193, _x194) {
    return _ref103.apply(this, arguments);
  };
}();

self.createAccount = /*#__PURE__*/function () {
  var _ref104 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee105(walletId, label) {
    return _regenerator["default"].wrap(function _callee105$(_context105) {
      while (1) {
        switch (_context105.prev = _context105.next) {
          case 0:
            _context105.next = 2;
            return self.WORKER_OBJECTS[walletId].createAccount(label);

          case 2:
            return _context105.abrupt("return", _context105.sent.toJson());

          case 3:
          case "end":
            return _context105.stop();
        }
      }
    }, _callee105);
  }));

  return function (_x195, _x196) {
    return _ref104.apply(this, arguments);
  };
}();

self.getSubaddresses = /*#__PURE__*/function () {
  var _ref105 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee106(walletId, accountIdx, subaddressIndices) {
    var subaddressJsons, _iterator15, _step15, subaddress;

    return _regenerator["default"].wrap(function _callee106$(_context106) {
      while (1) {
        switch (_context106.prev = _context106.next) {
          case 0:
            subaddressJsons = [];
            _context106.t0 = _createForOfIteratorHelper;
            _context106.next = 4;
            return self.WORKER_OBJECTS[walletId].getSubaddresses(accountIdx, subaddressIndices);

          case 4:
            _context106.t1 = _context106.sent;
            _iterator15 = (0, _context106.t0)(_context106.t1);

            try {
              for (_iterator15.s(); !(_step15 = _iterator15.n()).done;) {
                subaddress = _step15.value;
                subaddressJsons.push(subaddress.toJson());
              }
            } catch (err) {
              _iterator15.e(err);
            } finally {
              _iterator15.f();
            }

            return _context106.abrupt("return", subaddressJsons);

          case 8:
          case "end":
            return _context106.stop();
        }
      }
    }, _callee106);
  }));

  return function (_x197, _x198, _x199) {
    return _ref105.apply(this, arguments);
  };
}();

self.createSubaddress = /*#__PURE__*/function () {
  var _ref106 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee107(walletId, accountIdx, label) {
    return _regenerator["default"].wrap(function _callee107$(_context107) {
      while (1) {
        switch (_context107.prev = _context107.next) {
          case 0:
            _context107.next = 2;
            return self.WORKER_OBJECTS[walletId].createSubaddress(accountIdx, label);

          case 2:
            return _context107.abrupt("return", _context107.sent.toJson());

          case 3:
          case "end":
            return _context107.stop();
        }
      }
    }, _callee107);
  }));

  return function (_x200, _x201, _x202) {
    return _ref106.apply(this, arguments);
  };
}(); // TODO: easier or more efficient way than serializing from root blocks?


self.getTxs = /*#__PURE__*/function () {
  var _ref107 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee108(walletId, blockJsonQuery, missingTxHashes) {
    var query, txs, seenBlocks, unconfirmedBlock, blocks, _iterator16, _step16, tx, i;

    return _regenerator["default"].wrap(function _callee108$(_context108) {
      while (1) {
        switch (_context108.prev = _context108.next) {
          case 0:
            // deserialize query which is json string rooted at block
            query = new _MoneroBlock["default"](blockJsonQuery, _MoneroBlock["default"].DeserializationType.TX_QUERY).getTxs()[0]; // get txs

            _context108.next = 3;
            return self.WORKER_OBJECTS[walletId].getTxs(query, missingTxHashes);

          case 3:
            txs = _context108.sent;
            // collect unique blocks to preserve model relationships as trees (based on monero_wasm_bridge.cpp::get_txs)
            seenBlocks = new Set();
            unconfirmedBlock = undefined;
            blocks = [];
            _iterator16 = _createForOfIteratorHelper(txs);

            try {
              for (_iterator16.s(); !(_step16 = _iterator16.n()).done;) {
                tx = _step16.value;

                if (!tx.getBlock()) {
                  if (!unconfirmedBlock) unconfirmedBlock = new _MoneroBlock["default"]().setTxs([]);
                  tx.setBlock(unconfirmedBlock);
                  unconfirmedBlock.getTxs().push(tx);
                }

                if (!seenBlocks.has(tx.getBlock())) {
                  seenBlocks.add(tx.getBlock());
                  blocks.push(tx.getBlock());
                }
              } // serialize blocks to json

            } catch (err) {
              _iterator16.e(err);
            } finally {
              _iterator16.f();
            }

            for (i = 0; i < blocks.length; i++) {
              blocks[i] = blocks[i].toJson();
            }

            return _context108.abrupt("return", {
              blocks: blocks,
              missingTxHashes: missingTxHashes
            });

          case 11:
          case "end":
            return _context108.stop();
        }
      }
    }, _callee108);
  }));

  return function (_x203, _x204, _x205) {
    return _ref107.apply(this, arguments);
  };
}();

self.getTransfers = /*#__PURE__*/function () {
  var _ref108 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee109(walletId, blockJsonQuery) {
    var query, transfers, unconfirmedBlock, blocks, seenBlocks, _iterator17, _step17, transfer, tx, i;

    return _regenerator["default"].wrap(function _callee109$(_context109) {
      while (1) {
        switch (_context109.prev = _context109.next) {
          case 0:
            // deserialize query which is json string rooted at block
            query = new _MoneroBlock["default"](blockJsonQuery, _MoneroBlock["default"].DeserializationType.TX_QUERY).getTxs()[0].getTransferQuery(); // get transfers

            _context109.next = 3;
            return self.WORKER_OBJECTS[walletId].getTransfers(query);

          case 3:
            transfers = _context109.sent;
            // collect unique blocks to preserve model relationships as tree
            unconfirmedBlock = undefined;
            blocks = [];
            seenBlocks = new Set();
            _iterator17 = _createForOfIteratorHelper(transfers);

            try {
              for (_iterator17.s(); !(_step17 = _iterator17.n()).done;) {
                transfer = _step17.value;
                tx = transfer.getTx();

                if (!tx.getBlock()) {
                  if (!unconfirmedBlock) unconfirmedBlock = new _MoneroBlock["default"]().setTxs([]);
                  tx.setBlock(unconfirmedBlock);
                  unconfirmedBlock.getTxs().push(tx);
                }

                if (!seenBlocks.has(tx.getBlock())) {
                  seenBlocks.add(tx.getBlock());
                  blocks.push(tx.getBlock());
                }
              } // serialize blocks to json

            } catch (err) {
              _iterator17.e(err);
            } finally {
              _iterator17.f();
            }

            for (i = 0; i < blocks.length; i++) {
              blocks[i] = blocks[i].toJson();
            }

            return _context109.abrupt("return", blocks);

          case 11:
          case "end":
            return _context109.stop();
        }
      }
    }, _callee109);
  }));

  return function (_x206, _x207) {
    return _ref108.apply(this, arguments);
  };
}();

self.getOutputs = /*#__PURE__*/function () {
  var _ref109 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee110(walletId, blockJsonQuery) {
    var query, outputs, unconfirmedBlock, blocks, seenBlocks, _iterator18, _step18, output, tx, i;

    return _regenerator["default"].wrap(function _callee110$(_context110) {
      while (1) {
        switch (_context110.prev = _context110.next) {
          case 0:
            // deserialize query which is json string rooted at block
            query = new _MoneroBlock["default"](blockJsonQuery, _MoneroBlock["default"].DeserializationType.TX_QUERY).getTxs()[0].getOutputQuery(); // get outputs

            _context110.next = 3;
            return self.WORKER_OBJECTS[walletId].getOutputs(query);

          case 3:
            outputs = _context110.sent;
            // collect unique blocks to preserve model relationships as tree
            unconfirmedBlock = undefined;
            blocks = [];
            seenBlocks = new Set();
            _iterator18 = _createForOfIteratorHelper(outputs);

            try {
              for (_iterator18.s(); !(_step18 = _iterator18.n()).done;) {
                output = _step18.value;
                tx = output.getTx();

                if (!tx.getBlock()) {
                  if (!unconfirmedBlock) unconfirmedBlock = new _MoneroBlock["default"]().setTxs([]);
                  tx.setBlock(unconfirmedBlock);
                  unconfirmedBlock.getTxs().push(tx);
                }

                if (!seenBlocks.has(tx.getBlock())) {
                  seenBlocks.add(tx.getBlock());
                  blocks.push(tx.getBlock());
                }
              } // serialize blocks to json

            } catch (err) {
              _iterator18.e(err);
            } finally {
              _iterator18.f();
            }

            for (i = 0; i < blocks.length; i++) {
              blocks[i] = blocks[i].toJson();
            }

            return _context110.abrupt("return", blocks);

          case 11:
          case "end":
            return _context110.stop();
        }
      }
    }, _callee110);
  }));

  return function (_x208, _x209) {
    return _ref109.apply(this, arguments);
  };
}();

self.exportOutputs = /*#__PURE__*/function () {
  var _ref110 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee111(walletId, all) {
    return _regenerator["default"].wrap(function _callee111$(_context111) {
      while (1) {
        switch (_context111.prev = _context111.next) {
          case 0:
            return _context111.abrupt("return", self.WORKER_OBJECTS[walletId].exportOutputs(all));

          case 1:
          case "end":
            return _context111.stop();
        }
      }
    }, _callee111);
  }));

  return function (_x210, _x211) {
    return _ref110.apply(this, arguments);
  };
}();

self.importOutputs = /*#__PURE__*/function () {
  var _ref111 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee112(walletId, outputsHex) {
    return _regenerator["default"].wrap(function _callee112$(_context112) {
      while (1) {
        switch (_context112.prev = _context112.next) {
          case 0:
            return _context112.abrupt("return", self.WORKER_OBJECTS[walletId].importOutputs(outputsHex));

          case 1:
          case "end":
            return _context112.stop();
        }
      }
    }, _callee112);
  }));

  return function (_x212, _x213) {
    return _ref111.apply(this, arguments);
  };
}();

self.getKeyImages = /*#__PURE__*/function () {
  var _ref112 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee113(walletId, all) {
    var keyImagesJson, _iterator19, _step19, keyImage;

    return _regenerator["default"].wrap(function _callee113$(_context113) {
      while (1) {
        switch (_context113.prev = _context113.next) {
          case 0:
            keyImagesJson = [];
            _context113.t0 = _createForOfIteratorHelper;
            _context113.next = 4;
            return self.WORKER_OBJECTS[walletId].exportKeyImages(all);

          case 4:
            _context113.t1 = _context113.sent;
            _iterator19 = (0, _context113.t0)(_context113.t1);

            try {
              for (_iterator19.s(); !(_step19 = _iterator19.n()).done;) {
                keyImage = _step19.value;
                keyImagesJson.push(keyImage.toJson());
              }
            } catch (err) {
              _iterator19.e(err);
            } finally {
              _iterator19.f();
            }

            return _context113.abrupt("return", keyImagesJson);

          case 8:
          case "end":
            return _context113.stop();
        }
      }
    }, _callee113);
  }));

  return function (_x214, _x215) {
    return _ref112.apply(this, arguments);
  };
}();

self.importKeyImages = /*#__PURE__*/function () {
  var _ref113 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee114(walletId, keyImagesJson) {
    var keyImages, _iterator20, _step20, keyImageJson;

    return _regenerator["default"].wrap(function _callee114$(_context114) {
      while (1) {
        switch (_context114.prev = _context114.next) {
          case 0:
            keyImages = [];
            _iterator20 = _createForOfIteratorHelper(keyImagesJson);

            try {
              for (_iterator20.s(); !(_step20 = _iterator20.n()).done;) {
                keyImageJson = _step20.value;
                keyImages.push(new _MoneroKeyImage["default"](keyImageJson));
              }
            } catch (err) {
              _iterator20.e(err);
            } finally {
              _iterator20.f();
            }

            _context114.next = 5;
            return self.WORKER_OBJECTS[walletId].importKeyImages(keyImages);

          case 5:
            return _context114.abrupt("return", _context114.sent.toJson());

          case 6:
          case "end":
            return _context114.stop();
        }
      }
    }, _callee114);
  }));

  return function (_x216, _x217) {
    return _ref113.apply(this, arguments);
  };
}(); //async getNewKeyImagesFromLastImport() {
//  throw new MoneroError("Not implemented");
//}


self.freezeOutput = /*#__PURE__*/function () {
  var _ref114 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee115(walletId, keyImage) {
    return _regenerator["default"].wrap(function _callee115$(_context115) {
      while (1) {
        switch (_context115.prev = _context115.next) {
          case 0:
            return _context115.abrupt("return", self.WORKER_OBJECTS[walletId].freezeOutput(keyImage));

          case 1:
          case "end":
            return _context115.stop();
        }
      }
    }, _callee115);
  }));

  return function (_x218, _x219) {
    return _ref114.apply(this, arguments);
  };
}();

self.thawOutput = /*#__PURE__*/function () {
  var _ref115 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee116(walletId, keyImage) {
    return _regenerator["default"].wrap(function _callee116$(_context116) {
      while (1) {
        switch (_context116.prev = _context116.next) {
          case 0:
            return _context116.abrupt("return", self.WORKER_OBJECTS[walletId].thawOutput(keyImage));

          case 1:
          case "end":
            return _context116.stop();
        }
      }
    }, _callee116);
  }));

  return function (_x220, _x221) {
    return _ref115.apply(this, arguments);
  };
}();

self.isOutputFrozen = /*#__PURE__*/function () {
  var _ref116 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee117(walletId, keyImage) {
    return _regenerator["default"].wrap(function _callee117$(_context117) {
      while (1) {
        switch (_context117.prev = _context117.next) {
          case 0:
            return _context117.abrupt("return", self.WORKER_OBJECTS[walletId].isOutputFrozen(keyImage));

          case 1:
          case "end":
            return _context117.stop();
        }
      }
    }, _callee117);
  }));

  return function (_x222, _x223) {
    return _ref116.apply(this, arguments);
  };
}();

self.createTxs = /*#__PURE__*/function () {
  var _ref117 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee118(walletId, config) {
    var txs;
    return _regenerator["default"].wrap(function _callee118$(_context118) {
      while (1) {
        switch (_context118.prev = _context118.next) {
          case 0:
            if ((0, _typeof2["default"])(config) === "object") config = new _MoneroTxConfig["default"](config);
            _context118.next = 3;
            return self.WORKER_OBJECTS[walletId].createTxs(config);

          case 3:
            txs = _context118.sent;
            return _context118.abrupt("return", txs[0].getTxSet().toJson());

          case 5:
          case "end":
            return _context118.stop();
        }
      }
    }, _callee118);
  }));

  return function (_x224, _x225) {
    return _ref117.apply(this, arguments);
  };
}();

self.sweepOutput = /*#__PURE__*/function () {
  var _ref118 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee119(walletId, config) {
    var tx;
    return _regenerator["default"].wrap(function _callee119$(_context119) {
      while (1) {
        switch (_context119.prev = _context119.next) {
          case 0:
            if ((0, _typeof2["default"])(config) === "object") config = new _MoneroTxConfig["default"](config);
            _context119.next = 3;
            return self.WORKER_OBJECTS[walletId].sweepOutput(config);

          case 3:
            tx = _context119.sent;
            return _context119.abrupt("return", tx.getTxSet().toJson());

          case 5:
          case "end":
            return _context119.stop();
        }
      }
    }, _callee119);
  }));

  return function (_x226, _x227) {
    return _ref118.apply(this, arguments);
  };
}();

self.sweepUnlocked = /*#__PURE__*/function () {
  var _ref119 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee120(walletId, config) {
    var txs, txSets, _iterator21, _step21, tx, txSetsJson, _i, _txSets, txSet;

    return _regenerator["default"].wrap(function _callee120$(_context120) {
      while (1) {
        switch (_context120.prev = _context120.next) {
          case 0:
            if ((0, _typeof2["default"])(config) === "object") config = new _MoneroTxConfig["default"](config);
            _context120.next = 3;
            return self.WORKER_OBJECTS[walletId].sweepUnlocked(config);

          case 3:
            txs = _context120.sent;
            txSets = [];
            _iterator21 = _createForOfIteratorHelper(txs);

            try {
              for (_iterator21.s(); !(_step21 = _iterator21.n()).done;) {
                tx = _step21.value;
                if (!_GenUtils["default"].arrayContains(txSets, tx.getTxSet())) txSets.push(tx.getTxSet());
              }
            } catch (err) {
              _iterator21.e(err);
            } finally {
              _iterator21.f();
            }

            txSetsJson = [];

            for (_i = 0, _txSets = txSets; _i < _txSets.length; _i++) {
              txSet = _txSets[_i];
              txSetsJson.push(txSet.toJson());
            }

            return _context120.abrupt("return", txSetsJson);

          case 10:
          case "end":
            return _context120.stop();
        }
      }
    }, _callee120);
  }));

  return function (_x228, _x229) {
    return _ref119.apply(this, arguments);
  };
}();

self.sweepDust = /*#__PURE__*/function () {
  var _ref120 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee121(walletId, relay) {
    var txs;
    return _regenerator["default"].wrap(function _callee121$(_context121) {
      while (1) {
        switch (_context121.prev = _context121.next) {
          case 0:
            _context121.next = 2;
            return self.WORKER_OBJECTS[walletId].sweepDust(relay);

          case 2:
            txs = _context121.sent;
            return _context121.abrupt("return", txs.length === 0 ? {} : txs[0].getTxSet().toJson());

          case 4:
          case "end":
            return _context121.stop();
        }
      }
    }, _callee121);
  }));

  return function (_x230, _x231) {
    return _ref120.apply(this, arguments);
  };
}();

self.relayTxs = /*#__PURE__*/function () {
  var _ref121 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee122(walletId, txMetadatas) {
    return _regenerator["default"].wrap(function _callee122$(_context122) {
      while (1) {
        switch (_context122.prev = _context122.next) {
          case 0:
            return _context122.abrupt("return", self.WORKER_OBJECTS[walletId].relayTxs(txMetadatas));

          case 1:
          case "end":
            return _context122.stop();
        }
      }
    }, _callee122);
  }));

  return function (_x232, _x233) {
    return _ref121.apply(this, arguments);
  };
}();

self.describeTxSet = /*#__PURE__*/function () {
  var _ref122 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee123(walletId, txSetJson) {
    return _regenerator["default"].wrap(function _callee123$(_context123) {
      while (1) {
        switch (_context123.prev = _context123.next) {
          case 0:
            _context123.next = 2;
            return self.WORKER_OBJECTS[walletId].describeTxSet(new _MoneroTxSet["default"](txSetJson));

          case 2:
            return _context123.abrupt("return", _context123.sent.toJson());

          case 3:
          case "end":
            return _context123.stop();
        }
      }
    }, _callee123);
  }));

  return function (_x234, _x235) {
    return _ref122.apply(this, arguments);
  };
}();

self.signTxs = /*#__PURE__*/function () {
  var _ref123 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee124(walletId, unsignedTxHex) {
    return _regenerator["default"].wrap(function _callee124$(_context124) {
      while (1) {
        switch (_context124.prev = _context124.next) {
          case 0:
            return _context124.abrupt("return", self.WORKER_OBJECTS[walletId].signTxs(unsignedTxHex));

          case 1:
          case "end":
            return _context124.stop();
        }
      }
    }, _callee124);
  }));

  return function (_x236, _x237) {
    return _ref123.apply(this, arguments);
  };
}();

self.submitTxs = /*#__PURE__*/function () {
  var _ref124 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee125(walletId, signedTxHex) {
    return _regenerator["default"].wrap(function _callee125$(_context125) {
      while (1) {
        switch (_context125.prev = _context125.next) {
          case 0:
            return _context125.abrupt("return", self.WORKER_OBJECTS[walletId].submitTxs(signedTxHex));

          case 1:
          case "end":
            return _context125.stop();
        }
      }
    }, _callee125);
  }));

  return function (_x238, _x239) {
    return _ref124.apply(this, arguments);
  };
}();

self.signMessage = /*#__PURE__*/function () {
  var _ref125 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee126(walletId, message, signatureType, accountIdx, subaddressIdx) {
    return _regenerator["default"].wrap(function _callee126$(_context126) {
      while (1) {
        switch (_context126.prev = _context126.next) {
          case 0:
            return _context126.abrupt("return", self.WORKER_OBJECTS[walletId].signMessage(message, signatureType, accountIdx, subaddressIdx));

          case 1:
          case "end":
            return _context126.stop();
        }
      }
    }, _callee126);
  }));

  return function (_x240, _x241, _x242, _x243, _x244) {
    return _ref125.apply(this, arguments);
  };
}();

self.verifyMessage = /*#__PURE__*/function () {
  var _ref126 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee127(walletId, message, address, signature) {
    return _regenerator["default"].wrap(function _callee127$(_context127) {
      while (1) {
        switch (_context127.prev = _context127.next) {
          case 0:
            _context127.next = 2;
            return self.WORKER_OBJECTS[walletId].verifyMessage(message, address, signature);

          case 2:
            return _context127.abrupt("return", _context127.sent.toJson());

          case 3:
          case "end":
            return _context127.stop();
        }
      }
    }, _callee127);
  }));

  return function (_x245, _x246, _x247, _x248) {
    return _ref126.apply(this, arguments);
  };
}();

self.getTxKey = /*#__PURE__*/function () {
  var _ref127 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee128(walletId, txHash) {
    return _regenerator["default"].wrap(function _callee128$(_context128) {
      while (1) {
        switch (_context128.prev = _context128.next) {
          case 0:
            return _context128.abrupt("return", self.WORKER_OBJECTS[walletId].getTxKey(txHash));

          case 1:
          case "end":
            return _context128.stop();
        }
      }
    }, _callee128);
  }));

  return function (_x249, _x250) {
    return _ref127.apply(this, arguments);
  };
}();

self.checkTxKey = /*#__PURE__*/function () {
  var _ref128 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee129(walletId, txHash, txKey, address) {
    return _regenerator["default"].wrap(function _callee129$(_context129) {
      while (1) {
        switch (_context129.prev = _context129.next) {
          case 0:
            _context129.next = 2;
            return self.WORKER_OBJECTS[walletId].checkTxKey(txHash, txKey, address);

          case 2:
            return _context129.abrupt("return", _context129.sent.toJson());

          case 3:
          case "end":
            return _context129.stop();
        }
      }
    }, _callee129);
  }));

  return function (_x251, _x252, _x253, _x254) {
    return _ref128.apply(this, arguments);
  };
}();

self.getTxProof = /*#__PURE__*/function () {
  var _ref129 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee130(walletId, txHash, address, message) {
    return _regenerator["default"].wrap(function _callee130$(_context130) {
      while (1) {
        switch (_context130.prev = _context130.next) {
          case 0:
            return _context130.abrupt("return", self.WORKER_OBJECTS[walletId].getTxProof(txHash, address, message));

          case 1:
          case "end":
            return _context130.stop();
        }
      }
    }, _callee130);
  }));

  return function (_x255, _x256, _x257, _x258) {
    return _ref129.apply(this, arguments);
  };
}();

self.checkTxProof = /*#__PURE__*/function () {
  var _ref130 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee131(walletId, txHash, address, message, signature) {
    return _regenerator["default"].wrap(function _callee131$(_context131) {
      while (1) {
        switch (_context131.prev = _context131.next) {
          case 0:
            _context131.next = 2;
            return self.WORKER_OBJECTS[walletId].checkTxProof(txHash, address, message, signature);

          case 2:
            return _context131.abrupt("return", _context131.sent.toJson());

          case 3:
          case "end":
            return _context131.stop();
        }
      }
    }, _callee131);
  }));

  return function (_x259, _x260, _x261, _x262, _x263) {
    return _ref130.apply(this, arguments);
  };
}();

self.getSpendProof = /*#__PURE__*/function () {
  var _ref131 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee132(walletId, txHash, message) {
    return _regenerator["default"].wrap(function _callee132$(_context132) {
      while (1) {
        switch (_context132.prev = _context132.next) {
          case 0:
            return _context132.abrupt("return", self.WORKER_OBJECTS[walletId].getSpendProof(txHash, message));

          case 1:
          case "end":
            return _context132.stop();
        }
      }
    }, _callee132);
  }));

  return function (_x264, _x265, _x266) {
    return _ref131.apply(this, arguments);
  };
}();

self.checkSpendProof = /*#__PURE__*/function () {
  var _ref132 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee133(walletId, txHash, message, signature) {
    return _regenerator["default"].wrap(function _callee133$(_context133) {
      while (1) {
        switch (_context133.prev = _context133.next) {
          case 0:
            return _context133.abrupt("return", self.WORKER_OBJECTS[walletId].checkSpendProof(txHash, message, signature));

          case 1:
          case "end":
            return _context133.stop();
        }
      }
    }, _callee133);
  }));

  return function (_x267, _x268, _x269, _x270) {
    return _ref132.apply(this, arguments);
  };
}();

self.getReserveProofWallet = /*#__PURE__*/function () {
  var _ref133 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee134(walletId, message) {
    return _regenerator["default"].wrap(function _callee134$(_context134) {
      while (1) {
        switch (_context134.prev = _context134.next) {
          case 0:
            return _context134.abrupt("return", self.WORKER_OBJECTS[walletId].getReserveProofWallet(message));

          case 1:
          case "end":
            return _context134.stop();
        }
      }
    }, _callee134);
  }));

  return function (_x271, _x272) {
    return _ref133.apply(this, arguments);
  };
}();

self.getReserveProofAccount = /*#__PURE__*/function () {
  var _ref134 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee135(walletId, accountIdx, amountStr, message) {
    return _regenerator["default"].wrap(function _callee135$(_context135) {
      while (1) {
        switch (_context135.prev = _context135.next) {
          case 0:
            return _context135.abrupt("return", self.WORKER_OBJECTS[walletId].getReserveProofAccount(accountIdx, amountStr, message));

          case 1:
          case "end":
            return _context135.stop();
        }
      }
    }, _callee135);
  }));

  return function (_x273, _x274, _x275, _x276) {
    return _ref134.apply(this, arguments);
  };
}();

self.checkReserveProof = /*#__PURE__*/function () {
  var _ref135 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee136(walletId, address, message, signature) {
    return _regenerator["default"].wrap(function _callee136$(_context136) {
      while (1) {
        switch (_context136.prev = _context136.next) {
          case 0:
            _context136.next = 2;
            return self.WORKER_OBJECTS[walletId].checkReserveProof(address, message, signature);

          case 2:
            return _context136.abrupt("return", _context136.sent.toJson());

          case 3:
          case "end":
            return _context136.stop();
        }
      }
    }, _callee136);
  }));

  return function (_x277, _x278, _x279, _x280) {
    return _ref135.apply(this, arguments);
  };
}();

self.getTxNotes = /*#__PURE__*/function () {
  var _ref136 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee137(walletId, txHashes) {
    return _regenerator["default"].wrap(function _callee137$(_context137) {
      while (1) {
        switch (_context137.prev = _context137.next) {
          case 0:
            return _context137.abrupt("return", self.WORKER_OBJECTS[walletId].getTxNotes(txHashes));

          case 1:
          case "end":
            return _context137.stop();
        }
      }
    }, _callee137);
  }));

  return function (_x281, _x282) {
    return _ref136.apply(this, arguments);
  };
}();

self.setTxNotes = /*#__PURE__*/function () {
  var _ref137 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee138(walletId, txHashes, txNotes) {
    return _regenerator["default"].wrap(function _callee138$(_context138) {
      while (1) {
        switch (_context138.prev = _context138.next) {
          case 0:
            return _context138.abrupt("return", self.WORKER_OBJECTS[walletId].setTxNotes(txHashes, txNotes));

          case 1:
          case "end":
            return _context138.stop();
        }
      }
    }, _callee138);
  }));

  return function (_x283, _x284, _x285) {
    return _ref137.apply(this, arguments);
  };
}();

self.getAddressBookEntries = /*#__PURE__*/function () {
  var _ref138 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee139(walletId, entryIndices) {
    var entriesJson, _iterator22, _step22, entry;

    return _regenerator["default"].wrap(function _callee139$(_context139) {
      while (1) {
        switch (_context139.prev = _context139.next) {
          case 0:
            entriesJson = [];
            _context139.t0 = _createForOfIteratorHelper;
            _context139.next = 4;
            return self.WORKER_OBJECTS[walletId].getAddressBookEntries(entryIndices);

          case 4:
            _context139.t1 = _context139.sent;
            _iterator22 = (0, _context139.t0)(_context139.t1);

            try {
              for (_iterator22.s(); !(_step22 = _iterator22.n()).done;) {
                entry = _step22.value;
                entriesJson.push(entry.toJson());
              }
            } catch (err) {
              _iterator22.e(err);
            } finally {
              _iterator22.f();
            }

            return _context139.abrupt("return", entriesJson);

          case 8:
          case "end":
            return _context139.stop();
        }
      }
    }, _callee139);
  }));

  return function (_x286, _x287) {
    return _ref138.apply(this, arguments);
  };
}();

self.addAddressBookEntry = /*#__PURE__*/function () {
  var _ref139 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee140(walletId, address, description) {
    return _regenerator["default"].wrap(function _callee140$(_context140) {
      while (1) {
        switch (_context140.prev = _context140.next) {
          case 0:
            return _context140.abrupt("return", self.WORKER_OBJECTS[walletId].addAddressBookEntry(address, description));

          case 1:
          case "end":
            return _context140.stop();
        }
      }
    }, _callee140);
  }));

  return function (_x288, _x289, _x290) {
    return _ref139.apply(this, arguments);
  };
}();

self.editAddressBookEntry = /*#__PURE__*/function () {
  var _ref140 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee141(walletId, index, setAddress, address, setDescription, description) {
    return _regenerator["default"].wrap(function _callee141$(_context141) {
      while (1) {
        switch (_context141.prev = _context141.next) {
          case 0:
            return _context141.abrupt("return", self.WORKER_OBJECTS[walletId].editAddressBookEntry(index, setAddress, address, setDescription, description));

          case 1:
          case "end":
            return _context141.stop();
        }
      }
    }, _callee141);
  }));

  return function (_x291, _x292, _x293, _x294, _x295, _x296) {
    return _ref140.apply(this, arguments);
  };
}();

self.deleteAddressBookEntry = /*#__PURE__*/function () {
  var _ref141 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee142(walletId, index) {
    return _regenerator["default"].wrap(function _callee142$(_context142) {
      while (1) {
        switch (_context142.prev = _context142.next) {
          case 0:
            return _context142.abrupt("return", self.WORKER_OBJECTS[walletId].deleteAddressBookEntry(index));

          case 1:
          case "end":
            return _context142.stop();
        }
      }
    }, _callee142);
  }));

  return function (_x297, _x298) {
    return _ref141.apply(this, arguments);
  };
}();

self.tagAccounts = /*#__PURE__*/function () {
  var _ref142 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee143(walletId, tag, accountIndices) {
    return _regenerator["default"].wrap(function _callee143$(_context143) {
      while (1) {
        switch (_context143.prev = _context143.next) {
          case 0:
            throw new Error("Not implemented");

          case 1:
          case "end":
            return _context143.stop();
        }
      }
    }, _callee143);
  }));

  return function (_x299, _x300, _x301) {
    return _ref142.apply(this, arguments);
  };
}();

self.untagAccounts = /*#__PURE__*/function () {
  var _ref143 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee144(walletId, accountIndices) {
    return _regenerator["default"].wrap(function _callee144$(_context144) {
      while (1) {
        switch (_context144.prev = _context144.next) {
          case 0:
            throw new Error("Not implemented");

          case 1:
          case "end":
            return _context144.stop();
        }
      }
    }, _callee144);
  }));

  return function (_x302, _x303) {
    return _ref143.apply(this, arguments);
  };
}();

self.getAccountTags = /*#__PURE__*/function () {
  var _ref144 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee145(walletId) {
    return _regenerator["default"].wrap(function _callee145$(_context145) {
      while (1) {
        switch (_context145.prev = _context145.next) {
          case 0:
            throw new Error("Not implemented");

          case 1:
          case "end":
            return _context145.stop();
        }
      }
    }, _callee145);
  }));

  return function (_x304) {
    return _ref144.apply(this, arguments);
  };
}();

self.setAccountTagLabel = /*#__PURE__*/function () {
  var _ref145 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee146(walletId, tag, label) {
    return _regenerator["default"].wrap(function _callee146$(_context146) {
      while (1) {
        switch (_context146.prev = _context146.next) {
          case 0:
            throw new Error("Not implemented");

          case 1:
          case "end":
            return _context146.stop();
        }
      }
    }, _callee146);
  }));

  return function (_x305, _x306, _x307) {
    return _ref145.apply(this, arguments);
  };
}();

self.getPaymentUri = /*#__PURE__*/function () {
  var _ref146 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee147(walletId, configJson) {
    return _regenerator["default"].wrap(function _callee147$(_context147) {
      while (1) {
        switch (_context147.prev = _context147.next) {
          case 0:
            return _context147.abrupt("return", self.WORKER_OBJECTS[walletId].getPaymentUri(new _MoneroTxConfig["default"](configJson)));

          case 1:
          case "end":
            return _context147.stop();
        }
      }
    }, _callee147);
  }));

  return function (_x308, _x309) {
    return _ref146.apply(this, arguments);
  };
}();

self.parsePaymentUri = /*#__PURE__*/function () {
  var _ref147 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee148(walletId, uri) {
    return _regenerator["default"].wrap(function _callee148$(_context148) {
      while (1) {
        switch (_context148.prev = _context148.next) {
          case 0:
            _context148.next = 2;
            return self.WORKER_OBJECTS[walletId].parsePaymentUri(uri);

          case 2:
            return _context148.abrupt("return", _context148.sent.toJson());

          case 3:
          case "end":
            return _context148.stop();
        }
      }
    }, _callee148);
  }));

  return function (_x310, _x311) {
    return _ref147.apply(this, arguments);
  };
}();

self.getAttribute = /*#__PURE__*/function () {
  var _ref148 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee149(walletId, key) {
    return _regenerator["default"].wrap(function _callee149$(_context149) {
      while (1) {
        switch (_context149.prev = _context149.next) {
          case 0:
            return _context149.abrupt("return", self.WORKER_OBJECTS[walletId].getAttribute(key));

          case 1:
          case "end":
            return _context149.stop();
        }
      }
    }, _callee149);
  }));

  return function (_x312, _x313) {
    return _ref148.apply(this, arguments);
  };
}();

self.setAttribute = /*#__PURE__*/function () {
  var _ref149 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee150(walletId, key, value) {
    return _regenerator["default"].wrap(function _callee150$(_context150) {
      while (1) {
        switch (_context150.prev = _context150.next) {
          case 0:
            return _context150.abrupt("return", self.WORKER_OBJECTS[walletId].setAttribute(key, value));

          case 1:
          case "end":
            return _context150.stop();
        }
      }
    }, _callee150);
  }));

  return function (_x314, _x315, _x316) {
    return _ref149.apply(this, arguments);
  };
}();

self.startMining = /*#__PURE__*/function () {
  var _ref150 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee151(walletId, numThreads, backgroundMining, ignoreBattery) {
    return _regenerator["default"].wrap(function _callee151$(_context151) {
      while (1) {
        switch (_context151.prev = _context151.next) {
          case 0:
            return _context151.abrupt("return", self.WORKER_OBJECTS[walletId].startMining(numThreads, backgroundMining, ignoreBattery));

          case 1:
          case "end":
            return _context151.stop();
        }
      }
    }, _callee151);
  }));

  return function (_x317, _x318, _x319, _x320) {
    return _ref150.apply(this, arguments);
  };
}();

self.stopMining = /*#__PURE__*/function () {
  var _ref151 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee152(walletId) {
    return _regenerator["default"].wrap(function _callee152$(_context152) {
      while (1) {
        switch (_context152.prev = _context152.next) {
          case 0:
            return _context152.abrupt("return", self.WORKER_OBJECTS[walletId].stopMining());

          case 1:
          case "end":
            return _context152.stop();
        }
      }
    }, _callee152);
  }));

  return function (_x321) {
    return _ref151.apply(this, arguments);
  };
}();

self.isMultisigImportNeeded = /*#__PURE__*/function () {
  var _ref152 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee153(walletId) {
    return _regenerator["default"].wrap(function _callee153$(_context153) {
      while (1) {
        switch (_context153.prev = _context153.next) {
          case 0:
            return _context153.abrupt("return", self.WORKER_OBJECTS[walletId].isMultisigImportNeeded());

          case 1:
          case "end":
            return _context153.stop();
        }
      }
    }, _callee153);
  }));

  return function (_x322) {
    return _ref152.apply(this, arguments);
  };
}();

self.isMultisig = /*#__PURE__*/function () {
  var _ref153 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee154(walletId) {
    return _regenerator["default"].wrap(function _callee154$(_context154) {
      while (1) {
        switch (_context154.prev = _context154.next) {
          case 0:
            return _context154.abrupt("return", self.WORKER_OBJECTS[walletId].isMultisig());

          case 1:
          case "end":
            return _context154.stop();
        }
      }
    }, _callee154);
  }));

  return function (_x323) {
    return _ref153.apply(this, arguments);
  };
}();

self.getMultisigInfo = /*#__PURE__*/function () {
  var _ref154 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee155(walletId) {
    return _regenerator["default"].wrap(function _callee155$(_context155) {
      while (1) {
        switch (_context155.prev = _context155.next) {
          case 0:
            _context155.next = 2;
            return self.WORKER_OBJECTS[walletId].getMultisigInfo();

          case 2:
            return _context155.abrupt("return", _context155.sent.toJson());

          case 3:
          case "end":
            return _context155.stop();
        }
      }
    }, _callee155);
  }));

  return function (_x324) {
    return _ref154.apply(this, arguments);
  };
}();

self.prepareMultisig = /*#__PURE__*/function () {
  var _ref155 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee156(walletId) {
    return _regenerator["default"].wrap(function _callee156$(_context156) {
      while (1) {
        switch (_context156.prev = _context156.next) {
          case 0:
            return _context156.abrupt("return", self.WORKER_OBJECTS[walletId].prepareMultisig());

          case 1:
          case "end":
            return _context156.stop();
        }
      }
    }, _callee156);
  }));

  return function (_x325) {
    return _ref155.apply(this, arguments);
  };
}();

self.makeMultisig = /*#__PURE__*/function () {
  var _ref156 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee157(walletId, multisigHexes, threshold, password) {
    return _regenerator["default"].wrap(function _callee157$(_context157) {
      while (1) {
        switch (_context157.prev = _context157.next) {
          case 0:
            _context157.next = 2;
            return self.WORKER_OBJECTS[walletId].makeMultisig(multisigHexes, threshold, password);

          case 2:
            return _context157.abrupt("return", _context157.sent);

          case 3:
          case "end":
            return _context157.stop();
        }
      }
    }, _callee157);
  }));

  return function (_x326, _x327, _x328, _x329) {
    return _ref156.apply(this, arguments);
  };
}();

self.exchangeMultisigKeys = /*#__PURE__*/function () {
  var _ref157 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee158(walletId, multisigHexes, password) {
    return _regenerator["default"].wrap(function _callee158$(_context158) {
      while (1) {
        switch (_context158.prev = _context158.next) {
          case 0:
            _context158.next = 2;
            return self.WORKER_OBJECTS[walletId].exchangeMultisigKeys(multisigHexes, password);

          case 2:
            return _context158.abrupt("return", _context158.sent.toJson());

          case 3:
          case "end":
            return _context158.stop();
        }
      }
    }, _callee158);
  }));

  return function (_x330, _x331, _x332) {
    return _ref157.apply(this, arguments);
  };
}();

self.exportMultisigHex = /*#__PURE__*/function () {
  var _ref158 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee159(walletId) {
    return _regenerator["default"].wrap(function _callee159$(_context159) {
      while (1) {
        switch (_context159.prev = _context159.next) {
          case 0:
            return _context159.abrupt("return", self.WORKER_OBJECTS[walletId].exportMultisigHex());

          case 1:
          case "end":
            return _context159.stop();
        }
      }
    }, _callee159);
  }));

  return function (_x333) {
    return _ref158.apply(this, arguments);
  };
}();

self.importMultisigHex = /*#__PURE__*/function () {
  var _ref159 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee160(walletId, multisigHexes) {
    return _regenerator["default"].wrap(function _callee160$(_context160) {
      while (1) {
        switch (_context160.prev = _context160.next) {
          case 0:
            return _context160.abrupt("return", self.WORKER_OBJECTS[walletId].importMultisigHex(multisigHexes));

          case 1:
          case "end":
            return _context160.stop();
        }
      }
    }, _callee160);
  }));

  return function (_x334, _x335) {
    return _ref159.apply(this, arguments);
  };
}();

self.signMultisigTxHex = /*#__PURE__*/function () {
  var _ref160 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee161(walletId, multisigTxHex) {
    return _regenerator["default"].wrap(function _callee161$(_context161) {
      while (1) {
        switch (_context161.prev = _context161.next) {
          case 0:
            _context161.next = 2;
            return self.WORKER_OBJECTS[walletId].signMultisigTxHex(multisigTxHex);

          case 2:
            return _context161.abrupt("return", _context161.sent.toJson());

          case 3:
          case "end":
            return _context161.stop();
        }
      }
    }, _callee161);
  }));

  return function (_x336, _x337) {
    return _ref160.apply(this, arguments);
  };
}();

self.submitMultisigTxHex = /*#__PURE__*/function () {
  var _ref161 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee162(walletId, signedMultisigTxHex) {
    return _regenerator["default"].wrap(function _callee162$(_context162) {
      while (1) {
        switch (_context162.prev = _context162.next) {
          case 0:
            return _context162.abrupt("return", self.WORKER_OBJECTS[walletId].submitMultisigTxHex(signedMultisigTxHex));

          case 1:
          case "end":
            return _context162.stop();
        }
      }
    }, _callee162);
  }));

  return function (_x338, _x339) {
    return _ref161.apply(this, arguments);
  };
}();

self.getData = /*#__PURE__*/function () {
  var _ref162 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee163(walletId) {
    return _regenerator["default"].wrap(function _callee163$(_context163) {
      while (1) {
        switch (_context163.prev = _context163.next) {
          case 0:
            return _context163.abrupt("return", self.WORKER_OBJECTS[walletId].getData());

          case 1:
          case "end":
            return _context163.stop();
        }
      }
    }, _callee163);
  }));

  return function (_x340) {
    return _ref162.apply(this, arguments);
  };
}();

self.changePassword = /*#__PURE__*/function () {
  var _ref163 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee164(walletId, oldPassword, newPassword) {
    return _regenerator["default"].wrap(function _callee164$(_context164) {
      while (1) {
        switch (_context164.prev = _context164.next) {
          case 0:
            return _context164.abrupt("return", self.WORKER_OBJECTS[walletId].changePassword(oldPassword, newPassword));

          case 1:
          case "end":
            return _context164.stop();
        }
      }
    }, _callee164);
  }));

  return function (_x341, _x342, _x343) {
    return _ref163.apply(this, arguments);
  };
}();

self.isClosed = /*#__PURE__*/function () {
  var _ref164 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee165(walletId) {
    return _regenerator["default"].wrap(function _callee165$(_context165) {
      while (1) {
        switch (_context165.prev = _context165.next) {
          case 0:
            return _context165.abrupt("return", self.WORKER_OBJECTS[walletId].isClosed());

          case 1:
          case "end":
            return _context165.stop();
        }
      }
    }, _callee165);
  }));

  return function (_x344) {
    return _ref164.apply(this, arguments);
  };
}();

self.close = /*#__PURE__*/function () {
  var _ref165 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee166(walletId, save) {
    return _regenerator["default"].wrap(function _callee166$(_context166) {
      while (1) {
        switch (_context166.prev = _context166.next) {
          case 0:
            return _context166.abrupt("return", self.WORKER_OBJECTS[walletId].close(save));

          case 1:
          case "end":
            return _context166.stop();
        }
      }
    }, _callee166);
  }));

  return function (_x345, _x346) {
    return _ref165.apply(this, arguments);
  };
}();