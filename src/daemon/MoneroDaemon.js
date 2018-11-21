/**
 * Monero daemon interface and default implementations.
 */
class MoneroDaemon {
  
  /**
   * Get the number of blocks in the longest chain known to the node.
   * 
   * @returns the number of blocks
   */
  async getHeight() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get a block's hash by its height.
   * 
   * @param height is the height of the block hash to get
   * @returns the block's hash at the given height
   */
  async getBlockHash(height) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get a block template for mining a new block.
   * 
   * @param walletAddress is the address of the wallet to receive coinbase transactions if block is successfully mined
   * @param reserveSize is the reserve size
   * @return MoneroBlockTemplate is a block template for mining a new block
   */
  async getBlockTemplate(walletAddress, reserveSize) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get the last block's header.
   * 
   * @returns MoneroBlockHeader is the last block's header
   */
  async getLastBlockHeader() {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get a block header by its hash.
   * 
   * @param hash is the hash of the block to get the header of
   * @return MoneroBlockHeader is the block's header
   */
  async getBlockHeaderByHash(hash) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get a block header by its height.
   * 
   * @param height is the height of the block to get the header of
   * @return MoneroBlockHeader is the block's header
   */
  async getBlockHeaderByHeight(height) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get block headers for the given range.
   * 
   * @param startHeight is the start height lower bound inclusive (optional)
   * @param endHeight is the end height upper bound inclusive (optional)
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
   * @returns List<MoneroBlock> are blocks at the given heights
   */
  async getBlocksByHeight(heights) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get blocks in the given height range.
   * 
   * @param startHeight is the start height lower bound inclusive (optional)
   * @param endHeight is the end height upper bound inclusive (optional)
   * @returns List<MoneroBlock> are blocks in the given height range
   */
  async getBlocksByRange(startHeight, endHeight) {
    throw new Error("Subclass must implement");
  }
  
  /**
   * Get transactions with the given hashes.
   * 
   * @param txHashes specifies the transaction hashes to get
   * @param decodeAsJson decodes the returned transactions as JSON rather than binary if true
   * @param prune (documentation missing) // TODO: documentation missing
   * @returns List<MoneroTx> are the transactions with the given hashes
   */
  async getTxs(txHashes, decodeAsJson, prune) {
    throw new Error("Subclass must implement");
  }
}

module.exports = MoneroDaemon;