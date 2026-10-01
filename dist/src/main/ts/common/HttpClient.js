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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9MaWJyYXJ5VXRpbHMiLCJfVGhyZWFkUG9vbCIsIl9odHRwIiwiX2h0dHBzIiwiX2F4aW9zIiwiSHR0cENsaWVudCIsIk1BWF9SRVFVRVNUU19QRVJfU0VDT05EIiwiREVGQVVMVF9SRVFVRVNUIiwibWV0aG9kIiwicmVzb2x2ZVdpdGhGdWxsUmVzcG9uc2UiLCJyZWplY3RVbmF1dGhvcml6ZWQiLCJSRVFVRVNUX1NUQVJUX1RJTUVTIiwiVEFTS19RVUVVRVMiLCJDT05ORUNUX1RJTUVPVVQiLCJSRUFEX1RJTUVPVVQiLCJTT0NLU19BR0VOVFMiLCJyZXF1ZXN0IiwicHJveHlUb1dvcmtlciIsIkxpYnJhcnlVdGlscyIsImludm9rZVdvcmtlciIsInVuZGVmaW5lZCIsImVyciIsIm1lc3NhZ2UiLCJsZW5ndGgiLCJjaGFyQXQiLCJwYXJzZWQiLCJKU09OIiwicGFyc2UiLCJzdGF0dXNNZXNzYWdlIiwic3RhdHVzQ29kZSIsIk9iamVjdCIsImFzc2lnbiIsImhvc3QiLCJVUkwiLCJ1cmkiLCJFcnJvciIsImJvZHkiLCJUaHJlYWRQb29sIiwicmVxdWVzdFByb21pc2UiLCJyZXF1ZXN0QXhpb3MiLCJ0aW1lb3V0IiwiR2VuVXRpbHMiLCJleGVjdXRlV2l0aFRpbWVvdXQiLCJjcmVhdGVDYW5jZWxUb2tlbiIsImF4aW9zIiwiQ2FuY2VsVG9rZW4iLCJzb3VyY2UiLCJnZXRIdHRwQWdlbnQiLCJIVFRQX0FHRU5UIiwiYXBwbHlUaW1lb3V0cyIsImh0dHAiLCJBZ2VudCIsImtlZXBBbGl2ZSIsImZhbWlseSIsImdldEh0dHBzQWdlbnQiLCJrZXkiLCJodHRwcyIsImdldFNvY2tzQWdlbnQiLCJwcm94eVVyaSIsImlzQnJvd3NlciIsImlzRGVubyIsIlNvY2tzUHJveHlBZ2VudCIsIm5vcm1hbGl6ZVVyaSIsImF1dGgiLCJ1c2VybmFtZSIsInBhc3N3b3JkIiwiTWF0aCIsIm1heCIsImdldE5vbkFnZW50VGltZW91dCIsImFnZW50IiwiY3JlYXRlQ29ubmVjdGlvbiIsImJpbmQiLCJvcHRpb25zIiwiY2FsbGJhY2siLCJzb2NrZXQiLCJ0aW1lciIsInNldFRpbWVvdXQiLCJkZXN0cm95IiwiY2xlYXJDb25uZWN0VGltZXIiLCJjbGVhclRpbWVvdXQiLCJvbmNlIiwiYXdhaXRSYXRlTGltaXQiLCJyYXRlIiwic3RhcnRUaW1lcyIsIkluZmluaXR5IiwibWF4UmVxdWVzdHMiLCJjZWlsIiwid2luZG93TXMiLCJEYXRlIiwibm93Iiwic2hpZnQiLCJ3YWl0TXMiLCJQcm9taXNlIiwicmVzb2x2ZSIsInB1c2giLCJyZXEiLCJoZWFkZXJzIiwiaXNCaW5hcnkiLCJVaW50OEFycmF5IiwiY2FuY2VsVG9rZW4iLCJ0aHJvd0lmUmVxdWVzdGVkIiwicmVzcG9uc2UiLCJzdWJtaXQiLCJyZWplY3QiLCJheGlvc0RpZ2VzdEF1dGhSZXF1ZXN0IiwidGhlbiIsInJlc3AiLCJjYXRjaCIsImVycm9yIiwic3RhdHVzIiwic3RhY2siLCJvbkNhbmNlbCIsInJhY2UiLCJzdWJzY3JpYmUiLCJ1bnN1YnNjcmliZSIsIm5vcm1hbGl6ZWRSZXNwb25zZSIsInN0YXR1c1RleHQiLCJkYXRhIiwiQXJyYXlCdWZmZXIiLCJ1cmwiLCJDcnlwdG9KUyIsInNvY2tzQWdlbnQiLCJodHRwQWdlbnQiLCJzdGFydHNXaXRoIiwiaHR0cHNBZ2VudCIsImdlbmVyYXRlQ25vbmNlIiwiY2hhcmFjdGVycyIsInRva2VuIiwiaSIsInJhbmROdW0iLCJyb3VuZCIsInJhbmRvbSIsInNsaWNlIiwiY291bnQiLCJyZXNwb25zZVR5cGUiLCJwcm94eSIsInRyYW5zZm9ybVJlc3BvbnNlIiwicmVzIiwiYWRhcHRlciIsImF1dGhIZWFkZXIiLCJyZXBsYWNlIiwiYXV0aEhlYWRlck1hcCIsInJlcGxhY2VBbGwiLCJzcGxpdCIsInJlZHVjZSIsInByZXYiLCJjdXJyIiwiam9pbiIsImNub25jZSIsIkhBMSIsIk1ENSIsInJlYWxtIiwidG9TdHJpbmciLCJIQTIiLCJub25jZSIsInFvcCIsImRpZ2VzdEF1dGhIZWFkZXIiLCJvcGFxdWUiLCJmaW5hbFJlc3BvbnNlIiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9jb21tb24vSHR0cENsaWVudC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4vR2VuVXRpbHNcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgVGhyZWFkUG9vbCBmcm9tIFwiLi9UaHJlYWRQb29sXCI7XG5pbXBvcnQgaHR0cCBmcm9tIFwiaHR0cFwiO1xuaW1wb3J0IGh0dHBzIGZyb20gXCJodHRwc1wiO1xuaW1wb3J0IGF4aW9zLCB7IEF4aW9zRXJyb3IgfSBmcm9tIFwiYXhpb3NcIjtcblxuLyoqXG4gKiBIYW5kbGUgSFRUUCByZXF1ZXN0cyB3aXRoIGEgdW5pZm9ybSBpbnRlcmZhY2UuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEh0dHBDbGllbnQge1xuXG4gIHN0YXRpYyBNQVhfUkVRVUVTVFNfUEVSX1NFQ09ORCA9IDUwOyAvLyBwb3NpdGl2ZSByZXF1ZXN0cyBwZXIgc2Vjb25kLCBvciBJbmZpbml0eSB0byBkaXNhYmxlIHRocm90dGxpbmdcblxuICAvLyBkZWZhdWx0IHJlcXVlc3QgY29uZmlnXG4gIHByb3RlY3RlZCBzdGF0aWMgREVGQVVMVF9SRVFVRVNUID0ge1xuICAgIG1ldGhvZDogXCJHRVRcIixcbiAgICByZXNvbHZlV2l0aEZ1bGxSZXNwb25zZTogZmFsc2UsXG4gICAgcmVqZWN0VW5hdXRob3JpemVkOiB0cnVlXG4gIH1cblxuICAvLyByYXRlIGxpbWl0IHJlcXVlc3RzIHBlciBob3N0XG4gIHByb3RlY3RlZCBzdGF0aWMgUkVRVUVTVF9TVEFSVF9USU1FUyA9IFtdOyAvLyByZWNlbnQgcmVxdWVzdCBzdGFydCB0aW1lcyBwZXIgaG9zdFxuICBwcm90ZWN0ZWQgc3RhdGljIFRBU0tfUVVFVUVTID0gW107XG4gIHByb3RlY3RlZCBzdGF0aWMgQ09OTkVDVF9USU1FT1VUID0gMTgwMDAwOyAvLyBtcyB0byBlc3RhYmxpc2ggYSBjb25uZWN0aW9uLCBtYXRjaGluZyBtb25lcm8tamF2YSdzIGRlZmF1bHQgKDAgdG8gZGlzYWJsZSlcbiAgcHJvdGVjdGVkIHN0YXRpYyBSRUFEX1RJTUVPVVQgPSAxODAwMDA7IC8vIG1zIG9mIHNvY2tldCBpbmFjdGl2aXR5IGJlZm9yZSB0aW1pbmcgb3V0XG5cbiAgcHJvdGVjdGVkIHN0YXRpYyBIVFRQX0FHRU5UOiBhbnk7XG4gIHByb3RlY3RlZCBzdGF0aWMgSFRUUFNfQUdFTlQ6IGFueTtcbiAgcHJvdGVjdGVkIHN0YXRpYyBIVFRQU19BR0VOVF9VTlZFUklGSUVEOiBhbnk7XG4gIHByb3RlY3RlZCBzdGF0aWMgU09DS1NfQUdFTlRTOiBhbnkgPSB7fTsgLy8gc2hhcmVkIHNvY2tzIGFnZW50cyBrZXllZCBieSBwcm94eSB1cmkgYW5kIHNzbCBjb25maWdcblxuICAvKipcbiAgICogPHA+TWFrZSBhIEhUVFAgcmVxdWVzdC48cD5cbiAgICogXG4gICAqIEBwYXJhbSB7b2JqZWN0fSByZXF1ZXN0IC0gY29uZmlndXJlcyB0aGUgcmVxdWVzdCB0byBtYWtlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZXF1ZXN0Lm1ldGhvZCAtIEhUVFAgbWV0aG9kIChcIkdFVFwiLCBcIlBVVFwiLCBcIlBPU1RcIiwgXCJERUxFVEVcIiwgZXRjKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcmVxdWVzdC51cmkgLSB1cmkgdG8gcmVxdWVzdFxuICAgKiBAcGFyYW0ge3N0cmluZ3xVaW50OEFycmF5fG9iamVjdH0gcmVxdWVzdC5ib2R5IC0gcmVxdWVzdCBib2R5XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcmVxdWVzdC51c2VybmFtZV0gLSB1c2VybmFtZSB0byBhdXRoZW50aWNhdGUgdGhlIHJlcXVlc3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3JlcXVlc3QucGFzc3dvcmRdIC0gcGFzc3dvcmQgdG8gYXV0aGVudGljYXRlIHRoZSByZXF1ZXN0IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtvYmplY3R9IFtyZXF1ZXN0LmhlYWRlcnNdIC0gaGVhZGVycyB0byBhZGQgdG8gdGhlIHJlcXVlc3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3JlcXVlc3QucHJveHlVcmldIC0gcHJveHkgdGhlIHJlcXVlc3QgdGhyb3VnaCBhIFNPQ0tTNSBzZXJ2ZXIsIGUuZy4gYSBsb2NhbCBUb3IgcHJveHkgKE5vZGUuanMgb25seSwgb3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3JlcXVlc3QucmVzb2x2ZVdpdGhGdWxsUmVzcG9uc2VdIC0gcmV0dXJuIGZ1bGwgcmVzcG9uc2UgaWYgdHJ1ZSwgZWxzZSBib2R5IG9ubHkgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3JlcXVlc3QucmVqZWN0VW5hdXRob3JpemVkXSAtIHdoZXRoZXIgb3Igbm90IHRvIHJlamVjdCBzZWxmLXNpZ25lZCBjZXJ0aWZpY2F0ZXMgKGRlZmF1bHQgdHJ1ZSlcbiAgICogQHBhcmFtIHtvYmplY3R9IFtyZXF1ZXN0LmNhbmNlbFRva2VuXSAtIHRva2VuIHRvIGNhbmNlbCBhIHF1ZXVlZCBvciBhY3RpdmUgcmVxdWVzdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByZXF1ZXN0LnRpbWVvdXQgLSBtYXhpbXVtIHRpbWUgYWxsb3dlZCBpbiBtaWxsaXNlY29uZHNcbiAgICogQHBhcmFtIHtudW1iZXJ9IHJlcXVlc3QucHJveHlUb1dvcmtlciAtIHByb3h5IHJlcXVlc3QgdG8gd29ya2VyIHRocmVhZFxuICAgKiBAcmV0dXJuIHtvYmplY3R9IHJlc3BvbnNlIC0gdGhlIHJlc3BvbnNlIG9iamVjdFxuICAgKiBAcmV0dXJuIHtzdHJpbmd8VWludDhBcnJheXxvYmplY3R9IHJlc3BvbnNlLmJvZHkgLSB0aGUgcmVzcG9uc2UgYm9keVxuICAgKiBAcmV0dXJuIHtudW1iZXJ9IHJlc3BvbnNlLnN0YXR1c0NvZGUgLSB0aGUgcmVzcG9uc2UgY29kZVxuICAgKiBAcmV0dXJuIHtTdHJpbmd9IHJlc3BvbnNlLnN0YXR1c1RleHQgLSB0aGUgcmVzcG9uc2UgbWVzc2FnZVxuICAgKiBAcmV0dXJuIHtvYmplY3R9IHJlc3BvbnNlLmhlYWRlcnMgLSB0aGUgcmVzcG9uc2UgaGVhZGVyc1xuICAgKi9cbiAgc3RhdGljIGFzeW5jIHJlcXVlc3QocmVxdWVzdCkge1xuICAgIC8vIHByb3h5IHRvIHdvcmtlciBpZiBjb25maWd1cmVkXG4gICAgaWYgKHJlcXVlc3QucHJveHlUb1dvcmtlcikge1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIGF3YWl0IExpYnJhcnlVdGlscy5pbnZva2VXb3JrZXIodW5kZWZpbmVkLCBcImh0dHBSZXF1ZXN0XCIsIHJlcXVlc3QpO1xuICAgICAgfSBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgaWYgKGVyci5tZXNzYWdlLmxlbmd0aCA+IDAgJiYgZXJyLm1lc3NhZ2UuY2hhckF0KDApID09PSBcIntcIikge1xuICAgICAgICAgIGxldCBwYXJzZWQgPSBKU09OLnBhcnNlKGVyci5tZXNzYWdlKTtcbiAgICAgICAgICBlcnIubWVzc2FnZSA9IHBhcnNlZC5zdGF0dXNNZXNzYWdlO1xuICAgICAgICAgIGVyci5zdGF0dXNDb2RlID0gcGFyc2VkLnN0YXR1c0NvZGU7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGFzc2lnbiBkZWZhdWx0c1xuICAgIHJlcXVlc3QgPSBPYmplY3QuYXNzaWduKHt9LCBIdHRwQ2xpZW50LkRFRkFVTFRfUkVRVUVTVCwgcmVxdWVzdCk7XG5cbiAgICAvLyB2YWxpZGF0ZSByZXF1ZXN0XG4gICAgdHJ5IHsgcmVxdWVzdC5ob3N0ID0gbmV3IFVSTChyZXF1ZXN0LnVyaSkuaG9zdDsgfSAvLyBob3N0bmFtZTpwb3J0XG4gICAgY2F0Y2ggKGVycikgeyB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIHJlcXVlc3QgVVJMOiBcIiArIHJlcXVlc3QudXJpKTsgfVxuICAgIGlmIChyZXF1ZXN0LmJvZHkgJiYgISh0eXBlb2YgcmVxdWVzdC5ib2R5ID09PSBcInN0cmluZ1wiIHx8IHR5cGVvZiByZXF1ZXN0LmJvZHkgPT09IFwib2JqZWN0XCIpKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJSZXF1ZXN0IGJvZHkgdHlwZSBpcyBub3Qgc3RyaW5nIG9yIG9iamVjdFwiKTtcbiAgICB9XG5cbiAgICAvLyBpbml0aWFsaXplIG9uZSB0YXNrIHF1ZXVlIHBlciBob3N0XG4gICAgaWYgKCFIdHRwQ2xpZW50LlRBU0tfUVVFVUVTW3JlcXVlc3QuaG9zdF0pIEh0dHBDbGllbnQuVEFTS19RVUVVRVNbcmVxdWVzdC5ob3N0XSA9IG5ldyBUaHJlYWRQb29sKDEpO1xuXG4gICAgLy8gaW5pdGlhbGl6ZSBvbmUgcmF0ZSBsaW1pdCB3aW5kb3cgcGVyIGhvc3RcbiAgICBpZiAoIUh0dHBDbGllbnQuUkVRVUVTVF9TVEFSVF9USU1FU1tyZXF1ZXN0Lmhvc3RdKSBIdHRwQ2xpZW50LlJFUVVFU1RfU1RBUlRfVElNRVNbcmVxdWVzdC5ob3N0XSA9IFtdO1xuXG4gICAgLy8gY29ubmVjdGlvbiBhbmQgcmVzcG9uc2UgaW5hY3Rpdml0eSBhcmUgYm91bmRlZCBpbiB0aGUgYWdlbnRzXG4gICAgbGV0IHJlcXVlc3RQcm9taXNlID0gSHR0cENsaWVudC5yZXF1ZXN0QXhpb3MocmVxdWVzdCk7XG4gICAgcmV0dXJuIHJlcXVlc3QudGltZW91dCA/IEdlblV0aWxzLmV4ZWN1dGVXaXRoVGltZW91dChyZXF1ZXN0UHJvbWlzZSwgcmVxdWVzdC50aW1lb3V0KSA6IHJlcXVlc3RQcm9taXNlO1xuICB9XG5cbiAgc3RhdGljIGNyZWF0ZUNhbmNlbFRva2VuKCkge1xuICAgIHJldHVybiBheGlvcy5DYW5jZWxUb2tlbi5zb3VyY2UoKTtcbiAgfVxuXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgSEVMUEVSUyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cblxuICAvKipcbiAgICogR2V0IGEgc2luZ2xldG9uIGluc3RhbmNlIG9mIGFuIEhUVFAgY2xpZW50IHRvIHNoYXJlLlxuICAgKlxuICAgKiBAcmV0dXJuIHtodHRwLkFnZW50fSBhIHNoYXJlZCBhZ2VudCBmb3IgbmV0d29yayByZXF1ZXN0cyBhbW9uZyBsaWJyYXJ5IGluc3RhbmNlc1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBnZXRIdHRwQWdlbnQoKSB7XG4gICAgaWYgKCFIdHRwQ2xpZW50LkhUVFBfQUdFTlQpIEh0dHBDbGllbnQuSFRUUF9BR0VOVCA9IEh0dHBDbGllbnQuYXBwbHlUaW1lb3V0cyhuZXcgaHR0cC5BZ2VudCh7XG4gICAgICBrZWVwQWxpdmU6IHRydWUsXG4gICAgICBmYW1pbHk6IDQgLy8gdXNlIElQdjRcbiAgICB9KSk7XG4gICAgcmV0dXJuIEh0dHBDbGllbnQuSFRUUF9BR0VOVDtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgYSBzaGFyZWQgSFRUUFMgY2xpZW50IGZvciB0aGUgZ2l2ZW4gU1NMIGNvbmZpZ3VyYXRpb24uXG4gICAqXG4gICAqIEByZXR1cm4ge2h0dHBzLkFnZW50fSBhIHNoYXJlZCBhZ2VudCBmb3IgbmV0d29yayByZXF1ZXN0cyBhbW9uZyBsaWJyYXJ5IGluc3RhbmNlc1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBnZXRIdHRwc0FnZW50KHJlamVjdFVuYXV0aG9yaXplZD86IGJvb2xlYW4pIHtcbiAgICByZWplY3RVbmF1dGhvcml6ZWQgPSByZWplY3RVbmF1dGhvcml6ZWQgIT09IGZhbHNlO1xuICAgIGNvbnN0IGtleSA9IHJlamVjdFVuYXV0aG9yaXplZCA/IFwiSFRUUFNfQUdFTlRcIiA6IFwiSFRUUFNfQUdFTlRfVU5WRVJJRklFRFwiO1xuICAgIGlmICghSHR0cENsaWVudFtrZXldKSBIdHRwQ2xpZW50W2tleV0gPSBIdHRwQ2xpZW50LmFwcGx5VGltZW91dHMobmV3IGh0dHBzLkFnZW50KHtcbiAgICAgIGtlZXBBbGl2ZTogdHJ1ZSxcbiAgICAgIGZhbWlseTogNCwgLy8gdXNlIElQdjRcbiAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogcmVqZWN0VW5hdXRob3JpemVkXG4gICAgfSkpO1xuICAgIHJldHVybiBIdHRwQ2xpZW50W2tleV07XG4gIH1cblxuICAvKipcbiAgICogR2V0IGEgc2luZ2xldG9uIGFnZW50IHRvIHJvdXRlIHJlcXVlc3RzIHRocm91Z2ggYSBTT0NLUzUgcHJveHk7IGhvc3RuYW1lcyBhcmUgcmVzb2x2ZWQgYnkgdGhlIHByb3h5IHRvIGF2b2lkIEROUyBsZWFrcy5cbiAgICpcbiAgICogQHJldHVybiB7U29ja3NQcm94eUFnZW50fSBhIHNoYXJlZCBhZ2VudCBmb3IgdGhlIGdpdmVuIHByb3h5IGFuZCBzc2wgY29uZmlnXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGdldFNvY2tzQWdlbnQocHJveHlVcmk6IHN0cmluZywgcmVqZWN0VW5hdXRob3JpemVkOiBib29sZWFuKSB7XG4gICAgaWYgKEdlblV0aWxzLmlzQnJvd3NlcigpIHx8IEdlblV0aWxzLmlzRGVubygpKSB0aHJvdyBuZXcgRXJyb3IoXCJQcm94aWVkIHJlcXVlc3RzIGFyZSBvbmx5IHN1cHBvcnRlZCBpbiBOb2RlLmpzXCIpO1xuICAgIGNvbnN0IGtleSA9IHByb3h5VXJpICsgXCJfXCIgKyByZWplY3RVbmF1dGhvcml6ZWQ7XG4gICAgaWYgKCFIdHRwQ2xpZW50LlNPQ0tTX0FHRU5UU1trZXldKSB7XG4gICAgICBjb25zdCB7IFNvY2tzUHJveHlBZ2VudCB9ID0gcmVxdWlyZShcInNvY2tzLXByb3h5LWFnZW50XCIpO1xuICAgICAgY29uc3QgcGFyc2VkID0gbmV3IFVSTChHZW5VdGlscy5ub3JtYWxpemVVcmkocHJveHlVcmkpKTtcbiAgICAgIGNvbnN0IGF1dGggPSBwYXJzZWQudXNlcm5hbWUgPyBwYXJzZWQudXNlcm5hbWUgKyBcIjpcIiArIHBhcnNlZC5wYXNzd29yZCArIFwiQFwiIDogXCJcIjtcbiAgICAgIEh0dHBDbGllbnQuU09DS1NfQUdFTlRTW2tleV0gPSBuZXcgU29ja3NQcm94eUFnZW50KFwic29ja3M1aDovL1wiICsgYXV0aCArIHBhcnNlZC5ob3N0LCB7IC8vIHNvY2tzIGVzdGFibGlzaG1lbnQgYW5kIGluYWN0aXZpdHkgYXJlIGJvdW5kZWQgYnkgdGltZW91dFxuICAgICAgICBrZWVwQWxpdmU6IHRydWUsXG4gICAgICAgIHRpbWVvdXQ6IE1hdGgubWF4KEh0dHBDbGllbnQuQ09OTkVDVF9USU1FT1VULCBIdHRwQ2xpZW50LlJFQURfVElNRU9VVCksXG4gICAgICAgIHJlamVjdFVuYXV0aG9yaXplZDogcmVqZWN0VW5hdXRob3JpemVkXG4gICAgICB9KTtcbiAgICB9XG4gICAgcmV0dXJuIEh0dHBDbGllbnQuU09DS1NfQUdFTlRTW2tleV07XG4gIH1cblxuICAvLyBib3VuZCB0aGUgd2hvbGUgcmVxdWVzdCB3aGVyZSBub2RlIGFnZW50IHNvY2tldCB0aW1lb3V0cyBkbyBub3QgYXBwbHlcbiAgcHJvdGVjdGVkIHN0YXRpYyBnZXROb25BZ2VudFRpbWVvdXQoKSB7XG4gICAgcmV0dXJuIEdlblV0aWxzLmlzQnJvd3NlcigpIHx8IEdlblV0aWxzLmlzRGVubygpID8gTWF0aC5tYXgoSHR0cENsaWVudC5DT05ORUNUX1RJTUVPVVQsIEh0dHBDbGllbnQuUkVBRF9USU1FT1VUKSA6IDA7XG4gIH1cblxuICAvLyBib3VuZCB0aGUgY29ubmVjdGlvbiBwaGFzZSBhbmQgc29ja2V0IGluYWN0aXZpdHlcbiAgcHJvdGVjdGVkIHN0YXRpYyBhcHBseVRpbWVvdXRzKGFnZW50OiBhbnkpIHtcbiAgICBpZiAodHlwZW9mIGFnZW50LmNyZWF0ZUNvbm5lY3Rpb24gIT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIGFnZW50OyAvLyBuby1vcCBpbiBicm93c2VyIHNoaW1zXG4gICAgY29uc3QgY3JlYXRlQ29ubmVjdGlvbiA9IGFnZW50LmNyZWF0ZUNvbm5lY3Rpb24uYmluZChhZ2VudCk7XG4gICAgYWdlbnQuY3JlYXRlQ29ubmVjdGlvbiA9IGZ1bmN0aW9uKG9wdGlvbnMsIGNhbGxiYWNrKSB7XG4gICAgICBjb25zdCBzb2NrZXQgPSBjcmVhdGVDb25uZWN0aW9uKG9wdGlvbnMsIGNhbGxiYWNrKTtcbiAgICAgIGlmIChIdHRwQ2xpZW50LkNPTk5FQ1RfVElNRU9VVCA+IDApIHtcbiAgICAgICAgY29uc3QgdGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHNvY2tldC5kZXN0cm95KG5ldyBFcnJvcihcIkNvbm5lY3Rpb24gdGltZWQgb3V0IGluIFwiICsgSHR0cENsaWVudC5DT05ORUNUX1RJTUVPVVQgKyBcIiBtc1wiKSksIEh0dHBDbGllbnQuQ09OTkVDVF9USU1FT1VUKTtcbiAgICAgICAgY29uc3QgY2xlYXJDb25uZWN0VGltZXIgPSAoKSA9PiBjbGVhclRpbWVvdXQodGltZXIpO1xuICAgICAgICBzb2NrZXQub25jZShcImNvbm5lY3RcIiwgY2xlYXJDb25uZWN0VGltZXIpLm9uY2UoXCJzZWN1cmVDb25uZWN0XCIsIGNsZWFyQ29ubmVjdFRpbWVyKS5vbmNlKFwiZXJyb3JcIiwgY2xlYXJDb25uZWN0VGltZXIpLm9uY2UoXCJjbG9zZVwiLCBjbGVhckNvbm5lY3RUaW1lcik7XG4gICAgICB9XG4gICAgICBpZiAoSHR0cENsaWVudC5SRUFEX1RJTUVPVVQgPiAwKSBzb2NrZXQuc2V0VGltZW91dChIdHRwQ2xpZW50LlJFQURfVElNRU9VVCwgKCkgPT4gc29ja2V0LmRlc3Ryb3kobmV3IEVycm9yKFwiU29ja2V0IHRpbWVkIG91dCBhZnRlciBcIiArIEh0dHBDbGllbnQuUkVBRF9USU1FT1VUICsgXCIgbXMgb2YgaW5hY3Rpdml0eVwiKSkpO1xuICAgICAgcmV0dXJuIHNvY2tldDtcbiAgICB9O1xuICAgIHJldHVybiBhZ2VudDtcbiAgfVxuXG4gIC8vIGRlZmVyIG9ubHkgd2hlbiBhIGhvc3QgZXhjZWVkcyB0aGUgcmF0ZSBsaW1pdCBzaW5jZSBicm93c2VycyB0aHJvdHRsZSB0aW1lcnMgaW4gYmFja2dyb3VuZCB0YWJzXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgYXdhaXRSYXRlTGltaXQoaG9zdDogc3RyaW5nKSB7XG4gICAgY29uc3QgcmF0ZSA9IEh0dHBDbGllbnQuTUFYX1JFUVVFU1RTX1BFUl9TRUNPTkQ7XG4gICAgaWYgKCEocmF0ZSA+IDApKSB0aHJvdyBuZXcgRXJyb3IoXCJNYXggcmVxdWVzdHMgcGVyIHNlY29uZCBtdXN0IGJlIGdyZWF0ZXIgdGhhbiAwIG9yIEluZmluaXR5XCIpO1xuICAgIGNvbnN0IHN0YXJ0VGltZXMgPSBIdHRwQ2xpZW50LlJFUVVFU1RfU1RBUlRfVElNRVNbaG9zdF07XG4gICAgaWYgKHJhdGUgPT09IEluZmluaXR5KSB7XG4gICAgICBzdGFydFRpbWVzLmxlbmd0aCA9IDA7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gYWxsb3cgd2hvbGUgcmVxdWVzdHMgcGVyIHdpbmRvdywgZXh0ZW5kaW5nIHRoZSB3aW5kb3cgdG8gcHJlc2VydmUgZnJhY3Rpb25hbCBsaW1pdHNcbiAgICBjb25zdCBtYXhSZXF1ZXN0cyA9IE1hdGguY2VpbChyYXRlKTtcbiAgICBjb25zdCB3aW5kb3dNcyA9IDEwMDAgKiBtYXhSZXF1ZXN0cyAvIHJhdGU7XG4gICAgd2hpbGUgKHN0YXJ0VGltZXMubGVuZ3RoID4gMCAmJiBzdGFydFRpbWVzWzBdICsgd2luZG93TXMgPD0gRGF0ZS5ub3coKSkgc3RhcnRUaW1lcy5zaGlmdCgpOyAvLyBib3VuZCBoaXN0b3J5IHRvIHRoZSBjdXJyZW50IHdpbmRvd1xuICAgIHdoaWxlIChzdGFydFRpbWVzLmxlbmd0aCA+PSBtYXhSZXF1ZXN0cykge1xuICAgICAgY29uc3Qgd2FpdE1zID0gTWF0aC5jZWlsKHN0YXJ0VGltZXNbMF0gKyB3aW5kb3dNcyAtIERhdGUubm93KCkpO1xuICAgICAgaWYgKHdhaXRNcyA+IDApIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHdhaXRNcykpO1xuICAgICAgZWxzZSBzdGFydFRpbWVzLnNoaWZ0KCk7XG4gICAgfVxuICAgIHN0YXJ0VGltZXMucHVzaChEYXRlLm5vdygpKTtcbiAgfVxuXG4gIHByb3RlY3RlZCBzdGF0aWMgYXN5bmMgcmVxdWVzdEF4aW9zKHJlcSkge1xuICAgIGlmIChyZXEuaGVhZGVycykgdGhyb3cgbmV3IEVycm9yKFwiQ3VzdG9tIGhlYWRlcnMgbm90IGltcGxlbWVudGVkIGluIFhIUiByZXF1ZXN0XCIpOyAgLy8gVE9ET1xuXG4gICAgLy8gY29sbGVjdCBwYXJhbXMgZnJvbSByZXF1ZXN0IHdoaWNoIGNoYW5nZSBvbiBhd2FpdFxuICAgIGNvbnN0IG1ldGhvZCA9IHJlcS5tZXRob2Q7XG4gICAgY29uc3QgdXJpID0gcmVxLnVyaTtcbiAgICBjb25zdCBob3N0ID0gcmVxLmhvc3Q7XG4gICAgY29uc3QgdXNlcm5hbWUgPSByZXEudXNlcm5hbWU7XG4gICAgY29uc3QgcGFzc3dvcmQgPSByZXEucGFzc3dvcmQ7XG4gICAgY29uc3QgYm9keSA9IHJlcS5ib2R5O1xuICAgIGNvbnN0IHByb3h5VXJpID0gcmVxLnByb3h5VXJpO1xuICAgIGNvbnN0IHJlamVjdFVuYXV0aG9yaXplZCA9IHJlcS5yZWplY3RVbmF1dGhvcml6ZWQ7XG4gICAgY29uc3QgaXNCaW5hcnkgPSBib2R5IGluc3RhbmNlb2YgVWludDhBcnJheTtcbiAgICBjb25zdCBjYW5jZWxUb2tlbiA9IHJlcS5jYW5jZWxUb2tlbjtcbiAgICBpZiAoY2FuY2VsVG9rZW4pIGNhbmNlbFRva2VuLnRocm93SWZSZXF1ZXN0ZWQoKTtcblxuICAgIC8vIHF1ZXVlIGFuZCB0aHJvdHRsZSByZXF1ZXN0cyB0byBleGVjdXRlIGluIHNlcmlhbCBhbmQgcmF0ZSBsaW1pdGVkIHBlciBob3N0XG4gICAgY29uc3QgcmVzcG9uc2UgPSBIdHRwQ2xpZW50LlRBU0tfUVVFVUVTW2hvc3RdLnN1Ym1pdChhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChjYW5jZWxUb2tlbikgY2FuY2VsVG9rZW4udGhyb3dJZlJlcXVlc3RlZCgpO1xuICAgICAgYXdhaXQgSHR0cENsaWVudC5hd2FpdFJhdGVMaW1pdChob3N0KTtcbiAgICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgSHR0cENsaWVudC5heGlvc0RpZ2VzdEF1dGhSZXF1ZXN0KG1ldGhvZCwgdXJpLCB1c2VybmFtZSwgcGFzc3dvcmQsIGJvZHksIHByb3h5VXJpLCByZWplY3RVbmF1dGhvcml6ZWQsIGNhbmNlbFRva2VuKS50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICByZXNvbHZlKHJlc3ApO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnJvcjogQXhpb3NFcnJvcikge1xuICAgICAgICAgIGlmIChlcnJvci5yZXNwb25zZT8uc3RhdHVzKSByZXNvbHZlKGVycm9yLnJlc3BvbnNlKTtcbiAgICAgICAgICByZWplY3QobmV3IEVycm9yKFwiUmVxdWVzdCBmYWlsZWQgd2l0aG91dCByZXNwb25zZTogXCIgKyBtZXRob2QgKyBcIiBcIiArIHVyaSArIFwiIGR1ZSB0byB1bmRlcmx5aW5nIGVycm9yOlxcblwiICsgZXJyb3IubWVzc2FnZSArIFwiXFxuXCIgKyBlcnJvci5zdGFjaykpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgLy8gcmVqZWN0IGNhbmNlbGxhdGlvbiBpbW1lZGlhdGVseSBldmVuIHdoZW4gcXVldWVkIGJlaGluZCBhbm90aGVyIHdhbGxldCdzIHJlcXVlc3RcbiAgICBsZXQgb25DYW5jZWw7XG4gICAgbGV0IHJlc3A7XG4gICAgdHJ5IHtcbiAgICAgIHJlc3AgPSBjYW5jZWxUb2tlbiA/IGF3YWl0IFByb21pc2UucmFjZShbcmVzcG9uc2UsIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgb25DYW5jZWwgPSByZWplY3Q7XG4gICAgICAgIGNhbmNlbFRva2VuLnN1YnNjcmliZShvbkNhbmNlbCk7XG4gICAgICB9KV0pIDogYXdhaXQgcmVzcG9uc2U7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIGlmIChjYW5jZWxUb2tlbikgY2FuY2VsVG9rZW4udW5zdWJzY3JpYmUob25DYW5jZWwpO1xuICAgIH1cblxuICAgIC8vIG5vcm1hbGl6ZSByZXNwb25zZVxuICAgIGxldCBub3JtYWxpemVkUmVzcG9uc2U6IGFueSA9IHt9O1xuICAgIG5vcm1hbGl6ZWRSZXNwb25zZS5zdGF0dXNDb2RlID0gcmVzcC5zdGF0dXM7XG4gICAgbm9ybWFsaXplZFJlc3BvbnNlLnN0YXR1c1RleHQgPSByZXNwLnN0YXR1c1RleHQ7XG4gICAgbm9ybWFsaXplZFJlc3BvbnNlLmhlYWRlcnMgPSB7Li4ucmVzcC5oZWFkZXJzfTtcbiAgICBub3JtYWxpemVkUmVzcG9uc2UuYm9keSA9IGlzQmluYXJ5ID8gbmV3IFVpbnQ4QXJyYXkocmVzcC5kYXRhKSA6IHJlc3AuZGF0YTtcbiAgICBpZiAobm9ybWFsaXplZFJlc3BvbnNlLmJvZHkgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikgbm9ybWFsaXplZFJlc3BvbnNlLmJvZHkgPSBuZXcgVWludDhBcnJheShub3JtYWxpemVkUmVzcG9uc2UuYm9keSk7ICAvLyBoYW5kbGUgZW1wdHkgYmluYXJ5IHJlcXVlc3RcbiAgICByZXR1cm4gbm9ybWFsaXplZFJlc3BvbnNlO1xuICB9XG5cbiAgcHJvdGVjdGVkIHN0YXRpYyBheGlvc0RpZ2VzdEF1dGhSZXF1ZXN0ID0gYXN5bmMgZnVuY3Rpb24obWV0aG9kLCB1cmwsIHVzZXJuYW1lLCBwYXNzd29yZCwgYm9keSwgcHJveHlVcmk/LCByZWplY3RVbmF1dGhvcml6ZWQ/LCBjYW5jZWxUb2tlbj8pIHtcbiAgICBpZiAodHlwZW9mIENyeXB0b0pTID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcmVxdWlyZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIENyeXB0b0pTID0gcmVxdWlyZSgnY3J5cHRvLWpzJyk7XG4gICAgfVxuXG4gICAgLy8gcm91dGUgdGhyb3VnaCBzb2NrcyBwcm94eSBpZiBjb25maWd1cmVkLCBvdGhlcndpc2UgdXNlIGRpcmVjdCBhZ2VudHNcbiAgICBjb25zdCBzb2Nrc0FnZW50ID0gcHJveHlVcmkgPyBIdHRwQ2xpZW50LmdldFNvY2tzQWdlbnQocHJveHlVcmksIHJlamVjdFVuYXV0aG9yaXplZCAhPT0gZmFsc2UpIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IGh0dHBBZ2VudCA9IHNvY2tzQWdlbnQgPz8gKHVybC5zdGFydHNXaXRoKFwiaHR0cHNcIikgPyB1bmRlZmluZWQgOiBIdHRwQ2xpZW50LmdldEh0dHBBZ2VudCgpKTtcbiAgICBjb25zdCBodHRwc0FnZW50ID0gc29ja3NBZ2VudCA/PyAodXJsLnN0YXJ0c1dpdGgoXCJodHRwc1wiKSA/IEh0dHBDbGllbnQuZ2V0SHR0cHNBZ2VudChyZWplY3RVbmF1dGhvcml6ZWQpIDogdW5kZWZpbmVkKTtcblxuICAgIGNvbnN0IGdlbmVyYXRlQ25vbmNlID0gZnVuY3Rpb24oKTogc3RyaW5nIHtcbiAgICAgIGNvbnN0IGNoYXJhY3RlcnMgPSAnYWJjZGVmMDEyMzQ1Njc4OSc7XG4gICAgICBsZXQgdG9rZW4gPSAnJztcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgICAgICBjb25zdCByYW5kTnVtID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogY2hhcmFjdGVycy5sZW5ndGgpO1xuICAgICAgICB0b2tlbiArPSBjaGFyYWN0ZXJzLnNsaWNlKHJhbmROdW0sIHJhbmROdW0rMSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdG9rZW47XG4gICAgfVxuXG4gICAgbGV0IGNvdW50ID0gMDtcbiAgICByZXR1cm4gYXhpb3MucmVxdWVzdCh7XG4gICAgICB1cmw6IHVybCxcbiAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICB9LFxuICAgICAgcmVzcG9uc2VUeXBlOiBib2R5IGluc3RhbmNlb2YgVWludDhBcnJheSA/ICdhcnJheWJ1ZmZlcicgOiB1bmRlZmluZWQsXG4gICAgICBodHRwQWdlbnQ6IGh0dHBBZ2VudCxcbiAgICAgIGh0dHBzQWdlbnQ6IGh0dHBzQWdlbnQsXG4gICAgICBwcm94eTogc29ja3NBZ2VudCA/IGZhbHNlIDogdW5kZWZpbmVkLCAvLyBlbnYgcHJveGllcyBtdXN0IG5vdCBieXBhc3MgdGhlIHNvY2tzIGFnZW50XG4gICAgICB0aW1lb3V0OiBIdHRwQ2xpZW50LmdldE5vbkFnZW50VGltZW91dCgpLFxuICAgICAgY2FuY2VsVG9rZW46IGNhbmNlbFRva2VuLFxuICAgICAgZGF0YTogYm9keSxcbiAgICAgIHRyYW5zZm9ybVJlc3BvbnNlOiByZXMgPT4gcmVzLFxuICAgICAgYWRhcHRlcjogR2VuVXRpbHMuaXNEZW5vKCkgPyBbJ2ZldGNoJ10gOiBbJ2h0dHAnLCAneGhyJywgJ2ZldGNoJ11cbiAgICB9KS5jYXRjaChhc3luYyAoZXJyKSA9PiB7XG4gICAgICBpZiAoZXJyLnJlc3BvbnNlPy5zdGF0dXMgPT09IDQwMSkge1xuICAgICAgICBsZXQgYXV0aEhlYWRlciA9IGVyci5yZXNwb25zZS5oZWFkZXJzWyd3d3ctYXV0aGVudGljYXRlJ10ucmVwbGFjZSgvLFxcc0RpZ2VzdC4qLywgXCJcIik7XG4gICAgICAgIGlmICghYXV0aEhlYWRlcikge1xuICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIERpZ2VzdCBxb3A9XCJhdXRoXCIsYWxnb3JpdGhtPU1ENSxyZWFsbT1cIm1vbmVyby1ycGNcIixub25jZT1cImhCWjJyWkl4RWx2NGxxQ1JyVXlsWEE9PVwiLHN0YWxlPWZhbHNlXG4gICAgICAgIGNvbnN0IGF1dGhIZWFkZXJNYXAgPSBhdXRoSGVhZGVyLnJlcGxhY2UoXCJEaWdlc3QgXCIsIFwiXCIpLnJlcGxhY2VBbGwoJ1wiJywgXCJcIikuc3BsaXQoXCIsXCIpLnJlZHVjZSgocHJldiwgY3VycikgPT4gKHsuLi5wcmV2LCBbY3Vyci5zcGxpdChcIj1cIilbMF1dOiBjdXJyLnNwbGl0KFwiPVwiKS5zbGljZSgxKS5qb2luKCc9Jyl9KSwge30pXG5cbiAgICAgICAgKytjb3VudDtcblxuICAgICAgICBjb25zdCBjbm9uY2UgPSBnZW5lcmF0ZUNub25jZSgpO1xuICAgICAgICBjb25zdCBIQTEgPSBDcnlwdG9KUy5NRDUodXNlcm5hbWUrJzonK2F1dGhIZWFkZXJNYXAucmVhbG0rJzonK3Bhc3N3b3JkKS50b1N0cmluZygpO1xuICAgICAgICBjb25zdCBIQTIgPSBDcnlwdG9KUy5NRDUobWV0aG9kKyc6Jyt1cmwpLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBDcnlwdG9KUy5NRDUoSEExKyc6JytcbiAgICAgICAgICBhdXRoSGVhZGVyTWFwLm5vbmNlKyc6JytcbiAgICAgICAgICAoJzAwMDAwMDAwJyArIGNvdW50KS5zbGljZSgtOCkrJzonK1xuICAgICAgICAgIGNub25jZSsnOicrXG4gICAgICAgICAgYXV0aEhlYWRlck1hcC5xb3ArJzonK1xuICAgICAgICAgIEhBMikudG9TdHJpbmcoKTtcbiAgICAgICAgY29uc3QgZGlnZXN0QXV0aEhlYWRlciA9ICdEaWdlc3QnKycgJytcbiAgICAgICAgICAndXNlcm5hbWU9XCInK3VzZXJuYW1lKydcIiwgJytcbiAgICAgICAgICAncmVhbG09XCInK2F1dGhIZWFkZXJNYXAucmVhbG0rJ1wiLCAnK1xuICAgICAgICAgICdub25jZT1cIicrYXV0aEhlYWRlck1hcC5ub25jZSsnXCIsICcrXG4gICAgICAgICAgJ3VyaT1cIicrdXJsKydcIiwgJytcbiAgICAgICAgICAncmVzcG9uc2U9XCInK3Jlc3BvbnNlKydcIiwgJytcbiAgICAgICAgICAnb3BhcXVlPVwiJysoYXV0aEhlYWRlck1hcC5vcGFxdWUgPz8gbnVsbCkrJ1wiLCAnK1xuICAgICAgICAgICdxb3A9JythdXRoSGVhZGVyTWFwLnFvcCsnLCAnK1xuICAgICAgICAgICduYz0nKygnMDAwMDAwMDAnICsgY291bnQpLnNsaWNlKC04KSsnLCAnK1xuICAgICAgICAgICdjbm9uY2U9XCInK2Nub25jZSsnXCInO1xuXG4gICAgICAgIGNvbnN0IGZpbmFsUmVzcG9uc2UgPSBhd2FpdCBheGlvcy5yZXF1ZXN0KHtcbiAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICBtZXRob2Q6IG1ldGhvZCxcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6IGRpZ2VzdEF1dGhIZWFkZXIsXG4gICAgICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICAgICAgfSxcbiAgICAgICAgICByZXNwb25zZVR5cGU6IGJvZHkgaW5zdGFuY2VvZiBVaW50OEFycmF5ID8gJ2FycmF5YnVmZmVyJyA6IHVuZGVmaW5lZCxcbiAgICAgICAgICBodHRwQWdlbnQ6IGh0dHBBZ2VudCxcbiAgICAgICAgICBodHRwc0FnZW50OiBodHRwc0FnZW50LFxuICAgICAgICAgIHByb3h5OiBzb2Nrc0FnZW50ID8gZmFsc2UgOiB1bmRlZmluZWQsIC8vIGVudiBwcm94aWVzIG11c3Qgbm90IGJ5cGFzcyB0aGUgc29ja3MgYWdlbnRcbiAgICAgICAgICB0aW1lb3V0OiBIdHRwQ2xpZW50LmdldE5vbkFnZW50VGltZW91dCgpLFxuICAgICAgICAgIGNhbmNlbFRva2VuOiBjYW5jZWxUb2tlbixcbiAgICAgICAgICBkYXRhOiBib2R5LFxuICAgICAgICAgIHRyYW5zZm9ybVJlc3BvbnNlOiByZXMgPT4gcmVzLFxuICAgICAgICAgIGFkYXB0ZXI6IEdlblV0aWxzLmlzRGVubygpID8gWydmZXRjaCddIDogWydodHRwJywgJ3hocicsICdmZXRjaCddXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmaW5hbFJlc3BvbnNlO1xuICAgICAgfVxuICAgICAgdGhyb3cgZXJyO1xuICAgIH0pLmNhdGNoKGVyciA9PiB7XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfSk7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLFNBQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFDLGFBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFFLFdBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLEtBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLE1BQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLE1BQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDZSxNQUFNTSxVQUFVLENBQUM7O0VBRTlCLE9BQU9DLHVCQUF1QixHQUFHLEVBQUUsQ0FBQyxDQUFDOztFQUVyQztFQUNBLE9BQWlCQyxlQUFlLEdBQUc7SUFDakNDLE1BQU0sRUFBRSxLQUFLO0lBQ2JDLHVCQUF1QixFQUFFLEtBQUs7SUFDOUJDLGtCQUFrQixFQUFFO0VBQ3RCLENBQUM7O0VBRUQ7RUFDQSxPQUFpQkMsbUJBQW1CLEdBQUcsRUFBRSxDQUFDLENBQUM7RUFDM0MsT0FBaUJDLFdBQVcsR0FBRyxFQUFFO0VBQ2pDLE9BQWlCQyxlQUFlLEdBQUcsTUFBTSxDQUFDLENBQUM7RUFDM0MsT0FBaUJDLFlBQVksR0FBRyxNQUFNLENBQUMsQ0FBQzs7Ozs7RUFLeEMsT0FBaUJDLFlBQVksR0FBUSxDQUFDLENBQUMsQ0FBQyxDQUFDOztFQUV6QztBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtFQUNFLGFBQWFDLE9BQU9BLENBQUNBLE9BQU8sRUFBRTtJQUM1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