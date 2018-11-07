const BigInteger = require("../mymonero_core_js/cryptonote_utils/biginteger").BigInteger;
const MoneroRpc = require("../rpc/MoneroRpc")
const MoneroDaemon = require("./MoneroDaemon");
const MoneroDaemonResponseInfo = require("./model/MoneroDaemonResponseInfo"); 
const MoneroHeight = require("./model/MoneroHeight");
const MoneroBlockHeader = require("./model/MoneroBlockHeader");

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
    let resp = await this.rpc.sendJsonRpcRequest("get_block_count");
    let height = new MoneroHeight(resp.count);
    MoneroDaemonRpc._setResponseInfo(resp, height);
    return height;
  }
  
  async getBlockHeaders(startHeight, endHeight) {
    
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
  
  async getBlocks(heights) {
    // TODO: validate input heights
    
    // fetch blocks
    let resp = await this.rpc.sendBinRpcRequest("get_blocks_by_height.bin", {
      heights: heights
    })
    
    console.log(resp);
    throw new Error("Not implemented");
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
}

module.exports = MoneroDaemonRpc;