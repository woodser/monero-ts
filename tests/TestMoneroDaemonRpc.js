const assert = require("assert");
const MoneroUtils = require("../src/utils/MoneroUtils");
const TestUtils = require("./TestUtils");
const MoneroDaemonRpc = require("../src/daemon/MoneroDaemonRpc");
const MoneroBan = require("../src/daemon/model/MoneroBan");
const MoneroTx = require("../src/daemon/model/MoneroTx");
const GenUtils = require("../src/utils/GenUtils");
const MoneroWalletLocal = require("../src/wallet/MoneroWalletLocal");
const BigInteger = require("../src/submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;

/**
 * Tests a Monero daemon.
 */
class TestMoneroDaemonRpc {
  
  constructor(daemon) {
    this.daemon = daemon;
  }
  
  runTests(config) {
    let daemon = TestUtils.getDaemonRpc();
    
    describe("TEST MONERO DAEMON RPC", function() {

      it("Can get the blockchain height", async function() {
        let height = await daemon.getHeight();
        assert(height, "Height must be initialized");
        assert(height > 0, "Height must be greater than 0");
      });

      it("Can get a block id by height", async function() {
        let lastHeader = await daemon.getLastBlockHeader();
        let id = await daemon.getBlockId(lastHeader.getHeight());
        assert(id);
        assert.equal(id.length, 64);
      });
      
      it("Can get a block template", async function() {
        let template = await daemon.getBlockTemplate(TestUtils.TEST_ADDRESS, 2);
        testDaemonResponseInfo(template, true, true);
        testBlockTemplate(template);
      });

      it("Can get the last block's header", async function() {
        let lastHeader = await daemon.getLastBlockHeader();
        testDaemonResponseInfo(lastHeader, true, true);
        testBlockHeader(lastHeader, true);
      });
      
      it("Can get a block header by id", async function() {
        
        // retrieve by id of last block
        let lastHeader = await daemon.getLastBlockHeader();
        let id = await daemon.getBlockId(lastHeader.getHeight());
        let header = await daemon.getBlockHeaderById(id);
        testDaemonResponseInfo(header, true, true);
        testBlockHeader(header, true);
        assert.deepEqual(header, lastHeader);
        
        // retrieve by id of previous to last block
        id = await daemon.getBlockId(lastHeader.getHeight() - 1);
        header = await daemon.getBlockHeaderById(id);
        testDaemonResponseInfo(header, true, true);
        testBlockHeader(header, true);
        assert.equal(header.getHeight(), lastHeader.getHeight() - 1);
      });
      
      it("Can get a block header by height", async function() {
        
        // retrieve by height of last block
        let lastHeader = await daemon.getLastBlockHeader();
        let header = await daemon.getBlockHeaderByHeight(lastHeader.getHeight());
        testDaemonResponseInfo(header, true, true);
        testBlockHeader(header, true);
        assert.deepEqual(header, lastHeader);
        
        // retrieve by height of previous to last block
        header = await daemon.getBlockHeaderByHeight(lastHeader.getHeight() - 1);
        testDaemonResponseInfo(header, true, true);
        testBlockHeader(header, true);
        assert.equal(header.getHeight(), lastHeader.getHeight() - 1);
      });
      
      // TODO: test start with no end, vice versa, inclusivity
      it("Can get block headers by range", async function() {
        
        // determine start and end height based on number of blocks and how many blocks ago
        let numBlocks = 100;
        let numBlocksAgo = 100;
        let currentHeight = await daemon.getHeight();
        let startHeight = currentHeight - numBlocksAgo;
        let endHeight = currentHeight - (numBlocksAgo - numBlocks) - 1;
        
        // fetch headers
        let headers = await daemon.getBlockHeadersByRange(startHeight, endHeight);
        
        // test headers
        assert.equal(headers.length, numBlocks);
        for (let i = 0; i < numBlocks; i++) {
          let header = headers[i];
          assert.equal(header.getHeight(), startHeight + i);
          testDaemonResponseInfo(header, true, true);
          testBlockHeader(header, true);
        }
      });
      
      it("Can get a block by id", async function() {
        
        // config for testing blocks
        let testBlockConfig = { hasHex: true, headerIsFull: true, hasTxs: false };
        
        // retrieve by id of last block
        let lastHeader = await daemon.getLastBlockHeader();
        let id = await daemon.getBlockId(lastHeader.getHeight());
        let block = await daemon.getBlockById(id);
        testDaemonResponseInfo(block, true, true);
        testBlock(block, testBlockConfig);
        assert.deepEqual(block, await daemon.getBlockByHeight(block.getHeader().getHeight()));
        assert(block.getTxs() === undefined);
        
        // retrieve by id of previous to last block
        id = await daemon.getBlockId(lastHeader.getHeight() - 1);
        block = await daemon.getBlockById(id);
        testDaemonResponseInfo(block, true, true);
        testBlock(block, testBlockConfig);
        assert.deepEqual(block, await daemon.getBlockByHeight(lastHeader.getHeight() - 1));
        assert(block.getTxs() === undefined);
      });
      
      it("Can get a block by height", async function() {
        
        // config for testing blocks
        let testBlockConfig = { hasHex: true, headerIsFull: true, hasTxs: false };
        
        // retrieve by height of last block
        let lastHeader = await daemon.getLastBlockHeader();
        let block = await daemon.getBlockByHeight(lastHeader.getHeight());
        testDaemonResponseInfo(block, true, true);
        testBlock(block, testBlockConfig);
        assert.deepEqual(block, await daemon.getBlockByHeight(block.getHeader().getHeight()));
        
        // retrieve by height of previous to last block
        block = await daemon.getBlockByHeight(lastHeader.getHeight() - 1);
        testDaemonResponseInfo(block, true, true);
        testBlock(block, testBlockConfig);
        assert.deepEqual(block.getHeader().getHeight(), lastHeader.getHeight() - 1);
      });
      
      it("Can get blocks by height which is a binary request and includes transactions", async function() {
        
        // set number of blocks to test
        const numBlocks = 100;
        
        // select random heights  // TODO: this is horribly inefficient way of computing last 100 blocks if not shuffling
        let currentHeight = await daemon.getHeight();
        let allHeights = [];
        for (let i = 0; i < currentHeight - 1; i++) allHeights.push(i);
        //GenUtils.shuffle(allHeights);
        let heights = [];
        for (let i = allHeights.length - numBlocks; i < allHeights.length; i++) heights.push(allHeights[i]);
        
        // TODO: don't override heights
        //heights = [111, 222, 333];
        
        // fetch blocks
        let blocks = await daemon.getBlocksByHeight(heights);
        
        // config for testing blocks
        let testBlockConfig = { hasHex: false, headerIsFull: false, hasTxs: true, txConfig: { hasJson: true, isPruned: true, isFull: false, isConfirmed: true, fromPool: false } };
        
        // test blocks
        let txFound = false;
        assert.equal(blocks.length, numBlocks);
        for (let i = 0; i < heights.length; i++) {
          let block = blocks[i];
          if (block.getTxs().length) txFound = true;
          testDaemonResponseInfo(block, true, true);
          testBlock(block, testBlockConfig);
          assert.equal(block.getHeader().getHeight(), heights[i]);      
        }
        assert(txFound, "No transactions found to test");
      });
      
      it("Can get blocks by id which is a binary request and includes transactions", async function() {
        throw new Error("Not implemented");
      })
      
      it("Can get blocks by range", async function() {
        
        // get current height
        let height = await daemon.getHeight();
        
        // get valid height range
        let numBlocks = 1; // TODO: RequestError: Error: read ECONNRESET or  RequestError: Error: socket hang up if > 64 or (or > 1 if test getBlocksByHeight() runs first)
        let numBlocksAgo = 190;
        assert(numBlocks > 0);
        assert(numBlocksAgo >= numBlocks);
        assert(height - numBlocksAgo + numBlocks - 1 < height);
        let startHeight = height - numBlocksAgo;
        let endHeight = height - numBlocksAgo + numBlocks - 1;
        
        // test known start and end heights
        //console.log("Height: " + height);
        //console.log("Fecthing " + (endHeight - startHeight + 1) + " blocks [" + startHeight + ", " + endHeight + "]");
        await testRange(startHeight, endHeight);
        
        // test unspecified start
        await testRange(null, numBlocks - 1);
        
        // test unspecified end
        await testRange(height - numBlocks - 1, null);
        
        // test unspecified start and end 
        //await testRange(null, null);  // TODO: RequestError: Error: socket hang up
        
        async function testRange(startHeight, endHeight) {
          let realStartHeight = startHeight === null ? 0 : startHeight;
          let realEndHeight = endHeight === null ? height - 1 : endHeight;
          let blocks = await daemon.getBlocksByRange(startHeight, endHeight);
          assert.equal(blocks.length, realEndHeight - realStartHeight + 1);
          for (let i = 0; i < blocks.length; i++) {
            assert.equal(blocks[i].getHeader().getHeight(), realStartHeight + i);
          }
        }
      });
      
      it("Can get block ids as a binary request", async function() {
        //get_hashes.bin
        throw new Error("Not implemented");
      });
      
      it("Can get transactions", async function() {
        
        // get valid height range
        let height = await daemon.getHeight();
        let numBlocks = 100;
        let numBlocksAgo = 100;
        assert(numBlocks > 0);
        assert(numBlocksAgo >= numBlocks);
        assert(height - numBlocksAgo + numBlocks - 1 < height);
        let startHeight = height - numBlocksAgo;
        let endHeight = height - numBlocksAgo + numBlocks - 1;
        
        // get blocks
        let blocks = await daemon.getBlocksByRange(startHeight, endHeight);
        
        // collect tx ids
        let txIds = blocks.map(block => block.getTxIds()).reduce((a, b) => { a.push.apply(a, b); return a; });
        assert(txIds.length > 0, "No transactions found in the range [" + startHeight + ", " + endHeight + "]");
        
        // fetch txs by id
        let decodeAsJson = true;
        let prune = false;
        let txs = await daemon.getTxs(txIds, decodeAsJson, prune);
        for (let tx of txs) {
          testDaemonResponseInfo(tx, true, true); // TODO: duplicating response info is going to be too expensive so must be common reference
          testTx(tx, { hasJson: decodeAsJson, isPruned: prune, isFull: true, isConfirmed: true, fromPool: false });
        }
        
        // TODO: test binary vs json encoding
      });
      
      it("Can get the coinbase transaction sum", async function() {
        let sum = await daemon.getCoinbaseTxSum(0, 50000);
        testDaemonResponseInfo(sum, true, false);
        testCoinbaseTxSum(sum);
      });
      
      it("Can get a fee estimate", async function() {
        let estimate = await daemon.getFeeEstimate();
        testDaemonResponseInfo(estimate, true, true);
        TestUtils.testUnsignedBigInteger(estimate.getFeeEstimate());
      });
      
      it("Can relay a transaction", async function() {
        throw new Error("Not implemented");
      });
      
      it("Can relay multiple transactions", async function() {
        throw new Error("Not implemented");
      });
      
      it("Can get transactions and spent key images in the transaction pool", async function() {
        
        // TODO: send transaction so this test always has tx in the pool
        
        // fetch tx pool txs and spent key images
        let txPool = await daemon.getTxPoolTxsAndSpentKeyImages();
        testDaemonResponseInfo(txPool, true, true);
        
        // test txs
        assert(Array.isArray(txPool.getTxs()));
        assert(txPool.getTxs().length > 0, "Test requires an unconfirmed tx in the tx pool");
        for (let tx of txPool.getTxs()) {
          testTx(tx, { hasJson: true, isPruned: false, isFull: true, isConfirmed: false, fromPool: true });
        }
        
        // test key images
        assert(Array.isArray(txPool.getSpentKeyImages()));
        assert(txPool.getSpentKeyImages().length > 0, "Test requires spent key images in the tx pool");
        for (let image of txPool.getSpentKeyImages()) {
          assert(image.getKeyImage());
          assert.equal(image.getSpentStatus(), true);
          assert(Array.isArray(image.getSpendingTxIds()));
          assert(image.getSpendingTxIds().length > 0);  // TODO: test that spending tx id is included in tx pool tx ids 
        }
      });
      
      it("Can get ids of transactions in the transaction pool", async function() {
        // TODO: get_transaction_pool_hashes.bin
        throw new Error("Not implemented");
      });
      
      it("Can get the transaction pool backlog", async function() {
        // TODO: get_txpool_backlog
        throw new Error("Not implemented");
      });
      
      it("Can get transaction pool statistics", async function() {
        // TODO get_transaction_pool_stats
        throw new Error("Not implemented");
      });
      
      it("Can flush all transactions from the pool", async function() {
        let model = await daemon.flushTxPool();
        testDaemonResponseInfo(model, true, false);
      });
      
      it("Can flush one or more transactions from the pool by id", async function() {
        throw new Error("Not implemented"); // TODO: need to fetch pool transactions ids
      });
      
      it("Can determine if key images can be spent", async function() {
        // is_key_image_spent
        throw new Error("Not implemented");
      });
      
      it("Can get global outputs given a list of transaction ids", async function() {
        throw new Error("Not implemented");
      });
      
      it("Can get outputs given a list of output amounts and indices", async function() {
        throw new Error("Not implemented");
      });
      
      it("Can get an output histogram", async function() {
        let entries = await daemon.getOutputHistogram();
        assert(Array.isArray(entries));
        assert(entries.length > 0);
        for (let entry of entries) {
          testDaemonResponseInfo(entry, true, true);
          testOutputHistogramEntry(entry);
        }
      });
      
      it("Can get an output distribution", async function() {
        let amounts = [];
        amounts.push(new BigInteger(0));
        amounts.push(new BigInteger(1));
        amounts.push(new BigInteger(10));
        amounts.push(new BigInteger(100));
        amounts.push(new BigInteger(1000));
        amounts.push(new BigInteger(10000));
        amounts.push(new BigInteger(100000));
        amounts.push(new BigInteger(1000000));
        let entries = await daemon.getOutputDistribution(amounts);
        for (let entry of entries) {
          testDaemonResponseInfo(entry, true, false);
          testOutputDistributionEntry(entry);
        }
      });
      
      it("Has general information", async function() {
        let info = await daemon.getInfo();
        testDaemonResponseInfo(info, true, true);
        testInfo(info);
      });
      
      it("Has sync information", async function() {
        let syncInfo = await daemon.getSyncInfo();
        testDaemonResponseInfo(syncInfo, true, true);
        testSyncInfo(syncInfo);
      });
      
      it("Has hard fork information", async function() {
        let hardForkInfo = await daemon.getHardForkInfo();
        testDaemonResponseInfo(hardForkInfo, true, true);
        testHardForkInfo(hardForkInfo);
      });
      
      it("Can get alternative chains", async function() {
        throw new Error("Not implemented");
      });
      
      it("Can get alternative block ids", async function() {
        throw new Error("Not implemented");
      });
      
      it("Can limit incoming and outgoing bandwidth", async function() {
        throw new Error("Not implemented");
      });
      
      it("Can get information about incoming and outgoing connections", async function() {
        let connections = await daemon.getConnections();
        assert(connections);
        assert(connections.length > 0, "Daemon has no peer connections to test");
        for (let connection of connections) {
          testDaemonResponseInfo(connection, true, false);
          testDaemonConnection(connection);
        }
      });
      
      it("Can get a list of peers", async function() {
        throw new Error("Not implemented");
      });
      
      it("Can limit the number of outgoing peers", async function() {
        throw new Error("Not implemented");
      });
      
      it("Can limit the number of incoming peers", async function() {
        throw new Error("Not implemented");
      });
      
      it("Can ban a peer", async function() {
        
        // set ban
        let ban = new MoneroBan();
        ban.setHost("192.168.1.51");
        ban.setIsBanned(true);
        ban.setSeconds(60);
        let model = await daemon.setPeerBan(ban);
        testDaemonResponseInfo(model, true, false);
        
        // test ban
        let bans = await daemon.getPeerBans();
        let found = false;
        for (let aBan of bans) {
          testDaemonResponseInfo(aBan, true, false);
          testMoneroBan(aBan);
          if (aBan.getHost() === "192.168.1.51") found = true;
        }
        assert(found);
      });
      
      it("Can ban multiple peers", async function() {
        
        // set bans
        let ban1 = new MoneroBan();
        ban1.setHost("192.168.1.52");
        ban1.setIsBanned(true);
        ban1.setSeconds(60);
        let ban2 = new MoneroBan();
        ban2.setHost("192.168.1.53");
        ban2.setIsBanned(true);
        ban2.setSeconds(60);
        let bans = [];
        bans.push(ban1);
        bans.push(ban2);
        let model = await daemon.setPeerBans(bans);
        testDaemonResponseInfo(model, true, false);
        
        // test bans
        bans = await daemon.getPeerBans();
        let found1 = false;
        let found2 = false;
        for (let aBan of bans) {
          testDaemonResponseInfo(aBan, true, false);
          testMoneroBan(aBan);
          if (aBan.getHost() === "192.168.1.52") found1 = true;
          if (aBan.getHost() === "192.168.1.53") found2 = true;
        }
        assert(found1);
        assert(found2);
      });
      
      it("Can start and stop mining", async function() {
        
        // generate an address to mine to
        let wallet = new MoneroWalletLocal(daemon);
        let address = await wallet.getPrimaryAddress();
        
        // start mining
        let daemonModel = await daemon.startMining(address, 2, false, true);
        testDaemonResponseInfo(daemonModel, true, false);
        
        // stop mining
        daemonModel = await daemon.stopMining();
        testDaemonResponseInfo(daemonModel, true, false);
      });
      
      it("Can get mining status", async function() {
        throw new Error("Not implemented");
      });
      
      it("Can submit a mined block to the network", async function() {
        throw new Error("Not implemented");
      });
      
      it("Can be updated", async function() {
        throw new Error("Not implemented");
      });
      
      it("Can be stopped", async function() {
        throw new Error("Not implemented");
      });
      
      // test notifications
      if (config.testNotifications) {
        
        describe("Test Notifications", function() {
          
          it("Can notify listeners when a new block is added to the chain", async function() {
            try {
              
              // start mining if possible to help push the network along
              let wallet = new MoneroWalletLocal(daemon);
              let address = await wallet.getPrimaryAddress();
              try { await daemon.startMining(address, 8, false, true); }
              catch (e) { }
              
              // register a listener
              let listenerHeader;
              let listener = function(header) {
                listenerHeader = header;
                daemon.removeBlockHeaderListener(listener); // otherwise daemon will keep polling
              }
              daemon.addBlockHeaderListener(listener);
              
              // wait for next block notification
              let header = await daemon.nextBlockHeader();
              testBlockHeader(header, true);
              
              // test that listener was called with equivalent header
              assert.deepEqual(listenerHeader, header);
            } catch (e) {
              throw e;
            } finally {
              
              // stop mining
              try { await daemon.stopMining(); }
              catch (e) { }
            }
            
            // helper function to wait for next block
            function awaitNewBlock() {
              return new Promise(function(resolve, reject) {
                let onHeader = function(header) {
                  resolve(header);
                  daemon.removeBlockListener(onHeader);
                }
                daemon.addBlockListener(onHeader);
              });
            }
          });
        });
      }
    });
  }
}

function testDaemonResponseInfo(model, initializedStatus, initializedIsUntrusted) {
  assert(model.getResponseInfo());
  if (initializedStatus) assert.equal(model.getResponseInfo().getStatus(), "OK");
  else assert(model.getResponseInfo().getStatus() === undefined);
  if (initializedIsUntrusted) assert(model.getResponseInfo());
  else assert(model.getResponseInfo().getIsTrusted() === undefined);
}

function testBlockHeader(header, isFull) {
  assert(typeof isFull === "boolean");
  assert(header);
  assert(header.getHeight() >= 0);
  assert(header.getMajorVersion() >= 0);
  assert(header.getMinorVersion() >= 0);
  assert(header.getTimestamp() >= 0);
  assert(header.getPrevId());
  assert(header.getNonce());
  assert(header.getPowHash() === undefined);  // never seen defined
  assert(!isFull ? undefined === header.getSize() : header.getSize());
  assert(!isFull ? undefined === header.getDepth() : header.getDepth() >= 0);
  assert(!isFull ? undefined === header.getDifficulty() : header.getDifficulty());
  assert(!isFull ? undefined === header.getCumulativeDifficulty() : header.getCumulativeDifficulty());
  assert(!isFull ? undefined === header.getId() : header.getId());
  assert(!isFull ? undefined === header.getTxCount() : header.getTxCount() >= 0);
  assert(!isFull ? undefined === header.getOrphanStatus() : typeof header.getOrphanStatus() === "boolean");
  assert(!isFull ? undefined === header.getReward() : header.getReward());
  assert(!isFull ? undefined === header.getBlockWeight() : header.getBlockWeight());
}

function testBlock(block, config) {
  
  // check inputs
  assert(config);
  assert.equal(typeof config.hasHex, "boolean");
  assert.equal(typeof config.headerIsFull, "boolean");
  assert.equal(typeof config.hasTxs, "boolean");
  
  // test required fields
  assert(block);
  assert(Array.isArray(block.getTxIds())); // TODO: tx hashes probably part of tx
  assert(block.getTxIds().length >= 0);
  testCoinbaseTx(block.getCoinbaseTx());   // TODO: coinbase tx doesn't have as much stuff, can't call testTx?
  testBlockHeader(block.getHeader(), config.headerIsFull);
  
  if (config.hasHex) {
    assert(block.getHex());
    assert(block.getHex().length > 1);
  } else {
    assert(block.getHex() === undefined)
  }
  
  if (config.hasTxs) {
    assert(typeof config.txConfig === "object");
    assert(block.getTxs() instanceof Array);
    for (let tx of block.getTxs()) testTx(tx, config.txConfig);
  } else {
    assert(config.txConfig === undefined);
    assert(block.getTxs() === undefined);
  }
}

function testCoinbaseTx(coinbaseTx) {
  assert(coinbaseTx);
  assert(coinbaseTx instanceof MoneroTx);
  assert.equal(typeof coinbaseTx.getIsCoinbase(), "boolean");
  assert(coinbaseTx.getIsCoinbase());
  
  assert(coinbaseTx.getVersion() >= 0);
  assert(Array.isArray(coinbaseTx.getExtra()));
  assert(coinbaseTx.getExtra().length > 0);
  assert(coinbaseTx.getUnlockTime() >= 0);

  // TODO: coinbase tx does not have ids in binary requests so this will fail, need to derive using prunable data
//  testTx(coinbaseTx, {
//    hasJson: false,
//    isPruned: true,
//    isFull: false,
//    isConfirmed: true,
//    isCoinbase: true,
//    fromPool: false,
//  })
}

// TODO: how to test output indices? comes back with /get_transactions, maybe others
function testTx(tx, config) {
  
  // check inputs
  assert(tx);
  assert.equal(typeof config, "object");
  assert.equal(typeof config.hasJson, "boolean");
  assert.equal(typeof config.isPruned, "boolean");
  assert.equal(typeof config.isFull, "boolean");
  assert.equal(typeof config.isConfirmed, "boolean");
  assert.equal(typeof config.fromPool, "boolean");
  
  // standard across all txs
  assert(tx.getId().length === 64);
  assert.equal(typeof tx.getIsRelayed(), "boolean");
  assert.equal(tx.getSignatures(), undefined);  // TODO: way to test?
  assert.equal(typeof tx.getIsConfirmed(), "boolean");
  assert.equal(typeof tx.getInTxPool(), "boolean");
  assert.equal(typeof tx.getIsCoinbase(), "boolean");
  
  // test confirmed vs unconfirmed
  if (config.isConfirmed) {
    assert(tx.getHeight() >= 0);
    assert(tx.getIsConfirmed());
    assert(!tx.getInTxPool());
    assert(tx.getIsRelayed());
  } else {
    assert.equal(tx.getHeight(), undefined);
    assert(!tx.getIsConfirmed());
    assert(tx.getInTxPool());  // TODO: does not consider failed tx
    assert.equal(typeof tx.getIsRelayed(), "boolean");
  }
  
  // fields that come with decoded json
  if (config.hasJson) {
    assert(tx.getVersion() >= 0);
    assert(tx.getUnlockTime() >= 0);
    assert(tx.getVins() && Array.isArray(tx.getVins()) && tx.getVins().length >= 0);
    assert(tx.getVins()[0].key.k_image.length === 64);
    assert(tx.getVouts() && Array.isArray(tx.getVouts()) && tx.getVouts().length >= 0);
    tx.getVouts().map(vout => { if (vout.target) assert(vout.target.key.length === 64); });
    assert(Array.isArray(tx.getExtra()) && tx.getExtra().length > 0);
    assert(typeof tx.getRctSignatures().type === "number");
  } else {
    assert.equal(tx.getVersion(), undefined);
    assert.equal(tx.getUnlockTime(), undefined);
    assert.equal(tx.getVins(), undefined);
    assert.equal(tx.getVouts(), undefined);
    assert.equal(tx.getExtra(), undefined);
    assert.equal(tx.getRctSignatures(), undefined);
  }
  
  // prunable
  assert(config.isPruned ? undefined === tx.getRctSigPrunable() : typeof tx.getRctSigPrunable().nbp === "number");
  
  // full fields come with /get_transactions, get_transaction_pool
  if (config.isFull) {
    assert(tx.getHex().length > 0);
    assert.equal(tx.getIsDoubleSpend(), false);
    if (tx.getIsConfirmed()) {
      assert(tx.getBlockTimestamp() > 0);
      assert.equal(tx.getLastRelayedTime(), undefined);
      assert.equal(tx.getReceivedTime(), undefined);
    } else {
      assert.equal(tx.getBlockTimestamp(), undefined);
      if (tx.getIsRelayed()) assert(tx.getLastRelayedTime() > 0);
      else assert.equal(tx.getLastRelayedTime(), undefined);
      assert(tx.getReceivedTime() > 0);
    }
  } else {
    assert.equal(tx.getHex(), undefined);
    assert.equal(tx.getSize(), undefined);
    assert.equal(tx.getIsDoubleSpend(), undefined);
    assert.equal(tx.getBlockTimestamp(), undefined);
    assert.equal(tx.getLastRelayedTime(), undefined);
    assert.equal(tx.getReceivedTime(), undefined);
  }
  
  // test fields from tx pool
  if (config.fromPool) {
    assert(tx.getSize() > 0);
    assert(tx.getWeight() > 0);
    assert.equal(tx.getDoNotRelay(), false);
    assert.equal(typeof tx.getKeptByBlock(), "boolean");
    assert.equal(tx.getIsFailed(), false);
    assert.equal(tx.getLastFailedHeight(), undefined);  // TODO: test failed daemon txs
    assert.equal(tx.getLastFailedId(), undefined);
    assert(tx.getMaxUsedBlockHeight() >= 0);
    assert(tx.getMaxUsedBlockId());
  } else {
    assert.equal(tx.getWeight(), undefined);
    assert.equal(tx.getDoNotRelay(), undefined);
    assert.equal(tx.getKeptByBlock(), undefined);
    assert.equal(tx.getIsFailed(), undefined);
    assert.equal(tx.getLastFailedHeight(), undefined);
    assert.equal(tx.getLastFailedId(), undefined);
    assert.equal(tx.getMaxUsedBlockHeight(), undefined);
    assert.equal(tx.getMaxUsedBlockId(), undefined);
  }
}

function testBlockTemplate(template) {
  assert(template);
  assert(template.getTemplateBlob());
  assert(template.getHashBlob());
  assert(template.getDifficulty());
  assert(template.getExpectedReward());
  assert(template.getHeight());
  assert(template.getPrevId());
  assert(template.getReservedOffset());
}

function testInfo(info) {
  assert(info.getVersion());
  assert(info.getAltBlocksCount() >= 0);
  assert(info.getBlockSizeLimit());
  assert(info.getBlockSizeMedian());
  assert(typeof info.getBootstrapDaemonAddress() === "string");
  assert(info.getCumulativeDifficulty());
  assert(info.getFreeSpace());
  assert(info.getGreyPeerlistSize() >= 0);
  assert(info.getWhitePeerlistSize() >= 0);
  assert(info.getHeight() >= 0);
  assert(info.getHeightWithoutBootstrap());
  assert(info.getIncomingConnectionsCount() >= 0);
  assert(info.getNetworkType());
  assert(typeof info.getIsOffline() === "boolean");
  assert(info.getOutgoingConnectionsCount() >= 0);
  assert(info.getRpcConnectionsCount() >= 0);
  assert(info.getStartTime());
  assert(info.getTarget());
  assert(info.getTargetHeight() >= 0);
  assert(info.getTopBlockId());
  assert(info.getTxCount() >= 0);
  assert(info.getTxPoolSize() >= 0);
  assert(typeof info.getWasBootstrapEverUsed() === "boolean");
  assert(info.getBlockWeightLimit());
  assert(info.getBlockWeightMedian());
  assert(info.getDatabaseSize());
  assert(typeof info.getUpdateAvailable() === "boolean");
}

function testSyncInfo(syncInfo) { // TODO: consistent naming, daemon in name?
  assert(syncInfo.getHeight() >= 0);
  if (syncInfo.getPeers() !== undefined) {
    assert(syncInfo.getPeers().length > 0);
    for (let peer of syncInfo.getPeers()) {
      testDaemonResponseInfo(peer, true, false);
      testDaemonConnection(peer);
    }
  }
  if (syncInfo.getSpans() !== undefined) {  // TODO: test that this is being hit, so far not used
    assert(syncInfo.getSpans().length > 0);
    for (let span of syncInfo.getSpans()) {
      testDaemonResponseInfo(span, true, false);
      testDaemonConnectionSpan(span);
    }
  }
}

function testDaemonConnection(connection) {
  assert(connection);
  assert(connection.getId());
  assert(connection.getAddress());
  assert(connection.getAvgDownload() >= 0);
  assert(connection.getAvgUpload() >= 0);
  assert(connection.getCurrentDownload() >= 0);
  assert(connection.getCurrentUpload() >= 0);
  assert(connection.getHeight() >= 0);
  assert(connection.getHost());
  assert(connection.getIp());
  assert(connection.getLiveTime() >= 0);
  assert(typeof connection.getIsLocalIp() === "boolean");
  assert(typeof connection.getIsLocalHost() === "boolean");
  assert(connection.getPeerId());
  assert(connection.getPort());
  assert(connection.getReceiveCount() >= 0);
  assert(connection.getReceiveIdleTime() >= 0);
  assert(connection.getSendCount() >= 0);
  assert(connection.getSendIdleTime() >= 0);
  assert(connection.getState());
  assert(connection.getSupportFlags() >= 0); 
}

function testHardForkInfo(hardForkInfo) {
  assert.notEqual(hardForkInfo.getEarliestHeight(), undefined);
  assert.notEqual(hardForkInfo.getIsEnabled(), undefined);
  assert.notEqual(hardForkInfo.getState(), undefined);
  assert.notEqual(hardForkInfo.getThreshold(), undefined);
  assert.notEqual(hardForkInfo.getVersion(), undefined);
  assert.notEqual(hardForkInfo.getVotes(), undefined);
  assert.notEqual(hardForkInfo.getVoting(), undefined);
  assert.notEqual(hardForkInfo.getWindow(), undefined);
}

function testMoneroBan(ban) {
  assert.notEqual(ban.getHost(), undefined);
  assert.notEqual(ban.getIp(), undefined);
  assert.notEqual(ban.getSeconds(), undefined);
}

function testCoinbaseTxSum(txSum) {
  TestUtils.testUnsignedBigInteger(txSum.getTotalEmission());
  assert(txSum.getTotalEmission().toJSValue() > 0);
  TestUtils.testUnsignedBigInteger(txSum.getTotalFees());
  assert(txSum.getTotalFees().toJSValue() > 0);
}

function testOutputHistogramEntry(entry) {
  TestUtils.testUnsignedBigInteger(entry.getAmount());
  assert(entry.getTotalInstances() >= 0);
  assert(entry.getUnlockedInstances() >= 0);
  assert(entry.getRecentInstances() >= 0);
}

function testOutputDistributionEntry(entry) {
  TestUtils.testUnsignedBigInteger(entry.getAmount());
  assert(entry.getBase() >= 0);
  assert(Array.isArray(entry.getDistribution()) && entry.getDistribution().length > 0);
  assert(entry.getStartHeight() >= 0);
}

module.exports = TestMoneroDaemonRpc;