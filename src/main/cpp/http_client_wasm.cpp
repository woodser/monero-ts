#include "http_client_wasm.h"

void http_client_wasm::set_server(std::string host, std::string port, boost::optional<login> user) {
  throw runtime_error("http_client_wasm::set_server() not implemented");
}

void http_client_wasm::set_auto_connect(bool auto_connect) {
  throw runtime_error("http_client_wasm::set_auto_connect() not implemented");
}

bool http_client_wasm::connect(std::chrono::milliseconds timeout) {
  throw runtime_error("http_client_wasm::connect() not implemented");
}

bool http_client_wasm::disconnect() {
  throw runtime_error("http_client_wasm::disconnect() not implemented");
}

bool http_client_wasm::is_connected(bool *ssl) {
  throw runtime_error("http_client_wasm::is_connected() not implemented");
}

bool http_client_wasm::invoke(const boost::string_ref uri, const boost::string_ref method, const std::string& body, std::chrono::milliseconds timeout, const http_response_info** ppresponse_info, const fields_list& additional_params) {
  throw runtime_error("http_client_wasm::invoke() not implemented");
}

bool http_client_wasm::invoke_get(const boost::string_ref uri, std::chrono::milliseconds timeout, const std::string& body, const http_response_info** ppresponse_info, const fields_list& additional_params) {
  throw runtime_error("http_client_wasm::invoke_get() not implemented");
}

bool http_client_wasm::invoke_post(const boost::string_ref uri, const std::string& body, std::chrono::milliseconds timeout, const http_response_info** ppresponse_info, const fields_list& additional_params) {
  throw runtime_error("http_client_wasm::invoke_post() not implemented");
}

uint64_t http_client_wasm::get_bytes_sent() const {
  throw runtime_error("http_client_wasm::get_bytes_sent() not implemented");
}

uint64_t http_client_wasm::get_bytes_received() const {
  throw runtime_error("http_client_wasm::get_bytes_received() not implemented");
}
