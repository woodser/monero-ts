/**
 * Monero daemon interface and default implementations.
 */
class MoneroDaemonBase {
  
  /**
   * Get how many blocks are in the longest chain known to the node.
   * 
   * @return MoneroBlockCount contains the block count and response status
   */
  async getHeight() {
    throw new Error("Subclass must implemented");
  }
}

modules.export = MoneroDaemonBase;