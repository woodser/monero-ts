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

var _GenUtils = _interopRequireDefault(require("../common/GenUtils"));

var _LibraryUtils = _interopRequireDefault(require("./LibraryUtils"));

var _MoneroUtils = _interopRequireDefault(require("./MoneroUtils"));

var _ThreadPool = _interopRequireDefault(require("./ThreadPool"));

var _promiseThrottle = _interopRequireDefault(require("promise-throttle"));

var _requestPromise = _interopRequireDefault(require("request-promise"));

var _http = _interopRequireDefault(require("http"));

var _https = _interopRequireDefault(require("https"));

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

/**
 * Handle HTTP requests with a uniform interface.
 * 
 * @hideconstructor
 */
var HttpClient = /*#__PURE__*/function () {
  function HttpClient() {
    (0, _classCallCheck2["default"])(this, HttpClient);
  }

  (0, _createClass2["default"])(HttpClient, null, [{
    key: "request",
    value:
    /**
     * <p>Make a HTTP request.<p>
     * 
     * @param {object} request - configures the request to make
     * @param {string} request.method - HTTP method ("GET", "PUT", "POST", "DELETE", etc)
     * @param {string} request.uri - uri to request
     * @param {string|object|Uint8Array} request.body - request body
     * @param {string} [request.username] - username to authenticate the request (optional)
     * @param {string} [request.password] - password to authenticate the request (optional)
     * @param {object} [request.headers] - headers to add to the request (optional)
     * @param {string} [request.requestApi] - one of "fetch" or "xhr" (default "fetch")
     * @param {boolean} [request.resolveWithFullResponse] - return full response if true, else body only (default false)
     * @param {boolean} [request.rejectUnauthorized] - whether or not to reject self-signed certificates (default true)
     * @param {number} request.timeout - maximum time allowed in milliseconds
     * @param {number} request.proxyToWorker - proxy request to worker thread
     * @returns {object} response - the response object
     * @returns {string|object|Uint8Array} response.body - the response body
     * @returns {number} response.statusCode - the response code
     * @returns {String} response.statusText - the response message
     * @returns {object} response.headers - the response headers
     */
    function () {
      var _request2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee(_request) {
        var parsed, timeout, requestPromise, timeoutPromise;
        return _regenerator["default"].wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                if (!_request.proxyToWorker) {
                  _context.next = 14;
                  break;
                }

                _context.prev = 1;
                _context.next = 4;
                return _LibraryUtils["default"].invokeWorker(_GenUtils["default"].getUUID(), "httpRequest", _request);

              case 4:
                return _context.abrupt("return", _context.sent);

              case 7:
                _context.prev = 7;
                _context.t0 = _context["catch"](1);

                if (!(_context.t0.message.length > 0 && _context.t0.message.charAt(0) === "{")) {
                  _context.next = 14;
                  break;
                }

                parsed = JSON.parse(_context.t0.message);
                _context.t0.message = parsed.statusMessage;
                _context.t0.statusCode = parsed.statusCode;
                throw _context.t0;

              case 14:
                // assign defaults
                _request = Object.assign(HttpClient._DEFAULT_REQUEST, _request); // validate request

                _context.prev = 15;
                _request.host = new URL(_request.uri).host;
                _context.next = 22;
                break;

              case 19:
                _context.prev = 19;
                _context.t1 = _context["catch"](15);
                throw new Error("Invalid request URL: " + _request.uri);

              case 22:
                if (!(_request.body && !(typeof _request.body === "string" || (0, _typeof2["default"])(_request.body) === "object"))) {
                  _context.next = 24;
                  break;
                }

                throw new Error("Request body type is not string or object");

              case 24:
                // initialize one task queue per host
                if (!HttpClient._TASK_QUEUES[_request.host]) HttpClient._TASK_QUEUES[_request.host] = new _ThreadPool["default"](1); // initialize one promise throttle per host

                if (!HttpClient._PROMISE_THROTTLES[_request.host]) {
                  HttpClient._PROMISE_THROTTLES[_request.host] = new _promiseThrottle["default"]({
                    requestsPerSecond: _MoneroUtils["default"].MAX_REQUESTS_PER_SECOND,
                    // TODO: HttpClient should not depend on MoneroUtils for configuration
                    promiseImplementation: Promise
                  });
                } // request using fetch or xhr with timeout


                timeout = _request.timeout ? _request.timeout : HttpClient._DEFAULT_TIMEOUT;
                requestPromise = _request.requestApi === "fetch" ? HttpClient._requestFetch(_request) : HttpClient._requestXhr(_request);
                timeoutPromise = new Promise(function (resolve, reject) {
                  var id = setTimeout(function () {
                    clearTimeout(id);
                    reject('Request timed out in ' + timeout + ' milliseconds');
                  }, timeout);
                });
                return _context.abrupt("return", Promise.race([requestPromise, timeoutPromise]));

              case 30:
              case "end":
                return _context.stop();
            }
          }
        }, _callee, null, [[1, 7], [15, 19]]);
      }));

      function request(_x) {
        return _request2.apply(this, arguments);
      }

      return request;
    }() // ----------------------------- PRIVATE HELPERS ----------------------------

  }, {
    key: "_requestFetch",
    value: function () {
      var _requestFetch2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee3(req) {
        var opts, host, resp, normalizedResponse;
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                // build request options
                opts = {
                  method: req.method,
                  uri: req.uri,
                  body: req.body,
                  agent: req.uri.startsWith("https") ? HttpClient._getHttpsAgent() : HttpClient._getHttpAgent(),
                  rejectUnauthorized: req.rejectUnauthorized,
                  resolveWithFullResponse: req.resolveWithFullResponse,
                  requestCert: true // TODO: part of config?

                };

                if (req.username) {
                  opts.forever = true;
                  opts.auth = {
                    user: req.username,
                    pass: req.password,
                    sendImmediately: false
                  };
                }

                if (req.body instanceof Uint8Array) opts.encoding = null; // queue and throttle request to execute in serial and rate limited

                host = req.host;
                _context3.next = 6;
                return HttpClient._TASK_QUEUES[host].submit( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee2() {
                  return _regenerator["default"].wrap(function _callee2$(_context2) {
                    while (1) {
                      switch (_context2.prev = _context2.next) {
                        case 0:
                          return _context2.abrupt("return", HttpClient._PROMISE_THROTTLES[host].add(function (opts) {
                            return (0, _requestPromise["default"])(opts);
                          }.bind(this, opts)));

                        case 1:
                        case "end":
                          return _context2.stop();
                      }
                    }
                  }, _callee2, this);
                })));

              case 6:
                resp = _context3.sent;
                // normalize response
                normalizedResponse = {};

                if (req.resolveWithFullResponse) {
                  normalizedResponse.statusCode = resp.statusCode;
                  normalizedResponse.statusText = resp.statusMessage;
                  normalizedResponse.headers = resp.headers;
                  normalizedResponse.body = resp.body;
                } else {
                  normalizedResponse.body = resp;
                }

                return _context3.abrupt("return", normalizedResponse);

              case 10:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3);
      }));

      function _requestFetch(_x2) {
        return _requestFetch2.apply(this, arguments);
      }

      return _requestFetch;
    }()
  }, {
    key: "_requestXhr",
    value: function () {
      var _requestXhr2 = (0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee5(req) {
        var method, uri, host, username, password, body, isBinary, resp, normalizedResponse;
        return _regenerator["default"].wrap(function _callee5$(_context5) {
          while (1) {
            switch (_context5.prev = _context5.next) {
              case 0:
                if (!req.headers) {
                  _context5.next = 2;
                  break;
                }

                throw new Error("Custom headers not implemented in XHR request");

              case 2:
                // TODO
                // collect params from request which change on await
                method = req.method;
                uri = req.uri;
                host = req.host;
                username = req.username;
                password = req.password;
                body = req.body;
                isBinary = body instanceof Uint8Array; // queue and throttle requests to execute in serial and rate limited per host

                _context5.next = 11;
                return HttpClient._TASK_QUEUES[host].submit( /*#__PURE__*/(0, _asyncToGenerator2["default"])( /*#__PURE__*/_regenerator["default"].mark(function _callee4() {
                  return _regenerator["default"].wrap(function _callee4$(_context4) {
                    while (1) {
                      switch (_context4.prev = _context4.next) {
                        case 0:
                          return _context4.abrupt("return", HttpClient._PROMISE_THROTTLES[host].add(function () {
                            return new Promise(function (resolve, reject) {
                              var digestAuthRequest = new HttpClient.digestAuthRequest(method, uri, username, password);
                              digestAuthRequest.request(function (resp) {
                                resolve(resp);
                              }, function (resp) {
                                if (resp.status) resolve(resp);else reject(new Error("Request failed without response: " + method + " " + uri));
                              }, body);
                            });
                          }.bind(this)));

                        case 1:
                        case "end":
                          return _context4.stop();
                      }
                    }
                  }, _callee4, this);
                })));

              case 11:
                resp = _context5.sent;
                // normalize response
                normalizedResponse = {};
                normalizedResponse.statusCode = resp.status;
                normalizedResponse.statusText = resp.statusText;
                normalizedResponse.headers = HttpClient._parseXhrResponseHeaders(resp.getAllResponseHeaders());
                normalizedResponse.body = isBinary ? new Uint8Array(resp.response) : resp.response;
                if (normalizedResponse.body instanceof ArrayBuffer) normalizedResponse.body = new Uint8Array(normalizedResponse.body); // handle empty binary request

                return _context5.abrupt("return", normalizedResponse);

              case 19:
              case "end":
                return _context5.stop();
            }
          }
        }, _callee5);
      }));

      function _requestXhr(_x3) {
        return _requestXhr2.apply(this, arguments);
      }

      return _requestXhr;
    }()
    /**
     * Get a singleton instance of an HTTP client to share.
     * 
     * @return {http.Agent} a shared agent for network requests among library instances
     */

  }, {
    key: "_getHttpAgent",
    value: function _getHttpAgent() {
      if (!HttpClient.HTTP_AGENT) {
        HttpClient.HTTP_AGENT = new _http["default"].Agent({
          keepAlive: true
        });
      }

      return HttpClient.HTTP_AGENT;
    }
    /**
     * Get a singleton instance of an HTTPS client to share.
     * 
     * @return {https.Agent} a shared agent for network requests among library instances
     */

  }, {
    key: "_getHttpsAgent",
    value: function _getHttpsAgent() {
      if (!HttpClient.HTTPS_AGENT) {
        HttpClient.HTTPS_AGENT = new _https["default"].Agent({
          keepAlive: true
        });
      }

      return HttpClient.HTTPS_AGENT;
    }
  }, {
    key: "_parseXhrResponseHeaders",
    value: function _parseXhrResponseHeaders(headersStr) {
      var headerMap = {};
      var headers = headersStr.trim().split(/[\r\n]+/);

      var _iterator = _createForOfIteratorHelper(headers),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var header = _step.value;
          var headerVals = header.split(": ");
          headerMap[headerVals[0]] = headerVals[1];
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      return headerMap;
    }
  }]);
  return HttpClient;
}();
/**
 * Modification of digest auth request by @inorganik.
 * 
 * Dependent on CryptoJS MD5 hashing: http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/md5.js
 * 
 * MIT licensed.
 */


HttpClient.digestAuthRequest = function (method, url, username, password) {
  var self = this;

  if (typeof CryptoJS === 'undefined' && typeof require === 'function') {
    var CryptoJS = require('crypto-js');
  }

  this.scheme = null; // we just echo the scheme, to allow for 'Digest', 'X-Digest', 'JDigest' etc

  this.nonce = null; // server issued nonce

  this.realm = null; // server issued realm

  this.qop = null; // "quality of protection" - '' or 'auth' or 'auth-int'

  this.response = null; // hashed response to server challenge

  this.opaque = null; // hashed response to server challenge

  this.nc = 1; // nonce count - increments with each request used with the same nonce

  this.cnonce = null; // client nonce
  // settings

  this.timeout = 60000; // timeout

  this.loggingOn = false; // toggle console logging
  // determine if a post, so that request will send data

  this.post = false;

  if (method.toLowerCase() === 'post' || method.toLowerCase() === 'put') {
    this.post = true;
  } // start here
  // successFn - will be passed JSON data
  // errorFn - will be passed the failed authenticatedRequest
  // data - optional, for POSTS


  this.request = function (successFn, errorFn, data) {
    // stringify json
    if (data) {
      try {
        self.data = data instanceof Uint8Array || typeof data === "string" ? data : JSON.stringify(data);
      } catch (err) {
        console.error(err);
        throw err;
      }
    }

    self.successFn = successFn;
    self.errorFn = errorFn;

    if (!self.nonce) {
      self.makeUnauthenticatedRequest(self.data);
    } else {
      self.makeAuthenticatedRequest();
    }
  };

  this.makeUnauthenticatedRequest = function (data) {
    self.firstRequest = new XMLHttpRequest();
    self.firstRequest.open(method, url, true);
    self.firstRequest.timeout = self.timeout; // if we are posting, add appropriate headers

    if (self.post && data) {
      if (typeof data === "string") {
        self.firstRequest.setRequestHeader('Content-type', 'text/plain');
      } else {
        self.firstRequest.responseType = "arraybuffer";
      }
    }

    self.firstRequest.onreadystatechange = function () {
      // 2: received headers,  3: loading, 4: done
      if (self.firstRequest.readyState === 2) {
        var responseHeaders = self.firstRequest.getAllResponseHeaders();
        responseHeaders = responseHeaders.split('\n'); // get authenticate header

        var digestHeaders;

        for (var i = 0; i < responseHeaders.length; i++) {
          if (responseHeaders[i].match(/www-authenticate/i) != null) {
            digestHeaders = responseHeaders[i];
          }
        }

        if (digestHeaders != null) {
          // parse auth header and get digest auth keys
          digestHeaders = digestHeaders.slice(digestHeaders.indexOf(':') + 1, -1);
          digestHeaders = digestHeaders.split(',');
          self.scheme = digestHeaders[0].split(/\s/)[1];

          for (var i = 0; i < digestHeaders.length; i++) {
            var equalIndex = digestHeaders[i].indexOf('='),
                key = digestHeaders[i].substring(0, equalIndex),
                val = digestHeaders[i].substring(equalIndex + 1);
            val = val.replace(/['"]+/g, ''); // find realm

            if (key.match(/realm/i) != null) {
              self.realm = val;
            } // find nonce


            if (key.match(/nonce/i) != null) {
              self.nonce = val;
            } // find opaque


            if (key.match(/opaque/i) != null) {
              self.opaque = val;
            } // find QOP


            if (key.match(/qop/i) != null) {
              self.qop = val;
            }
          } // client generated keys


          self.cnonce = self.generateCnonce();
          self.nc++; // if logging, show headers received:

          self.log('received headers:');
          self.log('  realm: ' + self.realm);
          self.log('  nonce: ' + self.nonce);
          self.log('  opaque: ' + self.opaque);
          self.log('  qop: ' + self.qop); // now we can make an authenticated request

          self.makeAuthenticatedRequest();
        }
      }

      if (self.firstRequest.readyState === 4) {
        if (self.firstRequest.status === 200) {
          self.log('Authentication not required for ' + url);

          if (data instanceof Uint8Array) {
            self.successFn(self.firstRequest);
          } else {
            if (self.firstRequest.responseText !== 'undefined') {
              if (self.firstRequest.responseText.length > 0) {
                // If JSON, parse and return object
                if (self.isJson(self.firstRequest.responseText)) {
                  // TODO: redundant
                  self.successFn(self.firstRequest);
                } else {
                  self.successFn(self.firstRequest);
                }
              }
            } else {
              self.successFn();
            }
          }
        }
      }
    }; // send


    if (self.post) {
      // in case digest auth not required
      self.firstRequest.send(self.data);
    } else {
      self.firstRequest.send();
    }

    self.log('Unauthenticated request to ' + url); // handle error

    self.firstRequest.onerror = function () {
      if (self.firstRequest.status !== 401) {
        self.log('Error (' + self.firstRequest.status + ') on unauthenticated request to ' + url);
        self.errorFn(self.firstRequest);
      }
    };
  };

  this.makeAuthenticatedRequest = function () {
    self.response = self.formulateResponse();
    self.authenticatedRequest = new XMLHttpRequest();
    self.authenticatedRequest.open(method, url, true);
    self.authenticatedRequest.timeout = self.timeout;
    var digestAuthHeader = self.scheme + ' ' + 'username="' + username + '", ' + 'realm="' + self.realm + '", ' + 'nonce="' + self.nonce + '", ' + 'uri="' + url + '", ' + 'response="' + self.response + '", ' + 'opaque="' + self.opaque + '", ' + 'qop=' + self.qop + ', ' + 'nc=' + ('00000000' + self.nc).slice(-8) + ', ' + 'cnonce="' + self.cnonce + '"';
    self.authenticatedRequest.setRequestHeader('Authorization', digestAuthHeader);
    self.log('digest auth header response to be sent:');
    self.log(digestAuthHeader); // if we are posting, add appropriate headers

    if (self.post && self.data) {
      if (typeof self.data === "string") {
        self.authenticatedRequest.setRequestHeader('Content-type', 'text/plain');
      } else {
        self.authenticatedRequest.responseType = "arraybuffer";
      }
    }

    self.authenticatedRequest.onload = function () {
      // success
      if (self.authenticatedRequest.status >= 200 && self.authenticatedRequest.status < 400) {
        // increment nonce count
        self.nc++; // return data

        if (self.data instanceof Uint8Array) {
          self.successFn(self.authenticatedRequest);
        } else {
          if (self.authenticatedRequest.responseText !== 'undefined' && self.authenticatedRequest.responseText.length > 0) {
            // If JSON, parse and return object
            if (self.isJson(self.authenticatedRequest.responseText)) {
              // TODO: redundant from not parsing
              self.successFn(self.authenticatedRequest);
            } else {
              self.successFn(self.authenticatedRequest);
            }
          } else {
            self.successFn();
          }
        }
      } // failure
      else {
        self.nonce = null;
        self.errorFn(self.authenticatedRequest);
      }
    }; // handle errors


    self.authenticatedRequest.onerror = function () {
      self.log('Error (' + self.authenticatedRequest.status + ') on authenticated request to ' + url);
      self.nonce = null;
      self.errorFn(self.authenticatedRequest);
    }; // send


    if (self.post) {
      self.authenticatedRequest.send(self.data);
    } else {
      self.authenticatedRequest.send();
    }

    self.log('Authenticated request to ' + url);
  }; // hash response based on server challenge


  this.formulateResponse = function () {
    var HA1 = CryptoJS.MD5(username + ':' + self.realm + ':' + password).toString();
    var HA2 = CryptoJS.MD5(method + ':' + url).toString();
    var response = CryptoJS.MD5(HA1 + ':' + self.nonce + ':' + ('00000000' + self.nc).slice(-8) + ':' + self.cnonce + ':' + self.qop + ':' + HA2).toString();
    return response;
  }; // generate 16 char client nonce


  this.generateCnonce = function () {
    var characters = 'abcdef0123456789';
    var token = '';

    for (var i = 0; i < 16; i++) {
      var randNum = Math.round(Math.random() * characters.length);
      token += characters.substr(randNum, 1);
    }

    return token;
  };

  this.abort = function () {
    self.log('[digestAuthRequest] Aborted request to ' + url);

    if (self.firstRequest != null) {
      if (self.firstRequest.readyState != 4) self.firstRequest.abort();
    }

    if (self.authenticatedRequest != null) {
      if (self.authenticatedRequest.readyState != 4) self.authenticatedRequest.abort();
    }
  };

  this.isJson = function (str) {
    try {
      JSON.parse(str);
    } catch (err) {
      return false;
    }

    return true;
  };

  this.log = function (str) {
    if (self.loggingOn) {
      console.log('[digestAuthRequest] ' + str);
    }
  };

  this.version = function () {
    return '0.8.0';
  };
}; // default request config


HttpClient._DEFAULT_REQUEST = {
  method: "GET",
  requestApi: "fetch",
  resolveWithFullResponse: false,
  rejectUnauthorized: true
}; // rate limit requests per host

HttpClient._PROMISE_THROTTLES = [];
HttpClient._TASK_QUEUES = [];
HttpClient._DEFAULT_TIMEOUT = 30000;
var _default = HttpClient;
exports["default"] = _default;