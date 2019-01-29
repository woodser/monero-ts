const assert = require("assert");
const BigInteger = require("../src/submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const GenUtils = require("../src/utils/GenUtils");
const MoneroUtils = require("../src/utils/MoneroUtils");
const TestUtils = require("./TestUtils");
const MoneroWalletLocal = require("../src/wallet/MoneroWalletLocal");
const MoneroSendConfig = require("../src/wallet/model/MoneroSendConfig");
const MoneroDaemonRpc = require("../src/daemon/MoneroDaemonRpc");
const MoneroBan = require("../src/daemon/model/MoneroBan");
const MoneroTx = require("../src/daemon/model/MoneroTx");
const MoneroOutput = require("../src/daemon/model/MoneroOutput");
const MoneroKeyImage = require("../src/daemon/model/MoneroKeyImage")
const MoneroAltChain = require("../src/daemon/model/MoneroAltChain");
const MoneroDaemonSyncInfo = require("../src/daemon/model/MoneroDaemonSyncInfo");
const MoneroDaemonPeer = require("../src/daemon/model/MoneroDaemonPeer");
const MoneroDaemonConnection = require("../src/daemon/model/MoneroDaemonConnection");
const MoneroDaemonUpdateCheckResult = require("../src/daemon/model/MoneroDaemonUpdateCheckResult");

/**
 * Tests a Monero daemon.
 */
class TestMoneroDaemonRpc {
  
  constructor() {
    this.daemon = TestUtils.getDaemonRpc();
    this.wallet = TestUtils.getWalletRpc();
  }
  
  /**
   * Run all tests.
   */
  runTests(config) {
    let that = this;
    describe("TEST MONERO DAEMON RPC", function() {
      
      // initialize wallet before all tests
      before(async function() {
        await TestUtils.initWalletRpc();
      });
      
      if (config.testNonRelays) that._testNonRelays(config.liteMode);
      if (config.testRelays) that._testRelays(config.liteMode);
      if (config.testNotifications) that._testNotifications(config.liteMode);
    });
  }
  
  /**
   * Run tests which do not relay outgoing txs.
   */
  _testNonRelays(liteMode) {
    let daemon = this.daemon;
    let wallet = this.wallet;
    
    describe("Test Non-Relays", function() {
      
      // flush tx pool before each test
      beforeEach(async function() {
        await daemon.flushTxPool();
      });
      
      it("Can indicate if it's trusted", async function() {
        let isTrusted = await daemon.isTrusted();
        assert.equal(typeof isTrusted, "boolean");
      });
      
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
        testBlockTemplate(template);
      });

      it("Can get the last block's header", async function() {
        let lastHeader = await daemon.getLastBlockHeader();
        testBlockHeader(lastHeader, true);
      });
      
      it("Can get a block header by id", async function() {
        
        // retrieve by id of last block
        let lastHeader = await daemon.getLastBlockHeader();
        let id = await daemon.getBlockId(lastHeader.getHeight());
        let header = await daemon.getBlockHeaderById(id);
        testBlockHeader(header, true);
        assert.deepEqual(header, lastHeader);
        
        // retrieve by id of previous to last block
        id = await daemon.getBlockId(lastHeader.getHeight() - 1);
        header = await daemon.getBlockHeaderById(id);
        testBlockHeader(header, true);
        assert.equal(header.getHeight(), lastHeader.getHeight() - 1);
      });
      
      it("Can get a block header by height", async function() {
        
        // retrieve by height of last block
        let lastHeader = await daemon.getLastBlockHeader();
        let header = await daemon.getBlockHeaderByHeight(lastHeader.getHeight());
        testBlockHeader(header, true);
        assert.deepEqual(header, lastHeader);
        
        // retrieve by height of previous to last block
        header = await daemon.getBlockHeaderByHeight(lastHeader.getHeight() - 1);
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
        testBlock(block, testBlockConfig);
        assert.deepEqual(block, await daemon.getBlockByHeight(block.getHeader().getHeight()));
        assert(block.getTxs() === undefined);
        
        // retrieve by id of previous to last block
        id = await daemon.getBlockId(lastHeader.getHeight() - 1);
        block = await daemon.getBlockById(id);
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
        testBlock(block, testBlockConfig);
        assert.deepEqual(block, await daemon.getBlockByHeight(block.getHeader().getHeight()));
        
        // retrieve by height of previous to last block
        block = await daemon.getBlockByHeight(lastHeader.getHeight() - 1);
        testBlock(block, testBlockConfig);
        assert.deepEqual(block.getHeader().getHeight(), lastHeader.getHeight() - 1);
      });
      
      it("Can get blocks by height which includes transactions (binary)", async function() {
        
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
          testBlock(block, testBlockConfig);
          assert.equal(block.getHeader().getHeight(), heights[i]);      
        }
        assert(txFound, "No transactions found to test");
      });
      
      it("Can get blocks by id which includes transactions (binary)", async function() {
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
      
      it("Can get block ids (binary)", async function() {
        //get_hashes.bin
        throw new Error("Not implemented");
      });
      
      it("Can get transactions by id", async function() {
        
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
          testTx(tx, { hasJson: decodeAsJson, isPruned: prune, isFull: true, isConfirmed: true, fromPool: false });
        }
        
        // TODO: test binary vs json encoding
      });
      
      it("Can get the coinbase transaction sum", async function() {
        let sum = await daemon.getCoinbaseTxSum(0, 50000);
        testCoinbaseTxSum(sum);
      });
      
      it("Can get a fee estimate", async function() {
        let fee = await daemon.getFeeEstimate();
        TestUtils.testUnsignedBigInteger(fee, true);
      });
      
      it("Can get transactions and spent key images in the transaction pool", async function() {
        
        // submit tx to pool but don't relay
        let tx = await getUnrelayedTx(wallet);
        await daemon.submitTxHex(tx.getHex(), true);
        
        // fetch tx pool txs and spent key images
        let txPool = await daemon.getTxPoolTxsAndSpentKeyImages();
        
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
          assert(image instanceof MoneroKeyImage);
          assert(image.getHex());
          assert.equal(typeof image.getSpentStatus(), "number");
          assert.equal(image.getSpentStatus(), MoneroKeyImage.SpentStatus.TX_POOL);
          assert(Array.isArray(image.getSpendingTxIds()));
          assert(image.getSpendingTxIds().length > 0);
          assert(image.getSpendingTxIds().includes(tx.getId()));
        }
        
        // flush the tx from the pool, gg
        await daemon.flushTxPool(tx.getId());
      });
      
      it("Can get ids of transactions in the transaction pool (binary)", async function() {
        // TODO: get_transaction_pool_hashes.bin
        throw new Error("Not implemented");
      });
      
      it("Can get the transaction pool backlog (binary)", async function() {
        // TODO: get_txpool_backlog
        throw new Error("Not implemented");
      });
      
      it("Can get transaction pool statistics (binary)", async function() {
        
        // submit txs to the pool but don't relay (multiple txs result in binary `histo` field)
        for (let i = 0; i < 2; i++) {
          
          // submit tx hex
          let tx = await getUnrelayedTx(wallet, i);
          await daemon.submitTxHex(tx.getHex(), true);
          
          // test stats
          stats = await daemon.getTxPoolStats();
          assert(stats.getCount() > i);
          testTxPoolStats(stats);
        }
      });
      
      it("Can flush all transactions from the pool", async function() {
        
        // pool starts flushed for each test
        let txPool = await daemon.getTxPoolTxsAndSpentKeyImages();
        assert.equal(txPool.getTxs().length, 0);
        
        // submit txs to the pool but don't relay
        for (let i = 0; i < 2; i++) {
          let tx = await getUnrelayedTx(wallet, i);
          await daemon.submitTxHex(tx.getHex(), true);
        }
        
        // txs are in pool
        txPool = await daemon.getTxPoolTxsAndSpentKeyImages();
        assert(txPool.getTxs().length >= 2);
        
        // flush tx pool
        let resp = await daemon.flushTxPool();
        txPool = await daemon.getTxPoolTxsAndSpentKeyImages();
        assert(txPool.getTxs().length === 0);
      });
      
      it("Can flush a transaction from the pool by id", async function() {
        
        // submit txs to the pool but don't relay
        let txs = [];
        for (let i = 0; i < 3; i++) {
          let tx = await getUnrelayedTx(wallet, i);
          await daemon.submitTxHex(tx.getHex(), true);
          txs.push(tx);
        }
        
        // remove each tx from the pool by id and test
        for (let i = 0; i < txs.length; i++) {
          
          // flush tx from pool
          await daemon.flushTxPool(txs[i].getId());
          
          // test tx pool
          let txPool = await daemon.getTxPoolTxsAndSpentKeyImages();
          assert.equal(txPool.getTxs().length, txs.length - i - 1);
        }
      });
      
      it("Can flush transactions from the pool by ids", async function() {
        
        // submit txs to the pool but don't relay
        let txIds = [];
        for (let i = 0; i < 3; i++) {
          let tx = await getUnrelayedTx(wallet, i);
          await daemon.submitTxHex(tx.getHex(), true);
          txIds.push(tx.getId());
        }
        
        // remove all txs by ids
        await daemon.flushTxPool(txIds);
        
        // test tx pool
        let txPool = await daemon.getTxPoolTxsAndSpentKeyImages();
        assert.equal(txPool.getTxs().length, 0);
      });
      
      it("Can get the spent status of key images", async function() {
        
        // submit txs to the pool but don't relay
        let txs = [];
        for (let i = 0; i < 3; i++) {
          let tx = await getUnrelayedTx(wallet, i);
          await daemon.submitTxHex(tx.getHex(), true);
          txs.push(tx);
        }
        
        // collect key images being spent as hex // TODO: better way to get key images?
        let keyImages = [];
        let txIds = txs.map(tx => tx.getId());
        for (let tx of await daemon.getTxs(txIds, true)) {
          for (let vin of tx.getVins()) keyImages.push(vin.getKeyImage().getHex());
        }
        
        // flush txs
        await daemon.flushTxPool(txIds);
        
        // key images are not spent
        await testSpentStatuses(keyImages, MoneroKeyImage.SpentStatus.NOT_SPENT);
        
        // submit txs to the pool but don't relay
        for (let tx of txs) await daemon.submitTxHex(tx.getHex(), true);
        
        // key images are in the tx pool
        await testSpentStatuses(keyImages, MoneroKeyImage.SpentStatus.TX_POOL);
        
        // collect key images of confirmed txs
        keyImages = [];
        txs = await getConfirmedTxs(daemon, 10);
        for (let tx of txs) {
          for (let vin of tx.getVins()) keyImages.push(vin.getKeyImage().getHex());
        }
        
        // key images are all spent
        await testSpentStatuses(keyImages, MoneroKeyImage.SpentStatus.CONFIRMED);
        
        // helper function to check the spent status of a key image or array of key images
        async function testSpentStatuses(keyImages, expectedStatus) {
          
          // test image
          for (let keyImage of keyImages) {
            assert.equal(await daemon.getSpentStatus(keyImage), expectedStatus);
          }
          
          // test array of images
          let statuses = await daemon.getSpentStatuses(keyImages);
          assert(Array.isArray(statuses));
          assert.equal(statuses.length, keyImages.length);
          for (let status of statuses) assert.equal(status, expectedStatus);
        }
      });
      
      it("Can get output indices given a list of transaction ids (binary)", async function() {
        throw new Error("Not implemented"); // get_o_indexes.bin
      });
      
      it("Can get outputs given a list of output amounts and indices (binary)", async function() {
        throw new Error("Not implemented"); // get_outs.bin
      });
      
      it("Can get an output histogram", async function() {
        let entries = await daemon.getOutputHistogram();
        assert(Array.isArray(entries));
        assert(entries.length > 0);
        for (let entry of entries) {
          testOutputHistogramEntry(entry);
        }
      });
      
      it("Can get an output distribution (binary)", async function() {
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
          testOutputDistributionEntry(entry);
        }
      });
      
      it("Has general information", async function() {
        let info = await daemon.getInfo();
        testInfo(info);
      });
      
      it("Has sync information", async function() {
        let syncInfo = await daemon.getSyncInfo();
        testSyncInfo(syncInfo);
      });
      
      it("Has hard fork information", async function() {
        let hardForkInfo = await daemon.getHardForkInfo();
        testHardForkInfo(hardForkInfo);
      });
      
      it("Can get alternative chains", async function() {
        let altChains = await daemon.getAltChains();
        assert(Array.isArray(altChains) && altChains.length >= 0);
        for (let altChain of altChains) {
          testAltChain(altChain);
        }
      });
      
      it("Can get alternative block ids", async function() {
        let altBlockIds = await daemon.getAltBlockIds();
        assert(Array.isArray(altBlockIds) && altBlockIds.length >= 0);
        for (let altBlockId of altBlockIds) {
          assert.equal(typeof altBlockId, "string");
          assert.equal(altBlockId.length, 64);  // TODO: common validation
        }
      });
      
      it("Can get, set, and reset a download bandwidth limit", async function() {
        let initVal = await daemon.getDownloadLimit();
        assert(initVal > 0);
        let setVal = initVal * 2;
        await daemon.setDownloadLimit(setVal);
        assert.equal(await daemon.getDownloadLimit(), setVal);
        let resetVal = await daemon.resetDownloadLimit();
        assert.equal(resetVal, initVal);
        
        // test invalid limits
        try {
          await daemon.setDownloadLimit();
          fail("Should have thrown error on invalid input");
        } catch (e) {
          assert.equal("Download limit must be an integer greater than 0", e.message);
        }
        try {
          await daemon.setDownloadLimit(0);
          fail("Should have thrown error on invalid input");
        } catch (e) {
          assert.equal("Download limit must be an integer greater than 0", e.message);
        }
        try {
          await daemon.setDownloadLimit(1.2);
          fail("Should have thrown error on invalid input");
        } catch (e) {
          assert.equal("Download limit must be an integer greater than 0", e.message);
        }
        assert.equal(await daemon.getDownloadLimit(), initVal);
      });
      
      it("Can get, set, and reset an upload bandwidth limit", async function() {
        let initVal = await daemon.getUploadLimit();
        assert(initVal > 0);
        let setVal = initVal * 2;
        await daemon.setUploadLimit(setVal);
        assert.equal(await daemon.getUploadLimit(), setVal);
        let resetVal = await daemon.resetUploadLimit();
        assert.equal(resetVal, initVal);
        
        // test invalid limits
        try {
          await daemon.setUploadLimit();
          fail("Should have thrown error on invalid input");
        } catch (e) {
          assert.equal("Upload limit must be an integer greater than 0", e.message);
        }
        try {
          await daemon.setUploadLimit(0);
          fail("Should have thrown error on invalid input");
        } catch (e) {
          assert.equal("Upload limit must be an integer greater than 0", e.message);
        }
        try {
          await daemon.setUploadLimit(1.2);
          fail("Should have thrown error on invalid input");
        } catch (e) {
          assert.equal("Upload limit must be an integer greater than 0", e.message);
        }
        assert.equal(await daemon.getUploadLimit(), initVal);
      });
      
      it("Can get known peers which may be online or offline", async function() {
        let peers = await daemon.getKnownPeers();
        assert(peers.length > 0);
        for (let peer of peers) {
          testKnownPeer(peer);
        }
      });
      
      it("Can get incoming and outgoing peer connections", async function() {
        let connections = await daemon.getConnections();
        assert(Array.isArray(connections));
        assert(connections.length > 0, "Daemon has no incoming or outgoing connections to test");
        for (let connection of connections) {
          testDaemonConnection(connection);
        }
      });
      
      it("Can limit the number of outgoing peers", async function() {
        await daemon.setOutgoingPeerLimit(0);
        await daemon.setOutgoingPeerLimit(8);
        await daemon.setOutgoingPeerLimit(10);
        try {
          await daemon.setOutgoingPeerLimit("a");
          throw new Error("Should have failed on invalid input");
        } catch(e) {
          assert.notEqual("Should have failed on invalid input", e.message);
        }
      });
      
      it("Can limit the number of incoming peers", async function() {
        await daemon.setIncomingPeerLimit(0);
        await daemon.setIncomingPeerLimit(8);
        await daemon.setIncomingPeerLimit(10);
        try {
          await daemon.setIncomingPeerLimit("a");
          throw new Error("Should have failed on invalid input");
        } catch(e) {
          assert.notEqual("Should have failed on invalid input", e.message);
        }
      });
      
      it("Can ban a peer", async function() {
        
        // set ban
        let ban = new MoneroBan();
        ban.setHost("192.168.1.51");
        ban.setIsBanned(true);
        ban.setSeconds(60);
        await daemon.setPeerBan(ban);
        
        // test ban
        let bans = await daemon.getPeerBans();
        let found = false;
        for (let aBan of bans) {
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
        await daemon.setPeerBans(bans);
        
        // test bans
        bans = await daemon.getPeerBans();
        let found1 = false;
        let found2 = false;
        for (let aBan of bans) {
          testMoneroBan(aBan);
          if (aBan.getHost() === "192.168.1.52") found1 = true;
          if (aBan.getHost() === "192.168.1.53") found2 = true;
        }
        assert(found1);
        assert(found2);
      });
      
      it("Can start and stop mining", async function() {
        
        // generate address to mine to
        let wallet = new MoneroWalletLocal(daemon);
        let address = await wallet.getPrimaryAddress();
        
        // start mining
        await daemon.startMining(address, 2, false, true);
        
        // stop mining
        await daemon.stopMining();
      });
      
      it("Can get mining status", async function() {
        
        try {
          
          // test status without mining
          let status = await daemon.getMiningStatus();
          assert.equal(status.getIsActive(), false);
          assert.equal(status.getAddress(), undefined);
          assert.equal(status.getSpeed(), 0);
          assert.equal(status.getThreadCount(), 0);
          assert.equal(status.getIsBackground(), undefined);
          
          // test status with mining
          let wallet = new MoneroWalletLocal(daemon);
          let address = await wallet.getPrimaryAddress();
          let threadCount = 3;
          let isBackground = false;
          await daemon.startMining(address, threadCount, isBackground, true);
          status = await daemon.getMiningStatus();
          assert.equal(status.getIsActive(), true);
          assert.equal(status.getAddress(), address);
          assert(status.getSpeed() >= 0);
          assert.equal(status.getThreadCount(), threadCount);
          assert.equal(status.getIsBackground(), isBackground);
        } catch(e) {
          throw e;
        } finally {
          
          // stop mining at end of test
          try { await daemon.stopMining(); }
          catch(e) { }
        }
      });
      
      it("Can submit a mined block to the network", async function() {
        
        // get template to mine on
        let template = await daemon.getBlockTemplate(TestUtils.TEST_ADDRESS);
        
        // TODO monero rpc: way to get mining nonce when found in order to submit?
        
        // try to submit block hashing blob without nonce
        try {
          await daemon.submitBlock(template.getHashBlob());
          fail("Should have thrown error");
        } catch (e) {
          assert.equal(e.getRpcCode(), -7);
          assert.equal(e.getRpcMessage(), "Block not accepted");
        }
      });
      
      it("Can check for an update", async function() {
        let result = await daemon.checkForUpdate();
        testUpdateCheckResult(result);
      });
      
      it("Can download an update", async function() {
        
        // download to default path
        let result = await daemon.downloadUpdate();
        testUpdateDownloadResult(result);
        
        // download to defined path
        let path = "test_download_" + +new Date().getTime() + ".tar.bz2";
        result = await daemon.downloadUpdate(path);
        testUpdateDownloadResult(result, path);
        
        // test invalid path
        try {
          result = await daemon.downloadUpdate("./ohhai/there");
          throw new Error("Should have thrown error");
        } catch(e) {
          assert.notEqual("Should have thrown error", e.message);
          assert.equal(e.statusCode, 500);  // TODO: this causes a 500, in daemon rpc?
        }
      });
      
      // test is disabled to not interfere with other tests
//      it("Can be stopped", async function() {
//        
//        // stop the daemon
//        await daemon.stop();
//        
//        // give the daemon 10 seconds to shut down
//        await new Promise(function(resolve) { setTimeout(resolve, 10000); }); 
//        
//        // try to interact with the daemon
//        try {
//          await daemon.getHeight();
//          throw new Error("Should have thrown error");
//        } catch(e) {
//          console.log(e);
//          assert.notEqual("Should have thrown error", e.message);
//        }
//      });
    });
  }
  
  /**
   * Tests that relay outgoing txs.
   */
  _testRelays() {
    let daemon = this.daemon;
    let wallet = this.wallet;
    
    describe("Test Relays", function() {
      
      it("Can submit a tx in hex format to the pool and relay in one call", async function() {
        
        // create 2 txs, the second will double spend outputs of first
        let tx1 = await getUnrelayedTx(wallet, 0);
        let tx2 = await getUnrelayedTx(wallet, 0);
        
        // submit and relay tx1
        let result = await daemon.submitTxHex(tx1.getHex());
        assert.equal(result.getIsRelayed(), true);
        testSubmitTxResultGood(result);
        
        // tx1 is in the pool
        let txPool = await daemon.getTxPoolTxsAndSpentKeyImages();
        let found = false;
        for (let aTx of txPool.getTxs()) {
          if (aTx.getId() === tx1.getId()) {
            assert.equal(aTx.getIsRelayed(), true);
            found = true;
            break;
          }
        }
        assert(found, "Tx1 was not found after being submitted to the daemon's tx pool");
        
        // submit and relay tx2 hex which double spends tx1
        result = await daemon.submitTxHex(tx2.getHex());
        assert.equal(result.getIsRelayed(), true);
        testSubmitTxResultDoubleSpend(result);
        
        // tx2 is in not the pool
        txPool = await daemon.getTxPoolTxsAndSpentKeyImages();
        found = false;
        for (let aTx of txPool.getTxs()) {
          if (aTx.getId() === tx2.getId()) {
            found = true;
            break;
          }
        }
        assert(!found, "Tx2 should not be in the pool because it double spends tx1 which is in the pool");
      });
      
      it("Can submit a tx in hex format to the pool then relay", async function() {
        let tx = await getUnrelayedTx(wallet, 1);
        await testSubmitThenRelay([tx]);
      });
      
      it("Can submit txs in hex format to the pool then relay", async function() {
        let txs = [];
        txs.push(await getUnrelayedTx(wallet, 2));
        txs.push(await getUnrelayedTx(wallet, 3));  // TODO: accounts cannot be re-used across send tests else isRelayed is true; wallet needs to update?
        await testSubmitThenRelay(txs);
      });
      
      async function testSubmitThenRelay(txs) {
        
        // submit txs hex but don't relay
        let txIds = [];
        for (let tx of txs) {
          txIds.push(tx.getId());
          let result = await daemon.submitTxHex(tx.getHex(), true);
          assert.equal(result.getIsRelayed(), false);
          testSubmitTxResultGood(result);
          
          // ensure tx is in pool
          let txPool = await daemon.getTxPoolTxsAndSpentKeyImages();
          let found = false;
          for (let aTx of txPool.getTxs()) {
            if (aTx.getId() === tx.getId()) {
              assert.equal(aTx.getIsRelayed(), false);
              found = true;
              break;
            }
          }
          assert(found, "Tx was not found after being submitted to the daemon's tx pool");
        }
        
        // relay the txs
        txIds.length === 1 ? await daemon.relayTxById(txIds[0]) : await daemon.relayTxsById(txIds);
        
        // ensure txs are relayed
        for (let tx of txs) {
          let txPool = await daemon.getTxPoolTxsAndSpentKeyImages();
          let found = false;
          for (let aTx of txPool.getTxs()) {
            if (aTx.getId() === tx.getId()) {
              assert.equal(aTx.getIsRelayed(), true);
              found = true;
              break;
            }
          }
          assert(found, "Tx was not found after being submitted to the daemon's tx pool");
        }
      }
    });
  }
  
  _testNotifications() {
    let daemon = this.daemon;
    let wallet = this.wallet;
    
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
    for (let vin of tx.getVins()) {
      testVin(vin);
      assert(tx === vin.getTx());
    }
    assert(tx.getVouts() && Array.isArray(tx.getVouts()) && tx.getVouts().length >= 0);
    for (let vout of tx.getVouts()) {
      testVout(vout);
      assert(tx === vout.getTx());
    }
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
  if (config.isPruned) {
    assert.equal(tx.getRctSigPrunable(), undefined);
  } else {
    assert.equal(typeof tx.getRctSigPrunable().nbp, "number");
  }
  assert.equal(tx.getPrunableHex(), undefined);
  assert.equal(tx.getPrunedHex(undefined));
  
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
      else if (!tx.getLastRelayedTime() !== undefined) console.log("WARNING: tx has last relayed time but is not relayed");  // TODO monero-wallet-rpc
      assert(tx.getReceivedTime() > 0);
    }
//    if (config.isPruned) assert(!tx.getPrunableHash()); // TODO: tx may or may not have prunable hash, need to know when it's expected
//    else assert(tx.getPrunableHash());
  } else {
    assert.equal(tx.getHex(), undefined);
    assert.equal(tx.getSize(), undefined);
    assert.equal(tx.getIsDoubleSpend(), undefined);
    assert.equal(tx.getBlockTimestamp(), undefined);
    assert.equal(tx.getLastRelayedTime(), undefined);
    assert.equal(tx.getReceivedTime(), undefined);
    assert.equal(tx.getPrunableHash(), undefined);
  }
  
  // test fields from tx pool
  if (config.fromPool) {
    assert(tx.getSize() > 0);
    assert(tx.getWeight() > 0);
    assert.equal(typeof tx.getKeptByBlock(), "boolean");
    assert.equal(tx.getLastFailedHeight(), undefined);
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
  
  if (tx.getIsFailed()) {
    // TODO: implement this
  }
}

function testBlockTemplate(template) {
  assert(template);
  assert(template.getTemplateBlob());
  assert(template.getHashBlob());
  assert(template.getDifficulty());
  assert(template.getDifficulty() instanceof BigInteger);
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
  assert(syncInfo instanceof MoneroDaemonSyncInfo);
  assert(syncInfo.getHeight() >= 0);
  if (syncInfo.getConnections() !== undefined) {
    assert(syncInfo.getConnections().length > 0);
    for (let connection of syncInfo.getConnections()) {
      testDaemonConnection(connection);
    }
  }
  if (syncInfo.getSpans() !== undefined) {  // TODO: test that this is being hit, so far not used
    assert(syncInfo.getSpans().length > 0);
    for (let span of syncInfo.getSpans()) {
      testDaemonConnectionSpan(span);
    }
  }
  assert(syncInfo.getNextNeededPruningSeed() >= 0);
  assert.equal(syncInfo.getOverview(), undefined);
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

function testSubmitTxResultGood(result) {
  testSubmitTxResultCommon(result);
  assert.equal(result.getIsGood(), true);
  assert.equal(result.getIsDoubleSpend(), false);
  assert.equal(result.getIsFeeTooLow(), false);
  assert.equal(result.getIsMixinTooLow(), false);
  assert.equal(result.getHasInvalidInput(), false);
  assert.equal(result.getHasInvalidOutput(), false);
  assert.equal(result.getIsRct(), true);
  assert.equal(result.getIsOverspend(), false);
  assert.equal(result.getIsTooBig(), false);
}

function testSubmitTxResultDoubleSpend(result) {
  testSubmitTxResultCommon(result);
  assert.equal(result.getIsGood(), false);
  assert.equal(result.getIsDoubleSpend(), true);
  assert.equal(result.getIsFeeTooLow(), false);
  assert.equal(result.getIsMixinTooLow(), false);
  assert.equal(result.getHasInvalidInput(), false);
  assert.equal(result.getHasInvalidOutput(), false);
  assert.equal(result.getIsRct(), true);
  assert.equal(result.getIsOverspend(), false);
  assert.equal(result.getIsTooBig(), false);
}

function testSubmitTxResultCommon(result) {
  assert.equal(typeof result.getIsGood(), "boolean");
  assert.equal(typeof result.getIsRelayed(), "boolean");
  assert.equal(typeof result.getIsDoubleSpend(), "boolean");
  assert.equal(typeof result.getIsFeeTooLow(), "boolean");
  assert.equal(typeof result.getIsMixinTooLow(), "boolean");
  assert.equal(typeof result.getHasInvalidInput(), "boolean");
  assert.equal(typeof result.getHasInvalidOutput(), "boolean");
  assert.equal(typeof result.getIsRct(), "boolean");
  assert.equal(typeof result.getIsOverspend(), "boolean");
  assert.equal(typeof result.getIsTooBig(), "boolean");
}

function testTxPoolStats(stats) {
  assert(stats);
  assert(stats.getCount() >= 0);
  if (stats.getCount() > 0) {
    if (stats.getCount() === 1) assert.equal(stats.getHisto(), undefined);
    else {
      assert(stats.getHisto());
      console.log(stats.getHisto());
      throw new Error("Ready to test histogram");
    }
    assert(stats.getBytesMax() > 0);
    assert(stats.getBytesMed() > 0);
    assert(stats.getBytesMin() > 0);
    assert(stats.getBytesTotal() > 0);
    assert(stats.getTime98pc() === undefined || stats.getTime98pc() > 0);
    assert(stats.getTimeOldest() > 0);
    assert(stats.getCount10m() >= 0);
    assert(stats.getDoubleSpendCount() >= 0);
    assert(stats.getFailedCount() >= 0);
    assert(stats.getNotRelayedCount() >= 0);
  } else {
    assert.equal(stats.getBytesMax(), undefined);
    assert.equal(stats.getBytesMed(), undefined);
    assert.equal(stats.getBytesMin(), undefined);
    assert.equal(stats.getBytesTotal(), 0);
    assert.equal(stats.getTime98pc(), undefined);
    assert.equal(stats.getTimeOldest(), undefined);
    assert.equal(stats.getCount10m(), 0);
    assert.equal(stats.getDoubleSpendCount(), 0);
    assert.equal(stats.getFailedCount(), 0);
    assert.equal(stats.getNotRelayedCount(), 0);
    assert.equal(stats.getHisto(), undefined);
  }
}

async function getUnrelayedTx(wallet, accountIdx) {
  let sendConfig = new MoneroSendConfig(await wallet.getPrimaryAddress(), TestUtils.MAX_FEE); 
  sendConfig.setDoNotRelay(true);
  sendConfig.setAccountIndex(accountIdx);
  let tx = await wallet.send(sendConfig);
  assert(tx.getHex());
  assert.equal(tx.getDoNotRelay(), true);
  return tx;
}

function testVin(vin) {
  testOutput(vin);
  assert(vin.getKeyImage());
  assert(vin.getKeyImage().getHex().length === 64);
  assert(vin.getRingOutputIndices() && Array.isArray(vin.getRingOutputIndices()) && vin.getRingOutputIndices().length > 0);
  for (let index of vin.getRingOutputIndices()) {
    assert.equal(typeof index, "number")
    assert(index >= 0);
  }
}

function testVout(vout) {
  testOutput(vout);
  assert(vout.getStealthPublicKey() && vout.getStealthPublicKey().length === 64);
}

function testOutput(output) { 
  assert(output instanceof MoneroOutput);
  TestUtils.testUnsignedBigInteger(output.getAmount());
}

async function getConfirmedTxs(daemon, numTxs) {
  let txs = [];
  let numBlocksPerReq = 50;
  for (let startIdx = await daemon.getHeight() - numBlocksPerReq - 1; startIdx >= 0; startIdx -= numBlocksPerReq) {
    let blocks = await daemon.getBlocksByRange(startIdx, startIdx + numBlocksPerReq);
    for (let block of blocks) {
      if (!block.getTxs()) continue;
      for (let tx of block.getTxs()) {
        txs.push(tx);
        if (txs.length === numTxs) return txs;
      }
    }
  }
  throw new Error("Could not get " + numTxs + " confirmed txs");
}

function testAltChain(altChain) {
  assert(altChain instanceof MoneroAltChain);
  assert(Array.isArray(altChain.getBlockIds()) && altChain.getBlockIds().length > 0);
  TestUtils.testUnsignedBigInteger(altChain.getDifficulty(), true);
  assert(altChain.getHeight() > 0);
  assert(altChain.getLength() > 0);
  assert(altChain.getMainChainParentBlockId().length === 64);
}

function testDaemonConnection(connection) {
  assert(connection instanceof MoneroDaemonConnection);
  assert(connection.getPeer());
  testKnownPeer(connection.getPeer(), true);
  assert(connection.getId());
  assert(connection.getAvgDownload() >= 0);
  assert(connection.getAvgUpload() >= 0);
  assert(connection.getCurrentDownload() >= 0);
  assert(connection.getCurrentUpload() >= 0);
  assert(connection.getHeight() >= 0);
  assert(connection.getLiveTime() >= 0);
  assert.equal(typeof connection.getIsLocalIp(), "boolean");
  assert.equal(typeof connection.getIsLocalHost(), "boolean");
  assert(connection.getReceiveCount() >= 0);
  assert(connection.getReceiveIdleTime() >= 0);
  assert(connection.getSendCount() >= 0);
  assert(connection.getSendIdleTime() >= 0);
  assert(connection.getState());
  assert(connection.getSupportFlagCount() >= 0); 
}

function testKnownPeer(peer, fromConnection) {
  assert(peer instanceof MoneroDaemonPeer);
  assert.equal(typeof peer.getId(), "string");
  assert.equal(typeof peer.getHost(), "string");
  assert(peer.getPort() > 0);
  assert.equal(typeof peer.getIsOnline(), "boolean");
  if (fromConnection) assert.equal(undefined, peer.getLastSeen());
  else assert(peer.getLastSeen() > 0);
  assert.equal(peer.getPruningSeed(), 0);
}

function testUpdateCheckResult(result) {
  assert(result instanceof MoneroDaemonUpdateCheckResult);
  assert.equal(typeof result.getIsUpdateAvailable(), "boolean");
  if (result.getIsUpdateAvailable()) {
    assert.equal(typeof result.getVersion(), "string");
    assert.equal(typeof result.getHash(), "string");
    assert.equal(result.getHash().length, 64);
  } else {
    assert.equal(result.getVersion(), undefined);
    assert.equal(result.getHash(), undefined);
  }
  assert(result.getAutoUri(), "No auto uri; is daemon online?");
  assert(result.getUserUri());
}

function testUpdateDownloadResult(result, path) {
  testUpdateCheckResult(result);
  if (result.getIsUpdateAvailable()) {
    if (path) assert.equal(result.getDownloadPath(), path);
    else assert(result.getDownloadPath());
  } else {
    assert.equal(result.getDownloadPath(), undefined);
  }
}

module.exports = TestMoneroDaemonRpc;