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
    let currentHeight = (await daemon.getHeight()).getHeight();
    let startHeight = currentHeight - numBlocksAgo;
    let endHeight = currentHeight - (numBlocksAgo - numBlocks) - 1;
    
    console.log(startHeight);
    console.log(endHeight);
    
    // fetch headers
    let headers = await daemon.getBlockHeaders(startHeight, endHeight);

    // test headers
    assert.equal(numBlocks, headers.length);
    for (let i = 0; i < numBlocks; i++) {
      let header = headers[i];
      assert.equal(startHeight + i, header.getHeight());
      testDaemonResponseInfo(header, true, true);
      testBlockHeader(header);
    }
  });
});

function testDaemonResponseInfo(model, initializedStatus, initializedIsUntrusted) {
  assert(model.getResponseInfo());
  if (initializedStatus) assert.equal("OK", model.getResponseInfo().getStatus());
  else assert(model.getResponseInfo().getStatus() === undefined);
  if (initializedIsUntrusted) assert(model.getResponseInfo());
  else assert(model.getResponseInfo().getIsTrusted() === undefined);
}

function testBlockHeader(header) {
  // TODO: just want to make sure these are initialized
  assert(header);
  assert(header.getBlockSize());
  assert(header.getDepth());
  assert(header.getDepth());
  assert(header.getDifficulty());
  assert(header.getHash());
  assert(header.getHeight());
  assert(header.getMajorVersion());
  assert(header.getMinorVersion());
  assert(header.getNonce());
  assert(header.getNumTxs());
  assert(header.getOrphanStatus());
  assert(header.getPrevHash());
  assert(header.getReward());
  assert(header.getTimestamp());
}