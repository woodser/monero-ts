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
   *
   * TODO: shared_ptr<string>?
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
    shared_ptr<MoneroBlock> block;
    shared_ptr<string> id;
    shared_ptr<string> version;
    shared_ptr<bool> isCoinbase;
    shared_ptr<string> paymentId;
    shared_ptr<uint64_t> fee;
    shared_ptr<uint32_t> mixin;
    shared_ptr<bool> doNotRelay;
    shared_ptr<bool> isRelayed;
    shared_ptr<bool> isConfirmed;
    shared_ptr<bool> inTxPool;
    shared_ptr<uint64_t> numConfirmations;
    shared_ptr<uint64_t> unlockTime;
    shared_ptr<uint64_t> lastRelayedTimestamp;
    shared_ptr<uint64_t> receivedTimestamp;
    shared_ptr<bool> isDoubleSpend;
    shared_ptr<string> key;
    shared_ptr<string> fullHex;
    shared_ptr<string> prunedHex;
    shared_ptr<string> prunableHex;
    shared_ptr<string> prunableHash;
    shared_ptr<uint32_t> size;
    shared_ptr<uint32_t> weight;
    vector<MoneroOutput> vins;
    vector<MoneroOutput> vouts;
    vector<uint32_t> outputIndices;
    shared_ptr<string> metadata;
    shared_ptr<string> commonTxSets;
    vector<uint32_t> extra;
    shared_ptr<string> rctSignatures;   // TODO: implement
    shared_ptr<string> rctSigPrunable;  // TODO: implement
    shared_ptr<bool> isKeptByBlock;
    shared_ptr<bool> isFailed;
    shared_ptr<uint32_t> lastFailedHeight;
    shared_ptr<string> lastFailedId;
    shared_ptr<uint32_t> maxUsedBlockHeight;
    shared_ptr<string> maxUsedBlockId;
    vector<string> signatures;
  };

  /**
   * Models a Monero block header which contains information about the block.
   */
  struct MoneroBlockHeader {
    shared_ptr<string> id;
    shared_ptr<uint64_t> height;
    shared_ptr<uint64_t> timestamp;
    shared_ptr<uint64_t> size;
    shared_ptr<uint64_t> weight;
    shared_ptr<uint64_t> longTermWeight;
    shared_ptr<uint64_t> depth;
    shared_ptr<uint64_t> difficulty;
    shared_ptr<uint64_t> cumulativeDifficulty;
    shared_ptr<uint32_t> majorVersion;
    shared_ptr<uint32_t> minorVersion;
    shared_ptr<uint64_t> nonce;
    shared_ptr<string> coinbaseTxId;
    shared_ptr<uint32_t> numTxs;
    shared_ptr<bool> orphanStatus;
    shared_ptr<string> prevId;
    shared_ptr<uint64_t> reward;
  };

  /**
   * Models a Monero block in the blockchain.
   */
  struct MoneroBlock : public MoneroBlockHeader {
    shared_ptr<string> hex;
    shared_ptr<MoneroTx> coinbaseTx;
    vector<MoneroTx> txs;
    vector<string> txIds;
  };

  /**
   * Models a Monero key image.
   */
  struct MoneroKeyImage {
    shared_ptr<string> hex;
    shared_ptr<string> signature;
  };

  /**
   * Models a Monero transaction output.
   */
  struct MoneroOutput {
    shared_ptr<MoneroTx> tx;
    shared_ptr<MoneroKeyImage> keyImage;
    shared_ptr<uint64_t> amount;
    shared_ptr<uint32_t> index;
    vector<uint32_t> ringOutputIndices;
    shared_ptr<string> stealthPublicKey;
  };
}
