#include <iostream>
#include "monero_utils_wasm_bridge.h"
#include "utils/monero_utils.h"

using namespace std;
using namespace monero_utils_wasm_bridge;

void monero_utils_wasm_bridge::utils_dummy_method() {
  cout << "monero_utils_wasm_bridge::utils_dummy_method()" << endl;
}

string monero_utils_wasm_bridge::malloc_binary_from_json(const std::string &buff_json)
{
  // convert json to binary string
  string buff_bin;
  monero_utils::json_to_binary(buff_json, buff_bin);

  // copy binary string to heap and keep pointer
  std::string* ptr = new std::string(buff_bin.c_str(), buff_bin.length());

  // create object with binary string memory address info
  boost::property_tree::ptree root;
  root.put("ptr", reinterpret_cast<intptr_t>(ptr->c_str()));
  root.put("length", ptr->length());

  // serlialize memory info to json str
  return monero_utils::serialize(root); // TODO: move this utility to gen_utils?
}

string monero_utils_wasm_bridge::binary_to_json(const std::string &bin_mem_info_str)
{
  // deserialize memory address info to json
  boost::property_tree::ptree root;
  monero_utils::deserialize(bin_mem_info_str, root);

  // get ptr and length of binary data
  char* ptr = (char*) root.get<int>("ptr"); // TODO: reinterpret_cast<intptr_t>?
  int length = root.get<int>("length");

  // read binary
  std::string buff_bin(ptr, length);

  // convert binary to json and return
  std::string buff_json;
  monero_utils::binary_to_json(buff_bin, buff_json);
  return buff_json;
}

string monero_utils_wasm_bridge::binary_blocks_to_json(const std::string &bin_mem_info_str)
{
  // deserialize memory address info to json
  boost::property_tree::ptree root;
  monero_utils::deserialize(bin_mem_info_str, root);

  // get ptr and length of binary data
  char* ptr = (char*) root.get<int>("ptr"); // TODO: reinterpret_cast<intptr_t>?
  int length = root.get<int>("length");

  // read binary
  std::string buff_bin(ptr, length);

  // convert binary to json and return
  std::string buff_json;
  monero_utils::binary_blocks_to_json(buff_bin, buff_json);
  return buff_json;
}
