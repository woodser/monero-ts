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

var _GenUtils = _interopRequireDefault(require("./GenUtils"));

var _async = _interopRequireDefault(require("async"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/**
 * Simple thread pool using the async library.
 */
var ThreadPool = /*#__PURE__*/function () {
  /**
   * Construct the thread pool.
   * 
   * @param {number} [maxConcurrency] - maximum number of threads in the pool (default 1)
   */
  function ThreadPool(maxConcurrency) {
    (0, _classCallCheck2["default"])(this, ThreadPool);
    if (maxConcurrency === undefined) maxConcurrency = 1;
    if (maxConcurrency < 1) throw new Error("Max concurrency must be greater than or equal to 1"); // manager concurrency with async queue
    //import async from "async";

    this.taskQueue = _async["default"].queue(function (asyncFn, callback) {
      if (asyncFn.then) asyncFn.then(function (resp) {
        callback(resp);
      })["catch"](function (err) {
        callback(undefined, err);
      });else asyncFn().then(function (resp) {
        callback(resp);
      })["catch"](function (err) {
        callback(undefined, err);
      });
    }, maxConcurrency); // use drain listeners to support await all

    var that = this;
    this.drainListeners = [];

    this.taskQueue.drain = function () {
      var _iterator = _createForOfIteratorHelper(that.drainListeners),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var listener = _step.value;
          listener();
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }
    };
  }
  /**
   * Submit an asynchronous function to run using the thread pool.
   * 
   * @param {function} asyncFn - asynchronous function to run with the thread pool
   * @return {Promise} resolves when the function completes execution
   */


  (0, _createClass2["default"])(ThreadPool, [{
    key: "submit",
    value: function () {
      var _submit = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(asyncFn) {
        var that;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                that = this;
                return _context.abrupt("return", new Promise(function (resolve, reject) {
                  that.taskQueue.push(asyncFn, function (resp, err) {
                    if (err !== undefined) reject(err);else resolve(resp);
                  });
                }));

              case 2:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function submit(_x) {
        return _submit.apply(this, arguments);
      }

      return submit;
    }()
    /**
     * Await all functions to complete.
     * 
     * @return {Promise} resolves when all functions complete
     */

  }, {
    key: "awaitAll",
    value: function () {
      var _awaitAll = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
        var that;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!(this.taskQueue.length === 0)) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt("return");

              case 2:
                that = this;
                return _context2.abrupt("return", new Promise(function (resolve) {
                  that.drainListeners.push(function () {
                    _GenUtils["default"].remove(that.drainListeners, this);

                    resolve();
                  });
                }));

              case 4:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function awaitAll() {
        return _awaitAll.apply(this, arguments);
      }

      return awaitAll;
    }()
  }]);
  return ThreadPool;
}();

var _default = ThreadPool;
exports["default"] = _default;