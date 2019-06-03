#include "include_base_utils.h"
#include "common/util.h"
#include "wallet/wallet2.h" // TODO: this is imported so BEGIN_KV_SERIALIZE_MAP works; more precise import?

using namespace std;

/**
 * Public interface for libmonero-cpp library.
 */
namespace monero {

  /**
   * Enumerates Monero network types.
   */
  enum MoneroNetworkType : uint8_t {
      MAINNET = 0,
      TESTNET,
      STAGENET
  };

  /**
   * Models a connection to a daemon.
   */
  struct MoneroRpcConnection {
    string uri;
    string username;
    string password;
    //MoneroRpcConnection() : uri(""), username(""), password("")) {}
    MoneroRpcConnection(const string& uri = "", const string& username = "", const string& password = "") : uri(uri), username(username), password(password) {}
  };

  // forward declarations
  struct MoneroBlock;
  struct MoneroOutput;

  /**
   * Models a Monero transaction on the blockchain.
   */
  struct MoneroTx {
    MoneroBlock* block;
    string id;
    string version;
    bool isCoinbase;
    string paymentId;
    uint64_t fee;
    uint32_t mixin;
    bool doNotRelay;
    bool isRelayed;
    bool isConfirmed;
    bool inTxPool;
    uint64_t numConfirmations;
    uint64_t unlockTime;
    uint64_t lastRelayedTimestamp;
    uint64_t receivedTimestamp;
    bool isDoubleSpend;
    string key;
    string fullHex;
    string prunedHex;
    string prunableHex;
    string prunableHash;
    uint32_t size;
    uint32_t weight;
    vector<MoneroOutput> vins;
    vector<MoneroOutput> vouts;
    vector<uint32_t> outputIndices;
    string metadata;
    string commonTxSets;
    vector<uint32_t> extra;
    string rctSignatures;   // TODO: implement
    string rctSigPrunable;  // TODO: implement
    bool isKeptByBlock;
    bool isFailed;
    uint32_t lastFailedHeight;
    string lastFailedId;
    uint32_t maxUsedBlockHeight;
    string maxUsedBlockId;
    vector<string> signatures;

    BEGIN_KV_SERIALIZE_MAP()
      KV_SERIALIZE(id)
      KV_SERIALIZE(version)
      KV_SERIALIZE(isCoinbase)
      KV_SERIALIZE(paymentId)
      KV_SERIALIZE(fee)
      KV_SERIALIZE(mixin)
      KV_SERIALIZE(doNotRelay)
      KV_SERIALIZE(isRelayed)
      KV_SERIALIZE(isConfirmed)
      KV_SERIALIZE(inTxPool)
      KV_SERIALIZE(numConfirmations)
      KV_SERIALIZE(unlockTime)
      KV_SERIALIZE(lastRelayedTimestamp)
      KV_SERIALIZE(receivedTimestamp)
      KV_SERIALIZE(isDoubleSpend)
      KV_SERIALIZE(key)
      KV_SERIALIZE(fullHex)
      KV_SERIALIZE(prunedHex)
      KV_SERIALIZE(prunableHex)
      KV_SERIALIZE(prunableHash)
      KV_SERIALIZE(size)
      KV_SERIALIZE(weight)
      KV_SERIALIZE(vins)
      KV_SERIALIZE(vouts)
      KV_SERIALIZE(outputIndices)
      KV_SERIALIZE(metadata)
      KV_SERIALIZE(commonTxSets)
      KV_SERIALIZE(extra)
      KV_SERIALIZE(rctSignatures)
      KV_SERIALIZE(rctSigPrunable)
      KV_SERIALIZE(isKeptByBlock)
      KV_SERIALIZE(isFailed)
      KV_SERIALIZE(lastFailedHeight)
      KV_SERIALIZE(lastFailedId)
      KV_SERIALIZE(maxUsedBlockHeight)
      KV_SERIALIZE(maxUsedBlockId)
      KV_SERIALIZE(signatures)
    END_KV_SERIALIZE_MAP()
  };

  /**
   * Models a Monero block header which contains information about the block.
   */
  struct MoneroBlockHeader {
    string id;
    uint64_t height;
    uint64_t timestamp;
    uint64_t size;
    uint64_t weight;
    uint64_t longTermWeight;
    uint64_t depth;
    uint64_t difficulty;
    uint64_t cumulativeDifficulty;
    uint32_t majorVersion;
    uint32_t minorVersion;
    uint64_t nonce;
    string coinbaseTxId;
    uint32_t numTxs;
    bool orphanStatus;
    string prevId;
    uint64_t reward;

    BEGIN_KV_SERIALIZE_MAP()
      KV_SERIALIZE(id)
      KV_SERIALIZE(height)
      KV_SERIALIZE(timestamp)
      KV_SERIALIZE(size)
      KV_SERIALIZE(weight)
      KV_SERIALIZE(longTermWeight)
      KV_SERIALIZE(depth)
      KV_SERIALIZE(difficulty)
      KV_SERIALIZE(cumulativeDifficulty)
      KV_SERIALIZE(majorVersion)
      KV_SERIALIZE(minorVersion)
      KV_SERIALIZE(nonce)
      KV_SERIALIZE(coinbaseTxId)
      KV_SERIALIZE(numTxs)
      KV_SERIALIZE(orphanStatus)
      KV_SERIALIZE(prevId)
      KV_SERIALIZE(reward)
    END_KV_SERIALIZE_MAP()
  };

  /**
   * Models a Monero block in the blockchain.
   */
  struct MoneroBlock : public MoneroBlockHeader {
    string hex;
    MoneroTx coinbaseTx;
    vector<MoneroTx> txs;
    vector<string> txIds;

    BEGIN_KV_SERIALIZE_MAP()
      KV_SERIALIZE(hex)
      KV_SERIALIZE(coinbaseTx)
      KV_SERIALIZE(txs)
      KV_SERIALIZE(txIds)
    END_KV_SERIALIZE_MAP()
  };

  /**
   * Models a Monero key image.
   */
  struct MoneroKeyImage {
    string hex;
    string signature;

    BEGIN_KV_SERIALIZE_MAP()
      KV_SERIALIZE(hex)
      KV_SERIALIZE(signature)
    END_KV_SERIALIZE_MAP()
  };

  /**
   * Models a Monero transaction output.
   */
  struct MoneroOutput {
    MoneroTx* tx;
    MoneroKeyImage keyImage;
    uint64_t amount;
    uint32_t index;
    vector<uint32_t> ringOutputIndices;
    string stealthPublicKey;

    BEGIN_KV_SERIALIZE_MAP()
      KV_SERIALIZE(keyImage)
      KV_SERIALIZE(amount)
      KV_SERIALIZE(index)
      KV_SERIALIZE(ringOutputIndices)
      KV_SERIALIZE(stealthPublicKey)
    END_KV_SERIALIZE_MAP()
  };
}
