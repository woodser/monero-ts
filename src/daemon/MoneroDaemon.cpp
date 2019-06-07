#include "utils/MoneroUtils.h"

#include <stdio.h>
#include <iostream>
#include "mnemonics/electrum-words.h"
#include "mnemonics/english.h"

using namespace cryptonote;
using namespace epee;

/**
 * Public interface for libmonero-cpp library.
 */
namespace monero {

  string SerializableStruct::serialize() {
    boost::property_tree::ptree node;
    toPropertyTree(node);
    return MoneroUtils::serialize(node);
  }

  // ---------------------------- PRIVATE HELPERS -----------------------------

}
