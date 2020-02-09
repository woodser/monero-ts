const PromiseThrottle = require("promise-throttle");
const Request = require("request-promise");

/**
 * Collection of Monero utilities.
 */
class MoneroUtils {
  
  // TODO: beef this up
  static validateMnemonic(mnemonic) {
    assert(mnemonic, "Mnemonic phrase is not initialized");
    let words = mnemonic.split(" ");
    if (words.length !== MoneroUtils.NUM_MNEMONIC_WORDS) throw new Error("Mnemonic phrase is " + words.length + " words but must be " + MoneroUtils.NUM_MNEMONIC_WORDS);
  }
  
  // TODO: beef this up
  static validatePrivateViewKey(privateViewKey) {
    assert(typeof privateViewKey === "string");
    assert(privateViewKey.length === 64);
  }
  
  // TODO: beef this up
  static validatePrivateSpendKey(privateSpendKey) {
    assert(typeof privateSpendKey === "string");
    assert(privateSpendKey.length === 64);
  }
  
  // TODO: beef this up
  static validatePublicViewKey(publicViewKey) {
    assert(typeof publicViewKey === "string");
    assert(publicViewKey.length === 64);
  }
  
  // TODO: beef this up
  static validatePublicSpendKey(publicSpendKey) {
    assert(typeof publicSpendKey === "string");
    assert(publicSpendKey.length === 64);
  }
  
  // TODO: beef this up, will require knowing network type
  static isValidAddress(address) {
    try {
      MoneroUtils.validateAddress(address);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  static validateAddress(address) {
    assert(typeof address === "string", "Address is not string");
    assert(address.length > 0, "Address is empty");
    assert(GenUtils.isBase58(address), "Address is not base 58");
  }
  
  static isValidPaymentId(paymentId) {
    try {
      MoneroUtils.validatePaymentId(paymentId);
      return true;
    } catch (e) {
      return false;
    }
  }
  
  // TODO: beef this up
  static validatePaymentId(paymentId) {
    assert.equal(typeof paymentId, "string");
    assert(paymentId.length === 16 || paymentId.length === 64);
  }
    
  /**
   * Decodes tx extra according to https://cryptonote.org/cns/cns005.txt and
   * returns the last tx pub key.
   * 
   * TODO: use c++ bridge for this
   * 
   * @param txExtra is an array of tx extra bytes
   * @return the last pub key as a hexidecimal string
   */
  static getLastTxPubKey(txExtra) {
    let lastPubKeyIdx;
    for (let i = 0; i < txExtra.length; i++) {
      let tag = txExtra[i];
      if (tag === 0 || tag === 2) {
        i += 1 + txExtra[i + 1];  // advance to next tag
      } else if (tag === 1) {
        lastPubKeyIdx = i + 1;
        i += 1 + 32;              // advance to next tag
      } else throw new Error("Invalid sub-field tag: " + tag);
    }
    return Buffer.from(new Uint8Array(txExtra.slice(lastPubKeyIdx, lastPubKeyIdx + 32))).toString("hex");
  }
  
  /**
   * Determines if two payment ids are functionally equal.
   * 
   * For example, 03284e41c342f032 and 03284e41c342f032000000000000000000000000000000000000000000000000 are considered equal.
   * 
   * @param paymentId1 is a payment id to compare
   * @param paymentId2 is a payment id to compare
   * @return true if the payment ids are equal, false otherwise
   */
  static paymentIdsEqual(paymentId1, paymentId2) {
    let maxLength = Math.max(paymentId1.length, paymentId2.length);
    for (let i = 0; i < maxLength; i++) {
      if (i < paymentId1.length && i < paymentId2.length && paymentId1[i] !== paymentId2[i]) return false;
      if (i >= paymentId1.length && paymentId2[i] !== '0') return false;
      if (i >= paymentId2.length && paymentId1[i] !== '0') return false;
    }
    return true;
  }
  
  /**
   * Merges a transaction into a list of existing transactions.
   * 
   * @param txs are existing transactions to merge into
   * @param tx is the transaction to merge into the list
   */
  static mergeTx(txs, tx) {
    for (let aTx of txs) {
      if (aTx.getHash() === tx.getHash()) {
        aTx.merge(tx);
        return;
      }
    }
    txs.push(tx);
  }
  
  /**
   * Converts the given JSON to a binary Uint8Array using Monero's portable storage format.
   * 
   * @param json is the json to convert to binary
   * @returns Uint8Array is the json converted to portable storage binary
   */
  static jsonToBinary(json) {
    
    // wasm module must be pre-loaded
    if (MoneroUtils.WASM_MODULE === undefined) throw MoneroError("WASM module is not loaded; call 'await MoneroUtils.loadWasmModule()' to load");
    
    // serialize json to binary which is stored in c++ heap
    let binMemInfoStr = MoneroUtils.WASM_MODULE.malloc_binary_from_json(JSON.stringify(json));
    
    // sanitize binary memory address info
    let binMemInfo = JSON.parse(binMemInfoStr);
    binMemInfo.ptr = parseInt(binMemInfo.ptr);
    binMemInfo.length = parseInt(binMemInfo.length);
    
    // read binary data from heap to Uint8Array
    let view = new Uint8Array(binMemInfo.length);
    for (let i = 0; i < binMemInfo.length; i++) {
      view[i] = MoneroUtils.WASM_MODULE.HEAPU8[binMemInfo.ptr / Uint8Array.BYTES_PER_ELEMENT + i];
    }
    
    // free binary on heap
    MoneroUtils.WASM_MODULE._free(binMemInfo.ptr);
    
    // return json from binary data
    return view;
  }
  
  /**
   * Converts the given portable storage binary to JSON.
   * 
   * @param uint8arr is a Uint8Array with binary data in Monero's portable storage format
   * @returns a JSON object converted from the binary data
   */
  static binaryToJson(uint8arr) {
    
    // wasm module must be pre-loaded
    if (MoneroUtils.WASM_MODULE === undefined) throw MoneroError("WASM module is not loaded; call 'await MoneroUtils.loadWasmModule()' to load");
    
    // allocate space in c++ heap for binary
    let ptr = MoneroUtils.WASM_MODULE._malloc(uint8arr.length * uint8arr.BYTES_PER_ELEMENT);
    let heap = new Uint8Array(MoneroUtils.WASM_MODULE.HEAPU8.buffer, ptr, uint8arr.length * uint8arr.BYTES_PER_ELEMENT);
    
    // write binary to heap
    heap.set(new Uint8Array(uint8arr.buffer));
    
    // create object with binary memory address info
    let binMemInfo = { ptr: ptr, length: uint8arr.length  }

    // convert binary to json str
    const ret_string = MoneroUtils.WASM_MODULE.binary_to_json(JSON.stringify(binMemInfo));
    
    // free binary on heap
    MoneroUtils.WASM_MODULE._free(heap.byteOffset);
    MoneroUtils.WASM_MODULE._free(ptr);
    
    // parse and return json
    return JSON.parse(ret_string);
  }
  
  /**
   * Converts the binary response from daemon RPC block retrieval to JSON.
   * 
   * @param uint8arr is the binary response from daemon RPC when getting blocks
   * @returns a JSON object with the blocks data
   */
  static binaryBlocksToJson(uint8arr) {
    
    // wasm module must be pre-loaded
    if (MoneroUtils.WASM_MODULE === undefined) throw MoneroError("WASM module is not loaded; call 'await MoneroUtils.loadWasmModule()' to load");
    
    // allocate space in c++ heap for binary
    let ptr = MoneroUtils.WASM_MODULE._malloc(uint8arr.length * uint8arr.BYTES_PER_ELEMENT);  // TODO: this needs deleted
    let heap = new Uint8Array(MoneroUtils.WASM_MODULE.HEAPU8.buffer, ptr, uint8arr.length * uint8arr.BYTES_PER_ELEMENT);
    
    // write binary to heap
    heap.set(new Uint8Array(uint8arr.buffer));
    
    // create object with binary memory address info
    let binMemInfo = { ptr: ptr, length: uint8arr.length  }

    // convert binary to json str
    const json_str = MoneroUtils.WASM_MODULE.binary_blocks_to_json(JSON.stringify(binMemInfo));
    
    // free memory
    MoneroUtils.WASM_MODULE._free(heap.byteOffset);
    MoneroUtils.WASM_MODULE._free(ptr);
    
    // parse result to json
    let json = JSON.parse(json_str);                                          // parsing json gives arrays of block and tx strings
    json.blocks = json.blocks.map(blockStr => JSON.parse(blockStr));          // replace block strings with parsed blocks
    json.txs = json.txs.map(txs => txs ? txs.map(tx => JSON.parse(tx.replace(",", "{") + "}")) : []); // modify tx string to proper json and parse // TODO: more efficient way than this json manipulation?
    return json;
  }
  
  // ---------------------------- LIBRARY UTILS -------------------------------
  
  /**
   * Get a singleton instance of an HTTP client to share.
   * 
   * @return {http.Agent} a shared agent for network requests among library instances
   */
  static getHttpAgent() {
    if (!MoneroUtils.HTTP_AGENT) {
      let http = require('http');
      MoneroUtils.HTTP_AGENT = new http.Agent({keepAlive: true});
    }
    return MoneroUtils.HTTP_AGENT;
  }
  
  /**
   * Get a singleton instance of an HTTPS client to share.
   * 
   * @return {https.Agent} a shared agent for network requests among library instances
   */
  static getHttpsAgent() {
    if (!MoneroUtils.HTTPS_AGENT) {
      let https = require('https');
      MoneroUtils.HTTPS_AGENT = new https.Agent({keepAlive: true});
    }
    return MoneroUtils.HTTPS_AGENT;
  }

  /**
   * Executes network requests serially and with rate limiting.
   * 
   * @param {object} opts is the config for the Request interface
   * 
   * TODO: only requests per endpoint need to be executed serially and with rate limiting, this is global
   */
  static async throttledRequest(opts) {
    
    // initialize promise throttle one time
    if (!MoneroUtils.PROMISE_THROTTLE) {
      MoneroUtils.PROMISE_THROTTLE = new PromiseThrottle({
        requestsPerSecond: MoneroUtils.MAX_REQUESTS_PER_SECOND,
        promiseImplementation: Promise
      });
    }
    
    // queue and throttle requests to execute in serial and rate limited
    return MoneroUtils.queueTask(async function() {
      return MoneroUtils.PROMISE_THROTTLE.add(function(opts) { return Request(opts); }.bind(this, opts));
    });
  }
  
  /**
   * Executes given tasks serially (first in, first out).
   * 
   * @param {function} asyncFn is an asynchronous function to execute after previously given tasks
   */
  static async queueTask(asyncFn) {
    
    // initialize task queue one time
    if (!MoneroUtils.TASK_QUEUE) {
      const async = require("async");
      MoneroUtils.TASK_QUEUE = async.queue(function(asyncFn, callback) {
        if (asyncFn.then) throw new Error("Can only queue asynchronous functions");
        asyncFn().then(resp => { callback(resp); }).catch(err => { callback(undefined, err); });
      }, 1);
    }
    
    // return promise which resolves when task is executed
    return new Promise(function(resolve, reject) {
      MoneroUtils.TASK_QUEUE.push(asyncFn, function(resp, err) {
        //error !== undefined ? reject(err) : resolve(resp);  // TODO: one line
        if (err !== undefined) reject(err);
        else resolve(resp);
      });
    });
  }
  
  /**
   * Load the WebAssembly module one time.
   */
  static async loadWasmModule() {
    if (!MoneroUtils.WASM_MODULE) {
      MoneroUtils.WASM_MODULE = await require("../../../../build/monero-javascript-wasm")().ready;
      
      // initialize data structure to synchronize access to wasm module
      const async = require("async");
      MoneroUtils.WASM_MODULE.taskQueue = async.queue(function(asyncFn, callback) {
        if (asyncFn.then) throw new Error("Can only queue asynchronous functions");
        asyncFn().then(resp => { callback(resp); }).catch(err => { callback(undefined, err); });
      }, 1);
      
      // initialize method to synchronize access to wasm module
      MoneroUtils.WASM_MODULE.queueTask = async function(asyncFn) {
        return new Promise(function(resolve, reject) {
          MoneroUtils.WASM_MODULE.taskQueue.push(asyncFn, function(resp, err) {
            if (err !== undefined) reject(err);
            else resolve(resp);
          });
        });
      }
    }
    return MoneroUtils.WASM_MODULE;
  }
  
  /**
   * Get a singleton instance of a web worker to share.
   * 
   * @return {Worker} a worker to share among wallet instances
   */
  static getWorker() {
    
    // one time initialization
    if (!MoneroUtils.WORKER) {
      MoneroUtils.WORKER = new Worker("MoneroWebWorker.js");
      MoneroUtils.WORKER_OBJECTS = {};  // store per object running in the worker
      
      // catch worker messages
      MoneroUtils.WORKER.onmessage = function(e) {
        
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
    return MoneroUtils.WORKER;
  }
  
  /**
   * Invoke a web worker function and get the result with error handling.
   * 
   * @param {objectId} identifies the worker object to invoke
   * @param {string} fnName is the name of the function to invoke
   * @param {[]} args are function arguments to invoke with
   * @return {Promise} resolves with response payload from the worker or an error
   */
  static async invokeWorker(objectId, fnName, args) {
    assert(fnName.length >= 2);
    let worker = MoneroUtils.getWorker();
    if (!MoneroUtils.WORKER_OBJECTS[objectId]) MoneroUtils.WORKER_OBJECTS[objectId] = {callbacks: {}};
    return new Promise(function(resolve, reject) {
      MoneroUtils.WORKER_OBJECTS[objectId].callbacks["on" + fnName.charAt(0).toUpperCase() + fnName.substring(1)] = function(resp) {
        resp ? (resp.error ? reject(new MoneroError(resp.error)) : resolve(resp.result)) : resolve();
      };
      worker.postMessage([objectId, fnName].concat(args === undefined ? [] : GenUtils.listify(args)));
    });
  }
}

MoneroUtils.NUM_MNEMONIC_WORDS = 25;
MoneroUtils.WALLET_REFRESH_RATE = 10000;  // 10 seconds
MoneroUtils.RING_SIZE = 12;
MoneroUtils.MAX_REQUESTS_PER_SECOND = 50;

module.exports = MoneroUtils;