const assert = require("assert");
const MoneroDaemonRpc = require("../src/daemon/MoneroDaemonRpc");
const TestUtils = require("./TestUtils");
const GenUtils = require("../src/utils/GenUtils");

// daemon to test
let daemon = TestUtils.getDaemonRpc();

describe("Test Daemon RPC", function() {
  
  it("getHeight()", async function() {
    let height = await daemon.getHeight();
    assert(height, "Height must be initialized");
    assert(height > 0, "Height must be greater than 0");
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
  
  // TODO: test start with no end, vice versa, inclusivity
  it("getBlockHeadersByRange()", async function() {
    
    // determine start and end height based on number of blocks and how many blocks ago
    let numBlocks = 100;
    let numBlocksAgo = 100;
    let currentHeight = await daemon.getHeight();
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
  
//  it("getBlocksByHeight()", async function() {
//    
//    // set number of blocks to test
//    const numBlocks = 190;
//    
//    // select random heights
//    let currentHeight = await daemon.getHeight();
//    let allHeights = [];
//    for (let i = 0; i < currentHeight - 1; i++) allHeights.push(i);
//    GenUtils.shuffle(allHeights);
//    let heights = [];
//    for (let i = 0; i < numBlocks; i++) heights.push(allHeights[i]);
//    
//    // fetch blocks
//    let blocks = await daemon.getBlocksByHeight(heights);
//    assert.equal(numBlocks, blocks.length);
//    for (let i = 0; i < heights.length; i++) {
//      let block = blocks[i];
//      testDaemonResponseInfo(block, true, true);
//      testBlock(block, true);
//      assert.equal(heights[i], block.getHeader().getHeight());      
//    }
//  });
//  
//  it("getBlocksByRange()", async function() {
//    
//    // get current height
//    let height = await daemon.getHeight();
//    
//    // get valid height range
//    let numBlocks = 1; // TODO: RequestError: Error: read ECONNRESET or  RequestError: Error: socket hang up if > 64 or (or > 1 if test getBlocksByHeight() runs first)
//    let numBlocksAgo = 190;
//    assert(numBlocks > 0);
//    assert(numBlocksAgo >= numBlocks);
//    assert(height - numBlocksAgo + numBlocks - 1 < height);
//    let startHeight = height - numBlocksAgo;
//    let endHeight = height - numBlocksAgo + numBlocks - 1;
//    
//    // test known start and end heights
//    //console.log("Height: " + height);
//    //console.log("Fecthing " + (endHeight - startHeight + 1) + " blocks [" + startHeight + ", " + endHeight + "]");
//    await testRange(startHeight, endHeight);
//    
//    // test unspecified start
//    await testRange(null, numBlocks - 1);
//    
//    // test unspecified end
//    await testRange(height - numBlocks - 1, null);
//    
//    // test unspecified start and end 
//    //await testRange(null, null);  // TODO: RequestError: Error: socket hang up
//    
//    async function testRange(startHeight, endHeight) {
//      let realStartHeight = startHeight === null ? 0 : startHeight;
//      let realEndHeight = endHeight === null ? height - 1 : endHeight;
//      let blocks = await daemon.getBlocksByRange(startHeight, endHeight);
//      assert.equal(realEndHeight - realStartHeight + 1, blocks.length);
//      for (let i = 0; i < blocks.length; i++) {
//        assert.equal(realStartHeight + i, blocks[i].getHeader().getHeight());
//      }
//    }
//  });
  
  it("getTxs()", async function() {
    
    // get valid height range
    let height = await daemon.getHeight();
    let numBlocks = 50;
    let numBlocksAgo = 190;
    assert(numBlocks > 0);
    assert(numBlocksAgo >= numBlocks);
    assert(height - numBlocksAgo + numBlocks - 1 < height);
    let startHeight = height - numBlocksAgo;
    let endHeight = height - numBlocksAgo + numBlocks - 1;
    
    // get blocks
    let blocks = await daemon.getBlocksByRange(startHeight, endHeight);
    
    // collect tx hashes
    let txHashes = blocks.map(block => block.getTxHashes()).reduce((a, b) => { a.push.apply(a, b); return a; });
    
    // fetch txs by hash
    let txs = await daemon.getTxs(txHashes, true, false);
    for (let tx of txs) {
      testDaemonResponseInfo(tx, true, true); // TODO: duplicating response info is going to be too expensive so must be common reference
      testMoneroTx(tx); 
    }
    
    // TODO: test binary vs json encoding
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

function testMoneroTx(tx) {
  throw new Error("Not implemented");
}