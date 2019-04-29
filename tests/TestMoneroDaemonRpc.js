const assert = require("assert");
const BigInteger = require("../src/submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const GenUtils = require("../src/utils/GenUtils");
const MoneroUtils = require("../src/utils/MoneroUtils");
const MoneroError = require("../src/utils/MoneroError");
const TestUtils = require("./TestUtils");
const MoneroWalletLocal = require("../src/wallet/MoneroWalletLocal");
const MoneroSendConfig = require("../src/wallet/config/MoneroSendConfig");
const MoneroDaemonRpc = require("../src/daemon/MoneroDaemonRpc");
const MoneroBan = require("../src/daemon/model/MoneroBan");
const MoneroBlock = require("../src/daemon/model/MoneroBlock");
const MoneroTx = require("../src/daemon/model/MoneroTx");
const MoneroOutput = require("../src/daemon/model/MoneroOutput");
const MoneroKeyImage = require("../src/daemon/model/MoneroKeyImage")
const MoneroKeyImageSpentStatus = require("../src/daemon/model/MoneroKeyImageSpentStatus");
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
        let isTrusted = await daemon.getIsTrusted();
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
        assert.deepEqual(block, await daemon.getBlockByHeight(block.getHeight()));
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
        assert.deepEqual(block, await daemon.getBlockByHeight(block.getHeight()));
        
        // retrieve by height of previous to last block
        block = await daemon.getBlockByHeight(lastHeader.getHeight() - 1);
        testBlock(block, testBlockConfig);
        assert.deepEqual(block.getHeight(), lastHeader.getHeight() - 1);
      });
      
      it("Can get blocks by height which includes transactions (binary)", async function() {
        
        // set number of blocks to test
        const numBlocks = 200;
        
        // select random heights  // TODO: this is horribly inefficient way of computing last 100 blocks if not shuffling
        let currentHeight = await daemon.getHeight();
        let allHeights = [];
        for (let i = 0; i < currentHeight - 1; i++) allHeights.push(i);
        //GenUtils.shuffle(allHeights);
        let heights = [];
        for (let i = allHeights.length - numBlocks; i < allHeights.length; i++) heights.push(allHeights[i]);
        
        // fetch blocks
        let blocks = await daemon.getBlocksByHeight(heights);
        
        // config for testing blocks
        let testBlockConfig = { hasHex: false, headerIsFull: false, hasTxs: true, txConfig: { isPruned: false, isConfirmed: true, fromGetTxPool: false, hasOutputIndices: false, fromGetBlocksByHeight: true } }; // TODO: getBlocksByHeight() has inconsistent client-side pruning, get_blocks_by_height.bin does not return output indices (#5127)
        
        // test blocks
        let txFound = false;
        assert.equal(blocks.length, numBlocks);
        for (let i = 0; i < heights.length; i++) {
          let block = blocks[i];
          if (block.getTxs().length) txFound = true;
          testBlock(block, testBlockConfig);
          assert.equal(block.getHeight(), heights[i]);      
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
            assert.equal(blocks[i].getHeight(), realStartHeight + i);
          }
        }
      });
      
      it("Can get block ids (binary)", async function() {
        //get_hashes.bin
        throw new Error("Not implemented");
      });
      
      it("Can get a transaction by id with and without pruning", async function() {
        
        // fetch transaction ids to test
        let txIds = await getConfirmedTxIds(daemon);
        
        // fetch each tx by id without pruning
        for (let txId of txIds) {
          let tx = await daemon.getTx(txId);
          testTx(tx, {isPruned: false, isConfirmed: true, fromGetTxPool: false});
        }
        
        // fetch each tx by id with pruning
        for (let txId of txIds) {
          let tx = await daemon.getTx(txId, true);
          testTx(tx, {isPruned: true, isConfirmed: true, fromGetTxPool: false});
        }
        
        // fetch invalid id
        try {
          await daemon.getTx("invalid tx id");
          throw new Error("fail");
        } catch (e) {
          assert.equal("Invalid transaction id", e.message);
        }
      });
      
      it ("Can get transactions by ids with and without pruning", async function() {
        
        // fetch transaction ids to test
        let txIds = await getConfirmedTxIds(daemon);
        
        // fetch txs by id without pruning
        let txs = await daemon.getTxs(txIds);
        assert.equal(txs.length, txIds.length);
        for (let tx of txs) {
          testTx(tx, {isPruned: false, isConfirmed: true, fromGetTxPool: false});
        }
        
        // fetch txs by id with pruning
        txs = await daemon.getTxs(txIds, true);
        assert.equal(txs.length, txIds.length);
        for (let tx of txs) {
          testTx(tx, {isPruned: true, isConfirmed: true, fromGetTxPool: false});
        }
        
        // fetch invalid id
        txIds.push("invalid tx id");
        try {
          await daemon.getTxs(txIds);
          throw new Error("fail");
        } catch (e) {
          assert.equal("Invalid transaction id", e.message);
        }
      });
      
      it("Can get transactions by ids that are in the transaction pool", async function() {
        
        // submit txs to the pool but don't relay
        let txIds = [];
        for (let i = 0; i < 3; i++) {
          let tx = await getUnrelayedTx(wallet, i);
          await daemon.submitTxHex(tx.getFullHex(), true);
          txIds.push(tx.getId());
        }
        
        // fetch txs by id
        let txs = await daemon.getTxs(txIds);
        
        // test fetched txs
        assert.equal(txs.length, txIds.length);
        for (let tx of txs) {
          testTx(tx, {isConfirmed: false, fromGetTxPool: false, isPruned: false});
        }
      });
      
      it("Can get a transaction hex by id with and without pruning", async function() {
        
        // fetch transaction ids to test
        let txIds = await getConfirmedTxIds(daemon);
        
        // fetch each tx hex by id with and without pruning
        let hexes = []
        let hexesPruned = [];
        for (let txId of txIds) {
          hexes.push(await daemon.getTxHex(txId));
          hexesPruned.push(await daemon.getTxHex(txId, true));
        }
        
        // test results
        assert.equal(hexes.length, txIds.length);
        assert.equal(hexesPruned.length, txIds.length);
        for (let i = 0; i < hexes.length; i++) {
          assert.equal(typeof hexes[i], "string");
          assert.equal(typeof hexesPruned[i], "string");
          assert(hexesPruned[i].length > 0);
          assert(hexes[i].length > hexesPruned[i].length); // pruned hex is shorter
        }
        
        // fetch invalid id
        try {
          await daemon.getTxHex("invalid tx id");
          throw new Error("fail");
        } catch (e) {
          assert.equal("Invalid transaction id", e.message);
        }
      });
      
      it("Can get transaction hexes by ids with and without pruning", async function() {
        
        // fetch transaction ids to test
        let txIds = await getConfirmedTxIds(daemon);
        
        // fetch tx hexes by id with and without pruning
        let hexes = await daemon.getTxHexes(txIds);
        let hexesPruned = await daemon.getTxHexes(txIds, true);
        
        // test results
        assert.equal(hexes.length, txIds.length);
        assert.equal(hexesPruned.length, txIds.length);
        for (let i = 0; i < hexes.length; i++) {
          assert.equal(typeof hexes[i], "string");
          assert.equal(typeof hexesPruned[i], "string");
          assert(hexesPruned[i].length > 0);
          assert(hexes[i].length > hexesPruned[i].length); // pruned hex is shorter
        }
        
        // fetch invalid id
        txIds.push("invalid tx id");
        try {
          await daemon.getTxHexes(txIds);
          throw new Error("fail");
        } catch (e) {
          assert.equal("Invalid transaction id", e.message);
        }
      });
      
      it("Can get the coinbase transaction sum", async function() {
        let sum = await daemon.getCoinbaseTxSum(0, 50000);
        testCoinbaseTxSum(sum);
      });
      
      it("Can get a fee estimate", async function() {
        let fee = await daemon.getFeeEstimate();
        TestUtils.testUnsignedBigInteger(fee, true);
      });
      
      it("Can get all transactions in the transaction pool", async function() {
        
        // submit tx to pool but don't relay
        let tx = await getUnrelayedTx(wallet);
        await daemon.submitTxHex(tx.getFullHex(), true);
        
        // fetch txs in pool
        let txs = await daemon.getTxPool();
        
        // test txs
        assert(Array.isArray(txs));
        assert(txs.length > 0, "Test requires an unconfirmed tx in the tx pool");
        for (let tx of txs) {
          testTx(tx, { isPruned: false, isConfirmed: false, fromGetTxPool: true });
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
          await daemon.submitTxHex(tx.getFullHex(), true);
          
          // test stats
          stats = await daemon.getTxPoolStats();
          assert(stats.getNumTxs() > i);
          testTxPoolStats(stats);
        }
      });
      
      it("Can flush all transactions from the pool", async function() {
        
        // pool starts flushed for each test
        let txs = await daemon.getTxPool();
        assert.equal(txs.length, 0);
        
        // submit txs to the pool but don't relay
        for (let i = 0; i < 2; i++) {
          let tx = await getUnrelayedTx(wallet, i);
          await daemon.submitTxHex(tx.getFullHex(), true);
        }
        
        // txs are in pool
        txs = await daemon.getTxPool();
        assert(txs.length >= 2);
        
        // flush tx pool
        let resp = await daemon.flushTxPool();
        assert.equal(resp, undefined);
        txs = await daemon.getTxPool();
        assert(txs.length === 0);
      });
      
      it("Can flush a transaction from the pool by id", async function() {
        
        // submit txs to the pool but don't relay
        let txs = [];
        for (let i = 0; i < 3; i++) {
          let tx = await getUnrelayedTx(wallet, i);
          await daemon.submitTxHex(tx.getFullHex(), true);
          txs.push(tx);
        }
        
        // remove each tx from the pool by id and test
        for (let i = 0; i < txs.length; i++) {
          
          // flush tx from pool
          await daemon.flushTxPool(txs[i].getId());
          
          // test tx pool
          let poolTxs = await daemon.getTxPool();
          assert.equal(poolTxs.length, txs.length - i - 1);
        }
      });
      
      it("Can flush transactions from the pool by ids", async function() {
        
        // submit txs to the pool but don't relay
        let txIds = [];
        for (let i = 0; i < 3; i++) {
          let tx = await getUnrelayedTx(wallet, i);
          await daemon.submitTxHex(tx.getFullHex(), true);
          txIds.push(tx.getId());
        }
        
        // remove all txs by ids
        await daemon.flushTxPool(txIds);
        
        // test tx pool
        let txs = await daemon.getTxPool();
        assert.equal(txs.length, 0);
      });
      
      it("Can get the spent status of key images", async function() {
        
        // submit txs to the pool to collect key images then flush
        let txs = [];
        for (let i = 0; i < 3; i++) {
          let tx = await getUnrelayedTx(wallet, i);
          await daemon.submitTxHex(tx.getFullHex(), true);
          txs.push(tx);
        }
        let keyImages = [];
        let txIds = txs.map(tx => tx.getId());
        for (let tx of await daemon.getTxs(txIds)) {
          for (let vin of tx.getVins()) keyImages.push(vin.getKeyImage().getHex());
        }
        await daemon.flushTxPool(txIds);
        
        // key images are not spent
        await testSpentStatuses(keyImages, MoneroKeyImageSpentStatus.NOT_SPENT);
        
        // submit txs to the pool but don't relay
        for (let tx of txs) await daemon.submitTxHex(tx.getFullHex(), true);
        
        // key images are in the tx pool
        await testSpentStatuses(keyImages, MoneroKeyImageSpentStatus.TX_POOL);
        
        // collect key images of confirmed txs
        keyImages = [];
        txs = await getConfirmedTxs(daemon, 10);
        for (let tx of txs) {
          for (let vin of tx.getVins()) keyImages.push(vin.getKeyImage().getHex());
        }
        
        // key images are all spent
        await testSpentStatuses(keyImages, MoneroKeyImageSpentStatus.CONFIRMED);
        
        // helper function to check the spent status of a key image or array of key images
        async function testSpentStatuses(keyImages, expectedStatus) {
          
          // test image
          for (let keyImage of keyImages) {
            assert.equal(await daemon.getKeyImageSpentStatus(keyImage), expectedStatus);
          }
          
          // test array of images
          let statuses = await daemon.getKeyImageSpentStatuses(keyImages);
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
      
      it("Can get an output histogram (binary)", async function() {
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
      
      it("Can get general information", async function() {
        let info = await daemon.getInfo();
        testInfo(info);
      });
      
      it("Can get sync information", async function() {
        let syncInfo = await daemon.getSyncInfo();
        testSyncInfo(syncInfo);
      });
      
      it("Can get hard fork information", async function() {
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
        assert(peers.length > 0, "Daemon has no known peers to test");
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
        ban.setHost("192.168.1.56");
        ban.setIsBanned(true);
        ban.setSeconds(60);
        await daemon.setPeerBan(ban);
        
        // test ban
        let bans = await daemon.getPeerBans();
        let found = false;
        for (let aBan of bans) {
          testMoneroBan(aBan);
          if (aBan.getHost() === "192.168.1.56") found = true;
        }
        assert(found);
      });
      
      it("Can ban peers", async function() {
        
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
        
        // stop mining at beginning of test
        try { await daemon.stopMining(); }
        catch(e) { }
        
        // generate address to mine to
        let address = await wallet.getPrimaryAddress();
        
        // start mining
        await daemon.startMining(address, 2, false, true);
        
        // stop mining
        await daemon.stopMining();
      });
      
      it("Can get mining status", async function() {
        
        try {
          
          // stop mining at beginning of test
          try { await daemon.stopMining(); }
          catch(e) { }
          
          // test status without mining
          let status = await daemon.getMiningStatus();
          assert.equal(status.getIsActive(), false);
          assert.equal(status.getAddress(), undefined);
          assert.equal(status.getSpeed(), 0);
          assert.equal(status.getNumThreads(), 0);
          assert.equal(status.getIsBackground(), undefined);
          
          // test status with mining
          let address = await wallet.getPrimaryAddress();
          let threadCount = 3;
          let isBackground = false;
          await daemon.startMining(address, threadCount, isBackground, true);
          status = await daemon.getMiningStatus();
          assert.equal(status.getIsActive(), true);
          assert.equal(status.getAddress(), address);
          assert(status.getSpeed() >= 0);
          assert.equal(status.getNumThreads(), threadCount);
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
          await daemon.submitBlock(template.getBlockHashingBlob());
          fail("Should have thrown error");
        } catch (e) {
          assert.equal(e.getCode(), -7);
          assert.equal(e.getDescription(), "Block not accepted");
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
        if (result.getIsUpdateAvailable()) {
          try {
            result = await daemon.downloadUpdate("./ohhai/there");
            throw new Error("Should have thrown error");
          } catch(e) {
            assert.notEqual("Should have thrown error", e.message);
            assert.equal(e.statusCode, 500);  // TODO monero-daemon-rpc: this causes a 500 in daemon rpc
          }
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
        let result = await daemon.submitTxHex(tx1.getFullHex());
        assert.equal(result.getIsRelayed(), true);
        testSubmitTxResultGood(result);
        
        // tx1 is in the pool
        let txs = await daemon.getTxPool();
        let found = false;
        for (let aTx of txs) {
          if (aTx.getId() === tx1.getId()) {
            assert.equal(aTx.getIsRelayed(), true);
            found = true;
            break;
          }
        }
        assert(found, "Tx1 was not found after being submitted to the daemon's tx pool");
        
        // submit and relay tx2 hex which double spends tx1
        result = await daemon.submitTxHex(tx2.getFullHex());
        assert.equal(result.getIsRelayed(), true);
        testSubmitTxResultDoubleSpend(result);
        
        // tx2 is in not the pool
        txs = await daemon.getTxPool();
        found = false;
        for (let aTx of txs) {
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
          let result = await daemon.submitTxHex(tx.getFullHex(), true);
          assert.equal(result.getIsRelayed(), false);
          testSubmitTxResultGood(result);
          
          // ensure tx is in pool
          let poolTxs = await daemon.getTxPool();
          let found = false;
          for (let aTx of poolTxs) {
            if (aTx.getId() === tx.getId()) {
              assert.equal(aTx.getIsRelayed(), false);
              found = true;
              break;
            }
          }
          assert(found, "Tx was not found after being submitted to the daemon's tx pool");
          
          // fetch tx by id and ensure not relayed
          let fetchedTx = await daemon.getTx(tx.getId());
          assert.equal(fetchedTx.getIsRelayed(), false);
        }
        
        // relay the txs
        txIds.length === 1 ? await daemon.relayTxById(txIds[0]) : await daemon.relayTxsById(txIds);
        
        // ensure txs are relayed
        for (let tx of txs) {
          let poolTxs = await daemon.getTxPool();
          let found = false;
          for (let aTx of poolTxs) {
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
          let address = await wallet.getPrimaryAddress();
          try { await daemon.startMining(address, 8, false, true); }
          catch (e) { }
          
          // register a listener
          let listenerHeader;
          let listener = function(header) {
            listenerHeader = header;
            daemon.removeBlockListener(listener); // otherwise daemon will keep polling
          }
          daemon.addBlockListener(listener);
          
          // wait for next block notification
          let header = await daemon.getNextBlockHeader();
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
  assert.equal(typeof header.getNonce(), "number");
  assert(header.getPowHash() === undefined);  // never seen defined
  assert(!isFull ? undefined === header.getSize() : header.getSize());
  assert(!isFull ? undefined === header.getDepth() : header.getDepth() >= 0);
  assert(!isFull ? undefined === header.getDifficulty() : header.getDifficulty().toJSValue() > 0);
  assert(!isFull ? undefined === header.getCumulativeDifficulty() : header.getCumulativeDifficulty().toJSValue() > 0);
  assert(!isFull ? undefined === header.getId() : header.getId());
  assert(!isFull ? undefined === header.getNumTxs() : header.getNumTxs() >= 0);
  assert(!isFull ? undefined === header.getOrphanStatus() : typeof header.getOrphanStatus() === "boolean");
  assert(!isFull ? undefined === header.getReward() : header.getReward());
  assert(!isFull ? undefined === header.getWeight() : header.getWeight());
}

// TODO: test block deep copy
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
  testBlockHeader(block, config.headerIsFull);
  
  if (config.hasHex) {
    assert(block.getHex());
    assert(block.getHex().length > 1);
  } else {
    assert(block.getHex() === undefined)
  }
  
  if (config.hasTxs) {
    assert(typeof config.txConfig === "object");
    assert(block.getTxs() instanceof Array);
    for (let tx of block.getTxs()) {
      assert(block === tx.getBlock());
      testTx(tx, config.txConfig);
    }
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
//    fromGetTxPool: false,
//  })
}

// TODO: how to test output indices? comes back with /get_transactions, maybe others
function testTx(tx, config) {
  
  // check inputs
  assert(tx);
  assert.equal(typeof config, "object");
  assert.equal(typeof config.isPruned, "boolean");
  assert.equal(typeof config.isConfirmed, "boolean");
  assert.equal(typeof config.fromGetTxPool, "boolean");
  
  // standard across all txs
  assert(tx.getId().length === 64);
  if (tx.getIsRelayed() === undefined) assert(tx.getInTxPool());  // TODO monero-daemon-rpc: add relayed to get_transactions
  else assert.equal(typeof tx.getIsRelayed(), "boolean");
  assert.equal(typeof tx.getIsConfirmed(), "boolean");
  assert.equal(typeof tx.getInTxPool(), "boolean");
  assert.equal(typeof tx.getIsCoinbase(), "boolean");
  assert.equal(tx.getPrunableHex(), undefined); // TODO: way to test?
  assert.equal(typeof tx.getIsDoubleSpend(), "boolean");
  
  // test presence of output indices
  // TODO: change this over to vouts only
  if (tx.getIsCoinbase()) assert.equal(tx.getOutputIndices(), undefined); // TODO: how to get output indices for coinbase transactions?
  if (tx.getInTxPool() || config.fromGetTxPool || config.hasOutputIndices === false) assert.equal(tx.getOutputIndices(), undefined);
  else assert(tx.getOutputIndices().length > 0);
  
  // test confirmed config
  if (config.isConfirmed === true) assert.equal(tx.getIsConfirmed(), true);
  if (config.isConfirmed === false) assert.equal(tx.getIsConfirmed(), false);
  
  // test confirmed
  if (tx.getIsConfirmed()) {
    assert(tx.getBlock());
    assert(tx.getBlock().getTxs().includes(tx));
    assert(tx.getBlock().getHeight() > 0);
    assert(tx.getBlock().getTimestamp() > 0);
    assert.equal(tx.getIsRelayed(), true);
    assert.equal(tx.getIsFailed(), false);
    assert.equal(tx.getInTxPool(), false);
    assert.equal(tx.getDoNotRelay(), false);
    assert.equal(tx.getIsDoubleSpend(), false);
    assert.equal(tx.getNumConfirmations(), undefined); // client must compute
  } else {
    assert.equal(tx.getBlock(), undefined);
    assert.equal(tx.getNumConfirmations(), 0);
  }
  
  // test in tx pool
  if (tx.getInTxPool()) {
    assert.equal(tx.getIsConfirmed(), false);
    assert.equal(tx.getIsDoubleSpend(), false);
    assert.equal(tx.getLastFailedHeight(), undefined);
    assert.equal(tx.getLastFailedId(), undefined);
    assert(tx.getReceivedTimestamp() > 0);
    assert(tx.getSize() > 0);
    assert(tx.getWeight() > 0);
    assert.equal(typeof tx.getIsKeptByBlock(), "boolean");
    assert.equal(tx.getLastFailedHeight(), undefined);
    assert.equal(tx.getLastFailedId(), undefined);
    assert(tx.getMaxUsedBlockHeight() >= 0);
    assert(tx.getMaxUsedBlockId());
    if (tx.getIsRelayed()) assert(tx.getNumEstimatedBlocksUntilConfirmed() > 0);
    else assert.equal(tx.getNumEstimatedBlocksUntilConfirmed(), undefined);
  } else {
    assert.equal(tx.getNumEstimatedBlocksUntilConfirmed(), undefined);
    assert.equal(tx.getLastRelayedTimestamp(), undefined);
  }
  
  // test coinbase tx
  if (tx.getIsCoinbase()) {
    assert.equal(tx.getFee().compare(new BigInteger(0)), 0);
    assert(tx.getIncomingTransfers().length > 0); // TODO: MoneroTx does not have getIncomingTransfers() but this doesn't fail?
    assert.equal(tx.getVins(), undefined);
    assert.equal(tx.getSignatures(), undefined);
  } else {
    if (tx.getSignatures() !== undefined) assert(tx.getSignatures().length > 0)
  }
  
  // test failed  // TODO: what else to test associated with failed
  if (tx.getIsFailed()) {
    assert(tx.getOutgoingTransfer() instanceof MoneroTransfer); // TODO: MoneroTx does not have getOutgoingTransfer() but this doesn't fail?
    assert(tx.getReceivedTimestamp() > 0)
  } else {
    if (tx.getIsRelayed() === undefined) assert.equal(tx.getDoNotRelay(), undefined); // TODO monero-daemon-rpc: add relayed to get_transactions
    else if (tx.getIsRelayed()) assert.equal(tx.getIsDoubleSpend(), false);
    else {
      assert.equal(tx.getIsRelayed(), false);
      assert.equal(tx.getDoNotRelay(), true);
      assert.equal(typeof tx.getIsDoubleSpend(), "boolean");
    }
  }
  assert.equal(tx.getLastFailedHeight(), undefined);
  assert.equal(tx.getLastFailedId(), undefined);
  
  // received time only for tx pool or failed txs
  if (tx.getReceivedTimestamp() !== undefined) {
    assert(tx.getInTxPool() || tx.getIsFailed());
  }
  
  // test relayed tx
  if (tx.getIsRelayed()) assert.equal(tx.getDoNotRelay(), false);
  if (tx.getDoNotRelay()) {
    assert(!tx.getIsRelayed());
    assert(!tx.getIsConfirmed());
  }
  
  // test pruned vs not pruned
  if (config.fromGetTxPool || config.fromGetBlocksByHeight) assert.equal(tx.getPrunableHash(), undefined);   // TODO monero-daemon-rpc: tx pool txs do not have prunable hash, TODO: getBlocksByHeight() has inconsistent client-side pruning
  else assert(tx.getPrunableHash());
  if (config.isPruned) {
    assert.equal(tx.getRctSigPrunable(), undefined);
    assert.equal(tx.getSize(), undefined);
    assert.equal(tx.getLastRelayedTimestamp(), undefined);
    assert.equal(tx.getReceivedTimestamp(), undefined);
    assert.equal(tx.getVersion(), undefined);
    assert.equal(tx.getUnlockTime(), undefined);
    assert.equal(tx.getVins(), undefined);
    assert.equal(tx.getVouts(), undefined);
    assert.equal(tx.getExtra(), undefined);
    assert.equal(tx.getFullHex(), undefined);
    assert(tx.getPrunedHex());
  } else {
    assert.equal(tx.getPrunedHex(), undefined);
    assert(tx.getVersion() >= 0);
    assert(tx.getUnlockTime() >= 0);
    assert(Array.isArray(tx.getExtra()) && tx.getExtra().length > 0);
    if (config.fromGetBlocksByHeight) assert.equal(tx.getFullHex(), undefined);         // TODO: getBlocksByHeight() has inconsistent client-side pruning
    else assert(tx.getFullHex().length > 0);
    if (config.fromGetBlocksByHeight) assert.equal(tx.getRctSigPrunable(), undefined);  // TODO: getBlocksByHeight() has inconsistent client-side pruning
    //else assert.equal(typeof tx.getRctSigPrunable().nbp, "number");
    assert.equal(tx.getIsDoubleSpend(), false);
    if (tx.getIsConfirmed()) {
      assert.equal(tx.getLastRelayedTimestamp(), undefined);
      assert.equal(tx.getReceivedTimestamp(), undefined);
    } else {
      if (tx.getIsRelayed()) assert(tx.getLastRelayedTimestamp() > 0);
      else assert.equal(tx.getLastRelayedTimestamp(), undefined);
      assert(tx.getReceivedTimestamp() > 0);
    }
    
    // test vins and vouts
    assert(tx.getVins() && Array.isArray(tx.getVins()) && tx.getVins().length >= 0);
    assert(tx.getVouts() && Array.isArray(tx.getVouts()) && tx.getVouts().length >= 0);
    if (!tx.getIsCoinbase()) assert(tx.getVins().length > 0);
    for (let vin of tx.getVins()) {
      assert(tx === vin.getTx());
      testVin(vin, config);
    }
    assert(tx.getVouts().length > 0);
    for (let vout of tx.getVouts()) {
      assert(tx === vout.getTx());
      testVout(vout, config);
    }
  }
  
  if (tx.getIsFailed()) {
    // TODO: implement this
  }
  
  // test deep copy
  if (!config.doNotTestCopy) testTxCopy(tx, config);
}

function testBlockTemplate(template) {
  assert(template);
  assert(template.getBlockTemplateBlob());
  assert(template.getBlockHashingBlob());
  assert(template.getDifficulty());
  assert(template.getDifficulty() instanceof BigInteger);
  assert(template.getExpectedReward());
  assert(template.getHeight());
  assert(template.getPrevId());
  assert(template.getReservedOffset());
}

function testInfo(info) {
  assert(info.getVersion());
  assert(info.getNumAltBlocks() >= 0);
  assert(info.getBlockSizeLimit());
  assert(info.getBlockSizeMedian());
  assert(info.getBootstrapDaemonAddress() === undefined || (typeof info.getBootstrapDaemonAddress() === "string" && info.getBootstrapDaemonAddress().length > 0));
  assert(info.getCumulativeDifficulty());
  assert(info.getCumulativeDifficulty() instanceof BigInteger)
  assert(info.getFreeSpace());
  assert(info.getNumOfflinePeers() >= 0);
  assert(info.getNumOnlinePeers() >= 0);
  assert(info.getHeight() >= 0);
  assert(info.getHeightWithoutBootstrap());
  assert(info.getNumIncomingConnections() >= 0);
  assert(info.getNetworkType());
  assert(typeof info.getIsOffline() === "boolean");
  assert(info.getNumOutgoingConnections() >= 0);
  assert(info.getNumRpcConnections() >= 0);
  assert(info.getStartTimestamp());
  assert(info.getTarget());
  assert(info.getTargetHeight() >= 0);
  assert(info.getTopBlockId());
  assert(info.getNumTxs() >= 0);
  assert(info.getNumTxsPool() >= 0);
  assert(typeof info.getWasBootstrapEverUsed() === "boolean");
  assert(info.getBlockWeightLimit());
  assert(info.getBlockWeightMedian());
  assert(info.getDatabaseSize() > 0);
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
  assert.notEqual(hardForkInfo.getNumVotes(), undefined);
  assert.notEqual(hardForkInfo.getVoting(), undefined);
  assert.notEqual(hardForkInfo.getWindow(), undefined);
}

function testMoneroBan(ban) {
  assert.notEqual(ban.getHost(), undefined);
  assert.notEqual(ban.getIp(), undefined);
  assert.notEqual(ban.getSeconds(), undefined);
}

function testCoinbaseTxSum(txSum) {
  TestUtils.testUnsignedBigInteger(txSum.getEmissionSum(), true);
  TestUtils.testUnsignedBigInteger(txSum.getFeeSum(), true);
}

function testOutputHistogramEntry(entry) {
  TestUtils.testUnsignedBigInteger(entry.getAmount());
  assert(entry.getNumInstances() >= 0);
  assert(entry.getNumUnlockedInstances() >= 0);
  assert(entry.getNumRecentInstances() >= 0);
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
  assert(stats.getNumTxs() >= 0);
  if (stats.getNumTxs() > 0) {
    if (stats.getNumTxs() === 1) assert.equal(stats.getHisto(), undefined);
    else {
      assert(stats.getHisto());
      console.log(stats.getHisto());
      throw new Error("Ready to test histogram");
    }
    assert(stats.getBytesMax() > 0);
    assert(stats.getBytesMed() > 0);
    assert(stats.getBytesMin() > 0);
    assert(stats.getBytesTotal() > 0);
    assert(stats.getHisto98pc() === undefined || stats.getHisto98pc() > 0);
    assert(stats.getOldestTimestamp() > 0);
    assert(stats.getNum10m() >= 0);
    assert(stats.getNumDoubleSpends() >= 0);
    assert(stats.getNumFailing() >= 0);
    assert(stats.getNumNotRelayed() >= 0);
  } else {
    assert.equal(stats.getBytesMax(), undefined);
    assert.equal(stats.getBytesMed(), undefined);
    assert.equal(stats.getBytesMin(), undefined);
    assert.equal(stats.getBytesTotal(), 0);
    assert.equal(stats.getHisto98pc(), undefined);
    assert.equal(stats.getOldestTimestamp(), undefined);
    assert.equal(stats.getNum10m(), 0);
    assert.equal(stats.getNumDoubleSpends(), 0);
    assert.equal(stats.getNumFailing(), 0);
    assert.equal(stats.getNumNotRelayed(), 0);
    assert.equal(stats.getHisto(), undefined);
  }
}

async function getUnrelayedTx(wallet, accountIdx) {
  let sendConfig = new MoneroSendConfig(await wallet.getPrimaryAddress(), TestUtils.MAX_FEE); 
  sendConfig.setDoNotRelay(true);
  sendConfig.setAccountIndex(accountIdx);
  let tx = await wallet.send(sendConfig);
  assert(tx.getFullHex());
  assert.equal(tx.getDoNotRelay(), true);
  return tx;
}

function testVin(vin, config) {
  testOutput(vin);
  testKeyImage(vin.getKeyImage(), config);
  assert(vin.getRingOutputIndices() && Array.isArray(vin.getRingOutputIndices()) && vin.getRingOutputIndices().length > 0);
  for (let index of vin.getRingOutputIndices()) {
    assert.equal(typeof index, "number")
    assert(index >= 0);
  }
}

function testKeyImage(image, config) {
  assert(image instanceof MoneroKeyImage);
  assert(image.getHex());
  if (image.getSignature() !== undefined) {
    assert.equal(typeof image.getSignature(), "string");
    assert(image.getSignature().length > 0);
  }
}

function testVout(vout, config) {
  testOutput(vout);
  if (vout.getTx().getInTxPool() || config && config.fromGetTxPool || config.hasOutputIndices === false) assert.equal(vout.getIndex(), undefined); // TODO: get_blocks_by_height.bin (#5127), get_transaction_pool, and tx pool txs do not return output indices 
  else assert(vout.getIndex() >= 0);
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
  assert(connection.getNumReceives() >= 0);
  assert(connection.getReceiveIdleTime() >= 0);
  assert(connection.getNumSends() >= 0);
  assert(connection.getSendIdleTime() >= 0);
  assert(connection.getState());
  assert(connection.getNumSupportFlags() >= 0); 
}

function testKnownPeer(peer, fromConnection) {
  assert(peer instanceof MoneroDaemonPeer);
  assert.equal(typeof peer.getId(), "string");
  assert.equal(typeof peer.getHost(), "string");
  assert(typeof peer.getPort() === "number");
  assert(peer.getPort() > 0);
  assert(typeof peer.getRpcPort() === "number");
  assert(peer.getRpcPort() >= 0);
  assert.equal(typeof peer.getIsOnline(), "boolean");
  if (fromConnection) assert.equal(undefined, peer.getLastSeenTimestamp());
  else assert(peer.getLastSeenTimestamp() > 0);
  assert.equal(peer.getPruningSeed(), 0);
}

function testUpdateCheckResult(result) {
  assert(result instanceof MoneroDaemonUpdateCheckResult);
  assert.equal(typeof result.getIsUpdateAvailable(), "boolean");
  if (result.getIsUpdateAvailable()) {
    assert(result.getAutoUri(), "No auto uri; is daemon online?");
    assert(result.getUserUri());
    assert.equal(typeof result.getVersion(), "string");
    assert.equal(typeof result.getHash(), "string");
    assert.equal(result.getHash().length, 64);
  } else {
    assert.equal(result.getAutoUri(), undefined);
    assert.equal(result.getUserUri(), undefined);
    assert.equal(result.getVersion(), undefined);
    assert.equal(result.getHash(), undefined);
  }
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

async function getConfirmedTxIds(daemon) {
  
  // get valid height range
  let height = await daemon.getHeight();
  let numBlocks = 200;
  let numBlocksAgo = 200;
  assert(numBlocks > 0);
  assert(numBlocksAgo >= numBlocks);
  assert(height - numBlocksAgo + numBlocks - 1 < height);
  let startHeight = height - numBlocksAgo;
  let endHeight = height - numBlocksAgo + numBlocks - 1;
  
  // get blocks
  let blocks = await daemon.getBlocksByRange(startHeight, endHeight);
  
  // collect tx ids
  let txIds = blocks.map(block => block.getTxIds()).reduce((a, b) => { a.push.apply(a, b); return a; });
  assert(txIds.length > 0, "No transactions found in the range [" + startHeight + ", " + endHeight + "]");  // TODO: this fails if no txs in last 100 blocks
  return txIds;
}

function testTxCopy(tx, config) {
  
  // copy tx and test
  let copy = tx.copy();
  assert(copy instanceof MoneroTx);
  assert.equal(copy.getBlock(), undefined);
  if (tx.getBlock()) copy.setBlock(tx.getBlock().copy().setTxs([copy]));  // copy block for testing equality
  assert.equal(copy.toString(), tx.toString());
  
  // test different vin references
  if (copy.getVins() === undefined) assert.equal(tx.getVins(), undefined);
  else {
    assert(copy.getVins() !== tx.getVins());
    for (let i = 0; i < copy.getVins().length; i++) {
      assert.equal(0, tx.getVins()[i].getAmount().compare(copy.getVins()[i].getAmount()));
    }
  }
  
  // test different vout references
  if (copy.getVouts() === undefined) assert.equal(tx.getVouts(), undefined);
  else {
    assert(copy.getVouts() !== tx.getVouts());
    for (let i = 0; i < copy.getVouts().length; i++) {
      assert.equal(0, tx.getVouts()[i].getAmount().compare(copy.getVouts()[i].getAmount()));
    }
  }
  
  // test copied tx
  config = Object.assign({}, config);
  config.doNotTestCopy = true;
  if (tx.getBlock()) copy.setBlock(tx.getBlock().copy().setTxs([copy])); // copy block for testing
  testTx(copy, config);
  
  // test merging with copy
  let merged = copy.merge(copy.copy());
  assert.equal(merged.toString(), tx.toString());
}

module.exports = TestMoneroDaemonRpc;