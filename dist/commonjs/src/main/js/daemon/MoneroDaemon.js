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

var _MoneroError = _interopRequireDefault(require("../common/MoneroError"));

var _MoneroNetworkType = _interopRequireDefault(require("./model/MoneroNetworkType"));

var _assert = _interopRequireDefault(require("assert"));

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
 * Monero daemon interface and default implementations.
 * 
 * @interface
 */
var MoneroDaemon = /*#__PURE__*/function () {
  function MoneroDaemon() {
    (0, _classCallCheck2["default"])(this, MoneroDaemon);
  }

  (0, _createClass2["default"])(MoneroDaemon, [{
    key: "addListener",
    value:
    /**
     * Register a listener to receive daemon notifications.
     * 
     * @param {MoneroDaemonListener} listener - listener to receive daemon notifications
     */
    function () {
      var _addListener = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(listener) {
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context.stop();
            }
          }
        }, _callee);
      }));

      function addListener(_x) {
        return _addListener.apply(this, arguments);
      }

      return addListener;
    }()
    /**
     * Unregister a listener to receive daemon notifications.
     * 
     * @param {MoneroDaemonListener} listener - listener to unregister
     */

  }, {
    key: "removeListener",
    value: function () {
      var _removeListener = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2(listener) {
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2);
      }));

      function removeListener(_x2) {
        return _removeListener.apply(this, arguments);
      }

      return removeListener;
    }()
    /**
     * Get the listeners registered with the daemon.
     * 
     * @return {MoneroDaemonListener[]} the registered listeners
     */

  }, {
    key: "getListeners",
    value: function getListeners() {
      throw new _MoneroError["default"]("Subclass must implement");
    }
    /**
     * Indicates if the client is connected to the daemon via RPC.
     * 
     * @return {boolean} true if the client is connected to the daemon, false otherwise
     */

  }, {
    key: "isConnected",
    value: function () {
      var _isConnected = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      function isConnected() {
        return _isConnected.apply(this, arguments);
      }

      return isConnected;
    }()
    /**
     * Gets the version of the daemon.
     * 
     * @return {MoneroVersion} the version of the daemon
     */

  }, {
    key: "getVersion",
    value: function () {
      var _getVersion = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4);
      }));

      function getVersion() {
        return _getVersion.apply(this, arguments);
      }

      return getVersion;
    }()
    /**
     * Indicates if the daemon is trusted xor untrusted.
     * 
     * @return {boolean} true if the daemon is trusted, false otherwise
     */

  }, {
    key: "isTrusted",
    value: function () {
      var _isTrusted = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }));

      function isTrusted() {
        return _isTrusted.apply(this, arguments);
      }

      return isTrusted;
    }()
    /**
     * Get the number of blocks in the longest chain known to the node.
     * 
     * @return {int} the number of blocks
     */

  }, {
    key: "getHeight",
    value: function () {
      var _getHeight = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
        return _regenerator["default"].wrap(function _callee6$(_context6) {
          while (1) {
            switch (_context6.prev = _context6.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context6.stop();
            }
          }
        }, _callee6);
      }));

      function getHeight() {
        return _getHeight.apply(this, arguments);
      }

      return getHeight;
    }()
    /**
     * Get a block's hash by its height.
     * 
     * @param {number} height - height of the block hash to get
     * @return {string} the block's hash at the given height
     */

  }, {
    key: "getBlockHash",
    value: function () {
      var _getBlockHash = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7(height) {
        return _regenerator["default"].wrap(function _callee7$(_context7) {
          while (1) {
            switch (_context7.prev = _context7.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context7.stop();
            }
          }
        }, _callee7);
      }));

      function getBlockHash(_x3) {
        return _getBlockHash.apply(this, arguments);
      }

      return getBlockHash;
    }()
    /**
     * Get a block template for mining a new block.
     * 
     * @param {string} walletAddress - address of the wallet to receive miner transactions if block is successfully mined
     * @param {number} [reserveSize] - reserve size (optional)
     * @return {MoneroBlockTemplate} is a block template for mining a new block
     */

  }, {
    key: "getBlockTemplate",
    value: function () {
      var _getBlockTemplate = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8(walletAddress, reserveSize) {
        return _regenerator["default"].wrap(function _callee8$(_context8) {
          while (1) {
            switch (_context8.prev = _context8.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context8.stop();
            }
          }
        }, _callee8);
      }));

      function getBlockTemplate(_x4, _x5) {
        return _getBlockTemplate.apply(this, arguments);
      }

      return getBlockTemplate;
    }()
    /**
     * Get the last block's header.
     * 
     * @return {MoneroBlockHeader} last block's header
     */

  }, {
    key: "getLastBlockHeader",
    value: function () {
      var _getLastBlockHeader = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9() {
        return _regenerator["default"].wrap(function _callee9$(_context9) {
          while (1) {
            switch (_context9.prev = _context9.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context9.stop();
            }
          }
        }, _callee9);
      }));

      function getLastBlockHeader() {
        return _getLastBlockHeader.apply(this, arguments);
      }

      return getLastBlockHeader;
    }()
    /**
     * Get a block header by its hash.
     * 
     * @param {string} blockHash - hash of the block to get the header of
     * @return {MoneroBlockHeader} block's header
     */

  }, {
    key: "getBlockHeaderByHash",
    value: function () {
      var _getBlockHeaderByHash = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10(blockHash) {
        return _regenerator["default"].wrap(function _callee10$(_context10) {
          while (1) {
            switch (_context10.prev = _context10.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context10.stop();
            }
          }
        }, _callee10);
      }));

      function getBlockHeaderByHash(_x6) {
        return _getBlockHeaderByHash.apply(this, arguments);
      }

      return getBlockHeaderByHash;
    }()
    /**
     * Get a block header by its height.
     * 
     * @param {number} height - height of the block to get the header of
     * @return {MoneroBlockHeader} block's header
     */

  }, {
    key: "getBlockHeaderByHeight",
    value: function () {
      var _getBlockHeaderByHeight = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11(height) {
        return _regenerator["default"].wrap(function _callee11$(_context11) {
          while (1) {
            switch (_context11.prev = _context11.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context11.stop();
            }
          }
        }, _callee11);
      }));

      function getBlockHeaderByHeight(_x7) {
        return _getBlockHeaderByHeight.apply(this, arguments);
      }

      return getBlockHeaderByHeight;
    }()
    /**
     * Get block headers for the given range.
     * 
     * @param {number} [startHeight] - start height lower bound inclusive (optional)
     * @param {number} [endHeight] - end height upper bound inclusive (optional)
     * @return {MoneroBlockHeader[]} for the given range
     */

  }, {
    key: "getBlockHeadersByRange",
    value: function () {
      var _getBlockHeadersByRange = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee12(startHeight, endHeight) {
        return _regenerator["default"].wrap(function _callee12$(_context12) {
          while (1) {
            switch (_context12.prev = _context12.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context12.stop();
            }
          }
        }, _callee12);
      }));

      function getBlockHeadersByRange(_x8, _x9) {
        return _getBlockHeadersByRange.apply(this, arguments);
      }

      return getBlockHeadersByRange;
    }()
    /**
     * Get a block by hash.
     * 
     * @param {string} blockHash - hash of the block to get
     * @return {MoneroBlock} with the given hash
     */

  }, {
    key: "getBlockByHash",
    value: function () {
      var _getBlockByHash = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee13(blockHash) {
        return _regenerator["default"].wrap(function _callee13$(_context13) {
          while (1) {
            switch (_context13.prev = _context13.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context13.stop();
            }
          }
        }, _callee13);
      }));

      function getBlockByHash(_x10) {
        return _getBlockByHash.apply(this, arguments);
      }

      return getBlockByHash;
    }()
    /**
     * Get blocks by hash.
     * 
     * @param {string[]} blockHashes - array of hashes; first 10 blocks hashes goes sequential,
     *        next goes in pow(2,n) offset, like 2, 4, 8, 16, 32, 64 and so on,
     *        and the last one is always genesis block
     * @param {number} startHeight - start height to get blocks by hash
     * @param {boolean} [prune] - specifies if returned blocks should be pruned (defaults to false)  // TODO: test default
     * @return {MoneroBlock[]} retrieved blocks
     */

  }, {
    key: "getBlocksByHash",
    value: function () {
      var _getBlocksByHash = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee14(blockHashes, startHeight, prune) {
        return _regenerator["default"].wrap(function _callee14$(_context14) {
          while (1) {
            switch (_context14.prev = _context14.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context14.stop();
            }
          }
        }, _callee14);
      }));

      function getBlocksByHash(_x11, _x12, _x13) {
        return _getBlocksByHash.apply(this, arguments);
      }

      return getBlocksByHash;
    }()
    /**
     * Get a block by height.
     * 
     * @param {number} height - height of the block to get
     * @return {MoneroBlock} with the given height
     */

  }, {
    key: "getBlockByHeight",
    value: function () {
      var _getBlockByHeight = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee15(height) {
        return _regenerator["default"].wrap(function _callee15$(_context15) {
          while (1) {
            switch (_context15.prev = _context15.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context15.stop();
            }
          }
        }, _callee15);
      }));

      function getBlockByHeight(_x14) {
        return _getBlockByHeight.apply(this, arguments);
      }

      return getBlockByHeight;
    }()
    /**
     * Get blocks at the given heights.
     * 
     * @param {int[]} heights - heights of the blocks to get
     * @return {MoneroBlock[]} are blocks at the given heights
     */

  }, {
    key: "getBlocksByHeight",
    value: function () {
      var _getBlocksByHeight = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee16(heights) {
        return _regenerator["default"].wrap(function _callee16$(_context16) {
          while (1) {
            switch (_context16.prev = _context16.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context16.stop();
            }
          }
        }, _callee16);
      }));

      function getBlocksByHeight(_x15) {
        return _getBlocksByHeight.apply(this, arguments);
      }

      return getBlocksByHeight;
    }()
    /**
     * Get blocks in the given height range.
     * 
     * @param {number} [startHeight] - start height lower bound inclusive (optional)
     * @param {number} [endHeight] - end height upper bound inclusive (optional)
     * @return {MoneroBlock[]} are blocks in the given height range
     */

  }, {
    key: "getBlocksByRange",
    value: function () {
      var _getBlocksByRange = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee17(startHeight, endHeight) {
        return _regenerator["default"].wrap(function _callee17$(_context17) {
          while (1) {
            switch (_context17.prev = _context17.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context17.stop();
            }
          }
        }, _callee17);
      }));

      function getBlocksByRange(_x16, _x17) {
        return _getBlocksByRange.apply(this, arguments);
      }

      return getBlocksByRange;
    }()
    /**
     * Get blocks in the given height range as chunked requests so that each request is
     * not too big.
     * 
     * @param {number} [startHeight] - start height lower bound inclusive (optional)
     * @param {number} [endHeight] - end height upper bound inclusive (optional)
     * @param {number} [maxChunkSize] - maximum chunk size in any one request (default 3,000,000 bytes)
     * @return {MoneroBlock[]} blocks in the given height range
     */

  }, {
    key: "getBlocksByRangeChunked",
    value: function () {
      var _getBlocksByRangeChunked = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee18(startHeight, endHeight, maxChunkSize) {
        return _regenerator["default"].wrap(function _callee18$(_context18) {
          while (1) {
            switch (_context18.prev = _context18.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context18.stop();
            }
          }
        }, _callee18);
      }));

      function getBlocksByRangeChunked(_x18, _x19, _x20) {
        return _getBlocksByRangeChunked.apply(this, arguments);
      }

      return getBlocksByRangeChunked;
    }()
    /**
     * Get block hashes as a binary request to the daemon.
     * 
     * @param {string[]} blockHashes - specify block hashes to fetch; first 10 blocks hash goes
     *        sequential, next goes in pow(2,n) offset, like 2, 4, 8, 16, 32, 64
     *        and so on, and the last one is always genesis block
     * @param {number} startHeight - starting height of block hashes to return
     * @return {string[]} requested block hashes     
     */

  }, {
    key: "getBlockHashes",
    value: function () {
      var _getBlockHashes = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee19(blockHashes, startHeight) {
        return _regenerator["default"].wrap(function _callee19$(_context19) {
          while (1) {
            switch (_context19.prev = _context19.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context19.stop();
            }
          }
        }, _callee19);
      }));

      function getBlockHashes(_x21, _x22) {
        return _getBlockHashes.apply(this, arguments);
      }

      return getBlockHashes;
    }()
    /**
     * Get a transaction by hash.
     * 
     * @param {string} txHash - hash of the transaction to get
     * @param {boolean} [prune] - specifies if the returned tx should be pruned (defaults to false)
     * @return {MoneroTx} transaction with the given hash
     */

  }, {
    key: "getTx",
    value: function () {
      var _getTx = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee20(txHash) {
        var prune,
            _args20 = arguments;
        return _regenerator["default"].wrap(function _callee20$(_context20) {
          while (1) {
            switch (_context20.prev = _context20.next) {
              case 0:
                prune = _args20.length > 1 && _args20[1] !== undefined ? _args20[1] : false;
                _context20.next = 3;
                return this.getTxs([txHash], prune);

              case 3:
                return _context20.abrupt("return", _context20.sent[0]);

              case 4:
              case "end":
                return _context20.stop();
            }
          }
        }, _callee20, this);
      }));

      function getTx(_x23) {
        return _getTx.apply(this, arguments);
      }

      return getTx;
    }()
    /**
     * Get transactions by hashes.
     * 
     * @param {string[]} txHashes - hashes of transactions to get
     * @param {boolean} [prune] - specifies if the returned txs should be pruned (defaults to false)
     * @return {MoneroTx[]} transactions with the given hashes
     */

  }, {
    key: "getTxs",
    value: function () {
      var _getTxs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee21(txHashes) {
        var prune,
            _args21 = arguments;
        return _regenerator["default"].wrap(function _callee21$(_context21) {
          while (1) {
            switch (_context21.prev = _context21.next) {
              case 0:
                prune = _args21.length > 1 && _args21[1] !== undefined ? _args21[1] : false;
                throw new _MoneroError["default"]("Subclass must implement");

              case 2:
              case "end":
                return _context21.stop();
            }
          }
        }, _callee21);
      }));

      function getTxs(_x24) {
        return _getTxs.apply(this, arguments);
      }

      return getTxs;
    }()
    /**
     * Get a transaction hex by hash.
     * 
     * @param {string} txHash - hash of the transaction to get hex from
     * @param {boolean} [prune] - specifies if the returned tx hex should be pruned (defaults to false)
     * @return {string} tx hex with the given hash
     */

  }, {
    key: "getTxHex",
    value: function () {
      var _getTxHex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee22(txHash) {
        var prune,
            _args22 = arguments;
        return _regenerator["default"].wrap(function _callee22$(_context22) {
          while (1) {
            switch (_context22.prev = _context22.next) {
              case 0:
                prune = _args22.length > 1 && _args22[1] !== undefined ? _args22[1] : false;
                _context22.next = 3;
                return this.getTxHexes([txHash], prune);

              case 3:
                return _context22.abrupt("return", _context22.sent[0]);

              case 4:
              case "end":
                return _context22.stop();
            }
          }
        }, _callee22, this);
      }));

      function getTxHex(_x25) {
        return _getTxHex.apply(this, arguments);
      }

      return getTxHex;
    }()
    /**
     * Get transaction hexes by hashes.
     * 
     * @param {string[]} txHashes - hashes of transactions to get hexes from
     * @param {boolean} [prune] - specifies if the returned tx hexes should be pruned (defaults to false)
     * @return {string[]} tx hexes
     */

  }, {
    key: "getTxHexes",
    value: function () {
      var _getTxHexes = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee23(txHashes) {
        var prune,
            _args23 = arguments;
        return _regenerator["default"].wrap(function _callee23$(_context23) {
          while (1) {
            switch (_context23.prev = _context23.next) {
              case 0:
                prune = _args23.length > 1 && _args23[1] !== undefined ? _args23[1] : false;
                throw new _MoneroError["default"]("Subclass must implement");

              case 2:
              case "end":
                return _context23.stop();
            }
          }
        }, _callee23);
      }));

      function getTxHexes(_x26) {
        return _getTxHexes.apply(this, arguments);
      }

      return getTxHexes;
    }()
    /**
     * Gets the total emissions and fees from the genesis block to the current height.
     * 
     * @param {number} height - height to start computing the miner sum
     * @param {number} numBlocks - number of blocks to include in the sum
     * @return {MoneroMinerTxSum} encapsulates the total emissions and fees since the genesis block
     */

  }, {
    key: "getMinerTxSum",
    value: function () {
      var _getMinerTxSum = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee24(height, numBlocks) {
        return _regenerator["default"].wrap(function _callee24$(_context24) {
          while (1) {
            switch (_context24.prev = _context24.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context24.stop();
            }
          }
        }, _callee24);
      }));

      function getMinerTxSum(_x27, _x28) {
        return _getMinerTxSum.apply(this, arguments);
      }

      return getMinerTxSum;
    }()
    /**
     * Get the fee estimate per kB.
     * 
     * @param {number} graceBlocks TODO
     * @return {BigInt} fee estimate per kB.
     */

  }, {
    key: "getFeeEstimate",
    value: function () {
      var _getFeeEstimate = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee25(graceBlocks) {
        return _regenerator["default"].wrap(function _callee25$(_context25) {
          while (1) {
            switch (_context25.prev = _context25.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context25.stop();
            }
          }
        }, _callee25);
      }));

      function getFeeEstimate(_x29) {
        return _getFeeEstimate.apply(this, arguments);
      }

      return getFeeEstimate;
    }()
    /**
     * Submits a transaction to the daemon's pool.
     * 
     * @param {string} txHex - raw transaction hex to submit
     * @param {boolean} doNotRelay specifies if the tx should be relayed (optional)
     * @return {MoneroSubmitTxResult} contains submission results
     */

  }, {
    key: "submitTxHex",
    value: function () {
      var _submitTxHex = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee26(txHex, doNotRelay) {
        return _regenerator["default"].wrap(function _callee26$(_context26) {
          while (1) {
            switch (_context26.prev = _context26.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context26.stop();
            }
          }
        }, _callee26);
      }));

      function submitTxHex(_x30, _x31) {
        return _submitTxHex.apply(this, arguments);
      }

      return submitTxHex;
    }()
    /**
     * Relays a transaction by hash.
     * 
     * @param {string} txHash - hash of the transaction to relay
     */

  }, {
    key: "relayTxByHash",
    value: function () {
      var _relayTxByHash = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee27(txHash) {
        return _regenerator["default"].wrap(function _callee27$(_context27) {
          while (1) {
            switch (_context27.prev = _context27.next) {
              case 0:
                //import assert from "assert";
                _assert["default"].equal((0, _typeof2["default"])(txHash), "string", "Must provide a transaction hash");

                _context27.next = 3;
                return this.relayTxsByHash([txHash]);

              case 3:
              case "end":
                return _context27.stop();
            }
          }
        }, _callee27, this);
      }));

      function relayTxByHash(_x32) {
        return _relayTxByHash.apply(this, arguments);
      }

      return relayTxByHash;
    }()
    /**
     * Relays transactions by hash.
     * 
     * @param {string[]} txHashes - hashes of the transactinos to relay
     */

  }, {
    key: "relayTxsByHash",
    value: function () {
      var _relayTxsByHash = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee28(txHashes) {
        return _regenerator["default"].wrap(function _callee28$(_context28) {
          while (1) {
            switch (_context28.prev = _context28.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context28.stop();
            }
          }
        }, _callee28);
      }));

      function relayTxsByHash(_x33) {
        return _relayTxsByHash.apply(this, arguments);
      }

      return relayTxsByHash;
    }()
    /**
     * Get valid transactions seen by the node but not yet mined into a block, as well
     * as spent key image information for the tx pool.
     * 
     * @return {MoneroTx[]} are transactions in the transaction pool
     */

  }, {
    key: "getTxPool",
    value: function () {
      var _getTxPool = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee29() {
        return _regenerator["default"].wrap(function _callee29$(_context29) {
          while (1) {
            switch (_context29.prev = _context29.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context29.stop();
            }
          }
        }, _callee29);
      }));

      function getTxPool() {
        return _getTxPool.apply(this, arguments);
      }

      return getTxPool;
    }()
    /**
     * Get hashes of transactions in the transaction pool.
     * 
     * @return {string[]} are hashes of transactions in the transaction pool
     */

  }, {
    key: "getTxPoolHashes",
    value: function () {
      var _getTxPoolHashes = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee30() {
        return _regenerator["default"].wrap(function _callee30$(_context30) {
          while (1) {
            switch (_context30.prev = _context30.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context30.stop();
            }
          }
        }, _callee30);
      }));

      function getTxPoolHashes() {
        return _getTxPoolHashes.apply(this, arguments);
      }

      return getTxPoolHashes;
    }()
    /**
     * Get all transaction pool backlog.
     * 
     * @return {MoneroTxBacklogEntry[]} backlog entries 
     */

  }, {
    key: "getTxPoolBacklog",
    value: function () {
      var _getTxPoolBacklog = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee31() {
        return _regenerator["default"].wrap(function _callee31$(_context31) {
          while (1) {
            switch (_context31.prev = _context31.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context31.stop();
            }
          }
        }, _callee31);
      }));

      function getTxPoolBacklog() {
        return _getTxPoolBacklog.apply(this, arguments);
      }

      return getTxPoolBacklog;
    }()
    /**
     * Get transaction pool statistics.
     * 
     * @return {MoneroTxPoolStats} contains statistics about the transaction pool
     */

  }, {
    key: "getTxPoolStats",
    value: function () {
      var _getTxPoolStats = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee32() {
        return _regenerator["default"].wrap(function _callee32$(_context32) {
          while (1) {
            switch (_context32.prev = _context32.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context32.stop();
            }
          }
        }, _callee32);
      }));

      function getTxPoolStats() {
        return _getTxPoolStats.apply(this, arguments);
      }

      return getTxPoolStats;
    }()
    /**
     * Flush transactions from the tx pool.
     * 
     * @param {(string|string[])} [hashes] - specific transactions to flush (defaults to all)
     */

  }, {
    key: "flushTxPool",
    value: function () {
      var _flushTxPool = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee33(hashes) {
        return _regenerator["default"].wrap(function _callee33$(_context33) {
          while (1) {
            switch (_context33.prev = _context33.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context33.stop();
            }
          }
        }, _callee33);
      }));

      function flushTxPool(_x34) {
        return _flushTxPool.apply(this, arguments);
      }

      return flushTxPool;
    }()
    /**
     * Get the spent status of the given key image.
     * 
     * @param {string} keyImage - key image hex to get the status of
     * @return {MoneroKeyImageSpentStatus} status of the key image
     */

  }, {
    key: "getKeyImageSpentStatus",
    value: function () {
      var _getKeyImageSpentStatus = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee34(keyImage) {
        return _regenerator["default"].wrap(function _callee34$(_context34) {
          while (1) {
            switch (_context34.prev = _context34.next) {
              case 0:
                _context34.next = 2;
                return this.getKeyImageSpentStatuses([keyImage]);

              case 2:
                return _context34.abrupt("return", _context34.sent[0]);

              case 3:
              case "end":
                return _context34.stop();
            }
          }
        }, _callee34, this);
      }));

      function getKeyImageSpentStatus(_x35) {
        return _getKeyImageSpentStatus.apply(this, arguments);
      }

      return getKeyImageSpentStatus;
    }()
    /**
     * Get the spent status of each given key image.
     * 
     * @param {string[]} keyImages are hex key images to get the statuses of
     * @return {MoneroKeyImageSpentStatus[]} status for each key image
     */

  }, {
    key: "getKeyImageSpentStatuses",
    value: function () {
      var _getKeyImageSpentStatuses = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee35(keyImages) {
        return _regenerator["default"].wrap(function _callee35$(_context35) {
          while (1) {
            switch (_context35.prev = _context35.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context35.stop();
            }
          }
        }, _callee35);
      }));

      function getKeyImageSpentStatuses(_x36) {
        return _getKeyImageSpentStatuses.apply(this, arguments);
      }

      return getKeyImageSpentStatuses;
    }()
    /**
     * Get outputs identified by a list of output amounts and indices as a binary
     * request.
     * 
     * @param {MoneroOutput[]} outputs - identify each output by amount and index
     * @return {MoneroOutput[]} identified outputs
     */

  }, {
    key: "getOutputs",
    value: function () {
      var _getOutputs = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee36(outputs) {
        return _regenerator["default"].wrap(function _callee36$(_context36) {
          while (1) {
            switch (_context36.prev = _context36.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context36.stop();
            }
          }
        }, _callee36);
      }));

      function getOutputs(_x37) {
        return _getOutputs.apply(this, arguments);
      }

      return getOutputs;
    }()
    /**
     * Get a histogram of output amounts. For all amounts (possibly filtered by
     * parameters), gives the number of outputs on the chain for that amount.
     * RingCT outputs counts as 0 amount.
     * 
     * @param {BigInt[]} amounts - amounts of outputs to make the histogram with
     * @param {number} minCount - TODO
     * @param {number} maxCount - TODO
     * @param {boolean} isUnlocked - makes a histogram with outputs with the specified lock state
     * @param {number} recentCutoff - TODO
     * @return {MoneroOutputHistogramEntry[]} are entries meeting the parameters
     */

  }, {
    key: "getOutputHistogram",
    value: function () {
      var _getOutputHistogram = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee37(amounts, minCount, maxCount, isUnlocked, recentCutoff) {
        return _regenerator["default"].wrap(function _callee37$(_context37) {
          while (1) {
            switch (_context37.prev = _context37.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context37.stop();
            }
          }
        }, _callee37);
      }));

      function getOutputHistogram(_x38, _x39, _x40, _x41, _x42) {
        return _getOutputHistogram.apply(this, arguments);
      }

      return getOutputHistogram;
    }()
    /**
     * Creates an output distribution.
     * 
     * @param {BigInt[]} amounts - amounts of outputs to make the distribution with
     * @param {boolean} [cumulative] - specifies if the results should be cumulative (defaults to TODO)
     * @param {number} [startHeight] - start height lower bound inclusive (optional)
     * @param {number} [endHeight] - end height upper bound inclusive (optional)
     * @return {MoneroOutputDistributionEntry[]} are entries meeting the parameters
     */

  }, {
    key: "getOutputDistribution",
    value: function () {
      var _getOutputDistribution = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee38(amounts, cumulative, startHeight, endHeight) {
        return _regenerator["default"].wrap(function _callee38$(_context38) {
          while (1) {
            switch (_context38.prev = _context38.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context38.stop();
            }
          }
        }, _callee38);
      }));

      function getOutputDistribution(_x43, _x44, _x45, _x46) {
        return _getOutputDistribution.apply(this, arguments);
      }

      return getOutputDistribution;
    }()
    /**
     * Get general information about the state of the node and the network.
     * 
     * @return {MoneroDaemonInfo} is general information about the node and network
     */

  }, {
    key: "getInfo",
    value: function () {
      var _getInfo = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee39() {
        return _regenerator["default"].wrap(function _callee39$(_context39) {
          while (1) {
            switch (_context39.prev = _context39.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context39.stop();
            }
          }
        }, _callee39);
      }));

      function getInfo() {
        return _getInfo.apply(this, arguments);
      }

      return getInfo;
    }()
    /**
     * Get synchronization information.
     * 
     * @return {MoneroDaemonSyncInfo} contains sync information
     */

  }, {
    key: "getSyncInfo",
    value: function () {
      var _getSyncInfo = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee40() {
        return _regenerator["default"].wrap(function _callee40$(_context40) {
          while (1) {
            switch (_context40.prev = _context40.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context40.stop();
            }
          }
        }, _callee40);
      }));

      function getSyncInfo() {
        return _getSyncInfo.apply(this, arguments);
      }

      return getSyncInfo;
    }()
    /**
     * Look up information regarding hard fork voting and readiness.
     * 
     * @return {MoneroHardForkInfo} contains hard fork information
     */

  }, {
    key: "getHardForkInfo",
    value: function () {
      var _getHardForkInfo = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee41() {
        return _regenerator["default"].wrap(function _callee41$(_context41) {
          while (1) {
            switch (_context41.prev = _context41.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context41.stop();
            }
          }
        }, _callee41);
      }));

      function getHardForkInfo() {
        return _getHardForkInfo.apply(this, arguments);
      }

      return getHardForkInfo;
    }()
    /**
     * Get alternative chains seen by the node.
     * 
     * @return {MoneroAltChain[]} alternative chains
     */

  }, {
    key: "getAltChains",
    value: function () {
      var _getAltChains = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee42() {
        return _regenerator["default"].wrap(function _callee42$(_context42) {
          while (1) {
            switch (_context42.prev = _context42.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context42.stop();
            }
          }
        }, _callee42);
      }));

      function getAltChains() {
        return _getAltChains.apply(this, arguments);
      }

      return getAltChains;
    }()
    /**
     * Get known block hashes which are not on the main chain.
     * 
     * @return {string[]} known block hashes which are not on the main chain
     */

  }, {
    key: "getAltBlockHashes",
    value: function () {
      var _getAltBlockHashes = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee43() {
        return _regenerator["default"].wrap(function _callee43$(_context43) {
          while (1) {
            switch (_context43.prev = _context43.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context43.stop();
            }
          }
        }, _callee43);
      }));

      function getAltBlockHashes() {
        return _getAltBlockHashes.apply(this, arguments);
      }

      return getAltBlockHashes;
    }()
    /**
     * Get the download bandwidth limit.
     * 
     * @return {int} download bandwidth limit
     */

  }, {
    key: "getDownloadLimit",
    value: function () {
      var _getDownloadLimit = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee44() {
        return _regenerator["default"].wrap(function _callee44$(_context44) {
          while (1) {
            switch (_context44.prev = _context44.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context44.stop();
            }
          }
        }, _callee44);
      }));

      function getDownloadLimit() {
        return _getDownloadLimit.apply(this, arguments);
      }

      return getDownloadLimit;
    }()
    /**
     * Set the download bandwidth limit.
     * 
     * @param {number} limit - download limit to set (-1 to reset to default)
     * @return {int} new download limit after setting
     */

  }, {
    key: "setDownloadLimit",
    value: function () {
      var _setDownloadLimit = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee45(limit) {
        return _regenerator["default"].wrap(function _callee45$(_context45) {
          while (1) {
            switch (_context45.prev = _context45.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context45.stop();
            }
          }
        }, _callee45);
      }));

      function setDownloadLimit(_x47) {
        return _setDownloadLimit.apply(this, arguments);
      }

      return setDownloadLimit;
    }()
    /**
     * Reset the download bandwidth limit.
     * 
     * @return {int} download bandwidth limit after resetting
     */

  }, {
    key: "resetDownloadLimit",
    value: function () {
      var _resetDownloadLimit = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee46() {
        return _regenerator["default"].wrap(function _callee46$(_context46) {
          while (1) {
            switch (_context46.prev = _context46.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context46.stop();
            }
          }
        }, _callee46);
      }));

      function resetDownloadLimit() {
        return _resetDownloadLimit.apply(this, arguments);
      }

      return resetDownloadLimit;
    }()
    /**
     * Get the upload bandwidth limit.
     * 
     * @return {int} upload bandwidth limit
     */

  }, {
    key: "getUploadLimit",
    value: function () {
      var _getUploadLimit = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee47() {
        return _regenerator["default"].wrap(function _callee47$(_context47) {
          while (1) {
            switch (_context47.prev = _context47.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context47.stop();
            }
          }
        }, _callee47);
      }));

      function getUploadLimit() {
        return _getUploadLimit.apply(this, arguments);
      }

      return getUploadLimit;
    }()
    /**
     * Set the upload bandwidth limit.
     * 
     * @param limit - upload limit to set (-1 to reset to default)
     * @return {int} new upload limit after setting
     */

  }, {
    key: "setUploadLimit",
    value: function () {
      var _setUploadLimit = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee48(limit) {
        return _regenerator["default"].wrap(function _callee48$(_context48) {
          while (1) {
            switch (_context48.prev = _context48.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context48.stop();
            }
          }
        }, _callee48);
      }));

      function setUploadLimit(_x48) {
        return _setUploadLimit.apply(this, arguments);
      }

      return setUploadLimit;
    }()
    /**
     * Reset the upload bandwidth limit.
     * 
     * @return {int} upload bandwidth limit after resetting
     */

  }, {
    key: "resetUploadLimit",
    value: function () {
      var _resetUploadLimit = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee49() {
        return _regenerator["default"].wrap(function _callee49$(_context49) {
          while (1) {
            switch (_context49.prev = _context49.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context49.stop();
            }
          }
        }, _callee49);
      }));

      function resetUploadLimit() {
        return _resetUploadLimit.apply(this, arguments);
      }

      return resetUploadLimit;
    }()
    /**
     * Get peers with active incoming or outgoing connections to the node.
     * 
     * @return {MoneroPeer[]} the daemon's peers
     */

  }, {
    key: "getPeers",
    value: function () {
      var _getPeers = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee50() {
        return _regenerator["default"].wrap(function _callee50$(_context50) {
          while (1) {
            switch (_context50.prev = _context50.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context50.stop();
            }
          }
        }, _callee50);
      }));

      function getPeers() {
        return _getPeers.apply(this, arguments);
      }

      return getPeers;
    }()
    /**
     * Get known peers including their last known online status.
     * 
     * @return {MoneroPeer[]} the daemon's known peers
     */

  }, {
    key: "getKnownPeers",
    value: function () {
      var _getKnownPeers = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee51() {
        return _regenerator["default"].wrap(function _callee51$(_context51) {
          while (1) {
            switch (_context51.prev = _context51.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context51.stop();
            }
          }
        }, _callee51);
      }));

      function getKnownPeers() {
        return _getKnownPeers.apply(this, arguments);
      }

      return getKnownPeers;
    }()
    /**
     * Limit number of outgoing peers.
     * 
     * @param {number} limit - maximum number of outgoing peers
     */

  }, {
    key: "setOutgoingPeerLimit",
    value: function () {
      var _setOutgoingPeerLimit = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee52(limit) {
        return _regenerator["default"].wrap(function _callee52$(_context52) {
          while (1) {
            switch (_context52.prev = _context52.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context52.stop();
            }
          }
        }, _callee52);
      }));

      function setOutgoingPeerLimit(_x49) {
        return _setOutgoingPeerLimit.apply(this, arguments);
      }

      return setOutgoingPeerLimit;
    }()
    /**
     * Limit number of incoming peers.
     * 
     * @param {number} limit - maximum number of incoming peers
     */

  }, {
    key: "setIncomingPeerLimit",
    value: function () {
      var _setIncomingPeerLimit = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee53(limit) {
        return _regenerator["default"].wrap(function _callee53$(_context53) {
          while (1) {
            switch (_context53.prev = _context53.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context53.stop();
            }
          }
        }, _callee53);
      }));

      function setIncomingPeerLimit(_x50) {
        return _setIncomingPeerLimit.apply(this, arguments);
      }

      return setIncomingPeerLimit;
    }()
    /**
     * Get peer bans.
     * 
     * @return {MoneroBan[]} entries about banned peers
     */

  }, {
    key: "getPeerBans",
    value: function () {
      var _getPeerBans = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee54() {
        return _regenerator["default"].wrap(function _callee54$(_context54) {
          while (1) {
            switch (_context54.prev = _context54.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context54.stop();
            }
          }
        }, _callee54);
      }));

      function getPeerBans() {
        return _getPeerBans.apply(this, arguments);
      }

      return getPeerBans;
    }()
    /**
     * Ban a peer node.
     * 
     * @param {MoneroBan} ban - contains information about a node to ban
     */

  }, {
    key: "setPeerBan",
    value: function () {
      var _setPeerBan = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee55(ban) {
        return _regenerator["default"].wrap(function _callee55$(_context55) {
          while (1) {
            switch (_context55.prev = _context55.next) {
              case 0:
                _context55.next = 2;
                return this.setPeerBans([ban]);

              case 2:
                return _context55.abrupt("return", _context55.sent);

              case 3:
              case "end":
                return _context55.stop();
            }
          }
        }, _callee55, this);
      }));

      function setPeerBan(_x51) {
        return _setPeerBan.apply(this, arguments);
      }

      return setPeerBan;
    }()
    /**
     * Ban peers nodes.
     * 
     * @param {MoneroBan[]} bans - specify which peers to ban
     */

  }, {
    key: "setPeerBans",
    value: function () {
      var _setPeerBans = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee56(bans) {
        return _regenerator["default"].wrap(function _callee56$(_context56) {
          while (1) {
            switch (_context56.prev = _context56.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context56.stop();
            }
          }
        }, _callee56);
      }));

      function setPeerBans(_x52) {
        return _setPeerBans.apply(this, arguments);
      }

      return setPeerBans;
    }()
    /**
     * Start mining.
     * 
     * @param {string} address - address given miner rewards if the daemon mines a block
     * @param {integer} numThreads - number of mining threads to run
     * @param {boolean} isBackground - specifies if the miner should run in the background or not
     * @param {boolean} ignoreBattery - specifies if the battery state (e.g. on laptop) should be ignored or not
     */

  }, {
    key: "startMining",
    value: function () {
      var _startMining = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee57(address, numThreads, isBackground, ignoreBattery) {
        return _regenerator["default"].wrap(function _callee57$(_context57) {
          while (1) {
            switch (_context57.prev = _context57.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context57.stop();
            }
          }
        }, _callee57);
      }));

      function startMining(_x53, _x54, _x55, _x56) {
        return _startMining.apply(this, arguments);
      }

      return startMining;
    }()
    /**
     * Stop mining.
     */

  }, {
    key: "stopMining",
    value: function () {
      var _stopMining = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee58() {
        return _regenerator["default"].wrap(function _callee58$(_context58) {
          while (1) {
            switch (_context58.prev = _context58.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context58.stop();
            }
          }
        }, _callee58);
      }));

      function stopMining() {
        return _stopMining.apply(this, arguments);
      }

      return stopMining;
    }()
    /**
     * Get the daemon's mining status.
     * 
     * @return {MoneroMiningStatus} daemon's mining status
     */

  }, {
    key: "getMiningStatus",
    value: function () {
      var _getMiningStatus = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee59() {
        return _regenerator["default"].wrap(function _callee59$(_context59) {
          while (1) {
            switch (_context59.prev = _context59.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context59.stop();
            }
          }
        }, _callee59);
      }));

      function getMiningStatus() {
        return _getMiningStatus.apply(this, arguments);
      }

      return getMiningStatus;
    }()
    /**
     * Submit a mined block to the network.
     * 
     * @param {string} blockBlob - mined block to submit
     */

  }, {
    key: "submitBlock",
    value: function () {
      var _submitBlock = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee60(blockBlob) {
        return _regenerator["default"].wrap(function _callee60$(_context60) {
          while (1) {
            switch (_context60.prev = _context60.next) {
              case 0:
                _context60.next = 2;
                return this.submitBlocks([blockBlob]);

              case 2:
              case "end":
                return _context60.stop();
            }
          }
        }, _callee60, this);
      }));

      function submitBlock(_x57) {
        return _submitBlock.apply(this, arguments);
      }

      return submitBlock;
    }()
    /**
     * Submit mined blocks to the network.
     * 
     * @param {string[]} blockBlobs - mined blocks to submit
     */

  }, {
    key: "submitBlocks",
    value: function () {
      var _submitBlocks = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee61(blockBlobs) {
        return _regenerator["default"].wrap(function _callee61$(_context61) {
          while (1) {
            switch (_context61.prev = _context61.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context61.stop();
            }
          }
        }, _callee61);
      }));

      function submitBlocks(_x58) {
        return _submitBlocks.apply(this, arguments);
      }

      return submitBlocks;
    }()
    /**
     * Check for update.
     * 
     * @return {MoneroDaemonUpdateCheckResult} the result
     */

  }, {
    key: "checkForUpdate",
    value: function () {
      var _checkForUpdate = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee62() {
        return _regenerator["default"].wrap(function _callee62$(_context62) {
          while (1) {
            switch (_context62.prev = _context62.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context62.stop();
            }
          }
        }, _callee62);
      }));

      function checkForUpdate() {
        return _checkForUpdate.apply(this, arguments);
      }

      return checkForUpdate;
    }()
    /**
     * Download an update.
     * 
     * @param {string} [path] - path to download the update (optional)
     * @return {MoneroDaemonUpdateDownloadResult} the result
     */

  }, {
    key: "downloadUpdate",
    value: function () {
      var _downloadUpdate = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee63(path) {
        return _regenerator["default"].wrap(function _callee63$(_context63) {
          while (1) {
            switch (_context63.prev = _context63.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context63.stop();
            }
          }
        }, _callee63);
      }));

      function downloadUpdate(_x59) {
        return _downloadUpdate.apply(this, arguments);
      }

      return downloadUpdate;
    }()
    /**
     * Safely disconnect and shut down the daemon.
     */

  }, {
    key: "stop",
    value: function () {
      var _stop = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee64() {
        return _regenerator["default"].wrap(function _callee64$(_context64) {
          while (1) {
            switch (_context64.prev = _context64.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context64.stop();
            }
          }
        }, _callee64);
      }));

      function stop() {
        return _stop.apply(this, arguments);
      }

      return stop;
    }()
    /**
     * Get the header of the next block added to the chain.
     * 
     * @return {MoneroBlockHeader} header of the next block added to the chain
     */

  }, {
    key: "waitForNextBlockHeader",
    value: function () {
      var _waitForNextBlockHeader = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee65() {
        return _regenerator["default"].wrap(function _callee65$(_context65) {
          while (1) {
            switch (_context65.prev = _context65.next) {
              case 0:
                throw new _MoneroError["default"]("Subclass must implement");

              case 1:
              case "end":
                return _context65.stop();
            }
          }
        }, _callee65);
      }));

      function waitForNextBlockHeader() {
        return _waitForNextBlockHeader.apply(this, arguments);
      }

      return waitForNextBlockHeader;
    }() // ----------------------------- STATIC UTILITIES ---------------------------

    /**
     * Parses a network string to an enumerated type.
     * 
     * @param {string} network - network string to parse
     * @return {MoneroNetworkType} enumerated network type
     */

  }], [{
    key: "parseNetworkType",
    value: function parseNetworkType(network) {
      //import MoneroNetworkType from "./model/MoneroNetworkType";
      if (network === "mainnet") return _MoneroNetworkType["default"].MAINNET;
      if (network === "testnet") return _MoneroNetworkType["default"].TESTNET;
      if (network === "stagenet") return _MoneroNetworkType["default"].STAGENET;
      throw new _MoneroError["default"]("Invalid network type to parse: " + network);
    }
  }]);
  return MoneroDaemon;
}();

var _default = MoneroDaemon;
exports["default"] = _default;