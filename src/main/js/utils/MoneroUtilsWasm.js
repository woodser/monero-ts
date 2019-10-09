
/**
 * Collection of Monero utilies implemented in C++ and accessed through WebAssembly.
 */
class MoneroUtilsWasm {

  static dummyMethod() {
    MoneroUtilsWasm.WASM_MODULE.utils_dummy_method();
  }
}

module.exports = async function() {
  return new Promise(function(resolve, reject) {
    require("../../../monero_cpp_library_WASM")().ready.then(function(module) {
      MoneroUtilsWasm.WASM_MODULE = module;
      resolve(MoneroUtilsWasm);
    }).catch(function(e) {
      console.log("Error loading monero_cpp_library_WASM:", e);
      reject(e);
    });
  });
}