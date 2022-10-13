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

var _index = require("../../index");

/**
 * Test utilities including those implemented in WebAssembly.
 */
var TestMoneroUtils = /*#__PURE__*/function () {
  function TestMoneroUtils() {
    (0, _classCallCheck2["default"])(this, TestMoneroUtils);
  }

  (0, _createClass2["default"])(TestMoneroUtils, [{
    key: "runTests",
    value: function runTests() {
      describe("TEST MONERO UTILITIES", function () {
        // initialize utils to test
        before( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee() {
          return _regenerator["default"].wrap(function _callee$(_context) {
            while (1) {
              switch (_context.prev = _context.next) {
                case 0:
                  _index.MoneroUtils.setProxyToWorker(true);

                case 1:
                case "end":
                  return _context.stop();
              }
            }
          }, _callee);
        })));
        it("Can get integrated addresses", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
          var primaryAddress, subaddress, paymentId, networkType, integratedAddress;
          return _regenerator["default"].wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  primaryAddress = "58qRVVjZ4KxMX57TH6yWqGcH5AswvZZS494hWHcHPt6cDkP7V8AqxFhi3RKXZueVRgUnk8niQGHSpY5Bm9DjuWn16GDKXpF";
                  subaddress = "7B9w2xieXjhDumgPX39h1CAYELpsZ7Pe8Wqtr3pVL9jJ5gGDqgxjWt55gTYUCAuhahhM85ajEp6VbQfLDPETt4oT2ZRXa6n";
                  paymentId = "03284e41c342f036";
                  networkType = _index.MoneroNetworkType.STAGENET; // get integrated address with randomly generated payment id

                  _context2.next = 6;
                  return _index.MoneroUtils.getIntegratedAddress(networkType, primaryAddress);

                case 6:
                  integratedAddress = _context2.sent;

                  _assert["default"].equal(primaryAddress, integratedAddress.getStandardAddress());

                  _assert["default"].equal(16, integratedAddress.getPaymentId().length);

                  _assert["default"].equal(106, integratedAddress.getIntegratedAddress().length); // get integrated address with specific payment id


                  _context2.next = 12;
                  return _index.MoneroUtils.getIntegratedAddress(networkType, primaryAddress, paymentId);

                case 12:
                  integratedAddress = _context2.sent;

                  _assert["default"].equal(primaryAddress, integratedAddress.getStandardAddress());

                  _assert["default"].equal(paymentId, integratedAddress.getPaymentId());

                  _assert["default"].equal(106, integratedAddress.getIntegratedAddress().length); // get integrated address with subaddress


                  _context2.next = 18;
                  return _index.MoneroUtils.getIntegratedAddress(networkType, subaddress, paymentId);

                case 18:
                  integratedAddress = _context2.sent;

                  _assert["default"].equal(subaddress, integratedAddress.getStandardAddress());

                  _assert["default"].equal(paymentId, integratedAddress.getPaymentId());

                  _assert["default"].equal(106, integratedAddress.getIntegratedAddress().length); // get integrated address with invalid payment id


                  _context2.prev = 22;
                  _context2.next = 25;
                  return _index.MoneroUtils.getIntegratedAddress(networkType, primaryAddress, "123");

                case 25:
                  throw new Error("Getting integrated address with invalid payment id should have failed");

                case 28:
                  _context2.prev = 28;
                  _context2.t0 = _context2["catch"](22);
                  (0, _assert["default"])(_context2.t0 instanceof _index.MoneroError);

                  _assert["default"].equal("Invalid payment id", _context2.t0.message);

                case 32:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2, null, [[22, 28]]);
        })));
        it("Can serialize heights with small numbers", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3() {
          var json, binary, json2;
          return _regenerator["default"].wrap(function _callee3$(_context3) {
            while (1) {
              switch (_context3.prev = _context3.next) {
                case 0:
                  json = {
                    heights: [111, 222, 333]
                  };
                  _context3.next = 3;
                  return _index.MoneroUtils.jsonToBinary(json);

                case 3:
                  binary = _context3.sent;
                  (0, _assert["default"])(binary);
                  _context3.next = 7;
                  return _index.MoneroUtils.binaryToJson(binary);

                case 7:
                  json2 = _context3.sent;

                  _assert["default"].deepEqual(json2, json);

                case 9:
                case "end":
                  return _context3.stop();
              }
            }
          }, _callee3);
        })));
        it("Can serialize heights with big numbers", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
          var json, binary, json2;
          return _regenerator["default"].wrap(function _callee4$(_context4) {
            while (1) {
              switch (_context4.prev = _context4.next) {
                case 0:
                  json = {
                    heights: [123456, 1234567, 870987]
                  };
                  _context4.next = 3;
                  return _index.MoneroUtils.jsonToBinary(json);

                case 3:
                  binary = _context4.sent;
                  (0, _assert["default"])(binary);
                  _context4.next = 7;
                  return _index.MoneroUtils.binaryToJson(binary);

                case 7:
                  json2 = _context4.sent;

                  _assert["default"].deepEqual(json2, json);

                case 9:
                case "end":
                  return _context4.stop();
              }
            }
          }, _callee4);
        })));
        it("Can serialize json with text", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5() {
          var json, binary, json2;
          return _regenerator["default"].wrap(function _callee5$(_context5) {
            while (1) {
              switch (_context5.prev = _context5.next) {
                case 0:
                  json = {
                    msg: 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!'
                  };
                  _context5.next = 3;
                  return _index.MoneroUtils.jsonToBinary(json);

                case 3:
                  binary = _context5.sent;
                  (0, _assert["default"])(binary);
                  _context5.next = 7;
                  return _index.MoneroUtils.binaryToJson(binary);

                case 7:
                  json2 = _context5.sent;

                  _assert["default"].deepEqual(json2, json);

                case 9:
                case "end":
                  return _context5.stop();
              }
            }
          }, _callee5);
        })));
        it("Can serialize json with long text", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee6() {
          var json, binary, json2;
          return _regenerator["default"].wrap(function _callee6$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  json = {
                    msg: 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n' + 'Hello there my good man lets make a nice long text to test with lots of exclamation marks!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n'
                  };
                  _context6.next = 3;
                  return _index.MoneroUtils.jsonToBinary(json);

                case 3:
                  binary = _context6.sent;
                  (0, _assert["default"])(binary);
                  _context6.next = 7;
                  return _index.MoneroUtils.binaryToJson(binary);

                case 7:
                  json2 = _context6.sent;

                  _assert["default"].deepEqual(json2, json);

                case 9:
                case "end":
                  return _context6.stop();
              }
            }
          }, _callee6);
        })));
        it("Can validate addresses", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee7() {
          return _regenerator["default"].wrap(function _callee7$(_context7) {
            while (1) {
              switch (_context7.prev = _context7.next) {
                case 0:
                  _context7.t0 = _assert["default"];
                  _context7.next = 3;
                  return _index.MoneroUtils.isValidAddress("42U9v3qs5CjZEePHBZHwuSckQXebuZu299NSmVEmQ41YJZQhKcPyujyMSzpDH4VMMVSBo3U3b54JaNvQLwAjqDhKS3rvM3L", _index.MoneroNetworkType.MAINNET);

                case 3:
                  _context7.t1 = _context7.sent;
                  (0, _context7.t0)(_context7.t1);
                  _context7.t2 = _assert["default"];
                  _context7.next = 8;
                  return _index.MoneroUtils.isValidAddress("48ZxX3Y2y5s4nJ8fdz2w65TrTEp9PRsv5J8iHSShkHQcE2V31FhnWptioNst1K9oeDY4KpWZ7v8V2BZNVa4Wdky89iqmPz2", _index.MoneroNetworkType.MAINNET);

                case 8:
                  _context7.t3 = _context7.sent;
                  (0, _context7.t2)(_context7.t3);
                  _context7.t4 = _assert["default"];
                  _context7.next = 13;
                  return _index.MoneroUtils.isValidAddress("48W972Fx1SQMCHVKENnPpM7tRcL5oWMgpMCqQDbhH8UrjDFg2H9i5AQWXuU1qacJgUUCVLTsgDmZKXGz1vPLXY8QB5ypYqG", _index.MoneroNetworkType.MAINNET);

                case 13:
                  _context7.t5 = _context7.sent;
                  (0, _context7.t4)(_context7.t5);
                  _context7.next = 17;
                  return _index.MoneroUtils.validateAddress("4CApvrfMgUFZEePHBZHwuSckQXebuZu299NSmVEmQ41YJZQhKcPyujyMSzpDH4VMMVSBo3U3b54JaNvQLwAjqDhKeGLQ9vfRBRKFKnBtVH", _index.MoneroNetworkType.MAINNET);

                case 17:
                  _context7.next = 19;
                  return _index.MoneroUtils.validateAddress("4JGdXrMXaMP4nJ8fdz2w65TrTEp9PRsv5J8iHSShkHQcE2V31FhnWptioNst1K9oeDY4KpWZ7v8V2BZNVa4Wdky8DvDyXvDZXvE9jTQwom", _index.MoneroNetworkType.MAINNET);

                case 19:
                  _context7.next = 21;
                  return _index.MoneroUtils.validateAddress("4JCp7q5SchvMCHVKENnPpM7tRcL5oWMgpMCqQDbhH8UrjDFg2H9i5AQWXuU1qacJgUUCVLTsgDmZKXGz1vPLXY8QFySJXARQWju8AuRN2z", _index.MoneroNetworkType.MAINNET);

                case 21:
                  _context7.next = 23;
                  return _index.MoneroUtils.validateAddress("891TQPrWshJVpnBR4ZMhHiHpLx1PUnMqa3ccV5TJFBbqcJa3DWhjBh2QByCv3Su7WDPTGMHmCKkiVFN2fyGJKwbM1t6G7Ea", _index.MoneroNetworkType.MAINNET);

                case 23:
                  _context7.next = 25;
                  return _index.MoneroUtils.validateAddress("88fyq3t8Gxn1QWMG189EufHtMHXZXkfJtJKFJXqeA4GpSiuyfjVwVyp47PeQJnD7Tc8iK8TDvvhcmEmfh8nx7Va2ToP8wAo", _index.MoneroNetworkType.MAINNET);

                case 25:
                  _context7.next = 27;
                  return _index.MoneroUtils.validateAddress("88hnoBiX3TPjbFaQE8RxgyBcf3DtMKZWWQMoArBjQfn37JJwtm568mPX6ipcCuGKDnLCzgjmpLSqce4aBDyapJJAFtNxUMb", _index.MoneroNetworkType.MAINNET);

                case 27:
                  _context7.next = 29;
                  return _index.MoneroUtils.validateAddress("9tUBnNCkC3UKGygHCwYvAB1FscpjUuq5e9MYJd2rXuiiTjjfVeSVjnbSG5VTnJgBgy9Y7GTLfxpZNMUwNZjGfdFr1z79eV1", _index.MoneroNetworkType.TESTNET);

                case 29:
                  _context7.next = 31;
                  return _index.MoneroUtils.validateAddress("9xZmQa1kYakGoHcfXeBgcsLf622NCpChcACwXxfdgY9uAa9hXSPCV9cLvUsAShfDcFKDdPzCNJ1n5cFGKw5GVM722pjuGPd", _index.MoneroNetworkType.TESTNET);

                case 31:
                  _context7.next = 33;
                  return _index.MoneroUtils.validateAddress("A2TXS6QFQ4wEsp8U7C2Y4B7wBtiML8aDG7mdCbRvDQmRaRNj1YSSgJE46fSzUkwgpMUCXFqscvrQuN7oKpP6eDyQ7XuYsuf", _index.MoneroNetworkType.TESTNET);

                case 33:
                  _context7.next = 35;
                  return _index.MoneroUtils.validateAddress("A4AroB2EoJzKGygHCwYvAB1FscpjUuq5e9MYJd2rXuiiTjjfVeSVjnbSG5VTnJgBgy9Y7GTLfxpZNMUwNZjGfdFr2QY5Ba2aHhTEdQa2ra", _index.MoneroNetworkType.TESTNET);

                case 35:
                  _context7.next = 37;
                  return _index.MoneroUtils.validateAddress("A8GSRNqF9rGGoHcfXeBgcsLf622NCpChcACwXxfdgY9uAa9hXSPCV9cLvUsAShfDcFKDdPzCNJ1n5cFGKw5GVM723iPoCEF1Fs9BcPYxTW", _index.MoneroNetworkType.TESTNET);

                case 37:
                  _context7.next = 39;
                  return _index.MoneroUtils.validateAddress("ACACSuDk1LTEsp8U7C2Y4B7wBtiML8aDG7mdCbRvDQmRaRNj1YSSgJE46fSzUkwgpMUCXFqscvrQuN7oKpP6eDyQAdgDoT3UnMYKQz7SHC", _index.MoneroNetworkType.TESTNET);

                case 39:
                  _context7.next = 41;
                  return _index.MoneroUtils.validateAddress("BgnKzHPJQDcg7xiP7bMN9MfPv9Z8ciT71iEMYnCdgBRBFETWgu9nKTr8fnzyGfU9h9gyNA8SFzYYzHfTS9KhqytSU943Nu1", _index.MoneroNetworkType.TESTNET);

                case 41:
                  _context7.next = 43;
                  return _index.MoneroUtils.validateAddress("BZwiuKkoNP59zgPHTxpNw3PM4DW2xiAVQJWqfFRrGyeZ7afVdQqoiJg3E2dDL3Ja8BV4ov2LEoHx9UjzF3W4ihPBSZvWwTx", _index.MoneroNetworkType.TESTNET);

                case 43:
                  _context7.next = 45;
                  return _index.MoneroUtils.validateAddress("Bhf1DEYrentcehUvNreLK5gxosnC2VStMXNCCs163RTxQq4jxFYvpw7LrQFmrMwWW2KsXLhMRtyho6Lq11ci3Fb246bxYmi", _index.MoneroNetworkType.TESTNET);

                case 45:
                  _context7.next = 47;
                  return _index.MoneroUtils.validateAddress("5B8s3obCY2ETeQB3GNAGPK2zRGen5UeW1WzegSizVsmf6z5NvM2GLoN6zzk1vHyzGAAfA8pGhuYAeCFZjHAp59jRVQkunGS", _index.MoneroNetworkType.STAGENET);

                case 47:
                  _context7.next = 49;
                  return _index.MoneroUtils.validateAddress("57VfotUbSZLG82UkKhWXDjS5ZEK9ZCDcmjdk4gpVq2fbKdEgwRCFrGTLZ2MMdSHphRWJDWVBi5qS8T7dz13JTCWtC228zyn", _index.MoneroNetworkType.STAGENET);

                case 49:
                  _context7.next = 51;
                  return _index.MoneroUtils.validateAddress("52FysgWJYmAG73QUQZRULJj2Dv2C2mceUMB5zHqNzMn8WBtfPWQrSUFSQUKTX9r7bUMmVSGbrau976xYLynR8jTWLdA7rfp", _index.MoneroNetworkType.STAGENET);

                case 51:
                  _context7.next = 53;
                  return _index.MoneroUtils.validateAddress("5LqY4cQh9HkTeQB3GNAGPK2zRGen5UeW1WzegSizVsmf6z5NvM2GLoN6zzk1vHyzGAAfA8pGhuYAeCFZjHAp59jRj6LZRFrjuGK8Whthg2", _index.MoneroNetworkType.STAGENET);

                case 53:
                  _context7.next = 55;
                  return _index.MoneroUtils.validateAddress("5HCLphJ63prG82UkKhWXDjS5ZEK9ZCDcmjdk4gpVq2fbKdEgwRCFrGTLZ2MMdSHphRWJDWVBi5qS8T7dz13JTCWtHETX8zcUhDjVKcynf6", _index.MoneroNetworkType.STAGENET);

                case 55:
                  _context7.next = 57;
                  return _index.MoneroUtils.validateAddress("5BxetVKoA2gG73QUQZRULJj2Dv2C2mceUMB5zHqNzMn8WBtfPWQrSUFSQUKTX9r7bUMmVSGbrau976xYLynR8jTWVwQwpHNg5fCLgtA2Dv", _index.MoneroNetworkType.STAGENET);

                case 57:
                  _context7.next = 59;
                  return _index.MoneroUtils.validateAddress("778B5D2JmMh5TJVWFbygJR15dvio5Z5B24hfSrWDzeroM8j8Lqc9sMoFE6324xg2ReaAZqHJkgfGFRugRmYHugHZ4f17Gxo", _index.MoneroNetworkType.STAGENET);

                case 59:
                  _context7.next = 61;
                  return _index.MoneroUtils.validateAddress("73U97wGEH9RCVUf6bopo45jSgoqjMzz4mTUsvWs5EusmYAmFcBYFm7wKMVmgtVKCBhMQqXrcMbHvwck2md63jMZSFJxUhQ2", _index.MoneroNetworkType.STAGENET);

                case 61:
                  _context7.next = 63;
                  return _index.MoneroUtils.validateAddress("747wPpaPKrjDPZrF48jAfz9pRRUHLMCWfYu2UanP4ZfTG8NrmYrSEWNW8gYoadU8hTiwBjV14e6DLaC5xfhyEpX5154aMm6", _index.MoneroNetworkType.STAGENET);

                case 63:
                  _context7.next = 65;
                  return testInvalidAddress(null, _index.MoneroNetworkType.MAINNET);

                case 65:
                  _context7.next = 67;
                  return testInvalidAddress("", _index.MoneroNetworkType.MAINNET);

                case 67:
                  _context7.next = 69;
                  return testInvalidAddress("42ZxX3Y2y5s4nJ8fdz2w65TrTEp9PRsv5J8iHSShkHQcE2V31FhnWptioNst1K9oeDY4KpWZ7v8V2BZNVa4Wdky89iqmPz2", _index.MoneroNetworkType.MAINNET);

                case 69:
                  _context7.next = 71;
                  return testInvalidAddress("41ApvrfMgUFZEePHBZHwuSckQXebuZu299NSmVEmQ41YJZQhKcPyujyMSzpDH4VMMVSBo3U3b54JaNvQLwAjqDhKeGLQ9vfRBRKFKnBtVH", _index.MoneroNetworkType.MAINNET);

                case 71:
                  _context7.next = 73;
                  return testInvalidAddress("81fyq3t8Gxn1QWMG189EufHtMHXZXkfJtJKFJXqeA4GpSiuyfjVwVyp47PeQJnD7Tc8iK8TDvvhcmEmfh8nx7Va2ToP8wAo", _index.MoneroNetworkType.MAINNET);

                case 73:
                  _context7.next = 75;
                  return testInvalidAddress(null, _index.MoneroNetworkType.TESTNET);

                case 75:
                  _context7.next = 77;
                  return testInvalidAddress("", _index.MoneroNetworkType.TESTNET);

                case 77:
                  _context7.next = 79;
                  return testInvalidAddress("91UBnNCkC3UKGygHCwYvAB1FscpjUuq5e9MYJd2rXuiiTjjfVeSVjnbSG5VTnJgBgy9Y7GTLfxpZNMUwNZjGfdFr1z79eV1", _index.MoneroNetworkType.TESTNET);

                case 79:
                  _context7.next = 81;
                  return testInvalidAddress("A1AroB2EoJzKGygHCwYvAB1FscpjUuq5e9MYJd2rXuiiTjjfVeSVjnbSG5VTnJgBgy9Y7GTLfxpZNMUwNZjGfdFr2QY5Ba2aHhTEdQa2ra", _index.MoneroNetworkType.TESTNET);

                case 81:
                  _context7.next = 83;
                  return testInvalidAddress("B1nKzHPJQDcg7xiP7bMN9MfPv9Z8ciT71iEMYnCdgBRBFETWgu9nKTr8fnzyGfU9h9gyNA8SFzYYzHfTS9KhqytSU943Nu1", _index.MoneroNetworkType.TESTNET);

                case 83:
                  _context7.next = 85;
                  return testInvalidAddress(null, _index.MoneroNetworkType.STAGENET);

                case 85:
                  _context7.next = 87;
                  return testInvalidAddress("", _index.MoneroNetworkType.STAGENET);

                case 87:
                  _context7.next = 89;
                  return testInvalidAddress("518s3obCY2ETeQB3GNAGPK2zRGen5UeW1WzegSizVsmf6z5NvM2GLoN6zzk1vHyzGAAfA8pGhuYAeCFZjHAp59jRVQkunGS", _index.MoneroNetworkType.STAGENET);

                case 89:
                  _context7.next = 91;
                  return testInvalidAddress("51qY4cQh9HkTeQB3GNAGPK2zRGen5UeW1WzegSizVsmf6z5NvM2GLoN6zzk1vHyzGAAfA8pGhuYAeCFZjHAp59jRj6LZRFrjuGK8Whthg2", _index.MoneroNetworkType.STAGENET);

                case 91:
                  _context7.next = 93;
                  return testInvalidAddress("718B5D2JmMh5TJVWFbygJR15dvio5Z5B24hfSrWDzeroM8j8Lqc9sMoFE6324xg2ReaAZqHJkgfGFRugRmYHugHZ4f17Gxo", _index.MoneroNetworkType.STAGENET);

                case 93:
                case "end":
                  return _context7.stop();
              }
            }
          }, _callee7);
        })));
        it("Can validate keys", /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee8() {
          return _regenerator["default"].wrap(function _callee8$(_context8) {
            while (1) {
              switch (_context8.prev = _context8.next) {
                case 0:
                  _context8.t0 = _assert["default"];
                  _context8.next = 3;
                  return _index.MoneroUtils.isValidPrivateViewKey("86cf351d10894769feba29b9e201e12fb100b85bb52fc5825c864eef55c5840d");

                case 3:
                  _context8.t1 = _context8.sent;
                  (0, _context8.t0)(_context8.t1);
                  _context8.next = 7;
                  return testInvalidPrivateViewKey("");

                case 7:
                  _context8.next = 9;
                  return testInvalidPrivateViewKey();

                case 9:
                  _context8.next = 11;
                  return testInvalidPrivateViewKey("5B8s3obCY2ETeQB3GNAGPK2zRGen5UeW1WzegSizVsmf6z5NvM2GLoN6zzk1vHyzGAAfA8pGhuYAeCFZjHAp59jRVQkunGS");

                case 11:
                  _context8.t2 = _assert["default"];
                  _context8.next = 14;
                  return _index.MoneroUtils.isValidPublicViewKey("99873d76ca874ff1aad676b835dd303abcb21c9911ca8a3d9130abc4544d8a0a");

                case 14:
                  _context8.t3 = _context8.sent;
                  (0, _context8.t2)(_context8.t3);
                  _context8.next = 18;
                  return testInvalidPublicViewKey("");

                case 18:
                  _context8.next = 20;
                  return testInvalidPublicViewKey();

                case 20:
                  _context8.next = 22;
                  return testInvalidPublicViewKey("z86cf351d10894769feba29b9e201e12fb100b85bb52fc5825c864eef55c5840d");

                case 22:
                  _context8.t4 = _assert["default"];
                  _context8.next = 25;
                  return _index.MoneroUtils.isValidPrivateSpendKey("e9ba887e93620ef9fafdfe0c6d3022949f1c5713cbd9ef631f18a0fb00421dee");

                case 25:
                  _context8.t5 = _context8.sent;
                  (0, _context8.t4)(_context8.t5);
                  _context8.next = 29;
                  return testInvalidPrivateSpendKey("");

                case 29:
                  _context8.next = 31;
                  return testInvalidPrivateSpendKey(null);

                case 31:
                  _context8.next = 33;
                  return testInvalidPrivateSpendKey("z86cf351d10894769feba29b9e201e12fb100b85bb52fc5825c864eef55c5840d");

                case 33:
                  _context8.t6 = _assert["default"];
                  _context8.next = 36;
                  return _index.MoneroUtils.isValidPublicSpendKey("3e48df9e9d8038dbf6f5382fac2becd8686273cda5bd87187e45dca7ec5af37b");

                case 36:
                  _context8.t7 = _context8.sent;
                  (0, _context8.t6)(_context8.t7);
                  _context8.next = 40;
                  return testInvalidPublicSpendKey("");

                case 40:
                  _context8.next = 42;
                  return testInvalidPublicSpendKey();

                case 42:
                  _context8.next = 44;
                  return testInvalidPublicSpendKey("z86cf351d10894769feba29b9e201e12fb100b85bb52fc5825c864eef55c5840d");

                case 44:
                case "end":
                  return _context8.stop();
              }
            }
          }, _callee8);
        })));

        function testInvalidAddress(_x, _x2) {
          return _testInvalidAddress.apply(this, arguments);
        }

        function _testInvalidAddress() {
          _testInvalidAddress = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee9(address, networkType) {
            return _regenerator["default"].wrap(function _callee9$(_context9) {
              while (1) {
                switch (_context9.prev = _context9.next) {
                  case 0:
                    _context9.t0 = _assert["default"];
                    _context9.next = 3;
                    return _index.MoneroUtils.isValidAddress(address, networkType);

                  case 3:
                    _context9.t1 = !_context9.sent;
                    (0, _context9.t0)(_context9.t1);
                    _context9.prev = 5;
                    _context9.next = 8;
                    return _index.MoneroUtils.validateAddress(address, networkType);

                  case 8:
                    throw new Error("Should have thrown exception");

                  case 11:
                    _context9.prev = 11;
                    _context9.t2 = _context9["catch"](5);

                    _assert["default"].notEqual("Should have thrown exception", _context9.t2.message);

                    (0, _assert["default"])(_context9.t2.message);

                  case 15:
                  case "end":
                    return _context9.stop();
                }
              }
            }, _callee9, null, [[5, 11]]);
          }));
          return _testInvalidAddress.apply(this, arguments);
        }

        function testInvalidPrivateViewKey(_x3) {
          return _testInvalidPrivateViewKey.apply(this, arguments);
        }

        function _testInvalidPrivateViewKey() {
          _testInvalidPrivateViewKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee10(privateViewKey) {
            return _regenerator["default"].wrap(function _callee10$(_context10) {
              while (1) {
                switch (_context10.prev = _context10.next) {
                  case 0:
                    _context10.t0 = _assert["default"];
                    _context10.next = 3;
                    return _index.MoneroUtils.isValidPrivateViewKey(privateViewKey);

                  case 3:
                    _context10.t1 = !_context10.sent;
                    (0, _context10.t0)(_context10.t1);
                    _context10.prev = 5;
                    _context10.next = 8;
                    return _index.MoneroUtils.validatePrivateViewKey(privateViewKey);

                  case 8:
                    fail("Should have thrown exception");
                    _context10.next = 14;
                    break;

                  case 11:
                    _context10.prev = 11;
                    _context10.t2 = _context10["catch"](5);
                    (0, _assert["default"])(_context10.t2.message.length > 0);

                  case 14:
                  case "end":
                    return _context10.stop();
                }
              }
            }, _callee10, null, [[5, 11]]);
          }));
          return _testInvalidPrivateViewKey.apply(this, arguments);
        }

        function testInvalidPublicViewKey(_x4) {
          return _testInvalidPublicViewKey.apply(this, arguments);
        }

        function _testInvalidPublicViewKey() {
          _testInvalidPublicViewKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee11(publicViewKey) {
            return _regenerator["default"].wrap(function _callee11$(_context11) {
              while (1) {
                switch (_context11.prev = _context11.next) {
                  case 0:
                    _context11.t0 = _assert["default"];
                    _context11.next = 3;
                    return _index.MoneroUtils.isValidPublicViewKey(publicViewKey);

                  case 3:
                    _context11.t1 = !_context11.sent;
                    (0, _context11.t0)(_context11.t1);
                    _context11.prev = 5;
                    _context11.next = 8;
                    return _index.MoneroUtils.validatePublicViewKey(publicViewKey);

                  case 8:
                    fail("Should have thrown exception");
                    _context11.next = 14;
                    break;

                  case 11:
                    _context11.prev = 11;
                    _context11.t2 = _context11["catch"](5);
                    (0, _assert["default"])(_context11.t2.message.length > 0);

                  case 14:
                  case "end":
                    return _context11.stop();
                }
              }
            }, _callee11, null, [[5, 11]]);
          }));
          return _testInvalidPublicViewKey.apply(this, arguments);
        }

        function testInvalidPrivateSpendKey(_x5) {
          return _testInvalidPrivateSpendKey.apply(this, arguments);
        }

        function _testInvalidPrivateSpendKey() {
          _testInvalidPrivateSpendKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee12(privateSpendKey) {
            return _regenerator["default"].wrap(function _callee12$(_context12) {
              while (1) {
                switch (_context12.prev = _context12.next) {
                  case 0:
                    _context12.t0 = _assert["default"];
                    _context12.next = 3;
                    return _index.MoneroUtils.isValidPrivateSpendKey(privateSpendKey);

                  case 3:
                    _context12.t1 = !_context12.sent;
                    (0, _context12.t0)(_context12.t1);
                    _context12.prev = 5;
                    _context12.next = 8;
                    return _index.MoneroUtils.validatePrivateSpendKey(privateSpendKey);

                  case 8:
                    fail("Should have thrown exception");
                    _context12.next = 14;
                    break;

                  case 11:
                    _context12.prev = 11;
                    _context12.t2 = _context12["catch"](5);
                    (0, _assert["default"])(_context12.t2.message.length > 0);

                  case 14:
                  case "end":
                    return _context12.stop();
                }
              }
            }, _callee12, null, [[5, 11]]);
          }));
          return _testInvalidPrivateSpendKey.apply(this, arguments);
        }

        function testInvalidPublicSpendKey(_x6) {
          return _testInvalidPublicSpendKey.apply(this, arguments);
        }

        function _testInvalidPublicSpendKey() {
          _testInvalidPublicSpendKey = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee13(publicSpendKey) {
            return _regenerator["default"].wrap(function _callee13$(_context13) {
              while (1) {
                switch (_context13.prev = _context13.next) {
                  case 0:
                    _context13.t0 = _assert["default"];
                    _context13.next = 3;
                    return _index.MoneroUtils.isValidPublicSpendKey(publicSpendKey);

                  case 3:
                    _context13.t1 = !_context13.sent;
                    (0, _context13.t0)(_context13.t1);
                    _context13.prev = 5;
                    _context13.next = 8;
                    return _index.MoneroUtils.validatePublicSpendKey(publicSpendKey);

                  case 8:
                    fail("Should have thrown exception");
                    _context13.next = 14;
                    break;

                  case 11:
                    _context13.prev = 11;
                    _context13.t2 = _context13["catch"](5);
                    (0, _assert["default"])(_context13.t2.message.length > 0);

                  case 14:
                  case "end":
                    return _context13.stop();
                }
              }
            }, _callee13, null, [[5, 11]]);
          }));
          return _testInvalidPublicSpendKey.apply(this, arguments);
        }

        it("Can convert between XMR and atomic units", function () {
          _assert["default"].equal(_index.MoneroUtils.xmrToAtomicUnits(1).toString(), BigInt("1000000000000").toString());

          _assert["default"].equal(_index.MoneroUtils.atomicUnitsToXmr(BigInt("1000000000000")), 1);

          _assert["default"].equal(_index.MoneroUtils.xmrToAtomicUnits(0.001).toString(), BigInt("1000000000").toString());

          _assert["default"].equal(_index.MoneroUtils.atomicUnitsToXmr(BigInt("1000000000")), .001);

          _assert["default"].equal(_index.MoneroUtils.xmrToAtomicUnits(.25).toString(), BigInt("250000000000").toString());

          _assert["default"].equal(_index.MoneroUtils.atomicUnitsToXmr(BigInt("250000000000")), .25);

          _assert["default"].equal(_index.MoneroUtils.xmrToAtomicUnits(1.25).toString(), BigInt("1250000000000").toString());

          _assert["default"].equal(_index.MoneroUtils.atomicUnitsToXmr(BigInt("1250000000000")), 1.25);

          _assert["default"].equal(_index.MoneroUtils.xmrToAtomicUnits("1").toString(), BigInt("1000000000000").toString());

          _assert["default"].equal(_index.MoneroUtils.atomicUnitsToXmr(BigInt("1000000000000")), 1);

          _assert["default"].equal(_index.MoneroUtils.xmrToAtomicUnits("0.001").toString(), BigInt("1000000000").toString());

          _assert["default"].equal(_index.MoneroUtils.atomicUnitsToXmr(BigInt("1000000000")), .001);

          _assert["default"].equal(_index.MoneroUtils.xmrToAtomicUnits(".25").toString(), BigInt("250000000000").toString());

          _assert["default"].equal(_index.MoneroUtils.atomicUnitsToXmr(BigInt("250000000000")), .25);

          _assert["default"].equal(_index.MoneroUtils.xmrToAtomicUnits("1.25").toString(), BigInt("1250000000000").toString());

          _assert["default"].equal(_index.MoneroUtils.atomicUnitsToXmr(BigInt("1250000000000")), 1.25);
        });
      });
    }
  }]);
  return TestMoneroUtils;
}();

var _default = TestMoneroUtils;
exports["default"] = _default;