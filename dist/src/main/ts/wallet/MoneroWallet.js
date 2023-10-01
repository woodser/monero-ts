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
   * @param {MoneroDestination[] | MoneroDestinationModel[]} config.destinations - addresses and amounts in a multi-destination tx (required unless `address` and `amount` provided)
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
    if (config.getSubtractFeeFrom() && config.getSubtractFeeFrom().length > 0) throw new _MoneroError.default("Sweep transfers do not support subtracting fees from destinations");
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
    return config;
  }
}exports.default = MoneroWallet;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJuYW1lcyI6WyJfYXNzZXJ0IiwiX2ludGVyb3BSZXF1aXJlRGVmYXVsdCIsInJlcXVpcmUiLCJfTW9uZXJvQmxvY2siLCJfTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciIsIl9Nb25lcm9FcnJvciIsIl9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIl9Nb25lcm9PdXRwdXRRdWVyeSIsIl9Nb25lcm9UcmFuc2ZlclF1ZXJ5IiwiX01vbmVyb1R4Q29uZmlnIiwiX01vbmVyb1R4UXVlcnkiLCJfTW9uZXJvVHhTZXQiLCJNb25lcm9XYWxsZXQiLCJERUZBVUxUX0xBTkdVQUdFIiwiYWRkTGlzdGVuZXIiLCJsaXN0ZW5lciIsIkVycm9yIiwicmVtb3ZlTGlzdGVuZXIiLCJnZXRMaXN0ZW5lcnMiLCJpc1ZpZXdPbmx5IiwiTW9uZXJvRXJyb3IiLCJzZXREYWVtb25Db25uZWN0aW9uIiwidXJpT3JDb25uZWN0aW9uIiwiZ2V0RGFlbW9uQ29ubmVjdGlvbiIsInNldENvbm5lY3Rpb25NYW5hZ2VyIiwiY29ubmVjdGlvbk1hbmFnZXIiLCJjb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyIiwidGhhdCIsIk1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIiLCJvbkNvbm5lY3Rpb25DaGFuZ2VkIiwiY29ubmVjdGlvbiIsImdldENvbm5lY3Rpb24iLCJnZXRDb25uZWN0aW9uTWFuYWdlciIsImlzQ29ubmVjdGVkVG9EYWVtb24iLCJnZXRWZXJzaW9uIiwiZ2V0UGF0aCIsImdldFNlZWQiLCJnZXRTZWVkTGFuZ3VhZ2UiLCJnZXRQcml2YXRlVmlld0tleSIsImdldFByaXZhdGVTcGVuZEtleSIsImdldFB1YmxpY1ZpZXdLZXkiLCJnZXRQdWJsaWNTcGVuZEtleSIsImdldFByaW1hcnlBZGRyZXNzIiwiZ2V0QWRkcmVzcyIsImFjY291bnRJZHgiLCJzdWJhZGRyZXNzSWR4IiwiZ2V0QWRkcmVzc0luZGV4IiwiYWRkcmVzcyIsImdldEludGVncmF0ZWRBZGRyZXNzIiwic3RhbmRhcmRBZGRyZXNzIiwicGF5bWVudElkIiwiZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MiLCJpbnRlZ3JhdGVkQWRkcmVzcyIsImdldEhlaWdodCIsImdldERhZW1vbkhlaWdodCIsImdldEhlaWdodEJ5RGF0ZSIsInllYXIiLCJtb250aCIsImRheSIsInN5bmMiLCJsaXN0ZW5lck9yU3RhcnRIZWlnaHQiLCJzdGFydEhlaWdodCIsInN0YXJ0U3luY2luZyIsInN5bmNQZXJpb2RJbk1zIiwic3RvcFN5bmNpbmciLCJzY2FuVHhzIiwidHhIYXNoZXMiLCJyZXNjYW5TcGVudCIsInJlc2NhbkJsb2NrY2hhaW4iLCJnZXRCYWxhbmNlIiwiZ2V0VW5sb2NrZWRCYWxhbmNlIiwiZ2V0TnVtQmxvY2tzVG9VbmxvY2siLCJiYWxhbmNlIiwidW5kZWZpbmVkIiwidW5sb2NrZWRCYWxhbmNlIiwidHhzIiwiaGVpZ2h0IiwibnVtQmxvY2tzVG9OZXh0VW5sb2NrIiwiZ2V0VHhzIiwiaXNMb2NrZWQiLCJ0eCIsIm51bUJsb2Nrc1RvVW5sb2NrIiwiTWF0aCIsIm1heCIsImdldElzQ29uZmlybWVkIiwiZ2V0VW5sb2NrVGltZSIsIm1pbiIsIm51bUJsb2Nrc1RvTGFzdFVubG9jayIsImdldEFjY291bnRzIiwiaW5jbHVkZVN1YmFkZHJlc3NlcyIsInRhZyIsImdldEFjY291bnQiLCJjcmVhdGVBY2NvdW50IiwibGFiZWwiLCJzZXRBY2NvdW50TGFiZWwiLCJzZXRTdWJhZGRyZXNzTGFiZWwiLCJnZXRTdWJhZGRyZXNzZXMiLCJzdWJhZGRyZXNzSW5kaWNlcyIsImdldFN1YmFkZHJlc3MiLCJhc3NlcnQiLCJjcmVhdGVTdWJhZGRyZXNzIiwiZ2V0VHgiLCJ0eEhhc2giLCJsZW5ndGgiLCJxdWVyeSIsImdldFRyYW5zZmVycyIsImdldEluY29taW5nVHJhbnNmZXJzIiwicXVlcnlOb3JtYWxpemVkIiwibm9ybWFsaXplVHJhbnNmZXJRdWVyeSIsImdldElzSW5jb21pbmciLCJzZXRJc0luY29taW5nIiwiZ2V0T3V0Z29pbmdUcmFuc2ZlcnMiLCJnZXRJc091dGdvaW5nIiwic2V0SXNPdXRnb2luZyIsImdldE91dHB1dHMiLCJleHBvcnRPdXRwdXRzIiwiYWxsIiwiaW1wb3J0T3V0cHV0cyIsIm91dHB1dHNIZXgiLCJleHBvcnRLZXlJbWFnZXMiLCJpbXBvcnRLZXlJbWFnZXMiLCJrZXlJbWFnZXMiLCJnZXROZXdLZXlJbWFnZXNGcm9tTGFzdEltcG9ydCIsImZyZWV6ZU91dHB1dCIsImtleUltYWdlIiwidGhhd091dHB1dCIsImlzT3V0cHV0RnJvemVuIiwiY3JlYXRlVHgiLCJjb25maWciLCJjb25maWdOb3JtYWxpemVkIiwibm9ybWFsaXplQ3JlYXRlVHhzQ29uZmlnIiwiZ2V0Q2FuU3BsaXQiLCJlcXVhbCIsInNldENhblNwbGl0IiwiY3JlYXRlVHhzIiwic3dlZXBPdXRwdXQiLCJzd2VlcFVubG9ja2VkIiwic3dlZXBEdXN0IiwicmVsYXkiLCJyZWxheVR4IiwidHhPck1ldGFkYXRhIiwicmVsYXlUeHMiLCJ0eHNPck1ldGFkYXRhcyIsImRlc2NyaWJlVW5zaWduZWRUeFNldCIsInVuc2lnbmVkVHhIZXgiLCJkZXNjcmliZVR4U2V0IiwiTW9uZXJvVHhTZXQiLCJzZXRVbnNpZ25lZFR4SGV4IiwiZGVzY3JpYmVNdWx0aXNpZ1R4U2V0IiwibXVsdGlzaWdUeEhleCIsInNldE11bHRpc2lnVHhIZXgiLCJ0eFNldCIsInNpZ25UeHMiLCJzdWJtaXRUeHMiLCJzaWduZWRUeEhleCIsInNpZ25NZXNzYWdlIiwibWVzc2FnZSIsInNpZ25hdHVyZVR5cGUiLCJNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZSIsIlNJR05fV0lUSF9TUEVORF9LRVkiLCJ2ZXJpZnlNZXNzYWdlIiwic2lnbmF0dXJlIiwiZ2V0VHhLZXkiLCJjaGVja1R4S2V5IiwidHhLZXkiLCJnZXRUeFByb29mIiwiY2hlY2tUeFByb29mIiwiZ2V0U3BlbmRQcm9vZiIsImNoZWNrU3BlbmRQcm9vZiIsImdldFJlc2VydmVQcm9vZldhbGxldCIsImdldFJlc2VydmVQcm9vZkFjY291bnQiLCJhbW91bnQiLCJjaGVja1Jlc2VydmVQcm9vZiIsImdldFR4Tm90ZSIsImdldFR4Tm90ZXMiLCJzZXRUeE5vdGUiLCJub3RlIiwic2V0VHhOb3RlcyIsIm5vdGVzIiwiZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzIiwiZW50cnlJbmRpY2VzIiwiYWRkQWRkcmVzc0Jvb2tFbnRyeSIsImRlc2NyaXB0aW9uIiwiZWRpdEFkZHJlc3NCb29rRW50cnkiLCJpbmRleCIsInNldEFkZHJlc3MiLCJzZXREZXNjcmlwdGlvbiIsImRlbGV0ZUFkZHJlc3NCb29rRW50cnkiLCJlbnRyeUlkeCIsInRhZ0FjY291bnRzIiwiYWNjb3VudEluZGljZXMiLCJ1bnRhZ0FjY291bnRzIiwiZ2V0QWNjb3VudFRhZ3MiLCJzZXRBY2NvdW50VGFnTGFiZWwiLCJnZXRQYXltZW50VXJpIiwicGFyc2VQYXltZW50VXJpIiwidXJpIiwiZ2V0QXR0cmlidXRlIiwia2V5Iiwic2V0QXR0cmlidXRlIiwidmFsIiwic3RhcnRNaW5pbmciLCJudW1UaHJlYWRzIiwiYmFja2dyb3VuZE1pbmluZyIsImlnbm9yZUJhdHRlcnkiLCJzdG9wTWluaW5nIiwiaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCIsImlzTXVsdGlzaWciLCJnZXRNdWx0aXNpZ0luZm8iLCJnZXRJc011bHRpc2lnIiwicHJlcGFyZU11bHRpc2lnIiwibWFrZU11bHRpc2lnIiwibXVsdGlzaWdIZXhlcyIsInRocmVzaG9sZCIsInBhc3N3b3JkIiwiZXhjaGFuZ2VNdWx0aXNpZ0tleXMiLCJleHBvcnRNdWx0aXNpZ0hleCIsImltcG9ydE11bHRpc2lnSGV4Iiwic2lnbk11bHRpc2lnVHhIZXgiLCJzdWJtaXRNdWx0aXNpZ1R4SGV4Iiwic2lnbmVkTXVsdGlzaWdUeEhleCIsImNoYW5nZVBhc3N3b3JkIiwib2xkUGFzc3dvcmQiLCJuZXdQYXNzd29yZCIsInNhdmUiLCJjbG9zZSIsImlzQ2xvc2VkIiwibm9ybWFsaXplVHhRdWVyeSIsIk1vbmVyb1R4UXVlcnkiLCJjb3B5IiwiQXJyYXkiLCJpc0FycmF5Iiwic2V0SGFzaGVzIiwiT2JqZWN0IiwiYXNzaWduIiwiZ2V0QmxvY2siLCJzZXRCbG9jayIsIk1vbmVyb0Jsb2NrIiwic2V0VHhzIiwiZ2V0SW5wdXRRdWVyeSIsInNldFR4UXVlcnkiLCJnZXRPdXRwdXRRdWVyeSIsIk1vbmVyb1RyYW5zZmVyUXVlcnkiLCJnZXRUeFF1ZXJ5IiwidHhRdWVyeSIsImdldFRyYW5zZmVyUXVlcnkiLCJzZXRUcmFuc2ZlclF1ZXJ5Iiwibm9ybWFsaXplT3V0cHV0UXVlcnkiLCJNb25lcm9PdXRwdXRRdWVyeSIsInNldE91dHB1dFF1ZXJ5IiwiTW9uZXJvVHhDb25maWciLCJnZXREZXN0aW5hdGlvbnMiLCJnZXRTd2VlcEVhY2hTdWJhZGRyZXNzIiwiZ2V0QmVsb3dBbW91bnQiLCJub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyIsImdldFN1YnRyYWN0RmVlRnJvbSIsIm5vcm1hbGl6ZVN3ZWVwVW5sb2NrZWRDb25maWciLCJnZXRBbW91bnQiLCJnZXRLZXlJbWFnZSIsImdldFN1YmFkZHJlc3NJbmRpY2VzIiwic2V0U3ViYWRkcmVzc0luZGljZXMiLCJnZXRBY2NvdW50SW5kZXgiLCJleHBvcnRzIiwiZGVmYXVsdCJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL3NyYy9tYWluL3RzL3dhbGxldC9Nb25lcm9XYWxsZXQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XG5pbXBvcnQgR2VuVXRpbHMgZnJvbSBcIi4uL2NvbW1vbi9HZW5VdGlsc1wiO1xuaW1wb3J0IE1vbmVyb0FjY291bnQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFwiO1xuaW1wb3J0IE1vbmVyb0FjY291bnRUYWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWNjb3VudFRhZ1wiO1xuaW1wb3J0IE1vbmVyb0FkZHJlc3NCb29rRW50cnkgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQWRkcmVzc0Jvb2tFbnRyeVwiO1xuaW1wb3J0IE1vbmVyb0Jsb2NrIGZyb20gXCIuLi9kYWVtb24vbW9kZWwvTW9uZXJvQmxvY2tcIjtcbmltcG9ydCBNb25lcm9DaGVja1Jlc2VydmUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvQ2hlY2tSZXNlcnZlXCI7XG5pbXBvcnQgTW9uZXJvQ2hlY2tUeCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9DaGVja1R4XCI7XG5pbXBvcnQgTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXIgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9Db25uZWN0aW9uTWFuYWdlclwiO1xuaW1wb3J0IE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyXCI7XG5pbXBvcnQgTW9uZXJvRXJyb3IgZnJvbSBcIi4uL2NvbW1vbi9Nb25lcm9FcnJvclwiO1xuaW1wb3J0IE1vbmVyb0luY29taW5nVHJhbnNmZXIgZnJvbSBcIi4vbW9kZWwvTW9uZXJvSW5jb21pbmdUcmFuc2ZlclwiO1xuaW1wb3J0IE1vbmVyb0ludGVncmF0ZWRBZGRyZXNzIGZyb20gXCIuL21vZGVsL01vbmVyb0ludGVncmF0ZWRBZGRyZXNzXCI7XG5pbXBvcnQgTW9uZXJvS2V5SW1hZ2UgZnJvbSBcIi4uL2RhZW1vbi9tb2RlbC9Nb25lcm9LZXlJbWFnZVwiO1xuaW1wb3J0IE1vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb0tleUltYWdlSW1wb3J0UmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0XCI7XG5pbXBvcnQgTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGUgZnJvbSBcIi4vbW9kZWwvTW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGVcIjtcbmltcG9ydCBNb25lcm9NdWx0aXNpZ0luZm8gZnJvbSBcIi4vbW9kZWwvTW9uZXJvTXVsdGlzaWdJbmZvXCI7XG5pbXBvcnQgTW9uZXJvTXVsdGlzaWdJbml0UmVzdWx0IGZyb20gXCIuL21vZGVsL01vbmVyb011bHRpc2lnSW5pdFJlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb011bHRpc2lnU2lnblJlc3VsdCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9NdWx0aXNpZ1NpZ25SZXN1bHRcIjtcbmltcG9ydCBNb25lcm9PdXRwdXRRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRRdWVyeVwiO1xuaW1wb3J0IE1vbmVyb091dHB1dFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9PdXRwdXRXYWxsZXRcIjtcbmltcG9ydCBNb25lcm9PdXRnb2luZ1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb091dGdvaW5nVHJhbnNmZXJcIjtcbmltcG9ydCBNb25lcm9ScGNDb25uZWN0aW9uIGZyb20gXCIuLi9jb21tb24vTW9uZXJvUnBjQ29ubmVjdGlvblwiO1xuaW1wb3J0IE1vbmVyb1N1YmFkZHJlc3MgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3ViYWRkcmVzc1wiO1xuaW1wb3J0IE1vbmVyb1N5bmNSZXN1bHQgZnJvbSBcIi4vbW9kZWwvTW9uZXJvU3luY1Jlc3VsdFwiO1xuaW1wb3J0IE1vbmVyb1RyYW5zZmVyIGZyb20gXCIuL21vZGVsL01vbmVyb1RyYW5zZmVyXCI7XG5pbXBvcnQgTW9uZXJvVHJhbnNmZXJRdWVyeSBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UcmFuc2ZlclF1ZXJ5XCI7XG5pbXBvcnQgTW9uZXJvVHhDb25maWcgZnJvbSBcIi4vbW9kZWwvTW9uZXJvVHhDb25maWdcIjtcbmltcG9ydCBNb25lcm9UeFF1ZXJ5IGZyb20gXCIuL21vZGVsL01vbmVyb1R4UXVlcnlcIjtcbmltcG9ydCBNb25lcm9UeFdhbGxldCBmcm9tIFwiLi9tb2RlbC9Nb25lcm9UeFdhbGxldFwiO1xuaW1wb3J0IE1vbmVyb1R4U2V0IGZyb20gXCIuL21vZGVsL01vbmVyb1R4U2V0XCI7XG5pbXBvcnQgTW9uZXJvVmVyc2lvbiBmcm9tIFwiLi4vZGFlbW9uL21vZGVsL01vbmVyb1ZlcnNpb25cIjtcbmltcG9ydCBNb25lcm9XYWxsZXRMaXN0ZW5lciBmcm9tIFwiLi9tb2RlbC9Nb25lcm9XYWxsZXRMaXN0ZW5lclwiO1xuXG4vKipcbiAqIENvcHlyaWdodCAoYykgd29vZHNlclxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHlcbiAqIG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlIFwiU29mdHdhcmVcIiksIHRvIGRlYWxcbiAqIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHNcbiAqIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGxcbiAqIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXQgcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpc1xuICogZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGxcbiAqIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUlxuICogSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRiBNRVJDSEFOVEFCSUxJVFksXG4gKiBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEVcbiAqIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVJcbiAqIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1IgT1RIRVJXSVNFLCBBUklTSU5HIEZST00sXG4gKiBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRVxuICogU09GVFdBUkUuXG4gKi9cblxuLyoqXG4gKiBNb25lcm8gd2FsbGV0IGludGVyZmFjZSBhbmQgZGVmYXVsdCBpbXBsZW1lbnRhdGlvbnMuXG4gKiBcbiAqIEBpbnRlcmZhY2VcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgTW9uZXJvV2FsbGV0IHtcblxuICAvLyBzdGF0aWMgdmFyaWFibGVzXG4gIHN0YXRpYyByZWFkb25seSBERUZBVUxUX0xBTkdVQUdFID0gXCJFbmdsaXNoXCI7XG5cbiAgLy8gc3RhdGUgdmFyaWFibGVzXG4gIHByb3RlY3RlZCBjb25uZWN0aW9uTWFuYWdlcjogTW9uZXJvQ29ubmVjdGlvbk1hbmFnZXI7XG4gIHByb3RlY3RlZCBjb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyOiBNb25lcm9Db25uZWN0aW9uTWFuYWdlckxpc3RlbmVyO1xuICBcbiAgLyoqXG4gICAqIFJlZ2lzdGVyIGEgbGlzdGVuZXIgdG8gcmVjZWl2ZSB3YWxsZXQgbm90aWZpY2F0aW9ucy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvV2FsbGV0TGlzdGVuZXJ9IGxpc3RlbmVyIC0gbGlzdGVuZXIgdG8gcmVjZWl2ZSB3YWxsZXQgbm90aWZpY2F0aW9uc1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgYWRkTGlzdGVuZXIobGlzdGVuZXI6IE1vbmVyb1dhbGxldExpc3RlbmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IEVycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFVucmVnaXN0ZXIgYSBsaXN0ZW5lciB0byByZWNlaXZlIHdhbGxldCBub3RpZmljYXRpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHtNb25lcm9XYWxsZXRMaXN0ZW5lcn0gbGlzdGVuZXIgLSBsaXN0ZW5lciB0byB1bnJlZ2lzdGVyXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGxpc3RlbmVycyByZWdpc3RlcmVkIHdpdGggdGhlIHdhbGxldC5cbiAgICogXG4gICAqIEByZXR1cm4ge01vbmVyb1dhbGxldExpc3RlbmVyW119IHRoZSByZWdpc3RlcmVkIGxpc3RlbmVyc1xuICAgKi9cbiAgZ2V0TGlzdGVuZXJzKCk6IE1vbmVyb1dhbGxldExpc3RlbmVyW10ge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIHdhbGxldCBpcyB2aWV3LW9ubHksIG1lYW5pbmcgaXQgZG9lcyBub3QgaGF2ZSB0aGUgcHJpdmF0ZVxuICAgKiBzcGVuZCBrZXkgYW5kIGNhbiB0aGVyZWZvcmUgb25seSBvYnNlcnZlIGluY29taW5nIG91dHB1dHMuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSB3YWxsZXQgaXMgdmlldy1vbmx5LCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzVmlld09ubHkoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCB0aGUgd2FsbGV0J3MgZGFlbW9uIGNvbm5lY3Rpb24uXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1JwY0Nvbm5lY3Rpb24gfCBzdHJpbmd9IFt1cmlPckNvbm5lY3Rpb25dIC0gZGFlbW9uJ3MgVVJJIG9yIGNvbm5lY3Rpb24gKGRlZmF1bHRzIHRvIG9mZmxpbmUpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzZXREYWVtb25Db25uZWN0aW9uKHVyaU9yQ29ubmVjdGlvbj86IE1vbmVyb1JwY0Nvbm5lY3Rpb24gfCBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvbi5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvUnBjQ29ubmVjdGlvbj59IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvblxuICAgKi9cbiAgYXN5bmMgZ2V0RGFlbW9uQ29ubmVjdGlvbigpOiBQcm9taXNlPE1vbmVyb1JwY0Nvbm5lY3Rpb24+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCB0aGUgd2FsbGV0J3MgZGFlbW9uIGNvbm5lY3Rpb24gbWFuYWdlci5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvQ29ubmVjdGlvbk1hbmFnZXJ9IGNvbm5lY3Rpb25NYW5hZ2VyIG1hbmFnZXMgY29ubmVjdGlvbnMgdG8gbW9uZXJvZFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0Q29ubmVjdGlvbk1hbmFnZXIoY29ubmVjdGlvbk1hbmFnZXI/OiBNb25lcm9Db25uZWN0aW9uTWFuYWdlcik6IFByb21pc2U8dm9pZD4ge1xuICAgIGlmICh0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyKSB0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyLnJlbW92ZUxpc3RlbmVyKHRoaXMuY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcik7XG4gICAgdGhpcy5jb25uZWN0aW9uTWFuYWdlciA9IGNvbm5lY3Rpb25NYW5hZ2VyO1xuICAgIGlmICghY29ubmVjdGlvbk1hbmFnZXIpIHJldHVybjtcbiAgICBsZXQgdGhhdCA9IHRoaXM7XG4gICAgaWYgKCF0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIpIHRoaXMuY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lciA9IG5ldyBjbGFzcyBleHRlbmRzIE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIge1xuICAgICAgYXN5bmMgb25Db25uZWN0aW9uQ2hhbmdlZChjb25uZWN0aW9uOiBNb25lcm9ScGNDb25uZWN0aW9uIHwgdW5kZWZpbmVkKSB7XG4gICAgICAgIGF3YWl0IHRoYXQuc2V0RGFlbW9uQ29ubmVjdGlvbihjb25uZWN0aW9uKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIGNvbm5lY3Rpb25NYW5hZ2VyLmFkZExpc3RlbmVyKHRoaXMuY29ubmVjdGlvbk1hbmFnZXJMaXN0ZW5lcik7XG4gICAgYXdhaXQgdGhpcy5zZXREYWVtb25Db25uZWN0aW9uKGNvbm5lY3Rpb25NYW5hZ2VyLmdldENvbm5lY3Rpb24oKSk7XG4gIH1cblxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvbiBtYW5hZ2VyLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9Db25uZWN0aW9uTWFuYWdlcj59IHRoZSB3YWxsZXQncyBkYWVtb24gY29ubmVjdGlvbiBtYW5hZ2VyXG4gICAqL1xuICBhc3luYyBnZXRDb25uZWN0aW9uTWFuYWdlcigpOiBQcm9taXNlPE1vbmVyb0Nvbm5lY3Rpb25NYW5hZ2VyPiB7XG4gICAgcmV0dXJuIHRoaXMuY29ubmVjdGlvbk1hbmFnZXI7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbmRpY2F0ZXMgaWYgdGhlIHdhbGxldCBpcyBjb25uZWN0ZWQgdG8gZGFlbW9uLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgd2FsbGV0IGlzIGNvbm5lY3RlZCB0byBhIGRhZW1vbiwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBpc0Nvbm5lY3RlZFRvRGFlbW9uKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXRzIHRoZSB2ZXJzaW9uIG9mIHRoZSB3YWxsZXQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1ZlcnNpb24+fSB0aGUgdmVyc2lvbiBvZiB0aGUgd2FsbGV0XG4gICAqL1xuICBhc3luYyBnZXRWZXJzaW9uKCk6IFByb21pc2U8TW9uZXJvVmVyc2lvbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIHBhdGguXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSBwYXRoIHRoZSB3YWxsZXQgY2FuIGJlIG9wZW5lZCB3aXRoXG4gICAqL1xuICBhc3luYyBnZXRQYXRoKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgd2FsbGV0J3MgbW5lbW9uaWMgcGhyYXNlIG9yIHNlZWQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB3YWxsZXQncyBtbmVtb25pYyBwaHJhc2Ugb3Igc2VlZC5cbiAgICovXG4gIGFzeW5jIGdldFNlZWQoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBsYW5ndWFnZSBvZiB0aGUgd2FsbGV0J3MgbW5lbW9uaWMgcGhyYXNlIG9yIHNlZWQuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSBsYW5ndWFnZSBvZiB0aGUgd2FsbGV0J3MgbW5lbW9uaWMgcGhyYXNlIG9yIHNlZWQuXG4gICAqL1xuICBhc3luYyBnZXRTZWVkTGFuZ3VhZ2UoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBwcml2YXRlIHZpZXcga2V5LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgd2FsbGV0J3MgcHJpdmF0ZSB2aWV3IGtleVxuICAgKi9cbiAgYXN5bmMgZ2V0UHJpdmF0ZVZpZXdLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBwcml2YXRlIHNwZW5kIGtleS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHdhbGxldCdzIHByaXZhdGUgc3BlbmQga2V5XG4gICAqL1xuICBhc3luYyBnZXRQcml2YXRlU3BlbmRLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBwdWJsaWMgdmlldyBrZXkuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB3YWxsZXQncyBwdWJsaWMgdmlldyBrZXlcbiAgICovXG4gIGFzeW5jIGdldFB1YmxpY1ZpZXdLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSB3YWxsZXQncyBwdWJsaWMgc3BlbmQga2V5LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgd2FsbGV0J3MgcHVibGljIHNwZW5kIGtleVxuICAgKi9cbiAgYXN5bmMgZ2V0UHVibGljU3BlbmRLZXkoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gICAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIHdhbGxldCdzIHByaW1hcnkgYWRkcmVzcy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHdhbGxldCdzIHByaW1hcnkgYWRkcmVzc1xuICAgKi9cbiAgYXN5bmMgZ2V0UHJpbWFyeUFkZHJlc3MoKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICByZXR1cm4gYXdhaXQgdGhpcy5nZXRBZGRyZXNzKDAsIDApO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBhZGRyZXNzIG9mIGEgc3BlY2lmaWMgc3ViYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gdGhlIGFjY291bnQgaW5kZXggb2YgdGhlIGFkZHJlc3MncyBzdWJhZGRyZXNzXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzdWJhZGRyZXNzSWR4IC0gdGhlIHN1YmFkZHJlc3MgaW5kZXggd2l0aGluIHRoZSBhY2NvdW50XG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHJlY2VpdmUgYWRkcmVzcyBvZiB0aGUgc3BlY2lmaWVkIHN1YmFkZHJlc3NcbiAgICovXG4gIGFzeW5jIGdldEFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgdGhlIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kZXggb2YgdGhlIGdpdmVuIGFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIGFkZHJlc3MgdG8gZ2V0IHRoZSBhY2NvdW50IGFuZCBzdWJhZGRyZXNzIGluZGV4IGZyb21cbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzPn0gdGhlIGFjY291bnQgYW5kIHN1YmFkZHJlc3MgaW5kaWNlc1xuICAgKi9cbiAgYXN5bmMgZ2V0QWRkcmVzc0luZGV4KGFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzcz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYW4gaW50ZWdyYXRlZCBhZGRyZXNzIGJhc2VkIG9uIHRoZSBnaXZlbiBzdGFuZGFyZCBhZGRyZXNzIGFuZCBwYXltZW50XG4gICAqIElELiBVc2VzIHRoZSB3YWxsZXQncyBwcmltYXJ5IGFkZHJlc3MgaWYgYW4gYWRkcmVzcyBpcyBub3QgZ2l2ZW4uXG4gICAqIEdlbmVyYXRlcyBhIHJhbmRvbSBwYXltZW50IElEIGlmIGEgcGF5bWVudCBJRCBpcyBub3QgZ2l2ZW4uXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc3RhbmRhcmRBZGRyZXNzIGlzIHRoZSBzdGFuZGFyZCBhZGRyZXNzIHRvIGdlbmVyYXRlIHRoZSBpbnRlZ3JhdGVkIGFkZHJlc3MgZnJvbSAod2FsbGV0J3MgcHJpbWFyeSBhZGRyZXNzIGlmIHVuZGVmaW5lZClcbiAgICogQHBhcmFtIHtzdHJpbmd9IHBheW1lbnRJZCBpcyB0aGUgcGF5bWVudCBJRCB0byBnZW5lcmF0ZSBhbiBpbnRlZ3JhdGVkIGFkZHJlc3MgZnJvbSAocmFuZG9tbHkgZ2VuZXJhdGVkIGlmIHVuZGVmaW5lZClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz59IHRoZSBpbnRlZ3JhdGVkIGFkZHJlc3NcbiAgICovXG4gIGFzeW5jIGdldEludGVncmF0ZWRBZGRyZXNzKHN0YW5kYXJkQWRkcmVzcz86IHN0cmluZywgcGF5bWVudElkPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZWNvZGUgYW4gaW50ZWdyYXRlZCBhZGRyZXNzIHRvIGdldCBpdHMgc3RhbmRhcmQgYWRkcmVzcyBhbmQgcGF5bWVudCBpZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBpbnRlZ3JhdGVkQWRkcmVzcyAtIGludGVncmF0ZWQgYWRkcmVzcyB0byBkZWNvZGVcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9JbnRlZ3JhdGVkQWRkcmVzcz59IHRoZSBkZWNvZGVkIGludGVncmF0ZWQgYWRkcmVzcyBpbmNsdWRpbmcgc3RhbmRhcmQgYWRkcmVzcyBhbmQgcGF5bWVudCBpZFxuICAgKi9cbiAgYXN5bmMgZGVjb2RlSW50ZWdyYXRlZEFkZHJlc3MoaW50ZWdyYXRlZEFkZHJlc3M6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvSW50ZWdyYXRlZEFkZHJlc3M+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBibG9jayBoZWlnaHQgdGhhdCB0aGUgd2FsbGV0IGlzIHN5bmNlZCB0by5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyPn0gdGhlIGJsb2NrIGhlaWdodCB0aGF0IHRoZSB3YWxsZXQgaXMgc3luY2VkIHRvXG4gICAqL1xuICBhc3luYyBnZXRIZWlnaHQoKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBibG9ja2NoYWluJ3MgaGVpZ2h0LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB0aGUgYmxvY2tjaGFpbidzIGhlaWdodFxuICAgKi9cbiAgYXN5bmMgZ2V0RGFlbW9uSGVpZ2h0KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgYmxvY2tjaGFpbidzIGhlaWdodCBieSBkYXRlIGFzIGEgY29uc2VydmF0aXZlIGVzdGltYXRlIGZvciBzY2FubmluZy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSB5ZWFyIC0geWVhciBvZiB0aGUgaGVpZ2h0IHRvIGdldFxuICAgKiBAcGFyYW0ge251bWJlcn0gbW9udGggLSBtb250aCBvZiB0aGUgaGVpZ2h0IHRvIGdldCBhcyBhIG51bWJlciBiZXR3ZWVuIDEgYW5kIDEyXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBkYXkgLSBkYXkgb2YgdGhlIGhlaWdodCB0byBnZXQgYXMgYSBudW1iZXIgYmV0d2VlbiAxIGFuZCAzMVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPG51bWJlcj59IHRoZSBibG9ja2NoYWluJ3MgYXBwcm94aW1hdGUgaGVpZ2h0IGF0IHRoZSBnaXZlbiBkYXRlXG4gICAqL1xuICBhc3luYyBnZXRIZWlnaHRCeURhdGUoeWVhcjogbnVtYmVyLCBtb250aDogbnVtYmVyLCBkYXk6IG51bWJlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN5bmNocm9uaXplIHRoZSB3YWxsZXQgd2l0aCB0aGUgZGFlbW9uIGFzIGEgb25lLXRpbWUgc3luY2hyb25vdXMgcHJvY2Vzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvV2FsbGV0TGlzdGVuZXJ8bnVtYmVyfSBbbGlzdGVuZXJPclN0YXJ0SGVpZ2h0XSAtIGxpc3RlbmVyIHhvciBzdGFydCBoZWlnaHQgKGRlZmF1bHRzIHRvIG5vIHN5bmMgbGlzdGVuZXIsIHRoZSBsYXN0IHN5bmNlZCBibG9jaylcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdGFydEhlaWdodF0gLSBzdGFydEhlaWdodCBpZiBub3QgZ2l2ZW4gaW4gZmlyc3QgYXJnIChkZWZhdWx0cyB0byBsYXN0IHN5bmNlZCBibG9jaylcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN5bmMobGlzdGVuZXJPclN0YXJ0SGVpZ2h0PzogTW9uZXJvV2FsbGV0TGlzdGVuZXIgfCBudW1iZXIsIHN0YXJ0SGVpZ2h0PzogbnVtYmVyKTogUHJvbWlzZTxNb25lcm9TeW5jUmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0YXJ0IGJhY2tncm91bmQgc3luY2hyb25pemluZyB3aXRoIGEgbWF4aW11bSBwZXJpb2QgYmV0d2VlbiBzeW5jcy5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3luY1BlcmlvZEluTXNdIC0gbWF4aW11bSBwZXJpb2QgYmV0d2VlbiBzeW5jcyBpbiBtaWxsaXNlY29uZHMgKGRlZmF1bHQgaXMgd2FsbGV0LXNwZWNpZmljKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc3RhcnRTeW5jaW5nKHN5bmNQZXJpb2RJbk1zPzogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0b3Agc3luY2hyb25pemluZyB0aGUgd2FsbGV0IHdpdGggdGhlIGRhZW1vbi5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBzdG9wU3luY2luZygpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU2NhbiB0cmFuc2FjdGlvbnMgYnkgdGhlaXIgaGFzaC9pZC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IHR4SGFzaGVzIC0gdHggaGFzaGVzIHRvIHNjYW5cbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNjYW5UeHModHhIYXNoZXM6IHN0cmluZ1tdKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPlJlc2NhbiB0aGUgYmxvY2tjaGFpbiBmb3Igc3BlbnQgb3V0cHV0cy48L3A+XG4gICAqIFxuICAgKiA8cD5Ob3RlOiB0aGlzIGNhbiBvbmx5IGJlIGNhbGxlZCB3aXRoIGEgdHJ1c3RlZCBkYWVtb24uPC9wPlxuICAgKiBcbiAgICogPHA+RXhhbXBsZSB1c2UgY2FzZTogcGVlciBtdWx0aXNpZyBoZXggaXMgaW1wb3J0IHdoZW4gY29ubmVjdGVkIHRvIGFuIHVudHJ1c3RlZCBkYWVtb24sXG4gICAqIHNvIHRoZSB3YWxsZXQgd2lsbCBub3QgcmVzY2FuIHNwZW50IG91dHB1dHMuICBUaGVuIHRoZSB3YWxsZXQgY29ubmVjdHMgdG8gYSB0cnVzdGVkXG4gICAqIGRhZW1vbi4gIFRoaXMgbWV0aG9kIHNob3VsZCBiZSBtYW51YWxseSBpbnZva2VkIHRvIHJlc2NhbiBvdXRwdXRzLjwvcD5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyByZXNjYW5TcGVudCgpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+UmVzY2FuIHRoZSBibG9ja2NoYWluIGZyb20gc2NyYXRjaCwgbG9zaW5nIGFueSBpbmZvcm1hdGlvbiB3aGljaCBjYW5ub3QgYmUgcmVjb3ZlcmVkIGZyb21cbiAgICogdGhlIGJsb2NrY2hhaW4gaXRzZWxmLjwvcD5cbiAgICogXG4gICAqIDxwPldBUk5JTkc6IFRoaXMgbWV0aG9kIGRpc2NhcmRzIGxvY2FsIHdhbGxldCBkYXRhIGxpa2UgZGVzdGluYXRpb24gYWRkcmVzc2VzLCB0eCBzZWNyZXQga2V5cyxcbiAgICogdHggbm90ZXMsIGV0Yy48L3A+XG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgcmVzY2FuQmxvY2tjaGFpbigpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBiYWxhbmNlIG9mIHRoZSB3YWxsZXQsIGFjY291bnQsIG9yIHN1YmFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gW2FjY291bnRJZHhdIC0gaW5kZXggb2YgdGhlIGFjY291bnQgdG8gZ2V0IHRoZSBiYWxhbmNlIG9mIChkZWZhdWx0IGFsbCBhY2NvdW50cylcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtzdWJhZGRyZXNzSWR4XSAtIGluZGV4IG9mIHRoZSBzdWJhZGRyZXNzIHRvIGdldCB0aGUgYmFsYW5jZSBvZiAoZGVmYXVsdCBhbGwgc3ViYWRkcmVzc2VzKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJpZ2ludD59IHRoZSBiYWxhbmNlIG9mIHRoZSB3YWxsZXQsIGFjY291bnQsIG9yIHN1YmFkZHJlc3NcbiAgICovXG4gIGFzeW5jIGdldEJhbGFuY2UoYWNjb3VudElkeD86IG51bWJlciwgc3ViYWRkcmVzc0lkeD86IG51bWJlcik6IFByb21pc2U8YmlnaW50PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCB0aGUgdW5sb2NrZWQgYmFsYW5jZSBvZiB0aGUgd2FsbGV0LCBhY2NvdW50LCBvciBzdWJhZGRyZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFthY2NvdW50SWR4XSAtIGluZGV4IG9mIHRoZSBhY2NvdW50IHRvIGdldCB0aGUgdW5sb2NrZWQgYmFsYW5jZSBvZiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3ViYWRkcmVzc0lkeF0gLSBpbmRleCBvZiB0aGUgc3ViYWRkcmVzcyB0byBnZXQgdGhlIHVubG9ja2VkIGJhbGFuY2Ugb2YgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJpZ2ludD59IHRoZSB1bmxvY2tlZCBiYWxhbmNlIG9mIHRoZSB3YWxsZXQsIGFjY291bnQsIG9yIHN1YmFkZHJlc3NcbiAgICovXG4gIGFzeW5jIGdldFVubG9ja2VkQmFsYW5jZShhY2NvdW50SWR4PzogbnVtYmVyLCBzdWJhZGRyZXNzSWR4PzogbnVtYmVyKTogUHJvbWlzZTxiaWdpbnQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IHRoZSBudW1iZXIgb2YgYmxvY2tzIHVudGlsIHRoZSBuZXh0IGFuZCBsYXN0IGZ1bmRzIHVubG9jay5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8bnVtYmVyW10+fSB0aGUgbnVtYmVyIG9mIGJsb2NrcyB1bnRpbCB0aGUgbmV4dCBhbmQgbGFzdCBmdW5kcyB1bmxvY2sgaW4gZWxlbWVudHMgMCBhbmQgMSwgcmVzcGVjdGl2ZWx5LCBvciB1bmRlZmluZWQgaWYgbm8gYmFsYW5jZVxuICAgKi9cbiAgYXN5bmMgZ2V0TnVtQmxvY2tzVG9VbmxvY2soKTogUHJvbWlzZTxudW1iZXJbXT4ge1xuICAgIFxuICAgIC8vIGdldCBiYWxhbmNlc1xuICAgIGxldCBiYWxhbmNlID0gYXdhaXQgdGhpcy5nZXRCYWxhbmNlKCk7XG4gICAgaWYgKGJhbGFuY2UgPT09IDBuKSByZXR1cm4gW3VuZGVmaW5lZCwgdW5kZWZpbmVkXTsgLy8gc2tpcCBpZiBubyBiYWxhbmNlXG4gICAgbGV0IHVubG9ja2VkQmFsYW5jZSA9IGF3YWl0IHRoaXMuZ2V0VW5sb2NrZWRCYWxhbmNlKCk7XG4gICAgXG4gICAgLy8gY29tcHV0ZSBudW1iZXIgb2YgYmxvY2tzIHVudGlsIG5leHQgZnVuZHMgYXZhaWxhYmxlXG4gICAgbGV0IHR4cztcbiAgICBsZXQgaGVpZ2h0O1xuICAgIGxldCBudW1CbG9ja3NUb05leHRVbmxvY2sgPSB1bmRlZmluZWQ7XG4gICAgaWYgKHVubG9ja2VkQmFsYW5jZSA+IDBuKSBudW1CbG9ja3NUb05leHRVbmxvY2sgPSAwO1xuICAgIGVsc2Uge1xuICAgICAgdHhzID0gYXdhaXQgdGhpcy5nZXRUeHMoe2lzTG9ja2VkOiB0cnVlfSk7IC8vIGdldCBsb2NrZWQgdHhzXG4gICAgICBoZWlnaHQgPSBhd2FpdCB0aGlzLmdldEhlaWdodCgpOyAvLyBnZXQgbW9zdCByZWNlbnQgaGVpZ2h0XG4gICAgICBmb3IgKGxldCB0eCBvZiB0eHMpIHtcbiAgICAgICAgbGV0IG51bUJsb2Nrc1RvVW5sb2NrID0gTWF0aC5tYXgoKHR4LmdldElzQ29uZmlybWVkKCkgPyB0eC5nZXRIZWlnaHQoKSA6IGhlaWdodCkgKyAxMCwgdHguZ2V0VW5sb2NrVGltZSgpKSAtIGhlaWdodDtcbiAgICAgICAgbnVtQmxvY2tzVG9OZXh0VW5sb2NrID0gbnVtQmxvY2tzVG9OZXh0VW5sb2NrID09PSB1bmRlZmluZWQgPyBudW1CbG9ja3NUb1VubG9jayA6IE1hdGgubWluKG51bUJsb2Nrc1RvTmV4dFVubG9jaywgbnVtQmxvY2tzVG9VbmxvY2spO1xuICAgICAgfVxuICAgIH1cbiAgICBcbiAgICAvLyBjb21wdXRlIG51bWJlciBvZiBibG9ja3MgdW50aWwgYWxsIGZ1bmRzIGF2YWlsYWJsZVxuICAgIGxldCBudW1CbG9ja3NUb0xhc3RVbmxvY2sgPSB1bmRlZmluZWQ7XG4gICAgaWYgKGJhbGFuY2UgPT09IHVubG9ja2VkQmFsYW5jZSkge1xuICAgICAgaWYgKHVubG9ja2VkQmFsYW5jZSA+IDBuKSBudW1CbG9ja3NUb0xhc3RVbmxvY2sgPSAwO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoIXR4cykge1xuICAgICAgICB0eHMgPSBhd2FpdCB0aGlzLmdldFR4cyh7aXNMb2NrZWQ6IHRydWV9KTsgLy8gZ2V0IGxvY2tlZCB0eHNcbiAgICAgICAgaGVpZ2h0ID0gYXdhaXQgdGhpcy5nZXRIZWlnaHQoKTsgLy8gZ2V0IG1vc3QgcmVjZW50IGhlaWdodFxuICAgICAgfVxuICAgICAgZm9yIChsZXQgdHggb2YgdHhzKSB7XG4gICAgICAgIGxldCBudW1CbG9ja3NUb1VubG9jayA9IE1hdGgubWF4KCh0eC5nZXRJc0NvbmZpcm1lZCgpID8gdHguZ2V0SGVpZ2h0KCkgOiBoZWlnaHQpICsgMTAsIHR4LmdldFVubG9ja1RpbWUoKSkgLSBoZWlnaHQ7XG4gICAgICAgIG51bUJsb2Nrc1RvTGFzdFVubG9jayA9IG51bUJsb2Nrc1RvTGFzdFVubG9jayA9PT0gdW5kZWZpbmVkID8gbnVtQmxvY2tzVG9VbmxvY2sgOiBNYXRoLm1heChudW1CbG9ja3NUb0xhc3RVbmxvY2ssIG51bUJsb2Nrc1RvVW5sb2NrKTtcbiAgICAgIH1cbiAgICB9XG4gICAgXG4gICAgcmV0dXJuIFtudW1CbG9ja3NUb05leHRVbmxvY2ssIG51bUJsb2Nrc1RvTGFzdFVubG9ja107XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYWNjb3VudHMgd2l0aCBhIGdpdmVuIHRhZy5cbiAgICogXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gaW5jbHVkZVN1YmFkZHJlc3NlcyAtIGluY2x1ZGUgc3ViYWRkcmVzc2VzIGlmIHRydWVcbiAgICogQHBhcmFtIHtzdHJpbmd9IHRhZyAtIHRhZyBmb3IgZmlsdGVyaW5nIGFjY291bnRzLCBhbGwgYWNjb3VudHMgaWYgdW5kZWZpbmVkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQWNjb3VudFtdPn0gYWxsIGFjY291bnRzIHdpdGggdGhlIGdpdmVuIHRhZ1xuICAgKi9cbiAgYXN5bmMgZ2V0QWNjb3VudHMoaW5jbHVkZVN1YmFkZHJlc3Nlcz86IGJvb2xlYW4sIHRhZz86IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQWNjb3VudFtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhbiBhY2NvdW50LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFjY291bnRJZHggLSBpbmRleCBvZiB0aGUgYWNjb3VudCB0byBnZXRcbiAgICogQHBhcmFtIHtib29sZWFufSBpbmNsdWRlU3ViYWRkcmVzc2VzIC0gaW5jbHVkZSBzdWJhZGRyZXNzZXMgaWYgdHJ1ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0FjY291bnQ+fSB0aGUgcmV0cmlldmVkIGFjY291bnRcbiAgICovXG4gIGFzeW5jIGdldEFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBpbmNsdWRlU3ViYWRkcmVzc2VzPzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvQWNjb3VudD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDcmVhdGUgYSBuZXcgYWNjb3VudCB3aXRoIGEgbGFiZWwgZm9yIHRoZSBmaXJzdCBzdWJhZGRyZXNzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtsYWJlbF0gLSBsYWJlbCBmb3IgYWNjb3VudCdzIGZpcnN0IHN1YmFkZHJlc3MgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0FjY291bnQ+fSB0aGUgY3JlYXRlZCBhY2NvdW50XG4gICAqL1xuICBhc3luYyBjcmVhdGVBY2NvdW50KGxhYmVsPzogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9BY2NvdW50PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBTZXQgYW4gYWNjb3VudCBsYWJlbC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gaW5kZXggb2YgdGhlIGFjY291bnQgdG8gc2V0IHRoZSBsYWJlbCBmb3JcbiAgICogQHBhcmFtIHtzdHJpbmd9IGxhYmVsIC0gdGhlIGxhYmVsIHRvIHNldFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0QWNjb3VudExhYmVsKGFjY291bnRJZHg6IG51bWJlciwgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHRoaXMuc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHgsIDAsIGxhYmVsKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBzdWJhZGRyZXNzZXMgaW4gYW4gYWNjb3VudC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gYWNjb3VudCB0byBnZXQgc3ViYWRkcmVzc2VzIHdpdGhpblxuICAgKiBAcGFyYW0ge251bWJlcltdfSBbc3ViYWRkcmVzc0luZGljZXNdIC0gaW5kaWNlcyBvZiBzdWJhZGRyZXNzZXMgdG8gZ2V0IChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9TdWJhZGRyZXNzW10+fSB0aGUgcmV0cmlldmVkIHN1YmFkZHJlc3Nlc1xuICAgKi9cbiAgYXN5bmMgZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0luZGljZXM/OiBudW1iZXJbXSk6IFByb21pc2U8TW9uZXJvU3ViYWRkcmVzc1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIHN1YmFkZHJlc3MuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gYWNjb3VudElkeCAtIGluZGV4IG9mIHRoZSBzdWJhZGRyZXNzJ3MgYWNjb3VudFxuICAgKiBAcGFyYW0ge251bWJlcn0gc3ViYWRkcmVzc0lkeCAtIGluZGV4IG9mIHRoZSBzdWJhZGRyZXNzIHdpdGhpbiB0aGUgYWNjb3VudFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+fSB0aGUgcmV0cmlldmVkIHN1YmFkZHJlc3NcbiAgICovXG4gIGFzeW5jIGdldFN1YmFkZHJlc3MoYWNjb3VudElkeDogbnVtYmVyLCBzdWJhZGRyZXNzSWR4OiBudW1iZXIpOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICBhc3NlcnQoYWNjb3VudElkeCA+PSAwKTtcbiAgICBhc3NlcnQoc3ViYWRkcmVzc0lkeCA+PSAwKTtcbiAgICByZXR1cm4gKGF3YWl0IHRoaXMuZ2V0U3ViYWRkcmVzc2VzKGFjY291bnRJZHgsIFtzdWJhZGRyZXNzSWR4XSkpWzBdO1xuICB9XG4gIFxuICAvKipcbiAgICogQ3JlYXRlIGEgc3ViYWRkcmVzcyB3aXRoaW4gYW4gYWNjb3VudC5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBhY2NvdW50SWR4IC0gaW5kZXggb2YgdGhlIGFjY291bnQgdG8gY3JlYXRlIHRoZSBzdWJhZGRyZXNzIHdpdGhpblxuICAgKiBAcGFyYW0ge3N0cmluZ30gW2xhYmVsXSAtIHRoZSBsYWJlbCBmb3IgdGhlIHN1YmFkZHJlc3MgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+fSB0aGUgY3JlYXRlZCBzdWJhZGRyZXNzXG4gICAqL1xuICBhc3luYyBjcmVhdGVTdWJhZGRyZXNzKGFjY291bnRJZHg6IG51bWJlciwgbGFiZWw/OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1N1YmFkZHJlc3M+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldCBhIHN1YmFkZHJlc3MgbGFiZWwuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcn0gYWNjb3VudElkeCAtIGluZGV4IG9mIHRoZSBhY2NvdW50IHRvIHNldCB0aGUgbGFiZWwgZm9yXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBzdWJhZGRyZXNzSWR4IC0gaW5kZXggb2YgdGhlIHN1YmFkZHJlc3MgdG8gc2V0IHRoZSBsYWJlbCBmb3JcbiAgICogQHBhcmFtIHtQcm9taXNlPHN0cmluZz59IGxhYmVsIC0gdGhlIGxhYmVsIHRvIHNldFxuICAgKi9cbiAgYXN5bmMgc2V0U3ViYWRkcmVzc0xhYmVsKGFjY291bnRJZHg6IG51bWJlciwgc3ViYWRkcmVzc0lkeDogbnVtYmVyLCBsYWJlbDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIHdhbGxldCB0cmFuc2FjdGlvbiBieSBoYXNoLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIGhhc2ggb2YgYSB0cmFuc2FjdGlvbiB0byBnZXRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldD4gfSB0aGUgaWRlbnRpZmllZCB0cmFuc2FjdGlvbiBvciB1bmRlZmluZWQgaWYgbm90IGZvdW5kXG4gICAqL1xuICBhc3luYyBnZXRUeCh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHtcbiAgICBsZXQgdHhzID0gYXdhaXQgdGhpcy5nZXRUeHMoW3R4SGFzaF0pO1xuICAgIHJldHVybiB0eHMubGVuZ3RoID09PSAwID8gdW5kZWZpbmVkIDogdHhzWzBdOyBcbiAgfVxuICBcbiAgLyoqXG4gICAqIDxwPkdldCB3YWxsZXQgdHJhbnNhY3Rpb25zLiAgV2FsbGV0IHRyYW5zYWN0aW9ucyBjb250YWluIG9uZSBvciBtb3JlXG4gICAqIHRyYW5zZmVycyB0aGF0IGFyZSBlaXRoZXIgaW5jb21pbmcgb3Igb3V0Z29pbmcgdG8gdGhlIHdhbGxldC48cD5cbiAgICogXG4gICAqIDxwPlJlc3VsdHMgY2FuIGJlIGZpbHRlcmVkIGJ5IHBhc3NpbmcgYSBxdWVyeSBvYmplY3QuICBUcmFuc2FjdGlvbnMgbXVzdFxuICAgKiBtZWV0IGV2ZXJ5IGNyaXRlcmlhIGRlZmluZWQgaW4gdGhlIHF1ZXJ5IGluIG9yZGVyIHRvIGJlIHJldHVybmVkLiAgQWxsXG4gICAqIGNyaXRlcmlhIGFyZSBvcHRpb25hbCBhbmQgbm8gZmlsdGVyaW5nIGlzIGFwcGxpZWQgd2hlbiBub3QgZGVmaW5lZC48L3A+XG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdIHwgTW9uZXJvVHhRdWVyeX0gW3F1ZXJ5XSAtIGNvbmZpZ3VyZXMgdGhlIHF1ZXJ5IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNDb25maXJtZWRdIC0gZ2V0IHR4cyB0aGF0IGFyZSBjb25maXJtZWQgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaW5UeFBvb2xdIC0gZ2V0IHR4cyB0aGF0IGFyZSBpbiB0aGUgdHggcG9vbCBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc1JlbGF5ZWRdIC0gZ2V0IHR4cyB0aGF0IGFyZSByZWxheWVkIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzRmFpbGVkXSAtIGdldCB0eHMgdGhhdCBhcmUgZmFpbGVkIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzTWluZXJUeF0gLSBnZXQgbWluZXIgdHhzIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcXVlcnkuaGFzaF0gLSBnZXQgYSB0eCB3aXRoIHRoZSBoYXNoIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gW3F1ZXJ5Lmhhc2hlc10gLSBnZXQgdHhzIHdpdGggdGhlIGhhc2hlcyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBbcXVlcnkucGF5bWVudElkXSAtIGdldCB0cmFuc2FjdGlvbnMgd2l0aCB0aGUgcGF5bWVudCBpZCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IFtxdWVyeS5wYXltZW50SWRzXSAtIGdldCB0cmFuc2FjdGlvbnMgd2l0aCB0aGUgcGF5bWVudCBpZHMgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5oYXNQYXltZW50SWRdIC0gZ2V0IHRyYW5zYWN0aW9ucyB3aXRoIGEgcGF5bWVudCBpZCBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5Lm1pbkhlaWdodF0gLSBnZXQgdHhzIHdpdGggaGVpZ2h0ID49IHRoZSBnaXZlbiBoZWlnaHQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5Lm1heEhlaWdodF0gLSBnZXQgdHhzIHdpdGggaGVpZ2h0IDw9IHRoZSBnaXZlbiBoZWlnaHQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc091dGdvaW5nXSAtIGdldCB0eHMgd2l0aCBhbiBvdXRnb2luZyB0cmFuc2ZlciBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc0luY29taW5nXSAtIGdldCB0eHMgd2l0aCBhbiBpbmNvbWluZyB0cmFuc2ZlciBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb1RyYW5zZmVyUXVlcnl9IFtxdWVyeS50cmFuc2ZlclF1ZXJ5XSAtIGdldCB0eHMgdGhhdCBoYXZlIGEgdHJhbnNmZXIgdGhhdCBtZWV0cyB0aGlzIHF1ZXJ5IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaW5jbHVkZU91dHB1dHNdIC0gc3BlY2lmaWVzIHRoYXQgdHggb3V0cHV0cyBzaG91bGQgYmUgcmV0dXJuZWQgd2l0aCB0eCByZXN1bHRzIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPn0gd2FsbGV0IHRyYW5zYWN0aW9ucyBwZXIgdGhlIGNvbmZpZ3VyYXRpb25cbiAgICovXG4gIGFzeW5jIGdldFR4cyhxdWVyeT86IHN0cmluZ1tdIHwgUGFydGlhbDxNb25lcm9UeFF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogPHA+R2V0IGluY29taW5nIGFuZCBvdXRnb2luZyB0cmFuc2ZlcnMgdG8gYW5kIGZyb20gdGhpcyB3YWxsZXQuICBBbiBvdXRnb2luZ1xuICAgKiB0cmFuc2ZlciByZXByZXNlbnRzIGEgdG90YWwgYW1vdW50IHNlbnQgZnJvbSBvbmUgb3IgbW9yZSBzdWJhZGRyZXNzZXNcbiAgICogd2l0aGluIGFuIGFjY291bnQgdG8gaW5kaXZpZHVhbCBkZXN0aW5hdGlvbiBhZGRyZXNzZXMsIGVhY2ggd2l0aCB0aGVpclxuICAgKiBvd24gYW1vdW50LiAgQW4gaW5jb21pbmcgdHJhbnNmZXIgcmVwcmVzZW50cyBhIHRvdGFsIGFtb3VudCByZWNlaXZlZCBpbnRvXG4gICAqIGEgc3ViYWRkcmVzcyB3aXRoaW4gYW4gYWNjb3VudC4gIFRyYW5zZmVycyBiZWxvbmcgdG8gdHJhbnNhY3Rpb25zIHdoaWNoXG4gICAqIGFyZSBzdG9yZWQgb24gdGhlIGJsb2NrY2hhaW4uPC9wPlxuICAgKiBcbiAgICogPHA+UmVzdWx0cyBjYW4gYmUgZmlsdGVyZWQgYnkgcGFzc2luZyBhIHF1ZXJ5IG9iamVjdC4gIFRyYW5zZmVycyBtdXN0XG4gICAqIG1lZXQgZXZlcnkgY3JpdGVyaWEgZGVmaW5lZCBpbiB0aGUgcXVlcnkgaW4gb3JkZXIgdG8gYmUgcmV0dXJuZWQuICBBbGxcbiAgICogY3JpdGVyaWEgYXJlIG9wdGlvbmFsIGFuZCBubyBmaWx0ZXJpbmcgaXMgYXBwbGllZCB3aGVuIG5vdCBkZWZpbmVkLjwvcD5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHJhbnNmZXJRdWVyeX0gW3F1ZXJ5XSAtIGNvbmZpZ3VyZXMgdGhlIHF1ZXJ5IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaXNPdXRnb2luZ10gLSBnZXQgdHJhbnNmZXJzIHRoYXQgYXJlIG91dGdvaW5nIG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5LmlzSW5jb21pbmddIC0gZ2V0IHRyYW5zZmVycyB0aGF0IGFyZSBpbmNvbWluZyBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3F1ZXJ5LmFkZHJlc3NdIC0gd2FsbGV0J3MgYWRkcmVzcyB0aGF0IGEgdHJhbnNmZXIgZWl0aGVyIG9yaWdpbmF0ZWQgZnJvbSAoaWYgb3V0Z29pbmcpIG9yIGlzIGRlc3RpbmVkIGZvciAoaWYgaW5jb21pbmcpIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5hY2NvdW50SW5kZXhdIC0gZ2V0IHRyYW5zZmVycyB0aGF0IGVpdGhlciBvcmlnaW5hdGVkIGZyb20gKGlmIG91dGdvaW5nKSBvciBhcmUgZGVzdGluZWQgZm9yIChpZiBpbmNvbWluZykgYSBzcGVjaWZpYyBhY2NvdW50IGluZGV4IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5zdWJhZGRyZXNzSW5kZXhdIC0gZ2V0IHRyYW5zZmVycyB0aGF0IGVpdGhlciBvcmlnaW5hdGVkIGZyb20gKGlmIG91dGdvaW5nKSBvciBhcmUgZGVzdGluZWQgZm9yIChpZiBpbmNvbWluZykgYSBzcGVjaWZpYyBzdWJhZGRyZXNzIGluZGV4IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtpbnRbXX0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRpY2VzXSAtIGdldCB0cmFuc2ZlcnMgdGhhdCBlaXRoZXIgb3JpZ2luYXRlZCBmcm9tIChpZiBvdXRnb2luZykgb3IgYXJlIGRlc3RpbmVkIGZvciAoaWYgaW5jb21pbmcpIHNwZWNpZmljIHN1YmFkZHJlc3MgaW5kaWNlcyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7YmlnaW50fSBbcXVlcnkuYW1vdW50XSAtIGFtb3VudCBiZWluZyB0cmFuc2ZlcnJlZCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvRGVzdGluYXRpb25bXSB8IE1vbmVyb0Rlc3RpbmF0aW9uTW9kZWxbXX0gW3F1ZXJ5LmRlc3RpbmF0aW9uc10gLSBpbmRpdmlkdWFsIGRlc3RpbmF0aW9ucyBvZiBhbiBvdXRnb2luZyB0cmFuc2Zlciwgd2hpY2ggaXMgbG9jYWwgd2FsbGV0IGRhdGEgYW5kIE5PVCByZWNvdmVyYWJsZSBmcm9tIHRoZSBibG9ja2NoYWluIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbcXVlcnkuaGFzRGVzdGluYXRpb25zXSAtIGdldCB0cmFuc2ZlcnMgdGhhdCBoYXZlIGRlc3RpbmF0aW9ucyBvciBub3QgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UXVlcnl9IFtxdWVyeS50eFF1ZXJ5XSAtIGdldCB0cmFuc2ZlcnMgd2hvc2UgdHJhbnNhY3Rpb24gbWVldHMgdGhpcyBxdWVyeSAob3B0aW9uYWwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHJhbnNmZXJbXT59IHdhbGxldCB0cmFuc2ZlcnMgdGhhdCBtZWV0IHRoZSBxdWVyeVxuICAgKi9cbiAgYXN5bmMgZ2V0VHJhbnNmZXJzKHF1ZXJ5PzogUGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pik6IFByb21pc2U8TW9uZXJvVHJhbnNmZXJbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgaW5jb21pbmcgdHJhbnNmZXJzLlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1RyYW5zZmVyUXVlcnk+fSBbcXVlcnldIC0gY29uZmlndXJlcyB0aGUgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW3F1ZXJ5LmFkZHJlc3NdIC0gZ2V0IGluY29taW5nIHRyYW5zZmVycyB0byBhIHNwZWNpZmljIGFkZHJlc3MgaW4gdGhlIHdhbGxldCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkuYWNjb3VudEluZGV4XSAtIGdldCBpbmNvbWluZyB0cmFuc2ZlcnMgdG8gYSBzcGVjaWZpYyBhY2NvdW50IGluZGV4IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5zdWJhZGRyZXNzSW5kZXhdIC0gZ2V0IGluY29taW5nIHRyYW5zZmVycyB0byBhIHNwZWNpZmljIHN1YmFkZHJlc3MgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2ludFtdfSBbcXVlcnkuc3ViYWRkcmVzc0luZGljZXNdIC0gZ2V0IHRyYW5zZmVycyBkZXN0aW5lZCBmb3Igc3BlY2lmaWMgc3ViYWRkcmVzcyBpbmRpY2VzIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtiaWdpbnR9IFtxdWVyeS5hbW91bnRdIC0gYW1vdW50IGJlaW5nIHRyYW5zZmVycmVkIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtNb25lcm9UeFF1ZXJ5fSBbcXVlcnkudHhRdWVyeV0gLSBnZXQgdHJhbnNmZXJzIHdob3NlIHRyYW5zYWN0aW9uIG1lZXRzIHRoaXMgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0luY29taW5nVHJhbnNmZXJbXT59IGluY29taW5nIHRyYW5zZmVycyB0aGF0IG1lZXQgdGhlIHF1ZXJ5XG4gICAqL1xuICBhc3luYyBnZXRJbmNvbWluZ1RyYW5zZmVycyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb0luY29taW5nVHJhbnNmZXJbXT4ge1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZDogTW9uZXJvVHJhbnNmZXJRdWVyeSA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnlOb3JtYWxpemVkLmdldElzSW5jb21pbmcoKSA9PT0gZmFsc2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlRyYW5zZmVyIHF1ZXJ5IGNvbnRyYWRpY3RzIGdldHRpbmcgaW5jb21pbmcgdHJhbnNmZXJzXCIpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRJc0luY29taW5nKHRydWUpO1xuICAgIHJldHVybiB0aGlzLmdldFRyYW5zZmVycyhxdWVyeU5vcm1hbGl6ZWQpIGFzIHVua25vd24gYXMgTW9uZXJvSW5jb21pbmdUcmFuc2ZlcltdO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IG91dGdvaW5nIHRyYW5zZmVycy5cbiAgICogXG4gICAqIEBwYXJhbSB7UGFydGlhbDxNb25lcm9UcmFuc2ZlclF1ZXJ5Pn0gW3F1ZXJ5XSAtIGNvbmZpZ3VyZXMgdGhlIHF1ZXJ5IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtxdWVyeS5hZGRyZXNzXSAtIGdldCBvdXRnb2luZyB0cmFuc2ZlcnMgZnJvbSBhIHNwZWNpZmljIGFkZHJlc3MgaW4gdGhlIHdhbGxldCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbcXVlcnkuYWNjb3VudEluZGV4XSAtIGdldCBvdXRnb2luZyB0cmFuc2ZlcnMgZnJvbSBhIHNwZWNpZmljIGFjY291bnQgaW5kZXggKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRleF0gLSBnZXQgb3V0Z29pbmcgdHJhbnNmZXJzIGZyb20gYSBzcGVjaWZpYyBzdWJhZGRyZXNzIGluZGV4IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtpbnRbXX0gW3F1ZXJ5LnN1YmFkZHJlc3NJbmRpY2VzXSAtIGdldCBvdXRnb2luZyB0cmFuc2ZlcnMgZnJvbSBzcGVjaWZpYyBzdWJhZGRyZXNzIGluZGljZXMgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludH0gW3F1ZXJ5LmFtb3VudF0gLSBhbW91bnQgYmVpbmcgdHJhbnNmZXJyZWQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge01vbmVyb0Rlc3RpbmF0aW9uW10gfCBNb25lcm9EZXN0aW5hdGlvbk1vZGVsW119IFtxdWVyeS5kZXN0aW5hdGlvbnNdIC0gaW5kaXZpZHVhbCBkZXN0aW5hdGlvbnMgb2YgYW4gb3V0Z29pbmcgdHJhbnNmZXIsIHdoaWNoIGlzIGxvY2FsIHdhbGxldCBkYXRhIGFuZCBOT1QgcmVjb3ZlcmFibGUgZnJvbSB0aGUgYmxvY2tjaGFpbiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3F1ZXJ5Lmhhc0Rlc3RpbmF0aW9uc10gLSBnZXQgdHJhbnNmZXJzIHRoYXQgaGF2ZSBkZXN0aW5hdGlvbnMgb3Igbm90IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtNb25lcm9UeFF1ZXJ5fSBbcXVlcnkudHhRdWVyeV0gLSBnZXQgdHJhbnNmZXJzIHdob3NlIHRyYW5zYWN0aW9uIG1lZXRzIHRoaXMgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb091dGdvaW5nVHJhbnNmZXJbXT59IG91dGdvaW5nIHRyYW5zZmVycyB0aGF0IG1lZXQgdGhlIHF1ZXJ5XG4gICAqL1xuICBhc3luYyBnZXRPdXRnb2luZ1RyYW5zZmVycyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvVHJhbnNmZXJRdWVyeT4pOiBQcm9taXNlPE1vbmVyb091dGdvaW5nVHJhbnNmZXJbXT4ge1xuICAgIGNvbnN0IHF1ZXJ5Tm9ybWFsaXplZDogTW9uZXJvVHJhbnNmZXJRdWVyeSA9IE1vbmVyb1dhbGxldC5ub3JtYWxpemVUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnlOb3JtYWxpemVkLmdldElzT3V0Z29pbmcoKSA9PT0gZmFsc2UpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlRyYW5zZmVyIHF1ZXJ5IGNvbnRyYWRpY3RzIGdldHRpbmcgb3V0Z29pbmcgdHJhbnNmZXJzXCIpO1xuICAgIHF1ZXJ5Tm9ybWFsaXplZC5zZXRJc091dGdvaW5nKHRydWUpO1xuICAgIHJldHVybiB0aGlzLmdldFRyYW5zZmVycyhxdWVyeU5vcm1hbGl6ZWQpIGFzIHVua25vd24gYXMgTW9uZXJvT3V0Z29pbmdUcmFuc2ZlcltdO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+R2V0IG91dHB1dHMgY3JlYXRlZCBmcm9tIHByZXZpb3VzIHRyYW5zYWN0aW9ucyB0aGF0IGJlbG9uZyB0byB0aGUgd2FsbGV0XG4gICAqIChpLmUuIHRoYXQgdGhlIHdhbGxldCBjYW4gc3BlbmQgb25lIHRpbWUpLiAgT3V0cHV0cyBhcmUgcGFydCBvZlxuICAgKiB0cmFuc2FjdGlvbnMgd2hpY2ggYXJlIHN0b3JlZCBpbiBibG9ja3Mgb24gdGhlIGJsb2NrY2hhaW4uPC9wPlxuICAgKiBcbiAgICogPHA+UmVzdWx0cyBjYW4gYmUgZmlsdGVyZWQgYnkgcGFzc2luZyBhIHF1ZXJ5IG9iamVjdC4gIE91dHB1dHMgbXVzdFxuICAgKiBtZWV0IGV2ZXJ5IGNyaXRlcmlhIGRlZmluZWQgaW4gdGhlIHF1ZXJ5IGluIG9yZGVyIHRvIGJlIHJldHVybmVkLiAgQWxsXG4gICAqIGZpbHRlcmluZyBpcyBvcHRpb25hbCBhbmQgbm8gZmlsdGVyaW5nIGlzIGFwcGxpZWQgd2hlbiBub3QgZGVmaW5lZC48L3A+XG4gICAqIFxuICAgKiBAcGFyYW0ge1Bhcml0YWw8TW9uZXJvT3V0cHV0UXVlcnk+fSBbcXVlcnldIC0gY29uZmlndXJlcyB0aGUgcXVlcnkgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW3F1ZXJ5LmFjY291bnRJbmRleF0gLSBnZXQgb3V0cHV0cyBhc3NvY2lhdGVkIHdpdGggYSBzcGVjaWZpYyBhY2NvdW50IGluZGV4IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtxdWVyeS5zdWJhZGRyZXNzSW5kZXhdIC0gZ2V0IG91dHB1dHMgYXNzb2NpYXRlZCB3aXRoIGEgc3BlY2lmaWMgc3ViYWRkcmVzcyBpbmRleCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7aW50W119IFtxdWVyeS5zdWJhZGRyZXNzSW5kaWNlc10gLSBnZXQgb3V0cHV0cyBhc3NvY2lhdGVkIHdpdGggc3BlY2lmaWMgc3ViYWRkcmVzcyBpbmRpY2VzIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtiaWdpbnR9IFtxdWVyeS5hbW91bnRdIC0gZ2V0IG91dHB1dHMgd2l0aCBhIHNwZWNpZmljIGFtb3VudCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7YmlnaW50fSBbcXVlcnkubWluQW1vdW50XSAtIGdldCBvdXRwdXRzIGdyZWF0ZXIgdGhhbiBvciBlcXVhbCB0byBhIG1pbmltdW0gYW1vdW50IChvcHRpb25hbClcbiAgICogQHBhcmFtIHtiaWdpbnR9IFtxdWVyeS5tYXhBbW91bnRdIC0gZ2V0IG91dHB1dHMgbGVzcyB0aGFuIG9yIGVxdWFsIHRvIGEgbWF4aW11bSBhbW91bnQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtxdWVyeS5pc1NwZW50XSAtIGdldCBvdXRwdXRzIHRoYXQgYXJlIHNwZW50IG9yIG5vdCAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfE1vbmVyb0tleUltYWdlfSBbcXVlcnkua2V5SW1hZ2VdIC0gZ2V0IG91dHB1dCB3aXRoIGEga2V5IGltYWdlIG9yIHdoaWNoIG1hdGNoZXMgZmllbGRzIGRlZmluZWQgaW4gYSBNb25lcm9LZXlJbWFnZSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhRdWVyeX0gW3F1ZXJ5LnR4UXVlcnldIC0gZ2V0IG91dHB1dHMgd2hvc2UgdHJhbnNhY3Rpb24gbWVldHMgdGhpcyBmaWx0ZXIgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb091dHB1dFdhbGxldFtdPn0gdGhlIHF1ZXJpZWQgb3V0cHV0c1xuICAgKi9cbiAgYXN5bmMgZ2V0T3V0cHV0cyhxdWVyeT86IFBhcnRpYWw8TW9uZXJvT3V0cHV0UXVlcnk+KTogUHJvbWlzZTxNb25lcm9PdXRwdXRXYWxsZXRbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBFeHBvcnQgb3V0cHV0cyBpbiBoZXggZm9ybWF0LlxuICAgKlxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFthbGxdIC0gZXhwb3J0IGFsbCBvdXRwdXRzIGlmIHRydWUsIGVsc2UgZXhwb3J0IHRoZSBvdXRwdXRzIHNpbmNlIHRoZSBsYXN0IGV4cG9ydCAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSBvdXRwdXRzIGluIGhleCBmb3JtYXRcbiAgICovXG4gIGFzeW5jIGV4cG9ydE91dHB1dHMoYWxsID0gZmFsc2UpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBJbXBvcnQgb3V0cHV0cyBpbiBoZXggZm9ybWF0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG91dHB1dHNIZXggLSBvdXRwdXRzIGluIGhleCBmb3JtYXRcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB0aGUgbnVtYmVyIG9mIG91dHB1dHMgaW1wb3J0ZWRcbiAgICovXG4gIGFzeW5jIGltcG9ydE91dHB1dHMob3V0cHV0c0hleDogc3RyaW5nKTogUHJvbWlzZTxudW1iZXI+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRXhwb3J0IHNpZ25lZCBrZXkgaW1hZ2VzLlxuICAgKiBcbiAgICogQHBhcmFtIHtib29sZWFufSBbYWxsXSAtIGV4cG9ydCBhbGwga2V5IGltYWdlcyBpZiB0cnVlLCBlbHNlIGV4cG9ydCB0aGUga2V5IGltYWdlcyBzaW5jZSB0aGUgbGFzdCBleHBvcnQgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT59IHRoZSB3YWxsZXQncyBzaWduZWQga2V5IGltYWdlc1xuICAgKi9cbiAgYXN5bmMgZXhwb3J0S2V5SW1hZ2VzKGFsbCA9IGZhbHNlKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEltcG9ydCBzaWduZWQga2V5IGltYWdlcyBhbmQgdmVyaWZ5IHRoZWlyIHNwZW50IHN0YXR1cy5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvS2V5SW1hZ2VbXX0ga2V5SW1hZ2VzIC0gaW1hZ2VzIHRvIGltcG9ydCBhbmQgdmVyaWZ5IChyZXF1aXJlcyBoZXggYW5kIHNpZ25hdHVyZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9LZXlJbWFnZUltcG9ydFJlc3VsdD59IHJlc3VsdHMgb2YgdGhlIGltcG9ydFxuICAgKi9cbiAgYXN5bmMgaW1wb3J0S2V5SW1hZ2VzKGtleUltYWdlczogTW9uZXJvS2V5SW1hZ2VbXSk6IFByb21pc2U8TW9uZXJvS2V5SW1hZ2VJbXBvcnRSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IG5ldyBrZXkgaW1hZ2VzIGZyb20gdGhlIGxhc3QgaW1wb3J0ZWQgb3V0cHV0cy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvS2V5SW1hZ2VbXT59IHRoZSBrZXkgaW1hZ2VzIGZyb20gdGhlIGxhc3QgaW1wb3J0ZWQgb3V0cHV0c1xuICAgKi9cbiAgYXN5bmMgZ2V0TmV3S2V5SW1hZ2VzRnJvbUxhc3RJbXBvcnQoKTogUHJvbWlzZTxNb25lcm9LZXlJbWFnZVtdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEZyZWV6ZSBhbiBvdXRwdXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SW1hZ2UgLSBrZXkgaW1hZ2Ugb2YgdGhlIG91dHB1dCB0byBmcmVlemVcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIGZyZWV6ZU91dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFRoYXcgYSBmcm96ZW4gb3V0cHV0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleUltYWdlIC0ga2V5IGltYWdlIG9mIHRoZSBvdXRwdXQgdG8gdGhhd1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgdGhhd091dHB1dChrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENoZWNrIGlmIGFuIG91dHB1dCBpcyBmcm96ZW4uXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30ga2V5SW1hZ2UgLSBrZXkgaW1hZ2Ugb2YgdGhlIG91dHB1dCB0byBjaGVjayBpZiBmcm96ZW5cbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGUgb3V0cHV0IGlzIGZyb3plbiwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBpc091dHB1dEZyb3plbihrZXlJbWFnZTogc3RyaW5nKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENyZWF0ZSBhIHRyYW5zYWN0aW9uIHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gdGhpcyB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4Q29uZmlnfSBjb25maWcgLSBjb25maWd1cmVzIHRoZSB0cmFuc2FjdGlvbiB0byBjcmVhdGUgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmFkZHJlc3MgLSBzaW5nbGUgZGVzdGluYXRpb24gYWRkcmVzcyAocmVxdWlyZWQgdW5sZXNzIGBkZXN0aW5hdGlvbnNgIHByb3ZpZGVkKVxuICAgKiBAcGFyYW0ge2JpZ2ludHxzdHJpbmd9IGNvbmZpZy5hbW91bnQgLSBzaW5nbGUgZGVzdGluYXRpb24gYW1vdW50IChyZXF1aXJlZCB1bmxlc3MgYGRlc3RpbmF0aW9uc2AgcHJvdmlkZWQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBjb25maWcuYWNjb3VudEluZGV4IC0gc291cmNlIGFjY291bnQgaW5kZXggdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSAocmVxdWlyZWQpXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbY29uZmlnLnN1YmFkZHJlc3NJbmRleF0gLSBzb3VyY2Ugc3ViYWRkcmVzcyBpbmRleCB0byB0cmFuc2ZlciBmdW5kcyBmcm9tIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtudW1iZXJbXX0gW2NvbmZpZy5zdWJhZGRyZXNzSW5kaWNlc10gLSBzb3VyY2Ugc3ViYWRkcmVzcyBpbmRpY2VzIHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtjb25maWcucmVsYXldIC0gcmVsYXkgdGhlIHRyYW5zYWN0aW9uIHRvIHBlZXJzIHRvIGNvbW1pdCB0byB0aGUgYmxvY2tjaGFpbiAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHBhcmFtIHtNb25lcm9UeFByaW9yaXR5fSBbY29uZmlnLnByaW9yaXR5XSAtIHRyYW5zYWN0aW9uIHByaW9yaXR5IChkZWZhdWx0IE1vbmVyb1R4UHJpb3JpdHkuTk9STUFMKVxuICAgKiBAcGFyYW0ge01vbmVyb0Rlc3RpbmF0aW9uW10gfCBNb25lcm9EZXN0aW5hdGlvbk1vZGVsW119IGNvbmZpZy5kZXN0aW5hdGlvbnMgLSBhZGRyZXNzZXMgYW5kIGFtb3VudHMgaW4gYSBtdWx0aS1kZXN0aW5hdGlvbiB0eCAocmVxdWlyZWQgdW5sZXNzIGBhZGRyZXNzYCBhbmQgYGFtb3VudGAgcHJvdmlkZWQpXG4gICAqIEBwYXJhbSB7bnVtYmVyW119IFtjb25maWcuc3VidHJhY3RGZWVGcm9tXSAtIGxpc3Qgb2YgZGVzdGluYXRpb24gaW5kaWNlcyB0byBzcGxpdCB0aGUgdHJhbnNhY3Rpb24gZmVlIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGF5bWVudElkXSAtIHRyYW5zYWN0aW9uIHBheW1lbnQgSUQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludHxzdHJpbmd9IFtjb25maWcudW5sb2NrVGltZV0gLSBtaW5pbXVtIGhlaWdodCBvciB0aW1lc3RhbXAgZm9yIHRoZSB0cmFuc2FjdGlvbiB0byB1bmxvY2sgKGRlZmF1bHQgMClcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldD59IHRoZSBjcmVhdGVkIHRyYW5zYWN0aW9uXG4gICAqL1xuICBhc3luYyBjcmVhdGVUeChjb25maWc6IFBhcnRpYWw8TW9uZXJvVHhDb25maWc+KTogUHJvbWlzZTxNb25lcm9UeFdhbGxldD4ge1xuICAgIGNvbnN0IGNvbmZpZ05vcm1hbGl6ZWQ6IE1vbmVyb1R4Q29uZmlnID0gTW9uZXJvV2FsbGV0Lm5vcm1hbGl6ZUNyZWF0ZVR4c0NvbmZpZyhjb25maWcpO1xuICAgIGlmIChjb25maWdOb3JtYWxpemVkLmdldENhblNwbGl0KCkgIT09IHVuZGVmaW5lZCkgYXNzZXJ0LmVxdWFsKGNvbmZpZ05vcm1hbGl6ZWQuZ2V0Q2FuU3BsaXQoKSwgZmFsc2UsIFwiQ2Fubm90IHNwbGl0IHRyYW5zYWN0aW9ucyB1c2luZyBjcmVhdGVUeCgpOyB1c2UgY3JlYXRlVHhzKClcIik7XG4gICAgY29uZmlnTm9ybWFsaXplZC5zZXRDYW5TcGxpdChmYWxzZSk7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmNyZWF0ZVR4cyhjb25maWdOb3JtYWxpemVkKSlbMF07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDcmVhdGUgb25lIG9yIG1vcmUgdHJhbnNhY3Rpb25zIHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gdGhpcyB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvVHhDb25maWc+fSBjb25maWcgLSBjb25maWd1cmVzIHRoZSB0cmFuc2FjdGlvbnMgdG8gY3JlYXRlIChyZXF1aXJlZClcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5hZGRyZXNzIC0gc2luZ2xlIGRlc3RpbmF0aW9uIGFkZHJlc3MgKHJlcXVpcmVkIHVubGVzcyBgZGVzdGluYXRpb25zYCBwcm92aWRlZClcbiAgICogQHBhcmFtIHtiaWdpbnR8c3RyaW5nfSBjb25maWcuYW1vdW50IC0gc2luZ2xlIGRlc3RpbmF0aW9uIGFtb3VudCAocmVxdWlyZWQgdW5sZXNzIGBkZXN0aW5hdGlvbnNgIHByb3ZpZGVkKVxuICAgKiBAcGFyYW0ge251bWJlcn0gY29uZmlnLmFjY291bnRJbmRleCAtIHNvdXJjZSBhY2NvdW50IGluZGV4IHRvIHRyYW5zZmVyIGZ1bmRzIGZyb20gKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy5zdWJhZGRyZXNzSW5kZXhdIC0gc291cmNlIHN1YmFkZHJlc3MgaW5kZXggdG8gdHJhbnNmZXIgZnVuZHMgZnJvbSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7aW50W119IFtjb25maWcuc3ViYWRkcmVzc0luZGljZXNdIC0gc291cmNlIHN1YmFkZHJlc3MgaW5kaWNlcyB0byB0cmFuc2ZlciBmdW5kcyBmcm9tIChvcHRpb25hbClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnJlbGF5XSAtIHJlbGF5IHRoZSB0cmFuc2FjdGlvbnMgdG8gcGVlcnMgdG8gY29tbWl0IHRvIHRoZSBibG9ja2NoYWluIChkZWZhdWx0IGZhbHNlKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UHJpb3JpdHl9IFtjb25maWcucHJpb3JpdHldIC0gdHJhbnNhY3Rpb24gcHJpb3JpdHkgKGRlZmF1bHQgTW9uZXJvVHhQcmlvcml0eS5OT1JNQUwpXG4gICAqIEBwYXJhbSB7TW9uZXJvRGVzdGluYXRpb25bXSB8IE1vbmVyb0Rlc3RpbmF0aW9uTW9kZWxbXX0gY29uZmlnLmRlc3RpbmF0aW9ucyAtIGFkZHJlc3NlcyBhbmQgYW1vdW50cyBpbiBhIG11bHRpLWRlc3RpbmF0aW9uIHR4IChyZXF1aXJlZCB1bmxlc3MgYGFkZHJlc3NgIGFuZCBgYW1vdW50YCBwcm92aWRlZClcbiAgICogQHBhcmFtIHtzdHJpbmd9IFtjb25maWcucGF5bWVudElkXSAtIHRyYW5zYWN0aW9uIHBheW1lbnQgSUQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2JpZ2ludHxzdHJpbmd9IFtjb25maWcudW5sb2NrVGltZV0gLSBtaW5pbXVtIGhlaWdodCBvciB0aW1lc3RhbXAgZm9yIHRoZSB0cmFuc2FjdGlvbnMgdG8gdW5sb2NrIChkZWZhdWx0IDApXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5jYW5TcGxpdF0gLSBhbGxvdyBmdW5kcyB0byBiZSB0cmFuc2ZlcnJlZCB1c2luZyBtdWx0aXBsZSB0cmFuc2FjdGlvbnMgKGRlZmF1bHQgdHJ1ZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPn0gdGhlIGNyZWF0ZWQgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBjcmVhdGVUeHMoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTd2VlcCBhbiBvdXRwdXQgYnkga2V5IGltYWdlLlxuICAgKiBcbiAgICogQHBhcmFtIHtQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPn0gY29uZmlnIC0gY29uZmlndXJlcyB0aGUgdHJhbnNhY3Rpb24gdG8gY3JlYXRlIChyZXF1aXJlZClcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5hZGRyZXNzIC0gc2luZ2xlIGRlc3RpbmF0aW9uIGFkZHJlc3MgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gY29uZmlnLmtleUltYWdlIC0ga2V5IGltYWdlIHRvIHN3ZWVwIChyZXF1aXJlZClcbiAgICogQHBhcmFtIHtib29sZWFufSBbY29uZmlnLnJlbGF5XSAtIHJlbGF5IHRoZSB0cmFuc2FjdGlvbiB0byBwZWVycyB0byBjb21taXQgdG8gdGhlIGJsb2NrY2hhaW4gKGRlZmF1bHQgZmFsc2UpXG4gICAqIEBwYXJhbSB7YmlnaW50fHN0cmluZ30gW2NvbmZpZy51bmxvY2tUaW1lXSAtIG1pbmltdW0gaGVpZ2h0IG9yIHRpbWVzdGFtcCBmb3IgdGhlIHRyYW5zYWN0aW9uIHRvIHVubG9jayAoZGVmYXVsdCAwKVxuICAgKiBAcGFyYW0ge01vbmVyb1R4UHJpb3JpdHl9IFtjb25maWcucHJpb3JpdHldIC0gdHJhbnNhY3Rpb24gcHJpb3JpdHkgKGRlZmF1bHQgTW9uZXJvVHhQcmlvcml0eS5OT1JNQUwpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhXYWxsZXQ+fSB0aGUgY3JlYXRlZCB0cmFuc2FjdGlvblxuICAgKi9cbiAgYXN5bmMgc3dlZXBPdXRwdXQoY29uZmlnOiBQYXJ0aWFsPE1vbmVyb1R4Q29uZmlnPik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFN3ZWVwIGFsbCB1bmxvY2tlZCBmdW5kcyBhY2NvcmRpbmcgdG8gdGhlIGdpdmVuIGNvbmZpZ3VyYXRpb24uXG4gICAqIFxuICAgKiBAcGFyYW0ge1BhcnRpYWw8TW9uZXJvVHhDb25maWc+fSBjb25maWcgLSBjb25maWd1cmVzIHRoZSB0cmFuc2FjdGlvbnMgdG8gY3JlYXRlIChyZXF1aXJlZClcbiAgICogQHBhcmFtIHtzdHJpbmd9IGNvbmZpZy5hZGRyZXNzIC0gc2luZ2xlIGRlc3RpbmF0aW9uIGFkZHJlc3MgKHJlcXVpcmVkKVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2NvbmZpZy5hY2NvdW50SW5kZXhdIC0gc291cmNlIGFjY291bnQgaW5kZXggdG8gc3dlZXAgZnJvbSAob3B0aW9uYWwsIGRlZmF1bHRzIHRvIGFsbCBhY2NvdW50cylcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtjb25maWcuc3ViYWRkcmVzc0luZGV4XSAtIHNvdXJjZSBzdWJhZGRyZXNzIGluZGV4IHRvIHN3ZWVwIGZyb20gKG9wdGlvbmFsLCBkZWZhdWx0cyB0byBhbGwgc3ViYWRkcmVzc2VzKVxuICAgKiBAcGFyYW0ge251bWJlcltdfSBbY29uZmlnLnN1YmFkZHJlc3NJbmRpY2VzXSAtIHNvdXJjZSBzdWJhZGRyZXNzIGluZGljZXMgdG8gc3dlZXAgZnJvbSAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5yZWxheV0gLSByZWxheSB0aGUgdHJhbnNhY3Rpb25zIHRvIHBlZXJzIHRvIGNvbW1pdCB0byB0aGUgYmxvY2tjaGFpbiAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHBhcmFtIHtNb25lcm9UeFByaW9yaXR5fSBbY29uZmlnLnByaW9yaXR5XSAtIHRyYW5zYWN0aW9uIHByaW9yaXR5IChkZWZhdWx0IE1vbmVyb1R4UHJpb3JpdHkuTk9STUFMKVxuICAgKiBAcGFyYW0ge2JpZ2ludHxzdHJpbmd9IFtjb25maWcudW5sb2NrVGltZV0gLSBtaW5pbXVtIGhlaWdodCBvciB0aW1lc3RhbXAgZm9yIHRoZSB0cmFuc2FjdGlvbnMgdG8gdW5sb2NrIChkZWZhdWx0IDApXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2NvbmZpZy5zd2VlcEVhY2hTdWJhZGRyZXNzXSAtIHN3ZWVwIGVhY2ggc3ViYWRkcmVzcyBpbmRpdmlkdWFsbHkgaWYgdHJ1ZSAoZGVmYXVsdCBmYWxzZSlcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFdhbGxldFtdPn0gdGhlIGNyZWF0ZWQgdHJhbnNhY3Rpb25zXG4gICAqL1xuICBhc3luYyBzd2VlcFVubG9ja2VkKGNvbmZpZzogUGFydGlhbDxNb25lcm9UeENvbmZpZz4pOiBQcm9taXNlPE1vbmVyb1R4V2FsbGV0W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogPHA+U3dlZXAgYWxsIHVubWl4YWJsZSBkdXN0IG91dHB1dHMgYmFjayB0byB0aGUgd2FsbGV0IHRvIG1ha2UgdGhlbSBlYXNpZXIgdG8gc3BlbmQgYW5kIG1peC48L3A+XG4gICAqIFxuICAgKiA8cD5OT1RFOiBEdXN0IG9ubHkgZXhpc3RzIHByZSBSQ1QsIHNvIHRoaXMgbWV0aG9kIHdpbGwgdGhyb3cgXCJubyBkdXN0IHRvIHN3ZWVwXCIgb24gbmV3IHdhbGxldHMuPC9wPlxuICAgKiBcbiAgICogQHBhcmFtIHtib29sZWFufSBbcmVsYXldIC0gc3BlY2lmaWVzIGlmIHRoZSByZXN1bHRpbmcgdHJhbnNhY3Rpb24gc2hvdWxkIGJlIHJlbGF5ZWQgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhXYWxsZXRbXT59IHRoZSBjcmVhdGVkIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgc3dlZXBEdXN0KHJlbGF5PzogYm9vbGVhbik6IFByb21pc2U8TW9uZXJvVHhXYWxsZXRbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZWxheSBhIHByZXZpb3VzbHkgY3JlYXRlZCB0cmFuc2FjdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7KE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKX0gdHhPck1ldGFkYXRhIC0gdHJhbnNhY3Rpb24gb3IgaXRzIG1ldGFkYXRhIHRvIHJlbGF5XG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIGhhc2ggb2YgdGhlIHJlbGF5ZWQgdHhcbiAgICovXG4gIGFzeW5jIHJlbGF5VHgodHhPck1ldGFkYXRhOiBNb25lcm9UeFdhbGxldCB8IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLnJlbGF5VHhzKFt0eE9yTWV0YWRhdGFdKSlbMF07XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZWxheSBwcmV2aW91c2x5IGNyZWF0ZWQgdHJhbnNhY3Rpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHsoTW9uZXJvVHhXYWxsZXRbXSB8IHN0cmluZ1tdKX0gdHhzT3JNZXRhZGF0YXMgLSB0cmFuc2FjdGlvbnMgb3IgdGhlaXIgbWV0YWRhdGEgdG8gcmVsYXlcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmdbXT59IHRoZSBoYXNoZXMgb2YgdGhlIHJlbGF5ZWQgdHhzXG4gICAqL1xuICBhc3luYyByZWxheVR4cyh0eHNPck1ldGFkYXRhczogKE1vbmVyb1R4V2FsbGV0IHwgc3RyaW5nKVtdKTogUHJvbWlzZTxzdHJpbmdbXT4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZXNjcmliZSBhIHR4IHNldCBmcm9tIHVuc2lnbmVkIHR4IGhleC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB1bnNpZ25lZFR4SGV4IC0gdW5zaWduZWQgdHggaGV4XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhTZXQ+fSB0aGUgdHggc2V0IGNvbnRhaW5pbmcgc3RydWN0dXJlZCB0cmFuc2FjdGlvbnNcbiAgICovXG4gIGFzeW5jIGRlc2NyaWJlVW5zaWduZWRUeFNldCh1bnNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgcmV0dXJuIHRoaXMuZGVzY3JpYmVUeFNldChuZXcgTW9uZXJvVHhTZXQoKS5zZXRVbnNpZ25lZFR4SGV4KHVuc2lnbmVkVHhIZXgpKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIERlc2NyaWJlIGEgdHggc2V0IGZyb20gbXVsdGlzaWcgdHggaGV4LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG11bHRpc2lnVHhIZXggLSBtdWx0aXNpZyB0eCBoZXhcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeFNldD59IHRoZSB0eCBzZXQgY29udGFpbmluZyBzdHJ1Y3R1cmVkIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgZGVzY3JpYmVNdWx0aXNpZ1R4U2V0KG11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvVHhTZXQ+IHtcbiAgICByZXR1cm4gdGhpcy5kZXNjcmliZVR4U2V0KG5ldyBNb25lcm9UeFNldCgpLnNldE11bHRpc2lnVHhIZXgobXVsdGlzaWdUeEhleCkpO1xuICB9XG4gIFxuICAvKipcbiAgICogRGVzY3JpYmUgYSB0eCBzZXQgY29udGFpbmluZyB1bnNpZ25lZCBvciBtdWx0aXNpZyB0eCBoZXggdG8gYSBuZXcgdHggc2V0IGNvbnRhaW5pbmcgc3RydWN0dXJlZCB0cmFuc2FjdGlvbnMuXG4gICAqIFxuICAgKiBAcGFyYW0ge01vbmVyb1R4U2V0fSB0eFNldCAtIGEgdHggc2V0IGNvbnRhaW5pbmcgdW5zaWduZWQgb3IgbXVsdGlzaWcgdHggaGV4XG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvVHhTZXQ+fSB0eFNldCAtIHRoZSB0eCBzZXQgY29udGFpbmluZyBzdHJ1Y3R1cmVkIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgZGVzY3JpYmVUeFNldCh0eFNldDogTW9uZXJvVHhTZXQpOiBQcm9taXNlPE1vbmVyb1R4U2V0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNpZ24gdW5zaWduZWQgdHJhbnNhY3Rpb25zIGZyb20gYSB2aWV3LW9ubHkgd2FsbGV0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHVuc2lnbmVkVHhIZXggLSB1bnNpZ25lZCB0cmFuc2FjdGlvbiBoZXggZnJvbSB3aGVuIHRoZSB0cmFuc2FjdGlvbnMgd2VyZSBjcmVhdGVkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHNpZ25lZCB0cmFuc2FjdGlvbiBoZXhcbiAgICovXG4gIGFzeW5jIHNpZ25UeHModW5zaWduZWRUeEhleDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3VibWl0IHNpZ25lZCB0cmFuc2FjdGlvbnMgZnJvbSBhIHZpZXctb25seSB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2lnbmVkVHhIZXggLSBzaWduZWQgdHJhbnNhY3Rpb24gaGV4IGZyb20gc2lnblR4cygpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nW10+fSB0aGUgcmVzdWx0aW5nIHRyYW5zYWN0aW9uIGhhc2hlc1xuICAgKi9cbiAgYXN5bmMgc3VibWl0VHhzKHNpZ25lZFR4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNpZ24gYSBtZXNzYWdlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSB0aGUgbWVzc2FnZSB0byBzaWduXG4gICAqIEBwYXJhbSB7TW9uZXJvTWVzc2FnZVNpZ25hdHVyZVR5cGV9IFtzaWduYXR1cmVUeXBlXSAtIHNpZ24gd2l0aCBzcGVuZCBrZXkgb3IgdmlldyBrZXkgKGRlZmF1bHQgc3BlbmQga2V5KVxuICAgKiBAcGFyYW0ge251bWJlcn0gW2FjY291bnRJZHhdIC0gdGhlIGFjY291bnQgaW5kZXggb2YgdGhlIG1lc3NhZ2Ugc2lnbmF0dXJlIChkZWZhdWx0IDApXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBbc3ViYWRkcmVzc0lkeF0gLSB0aGUgc3ViYWRkcmVzcyBpbmRleCBvZiB0aGUgbWVzc2FnZSBzaWduYXR1cmUgKGRlZmF1bHQgMClcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgc2lnbmF0dXJlXG4gICAqL1xuICBhc3luYyBzaWduTWVzc2FnZShtZXNzYWdlOiBzdHJpbmcsIHNpZ25hdHVyZVR5cGUgPSBNb25lcm9NZXNzYWdlU2lnbmF0dXJlVHlwZS5TSUdOX1dJVEhfU1BFTkRfS0VZLCBhY2NvdW50SWR4ID0gMCwgc3ViYWRkcmVzc0lkeCA9IDApOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBWZXJpZnkgYSBzaWduYXR1cmUgb24gYSBtZXNzYWdlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG1lc3NhZ2UgLSBzaWduZWQgbWVzc2FnZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIHNpZ25pbmcgYWRkcmVzc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gc2lnbmF0dXJlIC0gc2lnbmF0dXJlXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvTWVzc2FnZVNpZ25hdHVyZVJlc3VsdD59IHRydWUgaWYgdGhlIHNpZ25hdHVyZSBpcyBnb29kLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIHZlcmlmeU1lc3NhZ2UobWVzc2FnZTogc3RyaW5nLCBhZGRyZXNzOiBzdHJpbmcsIHNpZ25hdHVyZTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NZXNzYWdlU2lnbmF0dXJlUmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIHRyYW5zYWN0aW9uJ3Mgc2VjcmV0IGtleSBmcm9tIGl0cyBoYXNoLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IHR4SGFzaCAtIHRyYW5zYWN0aW9uJ3MgaGFzaFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IC0gdHJhbnNhY3Rpb24ncyBzZWNyZXQga2V5XG4gICAqL1xuICBhc3luYyBnZXRUeEtleSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENoZWNrIGEgdHJhbnNhY3Rpb24gaW4gdGhlIGJsb2NrY2hhaW4gd2l0aCBpdHMgc2VjcmV0IGtleS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSB0cmFuc2FjdGlvbiB0byBjaGVja1xuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhLZXkgLSB0cmFuc2FjdGlvbidzIHNlY3JldCBrZXlcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBkZXN0aW5hdGlvbiBwdWJsaWMgYWRkcmVzcyBvZiB0aGUgdHJhbnNhY3Rpb25cbiAgICogQHJldHVybiB7cm9taXNlPE1vbmVyb0NoZWNrVHg+fSB0aGUgcmVzdWx0IG9mIHRoZSBjaGVja1xuICAgKi9cbiAgYXN5bmMgY2hlY2tUeEtleSh0eEhhc2g6IHN0cmluZywgdHhLZXk6IHN0cmluZywgYWRkcmVzczogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9DaGVja1R4PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIHRyYW5zYWN0aW9uIHNpZ25hdHVyZSB0byBwcm92ZSBpdC5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSB0cmFuc2FjdGlvbiB0byBwcm92ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIGRlc3RpbmF0aW9uIHB1YmxpYyBhZGRyZXNzIG9mIHRoZSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge3N0cmluZ30gW21lc3NhZ2VdIC0gbWVzc2FnZSB0byBpbmNsdWRlIHdpdGggdGhlIHNpZ25hdHVyZSB0byBmdXJ0aGVyIGF1dGhlbnRpY2F0ZSB0aGUgcHJvb2YgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB0cmFuc2FjdGlvbiBzaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIGdldFR4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFByb3ZlIGEgdHJhbnNhY3Rpb24gYnkgY2hlY2tpbmcgaXRzIHNpZ25hdHVyZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSB0cmFuc2FjdGlvbiB0byBwcm92ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gYWRkcmVzcyAtIGRlc3RpbmF0aW9uIHB1YmxpYyBhZGRyZXNzIG9mIHRoZSB0cmFuc2FjdGlvblxuICAgKiBAcGFyYW0ge3N0cmluZyB8IHVuZGVmaW5lZH0gbWVzc2FnZSAtIG1lc3NhZ2UgaW5jbHVkZWQgd2l0aCB0aGUgc2lnbmF0dXJlIHRvIGZ1cnRoZXIgYXV0aGVudGljYXRlIHRoZSBwcm9vZlxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2lnbmF0dXJlICAtIHRyYW5zYWN0aW9uIHNpZ25hdHVyZSB0byBjb25maXJtXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQ2hlY2tUeD59IHRoZSByZXN1bHQgb2YgdGhlIGNoZWNrXG4gICAqL1xuICBhc3luYyBjaGVja1R4UHJvb2YodHhIYXNoOiBzdHJpbmcsIGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tUeD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBhIHNpZ25hdHVyZSB0byBwcm92ZSBhIHNwZW5kLiBVbmxpa2UgcHJvdmluZyBhIHRyYW5zYWN0aW9uLCBpdCBkb2VzIG5vdCByZXF1aXJlIHRoZSBkZXN0aW5hdGlvbiBwdWJsaWMgYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSB0cmFuc2FjdGlvbiB0byBwcm92ZVxuICAgKiBAcGFyYW0ge3N0cmluZ30gW21lc3NhZ2VdIC0gbWVzc2FnZSB0byBpbmNsdWRlIHdpdGggdGhlIHNpZ25hdHVyZSB0byBmdXJ0aGVyIGF1dGhlbnRpY2F0ZSB0aGUgcHJvb2YgKG9wdGlvbmFsKVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSB0cmFuc2FjdGlvbiBzaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIGdldFNwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U/OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBQcm92ZSBhIHNwZW5kIHVzaW5nIGEgc2lnbmF0dXJlLiBVbmxpa2UgcHJvdmluZyBhIHRyYW5zYWN0aW9uLCBpdCBkb2VzIG5vdCByZXF1aXJlIHRoZSBkZXN0aW5hdGlvbiBwdWJsaWMgYWRkcmVzcy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0eEhhc2ggLSB0cmFuc2FjdGlvbiB0byBwcm92ZVxuICAgKiBAcGFyYW0ge3N0cmluZyB8IHVuZGVmaW5lZH0gbWVzc2FnZSAtIG1lc3NhZ2UgaW5jbHVkZWQgd2l0aCB0aGUgc2lnbmF0dXJlIHRvIGZ1cnRoZXIgYXV0aGVudGljYXRlIHRoZSBwcm9vZiAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBzaWduYXR1cmUgLSB0cmFuc2FjdGlvbiBzaWduYXR1cmUgdG8gY29uZmlybVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSBzaWduYXR1cmUgaXMgZ29vZCwgZmFsc2Ugb3RoZXJ3aXNlXG4gICAqL1xuICBhc3luYyBjaGVja1NwZW5kUHJvb2YodHhIYXNoOiBzdHJpbmcsIG1lc3NhZ2U6IHN0cmluZyB8IHVuZGVmaW5lZCwgc2lnbmF0dXJlOiBzdHJpbmcpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2VuZXJhdGUgYSBzaWduYXR1cmUgdG8gcHJvdmUgdGhlIGVudGlyZSBiYWxhbmNlIG9mIHRoZSB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gW21lc3NhZ2VdIC0gbWVzc2FnZSBpbmNsdWRlZCB3aXRoIHRoZSBzaWduYXR1cmUgdG8gZnVydGhlciBhdXRoZW50aWNhdGUgdGhlIHByb29mIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgcmVzZXJ2ZSBwcm9vZiBzaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZldhbGxldChtZXNzYWdlPzogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2VuZXJhdGUgYSBzaWduYXR1cmUgdG8gcHJvdmUgYW4gYXZhaWxhYmxlIGFtb3VudCBpbiBhbiBhY2NvdW50LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGFjY291bnRJZHggLSBhY2NvdW50IHRvIHByb3ZlIG93bmVyc2hpcCBvZiB0aGUgYW1vdW50XG4gICAqIEBwYXJhbSB7YmlnaW50fSBhbW91bnQgLSBtaW5pbXVtIGFtb3VudCB0byBwcm92ZSBhcyBhdmFpbGFibGUgaW4gdGhlIGFjY291bnRcbiAgICogQHBhcmFtIHtzdHJpbmd9IFttZXNzYWdlXSAtIG1lc3NhZ2UgdG8gaW5jbHVkZSB3aXRoIHRoZSBzaWduYXR1cmUgdG8gZnVydGhlciBhdXRoZW50aWNhdGUgdGhlIHByb29mIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxzdHJpbmc+fSB0aGUgcmVzZXJ2ZSBwcm9vZiBzaWduYXR1cmVcbiAgICovXG4gIGFzeW5jIGdldFJlc2VydmVQcm9vZkFjY291bnQoYWNjb3VudElkeDogbnVtYmVyLCBhbW91bnQ6IGJpZ2ludCwgbWVzc2FnZT86IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBQcm92ZXMgYSB3YWxsZXQgaGFzIGEgZGlzcG9zYWJsZSByZXNlcnZlIHVzaW5nIGEgc2lnbmF0dXJlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGFkZHJlc3MgLSBwdWJsaWMgd2FsbGV0IGFkZHJlc3NcbiAgICogQHBhcmFtIHtzdHJpbmcgfCB1bmRlZmluZWR9IG1lc3NhZ2UgLSBtZXNzYWdlIGluY2x1ZGVkIHdpdGggdGhlIHNpZ25hdHVyZSB0byBmdXJ0aGVyIGF1dGhlbnRpY2F0ZSB0aGUgcHJvb2YgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2lnbmF0dXJlIC0gcmVzZXJ2ZSBwcm9vZiBzaWduYXR1cmUgdG8gY2hlY2tcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9DaGVja1Jlc2VydmU+fSB0aGUgcmVzdWx0IG9mIGNoZWNraW5nIHRoZSBzaWduYXR1cmUgcHJvb2ZcbiAgICovXG4gIGFzeW5jIGNoZWNrUmVzZXJ2ZVByb29mKGFkZHJlc3M6IHN0cmluZywgbWVzc2FnZTogc3RyaW5nIHwgdW5kZWZpbmVkLCBzaWduYXR1cmU6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvQ2hlY2tSZXNlcnZlPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBhIHRyYW5zYWN0aW9uIG5vdGUuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gdHJhbnNhY3Rpb24gdG8gZ2V0IHRoZSBub3RlIG9mXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIHR4IG5vdGVcbiAgICovXG4gIGFzeW5jIGdldFR4Tm90ZSh0eEhhc2g6IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldFR4Tm90ZXMoW3R4SGFzaF0pKVswXTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBub3RlcyBmb3IgbXVsdGlwbGUgdHJhbnNhY3Rpb25zLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gdHhIYXNoZXMgLSBoYXNoZXMgb2YgdGhlIHRyYW5zYWN0aW9ucyB0byBnZXQgbm90ZXMgZm9yXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nW10+fSBub3RlcyBmb3IgdGhlIHRyYW5zYWN0aW9uc1xuICAgKi9cbiAgYXN5bmMgZ2V0VHhOb3Rlcyh0eEhhc2hlczogc3RyaW5nW10pOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNldCBhIG5vdGUgZm9yIGEgc3BlY2lmaWMgdHJhbnNhY3Rpb24uXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdHhIYXNoIC0gaGFzaCBvZiB0aGUgdHJhbnNhY3Rpb24gdG8gc2V0IGEgbm90ZSBmb3JcbiAgICogQHBhcmFtIHtzdHJpbmd9IG5vdGUgLSB0aGUgdHJhbnNhY3Rpb24gbm90ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgc2V0VHhOb3RlKHR4SGFzaDogc3RyaW5nLCBub3RlOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBhd2FpdCB0aGlzLnNldFR4Tm90ZXMoW3R4SGFzaF0sIFtub3RlXSk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgbm90ZXMgZm9yIG11bHRpcGxlIHRyYW5zYWN0aW9ucy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nW119IHR4SGFzaGVzIC0gdHJhbnNhY3Rpb25zIHRvIHNldCBub3RlcyBmb3JcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gbm90ZXMgLSBub3RlcyB0byBzZXQgZm9yIHRoZSB0cmFuc2FjdGlvbnNcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldFR4Tm90ZXModHhIYXNoZXM6IHN0cmluZ1tdLCBub3Rlczogc3RyaW5nW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogR2V0IGFkZHJlc3MgYm9vayBlbnRyaWVzLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJbXX0gW2VudHJ5SW5kaWNlc10gLSBpbmRpY2VzIG9mIHRoZSBlbnRyaWVzIHRvIGdldFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPE1vbmVyb0FkZHJlc3NCb29rRW50cnlbXT59IHRoZSBhZGRyZXNzIGJvb2sgZW50cmllc1xuICAgKi9cbiAgYXN5bmMgZ2V0QWRkcmVzc0Jvb2tFbnRyaWVzKGVudHJ5SW5kaWNlcz86IG51bWJlcltdKTogUHJvbWlzZTxNb25lcm9BZGRyZXNzQm9va0VudHJ5W10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogQWRkIGFuIGFkZHJlc3MgYm9vayBlbnRyeS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBhZGRyZXNzIC0gZW50cnkgYWRkcmVzc1xuICAgKiBAcGFyYW0ge3N0cmluZ30gW2Rlc2NyaXB0aW9uXSAtIGVudHJ5IGRlc2NyaXB0aW9uIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB0aGUgaW5kZXggb2YgdGhlIGFkZGVkIGVudHJ5XG4gICAqL1xuICBhc3luYyBhZGRBZGRyZXNzQm9va0VudHJ5KGFkZHJlc3M6IHN0cmluZywgZGVzY3JpcHRpb24/OiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBFZGl0IGFuIGFkZHJlc3MgYm9vayBlbnRyeS5cbiAgICogXG4gICAqIEBwYXJhbSB7bnVtYmVyfSBpbmRleCAtIGluZGV4IG9mIHRoZSBhZGRyZXNzIGJvb2sgZW50cnkgdG8gZWRpdFxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IHNldEFkZHJlc3MgLSBzcGVjaWZpZXMgaWYgdGhlIGFkZHJlc3Mgc2hvdWxkIGJlIHVwZGF0ZWRcbiAgICogQHBhcmFtIHtzdHJpbmcgfCB1bmRlZmluZWR9IGFkZHJlc3MgLSB1cGRhdGVkIGFkZHJlc3NcbiAgICogQHBhcmFtIHtib29sZWFufSBzZXREZXNjcmlwdGlvbiAtIHNwZWNpZmllcyBpZiB0aGUgZGVzY3JpcHRpb24gc2hvdWxkIGJlIHVwZGF0ZWRcbiAgICogQHBhcmFtIHtzdHJpbmcgfCB1bmRlZmluZWR9IGRlc2NyaXB0aW9uIC0gdXBkYXRlZCBkZXNjcmlwdGlvblxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgZWRpdEFkZHJlc3NCb29rRW50cnkoaW5kZXg6IG51bWJlciwgc2V0QWRkcmVzczogYm9vbGVhbiwgYWRkcmVzczogc3RyaW5nIHwgdW5kZWZpbmVkLCBzZXREZXNjcmlwdGlvbjogYm9vbGVhbiwgZGVzY3JpcHRpb246IHN0cmluZyB8IHVuZGVmaW5lZCk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBEZWxldGUgYW4gYWRkcmVzcyBib29rIGVudHJ5LlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IGVudHJ5SWR4IC0gaW5kZXggb2YgdGhlIGVudHJ5IHRvIGRlbGV0ZVxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgZGVsZXRlQWRkcmVzc0Jvb2tFbnRyeShlbnRyeUlkeDogbnVtYmVyKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFRhZyBhY2NvdW50cy5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSB0YWcgLSB0YWcgdG8gYXBwbHkgdG8gdGhlIHNwZWNpZmllZCBhY2NvdW50c1xuICAgKiBAcGFyYW0ge251bWJlcltdfSBhY2NvdW50SW5kaWNlcyAtIGluZGljZXMgb2YgdGhlIGFjY291bnRzIHRvIHRhZ1xuICAgKiBAcmV0dXJuIHtQcm9taXNlPHZvaWQ+fVxuICAgKi9cbiAgYXN5bmMgdGFnQWNjb3VudHModGFnOiBzdHJpbmcsIGFjY291bnRJbmRpY2VzOiBudW1iZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cblxuICAvKipcbiAgICogVW50YWcgYWNjb3VudHMuXG4gICAqIFxuICAgKiBAcGFyYW0ge251bWJlcltdfSBhY2NvdW50SW5kaWNlcyAtIGluZGljZXMgb2YgdGhlIGFjY291bnRzIHRvIHVudGFnXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyB1bnRhZ0FjY291bnRzKGFjY291bnRJbmRpY2VzOiBudW1iZXJbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBSZXR1cm4gYWxsIGFjY291bnQgdGFncy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvQWNjb3VudFRhZ1tdPn0gdGhlIHdhbGxldCdzIGFjY291bnQgdGFnc1xuICAgKi9cbiAgYXN5bmMgZ2V0QWNjb3VudFRhZ3MoKTogUHJvbWlzZTxNb25lcm9BY2NvdW50VGFnW10+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG5cbiAgLyoqXG4gICAqIFNldHMgYSBodW1hbi1yZWFkYWJsZSBkZXNjcmlwdGlvbiBmb3IgYSB0YWcuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdGFnIC0gdGFnIHRvIHNldCBhIGRlc2NyaXB0aW9uIGZvclxuICAgKiBAcGFyYW0ge3N0cmluZ30gbGFiZWwgLSBsYWJlbCB0byBzZXQgZm9yIHRoZSB0YWdcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldEFjY291bnRUYWdMYWJlbCh0YWc6IHN0cmluZywgbGFiZWw6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBDcmVhdGVzIGEgcGF5bWVudCBVUkkgZnJvbSBhIHNlbmQgY29uZmlndXJhdGlvbi5cbiAgICogXG4gICAqIEBwYXJhbSB7TW9uZXJvVHhDb25maWd9IGNvbmZpZyAtIHNwZWNpZmllcyBjb25maWd1cmF0aW9uIGZvciBhIHBvdGVudGlhbCB0eFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoZSBwYXltZW50IHVyaVxuICAgKi9cbiAgYXN5bmMgZ2V0UGF5bWVudFVyaShjb25maWc6IE1vbmVyb1R4Q29uZmlnKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogUGFyc2VzIGEgcGF5bWVudCBVUkkgdG8gYSB0eCBjb25maWcuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gdXJpIC0gcGF5bWVudCB1cmkgdG8gcGFyc2VcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9UeENvbmZpZz59IHRoZSBzZW5kIGNvbmZpZ3VyYXRpb24gcGFyc2VkIGZyb20gdGhlIHVyaVxuICAgKi9cbiAgYXN5bmMgcGFyc2VQYXltZW50VXJpKHVyaTogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9UeENvbmZpZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgYW4gYXR0cmlidXRlLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IGtleSAtIGF0dHJpYnV0ZSB0byBnZXQgdGhlIHZhbHVlIG9mXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhlIGF0dHJpYnV0ZSdzIHZhbHVlXG4gICAqL1xuICBhc3luYyBnZXRBdHRyaWJ1dGUoa2V5OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTZXQgYW4gYXJiaXRyYXJ5IGF0dHJpYnV0ZS5cbiAgICogXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBrZXkgLSBhdHRyaWJ1dGUga2V5XG4gICAqIEBwYXJhbSB7c3RyaW5nfSB2YWwgLSBhdHRyaWJ1dGUgdmFsdWVcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNldEF0dHJpYnV0ZShrZXk6IHN0cmluZywgdmFsOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogU3RhcnQgbWluaW5nLlxuICAgKiBcbiAgICogQHBhcmFtIHtudW1iZXJ9IFtudW1UaHJlYWRzXSAtIG51bWJlciBvZiB0aHJlYWRzIGNyZWF0ZWQgZm9yIG1pbmluZyAob3B0aW9uYWwpXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW2JhY2tncm91bmRNaW5pbmddIC0gc3BlY2lmaWVzIGlmIG1pbmluZyBzaG91bGQgb2NjdXIgaW4gdGhlIGJhY2tncm91bmQgKG9wdGlvbmFsKVxuICAgKiBAcGFyYW0ge2Jvb2xlYW59IFtpZ25vcmVCYXR0ZXJ5XSAtIHNwZWNpZmllcyBpZiB0aGUgYmF0dGVyeSBzaG91bGQgYmUgaWdub3JlZCBmb3IgbWluaW5nIChvcHRpb25hbClcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN0YXJ0TWluaW5nKG51bVRocmVhZHM6IG51bWJlciwgYmFja2dyb3VuZE1pbmluZz86IGJvb2xlYW4sIGlnbm9yZUJhdHRlcnk/OiBib29sZWFuKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN0b3AgbWluaW5nLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHN0b3BNaW5pbmcoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEluZGljYXRlcyBpZiBpbXBvcnRpbmcgbXVsdGlzaWcgZGF0YSBpcyBuZWVkZWQgZm9yIHJldHVybmluZyBhIGNvcnJlY3QgYmFsYW5jZS5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8Ym9vbGVhbj59IHRydWUgaWYgaW1wb3J0aW5nIG11bHRpc2lnIGRhdGEgaXMgbmVlZGVkIGZvciByZXR1cm5pbmcgYSBjb3JyZWN0IGJhbGFuY2UsIGZhbHNlIG90aGVyd2lzZVxuICAgKi9cbiAgYXN5bmMgaXNNdWx0aXNpZ0ltcG9ydE5lZWRlZCgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoaXMgd2FsbGV0IGlzIGEgbXVsdGlzaWcgd2FsbGV0LlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTxib29sZWFuPn0gdHJ1ZSBpZiB0aGlzIGlzIGEgbXVsdGlzaWcgd2FsbGV0LCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzTXVsdGlzaWcoKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgcmV0dXJuIChhd2FpdCB0aGlzLmdldE11bHRpc2lnSW5mbygpKS5nZXRJc011bHRpc2lnKCk7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBHZXQgbXVsdGlzaWcgaW5mbyBhYm91dCB0aGlzIHdhbGxldC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8TW9uZXJvTXVsdGlzaWdJbmZvPn0gbXVsdGlzaWcgaW5mbyBhYm91dCB0aGlzIHdhbGxldFxuICAgKi9cbiAgYXN5bmMgZ2V0TXVsdGlzaWdJbmZvKCk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdJbmZvPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIEdldCBtdWx0aXNpZyBpbmZvIGFzIGhleCB0byBzaGFyZSB3aXRoIHBhcnRpY2lwYW50cyB0byBiZWdpbiBjcmVhdGluZyBhXG4gICAqIG11bHRpc2lnIHdhbGxldC5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhpcyB3YWxsZXQncyBtdWx0aXNpZyBoZXggdG8gc2hhcmUgd2l0aCBwYXJ0aWNpcGFudHNcbiAgICovXG4gIGFzeW5jIHByZXBhcmVNdWx0aXNpZygpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBNYWtlIHRoaXMgd2FsbGV0IG11bHRpc2lnIGJ5IGltcG9ydGluZyBtdWx0aXNpZyBoZXggZnJvbSBwYXJ0aWNpcGFudHMuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ1tdfSBtdWx0aXNpZ0hleGVzIC0gbXVsdGlzaWcgaGV4IGZyb20gZWFjaCBwYXJ0aWNpcGFudFxuICAgKiBAcGFyYW0ge251bWJlcn0gdGhyZXNob2xkIC0gbnVtYmVyIG9mIHNpZ25hdHVyZXMgbmVlZGVkIHRvIHNpZ24gdHJhbnNmZXJzXG4gICAqIEBwYXJhbSB7c3RyaW5nfSBwYXNzd29yZCAtIHdhbGxldCBwYXNzd29yZFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPHN0cmluZz59IHRoaXMgd2FsbGV0J3MgbXVsdGlzaWcgaGV4IHRvIHNoYXJlIHdpdGggcGFydGljaXBhbnRzXG4gICAqL1xuICBhc3luYyBtYWtlTXVsdGlzaWcobXVsdGlzaWdIZXhlczogc3RyaW5nW10sIHRocmVzaG9sZDogbnVtYmVyLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRXhjaGFuZ2UgbXVsdGlzaWcgaGV4IHdpdGggcGFydGljaXBhbnRzIGluIGEgTS9OIG11bHRpc2lnIHdhbGxldC5cbiAgICogXG4gICAqIFRoaXMgcHJvY2VzcyBtdXN0IGJlIHJlcGVhdGVkIHdpdGggcGFydGljaXBhbnRzIGV4YWN0bHkgTi1NIHRpbWVzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gbXVsdGlzaWdIZXhlcyBhcmUgbXVsdGlzaWcgaGV4IGZyb20gZWFjaCBwYXJ0aWNpcGFudFxuICAgKiBAcGFyYW0ge3N0cmluZ30gcGFzc3dvcmQgLSB3YWxsZXQncyBwYXNzd29yZCAvLyBUT0RPIG1vbmVyby1wcm9qZWN0OiByZWR1bmRhbnQ/IHdhbGxldCBpcyBjcmVhdGVkIHdpdGggcGFzc3dvcmRcbiAgICogQHJldHVybiB7UHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+fSB0aGUgcmVzdWx0IHdoaWNoIGhhcyB0aGUgbXVsdGlzaWcncyBhZGRyZXNzIHhvciB0aGlzIHdhbGxldCdzIG11bHRpc2lnIGhleCB0byBzaGFyZSB3aXRoIHBhcnRpY2lwYW50cyBpZmYgbm90IGRvbmVcbiAgICovXG4gIGFzeW5jIGV4Y2hhbmdlTXVsdGlzaWdLZXlzKG11bHRpc2lnSGV4ZXM6IHN0cmluZ1tdLCBwYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTxNb25lcm9NdWx0aXNpZ0luaXRSZXN1bHQ+IHtcbiAgICB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJOb3Qgc3VwcG9ydGVkXCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogRXhwb3J0IHRoaXMgd2FsbGV0J3MgbXVsdGlzaWcgaW5mbyBhcyBoZXggZm9yIG90aGVyIHBhcnRpY2lwYW50cy5cbiAgICogXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nPn0gdGhpcyB3YWxsZXQncyBtdWx0aXNpZyBpbmZvIGFzIGhleCBmb3Igb3RoZXIgcGFydGljaXBhbnRzXG4gICAqL1xuICBhc3luYyBleHBvcnRNdWx0aXNpZ0hleCgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWQ/XCIpO1xuICB9XG4gIFxuICAvKipcbiAgICogSW1wb3J0IG11bHRpc2lnIGluZm8gYXMgaGV4IGZyb20gb3RoZXIgcGFydGljaXBhbnRzLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmdbXX0gbXVsdGlzaWdIZXhlcyAtIG11bHRpc2lnIGhleCBmcm9tIGVhY2ggcGFydGljaXBhbnRcbiAgICogQHJldHVybiB7UHJvbWlzZTxudW1iZXI+fSB0aGUgbnVtYmVyIG9mIG91dHB1dHMgc2lnbmVkIHdpdGggdGhlIGdpdmVuIG11bHRpc2lnIGhleFxuICAgKi9cbiAgYXN5bmMgaW1wb3J0TXVsdGlzaWdIZXgobXVsdGlzaWdIZXhlczogc3RyaW5nW10pOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8qKlxuICAgKiBTaWduIG11bHRpc2lnIHRyYW5zYWN0aW9ucyBmcm9tIGEgbXVsdGlzaWcgd2FsbGV0LlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG11bHRpc2lnVHhIZXggLSB1bnNpZ25lZCBtdWx0aXNpZyB0cmFuc2FjdGlvbnMgYXMgaGV4XG4gICAqIEByZXR1cm4ge01vbmVyb011bHRpc2lnU2lnblJlc3VsdH0gdGhlIHJlc3VsdCBvZiBzaWduaW5nIHRoZSBtdWx0aXNpZyB0cmFuc2FjdGlvbnNcbiAgICovXG4gIGFzeW5jIHNpZ25NdWx0aXNpZ1R4SGV4KG11bHRpc2lnVHhIZXg6IHN0cmluZyk6IFByb21pc2U8TW9uZXJvTXVsdGlzaWdTaWduUmVzdWx0PiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFN1Ym1pdCBzaWduZWQgbXVsdGlzaWcgdHJhbnNhY3Rpb25zIGZyb20gYSBtdWx0aXNpZyB3YWxsZXQuXG4gICAqIFxuICAgKiBAcGFyYW0ge3N0cmluZ30gc2lnbmVkTXVsdGlzaWdUeEhleCAtIHNpZ25lZCBtdWx0aXNpZyBoZXggcmV0dXJuZWQgZnJvbSBzaWduTXVsdGlzaWdUeEhleCgpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8c3RyaW5nW10+fSB0aGUgcmVzdWx0aW5nIHRyYW5zYWN0aW9uIGhhc2hlc1xuICAgKi9cbiAgYXN5bmMgc3VibWl0TXVsdGlzaWdUeEhleChzaWduZWRNdWx0aXNpZ1R4SGV4OiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZ1tdPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIENoYW5nZSB0aGUgd2FsbGV0IHBhc3N3b3JkLlxuICAgKiBcbiAgICogQHBhcmFtIHtzdHJpbmd9IG9sZFBhc3N3b3JkIC0gdGhlIHdhbGxldCdzIG9sZCBwYXNzd29yZFxuICAgKiBAcGFyYW0ge3N0cmluZ30gbmV3UGFzc3dvcmQgLSB0aGUgd2FsbGV0J3MgbmV3IHBhc3N3b3JkXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBjaGFuZ2VQYXNzd29yZChvbGRQYXNzd29yZDogc3RyaW5nLCBuZXdQYXNzd29yZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIFNhdmUgdGhlIHdhbGxldCBhdCBpdHMgY3VycmVudCBwYXRoLlxuICAgKiBcbiAgICogQHJldHVybiB7UHJvbWlzZTx2b2lkPn1cbiAgICovXG4gIGFzeW5jIHNhdmUoKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTm90IHN1cHBvcnRlZFwiKTtcbiAgfVxuICBcbiAgLyoqXG4gICAqIE9wdGlvbmFsbHkgc2F2ZSB0aGVuIGNsb3NlIHRoZSB3YWxsZXQuXG4gICAqXG4gICAqIEBwYXJhbSB7Ym9vbGVhbn0gW3NhdmVdIC0gc3BlY2lmaWVzIGlmIHRoZSB3YWxsZXQgc2hvdWxkIGJlIHNhdmVkIGJlZm9yZSBiZWluZyBjbG9zZWQgKGRlZmF1bHQgZmFsc2UpXG4gICAqIEByZXR1cm4ge1Byb21pc2U8dm9pZD59XG4gICAqL1xuICBhc3luYyBjbG9zZShzYXZlID0gZmFsc2UpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBpZiAodGhpcy5jb25uZWN0aW9uTWFuYWdlcikgdGhpcy5jb25uZWN0aW9uTWFuYWdlci5yZW1vdmVMaXN0ZW5lcih0aGlzLmNvbm5lY3Rpb25NYW5hZ2VyTGlzdGVuZXIpO1xuICAgIHRoaXMuY29ubmVjdGlvbk1hbmFnZXIgPSB1bmRlZmluZWQ7XG4gICAgdGhpcy5jb25uZWN0aW9uTWFuYWdlckxpc3RlbmVyID0gdW5kZWZpbmVkO1xuICB9XG4gIFxuICAvKipcbiAgICogSW5kaWNhdGVzIGlmIHRoaXMgd2FsbGV0IGlzIGNsb3NlZCBvciBub3QuXG4gICAqIFxuICAgKiBAcmV0dXJuIHtQcm9taXNlPGJvb2xlYW4+fSB0cnVlIGlmIHRoZSB3YWxsZXQgaXMgY2xvc2VkLCBmYWxzZSBvdGhlcndpc2VcbiAgICovXG4gIGFzeW5jIGlzQ2xvc2VkKCk6IFByb21pc2U8Ym9vbGVhbj4ge1xuICAgIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk5vdCBzdXBwb3J0ZWRcIik7XG4gIH1cbiAgXG4gIC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tIFBSSVZBVEUgLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIFxuICBwcm90ZWN0ZWQgc3RhdGljIG5vcm1hbGl6ZVR4UXVlcnkocXVlcnkpIHtcbiAgICBpZiAocXVlcnkgaW5zdGFuY2VvZiBNb25lcm9UeFF1ZXJ5KSBxdWVyeSA9IHF1ZXJ5LmNvcHkoKTtcbiAgICBlbHNlIGlmIChBcnJheS5pc0FycmF5KHF1ZXJ5KSkgcXVlcnkgPSBuZXcgTW9uZXJvVHhRdWVyeSgpLnNldEhhc2hlcyhxdWVyeSk7XG4gICAgZWxzZSB7XG4gICAgICBxdWVyeSA9IE9iamVjdC5hc3NpZ24oe30sIHF1ZXJ5KTtcbiAgICAgIHF1ZXJ5ID0gbmV3IE1vbmVyb1R4UXVlcnkocXVlcnkpO1xuICAgIH1cbiAgICBpZiAocXVlcnkuZ2V0QmxvY2soKSA9PT0gdW5kZWZpbmVkKSBxdWVyeS5zZXRCbG9jayhuZXcgTW9uZXJvQmxvY2soKS5zZXRUeHMoW3F1ZXJ5XSkpO1xuICAgIGlmIChxdWVyeS5nZXRJbnB1dFF1ZXJ5KCkpIHF1ZXJ5LmdldElucHV0UXVlcnkoKS5zZXRUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnkuZ2V0T3V0cHV0UXVlcnkoKSkgcXVlcnkuZ2V0T3V0cHV0UXVlcnkoKS5zZXRUeFF1ZXJ5KHF1ZXJ5KTtcbiAgICByZXR1cm4gcXVlcnk7XG4gIH1cbiAgXG4gIHByb3RlY3RlZCBzdGF0aWMgbm9ybWFsaXplVHJhbnNmZXJRdWVyeShxdWVyeSkge1xuICAgIHF1ZXJ5ID0gbmV3IE1vbmVyb1RyYW5zZmVyUXVlcnkocXVlcnkpO1xuICAgIGlmIChxdWVyeS5nZXRUeFF1ZXJ5KCkgIT09IHVuZGVmaW5lZCkge1xuICAgICAgbGV0IHR4UXVlcnkgPSBxdWVyeS5nZXRUeFF1ZXJ5KCkuY29weSgpO1xuICAgICAgcXVlcnkgPSB0eFF1ZXJ5LmdldFRyYW5zZmVyUXVlcnkoKTtcbiAgICB9XG4gICAgaWYgKHF1ZXJ5LmdldFR4UXVlcnkoKSA9PT0gdW5kZWZpbmVkKSBxdWVyeS5zZXRUeFF1ZXJ5KG5ldyBNb25lcm9UeFF1ZXJ5KCkpO1xuICAgIHF1ZXJ5LmdldFR4UXVlcnkoKS5zZXRUcmFuc2ZlclF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkgPT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0VHhRdWVyeSgpLnNldEJsb2NrKG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbcXVlcnkuZ2V0VHhRdWVyeSgpXSkpO1xuICAgIHJldHVybiBxdWVyeTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVPdXRwdXRRdWVyeShxdWVyeSkge1xuICAgIHF1ZXJ5ID0gbmV3IE1vbmVyb091dHB1dFF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIGxldCB0eFF1ZXJ5ID0gcXVlcnkuZ2V0VHhRdWVyeSgpLmNvcHkoKTtcbiAgICAgIHF1ZXJ5ID0gdHhRdWVyeS5nZXRPdXRwdXRRdWVyeSgpO1xuICAgIH1cbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpID09PSB1bmRlZmluZWQpIHF1ZXJ5LnNldFR4UXVlcnkobmV3IE1vbmVyb1R4UXVlcnkoKSk7XG4gICAgcXVlcnkuZ2V0VHhRdWVyeSgpLnNldE91dHB1dFF1ZXJ5KHF1ZXJ5KTtcbiAgICBpZiAocXVlcnkuZ2V0VHhRdWVyeSgpLmdldEJsb2NrKCkgPT09IHVuZGVmaW5lZCkgcXVlcnkuZ2V0VHhRdWVyeSgpLnNldEJsb2NrKG5ldyBNb25lcm9CbG9jaygpLnNldFR4cyhbcXVlcnkuZ2V0VHhRdWVyeSgpXSkpO1xuICAgIHJldHVybiBxdWVyeTtcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVDcmVhdGVUeHNDb25maWcoY29uZmlnKSB7XG4gICAgaWYgKGNvbmZpZyA9PT0gdW5kZWZpbmVkIHx8ICEoY29uZmlnIGluc3RhbmNlb2YgT2JqZWN0KSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIE1vbmVyb1R4Q29uZmlnIG9yIGVxdWl2YWxlbnQgSlMgb2JqZWN0XCIpO1xuICAgIGNvbmZpZyA9IG5ldyBNb25lcm9UeENvbmZpZyhjb25maWcpO1xuICAgIGFzc2VydChjb25maWcuZ2V0RGVzdGluYXRpb25zKCkgJiYgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCA+IDAsIFwiTXVzdCBwcm92aWRlIGRlc3RpbmF0aW9uc1wiKTtcbiAgICBhc3NlcnQuZXF1YWwoY29uZmlnLmdldFN3ZWVwRWFjaFN1YmFkZHJlc3MoKSwgdW5kZWZpbmVkKTtcbiAgICBhc3NlcnQuZXF1YWwoY29uZmlnLmdldEJlbG93QW1vdW50KCksIHVuZGVmaW5lZCk7XG4gICAgcmV0dXJuIGNvbmZpZztcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVTd2VlcE91dHB1dENvbmZpZyhjb25maWcpIHtcbiAgICBpZiAoY29uZmlnID09PSB1bmRlZmluZWQgfHwgIShjb25maWcgaW5zdGFuY2VvZiBPYmplY3QpKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgTW9uZXJvVHhDb25maWcgb3IgZXF1aXZhbGVudCBKUyBvYmplY3RcIik7XG4gICAgY29uZmlnID0gbmV3IE1vbmVyb1R4Q29uZmlnKGNvbmZpZyk7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbmZpZy5nZXRTd2VlcEVhY2hTdWJhZGRyZXNzKCksIHVuZGVmaW5lZCk7XG4gICAgYXNzZXJ0LmVxdWFsKGNvbmZpZy5nZXRCZWxvd0Ftb3VudCgpLCB1bmRlZmluZWQpO1xuICAgIGFzc2VydC5lcXVhbChjb25maWcuZ2V0Q2FuU3BsaXQoKSwgdW5kZWZpbmVkLCBcIkNhbm5vdCBzcGxpdCB0cmFuc2FjdGlvbnMgd2hlbiBzd2VlcGluZyBhbiBvdXRwdXRcIik7XG4gICAgaWYgKCFjb25maWcuZ2V0RGVzdGluYXRpb25zKCkgfHwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCAhPT0gMSB8fCAhY29uZmlnLmdldERlc3RpbmF0aW9ucygpWzBdLmdldEFkZHJlc3MoKSkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGV4YWN0bHkgb25lIGRlc3RpbmF0aW9uIGFkZHJlc3MgdG8gc3dlZXAgb3V0cHV0IHRvXCIpO1xuICAgIGlmIChjb25maWcuZ2V0U3VidHJhY3RGZWVGcm9tKCkgJiYgY29uZmlnLmdldFN1YnRyYWN0RmVlRnJvbSgpLmxlbmd0aCA+IDApIHRocm93IG5ldyBNb25lcm9FcnJvcihcIlN3ZWVwIHRyYW5zZmVycyBkbyBub3Qgc3VwcG9ydCBzdWJ0cmFjdGluZyBmZWVzIGZyb20gZGVzdGluYXRpb25zXCIpO1xuICAgIHJldHVybiBjb25maWc7ICBcbiAgfVxuICBcbiAgcHJvdGVjdGVkIHN0YXRpYyBub3JtYWxpemVTd2VlcFVubG9ja2VkQ29uZmlnKGNvbmZpZykge1xuICAgIGlmIChjb25maWcgPT09IHVuZGVmaW5lZCB8fCAhKGNvbmZpZyBpbnN0YW5jZW9mIE9iamVjdCkpIHRocm93IG5ldyBNb25lcm9FcnJvcihcIk11c3QgcHJvdmlkZSBNb25lcm9UeENvbmZpZyBvciBlcXVpdmFsZW50IEpTIG9iamVjdFwiKTtcbiAgICBjb25maWcgPSBuZXcgTW9uZXJvVHhDb25maWcoY29uZmlnKTtcbiAgICBpZiAoY29uZmlnLmdldERlc3RpbmF0aW9ucygpID09PSB1bmRlZmluZWQgfHwgY29uZmlnLmdldERlc3RpbmF0aW9ucygpLmxlbmd0aCAhPSAxKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJNdXN0IHByb3ZpZGUgZXhhY3RseSBvbmUgZGVzdGluYXRpb24gdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBZGRyZXNzKCkgPT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGRlc3RpbmF0aW9uIGFkZHJlc3MgdG8gc3dlZXAgdG9cIik7XG4gICAgaWYgKGNvbmZpZy5nZXREZXN0aW5hdGlvbnMoKVswXS5nZXRBbW91bnQoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJDYW5ub3QgcHJvdmlkZSBhbW91bnQgaW4gc3dlZXAgY29uZmlnXCIpO1xuICAgIGlmIChjb25maWcuZ2V0S2V5SW1hZ2UoKSAhPT0gdW5kZWZpbmVkKSB0aHJvdyBuZXcgTW9uZXJvRXJyb3IoXCJLZXkgaW1hZ2UgZGVmaW5lZDsgdXNlIHN3ZWVwT3V0cHV0KCkgdG8gc3dlZXAgYW4gb3V0cHV0IGJ5IGl0cyBrZXkgaW1hZ2VcIik7XG4gICAgaWYgKGNvbmZpZy5nZXRTdWJhZGRyZXNzSW5kaWNlcygpICE9PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkubGVuZ3RoID09PSAwKSBjb25maWcuc2V0U3ViYWRkcmVzc0luZGljZXModW5kZWZpbmVkKTtcbiAgICBpZiAoY29uZmlnLmdldEFjY291bnRJbmRleCgpID09PSB1bmRlZmluZWQgJiYgY29uZmlnLmdldFN1YmFkZHJlc3NJbmRpY2VzKCkgIT09IHVuZGVmaW5lZCkgdGhyb3cgbmV3IE1vbmVyb0Vycm9yKFwiTXVzdCBwcm92aWRlIGFjY291bnQgaW5kZXggaWYgc3ViYWRkcmVzcyBpbmRpY2VzIGFyZSBwcm92aWRlZFwiKTtcbiAgICByZXR1cm4gY29uZmlnO1xuICB9XG59XG4iXSwibWFwcGluZ3MiOiJ5TEFBQSxJQUFBQSxPQUFBLEdBQUFDLHNCQUFBLENBQUFDLE9BQUE7Ozs7O0FBS0EsSUFBQUMsWUFBQSxHQUFBRixzQkFBQSxDQUFBQyxPQUFBOzs7O0FBSUEsSUFBQUUsZ0NBQUEsR0FBQUgsc0JBQUEsQ0FBQUMsT0FBQTtBQUNBLElBQUFHLFlBQUEsR0FBQUosc0JBQUEsQ0FBQUMsT0FBQTs7Ozs7O0FBTUEsSUFBQUksMkJBQUEsR0FBQUwsc0JBQUEsQ0FBQUMsT0FBQTs7OztBQUlBLElBQUFLLGtCQUFBLEdBQUFOLHNCQUFBLENBQUFDLE9BQUE7Ozs7Ozs7QUFPQSxJQUFBTSxvQkFBQSxHQUFBUCxzQkFBQSxDQUFBQyxPQUFBO0FBQ0EsSUFBQU8sZUFB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