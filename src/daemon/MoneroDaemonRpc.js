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
   * @param config is the daemon configuration	// TODO: config default and validation
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
    let header = MoneroDaemonRpc._buildMoneroBlockHeader(resp.block_header);
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
      let header = MoneroDaemonRpc._buildMoneroBlockHeader(respHeader);
      headers.push(header);
      MoneroDaemonRpc._setResponseInfo(resp, header);
    }
    return headers;
  }
  
  async getBlockByHash(hash) {
    let resp = await this.config.rpc.sendJsonRpcRequest("get_block", { hash: hash });
    let block = MoneroDaemonRpc._buildMoneroBlock(resp);
    MoneroDaemonRpc._setResponseInfo(resp, block);
    return block;
  }
  
  async getBlockByHeight(height) {
    let resp = await this.config.rpc.sendJsonRpcRequest("get_block", { height: height });
    let block = MoneroDaemonRpc._buildMoneroBlock(resp);
    MoneroDaemonRpc._setResponseInfo(resp, block);
    return block;
  }
  
  async getBlocksByHeight(heights) {
    
    // fetch blocks in binary
    let respBin = await this.config.rpc.sendBinRpcRequest("get_blocks_by_height.bin", { heights: heights });
    
    // convert binary blocks to json
    let rpcBlocks = this.config.coreUtils.binary_blocks_to_json(respBin);
    
    // build complete blocks
    assert.equal(rpcBlocks.blocks.length, rpcBlocks.txs.length);    
    let blocks = [];
    for (let blockIdx = 0; blockIdx < rpcBlocks.blocks.length; blockIdx++) {
      let block = MoneroDaemonRpc._buildMoneroBlock(rpcBlocks.blocks[blockIdx]);                  // create block
      block.getHeader().setHeight(heights[blockIdx]);                                             // set header height
      block.setTxs(rpcBlocks.txs[blockIdx].map(rpcTx => MoneroDaemonRpc._buildMoneroTx(rpcTx)));  // create transactions
      for (let txIdx = 0; txIdx < block.getTxs().length; txIdx++) {
        block.getTxs()[txIdx].setId(rpcBlocks.blocks[blockIdx].tx_hashes[txIdx]);                 // set tx id
        block.getTxs()[txIdx].setHeight(block.getHeader().getHeight());                           // set tx height
      }
      MoneroDaemonRpc._setResponseInfo(rpcBlocks, block);
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
    
    // build transaction models
    let txs = resp.txs ? resp.txs.map(tx => MoneroDaemonRpc._buildMoneroTx(tx)) : [];
    txs.map(tx => MoneroDaemonRpc._setResponseInfo(resp, tx));
    return txs;
  }
  
  // ------------------------------- PRIVATE STATIC ---------------------------
  
  static _setResponseInfo(resp, model) {
    let responseInfo = new MoneroDaemonResponseInfo(resp.status, resp.untrusted ? !resp.untrusted : resp.untrusted);  // invert api's isUntrusted to isTrusted  // TODO: uninvert
    model.setResponseInfo(responseInfo);
  }
  
  static _buildMoneroBlockHeader(respHeader) {
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
      else if (key === "prev_hash" || key === "prev_id") header.setPrevHash(val);
      else if (key === "reward") header.setReward(new BigInteger(val));
      else if (key === "timestamp") header.setTimestamp(val);
      else if (key === "block_weight") header.setBlockWeight(val);
      else if (key === "pow_hash") header.setPowHash(val === "" ? undefined : val);
      //else console.log("WARNING: ignoring unexpected block header field: '" + key + "': " + val); // TODO: if ignoring warning, use safe set like below
    }
    return header;
  }
  
  static _buildMoneroBlock(rpcBlock) {
    let block = new MoneroBlock();
    block.setBlob(rpcBlock.blob);
    block.setHeader(MoneroDaemonRpc._buildMoneroBlockHeader(rpcBlock.block_header ? rpcBlock.block_header : rpcBlock));
    block.setTxHashes(rpcBlock.tx_hashes === undefined ? [] : rpcBlock.tx_hashes);
    let minerTxRpc = rpcBlock.json ? JSON.parse(rpcBlock.json).miner_tx : rpcBlock.miner_tx; // get miner tx from rpc
    block.setMinerTx(MoneroDaemonRpc._buildMoneroTx(minerTxRpc));
    return block;
  }
  
  /**
   * Transfers RPC tx fields to a given MoneroTx without overwriting previous values.
   * 
   * @param rpcTx is the RPC map containing transaction fields
   * @param tx is the MoneroTx to populate with values (optional)
   * @returns tx is the same tx that was passed in or a new one if none given
   */
  static _buildMoneroTx(rpcTx, tx) {
    if (!tx) tx = new MoneroTx();
    if (rpcTx === undefined) return tx;
    MoneroUtils.safeSet(tx, tx.getHex, tx.setHex, rpcTx.as_hex);
    MoneroUtils.safeSet(tx, tx.getHeight, tx.setHeight, rpcTx.block_height);
    MoneroUtils.safeSet(tx, tx.getTimestamp, tx.setTimestamp, rpcTx.block_timestamp);
    MoneroUtils.safeSet(tx, tx.getIsDoubleSpend, tx.setIsDoubleSpend, rpcTx.double_spend_seen);
    MoneroUtils.safeSet(tx, tx.getIsConfirmed, tx.setIsConfirmed, rpcTx.in_pool === undefined ? undefined : !rpcTx.in_pool);
    MoneroUtils.safeSet(tx, tx.getId, tx.setId, rpcTx.tx_hash);
    MoneroUtils.safeSet(tx, tx.getVersion, tx.setVersion, rpcTx.version);
    MoneroUtils.safeSet(tx, tx.getExtra, tx.setExtra, rpcTx.extra);
    MoneroUtils.safeSet(tx, tx.getVin, tx.setVin, rpcTx.vin);
    MoneroUtils.safeSet(tx, tx.getVout, tx.setVout, rpcTx.vout);
    MoneroUtils.safeSet(tx, tx.getRctSignatures, tx.setRctSignatures, rpcTx.rct_signatures);
    MoneroUtils.safeSet(tx, tx.getRctSigPrunable, tx.setRctSigPrunable, rpcTx.rctsig_prunable);
    MoneroUtils.safeSet(tx, tx.getUnlockTime, tx.setUnlockTime, rpcTx.unlock_time);
    if (rpcTx.as_json) MoneroDaemonRpc._buildMoneroTx(JSON.parse(rpcTx.as_json), tx);  // may need to read tx from json str
    return tx;
  }
}

module.exports = MoneroDaemonRpc;