#include "include_base_utils.h"
#include "common/util.h"

using namespace std;

/**
 * Public interface for libmonero library.
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
    //MoneroRpcConnection() : uri(""), username(""), password("")) {}
    MoneroRpcConnection(const string& uri = "", const string& username = "", const epee::wipeable_string& password = epee::wipeable_string()) : uri(uri), username(username), password(password) {}
    const string& uri;
    const string& username;
    const epee::wipeable_string& password;
  };
}
