const assert = require("assert");
const MoneroUtils = require("../utils/MoneroUtils");
const BigInteger = require("../submodules/mymonero-core-js/cryptonote_utils/biginteger").BigInteger;
const MoneroRpc = require("../rpc/MoneroRpc")
const MoneroDaemon = require("./MoneroDaemon");
const MoneroDaemonResponseInfo = require("./model/MoneroDaemonResponseInfo"); 
const MoneroHeight = require("./model/MoneroHeight");
const MoneroBlockHeader = require("./model/MoneroBlockHeader");
const MoneroBlock = require("./model/MoneroBlock");
const MoneroTx = require("./model/MoneroTx");

/**
 * Implements a Monero daemon using monero-daemon-rpc.
 */
class MoneroDaemonRpc extends MoneroDaemon {
  
  /**
   * Constructs the daemon.
   * 
   * @param config is the daemon configuration	// TODO: default configuration
   */
  constructor(config) {
    super();
    
    // assign config
    this.config = Object.assign({}, config);
    
    // initialize rpc if not given
    if (!this.config.rpc) this.config.rpc = new MoneroRpc(config);
  }
  
  async getHeight() {
    return (await this.config.rpc.sendJsonRpcRequest("get_block_count")).count;
  }
  
  async getBlockHash(height) {
    return await this.config.rpc.sendJsonRpcRequest("on_get_block_hash", [height]);
  }
  
  async getLastBlockHeader() {
    let resp = await this.config.rpc.sendJsonRpcRequest("get_last_block_header");
    let header = MoneroDaemonRpc._initializeBlockHeader(resp.block_header);
    MoneroDaemonRpc._setResponseInfo(resp, header);
    return header;
  }
  
  async getBlockHeadersByRange(startHeight, endHeight) {
    
    // fetch block headers
    let resp = await this.config.rpc.sendJsonRpcRequest("get_block_headers_range", {
      start_height: startHeight,
      end_height: endHeight
    });
    
    // build headers
    let headers = [];
    for (let respHeader of resp.headers) {
      let header = MoneroDaemonRpc._initializeBlockHeader(respHeader);
      headers.push(header);
      MoneroDaemonRpc._setResponseInfo(resp, header);
    }
    return headers;
  }
  
  async getBlockByHash(hash) {
    let resp = await this.config.rpc.sendJsonRpcRequest("get_block", { hash: hash });
    let block = MoneroDaemonRpc._initializeBlock(resp);
    MoneroDaemonRpc._setResponseInfo(resp, block);
    return block;
  }
  
  async getBlockByHeight(height) {
    let resp = await this.config.rpc.sendJsonRpcRequest("get_block", { height: height });
    let block = MoneroDaemonRpc._initializeBlock(resp);
    MoneroDaemonRpc._setResponseInfo(resp, block);
    return block;
  }
  
  async getBlocksByHeight(heights) {
    assert(Array.isArray(heights));
    assert(heights.length > 0);
    let blocks = [];
    for (let height of heights) blocks.push(await this.getBlockByHeight(height));
    return blocks;
    
//    const blocksChunk = 190;  // number of blocks to fetch in a chunk
//    const timeout = 5000;     // timeout between chunks
//    
//    // fetch blocks in chunks
//    let blocks = [];
//    for (let i = 0; i < heights.length; i++) {
//      if (i > 0 && i % blocksChunk === 0) {
//        console.log("CHUNK");
//        await new Promise(resolve => setTimeout(resolve, timeout)); // wait between chunks
//      }
//      blocks.push(await this.getBlockByHeight(heights[i]));
//    }
//    return blocks;
  }
  
  async getBlocksByHeightBinary(heights) {
    
    // fetch blocks in binary
    let respBin = await this.config.rpc.sendBinRpcRequest("get_blocks_by_height.bin", { heights: heights });
    
    // convert binary blocks to json
    let respJson = this.config.coreUtils.binary_blocks_to_json(respBin);
    //console.log(respJson);
    
    // build complete blocks
    assert.equal(respJson.blocks.length, respJson.txs.length);    
    let blocks = [];
    for (let blockIdx = 0; blockIdx < respJson.blocks.length; blockIdx++) {
      let block = MoneroDaemonRpc._initializeBlock(respJson.blocks[blockIdx]);
      block.setTxs(respJson.txs[blockIdx].map(tx => MoneroDaemonRpc._daemonTxMapToTx(tx)));
      MoneroDaemonRpc._setResponseInfo(respJson, block);
      blocks.push(block);
    }
    
    return blocks;
  }
  
  async getBlocksByRange(startHeight, endHeight) {
    if (typeof startHeight !== "number") startHeight = 0;
    if (typeof endHeight !== "number") endHeight = await this.getHeight() - 1;
    let heights = [];
    for (let height = startHeight; height <= endHeight; height++) heights.push(height);
    return await this.getBlocksByHeight(heights);
  }
  
  async getTxs(txHashes, decodeAsJson, prune) {
    
    // fetch transactions
    let resp = await this.config.rpc.sendPathRpcRequest("get_transactions", {
      txs_hashes: txHashes,
      decode_as_json: decodeAsJson,
      prune: prune
    });
    
    //if (resp.txs) console.log(resp.txs[0]);
    
    // build transaction models
    let txs = resp.txs ? resp.txs.map(tx => MoneroDaemonRpc._daemonTxMapToTx(tx)) : [];
    txs.map(tx => MoneroDaemonRpc._setResponseInfo(resp, tx));
    return txs;
  }
  
  // ------------------------------- PRIVATE STATIC ---------------------------
  
  static _setResponseInfo(resp, model) {
    let responseInfo = new MoneroDaemonResponseInfo(resp.status, resp.untrusted ? !resp.untrusted : resp.untrusted);  // invert api's isUntrusted to isTrusted  // TODO: uninvert
    model.setResponseInfo(responseInfo);
  }
  
  static _initializeBlockHeader(respHeader) {
    if (!respHeader) return undefined;
    let header = new MoneroBlockHeader();
    for (var prop in respHeader) {
      let key = prop.toString();
      let val = respHeader[key];
      if (key === "block_size") header.setBlockSize(val);
      else if (key === "depth") header.setDepth(val);
      else if (key === "difficulty") header.setDifficulty(new BigInteger(val));
      else if (key === "cumulative_difficulty") header.setCumulativeDifficulty(new BigInteger(val));
      else if (key === "hash") header.setHash(val);
      else if (key === "height") header.setHeight(val);
      else if (key === "major_version") header.setMajorVersion(val);
      else if (key === "minor_version") header.setMinorVersion(val);
      else if (key === "nonce") header.setNonce(val);
      else if (key === "num_txes") header.setNumTxs(val);
      else if (key === "orphan_status") header.setOrphanStatus(val);
      else if (key === "prev_hash") header.setPrevHash(val);
      else if (key === "reward") header.setReward(new BigInteger(val));
      else if (key === "timestamp") header.setTimestamp(val);
      else if (key === "block_weight") header.setBlockWeight(val);
      else if (key === "pow_hash") header.setPowHash(val === "" ? undefined : val);
      else console.log("WARNING: ignoring unexpected block header field: '" + key + "': " + val);
    }
    return header;
  }
  
  static _initializeBlock(respBlock) {

    // initialize MoneroBlock
    let block = new MoneroBlock();
    block.setBlob(respBlock.blob);
    block.setHeader(MoneroDaemonRpc._initializeBlockHeader(respBlock.block_header));
    block.setTxHashes(respBlock.tx_hashes === undefined ? [] : respBlock.tx_hashes);
    
    // initialize MineroTx
    let minerTx = new MoneroTx();
    block.setMinerTx(minerTx);
    let minerTxRpc = respBlock.json ? JSON.parse(respBlock.json).miner_tx : respBlock.miner_tx; // get miner tx from rpc
    minerTx.setVersion(minerTxRpc.version);
    minerTx.setUnlockTime(minerTxRpc.unlock_time);
    minerTx.setExtra(minerTxRpc.extra);
    return block;
  }
  
  /**
   * Builds a MoneroTx from a daemon RPC transaction map.
   * 
   * @param txMap are transaction key/values from the RPC API
   */
  static _daemonTxMapToTx(txMap) {
    
    // root level fields
    let tx = new MoneroTx();
    tx.setHex(txMap.as_hex);
    tx.setHeight(txMap.block_height);
    tx.setTimestamp(txMap.block_timestamp);
    tx.setIsDoubleSpend(txMap.double_spend_seen);
    tx.setIsConfirmed(!txMap.in_pool);
    tx.setId(txMap.tx_hash);
    
    // additional fields can be under root or as_json
    // TODO: what about txMap.output_indices
    let txBase = txMap.as_json ? JSON.parse(txMap.as_json) : txMap;
    tx.setVersion(txBase.version);
    tx.setExtra(txBase.extra);
    tx.setVin(txBase.vin);
    tx.setVout(txBase.vout);
    tx.setRctSignatures(txBase.rct_signatures);
    tx.setRctSigPrunable(txBase.rctsig_prunable);    
    return tx;
  }
}

module.exports = MoneroDaemonRpc;