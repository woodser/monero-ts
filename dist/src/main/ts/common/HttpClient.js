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
   * Get a shared HTTPS client for the given SSL configuration.
   *
   * @return {https.Agent} a shared agent for network requests among library instances
   */
  static getHttpsAgent(rejectUnauthorized) {
    rejectUnauthorized = rejectUnauthorized !== false;
    const key = rejectUnauthorized ? "HTTPS_AGENT" : "HTTPS_AGENT_UNVERIFIED";
    if (!HttpClient[key]) HttpClient[key] = HttpClient.applyTimeouts(new _https.default.Agent({
      keepAlive: true,
      family: 4, // use IPv4
      rejectUnauthorized: rejectUnauthorized
    }));
    return HttpClient[key];
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
          if (error.response?.status) resolve(error.response);else
          {
            const message = "Request failed without response: " + method + " " + uri + " due to underlying error: " + error.message;
            _LibraryUtils.default.log(2, message + "\n" + error.stack); // the stack cannot follow the cause across the wasm bridge
            const cause = Object.assign(new Error(error.message), { name: error.name, code: error.code, stack: error.stack }); // omit request data from the cause
            reject(new Error(message, { cause }));
          }
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
    const httpsAgent = socksAgent ?? (url.startsWith("https") ? HttpClient.getHttpsAgent(rejectUnauthorized) : undefined);

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
          httpAgent: httpAgent,
          httpsAgent: httpsAgent,
          proxy: socksAgent ? false : undefined, // env proxies must not bypass the socks agent
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9MaWJyYXJ5VXRpbHMiLCJfVGhyZWFkUG9vbCIsIl9odHRwIiwiX2h0dHBzIiwiX2F4aW9zIiwiSHR0cENsaWVudCIsIk1BWF9SRVFVRVNUU19QRVJfU0VDT05EIiwiREVGQVVMVF9SRVFVRVNUIiwibWV0aG9kIiwicmVzb2x2ZVdpdGhGdWxsUmVzcG9uc2UiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJSRVFVRVNUX1NUQVJUX1RJTUVTIiwiVEFTS19RVUVVRVMiLCJDT05ORUNUX1RJTUVPVVQiLCJSRUFEX1RJTUVPVVQiLCJTT0NLU19BR0VOVFMiLCJyZXF1ZXN0IiwicHJveHlUb1dvcmtlciIsIkxpYnJhcnlVdGlscyIsImludm9rZVdvcmtlciIsInVuZGVmaW5lZCIsImVyciIsIm1lc3NhZ2UiLCJsZW5ndGgiLCJjaGFyQXQiLCJwYXJzZWQiLCJKU09OIiwicGFyc2UiLCJzdGF0dXNNZXNzYWdlIiwic3RhdHVzQ29kZSIsIk9iamVjdCIsImFzc2lnbiIsImhvc3QiLCJVUkwiLCJ1cmkiLCJFcnJvciIsImJvZHkiLCJUaHJlYWRQb29sIiwicmVxdWVzdFByb21pc2UiLCJyZXF1ZXN0QXhpb3MiLCJ0aW1lb3V0IiwiR2VuVXRpbHMiLCJleGVjdXRlV2l0aFRpbWVvdXQiLCJjcmVhdGVDYW5jZWxUb2tlbiIsImF4aW9zIiwiQ2FuY2VsVG9rZW4iLCJzb3VyY2UiLCJnZXRIdHRwQWdlbnQiLCJIVFRQX0FHRU5UIiwiYXBwbHlUaW1lb3V0cyIsImh0dHAiLCJBZ2VudCIsImtlZXBBbGl2ZSIsImZhbWlseSIsImdldEh0dHBzQWdlbnQiLCJrZXkiLCJodHRwcyIsImdldFNvY2tzQWdlbnQiLCJwcm94eVVyaSIsImlzQnJvd3NlciIsImlzRGVubyIsIlNvY2tzUHJveHlBZ2VudCIsIm5vcm1hbGl6ZVVyaSIsImF1dGgiLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwiTWF0aCIsIm1heCIsImdldE5vbkFnZW50VGltZW91dCIsImFnZW50IiwiY3JlYXRlQ29ubmVjdGlvbiIsImJpbmQiLCJvcHRpb25zIiwiY2FsbGJhY2siLCJzb2NrZXQiLCJ0aW1lciIsInNldFRpbWVvdXQiLCJkZXN0cm95IiwiY2xlYXJDb25uZWN0VGltZXIiLCJjbGVhclRpbWVvdXQiLCJvbmNlIiwiYXdhaXRSYXRlTGltaXQiLCJyYXRlIiwic3RhcnRUaW1lcyIsIkluZmluaXR5IiwibWF4UmVxdWVzdHMiLCJjZWlsIiwid2luZG93TXMiLCJEYXRlIiwibm93Iiwic2hpZnQiLCJ3YWl0TXMiLCJQcm9taXNlIiwicmVzb2x2ZSIsInB1c2giLCJyZXEiLCJoZWFkZXJzIiwiaXNCaW5hcnkiLCJVaW50OEFycmF5IiwiY2FuY2VsVG9rZW4iLCJ0aHJvd0lmUmVxdWVzdGVkIiwicmVzcG9uc2UiLCJzdWJtaXQiLCJyZWplY3QiLCJheGlvc0RpZ2VzdEF1dGhSZXF1ZXN0IiwidGhlbiIsInJlc3AiLCJjYXRjaCIsImVycm9yIiwic3RhdHVzIiwibG9nIiwic3RhY2siLCJjYXVzZSIsIm5hbWUiLCJjb2RlIiwib25DYW5jZWwiLCJyYWNlIiwic3Vic2NyaWJlIiwidW5zdWJzY3JpYmUiLCJub3JtYWxpemVkUmVzcG9uc2UiLCJzdGF0dXNUZXh0IiwiZGF0YSIsIkFycmF5QnVmZmVyIiwidXJsIiwiQ3J5cHRvSlMiLCJzb2Nrc0FnZW50IiwiaHR0cEFnZW50Iiwic3RhcnRzV2l0aCIsImh0dHBzQWdlbnQiLCJnZW5lcmF0ZUNub25jZSIsImNoYXJhY3RlcnMiLCJ0b2tlbiIsImkiLCJyYW5kTnVtIiwicm91bmQiLCJyYW5kb20iLCJzbGljZSIsImNvdW50IiwicmVzcG9uc2VUeXBlIiwicHJveHkiLCJ0cmFuc2Zvcm1SZXNwb25zZSIsInJlcyIsImFkYXB0ZXIiLCJhdXRoSGVhZGVyIiwicmVwbGFjZSIsImF1dGhIZWFkZXJNYXAiLCJyZXBsYWNlQWxsIiwic3BsaXQiLCJyZWR1Y2UiLCJwcmV2IiwiY3VyciIsImpvaW4iLCJjbm9uY2UiLCJIQTEiLCJNRDUiLCJyZWFsbSIsInRvU3RyaW5nIiwiSEEyIiwibm9uY2UiLCJxb3AiLCJkaWdlc3RBdXRoSGVhZGVyIiwib3BhcXVlIiwiZmluYWxSZXNwb25zZSIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvY29tbW9uL0h0dHBDbGllbnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuL0dlblV0aWxzXCI7XG5pbXBvcnQgTGlicmFyeVV0aWxzIGZyb20gXCIuL0xpYnJhcnlVdGlsc1wiO1xuaW1wb3J0IFRocmVhZFBvb2wgZnJvbSBcIi4vVGhyZWFkUG9vbFwiO1xuaW1wb3J0IGh0dHAgZnJvbSBcImh0dHBcIjtcbmltcG9ydCBodHRwcyBmcm9tIFwiaHR0cHNcIjtcbmltcG9ydCBheGlvcywgeyBBeGlvc0Vycm9yIH0gZnJvbSBcImF4aW9zXCI7XG5cbi8qKlxuICogSGFuZGxlIEhUVFAgcmVxdWVzdHMgd2l0aCBhIHVuaWZvcm0gaW50ZXJmYWNlLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBIdHRwQ2xpZW50IHtcblxuICBzdGF0aWMgTUFYX1JFUVVFU1RTX1BFUl9TRUNPTkQgPSA1MDsgLy8gcG9zaXRpdmUgcmVxdWVzdHMgcGVyIHNlY29uZCwgb3IgSW5maW5pdHkgdG8gZGlzYWJsZSB0aHJvdHRsaW5nXG5cbiAgLy8gZGVmYXVsdCByZXF1ZXN0IGNvbmZpZ1xuICBwcm90ZWN0ZWQgc3RhdGljIERFRkFVTFRfUkVRVUVTVCA9IHtcbiAgICBtZXRob2Q6IFwiR0VUXCIsXG4gICAgcmVzb2x2ZVdpdGhGdWxsUmVzcG9uc2U6IGZhbHNlLFxuICAgIHJlamVjdFVuYXV0aG9yaXplZDogdHJ1ZVxuICB9XG5cbiAgLy8gcmF0ZSBsaW1pdCByZXF1ZXN0cyBwZXIgaG9zdFxuICBwcm90ZWN0ZWQgc3RhdGljIFJFUVVFU1RfU1RBUlRfVElNRVMgPSBbXTsgLy8gcmVjZW50IHJlcXVlc3Qgc3RhcnQgdGltZXMgcGVyIGhvc3RcbiAgcHJvdGVjdGVkIHN0YXRpYyBUQVNLX1FVRVVFUyA9IFtdO1xuICBwcm90ZWN0ZWQgc3RhdGljIENPTk5FQ1RfVElNRU9VVCA9IDE4MDAwMDsgLy8gbXMgdG8gZXN0YWJsaXNoIGEgY29ubmVjdGlvbiwgbWF0Y2hpbmcgbW9uZXJvLWphdmEncyBkZWZhdWx0ICgwIHRvIGRpc2FibGUpXG4gIHByb3RlY3RlZCBzdGF0aWMgUkVBRF9USU1FT1VUID0gMTgwMDAwOyAvLyBtcyBvZiBzb2NrZXQgaW5hY3Rpdml0eSBiZWZvcmUgdGltaW5nIG91dFxuXG4gIHByb3RlY3RlZCBzdGF0aWMgSFRUUF9BR0VOVDogYW55O1xuICBwcm90ZWN0ZWQgc3RhdGljIEhUVFBTX0FHRU5UOiBhbnk7XG4gIHByb3RlY3RlZCBzdGF0aWMgSFRUUFNfQUdFTlRfVU5WRVJJRklFRDogYW55O1xuICBwcm90ZWN0ZWQgc3RhdGljIFNPQ0tTX0FHRU5UUzogYW55ID0ge307IC8vIHNoYXJlZCBzb2NrcyBhZ2VudHMga2V5ZWQgYnkgcHJveHkgdXJpIGFuZCBzc2wgY29uZmlnXG5cbiAgLyoqXG4gICAqIDxwPk1ha2UgYSBIVFRQIHJlcXVlc3QuPHA+XG4gICAqIFxuICAgKiBAcGFyYW0ge29iamVjdH0gcmVxdWVzdCAtIGNvbmZpZ3VyZXMgdGhlIHJlcXVlc3QgdG8gbWFrZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcmVxdWVzdC5tZXRob2QgLSBIVFRQIG1ldGhvZCAoXCJHRVRcIiwgXCJQVVRcIiwgXCJQT1NUXCIsIFwiREVMRVRFXCIsIGV0YylcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlcXVlc3QudXJpIC0gdXJpIHRvIHJlcXVlc3RcbiAgICogQHBhcmFtIHtzdHJpbmd8VWludDhBcnJheXxvYmplY3R9IHJlcXVlc3QuYm9keSAtIHJlcXVlc3QgYm9keVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3JlcXVlc3QudXNlcm5hbWVdIC0gdXNlcm5hbWUgdG8gYXV0aGVudGljYXRlIHRoZSByZXF1ZXN0IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtyZXF1ZXN0LnBhc3N3b3JkXSAtIHBhc3N3b3JkIHRvIGF1dGhlbnRpY2F0ZSB0aGUgcmVxdWVzdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBbcmVxdWVzdC5oZWFkZXJzXSAtIGhlYWRlcnMgdG8gYWRkIHRvIHRoZSByZXF1ZXN0IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtyZXF1ZXN0LnByb3h5VXJpXSAtIHByb3h5IHRoZSByZXF1ZXN0IHRocm91Z2ggYSBTT0NLUzUgc2VydmVyLCBlLmcuIGEgbG9jYWwgVG9yIHByb3h5IChOb2RlLmpzIG9ubHksIG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtyZXF1ZXN0LnJlc29sdmVXaXRoRnVsbFJlc3BvbnNlXSAtIHJldHVybiBmdWxsIHJlc3BvbnNlIGlmIHRydWUsIGVsc2UgYm9keSBvbmx5IChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtyZXF1ZXN0LnJlamVjdFVuYXV0aG9yaXplZF0gLSB3aGV0aGVyIG9yIG5vdCB0byByZWplY3Qgc2VsZi1zaWduZWQgY2VydGlmaWNhdGVzIChkZWZhdWx0IHRydWUpXG4gICAqIEBwYXJhbSB7b2JqZWN0fSBbcmVxdWVzdC5jYW5jZWxUb2tlbl0gLSB0b2tlbiB0byBjYW5jZWwgYSBxdWV1ZWQgb3IgYWN0aXZlIHJlcXVlc3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gcmVxdWVzdC50aW1lb3V0IC0gbWF4aW11bSB0aW1lIGFsbG93ZWQgaW4gbWlsbGlzZWNvbmRzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByZXF1ZXN0LnByb3h5VG9Xb3JrZXIgLSBwcm94eSByZXF1ZXN0IHRvIHdvcmtlciB0aHJlYWRcbiAgICogQHJldHVybiB7b2JqZWN0fSByZXNwb25zZSAtIHRoZSByZXNwb25zZSBvYmplY3RcbiAgICogQHJldHVybiB7c3RyaW5nfFVpbnQ4QXJyYXl8b2JqZWN0fSByZXNwb25zZS5ib2R5IC0gdGhlIHJlc3BvbnNlIGJvZHlcbiAgICogQHJldHVybiB7bnVtYmVyfSByZXNwb25zZS5zdGF0dXNDb2RlIC0gdGhlIHJlc3BvbnNlIGNvZGVcbiAgICogQHJldHVybiB7U3RyaW5nfSByZXNwb25zZS5zdGF0dXNUZXh0IC0gdGhlIHJlc3BvbnNlIG1lc3NhZ2VcbiAgICogQHJldHVybiB7b2JqZWN0fSByZXNwb25zZS5oZWFkZXJzIC0gdGhlIHJlc3BvbnNlIGhlYWRlcnNcbiAgICovXG4gIHN0YXRpYyBhc3luYyByZXF1ZXN0KHJlcXVlc3QpIHtcbiAgICAvLyBwcm94eSB0byB3b3JrZXIgaWYgY29uZmlndXJlZFxuICAgIGlmIChyZXF1ZXN0LnByb3h5VG9Xb3JrZXIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHVuZGVmaW5lZCwgXCJodHRwUmVxdWVzdFwiLCByZXF1ZXN0KTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIGlmIChlcnIubWVzc2FnZS5sZW5ndGggPiAwICYmIGVyci5tZXNzYWdlLmNoYXJBdCgwKSA9PT0gXCJ7XCIpIHtcbiAgICAgICAgICBsZXQgcGFyc2VkID0gSlNPTi5wYXJzZShlcnIubWVzc2FnZSk7XG4gICAgICAgICAgZXJyLm1lc3NhZ2UgPSBwYXJzZWQuc3RhdHVzTWVzc2FnZTtcbiAgICAgICAgICBlcnIuc3RhdHVzQ29kZSA9IHBhcnNlZC5zdGF0dXNDb2RlO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBhc3NpZ24gZGVmYXVsdHNcbiAgICByZXF1ZXN0ID0gT2JqZWN0LmFzc2lnbih7fSwgSHR0cENsaWVudC5ERUZBVUxUX1JFUVVFU1QsIHJlcXVlc3QpO1xuXG4gICAgLy8gdmFsaWRhdGUgcmVxdWVzdFxuICAgIHRyeSB7IHJlcXVlc3QuaG9zdCA9IG5ldyBVUkwocmVxdWVzdC51cmkpLmhvc3Q7IH0gLy8gaG9zdG5hbWU6cG9ydFxuICAgIGNhdGNoIChlcnIpIHsgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCByZXF1ZXN0IFVSTDogXCIgKyByZXF1ZXN0LnVyaSk7IH1cbiAgICBpZiAocmVxdWVzdC5ib2R5ICYmICEodHlwZW9mIHJlcXVlc3QuYm9keSA9PT0gXCJzdHJpbmdcIiB8fCB0eXBlb2YgcmVxdWVzdC5ib2R5ID09PSBcIm9iamVjdFwiKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmVxdWVzdCBib2R5IHR5cGUgaXMgbm90IHN0cmluZyBvciBvYmplY3RcIik7XG4gICAgfVxuXG4gICAgLy8gaW5pdGlhbGl6ZSBvbmUgdGFzayBxdWV1ZSBwZXIgaG9zdFxuICAgIGlmICghSHR0cENsaWVudC5UQVNLX1FVRVVFU1tyZXF1ZXN0Lmhvc3RdKSBIdHRwQ2xpZW50LlRBU0tfUVVFVUVTW3JlcXVlc3QuaG9zdF0gPSBuZXcgVGhyZWFkUG9vbCgxKTtcblxuICAgIC8vIGluaXRpYWxpemUgb25lIHJhdGUgbGltaXQgd2luZG93IHBlciBob3N0XG4gICAgaWYgKCFIdHRwQ2xpZW50LlJFUVVFU1RfU1RBUlRfVElNRVNbcmVxdWVzdC5ob3N0XSkgSHR0cENsaWVudC5SRVFVRVNUX1NUQVJUX1RJTUVTW3JlcXVlc3QuaG9zdF0gPSBbXTtcblxuICAgIC8vIGNvbm5lY3Rpb24gYW5kIHJlc3BvbnNlIGluYWN0aXZpdHkgYXJlIGJvdW5kZWQgaW4gdGhlIGFnZW50c1xuICAgIGxldCByZXF1ZXN0UHJvbWlzZSA9IEh0dHBDbGllbnQucmVxdWVzdEF4aW9zKHJlcXVlc3QpO1xuICAgIHJldHVybiByZXF1ZXN0LnRpbWVvdXQgPyBHZW5VdGlscy5leGVjdXRlV2l0aFRpbWVvdXQocmVxdWVzdFByb21pc2UsIHJlcXVlc3QudGltZW91dCkgOiByZXF1ZXN0UHJvbWlzZTtcbiAgfVxuXG4gIHN0YXRpYyBjcmVhdGVDYW5jZWxUb2tlbigpIHtcbiAgICByZXR1cm4gYXhpb3MuQ2FuY2VsVG9rZW4uc291cmNlKCk7XG4gIH1cblxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIEhFTFBFUlMgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG5cbiAgLyoqXG4gICAqIEdldCBhIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiBhbiBIVFRQIGNsaWVudCB0byBzaGFyZS5cbiAgICpcbiAgICogQHJldHVybiB7aHR0cC5BZ2VudH0gYSBzaGFyZWQgYWdlbnQgZm9yIG5ldHdvcmsgcmVxdWVzdHMgYW1vbmcgbGlicmFyeSBpbnN0YW5jZXNcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgZ2V0SHR0cEFnZW50KCkge1xuICAgIGlmICghSHR0cENsaWVudC5IVFRQX0FHRU5UKSBIdHRwQ2xpZW50LkhUVFBfQUdFTlQgPSBIdHRwQ2xpZW50LmFwcGx5VGltZW91dHMobmV3IGh0dHAuQWdlbnQoe1xuICAgICAga2VlcEFsaXZlOiB0cnVlLFxuICAgICAgZmFtaWx5OiA0IC8vIHVzZSBJUHY0XG4gICAgfSkpO1xuICAgIHJldHVybiBIdHRwQ2xpZW50LkhUVFBfQUdFTlQ7XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgc2hhcmVkIEhUVFBTIGNsaWVudCBmb3IgdGhlIGdpdmVuIFNTTCBjb25maWd1cmF0aW9uLlxuICAgKlxuICAgKiBAcmV0dXJuIHtodHRwcy5BZ2VudH0gYSBzaGFyZWQgYWdlbnQgZm9yIG5ldHdvcmsgcmVxdWVzdHMgYW1vbmcgbGlicmFyeSBpbnN0YW5jZXNcbiAgICovXG4gIHByb3RlY3RlZCBzdGF0aWMgZ2V0SHR0cHNBZ2VudChyZWplY3RVbmF1dGhvcml6ZWQ/OiBib29sZWFuKSB7XG4gICAgcmVqZWN0VW5hdXRob3JpemVkID0gcmVqZWN0VW5hdXRob3JpemVkICE9PSBmYWxzZTtcbiAgICBjb25zdCBrZXkgPSByZWplY3RVbmF1dGhvcml6ZWQgPyBcIkhUVFBTX0FHRU5UXCIgOiBcIkhUVFBTX0FHRU5UX1VOVkVSSUZJRURcIjtcbiAgICBpZiAoIUh0dHBDbGllbnRba2V5XSkgSHR0cENsaWVudFtrZXldID0gSHR0cENsaWVudC5hcHBseVRpbWVvdXRzKG5ldyBodHRwcy5BZ2VudCh7XG4gICAgICBrZWVwQWxpdmU6IHRydWUsXG4gICAgICBmYW1pbHk6IDQsIC8vIHVzZSBJUHY0XG4gICAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHJlamVjdFVuYXV0aG9yaXplZFxuICAgIH0pKTtcbiAgICByZXR1cm4gSHR0cENsaWVudFtrZXldO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHNpbmdsZXRvbiBhZ2VudCB0byByb3V0ZSByZXF1ZXN0cyB0aHJvdWdoIGEgU09DS1M1IHByb3h5OyBob3N0bmFtZXMgYXJlIHJlc29sdmVkIGJ5IHRoZSBwcm94eSB0byBhdm9pZCBETlMgbGVha3MuXG4gICAqXG4gICAqIEByZXR1cm4ge1NvY2tzUHJveHlBZ2VudH0gYSBzaGFyZWQgYWdlbnQgZm9yIHRoZSBnaXZlbiBwcm94eSBhbmQgc3NsIGNvbmZpZ1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBnZXRTb2Nrc0FnZW50KHByb3h5VXJpOiBzdHJpbmcsIHJlamVjdFVuYXV0aG9yaXplZDogYm9vbGVhbikge1xuICAgIGlmIChHZW5VdGlscy5pc0Jyb3dzZXIoKSB8fCBHZW5VdGlscy5pc0Rlbm8oKSkgdGhyb3cgbmV3IEVycm9yKFwiUHJveGllZCByZXF1ZXN0cyBhcmUgb25seSBzdXBwb3J0ZWQgaW4gTm9kZS5qc1wiKTtcbiAgICBjb25zdCBrZXkgPSBwcm94eVVyaSArIFwiX1wiICsgcmVqZWN0VW5hdXRob3JpemVkO1xuICAgIGlmICghSHR0cENsaWVudC5TT0NLU19BR0VOVFNba2V5XSkge1xuICAgICAgY29uc3QgeyBTb2Nrc1Byb3h5QWdlbnQgfSA9IHJlcXVpcmUoXCJzb2Nrcy1wcm94eS1hZ2VudFwiKTtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IG5ldyBVUkwoR2VuVXRpbHMubm9ybWFsaXplVXJpKHByb3h5VXJpKSk7XG4gICAgICBjb25zdCBhdXRoID0gcGFyc2VkLnVzZXJuYW1lID8gcGFyc2VkLnVzZXJuYW1lICsgXCI6XCIgKyBwYXJzZWQucGFzc3dvcmQgKyBcIkBcIiA6IFwiXCI7XG4gICAgICBIdHRwQ2xpZW50LlNPQ0tTX0FHRU5UU1trZXldID0gbmV3IFNvY2tzUHJveHlBZ2VudChcInNvY2tzNWg6Ly9cIiArIGF1dGggKyBwYXJzZWQuaG9zdCwgeyAvLyBzb2NrcyBlc3RhYmxpc2htZW50IGFuZCBpbmFjdGl2aXR5IGFyZSBib3VuZGVkIGJ5IHRpbWVvdXRcbiAgICAgICAga2VlcEFsaXZlOiB0cnVlLFxuICAgICAgICB0aW1lb3V0OiBNYXRoLm1heChIdHRwQ2xpZW50LkNPTk5FQ1RfVElNRU9VVCwgSHR0cENsaWVudC5SRUFEX1RJTUVPVVQpLFxuICAgICAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHJlamVjdFVuYXV0aG9yaXplZFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBIdHRwQ2xpZW50LlNPQ0tTX0FHRU5UU1trZXldO1xuICB9XG5cbiAgLy8gYm91bmQgdGhlIHdob2xlIHJlcXVlc3Qgd2hlcmUgbm9kZSBhZ2VudCBzb2NrZXQgdGltZW91dHMgZG8gbm90IGFwcGx5XG4gIHByb3RlY3RlZCBzdGF0aWMgZ2V0Tm9uQWdlbnRUaW1lb3V0KCkge1xuICAgIHJldHVybiBHZW5VdGlscy5pc0Jyb3dzZXIoKSB8fCBHZW5VdGlscy5pc0Rlbm8oKSA/IE1hdGgubWF4KEh0dHBDbGllbnQuQ09OTkVDVF9USU1FT1VULCBIdHRwQ2xpZW50LlJFQURfVElNRU9VVCkgOiAwO1xuICB9XG5cbiAgLy8gYm91bmQgdGhlIGNvbm5lY3Rpb24gcGhhc2UgYW5kIHNvY2tldCBpbmFjdGl2aXR5XG4gIHByb3RlY3RlZCBzdGF0aWMgYXBwbHlUaW1lb3V0cyhhZ2VudDogYW55KSB7XG4gICAgaWYgKHR5cGVvZiBhZ2VudC5jcmVhdGVDb25uZWN0aW9uICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBhZ2VudDsgLy8gbm8tb3AgaW4gYnJvd3NlciBzaGltc1xuICAgIGNvbnN0IGNyZWF0ZUNvbm5lY3Rpb24gPSBhZ2VudC5jcmVhdGVDb25uZWN0aW9uLmJpbmQoYWdlbnQpO1xuICAgIGFnZW50LmNyZWF0ZUNvbm5lY3Rpb24gPSBmdW5jdGlvbihvcHRpb25zLCBjYWxsYmFjaykge1xuICAgICAgY29uc3Qgc29ja2V0ID0gY3JlYXRlQ29ubmVjdGlvbihvcHRpb25zLCBjYWxsYmFjayk7XG4gICAgICBpZiAoSHR0cENsaWVudC5DT05ORUNUX1RJTUVPVVQgPiAwKSB7XG4gICAgICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiBzb2NrZXQuZGVzdHJveShuZXcgRXJyb3IoXCJDb25uZWN0aW9uIHRpbWVkIG91dCBpbiBcIiArIEh0dHBDbGllbnQuQ09OTkVDVF9USU1FT1VUICsgXCIgbXNcIikpLCBIdHRwQ2xpZW50LkNPTk5FQ1RfVElNRU9VVCk7XG4gICAgICAgIGNvbnN0IGNsZWFyQ29ubmVjdFRpbWVyID0gKCkgPT4gY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgc29ja2V0Lm9uY2UoXCJjb25uZWN0XCIsIGNsZWFyQ29ubmVjdFRpbWVyKS5vbmNlKFwic2VjdXJlQ29ubmVjdFwiLCBjbGVhckNvbm5lY3RUaW1lcikub25jZShcImVycm9yXCIsIGNsZWFyQ29ubmVjdFRpbWVyKS5vbmNlKFwiY2xvc2VcIiwgY2xlYXJDb25uZWN0VGltZXIpO1xuICAgICAgfVxuICAgICAgaWYgKEh0dHBDbGllbnQuUkVBRF9USU1FT1VUID4gMCkgc29ja2V0LnNldFRpbWVvdXQoSHR0cENsaWVudC5SRUFEX1RJTUVPVVQsICgpID0+IHNvY2tldC5kZXN0cm95KG5ldyBFcnJvcihcIlNvY2tldCB0aW1lZCBvdXQgYWZ0ZXIgXCIgKyBIdHRwQ2xpZW50LlJFQURfVElNRU9VVCArIFwiIG1zIG9mIGluYWN0aXZpdHlcIikpKTtcbiAgICAgIHJldHVybiBzb2NrZXQ7XG4gICAgfTtcbiAgICByZXR1cm4gYWdlbnQ7XG4gIH1cblxuICAvLyBkZWZlciBvbmx5IHdoZW4gYSBob3N0IGV4Y2VlZHMgdGhlIHJhdGUgbGltaXQgc2luY2UgYnJvd3NlcnMgdGhyb3R0bGUgdGltZXJzIGluIGJhY2tncm91bmQgdGFic1xuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIGF3YWl0UmF0ZUxpbWl0KGhvc3Q6IHN0cmluZykge1xuICAgIGNvbnN0IHJhdGUgPSBIdHRwQ2xpZW50Lk1BWF9SRVFVRVNUU19QRVJfU0VDT05EO1xuICAgIGlmICghKHJhdGUgPiAwKSkgdGhyb3cgbmV3IEVycm9yKFwiTWF4IHJlcXVlc3RzIHBlciBzZWNvbmQgbXVzdCBiZSBncmVhdGVyIHRoYW4gMCBvciBJbmZpbml0eVwiKTtcbiAgICBjb25zdCBzdGFydFRpbWVzID0gSHR0cENsaWVudC5SRVFVRVNUX1NUQVJUX1RJTUVTW2hvc3RdO1xuICAgIGlmIChyYXRlID09PSBJbmZpbml0eSkge1xuICAgICAgc3RhcnRUaW1lcy5sZW5ndGggPSAwO1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIGFsbG93IHdob2xlIHJlcXVlc3RzIHBlciB3aW5kb3csIGV4dGVuZGluZyB0aGUgd2luZG93IHRvIHByZXNlcnZlIGZyYWN0aW9uYWwgbGltaXRzXG4gICAgY29uc3QgbWF4UmVxdWVzdHMgPSBNYXRoLmNlaWwocmF0ZSk7XG4gICAgY29uc3Qgd2luZG93TXMgPSAxMDAwICogbWF4UmVxdWVzdHMgLyByYXRlO1xuICAgIHdoaWxlIChzdGFydFRpbWVzLmxlbmd0aCA+IDAgJiYgc3RhcnRUaW1lc1swXSArIHdpbmRvd01zIDw9IERhdGUubm93KCkpIHN0YXJ0VGltZXMuc2hpZnQoKTsgLy8gYm91bmQgaGlzdG9yeSB0byB0aGUgY3VycmVudCB3aW5kb3dcbiAgICB3aGlsZSAoc3RhcnRUaW1lcy5sZW5ndGggPj0gbWF4UmVxdWVzdHMpIHtcbiAgICAgIGNvbnN0IHdhaXRNcyA9IE1hdGguY2VpbChzdGFydFRpbWVzWzBdICsgd2luZG93TXMgLSBEYXRlLm5vdygpKTtcbiAgICAgIGlmICh3YWl0TXMgPiAwKSBhd2FpdCBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4gc2V0VGltZW91dChyZXNvbHZlLCB3YWl0TXMpKTtcbiAgICAgIGVsc2Ugc3RhcnRUaW1lcy5zaGlmdCgpO1xuICAgIH1cbiAgICBzdGFydFRpbWVzLnB1c2goRGF0ZS5ub3coKSk7XG4gIH1cblxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIHJlcXVlc3RBeGlvcyhyZXEpIHtcbiAgICBpZiAocmVxLmhlYWRlcnMpIHRocm93IG5ldyBFcnJvcihcIkN1c3RvbSBoZWFkZXJzIG5vdCBpbXBsZW1lbnRlZCBpbiBYSFIgcmVxdWVzdFwiKTsgIC8vIFRPRE9cblxuICAgIC8vIGNvbGxlY3QgcGFyYW1zIGZyb20gcmVxdWVzdCB3aGljaCBjaGFuZ2Ugb24gYXdhaXRcbiAgICBjb25zdCBtZXRob2QgPSByZXEubWV0aG9kO1xuICAgIGNvbnN0IHVyaSA9IHJlcS51cmk7XG4gICAgY29uc3QgaG9zdCA9IHJlcS5ob3N0O1xuICAgIGNvbnN0IHVzZXJuYW1lID0gcmVxLnVzZXJuYW1lO1xuICAgIGNvbnN0IHBhc3N3b3JkID0gcmVxLnBhc3N3b3JkO1xuICAgIGNvbnN0IGJvZHkgPSByZXEuYm9keTtcbiAgICBjb25zdCBwcm94eVVyaSA9IHJlcS5wcm94eVVyaTtcbiAgICBjb25zdCByZWplY3RVbmF1dGhvcml6ZWQgPSByZXEucmVqZWN0VW5hdXRob3JpemVkO1xuICAgIGNvbnN0IGlzQmluYXJ5ID0gYm9keSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXk7XG4gICAgY29uc3QgY2FuY2VsVG9rZW4gPSByZXEuY2FuY2VsVG9rZW47XG4gICAgaWYgKGNhbmNlbFRva2VuKSBjYW5jZWxUb2tlbi50aHJvd0lmUmVxdWVzdGVkKCk7XG5cbiAgICAvLyBxdWV1ZSBhbmQgdGhyb3R0bGUgcmVxdWVzdHMgdG8gZXhlY3V0ZSBpbiBzZXJpYWwgYW5kIHJhdGUgbGltaXRlZCBwZXIgaG9zdFxuICAgIGNvbnN0IHJlc3BvbnNlID0gSHR0cENsaWVudC5UQVNLX1FVRVVFU1tob3N0XS5zdWJtaXQoYXN5bmMgZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoY2FuY2VsVG9rZW4pIGNhbmNlbFRva2VuLnRocm93SWZSZXF1ZXN0ZWQoKTtcbiAgICAgIGF3YWl0IEh0dHBDbGllbnQuYXdhaXRSYXRlTGltaXQoaG9zdCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIEh0dHBDbGllbnQuYXhpb3NEaWdlc3RBdXRoUmVxdWVzdChtZXRob2QsIHVyaSwgdXNlcm5hbWUsIHBhc3N3b3JkLCBib2R5LCBwcm94eVVyaSwgcmVqZWN0VW5hdXRob3JpemVkLCBjYW5jZWxUb2tlbikudGhlbihmdW5jdGlvbihyZXNwKSB7XG4gICAgICAgICAgcmVzb2x2ZShyZXNwKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyb3I6IEF4aW9zRXJyb3IpIHtcbiAgICAgICAgICBpZiAoZXJyb3IucmVzcG9uc2U/LnN0YXR1cykgcmVzb2x2ZShlcnJvci5yZXNwb25zZSk7XG4gICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjb25zdCBtZXNzYWdlID0gXCJSZXF1ZXN0IGZhaWxlZCB3aXRob3V0IHJlc3BvbnNlOiBcIiArIG1ldGhvZCArIFwiIFwiICsgdXJpICsgXCIgZHVlIHRvIHVuZGVybHlpbmcgZXJyb3I6IFwiICsgZXJyb3IubWVzc2FnZTtcbiAgICAgICAgICAgIExpYnJhcnlVdGlscy5sb2coMiwgbWVzc2FnZSArIFwiXFxuXCIgKyBlcnJvci5zdGFjayk7IC8vIHRoZSBzdGFjayBjYW5ub3QgZm9sbG93IHRoZSBjYXVzZSBhY3Jvc3MgdGhlIHdhc20gYnJpZGdlXG4gICAgICAgICAgICBjb25zdCBjYXVzZSA9IE9iamVjdC5hc3NpZ24obmV3IEVycm9yKGVycm9yLm1lc3NhZ2UpLCB7bmFtZTogZXJyb3IubmFtZSwgY29kZTogZXJyb3IuY29kZSwgc3RhY2s6IGVycm9yLnN0YWNrfSk7IC8vIG9taXQgcmVxdWVzdCBkYXRhIGZyb20gdGhlIGNhdXNlXG4gICAgICAgICAgICByZWplY3QobmV3IEVycm9yKG1lc3NhZ2UsIHtjYXVzZX0pKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICAvLyByZWplY3QgY2FuY2VsbGF0aW9uIGltbWVkaWF0ZWx5IGV2ZW4gd2hlbiBxdWV1ZWQgYmVoaW5kIGFub3RoZXIgd2FsbGV0J3MgcmVxdWVzdFxuICAgIGxldCBvbkNhbmNlbDtcbiAgICBsZXQgcmVzcDtcbiAgICB0cnkge1xuICAgICAgcmVzcCA9IGNhbmNlbFRva2VuID8gYXdhaXQgUHJvbWlzZS5yYWNlKFtyZXNwb25zZSwgbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICBvbkNhbmNlbCA9IHJlamVjdDtcbiAgICAgICAgY2FuY2VsVG9rZW4uc3Vic2NyaWJlKG9uQ2FuY2VsKTtcbiAgICAgIH0pXSkgOiBhd2FpdCByZXNwb25zZTtcbiAgICB9IGZpbmFsbHkge1xuICAgICAgaWYgKGNhbmNlbFRva2VuKSBjYW5jZWxUb2tlbi51bnN1YnNjcmliZShvbkNhbmNlbCk7XG4gICAgfVxuXG4gICAgLy8gbm9ybWFsaXplIHJlc3BvbnNlXG4gICAgbGV0IG5vcm1hbGl6ZWRSZXNwb25zZTogYW55ID0ge307XG4gICAgbm9ybWFsaXplZFJlc3BvbnNlLnN0YXR1c0NvZGUgPSByZXNwLnN0YXR1cztcbiAgICBub3JtYWxpemVkUmVzcG9uc2Uuc3RhdHVzVGV4dCA9IHJlc3Auc3RhdHVzVGV4dDtcbiAgICBub3JtYWxpemVkUmVzcG9uc2UuaGVhZGVycyA9IHsuLi5yZXNwLmhlYWRlcnN9O1xuICAgIG5vcm1hbGl6ZWRSZXNwb25zZS5ib2R5ID0gaXNCaW5hcnkgPyBuZXcgVWludDhBcnJheShyZXNwLmRhdGEpIDogcmVzcC5kYXRhO1xuICAgIGlmIChub3JtYWxpemVkUmVzcG9uc2UuYm9keSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSBub3JtYWxpemVkUmVzcG9uc2UuYm9keSA9IG5ldyBVaW50OEFycmF5KG5vcm1hbGl6ZWRSZXNwb25zZS5ib2R5KTsgIC8vIGhhbmRsZSBlbXB0eSBiaW5hcnkgcmVxdWVzdFxuICAgIHJldHVybiBub3JtYWxpemVkUmVzcG9uc2U7XG4gIH1cblxuICBwcm90ZWN0ZWQgc3RhdGljIGF4aW9zRGlnZXN0QXV0aFJlcXVlc3QgPSBhc3luYyBmdW5jdGlvbihtZXRob2QsIHVybCwgdXNlcm5hbWUsIHBhc3N3b3JkLCBib2R5LCBwcm94eVVyaT8sIHJlamVjdFVuYXV0aG9yaXplZD8sIGNhbmNlbFRva2VuPykge1xuICAgIGlmICh0eXBlb2YgQ3J5cHRvSlMgPT09ICd1bmRlZmluZWQnICYmIHR5cGVvZiByZXF1aXJlID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICB2YXIgQ3J5cHRvSlMgPSByZXF1aXJlKCdjcnlwdG8tanMnKTtcbiAgICB9XG5cbiAgICAvLyByb3V0ZSB0aHJvdWdoIHNvY2tzIHByb3h5IGlmIGNvbmZpZ3VyZWQsIG90aGVyd2lzZSB1c2UgZGlyZWN0IGFnZW50c1xuICAgIGNvbnN0IHNvY2tzQWdlbnQgPSBwcm94eVVyaSA/IEh0dHBDbGllbnQuZ2V0U29ja3NBZ2VudChwcm94eVVyaSwgcmVqZWN0VW5hdXRob3JpemVkICE9PSBmYWxzZSkgOiB1bmRlZmluZWQ7XG4gICAgY29uc3QgaHR0cEFnZW50ID0gc29ja3NBZ2VudCA/PyAodXJsLnN0YXJ0c1dpdGgoXCJodHRwc1wiKSA/IHVuZGVmaW5lZCA6IEh0dHBDbGllbnQuZ2V0SHR0cEFnZW50KCkpO1xuICAgIGNvbnN0IGh0dHBzQWdlbnQgPSBzb2Nrc0FnZW50ID8/ICh1cmwuc3RhcnRzV2l0aChcImh0dHBzXCIpID8gSHR0cENsaWVudC5nZXRIdHRwc0FnZW50KHJlamVjdFVuYXV0aG9yaXplZCkgOiB1bmRlZmluZWQpO1xuXG4gICAgY29uc3QgZ2VuZXJhdGVDbm9uY2UgPSBmdW5jdGlvbigpOiBzdHJpbmcge1xuICAgICAgY29uc3QgY2hhcmFjdGVycyA9ICdhYmNkZWYwMTIzNDU2Nzg5JztcbiAgICAgIGxldCB0b2tlbiA9ICcnO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHJhbmROdW0gPSBNYXRoLnJvdW5kKE1hdGgucmFuZG9tKCkgKiBjaGFyYWN0ZXJzLmxlbmd0aCk7XG4gICAgICAgIHRva2VuICs9IGNoYXJhY3RlcnMuc2xpY2UocmFuZE51bSwgcmFuZE51bSsxKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0b2tlbjtcbiAgICB9XG5cbiAgICBsZXQgY291bnQgPSAwO1xuICAgIHJldHVybiBheGlvcy5yZXF1ZXN0KHtcbiAgICAgIHVybDogdXJsLFxuICAgICAgbWV0aG9kOiBtZXRob2QsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgIH0sXG4gICAgICByZXNwb25zZVR5cGU6IGJvZHkgaW5zdGFuY2VvZiBVaW50OEFycmF5ID8gJ2FycmF5YnVmZmVyJyA6IHVuZGVmaW5lZCxcbiAgICAgIGh0dHBBZ2VudDogaHR0cEFnZW50LFxuICAgICAgaHR0cHNBZ2VudDogaHR0cHNBZ2VudCxcbiAgICAgIHByb3h5OiBzb2Nrc0FnZW50ID8gZmFsc2UgOiB1bmRlZmluZWQsIC8vIGVudiBwcm94aWVzIG11c3Qgbm90IGJ5cGFzcyB0aGUgc29ja3MgYWdlbnRcbiAgICAgIHRpbWVvdXQ6IEh0dHBDbGllbnQuZ2V0Tm9uQWdlbnRUaW1lb3V0KCksXG4gICAgICBjYW5jZWxUb2tlbjogY2FuY2VsVG9rZW4sXG4gICAgICBkYXRhOiBib2R5LFxuICAgICAgdHJhbnNmb3JtUmVzcG9uc2U6IHJlcyA9PiByZXMsXG4gICAgICBhZGFwdGVyOiBHZW5VdGlscy5pc0Rlbm8oKSA/IFsnZmV0Y2gnXSA6IFsnaHR0cCcsICd4aHInLCAnZmV0Y2gnXVxuICAgIH0pLmNhdGNoKGFzeW5jIChlcnIpID0+IHtcbiAgICAgIGlmIChlcnIucmVzcG9uc2U/LnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgIGxldCBhdXRoSGVhZGVyID0gZXJyLnJlc3BvbnNlLmhlYWRlcnNbJ3d3dy1hdXRoZW50aWNhdGUnXS5yZXBsYWNlKC8sXFxzRGlnZXN0LiovLCBcIlwiKTtcbiAgICAgICAgaWYgKCFhdXRoSGVhZGVyKSB7XG4gICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGlnZXN0IHFvcD1cImF1dGhcIixhbGdvcml0aG09TUQ1LHJlYWxtPVwibW9uZXJvLXJwY1wiLG5vbmNlPVwiaEJaMnJaSXhFbHY0bHFDUnJVeWxYQT09XCIsc3RhbGU9ZmFsc2VcbiAgICAgICAgY29uc3QgYXV0aEhlYWRlck1hcCA9IGF1dGhIZWFkZXIucmVwbGFjZShcIkRpZ2VzdCBcIiwgXCJcIikucmVwbGFjZUFsbCgnXCInLCBcIlwiKS5zcGxpdChcIixcIikucmVkdWNlKChwcmV2LCBjdXJyKSA9PiAoey4uLnByZXYsIFtjdXJyLnNwbGl0KFwiPVwiKVswXV06IGN1cnIuc3BsaXQoXCI9XCIpLnNsaWNlKDEpLmpvaW4oJz0nKX0pLCB7fSlcblxuICAgICAgICArK2NvdW50O1xuXG4gICAgICAgIGNvbnN0IGNub25jZSA9IGdlbmVyYXRlQ25vbmNlKCk7XG4gICAgICAgIGNvbnN0IEhBMSA9IENyeXB0b0pTLk1ENSh1c2VybmFtZSsnOicrYXV0aEhlYWRlck1hcC5yZWFsbSsnOicrcGFzc3dvcmQpLnRvU3RyaW5nKCk7XG4gICAgICAgIGNvbnN0IEhBMiA9IENyeXB0b0pTLk1ENShtZXRob2QrJzonK3VybCkudG9TdHJpbmcoKTtcblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IENyeXB0b0pTLk1ENShIQTErJzonK1xuICAgICAgICAgIGF1dGhIZWFkZXJNYXAubm9uY2UrJzonK1xuICAgICAgICAgICgnMDAwMDAwMDAnICsgY291bnQpLnNsaWNlKC04KSsnOicrXG4gICAgICAgICAgY25vbmNlKyc6JytcbiAgICAgICAgICBhdXRoSGVhZGVyTWFwLnFvcCsnOicrXG4gICAgICAgICAgSEEyKS50b1N0cmluZygpO1xuICAgICAgICBjb25zdCBkaWdlc3RBdXRoSGVhZGVyID0gJ0RpZ2VzdCcrJyAnK1xuICAgICAgICAgICd1c2VybmFtZT1cIicrdXNlcm5hbWUrJ1wiLCAnK1xuICAgICAgICAgICdyZWFsbT1cIicrYXV0aEhlYWRlck1hcC5yZWFsbSsnXCIsICcrXG4gICAgICAgICAgJ25vbmNlPVwiJythdXRoSGVhZGVyTWFwLm5vbmNlKydcIiwgJytcbiAgICAgICAgICAndXJpPVwiJyt1cmwrJ1wiLCAnK1xuICAgICAgICAgICdyZXNwb25zZT1cIicrcmVzcG9uc2UrJ1wiLCAnK1xuICAgICAgICAgICdvcGFxdWU9XCInKyhhdXRoSGVhZGVyTWFwLm9wYXF1ZSA/PyBudWxsKSsnXCIsICcrXG4gICAgICAgICAgJ3FvcD0nK2F1dGhIZWFkZXJNYXAucW9wKycsICcrXG4gICAgICAgICAgJ25jPScrKCcwMDAwMDAwMCcgKyBjb3VudCkuc2xpY2UoLTgpKycsICcrXG4gICAgICAgICAgJ2Nub25jZT1cIicrY25vbmNlKydcIic7XG5cbiAgICAgICAgY29uc3QgZmluYWxSZXNwb25zZSA9IGF3YWl0IGF4aW9zLnJlcXVlc3Qoe1xuICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogZGlnZXN0QXV0aEhlYWRlcixcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlc3BvbnNlVHlwZTogYm9keSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkgPyAnYXJyYXlidWZmZXInIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGh0dHBBZ2VudDogaHR0cEFnZW50LFxuICAgICAgICAgIGh0dHBzQWdlbnQ6IGh0dHBzQWdlbnQsXG4gICAgICAgICAgcHJveHk6IHNvY2tzQWdlbnQgPyBmYWxzZSA6IHVuZGVmaW5lZCwgLy8gZW52IHByb3hpZXMgbXVzdCBub3QgYnlwYXNzIHRoZSBzb2NrcyBhZ2VudFxuICAgICAgICAgIHRpbWVvdXQ6IEh0dHBDbGllbnQuZ2V0Tm9uQWdlbnRUaW1lb3V0KCksXG4gICAgICAgICAgY2FuY2VsVG9rZW46IGNhbmNlbFRva2VuLFxuICAgICAgICAgIGRhdGE6IGJvZHksXG4gICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2U6IHJlcyA9PiByZXMsXG4gICAgICAgICAgYWRhcHRlcjogR2VuVXRpbHMuaXNEZW5vKCkgPyBbJ2ZldGNoJ10gOiBbJ2h0dHAnLCAneGhyJywgJ2ZldGNoJ11cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZpbmFsUmVzcG9uc2U7XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgIHRocm93IGVycjtcbiAgICB9KTtcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsU0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsYUFBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsV0FBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsS0FBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUksTUFBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUssTUFBQSxHQUFBTixzQkFBQSxDQUFBQyxPQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNlLE1BQU1NLFVBQVUsQ0FBQzs7RUFFOUIsT0FBT0MsdUJBQXVCLEdBQUcsRUFBRSxDQUFDLENBQUM7O0VBRXJDO0VBQ0EsT0FBaUJDLGVBQWUsR0FBRztJQUNqQ0MsTUFBTSxFQUFFLEtBQUs7SUFDYkMsdUJBQXVCLEVBQUUsS0FBSztJQUM5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