#ifndef MoneroUtils_h
#define MoneroUtils_h

#include "wallet/MoneroWallet.h"
#include "cryptonote_basic/cryptonote_basic.h"
#include "serialization/keyvalue_serialization.h"	// TODO: consolidate with other binary deps?
#include "storages/portable_storage.h"

/**
 * Collection of utilities for working with Monero's binary portable storage format.
 */
namespace MoneroUtils
{
  using namespace std;
  using namespace cryptonote;

  void jsonToBinary(const std::string &json, std::string &bin);

  void binaryToJson(const std::string &bin, std::string &json);

  void binaryBlocksToJson(const std::string &bin, std::string &json);

//  void addNode(boost::property_tree::ptree root, const string& key, shared_ptr<void> ptr) {
//    cout << "addNode(...)" << endl;
//    throw runtime_error("Not implemented");
//  }
//
//  string serialize(const MoneroAccount& account);
//
//  string serialize(const MoneroSubaddress& subaddress);
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

  //  template <class T> string serialize(const vector<T> types) {
  //    cout << "serialize(types)" << endl;
  //    boost::property_tree::ptree root;
  //    boost::property_tree::ptree typesNode;
  //    for (const auto& type : types)  {
  //      boost::property_tree::ptree typeNode;
  //      typeNode.put("", serialize(type));
  //      typesNode.push_back(std::make_pair("", typeNode));
  //    }
  //    root.add_child("types", typesNode);
  //
  //    // serialize property tree to json
  //    std::stringstream ss;
  //    boost::property_tree::write_json(ss, root, false);
  //    string str = ss.str();
  //    return str;
  //  }

  string serialize(const boost::property_tree::ptree& node);

  //  // TODO: template implementation here, could move to MoneroUtils.hpp per https://stackoverflow.com/questions/3040480/c-template-function-compiles-in-header-but-not-implementation
  template <class T> boost::property_tree::ptree toPropertyTree(const vector<shared_ptr<T>> types) {
    //cout << "toPropertyTree(types)" << endl;
    boost::property_tree::ptree typeNodes;
    for (const auto& type : types)  {
      typeNodes.push_back(std::make_pair("", type->toPropertyTree()));
    }
    return typeNodes;
  }

  //  // TODO: template implementation here, could move to MoneroUtils.hpp per https://stackoverflow.com/questions/3040480/c-template-function-compiles-in-header-but-not-implementation
  template <class T> boost::property_tree::ptree toPropertyTree(const vector<T> types) {
    //cout << "toPropertyTree(types)" << endl;
    boost::property_tree::ptree typeNodes;
    for (const auto& type : types)  {
      typeNodes.push_back(std::make_pair("", type.toPropertyTree()));
    }
    return typeNodes;
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

  template <class T>
  boost::optional<T> reconcile(const boost::optional<T>& val1, const boost::optional<T>& val2, boost::optional<bool> resolveDefined, boost::optional<bool> resolveTrue, boost::optional<bool> resolveMax) {
    cout << "reconcile(" << val1 << ", " << val2 << ")" << endl;

    // check for equality
    if (val1 == val2) return val1;

    // resolve one value none
    if (val1 == boost::none || val2 == boost::none) {
      if (resolveDefined == false) return boost::none;  // TODO: boost::optional equality comparitor wokrs like this?
      else return val1 == boost::none ? val2 : val1;
    }

    // resolve different numbers
    if (resolveMax != boost::none) {
      return *resolveMax ? max(*val1, *val2) : min(*val1, *val2);
    }

    // throw runtime_error("Cannot reconcile values " + val1 + " and " + val2 + " with config: [" + resolveDefined + ", " + resolveTrue + ", " + resolveMax + "]", val1, val2);
    throw runtime_error("Cannot reconcile non-booleans");
  }

  template <class T>
  boost::optional<T> reconcile(const boost::optional<T>& val1, const boost::optional<T>& val2) {
    return reconcile(val1, val2, boost::none, boost::none, boost::none);
  }

  template <class T, typename std::enable_if<std::is_same<T, bool>::value, T>::type* = nullptr>
  boost::optional<bool> reconcile(const boost::optional<T>& val1, const boost::optional<T>& val2, boost::optional<bool> resolveDefined, boost::optional<bool> resolveTrue, boost::optional<bool> resolveMax) {
    cout << "reconcile(" << val1 << ", " << val2 << ")" << endl;

    // check for equality
    if (val1 == val2) return val1;

    // resolve one value none
    if (val1 == boost::none || val2 == boost::none) {
      if (resolveDefined == false) return boost::none;  // TODO: boost::optional equality comparitor wokrs like this?
      else return val1 == boost::none ? val2 : val1;
    }

    // resolve different booleans
    if (resolveTrue != boost::none) {
      return val1 == resolveTrue ? val1 : val2; // if resolve true, return true, else return false
    } else {
      throw runtime_error("Cannot reconcile boolean values");
    }

    throw runtime_error("Cannot reconcile booleans");
  }

  template <class T, typename std::enable_if<std::is_same<T, bool>::value, T>::type* = nullptr>
  boost::optional<bool> reconcile(const boost::optional<T>& val1, const boost::optional<T>& val2) {
    return reconcile(val1, val2, boost::none, boost::none, boost::none);
  }
}
#endif /* MoneroUtils_h */
