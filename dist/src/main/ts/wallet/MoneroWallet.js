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
   * @return {Promise<string>} the signed transaction hex
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIl9Nb25lcm9PdXRwdXRRdWVyeSIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJNb25lcm9XYWxsZXQiLCJERUZBVUxUX0xBTkdVQUdFIiwiY29uc3RydWN0b3IiLCJhZGRMaXN0ZW5lciIsImxpc3RlbmVyIiwiRXJyb3IiLCJyZW1vdmVMaXN0ZW5lciIsImdldExpc3RlbmVycyIsImlzVmlld09ubHkiLCJNb25lcm9FcnJvciIsInNldERhZW1vbkNvbm5lY3Rpb24iLCJ1cmlPckNvbm5lY3Rpb24iLCJnZXREYWVtb25Db25uZWN0aW9uIiwic2V0Q29ubmVjdGlvbk1hbmFnZXIiLCJjb25uZWN0aW9uTWFuYWdlciIsImNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIiLCJ0aGF0IiwiTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciIsIm9uQ29ubmVjdGlvbkNoYW5nZWQiLCJjb25uZWN0aW9uIiwiZ2V0Q29ubmVjdGlvbiIsImdldENvbm5lY3Rpb25NYW5hZ2VyIiwiaXNDb25uZWN0ZWRUb0RhZW1vbiIsImdldFZlcnNpb24iLCJnZXRQYXRoIiwiZ2V0U2VlZCIsImdldFNlZWRMYW5ndWFnZSIsImdldFByaXZhdGVWaWV3S2V5IiwiZ2V0UHJpdmF0ZVNwZW5kS2V5IiwiZ2V0UHVibGljVmlld0tleSIsImdldFB1YmxpY1NwZW5kS2V5IiwiZ2V0UHJpbWFyeUFkZHJlc3MiLCJnZXRBZGRyZXNzIiwiYWNjb3VudElkeCIsInN1YmFkZHJlc3NJZHgiLCJnZXRBZGRyZXNzSW5kZXgiLCJhZGRyZXNzIiwiZ2V0SW50ZWdyYXRlZEFkZHJlc3MiLCJzdGFuZGFyZEFkZHJlc3MiLCJwYXltZW50SWQiLCJkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyIsImludGVncmF0ZWRBZGRyZXNzIiwiZ2V0SGVpZ2h0IiwiZ2V0RGFlbW9uSGVpZ2h0IiwiZ2V0SGVpZ2h0QnlEYXRlIiwieWVhciIsIm1vbnRoIiwiZGF5Iiwic3luYyIsImxpc3RlbmVyT3JTdGFydEhlaWdodCIsInN0YXJ0SGVpZ2h0Iiwic3RhcnRTeW5jaW5nIiwic3luY1BlcmlvZEluTXMiLCJzdG9wU3luY2luZyIsInNjYW5UeHMiLCJ0eEhhc2hlcyIsInJlc2NhblNwZW50IiwicmVzY2FuQmxvY2tjaGFpbiIsImdldEJhbGFuY2UiLCJnZXRVbmxvY2tlZEJhbGFuY2UiLCJnZXROdW1CbG9ja3NUb1VubG9jayIsImJhbGFuY2UiLCJ1bmRlZmluZWQiLCJ1bmxvY2tlZEJhbGFuY2UiLCJ0eHMiLCJoZWlnaHQiLCJudW1CbG9ja3NUb05leHRVbmxvY2siLCJnZXRUeHMiLCJpc0xvY2tlZCIsInR4IiwibnVtQmxvY2tzVG9VbmxvY2siLCJNYXRoIiwibWF4IiwiZ2V0SXNDb25maXJtZWQiLCJnZXRVbmxvY2tUaW1lIiwibWluIiwibnVtQmxvY2tzVG9MYXN0VW5sb2NrIiwiZ2V0QWNjb3VudHMiLCJpbmNsdWRlU3ViYWRkcmVzc2VzIiwidGFnIiwiZ2V0QWNjb3VudCIsImNyZWF0ZUFjY291bnQiLCJsYWJlbCIsInNldEFjY291bnRMYWJlbCIsInNldFN1YmFkZHJlc3NMYWJlbCIsImdldFN1YmFkZHJlc3NlcyIsInN1YmFkZHJlc3NJbmRpY2VzIiwiZ2V0U3ViYWRkcmVzcyIsImFzc2VydCIsImNyZWF0ZVN1YmFkZHJlc3MiLCJnZXRUeCIsInR4SGFzaCIsImxlbmd0aCIsInF1ZXJ5IiwiZ2V0VHJhbnNmZXJzIiwiZ2V0SW5jb21pbmdUcmFuc2ZlcnMiLCJxdWVyeU5vcm1hbGl6ZWQiLCJub3JtYWxpemVUcmFuc2ZlclF1ZXJ5IiwiZ2V0SXNJbmNvbWluZyIsInNldElzSW5jb21pbmciLCJnZXRPdXRnb2luZ1RyYW5zZmVycyIsImdldElzT3V0Z29pbmciLCJzZXRJc091dGdvaW5nIiwiZ2V0T3V0cHV0cyIsImV4cG9ydE91dHB1dHMiLCJhbGwiLCJpbXBvcnRPdXRwdXRzIiwib3V0cHV0c0hleCIsImV4cG9ydEtleUltYWdlcyIsImltcG9ydEtleUltYWdlcyIsImtleUltYWdlcyIsImdldE5ld0tleUltYWdlc0Zyb21MYXN0SW1wb3J0IiwiZnJlZXplT3V0cHV0Iiwia2V5SW1hZ2UiLCJ0aGF3T3V0cHV0IiwiaXNPdXRwdXRGcm96ZW4iLCJjcmVhdGVUeCIsImNvbmZpZyIsImNvbmZpZ05vcm1hbGl6ZWQiLCJub3JtYWxpemVDcmVhdGVUeHNDb25maWciLCJnZXRDYW5TcGxpdCIsImVxdWFsIiwic2V0Q2FuU3BsaXQiLCJjcmVhdGVUeHMiLCJzd2VlcE91dHB1dCIsInN3ZWVwVW5sb2NrZWQiLCJzd2VlcER1c3QiLCJyZWxheSIsInJlbGF5VHgiLCJ0eE9yTWV0YWRhdGEiLCJyZWxheVR4cyIsInR4c09yTWV0YWRhdGFzIiwiZGVzY3JpYmVVbnNpZ25lZFR4U2V0IiwidW5zaWduZWRUeEhleCIsImRlc2NyaWJlVHhTZXQiLCJNb25lcm9UeFNldCIsInNldFVuc2lnbmVkVHhIZXgiLCJkZXNjcmliZU11bHRpc2lnVHhTZXQiLCJtdWx0aXNpZ1R4SGV4Iiwic2V0TXVsdGlzaWdUeEhleCIsInR4U2V0Iiwic2lnblR4cyIsInN1Ym1pdFR4cyIsInNpZ25lZFR4SGV4Iiwic2lnbk1lc3NhZ2UiLCJtZXNzYWdlIiwic2lnbmF0dXJlVHlwZSIsIk1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlIiwiU0lHTl9XSVRIX1NQRU5EX0tFWSIsInZlcmlmeU1lc3NhZ2UiLCJzaWduYXR1cmUiLCJnZXRUeEtleSIsImNoZWNrVHhLZXkiLCJ0eEtleSIsImdldFR4UHJvb2YiLCJjaGVja1R4UHJvb2YiLCJnZXRTcGVuZFByb29mIiwiY2hlY2tTcGVuZFByb29mIiwiZ2V0UmVzZXJ2ZVByb29mV2FsbGV0IiwiZ2V0UmVzZXJ2ZVByb29mQWNjb3VudCIsImFtb3VudCIsImNoZWNrUmVzZXJ2ZVByb29mIiwiZ2V0VHhOb3RlIiwiZ2V0VHhOb3RlcyIsInNldFR4Tm90ZSIsIm5vdGUiLCJzZXRUeE5vdGVzIiwibm90ZXMiLCJnZXRBZGRyZXNzQm9va0VudHJpZXMiLCJlbnRyeUluZGljZXMiLCJhZGRBZGRyZXNzQm9va0VudHJ5IiwiZGVzY3JpcHRpb24iLCJlZGl0QWRkcmVzc0Jvb2tFbnRyeSIsImluZGV4Iiwic2V0QWRkcmVzcyIsInNldERlc2NyaXB0aW9uIiwiZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeSIsImVudHJ5SWR4IiwidGFnQWNjb3VudHMiLCJhY2NvdW50SW5kaWNlcyIsInVudGFnQWNjb3VudHMiLCJnZXRBY2NvdW50VGFncyIsInNldEFjY291bnRUYWdMYWJlbCIsImdldFBheW1lbnRVcmkiLCJwYXJzZVBheW1lbnRVcmkiLCJ1cmkiLCJnZXRBdHRyaWJ1dGUiLCJrZXkiLCJzZXRBdHRyaWJ1dGUiLCJ2YWwiLCJzdGFydE1pbmluZyIsIm51bVRocmVhZHMiLCJiYWNrZ3JvdW5kTWluaW5nIiwiaWdub3JlQmF0dGVyeSIsInN0b3BNaW5pbmciLCJpc011bHRpc2lnSW1wb3J0TmVlZGVkIiwiaXNNdWx0aXNpZyIsImdldE11bHRpc2lnSW5mbyIsImdldElzTXVsdGlzaWciLCJwcmVwYXJlTXVsdGlzaWciLCJtYWtlTXVsdGlzaWciLCJtdWx0aXNpZ0hleGVzIiwidGhyZXNob2xkIiwicGFzc3dvcmQiLCJleGNoYW5nZU11bHRpc2lnS2V5cyIsImV4cG9ydE11bHRpc2lnSGV4IiwiaW1wb3J0TXVsdGlzaWdIZXgiLCJzaWduTXVsdGlzaWdUeEhleCIsInN1Ym1pdE11bHRpc2lnVHhIZXgiLCJzaWduZWRNdWx0aXNpZ1R4SGV4IiwiY2hhbmdlUGFzc3dvcmQiLCJvbGRQYXNzd29yZCIsIm5ld1Bhc3N3b3JkIiwic2F2ZSIsImNsb3NlIiwiaXNDbG9zZWQiLCJub3JtYWxpemVUeFF1ZXJ5IiwiTW9uZXJvVHhRdWVyeSIsImNvcHkiLCJBcnJheSIsImlzQXJyYXkiLCJzZXRIYXNoZXMiLCJPYmplY3QiLCJhc3NpZ24iLCJnZXRCbG9jayIsInNldEJsb2NrIiwiTW9uZXJvQmxvY2siLCJzZXRUeHMiLCJnZXRJbnB1dFF1ZXJ5Iiwic2V0VHhRdWVyeSIsImdldE91dHB1dFF1ZXJ5IiwiTW9uZXJvVHJhbnNmZXJRdWVyeSIsImdldFR4UXVlcnkiLCJ0eFF1ZXJ5IiwiZ2V0VHJhbnNmZXJRdWVyeSIsInNldFRyYW5zZmVyUXVlcnkiLCJub3JtYWxpemVPdXRwdXRRdWVyeSIsIk1vbmVyb091dHB1dFF1ZXJ5Iiwic2V0T3V0cHV0UXVlcnkiLCJNb25lcm9UeENvbmZpZyIsImdldERlc3RpbmF0aW9ucyIsImdldFN3ZWVwRWFjaFN1YmFkZHJlc3MiLCJnZXRCZWxvd0Ftb3VudCIsIm5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnIiwiZ2V0U3VidHJhY3RGZWVGcm9tIiwibm9ybWFsaXplU3dlZXBVbmxvY2tlZENvbmZpZyIsImdldEFtb3VudCIsImdldEtleUltYWdlIiwiZ2V0U3ViYWRkcmVzc0luZGljZXMiLCJzZXRTdWJhZGRyZXNzSW5kaWNlcyIsImdldEFjY291bnRJbmRleCIsImV4cG9ydHMiLCJkZWZhdWx0Il0sInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vdHMvd2FsbGV0L01vbmVyb1dhbGxldC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcbmltcG9ydCBHZW5VdGlscyBmcm9tIFwiLi4vY29tbW9uL0dlblV0aWxzXCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50XCI7XG5pbXBvcnQgTW9uZXJvQWNjb3VudFRhZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BY2NvdW50VGFnXCI7XG5pbXBvcnQgTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9BZGRyZXNzQm9va0VudHJ5XCI7XG5pbXBvcnQgTW9uZXJvQmxvY2sgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9CbG9ja1wiO1xuaW1wb3J0IE1vbmVyb0NoZWNrUmVzZXJ2ZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1Jlc2VydmVcIjtcbmltcG9ydCBNb25lcm9DaGVja1R4IGZyb20gXCIuL21vZGVsL01vbmVyb0NoZWNrVHhcIjtcbmltcG9ydCBNb25lcm9Db25uZWN0aW9uTWFuYWdlciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyXCI7XG5pbXBvcnQgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXJcIjtcbmltcG9ydCBNb25lcm9FcnJvciBmcm9tIFwiLi4vY29tbW9uL01vbmVyb0Vycm9yXCI7XG5pbXBvcnQgTW9uZXJvSW5jb21pbmdUcmFuc2ZlciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9JbmNvbWluZ1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW50ZWdyYXRlZEFkZHJlc3NcIjtcbmltcG9ydCBNb25lcm9LZXlJbWFnZSBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb0tleUltYWdlXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHRcIjtcbmltcG9ydCBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZVwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnSW5mbyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ0luZm9cIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnU2lnblJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvT3V0cHV0V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb091dHB1dFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb091dGdvaW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvT3V0Z29pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb1JwY0Nvbm5lY3Rpb24gZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9ScGNDb25uZWN0aW9uXCI7XG5pbXBvcnQgTW9uZXJvU3ViYWRkcmVzcyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TdWJhZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvU3luY1Jlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9TeW5jUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9UcmFuc2ZlclF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyUXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeENvbmZpZyBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeENvbmZpZ1wiO1xuaW1wb3J0IE1vbmVyb1R4UXVlcnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb1R4V2FsbGV0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4V2FsbGV0XCI7XG5pbXBvcnQgTW9uZXJvVHhTZXQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhTZXRcIjtcbmltcG9ydCBNb25lcm9WZXJzaW9uIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvVmVyc2lvblwiO1xuaW1wb3J0IE1vbmVyb1dhbGxldExpc3RlbmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1dhbGxldExpc3RlbmVyXCI7XG5cbi8qKlxuICogQ29weXJpZ2h0IChjKSB3b29kc2VyXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weVxuICogb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbFxuICogaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZyB3aXRob3V0IGxpbWl0YXRpb24gdGhlIHJpZ2h0c1xuICogdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbFxuICogY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzXG4gKiBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlIGZvbGxvd2luZyBjb25kaXRpb25zOlxuICpcbiAqIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkIGluIGFsbFxuICogY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SXG4gKiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSxcbiAqIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFIEFORCBOT05JTkZSSU5HRU1FTlQuIElOIE5PIEVWRU5UIFNIQUxMIFRIRVxuICogQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUlxuICogTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSxcbiAqIE9VVCBPRiBPUiBJTiBDT05ORUNUSU9OIFdJVEggVEhFIFNPRlRXQVJFIE9SIFRIRSBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFXG4gKiBTT0ZUV0FSRS5cbiAqL1xuXG4vKipcbiAqIE1vbmVybyB3YWxsZXQgaW50ZXJmYWNlIGFuZCBkZWZhdWx0IGltcGxlbWVudGF0aW9ucy5cbiAqIFxuICogQGludGVyZmFjZVxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBNb25lcm9XYWxsZXQge1xuXG4gIC8vIHN0YXRpYyB2YXJpYWJsZXNcbiAgc3RhdGljIHJlYWRvbmx5IERFRkFVTFRfTEFOR1VBR0UgPSBcIkVuZ2xpc2hcIjtcblxuICAvLyBzdGF0ZSB2YXJpYWJsZXNcbiAgcHJvdGVjdGVkIGNvbm5lY3Rpb25NYW5hZ2VyOiBNb25lcm9Db25uZWN0aW9uTWFuYWdlcjtcbiAgcHJvdGVjdGVkIGNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXI6IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXI7XG5cbiAgLyoqXG4gICAqIEhpZGRlbiBjb25zdHJ1Y3Rvci5cbiAgICogXG4gICAqIEBwcml2YXRlXG4gICAqL1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICAvLyBubyBjb2RlIG5lZWRlZFxuICB9XG4gIFxuICAvKipcbiAgICogUmVnaXN0ZXIgYSBsaXN0ZW5lciB0byByZWNlaXZlIHdhbGxldCBub3RpZmljYXRpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRMaXN0ZW5lcn0gbGlzdGVuZXIgLSBsaXN0ZW5lciB0byByZWNlaXZlIHdhbGxldCBub3RpZmljYXRpb25zXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBhZGRMaXN0ZW5lcihsaXN0ZW5lcjogTW9uZXJvV2FsbGV0TGlzdGVuZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogVW5yZWdpc3RlciBhIGxpc3RlbmVyIHRvIHJlY2VpdmUgd2FsbGV0IG5vdGlmaWNhdGlvbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1dhbGxldExpc3RlbmVyfSBsaXN0ZW5lciAtIGxpc3RlbmVyIHRvIHVucmVnaXN0ZXJcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgbGlzdGVuZXJzIHJlZ2lzdGVyZWQgd2l0aCB0aGUgd2FsbGV0LlxuICAgKiBcbiAgICogQHJldHVybiB7TW9uZXJvV2FsbGV0TGlzdGVuZXJbXX0gdGhlIHJlZ2lzdGVyZWQgbGlzdGVuZXJzXG4gICAqL1xuICBnZXRMaXN0ZW5lcnMoKTogTW9uZXJvV2FsbGV0TGlzdGVuZXJbXSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgd2FsbGV0IGlzIHZpZXctb25seSwgbWVhbmluZyBpdCBkb2VzIG5vdCBoYXZlIHRoZSBwcml2YXRlXG4gICAqIHNwZW5kIGtleSBhbmQgY2FuIHRoZXJlZm9yZSBvbmx5IG9ic2VydmUgaW5jb21pbmcgb3V0cHV0cy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIHdhbGxldCBpcyB2aWV3LW9ubHksIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNWaWV3T25seSgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvUnBjQ29ubmVjdGlvbiB8IHN0cmluZ30gW3VyaU9yQ29ubmVjdGlvbl0gLSBkYWVtb24ncyBVUkkgb3IgY29ubmVjdGlvbiAoZGVmYXVsdHMgdG8gb2ZmbGluZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldERhZW1vbkNvbm5lY3Rpb24odXJpT3JDb25uZWN0aW9uPzogTW9uZXJvUnBjQ29ubmVjdGlvbiB8IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9ScGNDb25uZWN0aW9uPn0gdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uXG4gICAqL1xuICBhc3luYyBnZXREYWVtb25Db25uZWN0aW9uKCk6IFByb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogU2V0IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvbiBtYW5hZ2VyLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9Db25uZWN0aW9uTWFuYWdlcn0gY29ubmVjdGlvbk1hbmFnZXIgbWFuYWdlcyBjb25uZWN0aW9ucyB0byBtb25lcm9kXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRDb25uZWN0aW9uTWFuYWdlcihjb25uZWN0aW9uTWFuYWdlcj86IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgaWYgKHRoaXMuY29ubmVjdGlvbk1hbmFnZXIpIHRoaXMuY29ubmVjdGlvbk1hbmFnZXIucmVtb3ZlTGlzdGVuZXIodGhpcy5jb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyKTtcbiAgICB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyID0gY29ubmVjdGlvbk1hbmFnZXI7XG4gICAgaWYgKCFjb25uZWN0aW9uTWFuYWdlcikgcmV0dXJuO1xuICAgIGxldCB0aGF0ID0gdGhpcztcbiAgICBpZiAoIXRoaXMuY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcikgdGhpcy5jb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyID0gbmV3IGNsYXNzIGV4dGVuZHMgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciB7XG4gICAgICBhc3luYyBvbkNvbm5lY3Rpb25DaGFuZ2VkKGNvbm5lY3Rpb246IE1vbmVyb1JwY0Nvbm5lY3Rpb24gfCB1bmRlZmluZWQpIHtcbiAgICAgICAgYXdhaXQgdGhhdC5zZXREYWVtb25Db25uZWN0aW9uKGNvbm5lY3Rpb24pO1xuICAgICAgfVxuICAgIH07XG4gICAgY29ubmVjdGlvbk1hbmFnZXIuYWRkTGlzdGVuZXIodGhpcy5jb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyKTtcbiAgICBhd2FpdCB0aGlzLnNldERhZW1vbkNvbm5lY3Rpb24oY29ubmVjdGlvbk1hbmFnZXIuZ2V0Q29ubmVjdGlvbigpKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uIG1hbmFnZXIuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyPn0gdGhlIHdhbGxldCdzIGRhZW1vbiBjb25uZWN0aW9uIG1hbmFnZXJcbiAgICovXG4gIGFzeW5jIGdldENvbm5lY3Rpb25NYW5hZ2VyKCk6IFByb21pc2U8TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI+IHtcbiAgICByZXR1cm4gdGhpcy5jb25uZWN0aW9uTWFuYWdlcjtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiB0aGUgd2FsbGV0IGlzIGNvbm5lY3RlZCB0byBkYWVtb24uXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSB3YWxsZXQgaXMgY29ubmVjdGVkIHRvIGEgZGFlbW9uLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzQ29ubmVjdGVkVG9EYWVtb24oKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldHMgdGhlIHZlcnNpb24gb2YgdGhlIHdhbGxldC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVmVyc2lvbj59IHRoZSB2ZXJzaW9uIG9mIHRoZSB3YWxsZXRcbiAgICovXG4gIGFzeW5jIGdldFZlcnNpb24oKTogUHJvbWlzZTxNb25lcm9WZXJzaW9uPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgcGF0aC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHBhdGggdGhlIHdhbGxldCBjYW4gYmUgb3BlbmVkIHdpdGhcbiAgICovXG4gIGFzeW5jIGdldFBhdGgoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBtbmVtb25pYyBwaHJhc2Ugb3Igc2VlZC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHdhbGxldCdzIG1uZW1vbmljIHBocmFzZSBvciBzZWVkLlxuICAgKi9cbiAgYXN5bmMgZ2V0U2VlZCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGxhbmd1YWdlIG9mIHRoZSB3YWxsZXQncyBtbmVtb25pYyBwaHJhc2Ugb3Igc2VlZC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIGxhbmd1YWdlIG9mIHRoZSB3YWxsZXQncyBtbmVtb25pYyBwaHJhc2Ugb3Igc2VlZC5cbiAgICovXG4gIGFzeW5jIGdldFNlZWRMYW5ndWFnZSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIHByaXZhdGUgdmlldyBrZXkuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB3YWxsZXQncyBwcml2YXRlIHZpZXcga2V5XG4gICAqL1xuICBhc3luYyBnZXRQcml2YXRlVmlld0tleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIHByaXZhdGUgc3BlbmQga2V5LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgd2FsbGV0J3MgcHJpdmF0ZSBzcGVuZCBrZXlcbiAgICovXG4gIGFzeW5jIGdldFByaXZhdGVTcGVuZEtleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIHB1YmxpYyB2aWV3IGtleS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHdhbGxldCdzIHB1YmxpYyB2aWV3IGtleVxuICAgKi9cbiAgYXN5bmMgZ2V0UHVibGljVmlld0tleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIHB1YmxpYyBzcGVuZCBrZXkuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB3YWxsZXQncyBwdWJsaWMgc3BlbmQga2V5XG4gICAqL1xuICBhc3luYyBnZXRQdWJsaWNTcGVuZEtleSgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgcHJpbWFyeSBhZGRyZXNzLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgd2FsbGV0J3MgcHJpbWFyeSBhZGRyZXNzXG4gICAqL1xuICBhc3luYyBnZXRQcmltYXJ5QWRkcmVzcygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHJldHVybiBhd2FpdCB0aGlzLmdldEFkZHJlc3MoMCwgMCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGFkZHJlc3Mgb2YgYSBzcGVjaWZpYyBzdWJhZGRyZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFjY291bnRJZHggLSB0aGUgYWNjb3VudCBpbmRleCBvZiB0aGUgYWRkcmVzcydzIHN1YmFkZHJlc3NcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN1YmFkZHJlc3NJZHggLSB0aGUgc3ViYWRkcmVzcyBpbmRleCB3aXRoaW4gdGhlIGFjY291bnRcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgcmVjZWl2ZSBhZGRyZXNzIG9mIHRoZSBzcGVjaWZpZWQgc3ViYWRkcmVzc1xuICAgKi9cbiAgYXN5bmMgZ2V0QWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlcik6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRleCBvZiB0aGUgZ2l2ZW4gYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gYWRkcmVzcyB0byBnZXQgdGhlIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kZXggZnJvbVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+fSB0aGUgYWNjb3VudCBhbmQgc3ViYWRkcmVzcyBpbmRpY2VzXG4gICAqL1xuICBhc3luYyBnZXRBZGRyZXNzSW5kZXgoYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhbiBpbnRlZ3JhdGVkIGFkZHJlc3MgYmFzZWQgb24gdGhlIGdpdmVuIHN0YW5kYXJkIGFkZHJlc3MgYW5kIHBheW1lbnRcbiAgICogSUQuIFVzZXMgdGhlIHdhbGxldCdzIHByaW1hcnkgYWRkcmVzcyBpZiBhbiBhZGRyZXNzIGlzIG5vdCBnaXZlbi5cbiAgICogR2VuZXJhdGVzIGEgcmFuZG9tIHBheW1lbnQgSUQgaWYgYSBwYXltZW50IElEIGlzIG5vdCBnaXZlbi5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzdGFuZGFyZEFkZHJlc3MgaXMgdGhlIHN0YW5kYXJkIGFkZHJlc3MgdG8gZ2VuZXJhdGUgdGhlIGludGVncmF0ZWQgYWRkcmVzcyBmcm9tICh3YWxsZXQncyBwcmltYXJ5IGFkZHJlc3MgaWYgdW5kZWZpbmVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGF5bWVudElkIGlzIHRoZSBwYXltZW50IElEIHRvIGdlbmVyYXRlIGFuIGludGVncmF0ZWQgYWRkcmVzcyBmcm9tIChyYW5kb21seSBnZW5lcmF0ZWQgaWYgdW5kZWZpbmVkKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPn0gdGhlIGludGVncmF0ZWQgYWRkcmVzc1xuICAgKi9cbiAgYXN5bmMgZ2V0SW50ZWdyYXRlZEFkZHJlc3Moc3RhbmRhcmRBZGRyZXNzPzogc3RyaW5nLCBwYXltZW50SWQ/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlY29kZSBhbiBpbnRlZ3JhdGVkIGFkZHJlc3MgdG8gZ2V0IGl0cyBzdGFuZGFyZCBhZGRyZXNzIGFuZCBwYXltZW50IGlkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGludGVncmF0ZWRBZGRyZXNzIC0gaW50ZWdyYXRlZCBhZGRyZXNzIHRvIGRlY29kZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzPn0gdGhlIGRlY29kZWQgaW50ZWdyYXRlZCBhZGRyZXNzIGluY2x1ZGluZyBzdGFuZGFyZCBhZGRyZXNzIGFuZCBwYXltZW50IGlkXG4gICAqL1xuICBhc3luYyBkZWNvZGVJbnRlZ3JhdGVkQWRkcmVzcyhpbnRlZ3JhdGVkQWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGJsb2NrIGhlaWdodCB0aGF0IHRoZSB3YWxsZXQgaXMgc3luY2VkIHRvLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB0aGUgYmxvY2sgaGVpZ2h0IHRoYXQgdGhlIHdhbGxldCBpcyBzeW5jZWQgdG9cbiAgICovXG4gIGFzeW5jIGdldEhlaWdodCgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGJsb2NrY2hhaW4ncyBoZWlnaHQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBibG9ja2NoYWluJ3MgaGVpZ2h0XG4gICAqL1xuICBhc3luYyBnZXREYWVtb25IZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBibG9ja2NoYWluJ3MgaGVpZ2h0IGJ5IGRhdGUgYXMgYSBjb25zZXJ2YXRpdmUgZXN0aW1hdGUgZm9yIHNjYW5uaW5nLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IHllYXIgLSB5ZWFyIG9mIHRoZSBoZWlnaHQgdG8gZ2V0XG4gICAqIEBwYXJhbSB7bnVtYmVyfSBtb250aCAtIG1vbnRoIG9mIHRoZSBoZWlnaHQgdG8gZ2V0IGFzIGEgbnVtYmVyIGJldHdlZW4gMSBhbmQgMTJcbiAgICogQHBhcmFtIHtudW1iZXJ9IGRheSAtIGRheSBvZiB0aGUgaGVpZ2h0IHRvIGdldCBhcyBhIG51bWJlciBiZXR3ZWVuIDEgYW5kIDMxXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIGJsb2NrY2hhaW4ncyBhcHByb3hpbWF0ZSBoZWlnaHQgYXQgdGhlIGdpdmVuIGRhdGVcbiAgICovXG4gIGFzeW5jIGdldEhlaWdodEJ5RGF0ZSh5ZWFyOiBudW1iZXIsIG1vbnRoOiBudW1iZXIsIGRheTogbnVtYmVyKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3luY2hyb25pemUgdGhlIHdhbGxldCB3aXRoIHRoZSBkYWVtb24gYXMgYSBvbmUtdGltZSBzeW5jaHJvbm91cyBwcm9jZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRMaXN0ZW5lcnxudW1iZXJ9IFtsaXN0ZW5lck9yU3RhcnRIZWlnaHRdIC0gbGlzdGVuZXIgeG9yIHN0YXJ0IGhlaWdodCAoZGVmYXVsdHMgdG8gbm8gc3luYyBsaXN0ZW5lciwgdGhlIGxhc3Qgc3luY2VkIGJsb2NrKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N0YXJ0SGVpZ2h0XSAtIHN0YXJ0SGVpZ2h0IGlmIG5vdCBnaXZlbiBpbiBmaXJzdCBhcmcgKGRlZmF1bHRzIHRvIGxhc3Qgc3luY2VkIGJsb2NrKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc3luYyhsaXN0ZW5lck9yU3RhcnRIZWlnaHQ/OiBNb25lcm9XYWxsZXRMaXN0ZW5lciB8IG51bWJlciwgc3RhcnRIZWlnaHQ/OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb1N5bmNSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3RhcnQgYmFja2dyb3VuZCBzeW5jaHJvbml6aW5nIHdpdGggYSBtYXhpbXVtIHBlcmlvZCBiZXR3ZWVuIHN5bmNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzeW5jUGVyaW9kSW5Nc10gLSBtYXhpbXVtIHBlcmlvZCBiZXR3ZWVuIHN5bmNzIGluIG1pbGxpc2Vjb25kcyAoZGVmYXVsdCBpcyB3YWxsZXQtc3BlY2lmaWMpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzdGFydFN5bmNpbmcoc3luY1BlcmlvZEluTXM/OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3RvcCBzeW5jaHJvbml6aW5nIHRoZSB3YWxsZXQgd2l0aCB0aGUgZGFlbW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN0b3BTeW5jaW5nKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTY2FuIHRyYW5zYWN0aW9ucyBieSB0aGVpciBoYXNoL2lkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gdHhIYXNoZXMgLSB0eCBoYXNoZXMgdG8gc2NhblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2NhblR4cyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+UmVzY2FuIHRoZSBibG9ja2NoYWluIGZvciBzcGVudCBvdXRwdXRzLjwvcD5cbiAgICogXG4gICAqIDxwPk5vdGU6IHRoaXMgY2FuIG9ubHkgYmUgY2FsbGVkIHdpdGggYSB0cnVzdGVkIGRhZW1vbi48L3A+XG4gICAqIFxuICAgKiA8cD5FeGFtcGxlIHVzZSBjYXNlOiBwZWVyIG11bHRpc2lnIGhleCBpcyBpbXBvcnQgd2hlbiBjb25uZWN0ZWQgdG8gYW4gdW50cnVzdGVkIGRhZW1vbixcbiAgICogc28gdGhlIHdhbGxldCB3aWxsIG5vdCByZXNjYW4gc3BlbnQgb3V0cHV0cy4gIFRoZW4gdGhlIHdhbGxldCBjb25uZWN0cyB0byBhIHRydXN0ZWRcbiAgICogZGFlbW9uLiAgVGhpcyBtZXRob2Qgc2hvdWxkIGJlIG1hbnVhbGx5IGludm9rZWQgdG8gcmVzY2FuIG91dHB1dHMuPC9wPlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHJlc2NhblNwZW50KCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5SZXNjYW4gdGhlIGJsb2NrY2hhaW4gZnJvbSBzY3JhdGNoLCBsb3NpbmcgYW55IGluZm9ybWF0aW9uIHdoaWNoIGNhbm5vdCBiZSByZWNvdmVyZWQgZnJvbVxuICAgKiB0aGUgYmxvY2tjaGFpbiBpdHNlbGYuPC9wPlxuICAgKiBcbiAgICogPHA+V0FSTklORzogVGhpcyBtZXRob2QgZGlzY2FyZHMgbG9jYWwgd2FsbGV0IGRhdGEgbGlrZSBkZXN0aW5hdGlvbiBhZGRyZXNzZXMsIHR4IHNlY3JldCBrZXlzLFxuICAgKiB0eCBub3RlcywgZXRjLjwvcD5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyByZXNjYW5CbG9ja2NoYWluKCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGJhbGFuY2Ugb2YgdGhlIHdhbGxldCwgYWNjb3VudCwgb3Igc3ViYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbYWNjb3VudElkeF0gLSBpbmRleCBvZiB0aGUgYWNjb3VudCB0byBnZXQgdGhlIGJhbGFuY2Ugb2YgKGRlZmF1bHQgYWxsIGFjY291bnRzKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3N1YmFkZHJlc3NJZHhdIC0gaW5kZXggb2YgdGhlIHN1YmFkZHJlc3MgdG8gZ2V0IHRoZSBiYWxhbmNlIG9mIChkZWZhdWx0IGFsbCBzdWJhZGRyZXNzZXMpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8YmlnaW50Pn0gdGhlIGJhbGFuY2Ugb2YgdGhlIHdhbGxldCwgYWNjb3VudCwgb3Igc3ViYWRkcmVzc1xuICAgKi9cbiAgYXN5bmMgZ2V0QmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB1bmxvY2tlZCBiYWxhbmNlIG9mIHRoZSB3YWxsZXQsIGFjY291bnQsIG9yIHN1YmFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW2FjY291bnRJZHhdIC0gaW5kZXggb2YgdGhlIGFjY291bnQgdG8gZ2V0IHRoZSB1bmxvY2tlZCBiYWxhbmNlIG9mIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdWJhZGRyZXNzSWR4XSAtIGluZGV4IG9mIHRoZSBzdWJhZGRyZXNzIHRvIGdldCB0aGUgdW5sb2NrZWQgYmFsYW5jZSBvZiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8YmlnaW50Pn0gdGhlIHVubG9ja2VkIGJhbGFuY2Ugb2YgdGhlIHdhbGxldCwgYWNjb3VudCwgb3Igc3ViYWRkcmVzc1xuICAgKi9cbiAgYXN5bmMgZ2V0VW5sb2NrZWRCYWxhbmNlKGFjY291bnRJZHg/OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg/OiBudW1iZXIpOiBQcm9taXNlPGJpZ2ludD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIG51bWJlciBvZiBibG9ja3MgdW50aWwgdGhlIG5leHQgYW5kIGxhc3QgZnVuZHMgdW5sb2NrLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXJbXT59IHRoZSBudW1iZXIgb2YgYmxvY2tzIHVudGlsIHRoZSBuZXh0IGFuZCBsYXN0IGZ1bmRzIHVubG9jayBpbiBlbGVtZW50cyAwIGFuZCAxLCByZXNwZWN0aXZlbHksIG9yIHVuZGVmaW5lZCBpZiBubyBiYWxhbmNlXG4gICAqL1xuICBhc3luYyBnZXROdW1CbG9ja3NUb1VubG9jaygpOiBQcm9taXNlPG51bWJlcltdPiB7XG4gICAgXG4gICAgLy8gZ2V0IGJhbGFuY2VzXG4gICAgbGV0IGJhbGFuY2UgPSBhd2FpdCB0aGlzLmdldEJhbGFuY2UoKTtcbiAgICBpZiAoYmFsYW5jZSA9PT0gMG4pIHJldHVybiBbdW5kZWZpbmVkLCB1bmRlZmluZWRdOyAvLyBza2lwIGlmIG5vIGJhbGFuY2VcbiAgICBsZXQgdW5sb2NrZWRCYWxhbmNlID0gYXdhaXQgdGhpcy5nZXRVbmxvY2tlZEJhbGFuY2UoKTtcbiAgICBcbiAgICAvLyBjb21wdXRlIG51bWJlciBvZiBibG9ja3MgdW50aWwgbmV4dCBmdW5kcyBhdmFpbGFibGVcbiAgICBsZXQgdHhzO1xuICAgIGxldCBoZWlnaHQ7XG4gICAgbGV0IG51bUJsb2Nrc1RvTmV4dFVubG9jayA9IHVuZGVmaW5lZDtcbiAgICBpZiAodW5sb2NrZWRCYWxhbmNlID4gMG4pIG51bUJsb2Nrc1RvTmV4dFVubG9jayA9IDA7XG4gICAgZWxzZSB7XG4gICAgICB0eHMgPSBhd2FpdCB0aGlzLmdldFR4cyh7aXNMb2NrZWQ6IHRydWV9KTsgLy8gZ2V0IGxvY2tlZCB0eHNcbiAgICAgIGhlaWdodCA9IGF3YWl0IHRoaXMuZ2V0SGVpZ2h0KCk7IC8vIGdldCBtb3N0IHJlY2VudCBoZWlnaHRcbiAgICAgIGZvciAobGV0IHR4IG9mIHR4cykge1xuICAgICAgICBsZXQgbnVtQmxvY2tzVG9VbmxvY2sgPSBNYXRoLm1heCgodHguZ2V0SXNDb25maXJtZWQoKSA/IHR4LmdldEhlaWdodCgpIDogaGVpZ2h0KSArIDEwLCB0eC5nZXRVbmxvY2tUaW1lKCkpIC0gaGVpZ2h0O1xuICAgICAgICBudW1CbG9ja3NUb05leHRVbmxvY2sgPSBudW1CbG9ja3NUb05leHRVbmxvY2sgPT09IHVuZGVmaW5lZCA/IG51bUJsb2Nrc1RvVW5sb2NrIDogTWF0aC5taW4obnVtQmxvY2tzVG9OZXh0VW5sb2NrLCBudW1CbG9ja3NUb1VubG9jayk7XG4gICAgICB9XG4gICAgfVxuICAgIFxuICAgIC8vIGNvbXB1dGUgbnVtYmVyIG9mIGJsb2NrcyB1bnRpbCBhbGwgZnVuZHMgYXZhaWxhYmxlXG4gICAgbGV0IG51bUJsb2Nrc1RvTGFzdFVubG9jayA9IHVuZGVmaW5lZDtcbiAgICBpZiAoYmFsYW5jZSA9PT0gdW5sb2NrZWRCYWxhbmNlKSB7XG4gICAgICBpZiAodW5sb2NrZWRCYWxhbmNlID4gMG4pIG51bUJsb2Nrc1RvTGFzdFVubG9jayA9IDA7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICghdHhzKSB7XG4gICAgICAgIHR4cyA9IGF3YWl0IHRoaXMuZ2V0VHhzKHtpc0xvY2tlZDogdHJ1ZX0pOyAvLyBnZXQgbG9ja2VkIHR4c1xuICAgICAgICBoZWlnaHQgPSBhd2FpdCB0aGlzLmdldEhlaWdodCgpOyAvLyBnZXQgbW9zdCByZWNlbnQgaGVpZ2h0XG4gICAgICB9XG4gICAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgICAgbGV0IG51bUJsb2Nrc1RvVW5sb2NrID0gTWF0aC5tYXgoKHR4LmdldElzQ29uZmlybWVkKCkgPyB0eC5nZXRIZWlnaHQoKSA6IGhlaWdodCkgKyAxMCwgdHguZ2V0VW5sb2NrVGltZSgpKSAtIGhlaWdodDtcbiAgICAgICAgbnVtQmxvY2tzVG9MYXN0VW5sb2NrID0gbnVtQmxvY2tzVG9MYXN0VW5sb2NrID09PSB1bmRlZmluZWQgPyBudW1CbG9ja3NUb1VubG9jayA6IE1hdGgubWF4KG51bUJsb2Nrc1RvTGFzdFVubG9jaywgbnVtQmxvY2tzVG9VbmxvY2spO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICByZXR1cm4gW251bUJsb2Nrc1RvTmV4dFVubG9jaywgbnVtQmxvY2tzVG9MYXN0VW5sb2NrXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhY2NvdW50cyB3aXRoIGEgZ2l2ZW4gdGFnLlxuICAgKiBcbiAgICogQHBhcmFtIHtib29sZWFufSBpbmNsdWRlU3ViYWRkcmVzc2VzIC0gaW5jbHVkZSBzdWJhZGRyZXNzZXMgaWYgdHJ1ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIC0gdGFnIGZvciBmaWx0ZXJpbmcgYWNjb3VudHMsIGFsbCBhY2NvdW50cyBpZiB1bmRlZmluZWRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9BY2NvdW50W10+fSBhbGwgYWNjb3VudHMgd2l0aCB0aGUgZ2l2ZW4gdGFnXG4gICAqL1xuICBhc3luYyBnZXRBY2NvdW50cyhpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbiwgdGFnPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9BY2NvdW50W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGFuIGFjY291bnQuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gYWNjb3VudElkeCAtIGluZGV4IG9mIHRoZSBhY2NvdW50IHRvIGdldFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IGluY2x1ZGVTdWJhZGRyZXNzZXMgLSBpbmNsdWRlIHN1YmFkZHJlc3NlcyBpZiB0cnVlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQWNjb3VudD59IHRoZSByZXRyaWV2ZWQgYWNjb3VudFxuICAgKi9cbiAgYXN5bmMgZ2V0QWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGluY2x1ZGVTdWJhZGRyZXNzZXM/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENyZWF0ZSBhIG5ldyBhY2NvdW50IHdpdGggYSBsYWJlbCBmb3IgdGhlIGZpcnN0IHN1YmFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2xhYmVsXSAtIGxhYmVsIGZvciBhY2NvdW50J3MgZmlyc3Qgc3ViYWRkcmVzcyAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQWNjb3VudD59IHRoZSBjcmVhdGVkIGFjY291bnRcbiAgICovXG4gIGFzeW5jIGNyZWF0ZUFjY291bnQobGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0FjY291bnQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhbiBhY2NvdW50IGxhYmVsLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFjY291bnRJZHggLSBpbmRleCBvZiB0aGUgYWNjb3VudCB0byBzZXQgdGhlIGxhYmVsIGZvclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbGFiZWwgLSB0aGUgbGFiZWwgdG8gc2V0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRBY2NvdW50TGFiZWwoYWNjb3VudElkeDogbnVtYmVyLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgdGhpcy5zZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeCwgMCwgbGFiZWwpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHN1YmFkZHJlc3NlcyBpbiBhbiBhY2NvdW50LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFjY291bnRJZHggLSBhY2NvdW50IHRvIGdldCBzdWJhZGRyZXNzZXMgd2l0aGluXG4gICAqIEBwYXJhbSB7bnVtYmVyW119IFtzdWJhZGRyZXNzSW5kaWNlc10gLSBpbmRpY2VzIG9mIHN1YmFkZHJlc3NlcyB0byBnZXQgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3NbXT59IHRoZSByZXRyaWV2ZWQgc3ViYWRkcmVzc2VzXG4gICAqL1xuICBhc3luYyBnZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSW5kaWNlcz86IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgc3ViYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gaW5kZXggb2YgdGhlIHN1YmFkZHJlc3MncyBhY2NvdW50XG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzdWJhZGRyZXNzSWR4IC0gaW5kZXggb2YgdGhlIHN1YmFkZHJlc3Mgd2l0aGluIHRoZSBhY2NvdW50XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvU3ViYWRkcmVzcz59IHRoZSByZXRyaWV2ZWQgc3ViYWRkcmVzc1xuICAgKi9cbiAgYXN5bmMgZ2V0U3ViYWRkcmVzcyhhY2NvdW50SWR4OiBudW1iZXIsIHN1YmFkZHJlc3NJZHg6IG51bWJlcik6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIGFzc2VydChhY2NvdW50SWR4ID49IDApO1xuICAgIGFzc2VydChzdWJhZGRyZXNzSWR4ID49IDApO1xuICAgIHJldHVybiAoYXdhaXQgdGhpcy5nZXRTdWJhZGRyZXNzZXMoYWNjb3VudElkeCwgW3N1YmFkZHJlc3NJZHhdKSlbMF07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBzdWJhZGRyZXNzIHdpdGhpbiBhbiBhY2NvdW50LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFjY291bnRJZHggLSBpbmRleCBvZiB0aGUgYWNjb3VudCB0byBjcmVhdGUgdGhlIHN1YmFkZHJlc3Mgd2l0aGluXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbGFiZWxdIC0gdGhlIGxhYmVsIGZvciB0aGUgc3ViYWRkcmVzcyAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvU3ViYWRkcmVzcz59IHRoZSBjcmVhdGVkIHN1YmFkZHJlc3NcbiAgICovXG4gIGFzeW5jIGNyZWF0ZVN1YmFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBsYWJlbD86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogU2V0IGEgc3ViYWRkcmVzcyBsYWJlbC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gaW5kZXggb2YgdGhlIGFjY291bnQgdG8gc2V0IHRoZSBsYWJlbCBmb3JcbiAgICogQHBhcmFtIHtudW1iZXJ9IHN1YmFkZHJlc3NJZHggLSBpbmRleCBvZiB0aGUgc3ViYWRkcmVzcyB0byBzZXQgdGhlIGxhYmVsIGZvclxuICAgKiBAcGFyYW0ge1Byb21pc2U8c3RyaW5nPn0gbGFiZWwgLSB0aGUgbGFiZWwgdG8gc2V0XG4gICAqL1xuICBhc3luYyBzZXRTdWJhZGRyZXNzTGFiZWwoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIsIGxhYmVsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgd2FsbGV0IHRyYW5zYWN0aW9uIGJ5IGhhc2guXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gaGFzaCBvZiBhIHRyYW5zYWN0aW9uIHRvIGdldFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB9IHRoZSBpZGVudGlmaWVkIHRyYW5zYWN0aW9uIG9yIHVuZGVmaW5lZCBpZiBub3QgZm91bmRcbiAgICovXG4gIGFzeW5jIGdldFR4KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4ge1xuICAgIGxldCB0eHMgPSBhd2FpdCB0aGlzLmdldFR4cyhbdHhIYXNoXSk7XG4gICAgcmV0dXJuIHR4cy5sZW5ndGggPT09IDAgPyB1bmRlZmluZWQgOiB0eHNbMF07IFxuICB9XG4gIFxuICAvKipcbiAgICogPHA+R2V0IHdhbGxldCB0cmFuc2FjdGlvbnMuICBXYWxsZXQgdHJhbnNhY3Rpb25zIGNvbnRhaW4gb25lIG9yIG1vcmVcbiAgICogdHJhbnNmZXJzIHRoYXQgYXJlIGVpdGhlciBpbmNvbWluZyBvciBvdXRnb2luZyB0byB0aGUgd2FsbGV0LjxwPlxuICAgKiBcbiAgICogPHA+UmVzdWx0cyBjYW4gYmUgZmlsdGVyZWQgYnkgcGFzc2luZyBhIHF1ZXJ5IG9iamVjdC4gIFRyYW5zYWN0aW9ucyBtdXN0XG4gICAqIG1lZXQgZXZlcnkgY3JpdGVyaWEgZGVmaW5lZCBpbiB0aGUgcXVlcnkgaW4gb3JkZXIgdG8gYmUgcmV0dXJuZWQuICBBbGxcbiAgICogY3JpdGVyaWEgYXJlIG9wdGlvbmFsIGFuZCBubyBmaWx0ZXJpbmcgaXMgYXBwbGllZCB3aGVuIG5vdCBkZWZpbmVkLjwvcD5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nW10gfCBNb25lcm9UeFF1ZXJ5fSBbcXVlcnldIC0gY29uZmlndXJlcyB0aGUgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc0NvbmZpcm1lZF0gLSBnZXQgdHhzIHRoYXQgYXJlIGNvbmZpcm1lZCBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pblR4UG9vbF0gLSBnZXQgdHhzIHRoYXQgYXJlIGluIHRoZSB0eCBwb29sIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzUmVsYXllZF0gLSBnZXQgdHhzIHRoYXQgYXJlIHJlbGF5ZWQgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNGYWlsZWRdIC0gZ2V0IHR4cyB0aGF0IGFyZSBmYWlsZWQgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNNaW5lclR4XSAtIGdldCBtaW5lciB0eHMgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtxdWVyeS5oYXNoXSAtIGdldCBhIHR4IHdpdGggdGhlIGhhc2ggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBbcXVlcnkuaGFzaGVzXSAtIGdldCB0eHMgd2l0aCB0aGUgaGFzaGVzIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtxdWVyeS5wYXltZW50SWRdIC0gZ2V0IHRyYW5zYWN0aW9ucyB3aXRoIHRoZSBwYXltZW50IGlkIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gW3F1ZXJ5LnBheW1lbnRJZHNdIC0gZ2V0IHRyYW5zYWN0aW9ucyB3aXRoIHRoZSBwYXltZW50IGlkcyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5Lmhhc1BheW1lbnRJZF0gLSBnZXQgdHJhbnNhY3Rpb25zIHdpdGggYSBwYXltZW50IGlkIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkubWluSGVpZ2h0XSAtIGdldCB0eHMgd2l0aCBoZWlnaHQgPj0gdGhlIGdpdmVuIGhlaWdodCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkubWF4SGVpZ2h0XSAtIGdldCB0eHMgd2l0aCBoZWlnaHQgPD0gdGhlIGdpdmVuIGhlaWdodCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzT3V0Z29pbmddIC0gZ2V0IHR4cyB3aXRoIGFuIG91dGdvaW5nIHRyYW5zZmVyIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzSW5jb21pbmddIC0gZ2V0IHR4cyB3aXRoIGFuIGluY29taW5nIHRyYW5zZmVyIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvVHJhbnNmZXJRdWVyeX0gW3F1ZXJ5LnRyYW5zZmVyUXVlcnldIC0gZ2V0IHR4cyB0aGF0IGhhdmUgYSB0cmFuc2ZlciB0aGF0IG1lZXRzIHRoaXMgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pbmNsdWRlT3V0cHV0c10gLSBzcGVjaWZpZXMgdGhhdCB0eCBvdXRwdXRzIHNob3VsZCBiZSByZXR1cm5lZCB3aXRoIHR4IHJlc3VsdHMgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+fSB3YWxsZXQgdHJhbnNhY3Rpb25zIHBlciB0aGUgY29uZmlndXJhdGlvblxuICAgKi9cbiAgYXN5bmMgZ2V0VHhzKHF1ZXJ5Pzogc3RyaW5nW10gfCBQYXJ0aWFsPE1vbmVyb1R4UXVlcnk+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiA8cD5HZXQgaW5jb21pbmcgYW5kIG91dGdvaW5nIHRyYW5zZmVycyB0byBhbmQgZnJvbSB0aGlzIHdhbGxldC4gIEFuIG91dGdvaW5nXG4gICAqIHRyYW5zZmVyIHJlcHJlc2VudHMgYSB0b3RhbCBhbW91bnQgc2VudCBmcm9tIG9uZSBvciBtb3JlIHN1YmFkZHJlc3Nlc1xuICAgKiB3aXRoaW4gYW4gYWNjb3VudCB0byBpbmRpdmlkdWFsIGRlc3RpbmF0aW9uIGFkZHJlc3NlcywgZWFjaCB3aXRoIHRoZWlyXG4gICAqIG93biBhbW91bnQuICBBbiBpbmNvbWluZyB0cmFuc2ZlciByZXByZXNlbnRzIGEgdG90YWwgYW1vdW50IHJlY2VpdmVkIGludG9cbiAgICogYSBzdWJhZGRyZXNzIHdpdGhpbiBhbiBhY2NvdW50LiAgVHJhbnNmZXJzIGJlbG9uZyB0byB0cmFuc2FjdGlvbnMgd2hpY2hcbiAgICogYXJlIHN0b3JlZCBvbiB0aGUgYmxvY2tjaGFpbi48L3A+XG4gICAqIFxuICAgKiA8cD5SZXN1bHRzIGNhbiBiZSBmaWx0ZXJlZCBieSBwYXNzaW5nIGEgcXVlcnkgb2JqZWN0LiAgVHJhbnNmZXJzIG11c3RcbiAgICogbWVldCBldmVyeSBjcml0ZXJpYSBkZWZpbmVkIGluIHRoZSBxdWVyeSBpbiBvcmRlciB0byBiZSByZXR1cm5lZC4gIEFsbFxuICAgKiBjcml0ZXJpYSBhcmUgb3B0aW9uYWwgYW5kIG5vIGZpbHRlcmluZyBpcyBhcHBsaWVkIHdoZW4gbm90IGRlZmluZWQuPC9wPlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UcmFuc2ZlclF1ZXJ5fSBbcXVlcnldIC0gY29uZmlndXJlcyB0aGUgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc091dGdvaW5nXSAtIGdldCB0cmFuc2ZlcnMgdGhhdCBhcmUgb3V0Z29pbmcgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNJbmNvbWluZ10gLSBnZXQgdHJhbnNmZXJzIHRoYXQgYXJlIGluY29taW5nIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcXVlcnkuYWRkcmVzc10gLSB3YWxsZXQncyBhZGRyZXNzIHRoYXQgYSB0cmFuc2ZlciBlaXRoZXIgb3JpZ2luYXRlZCBmcm9tIChpZiBvdXRnb2luZykgb3IgaXMgZGVzdGluZWQgZm9yIChpZiBpbmNvbWluZykgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LmFjY291bnRJbmRleF0gLSBnZXQgdHJhbnNmZXJzIHRoYXQgZWl0aGVyIG9yaWdpbmF0ZWQgZnJvbSAoaWYgb3V0Z29pbmcpIG9yIGFyZSBkZXN0aW5lZCBmb3IgKGlmIGluY29taW5nKSBhIHNwZWNpZmljIGFjY291bnQgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRleF0gLSBnZXQgdHJhbnNmZXJzIHRoYXQgZWl0aGVyIG9yaWdpbmF0ZWQgZnJvbSAoaWYgb3V0Z29pbmcpIG9yIGFyZSBkZXN0aW5lZCBmb3IgKGlmIGluY29taW5nKSBhIHNwZWNpZmljIHN1YmFkZHJlc3MgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2ludFtdfSBbcXVlcnkuc3ViYWRkcmVzc0luZGljZXNdIC0gZ2V0IHRyYW5zZmVycyB0aGF0IGVpdGhlciBvcmlnaW5hdGVkIGZyb20gKGlmIG91dGdvaW5nKSBvciBhcmUgZGVzdGluZWQgZm9yIChpZiBpbmNvbWluZykgc3BlY2lmaWMgc3ViYWRkcmVzcyBpbmRpY2VzIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtiaWdpbnR9IFtxdWVyeS5hbW91bnRdIC0gYW1vdW50IGJlaW5nIHRyYW5zZmVycmVkIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtNb25lcm9EZXN0aW5hdGlvbltdIHwgTW9uZXJvRGVzdGluYXRpb25Nb2RlbFtdfSBbcXVlcnkuZGVzdGluYXRpb25zXSAtIGluZGl2aWR1YWwgZGVzdGluYXRpb25zIG9mIGFuIG91dGdvaW5nIHRyYW5zZmVyLCB3aGljaCBpcyBsb2NhbCB3YWxsZXQgZGF0YSBhbmQgTk9UIHJlY292ZXJhYmxlIGZyb20gdGhlIGJsb2NrY2hhaW4gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5oYXNEZXN0aW5hdGlvbnNdIC0gZ2V0IHRyYW5zZmVycyB0aGF0IGhhdmUgZGVzdGluYXRpb25zIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhRdWVyeX0gW3F1ZXJ5LnR4UXVlcnldIC0gZ2V0IHRyYW5zZmVycyB3aG9zZSB0cmFuc2FjdGlvbiBtZWV0cyB0aGlzIHF1ZXJ5IChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UcmFuc2ZlcltdPn0gd2FsbGV0IHRyYW5zZmVycyB0aGF0IG1lZXQgdGhlIHF1ZXJ5XG4gICAqL1xuICBhc3luYyBnZXRUcmFuc2ZlcnMocXVlcnk/OiBQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+KTogUHJvbWlzZTxNb25lcm9UcmFuc2ZlcltdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBpbmNvbWluZyB0cmFuc2ZlcnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT59IFtxdWVyeV0gLSBjb25maWd1cmVzIHRoZSBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcXVlcnkuYWRkcmVzc10gLSBnZXQgaW5jb21pbmcgdHJhbnNmZXJzIHRvIGEgc3BlY2lmaWMgYWRkcmVzcyBpbiB0aGUgd2FsbGV0IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5hY2NvdW50SW5kZXhdIC0gZ2V0IGluY29taW5nIHRyYW5zZmVycyB0byBhIHNwZWNpZmljIGFjY291bnQgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRleF0gLSBnZXQgaW5jb21pbmcgdHJhbnNmZXJzIHRvIGEgc3BlY2lmaWMgc3ViYWRkcmVzcyBpbmRleCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7aW50W119IFtxdWVyeS5zdWJhZGRyZXNzSW5kaWNlc10gLSBnZXQgdHJhbnNmZXJzIGRlc3RpbmVkIGZvciBzcGVjaWZpYyBzdWJhZGRyZXNzIGluZGljZXMgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludH0gW3F1ZXJ5LmFtb3VudF0gLSBhbW91bnQgYmVpbmcgdHJhbnNmZXJyZWQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UXVlcnl9IFtxdWVyeS50eFF1ZXJ5XSAtIGdldCB0cmFuc2ZlcnMgd2hvc2UgdHJhbnNhY3Rpb24gbWVldHMgdGhpcyBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvSW5jb21pbmdUcmFuc2ZlcltdPn0gaW5jb21pbmcgdHJhbnNmZXJzIHRoYXQgbWVldCB0aGUgcXVlcnlcbiAgICovXG4gIGFzeW5jIGdldEluY29taW5nVHJhbnNmZXJzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvSW5jb21pbmdUcmFuc2ZlcltdPiB7XG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkOiBNb25lcm9UcmFuc2ZlclF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQuZ2V0SXNJbmNvbWluZygpID09PSBmYWxzZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVHJhbnNmZXIgcXVlcnkgY29udHJhZGljdHMgZ2V0dGluZyBpbmNvbWluZyB0cmFuc2ZlcnNcIik7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldElzSW5jb21pbmcodHJ1ZSk7XG4gICAgcmV0dXJuIHRoaXMuZ2V0VHJhbnNmZXJzKHF1ZXJ5Tm9ybWFsaXplZCkgYXMgdW5rbm93biBhcyBNb25lcm9JbmNvbWluZ1RyYW5zZmVyW107XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgb3V0Z29pbmcgdHJhbnNmZXJzLlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+fSBbcXVlcnldIC0gY29uZmlndXJlcyB0aGUgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3F1ZXJ5LmFkZHJlc3NdIC0gZ2V0IG91dGdvaW5nIHRyYW5zZmVycyBmcm9tIGEgc3BlY2lmaWMgYWRkcmVzcyBpbiB0aGUgd2FsbGV0IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5hY2NvdW50SW5kZXhdIC0gZ2V0IG91dGdvaW5nIHRyYW5zZmVycyBmcm9tIGEgc3BlY2lmaWMgYWNjb3VudCBpbmRleCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkuc3ViYWRkcmVzc0luZGV4XSAtIGdldCBvdXRnb2luZyB0cmFuc2ZlcnMgZnJvbSBhIHNwZWNpZmljIHN1YmFkZHJlc3MgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2ludFtdfSBbcXVlcnkuc3ViYWRkcmVzc0luZGljZXNdIC0gZ2V0IG91dGdvaW5nIHRyYW5zZmVycyBmcm9tIHNwZWNpZmljIHN1YmFkZHJlc3MgaW5kaWNlcyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7YmlnaW50fSBbcXVlcnkuYW1vdW50XSAtIGFtb3VudCBiZWluZyB0cmFuc2ZlcnJlZCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvRGVzdGluYXRpb25bXSB8IE1vbmVyb0Rlc3RpbmF0aW9uTW9kZWxbXX0gW3F1ZXJ5LmRlc3RpbmF0aW9uc10gLSBpbmRpdmlkdWFsIGRlc3RpbmF0aW9ucyBvZiBhbiBvdXRnb2luZyB0cmFuc2Zlciwgd2hpY2ggaXMgbG9jYWwgd2FsbGV0IGRhdGEgYW5kIE5PVCByZWNvdmVyYWJsZSBmcm9tIHRoZSBibG9ja2NoYWluIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaGFzRGVzdGluYXRpb25zXSAtIGdldCB0cmFuc2ZlcnMgdGhhdCBoYXZlIGRlc3RpbmF0aW9ucyBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UXVlcnl9IFtxdWVyeS50eFF1ZXJ5XSAtIGdldCB0cmFuc2ZlcnMgd2hvc2UgdHJhbnNhY3Rpb24gbWVldHMgdGhpcyBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvT3V0Z29pbmdUcmFuc2ZlcltdPn0gb3V0Z29pbmcgdHJhbnNmZXJzIHRoYXQgbWVldCB0aGUgcXVlcnlcbiAgICovXG4gIGFzeW5jIGdldE91dGdvaW5nVHJhbnNmZXJzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvT3V0Z29pbmdUcmFuc2ZlcltdPiB7XG4gICAgY29uc3QgcXVlcnlOb3JtYWxpemVkOiBNb25lcm9UcmFuc2ZlclF1ZXJ5ID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZVRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIGlmIChxdWVyeU5vcm1hbGl6ZWQuZ2V0SXNPdXRnb2luZygpID09PSBmYWxzZSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiVHJhbnNmZXIgcXVlcnkgY29udHJhZGljdHMgZ2V0dGluZyBvdXRnb2luZyB0cmFuc2ZlcnNcIik7XG4gICAgcXVlcnlOb3JtYWxpemVkLnNldElzT3V0Z29pbmcodHJ1ZSk7XG4gICAgcmV0dXJuIHRoaXMuZ2V0VHJhbnNmZXJzKHF1ZXJ5Tm9ybWFsaXplZCkgYXMgdW5rbm93biBhcyBNb25lcm9PdXRnb2luZ1RyYW5zZmVyW107XG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5HZXQgb3V0cHV0cyBjcmVhdGVkIGZyb20gcHJldmlvdXMgdHJhbnNhY3Rpb25zIHRoYXQgYmVsb25nIHRvIHRoZSB3YWxsZXRcbiAgICogKGkuZS4gdGhhdCB0aGUgd2FsbGV0IGNhbiBzcGVuZCBvbmUgdGltZSkuICBPdXRwdXRzIGFyZSBwYXJ0IG9mXG4gICAqIHRyYW5zYWN0aW9ucyB3aGljaCBhcmUgc3RvcmVkIGluIGJsb2NrcyBvbiB0aGUgYmxvY2tjaGFpbi48L3A+XG4gICAqIFxuICAgKiA8cD5SZXN1bHRzIGNhbiBiZSBmaWx0ZXJlZCBieSBwYXNzaW5nIGEgcXVlcnkgb2JqZWN0LiAgT3V0cHV0cyBtdXN0XG4gICAqIG1lZXQgZXZlcnkgY3JpdGVyaWEgZGVmaW5lZCBpbiB0aGUgcXVlcnkgaW4gb3JkZXIgdG8gYmUgcmV0dXJuZWQuICBBbGxcbiAgICogZmlsdGVyaW5nIGlzIG9wdGlvbmFsIGFuZCBubyBmaWx0ZXJpbmcgaXMgYXBwbGllZCB3aGVuIG5vdCBkZWZpbmVkLjwvcD5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFyaXRhbDxNb25lcm9PdXRwdXRRdWVyeT59IFtxdWVyeV0gLSBjb25maWd1cmVzIHRoZSBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkuYWNjb3VudEluZGV4XSAtIGdldCBvdXRwdXRzIGFzc29jaWF0ZWQgd2l0aCBhIHNwZWNpZmljIGFjY291bnQgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRleF0gLSBnZXQgb3V0cHV0cyBhc3NvY2lhdGVkIHdpdGggYSBzcGVjaWZpYyBzdWJhZGRyZXNzIGluZGV4IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtpbnRbXX0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRpY2VzXSAtIGdldCBvdXRwdXRzIGFzc29jaWF0ZWQgd2l0aCBzcGVjaWZpYyBzdWJhZGRyZXNzIGluZGljZXMgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludH0gW3F1ZXJ5LmFtb3VudF0gLSBnZXQgb3V0cHV0cyB3aXRoIGEgc3BlY2lmaWMgYW1vdW50IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtiaWdpbnR9IFtxdWVyeS5taW5BbW91bnRdIC0gZ2V0IG91dHB1dHMgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIGEgbWluaW11bSBhbW91bnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludH0gW3F1ZXJ5Lm1heEFtb3VudF0gLSBnZXQgb3V0cHV0cyBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gYSBtYXhpbXVtIGFtb3VudCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzU3BlbnRdIC0gZ2V0IG91dHB1dHMgdGhhdCBhcmUgc3BlbnQgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd8TW9uZXJvS2V5SW1hZ2V9IFtxdWVyeS5rZXlJbWFnZV0gLSBnZXQgb3V0cHV0IHdpdGggYSBrZXkgaW1hZ2Ugb3Igd2hpY2ggbWF0Y2hlcyBmaWVsZHMgZGVmaW5lZCBpbiBhIE1vbmVyb0tleUltYWdlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtNb25lcm9UeFF1ZXJ5fSBbcXVlcnkudHhRdWVyeV0gLSBnZXQgb3V0cHV0cyB3aG9zZSB0cmFuc2FjdGlvbiBtZWV0cyB0aGlzIGZpbHRlciAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvT3V0cHV0V2FsbGV0W10+fSB0aGUgcXVlcmllZCBvdXRwdXRzXG4gICAqL1xuICBhc3luYyBnZXRPdXRwdXRzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9PdXRwdXRRdWVyeT4pOiBQcm9taXNlPE1vbmVyb091dHB1dFdhbGxldFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEV4cG9ydCBvdXRwdXRzIGluIGhleCBmb3JtYXQuXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2FsbF0gLSBleHBvcnQgYWxsIG91dHB1dHMgaWYgdHJ1ZSwgZWxzZSBleHBvcnQgdGhlIG91dHB1dHMgc2luY2UgdGhlIGxhc3QgZXhwb3J0IChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IG91dHB1dHMgaW4gaGV4IGZvcm1hdFxuICAgKi9cbiAgYXN5bmMgZXhwb3J0T3V0cHV0cyhhbGwgPSBmYWxzZSk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEltcG9ydCBvdXRwdXRzIGluIGhleCBmb3JtYXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gb3V0cHV0c0hleCAtIG91dHB1dHMgaW4gaGV4IGZvcm1hdFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBudW1iZXIgb2Ygb3V0cHV0cyBpbXBvcnRlZFxuICAgKi9cbiAgYXN5bmMgaW1wb3J0T3V0cHV0cyhvdXRwdXRzSGV4OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBFeHBvcnQgc2lnbmVkIGtleSBpbWFnZXMuXG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthbGxdIC0gZXhwb3J0IGFsbCBrZXkgaW1hZ2VzIGlmIHRydWUsIGVsc2UgZXhwb3J0IHRoZSBrZXkgaW1hZ2VzIHNpbmNlIHRoZSBsYXN0IGV4cG9ydCAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPn0gdGhlIHdhbGxldCdzIHNpZ25lZCBrZXkgaW1hZ2VzXG4gICAqL1xuICBhc3luYyBleHBvcnRLZXlJbWFnZXMoYWxsID0gZmFsc2UpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogSW1wb3J0IHNpZ25lZCBrZXkgaW1hZ2VzIGFuZCB2ZXJpZnkgdGhlaXIgc3BlbnQgc3RhdHVzLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9LZXlJbWFnZVtdfSBrZXlJbWFnZXMgLSBpbWFnZXMgdG8gaW1wb3J0IGFuZCB2ZXJpZnkgKHJlcXVpcmVzIGhleCBhbmQgc2lnbmF0dXJlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0Pn0gcmVzdWx0cyBvZiB0aGUgaW1wb3J0XG4gICAqL1xuICBhc3luYyBpbXBvcnRLZXlJbWFnZXMoa2V5SW1hZ2VzOiBNb25lcm9LZXlJbWFnZVtdKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgbmV3IGtleSBpbWFnZXMgZnJvbSB0aGUgbGFzdCBpbXBvcnRlZCBvdXRwdXRzLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPn0gdGhlIGtleSBpbWFnZXMgZnJvbSB0aGUgbGFzdCBpbXBvcnRlZCBvdXRwdXRzXG4gICAqL1xuICBhc3luYyBnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCgpOiBQcm9taXNlPE1vbmVyb0tleUltYWdlW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRnJlZXplIGFuIG91dHB1dC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJbWFnZSAtIGtleSBpbWFnZSBvZiB0aGUgb3V0cHV0IHRvIGZyZWV6ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgZnJlZXplT3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogVGhhdyBhIGZyb3plbiBvdXRwdXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SW1hZ2UgLSBrZXkgaW1hZ2Ugb2YgdGhlIG91dHB1dCB0byB0aGF3XG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyB0aGF3T3V0cHV0KGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ2hlY2sgaWYgYW4gb3V0cHV0IGlzIGZyb3plbi5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXlJbWFnZSAtIGtleSBpbWFnZSBvZiB0aGUgb3V0cHV0IHRvIGNoZWNrIGlmIGZyb3plblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSBvdXRwdXQgaXMgZnJvemVuLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzT3V0cHV0RnJvemVuKGtleUltYWdlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ3JlYXRlIGEgdHJhbnNhY3Rpb24gdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSB0aGlzIHdhbGxldC5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhDb25maWd9IGNvbmZpZyAtIGNvbmZpZ3VyZXMgdGhlIHRyYW5zYWN0aW9uIHRvIGNyZWF0ZSAocmVxdWlyZWQpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb25maWcuYWRkcmVzcyAtIHNpbmdsZSBkZXN0aW5hdGlvbiBhZGRyZXNzIChyZXF1aXJlZCB1bmxlc3MgYGRlc3RpbmF0aW9uc2AgcHJvdmlkZWQpXG4gICAqIEBwYXJhbSB7YmlnaW50fHN0cmluZ30gY29uZmlnLmFtb3VudCAtIHNpbmdsZSBkZXN0aW5hdGlvbiBhbW91bnQgKHJlcXVpcmVkIHVubGVzcyBgZGVzdGluYXRpb25zYCBwcm92aWRlZClcbiAgICogQHBhcmFtIHtudW1iZXJ9IGNvbmZpZy5hY2NvdW50SW5kZXggLSBzb3VyY2UgYWNjb3VudCBpbmRleCB0byB0cmFuc2ZlciBmdW5kcyBmcm9tIChyZXF1aXJlZClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcuc3ViYWRkcmVzc0luZGV4XSAtIHNvdXJjZSBzdWJhZGRyZXNzIGluZGV4IHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcltdfSBbY29uZmlnLnN1YmFkZHJlc3NJbmRpY2VzXSAtIHNvdXJjZSBzdWJhZGRyZXNzIGluZGljZXMgdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5yZWxheV0gLSByZWxheSB0aGUgdHJhbnNhY3Rpb24gdG8gcGVlcnMgdG8gY29tbWl0IHRvIHRoZSBibG9ja2NoYWluIChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UHJpb3JpdHl9IFtjb25maWcucHJpb3JpdHldIC0gdHJhbnNhY3Rpb24gcHJpb3JpdHkgKGRlZmF1bHQgTW9uZXJvVHhQcmlvcml0eS5OT1JNQUwpXG4gICAqIEBwYXJhbSB7TW9uZXJvRGVzdGluYXRpb25bXX0gY29uZmlnLmRlc3RpbmF0aW9ucyAtIGFkZHJlc3NlcyBhbmQgYW1vdW50cyBpbiBhIG11bHRpLWRlc3RpbmF0aW9uIHR4IChyZXF1aXJlZCB1bmxlc3MgYGFkZHJlc3NgIGFuZCBgYW1vdW50YCBwcm92aWRlZClcbiAgICogQHBhcmFtIHtudW1iZXJbXX0gW2NvbmZpZy5zdWJ0cmFjdEZlZUZyb21dIC0gbGlzdCBvZiBkZXN0aW5hdGlvbiBpbmRpY2VzIHRvIHNwbGl0IHRoZSB0cmFuc2FjdGlvbiBmZWUgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXltZW50SWRdIC0gdHJhbnNhY3Rpb24gcGF5bWVudCBJRCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7YmlnaW50fHN0cmluZ30gW2NvbmZpZy51bmxvY2tUaW1lXSAtIG1pbmltdW0gaGVpZ2h0IG9yIHRpbWVzdGFtcCBmb3IgdGhlIHRyYW5zYWN0aW9uIHRvIHVubG9jayAoZGVmYXVsdCAwKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4V2FsbGV0Pn0gdGhlIGNyZWF0ZWQgdHJhbnNhY3Rpb25cbiAgICovXG4gIGFzeW5jIGNyZWF0ZVR4KGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0PiB7XG4gICAgY29uc3QgY29uZmlnTm9ybWFsaXplZDogTW9uZXJvVHhDb25maWcgPSBNb25lcm9XYWxsZXQubm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnKGNvbmZpZyk7XG4gICAgaWYgKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSAhPT0gdW5kZWZpbmVkKSBhc3NlcnQuZXF1YWwoY29uZmlnTm9ybWFsaXplZC5nZXRDYW5TcGxpdCgpLCBmYWxzZSwgXCJDYW5ub3Qgc3BsaXQgdHJhbnNhY3Rpb25zIHVzaW5nIGNyZWF0ZVR4KCk7IHVzZSBjcmVhdGVUeHMoKVwiKTtcbiAgICBjb25maWdOb3JtYWxpemVkLnNldENhblNwbGl0KGZhbHNlKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuY3JlYXRlVHhzKGNvbmZpZ05vcm1hbGl6ZWQpKVswXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENyZWF0ZSBvbmUgb3IgbW9yZSB0cmFuc2FjdGlvbnMgdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSB0aGlzIHdhbGxldC5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9UeENvbmZpZz59IGNvbmZpZyAtIGNvbmZpZ3VyZXMgdGhlIHRyYW5zYWN0aW9ucyB0byBjcmVhdGUgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmFkZHJlc3MgLSBzaW5nbGUgZGVzdGluYXRpb24gYWRkcmVzcyAocmVxdWlyZWQgdW5sZXNzIGBkZXN0aW5hdGlvbnNgIHByb3ZpZGVkKVxuICAgKiBAcGFyYW0ge2JpZ2ludHxzdHJpbmd9IGNvbmZpZy5hbW91bnQgLSBzaW5nbGUgZGVzdGluYXRpb24gYW1vdW50IChyZXF1aXJlZCB1bmxlc3MgYGRlc3RpbmF0aW9uc2AgcHJvdmlkZWQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBjb25maWcuYWNjb3VudEluZGV4IC0gc291cmNlIGFjY291bnQgaW5kZXggdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSAocmVxdWlyZWQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnN1YmFkZHJlc3NJbmRleF0gLSBzb3VyY2Ugc3ViYWRkcmVzcyBpbmRleCB0byB0cmFuc2ZlciBmdW5kcyBmcm9tIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtpbnRbXX0gW2NvbmZpZy5zdWJhZGRyZXNzSW5kaWNlc10gLSBzb3VyY2Ugc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucmVsYXldIC0gcmVsYXkgdGhlIHRyYW5zYWN0aW9ucyB0byBwZWVycyB0byBjb21taXQgdG8gdGhlIGJsb2NrY2hhaW4gKGRlZmF1bHQgZmFsc2UpXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhQcmlvcml0eX0gW2NvbmZpZy5wcmlvcml0eV0gLSB0cmFuc2FjdGlvbiBwcmlvcml0eSAoZGVmYXVsdCBNb25lcm9UeFByaW9yaXR5Lk5PUk1BTClcbiAgICogQHBhcmFtIHtNb25lcm9EZXN0aW5hdGlvbltdIHwgTW9uZXJvRGVzdGluYXRpb25Nb2RlbFtdfSBjb25maWcuZGVzdGluYXRpb25zIC0gYWRkcmVzc2VzIGFuZCBhbW91bnRzIGluIGEgbXVsdGktZGVzdGluYXRpb24gdHggKHJlcXVpcmVkIHVubGVzcyBgYWRkcmVzc2AgYW5kIGBhbW91bnRgIHByb3ZpZGVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2NvbmZpZy5wYXltZW50SWRdIC0gdHJhbnNhY3Rpb24gcGF5bWVudCBJRCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7YmlnaW50fHN0cmluZ30gW2NvbmZpZy51bmxvY2tUaW1lXSAtIG1pbmltdW0gaGVpZ2h0IG9yIHRpbWVzdGFtcCBmb3IgdGhlIHRyYW5zYWN0aW9ucyB0byB1bmxvY2sgKGRlZmF1bHQgMClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLmNhblNwbGl0XSAtIGFsbG93IGZ1bmRzIHRvIGJlIHRyYW5zZmVycmVkIHVzaW5nIG11bHRpcGxlIHRyYW5zYWN0aW9ucyAoZGVmYXVsdCB0cnVlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+fSB0aGUgY3JlYXRlZCB0cmFuc2FjdGlvbnNcbiAgICovXG4gIGFzeW5jIGNyZWF0ZVR4cyhjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN3ZWVwIGFuIG91dHB1dCBieSBrZXkgaW1hZ2UuXG4gICAqIFxuICAgKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvVHhDb25maWc+fSBjb25maWcgLSBjb25maWd1cmVzIHRoZSB0cmFuc2FjdGlvbiB0byBjcmVhdGUgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmFkZHJlc3MgLSBzaW5nbGUgZGVzdGluYXRpb24gYWRkcmVzcyAocmVxdWlyZWQpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBjb25maWcua2V5SW1hZ2UgLSBrZXkgaW1hZ2UgdG8gc3dlZXAgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucmVsYXldIC0gcmVsYXkgdGhlIHRyYW5zYWN0aW9uIHRvIHBlZXJzIHRvIGNvbW1pdCB0byB0aGUgYmxvY2tjaGFpbiAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHBhcmFtIHtiaWdpbnR8c3RyaW5nfSBbY29uZmlnLnVubG9ja1RpbWVdIC0gbWluaW11bSBoZWlnaHQgb3IgdGltZXN0YW1wIGZvciB0aGUgdHJhbnNhY3Rpb24gdG8gdW5sb2NrIChkZWZhdWx0IDApXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhQcmlvcml0eX0gW2NvbmZpZy5wcmlvcml0eV0gLSB0cmFuc2FjdGlvbiBwcmlvcml0eSAoZGVmYXVsdCBNb25lcm9UeFByaW9yaXR5Lk5PUk1BTClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldD59IHRoZSBjcmVhdGVkIHRyYW5zYWN0aW9uXG4gICAqL1xuICBhc3luYyBzd2VlcE91dHB1dChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogU3dlZXAgYWxsIHVubG9ja2VkIGZ1bmRzIGFjY29yZGluZyB0byB0aGUgZ2l2ZW4gY29uZmlndXJhdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9UeENvbmZpZz59IGNvbmZpZyAtIGNvbmZpZ3VyZXMgdGhlIHRyYW5zYWN0aW9ucyB0byBjcmVhdGUgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmFkZHJlc3MgLSBzaW5nbGUgZGVzdGluYXRpb24gYWRkcmVzcyAocmVxdWlyZWQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLmFjY291bnRJbmRleF0gLSBzb3VyY2UgYWNjb3VudCBpbmRleCB0byBzd2VlcCBmcm9tIChvcHRpb25hbCwgZGVmYXVsdHMgdG8gYWxsIGFjY291bnRzKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy5zdWJhZGRyZXNzSW5kZXhdIC0gc291cmNlIHN1YmFkZHJlc3MgaW5kZXggdG8gc3dlZXAgZnJvbSAob3B0aW9uYWwsIGRlZmF1bHRzIHRvIGFsbCBzdWJhZGRyZXNzZXMpXG4gICAqIEBwYXJhbSB7bnVtYmVyW119IFtjb25maWcuc3ViYWRkcmVzc0luZGljZXNdIC0gc291cmNlIHN1YmFkZHJlc3MgaW5kaWNlcyB0byBzd2VlcCBmcm9tIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnJlbGF5XSAtIHJlbGF5IHRoZSB0cmFuc2FjdGlvbnMgdG8gcGVlcnMgdG8gY29tbWl0IHRvIHRoZSBibG9ja2NoYWluIChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UHJpb3JpdHl9IFtjb25maWcucHJpb3JpdHldIC0gdHJhbnNhY3Rpb24gcHJpb3JpdHkgKGRlZmF1bHQgTW9uZXJvVHhQcmlvcml0eS5OT1JNQUwpXG4gICAqIEBwYXJhbSB7YmlnaW50fHN0cmluZ30gW2NvbmZpZy51bmxvY2tUaW1lXSAtIG1pbmltdW0gaGVpZ2h0IG9yIHRpbWVzdGFtcCBmb3IgdGhlIHRyYW5zYWN0aW9ucyB0byB1bmxvY2sgKGRlZmF1bHQgMClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnN3ZWVwRWFjaFN1YmFkZHJlc3NdIC0gc3dlZXAgZWFjaCBzdWJhZGRyZXNzIGluZGl2aWR1YWxseSBpZiB0cnVlIChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+fSB0aGUgY3JlYXRlZCB0cmFuc2FjdGlvbnNcbiAgICovXG4gIGFzeW5jIHN3ZWVwVW5sb2NrZWQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiA8cD5Td2VlcCBhbGwgdW5taXhhYmxlIGR1c3Qgb3V0cHV0cyBiYWNrIHRvIHRoZSB3YWxsZXQgdG8gbWFrZSB0aGVtIGVhc2llciB0byBzcGVuZCBhbmQgbWl4LjwvcD5cbiAgICogXG4gICAqIDxwPk5PVEU6IER1c3Qgb25seSBleGlzdHMgcHJlIFJDVCwgc28gdGhpcyBtZXRob2Qgd2lsbCB0aHJvdyBcIm5vIGR1c3QgdG8gc3dlZXBcIiBvbiBuZXcgd2FsbGV0cy48L3A+XG4gICAqIFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtyZWxheV0gLSBzcGVjaWZpZXMgaWYgdGhlIHJlc3VsdGluZyB0cmFuc2FjdGlvbiBzaG91bGQgYmUgcmVsYXllZCAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPn0gdGhlIGNyZWF0ZWQgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBzd2VlcER1c3QocmVsYXk/OiBib29sZWFuKTogUHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJlbGF5IGEgcHJldmlvdXNseSBjcmVhdGVkIHRyYW5zYWN0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHsoTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpfSB0eE9yTWV0YWRhdGEgLSB0cmFuc2FjdGlvbiBvciBpdHMgbWV0YWRhdGEgdG8gcmVsYXlcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgaGFzaCBvZiB0aGUgcmVsYXllZCB0eFxuICAgKi9cbiAgYXN5bmMgcmVsYXlUeCh0eE9yTWV0YWRhdGE6IE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMucmVsYXlUeHMoW3R4T3JNZXRhZGF0YV0pKVswXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJlbGF5IHByZXZpb3VzbHkgY3JlYXRlZCB0cmFuc2FjdGlvbnMuXG4gICAqIFxuICAgKiBAcGFyYW0geyhNb25lcm9UeFdhbGxldFtdIHwgc3RyaW5nW10pfSB0eHNPck1ldGFkYXRhcyAtIHRyYW5zYWN0aW9ucyBvciB0aGVpciBtZXRhZGF0YSB0byByZWxheVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZ1tdPn0gdGhlIGhhc2hlcyBvZiB0aGUgcmVsYXllZCB0eHNcbiAgICovXG4gIGFzeW5jIHJlbGF5VHhzKHR4c09yTWV0YWRhdGFzOiAoTW9uZXJvVHhXYWxsZXQgfCBzdHJpbmcpW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlc2NyaWJlIGEgdHggc2V0IGZyb20gdW5zaWduZWQgdHggaGV4LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVuc2lnbmVkVHhIZXggLSB1bnNpZ25lZCB0eCBoZXhcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFNldD59IHRoZSB0eCBzZXQgY29udGFpbmluZyBzdHJ1Y3R1cmVkIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgZGVzY3JpYmVVbnNpZ25lZFR4U2V0KHVuc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICByZXR1cm4gdGhpcy5kZXNjcmliZVR4U2V0KG5ldyBNb25lcm9UeFNldCgpLnNldFVuc2lnbmVkVHhIZXgodW5zaWduZWRUeEhleCkpO1xuICB9XG4gIFxuICAvKipcbiAgICogRGVzY3JpYmUgYSB0eCBzZXQgZnJvbSBtdWx0aXNpZyB0eCBoZXguXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbXVsdGlzaWdUeEhleCAtIG11bHRpc2lnIHR4IGhleFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4U2V0Pn0gdGhlIHR4IHNldCBjb250YWluaW5nIHN0cnVjdHVyZWQgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBkZXNjcmliZU11bHRpc2lnVHhTZXQobXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeFNldD4ge1xuICAgIHJldHVybiB0aGlzLmRlc2NyaWJlVHhTZXQobmV3IE1vbmVyb1R4U2V0KCkuc2V0TXVsdGlzaWdUeEhleChtdWx0aXNpZ1R4SGV4KSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZXNjcmliZSBhIHR4IHNldCBjb250YWluaW5nIHVuc2lnbmVkIG9yIG11bHRpc2lnIHR4IGhleCB0byBhIG5ldyB0eCBzZXQgY29udGFpbmluZyBzdHJ1Y3R1cmVkIHRyYW5zYWN0aW9ucy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhTZXR9IHR4U2V0IC0gYSB0eCBzZXQgY29udGFpbmluZyB1bnNpZ25lZCBvciBtdWx0aXNpZyB0eCBoZXhcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFNldD59IHR4U2V0IC0gdGhlIHR4IHNldCBjb250YWluaW5nIHN0cnVjdHVyZWQgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBkZXNjcmliZVR4U2V0KHR4U2V0OiBNb25lcm9UeFNldCk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2lnbiB1bnNpZ25lZCB0cmFuc2FjdGlvbnMgZnJvbSBhIHZpZXctb25seSB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdW5zaWduZWRUeEhleCAtIHVuc2lnbmVkIHRyYW5zYWN0aW9uIGhleCBmcm9tIHdoZW4gdGhlIHRyYW5zYWN0aW9ucyB3ZXJlIGNyZWF0ZWRcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgc2lnbmVkIHRyYW5zYWN0aW9uIGhleFxuICAgKi9cbiAgYXN5bmMgc2lnblR4cyh1bnNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdWJtaXQgc2lnbmVkIHRyYW5zYWN0aW9ucyBmcm9tIGEgdmlldy1vbmx5IHdhbGxldC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzaWduZWRUeEhleCAtIHNpZ25lZCB0cmFuc2FjdGlvbiBoZXggZnJvbSBzaWduVHhzKClcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmdbXT59IHRoZSByZXN1bHRpbmcgdHJhbnNhY3Rpb24gaGFzaGVzXG4gICAqL1xuICBhc3luYyBzdWJtaXRUeHMoc2lnbmVkVHhIZXg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2lnbiBhIG1lc3NhZ2UuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSAtIHRoZSBtZXNzYWdlIHRvIHNpZ25cbiAgICogQHBhcmFtIHtNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZX0gW3NpZ25hdHVyZVR5cGVdIC0gc2lnbiB3aXRoIHNwZW5kIGtleSBvciB2aWV3IGtleSAoZGVmYXVsdCBzcGVuZCBrZXkpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbYWNjb3VudElkeF0gLSB0aGUgYWNjb3VudCBpbmRleCBvZiB0aGUgbWVzc2FnZSBzaWduYXR1cmUgKGRlZmF1bHQgMClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdWJhZGRyZXNzSWR4XSAtIHRoZSBzdWJhZGRyZXNzIGluZGV4IG9mIHRoZSBtZXNzYWdlIHNpZ25hdHVyZSAoZGVmYXVsdCAwKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSBzaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIHNpZ25NZXNzYWdlKG1lc3NhZ2U6IHN0cmluZywgc2lnbmF0dXJlVHlwZSA9IE1vbmVyb01lc3NhZ2VTaWduYXR1cmVUeXBlLlNJR05fV0lUSF9TUEVORF9LRVksIGFjY291bnRJZHggPSAwLCBzdWJhZGRyZXNzSWR4ID0gMCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFZlcmlmeSBhIHNpZ25hdHVyZSBvbiBhIG1lc3NhZ2UuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbWVzc2FnZSAtIHNpZ25lZCBtZXNzYWdlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gc2lnbmluZyBhZGRyZXNzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzaWduYXR1cmUgLSBzaWduYXR1cmVcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0Pn0gdHJ1ZSBpZiB0aGUgc2lnbmF0dXJlIGlzIGdvb2QsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgdmVyaWZ5TWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb01lc3NhZ2VTaWduYXR1cmVSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgdHJhbnNhY3Rpb24ncyBzZWNyZXQga2V5IGZyb20gaXRzIGhhc2guXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gdHJhbnNhY3Rpb24ncyBoYXNoXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gLSB0cmFuc2FjdGlvbidzIHNlY3JldCBrZXlcbiAgICovXG4gIGFzeW5jIGdldFR4S2V5KHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ2hlY2sgYSB0cmFuc2FjdGlvbiBpbiB0aGUgYmxvY2tjaGFpbiB3aXRoIGl0cyBzZWNyZXQga2V5LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIHRyYW5zYWN0aW9uIHRvIGNoZWNrXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEtleSAtIHRyYW5zYWN0aW9uJ3Mgc2VjcmV0IGtleVxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIGRlc3RpbmF0aW9uIHB1YmxpYyBhZGRyZXNzIG9mIHRoZSB0cmFuc2FjdGlvblxuICAgKiBAcmV0dXJuIHtyb21pc2U8TW9uZXJvQ2hlY2tUeD59IHRoZSByZXN1bHQgb2YgdGhlIGNoZWNrXG4gICAqL1xuICBhc3luYyBjaGVja1R4S2V5KHR4SGFzaDogc3RyaW5nLCB0eEtleTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb0NoZWNrVHg+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgdHJhbnNhY3Rpb24gc2lnbmF0dXJlIHRvIHByb3ZlIGl0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIHRyYW5zYWN0aW9uIHRvIHByb3ZlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gZGVzdGluYXRpb24gcHVibGljIGFkZHJlc3Mgb2YgdGhlIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbWVzc2FnZV0gLSBtZXNzYWdlIHRvIGluY2x1ZGUgd2l0aCB0aGUgc2lnbmF0dXJlIHRvIGZ1cnRoZXIgYXV0aGVudGljYXRlIHRoZSBwcm9vZiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHRyYW5zYWN0aW9uIHNpZ25hdHVyZVxuICAgKi9cbiAgYXN5bmMgZ2V0VHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogUHJvdmUgYSB0cmFuc2FjdGlvbiBieSBjaGVja2luZyBpdHMgc2lnbmF0dXJlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIHRyYW5zYWN0aW9uIHRvIHByb3ZlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gZGVzdGluYXRpb24gcHVibGljIGFkZHJlc3Mgb2YgdGhlIHRyYW5zYWN0aW9uXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgdW5kZWZpbmVkfSBtZXNzYWdlIC0gbWVzc2FnZSBpbmNsdWRlZCB3aXRoIHRoZSBzaWduYXR1cmUgdG8gZnVydGhlciBhdXRoZW50aWNhdGUgdGhlIHByb29mXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzaWduYXR1cmUgIC0gdHJhbnNhY3Rpb24gc2lnbmF0dXJlIHRvIGNvbmZpcm1cbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9DaGVja1R4Pn0gdGhlIHJlc3VsdCBvZiB0aGUgY2hlY2tcbiAgICovXG4gIGFzeW5jIGNoZWNrVHhQcm9vZih0eEhhc2g6IHN0cmluZywgYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdlbmVyYXRlIGEgc2lnbmF0dXJlIHRvIHByb3ZlIGEgc3BlbmQuIFVubGlrZSBwcm92aW5nIGEgdHJhbnNhY3Rpb24sIGl0IGRvZXMgbm90IHJlcXVpcmUgdGhlIGRlc3RpbmF0aW9uIHB1YmxpYyBhZGRyZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIHRyYW5zYWN0aW9uIHRvIHByb3ZlXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbWVzc2FnZV0gLSBtZXNzYWdlIHRvIGluY2x1ZGUgd2l0aCB0aGUgc2lnbmF0dXJlIHRvIGZ1cnRoZXIgYXV0aGVudGljYXRlIHRoZSBwcm9vZiAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHRyYW5zYWN0aW9uIHNpZ25hdHVyZVxuICAgKi9cbiAgYXN5bmMgZ2V0U3BlbmRQcm9vZih0eEhhc2g6IHN0cmluZywgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFByb3ZlIGEgc3BlbmQgdXNpbmcgYSBzaWduYXR1cmUuIFVubGlrZSBwcm92aW5nIGEgdHJhbnNhY3Rpb24sIGl0IGRvZXMgbm90IHJlcXVpcmUgdGhlIGRlc3RpbmF0aW9uIHB1YmxpYyBhZGRyZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIHRyYW5zYWN0aW9uIHRvIHByb3ZlXG4gICAqIEBwYXJhbSB7c3RyaW5nIHwgdW5kZWZpbmVkfSBtZXNzYWdlIC0gbWVzc2FnZSBpbmNsdWRlZCB3aXRoIHRoZSBzaWduYXR1cmUgdG8gZnVydGhlciBhdXRoZW50aWNhdGUgdGhlIHByb29mIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IHNpZ25hdHVyZSAtIHRyYW5zYWN0aW9uIHNpZ25hdHVyZSB0byBjb25maXJtXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIHNpZ25hdHVyZSBpcyBnb29kLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGNoZWNrU3BlbmRQcm9vZih0eEhhc2g6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhIHNpZ25hdHVyZSB0byBwcm92ZSB0aGUgZW50aXJlIGJhbGFuY2Ugb2YgdGhlIHdhbGxldC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbbWVzc2FnZV0gLSBtZXNzYWdlIGluY2x1ZGVkIHdpdGggdGhlIHNpZ25hdHVyZSB0byBmdXJ0aGVyIGF1dGhlbnRpY2F0ZSB0aGUgcHJvb2YgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSByZXNlcnZlIHByb29mIHNpZ25hdHVyZVxuICAgKi9cbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mV2FsbGV0KG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhIHNpZ25hdHVyZSB0byBwcm92ZSBhbiBhdmFpbGFibGUgYW1vdW50IGluIGFuIGFjY291bnQuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gYWNjb3VudElkeCAtIGFjY291bnQgdG8gcHJvdmUgb3duZXJzaGlwIG9mIHRoZSBhbW91bnRcbiAgICogQHBhcmFtIHtiaWdpbnR9IGFtb3VudCAtIG1pbmltdW0gYW1vdW50IHRvIHByb3ZlIGFzIGF2YWlsYWJsZSBpbiB0aGUgYWNjb3VudFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW21lc3NhZ2VdIC0gbWVzc2FnZSB0byBpbmNsdWRlIHdpdGggdGhlIHNpZ25hdHVyZSB0byBmdXJ0aGVyIGF1dGhlbnRpY2F0ZSB0aGUgcHJvb2YgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSByZXNlcnZlIHByb29mIHNpZ25hdHVyZVxuICAgKi9cbiAgYXN5bmMgZ2V0UmVzZXJ2ZVByb29mQWNjb3VudChhY2NvdW50SWR4OiBudW1iZXIsIGFtb3VudDogYmlnaW50LCBtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFByb3ZlcyBhIHdhbGxldCBoYXMgYSBkaXNwb3NhYmxlIHJlc2VydmUgdXNpbmcgYSBzaWduYXR1cmUuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIHB1YmxpYyB3YWxsZXQgYWRkcmVzc1xuICAgKiBAcGFyYW0ge3N0cmluZyB8IHVuZGVmaW5lZH0gbWVzc2FnZSAtIG1lc3NhZ2UgaW5jbHVkZWQgd2l0aCB0aGUgc2lnbmF0dXJlIHRvIGZ1cnRoZXIgYXV0aGVudGljYXRlIHRoZSBwcm9vZiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzaWduYXR1cmUgLSByZXNlcnZlIHByb29mIHNpZ25hdHVyZSB0byBjaGVja1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0NoZWNrUmVzZXJ2ZT59IHRoZSByZXN1bHQgb2YgY2hlY2tpbmcgdGhlIHNpZ25hdHVyZSBwcm9vZlxuICAgKi9cbiAgYXN5bmMgY2hlY2tSZXNlcnZlUHJvb2YoYWRkcmVzczogc3RyaW5nLCBtZXNzYWdlOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1Jlc2VydmU+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGEgdHJhbnNhY3Rpb24gbm90ZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSB0cmFuc2FjdGlvbiB0byBnZXQgdGhlIG5vdGUgb2ZcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgdHggbm90ZVxuICAgKi9cbiAgYXN5bmMgZ2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0VHhOb3RlcyhbdHhIYXNoXSkpWzBdO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IG5vdGVzIGZvciBtdWx0aXBsZSB0cmFuc2FjdGlvbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSB0eEhhc2hlcyAtIGhhc2hlcyBvZiB0aGUgdHJhbnNhY3Rpb25zIHRvIGdldCBub3RlcyBmb3JcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmdbXT59IG5vdGVzIGZvciB0aGUgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBnZXRUeE5vdGVzKHR4SGFzaGVzOiBzdHJpbmdbXSk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2V0IGEgbm90ZSBmb3IgYSBzcGVjaWZpYyB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSBoYXNoIG9mIHRoZSB0cmFuc2FjdGlvbiB0byBzZXQgYSBub3RlIGZvclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbm90ZSAtIHRoZSB0cmFuc2FjdGlvbiBub3RlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXRUeE5vdGUodHhIYXNoOiBzdHJpbmcsIG5vdGU6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuc2V0VHhOb3RlcyhbdHhIYXNoXSwgW25vdGVdKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCBub3RlcyBmb3IgbXVsdGlwbGUgdHJhbnNhY3Rpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gdHhIYXNoZXMgLSB0cmFuc2FjdGlvbnMgdG8gc2V0IG5vdGVzIGZvclxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBub3RlcyAtIG5vdGVzIHRvIHNldCBmb3IgdGhlIHRyYW5zYWN0aW9uc1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10sIG5vdGVzOiBzdHJpbmdbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYWRkcmVzcyBib29rIGVudHJpZXMuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcltdfSBbZW50cnlJbmRpY2VzXSAtIGluZGljZXMgb2YgdGhlIGVudHJpZXMgdG8gZ2V0XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVtdPn0gdGhlIGFkZHJlc3MgYm9vayBlbnRyaWVzXG4gICAqL1xuICBhc3luYyBnZXRBZGRyZXNzQm9va0VudHJpZXMoZW50cnlJbmRpY2VzPzogbnVtYmVyW10pOiBQcm9taXNlPE1vbmVyb0FkZHJlc3NCb29rRW50cnlbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBBZGQgYW4gYWRkcmVzcyBib29rIGVudHJ5LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBlbnRyeSBhZGRyZXNzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbZGVzY3JpcHRpb25dIC0gZW50cnkgZGVzY3JpcHRpb24gKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBpbmRleCBvZiB0aGUgYWRkZWQgZW50cnlcbiAgICovXG4gIGFzeW5jIGFkZEFkZHJlc3NCb29rRW50cnkoYWRkcmVzczogc3RyaW5nLCBkZXNjcmlwdGlvbj86IHN0cmluZyk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEVkaXQgYW4gYWRkcmVzcyBib29rIGVudHJ5LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGluZGV4IC0gaW5kZXggb2YgdGhlIGFkZHJlc3MgYm9vayBlbnRyeSB0byBlZGl0XG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gc2V0QWRkcmVzcyAtIHNwZWNpZmllcyBpZiB0aGUgYWRkcmVzcyBzaG91bGQgYmUgdXBkYXRlZFxuICAgKiBAcGFyYW0ge3N0cmluZyB8IHVuZGVmaW5lZH0gYWRkcmVzcyAtIHVwZGF0ZWQgYWRkcmVzc1xuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNldERlc2NyaXB0aW9uIC0gc3BlY2lmaWVzIGlmIHRoZSBkZXNjcmlwdGlvbiBzaG91bGQgYmUgdXBkYXRlZFxuICAgKiBAcGFyYW0ge3N0cmluZyB8IHVuZGVmaW5lZH0gZGVzY3JpcHRpb24gLSB1cGRhdGVkIGRlc2NyaXB0aW9uXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBlZGl0QWRkcmVzc0Jvb2tFbnRyeShpbmRleDogbnVtYmVyLCBzZXRBZGRyZXNzOiBib29sZWFuLCBhZGRyZXNzOiBzdHJpbmcgfCB1bmRlZmluZWQsIHNldERlc2NyaXB0aW9uOiBib29sZWFuLCBkZXNjcmlwdGlvbjogc3RyaW5nIHwgdW5kZWZpbmVkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlbGV0ZSBhbiBhZGRyZXNzIGJvb2sgZW50cnkuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gZW50cnlJZHggLSBpbmRleCBvZiB0aGUgZW50cnkgdG8gZGVsZXRlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBkZWxldGVBZGRyZXNzQm9va0VudHJ5KGVudHJ5SWR4OiBudW1iZXIpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogVGFnIGFjY291bnRzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyAtIHRhZyB0byBhcHBseSB0byB0aGUgc3BlY2lmaWVkIGFjY291bnRzXG4gICAqIEBwYXJhbSB7bnVtYmVyW119IGFjY291bnRJbmRpY2VzIC0gaW5kaWNlcyBvZiB0aGUgYWNjb3VudHMgdG8gdGFnXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyB0YWdBY2NvdW50cyh0YWc6IHN0cmluZywgYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBVbnRhZyBhY2NvdW50cy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyW119IGFjY291bnRJbmRpY2VzIC0gaW5kaWNlcyBvZiB0aGUgYWNjb3VudHMgdG8gdW50YWdcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHVudGFnQWNjb3VudHMoYWNjb3VudEluZGljZXM6IG51bWJlcltdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFJldHVybiBhbGwgYWNjb3VudCB0YWdzLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9BY2NvdW50VGFnW10+fSB0aGUgd2FsbGV0J3MgYWNjb3VudCB0YWdzXG4gICAqL1xuICBhc3luYyBnZXRBY2NvdW50VGFncygpOiBQcm9taXNlPE1vbmVyb0FjY291bnRUYWdbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogU2V0cyBhIGh1bWFuLXJlYWRhYmxlIGRlc2NyaXB0aW9uIGZvciBhIHRhZy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgLSB0YWcgdG8gc2V0IGEgZGVzY3JpcHRpb24gZm9yXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBsYWJlbCAtIGxhYmVsIHRvIHNldCBmb3IgdGhlIHRhZ1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0QWNjb3VudFRhZ0xhYmVsKHRhZzogc3RyaW5nLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBwYXltZW50IFVSSSBmcm9tIGEgc2VuZCBjb25maWd1cmF0aW9uLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9UeENvbmZpZ30gY29uZmlnIC0gc3BlY2lmaWVzIGNvbmZpZ3VyYXRpb24gZm9yIGEgcG90ZW50aWFsIHR4XG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHBheW1lbnQgdXJpXG4gICAqL1xuICBhc3luYyBnZXRQYXltZW50VXJpKGNvbmZpZzogTW9uZXJvVHhDb25maWcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBQYXJzZXMgYSBwYXltZW50IFVSSSB0byBhIHR4IGNvbmZpZy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1cmkgLSBwYXltZW50IHVyaSB0byBwYXJzZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1R4Q29uZmlnPn0gdGhlIHNlbmQgY29uZmlndXJhdGlvbiBwYXJzZWQgZnJvbSB0aGUgdXJpXG4gICAqL1xuICBhc3luYyBwYXJzZVBheW1lbnRVcmkodXJpOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4Q29uZmlnPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhbiBhdHRyaWJ1dGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5IC0gYXR0cmlidXRlIHRvIGdldCB0aGUgdmFsdWUgb2ZcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgYXR0cmlidXRlJ3MgdmFsdWVcbiAgICovXG4gIGFzeW5jIGdldEF0dHJpYnV0ZShrZXk6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCBhbiBhcmJpdHJhcnkgYXR0cmlidXRlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSAtIGF0dHJpYnV0ZSBrZXlcbiAgICogQHBhcmFtIHtzdHJpbmd9IHZhbCAtIGF0dHJpYnV0ZSB2YWx1ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0QXR0cmlidXRlKGtleTogc3RyaW5nLCB2YWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTdGFydCBtaW5pbmcuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW251bVRocmVhZHNdIC0gbnVtYmVyIG9mIHRocmVhZHMgY3JlYXRlZCBmb3IgbWluaW5nIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbYmFja2dyb3VuZE1pbmluZ10gLSBzcGVjaWZpZXMgaWYgbWluaW5nIHNob3VsZCBvY2N1ciBpbiB0aGUgYmFja2dyb3VuZCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2lnbm9yZUJhdHRlcnldIC0gc3BlY2lmaWVzIGlmIHRoZSBiYXR0ZXJ5IHNob3VsZCBiZSBpZ25vcmVkIGZvciBtaW5pbmcgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc3RhcnRNaW5pbmcobnVtVGhyZWFkczogbnVtYmVyLCBiYWNrZ3JvdW5kTWluaW5nPzogYm9vbGVhbiwgaWdub3JlQmF0dGVyeT86IGJvb2xlYW4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3RvcCBtaW5pbmcuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc3RvcE1pbmluZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIGltcG9ydGluZyBtdWx0aXNpZyBkYXRhIGlzIG5lZWRlZCBmb3IgcmV0dXJuaW5nIGEgY29ycmVjdCBiYWxhbmNlLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiBpbXBvcnRpbmcgbXVsdGlzaWcgZGF0YSBpcyBuZWVkZWQgZm9yIHJldHVybmluZyBhIGNvcnJlY3QgYmFsYW5jZSwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBpc011bHRpc2lnSW1wb3J0TmVlZGVkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhpcyB3YWxsZXQgaXMgYSBtdWx0aXNpZyB3YWxsZXQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoaXMgaXMgYSBtdWx0aXNpZyB3YWxsZXQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNNdWx0aXNpZygpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0TXVsdGlzaWdJbmZvKCkpLmdldElzTXVsdGlzaWcoKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBtdWx0aXNpZyBpbmZvIGFib3V0IHRoaXMgd2FsbGV0LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luZm8+fSBtdWx0aXNpZyBpbmZvIGFib3V0IHRoaXMgd2FsbGV0XG4gICAqL1xuICBhc3luYyBnZXRNdWx0aXNpZ0luZm8oKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luZm8+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IG11bHRpc2lnIGluZm8gYXMgaGV4IHRvIHNoYXJlIHdpdGggcGFydGljaXBhbnRzIHRvIGJlZ2luIGNyZWF0aW5nIGFcbiAgICogbXVsdGlzaWcgd2FsbGV0LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGlzIHdhbGxldCdzIG11bHRpc2lnIGhleCB0byBzaGFyZSB3aXRoIHBhcnRpY2lwYW50c1xuICAgKi9cbiAgYXN5bmMgcHJlcGFyZU11bHRpc2lnKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIE1ha2UgdGhpcyB3YWxsZXQgbXVsdGlzaWcgYnkgaW1wb3J0aW5nIG11bHRpc2lnIGhleCBmcm9tIHBhcnRpY2lwYW50cy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IG11bHRpc2lnSGV4ZXMgLSBtdWx0aXNpZyBoZXggZnJvbSBlYWNoIHBhcnRpY2lwYW50XG4gICAqIEBwYXJhbSB7bnVtYmVyfSB0aHJlc2hvbGQgLSBudW1iZXIgb2Ygc2lnbmF0dXJlcyBuZWVkZWQgdG8gc2lnbiB0cmFuc2ZlcnNcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBhc3N3b3JkIC0gd2FsbGV0IHBhc3N3b3JkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhpcyB3YWxsZXQncyBtdWx0aXNpZyBoZXggdG8gc2hhcmUgd2l0aCBwYXJ0aWNpcGFudHNcbiAgICovXG4gIGFzeW5jIG1ha2VNdWx0aXNpZyhtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSwgdGhyZXNob2xkOiBudW1iZXIsIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBFeGNoYW5nZSBtdWx0aXNpZyBoZXggd2l0aCBwYXJ0aWNpcGFudHMgaW4gYSBNL04gbXVsdGlzaWcgd2FsbGV0LlxuICAgKiBcbiAgICogVGhpcyBwcm9jZXNzIG11c3QgYmUgcmVwZWF0ZWQgd2l0aCBwYXJ0aWNpcGFudHMgZXhhY3RseSBOLU0gdGltZXMuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBtdWx0aXNpZ0hleGVzIGFyZSBtdWx0aXNpZyBoZXggZnJvbSBlYWNoIHBhcnRpY2lwYW50XG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZCAtIHdhbGxldCdzIHBhc3N3b3JkIC8vIFRPRE8gbW9uZXJvLXByb2plY3Q6IHJlZHVuZGFudD8gd2FsbGV0IGlzIGNyZWF0ZWQgd2l0aCBwYXNzd29yZFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdD59IHRoZSByZXN1bHQgd2hpY2ggaGFzIHRoZSBtdWx0aXNpZydzIGFkZHJlc3MgeG9yIHRoaXMgd2FsbGV0J3MgbXVsdGlzaWcgaGV4IHRvIHNoYXJlIHdpdGggcGFydGljaXBhbnRzIGlmZiBub3QgZG9uZVxuICAgKi9cbiAgYXN5bmMgZXhjaGFuZ2VNdWx0aXNpZ0tleXMobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHBhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb011bHRpc2lnSW5pdFJlc3VsdD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBFeHBvcnQgdGhpcyB3YWxsZXQncyBtdWx0aXNpZyBpbmZvIGFzIGhleCBmb3Igb3RoZXIgcGFydGljaXBhbnRzLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGlzIHdhbGxldCdzIG11bHRpc2lnIGluZm8gYXMgaGV4IGZvciBvdGhlciBwYXJ0aWNpcGFudHNcbiAgICovXG4gIGFzeW5jIGV4cG9ydE11bHRpc2lnSGV4KCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZD9cIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbXBvcnQgbXVsdGlzaWcgaW5mbyBhcyBoZXggZnJvbSBvdGhlciBwYXJ0aWNpcGFudHMuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBtdWx0aXNpZ0hleGVzIC0gbXVsdGlzaWcgaGV4IGZyb20gZWFjaCBwYXJ0aWNpcGFudFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBudW1iZXIgb2Ygb3V0cHV0cyBzaWduZWQgd2l0aCB0aGUgZ2l2ZW4gbXVsdGlzaWcgaGV4XG4gICAqL1xuICBhc3luYyBpbXBvcnRNdWx0aXNpZ0hleChtdWx0aXNpZ0hleGVzOiBzdHJpbmdbXSk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNpZ24gbXVsdGlzaWcgdHJhbnNhY3Rpb25zIGZyb20gYSBtdWx0aXNpZyB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbXVsdGlzaWdUeEhleCAtIHVuc2lnbmVkIG11bHRpc2lnIHRyYW5zYWN0aW9ucyBhcyBoZXhcbiAgICogQHJldHVybiB7TW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0fSB0aGUgcmVzdWx0IG9mIHNpZ25pbmcgdGhlIG11bHRpc2lnIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgc2lnbk11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3VibWl0IHNpZ25lZCBtdWx0aXNpZyB0cmFuc2FjdGlvbnMgZnJvbSBhIG11bHRpc2lnIHdhbGxldC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzaWduZWRNdWx0aXNpZ1R4SGV4IC0gc2lnbmVkIG11bHRpc2lnIGhleCByZXR1cm5lZCBmcm9tIHNpZ25NdWx0aXNpZ1R4SGV4KClcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmdbXT59IHRoZSByZXN1bHRpbmcgdHJhbnNhY3Rpb24gaGFzaGVzXG4gICAqL1xuICBhc3luYyBzdWJtaXRNdWx0aXNpZ1R4SGV4KHNpZ25lZE11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQ2hhbmdlIHRoZSB3YWxsZXQgcGFzc3dvcmQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gb2xkUGFzc3dvcmQgLSB0aGUgd2FsbGV0J3Mgb2xkIHBhc3N3b3JkXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBuZXdQYXNzd29yZCAtIHRoZSB3YWxsZXQncyBuZXcgcGFzc3dvcmRcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIGNoYW5nZVBhc3N3b3JkKG9sZFBhc3N3b3JkOiBzdHJpbmcsIG5ld1Bhc3N3b3JkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2F2ZSB0aGUgd2FsbGV0IGF0IGl0cyBjdXJyZW50IHBhdGguXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2F2ZSgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogT3B0aW9uYWxseSBzYXZlIHRoZW4gY2xvc2UgdGhlIHdhbGxldC5cbiAgICpcbiAgICogQHBhcmFtIHtib29sZWFufSBbc2F2ZV0gLSBzcGVjaWZpZXMgaWYgdGhlIHdhbGxldCBzaG91bGQgYmUgc2F2ZWQgYmVmb3JlIGJlaW5nIGNsb3NlZCAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIGNsb3NlKHNhdmUgPSBmYWxzZSk6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyKSB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyLnJlbW92ZUxpc3RlbmVyKHRoaXMuY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcik7XG4gICAgdGhpcy5jb25uZWN0aW9uTWFuYWdlciA9IHVuZGVmaW5lZDtcbiAgICB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIgPSB1bmRlZmluZWQ7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhpcyB3YWxsZXQgaXMgY2xvc2VkIG9yIG5vdC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgdGhlIHdhbGxldCBpcyBjbG9zZWQsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNDbG9zZWQoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLy8gLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0gUFJJVkFURSAtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgbm9ybWFsaXplVHhRdWVyeShxdWVyeSkge1xuICAgIGlmIChxdWVyeSBpbnN0YW5jZW9mIE1vbmVyb1R4UXVlcnkpIHF1ZXJ5ID0gcXVlcnkuY29weSgpO1xuICAgIGVsc2UgaWYgKEFycmF5LmlzQXJyYXkocXVlcnkpKSBxdWVyeSA9IG5ldyBNb25lcm9UeFF1ZXJ5KCkuc2V0SGFzaGVzKHF1ZXJ5KTtcbiAgICBlbHNlIHtcbiAgICAgIHF1ZXJ5ID0gT2JqZWN0LmFzc2lnbih7fSwgcXVlcnkpO1xuICAgICAgcXVlcnkgPSBuZXcgTW9uZXJvVHhRdWVyeShxdWVyeSk7XG4gICAgfVxuICAgIGlmIChxdWVyeS5nZXRCbG9jaygpID09PSB1bmRlZmluZWQpIHF1ZXJ5LnNldEJsb2NrKG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbcXVlcnldKSk7XG4gICAgaWYgKHF1ZXJ5LmdldElucHV0UXVlcnkoKSkgcXVlcnkuZ2V0SW5wdXRRdWVyeSgpLnNldFR4UXVlcnkocXVlcnkpO1xuICAgIGlmIChxdWVyeS5nZXRPdXRwdXRRdWVyeSgpKSBxdWVyeS5nZXRPdXRwdXRRdWVyeSgpLnNldFR4UXVlcnkocXVlcnkpO1xuICAgIHJldHVybiBxdWVyeTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KSB7XG4gICAgcXVlcnkgPSBuZXcgTW9uZXJvVHJhbnNmZXJRdWVyeShxdWVyeSk7XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICBsZXQgdHhRdWVyeSA9IHF1ZXJ5LmdldFR4UXVlcnkoKS5jb3B5KCk7XG4gICAgICBxdWVyeSA9IHR4UXVlcnkuZ2V0VHJhbnNmZXJRdWVyeSgpO1xuICAgIH1cbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpID09PSB1bmRlZmluZWQpIHF1ZXJ5LnNldFR4UXVlcnkobmV3IE1vbmVyb1R4UXVlcnkoKSk7XG4gICAgcXVlcnkuZ2V0VHhRdWVyeSgpLnNldFRyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0QmxvY2soKSA9PT0gdW5kZWZpbmVkKSBxdWVyeS5nZXRUeFF1ZXJ5KCkuc2V0QmxvY2sobmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtxdWVyeS5nZXRUeFF1ZXJ5KCldKSk7XG4gICAgcmV0dXJuIHF1ZXJ5O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZU91dHB1dFF1ZXJ5KHF1ZXJ5KSB7XG4gICAgcXVlcnkgPSBuZXcgTW9uZXJvT3V0cHV0UXVlcnkocXVlcnkpO1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHR4UXVlcnkgPSBxdWVyeS5nZXRUeFF1ZXJ5KCkuY29weSgpO1xuICAgICAgcXVlcnkgPSB0eFF1ZXJ5LmdldE91dHB1dFF1ZXJ5KCk7XG4gICAgfVxuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkgPT09IHVuZGVmaW5lZCkgcXVlcnkuc2V0VHhRdWVyeShuZXcgTW9uZXJvVHhRdWVyeSgpKTtcbiAgICBxdWVyeS5nZXRUeFF1ZXJ5KCkuc2V0T3V0cHV0UXVlcnkocXVlcnkpO1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkuZ2V0QmxvY2soKSA9PT0gdW5kZWZpbmVkKSBxdWVyeS5nZXRUeFF1ZXJ5KCkuc2V0QmxvY2sobmV3IE1vbmVyb0Jsb2NrKCkuc2V0VHhzKFtxdWVyeS5nZXRUeFF1ZXJ5KCldKSk7XG4gICAgcmV0dXJuIHF1ZXJ5O1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpIHtcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQgfHwgIShjb25maWcgaW5zdGFuY2VvZiBPYmplY3QpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgTW9uZXJvVHhDb25maWcgb3IgZXF1aXZhbGVudCBKUyBvYmplY3RcIik7XG4gICAgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gICAgYXNzZXJ0KGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKSAmJiBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoID4gMCwgXCJNdXN0IHByb3ZpZGUgZGVzdGluYXRpb25zXCIpO1xuICAgIGFzc2VydC5lcXVhbChjb25maWcuZ2V0U3dlZXBFYWNoU3ViYWRkcmVzcygpLCB1bmRlZmluZWQpO1xuICAgIGFzc2VydC5lcXVhbChjb25maWcuZ2V0QmVsb3dBbW91bnQoKSwgdW5kZWZpbmVkKTtcbiAgICByZXR1cm4gY29uZmlnO1xuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZVN3ZWVwT3V0cHV0Q29uZmlnKGNvbmZpZykge1xuICAgIGlmIChjb25maWcgPT09IHVuZGVmaW5lZCB8fCAhKGNvbmZpZyBpbnN0YW5jZW9mIE9iamVjdCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBNb25lcm9UeENvbmZpZyBvciBlcXVpdmFsZW50IEpTIG9iamVjdFwiKTtcbiAgICBjb25maWcgPSBuZXcgTW9uZXJvVHhDb25maWcoY29uZmlnKTtcbiAgICBhc3NlcnQuZXF1YWwoY29uZmlnLmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSwgdW5kZWZpbmVkKTtcbiAgICBhc3NlcnQuZXF1YWwoY29uZmlnLmdldEJlbG93QW1vdW50KCksIHVuZGVmaW5lZCk7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbmZpZy5nZXRDYW5TcGxpdCgpLCB1bmRlZmluZWQsIFwiQ2Fubm90IHNwbGl0IHRyYW5zYWN0aW9ucyB3aGVuIHN3ZWVwaW5nIGFuIG91dHB1dFwiKTtcbiAgICBpZiAoIWNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKSB8fCBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoICE9PSAxIHx8ICFjb25maWcuZ2V0RGVzdGluYXRpb25zKClbMF0uZ2V0QWRkcmVzcygpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZXhhY3RseSBvbmUgZGVzdGluYXRpb24gYWRkcmVzcyB0byBzd2VlcCBvdXRwdXQgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJ0cmFjdEZlZUZyb20oKSAmJiBjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkubGVuZ3RoID4gMCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiU3dlZXAgdHJhbnNhY3Rpb25zIGRvIG5vdCBzdXBwb3J0IHN1YnRyYWN0aW5nIGZlZXMgZnJvbSBkZXN0aW5hdGlvbnNcIik7XG4gICAgcmV0dXJuIGNvbmZpZzsgIFxuICB9XG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWcoY29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkIHx8ICEoY29uZmlnIGluc3RhbmNlb2YgT2JqZWN0KSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIE1vbmVyb1R4Q29uZmlnIG9yIGVxdWl2YWxlbnQgSlMgb2JqZWN0XCIpO1xuICAgIGNvbmZpZyA9IG5ldyBNb25lcm9UeENvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkgPT09IHVuZGVmaW5lZCB8fCBjb25maWcuZ2V0RGVzdGluYXRpb25zKCkubGVuZ3RoICE9IDEpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBleGFjdGx5IG9uZSBkZXN0aW5hdGlvbiB0byBzd2VlcCB0b1wiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSA9PT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZGVzdGluYXRpb24gYWRkcmVzcyB0byBzd2VlcCB0b1wiKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFtb3VudCgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIkNhbm5vdCBwcm92aWRlIGFtb3VudCBpbiBzd2VlcCBjb25maWdcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRLZXlJbWFnZSgpICE9PSB1bmRlZmluZWQpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIktleSBpbWFnZSBkZWZpbmVkOyB1c2Ugc3dlZXBPdXRwdXQoKSB0byBzd2VlcCBhbiBvdXRwdXQgYnkgaXRzIGtleSBpbWFnZVwiKTtcbiAgICBpZiAoY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCAmJiBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKS5sZW5ndGggPT09IDApIGNvbmZpZy5zZXRTdWJhZGRyZXNzSW5kaWNlcyh1bmRlZmluZWQpO1xuICAgIGlmIChjb25maWcuZ2V0QWNjb3VudEluZGV4KCkgPT09IHVuZGVmaW5lZCAmJiBjb25maWcuZ2V0U3ViYWRkcmVzc0luZGljZXMoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgYWNjb3VudCBpbmRleCBpZiBzdWJhZGRyZXNzIGluZGljZXMgYXJlIHByb3ZpZGVkXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkgJiYgY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpLmxlbmd0aCA+IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN3ZWVwIHRyYW5zYWN0aW9ucyBkbyBub3Qgc3VwcG9ydCBzdWJ0cmFjdGluZyBmZWVzIGZyb20gZGVzdGluYXRpb25zXCIpO1xuICAgIHJldHVybiBjb25maWc7XG4gIH1cbn1cbiJdLCJtYXBwaW5ncyI6InlMQUFBLElBQUFBLE9BQUEsR0FBQUMsc0JBQUEsQ0FBQUMs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