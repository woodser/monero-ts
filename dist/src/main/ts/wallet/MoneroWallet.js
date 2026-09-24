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
  listenerGeneration = 0;
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
        if (that._isClosed) return;
        try {
          await that.setDaemonConnection(connection);
        } catch (err) {
          if (!(err instanceof _MoneroError.default) || !that._isClosed) throw err; // ignore a connection change racing with wallet shutdown
        }
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
    const generation = this.listenerGeneration;
    for (let listener of this.listeners.slice()) {
      if (this._isClosed || generation !== this.listenerGeneration) return;
      if (!this.listeners.includes(listener)) continue;
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
    const generation = this.listenerGeneration;
    for (let listener of this.listeners.slice()) {
      if (this._isClosed || generation !== this.listenerGeneration) return;
      if (!this.listeners.includes(listener)) continue;
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
    const generation = this.listenerGeneration;
    for (let listener of this.listeners.slice()) {
      if (this._isClosed || generation !== this.listenerGeneration) return;
      if (!this.listeners.includes(listener)) continue;
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
    const generation = this.listenerGeneration;
    for (let listener of this.listeners.slice()) {
      if (this._isClosed || generation !== this.listenerGeneration) return;
      if (!this.listeners.includes(listener)) continue;
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
    const generation = this.listenerGeneration;
    for (let listener of this.listeners.slice()) {
      if (this._isClosed || generation !== this.listenerGeneration) return;
      if (!this.listeners.includes(listener)) continue;
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIl9Nb25lcm9PdXRwdXRRdWVyeSIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJfTW9uZXJvVXRpbHMiLCJfTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJNb25lcm9XYWxsZXQiLCJERUZBVUxUX0xBTkdVQUdFIiwibGlzdGVuZXJzIiwibGlzdGVuZXJHZW5lcmF0aW9uIiwiX2lzQ2xvc2VkIiwiY29uc3RydWN0b3IiLCJhZGRMaXN0ZW5lciIsImxpc3RlbmVyIiwiYXNzZXJ0IiwiTW9uZXJvV2FsbGV0TGlzdGVuZXIiLCJwdXNoIiwicmVtb3ZlTGlzdGVuZXIiLCJpZHgiLCJpbmRleE9mIiwic3BsaWNlIiwiTW9uZXJvRXJyb3IiLCJnZXRMaXN0ZW5lcnMiLCJpc1ZpZXdPbmx5Iiwic2V0RGFlbW9uQ29ubmVjdGlvbiIsInVyaU9yQ29ubmVjdGlvbiIsImlzVHJ1c3RlZCIsImdldERhZW1vbkNvbm5lY3Rpb24iLCJzZXRDb25uZWN0aW9uTWFuYWdlciIsImNvbm5lY3Rpb25NYW5hZ2VyIiwiY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciIsInRoYXQiLCJNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyIiwib25Db25uZWN0aW9uQ2hhbmdlZCIsImNvbm5lY3Rpb24iLCJlcnIiLCJnZXRDb25uZWN0aW9uIiwiZ2V0Q29ubmVjdGlvbk1hbmFnZXIiLCJpc0Nvbm5lY3RlZFRvRGFlbW9uIiwiZ2V0VmVyc2lvbiIsImdldFBhdGgiLCJnZXRTZWVkIiwiZ2V0U2VlZExhbmd1YWdlIiwiZ2V0UHJpdmF0ZVZpZXdLZXkiLCJnZXRQcml2YXRlU3BlbmRLZXkiLCJnZXRQdWJsaWNWaWV3S2V5IiwiZ2V0UHVibGljU3BlbmRLZXkiLCJnZXRQcmltYXJ5QWRkcmVzcyIsImdldEFkZHJlc3MiLCJhY2NvdW50SWR4Iiwic3ViYWRkcmVzc0lkeCIsImdldEFkZHJlc3NJbmRleCIsImFkZHJlc3MiLCJnZXRJbnRlZ3JhdGVkQWRkcmVzcyIsInN0YW5kYXJkQWRkcmVzcyIsInBheW1lbnRJZCIsImRlY29kZUludGVncmF0ZWRBZGRyZXNzIiwiaW50ZWdyYXRlZEFkZHJlc3MiLCJnZXRIZWlnaHQiLCJnZXREYWVtb25IZWlnaHQiLCJnZXRIZWlnaHRCeURhdGUiLCJ5ZWFyIiwibW9udGgiLCJkYXkiLCJzeW5jIiwibGlzdGVuZXJPclN0YXJ0SGVpZ2h0Iiwic3RhcnRIZWlnaHQiLCJzdGFydFN5bmNpbmciLCJzeW5jUGVyaW9kSW5NcyIsInN0b3BTeW5jaW5nIiwic2NhblR4cyIsInR4SGFzaGVzIiwicmVzY2FuU3BlbnQiLCJyZXNjYW5CbG9ja2NoYWluIiwiZ2V0QmFsYW5jZSIsImdldFVubG9ja2VkQmFsYW5jZSIsImdldE51bUJsb2Nrc1RvVW5sb2NrIiwiYmFsYW5jZSIsInVuZGVmaW5lZCIsInVubG9ja2VkQmFsYW5jZSIsInR4cyIsImhlaWdodCIsIm51bUJsb2Nrc1RvTmV4dFVubG9jayIsImdldFR4cyIsImlzTG9ja2VkIiwidHgiLCJnZXRJc0NvbmZpcm1lZCIsIk1vbmVyb1V0aWxzIiwiaXNUaW1lc3RhbXAiLCJnZXRVbmxvY2tUaW1lIiwibnVtQmxvY2tzVG9VbmxvY2siLCJNYXRoIiwibWF4IiwiTnVtYmVyIiwibWluIiwibnVtQmxvY2tzVG9MYXN0VW5sb2NrIiwiZ2V0QWNjb3VudHMiLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwiZ2V0QWNjb3VudCIsImNyZWF0ZUFjY291bnQiLCJsYWJlbCIsInNldEFjY291bnRMYWJlbCIsInNldFN1YmFkZHJlc3NMYWJlbCIsImdldFN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NJbmRpY2VzIiwiZ2V0U3ViYWRkcmVzcyIsImNyZWF0ZVN1YmFkZHJlc3MiLCJnZXRUeCIsInR4SGFzaCIsImxlbmd0aCIsInF1ZXJ5IiwiZ2V0VHJhbnNmZXJzIiwiZ2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJxdWVyeU5vcm1hbGl6ZWQiLCJub3JtYWxpemVUcmFuc2ZlclF1ZXJ5IiwiZ2V0SXNJbmNvbWluZyIsInNldElzSW5jb21pbmciLCJnZXRPdXRnb2luZ1RyYW5zZmVycyIsImdldElzT3V0Z29pbmciLCJzZXRJc091dGdvaW5nIiwiZ2V0T3V0cHV0cyIsImV4cG9ydE91dHB1dHMiLCJhbGwiLCJpbXBvcnRPdXRwdXRzIiwib3V0cHV0c0hleCIsImV4cG9ydEtleUltYWdlcyIsImltcG9ydEtleUltYWdlcyIsImtleUltYWdlcyIsIm9mZnNldCIsImdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0IiwiZnJlZXplT3V0cHV0Iiwia2V5SW1hZ2UiLCJ0aGF3T3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJnZXREZWZhdWx0RmVlUHJpb3JpdHkiLCJjcmVhdGVUeCIsImNvbmZpZyIsImNvbmZpZ05vcm1hbGl6ZWQiLCJub3JtYWxpemVDcmVhdGVUeHNDb25maWciLCJnZXRDYW5TcGxpdCIsImVxdWFsIiwic2V0Q2FuU3BsaXQiLCJjcmVhdGVUeHMiLCJzd2VlcE91dHB1dCIsInN3ZWVwVW5sb2NrZWQiLCJzd2VlcER1c3QiLCJyZWxheSIsInJlbGF5VHgiLCJ0eE9yTWV0YWRhdGEiLCJyZWxheVR4cyIsInR4c09yTWV0YWRhdGFzIiwiZGVzY3JpYmVVbnNpZ25lZFR4U2V0IiwidW5zaWduZWRUeEhleCIsImRlc2NyaWJlVHhTZXQiLCJNb25lcm9UeFNldCIsInNldFVuc2lnbmVkVHhIZXgiLCJkZXNjcmliZU11bHRpc2lnVHhTZXQiLCJtdWx0aXNpZ1R4SGV4Iiwic2V0TXVsdGlzaWdUeEhleCIsInR4U2V0Iiwic2lnblR4cyIsInN1Ym1pdFR4cyIsInNpZ25lZFR4SGV4Iiwic2lnbk1lc3NhZ2UiLCJtZXNzYWdlIiwic2lnbmF0dXJlVHlwZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiU0lHTl9XSVRIX1NQRU5EX0tFWSIsInZlcmlmeU1lc3NhZ2UiLCJzaWduYXR1cmUiLCJnZXRUeEtleSIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImdldFR4UHJvb2YiLCJjaGVja1R4UHJvb2YiLCJnZXRTcGVuZFByb29mIiwiY2hlY2tTcGVuZFByb29mIiwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0IiwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCIsImFtb3VudCIsImNoZWNrUmVzZXJ2ZVByb29mIiwiZ2V0VHhOb3RlIiwiZ2V0VHhOb3RlcyIsInNldFR4Tm90ZSIsIm5vdGUiLCJzZXRUeE5vdGVzIiwibm90ZXMiLCJnZXRBZGRyZXNzQm9va0VudHJpZXMiLCJlbnRyeUluZGljZXMiLCJhZGRBZGRyZXNzQm9va0VudHJ5IiwiZGVzY3JpcHRpb24iLCJlZGl0QWRkcmVzc0Jvb2tFbnRyeSIsImluZGV4Iiwic2V0QWRkcmVzcyIsInNldERlc2NyaXB0aW9uIiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsImVudHJ5SWR4IiwidGFnQWNjb3VudHMiLCJhY2NvdW50SW5kaWNlcyIsInVudGFnQWNjb3VudHMiLCJnZXRBY2NvdW50VGFncyIsInNldEFjY291bnRUYWdMYWJlbCIsImdldFBheW1lbnRVcmkiLCJwYXJzZVBheW1lbnRVcmkiLCJ1cmkiLCJnZXRBdHRyaWJ1dGUiLCJrZXkiLCJzZXRBdHRyaWJ1dGUiLCJ2YWwiLCJzdGFydE1pbmluZyIsIm51bVRocmVhZHMiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaWdub3JlQmF0dGVyeSIsInN0b3BNaW5pbmciLCJpc011bHRpc2lnSW1wb3J0TmVlZGVkIiwiaXNNdWx0aXNpZyIsImdldE11bHRpc2lnSW5mbyIsImdldElzTXVsdGlzaWciLCJwcmVwYXJlTXVsdGlzaWciLCJtYWtlTXVsdGlzaWciLCJtdWx0aXNpZ0hleGVzIiwidGhyZXNob2xkIiwicGFzc3dvcmQiLCJleGNoYW5nZU11bHRpc2lnS2V5cyIsImV4cG9ydE11bHRpc2lnSGV4IiwiaW1wb3J0TXVsdGlzaWdIZXgiLCJyZWZyZXNoQWZ0ZXJJbXBvcnQiLCJzaWduTXVsdGlzaWdUeEhleCIsInN1Ym1pdE11bHRpc2lnVHhIZXgiLCJzaWduZWRNdWx0aXNpZ1R4SGV4IiwiY2hhbmdlUGFzc3dvcmQiLCJvbGRQYXNzd29yZCIsIm5ld1Bhc3N3b3JkIiwic2F2ZSIsImNsb3NlIiwiaXNDbG9zZWQiLCJhbm5vdW5jZVN5bmNQcm9ncmVzcyIsImVuZEhlaWdodCIsInBlcmNlbnREb25lIiwiZ2VuZXJhdGlvbiIsInNsaWNlIiwiaW5jbHVkZXMiLCJvblN5bmNQcm9ncmVzcyIsImNvbnNvbGUiLCJlcnJvciIsImFubm91bmNlTmV3QmxvY2siLCJvbk5ld0Jsb2NrIiwiYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQiLCJuZXdCYWxhbmNlIiwibmV3VW5sb2NrZWRCYWxhbmNlIiwib25CYWxhbmNlc0NoYW5nZWQiLCJhbm5vdW5jZU91dHB1dFJlY2VpdmVkIiwib3V0cHV0Iiwib25PdXRwdXRSZWNlaXZlZCIsImFubm91bmNlT3V0cHV0U3BlbnQiLCJvbk91dHB1dFNwZW50Iiwibm9ybWFsaXplVHhRdWVyeSIsIk1vbmVyb1R4UXVlcnkiLCJjb3B5IiwiQXJyYXkiLCJpc0FycmF5Iiwic2V0SGFzaGVzIiwiT2JqZWN0IiwiYXNzaWduIiwiZ2V0QmxvY2siLCJzZXRCbG9jayIsIk1vbmVyb0Jsb2NrIiwic2V0VHhzIiwiZ2V0SW5wdXRRdWVyeSIsInNldFR4UXVlcnkiLCJnZXRPdXRwdXRRdWVyeSIsIk1vbmVyb1RyYW5zZmVyUXVlcnkiLCJnZXRUeFF1ZXJ5IiwidHhRdWVyeSIsImdldFRyYW5zZmVyUXVlcnkiLCJzZXRUcmFuc2ZlclF1ZXJ5Iiwibm9ybWFsaXplT3V0cHV0UXVlcnkiLCJNb25lcm9PdXRwdXRRdWVyeSIsInNldE91dHB1dFF1ZXJ5IiwiTW9uZXJvVHhDb25maWciLCJnZXREZXN0aW5hdGlvbnMiLCJnZXRTd2VlcEVhY2hTdWJhZGRyZXNzIiwiZ2V0QmVsb3dBbW91bnQiLCJub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyIsImdldFN1YnRyYWN0RmVlRnJvbSIsIm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWciLCJnZXRBbW91bnQiLCJnZXRLZXlJbWFnZSIsImdldFN1YmFkZHJlc3NJbmRpY2VzIiwic2V0U3ViYWRkcmVzc0luZGljZXMiLCJnZXRBY2NvdW50SW5kZXgiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb0FjY291bnQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnRUYWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFRhZ1wiO1xuaW1wb3J0IE1vbmVyb0FkZHJlc3NCb29rRW50cnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9DaGVja1Jlc2VydmUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tSZXNlcnZlXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tUeCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1R4XCI7XG5pbXBvcnQgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9Db25uZWN0aW9uTWFuYWdlclwiO1xuaW1wb3J0IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb0luY29taW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW5jb21pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb0ludGVncmF0ZWRBZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZVwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luZm9cIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnU2lnblJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb091dGdvaW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0Z29pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvU3ViYWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TdWJhZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvU3luY1Jlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TeW5jUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlclF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyUXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeENvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeENvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb1R4UHJpb3JpdHkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhQcmlvcml0eVwiO1xuaW1wb3J0IE1vbmVyb1R4UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvVHhTZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhTZXRcIjtcbmltcG9ydCBNb25lcm9VdGlscyBmcm9tIFwiLi4vY29tbW9uL01vbmVyb1V0aWxzXCI7XG5pbXBvcnQgTW9uZXJvVmVyc2lvbiBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb1ZlcnNpb25cIjtcbmltcG9ydCBNb25lcm9XYWxsZXRMaXN0ZW5lciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRMaXN0ZW5lclwiO1xuXG4vKipcbiAqIENvcHlyaWdodCAoYykgd29vZHNlclxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcbiAqIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuLyoqXG4gKiBNb25lcm8gd2FsbGV0IGludGVyZmFjZSBhbmQgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbnMuXG4gKiBcbiAqIEBpbnRlcmZhY2VcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvV2FsbGV0IHtcblxuICAvLyBzdGF0aWMgdmFyaWFibGVzXG4gIHN0YXRpYyByZWFkb25seSBERUZBVUxUX0xBTkdVQUdFID0gXCJFbmdsaXNoXCI7XG5cbiAgLy8gc3RhdGUgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBjb25uZWN0aW9uTWFuYWdlcjogTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI7XG4gIHByb3RlY3RlZCBjb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyOiBNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyO1xuICBwcm90ZWN0ZWQgbGlzdGVuZXJzOiBNb25lcm9XYWxsZXRMaXN0ZW5lcltdID0gW107XG4gIHByb3RlY3RlZCBsaXN0ZW5lckdlbmVyYXRpb24gPSAwO1xuICBwcm90ZWN0ZWQgX2lzQ2xvc2VkID0gZmFsc2U7XG5cbiAgLyoqXG4gICAqIEhpZGRlbiBjb25zdHJ1Y3Rvci5cbiAgICogXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvLyBubyBjb2RlIG5lZWRlZFxuICB9XG4gIFxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBsaXN0ZW5lciB0byByZWNlaXZlIHdhbGxldCBub3RpZmljYXRpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRMaXN0ZW5lcn0gbGlzdGVuZXIgLSBsaXN0ZW5lciB0byByZWNlaXZlIHdhbGxldCBub3RpZmljYXRpb25zXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvV2FsbGV0TGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhc3NlcnQobGlzdGVuZXIgaW5zdGFuY2VvZiBNb25lcm9XYWxsZXRMaXN0ZW5lciwgXCJMaXN0ZW5lciBtdXN0IGJlIGluc3RhbmNlIG9mIE1vbmVyb1dhbGxldExpc3RlbmVyXCIpO1xuICAgIHRoaXMubGlzdGVuZXJzLnB1c2gobGlzdGVuZXIpO1xuICB9XG4gIFxuICAvKipcbiAgICogVW5yZWdpc3RlciBhIGxpc3RlbmVyIHRvIHJlY2VpdmUgd2FsbGV0IG5vdGlmaWNhdGlvbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1dhbGxldExpc3RlbmVyfSBsaXN0ZW5lciAtIGxpc3RlbmVyIHRvIHVucmVnaXN0ZXJcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IGlkeCA9IHRoaXMubGlzdGVuZXJzLmluZGV4T2YobGlzdGVuZXIpO1xuICAgIGlmIChpZHggPiAtMSkgdGhpcy5saXN0ZW5lcnMuc3BsaWNlKGlkeCwgMSk7XG4gICAgZWxzZSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJMaXN0ZW5lciBpcyBub3QgcmVnaXN0ZXJlZCB3aXRoIHdhbGxldFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgd2l0aCB0aGUgd2FsbGV0LlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvV2FsbGV0TGlzdGVuZXJbXX0gdGhlIHJlZ2lzdGVyZWQgbGlzdGVuZXJzXG4gICAqL1xuICBnZXRMaXN0ZW5lcnMoKTogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXSB7XG4gICAgcmV0dXJuIHRoaXMubGlzdGVuZXJzO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoZSB3YWxsZXQgaXMgdmlldy1vbmx5LCBtZWFuaW5nIGl0IGRvZXMgbm90IGhhdmUgdGhlIHByaXZhdGVcbiAgICogc3BlbmQga2V5IGFuZCBjYW4gdGhlcmVmb3JlIG9ubHkgb2JzZXJ2ZSBpbmNvbWluZyBvdXRwdXRzLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgd2FsbGV0IGlzIHZpZXctb25seSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBpc1ZpZXdPbmx5KCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9ScGNDb25uZWN0aW9uIHwgc3RyaW5nfSBbdXJpT3JDb25uZWN0aW9uXSAtIGRhZW1vbidzIFVSSSBvciBjb25uZWN0aW9uIChkZWZhdWx0cyB0byBvZmZsaW5lKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpc1RydXN0ZWRdIC0gaW5kaWNhdGVzIGlmIHRoZSBkYWVtb24gaXMgdHJ1c3RlZCAoZGVmYXVsdHMgdG8gdHJ1c3RlZCBpZiBsb2NhbCBhZGRyZXNzKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0RGFlbW9uQ29ubmVjdGlvbih1cmlPckNvbm5lY3Rpb24/OiBQYXJ0aWFsPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHwgc3RyaW5nLCBpc1RydXN0ZWQ/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgZGFlbW9uIGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1JwY0Nvbm5lY3Rpb24+fSB0aGUgd2FsbGV0J3MgZGFlbW9uIGNvbm5lY3Rpb25cbiAgICovXG4gIGFzeW5jIGdldERhZW1vbkNvbm5lY3Rpb24oKTogUHJvbWlzZTxNb25lcm9ScGNDb25uZWN0aW9uPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uIG1hbmFnZXIuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyfSBjb25uZWN0aW9uTWFuYWdlciBtYW5hZ2VzIGNvbm5lY3Rpb25zIHRvIG1vbmVyb2RcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldENvbm5lY3Rpb25NYW5hZ2VyKGNvbm5lY3Rpb25NYW5hZ2VyPzogTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25uZWN0aW9uTWFuYWdlcikgdGhpcy5jb25uZWN0aW9uTWFuYWdlci5yZW1vdmVMaXN0ZW5lcih0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIpO1xuICAgIHRoaXMuY29ubmVjdGlvbk1hbmFnZXIgPSBjb25uZWN0aW9uTWFuYWdlcjtcbiAgICBpZiAoIWNvbm5lY3Rpb25NYW5hZ2VyKSByZXR1cm47XG4gICAgbGV0IHRoYXQgPSB0aGlzO1xuICAgIGlmICghdGhpcy5jb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyKSB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIgPSBuZXcgY2xhc3MgZXh0ZW5kcyBNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyIHtcbiAgICAgIGFzeW5jIG9uQ29ubmVjdGlvbkNoYW5nZWQoY29ubmVjdGlvbjogTW9uZXJvUnBjQ29ubmVjdGlvbiB8IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAodGhhdC5faXNDbG9zZWQpIHJldHVybjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBhd2FpdCB0aGF0LnNldERhZW1vbkNvbm5lY3Rpb24oY29ubmVjdGlvbik7XG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgIGlmICghKGVyciBpbnN0YW5jZW9mIE1vbmVyb0Vycm9yKSB8fCAhdGhhdC5faXNDbG9zZWQpIHRocm93IGVycjsgLy8gaWdub3JlIGEgY29ubmVjdGlvbiBjaGFuZ2UgcmFjaW5nIHdpdGggd2FsbGV0IHNodXRkb3duXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICAgIGNvbm5lY3Rpb25NYW5hZ2VyLmFkZExpc3RlbmVyKHRoaXMuY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcik7XG4gICAgYXdhaXQgdGhpcy5zZXREYWVtb25Db25uZWN0aW9uKGNvbm5lY3Rpb25NYW5hZ2VyLmdldENvbm5lY3Rpb24oKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvbiBtYW5hZ2VyLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9Db25uZWN0aW9uTWFuYWdlcj59IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvbiBtYW5hZ2VyXG4gICAqL1xuICBhc3luYyBnZXRDb25uZWN0aW9uTWFuYWdlcigpOiBQcm9taXNlPE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyPiB7XG4gICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbk1hbmFnZXI7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIHdhbGxldCBpcyBjb25uZWN0ZWQgdG8gZGFlbW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgd2FsbGV0IGlzIGNvbm5lY3RlZCB0byBhIGRhZW1vbiwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBpc0Nvbm5lY3RlZFRvRGFlbW9uKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2ZXJzaW9uIG9mIHRoZSB3YWxsZXQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1ZlcnNpb24+fSB0aGUgdmVyc2lvbiBvZiB0aGUgd2FsbGV0XG4gICAqL1xuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIHBhdGguXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSBwYXRoIHRoZSB3YWxsZXQgY2FuIGJlIG9wZW5lZCB3aXRoXG4gICAqL1xuICBhc3luYyBnZXRQYXRoKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgbW5lbW9uaWMgcGhyYXNlIG9yIHNlZWQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB3YWxsZXQncyBtbmVtb25pYyBwaHJhc2Ugb3Igc2VlZC5cbiAgICovXG4gIGFzeW5jIGdldFNlZWQoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBsYW5ndWFnZSBvZiB0aGUgd2FsbGV0J3MgbW5lbW9uaWMgcGhyYXNlIG9yIHNlZWQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSBsYW5ndWFnZSBvZiB0aGUgd2FsbGV0J3MgbW5lbW9uaWMgcGhyYXNlIG9yIHNlZWQuXG4gICAqL1xuICBhc3luYyBnZXRTZWVkTGFuZ3VhZ2UoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBwcml2YXRlIHZpZXcga2V5LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgd2FsbGV0J3MgcHJpdmF0ZSB2aWV3IGtleVxuICAgKi9cbiAgYXN5bmMgZ2V0UHJpdmF0ZVZpZXdLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBwcml2YXRlIHNwZW5kIGtleS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHdhbGxldCdzIHByaXZhdGUgc3BlbmQga2V5XG4gICAqL1xuICBhc3luYyBnZXRQcml2YXRlU3BlbmRLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBwdWJsaWMgdmlldyBrZXkuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB3YWxsZXQncyBwdWJsaWMgdmlldyBrZXlcbiAgICovXG4gIGFzeW5jIGdldFB1YmxpY1ZpZXdLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBwdWJsaWMgc3BlbmQga2V5LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgd2FsbGV0J3MgcHVibGljIHNwZW5kIGtleVxuICAgKi9cbiAgYXN5bmMgZ2V0UHVibGljU3BlbmRLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gICAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIHByaW1hcnkgYWRkcmVzcy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHdhbGxldCdzIHByaW1hcnkgYWRkcmVzc1xuICAgKi9cbiAgYXN5bmMgZ2V0UHJpbWFyeUFkZHJlc3MoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRBZGRyZXNzKDAsIDApO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBhZGRyZXNzIG9mIGEgc3BlY2lmaWMgc3ViYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gdGhlIGFjY291bnQgaW5kZXggb2YgdGhlIGFkZHJlc3MncyBzdWJhZGRyZXNzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzdWJhZGRyZXNzSWR4IC0gdGhlIHN1YmFkZHJlc3MgaW5kZXggd2l0aGluIHRoZSBhY2NvdW50XG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHJlY2VpdmUgYWRkcmVzcyBvZiB0aGUgc3BlY2lmaWVkIHN1YmFkZHJlc3NcbiAgICovXG4gIGFzeW5jIGdldEFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kZXggb2YgdGhlIGdpdmVuIGFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIGFkZHJlc3MgdG8gZ2V0IHRoZSBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGV4IGZyb21cbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPn0gdGhlIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlc1xuICAgKi9cbiAgYXN5bmMgZ2V0QWRkcmVzc0luZGV4KGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYW4gaW50ZWdyYXRlZCBhZGRyZXNzIGJhc2VkIG9uIHRoZSBnaXZlbiBzdGFuZGFyZCBhZGRyZXNzIGFuZCBwYXltZW50XG4gICAqIElELiBVc2VzIHRoZSB3YWxsZXQncyBwcmltYXJ5IGFkZHJlc3MgaWYgYW4gYWRkcmVzcyBpcyBub3QgZ2l2ZW4uXG4gICAqIEdlbmVyYXRlcyBhIHJhbmRvbSBwYXltZW50IElEIGlmIGEgcGF5bWVudCBJRCBpcyBub3QgZ2l2ZW4uXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhbmRhcmRBZGRyZXNzIGlzIHRoZSBzdGFuZGFyZCBhZGRyZXNzIHRvIGdlbmVyYXRlIHRoZSBpbnRlZ3JhdGVkIGFkZHJlc3MgZnJvbSAod2FsbGV0J3MgcHJpbWFyeSBhZGRyZXNzIGlmIHVuZGVmaW5lZClcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBheW1lbnRJZCBpcyB0aGUgcGF5bWVudCBJRCB0byBnZW5lcmF0ZSBhbiBpbnRlZ3JhdGVkIGFkZHJlc3MgZnJvbSAocmFuZG9tbHkgZ2VuZXJhdGVkIGlmIHVuZGVmaW5lZClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz59IHRoZSBpbnRlZ3JhdGVkIGFkZHJlc3NcbiAgICovXG4gIGFzeW5jIGdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcz86IHN0cmluZywgcGF5bWVudElkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZWNvZGUgYW4gaW50ZWdyYXRlZCBhZGRyZXNzIHRvIGdldCBpdHMgc3RhbmRhcmQgYWRkcmVzcyBhbmQgcGF5bWVudCBpZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBpbnRlZ3JhdGVkQWRkcmVzcyAtIGludGVncmF0ZWQgYWRkcmVzcyB0byBkZWNvZGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz59IHRoZSBkZWNvZGVkIGludGVncmF0ZWQgYWRkcmVzcyBpbmNsdWRpbmcgc3RhbmRhcmQgYWRkcmVzcyBhbmQgcGF5bWVudCBpZFxuICAgKi9cbiAgYXN5bmMgZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBibG9jayBoZWlnaHQgdGhhdCB0aGUgd2FsbGV0IGlzIHN5bmNlZCB0by5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIGJsb2NrIGhlaWdodCB0aGF0IHRoZSB3YWxsZXQgaXMgc3luY2VkIHRvXG4gICAqL1xuICBhc3luYyBnZXRIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBibG9ja2NoYWluJ3MgaGVpZ2h0LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB0aGUgYmxvY2tjaGFpbidzIGhlaWdodFxuICAgKi9cbiAgYXN5bmMgZ2V0RGFlbW9uSGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgYmxvY2tjaGFpbidzIGhlaWdodCBieSBkYXRlIGFzIGEgY29uc2VydmF0aXZlIGVzdGltYXRlIGZvciBzY2FubmluZy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5ZWFyIC0geWVhciBvZiB0aGUgaGVpZ2h0IHRvIGdldFxuICAgKiBAcGFyYW0ge251bWJlcn0gbW9udGggLSBtb250aCBvZiB0aGUgaGVpZ2h0IHRvIGdldCBhcyBhIG51bWJlciBiZXR3ZWVuIDEgYW5kIDEyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBkYXkgLSBkYXkgb2YgdGhlIGhlaWdodCB0byBnZXQgYXMgYSBudW1iZXIgYmV0d2VlbiAxIGFuZCAzMVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBibG9ja2NoYWluJ3MgYXBwcm94aW1hdGUgaGVpZ2h0IGF0IHRoZSBnaXZlbiBkYXRlXG4gICAqL1xuICBhc3luYyBnZXRIZWlnaHRCeURhdGUoeWVhcjogbnVtYmVyLCBtb250aDogbnVtYmVyLCBkYXk6IG51bWJlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN5bmNocm9uaXplIHRoZSB3YWxsZXQgd2l0aCB0aGUgZGFlbW9uIGFzIGEgb25lLXRpbWUgc3luY2hyb25vdXMgcHJvY2Vzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvV2FsbGV0TGlzdGVuZXJ8bnVtYmVyfSBbbGlzdGVuZXJPclN0YXJ0SGVpZ2h0XSAtIGxpc3RlbmVyIHhvciBzdGFydCBoZWlnaHQgKGRlZmF1bHRzIHRvIG5vIHN5bmMgbGlzdGVuZXIsIHRoZSBsYXN0IHN5bmNlZCBibG9jaylcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdGFydEhlaWdodF0gLSBzdGFydEhlaWdodCBpZiBub3QgZ2l2ZW4gaW4gZmlyc3QgYXJnIChkZWZhdWx0cyB0byBsYXN0IHN5bmNlZCBibG9jaylcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0PzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgfCBudW1iZXIsIHN0YXJ0SGVpZ2h0PzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9TeW5jUmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0YXJ0IGJhY2tncm91bmQgc3luY2hyb25pemluZyB3aXRoIGEgbWF4aW11bSBwZXJpb2QgYmV0d2VlbiBzeW5jcy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3luY1BlcmlvZEluTXNdIC0gbWF4aW11bSBwZXJpb2QgYmV0d2VlbiBzeW5jcyBpbiBtaWxsaXNlY29uZHMgKGRlZmF1bHQgaXMgd2FsbGV0LXNwZWNpZmljKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0b3Agc3luY2hyb25pemluZyB0aGUgd2FsbGV0IHdpdGggdGhlIGRhZW1vbi5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzdG9wU3luY2luZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2NhbiB0cmFuc2FjdGlvbnMgYnkgdGhlaXIgaGFzaC9pZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IHR4SGFzaGVzIC0gdHggaGFzaGVzIHRvIHNjYW5cbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNjYW5UeHModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPlJlc2NhbiB0aGUgYmxvY2tjaGFpbiBmb3Igc3BlbnQgb3V0cHV0cy48L3A+XG4gICAqIFxuICAgKiA8cD5Ob3RlOiB0aGlzIGNhbiBvbmx5IGJlIGNhbGxlZCB3aXRoIGEgdHJ1c3RlZCBkYWVtb24uPC9wPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZSB1c2UgY2FzZTogcGVlciBtdWx0aXNpZyBoZXggaXMgaW1wb3J0IHdoZW4gY29ubmVjdGVkIHRvIGFuIHVudHJ1c3RlZCBkYWVtb24sXG4gICAqIHNvIHRoZSB3YWxsZXQgd2lsbCBub3QgcmVzY2FuIHNwZW50IG91dHB1dHMuICBUaGVuIHRoZSB3YWxsZXQgY29ubmVjdHMgdG8gYSB0cnVzdGVkXG4gICAqIGRhZW1vbi4gIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBtYW51YWxseSBpbnZva2VkIHRvIHJlc2NhbiBvdXRwdXRzLjwvcD5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyByZXNjYW5TcGVudCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+UmVzY2FuIHRoZSBibG9ja2NoYWluIGZyb20gc2NyYXRjaCwgbG9zaW5nIGFueSBpbmZvcm1hdGlvbiB3aGljaCBjYW5ub3QgYmUgcmVjb3ZlcmVkIGZyb21cbiAgICogdGhlIGJsb2NrY2hhaW4gaXRzZWxmLjwvcD5cbiAgICogXG4gICAqIDxwPldBUk5JTkc6IFRoaXMgbWV0aG9kIGRpc2NhcmRzIGxvY2FsIHdhbGxldCBkYXRhIGxpa2UgZGVzdGluYXRpb24gYWRkcmVzc2VzLCB0eCBzZWNyZXQga2V5cyxcbiAgICogdHggbm90ZXMsIGV0Yy48L3A+XG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgcmVzY2FuQmxvY2tjaGFpbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBiYWxhbmNlIG9mIHRoZSB3YWxsZXQsIGFjY291bnQsIG9yIHN1YmFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW2FjY291bnRJZHhdIC0gaW5kZXggb2YgdGhlIGFjY291bnQgdG8gZ2V0IHRoZSBiYWxhbmNlIG9mIChkZWZhdWx0IGFsbCBhY2NvdW50cylcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdWJhZGRyZXNzSWR4XSAtIGluZGV4IG9mIHRoZSBzdWJhZGRyZXNzIHRvIGdldCB0aGUgYmFsYW5jZSBvZiAoZGVmYXVsdCBhbGwgc3ViYWRkcmVzc2VzKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJpZ2ludD59IHRoZSBiYWxhbmNlIG9mIHRoZSB3YWxsZXQsIGFjY291bnQsIG9yIHN1YmFkZHJlc3NcbiAgICovXG4gIGFzeW5jIGdldEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgdW5sb2NrZWQgYmFsYW5jZSBvZiB0aGUgd2FsbGV0LCBhY2NvdW50LCBvciBzdWJhZGRyZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFthY2NvdW50SWR4XSAtIGluZGV4IG9mIHRoZSBhY2NvdW50IHRvIGdldCB0aGUgdW5sb2NrZWQgYmFsYW5jZSBvZiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3ViYWRkcmVzc0lkeF0gLSBpbmRleCBvZiB0aGUgc3ViYWRkcmVzcyB0byBnZXQgdGhlIHVubG9ja2VkIGJhbGFuY2Ugb2YgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJpZ2ludD59IHRoZSB1bmxvY2tlZCBiYWxhbmNlIG9mIHRoZSB3YWxsZXQsIGFjY291bnQsIG9yIHN1YmFkZHJlc3NcbiAgICovXG4gIGFzeW5jIGdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBudW1iZXIgb2YgYmxvY2tzIHVudGlsIHRoZSBuZXh0IGFuZCBsYXN0IGZ1bmRzIHVubG9jay4gSWdub3JlcyB0eHMgd2l0aCB1bmxvY2sgdGltZSBhcyB0aW1lc3RhbXAuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcltdPn0gdGhlIG51bWJlciBvZiBibG9ja3MgdW50aWwgdGhlIG5leHQgYW5kIGxhc3QgZnVuZHMgdW5sb2NrIGluIGVsZW1lbnRzIDAgYW5kIDEsIHJlc3BlY3RpdmVseSwgb3IgdW5kZWZpbmVkIGlmIG5vIGJhbGFuY2VcbiAgICovXG4gIGFzeW5jIGdldE51bUJsb2Nrc1RvVW5sb2NrKCk6IFByb21pc2U8bnVtYmVyW118dW5kZWZpbmVkPiB7XG4gICAgXG4gICAgLy8gZ2V0IGJhbGFuY2VzXG4gICAgbGV0IGJhbGFuY2UgPSBhd2FpdCB0aGlzLmdldEJhbGFuY2UoKTtcbiAgICBpZiAoYmFsYW5jZSA9PT0gMG4pIHJldHVybiBbdW5kZWZpbmVkLCB1bmRlZmluZWRdOyAvLyBza2lwIGlmIG5vIGJhbGFuY2VcbiAgICBsZXQgdW5sb2NrZWRCYWxhbmNlID0gYXdhaXQgdGhpcy5nZXRVbmxvY2tlZEJhbGFuY2UoKTtcbiAgICBcbiAgICAvLyBjb21wdXRlIG51bWJlciBvZiBibG9ja3MgdW50aWwgbmV4dCBmdW5kcyBhdmFpbGFibGVcbiAgICBsZXQgdHhzOiBNb25lcm9UeFdhbGxldFtdO1xuICAgIGxldCBoZWlnaHQ6IG51bWJlcjtcbiAgICBsZXQgbnVtQmxvY2tzVG9OZXh0VW5sb2NrID0gdW5kZWZpbmVkO1xuICAgIGlmICh1bmxvY2tlZEJhbGFuY2UgPiAwbikgbnVtQmxvY2tzVG9OZXh0VW5sb2NrID0gMDtcbiAgICBlbHNlIHtcbiAgICAgIHR4cyA9IGF3YWl0IHRoaXMuZ2V0VHhzKHtpc0xvY2tlZDogdHJ1ZX0pOyAvLyBnZXQgbG9ja2VkIHR4c1xuICAgICAgaGVpZ2h0ID0gYXdhaXQgdGhpcy5nZXRIZWlnaHQoKTsgLy8gZ2V0IG1vc3QgcmVjZW50IGhlaWdodFxuICAgICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICAgIGlmICghdHguZ2V0SXNDb25maXJtZWQoKSAmJiBNb25lcm9VdGlscy5pc1RpbWVzdGFtcCh0eC5nZXRVbmxvY2tUaW1lKCkpKSBjb250aW51ZTtcbiAgICAgICAgbGV0IG51bUJsb2Nrc1RvVW5sb2NrID0gTWF0aC5tYXgoKHR4LmdldElzQ29uZmlybWVkKCkgPyB0eC5nZXRIZWlnaHQoKSA6IGhlaWdodCkgKyAxMCwgTnVtYmVyKHR4LmdldFVubG9ja1RpbWUoKSkpIC0gaGVpZ2h0O1xuICAgICAgICBudW1CbG9ja3NUb05leHRVbmxvY2sgPSBudW1CbG9ja3NUb05leHRVbmxvY2sgPT09IHVuZGVmaW5lZCA/IG51bUJsb2Nrc1RvVW5sb2NrIDogTWF0aC5taW4obnVtQmxvY2tzVG9OZXh0VW5sb2NrLCBudW1CbG9ja3NUb1VubG9jayk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGNvbXB1dGUgbnVtYmVyIG9mIGJsb2NrcyB1bnRpbCBhbGwgZnVuZHMgYXZhaWxhYmxlXG4gICAgbGV0IG51bUJsb2Nrc1RvTGFzdFVubG9jayA9IHVuZGVmaW5lZDtcbiAgICBpZiAoYmFsYW5jZSA9PT0gdW5sb2NrZWRCYWxhbmNlKSB7XG4gICAgICBpZiAodW5sb2NrZWRCYWxhbmNlID4gMG4pIG51bUJsb2Nrc1RvTGFzdFVubG9jayA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghdHhzKSB7XG4gICAgICAgIHR4cyA9IGF3YWl0IHRoaXMuZ2V0VHhzKHtpc0xvY2tlZDogdHJ1ZX0pOyAvLyBnZXQgbG9ja2VkIHR4c1xuICAgICAgICBoZWlnaHQgPSBhd2FpdCB0aGlzLmdldEhlaWdodCgpOyAvLyBnZXQgbW9zdCByZWNlbnQgaGVpZ2h0XG4gICAgICB9XG4gICAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgICAgaWYgKCF0eC5nZXRJc0NvbmZpcm1lZCgpICYmIE1vbmVyb1V0aWxzLmlzVGltZXN0YW1wKHR4LmdldFVubG9ja1RpbWUoKSkpIGNvbnRpbnVlO1xuICAgICAgICBsZXQgbnVtQmxvY2tzVG9VbmxvY2sgPSBNYXRoLm1heCgodHguZ2V0SXNDb25maXJtZWQoKSA/IHR4LmdldEhlaWdodCgpIDogaGVpZ2h0KSArIDEwLCBOdW1iZXIodHguZ2V0VW5sb2NrVGltZSgpKSkgLSBoZWlnaHQ7XG4gICAgICAgIG51bUJsb2Nrc1RvTGFzdFVubG9jayA9IG51bUJsb2Nrc1RvTGFzdFVubG9jayA9PT0gdW5kZWZpbmVkID8gbnVtQmxvY2tzVG9VbmxvY2sgOiBNYXRoLm1heChudW1CbG9ja3NUb0xhc3RVbmxvY2ssIG51bUJsb2Nrc1RvVW5sb2NrKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIFtudW1CbG9ja3NUb05leHRVbmxvY2ssIG51bUJsb2Nrc1RvTGFzdFVubG9ja107XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYWNjb3VudHMgd2l0aCBhIGdpdmVuIHRhZy5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaW5jbHVkZVN1YmFkZHJlc3NlcyAtIGluY2x1ZGUgc3ViYWRkcmVzc2VzIGlmIHRydWVcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyAtIHRhZyBmb3IgZmlsdGVyaW5nIGFjY291bnRzLCBhbGwgYWNjb3VudHMgaWYgdW5kZWZpbmVkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQWNjb3VudFtdPn0gYWxsIGFjY291bnRzIHdpdGggdGhlIGdpdmVuIHRhZ1xuICAgKi9cbiAgYXN5bmMgZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHRhZz86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQWNjb3VudFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhbiBhY2NvdW50LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFjY291bnRJZHggLSBpbmRleCBvZiB0aGUgYWNjb3VudCB0byBnZXRcbiAgICogQHBhcmFtIHtib29sZWFufSBpbmNsdWRlU3ViYWRkcmVzc2VzIC0gaW5jbHVkZSBzdWJhZGRyZXNzZXMgaWYgdHJ1ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0FjY291bnQ+fSB0aGUgcmV0cmlldmVkIGFjY291bnRcbiAgICovXG4gIGFzeW5jIGdldEFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvQWNjb3VudD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgYWNjb3VudCB3aXRoIGEgbGFiZWwgZm9yIHRoZSBmaXJzdCBzdWJhZGRyZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtsYWJlbF0gLSBsYWJlbCBmb3IgYWNjb3VudCdzIGZpcnN0IHN1YmFkZHJlc3MgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0FjY291bnQ+fSB0aGUgY3JlYXRlZCBhY2NvdW50XG4gICAqL1xuICBhc3luYyBjcmVhdGVBY2NvdW50KGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYW4gYWNjb3VudCBsYWJlbC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gaW5kZXggb2YgdGhlIGFjY291bnQgdG8gc2V0IHRoZSBsYWJlbCBmb3JcbiAgICogQHBhcmFtIHtzdHJpbmd9IGxhYmVsIC0gdGhlIGxhYmVsIHRvIHNldFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0QWNjb3VudExhYmVsKGFjY291bnRJZHg6IG51bWJlciwgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHgsIDAsIGxhYmVsKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBzdWJhZGRyZXNzZXMgaW4gYW4gYWNjb3VudC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gYWNjb3VudCB0byBnZXQgc3ViYWRkcmVzc2VzIHdpdGhpblxuICAgKiBAcGFyYW0ge251bWJlcltdfSBbc3ViYWRkcmVzc0luZGljZXNdIC0gaW5kaWNlcyBvZiBzdWJhZGRyZXNzZXMgdG8gZ2V0IChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzW10+fSB0aGUgcmV0cmlldmVkIHN1YmFkZHJlc3Nlc1xuICAgKi9cbiAgYXN5bmMgZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0luZGljZXM/OiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzc1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIHN1YmFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gYWNjb3VudElkeCAtIGluZGV4IG9mIHRoZSBzdWJhZGRyZXNzJ3MgYWNjb3VudFxuICAgKiBAcGFyYW0ge251bWJlcn0gc3ViYWRkcmVzc0lkeCAtIGluZGV4IG9mIHRoZSBzdWJhZGRyZXNzIHdpdGhpbiB0aGUgYWNjb3VudFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+fSB0aGUgcmV0cmlldmVkIHN1YmFkZHJlc3NcbiAgICovXG4gIGFzeW5jIGdldFN1YmFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICBhc3NlcnQoYWNjb3VudElkeCA+PSAwKTtcbiAgICBhc3NlcnQoc3ViYWRkcmVzc0lkeCA+PSAwKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIFtzdWJhZGRyZXNzSWR4XSkpWzBdO1xuICB9XG4gIFxuICAvKipcbiAgICogQ3JlYXRlIGEgc3ViYWRkcmVzcyB3aXRoaW4gYW4gYWNjb3VudC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gaW5kZXggb2YgdGhlIGFjY291bnQgdG8gY3JlYXRlIHRoZSBzdWJhZGRyZXNzIHdpdGhpblxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2xhYmVsXSAtIHRoZSBsYWJlbCBmb3IgdGhlIHN1YmFkZHJlc3MgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+fSB0aGUgY3JlYXRlZCBzdWJhZGRyZXNzXG4gICAqL1xuICBhc3luYyBjcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgbGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhIHN1YmFkZHJlc3MgbGFiZWwuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gYWNjb3VudElkeCAtIGluZGV4IG9mIHRoZSBhY2NvdW50IHRvIHNldCB0aGUgbGFiZWwgZm9yXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzdWJhZGRyZXNzSWR4IC0gaW5kZXggb2YgdGhlIHN1YmFkZHJlc3MgdG8gc2V0IHRoZSBsYWJlbCBmb3JcbiAgICogQHBhcmFtIHtQcm9taXNlPHN0cmluZz59IGxhYmVsIC0gdGhlIGxhYmVsIHRvIHNldFxuICAgKi9cbiAgYXN5bmMgc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIHdhbGxldCB0cmFuc2FjdGlvbiBieSBoYXNoLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIGhhc2ggb2YgYSB0cmFuc2FjdGlvbiB0byBnZXRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldD4gfSB0aGUgaWRlbnRpZmllZCB0cmFuc2FjdGlvbiBvciB1bmRlZmluZWQgaWYgbm90IGZvdW5kXG4gICAqL1xuICBhc3luYyBnZXRUeCh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhXYWxsZXR8dW5kZWZpbmVkPiB7XG4gICAgbGV0IHR4cyA9IGF3YWl0IHRoaXMuZ2V0VHhzKFt0eEhhc2hdKTtcbiAgICByZXR1cm4gdHhzLmxlbmd0aCA9PT0gMCA/IHVuZGVmaW5lZCA6IHR4c1swXTsgXG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5HZXQgd2FsbGV0IHRyYW5zYWN0aW9ucy4gIFdhbGxldCB0cmFuc2FjdGlvbnMgY29udGFpbiBvbmUgb3IgbW9yZVxuICAgKiB0cmFuc2ZlcnMgdGhhdCBhcmUgZWl0aGVyIGluY29taW5nIG9yIG91dGdvaW5nIHRvIHRoZSB3YWxsZXQuPHA+XG4gICAqIFxuICAgKiA8cD5SZXN1bHRzIGNhbiBiZSBmaWx0ZXJlZCBieSBwYXNzaW5nIGEgcXVlcnkgb2JqZWN0LiAgVHJhbnNhY3Rpb25zIG11c3RcbiAgICogbWVldCBldmVyeSBjcml0ZXJpYSBkZWZpbmVkIGluIHRoZSBxdWVyeSBpbiBvcmRlciB0byBiZSByZXR1cm5lZC4gIEFsbFxuICAgKiBjcml0ZXJpYSBhcmUgb3B0aW9uYWwgYW5kIG5vIGZpbHRlcmluZyBpcyBhcHBsaWVkIHdoZW4gbm90IGRlZmluZWQuPC9wPlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXSB8IE1vbmVyb1R4UXVlcnl9IFtxdWVyeV0gLSBjb25maWd1cmVzIHRoZSBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzQ29uZmlybWVkXSAtIGdldCB0eHMgdGhhdCBhcmUgY29uZmlybWVkIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmluVHhQb29sXSAtIGdldCB0eHMgdGhhdCBhcmUgaW4gdGhlIHR4IHBvb2wgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNSZWxheWVkXSAtIGdldCB0eHMgdGhhdCBhcmUgcmVsYXllZCBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc0ZhaWxlZF0gLSBnZXQgdHhzIHRoYXQgYXJlIGZhaWxlZCBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc01pbmVyVHhdIC0gZ2V0IG1pbmVyIHR4cyBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3F1ZXJ5Lmhhc2hdIC0gZ2V0IGEgdHggd2l0aCB0aGUgaGFzaCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IFtxdWVyeS5oYXNoZXNdIC0gZ2V0IHR4cyB3aXRoIHRoZSBoYXNoZXMgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3F1ZXJ5LnBheW1lbnRJZF0gLSBnZXQgdHJhbnNhY3Rpb25zIHdpdGggdGhlIHBheW1lbnQgaWQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBbcXVlcnkucGF5bWVudElkc10gLSBnZXQgdHJhbnNhY3Rpb25zIHdpdGggdGhlIHBheW1lbnQgaWRzIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaGFzUGF5bWVudElkXSAtIGdldCB0cmFuc2FjdGlvbnMgd2l0aCBhIHBheW1lbnQgaWQgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5taW5IZWlnaHRdIC0gZ2V0IHR4cyB3aXRoIGhlaWdodCA+PSB0aGUgZ2l2ZW4gaGVpZ2h0IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5tYXhIZWlnaHRdIC0gZ2V0IHR4cyB3aXRoIGhlaWdodCA8PSB0aGUgZ2l2ZW4gaGVpZ2h0IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNPdXRnb2luZ10gLSBnZXQgdHhzIHdpdGggYW4gb3V0Z29pbmcgdHJhbnNmZXIgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNJbmNvbWluZ10gLSBnZXQgdHhzIHdpdGggYW4gaW5jb21pbmcgdHJhbnNmZXIgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtNb25lcm9UcmFuc2ZlclF1ZXJ5fSBbcXVlcnkudHJhbnNmZXJRdWVyeV0gLSBnZXQgdHhzIHRoYXQgaGF2ZSBhIHRyYW5zZmVyIHRoYXQgbWVldHMgdGhpcyBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmluY2x1ZGVPdXRwdXRzXSAtIHNwZWNpZmllcyB0aGF0IHR4IG91dHB1dHMgc2hvdWxkIGJlIHJldHVybmVkIHdpdGggdHggcmVzdWx0cyAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhXYWxsZXRbXT59IHdhbGxldCB0cmFuc2FjdGlvbnMgcGVyIHRoZSBjb25maWd1cmF0aW9uXG4gICAqL1xuICBhc3luYyBnZXRUeHMocXVlcnk/OiBzdHJpbmdbXSB8IFBhcnRpYWw8TW9uZXJvVHhRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIDxwPkdldCBpbmNvbWluZyBhbmQgb3V0Z29pbmcgdHJhbnNmZXJzIHRvIGFuZCBmcm9tIHRoaXMgd2FsbGV0LiAgQW4gb3V0Z29pbmdcbiAgICogdHJhbnNmZXIgcmVwcmVzZW50cyBhIHRvdGFsIGFtb3VudCBzZW50IGZyb20gb25lIG9yIG1vcmUgc3ViYWRkcmVzc2VzXG4gICAqIHdpdGhpbiBhbiBhY2NvdW50IHRvIGluZGl2aWR1YWwgZGVzdGluYXRpb24gYWRkcmVzc2VzLCBlYWNoIHdpdGggdGhlaXJcbiAgICogb3duIGFtb3VudC4gIEFuIGluY29taW5nIHRyYW5zZmVyIHJlcHJlc2VudHMgYSB0b3RhbCBhbW91bnQgcmVjZWl2ZWQgaW50b1xuICAgKiBhIHN1YmFkZHJlc3Mgd2l0aGluIGFuIGFjY291bnQuICBUcmFuc2ZlcnMgYmVsb25nIHRvIHRyYW5zYWN0aW9ucyB3aGljaFxuICAgKiBhcmUgc3RvcmVkIG9uIHRoZSBibG9ja2NoYWluLjwvcD5cbiAgICogXG4gICAqIDxwPlJlc3VsdHMgY2FuIGJlIGZpbHRlcmVkIGJ5IHBhc3NpbmcgYSBxdWVyeSBvYmplY3QuICBUcmFuc2ZlcnMgbXVzdFxuICAgKiBtZWV0IGV2ZXJ5IGNyaXRlcmlhIGRlZmluZWQgaW4gdGhlIHF1ZXJ5IGluIG9yZGVyIHRvIGJlIHJldHVybmVkLiAgQWxsXG4gICAqIGNyaXRlcmlhIGFyZSBvcHRpb25hbCBhbmQgbm8gZmlsdGVyaW5nIGlzIGFwcGxpZWQgd2hlbiBub3QgZGVmaW5lZC48L3A+XG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1RyYW5zZmVyUXVlcnl9IFtxdWVyeV0gLSBjb25maWd1cmVzIHRoZSBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzT3V0Z29pbmddIC0gZ2V0IHRyYW5zZmVycyB0aGF0IGFyZSBvdXRnb2luZyBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc0luY29taW5nXSAtIGdldCB0cmFuc2ZlcnMgdGhhdCBhcmUgaW5jb21pbmcgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtxdWVyeS5hZGRyZXNzXSAtIHdhbGxldCdzIGFkZHJlc3MgdGhhdCBhIHRyYW5zZmVyIGVpdGhlciBvcmlnaW5hdGVkIGZyb20gKGlmIG91dGdvaW5nKSBvciBpcyBkZXN0aW5lZCBmb3IgKGlmIGluY29taW5nKSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkuYWNjb3VudEluZGV4XSAtIGdldCB0cmFuc2ZlcnMgdGhhdCBlaXRoZXIgb3JpZ2luYXRlZCBmcm9tIChpZiBvdXRnb2luZykgb3IgYXJlIGRlc3RpbmVkIGZvciAoaWYgaW5jb21pbmcpIGEgc3BlY2lmaWMgYWNjb3VudCBpbmRleCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkuc3ViYWRkcmVzc0luZGV4XSAtIGdldCB0cmFuc2ZlcnMgdGhhdCBlaXRoZXIgb3JpZ2luYXRlZCBmcm9tIChpZiBvdXRnb2luZykgb3IgYXJlIGRlc3RpbmVkIGZvciAoaWYgaW5jb21pbmcpIGEgc3BlY2lmaWMgc3ViYWRkcmVzcyBpbmRleCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7aW50W119IFtxdWVyeS5zdWJhZGRyZXNzSW5kaWNlc10gLSBnZXQgdHJhbnNmZXJzIHRoYXQgZWl0aGVyIG9yaWdpbmF0ZWQgZnJvbSAoaWYgb3V0Z29pbmcpIG9yIGFyZSBkZXN0aW5lZCBmb3IgKGlmIGluY29taW5nKSBzcGVjaWZpYyBzdWJhZGRyZXNzIGluZGljZXMgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludH0gW3F1ZXJ5LmFtb3VudF0gLSBhbW91bnQgYmVpbmcgdHJhbnNmZXJyZWQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb0Rlc3RpbmF0aW9uW10gfCBNb25lcm9EZXN0aW5hdGlvbk1vZGVsW119IFtxdWVyeS5kZXN0aW5hdGlvbnNdIC0gaW5kaXZpZHVhbCBkZXN0aW5hdGlvbnMgb2YgYW4gb3V0Z29pbmcgdHJhbnNmZXIsIHdoaWNoIGlzIGxvY2FsIHdhbGxldCBkYXRhIGFuZCBOT1QgcmVjb3ZlcmFibGUgZnJvbSB0aGUgYmxvY2tjaGFpbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5Lmhhc0Rlc3RpbmF0aW9uc10gLSBnZXQgdHJhbnNmZXJzIHRoYXQgaGF2ZSBkZXN0aW5hdGlvbnMgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtNb25lcm9UeFF1ZXJ5fSBbcXVlcnkudHhRdWVyeV0gLSBnZXQgdHJhbnNmZXJzIHdob3NlIHRyYW5zYWN0aW9uIG1lZXRzIHRoaXMgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1RyYW5zZmVyW10+fSB3YWxsZXQgdHJhbnNmZXJzIHRoYXQgbWVldCB0aGUgcXVlcnlcbiAgICovXG4gIGFzeW5jIGdldFRyYW5zZmVycyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb1RyYW5zZmVyW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGluY29taW5nIHRyYW5zZmVycy5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pn0gW3F1ZXJ5XSAtIGNvbmZpZ3VyZXMgdGhlIHF1ZXJ5IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtxdWVyeS5hZGRyZXNzXSAtIGdldCBpbmNvbWluZyB0cmFuc2ZlcnMgdG8gYSBzcGVjaWZpYyBhZGRyZXNzIGluIHRoZSB3YWxsZXQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LmFjY291bnRJbmRleF0gLSBnZXQgaW5jb21pbmcgdHJhbnNmZXJzIHRvIGEgc3BlY2lmaWMgYWNjb3VudCBpbmRleCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkuc3ViYWRkcmVzc0luZGV4XSAtIGdldCBpbmNvbWluZyB0cmFuc2ZlcnMgdG8gYSBzcGVjaWZpYyBzdWJhZGRyZXNzIGluZGV4IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtpbnRbXX0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRpY2VzXSAtIGdldCB0cmFuc2ZlcnMgZGVzdGluZWQgZm9yIHNwZWNpZmljIHN1YmFkZHJlc3MgaW5kaWNlcyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7YmlnaW50fSBbcXVlcnkuYW1vdW50XSAtIGFtb3VudCBiZWluZyB0cmFuc2ZlcnJlZCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhRdWVyeX0gW3F1ZXJ5LnR4UXVlcnldIC0gZ2V0IHRyYW5zZmVycyB3aG9zZSB0cmFuc2FjdGlvbiBtZWV0cyB0aGlzIHF1ZXJ5IChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9JbmNvbWluZ1RyYW5zZmVyW10+fSBpbmNvbWluZyB0cmFuc2ZlcnMgdGhhdCBtZWV0IHRoZSBxdWVyeVxuICAgKi9cbiAgYXN5bmMgZ2V0SW5jb21pbmdUcmFuc2ZlcnMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9JbmNvbWluZ1RyYW5zZmVyW10+IHtcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQ6IE1vbmVyb1RyYW5zZmVyUXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSk7XG4gICAgaWYgKHF1ZXJ5Tm9ybWFsaXplZC5nZXRJc0luY29taW5nKCkgPT09IGZhbHNlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJUcmFuc2ZlciBxdWVyeSBjb250cmFkaWN0cyBnZXR0aW5nIGluY29taW5nIHRyYW5zZmVyc1wiKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0SXNJbmNvbWluZyh0cnVlKTtcbiAgICByZXR1cm4gdGhpcy5nZXRUcmFuc2ZlcnMocXVlcnlOb3JtYWxpemVkKSBhcyB1bmtub3duIGFzIE1vbmVyb0luY29taW5nVHJhbnNmZXJbXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBvdXRnb2luZyB0cmFuc2ZlcnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT59IFtxdWVyeV0gLSBjb25maWd1cmVzIHRoZSBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcXVlcnkuYWRkcmVzc10gLSBnZXQgb3V0Z29pbmcgdHJhbnNmZXJzIGZyb20gYSBzcGVjaWZpYyBhZGRyZXNzIGluIHRoZSB3YWxsZXQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LmFjY291bnRJbmRleF0gLSBnZXQgb3V0Z29pbmcgdHJhbnNmZXJzIGZyb20gYSBzcGVjaWZpYyBhY2NvdW50IGluZGV4IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5zdWJhZGRyZXNzSW5kZXhdIC0gZ2V0IG91dGdvaW5nIHRyYW5zZmVycyBmcm9tIGEgc3BlY2lmaWMgc3ViYWRkcmVzcyBpbmRleCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7aW50W119IFtxdWVyeS5zdWJhZGRyZXNzSW5kaWNlc10gLSBnZXQgb3V0Z29pbmcgdHJhbnNmZXJzIGZyb20gc3BlY2lmaWMgc3ViYWRkcmVzcyBpbmRpY2VzIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtiaWdpbnR9IFtxdWVyeS5hbW91bnRdIC0gYW1vdW50IGJlaW5nIHRyYW5zZmVycmVkIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtNb25lcm9EZXN0aW5hdGlvbltdIHwgTW9uZXJvRGVzdGluYXRpb25Nb2RlbFtdfSBbcXVlcnkuZGVzdGluYXRpb25zXSAtIGluZGl2aWR1YWwgZGVzdGluYXRpb25zIG9mIGFuIG91dGdvaW5nIHRyYW5zZmVyLCB3aGljaCBpcyBsb2NhbCB3YWxsZXQgZGF0YSBhbmQgTk9UIHJlY292ZXJhYmxlIGZyb20gdGhlIGJsb2NrY2hhaW4gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5oYXNEZXN0aW5hdGlvbnNdIC0gZ2V0IHRyYW5zZmVycyB0aGF0IGhhdmUgZGVzdGluYXRpb25zIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhRdWVyeX0gW3F1ZXJ5LnR4UXVlcnldIC0gZ2V0IHRyYW5zZmVycyB3aG9zZSB0cmFuc2FjdGlvbiBtZWV0cyB0aGlzIHF1ZXJ5IChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9PdXRnb2luZ1RyYW5zZmVyW10+fSBvdXRnb2luZyB0cmFuc2ZlcnMgdGhhdCBtZWV0IHRoZSBxdWVyeVxuICAgKi9cbiAgYXN5bmMgZ2V0T3V0Z29pbmdUcmFuc2ZlcnMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9PdXRnb2luZ1RyYW5zZmVyW10+IHtcbiAgICBjb25zdCBxdWVyeU5vcm1hbGl6ZWQ6IE1vbmVyb1RyYW5zZmVyUXVlcnkgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSk7XG4gICAgaWYgKHF1ZXJ5Tm9ybWFsaXplZC5nZXRJc091dGdvaW5nKCkgPT09IGZhbHNlKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJUcmFuc2ZlciBxdWVyeSBjb250cmFkaWN0cyBnZXR0aW5nIG91dGdvaW5nIHRyYW5zZmVyc1wiKTtcbiAgICBxdWVyeU5vcm1hbGl6ZWQuc2V0SXNPdXRnb2luZyh0cnVlKTtcbiAgICByZXR1cm4gdGhpcy5nZXRUcmFuc2ZlcnMocXVlcnlOb3JtYWxpemVkKSBhcyB1bmtub3duIGFzIE1vbmVyb091dGdvaW5nVHJhbnNmZXJbXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPkdldCBvdXRwdXRzIGNyZWF0ZWQgZnJvbSBwcmV2aW91cyB0cmFuc2FjdGlvbnMgdGhhdCBiZWxvbmcgdG8gdGhlIHdhbGxldFxuICAgKiAoaS5lLiB0aGF0IHRoZSB3YWxsZXQgY2FuIHNwZW5kIG9uZSB0aW1lKS4gIE91dHB1dHMgYXJlIHBhcnQgb2ZcbiAgICogdHJhbnNhY3Rpb25zIHdoaWNoIGFyZSBzdG9yZWQgaW4gYmxvY2tzIG9uIHRoZSBibG9ja2NoYWluLjwvcD5cbiAgICogXG4gICAqIDxwPlJlc3VsdHMgY2FuIGJlIGZpbHRlcmVkIGJ5IHBhc3NpbmcgYSBxdWVyeSBvYmplY3QuICBPdXRwdXRzIG11c3RcbiAgICogbWVldCBldmVyeSBjcml0ZXJpYSBkZWZpbmVkIGluIHRoZSBxdWVyeSBpbiBvcmRlciB0byBiZSByZXR1cm5lZC4gIEFsbFxuICAgKiBmaWx0ZXJpbmcgaXMgb3B0aW9uYWwgYW5kIG5vIGZpbHRlcmluZyBpcyBhcHBsaWVkIHdoZW4gbm90IGRlZmluZWQuPC9wPlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJpdGFsPE1vbmVyb091dHB1dFF1ZXJ5Pn0gW3F1ZXJ5XSAtIGNvbmZpZ3VyZXMgdGhlIHF1ZXJ5IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5hY2NvdW50SW5kZXhdIC0gZ2V0IG91dHB1dHMgYXNzb2NpYXRlZCB3aXRoIGEgc3BlY2lmaWMgYWNjb3VudCBpbmRleCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkuc3ViYWRkcmVzc0luZGV4XSAtIGdldCBvdXRwdXRzIGFzc29jaWF0ZWQgd2l0aCBhIHNwZWNpZmljIHN1YmFkZHJlc3MgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2ludFtdfSBbcXVlcnkuc3ViYWRkcmVzc0luZGljZXNdIC0gZ2V0IG91dHB1dHMgYXNzb2NpYXRlZCB3aXRoIHNwZWNpZmljIHN1YmFkZHJlc3MgaW5kaWNlcyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7YmlnaW50fSBbcXVlcnkuYW1vdW50XSAtIGdldCBvdXRwdXRzIHdpdGggYSBzcGVjaWZpYyBhbW91bnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludH0gW3F1ZXJ5Lm1pbkFtb3VudF0gLSBnZXQgb3V0cHV0cyBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gYSBtaW5pbXVtIGFtb3VudCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7YmlnaW50fSBbcXVlcnkubWF4QW1vdW50XSAtIGdldCBvdXRwdXRzIGxlc3MgdGhhbiBvciBlcXVhbCB0byBhIG1heGltdW0gYW1vdW50IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNTcGVudF0gLSBnZXQgb3V0cHV0cyB0aGF0IGFyZSBzcGVudCBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ3xNb25lcm9LZXlJbWFnZX0gW3F1ZXJ5LmtleUltYWdlXSAtIGdldCBvdXRwdXQgd2l0aCBhIGtleSBpbWFnZSBvciB3aGljaCBtYXRjaGVzIGZpZWxkcyBkZWZpbmVkIGluIGEgTW9uZXJvS2V5SW1hZ2UgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UXVlcnl9IFtxdWVyeS50eFF1ZXJ5XSAtIGdldCBvdXRwdXRzIHdob3NlIHRyYW5zYWN0aW9uIG1lZXRzIHRoaXMgZmlsdGVyIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9PdXRwdXRXYWxsZXRbXT59IHRoZSBxdWVyaWVkIG91dHB1dHNcbiAgICovXG4gIGFzeW5jIGdldE91dHB1dHMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb091dHB1dFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvT3V0cHV0V2FsbGV0W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRXhwb3J0IG91dHB1dHMgaW4gaGV4IGZvcm1hdC5cbiAgICpcbiAgICogQHBhcmFtIHtib29sZWFufSBbYWxsXSAtIGV4cG9ydCBhbGwgb3V0cHV0cyBpZiB0cnVlLCBlbHNlIGV4cG9ydCB0aGUgb3V0cHV0cyBzaW5jZSB0aGUgbGFzdCBleHBvcnQgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gb3V0cHV0cyBpbiBoZXggZm9ybWF0XG4gICAqL1xuICBhc3luYyBleHBvcnRPdXRwdXRzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogSW1wb3J0IG91dHB1dHMgaW4gaGV4IGZvcm1hdC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvdXRwdXRzSGV4IC0gb3V0cHV0cyBpbiBoZXggZm9ybWF0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIG51bWJlciBvZiBvdXRwdXRzIGltcG9ydGVkXG4gICAqL1xuICBhc3luYyBpbXBvcnRPdXRwdXRzKG91dHB1dHNIZXg6IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEV4cG9ydCBzaWduZWQga2V5IGltYWdlcy5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2FsbF0gLSBleHBvcnQgYWxsIGtleSBpbWFnZXMgaWYgdHJ1ZSwgZWxzZSBleHBvcnQgdGhlIGtleSBpbWFnZXMgc2luY2UgdGhlIGxhc3QgZXhwb3J0IChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0tleUltYWdlRXhwb3J0UmVzdWx0Pn0gdGhlIHdhbGxldCdzIHNpZ25lZCBrZXkgaW1hZ2VzIGFuZCB0aGVpciBvZmZzZXQgYW1vbmcgdGhlIHdhbGxldCdzIG91dHB1dHNcbiAgICovXG4gIGFzeW5jIGV4cG9ydEtleUltYWdlcyhhbGwgPSBmYWxzZSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VFeHBvcnRSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogSW1wb3J0IHNpZ25lZCBrZXkgaW1hZ2VzIGFuZCB2ZXJpZnkgdGhlaXIgc3BlbnQgc3RhdHVzLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9LZXlJbWFnZVtdfSBrZXlJbWFnZXMgLSBpbWFnZXMgdG8gaW1wb3J0IGFuZCB2ZXJpZnkgKHJlcXVpcmVzIGhleCBhbmQgc2lnbmF0dXJlKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW29mZnNldF0gLSBvZmZzZXQgb2YgdGhlIGZpcnN0IGtleSBpbWFnZSBhbW9uZyB0aGUgd2FsbGV0J3Mgb3V0cHV0cyAoZGVmYXVsdCAwKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0Pn0gcmVzdWx0cyBvZiB0aGUgaW1wb3J0XG4gICAqL1xuICBhc3luYyBpbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzOiBNb25lcm9LZXlJbWFnZVtdLCBvZmZzZXQgPSAwKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgbmV3IGtleSBpbWFnZXMgZnJvbSB0aGUgbGFzdCBpbXBvcnRlZCBvdXRwdXRzLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPn0gdGhlIGtleSBpbWFnZXMgZnJvbSB0aGUgbGFzdCBpbXBvcnRlZCBvdXRwdXRzXG4gICAqL1xuICBhc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRnJlZXplIGFuIG91dHB1dC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJbWFnZSAtIGtleSBpbWFnZSBvZiB0aGUgb3V0cHV0IHRvIGZyZWV6ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgZnJlZXplT3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogVGhhdyBhIGZyb3plbiBvdXRwdXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SW1hZ2UgLSBrZXkgaW1hZ2Ugb2YgdGhlIG91dHB1dCB0byB0aGF3XG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyB0aGF3T3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ2hlY2sgaWYgYW4gb3V0cHV0IGlzIGZyb3plbi5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJbWFnZSAtIGtleSBpbWFnZSBvZiB0aGUgb3V0cHV0IHRvIGNoZWNrIGlmIGZyb3plblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSBvdXRwdXQgaXMgZnJvemVuLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzT3V0cHV0RnJvemVuKGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIEdldCB0aGUgY3VycmVudCBkZWZhdWx0IGZlZSBwcmlvcml0eSAodW5pbXBvcnRhbnQsIG5vcm1hbCwgZWxldmF0ZWQsIGV0YykuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4UHJpb3JpdHk+fSB0aGUgY3VycmVudCBmZWUgcHJpb3JpdHlcbiAgICovXG4gIGFzeW5jIGdldERlZmF1bHRGZWVQcmlvcml0eSgpOiBQcm9taXNlPE1vbmVyb1R4UHJpb3JpdHk+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ3JlYXRlIGEgdHJhbnNhY3Rpb24gdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSB0aGlzIHdhbGxldC5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhDb25maWd9IGNvbmZpZyAtIGNvbmZpZ3VyZXMgdGhlIHRyYW5zYWN0aW9uIHRvIGNyZWF0ZSAocmVxdWlyZWQpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb25maWcuYWRkcmVzcyAtIHNpbmdsZSBkZXN0aW5hdGlvbiBhZGRyZXNzIChyZXF1aXJlZCB1bmxlc3MgYGRlc3RpbmF0aW9uc2AgcHJvdmlkZWQpXG4gICAqIEBwYXJhbSB7YmlnaW50fHN0cmluZ30gY29uZmlnLmFtb3VudCAtIHNpbmdsZSBkZXN0aW5hdGlvbiBhbW91bnQgKHJlcXVpcmVkIHVubGVzcyBgZGVzdGluYXRpb25zYCBwcm92aWRlZClcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNvbmZpZy5hY2NvdW50SW5kZXggLSBzb3VyY2UgYWNjb3VudCBpbmRleCB0byB0cmFuc2ZlciBmdW5kcyBmcm9tIChyZXF1aXJlZClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcuc3ViYWRkcmVzc0luZGV4XSAtIHNvdXJjZSBzdWJhZGRyZXNzIGluZGV4IHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcltdfSBbY29uZmlnLnN1YmFkZHJlc3NJbmRpY2VzXSAtIHNvdXJjZSBzdWJhZGRyZXNzIGluZGljZXMgdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5yZWxheV0gLSByZWxheSB0aGUgdHJhbnNhY3Rpb24gdG8gcGVlcnMgdG8gY29tbWl0IHRvIHRoZSBibG9ja2NoYWluIChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UHJpb3JpdHl9IFtjb25maWcucHJpb3JpdHldIC0gdHJhbnNhY3Rpb24gcHJpb3JpdHkgKGRlZmF1bHQgTW9uZXJvVHhQcmlvcml0eS5OT1JNQUwpXG4gICAqIEBwYXJhbSB7TW9uZXJvRGVzdGluYXRpb25bXX0gY29uZmlnLmRlc3RpbmF0aW9ucyAtIGFkZHJlc3NlcyBhbmQgYW1vdW50cyBpbiBhIG11bHRpLWRlc3RpbmF0aW9uIHR4IChyZXF1aXJlZCB1bmxlc3MgYGFkZHJlc3NgIGFuZCBgYW1vdW50YCBwcm92aWRlZClcbiAgICogQHBhcmFtIHtudW1iZXJbXX0gW2NvbmZpZy5zdWJ0cmFjdEZlZUZyb21dIC0gbGlzdCBvZiBkZXN0aW5hdGlvbiBpbmRpY2VzIHRvIHNwbGl0IHRoZSB0cmFuc2FjdGlvbiBmZWUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXltZW50SWRdIC0gdHJhbnNhY3Rpb24gcGF5bWVudCBJRCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7YmlnaW50fHN0cmluZ30gW2NvbmZpZy51bmxvY2tUaW1lXSAtIG1pbmltdW0gaGVpZ2h0IG9yIHRpbWVzdGFtcCBmb3IgdGhlIHRyYW5zYWN0aW9uIHRvIHVubG9jayAoZGVmYXVsdCAwKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4V2FsbGV0Pn0gdGhlIGNyZWF0ZWQgdHJhbnNhY3Rpb25cbiAgICovXG4gIGFzeW5jIGNyZWF0ZVR4KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7XG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZDogTW9uZXJvVHhDb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSAhPT0gdW5kZWZpbmVkKSBhc3NlcnQuZXF1YWwoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpLCBmYWxzZSwgXCJDYW5ub3Qgc3BsaXQgdHJhbnNhY3Rpb25zIHVzaW5nIGNyZWF0ZVR4KCk7IHVzZSBjcmVhdGVUeHMoKVwiKTtcbiAgICBjb25maWdOb3JtYWxpemVkLnNldENhblNwbGl0KGZhbHNlKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY3JlYXRlVHhzKGNvbmZpZ05vcm1hbGl6ZWQpKVswXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENyZWF0ZSBvbmUgb3IgbW9yZSB0cmFuc2FjdGlvbnMgdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSB0aGlzIHdhbGxldC5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9UeENvbmZpZz59IGNvbmZpZyAtIGNvbmZpZ3VyZXMgdGhlIHRyYW5zYWN0aW9ucyB0byBjcmVhdGUgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmFkZHJlc3MgLSBzaW5nbGUgZGVzdGluYXRpb24gYWRkcmVzcyAocmVxdWlyZWQgdW5sZXNzIGBkZXN0aW5hdGlvbnNgIHByb3ZpZGVkKVxuICAgKiBAcGFyYW0ge2JpZ2ludHxzdHJpbmd9IGNvbmZpZy5hbW91bnQgLSBzaW5nbGUgZGVzdGluYXRpb24gYW1vdW50IChyZXF1aXJlZCB1bmxlc3MgYGRlc3RpbmF0aW9uc2AgcHJvdmlkZWQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBjb25maWcuYWNjb3VudEluZGV4IC0gc291cmNlIGFjY291bnQgaW5kZXggdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSAocmVxdWlyZWQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnN1YmFkZHJlc3NJbmRleF0gLSBzb3VyY2Ugc3ViYWRkcmVzcyBpbmRleCB0byB0cmFuc2ZlciBmdW5kcyBmcm9tIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtpbnRbXX0gW2NvbmZpZy5zdWJhZGRyZXNzSW5kaWNlc10gLSBzb3VyY2Ugc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucmVsYXldIC0gcmVsYXkgdGhlIHRyYW5zYWN0aW9ucyB0byBwZWVycyB0byBjb21taXQgdG8gdGhlIGJsb2NrY2hhaW4gKGRlZmF1bHQgZmFsc2UpXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhQcmlvcml0eX0gW2NvbmZpZy5wcmlvcml0eV0gLSB0cmFuc2FjdGlvbiBwcmlvcml0eSAoZGVmYXVsdCBNb25lcm9UeFByaW9yaXR5Lk5PUk1BTClcbiAgICogQHBhcmFtIHtNb25lcm9EZXN0aW5hdGlvbltdIHwgTW9uZXJvRGVzdGluYXRpb25Nb2RlbFtdfSBjb25maWcuZGVzdGluYXRpb25zIC0gYWRkcmVzc2VzIGFuZCBhbW91bnRzIGluIGEgbXVsdGktZGVzdGluYXRpb24gdHggKHJlcXVpcmVkIHVubGVzcyBgYWRkcmVzc2AgYW5kIGBhbW91bnRgIHByb3ZpZGVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXltZW50SWRdIC0gdHJhbnNhY3Rpb24gcGF5bWVudCBJRCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7YmlnaW50fHN0cmluZ30gW2NvbmZpZy51bmxvY2tUaW1lXSAtIG1pbmltdW0gaGVpZ2h0IG9yIHRpbWVzdGFtcCBmb3IgdGhlIHRyYW5zYWN0aW9ucyB0byB1bmxvY2sgKGRlZmF1bHQgMClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLmNhblNwbGl0XSAtIGFsbG93IGZ1bmRzIHRvIGJlIHRyYW5zZmVycmVkIHVzaW5nIG11bHRpcGxlIHRyYW5zYWN0aW9ucyAoZGVmYXVsdCB0cnVlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+fSB0aGUgY3JlYXRlZCB0cmFuc2FjdGlvbnNcbiAgICovXG4gIGFzeW5jIGNyZWF0ZVR4cyhjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN3ZWVwIGFuIG91dHB1dCBieSBrZXkgaW1hZ2UuXG4gICAqIFxuICAgKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvVHhDb25maWc+fSBjb25maWcgLSBjb25maWd1cmVzIHRoZSB0cmFuc2FjdGlvbiB0byBjcmVhdGUgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmFkZHJlc3MgLSBzaW5nbGUgZGVzdGluYXRpb24gYWRkcmVzcyAocmVxdWlyZWQpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb25maWcua2V5SW1hZ2UgLSBrZXkgaW1hZ2UgdG8gc3dlZXAgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucmVsYXldIC0gcmVsYXkgdGhlIHRyYW5zYWN0aW9uIHRvIHBlZXJzIHRvIGNvbW1pdCB0byB0aGUgYmxvY2tjaGFpbiAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHBhcmFtIHtiaWdpbnR8c3RyaW5nfSBbY29uZmlnLnVubG9ja1RpbWVdIC0gbWluaW11bSBoZWlnaHQgb3IgdGltZXN0YW1wIGZvciB0aGUgdHJhbnNhY3Rpb24gdG8gdW5sb2NrIChkZWZhdWx0IDApXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhQcmlvcml0eX0gW2NvbmZpZy5wcmlvcml0eV0gLSB0cmFuc2FjdGlvbiBwcmlvcml0eSAoZGVmYXVsdCBNb25lcm9UeFByaW9yaXR5Lk5PUk1BTClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldD59IHRoZSBjcmVhdGVkIHRyYW5zYWN0aW9uXG4gICAqL1xuICBhc3luYyBzd2VlcE91dHB1dChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogU3dlZXAgYWxsIHVubG9ja2VkIGZ1bmRzIGFjY29yZGluZyB0byB0aGUgZ2l2ZW4gY29uZmlndXJhdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9UeENvbmZpZz59IGNvbmZpZyAtIGNvbmZpZ3VyZXMgdGhlIHRyYW5zYWN0aW9ucyB0byBjcmVhdGUgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmFkZHJlc3MgLSBzaW5nbGUgZGVzdGluYXRpb24gYWRkcmVzcyAocmVxdWlyZWQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLmFjY291bnRJbmRleF0gLSBzb3VyY2UgYWNjb3VudCBpbmRleCB0byBzd2VlcCBmcm9tIChvcHRpb25hbCwgZGVmYXVsdHMgdG8gYWxsIGFjY291bnRzKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy5zdWJhZGRyZXNzSW5kZXhdIC0gc291cmNlIHN1YmFkZHJlc3MgaW5kZXggdG8gc3dlZXAgZnJvbSAob3B0aW9uYWwsIGRlZmF1bHRzIHRvIGFsbCBzdWJhZGRyZXNzZXMpXG4gICAqIEBwYXJhbSB7bnVtYmVyW119IFtjb25maWcuc3ViYWRkcmVzc0luZGljZXNdIC0gc291cmNlIHN1YmFkZHJlc3MgaW5kaWNlcyB0byBzd2VlcCBmcm9tIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnJlbGF5XSAtIHJlbGF5IHRoZSB0cmFuc2FjdGlvbnMgdG8gcGVlcnMgdG8gY29tbWl0IHRvIHRoZSBibG9ja2NoYWluIChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UHJpb3JpdHl9IFtjb25maWcucHJpb3JpdHldIC0gdHJhbnNhY3Rpb24gcHJpb3JpdHkgKGRlZmF1bHQgTW9uZXJvVHhQcmlvcml0eS5OT1JNQUwpXG4gICAqIEBwYXJhbSB7YmlnaW50fHN0cmluZ30gW2NvbmZpZy51bmxvY2tUaW1lXSAtIG1pbmltdW0gaGVpZ2h0IG9yIHRpbWVzdGFtcCBmb3IgdGhlIHRyYW5zYWN0aW9ucyB0byB1bmxvY2sgKGRlZmF1bHQgMClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnN3ZWVwRWFjaFN1YmFkZHJlc3NdIC0gc3dlZXAgZWFjaCBzdWJhZGRyZXNzIGluZGl2aWR1YWxseSBpZiB0cnVlIChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+fSB0aGUgY3JlYXRlZCB0cmFuc2FjdGlvbnNcbiAgICovXG4gIGFzeW5jIHN3ZWVwVW5sb2NrZWQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5Td2VlcCBhbGwgdW5taXhhYmxlIGR1c3Qgb3V0cHV0cyBiYWNrIHRvIHRoZSB3YWxsZXQgdG8gbWFrZSB0aGVtIGVhc2llciB0byBzcGVuZCBhbmQgbWl4LjwvcD5cbiAgICogXG4gICAqIDxwPk5PVEU6IER1c3Qgb25seSBleGlzdHMgcHJlIFJDVCwgc28gdGhpcyBtZXRob2Qgd2lsbCB0aHJvdyBcIm5vIGR1c3QgdG8gc3dlZXBcIiBvbiBuZXcgd2FsbGV0cy48L3A+XG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtyZWxheV0gLSBzcGVjaWZpZXMgaWYgdGhlIHJlc3VsdGluZyB0cmFuc2FjdGlvbiBzaG91bGQgYmUgcmVsYXllZCAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPn0gdGhlIGNyZWF0ZWQgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBzd2VlcER1c3QocmVsYXk/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJlbGF5IGEgcHJldmlvdXNseSBjcmVhdGVkIHRyYW5zYWN0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHsoTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpfSB0eE9yTWV0YWRhdGEgLSB0cmFuc2FjdGlvbiBvciBpdHMgbWV0YWRhdGEgdG8gcmVsYXlcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgaGFzaCBvZiB0aGUgcmVsYXllZCB0eFxuICAgKi9cbiAgYXN5bmMgcmVsYXlUeCh0eE9yTWV0YWRhdGE6IE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMucmVsYXlUeHMoW3R4T3JNZXRhZGF0YV0pKVswXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJlbGF5IHByZXZpb3VzbHkgY3JlYXRlZCB0cmFuc2FjdGlvbnMuXG4gICAqIFxuICAgKiBAcGFyYW0geyhNb25lcm9UeFdhbGxldFtdIHwgc3RyaW5nW10pfSB0eHNPck1ldGFkYXRhcyAtIHRyYW5zYWN0aW9ucyBvciB0aGVpciBtZXRhZGF0YSB0byByZWxheVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZ1tdPn0gdGhlIGhhc2hlcyBvZiB0aGUgcmVsYXllZCB0eHNcbiAgICovXG4gIGFzeW5jIHJlbGF5VHhzKHR4c09yTWV0YWRhdGFzOiAoTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlc2NyaWJlIGEgdHggc2V0IGZyb20gdW5zaWduZWQgdHggaGV4LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVuc2lnbmVkVHhIZXggLSB1bnNpZ25lZCB0eCBoZXhcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFNldD59IHRoZSB0eCBzZXQgY29udGFpbmluZyBzdHJ1Y3R1cmVkIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgZGVzY3JpYmVVbnNpZ25lZFR4U2V0KHVuc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICByZXR1cm4gdGhpcy5kZXNjcmliZVR4U2V0KG5ldyBNb25lcm9UeFNldCgpLnNldFVuc2lnbmVkVHhIZXgodW5zaWduZWRUeEhleCkpO1xuICB9XG4gIFxuICAvKipcbiAgICogRGVzY3JpYmUgYSB0eCBzZXQgZnJvbSBtdWx0aXNpZyB0eCBoZXguXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbXVsdGlzaWdUeEhleCAtIG11bHRpc2lnIHR4IGhleFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4U2V0Pn0gdGhlIHR4IHNldCBjb250YWluaW5nIHN0cnVjdHVyZWQgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBkZXNjcmliZU11bHRpc2lnVHhTZXQobXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIHJldHVybiB0aGlzLmRlc2NyaWJlVHhTZXQobmV3IE1vbmVyb1R4U2V0KCkuc2V0TXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4KSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZXNjcmliZSBhIHR4IHNldCBjb250YWluaW5nIHVuc2lnbmVkIG9yIG11bHRpc2lnIHR4IGhleCB0byBhIG5ldyB0eCBzZXQgY29udGFpbmluZyBzdHJ1Y3R1cmVkIHRyYW5zYWN0aW9ucy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhTZXR9IHR4U2V0IC0gYSB0eCBzZXQgY29udGFpbmluZyB1bnNpZ25lZCBvciBtdWx0aXNpZyB0eCBoZXhcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFNldD59IHR4U2V0IC0gdGhlIHR4IHNldCBjb250YWluaW5nIHN0cnVjdHVyZWQgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0OiBNb25lcm9UeFNldCk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2lnbiB1bnNpZ25lZCB0cmFuc2FjdGlvbnMgZnJvbSBhIHZpZXctb25seSB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdW5zaWduZWRUeEhleCAtIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGhleCBmcm9tIHdoZW4gdGhlIHRyYW5zYWN0aW9ucyB3ZXJlIGNyZWF0ZWRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFNldD59IHRoZSBzaWduZWQgdHJhbnNhY3Rpb24gc2V0XG4gICAqL1xuICBhc3luYyBzaWduVHhzKHVuc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3VibWl0IHNpZ25lZCB0cmFuc2FjdGlvbnMgZnJvbSBhIHZpZXctb25seSB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2lnbmVkVHhIZXggLSBzaWduZWQgdHJhbnNhY3Rpb24gaGV4IGZyb20gc2lnblR4cygpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nW10+fSB0aGUgcmVzdWx0aW5nIHRyYW5zYWN0aW9uIGhhc2hlc1xuICAgKi9cbiAgYXN5bmMgc3VibWl0VHhzKHNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNpZ24gYSBtZXNzYWdlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSB0aGUgbWVzc2FnZSB0byBzaWduXG4gICAqIEBwYXJhbSB7TW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGV9IFtzaWduYXR1cmVUeXBlXSAtIHNpZ24gd2l0aCBzcGVuZCBrZXkgb3IgdmlldyBrZXkgKGRlZmF1bHQgc3BlbmQga2V5KVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2FjY291bnRJZHhdIC0gdGhlIGFjY291bnQgaW5kZXggb2YgdGhlIG1lc3NhZ2Ugc2lnbmF0dXJlIChkZWZhdWx0IDApXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3ViYWRkcmVzc0lkeF0gLSB0aGUgc3ViYWRkcmVzcyBpbmRleCBvZiB0aGUgbWVzc2FnZSBzaWduYXR1cmUgKGRlZmF1bHQgMClcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgc2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIHNpZ25hdHVyZVR5cGUgPSBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZLCBhY2NvdW50SWR4ID0gMCwgc3ViYWRkcmVzc0lkeCA9IDApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBWZXJpZnkgYSBzaWduYXR1cmUgb24gYSBtZXNzYWdlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBzaWduZWQgbWVzc2FnZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIHNpZ25pbmcgYWRkcmVzc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gc2lnbmF0dXJlIC0gc2lnbmF0dXJlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdD59IHRydWUgaWYgdGhlIHNpZ25hdHVyZSBpcyBnb29kLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIHZlcmlmeU1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIHRyYW5zYWN0aW9uJ3Mgc2VjcmV0IGtleSBmcm9tIGl0cyBoYXNoLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIHRyYW5zYWN0aW9uJ3MgaGFzaFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IC0gdHJhbnNhY3Rpb24ncyBzZWNyZXQga2V5XG4gICAqL1xuICBhc3luYyBnZXRUeEtleSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENoZWNrIGEgdHJhbnNhY3Rpb24gaW4gdGhlIGJsb2NrY2hhaW4gd2l0aCBpdHMgc2VjcmV0IGtleS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSB0cmFuc2FjdGlvbiB0byBjaGVja1xuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhLZXkgLSB0cmFuc2FjdGlvbidzIHNlY3JldCBrZXlcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBkZXN0aW5hdGlvbiBwdWJsaWMgYWRkcmVzcyBvZiB0aGUgdHJhbnNhY3Rpb25cbiAgICogQHJldHVybiB7cm9taXNlPE1vbmVyb0NoZWNrVHg+fSB0aGUgcmVzdWx0IG9mIHRoZSBjaGVja1xuICAgKi9cbiAgYXN5bmMgY2hlY2tUeEtleSh0eEhhc2g6IHN0cmluZywgdHhLZXk6IHN0cmluZywgYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIHRyYW5zYWN0aW9uIHNpZ25hdHVyZSB0byBwcm92ZSBpdC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSB0cmFuc2FjdGlvbiB0byBwcm92ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIGRlc3RpbmF0aW9uIHB1YmxpYyBhZGRyZXNzIG9mIHRoZSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gW21lc3NhZ2VdIC0gbWVzc2FnZSB0byBpbmNsdWRlIHdpdGggdGhlIHNpZ25hdHVyZSB0byBmdXJ0aGVyIGF1dGhlbnRpY2F0ZSB0aGUgcHJvb2YgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB0cmFuc2FjdGlvbiBzaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIGdldFR4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFByb3ZlIGEgdHJhbnNhY3Rpb24gYnkgY2hlY2tpbmcgaXRzIHNpZ25hdHVyZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSB0cmFuc2FjdGlvbiB0byBwcm92ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIGRlc3RpbmF0aW9uIHB1YmxpYyBhZGRyZXNzIG9mIHRoZSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge3N0cmluZyB8IHVuZGVmaW5lZH0gbWVzc2FnZSAtIG1lc3NhZ2UgaW5jbHVkZWQgd2l0aCB0aGUgc2lnbmF0dXJlIHRvIGZ1cnRoZXIgYXV0aGVudGljYXRlIHRoZSBwcm9vZlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2lnbmF0dXJlICAtIHRyYW5zYWN0aW9uIHNpZ25hdHVyZSB0byBjb25maXJtXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQ2hlY2tUeD59IHRoZSByZXN1bHQgb2YgdGhlIGNoZWNrXG4gICAqL1xuICBhc3luYyBjaGVja1R4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhIHNpZ25hdHVyZSB0byBwcm92ZSBhIHNwZW5kLiBVbmxpa2UgcHJvdmluZyBhIHRyYW5zYWN0aW9uLCBpdCBkb2VzIG5vdCByZXF1aXJlIHRoZSBkZXN0aW5hdGlvbiBwdWJsaWMgYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSB0cmFuc2FjdGlvbiB0byBwcm92ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW21lc3NhZ2VdIC0gbWVzc2FnZSB0byBpbmNsdWRlIHdpdGggdGhlIHNpZ25hdHVyZSB0byBmdXJ0aGVyIGF1dGhlbnRpY2F0ZSB0aGUgcHJvb2YgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB0cmFuc2FjdGlvbiBzaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIGdldFNwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBQcm92ZSBhIHNwZW5kIHVzaW5nIGEgc2lnbmF0dXJlLiBVbmxpa2UgcHJvdmluZyBhIHRyYW5zYWN0aW9uLCBpdCBkb2VzIG5vdCByZXF1aXJlIHRoZSBkZXN0aW5hdGlvbiBwdWJsaWMgYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSB0cmFuc2FjdGlvbiB0byBwcm92ZVxuICAgKiBAcGFyYW0ge3N0cmluZyB8IHVuZGVmaW5lZH0gbWVzc2FnZSAtIG1lc3NhZ2UgaW5jbHVkZWQgd2l0aCB0aGUgc2lnbmF0dXJlIHRvIGZ1cnRoZXIgYXV0aGVudGljYXRlIHRoZSBwcm9vZiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzaWduYXR1cmUgLSB0cmFuc2FjdGlvbiBzaWduYXR1cmUgdG8gY29uZmlybVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSBzaWduYXR1cmUgaXMgZ29vZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBjaGVja1NwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2VuZXJhdGUgYSBzaWduYXR1cmUgdG8gcHJvdmUgdGhlIGVudGlyZSBiYWxhbmNlIG9mIHRoZSB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW21lc3NhZ2VdIC0gbWVzc2FnZSBpbmNsdWRlZCB3aXRoIHRoZSBzaWduYXR1cmUgdG8gZnVydGhlciBhdXRoZW50aWNhdGUgdGhlIHByb29mIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgcmVzZXJ2ZSBwcm9vZiBzaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2VuZXJhdGUgYSBzaWduYXR1cmUgdG8gcHJvdmUgYW4gYXZhaWxhYmxlIGFtb3VudCBpbiBhbiBhY2NvdW50LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFjY291bnRJZHggLSBhY2NvdW50IHRvIHByb3ZlIG93bmVyc2hpcCBvZiB0aGUgYW1vdW50XG4gICAqIEBwYXJhbSB7YmlnaW50fSBhbW91bnQgLSBtaW5pbXVtIGFtb3VudCB0byBwcm92ZSBhcyBhdmFpbGFibGUgaW4gdGhlIGFjY291bnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFttZXNzYWdlXSAtIG1lc3NhZ2UgdG8gaW5jbHVkZSB3aXRoIHRoZSBzaWduYXR1cmUgdG8gZnVydGhlciBhdXRoZW50aWNhdGUgdGhlIHByb29mIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgcmVzZXJ2ZSBwcm9vZiBzaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBhbW91bnQ6IGJpZ2ludCwgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm92ZXMgYSB3YWxsZXQgaGFzIGEgZGlzcG9zYWJsZSByZXNlcnZlIHVzaW5nIGEgc2lnbmF0dXJlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBwdWJsaWMgd2FsbGV0IGFkZHJlc3NcbiAgICogQHBhcmFtIHtzdHJpbmcgfCB1bmRlZmluZWR9IG1lc3NhZ2UgLSBtZXNzYWdlIGluY2x1ZGVkIHdpdGggdGhlIHNpZ25hdHVyZSB0byBmdXJ0aGVyIGF1dGhlbnRpY2F0ZSB0aGUgcHJvb2YgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2lnbmF0dXJlIC0gcmVzZXJ2ZSBwcm9vZiBzaWduYXR1cmUgdG8gY2hlY2tcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9DaGVja1Jlc2VydmU+fSB0aGUgcmVzdWx0IG9mIGNoZWNraW5nIHRoZSBzaWduYXR1cmUgcHJvb2ZcbiAgICovXG4gIGFzeW5jIGNoZWNrUmVzZXJ2ZVByb29mKGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tSZXNlcnZlPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIHRyYW5zYWN0aW9uIG5vdGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gdHJhbnNhY3Rpb24gdG8gZ2V0IHRoZSBub3RlIG9mXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHR4IG5vdGVcbiAgICovXG4gIGFzeW5jIGdldFR4Tm90ZSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldFR4Tm90ZXMoW3R4SGFzaF0pKVswXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBub3RlcyBmb3IgbXVsdGlwbGUgdHJhbnNhY3Rpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gdHhIYXNoZXMgLSBoYXNoZXMgb2YgdGhlIHRyYW5zYWN0aW9ucyB0byBnZXQgbm90ZXMgZm9yXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nW10+fSBub3RlcyBmb3IgdGhlIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgZ2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCBhIG5vdGUgZm9yIGEgc3BlY2lmaWMgdHJhbnNhY3Rpb24uXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gaGFzaCBvZiB0aGUgdHJhbnNhY3Rpb24gdG8gc2V0IGEgbm90ZSBmb3JcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5vdGUgLSB0aGUgdHJhbnNhY3Rpb24gbm90ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nLCBub3RlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnNldFR4Tm90ZXMoW3R4SGFzaF0sIFtub3RlXSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgbm90ZXMgZm9yIG11bHRpcGxlIHRyYW5zYWN0aW9ucy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IHR4SGFzaGVzIC0gdHJhbnNhY3Rpb25zIHRvIHNldCBub3RlcyBmb3JcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gbm90ZXMgLSBub3RlcyB0byBzZXQgZm9yIHRoZSB0cmFuc2FjdGlvbnNcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdLCBub3Rlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGFkZHJlc3MgYm9vayBlbnRyaWVzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJbXX0gW2VudHJ5SW5kaWNlc10gLSBpbmRpY2VzIG9mIHRoZSBlbnRyaWVzIHRvIGdldFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0FkZHJlc3NCb29rRW50cnlbXT59IHRoZSBhZGRyZXNzIGJvb2sgZW50cmllc1xuICAgKi9cbiAgYXN5bmMgZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcz86IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9BZGRyZXNzQm9va0VudHJ5W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQWRkIGFuIGFkZHJlc3MgYm9vayBlbnRyeS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gZW50cnkgYWRkcmVzc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gW2Rlc2NyaXB0aW9uXSAtIGVudHJ5IGRlc2NyaXB0aW9uIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB0aGUgaW5kZXggb2YgdGhlIGFkZGVkIGVudHJ5XG4gICAqL1xuICBhc3luYyBhZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3M6IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBFZGl0IGFuIGFkZHJlc3MgYm9vayBlbnRyeS5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCAtIGluZGV4IG9mIHRoZSBhZGRyZXNzIGJvb2sgZW50cnkgdG8gZWRpdFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNldEFkZHJlc3MgLSBzcGVjaWZpZXMgaWYgdGhlIGFkZHJlc3Mgc2hvdWxkIGJlIHVwZGF0ZWRcbiAgICogQHBhcmFtIHtzdHJpbmcgfCB1bmRlZmluZWR9IGFkZHJlc3MgLSB1cGRhdGVkIGFkZHJlc3NcbiAgICogQHBhcmFtIHtib29sZWFufSBzZXREZXNjcmlwdGlvbiAtIHNwZWNpZmllcyBpZiB0aGUgZGVzY3JpcHRpb24gc2hvdWxkIGJlIHVwZGF0ZWRcbiAgICogQHBhcmFtIHtzdHJpbmcgfCB1bmRlZmluZWR9IGRlc2NyaXB0aW9uIC0gdXBkYXRlZCBkZXNjcmlwdGlvblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgZWRpdEFkZHJlc3NCb29rRW50cnkoaW5kZXg6IG51bWJlciwgc2V0QWRkcmVzczogYm9vbGVhbiwgYWRkcmVzczogc3RyaW5nIHwgdW5kZWZpbmVkLCBzZXREZXNjcmlwdGlvbjogYm9vbGVhbiwgZGVzY3JpcHRpb246IHN0cmluZyB8IHVuZGVmaW5lZCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gYWRkcmVzcyBib29rIGVudHJ5LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGVudHJ5SWR4IC0gaW5kZXggb2YgdGhlIGVudHJ5IHRvIGRlbGV0ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFRhZyBhY2NvdW50cy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgLSB0YWcgdG8gYXBwbHkgdG8gdGhlIHNwZWNpZmllZCBhY2NvdW50c1xuICAgKiBAcGFyYW0ge251bWJlcltdfSBhY2NvdW50SW5kaWNlcyAtIGluZGljZXMgb2YgdGhlIGFjY291bnRzIHRvIHRhZ1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgdGFnQWNjb3VudHModGFnOiBzdHJpbmcsIGFjY291bnRJbmRpY2VzOiBudW1iZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogVW50YWcgYWNjb3VudHMuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcltdfSBhY2NvdW50SW5kaWNlcyAtIGluZGljZXMgb2YgdGhlIGFjY291bnRzIHRvIHVudGFnXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyB1bnRhZ0FjY291bnRzKGFjY291bnRJbmRpY2VzOiBudW1iZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZXR1cm4gYWxsIGFjY291bnQgdGFncy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQWNjb3VudFRhZ1tdPn0gdGhlIHdhbGxldCdzIGFjY291bnQgdGFnc1xuICAgKi9cbiAgYXN5bmMgZ2V0QWNjb3VudFRhZ3MoKTogUHJvbWlzZTxNb25lcm9BY2NvdW50VGFnW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBodW1hbi1yZWFkYWJsZSBkZXNjcmlwdGlvbiBmb3IgYSB0YWcuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIC0gdGFnIHRvIHNldCBhIGRlc2NyaXB0aW9uIGZvclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbGFiZWwgLSBsYWJlbCB0byBzZXQgZm9yIHRoZSB0YWdcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldEFjY291bnRUYWdMYWJlbCh0YWc6IHN0cmluZywgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcGF5bWVudCBVUkkgZnJvbSBhIHNlbmQgY29uZmlndXJhdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhDb25maWd9IGNvbmZpZyAtIHNwZWNpZmllcyBjb25maWd1cmF0aW9uIGZvciBhIHBvdGVudGlhbCB0eFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSBwYXltZW50IHVyaVxuICAgKi9cbiAgYXN5bmMgZ2V0UGF5bWVudFVyaShjb25maWc6IE1vbmVyb1R4Q29uZmlnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogUGFyc2VzIGEgcGF5bWVudCBVUkkgdG8gYSB0eCBjb25maWcuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXJpIC0gcGF5bWVudCB1cmkgdG8gcGFyc2VcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeENvbmZpZz59IHRoZSBzZW5kIGNvbmZpZ3VyYXRpb24gcGFyc2VkIGZyb20gdGhlIHVyaVxuICAgKi9cbiAgYXN5bmMgcGFyc2VQYXltZW50VXJpKHVyaTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeENvbmZpZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYW4gYXR0cmlidXRlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSAtIGF0dHJpYnV0ZSB0byBnZXQgdGhlIHZhbHVlIG9mXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIGF0dHJpYnV0ZSdzIHZhbHVlXG4gICAqL1xuICBhc3luYyBnZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgYW4gYXJiaXRyYXJ5IGF0dHJpYnV0ZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSBhdHRyaWJ1dGUga2V5XG4gICAqIEBwYXJhbSB7c3RyaW5nfSB2YWwgLSBhdHRyaWJ1dGUgdmFsdWVcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldEF0dHJpYnV0ZShrZXk6IHN0cmluZywgdmFsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3RhcnQgbWluaW5nLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtudW1UaHJlYWRzXSAtIG51bWJlciBvZiB0aHJlYWRzIGNyZWF0ZWQgZm9yIG1pbmluZyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2JhY2tncm91bmRNaW5pbmddIC0gc3BlY2lmaWVzIGlmIG1pbmluZyBzaG91bGQgb2NjdXIgaW4gdGhlIGJhY2tncm91bmQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpZ25vcmVCYXR0ZXJ5XSAtIHNwZWNpZmllcyBpZiB0aGUgYmF0dGVyeSBzaG91bGQgYmUgaWdub3JlZCBmb3IgbWluaW5nIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN0YXJ0TWluaW5nKG51bVRocmVhZHM6IG51bWJlciwgYmFja2dyb3VuZE1pbmluZz86IGJvb2xlYW4sIGlnbm9yZUJhdHRlcnk/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0b3AgbWluaW5nLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN0b3BNaW5pbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiBpbXBvcnRpbmcgbXVsdGlzaWcgZGF0YSBpcyBuZWVkZWQgZm9yIHJldHVybmluZyBhIGNvcnJlY3QgYmFsYW5jZS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgaW1wb3J0aW5nIG11bHRpc2lnIGRhdGEgaXMgbmVlZGVkIGZvciByZXR1cm5pbmcgYSBjb3JyZWN0IGJhbGFuY2UsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoaXMgd2FsbGV0IGlzIGEgbXVsdGlzaWcgd2FsbGV0LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGlzIGlzIGEgbXVsdGlzaWcgd2FsbGV0LCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzTXVsdGlzaWcoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldE11bHRpc2lnSW5mbygpKS5nZXRJc011bHRpc2lnKCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgbXVsdGlzaWcgaW5mbyBhYm91dCB0aGlzIHdhbGxldC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvTXVsdGlzaWdJbmZvPn0gbXVsdGlzaWcgaW5mbyBhYm91dCB0aGlzIHdhbGxldFxuICAgKi9cbiAgYXN5bmMgZ2V0TXVsdGlzaWdJbmZvKCk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbmZvPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBtdWx0aXNpZyBpbmZvIGFzIGhleCB0byBzaGFyZSB3aXRoIHBhcnRpY2lwYW50cyB0byBiZWdpbiBjcmVhdGluZyBhXG4gICAqIG11bHRpc2lnIHdhbGxldC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhpcyB3YWxsZXQncyBtdWx0aXNpZyBoZXggdG8gc2hhcmUgd2l0aCBwYXJ0aWNpcGFudHNcbiAgICovXG4gIGFzeW5jIHByZXBhcmVNdWx0aXNpZygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBNYWtlIHRoaXMgd2FsbGV0IG11bHRpc2lnIGJ5IGltcG9ydGluZyBtdWx0aXNpZyBoZXggZnJvbSBwYXJ0aWNpcGFudHMuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBtdWx0aXNpZ0hleGVzIC0gbXVsdGlzaWcgaGV4IGZyb20gZWFjaCBwYXJ0aWNpcGFudFxuICAgKiBAcGFyYW0ge251bWJlcn0gdGhyZXNob2xkIC0gbnVtYmVyIG9mIHNpZ25hdHVyZXMgbmVlZGVkIHRvIHNpZ24gdHJhbnNmZXJzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZCAtIHdhbGxldCBwYXNzd29yZFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoaXMgd2FsbGV0J3MgbXVsdGlzaWcgaGV4IHRvIHNoYXJlIHdpdGggcGFydGljaXBhbnRzXG4gICAqL1xuICBhc3luYyBtYWtlTXVsdGlzaWcobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHRocmVzaG9sZDogbnVtYmVyLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRXhjaGFuZ2UgbXVsdGlzaWcgaGV4IHdpdGggcGFydGljaXBhbnRzIGluIGEgTS9OIG11bHRpc2lnIHdhbGxldC5cbiAgICogXG4gICAqIFRoaXMgcHJvY2VzcyBtdXN0IGJlIHJlcGVhdGVkIHdpdGggcGFydGljaXBhbnRzIGV4YWN0bHkgTi1NIHRpbWVzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gbXVsdGlzaWdIZXhlcyBhcmUgbXVsdGlzaWcgaGV4IGZyb20gZWFjaCBwYXJ0aWNpcGFudFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGFzc3dvcmQgLSB3YWxsZXQncyBwYXNzd29yZCAvLyBUT0RPIG1vbmVyby1wcm9qZWN0OiByZWR1bmRhbnQ/IHdhbGxldCBpcyBjcmVhdGVkIHdpdGggcGFzc3dvcmRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+fSB0aGUgcmVzdWx0IHdoaWNoIGhhcyB0aGUgbXVsdGlzaWcncyBhZGRyZXNzIHhvciB0aGlzIHdhbGxldCdzIG11bHRpc2lnIGhleCB0byBzaGFyZSB3aXRoIHBhcnRpY2lwYW50cyBpZmYgbm90IGRvbmVcbiAgICovXG4gIGFzeW5jIGV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRXhwb3J0IHRoaXMgd2FsbGV0J3MgbXVsdGlzaWcgaW5mbyBhcyBoZXggZm9yIG90aGVyIHBhcnRpY2lwYW50cy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhpcyB3YWxsZXQncyBtdWx0aXNpZyBpbmZvIGFzIGhleCBmb3Igb3RoZXIgcGFydGljaXBhbnRzXG4gICAqL1xuICBhc3luYyBleHBvcnRNdWx0aXNpZ0hleCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbXBvcnQgbXVsdGlzaWcgaW5mbyBhcyBoZXggZnJvbSBvdGhlciBwYXJ0aWNpcGFudHMuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBtdWx0aXNpZ0hleGVzIC0gbXVsdGlzaWcgaGV4IGZyb20gZWFjaCBwYXJ0aWNpcGFudFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtyZWZyZXNoQWZ0ZXJJbXBvcnRdIC0gc3BlY2lmaWVzIGlmIHRoZSB3YWxsZXQgc2hvdWxkIGJlIHJlZnJlc2hlZCBhZnRlciBpbXBvcnRpbmcgbXVsdGlzaWcgaGV4IChkZWZhdWx0IHRydWUpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIG51bWJlciBvZiBvdXRwdXRzIHNpZ25lZCB3aXRoIHRoZSBnaXZlbiBtdWx0aXNpZyBoZXhcbiAgICovXG4gIGFzeW5jIGltcG9ydE11bHRpc2lnSGV4KG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCByZWZyZXNoQWZ0ZXJJbXBvcnQ/OiBib29sZWFuKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2lnbiBtdWx0aXNpZyB0cmFuc2FjdGlvbnMgZnJvbSBhIG11bHRpc2lnIHdhbGxldC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBtdWx0aXNpZ1R4SGV4IC0gdW5zaWduZWQgbXVsdGlzaWcgdHJhbnNhY3Rpb25zIGFzIGhleFxuICAgKiBAcmV0dXJuIHtNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHR9IHRoZSByZXN1bHQgb2Ygc2lnbmluZyB0aGUgbXVsdGlzaWcgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBzaWduTXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnU2lnblJlc3VsdD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdWJtaXQgc2lnbmVkIG11bHRpc2lnIHRyYW5zYWN0aW9ucyBmcm9tIGEgbXVsdGlzaWcgd2FsbGV0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNpZ25lZE11bHRpc2lnVHhIZXggLSBzaWduZWQgbXVsdGlzaWcgaGV4IHJldHVybmVkIGZyb20gc2lnbk11bHRpc2lnVHhIZXgoKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZ1tdPn0gdGhlIHJlc3VsdGluZyB0cmFuc2FjdGlvbiBoYXNoZXNcbiAgICovXG4gIGFzeW5jIHN1Ym1pdE11bHRpc2lnVHhIZXgoc2lnbmVkTXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDaGFuZ2UgdGhlIHdhbGxldCBwYXNzd29yZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBvbGRQYXNzd29yZCAtIHRoZSB3YWxsZXQncyBvbGQgcGFzc3dvcmRcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5ld1Bhc3N3b3JkIC0gdGhlIHdhbGxldCdzIG5ldyBwYXNzd29yZFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgY2hhbmdlUGFzc3dvcmQob2xkUGFzc3dvcmQ6IHN0cmluZywgbmV3UGFzc3dvcmQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTYXZlIHRoZSB3YWxsZXQgYXQgaXRzIGN1cnJlbnQgcGF0aC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzYXZlKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBPcHRpb25hbGx5IHNhdmUgdGhlbiBjbG9zZSB0aGUgd2FsbGV0LlxuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtzYXZlXSAtIHNwZWNpZmllcyBpZiB0aGUgd2FsbGV0IHNob3VsZCBiZSBzYXZlZCBiZWZvcmUgYmVpbmcgY2xvc2VkIChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgY2xvc2Uoc2F2ZSA9IGZhbHNlKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29ubmVjdGlvbk1hbmFnZXIpIHRoaXMuY29ubmVjdGlvbk1hbmFnZXIucmVtb3ZlTGlzdGVuZXIodGhpcy5jb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyKTtcbiAgICB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyID0gdW5kZWZpbmVkO1xuICAgIHRoaXMuY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmxpc3RlbmVycy5zcGxpY2UoMCwgdGhpcy5saXN0ZW5lcnMubGVuZ3RoKTtcbiAgICB0aGlzLl9pc0Nsb3NlZCA9IHRydWU7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhpcyB3YWxsZXQgaXMgY2xvc2VkIG9yIG5vdC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIHdhbGxldCBpcyBjbG9zZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNDbG9zZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIHRoaXMuX2lzQ2xvc2VkO1xuICB9XG4gIFxuICAvLyAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSBQUklWQVRFIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgYXN5bmMgYW5ub3VuY2VTeW5jUHJvZ3Jlc3MoaGVpZ2h0OiBudW1iZXIsIHN0YXJ0SGVpZ2h0OiBudW1iZXIsIGVuZEhlaWdodDogbnVtYmVyLCBwZXJjZW50RG9uZTogbnVtYmVyLCBtZXNzYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBnZW5lcmF0aW9uID0gdGhpcy5saXN0ZW5lckdlbmVyYXRpb247XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMuc2xpY2UoKSkge1xuICAgICAgaWYgKHRoaXMuX2lzQ2xvc2VkIHx8IGdlbmVyYXRpb24gIT09IHRoaXMubGlzdGVuZXJHZW5lcmF0aW9uKSByZXR1cm47XG4gICAgICBpZiAoIXRoaXMubGlzdGVuZXJzLmluY2x1ZGVzKGxpc3RlbmVyKSkgY29udGludWU7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBsaXN0ZW5lci5vblN5bmNQcm9ncmVzcyhoZWlnaHQsIHN0YXJ0SGVpZ2h0LCBlbmRIZWlnaHQsIHBlcmNlbnREb25lLCBtZXNzYWdlKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgY2FsbGluZyBsaXN0ZW5lciBvbiBzeW5jIHByb2dyZXNzXCIsIGVycik7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBhc3luYyBhbm5vdW5jZU5ld0Jsb2NrKGhlaWdodDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgY29uc3QgZ2VuZXJhdGlvbiA9IHRoaXMubGlzdGVuZXJHZW5lcmF0aW9uO1xuICAgIGZvciAobGV0IGxpc3RlbmVyIG9mIHRoaXMubGlzdGVuZXJzLnNsaWNlKCkpIHtcbiAgICAgIGlmICh0aGlzLl9pc0Nsb3NlZCB8fCBnZW5lcmF0aW9uICE9PSB0aGlzLmxpc3RlbmVyR2VuZXJhdGlvbikgcmV0dXJuO1xuICAgICAgaWYgKCF0aGlzLmxpc3RlbmVycy5pbmNsdWRlcyhsaXN0ZW5lcikpIGNvbnRpbnVlO1xuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgbGlzdGVuZXIub25OZXdCbG9jayhoZWlnaHQpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJFcnJvciBjYWxsaW5nIGxpc3RlbmVyIG9uIG5ldyBibG9ja1wiLCBlcnIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgYXN5bmMgYW5ub3VuY2VCYWxhbmNlc0NoYW5nZWQobmV3QmFsYW5jZTogYmlnaW50LCBuZXdVbmxvY2tlZEJhbGFuY2U6IGJpZ2ludCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGdlbmVyYXRpb24gPSB0aGlzLmxpc3RlbmVyR2VuZXJhdGlvbjtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycy5zbGljZSgpKSB7XG4gICAgICBpZiAodGhpcy5faXNDbG9zZWQgfHwgZ2VuZXJhdGlvbiAhPT0gdGhpcy5saXN0ZW5lckdlbmVyYXRpb24pIHJldHVybjtcbiAgICAgIGlmICghdGhpcy5saXN0ZW5lcnMuaW5jbHVkZXMobGlzdGVuZXIpKSBjb250aW51ZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGxpc3RlbmVyLm9uQmFsYW5jZXNDaGFuZ2VkKG5ld0JhbGFuY2UsIG5ld1VubG9ja2VkQmFsYW5jZSk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNhbGxpbmcgbGlzdGVuZXIgb24gYmFsYW5jZXMgY2hhbmdlZFwiLCBlcnIpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBAcHJpdmF0ZVxuICAgKi9cbiAgYXN5bmMgYW5ub3VuY2VPdXRwdXRSZWNlaXZlZChvdXRwdXQ6IE1vbmVyb091dHB1dFdhbGxldCk6IFByb21pc2U8dm9pZD4ge1xuICAgIGNvbnN0IGdlbmVyYXRpb24gPSB0aGlzLmxpc3RlbmVyR2VuZXJhdGlvbjtcbiAgICBmb3IgKGxldCBsaXN0ZW5lciBvZiB0aGlzLmxpc3RlbmVycy5zbGljZSgpKSB7XG4gICAgICBpZiAodGhpcy5faXNDbG9zZWQgfHwgZ2VuZXJhdGlvbiAhPT0gdGhpcy5saXN0ZW5lckdlbmVyYXRpb24pIHJldHVybjtcbiAgICAgIGlmICghdGhpcy5saXN0ZW5lcnMuaW5jbHVkZXMobGlzdGVuZXIpKSBjb250aW51ZTtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IGxpc3RlbmVyLm9uT3V0cHV0UmVjZWl2ZWQob3V0cHV0KTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiRXJyb3IgY2FsbGluZyBsaXN0ZW5lciBvbiBvdXRwdXQgcmVjZWl2ZWRcIiwgZXJyKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogQHByaXZhdGVcbiAgICovXG4gIGFzeW5jIGFubm91bmNlT3V0cHV0U3BlbnQob3V0cHV0OiBNb25lcm9PdXRwdXRXYWxsZXQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBjb25zdCBnZW5lcmF0aW9uID0gdGhpcy5saXN0ZW5lckdlbmVyYXRpb247XG4gICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMuc2xpY2UoKSkge1xuICAgICAgaWYgKHRoaXMuX2lzQ2xvc2VkIHx8IGdlbmVyYXRpb24gIT09IHRoaXMubGlzdGVuZXJHZW5lcmF0aW9uKSByZXR1cm47XG4gICAgICBpZiAoIXRoaXMubGlzdGVuZXJzLmluY2x1ZGVzKGxpc3RlbmVyKSkgY29udGludWU7XG4gICAgICB0cnkge1xuICAgICAgICBhd2FpdCBsaXN0ZW5lci5vbk91dHB1dFNwZW50KG91dHB1dCk7XG4gICAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIkVycm9yIGNhbGxpbmcgbGlzdGVuZXIgb24gb3V0cHV0IHNwZW50XCIsIGVycik7XG4gICAgICB9XG4gICAgfVxuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZVR4UXVlcnkocXVlcnkpOiBNb25lcm9UeFF1ZXJ5IHtcbiAgICBpZiAocXVlcnkgaW5zdGFuY2VvZiBNb25lcm9UeFF1ZXJ5KSBxdWVyeSA9IHF1ZXJ5LmNvcHkoKTtcbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KHF1ZXJ5KSkgcXVlcnkgPSBuZXcgTW9uZXJvVHhRdWVyeSgpLnNldEhhc2hlcyhxdWVyeSk7XG4gICAgZWxzZSB7XG4gICAgICBxdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5KTtcbiAgICAgIHF1ZXJ5ID0gbmV3IE1vbmVyb1R4UXVlcnkocXVlcnkpO1xuICAgIH1cbiAgICBpZiAocXVlcnkuZ2V0QmxvY2soKSA9PT0gdW5kZWZpbmVkKSBxdWVyeS5zZXRCbG9jayhuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW3F1ZXJ5XSkpO1xuICAgIGlmIChxdWVyeS5nZXRJbnB1dFF1ZXJ5KCkpIHF1ZXJ5LmdldElucHV0UXVlcnkoKS5zZXRUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnkuZ2V0T3V0cHV0UXVlcnkoKSkgcXVlcnkuZ2V0T3V0cHV0UXVlcnkoKS5zZXRUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICByZXR1cm4gcXVlcnk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgbm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSk6IE1vbmVyb1RyYW5zZmVyUXVlcnkge1xuICAgIHF1ZXJ5ID0gbmV3IE1vbmVyb1RyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHR4UXVlcnkgPSBxdWVyeS5nZXRUeFF1ZXJ5KCkuY29weSgpO1xuICAgICAgcXVlcnkgPSB0eFF1ZXJ5LmdldFRyYW5zZmVyUXVlcnkoKTtcbiAgICB9XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKSA9PT0gdW5kZWZpbmVkKSBxdWVyeS5zZXRUeFF1ZXJ5KG5ldyBNb25lcm9UeFF1ZXJ5KCkpO1xuICAgIHF1ZXJ5LmdldFR4UXVlcnkoKS5zZXRUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkgPT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0VHhRdWVyeSgpLnNldEJsb2NrKG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbcXVlcnkuZ2V0VHhRdWVyeSgpXSkpO1xuICAgIHJldHVybiBxdWVyeTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVPdXRwdXRRdWVyeShxdWVyeSk6IE1vbmVyb091dHB1dFF1ZXJ5IHtcbiAgICBxdWVyeSA9IG5ldyBNb25lcm9PdXRwdXRRdWVyeShxdWVyeSk7XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgdHhRdWVyeSA9IHF1ZXJ5LmdldFR4UXVlcnkoKS5jb3B5KCk7XG4gICAgICBxdWVyeSA9IHR4UXVlcnkuZ2V0T3V0cHV0UXVlcnkoKTtcbiAgICB9XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKSA9PT0gdW5kZWZpbmVkKSBxdWVyeS5zZXRUeFF1ZXJ5KG5ldyBNb25lcm9UeFF1ZXJ5KCkpO1xuICAgIHF1ZXJ5LmdldFR4UXVlcnkoKS5zZXRPdXRwdXRRdWVyeShxdWVyeSk7XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKS5nZXRCbG9jaygpID09PSB1bmRlZmluZWQpIHF1ZXJ5LmdldFR4UXVlcnkoKS5zZXRCbG9jayhuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW3F1ZXJ5LmdldFR4UXVlcnkoKV0pKTtcbiAgICByZXR1cm4gcXVlcnk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgbm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk6IE1vbmVyb1R4Q29uZmlnIHtcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQgfHwgIShjb25maWcgaW5zdGFuY2VvZiBPYmplY3QpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgTW9uZXJvVHhDb25maWcgb3IgZXF1aXZhbGVudCBKUyBvYmplY3RcIik7XG4gICAgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gICAgYXNzZXJ0KGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKSAmJiBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoID4gMCwgXCJNdXN0IHByb3ZpZGUgZGVzdGluYXRpb25zXCIpO1xuICAgIGFzc2VydC5lcXVhbChjb25maWcuZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcygpLCB1bmRlZmluZWQpO1xuICAgIGFzc2VydC5lcXVhbChjb25maWcuZ2V0QmVsb3dBbW91bnQoKSwgdW5kZWZpbmVkKTtcbiAgICByZXR1cm4gY29uZmlnO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnKGNvbmZpZyk6IE1vbmVyb1R4Q29uZmlnIHtcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQgfHwgIShjb25maWcgaW5zdGFuY2VvZiBPYmplY3QpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgTW9uZXJvVHhDb25maWcgb3IgZXF1aXZhbGVudCBKUyBvYmplY3RcIik7XG4gICAgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbmZpZy5nZXRTd2VlcEVhY2hTdWJhZGRyZXNzKCksIHVuZGVmaW5lZCk7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbmZpZy5nZXRCZWxvd0Ftb3VudCgpLCB1bmRlZmluZWQpO1xuICAgIGFzc2VydC5lcXVhbChjb25maWcuZ2V0Q2FuU3BsaXQoKSwgdW5kZWZpbmVkLCBcIkNhbm5vdCBzcGxpdCB0cmFuc2FjdGlvbnMgd2hlbiBzd2VlcGluZyBhbiBvdXRwdXRcIik7XG4gICAgaWYgKCFjb25maWcuZ2V0RGVzdGluYXRpb25zKCkgfHwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCAhPT0gMSB8fCAhY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGV4YWN0bHkgb25lIGRlc3RpbmF0aW9uIGFkZHJlc3MgdG8gc3dlZXAgb3V0cHV0IHRvXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkgJiYgY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpLmxlbmd0aCA+IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN3ZWVwIHRyYW5zYWN0aW9ucyBkbyBub3Qgc3VwcG9ydCBzdWJ0cmFjdGluZyBmZWVzIGZyb20gZGVzdGluYXRpb25zXCIpO1xuICAgIHJldHVybiBjb25maWc7ICBcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnKGNvbmZpZyk6IE1vbmVyb1R4Q29uZmlnIHtcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQgfHwgIShjb25maWcgaW5zdGFuY2VvZiBPYmplY3QpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgTW9uZXJvVHhDb25maWcgb3IgZXF1aXZhbGVudCBKUyBvYmplY3RcIik7XG4gICAgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKSA9PT0gdW5kZWZpbmVkIHx8IGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKS5sZW5ndGggIT0gMSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGV4YWN0bHkgb25lIGRlc3RpbmF0aW9uIHRvIHN3ZWVwIHRvXCIpO1xuICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpID09PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBkZXN0aW5hdGlvbiBhZGRyZXNzIHRvIHN3ZWVwIHRvXCIpO1xuICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QW1vdW50KCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiQ2Fubm90IHByb3ZpZGUgYW1vdW50IGluIHN3ZWVwIGNvbmZpZ1wiKTtcbiAgICBpZiAoY29uZmlnLmdldEtleUltYWdlKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiS2V5IGltYWdlIGRlZmluZWQ7IHVzZSBzd2VlcE91dHB1dCgpIHRvIHN3ZWVwIGFuIG91dHB1dCBieSBpdHMga2V5IGltYWdlXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkICYmIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpLmxlbmd0aCA9PT0gMCkgY29uZmlnLnNldFN1YmFkZHJlc3NJbmRpY2VzKHVuZGVmaW5lZCk7XG4gICAgaWYgKGNvbmZpZy5nZXRBY2NvdW50SW5kZXgoKSA9PT0gdW5kZWZpbmVkICYmIGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBhY2NvdW50IGluZGV4IGlmIHN1YmFkZHJlc3MgaW5kaWNlcyBhcmUgcHJvdmlkZWRcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJ0cmFjdEZlZUZyb20oKSAmJiBjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkubGVuZ3RoID4gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3dlZXAgdHJhbnNhY3Rpb25zIGRvIG5vdCBzdXBwb3J0IHN1YnRyYWN0aW5nIGZlZXMgZnJvbSBkZXN0aW5hdGlvbnNcIik7XG4gICAgcmV0dXJuIGNvbmZpZztcbiAgfVxufVxuIl0sIm1hcHBpbmdzIjoieUxBQUEsSUFBQUEsT0FBQSxHQUFBQyxzQkFBQSxDQUFBQyxPQUFBOzs7OztBQUtBLElBQUFDLFlBQUEsR0FBQUYsc0JBQUEsQ0FBQUMsT0FBQTs7OztBQUlBLElBQUFFLGdDQUFBLEdBQUFILHNCQUFBLENBQUFDLE9BQUE7QUFDQSxJQUFB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