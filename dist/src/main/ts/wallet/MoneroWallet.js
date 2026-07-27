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
   * @param {boolean} [isTrusted] - indicates if the daemon is trusted (defaults to trusted if local address)
   * @return {Promise<void>}
   */
  async setDaemonConnection(uriOrConnection, isTrusted) {
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
   * @return {Promise<MoneroKeyImageExportResult>} the wallet's signed key images and their offset among the wallet's outputs
   */
  async exportKeyImages(all = false) {
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Import signed key images and verify their spent status.
   * 
   * @param {MoneroKeyImage[]} keyImages - images to import and verify (requires hex and signature)
   * @param {number} [offset] - offset of the first key image among the wallet's outputs (default 0)
   * @return {Promise<MoneroKeyImageImportResult>} results of the import
   */
  async importKeyImages(keyImages, offset = 0) {
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
   * Get the current default fee priority (unimportant, normal, elevated, etc).
   * 
   * @return {Promise<MoneroTxPriority>} the current fee priority
   */
  async getDefaultFeePriority() {
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
    throw new _MoneroError.default("Not supported");
  }

  /**
   * Import multisig info as hex from other participants.
   * 
   * @param {string[]} multisigHexes - multisig hex from each participant
   * @param {boolean} [refreshAfterImport] - specifies if the wallet should be refreshed after importing multisig hex (default true)
   * @return {Promise<number>} the number of outputs signed with the given multisig hex
   */
  async importMultisigHex(multisigHexes, refreshAfterImport) {
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIl9Nb25lcm9PdXRwdXRRdWVyeSIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJNb25lcm9XYWxsZXQiLCJERUZBVUxUX0xBTkdVQUdFIiwibGlzdGVuZXJzIiwiX2lzQ2xvc2VkIiwiY29uc3RydWN0b3IiLCJhZGRMaXN0ZW5lciIsImxpc3RlbmVyIiwiYXNzZXJ0IiwiTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJwdXNoIiwicmVtb3ZlTGlzdGVuZXIiLCJpZHgiLCJpbmRleE9mIiwic3BsaWNlIiwiTW9uZXJvRXJyb3IiLCJnZXRMaXN0ZW5lcnMiLCJpc1ZpZXdPbmx5Iiwic2V0RGFlbW9uQ29ubmVjdGlvbiIsInVyaU9yQ29ubmVjdGlvbiIsImlzVHJ1c3RlZCIsImdldERhZW1vbkNvbm5lY3Rpb24iLCJzZXRDb25uZWN0aW9uTWFuYWdlciIsImNvbm5lY3Rpb25NYW5hZ2VyIiwiY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciIsInRoYXQiLCJNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyIiwib25Db25uZWN0aW9uQ2hhbmdlZCIsImNvbm5lY3Rpb24iLCJnZXRDb25uZWN0aW9uIiwiZ2V0Q29ubmVjdGlvbk1hbmFnZXIiLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiZ2V0VmVyc2lvbiIsImdldFBhdGgiLCJnZXRTZWVkIiwiZ2V0U2VlZExhbmd1YWdlIiwiZ2V0UHJpdmF0ZVZpZXdLZXkiLCJnZXRQcml2YXRlU3BlbmRLZXkiLCJnZXRQdWJsaWNWaWV3S2V5IiwiZ2V0UHVibGljU3BlbmRLZXkiLCJnZXRQcmltYXJ5QWRkcmVzcyIsImdldEFkZHJlc3MiLCJhY2NvdW50SWR4Iiwic3ViYWRkcmVzc0lkeCIsImdldEFkZHJlc3NJbmRleCIsImFkZHJlc3MiLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsInN0YW5kYXJkQWRkcmVzcyIsInBheW1lbnRJZCIsImRlY29kZUludGVncmF0ZWRBZGRyZXNzIiwiaW50ZWdyYXRlZEFkZHJlc3MiLCJnZXRIZWlnaHQiLCJnZXREYWVtb25IZWlnaHQiLCJnZXRIZWlnaHRCeURhdGUiLCJ5ZWFyIiwibW9udGgiLCJkYXkiLCJzeW5jIiwibGlzdGVuZXJPclN0YXJ0SGVpZ2h0Iiwic3RhcnRIZWlnaHQiLCJzdGFydFN5bmNpbmciLCJzeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwicmVzY2FuU3BlbnQiLCJyZXNjYW5CbG9ja2NoYWluIiwiZ2V0QmFsYW5jZSIsImdldFVubG9ja2VkQmFsYW5jZSIsImdldE51bUJsb2Nrc1RvVW5sb2NrIiwiYmFsYW5jZSIsInVuZGVmaW5lZCIsInVubG9ja2VkQmFsYW5jZSIsInR4cyIsImhlaWdodCIsIm51bUJsb2Nrc1RvTmV4dFVubG9jayIsImdldFR4cyIsImlzTG9ja2VkIiwidHgiLCJnZXRJc0NvbmZpcm1lZCIsIk1vbmVyb1V0aWxzIiwiaXNUaW1lc3RhbXAiLCJnZXRVbmxvY2tUaW1lIiwibnVtQmxvY2tzVG9VbmxvY2siLCJNYXRoIiwibWF4IiwiTnVtYmVyIiwibWluIiwibnVtQmxvY2tzVG9MYXN0VW5sb2NrIiwiZ2V0QWNjb3VudHMiLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwiZ2V0QWNjb3VudCIsImNyZWF0ZUFjY291bnQiLCJsYWJlbCIsInNldEFjY291bnRMYWJlbCIsInNldFN1YmFkZHJlc3NMYWJlbCIsImdldFN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NJbmRpY2VzIiwiZ2V0U3ViYWRkcmVzcyIsImNyZWF0ZVN1YmFkZHJlc3MiLCJnZXRUeCIsInR4SGFzaCIsImxlbmd0aCIsInF1ZXJ5IiwiZ2V0VHJhbnNmZXJzIiwiZ2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJxdWVyeU5vcm1hbGl6ZWQiLCJub3JtYWxpemVUcmFuc2ZlclF1ZXJ5IiwiZ2V0SXNJbmNvbWluZyIsInNldElzSW5jb21pbmciLCJnZXRPdXRnb2luZ1RyYW5zZmVycyIsImdldElzT3V0Z29pbmciLCJzZXRJc091dGdvaW5nIiwiZ2V0T3V0cHV0cyIsImV4cG9ydE91dHB1dHMiLCJhbGwiLCJpbXBvcnRPdXRwdXRzIiwib3V0cHV0c0hleCIsImV4cG9ydEtleUltYWdlcyIsImltcG9ydEtleUltYWdlcyIsImtleUltYWdlcyIsIm9mZnNldCIsImdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0IiwiZnJlZXplT3V0cHV0Iiwia2V5SW1hZ2UiLCJ0aGF3T3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJnZXREZWZhdWx0RmVlUHJpb3JpdHkiLCJjcmVhdGVUeCIsImNvbmZpZyIsImNvbmZpZ05vcm1hbGl6ZWQiLCJub3JtYWxpemVDcmVhdGVUeHNDb25maWciLCJnZXRDYW5TcGxpdCIsImVxdWFsIiwic2V0Q2FuU3BsaXQiLCJjcmVhdGVUeHMiLCJzd2VlcE91dHB1dCIsInN3ZWVwVW5sb2NrZWQiLCJzd2VlcER1c3QiLCJyZWxheSIsInJlbGF5VHgiLCJ0eE9yTWV0YWRhdGEiLCJyZWxheVR4cyIsInR4c09yTWV0YWRhdGFzIiwiZGVzY3JpYmVVbnNpZ25lZFR4U2V0IiwidW5zaWduZWRUeEhleCIsImRlc2NyaWJlVHhTZXQiLCJNb25lcm9UeFNldCIsInNldFVuc2lnbmVkVHhIZXgiLCJkZXNjcmliZU11bHRpc2lnVHhTZXQiLCJtdWx0aXNpZ1R4SGV4Iiwic2V0TXVsdGlzaWdUeEhleCIsInR4U2V0Iiwic2lnblR4cyIsInN1Ym1pdFR4cyIsInNpZ25lZFR4SGV4Iiwic2lnbk1lc3NhZ2UiLCJtZXNzYWdlIiwic2lnbmF0dXJlVHlwZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiU0lHTl9XSVRIX1NQRU5EX0tFWSIsInZlcmlmeU1lc3NhZ2UiLCJzaWduYXR1cmUiLCJnZXRUeEtleSIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImdldFR4UHJvb2YiLCJjaGVja1R4UHJvb2YiLCJnZXRTcGVuZFByb29mIiwiY2hlY2tTcGVuZFByb29mIiwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0IiwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCIsImFtb3VudCIsImNoZWNrUmVzZXJ2ZVByb29mIiwiZ2V0VHhOb3RlIiwiZ2V0VHhOb3RlcyIsInNldFR4Tm90ZSIsIm5vdGUiLCJzZXRUeE5vdGVzIiwibm90ZXMiLCJnZXRBZGRyZXNzQm9va0VudHJpZXMiLCJlbnRyeUluZGljZXMiLCJhZGRBZGRyZXNzQm9va0VudHJ5IiwiZGVzY3JpcHRpb24iLCJlZGl0QWRkcmVzc0Jvb2tFbnRyeSIsImluZGV4Iiwic2V0QWRkcmVzcyIsInNldERlc2NyaXB0aW9uIiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsImVudHJ5SWR4IiwidGFnQWNjb3VudHMiLCJhY2NvdW50SW5kaWNlcyIsInVudGFnQWNjb3VudHMiLCJnZXRBY2NvdW50VGFncyIsInNldEFjY291bnRUYWdMYWJlbCIsImdldFBheW1lbnRVcmkiLCJwYXJzZVBheW1lbnRVcmkiLCJ1cmkiLCJnZXRBdHRyaWJ1dGUiLCJrZXkiLCJzZXRBdHRyaWJ1dGUiLCJ2YWwiLCJzdGFydE1pbmluZyIsIm51bVRocmVhZHMiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaWdub3JlQmF0dGVyeSIsInN0b3BNaW5pbmciLCJpc011bHRpc2lnSW1wb3J0TmVlZGVkIiwiaXNNdWx0aXNpZyIsImdldE11bHRpc2lnSW5mbyIsImdldElzTXVsdGlzaWciLCJwcmVwYXJlTXVsdGlzaWciLCJtYWtlTXVsdGlzaWciLCJtdWx0aXNpZ0hleGVzIiwidGhyZXNob2xkIiwicGFzc3dvcmQiLCJleGNoYW5nZU11bHRpc2lnS2V5cyIsImV4cG9ydE11bHRpc2lnSGV4IiwiaW1wb3J0TXVsdGlzaWdIZXgiLCJyZWZyZXNoQWZ0ZXJJbXBvcnQiLCJzaWduTXVsdGlzaWdUeEhleCIsInN1Ym1pdE11bHRpc2lnVHhIZXgiLCJzaWduZWRNdWx0aXNpZ1R4SGV4IiwiY2hhbmdlUGFzc3dvcmQiLCJvbGRQYXNzd29yZCIsIm5ld1Bhc3N3b3JkIiwic2F2ZSIsImNsb3NlIiwiaXNDbG9zZWQiLCJhbm5vdW5jZVN5bmNQcm9ncmVzcyIsImVuZEhlaWdodCIsInBlcmNlbnREb25lIiwib25TeW5jUHJvZ3Jlc3MiLCJlcnIiLCJjb25zb2xlIiwiZXJyb3IiLCJhbm5vdW5jZU5ld0Jsb2NrIiwib25OZXdCbG9jayIsImFubm91bmNlQmFsYW5jZXNDaGFuZ2VkIiwibmV3QmFsYW5jZSIsIm5ld1VubG9ja2VkQmFsYW5jZSIsIm9uQmFsYW5jZXNDaGFuZ2VkIiwiYW5ub3VuY2VPdXRwdXRSZWNlaXZlZCIsIm91dHB1dCIsIm9uT3V0cHV0UmVjZWl2ZWQiLCJhbm5vdW5jZU91dHB1dFNwZW50Iiwib25PdXRwdXRTcGVudCIsIm5vcm1hbGl6ZVR4UXVlcnkiLCJNb25lcm9UeFF1ZXJ5IiwiY29weSIsIkFycmF5IiwiaXNBcnJheSIsInNldEhhc2hlcyIsIk9iamVjdCIsImFzc2lnbiIsImdldEJsb2NrIiwic2V0QmxvY2siLCJNb25lcm9CbG9jayIsInNldFR4cyIsImdldElucHV0UXVlcnkiLCJzZXRUeFF1ZXJ5IiwiZ2V0T3V0cHV0UXVlcnkiLCJNb25lcm9UcmFuc2ZlclF1ZXJ5IiwiZ2V0VHhRdWVyeSIsInR4UXVlcnkiLCJnZXRUcmFuc2ZlclF1ZXJ5Iiwic2V0VHJhbnNmZXJRdWVyeSIsIm5vcm1hbGl6ZU91dHB1dFF1ZXJ5IiwiTW9uZXJvT3V0cHV0UXVlcnkiLCJzZXRPdXRwdXRRdWVyeSIsIk1vbmVyb1R4Q29uZmlnIiwiZ2V0RGVzdGluYXRpb25zIiwiZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcyIsImdldEJlbG93QW1vdW50Iiwibm9ybWFsaXplU3dlZXBPdXRwdXRDb25maWciLCJnZXRTdWJ0cmFjdEZlZUZyb20iLCJub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnIiwiZ2V0QW1vdW50IiwiZ2V0S2V5SW1hZ2UiLCJnZXRTdWJhZGRyZXNzSW5kaWNlcyIsInNldFN1YmFkZHJlc3NJbmRpY2VzIiwiZ2V0QWNjb3VudEluZGV4IiwiZXhwb3J0cyIsImRlZmF1bHQiXSwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi90cy93YWxsZXQvTW9uZXJvV2FsbGV0LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xuaW1wb3J0IEdlblV0aWxzIGZyb20gXCIuLi9jb21tb24vR2VuVXRpbHNcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50IGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRcIjtcbmltcG9ydCBNb25lcm9BY2NvdW50VGFnIGZyb20gXCIuL21vZGVsL01vbmVyb0FjY291bnRUYWdcIjtcbmltcG9ydCBNb25lcm9BZGRyZXNzQm9va0VudHJ5IGZyb20gXCIuL21vZGVsL01vbmVyb0FkZHJlc3NCb29rRW50cnlcIjtcbmltcG9ydCBNb25lcm9CbG9jayBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0Jsb2NrXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tSZXNlcnZlIGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrUmVzZXJ2ZVwiO1xuaW1wb3J0IE1vbmVyb0NoZWNrVHggZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tUeFwiO1xuaW1wb3J0IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyIGZyb20gXCIuLi9jb21tb24vTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJcIjtcbmltcG9ydCBNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyIGZyb20gXCIuLi9jb21tb24vTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lclwiO1xuaW1wb3J0IE1vbmVyb0Vycm9yIGZyb20gXCIuLi9jb21tb24vTW9uZXJvRXJyb3JcIjtcbmltcG9ydCBNb25lcm9JbmNvbWluZ1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb0luY29taW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbnRlZ3JhdGVkQWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvS2V5SW1hZ2VcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGVcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbmZvXCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5pdFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHRcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9PdXRnb2luZ1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb091dGdvaW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuLi9jb21tb24vTW9uZXJvUnBjQ29ubmVjdGlvblwiO1xuaW1wb3J0IE1vbmVyb1N1YmFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3ViYWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb1N5bmNSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3luY1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXJRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9UeFByaW9yaXR5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UHJpb3JpdHlcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1R4U2V0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4U2V0XCI7XG5pbXBvcnQgTW9uZXJvVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb1ZlcnNpb24gZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9WZXJzaW9uXCI7XG5pbXBvcnQgTW9uZXJvV2FsbGV0TGlzdGVuZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvV2FsbGV0TGlzdGVuZXJcIjtcblxuLyoqXG4gKiBDb3B5cmlnaHQgKGMpIHdvb2RzZXJcbiAqXG4gKiBQZXJtaXNzaW9uIGlzIGhlcmVieSBncmFudGVkLCBmcmVlIG9mIGNoYXJnZSwgdG8gYW55IHBlcnNvbiBvYnRhaW5pbmcgYSBjb3B5XG4gKiBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsXG4gKiBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzXG4gKiB0byB1c2UsIGNvcHksIG1vZGlmeSwgbWVyZ2UsIHB1Ymxpc2gsIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsXG4gKiBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXNcbiAqIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsXG4gKiBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuICpcbiAqIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1MgT1JcbiAqIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLFxuICogRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFXG4gKiBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLCBEQU1BR0VTIE9SIE9USEVSXG4gKiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLFxuICogT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEVcbiAqIFNPRlRXQVJFLlxuICovXG5cbi8qKlxuICogTW9uZXJvIHdhbGxldCBpbnRlcmZhY2UgYW5kIGRlZmF1bHQgaW1wbGVtZW50YXRpb25zLlxuICogXG4gKiBAaW50ZXJmYWNlXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIE1vbmVyb1dhbGxldCB7XG5cbiAgLy8gc3RhdGljIHZhcmlhYmxlc1xuICBzdGF0aWMgcmVhZG9ubHkgREVGQVVMVF9MQU5HVUFHRSA9IFwiRW5nbGlzaFwiO1xuXG4gIC8vIHN0YXRlIHZhcmlhYmxlc1xuICBwcm90ZWN0ZWQgY29ubmVjdGlvbk1hbmFnZXI6IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyO1xuICBwcm90ZWN0ZWQgY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcjogTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcjtcbiAgcHJvdGVjdGVkIGxpc3RlbmVyczogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXSA9IFtdO1xuICBwcm90ZWN0ZWQgX2lzQ2xvc2VkID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIEhpZGRlbiBjb25zdHJ1Y3Rvci5cbiAgICogXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvLyBubyBjb2RlIG5lZWRlZFxuICB9XG4gIFxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBsaXN0ZW5lciB0byByZWNlaXZlIHdhbGxldCBub3RpZmljYXRpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRMaXN0ZW5lcn0gbGlzdGVuZXIgLSBsaXN0ZW5lciB0byByZWNlaXZlIHdhbGxldCBub3RpZmljYXRpb25zXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvV2FsbGV0TGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhc3NlcnQobGlzdGVuZXIgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciwgXCJMaXN0ZW5lciBtdXN0IGJlIGluc3RhbmNlIG9mIE1vbmVyb1dhbGxldExpc3RlbmVyXCIpO1xuICAgIHRoaXMubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICB9XG4gIFxuICAvKipcbiAgICogVW5yZWdpc3RlciBhIGxpc3RlbmVyIHRvIHJlY2VpdmUgd2FsbGV0IG5vdGlmaWNhdGlvbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1dhbGxldExpc3RlbmVyfSBsaXN0ZW5lciAtIGxpc3RlbmVyIHRvIHVucmVnaXN0ZXJcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IGlkeCA9IHRoaXMubGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xuICAgIGlmIChpZHggPiAtMSkgdGhpcy5saXN0ZW5lcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJMaXN0ZW5lciBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIHdhbGxldFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgd2l0aCB0aGUgd2FsbGV0LlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvV2FsbGV0TGlzdGVuZXJbXX0gdGhlIHJlZ2lzdGVyZWQgbGlzdGVuZXJzXG4gICAqL1xuICBnZXRMaXN0ZW5lcnMoKTogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXSB7XG4gICAgcmV0dXJuIHRoaXMubGlzdGVuZXJzO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSB3YWxsZXQgaXMgdmlldy1vbmx5LCBtZWFuaW5nIGl0IGRvZXMgbm90IGhhdmUgdGhlIHByaXZhdGVcbiAgICogc3BlbmQga2V5IGFuZCBjYW4gdGhlcmVmb3JlIG9ubHkgb2JzZXJ2ZSBpbmNvbWluZyBvdXRwdXRzLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgd2FsbGV0IGlzIHZpZXctb25seSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBpc1ZpZXdPbmx5KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9ScGNDb25uZWN0aW9uIHwgc3RyaW5nfSBbdXJpT3JDb25uZWN0aW9uXSAtIGRhZW1vbidzIFVSSSBvciBjb25uZWN0aW9uIChkZWZhdWx0cyB0byBvZmZsaW5lKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1RydXN0ZWRdIC0gaW5kaWNhdGVzIGlmIHRoZSBkYWVtb24gaXMgdHJ1c3RlZCAoZGVmYXVsdHMgdG8gdHJ1c3RlZCBpZiBsb2NhbCBhZGRyZXNzKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0RGFlbW9uQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24/OiBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgc3RyaW5nLCBpc1RydXN0ZWQ/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgZGFlbW9uIGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1JwY0Nvbm5lY3Rpb24+fSB0aGUgd2FsbGV0J3MgZGFlbW9uIGNvbm5lY3Rpb25cbiAgICovXG4gIGFzeW5jIGdldERhZW1vbkNvbm5lY3Rpb24oKTogUHJvbWlzZTxNb25lcm9ScGNDb25uZWN0aW9uPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uIG1hbmFnZXIuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyfSBjb25uZWN0aW9uTWFuYWdlciBtYW5hZ2VzIGNvbm5lY3Rpb25zIHRvIG1vbmVyb2RcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbm5lY3Rpb25NYW5hZ2VyPzogTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25uZWN0aW9uTWFuYWdlcikgdGhpcy5jb25uZWN0aW9uTWFuYWdlci5yZW1vdmVMaXN0ZW5lcih0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIpO1xuICAgIHRoaXMuY29ubmVjdGlvbk1hbmFnZXIgPSBjb25uZWN0aW9uTWFuYWdlcjtcbiAgICBpZiAoIWNvbm5lY3Rpb25NYW5hZ2VyKSByZXR1cm47XG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIGlmICghdGhpcy5jb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyKSB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIgPSBuZXcgY2xhc3MgZXh0ZW5kcyBNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyIHtcbiAgICAgIGFzeW5jIG9uQ29ubmVjdGlvbkNoYW5nZWQoY29ubmVjdGlvbjogTW9uZXJvUnBjQ29ubmVjdGlvbiB8IHVuZGVmaW5lZCkge1xuICAgICAgICBhd2FpdCB0aGF0LnNldERhZW1vbkNvbm5lY3Rpb24oY29ubmVjdGlvbik7XG4gICAgICB9XG4gICAgfTtcbiAgICBjb25uZWN0aW9uTWFuYWdlci5hZGRMaXN0ZW5lcih0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIpO1xuICAgIGF3YWl0IHRoaXMuc2V0RGFlbW9uQ29ubmVjdGlvbihjb25uZWN0aW9uTWFuYWdlci5nZXRDb25uZWN0aW9uKCkpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgZGFlbW9uIGNvbm5lY3Rpb24gbWFuYWdlci5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI+fSB0aGUgd2FsbGV0J3MgZGFlbW9uIGNvbm5lY3Rpb24gbWFuYWdlclxuICAgKi9cbiAgYXN5bmMgZ2V0Q29ubmVjdGlvbk1hbmFnZXIoKTogUHJvbWlzZTxNb25lcm9Db25uZWN0aW9uTWFuYWdlcj4ge1xuICAgIHJldHVybiB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSB3YWxsZXQgaXMgY29ubmVjdGVkIHRvIGRhZW1vbi5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIHdhbGxldCBpcyBjb25uZWN0ZWQgdG8gYSBkYWVtb24sIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNDb25uZWN0ZWRUb0RhZW1vbigpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0cyB0aGUgdmVyc2lvbiBvZiB0aGUgd2FsbGV0LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9WZXJzaW9uPn0gdGhlIHZlcnNpb24gb2YgdGhlIHdhbGxldFxuICAgKi9cbiAgYXN5bmMgZ2V0VmVyc2lvbigpOiBQcm9taXNlPE1vbmVyb1ZlcnNpb24+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBwYXRoLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgcGF0aCB0aGUgd2FsbGV0IGNhbiBiZSBvcGVuZWQgd2l0aFxuICAgKi9cbiAgYXN5bmMgZ2V0UGF0aCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIG1uZW1vbmljIHBocmFzZSBvciBzZWVkLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgd2FsbGV0J3MgbW5lbW9uaWMgcGhyYXNlIG9yIHNlZWQuXG4gICAqL1xuICBhc3luYyBnZXRTZWVkKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgbGFuZ3VhZ2Ugb2YgdGhlIHdhbGxldCdzIG1uZW1vbmljIHBocmFzZSBvciBzZWVkLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgbGFuZ3VhZ2Ugb2YgdGhlIHdhbGxldCdzIG1uZW1vbmljIHBocmFzZSBvciBzZWVkLlxuICAgKi9cbiAgYXN5bmMgZ2V0U2VlZExhbmd1YWdlKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgcHJpdmF0ZSB2aWV3IGtleS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHdhbGxldCdzIHByaXZhdGUgdmlldyBrZXlcbiAgICovXG4gIGFzeW5jIGdldFByaXZhdGVWaWV3S2V5KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgcHJpdmF0ZSBzcGVuZCBrZXkuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB3YWxsZXQncyBwcml2YXRlIHNwZW5kIGtleVxuICAgKi9cbiAgYXN5bmMgZ2V0UHJpdmF0ZVNwZW5kS2V5KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgcHVibGljIHZpZXcga2V5LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgd2FsbGV0J3MgcHVibGljIHZpZXcga2V5XG4gICAqL1xuICBhc3luYyBnZXRQdWJsaWNWaWV3S2V5KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgcHVibGljIHNwZW5kIGtleS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHdhbGxldCdzIHB1YmxpYyBzcGVuZCBrZXlcbiAgICovXG4gIGFzeW5jIGdldFB1YmxpY1NwZW5kS2V5KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICAgIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBwcmltYXJ5IGFkZHJlc3MuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB3YWxsZXQncyBwcmltYXJ5IGFkZHJlc3NcbiAgICovXG4gIGFzeW5jIGdldFByaW1hcnlBZGRyZXNzKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIGF3YWl0IHRoaXMuZ2V0QWRkcmVzcygwLCAwKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgYWRkcmVzcyBvZiBhIHNwZWNpZmljIHN1YmFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gYWNjb3VudElkeCAtIHRoZSBhY2NvdW50IGluZGV4IG9mIHRoZSBhZGRyZXNzJ3Mgc3ViYWRkcmVzc1xuICAgKiBAcGFyYW0ge251bWJlcn0gc3ViYWRkcmVzc0lkeCAtIHRoZSBzdWJhZGRyZXNzIGluZGV4IHdpdGhpbiB0aGUgYWNjb3VudFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSByZWNlaXZlIGFkZHJlc3Mgb2YgdGhlIHNwZWNpZmllZCBzdWJhZGRyZXNzXG4gICAqL1xuICBhc3luYyBnZXRBZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGV4IG9mIHRoZSBnaXZlbiBhZGRyZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBhZGRyZXNzIHRvIGdldCB0aGUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRleCBmcm9tXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvU3ViYWRkcmVzcz59IHRoZSBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGljZXNcbiAgICovXG4gIGFzeW5jIGdldEFkZHJlc3NJbmRleChhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGFuIGludGVncmF0ZWQgYWRkcmVzcyBiYXNlZCBvbiB0aGUgZ2l2ZW4gc3RhbmRhcmQgYWRkcmVzcyBhbmQgcGF5bWVudFxuICAgKiBJRC4gVXNlcyB0aGUgd2FsbGV0J3MgcHJpbWFyeSBhZGRyZXNzIGlmIGFuIGFkZHJlc3MgaXMgbm90IGdpdmVuLlxuICAgKiBHZW5lcmF0ZXMgYSByYW5kb20gcGF5bWVudCBJRCBpZiBhIHBheW1lbnQgSUQgaXMgbm90IGdpdmVuLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHN0YW5kYXJkQWRkcmVzcyBpcyB0aGUgc3RhbmRhcmQgYWRkcmVzcyB0byBnZW5lcmF0ZSB0aGUgaW50ZWdyYXRlZCBhZGRyZXNzIGZyb20gKHdhbGxldCdzIHByaW1hcnkgYWRkcmVzcyBpZiB1bmRlZmluZWQpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXltZW50SWQgaXMgdGhlIHBheW1lbnQgSUQgdG8gZ2VuZXJhdGUgYW4gaW50ZWdyYXRlZCBhZGRyZXNzIGZyb20gKHJhbmRvbWx5IGdlbmVyYXRlZCBpZiB1bmRlZmluZWQpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+fSB0aGUgaW50ZWdyYXRlZCBhZGRyZXNzXG4gICAqL1xuICBhc3luYyBnZXRJbnRlZ3JhdGVkQWRkcmVzcyhzdGFuZGFyZEFkZHJlc3M/OiBzdHJpbmcsIHBheW1lbnRJZD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRGVjb2RlIGFuIGludGVncmF0ZWQgYWRkcmVzcyB0byBnZXQgaXRzIHN0YW5kYXJkIGFkZHJlc3MgYW5kIHBheW1lbnQgaWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gaW50ZWdyYXRlZEFkZHJlc3MgLSBpbnRlZ3JhdGVkIGFkZHJlc3MgdG8gZGVjb2RlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+fSB0aGUgZGVjb2RlZCBpbnRlZ3JhdGVkIGFkZHJlc3MgaW5jbHVkaW5nIHN0YW5kYXJkIGFkZHJlc3MgYW5kIHBheW1lbnQgaWRcbiAgICovXG4gIGFzeW5jIGRlY29kZUludGVncmF0ZWRBZGRyZXNzKGludGVncmF0ZWRBZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgYmxvY2sgaGVpZ2h0IHRoYXQgdGhlIHdhbGxldCBpcyBzeW5jZWQgdG8uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBibG9jayBoZWlnaHQgdGhhdCB0aGUgd2FsbGV0IGlzIHN5bmNlZCB0b1xuICAgKi9cbiAgYXN5bmMgZ2V0SGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgYmxvY2tjaGFpbidzIGhlaWdodC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIGJsb2NrY2hhaW4ncyBoZWlnaHRcbiAgICovXG4gIGFzeW5jIGdldERhZW1vbkhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGJsb2NrY2hhaW4ncyBoZWlnaHQgYnkgZGF0ZSBhcyBhIGNvbnNlcnZhdGl2ZSBlc3RpbWF0ZSBmb3Igc2Nhbm5pbmcuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0geWVhciAtIHllYXIgb2YgdGhlIGhlaWdodCB0byBnZXRcbiAgICogQHBhcmFtIHtudW1iZXJ9IG1vbnRoIC0gbW9udGggb2YgdGhlIGhlaWdodCB0byBnZXQgYXMgYSBudW1iZXIgYmV0d2VlbiAxIGFuZCAxMlxuICAgKiBAcGFyYW0ge251bWJlcn0gZGF5IC0gZGF5IG9mIHRoZSBoZWlnaHQgdG8gZ2V0IGFzIGEgbnVtYmVyIGJldHdlZW4gMSBhbmQgMzFcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB0aGUgYmxvY2tjaGFpbidzIGFwcHJveGltYXRlIGhlaWdodCBhdCB0aGUgZ2l2ZW4gZGF0ZVxuICAgKi9cbiAgYXN5bmMgZ2V0SGVpZ2h0QnlEYXRlKHllYXI6IG51bWJlciwgbW9udGg6IG51bWJlciwgZGF5OiBudW1iZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTeW5jaHJvbml6ZSB0aGUgd2FsbGV0IHdpdGggdGhlIGRhZW1vbiBhcyBhIG9uZS10aW1lIHN5bmNocm9ub3VzIHByb2Nlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1dhbGxldExpc3RlbmVyfG51bWJlcn0gW2xpc3RlbmVyT3JTdGFydEhlaWdodF0gLSBsaXN0ZW5lciB4b3Igc3RhcnQgaGVpZ2h0IChkZWZhdWx0cyB0byBubyBzeW5jIGxpc3RlbmVyLCB0aGUgbGFzdCBzeW5jZWQgYmxvY2spXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3RhcnRIZWlnaHRdIC0gc3RhcnRIZWlnaHQgaWYgbm90IGdpdmVuIGluIGZpcnN0IGFyZyAoZGVmYXVsdHMgdG8gbGFzdCBzeW5jZWQgYmxvY2spXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzeW5jKGxpc3RlbmVyT3JTdGFydEhlaWdodD86IE1vbmVyb1dhbGxldExpc3RlbmVyIHwgbnVtYmVyLCBzdGFydEhlaWdodD86IG51bWJlcik6IFByb21pc2U8TW9uZXJvU3luY1Jlc3VsdD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdGFydCBiYWNrZ3JvdW5kIHN5bmNocm9uaXppbmcgd2l0aCBhIG1heGltdW0gcGVyaW9kIGJldHdlZW4gc3luY3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N5bmNQZXJpb2RJbk1zXSAtIG1heGltdW0gcGVyaW9kIGJldHdlZW4gc3luY3MgaW4gbWlsbGlzZWNvbmRzIChkZWZhdWx0IGlzIHdhbGxldC1zcGVjaWZpYylcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN0YXJ0U3luY2luZyhzeW5jUGVyaW9kSW5Ncz86IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdG9wIHN5bmNocm9uaXppbmcgdGhlIHdhbGxldCB3aXRoIHRoZSBkYWVtb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc3RvcFN5bmNpbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNjYW4gdHJhbnNhY3Rpb25zIGJ5IHRoZWlyIGhhc2gvaWQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSB0eEhhc2hlcyAtIHR4IGhhc2hlcyB0byBzY2FuXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzY2FuVHhzKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5SZXNjYW4gdGhlIGJsb2NrY2hhaW4gZm9yIHNwZW50IG91dHB1dHMuPC9wPlxuICAgKiBcbiAgICogPHA+Tm90ZTogdGhpcyBjYW4gb25seSBiZSBjYWxsZWQgd2l0aCBhIHRydXN0ZWQgZGFlbW9uLjwvcD5cbiAgICogXG4gICAqIDxwPkV4YW1wbGUgdXNlIGNhc2U6IHBlZXIgbXVsdGlzaWcgaGV4IGlzIGltcG9ydCB3aGVuIGNvbm5lY3RlZCB0byBhbiB1bnRydXN0ZWQgZGFlbW9uLFxuICAgKiBzbyB0aGUgd2FsbGV0IHdpbGwgbm90IHJlc2NhbiBzcGVudCBvdXRwdXRzLiAgVGhlbiB0aGUgd2FsbGV0IGNvbm5lY3RzIHRvIGEgdHJ1c3RlZFxuICAgKiBkYWVtb24uICBUaGlzIG1ldGhvZCBzaG91bGQgYmUgbWFudWFsbHkgaW52b2tlZCB0byByZXNjYW4gb3V0cHV0cy48L3A+XG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgcmVzY2FuU3BlbnQoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPlJlc2NhbiB0aGUgYmxvY2tjaGFpbiBmcm9tIHNjcmF0Y2gsIGxvc2luZyBhbnkgaW5mb3JtYXRpb24gd2hpY2ggY2Fubm90IGJlIHJlY292ZXJlZCBmcm9tXG4gICAqIHRoZSBibG9ja2NoYWluIGl0c2VsZi48L3A+XG4gICAqIFxuICAgKiA8cD5XQVJOSU5HOiBUaGlzIG1ldGhvZCBkaXNjYXJkcyBsb2NhbCB3YWxsZXQgZGF0YSBsaWtlIGRlc3RpbmF0aW9uIGFkZHJlc3NlcywgdHggc2VjcmV0IGtleXMsXG4gICAqIHR4IG5vdGVzLCBldGMuPC9wPlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHJlc2NhbkJsb2NrY2hhaW4oKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgYmFsYW5jZSBvZiB0aGUgd2FsbGV0LCBhY2NvdW50LCBvciBzdWJhZGRyZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFthY2NvdW50SWR4XSAtIGluZGV4IG9mIHRoZSBhY2NvdW50IHRvIGdldCB0aGUgYmFsYW5jZSBvZiAoZGVmYXVsdCBhbGwgYWNjb3VudHMpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3ViYWRkcmVzc0lkeF0gLSBpbmRleCBvZiB0aGUgc3ViYWRkcmVzcyB0byBnZXQgdGhlIGJhbGFuY2Ugb2YgKGRlZmF1bHQgYWxsIHN1YmFkZHJlc3NlcylcbiAgICogQHJldHVybiB7UHJvbWlzZTxiaWdpbnQ+fSB0aGUgYmFsYW5jZSBvZiB0aGUgd2FsbGV0LCBhY2NvdW50LCBvciBzdWJhZGRyZXNzXG4gICAqL1xuICBhc3luYyBnZXRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHVubG9ja2VkIGJhbGFuY2Ugb2YgdGhlIHdhbGxldCwgYWNjb3VudCwgb3Igc3ViYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbYWNjb3VudElkeF0gLSBpbmRleCBvZiB0aGUgYWNjb3VudCB0byBnZXQgdGhlIHVubG9ja2VkIGJhbGFuY2Ugb2YgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N1YmFkZHJlc3NJZHhdIC0gaW5kZXggb2YgdGhlIHN1YmFkZHJlc3MgdG8gZ2V0IHRoZSB1bmxvY2tlZCBiYWxhbmNlIG9mIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxiaWdpbnQ+fSB0aGUgdW5sb2NrZWQgYmFsYW5jZSBvZiB0aGUgd2FsbGV0LCBhY2NvdW50LCBvciBzdWJhZGRyZXNzXG4gICAqL1xuICBhc3luYyBnZXRVbmxvY2tlZEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgbnVtYmVyIG9mIGJsb2NrcyB1bnRpbCB0aGUgbmV4dCBhbmQgbGFzdCBmdW5kcyB1bmxvY2suIElnbm9yZXMgdHhzIHdpdGggdW5sb2NrIHRpbWUgYXMgdGltZXN0YW1wLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXJbXT59IHRoZSBudW1iZXIgb2YgYmxvY2tzIHVudGlsIHRoZSBuZXh0IGFuZCBsYXN0IGZ1bmRzIHVubG9jayBpbiBlbGVtZW50cyAwIGFuZCAxLCByZXNwZWN0aXZlbHksIG9yIHVuZGVmaW5lZCBpZiBubyBiYWxhbmNlXG4gICAqL1xuICBhc3luYyBnZXROdW1CbG9ja3NUb1VubG9jaygpOiBQcm9taXNlPG51bWJlcltdfHVuZGVmaW5lZD4ge1xuICAgIFxuICAgIC8vIGdldCBiYWxhbmNlc1xuICAgIGxldCBiYWxhbmNlID0gYXdhaXQgdGhpcy5nZXRCYWxhbmNlKCk7XG4gICAgaWYgKGJhbGFuY2UgPT09IDBuKSByZXR1cm4gW3VuZGVmaW5lZCwgdW5kZWZpbmVkXTsgLy8gc2tpcCBpZiBubyBiYWxhbmNlXG4gICAgbGV0IHVubG9ja2VkQmFsYW5jZSA9IGF3YWl0IHRoaXMuZ2V0VW5sb2NrZWRCYWxhbmNlKCk7XG4gICAgXG4gICAgLy8gY29tcHV0ZSBudW1iZXIgb2YgYmxvY2tzIHVudGlsIG5leHQgZnVuZHMgYXZhaWxhYmxlXG4gICAgbGV0IHR4czogTW9uZXJvVHhXYWxsZXRbXTtcbiAgICBsZXQgaGVpZ2h0OiBudW1iZXI7XG4gICAgbGV0IG51bUJsb2Nrc1RvTmV4dFVubG9jayA9IHVuZGVmaW5lZDtcbiAgICBpZiAodW5sb2NrZWRCYWxhbmNlID4gMG4pIG51bUJsb2Nrc1RvTmV4dFVubG9jayA9IDA7XG4gICAgZWxzZSB7XG4gICAgICB0eHMgPSBhd2FpdCB0aGlzLmdldFR4cyh7aXNMb2NrZWQ6IHRydWV9KTsgLy8gZ2V0IGxvY2tlZCB0eHNcbiAgICAgIGhlaWdodCA9IGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCk7IC8vIGdldCBtb3N0IHJlY2VudCBoZWlnaHRcbiAgICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgICBpZiAoIXR4LmdldElzQ29uZmlybWVkKCkgJiYgTW9uZXJvVXRpbHMuaXNUaW1lc3RhbXAodHguZ2V0VW5sb2NrVGltZSgpKSkgY29udGludWU7XG4gICAgICAgIGxldCBudW1CbG9ja3NUb1VubG9jayA9IE1hdGgubWF4KCh0eC5nZXRJc0NvbmZpcm1lZCgpID8gdHguZ2V0SGVpZ2h0KCkgOiBoZWlnaHQpICsgMTAsIE51bWJlcih0eC5nZXRVbmxvY2tUaW1lKCkpKSAtIGhlaWdodDtcbiAgICAgICAgbnVtQmxvY2tzVG9OZXh0VW5sb2NrID0gbnVtQmxvY2tzVG9OZXh0VW5sb2NrID09PSB1bmRlZmluZWQgPyBudW1CbG9ja3NUb1VubG9jayA6IE1hdGgubWluKG51bUJsb2Nrc1RvTmV4dFVubG9jaywgbnVtQmxvY2tzVG9VbmxvY2spO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBjb21wdXRlIG51bWJlciBvZiBibG9ja3MgdW50aWwgYWxsIGZ1bmRzIGF2YWlsYWJsZVxuICAgIGxldCBudW1CbG9ja3NUb0xhc3RVbmxvY2sgPSB1bmRlZmluZWQ7XG4gICAgaWYgKGJhbGFuY2UgPT09IHVubG9ja2VkQmFsYW5jZSkge1xuICAgICAgaWYgKHVubG9ja2VkQmFsYW5jZSA+IDBuKSBudW1CbG9ja3NUb0xhc3RVbmxvY2sgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIXR4cykge1xuICAgICAgICB0eHMgPSBhd2FpdCB0aGlzLmdldFR4cyh7aXNMb2NrZWQ6IHRydWV9KTsgLy8gZ2V0IGxvY2tlZCB0eHNcbiAgICAgICAgaGVpZ2h0ID0gYXdhaXQgdGhpcy5nZXRIZWlnaHQoKTsgLy8gZ2V0IG1vc3QgcmVjZW50IGhlaWdodFxuICAgICAgfVxuICAgICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICAgIGlmICghdHguZ2V0SXNDb25maXJtZWQoKSAmJiBNb25lcm9VdGlscy5pc1RpbWVzdGFtcCh0eC5nZXRVbmxvY2tUaW1lKCkpKSBjb250aW51ZTtcbiAgICAgICAgbGV0IG51bUJsb2Nrc1RvVW5sb2NrID0gTWF0aC5tYXgoKHR4LmdldElzQ29uZmlybWVkKCkgPyB0eC5nZXRIZWlnaHQoKSA6IGhlaWdodCkgKyAxMCwgTnVtYmVyKHR4LmdldFVubG9ja1RpbWUoKSkpIC0gaGVpZ2h0O1xuICAgICAgICBudW1CbG9ja3NUb0xhc3RVbmxvY2sgPSBudW1CbG9ja3NUb0xhc3RVbmxvY2sgPT09IHVuZGVmaW5lZCA/IG51bUJsb2Nrc1RvVW5sb2NrIDogTWF0aC5tYXgobnVtQmxvY2tzVG9MYXN0VW5sb2NrLCBudW1CbG9ja3NUb1VubG9jayk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBbbnVtQmxvY2tzVG9OZXh0VW5sb2NrLCBudW1CbG9ja3NUb0xhc3RVbmxvY2tdO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGFjY291bnRzIHdpdGggYSBnaXZlbiB0YWcuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGluY2x1ZGVTdWJhZGRyZXNzZXMgLSBpbmNsdWRlIHN1YmFkZHJlc3NlcyBpZiB0cnVlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgLSB0YWcgZm9yIGZpbHRlcmluZyBhY2NvdW50cywgYWxsIGFjY291bnRzIGlmIHVuZGVmaW5lZFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0FjY291bnRbXT59IGFsbCBhY2NvdW50cyB3aXRoIHRoZSBnaXZlbiB0YWdcbiAgICovXG4gIGFzeW5jIGdldEFjY291bnRzKGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuLCB0YWc/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnRbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYW4gYWNjb3VudC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gaW5kZXggb2YgdGhlIGFjY291bnQgdG8gZ2V0XG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaW5jbHVkZVN1YmFkZHJlc3NlcyAtIGluY2x1ZGUgc3ViYWRkcmVzc2VzIGlmIHRydWVcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9BY2NvdW50Pn0gdGhlIHJldHJpZXZlZCBhY2NvdW50XG4gICAqL1xuICBhc3luYyBnZXRBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4pOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ3JlYXRlIGEgbmV3IGFjY291bnQgd2l0aCBhIGxhYmVsIGZvciB0aGUgZmlyc3Qgc3ViYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbGFiZWxdIC0gbGFiZWwgZm9yIGFjY291bnQncyBmaXJzdCBzdWJhZGRyZXNzIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9BY2NvdW50Pn0gdGhlIGNyZWF0ZWQgYWNjb3VudFxuICAgKi9cbiAgYXN5bmMgY3JlYXRlQWNjb3VudChsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQWNjb3VudD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGFuIGFjY291bnQgbGFiZWwuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gYWNjb3VudElkeCAtIGluZGV4IG9mIHRoZSBhY2NvdW50IHRvIHNldCB0aGUgbGFiZWwgZm9yXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBsYWJlbCAtIHRoZSBsYWJlbCB0byBzZXRcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldEFjY291bnRMYWJlbChhY2NvdW50SWR4OiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnNldFN1YmFkZHJlc3NMYWJlbChhY2NvdW50SWR4LCAwLCBsYWJlbCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgc3ViYWRkcmVzc2VzIGluIGFuIGFjY291bnQuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gYWNjb3VudElkeCAtIGFjY291bnQgdG8gZ2V0IHN1YmFkZHJlc3NlcyB3aXRoaW5cbiAgICogQHBhcmFtIHtudW1iZXJbXX0gW3N1YmFkZHJlc3NJbmRpY2VzXSAtIGluZGljZXMgb2Ygc3ViYWRkcmVzc2VzIHRvIGdldCAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvU3ViYWRkcmVzc1tdPn0gdGhlIHJldHJpZXZlZCBzdWJhZGRyZXNzZXNcbiAgICovXG4gIGFzeW5jIGdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJbmRpY2VzPzogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3NbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSBzdWJhZGRyZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFjY291bnRJZHggLSBpbmRleCBvZiB0aGUgc3ViYWRkcmVzcydzIGFjY291bnRcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN1YmFkZHJlc3NJZHggLSBpbmRleCBvZiB0aGUgc3ViYWRkcmVzcyB3aXRoaW4gdGhlIGFjY291bnRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPn0gdGhlIHJldHJpZXZlZCBzdWJhZGRyZXNzXG4gICAqL1xuICBhc3luYyBnZXRTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgYXNzZXJ0KGFjY291bnRJZHggPj0gMCk7XG4gICAgYXNzZXJ0KHN1YmFkZHJlc3NJZHggPj0gMCk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldFN1YmFkZHJlc3NlcyhhY2NvdW50SWR4LCBbc3ViYWRkcmVzc0lkeF0pKVswXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENyZWF0ZSBhIHN1YmFkZHJlc3Mgd2l0aGluIGFuIGFjY291bnQuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gYWNjb3VudElkeCAtIGluZGV4IG9mIHRoZSBhY2NvdW50IHRvIGNyZWF0ZSB0aGUgc3ViYWRkcmVzcyB3aXRoaW5cbiAgICogQHBhcmFtIHtzdHJpbmd9IFtsYWJlbF0gLSB0aGUgbGFiZWwgZm9yIHRoZSBzdWJhZGRyZXNzIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPn0gdGhlIGNyZWF0ZWQgc3ViYWRkcmVzc1xuICAgKi9cbiAgYXN5bmMgY3JlYXRlU3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYSBzdWJhZGRyZXNzIGxhYmVsLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFjY291bnRJZHggLSBpbmRleCBvZiB0aGUgYWNjb3VudCB0byBzZXQgdGhlIGxhYmVsIGZvclxuICAgKiBAcGFyYW0ge251bWJlcn0gc3ViYWRkcmVzc0lkeCAtIGluZGV4IG9mIHRoZSBzdWJhZGRyZXNzIHRvIHNldCB0aGUgbGFiZWwgZm9yXG4gICAqIEBwYXJhbSB7UHJvbWlzZTxzdHJpbmc+fSBsYWJlbCAtIHRoZSBsYWJlbCB0byBzZXRcbiAgICovXG4gIGFzeW5jIHNldFN1YmFkZHJlc3NMYWJlbChhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlciwgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSB3YWxsZXQgdHJhbnNhY3Rpb24gYnkgaGFzaC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSBoYXNoIG9mIGEgdHJhbnNhY3Rpb24gdG8gZ2V0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhXYWxsZXQ+IH0gdGhlIGlkZW50aWZpZWQgdHJhbnNhY3Rpb24gb3IgdW5kZWZpbmVkIGlmIG5vdCBmb3VuZFxuICAgKi9cbiAgYXN5bmMgZ2V0VHgodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0fHVuZGVmaW5lZD4ge1xuICAgIGxldCB0eHMgPSBhd2FpdCB0aGlzLmdldFR4cyhbdHhIYXNoXSk7XG4gICAgcmV0dXJuIHR4cy5sZW5ndGggPT09IDAgPyB1bmRlZmluZWQgOiB0eHNbMF07IFxuICB9XG4gIFxuICAvKipcbiAgICogPHA+R2V0IHdhbGxldCB0cmFuc2FjdGlvbnMuICBXYWxsZXQgdHJhbnNhY3Rpb25zIGNvbnRhaW4gb25lIG9yIG1vcmVcbiAgICogdHJhbnNmZXJzIHRoYXQgYXJlIGVpdGhlciBpbmNvbWluZyBvciBvdXRnb2luZyB0byB0aGUgd2FsbGV0LjxwPlxuICAgKiBcbiAgICogPHA+UmVzdWx0cyBjYW4gYmUgZmlsdGVyZWQgYnkgcGFzc2luZyBhIHF1ZXJ5IG9iamVjdC4gIFRyYW5zYWN0aW9ucyBtdXN0XG4gICAqIG1lZXQgZXZlcnkgY3JpdGVyaWEgZGVmaW5lZCBpbiB0aGUgcXVlcnkgaW4gb3JkZXIgdG8gYmUgcmV0dXJuZWQuICBBbGxcbiAgICogY3JpdGVyaWEgYXJlIG9wdGlvbmFsIGFuZCBubyBmaWx0ZXJpbmcgaXMgYXBwbGllZCB3aGVuIG5vdCBkZWZpbmVkLjwvcD5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nW10gfCBNb25lcm9UeFF1ZXJ5fSBbcXVlcnldIC0gY29uZmlndXJlcyB0aGUgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc0NvbmZpcm1lZF0gLSBnZXQgdHhzIHRoYXQgYXJlIGNvbmZpcm1lZCBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pblR4UG9vbF0gLSBnZXQgdHhzIHRoYXQgYXJlIGluIHRoZSB0eCBwb29sIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzUmVsYXllZF0gLSBnZXQgdHhzIHRoYXQgYXJlIHJlbGF5ZWQgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNGYWlsZWRdIC0gZ2V0IHR4cyB0aGF0IGFyZSBmYWlsZWQgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNNaW5lclR4XSAtIGdldCBtaW5lciB0eHMgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtxdWVyeS5oYXNoXSAtIGdldCBhIHR4IHdpdGggdGhlIGhhc2ggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBbcXVlcnkuaGFzaGVzXSAtIGdldCB0eHMgd2l0aCB0aGUgaGFzaGVzIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtxdWVyeS5wYXltZW50SWRdIC0gZ2V0IHRyYW5zYWN0aW9ucyB3aXRoIHRoZSBwYXltZW50IGlkIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gW3F1ZXJ5LnBheW1lbnRJZHNdIC0gZ2V0IHRyYW5zYWN0aW9ucyB3aXRoIHRoZSBwYXltZW50IGlkcyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5Lmhhc1BheW1lbnRJZF0gLSBnZXQgdHJhbnNhY3Rpb25zIHdpdGggYSBwYXltZW50IGlkIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkubWluSGVpZ2h0XSAtIGdldCB0eHMgd2l0aCBoZWlnaHQgPj0gdGhlIGdpdmVuIGhlaWdodCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkubWF4SGVpZ2h0XSAtIGdldCB0eHMgd2l0aCBoZWlnaHQgPD0gdGhlIGdpdmVuIGhlaWdodCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzT3V0Z29pbmddIC0gZ2V0IHR4cyB3aXRoIGFuIG91dGdvaW5nIHRyYW5zZmVyIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzSW5jb21pbmddIC0gZ2V0IHR4cyB3aXRoIGFuIGluY29taW5nIHRyYW5zZmVyIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvVHJhbnNmZXJRdWVyeX0gW3F1ZXJ5LnRyYW5zZmVyUXVlcnldIC0gZ2V0IHR4cyB0aGF0IGhhdmUgYSB0cmFuc2ZlciB0aGF0IG1lZXRzIHRoaXMgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pbmNsdWRlT3V0cHV0c10gLSBzcGVjaWZpZXMgdGhhdCB0eCBvdXRwdXRzIHNob3VsZCBiZSByZXR1cm5lZCB3aXRoIHR4IHJlc3VsdHMgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+fSB3YWxsZXQgdHJhbnNhY3Rpb25zIHBlciB0aGUgY29uZmlndXJhdGlvblxuICAgKi9cbiAgYXN5bmMgZ2V0VHhzKHF1ZXJ5Pzogc3RyaW5nW10gfCBQYXJ0aWFsPE1vbmVyb1R4UXVlcnk+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiA8cD5HZXQgaW5jb21pbmcgYW5kIG91dGdvaW5nIHRyYW5zZmVycyB0byBhbmQgZnJvbSB0aGlzIHdhbGxldC4gIEFuIG91dGdvaW5nXG4gICAqIHRyYW5zZmVyIHJlcHJlc2VudHMgYSB0b3RhbCBhbW91bnQgc2VudCBmcm9tIG9uZSBvciBtb3JlIHN1YmFkZHJlc3Nlc1xuICAgKiB3aXRoaW4gYW4gYWNjb3VudCB0byBpbmRpdmlkdWFsIGRlc3RpbmF0aW9uIGFkZHJlc3NlcywgZWFjaCB3aXRoIHRoZWlyXG4gICAqIG93biBhbW91bnQuICBBbiBpbmNvbWluZyB0cmFuc2ZlciByZXByZXNlbnRzIGEgdG90YWwgYW1vdW50IHJlY2VpdmVkIGludG9cbiAgICogYSBzdWJhZGRyZXNzIHdpdGhpbiBhbiBhY2NvdW50LiAgVHJhbnNmZXJzIGJlbG9uZyB0byB0cmFuc2FjdGlvbnMgd2hpY2hcbiAgICogYXJlIHN0b3JlZCBvbiB0aGUgYmxvY2tjaGFpbi48L3A+XG4gICAqIFxuICAgKiA8cD5SZXN1bHRzIGNhbiBiZSBmaWx0ZXJlZCBieSBwYXNzaW5nIGEgcXVlcnkgb2JqZWN0LiAgVHJhbnNmZXJzIG11c3RcbiAgICogbWVldCBldmVyeSBjcml0ZXJpYSBkZWZpbmVkIGluIHRoZSBxdWVyeSBpbiBvcmRlciB0byBiZSByZXR1cm5lZC4gIEFsbFxuICAgKiBjcml0ZXJpYSBhcmUgb3B0aW9uYWwgYW5kIG5vIGZpbHRlcmluZyBpcyBhcHBsaWVkIHdoZW4gbm90IGRlZmluZWQuPC9wPlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UcmFuc2ZlclF1ZXJ5fSBbcXVlcnldIC0gY29uZmlndXJlcyB0aGUgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc091dGdvaW5nXSAtIGdldCB0cmFuc2ZlcnMgdGhhdCBhcmUgb3V0Z29pbmcgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNJbmNvbWluZ10gLSBnZXQgdHJhbnNmZXJzIHRoYXQgYXJlIGluY29taW5nIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcXVlcnkuYWRkcmVzc10gLSB3YWxsZXQncyBhZGRyZXNzIHRoYXQgYSB0cmFuc2ZlciBlaXRoZXIgb3JpZ2luYXRlZCBmcm9tIChpZiBvdXRnb2luZykgb3IgaXMgZGVzdGluZWQgZm9yIChpZiBpbmNvbWluZykgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LmFjY291bnRJbmRleF0gLSBnZXQgdHJhbnNmZXJzIHRoYXQgZWl0aGVyIG9yaWdpbmF0ZWQgZnJvbSAoaWYgb3V0Z29pbmcpIG9yIGFyZSBkZXN0aW5lZCBmb3IgKGlmIGluY29taW5nKSBhIHNwZWNpZmljIGFjY291bnQgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRleF0gLSBnZXQgdHJhbnNmZXJzIHRoYXQgZWl0aGVyIG9yaWdpbmF0ZWQgZnJvbSAoaWYgb3V0Z29pbmcpIG9yIGFyZSBkZXN0aW5lZCBmb3IgKGlmIGluY29taW5nKSBhIHNwZWNpZmljIHN1YmFkZHJlc3MgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2ludFtdfSBbcXVlcnkuc3ViYWRkcmVzc0luZGljZXNdIC0gZ2V0IHRyYW5zZmVycyB0aGF0IGVpdGhlciBvcmlnaW5hdGVkIGZyb20gKGlmIG91dGdvaW5nKSBvciBhcmUgZGVzdGluZWQgZm9yIChpZiBpbmNvbWluZykgc3BlY2lmaWMgc3ViYWRkcmVzcyBpbmRpY2VzIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtiaWdpbnR9IFtxdWVyeS5hbW91bnRdIC0gYW1vdW50IGJlaW5nIHRyYW5zZmVycmVkIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtNb25lcm9EZXN0aW5hdGlvbltdIHwgTW9uZXJvRGVzdGluYXRpb25Nb2RlbFtdfSBbcXVlcnkuZGVzdGluYXRpb25zXSAtIGluZGl2aWR1YWwgZGVzdGluYXRpb25zIG9mIGFuIG91dGdvaW5nIHRyYW5zZmVyLCB3aGljaCBpcyBsb2NhbCB3YWxsZXQgZGF0YSBhbmQgTk9UIHJlY292ZXJhYmxlIGZyb20gdGhlIGJsb2NrY2hhaW4gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5oYXNEZXN0aW5hdGlvbnNdIC0gZ2V0IHRyYW5zZmVycyB0aGF0IGhhdmUgZGVzdGluYXRpb25zIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhRdWVyeX0gW3F1ZXJ5LnR4UXVlcnldIC0gZ2V0IHRyYW5zZmVycyB3aG9zZSB0cmFuc2FjdGlvbiBtZWV0cyB0aGlzIHF1ZXJ5IChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UcmFuc2ZlcltdPn0gd2FsbGV0IHRyYW5zZmVycyB0aGF0IG1lZXQgdGhlIHF1ZXJ5XG4gICAqL1xuICBhc3luYyBnZXRUcmFuc2ZlcnMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9UcmFuc2ZlcltdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBpbmNvbWluZyB0cmFuc2ZlcnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT59IFtxdWVyeV0gLSBjb25maWd1cmVzIHRoZSBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcXVlcnkuYWRkcmVzc10gLSBnZXQgaW5jb21pbmcgdHJhbnNmZXJzIHRvIGEgc3BlY2lmaWMgYWRkcmVzcyBpbiB0aGUgd2FsbGV0IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5hY2NvdW50SW5kZXhdIC0gZ2V0IGluY29taW5nIHRyYW5zZmVycyB0byBhIHNwZWNpZmljIGFjY291bnQgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRleF0gLSBnZXQgaW5jb21pbmcgdHJhbnNmZXJzIHRvIGEgc3BlY2lmaWMgc3ViYWRkcmVzcyBpbmRleCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7aW50W119IFtxdWVyeS5zdWJhZGRyZXNzSW5kaWNlc10gLSBnZXQgdHJhbnNmZXJzIGRlc3RpbmVkIGZvciBzcGVjaWZpYyBzdWJhZGRyZXNzIGluZGljZXMgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludH0gW3F1ZXJ5LmFtb3VudF0gLSBhbW91bnQgYmVpbmcgdHJhbnNmZXJyZWQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UXVlcnl9IFtxdWVyeS50eFF1ZXJ5XSAtIGdldCB0cmFuc2ZlcnMgd2hvc2UgdHJhbnNhY3Rpb24gbWVldHMgdGhpcyBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvSW5jb21pbmdUcmFuc2ZlcltdPn0gaW5jb21pbmcgdHJhbnNmZXJzIHRoYXQgbWVldCB0aGUgcXVlcnlcbiAgICovXG4gIGFzeW5jIGdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvSW5jb21pbmdUcmFuc2ZlcltdPiB7XG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkOiBNb25lcm9UcmFuc2ZlclF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQuZ2V0SXNJbmNvbWluZygpID09PSBmYWxzZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVHJhbnNmZXIgcXVlcnkgY29udHJhZGljdHMgZ2V0dGluZyBpbmNvbWluZyB0cmFuc2ZlcnNcIik7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldElzSW5jb21pbmcodHJ1ZSk7XG4gICAgcmV0dXJuIHRoaXMuZ2V0VHJhbnNmZXJzKHF1ZXJ5Tm9ybWFsaXplZCkgYXMgdW5rbm93biBhcyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyW107XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgb3V0Z29pbmcgdHJhbnNmZXJzLlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+fSBbcXVlcnldIC0gY29uZmlndXJlcyB0aGUgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3F1ZXJ5LmFkZHJlc3NdIC0gZ2V0IG91dGdvaW5nIHRyYW5zZmVycyBmcm9tIGEgc3BlY2lmaWMgYWRkcmVzcyBpbiB0aGUgd2FsbGV0IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5hY2NvdW50SW5kZXhdIC0gZ2V0IG91dGdvaW5nIHRyYW5zZmVycyBmcm9tIGEgc3BlY2lmaWMgYWNjb3VudCBpbmRleCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkuc3ViYWRkcmVzc0luZGV4XSAtIGdldCBvdXRnb2luZyB0cmFuc2ZlcnMgZnJvbSBhIHNwZWNpZmljIHN1YmFkZHJlc3MgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2ludFtdfSBbcXVlcnkuc3ViYWRkcmVzc0luZGljZXNdIC0gZ2V0IG91dGdvaW5nIHRyYW5zZmVycyBmcm9tIHNwZWNpZmljIHN1YmFkZHJlc3MgaW5kaWNlcyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7YmlnaW50fSBbcXVlcnkuYW1vdW50XSAtIGFtb3VudCBiZWluZyB0cmFuc2ZlcnJlZCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvRGVzdGluYXRpb25bXSB8IE1vbmVyb0Rlc3RpbmF0aW9uTW9kZWxbXX0gW3F1ZXJ5LmRlc3RpbmF0aW9uc10gLSBpbmRpdmlkdWFsIGRlc3RpbmF0aW9ucyBvZiBhbiBvdXRnb2luZyB0cmFuc2Zlciwgd2hpY2ggaXMgbG9jYWwgd2FsbGV0IGRhdGEgYW5kIE5PVCByZWNvdmVyYWJsZSBmcm9tIHRoZSBibG9ja2NoYWluIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaGFzRGVzdGluYXRpb25zXSAtIGdldCB0cmFuc2ZlcnMgdGhhdCBoYXZlIGRlc3RpbmF0aW9ucyBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UXVlcnl9IFtxdWVyeS50eFF1ZXJ5XSAtIGdldCB0cmFuc2ZlcnMgd2hvc2UgdHJhbnNhY3Rpb24gbWVldHMgdGhpcyBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvT3V0Z29pbmdUcmFuc2ZlcltdPn0gb3V0Z29pbmcgdHJhbnNmZXJzIHRoYXQgbWVldCB0aGUgcXVlcnlcbiAgICovXG4gIGFzeW5jIGdldE91dGdvaW5nVHJhbnNmZXJzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvT3V0Z29pbmdUcmFuc2ZlcltdPiB7XG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkOiBNb25lcm9UcmFuc2ZlclF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQuZ2V0SXNPdXRnb2luZygpID09PSBmYWxzZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVHJhbnNmZXIgcXVlcnkgY29udHJhZGljdHMgZ2V0dGluZyBvdXRnb2luZyB0cmFuc2ZlcnNcIik7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgcmV0dXJuIHRoaXMuZ2V0VHJhbnNmZXJzKHF1ZXJ5Tm9ybWFsaXplZCkgYXMgdW5rbm93biBhcyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyW107XG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5HZXQgb3V0cHV0cyBjcmVhdGVkIGZyb20gcHJldmlvdXMgdHJhbnNhY3Rpb25zIHRoYXQgYmVsb25nIHRvIHRoZSB3YWxsZXRcbiAgICogKGkuZS4gdGhhdCB0aGUgd2FsbGV0IGNhbiBzcGVuZCBvbmUgdGltZSkuICBPdXRwdXRzIGFyZSBwYXJ0IG9mXG4gICAqIHRyYW5zYWN0aW9ucyB3aGljaCBhcmUgc3RvcmVkIGluIGJsb2NrcyBvbiB0aGUgYmxvY2tjaGFpbi48L3A+XG4gICAqIFxuICAgKiA8cD5SZXN1bHRzIGNhbiBiZSBmaWx0ZXJlZCBieSBwYXNzaW5nIGEgcXVlcnkgb2JqZWN0LiAgT3V0cHV0cyBtdXN0XG4gICAqIG1lZXQgZXZlcnkgY3JpdGVyaWEgZGVmaW5lZCBpbiB0aGUgcXVlcnkgaW4gb3JkZXIgdG8gYmUgcmV0dXJuZWQuICBBbGxcbiAgICogZmlsdGVyaW5nIGlzIG9wdGlvbmFsIGFuZCBubyBmaWx0ZXJpbmcgaXMgYXBwbGllZCB3aGVuIG5vdCBkZWZpbmVkLjwvcD5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFyaXRhbDxNb25lcm9PdXRwdXRRdWVyeT59IFtxdWVyeV0gLSBjb25maWd1cmVzIHRoZSBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkuYWNjb3VudEluZGV4XSAtIGdldCBvdXRwdXRzIGFzc29jaWF0ZWQgd2l0aCBhIHNwZWNpZmljIGFjY291bnQgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRleF0gLSBnZXQgb3V0cHV0cyBhc3NvY2lhdGVkIHdpdGggYSBzcGVjaWZpYyBzdWJhZGRyZXNzIGluZGV4IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtpbnRbXX0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRpY2VzXSAtIGdldCBvdXRwdXRzIGFzc29jaWF0ZWQgd2l0aCBzcGVjaWZpYyBzdWJhZGRyZXNzIGluZGljZXMgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludH0gW3F1ZXJ5LmFtb3VudF0gLSBnZXQgb3V0cHV0cyB3aXRoIGEgc3BlY2lmaWMgYW1vdW50IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtiaWdpbnR9IFtxdWVyeS5taW5BbW91bnRdIC0gZ2V0IG91dHB1dHMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIGEgbWluaW11bSBhbW91bnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludH0gW3F1ZXJ5Lm1heEFtb3VudF0gLSBnZXQgb3V0cHV0cyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gYSBtYXhpbXVtIGFtb3VudCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzU3BlbnRdIC0gZ2V0IG91dHB1dHMgdGhhdCBhcmUgc3BlbnQgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvS2V5SW1hZ2V9IFtxdWVyeS5rZXlJbWFnZV0gLSBnZXQgb3V0cHV0IHdpdGggYSBrZXkgaW1hZ2Ugb3Igd2hpY2ggbWF0Y2hlcyBmaWVsZHMgZGVmaW5lZCBpbiBhIE1vbmVyb0tleUltYWdlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtNb25lcm9UeFF1ZXJ5fSBbcXVlcnkudHhRdWVyeV0gLSBnZXQgb3V0cHV0cyB3aG9zZSB0cmFuc2FjdGlvbiBtZWV0cyB0aGlzIGZpbHRlciAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvT3V0cHV0V2FsbGV0W10+fSB0aGUgcXVlcmllZCBvdXRwdXRzXG4gICAqL1xuICBhc3luYyBnZXRPdXRwdXRzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9PdXRwdXRRdWVyeT4pOiBQcm9taXNlPE1vbmVyb091dHB1dFdhbGxldFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEV4cG9ydCBvdXRwdXRzIGluIGhleCBmb3JtYXQuXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2FsbF0gLSBleHBvcnQgYWxsIG91dHB1dHMgaWYgdHJ1ZSwgZWxzZSBleHBvcnQgdGhlIG91dHB1dHMgc2luY2UgdGhlIGxhc3QgZXhwb3J0IChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IG91dHB1dHMgaW4gaGV4IGZvcm1hdFxuICAgKi9cbiAgYXN5bmMgZXhwb3J0T3V0cHV0cyhhbGwgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEltcG9ydCBvdXRwdXRzIGluIGhleCBmb3JtYXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3V0cHV0c0hleCAtIG91dHB1dHMgaW4gaGV4IGZvcm1hdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBudW1iZXIgb2Ygb3V0cHV0cyBpbXBvcnRlZFxuICAgKi9cbiAgYXN5bmMgaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBFeHBvcnQgc2lnbmVkIGtleSBpbWFnZXMuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthbGxdIC0gZXhwb3J0IGFsbCBrZXkgaW1hZ2VzIGlmIHRydWUsIGVsc2UgZXhwb3J0IHRoZSBrZXkgaW1hZ2VzIHNpbmNlIHRoZSBsYXN0IGV4cG9ydCAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9LZXlJbWFnZUV4cG9ydFJlc3VsdD59IHRoZSB3YWxsZXQncyBzaWduZWQga2V5IGltYWdlcyBhbmQgdGhlaXIgb2Zmc2V0IGFtb25nIHRoZSB3YWxsZXQncyBvdXRwdXRzXG4gICAqL1xuICBhc3luYyBleHBvcnRLZXlJbWFnZXMoYWxsID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEltcG9ydCBzaWduZWQga2V5IGltYWdlcyBhbmQgdmVyaWZ5IHRoZWlyIHNwZW50IHN0YXR1cy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvS2V5SW1hZ2VbXX0ga2V5SW1hZ2VzIC0gaW1hZ2VzIHRvIGltcG9ydCBhbmQgdmVyaWZ5IChyZXF1aXJlcyBoZXggYW5kIHNpZ25hdHVyZSlcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtvZmZzZXRdIC0gb2Zmc2V0IG9mIHRoZSBmaXJzdCBrZXkgaW1hZ2UgYW1vbmcgdGhlIHdhbGxldCdzIG91dHB1dHMgKGRlZmF1bHQgMClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdD59IHJlc3VsdHMgb2YgdGhlIGltcG9ydFxuICAgKi9cbiAgYXN5bmMgaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlczogTW9uZXJvS2V5SW1hZ2VbXSwgb2Zmc2V0ID0gMCk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IG5ldyBrZXkgaW1hZ2VzIGZyb20gdGhlIGxhc3QgaW1wb3J0ZWQgb3V0cHV0cy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT59IHRoZSBrZXkgaW1hZ2VzIGZyb20gdGhlIGxhc3QgaW1wb3J0ZWQgb3V0cHV0c1xuICAgKi9cbiAgYXN5bmMgZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEZyZWV6ZSBhbiBvdXRwdXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SW1hZ2UgLSBrZXkgaW1hZ2Ugb2YgdGhlIG91dHB1dCB0byBmcmVlemVcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIGZyZWV6ZU91dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFRoYXcgYSBmcm96ZW4gb3V0cHV0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUltYWdlIC0ga2V5IGltYWdlIG9mIHRoZSBvdXRwdXQgdG8gdGhhd1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgdGhhd091dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENoZWNrIGlmIGFuIG91dHB1dCBpcyBmcm96ZW4uXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SW1hZ2UgLSBrZXkgaW1hZ2Ugb2YgdGhlIG91dHB1dCB0byBjaGVjayBpZiBmcm96ZW5cbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgb3V0cHV0IGlzIGZyb3plbiwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBpc091dHB1dEZyb3plbihrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIGN1cnJlbnQgZGVmYXVsdCBmZWUgcHJpb3JpdHkgKHVuaW1wb3J0YW50LCBub3JtYWwsIGVsZXZhdGVkLCBldGMpLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFByaW9yaXR5Pn0gdGhlIGN1cnJlbnQgZmVlIHByaW9yaXR5XG4gICAqL1xuICBhc3luYyBnZXREZWZhdWx0RmVlUHJpb3JpdHkoKTogUHJvbWlzZTxNb25lcm9UeFByaW9yaXR5PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENyZWF0ZSBhIHRyYW5zYWN0aW9uIHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gdGhpcyB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4Q29uZmlnfSBjb25maWcgLSBjb25maWd1cmVzIHRoZSB0cmFuc2FjdGlvbiB0byBjcmVhdGUgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmFkZHJlc3MgLSBzaW5nbGUgZGVzdGluYXRpb24gYWRkcmVzcyAocmVxdWlyZWQgdW5sZXNzIGBkZXN0aW5hdGlvbnNgIHByb3ZpZGVkKVxuICAgKiBAcGFyYW0ge2JpZ2ludHxzdHJpbmd9IGNvbmZpZy5hbW91bnQgLSBzaW5nbGUgZGVzdGluYXRpb24gYW1vdW50IChyZXF1aXJlZCB1bmxlc3MgYGRlc3RpbmF0aW9uc2AgcHJvdmlkZWQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBjb25maWcuYWNjb3VudEluZGV4IC0gc291cmNlIGFjY291bnQgaW5kZXggdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSAocmVxdWlyZWQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnN1YmFkZHJlc3NJbmRleF0gLSBzb3VyY2Ugc3ViYWRkcmVzcyBpbmRleCB0byB0cmFuc2ZlciBmdW5kcyBmcm9tIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJbXX0gW2NvbmZpZy5zdWJhZGRyZXNzSW5kaWNlc10gLSBzb3VyY2Ugc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucmVsYXldIC0gcmVsYXkgdGhlIHRyYW5zYWN0aW9uIHRvIHBlZXJzIHRvIGNvbW1pdCB0byB0aGUgYmxvY2tjaGFpbiAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHBhcmFtIHtNb25lcm9UeFByaW9yaXR5fSBbY29uZmlnLnByaW9yaXR5XSAtIHRyYW5zYWN0aW9uIHByaW9yaXR5IChkZWZhdWx0IE1vbmVyb1R4UHJpb3JpdHkuTk9STUFMKVxuICAgKiBAcGFyYW0ge01vbmVyb0Rlc3RpbmF0aW9uW119IGNvbmZpZy5kZXN0aW5hdGlvbnMgLSBhZGRyZXNzZXMgYW5kIGFtb3VudHMgaW4gYSBtdWx0aS1kZXN0aW5hdGlvbiB0eCAocmVxdWlyZWQgdW5sZXNzIGBhZGRyZXNzYCBhbmQgYGFtb3VudGAgcHJvdmlkZWQpXG4gICAqIEBwYXJhbSB7bnVtYmVyW119IFtjb25maWcuc3VidHJhY3RGZWVGcm9tXSAtIGxpc3Qgb2YgZGVzdGluYXRpb24gaW5kaWNlcyB0byBzcGxpdCB0aGUgdHJhbnNhY3Rpb24gZmVlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGF5bWVudElkXSAtIHRyYW5zYWN0aW9uIHBheW1lbnQgSUQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludHxzdHJpbmd9IFtjb25maWcudW5sb2NrVGltZV0gLSBtaW5pbXVtIGhlaWdodCBvciB0aW1lc3RhbXAgZm9yIHRoZSB0cmFuc2FjdGlvbiB0byB1bmxvY2sgKGRlZmF1bHQgMClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldD59IHRoZSBjcmVhdGVkIHRyYW5zYWN0aW9uXG4gICAqL1xuICBhc3luYyBjcmVhdGVUeChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4ge1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQ6IE1vbmVyb1R4Q29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgIT09IHVuZGVmaW5lZCkgYXNzZXJ0LmVxdWFsKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSwgZmFsc2UsIFwiQ2Fubm90IHNwbGl0IHRyYW5zYWN0aW9ucyB1c2luZyBjcmVhdGVUeCgpOyB1c2UgY3JlYXRlVHhzKClcIik7XG4gICAgY29uZmlnTm9ybWFsaXplZC5zZXRDYW5TcGxpdChmYWxzZSk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNyZWF0ZVR4cyhjb25maWdOb3JtYWxpemVkKSlbMF07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDcmVhdGUgb25lIG9yIG1vcmUgdHJhbnNhY3Rpb25zIHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gdGhpcyB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvVHhDb25maWc+fSBjb25maWcgLSBjb25maWd1cmVzIHRoZSB0cmFuc2FjdGlvbnMgdG8gY3JlYXRlIChyZXF1aXJlZClcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5hZGRyZXNzIC0gc2luZ2xlIGRlc3RpbmF0aW9uIGFkZHJlc3MgKHJlcXVpcmVkIHVubGVzcyBgZGVzdGluYXRpb25zYCBwcm92aWRlZClcbiAgICogQHBhcmFtIHtiaWdpbnR8c3RyaW5nfSBjb25maWcuYW1vdW50IC0gc2luZ2xlIGRlc3RpbmF0aW9uIGFtb3VudCAocmVxdWlyZWQgdW5sZXNzIGBkZXN0aW5hdGlvbnNgIHByb3ZpZGVkKVxuICAgKiBAcGFyYW0ge251bWJlcn0gY29uZmlnLmFjY291bnRJbmRleCAtIHNvdXJjZSBhY2NvdW50IGluZGV4IHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy5zdWJhZGRyZXNzSW5kZXhdIC0gc291cmNlIHN1YmFkZHJlc3MgaW5kZXggdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7aW50W119IFtjb25maWcuc3ViYWRkcmVzc0luZGljZXNdIC0gc291cmNlIHN1YmFkZHJlc3MgaW5kaWNlcyB0byB0cmFuc2ZlciBmdW5kcyBmcm9tIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnJlbGF5XSAtIHJlbGF5IHRoZSB0cmFuc2FjdGlvbnMgdG8gcGVlcnMgdG8gY29tbWl0IHRvIHRoZSBibG9ja2NoYWluIChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UHJpb3JpdHl9IFtjb25maWcucHJpb3JpdHldIC0gdHJhbnNhY3Rpb24gcHJpb3JpdHkgKGRlZmF1bHQgTW9uZXJvVHhQcmlvcml0eS5OT1JNQUwpXG4gICAqIEBwYXJhbSB7TW9uZXJvRGVzdGluYXRpb25bXSB8IE1vbmVyb0Rlc3RpbmF0aW9uTW9kZWxbXX0gY29uZmlnLmRlc3RpbmF0aW9ucyAtIGFkZHJlc3NlcyBhbmQgYW1vdW50cyBpbiBhIG11bHRpLWRlc3RpbmF0aW9uIHR4IChyZXF1aXJlZCB1bmxlc3MgYGFkZHJlc3NgIGFuZCBgYW1vdW50YCBwcm92aWRlZClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGF5bWVudElkXSAtIHRyYW5zYWN0aW9uIHBheW1lbnQgSUQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludHxzdHJpbmd9IFtjb25maWcudW5sb2NrVGltZV0gLSBtaW5pbXVtIGhlaWdodCBvciB0aW1lc3RhbXAgZm9yIHRoZSB0cmFuc2FjdGlvbnMgdG8gdW5sb2NrIChkZWZhdWx0IDApXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5jYW5TcGxpdF0gLSBhbGxvdyBmdW5kcyB0byBiZSB0cmFuc2ZlcnJlZCB1c2luZyBtdWx0aXBsZSB0cmFuc2FjdGlvbnMgKGRlZmF1bHQgdHJ1ZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPn0gdGhlIGNyZWF0ZWQgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBjcmVhdGVUeHMoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTd2VlcCBhbiBvdXRwdXQgYnkga2V5IGltYWdlLlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPn0gY29uZmlnIC0gY29uZmlndXJlcyB0aGUgdHJhbnNhY3Rpb24gdG8gY3JlYXRlIChyZXF1aXJlZClcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5hZGRyZXNzIC0gc2luZ2xlIGRlc3RpbmF0aW9uIGFkZHJlc3MgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmtleUltYWdlIC0ga2V5IGltYWdlIHRvIHN3ZWVwIChyZXF1aXJlZClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnJlbGF5XSAtIHJlbGF5IHRoZSB0cmFuc2FjdGlvbiB0byBwZWVycyB0byBjb21taXQgdG8gdGhlIGJsb2NrY2hhaW4gKGRlZmF1bHQgZmFsc2UpXG4gICAqIEBwYXJhbSB7YmlnaW50fHN0cmluZ30gW2NvbmZpZy51bmxvY2tUaW1lXSAtIG1pbmltdW0gaGVpZ2h0IG9yIHRpbWVzdGFtcCBmb3IgdGhlIHRyYW5zYWN0aW9uIHRvIHVubG9jayAoZGVmYXVsdCAwKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UHJpb3JpdHl9IFtjb25maWcucHJpb3JpdHldIC0gdHJhbnNhY3Rpb24gcHJpb3JpdHkgKGRlZmF1bHQgTW9uZXJvVHhQcmlvcml0eS5OT1JNQUwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhXYWxsZXQ+fSB0aGUgY3JlYXRlZCB0cmFuc2FjdGlvblxuICAgKi9cbiAgYXN5bmMgc3dlZXBPdXRwdXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN3ZWVwIGFsbCB1bmxvY2tlZCBmdW5kcyBhY2NvcmRpbmcgdG8gdGhlIGdpdmVuIGNvbmZpZ3VyYXRpb24uXG4gICAqIFxuICAgKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvVHhDb25maWc+fSBjb25maWcgLSBjb25maWd1cmVzIHRoZSB0cmFuc2FjdGlvbnMgdG8gY3JlYXRlIChyZXF1aXJlZClcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5hZGRyZXNzIC0gc2luZ2xlIGRlc3RpbmF0aW9uIGFkZHJlc3MgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy5hY2NvdW50SW5kZXhdIC0gc291cmNlIGFjY291bnQgaW5kZXggdG8gc3dlZXAgZnJvbSAob3B0aW9uYWwsIGRlZmF1bHRzIHRvIGFsbCBhY2NvdW50cylcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcuc3ViYWRkcmVzc0luZGV4XSAtIHNvdXJjZSBzdWJhZGRyZXNzIGluZGV4IHRvIHN3ZWVwIGZyb20gKG9wdGlvbmFsLCBkZWZhdWx0cyB0byBhbGwgc3ViYWRkcmVzc2VzKVxuICAgKiBAcGFyYW0ge251bWJlcltdfSBbY29uZmlnLnN1YmFkZHJlc3NJbmRpY2VzXSAtIHNvdXJjZSBzdWJhZGRyZXNzIGluZGljZXMgdG8gc3dlZXAgZnJvbSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5yZWxheV0gLSByZWxheSB0aGUgdHJhbnNhY3Rpb25zIHRvIHBlZXJzIHRvIGNvbW1pdCB0byB0aGUgYmxvY2tjaGFpbiAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHBhcmFtIHtNb25lcm9UeFByaW9yaXR5fSBbY29uZmlnLnByaW9yaXR5XSAtIHRyYW5zYWN0aW9uIHByaW9yaXR5IChkZWZhdWx0IE1vbmVyb1R4UHJpb3JpdHkuTk9STUFMKVxuICAgKiBAcGFyYW0ge2JpZ2ludHxzdHJpbmd9IFtjb25maWcudW5sb2NrVGltZV0gLSBtaW5pbXVtIGhlaWdodCBvciB0aW1lc3RhbXAgZm9yIHRoZSB0cmFuc2FjdGlvbnMgdG8gdW5sb2NrIChkZWZhdWx0IDApXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5zd2VlcEVhY2hTdWJhZGRyZXNzXSAtIHN3ZWVwIGVhY2ggc3ViYWRkcmVzcyBpbmRpdmlkdWFsbHkgaWYgdHJ1ZSAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPn0gdGhlIGNyZWF0ZWQgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBzd2VlcFVubG9ja2VkKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+U3dlZXAgYWxsIHVubWl4YWJsZSBkdXN0IG91dHB1dHMgYmFjayB0byB0aGUgd2FsbGV0IHRvIG1ha2UgdGhlbSBlYXNpZXIgdG8gc3BlbmQgYW5kIG1peC48L3A+XG4gICAqIFxuICAgKiA8cD5OT1RFOiBEdXN0IG9ubHkgZXhpc3RzIHByZSBSQ1QsIHNvIHRoaXMgbWV0aG9kIHdpbGwgdGhyb3cgXCJubyBkdXN0IHRvIHN3ZWVwXCIgb24gbmV3IHdhbGxldHMuPC9wPlxuICAgKiBcbiAgICogQHBhcmFtIHtib29sZWFufSBbcmVsYXldIC0gc3BlY2lmaWVzIGlmIHRoZSByZXN1bHRpbmcgdHJhbnNhY3Rpb24gc2hvdWxkIGJlIHJlbGF5ZWQgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhXYWxsZXRbXT59IHRoZSBjcmVhdGVkIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgc3dlZXBEdXN0KHJlbGF5PzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZWxheSBhIHByZXZpb3VzbHkgY3JlYXRlZCB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7KE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKX0gdHhPck1ldGFkYXRhIC0gdHJhbnNhY3Rpb24gb3IgaXRzIG1ldGFkYXRhIHRvIHJlbGF5XG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIGhhc2ggb2YgdGhlIHJlbGF5ZWQgdHhcbiAgICovXG4gIGFzeW5jIHJlbGF5VHgodHhPck1ldGFkYXRhOiBNb25lcm9UeFdhbGxldCB8IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLnJlbGF5VHhzKFt0eE9yTWV0YWRhdGFdKSlbMF07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZWxheSBwcmV2aW91c2x5IGNyZWF0ZWQgdHJhbnNhY3Rpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHsoTW9uZXJvVHhXYWxsZXRbXSB8IHN0cmluZ1tdKX0gdHhzT3JNZXRhZGF0YXMgLSB0cmFuc2FjdGlvbnMgb3IgdGhlaXIgbWV0YWRhdGEgdG8gcmVsYXlcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmdbXT59IHRoZSBoYXNoZXMgb2YgdGhlIHJlbGF5ZWQgdHhzXG4gICAqL1xuICBhc3luYyByZWxheVR4cyh0eHNPck1ldGFkYXRhczogKE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKVtdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZXNjcmliZSBhIHR4IHNldCBmcm9tIHVuc2lnbmVkIHR4IGhleC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1bnNpZ25lZFR4SGV4IC0gdW5zaWduZWQgdHggaGV4XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhTZXQ+fSB0aGUgdHggc2V0IGNvbnRhaW5pbmcgc3RydWN0dXJlZCB0cmFuc2FjdGlvbnNcbiAgICovXG4gIGFzeW5jIGRlc2NyaWJlVW5zaWduZWRUeFNldCh1bnNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgcmV0dXJuIHRoaXMuZGVzY3JpYmVUeFNldChuZXcgTW9uZXJvVHhTZXQoKS5zZXRVbnNpZ25lZFR4SGV4KHVuc2lnbmVkVHhIZXgpKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlc2NyaWJlIGEgdHggc2V0IGZyb20gbXVsdGlzaWcgdHggaGV4LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG11bHRpc2lnVHhIZXggLSBtdWx0aXNpZyB0eCBoZXhcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFNldD59IHRoZSB0eCBzZXQgY29udGFpbmluZyBzdHJ1Y3R1cmVkIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgZGVzY3JpYmVNdWx0aXNpZ1R4U2V0KG11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICByZXR1cm4gdGhpcy5kZXNjcmliZVR4U2V0KG5ldyBNb25lcm9UeFNldCgpLnNldE11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleCkpO1xuICB9XG4gIFxuICAvKipcbiAgICogRGVzY3JpYmUgYSB0eCBzZXQgY29udGFpbmluZyB1bnNpZ25lZCBvciBtdWx0aXNpZyB0eCBoZXggdG8gYSBuZXcgdHggc2V0IGNvbnRhaW5pbmcgc3RydWN0dXJlZCB0cmFuc2FjdGlvbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4U2V0fSB0eFNldCAtIGEgdHggc2V0IGNvbnRhaW5pbmcgdW5zaWduZWQgb3IgbXVsdGlzaWcgdHggaGV4XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhTZXQ+fSB0eFNldCAtIHRoZSB0eCBzZXQgY29udGFpbmluZyBzdHJ1Y3R1cmVkIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgZGVzY3JpYmVUeFNldCh0eFNldDogTW9uZXJvVHhTZXQpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNpZ24gdW5zaWduZWQgdHJhbnNhY3Rpb25zIGZyb20gYSB2aWV3LW9ubHkgd2FsbGV0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVuc2lnbmVkVHhIZXggLSB1bnNpZ25lZCB0cmFuc2FjdGlvbiBoZXggZnJvbSB3aGVuIHRoZSB0cmFuc2FjdGlvbnMgd2VyZSBjcmVhdGVkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhTZXQ+fSB0aGUgc2lnbmVkIHRyYW5zYWN0aW9uIHNldFxuICAgKi9cbiAgYXN5bmMgc2lnblR4cyh1bnNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN1Ym1pdCBzaWduZWQgdHJhbnNhY3Rpb25zIGZyb20gYSB2aWV3LW9ubHkgd2FsbGV0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNpZ25lZFR4SGV4IC0gc2lnbmVkIHRyYW5zYWN0aW9uIGhleCBmcm9tIHNpZ25UeHMoKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZ1tdPn0gdGhlIHJlc3VsdGluZyB0cmFuc2FjdGlvbiBoYXNoZXNcbiAgICovXG4gIGFzeW5jIHN1Ym1pdFR4cyhzaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTaWduIGEgbWVzc2FnZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIC0gdGhlIG1lc3NhZ2UgdG8gc2lnblxuICAgKiBAcGFyYW0ge01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlfSBbc2lnbmF0dXJlVHlwZV0gLSBzaWduIHdpdGggc3BlbmQga2V5IG9yIHZpZXcga2V5IChkZWZhdWx0IHNwZW5kIGtleSlcbiAgICogQHBhcmFtIHtudW1iZXJ9IFthY2NvdW50SWR4XSAtIHRoZSBhY2NvdW50IGluZGV4IG9mIHRoZSBtZXNzYWdlIHNpZ25hdHVyZSAoZGVmYXVsdCAwKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N1YmFkZHJlc3NJZHhdIC0gdGhlIHN1YmFkZHJlc3MgaW5kZXggb2YgdGhlIG1lc3NhZ2Ugc2lnbmF0dXJlIChkZWZhdWx0IDApXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHNpZ25hdHVyZVxuICAgKi9cbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBzaWduYXR1cmVUeXBlID0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgYWNjb3VudElkeCA9IDAsIHN1YmFkZHJlc3NJZHggPSAwKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogVmVyaWZ5IGEgc2lnbmF0dXJlIG9uIGEgbWVzc2FnZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIC0gc2lnbmVkIG1lc3NhZ2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBzaWduaW5nIGFkZHJlc3NcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNpZ25hdHVyZSAtIHNpZ25hdHVyZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQ+fSB0cnVlIGlmIHRoZSBzaWduYXR1cmUgaXMgZ29vZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyB2ZXJpZnlNZXNzYWdlKG1lc3NhZ2U6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSB0cmFuc2FjdGlvbidzIHNlY3JldCBrZXkgZnJvbSBpdHMgaGFzaC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSB0cmFuc2FjdGlvbidzIGhhc2hcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSAtIHRyYW5zYWN0aW9uJ3Mgc2VjcmV0IGtleVxuICAgKi9cbiAgYXN5bmMgZ2V0VHhLZXkodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDaGVjayBhIHRyYW5zYWN0aW9uIGluIHRoZSBibG9ja2NoYWluIHdpdGggaXRzIHNlY3JldCBrZXkuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gdHJhbnNhY3Rpb24gdG8gY2hlY2tcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4S2V5IC0gdHJhbnNhY3Rpb24ncyBzZWNyZXQga2V5XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gZGVzdGluYXRpb24gcHVibGljIGFkZHJlc3Mgb2YgdGhlIHRyYW5zYWN0aW9uXG4gICAqIEByZXR1cm4ge3JvbWlzZTxNb25lcm9DaGVja1R4Pn0gdGhlIHJlc3VsdCBvZiB0aGUgY2hlY2tcbiAgICovXG4gIGFzeW5jIGNoZWNrVHhLZXkodHhIYXNoOiBzdHJpbmcsIHR4S2V5OiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSB0cmFuc2FjdGlvbiBzaWduYXR1cmUgdG8gcHJvdmUgaXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gdHJhbnNhY3Rpb24gdG8gcHJvdmVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBkZXN0aW5hdGlvbiBwdWJsaWMgYWRkcmVzcyBvZiB0aGUgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtzdHJpbmd9IFttZXNzYWdlXSAtIG1lc3NhZ2UgdG8gaW5jbHVkZSB3aXRoIHRoZSBzaWduYXR1cmUgdG8gZnVydGhlciBhdXRoZW50aWNhdGUgdGhlIHByb29mIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgdHJhbnNhY3Rpb24gc2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBnZXRUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBQcm92ZSBhIHRyYW5zYWN0aW9uIGJ5IGNoZWNraW5nIGl0cyBzaWduYXR1cmUuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gdHJhbnNhY3Rpb24gdG8gcHJvdmVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBkZXN0aW5hdGlvbiBwdWJsaWMgYWRkcmVzcyBvZiB0aGUgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtzdHJpbmcgfCB1bmRlZmluZWR9IG1lc3NhZ2UgLSBtZXNzYWdlIGluY2x1ZGVkIHdpdGggdGhlIHNpZ25hdHVyZSB0byBmdXJ0aGVyIGF1dGhlbnRpY2F0ZSB0aGUgcHJvb2ZcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNpZ25hdHVyZSAgLSB0cmFuc2FjdGlvbiBzaWduYXR1cmUgdG8gY29uZmlybVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0NoZWNrVHg+fSB0aGUgcmVzdWx0IG9mIHRoZSBjaGVja1xuICAgKi9cbiAgYXN5bmMgY2hlY2tUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2VuZXJhdGUgYSBzaWduYXR1cmUgdG8gcHJvdmUgYSBzcGVuZC4gVW5saWtlIHByb3ZpbmcgYSB0cmFuc2FjdGlvbiwgaXQgZG9lcyBub3QgcmVxdWlyZSB0aGUgZGVzdGluYXRpb24gcHVibGljIGFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gdHJhbnNhY3Rpb24gdG8gcHJvdmVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFttZXNzYWdlXSAtIG1lc3NhZ2UgdG8gaW5jbHVkZSB3aXRoIHRoZSBzaWduYXR1cmUgdG8gZnVydGhlciBhdXRoZW50aWNhdGUgdGhlIHByb29mIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgdHJhbnNhY3Rpb24gc2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBnZXRTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogUHJvdmUgYSBzcGVuZCB1c2luZyBhIHNpZ25hdHVyZS4gVW5saWtlIHByb3ZpbmcgYSB0cmFuc2FjdGlvbiwgaXQgZG9lcyBub3QgcmVxdWlyZSB0aGUgZGVzdGluYXRpb24gcHVibGljIGFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gdHJhbnNhY3Rpb24gdG8gcHJvdmVcbiAgICogQHBhcmFtIHtzdHJpbmcgfCB1bmRlZmluZWR9IG1lc3NhZ2UgLSBtZXNzYWdlIGluY2x1ZGVkIHdpdGggdGhlIHNpZ25hdHVyZSB0byBmdXJ0aGVyIGF1dGhlbnRpY2F0ZSB0aGUgcHJvb2YgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2lnbmF0dXJlIC0gdHJhbnNhY3Rpb24gc2lnbmF0dXJlIHRvIGNvbmZpcm1cbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgc2lnbmF0dXJlIGlzIGdvb2QsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgY2hlY2tTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdlbmVyYXRlIGEgc2lnbmF0dXJlIHRvIHByb3ZlIHRoZSBlbnRpcmUgYmFsYW5jZSBvZiB0aGUgd2FsbGV0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IFttZXNzYWdlXSAtIG1lc3NhZ2UgaW5jbHVkZWQgd2l0aCB0aGUgc2lnbmF0dXJlIHRvIGZ1cnRoZXIgYXV0aGVudGljYXRlIHRoZSBwcm9vZiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHJlc2VydmUgcHJvb2Ygc2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdlbmVyYXRlIGEgc2lnbmF0dXJlIHRvIHByb3ZlIGFuIGF2YWlsYWJsZSBhbW91bnQgaW4gYW4gYWNjb3VudC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gYWNjb3VudCB0byBwcm92ZSBvd25lcnNoaXAgb2YgdGhlIGFtb3VudFxuICAgKiBAcGFyYW0ge2JpZ2ludH0gYW1vdW50IC0gbWluaW11bSBhbW91bnQgdG8gcHJvdmUgYXMgYXZhaWxhYmxlIGluIHRoZSBhY2NvdW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbWVzc2FnZV0gLSBtZXNzYWdlIHRvIGluY2x1ZGUgd2l0aCB0aGUgc2lnbmF0dXJlIHRvIGZ1cnRoZXIgYXV0aGVudGljYXRlIHRoZSBwcm9vZiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHJlc2VydmUgcHJvb2Ygc2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgYW1vdW50OiBiaWdpbnQsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogUHJvdmVzIGEgd2FsbGV0IGhhcyBhIGRpc3Bvc2FibGUgcmVzZXJ2ZSB1c2luZyBhIHNpZ25hdHVyZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gcHVibGljIHdhbGxldCBhZGRyZXNzXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgdW5kZWZpbmVkfSBtZXNzYWdlIC0gbWVzc2FnZSBpbmNsdWRlZCB3aXRoIHRoZSBzaWduYXR1cmUgdG8gZnVydGhlciBhdXRoZW50aWNhdGUgdGhlIHByb29mIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNpZ25hdHVyZSAtIHJlc2VydmUgcHJvb2Ygc2lnbmF0dXJlIHRvIGNoZWNrXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQ2hlY2tSZXNlcnZlPn0gdGhlIHJlc3VsdCBvZiBjaGVja2luZyB0aGUgc2lnbmF0dXJlIHByb29mXG4gICAqL1xuICBhc3luYyBjaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrUmVzZXJ2ZT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSB0cmFuc2FjdGlvbiBub3RlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIHRyYW5zYWN0aW9uIHRvIGdldCB0aGUgbm90ZSBvZlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB0eCBub3RlXG4gICAqL1xuICBhc3luYyBnZXRUeE5vdGUodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRUeE5vdGVzKFt0eEhhc2hdKSlbMF07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgbm90ZXMgZm9yIG11bHRpcGxlIHRyYW5zYWN0aW9ucy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IHR4SGFzaGVzIC0gaGFzaGVzIG9mIHRoZSB0cmFuc2FjdGlvbnMgdG8gZ2V0IG5vdGVzIGZvclxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZ1tdPn0gbm90ZXMgZm9yIHRoZSB0cmFuc2FjdGlvbnNcbiAgICovXG4gIGFzeW5jIGdldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgYSBub3RlIGZvciBhIHNwZWNpZmljIHRyYW5zYWN0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIGhhc2ggb2YgdGhlIHRyYW5zYWN0aW9uIHRvIHNldCBhIG5vdGUgZm9yXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBub3RlIC0gdGhlIHRyYW5zYWN0aW9uIG5vdGVcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldFR4Tm90ZSh0eEhhc2g6IHN0cmluZywgbm90ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5zZXRUeE5vdGVzKFt0eEhhc2hdLCBbbm90ZV0pO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IG5vdGVzIGZvciBtdWx0aXBsZSB0cmFuc2FjdGlvbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSB0eEhhc2hlcyAtIHRyYW5zYWN0aW9ucyB0byBzZXQgbm90ZXMgZm9yXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IG5vdGVzIC0gbm90ZXMgdG8gc2V0IGZvciB0aGUgdHJhbnNhY3Rpb25zXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSwgbm90ZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhZGRyZXNzIGJvb2sgZW50cmllcy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyW119IFtlbnRyeUluZGljZXNdIC0gaW5kaWNlcyBvZiB0aGUgZW50cmllcyB0byBnZXRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9BZGRyZXNzQm9va0VudHJ5W10+fSB0aGUgYWRkcmVzcyBib29rIGVudHJpZXNcbiAgICovXG4gIGFzeW5jIGdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXM/OiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEFkZCBhbiBhZGRyZXNzIGJvb2sgZW50cnkuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIGVudHJ5IGFkZHJlc3NcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtkZXNjcmlwdGlvbl0gLSBlbnRyeSBkZXNjcmlwdGlvbiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIGluZGV4IG9mIHRoZSBhZGRlZCBlbnRyeVxuICAgKi9cbiAgYXN5bmMgYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzOiBzdHJpbmcsIGRlc2NyaXB0aW9uPzogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRWRpdCBhbiBhZGRyZXNzIGJvb2sgZW50cnkuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggLSBpbmRleCBvZiB0aGUgYWRkcmVzcyBib29rIGVudHJ5IHRvIGVkaXRcbiAgICogQHBhcmFtIHtib29sZWFufSBzZXRBZGRyZXNzIC0gc3BlY2lmaWVzIGlmIHRoZSBhZGRyZXNzIHNob3VsZCBiZSB1cGRhdGVkXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgdW5kZWZpbmVkfSBhZGRyZXNzIC0gdXBkYXRlZCBhZGRyZXNzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2V0RGVzY3JpcHRpb24gLSBzcGVjaWZpZXMgaWYgdGhlIGRlc2NyaXB0aW9uIHNob3VsZCBiZSB1cGRhdGVkXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgdW5kZWZpbmVkfSBkZXNjcmlwdGlvbiAtIHVwZGF0ZWQgZGVzY3JpcHRpb25cbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIGVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4OiBudW1iZXIsIHNldEFkZHJlc3M6IGJvb2xlYW4sIGFkZHJlc3M6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2V0RGVzY3JpcHRpb246IGJvb2xlYW4sIGRlc2NyaXB0aW9uOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRGVsZXRlIGFuIGFkZHJlc3MgYm9vayBlbnRyeS5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBlbnRyeUlkeCAtIGluZGV4IG9mIHRoZSBlbnRyeSB0byBkZWxldGVcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIGRlbGV0ZUFkZHJlc3NCb29rRW50cnkoZW50cnlJZHg6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBUYWcgYWNjb3VudHMuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIC0gdGFnIHRvIGFwcGx5IHRvIHRoZSBzcGVjaWZpZWQgYWNjb3VudHNcbiAgICogQHBhcmFtIHtudW1iZXJbXX0gYWNjb3VudEluZGljZXMgLSBpbmRpY2VzIG9mIHRoZSBhY2NvdW50cyB0byB0YWdcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHRhZ0FjY291bnRzKHRhZzogc3RyaW5nLCBhY2NvdW50SW5kaWNlczogbnVtYmVyW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVudGFnIGFjY291bnRzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJbXX0gYWNjb3VudEluZGljZXMgLSBpbmRpY2VzIG9mIHRoZSBhY2NvdW50cyB0byB1bnRhZ1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgdW50YWdBY2NvdW50cyhhY2NvdW50SW5kaWNlczogbnVtYmVyW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogUmV0dXJuIGFsbCBhY2NvdW50IHRhZ3MuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0FjY291bnRUYWdbXT59IHRoZSB3YWxsZXQncyBhY2NvdW50IHRhZ3NcbiAgICovXG4gIGFzeW5jIGdldEFjY291bnRUYWdzKCk6IFByb21pc2U8TW9uZXJvQWNjb3VudFRhZ1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgaHVtYW4tcmVhZGFibGUgZGVzY3JpcHRpb24gZm9yIGEgdGFnLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyAtIHRhZyB0byBzZXQgYSBkZXNjcmlwdGlvbiBmb3JcbiAgICogQHBhcmFtIHtzdHJpbmd9IGxhYmVsIC0gbGFiZWwgdG8gc2V0IGZvciB0aGUgdGFnXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRBY2NvdW50VGFnTGFiZWwodGFnOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ3JlYXRlcyBhIHBheW1lbnQgVVJJIGZyb20gYSBzZW5kIGNvbmZpZ3VyYXRpb24uXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4Q29uZmlnfSBjb25maWcgLSBzcGVjaWZpZXMgY29uZmlndXJhdGlvbiBmb3IgYSBwb3RlbnRpYWwgdHhcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgcGF5bWVudCB1cmlcbiAgICovXG4gIGFzeW5jIGdldFBheW1lbnRVcmkoY29uZmlnOiBNb25lcm9UeENvbmZpZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFBhcnNlcyBhIHBheW1lbnQgVVJJIHRvIGEgdHggY29uZmlnLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVyaSAtIHBheW1lbnQgdXJpIHRvIHBhcnNlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhDb25maWc+fSB0aGUgc2VuZCBjb25maWd1cmF0aW9uIHBhcnNlZCBmcm9tIHRoZSB1cmlcbiAgICovXG4gIGFzeW5jIHBhcnNlUGF5bWVudFVyaSh1cmk6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhDb25maWc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGFuIGF0dHJpYnV0ZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSBhdHRyaWJ1dGUgdG8gZ2V0IHRoZSB2YWx1ZSBvZlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSBhdHRyaWJ1dGUncyB2YWx1ZVxuICAgKi9cbiAgYXN5bmMgZ2V0QXR0cmlidXRlKGtleTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IGFuIGFyYml0cmFyeSBhdHRyaWJ1dGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IC0gYXR0cmlidXRlIGtleVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsIC0gYXR0cmlidXRlIHZhbHVlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcsIHZhbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0YXJ0IG1pbmluZy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbbnVtVGhyZWFkc10gLSBudW1iZXIgb2YgdGhyZWFkcyBjcmVhdGVkIGZvciBtaW5pbmcgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtiYWNrZ3JvdW5kTWluaW5nXSAtIHNwZWNpZmllcyBpZiBtaW5pbmcgc2hvdWxkIG9jY3VyIGluIHRoZSBiYWNrZ3JvdW5kIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbaWdub3JlQmF0dGVyeV0gLSBzcGVjaWZpZXMgaWYgdGhlIGJhdHRlcnkgc2hvdWxkIGJlIGlnbm9yZWQgZm9yIG1pbmluZyAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzdGFydE1pbmluZyhudW1UaHJlYWRzOiBudW1iZXIsIGJhY2tncm91bmRNaW5pbmc/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdG9wIG1pbmluZy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzdG9wTWluaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgaW1wb3J0aW5nIG11bHRpc2lnIGRhdGEgaXMgbmVlZGVkIGZvciByZXR1cm5pbmcgYSBjb3JyZWN0IGJhbGFuY2UuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIGltcG9ydGluZyBtdWx0aXNpZyBkYXRhIGlzIG5lZWRlZCBmb3IgcmV0dXJuaW5nIGEgY29ycmVjdCBiYWxhbmNlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGlzIHdhbGxldCBpcyBhIG11bHRpc2lnIHdhbGxldC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhpcyBpcyBhIG11bHRpc2lnIHdhbGxldCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBpc011bHRpc2lnKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRNdWx0aXNpZ0luZm8oKSkuZ2V0SXNNdWx0aXNpZygpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IG11bHRpc2lnIGluZm8gYWJvdXQgdGhpcyB3YWxsZXQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb011bHRpc2lnSW5mbz59IG11bHRpc2lnIGluZm8gYWJvdXQgdGhpcyB3YWxsZXRcbiAgICovXG4gIGFzeW5jIGdldE11bHRpc2lnSW5mbygpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnSW5mbz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgbXVsdGlzaWcgaW5mbyBhcyBoZXggdG8gc2hhcmUgd2l0aCBwYXJ0aWNpcGFudHMgdG8gYmVnaW4gY3JlYXRpbmcgYVxuICAgKiBtdWx0aXNpZyB3YWxsZXQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoaXMgd2FsbGV0J3MgbXVsdGlzaWcgaGV4IHRvIHNoYXJlIHdpdGggcGFydGljaXBhbnRzXG4gICAqL1xuICBhc3luYyBwcmVwYXJlTXVsdGlzaWcoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogTWFrZSB0aGlzIHdhbGxldCBtdWx0aXNpZyBieSBpbXBvcnRpbmcgbXVsdGlzaWcgaGV4IGZyb20gcGFydGljaXBhbnRzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gbXVsdGlzaWdIZXhlcyAtIG11bHRpc2lnIGhleCBmcm9tIGVhY2ggcGFydGljaXBhbnRcbiAgICogQHBhcmFtIHtudW1iZXJ9IHRocmVzaG9sZCAtIG51bWJlciBvZiBzaWduYXR1cmVzIG5lZWRlZCB0byBzaWduIHRyYW5zZmVyc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gcGFzc3dvcmQgLSB3YWxsZXQgcGFzc3dvcmRcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGlzIHdhbGxldCdzIG11bHRpc2lnIGhleCB0byBzaGFyZSB3aXRoIHBhcnRpY2lwYW50c1xuICAgKi9cbiAgYXN5bmMgbWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCB0aHJlc2hvbGQ6IG51bWJlciwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEV4Y2hhbmdlIG11bHRpc2lnIGhleCB3aXRoIHBhcnRpY2lwYW50cyBpbiBhIE0vTiBtdWx0aXNpZyB3YWxsZXQuXG4gICAqIFxuICAgKiBUaGlzIHByb2Nlc3MgbXVzdCBiZSByZXBlYXRlZCB3aXRoIHBhcnRpY2lwYW50cyBleGFjdGx5IE4tTSB0aW1lcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IG11bHRpc2lnSGV4ZXMgYXJlIG11bHRpc2lnIGhleCBmcm9tIGVhY2ggcGFydGljaXBhbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhc3N3b3JkIC0gd2FsbGV0J3MgcGFzc3dvcmQgLy8gVE9ETyBtb25lcm8tcHJvamVjdDogcmVkdW5kYW50PyB3YWxsZXQgaXMgY3JlYXRlZCB3aXRoIHBhc3N3b3JkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0Pn0gdGhlIHJlc3VsdCB3aGljaCBoYXMgdGhlIG11bHRpc2lnJ3MgYWRkcmVzcyB4b3IgdGhpcyB3YWxsZXQncyBtdWx0aXNpZyBoZXggdG8gc2hhcmUgd2l0aCBwYXJ0aWNpcGFudHMgaWZmIG5vdCBkb25lXG4gICAqL1xuICBhc3luYyBleGNoYW5nZU11bHRpc2lnS2V5cyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEV4cG9ydCB0aGlzIHdhbGxldCdzIG11bHRpc2lnIGluZm8gYXMgaGV4IGZvciBvdGhlciBwYXJ0aWNpcGFudHMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoaXMgd2FsbGV0J3MgbXVsdGlzaWcgaW5mbyBhcyBoZXggZm9yIG90aGVyIHBhcnRpY2lwYW50c1xuICAgKi9cbiAgYXN5bmMgZXhwb3J0TXVsdGlzaWdIZXgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogSW1wb3J0IG11bHRpc2lnIGluZm8gYXMgaGV4IGZyb20gb3RoZXIgcGFydGljaXBhbnRzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gbXVsdGlzaWdIZXhlcyAtIG11bHRpc2lnIGhleCBmcm9tIGVhY2ggcGFydGljaXBhbnRcbiAgICogQHBhcmFtIHtib29sZWFufSBbcmVmcmVzaEFmdGVySW1wb3J0XSAtIHNwZWNpZmllcyBpZiB0aGUgd2FsbGV0IHNob3VsZCBiZSByZWZyZXNoZWQgYWZ0ZXIgaW1wb3J0aW5nIG11bHRpc2lnIGhleCAoZGVmYXVsdCB0cnVlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBudW1iZXIgb2Ygb3V0cHV0cyBzaWduZWQgd2l0aCB0aGUgZ2l2ZW4gbXVsdGlzaWcgaGV4XG4gICAqL1xuICBhc3luYyBpbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgcmVmcmVzaEFmdGVySW1wb3J0PzogYm9vbGVhbik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNpZ24gbXVsdGlzaWcgdHJhbnNhY3Rpb25zIGZyb20gYSBtdWx0aXNpZyB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbXVsdGlzaWdUeEhleCAtIHVuc2lnbmVkIG11bHRpc2lnIHRyYW5zYWN0aW9ucyBhcyBoZXhcbiAgICogQHJldHVybiB7TW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0fSB0aGUgcmVzdWx0IG9mIHNpZ25pbmcgdGhlIG11bHRpc2lnIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3VibWl0IHNpZ25lZCBtdWx0aXNpZyB0cmFuc2FjdGlvbnMgZnJvbSBhIG11bHRpc2lnIHdhbGxldC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzaWduZWRNdWx0aXNpZ1R4SGV4IC0gc2lnbmVkIG11bHRpc2lnIGhleCByZXR1cm5lZCBmcm9tIHNpZ25NdWx0aXNpZ1R4SGV4KClcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmdbXT59IHRoZSByZXN1bHRpbmcgdHJhbnNhY3Rpb24gaGFzaGVzXG4gICAqL1xuICBhc3luYyBzdWJtaXRNdWx0aXNpZ1R4SGV4KHNpZ25lZE11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ2hhbmdlIHRoZSB3YWxsZXQgcGFzc3dvcmQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gb2xkUGFzc3dvcmQgLSB0aGUgd2FsbGV0J3Mgb2xkIHBhc3N3b3JkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdQYXNzd29yZCAtIHRoZSB3YWxsZXQncyBuZXcgcGFzc3dvcmRcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIGNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkOiBzdHJpbmcsIG5ld1Bhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2F2ZSB0aGUgd2FsbGV0IGF0IGl0cyBjdXJyZW50IHBhdGguXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2F2ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogT3B0aW9uYWxseSBzYXZlIHRoZW4gY2xvc2UgdGhlIHdhbGxldC5cbiAgICpcbiAgICogQHBhcmFtIHtib29sZWFufSBbc2F2ZV0gLSBzcGVjaWZpZXMgaWYgdGhlIHdhbGxldCBzaG91bGQgYmUgc2F2ZWQgYmVmb3JlIGJlaW5nIGNsb3NlZCAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIGNsb3NlKHNhdmUgPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyKSB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyLnJlbW92ZUxpc3RlbmVyKHRoaXMuY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcik7XG4gICAgdGhpcy5jb25uZWN0aW9uTWFuYWdlciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5saXN0ZW5lcnMuc3BsaWNlKDAsIHRoaXMubGlzdGVuZXJzLmxlbmd0aCk7XG4gICAgdGhpcy5faXNDbG9zZWQgPSB0cnVlO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoaXMgd2FsbGV0IGlzIGNsb3NlZCBvciBub3QuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSB3YWxsZXQgaXMgY2xvc2VkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzQ2xvc2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiB0aGlzLl9pc0Nsb3NlZDtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGFzeW5jIGFubm91bmNlU3luY1Byb2dyZXNzKGhlaWdodDogbnVtYmVyLCBzdGFydEhlaWdodDogbnVtYmVyLCBlbmRIZWlnaHQ6IG51bWJlciwgcGVyY2VudERvbmU6IG51bWJlciwgbWVzc2FnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGxpc3RlbmVyLm9uU3luY1Byb2dyZXNzKGhlaWdodCwgc3RhcnRIZWlnaHQsIGVuZEhlaWdodCwgcGVyY2VudERvbmUsIG1lc3NhZ2UpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBjYWxsaW5nIGxpc3RlbmVyIG9uIHN5bmMgcHJvZ3Jlc3NcIiwgZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGFzeW5jIGFubm91bmNlTmV3QmxvY2soaGVpZ2h0OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgbGlzdGVuZXIub25OZXdCbG9jayhoZWlnaHQpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBjYWxsaW5nIGxpc3RlbmVyIG9uIG5ldyBibG9ja1wiLCBlcnIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgYXN5bmMgYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQobmV3QmFsYW5jZTogYmlnaW50LCBuZXdVbmxvY2tlZEJhbGFuY2U6IGJpZ2ludCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBsaXN0ZW5lci5vbkJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlLCBuZXdVbmxvY2tlZEJhbGFuY2UpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBjYWxsaW5nIGxpc3RlbmVyIG9uIGJhbGFuY2VzIGNoYW5nZWRcIiwgZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGFzeW5jIGFubm91bmNlT3V0cHV0UmVjZWl2ZWQob3V0cHV0OiBNb25lcm9PdXRwdXRXYWxsZXQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgbGlzdGVuZXIub25PdXRwdXRSZWNlaXZlZChvdXRwdXQpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBjYWxsaW5nIGxpc3RlbmVyIG9uIG91dHB1dCByZWNlaXZlZFwiLCBlcnIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgYXN5bmMgYW5ub3VuY2VPdXRwdXRTcGVudChvdXRwdXQ6IE1vbmVyb091dHB1dFdhbGxldCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBsaXN0ZW5lci5vbk91dHB1dFNwZW50KG91dHB1dCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNhbGxpbmcgbGlzdGVuZXIgb24gb3V0cHV0IHNwZW50XCIsIGVycik7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZVR4UXVlcnkocXVlcnkpOiBNb25lcm9UeFF1ZXJ5IHtcbiAgICBpZiAocXVlcnkgaW5zdGFuY2VvZiBNb25lcm9UeFF1ZXJ5KSBxdWVyeSA9IHF1ZXJ5LmNvcHkoKTtcbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KHF1ZXJ5KSkgcXVlcnkgPSBuZXcgTW9uZXJvVHhRdWVyeSgpLnNldEhhc2hlcyhxdWVyeSk7XG4gICAgZWxzZSB7XG4gICAgICBxdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5KTtcbiAgICAgIHF1ZXJ5ID0gbmV3IE1vbmVyb1R4UXVlcnkocXVlcnkpO1xuICAgIH1cbiAgICBpZiAocXVlcnkuZ2V0QmxvY2soKSA9PT0gdW5kZWZpbmVkKSBxdWVyeS5zZXRCbG9jayhuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW3F1ZXJ5XSkpO1xuICAgIGlmIChxdWVyeS5nZXRJbnB1dFF1ZXJ5KCkpIHF1ZXJ5LmdldElucHV0UXVlcnkoKS5zZXRUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnkuZ2V0T3V0cHV0UXVlcnkoKSkgcXVlcnkuZ2V0T3V0cHV0UXVlcnkoKS5zZXRUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICByZXR1cm4gcXVlcnk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgbm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSk6IE1vbmVyb1RyYW5zZmVyUXVlcnkge1xuICAgIHF1ZXJ5ID0gbmV3IE1vbmVyb1RyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHR4UXVlcnkgPSBxdWVyeS5nZXRUeFF1ZXJ5KCkuY29weSgpO1xuICAgICAgcXVlcnkgPSB0eFF1ZXJ5LmdldFRyYW5zZmVyUXVlcnkoKTtcbiAgICB9XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKSA9PT0gdW5kZWZpbmVkKSBxdWVyeS5zZXRUeFF1ZXJ5KG5ldyBNb25lcm9UeFF1ZXJ5KCkpO1xuICAgIHF1ZXJ5LmdldFR4UXVlcnkoKS5zZXRUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkgPT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0VHhRdWVyeSgpLnNldEJsb2NrKG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbcXVlcnkuZ2V0VHhRdWVyeSgpXSkpO1xuICAgIHJldHVybiBxdWVyeTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVPdXRwdXRRdWVyeShxdWVyeSk6IE1vbmVyb091dHB1dFF1ZXJ5IHtcbiAgICBxdWVyeSA9IG5ldyBNb25lcm9PdXRwdXRRdWVyeShxdWVyeSk7XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgdHhRdWVyeSA9IHF1ZXJ5LmdldFR4UXVlcnkoKS5jb3B5KCk7XG4gICAgICBxdWVyeSA9IHR4UXVlcnkuZ2V0T3V0cHV0UXVlcnkoKTtcbiAgICB9XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKSA9PT0gdW5kZWZpbmVkKSBxdWVyeS5zZXRUeFF1ZXJ5KG5ldyBNb25lcm9UeFF1ZXJ5KCkpO1xuICAgIHF1ZXJ5LmdldFR4UXVlcnkoKS5zZXRPdXRwdXRRdWVyeShxdWVyeSk7XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRCbG9jaygpID09PSB1bmRlZmluZWQpIHF1ZXJ5LmdldFR4UXVlcnkoKS5zZXRCbG9jayhuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW3F1ZXJ5LmdldFR4UXVlcnkoKV0pKTtcbiAgICByZXR1cm4gcXVlcnk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgbm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk6IE1vbmVyb1R4Q29uZmlnIHtcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQgfHwgIShjb25maWcgaW5zdGFuY2VvZiBPYmplY3QpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgTW9uZXJvVHhDb25maWcgb3IgZXF1aXZhbGVudCBKUyBvYmplY3RcIik7XG4gICAgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gICAgYXNzZXJ0KGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKSAmJiBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoID4gMCwgXCJNdXN0IHByb3ZpZGUgZGVzdGluYXRpb25zXCIpO1xuICAgIGFzc2VydC5lcXVhbChjb25maWcuZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcygpLCB1bmRlZmluZWQpO1xuICAgIGFzc2VydC5lcXVhbChjb25maWcuZ2V0QmVsb3dBbW91bnQoKSwgdW5kZWZpbmVkKTtcbiAgICByZXR1cm4gY29uZmlnO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnKGNvbmZpZyk6IE1vbmVyb1R4Q29uZmlnIHtcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQgfHwgIShjb25maWcgaW5zdGFuY2VvZiBPYmplY3QpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgTW9uZXJvVHhDb25maWcgb3IgZXF1aXZhbGVudCBKUyBvYmplY3RcIik7XG4gICAgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbmZpZy5nZXRTd2VlcEVhY2hTdWJhZGRyZXNzKCksIHVuZGVmaW5lZCk7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbmZpZy5nZXRCZWxvd0Ftb3VudCgpLCB1bmRlZmluZWQpO1xuICAgIGFzc2VydC5lcXVhbChjb25maWcuZ2V0Q2FuU3BsaXQoKSwgdW5kZWZpbmVkLCBcIkNhbm5vdCBzcGxpdCB0cmFuc2FjdGlvbnMgd2hlbiBzd2VlcGluZyBhbiBvdXRwdXRcIik7XG4gICAgaWYgKCFjb25maWcuZ2V0RGVzdGluYXRpb25zKCkgfHwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCAhPT0gMSB8fCAhY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGV4YWN0bHkgb25lIGRlc3RpbmF0aW9uIGFkZHJlc3MgdG8gc3dlZXAgb3V0cHV0IHRvXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkgJiYgY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpLmxlbmd0aCA+IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN3ZWVwIHRyYW5zYWN0aW9ucyBkbyBub3Qgc3VwcG9ydCBzdWJ0cmFjdGluZyBmZWVzIGZyb20gZGVzdGluYXRpb25zXCIpO1xuICAgIHJldHVybiBjb25maWc7ICBcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnKGNvbmZpZyk6IE1vbmVyb1R4Q29uZmlnIHtcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQgfHwgIShjb25maWcgaW5zdGFuY2VvZiBPYmplY3QpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgTW9uZXJvVHhDb25maWcgb3IgZXF1aXZhbGVudCBKUyBvYmplY3RcIik7XG4gICAgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGggIT0gMSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGV4YWN0bHkgb25lIGRlc3RpbmF0aW9uIHRvIHN3ZWVwIHRvXCIpO1xuICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBkZXN0aW5hdGlvbiBhZGRyZXNzIHRvIHN3ZWVwIHRvXCIpO1xuICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QW1vdW50KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgYW1vdW50IGluIHN3ZWVwIGNvbmZpZ1wiKTtcbiAgICBpZiAoY29uZmlnLmdldEtleUltYWdlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiS2V5IGltYWdlIGRlZmluZWQ7IHVzZSBzd2VlcE91dHB1dCgpIHRvIHN3ZWVwIGFuIG91dHB1dCBieSBpdHMga2V5IGltYWdlXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkICYmIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMCkgY29uZmlnLnNldFN1YmFkZHJlc3NJbmRpY2VzKHVuZGVmaW5lZCk7XG4gICAgaWYgKGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKSA9PT0gdW5kZWZpbmVkICYmIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBhY2NvdW50IGluZGV4IGlmIHN1YmFkZHJlc3MgaW5kaWNlcyBhcmUgcHJvdmlkZWRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJ0cmFjdEZlZUZyb20oKSAmJiBjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkubGVuZ3RoID4gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3dlZXAgdHJhbnNhY3Rpb25zIGRvIG5vdCBzdXBwb3J0IHN1YnRyYWN0aW5nIGZlZXMgZnJvbSBkZXN0aW5hdGlvbnNcIik7XG4gICAgcmV0dXJuIGNvbmZpZztcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsT0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBOzs7OztBQUtBLElBQUFDLFlBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTs7OztBQUlBLElBQUFFLGdDQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBRyxZQUFBLEdBQUFKLHNCQUFBLENBQUFDLE9BQUE7Ozs7Ozs7QUFPQSxJQUFBSSwyQkFBQSxHQUFBTCxzQkFBQSxDQUFBQyxPQUFBOzs7O0FBSUEsSUFBQUssa0JBQUEsR0FBQU4sc0JBQUEsQ0FBQUMsT0FBQTs7Ozs7OztBQU9BLElBQUFNLG9CQUFBLEdBQUFQLHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFBTyxlQUFBLEdBQUFSLHNCQUFBLENBQUFDLE9BQUE7O0FBRUEsSUFBQVEsY0FBQSxHQUFBVCxzQkFBQSxDQUFBQyxPQUFBOztBQUVBLElBQUFTLFlBQUEsR0FBQVYsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFVLFlBQUEsR0FBQVgsc0JBQUEsQ0FBQUMsT0FBQTs7QUFFQSxJQUFBVyxxQkFBQSxHQUFBWixzQkFBQSxDQUFBQyxPQUFBOztBQUVB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