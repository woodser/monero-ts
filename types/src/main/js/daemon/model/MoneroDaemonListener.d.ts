export = MoneroDaemonListener;
/**
 * Receives notifications as a daemon is updated.
 */
declare class MoneroDaemonListener {
    /**
     * Called when a new block is added to the chain.
     *
     * @param {MoneroBlockHeader} header - the header of the block added to the chain
     */
    onBlockHeader(header: MoneroBlockHeader): Promise<void>;
    lastHeader: MoneroBlockHeader;
    /**
     * Get the last notified block header.
     *
     * @return {MoneroBlockHeader} the last notified block header
     */
    getLastBlockHeader(): MoneroBlockHeader;
}
