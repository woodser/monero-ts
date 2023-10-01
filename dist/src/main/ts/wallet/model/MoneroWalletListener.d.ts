import MoneroOutputWallet from "./MoneroOutputWallet";
/**
 * Default wallet listener which takes no action on notifications.
 */
export default class MoneroWalletListener {
    /**
     * Invoked as the wallet is synchronized.
     *
     * @param {number} height - height of the synced block
     * @param {number} startHeight - starting height of the sync request
     * @param {number} endHeight - ending height of the sync request
     * @param {number} percentDone - sync progress as a percentage
     * @param {string} message - human-readable description of the current progress
     * @return {Promise<void>}
     */
    onSyncProgress(height: number, startHeight: number, endHeight: number, percentDone: number, message: string): Promise<void>;
    /**
     * Invoked when a new block is added to the chain.
     *
     * @param {number} height - the height of the new block (i.e. the number of blocks before it).
     * @return {Promise<void>}
     */
    onNewBlock(height: number): Promise<void>;
    /**
     * Invoked when the wallet's balances change.
     *
     * @param {bigint} newBalance - new wallet balance
     * @param {bigint} newUnlockedBalance - new unlocked wallet balance
     * @return {Promise<void>}
     */
    onBalancesChanged(newBalance: bigint, newUnlockedBalance: bigint): Promise<void>;
    /**
     * Invoked 3 times per received output: once when unconfirmed, once when confirmed, and
     * once when unlocked.
     *
     * The notified output includes basic fields only, so the output or its transaction should be fetched to get all available fields.
     *
     * @param {MoneroOutputWallet} output - the received output
     * @return {Promise<void>}
     */
    onOutputReceived(output: MoneroOutputWallet): Promise<void>;
    /**
     * Invoked twice per spent output: once when confirmed and once when unlocked.
     *
     * The notified output includes basic fields only, so the output or its transaction should be fetched to get all available fields.
     *
     * @param {MoneroOutputWallet} output - the spent output
     * @return {Promise<void>}
     */
    onOutputSpent(output: any): Promise<void>;
}
