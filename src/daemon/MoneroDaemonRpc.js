const MoneroDaemon = require("./MoneroDaemon");
const MoneroRpc = require("../rpc/MoneroRpc")

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
    return resp.count;
  }
  
  async getBlockHeaders(startHeight, endHeight) {
    throw new Error("Not implemented");
  }
}

module.exports = MoneroDaemonRpc;