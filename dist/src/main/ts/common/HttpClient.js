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

    // queue and throttle requests to execute in serial and rate limited per host
    const resp = await HttpClient.TASK_QUEUES[host].submit(async function () {
      return HttpClient.PROMISE_THROTTLES[host].add(function () {
        return new Promise(function (resolve, reject) {
          HttpClient.axiosDigestAuthRequest(method, uri, username, password, body, proxyUri, rejectUnauthorized).then(function (resp) {
            resolve(resp);
          }).catch(function (error) {
            if (error.response?.status) resolve(error.response);
            reject(new Error("Request failed without response: " + method + " " + uri + " due to underlying error:\n" + error.message + "\n" + error.stack));
          });
        });

      }.bind(this));
    });

    // normalize response
    let normalizedResponse = {};
    normalizedResponse.statusCode = resp.status;
    normalizedResponse.statusText = resp.statusText;
    normalizedResponse.headers = { ...resp.headers };
    normalizedResponse.body = isBinary ? new Uint8Array(resp.data) : resp.data;
    if (normalizedResponse.body instanceof ArrayBuffer) normalizedResponse.body = new Uint8Array(normalizedResponse.body); // handle empty binary request
    return normalizedResponse;
  }

  static axiosDigestAuthRequest = async function (method, url, username, password, body, proxyUri, rejectUnauthorized) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfR2VuVXRpbHMiLCJfaW50ZXJvcFJlcXVpcmVEZWZhdWx0IiwicmVxdWlyZSIsIl9MaWJyYXJ5VXRpbHMiLCJfVGhyZWFkUG9vbCIsIl9wcm9taXNlVGhyb3R0bGUiLCJfaHR0cCIsIl9odHRwcyIsIl9heGlvcyIsIkh0dHBDbGllbnQiLCJNQVhfUkVRVUVTVFNfUEVSX1NFQ09ORCIsIkRFRkFVTFRfUkVRVUVTVCIsIm1ldGhvZCIsInJlc29sdmVXaXRoRnVsbFJlc3BvbnNlIiwicmVqZWN0VW5hdXRob3JpemVkIiwiUFJPTUlTRV9USFJPVFRMRVMiLCJUQVNLX1FVRVVFUyIsIkNPTk5FQ1RfVElNRU9VVCIsIlJFQURfVElNRU9VVCIsIlNPQ0tTX0FHRU5UUyIsInJlcXVlc3QiLCJwcm94eVRvV29ya2VyIiwiTGlicmFyeVV0aWxzIiwiaW52b2tlV29ya2VyIiwidW5kZWZpbmVkIiwiZXJyIiwibWVzc2FnZSIsImxlbmd0aCIsImNoYXJBdCIsInBhcnNlZCIsIkpTT04iLCJwYXJzZSIsInN0YXR1c01lc3NhZ2UiLCJzdGF0dXNDb2RlIiwiT2JqZWN0IiwiYXNzaWduIiwiaG9zdCIsIlVSTCIsInVyaSIsIkVycm9yIiwiYm9keSIsIlRocmVhZFBvb2wiLCJQcm9taXNlVGhyb3R0bGUiLCJyZXF1ZXN0c1BlclNlY29uZCIsInByb21pc2VJbXBsZW1lbnRhdGlvbiIsIlByb21pc2UiLCJyZXF1ZXN0UHJvbWlzZSIsInJlcXVlc3RBeGlvcyIsInRpbWVvdXQiLCJHZW5VdGlscyIsImV4ZWN1dGVXaXRoVGltZW91dCIsImdldEh0dHBBZ2VudCIsIkhUVFBfQUdFTlQiLCJhcHBseVRpbWVvdXRzIiwiaHR0cCIsIkFnZW50Iiwia2VlcEFsaXZlIiwiZmFtaWx5IiwiZ2V0SHR0cHNBZ2VudCIsIkhUVFBTX0FHRU5UIiwiaHR0cHMiLCJnZXRTb2Nrc0FnZW50IiwicHJveHlVcmkiLCJpc0Jyb3dzZXIiLCJpc0Rlbm8iLCJrZXkiLCJTb2Nrc1Byb3h5QWdlbnQiLCJub3JtYWxpemVVcmkiLCJhdXRoIiwidXNlcm5hbWUiLCJwYXNzd29yZCIsIk1hdGgiLCJtYXgiLCJhZ2VudCIsImNyZWF0ZUNvbm5lY3Rpb24iLCJiaW5kIiwib3B0aW9ucyIsImNhbGxiYWNrIiwic29ja2V0IiwidGltZXIiLCJzZXRUaW1lb3V0IiwiZGVzdHJveSIsImNsZWFyQ29ubmVjdFRpbWVyIiwiY2xlYXJUaW1lb3V0Iiwib25jZSIsInJlcSIsImhlYWRlcnMiLCJpc0JpbmFyeSIsIlVpbnQ4QXJyYXkiLCJyZXNwIiwic3VibWl0IiwiYWRkIiwicmVzb2x2ZSIsInJlamVjdCIsImF4aW9zRGlnZXN0QXV0aFJlcXVlc3QiLCJ0aGVuIiwiY2F0Y2giLCJlcnJvciIsInJlc3BvbnNlIiwic3RhdHVzIiwic3RhY2siLCJub3JtYWxpemVkUmVzcG9uc2UiLCJzdGF0dXNUZXh0IiwiZGF0YSIsIkFycmF5QnVmZmVyIiwidXJsIiwiQ3J5cHRvSlMiLCJzb2Nrc0FnZW50IiwiaHR0cEFnZW50Iiwic3RhcnRzV2l0aCIsImh0dHBzQWdlbnQiLCJnZW5lcmF0ZUNub25jZSIsImNoYXJhY3RlcnMiLCJ0b2tlbiIsImkiLCJyYW5kTnVtIiwicm91bmQiLCJyYW5kb20iLCJzbGljZSIsImNvdW50IiwiYXhpb3MiLCJyZXNwb25zZVR5cGUiLCJwcm94eSIsInRyYW5zZm9ybVJlc3BvbnNlIiwicmVzIiwiYWRhcHRlciIsImF1dGhIZWFkZXIiLCJyZXBsYWNlIiwiYXV0aEhlYWRlck1hcCIsInJlcGxhY2VBbGwiLCJzcGxpdCIsInJlZHVjZSIsInByZXYiLCJjdXJyIiwiam9pbiIsImNub25jZSIsIkhBMSIsIk1ENSIsInJlYWxtIiwidG9TdHJpbmciLCJIQTIiLCJub25jZSIsInFvcCIsImRpZ2VzdEF1dGhIZWFkZXIiLCJvcGFxdWUiLCJmaW5hbFJlc3BvbnNlIiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy9jb21tb24vSHR0cENsaWVudC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4vR2VuVXRpbHNcIjtcbmltcG9ydCBMaWJyYXJ5VXRpbHMgZnJvbSBcIi4vTGlicmFyeVV0aWxzXCI7XG5pbXBvcnQgVGhyZWFkUG9vbCBmcm9tIFwiLi9UaHJlYWRQb29sXCI7XG5pbXBvcnQgUHJvbWlzZVRocm90dGxlIGZyb20gXCJwcm9taXNlLXRocm90dGxlXCI7XG5pbXBvcnQgaHR0cCBmcm9tIFwiaHR0cFwiO1xuaW1wb3J0IGh0dHBzIGZyb20gXCJodHRwc1wiO1xuaW1wb3J0IGF4aW9zLCB7IEF4aW9zRXJyb3IgfSBmcm9tIFwiYXhpb3NcIjtcblxuLyoqXG4gKiBIYW5kbGUgSFRUUCByZXF1ZXN0cyB3aXRoIGEgdW5pZm9ybSBpbnRlcmZhY2UuXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIEh0dHBDbGllbnQge1xuXG4gIHN0YXRpYyBNQVhfUkVRVUVTVFNfUEVSX1NFQ09ORCA9IDUwO1xuXG4gIC8vIGRlZmF1bHQgcmVxdWVzdCBjb25maWdcbiAgcHJvdGVjdGVkIHN0YXRpYyBERUZBVUxUX1JFUVVFU1QgPSB7XG4gICAgbWV0aG9kOiBcIkdFVFwiLFxuICAgIHJlc29sdmVXaXRoRnVsbFJlc3BvbnNlOiBmYWxzZSxcbiAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHRydWVcbiAgfVxuXG4gIC8vIHJhdGUgbGltaXQgcmVxdWVzdHMgcGVyIGhvc3RcbiAgcHJvdGVjdGVkIHN0YXRpYyBQUk9NSVNFX1RIUk9UVExFUyA9IFtdO1xuICBwcm90ZWN0ZWQgc3RhdGljIFRBU0tfUVVFVUVTID0gW107XG4gIHByb3RlY3RlZCBzdGF0aWMgQ09OTkVDVF9USU1FT1VUID0gMTgwMDAwOyAvLyBtcyB0byBlc3RhYmxpc2ggYSBjb25uZWN0aW9uLCBtYXRjaGluZyBtb25lcm8tamF2YSdzIGRlZmF1bHQgKDAgdG8gZGlzYWJsZSlcbiAgcHJvdGVjdGVkIHN0YXRpYyBSRUFEX1RJTUVPVVQgPSAxODAwMDA7IC8vIG1zIG9mIHNvY2tldCBpbmFjdGl2aXR5IGJlZm9yZSB0aW1pbmcgb3V0XG5cbiAgcHJvdGVjdGVkIHN0YXRpYyBIVFRQX0FHRU5UOiBhbnk7XG4gIHByb3RlY3RlZCBzdGF0aWMgSFRUUFNfQUdFTlQ6IGFueTtcbiAgcHJvdGVjdGVkIHN0YXRpYyBTT0NLU19BR0VOVFM6IGFueSA9IHt9OyAvLyBzaGFyZWQgc29ja3MgYWdlbnRzIGtleWVkIGJ5IHByb3h5IHVyaSBhbmQgc3NsIGNvbmZpZ1xuXG4gIC8qKlxuICAgKiA8cD5NYWtlIGEgSFRUUCByZXF1ZXN0LjxwPlxuICAgKiBcbiAgICogQHBhcmFtIHtvYmplY3R9IHJlcXVlc3QgLSBjb25maWd1cmVzIHRoZSByZXF1ZXN0IHRvIG1ha2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IHJlcXVlc3QubWV0aG9kIC0gSFRUUCBtZXRob2QgKFwiR0VUXCIsIFwiUFVUXCIsIFwiUE9TVFwiLCBcIkRFTEVURVwiLCBldGMpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSByZXF1ZXN0LnVyaSAtIHVyaSB0byByZXF1ZXN0XG4gICAqIEBwYXJhbSB7c3RyaW5nfFVpbnQ4QXJyYXl8b2JqZWN0fSByZXF1ZXN0LmJvZHkgLSByZXF1ZXN0IGJvZHlcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtyZXF1ZXN0LnVzZXJuYW1lXSAtIHVzZXJuYW1lIHRvIGF1dGhlbnRpY2F0ZSB0aGUgcmVxdWVzdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcmVxdWVzdC5wYXNzd29yZF0gLSBwYXNzd29yZCB0byBhdXRoZW50aWNhdGUgdGhlIHJlcXVlc3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge29iamVjdH0gW3JlcXVlc3QuaGVhZGVyc10gLSBoZWFkZXJzIHRvIGFkZCB0byB0aGUgcmVxdWVzdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcmVxdWVzdC5wcm94eVVyaV0gLSBwcm94eSB0aGUgcmVxdWVzdCB0aHJvdWdoIGEgU09DS1M1IHNlcnZlciwgZS5nLiBhIGxvY2FsIFRvciBwcm94eSAoTm9kZS5qcyBvbmx5LCBvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcmVxdWVzdC5yZXNvbHZlV2l0aEZ1bGxSZXNwb25zZV0gLSByZXR1cm4gZnVsbCByZXNwb25zZSBpZiB0cnVlLCBlbHNlIGJvZHkgb25seSAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHBhcmFtIHtib29sZWFufSBbcmVxdWVzdC5yZWplY3RVbmF1dGhvcml6ZWRdIC0gd2hldGhlciBvciBub3QgdG8gcmVqZWN0IHNlbGYtc2lnbmVkIGNlcnRpZmljYXRlcyAoZGVmYXVsdCB0cnVlKVxuICAgKiBAcGFyYW0ge251bWJlcn0gcmVxdWVzdC50aW1lb3V0IC0gbWF4aW11bSB0aW1lIGFsbG93ZWQgaW4gbWlsbGlzZWNvbmRzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSByZXF1ZXN0LnByb3h5VG9Xb3JrZXIgLSBwcm94eSByZXF1ZXN0IHRvIHdvcmtlciB0aHJlYWRcbiAgICogQHJldHVybiB7b2JqZWN0fSByZXNwb25zZSAtIHRoZSByZXNwb25zZSBvYmplY3RcbiAgICogQHJldHVybiB7c3RyaW5nfFVpbnQ4QXJyYXl8b2JqZWN0fSByZXNwb25zZS5ib2R5IC0gdGhlIHJlc3BvbnNlIGJvZHlcbiAgICogQHJldHVybiB7bnVtYmVyfSByZXNwb25zZS5zdGF0dXNDb2RlIC0gdGhlIHJlc3BvbnNlIGNvZGVcbiAgICogQHJldHVybiB7U3RyaW5nfSByZXNwb25zZS5zdGF0dXNUZXh0IC0gdGhlIHJlc3BvbnNlIG1lc3NhZ2VcbiAgICogQHJldHVybiB7b2JqZWN0fSByZXNwb25zZS5oZWFkZXJzIC0gdGhlIHJlc3BvbnNlIGhlYWRlcnNcbiAgICovXG4gIHN0YXRpYyBhc3luYyByZXF1ZXN0KHJlcXVlc3QpIHtcbiAgICAvLyBwcm94eSB0byB3b3JrZXIgaWYgY29uZmlndXJlZFxuICAgIGlmIChyZXF1ZXN0LnByb3h5VG9Xb3JrZXIpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBhd2FpdCBMaWJyYXJ5VXRpbHMuaW52b2tlV29ya2VyKHVuZGVmaW5lZCwgXCJodHRwUmVxdWVzdFwiLCByZXF1ZXN0KTtcbiAgICAgIH0gY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgIGlmIChlcnIubWVzc2FnZS5sZW5ndGggPiAwICYmIGVyci5tZXNzYWdlLmNoYXJBdCgwKSA9PT0gXCJ7XCIpIHtcbiAgICAgICAgICBsZXQgcGFyc2VkID0gSlNPTi5wYXJzZShlcnIubWVzc2FnZSk7XG4gICAgICAgICAgZXJyLm1lc3NhZ2UgPSBwYXJzZWQuc3RhdHVzTWVzc2FnZTtcbiAgICAgICAgICBlcnIuc3RhdHVzQ29kZSA9IHBhcnNlZC5zdGF0dXNDb2RlO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBhc3NpZ24gZGVmYXVsdHNcbiAgICByZXF1ZXN0ID0gT2JqZWN0LmFzc2lnbih7fSwgSHR0cENsaWVudC5ERUZBVUxUX1JFUVVFU1QsIHJlcXVlc3QpO1xuXG4gICAgLy8gdmFsaWRhdGUgcmVxdWVzdFxuICAgIHRyeSB7IHJlcXVlc3QuaG9zdCA9IG5ldyBVUkwocmVxdWVzdC51cmkpLmhvc3Q7IH0gLy8gaG9zdG5hbWU6cG9ydFxuICAgIGNhdGNoIChlcnIpIHsgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCByZXF1ZXN0IFVSTDogXCIgKyByZXF1ZXN0LnVyaSk7IH1cbiAgICBpZiAocmVxdWVzdC5ib2R5ICYmICEodHlwZW9mIHJlcXVlc3QuYm9keSA9PT0gXCJzdHJpbmdcIiB8fCB0eXBlb2YgcmVxdWVzdC5ib2R5ID09PSBcIm9iamVjdFwiKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiUmVxdWVzdCBib2R5IHR5cGUgaXMgbm90IHN0cmluZyBvciBvYmplY3RcIik7XG4gICAgfVxuXG4gICAgLy8gaW5pdGlhbGl6ZSBvbmUgdGFzayBxdWV1ZSBwZXIgaG9zdFxuICAgIGlmICghSHR0cENsaWVudC5UQVNLX1FVRVVFU1tyZXF1ZXN0Lmhvc3RdKSBIdHRwQ2xpZW50LlRBU0tfUVVFVUVTW3JlcXVlc3QuaG9zdF0gPSBuZXcgVGhyZWFkUG9vbCgxKTtcblxuICAgIC8vIGluaXRpYWxpemUgb25lIHByb21pc2UgdGhyb3R0bGUgcGVyIGhvc3RcbiAgICBpZiAoIUh0dHBDbGllbnQuUFJPTUlTRV9USFJPVFRMRVNbcmVxdWVzdC5ob3N0XSkge1xuICAgICAgSHR0cENsaWVudC5QUk9NSVNFX1RIUk9UVExFU1tyZXF1ZXN0Lmhvc3RdID0gbmV3IFByb21pc2VUaHJvdHRsZSh7XG4gICAgICAgIHJlcXVlc3RzUGVyU2Vjb25kOiBIdHRwQ2xpZW50Lk1BWF9SRVFVRVNUU19QRVJfU0VDT05ELCAvLyBUT0RPOiBIdHRwQ2xpZW50IHNob3VsZCBub3QgZGVwZW5kIG9uIE1vbmVyb1V0aWxzIGZvciBjb25maWd1cmF0aW9uXG4gICAgICAgIHByb21pc2VJbXBsZW1lbnRhdGlvbjogUHJvbWlzZVxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gY29ubmVjdGlvbiBhbmQgcmVzcG9uc2UgaW5hY3Rpdml0eSBhcmUgYm91bmRlZCBpbiB0aGUgYWdlbnRzXG4gICAgbGV0IHJlcXVlc3RQcm9taXNlID0gSHR0cENsaWVudC5yZXF1ZXN0QXhpb3MocmVxdWVzdCk7XG4gICAgcmV0dXJuIHJlcXVlc3QudGltZW91dCA/IEdlblV0aWxzLmV4ZWN1dGVXaXRoVGltZW91dChyZXF1ZXN0UHJvbWlzZSwgcmVxdWVzdC50aW1lb3V0KSA6IHJlcXVlc3RQcm9taXNlO1xuICB9XG5cbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSBIRUxQRVJTIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuXG4gIC8qKlxuICAgKiBHZXQgYSBzaW5nbGV0b24gaW5zdGFuY2Ugb2YgYW4gSFRUUCBjbGllbnQgdG8gc2hhcmUuXG4gICAqXG4gICAqIEByZXR1cm4ge2h0dHAuQWdlbnR9IGEgc2hhcmVkIGFnZW50IGZvciBuZXR3b3JrIHJlcXVlc3RzIGFtb25nIGxpYnJhcnkgaW5zdGFuY2VzXG4gICAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGdldEh0dHBBZ2VudCgpIHtcbiAgICBpZiAoIUh0dHBDbGllbnQuSFRUUF9BR0VOVCkgSHR0cENsaWVudC5IVFRQX0FHRU5UID0gSHR0cENsaWVudC5hcHBseVRpbWVvdXRzKG5ldyBodHRwLkFnZW50KHtcbiAgICAgIGtlZXBBbGl2ZTogdHJ1ZSxcbiAgICAgIGZhbWlseTogNCAvLyB1c2UgSVB2NFxuICAgIH0pKTtcbiAgICByZXR1cm4gSHR0cENsaWVudC5IVFRQX0FHRU5UO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHNpbmdsZXRvbiBpbnN0YW5jZSBvZiBhbiBIVFRQUyBjbGllbnQgdG8gc2hhcmUuXG4gICAqXG4gICAqIEByZXR1cm4ge2h0dHBzLkFnZW50fSBhIHNoYXJlZCBhZ2VudCBmb3IgbmV0d29yayByZXF1ZXN0cyBhbW9uZyBsaWJyYXJ5IGluc3RhbmNlc1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBnZXRIdHRwc0FnZW50KCkge1xuICAgIGlmICghSHR0cENsaWVudC5IVFRQU19BR0VOVCkgSHR0cENsaWVudC5IVFRQU19BR0VOVCA9IEh0dHBDbGllbnQuYXBwbHlUaW1lb3V0cyhuZXcgaHR0cHMuQWdlbnQoe1xuICAgICAga2VlcEFsaXZlOiB0cnVlLFxuICAgICAgZmFtaWx5OiA0IC8vIHVzZSBJUHY0XG4gICAgfSkpO1xuICAgIHJldHVybiBIdHRwQ2xpZW50LkhUVFBTX0FHRU5UO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCBhIHNpbmdsZXRvbiBhZ2VudCB0byByb3V0ZSByZXF1ZXN0cyB0aHJvdWdoIGEgU09DS1M1IHByb3h5OyBob3N0bmFtZXMgYXJlIHJlc29sdmVkIGJ5IHRoZSBwcm94eSB0byBhdm9pZCBETlMgbGVha3MuXG4gICAqXG4gICAqIEByZXR1cm4ge1NvY2tzUHJveHlBZ2VudH0gYSBzaGFyZWQgYWdlbnQgZm9yIHRoZSBnaXZlbiBwcm94eSBhbmQgc3NsIGNvbmZpZ1xuICAgKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBnZXRTb2Nrc0FnZW50KHByb3h5VXJpOiBzdHJpbmcsIHJlamVjdFVuYXV0aG9yaXplZDogYm9vbGVhbikge1xuICAgIGlmIChHZW5VdGlscy5pc0Jyb3dzZXIoKSB8fCBHZW5VdGlscy5pc0Rlbm8oKSkgdGhyb3cgbmV3IEVycm9yKFwiUHJveGllZCByZXF1ZXN0cyBhcmUgb25seSBzdXBwb3J0ZWQgaW4gTm9kZS5qc1wiKTtcbiAgICBjb25zdCBrZXkgPSBwcm94eVVyaSArIFwiX1wiICsgcmVqZWN0VW5hdXRob3JpemVkO1xuICAgIGlmICghSHR0cENsaWVudC5TT0NLU19BR0VOVFNba2V5XSkge1xuICAgICAgY29uc3QgeyBTb2Nrc1Byb3h5QWdlbnQgfSA9IHJlcXVpcmUoXCJzb2Nrcy1wcm94eS1hZ2VudFwiKTtcbiAgICAgIGNvbnN0IHBhcnNlZCA9IG5ldyBVUkwoR2VuVXRpbHMubm9ybWFsaXplVXJpKHByb3h5VXJpKSk7XG4gICAgICBjb25zdCBhdXRoID0gcGFyc2VkLnVzZXJuYW1lID8gcGFyc2VkLnVzZXJuYW1lICsgXCI6XCIgKyBwYXJzZWQucGFzc3dvcmQgKyBcIkBcIiA6IFwiXCI7XG4gICAgICBIdHRwQ2xpZW50LlNPQ0tTX0FHRU5UU1trZXldID0gbmV3IFNvY2tzUHJveHlBZ2VudChcInNvY2tzNWg6Ly9cIiArIGF1dGggKyBwYXJzZWQuaG9zdCwgeyAvLyBzb2NrcyBlc3RhYmxpc2htZW50IGFuZCBpbmFjdGl2aXR5IGFyZSBib3VuZGVkIGJ5IHRpbWVvdXRcbiAgICAgICAga2VlcEFsaXZlOiB0cnVlLFxuICAgICAgICB0aW1lb3V0OiBNYXRoLm1heChIdHRwQ2xpZW50LkNPTk5FQ1RfVElNRU9VVCwgSHR0cENsaWVudC5SRUFEX1RJTUVPVVQpLFxuICAgICAgICByZWplY3RVbmF1dGhvcml6ZWQ6IHJlamVjdFVuYXV0aG9yaXplZFxuICAgICAgfSk7XG4gICAgfVxuICAgIHJldHVybiBIdHRwQ2xpZW50LlNPQ0tTX0FHRU5UU1trZXldO1xuICB9XG5cbiAgLy8gYm91bmQgdGhlIGNvbm5lY3Rpb24gcGhhc2UgYW5kIHNvY2tldCBpbmFjdGl2aXR5XG4gIHByb3RlY3RlZCBzdGF0aWMgYXBwbHlUaW1lb3V0cyhhZ2VudDogYW55KSB7XG4gICAgaWYgKHR5cGVvZiBhZ2VudC5jcmVhdGVDb25uZWN0aW9uICE9PSBcImZ1bmN0aW9uXCIpIHJldHVybiBhZ2VudDsgLy8gbm8tb3AgaW4gYnJvd3NlciBzaGltc1xuICAgIGNvbnN0IGNyZWF0ZUNvbm5lY3Rpb24gPSBhZ2VudC5jcmVhdGVDb25uZWN0aW9uLmJpbmQoYWdlbnQpO1xuICAgIGFnZW50LmNyZWF0ZUNvbm5lY3Rpb24gPSBmdW5jdGlvbihvcHRpb25zLCBjYWxsYmFjaykge1xuICAgICAgY29uc3Qgc29ja2V0ID0gY3JlYXRlQ29ubmVjdGlvbihvcHRpb25zLCBjYWxsYmFjayk7XG4gICAgICBpZiAoSHR0cENsaWVudC5DT05ORUNUX1RJTUVPVVQgPiAwKSB7XG4gICAgICAgIGNvbnN0IHRpbWVyID0gc2V0VGltZW91dCgoKSA9PiBzb2NrZXQuZGVzdHJveShuZXcgRXJyb3IoXCJDb25uZWN0aW9uIHRpbWVkIG91dCBpbiBcIiArIEh0dHBDbGllbnQuQ09OTkVDVF9USU1FT1VUICsgXCIgbXNcIikpLCBIdHRwQ2xpZW50LkNPTk5FQ1RfVElNRU9VVCk7XG4gICAgICAgIGNvbnN0IGNsZWFyQ29ubmVjdFRpbWVyID0gKCkgPT4gY2xlYXJUaW1lb3V0KHRpbWVyKTtcbiAgICAgICAgc29ja2V0Lm9uY2UoXCJjb25uZWN0XCIsIGNsZWFyQ29ubmVjdFRpbWVyKS5vbmNlKFwic2VjdXJlQ29ubmVjdFwiLCBjbGVhckNvbm5lY3RUaW1lcikub25jZShcImVycm9yXCIsIGNsZWFyQ29ubmVjdFRpbWVyKS5vbmNlKFwiY2xvc2VcIiwgY2xlYXJDb25uZWN0VGltZXIpO1xuICAgICAgfVxuICAgICAgaWYgKEh0dHBDbGllbnQuUkVBRF9USU1FT1VUID4gMCkgc29ja2V0LnNldFRpbWVvdXQoSHR0cENsaWVudC5SRUFEX1RJTUVPVVQsICgpID0+IHNvY2tldC5kZXN0cm95KG5ldyBFcnJvcihcIlNvY2tldCB0aW1lZCBvdXQgYWZ0ZXIgXCIgKyBIdHRwQ2xpZW50LlJFQURfVElNRU9VVCArIFwiIG1zIG9mIGluYWN0aXZpdHlcIikpKTtcbiAgICAgIHJldHVybiBzb2NrZXQ7XG4gICAgfTtcbiAgICByZXR1cm4gYWdlbnQ7XG4gIH1cblxuICBwcm90ZWN0ZWQgc3RhdGljIGFzeW5jIHJlcXVlc3RBeGlvcyhyZXEpIHtcbiAgICBpZiAocmVxLmhlYWRlcnMpIHRocm93IG5ldyBFcnJvcihcIkN1c3RvbSBoZWFkZXJzIG5vdCBpbXBsZW1lbnRlZCBpbiBYSFIgcmVxdWVzdFwiKTsgIC8vIFRPRE9cblxuICAgIC8vIGNvbGxlY3QgcGFyYW1zIGZyb20gcmVxdWVzdCB3aGljaCBjaGFuZ2Ugb24gYXdhaXRcbiAgICBjb25zdCBtZXRob2QgPSByZXEubWV0aG9kO1xuICAgIGNvbnN0IHVyaSA9IHJlcS51cmk7XG4gICAgY29uc3QgaG9zdCA9IHJlcS5ob3N0O1xuICAgIGNvbnN0IHVzZXJuYW1lID0gcmVxLnVzZXJuYW1lO1xuICAgIGNvbnN0IHBhc3N3b3JkID0gcmVxLnBhc3N3b3JkO1xuICAgIGNvbnN0IGJvZHkgPSByZXEuYm9keTtcbiAgICBjb25zdCBwcm94eVVyaSA9IHJlcS5wcm94eVVyaTtcbiAgICBjb25zdCByZWplY3RVbmF1dGhvcml6ZWQgPSByZXEucmVqZWN0VW5hdXRob3JpemVkO1xuICAgIGNvbnN0IGlzQmluYXJ5ID0gYm9keSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXk7XG5cbiAgICAvLyBxdWV1ZSBhbmQgdGhyb3R0bGUgcmVxdWVzdHMgdG8gZXhlY3V0ZSBpbiBzZXJpYWwgYW5kIHJhdGUgbGltaXRlZCBwZXIgaG9zdFxuICAgIGNvbnN0IHJlc3AgPSBhd2FpdCBIdHRwQ2xpZW50LlRBU0tfUVVFVUVTW2hvc3RdLnN1Ym1pdChhc3luYyBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiBIdHRwQ2xpZW50LlBST01JU0VfVEhST1RUTEVTW2hvc3RdLmFkZChmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKGZ1bmN0aW9uKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgIEh0dHBDbGllbnQuYXhpb3NEaWdlc3RBdXRoUmVxdWVzdChtZXRob2QsIHVyaSwgdXNlcm5hbWUsIHBhc3N3b3JkLCBib2R5LCBwcm94eVVyaSwgcmVqZWN0VW5hdXRob3JpemVkKS50aGVuKGZ1bmN0aW9uKHJlc3ApIHtcbiAgICAgICAgICAgIHJlc29sdmUocmVzcCk7XG4gICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyb3I6IEF4aW9zRXJyb3IpIHtcbiAgICAgICAgICAgIGlmIChlcnJvci5yZXNwb25zZT8uc3RhdHVzKSByZXNvbHZlKGVycm9yLnJlc3BvbnNlKTtcbiAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJSZXF1ZXN0IGZhaWxlZCB3aXRob3V0IHJlc3BvbnNlOiBcIiArIG1ldGhvZCArIFwiIFwiICsgdXJpICsgXCIgZHVlIHRvIHVuZGVybHlpbmcgZXJyb3I6XFxuXCIgKyBlcnJvci5tZXNzYWdlICsgXCJcXG5cIiArIGVycm9yLnN0YWNrKSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0pO1xuXG4gICAgICB9LmJpbmQodGhpcykpO1xuICAgIH0pO1xuXG4gICAgLy8gbm9ybWFsaXplIHJlc3BvbnNlXG4gICAgbGV0IG5vcm1hbGl6ZWRSZXNwb25zZTogYW55ID0ge307XG4gICAgbm9ybWFsaXplZFJlc3BvbnNlLnN0YXR1c0NvZGUgPSByZXNwLnN0YXR1cztcbiAgICBub3JtYWxpemVkUmVzcG9uc2Uuc3RhdHVzVGV4dCA9IHJlc3Auc3RhdHVzVGV4dDtcbiAgICBub3JtYWxpemVkUmVzcG9uc2UuaGVhZGVycyA9IHsuLi5yZXNwLmhlYWRlcnN9O1xuICAgIG5vcm1hbGl6ZWRSZXNwb25zZS5ib2R5ID0gaXNCaW5hcnkgPyBuZXcgVWludDhBcnJheShyZXNwLmRhdGEpIDogcmVzcC5kYXRhO1xuICAgIGlmIChub3JtYWxpemVkUmVzcG9uc2UuYm9keSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKSBub3JtYWxpemVkUmVzcG9uc2UuYm9keSA9IG5ldyBVaW50OEFycmF5KG5vcm1hbGl6ZWRSZXNwb25zZS5ib2R5KTsgIC8vIGhhbmRsZSBlbXB0eSBiaW5hcnkgcmVxdWVzdFxuICAgIHJldHVybiBub3JtYWxpemVkUmVzcG9uc2U7XG4gIH1cblxuICBwcm90ZWN0ZWQgc3RhdGljIGF4aW9zRGlnZXN0QXV0aFJlcXVlc3QgPSBhc3luYyBmdW5jdGlvbihtZXRob2QsIHVybCwgdXNlcm5hbWUsIHBhc3N3b3JkLCBib2R5LCBwcm94eVVyaT8sIHJlamVjdFVuYXV0aG9yaXplZD8pIHtcbiAgICBpZiAodHlwZW9mIENyeXB0b0pTID09PSAndW5kZWZpbmVkJyAmJiB0eXBlb2YgcmVxdWlyZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgdmFyIENyeXB0b0pTID0gcmVxdWlyZSgnY3J5cHRvLWpzJyk7XG4gICAgfVxuXG4gICAgLy8gcm91dGUgdGhyb3VnaCBzb2NrcyBwcm94eSBpZiBjb25maWd1cmVkLCBvdGhlcndpc2UgdXNlIGRpcmVjdCBhZ2VudHNcbiAgICBjb25zdCBzb2Nrc0FnZW50ID0gcHJveHlVcmkgPyBIdHRwQ2xpZW50LmdldFNvY2tzQWdlbnQocHJveHlVcmksIHJlamVjdFVuYXV0aG9yaXplZCAhPT0gZmFsc2UpIDogdW5kZWZpbmVkO1xuICAgIGNvbnN0IGh0dHBBZ2VudCA9IHNvY2tzQWdlbnQgPz8gKHVybC5zdGFydHNXaXRoKFwiaHR0cHNcIikgPyB1bmRlZmluZWQgOiBIdHRwQ2xpZW50LmdldEh0dHBBZ2VudCgpKTtcbiAgICBjb25zdCBodHRwc0FnZW50ID0gc29ja3NBZ2VudCA/PyAodXJsLnN0YXJ0c1dpdGgoXCJodHRwc1wiKSA/IEh0dHBDbGllbnQuZ2V0SHR0cHNBZ2VudCgpIDogdW5kZWZpbmVkKTtcblxuICAgIGNvbnN0IGdlbmVyYXRlQ25vbmNlID0gZnVuY3Rpb24oKTogc3RyaW5nIHtcbiAgICAgIGNvbnN0IGNoYXJhY3RlcnMgPSAnYWJjZGVmMDEyMzQ1Njc4OSc7XG4gICAgICBsZXQgdG9rZW4gPSAnJztcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkrKykge1xuICAgICAgICBjb25zdCByYW5kTnVtID0gTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogY2hhcmFjdGVycy5sZW5ndGgpO1xuICAgICAgICB0b2tlbiArPSBjaGFyYWN0ZXJzLnNsaWNlKHJhbmROdW0sIHJhbmROdW0rMSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gdG9rZW47XG4gICAgfVxuXG4gICAgbGV0IGNvdW50ID0gMDtcbiAgICByZXR1cm4gYXhpb3MucmVxdWVzdCh7XG4gICAgICB1cmw6IHVybCxcbiAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL2pzb24nXG4gICAgICB9LFxuICAgICAgcmVzcG9uc2VUeXBlOiBib2R5IGluc3RhbmNlb2YgVWludDhBcnJheSA/ICdhcnJheWJ1ZmZlcicgOiB1bmRlZmluZWQsXG4gICAgICBodHRwQWdlbnQ6IGh0dHBBZ2VudCxcbiAgICAgIGh0dHBzQWdlbnQ6IGh0dHBzQWdlbnQsXG4gICAgICBwcm94eTogc29ja3NBZ2VudCA/IGZhbHNlIDogdW5kZWZpbmVkLCAvLyBlbnYgcHJveGllcyBtdXN0IG5vdCBieXBhc3MgdGhlIHNvY2tzIGFnZW50XG4gICAgICBkYXRhOiBib2R5LFxuICAgICAgdHJhbnNmb3JtUmVzcG9uc2U6IHJlcyA9PiByZXMsXG4gICAgICBhZGFwdGVyOiBHZW5VdGlscy5pc0Rlbm8oKSA/IFsnZmV0Y2gnXSA6IFsnaHR0cCcsICd4aHInLCAnZmV0Y2gnXVxuICAgIH0pLmNhdGNoKGFzeW5jIChlcnIpID0+IHtcbiAgICAgIGlmIChlcnIucmVzcG9uc2U/LnN0YXR1cyA9PT0gNDAxKSB7XG4gICAgICAgIGxldCBhdXRoSGVhZGVyID0gZXJyLnJlc3BvbnNlLmhlYWRlcnNbJ3d3dy1hdXRoZW50aWNhdGUnXS5yZXBsYWNlKC8sXFxzRGlnZXN0LiovLCBcIlwiKTtcbiAgICAgICAgaWYgKCFhdXRoSGVhZGVyKSB7XG4gICAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gRGlnZXN0IHFvcD1cImF1dGhcIixhbGdvcml0aG09TUQ1LHJlYWxtPVwibW9uZXJvLXJwY1wiLG5vbmNlPVwiaEJaMnJaSXhFbHY0bHFDUnJVeWxYQT09XCIsc3RhbGU9ZmFsc2VcbiAgICAgICAgY29uc3QgYXV0aEhlYWRlck1hcCA9IGF1dGhIZWFkZXIucmVwbGFjZShcIkRpZ2VzdCBcIiwgXCJcIikucmVwbGFjZUFsbCgnXCInLCBcIlwiKS5zcGxpdChcIixcIikucmVkdWNlKChwcmV2LCBjdXJyKSA9PiAoey4uLnByZXYsIFtjdXJyLnNwbGl0KFwiPVwiKVswXV06IGN1cnIuc3BsaXQoXCI9XCIpLnNsaWNlKDEpLmpvaW4oJz0nKX0pLCB7fSlcblxuICAgICAgICArK2NvdW50O1xuXG4gICAgICAgIGNvbnN0IGNub25jZSA9IGdlbmVyYXRlQ25vbmNlKCk7XG4gICAgICAgIGNvbnN0IEhBMSA9IENyeXB0b0pTLk1ENSh1c2VybmFtZSsnOicrYXV0aEhlYWRlck1hcC5yZWFsbSsnOicrcGFzc3dvcmQpLnRvU3RyaW5nKCk7XG4gICAgICAgIGNvbnN0IEhBMiA9IENyeXB0b0pTLk1ENShtZXRob2QrJzonK3VybCkudG9TdHJpbmcoKTtcblxuICAgICAgICBjb25zdCByZXNwb25zZSA9IENyeXB0b0pTLk1ENShIQTErJzonK1xuICAgICAgICAgIGF1dGhIZWFkZXJNYXAubm9uY2UrJzonK1xuICAgICAgICAgICgnMDAwMDAwMDAnICsgY291bnQpLnNsaWNlKC04KSsnOicrXG4gICAgICAgICAgY25vbmNlKyc6JytcbiAgICAgICAgICBhdXRoSGVhZGVyTWFwLnFvcCsnOicrXG4gICAgICAgICAgSEEyKS50b1N0cmluZygpO1xuICAgICAgICBjb25zdCBkaWdlc3RBdXRoSGVhZGVyID0gJ0RpZ2VzdCcrJyAnK1xuICAgICAgICAgICd1c2VybmFtZT1cIicrdXNlcm5hbWUrJ1wiLCAnK1xuICAgICAgICAgICdyZWFsbT1cIicrYXV0aEhlYWRlck1hcC5yZWFsbSsnXCIsICcrXG4gICAgICAgICAgJ25vbmNlPVwiJythdXRoSGVhZGVyTWFwLm5vbmNlKydcIiwgJytcbiAgICAgICAgICAndXJpPVwiJyt1cmwrJ1wiLCAnK1xuICAgICAgICAgICdyZXNwb25zZT1cIicrcmVzcG9uc2UrJ1wiLCAnK1xuICAgICAgICAgICdvcGFxdWU9XCInKyhhdXRoSGVhZGVyTWFwLm9wYXF1ZSA/PyBudWxsKSsnXCIsICcrXG4gICAgICAgICAgJ3FvcD0nK2F1dGhIZWFkZXJNYXAucW9wKycsICcrXG4gICAgICAgICAgJ25jPScrKCcwMDAwMDAwMCcgKyBjb3VudCkuc2xpY2UoLTgpKycsICcrXG4gICAgICAgICAgJ2Nub25jZT1cIicrY25vbmNlKydcIic7XG5cbiAgICAgICAgY29uc3QgZmluYWxSZXNwb25zZSA9IGF3YWl0IGF4aW9zLnJlcXVlc3Qoe1xuICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgIG1ldGhvZDogbWV0aG9kLFxuICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogZGlnZXN0QXV0aEhlYWRlcixcbiAgICAgICAgICAgICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbidcbiAgICAgICAgICB9LFxuICAgICAgICAgIHJlc3BvbnNlVHlwZTogYm9keSBpbnN0YW5jZW9mIFVpbnQ4QXJyYXkgPyAnYXJyYXlidWZmZXInIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGh0dHBBZ2VudDogdXJsLnN0YXJ0c1dpdGgoXCJodHRwc1wiKSA/IHVuZGVmaW5lZCA6IEh0dHBDbGllbnQuZ2V0SHR0cEFnZW50KCksXG4gICAgICAgICAgaHR0cHNBZ2VudDogdXJsLnN0YXJ0c1dpdGgoXCJodHRwc1wiKSA/IEh0dHBDbGllbnQuZ2V0SHR0cHNBZ2VudCgpIDogdW5kZWZpbmVkLFxuICAgICAgICAgIGRhdGE6IGJvZHksXG4gICAgICAgICAgdHJhbnNmb3JtUmVzcG9uc2U6IHJlcyA9PiByZXMsXG4gICAgICAgICAgYWRhcHRlcjogR2VuVXRpbHMuaXNEZW5vKCkgPyBbJ2ZldGNoJ10gOiBbJ2h0dHAnLCAneGhyJywgJ2ZldGNoJ11cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZpbmFsUmVzcG9uc2U7XG4gICAgICB9XG4gICAgICB0aHJvdyBlcnI7XG4gICAgfSkuY2F0Y2goZXJyID0+IHtcbiAgICAgIHRocm93IGVycjtcbiAgICB9KTtcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsU0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUMsYUFBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUUsV0FBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsZ0JBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFJLEtBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFLLE1BQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFNLE1BQUEsR0FBQVAsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQTtBQUNBO0FBQ0E7QUFDZSxNQUFNTyxVQUFVLENBQUM7O0VBRTlCLE9BQU9DLHVCQUF1QixHQUFHLEVBQUU7O0VBRW5DO0VBQ0EsT0FBaUJDLGVBQWUsR0FBRztJQUNqQ0MsTUFBTSxFQUFFLEtBQUs7SUFDYkMsdUJBQXVCLEVBQUUsS0FBSztJQUM5QkMsa0JBQWtCLEVBQUU7RUFDdEIsQ0FBQzs7RUFFRDtFQUNBLE9BQWlCQyxpQkFBaUIsR0FBRyxFQUFFO0VBQ3ZDLE9BQWlCQyxXQUFXLEdBQUcsRUFB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