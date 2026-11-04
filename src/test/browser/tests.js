/**
 * Run tests when document ready.
 */
document.addEventListener("DOMContentLoaded", function() {
  try {
    runTests();
  } catch (err) {
    console.error(err);
    if (window.mochaDone) window.mochaDone("1"); // a headless runner exits with a failure
  }
});

/**
 * Run Monero tests.
 */
function runTests() {
  
  // mocha setup, reporting to the console instead of the page when run headless
  let query = new URLSearchParams(location.search);
  mocha.setup({
    ui: 'bdd',
    timeout: Number(query.get("timeout")) || 3000000,
    reporter: query.get("reporter") || 'html'
  });
  mocha.globals(['HttpClient', 'LibraryUtils', 'GenUtils', 'request']);
  mocha.checkLeaks();
  
  // override default to run daemon and wallets on main thread
  //TestUtils.PROXY_TO_WORKER = false;
  
  // run tests, reporting the failure count to a headless runner
  require("../TestAll");
  mocha.run(failures => { if (window.mochaDone) window.mochaDone(String(failures)); });
}
