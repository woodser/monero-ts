#!/bin/sh

# build monero-core dependencies
cd ./external/monero-core/ && 
make release-static -j8 &&

# build libmonero-cpp shared library
cd ../../ &&
mkdir -p build && 
cd build && 
cmake .. && 
cmake --build . && 
make .