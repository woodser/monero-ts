const MoneroDaemon = require("./MoneroDaemon");

/**
 * Implements a Monero daemon using monero-daemon-rpc.
 */
class MoneroDaemonRpc extends MoneroDaemon {
  
  constructor() {
    throw new Error("Not implemented");
  }
  
  async getHeight() {
    throw new Error("Not implemented");
  }
}