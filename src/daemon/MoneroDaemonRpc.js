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
      else if (key === "difficulty") throw new Error("Not implemented");
      else if (key === "hash") throw new Error("Not implemented");
      else if (key === "height") throw new Error("Not implemented");
      else if (key === "major_version") throw new Error("Not implemented");
      else if (key === "minor_version") throw new Error("Not implemented");
      else if (key === "nonce") throw new Error("Not implemented");
      else if (key === "num_txes") throw new Error("Not implemented");
      else if (key === "orphan_status") throw new Error("Not implemented");
      else if (key === "prev_hash") throw new Error("Not implemented");
      else if (key === "reward") throw new Error("Not implemented");
      else if (key === "timestamp") throw new Error("Not implemented");
      else console.log("WARNING: ignoring unexpected block header field: '" + key + "'");
    }
    return header;
  }
}

module.exports = MoneroDaemonRpc;