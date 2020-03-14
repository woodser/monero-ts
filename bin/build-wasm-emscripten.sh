#!/bin/sh

#EMCC_DEBUG=1

export BOOSTROOT="build/boost/lib"
export BOOST_ROOT=$BOOSTROOT
export BOOST_LIB=$BOOSTROOT/lib
export BOOST_IGNORE_SYSTEM_PATHS=1
export BOOST_LIBRARYDIR=$BOOSTROOT/lib

mkdir -p build && 
cd build && 
emconfigure cmake .. && 
emmake cmake --build . && 
emmake make -j$HOST_NCORES . &&

# move wasm files to /dist
cd ../ &&
mkdir -p dist &&
mv ./build/monero_keys_wasm.js ./dist/ &&
mv ./build/monero_keys_wasm.wasm ./dist/
mv ./build/monero_core_wasm.js ./dist/ &&
mv ./build/monero_core_wasm.wasm ./dist/ &&

# web worker must be re-built
./bin/build-web-worker.sh