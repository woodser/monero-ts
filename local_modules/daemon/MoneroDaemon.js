/**
 * Monero daemon interface and default implementations.
 */
class MoneroDaemon {
  
  /**
   * Get how many blocks are in the longest chain known to the node.
   * 
   * @return int is the block count
   */
  async getHeight() {
    throw new Error("Subclass must implemented");
  }
}

module.exports = MoneroDaemon;