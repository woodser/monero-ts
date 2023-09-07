export = LibraryUtils;
/**
 * Collection of helper utilities for the library.
 *
 * @hideconstructor
 */
declare class LibraryUtils {
    /**
     * Log a message.
     *
     * @param {int} level - log level of the message
     * @param {string} msg - message to log
     */
    static log(level: int, msg: string): void;
    /**
     * Set the library's log level with 0 being least verbose.
     *
     * @param {int} level - the library's log level
     */
    static setLogLevel(level: int): Promise<void>;
    /**
     * Get the library's log level.
     *
     * @return {int} the library's log level
     */
    static getLogLevel(): int;
    /**
     * Get the total memory used by WebAssembly.
     *
     * @return {int} the total memory used by WebAssembly
     */
    static getWasmMemoryUsed(): int;
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
    static setRejectUnauthorizedFn(fnId: string, fn: Function): void;
    /**
     * Indicate if unauthorized requests should be rejected.
     *
     * @param {string} fnId - uniquely identifies the function
     */
    static isRejectUnauthorized(fnId: string): any;
    /**
     * Set the path to load the worker. Defaults to "/monero_web_worker.js" in the browser
     * and "./MoneroWebWorker.js" in node.
     *
     * @param {string} workerDistPath - path to load the worker
     */
    static setWorkerDistPath(workerDistPath: string): void;
    /**
     * Get a singleton instance of a worker to share.
     *
     * @return {Worker} a worker to share among wallet instances
     */
    static getWorker(): Worker;
    /**
     * Terminate monero-javascript's singleton worker.
     */
    static terminateWorker(): Promise<void>;
    /**
     * Invoke a worker function and get the result with error handling.
     *
     * @param {string} objectId identifies the worker object to invoke (default random id)
     * @param {string} fnName is the name of the function to invoke
     * @param {any[]} args are function arguments to invoke with
     * @return {any} resolves with response payload from the worker or an error
     */
    static invokeWorker(objectId: string, fnName: string, args: any[]): any;
    static serializeError(err: any): {
        name: any;
        message: any;
        stack: any;
    };
    static deserializeError(serializedErr: any): Error;
    static _initWasmModule(wasmModule: any): void;
    static _prefixWindowsPath(path: any): any;
}
declare namespace LibraryUtils {
    export let LOG_LEVEL: number;
    export let WORKER_DIST_PATH_DEFAULT: any;
    import WORKER_DIST_PATH = WORKER_DIST_PATH_DEFAULT;
    export { WORKER_DIST_PATH };
}
