// import library models
require("../../../index.js");

// import test types
require("../MoneroTestModel")();
require("../utils/TestUtilsModule")();

/**
 * Run tests when document ready.
 */
document.addEventListener("DOMContentLoaded", function() {
  runTests();
});

/**
 * Run Monero tests.
 */
function runTests() {
  
  // mocha setup
  mocha.setup({
    ui: 'bdd',
    timeout: 3000000
  });
  mocha.checkLeaks();
  
  // configure tests to use web worker to not lock main browser thread
  TestUtils.PROXY_TO_WORKER = true;
  
  // run tests
  require("../TestAll");
  mocha.run();
}