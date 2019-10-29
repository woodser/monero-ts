#include <iostream>
#include "http_client_wasm.h"
#include <emscripten.h>

using namespace std;

void http_client_wasm::set_server(std::string host, std::string port, boost::optional<login> user) {
  cout << "set_server()" << endl;
  throw runtime_error("http_client_wasm::set_server() not implemented");
}

void http_client_wasm::set_auto_connect(bool auto_connect) {
  cout << "set_auto_connect()" << endl;
  throw runtime_error("http_client_wasm::set_auto_connect() not implemented");
}

bool http_client_wasm::connect(std::chrono::milliseconds timeout) {
  cout << "connect()" << endl;
  throw runtime_error("http_client_wasm::connect() not implemented");
}

bool http_client_wasm::disconnect() {
  cout << "disconnect()" << endl;
  throw runtime_error("http_client_wasm::disconnect() not implemented");
}

bool http_client_wasm::is_connected(bool *ssl) {
  cout << "is_connected()" << endl;
  throw runtime_error("http_client_wasm::is_connected() not implemented");
}

//#ifdef __cplusplus
//extern "C" {
//#endif
//extern void testExternalJSMethod();
//#ifdef __cplusplus
//}
//#endif

EM_JS(void, call_alert, (), {
  console.log("call_alert()");

  let config = {
      protocol: "http",
      host: "localhost",
      port: 38081,
      user: "superuser",
      pass: "abctesting123",
      maxRequestsPerSecond: 50
  };
  let rpc = new MoneroRpcConnection(config);

  Asyncify.handleSleep(function(wakeUp) {
    console.log("waiting for a fetch");
    rpc.sendJsonRequest("get_info").then(resp => {
      console.log("Got response");
      console.log(resp);
      alert('hello world!');
      wakeUp(resp);
    });
  });

  //let resp = await rpc.sendJsonRequest("get_info");
  //console.log(resp);
  //MoneroDaemonRpc._checkResponseStatus(resp.result);
  //return MoneroDaemonRpc._convertRpcInfo(resp.result);
});

bool http_client_wasm::invoke(const boost::string_ref uri, const boost::string_ref method, const std::string& body, std::chrono::milliseconds timeout, const http_response_info** ppresponse_info, const fields_list& additional_params) {
  cout << "invoke(" << uri << ", " << method << ", " << body << ")" << endl;
  call_alert();
  throw runtime_error("http_client_wasm::invoke() not implemented");
}

bool http_client_wasm::invoke_get(const boost::string_ref uri, std::chrono::milliseconds timeout, const std::string& body, const http_response_info** ppresponse_info, const fields_list& additional_params) {
  cout << "invoke_get()" << endl;
  throw runtime_error("http_client_wasm::invoke_get() not implemented");
}

bool http_client_wasm::invoke_post(const boost::string_ref uri, const std::string& body, std::chrono::milliseconds timeout, const http_response_info** ppresponse_info, const fields_list& additional_params) {
  cout << "invoke_post()" << endl;
  throw runtime_error("http_client_wasm::invoke_post() not implemented");
}

uint64_t http_client_wasm::get_bytes_sent() const {
  cout << "get_bytes_sent()" << endl;
  throw runtime_error("http_client_wasm::get_bytes_sent() not implemented");
}

uint64_t http_client_wasm::get_bytes_received() const {
  cout << "get_bytes_received()" << endl;
  throw runtime_error("http_client_wasm::get_bytes_received() not implemented");
}
