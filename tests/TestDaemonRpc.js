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
    let resp = await daemon.getHeight();
    testDaemonResponseInfo(resp, true, false);
    assert(resp.getHeight(), "Height must be initialized");
    assert(resp.getHeight() > 0, "Height must be greater than 0");
  });

  it("getBlockHeaders()", async function() {
    
    // determine start and end height based on number of blocks and how many blocks ago
    let numBlocks = 25;
    let numBlocksAgo = 100;
    let currentHeight = await daemon.getHeight();
    let startHeight = currentHeight - numBlocksAgo;
    let endHeight = currentHeight - (numBlocksAgo - numBlocks) - 1;
    
    // fetch headers
    let headers = await daemon.getBlockHeaders(startHeight, endHeight);

    // test headers
    assertEquals(numBlocks, headers.length);
    for (let i = 0; i < numBlocks; i++) {
      let header = headers.get(i);
      assert.equal(startHeight + i, header.getHeight());
      testDaemonResponseInfo(header, true, true);
      testBlockHeader(header);
    }
  });
});

function testDaemonResponseInfo(model, initializedStatus, initializedIsUntrusted) {
  throw new Error("Not implemented");
}

function testDaemonBlockHeader(header) {
  throw new Error("Not implemented");
}