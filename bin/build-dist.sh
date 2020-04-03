#!/bin/sh

./bin/build-wasm-emscripten.sh || exit 1
./bin/build-web-worker.sh || exit 1