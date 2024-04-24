import ThreadPool from "./ThreadPool";
/**
 * Collection of helper utilities for the library.
 */
export default class LibraryUtils {
    static LOG_LEVEL: number;
    static WASM_MODULE: any;
    static WORKER: any;
    static WORKER_OBJECTS: any;
    static FULL_LOADED: any;
    static REJECT_UNAUTHORIZED_FNS: any;
    static readonly MUTEX: ThreadPool;
    static WORKER_DIST_PATH_DEFAULT: any;
    static WORKER_DIST_PATH: any;
    /**
     * Log a message.
     *
     * @param {number} level - log level of the message
     * @param {string} msg - message to log
     */
    static log(level: any, msg: any): void;
    /**
     * Set the library's log level with 0 being least verbose.
     *
     * @param {number} level - the library's log level
     */
    static setLogLevel(level: any): Promise<void>;
    /**
     * Get the library's log level.
     *
     * @return {number} the library's log level
     */
    static getLogLevel(): number;
    /**
     * Get the total memory used by WebAssembly.
     *
     * @return {Promise<number>} the total memory used by WebAssembly
     */
    static getWasmMemoryUsed(): Promise<number>;
    /**
     * Get the WebAssembly module in the current context (nodejs, browser main thread or worker).
     */
    static getWasmModule(): any;
    /**
     * Load the WebAssembly keys module with caching.
     */
    static loadKeysModule(): Promise<any>;
    /**
     * Load the WebAssembly full module with caching.
     *
     * The full module is a superset of the keys module and overrides it.
     *
     * TODO: this is separate static function from loadKeysModule() because webpack cannot bundle worker using runtime param for conditional import
     */
    static loadFullModule(): Promise<any>;
    /**
     * Register a function by id which informs if unauthorized requests (e.g.
     * self-signed certificates) should be rejected.
     *
     * @param {string} fnId - unique identifier for the function
     * @param {function} fn - function to inform if unauthorized requests should be rejected
     */
    static setRejectUnauthorizedFn(fnId: any, fn: any): void;
    /**
     * Indicate if unauthorized requests should be rejected.
     *
     * @param {string} fnId - uniquely identifies the function
     */
    static isRejectUnauthorized(fnId: any): any;
    /**
     * Set the path to load the worker. Defaults to "/monero_web_worker.js" in the browser
     * and "./MoneroWebWorker.js" in node.
     *
     * @param {string} workerDistPath - path to load the worker
     */
    static setWorkerDistPath(workerDistPath: any): void;
    /**
     * Get a singleton instance of a worker to share.
     *
     * @return {Worker} a worker to share among wallet instances
     */
    static getWorker(): Promise<any>;
    static addWorkerCallback(objectId: any, callbackId: any, callbackArgs: any): void;
    static removeWorkerCallback(objectId: any, callbackId: any): void;
    static removeWorkerObject(objectId: any): void;
    /**
     * Terminate monero-ts's singleton worker.
     */
    static terminateWorker(): Promise<void>;
    /**
     * Invoke a worker function and get the result with error handling.
     *
     * @param {string} objectId identifies the worker object to invoke (default random id)
     * @param {string} fnName is the name of the function to invoke
     * @param {any[]} [args] are function arguments to invoke with
     * @return {any} resolves with response payload from the worker or an error
     */
    static invokeWorker(objectId: any, fnName: any, args: any): Promise<unknown>;
    static serializeError(err: any): any;
    protected static deserializeError(serializedErr: any): Error;
    protected static initWasmModule(wasmModule: any): void;
    protected static prefixWindowsPath(path: any): any;
    static queueTask<T>(asyncFn: () => Promise<T>): Promise<T>;
}
