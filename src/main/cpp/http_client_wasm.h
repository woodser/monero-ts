#ifndef http_client_wasm_h
#define http_client_wasm_h

#pragma once

#include "net/abstract_http_client.h"
#include <string>

using namespace std;
using namespace epee::net_utils::http;

namespace epee
{
  namespace net_utils
  {
    namespace http
    {
      /**
       * Implements an abstract_http_client using a WebAssembly bridge.
       */
      class http_client_wasm : public abstract_http_client
      {
      public:
        http_client_wasm() : m_login(boost::none), m_is_connected(false), m_response_info() {}
        ~http_client_wasm() {}
        void set_server(string host, string port, boost::optional<login> login) override;
        void set_auto_connect(bool auto_connect) override;
        bool connect(std::chrono::milliseconds timeout) override;
        bool disconnect() override;
        bool is_connected(bool *ssl = NULL) override;
        bool invoke(const boost::string_ref uri, const boost::string_ref method, const string& body, std::chrono::milliseconds timeout, const http_response_info** ppresponse_info = NULL, const fields_list& additional_params = fields_list()) override;
        bool invoke_get(const boost::string_ref uri, std::chrono::milliseconds timeout, const string& body = string(), const http_response_info** ppresponse_info = NULL, const fields_list& additional_params = fields_list()) override;
        bool invoke_post(const boost::string_ref uri, const string& body, std::chrono::milliseconds timeout, const http_response_info** ppresponse_info = NULL, const fields_list& additional_params = fields_list()) override;
        uint64_t get_bytes_sent() const override;
        uint64_t get_bytes_received() const override;

      private:
        string m_host;
        string m_port;
        boost::optional<login> m_login;
        bool m_is_connected;
        http_response_info m_response_info;

        bool invoke_json(const boost::string_ref uri, const boost::string_ref method, const std::string& body, std::chrono::milliseconds timeout, const http_response_info** ppresponse_info, const fields_list& additional_params);
        bool invoke_binary(const boost::string_ref uri, const boost::string_ref method, const std::string& body, std::chrono::milliseconds timeout, const http_response_info** ppresponse_info, const fields_list& additional_params);
      };
    }
  }
}

#endif /* http_client_wasm_h */
