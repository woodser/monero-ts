#include <emscripten.h>
#include <emscripten/fetch.h>
#include <iostream>
#include "http_client_wasm.h"

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

EM_JS(int, do_fetch, (const char* str), {
  const text = UTF8ToString(str);

  return Asyncify.handleSleep(function(wakeUp) {
    console.log("do_fetch(" + text + ")");

    let config = {
        protocol: "http",
        host: "localhost",
        port: 38081,
        user: "superuser",
        pass: "abctesting123",
        maxRequestsPerSecond: 50
    };
    let rpc = new MoneroRpcConnection(config);

    console.log("waiting for a fetch");
    rpc.sendJsonRequest("get_info").then(resp => {
      console.log("Got response");
      console.log(resp);
      console.log(JSON.stringify(resp));
      wakeUp(2);
    });
  });
});

void downloadSucceeded(emscripten_fetch_t *fetch) {
  printf("Finished downloading %llu bytes from URL %s.\n", fetch->numBytes, fetch->url);
  // The data is now available at fetch->data[0] through fetch->data[fetch->numBytes-1];
  emscripten_fetch_close(fetch); // Free data associated with the fetch.
}

void downloadFailed(emscripten_fetch_t *fetch) {
  printf("Downloading %s failed, HTTP failure status code: %d.\n", fetch->url, fetch->status);
  emscripten_fetch_close(fetch); // Also free data on failure.
}

bool http_client_wasm::invoke(const boost::string_ref uri, const boost::string_ref method, const std::string& body, std::chrono::milliseconds timeout, const http_response_info** ppresponse_info, const fields_list& additional_params) {
  cout << "invoke(" << uri << ", " << method << ", " << body << ")" << endl;

//  emscripten_fetch_attr_t attr;
//  emscripten_fetch_attr_init(&attr);
//  strcpy(attr.requestMethod, "POST");
//  const char * headers[] = {"Content-Type", "application/json", 0};
//  attr.requestHeaders = headers;
//  attr.requestData = "key1=var1&key2=var2&key3=var3";
//  attr.requestDataSize = strlen(attr.requestData);
//  attr.withCredentials = true;
//  attr.userName = "superuser";
//  attr.password = "abctesting123";
//  //attr.attributes = EMSCRIPTEN_FETCH_LOAD_TO_MEMORY;
//  //attr.attributes = EMSCRIPTEN_FETCH_SYNCHRONOUS | EMSCRIPTEN_FETCH_REPLACE;
//  attr.onsuccess = downloadSucceeded;
//  attr.onerror = downloadFailed;
//  cout << "sending emscripten fetch" << endl;
//  emscripten_fetch_t *fetch = emscripten_fetch(&attr, "http://localhost:38081/json_rpc");
//  cout << "returned from emscripten fetch" << endl;

  cout << "HTTP client starting sleep" << endl;
  emscripten_sleep(5000);
  cout << "Done sleeping" << endl;


//  EMSCRIPTEN_RESULT ret = EMSCRIPTEN_RESULT_TIMED_OUT;
//    while(ret == EMSCRIPTEN_RESULT_TIMED_OUT) {
//      /* possibly do some other work; */
//      ret = emscripten_fetch_wait(fetch, 0/*milliseconds to wait, 0 to just poll, INFINITY=wait until completion*/);
//    }

//  if (fetch->status == 200) {
//    printf("Finished downloading %llu bytes from URL %s.\n", fetch->numBytes, fetch->url);
//    // The data is now available at fetch->data[0] through fetch->data[fetch->numBytes-1];
//  } else {
//    printf("Downloading %s failed ... HTTP failure status code: %d.\n", fetch->url, fetch->status);
//  }
//  emscripten_fetch_close(fetch);
//  cout << "Done closing fetch" << endl;
//
//  cout << "Done invoking emscripten fetch?" << endl;

  const char* myStr = "hello there";
  int resp = do_fetch(myStr);
  cout << "Received response from do_fetch():\n" << resp << endl;
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
