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
   * TODO: boost::optional<string>?
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
    boost::optional<shared_ptr<MoneroBlock>> block;
    boost::optional<string> id;
    boost::optional<string> version;
    boost::optional<bool> isCoinbase;
    boost::optional<string> paymentId;
    boost::optional<uint64_t> fee;
    boost::optional<uint32_t> mixin;
    boost::optional<bool> doNotRelay;
    boost::optional<bool> isRelayed;
    boost::optional<bool> isConfirmed;
    boost::optional<bool> inTxPool;
    boost::optional<uint64_t> numConfirmations;
    boost::optional<uint64_t> unlockTime;
    boost::optional<uint64_t> lastRelayedTimestamp;
    boost::optional<uint64_t> receivedTimestamp;
    boost::optional<bool> isDoubleSpend;
    boost::optional<string> key;
    boost::optional<string> fullHex;
    boost::optional<string> prunedHex;
    boost::optional<string> prunableHex;
    boost::optional<string> prunableHash;
    boost::optional<uint32_t> size;
    boost::optional<uint32_t> weight;
    vector<MoneroOutput> vins;
    vector<MoneroOutput> vouts;
    vector<uint32_t> outputIndices;
    boost::optional<string> metadata;
    boost::optional<string> commonTxSets;
    vector<uint32_t> extra;
    boost::optional<string> rctSignatures;   // TODO: implement
    boost::optional<string> rctSigPrunable;  // TODO: implement
    boost::optional<bool> isKeptByBlock;
    boost::optional<bool> isFailed;
    boost::optional<uint32_t> lastFailedHeight;
    boost::optional<string> lastFailedId;
    boost::optional<uint32_t> maxUsedBlockHeight;
    boost::optional<string> maxUsedBlockId;
    vector<string> signatures;
  };

  /**
   * Models a Monero block header which contains information about the block.
   */
  struct MoneroBlockHeader {
    boost::optional<string> id;
    boost::optional<uint64_t> height;
    boost::optional<uint64_t> timestamp;
    boost::optional<uint64_t> size;
    boost::optional<uint64_t> weight;
    boost::optional<uint64_t> longTermWeight;
    boost::optional<uint64_t> depth;
    boost::optional<uint64_t> difficulty;
    boost::optional<uint64_t> cumulativeDifficulty;
    boost::optional<uint32_t> majorVersion;
    boost::optional<uint32_t> minorVersion;
    boost::optional<uint64_t> nonce;
    boost::optional<string> coinbaseTxId;
    boost::optional<uint32_t> numTxs;
    boost::optional<bool> orphanStatus;
    boost::optional<string> prevId;
    boost::optional<uint64_t> reward;
  };

  /**
   * Models a Monero block in the blockchain.
   */
  struct MoneroBlock : public MoneroBlockHeader {
    boost::optional<string> hex;
    boost::optional<MoneroTx> coinbaseTx;
    vector<MoneroTx> txs;
    vector<string> txIds;
  };

  /**
   * Models a Monero key image.
   */
  struct MoneroKeyImage {
    boost::optional<string> hex;
    boost::optional<string> signature;
  };

  /**
   * Models a Monero transaction output.
   */
  struct MoneroOutput {
    shared_ptr<MoneroTx> tx;
    boost::optional<MoneroKeyImage> keyImage;
    boost::optional<uint64_t> amount;
    boost::optional<uint32_t> index;
    vector<uint32_t> ringOutputIndices;
    boost::optional<string> stealthPublicKey;
  };
}

//// --------------------------- MODEL SERIALIZATION ----------------------------
//
//BOOST_CLASS_VERSION(monero::MoneroTx, 0)
//BOOST_CLASS_VERSION(monero::MoneroOutput, 0)
//BOOST_CLASS_VERSION(monero::MoneroKeyImage, 0)
//
//namespace boost {
//  namespace serialization {
//    template <class Archive>
//    inline void serialize(Archive &a, monero::MoneroTx& x, const boost::serialization::version_type ver)
//    {
////        a & x.m_L;
////        a & x.m_R;
//    }
//
//    template <class Archive>
//    inline void serialize(Archive &a, monero::MoneroOutput& x, const boost::serialization::version_type ver)
//    {
////        a & x.m_signer;
////        a & x.m_LR;
////        a & x.m_partial_key_images;
//    }
//
//    template <class Archive>
//    inline void serialize(Archive &a, monero::MoneroKeyImage& x, const boost::serialization::version_type ver)
//    {
////        a & x.m_signer;
////        a & x.m_LR;
////        a & x.m_partial_key_images;
//    }
//  } // namepsace serialization
//} // namespace boost
