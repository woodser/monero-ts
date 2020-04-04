#!/usr/bin/env python
import BaseHTTPServer, SimpleHTTPServer
#import ssl
 
port=9100
print "Running on port %d" % port
 
SimpleHTTPServer.SimpleHTTPRequestHandler.extensions_map['.wasm'] =    'application/wasm' 
httpd = BaseHTTPServer.HTTPServer(('localhost', port), SimpleHTTPServer.SimpleHTTPRequestHandler)
#httpd.socket = ssl.wrap_socket(httpd.socket, keyfile="../certs/key.pem", certfile='../certs/cert.pem', server_side=True)
 
httpd.serve_forever()