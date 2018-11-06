const assert = require("assert");
const MoneroDaemonRpc = require("../src/daemon/MoneroDaemonRpc");

/**
 * Tests the daemon RPC client.
 */
describe("Daemon RPC Tests", function() {
  
  let daemon; // daemon to test

  before(function() {
    daemon = new MoneroDaemonRpc({ port: 38081, user: "superuser", pass: "abctesting123", protocol: "http" });
  })

  beforeEach(function() {
    console.log("Before each test");
  });
  
  it("getHeight()", async function() {
    let height = await daemon.getHeight();
    assert(height, "Height must be initialized");
    assert(height > 0, "Height must be greater than 0");
  });

  it("getBlockHeaders()", async function() {
    throw new Error("Not implemented");
  });
});