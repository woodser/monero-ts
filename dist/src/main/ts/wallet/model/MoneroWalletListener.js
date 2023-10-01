"use strict";Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;

/**
 * Default wallet listener which takes no action on notifications.
 */
class MoneroWalletListener {

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
  async onSyncProgress(height, startHeight, endHeight, percentDone, message) {}

  /**
   * Invoked when a new block is added to the chain.
   * 
   * @param {number} height - the height of the new block (i.e. the number of blocks before it).
   * @return {Promise<void>}
   */
  async onNewBlock(height) {}

  /**
   * Invoked when the wallet's balances change.
   * 
   * @param {bigint} newBalance - new wallet balance
   * @param {bigint} newUnlockedBalance - new unlocked wallet balance
   * @return {Promise<void>}
   */
  async onBalancesChanged(newBalance, newUnlockedBalance) {}

  /**
   * Invoked 3 times per received output: once when unconfirmed, once when confirmed, and
   * once when unlocked.
   * 
   * The notified output includes basic fields only, so the output or its transaction should be fetched to get all available fields.
   * 
   * @param {MoneroOutputWallet} output - the received output
   * @return {Promise<void>}
   */
  async onOutputReceived(output) {}

  /**
   * Invoked twice per spent output: once when confirmed and once when unlocked.
   * 
   * The notified output includes basic fields only, so the output or its transaction should be fetched to get all available fields.
   * 
   * @param {MoneroOutputWallet} output - the spent output
   * @return {Promise<void>}
   */
  async onOutputSpent(output) {}
}exports.default = MoneroWalletListener;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJNb25lcm9XYWxsZXRMaXN0ZW5lciIsIm9uU3luY1Byb2dyZXNzIiwiaGVpZ2h0Iiwic3RhcnRIZWlnaHQiLCJlbmRIZWlnaHQiLCJwZXJjZW50RG9uZSIsIm1lc3NhZ2UiLCJvbk5ld0Jsb2NrIiwib25CYWxhbmNlc0NoYW5nZWQiLCJuZXdCYWxhbmNlIiwibmV3VW5sb2NrZWRCYWxhbmNlIiwib25PdXRwdXRSZWNlaXZlZCIsIm91dHB1dCIsIm9uT3V0cHV0U3BlbnQiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL3dhbGxldC9tb2RlbC9Nb25lcm9XYWxsZXRMaXN0ZW5lci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTW9uZXJvT3V0cHV0V2FsbGV0IGZyb20gXCIuL01vbmVyb091dHB1dFdhbGxldFwiO1xuXG4vKipcbiAqIERlZmF1bHQgd2FsbGV0IGxpc3RlbmVyIHdoaWNoIHRha2VzIG5vIGFjdGlvbiBvbiBub3RpZmljYXRpb25zLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9XYWxsZXRMaXN0ZW5lciB7XG4gIFxuICAvKipcbiAgICogSW52b2tlZCBhcyB0aGUgd2FsbGV0IGlzIHN5bmNocm9uaXplZC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgLSBoZWlnaHQgb2YgdGhlIHN5bmNlZCBibG9jayBcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN0YXJ0SGVpZ2h0IC0gc3RhcnRpbmcgaGVpZ2h0IG9mIHRoZSBzeW5jIHJlcXVlc3RcbiAgICogQHBhcmFtIHtudW1iZXJ9IGVuZEhlaWdodCAtIGVuZGluZyBoZWlnaHQgb2YgdGhlIHN5bmMgcmVxdWVzdFxuICAgKiBAcGFyYW0ge251bWJlcn0gcGVyY2VudERvbmUgLSBzeW5jIHByb2dyZXNzIGFzIGEgcGVyY2VudGFnZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSAtIGh1bWFuLXJlYWRhYmxlIGRlc2NyaXB0aW9uIG9mIHRoZSBjdXJyZW50IHByb2dyZXNzXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBvblN5bmNQcm9ncmVzcyhoZWlnaHQ6IG51bWJlciwgc3RhcnRIZWlnaHQ6IG51bWJlciwgZW5kSGVpZ2h0OiBudW1iZXIsIHBlcmNlbnREb25lOiBudW1iZXIsIG1lc3NhZ2U6IHN0cmluZykgeyB9XG5cbiAgLyoqXG4gICAqIEludm9rZWQgd2hlbiBhIG5ldyBibG9jayBpcyBhZGRlZCB0byB0aGUgY2hhaW4uXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gaGVpZ2h0IC0gdGhlIGhlaWdodCBvZiB0aGUgbmV3IGJsb2NrIChpLmUuIHRoZSBudW1iZXIgb2YgYmxvY2tzIGJlZm9yZSBpdCkuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBvbk5ld0Jsb2NrKGhlaWdodDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7IH1cbiAgXG4gIC8qKlxuICAgKiBJbnZva2VkIHdoZW4gdGhlIHdhbGxldCdzIGJhbGFuY2VzIGNoYW5nZS5cbiAgICogXG4gICAqIEBwYXJhbSB7YmlnaW50fSBuZXdCYWxhbmNlIC0gbmV3IHdhbGxldCBiYWxhbmNlXG4gICAqIEBwYXJhbSB7YmlnaW50fSBuZXdVbmxvY2tlZEJhbGFuY2UgLSBuZXcgdW5sb2NrZWQgd2FsbGV0IGJhbGFuY2VcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIG9uQmFsYW5jZXNDaGFuZ2VkKG5ld0JhbGFuY2U6IGJpZ2ludCwgbmV3VW5sb2NrZWRCYWxhbmNlOiBiaWdpbnQpOiBQcm9taXNlPHZvaWQ+IHsgfVxuXG4gIC8qKlxuICAgKiBJbnZva2VkIDMgdGltZXMgcGVyIHJlY2VpdmVkIG91dHB1dDogb25jZSB3aGVuIHVuY29uZmlybWVkLCBvbmNlIHdoZW4gY29uZmlybWVkLCBhbmRcbiAgICogb25jZSB3aGVuIHVubG9ja2VkLlxuICAgKiBcbiAgICogVGhlIG5vdGlmaWVkIG91dHB1dCBpbmNsdWRlcyBiYXNpYyBmaWVsZHMgb25seSwgc28gdGhlIG91dHB1dCBvciBpdHMgdHJhbnNhY3Rpb24gc2hvdWxkIGJlIGZldGNoZWQgdG8gZ2V0IGFsbCBhdmFpbGFibGUgZmllbGRzLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9PdXRwdXRXYWxsZXR9IG91dHB1dCAtIHRoZSByZWNlaXZlZCBvdXRwdXRcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIG9uT3V0cHV0UmVjZWl2ZWQob3V0cHV0OiBNb25lcm9PdXRwdXRXYWxsZXQpOiBQcm9taXNlPHZvaWQ+IHsgfVxuICBcbiAgLyoqXG4gICAqIEludm9rZWQgdHdpY2UgcGVyIHNwZW50IG91dHB1dDogb25jZSB3aGVuIGNvbmZpcm1lZCBhbmQgb25jZSB3aGVuIHVubG9ja2VkLlxuICAgKiBcbiAgICogVGhlIG5vdGlmaWVkIG91dHB1dCBpbmNsdWRlcyBiYXNpYyBmaWVsZHMgb25seSwgc28gdGhlIG91dHB1dCBvciBpdHMgdHJhbnNhY3Rpb24gc2hvdWxkIGJlIGZldGNoZWQgdG8gZ2V0IGFsbCBhdmFpbGFibGUgZmllbGRzLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9PdXRwdXRXYWxsZXR9IG91dHB1dCAtIHRoZSBzcGVudCBvdXRwdXRcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIG9uT3V0cHV0U3BlbnQob3V0cHV0KTogUHJvbWlzZTx2b2lkPiB7IH1cbn1cbiJdLCJtYXBwaW5ncyI6Ijs7QUFFQTtBQUNBO0FBQ0E7QUFDZSxNQUFNQSxvQkFBb0IsQ0FBQzs7RUFFeEM7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNQyxjQUFjQSxDQUFDQyxNQUFjLEVBQUVDLFdBQW1CLEVBQUVDLFNBQWlCLEVBQUVDLFdBQW1CLEVBQUVDLE9BQWUsRUFBRSxDQUFFOztFQUVySDtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7RUFDRSxNQUFNQyxVQUFVQSxDQUFDTCxNQUFjLEVBQWlCLENBQUU7O0VBRWxEO0FBQ0Y7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTU0saUJBQWlCQSxDQUFDQyxVQUFrQixFQUFFQyxrQkFBMEIsRUFBaUIsQ0FBRTs7RUFFekY7QUFDRjtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTUMsZ0JBQWdCQSxDQUFDQyxNQUEwQixFQUFpQixDQUFFOztFQUVwRTtBQUNGO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0VBQ0UsTUFBTUMsYUFBYUEsQ0FBQ0QsTUFBTSxFQUFpQixDQUFFO0FBQy9DLENBQUNFLE9BQUEsQ0FBQUMsT0FBQSxHQUFBZixvQkFBQSJ9