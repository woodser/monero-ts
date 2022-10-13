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

/**
 * Run a task in a fixed period loop.
 */
var TaskLooper = /*#__PURE__*/function () {
  /**
   * Build the looper with a function to invoke on a fixed period loop.
   * 
   * @param {function} fn - the function to invoke
   */
  function TaskLooper(fn) {
    (0, _classCallCheck2["default"])(this, TaskLooper);
    this.fn = fn;
  }
  /**
   * Start the task loop.
   * 
   * @param {number} periodInMs the loop period in milliseconds
   */


  (0, _createClass2["default"])(TaskLooper, [{
    key: "start",
    value: function start(periodInMs) {
      this.periodInMs = periodInMs;
      if (this.isStarted) return;
      this.isStarted = true; // start looping

      this._runLoop();
    }
    /**
     * Stop the task loop.
     */

  }, {
    key: "stop",
    value: function stop() {
      this.isStarted = false;
    }
    /**
     * Set the loop period in milliseconds.
     * 
     * @param {int} periodInMs the loop period in milliseconds
     */

  }, {
    key: "setPeriodInMs",
    value: function setPeriodInMs(periodInMs) {
      this.periodInMs = periodInMs;
    }
  }, {
    key: "_runLoop",
    value: function () {
      var _runLoop2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
        var _this = this;

        var that, _loop;

        return _regenerator["default"].wrap(function _callee$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                if (!this.isLooping) {
                  _context2.next = 2;
                  break;
                }

                return _context2.abrupt("return");

              case 2:
                this.isLooping = true;
                that = this;
                _loop = /*#__PURE__*/_regenerator["default"].mark(function _loop() {
                  var startTime;
                  return _regenerator["default"].wrap(function _loop$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          startTime = Date.now();
                          _context.next = 3;
                          return _this.fn();

                        case 3:
                          if (!_this.isStarted) {
                            _context.next = 6;
                            break;
                          }

                          _context.next = 6;
                          return new Promise(function (resolve) {
                            setTimeout(resolve, that.periodInMs - (Date.now() - startTime));
                          });

                        case 6:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _loop);
                });

              case 5:
                if (!this.isStarted) {
                  _context2.next = 9;
                  break;
                }

                return _context2.delegateYield(_loop(), "t0", 7);

              case 7:
                _context2.next = 5;
                break;

              case 9:
                this.isLooping = false;

              case 10:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee, this);
      }));

      function _runLoop() {
        return _runLoop2.apply(this, arguments);
      }

      return _runLoop;
    }()
  }]);
  return TaskLooper;
}();

var _default = TaskLooper;
exports["default"] = _default;