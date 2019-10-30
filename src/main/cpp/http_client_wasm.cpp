#include <emscripten.h>
#include <emscripten/fetch.h>
#include <iostream>
#include "http_client_wasm.h"
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>

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

//EM_JS(const char*, do_fetch, (const char* str), {
//  const text = UTF8ToString(str);
//
//  return Asyncify.handleSleep(function(wakeUp) {
//    console.log("do_fetch(" + text + ")");
//
//    let config = {
//        protocol: "http",
//        host: "localhost",
//        port: 38081,
//        user: "superuser",
//        pass: "abctesting123",
//        maxRequestsPerSecond: 50
//    };
//    let rpc = new MoneroRpcConnection(config);
//
//    console.log("fetching");
//    rpc.sendJsonRequest("get_info").then(resp => {
//      console.log("Got response");
//      console.log(resp);
//      console.log(JSON.stringify(resp));
//
//      let respStr = JSON.stringify(resp);
//      let lengthBytes = Module.lengthBytesUTF8(respStr) + 1;
//      let ptr = Module._malloc(lengthBytes);
//      Module.stringToUTF8(respStr, ptr, lengthBytes);
//      wakeUp(ptr);
//    });
//  });
//});

EM_JS(const char*, do_fetch, (const char* uri, const char* method, const char* body, std::chrono::milliseconds timeout), {

  // use asyncify to synchronously return to C++
  return Asyncify.handleSleep(function(wakeUp) {

    const Http = require('http');
    const Request = require("request-promise");
    const PromiseThrottle = require("promise-throttle");

    // initialize promise throttler // TODO: use common
    this.promiseThrottle = new PromiseThrottle({
      requestsPerSecond: 500,
      promiseImplementation: Promise
    });

    // initialize http agent  // TODO: use common
    let agent = new Http.Agent({keepAlive: true, maxSockets: 1});

    // initialize request config // TODO: use set_server config
    this.config = {};
    this.config.user = "superuser";
    this.config.pass = "abctesting123";
    let fullUri = "http://localhost:38081" + UTF8ToString(uri);
    console.log("Full URI: " + fullUri);

    // build request which gets json response as text
    let opts = {
      method: "POST", // TODO: invoke() is passed "GET" which in incompatible with json_rpc?
      uri: fullUri,
      body: UTF8ToString(body),
      agent: agent,
      resolveWithFullResponse: true
    };
    if (this.config.user) {
      opts.forever = true;
      opts.auth = {
        user: this.config.user,
        pass: this.config.pass,
        sendImmediately: false
      }
    }

    console.log("Sending request with opts:");
    console.log(opts);

    console.log("Timeout: " + timeout); // TODO: use timeout

    /**
     * Makes a throttled request.
     *
     * TODO: move to common
     */
    function _throttledRequest(opts) {
      return this.promiseThrottle.add(function(opts) { return Request(opts); }.bind(this, opts));
    }

    // send throttled request
    console.log("fetching");
    _throttledRequest(opts).then(resp => {
      console.log("GOT RESPONSE!!!");
      console.log(resp);
      //console.log(JSON.stringify(resp));

      // replace 16 or more digits with strings and parse
      //resp = JSON.parse(resp.body.replace(/("[^"]*"\s*:\s*)(\d{16,})/g, '$1"$2"'));  // TODO: get this to compile in C++ or move to JS file

      // build response container
      let respContainer = {
        code: resp.statusCode,
        message: resp.statusMessage,
        body: resp.body,
        headers: resp.headers
      };

      // serialize response container to heap // TODO: more efficient way?
      let respStr = JSON.stringify(respContainer);
      let lengthBytes = Module.lengthBytesUTF8(respStr) + 1;
      let ptr = Module._malloc(lengthBytes);
      Module.stringToUTF8(respStr, ptr, lengthBytes);
      wakeUp(ptr);
    }).catch(err => {
       console.log("ERROR!!!");
       console.log(err);
       let str = err.message;
       let lengthBytes = Module.lengthBytesUTF8(str) + 1;
       let ptr = Module._malloc(lengthBytes);
       Module.stringToUTF8(str, ptr, lengthBytes);
       wakeUp(ptr);
    });
  });
});

bool http_client_wasm::invoke(const boost::string_ref uri, const boost::string_ref method, const std::string& body, std::chrono::milliseconds timeout, const http_response_info** ppresponse_info, const fields_list& additional_params) {
  cout << "invoke(" << uri << ", " << method << ", " << body << ")" << endl;

//  cout << "HTTP client starting sleep" << endl;
//  emscripten_sleep(5000);
//  cout << "Done sleeping" << endl;

  //const char* myStr = "hello there";

  // make network request and retrieve response from heap
  const char* respStr = do_fetch(uri.data(), method.data(), body.data(), timeout);
  cout << "Received response from do_fetch():\n" << respStr << endl;

  // deserialize response to property tree
  std::istringstream iss = std::istringstream(std::string(respStr));
  boost::property_tree::ptree resp_node;
  boost::property_tree::read_json(iss, resp_node);
  cout << "Done reading response to property tree" << endl;

  // free response from heap
  free((char*) respStr);

  string respMsg = resp_node.get<string>("message");
  string respBody = resp_node.get<string>("body");
  int respCode = resp_node.get<int>("code");
//  cout << "Got message from property tree: " << respMsg << endl;
//  cout << "Got body from property tree: " << respBody << endl;
//  cout << "Got code from property tree: " << respCode << endl;

  // build http response
  http_response_info* response = new http_response_info;
  response->m_response_code = respCode;
  response->m_response_comment = respMsg;
  response->m_body = respBody;
  response->m_mime_tipe = "text/plain";
  //response->m_additional_fields
  //response->m_header_info
  //response->m_mime_tipe
  response->m_http_ver_hi = 0;
  response->m_http_ver_lo = 0;
  if (ppresponse_info && response->m_response_code != 401) {
    *ppresponse_info = response;
    cout << "Response info set!!!" << endl;
    cout << (*ppresponse_info)->m_response_code << endl;
    cout << (*ppresponse_info)->m_response_comment << endl;
    cout << (*ppresponse_info)->m_body << endl;
    cout << (*ppresponse_info)->m_mime_tipe << endl;
  }

  return true;
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
