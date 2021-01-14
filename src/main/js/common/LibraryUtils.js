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
   * TODO: this is separate static function from loadKeysModule() because webpack cannot bundle web worker using runtime param for conditional import
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
   * Private helper to initialize the wasm module with data structures to synchronize access.
   */
  static _initWasmModule(wasmModule) {
    wasmModule.taskQueue = new ThreadPool(1);
    wasmModule.queueTask = async function(asyncFn) { return wasmModule.taskQueue.submit(asyncFn); }
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
   * Set the path to load monero_web_worker.js when running this library in
   * a web worker (defaults to "/monero_web_worker.js").
   * 
   * @param {string} workerDistPath - path to load monero_web_worker.js
   */
  static setWorkerDistPath(workerDistPath) {
    let path = workerDistPath ? workerDistPath : LibraryUtils.WORKER_DIST_PATH_DEFAULT;
    if (path !== LibraryUtils.WORKER_DIST_PATH) delete LibraryUtils.WORKER;
    LibraryUtils.WORKER_DIST_PATH = path; 
  }
  
  /**
   * Get a singleton instance of a web worker to share.
   * 
   * @return {Worker} a worker to share among wallet instances
   */
  static getWorker() {
    
    // one time initialization
    if (!LibraryUtils.WORKER) {
      LibraryUtils.WORKER = new Worker(LibraryUtils.WORKER_DIST_PATH);
      LibraryUtils.WORKER_OBJECTS = {};  // store per object running in the worker
      
      // receive worker errors
      LibraryUtils.WORKER.onerror = function(err) {
        console.error("Error posting message to MoneroWebWorker.js; is it copied to the web app's build directory (e.g. in the root)?");
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
    }
    return LibraryUtils.WORKER;
  }
  
  /**
   * Invoke a web worker function and get the result with error handling.
   * 
   * @param {objectId} identifies the worker object to invoke
   * @param {string} fnName is the name of the function to invoke
   * @param {Object[]} args are function arguments to invoke with
   * @return {Promise} resolves with response payload from the worker or an error
   */
  static async invokeWorker(objectId, fnName, args) {
    assert(fnName.length >= 2);
    let worker = LibraryUtils.getWorker();
    if (!LibraryUtils.WORKER_OBJECTS[objectId]) LibraryUtils.WORKER_OBJECTS[objectId] = {callbacks: {}};
    return new Promise(function(resolve, reject) {
      let callbackId = GenUtils.getUUID();
      LibraryUtils.WORKER_OBJECTS[objectId].callbacks[callbackId] = function(resp) {  // TODO: this defines function once per callback
        resp ? (resp.error ? reject(new MoneroError(resp.error)) : resolve(resp.result)) : resolve();
      };
      worker.postMessage([objectId, fnName, callbackId].concat(args === undefined ? [] : GenUtils.listify(args)));
    });
  }
}

LibraryUtils.WORKER_DIST_PATH_DEFAULT = "/monero_web_worker.js";
LibraryUtils.WORKER_DIST_PATH = LibraryUtils.WORKER_DIST_PATH_DEFAULT;

module.exports = LibraryUtils;