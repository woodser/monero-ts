const assert = require("assert");
const BigInteger = require("../mymonero_core_js/cryptonote_utils/biginteger").BigInteger;
const MoneroRpc = require("../rpc/MoneroRpc")
const MoneroDaemon = require("./MoneroDaemon");
const MoneroDaemonResponseInfo = require("./model/MoneroDaemonResponseInfo"); 
const MoneroHeight = require("./model/MoneroHeight");
const MoneroBlockHeader = require("./model/MoneroBlockHeader");
const MoneroBlock = require("./model/MoneroBlock");
const MoneroMinerTx = require("./model/MoneroMinerTx");

/**
 * Implements a Monero daemon using monero-daemon-rpc.
 */
class MoneroDaemonRpc extends MoneroDaemon {
  
  /**
   * Constructs the daemon.
   * 
   * @param rpcOrConfig is an RPC connection or a configuration for one
   */
  constructor(rpcOrConfig) {
    super();
    
    // set rpc connection
    if (rpcOrConfig instanceof MoneroRpc) {
      this.rpc = rpcOrConfig;
    } else {
      this.rpc = new MoneroRpc(rpcOrConfig);
    }
  }
  
  async getHeight() {
    return (await this.rpc.sendJsonRpcRequest("get_block_count")).count;
  }
  
  async getBlockHash(height) {
    return await this.rpc.sendJsonRpcRequest("on_get_block_hash", [height]);
  }
  
  async getLastBlockHeader() {
    let resp = await this.rpc.sendJsonRpcRequest("get_last_block_header");
    let header = MoneroDaemonRpc._initializeBlockHeader(resp.block_header);
    MoneroDaemonRpc._setResponseInfo(resp, header);
    return header;
  }
  
  async getBlockHeadersByRange(startHeight, endHeight) {
    
    // fetch block headers
    let resp = await this.rpc.sendJsonRpcRequest("get_block_headers_range", {
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
    let resp = await this.rpc.sendJsonRpcRequest("get_block", { hash: hash });
    let block = MoneroDaemonRpc._initializeBlock(resp);
    MoneroDaemonRpc._setResponseInfo(resp, block);
    return block;
  }
  
  async getBlockByHeight(height) {
    let resp = await this.rpc.sendJsonRpcRequest("get_block", { height: height });
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
  
  async getBlocksByRange(startHeight, endHeight) {
    if (typeof startHeight !== "number") startHeight = 0;
    if (typeof endHeight !== "number") endHeight = await this.getHeight() - 1;
    let heights = [];
    for (let height = startHeight; height <= endHeight; height++) heights.push(height);
    return await this.getBlocksByHeight(heights);
  }
  
  // ------------------------------- PRIVATE STATIC ---------------------------
  
  static _setResponseInfo(resp, model) {
    let responseInfo = new MoneroDaemonResponseInfo(resp.status, resp.untrusted ? !resp.untrusted : resp.untrusted);  // invert api's isUntrusted to isTrusted
    model.setResponseInfo(responseInfo);
  }
  
  static _initializeBlockHeader(respHeader) {
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

    // initialize block
    let block = new MoneroBlock();
    block.setBlob(respBlock.blob);
    block.setHeader(MoneroDaemonRpc._initializeBlockHeader(respBlock.block_header));
    block.setTxHashes(respBlock.tx_hashes === undefined ? [] : respBlock.tx_hashes);
    
    // initialize miner tx from json
    let minerTx = new MoneroMinerTx();
    block.setMinerTx(minerTx);
    let json = JSON.parse(respBlock.json);
    minerTx.setVersion(json.miner_tx.version);
    minerTx.setUnlockTime(json.miner_tx.unlock_time);
    minerTx.setExtra(json.miner_tx.extra);
    return block;
  }
}

module.exports = MoneroDaemonRpc;