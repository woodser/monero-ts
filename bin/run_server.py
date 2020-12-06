#!/usr/bin/env python
import http.server
#import ssl
 
port=8080
print("Running on port %d" % port)
 
http.server.SimpleHTTPRequestHandler.extensions_map['.wasm'] = 'application/wasm' 
httpd = http.server.HTTPServer(('localhost', port), http.server.SimpleHTTPRequestHandler)
#httpd.socket = ssl.wrap_socket(httpd.socket, keyfile="../src/test/browser/localhost-key.pem", certfile='../src/test/browser/localhost-cert.pem', server_side=True)
 
httpd.serve_forever()