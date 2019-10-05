
/**
 * Implements a Monero wallet using WebAssembly to bridge to a C++ wallet.
 */
class MoneroWalletWasm {
  
  dummyMethod() {
    return MoneroWalletWasm.WASM_MODULE.dummy_method();
  }
}

module.exports = async function() {
  return new Promise(function(resolve, reject) {
    require("../../monero_cpp_library_WASM")().ready.then(function(module) {
      MoneroWalletWasm.WASM_MODULE = module;
      resolve(MoneroWalletWasm);
    }).catch(function(e) {
      console.log("Error loading monero_cpp_library_WASM:", e);
      reject(e);
    });
  });
}