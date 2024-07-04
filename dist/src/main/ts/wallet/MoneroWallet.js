"use strict";var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");Object.defineProperty(exports, "__esModule", { value: true });exports.default = void 0;var _assert = _interopRequireDefault(require("assert"));




var _MoneroBlock = _interopRequireDefault(require("../daemon/model/MoneroBlock"));



var _MoneroConnectionManagerListener = _interopRequireDefault(require("../common/MoneroConnectionManagerListener"));
var _MoneroError = _interopRequireDefault(require("../common/MoneroError"));





var _MoneroMessageSignatureType = _interopRequireDefault(require("./model/MoneroMessageSignatureType"));



var _MoneroOutputQuery = _interopRequireDefault(require("./model/MoneroOutputQuery"));






var _MoneroTransferQuery = _interopRequireDefault(require("./model/MoneroTransferQuery"));
var _MoneroTxConfig = _interopRequireDefault(require("./model/MoneroTxConfig"));
var _MoneroTxQuery = _interopRequireDefault(require("./model/MoneroTxQuery"));

var _MoneroTxSet = _interopRequireDefault(require("./model/MoneroTxSet"));
var _MoneroUtils = _interopRequireDefault(require("../common/MoneroUtils"));

var _MoneroWalletListener = _interopRequireDefault(require("./model/MoneroWalletListener"));

/**
 * Copyright (c) woodser
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Monero wallet interface and default implementations.
 * 
 * @interface
 */
class MoneroWallet {

  // static variables
  static DEFAULT_LANGUAGE = "English";

  // state variables


  listeners = [];
  _isClosed = false;

  /**
   * Hidden constructor.
   * 
   * @private
   */
  constructor() {

    // no code needed
  }
  /**
   * Register a listener to receive wallet notifications.
   * 
   * @param {MoneroWalletListener} listener - listener to receive wallet notifications
   * @return {Promise<void>}
   */
  async addListener(listener) {
    (0, _assert.default)(listener instanceof _MoneroWalletListener.default, "Listener must be instance of MoneroWalletListener");
    this.listeners.push(listener);
  }

  /**
   * Unregister a listener to receive wallet notifications.
   * 
   * @param {MoneroWalletListener} listener - listener to unregister
   * @return {Promise<void>}
   */
  async removeListener(listener) {
    let idx = this.listeners.indexOf(listener);
    if (idx > -1) this.listeners.splice(idx, 1);else
    throw new _MoneroError.default("Listener is not registered with wallet");
  }

  /**
   * Get the listeners registered with the wallet.
   * 
   * @return {MoneroWalletListener[]} the registered listeners
   */
  getListeners() {
    return this.listeners;
  }

  /**
   * Indicates if the wallet is view-only, meaning it does not have the private
   * spend key and can therefore only observe incoming outputs.
   * 
   * @return {Promise<boolean>} true if the wallet is view-only, false otherwise
   */
  async isViewOnly() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Set the wallet's daemon connection.
   * 
   * @param {MoneroRpcConnection | string} [uriOrConnection] - daemon's URI or connection (defaults to offline)
   * @return {Promise<void>}
   */
  async setDaemonConnection(uriOrConnection) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get the wallet's daemon connection.
   * 
   * @return {Promise<MoneroRpcConnection>} the wallet's daemon connection
   */
  async getDaemonConnection() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Set the wallet's daemon connection manager.
   * 
   * @param {MoneroConnectionManager} connectionManager manages connections to monerod
   * @return {Promise<void>}
   */
  async setConnectionManager(connectionManager) {
    if (this.connectionManager) this.connectionManager.removeListener(this.connectionManagerListener);
    this.connectionManager = connectionManager;
    if (!connectionManager) return;
    let that = this;
    if (!this.connectionManagerListener) this.connectionManagerListener = new class extends _MoneroConnectionManagerListener.default {
      async onConnectionChanged(connection) {
        await that.setDaemonConnection(connection);
      }
    }();
    connectionManager.addListener(this.connectionManagerListener);
    await this.setDaemonConnection(connectionManager.getConnection());
  }

  /**
   * Get the wallet's daemon connection manager.
   * 
   * @return {Promise<MoneroConnectionManager>} the wallet's daemon connection manager
   */
  async getConnectionManager() {
    return this.connectionManager;
  }

  /**
   * Indicates if the wallet is connected to daemon.
   * 
   * @return {Promise<boolean>} true if the wallet is connected to a daemon, false otherwise
   */
  async isConnectedToDaemon() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Gets the version of the wallet.
   * 
   * @return {Promise<MoneroVersion>} the version of the wallet
   */
  async getVersion() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get the wallet's path.
   * 
   * @return {Promise<string>} the path the wallet can be opened with
   */
  async getPath() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get the wallet's mnemonic phrase or seed.
   * 
   * @return {Promise<string>} the wallet's mnemonic phrase or seed.
   */
  async getSeed() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get the language of the wallet's mnemonic phrase or seed.
   * 
   * @return {Promise<string>} the language of the wallet's mnemonic phrase or seed.
   */
  async getSeedLanguage() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get the wallet's private view key.
   * 
   * @return {Promise<string>} the wallet's private view key
   */
  async getPrivateViewKey() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get the wallet's private spend key.
   * 
   * @return {Promise<string>} the wallet's private spend key
   */
  async getPrivateSpendKey() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get the wallet's public view key.
   * 
   * @return {Promise<string>} the wallet's public view key
   */
  async getPublicViewKey() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get the wallet's public spend key.
   * 
   * @return {Promise<string>} the wallet's public spend key
   */
  async getPublicSpendKey() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get the wallet's primary address.
   * 
   * @return {Promise<string>} the wallet's primary address
   */
  async getPrimaryAddress() {
    return await this.getAddress(0, 0);
  }

  /**
   * Get the address of a specific subaddress.
   * 
   * @param {number} accountIdx - the account index of the address's subaddress
   * @param {number} subaddressIdx - the subaddress index within the account
   * @return {Promise<string>} the receive address of the specified subaddress
   */
  async getAddress(accountIdx, subaddressIdx) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get the account and subaddress index of the given address.
   * 
   * @param {string} address - address to get the account and subaddress index from
   * @return {Promise<MoneroSubaddress>} the account and subaddress indices
   */
  async getAddressIndex(address) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get an integrated address based on the given standard address and payment
   * ID. Uses the wallet's primary address if an address is not given.
   * Generates a random payment ID if a payment ID is not given.
   * 
   * @param {string} standardAddress is the standard address to generate the integrated address from (wallet's primary address if undefined)
   * @param {string} paymentId is the payment ID to generate an integrated address from (randomly generated if undefined)
   * @return {Promise<MoneroIntegratedAddress>} the integrated address
   */
  async getIntegratedAddress(standardAddress, paymentId) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Decode an integrated address to get its standard address and payment id.
   * 
   * @param {string} integratedAddress - integrated address to decode
   * @return {Promise<MoneroIntegratedAddress>} the decoded integrated address including standard address and payment id
   */
  async decodeIntegratedAddress(integratedAddress) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get the block height that the wallet is synced to.
   * 
   * @return {Promise<number>} the block height that the wallet is synced to
   */
  async getHeight() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get the blockchain's height.
   * 
   * @return {Promise<number>} the blockchain's height
   */
  async getDaemonHeight() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get the blockchain's height by date as a conservative estimate for scanning.
   * 
   * @param {number} year - year of the height to get
   * @param {number} month - month of the height to get as a number between 1 and 12
   * @param {number} day - day of the height to get as a number between 1 and 31
   * @return {Promise<number>} the blockchain's approximate height at the given date
   */
  async getHeightByDate(year, month, day) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Synchronize the wallet with the daemon as a one-time synchronous process.
   * 
   * @param {MoneroWalletListener|number} [listenerOrStartHeight] - listener xor start height (defaults to no sync listener, the last synced block)
   * @param {number} [startHeight] - startHeight if not given in first arg (defaults to last synced block)
   * @return {Promise<void>}
   */
  async sync(listenerOrStartHeight, startHeight) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Start background synchronizing with a maximum period between syncs.
   * 
   * @param {number} [syncPeriodInMs] - maximum period between syncs in milliseconds (default is wallet-specific)
   * @return {Promise<void>}
   */
  async startSyncing(syncPeriodInMs) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Stop synchronizing the wallet with the daemon.
   * 
   * @return {Promise<void>}
   */
  async stopSyncing() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Scan transactions by their hash/id.
   * 
   * @param {string[]} txHashes - tx hashes to scan
   * @return {Promise<void>}
   */
  async scanTxs(txHashes) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * <p>Rescan the blockchain for spent outputs.</p>
   * 
   * <p>Note: this can only be called with a trusted daemon.</p>
   * 
   * <p>Example use case: peer multisig hex is import when connected to an untrusted daemon,
   * so the wallet will not rescan spent outputs.  Then the wallet connects to a trusted
   * daemon.  This method should be manually invoked to rescan outputs.</p>
   * 
   * @return {Promise<void>}
   */
  async rescanSpent() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * <p>Rescan the blockchain from scratch, losing any information which cannot be recovered from
   * the blockchain itself.</p>
   * 
   * <p>WARNING: This method discards local wallet data like destination addresses, tx secret keys,
   * tx notes, etc.</p>
   * 
   * @return {Promise<void>}
   */
  async rescanBlockchain() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get the balance of the wallet, account, or subaddress.
   * 
   * @param {number} [accountIdx] - index of the account to get the balance of (default all accounts)
   * @param {number} [subaddressIdx] - index of the subaddress to get the balance of (default all subaddresses)
   * @return {Promise<bigint>} the balance of the wallet, account, or subaddress
   */
  async getBalance(accountIdx, subaddressIdx) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get the unlocked balance of the wallet, account, or subaddress.
   * 
   * @param {number} [accountIdx] - index of the account to get the unlocked balance of (optional)
   * @param {number} [subaddressIdx] - index of the subaddress to get the unlocked balance of (optional)
   * @return {Promise<bigint>} the unlocked balance of the wallet, account, or subaddress
   */
  async getUnlockedBalance(accountIdx, subaddressIdx) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get the number of blocks until the next and last funds unlock. Ignores txs with unlock time as timestamp.
   * 
   * @return {Promise<number[]>} the number of blocks until the next and last funds unlock in elements 0 and 1, respectively, or undefined if no balance
   */
  async getNumBlocksToUnlock() {

    // get balances
    let balance = await this.getBalance();
    if (balance === 0n) return [undefined, undefined]; // skip if no balance
    let unlockedBalance = await this.getUnlockedBalance();

    // compute number of blocks until next funds available
    let txs;
    let height;
    let numBlocksToNextUnlock = undefined;
    if (unlockedBalance > 0n) numBlocksToNextUnlock = 0;else
    {
      txs = await this.getTxs({ isLocked: true }); // get locked txs
      height = await this.getHeight(); // get most recent height
      for (let tx of txs) {
        if (!tx.getIsConfirmed() && _MoneroUtils.default.isTimestamp(tx.getUnlockTime())) continue;
        let numBlocksToUnlock = Math.max((tx.getIsConfirmed() ? tx.getHeight() : height) + 10, Number(tx.getUnlockTime())) - height;
        numBlocksToNextUnlock = numBlocksToNextUnlock === undefined ? numBlocksToUnlock : Math.min(numBlocksToNextUnlock, numBlocksToUnlock);
      }
    }

    // compute number of blocks until all funds available
    let numBlocksToLastUnlock = undefined;
    if (balance === unlockedBalance) {
      if (unlockedBalance > 0n) numBlocksToLastUnlock = 0;
    } else {
      if (!txs) {
        txs = await this.getTxs({ isLocked: true }); // get locked txs
        height = await this.getHeight(); // get most recent height
      }
      for (let tx of txs) {
        if (!tx.getIsConfirmed() && _MoneroUtils.default.isTimestamp(tx.getUnlockTime())) continue;
        let numBlocksToUnlock = Math.max((tx.getIsConfirmed() ? tx.getHeight() : height) + 10, Number(tx.getUnlockTime())) - height;
        numBlocksToLastUnlock = numBlocksToLastUnlock === undefined ? numBlocksToUnlock : Math.max(numBlocksToLastUnlock, numBlocksToUnlock);
      }
    }

    return [numBlocksToNextUnlock, numBlocksToLastUnlock];
  }

  /**
   * Get accounts with a given tag.
   * 
   * @param {boolean} includeSubaddresses - include subaddresses if true
   * @param {string} tag - tag for filtering accounts, all accounts if undefined
   * @return {Promise<MoneroAccount[]>} all accounts with the given tag
   */
  async getAccounts(includeSubaddresses, tag) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get an account.
   * 
   * @param {number} accountIdx - index of the account to get
   * @param {boolean} includeSubaddresses - include subaddresses if true
   * @return {Promise<MoneroAccount>} the retrieved account
   */
  async getAccount(accountIdx, includeSubaddresses) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Create a new account with a label for the first subaddress.
   * 
   * @param {string} [label] - label for account's first subaddress (optional)
   * @return {Promise<MoneroAccount>} the created account
   */
  async createAccount(label) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Set an account label.
   * 
   * @param {number} accountIdx - index of the account to set the label for
   * @param {string} label - the label to set
   * @return {Promise<void>}
   */
  async setAccountLabel(accountIdx, label) {
    await this.setSubaddressLabel(accountIdx, 0, label);
  }

  /**
   * Get subaddresses in an account.
   * 
   * @param {number} accountIdx - account to get subaddresses within
   * @param {number[]} [subaddressIndices] - indices of subaddresses to get (optional)
   * @return {Promise<MoneroSubaddress[]>} the retrieved subaddresses
   */
  async getSubaddresses(accountIdx, subaddressIndices) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get a subaddress.
   * 
   * @param {number} accountIdx - index of the subaddress's account
   * @param {number} subaddressIdx - index of the subaddress within the account
   * @return {Promise<MoneroSubaddress>} the retrieved subaddress
   */
  async getSubaddress(accountIdx, subaddressIdx) {
    (0, _assert.default)(accountIdx >= 0);
    (0, _assert.default)(subaddressIdx >= 0);
    return (await this.getSubaddresses(accountIdx, [subaddressIdx]))[0];
  }

  /**
   * Create a subaddress within an account.
   * 
   * @param {number} accountIdx - index of the account to create the subaddress within
   * @param {string} [label] - the label for the subaddress (optional)
   * @return {Promise<MoneroSubaddress>} the created subaddress
   */
  async createSubaddress(accountIdx, label) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Set a subaddress label.
   * 
   * @param {number} accountIdx - index of the account to set the label for
   * @param {number} subaddressIdx - index of the subaddress to set the label for
   * @param {Promise<string>} label - the label to set
   */
  async setSubaddressLabel(accountIdx, subaddressIdx, label) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get a wallet transaction by hash.
   * 
   * @param {string} txHash - hash of a transaction to get
   * @return {Promise<MoneroTxWallet> } the identified transaction or undefined if not found
   */
  async getTx(txHash) {
    let txs = await this.getTxs([txHash]);
    return txs.length === 0 ? undefined : txs[0];
  }

  /**
   * <p>Get wallet transactions.  Wallet transactions contain one or more
   * transfers that are either incoming or outgoing to the wallet.<p>
   * 
   * <p>Results can be filtered by passing a query object.  Transactions must
   * meet every criteria defined in the query in order to be returned.  All
   * criteria are optional and no filtering is applied when not defined.</p>
   * 
   * @param {string[] | MoneroTxQuery} [query] - configures the query (optional)
   * @param {boolean} [query.isConfirmed] - get txs that are confirmed or not (optional)
   * @param {boolean} [query.inTxPool] - get txs that are in the tx pool or not (optional)
   * @param {boolean} [query.isRelayed] - get txs that are relayed or not (optional)
   * @param {boolean} [query.isFailed] - get txs that are failed or not (optional)
   * @param {boolean} [query.isMinerTx] - get miner txs or not (optional)
   * @param {string} [query.hash] - get a tx with the hash (optional)
   * @param {string[]} [query.hashes] - get txs with the hashes (optional)
   * @param {string} [query.paymentId] - get transactions with the payment id (optional)
   * @param {string[]} [query.paymentIds] - get transactions with the payment ids (optional)
   * @param {boolean} [query.hasPaymentId] - get transactions with a payment id or not (optional)
   * @param {number} [query.minHeight] - get txs with height >= the given height (optional)
   * @param {number} [query.maxHeight] - get txs with height <= the given height (optional)
   * @param {boolean} [query.isOutgoing] - get txs with an outgoing transfer or not (optional)
   * @param {boolean} [query.isIncoming] - get txs with an incoming transfer or not (optional)
   * @param {MoneroTransferQuery} [query.transferQuery] - get txs that have a transfer that meets this query (optional)
   * @param {boolean} [query.includeOutputs] - specifies that tx outputs should be returned with tx results (optional)
   * @return {Promise<MoneroTxWallet[]>} wallet transactions per the configuration
   */
  async getTxs(query) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * <p>Get incoming and outgoing transfers to and from this wallet.  An outgoing
   * transfer represents a total amount sent from one or more subaddresses
   * within an account to individual destination addresses, each with their
   * own amount.  An incoming transfer represents a total amount received into
   * a subaddress within an account.  Transfers belong to transactions which
   * are stored on the blockchain.</p>
   * 
   * <p>Results can be filtered by passing a query object.  Transfers must
   * meet every criteria defined in the query in order to be returned.  All
   * criteria are optional and no filtering is applied when not defined.</p>
   * 
   * @param {MoneroTransferQuery} [query] - configures the query (optional)
   * @param {boolean} [query.isOutgoing] - get transfers that are outgoing or not (optional)
   * @param {boolean} [query.isIncoming] - get transfers that are incoming or not (optional)
   * @param {string} [query.address] - wallet's address that a transfer either originated from (if outgoing) or is destined for (if incoming) (optional)
   * @param {number} [query.accountIndex] - get transfers that either originated from (if outgoing) or are destined for (if incoming) a specific account index (optional)
   * @param {number} [query.subaddressIndex] - get transfers that either originated from (if outgoing) or are destined for (if incoming) a specific subaddress index (optional)
   * @param {int[]} [query.subaddressIndices] - get transfers that either originated from (if outgoing) or are destined for (if incoming) specific subaddress indices (optional)
   * @param {bigint} [query.amount] - amount being transferred (optional)
   * @param {MoneroDestination[] | MoneroDestinationModel[]} [query.destinations] - individual destinations of an outgoing transfer, which is local wallet data and NOT recoverable from the blockchain (optional)
   * @param {boolean} [query.hasDestinations] - get transfers that have destinations or not (optional)
   * @param {MoneroTxQuery} [query.txQuery] - get transfers whose transaction meets this query (optional)
   * @return {Promise<MoneroTransfer[]>} wallet transfers that meet the query
   */
  async getTransfers(query) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get incoming transfers.
   * 
   * @param {Partial<MoneroTransferQuery>} [query] - configures the query (optional)
   * @param {string} [query.address] - get incoming transfers to a specific address in the wallet (optional)
   * @param {number} [query.accountIndex] - get incoming transfers to a specific account index (optional)
   * @param {number} [query.subaddressIndex] - get incoming transfers to a specific subaddress index (optional)
   * @param {int[]} [query.subaddressIndices] - get transfers destined for specific subaddress indices (optional)
   * @param {bigint} [query.amount] - amount being transferred (optional)
   * @param {MoneroTxQuery} [query.txQuery] - get transfers whose transaction meets this query (optional)
   * @return {Promise<MoneroIncomingTransfer[]>} incoming transfers that meet the query
   */
  async getIncomingTransfers(query) {
    const queryNormalized = MoneroWallet.normalizeTransferQuery(query);
    if (queryNormalized.getIsIncoming() === false) throw new _MoneroError.default("Transfer query contradicts getting incoming transfers");
    queryNormalized.setIsIncoming(true);
    return this.getTransfers(queryNormalized);
  }

  /**
   * Get outgoing transfers.
   * 
   * @param {Partial<MoneroTransferQuery>} [query] - configures the query (optional)
   * @param {string} [query.address] - get outgoing transfers from a specific address in the wallet (optional)
   * @param {number} [query.accountIndex] - get outgoing transfers from a specific account index (optional)
   * @param {number} [query.subaddressIndex] - get outgoing transfers from a specific subaddress index (optional)
   * @param {int[]} [query.subaddressIndices] - get outgoing transfers from specific subaddress indices (optional)
   * @param {bigint} [query.amount] - amount being transferred (optional)
   * @param {MoneroDestination[] | MoneroDestinationModel[]} [query.destinations] - individual destinations of an outgoing transfer, which is local wallet data and NOT recoverable from the blockchain (optional)
   * @param {boolean} [query.hasDestinations] - get transfers that have destinations or not (optional)
   * @param {MoneroTxQuery} [query.txQuery] - get transfers whose transaction meets this query (optional)
   * @return {Promise<MoneroOutgoingTransfer[]>} outgoing transfers that meet the query
   */
  async getOutgoingTransfers(query) {
    const queryNormalized = MoneroWallet.normalizeTransferQuery(query);
    if (queryNormalized.getIsOutgoing() === false) throw new _MoneroError.default("Transfer query contradicts getting outgoing transfers");
    queryNormalized.setIsOutgoing(true);
    return this.getTransfers(queryNormalized);
  }

  /**
   * <p>Get outputs created from previous transactions that belong to the wallet
   * (i.e. that the wallet can spend one time).  Outputs are part of
   * transactions which are stored in blocks on the blockchain.</p>
   * 
   * <p>Results can be filtered by passing a query object.  Outputs must
   * meet every criteria defined in the query in order to be returned.  All
   * filtering is optional and no filtering is applied when not defined.</p>
   * 
   * @param {Parital<MoneroOutputQuery>} [query] - configures the query (optional)
   * @param {number} [query.accountIndex] - get outputs associated with a specific account index (optional)
   * @param {number} [query.subaddressIndex] - get outputs associated with a specific subaddress index (optional)
   * @param {int[]} [query.subaddressIndices] - get outputs associated with specific subaddress indices (optional)
   * @param {bigint} [query.amount] - get outputs with a specific amount (optional)
   * @param {bigint} [query.minAmount] - get outputs greater than or equal to a minimum amount (optional)
   * @param {bigint} [query.maxAmount] - get outputs less than or equal to a maximum amount (optional)
   * @param {boolean} [query.isSpent] - get outputs that are spent or not (optional)
   * @param {string|MoneroKeyImage} [query.keyImage] - get output with a key image or which matches fields defined in a MoneroKeyImage (optional)
   * @param {MoneroTxQuery} [query.txQuery] - get outputs whose transaction meets this filter (optional)
   * @return {Promise<MoneroOutputWallet[]>} the queried outputs
   */
  async getOutputs(query) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Export outputs in hex format.
   *
   * @param {boolean} [all] - export all outputs if true, else export the outputs since the last export (default false)
   * @return {Promise<string>} outputs in hex format
   */
  async exportOutputs(all = false) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Import outputs in hex format.
   * 
   * @param {string} outputsHex - outputs in hex format
   * @return {Promise<number>} the number of outputs imported
   */
  async importOutputs(outputsHex) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Export signed key images.
   * 
   * @param {boolean} [all] - export all key images if true, else export the key images since the last export (default false)
   * @return {Promise<MoneroKeyImage[]>} the wallet's signed key images
   */
  async exportKeyImages(all = false) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Import signed key images and verify their spent status.
   * 
   * @param {MoneroKeyImage[]} keyImages - images to import and verify (requires hex and signature)
   * @return {Promise<MoneroKeyImageImportResult>} results of the import
   */
  async importKeyImages(keyImages) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get new key images from the last imported outputs.
   * 
   * @return {Promise<MoneroKeyImage[]>} the key images from the last imported outputs
   */
  async getNewKeyImagesFromLastImport() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Freeze an output.
   * 
   * @param {string} keyImage - key image of the output to freeze
   * @return {Promise<void>}
   */
  async freezeOutput(keyImage) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Thaw a frozen output.
   * 
   * @param {string} keyImage - key image of the output to thaw
   * @return {Promise<void>}
   */
  async thawOutput(keyImage) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Check if an output is frozen.
   * 
   * @param {string} keyImage - key image of the output to check if frozen
   * @return {Promise<boolean>} true if the output is frozen, false otherwise
   */
  async isOutputFrozen(keyImage) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Create a transaction to transfer funds from this wallet.
   * 
   * @param {MoneroTxConfig} config - configures the transaction to create (required)
   * @param {string} config.address - single destination address (required unless `destinations` provided)
   * @param {bigint|string} config.amount - single destination amount (required unless `destinations` provided)
   * @param {number} config.accountIndex - source account index to transfer funds from (required)
   * @param {number} [config.subaddressIndex] - source subaddress index to transfer funds from (optional)
   * @param {number[]} [config.subaddressIndices] - source subaddress indices to transfer funds from (optional)
   * @param {boolean} [config.relay] - relay the transaction to peers to commit to the blockchain (default false)
   * @param {MoneroTxPriority} [config.priority] - transaction priority (default MoneroTxPriority.NORMAL)
   * @param {MoneroDestination[]} config.destinations - addresses and amounts in a multi-destination tx (required unless `address` and `amount` provided)
   * @param {number[]} [config.subtractFeeFrom] - list of destination indices to split the transaction fee (optional)
   * @param {string} [config.paymentId] - transaction payment ID (optional)
   * @param {bigint|string} [config.unlockTime] - minimum height or timestamp for the transaction to unlock (default 0)
   * @return {Promise<MoneroTxWallet>} the created transaction
   */
  async createTx(config) {
    const configNormalized = MoneroWallet.normalizeCreateTxsConfig(config);
    if (configNormalized.getCanSplit() !== undefined) _assert.default.equal(configNormalized.getCanSplit(), false, "Cannot split transactions using createTx(); use createTxs()");
    configNormalized.setCanSplit(false);
    return (await this.createTxs(configNormalized))[0];
  }

  /**
   * Create one or more transactions to transfer funds from this wallet.
   * 
   * @param {Partial<MoneroTxConfig>} config - configures the transactions to create (required)
   * @param {string} config.address - single destination address (required unless `destinations` provided)
   * @param {bigint|string} config.amount - single destination amount (required unless `destinations` provided)
   * @param {number} config.accountIndex - source account index to transfer funds from (required)
   * @param {number} [config.subaddressIndex] - source subaddress index to transfer funds from (optional)
   * @param {int[]} [config.subaddressIndices] - source subaddress indices to transfer funds from (optional)
   * @param {boolean} [config.relay] - relay the transactions to peers to commit to the blockchain (default false)
   * @param {MoneroTxPriority} [config.priority] - transaction priority (default MoneroTxPriority.NORMAL)
   * @param {MoneroDestination[] | MoneroDestinationModel[]} config.destinations - addresses and amounts in a multi-destination tx (required unless `address` and `amount` provided)
   * @param {string} [config.paymentId] - transaction payment ID (optional)
   * @param {bigint|string} [config.unlockTime] - minimum height or timestamp for the transactions to unlock (default 0)
   * @param {boolean} [config.canSplit] - allow funds to be transferred using multiple transactions (default true)
   * @return {Promise<MoneroTxWallet[]>} the created transactions
   */
  async createTxs(config) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Sweep an output by key image.
   * 
   * @param {Partial<MoneroTxConfig>} config - configures the transaction to create (required)
   * @param {string} config.address - single destination address (required)
   * @param {string} config.keyImage - key image to sweep (required)
   * @param {boolean} [config.relay] - relay the transaction to peers to commit to the blockchain (default false)
   * @param {bigint|string} [config.unlockTime] - minimum height or timestamp for the transaction to unlock (default 0)
   * @param {MoneroTxPriority} [config.priority] - transaction priority (default MoneroTxPriority.NORMAL)
   * @return {Promise<MoneroTxWallet>} the created transaction
   */
  async sweepOutput(config) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Sweep all unlocked funds according to the given configuration.
   * 
   * @param {Partial<MoneroTxConfig>} config - configures the transactions to create (required)
   * @param {string} config.address - single destination address (required)
   * @param {number} [config.accountIndex] - source account index to sweep from (optional, defaults to all accounts)
   * @param {number} [config.subaddressIndex] - source subaddress index to sweep from (optional, defaults to all subaddresses)
   * @param {number[]} [config.subaddressIndices] - source subaddress indices to sweep from (optional)
   * @param {boolean} [config.relay] - relay the transactions to peers to commit to the blockchain (default false)
   * @param {MoneroTxPriority} [config.priority] - transaction priority (default MoneroTxPriority.NORMAL)
   * @param {bigint|string} [config.unlockTime] - minimum height or timestamp for the transactions to unlock (default 0)
   * @param {boolean} [config.sweepEachSubaddress] - sweep each subaddress individually if true (default false)
   * @return {Promise<MoneroTxWallet[]>} the created transactions
   */
  async sweepUnlocked(config) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * <p>Sweep all unmixable dust outputs back to the wallet to make them easier to spend and mix.</p>
   * 
   * <p>NOTE: Dust only exists pre RCT, so this method will throw "no dust to sweep" on new wallets.</p>
   * 
   * @param {boolean} [relay] - specifies if the resulting transaction should be relayed (default false)
   * @return {Promise<MoneroTxWallet[]>} the created transactions
   */
  async sweepDust(relay) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Relay a previously created transaction.
   * 
   * @param {(MoneroTxWallet | string)} txOrMetadata - transaction or its metadata to relay
   * @return {Promise<string>} the hash of the relayed tx
   */
  async relayTx(txOrMetadata) {
    return (await this.relayTxs([txOrMetadata]))[0];
  }

  /**
   * Relay previously created transactions.
   * 
   * @param {(MoneroTxWallet[] | string[])} txsOrMetadatas - transactions or their metadata to relay
   * @return {Promise<string[]>} the hashes of the relayed txs
   */
  async relayTxs(txsOrMetadatas) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Describe a tx set from unsigned tx hex.
   * 
   * @param {string} unsignedTxHex - unsigned tx hex
   * @return {Promise<MoneroTxSet>} the tx set containing structured transactions
   */
  async describeUnsignedTxSet(unsignedTxHex) {
    return this.describeTxSet(new _MoneroTxSet.default().setUnsignedTxHex(unsignedTxHex));
  }

  /**
   * Describe a tx set from multisig tx hex.
   * 
   * @param {string} multisigTxHex - multisig tx hex
   * @return {Promise<MoneroTxSet>} the tx set containing structured transactions
   */
  async describeMultisigTxSet(multisigTxHex) {
    return this.describeTxSet(new _MoneroTxSet.default().setMultisigTxHex(multisigTxHex));
  }

  /**
   * Describe a tx set containing unsigned or multisig tx hex to a new tx set containing structured transactions.
   * 
   * @param {MoneroTxSet} txSet - a tx set containing unsigned or multisig tx hex
   * @return {Promise<MoneroTxSet>} txSet - the tx set containing structured transactions
   */
  async describeTxSet(txSet) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Sign unsigned transactions from a view-only wallet.
   * 
   * @param {string} unsignedTxHex - unsigned transaction hex from when the transactions were created
   * @return {Promise<MoneroTxSet>} the signed transaction set
   */
  async signTxs(unsignedTxHex) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Submit signed transactions from a view-only wallet.
   * 
   * @param {string} signedTxHex - signed transaction hex from signTxs()
   * @return {Promise<string[]>} the resulting transaction hashes
   */
  async submitTxs(signedTxHex) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Sign a message.
   * 
   * @param {string} message - the message to sign
   * @param {MoneroMessageSignatureType} [signatureType] - sign with spend key or view key (default spend key)
   * @param {number} [accountIdx] - the account index of the message signature (default 0)
   * @param {number} [subaddressIdx] - the subaddress index of the message signature (default 0)
   * @return {Promise<string>} the signature
   */
  async signMessage(message, signatureType = _MoneroMessageSignatureType.default.SIGN_WITH_SPEND_KEY, accountIdx = 0, subaddressIdx = 0) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Verify a signature on a message.
   * 
   * @param {string} message - signed message
   * @param {string} address - signing address
   * @param {string} signature - signature
   * @return {Promise<MoneroMessageSignatureResult>} true if the signature is good, false otherwise
   */
  async verifyMessage(message, address, signature) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get a transaction's secret key from its hash.
   * 
   * @param {string} txHash - transaction's hash
   * @return {Promise<string>} - transaction's secret key
   */
  async getTxKey(txHash) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Check a transaction in the blockchain with its secret key.
   * 
   * @param {string} txHash - transaction to check
   * @param {string} txKey - transaction's secret key
   * @param {string} address - destination public address of the transaction
   * @return {romise<MoneroCheckTx>} the result of the check
   */
  async checkTxKey(txHash, txKey, address) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get a transaction signature to prove it.
   * 
   * @param {string} txHash - transaction to prove
   * @param {string} address - destination public address of the transaction
   * @param {string} [message] - message to include with the signature to further authenticate the proof (optional)
   * @return {Promise<string>} the transaction signature
   */
  async getTxProof(txHash, address, message) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Prove a transaction by checking its signature.
   * 
   * @param {string} txHash - transaction to prove
   * @param {string} address - destination public address of the transaction
   * @param {string | undefined} message - message included with the signature to further authenticate the proof
   * @param {string} signature  - transaction signature to confirm
   * @return {Promise<MoneroCheckTx>} the result of the check
   */
  async checkTxProof(txHash, address, message, signature) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Generate a signature to prove a spend. Unlike proving a transaction, it does not require the destination public address.
   * 
   * @param {string} txHash - transaction to prove
   * @param {string} [message] - message to include with the signature to further authenticate the proof (optional)
   * @return {Promise<string>} the transaction signature
   */
  async getSpendProof(txHash, message) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Prove a spend using a signature. Unlike proving a transaction, it does not require the destination public address.
   * 
   * @param {string} txHash - transaction to prove
   * @param {string | undefined} message - message included with the signature to further authenticate the proof (optional)
   * @param {string} signature - transaction signature to confirm
   * @return {Promise<boolean>} true if the signature is good, false otherwise
   */
  async checkSpendProof(txHash, message, signature) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Generate a signature to prove the entire balance of the wallet.
   * 
   * @param {string} [message] - message included with the signature to further authenticate the proof (optional)
   * @return {Promise<string>} the reserve proof signature
   */
  async getReserveProofWallet(message) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Generate a signature to prove an available amount in an account.
   * 
   * @param {number} accountIdx - account to prove ownership of the amount
   * @param {bigint} amount - minimum amount to prove as available in the account
   * @param {string} [message] - message to include with the signature to further authenticate the proof (optional)
   * @return {Promise<string>} the reserve proof signature
   */
  async getReserveProofAccount(accountIdx, amount, message) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Proves a wallet has a disposable reserve using a signature.
   * 
   * @param {string} address - public wallet address
   * @param {string | undefined} message - message included with the signature to further authenticate the proof (optional)
   * @param {string} signature - reserve proof signature to check
   * @return {Promise<MoneroCheckReserve>} the result of checking the signature proof
   */
  async checkReserveProof(address, message, signature) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get a transaction note.
   * 
   * @param {string} txHash - transaction to get the note of
   * @return {Promise<string>} the tx note
   */
  async getTxNote(txHash) {
    return (await this.getTxNotes([txHash]))[0];
  }

  /**
   * Get notes for multiple transactions.
   * 
   * @param {string[]} txHashes - hashes of the transactions to get notes for
   * @return {Promise<string[]>} notes for the transactions
   */
  async getTxNotes(txHashes) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Set a note for a specific transaction.
   * 
   * @param {string} txHash - hash of the transaction to set a note for
   * @param {string} note - the transaction note
   * @return {Promise<void>}
   */
  async setTxNote(txHash, note) {
    await this.setTxNotes([txHash], [note]);
  }

  /**
   * Set notes for multiple transactions.
   * 
   * @param {string[]} txHashes - transactions to set notes for
   * @param {string[]} notes - notes to set for the transactions
   * @return {Promise<void>}
   */
  async setTxNotes(txHashes, notes) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get address book entries.
   * 
   * @param {number[]} [entryIndices] - indices of the entries to get
   * @return {Promise<MoneroAddressBookEntry[]>} the address book entries
   */
  async getAddressBookEntries(entryIndices) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Add an address book entry.
   * 
   * @param {string} address - entry address
   * @param {string} [description] - entry description (optional)
   * @return {Promise<number>} the index of the added entry
   */
  async addAddressBookEntry(address, description) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Edit an address book entry.
   * 
   * @param {number} index - index of the address book entry to edit
   * @param {boolean} setAddress - specifies if the address should be updated
   * @param {string | undefined} address - updated address
   * @param {boolean} setDescription - specifies if the description should be updated
   * @param {string | undefined} description - updated description
   * @return {Promise<void>}
   */
  async editAddressBookEntry(index, setAddress, address, setDescription, description) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Delete an address book entry.
   * 
   * @param {number} entryIdx - index of the entry to delete
   * @return {Promise<void>}
   */
  async deleteAddressBookEntry(entryIdx) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Tag accounts.
   * 
   * @param {string} tag - tag to apply to the specified accounts
   * @param {number[]} accountIndices - indices of the accounts to tag
   * @return {Promise<void>}
   */
  async tagAccounts(tag, accountIndices) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Untag accounts.
   * 
   * @param {number[]} accountIndices - indices of the accounts to untag
   * @return {Promise<void>}
   */
  async untagAccounts(accountIndices) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Return all account tags.
   * 
   * @return {Promise<MoneroAccountTag[]>} the wallet's account tags
   */
  async getAccountTags() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Sets a human-readable description for a tag.
   * 
   * @param {string} tag - tag to set a description for
   * @param {string} label - label to set for the tag
   * @return {Promise<void>}
   */
  async setAccountTagLabel(tag, label) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Creates a payment URI from a send configuration.
   * 
   * @param {MoneroTxConfig} config - specifies configuration for a potential tx
   * @return {Promise<string>} the payment uri
   */
  async getPaymentUri(config) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Parses a payment URI to a tx config.
   * 
   * @param {string} uri - payment uri to parse
   * @return {Promise<MoneroTxConfig>} the send configuration parsed from the uri
   */
  async parsePaymentUri(uri) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get an attribute.
   * 
   * @param {string} key - attribute to get the value of
   * @return {Promise<string>} the attribute's value
   */
  async getAttribute(key) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Set an arbitrary attribute.
   * 
   * @param {string} key - attribute key
   * @param {string} val - attribute value
   * @return {Promise<void>}
   */
  async setAttribute(key, val) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Start mining.
   * 
   * @param {number} [numThreads] - number of threads created for mining (optional)
   * @param {boolean} [backgroundMining] - specifies if mining should occur in the background (optional)
   * @param {boolean} [ignoreBattery] - specifies if the battery should be ignored for mining (optional)
   * @return {Promise<void>}
   */
  async startMining(numThreads, backgroundMining, ignoreBattery) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Stop mining.
   * 
   * @return {Promise<void>}
   */
  async stopMining() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Indicates if importing multisig data is needed for returning a correct balance.
   * 
   * @return {Promise<boolean>} true if importing multisig data is needed for returning a correct balance, false otherwise
   */
  async isMultisigImportNeeded() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Indicates if this wallet is a multisig wallet.
   * 
   * @return {Promise<boolean>} true if this is a multisig wallet, false otherwise
   */
  async isMultisig() {
    return (await this.getMultisigInfo()).getIsMultisig();
  }

  /**
   * Get multisig info about this wallet.
   * 
   * @return {Promise<MoneroMultisigInfo>} multisig info about this wallet
   */
  async getMultisigInfo() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Get multisig info as hex to share with participants to begin creating a
   * multisig wallet.
   * 
   * @return {Promise<string>} this wallet's multisig hex to share with participants
   */
  async prepareMultisig() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Make this wallet multisig by importing multisig hex from participants.
   * 
   * @param {string[]} multisigHexes - multisig hex from each participant
   * @param {number} threshold - number of signatures needed to sign transfers
   * @param {string} password - wallet password
   * @return {Promise<string>} this wallet's multisig hex to share with participants
   */
  async makeMultisig(multisigHexes, threshold, password) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Exchange multisig hex with participants in a M/N multisig wallet.
   * 
   * This process must be repeated with participants exactly N-M times.
   * 
   * @param {string[]} multisigHexes are multisig hex from each participant
   * @param {string} password - wallet's password // TODO monero-project: redundant? wallet is created with password
   * @return {Promise<MoneroMultisigInitResult>} the result which has the multisig's address xor this wallet's multisig hex to share with participants iff not done
   */
  async exchangeMultisigKeys(multisigHexes, password) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Export this wallet's multisig info as hex for other participants.
   * 
   * @return {Promise<string>} this wallet's multisig info as hex for other participants
   */
  async exportMultisigHex() {
    throw new _MoneroError.default("Not supported?");
  }

  /**
   * Import multisig info as hex from other participants.
   * 
   * @param {string[]} multisigHexes - multisig hex from each participant
   * @return {Promise<number>} the number of outputs signed with the given multisig hex
   */
  async importMultisigHex(multisigHexes) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Sign multisig transactions from a multisig wallet.
   * 
   * @param {string} multisigTxHex - unsigned multisig transactions as hex
   * @return {MoneroMultisigSignResult} the result of signing the multisig transactions
   */
  async signMultisigTxHex(multisigTxHex) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Submit signed multisig transactions from a multisig wallet.
   * 
   * @param {string} signedMultisigTxHex - signed multisig hex returned from signMultisigTxHex()
   * @return {Promise<string[]>} the resulting transaction hashes
   */
  async submitMultisigTxHex(signedMultisigTxHex) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Change the wallet password.
   * 
   * @param {string} oldPassword - the wallet's old password
   * @param {string} newPassword - the wallet's new password
   * @return {Promise<void>}
   */
  async changePassword(oldPassword, newPassword) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Save the wallet at its current path.
   * 
   * @return {Promise<void>}
   */
  async save() {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Optionally save then close the wallet.
   *
   * @param {boolean} [save] - specifies if the wallet should be saved before being closed (default false)
   * @return {Promise<void>}
   */
  async close(save = false) {
    if (this.connectionManager) this.connectionManager.removeListener(this.connectionManagerListener);
    this.connectionManager = undefined;
    this.connectionManagerListener = undefined;
    this.listeners.splice(0, this.listeners.length);
    this._isClosed = true;
  }

  /**
   * Indicates if this wallet is closed or not.
   * 
   * @return {Promise<boolean>} true if the wallet is closed, false otherwise
   */
  async isClosed() {
    return this._isClosed;
  }

  // -------------------------------- PRIVATE ---------------------------------

  /**
   * @private
   */
  async announceSyncProgress(height, startHeight, endHeight, percentDone, message) {
    for (let listener of this.listeners) {
      try {
        await listener.onSyncProgress(height, startHeight, endHeight, percentDone, message);
      } catch (err) {
        console.error("Error calling listener on sync progress", err);
      }
    }
  }

  /**
   * @private
   */
  async announceNewBlock(height) {
    for (let listener of this.listeners) {
      try {
        await listener.onNewBlock(height);
      } catch (err) {
        console.error("Error calling listener on new block", err);
      }
    }
  }

  /**
   * @private
   */
  async announceBalancesChanged(newBalance, newUnlockedBalance) {
    for (let listener of this.listeners) {
      try {
        await listener.onBalancesChanged(newBalance, newUnlockedBalance);
      } catch (err) {
        console.error("Error calling listener on balances changed", err);
      }
    }
  }

  /**
   * @private
   */
  async announceOutputReceived(output) {
    for (let listener of this.listeners) {
      try {
        await listener.onOutputReceived(output);
      } catch (err) {
        console.error("Error calling listener on output received", err);
      }
    }
  }

  /**
   * @private
   */
  async announceOutputSpent(output) {
    for (let listener of this.listeners) {
      try {
        await listener.onOutputSpent(output);
      } catch (err) {
        console.error("Error calling listener on output spent", err);
      }
    }
  }

  static normalizeTxQuery(query) {
    if (query instanceof _MoneroTxQuery.default) query = query.copy();else
    if (Array.isArray(query)) query = new _MoneroTxQuery.default().setHashes(query);else
    {
      query = Object.assign({}, query);
      query = new _MoneroTxQuery.default(query);
    }
    if (query.getBlock() === undefined) query.setBlock(new _MoneroBlock.default().setTxs([query]));
    if (query.getInputQuery()) query.getInputQuery().setTxQuery(query);
    if (query.getOutputQuery()) query.getOutputQuery().setTxQuery(query);
    return query;
  }

  static normalizeTransferQuery(query) {
    query = new _MoneroTransferQuery.default(query);
    if (query.getTxQuery() !== undefined) {
      let txQuery = query.getTxQuery().copy();
      query = txQuery.getTransferQuery();
    }
    if (query.getTxQuery() === undefined) query.setTxQuery(new _MoneroTxQuery.default());
    query.getTxQuery().setTransferQuery(query);
    if (query.getTxQuery().getBlock() === undefined) query.getTxQuery().setBlock(new _MoneroBlock.default().setTxs([query.getTxQuery()]));
    return query;
  }

  static normalizeOutputQuery(query) {
    query = new _MoneroOutputQuery.default(query);
    if (query.getTxQuery() !== undefined) {
      let txQuery = query.getTxQuery().copy();
      query = txQuery.getOutputQuery();
    }
    if (query.getTxQuery() === undefined) query.setTxQuery(new _MoneroTxQuery.default());
    query.getTxQuery().setOutputQuery(query);
    if (query.getTxQuery().getBlock() === undefined) query.getTxQuery().setBlock(new _MoneroBlock.default().setTxs([query.getTxQuery()]));
    return query;
  }

  static normalizeCreateTxsConfig(config) {
    if (config === undefined || !(config instanceof Object)) throw new _MoneroError.default("Must provide MoneroTxConfig or equivalent JS object");
    config = new _MoneroTxConfig.default(config);
    (0, _assert.default)(config.getDestinations() && config.getDestinations().length > 0, "Must provide destinations");
    _assert.default.equal(config.getSweepEachSubaddress(), undefined);
    _assert.default.equal(config.getBelowAmount(), undefined);
    return config;
  }

  static normalizeSweepOutputConfig(config) {
    if (config === undefined || !(config instanceof Object)) throw new _MoneroError.default("Must provide MoneroTxConfig or equivalent JS object");
    config = new _MoneroTxConfig.default(config);
    _assert.default.equal(config.getSweepEachSubaddress(), undefined);
    _assert.default.equal(config.getBelowAmount(), undefined);
    _assert.default.equal(config.getCanSplit(), undefined, "Cannot split transactions when sweeping an output");
    if (!config.getDestinations() || config.getDestinations().length !== 1 || !config.getDestinations()[0].getAddress()) throw new _MoneroError.default("Must provide exactly one destination address to sweep output to");
    if (config.getSubtractFeeFrom() && config.getSubtractFeeFrom().length > 0) throw new _MoneroError.default("Sweep transactions do not support subtracting fees from destinations");
    return config;
  }

  static normalizeSweepUnlockedConfig(config) {
    if (config === undefined || !(config instanceof Object)) throw new _MoneroError.default("Must provide MoneroTxConfig or equivalent JS object");
    config = new _MoneroTxConfig.default(config);
    if (config.getDestinations() === undefined || config.getDestinations().length != 1) throw new _MoneroError.default("Must provide exactly one destination to sweep to");
    if (config.getDestinations()[0].getAddress() === undefined) throw new _MoneroError.default("Must provide destination address to sweep to");
    if (config.getDestinations()[0].getAmount() !== undefined) throw new _MoneroError.default("Cannot provide amount in sweep config");
    if (config.getKeyImage() !== undefined) throw new _MoneroError.default("Key image defined; use sweepOutput() to sweep an output by its key image");
    if (config.getSubaddressIndices() !== undefined && config.getSubaddressIndices().length === 0) config.setSubaddressIndices(undefined);
    if (config.getAccountIndex() === undefined && config.getSubaddressIndices() !== undefined) throw new _MoneroError.default("Must provide account index if subaddress indices are provided");
    if (config.getSubtractFeeFrom() && config.getSubtractFeeFrom().length > 0) throw new _MoneroError.default("Sweep transactions do not support subtracting fees from destinations");
    return config;
  }
}exports.default = MoneroWallet;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIl9Nb25lcm9PdXRwdXRRdWVyeSIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJNb25lcm9XYWxsZXQiLCJERUZBVUxUX0xBTkdVQUdFIiwibGlzdGVuZXJzIiwiX2lzQ2xvc2VkIiwiY29uc3RydWN0b3IiLCJhZGRMaXN0ZW5lciIsImxpc3RlbmVyIiwiYXNzZXJ0IiwiTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJwdXNoIiwicmVtb3ZlTGlzdGVuZXIiLCJpZHgiLCJpbmRleE9mIiwic3BsaWNlIiwiTW9uZXJvRXJyb3IiLCJnZXRMaXN0ZW5lcnMiLCJpc1ZpZXdPbmx5Iiwic2V0RGFlbW9uQ29ubmVjdGlvbiIsInVyaU9yQ29ubmVjdGlvbiIsImdldERhZW1vbkNvbm5lY3Rpb24iLCJzZXRDb25uZWN0aW9uTWFuYWdlciIsImNvbm5lY3Rpb25NYW5hZ2VyIiwiY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciIsInRoYXQiLCJNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyIiwib25Db25uZWN0aW9uQ2hhbmdlZCIsImNvbm5lY3Rpb24iLCJnZXRDb25uZWN0aW9uIiwiZ2V0Q29ubmVjdGlvbk1hbmFnZXIiLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiZ2V0VmVyc2lvbiIsImdldFBhdGgiLCJnZXRTZWVkIiwiZ2V0U2VlZExhbmd1YWdlIiwiZ2V0UHJpdmF0ZVZpZXdLZXkiLCJnZXRQcml2YXRlU3BlbmRLZXkiLCJnZXRQdWJsaWNWaWV3S2V5IiwiZ2V0UHVibGljU3BlbmRLZXkiLCJnZXRQcmltYXJ5QWRkcmVzcyIsImdldEFkZHJlc3MiLCJhY2NvdW50SWR4Iiwic3ViYWRkcmVzc0lkeCIsImdldEFkZHJlc3NJbmRleCIsImFkZHJlc3MiLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsInN0YW5kYXJkQWRkcmVzcyIsInBheW1lbnRJZCIsImRlY29kZUludGVncmF0ZWRBZGRyZXNzIiwiaW50ZWdyYXRlZEFkZHJlc3MiLCJnZXRIZWlnaHQiLCJnZXREYWVtb25IZWlnaHQiLCJnZXRIZWlnaHRCeURhdGUiLCJ5ZWFyIiwibW9udGgiLCJkYXkiLCJzeW5jIiwibGlzdGVuZXJPclN0YXJ0SGVpZ2h0Iiwic3RhcnRIZWlnaHQiLCJzdGFydFN5bmNpbmciLCJzeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwicmVzY2FuU3BlbnQiLCJyZXNjYW5CbG9ja2NoYWluIiwiZ2V0QmFsYW5jZSIsImdldFVubG9ja2VkQmFsYW5jZSIsImdldE51bUJsb2Nrc1RvVW5sb2NrIiwiYmFsYW5jZSIsInVuZGVmaW5lZCIsInVubG9ja2VkQmFsYW5jZSIsInR4cyIsImhlaWdodCIsIm51bUJsb2Nrc1RvTmV4dFVubG9jayIsImdldFR4cyIsImlzTG9ja2VkIiwidHgiLCJnZXRJc0NvbmZpcm1lZCIsIk1vbmVyb1V0aWxzIiwiaXNUaW1lc3RhbXAiLCJnZXRVbmxvY2tUaW1lIiwibnVtQmxvY2tzVG9VbmxvY2siLCJNYXRoIiwibWF4IiwiTnVtYmVyIiwibWluIiwibnVtQmxvY2tzVG9MYXN0VW5sb2NrIiwiZ2V0QWNjb3VudHMiLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwiZ2V0QWNjb3VudCIsImNyZWF0ZUFjY291bnQiLCJsYWJlbCIsInNldEFjY291bnRMYWJlbCIsInNldFN1YmFkZHJlc3NMYWJlbCIsImdldFN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NJbmRpY2VzIiwiZ2V0U3ViYWRkcmVzcyIsImNyZWF0ZVN1YmFkZHJlc3MiLCJnZXRUeCIsInR4SGFzaCIsImxlbmd0aCIsInF1ZXJ5IiwiZ2V0VHJhbnNmZXJzIiwiZ2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJxdWVyeU5vcm1hbGl6ZWQiLCJub3JtYWxpemVUcmFuc2ZlclF1ZXJ5IiwiZ2V0SXNJbmNvbWluZyIsInNldElzSW5jb21pbmciLCJnZXRPdXRnb2luZ1RyYW5zZmVycyIsImdldElzT3V0Z29pbmciLCJzZXRJc091dGdvaW5nIiwiZ2V0T3V0cHV0cyIsImV4cG9ydE91dHB1dHMiLCJhbGwiLCJpbXBvcnRPdXRwdXRzIiwib3V0cHV0c0hleCIsImV4cG9ydEtleUltYWdlcyIsImltcG9ydEtleUltYWdlcyIsImtleUltYWdlcyIsImdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0IiwiZnJlZXplT3V0cHV0Iiwia2V5SW1hZ2UiLCJ0aGF3T3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJjcmVhdGVUeCIsImNvbmZpZyIsImNvbmZpZ05vcm1hbGl6ZWQiLCJub3JtYWxpemVDcmVhdGVUeHNDb25maWciLCJnZXRDYW5TcGxpdCIsImVxdWFsIiwic2V0Q2FuU3BsaXQiLCJjcmVhdGVUeHMiLCJzd2VlcE91dHB1dCIsInN3ZWVwVW5sb2NrZWQiLCJzd2VlcER1c3QiLCJyZWxheSIsInJlbGF5VHgiLCJ0eE9yTWV0YWRhdGEiLCJyZWxheVR4cyIsInR4c09yTWV0YWRhdGFzIiwiZGVzY3JpYmVVbnNpZ25lZFR4U2V0IiwidW5zaWduZWRUeEhleCIsImRlc2NyaWJlVHhTZXQiLCJNb25lcm9UeFNldCIsInNldFVuc2lnbmVkVHhIZXgiLCJkZXNjcmliZU11bHRpc2lnVHhTZXQiLCJtdWx0aXNpZ1R4SGV4Iiwic2V0TXVsdGlzaWdUeEhleCIsInR4U2V0Iiwic2lnblR4cyIsInN1Ym1pdFR4cyIsInNpZ25lZFR4SGV4Iiwic2lnbk1lc3NhZ2UiLCJtZXNzYWdlIiwic2lnbmF0dXJlVHlwZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiU0lHTl9XSVRIX1NQRU5EX0tFWSIsInZlcmlmeU1lc3NhZ2UiLCJzaWduYXR1cmUiLCJnZXRUeEtleSIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImdldFR4UHJvb2YiLCJjaGVja1R4UHJvb2YiLCJnZXRTcGVuZFByb29mIiwiY2hlY2tTcGVuZFByb29mIiwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0IiwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCIsImFtb3VudCIsImNoZWNrUmVzZXJ2ZVByb29mIiwiZ2V0VHhOb3RlIiwiZ2V0VHhOb3RlcyIsInNldFR4Tm90ZSIsIm5vdGUiLCJzZXRUeE5vdGVzIiwibm90ZXMiLCJnZXRBZGRyZXNzQm9va0VudHJpZXMiLCJlbnRyeUluZGljZXMiLCJhZGRBZGRyZXNzQm9va0VudHJ5IiwiZGVzY3JpcHRpb24iLCJlZGl0QWRkcmVzc0Jvb2tFbnRyeSIsImluZGV4Iiwic2V0QWRkcmVzcyIsInNldERlc2NyaXB0aW9uIiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsImVudHJ5SWR4IiwidGFnQWNjb3VudHMiLCJhY2NvdW50SW5kaWNlcyIsInVudGFnQWNjb3VudHMiLCJnZXRBY2NvdW50VGFncyIsInNldEFjY291bnRUYWdMYWJlbCIsImdldFBheW1lbnRVcmkiLCJwYXJzZVBheW1lbnRVcmkiLCJ1cmkiLCJnZXRBdHRyaWJ1dGUiLCJrZXkiLCJzZXRBdHRyaWJ1dGUiLCJ2YWwiLCJzdGFydE1pbmluZyIsIm51bVRocmVhZHMiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaWdub3JlQmF0dGVyeSIsInN0b3BNaW5pbmciLCJpc011bHRpc2lnSW1wb3J0TmVlZGVkIiwiaXNNdWx0aXNpZyIsImdldE11bHRpc2lnSW5mbyIsImdldElzTXVsdGlzaWciLCJwcmVwYXJlTXVsdGlzaWciLCJtYWtlTXVsdGlzaWciLCJtdWx0aXNpZ0hleGVzIiwidGhyZXNob2xkIiwicGFzc3dvcmQiLCJleGNoYW5nZU11bHRpc2lnS2V5cyIsImV4cG9ydE11bHRpc2lnSGV4IiwiaW1wb3J0TXVsdGlzaWdIZXgiLCJzaWduTXVsdGlzaWdUeEhleCIsInN1Ym1pdE11bHRpc2lnVHhIZXgiLCJzaWduZWRNdWx0aXNpZ1R4SGV4IiwiY2hhbmdlUGFzc3dvcmQiLCJvbGRQYXNzd29yZCIsIm5ld1Bhc3N3b3JkIiwic2F2ZSIsImNsb3NlIiwiaXNDbG9zZWQiLCJhbm5vdW5jZVN5bmNQcm9ncmVzcyIsImVuZEhlaWdodCIsInBlcmNlbnREb25lIiwib25TeW5jUHJvZ3Jlc3MiLCJlcnIiLCJjb25zb2xlIiwiZXJyb3IiLCJhbm5vdW5jZU5ld0Jsb2NrIiwib25OZXdCbG9jayIsImFubm91bmNlQmFsYW5jZXNDaGFuZ2VkIiwibmV3QmFsYW5jZSIsIm5ld1VubG9ja2VkQmFsYW5jZSIsIm9uQmFsYW5jZXNDaGFuZ2VkIiwiYW5ub3VuY2VPdXRwdXRSZWNlaXZlZCIsIm91dHB1dCIsIm9uT3V0cHV0UmVjZWl2ZWQiLCJhbm5vdW5jZU91dHB1dFNwZW50Iiwib25PdXRwdXRTcGVudCIsIm5vcm1hbGl6ZVR4UXVlcnkiLCJNb25lcm9UeFF1ZXJ5IiwiY29weSIsIkFycmF5IiwiaXNBcnJheSIsInNldEhhc2hlcyIsIk9iamVjdCIsImFzc2lnbiIsImdldEJsb2NrIiwic2V0QmxvY2siLCJNb25lcm9CbG9jayIsInNldFR4cyIsImdldElucHV0UXVlcnkiLCJzZXRUeFF1ZXJ5IiwiZ2V0T3V0cHV0UXVlcnkiLCJNb25lcm9UcmFuc2ZlclF1ZXJ5IiwiZ2V0VHhRdWVyeSIsInR4UXVlcnkiLCJnZXRUcmFuc2ZlclF1ZXJ5Iiwic2V0VHJhbnNmZXJRdWVyeSIsIm5vcm1hbGl6ZU91dHB1dFF1ZXJ5IiwiTW9uZXJvT3V0cHV0UXVlcnkiLCJzZXRPdXRwdXRRdWVyeSIsIk1vbmVyb1R4Q29uZmlnIiwiZ2V0RGVzdGluYXRpb25zIiwiZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcyIsImdldEJlbG93QW1vdW50Iiwibm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWciLCJnZXRTdWJ0cmFjdEZlZUZyb20iLCJub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnIiwiZ2V0QW1vdW50IiwiZ2V0S2V5SW1hZ2UiLCJnZXRTdWJhZGRyZXNzSW5kaWNlcyIsInNldFN1YmFkZHJlc3NJbmRpY2VzIiwiZ2V0QWNjb3VudEluZGV4IiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy93YWxsZXQvTW9uZXJvV2FsbGV0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuLi9jb21tb24vR2VuVXRpbHNcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50IGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50VGFnIGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRUYWdcIjtcbmltcG9ydCBNb25lcm9BZGRyZXNzQm9va0VudHJ5IGZyb20gXCIuL21vZGVsL01vbmVyb0FkZHJlc3NCb29rRW50cnlcIjtcbmltcG9ydCBNb25lcm9CbG9jayBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tSZXNlcnZlIGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrUmVzZXJ2ZVwiO1xuaW1wb3J0IE1vbmVyb0NoZWNrVHggZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tUeFwiO1xuaW1wb3J0IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIGZyb20gXCIuLi9jb21tb24vTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJcIjtcbmltcG9ydCBNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyIGZyb20gXCIuLi9jb21tb24vTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9JbmNvbWluZ1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb0luY29taW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvS2V5SW1hZ2VcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlXCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbmZvIGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5mb1wiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luaXRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0UXVlcnlcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0cHV0V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRnb2luZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvUnBjQ29ubmVjdGlvbiBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1JwY0Nvbm5lY3Rpb25cIjtcbmltcG9ydCBNb25lcm9TdWJhZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb1N1YmFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9TeW5jUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb1N5bmNSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyUXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4Q29uZmlnIGZyb20gXCIuL21vZGVsL01vbmVyb1R4Q29uZmlnXCI7XG5pbXBvcnQgTW9uZXJvVHhRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhXYWxsZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9UeFNldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFNldFwiO1xuaW1wb3J0IE1vbmVyb1V0aWxzIGZyb20gXCIuLi9jb21tb24vTW9uZXJvVXRpbHNcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldExpc3RlbmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1dhbGxldExpc3RlbmVyXCI7XG5cbi8qKlxuICogQ29weXJpZ2h0IChjKSB3b29kc2VyXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIE1vbmVybyB3YWxsZXQgaW50ZXJmYWNlIGFuZCBkZWZhdWx0IGltcGxlbWVudGF0aW9ucy5cbiAqIFxuICogQGludGVyZmFjZVxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9XYWxsZXQge1xuXG4gIC8vIHN0YXRpYyB2YXJpYWJsZXNcbiAgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfTEFOR1VBR0UgPSBcIkVuZ2xpc2hcIjtcblxuICAvLyBzdGF0ZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIGNvbm5lY3Rpb25NYW5hZ2VyOiBNb25lcm9Db25uZWN0aW9uTWFuYWdlcjtcbiAgcHJvdGVjdGVkIGNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXI6IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXI7XG4gIHByb3RlY3RlZCBsaXN0ZW5lcnM6IE1vbmVyb1dhbGxldExpc3RlbmVyW10gPSBbXTtcbiAgcHJvdGVjdGVkIF9pc0Nsb3NlZCA9IGZhbHNlO1xuXG4gIC8qKlxuICAgKiBIaWRkZW4gY29uc3RydWN0b3IuXG4gICAqIFxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgLy8gbm8gY29kZSBuZWVkZWRcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbGlzdGVuZXIgdG8gcmVjZWl2ZSB3YWxsZXQgbm90aWZpY2F0aW9ucy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvV2FsbGV0TGlzdGVuZXJ9IGxpc3RlbmVyIC0gbGlzdGVuZXIgdG8gcmVjZWl2ZSB3YWxsZXQgbm90aWZpY2F0aW9uc1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb1dhbGxldExpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXNzZXJ0KGxpc3RlbmVyIGluc3RhbmNlb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXIsIFwiTGlzdGVuZXIgbXVzdCBiZSBpbnN0YW5jZSBvZiBNb25lcm9XYWxsZXRMaXN0ZW5lclwiKTtcbiAgICB0aGlzLmxpc3RlbmVycy5wdXNoKGxpc3RlbmVyKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFVucmVnaXN0ZXIgYSBsaXN0ZW5lciB0byByZWNlaXZlIHdhbGxldCBub3RpZmljYXRpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRMaXN0ZW5lcn0gbGlzdGVuZXIgLSBsaXN0ZW5lciB0byB1bnJlZ2lzdGVyXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGxldCBpZHggPSB0aGlzLmxpc3RlbmVycy5pbmRleE9mKGxpc3RlbmVyKTtcbiAgICBpZiAoaWR4ID4gLTEpIHRoaXMubGlzdGVuZXJzLnNwbGljZShpZHgsIDEpO1xuICAgIGVsc2UgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTGlzdGVuZXIgaXMgbm90IHJlZ2lzdGVyZWQgd2l0aCB3YWxsZXRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGxpc3RlbmVycyByZWdpc3RlcmVkIHdpdGggdGhlIHdhbGxldC5cbiAgICogXG4gICAqIEByZXR1cm4ge01vbmVyb1dhbGxldExpc3RlbmVyW119IHRoZSByZWdpc3RlcmVkIGxpc3RlbmVyc1xuICAgKi9cbiAgZ2V0TGlzdGVuZXJzKCk6IE1vbmVyb1dhbGxldExpc3RlbmVyW10ge1xuICAgIHJldHVybiB0aGlzLmxpc3RlbmVycztcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgd2FsbGV0IGlzIHZpZXctb25seSwgbWVhbmluZyBpdCBkb2VzIG5vdCBoYXZlIHRoZSBwcml2YXRlXG4gICAqIHNwZW5kIGtleSBhbmQgY2FuIHRoZXJlZm9yZSBvbmx5IG9ic2VydmUgaW5jb21pbmcgb3V0cHV0cy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIHdhbGxldCBpcyB2aWV3LW9ubHksIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNWaWV3T25seSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvUnBjQ29ubmVjdGlvbiB8IHN0cmluZ30gW3VyaU9yQ29ubmVjdGlvbl0gLSBkYWVtb24ncyBVUkkgb3IgY29ubmVjdGlvbiAoZGVmYXVsdHMgdG8gb2ZmbGluZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uPzogTW9uZXJvUnBjQ29ubmVjdGlvbiB8IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9ScGNDb25uZWN0aW9uPn0gdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uXG4gICAqL1xuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvbiBtYW5hZ2VyLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9Db25uZWN0aW9uTWFuYWdlcn0gY29ubmVjdGlvbk1hbmFnZXIgbWFuYWdlcyBjb25uZWN0aW9ucyB0byBtb25lcm9kXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRDb25uZWN0aW9uTWFuYWdlcihjb25uZWN0aW9uTWFuYWdlcj86IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29ubmVjdGlvbk1hbmFnZXIpIHRoaXMuY29ubmVjdGlvbk1hbmFnZXIucmVtb3ZlTGlzdGVuZXIodGhpcy5jb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyKTtcbiAgICB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyID0gY29ubmVjdGlvbk1hbmFnZXI7XG4gICAgaWYgKCFjb25uZWN0aW9uTWFuYWdlcikgcmV0dXJuO1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICBpZiAoIXRoaXMuY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcikgdGhpcy5jb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyID0gbmV3IGNsYXNzIGV4dGVuZHMgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciB7XG4gICAgICBhc3luYyBvbkNvbm5lY3Rpb25DaGFuZ2VkKGNvbm5lY3Rpb246IE1vbmVyb1JwY0Nvbm5lY3Rpb24gfCB1bmRlZmluZWQpIHtcbiAgICAgICAgYXdhaXQgdGhhdC5zZXREYWVtb25Db25uZWN0aW9uKGNvbm5lY3Rpb24pO1xuICAgICAgfVxuICAgIH07XG4gICAgY29ubmVjdGlvbk1hbmFnZXIuYWRkTGlzdGVuZXIodGhpcy5jb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyKTtcbiAgICBhd2FpdCB0aGlzLnNldERhZW1vbkNvbm5lY3Rpb24oY29ubmVjdGlvbk1hbmFnZXIuZ2V0Q29ubmVjdGlvbigpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uIG1hbmFnZXIuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyPn0gdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uIG1hbmFnZXJcbiAgICovXG4gIGFzeW5jIGdldENvbm5lY3Rpb25NYW5hZ2VyKCk6IFByb21pc2U8TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI+IHtcbiAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uTWFuYWdlcjtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgd2FsbGV0IGlzIGNvbm5lY3RlZCB0byBkYWVtb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSB3YWxsZXQgaXMgY29ubmVjdGVkIHRvIGEgZGFlbW9uLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldHMgdGhlIHZlcnNpb24gb2YgdGhlIHdhbGxldC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVmVyc2lvbj59IHRoZSB2ZXJzaW9uIG9mIHRoZSB3YWxsZXRcbiAgICovXG4gIGFzeW5jIGdldFZlcnNpb24oKTogUHJvbWlzZTxNb25lcm9WZXJzaW9uPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgcGF0aC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHBhdGggdGhlIHdhbGxldCBjYW4gYmUgb3BlbmVkIHdpdGhcbiAgICovXG4gIGFzeW5jIGdldFBhdGgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBtbmVtb25pYyBwaHJhc2Ugb3Igc2VlZC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHdhbGxldCdzIG1uZW1vbmljIHBocmFzZSBvciBzZWVkLlxuICAgKi9cbiAgYXN5bmMgZ2V0U2VlZCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGxhbmd1YWdlIG9mIHRoZSB3YWxsZXQncyBtbmVtb25pYyBwaHJhc2Ugb3Igc2VlZC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIGxhbmd1YWdlIG9mIHRoZSB3YWxsZXQncyBtbmVtb25pYyBwaHJhc2Ugb3Igc2VlZC5cbiAgICovXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIHByaXZhdGUgdmlldyBrZXkuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB3YWxsZXQncyBwcml2YXRlIHZpZXcga2V5XG4gICAqL1xuICBhc3luYyBnZXRQcml2YXRlVmlld0tleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIHByaXZhdGUgc3BlbmQga2V5LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgd2FsbGV0J3MgcHJpdmF0ZSBzcGVuZCBrZXlcbiAgICovXG4gIGFzeW5jIGdldFByaXZhdGVTcGVuZEtleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIHB1YmxpYyB2aWV3IGtleS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHdhbGxldCdzIHB1YmxpYyB2aWV3IGtleVxuICAgKi9cbiAgYXN5bmMgZ2V0UHVibGljVmlld0tleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIHB1YmxpYyBzcGVuZCBrZXkuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB3YWxsZXQncyBwdWJsaWMgc3BlbmQga2V5XG4gICAqL1xuICBhc3luYyBnZXRQdWJsaWNTcGVuZEtleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgcHJpbWFyeSBhZGRyZXNzLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgd2FsbGV0J3MgcHJpbWFyeSBhZGRyZXNzXG4gICAqL1xuICBhc3luYyBnZXRQcmltYXJ5QWRkcmVzcygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmdldEFkZHJlc3MoMCwgMCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGFkZHJlc3Mgb2YgYSBzcGVjaWZpYyBzdWJhZGRyZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFjY291bnRJZHggLSB0aGUgYWNjb3VudCBpbmRleCBvZiB0aGUgYWRkcmVzcydzIHN1YmFkZHJlc3NcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN1YmFkZHJlc3NJZHggLSB0aGUgc3ViYWRkcmVzcyBpbmRleCB3aXRoaW4gdGhlIGFjY291bnRcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgcmVjZWl2ZSBhZGRyZXNzIG9mIHRoZSBzcGVjaWZpZWQgc3ViYWRkcmVzc1xuICAgKi9cbiAgYXN5bmMgZ2V0QWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlcik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRleCBvZiB0aGUgZ2l2ZW4gYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gYWRkcmVzcyB0byBnZXQgdGhlIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kZXggZnJvbVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+fSB0aGUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzXG4gICAqL1xuICBhc3luYyBnZXRBZGRyZXNzSW5kZXgoYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhbiBpbnRlZ3JhdGVkIGFkZHJlc3MgYmFzZWQgb24gdGhlIGdpdmVuIHN0YW5kYXJkIGFkZHJlc3MgYW5kIHBheW1lbnRcbiAgICogSUQuIFVzZXMgdGhlIHdhbGxldCdzIHByaW1hcnkgYWRkcmVzcyBpZiBhbiBhZGRyZXNzIGlzIG5vdCBnaXZlbi5cbiAgICogR2VuZXJhdGVzIGEgcmFuZG9tIHBheW1lbnQgSUQgaWYgYSBwYXltZW50IElEIGlzIG5vdCBnaXZlbi5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdGFuZGFyZEFkZHJlc3MgaXMgdGhlIHN0YW5kYXJkIGFkZHJlc3MgdG8gZ2VuZXJhdGUgdGhlIGludGVncmF0ZWQgYWRkcmVzcyBmcm9tICh3YWxsZXQncyBwcmltYXJ5IGFkZHJlc3MgaWYgdW5kZWZpbmVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF5bWVudElkIGlzIHRoZSBwYXltZW50IElEIHRvIGdlbmVyYXRlIGFuIGludGVncmF0ZWQgYWRkcmVzcyBmcm9tIChyYW5kb21seSBnZW5lcmF0ZWQgaWYgdW5kZWZpbmVkKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPn0gdGhlIGludGVncmF0ZWQgYWRkcmVzc1xuICAgKi9cbiAgYXN5bmMgZ2V0SW50ZWdyYXRlZEFkZHJlc3Moc3RhbmRhcmRBZGRyZXNzPzogc3RyaW5nLCBwYXltZW50SWQ/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlY29kZSBhbiBpbnRlZ3JhdGVkIGFkZHJlc3MgdG8gZ2V0IGl0cyBzdGFuZGFyZCBhZGRyZXNzIGFuZCBwYXltZW50IGlkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGludGVncmF0ZWRBZGRyZXNzIC0gaW50ZWdyYXRlZCBhZGRyZXNzIHRvIGRlY29kZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPn0gdGhlIGRlY29kZWQgaW50ZWdyYXRlZCBhZGRyZXNzIGluY2x1ZGluZyBzdGFuZGFyZCBhZGRyZXNzIGFuZCBwYXltZW50IGlkXG4gICAqL1xuICBhc3luYyBkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGJsb2NrIGhlaWdodCB0aGF0IHRoZSB3YWxsZXQgaXMgc3luY2VkIHRvLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB0aGUgYmxvY2sgaGVpZ2h0IHRoYXQgdGhlIHdhbGxldCBpcyBzeW5jZWQgdG9cbiAgICovXG4gIGFzeW5jIGdldEhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGJsb2NrY2hhaW4ncyBoZWlnaHQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBibG9ja2NoYWluJ3MgaGVpZ2h0XG4gICAqL1xuICBhc3luYyBnZXREYWVtb25IZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBibG9ja2NoYWluJ3MgaGVpZ2h0IGJ5IGRhdGUgYXMgYSBjb25zZXJ2YXRpdmUgZXN0aW1hdGUgZm9yIHNjYW5uaW5nLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IHllYXIgLSB5ZWFyIG9mIHRoZSBoZWlnaHQgdG8gZ2V0XG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtb250aCAtIG1vbnRoIG9mIHRoZSBoZWlnaHQgdG8gZ2V0IGFzIGEgbnVtYmVyIGJldHdlZW4gMSBhbmQgMTJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGRheSAtIGRheSBvZiB0aGUgaGVpZ2h0IHRvIGdldCBhcyBhIG51bWJlciBiZXR3ZWVuIDEgYW5kIDMxXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIGJsb2NrY2hhaW4ncyBhcHByb3hpbWF0ZSBoZWlnaHQgYXQgdGhlIGdpdmVuIGRhdGVcbiAgICovXG4gIGFzeW5jIGdldEhlaWdodEJ5RGF0ZSh5ZWFyOiBudW1iZXIsIG1vbnRoOiBudW1iZXIsIGRheTogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3luY2hyb25pemUgdGhlIHdhbGxldCB3aXRoIHRoZSBkYWVtb24gYXMgYSBvbmUtdGltZSBzeW5jaHJvbm91cyBwcm9jZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRMaXN0ZW5lcnxudW1iZXJ9IFtsaXN0ZW5lck9yU3RhcnRIZWlnaHRdIC0gbGlzdGVuZXIgeG9yIHN0YXJ0IGhlaWdodCAoZGVmYXVsdHMgdG8gbm8gc3luYyBsaXN0ZW5lciwgdGhlIGxhc3Qgc3luY2VkIGJsb2NrKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0SGVpZ2h0XSAtIHN0YXJ0SGVpZ2h0IGlmIG5vdCBnaXZlbiBpbiBmaXJzdCBhcmcgKGRlZmF1bHRzIHRvIGxhc3Qgc3luY2VkIGJsb2NrKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc3luYyhsaXN0ZW5lck9yU3RhcnRIZWlnaHQ/OiBNb25lcm9XYWxsZXRMaXN0ZW5lciB8IG51bWJlciwgc3RhcnRIZWlnaHQ/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb1N5bmNSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3RhcnQgYmFja2dyb3VuZCBzeW5jaHJvbml6aW5nIHdpdGggYSBtYXhpbXVtIHBlcmlvZCBiZXR3ZWVuIHN5bmNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzeW5jUGVyaW9kSW5Nc10gLSBtYXhpbXVtIHBlcmlvZCBiZXR3ZWVuIHN5bmNzIGluIG1pbGxpc2Vjb25kcyAoZGVmYXVsdCBpcyB3YWxsZXQtc3BlY2lmaWMpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXM/OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3RvcCBzeW5jaHJvbml6aW5nIHRoZSB3YWxsZXQgd2l0aCB0aGUgZGFlbW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN0b3BTeW5jaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTY2FuIHRyYW5zYWN0aW9ucyBieSB0aGVpciBoYXNoL2lkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gdHhIYXNoZXMgLSB0eCBoYXNoZXMgdG8gc2NhblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2NhblR4cyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+UmVzY2FuIHRoZSBibG9ja2NoYWluIGZvciBzcGVudCBvdXRwdXRzLjwvcD5cbiAgICogXG4gICAqIDxwPk5vdGU6IHRoaXMgY2FuIG9ubHkgYmUgY2FsbGVkIHdpdGggYSB0cnVzdGVkIGRhZW1vbi48L3A+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlIHVzZSBjYXNlOiBwZWVyIG11bHRpc2lnIGhleCBpcyBpbXBvcnQgd2hlbiBjb25uZWN0ZWQgdG8gYW4gdW50cnVzdGVkIGRhZW1vbixcbiAgICogc28gdGhlIHdhbGxldCB3aWxsIG5vdCByZXNjYW4gc3BlbnQgb3V0cHV0cy4gIFRoZW4gdGhlIHdhbGxldCBjb25uZWN0cyB0byBhIHRydXN0ZWRcbiAgICogZGFlbW9uLiAgVGhpcyBtZXRob2Qgc2hvdWxkIGJlIG1hbnVhbGx5IGludm9rZWQgdG8gcmVzY2FuIG91dHB1dHMuPC9wPlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHJlc2NhblNwZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5SZXNjYW4gdGhlIGJsb2NrY2hhaW4gZnJvbSBzY3JhdGNoLCBsb3NpbmcgYW55IGluZm9ybWF0aW9uIHdoaWNoIGNhbm5vdCBiZSByZWNvdmVyZWQgZnJvbVxuICAgKiB0aGUgYmxvY2tjaGFpbiBpdHNlbGYuPC9wPlxuICAgKiBcbiAgICogPHA+V0FSTklORzogVGhpcyBtZXRob2QgZGlzY2FyZHMgbG9jYWwgd2FsbGV0IGRhdGEgbGlrZSBkZXN0aW5hdGlvbiBhZGRyZXNzZXMsIHR4IHNlY3JldCBrZXlzLFxuICAgKiB0eCBub3RlcywgZXRjLjwvcD5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyByZXNjYW5CbG9ja2NoYWluKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGJhbGFuY2Ugb2YgdGhlIHdhbGxldCwgYWNjb3VudCwgb3Igc3ViYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbYWNjb3VudElkeF0gLSBpbmRleCBvZiB0aGUgYWNjb3VudCB0byBnZXQgdGhlIGJhbGFuY2Ugb2YgKGRlZmF1bHQgYWxsIGFjY291bnRzKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N1YmFkZHJlc3NJZHhdIC0gaW5kZXggb2YgdGhlIHN1YmFkZHJlc3MgdG8gZ2V0IHRoZSBiYWxhbmNlIG9mIChkZWZhdWx0IGFsbCBzdWJhZGRyZXNzZXMpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8YmlnaW50Pn0gdGhlIGJhbGFuY2Ugb2YgdGhlIHdhbGxldCwgYWNjb3VudCwgb3Igc3ViYWRkcmVzc1xuICAgKi9cbiAgYXN5bmMgZ2V0QmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB1bmxvY2tlZCBiYWxhbmNlIG9mIHRoZSB3YWxsZXQsIGFjY291bnQsIG9yIHN1YmFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW2FjY291bnRJZHhdIC0gaW5kZXggb2YgdGhlIGFjY291bnQgdG8gZ2V0IHRoZSB1bmxvY2tlZCBiYWxhbmNlIG9mIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdWJhZGRyZXNzSWR4XSAtIGluZGV4IG9mIHRoZSBzdWJhZGRyZXNzIHRvIGdldCB0aGUgdW5sb2NrZWQgYmFsYW5jZSBvZiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8YmlnaW50Pn0gdGhlIHVubG9ja2VkIGJhbGFuY2Ugb2YgdGhlIHdhbGxldCwgYWNjb3VudCwgb3Igc3ViYWRkcmVzc1xuICAgKi9cbiAgYXN5bmMgZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIG51bWJlciBvZiBibG9ja3MgdW50aWwgdGhlIG5leHQgYW5kIGxhc3QgZnVuZHMgdW5sb2NrLiBJZ25vcmVzIHR4cyB3aXRoIHVubG9jayB0aW1lIGFzIHRpbWVzdGFtcC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyW10+fSB0aGUgbnVtYmVyIG9mIGJsb2NrcyB1bnRpbCB0aGUgbmV4dCBhbmQgbGFzdCBmdW5kcyB1bmxvY2sgaW4gZWxlbWVudHMgMCBhbmQgMSwgcmVzcGVjdGl2ZWx5LCBvciB1bmRlZmluZWQgaWYgbm8gYmFsYW5jZVxuICAgKi9cbiAgYXN5bmMgZ2V0TnVtQmxvY2tzVG9VbmxvY2soKTogUHJvbWlzZTxudW1iZXJbXT4ge1xuICAgIFxuICAgIC8vIGdldCBiYWxhbmNlc1xuICAgIGxldCBiYWxhbmNlID0gYXdhaXQgdGhpcy5nZXRCYWxhbmNlKCk7XG4gICAgaWYgKGJhbGFuY2UgPT09IDBuKSByZXR1cm4gW3VuZGVmaW5lZCwgdW5kZWZpbmVkXTsgLy8gc2tpcCBpZiBubyBiYWxhbmNlXG4gICAgbGV0IHVubG9ja2VkQmFsYW5jZSA9IGF3YWl0IHRoaXMuZ2V0VW5sb2NrZWRCYWxhbmNlKCk7XG4gICAgXG4gICAgLy8gY29tcHV0ZSBudW1iZXIgb2YgYmxvY2tzIHVudGlsIG5leHQgZnVuZHMgYXZhaWxhYmxlXG4gICAgbGV0IHR4czogTW9uZXJvVHhXYWxsZXRbXTtcbiAgICBsZXQgaGVpZ2h0OiBudW1iZXI7XG4gICAgbGV0IG51bUJsb2Nrc1RvTmV4dFVubG9jayA9IHVuZGVmaW5lZDtcbiAgICBpZiAodW5sb2NrZWRCYWxhbmNlID4gMG4pIG51bUJsb2Nrc1RvTmV4dFVubG9jayA9IDA7XG4gICAgZWxzZSB7XG4gICAgICB0eHMgPSBhd2FpdCB0aGlzLmdldFR4cyh7aXNMb2NrZWQ6IHRydWV9KTsgLy8gZ2V0IGxvY2tlZCB0eHNcbiAgICAgIGhlaWdodCA9IGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCk7IC8vIGdldCBtb3N0IHJlY2VudCBoZWlnaHRcbiAgICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgICBpZiAoIXR4LmdldElzQ29uZmlybWVkKCkgJiYgTW9uZXJvVXRpbHMuaXNUaW1lc3RhbXAodHguZ2V0VW5sb2NrVGltZSgpKSkgY29udGludWU7XG4gICAgICAgIGxldCBudW1CbG9ja3NUb1VubG9jayA9IE1hdGgubWF4KCh0eC5nZXRJc0NvbmZpcm1lZCgpID8gdHguZ2V0SGVpZ2h0KCkgOiBoZWlnaHQpICsgMTAsIE51bWJlcih0eC5nZXRVbmxvY2tUaW1lKCkpKSAtIGhlaWdodDtcbiAgICAgICAgbnVtQmxvY2tzVG9OZXh0VW5sb2NrID0gbnVtQmxvY2tzVG9OZXh0VW5sb2NrID09PSB1bmRlZmluZWQgPyBudW1CbG9ja3NUb1VubG9jayA6IE1hdGgubWluKG51bUJsb2Nrc1RvTmV4dFVubG9jaywgbnVtQmxvY2tzVG9VbmxvY2spO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBjb21wdXRlIG51bWJlciBvZiBibG9ja3MgdW50aWwgYWxsIGZ1bmRzIGF2YWlsYWJsZVxuICAgIGxldCBudW1CbG9ja3NUb0xhc3RVbmxvY2sgPSB1bmRlZmluZWQ7XG4gICAgaWYgKGJhbGFuY2UgPT09IHVubG9ja2VkQmFsYW5jZSkge1xuICAgICAgaWYgKHVubG9ja2VkQmFsYW5jZSA+IDBuKSBudW1CbG9ja3NUb0xhc3RVbmxvY2sgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIXR4cykge1xuICAgICAgICB0eHMgPSBhd2FpdCB0aGlzLmdldFR4cyh7aXNMb2NrZWQ6IHRydWV9KTsgLy8gZ2V0IGxvY2tlZCB0eHNcbiAgICAgICAgaGVpZ2h0ID0gYXdhaXQgdGhpcy5nZXRIZWlnaHQoKTsgLy8gZ2V0IG1vc3QgcmVjZW50IGhlaWdodFxuICAgICAgfVxuICAgICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICAgIGlmICghdHguZ2V0SXNDb25maXJtZWQoKSAmJiBNb25lcm9VdGlscy5pc1RpbWVzdGFtcCh0eC5nZXRVbmxvY2tUaW1lKCkpKSBjb250aW51ZTtcbiAgICAgICAgbGV0IG51bUJsb2Nrc1RvVW5sb2NrID0gTWF0aC5tYXgoKHR4LmdldElzQ29uZmlybWVkKCkgPyB0eC5nZXRIZWlnaHQoKSA6IGhlaWdodCkgKyAxMCwgTnVtYmVyKHR4LmdldFVubG9ja1RpbWUoKSkpIC0gaGVpZ2h0O1xuICAgICAgICBudW1CbG9ja3NUb0xhc3RVbmxvY2sgPSBudW1CbG9ja3NUb0xhc3RVbmxvY2sgPT09IHVuZGVmaW5lZCA/IG51bUJsb2Nrc1RvVW5sb2NrIDogTWF0aC5tYXgobnVtQmxvY2tzVG9MYXN0VW5sb2NrLCBudW1CbG9ja3NUb1VubG9jayk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBbbnVtQmxvY2tzVG9OZXh0VW5sb2NrLCBudW1CbG9ja3NUb0xhc3RVbmxvY2tdO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGFjY291bnRzIHdpdGggYSBnaXZlbiB0YWcuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGluY2x1ZGVTdWJhZGRyZXNzZXMgLSBpbmNsdWRlIHN1YmFkZHJlc3NlcyBpZiB0cnVlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgLSB0YWcgZm9yIGZpbHRlcmluZyBhY2NvdW50cywgYWxsIGFjY291bnRzIGlmIHVuZGVmaW5lZFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0FjY291bnRbXT59IGFsbCBhY2NvdW50cyB3aXRoIHRoZSBnaXZlbiB0YWdcbiAgICovXG4gIGFzeW5jIGdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCB0YWc/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnRbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYW4gYWNjb3VudC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gaW5kZXggb2YgdGhlIGFjY291bnQgdG8gZ2V0XG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaW5jbHVkZVN1YmFkZHJlc3NlcyAtIGluY2x1ZGUgc3ViYWRkcmVzc2VzIGlmIHRydWVcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9BY2NvdW50Pn0gdGhlIHJldHJpZXZlZCBhY2NvdW50XG4gICAqL1xuICBhc3luYyBnZXRBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IGFjY291bnQgd2l0aCBhIGxhYmVsIGZvciB0aGUgZmlyc3Qgc3ViYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbGFiZWxdIC0gbGFiZWwgZm9yIGFjY291bnQncyBmaXJzdCBzdWJhZGRyZXNzIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9BY2NvdW50Pn0gdGhlIGNyZWF0ZWQgYWNjb3VudFxuICAgKi9cbiAgYXN5bmMgY3JlYXRlQWNjb3VudChsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQWNjb3VudD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGFuIGFjY291bnQgbGFiZWwuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gYWNjb3VudElkeCAtIGluZGV4IG9mIHRoZSBhY2NvdW50IHRvIHNldCB0aGUgbGFiZWwgZm9yXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBsYWJlbCAtIHRoZSBsYWJlbCB0byBzZXRcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldEFjY291bnRMYWJlbChhY2NvdW50SWR4OiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnNldFN1YmFkZHJlc3NMYWJlbChhY2NvdW50SWR4LCAwLCBsYWJlbCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgc3ViYWRkcmVzc2VzIGluIGFuIGFjY291bnQuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gYWNjb3VudElkeCAtIGFjY291bnQgdG8gZ2V0IHN1YmFkZHJlc3NlcyB3aXRoaW5cbiAgICogQHBhcmFtIHtudW1iZXJbXX0gW3N1YmFkZHJlc3NJbmRpY2VzXSAtIGluZGljZXMgb2Ygc3ViYWRkcmVzc2VzIHRvIGdldCAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvU3ViYWRkcmVzc1tdPn0gdGhlIHJldHJpZXZlZCBzdWJhZGRyZXNzZXNcbiAgICovXG4gIGFzeW5jIGdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJbmRpY2VzPzogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3NbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSBzdWJhZGRyZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFjY291bnRJZHggLSBpbmRleCBvZiB0aGUgc3ViYWRkcmVzcydzIGFjY291bnRcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN1YmFkZHJlc3NJZHggLSBpbmRleCBvZiB0aGUgc3ViYWRkcmVzcyB3aXRoaW4gdGhlIGFjY291bnRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPn0gdGhlIHJldHJpZXZlZCBzdWJhZGRyZXNzXG4gICAqL1xuICBhc3luYyBnZXRTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgYXNzZXJ0KGFjY291bnRJZHggPj0gMCk7XG4gICAgYXNzZXJ0KHN1YmFkZHJlc3NJZHggPj0gMCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBbc3ViYWRkcmVzc0lkeF0pKVswXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENyZWF0ZSBhIHN1YmFkZHJlc3Mgd2l0aGluIGFuIGFjY291bnQuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gYWNjb3VudElkeCAtIGluZGV4IG9mIHRoZSBhY2NvdW50IHRvIGNyZWF0ZSB0aGUgc3ViYWRkcmVzcyB3aXRoaW5cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtsYWJlbF0gLSB0aGUgbGFiZWwgZm9yIHRoZSBzdWJhZGRyZXNzIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPn0gdGhlIGNyZWF0ZWQgc3ViYWRkcmVzc1xuICAgKi9cbiAgYXN5bmMgY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYSBzdWJhZGRyZXNzIGxhYmVsLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFjY291bnRJZHggLSBpbmRleCBvZiB0aGUgYWNjb3VudCB0byBzZXQgdGhlIGxhYmVsIGZvclxuICAgKiBAcGFyYW0ge251bWJlcn0gc3ViYWRkcmVzc0lkeCAtIGluZGV4IG9mIHRoZSBzdWJhZGRyZXNzIHRvIHNldCB0aGUgbGFiZWwgZm9yXG4gICAqIEBwYXJhbSB7UHJvbWlzZTxzdHJpbmc+fSBsYWJlbCAtIHRoZSBsYWJlbCB0byBzZXRcbiAgICovXG4gIGFzeW5jIHNldFN1YmFkZHJlc3NMYWJlbChhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlciwgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSB3YWxsZXQgdHJhbnNhY3Rpb24gYnkgaGFzaC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSBoYXNoIG9mIGEgdHJhbnNhY3Rpb24gdG8gZ2V0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhXYWxsZXQ+IH0gdGhlIGlkZW50aWZpZWQgdHJhbnNhY3Rpb24gb3IgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZFxuICAgKi9cbiAgYXN5bmMgZ2V0VHgodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7XG4gICAgbGV0IHR4cyA9IGF3YWl0IHRoaXMuZ2V0VHhzKFt0eEhhc2hdKTtcbiAgICByZXR1cm4gdHhzLmxlbmd0aCA9PT0gMCA/IHVuZGVmaW5lZCA6IHR4c1swXTsgXG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5HZXQgd2FsbGV0IHRyYW5zYWN0aW9ucy4gIFdhbGxldCB0cmFuc2FjdGlvbnMgY29udGFpbiBvbmUgb3IgbW9yZVxuICAgKiB0cmFuc2ZlcnMgdGhhdCBhcmUgZWl0aGVyIGluY29taW5nIG9yIG91dGdvaW5nIHRvIHRoZSB3YWxsZXQuPHA+XG4gICAqIFxuICAgKiA8cD5SZXN1bHRzIGNhbiBiZSBmaWx0ZXJlZCBieSBwYXNzaW5nIGEgcXVlcnkgb2JqZWN0LiAgVHJhbnNhY3Rpb25zIG11c3RcbiAgICogbWVldCBldmVyeSBjcml0ZXJpYSBkZWZpbmVkIGluIHRoZSBxdWVyeSBpbiBvcmRlciB0byBiZSByZXR1cm5lZC4gIEFsbFxuICAgKiBjcml0ZXJpYSBhcmUgb3B0aW9uYWwgYW5kIG5vIGZpbHRlcmluZyBpcyBhcHBsaWVkIHdoZW4gbm90IGRlZmluZWQuPC9wPlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXSB8IE1vbmVyb1R4UXVlcnl9IFtxdWVyeV0gLSBjb25maWd1cmVzIHRoZSBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzQ29uZmlybWVkXSAtIGdldCB0eHMgdGhhdCBhcmUgY29uZmlybWVkIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmluVHhQb29sXSAtIGdldCB0eHMgdGhhdCBhcmUgaW4gdGhlIHR4IHBvb2wgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNSZWxheWVkXSAtIGdldCB0eHMgdGhhdCBhcmUgcmVsYXllZCBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc0ZhaWxlZF0gLSBnZXQgdHhzIHRoYXQgYXJlIGZhaWxlZCBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc01pbmVyVHhdIC0gZ2V0IG1pbmVyIHR4cyBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3F1ZXJ5Lmhhc2hdIC0gZ2V0IGEgdHggd2l0aCB0aGUgaGFzaCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IFtxdWVyeS5oYXNoZXNdIC0gZ2V0IHR4cyB3aXRoIHRoZSBoYXNoZXMgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3F1ZXJ5LnBheW1lbnRJZF0gLSBnZXQgdHJhbnNhY3Rpb25zIHdpdGggdGhlIHBheW1lbnQgaWQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBbcXVlcnkucGF5bWVudElkc10gLSBnZXQgdHJhbnNhY3Rpb25zIHdpdGggdGhlIHBheW1lbnQgaWRzIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaGFzUGF5bWVudElkXSAtIGdldCB0cmFuc2FjdGlvbnMgd2l0aCBhIHBheW1lbnQgaWQgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5taW5IZWlnaHRdIC0gZ2V0IHR4cyB3aXRoIGhlaWdodCA+PSB0aGUgZ2l2ZW4gaGVpZ2h0IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5tYXhIZWlnaHRdIC0gZ2V0IHR4cyB3aXRoIGhlaWdodCA8PSB0aGUgZ2l2ZW4gaGVpZ2h0IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNPdXRnb2luZ10gLSBnZXQgdHhzIHdpdGggYW4gb3V0Z29pbmcgdHJhbnNmZXIgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNJbmNvbWluZ10gLSBnZXQgdHhzIHdpdGggYW4gaW5jb21pbmcgdHJhbnNmZXIgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtNb25lcm9UcmFuc2ZlclF1ZXJ5fSBbcXVlcnkudHJhbnNmZXJRdWVyeV0gLSBnZXQgdHhzIHRoYXQgaGF2ZSBhIHRyYW5zZmVyIHRoYXQgbWVldHMgdGhpcyBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmluY2x1ZGVPdXRwdXRzXSAtIHNwZWNpZmllcyB0aGF0IHR4IG91dHB1dHMgc2hvdWxkIGJlIHJldHVybmVkIHdpdGggdHggcmVzdWx0cyAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhXYWxsZXRbXT59IHdhbGxldCB0cmFuc2FjdGlvbnMgcGVyIHRoZSBjb25maWd1cmF0aW9uXG4gICAqL1xuICBhc3luYyBnZXRUeHMocXVlcnk/OiBzdHJpbmdbXSB8IFBhcnRpYWw8TW9uZXJvVHhRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIDxwPkdldCBpbmNvbWluZyBhbmQgb3V0Z29pbmcgdHJhbnNmZXJzIHRvIGFuZCBmcm9tIHRoaXMgd2FsbGV0LiAgQW4gb3V0Z29pbmdcbiAgICogdHJhbnNmZXIgcmVwcmVzZW50cyBhIHRvdGFsIGFtb3VudCBzZW50IGZyb20gb25lIG9yIG1vcmUgc3ViYWRkcmVzc2VzXG4gICAqIHdpdGhpbiBhbiBhY2NvdW50IHRvIGluZGl2aWR1YWwgZGVzdGluYXRpb24gYWRkcmVzc2VzLCBlYWNoIHdpdGggdGhlaXJcbiAgICogb3duIGFtb3VudC4gIEFuIGluY29taW5nIHRyYW5zZmVyIHJlcHJlc2VudHMgYSB0b3RhbCBhbW91bnQgcmVjZWl2ZWQgaW50b1xuICAgKiBhIHN1YmFkZHJlc3Mgd2l0aGluIGFuIGFjY291bnQuICBUcmFuc2ZlcnMgYmVsb25nIHRvIHRyYW5zYWN0aW9ucyB3aGljaFxuICAgKiBhcmUgc3RvcmVkIG9uIHRoZSBibG9ja2NoYWluLjwvcD5cbiAgICogXG4gICAqIDxwPlJlc3VsdHMgY2FuIGJlIGZpbHRlcmVkIGJ5IHBhc3NpbmcgYSBxdWVyeSBvYmplY3QuICBUcmFuc2ZlcnMgbXVzdFxuICAgKiBtZWV0IGV2ZXJ5IGNyaXRlcmlhIGRlZmluZWQgaW4gdGhlIHF1ZXJ5IGluIG9yZGVyIHRvIGJlIHJldHVybmVkLiAgQWxsXG4gICAqIGNyaXRlcmlhIGFyZSBvcHRpb25hbCBhbmQgbm8gZmlsdGVyaW5nIGlzIGFwcGxpZWQgd2hlbiBub3QgZGVmaW5lZC48L3A+XG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1RyYW5zZmVyUXVlcnl9IFtxdWVyeV0gLSBjb25maWd1cmVzIHRoZSBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzT3V0Z29pbmddIC0gZ2V0IHRyYW5zZmVycyB0aGF0IGFyZSBvdXRnb2luZyBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc0luY29taW5nXSAtIGdldCB0cmFuc2ZlcnMgdGhhdCBhcmUgaW5jb21pbmcgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtxdWVyeS5hZGRyZXNzXSAtIHdhbGxldCdzIGFkZHJlc3MgdGhhdCBhIHRyYW5zZmVyIGVpdGhlciBvcmlnaW5hdGVkIGZyb20gKGlmIG91dGdvaW5nKSBvciBpcyBkZXN0aW5lZCBmb3IgKGlmIGluY29taW5nKSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkuYWNjb3VudEluZGV4XSAtIGdldCB0cmFuc2ZlcnMgdGhhdCBlaXRoZXIgb3JpZ2luYXRlZCBmcm9tIChpZiBvdXRnb2luZykgb3IgYXJlIGRlc3RpbmVkIGZvciAoaWYgaW5jb21pbmcpIGEgc3BlY2lmaWMgYWNjb3VudCBpbmRleCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkuc3ViYWRkcmVzc0luZGV4XSAtIGdldCB0cmFuc2ZlcnMgdGhhdCBlaXRoZXIgb3JpZ2luYXRlZCBmcm9tIChpZiBvdXRnb2luZykgb3IgYXJlIGRlc3RpbmVkIGZvciAoaWYgaW5jb21pbmcpIGEgc3BlY2lmaWMgc3ViYWRkcmVzcyBpbmRleCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7aW50W119IFtxdWVyeS5zdWJhZGRyZXNzSW5kaWNlc10gLSBnZXQgdHJhbnNmZXJzIHRoYXQgZWl0aGVyIG9yaWdpbmF0ZWQgZnJvbSAoaWYgb3V0Z29pbmcpIG9yIGFyZSBkZXN0aW5lZCBmb3IgKGlmIGluY29taW5nKSBzcGVjaWZpYyBzdWJhZGRyZXNzIGluZGljZXMgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludH0gW3F1ZXJ5LmFtb3VudF0gLSBhbW91bnQgYmVpbmcgdHJhbnNmZXJyZWQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb0Rlc3RpbmF0aW9uW10gfCBNb25lcm9EZXN0aW5hdGlvbk1vZGVsW119IFtxdWVyeS5kZXN0aW5hdGlvbnNdIC0gaW5kaXZpZHVhbCBkZXN0aW5hdGlvbnMgb2YgYW4gb3V0Z29pbmcgdHJhbnNmZXIsIHdoaWNoIGlzIGxvY2FsIHdhbGxldCBkYXRhIGFuZCBOT1QgcmVjb3ZlcmFibGUgZnJvbSB0aGUgYmxvY2tjaGFpbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5Lmhhc0Rlc3RpbmF0aW9uc10gLSBnZXQgdHJhbnNmZXJzIHRoYXQgaGF2ZSBkZXN0aW5hdGlvbnMgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtNb25lcm9UeFF1ZXJ5fSBbcXVlcnkudHhRdWVyeV0gLSBnZXQgdHJhbnNmZXJzIHdob3NlIHRyYW5zYWN0aW9uIG1lZXRzIHRoaXMgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1RyYW5zZmVyW10+fSB3YWxsZXQgdHJhbnNmZXJzIHRoYXQgbWVldCB0aGUgcXVlcnlcbiAgICovXG4gIGFzeW5jIGdldFRyYW5zZmVycyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1RyYW5zZmVyW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGluY29taW5nIHRyYW5zZmVycy5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pn0gW3F1ZXJ5XSAtIGNvbmZpZ3VyZXMgdGhlIHF1ZXJ5IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtxdWVyeS5hZGRyZXNzXSAtIGdldCBpbmNvbWluZyB0cmFuc2ZlcnMgdG8gYSBzcGVjaWZpYyBhZGRyZXNzIGluIHRoZSB3YWxsZXQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LmFjY291bnRJbmRleF0gLSBnZXQgaW5jb21pbmcgdHJhbnNmZXJzIHRvIGEgc3BlY2lmaWMgYWNjb3VudCBpbmRleCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkuc3ViYWRkcmVzc0luZGV4XSAtIGdldCBpbmNvbWluZyB0cmFuc2ZlcnMgdG8gYSBzcGVjaWZpYyBzdWJhZGRyZXNzIGluZGV4IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtpbnRbXX0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRpY2VzXSAtIGdldCB0cmFuc2ZlcnMgZGVzdGluZWQgZm9yIHNwZWNpZmljIHN1YmFkZHJlc3MgaW5kaWNlcyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7YmlnaW50fSBbcXVlcnkuYW1vdW50XSAtIGFtb3VudCBiZWluZyB0cmFuc2ZlcnJlZCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhRdWVyeX0gW3F1ZXJ5LnR4UXVlcnldIC0gZ2V0IHRyYW5zZmVycyB3aG9zZSB0cmFuc2FjdGlvbiBtZWV0cyB0aGlzIHF1ZXJ5IChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9JbmNvbWluZ1RyYW5zZmVyW10+fSBpbmNvbWluZyB0cmFuc2ZlcnMgdGhhdCBtZWV0IHRoZSBxdWVyeVxuICAgKi9cbiAgYXN5bmMgZ2V0SW5jb21pbmdUcmFuc2ZlcnMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9JbmNvbWluZ1RyYW5zZmVyW10+IHtcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQ6IE1vbmVyb1RyYW5zZmVyUXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSk7XG4gICAgaWYgKHF1ZXJ5Tm9ybWFsaXplZC5nZXRJc0luY29taW5nKCkgPT09IGZhbHNlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJUcmFuc2ZlciBxdWVyeSBjb250cmFkaWN0cyBnZXR0aW5nIGluY29taW5nIHRyYW5zZmVyc1wiKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0SXNJbmNvbWluZyh0cnVlKTtcbiAgICByZXR1cm4gdGhpcy5nZXRUcmFuc2ZlcnMocXVlcnlOb3JtYWxpemVkKSBhcyB1bmtub3duIGFzIE1vbmVyb0luY29taW5nVHJhbnNmZXJbXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBvdXRnb2luZyB0cmFuc2ZlcnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT59IFtxdWVyeV0gLSBjb25maWd1cmVzIHRoZSBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcXVlcnkuYWRkcmVzc10gLSBnZXQgb3V0Z29pbmcgdHJhbnNmZXJzIGZyb20gYSBzcGVjaWZpYyBhZGRyZXNzIGluIHRoZSB3YWxsZXQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LmFjY291bnRJbmRleF0gLSBnZXQgb3V0Z29pbmcgdHJhbnNmZXJzIGZyb20gYSBzcGVjaWZpYyBhY2NvdW50IGluZGV4IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5zdWJhZGRyZXNzSW5kZXhdIC0gZ2V0IG91dGdvaW5nIHRyYW5zZmVycyBmcm9tIGEgc3BlY2lmaWMgc3ViYWRkcmVzcyBpbmRleCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7aW50W119IFtxdWVyeS5zdWJhZGRyZXNzSW5kaWNlc10gLSBnZXQgb3V0Z29pbmcgdHJhbnNmZXJzIGZyb20gc3BlY2lmaWMgc3ViYWRkcmVzcyBpbmRpY2VzIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtiaWdpbnR9IFtxdWVyeS5hbW91bnRdIC0gYW1vdW50IGJlaW5nIHRyYW5zZmVycmVkIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtNb25lcm9EZXN0aW5hdGlvbltdIHwgTW9uZXJvRGVzdGluYXRpb25Nb2RlbFtdfSBbcXVlcnkuZGVzdGluYXRpb25zXSAtIGluZGl2aWR1YWwgZGVzdGluYXRpb25zIG9mIGFuIG91dGdvaW5nIHRyYW5zZmVyLCB3aGljaCBpcyBsb2NhbCB3YWxsZXQgZGF0YSBhbmQgTk9UIHJlY292ZXJhYmxlIGZyb20gdGhlIGJsb2NrY2hhaW4gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5oYXNEZXN0aW5hdGlvbnNdIC0gZ2V0IHRyYW5zZmVycyB0aGF0IGhhdmUgZGVzdGluYXRpb25zIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhRdWVyeX0gW3F1ZXJ5LnR4UXVlcnldIC0gZ2V0IHRyYW5zZmVycyB3aG9zZSB0cmFuc2FjdGlvbiBtZWV0cyB0aGlzIHF1ZXJ5IChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9PdXRnb2luZ1RyYW5zZmVyW10+fSBvdXRnb2luZyB0cmFuc2ZlcnMgdGhhdCBtZWV0IHRoZSBxdWVyeVxuICAgKi9cbiAgYXN5bmMgZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9PdXRnb2luZ1RyYW5zZmVyW10+IHtcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQ6IE1vbmVyb1RyYW5zZmVyUXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSk7XG4gICAgaWYgKHF1ZXJ5Tm9ybWFsaXplZC5nZXRJc091dGdvaW5nKCkgPT09IGZhbHNlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJUcmFuc2ZlciBxdWVyeSBjb250cmFkaWN0cyBnZXR0aW5nIG91dGdvaW5nIHRyYW5zZmVyc1wiKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0SXNPdXRnb2luZyh0cnVlKTtcbiAgICByZXR1cm4gdGhpcy5nZXRUcmFuc2ZlcnMocXVlcnlOb3JtYWxpemVkKSBhcyB1bmtub3duIGFzIE1vbmVyb091dGdvaW5nVHJhbnNmZXJbXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPkdldCBvdXRwdXRzIGNyZWF0ZWQgZnJvbSBwcmV2aW91cyB0cmFuc2FjdGlvbnMgdGhhdCBiZWxvbmcgdG8gdGhlIHdhbGxldFxuICAgKiAoaS5lLiB0aGF0IHRoZSB3YWxsZXQgY2FuIHNwZW5kIG9uZSB0aW1lKS4gIE91dHB1dHMgYXJlIHBhcnQgb2ZcbiAgICogdHJhbnNhY3Rpb25zIHdoaWNoIGFyZSBzdG9yZWQgaW4gYmxvY2tzIG9uIHRoZSBibG9ja2NoYWluLjwvcD5cbiAgICogXG4gICAqIDxwPlJlc3VsdHMgY2FuIGJlIGZpbHRlcmVkIGJ5IHBhc3NpbmcgYSBxdWVyeSBvYmplY3QuICBPdXRwdXRzIG11c3RcbiAgICogbWVldCBldmVyeSBjcml0ZXJpYSBkZWZpbmVkIGluIHRoZSBxdWVyeSBpbiBvcmRlciB0byBiZSByZXR1cm5lZC4gIEFsbFxuICAgKiBmaWx0ZXJpbmcgaXMgb3B0aW9uYWwgYW5kIG5vIGZpbHRlcmluZyBpcyBhcHBsaWVkIHdoZW4gbm90IGRlZmluZWQuPC9wPlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJpdGFsPE1vbmVyb091dHB1dFF1ZXJ5Pn0gW3F1ZXJ5XSAtIGNvbmZpZ3VyZXMgdGhlIHF1ZXJ5IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5hY2NvdW50SW5kZXhdIC0gZ2V0IG91dHB1dHMgYXNzb2NpYXRlZCB3aXRoIGEgc3BlY2lmaWMgYWNjb3VudCBpbmRleCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkuc3ViYWRkcmVzc0luZGV4XSAtIGdldCBvdXRwdXRzIGFzc29jaWF0ZWQgd2l0aCBhIHNwZWNpZmljIHN1YmFkZHJlc3MgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2ludFtdfSBbcXVlcnkuc3ViYWRkcmVzc0luZGljZXNdIC0gZ2V0IG91dHB1dHMgYXNzb2NpYXRlZCB3aXRoIHNwZWNpZmljIHN1YmFkZHJlc3MgaW5kaWNlcyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7YmlnaW50fSBbcXVlcnkuYW1vdW50XSAtIGdldCBvdXRwdXRzIHdpdGggYSBzcGVjaWZpYyBhbW91bnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludH0gW3F1ZXJ5Lm1pbkFtb3VudF0gLSBnZXQgb3V0cHV0cyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gYSBtaW5pbXVtIGFtb3VudCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7YmlnaW50fSBbcXVlcnkubWF4QW1vdW50XSAtIGdldCBvdXRwdXRzIGxlc3MgdGhhbiBvciBlcXVhbCB0byBhIG1heGltdW0gYW1vdW50IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNTcGVudF0gLSBnZXQgb3V0cHV0cyB0aGF0IGFyZSBzcGVudCBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ3xNb25lcm9LZXlJbWFnZX0gW3F1ZXJ5LmtleUltYWdlXSAtIGdldCBvdXRwdXQgd2l0aCBhIGtleSBpbWFnZSBvciB3aGljaCBtYXRjaGVzIGZpZWxkcyBkZWZpbmVkIGluIGEgTW9uZXJvS2V5SW1hZ2UgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UXVlcnl9IFtxdWVyeS50eFF1ZXJ5XSAtIGdldCBvdXRwdXRzIHdob3NlIHRyYW5zYWN0aW9uIG1lZXRzIHRoaXMgZmlsdGVyIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9PdXRwdXRXYWxsZXRbXT59IHRoZSBxdWVyaWVkIG91dHB1dHNcbiAgICovXG4gIGFzeW5jIGdldE91dHB1dHMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb091dHB1dFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvT3V0cHV0V2FsbGV0W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRXhwb3J0IG91dHB1dHMgaW4gaGV4IGZvcm1hdC5cbiAgICpcbiAgICogQHBhcmFtIHtib29sZWFufSBbYWxsXSAtIGV4cG9ydCBhbGwgb3V0cHV0cyBpZiB0cnVlLCBlbHNlIGV4cG9ydCB0aGUgb3V0cHV0cyBzaW5jZSB0aGUgbGFzdCBleHBvcnQgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gb3V0cHV0cyBpbiBoZXggZm9ybWF0XG4gICAqL1xuICBhc3luYyBleHBvcnRPdXRwdXRzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogSW1wb3J0IG91dHB1dHMgaW4gaGV4IGZvcm1hdC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvdXRwdXRzSGV4IC0gb3V0cHV0cyBpbiBoZXggZm9ybWF0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIG51bWJlciBvZiBvdXRwdXRzIGltcG9ydGVkXG4gICAqL1xuICBhc3luYyBpbXBvcnRPdXRwdXRzKG91dHB1dHNIZXg6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEV4cG9ydCBzaWduZWQga2V5IGltYWdlcy5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2FsbF0gLSBleHBvcnQgYWxsIGtleSBpbWFnZXMgaWYgdHJ1ZSwgZWxzZSBleHBvcnQgdGhlIGtleSBpbWFnZXMgc2luY2UgdGhlIGxhc3QgZXhwb3J0IChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0tleUltYWdlW10+fSB0aGUgd2FsbGV0J3Mgc2lnbmVkIGtleSBpbWFnZXNcbiAgICovXG4gIGFzeW5jIGV4cG9ydEtleUltYWdlcyhhbGwgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbXBvcnQgc2lnbmVkIGtleSBpbWFnZXMgYW5kIHZlcmlmeSB0aGVpciBzcGVudCBzdGF0dXMuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb0tleUltYWdlW119IGtleUltYWdlcyAtIGltYWdlcyB0byBpbXBvcnQgYW5kIHZlcmlmeSAocmVxdWlyZXMgaGV4IGFuZCBzaWduYXR1cmUpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQ+fSByZXN1bHRzIG9mIHRoZSBpbXBvcnRcbiAgICovXG4gIGFzeW5jIGltcG9ydEtleUltYWdlcyhrZXlJbWFnZXM6IE1vbmVyb0tleUltYWdlW10pOiBQcm9taXNlPE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBuZXcga2V5IGltYWdlcyBmcm9tIHRoZSBsYXN0IGltcG9ydGVkIG91dHB1dHMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0tleUltYWdlW10+fSB0aGUga2V5IGltYWdlcyBmcm9tIHRoZSBsYXN0IGltcG9ydGVkIG91dHB1dHNcbiAgICovXG4gIGFzeW5jIGdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0KCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBGcmVlemUgYW4gb3V0cHV0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUltYWdlIC0ga2V5IGltYWdlIG9mIHRoZSBvdXRwdXQgdG8gZnJlZXplXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBmcmVlemVPdXRwdXQoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBUaGF3IGEgZnJvemVuIG91dHB1dC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJbWFnZSAtIGtleSBpbWFnZSBvZiB0aGUgb3V0cHV0IHRvIHRoYXdcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHRoYXdPdXRwdXQoa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDaGVjayBpZiBhbiBvdXRwdXQgaXMgZnJvemVuLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUltYWdlIC0ga2V5IGltYWdlIG9mIHRoZSBvdXRwdXQgdG8gY2hlY2sgaWYgZnJvemVuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIG91dHB1dCBpcyBmcm96ZW4sIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNPdXRwdXRGcm96ZW4oa2V5SW1hZ2U6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDcmVhdGUgYSB0cmFuc2FjdGlvbiB0byB0cmFuc2ZlciBmdW5kcyBmcm9tIHRoaXMgd2FsbGV0LlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeENvbmZpZ30gY29uZmlnIC0gY29uZmlndXJlcyB0aGUgdHJhbnNhY3Rpb24gdG8gY3JlYXRlIChyZXF1aXJlZClcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5hZGRyZXNzIC0gc2luZ2xlIGRlc3RpbmF0aW9uIGFkZHJlc3MgKHJlcXVpcmVkIHVubGVzcyBgZGVzdGluYXRpb25zYCBwcm92aWRlZClcbiAgICogQHBhcmFtIHtiaWdpbnR8c3RyaW5nfSBjb25maWcuYW1vdW50IC0gc2luZ2xlIGRlc3RpbmF0aW9uIGFtb3VudCAocmVxdWlyZWQgdW5sZXNzIGBkZXN0aW5hdGlvbnNgIHByb3ZpZGVkKVxuICAgKiBAcGFyYW0ge251bWJlcn0gY29uZmlnLmFjY291bnRJbmRleCAtIHNvdXJjZSBhY2NvdW50IGluZGV4IHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy5zdWJhZGRyZXNzSW5kZXhdIC0gc291cmNlIHN1YmFkZHJlc3MgaW5kZXggdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyW119IFtjb25maWcuc3ViYWRkcmVzc0luZGljZXNdIC0gc291cmNlIHN1YmFkZHJlc3MgaW5kaWNlcyB0byB0cmFuc2ZlciBmdW5kcyBmcm9tIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnJlbGF5XSAtIHJlbGF5IHRoZSB0cmFuc2FjdGlvbiB0byBwZWVycyB0byBjb21taXQgdG8gdGhlIGJsb2NrY2hhaW4gKGRlZmF1bHQgZmFsc2UpXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhQcmlvcml0eX0gW2NvbmZpZy5wcmlvcml0eV0gLSB0cmFuc2FjdGlvbiBwcmlvcml0eSAoZGVmYXVsdCBNb25lcm9UeFByaW9yaXR5Lk5PUk1BTClcbiAgICogQHBhcmFtIHtNb25lcm9EZXN0aW5hdGlvbltdfSBjb25maWcuZGVzdGluYXRpb25zIC0gYWRkcmVzc2VzIGFuZCBhbW91bnRzIGluIGEgbXVsdGktZGVzdGluYXRpb24gdHggKHJlcXVpcmVkIHVubGVzcyBgYWRkcmVzc2AgYW5kIGBhbW91bnRgIHByb3ZpZGVkKVxuICAgKiBAcGFyYW0ge251bWJlcltdfSBbY29uZmlnLnN1YnRyYWN0RmVlRnJvbV0gLSBsaXN0IG9mIGRlc3RpbmF0aW9uIGluZGljZXMgdG8gc3BsaXQgdGhlIHRyYW5zYWN0aW9uIGZlZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnBheW1lbnRJZF0gLSB0cmFuc2FjdGlvbiBwYXltZW50IElEIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtiaWdpbnR8c3RyaW5nfSBbY29uZmlnLnVubG9ja1RpbWVdIC0gbWluaW11bSBoZWlnaHQgb3IgdGltZXN0YW1wIGZvciB0aGUgdHJhbnNhY3Rpb24gdG8gdW5sb2NrIChkZWZhdWx0IDApXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhXYWxsZXQ+fSB0aGUgY3JlYXRlZCB0cmFuc2FjdGlvblxuICAgKi9cbiAgYXN5bmMgY3JlYXRlVHgoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHtcbiAgICBjb25zdCBjb25maWdOb3JtYWxpemVkOiBNb25lcm9UeENvbmZpZyA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpICE9PSB1bmRlZmluZWQpIGFzc2VydC5lcXVhbChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCksIGZhbHNlLCBcIkNhbm5vdCBzcGxpdCB0cmFuc2FjdGlvbnMgdXNpbmcgY3JlYXRlVHgoKTsgdXNlIGNyZWF0ZVR4cygpXCIpO1xuICAgIGNvbmZpZ05vcm1hbGl6ZWQuc2V0Q2FuU3BsaXQoZmFsc2UpO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5jcmVhdGVUeHMoY29uZmlnTm9ybWFsaXplZCkpWzBdO1xuICB9XG4gIFxuICAvKipcbiAgICogQ3JlYXRlIG9uZSBvciBtb3JlIHRyYW5zYWN0aW9ucyB0byB0cmFuc2ZlciBmdW5kcyBmcm9tIHRoaXMgd2FsbGV0LlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPn0gY29uZmlnIC0gY29uZmlndXJlcyB0aGUgdHJhbnNhY3Rpb25zIHRvIGNyZWF0ZSAocmVxdWlyZWQpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb25maWcuYWRkcmVzcyAtIHNpbmdsZSBkZXN0aW5hdGlvbiBhZGRyZXNzIChyZXF1aXJlZCB1bmxlc3MgYGRlc3RpbmF0aW9uc2AgcHJvdmlkZWQpXG4gICAqIEBwYXJhbSB7YmlnaW50fHN0cmluZ30gY29uZmlnLmFtb3VudCAtIHNpbmdsZSBkZXN0aW5hdGlvbiBhbW91bnQgKHJlcXVpcmVkIHVubGVzcyBgZGVzdGluYXRpb25zYCBwcm92aWRlZClcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNvbmZpZy5hY2NvdW50SW5kZXggLSBzb3VyY2UgYWNjb3VudCBpbmRleCB0byB0cmFuc2ZlciBmdW5kcyBmcm9tIChyZXF1aXJlZClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcuc3ViYWRkcmVzc0luZGV4XSAtIHNvdXJjZSBzdWJhZGRyZXNzIGluZGV4IHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2ludFtdfSBbY29uZmlnLnN1YmFkZHJlc3NJbmRpY2VzXSAtIHNvdXJjZSBzdWJhZGRyZXNzIGluZGljZXMgdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5yZWxheV0gLSByZWxheSB0aGUgdHJhbnNhY3Rpb25zIHRvIHBlZXJzIHRvIGNvbW1pdCB0byB0aGUgYmxvY2tjaGFpbiAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHBhcmFtIHtNb25lcm9UeFByaW9yaXR5fSBbY29uZmlnLnByaW9yaXR5XSAtIHRyYW5zYWN0aW9uIHByaW9yaXR5IChkZWZhdWx0IE1vbmVyb1R4UHJpb3JpdHkuTk9STUFMKVxuICAgKiBAcGFyYW0ge01vbmVyb0Rlc3RpbmF0aW9uW10gfCBNb25lcm9EZXN0aW5hdGlvbk1vZGVsW119IGNvbmZpZy5kZXN0aW5hdGlvbnMgLSBhZGRyZXNzZXMgYW5kIGFtb3VudHMgaW4gYSBtdWx0aS1kZXN0aW5hdGlvbiB0eCAocmVxdWlyZWQgdW5sZXNzIGBhZGRyZXNzYCBhbmQgYGFtb3VudGAgcHJvdmlkZWQpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbY29uZmlnLnBheW1lbnRJZF0gLSB0cmFuc2FjdGlvbiBwYXltZW50IElEIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtiaWdpbnR8c3RyaW5nfSBbY29uZmlnLnVubG9ja1RpbWVdIC0gbWluaW11bSBoZWlnaHQgb3IgdGltZXN0YW1wIGZvciB0aGUgdHJhbnNhY3Rpb25zIHRvIHVubG9jayAoZGVmYXVsdCAwKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcuY2FuU3BsaXRdIC0gYWxsb3cgZnVuZHMgdG8gYmUgdHJhbnNmZXJyZWQgdXNpbmcgbXVsdGlwbGUgdHJhbnNhY3Rpb25zIChkZWZhdWx0IHRydWUpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhXYWxsZXRbXT59IHRoZSBjcmVhdGVkIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgY3JlYXRlVHhzKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3dlZXAgYW4gb3V0cHV0IGJ5IGtleSBpbWFnZS5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9UeENvbmZpZz59IGNvbmZpZyAtIGNvbmZpZ3VyZXMgdGhlIHRyYW5zYWN0aW9uIHRvIGNyZWF0ZSAocmVxdWlyZWQpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb25maWcuYWRkcmVzcyAtIHNpbmdsZSBkZXN0aW5hdGlvbiBhZGRyZXNzIChyZXF1aXJlZClcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5rZXlJbWFnZSAtIGtleSBpbWFnZSB0byBzd2VlcCAocmVxdWlyZWQpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5yZWxheV0gLSByZWxheSB0aGUgdHJhbnNhY3Rpb24gdG8gcGVlcnMgdG8gY29tbWl0IHRvIHRoZSBibG9ja2NoYWluIChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcGFyYW0ge2JpZ2ludHxzdHJpbmd9IFtjb25maWcudW5sb2NrVGltZV0gLSBtaW5pbXVtIGhlaWdodCBvciB0aW1lc3RhbXAgZm9yIHRoZSB0cmFuc2FjdGlvbiB0byB1bmxvY2sgKGRlZmF1bHQgMClcbiAgICogQHBhcmFtIHtNb25lcm9UeFByaW9yaXR5fSBbY29uZmlnLnByaW9yaXR5XSAtIHRyYW5zYWN0aW9uIHByaW9yaXR5IChkZWZhdWx0IE1vbmVyb1R4UHJpb3JpdHkuTk9STUFMKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4V2FsbGV0Pn0gdGhlIGNyZWF0ZWQgdHJhbnNhY3Rpb25cbiAgICovXG4gIGFzeW5jIHN3ZWVwT3V0cHV0KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTd2VlcCBhbGwgdW5sb2NrZWQgZnVuZHMgYWNjb3JkaW5nIHRvIHRoZSBnaXZlbiBjb25maWd1cmF0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPn0gY29uZmlnIC0gY29uZmlndXJlcyB0aGUgdHJhbnNhY3Rpb25zIHRvIGNyZWF0ZSAocmVxdWlyZWQpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb25maWcuYWRkcmVzcyAtIHNpbmdsZSBkZXN0aW5hdGlvbiBhZGRyZXNzIChyZXF1aXJlZClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcuYWNjb3VudEluZGV4XSAtIHNvdXJjZSBhY2NvdW50IGluZGV4IHRvIHN3ZWVwIGZyb20gKG9wdGlvbmFsLCBkZWZhdWx0cyB0byBhbGwgYWNjb3VudHMpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnN1YmFkZHJlc3NJbmRleF0gLSBzb3VyY2Ugc3ViYWRkcmVzcyBpbmRleCB0byBzd2VlcCBmcm9tIChvcHRpb25hbCwgZGVmYXVsdHMgdG8gYWxsIHN1YmFkZHJlc3NlcylcbiAgICogQHBhcmFtIHtudW1iZXJbXX0gW2NvbmZpZy5zdWJhZGRyZXNzSW5kaWNlc10gLSBzb3VyY2Ugc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHN3ZWVwIGZyb20gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucmVsYXldIC0gcmVsYXkgdGhlIHRyYW5zYWN0aW9ucyB0byBwZWVycyB0byBjb21taXQgdG8gdGhlIGJsb2NrY2hhaW4gKGRlZmF1bHQgZmFsc2UpXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhQcmlvcml0eX0gW2NvbmZpZy5wcmlvcml0eV0gLSB0cmFuc2FjdGlvbiBwcmlvcml0eSAoZGVmYXVsdCBNb25lcm9UeFByaW9yaXR5Lk5PUk1BTClcbiAgICogQHBhcmFtIHtiaWdpbnR8c3RyaW5nfSBbY29uZmlnLnVubG9ja1RpbWVdIC0gbWluaW11bSBoZWlnaHQgb3IgdGltZXN0YW1wIGZvciB0aGUgdHJhbnNhY3Rpb25zIHRvIHVubG9jayAoZGVmYXVsdCAwKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcuc3dlZXBFYWNoU3ViYWRkcmVzc10gLSBzd2VlcCBlYWNoIHN1YmFkZHJlc3MgaW5kaXZpZHVhbGx5IGlmIHRydWUgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhXYWxsZXRbXT59IHRoZSBjcmVhdGVkIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgc3dlZXBVbmxvY2tlZChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPlN3ZWVwIGFsbCB1bm1peGFibGUgZHVzdCBvdXRwdXRzIGJhY2sgdG8gdGhlIHdhbGxldCB0byBtYWtlIHRoZW0gZWFzaWVyIHRvIHNwZW5kIGFuZCBtaXguPC9wPlxuICAgKiBcbiAgICogPHA+Tk9URTogRHVzdCBvbmx5IGV4aXN0cyBwcmUgUkNULCBzbyB0aGlzIG1ldGhvZCB3aWxsIHRocm93IFwibm8gZHVzdCB0byBzd2VlcFwiIG9uIG5ldyB3YWxsZXRzLjwvcD5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3JlbGF5XSAtIHNwZWNpZmllcyBpZiB0aGUgcmVzdWx0aW5nIHRyYW5zYWN0aW9uIHNob3VsZCBiZSByZWxheWVkIChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+fSB0aGUgY3JlYXRlZCB0cmFuc2FjdGlvbnNcbiAgICovXG4gIGFzeW5jIHN3ZWVwRHVzdChyZWxheT86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVsYXkgYSBwcmV2aW91c2x5IGNyZWF0ZWQgdHJhbnNhY3Rpb24uXG4gICAqIFxuICAgKiBAcGFyYW0geyhNb25lcm9UeFdhbGxldCB8IHN0cmluZyl9IHR4T3JNZXRhZGF0YSAtIHRyYW5zYWN0aW9uIG9yIGl0cyBtZXRhZGF0YSB0byByZWxheVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSBoYXNoIG9mIHRoZSByZWxheWVkIHR4XG4gICAqL1xuICBhc3luYyByZWxheVR4KHR4T3JNZXRhZGF0YTogTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5yZWxheVR4cyhbdHhPck1ldGFkYXRhXSkpWzBdO1xuICB9XG4gIFxuICAvKipcbiAgICogUmVsYXkgcHJldmlvdXNseSBjcmVhdGVkIHRyYW5zYWN0aW9ucy5cbiAgICogXG4gICAqIEBwYXJhbSB7KE1vbmVyb1R4V2FsbGV0W10gfCBzdHJpbmdbXSl9IHR4c09yTWV0YWRhdGFzIC0gdHJhbnNhY3Rpb25zIG9yIHRoZWlyIG1ldGFkYXRhIHRvIHJlbGF5XG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nW10+fSB0aGUgaGFzaGVzIG9mIHRoZSByZWxheWVkIHR4c1xuICAgKi9cbiAgYXN5bmMgcmVsYXlUeHModHhzT3JNZXRhZGF0YXM6IChNb25lcm9UeFdhbGxldCB8IHN0cmluZylbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRGVzY3JpYmUgYSB0eCBzZXQgZnJvbSB1bnNpZ25lZCB0eCBoZXguXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdW5zaWduZWRUeEhleCAtIHVuc2lnbmVkIHR4IGhleFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4U2V0Pn0gdGhlIHR4IHNldCBjb250YWluaW5nIHN0cnVjdHVyZWQgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBkZXNjcmliZVVuc2lnbmVkVHhTZXQodW5zaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIHJldHVybiB0aGlzLmRlc2NyaWJlVHhTZXQobmV3IE1vbmVyb1R4U2V0KCkuc2V0VW5zaWduZWRUeEhleCh1bnNpZ25lZFR4SGV4KSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZXNjcmliZSBhIHR4IHNldCBmcm9tIG11bHRpc2lnIHR4IGhleC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtdWx0aXNpZ1R4SGV4IC0gbXVsdGlzaWcgdHggaGV4XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhTZXQ+fSB0aGUgdHggc2V0IGNvbnRhaW5pbmcgc3RydWN0dXJlZCB0cmFuc2FjdGlvbnNcbiAgICovXG4gIGFzeW5jIGRlc2NyaWJlTXVsdGlzaWdUeFNldChtdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgcmV0dXJuIHRoaXMuZGVzY3JpYmVUeFNldChuZXcgTW9uZXJvVHhTZXQoKS5zZXRNdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXgpKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlc2NyaWJlIGEgdHggc2V0IGNvbnRhaW5pbmcgdW5zaWduZWQgb3IgbXVsdGlzaWcgdHggaGV4IHRvIGEgbmV3IHR4IHNldCBjb250YWluaW5nIHN0cnVjdHVyZWQgdHJhbnNhY3Rpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeFNldH0gdHhTZXQgLSBhIHR4IHNldCBjb250YWluaW5nIHVuc2lnbmVkIG9yIG11bHRpc2lnIHR4IGhleFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4U2V0Pn0gdHhTZXQgLSB0aGUgdHggc2V0IGNvbnRhaW5pbmcgc3RydWN0dXJlZCB0cmFuc2FjdGlvbnNcbiAgICovXG4gIGFzeW5jIGRlc2NyaWJlVHhTZXQodHhTZXQ6IE1vbmVyb1R4U2V0KTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTaWduIHVuc2lnbmVkIHRyYW5zYWN0aW9ucyBmcm9tIGEgdmlldy1vbmx5IHdhbGxldC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1bnNpZ25lZFR4SGV4IC0gdW5zaWduZWQgdHJhbnNhY3Rpb24gaGV4IGZyb20gd2hlbiB0aGUgdHJhbnNhY3Rpb25zIHdlcmUgY3JlYXRlZFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4U2V0Pn0gdGhlIHNpZ25lZCB0cmFuc2FjdGlvbiBzZXRcbiAgICovXG4gIGFzeW5jIHNpZ25UeHModW5zaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdWJtaXQgc2lnbmVkIHRyYW5zYWN0aW9ucyBmcm9tIGEgdmlldy1vbmx5IHdhbGxldC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzaWduZWRUeEhleCAtIHNpZ25lZCB0cmFuc2FjdGlvbiBoZXggZnJvbSBzaWduVHhzKClcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmdbXT59IHRoZSByZXN1bHRpbmcgdHJhbnNhY3Rpb24gaGFzaGVzXG4gICAqL1xuICBhc3luYyBzdWJtaXRUeHMoc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2lnbiBhIG1lc3NhZ2UuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSAtIHRoZSBtZXNzYWdlIHRvIHNpZ25cbiAgICogQHBhcmFtIHtNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZX0gW3NpZ25hdHVyZVR5cGVdIC0gc2lnbiB3aXRoIHNwZW5kIGtleSBvciB2aWV3IGtleSAoZGVmYXVsdCBzcGVuZCBrZXkpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbYWNjb3VudElkeF0gLSB0aGUgYWNjb3VudCBpbmRleCBvZiB0aGUgbWVzc2FnZSBzaWduYXR1cmUgKGRlZmF1bHQgMClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdWJhZGRyZXNzSWR4XSAtIHRoZSBzdWJhZGRyZXNzIGluZGV4IG9mIHRoZSBtZXNzYWdlIHNpZ25hdHVyZSAoZGVmYXVsdCAwKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSBzaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIHNpZ25NZXNzYWdlKG1lc3NhZ2U6IHN0cmluZywgc2lnbmF0dXJlVHlwZSA9IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVksIGFjY291bnRJZHggPSAwLCBzdWJhZGRyZXNzSWR4ID0gMCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFZlcmlmeSBhIHNpZ25hdHVyZSBvbiBhIG1lc3NhZ2UuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSAtIHNpZ25lZCBtZXNzYWdlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gc2lnbmluZyBhZGRyZXNzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzaWduYXR1cmUgLSBzaWduYXR1cmVcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0Pn0gdHJ1ZSBpZiB0aGUgc2lnbmF0dXJlIGlzIGdvb2QsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgdmVyaWZ5TWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgdHJhbnNhY3Rpb24ncyBzZWNyZXQga2V5IGZyb20gaXRzIGhhc2guXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gdHJhbnNhY3Rpb24ncyBoYXNoXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gLSB0cmFuc2FjdGlvbidzIHNlY3JldCBrZXlcbiAgICovXG4gIGFzeW5jIGdldFR4S2V5KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ2hlY2sgYSB0cmFuc2FjdGlvbiBpbiB0aGUgYmxvY2tjaGFpbiB3aXRoIGl0cyBzZWNyZXQga2V5LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIHRyYW5zYWN0aW9uIHRvIGNoZWNrXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEtleSAtIHRyYW5zYWN0aW9uJ3Mgc2VjcmV0IGtleVxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIGRlc3RpbmF0aW9uIHB1YmxpYyBhZGRyZXNzIG9mIHRoZSB0cmFuc2FjdGlvblxuICAgKiBAcmV0dXJuIHtyb21pc2U8TW9uZXJvQ2hlY2tUeD59IHRoZSByZXN1bHQgb2YgdGhlIGNoZWNrXG4gICAqL1xuICBhc3luYyBjaGVja1R4S2V5KHR4SGFzaDogc3RyaW5nLCB0eEtleTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgdHJhbnNhY3Rpb24gc2lnbmF0dXJlIHRvIHByb3ZlIGl0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIHRyYW5zYWN0aW9uIHRvIHByb3ZlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gZGVzdGluYXRpb24gcHVibGljIGFkZHJlc3Mgb2YgdGhlIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbWVzc2FnZV0gLSBtZXNzYWdlIHRvIGluY2x1ZGUgd2l0aCB0aGUgc2lnbmF0dXJlIHRvIGZ1cnRoZXIgYXV0aGVudGljYXRlIHRoZSBwcm9vZiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHRyYW5zYWN0aW9uIHNpZ25hdHVyZVxuICAgKi9cbiAgYXN5bmMgZ2V0VHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogUHJvdmUgYSB0cmFuc2FjdGlvbiBieSBjaGVja2luZyBpdHMgc2lnbmF0dXJlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIHRyYW5zYWN0aW9uIHRvIHByb3ZlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gZGVzdGluYXRpb24gcHVibGljIGFkZHJlc3Mgb2YgdGhlIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgdW5kZWZpbmVkfSBtZXNzYWdlIC0gbWVzc2FnZSBpbmNsdWRlZCB3aXRoIHRoZSBzaWduYXR1cmUgdG8gZnVydGhlciBhdXRoZW50aWNhdGUgdGhlIHByb29mXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzaWduYXR1cmUgIC0gdHJhbnNhY3Rpb24gc2lnbmF0dXJlIHRvIGNvbmZpcm1cbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9DaGVja1R4Pn0gdGhlIHJlc3VsdCBvZiB0aGUgY2hlY2tcbiAgICovXG4gIGFzeW5jIGNoZWNrVHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdlbmVyYXRlIGEgc2lnbmF0dXJlIHRvIHByb3ZlIGEgc3BlbmQuIFVubGlrZSBwcm92aW5nIGEgdHJhbnNhY3Rpb24sIGl0IGRvZXMgbm90IHJlcXVpcmUgdGhlIGRlc3RpbmF0aW9uIHB1YmxpYyBhZGRyZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIHRyYW5zYWN0aW9uIHRvIHByb3ZlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbWVzc2FnZV0gLSBtZXNzYWdlIHRvIGluY2x1ZGUgd2l0aCB0aGUgc2lnbmF0dXJlIHRvIGZ1cnRoZXIgYXV0aGVudGljYXRlIHRoZSBwcm9vZiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHRyYW5zYWN0aW9uIHNpZ25hdHVyZVxuICAgKi9cbiAgYXN5bmMgZ2V0U3BlbmRQcm9vZih0eEhhc2g6IHN0cmluZywgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFByb3ZlIGEgc3BlbmQgdXNpbmcgYSBzaWduYXR1cmUuIFVubGlrZSBwcm92aW5nIGEgdHJhbnNhY3Rpb24sIGl0IGRvZXMgbm90IHJlcXVpcmUgdGhlIGRlc3RpbmF0aW9uIHB1YmxpYyBhZGRyZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIHRyYW5zYWN0aW9uIHRvIHByb3ZlXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgdW5kZWZpbmVkfSBtZXNzYWdlIC0gbWVzc2FnZSBpbmNsdWRlZCB3aXRoIHRoZSBzaWduYXR1cmUgdG8gZnVydGhlciBhdXRoZW50aWNhdGUgdGhlIHByb29mIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNpZ25hdHVyZSAtIHRyYW5zYWN0aW9uIHNpZ25hdHVyZSB0byBjb25maXJtXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIHNpZ25hdHVyZSBpcyBnb29kLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGNoZWNrU3BlbmRQcm9vZih0eEhhc2g6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhIHNpZ25hdHVyZSB0byBwcm92ZSB0aGUgZW50aXJlIGJhbGFuY2Ugb2YgdGhlIHdhbGxldC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbWVzc2FnZV0gLSBtZXNzYWdlIGluY2x1ZGVkIHdpdGggdGhlIHNpZ25hdHVyZSB0byBmdXJ0aGVyIGF1dGhlbnRpY2F0ZSB0aGUgcHJvb2YgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSByZXNlcnZlIHByb29mIHNpZ25hdHVyZVxuICAgKi9cbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mV2FsbGV0KG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhIHNpZ25hdHVyZSB0byBwcm92ZSBhbiBhdmFpbGFibGUgYW1vdW50IGluIGFuIGFjY291bnQuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gYWNjb3VudElkeCAtIGFjY291bnQgdG8gcHJvdmUgb3duZXJzaGlwIG9mIHRoZSBhbW91bnRcbiAgICogQHBhcmFtIHtiaWdpbnR9IGFtb3VudCAtIG1pbmltdW0gYW1vdW50IHRvIHByb3ZlIGFzIGF2YWlsYWJsZSBpbiB0aGUgYWNjb3VudFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW21lc3NhZ2VdIC0gbWVzc2FnZSB0byBpbmNsdWRlIHdpdGggdGhlIHNpZ25hdHVyZSB0byBmdXJ0aGVyIGF1dGhlbnRpY2F0ZSB0aGUgcHJvb2YgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSByZXNlcnZlIHByb29mIHNpZ25hdHVyZVxuICAgKi9cbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGFtb3VudDogYmlnaW50LCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByb3ZlcyBhIHdhbGxldCBoYXMgYSBkaXNwb3NhYmxlIHJlc2VydmUgdXNpbmcgYSBzaWduYXR1cmUuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIHB1YmxpYyB3YWxsZXQgYWRkcmVzc1xuICAgKiBAcGFyYW0ge3N0cmluZyB8IHVuZGVmaW5lZH0gbWVzc2FnZSAtIG1lc3NhZ2UgaW5jbHVkZWQgd2l0aCB0aGUgc2lnbmF0dXJlIHRvIGZ1cnRoZXIgYXV0aGVudGljYXRlIHRoZSBwcm9vZiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzaWduYXR1cmUgLSByZXNlcnZlIHByb29mIHNpZ25hdHVyZSB0byBjaGVja1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0NoZWNrUmVzZXJ2ZT59IHRoZSByZXN1bHQgb2YgY2hlY2tpbmcgdGhlIHNpZ25hdHVyZSBwcm9vZlxuICAgKi9cbiAgYXN5bmMgY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1Jlc2VydmU+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgdHJhbnNhY3Rpb24gbm90ZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSB0cmFuc2FjdGlvbiB0byBnZXQgdGhlIG5vdGUgb2ZcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgdHggbm90ZVxuICAgKi9cbiAgYXN5bmMgZ2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0VHhOb3RlcyhbdHhIYXNoXSkpWzBdO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IG5vdGVzIGZvciBtdWx0aXBsZSB0cmFuc2FjdGlvbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSB0eEhhc2hlcyAtIGhhc2hlcyBvZiB0aGUgdHJhbnNhY3Rpb25zIHRvIGdldCBub3RlcyBmb3JcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmdbXT59IG5vdGVzIGZvciB0aGUgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBnZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IGEgbm90ZSBmb3IgYSBzcGVjaWZpYyB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSBoYXNoIG9mIHRoZSB0cmFuc2FjdGlvbiB0byBzZXQgYSBub3RlIGZvclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbm90ZSAtIHRoZSB0cmFuc2FjdGlvbiBub3RlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRUeE5vdGUodHhIYXNoOiBzdHJpbmcsIG5vdGU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuc2V0VHhOb3RlcyhbdHhIYXNoXSwgW25vdGVdKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCBub3RlcyBmb3IgbXVsdGlwbGUgdHJhbnNhY3Rpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gdHhIYXNoZXMgLSB0cmFuc2FjdGlvbnMgdG8gc2V0IG5vdGVzIGZvclxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBub3RlcyAtIG5vdGVzIHRvIHNldCBmb3IgdGhlIHRyYW5zYWN0aW9uc1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10sIG5vdGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYWRkcmVzcyBib29rIGVudHJpZXMuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcltdfSBbZW50cnlJbmRpY2VzXSAtIGluZGljZXMgb2YgdGhlIGVudHJpZXMgdG8gZ2V0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVtdPn0gdGhlIGFkZHJlc3MgYm9vayBlbnRyaWVzXG4gICAqL1xuICBhc3luYyBnZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzPzogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb0FkZHJlc3NCb29rRW50cnlbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBBZGQgYW4gYWRkcmVzcyBib29rIGVudHJ5LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBlbnRyeSBhZGRyZXNzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbZGVzY3JpcHRpb25dIC0gZW50cnkgZGVzY3JpcHRpb24gKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBpbmRleCBvZiB0aGUgYWRkZWQgZW50cnlcbiAgICovXG4gIGFzeW5jIGFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzczogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEVkaXQgYW4gYWRkcmVzcyBib29rIGVudHJ5LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IC0gaW5kZXggb2YgdGhlIGFkZHJlc3MgYm9vayBlbnRyeSB0byBlZGl0XG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2V0QWRkcmVzcyAtIHNwZWNpZmllcyBpZiB0aGUgYWRkcmVzcyBzaG91bGQgYmUgdXBkYXRlZFxuICAgKiBAcGFyYW0ge3N0cmluZyB8IHVuZGVmaW5lZH0gYWRkcmVzcyAtIHVwZGF0ZWQgYWRkcmVzc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNldERlc2NyaXB0aW9uIC0gc3BlY2lmaWVzIGlmIHRoZSBkZXNjcmlwdGlvbiBzaG91bGQgYmUgdXBkYXRlZFxuICAgKiBAcGFyYW0ge3N0cmluZyB8IHVuZGVmaW5lZH0gZGVzY3JpcHRpb24gLSB1cGRhdGVkIGRlc2NyaXB0aW9uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBlZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleDogbnVtYmVyLCBzZXRBZGRyZXNzOiBib29sZWFuLCBhZGRyZXNzOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNldERlc2NyaXB0aW9uOiBib29sZWFuLCBkZXNjcmlwdGlvbjogc3RyaW5nIHwgdW5kZWZpbmVkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBhZGRyZXNzIGJvb2sgZW50cnkuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gZW50cnlJZHggLSBpbmRleCBvZiB0aGUgZW50cnkgdG8gZGVsZXRlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBkZWxldGVBZGRyZXNzQm9va0VudHJ5KGVudHJ5SWR4OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogVGFnIGFjY291bnRzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyAtIHRhZyB0byBhcHBseSB0byB0aGUgc3BlY2lmaWVkIGFjY291bnRzXG4gICAqIEBwYXJhbSB7bnVtYmVyW119IGFjY291bnRJbmRpY2VzIC0gaW5kaWNlcyBvZiB0aGUgYWNjb3VudHMgdG8gdGFnXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyB0YWdBY2NvdW50cyh0YWc6IHN0cmluZywgYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbnRhZyBhY2NvdW50cy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyW119IGFjY291bnRJbmRpY2VzIC0gaW5kaWNlcyBvZiB0aGUgYWNjb3VudHMgdG8gdW50YWdcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJldHVybiBhbGwgYWNjb3VudCB0YWdzLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9BY2NvdW50VGFnW10+fSB0aGUgd2FsbGV0J3MgYWNjb3VudCB0YWdzXG4gICAqL1xuICBhc3luYyBnZXRBY2NvdW50VGFncygpOiBQcm9taXNlPE1vbmVyb0FjY291bnRUYWdbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIGh1bWFuLXJlYWRhYmxlIGRlc2NyaXB0aW9uIGZvciBhIHRhZy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgLSB0YWcgdG8gc2V0IGEgZGVzY3JpcHRpb24gZm9yXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBsYWJlbCAtIGxhYmVsIHRvIHNldCBmb3IgdGhlIHRhZ1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0QWNjb3VudFRhZ0xhYmVsKHRhZzogc3RyaW5nLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBwYXltZW50IFVSSSBmcm9tIGEgc2VuZCBjb25maWd1cmF0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeENvbmZpZ30gY29uZmlnIC0gc3BlY2lmaWVzIGNvbmZpZ3VyYXRpb24gZm9yIGEgcG90ZW50aWFsIHR4XG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHBheW1lbnQgdXJpXG4gICAqL1xuICBhc3luYyBnZXRQYXltZW50VXJpKGNvbmZpZzogTW9uZXJvVHhDb25maWcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBQYXJzZXMgYSBwYXltZW50IFVSSSB0byBhIHR4IGNvbmZpZy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1cmkgLSBwYXltZW50IHVyaSB0byBwYXJzZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4Q29uZmlnPn0gdGhlIHNlbmQgY29uZmlndXJhdGlvbiBwYXJzZWQgZnJvbSB0aGUgdXJpXG4gICAqL1xuICBhc3luYyBwYXJzZVBheW1lbnRVcmkodXJpOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4Q29uZmlnPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhbiBhdHRyaWJ1dGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IC0gYXR0cmlidXRlIHRvIGdldCB0aGUgdmFsdWUgb2ZcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgYXR0cmlidXRlJ3MgdmFsdWVcbiAgICovXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShrZXk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCBhbiBhcmJpdHJhcnkgYXR0cmlidXRlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSAtIGF0dHJpYnV0ZSBrZXlcbiAgICogQHBhcmFtIHtzdHJpbmd9IHZhbCAtIGF0dHJpYnV0ZSB2YWx1ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0QXR0cmlidXRlKGtleTogc3RyaW5nLCB2YWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdGFydCBtaW5pbmcuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW251bVRocmVhZHNdIC0gbnVtYmVyIG9mIHRocmVhZHMgY3JlYXRlZCBmb3IgbWluaW5nIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbYmFja2dyb3VuZE1pbmluZ10gLSBzcGVjaWZpZXMgaWYgbWluaW5nIHNob3VsZCBvY2N1ciBpbiB0aGUgYmFja2dyb3VuZCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lnbm9yZUJhdHRlcnldIC0gc3BlY2lmaWVzIGlmIHRoZSBiYXR0ZXJ5IHNob3VsZCBiZSBpZ25vcmVkIGZvciBtaW5pbmcgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc3RhcnRNaW5pbmcobnVtVGhyZWFkczogbnVtYmVyLCBiYWNrZ3JvdW5kTWluaW5nPzogYm9vbGVhbiwgaWdub3JlQmF0dGVyeT86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3RvcCBtaW5pbmcuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc3RvcE1pbmluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIGltcG9ydGluZyBtdWx0aXNpZyBkYXRhIGlzIG5lZWRlZCBmb3IgcmV0dXJuaW5nIGEgY29ycmVjdCBiYWxhbmNlLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiBpbXBvcnRpbmcgbXVsdGlzaWcgZGF0YSBpcyBuZWVkZWQgZm9yIHJldHVybmluZyBhIGNvcnJlY3QgYmFsYW5jZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBpc011bHRpc2lnSW1wb3J0TmVlZGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhpcyB3YWxsZXQgaXMgYSBtdWx0aXNpZyB3YWxsZXQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoaXMgaXMgYSBtdWx0aXNpZyB3YWxsZXQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNNdWx0aXNpZygpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0TXVsdGlzaWdJbmZvKCkpLmdldElzTXVsdGlzaWcoKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBtdWx0aXNpZyBpbmZvIGFib3V0IHRoaXMgd2FsbGV0LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luZm8+fSBtdWx0aXNpZyBpbmZvIGFib3V0IHRoaXMgd2FsbGV0XG4gICAqL1xuICBhc3luYyBnZXRNdWx0aXNpZ0luZm8oKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luZm8+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IG11bHRpc2lnIGluZm8gYXMgaGV4IHRvIHNoYXJlIHdpdGggcGFydGljaXBhbnRzIHRvIGJlZ2luIGNyZWF0aW5nIGFcbiAgICogbXVsdGlzaWcgd2FsbGV0LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGlzIHdhbGxldCdzIG11bHRpc2lnIGhleCB0byBzaGFyZSB3aXRoIHBhcnRpY2lwYW50c1xuICAgKi9cbiAgYXN5bmMgcHJlcGFyZU11bHRpc2lnKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIE1ha2UgdGhpcyB3YWxsZXQgbXVsdGlzaWcgYnkgaW1wb3J0aW5nIG11bHRpc2lnIGhleCBmcm9tIHBhcnRpY2lwYW50cy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IG11bHRpc2lnSGV4ZXMgLSBtdWx0aXNpZyBoZXggZnJvbSBlYWNoIHBhcnRpY2lwYW50XG4gICAqIEBwYXJhbSB7bnVtYmVyfSB0aHJlc2hvbGQgLSBudW1iZXIgb2Ygc2lnbmF0dXJlcyBuZWVkZWQgdG8gc2lnbiB0cmFuc2ZlcnNcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhc3N3b3JkIC0gd2FsbGV0IHBhc3N3b3JkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhpcyB3YWxsZXQncyBtdWx0aXNpZyBoZXggdG8gc2hhcmUgd2l0aCBwYXJ0aWNpcGFudHNcbiAgICovXG4gIGFzeW5jIG1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgdGhyZXNob2xkOiBudW1iZXIsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBFeGNoYW5nZSBtdWx0aXNpZyBoZXggd2l0aCBwYXJ0aWNpcGFudHMgaW4gYSBNL04gbXVsdGlzaWcgd2FsbGV0LlxuICAgKiBcbiAgICogVGhpcyBwcm9jZXNzIG11c3QgYmUgcmVwZWF0ZWQgd2l0aCBwYXJ0aWNpcGFudHMgZXhhY3RseSBOLU0gdGltZXMuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBtdWx0aXNpZ0hleGVzIGFyZSBtdWx0aXNpZyBoZXggZnJvbSBlYWNoIHBhcnRpY2lwYW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZCAtIHdhbGxldCdzIHBhc3N3b3JkIC8vIFRPRE8gbW9uZXJvLXByb2plY3Q6IHJlZHVuZGFudD8gd2FsbGV0IGlzIGNyZWF0ZWQgd2l0aCBwYXNzd29yZFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdD59IHRoZSByZXN1bHQgd2hpY2ggaGFzIHRoZSBtdWx0aXNpZydzIGFkZHJlc3MgeG9yIHRoaXMgd2FsbGV0J3MgbXVsdGlzaWcgaGV4IHRvIHNoYXJlIHdpdGggcGFydGljaXBhbnRzIGlmZiBub3QgZG9uZVxuICAgKi9cbiAgYXN5bmMgZXhjaGFuZ2VNdWx0aXNpZ0tleXMobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBFeHBvcnQgdGhpcyB3YWxsZXQncyBtdWx0aXNpZyBpbmZvIGFzIGhleCBmb3Igb3RoZXIgcGFydGljaXBhbnRzLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGlzIHdhbGxldCdzIG11bHRpc2lnIGluZm8gYXMgaGV4IGZvciBvdGhlciBwYXJ0aWNpcGFudHNcbiAgICovXG4gIGFzeW5jIGV4cG9ydE11bHRpc2lnSGV4KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZD9cIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbXBvcnQgbXVsdGlzaWcgaW5mbyBhcyBoZXggZnJvbSBvdGhlciBwYXJ0aWNpcGFudHMuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBtdWx0aXNpZ0hleGVzIC0gbXVsdGlzaWcgaGV4IGZyb20gZWFjaCBwYXJ0aWNpcGFudFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBudW1iZXIgb2Ygb3V0cHV0cyBzaWduZWQgd2l0aCB0aGUgZ2l2ZW4gbXVsdGlzaWcgaGV4XG4gICAqL1xuICBhc3luYyBpbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNpZ24gbXVsdGlzaWcgdHJhbnNhY3Rpb25zIGZyb20gYSBtdWx0aXNpZyB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbXVsdGlzaWdUeEhleCAtIHVuc2lnbmVkIG11bHRpc2lnIHRyYW5zYWN0aW9ucyBhcyBoZXhcbiAgICogQHJldHVybiB7TW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0fSB0aGUgcmVzdWx0IG9mIHNpZ25pbmcgdGhlIG11bHRpc2lnIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3VibWl0IHNpZ25lZCBtdWx0aXNpZyB0cmFuc2FjdGlvbnMgZnJvbSBhIG11bHRpc2lnIHdhbGxldC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzaWduZWRNdWx0aXNpZ1R4SGV4IC0gc2lnbmVkIG11bHRpc2lnIGhleCByZXR1cm5lZCBmcm9tIHNpZ25NdWx0aXNpZ1R4SGV4KClcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmdbXT59IHRoZSByZXN1bHRpbmcgdHJhbnNhY3Rpb24gaGFzaGVzXG4gICAqL1xuICBhc3luYyBzdWJtaXRNdWx0aXNpZ1R4SGV4KHNpZ25lZE11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ2hhbmdlIHRoZSB3YWxsZXQgcGFzc3dvcmQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gb2xkUGFzc3dvcmQgLSB0aGUgd2FsbGV0J3Mgb2xkIHBhc3N3b3JkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdQYXNzd29yZCAtIHRoZSB3YWxsZXQncyBuZXcgcGFzc3dvcmRcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIGNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkOiBzdHJpbmcsIG5ld1Bhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2F2ZSB0aGUgd2FsbGV0IGF0IGl0cyBjdXJyZW50IHBhdGguXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2F2ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogT3B0aW9uYWxseSBzYXZlIHRoZW4gY2xvc2UgdGhlIHdhbGxldC5cbiAgICpcbiAgICogQHBhcmFtIHtib29sZWFufSBbc2F2ZV0gLSBzcGVjaWZpZXMgaWYgdGhlIHdhbGxldCBzaG91bGQgYmUgc2F2ZWQgYmVmb3JlIGJlaW5nIGNsb3NlZCAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIGNsb3NlKHNhdmUgPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyKSB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyLnJlbW92ZUxpc3RlbmVyKHRoaXMuY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcik7XG4gICAgdGhpcy5jb25uZWN0aW9uTWFuYWdlciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5saXN0ZW5lcnMuc3BsaWNlKDAsIHRoaXMubGlzdGVuZXJzLmxlbmd0aCk7XG4gICAgdGhpcy5faXNDbG9zZWQgPSB0cnVlO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoaXMgd2FsbGV0IGlzIGNsb3NlZCBvciBub3QuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSB3YWxsZXQgaXMgY2xvc2VkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzQ2xvc2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiB0aGlzLl9pc0Nsb3NlZDtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGFzeW5jIGFubm91bmNlU3luY1Byb2dyZXNzKGhlaWdodDogbnVtYmVyLCBzdGFydEhlaWdodDogbnVtYmVyLCBlbmRIZWlnaHQ6IG51bWJlciwgcGVyY2VudERvbmU6IG51bWJlciwgbWVzc2FnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGxpc3RlbmVyLm9uU3luY1Byb2dyZXNzKGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2UpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBjYWxsaW5nIGxpc3RlbmVyIG9uIHN5bmMgcHJvZ3Jlc3NcIiwgZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGFzeW5jIGFubm91bmNlTmV3QmxvY2soaGVpZ2h0OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgbGlzdGVuZXIub25OZXdCbG9jayhoZWlnaHQpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBjYWxsaW5nIGxpc3RlbmVyIG9uIG5ldyBibG9ja1wiLCBlcnIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgYXN5bmMgYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQobmV3QmFsYW5jZTogYmlnaW50LCBuZXdVbmxvY2tlZEJhbGFuY2U6IGJpZ2ludCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBsaXN0ZW5lci5vbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlLCBuZXdVbmxvY2tlZEJhbGFuY2UpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBjYWxsaW5nIGxpc3RlbmVyIG9uIGJhbGFuY2VzIGNoYW5nZWRcIiwgZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGFzeW5jIGFubm91bmNlT3V0cHV0UmVjZWl2ZWQob3V0cHV0OiBNb25lcm9PdXRwdXRXYWxsZXQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgbGlzdGVuZXIub25PdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBjYWxsaW5nIGxpc3RlbmVyIG9uIG91dHB1dCByZWNlaXZlZFwiLCBlcnIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgYXN5bmMgYW5ub3VuY2VPdXRwdXRTcGVudChvdXRwdXQ6IE1vbmVyb091dHB1dFdhbGxldCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBsaXN0ZW5lci5vbk91dHB1dFNwZW50KG91dHB1dCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNhbGxpbmcgbGlzdGVuZXIgb24gb3V0cHV0IHNwZW50XCIsIGVycik7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZVR4UXVlcnkocXVlcnkpIHtcbiAgICBpZiAocXVlcnkgaW5zdGFuY2VvZiBNb25lcm9UeFF1ZXJ5KSBxdWVyeSA9IHF1ZXJ5LmNvcHkoKTtcbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KHF1ZXJ5KSkgcXVlcnkgPSBuZXcgTW9uZXJvVHhRdWVyeSgpLnNldEhhc2hlcyhxdWVyeSk7XG4gICAgZWxzZSB7XG4gICAgICBxdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5KTtcbiAgICAgIHF1ZXJ5ID0gbmV3IE1vbmVyb1R4UXVlcnkocXVlcnkpO1xuICAgIH1cbiAgICBpZiAocXVlcnkuZ2V0QmxvY2soKSA9PT0gdW5kZWZpbmVkKSBxdWVyeS5zZXRCbG9jayhuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW3F1ZXJ5XSkpO1xuICAgIGlmIChxdWVyeS5nZXRJbnB1dFF1ZXJ5KCkpIHF1ZXJ5LmdldElucHV0UXVlcnkoKS5zZXRUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnkuZ2V0T3V0cHV0UXVlcnkoKSkgcXVlcnkuZ2V0T3V0cHV0UXVlcnkoKS5zZXRUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICByZXR1cm4gcXVlcnk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgbm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSkge1xuICAgIHF1ZXJ5ID0gbmV3IE1vbmVyb1RyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHR4UXVlcnkgPSBxdWVyeS5nZXRUeFF1ZXJ5KCkuY29weSgpO1xuICAgICAgcXVlcnkgPSB0eFF1ZXJ5LmdldFRyYW5zZmVyUXVlcnkoKTtcbiAgICB9XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKSA9PT0gdW5kZWZpbmVkKSBxdWVyeS5zZXRUeFF1ZXJ5KG5ldyBNb25lcm9UeFF1ZXJ5KCkpO1xuICAgIHF1ZXJ5LmdldFR4UXVlcnkoKS5zZXRUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkgPT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0VHhRdWVyeSgpLnNldEJsb2NrKG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbcXVlcnkuZ2V0VHhRdWVyeSgpXSkpO1xuICAgIHJldHVybiBxdWVyeTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVPdXRwdXRRdWVyeShxdWVyeSkge1xuICAgIHF1ZXJ5ID0gbmV3IE1vbmVyb091dHB1dFF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCB0eFF1ZXJ5ID0gcXVlcnkuZ2V0VHhRdWVyeSgpLmNvcHkoKTtcbiAgICAgIHF1ZXJ5ID0gdHhRdWVyeS5nZXRPdXRwdXRRdWVyeSgpO1xuICAgIH1cbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpID09PSB1bmRlZmluZWQpIHF1ZXJ5LnNldFR4UXVlcnkobmV3IE1vbmVyb1R4UXVlcnkoKSk7XG4gICAgcXVlcnkuZ2V0VHhRdWVyeSgpLnNldE91dHB1dFF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkgPT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0VHhRdWVyeSgpLnNldEJsb2NrKG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbcXVlcnkuZ2V0VHhRdWVyeSgpXSkpO1xuICAgIHJldHVybiBxdWVyeTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkIHx8ICEoY29uZmlnIGluc3RhbmNlb2YgT2JqZWN0KSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIE1vbmVyb1R4Q29uZmlnIG9yIGVxdWl2YWxlbnQgSlMgb2JqZWN0XCIpO1xuICAgIGNvbmZpZyA9IG5ldyBNb25lcm9UeENvbmZpZyhjb25maWcpO1xuICAgIGFzc2VydChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkgJiYgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCA+IDAsIFwiTXVzdCBwcm92aWRlIGRlc3RpbmF0aW9uc1wiKTtcbiAgICBhc3NlcnQuZXF1YWwoY29uZmlnLmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSwgdW5kZWZpbmVkKTtcbiAgICBhc3NlcnQuZXF1YWwoY29uZmlnLmdldEJlbG93QW1vdW50KCksIHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIGNvbmZpZztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyhjb25maWcpIHtcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQgfHwgIShjb25maWcgaW5zdGFuY2VvZiBPYmplY3QpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgTW9uZXJvVHhDb25maWcgb3IgZXF1aXZhbGVudCBKUyBvYmplY3RcIik7XG4gICAgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbmZpZy5nZXRTd2VlcEVhY2hTdWJhZGRyZXNzKCksIHVuZGVmaW5lZCk7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbmZpZy5nZXRCZWxvd0Ftb3VudCgpLCB1bmRlZmluZWQpO1xuICAgIGFzc2VydC5lcXVhbChjb25maWcuZ2V0Q2FuU3BsaXQoKSwgdW5kZWZpbmVkLCBcIkNhbm5vdCBzcGxpdCB0cmFuc2FjdGlvbnMgd2hlbiBzd2VlcGluZyBhbiBvdXRwdXRcIik7XG4gICAgaWYgKCFjb25maWcuZ2V0RGVzdGluYXRpb25zKCkgfHwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCAhPT0gMSB8fCAhY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGV4YWN0bHkgb25lIGRlc3RpbmF0aW9uIGFkZHJlc3MgdG8gc3dlZXAgb3V0cHV0IHRvXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkgJiYgY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpLmxlbmd0aCA+IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN3ZWVwIHRyYW5zYWN0aW9ucyBkbyBub3Qgc3VwcG9ydCBzdWJ0cmFjdGluZyBmZWVzIGZyb20gZGVzdGluYXRpb25zXCIpO1xuICAgIHJldHVybiBjb25maWc7ICBcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnKGNvbmZpZykge1xuICAgIGlmIChjb25maWcgPT09IHVuZGVmaW5lZCB8fCAhKGNvbmZpZyBpbnN0YW5jZW9mIE9iamVjdCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBNb25lcm9UeENvbmZpZyBvciBlcXVpdmFsZW50IEpTIG9iamVjdFwiKTtcbiAgICBjb25maWcgPSBuZXcgTW9uZXJvVHhDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCAhPSAxKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZXhhY3RseSBvbmUgZGVzdGluYXRpb24gdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGRlc3RpbmF0aW9uIGFkZHJlc3MgdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBhbW91bnQgaW4gc3dlZXAgY29uZmlnXCIpO1xuICAgIGlmIChjb25maWcuZ2V0S2V5SW1hZ2UoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJLZXkgaW1hZ2UgZGVmaW5lZDsgdXNlIHN3ZWVwT3V0cHV0KCkgdG8gc3dlZXAgYW4gb3V0cHV0IGJ5IGl0cyBrZXkgaW1hZ2VcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAwKSBjb25maWcuc2V0U3ViYWRkcmVzc0luZGljZXModW5kZWZpbmVkKTtcbiAgICBpZiAoY29uZmlnLmdldEFjY291bnRJbmRleCgpID09PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGFjY291bnQgaW5kZXggaWYgc3ViYWRkcmVzcyBpbmRpY2VzIGFyZSBwcm92aWRlZFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpICYmIGNvbmZpZy5nZXRTdWJ0cmFjdEZlZUZyb20oKS5sZW5ndGggPiAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTd2VlcCB0cmFuc2FjdGlvbnMgZG8gbm90IHN1cHBvcnQgc3VidHJhY3RpbmcgZmVlcyBmcm9tIGRlc3RpbmF0aW9uc1wiKTtcbiAgICByZXR1cm4gY29uZmlnO1xuICB9XG59XG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7Ozs7O0FBS0EsSUFBQUMsWUFBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBOzs7O0FBSUEsSUFBQUUsZ0NBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLFlBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTs7Ozs7O0FBTUEsSUFBQUksMkJBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTs7OztBQUlBLElBQUFLLGtCQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7Ozs7Ozs7QUFPQSxJQUFBTSxvQkFBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU8sZUFBQSxHQUFBUixzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQVEsY0FBQSxHQUFBVCxzQkFBQSxDQUFBQyxPQUFBOztBQUVBLElBQUFTLFlBQUEsR0FBQVYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFVLFlBQUEsR0FBQVgsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQSxJQUFBVyxxQkFBQSxHQUFBWixzQkFBQSxDQUFBQyxPQUFBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ2UsTUFBTVksWUFBWSxDQUFDOztFQUVoQztFQUNBLE9BQWdCQyxnQkFBZ0IsR0FBRyxTQUFTOztFQUU1Qzs7O0VBR1VD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