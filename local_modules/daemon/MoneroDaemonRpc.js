const MoneroDaemonBase = require("./MoneroDaemonBase");

/**
 * Implements a Monero daemon using monero-daemon-rpc.
 */
class MoneroDaemonRpc extends MoneroDaemonBase {
  
  constructor() {
    throw new Error("Not implemented");
  }
  
  async getHeight() {
    throw new Error("Not implemented");
  }
}