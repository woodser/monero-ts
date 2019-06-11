#include "wallet/MoneroWallet.h"

#include "utils/MoneroUtils.h"
#include <stdio.h>
#include <iostream>
#include "mnemonics/electrum-words.h"
#include "mnemonics/english.h"

using namespace std;
using namespace cryptonote;
using namespace epee;

/**
 * Public interface for libmonero-cpp library.
 */
namespace monero {

  // -------------------------- MODEL SERIALIZATION ---------------------------

  boost::property_tree::ptree MoneroAccount::toPropertyTree() const {
    //cout << "MoneroAccount::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node;
    if (index != boost::none) node.put("index", *index);
    if (primaryAddress != boost::none) node.put("primaryAddress", *primaryAddress);
    if (balance != boost::none) node.put("balance", *balance);
    if (unlockedBalance != boost::none) node.put("unlockedBalance", *unlockedBalance);
    if (!subaddresses.empty()) node.add_child("subaddresses", MoneroUtils::toPropertyTree(subaddresses));
//    if (!subaddresses.empty()) {
//      boost::property_tree::ptree subaddressesNode;
//      for (const MoneroSubaddress& subaddress : subaddresses) {
//        subaddressesNode.push_back(std::make_pair("", subaddress.toPropertyTree()));
//      }
//      node.add_child("subaddresses", subaddressesNode);
//    }
    return node;
  }

  boost::property_tree::ptree MoneroSubaddress::toPropertyTree() const {
    //cout << "MoneroSubaddress::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node;
    if (accountIndex != boost::none) node.put("accountIndex", *accountIndex);
    if (index != boost::none) node.put("index", *index);
    if (address != boost::none) node.put("address", *address);
    if (label != boost::none) node.put("label", *label);
    if (balance != boost::none) node.put("balance", *balance);
    if (unlockedBalance != boost::none) node.put("unlockedBalance", *unlockedBalance);
    if (numUnspentOutputs != boost::none) node.put("numUnspentOutputs", *numUnspentOutputs);
    if (isUsed != boost::none) node.put("isUsed", *isUsed);
    if (numBlocksToUnlock != boost::none) node.put("numBlocksToUnlock", *numBlocksToUnlock);
    return node;
  }

  boost::property_tree::ptree MoneroTxWallet::toPropertyTree() const {
    //cout << "MoneroTxWallet::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node = MoneroTx::toPropertyTree();
    if (!vouts.empty()) throw runtime_error("vouts not implemented");
    if (!incomingTransfers.empty()) node.add_child("incomingTransfers", MoneroUtils::toPropertyTree(incomingTransfers));
    if (outgoingTransfer != boost::none) throw runtime_error("outgoingTransfers not implemented");
    if (note != boost::none) node.put("note", *note);
    return node;
  }

  boost::property_tree::ptree MoneroTxRequest::toPropertyTree() const {
    //cout << "MoneroTxRequest::toPropertyTree(node)" << endl;
    throw runtime_error("Not implemented");
  }

  boost::property_tree::ptree MoneroTransfer::toPropertyTree() const {
    //cout << "MoneroTransfer::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node;
    if (amount != boost::none) node.put("amount", *amount);
    if (accountIndex != boost::none) node.put("accountIndex", *accountIndex);
    if (numSuggestedConfirmations != boost::none) node.put("numSuggestedConfirmations", *numSuggestedConfirmations);
    return node;
  }

  boost::property_tree::ptree MoneroIncomingTransfer::toPropertyTree() const {
    //cout << "MoneroIncomingTransfer::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node = MoneroTransfer::toPropertyTree();
    if (subaddressIndex != boost::none) node.put("subaddressIndex", *subaddressIndex);
    if (address != boost::none) node.put("address", *address);
    return node;
  }

  boost::property_tree::ptree MoneroOutgoingTransfer::toPropertyTree() const {
    //cout << "MoneroOutgoingTransfer::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node = MoneroTransfer::toPropertyTree();
    if (!subaddressIndices.empty()) throw runtime_error("subaddressIndices not implemented");
    if (!addresses.empty()) throw runtime_error("addresses not implemented");
    if (!destinations.empty()) throw runtime_error("destinations not implemented");
    return node;
  }

  //boost::property_tree::ptree MoneroUtils::txWalletToPropertyTree(const MoneroTxWallet& tx) {
  //  cout << "txWalletToPropertyTree(tx)" << endl;
  //  boost::property_tree::ptree txNode = txToPropertyTree(tx);
  //  if (!tx.vouts.empty()) throw runtime_error("not implemented");
  //  if (!tx.incomingTransfers.empty()) throw runtime_error("not implemented");
  //  if (tx.outgoingTransfer != boost::none) throw runtime_error("not implemented");
  //  if (tx.numSuggestedConfirmations != boost::none) txNode.put("numSuggestedConfirmations", *tx.numSuggestedConfirmations);
  //  if (tx.note != boost::none) txNode.put("note", *tx.note);
  //  return txNode;
  //}
  //
  //boost::property_tree::ptree MoneroUtils::txRequestToPropertyTree(const MoneroTxRequest& tx) {
  //  cout << "txWalletToPropertyTree(tx)" << endl;
  //  boost::property_tree::ptree txNode = txWalletToPropertyTree(tx);
  //  if (tx.isOutgoing != boost::none) txNode.put("isOutgoing", *tx.isOutgoing);
  //  if (tx.isIncoming != boost::none) txNode.put("isIncoming", *tx.isIncoming);
  //  if (!tx.txIds.empty()) throw runtime_error("not implemented");
  //  if (tx.hasPaymentId != boost::none) txNode.put("hasPaymentId", *tx.hasPaymentId);
  //  if (!tx.paymentIds.empty()) throw runtime_error("not implemented");
  //  if (tx.minHeight != boost::none) txNode.put("minHeight", *tx.minHeight);
  //  if (tx.maxHeight != boost::none) txNode.put("maxHeight", *tx.maxHeight);
  //  if (tx.includeOutputs != boost::none) txNode.put("includeOutputs", *tx.includeOutputs);
  //  if (tx.transferRequest != boost::none) throw runtime_error("not implemented");
  //  return txNode;
  //}

  // ----------------------- UNDECLARED PRIVATE HELPERS -----------------------

  // TODO: static?
  bool boolEquals(bool val, const boost::optional<bool>& optVal) {
    return optVal == boost::none ? false : val == *optVal;
  }

//  MoneroTxWallet convertTxWithIncomingTransfer(const tools::wallet2& wallet2, const crypto::hash &txid, const crypto::hash &payment_id, const tools::wallet2::payment_details &pd) {
//
//    //cout << "static convertTxWithIncomingTransfer(3)" << endl;
//    shared_ptr<MoneroBlock> block = shared_ptr<MoneroBlock>(new MoneroBlock());
//    block->height = pd.m_block_height;
//    block->timestamp = pd.m_timestamp;
//    block->txs.push_back(tx);
//
//    //shared_ptr<MoneroTxWallet> tx = nullptr;
//    tx.block = block
//    tx.id = string_tools::pod_to_hex(pd.m_tx_hash);
//    tx.paymentId = string_tools::pod_to_hex(payment_id);
//    if (tx.paymentId->substr(16).find_first_not_of('0') == std::string::npos) tx.paymentId = tx.paymentId->substr(0, 16);  // TODO monero core: this should be part of core wallet
//    if (tx.paymentId == MoneroTx::DEFAULT_PAYMENT_ID) tx.paymentId = boost::none;  // clear default payment id
//    tx.unlockTime = pd.m_unlock_time;
//    tx.fee = pd.m_fee;
//    tx.note = wallet2.get_tx_note(pd.m_tx_hash);
//    if (tx.note->empty()) tx.note = boost::none; // clear empty note
//    tx.isCoinbase = pd.m_coinbase ? true : false;
//    tx.isConfirmed = true;
//    tx.isFailed = false;
//    tx.isRelayed = true;
//    tx.inTxPool = false;
//    tx.doNotRelay = false;
//    tx.isDoubleSpend = false;
//
//    // compute numConfirmations TODO monero core: this logic is based on wallet_rpc_server.cpp:87 but it should be encapsulated in wallet2
//    uint64_t chainHeight = getChainHeight();
//    if (*block->height >= chainHeight || (*block->height == 0 && !tx.inTxPool)) tx.numConfirmations = 0;
//    else tx.numConfirmations = chainHeight - *block->height;
//
//    // construct transfer
//    MoneroIncomingTransfer incomingTransfer;
//    incomingTransfer.tx = shared_ptr<MoneroTxWallet>(tx);
//    incomingTransfer.amount = pd.m_amount;
//    incomingTransfer.accountIndex = pd.m_subaddr_index.major;
//    incomingTransfer.subaddressIndex = pd.m_subaddr_index.minor;
//    incomingTransfer.address = wallet2->get_subaddress_as_str(pd.m_subaddr_index);
//
//    // compute numSuggestedConfirmations  TODO monero core: this logic is based on wallet_rpc_server.cpp:87 but it should be encapsulated in wallet2
//    uint64_t blockReward = wallet2->get_last_block_reward();
//    if (blockReward == 0) incomingTransfer.numSuggestedConfirmations = 0;
//    else incomingTransfer.numSuggestedConfirmations = (*incomingTransfer.amount + blockReward - 1) / blockReward;
//
//    // add transfer to tx
//    tx.incomingTransfers.push_back(incomingTransfer);
//
//    return incomingTransfer;
//  }

  /**
   * Merges a transaction into a unique set of transactions.
   *
   * TODO monero-core: skipIfAbsent only necessary because incoming payments not returned
   * when sent from/to same account #4500
   *
   * @param txs are existing transactions to merge into
   * @param tx is the transaction to merge into the existing txs
   * @param skipIfAbsent specifies if the tx should not be added if it doesn't already exist
   * @returns the merged tx
   */
  void mergeTx(vector<shared_ptr<MoneroTxWallet>>& txs, const shared_ptr<MoneroTxWallet>& tx, bool skipIfAbsent) {
    cout << "mergeTx()" << endl;
    if (tx->id == boost::none) throw runtime_error("Tx id is not initialized");
    for (const auto& aTx:  txs) {

      // merge tx
      if (*aTx->id == *tx->id) {

        // merge blocks if confirmed, txs otherwise
        if (aTx->block != boost::none || tx->block != boost::none) {
          if (aTx->block == boost::none) {
            aTx->block = shared_ptr<MoneroBlock>(new MoneroBlock());
            vector<shared_ptr<MoneroTx>> txs;
            txs.push_back(tx);
            (*aTx->block)->txs = txs;
            (*aTx->block)->height = *tx->getHeight();
          }
          if (tx->block == boost::none) {
            tx->block = shared_ptr<MoneroBlock>(new MoneroBlock());
            vector<shared_ptr<MoneroTx>> txs;
            txs.push_back(tx);
            (*tx->block)->txs = txs;
            (*tx->block)->height = *aTx->getHeight();
          }
          (*aTx->block)->merge(**tx->block);
        } else {
          aTx->merge(*tx);
        }
        return;
      }

      // merge common block of different txs
      if (tx->getHeight() != boost::none && *tx->getHeight() == *aTx->getHeight()) {
        (*aTx->block)->merge(**tx->block);
        //if (aTx.getIsConfirmed()) assertTrue(aTx.getBlock().getTxs().contains(aTx));
      }
    }

    // add tx if it doesn't already exist unless skipped
    if (!skipIfAbsent) {
      txs.push_back(tx);
    } else {
      cout << "WARNING: tx does not already exist" << endl; // TODO: proper logging
    }
  }

  // ----------------------------- WALLET LISTENER ----------------------------

  /**
   * Listens to wallet2 notifications in order to facilitate external wallet notifications.
   */
  struct Wallet2Listener : public tools::i_wallet2_callback {

  public:

    Wallet2Listener(MoneroWallet& wallet, tools::wallet2& wallet2) : wallet(wallet), wallet2(wallet2) {
      this->listener = boost::none;
      this->syncStartHeight = boost::none;
      this->syncEndHeight = boost::none;
      this->syncListener = boost::none;
    }

    ~Wallet2Listener() {
      cout << "~Wallet2Listener()" << endl;
    }

    void setWalletListener(boost::optional<MoneroWalletListener&> listener) {
      this->listener = listener;
      updateListening();
    }

    void onSyncStart(uint64_t startHeight, boost::optional<MoneroSyncListener&> syncListener) {
      if (syncStartHeight != boost::none || syncEndHeight != boost::none) throw runtime_error("Sync start or end height should not already be allocated, is previous sync in progress?");
      syncStartHeight = startHeight;
      syncEndHeight = wallet.getChainHeight() - 1;
      this->syncListener = syncListener;
      updateListening();

      // notify listeners of sync start
      uint64_t numBlocksDone = 0;
      uint64_t numBlocksTotal = *syncEndHeight - *syncStartHeight + 1;
      if (numBlocksTotal < 1) return;	// don't report 0% progress if no subsequent progress to report
      double percentDone = numBlocksDone / (double) numBlocksTotal;
      string message = string("Synchronizing");
      if (listener != boost::none) listener.get().onSyncProgress(*syncStartHeight, numBlocksDone, numBlocksTotal, percentDone, message);
      if (syncListener != boost::none) syncListener.get().onSyncProgress(*syncStartHeight, numBlocksDone, numBlocksTotal, percentDone, message);
    }

    void onSyncEnd() {
      syncStartHeight = boost::none;
      syncEndHeight = boost::none;
      syncListener = boost::none;
      updateListening();
    }

    virtual void on_new_block(uint64_t height, const cryptonote::block& cnBlock) {

      // notify listener of block
      if (listener != boost::none) {
        MoneroBlock block;
        block.height = height;
        listener.get().onNewBlock(block);
      }

      // notify listeners of sync progress
      if (syncStartHeight != boost::none && height > *syncStartHeight) {
      if (height > *syncEndHeight) *syncEndHeight = height;	// increase end height if necessary
      uint64_t numBlocksDone = height - *syncStartHeight + 1;
      uint64_t numBlocksTotal = *syncEndHeight - *syncStartHeight + 1;
      double percentDone = numBlocksDone / (double) numBlocksTotal;
      string message = string("Synchronizing");
      if (listener != boost::none) listener.get().onSyncProgress(*syncStartHeight, numBlocksDone, numBlocksTotal, percentDone, message);
      if (syncListener != boost::none) syncListener.get().onSyncProgress(*syncStartHeight, numBlocksDone, numBlocksTotal, percentDone, message);
      }
    }

  private:
    MoneroWallet& wallet;     // wallet to inform notifications
    tools::wallet2& wallet2;  // internal wallet implementation to listen to
    boost::optional<MoneroWalletListener&> listener; // listener to invoke with notifications
    boost::optional<uint64_t> syncStartHeight;
    boost::optional<uint64_t> syncEndHeight;
    boost::optional<MoneroSyncListener&> syncListener;

    void updateListening() {
      wallet2.callback(listener == boost::none && syncListener == boost::none ? nullptr : this);
    }
  };

  // ------------------------------- WALLET METHODS -----------------------------

  bool MoneroWallet::walletExists(const string& path) {
    cout << "walletExists(" << path << ")" << endl;
    bool keyFileExists;
    bool walletFileExists;
    tools::wallet2::wallet_exists(path, keyFileExists, walletFileExists);
    return walletFileExists;
  }

  MoneroWallet::MoneroWallet(const string& path, const string& password) {
    cout << "MoneroWallet()" << endl;
    throw runtime_error("Not implemented");
  }

  MoneroWallet::MoneroWallet(const string& path, const string&password, const MoneroNetworkType networkType, const MoneroRpcConnection& daemonConnection, const string& language) {
    cout << "MoneroWallet(3)" << endl;
    wallet2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<network_type>(networkType), 1, true));
    setDaemonConnection(daemonConnection.uri, daemonConnection.username, daemonConnection.password);
    wallet2->set_seed_language(language);
    crypto::secret_key recovery_val, secret_key;
    wallet2->generate(path, password, secret_key, false, false);
    wallet2Listener = unique_ptr<Wallet2Listener>(new Wallet2Listener(*this, *wallet2));
  }

  MoneroWallet::MoneroWallet(const string& path, const string& password, const string& mnemonic, const MoneroNetworkType networkType, const MoneroRpcConnection& daemonConnection, uint64_t restoreHeight) {

    // validate mnemonic and get recovery key and language
    crypto::secret_key recoveryKey;
    std::string language;
    bool isValid = crypto::ElectrumWords::words_to_bytes(mnemonic, recoveryKey, language);
    if (!isValid) throw runtime_error("Invalid mnemonic");	// TODO: need proper error handling
    if (language == crypto::ElectrumWords::old_language_name) language = Language::English().get_language_name();

    // initialize wallet
    wallet2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(networkType), 1, true));
    wallet2->set_seed_language(language);
    wallet2->generate(path, password, recoveryKey, true, false);
    wallet2->set_refresh_from_block_height(restoreHeight);
    wallet2Listener = unique_ptr<Wallet2Listener>(new Wallet2Listener(*this, *wallet2));

    // print the mnemonic
    epee::wipeable_string fetchedMnemonic;
    wallet2->get_seed(fetchedMnemonic);
    cout << "Mnemonic: " << string(fetchedMnemonic.data(), fetchedMnemonic.size()) << endl;
  }

  MoneroWallet::MoneroWallet(const string& path, const string& password, const string& address, const string& viewKey, const string& spendKey, const MoneroNetworkType networkType, const string& daemonConnection, uint64_t restoreHeight, const string& language) {
    cout << "MoneroWallet(7)" << endl;
    throw runtime_error("Not implemented");
  }

  MoneroWallet::MoneroWallet(const string& path, const string& password, const MoneroNetworkType networkType) {
    cout << "MoneroWallet(3b)" << endl;
    wallet2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<network_type>(networkType), 1, true));
    wallet2->load(path, password);
    wallet2Listener = unique_ptr<Wallet2Listener>(new Wallet2Listener(*this, *wallet2));
  }

  MoneroWallet::~MoneroWallet() {
    cout << "~MoneroWallet()" << endl;
    close();
  }

  // TODO: switch this to setDaemonConnection(MoneroDaemonRpc& daemonConnection)
  // TODO: actually setDaemonConnection(boost::optional<MoneroRpcConnection>& connection)
  void MoneroWallet::setDaemonConnection(const string& uri, const string& username, const string& password) {
    cout << "setDaemonConnection(" << uri << ", " << username << ", " << password << ")" << endl;

    // prepare uri, login, and isTrusted for wallet2
    boost::optional<epee::net_utils::http::login> login{};
    login.emplace(username, password);
    bool isTrusted = false;
    try { isTrusted = tools::is_local_address(uri); }	// wallet is trusted iff local
    catch (const exception &e) { }

    // set wallet2 daemon connection
    wallet2->set_daemon(uri, login, isTrusted);
  }

  MoneroRpcConnection MoneroWallet::getDaemonConnection() const {
    MoneroRpcConnection connection;
    if (!wallet2->get_daemon_address().empty()) connection.uri = wallet2->get_daemon_address();
    if (wallet2->get_daemon_login()) {
      if (!wallet2->get_daemon_login()->username.empty()) connection.username = wallet2->get_daemon_login()->username;
      epee::wipeable_string wipeablePassword = wallet2->get_daemon_login()->password;
      string password = string(wipeablePassword.data(), wipeablePassword.size());
      if (!password.empty()) connection.password = password;
    }
    return connection;
  }

  string MoneroWallet::getPath() const {
    return wallet2->path();
  }

  MoneroNetworkType MoneroWallet::getNetworkType() const {
    return static_cast<MoneroNetworkType>(wallet2->nettype());
  }

  string MoneroWallet::getLanguage() const {
    return wallet2->get_seed_language();
  }

  // get primary address (default impl?)

  string MoneroWallet::getAddress(uint32_t accountIdx, uint32_t subaddressIdx) const {
    return wallet2->get_subaddress_as_str({accountIdx, subaddressIdx});
  }

  MoneroSubaddress MoneroWallet::getAddressIndex(const string& address) const {
    cout << "getAddressIndex(" << address << ")" << endl;

    // validate address
    cryptonote::address_parse_info info;
    if (!get_account_address_from_str(info, wallet2->nettype(), address)) {
      throw runtime_error("Invalid address");
    }

    // get index of address in wallet
    auto index = wallet2->get_subaddress_index(info.address);
    if (!index) throw runtime_error("Address doesn't belong to the wallet");

    // return indices in subaddress
    MoneroSubaddress subaddress;
    cryptonote::subaddress_index cnIndex = *index;
    subaddress.accountIndex = cnIndex.major;
    subaddress.index = cnIndex.minor;
    return subaddress;
  }

  string MoneroWallet::getMnemonic() const {
    epee::wipeable_string wipeablePassword;
    wallet2->get_seed(wipeablePassword);
    return string(wipeablePassword.data(), wipeablePassword.size());
  }

  void MoneroWallet::setListener(boost::optional<MoneroWalletListener&> listener) {
    cout << "setListener()" << endl;
    wallet2Listener->setWalletListener(listener);
  }

  MoneroSyncResult MoneroWallet::sync() {
    cout << "sync()" << endl;
    return syncAux(boost::none, boost::none, boost::none);
  }

  MoneroSyncResult MoneroWallet::sync(MoneroSyncListener& listener) {
    cout << "sync(startHeight)" << endl;
    return syncAux(boost::none, boost::none, listener);
  }

  MoneroSyncResult MoneroWallet::sync(uint64_t startHeight) {
    cout << "sync(startHeight)" << endl;
    return syncAux(startHeight, boost::none, boost::none);
  }

  MoneroSyncResult MoneroWallet::sync(uint64_t startHeight, MoneroSyncListener& listener) {
    cout << "sync(startHeight, listener)" << endl;
    return syncAux(startHeight, boost::none, listener);
  }

  // rescanBlockchain

  // isMultisigImportNeeded

  uint64_t MoneroWallet::getHeight() const {
    return wallet2->get_blockchain_current_height();
  }

  uint64_t MoneroWallet::getChainHeight() const {
    string err;
    uint64_t chainHeight = wallet2->get_daemon_blockchain_height(err);
    if (!err.empty()) throw runtime_error(err);	// TODO: proper monero error
    return chainHeight;
  }

  uint64_t MoneroWallet::getRestoreHeight() const {
    return wallet2->get_refresh_from_block_height();
  }

  uint64_t MoneroWallet::getBalance() const {
    return wallet2->balance_all();
  }

  uint64_t MoneroWallet::getBalance(uint32_t accountIdx) const {
    return wallet2->balance(accountIdx);
  }

  uint64_t MoneroWallet::getBalance(uint32_t accountIdx, uint32_t subaddressIdx) const {
    map<uint32_t, uint64_t> balancePerSubaddress = wallet2->balance_per_subaddress(accountIdx);
    auto iter = balancePerSubaddress.find(subaddressIdx);
    return iter == balancePerSubaddress.end() ? 0 : iter->second;
  }

  uint64_t MoneroWallet::getUnlockedBalance() const {
    return wallet2->unlocked_balance_all();
  }

  uint64_t MoneroWallet::getUnlockedBalance(uint32_t accountIdx) const {
    return wallet2->unlocked_balance(accountIdx);
  }

  uint64_t MoneroWallet::getUnlockedBalance(uint32_t accountIdx, uint32_t subaddressIdx) const {
    map<uint32_t, std::pair<uint64_t, uint64_t>> unlockedBalancePerSubaddress = wallet2->unlocked_balance_per_subaddress(accountIdx);
    auto iter = unlockedBalancePerSubaddress.find(subaddressIdx);
    return iter == unlockedBalancePerSubaddress.end() ? 0 : iter->second.first;
  }

  vector<MoneroAccount> MoneroWallet::getAccounts() const {
    cout << "getAccounts()" << endl;
    return getAccounts(false, string(""));
  }

  vector<MoneroAccount> MoneroWallet::getAccounts(const bool includeSubaddresses) const {
    cout << "getAccounts(" << includeSubaddresses << ")" << endl;
    throw runtime_error("Not implemented");
  }

  vector<MoneroAccount> MoneroWallet::getAccounts(const string& tag) const {
    cout << "getAccounts(" << tag << ")" << endl;
    throw runtime_error("Not implemented");
  }

  vector<MoneroAccount> MoneroWallet::getAccounts(const bool includeSubaddresses, const string& tag) const {
    cout << "getAccounts(" << includeSubaddresses << ", " << tag << ")" << endl;

    // need transfers to inform if subaddresses used
    vector<tools::wallet2::transfer_details> transfers;
    if (includeSubaddresses) wallet2->get_transfers(transfers);

    // build accounts
    vector<MoneroAccount> accounts;
    for (uint32_t accountIdx = 0; accountIdx < wallet2->get_num_subaddress_accounts(); accountIdx++) {
      MoneroAccount account;
      account.index = accountIdx;
      account.primaryAddress = getAddress(accountIdx, 0);
      account.balance = wallet2->balance(accountIdx);
      account.unlockedBalance = wallet2->unlocked_balance(accountIdx);
      if (includeSubaddresses) account.subaddresses = getSubaddressesAux(accountIdx, vector<uint32_t>(), transfers);
      accounts.push_back(account);
    }

    return accounts;
  }

  MoneroAccount MoneroWallet::getAccount(const uint32_t accountIdx) const {
    return getAccount(accountIdx, false);
  }

  MoneroAccount MoneroWallet::getAccount(const uint32_t accountIdx, const bool includeSubaddresses) const {
    cout << "getAccount(" << accountIdx << ", " << includeSubaddresses << ")" << endl;

    // need transfers to inform if subaddresses used
    vector<tools::wallet2::transfer_details> transfers;
    if (includeSubaddresses) wallet2->get_transfers(transfers);

    // build and return account
    MoneroAccount account;
    account.index = accountIdx;
    account.primaryAddress = getAddress(accountIdx, 0);
    account.balance = wallet2->balance(accountIdx);
    account.unlockedBalance = wallet2->unlocked_balance(accountIdx);
    if (includeSubaddresses) account.subaddresses = getSubaddressesAux(accountIdx, vector<uint32_t>(), transfers);
    return account;
  }

  MoneroAccount MoneroWallet::createAccount() {
    throw runtime_error("Not implemented");
  }

  MoneroAccount MoneroWallet::createAccount(const string& label) {
    throw runtime_error("Not implemented");
  }

  vector<MoneroSubaddress> MoneroWallet::getSubaddresses(const uint32_t accountIdx) const {	// TODO: this should call one below
    vector<tools::wallet2::transfer_details> transfers;
    wallet2->get_transfers(transfers);
    return getSubaddressesAux(accountIdx, vector<uint32_t>(), transfers);
  }

  vector<MoneroSubaddress> MoneroWallet::getSubaddresses(const uint32_t accountIdx, const vector<uint32_t> subaddressIndices) const {
    cout << "getSubaddresses(" << accountIdx << ", ...)" << endl;
    cout << "Subaddress indices size: " << subaddressIndices.size();
    if (subaddressIndices.size() > 0) cout << ", First element: " << subaddressIndices.at(0) << endl;
    else cout << endl;

    vector<tools::wallet2::transfer_details> transfers;
    wallet2->get_transfers(transfers);
    return getSubaddressesAux(accountIdx, subaddressIndices, transfers);
  }

  MoneroSubaddress MoneroWallet::getSubaddress(const uint32_t accountIdx, const uint32_t subaddressIdx) const {
    throw runtime_error("Not implemented");
  }

  MoneroSubaddress MoneroWallet::createSubaddress(const uint32_t accountIdx) {
    throw runtime_error("Not implemented");
  }

  MoneroSubaddress MoneroWallet::createSubaddress(const uint32_t accountIdx, const string& label) {
    throw runtime_error("Not implemented");
  }

  // create account

  // getSubaddresses

  // createSubaddress

  vector<MoneroTxWallet> MoneroWallet::getTxs(const MoneroTxRequest& request) const {
    cout << "getTxs(request)" << endl;

    // print for debug
    std::stringstream ss;
    //boost::property_tree::write_json(ss, MoneroUtils::txRequestToPropertyTree(request), false);
    //string requestStr = ss.str();
    //cout << "Tx request: " << requestStr << endl;






    throw runtime_error("getTxs() not implemented");
  }

  vector<shared_ptr<MoneroTransfer>> MoneroWallet::getTransfers(const MoneroTransferRequest& request) const {
    cout << "vector<shared_ptr<MoneroTransfer>> getTransfers(request)" << endl;

    // normalize request
    MoneroTxRequest txReq = *(request.txRequest != boost::none ? *request.txRequest : shared_ptr<MoneroTxRequest>(new MoneroTxRequest()));

    //MoneroTxRequest txReq = MoneroTxRequest();
    //if (request.txRequest != boost::none) txReq = **request.txRequest;

    // build parameters for wallet2->get_payments()
    uint64_t minHeight = txReq.minHeight == boost::none ? 0 : *txReq.minHeight;
    uint64_t maxHeight = txReq.maxHeight == boost::none ? CRYPTONOTE_MAX_BLOCK_NUMBER : min((uint64_t) CRYPTONOTE_MAX_BLOCK_NUMBER, *txReq.maxHeight);
    boost::optional<uint32_t> accountIndex = boost::none;
    if (request.accountIndex != boost::none) accountIndex = *request.accountIndex;
    std::set<uint32_t> subaddressIndices;
    for (int i = 0; i < request.subaddressIndices.size(); i++) {
      subaddressIndices.insert(request.subaddressIndices[i]);
    }

    // translate from MoneroTxRequest to in, out, pending, pool, failed terminology used by monero-wallet-rpc
    bool canBeConfirmed = !boolEquals(false, txReq.isConfirmed) && !boolEquals(true, txReq.inTxPool) && !boolEquals(true, txReq.isFailed) && !boolEquals(false, txReq.isRelayed);
    bool canBeInTxPool = !boolEquals(true, txReq.isConfirmed) && !boolEquals(false, txReq.inTxPool) && !boolEquals(true, txReq.isFailed) && !boolEquals(false, txReq.isRelayed) && txReq.getHeight() == boost::none && txReq.minHeight == boost::none;
    bool canBeIncoming = !boolEquals(false, request.isIncoming) && !boolEquals(true, request.getIsOutgoing()) && !boolEquals(true, request.hasDestinations);
    bool canBeOutgoing = !boolEquals(false, request.getIsOutgoing()) && !boolEquals(true, request.isIncoming);
    bool isIn = canBeIncoming && canBeConfirmed;
    bool isOut = canBeOutgoing && canBeConfirmed;
    bool isPending = canBeOutgoing && canBeInTxPool;
    bool isPool = canBeIncoming && canBeInTxPool;
    bool isFailed = !boolEquals(false, txReq.isFailed) && !boolEquals(true, txReq.isConfirmed) && !boolEquals(true, txReq.inTxPool);


    // collect unique transactions
    vector<shared_ptr<MoneroTxWallet>> txs;

    // get confirmed incoming transfers
    if (isIn) {
      std::list<std::pair<crypto::hash, tools::wallet2::payment_details>> payments;
      wallet2->get_payments(payments, minHeight, maxHeight, accountIndex, subaddressIndices);
      for (std::list<std::pair<crypto::hash, tools::wallet2::payment_details>>::const_iterator i = payments.begin(); i != payments.end(); ++i) {
        shared_ptr<MoneroTxWallet> tx = buildTxWithIncomingTransfer(i->second.m_tx_hash, i->first, i->second);
        mergeTx(txs, tx, false);
        //txs.push_back(tx);
      }
    }

    // get confirmed outgoing transfers
    if (isOut) {
      //throw runtime_error("isOut not implemented");
    }

    // get unconfirmed outgoing transfers
    if (isPending || isFailed) {
      //throw runtime_error("isPending || isFailed not implemented");
    }

    // get unconfirmed incoming transfers
    if (isPool) {
      //throw runtime_error("isPool not implemented");
    }

    // TODO: apply filtering

    // collect resulting transfers
    vector<shared_ptr<MoneroTransfer>> transfers;
    for (int i = 0; i < txs.size(); i++) {
      shared_ptr<MoneroTxWallet> tx = txs[i];
      for (int j = 0; j < tx->incomingTransfers.size(); j++) {
        transfers.push_back(tx->incomingTransfers[j]);
      }
      if (tx->outgoingTransfer != boost::none) transfers.push_back(*tx->outgoingTransfer);
    }

    return transfers;
  }

//  vector<MoneroTransfer> MoneroWallet::getTransfers(const MoneroTransferRequest& request) const {
//    cout << "getTransfers(request)" << endl;
//
//    // normalize request
//    MoneroTxRequest txReq = *(request.txRequest != boost::none ? *request.txRequest : shared_ptr<MoneroTxRequest>(make_shared<MoneroTxRequest>(MoneroTxRequest())));
//
//    //MoneroTxRequest txReq = MoneroTxRequest();
//    //if (request.txRequest != boost::none) txReq = **request.txRequest;
//
//    // build parameters for wallet2->get_payments()
//    uint64_t minHeight = txReq.minHeight == boost::none ? 0 : *txReq.minHeight;
//    uint64_t maxHeight = txReq.maxHeight == boost::none ? CRYPTONOTE_MAX_BLOCK_NUMBER : min((uint64_t) CRYPTONOTE_MAX_BLOCK_NUMBER, *txReq.maxHeight);
//    boost::optional<uint32_t> accountIndex = boost::none;
//    if (request.accountIndex != boost::none) accountIndex = *request.accountIndex;
//    std::set<uint32_t> subaddressIndices;
//    for (int i = 0; i < request.subaddressIndices.size(); i++) {
//      subaddressIndices.insert(request.subaddressIndices[i]);
//    }
//
//    // translate from MoneroTxRequest to in, out, pending, pool, failed terminology used by monero-wallet-rpc
//    bool canBeConfirmed = !boolEquals(false, txReq.isConfirmed) && !boolEquals(true, txReq.inTxPool) && !boolEquals(true, txReq.isFailed) && !boolEquals(false, txReq.isRelayed);
//    bool canBeInTxPool = !boolEquals(true, txReq.isConfirmed) && !boolEquals(false, txReq.inTxPool) && !boolEquals(true, txReq.isFailed) && !boolEquals(false, txReq.isRelayed) && txReq.getHeight() == boost::none && txReq.minHeight == boost::none;
//    bool canBeIncoming = !boolEquals(false, request.isIncoming) && !boolEquals(true, request.getIsOutgoing()) && !boolEquals(true, request.hasDestinations);
//    bool canBeOutgoing = !boolEquals(false, request.getIsOutgoing()) && !boolEquals(true, request.isIncoming);
//    bool isIn = canBeIncoming && canBeConfirmed;
//    bool isOut = canBeOutgoing && canBeConfirmed;
//    bool isPending = canBeOutgoing && canBeInTxPool;
//    bool isPool = canBeIncoming && canBeInTxPool;
//    bool isFailed = !boolEquals(false, txReq.isFailed) && !boolEquals(true, txReq.isConfirmed) && !boolEquals(true, txReq.inTxPool);
//
//    // TODO: this duplicates common transfer txs
//
//    // collect transfers
//    vector<MoneroTransfer> transfers;
//
//    // get confirmed incoming transfers
//    if (isIn) {
//      std::list<std::pair<crypto::hash, tools::wallet2::payment_details>> payments;
//      wallet2->get_payments(payments, minHeight, maxHeight, accountIndex, subaddressIndices);
//      for (std::list<std::pair<crypto::hash, tools::wallet2::payment_details>>::const_iterator i = payments.begin(); i != payments.end(); ++i) {
////        MoneroTransfer transfer = convertWallet2IncomingTransfer(i->second.m_tx_hash, i->first, i->second);
////        transfers.push_back(transfer);
//      }
//    }
//
//    // get confirmed outgoing transfers
//    if (isOut) {
//      //throw runtime_error("isOut not implemented");
//    }
//
//    // get unconfirmed outgoing transfers
//    if (isPending || isFailed) {
//      //throw runtime_error("isPending || isFailed not implemented");
//    }
//
//    // get unconfirmed incoming transfers
//    if (isPool) {
//      //throw runtime_error("isPool not implemented");
//    }
//
//    // TODO: apply filtering
//
//    return transfers;
//  }

  vector<MoneroOutputWallet> MoneroWallet::getOutputs(const MoneroOutputRequest& request) const {
    cout << "getOutputs(request)" << endl;
    throw runtime_error("Not implemented");
  }

  void MoneroWallet::save() {
    cout << "save()" << endl;
    save("", "");
  }

  void MoneroWallet::save(string path, string password) {
    cout << "save(" << path << ", " << password << ")" << endl;
    if (path.empty()) {
      if (wallet2->get_wallet_file().empty()) throw runtime_error("Must specify path to save wallet because wallet has not been previously saved");
      else wallet2->store();
    } else {
      wallet2->store_to(path, password);
    }
  }

  void MoneroWallet::close() {
    cout << "close()" << endl;
    wallet2->stop();
  }

  // ------------------------------- PRIVATE HELPERS ----------------------------

  MoneroSyncResult MoneroWallet::syncAux(boost::optional<uint64_t> startHeight, boost::optional<uint64_t> endHeight, boost::optional<MoneroSyncListener&> listener) {
    cout << "syncAux()" << endl;

    // validate inputs
    if (endHeight != boost::none) throw runtime_error("Monero core wallet does not support syncing to an end height");	// TODO: custom exception type

    // determine sync start height
    uint64_t syncStartHeight = startHeight == boost::none ? max(getHeight(), getRestoreHeight()) : *startHeight;

    // sync wallet
    wallet2Listener->onSyncStart(syncStartHeight, listener);
    MoneroSyncResult result;
    wallet2->refresh(wallet2->is_trusted_daemon(), syncStartHeight, result.numBlocksFetched, result.receivedMoney, true);
    wallet2Listener->onSyncEnd();
    return result;
  }

  // private helper to initialize subaddresses using transfer details
  vector<MoneroSubaddress> MoneroWallet::getSubaddressesAux(const uint32_t accountIdx, vector<uint32_t> subaddressIndices, vector<tools::wallet2::transfer_details> transfers) const {
    vector<MoneroSubaddress> subaddresses;

    // get balances per subaddress as maps
    map<uint32_t, uint64_t> balancePerSubaddress = wallet2->balance_per_subaddress(accountIdx);
    map<uint32_t, std::pair<uint64_t, uint64_t>> unlockedBalancePerSubaddress = wallet2->unlocked_balance_per_subaddress(accountIdx);

    // get all indices if no indices given
    if (subaddressIndices.empty()) {
      subaddressIndices = vector<uint32_t>();
      for (uint32_t subaddressIdx = 0; subaddressIdx < wallet2->get_num_subaddresses(accountIdx); subaddressIdx++) {
        subaddressIndices.push_back(subaddressIdx);
      }
    }

    // initialize subaddresses at indices
    for (uint32_t subaddressIndicesIdx = 0; subaddressIndicesIdx < subaddressIndices.size(); subaddressIndicesIdx++) {
      MoneroSubaddress subaddress;
      subaddress.accountIndex = accountIdx;
      uint32_t subaddressIdx = subaddressIndices.at(subaddressIndicesIdx);
      subaddress.index = subaddressIdx;
      subaddress.address = getAddress(accountIdx, subaddressIdx);
      auto iter1 = balancePerSubaddress.find(subaddressIdx);
      subaddress.balance = iter1 == balancePerSubaddress.end() ? 0 : iter1->second;
      auto iter2 = unlockedBalancePerSubaddress.find(subaddressIdx);
      subaddress.unlockedBalance = iter2 == unlockedBalancePerSubaddress.end() ? 0 : iter2->second.first;
      subaddress.numBlocksToUnlock = iter2 == unlockedBalancePerSubaddress.end() ? 0 : iter2->second.second;
      cryptonote::subaddress_index index = {accountIdx, subaddressIdx};
      subaddress.numUnspentOutputs = count_if(transfers.begin(), transfers.end(), [&](const tools::wallet2::transfer_details& td) { return !td.m_spent && td.m_subaddr_index == index; });
      subaddress.isUsed = find_if(transfers.begin(), transfers.end(), [&](const tools::wallet2::transfer_details& td) { return td.m_subaddr_index == index; }) != transfers.end();
      subaddresses.push_back(subaddress);
    }

    return subaddresses;
  }

  shared_ptr<MoneroTxWallet> MoneroWallet::buildTxWithIncomingTransfer(const crypto::hash &txid, const crypto::hash &payment_id, const tools::wallet2::payment_details &pd) const {
    cout << "buildTxWithIncomingTransfer()" << endl;

    shared_ptr<MoneroBlock> block = shared_ptr<MoneroBlock>(new MoneroBlock());
    block->height = pd.m_block_height;
    block->timestamp = pd.m_timestamp;

    shared_ptr<MoneroTxWallet> tx = shared_ptr<MoneroTxWallet>(new MoneroTxWallet());
    tx->block = block;
    block->txs.push_back(tx);
    tx->id = string_tools::pod_to_hex(pd.m_tx_hash);
    tx->paymentId = string_tools::pod_to_hex(payment_id);
    if (tx->paymentId->substr(16).find_first_not_of('0') == std::string::npos) tx->paymentId = tx->paymentId->substr(0, 16);  // TODO monero core: this should be part of core wallet
    if (tx->paymentId == MoneroTx::DEFAULT_PAYMENT_ID) tx->paymentId = boost::none;  // clear default payment id
    tx->unlockTime = pd.m_unlock_time;
    tx->fee = pd.m_fee;
    tx->note = wallet2->get_tx_note(pd.m_tx_hash);
    if (tx->note->empty()) tx->note = boost::none; // clear empty note
    tx->isCoinbase = pd.m_coinbase ? true : false;
    tx->isConfirmed = true;
    tx->isFailed = false;
    tx->isRelayed = true;
    tx->inTxPool = false;
    tx->doNotRelay = false;
    tx->isDoubleSpend = false;

    // compute numConfirmations TODO monero core: this logic is based on wallet_rpc_server.cpp:87 but it should be encapsulated in wallet2
    uint64_t chainHeight = getChainHeight();
    if (*block->height >= chainHeight || (*block->height == 0 && !tx->inTxPool)) tx->numConfirmations = 0;
    else tx->numConfirmations = chainHeight - *block->height;

    // construct transfer
    shared_ptr<MoneroIncomingTransfer> incomingTransfer = shared_ptr<MoneroIncomingTransfer>(new MoneroIncomingTransfer());
    incomingTransfer->tx = tx;
    tx->incomingTransfers.push_back(incomingTransfer);
    incomingTransfer->amount = pd.m_amount;
    incomingTransfer->accountIndex = pd.m_subaddr_index.major;
    incomingTransfer->subaddressIndex = pd.m_subaddr_index.minor;
    incomingTransfer->address = wallet2->get_subaddress_as_str(pd.m_subaddr_index);

    // compute numSuggestedConfirmations  TODO monero core: this logic is based on wallet_rpc_server.cpp:87 but it should be encapsulated in wallet2
    uint64_t blockReward = wallet2->get_last_block_reward();
    if (blockReward == 0) incomingTransfer->numSuggestedConfirmations = 0;
    else incomingTransfer->numSuggestedConfirmations = (*incomingTransfer->amount + blockReward - 1) / blockReward;

    // return pointer to new tx
    return tx;
  }

//  MoneroTransfer MoneroWallet::convertWallet2IncomingTransfer(const tools::wallet2& wallet2, const crypto::hash &txid, const crypto::hash &payment_id, const tools::wallet2::payment_details &pd) const {
//    //cout << "convertWallet2IncomingTransfer(3)" << endl;
//    shared_ptr<MoneroBlock> block = shared_ptr<MoneroBlock>(new MoneroBlock());
//    block->height = pd.m_block_height;
//    block->timestamp = pd.m_timestamp;
//
//    //shared_ptr<MoneroTxWallet> tx = nullptr;
//    shared_ptr<MoneroTxWallet> tx = shared_ptr<MoneroTxWallet>(new MoneroTxWallet());
//    tx->block = block;
//    block->txs.push_back(tx);
//    tx->id = string_tools::pod_to_hex(pd.m_tx_hash);
//    tx->paymentId = string_tools::pod_to_hex(payment_id);
//    if (tx->paymentId->substr(16).find_first_not_of('0') == std::string::npos) tx->paymentId = tx->paymentId->substr(0, 16);  // TODO monero core: this should be part of core wallet
//    if (tx->paymentId == MoneroTx::DEFAULT_PAYMENT_ID) tx->paymentId = boost::none;  // clear default payment id
//    tx->unlockTime = pd.m_unlock_time;
//    tx->fee = pd.m_fee;
//    tx->note = wallet2->get_tx_note(pd.m_tx_hash);
//    if (tx->note->empty()) tx->note = boost::none; // clear empty note
//    tx->isCoinbase = pd.m_coinbase ? true : false;
//    tx->isConfirmed = true;
//    tx->isFailed = false;
//    tx->isRelayed = true;
//    tx->inTxPool = false;
//    tx->doNotRelay = false;
//    tx->isDoubleSpend = false;
//
//    // compute numConfirmations TODO monero core: this logic is based on wallet_rpc_server.cpp:87 but it should be encapsulated in wallet2
//    uint64_t chainHeight = getChainHeight();
//    if (*block->height >= chainHeight || (*block->height == 0 && !tx->inTxPool)) tx->numConfirmations = 0;
//    else tx->numConfirmations = chainHeight - *block->height;
//
//    // construct transfer
//    MoneroIncomingTransfer incomingTransfer;
//    incomingTransfer.tx = tx;
//    incomingTransfer.amount = pd.m_amount;
//    incomingTransfer.accountIndex = pd.m_subaddr_index.major;
//    incomingTransfer.subaddressIndex = pd.m_subaddr_index.minor;
//    incomingTransfer.address = wallet2->get_subaddress_as_str(pd.m_subaddr_index);
//
//    // compute numSuggestedConfirmations  TODO monero core: this logic is based on wallet_rpc_server.cpp:87 but it should be encapsulated in wallet2
//    uint64_t blockReward = wallet2->get_last_block_reward();
//    if (blockReward == 0) incomingTransfer.numSuggestedConfirmations = 0;
//    else incomingTransfer.numSuggestedConfirmations = (*incomingTransfer.amount + blockReward - 1) / blockReward;
//
//    // add transfer to tx
//    tx->incomingTransfers.push_back(incomingTransfer);
//
//    return incomingTransfer;
//  }
}
