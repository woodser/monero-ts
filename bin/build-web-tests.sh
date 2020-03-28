#!/bin/sh

# build web app dependencies
#./bin/build-wasm-emscripten.sh
npm run build-web-tests

# copy web app dependencies
cp -R dist/ browser_build/
cp src/test/browser/tests.html browser_build/tests.html
cp node_modules/mocha/mocha.js browser_build/mocha.js
cp node_modules/mocha/mocha.css browser_build/mocha.css

# start server
cd browser_build && python ../bin/run_server.py