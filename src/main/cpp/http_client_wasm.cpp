#include <emscripten.h>
#include <emscripten/fetch.h>
#include <iostream>
#include "http_client_wasm.h"
#include <boost/property_tree/ptree.hpp>
#include <boost/property_tree/json_parser.hpp>

using namespace std;

// TODO: factor js code to js file, possible use by MoneroRpcConnection, or change MoneroRpcConnection interface

EM_JS(const char*, js_send_json_request, (const char* uri, const char* username, const char* password, const char* method, const char* body, std::chrono::milliseconds timeout), {
  //console.log("EM_JS js_send_json_request(" + UTF8ToString(uri) + ", " + UTF8ToString(username) + ", " + UTF8ToString(password) + ", " + UTF8ToString(method) + ", " + UTF8ToString(body) + ")");

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

    // initialize request config
    this.config = {};
    this.config.user = UTF8ToString(username);
    this.config.pass = UTF8ToString(password);

    // build request which gets json response as text
    let opts = {
      method: UTF8ToString(method),
      uri: UTF8ToString(uri),
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

    //console.log("Timeout: " + timeout); // TODO: use timeout

    /**
     * Makes a throttled request.
     *
     * TODO: move to common
     */
    function _throttledRequest(opts) {
      return this.promiseThrottle.add(function(opts) { return Request(opts); }.bind(this, opts));
    }

    // send throttled request
    let wakeUpCalled = false;
    _throttledRequest(opts).then(resp => {
      //console.log("RESPONSE:");
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
      wakeUpCalled = true;
      wakeUp(ptr);
    }).catch(err => {
      console.log("ERROR!!!");
      console.log(err);
      if (wakeUpCalled) {
          console.log("Error caught in JS after previously calling wakeUp(): " + err);
          throw Error("Error caught in JS after previously calling wakeUp(): " + err);
      }
      let str = err.message ? err.message : ("" + err); // get error message
      str = JSON.stringify({error: str});               // wrap error in object
      let lengthBytes = Module.lengthBytesUTF8(str) + 1;
      let ptr = Module._malloc(lengthBytes);
      Module.stringToUTF8(str, ptr, lengthBytes);
      wakeUp(ptr);
    });
  });
});

EM_JS(const char*, js_send_binary_request, (const char* uri, const char* username, const char* password, const char* method, const char* body, int body_length, std::chrono::milliseconds timeout), {
  //console.log("EM_JS js_send_binary_request(" + UTF8ToString(uri) + ", " + UTF8ToString(username) + ", " + UTF8ToString(password) + ", " + UTF8ToString(method) + ", " + UTF8ToString(body) + ")");

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
    this.config.user = UTF8ToString(username);
    this.config.pass = UTF8ToString(password);

    // load wasm module then convert from json to binary
    MoneroUtils.loadWasmModule().then(module => {

      let ptr = body;
      let length = body_length;

      // read binary data from heap to Uint8Array
      let view = new Uint8Array(length);
      for (let i = 0; i < length; i++) {
        view[i] = Module.HEAPU8[ptr / Uint8Array.BYTES_PER_ELEMENT + i];
      }

      // build request which gets json response as text
      let opts = {
        method: UTF8ToString(method),
        uri: UTF8ToString(uri),
        body: view,
        agent: agent,
        resolveWithFullResponse: true,
        encoding: null
      };
      if (this.config.user) {
        opts.forever = true;
        opts.auth = {
          user: this.config.user,
          pass: this.config.pass,
          sendImmediately: false
        }
      }

      /**
       * Makes a throttled request.
       *
       * TODO: move to common
       */
      function _throttledRequest(opts) {
        return this.promiseThrottle.add(function(opts) { return Request(opts); }.bind(this, opts));
      }

      // send throttled request
      let wakeUpCalled = false;
      _throttledRequest(opts).then(resp => {

        // write binary body to heap and pass back pointer
        let nDataBytes = resp.body.length * resp.body.BYTES_PER_ELEMENT;
        let bodyPtr = Module._malloc(nDataBytes);
        let heap = new Uint8Array(Module.HEAPU8.buffer, bodyPtr, nDataBytes);
        heap.set(new Uint8Array(resp.body.buffer, resp.body.byteOffset, nDataBytes));

        // build response container
        let respContainer = {
          code: resp.statusCode,
          message: resp.statusMessage,
          headers: resp.headers,
          bodyPtr: bodyPtr,
          bodyLength: resp.body.length
        };

        // serialize response container to heap // TODO: more efficient way?
        let respStr = JSON.stringify(respContainer);
        let lengthBytes = Module.lengthBytesUTF8(respStr) + 1;
        let respPtr = Module._malloc(lengthBytes);
        Module.stringToUTF8(respStr, respPtr, lengthBytes);
        wakeUpCalled = true;
        wakeUp(respPtr);
      }).catch(err => {
        console.log("ERROR!!!");
        console.log(err);
        if (wakeUpCalled) {
          console.log("Error caught in JS after previously calling wakeUp(): " + err);
          throw Error("Error caught in JS after previously calling wakeUp(): " + err);
        }
        let str = err.message ? err.message : ("" + err); // get error message
        str = JSON.stringify({error: str});               // wrap error in object
        let lengthBytes = Module.lengthBytesUTF8(str) + 1;
        let ptr = Module._malloc(lengthBytes);
        Module.stringToUTF8(str, ptr, lengthBytes);
        wakeUp(ptr);
      });
    });
  });
});

void http_client_wasm::set_server(std::string host, std::string port, boost::optional<login> user, ssl_options_t ssl_options) {
  m_host = host;
  m_port = port;
  m_user = user;
  m_ssl_enabled = ssl_options ? true : false;
}

//void http_client_wasm::set_server(std::string uri, std::string username, std::string password) {
//  disconnect();
//  m_uri = uri;
//  m_user = epee::net_utils::http::login();
//  m_user->username = username;
//  m_user->password = password;
//}

void http_client_wasm::set_auto_connect(bool auto_connect) {
  cout << "set_auto_connect()" << endl;
  throw runtime_error("http_client_wasm::set_auto_connect() not implemented");
}

// TODO: this method gets called repeatedly, so need to cache
bool http_client_wasm::connect(std::chrono::milliseconds timeout) {
  m_is_connected = true;    // TODO: do something!
  return true;
}

bool http_client_wasm::disconnect() {
  m_is_connected = false;
  return true;
}

bool http_client_wasm::is_connected(bool *ssl) {
  return m_is_connected;
}

void build_http_header_info(const boost::property_tree::ptree& headers_node, http_header_info& header_info) {
  for (const auto& header : headers_node) {
    string key = header.first;
    string value = header.second.data();
    if (!epee::string_tools::compare_no_case(key, "Connection"))
      header_info.m_connection = value;
    else if(!epee::string_tools::compare_no_case(key, "Referrer"))
      header_info.m_referer = value;
    else if(!epee::string_tools::compare_no_case(key, "Content-Length"))
      header_info.m_content_length = value;
    else if(!epee::string_tools::compare_no_case(key, "Content-Type"))
      header_info.m_content_type = value;
    else if(!epee::string_tools::compare_no_case(key, "Transfer-Encoding"))
      header_info.m_transfer_encoding = value;
    else if(!epee::string_tools::compare_no_case(key, "Content-Encoding"))
      header_info.m_content_encoding = value;
    else if(!epee::string_tools::compare_no_case(key, "Host"))
      header_info.m_host = value;
    else if(!epee::string_tools::compare_no_case(key, "Cookie"))
      header_info.m_cookie = value;
    else if(!epee::string_tools::compare_no_case(key, "User-Agent"))
      header_info.m_user_agent = value;
    else if(!epee::string_tools::compare_no_case(key, "Origin"))
      header_info.m_origin = value;
    else
      header_info.m_etc_fields.emplace_back(key, value);
  }
}

bool http_client_wasm::invoke_json(const boost::string_ref path, const boost::string_ref method, const std::string& body, std::chrono::milliseconds timeout, const http_response_info** ppresponse_info, const fields_list& additional_params) {

  // make json request through javascript
  string uri = string(m_ssl_enabled ? "https" : "http") + "://" + m_host + ":" + m_port + string(path);
  string password = string(m_user->password.data(), m_user->password.size());
  const char* resp_str = js_send_json_request(uri.data(), m_user->username.data(), password.data(), method.data(), body.data(), timeout);

  // deserialize response to property tree
  std::istringstream iss = std::istringstream(std::string(resp_str));
  boost::property_tree::ptree resp_node;
  boost::property_tree::read_json(iss, resp_node);

  // check for error
  boost::optional<boost::property_tree::ptree&> error = resp_node.get_child_optional("error");
  if (error) return false;

  // build response object
  m_response_info.clear();
  m_response_info.m_mime_tipe = "application/json";
  m_response_info.m_response_comment = resp_node.get<string>("message");
  m_response_info.m_response_code = resp_node.get<int>("code");
  m_response_info.m_http_ver_hi = 0;
  m_response_info.m_http_ver_lo = 0;
  build_http_header_info(resp_node.get_child("headers"), m_response_info.m_header_info);
  m_response_info.m_body = resp_node.get<string>("body");

  // set response argument
  if (ppresponse_info && m_response_info.m_response_code != 401) {
    *ppresponse_info = std::addressof(m_response_info);
  }

  // free response string from heap
  free((char*) resp_str);

  // return true iff 200
  return m_response_info.m_response_code == 200;
}

bool http_client_wasm::invoke_binary(const boost::string_ref path, const boost::string_ref method, const std::string& body, std::chrono::milliseconds timeout, const http_response_info** ppresponse_info, const fields_list& additional_params) {

  // make binary request through javascript
  string uri = string(m_ssl_enabled ? "https" : "http") + "://" + m_host + ":" + m_port + string(path);
  string password = string(m_user->password.data(), m_user->password.size());
  const char* resp_str = js_send_binary_request(uri.data(), m_user->username.data(), password.data(), method.data(), body.data(), body.length(), timeout);

  // deserialize response to property tree
  std::istringstream iss = std::istringstream(std::string(resp_str));
  boost::property_tree::ptree resp_node;
  boost::property_tree::read_json(iss, resp_node);

  // check for error
  boost::optional<boost::property_tree::ptree&> error = resp_node.get_child_optional("error");
  if (error) return false;

  // build response object
  m_response_info.clear();
  m_response_info.m_mime_tipe = "application/octet_stream";
  m_response_info.m_response_comment = resp_node.get<string>("message");
  m_response_info.m_response_code = resp_node.get<int>("code");
  m_response_info.m_http_ver_hi = 0;
  m_response_info.m_http_ver_lo = 0;
  build_http_header_info(resp_node.get_child("headers"), m_response_info.m_header_info);

  // read binary body from response pointer
  int body_ptr = resp_node.get<int>("bodyPtr");
  int body_length = resp_node.get<int>("bodyLength");
  m_response_info.m_body = string((char*) body_ptr, body_length);

  // set response argument
  if (ppresponse_info && m_response_info.m_response_code != 401) {
    *ppresponse_info = std::addressof(m_response_info);
  }

  // free response string and binary from heap
  free((char*) resp_str);
  free((char*) body_ptr);

  // return true iff 200
  return m_response_info.m_response_code == 200;
}

bool http_client_wasm::invoke(const boost::string_ref path, const boost::string_ref method, const std::string& body, std::chrono::milliseconds timeout, const http_response_info** ppresponse_info, const fields_list& additional_params) {
  //cout << "invoke(" << path << ", " << method << ", ...)" << endl;

  // return false if unconnected
  if (!is_connected()) {
    cout << "invoke() called but client is not connected so returning false" << endl;
    return false;
  }

  // invoke http call
  string path_str = path.data();
  bool is_binary = (0 == path_str.compare(path_str.length() - 4, 4, string(".bin")));
  if (is_binary) return invoke_binary(path, method, body, timeout, ppresponse_info, additional_params);
  else return invoke_json(path, method, body, timeout, ppresponse_info, additional_params);
}

bool http_client_wasm::invoke_get(const boost::string_ref path, std::chrono::milliseconds timeout, const std::string& body, const http_response_info** ppresponse_info, const fields_list& additional_params) {
  cout << "invoke_get()" << endl;
  return http_client_wasm::invoke(path, "GET", body, timeout, ppresponse_info, additional_params);
}

bool http_client_wasm::invoke_post(const boost::string_ref path, const std::string& body, std::chrono::milliseconds timeout, const http_response_info** ppresponse_info, const fields_list& additional_params) {
  cout << "invoke_post()" << endl;
  return http_client_wasm::invoke(path, "POST", body, timeout, ppresponse_info, additional_params);
}

uint64_t http_client_wasm::get_bytes_sent() const {
  cout << "get_bytes_sent()" << endl;
  throw runtime_error("http_client_wasm::get_bytes_sent() not implemented");
}

uint64_t http_client_wasm::get_bytes_received() const {
  cout << "get_bytes_received()" << endl;
  throw runtime_error("http_client_wasm::get_bytes_received() not implemented");
}
