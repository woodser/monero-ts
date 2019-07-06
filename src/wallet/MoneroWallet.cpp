#include "MoneroWallet.h"

#include "utils/MoneroUtils.h"
#include <chrono>
#include <stdio.h>
#include <iostream>
#include "mnemonics/electrum-words.h"
#include "mnemonics/english.h"
#include "wallet/wallet_rpc_server_commands_defs.h"

using namespace std;
using namespace cryptonote;
using namespace epee;
using namespace tools;

// TODO: my license, monero core license

/**
 * Public library interface.
 */
namespace monero {

  // ----------------------- UNDECLARED PRIVATE HELPERS -----------------------

  // TODO: static?
  bool boolEquals(bool val, const boost::optional<bool>& optVal) {
    return optVal == boost::none ? false : val == *optVal;
  }

  /**
   * ---------------- DUPLICATED WALLET RPC TRANSFER CODE ---------------------
   *
   * These functions are duplicated from private functions in wallet rpc
   * on_transfer/on_transfer_split, with minor modifications to not be class members.
   *
   * This code is used to generate and send transactions with equivalent functionality as
   * wallet rpc.
   *
   * Duplicated code is not ideal.  Solutions considered:
   *
   * (1) Duplicate wallet rpc code as done here.
   * (2) Modify monero-wallet-rpc on_transfer() / on_transfer_split() to be public.
   * (3) Modify monero-wallet-rpc to make this class a friend.
   * (4) Move all logic in monero-wallet-rpc to wallet2 so all users can access.
   *
   * Options 2-4 require modification of Monero Core C++.  Of those, (4) is probably ideal.
   * TODO: open patch on Monero core which moves common wallet rpc logic (e.g. on_transfer, on_transfer_split) to wallet2.
   *
   * Until then, option (1) is used because it allows Monero Core binaries to be used without modification, it's easy, and
   * anything other than (4) is temporary.
   */
  //------------------------------------------------------------------------------------------------------------------------------
  bool validate_transfer(wallet2* wallet2, const std::list<wallet_rpc::transfer_destination>& destinations, const std::string& payment_id, std::vector<cryptonote::tx_destination_entry>& dsts, std::vector<uint8_t>& extra, bool at_least_one_destination, epee::json_rpc::error& er)
  {
    crypto::hash8 integrated_payment_id = crypto::null_hash8;
    std::string extra_nonce;
    for (auto it = destinations.begin(); it != destinations.end(); it++)
    {
      cryptonote::address_parse_info info;
      cryptonote::tx_destination_entry de;
      er.message = "";
      if(!get_account_address_from_str_or_url(info, wallet2->nettype(), it->address,
        [&er](const std::string &url, const std::vector<std::string> &addresses, bool dnssec_valid)->std::string {
          if (!dnssec_valid)
          {
            er.message = std::string("Invalid DNSSEC for ") + url;
            return {};
          }
          if (addresses.empty())
          {
            er.message = std::string("No Monero address found at ") + url;
            return {};
          }
          return addresses[0];
        }))
      {
        er.code = WALLET_RPC_ERROR_CODE_WRONG_ADDRESS;
        if (er.message.empty())
          er.message = std::string("WALLET_RPC_ERROR_CODE_WRONG_ADDRESS: ") + it->address;
        return false;
      }

      de.original = it->address;
      de.addr = info.address;
      de.is_subaddress = info.is_subaddress;
      de.amount = it->amount;
      de.is_integrated = info.has_payment_id;
      dsts.push_back(de);

      if (info.has_payment_id)
      {
        if (!payment_id.empty() || integrated_payment_id != crypto::null_hash8)
        {
          er.code = WALLET_RPC_ERROR_CODE_WRONG_PAYMENT_ID;
          er.message = "A single payment id is allowed per transaction";
          return false;
        }
        integrated_payment_id = info.payment_id;
        cryptonote::set_encrypted_payment_id_to_tx_extra_nonce(extra_nonce, integrated_payment_id);

        /* Append Payment ID data into extra */
        if (!cryptonote::add_extra_nonce_to_tx_extra(extra, extra_nonce)) {
          er.code = WALLET_RPC_ERROR_CODE_WRONG_PAYMENT_ID;
          er.message = "Something went wrong with integrated payment_id.";
          return false;
        }
      }
    }

    if (at_least_one_destination && dsts.empty())
    {
      er.code = WALLET_RPC_ERROR_CODE_ZERO_DESTINATION;
      er.message = "No destinations for this transfer";
      return false;
    }

    if (!payment_id.empty())
    {

      /* Just to clarify */
      const std::string& payment_id_str = payment_id;

      crypto::hash long_payment_id;
      crypto::hash8 short_payment_id;

      /* Parse payment ID */
      if (wallet2::parse_long_payment_id(payment_id_str, long_payment_id)) {
        cryptonote::set_payment_id_to_tx_extra_nonce(extra_nonce, long_payment_id);
      }
      else {
        er.code = WALLET_RPC_ERROR_CODE_WRONG_PAYMENT_ID;
        er.message = "Payment id has invalid format: \"" + payment_id_str + "\", expected 64 character string";
        return false;
      }

      /* Append Payment ID data into extra */
      if (!cryptonote::add_extra_nonce_to_tx_extra(extra, extra_nonce)) {
        er.code = WALLET_RPC_ERROR_CODE_WRONG_PAYMENT_ID;
        er.message = "Something went wrong with payment_id. Please check its format: \"" + payment_id_str + "\", expected 64-character string";
        return false;
      }

    }
    return true;
  }
  //------------------------------------------------------------------------------------------------------------------------------
  static std::string ptx_to_string(const tools::wallet2::pending_tx &ptx)
  {
    std::ostringstream oss;
    boost::archive::portable_binary_oarchive ar(oss);
    try
    {
      ar << ptx;
    }
    catch (...)
    {
      return "";
    }
    return epee::string_tools::buff_to_hex_nodelimer(oss.str());
  }
  //------------------------------------------------------------------------------------------------------------------------------
  template<typename T> static bool is_error_value(const T &val) { return false; }
  static bool is_error_value(const std::string &s) { return s.empty(); }
  //------------------------------------------------------------------------------------------------------------------------------
  template<typename T, typename V>
  static bool fill(T &where, V s)
  {
    if (is_error_value(s)) return false;
    where = std::move(s);
    return true;
  }
  //------------------------------------------------------------------------------------------------------------------------------
  template<typename T, typename V>
  static bool fill(std::list<T> &where, V s)
  {
    if (is_error_value(s)) return false;
    where.emplace_back(std::move(s));
    return true;
  }
  //------------------------------------------------------------------------------------------------------------------------------
  static uint64_t total_amount(const tools::wallet2::pending_tx &ptx)
  {
    uint64_t amount = 0;
    for (const auto &dest: ptx.dests) amount += dest.amount;
    return amount;
  }
  //------------------------------------------------------------------------------------------------------------------------------
  template<typename Ts, typename Tu>
  bool fill_response(wallet2* wallet2, std::vector<tools::wallet2::pending_tx> &ptx_vector,
      bool get_tx_key, Ts& tx_key, Tu &amount, Tu &fee, std::string &multisig_txset, std::string &unsigned_txset, bool do_not_relay,
      Ts &tx_hash, bool get_tx_hex, Ts &tx_blob, bool get_tx_metadata, Ts &tx_metadata, epee::json_rpc::error &er)
  {
    for (const auto & ptx : ptx_vector)
    {
      if (get_tx_key)
      {
        epee::wipeable_string s = epee::to_hex::wipeable_string(ptx.tx_key);
        for (const crypto::secret_key& additional_tx_key : ptx.additional_tx_keys)
          s += epee::to_hex::wipeable_string(additional_tx_key);
        fill(tx_key, std::string(s.data(), s.size()));
      }
      // Compute amount leaving wallet in tx. By convention dests does not include change outputs
      fill(amount, total_amount(ptx));
      fill(fee, ptx.fee);
    }

    if (wallet2->multisig())
    {
      multisig_txset = epee::string_tools::buff_to_hex_nodelimer(wallet2->save_multisig_tx(ptx_vector));
      if (multisig_txset.empty())
      {
        er.code = WALLET_RPC_ERROR_CODE_UNKNOWN_ERROR;
        er.message = "Failed to save multisig tx set after creation";
        return false;
      }
    }
    else
    {
      if (wallet2->watch_only()){
        unsigned_txset = epee::string_tools::buff_to_hex_nodelimer(wallet2->dump_tx_to_str(ptx_vector));
        if (unsigned_txset.empty())
        {
          er.code = WALLET_RPC_ERROR_CODE_UNKNOWN_ERROR;
          er.message = "Failed to save unsigned tx set after creation";
          return false;
        }
      }
      else if (!do_not_relay)
        wallet2->commit_tx(ptx_vector);

      // populate response with tx hashes
      for (auto & ptx : ptx_vector)
      {
        bool r = fill(tx_hash, epee::string_tools::pod_to_hex(cryptonote::get_transaction_hash(ptx.tx)));
        r = r && (!get_tx_hex || fill(tx_blob, epee::string_tools::buff_to_hex_nodelimer(tx_to_blob(ptx.tx))));
        r = r && (!get_tx_metadata || fill(tx_metadata, ptx_to_string(ptx)));
        if (!r)
        {
          er.code = WALLET_RPC_ERROR_CODE_UNKNOWN_ERROR;
          er.message = "Failed to save tx info";
          return false;
        }
      }
    }
    return true;
  }

  // -------------------- END WALLET RPC CODE DUPLCIATION ---------------------

  /**
   * Merges a transaction into a unique set of transactions.
   *
   * TODO monero-core: skipIfAbsent only necessary because incoming payments not returned
   * when sent from/to same account #4500
   *
   * @param tx is the transaction to merge into the existing txs
   * @param txMap maps tx ids to txs
   * @param blockMap maps block heights to blocks
   * @param skipIfAbsent specifies if the tx should not be added if it doesn't already exist
   */
  void mergeTx(const shared_ptr<MoneroTxWallet>& tx, map<string, shared_ptr<MoneroTxWallet>>& txMap, map<uint64_t, shared_ptr<MoneroBlock>>& blockMap, bool skipIfAbsent) {
    if (tx->id == boost::none) throw runtime_error("Tx id is not initialized");

//    txMap[*tx->id] = tx;
//    if (true) return;

    // if tx doesn't exist, add it (unless skipped)
    map<string, shared_ptr<MoneroTxWallet>>::const_iterator txIter = txMap.find(*tx->id);
    if (txIter == txMap.end()) {
      if (!skipIfAbsent) {
        txMap[*tx->id] = tx;
      } else {
        cout << "WARNING: tx does not already exist" << endl; // TODO: proper logging
      }
    }

    // otherwise merge with existing tx
    else {

      // get existing tx to merge with
      shared_ptr<MoneroTxWallet>& aTx = txMap[*tx->id];

      // merge blocks if confirmed, txs otherwise
      // TODO: follow transfer->tx merging pattern which merges txs which comes back to transfers
      if (aTx->block != boost::none || tx->block != boost::none) {
        if (aTx->block == boost::none) {
          aTx->block = shared_ptr<MoneroBlock>(new MoneroBlock());
          aTx->block.get()->txs.push_back(tx);
          aTx->block.get()->height = tx->getHeight();
        }
        if (tx->block == boost::none) {
          tx->block = shared_ptr<MoneroBlock>(new MoneroBlock());
          tx->block.get()->txs.push_back(tx);
          tx->block.get()->height = aTx->getHeight();
        }
        aTx->block.get()->merge(aTx->block.get(), tx->block.get());
      } else {
        aTx->merge(aTx, tx);
      }
    }

    // if confirmed, merge tx's block
    if (tx->getHeight() != boost::none) {
      map<uint64_t, shared_ptr<MoneroBlock>>::const_iterator blockIter = blockMap.find(tx->getHeight().get());
      if (blockIter == blockMap.end()) {
        blockMap[tx->getHeight().get()] = tx->block.get();
      } else {
        shared_ptr<MoneroBlock>& aBlock = blockMap[tx->getHeight().get()];
        aBlock->merge(aBlock, tx->block.get());
      }
    }
  }

  // ----------------------------- WALLET LISTENER ----------------------------

  /**
   * Listens to wallet2 notifications in order to facilitate external wallet notifications.
   */
  struct Wallet2Listener : public tools::i_wallet2_callback {

  public:

    /**
     * Constructs the listener.
     *
     * @param wallet provides context to inform external notifications
     * @param wallet2 provides source notifications which this listener propagates to external listeners
     */
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

    virtual void on_money_spent(uint64_t height, const crypto::hash &txid, const cryptonote::transaction& in_tx, uint64_t amount, const cryptonote::transaction& spend_tx, const cryptonote::subaddress_index& subaddr_index) {
//      cout << "Wallet2Listener::on_money_spent()" << endl;
//        // TODO;
//        std::string tx_hash = epee::string_tools::pod_to_hex(txid);
//        LOG_PRINT_L3(__FUNCTION__ << ": money spent. height:  " << height
//                     << ", tx: " << tx_hash
//                     << ", amount: " << print_money(amount)
//                     << ", idx: " << subaddr_index);
//        // do not signal on sent tx if wallet is not syncronized completely
//        if (m_listener && m_wallet->synchronized()) {
//            m_listener->moneySpent(tx_hash, amount);
//            m_listener->updated();
//        }
    }

  private:
    MoneroWallet& wallet;     // wallet to provide context for notifications
    tools::wallet2& wallet2;  // internal wallet implementation to listen to
    boost::optional<MoneroWalletListener&> listener; // target listener to invoke with notifications
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
    crypto::secret_key secret_key;
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
    setDaemonConnection(daemonConnection.uri, daemonConnection.username, daemonConnection.password);
    wallet2->set_seed_language(language);
    wallet2->generate(path, password, recoveryKey, true, false);
    wallet2->set_refresh_from_block_height(restoreHeight);
    wallet2Listener = unique_ptr<Wallet2Listener>(new Wallet2Listener(*this, *wallet2));

    // print the mnemonic
    epee::wipeable_string fetchedMnemonic;
    wallet2->get_seed(fetchedMnemonic);
    cout << "Mnemonic: " << string(fetchedMnemonic.data(), fetchedMnemonic.size()) << endl;
  }

  MoneroWallet::MoneroWallet(const string& path, const string& password, const string& address, const string& viewKey, const string& spendKey, const MoneroNetworkType networkType, const MoneroRpcConnection& daemonConnection, uint64_t restoreHeight, const string& language) {
    cout << "MoneroWallet(7)" << endl;

    // validate and parse address
    cryptonote::address_parse_info info;
    if (!get_account_address_from_str(info, static_cast<cryptonote::network_type>(networkType), address)) throw runtime_error("failed to parse address");

    // validate and parse optional private spend key
    crypto::secret_key spendKeySK;
    bool hasSpendKey = false;
    if (!spendKey.empty()) {
      cryptonote::blobdata spendKeyData;
      if (!epee::string_tools::parse_hexstr_to_binbuff(spendKey, spendKeyData) || spendKeyData.size() != sizeof(crypto::secret_key)) {
        throw runtime_error("failed to parse secret spend key");
      }
      hasSpendKey = true;
      spendKeySK = *reinterpret_cast<const crypto::secret_key*>(spendKeyData.data());
    }

    // validate and parse private view key
    bool hasViewKey = true;
    crypto::secret_key viewKeySK;
    if (!viewKey.empty()) {
      if (hasSpendKey) hasViewKey = false;
      else throw runtime_error("Neither view key nor spend key supplied, cancelled");
    }
    if (hasViewKey) {
      cryptonote::blobdata viewKeyData;
      if (!epee::string_tools::parse_hexstr_to_binbuff(viewKey, viewKeyData) || viewKeyData.size() != sizeof(crypto::secret_key)) {
        throw runtime_error("failed to parse secret view key");
      }
      viewKeySK = *reinterpret_cast<const crypto::secret_key*>(viewKeyData.data());
    }

    // check the spend and view keys match the given address
    crypto::public_key pkey;
    if (hasSpendKey) {
      if (!crypto::secret_key_to_public_key(spendKeySK, pkey)) throw runtime_error("failed to verify secret spend key");
      if (info.address.m_spend_public_key != pkey) throw runtime_error("spend key does not match address");
    }
    if (hasViewKey) {
      if (!crypto::secret_key_to_public_key(viewKeySK, pkey)) throw runtime_error("failed to verify secret view key");
      if (info.address.m_view_public_key != pkey) throw runtime_error("view key does not match address");
    }

    // initialize wallet
    wallet2 = unique_ptr<tools::wallet2>(new tools::wallet2(static_cast<cryptonote::network_type>(networkType), 1, true));
    if (hasSpendKey && hasViewKey) wallet2->generate(path, password, info.address, spendKeySK, viewKeySK);
    if (!hasSpendKey && hasViewKey) wallet2->generate(path, password, info.address, viewKeySK);
    if (hasSpendKey && !hasViewKey) wallet2->generate(path, password, spendKeySK, true, false);
    setDaemonConnection(daemonConnection.uri, daemonConnection.username, daemonConnection.password);
    wallet2->set_refresh_from_block_height(restoreHeight);
    wallet2->set_seed_language(language);
    wallet2Listener = unique_ptr<Wallet2Listener>(new Wallet2Listener(*this, *wallet2));

    // print the mnemonic
    epee::wipeable_string fetchedMnemonic;
    wallet2->get_seed(fetchedMnemonic);
    cout << "Mnemonic: " << string(fetchedMnemonic.data(), fetchedMnemonic.size()) << endl;
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

    // init wallet2 and set daemon connection
    if (!wallet2->init(uri, login)) throw runtime_error("Failed to initialize wallet with daemon connection");
  }

  shared_ptr<MoneroRpcConnection> MoneroWallet::getDaemonConnection() const {
    if (wallet2->get_daemon_address().empty()) return nullptr;
    shared_ptr<MoneroRpcConnection> connection = shared_ptr<MoneroRpcConnection>(new MoneroRpcConnection());
    if (!wallet2->get_daemon_address().empty()) connection->uri = wallet2->get_daemon_address();
    if (wallet2->get_daemon_login()) {
      if (!wallet2->get_daemon_login()->username.empty()) connection->username = wallet2->get_daemon_login()->username;
      epee::wipeable_string wipeablePassword = wallet2->get_daemon_login()->password;
      string password = string(wipeablePassword.data(), wipeablePassword.size());
      if (!password.empty()) connection->password = password;
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

  vector<string> MoneroWallet::getLanguages() const {
    vector<string> languages;
    crypto::ElectrumWords::get_language_list(languages, true);
    return languages;
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

  MoneroIntegratedAddress MoneroWallet::getIntegratedAddress(const string& standardAddress, const string& paymentId) const {
    cout << "getIntegratedAddress(" << standardAddress << ", " << paymentId << ")" << endl;

    // TODO monero-core: this logic is based on wallet_rpc_server::on_make_integrated_address() and should be moved to wallet so this is unecessary for api users

    // randomly generate payment id if not given, else validate
    crypto::hash8 paymentIdH8;
    if (paymentId.empty()) {
      paymentIdH8 = crypto::rand<crypto::hash8>();
    } else {
      if (!tools::wallet2::parse_short_payment_id(paymentId, paymentIdH8)) throw runtime_error("Invalid payment ID: " + paymentId);
    }

    // use primary address if standard address not given, else validate
    if (standardAddress.empty()) {
      return decodeIntegratedAddress(wallet2->get_integrated_address_as_str(paymentIdH8));
    } else {

      // validate standard address
      cryptonote::address_parse_info info;
      if (!cryptonote::get_account_address_from_str(info, wallet2->nettype(), standardAddress)) throw runtime_error("Invalid address: " + standardAddress);
      if (info.is_subaddress) throw runtime_error("Subaddress shouldn't be used");
      if (info.has_payment_id) throw runtime_error("Already integrated address");
      if (paymentId.empty()) throw runtime_error("Payment ID shouldn't be left unspecified");

      // create integrated address from given standard address
      return decodeIntegratedAddress(cryptonote::get_account_integrated_address_as_str(wallet2->nettype(), info.address, paymentIdH8));
    }
  }

  MoneroIntegratedAddress MoneroWallet::decodeIntegratedAddress(const string& integratedAddress) const {
    cout << "decodeIntegratedAddress(" << integratedAddress << ")" << endl;

    // validate integrated address
    cryptonote::address_parse_info info;
    if (!cryptonote::get_account_address_from_str(info, wallet2->nettype(), integratedAddress)) throw runtime_error("Invalid integrated address: " + integratedAddress);
    if (!info.has_payment_id) throw runtime_error("Address is not an integrated address");

    // initialize and return result
    MoneroIntegratedAddress result;
    result.standardAddress = cryptonote::get_account_address_as_str(wallet2->nettype(), info.is_subaddress, info.address);
    result.paymentId = epee::string_tools::pod_to_hex(info.payment_id);
    result.integratedAddress = integratedAddress;
    return result;
  }

  string MoneroWallet::getMnemonic() const {
    epee::wipeable_string wipeablePassword;
    wallet2->get_seed(wipeablePassword);
    return string(wipeablePassword.data(), wipeablePassword.size());
  }

  string MoneroWallet::getPublicViewKey() const {
    cout << "getPrivateViewKey()" << endl;
    return epee::string_tools::pod_to_hex(wallet2->get_account().get_keys().m_account_address.m_view_public_key);
  }

  string MoneroWallet::getPrivateViewKey() const {
    cout << "getPrivateViewKey()" << endl;
    return epee::string_tools::pod_to_hex(wallet2->get_account().get_keys().m_view_secret_key);
  }

  string MoneroWallet::getPublicSpendKey() const {
    cout << "getPrivateSpendKey()" << endl;
    return epee::string_tools::pod_to_hex(wallet2->get_account().get_keys().m_account_address.m_spend_public_key);
  }

  string MoneroWallet::getPrivateSpendKey() const {
    cout << "getPrivateSpendKey()" << endl;
    return epee::string_tools::pod_to_hex(wallet2->get_account().get_keys().m_spend_secret_key);
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
    if (getDaemonConnection() == nullptr) throw runtime_error("No connection to daemon");
    uint64_t chainHeight = wallet2->get_daemon_blockchain_height(err);
    if (!err.empty()) throw runtime_error(err);
    return chainHeight;
  }

  uint64_t MoneroWallet::getRestoreHeight() const {
    return wallet2->get_refresh_from_block_height();
  }

  void MoneroWallet::setRestoreHeight(uint64_t restoreHeight) {
    wallet2->set_refresh_from_block_height(restoreHeight);
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

  MoneroAccount MoneroWallet::getAccount(uint32_t accountIdx, const bool includeSubaddresses) const {
    cout << "getAccount(" << accountIdx << ", " << includeSubaddresses << ")" << endl;

    // need transfers to inform if subaddresses used
    vector<tools::wallet2::transfer_details> transfers;
    if (includeSubaddresses) wallet2->get_transfers(transfers);

    // build and return account
    MoneroAccount account;
    account.index = accountIdx;
    account.primaryAddress = getAddress(accountIdx, 0);
    account.label = wallet2->get_subaddress_label({accountIdx, 0});
    account.balance = wallet2->balance(accountIdx);
    account.unlockedBalance = wallet2->unlocked_balance(accountIdx);
    if (includeSubaddresses) account.subaddresses = getSubaddressesAux(accountIdx, vector<uint32_t>(), transfers);
    return account;
  }

  MoneroAccount MoneroWallet::createAccount(const string& label) {
    cout << "createAccount(" << label << ")" << endl;

    // create account
    wallet2->add_subaddress_account(label);

    // initialize and return result
    MoneroAccount account;
    account.index = wallet2->get_num_subaddress_accounts() - 1;
    account.primaryAddress = wallet2->get_subaddress_as_str({account.index.get(), 0});
    account.label = label;
    account.balance = 0;
    account.unlockedBalance = 0;
    return account;
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

  // getSubaddresses

  MoneroSubaddress MoneroWallet::createSubaddress(const uint32_t accountIdx, const string& label) {
    cout << "createSubaddress(" << accountIdx << ", " << label << ")" << endl;

    // create subaddress
    wallet2->add_subaddress(accountIdx, label);

    // initialize and return result
    MoneroSubaddress subaddress;
    subaddress.accountIndex = accountIdx;
    subaddress.index = wallet2->get_num_subaddresses(accountIdx) - 1;
    subaddress.address = wallet2->get_subaddress_as_str({accountIdx, subaddress.index.get()});
    subaddress.label = label;
    subaddress.balance = 0;
    subaddress.unlockedBalance = 0;
    subaddress.numUnspentOutputs = 0;
    subaddress.isUsed = false;
    subaddress.numBlocksToUnlock = 0;
    return subaddress;
  }

  vector<shared_ptr<MoneroTxWallet>> MoneroWallet::getTxs(MoneroTxRequest& request) const {
    cout << "getTxs(request)" << endl;

    // print request
    cout << "Tx request: " << request.serialize() << endl;
    if (request.block != boost::none) cout << "Tx request's rooted at [block]: " << request.block.get()->serialize() << endl;

    // normalize request
    // TODO: this modifies original request so given req cannot be constant, make given request constant
    if (request.transferRequest == boost::none) request.transferRequest = shared_ptr<MoneroTransferRequest>(new MoneroTransferRequest());
    shared_ptr<MoneroTransferRequest> transferRequest = request.transferRequest.get();
    
    // temporarily disable transfer request
    request.transferRequest = boost::none;

    // fetch all transfers that meet tx request
    MoneroTransferRequest tempTransferReq;
    tempTransferReq.txRequest = make_shared<MoneroTxRequest>(request);
    vector<shared_ptr<MoneroTransfer>> transfers = getTransfers(tempTransferReq);

    // collect unique txs from transfers while retaining order
    vector<shared_ptr<MoneroTxWallet>> txs = vector<shared_ptr<MoneroTxWallet>>();
    unordered_set<shared_ptr<MoneroTxWallet>> txsSet;
    for (const shared_ptr<MoneroTransfer>& transfer : transfers) {
      if (txsSet.find(transfer->tx) == txsSet.end()) {
        txs.push_back(transfer->tx);
        txsSet.insert(transfer->tx);
      }
    }

    // cache types into maps for merging and lookup
    map<string, shared_ptr<MoneroTxWallet>> txMap;
    map<uint64_t, shared_ptr<MoneroBlock>> blockMap;
    for (const shared_ptr<MoneroTxWallet>& tx : txs) {
      mergeTx(tx, txMap, blockMap, false);
    }

    // fetch and merge outputs if requested
    MoneroOutputRequest tempOutputReq;
    tempOutputReq.txRequest = make_shared<MoneroTxRequest>(request);
    if (request.includeOutputs != boost::none && *request.includeOutputs) {

      // fetch outputs
      vector<shared_ptr<MoneroOutputWallet>> outputs = getOutputs(tempOutputReq);

      // merge output txs one time while retaining order
      unordered_set<shared_ptr<MoneroTxWallet>> outputTxs;
      for (const shared_ptr<MoneroOutputWallet>& output : outputs) {
        shared_ptr<MoneroTxWallet> tx = static_pointer_cast<MoneroTxWallet>(output->tx);
        if (outputTxs.find(tx) == outputTxs.end()) {
          mergeTx(tx, txMap, blockMap, true);
          outputTxs.insert(tx);
        }
      }
    }

    // filter txs that don't meet transfer request
    request.transferRequest = transferRequest;
    vector<shared_ptr<MoneroTxWallet>> txsRequested;
    vector<shared_ptr<MoneroTxWallet>>::iterator txIter = txs.begin();
    while (txIter != txs.end()) {
      shared_ptr<MoneroTxWallet> tx = *txIter;
      if (request.meetsCriteria(tx.get())) {
        txsRequested.push_back(tx);
        txIter++;
      } else {
        txIter = txs.erase(txIter);
        if (tx->block != boost::none) tx->block.get()->txs.erase(std::remove(tx->block.get()->txs.begin(), tx->block.get()->txs.end(), tx), tx->block.get()->txs.end()); // TODO, no way to use txIter?
      }
    }
    txs = txsRequested;

    // verify all specified tx ids found
    if (!request.txIds.empty()) {
      for (const string& txId : request.txIds) {
        bool found = false;
        for (const shared_ptr<MoneroTxWallet>& tx : txs) {
          if (txId == *tx->id) {
            found = true;
            break;
          }
        }
        if (!found) throw runtime_error("Tx not found in wallet: " + txId);
      }
    }

    // special case: re-fetch txs if inconsistency caused by needing to make multiple wallet calls
    for (const shared_ptr<MoneroTxWallet>& tx : txs) {
      if (*tx->isConfirmed && tx->block == boost::none) return getTxs(request);
    }

    // otherwise order txs if tx ids given then return
    if (!request.txIds.empty()) {
      vector<shared_ptr<MoneroTxWallet>> orderedTxs;
      for (const string& txId : request.txIds) {
        map<string, shared_ptr<MoneroTxWallet>>::const_iterator txIter = txMap.find(txId);
        orderedTxs.push_back(txIter->second);
      }
      txs = orderedTxs;
    }
    return txs;
  }

  vector<shared_ptr<MoneroTransfer>> MoneroWallet::getTransfers(const MoneroTransferRequest& request) const {
    cout << "MoneroWallet::getTransfers(request)" << endl;

    //cout << "1" << endl;

    // print request
    cout << "Transfer request: " << request.serialize() << endl;
    if (request.txRequest != boost::none) {
      if ((*request.txRequest)->block == boost::none) cout << "Transfer request's tx request rooted at [tx]:" << (*request.txRequest)->serialize() << endl;
      else cout << "Transfer request's tx request rooted at [block]: " << (*(*request.txRequest)->block)->serialize() << endl;
    }

    // normalize request
    // TODO: this will modify original request, construct copy? add test
    MoneroTxRequest txReq = *(request.txRequest != boost::none ? *request.txRequest : shared_ptr<MoneroTxRequest>(new MoneroTxRequest()));

    // print request
    //cout << "Tx request: " << txReq.serialize() << endl;
    //cout << "2" << endl;

    // build parameters for wallet2->get_payments()
    uint64_t minHeight = txReq.minHeight == boost::none ? 0 : *txReq.minHeight;
    uint64_t maxHeight = txReq.maxHeight == boost::none ? CRYPTONOTE_MAX_BLOCK_NUMBER : min((uint64_t) CRYPTONOTE_MAX_BLOCK_NUMBER, *txReq.maxHeight);
    boost::optional<uint32_t> accountIndex = boost::none;
    if (request.accountIndex != boost::none) accountIndex = *request.accountIndex;
    std::set<uint32_t> subaddressIndices;
    for (int i = 0; i < request.subaddressIndices.size(); i++) {
      subaddressIndices.insert(request.subaddressIndices[i]);
    }

    //cout << "3" << endl;

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

    //cout << "4" << endl;

    // collect unique txs and blocks
    map<string, shared_ptr<MoneroTxWallet>> txMap;
    map<uint64_t, shared_ptr<MoneroBlock>> blockMap;

    // get confirmed incoming transfers
    if (isIn) {
      std::list<std::pair<crypto::hash, tools::wallet2::payment_details>> payments;
      wallet2->get_payments(payments, minHeight, maxHeight, accountIndex, subaddressIndices);
      for (std::list<std::pair<crypto::hash, tools::wallet2::payment_details>>::const_iterator i = payments.begin(); i != payments.end(); ++i) {
        shared_ptr<MoneroTxWallet> tx = buildTxWithIncomingTransfer(i->first, i->second);
        mergeTx(tx, txMap, blockMap, false);
      }
    }

    //cout << "5" << endl;

    // get confirmed outgoing transfers
    if (isOut) {
      std::list<std::pair<crypto::hash, tools::wallet2::confirmed_transfer_details>> payments;
      wallet2->get_payments_out(payments, minHeight, maxHeight, accountIndex, subaddressIndices);
      for (std::list<std::pair<crypto::hash, tools::wallet2::confirmed_transfer_details>>::const_iterator i = payments.begin(); i != payments.end(); ++i) {
        shared_ptr<MoneroTxWallet> tx = buildTxWithOutgoingTransfer(i->first, i->second);
        mergeTx(tx, txMap, blockMap, false);
      }
    }

    //cout << "6" << endl;

    // get unconfirmed or failed outgoing transfers
    if (isPending || isFailed) {
      std::list<std::pair<crypto::hash, tools::wallet2::unconfirmed_transfer_details>> upayments;
      wallet2->get_unconfirmed_payments_out(upayments, accountIndex, subaddressIndices);
      for (std::list<std::pair<crypto::hash, tools::wallet2::unconfirmed_transfer_details>>::const_iterator i = upayments.begin(); i != upayments.end(); ++i) {
        shared_ptr<MoneroTxWallet> tx = buildTxWithOutgoingTransferUnconfirmed(i->first, i->second);
        if (txReq.isFailed != boost::none && txReq.isFailed.get() != tx->isFailed.get()) continue; // skip merging if tx unrequested
        mergeTx(tx, txMap, blockMap, false);
      }
    }

    //cout << "7" << endl;

    // get unconfirmed incoming transfers
    if (isPool) {
      wallet2->update_pool_state(); // TODO monero-core: this should be encapsulated in wallet when unconfirmed transfers requested
      std::list<std::pair<crypto::hash, tools::wallet2::pool_payment_details>> payments;
      wallet2->get_unconfirmed_payments(payments, accountIndex, subaddressIndices);
      for (std::list<std::pair<crypto::hash, tools::wallet2::pool_payment_details>>::const_iterator i = payments.begin(); i != payments.end(); ++i) {
        shared_ptr<MoneroTxWallet> tx = buildTxWithIncomingTransferUnconfirmed(i->first, i->second);
        mergeTx(tx, txMap, blockMap, false);
      }
    }

    //cout << "8" << endl;

    // filter and return transfers
    vector<shared_ptr<MoneroTransfer>> transfers;
    for (map<string, shared_ptr<MoneroTxWallet>>::const_iterator txIter = txMap.begin(); txIter != txMap.end(); txIter++) {
      shared_ptr<MoneroTxWallet> tx = txIter->second;

      // collect outgoing transfer, erase if filtered TODO: java/js do not erase filtered transfers
      if (tx->outgoingTransfer != boost::none && request.meetsCriteria(tx->outgoingTransfer.get().get())) transfers.push_back(tx->outgoingTransfer.get());
      else tx->outgoingTransfer = boost::none;

      // collect incoming transfers, erase if filtered
      vector<shared_ptr<MoneroIncomingTransfer>>::iterator iter = tx->incomingTransfers.begin();
      while (iter != tx->incomingTransfers.end()) {
        if (request.meetsCriteria((*iter).get())) {
          transfers.push_back(*iter);
          iter++;
        } else {
          iter = tx->incomingTransfers.erase(iter);
        }
      }

      // remove unrequested txs from block
      if (tx->block != boost::none && tx->outgoingTransfer == boost::none && tx->incomingTransfers.empty()) {
        tx->block.get()->txs.erase(std::remove(tx->block.get()->txs.begin(), tx->block.get()->txs.end(), tx), tx->block.get()->txs.end()); // TODO, no way to use const_iterator?
      }
    }
    //cout << "9" << endl;
    cout << "MoneroWallet.cpp getTransfers() returning " << transfers.size() << " transfers" << endl;
    return transfers;
  }

  vector<shared_ptr<MoneroOutputWallet>> MoneroWallet::getOutputs(const MoneroOutputRequest& request) const {
    cout << "MoneroWallet::getOutputs(request)" << endl;

    // print request
    cout << "Output request: " << request.serialize() << endl;
    if (request.txRequest != boost::none) {
      if ((*request.txRequest)->block == boost::none) cout << "Output request's tx request rooted at [tx]:" << (*request.txRequest)->serialize() << endl;
      else cout << "Output request's tx request rooted at [block]: " << (*(*request.txRequest)->block)->serialize() << endl;
    }

    // normalize request
    // TODO: this will modify original request, construct copy? add test
    MoneroTxRequest txReq = *(request.txRequest != boost::none ? *request.txRequest : shared_ptr<MoneroTxRequest>(new MoneroTxRequest()));

    // get output data from wallet2
    tools::wallet2::transfer_container outputsW2;
    wallet2->get_transfers(outputsW2);

    // collect unique txs and blocks
    map<string, shared_ptr<MoneroTxWallet>> txMap;
    map<uint64_t, shared_ptr<MoneroBlock>> blockMap;
    for (const auto& outputW2 : outputsW2) {
      // TODO: skip tx building if w2 output filtered by indices, etc
      shared_ptr<MoneroTxWallet> tx = buildTxWithVout(outputW2);
      mergeTx(tx, txMap, blockMap, false);
    }

    // collect requested outputs and discard irrelevant data
    vector<shared_ptr<MoneroOutputWallet>> vouts;
    for (map<string, shared_ptr<MoneroTxWallet>>::const_iterator txIter = txMap.begin(); txIter != txMap.end(); txIter++) {
      shared_ptr<MoneroTxWallet> tx = txIter->second;
      vector<shared_ptr<MoneroOutput>>::iterator voutIter = tx->vouts.begin();
      while (voutIter != tx->vouts.end()) {
        shared_ptr<MoneroOutputWallet> voutWallet = static_pointer_cast<MoneroOutputWallet>(*voutIter);
        if (request.meetsCriteria(voutWallet.get())) {
          vouts.push_back(voutWallet);
          voutIter++;
        } else {
          voutIter = tx->vouts.erase(voutIter); // remove unrequested vouts
        }
      }

      // remove txs without requested transfer
      if (tx->vouts.empty() && tx->block != boost::none) tx->block.get()->txs.erase(std::remove(tx->block.get()->txs.begin(), tx->block.get()->txs.end(), tx), tx->block.get()->txs.end()); // TODO, no way to use const_iterator?
    }
    return vouts;
  }

  vector<shared_ptr<MoneroKeyImage>> MoneroWallet::getKeyImages() const {
    cout << "MoneroWallet::getKeyImages()" << endl;

    // build key images from wallet2 types
    vector<shared_ptr<MoneroKeyImage>> keyImages;
    std::pair<size_t, std::vector<std::pair<crypto::key_image, crypto::signature>>> ski = wallet2->export_key_images(true);
    for (size_t n = 0; n < ski.second.size(); ++n) {
      shared_ptr<MoneroKeyImage> keyImage = shared_ptr<MoneroKeyImage>(new MoneroKeyImage());
      keyImages.push_back(keyImage);
      keyImage->hex = epee::string_tools::pod_to_hex(ski.second[n].first);
      keyImage->signature = epee::string_tools::pod_to_hex(ski.second[n].second);
    }
    return keyImages;
  }

  shared_ptr<MoneroKeyImageImportResult> MoneroWallet::importKeyImages(const vector<shared_ptr<MoneroKeyImage>>& keyImages) {
    cout << "MoneroWallet::importKeyImages()" << endl;

    // validate and prepare key images for wallet2
    std::vector<std::pair<crypto::key_image, crypto::signature>> ski;
    ski.resize(keyImages.size());
    for (size_t n = 0; n < ski.size(); ++n) {
      if (!epee::string_tools::hex_to_pod(keyImages[n]->hex.get(), ski[n].first)) {
        throw runtime_error("failed to parse key image");
      }
      if (!epee::string_tools::hex_to_pod(keyImages[n]->signature.get(), ski[n].second)) {
        throw runtime_error("failed to parse signature");
      }
    }

    // import key images
    uint64_t spent = 0, unspent = 0;
    uint64_t height = wallet2->import_key_images(ski, 0, spent, unspent); // TODO: use offset? refer to wallet_rpc_server::on_import_key_images() req.offset

    // translate results
    shared_ptr<MoneroKeyImageImportResult> result = shared_ptr<MoneroKeyImageImportResult>(new MoneroKeyImageImportResult());
    result->height = height;
    result->spentAmount = spent;
    result->unspentAmount = unspent;
    return result;
  }

  vector<shared_ptr<MoneroTxWallet>> MoneroWallet::sendSplit(const MoneroSendRequest& request) {
    cout << "MoneroWallet::sendSplit(request)" << endl;
    cout << "MoneroSendRequest: " << request.serialize() << endl;

    wallet_rpc::COMMAND_RPC_TRANSFER::request req;
    wallet_rpc::COMMAND_RPC_TRANSFER::response res;
    epee::json_rpc::error err;

    // prepare parameters for wallet rpc's validate_transfer()
    string paymentId = request.paymentId == boost::none ? string("") : request.paymentId.get();
    list<tools::wallet_rpc::transfer_destination> trDestinations;
    for (const shared_ptr<MoneroDestination>& destination : request.destinations) {
      tools::wallet_rpc::transfer_destination trDestination;
      trDestination.amount = destination->amount.get();
      trDestination.address = destination->address.get();
      trDestinations.push_back(trDestination);
    }

    // validate the requested txs and populate dsts & extra
    std::vector<cryptonote::tx_destination_entry> dsts;
    std::vector<uint8_t> extra;
    if (!validate_transfer(wallet2.get(), trDestinations, paymentId, dsts, extra, true, err)) {
      throw runtime_error("Need to handle sendSplit() validate_transfer error");  // TODO
    }

    // prepare parameters for wallet2's create_transactions_2()
    uint64_t mixin = wallet2->adjust_mixin(request.ringSize == boost::none ? 0 : request.ringSize.get() - 1);
    uint32_t priority = wallet2->adjust_priority(request.priority == boost::none ? 0 : request.priority.get());
    uint64_t unlockTime = request.unlockTime == boost::none ? 0 : request.unlockTime.get();
    if (request.accountIndex == boost::none) throw runtime_error("Must specify the account index to send from");
    uint32_t accountIndex = request.accountIndex.get();
    std::set<uint32_t> subaddressIndices;
    for (const uint32_t& subaddressIdx : request.subaddressIndices) subaddressIndices.insert(subaddressIdx);

    // prepare transactions
    vector<wallet2::pending_tx> ptx_vector = wallet2->create_transactions_2(dsts, mixin, unlockTime, priority, extra, accountIndex, subaddressIndices);
    cout << "CREATED " << ptx_vector.size() << " PENDING TXS" << endl;
    if (ptx_vector.empty()) throw runtime_error("No transaction created");

    // TODO: test send() (canSplit=false) checks for 1 and rejects
//      // reject proposed transactions if there are more than one.  see on_transfer_split below.
//      if (ptx_vector.size() != 1) {
//        er.code = WALLET_RPC_ERROR_CODE_TX_TOO_LARGE;
//        er.message = "Transaction would be too large.  try /transfer_split.";
//        return false;
//      }

    // config for fill_response()
    bool getTxKeys = true;
    bool getTxHex = true;
    bool getTxMetadata = true;
    bool doNotRelay = request.doNotRelay == boost::none ? false : request.doNotRelay.get();
    cout << "doNotRelay: " << doNotRelay << endl;

    // commit txs (if relaying) and get response using wallet rpc's fill_response()
    list<string> txKeys;
    list<uint64_t> txAmounts;
    list<uint64_t> txFees;
    string multisigTxSet;
    string unsignedTxSet;
    list<string> txIds;
    list<string> txBlobs;
    list<string> txMetadatas;
    if (!fill_response(wallet2.get(), ptx_vector, getTxKeys, txKeys, txAmounts, txFees, multisigTxSet, unsignedTxSet, doNotRelay, txIds, getTxHex, txBlobs, getTxMetadata, txMetadatas, err)) {
      throw runtime_error("need to handle error filling response!");
    }

    // build sent txs from results  // TODO: break this into separate utility function
    vector<shared_ptr<MoneroTxWallet>> txs;
    auto txIdsIter = txIds.begin();
    auto txKeysIter = txKeys.begin();
    auto txAmountsIter = txAmounts.begin();
    auto txFeesIter = txFees.begin();
    auto txBlobsIter = txBlobs.begin();
    auto txMetadatasIter = txMetadatas.begin();
    while (txIdsIter != txIds.end()) {

      // init tx with outgoing transfer from filled values
      shared_ptr<MoneroTxWallet> tx = shared_ptr<MoneroTxWallet>(new MoneroTxWallet());
      txs.push_back(tx);
      tx->id = *txIdsIter;
      tx->key = *txKeysIter;
      tx->fee = *txFeesIter;
      tx->fullHex = *txBlobsIter;
      tx->metadata = *txMetadatasIter;
      shared_ptr<MoneroOutgoingTransfer> outTransfer = shared_ptr<MoneroOutgoingTransfer>(new MoneroOutgoingTransfer());
      tx->outgoingTransfer = outTransfer;
      outTransfer->amount = *txAmountsIter;

      // init other known fields
      tx->paymentId = request.paymentId;
      tx->isConfirmed = false;
      tx->isCoinbase = false;
      tx->isFailed = false;   // TODO: test and handle if true
      tx->doNotRelay = request.doNotRelay != boost::none && request.doNotRelay.get() == true;
      tx->isRelayed = tx->doNotRelay.get() != true;
      tx->inTxPool = !tx->doNotRelay.get();
      if (!tx->isFailed.get() && tx->isRelayed.get()) tx->isDoubleSpend = false;  // TODO: test and handle if true
      tx->numConfirmations = 0;
      tx->mixin = request.mixin;
      tx->unlockTime = request.unlockTime == boost::none ? 0 : request.unlockTime.get();
      if (tx->isRelayed.get()) tx->lastRelayedTimestamp = static_cast<uint64_t>(time(NULL));  // set last relayed timestamp to current time iff relayed  // TODO monero core: this should be encapsulated in wallet2
      outTransfer->accountIndex = request.accountIndex;
      if (request.subaddressIndices.size() == 1) outTransfer->subaddressIndices.push_back(request.subaddressIndices[0]);  // subaddress index is known iff 1 requested  // TODO: get all known subaddress indices here
      outTransfer->destinations = request.destinations;

      // iterate to next element
      txKeysIter++;
      txAmountsIter++;
      txFeesIter++;
      txIdsIter++;
      txBlobsIter++;
      txMetadatasIter++;
    }
    return txs;
  }

  shared_ptr<MoneroTxWallet> MoneroWallet::sweepOutput(const MoneroSendRequest& request) const  {
    cout << "sweepOutput()" << endl;
    cout << "MoneroSendRequest: " << request.serialize() << endl;

    // validate input request
    if (request.keyImage == boost::none || request.keyImage.get().empty()) throw runtime_error("Must provide key image of output to sweep");
    if (request.destinations.size() != 1 || request.destinations[0]->address == boost::none || request.destinations[0]->address.get().empty()) throw runtime_error("Must provide exactly one destination to sweep output to");

    // validate the transfer requested and populate dsts & extra
    string paymentId = request.paymentId == boost::none ? string("") : request.paymentId.get();
    std::vector<cryptonote::tx_destination_entry> dsts;
    std::vector<uint8_t> extra;
    std::list<wallet_rpc::transfer_destination> destination;
    destination.push_back(wallet_rpc::transfer_destination());
    destination.back().amount = 0;
    destination.back().address = request.destinations[0]->address.get();
    epee::json_rpc::error er;
    if (!validate_transfer(wallet2.get(), destination, paymentId, dsts, extra, true, er)) {
      //throw runtime_error(er);  // TODO
      throw runtime_error("Handle validate_transfer error!");
    }

    // validate key image
    crypto::key_image ki;
    if (!epee::string_tools::hex_to_pod(request.keyImage.get(), ki)) {
      throw runtime_error("failed to parse key image");
    }

    // create transaction
    uint64_t mixin = wallet2->adjust_mixin(request.ringSize == boost::none ? 0 : request.ringSize.get() - 1);
    uint32_t priority = wallet2->adjust_priority(request.priority == boost::none ? 0 : request.priority.get());
    uint64_t unlockTime = request.unlockTime == boost::none ? 0 : request.unlockTime.get();
    std::vector<wallet2::pending_tx> ptx_vector = wallet2->create_transactions_single(ki, dsts[0].addr, dsts[0].is_subaddress, 1, mixin, unlockTime, priority, extra);

    // validate created transaction
    if (ptx_vector.empty()) throw runtime_error("No outputs found");
    if (ptx_vector.size() > 1) throw runtime_error("Multiple transactions are created, which is not supposed to happen");
    const wallet2::pending_tx &ptx = ptx_vector[0];
    if (ptx.selected_transfers.size() > 1) throw runtime_error("The transaction uses multiple inputs, which is not supposed to happen");

    // config for fill_response()
    bool getTxKeys = true;
    bool getTxHex = true;
    bool getTxMetadata = true;
    bool doNotRelay = request.doNotRelay == boost::none ? false : request.doNotRelay.get();
    cout << "doNotRelay: " << doNotRelay << endl;

    // commit txs (if relaying) and get response using wallet rpc's fill_response()
    list<string> txKeys;
    list<uint64_t> txAmounts;
    list<uint64_t> txFees;
    string multisigTxSet;
    string unsignedTxSet;
    list<string> txIds;
    list<string> txBlobs;
    list<string> txMetadatas;
    if (!fill_response(wallet2.get(), ptx_vector, getTxKeys, txKeys, txAmounts, txFees, multisigTxSet, unsignedTxSet, doNotRelay, txIds, getTxHex, txBlobs, getTxMetadata, txMetadatas, er)) {
      throw runtime_error("need to handle error filling response!");  // TODO: return err message
    }

    // build sent txs from results  // TODO: use common utility with sendSplit() to avoid code duplication
    vector<shared_ptr<MoneroTxWallet>> txs;
    auto txIdsIter = txIds.begin();
    auto txKeysIter = txKeys.begin();
    auto txAmountsIter = txAmounts.begin();
    auto txFeesIter = txFees.begin();
    auto txBlobsIter = txBlobs.begin();
    auto txMetadatasIter = txMetadatas.begin();
    while (txIdsIter != txIds.end()) {

      // init tx with outgoing transfer from filled values
      shared_ptr<MoneroTxWallet> tx = shared_ptr<MoneroTxWallet>(new MoneroTxWallet());
      txs.push_back(tx);
      tx->id = *txIdsIter;
      tx->key = *txKeysIter;
      tx->fee = *txFeesIter;
      tx->fullHex = *txBlobsIter;
      tx->metadata = *txMetadatasIter;
      shared_ptr<MoneroOutgoingTransfer> outTransfer = shared_ptr<MoneroOutgoingTransfer>(new MoneroOutgoingTransfer());
      tx->outgoingTransfer = outTransfer;
      outTransfer->amount = *txAmountsIter;

      // init other known fields
      tx->paymentId = request.paymentId;
      tx->isConfirmed = false;
      tx->isCoinbase = false;
      tx->isFailed = false;   // TODO: test and handle if true
      tx->doNotRelay = request.doNotRelay != boost::none && request.doNotRelay.get() == true;
      tx->isRelayed = tx->doNotRelay.get() != true;
      tx->inTxPool = !tx->doNotRelay.get();
      if (!tx->isFailed.get() && tx->isRelayed.get()) tx->isDoubleSpend = false;  // TODO: test and handle if true
      tx->numConfirmations = 0;
      tx->mixin = request.mixin;
      tx->unlockTime = request.unlockTime == boost::none ? 0 : request.unlockTime.get();
      if (tx->isRelayed.get()) tx->lastRelayedTimestamp = static_cast<uint64_t>(time(NULL));  // set last relayed timestamp to current time iff relayed  // TODO monero core: this should be encapsulated in wallet2
      outTransfer->accountIndex = request.accountIndex;
      if (request.subaddressIndices.size() == 1) outTransfer->subaddressIndices.push_back(request.subaddressIndices[0]);  // subaddress index is known iff 1 requested  // TODO: get all known subaddress indices here
      outTransfer->destinations = request.destinations;
      outTransfer->destinations[0]->amount = *txAmountsIter;

      // iterate to next element
      txKeysIter++;
      txAmountsIter++;
      txFeesIter++;
      txIdsIter++;
      txBlobsIter++;
      txMetadatasIter++;
    }

    // return tx
    if (txs.size() != 1) throw runtime_error("Expected 1 transaction but was " + boost::lexical_cast<std::string>(txs.size()));
    return txs[0];
  }

  vector<shared_ptr<MoneroTxWallet>> MoneroWallet::sweepDust(bool doNotRelay) {
    cout << "MoneroWallet::sweepDust()" << endl;
    throw runtime_error("Not implemented");
  }

  vector<string> MoneroWallet::relayTxs(const vector<string>& txMetadatas) {
    cout << "relayTxs()" << endl;

    // relay each metadata as a tx
    vector<string> txIds;
    for (const auto& txMetadata : txMetadatas) {

      // parse tx metadata hex
      cryptonote::blobdata blob;
      if (!epee::string_tools::parse_hexstr_to_binbuff(txMetadata, blob)) {
        throw runtime_error("Failed to parse hex.");
      }

      // deserialize tx
      tools::wallet2::pending_tx ptx;
      try {
        std::istringstream iss(blob);
        boost::archive::portable_binary_iarchive ar(iss);
        ar >> ptx;
      } catch (...) {
        throw runtime_error("Failed to parse tx metadata.");
      }

      // commit tx
      try {
        wallet2->commit_tx(ptx);
      } catch (const std::exception& e) {
        throw runtime_error("Failed to commit tx.");
      }

      // collect resulting id
      txIds.push_back(epee::string_tools::pod_to_hex(cryptonote::get_transaction_hash(ptx.tx)));
    }

    // return relayed tx ids
    return txIds;
  }

  string MoneroWallet::getTxNote(const string& txId) const {
    cout << "MoneroWallet::getTxNote" << endl;
    cryptonote::blobdata txBlob;
    if (!epee::string_tools::parse_hexstr_to_binbuff(txId, txBlob) || txBlob.size() != sizeof(crypto::hash)) {
      throw runtime_error("TX ID has invalid format");
    }
    crypto::hash txHash = *reinterpret_cast<const crypto::hash*>(txBlob.data());
    return wallet2->get_tx_note(txHash);
  }

  void MoneroWallet::setTxNote(const string& txId, const string& note) {
    cout << "MoneroWallet::setTxNote" << endl;
    cryptonote::blobdata txBlob;
    if (!epee::string_tools::parse_hexstr_to_binbuff(txId, txBlob) || txBlob.size() != sizeof(crypto::hash)) {
      throw runtime_error("TX ID has invalid format");
    }
    crypto::hash txHash = *reinterpret_cast<const crypto::hash*>(txBlob.data());
    wallet2->set_tx_note(txHash, note);
  }

  vector<string> MoneroWallet::getTxNotes(const vector<string>& txIds) const {
    cout << "MoneroWallet::getTxNotes()" << endl;
    vector<string> txNotes;
    for (const auto& txId : txIds) txNotes.push_back(getTxNote(txId));
    return txNotes;
  }

  void MoneroWallet::setTxNotes(const vector<string>& txIds, const vector<string>& txNotes) {
    cout << "MoneroWallet::setTxNotes()" << endl;
    if (txIds.size() != txNotes.size()) throw runtime_error("Different amount of txids and notes");
    for (int i = 0; i < txIds.size(); i++) {
      setTxNote(txIds[i], txNotes[i]);
    }
  }

  string MoneroWallet::sign(const string& msg) const {
    return wallet2->sign(msg);
  }

  bool MoneroWallet::verify(const string& msg, const string& address, const string& signature) const {

    // validate and parse address or url
    cryptonote::address_parse_info info;
    string err;
    if (!get_account_address_from_str_or_url(info, wallet2->nettype(), address,
      [&err](const std::string &url, const std::vector<std::string> &addresses, bool dnssec_valid)->std::string {
        if (!dnssec_valid) {
          err = std::string("Invalid DNSSEC for ") + url;
          return {};
        }
        if (addresses.empty()) {
          err = std::string("No Monero address found at ") + url;
          return {};
        }
        return addresses[0];
      }))
    {
      throw runtime_error(err);
    }

    // verify and return result
    return wallet2->verify(msg, info.address, signature);
  }

  string MoneroWallet::getTxKey(const string& txId) const {
    cout << "MoneroWallet::getTxKey()" << endl;

    // validate and parse tx id hash
    crypto::hash txHash;
    if (!epee::string_tools::hex_to_pod(txId, txHash)) {
      throw runtime_error("TX ID has invalid format");
    }

    // get tx key and additional keys
    crypto::secret_key txKey;
    std::vector<crypto::secret_key> additionalTxKeys;
    if (!wallet2->get_tx_key(txHash, txKey, additionalTxKeys)) {
      throw runtime_error("No tx secret key is stored for this tx");
    }

    // build and return tx key with additional keys
    epee::wipeable_string s;
    s += epee::to_hex::wipeable_string(txKey);
    for (size_t i = 0; i < additionalTxKeys.size(); ++i) {
      s += epee::to_hex::wipeable_string(additionalTxKeys[i]);
    }
    return std::string(s.data(), s.size());
  }

  shared_ptr<MoneroCheckTx> MoneroWallet::checkTxKey(const string& txId, const string& txKey, const string& address) const {
    cout << "MoneroWallet::checkTxKey()" << endl;

    // validate and parse tx id
    crypto::hash txHash;
    if (!epee::string_tools::hex_to_pod(txId, txHash)) {
      throw runtime_error("TX ID has invalid format");
    }

    // validate and parse tx key
    epee::wipeable_string tx_key_str = txKey;
    if (tx_key_str.size() < 64 || tx_key_str.size() % 64) {
      throw runtime_error("Tx key has invalid format");
    }
    const char *data = tx_key_str.data();
    crypto::secret_key tx_key;
    if (!epee::wipeable_string(data, 64).hex_to_pod(unwrap(unwrap(tx_key)))) {
      throw runtime_error("Tx key has invalid format");
    }

    // get additional keys
    size_t offset = 64;
    std::vector<crypto::secret_key> additionalTxKeys;
    while (offset < tx_key_str.size()) {
      additionalTxKeys.resize(additionalTxKeys.size() + 1);
      if (!epee::wipeable_string(data + offset, 64).hex_to_pod(unwrap(unwrap(additionalTxKeys.back())))) {
        throw runtime_error("Tx key has invalid format");
      }
      offset += 64;
    }

    // validate and parse address
    cryptonote::address_parse_info info;
    if (!get_account_address_from_str(info, wallet2->nettype(), address)) {
      throw runtime_error("Invalid address");
    }

    // initialize and return tx check using wallet2
    uint64_t receivedAmount;
    bool inTxPool;
    uint64_t numConfirmations;
    wallet2->check_tx_key(txHash, tx_key, additionalTxKeys, info.address, receivedAmount, inTxPool, numConfirmations);
    shared_ptr<MoneroCheckTx> checkTx = shared_ptr<MoneroCheckTx>(new MoneroCheckTx());
    checkTx->isGood = true; // check is good if we get this far
    checkTx->receivedAmount = receivedAmount;
    checkTx->inTxPool = inTxPool;
    checkTx->numConfirmations = numConfirmations;
    return checkTx;
  }

  string MoneroWallet::getTxProof(const string& txId, const string& address, const string& message) const {

    // validate and parse tx id hash
    crypto::hash txHash;
    if (!epee::string_tools::hex_to_pod(txId, txHash)) {
      throw runtime_error("TX ID has invalid format");
    }

    // validate and parse address
    cryptonote::address_parse_info info;
    if (!get_account_address_from_str(info, wallet2->nettype(), address)) {
      throw runtime_error("Invalid address");
    }

    // get tx proof
    return wallet2->get_tx_proof(txHash, info.address, info.is_subaddress, message);
  }

  shared_ptr<MoneroCheckTx> MoneroWallet::checkTxProof(const string& txId, const string& address, const string& message, const string& signature) const {
    cout << "MoneroWallet::checkTxProof()" << endl;

    // validate and parse tx id
    crypto::hash txHash;
    if (!epee::string_tools::hex_to_pod(txId, txHash)) {
      throw runtime_error("TX ID has invalid format");
    }

    // validate and parse address
    cryptonote::address_parse_info info;
    if (!get_account_address_from_str(info, wallet2->nettype(), address)) {
      throw runtime_error("Invalid address");
    }

    // initialize and return tx check using wallet2
    shared_ptr<MoneroCheckTx> checkTx = shared_ptr<MoneroCheckTx>(new MoneroCheckTx());
    uint64_t receivedAmount;
    bool inTxPool;
    uint64_t numConfirmations;
    checkTx->isGood = wallet2->check_tx_proof(txHash, info.address, info.is_subaddress, message, signature, receivedAmount, inTxPool, numConfirmations);
    if (checkTx->isGood) {
      checkTx->receivedAmount = receivedAmount;
      checkTx->inTxPool = inTxPool;
      checkTx->numConfirmations = numConfirmations;
    }
    return checkTx;
  }

  string MoneroWallet::getSpendProof(const string& txId, const string& message) const {
    cout << "MoneroWallet::getSpendProof()" << endl;

    // validate and parse tx id
    crypto::hash txHash;
    if (!epee::string_tools::hex_to_pod(txId, txHash)) {
      throw runtime_error("TX ID has invalid format");
    }

    // return spend proof signature
    return wallet2->get_spend_proof(txHash, message);
  }

  bool MoneroWallet::checkSpendProof(const string& txId, const string& message, const string& signature) const {
    cout << "MoneroWallet::checkSpendProof()" << endl;

    // validate and parse tx id
    crypto::hash txHash;
    if (!epee::string_tools::hex_to_pod(txId, txHash)) {
      throw runtime_error("TX ID has invalid format");
    }

    // check spend proof
    return wallet2->check_spend_proof(txHash, message, signature);
  }

  string MoneroWallet::getReserveProofWallet(const string& message) const {
    cout << "MoneroWallet::getReserveProofWallet()" << endl;
    boost::optional<std::pair<uint32_t, uint64_t>> account_minreserve;
    return wallet2->get_reserve_proof(account_minreserve, message);
  }

  string MoneroWallet::getReserveProofAccount(uint32_t accountIdx, uint64_t amount, const string& message) const {
    cout << "MoneroWallet::getReserveProofAccount()" << endl;
    boost::optional<std::pair<uint32_t, uint64_t>> account_minreserve;
    if (accountIdx >= wallet2->get_num_subaddress_accounts()) throw runtime_error("Account index is out of bound");
    account_minreserve = std::make_pair(accountIdx, amount);
    return wallet2->get_reserve_proof(account_minreserve, message);
  }

  shared_ptr<MoneroCheckReserve> MoneroWallet::checkReserveProof(const string& address, const string& message, const string& signature) const {
    cout << "MoneroWallet::checkReserveProof()" << endl;

    // validate and parse input
    cryptonote::address_parse_info info;
    if (!get_account_address_from_str(info, wallet2->nettype(), address)) throw runtime_error("Invalid address");
    if (info.is_subaddress) throw runtime_error("Address must not be a subaddress");

    // initialize check reserve using wallet2
    shared_ptr<MoneroCheckReserve> checkReserve = shared_ptr<MoneroCheckReserve>(new MoneroCheckReserve());
    uint64_t totalAmount;
    uint64_t unconfirmedSpentAmount;
    checkReserve->isGood = wallet2->check_reserve_proof(info.address, message, signature, totalAmount, unconfirmedSpentAmount);
    if (checkReserve->isGood) {
      checkReserve->totalAmount = totalAmount;
      checkReserve->unconfirmedSpentAmount = unconfirmedSpentAmount;
    }
    return checkReserve;
  }

  string MoneroWallet::createPaymentUri(const MoneroSendRequest& request) const {
    cout << "createPaymentUri()" << endl;

    // validate request
    if (request.destinations.size() != 1) throw runtime_error("Cannot make URI from supplied parameters: must provide exactly one destination to send funds");
    if (request.destinations.at(0)->address == boost::none) throw runtime_error("Cannot make URI from supplied parameters: must provide destination address");
    if (request.destinations.at(0)->amount == boost::none) throw runtime_error("Cannot make URI from supplied parameters: must provide destination amount");

    // prepare wallet2 params
    string address = request.destinations.at(0)->address.get();
    string paymentId = request.paymentId == boost::none ? "" : request.paymentId.get();
    uint64_t amount = request.destinations.at(0)->amount.get();
    string note = request.note == boost::none ? "" : request.note.get();
    string recipientName = request.recipientName == boost::none ? "" : request.recipientName.get();

    // make uri using wallet2
    std::string error;
    string uri = wallet2->make_uri(address, paymentId, amount, note, recipientName, error);
    if (uri.empty()) throw runtime_error("Cannot make URI from supplied parameters: " + error);
    return uri;
  }

  shared_ptr<MoneroSendRequest> MoneroWallet::parsePaymentUri(const string& uri) const {
    cout << "parsePaymentUri(" << uri << ")" << endl;

    // decode uri to parameters
    string address;
    string paymentId;
    uint64_t amount = 0;
    string note;
    string recipientName;
    vector<string> unknownParameters;
    string error;
    if (!wallet2->parse_uri(uri, address, paymentId, amount, note, recipientName, unknownParameters, error)) {
      throw runtime_error("Error parsing URI: " + error);
    }

    // initialize send request
    shared_ptr<MoneroSendRequest> sendRequest = shared_ptr<MoneroSendRequest>(new MoneroSendRequest());
    shared_ptr<MoneroDestination> destination = shared_ptr<MoneroDestination>(new MoneroDestination());
    sendRequest->destinations.push_back(destination);
    if (!address.empty()) destination->address = address;
    destination->amount = amount;
    if (!paymentId.empty()) sendRequest->paymentId = paymentId;
    if (!note.empty()) sendRequest->note = note;
    if (!recipientName.empty()) sendRequest->recipientName = recipientName;
    if (!unknownParameters.empty()) cout << "WARNING in MoneroWallet::parsePaymentUri: URI contains unknown parameters which are discarded" << endl; // TODO: return unknown parameters?
    return sendRequest;
  }

  string MoneroWallet::getOutputsHex() const {
    return epee::string_tools::buff_to_hex_nodelimer(wallet2->export_outputs_to_str(true));
  }

  int MoneroWallet::importOutputsHex(const string& outputsHex) {

    // validate and parse hex data
    cryptonote::blobdata blob;
    if (!epee::string_tools::parse_hexstr_to_binbuff(outputsHex, blob)) {
      throw runtime_error("Failed to parse hex.");
    }

    // import hex and return result
    return wallet2->import_outputs_from_str(blob);
  }

  void MoneroWallet::setAttribute(const string& key, const string& val) {
    wallet2->set_attribute(key, val);
  }

  string MoneroWallet::getAttribute(const string& key) const {
    return wallet2->get_attribute(key);
  }

  void MoneroWallet::startMining(boost::optional<uint64_t> numThreads, boost::optional<bool> backgroundMining, boost::optional<bool> ignoreBattery) {
    cout << "startMining" << endl;

    // only mine on trusted daemon
    if (!wallet2->is_trusted_daemon()) throw runtime_error("This command requires a trusted daemon.");

    // set defaults
    if (numThreads == boost::none || numThreads.get() == 0) numThreads = 1;  // TODO: how to autodetect optimal number of threads which daemon supports?
    if (backgroundMining == boost::none) backgroundMining = false;
    if (ignoreBattery == boost::none) ignoreBattery = false;

    // validate num threads
    size_t max_mining_threads_count = (std::max)(tools::get_max_concurrency(), static_cast<unsigned>(2));
    if (numThreads.get() < 1 || max_mining_threads_count < numThreads.get()) {
      throw runtime_error("The specified number of threads is inappropriate.");
    }

    // start mining on daemon
    cryptonote::COMMAND_RPC_START_MINING::request daemon_req = AUTO_VAL_INIT(daemon_req);
    daemon_req.miner_address = wallet2->get_account().get_public_address_str(wallet2->nettype());
    daemon_req.threads_count = numThreads.get();
    daemon_req.do_background_mining = backgroundMining.get();
    daemon_req.ignore_battery       = ignoreBattery.get();
    cryptonote::COMMAND_RPC_START_MINING::response daemon_res;
    bool r = wallet2->invoke_http_json("/start_mining", daemon_req, daemon_res);
    if (!r || daemon_res.status != CORE_RPC_STATUS_OK) {
      throw runtime_error("Couldn't start mining due to unknown error.");
    }
  }

  void MoneroWallet::stopMining() {
    cout << "stopMining()" << endl;
    cryptonote::COMMAND_RPC_STOP_MINING::request daemon_req;
    cryptonote::COMMAND_RPC_STOP_MINING::response daemon_res;
    bool r = wallet2->invoke_http_json("/stop_mining", daemon_req, daemon_res);
    if (!r || daemon_res.status != CORE_RPC_STATUS_OK) {
      throw runtime_error("Couldn't stop mining due to unknown error.");
    }
  }

  void MoneroWallet::save() {
    cout << "save()" << endl;
    wallet2->store();
  }

  void MoneroWallet::moveTo(string path, string password) {
    cout << "moveTo(" << path << ", " << password << ")" << endl;
    wallet2->store_to(path, password);
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
      subaddress.label = wallet2->get_subaddress_label({accountIdx, subaddressIdx});
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

  shared_ptr<MoneroTxWallet> MoneroWallet::buildTxWithIncomingTransfer(const crypto::hash &payment_id, const tools::wallet2::payment_details &pd) const {
    //cout << "buildTxWithIncomingTransfer()" << endl;

    // construct block
    shared_ptr<MoneroBlock> block = shared_ptr<MoneroBlock>(new MoneroBlock());
    block->height = pd.m_block_height;
    block->timestamp = pd.m_timestamp;

    // construct tx
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

  //void wallet_rpc_server::fill_transfer_entry(tools::wallet_rpc::transfer_entry &entry, const crypto::hash &txid, const crypto::hash &payment_id, const tools::wallet2::payment_details &pd)

  //void wallet_rpc_server::fill_transfer_entry(tools::wallet_rpc::transfer_entry &entry, const crypto::hash &txid, const tools::wallet2::confirmed_transfer_details &pd)

  //void wallet_rpc_server::fill_transfer_entry(tools::wallet_rpc::transfer_entry &entry, const crypto::hash &txid, const tools::wallet2::unconfirmed_transfer_details &pd)

  //void wallet_rpc_server::fill_transfer_entry(tools::wallet_rpc::transfer_entry &entry, const crypto::hash &payment_id, const tools::wallet2::pool_payment_details &ppd)

  shared_ptr<MoneroTxWallet> MoneroWallet::buildTxWithOutgoingTransfer(const crypto::hash &txid, const tools::wallet2::confirmed_transfer_details &pd) const {
    //cout << "buildTxWithOutgoingTransfer()" << endl;

    // construct block
    shared_ptr<MoneroBlock> block = shared_ptr<MoneroBlock>(new MoneroBlock());
    block->height = pd.m_block_height;
    block->timestamp = pd.m_timestamp;

    // construct tx
    shared_ptr<MoneroTxWallet> tx = shared_ptr<MoneroTxWallet>(new MoneroTxWallet());
    tx->block = block;
    block->txs.push_back(tx);
    tx->id = string_tools::pod_to_hex(txid);
    tx->paymentId = string_tools::pod_to_hex(pd.m_payment_id);
    if (tx->paymentId->substr(16).find_first_not_of('0') == std::string::npos) tx->paymentId = tx->paymentId->substr(0, 16);  // TODO monero core: this should be part of core wallet
    if (tx->paymentId == MoneroTx::DEFAULT_PAYMENT_ID) tx->paymentId = boost::none;  // clear default payment id
    tx->unlockTime = pd.m_unlock_time;
    tx->fee = pd.m_amount_in - pd.m_amount_out;
    tx->note = wallet2->get_tx_note(txid);
    if (tx->note->empty()) tx->note = boost::none; // clear empty note
    tx->isCoinbase = false;
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
    shared_ptr<MoneroOutgoingTransfer> outgoingTransfer = shared_ptr<MoneroOutgoingTransfer>(new MoneroOutgoingTransfer());
    outgoingTransfer->tx = tx;
    tx->outgoingTransfer = outgoingTransfer;
    uint64_t change = pd.m_change == (uint64_t)-1 ? 0 : pd.m_change; // change may not be known
    outgoingTransfer->amount = pd.m_amount_in - change - *tx->fee;
    outgoingTransfer->accountIndex = pd.m_subaddr_account;
    vector<uint32_t> subaddressIndices;
    vector<string> addresses;
    for (uint32_t i: pd.m_subaddr_indices) {
      subaddressIndices.push_back(i);
      addresses.push_back(wallet2->get_subaddress_as_str({pd.m_subaddr_account, i}));
    }
    outgoingTransfer->subaddressIndices = subaddressIndices;
    outgoingTransfer->addresses = addresses;

    // initialize destinations
    for (const auto &d: pd.m_dests) {
      shared_ptr<MoneroDestination> destination = shared_ptr<MoneroDestination>(new MoneroDestination());
      destination->amount = d.amount;
      destination->address = d.original.empty() ? cryptonote::get_account_address_as_str(wallet2->nettype(), d.is_subaddress, d.addr) : d.original;
      outgoingTransfer->destinations.push_back(destination);
    }

    // replace transfer amount with destination sum
    // TODO monero core: confirmed tx from/to same account has amount 0 but cached transfer destinations
    if (*outgoingTransfer->amount == 0 && !outgoingTransfer->destinations.empty()) {
      uint64_t amount = 0;
      for (const shared_ptr<MoneroDestination>& destination : outgoingTransfer->destinations) amount += *destination->amount;
      outgoingTransfer->amount = amount;
    }

    // compute numSuggestedConfirmations  TODO monero core: this logic is based on wallet_rpc_server.cpp:87 but it should be encapsulated in wallet2
    uint64_t blockReward = wallet2->get_last_block_reward();
    if (blockReward == 0) outgoingTransfer->numSuggestedConfirmations = 0;
    else outgoingTransfer->numSuggestedConfirmations = (*outgoingTransfer->amount + blockReward - 1) / blockReward;

    // return pointer to new tx
    return tx;
  }

  shared_ptr<MoneroTxWallet> MoneroWallet::buildTxWithIncomingTransferUnconfirmed(const crypto::hash &payment_id, const tools::wallet2::pool_payment_details &ppd) const {
    //cout << "buildTxWithIncomingTransferUnconfirmed()" << endl;

    // construct tx
    const tools::wallet2::payment_details &pd = ppd.m_pd;
    shared_ptr<MoneroTxWallet> tx = shared_ptr<MoneroTxWallet>(new MoneroTxWallet());
    tx->id = string_tools::pod_to_hex(pd.m_tx_hash);
    tx->paymentId = string_tools::pod_to_hex(payment_id);
    if (tx->paymentId->substr(16).find_first_not_of('0') == std::string::npos) tx->paymentId = tx->paymentId->substr(0, 16);  // TODO monero core: this should be part of core wallet
    if (tx->paymentId == MoneroTx::DEFAULT_PAYMENT_ID) tx->paymentId = boost::none;  // clear default payment id
    tx->unlockTime = pd.m_unlock_time;
    tx->fee = pd.m_fee;
    tx->note = wallet2->get_tx_note(pd.m_tx_hash);
    if (tx->note->empty()) tx->note = boost::none; // clear empty note
    tx->isCoinbase = false;
    tx->isConfirmed = false;
    tx->isFailed = false;
    tx->isRelayed = true;
    tx->inTxPool = true;
    tx->doNotRelay = false;
    tx->isDoubleSpend = ppd.m_double_spend_seen;
    tx->numConfirmations = 0;

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

  shared_ptr<MoneroTxWallet> MoneroWallet::buildTxWithOutgoingTransferUnconfirmed(const crypto::hash &txid, const tools::wallet2::unconfirmed_transfer_details &pd) const {
    //cout << "buildTxWithOutgoingTransferUnconfirmed()" << endl;

    // construct tx
    shared_ptr<MoneroTxWallet> tx = shared_ptr<MoneroTxWallet>(new MoneroTxWallet());
    tx->isFailed = pd.m_state == tools::wallet2::unconfirmed_transfer_details::failed;
    tx->id = string_tools::pod_to_hex(txid);
    tx->paymentId = string_tools::pod_to_hex(pd.m_payment_id);
    if (tx->paymentId->substr(16).find_first_not_of('0') == std::string::npos) tx->paymentId = tx->paymentId->substr(0, 16);  // TODO monero core: this should be part of core wallet
    if (tx->paymentId == MoneroTx::DEFAULT_PAYMENT_ID) tx->paymentId = boost::none;  // clear default payment id
    tx->unlockTime = pd.m_tx.unlock_time;
    tx->fee = pd.m_amount_in - pd.m_amount_out;
    tx->note = wallet2->get_tx_note(txid);
    if (tx->note->empty()) tx->note = boost::none; // clear empty note
    tx->isCoinbase = false;
    tx->isConfirmed = false;
    tx->isRelayed = !tx->isFailed.get();
    tx->inTxPool = !tx->isFailed.get();
    tx->doNotRelay = false;
    if (!tx->isFailed.get() && tx->isRelayed.get()) tx->isDoubleSpend = false;  // TODO: test and handle if true
    tx->numConfirmations = 0;

    // construct transfer
    shared_ptr<MoneroOutgoingTransfer> outgoingTransfer = shared_ptr<MoneroOutgoingTransfer>(new MoneroOutgoingTransfer());
    outgoingTransfer->tx = tx;
    tx->outgoingTransfer = outgoingTransfer;
    outgoingTransfer->amount = pd.m_amount_in - pd.m_change - tx->fee.get();
    outgoingTransfer->accountIndex = pd.m_subaddr_account;
    vector<uint32_t> subaddressIndices;
    vector<string> addresses;
    for (uint32_t i: pd.m_subaddr_indices) {
      subaddressIndices.push_back(i);
      addresses.push_back(wallet2->get_subaddress_as_str({pd.m_subaddr_account, i}));
    }
    outgoingTransfer->subaddressIndices = subaddressIndices;
    outgoingTransfer->addresses = addresses;

    // initialize destinations
    for (const auto &d: pd.m_dests) {
      shared_ptr<MoneroDestination> destination = shared_ptr<MoneroDestination>(new MoneroDestination());
      destination->amount = d.amount;
      destination->address = d.original.empty() ? cryptonote::get_account_address_as_str(wallet2->nettype(), d.is_subaddress, d.addr) : d.original;
      outgoingTransfer->destinations.push_back(destination);
    }

    // replace transfer amount with destination sum
    // TODO monero core: confirmed tx from/to same account has amount 0 but cached transfer destinations
    if (*outgoingTransfer->amount == 0 && !outgoingTransfer->destinations.empty()) {
      uint64_t amount = 0;
      for (const shared_ptr<MoneroDestination>& destination : outgoingTransfer->destinations) amount += *destination->amount;
      outgoingTransfer->amount = amount;
    }

    // compute numSuggestedConfirmations  TODO monero core: this logic is based on wallet_rpc_server.cpp:87 but it should be encapsulated in wallet2
    uint64_t blockReward = wallet2->get_last_block_reward();
    if (blockReward == 0) outgoingTransfer->numSuggestedConfirmations = 0;
    else outgoingTransfer->numSuggestedConfirmations = (*outgoingTransfer->amount + blockReward - 1) / blockReward;

    // return pointer to new tx
    return tx;
  }

  shared_ptr<MoneroTxWallet> MoneroWallet::buildTxWithVout(const tools::wallet2::transfer_details& td) const {

    // construct block
    shared_ptr<MoneroBlock> block = shared_ptr<MoneroBlock>(new MoneroBlock());
    block->height = td.m_block_height;

    // construct tx
    shared_ptr<MoneroTxWallet> tx = shared_ptr<MoneroTxWallet>(new MoneroTxWallet());
    tx->block = block;
    block->txs.push_back(tx);
    tx->id = epee::string_tools::pod_to_hex(td.m_txid);
    tx->isConfirmed = true;
    tx->isFailed = false;
    tx->isRelayed = true;
    tx->inTxPool = false;
    tx->doNotRelay = false;
    tx->isDoubleSpend = false;

    // construct vout
    shared_ptr<MoneroOutputWallet> vout = shared_ptr<MoneroOutputWallet>(new MoneroOutputWallet());
    vout->tx = tx;
    tx->vouts.push_back(vout);
    vout->amount = td.amount();
    vout->index = td.m_global_output_index;
    vout->accountIndex = td.m_subaddr_index.major;
    vout->subaddressIndex = td.m_subaddr_index.minor;
    vout->isSpent = td.m_spent;
    vout->isUnlocked = wallet2->is_transfer_unlocked(td);
    vout->isFrozen = td.m_frozen;
    if (td.m_key_image_known) {
      vout->keyImage = shared_ptr<MoneroKeyImage>(new MoneroKeyImage());
      vout->keyImage.get()->hex = epee::string_tools::pod_to_hex(td.m_key_image);
    }

    // return pointer to new tx
    return tx;
  }
}
