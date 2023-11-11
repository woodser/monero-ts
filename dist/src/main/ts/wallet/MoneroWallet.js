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
    throw new Error("Not supported");
  }

  /**
   * Unregister a listener to receive wallet notifications.
   * 
   * @param {MoneroWalletListener} listener - listener to unregister
   * @return {Promise<void>}
   */
  async removeListener(listener) {
    throw new Error("Not supported");
  }

  /**
   * Get the listeners registered with the wallet.
   * 
   * @return {MoneroWalletListener[]} the registered listeners
   */
  getListeners() {
    throw new Error("Not supported");
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
  }

  /**
   * Indicates if this wallet is closed or not.
   * 
   * @return {Promise<boolean>} true if the wallet is closed, false otherwise
   */
  async isClosed() {
    throw new _MoneroError.default("Not supported");
  }

  // -------------------------------- PRIVATE ---------------------------------

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIl9Nb25lcm9PdXRwdXRRdWVyeSIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJNb25lcm9XYWxsZXQiLCJERUZBVUxUX0xBTkdVQUdFIiwiY29uc3RydWN0b3IiLCJhZGRMaXN0ZW5lciIsImxpc3RlbmVyIiwiRXJyb3IiLCJyZW1vdmVMaXN0ZW5lciIsImdldExpc3RlbmVycyIsImlzVmlld09ubHkiLCJNb25lcm9FcnJvciIsInNldERhZW1vbkNvbm5lY3Rpb24iLCJ1cmlPckNvbm5lY3Rpb24iLCJnZXREYWVtb25Db25uZWN0aW9uIiwic2V0Q29ubmVjdGlvbk1hbmFnZXIiLCJjb25uZWN0aW9uTWFuYWdlciIsImNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIiLCJ0aGF0IiwiTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciIsIm9uQ29ubmVjdGlvbkNoYW5nZWQiLCJjb25uZWN0aW9uIiwiZ2V0Q29ubmVjdGlvbiIsImdldENvbm5lY3Rpb25NYW5hZ2VyIiwiaXNDb25uZWN0ZWRUb0RhZW1vbiIsImdldFZlcnNpb24iLCJnZXRQYXRoIiwiZ2V0U2VlZCIsImdldFNlZWRMYW5ndWFnZSIsImdldFByaXZhdGVWaWV3S2V5IiwiZ2V0UHJpdmF0ZVNwZW5kS2V5IiwiZ2V0UHVibGljVmlld0tleSIsImdldFB1YmxpY1NwZW5kS2V5IiwiZ2V0UHJpbWFyeUFkZHJlc3MiLCJnZXRBZGRyZXNzIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJnZXRBZGRyZXNzSW5kZXgiLCJhZGRyZXNzIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyIsImludGVncmF0ZWRBZGRyZXNzIiwiZ2V0SGVpZ2h0IiwiZ2V0RGFlbW9uSGVpZ2h0IiwiZ2V0SGVpZ2h0QnlEYXRlIiwieWVhciIsIm1vbnRoIiwiZGF5Iiwic3luYyIsImxpc3RlbmVyT3JTdGFydEhlaWdodCIsInN0YXJ0SGVpZ2h0Iiwic3RhcnRTeW5jaW5nIiwic3luY1BlcmlvZEluTXMiLCJzdG9wU3luY2luZyIsInNjYW5UeHMiLCJ0eEhhc2hlcyIsInJlc2NhblNwZW50IiwicmVzY2FuQmxvY2tjaGFpbiIsImdldEJhbGFuY2UiLCJnZXRVbmxvY2tlZEJhbGFuY2UiLCJnZXROdW1CbG9ja3NUb1VubG9jayIsImJhbGFuY2UiLCJ1bmRlZmluZWQiLCJ1bmxvY2tlZEJhbGFuY2UiLCJ0eHMiLCJoZWlnaHQiLCJudW1CbG9ja3NUb05leHRVbmxvY2siLCJnZXRUeHMiLCJpc0xvY2tlZCIsInR4IiwibnVtQmxvY2tzVG9VbmxvY2siLCJNYXRoIiwibWF4IiwiZ2V0SXNDb25maXJtZWQiLCJnZXRVbmxvY2tUaW1lIiwibWluIiwibnVtQmxvY2tzVG9MYXN0VW5sb2NrIiwiZ2V0QWNjb3VudHMiLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwiZ2V0QWNjb3VudCIsImNyZWF0ZUFjY291bnQiLCJsYWJlbCIsInNldEFjY291bnRMYWJlbCIsInNldFN1YmFkZHJlc3NMYWJlbCIsImdldFN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NJbmRpY2VzIiwiZ2V0U3ViYWRkcmVzcyIsImFzc2VydCIsImNyZWF0ZVN1YmFkZHJlc3MiLCJnZXRUeCIsInR4SGFzaCIsImxlbmd0aCIsInF1ZXJ5IiwiZ2V0VHJhbnNmZXJzIiwiZ2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJxdWVyeU5vcm1hbGl6ZWQiLCJub3JtYWxpemVUcmFuc2ZlclF1ZXJ5IiwiZ2V0SXNJbmNvbWluZyIsInNldElzSW5jb21pbmciLCJnZXRPdXRnb2luZ1RyYW5zZmVycyIsImdldElzT3V0Z29pbmciLCJzZXRJc091dGdvaW5nIiwiZ2V0T3V0cHV0cyIsImV4cG9ydE91dHB1dHMiLCJhbGwiLCJpbXBvcnRPdXRwdXRzIiwib3V0cHV0c0hleCIsImV4cG9ydEtleUltYWdlcyIsImltcG9ydEtleUltYWdlcyIsImtleUltYWdlcyIsImdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0IiwiZnJlZXplT3V0cHV0Iiwia2V5SW1hZ2UiLCJ0aGF3T3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJjcmVhdGVUeCIsImNvbmZpZyIsImNvbmZpZ05vcm1hbGl6ZWQiLCJub3JtYWxpemVDcmVhdGVUeHNDb25maWciLCJnZXRDYW5TcGxpdCIsImVxdWFsIiwic2V0Q2FuU3BsaXQiLCJjcmVhdGVUeHMiLCJzd2VlcE91dHB1dCIsInN3ZWVwVW5sb2NrZWQiLCJzd2VlcER1c3QiLCJyZWxheSIsInJlbGF5VHgiLCJ0eE9yTWV0YWRhdGEiLCJyZWxheVR4cyIsInR4c09yTWV0YWRhdGFzIiwiZGVzY3JpYmVVbnNpZ25lZFR4U2V0IiwidW5zaWduZWRUeEhleCIsImRlc2NyaWJlVHhTZXQiLCJNb25lcm9UeFNldCIsInNldFVuc2lnbmVkVHhIZXgiLCJkZXNjcmliZU11bHRpc2lnVHhTZXQiLCJtdWx0aXNpZ1R4SGV4Iiwic2V0TXVsdGlzaWdUeEhleCIsInR4U2V0Iiwic2lnblR4cyIsInN1Ym1pdFR4cyIsInNpZ25lZFR4SGV4Iiwic2lnbk1lc3NhZ2UiLCJtZXNzYWdlIiwic2lnbmF0dXJlVHlwZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiU0lHTl9XSVRIX1NQRU5EX0tFWSIsInZlcmlmeU1lc3NhZ2UiLCJzaWduYXR1cmUiLCJnZXRUeEtleSIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImdldFR4UHJvb2YiLCJjaGVja1R4UHJvb2YiLCJnZXRTcGVuZFByb29mIiwiY2hlY2tTcGVuZFByb29mIiwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0IiwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCIsImFtb3VudCIsImNoZWNrUmVzZXJ2ZVByb29mIiwiZ2V0VHhOb3RlIiwiZ2V0VHhOb3RlcyIsInNldFR4Tm90ZSIsIm5vdGUiLCJzZXRUeE5vdGVzIiwibm90ZXMiLCJnZXRBZGRyZXNzQm9va0VudHJpZXMiLCJlbnRyeUluZGljZXMiLCJhZGRBZGRyZXNzQm9va0VudHJ5IiwiZGVzY3JpcHRpb24iLCJlZGl0QWRkcmVzc0Jvb2tFbnRyeSIsImluZGV4Iiwic2V0QWRkcmVzcyIsInNldERlc2NyaXB0aW9uIiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsImVudHJ5SWR4IiwidGFnQWNjb3VudHMiLCJhY2NvdW50SW5kaWNlcyIsInVudGFnQWNjb3VudHMiLCJnZXRBY2NvdW50VGFncyIsInNldEFjY291bnRUYWdMYWJlbCIsImdldFBheW1lbnRVcmkiLCJwYXJzZVBheW1lbnRVcmkiLCJ1cmkiLCJnZXRBdHRyaWJ1dGUiLCJrZXkiLCJzZXRBdHRyaWJ1dGUiLCJ2YWwiLCJzdGFydE1pbmluZyIsIm51bVRocmVhZHMiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaWdub3JlQmF0dGVyeSIsInN0b3BNaW5pbmciLCJpc011bHRpc2lnSW1wb3J0TmVlZGVkIiwiaXNNdWx0aXNpZyIsImdldE11bHRpc2lnSW5mbyIsImdldElzTXVsdGlzaWciLCJwcmVwYXJlTXVsdGlzaWciLCJtYWtlTXVsdGlzaWciLCJtdWx0aXNpZ0hleGVzIiwidGhyZXNob2xkIiwicGFzc3dvcmQiLCJleGNoYW5nZU11bHRpc2lnS2V5cyIsImV4cG9ydE11bHRpc2lnSGV4IiwiaW1wb3J0TXVsdGlzaWdIZXgiLCJzaWduTXVsdGlzaWdUeEhleCIsInN1Ym1pdE11bHRpc2lnVHhIZXgiLCJzaWduZWRNdWx0aXNpZ1R4SGV4IiwiY2hhbmdlUGFzc3dvcmQiLCJvbGRQYXNzd29yZCIsIm5ld1Bhc3N3b3JkIiwic2F2ZSIsImNsb3NlIiwiaXNDbG9zZWQiLCJub3JtYWxpemVUeFF1ZXJ5IiwiTW9uZXJvVHhRdWVyeSIsImNvcHkiLCJBcnJheSIsImlzQXJyYXkiLCJzZXRIYXNoZXMiLCJPYmplY3QiLCJhc3NpZ24iLCJnZXRCbG9jayIsInNldEJsb2NrIiwiTW9uZXJvQmxvY2siLCJzZXRUeHMiLCJnZXRJbnB1dFF1ZXJ5Iiwic2V0VHhRdWVyeSIsImdldE91dHB1dFF1ZXJ5IiwiTW9uZXJvVHJhbnNmZXJRdWVyeSIsImdldFR4UXVlcnkiLCJ0eFF1ZXJ5IiwiZ2V0VHJhbnNmZXJRdWVyeSIsInNldFRyYW5zZmVyUXVlcnkiLCJub3JtYWxpemVPdXRwdXRRdWVyeSIsIk1vbmVyb091dHB1dFF1ZXJ5Iiwic2V0T3V0cHV0UXVlcnkiLCJNb25lcm9UeENvbmZpZyIsImdldERlc3RpbmF0aW9ucyIsImdldFN3ZWVwRWFjaFN1YmFkZHJlc3MiLCJnZXRCZWxvd0Ftb3VudCIsIm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnIiwiZ2V0U3VidHJhY3RGZWVGcm9tIiwibm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyIsImdldEFtb3VudCIsImdldEtleUltYWdlIiwiZ2V0U3ViYWRkcmVzc0luZGljZXMiLCJzZXRTdWJhZGRyZXNzSW5kaWNlcyIsImdldEFjY291bnRJbmRleCIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvd2FsbGV0L01vbmVyb1dhbGxldC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi4vY29tbW9uL0dlblV0aWxzXCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50XCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudFRhZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50VGFnXCI7XG5pbXBvcnQgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BZGRyZXNzQm9va0VudHJ5XCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0NoZWNrUmVzZXJ2ZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1Jlc2VydmVcIjtcbmltcG9ydCBNb25lcm9DaGVja1R4IGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrVHhcIjtcbmltcG9ydCBNb25lcm9Db25uZWN0aW9uTWFuYWdlciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyXCI7XG5pbXBvcnQgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSW5jb21pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbmNvbWluZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZVwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luZm9cIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnU2lnblJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb091dGdvaW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0Z29pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvU3ViYWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TdWJhZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvU3luY1Jlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TeW5jUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlclF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyUXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeENvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeENvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb1R4UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvVHhTZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhTZXRcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldExpc3RlbmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1dhbGxldExpc3RlbmVyXCI7XG5cbi8qKlxuICogQ29weXJpZ2h0IChjKSB3b29kc2VyXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIE1vbmVybyB3YWxsZXQgaW50ZXJmYWNlIGFuZCBkZWZhdWx0IGltcGxlbWVudGF0aW9ucy5cbiAqIFxuICogQGludGVyZmFjZVxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9XYWxsZXQge1xuXG4gIC8vIHN0YXRpYyB2YXJpYWJsZXNcbiAgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfTEFOR1VBR0UgPSBcIkVuZ2xpc2hcIjtcblxuICAvLyBzdGF0ZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIGNvbm5lY3Rpb25NYW5hZ2VyOiBNb25lcm9Db25uZWN0aW9uTWFuYWdlcjtcbiAgcHJvdGVjdGVkIGNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXI6IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXI7XG5cbiAgLyoqXG4gICAqIEhpZGRlbiBjb25zdHJ1Y3Rvci5cbiAgICogXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvLyBubyBjb2RlIG5lZWRlZFxuICB9XG4gIFxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBsaXN0ZW5lciB0byByZWNlaXZlIHdhbGxldCBub3RpZmljYXRpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRMaXN0ZW5lcn0gbGlzdGVuZXIgLSBsaXN0ZW5lciB0byByZWNlaXZlIHdhbGxldCBub3RpZmljYXRpb25zXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvV2FsbGV0TGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogVW5yZWdpc3RlciBhIGxpc3RlbmVyIHRvIHJlY2VpdmUgd2FsbGV0IG5vdGlmaWNhdGlvbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1dhbGxldExpc3RlbmVyfSBsaXN0ZW5lciAtIGxpc3RlbmVyIHRvIHVucmVnaXN0ZXJcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgd2l0aCB0aGUgd2FsbGV0LlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvV2FsbGV0TGlzdGVuZXJbXX0gdGhlIHJlZ2lzdGVyZWQgbGlzdGVuZXJzXG4gICAqL1xuICBnZXRMaXN0ZW5lcnMoKTogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgd2FsbGV0IGlzIHZpZXctb25seSwgbWVhbmluZyBpdCBkb2VzIG5vdCBoYXZlIHRoZSBwcml2YXRlXG4gICAqIHNwZW5kIGtleSBhbmQgY2FuIHRoZXJlZm9yZSBvbmx5IG9ic2VydmUgaW5jb21pbmcgb3V0cHV0cy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIHdhbGxldCBpcyB2aWV3LW9ubHksIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNWaWV3T25seSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvUnBjQ29ubmVjdGlvbiB8IHN0cmluZ30gW3VyaU9yQ29ubmVjdGlvbl0gLSBkYWVtb24ncyBVUkkgb3IgY29ubmVjdGlvbiAoZGVmYXVsdHMgdG8gb2ZmbGluZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uPzogTW9uZXJvUnBjQ29ubmVjdGlvbiB8IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9ScGNDb25uZWN0aW9uPn0gdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uXG4gICAqL1xuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvbiBtYW5hZ2VyLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9Db25uZWN0aW9uTWFuYWdlcn0gY29ubmVjdGlvbk1hbmFnZXIgbWFuYWdlcyBjb25uZWN0aW9ucyB0byBtb25lcm9kXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRDb25uZWN0aW9uTWFuYWdlcihjb25uZWN0aW9uTWFuYWdlcj86IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29ubmVjdGlvbk1hbmFnZXIpIHRoaXMuY29ubmVjdGlvbk1hbmFnZXIucmVtb3ZlTGlzdGVuZXIodGhpcy5jb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyKTtcbiAgICB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyID0gY29ubmVjdGlvbk1hbmFnZXI7XG4gICAgaWYgKCFjb25uZWN0aW9uTWFuYWdlcikgcmV0dXJuO1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICBpZiAoIXRoaXMuY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcikgdGhpcy5jb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyID0gbmV3IGNsYXNzIGV4dGVuZHMgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciB7XG4gICAgICBhc3luYyBvbkNvbm5lY3Rpb25DaGFuZ2VkKGNvbm5lY3Rpb246IE1vbmVyb1JwY0Nvbm5lY3Rpb24gfCB1bmRlZmluZWQpIHtcbiAgICAgICAgYXdhaXQgdGhhdC5zZXREYWVtb25Db25uZWN0aW9uKGNvbm5lY3Rpb24pO1xuICAgICAgfVxuICAgIH07XG4gICAgY29ubmVjdGlvbk1hbmFnZXIuYWRkTGlzdGVuZXIodGhpcy5jb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyKTtcbiAgICBhd2FpdCB0aGlzLnNldERhZW1vbkNvbm5lY3Rpb24oY29ubmVjdGlvbk1hbmFnZXIuZ2V0Q29ubmVjdGlvbigpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uIG1hbmFnZXIuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyPn0gdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uIG1hbmFnZXJcbiAgICovXG4gIGFzeW5jIGdldENvbm5lY3Rpb25NYW5hZ2VyKCk6IFByb21pc2U8TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI+IHtcbiAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uTWFuYWdlcjtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgd2FsbGV0IGlzIGNvbm5lY3RlZCB0byBkYWVtb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSB3YWxsZXQgaXMgY29ubmVjdGVkIHRvIGEgZGFlbW9uLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldHMgdGhlIHZlcnNpb24gb2YgdGhlIHdhbGxldC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVmVyc2lvbj59IHRoZSB2ZXJzaW9uIG9mIHRoZSB3YWxsZXRcbiAgICovXG4gIGFzeW5jIGdldFZlcnNpb24oKTogUHJvbWlzZTxNb25lcm9WZXJzaW9uPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgcGF0aC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHBhdGggdGhlIHdhbGxldCBjYW4gYmUgb3BlbmVkIHdpdGhcbiAgICovXG4gIGFzeW5jIGdldFBhdGgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBtbmVtb25pYyBwaHJhc2Ugb3Igc2VlZC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHdhbGxldCdzIG1uZW1vbmljIHBocmFzZSBvciBzZWVkLlxuICAgKi9cbiAgYXN5bmMgZ2V0U2VlZCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGxhbmd1YWdlIG9mIHRoZSB3YWxsZXQncyBtbmVtb25pYyBwaHJhc2Ugb3Igc2VlZC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIGxhbmd1YWdlIG9mIHRoZSB3YWxsZXQncyBtbmVtb25pYyBwaHJhc2Ugb3Igc2VlZC5cbiAgICovXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIHByaXZhdGUgdmlldyBrZXkuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB3YWxsZXQncyBwcml2YXRlIHZpZXcga2V5XG4gICAqL1xuICBhc3luYyBnZXRQcml2YXRlVmlld0tleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIHByaXZhdGUgc3BlbmQga2V5LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgd2FsbGV0J3MgcHJpdmF0ZSBzcGVuZCBrZXlcbiAgICovXG4gIGFzeW5jIGdldFByaXZhdGVTcGVuZEtleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIHB1YmxpYyB2aWV3IGtleS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHdhbGxldCdzIHB1YmxpYyB2aWV3IGtleVxuICAgKi9cbiAgYXN5bmMgZ2V0UHVibGljVmlld0tleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIHB1YmxpYyBzcGVuZCBrZXkuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB3YWxsZXQncyBwdWJsaWMgc3BlbmQga2V5XG4gICAqL1xuICBhc3luYyBnZXRQdWJsaWNTcGVuZEtleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgcHJpbWFyeSBhZGRyZXNzLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgd2FsbGV0J3MgcHJpbWFyeSBhZGRyZXNzXG4gICAqL1xuICBhc3luYyBnZXRQcmltYXJ5QWRkcmVzcygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmdldEFkZHJlc3MoMCwgMCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGFkZHJlc3Mgb2YgYSBzcGVjaWZpYyBzdWJhZGRyZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFjY291bnRJZHggLSB0aGUgYWNjb3VudCBpbmRleCBvZiB0aGUgYWRkcmVzcydzIHN1YmFkZHJlc3NcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN1YmFkZHJlc3NJZHggLSB0aGUgc3ViYWRkcmVzcyBpbmRleCB3aXRoaW4gdGhlIGFjY291bnRcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgcmVjZWl2ZSBhZGRyZXNzIG9mIHRoZSBzcGVjaWZpZWQgc3ViYWRkcmVzc1xuICAgKi9cbiAgYXN5bmMgZ2V0QWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlcik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRleCBvZiB0aGUgZ2l2ZW4gYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gYWRkcmVzcyB0byBnZXQgdGhlIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kZXggZnJvbVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+fSB0aGUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzXG4gICAqL1xuICBhc3luYyBnZXRBZGRyZXNzSW5kZXgoYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhbiBpbnRlZ3JhdGVkIGFkZHJlc3MgYmFzZWQgb24gdGhlIGdpdmVuIHN0YW5kYXJkIGFkZHJlc3MgYW5kIHBheW1lbnRcbiAgICogSUQuIFVzZXMgdGhlIHdhbGxldCdzIHByaW1hcnkgYWRkcmVzcyBpZiBhbiBhZGRyZXNzIGlzIG5vdCBnaXZlbi5cbiAgICogR2VuZXJhdGVzIGEgcmFuZG9tIHBheW1lbnQgSUQgaWYgYSBwYXltZW50IElEIGlzIG5vdCBnaXZlbi5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdGFuZGFyZEFkZHJlc3MgaXMgdGhlIHN0YW5kYXJkIGFkZHJlc3MgdG8gZ2VuZXJhdGUgdGhlIGludGVncmF0ZWQgYWRkcmVzcyBmcm9tICh3YWxsZXQncyBwcmltYXJ5IGFkZHJlc3MgaWYgdW5kZWZpbmVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF5bWVudElkIGlzIHRoZSBwYXltZW50IElEIHRvIGdlbmVyYXRlIGFuIGludGVncmF0ZWQgYWRkcmVzcyBmcm9tIChyYW5kb21seSBnZW5lcmF0ZWQgaWYgdW5kZWZpbmVkKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPn0gdGhlIGludGVncmF0ZWQgYWRkcmVzc1xuICAgKi9cbiAgYXN5bmMgZ2V0SW50ZWdyYXRlZEFkZHJlc3Moc3RhbmRhcmRBZGRyZXNzPzogc3RyaW5nLCBwYXltZW50SWQ/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlY29kZSBhbiBpbnRlZ3JhdGVkIGFkZHJlc3MgdG8gZ2V0IGl0cyBzdGFuZGFyZCBhZGRyZXNzIGFuZCBwYXltZW50IGlkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGludGVncmF0ZWRBZGRyZXNzIC0gaW50ZWdyYXRlZCBhZGRyZXNzIHRvIGRlY29kZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPn0gdGhlIGRlY29kZWQgaW50ZWdyYXRlZCBhZGRyZXNzIGluY2x1ZGluZyBzdGFuZGFyZCBhZGRyZXNzIGFuZCBwYXltZW50IGlkXG4gICAqL1xuICBhc3luYyBkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGJsb2NrIGhlaWdodCB0aGF0IHRoZSB3YWxsZXQgaXMgc3luY2VkIHRvLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB0aGUgYmxvY2sgaGVpZ2h0IHRoYXQgdGhlIHdhbGxldCBpcyBzeW5jZWQgdG9cbiAgICovXG4gIGFzeW5jIGdldEhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGJsb2NrY2hhaW4ncyBoZWlnaHQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBibG9ja2NoYWluJ3MgaGVpZ2h0XG4gICAqL1xuICBhc3luYyBnZXREYWVtb25IZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBibG9ja2NoYWluJ3MgaGVpZ2h0IGJ5IGRhdGUgYXMgYSBjb25zZXJ2YXRpdmUgZXN0aW1hdGUgZm9yIHNjYW5uaW5nLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IHllYXIgLSB5ZWFyIG9mIHRoZSBoZWlnaHQgdG8gZ2V0XG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtb250aCAtIG1vbnRoIG9mIHRoZSBoZWlnaHQgdG8gZ2V0IGFzIGEgbnVtYmVyIGJldHdlZW4gMSBhbmQgMTJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGRheSAtIGRheSBvZiB0aGUgaGVpZ2h0IHRvIGdldCBhcyBhIG51bWJlciBiZXR3ZWVuIDEgYW5kIDMxXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIGJsb2NrY2hhaW4ncyBhcHByb3hpbWF0ZSBoZWlnaHQgYXQgdGhlIGdpdmVuIGRhdGVcbiAgICovXG4gIGFzeW5jIGdldEhlaWdodEJ5RGF0ZSh5ZWFyOiBudW1iZXIsIG1vbnRoOiBudW1iZXIsIGRheTogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3luY2hyb25pemUgdGhlIHdhbGxldCB3aXRoIHRoZSBkYWVtb24gYXMgYSBvbmUtdGltZSBzeW5jaHJvbm91cyBwcm9jZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRMaXN0ZW5lcnxudW1iZXJ9IFtsaXN0ZW5lck9yU3RhcnRIZWlnaHRdIC0gbGlzdGVuZXIgeG9yIHN0YXJ0IGhlaWdodCAoZGVmYXVsdHMgdG8gbm8gc3luYyBsaXN0ZW5lciwgdGhlIGxhc3Qgc3luY2VkIGJsb2NrKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0SGVpZ2h0XSAtIHN0YXJ0SGVpZ2h0IGlmIG5vdCBnaXZlbiBpbiBmaXJzdCBhcmcgKGRlZmF1bHRzIHRvIGxhc3Qgc3luY2VkIGJsb2NrKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc3luYyhsaXN0ZW5lck9yU3RhcnRIZWlnaHQ/OiBNb25lcm9XYWxsZXRMaXN0ZW5lciB8IG51bWJlciwgc3RhcnRIZWlnaHQ/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb1N5bmNSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3RhcnQgYmFja2dyb3VuZCBzeW5jaHJvbml6aW5nIHdpdGggYSBtYXhpbXVtIHBlcmlvZCBiZXR3ZWVuIHN5bmNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzeW5jUGVyaW9kSW5Nc10gLSBtYXhpbXVtIHBlcmlvZCBiZXR3ZWVuIHN5bmNzIGluIG1pbGxpc2Vjb25kcyAoZGVmYXVsdCBpcyB3YWxsZXQtc3BlY2lmaWMpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXM/OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3RvcCBzeW5jaHJvbml6aW5nIHRoZSB3YWxsZXQgd2l0aCB0aGUgZGFlbW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN0b3BTeW5jaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTY2FuIHRyYW5zYWN0aW9ucyBieSB0aGVpciBoYXNoL2lkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gdHhIYXNoZXMgLSB0eCBoYXNoZXMgdG8gc2NhblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2NhblR4cyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+UmVzY2FuIHRoZSBibG9ja2NoYWluIGZvciBzcGVudCBvdXRwdXRzLjwvcD5cbiAgICogXG4gICAqIDxwPk5vdGU6IHRoaXMgY2FuIG9ubHkgYmUgY2FsbGVkIHdpdGggYSB0cnVzdGVkIGRhZW1vbi48L3A+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlIHVzZSBjYXNlOiBwZWVyIG11bHRpc2lnIGhleCBpcyBpbXBvcnQgd2hlbiBjb25uZWN0ZWQgdG8gYW4gdW50cnVzdGVkIGRhZW1vbixcbiAgICogc28gdGhlIHdhbGxldCB3aWxsIG5vdCByZXNjYW4gc3BlbnQgb3V0cHV0cy4gIFRoZW4gdGhlIHdhbGxldCBjb25uZWN0cyB0byBhIHRydXN0ZWRcbiAgICogZGFlbW9uLiAgVGhpcyBtZXRob2Qgc2hvdWxkIGJlIG1hbnVhbGx5IGludm9rZWQgdG8gcmVzY2FuIG91dHB1dHMuPC9wPlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHJlc2NhblNwZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5SZXNjYW4gdGhlIGJsb2NrY2hhaW4gZnJvbSBzY3JhdGNoLCBsb3NpbmcgYW55IGluZm9ybWF0aW9uIHdoaWNoIGNhbm5vdCBiZSByZWNvdmVyZWQgZnJvbVxuICAgKiB0aGUgYmxvY2tjaGFpbiBpdHNlbGYuPC9wPlxuICAgKiBcbiAgICogPHA+V0FSTklORzogVGhpcyBtZXRob2QgZGlzY2FyZHMgbG9jYWwgd2FsbGV0IGRhdGEgbGlrZSBkZXN0aW5hdGlvbiBhZGRyZXNzZXMsIHR4IHNlY3JldCBrZXlzLFxuICAgKiB0eCBub3RlcywgZXRjLjwvcD5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyByZXNjYW5CbG9ja2NoYWluKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGJhbGFuY2Ugb2YgdGhlIHdhbGxldCwgYWNjb3VudCwgb3Igc3ViYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbYWNjb3VudElkeF0gLSBpbmRleCBvZiB0aGUgYWNjb3VudCB0byBnZXQgdGhlIGJhbGFuY2Ugb2YgKGRlZmF1bHQgYWxsIGFjY291bnRzKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N1YmFkZHJlc3NJZHhdIC0gaW5kZXggb2YgdGhlIHN1YmFkZHJlc3MgdG8gZ2V0IHRoZSBiYWxhbmNlIG9mIChkZWZhdWx0IGFsbCBzdWJhZGRyZXNzZXMpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8YmlnaW50Pn0gdGhlIGJhbGFuY2Ugb2YgdGhlIHdhbGxldCwgYWNjb3VudCwgb3Igc3ViYWRkcmVzc1xuICAgKi9cbiAgYXN5bmMgZ2V0QmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB1bmxvY2tlZCBiYWxhbmNlIG9mIHRoZSB3YWxsZXQsIGFjY291bnQsIG9yIHN1YmFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW2FjY291bnRJZHhdIC0gaW5kZXggb2YgdGhlIGFjY291bnQgdG8gZ2V0IHRoZSB1bmxvY2tlZCBiYWxhbmNlIG9mIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdWJhZGRyZXNzSWR4XSAtIGluZGV4IG9mIHRoZSBzdWJhZGRyZXNzIHRvIGdldCB0aGUgdW5sb2NrZWQgYmFsYW5jZSBvZiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8YmlnaW50Pn0gdGhlIHVubG9ja2VkIGJhbGFuY2Ugb2YgdGhlIHdhbGxldCwgYWNjb3VudCwgb3Igc3ViYWRkcmVzc1xuICAgKi9cbiAgYXN5bmMgZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIG51bWJlciBvZiBibG9ja3MgdW50aWwgdGhlIG5leHQgYW5kIGxhc3QgZnVuZHMgdW5sb2NrLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXJbXT59IHRoZSBudW1iZXIgb2YgYmxvY2tzIHVudGlsIHRoZSBuZXh0IGFuZCBsYXN0IGZ1bmRzIHVubG9jayBpbiBlbGVtZW50cyAwIGFuZCAxLCByZXNwZWN0aXZlbHksIG9yIHVuZGVmaW5lZCBpZiBubyBiYWxhbmNlXG4gICAqL1xuICBhc3luYyBnZXROdW1CbG9ja3NUb1VubG9jaygpOiBQcm9taXNlPG51bWJlcltdPiB7XG4gICAgXG4gICAgLy8gZ2V0IGJhbGFuY2VzXG4gICAgbGV0IGJhbGFuY2UgPSBhd2FpdCB0aGlzLmdldEJhbGFuY2UoKTtcbiAgICBpZiAoYmFsYW5jZSA9PT0gMG4pIHJldHVybiBbdW5kZWZpbmVkLCB1bmRlZmluZWRdOyAvLyBza2lwIGlmIG5vIGJhbGFuY2VcbiAgICBsZXQgdW5sb2NrZWRCYWxhbmNlID0gYXdhaXQgdGhpcy5nZXRVbmxvY2tlZEJhbGFuY2UoKTtcbiAgICBcbiAgICAvLyBjb21wdXRlIG51bWJlciBvZiBibG9ja3MgdW50aWwgbmV4dCBmdW5kcyBhdmFpbGFibGVcbiAgICBsZXQgdHhzO1xuICAgIGxldCBoZWlnaHQ7XG4gICAgbGV0IG51bUJsb2Nrc1RvTmV4dFVubG9jayA9IHVuZGVmaW5lZDtcbiAgICBpZiAodW5sb2NrZWRCYWxhbmNlID4gMG4pIG51bUJsb2Nrc1RvTmV4dFVubG9jayA9IDA7XG4gICAgZWxzZSB7XG4gICAgICB0eHMgPSBhd2FpdCB0aGlzLmdldFR4cyh7aXNMb2NrZWQ6IHRydWV9KTsgLy8gZ2V0IGxvY2tlZCB0eHNcbiAgICAgIGhlaWdodCA9IGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCk7IC8vIGdldCBtb3N0IHJlY2VudCBoZWlnaHRcbiAgICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgICBsZXQgbnVtQmxvY2tzVG9VbmxvY2sgPSBNYXRoLm1heCgodHguZ2V0SXNDb25maXJtZWQoKSA/IHR4LmdldEhlaWdodCgpIDogaGVpZ2h0KSArIDEwLCB0eC5nZXRVbmxvY2tUaW1lKCkpIC0gaGVpZ2h0O1xuICAgICAgICBudW1CbG9ja3NUb05leHRVbmxvY2sgPSBudW1CbG9ja3NUb05leHRVbmxvY2sgPT09IHVuZGVmaW5lZCA/IG51bUJsb2Nrc1RvVW5sb2NrIDogTWF0aC5taW4obnVtQmxvY2tzVG9OZXh0VW5sb2NrLCBudW1CbG9ja3NUb1VubG9jayk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGNvbXB1dGUgbnVtYmVyIG9mIGJsb2NrcyB1bnRpbCBhbGwgZnVuZHMgYXZhaWxhYmxlXG4gICAgbGV0IG51bUJsb2Nrc1RvTGFzdFVubG9jayA9IHVuZGVmaW5lZDtcbiAgICBpZiAoYmFsYW5jZSA9PT0gdW5sb2NrZWRCYWxhbmNlKSB7XG4gICAgICBpZiAodW5sb2NrZWRCYWxhbmNlID4gMG4pIG51bUJsb2Nrc1RvTGFzdFVubG9jayA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghdHhzKSB7XG4gICAgICAgIHR4cyA9IGF3YWl0IHRoaXMuZ2V0VHhzKHtpc0xvY2tlZDogdHJ1ZX0pOyAvLyBnZXQgbG9ja2VkIHR4c1xuICAgICAgICBoZWlnaHQgPSBhd2FpdCB0aGlzLmdldEhlaWdodCgpOyAvLyBnZXQgbW9zdCByZWNlbnQgaGVpZ2h0XG4gICAgICB9XG4gICAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgICAgbGV0IG51bUJsb2Nrc1RvVW5sb2NrID0gTWF0aC5tYXgoKHR4LmdldElzQ29uZmlybWVkKCkgPyB0eC5nZXRIZWlnaHQoKSA6IGhlaWdodCkgKyAxMCwgdHguZ2V0VW5sb2NrVGltZSgpKSAtIGhlaWdodDtcbiAgICAgICAgbnVtQmxvY2tzVG9MYXN0VW5sb2NrID0gbnVtQmxvY2tzVG9MYXN0VW5sb2NrID09PSB1bmRlZmluZWQgPyBudW1CbG9ja3NUb1VubG9jayA6IE1hdGgubWF4KG51bUJsb2Nrc1RvTGFzdFVubG9jaywgbnVtQmxvY2tzVG9VbmxvY2spO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gW251bUJsb2Nrc1RvTmV4dFVubG9jaywgbnVtQmxvY2tzVG9MYXN0VW5sb2NrXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhY2NvdW50cyB3aXRoIGEgZ2l2ZW4gdGFnLlxuICAgKiBcbiAgICogQHBhcmFtIHtib29sZWFufSBpbmNsdWRlU3ViYWRkcmVzc2VzIC0gaW5jbHVkZSBzdWJhZGRyZXNzZXMgaWYgdHJ1ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIC0gdGFnIGZvciBmaWx0ZXJpbmcgYWNjb3VudHMsIGFsbCBhY2NvdW50cyBpZiB1bmRlZmluZWRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9BY2NvdW50W10+fSBhbGwgYWNjb3VudHMgd2l0aCB0aGUgZ2l2ZW4gdGFnXG4gICAqL1xuICBhc3luYyBnZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbiwgdGFnPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9BY2NvdW50W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGFuIGFjY291bnQuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gYWNjb3VudElkeCAtIGluZGV4IG9mIHRoZSBhY2NvdW50IHRvIGdldFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGluY2x1ZGVTdWJhZGRyZXNzZXMgLSBpbmNsdWRlIHN1YmFkZHJlc3NlcyBpZiB0cnVlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQWNjb3VudD59IHRoZSByZXRyaWV2ZWQgYWNjb3VudFxuICAgKi9cbiAgYXN5bmMgZ2V0QWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBhY2NvdW50IHdpdGggYSBsYWJlbCBmb3IgdGhlIGZpcnN0IHN1YmFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2xhYmVsXSAtIGxhYmVsIGZvciBhY2NvdW50J3MgZmlyc3Qgc3ViYWRkcmVzcyAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQWNjb3VudD59IHRoZSBjcmVhdGVkIGFjY291bnRcbiAgICovXG4gIGFzeW5jIGNyZWF0ZUFjY291bnQobGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhbiBhY2NvdW50IGxhYmVsLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFjY291bnRJZHggLSBpbmRleCBvZiB0aGUgYWNjb3VudCB0byBzZXQgdGhlIGxhYmVsIGZvclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbGFiZWwgLSB0aGUgbGFiZWwgdG8gc2V0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRBY2NvdW50TGFiZWwoYWNjb3VudElkeDogbnVtYmVyLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5zZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeCwgMCwgbGFiZWwpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHN1YmFkZHJlc3NlcyBpbiBhbiBhY2NvdW50LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFjY291bnRJZHggLSBhY2NvdW50IHRvIGdldCBzdWJhZGRyZXNzZXMgd2l0aGluXG4gICAqIEBwYXJhbSB7bnVtYmVyW119IFtzdWJhZGRyZXNzSW5kaWNlc10gLSBpbmRpY2VzIG9mIHN1YmFkZHJlc3NlcyB0byBnZXQgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3NbXT59IHRoZSByZXRyaWV2ZWQgc3ViYWRkcmVzc2VzXG4gICAqL1xuICBhc3luYyBnZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSW5kaWNlcz86IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgc3ViYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gaW5kZXggb2YgdGhlIHN1YmFkZHJlc3MncyBhY2NvdW50XG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzdWJhZGRyZXNzSWR4IC0gaW5kZXggb2YgdGhlIHN1YmFkZHJlc3Mgd2l0aGluIHRoZSBhY2NvdW50XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvU3ViYWRkcmVzcz59IHRoZSByZXRyaWV2ZWQgc3ViYWRkcmVzc1xuICAgKi9cbiAgYXN5bmMgZ2V0U3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlcik6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIGFzc2VydChhY2NvdW50SWR4ID49IDApO1xuICAgIGFzc2VydChzdWJhZGRyZXNzSWR4ID49IDApO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgW3N1YmFkZHJlc3NJZHhdKSlbMF07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBzdWJhZGRyZXNzIHdpdGhpbiBhbiBhY2NvdW50LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFjY291bnRJZHggLSBpbmRleCBvZiB0aGUgYWNjb3VudCB0byBjcmVhdGUgdGhlIHN1YmFkZHJlc3Mgd2l0aGluXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbGFiZWxdIC0gdGhlIGxhYmVsIGZvciB0aGUgc3ViYWRkcmVzcyAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvU3ViYWRkcmVzcz59IHRoZSBjcmVhdGVkIHN1YmFkZHJlc3NcbiAgICovXG4gIGFzeW5jIGNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGEgc3ViYWRkcmVzcyBsYWJlbC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gaW5kZXggb2YgdGhlIGFjY291bnQgdG8gc2V0IHRoZSBsYWJlbCBmb3JcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN1YmFkZHJlc3NJZHggLSBpbmRleCBvZiB0aGUgc3ViYWRkcmVzcyB0byBzZXQgdGhlIGxhYmVsIGZvclxuICAgKiBAcGFyYW0ge1Byb21pc2U8c3RyaW5nPn0gbGFiZWwgLSB0aGUgbGFiZWwgdG8gc2V0XG4gICAqL1xuICBhc3luYyBzZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgd2FsbGV0IHRyYW5zYWN0aW9uIGJ5IGhhc2guXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gaGFzaCBvZiBhIHRyYW5zYWN0aW9uIHRvIGdldFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB9IHRoZSBpZGVudGlmaWVkIHRyYW5zYWN0aW9uIG9yIHVuZGVmaW5lZCBpZiBub3QgZm91bmRcbiAgICovXG4gIGFzeW5jIGdldFR4KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4ge1xuICAgIGxldCB0eHMgPSBhd2FpdCB0aGlzLmdldFR4cyhbdHhIYXNoXSk7XG4gICAgcmV0dXJuIHR4cy5sZW5ndGggPT09IDAgPyB1bmRlZmluZWQgOiB0eHNbMF07IFxuICB9XG4gIFxuICAvKipcbiAgICogPHA+R2V0IHdhbGxldCB0cmFuc2FjdGlvbnMuICBXYWxsZXQgdHJhbnNhY3Rpb25zIGNvbnRhaW4gb25lIG9yIG1vcmVcbiAgICogdHJhbnNmZXJzIHRoYXQgYXJlIGVpdGhlciBpbmNvbWluZyBvciBvdXRnb2luZyB0byB0aGUgd2FsbGV0LjxwPlxuICAgKiBcbiAgICogPHA+UmVzdWx0cyBjYW4gYmUgZmlsdGVyZWQgYnkgcGFzc2luZyBhIHF1ZXJ5IG9iamVjdC4gIFRyYW5zYWN0aW9ucyBtdXN0XG4gICAqIG1lZXQgZXZlcnkgY3JpdGVyaWEgZGVmaW5lZCBpbiB0aGUgcXVlcnkgaW4gb3JkZXIgdG8gYmUgcmV0dXJuZWQuICBBbGxcbiAgICogY3JpdGVyaWEgYXJlIG9wdGlvbmFsIGFuZCBubyBmaWx0ZXJpbmcgaXMgYXBwbGllZCB3aGVuIG5vdCBkZWZpbmVkLjwvcD5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nW10gfCBNb25lcm9UeFF1ZXJ5fSBbcXVlcnldIC0gY29uZmlndXJlcyB0aGUgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc0NvbmZpcm1lZF0gLSBnZXQgdHhzIHRoYXQgYXJlIGNvbmZpcm1lZCBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pblR4UG9vbF0gLSBnZXQgdHhzIHRoYXQgYXJlIGluIHRoZSB0eCBwb29sIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzUmVsYXllZF0gLSBnZXQgdHhzIHRoYXQgYXJlIHJlbGF5ZWQgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNGYWlsZWRdIC0gZ2V0IHR4cyB0aGF0IGFyZSBmYWlsZWQgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNNaW5lclR4XSAtIGdldCBtaW5lciB0eHMgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtxdWVyeS5oYXNoXSAtIGdldCBhIHR4IHdpdGggdGhlIGhhc2ggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBbcXVlcnkuaGFzaGVzXSAtIGdldCB0eHMgd2l0aCB0aGUgaGFzaGVzIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtxdWVyeS5wYXltZW50SWRdIC0gZ2V0IHRyYW5zYWN0aW9ucyB3aXRoIHRoZSBwYXltZW50IGlkIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gW3F1ZXJ5LnBheW1lbnRJZHNdIC0gZ2V0IHRyYW5zYWN0aW9ucyB3aXRoIHRoZSBwYXltZW50IGlkcyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5Lmhhc1BheW1lbnRJZF0gLSBnZXQgdHJhbnNhY3Rpb25zIHdpdGggYSBwYXltZW50IGlkIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkubWluSGVpZ2h0XSAtIGdldCB0eHMgd2l0aCBoZWlnaHQgPj0gdGhlIGdpdmVuIGhlaWdodCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkubWF4SGVpZ2h0XSAtIGdldCB0eHMgd2l0aCBoZWlnaHQgPD0gdGhlIGdpdmVuIGhlaWdodCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzT3V0Z29pbmddIC0gZ2V0IHR4cyB3aXRoIGFuIG91dGdvaW5nIHRyYW5zZmVyIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzSW5jb21pbmddIC0gZ2V0IHR4cyB3aXRoIGFuIGluY29taW5nIHRyYW5zZmVyIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvVHJhbnNmZXJRdWVyeX0gW3F1ZXJ5LnRyYW5zZmVyUXVlcnldIC0gZ2V0IHR4cyB0aGF0IGhhdmUgYSB0cmFuc2ZlciB0aGF0IG1lZXRzIHRoaXMgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pbmNsdWRlT3V0cHV0c10gLSBzcGVjaWZpZXMgdGhhdCB0eCBvdXRwdXRzIHNob3VsZCBiZSByZXR1cm5lZCB3aXRoIHR4IHJlc3VsdHMgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+fSB3YWxsZXQgdHJhbnNhY3Rpb25zIHBlciB0aGUgY29uZmlndXJhdGlvblxuICAgKi9cbiAgYXN5bmMgZ2V0VHhzKHF1ZXJ5Pzogc3RyaW5nW10gfCBQYXJ0aWFsPE1vbmVyb1R4UXVlcnk+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiA8cD5HZXQgaW5jb21pbmcgYW5kIG91dGdvaW5nIHRyYW5zZmVycyB0byBhbmQgZnJvbSB0aGlzIHdhbGxldC4gIEFuIG91dGdvaW5nXG4gICAqIHRyYW5zZmVyIHJlcHJlc2VudHMgYSB0b3RhbCBhbW91bnQgc2VudCBmcm9tIG9uZSBvciBtb3JlIHN1YmFkZHJlc3Nlc1xuICAgKiB3aXRoaW4gYW4gYWNjb3VudCB0byBpbmRpdmlkdWFsIGRlc3RpbmF0aW9uIGFkZHJlc3NlcywgZWFjaCB3aXRoIHRoZWlyXG4gICAqIG93biBhbW91bnQuICBBbiBpbmNvbWluZyB0cmFuc2ZlciByZXByZXNlbnRzIGEgdG90YWwgYW1vdW50IHJlY2VpdmVkIGludG9cbiAgICogYSBzdWJhZGRyZXNzIHdpdGhpbiBhbiBhY2NvdW50LiAgVHJhbnNmZXJzIGJlbG9uZyB0byB0cmFuc2FjdGlvbnMgd2hpY2hcbiAgICogYXJlIHN0b3JlZCBvbiB0aGUgYmxvY2tjaGFpbi48L3A+XG4gICAqIFxuICAgKiA8cD5SZXN1bHRzIGNhbiBiZSBmaWx0ZXJlZCBieSBwYXNzaW5nIGEgcXVlcnkgb2JqZWN0LiAgVHJhbnNmZXJzIG11c3RcbiAgICogbWVldCBldmVyeSBjcml0ZXJpYSBkZWZpbmVkIGluIHRoZSBxdWVyeSBpbiBvcmRlciB0byBiZSByZXR1cm5lZC4gIEFsbFxuICAgKiBjcml0ZXJpYSBhcmUgb3B0aW9uYWwgYW5kIG5vIGZpbHRlcmluZyBpcyBhcHBsaWVkIHdoZW4gbm90IGRlZmluZWQuPC9wPlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UcmFuc2ZlclF1ZXJ5fSBbcXVlcnldIC0gY29uZmlndXJlcyB0aGUgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc091dGdvaW5nXSAtIGdldCB0cmFuc2ZlcnMgdGhhdCBhcmUgb3V0Z29pbmcgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNJbmNvbWluZ10gLSBnZXQgdHJhbnNmZXJzIHRoYXQgYXJlIGluY29taW5nIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcXVlcnkuYWRkcmVzc10gLSB3YWxsZXQncyBhZGRyZXNzIHRoYXQgYSB0cmFuc2ZlciBlaXRoZXIgb3JpZ2luYXRlZCBmcm9tIChpZiBvdXRnb2luZykgb3IgaXMgZGVzdGluZWQgZm9yIChpZiBpbmNvbWluZykgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LmFjY291bnRJbmRleF0gLSBnZXQgdHJhbnNmZXJzIHRoYXQgZWl0aGVyIG9yaWdpbmF0ZWQgZnJvbSAoaWYgb3V0Z29pbmcpIG9yIGFyZSBkZXN0aW5lZCBmb3IgKGlmIGluY29taW5nKSBhIHNwZWNpZmljIGFjY291bnQgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRleF0gLSBnZXQgdHJhbnNmZXJzIHRoYXQgZWl0aGVyIG9yaWdpbmF0ZWQgZnJvbSAoaWYgb3V0Z29pbmcpIG9yIGFyZSBkZXN0aW5lZCBmb3IgKGlmIGluY29taW5nKSBhIHNwZWNpZmljIHN1YmFkZHJlc3MgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2ludFtdfSBbcXVlcnkuc3ViYWRkcmVzc0luZGljZXNdIC0gZ2V0IHRyYW5zZmVycyB0aGF0IGVpdGhlciBvcmlnaW5hdGVkIGZyb20gKGlmIG91dGdvaW5nKSBvciBhcmUgZGVzdGluZWQgZm9yIChpZiBpbmNvbWluZykgc3BlY2lmaWMgc3ViYWRkcmVzcyBpbmRpY2VzIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtiaWdpbnR9IFtxdWVyeS5hbW91bnRdIC0gYW1vdW50IGJlaW5nIHRyYW5zZmVycmVkIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtNb25lcm9EZXN0aW5hdGlvbltdIHwgTW9uZXJvRGVzdGluYXRpb25Nb2RlbFtdfSBbcXVlcnkuZGVzdGluYXRpb25zXSAtIGluZGl2aWR1YWwgZGVzdGluYXRpb25zIG9mIGFuIG91dGdvaW5nIHRyYW5zZmVyLCB3aGljaCBpcyBsb2NhbCB3YWxsZXQgZGF0YSBhbmQgTk9UIHJlY292ZXJhYmxlIGZyb20gdGhlIGJsb2NrY2hhaW4gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5oYXNEZXN0aW5hdGlvbnNdIC0gZ2V0IHRyYW5zZmVycyB0aGF0IGhhdmUgZGVzdGluYXRpb25zIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhRdWVyeX0gW3F1ZXJ5LnR4UXVlcnldIC0gZ2V0IHRyYW5zZmVycyB3aG9zZSB0cmFuc2FjdGlvbiBtZWV0cyB0aGlzIHF1ZXJ5IChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UcmFuc2ZlcltdPn0gd2FsbGV0IHRyYW5zZmVycyB0aGF0IG1lZXQgdGhlIHF1ZXJ5XG4gICAqL1xuICBhc3luYyBnZXRUcmFuc2ZlcnMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9UcmFuc2ZlcltdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBpbmNvbWluZyB0cmFuc2ZlcnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT59IFtxdWVyeV0gLSBjb25maWd1cmVzIHRoZSBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcXVlcnkuYWRkcmVzc10gLSBnZXQgaW5jb21pbmcgdHJhbnNmZXJzIHRvIGEgc3BlY2lmaWMgYWRkcmVzcyBpbiB0aGUgd2FsbGV0IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5hY2NvdW50SW5kZXhdIC0gZ2V0IGluY29taW5nIHRyYW5zZmVycyB0byBhIHNwZWNpZmljIGFjY291bnQgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRleF0gLSBnZXQgaW5jb21pbmcgdHJhbnNmZXJzIHRvIGEgc3BlY2lmaWMgc3ViYWRkcmVzcyBpbmRleCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7aW50W119IFtxdWVyeS5zdWJhZGRyZXNzSW5kaWNlc10gLSBnZXQgdHJhbnNmZXJzIGRlc3RpbmVkIGZvciBzcGVjaWZpYyBzdWJhZGRyZXNzIGluZGljZXMgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludH0gW3F1ZXJ5LmFtb3VudF0gLSBhbW91bnQgYmVpbmcgdHJhbnNmZXJyZWQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UXVlcnl9IFtxdWVyeS50eFF1ZXJ5XSAtIGdldCB0cmFuc2ZlcnMgd2hvc2UgdHJhbnNhY3Rpb24gbWVldHMgdGhpcyBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvSW5jb21pbmdUcmFuc2ZlcltdPn0gaW5jb21pbmcgdHJhbnNmZXJzIHRoYXQgbWVldCB0aGUgcXVlcnlcbiAgICovXG4gIGFzeW5jIGdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvSW5jb21pbmdUcmFuc2ZlcltdPiB7XG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkOiBNb25lcm9UcmFuc2ZlclF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQuZ2V0SXNJbmNvbWluZygpID09PSBmYWxzZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVHJhbnNmZXIgcXVlcnkgY29udHJhZGljdHMgZ2V0dGluZyBpbmNvbWluZyB0cmFuc2ZlcnNcIik7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldElzSW5jb21pbmcodHJ1ZSk7XG4gICAgcmV0dXJuIHRoaXMuZ2V0VHJhbnNmZXJzKHF1ZXJ5Tm9ybWFsaXplZCkgYXMgdW5rbm93biBhcyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyW107XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgb3V0Z29pbmcgdHJhbnNmZXJzLlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+fSBbcXVlcnldIC0gY29uZmlndXJlcyB0aGUgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3F1ZXJ5LmFkZHJlc3NdIC0gZ2V0IG91dGdvaW5nIHRyYW5zZmVycyBmcm9tIGEgc3BlY2lmaWMgYWRkcmVzcyBpbiB0aGUgd2FsbGV0IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5hY2NvdW50SW5kZXhdIC0gZ2V0IG91dGdvaW5nIHRyYW5zZmVycyBmcm9tIGEgc3BlY2lmaWMgYWNjb3VudCBpbmRleCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkuc3ViYWRkcmVzc0luZGV4XSAtIGdldCBvdXRnb2luZyB0cmFuc2ZlcnMgZnJvbSBhIHNwZWNpZmljIHN1YmFkZHJlc3MgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2ludFtdfSBbcXVlcnkuc3ViYWRkcmVzc0luZGljZXNdIC0gZ2V0IG91dGdvaW5nIHRyYW5zZmVycyBmcm9tIHNwZWNpZmljIHN1YmFkZHJlc3MgaW5kaWNlcyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7YmlnaW50fSBbcXVlcnkuYW1vdW50XSAtIGFtb3VudCBiZWluZyB0cmFuc2ZlcnJlZCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvRGVzdGluYXRpb25bXSB8IE1vbmVyb0Rlc3RpbmF0aW9uTW9kZWxbXX0gW3F1ZXJ5LmRlc3RpbmF0aW9uc10gLSBpbmRpdmlkdWFsIGRlc3RpbmF0aW9ucyBvZiBhbiBvdXRnb2luZyB0cmFuc2Zlciwgd2hpY2ggaXMgbG9jYWwgd2FsbGV0IGRhdGEgYW5kIE5PVCByZWNvdmVyYWJsZSBmcm9tIHRoZSBibG9ja2NoYWluIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaGFzRGVzdGluYXRpb25zXSAtIGdldCB0cmFuc2ZlcnMgdGhhdCBoYXZlIGRlc3RpbmF0aW9ucyBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UXVlcnl9IFtxdWVyeS50eFF1ZXJ5XSAtIGdldCB0cmFuc2ZlcnMgd2hvc2UgdHJhbnNhY3Rpb24gbWVldHMgdGhpcyBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvT3V0Z29pbmdUcmFuc2ZlcltdPn0gb3V0Z29pbmcgdHJhbnNmZXJzIHRoYXQgbWVldCB0aGUgcXVlcnlcbiAgICovXG4gIGFzeW5jIGdldE91dGdvaW5nVHJhbnNmZXJzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvT3V0Z29pbmdUcmFuc2ZlcltdPiB7XG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkOiBNb25lcm9UcmFuc2ZlclF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQuZ2V0SXNPdXRnb2luZygpID09PSBmYWxzZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVHJhbnNmZXIgcXVlcnkgY29udHJhZGljdHMgZ2V0dGluZyBvdXRnb2luZyB0cmFuc2ZlcnNcIik7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgcmV0dXJuIHRoaXMuZ2V0VHJhbnNmZXJzKHF1ZXJ5Tm9ybWFsaXplZCkgYXMgdW5rbm93biBhcyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyW107XG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5HZXQgb3V0cHV0cyBjcmVhdGVkIGZyb20gcHJldmlvdXMgdHJhbnNhY3Rpb25zIHRoYXQgYmVsb25nIHRvIHRoZSB3YWxsZXRcbiAgICogKGkuZS4gdGhhdCB0aGUgd2FsbGV0IGNhbiBzcGVuZCBvbmUgdGltZSkuICBPdXRwdXRzIGFyZSBwYXJ0IG9mXG4gICAqIHRyYW5zYWN0aW9ucyB3aGljaCBhcmUgc3RvcmVkIGluIGJsb2NrcyBvbiB0aGUgYmxvY2tjaGFpbi48L3A+XG4gICAqIFxuICAgKiA8cD5SZXN1bHRzIGNhbiBiZSBmaWx0ZXJlZCBieSBwYXNzaW5nIGEgcXVlcnkgb2JqZWN0LiAgT3V0cHV0cyBtdXN0XG4gICAqIG1lZXQgZXZlcnkgY3JpdGVyaWEgZGVmaW5lZCBpbiB0aGUgcXVlcnkgaW4gb3JkZXIgdG8gYmUgcmV0dXJuZWQuICBBbGxcbiAgICogZmlsdGVyaW5nIGlzIG9wdGlvbmFsIGFuZCBubyBmaWx0ZXJpbmcgaXMgYXBwbGllZCB3aGVuIG5vdCBkZWZpbmVkLjwvcD5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFyaXRhbDxNb25lcm9PdXRwdXRRdWVyeT59IFtxdWVyeV0gLSBjb25maWd1cmVzIHRoZSBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkuYWNjb3VudEluZGV4XSAtIGdldCBvdXRwdXRzIGFzc29jaWF0ZWQgd2l0aCBhIHNwZWNpZmljIGFjY291bnQgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRleF0gLSBnZXQgb3V0cHV0cyBhc3NvY2lhdGVkIHdpdGggYSBzcGVjaWZpYyBzdWJhZGRyZXNzIGluZGV4IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtpbnRbXX0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRpY2VzXSAtIGdldCBvdXRwdXRzIGFzc29jaWF0ZWQgd2l0aCBzcGVjaWZpYyBzdWJhZGRyZXNzIGluZGljZXMgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludH0gW3F1ZXJ5LmFtb3VudF0gLSBnZXQgb3V0cHV0cyB3aXRoIGEgc3BlY2lmaWMgYW1vdW50IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtiaWdpbnR9IFtxdWVyeS5taW5BbW91bnRdIC0gZ2V0IG91dHB1dHMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIGEgbWluaW11bSBhbW91bnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludH0gW3F1ZXJ5Lm1heEFtb3VudF0gLSBnZXQgb3V0cHV0cyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gYSBtYXhpbXVtIGFtb3VudCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzU3BlbnRdIC0gZ2V0IG91dHB1dHMgdGhhdCBhcmUgc3BlbnQgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvS2V5SW1hZ2V9IFtxdWVyeS5rZXlJbWFnZV0gLSBnZXQgb3V0cHV0IHdpdGggYSBrZXkgaW1hZ2Ugb3Igd2hpY2ggbWF0Y2hlcyBmaWVsZHMgZGVmaW5lZCBpbiBhIE1vbmVyb0tleUltYWdlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtNb25lcm9UeFF1ZXJ5fSBbcXVlcnkudHhRdWVyeV0gLSBnZXQgb3V0cHV0cyB3aG9zZSB0cmFuc2FjdGlvbiBtZWV0cyB0aGlzIGZpbHRlciAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvT3V0cHV0V2FsbGV0W10+fSB0aGUgcXVlcmllZCBvdXRwdXRzXG4gICAqL1xuICBhc3luYyBnZXRPdXRwdXRzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9PdXRwdXRRdWVyeT4pOiBQcm9taXNlPE1vbmVyb091dHB1dFdhbGxldFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEV4cG9ydCBvdXRwdXRzIGluIGhleCBmb3JtYXQuXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2FsbF0gLSBleHBvcnQgYWxsIG91dHB1dHMgaWYgdHJ1ZSwgZWxzZSBleHBvcnQgdGhlIG91dHB1dHMgc2luY2UgdGhlIGxhc3QgZXhwb3J0IChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IG91dHB1dHMgaW4gaGV4IGZvcm1hdFxuICAgKi9cbiAgYXN5bmMgZXhwb3J0T3V0cHV0cyhhbGwgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEltcG9ydCBvdXRwdXRzIGluIGhleCBmb3JtYXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3V0cHV0c0hleCAtIG91dHB1dHMgaW4gaGV4IGZvcm1hdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBudW1iZXIgb2Ygb3V0cHV0cyBpbXBvcnRlZFxuICAgKi9cbiAgYXN5bmMgaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBFeHBvcnQgc2lnbmVkIGtleSBpbWFnZXMuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthbGxdIC0gZXhwb3J0IGFsbCBrZXkgaW1hZ2VzIGlmIHRydWUsIGVsc2UgZXhwb3J0IHRoZSBrZXkgaW1hZ2VzIHNpbmNlIHRoZSBsYXN0IGV4cG9ydCAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPn0gdGhlIHdhbGxldCdzIHNpZ25lZCBrZXkgaW1hZ2VzXG4gICAqL1xuICBhc3luYyBleHBvcnRLZXlJbWFnZXMoYWxsID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogSW1wb3J0IHNpZ25lZCBrZXkgaW1hZ2VzIGFuZCB2ZXJpZnkgdGhlaXIgc3BlbnQgc3RhdHVzLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9LZXlJbWFnZVtdfSBrZXlJbWFnZXMgLSBpbWFnZXMgdG8gaW1wb3J0IGFuZCB2ZXJpZnkgKHJlcXVpcmVzIGhleCBhbmQgc2lnbmF0dXJlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0Pn0gcmVzdWx0cyBvZiB0aGUgaW1wb3J0XG4gICAqL1xuICBhc3luYyBpbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzOiBNb25lcm9LZXlJbWFnZVtdKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgbmV3IGtleSBpbWFnZXMgZnJvbSB0aGUgbGFzdCBpbXBvcnRlZCBvdXRwdXRzLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPn0gdGhlIGtleSBpbWFnZXMgZnJvbSB0aGUgbGFzdCBpbXBvcnRlZCBvdXRwdXRzXG4gICAqL1xuICBhc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRnJlZXplIGFuIG91dHB1dC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJbWFnZSAtIGtleSBpbWFnZSBvZiB0aGUgb3V0cHV0IHRvIGZyZWV6ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgZnJlZXplT3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogVGhhdyBhIGZyb3plbiBvdXRwdXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SW1hZ2UgLSBrZXkgaW1hZ2Ugb2YgdGhlIG91dHB1dCB0byB0aGF3XG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyB0aGF3T3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ2hlY2sgaWYgYW4gb3V0cHV0IGlzIGZyb3plbi5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJbWFnZSAtIGtleSBpbWFnZSBvZiB0aGUgb3V0cHV0IHRvIGNoZWNrIGlmIGZyb3plblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSBvdXRwdXQgaXMgZnJvemVuLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzT3V0cHV0RnJvemVuKGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ3JlYXRlIGEgdHJhbnNhY3Rpb24gdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSB0aGlzIHdhbGxldC5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhDb25maWd9IGNvbmZpZyAtIGNvbmZpZ3VyZXMgdGhlIHRyYW5zYWN0aW9uIHRvIGNyZWF0ZSAocmVxdWlyZWQpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb25maWcuYWRkcmVzcyAtIHNpbmdsZSBkZXN0aW5hdGlvbiBhZGRyZXNzIChyZXF1aXJlZCB1bmxlc3MgYGRlc3RpbmF0aW9uc2AgcHJvdmlkZWQpXG4gICAqIEBwYXJhbSB7YmlnaW50fHN0cmluZ30gY29uZmlnLmFtb3VudCAtIHNpbmdsZSBkZXN0aW5hdGlvbiBhbW91bnQgKHJlcXVpcmVkIHVubGVzcyBgZGVzdGluYXRpb25zYCBwcm92aWRlZClcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNvbmZpZy5hY2NvdW50SW5kZXggLSBzb3VyY2UgYWNjb3VudCBpbmRleCB0byB0cmFuc2ZlciBmdW5kcyBmcm9tIChyZXF1aXJlZClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcuc3ViYWRkcmVzc0luZGV4XSAtIHNvdXJjZSBzdWJhZGRyZXNzIGluZGV4IHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcltdfSBbY29uZmlnLnN1YmFkZHJlc3NJbmRpY2VzXSAtIHNvdXJjZSBzdWJhZGRyZXNzIGluZGljZXMgdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5yZWxheV0gLSByZWxheSB0aGUgdHJhbnNhY3Rpb24gdG8gcGVlcnMgdG8gY29tbWl0IHRvIHRoZSBibG9ja2NoYWluIChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UHJpb3JpdHl9IFtjb25maWcucHJpb3JpdHldIC0gdHJhbnNhY3Rpb24gcHJpb3JpdHkgKGRlZmF1bHQgTW9uZXJvVHhQcmlvcml0eS5OT1JNQUwpXG4gICAqIEBwYXJhbSB7TW9uZXJvRGVzdGluYXRpb25bXX0gY29uZmlnLmRlc3RpbmF0aW9ucyAtIGFkZHJlc3NlcyBhbmQgYW1vdW50cyBpbiBhIG11bHRpLWRlc3RpbmF0aW9uIHR4IChyZXF1aXJlZCB1bmxlc3MgYGFkZHJlc3NgIGFuZCBgYW1vdW50YCBwcm92aWRlZClcbiAgICogQHBhcmFtIHtudW1iZXJbXX0gW2NvbmZpZy5zdWJ0cmFjdEZlZUZyb21dIC0gbGlzdCBvZiBkZXN0aW5hdGlvbiBpbmRpY2VzIHRvIHNwbGl0IHRoZSB0cmFuc2FjdGlvbiBmZWUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXltZW50SWRdIC0gdHJhbnNhY3Rpb24gcGF5bWVudCBJRCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7YmlnaW50fHN0cmluZ30gW2NvbmZpZy51bmxvY2tUaW1lXSAtIG1pbmltdW0gaGVpZ2h0IG9yIHRpbWVzdGFtcCBmb3IgdGhlIHRyYW5zYWN0aW9uIHRvIHVubG9jayAoZGVmYXVsdCAwKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4V2FsbGV0Pn0gdGhlIGNyZWF0ZWQgdHJhbnNhY3Rpb25cbiAgICovXG4gIGFzeW5jIGNyZWF0ZVR4KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7XG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZDogTW9uZXJvVHhDb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSAhPT0gdW5kZWZpbmVkKSBhc3NlcnQuZXF1YWwoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpLCBmYWxzZSwgXCJDYW5ub3Qgc3BsaXQgdHJhbnNhY3Rpb25zIHVzaW5nIGNyZWF0ZVR4KCk7IHVzZSBjcmVhdGVUeHMoKVwiKTtcbiAgICBjb25maWdOb3JtYWxpemVkLnNldENhblNwbGl0KGZhbHNlKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY3JlYXRlVHhzKGNvbmZpZ05vcm1hbGl6ZWQpKVswXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENyZWF0ZSBvbmUgb3IgbW9yZSB0cmFuc2FjdGlvbnMgdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSB0aGlzIHdhbGxldC5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9UeENvbmZpZz59IGNvbmZpZyAtIGNvbmZpZ3VyZXMgdGhlIHRyYW5zYWN0aW9ucyB0byBjcmVhdGUgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmFkZHJlc3MgLSBzaW5nbGUgZGVzdGluYXRpb24gYWRkcmVzcyAocmVxdWlyZWQgdW5sZXNzIGBkZXN0aW5hdGlvbnNgIHByb3ZpZGVkKVxuICAgKiBAcGFyYW0ge2JpZ2ludHxzdHJpbmd9IGNvbmZpZy5hbW91bnQgLSBzaW5nbGUgZGVzdGluYXRpb24gYW1vdW50IChyZXF1aXJlZCB1bmxlc3MgYGRlc3RpbmF0aW9uc2AgcHJvdmlkZWQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBjb25maWcuYWNjb3VudEluZGV4IC0gc291cmNlIGFjY291bnQgaW5kZXggdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSAocmVxdWlyZWQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnN1YmFkZHJlc3NJbmRleF0gLSBzb3VyY2Ugc3ViYWRkcmVzcyBpbmRleCB0byB0cmFuc2ZlciBmdW5kcyBmcm9tIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtpbnRbXX0gW2NvbmZpZy5zdWJhZGRyZXNzSW5kaWNlc10gLSBzb3VyY2Ugc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucmVsYXldIC0gcmVsYXkgdGhlIHRyYW5zYWN0aW9ucyB0byBwZWVycyB0byBjb21taXQgdG8gdGhlIGJsb2NrY2hhaW4gKGRlZmF1bHQgZmFsc2UpXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhQcmlvcml0eX0gW2NvbmZpZy5wcmlvcml0eV0gLSB0cmFuc2FjdGlvbiBwcmlvcml0eSAoZGVmYXVsdCBNb25lcm9UeFByaW9yaXR5Lk5PUk1BTClcbiAgICogQHBhcmFtIHtNb25lcm9EZXN0aW5hdGlvbltdIHwgTW9uZXJvRGVzdGluYXRpb25Nb2RlbFtdfSBjb25maWcuZGVzdGluYXRpb25zIC0gYWRkcmVzc2VzIGFuZCBhbW91bnRzIGluIGEgbXVsdGktZGVzdGluYXRpb24gdHggKHJlcXVpcmVkIHVubGVzcyBgYWRkcmVzc2AgYW5kIGBhbW91bnRgIHByb3ZpZGVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXltZW50SWRdIC0gdHJhbnNhY3Rpb24gcGF5bWVudCBJRCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7YmlnaW50fHN0cmluZ30gW2NvbmZpZy51bmxvY2tUaW1lXSAtIG1pbmltdW0gaGVpZ2h0IG9yIHRpbWVzdGFtcCBmb3IgdGhlIHRyYW5zYWN0aW9ucyB0byB1bmxvY2sgKGRlZmF1bHQgMClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLmNhblNwbGl0XSAtIGFsbG93IGZ1bmRzIHRvIGJlIHRyYW5zZmVycmVkIHVzaW5nIG11bHRpcGxlIHRyYW5zYWN0aW9ucyAoZGVmYXVsdCB0cnVlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+fSB0aGUgY3JlYXRlZCB0cmFuc2FjdGlvbnNcbiAgICovXG4gIGFzeW5jIGNyZWF0ZVR4cyhjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN3ZWVwIGFuIG91dHB1dCBieSBrZXkgaW1hZ2UuXG4gICAqIFxuICAgKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvVHhDb25maWc+fSBjb25maWcgLSBjb25maWd1cmVzIHRoZSB0cmFuc2FjdGlvbiB0byBjcmVhdGUgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmFkZHJlc3MgLSBzaW5nbGUgZGVzdGluYXRpb24gYWRkcmVzcyAocmVxdWlyZWQpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb25maWcua2V5SW1hZ2UgLSBrZXkgaW1hZ2UgdG8gc3dlZXAgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucmVsYXldIC0gcmVsYXkgdGhlIHRyYW5zYWN0aW9uIHRvIHBlZXJzIHRvIGNvbW1pdCB0byB0aGUgYmxvY2tjaGFpbiAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHBhcmFtIHtiaWdpbnR8c3RyaW5nfSBbY29uZmlnLnVubG9ja1RpbWVdIC0gbWluaW11bSBoZWlnaHQgb3IgdGltZXN0YW1wIGZvciB0aGUgdHJhbnNhY3Rpb24gdG8gdW5sb2NrIChkZWZhdWx0IDApXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhQcmlvcml0eX0gW2NvbmZpZy5wcmlvcml0eV0gLSB0cmFuc2FjdGlvbiBwcmlvcml0eSAoZGVmYXVsdCBNb25lcm9UeFByaW9yaXR5Lk5PUk1BTClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldD59IHRoZSBjcmVhdGVkIHRyYW5zYWN0aW9uXG4gICAqL1xuICBhc3luYyBzd2VlcE91dHB1dChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogU3dlZXAgYWxsIHVubG9ja2VkIGZ1bmRzIGFjY29yZGluZyB0byB0aGUgZ2l2ZW4gY29uZmlndXJhdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9UeENvbmZpZz59IGNvbmZpZyAtIGNvbmZpZ3VyZXMgdGhlIHRyYW5zYWN0aW9ucyB0byBjcmVhdGUgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmFkZHJlc3MgLSBzaW5nbGUgZGVzdGluYXRpb24gYWRkcmVzcyAocmVxdWlyZWQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLmFjY291bnRJbmRleF0gLSBzb3VyY2UgYWNjb3VudCBpbmRleCB0byBzd2VlcCBmcm9tIChvcHRpb25hbCwgZGVmYXVsdHMgdG8gYWxsIGFjY291bnRzKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy5zdWJhZGRyZXNzSW5kZXhdIC0gc291cmNlIHN1YmFkZHJlc3MgaW5kZXggdG8gc3dlZXAgZnJvbSAob3B0aW9uYWwsIGRlZmF1bHRzIHRvIGFsbCBzdWJhZGRyZXNzZXMpXG4gICAqIEBwYXJhbSB7bnVtYmVyW119IFtjb25maWcuc3ViYWRkcmVzc0luZGljZXNdIC0gc291cmNlIHN1YmFkZHJlc3MgaW5kaWNlcyB0byBzd2VlcCBmcm9tIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnJlbGF5XSAtIHJlbGF5IHRoZSB0cmFuc2FjdGlvbnMgdG8gcGVlcnMgdG8gY29tbWl0IHRvIHRoZSBibG9ja2NoYWluIChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UHJpb3JpdHl9IFtjb25maWcucHJpb3JpdHldIC0gdHJhbnNhY3Rpb24gcHJpb3JpdHkgKGRlZmF1bHQgTW9uZXJvVHhQcmlvcml0eS5OT1JNQUwpXG4gICAqIEBwYXJhbSB7YmlnaW50fHN0cmluZ30gW2NvbmZpZy51bmxvY2tUaW1lXSAtIG1pbmltdW0gaGVpZ2h0IG9yIHRpbWVzdGFtcCBmb3IgdGhlIHRyYW5zYWN0aW9ucyB0byB1bmxvY2sgKGRlZmF1bHQgMClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnN3ZWVwRWFjaFN1YmFkZHJlc3NdIC0gc3dlZXAgZWFjaCBzdWJhZGRyZXNzIGluZGl2aWR1YWxseSBpZiB0cnVlIChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+fSB0aGUgY3JlYXRlZCB0cmFuc2FjdGlvbnNcbiAgICovXG4gIGFzeW5jIHN3ZWVwVW5sb2NrZWQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5Td2VlcCBhbGwgdW5taXhhYmxlIGR1c3Qgb3V0cHV0cyBiYWNrIHRvIHRoZSB3YWxsZXQgdG8gbWFrZSB0aGVtIGVhc2llciB0byBzcGVuZCBhbmQgbWl4LjwvcD5cbiAgICogXG4gICAqIDxwPk5PVEU6IER1c3Qgb25seSBleGlzdHMgcHJlIFJDVCwgc28gdGhpcyBtZXRob2Qgd2lsbCB0aHJvdyBcIm5vIGR1c3QgdG8gc3dlZXBcIiBvbiBuZXcgd2FsbGV0cy48L3A+XG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtyZWxheV0gLSBzcGVjaWZpZXMgaWYgdGhlIHJlc3VsdGluZyB0cmFuc2FjdGlvbiBzaG91bGQgYmUgcmVsYXllZCAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPn0gdGhlIGNyZWF0ZWQgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBzd2VlcER1c3QocmVsYXk/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJlbGF5IGEgcHJldmlvdXNseSBjcmVhdGVkIHRyYW5zYWN0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHsoTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpfSB0eE9yTWV0YWRhdGEgLSB0cmFuc2FjdGlvbiBvciBpdHMgbWV0YWRhdGEgdG8gcmVsYXlcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgaGFzaCBvZiB0aGUgcmVsYXllZCB0eFxuICAgKi9cbiAgYXN5bmMgcmVsYXlUeCh0eE9yTWV0YWRhdGE6IE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMucmVsYXlUeHMoW3R4T3JNZXRhZGF0YV0pKVswXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJlbGF5IHByZXZpb3VzbHkgY3JlYXRlZCB0cmFuc2FjdGlvbnMuXG4gICAqIFxuICAgKiBAcGFyYW0geyhNb25lcm9UeFdhbGxldFtdIHwgc3RyaW5nW10pfSB0eHNPck1ldGFkYXRhcyAtIHRyYW5zYWN0aW9ucyBvciB0aGVpciBtZXRhZGF0YSB0byByZWxheVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZ1tdPn0gdGhlIGhhc2hlcyBvZiB0aGUgcmVsYXllZCB0eHNcbiAgICovXG4gIGFzeW5jIHJlbGF5VHhzKHR4c09yTWV0YWRhdGFzOiAoTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlc2NyaWJlIGEgdHggc2V0IGZyb20gdW5zaWduZWQgdHggaGV4LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVuc2lnbmVkVHhIZXggLSB1bnNpZ25lZCB0eCBoZXhcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFNldD59IHRoZSB0eCBzZXQgY29udGFpbmluZyBzdHJ1Y3R1cmVkIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgZGVzY3JpYmVVbnNpZ25lZFR4U2V0KHVuc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICByZXR1cm4gdGhpcy5kZXNjcmliZVR4U2V0KG5ldyBNb25lcm9UeFNldCgpLnNldFVuc2lnbmVkVHhIZXgodW5zaWduZWRUeEhleCkpO1xuICB9XG4gIFxuICAvKipcbiAgICogRGVzY3JpYmUgYSB0eCBzZXQgZnJvbSBtdWx0aXNpZyB0eCBoZXguXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbXVsdGlzaWdUeEhleCAtIG11bHRpc2lnIHR4IGhleFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4U2V0Pn0gdGhlIHR4IHNldCBjb250YWluaW5nIHN0cnVjdHVyZWQgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBkZXNjcmliZU11bHRpc2lnVHhTZXQobXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIHJldHVybiB0aGlzLmRlc2NyaWJlVHhTZXQobmV3IE1vbmVyb1R4U2V0KCkuc2V0TXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4KSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZXNjcmliZSBhIHR4IHNldCBjb250YWluaW5nIHVuc2lnbmVkIG9yIG11bHRpc2lnIHR4IGhleCB0byBhIG5ldyB0eCBzZXQgY29udGFpbmluZyBzdHJ1Y3R1cmVkIHRyYW5zYWN0aW9ucy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhTZXR9IHR4U2V0IC0gYSB0eCBzZXQgY29udGFpbmluZyB1bnNpZ25lZCBvciBtdWx0aXNpZyB0eCBoZXhcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFNldD59IHR4U2V0IC0gdGhlIHR4IHNldCBjb250YWluaW5nIHN0cnVjdHVyZWQgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0OiBNb25lcm9UeFNldCk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2lnbiB1bnNpZ25lZCB0cmFuc2FjdGlvbnMgZnJvbSBhIHZpZXctb25seSB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdW5zaWduZWRUeEhleCAtIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGhleCBmcm9tIHdoZW4gdGhlIHRyYW5zYWN0aW9ucyB3ZXJlIGNyZWF0ZWRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFNldD59IHRoZSBzaWduZWQgdHJhbnNhY3Rpb24gc2V0XG4gICAqL1xuICBhc3luYyBzaWduVHhzKHVuc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3VibWl0IHNpZ25lZCB0cmFuc2FjdGlvbnMgZnJvbSBhIHZpZXctb25seSB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2lnbmVkVHhIZXggLSBzaWduZWQgdHJhbnNhY3Rpb24gaGV4IGZyb20gc2lnblR4cygpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nW10+fSB0aGUgcmVzdWx0aW5nIHRyYW5zYWN0aW9uIGhhc2hlc1xuICAgKi9cbiAgYXN5bmMgc3VibWl0VHhzKHNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNpZ24gYSBtZXNzYWdlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSB0aGUgbWVzc2FnZSB0byBzaWduXG4gICAqIEBwYXJhbSB7TW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGV9IFtzaWduYXR1cmVUeXBlXSAtIHNpZ24gd2l0aCBzcGVuZCBrZXkgb3IgdmlldyBrZXkgKGRlZmF1bHQgc3BlbmQga2V5KVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2FjY291bnRJZHhdIC0gdGhlIGFjY291bnQgaW5kZXggb2YgdGhlIG1lc3NhZ2Ugc2lnbmF0dXJlIChkZWZhdWx0IDApXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3ViYWRkcmVzc0lkeF0gLSB0aGUgc3ViYWRkcmVzcyBpbmRleCBvZiB0aGUgbWVzc2FnZSBzaWduYXR1cmUgKGRlZmF1bHQgMClcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgc2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIHNpZ25hdHVyZVR5cGUgPSBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZLCBhY2NvdW50SWR4ID0gMCwgc3ViYWRkcmVzc0lkeCA9IDApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBWZXJpZnkgYSBzaWduYXR1cmUgb24gYSBtZXNzYWdlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBzaWduZWQgbWVzc2FnZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIHNpZ25pbmcgYWRkcmVzc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gc2lnbmF0dXJlIC0gc2lnbmF0dXJlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdD59IHRydWUgaWYgdGhlIHNpZ25hdHVyZSBpcyBnb29kLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIHZlcmlmeU1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIHRyYW5zYWN0aW9uJ3Mgc2VjcmV0IGtleSBmcm9tIGl0cyBoYXNoLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIHRyYW5zYWN0aW9uJ3MgaGFzaFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IC0gdHJhbnNhY3Rpb24ncyBzZWNyZXQga2V5XG4gICAqL1xuICBhc3luYyBnZXRUeEtleSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENoZWNrIGEgdHJhbnNhY3Rpb24gaW4gdGhlIGJsb2NrY2hhaW4gd2l0aCBpdHMgc2VjcmV0IGtleS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSB0cmFuc2FjdGlvbiB0byBjaGVja1xuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhLZXkgLSB0cmFuc2FjdGlvbidzIHNlY3JldCBrZXlcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBkZXN0aW5hdGlvbiBwdWJsaWMgYWRkcmVzcyBvZiB0aGUgdHJhbnNhY3Rpb25cbiAgICogQHJldHVybiB7cm9taXNlPE1vbmVyb0NoZWNrVHg+fSB0aGUgcmVzdWx0IG9mIHRoZSBjaGVja1xuICAgKi9cbiAgYXN5bmMgY2hlY2tUeEtleSh0eEhhc2g6IHN0cmluZywgdHhLZXk6IHN0cmluZywgYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIHRyYW5zYWN0aW9uIHNpZ25hdHVyZSB0byBwcm92ZSBpdC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSB0cmFuc2FjdGlvbiB0byBwcm92ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIGRlc3RpbmF0aW9uIHB1YmxpYyBhZGRyZXNzIG9mIHRoZSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gW21lc3NhZ2VdIC0gbWVzc2FnZSB0byBpbmNsdWRlIHdpdGggdGhlIHNpZ25hdHVyZSB0byBmdXJ0aGVyIGF1dGhlbnRpY2F0ZSB0aGUgcHJvb2YgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB0cmFuc2FjdGlvbiBzaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIGdldFR4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFByb3ZlIGEgdHJhbnNhY3Rpb24gYnkgY2hlY2tpbmcgaXRzIHNpZ25hdHVyZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSB0cmFuc2FjdGlvbiB0byBwcm92ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIGRlc3RpbmF0aW9uIHB1YmxpYyBhZGRyZXNzIG9mIHRoZSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge3N0cmluZyB8IHVuZGVmaW5lZH0gbWVzc2FnZSAtIG1lc3NhZ2UgaW5jbHVkZWQgd2l0aCB0aGUgc2lnbmF0dXJlIHRvIGZ1cnRoZXIgYXV0aGVudGljYXRlIHRoZSBwcm9vZlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2lnbmF0dXJlICAtIHRyYW5zYWN0aW9uIHNpZ25hdHVyZSB0byBjb25maXJtXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQ2hlY2tUeD59IHRoZSByZXN1bHQgb2YgdGhlIGNoZWNrXG4gICAqL1xuICBhc3luYyBjaGVja1R4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhIHNpZ25hdHVyZSB0byBwcm92ZSBhIHNwZW5kLiBVbmxpa2UgcHJvdmluZyBhIHRyYW5zYWN0aW9uLCBpdCBkb2VzIG5vdCByZXF1aXJlIHRoZSBkZXN0aW5hdGlvbiBwdWJsaWMgYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSB0cmFuc2FjdGlvbiB0byBwcm92ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW21lc3NhZ2VdIC0gbWVzc2FnZSB0byBpbmNsdWRlIHdpdGggdGhlIHNpZ25hdHVyZSB0byBmdXJ0aGVyIGF1dGhlbnRpY2F0ZSB0aGUgcHJvb2YgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB0cmFuc2FjdGlvbiBzaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIGdldFNwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBQcm92ZSBhIHNwZW5kIHVzaW5nIGEgc2lnbmF0dXJlLiBVbmxpa2UgcHJvdmluZyBhIHRyYW5zYWN0aW9uLCBpdCBkb2VzIG5vdCByZXF1aXJlIHRoZSBkZXN0aW5hdGlvbiBwdWJsaWMgYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSB0cmFuc2FjdGlvbiB0byBwcm92ZVxuICAgKiBAcGFyYW0ge3N0cmluZyB8IHVuZGVmaW5lZH0gbWVzc2FnZSAtIG1lc3NhZ2UgaW5jbHVkZWQgd2l0aCB0aGUgc2lnbmF0dXJlIHRvIGZ1cnRoZXIgYXV0aGVudGljYXRlIHRoZSBwcm9vZiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzaWduYXR1cmUgLSB0cmFuc2FjdGlvbiBzaWduYXR1cmUgdG8gY29uZmlybVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSBzaWduYXR1cmUgaXMgZ29vZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBjaGVja1NwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2VuZXJhdGUgYSBzaWduYXR1cmUgdG8gcHJvdmUgdGhlIGVudGlyZSBiYWxhbmNlIG9mIHRoZSB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW21lc3NhZ2VdIC0gbWVzc2FnZSBpbmNsdWRlZCB3aXRoIHRoZSBzaWduYXR1cmUgdG8gZnVydGhlciBhdXRoZW50aWNhdGUgdGhlIHByb29mIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgcmVzZXJ2ZSBwcm9vZiBzaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2VuZXJhdGUgYSBzaWduYXR1cmUgdG8gcHJvdmUgYW4gYXZhaWxhYmxlIGFtb3VudCBpbiBhbiBhY2NvdW50LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFjY291bnRJZHggLSBhY2NvdW50IHRvIHByb3ZlIG93bmVyc2hpcCBvZiB0aGUgYW1vdW50XG4gICAqIEBwYXJhbSB7YmlnaW50fSBhbW91bnQgLSBtaW5pbXVtIGFtb3VudCB0byBwcm92ZSBhcyBhdmFpbGFibGUgaW4gdGhlIGFjY291bnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFttZXNzYWdlXSAtIG1lc3NhZ2UgdG8gaW5jbHVkZSB3aXRoIHRoZSBzaWduYXR1cmUgdG8gZnVydGhlciBhdXRoZW50aWNhdGUgdGhlIHByb29mIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgcmVzZXJ2ZSBwcm9vZiBzaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBhbW91bnQ6IGJpZ2ludCwgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm92ZXMgYSB3YWxsZXQgaGFzIGEgZGlzcG9zYWJsZSByZXNlcnZlIHVzaW5nIGEgc2lnbmF0dXJlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBwdWJsaWMgd2FsbGV0IGFkZHJlc3NcbiAgICogQHBhcmFtIHtzdHJpbmcgfCB1bmRlZmluZWR9IG1lc3NhZ2UgLSBtZXNzYWdlIGluY2x1ZGVkIHdpdGggdGhlIHNpZ25hdHVyZSB0byBmdXJ0aGVyIGF1dGhlbnRpY2F0ZSB0aGUgcHJvb2YgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2lnbmF0dXJlIC0gcmVzZXJ2ZSBwcm9vZiBzaWduYXR1cmUgdG8gY2hlY2tcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9DaGVja1Jlc2VydmU+fSB0aGUgcmVzdWx0IG9mIGNoZWNraW5nIHRoZSBzaWduYXR1cmUgcHJvb2ZcbiAgICovXG4gIGFzeW5jIGNoZWNrUmVzZXJ2ZVByb29mKGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tSZXNlcnZlPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIHRyYW5zYWN0aW9uIG5vdGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gdHJhbnNhY3Rpb24gdG8gZ2V0IHRoZSBub3RlIG9mXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHR4IG5vdGVcbiAgICovXG4gIGFzeW5jIGdldFR4Tm90ZSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldFR4Tm90ZXMoW3R4SGFzaF0pKVswXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBub3RlcyBmb3IgbXVsdGlwbGUgdHJhbnNhY3Rpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gdHhIYXNoZXMgLSBoYXNoZXMgb2YgdGhlIHRyYW5zYWN0aW9ucyB0byBnZXQgbm90ZXMgZm9yXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nW10+fSBub3RlcyBmb3IgdGhlIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgZ2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCBhIG5vdGUgZm9yIGEgc3BlY2lmaWMgdHJhbnNhY3Rpb24uXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gaGFzaCBvZiB0aGUgdHJhbnNhY3Rpb24gdG8gc2V0IGEgbm90ZSBmb3JcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5vdGUgLSB0aGUgdHJhbnNhY3Rpb24gbm90ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nLCBub3RlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnNldFR4Tm90ZXMoW3R4SGFzaF0sIFtub3RlXSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgbm90ZXMgZm9yIG11bHRpcGxlIHRyYW5zYWN0aW9ucy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IHR4SGFzaGVzIC0gdHJhbnNhY3Rpb25zIHRvIHNldCBub3RlcyBmb3JcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gbm90ZXMgLSBub3RlcyB0byBzZXQgZm9yIHRoZSB0cmFuc2FjdGlvbnNcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdLCBub3Rlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGFkZHJlc3MgYm9vayBlbnRyaWVzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJbXX0gW2VudHJ5SW5kaWNlc10gLSBpbmRpY2VzIG9mIHRoZSBlbnRyaWVzIHRvIGdldFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0FkZHJlc3NCb29rRW50cnlbXT59IHRoZSBhZGRyZXNzIGJvb2sgZW50cmllc1xuICAgKi9cbiAgYXN5bmMgZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcz86IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9BZGRyZXNzQm9va0VudHJ5W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQWRkIGFuIGFkZHJlc3MgYm9vayBlbnRyeS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gZW50cnkgYWRkcmVzc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gW2Rlc2NyaXB0aW9uXSAtIGVudHJ5IGRlc2NyaXB0aW9uIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB0aGUgaW5kZXggb2YgdGhlIGFkZGVkIGVudHJ5XG4gICAqL1xuICBhc3luYyBhZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3M6IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBFZGl0IGFuIGFkZHJlc3MgYm9vayBlbnRyeS5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCAtIGluZGV4IG9mIHRoZSBhZGRyZXNzIGJvb2sgZW50cnkgdG8gZWRpdFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNldEFkZHJlc3MgLSBzcGVjaWZpZXMgaWYgdGhlIGFkZHJlc3Mgc2hvdWxkIGJlIHVwZGF0ZWRcbiAgICogQHBhcmFtIHtzdHJpbmcgfCB1bmRlZmluZWR9IGFkZHJlc3MgLSB1cGRhdGVkIGFkZHJlc3NcbiAgICogQHBhcmFtIHtib29sZWFufSBzZXREZXNjcmlwdGlvbiAtIHNwZWNpZmllcyBpZiB0aGUgZGVzY3JpcHRpb24gc2hvdWxkIGJlIHVwZGF0ZWRcbiAgICogQHBhcmFtIHtzdHJpbmcgfCB1bmRlZmluZWR9IGRlc2NyaXB0aW9uIC0gdXBkYXRlZCBkZXNjcmlwdGlvblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgZWRpdEFkZHJlc3NCb29rRW50cnkoaW5kZXg6IG51bWJlciwgc2V0QWRkcmVzczogYm9vbGVhbiwgYWRkcmVzczogc3RyaW5nIHwgdW5kZWZpbmVkLCBzZXREZXNjcmlwdGlvbjogYm9vbGVhbiwgZGVzY3JpcHRpb246IHN0cmluZyB8IHVuZGVmaW5lZCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gYWRkcmVzcyBib29rIGVudHJ5LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGVudHJ5SWR4IC0gaW5kZXggb2YgdGhlIGVudHJ5IHRvIGRlbGV0ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFRhZyBhY2NvdW50cy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgLSB0YWcgdG8gYXBwbHkgdG8gdGhlIHNwZWNpZmllZCBhY2NvdW50c1xuICAgKiBAcGFyYW0ge251bWJlcltdfSBhY2NvdW50SW5kaWNlcyAtIGluZGljZXMgb2YgdGhlIGFjY291bnRzIHRvIHRhZ1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgdGFnQWNjb3VudHModGFnOiBzdHJpbmcsIGFjY291bnRJbmRpY2VzOiBudW1iZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogVW50YWcgYWNjb3VudHMuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcltdfSBhY2NvdW50SW5kaWNlcyAtIGluZGljZXMgb2YgdGhlIGFjY291bnRzIHRvIHVudGFnXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyB1bnRhZ0FjY291bnRzKGFjY291bnRJbmRpY2VzOiBudW1iZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZXR1cm4gYWxsIGFjY291bnQgdGFncy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQWNjb3VudFRhZ1tdPn0gdGhlIHdhbGxldCdzIGFjY291bnQgdGFnc1xuICAgKi9cbiAgYXN5bmMgZ2V0QWNjb3VudFRhZ3MoKTogUHJvbWlzZTxNb25lcm9BY2NvdW50VGFnW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBodW1hbi1yZWFkYWJsZSBkZXNjcmlwdGlvbiBmb3IgYSB0YWcuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIC0gdGFnIHRvIHNldCBhIGRlc2NyaXB0aW9uIGZvclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbGFiZWwgLSBsYWJlbCB0byBzZXQgZm9yIHRoZSB0YWdcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldEFjY291bnRUYWdMYWJlbCh0YWc6IHN0cmluZywgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcGF5bWVudCBVUkkgZnJvbSBhIHNlbmQgY29uZmlndXJhdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhDb25maWd9IGNvbmZpZyAtIHNwZWNpZmllcyBjb25maWd1cmF0aW9uIGZvciBhIHBvdGVudGlhbCB0eFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSBwYXltZW50IHVyaVxuICAgKi9cbiAgYXN5bmMgZ2V0UGF5bWVudFVyaShjb25maWc6IE1vbmVyb1R4Q29uZmlnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogUGFyc2VzIGEgcGF5bWVudCBVUkkgdG8gYSB0eCBjb25maWcuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXJpIC0gcGF5bWVudCB1cmkgdG8gcGFyc2VcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeENvbmZpZz59IHRoZSBzZW5kIGNvbmZpZ3VyYXRpb24gcGFyc2VkIGZyb20gdGhlIHVyaVxuICAgKi9cbiAgYXN5bmMgcGFyc2VQYXltZW50VXJpKHVyaTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeENvbmZpZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYW4gYXR0cmlidXRlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSAtIGF0dHJpYnV0ZSB0byBnZXQgdGhlIHZhbHVlIG9mXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIGF0dHJpYnV0ZSdzIHZhbHVlXG4gICAqL1xuICBhc3luYyBnZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgYW4gYXJiaXRyYXJ5IGF0dHJpYnV0ZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSBhdHRyaWJ1dGUga2V5XG4gICAqIEBwYXJhbSB7c3RyaW5nfSB2YWwgLSBhdHRyaWJ1dGUgdmFsdWVcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldEF0dHJpYnV0ZShrZXk6IHN0cmluZywgdmFsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3RhcnQgbWluaW5nLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtudW1UaHJlYWRzXSAtIG51bWJlciBvZiB0aHJlYWRzIGNyZWF0ZWQgZm9yIG1pbmluZyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2JhY2tncm91bmRNaW5pbmddIC0gc3BlY2lmaWVzIGlmIG1pbmluZyBzaG91bGQgb2NjdXIgaW4gdGhlIGJhY2tncm91bmQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpZ25vcmVCYXR0ZXJ5XSAtIHNwZWNpZmllcyBpZiB0aGUgYmF0dGVyeSBzaG91bGQgYmUgaWdub3JlZCBmb3IgbWluaW5nIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN0YXJ0TWluaW5nKG51bVRocmVhZHM6IG51bWJlciwgYmFja2dyb3VuZE1pbmluZz86IGJvb2xlYW4sIGlnbm9yZUJhdHRlcnk/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0b3AgbWluaW5nLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN0b3BNaW5pbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiBpbXBvcnRpbmcgbXVsdGlzaWcgZGF0YSBpcyBuZWVkZWQgZm9yIHJldHVybmluZyBhIGNvcnJlY3QgYmFsYW5jZS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgaW1wb3J0aW5nIG11bHRpc2lnIGRhdGEgaXMgbmVlZGVkIGZvciByZXR1cm5pbmcgYSBjb3JyZWN0IGJhbGFuY2UsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoaXMgd2FsbGV0IGlzIGEgbXVsdGlzaWcgd2FsbGV0LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGlzIGlzIGEgbXVsdGlzaWcgd2FsbGV0LCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzTXVsdGlzaWcoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldE11bHRpc2lnSW5mbygpKS5nZXRJc011bHRpc2lnKCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgbXVsdGlzaWcgaW5mbyBhYm91dCB0aGlzIHdhbGxldC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvTXVsdGlzaWdJbmZvPn0gbXVsdGlzaWcgaW5mbyBhYm91dCB0aGlzIHdhbGxldFxuICAgKi9cbiAgYXN5bmMgZ2V0TXVsdGlzaWdJbmZvKCk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbmZvPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBtdWx0aXNpZyBpbmZvIGFzIGhleCB0byBzaGFyZSB3aXRoIHBhcnRpY2lwYW50cyB0byBiZWdpbiBjcmVhdGluZyBhXG4gICAqIG11bHRpc2lnIHdhbGxldC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhpcyB3YWxsZXQncyBtdWx0aXNpZyBoZXggdG8gc2hhcmUgd2l0aCBwYXJ0aWNpcGFudHNcbiAgICovXG4gIGFzeW5jIHByZXBhcmVNdWx0aXNpZygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBNYWtlIHRoaXMgd2FsbGV0IG11bHRpc2lnIGJ5IGltcG9ydGluZyBtdWx0aXNpZyBoZXggZnJvbSBwYXJ0aWNpcGFudHMuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBtdWx0aXNpZ0hleGVzIC0gbXVsdGlzaWcgaGV4IGZyb20gZWFjaCBwYXJ0aWNpcGFudFxuICAgKiBAcGFyYW0ge251bWJlcn0gdGhyZXNob2xkIC0gbnVtYmVyIG9mIHNpZ25hdHVyZXMgbmVlZGVkIHRvIHNpZ24gdHJhbnNmZXJzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZCAtIHdhbGxldCBwYXNzd29yZFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoaXMgd2FsbGV0J3MgbXVsdGlzaWcgaGV4IHRvIHNoYXJlIHdpdGggcGFydGljaXBhbnRzXG4gICAqL1xuICBhc3luYyBtYWtlTXVsdGlzaWcobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHRocmVzaG9sZDogbnVtYmVyLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRXhjaGFuZ2UgbXVsdGlzaWcgaGV4IHdpdGggcGFydGljaXBhbnRzIGluIGEgTS9OIG11bHRpc2lnIHdhbGxldC5cbiAgICogXG4gICAqIFRoaXMgcHJvY2VzcyBtdXN0IGJlIHJlcGVhdGVkIHdpdGggcGFydGljaXBhbnRzIGV4YWN0bHkgTi1NIHRpbWVzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gbXVsdGlzaWdIZXhlcyBhcmUgbXVsdGlzaWcgaGV4IGZyb20gZWFjaCBwYXJ0aWNpcGFudFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGFzc3dvcmQgLSB3YWxsZXQncyBwYXNzd29yZCAvLyBUT0RPIG1vbmVyby1wcm9qZWN0OiByZWR1bmRhbnQ/IHdhbGxldCBpcyBjcmVhdGVkIHdpdGggcGFzc3dvcmRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+fSB0aGUgcmVzdWx0IHdoaWNoIGhhcyB0aGUgbXVsdGlzaWcncyBhZGRyZXNzIHhvciB0aGlzIHdhbGxldCdzIG11bHRpc2lnIGhleCB0byBzaGFyZSB3aXRoIHBhcnRpY2lwYW50cyBpZmYgbm90IGRvbmVcbiAgICovXG4gIGFzeW5jIGV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRXhwb3J0IHRoaXMgd2FsbGV0J3MgbXVsdGlzaWcgaW5mbyBhcyBoZXggZm9yIG90aGVyIHBhcnRpY2lwYW50cy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhpcyB3YWxsZXQncyBtdWx0aXNpZyBpbmZvIGFzIGhleCBmb3Igb3RoZXIgcGFydGljaXBhbnRzXG4gICAqL1xuICBhc3luYyBleHBvcnRNdWx0aXNpZ0hleCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWQ/XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogSW1wb3J0IG11bHRpc2lnIGluZm8gYXMgaGV4IGZyb20gb3RoZXIgcGFydGljaXBhbnRzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gbXVsdGlzaWdIZXhlcyAtIG11bHRpc2lnIGhleCBmcm9tIGVhY2ggcGFydGljaXBhbnRcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB0aGUgbnVtYmVyIG9mIG91dHB1dHMgc2lnbmVkIHdpdGggdGhlIGdpdmVuIG11bHRpc2lnIGhleFxuICAgKi9cbiAgYXN5bmMgaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlczogc3RyaW5nW10pOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTaWduIG11bHRpc2lnIHRyYW5zYWN0aW9ucyBmcm9tIGEgbXVsdGlzaWcgd2FsbGV0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG11bHRpc2lnVHhIZXggLSB1bnNpZ25lZCBtdWx0aXNpZyB0cmFuc2FjdGlvbnMgYXMgaGV4XG4gICAqIEByZXR1cm4ge01vbmVyb011bHRpc2lnU2lnblJlc3VsdH0gdGhlIHJlc3VsdCBvZiBzaWduaW5nIHRoZSBtdWx0aXNpZyB0cmFuc2FjdGlvbnNcbiAgICovXG4gIGFzeW5jIHNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN1Ym1pdCBzaWduZWQgbXVsdGlzaWcgdHJhbnNhY3Rpb25zIGZyb20gYSBtdWx0aXNpZyB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2lnbmVkTXVsdGlzaWdUeEhleCAtIHNpZ25lZCBtdWx0aXNpZyBoZXggcmV0dXJuZWQgZnJvbSBzaWduTXVsdGlzaWdUeEhleCgpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nW10+fSB0aGUgcmVzdWx0aW5nIHRyYW5zYWN0aW9uIGhhc2hlc1xuICAgKi9cbiAgYXN5bmMgc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENoYW5nZSB0aGUgd2FsbGV0IHBhc3N3b3JkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9sZFBhc3N3b3JkIC0gdGhlIHdhbGxldCdzIG9sZCBwYXNzd29yZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3UGFzc3dvcmQgLSB0aGUgd2FsbGV0J3MgbmV3IHBhc3N3b3JkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBjaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZDogc3RyaW5nLCBuZXdQYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNhdmUgdGhlIHdhbGxldCBhdCBpdHMgY3VycmVudCBwYXRoLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNhdmUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc2F2ZSB0aGVuIGNsb3NlIHRoZSB3YWxsZXQuXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3NhdmVdIC0gc3BlY2lmaWVzIGlmIHRoZSB3YWxsZXQgc2hvdWxkIGJlIHNhdmVkIGJlZm9yZSBiZWluZyBjbG9zZWQgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBjbG9zZShzYXZlID0gZmFsc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25uZWN0aW9uTWFuYWdlcikgdGhpcy5jb25uZWN0aW9uTWFuYWdlci5yZW1vdmVMaXN0ZW5lcih0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIpO1xuICAgIHRoaXMuY29ubmVjdGlvbk1hbmFnZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5jb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyID0gdW5kZWZpbmVkO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoaXMgd2FsbGV0IGlzIGNsb3NlZCBvciBub3QuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSB3YWxsZXQgaXMgY2xvc2VkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzQ2xvc2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZVR4UXVlcnkocXVlcnkpIHtcbiAgICBpZiAocXVlcnkgaW5zdGFuY2VvZiBNb25lcm9UeFF1ZXJ5KSBxdWVyeSA9IHF1ZXJ5LmNvcHkoKTtcbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KHF1ZXJ5KSkgcXVlcnkgPSBuZXcgTW9uZXJvVHhRdWVyeSgpLnNldEhhc2hlcyhxdWVyeSk7XG4gICAgZWxzZSB7XG4gICAgICBxdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5KTtcbiAgICAgIHF1ZXJ5ID0gbmV3IE1vbmVyb1R4UXVlcnkocXVlcnkpO1xuICAgIH1cbiAgICBpZiAocXVlcnkuZ2V0QmxvY2soKSA9PT0gdW5kZWZpbmVkKSBxdWVyeS5zZXRCbG9jayhuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW3F1ZXJ5XSkpO1xuICAgIGlmIChxdWVyeS5nZXRJbnB1dFF1ZXJ5KCkpIHF1ZXJ5LmdldElucHV0UXVlcnkoKS5zZXRUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnkuZ2V0T3V0cHV0UXVlcnkoKSkgcXVlcnkuZ2V0T3V0cHV0UXVlcnkoKS5zZXRUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICByZXR1cm4gcXVlcnk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgbm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSkge1xuICAgIHF1ZXJ5ID0gbmV3IE1vbmVyb1RyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHR4UXVlcnkgPSBxdWVyeS5nZXRUeFF1ZXJ5KCkuY29weSgpO1xuICAgICAgcXVlcnkgPSB0eFF1ZXJ5LmdldFRyYW5zZmVyUXVlcnkoKTtcbiAgICB9XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKSA9PT0gdW5kZWZpbmVkKSBxdWVyeS5zZXRUeFF1ZXJ5KG5ldyBNb25lcm9UeFF1ZXJ5KCkpO1xuICAgIHF1ZXJ5LmdldFR4UXVlcnkoKS5zZXRUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkgPT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0VHhRdWVyeSgpLnNldEJsb2NrKG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbcXVlcnkuZ2V0VHhRdWVyeSgpXSkpO1xuICAgIHJldHVybiBxdWVyeTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVPdXRwdXRRdWVyeShxdWVyeSkge1xuICAgIHF1ZXJ5ID0gbmV3IE1vbmVyb091dHB1dFF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCB0eFF1ZXJ5ID0gcXVlcnkuZ2V0VHhRdWVyeSgpLmNvcHkoKTtcbiAgICAgIHF1ZXJ5ID0gdHhRdWVyeS5nZXRPdXRwdXRRdWVyeSgpO1xuICAgIH1cbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpID09PSB1bmRlZmluZWQpIHF1ZXJ5LnNldFR4UXVlcnkobmV3IE1vbmVyb1R4UXVlcnkoKSk7XG4gICAgcXVlcnkuZ2V0VHhRdWVyeSgpLnNldE91dHB1dFF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkgPT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0VHhRdWVyeSgpLnNldEJsb2NrKG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbcXVlcnkuZ2V0VHhRdWVyeSgpXSkpO1xuICAgIHJldHVybiBxdWVyeTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkIHx8ICEoY29uZmlnIGluc3RhbmNlb2YgT2JqZWN0KSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIE1vbmVyb1R4Q29uZmlnIG9yIGVxdWl2YWxlbnQgSlMgb2JqZWN0XCIpO1xuICAgIGNvbmZpZyA9IG5ldyBNb25lcm9UeENvbmZpZyhjb25maWcpO1xuICAgIGFzc2VydChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkgJiYgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCA+IDAsIFwiTXVzdCBwcm92aWRlIGRlc3RpbmF0aW9uc1wiKTtcbiAgICBhc3NlcnQuZXF1YWwoY29uZmlnLmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSwgdW5kZWZpbmVkKTtcbiAgICBhc3NlcnQuZXF1YWwoY29uZmlnLmdldEJlbG93QW1vdW50KCksIHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIGNvbmZpZztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyhjb25maWcpIHtcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQgfHwgIShjb25maWcgaW5zdGFuY2VvZiBPYmplY3QpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgTW9uZXJvVHhDb25maWcgb3IgZXF1aXZhbGVudCBKUyBvYmplY3RcIik7XG4gICAgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbmZpZy5nZXRTd2VlcEVhY2hTdWJhZGRyZXNzKCksIHVuZGVmaW5lZCk7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbmZpZy5nZXRCZWxvd0Ftb3VudCgpLCB1bmRlZmluZWQpO1xuICAgIGFzc2VydC5lcXVhbChjb25maWcuZ2V0Q2FuU3BsaXQoKSwgdW5kZWZpbmVkLCBcIkNhbm5vdCBzcGxpdCB0cmFuc2FjdGlvbnMgd2hlbiBzd2VlcGluZyBhbiBvdXRwdXRcIik7XG4gICAgaWYgKCFjb25maWcuZ2V0RGVzdGluYXRpb25zKCkgfHwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCAhPT0gMSB8fCAhY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGV4YWN0bHkgb25lIGRlc3RpbmF0aW9uIGFkZHJlc3MgdG8gc3dlZXAgb3V0cHV0IHRvXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkgJiYgY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpLmxlbmd0aCA+IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN3ZWVwIHRyYW5zYWN0aW9ucyBkbyBub3Qgc3VwcG9ydCBzdWJ0cmFjdGluZyBmZWVzIGZyb20gZGVzdGluYXRpb25zXCIpO1xuICAgIHJldHVybiBjb25maWc7ICBcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnKGNvbmZpZykge1xuICAgIGlmIChjb25maWcgPT09IHVuZGVmaW5lZCB8fCAhKGNvbmZpZyBpbnN0YW5jZW9mIE9iamVjdCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBNb25lcm9UeENvbmZpZyBvciBlcXVpdmFsZW50IEpTIG9iamVjdFwiKTtcbiAgICBjb25maWcgPSBuZXcgTW9uZXJvVHhDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCAhPSAxKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZXhhY3RseSBvbmUgZGVzdGluYXRpb24gdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGRlc3RpbmF0aW9uIGFkZHJlc3MgdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBhbW91bnQgaW4gc3dlZXAgY29uZmlnXCIpO1xuICAgIGlmIChjb25maWcuZ2V0S2V5SW1hZ2UoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJLZXkgaW1hZ2UgZGVmaW5lZDsgdXNlIHN3ZWVwT3V0cHV0KCkgdG8gc3dlZXAgYW4gb3V0cHV0IGJ5IGl0cyBrZXkgaW1hZ2VcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAwKSBjb25maWcuc2V0U3ViYWRkcmVzc0luZGljZXModW5kZWZpbmVkKTtcbiAgICBpZiAoY29uZmlnLmdldEFjY291bnRJbmRleCgpID09PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGFjY291bnQgaW5kZXggaWYgc3ViYWRkcmVzcyBpbmRpY2VzIGFyZSBwcm92aWRlZFwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpICYmIGNvbmZpZy5nZXRTdWJ0cmFjdEZlZUZyb20oKS5sZW5ndGggPiAwKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJTd2VlcCB0cmFuc2FjdGlvbnMgZG8gbm90IHN1cHBvcnQgc3VidHJhY3RpbmcgZmVlcyBmcm9tIGRlc3RpbmF0aW9uc1wiKTtcbiAgICByZXR1cm4gY29uZmlnO1xuICB9XG59XG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxPQUFBLEdBQUFDLHNC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