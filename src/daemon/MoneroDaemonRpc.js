const MoneroRpc = require("../rpc/MoneroRpc")
const MoneroDaemon = require("./MoneroDaemon");
const MoneroDaemonResponseInfo = require("./model/MoneroDaemonResponseInfo"); 
const MoneroHeight = require("./model/MoneroHeight");

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
      let header = MoneroDaemonRpc._initializeBlockHeader(resp.respHeader);
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
    throw new Error("Not implemented");
  }
}

module.exports = MoneroDaemonRpc;