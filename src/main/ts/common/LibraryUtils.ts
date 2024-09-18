import assert from "assert";
import GenUtils from "./GenUtils";
import MoneroError from "./MoneroError";
import ThreadPool from "./ThreadPool";
import path from "path";

/**
 * Collection of helper utilities for the library.
 */
export default class LibraryUtils {

  // static variables
  static LOG_LEVEL = 0;
  static WASM_MODULE: any;
  static WORKER: any;
  static WORKER_OBJECTS: any;
  static FULL_LOADED: any;
  static REJECT_UNAUTHORIZED_FNS: any;
  static readonly MUTEX = new ThreadPool(1);
  static WORKER_DIST_PATH_DEFAULT = GenUtils.isBrowser() ? "/monero.worker.js" : function() {

    // get worker path in dist (assumes library is running from src or dist)
    let curPath = path.normalize(__dirname);
    const targetPath = path.join('monero-ts', 'dist');
    if (!curPath.includes(targetPath)) curPath = path.join(curPath, "../../../../dist/src/main/js/common");
    return LibraryUtils.prefixWindowsPath(path.join(curPath, "./MoneroWebWorker.js"));
  }();
  static WORKER_DIST_PATH = LibraryUtils.WORKER_DIST_PATH_DEFAULT;
  static WORKER_LOADER?: () => Worker = undefined;
  
  /**
   * Log a message.
   *
   * @param {number} level - log level of the message
   * @param {string} msg - message to log
   */
  static log(level, msg) {
    assert(level === parseInt(level, 10) && level >= 0, "Log level must be an integer >= 0");
    if (LibraryUtils.LOG_LEVEL >= level) console.log(msg);
  }
  
  /**
   * Set the library's log level with 0 being least verbose.
   *
   * @param {number} level - the library's log level
   */
  static async setLogLevel(level) {
    assert(level === parseInt(level, 10) && level >= 0, "Log level must be an integer >= 0");
    LibraryUtils.LOG_LEVEL = level;
    if (LibraryUtils.WASM_MODULE) LibraryUtils.WASM_MODULE.set_log_level(level);
    if (LibraryUtils.WORKER) await LibraryUtils.invokeWorker(undefined, "setLogLevel", [level]);
  }
  
  /**
   * Get the library's log level.
   *
   * @return {number} the library's log level
   */
  static getLogLevel(): number {
    return LibraryUtils.LOG_LEVEL;
  }
  
  /**
   * Get the total memory used by WebAssembly.
   * 
   * @return {Promise<number>} the total memory used by WebAssembly
   */
  static async getWasmMemoryUsed(): Promise<number> {
    let total = 0;
    if (LibraryUtils.WORKER) total += await LibraryUtils.invokeWorker(undefined, "getWasmMemoryUsed", []) as number;
    if (LibraryUtils.getWasmModule() && LibraryUtils.getWasmModule().HEAP8) total += LibraryUtils.getWasmModule().HEAP8.length;
    return total;
  }
  
  /**
   * Get the WebAssembly module in the current context (nodejs, browser main thread or worker).
   */
  static getWasmModule() {
    return LibraryUtils.WASM_MODULE;
  }
  
  /**
   * Load the WebAssembly full module with caching.
   * 
   * The full module is a superset of the keys module and overrides it.
   */
  static async loadWasmModule() {
    
    // use cache if suitable, full module supersedes keys module because it is superset
    if (LibraryUtils.WASM_MODULE && LibraryUtils.FULL_LOADED) return LibraryUtils.WASM_MODULE;
    
    // load module
    const module = await require("#monero-ts/monero.js")();
    LibraryUtils.WASM_MODULE = module;
    delete LibraryUtils.WASM_MODULE.then;
    LibraryUtils.FULL_LOADED = true;
    LibraryUtils.initWasmModule(LibraryUtils.WASM_MODULE);
    return module;
  }
  
  /**
   * Register a function by id which informs if unauthorized requests (e.g.
   * self-signed certificates) should be rejected.
   * 
   * @param {string} fnId - unique identifier for the function
   * @param {function} fn - function to inform if unauthorized requests should be rejected
   */
  static setRejectUnauthorizedFn(fnId, fn) {
    if (!LibraryUtils.REJECT_UNAUTHORIZED_FNS) LibraryUtils.REJECT_UNAUTHORIZED_FNS = [];
    if (fn === undefined) delete LibraryUtils.REJECT_UNAUTHORIZED_FNS[fnId];
    else LibraryUtils.REJECT_UNAUTHORIZED_FNS[fnId] = fn;
  }
  
  /**
   * Indicate if unauthorized requests should be rejected.
   * 
   * @param {string} fnId - uniquely identifies the function
   */
  static isRejectUnauthorized(fnId) {
    if (!LibraryUtils.REJECT_UNAUTHORIZED_FNS[fnId]) throw new Error("No function registered with id " + fnId + " to inform if unauthorized reqs should be rejected");
    return LibraryUtils.REJECT_UNAUTHORIZED_FNS[fnId]();
  }
  
  /**
   * Set the path to load the worker. Defaults to "/monero.worker.js" in the browser
   * and "./MoneroWebWorker.js" in node.
   * 
   * @param {string} workerDistPath - path to load the worker
   */
  static setWorkerDistPath(workerDistPath) {
    let path = LibraryUtils.prefixWindowsPath(workerDistPath ? workerDistPath : LibraryUtils.WORKER_DIST_PATH_DEFAULT);
    if (path !== LibraryUtils.WORKER_DIST_PATH) delete LibraryUtils.WORKER;
    LibraryUtils.WORKER_DIST_PATH = path;
  }

  /**
   * Set the worker loader closure to customize worker loading.
   * Takes precedence over default loading mechanisms.
   *
   * Could be as simple as `() => new Worker(new URL("monero-ts/dist/monero.worker.js", import.meta.url));` for browsers.
   *
   * @param {function} loader - loader function which instantiates a worker
   */
  static setWorkerLoader(loader?: () => Worker): void {
    LibraryUtils.WORKER_LOADER = loader;
  }

  /**
   * Get a singleton instance of a worker to share.
   * 
   * @return {Worker} a worker to share among wallet instances
   */
  static async getWorker() {
    
    // one time initialization
    if (!LibraryUtils.WORKER) {

      // try to load worker with user provided closure
      if (LibraryUtils.WORKER_LOADER) {
        LibraryUtils.WORKER = LibraryUtils.WORKER_LOADER();
      } else {

        // otherwise use standard loading mechanisms for browser and node
        if (GenUtils.isBrowser()) {
          LibraryUtils.WORKER = new Worker(LibraryUtils.WORKER_DIST_PATH);
        } else {
          const Worker = require("web-worker"); // import web worker if nodejs
          LibraryUtils.WORKER = new Worker(LibraryUtils.WORKER_DIST_PATH);
        }
      }
      LibraryUtils.WORKER_OBJECTS = {};  // store per object running in the worker
      
      // receive worker errors
      LibraryUtils.WORKER.onerror = function(err) {
        console.error("Error posting message to monero.worker.js; is it built and copied to the app's public or build directory?");
        console.log(err);
      };
      
      // receive worker messages
      LibraryUtils.WORKER.onmessage = function(e) {
        
        // lookup object id, callback function, and this arg
        let thisArg = undefined;
        let callbackFn = LibraryUtils.WORKER_OBJECTS[e.data[0]].callbacks[e.data[1]]; // look up by object id then by function name
        if (callbackFn === undefined) throw new Error("No worker callback function defined for key '" + e.data[1] + "'");
        if (callbackFn instanceof Array) {  // this arg may be stored with callback function
          thisArg = callbackFn[1];
          callbackFn = callbackFn[0];
        }
        
        // invoke callback function with this arg and arguments
        callbackFn.apply(thisArg, e.data.slice(2));
      }
    }
    return LibraryUtils.WORKER;
  }

  static addWorkerCallback(objectId, callbackId, callbackArgs) {
    LibraryUtils.WORKER_OBJECTS[objectId].callbacks[callbackId] = callbackArgs;
  }

  static removeWorkerCallback(objectId, callbackId) {
    delete LibraryUtils.WORKER_OBJECTS[objectId].callbacks[callbackId];
  }

  static removeWorkerObject(objectId) {
    delete LibraryUtils.WORKER_OBJECTS[objectId];
  }
  
  /**
   * Terminate monero-ts's singleton worker.
   */
  static async terminateWorker() {
    if (LibraryUtils.WORKER) {
      LibraryUtils.WORKER.terminate();
      delete LibraryUtils.WORKER;
      LibraryUtils.WORKER = undefined;
    }
  }

  /**
   * Invoke a worker function and get the result with error handling.
   * 
   * @param {string} objectId identifies the worker object to invoke (default random id)
   * @param {string} fnName is the name of the function to invoke
   * @param {any[]} [args] are function arguments to invoke with
   * @return {any} resolves with response payload from the worker or an error
   */
  static async invokeWorker(objectId, fnName, args) {
    assert(fnName.length >= 2);
    let worker = await LibraryUtils.getWorker();
    let randomObject = objectId === undefined;
    if (randomObject) objectId = GenUtils.getUUID();
    if (!LibraryUtils.WORKER_OBJECTS[objectId]) LibraryUtils.WORKER_OBJECTS[objectId] = {callbacks: {}};
    let callbackId = GenUtils.getUUID();
    try {
      return await new Promise((resolve, reject) => {
        LibraryUtils.WORKER_OBJECTS[objectId].callbacks[callbackId] = (resp) => {  // TODO: this defines function once per callback
          delete LibraryUtils.WORKER_OBJECTS[objectId].callbacks[callbackId];
          if (randomObject) delete LibraryUtils.WORKER_OBJECTS[objectId];
          resp ? (resp.error ? reject(new Error(JSON.stringify(resp.error))) : resolve(resp.result)) : resolve(undefined);
        };
        worker.postMessage([objectId, fnName, callbackId].concat(args === undefined ? [] : GenUtils.listify(args)));
      });
    } catch (e: any) {
      throw LibraryUtils.deserializeError(JSON.parse(e.message));
    }
  }

  static serializeError(err) {
    const serializedErr: any = { name: err.name, message: err.message, stack: err.stack };
    if (err instanceof MoneroError) serializedErr.type = "MoneroError";
    return serializedErr;
  }

  protected static deserializeError(serializedErr) {
    const err = serializedErr.type === "MoneroError" ? new MoneroError(serializedErr.message) : new Error(serializedErr.message);
    err.name = serializedErr.name;
    err.stack = err.stack + "\nWorker error: " + serializedErr.stack;
    return err;
  }

  static async queueTask<T>(asyncFn: () => Promise<T>): Promise<T> {
    return LibraryUtils.MUTEX.submit(asyncFn);
  }

  static async exists(fs: any, path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch (err) {
      return false;
    }
  }
  
  // ------------------------------ PRIVATE HELPERS ---------------------------
  
  protected static initWasmModule(wasmModule) {
    wasmModule.taskQueue = new ThreadPool(1);
    wasmModule.queueTask = async function(asyncFn) { return wasmModule.taskQueue.submit(asyncFn); }
  }
  
  protected static prefixWindowsPath(path) {
    if (/^[A-Z]:/.test(path) && path.indexOf("file://") == -1) path = "file://" + path; // prepend e.g. C: paths with file://
    return path;
  }
}
