export = HttpClient;
/**
 * Handle HTTP requests with a uniform interface.
 *
 * @hideconstructor
 */
declare class HttpClient {
    /**
     * <p>Make a HTTP request.<p>
     *
     * @param {object} request - configures the request to make
     * @param {string} request.method - HTTP method ("GET", "PUT", "POST", "DELETE", etc)
     * @param {string} request.uri - uri to request
     * @param {string|object|Uint8Array} request.body - request body
     * @param {string} request.username - username to authenticate the request (optional)
     * @param {string} request.password - password to authenticate the request (optional)
     * @param {object} request.headers - headers to add to the request (optional)
     * @param {string} request.requestApi - one of "fetch" or "xhr" (default "fetch")
     * @param {boolean} request.resolveWithFullResponse - return full response if true, else body only (default false)
     * @param {boolean} request.rejectUnauthorized - whether or not to reject self-signed certificates (default true)
     * @param {number} request.timeout - maximum time allowed in milliseconds
     * @param {number} request.proxyToWorker - proxy request to worker thread
     * @returns {object} response - the response object
     * @returns {string|object|Uint8Array} response.body - the response body
     * @returns {number} response.statusCode - the response code
     * @returns {String} response.statusText - the response message
     * @returns {object} response.headers - the response headers
     */
    static request(request: {
        method: string;
        uri: string;
        body: string | object | Uint8Array;
        username: string;
        password: string;
        headers: object;
        requestApi: string;
        resolveWithFullResponse: boolean;
        rejectUnauthorized: boolean;
        timeout: number;
        proxyToWorker: number;
    }): object;
    static _requestFetch(req: any): Promise<{
        statusCode: any;
        statusText: any;
        headers: any;
        body: any;
    }>;
    static _requestXhr(req: any): Promise<{
        statusCode: any;
        statusText: any;
        headers: {};
        body: any;
    }>;
    /**
     * Get a singleton instance of an HTTP client to share.
     *
     * @return {http.Agent} a shared agent for network requests among library instances
     */
    static _getHttpAgent(): http.Agent;
    /**
     * Get a singleton instance of an HTTPS client to share.
     *
     * @return {https.Agent} a shared agent for network requests among library instances
     */
    static _getHttpsAgent(): https.Agent;
    static _parseXhrResponseHeaders(headersStr: any): {};
}
declare namespace HttpClient {
    /**
     * Modification of digest auth request by @inorganik.
     *
     * Dependent on CryptoJS MD5 hashing: http://crypto-js.googlecode.com/svn/tags/3.1.2/build/rollups/md5.js
     *
     * MIT licensed.
     */
    function digestAuthRequest(method: any, url: any, username: any, password: any): void;
    namespace _DEFAULT_REQUEST {
        let method: string;
        let requestApi: string;
        let resolveWithFullResponse: boolean;
        let rejectUnauthorized: boolean;
    }
    let _PROMISE_THROTTLES: any[];
    let _TASK_QUEUES: any[];
    let _DEFAULT_TIMEOUT: number;
    let MAX_TIMEOUT: number;
}
