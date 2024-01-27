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
   * Get the number of blocks until the next and last funds unlock.
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
        let numBlocksToUnlock = Math.max((tx.getIsConfirmed() ? tx.getHeight() : height) + 10, tx.getUnlockTime()) - height;
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
        let numBlocksToUnlock = Math.max((tx.getIsConfirmed() ? tx.getHeight() : height) + 10, tx.getUnlockTime()) - height;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIl9Nb25lcm9PdXRwdXRRdWVyeSIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJNb25lcm9XYWxsZXQiLCJERUZBVUxUX0xBTkdVQUdFIiwibGlzdGVuZXJzIiwiX2lzQ2xvc2VkIiwiY29uc3RydWN0b3IiLCJhZGRMaXN0ZW5lciIsImxpc3RlbmVyIiwiYXNzZXJ0IiwiTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJwdXNoIiwicmVtb3ZlTGlzdGVuZXIiLCJpZHgiLCJpbmRleE9mIiwic3BsaWNlIiwiTW9uZXJvRXJyb3IiLCJnZXRMaXN0ZW5lcnMiLCJpc1ZpZXdPbmx5Iiwic2V0RGFlbW9uQ29ubmVjdGlvbiIsInVyaU9yQ29ubmVjdGlvbiIsImdldERhZW1vbkNvbm5lY3Rpb24iLCJzZXRDb25uZWN0aW9uTWFuYWdlciIsImNvbm5lY3Rpb25NYW5hZ2VyIiwiY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciIsInRoYXQiLCJNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyIiwib25Db25uZWN0aW9uQ2hhbmdlZCIsImNvbm5lY3Rpb24iLCJnZXRDb25uZWN0aW9uIiwiZ2V0Q29ubmVjdGlvbk1hbmFnZXIiLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiZ2V0VmVyc2lvbiIsImdldFBhdGgiLCJnZXRTZWVkIiwiZ2V0U2VlZExhbmd1YWdlIiwiZ2V0UHJpdmF0ZVZpZXdLZXkiLCJnZXRQcml2YXRlU3BlbmRLZXkiLCJnZXRQdWJsaWNWaWV3S2V5IiwiZ2V0UHVibGljU3BlbmRLZXkiLCJnZXRQcmltYXJ5QWRkcmVzcyIsImdldEFkZHJlc3MiLCJhY2NvdW50SWR4Iiwic3ViYWRkcmVzc0lkeCIsImdldEFkZHJlc3NJbmRleCIsImFkZHJlc3MiLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsInN0YW5kYXJkQWRkcmVzcyIsInBheW1lbnRJZCIsImRlY29kZUludGVncmF0ZWRBZGRyZXNzIiwiaW50ZWdyYXRlZEFkZHJlc3MiLCJnZXRIZWlnaHQiLCJnZXREYWVtb25IZWlnaHQiLCJnZXRIZWlnaHRCeURhdGUiLCJ5ZWFyIiwibW9udGgiLCJkYXkiLCJzeW5jIiwibGlzdGVuZXJPclN0YXJ0SGVpZ2h0Iiwic3RhcnRIZWlnaHQiLCJzdGFydFN5bmNpbmciLCJzeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwicmVzY2FuU3BlbnQiLCJyZXNjYW5CbG9ja2NoYWluIiwiZ2V0QmFsYW5jZSIsImdldFVubG9ja2VkQmFsYW5jZSIsImdldE51bUJsb2Nrc1RvVW5sb2NrIiwiYmFsYW5jZSIsInVuZGVmaW5lZCIsInVubG9ja2VkQmFsYW5jZSIsInR4cyIsImhlaWdodCIsIm51bUJsb2Nrc1RvTmV4dFVubG9jayIsImdldFR4cyIsImlzTG9ja2VkIiwidHgiLCJudW1CbG9ja3NUb1VubG9jayIsIk1hdGgiLCJtYXgiLCJnZXRJc0NvbmZpcm1lZCIsImdldFVubG9ja1RpbWUiLCJtaW4iLCJudW1CbG9ja3NUb0xhc3RVbmxvY2siLCJnZXRBY2NvdW50cyIsImluY2x1ZGVTdWJhZGRyZXNzZXMiLCJ0YWciLCJnZXRBY2NvdW50IiwiY3JlYXRlQWNjb3VudCIsImxhYmVsIiwic2V0QWNjb3VudExhYmVsIiwic2V0U3ViYWRkcmVzc0xhYmVsIiwiZ2V0U3ViYWRkcmVzc2VzIiwic3ViYWRkcmVzc0luZGljZXMiLCJnZXRTdWJhZGRyZXNzIiwiY3JlYXRlU3ViYWRkcmVzcyIsImdldFR4IiwidHhIYXNoIiwibGVuZ3RoIiwicXVlcnkiLCJnZXRUcmFuc2ZlcnMiLCJnZXRJbmNvbWluZ1RyYW5zZmVycyIsInF1ZXJ5Tm9ybWFsaXplZCIsIm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkiLCJnZXRJc0luY29taW5nIiwic2V0SXNJbmNvbWluZyIsImdldE91dGdvaW5nVHJhbnNmZXJzIiwiZ2V0SXNPdXRnb2luZyIsInNldElzT3V0Z29pbmciLCJnZXRPdXRwdXRzIiwiZXhwb3J0T3V0cHV0cyIsImFsbCIsImltcG9ydE91dHB1dHMiLCJvdXRwdXRzSGV4IiwiZXhwb3J0S2V5SW1hZ2VzIiwiaW1wb3J0S2V5SW1hZ2VzIiwia2V5SW1hZ2VzIiwiZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQiLCJmcmVlemVPdXRwdXQiLCJrZXlJbWFnZSIsInRoYXdPdXRwdXQiLCJpc091dHB1dEZyb3plbiIsImNyZWF0ZVR4IiwiY29uZmlnIiwiY29uZmlnTm9ybWFsaXplZCIsIm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyIsImdldENhblNwbGl0IiwiZXF1YWwiLCJzZXRDYW5TcGxpdCIsImNyZWF0ZVR4cyIsInN3ZWVwT3V0cHV0Iiwic3dlZXBVbmxvY2tlZCIsInN3ZWVwRHVzdCIsInJlbGF5IiwicmVsYXlUeCIsInR4T3JNZXRhZGF0YSIsInJlbGF5VHhzIiwidHhzT3JNZXRhZGF0YXMiLCJkZXNjcmliZVVuc2lnbmVkVHhTZXQiLCJ1bnNpZ25lZFR4SGV4IiwiZGVzY3JpYmVUeFNldCIsIk1vbmVyb1R4U2V0Iiwic2V0VW5zaWduZWRUeEhleCIsImRlc2NyaWJlTXVsdGlzaWdUeFNldCIsIm11bHRpc2lnVHhIZXgiLCJzZXRNdWx0aXNpZ1R4SGV4IiwidHhTZXQiLCJzaWduVHhzIiwic3VibWl0VHhzIiwic2lnbmVkVHhIZXgiLCJzaWduTWVzc2FnZSIsIm1lc3NhZ2UiLCJzaWduYXR1cmVUeXBlIiwiTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUiLCJTSUdOX1dJVEhfU1BFTkRfS0VZIiwidmVyaWZ5TWVzc2FnZSIsInNpZ25hdHVyZSIsImdldFR4S2V5IiwiY2hlY2tUeEtleSIsInR4S2V5IiwiZ2V0VHhQcm9vZiIsImNoZWNrVHhQcm9vZiIsImdldFNwZW5kUHJvb2YiLCJjaGVja1NwZW5kUHJvb2YiLCJnZXRSZXNlcnZlUHJvb2ZXYWxsZXQiLCJnZXRSZXNlcnZlUHJvb2ZBY2NvdW50IiwiYW1vdW50IiwiY2hlY2tSZXNlcnZlUHJvb2YiLCJnZXRUeE5vdGUiLCJnZXRUeE5vdGVzIiwic2V0VHhOb3RlIiwibm90ZSIsInNldFR4Tm90ZXMiLCJub3RlcyIsImdldEFkZHJlc3NCb29rRW50cmllcyIsImVudHJ5SW5kaWNlcyIsImFkZEFkZHJlc3NCb29rRW50cnkiLCJkZXNjcmlwdGlvbiIsImVkaXRBZGRyZXNzQm9va0VudHJ5IiwiaW5kZXgiLCJzZXRBZGRyZXNzIiwic2V0RGVzY3JpcHRpb24iLCJkZWxldGVBZGRyZXNzQm9va0VudHJ5IiwiZW50cnlJZHgiLCJ0YWdBY2NvdW50cyIsImFjY291bnRJbmRpY2VzIiwidW50YWdBY2NvdW50cyIsImdldEFjY291bnRUYWdzIiwic2V0QWNjb3VudFRhZ0xhYmVsIiwiZ2V0UGF5bWVudFVyaSIsInBhcnNlUGF5bWVudFVyaSIsInVyaSIsImdldEF0dHJpYnV0ZSIsImtleSIsInNldEF0dHJpYnV0ZSIsInZhbCIsInN0YXJ0TWluaW5nIiwibnVtVGhyZWFkcyIsImJhY2tncm91bmRNaW5pbmciLCJpZ25vcmVCYXR0ZXJ5Iiwic3RvcE1pbmluZyIsImlzTXVsdGlzaWdJbXBvcnROZWVkZWQiLCJpc011bHRpc2lnIiwiZ2V0TXVsdGlzaWdJbmZvIiwiZ2V0SXNNdWx0aXNpZyIsInByZXBhcmVNdWx0aXNpZyIsIm1ha2VNdWx0aXNpZyIsIm11bHRpc2lnSGV4ZXMiLCJ0aHJlc2hvbGQiLCJwYXNzd29yZCIsImV4Y2hhbmdlTXVsdGlzaWdLZXlzIiwiZXhwb3J0TXVsdGlzaWdIZXgiLCJpbXBvcnRNdWx0aXNpZ0hleCIsInNpZ25NdWx0aXNpZ1R4SGV4Iiwic3VibWl0TXVsdGlzaWdUeEhleCIsInNpZ25lZE11bHRpc2lnVHhIZXgiLCJjaGFuZ2VQYXNzd29yZCIsIm9sZFBhc3N3b3JkIiwibmV3UGFzc3dvcmQiLCJzYXZlIiwiY2xvc2UiLCJpc0Nsb3NlZCIsImFubm91bmNlU3luY1Byb2dyZXNzIiwiZW5kSGVpZ2h0IiwicGVyY2VudERvbmUiLCJvblN5bmNQcm9ncmVzcyIsImVyciIsImNvbnNvbGUiLCJlcnJvciIsImFubm91bmNlTmV3QmxvY2siLCJvbk5ld0Jsb2NrIiwiYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQiLCJuZXdCYWxhbmNlIiwibmV3VW5sb2NrZWRCYWxhbmNlIiwib25CYWxhbmNlc0NoYW5nZWQiLCJhbm5vdW5jZU91dHB1dFJlY2VpdmVkIiwib3V0cHV0Iiwib25PdXRwdXRSZWNlaXZlZCIsImFubm91bmNlT3V0cHV0U3BlbnQiLCJvbk91dHB1dFNwZW50Iiwibm9ybWFsaXplVHhRdWVyeSIsIk1vbmVyb1R4UXVlcnkiLCJjb3B5IiwiQXJyYXkiLCJpc0FycmF5Iiwic2V0SGFzaGVzIiwiT2JqZWN0IiwiYXNzaWduIiwiZ2V0QmxvY2siLCJzZXRCbG9jayIsIk1vbmVyb0Jsb2NrIiwic2V0VHhzIiwiZ2V0SW5wdXRRdWVyeSIsInNldFR4UXVlcnkiLCJnZXRPdXRwdXRRdWVyeSIsIk1vbmVyb1RyYW5zZmVyUXVlcnkiLCJnZXRUeFF1ZXJ5IiwidHhRdWVyeSIsImdldFRyYW5zZmVyUXVlcnkiLCJzZXRUcmFuc2ZlclF1ZXJ5Iiwibm9ybWFsaXplT3V0cHV0UXVlcnkiLCJNb25lcm9PdXRwdXRRdWVyeSIsInNldE91dHB1dFF1ZXJ5IiwiTW9uZXJvVHhDb25maWciLCJnZXREZXN0aW5hdGlvbnMiLCJnZXRTd2VlcEVhY2hTdWJhZGRyZXNzIiwiZ2V0QmVsb3dBbW91bnQiLCJub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyIsImdldFN1YnRyYWN0RmVlRnJvbSIsIm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWciLCJnZXRBbW91bnQiLCJnZXRLZXlJbWFnZSIsImdldFN1YmFkZHJlc3NJbmRpY2VzIiwic2V0U3ViYWRkcmVzc0luZGljZXMiLCJnZXRBY2NvdW50SW5kZXgiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb0FjY291bnQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnRUYWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFRhZ1wiO1xuaW1wb3J0IE1vbmVyb0FkZHJlc3NCb29rRW50cnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9DaGVja1Jlc2VydmUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tSZXNlcnZlXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tUeCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1R4XCI7XG5pbXBvcnQgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9Db25uZWN0aW9uTWFuYWdlclwiO1xuaW1wb3J0IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb0luY29taW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW5jb21pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb0ludGVncmF0ZWRBZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGVcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbmZvXCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5pdFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHRcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9PdXRnb2luZ1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb091dGdvaW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuLi9jb21tb24vTW9uZXJvUnBjQ29ubmVjdGlvblwiO1xuaW1wb3J0IE1vbmVyb1N1YmFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3ViYWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb1N5bmNSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3luY1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXJRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1R4U2V0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4U2V0XCI7XG5pbXBvcnQgTW9uZXJvVmVyc2lvbiBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb1ZlcnNpb25cIjtcbmltcG9ydCBNb25lcm9XYWxsZXRMaXN0ZW5lciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRMaXN0ZW5lclwiO1xuXG4vKipcbiAqIENvcHlyaWdodCAoYykgd29vZHNlclxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcbiAqIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuLyoqXG4gKiBNb25lcm8gd2FsbGV0IGludGVyZmFjZSBhbmQgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbnMuXG4gKiBcbiAqIEBpbnRlcmZhY2VcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvV2FsbGV0IHtcblxuICAvLyBzdGF0aWMgdmFyaWFibGVzXG4gIHN0YXRpYyByZWFkb25seSBERUZBVUxUX0xBTkdVQUdFID0gXCJFbmdsaXNoXCI7XG5cbiAgLy8gc3RhdGUgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBjb25uZWN0aW9uTWFuYWdlcjogTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI7XG4gIHByb3RlY3RlZCBjb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyOiBNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyO1xuICBwcm90ZWN0ZWQgbGlzdGVuZXJzOiBNb25lcm9XYWxsZXRMaXN0ZW5lcltdID0gW107XG4gIHByb3RlY3RlZCBfaXNDbG9zZWQgPSBmYWxzZTtcblxuICAvKipcbiAgICogSGlkZGVuIGNvbnN0cnVjdG9yLlxuICAgKiBcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIC8vIG5vIGNvZGUgbmVlZGVkXG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZWdpc3RlciBhIGxpc3RlbmVyIHRvIHJlY2VpdmUgd2FsbGV0IG5vdGlmaWNhdGlvbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1dhbGxldExpc3RlbmVyfSBsaXN0ZW5lciAtIGxpc3RlbmVyIHRvIHJlY2VpdmUgd2FsbGV0IG5vdGlmaWNhdGlvbnNcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIGFkZExpc3RlbmVyKGxpc3RlbmVyOiBNb25lcm9XYWxsZXRMaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGFzc2VydChsaXN0ZW5lciBpbnN0YW5jZW9mIE1vbmVyb1dhbGxldExpc3RlbmVyLCBcIkxpc3RlbmVyIG11c3QgYmUgaW5zdGFuY2Ugb2YgTW9uZXJvV2FsbGV0TGlzdGVuZXJcIik7XG4gICAgdGhpcy5saXN0ZW5lcnMucHVzaChsaXN0ZW5lcik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBVbnJlZ2lzdGVyIGEgbGlzdGVuZXIgdG8gcmVjZWl2ZSB3YWxsZXQgbm90aWZpY2F0aW9ucy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvV2FsbGV0TGlzdGVuZXJ9IGxpc3RlbmVyIC0gbGlzdGVuZXIgdG8gdW5yZWdpc3RlclxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBsZXQgaWR4ID0gdGhpcy5saXN0ZW5lcnMuaW5kZXhPZihsaXN0ZW5lcik7XG4gICAgaWYgKGlkeCA+IC0xKSB0aGlzLmxpc3RlbmVycy5zcGxpY2UoaWR4LCAxKTtcbiAgICBlbHNlIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkxpc3RlbmVyIGlzIG5vdCByZWdpc3RlcmVkIHdpdGggd2FsbGV0XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBsaXN0ZW5lcnMgcmVnaXN0ZXJlZCB3aXRoIHRoZSB3YWxsZXQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtNb25lcm9XYWxsZXRMaXN0ZW5lcltdfSB0aGUgcmVnaXN0ZXJlZCBsaXN0ZW5lcnNcbiAgICovXG4gIGdldExpc3RlbmVycygpOiBNb25lcm9XYWxsZXRMaXN0ZW5lcltdIHtcbiAgICByZXR1cm4gdGhpcy5saXN0ZW5lcnM7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIHdhbGxldCBpcyB2aWV3LW9ubHksIG1lYW5pbmcgaXQgZG9lcyBub3QgaGF2ZSB0aGUgcHJpdmF0ZVxuICAgKiBzcGVuZCBrZXkgYW5kIGNhbiB0aGVyZWZvcmUgb25seSBvYnNlcnZlIGluY29taW5nIG91dHB1dHMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSB3YWxsZXQgaXMgdmlldy1vbmx5LCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzVmlld09ubHkoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCB0aGUgd2FsbGV0J3MgZGFlbW9uIGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1JwY0Nvbm5lY3Rpb24gfCBzdHJpbmd9IFt1cmlPckNvbm5lY3Rpb25dIC0gZGFlbW9uJ3MgVVJJIG9yIGNvbm5lY3Rpb24gKGRlZmF1bHRzIHRvIG9mZmxpbmUpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXREYWVtb25Db25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbj86IE1vbmVyb1JwY0Nvbm5lY3Rpb24gfCBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvbi5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj59IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvblxuICAgKi9cbiAgYXN5bmMgZ2V0RGFlbW9uQ29ubmVjdGlvbigpOiBQcm9taXNlPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgd2FsbGV0J3MgZGFlbW9uIGNvbm5lY3Rpb24gbWFuYWdlci5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJ9IGNvbm5lY3Rpb25NYW5hZ2VyIG1hbmFnZXMgY29ubmVjdGlvbnMgdG8gbW9uZXJvZFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29ubmVjdGlvbk1hbmFnZXI/OiBNb25lcm9Db25uZWN0aW9uTWFuYWdlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyKSB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyLnJlbW92ZUxpc3RlbmVyKHRoaXMuY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcik7XG4gICAgdGhpcy5jb25uZWN0aW9uTWFuYWdlciA9IGNvbm5lY3Rpb25NYW5hZ2VyO1xuICAgIGlmICghY29ubmVjdGlvbk1hbmFnZXIpIHJldHVybjtcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgaWYgKCF0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIpIHRoaXMuY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciA9IG5ldyBjbGFzcyBleHRlbmRzIE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIge1xuICAgICAgYXN5bmMgb25Db25uZWN0aW9uQ2hhbmdlZChjb25uZWN0aW9uOiBNb25lcm9ScGNDb25uZWN0aW9uIHwgdW5kZWZpbmVkKSB7XG4gICAgICAgIGF3YWl0IHRoYXQuc2V0RGFlbW9uQ29ubmVjdGlvbihjb25uZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGNvbm5lY3Rpb25NYW5hZ2VyLmFkZExpc3RlbmVyKHRoaXMuY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcik7XG4gICAgYXdhaXQgdGhpcy5zZXREYWVtb25Db25uZWN0aW9uKGNvbm5lY3Rpb25NYW5hZ2VyLmdldENvbm5lY3Rpb24oKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvbiBtYW5hZ2VyLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9Db25uZWN0aW9uTWFuYWdlcj59IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvbiBtYW5hZ2VyXG4gICAqL1xuICBhc3luYyBnZXRDb25uZWN0aW9uTWFuYWdlcigpOiBQcm9taXNlPE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyPiB7XG4gICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbk1hbmFnZXI7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIHdhbGxldCBpcyBjb25uZWN0ZWQgdG8gZGFlbW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgd2FsbGV0IGlzIGNvbm5lY3RlZCB0byBhIGRhZW1vbiwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBpc0Nvbm5lY3RlZFRvRGFlbW9uKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2ZXJzaW9uIG9mIHRoZSB3YWxsZXQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1ZlcnNpb24+fSB0aGUgdmVyc2lvbiBvZiB0aGUgd2FsbGV0XG4gICAqL1xuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIHBhdGguXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSBwYXRoIHRoZSB3YWxsZXQgY2FuIGJlIG9wZW5lZCB3aXRoXG4gICAqL1xuICBhc3luYyBnZXRQYXRoKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgbW5lbW9uaWMgcGhyYXNlIG9yIHNlZWQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB3YWxsZXQncyBtbmVtb25pYyBwaHJhc2Ugb3Igc2VlZC5cbiAgICovXG4gIGFzeW5jIGdldFNlZWQoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBsYW5ndWFnZSBvZiB0aGUgd2FsbGV0J3MgbW5lbW9uaWMgcGhyYXNlIG9yIHNlZWQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSBsYW5ndWFnZSBvZiB0aGUgd2FsbGV0J3MgbW5lbW9uaWMgcGhyYXNlIG9yIHNlZWQuXG4gICAqL1xuICBhc3luYyBnZXRTZWVkTGFuZ3VhZ2UoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBwcml2YXRlIHZpZXcga2V5LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgd2FsbGV0J3MgcHJpdmF0ZSB2aWV3IGtleVxuICAgKi9cbiAgYXN5bmMgZ2V0UHJpdmF0ZVZpZXdLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBwcml2YXRlIHNwZW5kIGtleS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHdhbGxldCdzIHByaXZhdGUgc3BlbmQga2V5XG4gICAqL1xuICBhc3luYyBnZXRQcml2YXRlU3BlbmRLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBwdWJsaWMgdmlldyBrZXkuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB3YWxsZXQncyBwdWJsaWMgdmlldyBrZXlcbiAgICovXG4gIGFzeW5jIGdldFB1YmxpY1ZpZXdLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBwdWJsaWMgc3BlbmQga2V5LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgd2FsbGV0J3MgcHVibGljIHNwZW5kIGtleVxuICAgKi9cbiAgYXN5bmMgZ2V0UHVibGljU3BlbmRLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gICAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIHByaW1hcnkgYWRkcmVzcy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHdhbGxldCdzIHByaW1hcnkgYWRkcmVzc1xuICAgKi9cbiAgYXN5bmMgZ2V0UHJpbWFyeUFkZHJlc3MoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRBZGRyZXNzKDAsIDApO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBhZGRyZXNzIG9mIGEgc3BlY2lmaWMgc3ViYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gdGhlIGFjY291bnQgaW5kZXggb2YgdGhlIGFkZHJlc3MncyBzdWJhZGRyZXNzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzdWJhZGRyZXNzSWR4IC0gdGhlIHN1YmFkZHJlc3MgaW5kZXggd2l0aGluIHRoZSBhY2NvdW50XG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHJlY2VpdmUgYWRkcmVzcyBvZiB0aGUgc3BlY2lmaWVkIHN1YmFkZHJlc3NcbiAgICovXG4gIGFzeW5jIGdldEFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kZXggb2YgdGhlIGdpdmVuIGFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIGFkZHJlc3MgdG8gZ2V0IHRoZSBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGV4IGZyb21cbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPn0gdGhlIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlc1xuICAgKi9cbiAgYXN5bmMgZ2V0QWRkcmVzc0luZGV4KGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYW4gaW50ZWdyYXRlZCBhZGRyZXNzIGJhc2VkIG9uIHRoZSBnaXZlbiBzdGFuZGFyZCBhZGRyZXNzIGFuZCBwYXltZW50XG4gICAqIElELiBVc2VzIHRoZSB3YWxsZXQncyBwcmltYXJ5IGFkZHJlc3MgaWYgYW4gYWRkcmVzcyBpcyBub3QgZ2l2ZW4uXG4gICAqIEdlbmVyYXRlcyBhIHJhbmRvbSBwYXltZW50IElEIGlmIGEgcGF5bWVudCBJRCBpcyBub3QgZ2l2ZW4uXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhbmRhcmRBZGRyZXNzIGlzIHRoZSBzdGFuZGFyZCBhZGRyZXNzIHRvIGdlbmVyYXRlIHRoZSBpbnRlZ3JhdGVkIGFkZHJlc3MgZnJvbSAod2FsbGV0J3MgcHJpbWFyeSBhZGRyZXNzIGlmIHVuZGVmaW5lZClcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBheW1lbnRJZCBpcyB0aGUgcGF5bWVudCBJRCB0byBnZW5lcmF0ZSBhbiBpbnRlZ3JhdGVkIGFkZHJlc3MgZnJvbSAocmFuZG9tbHkgZ2VuZXJhdGVkIGlmIHVuZGVmaW5lZClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz59IHRoZSBpbnRlZ3JhdGVkIGFkZHJlc3NcbiAgICovXG4gIGFzeW5jIGdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcz86IHN0cmluZywgcGF5bWVudElkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZWNvZGUgYW4gaW50ZWdyYXRlZCBhZGRyZXNzIHRvIGdldCBpdHMgc3RhbmRhcmQgYWRkcmVzcyBhbmQgcGF5bWVudCBpZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBpbnRlZ3JhdGVkQWRkcmVzcyAtIGludGVncmF0ZWQgYWRkcmVzcyB0byBkZWNvZGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz59IHRoZSBkZWNvZGVkIGludGVncmF0ZWQgYWRkcmVzcyBpbmNsdWRpbmcgc3RhbmRhcmQgYWRkcmVzcyBhbmQgcGF5bWVudCBpZFxuICAgKi9cbiAgYXN5bmMgZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBibG9jayBoZWlnaHQgdGhhdCB0aGUgd2FsbGV0IGlzIHN5bmNlZCB0by5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIGJsb2NrIGhlaWdodCB0aGF0IHRoZSB3YWxsZXQgaXMgc3luY2VkIHRvXG4gICAqL1xuICBhc3luYyBnZXRIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBibG9ja2NoYWluJ3MgaGVpZ2h0LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB0aGUgYmxvY2tjaGFpbidzIGhlaWdodFxuICAgKi9cbiAgYXN5bmMgZ2V0RGFlbW9uSGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgYmxvY2tjaGFpbidzIGhlaWdodCBieSBkYXRlIGFzIGEgY29uc2VydmF0aXZlIGVzdGltYXRlIGZvciBzY2FubmluZy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5ZWFyIC0geWVhciBvZiB0aGUgaGVpZ2h0IHRvIGdldFxuICAgKiBAcGFyYW0ge251bWJlcn0gbW9udGggLSBtb250aCBvZiB0aGUgaGVpZ2h0IHRvIGdldCBhcyBhIG51bWJlciBiZXR3ZWVuIDEgYW5kIDEyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBkYXkgLSBkYXkgb2YgdGhlIGhlaWdodCB0byBnZXQgYXMgYSBudW1iZXIgYmV0d2VlbiAxIGFuZCAzMVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBibG9ja2NoYWluJ3MgYXBwcm94aW1hdGUgaGVpZ2h0IGF0IHRoZSBnaXZlbiBkYXRlXG4gICAqL1xuICBhc3luYyBnZXRIZWlnaHRCeURhdGUoeWVhcjogbnVtYmVyLCBtb250aDogbnVtYmVyLCBkYXk6IG51bWJlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN5bmNocm9uaXplIHRoZSB3YWxsZXQgd2l0aCB0aGUgZGFlbW9uIGFzIGEgb25lLXRpbWUgc3luY2hyb25vdXMgcHJvY2Vzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvV2FsbGV0TGlzdGVuZXJ8bnVtYmVyfSBbbGlzdGVuZXJPclN0YXJ0SGVpZ2h0XSAtIGxpc3RlbmVyIHhvciBzdGFydCBoZWlnaHQgKGRlZmF1bHRzIHRvIG5vIHN5bmMgbGlzdGVuZXIsIHRoZSBsYXN0IHN5bmNlZCBibG9jaylcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdGFydEhlaWdodF0gLSBzdGFydEhlaWdodCBpZiBub3QgZ2l2ZW4gaW4gZmlyc3QgYXJnIChkZWZhdWx0cyB0byBsYXN0IHN5bmNlZCBibG9jaylcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0PzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgfCBudW1iZXIsIHN0YXJ0SGVpZ2h0PzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9TeW5jUmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0YXJ0IGJhY2tncm91bmQgc3luY2hyb25pemluZyB3aXRoIGEgbWF4aW11bSBwZXJpb2QgYmV0d2VlbiBzeW5jcy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3luY1BlcmlvZEluTXNdIC0gbWF4aW11bSBwZXJpb2QgYmV0d2VlbiBzeW5jcyBpbiBtaWxsaXNlY29uZHMgKGRlZmF1bHQgaXMgd2FsbGV0LXNwZWNpZmljKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0b3Agc3luY2hyb25pemluZyB0aGUgd2FsbGV0IHdpdGggdGhlIGRhZW1vbi5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzdG9wU3luY2luZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2NhbiB0cmFuc2FjdGlvbnMgYnkgdGhlaXIgaGFzaC9pZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IHR4SGFzaGVzIC0gdHggaGFzaGVzIHRvIHNjYW5cbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNjYW5UeHModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPlJlc2NhbiB0aGUgYmxvY2tjaGFpbiBmb3Igc3BlbnQgb3V0cHV0cy48L3A+XG4gICAqIFxuICAgKiA8cD5Ob3RlOiB0aGlzIGNhbiBvbmx5IGJlIGNhbGxlZCB3aXRoIGEgdHJ1c3RlZCBkYWVtb24uPC9wPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZSB1c2UgY2FzZTogcGVlciBtdWx0aXNpZyBoZXggaXMgaW1wb3J0IHdoZW4gY29ubmVjdGVkIHRvIGFuIHVudHJ1c3RlZCBkYWVtb24sXG4gICAqIHNvIHRoZSB3YWxsZXQgd2lsbCBub3QgcmVzY2FuIHNwZW50IG91dHB1dHMuICBUaGVuIHRoZSB3YWxsZXQgY29ubmVjdHMgdG8gYSB0cnVzdGVkXG4gICAqIGRhZW1vbi4gIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBtYW51YWxseSBpbnZva2VkIHRvIHJlc2NhbiBvdXRwdXRzLjwvcD5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyByZXNjYW5TcGVudCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+UmVzY2FuIHRoZSBibG9ja2NoYWluIGZyb20gc2NyYXRjaCwgbG9zaW5nIGFueSBpbmZvcm1hdGlvbiB3aGljaCBjYW5ub3QgYmUgcmVjb3ZlcmVkIGZyb21cbiAgICogdGhlIGJsb2NrY2hhaW4gaXRzZWxmLjwvcD5cbiAgICogXG4gICAqIDxwPldBUk5JTkc6IFRoaXMgbWV0aG9kIGRpc2NhcmRzIGxvY2FsIHdhbGxldCBkYXRhIGxpa2UgZGVzdGluYXRpb24gYWRkcmVzc2VzLCB0eCBzZWNyZXQga2V5cyxcbiAgICogdHggbm90ZXMsIGV0Yy48L3A+XG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgcmVzY2FuQmxvY2tjaGFpbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBiYWxhbmNlIG9mIHRoZSB3YWxsZXQsIGFjY291bnQsIG9yIHN1YmFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW2FjY291bnRJZHhdIC0gaW5kZXggb2YgdGhlIGFjY291bnQgdG8gZ2V0IHRoZSBiYWxhbmNlIG9mIChkZWZhdWx0IGFsbCBhY2NvdW50cylcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdWJhZGRyZXNzSWR4XSAtIGluZGV4IG9mIHRoZSBzdWJhZGRyZXNzIHRvIGdldCB0aGUgYmFsYW5jZSBvZiAoZGVmYXVsdCBhbGwgc3ViYWRkcmVzc2VzKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJpZ2ludD59IHRoZSBiYWxhbmNlIG9mIHRoZSB3YWxsZXQsIGFjY291bnQsIG9yIHN1YmFkZHJlc3NcbiAgICovXG4gIGFzeW5jIGdldEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgdW5sb2NrZWQgYmFsYW5jZSBvZiB0aGUgd2FsbGV0LCBhY2NvdW50LCBvciBzdWJhZGRyZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFthY2NvdW50SWR4XSAtIGluZGV4IG9mIHRoZSBhY2NvdW50IHRvIGdldCB0aGUgdW5sb2NrZWQgYmFsYW5jZSBvZiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3ViYWRkcmVzc0lkeF0gLSBpbmRleCBvZiB0aGUgc3ViYWRkcmVzcyB0byBnZXQgdGhlIHVubG9ja2VkIGJhbGFuY2Ugb2YgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJpZ2ludD59IHRoZSB1bmxvY2tlZCBiYWxhbmNlIG9mIHRoZSB3YWxsZXQsIGFjY291bnQsIG9yIHN1YmFkZHJlc3NcbiAgICovXG4gIGFzeW5jIGdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBudW1iZXIgb2YgYmxvY2tzIHVudGlsIHRoZSBuZXh0IGFuZCBsYXN0IGZ1bmRzIHVubG9jay5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyW10+fSB0aGUgbnVtYmVyIG9mIGJsb2NrcyB1bnRpbCB0aGUgbmV4dCBhbmQgbGFzdCBmdW5kcyB1bmxvY2sgaW4gZWxlbWVudHMgMCBhbmQgMSwgcmVzcGVjdGl2ZWx5LCBvciB1bmRlZmluZWQgaWYgbm8gYmFsYW5jZVxuICAgKi9cbiAgYXN5bmMgZ2V0TnVtQmxvY2tzVG9VbmxvY2soKTogUHJvbWlzZTxudW1iZXJbXT4ge1xuICAgIFxuICAgIC8vIGdldCBiYWxhbmNlc1xuICAgIGxldCBiYWxhbmNlID0gYXdhaXQgdGhpcy5nZXRCYWxhbmNlKCk7XG4gICAgaWYgKGJhbGFuY2UgPT09IDBuKSByZXR1cm4gW3VuZGVmaW5lZCwgdW5kZWZpbmVkXTsgLy8gc2tpcCBpZiBubyBiYWxhbmNlXG4gICAgbGV0IHVubG9ja2VkQmFsYW5jZSA9IGF3YWl0IHRoaXMuZ2V0VW5sb2NrZWRCYWxhbmNlKCk7XG4gICAgXG4gICAgLy8gY29tcHV0ZSBudW1iZXIgb2YgYmxvY2tzIHVudGlsIG5leHQgZnVuZHMgYXZhaWxhYmxlXG4gICAgbGV0IHR4cztcbiAgICBsZXQgaGVpZ2h0O1xuICAgIGxldCBudW1CbG9ja3NUb05leHRVbmxvY2sgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHVubG9ja2VkQmFsYW5jZSA+IDBuKSBudW1CbG9ja3NUb05leHRVbmxvY2sgPSAwO1xuICAgIGVsc2Uge1xuICAgICAgdHhzID0gYXdhaXQgdGhpcy5nZXRUeHMoe2lzTG9ja2VkOiB0cnVlfSk7IC8vIGdldCBsb2NrZWQgdHhzXG4gICAgICBoZWlnaHQgPSBhd2FpdCB0aGlzLmdldEhlaWdodCgpOyAvLyBnZXQgbW9zdCByZWNlbnQgaGVpZ2h0XG4gICAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgICAgbGV0IG51bUJsb2Nrc1RvVW5sb2NrID0gTWF0aC5tYXgoKHR4LmdldElzQ29uZmlybWVkKCkgPyB0eC5nZXRIZWlnaHQoKSA6IGhlaWdodCkgKyAxMCwgdHguZ2V0VW5sb2NrVGltZSgpKSAtIGhlaWdodDtcbiAgICAgICAgbnVtQmxvY2tzVG9OZXh0VW5sb2NrID0gbnVtQmxvY2tzVG9OZXh0VW5sb2NrID09PSB1bmRlZmluZWQgPyBudW1CbG9ja3NUb1VubG9jayA6IE1hdGgubWluKG51bUJsb2Nrc1RvTmV4dFVubG9jaywgbnVtQmxvY2tzVG9VbmxvY2spO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBjb21wdXRlIG51bWJlciBvZiBibG9ja3MgdW50aWwgYWxsIGZ1bmRzIGF2YWlsYWJsZVxuICAgIGxldCBudW1CbG9ja3NUb0xhc3RVbmxvY2sgPSB1bmRlZmluZWQ7XG4gICAgaWYgKGJhbGFuY2UgPT09IHVubG9ja2VkQmFsYW5jZSkge1xuICAgICAgaWYgKHVubG9ja2VkQmFsYW5jZSA+IDBuKSBudW1CbG9ja3NUb0xhc3RVbmxvY2sgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIXR4cykge1xuICAgICAgICB0eHMgPSBhd2FpdCB0aGlzLmdldFR4cyh7aXNMb2NrZWQ6IHRydWV9KTsgLy8gZ2V0IGxvY2tlZCB0eHNcbiAgICAgICAgaGVpZ2h0ID0gYXdhaXQgdGhpcy5nZXRIZWlnaHQoKTsgLy8gZ2V0IG1vc3QgcmVjZW50IGhlaWdodFxuICAgICAgfVxuICAgICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICAgIGxldCBudW1CbG9ja3NUb1VubG9jayA9IE1hdGgubWF4KCh0eC5nZXRJc0NvbmZpcm1lZCgpID8gdHguZ2V0SGVpZ2h0KCkgOiBoZWlnaHQpICsgMTAsIHR4LmdldFVubG9ja1RpbWUoKSkgLSBoZWlnaHQ7XG4gICAgICAgIG51bUJsb2Nrc1RvTGFzdFVubG9jayA9IG51bUJsb2Nrc1RvTGFzdFVubG9jayA9PT0gdW5kZWZpbmVkID8gbnVtQmxvY2tzVG9VbmxvY2sgOiBNYXRoLm1heChudW1CbG9ja3NUb0xhc3RVbmxvY2ssIG51bUJsb2Nrc1RvVW5sb2NrKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIFtudW1CbG9ja3NUb05leHRVbmxvY2ssIG51bUJsb2Nrc1RvTGFzdFVubG9ja107XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYWNjb3VudHMgd2l0aCBhIGdpdmVuIHRhZy5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaW5jbHVkZVN1YmFkZHJlc3NlcyAtIGluY2x1ZGUgc3ViYWRkcmVzc2VzIGlmIHRydWVcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyAtIHRhZyBmb3IgZmlsdGVyaW5nIGFjY291bnRzLCBhbGwgYWNjb3VudHMgaWYgdW5kZWZpbmVkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQWNjb3VudFtdPn0gYWxsIGFjY291bnRzIHdpdGggdGhlIGdpdmVuIHRhZ1xuICAgKi9cbiAgYXN5bmMgZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHRhZz86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQWNjb3VudFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhbiBhY2NvdW50LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFjY291bnRJZHggLSBpbmRleCBvZiB0aGUgYWNjb3VudCB0byBnZXRcbiAgICogQHBhcmFtIHtib29sZWFufSBpbmNsdWRlU3ViYWRkcmVzc2VzIC0gaW5jbHVkZSBzdWJhZGRyZXNzZXMgaWYgdHJ1ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0FjY291bnQ+fSB0aGUgcmV0cmlldmVkIGFjY291bnRcbiAgICovXG4gIGFzeW5jIGdldEFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvQWNjb3VudD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgYWNjb3VudCB3aXRoIGEgbGFiZWwgZm9yIHRoZSBmaXJzdCBzdWJhZGRyZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtsYWJlbF0gLSBsYWJlbCBmb3IgYWNjb3VudCdzIGZpcnN0IHN1YmFkZHJlc3MgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0FjY291bnQ+fSB0aGUgY3JlYXRlZCBhY2NvdW50XG4gICAqL1xuICBhc3luYyBjcmVhdGVBY2NvdW50KGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYW4gYWNjb3VudCBsYWJlbC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gaW5kZXggb2YgdGhlIGFjY291bnQgdG8gc2V0IHRoZSBsYWJlbCBmb3JcbiAgICogQHBhcmFtIHtzdHJpbmd9IGxhYmVsIC0gdGhlIGxhYmVsIHRvIHNldFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0QWNjb3VudExhYmVsKGFjY291bnRJZHg6IG51bWJlciwgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHgsIDAsIGxhYmVsKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBzdWJhZGRyZXNzZXMgaW4gYW4gYWNjb3VudC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gYWNjb3VudCB0byBnZXQgc3ViYWRkcmVzc2VzIHdpdGhpblxuICAgKiBAcGFyYW0ge251bWJlcltdfSBbc3ViYWRkcmVzc0luZGljZXNdIC0gaW5kaWNlcyBvZiBzdWJhZGRyZXNzZXMgdG8gZ2V0IChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzW10+fSB0aGUgcmV0cmlldmVkIHN1YmFkZHJlc3Nlc1xuICAgKi9cbiAgYXN5bmMgZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0luZGljZXM/OiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzc1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIHN1YmFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gYWNjb3VudElkeCAtIGluZGV4IG9mIHRoZSBzdWJhZGRyZXNzJ3MgYWNjb3VudFxuICAgKiBAcGFyYW0ge251bWJlcn0gc3ViYWRkcmVzc0lkeCAtIGluZGV4IG9mIHRoZSBzdWJhZGRyZXNzIHdpdGhpbiB0aGUgYWNjb3VudFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+fSB0aGUgcmV0cmlldmVkIHN1YmFkZHJlc3NcbiAgICovXG4gIGFzeW5jIGdldFN1YmFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICBhc3NlcnQoYWNjb3VudElkeCA+PSAwKTtcbiAgICBhc3NlcnQoc3ViYWRkcmVzc0lkeCA+PSAwKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIFtzdWJhZGRyZXNzSWR4XSkpWzBdO1xuICB9XG4gIFxuICAvKipcbiAgICogQ3JlYXRlIGEgc3ViYWRkcmVzcyB3aXRoaW4gYW4gYWNjb3VudC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gaW5kZXggb2YgdGhlIGFjY291bnQgdG8gY3JlYXRlIHRoZSBzdWJhZGRyZXNzIHdpdGhpblxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2xhYmVsXSAtIHRoZSBsYWJlbCBmb3IgdGhlIHN1YmFkZHJlc3MgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+fSB0aGUgY3JlYXRlZCBzdWJhZGRyZXNzXG4gICAqL1xuICBhc3luYyBjcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgbGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhIHN1YmFkZHJlc3MgbGFiZWwuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gYWNjb3VudElkeCAtIGluZGV4IG9mIHRoZSBhY2NvdW50IHRvIHNldCB0aGUgbGFiZWwgZm9yXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzdWJhZGRyZXNzSWR4IC0gaW5kZXggb2YgdGhlIHN1YmFkZHJlc3MgdG8gc2V0IHRoZSBsYWJlbCBmb3JcbiAgICogQHBhcmFtIHtQcm9taXNlPHN0cmluZz59IGxhYmVsIC0gdGhlIGxhYmVsIHRvIHNldFxuICAgKi9cbiAgYXN5bmMgc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIHdhbGxldCB0cmFuc2FjdGlvbiBieSBoYXNoLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIGhhc2ggb2YgYSB0cmFuc2FjdGlvbiB0byBnZXRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldD4gfSB0aGUgaWRlbnRpZmllZCB0cmFuc2FjdGlvbiBvciB1bmRlZmluZWQgaWYgbm90IGZvdW5kXG4gICAqL1xuICBhc3luYyBnZXRUeCh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHtcbiAgICBsZXQgdHhzID0gYXdhaXQgdGhpcy5nZXRUeHMoW3R4SGFzaF0pO1xuICAgIHJldHVybiB0eHMubGVuZ3RoID09PSAwID8gdW5kZWZpbmVkIDogdHhzWzBdOyBcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPkdldCB3YWxsZXQgdHJhbnNhY3Rpb25zLiAgV2FsbGV0IHRyYW5zYWN0aW9ucyBjb250YWluIG9uZSBvciBtb3JlXG4gICAqIHRyYW5zZmVycyB0aGF0IGFyZSBlaXRoZXIgaW5jb21pbmcgb3Igb3V0Z29pbmcgdG8gdGhlIHdhbGxldC48cD5cbiAgICogXG4gICAqIDxwPlJlc3VsdHMgY2FuIGJlIGZpbHRlcmVkIGJ5IHBhc3NpbmcgYSBxdWVyeSBvYmplY3QuICBUcmFuc2FjdGlvbnMgbXVzdFxuICAgKiBtZWV0IGV2ZXJ5IGNyaXRlcmlhIGRlZmluZWQgaW4gdGhlIHF1ZXJ5IGluIG9yZGVyIHRvIGJlIHJldHVybmVkLiAgQWxsXG4gICAqIGNyaXRlcmlhIGFyZSBvcHRpb25hbCBhbmQgbm8gZmlsdGVyaW5nIGlzIGFwcGxpZWQgd2hlbiBub3QgZGVmaW5lZC48L3A+XG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdIHwgTW9uZXJvVHhRdWVyeX0gW3F1ZXJ5XSAtIGNvbmZpZ3VyZXMgdGhlIHF1ZXJ5IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNDb25maXJtZWRdIC0gZ2V0IHR4cyB0aGF0IGFyZSBjb25maXJtZWQgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaW5UeFBvb2xdIC0gZ2V0IHR4cyB0aGF0IGFyZSBpbiB0aGUgdHggcG9vbCBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc1JlbGF5ZWRdIC0gZ2V0IHR4cyB0aGF0IGFyZSByZWxheWVkIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzRmFpbGVkXSAtIGdldCB0eHMgdGhhdCBhcmUgZmFpbGVkIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzTWluZXJUeF0gLSBnZXQgbWluZXIgdHhzIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcXVlcnkuaGFzaF0gLSBnZXQgYSB0eCB3aXRoIHRoZSBoYXNoIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gW3F1ZXJ5Lmhhc2hlc10gLSBnZXQgdHhzIHdpdGggdGhlIGhhc2hlcyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcXVlcnkucGF5bWVudElkXSAtIGdldCB0cmFuc2FjdGlvbnMgd2l0aCB0aGUgcGF5bWVudCBpZCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IFtxdWVyeS5wYXltZW50SWRzXSAtIGdldCB0cmFuc2FjdGlvbnMgd2l0aCB0aGUgcGF5bWVudCBpZHMgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5oYXNQYXltZW50SWRdIC0gZ2V0IHRyYW5zYWN0aW9ucyB3aXRoIGEgcGF5bWVudCBpZCBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5Lm1pbkhlaWdodF0gLSBnZXQgdHhzIHdpdGggaGVpZ2h0ID49IHRoZSBnaXZlbiBoZWlnaHQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5Lm1heEhlaWdodF0gLSBnZXQgdHhzIHdpdGggaGVpZ2h0IDw9IHRoZSBnaXZlbiBoZWlnaHQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc091dGdvaW5nXSAtIGdldCB0eHMgd2l0aCBhbiBvdXRnb2luZyB0cmFuc2ZlciBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc0luY29taW5nXSAtIGdldCB0eHMgd2l0aCBhbiBpbmNvbWluZyB0cmFuc2ZlciBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb1RyYW5zZmVyUXVlcnl9IFtxdWVyeS50cmFuc2ZlclF1ZXJ5XSAtIGdldCB0eHMgdGhhdCBoYXZlIGEgdHJhbnNmZXIgdGhhdCBtZWV0cyB0aGlzIHF1ZXJ5IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaW5jbHVkZU91dHB1dHNdIC0gc3BlY2lmaWVzIHRoYXQgdHggb3V0cHV0cyBzaG91bGQgYmUgcmV0dXJuZWQgd2l0aCB0eCByZXN1bHRzIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPn0gd2FsbGV0IHRyYW5zYWN0aW9ucyBwZXIgdGhlIGNvbmZpZ3VyYXRpb25cbiAgICovXG4gIGFzeW5jIGdldFR4cyhxdWVyeT86IHN0cmluZ1tdIHwgUGFydGlhbDxNb25lcm9UeFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogPHA+R2V0IGluY29taW5nIGFuZCBvdXRnb2luZyB0cmFuc2ZlcnMgdG8gYW5kIGZyb20gdGhpcyB3YWxsZXQuICBBbiBvdXRnb2luZ1xuICAgKiB0cmFuc2ZlciByZXByZXNlbnRzIGEgdG90YWwgYW1vdW50IHNlbnQgZnJvbSBvbmUgb3IgbW9yZSBzdWJhZGRyZXNzZXNcbiAgICogd2l0aGluIGFuIGFjY291bnQgdG8gaW5kaXZpZHVhbCBkZXN0aW5hdGlvbiBhZGRyZXNzZXMsIGVhY2ggd2l0aCB0aGVpclxuICAgKiBvd24gYW1vdW50LiAgQW4gaW5jb21pbmcgdHJhbnNmZXIgcmVwcmVzZW50cyBhIHRvdGFsIGFtb3VudCByZWNlaXZlZCBpbnRvXG4gICAqIGEgc3ViYWRkcmVzcyB3aXRoaW4gYW4gYWNjb3VudC4gIFRyYW5zZmVycyBiZWxvbmcgdG8gdHJhbnNhY3Rpb25zIHdoaWNoXG4gICAqIGFyZSBzdG9yZWQgb24gdGhlIGJsb2NrY2hhaW4uPC9wPlxuICAgKiBcbiAgICogPHA+UmVzdWx0cyBjYW4gYmUgZmlsdGVyZWQgYnkgcGFzc2luZyBhIHF1ZXJ5IG9iamVjdC4gIFRyYW5zZmVycyBtdXN0XG4gICAqIG1lZXQgZXZlcnkgY3JpdGVyaWEgZGVmaW5lZCBpbiB0aGUgcXVlcnkgaW4gb3JkZXIgdG8gYmUgcmV0dXJuZWQuICBBbGxcbiAgICogY3JpdGVyaWEgYXJlIG9wdGlvbmFsIGFuZCBubyBmaWx0ZXJpbmcgaXMgYXBwbGllZCB3aGVuIG5vdCBkZWZpbmVkLjwvcD5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHJhbnNmZXJRdWVyeX0gW3F1ZXJ5XSAtIGNvbmZpZ3VyZXMgdGhlIHF1ZXJ5IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNPdXRnb2luZ10gLSBnZXQgdHJhbnNmZXJzIHRoYXQgYXJlIG91dGdvaW5nIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzSW5jb21pbmddIC0gZ2V0IHRyYW5zZmVycyB0aGF0IGFyZSBpbmNvbWluZyBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3F1ZXJ5LmFkZHJlc3NdIC0gd2FsbGV0J3MgYWRkcmVzcyB0aGF0IGEgdHJhbnNmZXIgZWl0aGVyIG9yaWdpbmF0ZWQgZnJvbSAoaWYgb3V0Z29pbmcpIG9yIGlzIGRlc3RpbmVkIGZvciAoaWYgaW5jb21pbmcpIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5hY2NvdW50SW5kZXhdIC0gZ2V0IHRyYW5zZmVycyB0aGF0IGVpdGhlciBvcmlnaW5hdGVkIGZyb20gKGlmIG91dGdvaW5nKSBvciBhcmUgZGVzdGluZWQgZm9yIChpZiBpbmNvbWluZykgYSBzcGVjaWZpYyBhY2NvdW50IGluZGV4IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5zdWJhZGRyZXNzSW5kZXhdIC0gZ2V0IHRyYW5zZmVycyB0aGF0IGVpdGhlciBvcmlnaW5hdGVkIGZyb20gKGlmIG91dGdvaW5nKSBvciBhcmUgZGVzdGluZWQgZm9yIChpZiBpbmNvbWluZykgYSBzcGVjaWZpYyBzdWJhZGRyZXNzIGluZGV4IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtpbnRbXX0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRpY2VzXSAtIGdldCB0cmFuc2ZlcnMgdGhhdCBlaXRoZXIgb3JpZ2luYXRlZCBmcm9tIChpZiBvdXRnb2luZykgb3IgYXJlIGRlc3RpbmVkIGZvciAoaWYgaW5jb21pbmcpIHNwZWNpZmljIHN1YmFkZHJlc3MgaW5kaWNlcyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7YmlnaW50fSBbcXVlcnkuYW1vdW50XSAtIGFtb3VudCBiZWluZyB0cmFuc2ZlcnJlZCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvRGVzdGluYXRpb25bXSB8IE1vbmVyb0Rlc3RpbmF0aW9uTW9kZWxbXX0gW3F1ZXJ5LmRlc3RpbmF0aW9uc10gLSBpbmRpdmlkdWFsIGRlc3RpbmF0aW9ucyBvZiBhbiBvdXRnb2luZyB0cmFuc2Zlciwgd2hpY2ggaXMgbG9jYWwgd2FsbGV0IGRhdGEgYW5kIE5PVCByZWNvdmVyYWJsZSBmcm9tIHRoZSBibG9ja2NoYWluIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaGFzRGVzdGluYXRpb25zXSAtIGdldCB0cmFuc2ZlcnMgdGhhdCBoYXZlIGRlc3RpbmF0aW9ucyBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UXVlcnl9IFtxdWVyeS50eFF1ZXJ5XSAtIGdldCB0cmFuc2ZlcnMgd2hvc2UgdHJhbnNhY3Rpb24gbWVldHMgdGhpcyBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHJhbnNmZXJbXT59IHdhbGxldCB0cmFuc2ZlcnMgdGhhdCBtZWV0IHRoZSBxdWVyeVxuICAgKi9cbiAgYXN5bmMgZ2V0VHJhbnNmZXJzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHJhbnNmZXJbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgaW5jb21pbmcgdHJhbnNmZXJzLlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+fSBbcXVlcnldIC0gY29uZmlndXJlcyB0aGUgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3F1ZXJ5LmFkZHJlc3NdIC0gZ2V0IGluY29taW5nIHRyYW5zZmVycyB0byBhIHNwZWNpZmljIGFkZHJlc3MgaW4gdGhlIHdhbGxldCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkuYWNjb3VudEluZGV4XSAtIGdldCBpbmNvbWluZyB0cmFuc2ZlcnMgdG8gYSBzcGVjaWZpYyBhY2NvdW50IGluZGV4IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5zdWJhZGRyZXNzSW5kZXhdIC0gZ2V0IGluY29taW5nIHRyYW5zZmVycyB0byBhIHNwZWNpZmljIHN1YmFkZHJlc3MgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2ludFtdfSBbcXVlcnkuc3ViYWRkcmVzc0luZGljZXNdIC0gZ2V0IHRyYW5zZmVycyBkZXN0aW5lZCBmb3Igc3BlY2lmaWMgc3ViYWRkcmVzcyBpbmRpY2VzIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtiaWdpbnR9IFtxdWVyeS5hbW91bnRdIC0gYW1vdW50IGJlaW5nIHRyYW5zZmVycmVkIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtNb25lcm9UeFF1ZXJ5fSBbcXVlcnkudHhRdWVyeV0gLSBnZXQgdHJhbnNmZXJzIHdob3NlIHRyYW5zYWN0aW9uIG1lZXRzIHRoaXMgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0luY29taW5nVHJhbnNmZXJbXT59IGluY29taW5nIHRyYW5zZmVycyB0aGF0IG1lZXQgdGhlIHF1ZXJ5XG4gICAqL1xuICBhc3luYyBnZXRJbmNvbWluZ1RyYW5zZmVycyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb0luY29taW5nVHJhbnNmZXJbXT4ge1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZDogTW9uZXJvVHJhbnNmZXJRdWVyeSA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnlOb3JtYWxpemVkLmdldElzSW5jb21pbmcoKSA9PT0gZmFsc2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlRyYW5zZmVyIHF1ZXJ5IGNvbnRyYWRpY3RzIGdldHRpbmcgaW5jb21pbmcgdHJhbnNmZXJzXCIpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRJc0luY29taW5nKHRydWUpO1xuICAgIHJldHVybiB0aGlzLmdldFRyYW5zZmVycyhxdWVyeU5vcm1hbGl6ZWQpIGFzIHVua25vd24gYXMgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcltdO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IG91dGdvaW5nIHRyYW5zZmVycy5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pn0gW3F1ZXJ5XSAtIGNvbmZpZ3VyZXMgdGhlIHF1ZXJ5IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtxdWVyeS5hZGRyZXNzXSAtIGdldCBvdXRnb2luZyB0cmFuc2ZlcnMgZnJvbSBhIHNwZWNpZmljIGFkZHJlc3MgaW4gdGhlIHdhbGxldCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkuYWNjb3VudEluZGV4XSAtIGdldCBvdXRnb2luZyB0cmFuc2ZlcnMgZnJvbSBhIHNwZWNpZmljIGFjY291bnQgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRleF0gLSBnZXQgb3V0Z29pbmcgdHJhbnNmZXJzIGZyb20gYSBzcGVjaWZpYyBzdWJhZGRyZXNzIGluZGV4IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtpbnRbXX0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRpY2VzXSAtIGdldCBvdXRnb2luZyB0cmFuc2ZlcnMgZnJvbSBzcGVjaWZpYyBzdWJhZGRyZXNzIGluZGljZXMgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludH0gW3F1ZXJ5LmFtb3VudF0gLSBhbW91bnQgYmVpbmcgdHJhbnNmZXJyZWQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb0Rlc3RpbmF0aW9uW10gfCBNb25lcm9EZXN0aW5hdGlvbk1vZGVsW119IFtxdWVyeS5kZXN0aW5hdGlvbnNdIC0gaW5kaXZpZHVhbCBkZXN0aW5hdGlvbnMgb2YgYW4gb3V0Z29pbmcgdHJhbnNmZXIsIHdoaWNoIGlzIGxvY2FsIHdhbGxldCBkYXRhIGFuZCBOT1QgcmVjb3ZlcmFibGUgZnJvbSB0aGUgYmxvY2tjaGFpbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5Lmhhc0Rlc3RpbmF0aW9uc10gLSBnZXQgdHJhbnNmZXJzIHRoYXQgaGF2ZSBkZXN0aW5hdGlvbnMgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtNb25lcm9UeFF1ZXJ5fSBbcXVlcnkudHhRdWVyeV0gLSBnZXQgdHJhbnNmZXJzIHdob3NlIHRyYW5zYWN0aW9uIG1lZXRzIHRoaXMgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb091dGdvaW5nVHJhbnNmZXJbXT59IG91dGdvaW5nIHRyYW5zZmVycyB0aGF0IG1lZXQgdGhlIHF1ZXJ5XG4gICAqL1xuICBhc3luYyBnZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb091dGdvaW5nVHJhbnNmZXJbXT4ge1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZDogTW9uZXJvVHJhbnNmZXJRdWVyeSA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnlOb3JtYWxpemVkLmdldElzT3V0Z29pbmcoKSA9PT0gZmFsc2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlRyYW5zZmVyIHF1ZXJ5IGNvbnRyYWRpY3RzIGdldHRpbmcgb3V0Z29pbmcgdHJhbnNmZXJzXCIpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRJc091dGdvaW5nKHRydWUpO1xuICAgIHJldHVybiB0aGlzLmdldFRyYW5zZmVycyhxdWVyeU5vcm1hbGl6ZWQpIGFzIHVua25vd24gYXMgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcltdO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+R2V0IG91dHB1dHMgY3JlYXRlZCBmcm9tIHByZXZpb3VzIHRyYW5zYWN0aW9ucyB0aGF0IGJlbG9uZyB0byB0aGUgd2FsbGV0XG4gICAqIChpLmUuIHRoYXQgdGhlIHdhbGxldCBjYW4gc3BlbmQgb25lIHRpbWUpLiAgT3V0cHV0cyBhcmUgcGFydCBvZlxuICAgKiB0cmFuc2FjdGlvbnMgd2hpY2ggYXJlIHN0b3JlZCBpbiBibG9ja3Mgb24gdGhlIGJsb2NrY2hhaW4uPC9wPlxuICAgKiBcbiAgICogPHA+UmVzdWx0cyBjYW4gYmUgZmlsdGVyZWQgYnkgcGFzc2luZyBhIHF1ZXJ5IG9iamVjdC4gIE91dHB1dHMgbXVzdFxuICAgKiBtZWV0IGV2ZXJ5IGNyaXRlcmlhIGRlZmluZWQgaW4gdGhlIHF1ZXJ5IGluIG9yZGVyIHRvIGJlIHJldHVybmVkLiAgQWxsXG4gICAqIGZpbHRlcmluZyBpcyBvcHRpb25hbCBhbmQgbm8gZmlsdGVyaW5nIGlzIGFwcGxpZWQgd2hlbiBub3QgZGVmaW5lZC48L3A+XG4gICAqIFxuICAgKiBAcGFyYW0ge1Bhcml0YWw8TW9uZXJvT3V0cHV0UXVlcnk+fSBbcXVlcnldIC0gY29uZmlndXJlcyB0aGUgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LmFjY291bnRJbmRleF0gLSBnZXQgb3V0cHV0cyBhc3NvY2lhdGVkIHdpdGggYSBzcGVjaWZpYyBhY2NvdW50IGluZGV4IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5zdWJhZGRyZXNzSW5kZXhdIC0gZ2V0IG91dHB1dHMgYXNzb2NpYXRlZCB3aXRoIGEgc3BlY2lmaWMgc3ViYWRkcmVzcyBpbmRleCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7aW50W119IFtxdWVyeS5zdWJhZGRyZXNzSW5kaWNlc10gLSBnZXQgb3V0cHV0cyBhc3NvY2lhdGVkIHdpdGggc3BlY2lmaWMgc3ViYWRkcmVzcyBpbmRpY2VzIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtiaWdpbnR9IFtxdWVyeS5hbW91bnRdIC0gZ2V0IG91dHB1dHMgd2l0aCBhIHNwZWNpZmljIGFtb3VudCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7YmlnaW50fSBbcXVlcnkubWluQW1vdW50XSAtIGdldCBvdXRwdXRzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byBhIG1pbmltdW0gYW1vdW50IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtiaWdpbnR9IFtxdWVyeS5tYXhBbW91bnRdIC0gZ2V0IG91dHB1dHMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIGEgbWF4aW11bSBhbW91bnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc1NwZW50XSAtIGdldCBvdXRwdXRzIHRoYXQgYXJlIHNwZW50IG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfE1vbmVyb0tleUltYWdlfSBbcXVlcnkua2V5SW1hZ2VdIC0gZ2V0IG91dHB1dCB3aXRoIGEga2V5IGltYWdlIG9yIHdoaWNoIG1hdGNoZXMgZmllbGRzIGRlZmluZWQgaW4gYSBNb25lcm9LZXlJbWFnZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhRdWVyeX0gW3F1ZXJ5LnR4UXVlcnldIC0gZ2V0IG91dHB1dHMgd2hvc2UgdHJhbnNhY3Rpb24gbWVldHMgdGhpcyBmaWx0ZXIgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb091dHB1dFdhbGxldFtdPn0gdGhlIHF1ZXJpZWQgb3V0cHV0c1xuICAgKi9cbiAgYXN5bmMgZ2V0T3V0cHV0cyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvT3V0cHV0UXVlcnk+KTogUHJvbWlzZTxNb25lcm9PdXRwdXRXYWxsZXRbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBFeHBvcnQgb3V0cHV0cyBpbiBoZXggZm9ybWF0LlxuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthbGxdIC0gZXhwb3J0IGFsbCBvdXRwdXRzIGlmIHRydWUsIGVsc2UgZXhwb3J0IHRoZSBvdXRwdXRzIHNpbmNlIHRoZSBsYXN0IGV4cG9ydCAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSBvdXRwdXRzIGluIGhleCBmb3JtYXRcbiAgICovXG4gIGFzeW5jIGV4cG9ydE91dHB1dHMoYWxsID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbXBvcnQgb3V0cHV0cyBpbiBoZXggZm9ybWF0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG91dHB1dHNIZXggLSBvdXRwdXRzIGluIGhleCBmb3JtYXRcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB0aGUgbnVtYmVyIG9mIG91dHB1dHMgaW1wb3J0ZWRcbiAgICovXG4gIGFzeW5jIGltcG9ydE91dHB1dHMob3V0cHV0c0hleDogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRXhwb3J0IHNpZ25lZCBrZXkgaW1hZ2VzLlxuICAgKiBcbiAgICogQHBhcmFtIHtib29sZWFufSBbYWxsXSAtIGV4cG9ydCBhbGwga2V5IGltYWdlcyBpZiB0cnVlLCBlbHNlIGV4cG9ydCB0aGUga2V5IGltYWdlcyBzaW5jZSB0aGUgbGFzdCBleHBvcnQgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT59IHRoZSB3YWxsZXQncyBzaWduZWQga2V5IGltYWdlc1xuICAgKi9cbiAgYXN5bmMgZXhwb3J0S2V5SW1hZ2VzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEltcG9ydCBzaWduZWQga2V5IGltYWdlcyBhbmQgdmVyaWZ5IHRoZWlyIHNwZW50IHN0YXR1cy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvS2V5SW1hZ2VbXX0ga2V5SW1hZ2VzIC0gaW1hZ2VzIHRvIGltcG9ydCBhbmQgdmVyaWZ5IChyZXF1aXJlcyBoZXggYW5kIHNpZ25hdHVyZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdD59IHJlc3VsdHMgb2YgdGhlIGltcG9ydFxuICAgKi9cbiAgYXN5bmMgaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlczogTW9uZXJvS2V5SW1hZ2VbXSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IG5ldyBrZXkgaW1hZ2VzIGZyb20gdGhlIGxhc3QgaW1wb3J0ZWQgb3V0cHV0cy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT59IHRoZSBrZXkgaW1hZ2VzIGZyb20gdGhlIGxhc3QgaW1wb3J0ZWQgb3V0cHV0c1xuICAgKi9cbiAgYXN5bmMgZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEZyZWV6ZSBhbiBvdXRwdXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SW1hZ2UgLSBrZXkgaW1hZ2Ugb2YgdGhlIG91dHB1dCB0byBmcmVlemVcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIGZyZWV6ZU91dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFRoYXcgYSBmcm96ZW4gb3V0cHV0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUltYWdlIC0ga2V5IGltYWdlIG9mIHRoZSBvdXRwdXQgdG8gdGhhd1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgdGhhd091dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENoZWNrIGlmIGFuIG91dHB1dCBpcyBmcm96ZW4uXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SW1hZ2UgLSBrZXkgaW1hZ2Ugb2YgdGhlIG91dHB1dCB0byBjaGVjayBpZiBmcm96ZW5cbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgb3V0cHV0IGlzIGZyb3plbiwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBpc091dHB1dEZyb3plbihrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENyZWF0ZSBhIHRyYW5zYWN0aW9uIHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gdGhpcyB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4Q29uZmlnfSBjb25maWcgLSBjb25maWd1cmVzIHRoZSB0cmFuc2FjdGlvbiB0byBjcmVhdGUgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmFkZHJlc3MgLSBzaW5nbGUgZGVzdGluYXRpb24gYWRkcmVzcyAocmVxdWlyZWQgdW5sZXNzIGBkZXN0aW5hdGlvbnNgIHByb3ZpZGVkKVxuICAgKiBAcGFyYW0ge2JpZ2ludHxzdHJpbmd9IGNvbmZpZy5hbW91bnQgLSBzaW5nbGUgZGVzdGluYXRpb24gYW1vdW50IChyZXF1aXJlZCB1bmxlc3MgYGRlc3RpbmF0aW9uc2AgcHJvdmlkZWQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBjb25maWcuYWNjb3VudEluZGV4IC0gc291cmNlIGFjY291bnQgaW5kZXggdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSAocmVxdWlyZWQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnN1YmFkZHJlc3NJbmRleF0gLSBzb3VyY2Ugc3ViYWRkcmVzcyBpbmRleCB0byB0cmFuc2ZlciBmdW5kcyBmcm9tIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJbXX0gW2NvbmZpZy5zdWJhZGRyZXNzSW5kaWNlc10gLSBzb3VyY2Ugc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucmVsYXldIC0gcmVsYXkgdGhlIHRyYW5zYWN0aW9uIHRvIHBlZXJzIHRvIGNvbW1pdCB0byB0aGUgYmxvY2tjaGFpbiAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHBhcmFtIHtNb25lcm9UeFByaW9yaXR5fSBbY29uZmlnLnByaW9yaXR5XSAtIHRyYW5zYWN0aW9uIHByaW9yaXR5IChkZWZhdWx0IE1vbmVyb1R4UHJpb3JpdHkuTk9STUFMKVxuICAgKiBAcGFyYW0ge01vbmVyb0Rlc3RpbmF0aW9uW119IGNvbmZpZy5kZXN0aW5hdGlvbnMgLSBhZGRyZXNzZXMgYW5kIGFtb3VudHMgaW4gYSBtdWx0aS1kZXN0aW5hdGlvbiB0eCAocmVxdWlyZWQgdW5sZXNzIGBhZGRyZXNzYCBhbmQgYGFtb3VudGAgcHJvdmlkZWQpXG4gICAqIEBwYXJhbSB7bnVtYmVyW119IFtjb25maWcuc3VidHJhY3RGZWVGcm9tXSAtIGxpc3Qgb2YgZGVzdGluYXRpb24gaW5kaWNlcyB0byBzcGxpdCB0aGUgdHJhbnNhY3Rpb24gZmVlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGF5bWVudElkXSAtIHRyYW5zYWN0aW9uIHBheW1lbnQgSUQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludHxzdHJpbmd9IFtjb25maWcudW5sb2NrVGltZV0gLSBtaW5pbXVtIGhlaWdodCBvciB0aW1lc3RhbXAgZm9yIHRoZSB0cmFuc2FjdGlvbiB0byB1bmxvY2sgKGRlZmF1bHQgMClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldD59IHRoZSBjcmVhdGVkIHRyYW5zYWN0aW9uXG4gICAqL1xuICBhc3luYyBjcmVhdGVUeChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4ge1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQ6IE1vbmVyb1R4Q29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgIT09IHVuZGVmaW5lZCkgYXNzZXJ0LmVxdWFsKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSwgZmFsc2UsIFwiQ2Fubm90IHNwbGl0IHRyYW5zYWN0aW9ucyB1c2luZyBjcmVhdGVUeCgpOyB1c2UgY3JlYXRlVHhzKClcIik7XG4gICAgY29uZmlnTm9ybWFsaXplZC5zZXRDYW5TcGxpdChmYWxzZSk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNyZWF0ZVR4cyhjb25maWdOb3JtYWxpemVkKSlbMF07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDcmVhdGUgb25lIG9yIG1vcmUgdHJhbnNhY3Rpb25zIHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gdGhpcyB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvVHhDb25maWc+fSBjb25maWcgLSBjb25maWd1cmVzIHRoZSB0cmFuc2FjdGlvbnMgdG8gY3JlYXRlIChyZXF1aXJlZClcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5hZGRyZXNzIC0gc2luZ2xlIGRlc3RpbmF0aW9uIGFkZHJlc3MgKHJlcXVpcmVkIHVubGVzcyBgZGVzdGluYXRpb25zYCBwcm92aWRlZClcbiAgICogQHBhcmFtIHtiaWdpbnR8c3RyaW5nfSBjb25maWcuYW1vdW50IC0gc2luZ2xlIGRlc3RpbmF0aW9uIGFtb3VudCAocmVxdWlyZWQgdW5sZXNzIGBkZXN0aW5hdGlvbnNgIHByb3ZpZGVkKVxuICAgKiBAcGFyYW0ge251bWJlcn0gY29uZmlnLmFjY291bnRJbmRleCAtIHNvdXJjZSBhY2NvdW50IGluZGV4IHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy5zdWJhZGRyZXNzSW5kZXhdIC0gc291cmNlIHN1YmFkZHJlc3MgaW5kZXggdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7aW50W119IFtjb25maWcuc3ViYWRkcmVzc0luZGljZXNdIC0gc291cmNlIHN1YmFkZHJlc3MgaW5kaWNlcyB0byB0cmFuc2ZlciBmdW5kcyBmcm9tIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnJlbGF5XSAtIHJlbGF5IHRoZSB0cmFuc2FjdGlvbnMgdG8gcGVlcnMgdG8gY29tbWl0IHRvIHRoZSBibG9ja2NoYWluIChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UHJpb3JpdHl9IFtjb25maWcucHJpb3JpdHldIC0gdHJhbnNhY3Rpb24gcHJpb3JpdHkgKGRlZmF1bHQgTW9uZXJvVHhQcmlvcml0eS5OT1JNQUwpXG4gICAqIEBwYXJhbSB7TW9uZXJvRGVzdGluYXRpb25bXSB8IE1vbmVyb0Rlc3RpbmF0aW9uTW9kZWxbXX0gY29uZmlnLmRlc3RpbmF0aW9ucyAtIGFkZHJlc3NlcyBhbmQgYW1vdW50cyBpbiBhIG11bHRpLWRlc3RpbmF0aW9uIHR4IChyZXF1aXJlZCB1bmxlc3MgYGFkZHJlc3NgIGFuZCBgYW1vdW50YCBwcm92aWRlZClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGF5bWVudElkXSAtIHRyYW5zYWN0aW9uIHBheW1lbnQgSUQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludHxzdHJpbmd9IFtjb25maWcudW5sb2NrVGltZV0gLSBtaW5pbXVtIGhlaWdodCBvciB0aW1lc3RhbXAgZm9yIHRoZSB0cmFuc2FjdGlvbnMgdG8gdW5sb2NrIChkZWZhdWx0IDApXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5jYW5TcGxpdF0gLSBhbGxvdyBmdW5kcyB0byBiZSB0cmFuc2ZlcnJlZCB1c2luZyBtdWx0aXBsZSB0cmFuc2FjdGlvbnMgKGRlZmF1bHQgdHJ1ZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPn0gdGhlIGNyZWF0ZWQgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBjcmVhdGVUeHMoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTd2VlcCBhbiBvdXRwdXQgYnkga2V5IGltYWdlLlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPn0gY29uZmlnIC0gY29uZmlndXJlcyB0aGUgdHJhbnNhY3Rpb24gdG8gY3JlYXRlIChyZXF1aXJlZClcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5hZGRyZXNzIC0gc2luZ2xlIGRlc3RpbmF0aW9uIGFkZHJlc3MgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmtleUltYWdlIC0ga2V5IGltYWdlIHRvIHN3ZWVwIChyZXF1aXJlZClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnJlbGF5XSAtIHJlbGF5IHRoZSB0cmFuc2FjdGlvbiB0byBwZWVycyB0byBjb21taXQgdG8gdGhlIGJsb2NrY2hhaW4gKGRlZmF1bHQgZmFsc2UpXG4gICAqIEBwYXJhbSB7YmlnaW50fHN0cmluZ30gW2NvbmZpZy51bmxvY2tUaW1lXSAtIG1pbmltdW0gaGVpZ2h0IG9yIHRpbWVzdGFtcCBmb3IgdGhlIHRyYW5zYWN0aW9uIHRvIHVubG9jayAoZGVmYXVsdCAwKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UHJpb3JpdHl9IFtjb25maWcucHJpb3JpdHldIC0gdHJhbnNhY3Rpb24gcHJpb3JpdHkgKGRlZmF1bHQgTW9uZXJvVHhQcmlvcml0eS5OT1JNQUwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhXYWxsZXQ+fSB0aGUgY3JlYXRlZCB0cmFuc2FjdGlvblxuICAgKi9cbiAgYXN5bmMgc3dlZXBPdXRwdXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN3ZWVwIGFsbCB1bmxvY2tlZCBmdW5kcyBhY2NvcmRpbmcgdG8gdGhlIGdpdmVuIGNvbmZpZ3VyYXRpb24uXG4gICAqIFxuICAgKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvVHhDb25maWc+fSBjb25maWcgLSBjb25maWd1cmVzIHRoZSB0cmFuc2FjdGlvbnMgdG8gY3JlYXRlIChyZXF1aXJlZClcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5hZGRyZXNzIC0gc2luZ2xlIGRlc3RpbmF0aW9uIGFkZHJlc3MgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy5hY2NvdW50SW5kZXhdIC0gc291cmNlIGFjY291bnQgaW5kZXggdG8gc3dlZXAgZnJvbSAob3B0aW9uYWwsIGRlZmF1bHRzIHRvIGFsbCBhY2NvdW50cylcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcuc3ViYWRkcmVzc0luZGV4XSAtIHNvdXJjZSBzdWJhZGRyZXNzIGluZGV4IHRvIHN3ZWVwIGZyb20gKG9wdGlvbmFsLCBkZWZhdWx0cyB0byBhbGwgc3ViYWRkcmVzc2VzKVxuICAgKiBAcGFyYW0ge251bWJlcltdfSBbY29uZmlnLnN1YmFkZHJlc3NJbmRpY2VzXSAtIHNvdXJjZSBzdWJhZGRyZXNzIGluZGljZXMgdG8gc3dlZXAgZnJvbSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5yZWxheV0gLSByZWxheSB0aGUgdHJhbnNhY3Rpb25zIHRvIHBlZXJzIHRvIGNvbW1pdCB0byB0aGUgYmxvY2tjaGFpbiAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHBhcmFtIHtNb25lcm9UeFByaW9yaXR5fSBbY29uZmlnLnByaW9yaXR5XSAtIHRyYW5zYWN0aW9uIHByaW9yaXR5IChkZWZhdWx0IE1vbmVyb1R4UHJpb3JpdHkuTk9STUFMKVxuICAgKiBAcGFyYW0ge2JpZ2ludHxzdHJpbmd9IFtjb25maWcudW5sb2NrVGltZV0gLSBtaW5pbXVtIGhlaWdodCBvciB0aW1lc3RhbXAgZm9yIHRoZSB0cmFuc2FjdGlvbnMgdG8gdW5sb2NrIChkZWZhdWx0IDApXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5zd2VlcEVhY2hTdWJhZGRyZXNzXSAtIHN3ZWVwIGVhY2ggc3ViYWRkcmVzcyBpbmRpdmlkdWFsbHkgaWYgdHJ1ZSAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPn0gdGhlIGNyZWF0ZWQgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBzd2VlcFVubG9ja2VkKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+U3dlZXAgYWxsIHVubWl4YWJsZSBkdXN0IG91dHB1dHMgYmFjayB0byB0aGUgd2FsbGV0IHRvIG1ha2UgdGhlbSBlYXNpZXIgdG8gc3BlbmQgYW5kIG1peC48L3A+XG4gICAqIFxuICAgKiA8cD5OT1RFOiBEdXN0IG9ubHkgZXhpc3RzIHByZSBSQ1QsIHNvIHRoaXMgbWV0aG9kIHdpbGwgdGhyb3cgXCJubyBkdXN0IHRvIHN3ZWVwXCIgb24gbmV3IHdhbGxldHMuPC9wPlxuICAgKiBcbiAgICogQHBhcmFtIHtib29sZWFufSBbcmVsYXldIC0gc3BlY2lmaWVzIGlmIHRoZSByZXN1bHRpbmcgdHJhbnNhY3Rpb24gc2hvdWxkIGJlIHJlbGF5ZWQgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhXYWxsZXRbXT59IHRoZSBjcmVhdGVkIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgc3dlZXBEdXN0KHJlbGF5PzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZWxheSBhIHByZXZpb3VzbHkgY3JlYXRlZCB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7KE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKX0gdHhPck1ldGFkYXRhIC0gdHJhbnNhY3Rpb24gb3IgaXRzIG1ldGFkYXRhIHRvIHJlbGF5XG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIGhhc2ggb2YgdGhlIHJlbGF5ZWQgdHhcbiAgICovXG4gIGFzeW5jIHJlbGF5VHgodHhPck1ldGFkYXRhOiBNb25lcm9UeFdhbGxldCB8IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLnJlbGF5VHhzKFt0eE9yTWV0YWRhdGFdKSlbMF07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZWxheSBwcmV2aW91c2x5IGNyZWF0ZWQgdHJhbnNhY3Rpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHsoTW9uZXJvVHhXYWxsZXRbXSB8IHN0cmluZ1tdKX0gdHhzT3JNZXRhZGF0YXMgLSB0cmFuc2FjdGlvbnMgb3IgdGhlaXIgbWV0YWRhdGEgdG8gcmVsYXlcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmdbXT59IHRoZSBoYXNoZXMgb2YgdGhlIHJlbGF5ZWQgdHhzXG4gICAqL1xuICBhc3luYyByZWxheVR4cyh0eHNPck1ldGFkYXRhczogKE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKVtdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZXNjcmliZSBhIHR4IHNldCBmcm9tIHVuc2lnbmVkIHR4IGhleC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1bnNpZ25lZFR4SGV4IC0gdW5zaWduZWQgdHggaGV4XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhTZXQ+fSB0aGUgdHggc2V0IGNvbnRhaW5pbmcgc3RydWN0dXJlZCB0cmFuc2FjdGlvbnNcbiAgICovXG4gIGFzeW5jIGRlc2NyaWJlVW5zaWduZWRUeFNldCh1bnNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgcmV0dXJuIHRoaXMuZGVzY3JpYmVUeFNldChuZXcgTW9uZXJvVHhTZXQoKS5zZXRVbnNpZ25lZFR4SGV4KHVuc2lnbmVkVHhIZXgpKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlc2NyaWJlIGEgdHggc2V0IGZyb20gbXVsdGlzaWcgdHggaGV4LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG11bHRpc2lnVHhIZXggLSBtdWx0aXNpZyB0eCBoZXhcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFNldD59IHRoZSB0eCBzZXQgY29udGFpbmluZyBzdHJ1Y3R1cmVkIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgZGVzY3JpYmVNdWx0aXNpZ1R4U2V0KG11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICByZXR1cm4gdGhpcy5kZXNjcmliZVR4U2V0KG5ldyBNb25lcm9UeFNldCgpLnNldE11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleCkpO1xuICB9XG4gIFxuICAvKipcbiAgICogRGVzY3JpYmUgYSB0eCBzZXQgY29udGFpbmluZyB1bnNpZ25lZCBvciBtdWx0aXNpZyB0eCBoZXggdG8gYSBuZXcgdHggc2V0IGNvbnRhaW5pbmcgc3RydWN0dXJlZCB0cmFuc2FjdGlvbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4U2V0fSB0eFNldCAtIGEgdHggc2V0IGNvbnRhaW5pbmcgdW5zaWduZWQgb3IgbXVsdGlzaWcgdHggaGV4XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhTZXQ+fSB0eFNldCAtIHRoZSB0eCBzZXQgY29udGFpbmluZyBzdHJ1Y3R1cmVkIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgZGVzY3JpYmVUeFNldCh0eFNldDogTW9uZXJvVHhTZXQpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNpZ24gdW5zaWduZWQgdHJhbnNhY3Rpb25zIGZyb20gYSB2aWV3LW9ubHkgd2FsbGV0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVuc2lnbmVkVHhIZXggLSB1bnNpZ25lZCB0cmFuc2FjdGlvbiBoZXggZnJvbSB3aGVuIHRoZSB0cmFuc2FjdGlvbnMgd2VyZSBjcmVhdGVkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhTZXQ+fSB0aGUgc2lnbmVkIHRyYW5zYWN0aW9uIHNldFxuICAgKi9cbiAgYXN5bmMgc2lnblR4cyh1bnNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN1Ym1pdCBzaWduZWQgdHJhbnNhY3Rpb25zIGZyb20gYSB2aWV3LW9ubHkgd2FsbGV0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNpZ25lZFR4SGV4IC0gc2lnbmVkIHRyYW5zYWN0aW9uIGhleCBmcm9tIHNpZ25UeHMoKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZ1tdPn0gdGhlIHJlc3VsdGluZyB0cmFuc2FjdGlvbiBoYXNoZXNcbiAgICovXG4gIGFzeW5jIHN1Ym1pdFR4cyhzaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTaWduIGEgbWVzc2FnZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIC0gdGhlIG1lc3NhZ2UgdG8gc2lnblxuICAgKiBAcGFyYW0ge01vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlfSBbc2lnbmF0dXJlVHlwZV0gLSBzaWduIHdpdGggc3BlbmQga2V5IG9yIHZpZXcga2V5IChkZWZhdWx0IHNwZW5kIGtleSlcbiAgICogQHBhcmFtIHtudW1iZXJ9IFthY2NvdW50SWR4XSAtIHRoZSBhY2NvdW50IGluZGV4IG9mIHRoZSBtZXNzYWdlIHNpZ25hdHVyZSAoZGVmYXVsdCAwKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N1YmFkZHJlc3NJZHhdIC0gdGhlIHN1YmFkZHJlc3MgaW5kZXggb2YgdGhlIG1lc3NhZ2Ugc2lnbmF0dXJlIChkZWZhdWx0IDApXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHNpZ25hdHVyZVxuICAgKi9cbiAgYXN5bmMgc2lnbk1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBzaWduYXR1cmVUeXBlID0gTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUuU0lHTl9XSVRIX1NQRU5EX0tFWSwgYWNjb3VudElkeCA9IDAsIHN1YmFkZHJlc3NJZHggPSAwKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogVmVyaWZ5IGEgc2lnbmF0dXJlIG9uIGEgbWVzc2FnZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtZXNzYWdlIC0gc2lnbmVkIG1lc3NhZ2VcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBzaWduaW5nIGFkZHJlc3NcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNpZ25hdHVyZSAtIHNpZ25hdHVyZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQ+fSB0cnVlIGlmIHRoZSBzaWduYXR1cmUgaXMgZ29vZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyB2ZXJpZnlNZXNzYWdlKG1lc3NhZ2U6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSB0cmFuc2FjdGlvbidzIHNlY3JldCBrZXkgZnJvbSBpdHMgaGFzaC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSB0cmFuc2FjdGlvbidzIGhhc2hcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSAtIHRyYW5zYWN0aW9uJ3Mgc2VjcmV0IGtleVxuICAgKi9cbiAgYXN5bmMgZ2V0VHhLZXkodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDaGVjayBhIHRyYW5zYWN0aW9uIGluIHRoZSBibG9ja2NoYWluIHdpdGggaXRzIHNlY3JldCBrZXkuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gdHJhbnNhY3Rpb24gdG8gY2hlY2tcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4S2V5IC0gdHJhbnNhY3Rpb24ncyBzZWNyZXQga2V5XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gZGVzdGluYXRpb24gcHVibGljIGFkZHJlc3Mgb2YgdGhlIHRyYW5zYWN0aW9uXG4gICAqIEByZXR1cm4ge3JvbWlzZTxNb25lcm9DaGVja1R4Pn0gdGhlIHJlc3VsdCBvZiB0aGUgY2hlY2tcbiAgICovXG4gIGFzeW5jIGNoZWNrVHhLZXkodHhIYXNoOiBzdHJpbmcsIHR4S2V5OiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSB0cmFuc2FjdGlvbiBzaWduYXR1cmUgdG8gcHJvdmUgaXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gdHJhbnNhY3Rpb24gdG8gcHJvdmVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBkZXN0aW5hdGlvbiBwdWJsaWMgYWRkcmVzcyBvZiB0aGUgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtzdHJpbmd9IFttZXNzYWdlXSAtIG1lc3NhZ2UgdG8gaW5jbHVkZSB3aXRoIHRoZSBzaWduYXR1cmUgdG8gZnVydGhlciBhdXRoZW50aWNhdGUgdGhlIHByb29mIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgdHJhbnNhY3Rpb24gc2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBnZXRUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBQcm92ZSBhIHRyYW5zYWN0aW9uIGJ5IGNoZWNraW5nIGl0cyBzaWduYXR1cmUuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gdHJhbnNhY3Rpb24gdG8gcHJvdmVcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBkZXN0aW5hdGlvbiBwdWJsaWMgYWRkcmVzcyBvZiB0aGUgdHJhbnNhY3Rpb25cbiAgICogQHBhcmFtIHtzdHJpbmcgfCB1bmRlZmluZWR9IG1lc3NhZ2UgLSBtZXNzYWdlIGluY2x1ZGVkIHdpdGggdGhlIHNpZ25hdHVyZSB0byBmdXJ0aGVyIGF1dGhlbnRpY2F0ZSB0aGUgcHJvb2ZcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNpZ25hdHVyZSAgLSB0cmFuc2FjdGlvbiBzaWduYXR1cmUgdG8gY29uZmlybVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0NoZWNrVHg+fSB0aGUgcmVzdWx0IG9mIHRoZSBjaGVja1xuICAgKi9cbiAgYXN5bmMgY2hlY2tUeFByb29mKHR4SGFzaDogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2VuZXJhdGUgYSBzaWduYXR1cmUgdG8gcHJvdmUgYSBzcGVuZC4gVW5saWtlIHByb3ZpbmcgYSB0cmFuc2FjdGlvbiwgaXQgZG9lcyBub3QgcmVxdWlyZSB0aGUgZGVzdGluYXRpb24gcHVibGljIGFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gdHJhbnNhY3Rpb24gdG8gcHJvdmVcbiAgICogQHBhcmFtIHtzdHJpbmd9IFttZXNzYWdlXSAtIG1lc3NhZ2UgdG8gaW5jbHVkZSB3aXRoIHRoZSBzaWduYXR1cmUgdG8gZnVydGhlciBhdXRoZW50aWNhdGUgdGhlIHByb29mIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgdHJhbnNhY3Rpb24gc2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBnZXRTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogUHJvdmUgYSBzcGVuZCB1c2luZyBhIHNpZ25hdHVyZS4gVW5saWtlIHByb3ZpbmcgYSB0cmFuc2FjdGlvbiwgaXQgZG9lcyBub3QgcmVxdWlyZSB0aGUgZGVzdGluYXRpb24gcHVibGljIGFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gdHJhbnNhY3Rpb24gdG8gcHJvdmVcbiAgICogQHBhcmFtIHtzdHJpbmcgfCB1bmRlZmluZWR9IG1lc3NhZ2UgLSBtZXNzYWdlIGluY2x1ZGVkIHdpdGggdGhlIHNpZ25hdHVyZSB0byBmdXJ0aGVyIGF1dGhlbnRpY2F0ZSB0aGUgcHJvb2YgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2lnbmF0dXJlIC0gdHJhbnNhY3Rpb24gc2lnbmF0dXJlIHRvIGNvbmZpcm1cbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgc2lnbmF0dXJlIGlzIGdvb2QsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgY2hlY2tTcGVuZFByb29mKHR4SGFzaDogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdlbmVyYXRlIGEgc2lnbmF0dXJlIHRvIHByb3ZlIHRoZSBlbnRpcmUgYmFsYW5jZSBvZiB0aGUgd2FsbGV0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IFttZXNzYWdlXSAtIG1lc3NhZ2UgaW5jbHVkZWQgd2l0aCB0aGUgc2lnbmF0dXJlIHRvIGZ1cnRoZXIgYXV0aGVudGljYXRlIHRoZSBwcm9vZiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHJlc2VydmUgcHJvb2Ygc2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZXYWxsZXQobWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdlbmVyYXRlIGEgc2lnbmF0dXJlIHRvIHByb3ZlIGFuIGF2YWlsYWJsZSBhbW91bnQgaW4gYW4gYWNjb3VudC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gYWNjb3VudCB0byBwcm92ZSBvd25lcnNoaXAgb2YgdGhlIGFtb3VudFxuICAgKiBAcGFyYW0ge2JpZ2ludH0gYW1vdW50IC0gbWluaW11bSBhbW91bnQgdG8gcHJvdmUgYXMgYXZhaWxhYmxlIGluIHRoZSBhY2NvdW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbWVzc2FnZV0gLSBtZXNzYWdlIHRvIGluY2x1ZGUgd2l0aCB0aGUgc2lnbmF0dXJlIHRvIGZ1cnRoZXIgYXV0aGVudGljYXRlIHRoZSBwcm9vZiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHJlc2VydmUgcHJvb2Ygc2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBnZXRSZXNlcnZlUHJvb2ZBY2NvdW50KGFjY291bnRJZHg6IG51bWJlciwgYW1vdW50OiBiaWdpbnQsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogUHJvdmVzIGEgd2FsbGV0IGhhcyBhIGRpc3Bvc2FibGUgcmVzZXJ2ZSB1c2luZyBhIHNpZ25hdHVyZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gcHVibGljIHdhbGxldCBhZGRyZXNzXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgdW5kZWZpbmVkfSBtZXNzYWdlIC0gbWVzc2FnZSBpbmNsdWRlZCB3aXRoIHRoZSBzaWduYXR1cmUgdG8gZnVydGhlciBhdXRoZW50aWNhdGUgdGhlIHByb29mIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNpZ25hdHVyZSAtIHJlc2VydmUgcHJvb2Ygc2lnbmF0dXJlIHRvIGNoZWNrXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQ2hlY2tSZXNlcnZlPn0gdGhlIHJlc3VsdCBvZiBjaGVja2luZyB0aGUgc2lnbmF0dXJlIHByb29mXG4gICAqL1xuICBhc3luYyBjaGVja1Jlc2VydmVQcm9vZihhZGRyZXNzOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrUmVzZXJ2ZT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYSB0cmFuc2FjdGlvbiBub3RlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIHRyYW5zYWN0aW9uIHRvIGdldCB0aGUgbm90ZSBvZlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB0eCBub3RlXG4gICAqL1xuICBhc3luYyBnZXRUeE5vdGUodHhIYXNoOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRUeE5vdGVzKFt0eEhhc2hdKSlbMF07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgbm90ZXMgZm9yIG11bHRpcGxlIHRyYW5zYWN0aW9ucy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IHR4SGFzaGVzIC0gaGFzaGVzIG9mIHRoZSB0cmFuc2FjdGlvbnMgdG8gZ2V0IG5vdGVzIGZvclxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZ1tdPn0gbm90ZXMgZm9yIHRoZSB0cmFuc2FjdGlvbnNcbiAgICovXG4gIGFzeW5jIGdldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgYSBub3RlIGZvciBhIHNwZWNpZmljIHRyYW5zYWN0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIGhhc2ggb2YgdGhlIHRyYW5zYWN0aW9uIHRvIHNldCBhIG5vdGUgZm9yXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBub3RlIC0gdGhlIHRyYW5zYWN0aW9uIG5vdGVcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldFR4Tm90ZSh0eEhhc2g6IHN0cmluZywgbm90ZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5zZXRUeE5vdGVzKFt0eEhhc2hdLCBbbm90ZV0pO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IG5vdGVzIGZvciBtdWx0aXBsZSB0cmFuc2FjdGlvbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSB0eEhhc2hlcyAtIHRyYW5zYWN0aW9ucyB0byBzZXQgbm90ZXMgZm9yXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IG5vdGVzIC0gbm90ZXMgdG8gc2V0IGZvciB0aGUgdHJhbnNhY3Rpb25zXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSwgbm90ZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhZGRyZXNzIGJvb2sgZW50cmllcy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyW119IFtlbnRyeUluZGljZXNdIC0gaW5kaWNlcyBvZiB0aGUgZW50cmllcyB0byBnZXRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9BZGRyZXNzQm9va0VudHJ5W10+fSB0aGUgYWRkcmVzcyBib29rIGVudHJpZXNcbiAgICovXG4gIGFzeW5jIGdldEFkZHJlc3NCb29rRW50cmllcyhlbnRyeUluZGljZXM/OiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEFkZCBhbiBhZGRyZXNzIGJvb2sgZW50cnkuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIGVudHJ5IGFkZHJlc3NcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtkZXNjcmlwdGlvbl0gLSBlbnRyeSBkZXNjcmlwdGlvbiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIGluZGV4IG9mIHRoZSBhZGRlZCBlbnRyeVxuICAgKi9cbiAgYXN5bmMgYWRkQWRkcmVzc0Jvb2tFbnRyeShhZGRyZXNzOiBzdHJpbmcsIGRlc2NyaXB0aW9uPzogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRWRpdCBhbiBhZGRyZXNzIGJvb2sgZW50cnkuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gaW5kZXggLSBpbmRleCBvZiB0aGUgYWRkcmVzcyBib29rIGVudHJ5IHRvIGVkaXRcbiAgICogQHBhcmFtIHtib29sZWFufSBzZXRBZGRyZXNzIC0gc3BlY2lmaWVzIGlmIHRoZSBhZGRyZXNzIHNob3VsZCBiZSB1cGRhdGVkXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgdW5kZWZpbmVkfSBhZGRyZXNzIC0gdXBkYXRlZCBhZGRyZXNzXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2V0RGVzY3JpcHRpb24gLSBzcGVjaWZpZXMgaWYgdGhlIGRlc2NyaXB0aW9uIHNob3VsZCBiZSB1cGRhdGVkXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgdW5kZWZpbmVkfSBkZXNjcmlwdGlvbiAtIHVwZGF0ZWQgZGVzY3JpcHRpb25cbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIGVkaXRBZGRyZXNzQm9va0VudHJ5KGluZGV4OiBudW1iZXIsIHNldEFkZHJlc3M6IGJvb2xlYW4sIGFkZHJlc3M6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2V0RGVzY3JpcHRpb246IGJvb2xlYW4sIGRlc2NyaXB0aW9uOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRGVsZXRlIGFuIGFkZHJlc3MgYm9vayBlbnRyeS5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBlbnRyeUlkeCAtIGluZGV4IG9mIHRoZSBlbnRyeSB0byBkZWxldGVcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIGRlbGV0ZUFkZHJlc3NCb29rRW50cnkoZW50cnlJZHg6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBUYWcgYWNjb3VudHMuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIC0gdGFnIHRvIGFwcGx5IHRvIHRoZSBzcGVjaWZpZWQgYWNjb3VudHNcbiAgICogQHBhcmFtIHtudW1iZXJbXX0gYWNjb3VudEluZGljZXMgLSBpbmRpY2VzIG9mIHRoZSBhY2NvdW50cyB0byB0YWdcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHRhZ0FjY291bnRzKHRhZzogc3RyaW5nLCBhY2NvdW50SW5kaWNlczogbnVtYmVyW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFVudGFnIGFjY291bnRzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJbXX0gYWNjb3VudEluZGljZXMgLSBpbmRpY2VzIG9mIHRoZSBhY2NvdW50cyB0byB1bnRhZ1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgdW50YWdBY2NvdW50cyhhY2NvdW50SW5kaWNlczogbnVtYmVyW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogUmV0dXJuIGFsbCBhY2NvdW50IHRhZ3MuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0FjY291bnRUYWdbXT59IHRoZSB3YWxsZXQncyBhY2NvdW50IHRhZ3NcbiAgICovXG4gIGFzeW5jIGdldEFjY291bnRUYWdzKCk6IFByb21pc2U8TW9uZXJvQWNjb3VudFRhZ1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXRzIGEgaHVtYW4tcmVhZGFibGUgZGVzY3JpcHRpb24gZm9yIGEgdGFnLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyAtIHRhZyB0byBzZXQgYSBkZXNjcmlwdGlvbiBmb3JcbiAgICogQHBhcmFtIHtzdHJpbmd9IGxhYmVsIC0gbGFiZWwgdG8gc2V0IGZvciB0aGUgdGFnXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRBY2NvdW50VGFnTGFiZWwodGFnOiBzdHJpbmcsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ3JlYXRlcyBhIHBheW1lbnQgVVJJIGZyb20gYSBzZW5kIGNvbmZpZ3VyYXRpb24uXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4Q29uZmlnfSBjb25maWcgLSBzcGVjaWZpZXMgY29uZmlndXJhdGlvbiBmb3IgYSBwb3RlbnRpYWwgdHhcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgcGF5bWVudCB1cmlcbiAgICovXG4gIGFzeW5jIGdldFBheW1lbnRVcmkoY29uZmlnOiBNb25lcm9UeENvbmZpZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFBhcnNlcyBhIHBheW1lbnQgVVJJIHRvIGEgdHggY29uZmlnLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVyaSAtIHBheW1lbnQgdXJpIHRvIHBhcnNlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhDb25maWc+fSB0aGUgc2VuZCBjb25maWd1cmF0aW9uIHBhcnNlZCBmcm9tIHRoZSB1cmlcbiAgICovXG4gIGFzeW5jIHBhcnNlUGF5bWVudFVyaSh1cmk6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhDb25maWc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGFuIGF0dHJpYnV0ZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSBhdHRyaWJ1dGUgdG8gZ2V0IHRoZSB2YWx1ZSBvZlxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSBhdHRyaWJ1dGUncyB2YWx1ZVxuICAgKi9cbiAgYXN5bmMgZ2V0QXR0cmlidXRlKGtleTogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IGFuIGFyYml0cmFyeSBhdHRyaWJ1dGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IC0gYXR0cmlidXRlIGtleVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsIC0gYXR0cmlidXRlIHZhbHVlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcsIHZhbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0YXJ0IG1pbmluZy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbbnVtVGhyZWFkc10gLSBudW1iZXIgb2YgdGhyZWFkcyBjcmVhdGVkIGZvciBtaW5pbmcgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtiYWNrZ3JvdW5kTWluaW5nXSAtIHNwZWNpZmllcyBpZiBtaW5pbmcgc2hvdWxkIG9jY3VyIGluIHRoZSBiYWNrZ3JvdW5kIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbaWdub3JlQmF0dGVyeV0gLSBzcGVjaWZpZXMgaWYgdGhlIGJhdHRlcnkgc2hvdWxkIGJlIGlnbm9yZWQgZm9yIG1pbmluZyAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzdGFydE1pbmluZyhudW1UaHJlYWRzOiBudW1iZXIsIGJhY2tncm91bmRNaW5pbmc/OiBib29sZWFuLCBpZ25vcmVCYXR0ZXJ5PzogYm9vbGVhbik6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdG9wIG1pbmluZy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzdG9wTWluaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgaW1wb3J0aW5nIG11bHRpc2lnIGRhdGEgaXMgbmVlZGVkIGZvciByZXR1cm5pbmcgYSBjb3JyZWN0IGJhbGFuY2UuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIGltcG9ydGluZyBtdWx0aXNpZyBkYXRhIGlzIG5lZWRlZCBmb3IgcmV0dXJuaW5nIGEgY29ycmVjdCBiYWxhbmNlLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzTXVsdGlzaWdJbXBvcnROZWVkZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGlzIHdhbGxldCBpcyBhIG11bHRpc2lnIHdhbGxldC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhpcyBpcyBhIG11bHRpc2lnIHdhbGxldCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBpc011bHRpc2lnKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRNdWx0aXNpZ0luZm8oKSkuZ2V0SXNNdWx0aXNpZygpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IG11bHRpc2lnIGluZm8gYWJvdXQgdGhpcyB3YWxsZXQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb011bHRpc2lnSW5mbz59IG11bHRpc2lnIGluZm8gYWJvdXQgdGhpcyB3YWxsZXRcbiAgICovXG4gIGFzeW5jIGdldE11bHRpc2lnSW5mbygpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnSW5mbz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgbXVsdGlzaWcgaW5mbyBhcyBoZXggdG8gc2hhcmUgd2l0aCBwYXJ0aWNpcGFudHMgdG8gYmVnaW4gY3JlYXRpbmcgYVxuICAgKiBtdWx0aXNpZyB3YWxsZXQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoaXMgd2FsbGV0J3MgbXVsdGlzaWcgaGV4IHRvIHNoYXJlIHdpdGggcGFydGljaXBhbnRzXG4gICAqL1xuICBhc3luYyBwcmVwYXJlTXVsdGlzaWcoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogTWFrZSB0aGlzIHdhbGxldCBtdWx0aXNpZyBieSBpbXBvcnRpbmcgbXVsdGlzaWcgaGV4IGZyb20gcGFydGljaXBhbnRzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gbXVsdGlzaWdIZXhlcyAtIG11bHRpc2lnIGhleCBmcm9tIGVhY2ggcGFydGljaXBhbnRcbiAgICogQHBhcmFtIHtudW1iZXJ9IHRocmVzaG9sZCAtIG51bWJlciBvZiBzaWduYXR1cmVzIG5lZWRlZCB0byBzaWduIHRyYW5zZmVyc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gcGFzc3dvcmQgLSB3YWxsZXQgcGFzc3dvcmRcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGlzIHdhbGxldCdzIG11bHRpc2lnIGhleCB0byBzaGFyZSB3aXRoIHBhcnRpY2lwYW50c1xuICAgKi9cbiAgYXN5bmMgbWFrZU11bHRpc2lnKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCB0aHJlc2hvbGQ6IG51bWJlciwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEV4Y2hhbmdlIG11bHRpc2lnIGhleCB3aXRoIHBhcnRpY2lwYW50cyBpbiBhIE0vTiBtdWx0aXNpZyB3YWxsZXQuXG4gICAqIFxuICAgKiBUaGlzIHByb2Nlc3MgbXVzdCBiZSByZXBlYXRlZCB3aXRoIHBhcnRpY2lwYW50cyBleGFjdGx5IE4tTSB0aW1lcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IG11bHRpc2lnSGV4ZXMgYXJlIG11bHRpc2lnIGhleCBmcm9tIGVhY2ggcGFydGljaXBhbnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhc3N3b3JkIC0gd2FsbGV0J3MgcGFzc3dvcmQgLy8gVE9ETyBtb25lcm8tcHJvamVjdDogcmVkdW5kYW50PyB3YWxsZXQgaXMgY3JlYXRlZCB3aXRoIHBhc3N3b3JkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0Pn0gdGhlIHJlc3VsdCB3aGljaCBoYXMgdGhlIG11bHRpc2lnJ3MgYWRkcmVzcyB4b3IgdGhpcyB3YWxsZXQncyBtdWx0aXNpZyBoZXggdG8gc2hhcmUgd2l0aCBwYXJ0aWNpcGFudHMgaWZmIG5vdCBkb25lXG4gICAqL1xuICBhc3luYyBleGNoYW5nZU11bHRpc2lnS2V5cyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgcGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEV4cG9ydCB0aGlzIHdhbGxldCdzIG11bHRpc2lnIGluZm8gYXMgaGV4IGZvciBvdGhlciBwYXJ0aWNpcGFudHMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoaXMgd2FsbGV0J3MgbXVsdGlzaWcgaW5mbyBhcyBoZXggZm9yIG90aGVyIHBhcnRpY2lwYW50c1xuICAgKi9cbiAgYXN5bmMgZXhwb3J0TXVsdGlzaWdIZXgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkP1wiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEltcG9ydCBtdWx0aXNpZyBpbmZvIGFzIGhleCBmcm9tIG90aGVyIHBhcnRpY2lwYW50cy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IG11bHRpc2lnSGV4ZXMgLSBtdWx0aXNpZyBoZXggZnJvbSBlYWNoIHBhcnRpY2lwYW50XG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIG51bWJlciBvZiBvdXRwdXRzIHNpZ25lZCB3aXRoIHRoZSBnaXZlbiBtdWx0aXNpZyBoZXhcbiAgICovXG4gIGFzeW5jIGltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2lnbiBtdWx0aXNpZyB0cmFuc2FjdGlvbnMgZnJvbSBhIG11bHRpc2lnIHdhbGxldC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtdWx0aXNpZ1R4SGV4IC0gdW5zaWduZWQgbXVsdGlzaWcgdHJhbnNhY3Rpb25zIGFzIGhleFxuICAgKiBAcmV0dXJuIHtNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHR9IHRoZSByZXN1bHQgb2Ygc2lnbmluZyB0aGUgbXVsdGlzaWcgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBzaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnU2lnblJlc3VsdD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdWJtaXQgc2lnbmVkIG11bHRpc2lnIHRyYW5zYWN0aW9ucyBmcm9tIGEgbXVsdGlzaWcgd2FsbGV0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNpZ25lZE11bHRpc2lnVHhIZXggLSBzaWduZWQgbXVsdGlzaWcgaGV4IHJldHVybmVkIGZyb20gc2lnbk11bHRpc2lnVHhIZXgoKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZ1tdPn0gdGhlIHJlc3VsdGluZyB0cmFuc2FjdGlvbiBoYXNoZXNcbiAgICovXG4gIGFzeW5jIHN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDaGFuZ2UgdGhlIHdhbGxldCBwYXNzd29yZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvbGRQYXNzd29yZCAtIHRoZSB3YWxsZXQncyBvbGQgcGFzc3dvcmRcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5ld1Bhc3N3b3JkIC0gdGhlIHdhbGxldCdzIG5ldyBwYXNzd29yZFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQ6IHN0cmluZywgbmV3UGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTYXZlIHRoZSB3YWxsZXQgYXQgaXRzIGN1cnJlbnQgcGF0aC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzYXZlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNhdmUgdGhlbiBjbG9zZSB0aGUgd2FsbGV0LlxuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzYXZlXSAtIHNwZWNpZmllcyBpZiB0aGUgd2FsbGV0IHNob3VsZCBiZSBzYXZlZCBiZWZvcmUgYmVpbmcgY2xvc2VkIChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgY2xvc2Uoc2F2ZSA9IGZhbHNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29ubmVjdGlvbk1hbmFnZXIpIHRoaXMuY29ubmVjdGlvbk1hbmFnZXIucmVtb3ZlTGlzdGVuZXIodGhpcy5jb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyKTtcbiAgICB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmxpc3RlbmVycy5zcGxpY2UoMCwgdGhpcy5saXN0ZW5lcnMubGVuZ3RoKTtcbiAgICB0aGlzLl9pc0Nsb3NlZCA9IHRydWU7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhpcyB3YWxsZXQgaXMgY2xvc2VkIG9yIG5vdC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIHdhbGxldCBpcyBjbG9zZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNDbG9zZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMuX2lzQ2xvc2VkO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgYXN5bmMgYW5ub3VuY2VTeW5jUHJvZ3Jlc3MoaGVpZ2h0OiBudW1iZXIsIHN0YXJ0SGVpZ2h0OiBudW1iZXIsIGVuZEhlaWdodDogbnVtYmVyLCBwZXJjZW50RG9uZTogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycykge1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgbGlzdGVuZXIub25TeW5jUHJvZ3Jlc3MoaGVpZ2h0LCBzdGFydEhlaWdodCwgZW5kSGVpZ2h0LCBwZXJjZW50RG9uZSwgbWVzc2FnZSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNhbGxpbmcgbGlzdGVuZXIgb24gc3luYyBwcm9ncmVzc1wiLCBlcnIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgYXN5bmMgYW5ub3VuY2VOZXdCbG9jayhoZWlnaHQ6IG51bWJlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBsaXN0ZW5lci5vbk5ld0Jsb2NrKGhlaWdodCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNhbGxpbmcgbGlzdGVuZXIgb24gbmV3IGJsb2NrXCIsIGVycik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBhc3luYyBhbm5vdW5jZUJhbGFuY2VzQ2hhbmdlZChuZXdCYWxhbmNlOiBiaWdpbnQsIG5ld1VubG9ja2VkQmFsYW5jZTogYmlnaW50KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGxpc3RlbmVyLm9uQmFsYW5jZXNDaGFuZ2VkKG5ld0JhbGFuY2UsIG5ld1VubG9ja2VkQmFsYW5jZSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNhbGxpbmcgbGlzdGVuZXIgb24gYmFsYW5jZXMgY2hhbmdlZFwiLCBlcnIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgYXN5bmMgYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQ6IE1vbmVyb091dHB1dFdhbGxldCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzKSB7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBsaXN0ZW5lci5vbk91dHB1dFJlY2VpdmVkKG91dHB1dCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNhbGxpbmcgbGlzdGVuZXIgb24gb3V0cHV0IHJlY2VpdmVkXCIsIGVycik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBhc3luYyBhbm5vdW5jZU91dHB1dFNwZW50KG91dHB1dDogTW9uZXJvT3V0cHV0V2FsbGV0KTogUHJvbWlzZTx2b2lkPiB7XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGxpc3RlbmVyLm9uT3V0cHV0U3BlbnQob3V0cHV0KTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgY2FsbGluZyBsaXN0ZW5lciBvbiBvdXRwdXQgc3BlbnRcIiwgZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgbm9ybWFsaXplVHhRdWVyeShxdWVyeSkge1xuICAgIGlmIChxdWVyeSBpbnN0YW5jZW9mIE1vbmVyb1R4UXVlcnkpIHF1ZXJ5ID0gcXVlcnkuY29weSgpO1xuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocXVlcnkpKSBxdWVyeSA9IG5ldyBNb25lcm9UeFF1ZXJ5KCkuc2V0SGFzaGVzKHF1ZXJ5KTtcbiAgICBlbHNlIHtcbiAgICAgIHF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnkpO1xuICAgICAgcXVlcnkgPSBuZXcgTW9uZXJvVHhRdWVyeShxdWVyeSk7XG4gICAgfVxuICAgIGlmIChxdWVyeS5nZXRCbG9jaygpID09PSB1bmRlZmluZWQpIHF1ZXJ5LnNldEJsb2NrKG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbcXVlcnldKSk7XG4gICAgaWYgKHF1ZXJ5LmdldElucHV0UXVlcnkoKSkgcXVlcnkuZ2V0SW5wdXRRdWVyeSgpLnNldFR4UXVlcnkocXVlcnkpO1xuICAgIGlmIChxdWVyeS5nZXRPdXRwdXRRdWVyeSgpKSBxdWVyeS5nZXRPdXRwdXRRdWVyeSgpLnNldFR4UXVlcnkocXVlcnkpO1xuICAgIHJldHVybiBxdWVyeTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KSB7XG4gICAgcXVlcnkgPSBuZXcgTW9uZXJvVHJhbnNmZXJRdWVyeShxdWVyeSk7XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgdHhRdWVyeSA9IHF1ZXJ5LmdldFR4UXVlcnkoKS5jb3B5KCk7XG4gICAgICBxdWVyeSA9IHR4UXVlcnkuZ2V0VHJhbnNmZXJRdWVyeSgpO1xuICAgIH1cbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpID09PSB1bmRlZmluZWQpIHF1ZXJ5LnNldFR4UXVlcnkobmV3IE1vbmVyb1R4UXVlcnkoKSk7XG4gICAgcXVlcnkuZ2V0VHhRdWVyeSgpLnNldFRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0QmxvY2soKSA9PT0gdW5kZWZpbmVkKSBxdWVyeS5nZXRUeFF1ZXJ5KCkuc2V0QmxvY2sobmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtxdWVyeS5nZXRUeFF1ZXJ5KCldKSk7XG4gICAgcmV0dXJuIHF1ZXJ5O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZU91dHB1dFF1ZXJ5KHF1ZXJ5KSB7XG4gICAgcXVlcnkgPSBuZXcgTW9uZXJvT3V0cHV0UXVlcnkocXVlcnkpO1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHR4UXVlcnkgPSBxdWVyeS5nZXRUeFF1ZXJ5KCkuY29weSgpO1xuICAgICAgcXVlcnkgPSB0eFF1ZXJ5LmdldE91dHB1dFF1ZXJ5KCk7XG4gICAgfVxuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkgPT09IHVuZGVmaW5lZCkgcXVlcnkuc2V0VHhRdWVyeShuZXcgTW9uZXJvVHhRdWVyeSgpKTtcbiAgICBxdWVyeS5nZXRUeFF1ZXJ5KCkuc2V0T3V0cHV0UXVlcnkocXVlcnkpO1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0QmxvY2soKSA9PT0gdW5kZWZpbmVkKSBxdWVyeS5nZXRUeFF1ZXJ5KCkuc2V0QmxvY2sobmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtxdWVyeS5nZXRUeFF1ZXJ5KCldKSk7XG4gICAgcmV0dXJuIHF1ZXJ5O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpIHtcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQgfHwgIShjb25maWcgaW5zdGFuY2VvZiBPYmplY3QpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgTW9uZXJvVHhDb25maWcgb3IgZXF1aXZhbGVudCBKUyBvYmplY3RcIik7XG4gICAgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gICAgYXNzZXJ0KGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKSAmJiBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoID4gMCwgXCJNdXN0IHByb3ZpZGUgZGVzdGluYXRpb25zXCIpO1xuICAgIGFzc2VydC5lcXVhbChjb25maWcuZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcygpLCB1bmRlZmluZWQpO1xuICAgIGFzc2VydC5lcXVhbChjb25maWcuZ2V0QmVsb3dBbW91bnQoKSwgdW5kZWZpbmVkKTtcbiAgICByZXR1cm4gY29uZmlnO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnKGNvbmZpZykge1xuICAgIGlmIChjb25maWcgPT09IHVuZGVmaW5lZCB8fCAhKGNvbmZpZyBpbnN0YW5jZW9mIE9iamVjdCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBNb25lcm9UeENvbmZpZyBvciBlcXVpdmFsZW50IEpTIG9iamVjdFwiKTtcbiAgICBjb25maWcgPSBuZXcgTW9uZXJvVHhDb25maWcoY29uZmlnKTtcbiAgICBhc3NlcnQuZXF1YWwoY29uZmlnLmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSwgdW5kZWZpbmVkKTtcbiAgICBhc3NlcnQuZXF1YWwoY29uZmlnLmdldEJlbG93QW1vdW50KCksIHVuZGVmaW5lZCk7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbmZpZy5nZXRDYW5TcGxpdCgpLCB1bmRlZmluZWQsIFwiQ2Fubm90IHNwbGl0IHRyYW5zYWN0aW9ucyB3aGVuIHN3ZWVwaW5nIGFuIG91dHB1dFwiKTtcbiAgICBpZiAoIWNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKSB8fCBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoICE9PSAxIHx8ICFjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZXhhY3RseSBvbmUgZGVzdGluYXRpb24gYWRkcmVzcyB0byBzd2VlcCBvdXRwdXQgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJ0cmFjdEZlZUZyb20oKSAmJiBjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkubGVuZ3RoID4gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3dlZXAgdHJhbnNhY3Rpb25zIGRvIG5vdCBzdXBwb3J0IHN1YnRyYWN0aW5nIGZlZXMgZnJvbSBkZXN0aW5hdGlvbnNcIik7XG4gICAgcmV0dXJuIGNvbmZpZzsgIFxuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWcoY29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkIHx8ICEoY29uZmlnIGluc3RhbmNlb2YgT2JqZWN0KSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIE1vbmVyb1R4Q29uZmlnIG9yIGVxdWl2YWxlbnQgSlMgb2JqZWN0XCIpO1xuICAgIGNvbmZpZyA9IG5ldyBNb25lcm9UeENvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoICE9IDEpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBleGFjdGx5IG9uZSBkZXN0aW5hdGlvbiB0byBzd2VlcCB0b1wiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZGVzdGluYXRpb24gYWRkcmVzcyB0byBzd2VlcCB0b1wiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFtb3VudCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIGFtb3VudCBpbiBzd2VlcCBjb25maWdcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRLZXlJbWFnZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIktleSBpbWFnZSBkZWZpbmVkOyB1c2Ugc3dlZXBPdXRwdXQoKSB0byBzd2VlcCBhbiBvdXRwdXQgYnkgaXRzIGtleSBpbWFnZVwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCAmJiBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDApIGNvbmZpZy5zZXRTdWJhZGRyZXNzSW5kaWNlcyh1bmRlZmluZWQpO1xuICAgIGlmIChjb25maWcuZ2V0QWNjb3VudEluZGV4KCkgPT09IHVuZGVmaW5lZCAmJiBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgYWNjb3VudCBpbmRleCBpZiBzdWJhZGRyZXNzIGluZGljZXMgYXJlIHByb3ZpZGVkXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkgJiYgY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpLmxlbmd0aCA+IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN3ZWVwIHRyYW5zYWN0aW9ucyBkbyBub3Qgc3VwcG9ydCBzdWJ0cmFjdGluZyBmZWVzIGZyb20gZGVzdGluYXRpb25zXCIpO1xuICAgIHJldHVybiBjb25maWc7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMsT0FBQTs7Ozs7QUFLQSxJQUFBQyxZQUFBLEdBQUFGLHNCQUFBLENBQUFDLE9BQUE7Ozs7QUFJQSxJQUFBRSxnQ0FBQSxHQUFBSCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQUcsWUFBQSxHQUFBSixzQkFBQSxDQUFBQyxPQUFBOzs7Ozs7QUFN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