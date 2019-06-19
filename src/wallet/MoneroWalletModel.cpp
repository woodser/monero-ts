#include "MoneroWallet.h"

#include "utils/MoneroUtils.h"
#include <stdio.h>
#include <iostream>

using namespace std;
using namespace cryptonote; // TODO: delete?
using namespace epee; // TODO: delete?

/**
 * Public library interface.
 */
namespace monero {

  // ----------------------- UNDECLARED PRIVATE HELPERS -----------------------


  // -------------------------- MODEL SERIALIZATION ---------------------------

  // TODO: ensure return object is not being unecessarily copied
  boost::property_tree::ptree MoneroAccount::toPropertyTree() const {
    //cout << "MoneroAccount::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node;
    if (index != boost::none) node.put("index", *index);
    if (primaryAddress != boost::none) node.put("primaryAddress", *primaryAddress);
    if (balance != boost::none) node.put("balance", *balance);
    if (unlockedBalance != boost::none) node.put("unlockedBalance", *unlockedBalance);
    if (!subaddresses.empty()) node.add_child("subaddresses", MoneroUtils::toPropertyTree(subaddresses));
//    if (!subaddresses.empty()) {
//      boost::property_tree::ptree subaddressesNode;
//      for (const MoneroSubaddress& subaddress : subaddresses) {
//        subaddressesNode.push_back(std::make_pair("", subaddress.toPropertyTree()));
//      }
//      node.add_child("subaddresses", subaddressesNode);
//    }
    return node;
  }

  boost::property_tree::ptree MoneroSubaddress::toPropertyTree() const {
    //cout << "MoneroSubaddress::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node;
    if (accountIndex != boost::none) node.put("accountIndex", *accountIndex);
    if (index != boost::none) node.put("index", *index);
    if (address != boost::none) node.put("address", *address);
    if (label != boost::none) node.put("label", *label);
    if (balance != boost::none) node.put("balance", *balance);
    if (unlockedBalance != boost::none) node.put("unlockedBalance", *unlockedBalance);
    if (numUnspentOutputs != boost::none) node.put("numUnspentOutputs", *numUnspentOutputs);
    if (isUsed != boost::none) node.put("isUsed", *isUsed);
    if (numBlocksToUnlock != boost::none) node.put("numBlocksToUnlock", *numBlocksToUnlock);
    return node;
  }

  boost::property_tree::ptree MoneroTxWallet::toPropertyTree() const {
    //cout << "MoneroTxWallet::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node = MoneroTx::toPropertyTree();
    if (!vouts.empty()) throw runtime_error("vouts not implemented");
    if (!incomingTransfers.empty()) node.add_child("incomingTransfers", MoneroUtils::toPropertyTree(incomingTransfers));
    if (outgoingTransfer != boost::none) throw runtime_error("outgoingTransfers not implemented");
    if (note != boost::none) node.put("note", *note);
    return node;
  }

  boost::property_tree::ptree MoneroTxRequest::toPropertyTree() const {
    //cout << "MoneroTxRequest::toPropertyTree(node)" << endl;
    throw runtime_error("Not implemented");
  }

  boost::property_tree::ptree MoneroTransfer::toPropertyTree() const {
    //cout << "MoneroTransfer::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node;
    if (amount != boost::none) node.put("amount", *amount);
    if (accountIndex != boost::none) node.put("accountIndex", *accountIndex);
    if (numSuggestedConfirmations != boost::none) node.put("numSuggestedConfirmations", *numSuggestedConfirmations);
    return node;
  }

  boost::property_tree::ptree MoneroIncomingTransfer::toPropertyTree() const {
    //cout << "MoneroIncomingTransfer::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node = MoneroTransfer::toPropertyTree();
    if (subaddressIndex != boost::none) node.put("subaddressIndex", *subaddressIndex);
    if (address != boost::none) node.put("address", *address);
    return node;
  }

  boost::property_tree::ptree MoneroOutgoingTransfer::toPropertyTree() const {
    //cout << "MoneroOutgoingTransfer::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node = MoneroTransfer::toPropertyTree();
    if (!subaddressIndices.empty()) throw runtime_error("subaddressIndices not implemented");
    if (!addresses.empty()) throw runtime_error("addresses not implemented");
    if (!destinations.empty()) throw runtime_error("destinations not implemented");
    return node;
  }

  // TODO: finish this
  boost::property_tree::ptree MoneroTransferRequest::toPropertyTree() const {
    //cout << "MoneroTransferRequest::toPropertyTree(node)" << endl;
    boost::property_tree::ptree node = MoneroTransfer::toPropertyTree();
    if (isIncoming != boost::none) node.put("isIncoming", *isIncoming);
    if (address != boost::none) node.put("address", *address);
    // TODO: handle addresses
    if (subaddressIndex != boost::none) node.put("subaddressIndex", *subaddressIndex);
    // TODO: handle subaddress indices
    // TODO: handle destinations
    if (hasDestinations != boost::none) node.put("hasDestinations", *hasDestinations);
    if (txRequest != boost::none) node.add_child("txRequest", (*txRequest)->toPropertyTree());
    return node;
  }

  //boost::property_tree::ptree MoneroUtils::txWalletToPropertyTree(const MoneroTxWallet& tx) {
  //  cout << "txWalletToPropertyTree(tx)" << endl;
  //  boost::property_tree::ptree txNode = txToPropertyTree(tx);
  //  if (!tx.vouts.empty()) throw runtime_error("not implemented");
  //  if (!tx.incomingTransfers.empty()) throw runtime_error("not implemented");
  //  if (tx.outgoingTransfer != boost::none) throw runtime_error("not implemented");
  //  if (tx.numSuggestedConfirmations != boost::none) txNode.put("numSuggestedConfirmations", *tx.numSuggestedConfirmations);
  //  if (tx.note != boost::none) txNode.put("note", *tx.note);
  //  return txNode;
  //}
  //
  //boost::property_tree::ptree MoneroUtils::txRequestToPropertyTree(const MoneroTxRequest& tx) {
  //  cout << "txWalletToPropertyTree(tx)" << endl;
  //  boost::property_tree::ptree txNode = txWalletToPropertyTree(tx);
  //  if (tx.isOutgoing != boost::none) txNode.put("isOutgoing", *tx.isOutgoing);
  //  if (tx.isIncoming != boost::none) txNode.put("isIncoming", *tx.isIncoming);
  //  if (!tx.txIds.empty()) throw runtime_error("not implemented");
  //  if (tx.hasPaymentId != boost::none) txNode.put("hasPaymentId", *tx.hasPaymentId);
  //  if (!tx.paymentIds.empty()) throw runtime_error("not implemented");
  //  if (tx.minHeight != boost::none) txNode.put("minHeight", *tx.minHeight);
  //  if (tx.maxHeight != boost::none) txNode.put("maxHeight", *tx.maxHeight);
  //  if (tx.includeOutputs != boost::none) txNode.put("includeOutputs", *tx.includeOutputs);
  //  if (tx.transferRequest != boost::none) throw runtime_error("not implemented");
  //  return txNode;
  //}

  // --------------------------------- REQUESTS -------------------------------

  bool MoneroTransferRequest::meetsCriteria(MoneroTransfer* transfer) const {
    //cout << "meetsCriteria()" << endl;

    // filter on common fields
    if (isIncoming != boost::none && *isIncoming != *transfer->isIncoming) return false;
    if (getIsOutgoing() != boost::none && *getIsOutgoing() != *transfer->getIsOutgoing()) return false;
    if (amount != boost::none && *amount != *transfer->amount) return false;
    if (accountIndex != boost::none && *accountIndex != *transfer->accountIndex) return false;

    // filter on incoming fields
    MoneroIncomingTransfer* inTransfer = dynamic_cast<MoneroIncomingTransfer*>(transfer);
    if (inTransfer != nullptr) {
      if (hasDestinations != boost::none) return false;
      if (address != boost::none && *address != *inTransfer->address) return false;
      if (!addresses.empty() && find(addresses.begin(), addresses.end(), *inTransfer->address) == addresses.end()) return false;
      if (subaddressIndex != boost::none && *subaddressIndex != *inTransfer->subaddressIndex) return false;
      if (!subaddressIndices.empty() && find(subaddressIndices.begin(), subaddressIndices.end(), *inTransfer->subaddressIndex) == subaddressIndices.end()) return false;
    }

    // filter on outgoing fields
    MoneroOutgoingTransfer* outTransfer = dynamic_cast<MoneroOutgoingTransfer*>(transfer);
    if (outTransfer != nullptr) {

      // filter on addresses
      if (address != boost::none && (outTransfer->addresses.empty() || find(outTransfer->addresses.begin(), outTransfer->addresses.end(), address) == outTransfer->addresses.end())) return false;   // TODO: will filter all transfers if they don't contain addresses
      if (!addresses.empty()) {
        bool intersects = false;
        for (const string& addressReq : addresses) {
          for (const string& address : outTransfer->addresses) {
            if (addressReq == address) {
              intersects = true;
              break;
            }
          }
        }
        if (!intersects) return false;  // must have overlapping addresses
      }

      // filter on subaddress indices
      if (subaddressIndex != boost::none && (outTransfer->subaddressIndices.empty() || find(outTransfer->subaddressIndices.begin(), outTransfer->subaddressIndices.end(), subaddressIndex) == outTransfer->subaddressIndices.end())) return false;   // TODO: will filter all transfers if they don't contain subaddress indices
      if (!subaddressIndices.empty()) {
        bool intersects = false;
        for (const uint32_t& subaddressIndexReq : subaddressIndices) {
          for (const uint32_t& subaddressIndex : outTransfer->subaddressIndices) {
            if (subaddressIndexReq == subaddressIndex) {
              intersects = true;
              break;
            }
          }
        }
        if (!intersects) return false;  // must have overlapping subaddress indices
      }

      // filter on having destinations
      if (hasDestinations != boost::none) {
        if (*hasDestinations && outTransfer->destinations.empty()) return false;
        if (!*hasDestinations && !outTransfer->destinations.empty()) return false;
      }

      // filter on destinations TODO: start with test for this
      //    if (this.getDestionations() != null && this.getDestionations() != transfer.getDestionations()) return false;
    }

    // validate type
    if (inTransfer == nullptr && outTransfer == nullptr) throw runtime_error("Transfer must be MoneroIncomingTransfer or MoneroOutgoingTransfer");

    // filter with tx filter
    //if (this.getTxRequest() != null && !this.getTxRequest().meetsCriteria(transfer.getTx())) return false;  // TODO
    return true;
  }
}
