#!/bin/sh

# delete contents of old browser build
mkdir -p ./browser_build/ || exit 1
rm -r ./browser_build/ || exit 1

# build browser tests
npm run build_web_tests || exit 1

# copy dependencies to browser build
cp -R dist/* browser_build/ || exit 1
cp src/test/browser/tests.html browser_build/tests.html || exit 1
cp src/test/browser/favicon.ico browser_build/favicon.ico || exit 1
cp node_modules/mocha/mocha.js browser_build/mocha.js || exit 1
cp node_modules/mocha/mocha.css browser_build/mocha.css || exit 1

# start server
./bin/start_browser_test_server.sh