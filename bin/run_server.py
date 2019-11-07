#!/usr/bin/env python
import BaseHTTPServer, SimpleHTTPServer
 
port=9100
print "Running on port %d" % port
 
SimpleHTTPServer.SimpleHTTPRequestHandler.extensions_map['.wasm'] =    'application/wasm' 
httpd = BaseHTTPServer.HTTPServer(('localhost', port),
    SimpleHTTPServer.SimpleHTTPRequestHandler)
 
httpd.serve_forever()