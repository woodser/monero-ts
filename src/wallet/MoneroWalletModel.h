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

    boost::property_tree::ptree toPropertyTree() const;
  };

  /**
   * Models a base transfer of funds to or from the wallet.
   */
  struct MoneroTransfer : SerializableStruct {
    shared_ptr<MoneroTxWallet> tx;
    boost::optional<uint64_t> amount;
    boost::optional<uint32_t> accountIndex;
    boost::optional<uint32_t> numSuggestedConfirmations;

    virtual boost::optional<bool> getIsIncoming() const = 0;  // derived class must implement
    boost::optional<bool> getIsOutgoing() const {
			if (getIsIncoming() == boost::none) return boost::none;
      return !(*getIsIncoming());
    }
    boost::property_tree::ptree toPropertyTree() const;
    void merge(const shared_ptr<MoneroTransfer>& self, const shared_ptr<MoneroTransfer>& other);
  };

  /**
   * Models an incoming transfer of funds to the wallet.
   */
  struct MoneroIncomingTransfer : public MoneroTransfer {
    boost::optional<uint32_t> subaddressIndex;
    boost::optional<string> address;

    boost::optional<bool> getIsIncoming() const;
    boost::property_tree::ptree toPropertyTree() const;
    void merge(const shared_ptr<MoneroIncomingTransfer>& self, const shared_ptr<MoneroIncomingTransfer>& other);
  };

  /**
   * Models an outgoing transfer of funds from the wallet.
   */
  struct MoneroOutgoingTransfer : public MoneroTransfer {
    vector<uint32_t> subaddressIndices;
    vector<string> addresses;
    vector<shared_ptr<MoneroDestination>> destinations;

    boost::optional<bool> getIsIncoming() const;
    boost::property_tree::ptree toPropertyTree() const;
    void merge(const shared_ptr<MoneroOutgoingTransfer>& self, const shared_ptr<MoneroOutgoingTransfer>& other);
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

    boost::optional<bool> getIsIncoming() const;
    boost::property_tree::ptree toPropertyTree() const;
    bool meetsCriteria(MoneroTransfer* transfer) const;
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

    boost::property_tree::ptree toPropertyTree() const;
  };

  /**
   * Configures a request to retrieve wallet outputs (i.e. outputs that the wallet has or had the
   * ability to spend).
   *
   * All outputs are returned except those that do not meet the criteria defined in this request.
   */
  struct MoneroOutputRequest : public MoneroOutputWallet {
    vector<uint32_t> subaddressIndices;
    boost::optional<shared_ptr<MoneroTxRequest>> txRequest;

    boost::property_tree::ptree toPropertyTree() const;
    bool meetsCriteria(MoneroOutputWallet* output) const;
  };

  /**
   * Models a Monero transaction in the context of a wallet.
   */
  struct MoneroTxWallet : public MoneroTx {
    vector<shared_ptr<MoneroIncomingTransfer>> incomingTransfers;
    boost::optional<shared_ptr<MoneroOutgoingTransfer>> outgoingTransfer;
    boost::optional<string> note;

    bool getIsIncoming() const;
    bool getIsOutgoing() const;
    boost::property_tree::ptree toPropertyTree() const;
    void merge(const shared_ptr<MoneroTxWallet>& self, const shared_ptr<MoneroTxWallet>& other);
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
    boost::optional<shared_ptr<MoneroOutputRequest>> outputRequest;

    boost::property_tree::ptree toPropertyTree() const;
    bool meetsCriteria(MoneroTxWallet* tx) const;
  };

  /**
   * Monero integrated address model.
   */
  struct MoneroIntegratedAddress : public SerializableStruct {
    string standardAddress;
    string paymentId;
    string integratedAddress;

    boost::property_tree::ptree toPropertyTree() const;
  };

  /**
   * Enumerates Monero network types.
   */
  enum MoneroSendPriority : uint8_t {
    DEFAULT = 0,
    UNIMPORTANT,
    NORMAL,
    ELEVATED
  };

  /**
   * Configures a request to send/sweep funds or create a payment URI.
   *
   * TODO: allow setAddress(), setAmount() for default destination?
   */
  struct MoneroSendRequest : public SerializableStruct {
    vector<shared_ptr<MoneroDestination>> destinations;
    boost::optional<string> paymentId;
    boost::optional<MoneroSendPriority> priority;
    boost::optional<uint32_t> mixin;
    boost::optional<uint32_t> ringSize;
    boost::optional<uint64_t> fee;
    boost::optional<uint32_t> accountIndex;
    vector<uint32_t> subaddressIndices;
    boost::optional<uint64_t> unlockTime;
    boost::optional<bool> canSplit;
    boost::optional<bool> doNotRelay;
    boost::optional<string> note;
    boost::optional<string> recipientName;
    boost::optional<uint64_t> belowAmount;
    boost::optional<bool> sweepEachSubaddress;
    boost::optional<string> keyImage;

    boost::property_tree::ptree toPropertyTree() const;
  };

  /**
   * Models results from importing key images.
   */
  struct MoneroKeyImageImportResult : public SerializableStruct {
    boost::optional<uint64_t> height;
    boost::optional<uint64_t> spentAmount;
    boost::optional<uint64_t> unspentAmount;

    boost::property_tree::ptree toPropertyTree() const;
  };

  /**
   * Base class for results from checking a transaction or reserve proof.
   */
  struct MoneroCheck : public SerializableStruct {
    bool isGood;

    boost::property_tree::ptree toPropertyTree() const;
  };

  /**
   * Results from checking a transaction key.
   */
  struct MoneroCheckTx : public MoneroCheck {
    boost::optional<bool> inTxPool;
    boost::optional<uint64_t> numConfirmations;
    boost::optional<uint64_t> receivedAmount;

    boost::property_tree::ptree toPropertyTree() const;
  };

  /**
   * Results from checking a reserve proof.
   */
  struct MoneroCheckReserve : public MoneroCheck  {
    boost::optional<uint64_t> totalAmount;
    boost::optional<uint64_t> unconfirmedSpentAmount;

    boost::property_tree::ptree toPropertyTree() const;
  };
}
