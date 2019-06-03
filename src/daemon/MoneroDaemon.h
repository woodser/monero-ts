#include "include_base_utils.h"
#include "common/util.h"

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
  struct MoneroTx;

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
  };

  /**
   * Models a Monero block in the blockchain.
   */
  struct MoneroBlock : public MoneroBlockHeader {
    string hex;
    MoneroTx* coinbaseTx;
    vector<MoneroTx> txs;
    vector<string> txIds;
  };

  /**
   * Models a Monero key image.
   */
  struct MoneroKeyImage {
    string hex;
    string signature;
  };

  /**
   * Models a Monero transaction output.
   */
  struct MoneroOutput {
    MoneroTx* tx;
    MoneroKeyImage* keyImage;
    uint64_t amount;
    uint32_t index;
    vector<uint32_t> ringOutputIndices;
    string stealthPublicKey;
  };

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
    //uint32_t* extra[];    // TODO: flexible member?
    string rctSignatures;   // TODO: implement
    string rctSigPrunable;  // TODO: implement
    bool isKeptByBlock;
    bool isFailed;
    uint32_t lastFailedHeight;
    string lastFailedId;
    uint32_t maxUsedBlockHeight;
    string maxUsedBlockId;
    vector<string> signatures;
  };
}
