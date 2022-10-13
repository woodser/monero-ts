"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _assert = _interopRequireDefault(require("assert"));

var _GenUtils = _interopRequireDefault(require("./GenUtils"));

var _MoneroError = _interopRequireDefault(require("./MoneroError"));

var _ThreadPool = _interopRequireDefault(require("./ThreadPool"));

var _path = _interopRequireDefault(require("path"));

/**
 * Collection of helper utilities for the library.
 * 
 * @hideconstructor
 */
var LibraryUtils = /*#__PURE__*/function () {
  function LibraryUtils() {
    (0, _classCallCheck2["default"])(this, LibraryUtils);
  }

  (0, _createClass2["default"])(LibraryUtils, null, [{
    key: "log",
    value:
    /**
     * Log a message.
     *
     * @param {number} level - log level of the message
     * @param {string} msg - message to log
     */
    function log(level, msg) {
      (0, _assert["default"])(level === parseInt(level, 10) && level >= 0, "Log level must be an integer >= 0");
      if (LibraryUtils.LOG_LEVEL >= level) console.log(msg);
    }
    /**
     * Set the library's log level with 0 being least verbose.
     *
     * @param {number} level - the library's log level
     */

  }, {
    key: "setLogLevel",
    value: function () {
      var _setLogLevel = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(level) {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                (0, _assert["default"])(level === parseInt(level, 10) && level >= 0, "Log level must be an integer >= 0");
                LibraryUtils.LOG_LEVEL = level;

                if (!LibraryUtils.WORKER) {
                  _context.next = 5;
                  break;
                }

                _context.next = 5;
                return LibraryUtils.invokeWorker(_GenUtils["default"].getUUID(), "setLogLevel", [level]);

              case 5:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      function setLogLevel(_x) {
        return _setLogLevel.apply(this, arguments);
      }

      return setLogLevel;
    }()
    /**
     * Get the library's log level.
     *
     * @return {int} the library's log level
     */

  }, {
    key: "getLogLevel",
    value: function getLogLevel() {
      return LibraryUtils.LOG_LEVEL;
    }
    /**
     * Get the total memory used by WebAssembly.
     * 
     * @return {int} the total memory used by WebAssembly
     */

  }, {
    key: "getWasmMemoryUsed",
    value: function () {
      var _getWasmMemoryUsed = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        var total;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                total = 0;

                if (!LibraryUtils.WORKER) {
                  _context2.next = 6;
                  break;
                }

                _context2.t0 = total;
                _context2.next = 5;
                return LibraryUtils.invokeWorker(_GenUtils["default"].getUUID(), "getWasmMemoryUsed", []);

              case 5:
                total = _context2.t0 += _context2.sent;

              case 6:
                if (LibraryUtils.getWasmModule() && LibraryUtils.getWasmModule().HEAP8) total += LibraryUtils.getWasmModule().HEAP8.length;
                return _context2.abrupt("return", total);

              case 8:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function getWasmMemoryUsed() {
        return _getWasmMemoryUsed.apply(this, arguments);
      }

      return getWasmMemoryUsed;
    }()
    /**
     * Get the WebAssembly module in the current context (nodejs, browser main thread or worker).
     */

  }, {
    key: "getWasmModule",
    value: function getWasmModule() {
      return LibraryUtils.WASM_MODULE;
    }
    /**
     * Load the WebAssembly keys module with caching.
     */

  }, {
    key: "loadKeysModule",
    value: function () {
      var _loadKeysModule = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                if (!LibraryUtils.WASM_MODULE) {
                  _context3.next = 2;
                  break;
                }

                return _context3.abrupt("return", LibraryUtils.WASM_MODULE);

              case 2:
                // load module
                delete LibraryUtils.WASM_MODULE;
                LibraryUtils.WASM_MODULE = require("../../../../dist/monero_wallet_keys")();
                return _context3.abrupt("return", new Promise(function (resolve, reject) {
                  LibraryUtils.WASM_MODULE.then(function (module) {
                    LibraryUtils.WASM_MODULE = module;
                    delete LibraryUtils.WASM_MODULE.then;

                    LibraryUtils._initWasmModule(LibraryUtils.WASM_MODULE);

                    resolve(LibraryUtils.WASM_MODULE);
                  });
                }));

              case 5:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      function loadKeysModule() {
        return _loadKeysModule.apply(this, arguments);
      }

      return loadKeysModule;
    }()
    /**
     * Load the WebAssembly full module with caching.
     * 
     * The full module is a superset of the keys module and overrides it.
     * 
     * TODO: this is separate static function from loadKeysModule() because webpack cannot bundle worker using runtime param for conditional import
     */

  }, {
    key: "loadFullModule",
    value: function () {
      var _loadFullModule = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (!(LibraryUtils.WASM_MODULE && LibraryUtils.FULL_LOADED)) {
                  _context4.next = 2;
                  break;
                }

                return _context4.abrupt("return", LibraryUtils.WASM_MODULE);

              case 2:
                // load module
                delete LibraryUtils.WASM_MODULE;
                LibraryUtils.WASM_MODULE = require("../../../../dist/monero_wallet_full")();
                return _context4.abrupt("return", new Promise(function (resolve, reject) {
                  LibraryUtils.WASM_MODULE.then(function (module) {
                    LibraryUtils.WASM_MODULE = module;
                    delete LibraryUtils.WASM_MODULE.then;
                    LibraryUtils.FULL_LOADED = true;

                    LibraryUtils._initWasmModule(LibraryUtils.WASM_MODULE);

                    resolve(LibraryUtils.WASM_MODULE);
                  });
                }));

              case 5:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      function loadFullModule() {
        return _loadFullModule.apply(this, arguments);
      }

      return loadFullModule;
    }()
    /**
     * Register a function by id which informs if unauthorized requests (e.g.
     * self-signed certificates) should be rejected.
     * 
     * @param {string} fnId - unique identifier for the function
     * @param {function} fn - function to inform if unauthorized requests should be rejected
     */

  }, {
    key: "setRejectUnauthorizedFn",
    value: function setRejectUnauthorizedFn(fnId, fn) {
      if (!LibraryUtils.REJECT_UNAUTHORIZED_FNS) LibraryUtils.REJECT_UNAUTHORIZED_FNS = [];
      if (fn === undefined) delete LibraryUtils.REJECT_UNAUTHORIZED_FNS[fnId];else LibraryUtils.REJECT_UNAUTHORIZED_FNS[fnId] = fn;
    }
    /**
     * Indicate if unauthorized requests should be rejected.
     * 
     * @param {string} fnId - uniquely identifies the function
     */

  }, {
    key: "isRejectUnauthorized",
    value: function isRejectUnauthorized(fnId) {
      if (!LibraryUtils.REJECT_UNAUTHORIZED_FNS[fnId]) throw new Error("No function registered with id " + fnId + " to inform if unauthorized reqs should be rejected");
      return LibraryUtils.REJECT_UNAUTHORIZED_FNS[fnId]();
    }
    /**
     * Set the path to load the worker. Defaults to "/monero_web_worker.js" in the browser
     * and "./MoneroWebWorker.js" in node.
     * 
     * @param {string} workerDistPath - path to load the worker
     */

  }, {
    key: "setWorkerDistPath",
    value: function setWorkerDistPath(workerDistPath) {
      var path = LibraryUtils._prefixWindowsPath(workerDistPath ? workerDistPath : LibraryUtils.WORKER_DIST_PATH_DEFAULT);

      if (path !== LibraryUtils.WORKER_DIST_PATH) delete LibraryUtils.WORKER;
      LibraryUtils.WORKER_DIST_PATH = path;
    }
    /**
     * Get a singleton instance of a worker to share.
     * 
     * @return {Worker} a worker to share among wallet instances
     */

  }, {
    key: "getWorker",
    value: function () {
      var _getWorker = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
        var _Worker;

        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (LibraryUtils.WORKER) {
                  _context5.next = 7;
                  break;
                }

                if (_GenUtils["default"].isBrowser()) {
                  LibraryUtils.WORKER = new Worker(LibraryUtils.WORKER_DIST_PATH);
                } else {
                  _Worker = require("web-worker"); // import web worker if nodejs

                  LibraryUtils.WORKER = new _Worker(LibraryUtils.WORKER_DIST_PATH);
                }

                LibraryUtils.WORKER_OBJECTS = {}; // store per object running in the worker
                // receive worker errors

                LibraryUtils.WORKER.onerror = function (err) {
                  console.error("Error posting message to MoneroWebWorker.js; is it copied to the app's build directory (e.g. in the root)?");
                  console.log(err);
                }; // receive worker messages


                LibraryUtils.WORKER.onmessage = function (e) {
                  // lookup object id, callback function, and this arg
                  var thisArg = null;
                  var callbackFn = LibraryUtils.WORKER_OBJECTS[e.data[0]].callbacks[e.data[1]]; // look up by object id then by function name

                  if (callbackFn === undefined) throw new Error("No worker callback function defined for key '" + e.data[1] + "'");

                  if (callbackFn instanceof Array) {
                    // this arg may be stored with callback function
                    thisArg = callbackFn[1];
                    callbackFn = callbackFn[0];
                  } // invoke callback function with this arg and arguments


                  callbackFn.apply(thisArg, e.data.slice(2));
                }; // set worker log level


                _context5.next = 7;
                return LibraryUtils.setLogLevel(LibraryUtils.getLogLevel());

              case 7:
                return _context5.abrupt("return", LibraryUtils.WORKER);

              case 8:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }));

      function getWorker() {
        return _getWorker.apply(this, arguments);
      }

      return getWorker;
    }()
    /**
     * Invoke a worker function and get the result with error handling.
     * 
     * @param {objectId} identifies the worker object to invoke
     * @param {string} fnName is the name of the function to invoke
     * @param {Object[]} args are function arguments to invoke with
     * @return {Promise} resolves with response payload from the worker or an error
     */

  }, {
    key: "invokeWorker",
    value: function () {
      var _invokeWorker = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6(objectId, fnName, args) {
        var worker;
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                (0, _assert["default"])(fnName.length >= 2);
                _context6.next = 3;
                return LibraryUtils.getWorker();

              case 3:
                worker = _context6.sent;
                if (!LibraryUtils.WORKER_OBJECTS[objectId]) LibraryUtils.WORKER_OBJECTS[objectId] = {
                  callbacks: {}
                };
                return _context6.abrupt("return", new Promise(function (resolve, reject) {
                  var callbackId = _GenUtils["default"].getUUID();

                  LibraryUtils.WORKER_OBJECTS[objectId].callbacks[callbackId] = function (resp) {
                    // TODO: this defines function once per callback
                    resp ? resp.error ? reject(new _MoneroError["default"](resp.error)) : resolve(resp.result) : resolve();
                  };

                  worker.postMessage([objectId, fnName, callbackId].concat(args === undefined ? [] : _GenUtils["default"].listify(args)));
                }));

              case 6:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6);
      }));

      function invokeWorker(_x2, _x3, _x4) {
        return _invokeWorker.apply(this, arguments);
      }

      return invokeWorker;
    }() // ------------------------------ PRIVATE HELPERS ---------------------------

  }, {
    key: "_initWasmModule",
    value: function _initWasmModule(wasmModule) {
      wasmModule.taskQueue = new _ThreadPool["default"](1);

      wasmModule.queueTask = /*#__PURE__*/function () {
        var _ref = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(asyncFn) {
          return _regenerator["default"].wrap(function _callee7$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  return _context7.abrupt("return", wasmModule.taskQueue.submit(asyncFn));

                case 1:
                case "end":
                  return _context7.stop();
              }
            }
          }, _callee7);
        }));

        return function (_x5) {
          return _ref.apply(this, arguments);
        };
      }();
    }
  }, {
    key: "_prefixWindowsPath",
    value: function _prefixWindowsPath(path) {
      if (path.indexOf("C:") == 0 && path.indexOf("file://") == -1) path = "file://" + path; // prepend C: paths with file://

      return path;
    }
  }]);
  return LibraryUtils;
}();

LibraryUtils.LOG_LEVEL = 0;
LibraryUtils.WORKER_DIST_PATH_DEFAULT = _GenUtils["default"].isBrowser() ? "/monero_web_worker.js" : function () {
  return LibraryUtils._prefixWindowsPath(_path["default"].join(__dirname, "./MoneroWebWorker.js"));
}();
LibraryUtils.WORKER_DIST_PATH = LibraryUtils.WORKER_DIST_PATH_DEFAULT;
var _default = LibraryUtils;
exports["default"] = _default;