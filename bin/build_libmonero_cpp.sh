#!/bin/sh

# build monero-core dependencies
HOST_NCORES=$(nproc 2>/dev/null || shell nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 1)
cd ./external/monero-core/ && 
make release-static -j$HOST_NCORES &&
cd ../../

# build libmonero-cpp shared library
mkdir -p build && 
cd build && 
cmake .. && 
cmake --build . && 
make .