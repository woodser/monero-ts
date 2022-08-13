#!/bin/sh

# build monero-project dependencies
HOST_NCORES=$(nproc 2>/dev/null || shell nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 1)
cd ./external/monero-project/ || exit 1
git submodule update --init --force || exit 1
make release-static -j$HOST_NCORES || exit 1
cd ../../

# build libmonero-cpp shared library
mkdir -p build && 
cd build && 
cmake .. && 
cmake --build . && 
make .