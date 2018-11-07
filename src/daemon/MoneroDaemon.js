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
   * @param startHeight is the start height lower bound (optional)
   * @param endHeight is the end height lower bound (optional)
   * @returns List<MoneroBlockHeader> for the given range
   */
  async getBlockHeadersByRange(startHeight, endHeight) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get a block by hash.
   * 
   * @param hash is the hash of the block to get
   * @returns MoneroBlock with the given hash
   */
  async getBlockByHash(hash) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get a block by height.
   * 
   * @param height is the height of the block to get
   * @returns MoneroBlock with the given height
   */
  async getBlockByHeight(height) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get blocks at the given heights.
   * 
   * @param heights are the heights of the blocks to get
   * @returns a list of blocks at the given heights
   */
  async getBlocksByHeight(heights) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get blocks in the given height range.
   * 
   * @param startHeight is the start height lower bound (optional)
   * @param endHeight is the end height lower bound (optional)
   * @returns List<MoneroBlock> are blocks in the given height range
   */
  async getBlocksByRange(startHeight, endHeight) {
    throw new Error("Subclass must implement");
  }
}

module.exports = MoneroDaemon;