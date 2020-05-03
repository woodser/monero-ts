
/**
 * Collection of helper utilities for the library.
 */
class LibraryUtils {
  
  /**
   * Get a default file system.  Uses an in-memory file system if running in the browser.
   * 
   * @return nodejs-compatible file system
   */
  static getDefaultFs() {
    if (!MoneroUtils.FS) MoneroUtils.FS = GenUtils.isBrowser() ? require('memfs') : require('fs');
    return MoneroUtils.FS;
  }
  
  /**
   * Load the WebAssembly keys module with caching.
   */
  static async loadKeysModule() {
    
    // use cache if suitable, core module supersedes keys module because it is superset
    if (MoneroUtils.WASM_MODULE) return MoneroUtils.WASM_MODULE;
    
    // load module
    delete MoneroUtils.WASM_MODULE;
    MoneroUtils.WASM_MODULE = require("../../../../dist/monero_core_keys")();
    return new Promise(function(resolve, reject) {
      MoneroUtils.WASM_MODULE.then(module => {
        MoneroUtils.WASM_MODULE = module
        delete MoneroUtils.WASM_MODULE.then;
        LibraryUtils._initWasmModule(MoneroUtils.WASM_MODULE);
        resolve(MoneroUtils.WASM_MODULE);
      });
    });
  }
  
  /**
   * Load the WebAssembly core module with caching.
   * 
   * The core module is a superset of the keys module and overrides it.
   * 
   * TODO: this is separate static function from loadKeysModule() because webpack cannot bundle WebWorker using runtime param for conditional import
   */
  static async loadCoreModule() {
    
    // use cache if suitable, core module supersedes keys module because it is superset
    if (MoneroUtils.WASM_MODULE && MoneroUtils.CORE_LOADED) return MoneroUtils.WASM_MODULE;
    
    // load module
    delete MoneroUtils.WASM_MODULE;
    MoneroUtils.WASM_MODULE = require("../../../../dist/monero_core")();
    return new Promise(function(resolve, reject) {
      MoneroUtils.WASM_MODULE.then(module => {
        MoneroUtils.WASM_MODULE = module
        delete MoneroUtils.WASM_MODULE.then;
        MoneroUtils.CORE_LOADED = true;
        LibraryUtils._initWasmModule(MoneroUtils.WASM_MODULE);
        resolve(MoneroUtils.WASM_MODULE);
      });
    });
  }
  
  /**
   * Private helper to initialize the wasm module with data structures to synchronize access.
   */
  static _initWasmModule(wasmModule) {
    
    // initialize data structure to synchronize access to wasm module
    const async = require("async");
    wasmModule.taskQueue = async.queue(function(asyncFn, callback) {
      if (asyncFn.then) asyncFn.then(resp => { callback(resp); }).catch(err => { callback(undefined, err); });
      else asyncFn().then(resp => { callback(resp); }).catch(err => { callback(undefined, err); });
    }, 1);
    
    // initialize method to synchronize access to wasm module
    wasmModule.queueTask = async function(asyncFn) {
      return new Promise(function(resolve, reject) {
        wasmModule.taskQueue.push(asyncFn, function(resp, err) {
          if (err !== undefined) reject(err);
          else resolve(resp);
        });
      });
    }
  }
  
  /**
   * Register a function by id which informs if unauthorized requests (e.g.
   * self-signed certificates) should be rejected.
   * 
   * @param {string} fnId - unique identifier for the function
   * @param {function} fn - function to inform if unauthorized requests should be rejected
   */
  static setRejectUnauthorizedFn(fnId, fn) {
    if (!MoneroUtils.REJECT_UNAUTHORIZED_FNS) MoneroUtils.REJECT_UNAUTHORIZED_FNS = [];
    if (fn === undefined) delete MoneroUtils.REJECT_UNAUTHORIZED_FNS[fnId];
    else MoneroUtils.REJECT_UNAUTHORIZED_FNS[fnId] = fn;
  }
  
  /**
   * Indicate if unauthorized requests should be rejected.
   * 
   * @param {string} fnId - uniquely identifies the function
   */
  static isRejectUnauthorized(fnId) {
    if (!MoneroUtils.REJECT_UNAUTHORIZED_FNS[fnId]) throw new Error("No function registered with id " + fnId + " to inform if unauthorized reqs should be rejected");
    return MoneroUtils.REJECT_UNAUTHORIZED_FNS[fnId]();
  }
  
  /**
   * Get a singleton instance of a web worker to share.
   * 
   * @return {Worker} a worker to share among wallet instances
   */
  static getWorker() {
    
    // one time initialization
    if (!LibraryUtils.WORKER) {
      LibraryUtils.WORKER = new Worker("MoneroWebWorker.dist.js");
      MoneroUtils.WORKER_OBJECTS = {};  // store per object running in the worker
      
      // catch worker messages
      LibraryUtils.WORKER.onmessage = function(e) {
        
        // lookup object id, callback function, and this arg
        let thisArg = null;
        let callbackFn = MoneroUtils.WORKER_OBJECTS[e.data[0]].callbacks[e.data[1]]; // look up by object id then by function name
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
    if (!MoneroUtils.WORKER_OBJECTS[objectId]) MoneroUtils.WORKER_OBJECTS[objectId] = {callbacks: {}};
    return new Promise(function(resolve, reject) {
      MoneroUtils.WORKER_OBJECTS[objectId].callbacks["on" + fnName.charAt(0).toUpperCase() + fnName.substring(1)] = function(resp) {  // TODO: this defines function once per callback
        resp ? (resp.error ? reject(new MoneroError(resp.error)) : resolve(resp.result)) : resolve();
      };
      worker.postMessage([objectId, fnName].concat(args === undefined ? [] : GenUtils.listify(args)));
    });
  }
}

module.exports = LibraryUtils;