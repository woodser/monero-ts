#!/bin/sh

# build monero-core dependencies
HOST_NCORES=$(nproc 2>/dev/null || shell nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 1)
cd ./external/monero-core/ && 
make release-static -j$HOST_NCORES &&
cd ../../

# copy boost .a files to ./external-libs/boost
mkdir -p ./external-libs || exit 1
mkdir -p ./external-libs/boost || exit 1
cp ./external/boost-sdk/bin.v2/libs/chrono/build/clang-darwin-11.0/release/link-static/threading-multi/visibility-hidden/libboost_chrono.a ./external-libs/boost || exit 1
cp ./external/boost-sdk/bin.v2/libs/date_time/build/clang-darwin-11.0/release/link-static/threading-multi/visibility-hidden/libboost_date_time.a ./external-libs/boost || exit 1
cp ./external/boost-sdk/bin.v2/libs/filesystem/build/clang-darwin-11.0/release/link-static/threading-multi/visibility-hidden/libboost_filesystem.a ./external-libs/boost || exit 1
cp ./external/boost-sdk/bin.v2/libs/program_options/build/clang-darwin-11.0/release/link-static/threading-multi/visibility-hidden/libboost_program_options.a ./external-libs/boost || exit 1
cp ./external/boost-sdk/bin.v2/libs/regex/build/clang-darwin-11.0/release/link-static/threading-multi/visibility-hidden/libboost_regex.a  ./external-libs/boost || exit 1
cp ./external/boost-sdk/bin.v2/libs/serialization/build/clang-darwin-11.0/release/link-static/threading-multi/visibility-hidden/libboost_serialization.a ./external-libs/boost || exit 1
cp ./external/boost-sdk/bin.v2/libs/serialization/build/clang-darwin-11.0/release/link-static/threading-multi/visibility-hidden/libboost_wserialization.a ./external-libs/boost || exit 1
cp ./external/boost-sdk/bin.v2/libs/system/build/clang-darwin-11.0/release/link-static/threading-multi/visibility-hidden/libboost_system.a ./external-libs/boost || exit 1
cp ./external/boost-sdk/bin.v2/libs/thread/build/clang-darwin-11.0/release/link-static/threadapi-pthread/threading-multi/visibility-hidden/libboost_thread.a ./external-libs/boost || exit 1

# copy openssl .a files to ./external-libs/openssl
mkdir -p ./external-libs/openssl || exit 1
cp ./external/openssl-sdk/libcrypto.a ./external-libs/openssl || exit 1
cp ./external/openssl-sdk/libssl.a ./external-libs/openssl || exit 1

# build libmonero-cpp shared library
mkdir -p build && 
cd build && 
cmake .. && 
cmake --build . && 
make .