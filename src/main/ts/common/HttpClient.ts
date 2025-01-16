import GenUtils from "./GenUtils";
import LibraryUtils from "./LibraryUtils";
import ThreadPool from "./ThreadPool";
import PromiseThrottle from "promise-throttle";
import http from "http";
import https from "https";
import axios, { AxiosError } from "axios";

/**
 * Handle HTTP requests with a uniform interface.
 */
export default class HttpClient {

  static MAX_REQUESTS_PER_SECOND = 50;

  // default request config
  protected static DEFAULT_REQUEST = {
    method: "GET",
    resolveWithFullResponse: false,
    rejectUnauthorized: true
  }

  // rate limit requests per host
  protected static PROMISE_THROTTLES = [];
  protected static TASK_QUEUES = [];
  protected static DEFAULT_TIMEOUT = 60000;
  static MAX_TIMEOUT = 2147483647; // max 32-bit signed number

  protected static HTTP_AGENT: any;
  protected static HTTPS_AGENT: any;

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
        return await LibraryUtils.invokeWorker(undefined, "httpRequest", request);
      } catch (err: any) {
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
    try { request.host = new URL(request.uri).host; } // hostname:port
    catch (err) { throw new Error("Invalid request URL: " + request.uri); }
    if (request.body && !(typeof request.body === "string" || typeof request.body === "object")) {
      throw new Error("Request body type is not string or object");
    }

    // initialize one task queue per host
    if (!HttpClient.TASK_QUEUES[request.host]) HttpClient.TASK_QUEUES[request.host] = new ThreadPool(1);

    // initialize one promise throttle per host
    if (!HttpClient.PROMISE_THROTTLES[request.host]) {
      HttpClient.PROMISE_THROTTLES[request.host] = new PromiseThrottle({
        requestsPerSecond: HttpClient.MAX_REQUESTS_PER_SECOND, // TODO: HttpClient should not depend on MoneroUtils for configuration
        promiseImplementation: Promise
      });
    }

    // request using fetch or xhr with timeout
    let timeout = request.timeout === undefined ? HttpClient.DEFAULT_TIMEOUT : request.timeout === 0 ? HttpClient.MAX_TIMEOUT : request.timeout;
    let requestPromise = HttpClient.requestAxios(request);
    return GenUtils.executeWithTimeout(requestPromise, timeout);
  }

  // ----------------------------- PRIVATE HELPERS ----------------------------


  /**
   * Get a singleton instance of an HTTP client to share.
   *
   * @return {http.Agent} a shared agent for network requests among library instances
   */
  protected static getHttpAgent() {
    if (!HttpClient.HTTP_AGENT) HttpClient.HTTP_AGENT = new http.Agent({
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
  protected static getHttpsAgent() {
    if (!HttpClient.HTTPS_AGENT) HttpClient.HTTPS_AGENT = new https.Agent({
      keepAlive: true,
      family: 4 // use IPv4
    });
    return HttpClient.HTTPS_AGENT;
  }

  protected static async requestAxios(req) {
    if (req.headers) throw new Error("Custom headers not implemented in XHR request");  // TODO

    // collect params from request which change on await
    const method = req.method;
    const uri = req.uri;
    const host = req.host;
    const username = req.username;
    const password = req.password;
    const body = req.body;
    const isBinary = body instanceof Uint8Array;

    // queue and throttle requests to execute in serial and rate limited per host
    const resp = await HttpClient.TASK_QUEUES[host].submit(async function() {
      return HttpClient.PROMISE_THROTTLES[host].add(function() {
        return new Promise(function(resolve, reject) {
          HttpClient.axiosDigestAuthRequest(method, uri, username, password, body).then(function(resp) {
            resolve(resp);
          }).catch(function(error: AxiosError) {
            if (error.response?.status) resolve(error.response);
            reject(new Error("Request failed without response: " + method + " " + uri + " due to underlying error:\n" + error.message + "\n" + error.stack));
          });
        });

      }.bind(this));
    });

    // normalize response
    let normalizedResponse: any = {};
    normalizedResponse.statusCode = resp.status;
    normalizedResponse.statusText = resp.statusText;
    normalizedResponse.headers = {...resp.headers};
    normalizedResponse.body = isBinary ? new Uint8Array(resp.data) : resp.data;
    if (normalizedResponse.body instanceof ArrayBuffer) normalizedResponse.body = new Uint8Array(normalizedResponse.body);  // handle empty binary request
    return normalizedResponse;
  }

  protected static axiosDigestAuthRequest = async function(method, url, username, password, body) {
    if (typeof CryptoJS === 'undefined' && typeof require === 'function') {
      var CryptoJS = require('crypto-js');
    }

    const generateCnonce = function(): string {
      const characters = 'abcdef0123456789';
      let token = '';
      for (let i = 0; i < 16; i++) {
        const randNum = Math.round(Math.random() * characters.length);
        token += characters.slice(randNum, randNum+1);
      }
      return token;
    }

    let count = 0;
    return axios.request({
      url: url,
      method: method,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json'
      },
      responseType: body instanceof Uint8Array ? 'arraybuffer' : undefined,
      httpAgent: url.startsWith("https") ? undefined : HttpClient.getHttpAgent(),
      httpsAgent: url.startsWith("https") ? HttpClient.getHttpsAgent() : undefined,
      data: body,
      transformResponse: res => res,
      adapter: ['http', 'xhr', 'fetch'],
    }).catch(async (err) => {
      if (err.response?.status === 401) {
        let authHeader = err.response.headers['www-authenticate'].replace(/,\sDigest.*/, "");
        if (!authHeader) {
          throw err;
        }

        // Digest qop="auth",algorithm=MD5,realm="monero-rpc",nonce="hBZ2rZIxElv4lqCRrUylXA==",stale=false
        const authHeaderMap = authHeader.replace("Digest ", "").replaceAll('"', "").split(",").reduce((prev, curr) => ({...prev, [curr.split("=")[0]]: curr.split("=").slice(1).join('=')}), {})

        ++count;

        const cnonce = generateCnonce();
        const HA1 = CryptoJS.MD5(username+':'+authHeaderMap.realm+':'+password).toString();
        const HA2 = CryptoJS.MD5(method+':'+url).toString();

        const response = CryptoJS.MD5(HA1+':'+
          authHeaderMap.nonce+':'+
          ('00000000' + count).slice(-8)+':'+
          cnonce+':'+
          authHeaderMap.qop+':'+
          HA2).toString();
        const digestAuthHeader = 'Digest'+' '+
          'username="'+username+'", '+
          'realm="'+authHeaderMap.realm+'", '+
          'nonce="'+authHeaderMap.nonce+'", '+
          'uri="'+url+'", '+
          'response="'+response+'", '+
          'opaque="'+(authHeaderMap.opaque ?? null)+'", '+
          'qop='+authHeaderMap.qop+', '+
          'nc='+('00000000' + count).slice(-8)+', '+
          'cnonce="'+cnonce+'"';

        const finalResponse = await axios.request({
          url: url,
          method: method,
          timeout: this.timeout,
          headers: {
            'Authorization': digestAuthHeader,
            'Content-Type': 'application/json'
          },
          responseType: body instanceof Uint8Array ? 'arraybuffer' : undefined,
          httpAgent: url.startsWith("https") ? undefined : HttpClient.getHttpAgent(),
          httpsAgent: url.startsWith("https") ? HttpClient.getHttpsAgent() : undefined,
          data: body,
          transformResponse: res => res,
          adapter: ['http', 'xhr', 'fetch'],
        });

        return finalResponse;
      }
      throw err;
    }).catch(err => {
      throw err;
    });
  }
}
