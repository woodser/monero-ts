#include "MoneroDaemon.h"

#include "utils/MoneroUtils.h"
#include "include_base_utils.h"
#include "common/util.h"

/**
 * Public interface for libmonero-cpp library.
 */
namespace monero {

  // -------------------------- MODEL SERIALIZATION ---------------------------

  string SerializableStruct::serialize() const {
    boost::property_tree::ptree node;
    toPropertyTree(node);
    return MoneroUtils::serialize(node);
  }

  void MoneroTx::toPropertyTree(boost::property_tree::ptree& node) const {
    throw runtime_error("Not implemented");
  }

  // ---------------------------- PRIVATE HELPERS -----------------------------

}
