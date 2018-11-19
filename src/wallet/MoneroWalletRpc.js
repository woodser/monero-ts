const MoneroRpc = require("../rpc/MoneroRpc");
const MoneroWallet = require("./MoneroWallet");

/**
 * Implements a Monero wallet using monero-wallet-rpc.
 */
class MoneroWalletRpc extends MoneroWallet {
  
  /**
   * Constructs the wallet rpc instance.
   * 
   * @param config is the rpc configuration // TODO: config default and validation
   */
  constructor(config) {
    super();
    
    // assign config
    this.config = Object.assign({}, config);
    
    // initialize rpc if not given
    if (!this.config.rpc) this.config.rpc = new MoneroRpc(config);
  }
  
  async getHeight() {
    return (await this.config.rpc.sendJsonRpcRequest("get_height")).height;
  }
  
  
  // -------------------------------- WALLET RPC ------------------------------
  
  async createWallet() {
    throw new Error("Not implemented");
  }
}

module.exports = MoneroWalletRpc;