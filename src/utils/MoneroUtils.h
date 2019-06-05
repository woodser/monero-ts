#ifndef MoneroUtils_h
#define MoneroUtils_h

#include "wallet/MoneroWallet.h"
#include "cryptonote_basic/cryptonote_basic.h"
#include "serialization/keyvalue_serialization.h"	// TODO: consolidate with other binary deps?
#include "storages/portable_storage.h"
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>

/**
 * Collection of utilities for working with Monero's binary portable storage format.
 */
namespace MoneroUtils
{
  using namespace std;
  using namespace boost;
  using namespace cryptonote;

  void jsonToBinary(const std::string &json, std::string &bin);

  void binaryToJson(const std::string &bin, std::string &json);

  void binaryBlocksToJson(const std::string &bin, std::string &json);

//  void addNode(boost::property_tree::ptree root, const string& key, shared_ptr<void> ptr) {
//    cout << "addNode(...)" << endl;
//    throw runtime_error("Not implemented");
//  }
//
  string serialize(const MoneroAccount& account);

  string serialize(const MoneroSubaddress& subaddress);
//
//  string serialize(const MoneroBlock& block);
//
//  void deserializeTx(const string& txStr, MoneroTx& tx);
//
//  void deserializeTxWallet(const string& txStr, MoneroTxWallet& tx);
//
//  void deserializeTxRequest(const string& txRequestStr, MoneroTxRequest& request);
//
//  void deserializeOutput(const string& outputStr, MoneroOutput& output);
//
//  void deserializeOutputWallet(const string& outputStr, MoneroOutputWallet& output);

  boost::property_tree::ptree toPropertyTree(const MoneroAccount& account);

  boost::property_tree::ptree toPropertyTree(const MoneroSubaddress& subaddress);

  void toModel(const boost::property_tree::ptree& node, MoneroTxWallet& tx);

  template <class T> boost::property_tree::ptree toPropertyTree(const vector<T> types) {
    cout << "toPropertyTree(types)" << endl;
    boost::property_tree::ptree typeNodes;
    for (const auto& type : types)  {
      typeNodes.push_back(std::make_pair("", toPropertyTree(type)));
    }
    return typeNodes;
  }

  // TODO: template implementation here, could move to MoneroUtils.hpp per https://stackoverflow.com/questions/3040480/c-template-function-compiles-in-header-but-not-implementation
  template <class T> string serialize(const vector<T> types) {
    cout << "serialize(types)" << endl;
    boost::property_tree::ptree root;
    boost::property_tree::ptree typesNode;
    for (const auto& type : types)  {
      boost::property_tree::ptree typeNode;
      typeNode.put("", serialize(type));
      typesNode.push_back(std::make_pair("", typeNode));
    }
    root.add_child("types", typesNode);

    // serialize property tree to json
    std::stringstream ss;
    boost::property_tree::write_json(ss, root, false);
    string str = ss.str();
    return str;
  }

  /**
   * Modified from core_rpc_server.cpp to return a string.
   *
   * TODO: remove this duplicate, use core_rpc_server instead
   */
  static std::string get_pruned_tx_json(cryptonote::transaction &tx)
  {
    std::stringstream ss;
    json_archive<true> ar(ss);
    bool r = tx.serialize_base(ar);
    CHECK_AND_ASSERT_MES(r, std::string(), "Failed to serialize rct signatures base");
    return ss.str();
  }
}
#endif /* MoneroUtils_h */
