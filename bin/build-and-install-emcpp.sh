#!/bin/sh

#EMCC_DEBUG=1 

mkdir -p build && 
cd build && 
emconfigure cmake .. && 
emmake cmake --build . && 
emmake make . &&
cd ../
cp ./build/monero_cpp_library_WASM.js ./src/ &&
cp ./build/monero_cpp_library_WASM.wasm ./src