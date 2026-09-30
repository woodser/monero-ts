"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _GenUtils = _interopRequireDefault(require("./GenUtils"));
var _LibraryUtils = _interopRequireDefault(require("./LibraryUtils"));
var _ThreadPool = _interopRequireDefault(require("./ThreadPool"));
var _http = _interopRequireDefault(require("http"));
var _https = _interopRequireDefault(require("https"));
var _axios = _interopRequireDefault(require("axios"));

/**
 * Handle HTTP requests with a uniform interface.
 */
class HttpClient {

  static MAX_REQUESTS_PER_SECOND = 50; // positive requests per second, or Infinity to disable throttling

  // default request config
  static DEFAULT_REQUEST = {
    method: "GET",
    resolveWithFullResponse: false,
    rejectUnauthorized: true
  };

  // rate limit requests per host
  static REQUEST_START_TIMES = []; // recent request start times per host
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

    // initialize one rate limit window per host
    if (!HttpClient.REQUEST_START_TIMES[request.host]) HttpClient.REQUEST_START_TIMES[request.host] = [];

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

  // defer only when a host exceeds the rate limit since browsers throttle timers in background tabs
  static async awaitRateLimit(host) {
    const rate = HttpClient.MAX_REQUESTS_PER_SECOND;
    if (!(rate > 0)) throw new Error("Max requests per second must be greater than 0 or Infinity");
    const startTimes = HttpClient.REQUEST_START_TIMES[host];
    if (rate === Infinity) {
      startTimes.length = 0;
      return;
    }

    // allow whole requests per window, extending the window to preserve fractional limits
    const maxRequests = Math.ceil(rate);
    const windowMs = 1000 * maxRequests / rate;
    while (startTimes.length > 0 && startTimes[0] + windowMs <= Date.now()) startTimes.shift(); // bound history to the current window
    while (startTimes.length >= maxRequests) {
      const waitMs = Math.ceil(startTimes[0] + windowMs - Date.now());
      if (waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));else
      startTimes.shift();
    }
    startTimes.push(Date.now());
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
      await HttpClient.awaitRateLimit(host);
      return new Promise(function (resolve, reject) {
        HttpClient.axiosDigestAuthRequest(method, uri, username, password, body, proxyUri, rejectUnauthorized, cancelToken).then(function (resp) {
          resolve(resp);
        }).catch(function (error) {
          if (error.response?.status) resolve(error.response);
          reject(new Error("Request failed without response: " + method + " " + uri + " due to underlying error:\n" + error.message + "\n" + error.stack));
        });
      });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9MaWJyYXJ5VXRpbHMiLCJfVGhyZWFkUG9vbCIsIl9odHRwIiwiX2h0dHBzIiwiX2F4aW9zIiwiSHR0cENsaWVudCIsIk1BWF9SRVFVRVNUU19QRVJfU0VDT05EIiwiREVGQVVMVF9SRVFVRVNUIiwibWV0aG9kIiwicmVzb2x2ZVdpdGhGdWxsUmVzcG9uc2UiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJSRVFVRVNUX1NUQVJUX1RJTUVTIiwiVEFTS19RVUVVRVMiLCJDT05ORUNUX1RJTUVPVVQiLCJSRUFEX1RJTUVPVVQiLCJTT0NLU19BR0VOVFMiLCJyZXF1ZXN0IiwicHJveHlUb1dvcmtlciIsIkxpYnJhcnlVdGlscyIsImludm9rZVdvcmtlciIsInVuZGVmaW5lZCIsImVyciIsIm1lc3NhZ2UiLCJsZW5ndGgiLCJjaGFyQXQiLCJwYXJzZWQiLCJKU09OIiwicGFyc2UiLCJzdGF0dXNNZXNzYWdlIiwic3RhdHVzQ29kZSIsIk9iamVjdCIsImFzc2lnbiIsImhvc3QiLCJVUkwiLCJ1cmkiLCJFcnJvciIsImJvZHkiLCJUaHJlYWRQb29sIiwicmVxdWVzdFByb21pc2UiLCJyZXF1ZXN0QXhpb3MiLCJ0aW1lb3V0IiwiR2VuVXRpbHMiLCJleGVjdXRlV2l0aFRpbWVvdXQiLCJjcmVhdGVDYW5jZWxUb2tlbiIsImF4aW9zIiwiQ2FuY2VsVG9rZW4iLCJzb3VyY2UiLCJnZXRIdHRwQWdlbnQiLCJIVFRQX0FHRU5UIiwiYXBwbHlUaW1lb3V0cyIsImh0dHAiLCJBZ2VudCIsImtlZXBBbGl2ZSIsImZhbWlseSIsImdldEh0dHBzQWdlbnQiLCJIVFRQU19BR0VOVCIsImh0dHBzIiwiZ2V0U29ja3NBZ2VudCIsInByb3h5VXJpIiwiaXNCcm93c2VyIiwiaXNEZW5vIiwia2V5IiwiU29ja3NQcm94eUFnZW50Iiwibm9ybWFsaXplVXJpIiwiYXV0aCIsInVzZXJuYW1lIiwicGFzc3dvcmQiLCJNYXRoIiwibWF4IiwiZ2V0Tm9uQWdlbnRUaW1lb3V0IiwiYWdlbnQiLCJjcmVhdGVDb25uZWN0aW9uIiwiYmluZCIsIm9wdGlvbnMiLCJjYWxsYmFjayIsInNvY2tldCIsInRpbWVyIiwic2V0VGltZW91dCIsImRlc3Ryb3kiLCJjbGVhckNvbm5lY3RUaW1lciIsImNsZWFyVGltZW91dCIsIm9uY2UiLCJhd2FpdFJhdGVMaW1pdCIsInJhdGUiLCJzdGFydFRpbWVzIiwiSW5maW5pdHkiLCJtYXhSZXF1ZXN0cyIsImNlaWwiLCJ3aW5kb3dNcyIsIkRhdGUiLCJub3ciLCJzaGlmdCIsIndhaXRNcyIsIlByb21pc2UiLCJyZXNvbHZlIiwicHVzaCIsInJlcSIsImhlYWRlcnMiLCJpc0JpbmFyeSIsIlVpbnQ4QXJyYXkiLCJjYW5jZWxUb2tlbiIsInRocm93SWZSZXF1ZXN0ZWQiLCJyZXNwb25zZSIsInN1Ym1pdCIsInJlamVjdCIsImF4aW9zRGlnZXN0QXV0aFJlcXVlc3QiLCJ0aGVuIiwicmVzcCIsImNhdGNoIiwiZXJyb3IiLCJzdGF0dXMiLCJzdGFjayIsIm9uQ2FuY2VsIiwicmFjZSIsInN1YnNjcmliZSIsInVuc3Vic2NyaWJlIiwibm9ybWFsaXplZFJlc3BvbnNlIiwic3RhdHVzVGV4dCIsImRhdGEiLCJBcnJheUJ1ZmZlciIsInVybCIsIkNyeXB0b0pTIiwic29ja3NBZ2VudCIsImh0dHBBZ2VudCIsInN0YXJ0c1dpdGgiLCJodHRwc0FnZW50IiwiZ2VuZXJhdGVDbm9uY2UiLCJjaGFyYWN0ZXJzIiwidG9rZW4iLCJpIiwicmFuZE51bSIsInJvdW5kIiwicmFuZG9tIiwic2xpY2UiLCJjb3VudCIsInJlc3BvbnNlVHlwZSIsInByb3h5IiwidHJhbnNmb3JtUmVzcG9uc2UiLCJyZXMiLCJhZGFwdGVyIiwiYXV0aEhlYWRlciIsInJlcGxhY2UiLCJhdXRoSGVhZGVyTWFwIiwicmVwbGFjZUFsbCIsInNwbGl0IiwicmVkdWNlIiwicHJldiIsImN1cnIiLCJqb2luIiwiY25vbmNlIiwiSEExIiwiTUQ1IiwicmVhbG0iLCJ0b1N0cmluZyIsIkhBMiIsIm5vbmNlIiwicW9wIiwiZGlnZXN0QXV0aEhlYWRlciIsIm9wYXF1ZSIsImZpbmFsUmVzcG9uc2UiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL2NvbW1vbi9IdHRwQ2xpZW50LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi9HZW5VdGlsc1wiO1xuaW1wb3J0IExpYnJhcnlVdGlscyBmcm9tIFwiLi9MaWJyYXJ5VXRpbHNcIjtcbmltcG9ydCBUaHJlYWRQb29sIGZyb20gXCIuL1RocmVhZFBvb2xcIjtcbmltcG9ydCBodHRwIGZyb20gXCJodHRwXCI7XG5pbXBvcnQgaHR0cHMgZnJvbSBcImh0dHBzXCI7XG5pbXBvcnQgYXhpb3MsIHsgQXhpb3NFcnJvciB9IGZyb20gXCJheGlvc1wiO1xuXG4vKipcbiAqIEhhbmRsZSBIVFRQIHJlcXVlc3RzIHdpdGggYSB1bmlmb3JtIGludGVyZmFjZS5cbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgSHR0cENsaWVudCB7XG5cbiAgc3RhdGljIE1BWF9SRVFVRVNUU19QRVJfU0VDT05EID0gNTA7IC8vIHBvc2l0aXZlIHJlcXVlc3RzIHBlciBzZWNvbmQsIG9yIEluZmluaXR5IHRvIGRpc2FibGUgdGhyb3R0bGluZ1xuXG4gIC8vIGRlZmF1bHQgcmVxdWVzdCBjb25maWdcbiAgcHJvdGVjdGVkIHN0YXRpYyBERUZBVUxUX1JFUVVFU1QgPSB7XG4gICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgIHJlc29sdmVXaXRoRnVsbFJlc3BvbnNlOiBmYWxzZSxcbiAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHRydWVcbiAgfVxuXG4gIC8vIHJhdGUgbGltaXQgcmVxdWVzdHMgcGVyIGhvc3RcbiAgcHJvdGVjdGVkIHN0YXRpYyBSRVFVRVNUX1NUQVJUX1RJTUVTID0gW107IC8vIHJlY2VudCByZXF1ZXN0IHN0YXJ0IHRpbWVzIHBlciBob3N0XG4gIHByb3RlY3RlZCBzdGF0aWMgVEFTS19RVUVVRVMgPSBbXTtcbiAgcHJvdGVjdGVkIHN0YXRpYyBDT05ORUNUX1RJTUVPVVQgPSAxODAwMDA7IC8vIG1zIHRvIGVzdGFibGlzaCBhIGNvbm5lY3Rpb24sIG1hdGNoaW5nIG1vbmVyby1qYXZhJ3MgZGVmYXVsdCAoMCB0byBkaXNhYmxlKVxuICBwcm90ZWN0ZWQgc3RhdGljIFJFQURfVElNRU9VVCA9IDE4MDAwMDsgLy8gbXMgb2Ygc29ja2V0IGluYWN0aXZpdHkgYmVmb3JlIHRpbWluZyBvdXRcblxuICBwcm90ZWN0ZWQgc3RhdGljIEhUVFBfQUdFTlQ6IGFueTtcbiAgcHJvdGVjdGVkIHN0YXRpYyBIVFRQU19BR0VOVDogYW55O1xuICBwcm90ZWN0ZWQgc3RhdGljIFNPQ0tTX0FHRU5UUzogYW55ID0ge307IC8vIHNoYXJlZCBzb2NrcyBhZ2VudHMga2V5ZWQgYnkgcHJveHkgdXJpIGFuZCBzc2wgY29uZmlnXG5cbiAgLyoqXG4gICAqIDxwPk1ha2UgYSBIVFRQIHJlcXVlc3QuPHA+XG4gICAqIFxuICAgKiBAcGFyYW0ge29iamVjdH0gcmVxdWVzdCAtIGNvbmZpZ3VyZXMgdGhlIHJlcXVlc3QgdG8gbWFrZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcmVxdWVzdC5tZXRob2QgLSBIVFRQIG1ldGhvZCAoXCJHRVRcIiwgXCJQVVRcIiwgXCJQT1NUXCIsIFwiREVMRVRFXCIsIGV0YylcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlcXVlc3QudXJpIC0gdXJpIHRvIHJlcXVlc3RcbiAgICogQHBhcmFtIHtzdHJpbmd8VWludDhBcnJheXxvYmplY3R9IHJlcXVlc3QuYm9keSAtIHJlcXVlc3QgYm9keVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3JlcXVlc3QudXNlcm5hbWVdIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHRoZSByZXF1ZXN0IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtyZXF1ZXN0LnBhc3N3b3JkXSAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB0aGUgcmVxdWVzdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBbcmVxdWVzdC5oZWFkZXJzXSAtIGhlYWRlcnMgdG8gYWRkIHRvIHRoZSByZXF1ZXN0IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtyZXF1ZXN0LnByb3h5VXJpXSAtIHByb3h5IHRoZSByZXF1ZXN0IHRocm91Z2ggYSBTT0NLUzUgc2VydmVyLCBlLmcuIGEgbG9jYWwgVG9yIHByb3h5IChOb2RlLmpzIG9ubHksIG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtyZXF1ZXN0LnJlc29sdmVXaXRoRnVsbFJlc3BvbnNlXSAtIHJldHVybiBmdWxsIHJlc3BvbnNlIGlmIHRydWUsIGVsc2UgYm9keSBvbmx5IChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtyZXF1ZXN0LnJlamVjdFVuYXV0aG9yaXplZF0gLSB3aGV0aGVyIG9yIG5vdCB0byByZWplY3Qgc2VsZi1zaWduZWQgY2VydGlmaWNhdGVzIChkZWZhdWx0IHRydWUpXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBbcmVxdWVzdC5jYW5jZWxUb2tlbl0gLSB0b2tlbiB0byBjYW5jZWwgYSBxdWV1ZWQgb3IgYWN0aXZlIHJlcXVlc3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gcmVxdWVzdC50aW1lb3V0IC0gbWF4aW11bSB0aW1lIGFsbG93ZWQgaW4gbWlsbGlzZWNvbmRzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByZXF1ZXN0LnByb3h5VG9Xb3JrZXIgLSBwcm94eSByZXF1ZXN0IHRvIHdvcmtlciB0aHJlYWRcbiAgICogQHJldHVybiB7b2JqZWN0fSByZXNwb25zZSAtIHRoZSByZXNwb25zZSBvYmplY3RcbiAgICogQHJldHVybiB7c3RyaW5nfFVpbnQ4QXJyYXl8b2JqZWN0fSByZXNwb25zZS5ib2R5IC0gdGhlIHJlc3BvbnNlIGJvZHlcbiAgICogQHJldHVybiB7bnVtYmVyfSByZXNwb25zZS5zdGF0dXNDb2RlIC0gdGhlIHJlc3BvbnNlIGNvZGVcbiAgICogQHJldHVybiB7U3RyaW5nfSByZXNwb25zZS5zdGF0dXNUZXh0IC0gdGhlIHJlc3BvbnNlIG1lc3NhZ2VcbiAgICogQHJldHVybiB7b2JqZWN0fSByZXNwb25zZS5oZWFkZXJzIC0gdGhlIHJlc3BvbnNlIGhlYWRlcnNcbiAgICovXG4gIHN0YXRpYyBhc3luYyByZXF1ZXN0KHJlcXVlc3QpIHtcbiAgICAvLyBwcm94eSB0byB3b3JrZXIgaWYgY29uZmlndXJlZFxuICAgIGlmIChyZXF1ZXN0LnByb3h5VG9Xb3JrZXIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHVuZGVmaW5lZCwgXCJodHRwUmVxdWVzdFwiLCByZXF1ZXN0KTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIGlmIChlcnIubWVzc2FnZS5sZW5ndGggPiAwICYmIGVyci5tZXNzYWdlLmNoYXJBdCgwKSA9PT0gXCJ7XCIpIHtcbiAgICAgICAgICBsZXQgcGFyc2VkID0gSlNPTi5wYXJzZShlcnIubWVzc2FnZSk7XG4gICAgICAgICAgZXJyLm1lc3NhZ2UgPSBwYXJzZWQuc3RhdHVzTWVzc2FnZTtcbiAgICAgICAgICBlcnIuc3RhdHVzQ29kZSA9IHBhcnNlZC5zdGF0dXNDb2RlO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBhc3NpZ24gZGVmYXVsdHNcbiAgICByZXF1ZXN0ID0gT2JqZWN0LmFzc2lnbih7fSwgSHR0cENsaWVudC5ERUZBVUxUX1JFUVVFU1QsIHJlcXVlc3QpO1xuXG4gICAgLy8gdmFsaWRhdGUgcmVxdWVzdFxuICAgIHRyeSB7IHJlcXVlc3QuaG9zdCA9IG5ldyBVUkwocmVxdWVzdC51cmkpLmhvc3Q7IH0gLy8gaG9zdG5hbWU6cG9ydFxuICAgIGNhdGNoIChlcnIpIHsgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCByZXF1ZXN0IFVSTDogXCIgKyByZXF1ZXN0LnVyaSk7IH1cbiAgICBpZiAocmVxdWVzdC5ib2R5ICYmICEodHlwZW9mIHJlcXVlc3QuYm9keSA9PT0gXCJzdHJpbmdcIiB8fCB0eXBlb2YgcmVxdWVzdC5ib2R5ID09PSBcIm9iamVjdFwiKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmVxdWVzdCBib2R5IHR5cGUgaXMgbm90IHN0cmluZyBvciBvYmplY3RcIik7XG4gICAgfVxuXG4gICAgLy8gaW5pdGlhbGl6ZSBvbmUgdGFzayBxdWV1ZSBwZXIgaG9zdFxuICAgIGlmICghSHR0cENsaWVudC5UQVNLX1FVRVVFU1tyZXF1ZXN0Lmhvc3RdKSBIdHRwQ2xpZW50LlRBU0tfUVVFVUVTW3JlcXVlc3QuaG9zdF0gPSBuZXcgVGhyZWFkUG9vbCgxKTtcblxuICAgIC8vIGluaXRpYWxpemUgb25lIHJhdGUgbGltaXQgd2luZG93IHBlciBob3N0XG4gICAgaWYgKCFIdHRwQ2xpZW50LlJFUVVFU1RfU1RBUlRfVElNRVNbcmVxdWVzdC5ob3N0XSkgSHR0cENsaWVudC5SRVFVRVNUX1NUQVJUX1RJTUVTW3JlcXVlc3QuaG9zdF0gPSBbXTtcblxuICAgIC8vIGNvbm5lY3Rpb24gYW5kIHJlc3BvbnNlIGluYWN0aXZpdHkgYXJlIGJvdW5kZWQgaW4gdGhlIGFnZW50c1xuICAgIGxldCByZXF1ZXN0UHJvbWlzZSA9IEh0dHBDbGllbnQucmVxdWVzdEF4aW9zKHJlcXVlc3QpO1xuICAgIHJldHVybiByZXF1ZXN0LnRpbWVvdXQgPyBHZW5VdGlscy5leGVjdXRlV2l0aFRpbWVvdXQocmVxdWVzdFByb21pc2UsIHJlcXVlc3QudGltZW91dCkgOiByZXF1ZXN0UHJvbWlzZTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGVDYW5jZWxUb2tlbigpIHtcbiAgICByZXR1cm4gYXhpb3MuQ2FuY2VsVG9rZW4uc291cmNlKCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cbiAgLyoqXG4gICAqIEdldCBhIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiBhbiBIVFRQIGNsaWVudCB0byBzaGFyZS5cbiAgICpcbiAgICogQHJldHVybiB7aHR0cC5BZ2VudH0gYSBzaGFyZWQgYWdlbnQgZm9yIG5ldHdvcmsgcmVxdWVzdHMgYW1vbmcgbGlicmFyeSBpbnN0YW5jZXNcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgZ2V0SHR0cEFnZW50KCkge1xuICAgIGlmICghSHR0cENsaWVudC5IVFRQX0FHRU5UKSBIdHRwQ2xpZW50LkhUVFBfQUdFTlQgPSBIdHRwQ2xpZW50LmFwcGx5VGltZW91dHMobmV3IGh0dHAuQWdlbnQoe1xuICAgICAga2VlcEFsaXZlOiB0cnVlLFxuICAgICAgZmFtaWx5OiA0IC8vIHVzZSBJUHY0XG4gICAgfSkpO1xuICAgIHJldHVybiBIdHRwQ2xpZW50LkhUVFBfQUdFTlQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgc2luZ2xldG9uIGluc3RhbmNlIG9mIGFuIEhUVFBTIGNsaWVudCB0byBzaGFyZS5cbiAgICpcbiAgICogQHJldHVybiB7aHR0cHMuQWdlbnR9IGEgc2hhcmVkIGFnZW50IGZvciBuZXR3b3JrIHJlcXVlc3RzIGFtb25nIGxpYnJhcnkgaW5zdGFuY2VzXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGdldEh0dHBzQWdlbnQoKSB7XG4gICAgaWYgKCFIdHRwQ2xpZW50LkhUVFBTX0FHRU5UKSBIdHRwQ2xpZW50LkhUVFBTX0FHRU5UID0gSHR0cENsaWVudC5hcHBseVRpbWVvdXRzKG5ldyBodHRwcy5BZ2VudCh7XG4gICAgICBrZWVwQWxpdmU6IHRydWUsXG4gICAgICBmYW1pbHk6IDQgLy8gdXNlIElQdjRcbiAgICB9KSk7XG4gICAgcmV0dXJuIEh0dHBDbGllbnQuSFRUUFNfQUdFTlQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgc2luZ2xldG9uIGFnZW50IHRvIHJvdXRlIHJlcXVlc3RzIHRocm91Z2ggYSBTT0NLUzUgcHJveHk7IGhvc3RuYW1lcyBhcmUgcmVzb2x2ZWQgYnkgdGhlIHByb3h5IHRvIGF2b2lkIEROUyBsZWFrcy5cbiAgICpcbiAgICogQHJldHVybiB7U29ja3NQcm94eUFnZW50fSBhIHNoYXJlZCBhZ2VudCBmb3IgdGhlIGdpdmVuIHByb3h5IGFuZCBzc2wgY29uZmlnXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGdldFNvY2tzQWdlbnQocHJveHlVcmk6IHN0cmluZywgcmVqZWN0VW5hdXRob3JpemVkOiBib29sZWFuKSB7XG4gICAgaWYgKEdlblV0aWxzLmlzQnJvd3NlcigpIHx8IEdlblV0aWxzLmlzRGVubygpKSB0aHJvdyBuZXcgRXJyb3IoXCJQcm94aWVkIHJlcXVlc3RzIGFyZSBvbmx5IHN1cHBvcnRlZCBpbiBOb2RlLmpzXCIpO1xuICAgIGNvbnN0IGtleSA9IHByb3h5VXJpICsgXCJfXCIgKyByZWplY3RVbmF1dGhvcml6ZWQ7XG4gICAgaWYgKCFIdHRwQ2xpZW50LlNPQ0tTX0FHRU5UU1trZXldKSB7XG4gICAgICBjb25zdCB7IFNvY2tzUHJveHlBZ2VudCB9ID0gcmVxdWlyZShcInNvY2tzLXByb3h5LWFnZW50XCIpO1xuICAgICAgY29uc3QgcGFyc2VkID0gbmV3IFVSTChHZW5VdGlscy5ub3JtYWxpemVVcmkocHJveHlVcmkpKTtcbiAgICAgIGNvbnN0IGF1dGggPSBwYXJzZWQudXNlcm5hbWUgPyBwYXJzZWQudXNlcm5hbWUgKyBcIjpcIiArIHBhcnNlZC5wYXNzd29yZCArIFwiQFwiIDogXCJcIjtcbiAgICAgIEh0dHBDbGllbnQuU09DS1NfQUdFTlRTW2tleV0gPSBuZXcgU29ja3NQcm94eUFnZW50KFwic29ja3M1aDovL1wiICsgYXV0aCArIHBhcnNlZC5ob3N0LCB7IC8vIHNvY2tzIGVzdGFibGlzaG1lbnQgYW5kIGluYWN0aXZpdHkgYXJlIGJvdW5kZWQgYnkgdGltZW91dFxuICAgICAgICBrZWVwQWxpdmU6IHRydWUsXG4gICAgICAgIHRpbWVvdXQ6IE1hdGgubWF4KEh0dHBDbGllbnQuQ09OTkVDVF9USU1FT1VULCBIdHRwQ2xpZW50LlJFQURfVElNRU9VVCksXG4gICAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogcmVqZWN0VW5hdXRob3JpemVkXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIEh0dHBDbGllbnQuU09DS1NfQUdFTlRTW2tleV07XG4gIH1cblxuICAvLyBib3VuZCB0aGUgd2hvbGUgcmVxdWVzdCB3aGVyZSBub2RlIGFnZW50IHNvY2tldCB0aW1lb3V0cyBkbyBub3QgYXBwbHlcbiAgcHJvdGVjdGVkIHN0YXRpYyBnZXROb25BZ2VudFRpbWVvdXQoKSB7XG4gICAgcmV0dXJuIEdlblV0aWxzLmlzQnJvd3NlcigpIHx8IEdlblV0aWxzLmlzRGVubygpID8gTWF0aC5tYXgoSHR0cENsaWVudC5DT05ORUNUX1RJTUVPVVQsIEh0dHBDbGllbnQuUkVBRF9USU1FT1VUKSA6IDA7XG4gIH1cblxuICAvLyBib3VuZCB0aGUgY29ubmVjdGlvbiBwaGFzZSBhbmQgc29ja2V0IGluYWN0aXZpdHlcbiAgcHJvdGVjdGVkIHN0YXRpYyBhcHBseVRpbWVvdXRzKGFnZW50OiBhbnkpIHtcbiAgICBpZiAodHlwZW9mIGFnZW50LmNyZWF0ZUNvbm5lY3Rpb24gIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGFnZW50OyAvLyBuby1vcCBpbiBicm93c2VyIHNoaW1zXG4gICAgY29uc3QgY3JlYXRlQ29ubmVjdGlvbiA9IGFnZW50LmNyZWF0ZUNvbm5lY3Rpb24uYmluZChhZ2VudCk7XG4gICAgYWdlbnQuY3JlYXRlQ29ubmVjdGlvbiA9IGZ1bmN0aW9uKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgICBjb25zdCBzb2NrZXQgPSBjcmVhdGVDb25uZWN0aW9uKG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICAgIGlmIChIdHRwQ2xpZW50LkNPTk5FQ1RfVElNRU9VVCA+IDApIHtcbiAgICAgICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHNvY2tldC5kZXN0cm95KG5ldyBFcnJvcihcIkNvbm5lY3Rpb24gdGltZWQgb3V0IGluIFwiICsgSHR0cENsaWVudC5DT05ORUNUX1RJTUVPVVQgKyBcIiBtc1wiKSksIEh0dHBDbGllbnQuQ09OTkVDVF9USU1FT1VUKTtcbiAgICAgICAgY29uc3QgY2xlYXJDb25uZWN0VGltZXIgPSAoKSA9PiBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICBzb2NrZXQub25jZShcImNvbm5lY3RcIiwgY2xlYXJDb25uZWN0VGltZXIpLm9uY2UoXCJzZWN1cmVDb25uZWN0XCIsIGNsZWFyQ29ubmVjdFRpbWVyKS5vbmNlKFwiZXJyb3JcIiwgY2xlYXJDb25uZWN0VGltZXIpLm9uY2UoXCJjbG9zZVwiLCBjbGVhckNvbm5lY3RUaW1lcik7XG4gICAgICB9XG4gICAgICBpZiAoSHR0cENsaWVudC5SRUFEX1RJTUVPVVQgPiAwKSBzb2NrZXQuc2V0VGltZW91dChIdHRwQ2xpZW50LlJFQURfVElNRU9VVCwgKCkgPT4gc29ja2V0LmRlc3Ryb3kobmV3IEVycm9yKFwiU29ja2V0IHRpbWVkIG91dCBhZnRlciBcIiArIEh0dHBDbGllbnQuUkVBRF9USU1FT1VUICsgXCIgbXMgb2YgaW5hY3Rpdml0eVwiKSkpO1xuICAgICAgcmV0dXJuIHNvY2tldDtcbiAgICB9O1xuICAgIHJldHVybiBhZ2VudDtcbiAgfVxuXG4gIC8vIGRlZmVyIG9ubHkgd2hlbiBhIGhvc3QgZXhjZWVkcyB0aGUgcmF0ZSBsaW1pdCBzaW5jZSBicm93c2VycyB0aHJvdHRsZSB0aW1lcnMgaW4gYmFja2dyb3VuZCB0YWJzXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgYXdhaXRSYXRlTGltaXQoaG9zdDogc3RyaW5nKSB7XG4gICAgY29uc3QgcmF0ZSA9IEh0dHBDbGllbnQuTUFYX1JFUVVFU1RTX1BFUl9TRUNPTkQ7XG4gICAgaWYgKCEocmF0ZSA+IDApKSB0aHJvdyBuZXcgRXJyb3IoXCJNYXggcmVxdWVzdHMgcGVyIHNlY29uZCBtdXN0IGJlIGdyZWF0ZXIgdGhhbiAwIG9yIEluZmluaXR5XCIpO1xuICAgIGNvbnN0IHN0YXJ0VGltZXMgPSBIdHRwQ2xpZW50LlJFUVVFU1RfU1RBUlRfVElNRVNbaG9zdF07XG4gICAgaWYgKHJhdGUgPT09IEluZmluaXR5KSB7XG4gICAgICBzdGFydFRpbWVzLmxlbmd0aCA9IDA7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gYWxsb3cgd2hvbGUgcmVxdWVzdHMgcGVyIHdpbmRvdywgZXh0ZW5kaW5nIHRoZSB3aW5kb3cgdG8gcHJlc2VydmUgZnJhY3Rpb25hbCBsaW1pdHNcbiAgICBjb25zdCBtYXhSZXF1ZXN0cyA9IE1hdGguY2VpbChyYXRlKTtcbiAgICBjb25zdCB3aW5kb3dNcyA9IDEwMDAgKiBtYXhSZXF1ZXN0cyAvIHJhdGU7XG4gICAgd2hpbGUgKHN0YXJ0VGltZXMubGVuZ3RoID4gMCAmJiBzdGFydFRpbWVzWzBdICsgd2luZG93TXMgPD0gRGF0ZS5ub3coKSkgc3RhcnRUaW1lcy5zaGlmdCgpOyAvLyBib3VuZCBoaXN0b3J5IHRvIHRoZSBjdXJyZW50IHdpbmRvd1xuICAgIHdoaWxlIChzdGFydFRpbWVzLmxlbmd0aCA+PSBtYXhSZXF1ZXN0cykge1xuICAgICAgY29uc3Qgd2FpdE1zID0gTWF0aC5jZWlsKHN0YXJ0VGltZXNbMF0gKyB3aW5kb3dNcyAtIERhdGUubm93KCkpO1xuICAgICAgaWYgKHdhaXRNcyA+IDApIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHdhaXRNcykpO1xuICAgICAgZWxzZSBzdGFydFRpbWVzLnNoaWZ0KCk7XG4gICAgfVxuICAgIHN0YXJ0VGltZXMucHVzaChEYXRlLm5vdygpKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgcmVxdWVzdEF4aW9zKHJlcSkge1xuICAgIGlmIChyZXEuaGVhZGVycykgdGhyb3cgbmV3IEVycm9yKFwiQ3VzdG9tIGhlYWRlcnMgbm90IGltcGxlbWVudGVkIGluIFhIUiByZXF1ZXN0XCIpOyAgLy8gVE9ET1xuXG4gICAgLy8gY29sbGVjdCBwYXJhbXMgZnJvbSByZXF1ZXN0IHdoaWNoIGNoYW5nZSBvbiBhd2FpdFxuICAgIGNvbnN0IG1ldGhvZCA9IHJlcS5tZXRob2Q7XG4gICAgY29uc3QgdXJpID0gcmVxLnVyaTtcbiAgICBjb25zdCBob3N0ID0gcmVxLmhvc3Q7XG4gICAgY29uc3QgdXNlcm5hbWUgPSByZXEudXNlcm5hbWU7XG4gICAgY29uc3QgcGFzc3dvcmQgPSByZXEucGFzc3dvcmQ7XG4gICAgY29uc3QgYm9keSA9IHJlcS5ib2R5O1xuICAgIGNvbnN0IHByb3h5VXJpID0gcmVxLnByb3h5VXJpO1xuICAgIGNvbnN0IHJlamVjdFVuYXV0aG9yaXplZCA9IHJlcS5yZWplY3RVbmF1dGhvcml6ZWQ7XG4gICAgY29uc3QgaXNCaW5hcnkgPSBib2R5IGluc3RhbmNlb2YgVWludDhBcnJheTtcbiAgICBjb25zdCBjYW5jZWxUb2tlbiA9IHJlcS5jYW5jZWxUb2tlbjtcbiAgICBpZiAoY2FuY2VsVG9rZW4pIGNhbmNlbFRva2VuLnRocm93SWZSZXF1ZXN0ZWQoKTtcblxuICAgIC8vIHF1ZXVlIGFuZCB0aHJvdHRsZSByZXF1ZXN0cyB0byBleGVjdXRlIGluIHNlcmlhbCBhbmQgcmF0ZSBsaW1pdGVkIHBlciBob3N0XG4gICAgY29uc3QgcmVzcG9uc2UgPSBIdHRwQ2xpZW50LlRBU0tfUVVFVUVTW2hvc3RdLnN1Ym1pdChhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChjYW5jZWxUb2tlbikgY2FuY2VsVG9rZW4udGhyb3dJZlJlcXVlc3RlZCgpO1xuICAgICAgYXdhaXQgSHR0cENsaWVudC5hd2FpdFJhdGVMaW1pdChob3N0KTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgSHR0cENsaWVudC5heGlvc0RpZ2VzdEF1dGhSZXF1ZXN0KG1ldGhvZCwgdXJpLCB1c2VybmFtZSwgcGFzc3dvcmQsIGJvZHksIHByb3h5VXJpLCByZWplY3RVbmF1dGhvcml6ZWQsIGNhbmNlbFRva2VuKS50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnJvcjogQXhpb3NFcnJvcikge1xuICAgICAgICAgIGlmIChlcnJvci5yZXNwb25zZT8uc3RhdHVzKSByZXNvbHZlKGVycm9yLnJlc3BvbnNlKTtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiUmVxdWVzdCBmYWlsZWQgd2l0aG91dCByZXNwb25zZTogXCIgKyBtZXRob2QgKyBcIiBcIiArIHVyaSArIFwiIGR1ZSB0byB1bmRlcmx5aW5nIGVycm9yOlxcblwiICsgZXJyb3IubWVzc2FnZSArIFwiXFxuXCIgKyBlcnJvci5zdGFjaykpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gcmVqZWN0IGNhbmNlbGxhdGlvbiBpbW1lZGlhdGVseSBldmVuIHdoZW4gcXVldWVkIGJlaGluZCBhbm90aGVyIHdhbGxldCdzIHJlcXVlc3RcbiAgICBsZXQgb25DYW5jZWw7XG4gICAgbGV0IHJlc3A7XG4gICAgdHJ5IHtcbiAgICAgIHJlc3AgPSBjYW5jZWxUb2tlbiA/IGF3YWl0IFByb21pc2UucmFjZShbcmVzcG9uc2UsIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgb25DYW5jZWwgPSByZWplY3Q7XG4gICAgICAgIGNhbmNlbFRva2VuLnN1YnNjcmliZShvbkNhbmNlbCk7XG4gICAgICB9KV0pIDogYXdhaXQgcmVzcG9uc2U7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGlmIChjYW5jZWxUb2tlbikgY2FuY2VsVG9rZW4udW5zdWJzY3JpYmUob25DYW5jZWwpO1xuICAgIH1cblxuICAgIC8vIG5vcm1hbGl6ZSByZXNwb25zZVxuICAgIGxldCBub3JtYWxpemVkUmVzcG9uc2U6IGFueSA9IHt9O1xuICAgIG5vcm1hbGl6ZWRSZXNwb25zZS5zdGF0dXNDb2RlID0gcmVzcC5zdGF0dXM7XG4gICAgbm9ybWFsaXplZFJlc3BvbnNlLnN0YXR1c1RleHQgPSByZXNwLnN0YXR1c1RleHQ7XG4gICAgbm9ybWFsaXplZFJlc3BvbnNlLmhlYWRlcnMgPSB7Li4ucmVzcC5oZWFkZXJzfTtcbiAgICBub3JtYWxpemVkUmVzcG9uc2UuYm9keSA9IGlzQmluYXJ5ID8gbmV3IFVpbnQ4QXJyYXkocmVzcC5kYXRhKSA6IHJlc3AuZGF0YTtcbiAgICBpZiAobm9ybWFsaXplZFJlc3BvbnNlLmJvZHkgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikgbm9ybWFsaXplZFJlc3BvbnNlLmJvZHkgPSBuZXcgVWludDhBcnJheShub3JtYWxpemVkUmVzcG9uc2UuYm9keSk7ICAvLyBoYW5kbGUgZW1wdHkgYmluYXJ5IHJlcXVlc3RcbiAgICByZXR1cm4gbm9ybWFsaXplZFJlc3BvbnNlO1xuICB9XG5cbiAgcHJvdGVjdGVkIHN0YXRpYyBheGlvc0RpZ2VzdEF1dGhSZXF1ZXN0ID0gYXN5bmMgZnVuY3Rpb24obWV0aG9kLCB1cmwsIHVzZXJuYW1lLCBwYXNzd29yZCwgYm9keSwgcHJveHlVcmk/LCByZWplY3RVbmF1dGhvcml6ZWQ/LCBjYW5jZWxUb2tlbj8pIHtcbiAgICBpZiAodHlwZW9mIENyeXB0b0pTID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcmVxdWlyZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIENyeXB0b0pTID0gcmVxdWlyZSgnY3J5cHRvLWpzJyk7XG4gICAgfVxuXG4gICAgLy8gcm91dGUgdGhyb3VnaCBzb2NrcyBwcm94eSBpZiBjb25maWd1cmVkLCBvdGhlcndpc2UgdXNlIGRpcmVjdCBhZ2VudHNcbiAgICBjb25zdCBzb2Nrc0FnZW50ID0gcHJveHlVcmkgPyBIdHRwQ2xpZW50LmdldFNvY2tzQWdlbnQocHJveHlVcmksIHJlamVjdFVuYXV0aG9yaXplZCAhPT0gZmFsc2UpIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IGh0dHBBZ2VudCA9IHNvY2tzQWdlbnQgPz8gKHVybC5zdGFydHNXaXRoKFwiaHR0cHNcIikgPyB1bmRlZmluZWQgOiBIdHRwQ2xpZW50LmdldEh0dHBBZ2VudCgpKTtcbiAgICBjb25zdCBodHRwc0FnZW50ID0gc29ja3NBZ2VudCA/PyAodXJsLnN0YXJ0c1dpdGgoXCJodHRwc1wiKSA/IEh0dHBDbGllbnQuZ2V0SHR0cHNBZ2VudCgpIDogdW5kZWZpbmVkKTtcblxuICAgIGNvbnN0IGdlbmVyYXRlQ25vbmNlID0gZnVuY3Rpb24oKTogc3RyaW5nIHtcbiAgICAgIGNvbnN0IGNoYXJhY3RlcnMgPSAnYWJjZGVmMDEyMzQ1Njc4OSc7XG4gICAgICBsZXQgdG9rZW4gPSAnJztcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgICAgICBjb25zdCByYW5kTnVtID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogY2hhcmFjdGVycy5sZW5ndGgpO1xuICAgICAgICB0b2tlbiArPSBjaGFyYWN0ZXJzLnNsaWNlKHJhbmROdW0sIHJhbmROdW0rMSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdG9rZW47XG4gICAgfVxuXG4gICAgbGV0IGNvdW50ID0gMDtcbiAgICByZXR1cm4gYXhpb3MucmVxdWVzdCh7XG4gICAgICB1cmw6IHVybCxcbiAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICB9LFxuICAgICAgcmVzcG9uc2VUeXBlOiBib2R5IGluc3RhbmNlb2YgVWludDhBcnJheSA/ICdhcnJheWJ1ZmZlcicgOiB1bmRlZmluZWQsXG4gICAgICBodHRwQWdlbnQ6IGh0dHBBZ2VudCxcbiAgICAgIGh0dHBzQWdlbnQ6IGh0dHBzQWdlbnQsXG4gICAgICBwcm94eTogc29ja3NBZ2VudCA/IGZhbHNlIDogdW5kZWZpbmVkLCAvLyBlbnYgcHJveGllcyBtdXN0IG5vdCBieXBhc3MgdGhlIHNvY2tzIGFnZW50XG4gICAgICB0aW1lb3V0OiBIdHRwQ2xpZW50LmdldE5vbkFnZW50VGltZW91dCgpLFxuICAgICAgY2FuY2VsVG9rZW46IGNhbmNlbFRva2VuLFxuICAgICAgZGF0YTogYm9keSxcbiAgICAgIHRyYW5zZm9ybVJlc3BvbnNlOiByZXMgPT4gcmVzLFxuICAgICAgYWRhcHRlcjogR2VuVXRpbHMuaXNEZW5vKCkgPyBbJ2ZldGNoJ10gOiBbJ2h0dHAnLCAneGhyJywgJ2ZldGNoJ11cbiAgICB9KS5jYXRjaChhc3luYyAoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyLnJlc3BvbnNlPy5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICBsZXQgYXV0aEhlYWRlciA9IGVyci5yZXNwb25zZS5oZWFkZXJzWyd3d3ctYXV0aGVudGljYXRlJ10ucmVwbGFjZSgvLFxcc0RpZ2VzdC4qLywgXCJcIik7XG4gICAgICAgIGlmICghYXV0aEhlYWRlcikge1xuICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERpZ2VzdCBxb3A9XCJhdXRoXCIsYWxnb3JpdGhtPU1ENSxyZWFsbT1cIm1vbmVyby1ycGNcIixub25jZT1cImhCWjJyWkl4RWx2NGxxQ1JyVXlsWEE9PVwiLHN0YWxlPWZhbHNlXG4gICAgICAgIGNvbnN0IGF1dGhIZWFkZXJNYXAgPSBhdXRoSGVhZGVyLnJlcGxhY2UoXCJEaWdlc3QgXCIsIFwiXCIpLnJlcGxhY2VBbGwoJ1wiJywgXCJcIikuc3BsaXQoXCIsXCIpLnJlZHVjZSgocHJldiwgY3VycikgPT4gKHsuLi5wcmV2LCBbY3Vyci5zcGxpdChcIj1cIilbMF1dOiBjdXJyLnNwbGl0KFwiPVwiKS5zbGljZSgxKS5qb2luKCc9Jyl9KSwge30pXG5cbiAgICAgICAgKytjb3VudDtcblxuICAgICAgICBjb25zdCBjbm9uY2UgPSBnZW5lcmF0ZUNub25jZSgpO1xuICAgICAgICBjb25zdCBIQTEgPSBDcnlwdG9KUy5NRDUodXNlcm5hbWUrJzonK2F1dGhIZWFkZXJNYXAucmVhbG0rJzonK3Bhc3N3b3JkKS50b1N0cmluZygpO1xuICAgICAgICBjb25zdCBIQTIgPSBDcnlwdG9KUy5NRDUobWV0aG9kKyc6Jyt1cmwpLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBDcnlwdG9KUy5NRDUoSEExKyc6JytcbiAgICAgICAgICBhdXRoSGVhZGVyTWFwLm5vbmNlKyc6JytcbiAgICAgICAgICAoJzAwMDAwMDAwJyArIGNvdW50KS5zbGljZSgtOCkrJzonK1xuICAgICAgICAgIGNub25jZSsnOicrXG4gICAgICAgICAgYXV0aEhlYWRlck1hcC5xb3ArJzonK1xuICAgICAgICAgIEhBMikudG9TdHJpbmcoKTtcbiAgICAgICAgY29uc3QgZGlnZXN0QXV0aEhlYWRlciA9ICdEaWdlc3QnKycgJytcbiAgICAgICAgICAndXNlcm5hbWU9XCInK3VzZXJuYW1lKydcIiwgJytcbiAgICAgICAgICAncmVhbG09XCInK2F1dGhIZWFkZXJNYXAucmVhbG0rJ1wiLCAnK1xuICAgICAgICAgICdub25jZT1cIicrYXV0aEhlYWRlck1hcC5ub25jZSsnXCIsICcrXG4gICAgICAgICAgJ3VyaT1cIicrdXJsKydcIiwgJytcbiAgICAgICAgICAncmVzcG9uc2U9XCInK3Jlc3BvbnNlKydcIiwgJytcbiAgICAgICAgICAnb3BhcXVlPVwiJysoYXV0aEhlYWRlck1hcC5vcGFxdWUgPz8gbnVsbCkrJ1wiLCAnK1xuICAgICAgICAgICdxb3A9JythdXRoSGVhZGVyTWFwLnFvcCsnLCAnK1xuICAgICAgICAgICduYz0nKygnMDAwMDAwMDAnICsgY291bnQpLnNsaWNlKC04KSsnLCAnK1xuICAgICAgICAgICdjbm9uY2U9XCInK2Nub25jZSsnXCInO1xuXG4gICAgICAgIGNvbnN0IGZpbmFsUmVzcG9uc2UgPSBhd2FpdCBheGlvcy5yZXF1ZXN0KHtcbiAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6IGRpZ2VzdEF1dGhIZWFkZXIsXG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgICAgfSxcbiAgICAgICAgICByZXNwb25zZVR5cGU6IGJvZHkgaW5zdGFuY2VvZiBVaW50OEFycmF5ID8gJ2FycmF5YnVmZmVyJyA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBodHRwQWdlbnQ6IHVybC5zdGFydHNXaXRoKFwiaHR0cHNcIikgPyB1bmRlZmluZWQgOiBIdHRwQ2xpZW50LmdldEh0dHBBZ2VudCgpLFxuICAgICAgICAgIGh0dHBzQWdlbnQ6IHVybC5zdGFydHNXaXRoKFwiaHR0cHNcIikgPyBIdHRwQ2xpZW50LmdldEh0dHBzQWdlbnQoKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB0aW1lb3V0OiBIdHRwQ2xpZW50LmdldE5vbkFnZW50VGltZW91dCgpLFxuICAgICAgICAgIGNhbmNlbFRva2VuOiBjYW5jZWxUb2tlbixcbiAgICAgICAgICBkYXRhOiBib2R5LFxuICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlOiByZXMgPT4gcmVzLFxuICAgICAgICAgIGFkYXB0ZXI6IEdlblV0aWxzLmlzRGVubygpID8gWydmZXRjaCddIDogWydodHRwJywgJ3hocicsICdmZXRjaCddXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmaW5hbFJlc3BvbnNlO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyO1xuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfSk7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLFNBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLGFBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLFdBQUEsR0FB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