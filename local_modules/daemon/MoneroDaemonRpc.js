const MoneroDaemon = require("./MoneroDaemon");

/**
 * Implements a Monero daemon using monero-daemon-rpc.
 */
class MoneroDaemonRpc extends MoneroDaemon {
  
  constructor(rpcConnection) {
    super();
    throw new Error("Not implemented");
  }
  
  async getHeight() {
    throw new Error("Not implemented");
  }
}

modules.export = MoneroDaemonRpc;