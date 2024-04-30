import assert from "assert";
import TestUtils from "./utils/TestUtils";
import {connectToDaemonRpc,
        GenUtils,
        MoneroDaemonInfo,
        MoneroNetworkType,
        MoneroTxWallet,
        MoneroTx,
        MoneroKeyImageSpentStatus,
        MoneroWallet,
        MoneroDaemon,
        MoneroPeer,
        MoneroDaemonUpdateCheckResult,
        MoneroBan,
        MoneroDaemonListener,
        MoneroDaemonSyncInfo,
        MoneroTxConfig,
        MoneroKeyImage,
        MoneroOutput,
        MoneroAltChain,
        MoneroSubmitTxResult,
        MoneroTxPoolStats,
        MoneroBlockTemplate} from "../../index";

// context for testing binary blocks
// TODO: binary blocks have inconsistent client-side pruning
// TODO: get_blocks_by_height.bin does not return output indices (#5127)
const BINARY_BLOCK_CTX = { hasHex: false, headerIsFull: false, hasTxs: true, ctx: { isPruned: false, isConfirmed: true, fromGetTxPool: false, hasOutputIndices: false, fromBinaryBlock: true } };

/**
 * Tests a Monero daemon.
 */
export default class TestMoneroDaemonRpc {

  // static variables
  static readonly MAX_REQ_SIZE = "3000000";
  static readonly DEFAULT_ID = "0000000000000000000000000000000000000000000000000000000000000000"; // uninitialized tx or block hash from daemon rpc
  static readonly NUM_HEADERS_PER_REQ = 750; // number of headers to fetch and cache per request

  // state variables
  testConfig: any;
  wallet: MoneroWallet;
  daemon: MoneroDaemon;
  
  constructor(testConfig) {
    this.testConfig = testConfig;
    TestUtils.WALLET_TX_TRACKER.reset(); // all wallets need to wait for txs to confirm to reliably sync
  }
  
  /**
   * Run all tests.
   */
  runTests() {
    let that = this;
    let testConfig = this.testConfig;
    describe("TEST MONERO DAEMON RPC", function() {
      
      // initialize wallet before all tests
      before(async function() {
        try {
          that.wallet = await TestUtils.getWalletRpc();
          that.daemon = await TestUtils.getDaemonRpc();
          TestUtils.WALLET_TX_TRACKER.reset(); // all wallets need to wait for txs to confirm to reliably sync
        } catch (e) {
          console.error("Error before tests: ");
          console.error(e);
          throw e;
        }
      });
      
      // -------------------------- TEST NON RELAYS ---------------------------
      
      if (testConfig.testNonRelays && !GenUtils.isBrowser())
      it("Can start and stop a daemon process", async function() {
        let cmd: string[];
        if (TestUtils.useDocker) {
          const cwd = process.cwd();
          cmd = ["docker-compose", "run", "--rm", "-p", '127.0.0.1:58081:58081', '-v', `${cwd}:/home/monero`, "monerod", "monerod",
            "--rpc-bind-ip", "0.0.0.0",
            "--confirm-external-bind",
          ];
        } else {
          cmd = [TestUtils.WALLET_RPC_LOCAL_PATH];
        }
        // create command to start monerod process
        cmd.push(
            "--" + GenUtils.getEnumKeyByValue(MoneroNetworkType, TestUtils.NETWORK_TYPE)!.toLowerCase(),
            "--no-igd",
            "--hide-my-port",
            "--data-dir", TestUtils.MONERO_BINS_DIR + "/node1",
            "--p2p-bind-port", "58080",
            "--rpc-bind-port", "58081",
            "--rpc-login", "superuser:abctesting123",
            "--zmq-rpc-bind-port", "58082",
        );
        // start monerod process from command
        let daemon = await connectToDaemonRpc(cmd);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        // query daemon
        let connection = await daemon.getRpcConnection();
        assert(["http://127.0.0.1:58081", "http://0.0.0.0:58081"].includes(connection.getUri()));
        assert.equal("superuser", connection.getUsername());
        assert.equal("abctesting123", connection.getPassword());
        assert(await daemon.getHeight() > 0);
        let info = await daemon.getInfo();
        testInfo(info);
        
        // stop daemon
        await daemon.stopProcess(TestUtils.useDocker);
      });
      
      if (testConfig.testNonRelays)
      it("Can get the daemon's version", async function() {
        let version = await that.daemon.getVersion();
        assert(version.getNumber() > 0);
        assert.equal(typeof version.getIsRelease(), "boolean");
      });
      
      if (testConfig.testNonRelays)
      it("Can indicate if it's trusted", async function() {
        let isTrusted = await that.daemon.isTrusted();
        assert.equal(typeof isTrusted, "boolean");
      });

      if (testConfig.testNonRelays)
      it("Can get the blockchain height", async function() {
        let height = await that.daemon.getHeight();
        assert(height, "Height must be initialized");
        assert(height > 0, "Height must be greater than 0");
      });

      if (testConfig.testNonRelays)
      it("Can get a block hash by height", async function() {
        let lastHeader = await that.daemon.getLastBlockHeader();
        let hash = await that.daemon.getBlockHash(lastHeader.getHeight());
        assert(hash);
        assert.equal(hash.length, 64);
      });
      
      if (testConfig.testNonRelays)
      it("Can get a block template", async function() {
        let template = await that.daemon.getBlockTemplate(TestUtils.ADDRESS, 2);
        testBlockTemplate(template);
      });

      if (testConfig.testNonRelays)
      it("Can get the last block's header", async function() {
        let lastHeader = await that.daemon.getLastBlockHeader();
        testBlockHeader(lastHeader, true);
      });
      
      if (testConfig.testNonRelays)
      it("Can get a block header by hash", async function() {
        
        // retrieve by hash of last block
        let lastHeader = await that.daemon.getLastBlockHeader();
        let hash = await that.daemon.getBlockHash(lastHeader.getHeight());
        let header = await that.daemon.getBlockHeaderByHash(hash);
        testBlockHeader(header, true);
        assert.deepEqual(header, lastHeader);
        
        // retrieve by hash of previous to last block
        hash = await that.daemon.getBlockHash(lastHeader.getHeight() - 1);
        header = await that.daemon.getBlockHeaderByHash(hash);
        testBlockHeader(header, true);
        assert.equal(header.getHeight(), lastHeader.getHeight() - 1);
      });
      
      if (testConfig.testNonRelays)
      it("Can get a block header by height", async function() {
        
        // retrieve by height of last block
        let lastHeader = await that.daemon.getLastBlockHeader();
        let header = await that.daemon.getBlockHeaderByHeight(lastHeader.getHeight());
        testBlockHeader(header, true);
        assert.deepEqual(header, lastHeader);
        
        // retrieve by height of previous to last block
        header = await that.daemon.getBlockHeaderByHeight(lastHeader.getHeight() - 1);
        testBlockHeader(header, true);
        assert.equal(header.getHeight(), lastHeader.getHeight() - 1);
      });
      
      // TODO: test start with no end, vice versa, inclusivity
      if (testConfig.testNonRelays)
      it("Can get block headers by range", async function() {
        
        // determine start and end height based on number of blocks and how many blocks ago
        let numBlocks = 100;
        let numBlocksAgo = 100;
        let currentHeight = await that.daemon.getHeight();
        let startHeight = currentHeight - numBlocksAgo;
        let endHeight = currentHeight - (numBlocksAgo - numBlocks) - 1;
        
        // fetch headers
        let headers = await that.daemon.getBlockHeadersByRange(startHeight, endHeight);
        
        // test headers
        assert.equal(headers.length, numBlocks);
        for (let i = 0; i < numBlocks; i++) {
          let header = headers[i];
          assert.equal(header.getHeight(), startHeight + i);
          testBlockHeader(header, true);
        }
      });
      
      if (testConfig.testNonRelays)
      it("Can get a block by hash", async function() {
        
        // context for testing blocks
        let testBlockCtx = { hasHex: true, headerIsFull: true, hasTxs: false };
        
        // retrieve by hash of last block
        let lastHeader = await that.daemon.getLastBlockHeader();
        let hash = await that.daemon.getBlockHash(lastHeader.getHeight());
        let block = await that.daemon.getBlockByHash(hash);
        testBlock(block, testBlockCtx);
        assert.deepEqual(block, await that.daemon.getBlockByHeight(block.getHeight()));
        assert(block.getTxs() === undefined);
        
        // retrieve by hash of previous to last block
        hash = await that.daemon.getBlockHash(lastHeader.getHeight() - 1);
        block = await that.daemon.getBlockByHash(hash);
        testBlock(block, testBlockCtx);
        assert.deepEqual(block, await that.daemon.getBlockByHeight(lastHeader.getHeight() - 1));
        assert(block.getTxs() === undefined);
      });
      
      if (testConfig.testNonRelays)
      it.skip("Can get blocks by hash which includes transactions (binary)", async function() {
        throw new Error("Not implemented");
      })
      
      if (testConfig.testNonRelays)
      it("Can get a block by height", async function() {
        
        // context for testing blocks
        let testBlockCtx = { hasHex: true, headerIsFull: true, hasTxs: false };
        
        // retrieve by height of last block
        let lastHeader = await that.daemon.getLastBlockHeader();
        let block = await that.daemon.getBlockByHeight(lastHeader.getHeight());
        testBlock(block, testBlockCtx);
        assert.deepEqual(block, await that.daemon.getBlockByHeight(block.getHeight()));
        
        // retrieve by height of previous to last block
        block = await that.daemon.getBlockByHeight(lastHeader.getHeight() - 1);
        testBlock(block, testBlockCtx);
        assert.deepEqual(block.getHeight(), lastHeader.getHeight() - 1);
      });

      if (testConfig.testNonRelays)
      it("Can get blocks by height which includes transactions (binary)", async function() {
        
        // set number of blocks to test
        const numBlocks = 200;
        
        // select random heights  // TODO: this is horribly inefficient way of computing last 100 blocks if not shuffling
        let currentHeight = await that.daemon.getHeight();
        let allHeights: number[] = [];
        for (let i = 0; i < currentHeight - 1; i++) allHeights.push(i);
        //GenUtils.shuffle(allHeights);
        let heights: number[] = [];
        for (let i = allHeights.length - numBlocks; i < allHeights.length; i++) heights.push(allHeights[i]);
        
        //heights.push(allHeights[i]);
        
        // fetch blocks
        let blocks = await that.daemon.getBlocksByHeight(heights);
        
        // test blocks
        let txFound = false;
        assert.equal(blocks.length, numBlocks);
        for (let i = 0; i < heights.length; i++) {
          let block = blocks[i];
          if (block.getTxs().length) txFound = true;
          testBlock(block, BINARY_BLOCK_CTX);
          assert.equal(block.getHeight(), heights[i]);      
        }
        assert(txFound, "No transactions found to test");
      });
      
      if (testConfig.testNonRelays)
      it("Can get blocks by range in a single request", async function() {
        
        // get height range
        let numBlocks = 100;
        let numBlocksAgo = 190;
        assert(numBlocks > 0);
        assert(numBlocksAgo >= numBlocks);
        let height = await that.daemon.getHeight();
        assert(height - numBlocksAgo + numBlocks - 1 < height);
        let startHeight = height - numBlocksAgo;
        let endHeight = height - numBlocksAgo + numBlocks - 1;
        
        // test known start and end heights
        await testGetBlocksRange(startHeight, endHeight, height, false);
        
        // test unspecified start
        await testGetBlocksRange(undefined, numBlocks - 1, height, false);
        
        // test unspecified end
        await testGetBlocksRange(height - numBlocks - 1, undefined, height, false);
      });
      
      // Can get blocks by range using chunked requests
      if (testConfig.testNonRelays)
      it("Can get blocks by range using chunked requests", async function() {
        
        // get long height range
        let numBlocks = Math.min(await that.daemon.getHeight() - 2, 1440); // test up to ~2 days of blocks
        assert(numBlocks > 0);
        let height = await that.daemon.getHeight();
        assert(height - numBlocks - 1 < height);
        let startHeight = height - numBlocks;
        let endHeight = height - 1;
        
        // test known start and end heights
        await testGetBlocksRange(startHeight, endHeight, height, true);
        
        // test unspecified start
        await testGetBlocksRange(undefined, numBlocks - 1, height, true);
        
        // test unspecified end
        await testGetBlocksRange(endHeight - numBlocks - 1, undefined, height, true);
      });
      
      async function testGetBlocksRange(startHeight, endHeight, chainHeight, chunked) {
        
        // fetch blocks by range
        let realStartHeight = startHeight === undefined ? 0 : startHeight;
        let realEndHeight = endHeight === undefined ? chainHeight - 1 : endHeight;
        let blocks = chunked ? await that.daemon.getBlocksByRangeChunked(startHeight, endHeight) : await that.daemon.getBlocksByRange(startHeight, endHeight);
        assert.equal(blocks.length, realEndHeight - realStartHeight + 1);
        
        // test each block
        for (let i = 0; i < blocks.length; i++) {
          assert.equal(blocks[i].getHeight(), realStartHeight + i);
          testBlock(blocks[i], BINARY_BLOCK_CTX);
        }
      }
      
      if (testConfig.testNonRelays)
      it.skip("Can get block hashes (binary)", async function() {
        //get_hashes.bin
        throw new Error("Not implemented");
      });
      
      if (testConfig.testNonRelays)
      it("Can get a transaction by hash with and without pruning", async function() {
        
        // fetch transaction hashes to test
        let txHashes = await getConfirmedTxHashes(that.daemon);
        
        // fetch each tx by hash without pruning
        for (let txHash of txHashes) {
          let tx = await that.daemon.getTx(txHash);
          testTx(tx, {isPruned: false, isConfirmed: true, fromGetTxPool: false});
        }
        
        // fetch each tx by hash with pruning
        for (let txHash of txHashes) {
          let tx = await that.daemon.getTx(txHash, true);
          testTx(tx, {isPruned: true, isConfirmed: true, fromGetTxPool: false});
        }
        
        // fetch invalid hash
        try {
          await that.daemon.getTx("invalid tx hash");
          throw new Error("fail");
        } catch (e: any) {
          assert.equal("Invalid transaction hash", e.message);
        }
      });
      
      if (testConfig.testNonRelays)
      it ("Can get transactions by hashes with and without pruning", async function() {
        
        // fetch transaction hashes to test
        let txHashes = await getConfirmedTxHashes(that.daemon);
        assert(txHashes.length > 0);
        
        // fetch txs by hash without pruning
        let txs = await that.daemon.getTxs(txHashes);
        assert.equal(txs.length, txHashes.length);
        for (let tx of txs) {
          testTx(tx, {isPruned: false, isConfirmed: true, fromGetTxPool: false});
        }
        
        // fetch txs by hash with pruning
        txs = await that.daemon.getTxs(txHashes, true);
        assert.equal(txs.length, txHashes.length);
        for (let tx of txs) {
          testTx(tx, {isPruned: true, isConfirmed: true, fromGetTxPool: false});
        }
        
        // fetch missing hash
        let tx = await that.wallet.createTx({accountIndex: 0, address: await that.wallet.getPrimaryAddress(), amount: TestUtils.MAX_FEE});
        assert.equal(undefined, await that.daemon.getTx(tx.getHash()));
        txHashes.push(tx.getHash());
        let numTxs = txs.length;
        txs = await that.daemon.getTxs(txHashes);
        assert.equal(numTxs, txs.length);
        
        // fetch invalid hash
        txHashes.push("invalid tx hash");
        try {
          await that.daemon.getTxs(txHashes);
          throw new Error("fail");
        } catch (e: any) {
          assert.equal("Invalid transaction hash", e.message);
        }
      });
      
      if (testConfig.testNonRelays)
      it("Can get transactions by hashes that are in the transaction pool", async function() {
        await TestUtils.WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet); // wait for wallet's txs in the pool to clear to ensure reliable sync
        
        // submit txs to the pool but don't relay
        let txHashes: string[] = [];
        for (let i = 1; i < 3; i++) {
          let tx = await getUnrelayedTx(that.wallet, i);
          let result = await that.daemon.submitTxHex(tx.getFullHex(), true);
          testSubmitTxResultGood(result);
          assert.equal(result.getIsRelayed(), false);
          txHashes.push(tx.getHash());
        }
        
        // fetch txs by hash
        let txs = await that.daemon.getTxs(txHashes);
        
        // test fetched txs
        assert.equal(txs.length, txHashes.length);
        for (let tx of txs) {
          testTx(tx, {isConfirmed: false, fromGetTxPool: false, isPruned: false});
        }
        
        // clear txs from pool
        await that.daemon.flushTxPool(txHashes);
        await that.wallet.sync();
      });
      
      if (testConfig.testNonRelays)
      it("Can get a transaction hex by hash with and without pruning", async function() {
        
        // fetch transaction hashes to test
        let txHashes = await getConfirmedTxHashes(that.daemon);
        
        // fetch each tx hex by hash with and without pruning
        let hexes: string[] = []
        let hexesPruned: string[] = [];
        for (let txHash of txHashes) {
          hexes.push(await that.daemon.getTxHex(txHash));
          hexesPruned.push(await that.daemon.getTxHex(txHash, true));
        }
        
        // test results
        assert.equal(hexes.length, txHashes.length);
        assert.equal(hexesPruned.length, txHashes.length);
        for (let i = 0; i < hexes.length; i++) {
          assert.equal(typeof hexes[i], "string");
          assert.equal(typeof hexesPruned[i], "string");
          assert(hexesPruned[i].length > 0);
          assert(hexes[i].length > hexesPruned[i].length); // pruned hex is shorter
        }
        
        // fetch invalid hash
        try {
          await that.daemon.getTxHex("invalid tx hash");
          throw new Error("fail");
        } catch (e: any) {
          assert.equal("Invalid transaction hash", e.message);
        }
      });
      
      if (testConfig.testNonRelays)
      it("Can get transaction hexes by hashes with and without pruning", async function() {
        
        // fetch transaction hashes to test
        let txHashes = await getConfirmedTxHashes(that.daemon);
        
        // fetch tx hexes by hash with and without pruning
        let hexes = await that.daemon.getTxHexes(txHashes);
        let hexesPruned = await that.daemon.getTxHexes(txHashes, true);
        
        // test results
        assert.equal(hexes.length, txHashes.length);
        assert.equal(hexesPruned.length, txHashes.length);
        for (let i = 0; i < hexes.length; i++) {
          assert.equal(typeof hexes[i], "string");
          assert.equal(typeof hexesPruned[i], "string");
          assert(hexesPruned[i].length > 0);
          assert(hexes[i].length > hexesPruned[i].length); // pruned hex is shorter
        }
        
        // fetch invalid hash
        txHashes.push("invalid tx hash");
        try {
          await that.daemon.getTxHexes(txHashes);
          throw new Error("fail");
        } catch (e: any) {
          assert.equal("Invalid transaction hash", e.message);
        }
      });
      
      if (testConfig.testNonRelays)
      it("Can get the miner transaction sum", async function() {
        let sum = await that.daemon.getMinerTxSum(0, Math.min(50000, await that.daemon.getHeight()));
        testMinerTxSum(sum);
      });
      
      if (testConfig.testNonRelays)
      it("Can get a fee estimate", async function() {
        let feeEstimate = await that.daemon.getFeeEstimate();
        TestUtils.testUnsignedBigInt(feeEstimate.getFee(), true);
        // if there are only mined blocks lately, fees array is empty
        if (feeEstimate.getFees()?.length) {
          assert(feeEstimate.getFees().length === 4); // slow, normal, fast, fastest
          for (let i = 0; i < 4; i++) TestUtils.testUnsignedBigInt(feeEstimate.getFees()[i], true);
        }
        TestUtils.testUnsignedBigInt(feeEstimate.getQuantizationMask(), true);
      });
      
      if (testConfig.testNonRelays)
      it("Can get all transactions in the transaction pool", async function() {
        await TestUtils.WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);
        
        // submit tx to pool but don't relay
        let tx = await getUnrelayedTx(that.wallet, 0);
        let result = await that.daemon.submitTxHex(tx.getFullHex(), true);
        testSubmitTxResultGood(result);
        assert.equal(result.getIsRelayed(), false);
        
        // fetch txs in pool
        let txs = await that.daemon.getTxPool();
        
        // test txs
        assert(Array.isArray(txs));
        assert(txs.length > 0, "Test requires an unconfirmed tx in the tx pool");
        for (let tx of txs) {
          testTx(tx, { isPruned: false, isConfirmed: false, fromGetTxPool: true });
        }
        
        // flush the tx from the pool, gg
        await that.daemon.flushTxPool(tx.getHash());
        await that.wallet.sync();
      });
      
      if (testConfig.testNonRelays)
      it.skip("Can get hashes of transactions in the transaction pool (binary)", async function() {
        // TODO: get_transaction_pool_hashes.bin
        throw new Error("Not implemented");
      });
      
      if (testConfig.testNonRelays)
      it.skip("Can get the transaction pool backlog (binary)", async function() {
        // TODO: get_txpool_backlog
        throw new Error("Not implemented");
      });
      
      if (testConfig.testNonRelays)
      it("Can get transaction pool statistics", async function() {
        await TestUtils.WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);
        let err;
        let txIds = [];
        try {

          // submit txs to the pool but don't relay
          for (let i = 1; i < 3; i++) {
            
            // submit tx hex
            let tx = await getUnrelayedTx(that.wallet, i);
            let result = await that.daemon.submitTxHex(tx.getFullHex(), true);
            assert.equal(result.getIsGood(), true, "Bad tx submit result: " + result.toJson());
            
            // get tx pool stats
            let stats = await that.daemon.getTxPoolStats();
            assert(stats.getNumTxs() > i - 1);
            testTxPoolStats(stats);
          }
        } catch (e) {
          err = e;
        }

        // flush txs
        await that.daemon.flushTxPool(txIds);
        if (err) throw err;
      });
      
      if (testConfig.testNonRelays)
      it("Can flush all transactions from the pool", async function() {
        await TestUtils.WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);
        
        // preserve original transactions in the pool
        let txPoolBefore = await that.daemon.getTxPool();
        
        // submit txs to the pool but don't relay
        for (let i = 0; i < 2; i++) {
          let tx = await getUnrelayedTx(that.wallet, i);
          let result = await that.daemon.submitTxHex(tx.getFullHex(), true);
          testSubmitTxResultGood(result);
        }
        assert.equal((await that.daemon.getTxPool()).length, txPoolBefore.length + 2);
        
        // flush tx pool
        await that.daemon.flushTxPool();
        assert.equal((await that.daemon.getTxPool()).length, 0);
        
        // re-submit original transactions
        for (let tx of txPoolBefore) {
          let result = await that.daemon.submitTxHex(tx.getFullHex(), tx.getIsRelayed());
          testSubmitTxResultGood(result);
        }
        
        // pool is back to original state
        assert.equal((await that.daemon.getTxPool()).length, txPoolBefore.length);
        
        // sync wallet for next test
        await that.wallet.sync();
      });
      
      if (testConfig.testNonRelays)
      it("Can flush a transaction from the pool by hash", async function() {
        await TestUtils.WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);
        
        // preserve original transactions in the pool
        let txPoolBefore = await that.daemon.getTxPool();
        
        // submit txs to the pool but don't relay
        let txs: MoneroTx[] = [];
        for (let i = 1; i < 3; i++) {
          let tx = await getUnrelayedTx(that.wallet, i);
          let result = await that.daemon.submitTxHex(tx.getFullHex(), true);
          testSubmitTxResultGood(result);
          txs.push(tx);
        }

        // remove each tx from the pool by hash and test
        for (let i = 0; i < txs.length; i++) {
          
          // flush tx from pool
          await that.daemon.flushTxPool(txs[i].getHash());
          
          // test tx pool
          let poolTxs = await that.daemon.getTxPool();
          assert.equal(poolTxs.length, txs.length - i - 1);
        }
        
        // pool is back to original state
        assert.equal((await that.daemon.getTxPool()).length, txPoolBefore.length);
        
        // sync wallet for next test
        await that.wallet.sync();
      });
      
      if (testConfig.testNonRelays)
      it("Can flush transactions from the pool by hashes", async function() {
        await TestUtils.WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);
        
        // preserve original transactions in the pool
        let txPoolBefore = await that.daemon.getTxPool();
        
        // submit txs to the pool but don't relay
        let txHashes: string[] = [];
        for (let i = 1; i < 3; i++) {
          let tx = await getUnrelayedTx(that.wallet, i);
          let result = await that.daemon.submitTxHex(tx.getFullHex(), true);
          testSubmitTxResultGood(result);
          txHashes.push(tx.getHash());
        }
        assert.equal((await that.daemon.getTxPool()).length, txPoolBefore.length + txHashes.length);
        
        // remove all txs by hashes
        await that.daemon.flushTxPool(txHashes);
        
        // pool is back to original state
        assert.equal((await that.daemon.getTxPool()).length, txPoolBefore.length, "Tx pool size is different from start");
        await that.wallet.sync();
      });
      
      if (testConfig.testNonRelays)
      it("Can get the spent status of key images", async function() {
        await TestUtils.WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);
        
        // submit txs to the pool to collect key images then flush them
        let txs: MoneroTx[] = [];
        for (let i = 1; i < 3; i++) {
          let tx = await getUnrelayedTx(that.wallet, i);
          await that.daemon.submitTxHex(tx.getFullHex(), true);
          txs.push(tx);
        }
        let keyImages: string[] = [];
        let txHashes = txs.map(tx => tx.getHash());
        for (let tx of await that.daemon.getTxs(txHashes)) {
          for (let input of tx.getInputs()) keyImages.push(input.getKeyImage().getHex());
        }
        await that.daemon.flushTxPool(txHashes);
        
        // key images are not spent
        await testSpentStatuses(keyImages, MoneroKeyImageSpentStatus.NOT_SPENT);
        
        // submit txs to the pool but don't relay
        for (let tx of txs) await that.daemon.submitTxHex(tx.getFullHex(), true);
        
        // key images are in the tx pool
        await testSpentStatuses(keyImages, MoneroKeyImageSpentStatus.TX_POOL);
        
        // collect key images of confirmed txs
        keyImages = [];
        txs = await getConfirmedTxs(that.daemon, 10);
        for (let tx of txs) {
          for (let input of tx.getInputs()) keyImages.push(input.getKeyImage().getHex());
        }
        
        // key images are all spent
        await testSpentStatuses(keyImages, MoneroKeyImageSpentStatus.CONFIRMED);
        
        // flush this test's txs from pool
        await that.daemon.flushTxPool(txHashes);
        
        // helper function to check the spent status of a key image or array of key images
        async function testSpentStatuses(keyImages, expectedStatus) {
          
          // test image
          for (let keyImage of keyImages) {
            assert.equal(await that.daemon.getKeyImageSpentStatus(keyImage), expectedStatus);
          }
          
          // test array of images
          let statuses = keyImages.length == 0 ? [] : await that.daemon.getKeyImageSpentStatuses(keyImages);
          assert(Array.isArray(statuses));
          assert.equal(statuses.length, keyImages.length);
          for (let status of statuses) assert.equal(status, expectedStatus);
        }
      });
      
      if (testConfig.testNonRelays)
      it.skip("Can get output indices given a list of transaction hashes (binary)", async function() {
        throw new Error("Not implemented"); // get_o_indexes.bin
      });
      
      if (testConfig.testNonRelays)
      it.skip("Can get outputs given a list of output amounts and indices (binary)", async function() {
        throw new Error("Not implemented"); // get_outs.bin
      });
      
      if (testConfig.testNonRelays)
      it("Can get an output histogram (binary)", async function() {
        let entries = await that.daemon.getOutputHistogram();
        assert(Array.isArray(entries));
        assert(entries.length > 0);
        for (let entry of entries) {
          testOutputHistogramEntry(entry);
        }
      });
      
      // if (testConfig.testNonRelays)
      // it("Can get an output distribution (binary)", async function() {
      //   let amounts: bigint[] = [];
      //   amounts.push(BigInt(0));
      //   amounts.push(BigInt(1));
      //   amounts.push(BigInt(10));
      //   amounts.push(BigInt(100));
      //   amounts.push(BigInt(1000));
      //   amounts.push(BigInt(10000));
      //   amounts.push(BigInt(100000));
      //   amounts.push(BigInt(1000000));
      //   let entries = await that.daemon.getOutputDistribution(amounts);
      //   for (let entry of entries) {
      //     testOutputDistributionEntry(entry);
      //   }
      // });
      
      if (testConfig.testNonRelays)
      it("Can get general information", async function() {
        let info = await that.daemon.getInfo();
        testInfo(info);
      });
      
      if (testConfig.testNonRelays)
      it("Can get sync information", async function() {
        let syncInfo = await that.daemon.getSyncInfo();
        testSyncInfo(syncInfo);
      });
      
      if (testConfig.testNonRelays)
      it("Can get hard fork information", async function() {
        let hardForkInfo = await that.daemon.getHardForkInfo();
        testHardForkInfo(hardForkInfo);
      });
      
      if (testConfig.testNonRelays)
      it("Can get alternative chains", async function() {
        let altChains = await that.daemon.getAltChains();
        assert(Array.isArray(altChains) && altChains.length >= 0);
        for (let altChain of altChains) {
          testAltChain(altChain);
        }
      });
      
      if (testConfig.testNonRelays)
      it("Can get alternative block hashes", async function() {
        let altBlockHashes = await that.daemon.getAltBlockHashes();
        assert(Array.isArray(altBlockHashes) && altBlockHashes.length >= 0);
        for (let altBlockHash of altBlockHashes) {
          assert.equal(typeof altBlockHash, "string");
          assert.equal(altBlockHash.length, 64);  // TODO: common validation
        }
      });
      
      if (testConfig.testNonRelays)
      it("Can get, set, and reset a download bandwidth limit", async function() {
        let initVal = await that.daemon.getDownloadLimit();
        assert(initVal > 0);
        let setVal = initVal * 2;
        await that.daemon.setDownloadLimit(setVal);
        assert.equal(await that.daemon.getDownloadLimit(), setVal);
        let resetVal = await that.daemon.resetDownloadLimit();
        assert.equal(resetVal, initVal);
        
        // test invalid limits
        try {
          await that.daemon.setDownloadLimit(0);
          throw new Error("Should have thrown error on invalid input");
        } catch (e: any) {
          assert.equal("Download limit must be an integer greater than 0", e.message);
        }
        try {
          await that.daemon.setDownloadLimit(1.2);
          throw new Error("Should have thrown error on invalid input");
        } catch (e: any) {
          assert.equal("Download limit must be an integer greater than 0", e.message);
        }
        assert.equal(await that.daemon.getDownloadLimit(), initVal);
      });
      
      if (testConfig.testNonRelays)
      it("Can get, set, and reset an upload bandwidth limit", async function() {
        let initVal = await that.daemon.getUploadLimit();
        assert(initVal > 0);
        let setVal = initVal * 2;
        await that.daemon.setUploadLimit(setVal);
        assert.equal(await that.daemon.getUploadLimit(), setVal);
        let resetVal = await that.daemon.resetUploadLimit();
        assert.equal(resetVal, initVal);
        
        // test invalid limits
        try {
          await that.daemon.setUploadLimit(0);
          throw new Error("Should have thrown error on invalid input");
        } catch (e: any) {
          assert.equal("Upload limit must be an integer greater than 0", e.message);
        }
        try {
          await that.daemon.setUploadLimit(1.2);
          throw new Error("Should have thrown error on invalid input");
        } catch (e: any) {
          assert.equal("Upload limit must be an integer greater than 0", e.message);
        }
        assert.equal(await that.daemon.getUploadLimit(), initVal);
      });

      if (testConfig.testNonRelays)
      it("Can get peers with active incoming or outgoing peers", async function() {
        let peers = await that.daemon.getPeers();
        assert(Array.isArray(peers));
        assert(peers.length > 0, "Daemon has no incoming or outgoing peers to test");
        for (let peer of peers) {
          testPeer(peer);
        }
      });
      
      if (testConfig.testNonRelays)
      it("Can get known peers which may be online or offline", async function() {
        let peers = await that.daemon.getKnownPeers();
        assert(peers.length > 0, "Daemon has no known peers to test");
        for (let peer of peers) {
          testKnownPeer(peer);
        }
      });
      
      if (testConfig.testNonRelays)
      it("Can limit the number of outgoing peers", async function() {
        await that.daemon.setOutgoingPeerLimit(0);
        await that.daemon.setOutgoingPeerLimit(8);
        await that.daemon.setOutgoingPeerLimit(10);
      });
      
      if (testConfig.testNonRelays)
      it("Can limit the number of incoming peers", async function() {
        await that.daemon.setIncomingPeerLimit(0);
        await that.daemon.setIncomingPeerLimit(8);
        await that.daemon.setIncomingPeerLimit(10);
      });
      
      if (testConfig.testNonRelays)
      it("Can ban a peer", async function() {
        
        // set ban
        let ban = new MoneroBan({
          host: "192.168.1.56",
          isBanned: true,
          seconds: 60
        });
        await that.daemon.setPeerBan(ban);
        
        // test ban
        let bans = await that.daemon.getPeerBans();
        let found = false;
        for (let aBan of bans) {
          testMoneroBan(aBan);
          if (aBan.getHost() === "192.168.1.56") found = true;
        }
        assert(found);
      });
      
      if (testConfig.testNonRelays)
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
        let bans: MoneroBan[] = [];
        bans.push(ban1);
        bans.push(ban2);
        await that.daemon.setPeerBans(bans);
        
        // test bans
        bans = await that.daemon.getPeerBans();
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
      
      if (testConfig.testNonRelays)
      it("Can start and stop mining", async function() {
        
        // stop mining at beginning of test
        try { await that.daemon.stopMining(); }
        catch(e) { }
        
        // generate address to mine to
        let address = await that.wallet.getPrimaryAddress();
        
        // start mining
        await that.daemon.startMining(address, 2, false, true);
        
        // stop mining
        await that.daemon.stopMining();
      });
      
      if (testConfig.testNonRelays)
      it("Can get mining status", async function() {
        
        try {
          
          // stop mining at beginning of test
          try { await that.daemon.stopMining(); }
          catch(e) { }
          
          // test status without mining
          let status = await that.daemon.getMiningStatus();
          assert.equal(status.getIsActive(), false);
          assert.equal(status.getAddress(), undefined);
          assert.equal(status.getSpeed(), 0);
          assert.equal(status.getNumThreads(), 0);
          assert.equal(status.getIsBackground(), undefined);
          
          // test status with mining
          let address = await that.wallet.getPrimaryAddress();
          let threadCount = 3;
          let isBackground = false;
          await that.daemon.startMining(address, threadCount, isBackground, true);
          status = await that.daemon.getMiningStatus();
          assert.equal(status.getIsActive(), true);
          assert.equal(status.getAddress(), address);
          assert(status.getSpeed() >= 0);
          assert.equal(status.getNumThreads(), threadCount);
          assert.equal(status.getIsBackground(), isBackground);
        } catch(e) {
          throw e;
        } finally {
          
          // stop mining at end of test
          try { await that.daemon.stopMining(); }
          catch(e) { }
        }
      });
      
      if (testConfig.testNonRelays)
        // throws not implemented
      it.skip("Can submit a mined block to the network", async function() {
        
        // get template to mine on
        let template = await that.daemon.getBlockTemplate(TestUtils.ADDRESS);
        
        // TODO test mining and submitting block
        
        // try to submit block hashing blob without nonce
        try {
          await that.daemon.submitBlock(template.getBlockHashingBlob());
          throw new Error("Should have thrown error");
        } catch (e: any) {
          assert.equal(e.getCode(), -7);
          assert.equal(e.message, "Block not accepted");
        }
      });

      if (testConfig.testNonRelays)
      it("Can prune the blockchain", async function() {
        let result = await that.daemon.pruneBlockchain(true);
        if (result.getIsPruned()) {
          assert(result.getPruningSeed() > 0);
        } else {
          assert.equal(result.getPruningSeed(), 0);
        }
      });
      
      if (testConfig.testNonRelays)
      it.skip("Can check for an update", async function() {
        let result = await that.daemon.checkForUpdate();
        testUpdateCheckResult(result);
      });
      
      if (testConfig.testNonRelays)
      it.skip("Can download an update", async function() {
        
        // download to default path
        let result = await that.daemon.downloadUpdate();
        testUpdateDownloadResult(result);
        
        // download to defined path
        let path = "test_download_" + +new Date().getTime() + ".tar.bz2";
        result = await that.daemon.downloadUpdate(path);
        testUpdateDownloadResult(result, path);
        
        // test invalid path
        if (result.getIsUpdateAvailable()) {
          try {
            result = await that.daemon.downloadUpdate("./ohhai/there");
            throw new Error("Should have thrown error");
          } catch (e: any) {
            assert.notEqual("Should have thrown error", e.message);
            assert.equal(e.statusCode, 500);  // TODO monerod: this causes a 500 in that.daemon rpc
          }
        }
      });
      
      if (testConfig.testNonRelays)
      it("Can be stopped", async function() {
        return; // test is disabled to not interfere with other tests
        
        // give the daemon time to shut down
        await new Promise(function(resolve) { setTimeout(resolve, TestUtils.SYNC_PERIOD_IN_MS); });
        
        // stop the daemon
        await that.daemon.stop();
        
        // give the daemon 10 seconds to shut down
        await new Promise(function(resolve) { setTimeout(resolve, 10000); }); 
        
        // try to interact with the that.daemon
        try {
          await that.daemon.getHeight();
          throw new Error("Should have thrown error");
        } catch (e: any) {
          console.log(e);
          assert.notEqual("Should have thrown error", e.message);
        }
      });
      
      // ---------------------------- TEST RELAYS -----------------------------
      
      if (testConfig.testRelays)
      it("Can submit a tx in hex format to the pool and relay in one call", async function() {
        
        // wait one time for wallet txs in the pool to clear
        await TestUtils.WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);
        
        // create 2 txs, the second will double spend outputs of first
        let tx1 = await getUnrelayedTx(that.wallet, 2);  // TODO: this test requires tx to be from/to different accounts else the occlusion issue (#4500) causes the tx to not be recognized by the wallet at all
        let tx2 = await getUnrelayedTx(that.wallet, 2);
        
        // submit and relay tx1
        let result = await that.daemon.submitTxHex(tx1.getFullHex());
        assert.equal(result.getIsRelayed(), true);
        testSubmitTxResultGood(result);
        
        // tx1 is in the pool
        let txs = await that.daemon.getTxPool();
        let found = false;
        for (let aTx of txs) {
          if (aTx.getHash() === tx1.getHash()) {
            assert.equal(aTx.getIsRelayed(), true);
            found = true;
            break;
          }
        }
        assert(found, "Tx1 was not found after being submitted to the that.daemon's tx pool");
        
        // tx1 is recognized by the wallet
        await that.wallet.sync();
        await that.wallet.getTx(tx1.getHash());
        
        // submit and relay tx2 hex which double spends tx1
        result = await that.daemon.submitTxHex(tx2.getFullHex());
        assert.equal(result.getIsRelayed(), true);
        testSubmitTxResultDoubleSpend(result);
        
        // tx2 is in not the pool
        txs = await that.daemon.getTxPool();
        found = false;
        for (let aTx of txs) {
          if (aTx.getHash() === tx2.getHash()) {
            found = true;
            break;
          }
        }
        assert(!found, "Tx2 should not be in the pool because it double spends tx1 which is in the pool");
        
        // all wallets will need to wait for tx to confirm in order to properly sync
        TestUtils.WALLET_TX_TRACKER.reset();
      });
      
      if (testConfig.testRelays && !testConfig.liteMode)
      it("Can submit a tx in hex format to the pool then relay", async function() {
        await TestUtils.WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);
        let tx = await getUnrelayedTx(that.wallet, 1);
        await testSubmitThenRelay([tx]);
      });
      
      if (testConfig.testRelays && !testConfig.liteMode)
      it("Can submit txs in hex format to the pool then relay", async function() {
        await TestUtils.WALLET_TX_TRACKER.waitForWalletTxsToClearPool(that.wallet);
        let txs: MoneroTxWallet[] = [];
        txs.push(await getUnrelayedTx(that.wallet, 1));
        txs.push(await getUnrelayedTx(that.wallet, 2)); // TODO: accounts cannot be re-used across send tests else isRelayed is true; wallet needs to update?
        await testSubmitThenRelay(txs);
      });
      
      async function testSubmitThenRelay(txs) {
        
        // submit txs hex but don't relay
        let txHashes: string[] = [];
        for (let tx of txs) {
          txHashes.push(tx.getHash());
          let result = await that.daemon.submitTxHex(tx.getFullHex(), true);
          testSubmitTxResultGood(result);
          assert.equal(result.getIsRelayed(), false);
          
          // ensure tx is in pool
          let poolTxs = await that.daemon.getTxPool();
          let found = false;
          for (let aTx of poolTxs) {
            if (aTx.getHash() === tx.getHash()) {
              assert.equal(aTx.getIsRelayed(), false);
              found = true;
              break;
            }
          }
          assert(found, "Tx was not found after being submitted to the that.daemon's tx pool");
          
          // fetch tx by hash and ensure not relayed
          let fetchedTx = await that.daemon.getTx(tx.getHash());
          assert.equal(fetchedTx.getIsRelayed(), false);
        }
        
        // relay the txs
        try {
          txHashes.length === 1 ? await that.daemon.relayTxByHash(txHashes[0]) : await that.daemon.relayTxsByHash(txHashes);
        } catch (e) {
          await that.daemon.flushTxPool(txHashes); // flush txs when relay fails to prevent double spends in other tests  
          throw e;
        }
        
        // wait for txs to be relayed // TODO (monero-project): all txs should be relayed: https://github.com/monero-project/monero/issues/8523
        await new Promise(function(resolve) { setTimeout(resolve, 1000); });        
        
        // ensure txs are relayed
        let poolTxs = await that.daemon.getTxPool();
        for (let tx of txs) {
          let found = false;
          for (let aTx of poolTxs) {
            if (aTx.getHash() === tx.getHash()) {
              assert.equal(aTx.getIsRelayed(), true);
              found = true;
              break;
            }
          }
          assert(found, "Tx was not found after being submitted to the that.daemon's tx pool");
        }
        
        // wallets will need to wait for tx to confirm in order to properly sync
        TestUtils.WALLET_TX_TRACKER.reset();
      }
      
      // ------------------------ TEST NOTIFICATIONS --------------------------
      
      if (!testConfig.liteMode && testConfig.testNotifications)
      it("Can notify listeners when a new block is added to the chain", async function() {
        let err;
        try {
          
          // start mining if possible to help push the network along
          let address = await that.wallet.getPrimaryAddress();
          try { await that.daemon.startMining(address, 8, false, true); }
          catch (e: any) { if ("BUSY" === e.message) throw e; }
          
          // register a listener
          let listenerHeader;
          let listener = new class extends MoneroDaemonListener {
            async onBlockHeader(header) {
              listenerHeader = header;
            }
          }
          await that.daemon.addListener(listener);
          
          // wait for next block notification
          let header = await that.daemon.waitForNextBlockHeader();
          await that.daemon.removeListener(listener); // otherwise daemon will keep polling
          testBlockHeader(header, true);
          
          // test that listener was called with equivalent header
          assert.deepEqual(listenerHeader, header);
        } catch (e) {
          err = e;
        }
        
        // finally
        try { await that.daemon.stopMining(); }
        catch (e) { }
        if (err) throw err;
      });
    });
  }
}

function testBlockHeader(header, isFull) {
  assert(typeof isFull === "boolean");
  assert(header);
  assert(header.getHeight() >= 0);
  assert(header.getMajorVersion() > 0);
  assert(header.getMinorVersion() >= 0);
  if (header.getHeight() === 0) assert(header.getTimestamp() === 0);
  else assert(header.getTimestamp() > 0);
  assert(header.getPrevHash());
  assert(header.getNonce() !== undefined);
  if (header.getNonce() === 0) console.log("WARNING: header nonce is 0 at height " + header.getHeight()); // TODO (monero-project): why is header nonce 0?
  else assert(header.getNonce() > 0);
  assert.equal(typeof header.getNonce(), "number");
  assert(header.getPowHash() === undefined);  // never seen defined
  assert(!isFull ? undefined === header.getSize() : header.getSize());
  assert(!isFull ? undefined === header.getDepth() : header.getDepth() >= 0);
  assert(!isFull ? undefined === header.getDifficulty() : header.getDifficulty() > 0);
  assert(!isFull ? undefined === header.getCumulativeDifficulty() : header.getCumulativeDifficulty() > 0);
  assert(!isFull ? undefined === header.getHash() : header.getHash().length === 64);
  assert(!isFull ? undefined === header.getMinerTxHash() : header.getMinerTxHash().length === 64);
  assert(!isFull ? undefined === header.getNumTxs() : header.getNumTxs() >= 0);
  assert(!isFull ? undefined === header.getOrphanStatus() : typeof header.getOrphanStatus() === "boolean");
  assert(!isFull ? undefined === header.getReward() : header.getReward());
  assert(!isFull ? undefined === header.getWeight() : header.getWeight());
}

// TODO: test block deep copy
function testBlock(block, ctx) {
  
  // check inputs
  assert(ctx);
  assert.equal(typeof ctx.hasHex, "boolean");
  assert.equal(typeof ctx.headerIsFull, "boolean");
  assert.equal(typeof ctx.hasTxs, "boolean");
  
  // test required fields
  assert(block);
  assert(Array.isArray(block.getTxHashes()));
  assert(block.getTxHashes().length >= 0);
  testMinerTx(block.getMinerTx());   // TODO: miner tx doesn't have as much stuff, can't call testTx?
  testBlockHeader(block, ctx.headerIsFull);
  
  if (ctx.hasHex) {
    assert(block.getHex());
    assert(block.getHex().length > 1);
  } else {
    assert(block.getHex() === undefined)
  }
  
  if (ctx.hasTxs) {
    assert(typeof ctx.ctx === "object");
    assert(block.getTxs() instanceof Array);
    for (let tx of block.getTxs()) {
      assert(block === tx.getBlock());
      testTx(tx, ctx.ctx);
    }
  } else {
    assert(ctx.ctx === undefined);
    assert(block.getTxs() === undefined);
  }
}

function testMinerTx(minerTx) {
  assert(minerTx);
  assert(minerTx instanceof MoneroTx);
  assert.equal(typeof minerTx.getIsMinerTx(), "boolean");
  assert(minerTx.getIsMinerTx());
  
  assert(minerTx.getVersion() >= 0);
  assert(minerTx.getExtra() instanceof Uint8Array);
  assert(minerTx.getExtra().length > 0);
  assert(minerTx.getUnlockTime() >= BigInt(0));

  // TODO: miner tx does not have hashes in binary requests so this will fail, need to derive using prunable data
//  testTx(minerTx, {
//    hasJson: false,
//    isPruned: true,
//    isFull: false,
//    isConfirmed: true,
//    isMinerTx: true,
//    fromGetTxPool: false,
//  })
}

// TODO: how to test output indices? comes back with /get_transactions, maybe others
function testTx(tx: MoneroTx, ctx) {
  
  // check inputs
  assert(tx);
  assert.equal(typeof ctx, "object");
  assert.equal(typeof ctx.isPruned, "boolean");
  assert.equal(typeof ctx.isConfirmed, "boolean");
  assert.equal(typeof ctx.fromGetTxPool, "boolean");
  
  // standard across all txs
  assert(tx.getHash().length === 64);
  if (tx.getIsRelayed() === undefined) assert(tx.getInTxPool());  // TODO monerod: add relayed to get_transactions
  else assert.equal(typeof tx.getIsRelayed(), "boolean");
  assert.equal(typeof tx.getIsConfirmed(), "boolean");
  assert.equal(typeof tx.getInTxPool(), "boolean");
  assert.equal(typeof tx.getIsMinerTx(), "boolean");
  assert.equal(typeof tx.getIsDoubleSpendSeen(), "boolean");
  assert(tx.getVersion() >= 0);
  assert(tx.getUnlockTime() >= BigInt(0));
  assert(tx.getInputs());
  assert(tx.getOutputs());
  assert(tx.getExtra() instanceof Uint8Array);
  assert(tx.getExtra().length > 0);
  tx.getFee() && TestUtils.testUnsignedBigInt(tx.getFee(), true);
  
  // test presence of output indices
  // TODO: change this over to outputs only
  if (tx.getIsMinerTx()) assert.equal(tx.getOutputIndices(), undefined); // TODO: how to get output indices for miner transactions?
  if (tx.getInTxPool() || ctx.fromGetTxPool || ctx.hasOutputIndices === false) assert.equal(tx.getOutputIndices(), undefined);
  else assert(tx.getOutputIndices());
  if (tx.getOutputIndices()) assert(tx.getOutputIndices().length > 0);
  
  // test confirmed ctx
  if (ctx.isConfirmed === true) assert.equal(tx.getIsConfirmed(), true);
  if (ctx.isConfirmed === false) assert.equal(tx.getIsConfirmed(), false);
  
  // test confirmed
  if (tx.getIsConfirmed()) {
    assert(tx.getBlock());
    assert(tx.getBlock().getTxs().includes(tx));
    assert(tx.getBlock().getHeight() > 0);
    assert(tx.getBlock().getTimestamp() > 0);
    assert.equal(tx.getIsRelayed(), true);
    assert.equal(tx.getIsFailed(), false);
    assert.equal(tx.getInTxPool(), false);
    assert.equal(tx.getRelay(), true);
    assert.equal(tx.getIsDoubleSpendSeen(), false);
    if (ctx.fromBinaryBlock) assert.equal(tx.getNumConfirmations(), undefined);
    else assert(tx.getNumConfirmations() > 0);
  } else {
    assert.equal(tx.getBlock(), undefined);
    assert.equal(tx.getNumConfirmations(), 0);
  }
  
  // test in tx pool
  if (tx.getInTxPool()) {
    assert.equal(tx.getIsConfirmed(), false);
    assert.equal(tx.getIsDoubleSpendSeen(), false);
    assert.equal(tx.getLastFailedHeight(), undefined);
    assert.equal(tx.getLastFailedHash(), undefined);
    assert(tx.getReceivedTimestamp() > 0);
    if (ctx.fromGetTxPool) {
      assert(tx.getSize() > 0);
      assert(tx.getWeight() > 0);
      assert.equal(typeof tx.getIsKeptByBlock(), "boolean");
      assert(tx.getMaxUsedBlockHeight() >= 0);
      assert(tx.getMaxUsedBlockHash());
    }
    assert.equal(tx.getLastFailedHeight(), undefined);
    assert.equal(tx.getLastFailedHash(), undefined);
  } else {
    assert.equal(tx.getLastRelayedTimestamp(), undefined);
  }
  
  // test miner tx
  if (tx.getIsMinerTx()) {
    assert.equal(tx.getFee(), 0n);
    assert.equal(tx.getInputs(), undefined);
    assert.equal(tx.getSignatures(), undefined);
  } else {
    if (tx.getSignatures() !== undefined) assert(tx.getSignatures().length > 0)
  }
  
  // test failed  // TODO: what else to test associated with failed
  if (tx.getIsFailed()) {
    assert(tx.getReceivedTimestamp() > 0)
  } else {
    if (tx.getIsRelayed() === undefined) assert.equal(tx.getRelay(), undefined); // TODO monerod: add relayed to get_transactions
    else if (tx.getIsRelayed()) assert.equal(tx.getIsDoubleSpendSeen(), false);
    else {
      assert.equal(tx.getIsRelayed(), false);
      if (ctx.fromGetTxPool) {
        assert.equal(tx.getRelay(), false);
        assert.equal(typeof tx.getIsDoubleSpendSeen(), "boolean");
      }
    }
  }
  assert.equal(tx.getLastFailedHeight(), undefined);
  assert.equal(tx.getLastFailedHash(), undefined);
  
  // received time only for tx pool or failed txs
  if (tx.getReceivedTimestamp() !== undefined) {
    assert(tx.getInTxPool() || tx.getIsFailed());
  }
  
  // test inputs and outputs
  assert(tx.getInputs() && Array.isArray(tx.getInputs()) && tx.getInputs().length >= 0);
  assert(tx.getOutputs() && Array.isArray(tx.getOutputs()) && tx.getOutputs().length >= 0);
  if (!tx.getIsMinerTx()) assert(tx.getInputs().length > 0);
  for (let input of tx.getInputs()) {
    assert(tx === input.getTx());
    testVin(input, ctx);
  }
  assert(tx.getOutputs().length > 0);
  for (let output of tx.getOutputs()) {
    assert(tx === output.getTx());
    testOutput(output, ctx);
  }
  
  // test pruned vs not pruned
  if (ctx.fromGetTxPool || ctx.fromBinaryBlock) assert.equal(tx.getPrunableHash(), undefined);   // TODO monerod: tx pool txs do not have prunable hash, TODO: getBlocksByHeight() has inconsistent client-side pruning
  else assert(tx.getPrunableHash());
  if (ctx.isPruned) {
    assert.equal(tx.getRctSigPrunable(), undefined);
    assert.equal(tx.getSize(), undefined);
    assert.equal(tx.getLastRelayedTimestamp(), undefined);
    assert.equal(tx.getReceivedTimestamp(), undefined);
    assert.equal(tx.getFullHex(), undefined);
    assert(tx.getPrunedHex());
  } else {
    assert.equal(tx.getPrunedHex(), undefined);
    assert(tx.getVersion() >= 0);
    assert(tx.getUnlockTime() >= 0n);
    assert(tx.getExtra() instanceof Uint8Array);
    assert(tx.getExtra().length > 0);
    if (ctx.fromBinaryBlock) assert.equal(tx.getFullHex(), undefined);         // TODO: getBlocksByHeight() has inconsistent client-side pruning
    else assert(tx.getFullHex().length > 0);
    if (ctx.fromBinaryBlock) assert.equal(tx.getRctSigPrunable(), undefined);  // TODO: getBlocksByHeight() has inconsistent client-side pruning
    //else assert.equal(typeof tx.getRctSigPrunable().nbp, "number");
    assert.equal(tx.getIsDoubleSpendSeen(), false);
    if (tx.getIsConfirmed()) {
      assert.equal(tx.getLastRelayedTimestamp(), undefined);
      assert.equal(tx.getReceivedTimestamp(), undefined);
    } else {
      if (tx.getIsRelayed()) assert(tx.getLastRelayedTimestamp() > 0);
      else assert.equal(tx.getLastRelayedTimestamp(), undefined);
      assert(tx.getReceivedTimestamp() > 0);
    }
  }
  
  if (tx.getIsFailed()) {
    // TODO: implement this
  }
  
  // test deep copy
  if (!ctx.doNotTestCopy) testTxCopy(tx, ctx);
}

function testBlockTemplate(template: MoneroBlockTemplate) {
  assert(template);
  assert(template.getBlockTemplateBlob());
  assert(template.getBlockHashingBlob());
  assert(template.getDifficulty());
  assert.equal(typeof template.getDifficulty(), "bigint");
  assert(template.getExpectedReward());
  assert(template.getHeight());
  assert(template.getPrevHash());
  assert(template.getReservedOffset());
  assert.equal(typeof template.getSeedHeight(), "number");
  assert(template.getSeedHeight() > 0);
  assert.equal(typeof template.getSeedHash(), "string");
  // assert(template.getSeedHash()); // TODO: `generateblocks` produces empty seedhash
  // next seed hash can be null or initialized  // TODO: test circumstances for each
}

function testInfo(info: MoneroDaemonInfo) {
  assert(info.getVersion());
  assert(info.getNumAltBlocks() >= 0);
  assert(info.getBlockSizeLimit());
  assert(info.getBlockSizeMedian());
  assert(info.getBootstrapDaemonAddress() === undefined || (typeof info.getBootstrapDaemonAddress() === "string" && info.getBootstrapDaemonAddress().length > 0));
  assert(info.getCumulativeDifficulty());
  assert.equal(typeof info.getCumulativeDifficulty(), "bigint");
  assert(info.getFreeSpace());
  assert(info.getNumOfflinePeers() >= 0);
  assert(info.getNumOnlinePeers() >= 0);
  assert(info.getHeight() >= 0);
  assert(info.getHeightWithoutBootstrap());
  assert(info.getNumIncomingConnections() >= 0);
  assert(info.getNetworkType());
  assert.equal(typeof info.getIsOffline(), "boolean");
  assert(info.getNumOutgoingConnections() >= 0);
  assert(info.getNumRpcConnections() >= 0);
  assert(info.getStartTimestamp());
  assert(info.getAdjustedTimestamp());
  assert(info.getTarget());
  assert(info.getTargetHeight() >= 0);
  assert(info.getNumTxs() >= 0);
  assert(info.getNumTxsPool() >= 0);
  assert.equal(typeof info.getWasBootstrapEverUsed(), "boolean");
  assert(info.getBlockWeightLimit());
  assert(info.getBlockWeightMedian());
  assert(info.getDatabaseSize() > 0);
  assert(typeof info.getUpdateAvailable() === "boolean");
  TestUtils.testUnsignedBigInt(info.getCredits(), false);
  assert.equal(typeof info.getTopBlockHash(), "string");
  assert(info.getTopBlockHash());
  assert.equal("boolean", typeof info.getIsBusySyncing());
  assert.equal("boolean", typeof info.getIsSynchronized());
}

function testSyncInfo(syncInfo) { // TODO: consistent naming, daemon in name?
  assert(syncInfo instanceof MoneroDaemonSyncInfo);
  assert(syncInfo.getHeight() >= 0);
  if (syncInfo.getPeers() !== undefined) {
    assert(syncInfo.getPeers().length > 0);
    for (let peer of syncInfo.getPeers()) {
      testPeer(peer);
    }
  }
  if (syncInfo.getSpans() !== undefined) {  // TODO: test that this is being hit, so far not used
    assert(syncInfo.getSpans().length > 0);
    for (let span of syncInfo.getSpans()) {
      testConnectionSpan(span);
    }
  }
  assert(syncInfo.getNextNeededPruningSeed() >= 0);
  assert.equal(syncInfo.getOverview(), undefined);
  TestUtils.testUnsignedBigInt(syncInfo.getCredits(), false);
  assert.equal(syncInfo.getTopBlockHash(), undefined);
}

function testConnectionSpan(span) {
  assert.notEqual(span, undefined);
  assert.notEqual(span.getConnectionId(), undefined);
  assert(span.getConnectionId().length > 0);
  assert(span.getStartHeight() > 0);
  assert(span.getNumBlocks() > 0);
  assert(span.getRemoteAddress() === undefined || span.getRemoteAddress().length > 0);
  assert(span.getRate() > 0);
  assert(span.getSpeed() >= 0);
  assert(span.getSize() > 0);
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
  TestUtils.testUnsignedBigInt(hardForkInfo.getCredits(), false);
  assert.equal(hardForkInfo.getTopBlockHash(), undefined);
}

function testMoneroBan(ban) {
  assert.notEqual(ban.getHost(), undefined);
  assert.notEqual(ban.getIp(), undefined);
  assert.notEqual(ban.getSeconds(), undefined);
}

function testMinerTxSum(txSum) {
  TestUtils.testUnsignedBigInt(txSum.getEmissionSum(), true);
  TestUtils.testUnsignedBigInt(txSum.getFeeSum(), true);
}

function testOutputHistogramEntry(entry) {
  TestUtils.testUnsignedBigInt(entry.getAmount());
  assert(entry.getNumInstances() >= 0);
  assert(entry.getNumUnlockedInstances() >= 0);
  assert(entry.getNumRecentInstances() >= 0);
}

function testOutputDistributionEntry(entry) {
  TestUtils.testUnsignedBigInt(entry.getAmount());
  assert(entry.getBase() >= 0);
  assert(Array.isArray(entry.getDistribution()) && entry.getDistribution().length > 0);
  assert(entry.getStartHeight() >= 0);
}

function testSubmitTxResultGood(result: MoneroSubmitTxResult) {
  testSubmitTxResultCommon(result);
  try {
    assert.equal(result.getIsDoubleSpendSeen(), false, "tx submission is double spend.");
    assert.equal(result.getIsFeeTooLow(), false);
    assert.equal(result.getIsMixinTooLow(), false);
    assert.equal(result.getHasInvalidInput(), false);
    assert.equal(result.getHasInvalidOutput(), false);
    assert.equal(result.getHasTooFewOutputs(), false);
    assert.equal(result.getIsOverspend(), false);
    assert.equal(result.getIsTooBig(), false);
    assert.equal(result.getSanityCheckFailed(), false);
    TestUtils.testUnsignedBigInt(result.getCredits(), false); // 0 credits
    assert.equal(result.getTopBlockHash(), undefined);
    assert.equal(result.getIsTxExtraTooBig(), false);
    assert.equal(result.getIsGood(), true);
  } catch (e) {
    console.log("Submit result is not good: " + JSON.stringify(result.toJson()));
    throw e;
  }
}

function testSubmitTxResultDoubleSpend(result: MoneroSubmitTxResult) {
  testSubmitTxResultCommon(result);
  assert.equal(result.getIsGood(), false);
  assert.equal(result.getIsDoubleSpendSeen(), true);
  assert.equal(result.getIsFeeTooLow(), false);
  assert.equal(result.getIsMixinTooLow(), false);
  assert.equal(result.getHasInvalidInput(), false);
  assert.equal(result.getHasInvalidOutput(), false);
  assert.equal(result.getIsOverspend(), false);
  assert.equal(result.getIsTooBig(), false);
}

function testSubmitTxResultCommon(result: MoneroSubmitTxResult) {
  assert.equal(typeof result.getIsGood(), "boolean");
  assert.equal(typeof result.getIsRelayed(), "boolean");
  assert.equal(typeof result.getIsDoubleSpendSeen(), "boolean");
  assert.equal(typeof result.getIsFeeTooLow(), "boolean");
  assert.equal(typeof result.getIsMixinTooLow(), "boolean");
  assert.equal(typeof result.getHasInvalidInput(), "boolean");
  assert.equal(typeof result.getHasInvalidOutput(), "boolean");
  assert.equal(typeof result.getIsOverspend(), "boolean");
  assert.equal(typeof result.getIsTooBig(), "boolean");
  assert.equal(typeof result.getSanityCheckFailed(), "boolean");
  assert(result.getReason() === undefined || result.getReason().length > 0);
}

function testTxPoolStats(stats: MoneroTxPoolStats) {
  assert(stats);
  assert(stats.getNumTxs() >= 0);
  if (stats.getNumTxs() > 0) {
    if (stats.getNumTxs() === 1) assert.equal(stats.getHisto(), undefined);
    else {
      assert(stats.getHisto());
      assert(stats.getHisto().size > 0);
      for (let key of stats.getHisto().keys()) {
        assert(stats.getHisto().get(key) >= 0);
      }
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
  let config = new MoneroTxConfig({accountIndex: accountIdx, address: await wallet.getPrimaryAddress(), amount: TestUtils.MAX_FEE}); 
  let tx = await wallet.createTx(config);
  assert(tx.getFullHex());
  assert.equal(tx.getRelay(), false);
  return tx;
}

function testVin(input, ctx) {
  testOutput(input);
  testKeyImage(input.getKeyImage(), ctx);
  assert(input.getRingOutputIndices() && Array.isArray(input.getRingOutputIndices()) && input.getRingOutputIndices().length > 0);
  for (let index of input.getRingOutputIndices()) {
    assert.equal(typeof index, "number")
    assert(index >= 0);
  }
}

function testKeyImage(image, ctx) {
  assert(image instanceof MoneroKeyImage);
  assert(image.getHex());
  if (image.getSignature() !== undefined) {
    assert.equal(typeof image.getSignature(), "string");
    assert(image.getSignature().length > 0);
  }
}

function testOutput(output, ctx?) { 
  assert(output instanceof MoneroOutput);
  TestUtils.testUnsignedBigInt(output.getAmount());
  if (ctx) {
    if (output.getTx().getInTxPool() || ctx.fromGetTxPool || ctx.hasOutputIndices === false) assert.equal(output.getIndex(), undefined); // TODO: get_blocks_by_height.bin (#5127), get_transaction_pool, and tx pool txs do not return output indices 
    else assert(output.getIndex() >= 0);
    assert(output.getStealthPublicKey() && output.getStealthPublicKey().length === 64);
  }
}

async function getConfirmedTxs(daemon, numTxs) {
  let txs: MoneroTx[] = [];
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
  assert(Array.isArray(altChain.getBlockHashes()) && altChain.getBlockHashes().length > 0);
  TestUtils.testUnsignedBigInt(altChain.getDifficulty(), true);
  assert(altChain.getHeight() > 0);
  assert(altChain.getLength() > 0);
  assert(altChain.getMainChainParentBlockHash().length === 64);
}

function testPeer(peer) {
  assert(peer instanceof MoneroPeer);
  testKnownPeer(peer, true);
  assert(peer.getId());
  assert(peer.getAvgDownload() >= 0);
  assert(peer.getAvgUpload() >= 0);
  assert(peer.getCurrentDownload() >= 0);
  assert(peer.getCurrentUpload() >= 0);
  assert(peer.getHeight() >= 0);
  assert(peer.getLiveTime() >= 0);
  assert.equal(typeof peer.getIsLocalIp(), "boolean");
  assert.equal(typeof peer.getIsLocalHost(), "boolean");
  assert(peer.getNumReceives() >= 0);
  assert(peer.getReceiveIdleTime() >= 0);
  assert(peer.getNumSends() >= 0);
  assert(peer.getSendIdleTime() >= 0);
  assert(peer.getState());
  assert(peer.getNumSupportFlags() >= 0);
}

function testKnownPeer(peer, fromConnection?) {
  assert(peer instanceof MoneroPeer);
  assert.equal(typeof peer.getId(), "string");
  assert.equal(typeof peer.getHost(), "string");
  assert(typeof peer.getPort() === "number");
  assert(peer.getPort() > 0);
  assert(peer.getRpcPort() === undefined || (typeof peer.getRpcPort() === "number" && peer.getRpcPort() >= 0));
  assert.equal(typeof peer.getIsOnline(), "boolean");
  if (peer.getRpcCreditsPerHash() !== undefined) TestUtils.testUnsignedBigInt(peer.getRpcCreditsPerHash());
  if (fromConnection) assert.equal(undefined, peer.getLastSeenTimestamp());
  else {
    if (peer.getLastSeenTimestamp() < 0) console.log("Last seen timestamp is invalid: " + peer.getLastSeenTimestamp());
    assert(peer.getLastSeenTimestamp() >= 0);
  }
  assert(peer.getPruningSeed() === undefined || peer.getPruningSeed() >= 0);
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

function testUpdateDownloadResult(result, path?) {
  testUpdateCheckResult(result);
  if (result.isUpdateAvailable()) {
    if (path) assert.equal(result.getDownloadPath(), path);
    else assert(result.getDownloadPath());
  } else {
    assert.equal(result.getDownloadPath(), undefined);
  }
}

async function getConfirmedTxHashes(daemon): Promise<string[]> {
  let numTxs = 5;
  let txHashes: string[] = [];
  let height = await daemon.getHeight();
  while (txHashes.length < numTxs && height > 0) {
    let block = await daemon.getBlockByHeight(--height);
    for (let txHash of block.getTxHashes()) txHashes.push(txHash);
  }
  return txHashes;
}

function testTxCopy(tx: MoneroTx, ctx) {
  
  // copy tx and test
  let copy = tx.copy();
  assert(copy instanceof MoneroTx);
  assert.equal(copy.getBlock(), undefined);
  if (tx.getBlock()) copy.setBlock(tx.getBlock().copy().setTxs([copy]));  // copy block for testing equality
  assert.equal(copy.toString(), tx.toString());
  
  // test different input references
  if (copy.getInputs() === undefined) assert.equal(tx.getInputs(), undefined);
  else {
    assert(copy.getInputs() !== tx.getInputs());
    for (let i = 0; i < copy.getInputs().length; i++) {
      assert.equal(tx.getInputs()[i].getAmount(), copy.getInputs()[i].getAmount());
    }
  }
  
  // test different output references
  if (copy.getOutputs() === undefined) assert.equal(tx.getOutputs(), undefined);
  else {
    assert(copy.getOutputs() !== tx.getOutputs());
    for (let i = 0; i < copy.getOutputs().length; i++) {
      assert.equal(tx.getOutputs()[i].getAmount(), copy.getOutputs()[i].getAmount());
    }
  }
  
  // test copied tx
  ctx = Object.assign({}, ctx);
  ctx.doNotTestCopy = true;
  if (tx.getBlock()) copy.setBlock(tx.getBlock().copy().setTxs([copy])); // copy block for testing
  testTx(copy, ctx);
  
  // test merging with copy
  let merged = copy.merge(copy.copy());
  assert.equal(merged.toString(), tx.toString());
}
