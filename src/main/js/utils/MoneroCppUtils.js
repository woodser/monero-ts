/**
 * Collection of utilities from monero-cpp-library accessed using WebAssembly.
 */
class MoneroCppUtils {

  static dummyMethod(str) {
    MoneroCppUtils.WASM_MODULE.utils_dummy_method(str);
  }
  
  /**
   * Converts the given JSON to a binary Uint8Array using Monero's portable storage format.
   * 
   * @param json is the json to convert to binary
   * @returns Uint8Array is the json converted to portable storage binary
   */
  static jsonToBinary(json) {
    
    // serialize json to binary which is stored in c++ heap
    let binMemInfoStr = MoneroCppUtils.WASM_MODULE.malloc_binary_from_json(JSON.stringify(json));
    
    // sanitize binary memory address info
    let binMemInfo = JSON.parse(binMemInfoStr);
    binMemInfo.ptr = parseInt(binMemInfo.ptr);
    binMemInfo.length = parseInt(binMemInfo.length);
    
    // read binary data from heap to Uint8Array
    let view = new Uint8Array(binMemInfo.length);
    for (let i = 0; i < binMemInfo.length; i++) {
      view[i] = MoneroCppUtils.WASM_MODULE.HEAPU8[binMemInfo.ptr / Uint8Array.BYTES_PER_ELEMENT + i];
    }
    
    // free binary on heap
    MoneroCppUtils.WASM_MODULE._free(binMemInfo.ptr);
    
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
    
    // allocate space in c++ heap for binary
    let ptr = MoneroCppUtils.WASM_MODULE._malloc(uint8arr.length * uint8arr.BYTES_PER_ELEMENT);
    let heap = new Uint8Array(MoneroCppUtils.WASM_MODULE.HEAPU8.buffer, ptr, uint8arr.length * uint8arr.BYTES_PER_ELEMENT);
    
    // write binary to heap
    heap.set(new Uint8Array(uint8arr.buffer));
    
    // create object with binary memory address info
    let binMemInfo = { ptr: ptr, length: uint8arr.length  }

    // convert binary to json str
    const ret_string = MoneroCppUtils.WASM_MODULE.binary_to_json(JSON.stringify(binMemInfo));
    
    // free binary on heap
    MoneroCppUtils.WASM_MODULE._free(heap.byteOffset);
    MoneroCppUtils.WASM_MODULE._free(ptr);
    
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
    
    //let startTime = +new Date();
    
    // allocate space in c++ heap for binary
    let ptr = MoneroCppUtils.WASM_MODULE._malloc(uint8arr.length * uint8arr.BYTES_PER_ELEMENT);  // TODO: this needs deleted
    let heap = new Uint8Array(MoneroCppUtils.WASM_MODULE.HEAPU8.buffer, ptr, uint8arr.length * uint8arr.BYTES_PER_ELEMENT);
    
    // write binary to heap
    heap.set(new Uint8Array(uint8arr.buffer));
    
    // create object with binary memory address info
    let binMemInfo = { ptr: ptr, length: uint8arr.length  }

    // convert binary to json str
    const json_str = MoneroCppUtils.WASM_MODULE.binary_blocks_to_json(JSON.stringify(binMemInfo));
    
    // free memory
    MoneroCppUtils.WASM_MODULE._free(heap.byteOffset);
    MoneroCppUtils.WASM_MODULE._free(ptr);
    
    // parse result to json
    let json = JSON.parse(json_str);                                          // parsing json gives arrays of block and tx strings
    json.blocks = json.blocks.map(blockStr => JSON.parse(blockStr));          // replace block strings with parsed blocks
    json.txs = json.txs.map(txs => txs ? txs.map(tx => JSON.parse(tx.replace(",", "{") + "}")) : []); // modify tx string to proper json and parse // TODO: more efficient way than this json manipulation?
    return json;
  }
}

/**
 * Exports a promise which resolves with a utility class which uses a
 * WebAssembly module in order to access utilities from monero-cpp-library.
 * 
 * @returns {Promise} resolves with an initialized MoneroCoreUtils class
 */
module.exports = async function() {
  return new Promise(function(resolve, reject) {
    require("../../../monero_cpp_library_WASM")().ready.then(function(module) {
      MoneroCppUtils.WASM_MODULE = module;
      resolve(MoneroCppUtils);
    }).catch(function(e) {
      console.log("Error loading monero_cpp_library_WASM:", e);
      reject(e);
    });
  });
}