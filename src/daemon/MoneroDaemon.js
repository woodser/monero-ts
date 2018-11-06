/**
 * Monero daemon interface and default implementations.
 */
class MoneroDaemon {
  
  /**
   * Get the number of blocks in the longest chain known to the node.
   * 
   * @return int is the number of blocks
   */
  async getHeight() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get block headers for the given range.
   * 
   * @param startHeight is the start of the range
   * @param endHeight is the end of the range
   * @returns a list of MoneroBlockHeaders for the given range
   */
  async getBlockHeaders(startHeight, endHeight) {
    throw new Error("Subclass must implement");
  }
}

module.exports = MoneroDaemon;