"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _GenUtils = _interopRequireDefault(require("./GenUtils"));
var _LibraryUtils = _interopRequireDefault(require("./LibraryUtils"));
var _ThreadPool = _interopRequireDefault(require("./ThreadPool"));
var _promiseThrottle = _interopRequireDefault(require("promise-throttle"));
var _http = _interopRequireDefault(require("http"));
var _https = _interopRequireDefault(require("https"));
var _axios = _interopRequireDefault(require("axios"));

/**
 * Handle HTTP requests with a uniform interface.
 */
class HttpClient {

  static MAX_REQUESTS_PER_SECOND = 50;

  // default request config
  static DEFAULT_REQUEST = {
    method: "GET",
    resolveWithFullResponse: false,
    rejectUnauthorized: true
  };

  // rate limit requests per host
  static PROMISE_THROTTLES = [];
  static TASK_QUEUES = [];
  static CONNECT_TIMEOUT = 180000; // ms to establish a connection, matching monero-java's default (0 to disable)
  static READ_TIMEOUT = 180000; // ms of socket inactivity before timing out



  static SOCKS_AGENTS = {}; // shared socks agents keyed by proxy uri and ssl config

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
   * @param {string} [request.proxyUri] - proxy the request through a SOCKS5 server, e.g. a local Tor proxy (Node.js only, optional)
   * @param {boolean} [request.resolveWithFullResponse] - return full response if true, else body only (default false)
   * @param {boolean} [request.rejectUnauthorized] - whether or not to reject self-signed certificates (default true)
   * @param {object} [request.cancelToken] - token to cancel a queued or active request (optional)
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

    // connection and response inactivity are bounded in the agents
    let requestPromise = HttpClient.requestAxios(request);
    return request.timeout ? _GenUtils.default.executeWithTimeout(requestPromise, request.timeout) : requestPromise;
  }

  static createCancelToken() {
    return _axios.default.CancelToken.source();
  }

  // ----------------------------- PRIVATE HELPERS ----------------------------


  /**
   * Get a singleton instance of an HTTP client to share.
   *
   * @return {http.Agent} a shared agent for network requests among library instances
   */
  static getHttpAgent() {
    if (!HttpClient.HTTP_AGENT) HttpClient.HTTP_AGENT = HttpClient.applyTimeouts(new _http.default.Agent({
      keepAlive: true,
      family: 4 // use IPv4
    }));
    return HttpClient.HTTP_AGENT;
  }

  /**
   * Get a singleton instance of an HTTPS client to share.
   *
   * @return {https.Agent} a shared agent for network requests among library instances
   */
  static getHttpsAgent() {
    if (!HttpClient.HTTPS_AGENT) HttpClient.HTTPS_AGENT = HttpClient.applyTimeouts(new _https.default.Agent({
      keepAlive: true,
      family: 4 // use IPv4
    }));
    return HttpClient.HTTPS_AGENT;
  }

  /**
   * Get a singleton agent to route requests through a SOCKS5 proxy; hostnames are resolved by the proxy to avoid DNS leaks.
   *
   * @return {SocksProxyAgent} a shared agent for the given proxy and ssl config
   */
  static getSocksAgent(proxyUri, rejectUnauthorized) {
    if (_GenUtils.default.isBrowser() || _GenUtils.default.isDeno()) throw new Error("Proxied requests are only supported in Node.js");
    const key = proxyUri + "_" + rejectUnauthorized;
    if (!HttpClient.SOCKS_AGENTS[key]) {
      const { SocksProxyAgent } = require("socks-proxy-agent");
      const parsed = new URL(_GenUtils.default.normalizeUri(proxyUri));
      const auth = parsed.username ? parsed.username + ":" + parsed.password + "@" : "";
      HttpClient.SOCKS_AGENTS[key] = new SocksProxyAgent("socks5h://" + auth + parsed.host, { // socks establishment and inactivity are bounded by timeout
        keepAlive: true,
        timeout: Math.max(HttpClient.CONNECT_TIMEOUT, HttpClient.READ_TIMEOUT),
        rejectUnauthorized: rejectUnauthorized
      });
    }
    return HttpClient.SOCKS_AGENTS[key];
  }

  // bound the whole request where node agent socket timeouts do not apply
  static getNonAgentTimeout() {
    return _GenUtils.default.isBrowser() || _GenUtils.default.isDeno() ? Math.max(HttpClient.CONNECT_TIMEOUT, HttpClient.READ_TIMEOUT) : 0;
  }

  // bound the connection phase and socket inactivity
  static applyTimeouts(agent) {
    if (typeof agent.createConnection !== "function") return agent; // no-op in browser shims
    const createConnection = agent.createConnection.bind(agent);
    agent.createConnection = function (options, callback) {
      const socket = createConnection(options, callback);
      if (HttpClient.CONNECT_TIMEOUT > 0) {
        const timer = setTimeout(() => socket.destroy(new Error("Connection timed out in " + HttpClient.CONNECT_TIMEOUT + " ms")), HttpClient.CONNECT_TIMEOUT);
        const clearConnectTimer = () => clearTimeout(timer);
        socket.once("connect", clearConnectTimer).once("secureConnect", clearConnectTimer).once("error", clearConnectTimer).once("close", clearConnectTimer);
      }
      if (HttpClient.READ_TIMEOUT > 0) socket.setTimeout(HttpClient.READ_TIMEOUT, () => socket.destroy(new Error("Socket timed out after " + HttpClient.READ_TIMEOUT + " ms of inactivity")));
      return socket;
    };
    return agent;
  }

  static async requestAxios(req) {
    if (req.headers) throw new Error("Custom headers not implemented in XHR request"); // TODO

    // collect params from request which change on await
    const method = req.method;
    const uri = req.uri;
    const host = req.host;
    const username = req.username;
    const password = req.password;
    const body = req.body;
    const proxyUri = req.proxyUri;
    const rejectUnauthorized = req.rejectUnauthorized;
    const isBinary = body instanceof Uint8Array;
    const cancelToken = req.cancelToken;
    if (cancelToken) cancelToken.throwIfRequested();

    // queue and throttle requests to execute in serial and rate limited per host
    const response = HttpClient.TASK_QUEUES[host].submit(async function () {
      if (cancelToken) cancelToken.throwIfRequested();
      return HttpClient.PROMISE_THROTTLES[host].add(function () {
        return new Promise(function (resolve, reject) {
          HttpClient.axiosDigestAuthRequest(method, uri, username, password, body, proxyUri, rejectUnauthorized, cancelToken).then(function (resp) {
            resolve(resp);
          }).catch(function (error) {
            if (error.response?.status) resolve(error.response);
            reject(new Error("Request failed without response: " + method + " " + uri + " due to underlying error:\n" + error.message + "\n" + error.stack));
          });
        });

      }.bind(this));
    });

    // reject cancellation immediately even when queued behind another wallet's request
    let onCancel;
    let resp;
    try {
      resp = cancelToken ? await Promise.race([response, new Promise((resolve, reject) => {
        onCancel = reject;
        cancelToken.subscribe(onCancel);
      })]) : await response;
    } finally {
      if (cancelToken) cancelToken.unsubscribe(onCancel);
    }

    // normalize response
    let normalizedResponse = {};
    normalizedResponse.statusCode = resp.status;
    normalizedResponse.statusText = resp.statusText;
    normalizedResponse.headers = { ...resp.headers };
    normalizedResponse.body = isBinary ? new Uint8Array(resp.data) : resp.data;
    if (normalizedResponse.body instanceof ArrayBuffer) normalizedResponse.body = new Uint8Array(normalizedResponse.body); // handle empty binary request
    return normalizedResponse;
  }

  static axiosDigestAuthRequest = async function (method, url, username, password, body, proxyUri, rejectUnauthorized, cancelToken) {
    if (typeof CryptoJS === 'undefined' && typeof require === 'function') {
      var CryptoJS = require('crypto-js');
    }

    // route through socks proxy if configured, otherwise use direct agents
    const socksAgent = proxyUri ? HttpClient.getSocksAgent(proxyUri, rejectUnauthorized !== false) : undefined;
    const httpAgent = socksAgent ?? (url.startsWith("https") ? undefined : HttpClient.getHttpAgent());
    const httpsAgent = socksAgent ?? (url.startsWith("https") ? HttpClient.getHttpsAgent() : undefined);

    const generateCnonce = function () {
      const characters = 'abcdef0123456789';
      let token = '';
      for (let i = 0; i < 16; i++) {
        const randNum = Math.round(Math.random() * characters.length);
        token += characters.slice(randNum, randNum + 1);
      }
      return token;
    };

    let count = 0;
    return _axios.default.request({
      url: url,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: body instanceof Uint8Array ? 'arraybuffer' : undefined,
      httpAgent: httpAgent,
      httpsAgent: httpsAgent,
      proxy: socksAgent ? false : undefined, // env proxies must not bypass the socks agent
      timeout: HttpClient.getNonAgentTimeout(),
      cancelToken: cancelToken,
      data: body,
      transformResponse: (res) => res,
      adapter: _GenUtils.default.isDeno() ? ['fetch'] : ['http', 'xhr', 'fetch']
    }).catch(async (err) => {
      if (err.response?.status === 401) {
        let authHeader = err.response.headers['www-authenticate'].replace(/,\sDigest.*/, "");
        if (!authHeader) {
          throw err;
        }

        // Digest qop="auth",algorithm=MD5,realm="monero-rpc",nonce="hBZ2rZIxElv4lqCRrUylXA==",stale=false
        const authHeaderMap = authHeader.replace("Digest ", "").replaceAll('"', "").split(",").reduce((prev, curr) => ({ ...prev, [curr.split("=")[0]]: curr.split("=").slice(1).join('=') }), {});

        ++count;

        const cnonce = generateCnonce();
        const HA1 = CryptoJS.MD5(username + ':' + authHeaderMap.realm + ':' + password).toString();
        const HA2 = CryptoJS.MD5(method + ':' + url).toString();

        const response = CryptoJS.MD5(HA1 + ':' +
        authHeaderMap.nonce + ':' +
        ('00000000' + count).slice(-8) + ':' +
        cnonce + ':' +
        authHeaderMap.qop + ':' +
        HA2).toString();
        const digestAuthHeader = 'Digest' + ' ' +
        'username="' + username + '", ' +
        'realm="' + authHeaderMap.realm + '", ' +
        'nonce="' + authHeaderMap.nonce + '", ' +
        'uri="' + url + '", ' +
        'response="' + response + '", ' +
        'opaque="' + (authHeaderMap.opaque ?? null) + '", ' +
        'qop=' + authHeaderMap.qop + ', ' +
        'nc=' + ('00000000' + count).slice(-8) + ', ' +
        'cnonce="' + cnonce + '"';

        const finalResponse = await _axios.default.request({
          url: url,
          method: method,
          headers: {
            'Authorization': digestAuthHeader,
            'Content-Type': 'application/json'
          },
          responseType: body instanceof Uint8Array ? 'arraybuffer' : undefined,
          httpAgent: url.startsWith("https") ? undefined : HttpClient.getHttpAgent(),
          httpsAgent: url.startsWith("https") ? HttpClient.getHttpsAgent() : undefined,
          timeout: HttpClient.getNonAgentTimeout(),
          cancelToken: cancelToken,
          data: body,
          transformResponse: (res) => res,
          adapter: _GenUtils.default.isDeno() ? ['fetch'] : ['http', 'xhr', 'fetch']
        });

        return finalResponse;
      }
      throw err;
    }).catch((err) => {
      throw err;
    });
  };
}exports.default = HttpClient;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9MaWJyYXJ5VXRpbHMiLCJfVGhyZWFkUG9vbCIsIl9wcm9taXNlVGhyb3R0bGUiLCJfaHR0cCIsIl9odHRwcyIsIl9heGlvcyIsIkh0dHBDbGllbnQiLCJNQVhfUkVRVUVTVFNfUEVSX1NFQ09ORCIsIkRFRkFVTFRfUkVRVUVTVCIsIm1ldGhvZCIsInJlc29sdmVXaXRoRnVsbFJlc3BvbnNlIiwicmVqZWN0VW5hdXRob3JpemVkIiwiUFJPTUlTRV9USFJPVFRMRVMiLCJUQVNLX1FVRVVFUyIsIkNPTk5FQ1RfVElNRU9VVCIsIlJFQURfVElNRU9VVCIsIlNPQ0tTX0FHRU5UUyIsInJlcXVlc3QiLCJwcm94eVRvV29ya2VyIiwiTGlicmFyeVV0aWxzIiwiaW52b2tlV29ya2VyIiwidW5kZWZpbmVkIiwiZXJyIiwibWVzc2FnZSIsImxlbmd0aCIsImNoYXJBdCIsInBhcnNlZCIsIkpTT04iLCJwYXJzZSIsInN0YXR1c01lc3NhZ2UiLCJzdGF0dXNDb2RlIiwiT2JqZWN0IiwiYXNzaWduIiwiaG9zdCIsIlVSTCIsInVyaSIsIkVycm9yIiwiYm9keSIsIlRocmVhZFBvb2wiLCJQcm9taXNlVGhyb3R0bGUiLCJyZXF1ZXN0c1BlclNlY29uZCIsInByb21pc2VJbXBsZW1lbnRhdGlvbiIsIlByb21pc2UiLCJyZXF1ZXN0UHJvbWlzZSIsInJlcXVlc3RBeGlvcyIsInRpbWVvdXQiLCJHZW5VdGlscyIsImV4ZWN1dGVXaXRoVGltZW91dCIsImNyZWF0ZUNhbmNlbFRva2VuIiwiYXhpb3MiLCJDYW5jZWxUb2tlbiIsInNvdXJjZSIsImdldEh0dHBBZ2VudCIsIkhUVFBfQUdFTlQiLCJhcHBseVRpbWVvdXRzIiwiaHR0cCIsIkFnZW50Iiwia2VlcEFsaXZlIiwiZmFtaWx5IiwiZ2V0SHR0cHNBZ2VudCIsIkhUVFBTX0FHRU5UIiwiaHR0cHMiLCJnZXRTb2Nrc0FnZW50IiwicHJveHlVcmkiLCJpc0Jyb3dzZXIiLCJpc0Rlbm8iLCJrZXkiLCJTb2Nrc1Byb3h5QWdlbnQiLCJub3JtYWxpemVVcmkiLCJhdXRoIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsIk1hdGgiLCJtYXgiLCJnZXROb25BZ2VudFRpbWVvdXQiLCJhZ2VudCIsImNyZWF0ZUNvbm5lY3Rpb24iLCJiaW5kIiwib3B0aW9ucyIsImNhbGxiYWNrIiwic29ja2V0IiwidGltZXIiLCJzZXRUaW1lb3V0IiwiZGVzdHJveSIsImNsZWFyQ29ubmVjdFRpbWVyIiwiY2xlYXJUaW1lb3V0Iiwib25jZSIsInJlcSIsImhlYWRlcnMiLCJpc0JpbmFyeSIsIlVpbnQ4QXJyYXkiLCJjYW5jZWxUb2tlbiIsInRocm93SWZSZXF1ZXN0ZWQiLCJyZXNwb25zZSIsInN1Ym1pdCIsImFkZCIsInJlc29sdmUiLCJyZWplY3QiLCJheGlvc0RpZ2VzdEF1dGhSZXF1ZXN0IiwidGhlbiIsInJlc3AiLCJjYXRjaCIsImVycm9yIiwic3RhdHVzIiwic3RhY2siLCJvbkNhbmNlbCIsInJhY2UiLCJzdWJzY3JpYmUiLCJ1bnN1YnNjcmliZSIsIm5vcm1hbGl6ZWRSZXNwb25zZSIsInN0YXR1c1RleHQiLCJkYXRhIiwiQXJyYXlCdWZmZXIiLCJ1cmwiLCJDcnlwdG9KUyIsInNvY2tzQWdlbnQiLCJodHRwQWdlbnQiLCJzdGFydHNXaXRoIiwiaHR0cHNBZ2VudCIsImdlbmVyYXRlQ25vbmNlIiwiY2hhcmFjdGVycyIsInRva2VuIiwiaSIsInJhbmROdW0iLCJyb3VuZCIsInJhbmRvbSIsInNsaWNlIiwiY291bnQiLCJyZXNwb25zZVR5cGUiLCJwcm94eSIsInRyYW5zZm9ybVJlc3BvbnNlIiwicmVzIiwiYWRhcHRlciIsImF1dGhIZWFkZXIiLCJyZXBsYWNlIiwiYXV0aEhlYWRlck1hcCIsInJlcGxhY2VBbGwiLCJzcGxpdCIsInJlZHVjZSIsInByZXYiLCJjdXJyIiwiam9pbiIsImNub25jZSIsIkhBMSIsIk1ENSIsInJlYWxtIiwidG9TdHJpbmciLCJIQTIiLCJub25jZSIsInFvcCIsImRpZ2VzdEF1dGhIZWFkZXIiLCJvcGFxdWUiLCJmaW5hbFJlc3BvbnNlIiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9jb21tb24vSHR0cENsaWVudC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4vR2VuVXRpbHNcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgVGhyZWFkUG9vbCBmcm9tIFwiLi9UaHJlYWRQb29sXCI7XG5pbXBvcnQgUHJvbWlzZVRocm90dGxlIGZyb20gXCJwcm9taXNlLXRocm90dGxlXCI7XG5pbXBvcnQgaHR0cCBmcm9tIFwiaHR0cFwiO1xuaW1wb3J0IGh0dHBzIGZyb20gXCJodHRwc1wiO1xuaW1wb3J0IGF4aW9zLCB7IEF4aW9zRXJyb3IgfSBmcm9tIFwiYXhpb3NcIjtcblxuLyoqXG4gKiBIYW5kbGUgSFRUUCByZXF1ZXN0cyB3aXRoIGEgdW5pZm9ybSBpbnRlcmZhY2UuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEh0dHBDbGllbnQge1xuXG4gIHN0YXRpYyBNQVhfUkVRVUVTVFNfUEVSX1NFQ09ORCA9IDUwO1xuXG4gIC8vIGRlZmF1bHQgcmVxdWVzdCBjb25maWdcbiAgcHJvdGVjdGVkIHN0YXRpYyBERUZBVUxUX1JFUVVFU1QgPSB7XG4gICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgIHJlc29sdmVXaXRoRnVsbFJlc3BvbnNlOiBmYWxzZSxcbiAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHRydWVcbiAgfVxuXG4gIC8vIHJhdGUgbGltaXQgcmVxdWVzdHMgcGVyIGhvc3RcbiAgcHJvdGVjdGVkIHN0YXRpYyBQUk9NSVNFX1RIUk9UVExFUyA9IFtdO1xuICBwcm90ZWN0ZWQgc3RhdGljIFRBU0tfUVVFVUVTID0gW107XG4gIHByb3RlY3RlZCBzdGF0aWMgQ09OTkVDVF9USU1FT1VUID0gMTgwMDAwOyAvLyBtcyB0byBlc3RhYmxpc2ggYSBjb25uZWN0aW9uLCBtYXRjaGluZyBtb25lcm8tamF2YSdzIGRlZmF1bHQgKDAgdG8gZGlzYWJsZSlcbiAgcHJvdGVjdGVkIHN0YXRpYyBSRUFEX1RJTUVPVVQgPSAxODAwMDA7IC8vIG1zIG9mIHNvY2tldCBpbmFjdGl2aXR5IGJlZm9yZSB0aW1pbmcgb3V0XG5cbiAgcHJvdGVjdGVkIHN0YXRpYyBIVFRQX0FHRU5UOiBhbnk7XG4gIHByb3RlY3RlZCBzdGF0aWMgSFRUUFNfQUdFTlQ6IGFueTtcbiAgcHJvdGVjdGVkIHN0YXRpYyBTT0NLU19BR0VOVFM6IGFueSA9IHt9OyAvLyBzaGFyZWQgc29ja3MgYWdlbnRzIGtleWVkIGJ5IHByb3h5IHVyaSBhbmQgc3NsIGNvbmZpZ1xuXG4gIC8qKlxuICAgKiA8cD5NYWtlIGEgSFRUUCByZXF1ZXN0LjxwPlxuICAgKiBcbiAgICogQHBhcmFtIHtvYmplY3R9IHJlcXVlc3QgLSBjb25maWd1cmVzIHRoZSByZXF1ZXN0IHRvIG1ha2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlcXVlc3QubWV0aG9kIC0gSFRUUCBtZXRob2QgKFwiR0VUXCIsIFwiUFVUXCIsIFwiUE9TVFwiLCBcIkRFTEVURVwiLCBldGMpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZXF1ZXN0LnVyaSAtIHVyaSB0byByZXF1ZXN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfFVpbnQ4QXJyYXl8b2JqZWN0fSByZXF1ZXN0LmJvZHkgLSByZXF1ZXN0IGJvZHlcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtyZXF1ZXN0LnVzZXJuYW1lXSAtIHVzZXJuYW1lIHRvIGF1dGhlbnRpY2F0ZSB0aGUgcmVxdWVzdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcmVxdWVzdC5wYXNzd29yZF0gLSBwYXNzd29yZCB0byBhdXRoZW50aWNhdGUgdGhlIHJlcXVlc3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge29iamVjdH0gW3JlcXVlc3QuaGVhZGVyc10gLSBoZWFkZXJzIHRvIGFkZCB0byB0aGUgcmVxdWVzdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcmVxdWVzdC5wcm94eVVyaV0gLSBwcm94eSB0aGUgcmVxdWVzdCB0aHJvdWdoIGEgU09DS1M1IHNlcnZlciwgZS5nLiBhIGxvY2FsIFRvciBwcm94eSAoTm9kZS5qcyBvbmx5LCBvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcmVxdWVzdC5yZXNvbHZlV2l0aEZ1bGxSZXNwb25zZV0gLSByZXR1cm4gZnVsbCByZXNwb25zZSBpZiB0cnVlLCBlbHNlIGJvZHkgb25seSAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHBhcmFtIHtib29sZWFufSBbcmVxdWVzdC5yZWplY3RVbmF1dGhvcml6ZWRdIC0gd2hldGhlciBvciBub3QgdG8gcmVqZWN0IHNlbGYtc2lnbmVkIGNlcnRpZmljYXRlcyAoZGVmYXVsdCB0cnVlKVxuICAgKiBAcGFyYW0ge29iamVjdH0gW3JlcXVlc3QuY2FuY2VsVG9rZW5dIC0gdG9rZW4gdG8gY2FuY2VsIGEgcXVldWVkIG9yIGFjdGl2ZSByZXF1ZXN0IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IHJlcXVlc3QudGltZW91dCAtIG1heGltdW0gdGltZSBhbGxvd2VkIGluIG1pbGxpc2Vjb25kc1xuICAgKiBAcGFyYW0ge251bWJlcn0gcmVxdWVzdC5wcm94eVRvV29ya2VyIC0gcHJveHkgcmVxdWVzdCB0byB3b3JrZXIgdGhyZWFkXG4gICAqIEByZXR1cm4ge29iamVjdH0gcmVzcG9uc2UgLSB0aGUgcmVzcG9uc2Ugb2JqZWN0XG4gICAqIEByZXR1cm4ge3N0cmluZ3xVaW50OEFycmF5fG9iamVjdH0gcmVzcG9uc2UuYm9keSAtIHRoZSByZXNwb25zZSBib2R5XG4gICAqIEByZXR1cm4ge251bWJlcn0gcmVzcG9uc2Uuc3RhdHVzQ29kZSAtIHRoZSByZXNwb25zZSBjb2RlXG4gICAqIEByZXR1cm4ge1N0cmluZ30gcmVzcG9uc2Uuc3RhdHVzVGV4dCAtIHRoZSByZXNwb25zZSBtZXNzYWdlXG4gICAqIEByZXR1cm4ge29iamVjdH0gcmVzcG9uc2UuaGVhZGVycyAtIHRoZSByZXNwb25zZSBoZWFkZXJzXG4gICAqL1xuICBzdGF0aWMgYXN5bmMgcmVxdWVzdChyZXF1ZXN0KSB7XG4gICAgLy8gcHJveHkgdG8gd29ya2VyIGlmIGNvbmZpZ3VyZWRcbiAgICBpZiAocmVxdWVzdC5wcm94eVRvV29ya2VyKSB7XG4gICAgICB0cnkge1xuICAgICAgICByZXR1cm4gYXdhaXQgTGlicmFyeVV0aWxzLmludm9rZVdvcmtlcih1bmRlZmluZWQsIFwiaHR0cFJlcXVlc3RcIiwgcmVxdWVzdCk7XG4gICAgICB9IGNhdGNoIChlcnI6IGFueSkge1xuICAgICAgICBpZiAoZXJyLm1lc3NhZ2UubGVuZ3RoID4gMCAmJiBlcnIubWVzc2FnZS5jaGFyQXQoMCkgPT09IFwie1wiKSB7XG4gICAgICAgICAgbGV0IHBhcnNlZCA9IEpTT04ucGFyc2UoZXJyLm1lc3NhZ2UpO1xuICAgICAgICAgIGVyci5tZXNzYWdlID0gcGFyc2VkLnN0YXR1c01lc3NhZ2U7XG4gICAgICAgICAgZXJyLnN0YXR1c0NvZGUgPSBwYXJzZWQuc3RhdHVzQ29kZTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBlcnI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gYXNzaWduIGRlZmF1bHRzXG4gICAgcmVxdWVzdCA9IE9iamVjdC5hc3NpZ24oe30sIEh0dHBDbGllbnQuREVGQVVMVF9SRVFVRVNULCByZXF1ZXN0KTtcblxuICAgIC8vIHZhbGlkYXRlIHJlcXVlc3RcbiAgICB0cnkgeyByZXF1ZXN0Lmhvc3QgPSBuZXcgVVJMKHJlcXVlc3QudXJpKS5ob3N0OyB9IC8vIGhvc3RuYW1lOnBvcnRcbiAgICBjYXRjaCAoZXJyKSB7IHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgcmVxdWVzdCBVUkw6IFwiICsgcmVxdWVzdC51cmkpOyB9XG4gICAgaWYgKHJlcXVlc3QuYm9keSAmJiAhKHR5cGVvZiByZXF1ZXN0LmJvZHkgPT09IFwic3RyaW5nXCIgfHwgdHlwZW9mIHJlcXVlc3QuYm9keSA9PT0gXCJvYmplY3RcIikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlJlcXVlc3QgYm9keSB0eXBlIGlzIG5vdCBzdHJpbmcgb3Igb2JqZWN0XCIpO1xuICAgIH1cblxuICAgIC8vIGluaXRpYWxpemUgb25lIHRhc2sgcXVldWUgcGVyIGhvc3RcbiAgICBpZiAoIUh0dHBDbGllbnQuVEFTS19RVUVVRVNbcmVxdWVzdC5ob3N0XSkgSHR0cENsaWVudC5UQVNLX1FVRVVFU1tyZXF1ZXN0Lmhvc3RdID0gbmV3IFRocmVhZFBvb2woMSk7XG5cbiAgICAvLyBpbml0aWFsaXplIG9uZSBwcm9taXNlIHRocm90dGxlIHBlciBob3N0XG4gICAgaWYgKCFIdHRwQ2xpZW50LlBST01JU0VfVEhST1RUTEVTW3JlcXVlc3QuaG9zdF0pIHtcbiAgICAgIEh0dHBDbGllbnQuUFJPTUlTRV9USFJPVFRMRVNbcmVxdWVzdC5ob3N0XSA9IG5ldyBQcm9taXNlVGhyb3R0bGUoe1xuICAgICAgICByZXF1ZXN0c1BlclNlY29uZDogSHR0cENsaWVudC5NQVhfUkVRVUVTVFNfUEVSX1NFQ09ORCwgLy8gVE9ETzogSHR0cENsaWVudCBzaG91bGQgbm90IGRlcGVuZCBvbiBNb25lcm9VdGlscyBmb3IgY29uZmlndXJhdGlvblxuICAgICAgICBwcm9taXNlSW1wbGVtZW50YXRpb246IFByb21pc2VcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIGNvbm5lY3Rpb24gYW5kIHJlc3BvbnNlIGluYWN0aXZpdHkgYXJlIGJvdW5kZWQgaW4gdGhlIGFnZW50c1xuICAgIGxldCByZXF1ZXN0UHJvbWlzZSA9IEh0dHBDbGllbnQucmVxdWVzdEF4aW9zKHJlcXVlc3QpO1xuICAgIHJldHVybiByZXF1ZXN0LnRpbWVvdXQgPyBHZW5VdGlscy5leGVjdXRlV2l0aFRpbWVvdXQocmVxdWVzdFByb21pc2UsIHJlcXVlc3QudGltZW91dCkgOiByZXF1ZXN0UHJvbWlzZTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGVDYW5jZWxUb2tlbigpIHtcbiAgICByZXR1cm4gYXhpb3MuQ2FuY2VsVG9rZW4uc291cmNlKCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cbiAgLyoqXG4gICAqIEdldCBhIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiBhbiBIVFRQIGNsaWVudCB0byBzaGFyZS5cbiAgICpcbiAgICogQHJldHVybiB7aHR0cC5BZ2VudH0gYSBzaGFyZWQgYWdlbnQgZm9yIG5ldHdvcmsgcmVxdWVzdHMgYW1vbmcgbGlicmFyeSBpbnN0YW5jZXNcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgZ2V0SHR0cEFnZW50KCkge1xuICAgIGlmICghSHR0cENsaWVudC5IVFRQX0FHRU5UKSBIdHRwQ2xpZW50LkhUVFBfQUdFTlQgPSBIdHRwQ2xpZW50LmFwcGx5VGltZW91dHMobmV3IGh0dHAuQWdlbnQoe1xuICAgICAga2VlcEFsaXZlOiB0cnVlLFxuICAgICAgZmFtaWx5OiA0IC8vIHVzZSBJUHY0XG4gICAgfSkpO1xuICAgIHJldHVybiBIdHRwQ2xpZW50LkhUVFBfQUdFTlQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgc2luZ2xldG9uIGluc3RhbmNlIG9mIGFuIEhUVFBTIGNsaWVudCB0byBzaGFyZS5cbiAgICpcbiAgICogQHJldHVybiB7aHR0cHMuQWdlbnR9IGEgc2hhcmVkIGFnZW50IGZvciBuZXR3b3JrIHJlcXVlc3RzIGFtb25nIGxpYnJhcnkgaW5zdGFuY2VzXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGdldEh0dHBzQWdlbnQoKSB7XG4gICAgaWYgKCFIdHRwQ2xpZW50LkhUVFBTX0FHRU5UKSBIdHRwQ2xpZW50LkhUVFBTX0FHRU5UID0gSHR0cENsaWVudC5hcHBseVRpbWVvdXRzKG5ldyBodHRwcy5BZ2VudCh7XG4gICAgICBrZWVwQWxpdmU6IHRydWUsXG4gICAgICBmYW1pbHk6IDQgLy8gdXNlIElQdjRcbiAgICB9KSk7XG4gICAgcmV0dXJuIEh0dHBDbGllbnQuSFRUUFNfQUdFTlQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgc2luZ2xldG9uIGFnZW50IHRvIHJvdXRlIHJlcXVlc3RzIHRocm91Z2ggYSBTT0NLUzUgcHJveHk7IGhvc3RuYW1lcyBhcmUgcmVzb2x2ZWQgYnkgdGhlIHByb3h5IHRvIGF2b2lkIEROUyBsZWFrcy5cbiAgICpcbiAgICogQHJldHVybiB7U29ja3NQcm94eUFnZW50fSBhIHNoYXJlZCBhZ2VudCBmb3IgdGhlIGdpdmVuIHByb3h5IGFuZCBzc2wgY29uZmlnXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGdldFNvY2tzQWdlbnQocHJveHlVcmk6IHN0cmluZywgcmVqZWN0VW5hdXRob3JpemVkOiBib29sZWFuKSB7XG4gICAgaWYgKEdlblV0aWxzLmlzQnJvd3NlcigpIHx8IEdlblV0aWxzLmlzRGVubygpKSB0aHJvdyBuZXcgRXJyb3IoXCJQcm94aWVkIHJlcXVlc3RzIGFyZSBvbmx5IHN1cHBvcnRlZCBpbiBOb2RlLmpzXCIpO1xuICAgIGNvbnN0IGtleSA9IHByb3h5VXJpICsgXCJfXCIgKyByZWplY3RVbmF1dGhvcml6ZWQ7XG4gICAgaWYgKCFIdHRwQ2xpZW50LlNPQ0tTX0FHRU5UU1trZXldKSB7XG4gICAgICBjb25zdCB7IFNvY2tzUHJveHlBZ2VudCB9ID0gcmVxdWlyZShcInNvY2tzLXByb3h5LWFnZW50XCIpO1xuICAgICAgY29uc3QgcGFyc2VkID0gbmV3IFVSTChHZW5VdGlscy5ub3JtYWxpemVVcmkocHJveHlVcmkpKTtcbiAgICAgIGNvbnN0IGF1dGggPSBwYXJzZWQudXNlcm5hbWUgPyBwYXJzZWQudXNlcm5hbWUgKyBcIjpcIiArIHBhcnNlZC5wYXNzd29yZCArIFwiQFwiIDogXCJcIjtcbiAgICAgIEh0dHBDbGllbnQuU09DS1NfQUdFTlRTW2tleV0gPSBuZXcgU29ja3NQcm94eUFnZW50KFwic29ja3M1aDovL1wiICsgYXV0aCArIHBhcnNlZC5ob3N0LCB7IC8vIHNvY2tzIGVzdGFibGlzaG1lbnQgYW5kIGluYWN0aXZpdHkgYXJlIGJvdW5kZWQgYnkgdGltZW91dFxuICAgICAgICBrZWVwQWxpdmU6IHRydWUsXG4gICAgICAgIHRpbWVvdXQ6IE1hdGgubWF4KEh0dHBDbGllbnQuQ09OTkVDVF9USU1FT1VULCBIdHRwQ2xpZW50LlJFQURfVElNRU9VVCksXG4gICAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogcmVqZWN0VW5hdXRob3JpemVkXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIEh0dHBDbGllbnQuU09DS1NfQUdFTlRTW2tleV07XG4gIH1cblxuICAvLyBib3VuZCB0aGUgd2hvbGUgcmVxdWVzdCB3aGVyZSBub2RlIGFnZW50IHNvY2tldCB0aW1lb3V0cyBkbyBub3QgYXBwbHlcbiAgcHJvdGVjdGVkIHN0YXRpYyBnZXROb25BZ2VudFRpbWVvdXQoKSB7XG4gICAgcmV0dXJuIEdlblV0aWxzLmlzQnJvd3NlcigpIHx8IEdlblV0aWxzLmlzRGVubygpID8gTWF0aC5tYXgoSHR0cENsaWVudC5DT05ORUNUX1RJTUVPVVQsIEh0dHBDbGllbnQuUkVBRF9USU1FT1VUKSA6IDA7XG4gIH1cblxuICAvLyBib3VuZCB0aGUgY29ubmVjdGlvbiBwaGFzZSBhbmQgc29ja2V0IGluYWN0aXZpdHlcbiAgcHJvdGVjdGVkIHN0YXRpYyBhcHBseVRpbWVvdXRzKGFnZW50OiBhbnkpIHtcbiAgICBpZiAodHlwZW9mIGFnZW50LmNyZWF0ZUNvbm5lY3Rpb24gIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGFnZW50OyAvLyBuby1vcCBpbiBicm93c2VyIHNoaW1zXG4gICAgY29uc3QgY3JlYXRlQ29ubmVjdGlvbiA9IGFnZW50LmNyZWF0ZUNvbm5lY3Rpb24uYmluZChhZ2VudCk7XG4gICAgYWdlbnQuY3JlYXRlQ29ubmVjdGlvbiA9IGZ1bmN0aW9uKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgICBjb25zdCBzb2NrZXQgPSBjcmVhdGVDb25uZWN0aW9uKG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICAgIGlmIChIdHRwQ2xpZW50LkNPTk5FQ1RfVElNRU9VVCA+IDApIHtcbiAgICAgICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHNvY2tldC5kZXN0cm95KG5ldyBFcnJvcihcIkNvbm5lY3Rpb24gdGltZWQgb3V0IGluIFwiICsgSHR0cENsaWVudC5DT05ORUNUX1RJTUVPVVQgKyBcIiBtc1wiKSksIEh0dHBDbGllbnQuQ09OTkVDVF9USU1FT1VUKTtcbiAgICAgICAgY29uc3QgY2xlYXJDb25uZWN0VGltZXIgPSAoKSA9PiBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICBzb2NrZXQub25jZShcImNvbm5lY3RcIiwgY2xlYXJDb25uZWN0VGltZXIpLm9uY2UoXCJzZWN1cmVDb25uZWN0XCIsIGNsZWFyQ29ubmVjdFRpbWVyKS5vbmNlKFwiZXJyb3JcIiwgY2xlYXJDb25uZWN0VGltZXIpLm9uY2UoXCJjbG9zZVwiLCBjbGVhckNvbm5lY3RUaW1lcik7XG4gICAgICB9XG4gICAgICBpZiAoSHR0cENsaWVudC5SRUFEX1RJTUVPVVQgPiAwKSBzb2NrZXQuc2V0VGltZW91dChIdHRwQ2xpZW50LlJFQURfVElNRU9VVCwgKCkgPT4gc29ja2V0LmRlc3Ryb3kobmV3IEVycm9yKFwiU29ja2V0IHRpbWVkIG91dCBhZnRlciBcIiArIEh0dHBDbGllbnQuUkVBRF9USU1FT1VUICsgXCIgbXMgb2YgaW5hY3Rpdml0eVwiKSkpO1xuICAgICAgcmV0dXJuIHNvY2tldDtcbiAgICB9O1xuICAgIHJldHVybiBhZ2VudDtcbiAgfVxuXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgcmVxdWVzdEF4aW9zKHJlcSkge1xuICAgIGlmIChyZXEuaGVhZGVycykgdGhyb3cgbmV3IEVycm9yKFwiQ3VzdG9tIGhlYWRlcnMgbm90IGltcGxlbWVudGVkIGluIFhIUiByZXF1ZXN0XCIpOyAgLy8gVE9ET1xuXG4gICAgLy8gY29sbGVjdCBwYXJhbXMgZnJvbSByZXF1ZXN0IHdoaWNoIGNoYW5nZSBvbiBhd2FpdFxuICAgIGNvbnN0IG1ldGhvZCA9IHJlcS5tZXRob2Q7XG4gICAgY29uc3QgdXJpID0gcmVxLnVyaTtcbiAgICBjb25zdCBob3N0ID0gcmVxLmhvc3Q7XG4gICAgY29uc3QgdXNlcm5hbWUgPSByZXEudXNlcm5hbWU7XG4gICAgY29uc3QgcGFzc3dvcmQgPSByZXEucGFzc3dvcmQ7XG4gICAgY29uc3QgYm9keSA9IHJlcS5ib2R5O1xuICAgIGNvbnN0IHByb3h5VXJpID0gcmVxLnByb3h5VXJpO1xuICAgIGNvbnN0IHJlamVjdFVuYXV0aG9yaXplZCA9IHJlcS5yZWplY3RVbmF1dGhvcml6ZWQ7XG4gICAgY29uc3QgaXNCaW5hcnkgPSBib2R5IGluc3RhbmNlb2YgVWludDhBcnJheTtcbiAgICBjb25zdCBjYW5jZWxUb2tlbiA9IHJlcS5jYW5jZWxUb2tlbjtcbiAgICBpZiAoY2FuY2VsVG9rZW4pIGNhbmNlbFRva2VuLnRocm93SWZSZXF1ZXN0ZWQoKTtcblxuICAgIC8vIHF1ZXVlIGFuZCB0aHJvdHRsZSByZXF1ZXN0cyB0byBleGVjdXRlIGluIHNlcmlhbCBhbmQgcmF0ZSBsaW1pdGVkIHBlciBob3N0XG4gICAgY29uc3QgcmVzcG9uc2UgPSBIdHRwQ2xpZW50LlRBU0tfUVVFVUVTW2hvc3RdLnN1Ym1pdChhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChjYW5jZWxUb2tlbikgY2FuY2VsVG9rZW4udGhyb3dJZlJlcXVlc3RlZCgpO1xuICAgICAgcmV0dXJuIEh0dHBDbGllbnQuUFJPTUlTRV9USFJPVFRMRVNbaG9zdF0uYWRkKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgICAgSHR0cENsaWVudC5heGlvc0RpZ2VzdEF1dGhSZXF1ZXN0KG1ldGhvZCwgdXJpLCB1c2VybmFtZSwgcGFzc3dvcmQsIGJvZHksIHByb3h5VXJpLCByZWplY3RVbmF1dGhvcml6ZWQsIGNhbmNlbFRva2VuKS50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyb3I6IEF4aW9zRXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChlcnJvci5yZXNwb25zZT8uc3RhdHVzKSByZXNvbHZlKGVycm9yLnJlc3BvbnNlKTtcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJSZXF1ZXN0IGZhaWxlZCB3aXRob3V0IHJlc3BvbnNlOiBcIiArIG1ldGhvZCArIFwiIFwiICsgdXJpICsgXCIgZHVlIHRvIHVuZGVybHlpbmcgZXJyb3I6XFxuXCIgKyBlcnJvci5tZXNzYWdlICsgXCJcXG5cIiArIGVycm9yLnN0YWNrKSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0pO1xuXG4gICAgLy8gcmVqZWN0IGNhbmNlbGxhdGlvbiBpbW1lZGlhdGVseSBldmVuIHdoZW4gcXVldWVkIGJlaGluZCBhbm90aGVyIHdhbGxldCdzIHJlcXVlc3RcbiAgICBsZXQgb25DYW5jZWw7XG4gICAgbGV0IHJlc3A7XG4gICAgdHJ5IHtcbiAgICAgIHJlc3AgPSBjYW5jZWxUb2tlbiA/IGF3YWl0IFByb21pc2UucmFjZShbcmVzcG9uc2UsIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgb25DYW5jZWwgPSByZWplY3Q7XG4gICAgICAgIGNhbmNlbFRva2VuLnN1YnNjcmliZShvbkNhbmNlbCk7XG4gICAgICB9KV0pIDogYXdhaXQgcmVzcG9uc2U7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGlmIChjYW5jZWxUb2tlbikgY2FuY2VsVG9rZW4udW5zdWJzY3JpYmUob25DYW5jZWwpO1xuICAgIH1cblxuICAgIC8vIG5vcm1hbGl6ZSByZXNwb25zZVxuICAgIGxldCBub3JtYWxpemVkUmVzcG9uc2U6IGFueSA9IHt9O1xuICAgIG5vcm1hbGl6ZWRSZXNwb25zZS5zdGF0dXNDb2RlID0gcmVzcC5zdGF0dXM7XG4gICAgbm9ybWFsaXplZFJlc3BvbnNlLnN0YXR1c1RleHQgPSByZXNwLnN0YXR1c1RleHQ7XG4gICAgbm9ybWFsaXplZFJlc3BvbnNlLmhlYWRlcnMgPSB7Li4ucmVzcC5oZWFkZXJzfTtcbiAgICBub3JtYWxpemVkUmVzcG9uc2UuYm9keSA9IGlzQmluYXJ5ID8gbmV3IFVpbnQ4QXJyYXkocmVzcC5kYXRhKSA6IHJlc3AuZGF0YTtcbiAgICBpZiAobm9ybWFsaXplZFJlc3BvbnNlLmJvZHkgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikgbm9ybWFsaXplZFJlc3BvbnNlLmJvZHkgPSBuZXcgVWludDhBcnJheShub3JtYWxpemVkUmVzcG9uc2UuYm9keSk7ICAvLyBoYW5kbGUgZW1wdHkgYmluYXJ5IHJlcXVlc3RcbiAgICByZXR1cm4gbm9ybWFsaXplZFJlc3BvbnNlO1xuICB9XG5cbiAgcHJvdGVjdGVkIHN0YXRpYyBheGlvc0RpZ2VzdEF1dGhSZXF1ZXN0ID0gYXN5bmMgZnVuY3Rpb24obWV0aG9kLCB1cmwsIHVzZXJuYW1lLCBwYXNzd29yZCwgYm9keSwgcHJveHlVcmk/LCByZWplY3RVbmF1dGhvcml6ZWQ/LCBjYW5jZWxUb2tlbj8pIHtcbiAgICBpZiAodHlwZW9mIENyeXB0b0pTID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcmVxdWlyZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIENyeXB0b0pTID0gcmVxdWlyZSgnY3J5cHRvLWpzJyk7XG4gICAgfVxuXG4gICAgLy8gcm91dGUgdGhyb3VnaCBzb2NrcyBwcm94eSBpZiBjb25maWd1cmVkLCBvdGhlcndpc2UgdXNlIGRpcmVjdCBhZ2VudHNcbiAgICBjb25zdCBzb2Nrc0FnZW50ID0gcHJveHlVcmkgPyBIdHRwQ2xpZW50LmdldFNvY2tzQWdlbnQocHJveHlVcmksIHJlamVjdFVuYXV0aG9yaXplZCAhPT0gZmFsc2UpIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IGh0dHBBZ2VudCA9IHNvY2tzQWdlbnQgPz8gKHVybC5zdGFydHNXaXRoKFwiaHR0cHNcIikgPyB1bmRlZmluZWQgOiBIdHRwQ2xpZW50LmdldEh0dHBBZ2VudCgpKTtcbiAgICBjb25zdCBodHRwc0FnZW50ID0gc29ja3NBZ2VudCA/PyAodXJsLnN0YXJ0c1dpdGgoXCJodHRwc1wiKSA/IEh0dHBDbGllbnQuZ2V0SHR0cHNBZ2VudCgpIDogdW5kZWZpbmVkKTtcblxuICAgIGNvbnN0IGdlbmVyYXRlQ25vbmNlID0gZnVuY3Rpb24oKTogc3RyaW5nIHtcbiAgICAgIGNvbnN0IGNoYXJhY3RlcnMgPSAnYWJjZGVmMDEyMzQ1Njc4OSc7XG4gICAgICBsZXQgdG9rZW4gPSAnJztcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgICAgICBjb25zdCByYW5kTnVtID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogY2hhcmFjdGVycy5sZW5ndGgpO1xuICAgICAgICB0b2tlbiArPSBjaGFyYWN0ZXJzLnNsaWNlKHJhbmROdW0sIHJhbmROdW0rMSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdG9rZW47XG4gICAgfVxuXG4gICAgbGV0IGNvdW50ID0gMDtcbiAgICByZXR1cm4gYXhpb3MucmVxdWVzdCh7XG4gICAgICB1cmw6IHVybCxcbiAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICB9LFxuICAgICAgcmVzcG9uc2VUeXBlOiBib2R5IGluc3RhbmNlb2YgVWludDhBcnJheSA/ICdhcnJheWJ1ZmZlcicgOiB1bmRlZmluZWQsXG4gICAgICBodHRwQWdlbnQ6IGh0dHBBZ2VudCxcbiAgICAgIGh0dHBzQWdlbnQ6IGh0dHBzQWdlbnQsXG4gICAgICBwcm94eTogc29ja3NBZ2VudCA/IGZhbHNlIDogdW5kZWZpbmVkLCAvLyBlbnYgcHJveGllcyBtdXN0IG5vdCBieXBhc3MgdGhlIHNvY2tzIGFnZW50XG4gICAgICB0aW1lb3V0OiBIdHRwQ2xpZW50LmdldE5vbkFnZW50VGltZW91dCgpLFxuICAgICAgY2FuY2VsVG9rZW46IGNhbmNlbFRva2VuLFxuICAgICAgZGF0YTogYm9keSxcbiAgICAgIHRyYW5zZm9ybVJlc3BvbnNlOiByZXMgPT4gcmVzLFxuICAgICAgYWRhcHRlcjogR2VuVXRpbHMuaXNEZW5vKCkgPyBbJ2ZldGNoJ10gOiBbJ2h0dHAnLCAneGhyJywgJ2ZldGNoJ11cbiAgICB9KS5jYXRjaChhc3luYyAoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyLnJlc3BvbnNlPy5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICBsZXQgYXV0aEhlYWRlciA9IGVyci5yZXNwb25zZS5oZWFkZXJzWyd3d3ctYXV0aGVudGljYXRlJ10ucmVwbGFjZSgvLFxcc0RpZ2VzdC4qLywgXCJcIik7XG4gICAgICAgIGlmICghYXV0aEhlYWRlcikge1xuICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERpZ2VzdCBxb3A9XCJhdXRoXCIsYWxnb3JpdGhtPU1ENSxyZWFsbT1cIm1vbmVyby1ycGNcIixub25jZT1cImhCWjJyWkl4RWx2NGxxQ1JyVXlsWEE9PVwiLHN0YWxlPWZhbHNlXG4gICAgICAgIGNvbnN0IGF1dGhIZWFkZXJNYXAgPSBhdXRoSGVhZGVyLnJlcGxhY2UoXCJEaWdlc3QgXCIsIFwiXCIpLnJlcGxhY2VBbGwoJ1wiJywgXCJcIikuc3BsaXQoXCIsXCIpLnJlZHVjZSgocHJldiwgY3VycikgPT4gKHsuLi5wcmV2LCBbY3Vyci5zcGxpdChcIj1cIilbMF1dOiBjdXJyLnNwbGl0KFwiPVwiKS5zbGljZSgxKS5qb2luKCc9Jyl9KSwge30pXG5cbiAgICAgICAgKytjb3VudDtcblxuICAgICAgICBjb25zdCBjbm9uY2UgPSBnZW5lcmF0ZUNub25jZSgpO1xuICAgICAgICBjb25zdCBIQTEgPSBDcnlwdG9KUy5NRDUodXNlcm5hbWUrJzonK2F1dGhIZWFkZXJNYXAucmVhbG0rJzonK3Bhc3N3b3JkKS50b1N0cmluZygpO1xuICAgICAgICBjb25zdCBIQTIgPSBDcnlwdG9KUy5NRDUobWV0aG9kKyc6Jyt1cmwpLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBDcnlwdG9KUy5NRDUoSEExKyc6JytcbiAgICAgICAgICBhdXRoSGVhZGVyTWFwLm5vbmNlKyc6JytcbiAgICAgICAgICAoJzAwMDAwMDAwJyArIGNvdW50KS5zbGljZSgtOCkrJzonK1xuICAgICAgICAgIGNub25jZSsnOicrXG4gICAgICAgICAgYXV0aEhlYWRlck1hcC5xb3ArJzonK1xuICAgICAgICAgIEhBMikudG9TdHJpbmcoKTtcbiAgICAgICAgY29uc3QgZGlnZXN0QXV0aEhlYWRlciA9ICdEaWdlc3QnKycgJytcbiAgICAgICAgICAndXNlcm5hbWU9XCInK3VzZXJuYW1lKydcIiwgJytcbiAgICAgICAgICAncmVhbG09XCInK2F1dGhIZWFkZXJNYXAucmVhbG0rJ1wiLCAnK1xuICAgICAgICAgICdub25jZT1cIicrYXV0aEhlYWRlck1hcC5ub25jZSsnXCIsICcrXG4gICAgICAgICAgJ3VyaT1cIicrdXJsKydcIiwgJytcbiAgICAgICAgICAncmVzcG9uc2U9XCInK3Jlc3BvbnNlKydcIiwgJytcbiAgICAgICAgICAnb3BhcXVlPVwiJysoYXV0aEhlYWRlck1hcC5vcGFxdWUgPz8gbnVsbCkrJ1wiLCAnK1xuICAgICAgICAgICdxb3A9JythdXRoSGVhZGVyTWFwLnFvcCsnLCAnK1xuICAgICAgICAgICduYz0nKygnMDAwMDAwMDAnICsgY291bnQpLnNsaWNlKC04KSsnLCAnK1xuICAgICAgICAgICdjbm9uY2U9XCInK2Nub25jZSsnXCInO1xuXG4gICAgICAgIGNvbnN0IGZpbmFsUmVzcG9uc2UgPSBhd2FpdCBheGlvcy5yZXF1ZXN0KHtcbiAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6IGRpZ2VzdEF1dGhIZWFkZXIsXG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgICAgfSxcbiAgICAgICAgICByZXNwb25zZVR5cGU6IGJvZHkgaW5zdGFuY2VvZiBVaW50OEFycmF5ID8gJ2FycmF5YnVmZmVyJyA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBodHRwQWdlbnQ6IHVybC5zdGFydHNXaXRoKFwiaHR0cHNcIikgPyB1bmRlZmluZWQgOiBIdHRwQ2xpZW50LmdldEh0dHBBZ2VudCgpLFxuICAgICAgICAgIGh0dHBzQWdlbnQ6IHVybC5zdGFydHNXaXRoKFwiaHR0cHNcIikgPyBIdHRwQ2xpZW50LmdldEh0dHBzQWdlbnQoKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB0aW1lb3V0OiBIdHRwQ2xpZW50LmdldE5vbkFnZW50VGltZW91dCgpLFxuICAgICAgICAgIGNhbmNlbFRva2VuOiBjYW5jZWxUb2tlbixcbiAgICAgICAgICBkYXRhOiBib2R5LFxuICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlOiByZXMgPT4gcmVzLFxuICAgICAgICAgIGFkYXB0ZXI6IEdlblV0aWxzLmlzRGVubygpID8gWydmZXRjaCddIDogWydodHRwJywgJ3hocicsICdmZXRjaCddXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmaW5hbFJlc3BvbnNlO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyO1xuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfSk7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLFNBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLGFBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FB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