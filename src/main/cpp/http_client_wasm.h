#ifndef http_client_wasm_h
#define http_client_wasm_h

#pragma once

#include "net/abstract_http_client.h"
#include <string>

using namespace std;
using namespace epee::net_utils::http;

/**
 * Implements an abstract_http_client using a WebAssembly bridge.
 */
class http_client_wasm : public epee::net_utils::http::abstract_http_client {

  void set_server(std::string host, std::string port, boost::optional<login> user);
  void set_auto_connect(bool auto_connect);
  bool connect(std::chrono::milliseconds timeout);
  bool disconnect();
  bool is_connected(bool *ssl = NULL);
  bool invoke(const boost::string_ref uri, const boost::string_ref method, const std::string& body, std::chrono::milliseconds timeout, const http_response_info** ppresponse_info = NULL, const fields_list& additional_params = fields_list());
  bool invoke_get(const boost::string_ref uri, std::chrono::milliseconds timeout, const std::string& body = std::string(), const http_response_info** ppresponse_info = NULL, const fields_list& additional_params = fields_list());
  bool invoke_post(const boost::string_ref uri, const std::string& body, std::chrono::milliseconds timeout, const http_response_info** ppresponse_info = NULL, const fields_list& additional_params = fields_list());
  uint64_t get_bytes_sent() const;
  uint64_t get_bytes_received() const;
};

#endif /* http_client_wasm_h */
