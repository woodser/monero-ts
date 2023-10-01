"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;
var _LibraryUtils = _interopRequireDefault(require("./LibraryUtils"));

var _ThreadPool = _interopRequireDefault(require("./ThreadPool"));
var _promiseThrottle = _interopRequireDefault(require("promise-throttle"));
var _requestPromise = _interopRequireDefault(require("request-promise"));
var _http = _interopRequireDefault(require("http"));
var _https = _interopRequireDefault(require("https"));

/**
 * Handle HTTP requests with a uniform interface.
 */
class HttpClient {

  static MAX_REQUESTS_PER_SECOND = 50;

  // default request config
  static DEFAULT_REQUEST = {
    method: "GET",
    requestApi: "fetch",
    resolveWithFullResponse: false,
    rejectUnauthorized: true
  };

  // rate limit requests per host
  static PROMISE_THROTTLES = [];
  static TASK_QUEUES = [];
  static DEFAULT_TIMEOUT = 60000;
  static MAX_TIMEOUT = 2147483647; // max 32-bit signed number




  /**
   * <p>Make a HTTP request.<p>
   * 
   * @param {object} request - configures the request to make
   * @param {string} request.method - HTTP method ("GET", "PUT", "POST", "DELETE", etc)
   * @param {string} request.uri - uri to request
   * @param {string|Uint8Array|object} request.body - request body
   * @param {string} [request.username] - username to authenticate the request (optional)
   * @param {string} [request.password] - password to authenticate the request (optional)
   * @param {object} [request.headers] - headers to add to the request (optional)
   * @param {string} [request.requestApi] - one of "fetch" or "xhr" (default "fetch")
   * @param {boolean} [request.resolveWithFullResponse] - return full response if true, else body only (default false)
   * @param {boolean} [request.rejectUnauthorized] - whether or not to reject self-signed certificates (default true)
   * @param {number} request.timeout - maximum time allowed in milliseconds
   * @param {number} request.proxyToWorker - proxy request to worker thread
   * @return {object} response - the response object
   * @return {string|Uint8Array|object} response.body - the response body
   * @return {number} response.statusCode - the response code
   * @return {String} response.statusText - the response message
   * @return {object} response.headers - the response headers
   */
  static async request(request) {

    // proxy to worker if configured
    if (request.proxyToWorker) {
      try {
        return await _LibraryUtils.default.invokeWorker(undefined, "httpRequest", request);
      } catch (err) {
        if (err.message.length > 0 && err.message.charAt(0) === "{") {
          let parsed = JSON.parse(err.message);
          err.message = parsed.statusMessage;
          err.statusCode = parsed.statusCode;
        }
        throw err;
      }
    }

    // assign defaults
    request = Object.assign({}, HttpClient.DEFAULT_REQUEST, request);

    // validate request
    try {request.host = new URL(request.uri).host;} // hostname:port
    catch (err) {throw new Error("Invalid request URL: " + request.uri);}
    if (request.body && !(typeof request.body === "string" || typeof request.body === "object")) {
      throw new Error("Request body type is not string or object");
    }

    // initialize one task queue per host
    if (!HttpClient.TASK_QUEUES[request.host]) HttpClient.TASK_QUEUES[request.host] = new _ThreadPool.default(1);

    // initialize one promise throttle per host
    if (!HttpClient.PROMISE_THROTTLES[request.host]) {
      HttpClient.PROMISE_THROTTLES[request.host] = new _promiseThrottle.default({
        requestsPerSecond: HttpClient.MAX_REQUESTS_PER_SECOND, // TODO: HttpClient should not depend on MoneroUtils for configuration
        promiseImplementation: Promise
      });
    }

    // request using fetch or xhr with timeout
    let timeout = request.timeout === undefined ? HttpClient.DEFAULT_TIMEOUT : request.timeout === 0 ? HttpClient.MAX_TIMEOUT : request.timeout;
    let requestPromise = request.requestApi === "fetch" ? HttpClient.requestFetch(request) : HttpClient.requestXhr(request);
    let timeoutPromise = new Promise((resolve, reject) => {
      let id = setTimeout(() => {
        clearTimeout(id);
        reject('Request timed out in ' + timeout + ' milliseconds');
      }, timeout);
    });
    return Promise.race([requestPromise, timeoutPromise]);
  }

  // ----------------------------- PRIVATE HELPERS ----------------------------

  static async requestFetch(req) {

    // build request options
    let opts = {
      method: req.method,
      uri: req.uri,
      body: req.body,
      agent: req.uri.startsWith("https") ? HttpClient.getHttpsAgent() : HttpClient.getHttpAgent(),
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
    if (req.body instanceof Uint8Array) opts.encoding = null;

    // queue and throttle request to execute in serial and rate limited
    let host = req.host;
    let resp = await HttpClient.TASK_QUEUES[host].submit(async function () {
      return HttpClient.PROMISE_THROTTLES[host].add(function (opts) {return (0, _requestPromise.default)(opts);}.bind(this, opts));
    });

    // normalize response
    let normalizedResponse = {};
    if (req.resolveWithFullResponse) {
      normalizedResponse.statusCode = resp.statusCode;
      normalizedResponse.statusText = resp.statusMessage;
      normalizedResponse.headers = resp.headers;
      normalizedResponse.body = resp.body;
    } else {
      normalizedResponse.body = resp;
    }
    return normalizedResponse;
  }

  static async requestXhr(req) {
    if (req.headers) throw new Error("Custom headers not implemented in XHR request"); // TODO

    // collect params from request which change on await
    let method = req.method;
    let uri = req.uri;
    let host = req.host;
    let username = req.username;
    let password = req.password;
    let body = req.body;
    let isBinary = body instanceof Uint8Array;

    // queue and throttle requests to execute in serial and rate limited per host
    let resp = await HttpClient.TASK_QUEUES[host].submit(async function () {
      return HttpClient.PROMISE_THROTTLES[host].add(function () {
        return new Promise(function (resolve, reject) {
          let digestAuthRequest = new HttpClient.digestAuthRequest(method, uri, username, password);
          digestAuthRequest.request(function (resp) {
            resolve(resp);
          }, function (resp) {
            if (resp.status) resolve(resp);else
            reject(new Error("Request failed without response: " + method + " " + uri));
          }, body);
        });
      }.bind(this));
    });

    // normalize response
    let normalizedResponse = {};
    normalizedResponse.statusCode = resp.status;
    normalizedResponse.statusText = resp.statusText;
    normalizedResponse.headers = HttpClient.parseXhrResponseHeaders(resp.getAllResponseHeaders());
    normalizedResponse.body = isBinary ? new Uint8Array(resp.response) : resp.response;
    if (normalizedResponse.body instanceof ArrayBuffer) normalizedResponse.body = new Uint8Array(normalizedResponse.body); // handle empty binary request
    return normalizedResponse;
  }

  /**
   * Get a singleton instance of an HTTP client to share.
   * 
   * @return {http.Agent} a shared agent for network requests among library instances
   */
  static getHttpAgent() {
    if (!HttpClient.HTTP_AGENT) HttpClient.HTTP_AGENT = new _http.default.Agent({
      keepAlive: true,
      family: 4 // use IPv4
    });
    return HttpClient.HTTP_AGENT;
  }

  /**
   * Get a singleton instance of an HTTPS client to share.
   * 
   * @return {https.Agent} a shared agent for network requests among library instances
   */
  static getHttpsAgent() {
    if (!HttpClient.HTTPS_AGENT) HttpClient.HTTPS_AGENT = new _https.default.Agent({
      keepAlive: true,
      family: 4 // use IPv4
    });
    return HttpClient.HTTPS_AGENT;
  }

  static parseXhrResponseHeaders(headersStr) {
    let headerMap = {};
    let headers = headersStr.trim().split(/[\r\n]+/);
    for (let header of headers) {
      let headerVals = header.split(": ");
      headerMap[headerVals[0]] = headerVals[1];
    }
    return headerMap;
  }

  /**
   * Modification of digest auth request by @inorganik.
   * 
   * Dependent on CryptoJS MD5 hashing: http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/md5.js
   * 
   * MIT licensed.
   */
  static digestAuthRequest = function (method, url, username, password) {
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
    }

    // start here
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
      self.firstRequest.timeout = self.timeout;
      // if we are posting, add appropriate headers
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
          responseHeaders = responseHeaders.split('\n');
          // get authenticate header
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
              val = val.replace(/['"]+/g, '');
              // find realm
              if (key.match(/realm/i) != null) {
                self.realm = val;
              }
              // find nonce
              if (key.match(/nonce/i) != null) {
                self.nonce = val;
              }
              // find opaque
              if (key.match(/opaque/i) != null) {
                self.opaque = val;
              }
              // find QOP
              if (key.match(/qop/i) != null) {
                self.qop = val;
              }
            }
            // client generated keys
            self.cnonce = self.generateCnonce();
            self.nc++;
            // if logging, show headers received:
            self.log('received headers:');
            self.log('  realm: ' + self.realm);
            self.log('  nonce: ' + self.nonce);
            self.log('  opaque: ' + self.opaque);
            self.log('  qop: ' + self.qop);
            // now we can make an authenticated request
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
                  if (self.isJson(self.firstRequest.responseText)) {// TODO: redundant
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
      };
      // send
      if (self.post) {
        // in case digest auth not required
        self.firstRequest.send(self.data);
      } else {
        self.firstRequest.send();
      }
      self.log('Unauthenticated request to ' + url);

      // handle error
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
      var digestAuthHeader = self.scheme + ' ' +
      'username="' + username + '", ' +
      'realm="' + self.realm + '", ' +
      'nonce="' + self.nonce + '", ' +
      'uri="' + url + '", ' +
      'response="' + self.response + '", ' +
      'opaque="' + self.opaque + '", ' +
      'qop=' + self.qop + ', ' +
      'nc=' + ('00000000' + self.nc).slice(-8) + ', ' +
      'cnonce="' + self.cnonce + '"';
      self.authenticatedRequest.setRequestHeader('Authorization', digestAuthHeader);
      self.log('digest auth header response to be sent:');
      self.log(digestAuthHeader);
      // if we are posting, add appropriate headers
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
          self.nc++;
          // return data
          if (self.data instanceof Uint8Array) {
            self.successFn(self.authenticatedRequest);
          } else {
            if (self.authenticatedRequest.responseText !== 'undefined' && self.authenticatedRequest.responseText.length > 0) {
              // If JSON, parse and return object
              if (self.isJson(self.authenticatedRequest.responseText)) {// TODO: redundant from not parsing
                self.successFn(self.authenticatedRequest);
              } else {
                self.successFn(self.authenticatedRequest);
              }
            } else {
              self.successFn();
            }
          }
        }
        // failure
        else {
          self.nonce = null;
          self.errorFn(self.authenticatedRequest);
        }
      };
      // handle errors
      self.authenticatedRequest.onerror = function () {
        self.log('Error (' + self.authenticatedRequest.status + ') on authenticated request to ' + url);
        self.nonce = null;
        self.errorFn(self.authenticatedRequest);
      };
      // send
      if (self.post) {
        self.authenticatedRequest.send(self.data);
      } else {
        self.authenticatedRequest.send();
      }
      self.log('Authenticated request to ' + url);
    };
    // hash response based on server challenge
    this.formulateResponse = function () {
      var HA1 = CryptoJS.MD5(username + ':' + self.realm + ':' + password).toString();
      var HA2 = CryptoJS.MD5(method + ':' + url).toString();
      var response = CryptoJS.MD5(HA1 + ':' +
      self.nonce + ':' +
      ('00000000' + self.nc).slice(-8) + ':' +
      self.cnonce + ':' +
      self.qop + ':' +
      HA2).toString();
      return response;
    };
    // generate 16 char client nonce
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
    this.version = function () {return '0.8.0';};
  };
}exports.default = HttpClient;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfTGlicmFyeVV0aWxzIiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfVGhyZWFkUG9vbCIsIl9wcm9taXNlVGhyb3R0bGUiLCJfcmVxdWVzdFByb21pc2UiLCJfaHR0cCIsIl9odHRwcyIsIkh0dHBDbGllbnQiLCJNQVhfUkVRVUVTVFNfUEVSX1NFQ09ORCIsIkRFRkFVTFRfUkVRVUVTVCIsIm1ldGhvZCIsInJlcXVlc3RBcGkiLCJyZXNvbHZlV2l0aEZ1bGxSZXNwb25zZSIsInJlamVjdFVuYXV0aG9yaXplZCIsIlBST01JU0VfVEhST1RUTEVTIiwiVEFTS19RVUVVRVMiLCJERUZBVUxUX1RJTUVPVVQiLCJNQVhfVElNRU9VVCIsInJlcXVlc3QiLCJwcm94eVRvV29ya2VyIiwiTGlicmFyeVV0aWxzIiwiaW52b2tlV29ya2VyIiwidW5kZWZpbmVkIiwiZXJyIiwibWVzc2FnZSIsImxlbmd0aCIsImNoYXJBdCIsInBhcnNlZCIsIkpTT04iLCJwYXJzZSIsInN0YXR1c01lc3NhZ2UiLCJzdGF0dXNDb2RlIiwiT2JqZWN0IiwiYXNzaWduIiwiaG9zdCIsIlVSTCIsInVyaSIsIkVycm9yIiwiYm9keSIsIlRocmVhZFBvb2wiLCJQcm9taXNlVGhyb3R0bGUiLCJyZXF1ZXN0c1BlclNlY29uZCIsInByb21pc2VJbXBsZW1lbnRhdGlvbiIsIlByb21pc2UiLCJ0aW1lb3V0IiwicmVxdWVzdFByb21pc2UiLCJyZXF1ZXN0RmV0Y2giLCJyZXF1ZXN0WGhyIiwidGltZW91dFByb21pc2UiLCJyZXNvbHZlIiwicmVqZWN0IiwiaWQiLCJzZXRUaW1lb3V0IiwiY2xlYXJUaW1lb3V0IiwicmFjZSIsInJlcSIsIm9wdHMiLCJhZ2VudCIsInN0YXJ0c1dpdGgiLCJnZXRIdHRwc0FnZW50IiwiZ2V0SHR0cEFnZW50IiwicmVxdWVzdENlcnQiLCJ1c2VybmFtZSIsImZvcmV2ZXIiLCJhdXRoIiwidXNlciIsInBhc3MiLCJwYXNzd29yZCIsInNlbmRJbW1lZGlhdGVseSIsIlVpbnQ4QXJyYXkiLCJlbmNvZGluZyIsInJlc3AiLCJzdWJtaXQiLCJhZGQiLCJSZXF1ZXN0IiwiYmluZCIsIm5vcm1hbGl6ZWRSZXNwb25zZSIsInN0YXR1c1RleHQiLCJoZWFkZXJzIiwiaXNCaW5hcnkiLCJkaWdlc3RBdXRoUmVxdWVzdCIsInN0YXR1cyIsInBhcnNlWGhyUmVzcG9uc2VIZWFkZXJzIiwiZ2V0QWxsUmVzcG9uc2VIZWFkZXJzIiwicmVzcG9uc2UiLCJBcnJheUJ1ZmZlciIsIkhUVFBfQUdFTlQiLCJodHRwIiwiQWdlbnQiLCJrZWVwQWxpdmUiLCJmYW1pbHkiLCJIVFRQU19BR0VOVCIsImh0dHBzIiwiaGVhZGVyc1N0ciIsImhlYWRlck1hcCIsInRyaW0iLCJzcGxpdCIsImhlYWRlciIsImhlYWRlclZhbHMiLCJ1cmwiLCJzZWxmIiwiQ3J5cHRvSlMiLCJzY2hlbWUiLCJub25jZSIsInJlYWxtIiwicW9wIiwib3BhcXVlIiwibmMiLCJjbm9uY2UiLCJsb2dnaW5nT24iLCJwb3N0IiwidG9Mb3dlckNhc2UiLCJzdWNjZXNzRm4iLCJlcnJvckZuIiwiZGF0YSIsInN0cmluZ2lmeSIsImNvbnNvbGUiLCJlcnJvciIsIm1ha2VVbmF1dGhlbnRpY2F0ZWRSZXF1ZXN0IiwibWFrZUF1dGhlbnRpY2F0ZWRSZXF1ZXN0IiwiZmlyc3RSZXF1ZXN0IiwiWE1MSHR0cFJlcXVlc3QiLCJvcGVuIiwic2V0UmVxdWVzdEhlYWRlciIsInJlc3BvbnNlVHlwZSIsIm9ucmVhZHlzdGF0ZWNoYW5nZSIsInJlYWR5U3RhdGUiLCJyZXNwb25zZUhlYWRlcnMiLCJkaWdlc3RIZWFkZXJzIiwiaSIsIm1hdGNoIiwic2xpY2UiLCJpbmRleE9mIiwiZXF1YWxJbmRleCIsImtleSIsInN1YnN0cmluZyIsInZhbCIsInJlcGxhY2UiLCJnZW5lcmF0ZUNub25jZSIsImxvZyIsInJlc3BvbnNlVGV4dCIsImlzSnNvbiIsInNlbmQiLCJvbmVycm9yIiwiZm9ybXVsYXRlUmVzcG9uc2UiLCJhdXRoZW50aWNhdGVkUmVxdWVzdCIsImRpZ2VzdEF1dGhIZWFkZXIiLCJvbmxvYWQiLCJIQTEiLCJNRDUiLCJ0b1N0cmluZyIsIkhBMiIsImNoYXJhY3RlcnMiLCJ0b2tlbiIsInJhbmROdW0iLCJNYXRoIiwicm91bmQiLCJyYW5kb20iLCJzdWJzdHIiLCJhYm9ydCIsInN0ciIsInZlcnNpb24iLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL2NvbW1vbi9IdHRwQ2xpZW50LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi9HZW5VdGlsc1wiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBNb25lcm9VdGlscyBmcm9tIFwiLi9Nb25lcm9VdGlsc1wiO1xuaW1wb3J0IFRocmVhZFBvb2wgZnJvbSBcIi4vVGhyZWFkUG9vbFwiO1xuaW1wb3J0IFByb21pc2VUaHJvdHRsZSBmcm9tIFwicHJvbWlzZS10aHJvdHRsZVwiO1xuaW1wb3J0IFJlcXVlc3QgZnJvbSBcInJlcXVlc3QtcHJvbWlzZVwiO1xuaW1wb3J0IGh0dHAgZnJvbSBcImh0dHBcIjtcbmltcG9ydCBodHRwcyBmcm9tIFwiaHR0cHNcIjtcblxuLyoqXG4gKiBIYW5kbGUgSFRUUCByZXF1ZXN0cyB3aXRoIGEgdW5pZm9ybSBpbnRlcmZhY2UuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEh0dHBDbGllbnQge1xuXG4gIHN0YXRpYyBNQVhfUkVRVUVTVFNfUEVSX1NFQ09ORCA9IDUwXG5cbiAgLy8gZGVmYXVsdCByZXF1ZXN0IGNvbmZpZ1xuICBwcm90ZWN0ZWQgc3RhdGljIERFRkFVTFRfUkVRVUVTVCA9IHtcbiAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgcmVxdWVzdEFwaTogXCJmZXRjaFwiLFxuICAgIHJlc29sdmVXaXRoRnVsbFJlc3BvbnNlOiBmYWxzZSxcbiAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHRydWVcbiAgfVxuXG4gIC8vIHJhdGUgbGltaXQgcmVxdWVzdHMgcGVyIGhvc3RcbiAgcHJvdGVjdGVkIHN0YXRpYyBQUk9NSVNFX1RIUk9UVExFUyA9IFtdO1xuICBwcm90ZWN0ZWQgc3RhdGljIFRBU0tfUVVFVUVTID0gW107XG4gIHByb3RlY3RlZCBzdGF0aWMgREVGQVVMVF9USU1FT1VUID0gNjAwMDA7XG4gIHN0YXRpYyBNQVhfVElNRU9VVCA9IDIxNDc0ODM2NDc7IC8vIG1heCAzMi1iaXQgc2lnbmVkIG51bWJlclxuXG4gIHByb3RlY3RlZCBzdGF0aWMgSFRUUF9BR0VOVDogYW55O1xuICBwcm90ZWN0ZWQgc3RhdGljIEhUVFBTX0FHRU5UOiBhbnk7XG4gIFxuICAvKipcbiAgICogPHA+TWFrZSBhIEhUVFAgcmVxdWVzdC48cD5cbiAgICogXG4gICAqIEBwYXJhbSB7b2JqZWN0fSByZXF1ZXN0IC0gY29uZmlndXJlcyB0aGUgcmVxdWVzdCB0byBtYWtlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZXF1ZXN0Lm1ldGhvZCAtIEhUVFAgbWV0aG9kIChcIkdFVFwiLCBcIlBVVFwiLCBcIlBPU1RcIiwgXCJERUxFVEVcIiwgZXRjKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcmVxdWVzdC51cmkgLSB1cmkgdG8gcmVxdWVzdFxuICAgKiBAcGFyYW0ge3N0cmluZ3xVaW50OEFycmF5fG9iamVjdH0gcmVxdWVzdC5ib2R5IC0gcmVxdWVzdCBib2R5XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcmVxdWVzdC51c2VybmFtZV0gLSB1c2VybmFtZSB0byBhdXRoZW50aWNhdGUgdGhlIHJlcXVlc3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3JlcXVlc3QucGFzc3dvcmRdIC0gcGFzc3dvcmQgdG8gYXV0aGVudGljYXRlIHRoZSByZXF1ZXN0IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtvYmplY3R9IFtyZXF1ZXN0LmhlYWRlcnNdIC0gaGVhZGVycyB0byBhZGQgdG8gdGhlIHJlcXVlc3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3JlcXVlc3QucmVxdWVzdEFwaV0gLSBvbmUgb2YgXCJmZXRjaFwiIG9yIFwieGhyXCIgKGRlZmF1bHQgXCJmZXRjaFwiKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtyZXF1ZXN0LnJlc29sdmVXaXRoRnVsbFJlc3BvbnNlXSAtIHJldHVybiBmdWxsIHJlc3BvbnNlIGlmIHRydWUsIGVsc2UgYm9keSBvbmx5IChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtyZXF1ZXN0LnJlamVjdFVuYXV0aG9yaXplZF0gLSB3aGV0aGVyIG9yIG5vdCB0byByZWplY3Qgc2VsZi1zaWduZWQgY2VydGlmaWNhdGVzIChkZWZhdWx0IHRydWUpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByZXF1ZXN0LnRpbWVvdXQgLSBtYXhpbXVtIHRpbWUgYWxsb3dlZCBpbiBtaWxsaXNlY29uZHNcbiAgICogQHBhcmFtIHtudW1iZXJ9IHJlcXVlc3QucHJveHlUb1dvcmtlciAtIHByb3h5IHJlcXVlc3QgdG8gd29ya2VyIHRocmVhZFxuICAgKiBAcmV0dXJuIHtvYmplY3R9IHJlc3BvbnNlIC0gdGhlIHJlc3BvbnNlIG9iamVjdFxuICAgKiBAcmV0dXJuIHtzdHJpbmd8VWludDhBcnJheXxvYmplY3R9IHJlc3BvbnNlLmJvZHkgLSB0aGUgcmVzcG9uc2UgYm9keVxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IHJlc3BvbnNlLnN0YXR1c0NvZGUgLSB0aGUgcmVzcG9uc2UgY29kZVxuICAgKiBAcmV0dXJuIHtTdHJpbmd9IHJlc3BvbnNlLnN0YXR1c1RleHQgLSB0aGUgcmVzcG9uc2UgbWVzc2FnZVxuICAgKiBAcmV0dXJuIHtvYmplY3R9IHJlc3BvbnNlLmhlYWRlcnMgLSB0aGUgcmVzcG9uc2UgaGVhZGVyc1xuICAgKi9cbiAgc3RhdGljIGFzeW5jIHJlcXVlc3QocmVxdWVzdCkge1xuICAgIFxuICAgIC8vIHByb3h5IHRvIHdvcmtlciBpZiBjb25maWd1cmVkXG4gICAgaWYgKHJlcXVlc3QucHJveHlUb1dvcmtlcikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIodW5kZWZpbmVkLCBcImh0dHBSZXF1ZXN0XCIsIHJlcXVlc3QpO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgaWYgKGVyci5tZXNzYWdlLmxlbmd0aCA+IDAgJiYgZXJyLm1lc3NhZ2UuY2hhckF0KDApID09PSBcIntcIikge1xuICAgICAgICAgIGxldCBwYXJzZWQgPSBKU09OLnBhcnNlKGVyci5tZXNzYWdlKTtcbiAgICAgICAgICBlcnIubWVzc2FnZSA9IHBhcnNlZC5zdGF0dXNNZXNzYWdlO1xuICAgICAgICAgIGVyci5zdGF0dXNDb2RlID0gcGFyc2VkLnN0YXR1c0NvZGU7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBhc3NpZ24gZGVmYXVsdHNcbiAgICByZXF1ZXN0ID0gT2JqZWN0LmFzc2lnbih7fSwgSHR0cENsaWVudC5ERUZBVUxUX1JFUVVFU1QsIHJlcXVlc3QpO1xuICAgIFxuICAgIC8vIHZhbGlkYXRlIHJlcXVlc3RcbiAgICB0cnkgeyByZXF1ZXN0Lmhvc3QgPSBuZXcgVVJMKHJlcXVlc3QudXJpKS5ob3N0OyB9IC8vIGhvc3RuYW1lOnBvcnRcbiAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgcmVxdWVzdCBVUkw6IFwiICsgcmVxdWVzdC51cmkpOyB9XG4gICAgaWYgKHJlcXVlc3QuYm9keSAmJiAhKHR5cGVvZiByZXF1ZXN0LmJvZHkgPT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIHJlcXVlc3QuYm9keSA9PT0gXCJvYmplY3RcIikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlJlcXVlc3QgYm9keSB0eXBlIGlzIG5vdCBzdHJpbmcgb3Igb2JqZWN0XCIpO1xuICAgIH1cbiAgICBcbiAgICAvLyBpbml0aWFsaXplIG9uZSB0YXNrIHF1ZXVlIHBlciBob3N0XG4gICAgaWYgKCFIdHRwQ2xpZW50LlRBU0tfUVVFVUVTW3JlcXVlc3QuaG9zdF0pIEh0dHBDbGllbnQuVEFTS19RVUVVRVNbcmVxdWVzdC5ob3N0XSA9IG5ldyBUaHJlYWRQb29sKDEpO1xuICAgIFxuICAgIC8vIGluaXRpYWxpemUgb25lIHByb21pc2UgdGhyb3R0bGUgcGVyIGhvc3RcbiAgICBpZiAoIUh0dHBDbGllbnQuUFJPTUlTRV9USFJPVFRMRVNbcmVxdWVzdC5ob3N0XSkge1xuICAgICAgSHR0cENsaWVudC5QUk9NSVNFX1RIUk9UVExFU1tyZXF1ZXN0Lmhvc3RdID0gbmV3IFByb21pc2VUaHJvdHRsZSh7XG4gICAgICAgIHJlcXVlc3RzUGVyU2Vjb25kOiBIdHRwQ2xpZW50Lk1BWF9SRVFVRVNUU19QRVJfU0VDT05ELCAvLyBUT0RPOiBIdHRwQ2xpZW50IHNob3VsZCBub3QgZGVwZW5kIG9uIE1vbmVyb1V0aWxzIGZvciBjb25maWd1cmF0aW9uXG4gICAgICAgIHByb21pc2VJbXBsZW1lbnRhdGlvbjogUHJvbWlzZVxuICAgICAgfSk7XG4gICAgfVxuICAgIFxuICAgIC8vIHJlcXVlc3QgdXNpbmcgZmV0Y2ggb3IgeGhyIHdpdGggdGltZW91dFxuICAgIGxldCB0aW1lb3V0ID0gcmVxdWVzdC50aW1lb3V0ID09PSB1bmRlZmluZWQgPyBIdHRwQ2xpZW50LkRFRkFVTFRfVElNRU9VVCA6IHJlcXVlc3QudGltZW91dCA9PT0gMCA/IEh0dHBDbGllbnQuTUFYX1RJTUVPVVQgOiByZXF1ZXN0LnRpbWVvdXQ7XG4gICAgbGV0IHJlcXVlc3RQcm9taXNlID0gcmVxdWVzdC5yZXF1ZXN0QXBpID09PSBcImZldGNoXCIgPyBIdHRwQ2xpZW50LnJlcXVlc3RGZXRjaChyZXF1ZXN0KSA6IEh0dHBDbGllbnQucmVxdWVzdFhocihyZXF1ZXN0KTtcbiAgICBsZXQgdGltZW91dFByb21pc2UgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBsZXQgaWQgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgY2xlYXJUaW1lb3V0KGlkKTtcbiAgICAgICAgcmVqZWN0KCdSZXF1ZXN0IHRpbWVkIG91dCBpbiAnKyB0aW1lb3V0ICsgJyBtaWxsaXNlY29uZHMnKVxuICAgICAgfSwgdGltZW91dCk7XG4gICAgfSk7XG4gICAgcmV0dXJuIFByb21pc2UucmFjZShbcmVxdWVzdFByb21pc2UsIHRpbWVvdXRQcm9taXNlXSk7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgSEVMUEVSUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIHJlcXVlc3RGZXRjaChyZXEpIHtcbiAgICBcbiAgICAvLyBidWlsZCByZXF1ZXN0IG9wdGlvbnNcbiAgICBsZXQgb3B0czogYW55ID0ge1xuICAgICAgbWV0aG9kOiByZXEubWV0aG9kLFxuICAgICAgdXJpOiByZXEudXJpLFxuICAgICAgYm9keTogcmVxLmJvZHksXG4gICAgICBhZ2VudDogcmVxLnVyaS5zdGFydHNXaXRoKFwiaHR0cHNcIikgPyBIdHRwQ2xpZW50LmdldEh0dHBzQWdlbnQoKSA6IEh0dHBDbGllbnQuZ2V0SHR0cEFnZW50KCksXG4gICAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHJlcS5yZWplY3RVbmF1dGhvcml6ZWQsXG4gICAgICByZXNvbHZlV2l0aEZ1bGxSZXNwb25zZTogcmVxLnJlc29sdmVXaXRoRnVsbFJlc3BvbnNlLFxuICAgICAgcmVxdWVzdENlcnQ6IHRydWUgLy8gVE9ETzogcGFydCBvZiBjb25maWc/XG4gICAgfTtcbiAgICBpZiAocmVxLnVzZXJuYW1lKSB7XG4gICAgICBvcHRzLmZvcmV2ZXIgPSB0cnVlO1xuICAgICAgb3B0cy5hdXRoID0ge1xuICAgICAgICB1c2VyOiByZXEudXNlcm5hbWUsXG4gICAgICAgIHBhc3M6IHJlcS5wYXNzd29yZCxcbiAgICAgICAgc2VuZEltbWVkaWF0ZWx5OiBmYWxzZVxuICAgICAgfVxuICAgIH1cbiAgICBpZiAocmVxLmJvZHkgaW5zdGFuY2VvZiBVaW50OEFycmF5KSBvcHRzLmVuY29kaW5nID0gbnVsbDtcbiAgICBcbiAgICAvLyBxdWV1ZSBhbmQgdGhyb3R0bGUgcmVxdWVzdCB0byBleGVjdXRlIGluIHNlcmlhbCBhbmQgcmF0ZSBsaW1pdGVkXG4gICAgbGV0IGhvc3QgPSByZXEuaG9zdDtcbiAgICBsZXQgcmVzcCA9IGF3YWl0IEh0dHBDbGllbnQuVEFTS19RVUVVRVNbaG9zdF0uc3VibWl0KGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIEh0dHBDbGllbnQuUFJPTUlTRV9USFJPVFRMRVNbaG9zdF0uYWRkKGZ1bmN0aW9uKG9wdHMpIHsgcmV0dXJuIFJlcXVlc3Qob3B0cyk7IH0uYmluZCh0aGlzLCBvcHRzKSk7XG4gICAgfSk7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIHJlc3BvbnNlXG4gICAgbGV0IG5vcm1hbGl6ZWRSZXNwb25zZTogYW55ID0ge307XG4gICAgaWYgKHJlcS5yZXNvbHZlV2l0aEZ1bGxSZXNwb25zZSkge1xuICAgICAgbm9ybWFsaXplZFJlc3BvbnNlLnN0YXR1c0NvZGUgPSByZXNwLnN0YXR1c0NvZGU7XG4gICAgICBub3JtYWxpemVkUmVzcG9uc2Uuc3RhdHVzVGV4dCA9IHJlc3Auc3RhdHVzTWVzc2FnZTtcbiAgICAgIG5vcm1hbGl6ZWRSZXNwb25zZS5oZWFkZXJzID0gcmVzcC5oZWFkZXJzO1xuICAgICAgbm9ybWFsaXplZFJlc3BvbnNlLmJvZHkgPSByZXNwLmJvZHk7XG4gICAgfSBlbHNlIHtcbiAgICAgIG5vcm1hbGl6ZWRSZXNwb25zZS5ib2R5ID0gcmVzcDtcbiAgICB9XG4gICAgcmV0dXJuIG5vcm1hbGl6ZWRSZXNwb25zZTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyByZXF1ZXN0WGhyKHJlcSkge1xuICAgIGlmIChyZXEuaGVhZGVycykgdGhyb3cgbmV3IEVycm9yKFwiQ3VzdG9tIGhlYWRlcnMgbm90IGltcGxlbWVudGVkIGluIFhIUiByZXF1ZXN0XCIpOyAgLy8gVE9ET1xuICAgIFxuICAgIC8vIGNvbGxlY3QgcGFyYW1zIGZyb20gcmVxdWVzdCB3aGljaCBjaGFuZ2Ugb24gYXdhaXRcbiAgICBsZXQgbWV0aG9kID0gcmVxLm1ldGhvZDtcbiAgICBsZXQgdXJpID0gcmVxLnVyaTtcbiAgICBsZXQgaG9zdCA9IHJlcS5ob3N0O1xuICAgIGxldCB1c2VybmFtZSA9IHJlcS51c2VybmFtZTtcbiAgICBsZXQgcGFzc3dvcmQgPSByZXEucGFzc3dvcmQ7XG4gICAgbGV0IGJvZHkgPSByZXEuYm9keTtcbiAgICBsZXQgaXNCaW5hcnkgPSBib2R5IGluc3RhbmNlb2YgVWludDhBcnJheTtcbiAgICBcbiAgICAvLyBxdWV1ZSBhbmQgdGhyb3R0bGUgcmVxdWVzdHMgdG8gZXhlY3V0ZSBpbiBzZXJpYWwgYW5kIHJhdGUgbGltaXRlZCBwZXIgaG9zdFxuICAgIGxldCByZXNwID0gYXdhaXQgSHR0cENsaWVudC5UQVNLX1FVRVVFU1tob3N0XS5zdWJtaXQoYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICByZXR1cm4gSHR0cENsaWVudC5QUk9NSVNFX1RIUk9UVExFU1tob3N0XS5hZGQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgICBsZXQgZGlnZXN0QXV0aFJlcXVlc3QgPSBuZXcgSHR0cENsaWVudC5kaWdlc3RBdXRoUmVxdWVzdChtZXRob2QsIHVyaSwgdXNlcm5hbWUsIHBhc3N3b3JkKTtcbiAgICAgICAgICBkaWdlc3RBdXRoUmVxdWVzdC5yZXF1ZXN0KGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgICAgfSwgZnVuY3Rpb24ocmVzcCkge1xuICAgICAgICAgICAgaWYgKHJlc3Auc3RhdHVzKSByZXNvbHZlKHJlc3ApO1xuICAgICAgICAgICAgZWxzZSByZWplY3QobmV3IEVycm9yKFwiUmVxdWVzdCBmYWlsZWQgd2l0aG91dCByZXNwb25zZTogXCIgKyBtZXRob2QgKyBcIiBcIiArIHVyaSkpO1xuICAgICAgICAgIH0sIGJvZHkpO1xuICAgICAgICB9KTtcbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfSk7XG4gICAgXG4gICAgLy8gbm9ybWFsaXplIHJlc3BvbnNlXG4gICAgbGV0IG5vcm1hbGl6ZWRSZXNwb25zZTogYW55ID0ge307XG4gICAgbm9ybWFsaXplZFJlc3BvbnNlLnN0YXR1c0NvZGUgPSByZXNwLnN0YXR1cztcbiAgICBub3JtYWxpemVkUmVzcG9uc2Uuc3RhdHVzVGV4dCA9IHJlc3Auc3RhdHVzVGV4dDtcbiAgICBub3JtYWxpemVkUmVzcG9uc2UuaGVhZGVycyA9IEh0dHBDbGllbnQucGFyc2VYaHJSZXNwb25zZUhlYWRlcnMocmVzcC5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKSk7XG4gICAgbm9ybWFsaXplZFJlc3BvbnNlLmJvZHkgPSBpc0JpbmFyeSA/IG5ldyBVaW50OEFycmF5KHJlc3AucmVzcG9uc2UpIDogcmVzcC5yZXNwb25zZTtcbiAgICBpZiAobm9ybWFsaXplZFJlc3BvbnNlLmJvZHkgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikgbm9ybWFsaXplZFJlc3BvbnNlLmJvZHkgPSBuZXcgVWludDhBcnJheShub3JtYWxpemVkUmVzcG9uc2UuYm9keSk7ICAvLyBoYW5kbGUgZW1wdHkgYmluYXJ5IHJlcXVlc3RcbiAgICByZXR1cm4gbm9ybWFsaXplZFJlc3BvbnNlO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgc2luZ2xldG9uIGluc3RhbmNlIG9mIGFuIEhUVFAgY2xpZW50IHRvIHNoYXJlLlxuICAgKiBcbiAgICogQHJldHVybiB7aHR0cC5BZ2VudH0gYSBzaGFyZWQgYWdlbnQgZm9yIG5ldHdvcmsgcmVxdWVzdHMgYW1vbmcgbGlicmFyeSBpbnN0YW5jZXNcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgZ2V0SHR0cEFnZW50KCkge1xuICAgIGlmICghSHR0cENsaWVudC5IVFRQX0FHRU5UKSBIdHRwQ2xpZW50LkhUVFBfQUdFTlQgPSBuZXcgaHR0cC5BZ2VudCh7XG4gICAgICBrZWVwQWxpdmU6IHRydWUsXG4gICAgICBmYW1pbHk6IDQgLy8gdXNlIElQdjRcbiAgICB9KTtcbiAgICByZXR1cm4gSHR0cENsaWVudC5IVFRQX0FHRU5UO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgc2luZ2xldG9uIGluc3RhbmNlIG9mIGFuIEhUVFBTIGNsaWVudCB0byBzaGFyZS5cbiAgICogXG4gICAqIEByZXR1cm4ge2h0dHBzLkFnZW50fSBhIHNoYXJlZCBhZ2VudCBmb3IgbmV0d29yayByZXF1ZXN0cyBhbW9uZyBsaWJyYXJ5IGluc3RhbmNlc1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBnZXRIdHRwc0FnZW50KCkge1xuICAgIGlmICghSHR0cENsaWVudC5IVFRQU19BR0VOVCkgSHR0cENsaWVudC5IVFRQU19BR0VOVCA9IG5ldyBodHRwcy5BZ2VudCh7XG4gICAgICBrZWVwQWxpdmU6IHRydWUsXG4gICAgICBmYW1pbHk6IDQgLy8gdXNlIElQdjRcbiAgICB9KTtcbiAgICByZXR1cm4gSHR0cENsaWVudC5IVFRQU19BR0VOVDtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBwYXJzZVhoclJlc3BvbnNlSGVhZGVycyhoZWFkZXJzU3RyKSB7XG4gICAgbGV0IGhlYWRlck1hcCA9IHt9O1xuICAgIGxldCBoZWFkZXJzID0gaGVhZGVyc1N0ci50cmltKCkuc3BsaXQoL1tcXHJcXG5dKy8pO1xuICAgIGZvciAobGV0IGhlYWRlciBvZiBoZWFkZXJzKSB7XG4gICAgICBsZXQgaGVhZGVyVmFscyA9IGhlYWRlci5zcGxpdChcIjogXCIpO1xuICAgICAgaGVhZGVyTWFwW2hlYWRlclZhbHNbMF1dID0gaGVhZGVyVmFsc1sxXTtcbiAgICB9XG4gICAgcmV0dXJuIGhlYWRlck1hcDtcbiAgfVxuXG4gIC8qKlxuICAgKiBNb2RpZmljYXRpb24gb2YgZGlnZXN0IGF1dGggcmVxdWVzdCBieSBAaW5vcmdhbmlrLlxuICAgKiBcbiAgICogRGVwZW5kZW50IG9uIENyeXB0b0pTIE1ENSBoYXNoaW5nOiBodHRwOi8vY3J5cHRvLWpzLmdvb2dsZWNvZGUuY29tL3N2bi90YWdzLzMuMS4yL2J1aWxkL3JvbGx1cHMvbWQ1LmpzXG4gICAqIFxuICAgKiBNSVQgbGljZW5zZWQuXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGRpZ2VzdEF1dGhSZXF1ZXN0ID0gZnVuY3Rpb24obWV0aG9kLCB1cmwsIHVzZXJuYW1lLCBwYXNzd29yZCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGlmICh0eXBlb2YgQ3J5cHRvSlMgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiByZXF1aXJlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YXIgQ3J5cHRvSlMgPSByZXF1aXJlKCdjcnlwdG8tanMnKTtcbiAgICB9XG5cbiAgICB0aGlzLnNjaGVtZSA9IG51bGw7IC8vIHdlIGp1c3QgZWNobyB0aGUgc2NoZW1lLCB0byBhbGxvdyBmb3IgJ0RpZ2VzdCcsICdYLURpZ2VzdCcsICdKRGlnZXN0JyBldGNcbiAgICB0aGlzLm5vbmNlID0gbnVsbDsgLy8gc2VydmVyIGlzc3VlZCBub25jZVxuICAgIHRoaXMucmVhbG0gPSBudWxsOyAvLyBzZXJ2ZXIgaXNzdWVkIHJlYWxtXG4gICAgdGhpcy5xb3AgPSBudWxsOyAvLyBcInF1YWxpdHkgb2YgcHJvdGVjdGlvblwiIC0gJycgb3IgJ2F1dGgnIG9yICdhdXRoLWludCdcbiAgICB0aGlzLnJlc3BvbnNlID0gbnVsbDsgLy8gaGFzaGVkIHJlc3BvbnNlIHRvIHNlcnZlciBjaGFsbGVuZ2VcbiAgICB0aGlzLm9wYXF1ZSA9IG51bGw7IC8vIGhhc2hlZCByZXNwb25zZSB0byBzZXJ2ZXIgY2hhbGxlbmdlXG4gICAgdGhpcy5uYyA9IDE7IC8vIG5vbmNlIGNvdW50IC0gaW5jcmVtZW50cyB3aXRoIGVhY2ggcmVxdWVzdCB1c2VkIHdpdGggdGhlIHNhbWUgbm9uY2VcbiAgICB0aGlzLmNub25jZSA9IG51bGw7IC8vIGNsaWVudCBub25jZVxuXG4gICAgLy8gc2V0dGluZ3NcbiAgICB0aGlzLnRpbWVvdXQgPSA2MDAwMDsgLy8gdGltZW91dFxuICAgIHRoaXMubG9nZ2luZ09uID0gZmFsc2U7IC8vIHRvZ2dsZSBjb25zb2xlIGxvZ2dpbmdcblxuICAgIC8vIGRldGVybWluZSBpZiBhIHBvc3QsIHNvIHRoYXQgcmVxdWVzdCB3aWxsIHNlbmQgZGF0YVxuICAgIHRoaXMucG9zdCA9IGZhbHNlO1xuICAgIGlmIChtZXRob2QudG9Mb3dlckNhc2UoKSA9PT0gJ3Bvc3QnIHx8IG1ldGhvZC50b0xvd2VyQ2FzZSgpID09PSAncHV0Jykge1xuICAgICAgdGhpcy5wb3N0ID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBzdGFydCBoZXJlXG4gICAgLy8gc3VjY2Vzc0ZuIC0gd2lsbCBiZSBwYXNzZWQgSlNPTiBkYXRhXG4gICAgLy8gZXJyb3JGbiAtIHdpbGwgYmUgcGFzc2VkIHRoZSBmYWlsZWQgYXV0aGVudGljYXRlZFJlcXVlc3RcbiAgICAvLyBkYXRhIC0gb3B0aW9uYWwsIGZvciBQT1NUU1xuICAgIHRoaXMucmVxdWVzdCA9IGZ1bmN0aW9uKHN1Y2Nlc3NGbiwgZXJyb3JGbiwgZGF0YSkge1xuICAgICAgXG4gICAgICAvLyBzdHJpbmdpZnkganNvblxuICAgICAgaWYgKGRhdGEpIHtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBzZWxmLmRhdGEgPSBkYXRhIGluc3RhbmNlb2YgVWludDhBcnJheSB8fCB0eXBlb2YgZGF0YSA9PT0gXCJzdHJpbmdcIiA/IGRhdGEgOiBKU09OLnN0cmluZ2lmeShkYXRhKTtcbiAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc2VsZi5zdWNjZXNzRm4gPSBzdWNjZXNzRm47XG4gICAgICBzZWxmLmVycm9yRm4gPSBlcnJvckZuO1xuXG4gICAgICBpZiAoIXNlbGYubm9uY2UpIHtcbiAgICAgICAgc2VsZi5tYWtlVW5hdXRoZW50aWNhdGVkUmVxdWVzdChzZWxmLmRhdGEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2VsZi5tYWtlQXV0aGVudGljYXRlZFJlcXVlc3QoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5tYWtlVW5hdXRoZW50aWNhdGVkUmVxdWVzdCA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgIHNlbGYuZmlyc3RSZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgICBzZWxmLmZpcnN0UmVxdWVzdC5vcGVuKG1ldGhvZCwgdXJsLCB0cnVlKTtcbiAgICAgIHNlbGYuZmlyc3RSZXF1ZXN0LnRpbWVvdXQgPSBzZWxmLnRpbWVvdXQ7XG4gICAgICAvLyBpZiB3ZSBhcmUgcG9zdGluZywgYWRkIGFwcHJvcHJpYXRlIGhlYWRlcnNcbiAgICAgIGlmIChzZWxmLnBvc3QgJiYgZGF0YSkge1xuICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICBzZWxmLmZpcnN0UmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LXR5cGUnLCAndGV4dC9wbGFpbicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYuZmlyc3RSZXF1ZXN0LnJlc3BvbnNlVHlwZSA9IFwiYXJyYXlidWZmZXJcIjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzZWxmLmZpcnN0UmVxdWVzdC5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcblxuICAgICAgICAvLyAyOiByZWNlaXZlZCBoZWFkZXJzLCAgMzogbG9hZGluZywgNDogZG9uZVxuICAgICAgICBpZiAoc2VsZi5maXJzdFJlcXVlc3QucmVhZHlTdGF0ZSA9PT0gMikge1xuXG4gICAgICAgICAgdmFyIHJlc3BvbnNlSGVhZGVycyA9IHNlbGYuZmlyc3RSZXF1ZXN0LmdldEFsbFJlc3BvbnNlSGVhZGVycygpO1xuICAgICAgICAgIHJlc3BvbnNlSGVhZGVycyA9IHJlc3BvbnNlSGVhZGVycy5zcGxpdCgnXFxuJyk7XG4gICAgICAgICAgLy8gZ2V0IGF1dGhlbnRpY2F0ZSBoZWFkZXJcbiAgICAgICAgICB2YXIgZGlnZXN0SGVhZGVycztcbiAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgcmVzcG9uc2VIZWFkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAocmVzcG9uc2VIZWFkZXJzW2ldLm1hdGNoKC93d3ctYXV0aGVudGljYXRlL2kpICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgZGlnZXN0SGVhZGVycyA9IHJlc3BvbnNlSGVhZGVyc1tpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoZGlnZXN0SGVhZGVycyAhPSBudWxsKSB7XG4gICAgICAgICAgICAvLyBwYXJzZSBhdXRoIGhlYWRlciBhbmQgZ2V0IGRpZ2VzdCBhdXRoIGtleXNcbiAgICAgICAgICAgIGRpZ2VzdEhlYWRlcnMgPSBkaWdlc3RIZWFkZXJzLnNsaWNlKGRpZ2VzdEhlYWRlcnMuaW5kZXhPZignOicpICsgMSwgLTEpO1xuICAgICAgICAgICAgZGlnZXN0SGVhZGVycyA9IGRpZ2VzdEhlYWRlcnMuc3BsaXQoJywnKTtcbiAgICAgICAgICAgIHNlbGYuc2NoZW1lID0gZGlnZXN0SGVhZGVyc1swXS5zcGxpdCgvXFxzLylbMV07XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRpZ2VzdEhlYWRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgdmFyIGVxdWFsSW5kZXggPSBkaWdlc3RIZWFkZXJzW2ldLmluZGV4T2YoJz0nKSxcbiAgICAgICAgICAgICAgICBrZXkgPSBkaWdlc3RIZWFkZXJzW2ldLnN1YnN0cmluZygwLCBlcXVhbEluZGV4KSxcbiAgICAgICAgICAgICAgICB2YWwgPSBkaWdlc3RIZWFkZXJzW2ldLnN1YnN0cmluZyhlcXVhbEluZGV4ICsgMSk7XG4gICAgICAgICAgICAgIHZhbCA9IHZhbC5yZXBsYWNlKC9bJ1wiXSsvZywgJycpO1xuICAgICAgICAgICAgICAvLyBmaW5kIHJlYWxtXG4gICAgICAgICAgICAgIGlmIChrZXkubWF0Y2goL3JlYWxtL2kpICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnJlYWxtID0gdmFsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vIGZpbmQgbm9uY2VcbiAgICAgICAgICAgICAgaWYgKGtleS5tYXRjaCgvbm9uY2UvaSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHNlbGYubm9uY2UgPSB2YWw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy8gZmluZCBvcGFxdWVcbiAgICAgICAgICAgICAgaWYgKGtleS5tYXRjaCgvb3BhcXVlL2kpICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzZWxmLm9wYXF1ZSA9IHZhbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyBmaW5kIFFPUFxuICAgICAgICAgICAgICBpZiAoa2V5Lm1hdGNoKC9xb3AvaSkgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIHNlbGYucW9wID0gdmFsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBjbGllbnQgZ2VuZXJhdGVkIGtleXNcbiAgICAgICAgICAgIHNlbGYuY25vbmNlID0gc2VsZi5nZW5lcmF0ZUNub25jZSgpO1xuICAgICAgICAgICAgc2VsZi5uYysrO1xuICAgICAgICAgICAgLy8gaWYgbG9nZ2luZywgc2hvdyBoZWFkZXJzIHJlY2VpdmVkOlxuICAgICAgICAgICAgc2VsZi5sb2coJ3JlY2VpdmVkIGhlYWRlcnM6Jyk7XG4gICAgICAgICAgICBzZWxmLmxvZygnICByZWFsbTogJytzZWxmLnJlYWxtKTtcbiAgICAgICAgICAgIHNlbGYubG9nKCcgIG5vbmNlOiAnK3NlbGYubm9uY2UpO1xuICAgICAgICAgICAgc2VsZi5sb2coJyAgb3BhcXVlOiAnK3NlbGYub3BhcXVlKTtcbiAgICAgICAgICAgIHNlbGYubG9nKCcgIHFvcDogJytzZWxmLnFvcCk7XG4gICAgICAgICAgICAvLyBub3cgd2UgY2FuIG1ha2UgYW4gYXV0aGVudGljYXRlZCByZXF1ZXN0XG4gICAgICAgICAgICBzZWxmLm1ha2VBdXRoZW50aWNhdGVkUmVxdWVzdCgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBpZiAoc2VsZi5maXJzdFJlcXVlc3QucmVhZHlTdGF0ZSA9PT0gNCkge1xuICAgICAgICAgIGlmIChzZWxmLmZpcnN0UmVxdWVzdC5zdGF0dXMgPT09IDIwMCkge1xuICAgICAgICAgICAgc2VsZi5sb2coJ0F1dGhlbnRpY2F0aW9uIG5vdCByZXF1aXJlZCBmb3IgJyt1cmwpO1xuICAgICAgICAgICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XG4gICAgICAgICAgICAgIHNlbGYuc3VjY2Vzc0ZuKHNlbGYuZmlyc3RSZXF1ZXN0KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIGlmIChzZWxmLmZpcnN0UmVxdWVzdC5yZXNwb25zZVRleHQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgaWYgKHNlbGYuZmlyc3RSZXF1ZXN0LnJlc3BvbnNlVGV4dC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAvLyBJZiBKU09OLCBwYXJzZSBhbmQgcmV0dXJuIG9iamVjdFxuICAgICAgICAgICAgICAgICAgaWYgKHNlbGYuaXNKc29uKHNlbGYuZmlyc3RSZXF1ZXN0LnJlc3BvbnNlVGV4dCkpIHsgIC8vIFRPRE86IHJlZHVuZGFudFxuICAgICAgICAgICAgICAgICAgICBzZWxmLnN1Y2Nlc3NGbihzZWxmLmZpcnN0UmVxdWVzdCk7XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnN1Y2Nlc3NGbihzZWxmLmZpcnN0UmVxdWVzdCk7XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuc3VjY2Vzc0ZuKCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIHNlbmRcbiAgICAgIGlmIChzZWxmLnBvc3QpIHtcbiAgICAgICAgLy8gaW4gY2FzZSBkaWdlc3QgYXV0aCBub3QgcmVxdWlyZWRcbiAgICAgICAgc2VsZi5maXJzdFJlcXVlc3Quc2VuZChzZWxmLmRhdGEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2VsZi5maXJzdFJlcXVlc3Quc2VuZCgpO1xuICAgICAgfVxuICAgICAgc2VsZi5sb2coJ1VuYXV0aGVudGljYXRlZCByZXF1ZXN0IHRvICcrdXJsKTtcblxuICAgICAgLy8gaGFuZGxlIGVycm9yXG4gICAgICBzZWxmLmZpcnN0UmVxdWVzdC5vbmVycm9yID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChzZWxmLmZpcnN0UmVxdWVzdC5zdGF0dXMgIT09IDQwMSkge1xuICAgICAgICAgIHNlbGYubG9nKCdFcnJvciAoJytzZWxmLmZpcnN0UmVxdWVzdC5zdGF0dXMrJykgb24gdW5hdXRoZW50aWNhdGVkIHJlcXVlc3QgdG8gJyt1cmwpO1xuICAgICAgICAgIHNlbGYuZXJyb3JGbihzZWxmLmZpcnN0UmVxdWVzdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5tYWtlQXV0aGVudGljYXRlZFJlcXVlc3Q9IGZ1bmN0aW9uKCkge1xuXG4gICAgICBzZWxmLnJlc3BvbnNlID0gc2VsZi5mb3JtdWxhdGVSZXNwb25zZSgpO1xuICAgICAgc2VsZi5hdXRoZW50aWNhdGVkUmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgc2VsZi5hdXRoZW50aWNhdGVkUmVxdWVzdC5vcGVuKG1ldGhvZCwgdXJsLCB0cnVlKTtcbiAgICAgIHNlbGYuYXV0aGVudGljYXRlZFJlcXVlc3QudGltZW91dCA9IHNlbGYudGltZW91dDtcbiAgICAgIHZhciBkaWdlc3RBdXRoSGVhZGVyID0gc2VsZi5zY2hlbWUrJyAnK1xuICAgICAgICAndXNlcm5hbWU9XCInK3VzZXJuYW1lKydcIiwgJytcbiAgICAgICAgJ3JlYWxtPVwiJytzZWxmLnJlYWxtKydcIiwgJytcbiAgICAgICAgJ25vbmNlPVwiJytzZWxmLm5vbmNlKydcIiwgJytcbiAgICAgICAgJ3VyaT1cIicrdXJsKydcIiwgJytcbiAgICAgICAgJ3Jlc3BvbnNlPVwiJytzZWxmLnJlc3BvbnNlKydcIiwgJytcbiAgICAgICAgJ29wYXF1ZT1cIicrc2VsZi5vcGFxdWUrJ1wiLCAnK1xuICAgICAgICAncW9wPScrc2VsZi5xb3ArJywgJytcbiAgICAgICAgJ25jPScrKCcwMDAwMDAwMCcgKyBzZWxmLm5jKS5zbGljZSgtOCkrJywgJytcbiAgICAgICAgJ2Nub25jZT1cIicrc2VsZi5jbm9uY2UrJ1wiJztcbiAgICAgIHNlbGYuYXV0aGVudGljYXRlZFJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlcignQXV0aG9yaXphdGlvbicsIGRpZ2VzdEF1dGhIZWFkZXIpO1xuICAgICAgc2VsZi5sb2coJ2RpZ2VzdCBhdXRoIGhlYWRlciByZXNwb25zZSB0byBiZSBzZW50OicpO1xuICAgICAgc2VsZi5sb2coZGlnZXN0QXV0aEhlYWRlcik7XG4gICAgICAvLyBpZiB3ZSBhcmUgcG9zdGluZywgYWRkIGFwcHJvcHJpYXRlIGhlYWRlcnNcbiAgICAgIGlmIChzZWxmLnBvc3QgJiYgc2VsZi5kYXRhKSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2VsZi5kYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgc2VsZi5hdXRoZW50aWNhdGVkUmVxdWVzdC5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LXR5cGUnLCAndGV4dC9wbGFpbicpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYuYXV0aGVudGljYXRlZFJlcXVlc3QucmVzcG9uc2VUeXBlID0gXCJhcnJheWJ1ZmZlclwiOyAgICAgICAgXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNlbGYuYXV0aGVudGljYXRlZFJlcXVlc3Qub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIHN1Y2Nlc3NcbiAgICAgICAgaWYgKHNlbGYuYXV0aGVudGljYXRlZFJlcXVlc3Quc3RhdHVzID49IDIwMCAmJiBzZWxmLmF1dGhlbnRpY2F0ZWRSZXF1ZXN0LnN0YXR1cyA8IDQwMCkge1xuICAgICAgICAgIC8vIGluY3JlbWVudCBub25jZSBjb3VudFxuICAgICAgICAgIHNlbGYubmMrKztcbiAgICAgICAgICAvLyByZXR1cm4gZGF0YVxuICAgICAgICAgIGlmIChzZWxmLmRhdGEgaW5zdGFuY2VvZiBVaW50OEFycmF5KSB7XG4gICAgICAgICAgICBzZWxmLnN1Y2Nlc3NGbihzZWxmLmF1dGhlbnRpY2F0ZWRSZXF1ZXN0KTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKHNlbGYuYXV0aGVudGljYXRlZFJlcXVlc3QucmVzcG9uc2VUZXh0ICE9PSAndW5kZWZpbmVkJyAmJiBzZWxmLmF1dGhlbnRpY2F0ZWRSZXF1ZXN0LnJlc3BvbnNlVGV4dC5sZW5ndGggPiAwICkge1xuICAgICAgICAgICAgICAvLyBJZiBKU09OLCBwYXJzZSBhbmQgcmV0dXJuIG9iamVjdFxuICAgICAgICAgICAgICBpZiAoc2VsZi5pc0pzb24oc2VsZi5hdXRoZW50aWNhdGVkUmVxdWVzdC5yZXNwb25zZVRleHQpKSB7ICAvLyBUT0RPOiByZWR1bmRhbnQgZnJvbSBub3QgcGFyc2luZ1xuICAgICAgICAgICAgICAgIHNlbGYuc3VjY2Vzc0ZuKHNlbGYuYXV0aGVudGljYXRlZFJlcXVlc3QpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuc3VjY2Vzc0ZuKHNlbGYuYXV0aGVudGljYXRlZFJlcXVlc3QpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5zdWNjZXNzRm4oKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gZmFpbHVyZVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICBzZWxmLm5vbmNlID0gbnVsbDtcbiAgICAgICAgICBzZWxmLmVycm9yRm4oc2VsZi5hdXRoZW50aWNhdGVkUmVxdWVzdCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vIGhhbmRsZSBlcnJvcnNcbiAgICAgIHNlbGYuYXV0aGVudGljYXRlZFJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzZWxmLmxvZygnRXJyb3IgKCcrc2VsZi5hdXRoZW50aWNhdGVkUmVxdWVzdC5zdGF0dXMrJykgb24gYXV0aGVudGljYXRlZCByZXF1ZXN0IHRvICcrdXJsKTtcbiAgICAgICAgc2VsZi5ub25jZSA9IG51bGw7XG4gICAgICAgIHNlbGYuZXJyb3JGbihzZWxmLmF1dGhlbnRpY2F0ZWRSZXF1ZXN0KTtcbiAgICAgIH07XG4gICAgICAvLyBzZW5kXG4gICAgICBpZiAoc2VsZi5wb3N0KSB7XG4gICAgICAgIHNlbGYuYXV0aGVudGljYXRlZFJlcXVlc3Quc2VuZChzZWxmLmRhdGEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc2VsZi5hdXRoZW50aWNhdGVkUmVxdWVzdC5zZW5kKCk7XG4gICAgICB9XG4gICAgICBzZWxmLmxvZygnQXV0aGVudGljYXRlZCByZXF1ZXN0IHRvICcrdXJsKTtcbiAgICB9XG4gICAgLy8gaGFzaCByZXNwb25zZSBiYXNlZCBvbiBzZXJ2ZXIgY2hhbGxlbmdlXG4gICAgdGhpcy5mb3JtdWxhdGVSZXNwb25zZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIEhBMSA9IENyeXB0b0pTLk1ENSh1c2VybmFtZSsnOicrc2VsZi5yZWFsbSsnOicrcGFzc3dvcmQpLnRvU3RyaW5nKCk7XG4gICAgICB2YXIgSEEyID0gQ3J5cHRvSlMuTUQ1KG1ldGhvZCsnOicrdXJsKS50b1N0cmluZygpO1xuICAgICAgdmFyIHJlc3BvbnNlID0gQ3J5cHRvSlMuTUQ1KEhBMSsnOicrXG4gICAgICAgIHNlbGYubm9uY2UrJzonK1xuICAgICAgICAoJzAwMDAwMDAwJyArIHNlbGYubmMpLnNsaWNlKC04KSsnOicrXG4gICAgICAgIHNlbGYuY25vbmNlKyc6JytcbiAgICAgICAgc2VsZi5xb3ArJzonK1xuICAgICAgICBIQTIpLnRvU3RyaW5nKCk7XG4gICAgICByZXR1cm4gcmVzcG9uc2U7XG4gICAgfVxuICAgIC8vIGdlbmVyYXRlIDE2IGNoYXIgY2xpZW50IG5vbmNlXG4gICAgdGhpcy5nZW5lcmF0ZUNub25jZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIGNoYXJhY3RlcnMgPSAnYWJjZGVmMDEyMzQ1Njc4OSc7XG4gICAgICB2YXIgdG9rZW4gPSAnJztcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgICAgICB2YXIgcmFuZE51bSA9IE1hdGgucm91bmQoTWF0aC5yYW5kb20oKSAqIGNoYXJhY3RlcnMubGVuZ3RoKTtcbiAgICAgICAgdG9rZW4gKz0gY2hhcmFjdGVycy5zdWJzdHIocmFuZE51bSwgMSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdG9rZW47XG4gICAgfVxuICAgIHRoaXMuYWJvcnQgPSBmdW5jdGlvbigpIHtcbiAgICAgIHNlbGYubG9nKCdbZGlnZXN0QXV0aFJlcXVlc3RdIEFib3J0ZWQgcmVxdWVzdCB0byAnK3VybCk7XG4gICAgICBpZiAoc2VsZi5maXJzdFJlcXVlc3QgIT0gbnVsbCkge1xuICAgICAgICBpZiAoc2VsZi5maXJzdFJlcXVlc3QucmVhZHlTdGF0ZSAhPSA0KSBzZWxmLmZpcnN0UmVxdWVzdC5hYm9ydCgpO1xuICAgICAgfVxuICAgICAgaWYgKHNlbGYuYXV0aGVudGljYXRlZFJlcXVlc3QgIT0gbnVsbCkge1xuICAgICAgICBpZiAoc2VsZi5hdXRoZW50aWNhdGVkUmVxdWVzdC5yZWFkeVN0YXRlICE9IDQpIHNlbGYuYXV0aGVudGljYXRlZFJlcXVlc3QuYWJvcnQoKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5pc0pzb24gPSBmdW5jdGlvbihzdHIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIEpTT04ucGFyc2Uoc3RyKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgdGhpcy5sb2cgPSBmdW5jdGlvbihzdHIpIHtcbiAgICAgIGlmIChzZWxmLmxvZ2dpbmdPbikge1xuICAgICAgICBjb25zb2xlLmxvZygnW2RpZ2VzdEF1dGhSZXF1ZXN0XSAnK3N0cik7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMudmVyc2lvbiA9IGZ1bmN0aW9uKCkgeyByZXR1cm4gJzAuOC4wJyB9XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6IjtBQUNBLElBQUFBLGFBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQSxJQUFBQyxXQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRSxnQkFBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsZUFBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksS0FBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUssTUFBQSxHQUFBTixzQkFBQSxDQUFBQyxPQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNlLE1BQU1NLFVBQVUsQ0FBQzs7RUFFOUIsT0FBT0MsdUJBQXVCLEdBQUcsRUFBRTs7RUFFbkM7RUFDQSxPQUFpQkMsZUFBZSxH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