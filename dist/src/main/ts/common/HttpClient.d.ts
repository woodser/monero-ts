/**
 * Handle HTTP requests with a uniform interface.
 */
export default class HttpClient {
    static MAX_REQUESTS_PER_SECOND: number;
    protected static DEFAULT_REQUEST: {
        method: string;
        resolveWithFullResponse: boolean;
        rejectUnauthorized: boolean;
    };
    protected static PROMISE_THROTTLES: any[];
    protected static TASK_QUEUES: any[];
    protected static DEFAULT_TIMEOUT: number;
    static MAX_TIMEOUT: number;
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
    static request(request: any): Promise<any>;
    /**
     * Get a singleton instance of an HTTP client to share.
     *
     * @return {http.Agent} a shared agent for network requests among library instances
     */
    protected static getHttpAgent(): any;
    /**
     * Get a singleton instance of an HTTPS client to share.
     *
     * @return {https.Agent} a shared agent for network requests among library instances
     */
    protected static getHttpsAgent(): any;
    protected static requestAxios(req: any): Promise<any>;
    protected static axiosDigestAuthRequest: (method: any, url: any, username: any, password: any, body: any) => Promise<import("axios").AxiosResponse<any, any>>;
}
