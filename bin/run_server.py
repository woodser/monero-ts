#!/usr/bin/env python
from http.server import HTTPServer, SimpleHTTPRequestHandler
# import ssl

port = 8080
print("Running on port %d" % port)

SimpleHTTPRequestHandler.extensions_map['.wasm'] = 'application/wasm'


class CORSHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cross-Origin-Embedder-Policy', 'require-corp')
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header( 'Access-Control-Allow-Origin', "http://localhost:8080")
        SimpleHTTPRequestHandler.end_headers(self)


server = HTTPServer(('localhost', port), CORSHandler)

# httpd.socket = ssl.wrap_socket(httpd.socket, keyfile="../src/test/browser/localhost-key.pem", certfile='../src/test/browser/localhost-cert.pem', server_side=True)

server.serve_forever()
