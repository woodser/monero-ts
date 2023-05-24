const assert = require("assert");
const GenUtils = require("./GenUtils");
const MoneroError = require("./MoneroError");
const ThreadPool = require("./ThreadPool");

/**
 * Collection of helper utilities for the library.
 * 
 * @hideconstructor
 */
class LibraryUtils {
  
  /**
   * Log a message.
   *
   * @param {int} level - log level of the message
   * @param {string} msg - message to log
   */
  static log(level, msg) {
    assert(level === parseInt(level, 10) && level >= 0, "Log level must be an integer >= 0");
    if (LibraryUtils.LOG_LEVEL >= level) console.log(msg);
  }
  
  /**
   * Set the library's log level with 0 being least verbose.
   *
   * @param {int} level - the library's log level
   */
  static async setLogLevel(level) {
    assert(level === parseInt(level, 10) && level >= 0, "Log level must be an integer >= 0");
    LibraryUtils.LOG_LEVEL = level;
    if (LibraryUtils.WORKER) await LibraryUtils.invokeWorker(GenUtils.getUUID(), "setLogLevel", [level]);
  }
  
  /**
   * Get the library's log level.
   *
   * @return {int} the library's log level
   */
  static getLogLevel() {
    return LibraryUtils.LOG_LEVEL;
  }
  
  /**
   * Get the total memory used by WebAssembly.
   * 
   * @return {int} the total memory used by WebAssembly
   */
  static async getWasmMemoryUsed() {
    let total = 0;
    if (LibraryUtils.WORKER) total += await LibraryUtils.invokeWorker(GenUtils.getUUID(), "getWasmMemoryUsed", []);
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
   * Load the WebAssembly keys module with caching.
   */
  static async loadKeysModule() {
    
    // use cache if suitable, full module supersedes keys module because it is superset
    if (LibraryUtils.WASM_MODULE) return LibraryUtils.WASM_MODULE;
    
    // load module
    delete LibraryUtils.WASM_MODULE;
    LibraryUtils.WASM_MODULE = require("../../../../dist/monero_wallet_keys")();
    return new Promise(function(resolve, reject) {
      LibraryUtils.WASM_MODULE.then(module => {
        LibraryUtils.WASM_MODULE = module
        delete LibraryUtils.WASM_MODULE.then;
        LibraryUtils._initWasmModule(LibraryUtils.WASM_MODULE);
        resolve(LibraryUtils.WASM_MODULE);
      });
    });
  }
  
  /**
   * Load the WebAssembly full module with caching.
   * 
   * The full module is a superset of the keys module and overrides it.
   * 
   * TODO: this is separate static function from loadKeysModule() because webpack cannot bundle worker using runtime param for conditional import
   */
  static async loadFullModule() {
    
    // use cache if suitable, full module supersedes keys module because it is superset
    if (LibraryUtils.WASM_MODULE && LibraryUtils.FULL_LOADED) return LibraryUtils.WASM_MODULE;
    
    // load module
    delete LibraryUtils.WASM_MODULE;
    LibraryUtils.WASM_MODULE = require("../../../../dist/monero_wallet_full")();
    return new Promise(function(resolve, reject) {
      LibraryUtils.WASM_MODULE.then(module => {
        LibraryUtils.WASM_MODULE = module
        delete LibraryUtils.WASM_MODULE.then;
        LibraryUtils.FULL_LOADED = true;
        LibraryUtils._initWasmModule(LibraryUtils.WASM_MODULE);
        resolve(LibraryUtils.WASM_MODULE);
      });
    });
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
   * Set the path to load the worker. Defaults to "/monero_web_worker.js" in the browser
   * and "./MoneroWebWorker.js" in node.
   * 
   * @param {string} workerDistPath - path to load the worker
   */
  static setWorkerDistPath(workerDistPath) {
    let path = LibraryUtils._prefixWindowsPath(workerDistPath ? workerDistPath : LibraryUtils.WORKER_DIST_PATH_DEFAULT);
    if (path !== LibraryUtils.WORKER_DIST_PATH) delete LibraryUtils.WORKER;
    LibraryUtils.WORKER_DIST_PATH = path;
  }

  /**
   * Get a singleton instance of a worker to share.
   * 
   * @return {Worker} a worker to share among wallet instances
   */
  static async getWorker() {
    
    // one time initialization
    if (!LibraryUtils.WORKER) {
      if (GenUtils.isBrowser()) LibraryUtils.WORKER = new Worker(LibraryUtils.WORKER_DIST_PATH);
      else { 
       const Worker = require("web-worker"); // import web worker if nodejs
       LibraryUtils.WORKER = new Worker(LibraryUtils.WORKER_DIST_PATH);
      }
      LibraryUtils.WORKER_OBJECTS = {};  // store per object running in the worker
      
      // receive worker errors
      LibraryUtils.WORKER.onerror = function(err) {
        console.error("Error posting message to MoneroWebWorker.js; is it copied to the app's build directory (e.g. in the root)?");
        console.log(err);
      };
      
      // receive worker messages
      LibraryUtils.WORKER.onmessage = function(e) {
        
        // lookup object id, callback function, and this arg
        let thisArg = null;
        let callbackFn = LibraryUtils.WORKER_OBJECTS[e.data[0]].callbacks[e.data[1]]; // look up by object id then by function name
        if (callbackFn === undefined) throw new Error("No worker callback function defined for key '" + e.data[1] + "'");
        if (callbackFn instanceof Array) {  // this arg may be stored with callback function
          thisArg = callbackFn[1];
          callbackFn = callbackFn[0];
        }
        
        // invoke callback function with this arg and arguments
        callbackFn.apply(thisArg, e.data.slice(2));
      }
      
      // set worker log level
      await LibraryUtils.setLogLevel(LibraryUtils.getLogLevel());
    }
    return LibraryUtils.WORKER;
  }
  
  /**
   * Terminate monero-javascript's singleton worker.
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
   * @param {objectId} identifies the worker object to invoke
   * @param {string} fnName is the name of the function to invoke
   * @param {Object[]} args are function arguments to invoke with
   * @return {any} resolves with response payload from the worker or an error
   */
  static async invokeWorker(objectId, fnName, args) {
    assert(fnName.length >= 2);
    let worker = await LibraryUtils.getWorker();
    if (!LibraryUtils.WORKER_OBJECTS[objectId]) LibraryUtils.WORKER_OBJECTS[objectId] = {callbacks: {}};
    return await new Promise(function(resolve, reject) {
      let callbackId = GenUtils.getUUID();
      LibraryUtils.WORKER_OBJECTS[objectId].callbacks[callbackId] = function(resp) {  // TODO: this defines function once per callback
        resp ? (resp.error ? reject(LibraryUtils.deserializeError(resp.error)) : resolve(resp.result)) : resolve();
        delete LibraryUtils.WORKER_OBJECTS[objectId].callbacks[callbackId];
      };
      worker.postMessage([objectId, fnName, callbackId].concat(args === undefined ? [] : GenUtils.listify(args)));
    });
  }

  static serializeError(err) {
    const serializedErr = { name: err.name, message: err.message, stack: err.stack };
    if (err instanceof MoneroError) serializedErr.type = "MoneroError";
    return serializedErr;
  }

  static deserializeError(serializedErr) {
    const err = serializedErr.type === "MoneroError" ? new MoneroError(serializedErr.message) : new Error(serializedErr.message);
    err.name = serializedErr.name;
    err.stack = serializedErr.stack;
    return err;
  }
  
  // ------------------------------ PRIVATE HELPERS ---------------------------
  
  static _initWasmModule(wasmModule) {
    wasmModule.taskQueue = new ThreadPool(1);
    wasmModule.queueTask = async function(asyncFn) { return wasmModule.taskQueue.submit(asyncFn); }
  }
  
  static _prefixWindowsPath(path) {
    if (path.indexOf("C:") == 0 && path.indexOf("file://") == -1) path = "file://" + path; // prepend C: paths with file://
    return path;
  }
}

LibraryUtils.LOG_LEVEL = 0;
LibraryUtils.WORKER_DIST_PATH_DEFAULT = GenUtils.isBrowser() ? "/monero_web_worker.js" : function() {
    const path = require("path");
    return LibraryUtils._prefixWindowsPath(path.join(__dirname, "./MoneroWebWorker.js"));
}();
LibraryUtils.WORKER_DIST_PATH = LibraryUtils.WORKER_DIST_PATH_DEFAULT;

module.exports = LibraryUtils;