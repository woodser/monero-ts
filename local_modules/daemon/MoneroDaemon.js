/**
 * Monero daemon interface and default implementations.
 */
class MoneroDaemon {
  
  /**
   * Get how many blocks are in the longest chain known to the node.
   * 
   * @return MoneroBlockCount contains the block count and response status
   */
  async getHeight() {
    throw new Error("Subclass must implemented");
  }
}

module.exports = MoneroDaemon;