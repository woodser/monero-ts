#include "MoneroWallet.h"

#include "utils/MoneroUtils.h"
#include <stdio.h>
#include <iostream>
#include "mnemonics/electrum-words.h"
#include "mnemonics/english.h"
#include "wallet/wallet_rpc_server_commands_defs.h"

using namespace std;
using namespace cryptonote;
using namespace epee;
using namespace tools;

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
   * These functions are duplicated from private dependencies in wallet rpc
   * on_transfer/on_transfer_split, with minor modifications to not be class members.
   *
   * This code is used to generate and send transactions with equivalent functionality as
   * wallet rpc.
   *
   * Code duplication is not desired.  Solutions considered:
   *
   * (1) Duplicate wallet rpc code as done here.
   * (2) Modify monero-wallet-rpc on_transfer() / on_transfer_split() to be public.
   * (3) Modify monero-wallet-rpc to make this class a friend.
   * (4) Move all logic in monero-wallet-rpc to wallet2 so all users can access.
   *
   * Options 2-4 require modification of Monero Core C++.  Of those, (4) is probably ideal.
   * TODO: open patch on Monero core which moves common wallet rpc logic (e.g. on_transfer, on_transfer_split) to wallet2.
   *
   * Until then, option (1) is used because it allows the official Monero binaries to be used without modification and
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
  //------------------------------------------------------------------------------------------------------------------------------
//  bool on_transfer(wallet2* wallet2, const wallet_rpc::COMMAND_RPC_TRANSFER::request& req, wallet_rpc::COMMAND_RPC_TRANSFER::response& res, epee::json_rpc::error& er)
//  {
//
//    std::vector<cryptonote::tx_destination_entry> dsts;
//    std::vector<uint8_t> extra;
//
//
//    // validate the transfer requested and populate dsts & extra
//    if (!validate_transfer(wallet2, req.destinations, req.payment_id, dsts, extra, true, er))
//    {
//      return false;
//    }
//
//    try
//    {
//      uint64_t mixin = wallet2->adjust_mixin(req.ring_size ? req.ring_size - 1 : 0);
//      uint32_t priority = wallet2->adjust_priority(req.priority);
//      std::vector<wallet2::pending_tx> ptx_vector = wallet2->create_transactions_2(dsts, mixin, req.unlock_time, priority, extra, req.account_index, req.subaddr_indices);
//
//      if (ptx_vector.empty())
//      {
//        er.code = WALLET_RPC_ERROR_CODE_TX_NOT_POSSIBLE;
//        er.message = "No transaction created";
//        return false;
//      }
//
//      // reject proposed transactions if there are more than one.  see on_transfer_split below.
//      if (ptx_vector.size() != 1)
//      {
//        er.code = WALLET_RPC_ERROR_CODE_TX_TOO_LARGE;
//        er.message = "Transaction would be too large.  try /transfer_split.";
//        return false;
//      }
//
//      return fill_response(wallet2, ptx_vector, req.get_tx_key, res.tx_key, res.amount, res.fee, res.multisig_txset, res.unsigned_txset, req.do_not_relay,
//          res.tx_hash, req.get_tx_hex, res.tx_blob, req.get_tx_metadata, res.tx_metadata, er);
//    }
//    catch (const std::exception& e)
//    {
//      return false;
//    }
//    return true;
//  }
//  //------------------------------------------------------------------------------------------------------------------------------
//  bool on_transfer_split(wallet2* wallet2, const wallet_rpc::COMMAND_RPC_TRANSFER_SPLIT::request& req, wallet_rpc::COMMAND_RPC_TRANSFER_SPLIT::response& res, epee::json_rpc::error& er)
//  {
//
//    std::vector<cryptonote::tx_destination_entry> dsts;
//    std::vector<uint8_t> extra;
//
//    // validate the transfer requested and populate dsts & extra; RPC_TRANSFER::request and RPC_TRANSFER_SPLIT::request are identical types.
//    if (!validate_transfer(wallet2, req.destinations, req.payment_id, dsts, extra, true, er))
//    {
//      return false;
//    }
//
//    try
//    {
//      uint64_t mixin = wallet2->adjust_mixin(req.ring_size ? req.ring_size - 1 : 0);
//      uint32_t priority = wallet2->adjust_priority(req.priority);
//      std::vector<wallet2::pending_tx> ptx_vector = wallet2->create_transactions_2(dsts, mixin, req.unlock_time, priority, extra, req.account_index, req.subaddr_indices);
//
//      return fill_response(wallet2, ptx_vector, req.get_tx_keys, res.tx_key_list, res.amount_list, res.fee_list, res.multisig_txset, res.unsigned_txset, req.do_not_relay,
//          res.tx_hash_list, req.get_tx_hex, res.tx_blob_list, req.get_tx_metadata, res.tx_metadata_list, er);
//    }
//    catch (const std::exception& e)
//    {
//      return false;
//    }
//    return true;
//  }

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
      cout << "Wallet2Listener::on_money_spent()" << endl;
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
        tx->block.get()->txs.erase(std::remove(tx->block.get()->txs.begin(), tx->block.get()->txs.end(), tx), tx->block.get()->txs.end()); // TODO, no way to use txIter?
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
        shared_ptr<MoneroTxWallet> tx = buildTxWithIncomingTransfer(i->second.m_tx_hash, i->first, i->second);
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

    // get unconfirmed outgoing transfers
    if (isPending || isFailed) {
      //throw runtime_error("isPending || isFailed not implemented");
    }

    // get unconfirmed incoming transfers
    if (isPool) {
      //throw runtime_error("isPool not implemented");
    }

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

      // remove unrequested txs
      if (tx->outgoingTransfer == boost::none && tx->incomingTransfers.empty()) tx->block.get()->txs.erase(std::remove(tx->block.get()->txs.begin(), tx->block.get()->txs.end(), tx), tx->block.get()->txs.end()); // TODO, no way to use const_iterator?
    }
    //cout << "7" << endl;
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
      if (tx->vouts.empty()) tx->block.get()->txs.erase(std::remove(tx->block.get()->txs.begin(), tx->block.get()->txs.end(), tx), tx->block.get()->txs.end()); // TODO, no way to use const_iterator?
    }
    return vouts;
  }

  vector<shared_ptr<MoneroTxWallet>> MoneroWallet::sendTxs(const MoneroSendRequest& request) {
    cout << "MoneroWallet::sendTxs(request)" << endl;
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
      throw runtime_error("Need to handle sendTxs() validate_transfer error");  // TODO
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

//      if (ptx_vector.empty()) {
//        er.code = WALLET_RPC_ERROR_CODE_TX_NOT_POSSIBLE;
//        er.message = "No transaction created";
//        return false;
//      }
//
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
    cout << "Attempting to fill..." << endl;
    if (!fill_response(wallet2.get(), ptx_vector, getTxKeys, txKeys, txAmounts, txFees, multisigTxSet, unsignedTxSet, doNotRelay, txIds, getTxHex, txBlobs, getTxMetadata, txMetadatas, err)) {
      throw runtime_error("need to handle error filling response!");
    }
    cout << "Done filling!" << endl;

    // refresh wallet after committing txs
    //wallet2->rescan_blockchain(false);
//    wallet2->refresh(true);
//    sync();

    // build sent txs from results
    vector<shared_ptr<MoneroTxWallet>> txs;
    auto txIdsIter = txIds.begin();
    auto txKeysIter = txKeys.begin();
    auto txAmountsIter = txAmounts.begin();
    auto txFeesIter = txFees.begin();
    auto txBlobsIter = txBlobs.begin();
    auto txMetadatasIter = txMetadatas.begin();
    while (txIdsIter != txIds.end()) {

      // transfer filled values
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

      // init common sent tx fields
      tx->isConfirmed = false;
      tx->isCoinbase = false;
      tx->isFailed = false;
      tx->isDoubleSpend = false;
      tx->doNotRelay = request.doNotRelay != boost::none && request.doNotRelay.get() == true;
      tx->isRelayed = tx->doNotRelay.get() != true;
      tx->inTxPool = !tx->doNotRelay.get();
      tx->numConfirmations = 0;
      tx->mixin = request.mixin;
      tx->unlockTime = request.unlockTime == boost::none ? 0 : request.unlockTime.get();

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

  shared_ptr<MoneroTxWallet> MoneroWallet::buildTxWithIncomingTransfer(const crypto::hash &txid, const crypto::hash &payment_id, const tools::wallet2::payment_details &pd) const {
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
