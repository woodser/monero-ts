#pragma once

#include "daemon/MoneroDaemonModel.h"

using namespace std;
using namespace monero;

/**
 * Public library interface.
 */
namespace monero {

  /**
   * Models a result of syncing a wallet.
   */
  struct MoneroSyncResult {
    uint64_t numBlocksFetched;
    bool receivedMoney;
    MoneroSyncResult() {}
    MoneroSyncResult(const uint64_t numBlocksFetched, const bool receivedMoney) : numBlocksFetched(numBlocksFetched), receivedMoney(receivedMoney) {}
  };

  /**
   * Models a Monero subaddress.
   */
  struct MoneroSubaddress : public SerializableStruct {
    boost::optional<uint32_t> accountIndex;
    boost::optional<uint32_t> index;
    boost::optional<string> address;
    boost::optional<string> label;
    boost::optional<uint64_t> balance;
    boost::optional<uint64_t> unlockedBalance;
    boost::optional<uint32_t> numUnspentOutputs;
    boost::optional<bool> isUsed;
    boost::optional<uint32_t> numBlocksToUnlock;
//    BEGIN_KV_SERIALIZE_MAP()
//      KV_SERIALIZE(accountIndex)
//      KV_SERIALIZE(index)
//      KV_SERIALIZE(address)
//      KV_SERIALIZE(label)
//      KV_SERIALIZE(balance)
//      KV_SERIALIZE(unlockedBalance)
//      KV_SERIALIZE(numUnspentOutputs)
//      KV_SERIALIZE(isUsed)
//      KV_SERIALIZE(numBlocksToUnlock)
//    END_KV_SERIALIZE_MAP()

    boost::property_tree::ptree toPropertyTree() const;
    //void merge(const shared_ptr<MoneroSubaddress>& self, const shared_ptr<MoneroSubaddress>& other);
  };

  /**
   * Models a Monero account.
   */
  struct MoneroAccount : public SerializableStruct {
    boost::optional<uint32_t> index;
    boost::optional<string> primaryAddress;
    boost::optional<string> label;
    boost::optional<uint64_t> balance;
    boost::optional<uint64_t> unlockedBalance;
    boost::optional<string> tag;
    vector<MoneroSubaddress> subaddresses;
//    BEGIN_KV_SERIALIZE_MAP()
//      KV_SERIALIZE(index)
//      KV_SERIALIZE(primaryAddress)
//      KV_SERIALIZE(label)
//      KV_SERIALIZE(balance)
//      KV_SERIALIZE(unlockedBalance)
//      KV_SERIALIZE(tag)
//      KV_SERIALIZE(subaddresses)
//    END_KV_SERIALIZE_MAP()

    boost::property_tree::ptree toPropertyTree() const;
  };

  // forward declarations
  struct MoneroTxWallet;
  struct MoneroTxRequest;

  /**
   * Models an outgoing transfer destination.
   */
  struct MoneroDestination {
    boost::optional<string> address;
    boost::optional<uint64_t> amount;
  };

  /**
   * Models a base transfer of funds to or from the wallet.
   */
  struct MoneroTransfer : SerializableStruct {
    shared_ptr<MoneroTx> tx;  // TODO *** switch to MoneroTxWallet ***
    boost::optional<bool> isIncoming;
    boost::optional<uint64_t> amount;
    boost::optional<uint32_t> accountIndex;
    boost::optional<uint32_t> numSuggestedConfirmations;

    boost::property_tree::ptree toPropertyTree() const;
    boost::optional<bool> getIsOutgoing() const {
      if (isIncoming == boost::none ) return boost::none;
      return !(*isIncoming);
    }
  };

  /**
   * Models an incoming transfer of funds to the wallet.
   */
  struct MoneroIncomingTransfer : public MoneroTransfer {
    boost::optional<uint32_t> subaddressIndex;
    boost::optional<string> address;

    boost::property_tree::ptree toPropertyTree() const;
  };

  /**
   * Models an outgoing transfer of funds from the wallet.
   */
  struct MoneroOutgoingTransfer : public MoneroTransfer {
    vector<uint32_t> subaddressIndices;
    vector<string> addresses;
    vector<shared_ptr<MoneroDestination>> destinations;

    boost::property_tree::ptree toPropertyTree() const;
  };

  /**
   * Models a Monero output with wallet extensions.
   */
  struct MoneroOutputWallet : public MoneroOutput {
    boost::optional<uint32_t> accountIndex;
    boost::optional<uint32_t> subaddressIndex;
    boost::optional<bool> isSpent;
    boost::optional<bool> isUnlocked;
    boost::optional<bool> isFrozen;
  };

  /**
   * Models a Monero transaction in the context of a wallet.
   */
  struct MoneroTxWallet : public MoneroTx {
    vector<shared_ptr<MoneroIncomingTransfer>> incomingTransfers;
    boost::optional<shared_ptr<MoneroOutgoingTransfer>> outgoingTransfer;
    boost::optional<string> note;

    boost::property_tree::ptree toPropertyTree() const;
  };

  /**
   * Configures a request to retrieve transfers.
   *
   * All transfers are returned except those that do not meet the criteria defined in this request.
   */
  struct MoneroTransferRequest : public MoneroTransfer {
    boost::optional<bool> isIncoming;
    boost::optional<string> address;
    vector<string> addresses;
    boost::optional<uint32_t> subaddressIndex;
    vector<uint32_t> subaddressIndices;
    vector<shared_ptr<MoneroDestination>> destinations;
    boost::optional<bool> hasDestinations;
    boost::optional<shared_ptr<MoneroTxRequest>> txRequest;
  };

  /**
   * Configures a request to retrieve transactions.
   *
   * All transactions are returned except those that do not meet the criteria defined in this request.
   */
  struct MoneroTxRequest : public MoneroTxWallet {
    boost::optional<bool> isOutgoing;
    boost::optional<bool> isIncoming;
    vector<string> txIds;
    boost::optional<bool> hasPaymentId;
    vector<string> paymentIds;
    boost::optional<uint64_t> minHeight;
    boost::optional<uint64_t> maxHeight;
    boost::optional<uint64_t> includeOutputs;
    boost::optional<shared_ptr<MoneroTransferRequest>> transferRequest;

    boost::optional<uint64_t> getHeight() { return block == boost::none ? boost::none : (*block)->height; }
    boost::property_tree::ptree toPropertyTree() const;
  };

  /**
   * Configures a request to retrieve wallet outputs (i.e. outputs that the wallet has or had the
   * ability to spend).
   *
   * All outputs are returned except those that do not meet the criteria defined in this request.
   */
  struct MoneroOutputRequest : public MoneroOutput {
    vector<uint32_t> subaddressIndices;
    boost::optional<shared_ptr<MoneroTxRequest>> txRequest;
  };
}
