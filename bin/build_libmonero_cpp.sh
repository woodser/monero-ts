#!/bin/sh

# Make libmonero-cpp.dylib
cd ./external/monero-core/ && 
make release-static -j8 &&

# Make libmonero-cpp.dylib
cd ../../ &&
mkdir -p build && 
cd build && 
cmake .. && 
cmake --build . && 
make .