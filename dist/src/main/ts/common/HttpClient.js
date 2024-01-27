"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _GenUtils = _interopRequireDefault(require("./GenUtils"));
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
    return _GenUtils.default.executeWithTimeout(requestPromise, timeout);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9MaWJyYXJ5VXRpbHMiLCJfVGhyZWFkUG9vbCIsIl9wcm9taXNlVGhyb3R0bGUiLCJfcmVxdWVzdFByb21pc2UiLCJfaHR0cCIsIl9odHRwcyIsIkh0dHBDbGllbnQiLCJNQVhfUkVRVUVTVFNfUEVSX1NFQ09ORCIsIkRFRkFVTFRfUkVRVUVTVCIsIm1ldGhvZCIsInJlcXVlc3RBcGkiLCJyZXNvbHZlV2l0aEZ1bGxSZXNwb25zZSIsInJlamVjdFVuYXV0aG9yaXplZCIsIlBST01JU0VfVEhST1RUTEVTIiwiVEFTS19RVUVVRVMiLCJERUZBVUxUX1RJTUVPVVQiLCJNQVhfVElNRU9VVCIsInJlcXVlc3QiLCJwcm94eVRvV29ya2VyIiwiTGlicmFyeVV0aWxzIiwiaW52b2tlV29ya2VyIiwidW5kZWZpbmVkIiwiZXJyIiwibWVzc2FnZSIsImxlbmd0aCIsImNoYXJBdCIsInBhcnNlZCIsIkpTT04iLCJwYXJzZSIsInN0YXR1c01lc3NhZ2UiLCJzdGF0dXNDb2RlIiwiT2JqZWN0IiwiYXNzaWduIiwiaG9zdCIsIlVSTCIsInVyaSIsIkVycm9yIiwiYm9keSIsIlRocmVhZFBvb2wiLCJQcm9taXNlVGhyb3R0bGUiLCJyZXF1ZXN0c1BlclNlY29uZCIsInByb21pc2VJbXBsZW1lbnRhdGlvbiIsIlByb21pc2UiLCJ0aW1lb3V0IiwicmVxdWVzdFByb21pc2UiLCJyZXF1ZXN0RmV0Y2giLCJyZXF1ZXN0WGhyIiwiR2VuVXRpbHMiLCJleGVjdXRlV2l0aFRpbWVvdXQiLCJyZXEiLCJvcHRzIiwiYWdlbnQiLCJzdGFydHNXaXRoIiwiZ2V0SHR0cHNBZ2VudCIsImdldEh0dHBBZ2VudCIsInJlcXVlc3RDZXJ0IiwidXNlcm5hbWUiLCJmb3JldmVyIiwiYXV0aCIsInVzZXIiLCJwYXNzIiwicGFzc3dvcmQiLCJzZW5kSW1tZWRpYXRlbHkiLCJVaW50OEFycmF5IiwiZW5jb2RpbmciLCJyZXNwIiwic3VibWl0IiwiYWRkIiwiUmVxdWVzdCIsImJpbmQiLCJub3JtYWxpemVkUmVzcG9uc2UiLCJzdGF0dXNUZXh0IiwiaGVhZGVycyIsImlzQmluYXJ5IiwicmVzb2x2ZSIsInJlamVjdCIsImRpZ2VzdEF1dGhSZXF1ZXN0Iiwic3RhdHVzIiwicGFyc2VYaHJSZXNwb25zZUhlYWRlcnMiLCJnZXRBbGxSZXNwb25zZUhlYWRlcnMiLCJyZXNwb25zZSIsIkFycmF5QnVmZmVyIiwiSFRUUF9BR0VOVCIsImh0dHAiLCJBZ2VudCIsImtlZXBBbGl2ZSIsImZhbWlseSIsIkhUVFBTX0FHRU5UIiwiaHR0cHMiLCJoZWFkZXJzU3RyIiwiaGVhZGVyTWFwIiwidHJpbSIsInNwbGl0IiwiaGVhZGVyIiwiaGVhZGVyVmFscyIsInVybCIsInNlbGYiLCJDcnlwdG9KUyIsInNjaGVtZSIsIm5vbmNlIiwicmVhbG0iLCJxb3AiLCJvcGFxdWUiLCJuYyIsImNub25jZSIsImxvZ2dpbmdPbiIsInBvc3QiLCJ0b0xvd2VyQ2FzZSIsInN1Y2Nlc3NGbiIsImVycm9yRm4iLCJkYXRhIiwic3RyaW5naWZ5IiwiY29uc29sZSIsImVycm9yIiwibWFrZVVuYXV0aGVudGljYXRlZFJlcXVlc3QiLCJtYWtlQXV0aGVudGljYXRlZFJlcXVlc3QiLCJmaXJzdFJlcXVlc3QiLCJYTUxIdHRwUmVxdWVzdCIsIm9wZW4iLCJzZXRSZXF1ZXN0SGVhZGVyIiwicmVzcG9uc2VUeXBlIiwib25yZWFkeXN0YXRlY2hhbmdlIiwicmVhZHlTdGF0ZSIsInJlc3BvbnNlSGVhZGVycyIsImRpZ2VzdEhlYWRlcnMiLCJpIiwibWF0Y2giLCJzbGljZSIsImluZGV4T2YiLCJlcXVhbEluZGV4Iiwia2V5Iiwic3Vic3RyaW5nIiwidmFsIiwicmVwbGFjZSIsImdlbmVyYXRlQ25vbmNlIiwibG9nIiwicmVzcG9uc2VUZXh0IiwiaXNKc29uIiwic2VuZCIsIm9uZXJyb3IiLCJmb3JtdWxhdGVSZXNwb25zZSIsImF1dGhlbnRpY2F0ZWRSZXF1ZXN0IiwiZGlnZXN0QXV0aEhlYWRlciIsIm9ubG9hZCIsIkhBMSIsIk1ENSIsInRvU3RyaW5nIiwiSEEyIiwiY2hhcmFjdGVycyIsInRva2VuIiwicmFuZE51bSIsIk1hdGgiLCJyb3VuZCIsInJhbmRvbSIsInN1YnN0ciIsImFib3J0Iiwic3RyIiwidmVyc2lvbiIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvY29tbW9uL0h0dHBDbGllbnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuL0dlblV0aWxzXCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IE1vbmVyb1V0aWxzIGZyb20gXCIuL01vbmVyb1V0aWxzXCI7XG5pbXBvcnQgVGhyZWFkUG9vbCBmcm9tIFwiLi9UaHJlYWRQb29sXCI7XG5pbXBvcnQgUHJvbWlzZVRocm90dGxlIGZyb20gXCJwcm9taXNlLXRocm90dGxlXCI7XG5pbXBvcnQgUmVxdWVzdCBmcm9tIFwicmVxdWVzdC1wcm9taXNlXCI7XG5pbXBvcnQgaHR0cCBmcm9tIFwiaHR0cFwiO1xuaW1wb3J0IGh0dHBzIGZyb20gXCJodHRwc1wiO1xuXG4vKipcbiAqIEhhbmRsZSBIVFRQIHJlcXVlc3RzIHdpdGggYSB1bmlmb3JtIGludGVyZmFjZS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSHR0cENsaWVudCB7XG5cbiAgc3RhdGljIE1BWF9SRVFVRVNUU19QRVJfU0VDT05EID0gNTBcblxuICAvLyBkZWZhdWx0IHJlcXVlc3QgY29uZmlnXG4gIHByb3RlY3RlZCBzdGF0aWMgREVGQVVMVF9SRVFVRVNUID0ge1xuICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICByZXF1ZXN0QXBpOiBcImZldGNoXCIsXG4gICAgcmVzb2x2ZVdpdGhGdWxsUmVzcG9uc2U6IGZhbHNlLFxuICAgIHJlamVjdFVuYXV0aG9yaXplZDogdHJ1ZVxuICB9XG5cbiAgLy8gcmF0ZSBsaW1pdCByZXF1ZXN0cyBwZXIgaG9zdFxuICBwcm90ZWN0ZWQgc3RhdGljIFBST01JU0VfVEhST1RUTEVTID0gW107XG4gIHByb3RlY3RlZCBzdGF0aWMgVEFTS19RVUVVRVMgPSBbXTtcbiAgcHJvdGVjdGVkIHN0YXRpYyBERUZBVUxUX1RJTUVPVVQgPSA2MDAwMDtcbiAgc3RhdGljIE1BWF9USU1FT1VUID0gMjE0NzQ4MzY0NzsgLy8gbWF4IDMyLWJpdCBzaWduZWQgbnVtYmVyXG5cbiAgcHJvdGVjdGVkIHN0YXRpYyBIVFRQX0FHRU5UOiBhbnk7XG4gIHByb3RlY3RlZCBzdGF0aWMgSFRUUFNfQUdFTlQ6IGFueTtcbiAgXG4gIC8qKlxuICAgKiA8cD5NYWtlIGEgSFRUUCByZXF1ZXN0LjxwPlxuICAgKiBcbiAgICogQHBhcmFtIHtvYmplY3R9IHJlcXVlc3QgLSBjb25maWd1cmVzIHRoZSByZXF1ZXN0IHRvIG1ha2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlcXVlc3QubWV0aG9kIC0gSFRUUCBtZXRob2QgKFwiR0VUXCIsIFwiUFVUXCIsIFwiUE9TVFwiLCBcIkRFTEVURVwiLCBldGMpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZXF1ZXN0LnVyaSAtIHVyaSB0byByZXF1ZXN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfFVpbnQ4QXJyYXl8b2JqZWN0fSByZXF1ZXN0LmJvZHkgLSByZXF1ZXN0IGJvZHlcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtyZXF1ZXN0LnVzZXJuYW1lXSAtIHVzZXJuYW1lIHRvIGF1dGhlbnRpY2F0ZSB0aGUgcmVxdWVzdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcmVxdWVzdC5wYXNzd29yZF0gLSBwYXNzd29yZCB0byBhdXRoZW50aWNhdGUgdGhlIHJlcXVlc3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge29iamVjdH0gW3JlcXVlc3QuaGVhZGVyc10gLSBoZWFkZXJzIHRvIGFkZCB0byB0aGUgcmVxdWVzdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcmVxdWVzdC5yZXF1ZXN0QXBpXSAtIG9uZSBvZiBcImZldGNoXCIgb3IgXCJ4aHJcIiAoZGVmYXVsdCBcImZldGNoXCIpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3JlcXVlc3QucmVzb2x2ZVdpdGhGdWxsUmVzcG9uc2VdIC0gcmV0dXJuIGZ1bGwgcmVzcG9uc2UgaWYgdHJ1ZSwgZWxzZSBib2R5IG9ubHkgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3JlcXVlc3QucmVqZWN0VW5hdXRob3JpemVkXSAtIHdoZXRoZXIgb3Igbm90IHRvIHJlamVjdCBzZWxmLXNpZ25lZCBjZXJ0aWZpY2F0ZXMgKGRlZmF1bHQgdHJ1ZSlcbiAgICogQHBhcmFtIHtudW1iZXJ9IHJlcXVlc3QudGltZW91dCAtIG1heGltdW0gdGltZSBhbGxvd2VkIGluIG1pbGxpc2Vjb25kc1xuICAgKiBAcGFyYW0ge251bWJlcn0gcmVxdWVzdC5wcm94eVRvV29ya2VyIC0gcHJveHkgcmVxdWVzdCB0byB3b3JrZXIgdGhyZWFkXG4gICAqIEByZXR1cm4ge29iamVjdH0gcmVzcG9uc2UgLSB0aGUgcmVzcG9uc2Ugb2JqZWN0XG4gICAqIEByZXR1cm4ge3N0cmluZ3xVaW50OEFycmF5fG9iamVjdH0gcmVzcG9uc2UuYm9keSAtIHRoZSByZXNwb25zZSBib2R5XG4gICAqIEByZXR1cm4ge251bWJlcn0gcmVzcG9uc2Uuc3RhdHVzQ29kZSAtIHRoZSByZXNwb25zZSBjb2RlXG4gICAqIEByZXR1cm4ge1N0cmluZ30gcmVzcG9uc2Uuc3RhdHVzVGV4dCAtIHRoZSByZXNwb25zZSBtZXNzYWdlXG4gICAqIEByZXR1cm4ge29iamVjdH0gcmVzcG9uc2UuaGVhZGVycyAtIHRoZSByZXNwb25zZSBoZWFkZXJzXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgcmVxdWVzdChyZXF1ZXN0KSB7XG4gICAgXG4gICAgLy8gcHJveHkgdG8gd29ya2VyIGlmIGNvbmZpZ3VyZWRcbiAgICBpZiAocmVxdWVzdC5wcm94eVRvV29ya2VyKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gYXdhaXQgTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih1bmRlZmluZWQsIFwiaHR0cFJlcXVlc3RcIiwgcmVxdWVzdCk7XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICBpZiAoZXJyLm1lc3NhZ2UubGVuZ3RoID4gMCAmJiBlcnIubWVzc2FnZS5jaGFyQXQoMCkgPT09IFwie1wiKSB7XG4gICAgICAgICAgbGV0IHBhcnNlZCA9IEpTT04ucGFyc2UoZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgIGVyci5tZXNzYWdlID0gcGFyc2VkLnN0YXR1c01lc3NhZ2U7XG4gICAgICAgICAgZXJyLnN0YXR1c0NvZGUgPSBwYXJzZWQuc3RhdHVzQ29kZTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGFzc2lnbiBkZWZhdWx0c1xuICAgIHJlcXVlc3QgPSBPYmplY3QuYXNzaWduKHt9LCBIdHRwQ2xpZW50LkRFRkFVTFRfUkVRVUVTVCwgcmVxdWVzdCk7XG4gICAgXG4gICAgLy8gdmFsaWRhdGUgcmVxdWVzdFxuICAgIHRyeSB7IHJlcXVlc3QuaG9zdCA9IG5ldyBVUkwocmVxdWVzdC51cmkpLmhvc3Q7IH0gLy8gaG9zdG5hbWU6cG9ydFxuICAgIGNhdGNoIChlcnIpIHsgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCByZXF1ZXN0IFVSTDogXCIgKyByZXF1ZXN0LnVyaSk7IH1cbiAgICBpZiAocmVxdWVzdC5ib2R5ICYmICEodHlwZW9mIHJlcXVlc3QuYm9keSA9PT0gXCJzdHJpbmdcIiB8fCB0eXBlb2YgcmVxdWVzdC5ib2R5ID09PSBcIm9iamVjdFwiKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmVxdWVzdCBib2R5IHR5cGUgaXMgbm90IHN0cmluZyBvciBvYmplY3RcIik7XG4gICAgfVxuICAgIFxuICAgIC8vIGluaXRpYWxpemUgb25lIHRhc2sgcXVldWUgcGVyIGhvc3RcbiAgICBpZiAoIUh0dHBDbGllbnQuVEFTS19RVUVVRVNbcmVxdWVzdC5ob3N0XSkgSHR0cENsaWVudC5UQVNLX1FVRVVFU1tyZXF1ZXN0Lmhvc3RdID0gbmV3IFRocmVhZFBvb2woMSk7XG4gICAgXG4gICAgLy8gaW5pdGlhbGl6ZSBvbmUgcHJvbWlzZSB0aHJvdHRsZSBwZXIgaG9zdFxuICAgIGlmICghSHR0cENsaWVudC5QUk9NSVNFX1RIUk9UVExFU1tyZXF1ZXN0Lmhvc3RdKSB7XG4gICAgICBIdHRwQ2xpZW50LlBST01JU0VfVEhST1RUTEVTW3JlcXVlc3QuaG9zdF0gPSBuZXcgUHJvbWlzZVRocm90dGxlKHtcbiAgICAgICAgcmVxdWVzdHNQZXJTZWNvbmQ6IEh0dHBDbGllbnQuTUFYX1JFUVVFU1RTX1BFUl9TRUNPTkQsIC8vIFRPRE86IEh0dHBDbGllbnQgc2hvdWxkIG5vdCBkZXBlbmQgb24gTW9uZXJvVXRpbHMgZm9yIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgcHJvbWlzZUltcGxlbWVudGF0aW9uOiBQcm9taXNlXG4gICAgICB9KTtcbiAgICB9XG4gICAgXG4gICAgLy8gcmVxdWVzdCB1c2luZyBmZXRjaCBvciB4aHIgd2l0aCB0aW1lb3V0XG4gICAgbGV0IHRpbWVvdXQgPSByZXF1ZXN0LnRpbWVvdXQgPT09IHVuZGVmaW5lZCA/IEh0dHBDbGllbnQuREVGQVVMVF9USU1FT1VUIDogcmVxdWVzdC50aW1lb3V0ID09PSAwID8gSHR0cENsaWVudC5NQVhfVElNRU9VVCA6IHJlcXVlc3QudGltZW91dDtcbiAgICBsZXQgcmVxdWVzdFByb21pc2UgPSByZXF1ZXN0LnJlcXVlc3RBcGkgPT09IFwiZmV0Y2hcIiA/IEh0dHBDbGllbnQucmVxdWVzdEZldGNoKHJlcXVlc3QpIDogSHR0cENsaWVudC5yZXF1ZXN0WGhyKHJlcXVlc3QpO1xuICAgIHJldHVybiBHZW5VdGlscy5leGVjdXRlV2l0aFRpbWVvdXQocmVxdWVzdFByb21pc2UsIHRpbWVvdXQpO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBhc3luYyByZXF1ZXN0RmV0Y2gocmVxKSB7XG4gICAgXG4gICAgLy8gYnVpbGQgcmVxdWVzdCBvcHRpb25zXG4gICAgbGV0IG9wdHM6IGFueSA9IHtcbiAgICAgIG1ldGhvZDogcmVxLm1ldGhvZCxcbiAgICAgIHVyaTogcmVxLnVyaSxcbiAgICAgIGJvZHk6IHJlcS5ib2R5LFxuICAgICAgYWdlbnQ6IHJlcS51cmkuc3RhcnRzV2l0aChcImh0dHBzXCIpID8gSHR0cENsaWVudC5nZXRIdHRwc0FnZW50KCkgOiBIdHRwQ2xpZW50LmdldEh0dHBBZ2VudCgpLFxuICAgICAgcmVqZWN0VW5hdXRob3JpemVkOiByZXEucmVqZWN0VW5hdXRob3JpemVkLFxuICAgICAgcmVzb2x2ZVdpdGhGdWxsUmVzcG9uc2U6IHJlcS5yZXNvbHZlV2l0aEZ1bGxSZXNwb25zZSxcbiAgICAgIHJlcXVlc3RDZXJ0OiB0cnVlIC8vIFRPRE86IHBhcnQgb2YgY29uZmlnP1xuICAgIH07XG4gICAgaWYgKHJlcS51c2VybmFtZSkge1xuICAgICAgb3B0cy5mb3JldmVyID0gdHJ1ZTtcbiAgICAgIG9wdHMuYXV0aCA9IHtcbiAgICAgICAgdXNlcjogcmVxLnVzZXJuYW1lLFxuICAgICAgICBwYXNzOiByZXEucGFzc3dvcmQsXG4gICAgICAgIHNlbmRJbW1lZGlhdGVseTogZmFsc2VcbiAgICAgIH1cbiAgICB9XG4gICAgaWYgKHJlcS5ib2R5IGluc3RhbmNlb2YgVWludDhBcnJheSkgb3B0cy5lbmNvZGluZyA9IG51bGw7XG4gICAgXG4gICAgLy8gcXVldWUgYW5kIHRocm90dGxlIHJlcXVlc3QgdG8gZXhlY3V0ZSBpbiBzZXJpYWwgYW5kIHJhdGUgbGltaXRlZFxuICAgIGxldCBob3N0ID0gcmVxLmhvc3Q7XG4gICAgbGV0IHJlc3AgPSBhd2FpdCBIdHRwQ2xpZW50LlRBU0tfUVVFVUVTW2hvc3RdLnN1Ym1pdChhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBIdHRwQ2xpZW50LlBST01JU0VfVEhST1RUTEVTW2hvc3RdLmFkZChmdW5jdGlvbihvcHRzKSB7IHJldHVybiBSZXF1ZXN0KG9wdHMpOyB9LmJpbmQodGhpcywgb3B0cykpO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSByZXNwb25zZVxuICAgIGxldCBub3JtYWxpemVkUmVzcG9uc2U6IGFueSA9IHt9O1xuICAgIGlmIChyZXEucmVzb2x2ZVdpdGhGdWxsUmVzcG9uc2UpIHtcbiAgICAgIG5vcm1hbGl6ZWRSZXNwb25zZS5zdGF0dXNDb2RlID0gcmVzcC5zdGF0dXNDb2RlO1xuICAgICAgbm9ybWFsaXplZFJlc3BvbnNlLnN0YXR1c1RleHQgPSByZXNwLnN0YXR1c01lc3NhZ2U7XG4gICAgICBub3JtYWxpemVkUmVzcG9uc2UuaGVhZGVycyA9IHJlc3AuaGVhZGVycztcbiAgICAgIG5vcm1hbGl6ZWRSZXNwb25zZS5ib2R5ID0gcmVzcC5ib2R5O1xuICAgIH0gZWxzZSB7XG4gICAgICBub3JtYWxpemVkUmVzcG9uc2UuYm9keSA9IHJlc3A7XG4gICAgfVxuICAgIHJldHVybiBub3JtYWxpemVkUmVzcG9uc2U7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgcmVxdWVzdFhocihyZXEpIHtcbiAgICBpZiAocmVxLmhlYWRlcnMpIHRocm93IG5ldyBFcnJvcihcIkN1c3RvbSBoZWFkZXJzIG5vdCBpbXBsZW1lbnRlZCBpbiBYSFIgcmVxdWVzdFwiKTsgIC8vIFRPRE9cbiAgICBcbiAgICAvLyBjb2xsZWN0IHBhcmFtcyBmcm9tIHJlcXVlc3Qgd2hpY2ggY2hhbmdlIG9uIGF3YWl0XG4gICAgbGV0IG1ldGhvZCA9IHJlcS5tZXRob2Q7XG4gICAgbGV0IHVyaSA9IHJlcS51cmk7XG4gICAgbGV0IGhvc3QgPSByZXEuaG9zdDtcbiAgICBsZXQgdXNlcm5hbWUgPSByZXEudXNlcm5hbWU7XG4gICAgbGV0IHBhc3N3b3JkID0gcmVxLnBhc3N3b3JkO1xuICAgIGxldCBib2R5ID0gcmVxLmJvZHk7XG4gICAgbGV0IGlzQmluYXJ5ID0gYm9keSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXk7XG4gICAgXG4gICAgLy8gcXVldWUgYW5kIHRocm90dGxlIHJlcXVlc3RzIHRvIGV4ZWN1dGUgaW4gc2VyaWFsIGFuZCByYXRlIGxpbWl0ZWQgcGVyIGhvc3RcbiAgICBsZXQgcmVzcCA9IGF3YWl0IEh0dHBDbGllbnQuVEFTS19RVUVVRVNbaG9zdF0uc3VibWl0KGFzeW5jIGZ1bmN0aW9uKCkge1xuICAgICAgcmV0dXJuIEh0dHBDbGllbnQuUFJPTUlTRV9USFJPVFRMRVNbaG9zdF0uYWRkKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgbGV0IGRpZ2VzdEF1dGhSZXF1ZXN0ID0gbmV3IEh0dHBDbGllbnQuZGlnZXN0QXV0aFJlcXVlc3QobWV0aG9kLCB1cmksIHVzZXJuYW1lLCBwYXNzd29yZCk7XG4gICAgICAgICAgZGlnZXN0QXV0aFJlcXVlc3QucmVxdWVzdChmdW5jdGlvbihyZXNwKSB7XG4gICAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICAgIH0sIGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgIGlmIChyZXNwLnN0YXR1cykgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgICAgIGVsc2UgcmVqZWN0KG5ldyBFcnJvcihcIlJlcXVlc3QgZmFpbGVkIHdpdGhvdXQgcmVzcG9uc2U6IFwiICsgbWV0aG9kICsgXCIgXCIgKyB1cmkpKTtcbiAgICAgICAgICB9LCBib2R5KTtcbiAgICAgICAgfSk7XG4gICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0pO1xuICAgIFxuICAgIC8vIG5vcm1hbGl6ZSByZXNwb25zZVxuICAgIGxldCBub3JtYWxpemVkUmVzcG9uc2U6IGFueSA9IHt9O1xuICAgIG5vcm1hbGl6ZWRSZXNwb25zZS5zdGF0dXNDb2RlID0gcmVzcC5zdGF0dXM7XG4gICAgbm9ybWFsaXplZFJlc3BvbnNlLnN0YXR1c1RleHQgPSByZXNwLnN0YXR1c1RleHQ7XG4gICAgbm9ybWFsaXplZFJlc3BvbnNlLmhlYWRlcnMgPSBIdHRwQ2xpZW50LnBhcnNlWGhyUmVzcG9uc2VIZWFkZXJzKHJlc3AuZ2V0QWxsUmVzcG9uc2VIZWFkZXJzKCkpO1xuICAgIG5vcm1hbGl6ZWRSZXNwb25zZS5ib2R5ID0gaXNCaW5hcnkgPyBuZXcgVWludDhBcnJheShyZXNwLnJlc3BvbnNlKSA6IHJlc3AucmVzcG9uc2U7XG4gICAgaWYgKG5vcm1hbGl6ZWRSZXNwb25zZS5ib2R5IGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIG5vcm1hbGl6ZWRSZXNwb25zZS5ib2R5ID0gbmV3IFVpbnQ4QXJyYXkobm9ybWFsaXplZFJlc3BvbnNlLmJvZHkpOyAgLy8gaGFuZGxlIGVtcHR5IGJpbmFyeSByZXF1ZXN0XG4gICAgcmV0dXJuIG5vcm1hbGl6ZWRSZXNwb25zZTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiBhbiBIVFRQIGNsaWVudCB0byBzaGFyZS5cbiAgICogXG4gICAqIEByZXR1cm4ge2h0dHAuQWdlbnR9IGEgc2hhcmVkIGFnZW50IGZvciBuZXR3b3JrIHJlcXVlc3RzIGFtb25nIGxpYnJhcnkgaW5zdGFuY2VzXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGdldEh0dHBBZ2VudCgpIHtcbiAgICBpZiAoIUh0dHBDbGllbnQuSFRUUF9BR0VOVCkgSHR0cENsaWVudC5IVFRQX0FHRU5UID0gbmV3IGh0dHAuQWdlbnQoe1xuICAgICAga2VlcEFsaXZlOiB0cnVlLFxuICAgICAgZmFtaWx5OiA0IC8vIHVzZSBJUHY0XG4gICAgfSk7XG4gICAgcmV0dXJuIEh0dHBDbGllbnQuSFRUUF9BR0VOVDtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiBhbiBIVFRQUyBjbGllbnQgdG8gc2hhcmUuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtodHRwcy5BZ2VudH0gYSBzaGFyZWQgYWdlbnQgZm9yIG5ldHdvcmsgcmVxdWVzdHMgYW1vbmcgbGlicmFyeSBpbnN0YW5jZXNcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgZ2V0SHR0cHNBZ2VudCgpIHtcbiAgICBpZiAoIUh0dHBDbGllbnQuSFRUUFNfQUdFTlQpIEh0dHBDbGllbnQuSFRUUFNfQUdFTlQgPSBuZXcgaHR0cHMuQWdlbnQoe1xuICAgICAga2VlcEFsaXZlOiB0cnVlLFxuICAgICAgZmFtaWx5OiA0IC8vIHVzZSBJUHY0XG4gICAgfSk7XG4gICAgcmV0dXJuIEh0dHBDbGllbnQuSFRUUFNfQUdFTlQ7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgcGFyc2VYaHJSZXNwb25zZUhlYWRlcnMoaGVhZGVyc1N0cikge1xuICAgIGxldCBoZWFkZXJNYXAgPSB7fTtcbiAgICBsZXQgaGVhZGVycyA9IGhlYWRlcnNTdHIudHJpbSgpLnNwbGl0KC9bXFxyXFxuXSsvKTtcbiAgICBmb3IgKGxldCBoZWFkZXIgb2YgaGVhZGVycykge1xuICAgICAgbGV0IGhlYWRlclZhbHMgPSBoZWFkZXIuc3BsaXQoXCI6IFwiKTtcbiAgICAgIGhlYWRlck1hcFtoZWFkZXJWYWxzWzBdXSA9IGhlYWRlclZhbHNbMV07XG4gICAgfVxuICAgIHJldHVybiBoZWFkZXJNYXA7XG4gIH1cblxuICAvKipcbiAgICogTW9kaWZpY2F0aW9uIG9mIGRpZ2VzdCBhdXRoIHJlcXVlc3QgYnkgQGlub3JnYW5pay5cbiAgICogXG4gICAqIERlcGVuZGVudCBvbiBDcnlwdG9KUyBNRDUgaGFzaGluZzogaHR0cDovL2NyeXB0by1qcy5nb29nbGVjb2RlLmNvbS9zdm4vdGFncy8zLjEuMi9idWlsZC9yb2xsdXBzL21kNS5qc1xuICAgKiBcbiAgICogTUlUIGxpY2Vuc2VkLlxuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBkaWdlc3RBdXRoUmVxdWVzdCA9IGZ1bmN0aW9uKG1ldGhvZCwgdXJsLCB1c2VybmFtZSwgcGFzc3dvcmQpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBpZiAodHlwZW9mIENyeXB0b0pTID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcmVxdWlyZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIENyeXB0b0pTID0gcmVxdWlyZSgnY3J5cHRvLWpzJyk7XG4gICAgfVxuXG4gICAgdGhpcy5zY2hlbWUgPSBudWxsOyAvLyB3ZSBqdXN0IGVjaG8gdGhlIHNjaGVtZSwgdG8gYWxsb3cgZm9yICdEaWdlc3QnLCAnWC1EaWdlc3QnLCAnSkRpZ2VzdCcgZXRjXG4gICAgdGhpcy5ub25jZSA9IG51bGw7IC8vIHNlcnZlciBpc3N1ZWQgbm9uY2VcbiAgICB0aGlzLnJlYWxtID0gbnVsbDsgLy8gc2VydmVyIGlzc3VlZCByZWFsbVxuICAgIHRoaXMucW9wID0gbnVsbDsgLy8gXCJxdWFsaXR5IG9mIHByb3RlY3Rpb25cIiAtICcnIG9yICdhdXRoJyBvciAnYXV0aC1pbnQnXG4gICAgdGhpcy5yZXNwb25zZSA9IG51bGw7IC8vIGhhc2hlZCByZXNwb25zZSB0byBzZXJ2ZXIgY2hhbGxlbmdlXG4gICAgdGhpcy5vcGFxdWUgPSBudWxsOyAvLyBoYXNoZWQgcmVzcG9uc2UgdG8gc2VydmVyIGNoYWxsZW5nZVxuICAgIHRoaXMubmMgPSAxOyAvLyBub25jZSBjb3VudCAtIGluY3JlbWVudHMgd2l0aCBlYWNoIHJlcXVlc3QgdXNlZCB3aXRoIHRoZSBzYW1lIG5vbmNlXG4gICAgdGhpcy5jbm9uY2UgPSBudWxsOyAvLyBjbGllbnQgbm9uY2VcblxuICAgIC8vIHNldHRpbmdzXG4gICAgdGhpcy50aW1lb3V0ID0gNjAwMDA7IC8vIHRpbWVvdXRcbiAgICB0aGlzLmxvZ2dpbmdPbiA9IGZhbHNlOyAvLyB0b2dnbGUgY29uc29sZSBsb2dnaW5nXG5cbiAgICAvLyBkZXRlcm1pbmUgaWYgYSBwb3N0LCBzbyB0aGF0IHJlcXVlc3Qgd2lsbCBzZW5kIGRhdGFcbiAgICB0aGlzLnBvc3QgPSBmYWxzZTtcbiAgICBpZiAobWV0aG9kLnRvTG93ZXJDYXNlKCkgPT09ICdwb3N0JyB8fCBtZXRob2QudG9Mb3dlckNhc2UoKSA9PT0gJ3B1dCcpIHtcbiAgICAgIHRoaXMucG9zdCA9IHRydWU7XG4gICAgfVxuXG4gICAgLy8gc3RhcnQgaGVyZVxuICAgIC8vIHN1Y2Nlc3NGbiAtIHdpbGwgYmUgcGFzc2VkIEpTT04gZGF0YVxuICAgIC8vIGVycm9yRm4gLSB3aWxsIGJlIHBhc3NlZCB0aGUgZmFpbGVkIGF1dGhlbnRpY2F0ZWRSZXF1ZXN0XG4gICAgLy8gZGF0YSAtIG9wdGlvbmFsLCBmb3IgUE9TVFNcbiAgICB0aGlzLnJlcXVlc3QgPSBmdW5jdGlvbihzdWNjZXNzRm4sIGVycm9yRm4sIGRhdGEpIHtcbiAgICAgIFxuICAgICAgLy8gc3RyaW5naWZ5IGpzb25cbiAgICAgIGlmIChkYXRhKSB7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgc2VsZi5kYXRhID0gZGF0YSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkgfHwgdHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIgPyBkYXRhIDogSlNPTi5zdHJpbmdpZnkoZGF0YSk7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNlbGYuc3VjY2Vzc0ZuID0gc3VjY2Vzc0ZuO1xuICAgICAgc2VsZi5lcnJvckZuID0gZXJyb3JGbjtcblxuICAgICAgaWYgKCFzZWxmLm5vbmNlKSB7XG4gICAgICAgIHNlbGYubWFrZVVuYXV0aGVudGljYXRlZFJlcXVlc3Qoc2VsZi5kYXRhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbGYubWFrZUF1dGhlbnRpY2F0ZWRSZXF1ZXN0KCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMubWFrZVVuYXV0aGVudGljYXRlZFJlcXVlc3QgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICBzZWxmLmZpcnN0UmVxdWVzdCA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgICAgc2VsZi5maXJzdFJlcXVlc3Qub3BlbihtZXRob2QsIHVybCwgdHJ1ZSk7XG4gICAgICBzZWxmLmZpcnN0UmVxdWVzdC50aW1lb3V0ID0gc2VsZi50aW1lb3V0O1xuICAgICAgLy8gaWYgd2UgYXJlIHBvc3RpbmcsIGFkZCBhcHByb3ByaWF0ZSBoZWFkZXJzXG4gICAgICBpZiAoc2VsZi5wb3N0ICYmIGRhdGEpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBkYXRhID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgc2VsZi5maXJzdFJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC10eXBlJywgJ3RleHQvcGxhaW4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWxmLmZpcnN0UmVxdWVzdC5yZXNwb25zZVR5cGUgPSBcImFycmF5YnVmZmVyXCI7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2VsZi5maXJzdFJlcXVlc3Qub25yZWFkeXN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgLy8gMjogcmVjZWl2ZWQgaGVhZGVycywgIDM6IGxvYWRpbmcsIDQ6IGRvbmVcbiAgICAgICAgaWYgKHNlbGYuZmlyc3RSZXF1ZXN0LnJlYWR5U3RhdGUgPT09IDIpIHtcblxuICAgICAgICAgIHZhciByZXNwb25zZUhlYWRlcnMgPSBzZWxmLmZpcnN0UmVxdWVzdC5nZXRBbGxSZXNwb25zZUhlYWRlcnMoKTtcbiAgICAgICAgICByZXNwb25zZUhlYWRlcnMgPSByZXNwb25zZUhlYWRlcnMuc3BsaXQoJ1xcbicpO1xuICAgICAgICAgIC8vIGdldCBhdXRoZW50aWNhdGUgaGVhZGVyXG4gICAgICAgICAgdmFyIGRpZ2VzdEhlYWRlcnM7XG4gICAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHJlc3BvbnNlSGVhZGVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHJlc3BvbnNlSGVhZGVyc1tpXS5tYXRjaCgvd3d3LWF1dGhlbnRpY2F0ZS9pKSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgIGRpZ2VzdEhlYWRlcnMgPSByZXNwb25zZUhlYWRlcnNbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGRpZ2VzdEhlYWRlcnMgIT0gbnVsbCkge1xuICAgICAgICAgICAgLy8gcGFyc2UgYXV0aCBoZWFkZXIgYW5kIGdldCBkaWdlc3QgYXV0aCBrZXlzXG4gICAgICAgICAgICBkaWdlc3RIZWFkZXJzID0gZGlnZXN0SGVhZGVycy5zbGljZShkaWdlc3RIZWFkZXJzLmluZGV4T2YoJzonKSArIDEsIC0xKTtcbiAgICAgICAgICAgIGRpZ2VzdEhlYWRlcnMgPSBkaWdlc3RIZWFkZXJzLnNwbGl0KCcsJyk7XG4gICAgICAgICAgICBzZWxmLnNjaGVtZSA9IGRpZ2VzdEhlYWRlcnNbMF0uc3BsaXQoL1xccy8pWzFdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkaWdlc3RIZWFkZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgIHZhciBlcXVhbEluZGV4ID0gZGlnZXN0SGVhZGVyc1tpXS5pbmRleE9mKCc9JyksXG4gICAgICAgICAgICAgICAga2V5ID0gZGlnZXN0SGVhZGVyc1tpXS5zdWJzdHJpbmcoMCwgZXF1YWxJbmRleCksXG4gICAgICAgICAgICAgICAgdmFsID0gZGlnZXN0SGVhZGVyc1tpXS5zdWJzdHJpbmcoZXF1YWxJbmRleCArIDEpO1xuICAgICAgICAgICAgICB2YWwgPSB2YWwucmVwbGFjZSgvWydcIl0rL2csICcnKTtcbiAgICAgICAgICAgICAgLy8gZmluZCByZWFsbVxuICAgICAgICAgICAgICBpZiAoa2V5Lm1hdGNoKC9yZWFsbS9pKSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5yZWFsbSA9IHZhbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAvLyBmaW5kIG5vbmNlXG4gICAgICAgICAgICAgIGlmIChrZXkubWF0Y2goL25vbmNlL2kpICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzZWxmLm5vbmNlID0gdmFsO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIC8vIGZpbmQgb3BhcXVlXG4gICAgICAgICAgICAgIGlmIChrZXkubWF0Y2goL29wYXF1ZS9pKSAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgc2VsZi5vcGFxdWUgPSB2YWw7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgLy8gZmluZCBRT1BcbiAgICAgICAgICAgICAgaWYgKGtleS5tYXRjaCgvcW9wL2kpICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBzZWxmLnFvcCA9IHZhbDtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gY2xpZW50IGdlbmVyYXRlZCBrZXlzXG4gICAgICAgICAgICBzZWxmLmNub25jZSA9IHNlbGYuZ2VuZXJhdGVDbm9uY2UoKTtcbiAgICAgICAgICAgIHNlbGYubmMrKztcbiAgICAgICAgICAgIC8vIGlmIGxvZ2dpbmcsIHNob3cgaGVhZGVycyByZWNlaXZlZDpcbiAgICAgICAgICAgIHNlbGYubG9nKCdyZWNlaXZlZCBoZWFkZXJzOicpO1xuICAgICAgICAgICAgc2VsZi5sb2coJyAgcmVhbG06ICcrc2VsZi5yZWFsbSk7XG4gICAgICAgICAgICBzZWxmLmxvZygnICBub25jZTogJytzZWxmLm5vbmNlKTtcbiAgICAgICAgICAgIHNlbGYubG9nKCcgIG9wYXF1ZTogJytzZWxmLm9wYXF1ZSk7XG4gICAgICAgICAgICBzZWxmLmxvZygnICBxb3A6ICcrc2VsZi5xb3ApO1xuICAgICAgICAgICAgLy8gbm93IHdlIGNhbiBtYWtlIGFuIGF1dGhlbnRpY2F0ZWQgcmVxdWVzdFxuICAgICAgICAgICAgc2VsZi5tYWtlQXV0aGVudGljYXRlZFJlcXVlc3QoKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNlbGYuZmlyc3RSZXF1ZXN0LnJlYWR5U3RhdGUgPT09IDQpIHtcbiAgICAgICAgICBpZiAoc2VsZi5maXJzdFJlcXVlc3Quc3RhdHVzID09PSAyMDApIHtcbiAgICAgICAgICAgIHNlbGYubG9nKCdBdXRoZW50aWNhdGlvbiBub3QgcmVxdWlyZWQgZm9yICcrdXJsKTtcbiAgICAgICAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgICAgICAgICAgICBzZWxmLnN1Y2Nlc3NGbihzZWxmLmZpcnN0UmVxdWVzdCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICBpZiAoc2VsZi5maXJzdFJlcXVlc3QucmVzcG9uc2VUZXh0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGlmIChzZWxmLmZpcnN0UmVxdWVzdC5yZXNwb25zZVRleHQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgLy8gSWYgSlNPTiwgcGFyc2UgYW5kIHJldHVybiBvYmplY3RcbiAgICAgICAgICAgICAgICAgIGlmIChzZWxmLmlzSnNvbihzZWxmLmZpcnN0UmVxdWVzdC5yZXNwb25zZVRleHQpKSB7ICAvLyBUT0RPOiByZWR1bmRhbnRcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zdWNjZXNzRm4oc2VsZi5maXJzdFJlcXVlc3QpO1xuICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zdWNjZXNzRm4oc2VsZi5maXJzdFJlcXVlc3QpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLnN1Y2Nlc3NGbigpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBzZW5kXG4gICAgICBpZiAoc2VsZi5wb3N0KSB7XG4gICAgICAgIC8vIGluIGNhc2UgZGlnZXN0IGF1dGggbm90IHJlcXVpcmVkXG4gICAgICAgIHNlbGYuZmlyc3RSZXF1ZXN0LnNlbmQoc2VsZi5kYXRhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbGYuZmlyc3RSZXF1ZXN0LnNlbmQoKTtcbiAgICAgIH1cbiAgICAgIHNlbGYubG9nKCdVbmF1dGhlbnRpY2F0ZWQgcmVxdWVzdCB0byAnK3VybCk7XG5cbiAgICAgIC8vIGhhbmRsZSBlcnJvclxuICAgICAgc2VsZi5maXJzdFJlcXVlc3Qub25lcnJvciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoc2VsZi5maXJzdFJlcXVlc3Quc3RhdHVzICE9PSA0MDEpIHtcbiAgICAgICAgICBzZWxmLmxvZygnRXJyb3IgKCcrc2VsZi5maXJzdFJlcXVlc3Quc3RhdHVzKycpIG9uIHVuYXV0aGVudGljYXRlZCByZXF1ZXN0IHRvICcrdXJsKTtcbiAgICAgICAgICBzZWxmLmVycm9yRm4oc2VsZi5maXJzdFJlcXVlc3QpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMubWFrZUF1dGhlbnRpY2F0ZWRSZXF1ZXN0PSBmdW5jdGlvbigpIHtcblxuICAgICAgc2VsZi5yZXNwb25zZSA9IHNlbGYuZm9ybXVsYXRlUmVzcG9uc2UoKTtcbiAgICAgIHNlbGYuYXV0aGVudGljYXRlZFJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcbiAgICAgIHNlbGYuYXV0aGVudGljYXRlZFJlcXVlc3Qub3BlbihtZXRob2QsIHVybCwgdHJ1ZSk7XG4gICAgICBzZWxmLmF1dGhlbnRpY2F0ZWRSZXF1ZXN0LnRpbWVvdXQgPSBzZWxmLnRpbWVvdXQ7XG4gICAgICB2YXIgZGlnZXN0QXV0aEhlYWRlciA9IHNlbGYuc2NoZW1lKycgJytcbiAgICAgICAgJ3VzZXJuYW1lPVwiJyt1c2VybmFtZSsnXCIsICcrXG4gICAgICAgICdyZWFsbT1cIicrc2VsZi5yZWFsbSsnXCIsICcrXG4gICAgICAgICdub25jZT1cIicrc2VsZi5ub25jZSsnXCIsICcrXG4gICAgICAgICd1cmk9XCInK3VybCsnXCIsICcrXG4gICAgICAgICdyZXNwb25zZT1cIicrc2VsZi5yZXNwb25zZSsnXCIsICcrXG4gICAgICAgICdvcGFxdWU9XCInK3NlbGYub3BhcXVlKydcIiwgJytcbiAgICAgICAgJ3FvcD0nK3NlbGYucW9wKycsICcrXG4gICAgICAgICduYz0nKygnMDAwMDAwMDAnICsgc2VsZi5uYykuc2xpY2UoLTgpKycsICcrXG4gICAgICAgICdjbm9uY2U9XCInK3NlbGYuY25vbmNlKydcIic7XG4gICAgICBzZWxmLmF1dGhlbnRpY2F0ZWRSZXF1ZXN0LnNldFJlcXVlc3RIZWFkZXIoJ0F1dGhvcml6YXRpb24nLCBkaWdlc3RBdXRoSGVhZGVyKTtcbiAgICAgIHNlbGYubG9nKCdkaWdlc3QgYXV0aCBoZWFkZXIgcmVzcG9uc2UgdG8gYmUgc2VudDonKTtcbiAgICAgIHNlbGYubG9nKGRpZ2VzdEF1dGhIZWFkZXIpO1xuICAgICAgLy8gaWYgd2UgYXJlIHBvc3RpbmcsIGFkZCBhcHByb3ByaWF0ZSBoZWFkZXJzXG4gICAgICBpZiAoc2VsZi5wb3N0ICYmIHNlbGYuZGF0YSkge1xuICAgICAgICBpZiAodHlwZW9mIHNlbGYuZGF0YSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIHNlbGYuYXV0aGVudGljYXRlZFJlcXVlc3Quc2V0UmVxdWVzdEhlYWRlcignQ29udGVudC10eXBlJywgJ3RleHQvcGxhaW4nKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWxmLmF1dGhlbnRpY2F0ZWRSZXF1ZXN0LnJlc3BvbnNlVHlwZSA9IFwiYXJyYXlidWZmZXJcIjsgICAgICAgIFxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBzZWxmLmF1dGhlbnRpY2F0ZWRSZXF1ZXN0Lm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyBzdWNjZXNzXG4gICAgICAgIGlmIChzZWxmLmF1dGhlbnRpY2F0ZWRSZXF1ZXN0LnN0YXR1cyA+PSAyMDAgJiYgc2VsZi5hdXRoZW50aWNhdGVkUmVxdWVzdC5zdGF0dXMgPCA0MDApIHtcbiAgICAgICAgICAvLyBpbmNyZW1lbnQgbm9uY2UgY291bnRcbiAgICAgICAgICBzZWxmLm5jKys7XG4gICAgICAgICAgLy8gcmV0dXJuIGRhdGFcbiAgICAgICAgICBpZiAoc2VsZi5kYXRhIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgICAgICAgICAgc2VsZi5zdWNjZXNzRm4oc2VsZi5hdXRoZW50aWNhdGVkUmVxdWVzdCk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChzZWxmLmF1dGhlbnRpY2F0ZWRSZXF1ZXN0LnJlc3BvbnNlVGV4dCAhPT0gJ3VuZGVmaW5lZCcgJiYgc2VsZi5hdXRoZW50aWNhdGVkUmVxdWVzdC5yZXNwb25zZVRleHQubGVuZ3RoID4gMCApIHtcbiAgICAgICAgICAgICAgLy8gSWYgSlNPTiwgcGFyc2UgYW5kIHJldHVybiBvYmplY3RcbiAgICAgICAgICAgICAgaWYgKHNlbGYuaXNKc29uKHNlbGYuYXV0aGVudGljYXRlZFJlcXVlc3QucmVzcG9uc2VUZXh0KSkgeyAgLy8gVE9ETzogcmVkdW5kYW50IGZyb20gbm90IHBhcnNpbmdcbiAgICAgICAgICAgICAgICBzZWxmLnN1Y2Nlc3NGbihzZWxmLmF1dGhlbnRpY2F0ZWRSZXF1ZXN0KTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLnN1Y2Nlc3NGbihzZWxmLmF1dGhlbnRpY2F0ZWRSZXF1ZXN0KTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYuc3VjY2Vzc0ZuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIGZhaWx1cmVcbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgc2VsZi5ub25jZSA9IG51bGw7XG4gICAgICAgICAgc2VsZi5lcnJvckZuKHNlbGYuYXV0aGVudGljYXRlZFJlcXVlc3QpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyBoYW5kbGUgZXJyb3JzXG4gICAgICBzZWxmLmF1dGhlbnRpY2F0ZWRSZXF1ZXN0Lm9uZXJyb3IgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZi5sb2coJ0Vycm9yICgnK3NlbGYuYXV0aGVudGljYXRlZFJlcXVlc3Quc3RhdHVzKycpIG9uIGF1dGhlbnRpY2F0ZWQgcmVxdWVzdCB0byAnK3VybCk7XG4gICAgICAgIHNlbGYubm9uY2UgPSBudWxsO1xuICAgICAgICBzZWxmLmVycm9yRm4oc2VsZi5hdXRoZW50aWNhdGVkUmVxdWVzdCk7XG4gICAgICB9O1xuICAgICAgLy8gc2VuZFxuICAgICAgaWYgKHNlbGYucG9zdCkge1xuICAgICAgICBzZWxmLmF1dGhlbnRpY2F0ZWRSZXF1ZXN0LnNlbmQoc2VsZi5kYXRhKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHNlbGYuYXV0aGVudGljYXRlZFJlcXVlc3Quc2VuZCgpO1xuICAgICAgfVxuICAgICAgc2VsZi5sb2coJ0F1dGhlbnRpY2F0ZWQgcmVxdWVzdCB0byAnK3VybCk7XG4gICAgfVxuICAgIC8vIGhhc2ggcmVzcG9uc2UgYmFzZWQgb24gc2VydmVyIGNoYWxsZW5nZVxuICAgIHRoaXMuZm9ybXVsYXRlUmVzcG9uc2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBIQTEgPSBDcnlwdG9KUy5NRDUodXNlcm5hbWUrJzonK3NlbGYucmVhbG0rJzonK3Bhc3N3b3JkKS50b1N0cmluZygpO1xuICAgICAgdmFyIEhBMiA9IENyeXB0b0pTLk1ENShtZXRob2QrJzonK3VybCkudG9TdHJpbmcoKTtcbiAgICAgIHZhciByZXNwb25zZSA9IENyeXB0b0pTLk1ENShIQTErJzonK1xuICAgICAgICBzZWxmLm5vbmNlKyc6JytcbiAgICAgICAgKCcwMDAwMDAwMCcgKyBzZWxmLm5jKS5zbGljZSgtOCkrJzonK1xuICAgICAgICBzZWxmLmNub25jZSsnOicrXG4gICAgICAgIHNlbGYucW9wKyc6JytcbiAgICAgICAgSEEyKS50b1N0cmluZygpO1xuICAgICAgcmV0dXJuIHJlc3BvbnNlO1xuICAgIH1cbiAgICAvLyBnZW5lcmF0ZSAxNiBjaGFyIGNsaWVudCBub25jZVxuICAgIHRoaXMuZ2VuZXJhdGVDbm9uY2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBjaGFyYWN0ZXJzID0gJ2FiY2RlZjAxMjM0NTY3ODknO1xuICAgICAgdmFyIHRva2VuID0gJyc7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IDE2OyBpKyspIHtcbiAgICAgICAgdmFyIHJhbmROdW0gPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiBjaGFyYWN0ZXJzLmxlbmd0aCk7XG4gICAgICAgIHRva2VuICs9IGNoYXJhY3RlcnMuc3Vic3RyKHJhbmROdW0sIDEpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRva2VuO1xuICAgIH1cbiAgICB0aGlzLmFib3J0ID0gZnVuY3Rpb24oKSB7XG4gICAgICBzZWxmLmxvZygnW2RpZ2VzdEF1dGhSZXF1ZXN0XSBBYm9ydGVkIHJlcXVlc3QgdG8gJyt1cmwpO1xuICAgICAgaWYgKHNlbGYuZmlyc3RSZXF1ZXN0ICE9IG51bGwpIHtcbiAgICAgICAgaWYgKHNlbGYuZmlyc3RSZXF1ZXN0LnJlYWR5U3RhdGUgIT0gNCkgc2VsZi5maXJzdFJlcXVlc3QuYWJvcnQoKTtcbiAgICAgIH1cbiAgICAgIGlmIChzZWxmLmF1dGhlbnRpY2F0ZWRSZXF1ZXN0ICE9IG51bGwpIHtcbiAgICAgICAgaWYgKHNlbGYuYXV0aGVudGljYXRlZFJlcXVlc3QucmVhZHlTdGF0ZSAhPSA0KSBzZWxmLmF1dGhlbnRpY2F0ZWRSZXF1ZXN0LmFib3J0KCk7XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuaXNKc29uID0gZnVuY3Rpb24oc3RyKSB7XG4gICAgICB0cnkge1xuICAgICAgICBKU09OLnBhcnNlKHN0cik7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHRoaXMubG9nID0gZnVuY3Rpb24oc3RyKSB7XG4gICAgICBpZiAoc2VsZi5sb2dnaW5nT24pIHtcbiAgICAgICAgY29uc29sZS5sb2coJ1tkaWdlc3RBdXRoUmVxdWVzdF0gJytzdHIpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLnZlcnNpb24gPSBmdW5jdGlvbigpIHsgcmV0dXJuICcwLjguMCcgfVxuICB9XG59XG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxTQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBQyxhQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7O0FBRUEsSUFBQUUsV0FBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsZ0JBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLGVBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLEtBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFNLE1BQUEsR0FBQVAsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDZSxNQUFNTyxVQUFVLENBQUM7O0VBRTlCLE9BQU9DLHVCQUF1QixHQUFHLEVBQUU7O0VBRW5DO0VBQ0EsT0FBaUJDLGVBQWUsR0FBRztJQUNqQ0MsTUFBTSxFQUFFLEtBQUs7SUFDYkMsVUFBVSxFQUFFLE9BQU87SUFDbkJDLHVCQUF1QixFQUFFLEtBQUs7SUFDOUJDLGtCQUFrQixFQUFFO0VBQ3RCLENBQUM7O0VBRUQ7RUFDQSxPQUFpQkMsaUJBQWlCLEdBQUcsRUFBRTtFQUN2QyxPQUFpQkMsV0FBVyxHQUFHLEVBQUU7RUFDakMsT0FBaUJDLGVBQWUsR0FBRyxL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