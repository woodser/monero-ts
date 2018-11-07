const assert = require("assert");
const MoneroDaemonRpc = require("../src/daemon/MoneroDaemonRpc");
const TestUtils = require("./TestUtils");

// daemon to test
let daemon = TestUtils.getDaemonRpc();

describe("Test Daemon RPC", function() {
  
  it("getHeight()", async function() {
    let resp = await daemon.getHeight();
    testDaemonResponseInfo(resp, true, false);
    assert(resp.getHeight(), "Height must be initialized");
    assert(resp.getHeight() > 0, "Height must be greater than 0");
  });
  
  it("getBlockHash()", async function() {
    let lastHeader = await daemon.getLastBlockHeader();
    let hash = await daemon.getBlockHash(lastHeader.getHeight());
    assert(hash);
    assert.equal(64, hash.length);
  });
  
  it ("getLastBlockHeader()", async function() {
    let lastHeader = await daemon.getLastBlockHeader();
    testDaemonResponseInfo(lastHeader, true, true);
    testBlockHeader(lastHeader);
  });
  
  // TODO: test lower and upper bounds
  it("getBlockHeadersByRange()", async function() {
    
    // determine start and end height based on number of blocks and how many blocks ago
    let numBlocks = 100;
    let numBlocksAgo = 100;
    let currentHeight = (await daemon.getHeight()).getHeight();
    let startHeight = currentHeight - numBlocksAgo;
    let endHeight = currentHeight - (numBlocksAgo - numBlocks) - 1;
    
    // fetch headers
    let headers = await daemon.getBlockHeadersByRange(startHeight, endHeight);

    // test headers
    assert.equal(numBlocks, headers.length);
    for (let i = 0; i < numBlocks; i++) {
      let header = headers[i];
      assert.equal(startHeight + i, header.getHeight());
      testDaemonResponseInfo(header, true, true);
      testBlockHeader(header);
    }
  });
  
  it("getBlockByHash()", async function() {
    
    // retrieve by hash of last block
    let lastHeader = await daemon.getLastBlockHeader();
    let hash = await daemon.getBlockHash(lastHeader.getHeight());
    let block = await daemon.getBlockByHash(hash);
    testDaemonResponseInfo(block, true, true);
    testBlock(block);
    assert.deepEqual(await daemon.getBlockByHeight(block.getHeader().getHeight()), block);
    
    // retrieve by hash of previous to last block
    hash = await daemon.getBlockHash(lastHeader.getHeight() - 1);
    block = await daemon.getBlockByHash(hash);
    testDaemonResponseInfo(block, true, true);
    testBlock(block);
    assert.deepEqual(await daemon.getBlockByHeight(lastHeader.getHeight() - 1), block);
  });
  
  it("getBlockByHeight()", async function() {
    
    // retrieve by height of last block
    let lastHeader = await daemon.getLastBlockHeader();
    let block = await daemon.getBlockByHeight(lastHeader.getHeight());
    testDaemonResponseInfo(block, true, true);
    testBlock(block);
    assert.deepEqual(await daemon.getBlockByHeight(block.getHeader().getHeight()), block);
    
    // retrieve by height of previous to last block
    block = await daemon.getBlockByHeight(lastHeader.getHeight() - 1);
    testDaemonResponseInfo(block, true, true);
    testBlock(block);
    assert.deepEqual(lastHeader.getHeight() - 1, block.getHeader().getHeight());
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
  assert(header);
  assert(header.getBlockSize());
  assert(header.getDepth() >= 0);
  assert(header.getDifficulty());
  assert(header.getCumulativeDifficulty());
  assert(header.getHash());
  assert(header.getHeight());
  assert(header.getMajorVersion());
  assert(header.getMinorVersion());
  assert(header.getNonce());
  assert(header.getNumTxs() >= 0);
  assert(typeof header.getOrphanStatus() === "boolean");
  assert(header.getPrevHash());
  assert(header.getReward());
  assert(header.getTimestamp());
  assert(header.getBlockWeight());
  assert(header.getPowHash() === undefined);
}

function testBlock(block) {
  assert(block);
  assert(block.getBlob());
  assert(block.getBlob().length > 1);
  assert(Array.isArray(block.getTxHashes()));
  assert(block.getTxHashes().length >= 0);
  testBlockHeader(block.getHeader());
  testMinerTx(block.getMinerTx());
}

function testMinerTx(minerTx) {
  assert(minerTx);
  assert(minerTx.getVersion() >= 0)
  assert(Array.isArray(minerTx.getExtra()));
  assert(minerTx.getExtra().length > 0);
  assert(minerTx.getUnlockTime() >= 0);
}