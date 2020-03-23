#!/bin/sh

#EMCC_DEBUG=1

export BOOSTROOT="build/boost/lib"
export BOOST_ROOT=$BOOSTROOT
export BOOST_LIB=$BOOSTROOT/lib
export BOOST_IGNORE_SYSTEM_PATHS=1
export BOOST_LIBRARYDIR=$BOOSTROOT/lib

HOST_NCORES=$(nproc 2>/dev/null|| shell nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 1)

[ -d build ] || mkdir -p build || exit 1

cd build || exit 1
emconfigure cmake .. || exit 1
emmake cmake --build . || exit 1
emmake make -j$HOST_NCORES . || exit 1

# move wasm files to /dist
cd ..
mkdir -p ./dist || exit 1
[ -f ./build/monero_keys_wasm.js ] \
  && {
    mv ./build/monero_keys_wasm.js ./dist/
  } || exit 1

[ -f ./build/monero_keys_wasm.wasm ] \
  && {
    mv ./build/monero_keys_wasm.wasm ./dist/
  } || exit 1

[ -f ./build/monero_core_wasm.js ] \
  && {
    mv ./build/monero_core_wasm.js ./dist/
  } || exit 1

[ -f ./build/monero_core_wasm.wasm ] \
  && {
    mv ./build/monero_core_wasm.wasm ./dist/
  } || exit 1

# web worker must be re-built
./bin/build-web-worker.sh