# Monero C++ Library

This project is a lightweight wrapper of [Monero Core's](https://github.com/monero-project/monero) C++ wallet, [wallet2](https://github.com/monero-project/monero/blob/master/src/wallet/wallet2.h), which conforms to the specification defined [here](https://github.com/monero-ecosystem/monero-javascript/blob/master/monero-model.pdf).

The purpose of this library is to define common daemon and wallet types for a general-purpose Monero API which focuses on ease-of-use.  

This library may be used to build Monero-related GUI applications, libraries in other languages (e.g. [monero-java](https://github.com/monero-ecosystem/monero-java-rpc)), or a conformant REST/JSON-RPC API.

## Building a Dynamic / Shared Library

The source code in this project may be built as a dynamic or "shared" library for use on a target platform (e.g. Linux, Mac, Windows, etc).  For example, the associated [Java library](https://github.com/monero-ecosystem/monero-java-rpc) depends on a dynamic library built from this project to support a wallet using JNI.

### Build Steps

These build steps aspire to be automated further.

1. Setup Boost
    1. Download and extract the boost 1.69.0 source code zip from https://www.boost.org/users/download/ to ./external/boost-sdk/.
    2. `cd ./external/boost-sdk/`
    3. `./bootstraph.sh`
    4. `./b2`
    5. Copy .a files from ./external/boost-sdk/bin.v2/libs/\*/link-static/\* to ./external-libs/boost according to CMakeLists.txt.
2. Setup OpenSSL
    1. Download and extract the latest OpenSSL source code zip from https://github.com/openssl/openssl to ./external/openssl-sdk/.
    2. Build for your system.<br>
       Mac: installed through boost at /usr/local/opt/openssl/lib
    3. Copy libcrypto.a and libssl.a ./external-libs/openssl.
3. Setup Monero Core
    1. Initialize submodules: `git submodule update --init --recursive`
    2. cd ./submodules/monero-core
    3. Modify CMakeLists.txt: `option(BUILD_GUI_DEPS "Build GUI dependencies." ON)`.
    4. Build twice to create libwallet_merged.a in addition to other .a libraries: `make release-static -j8`.
    5. Copy .a files from ./submodules/monero-core/build/release/* to ./external-libs/monero-core according to CMakeLists.txt.
4. Setup hidapi
    1. Download the latest hidapi source code from https://github.com/signal11/hidapi.
    2. Build hidapi for your system.<br>
       Mac requires autoreconf: `brew install automake`
    3. Copy libhidapi.a to ./external-libs/hidapi.
5. Setup libsodium
    1. Build libsodium for your system.
    2. Copy libsodium.a to ./external-libs/libsodium.<br>
       Mac: installed through homebrew at /usr/local/Cellar/libsodium/1.0.17/lib/libsodium.a
6. Build libmonero-cpp.dylib to ./build: `./bin/build-libmonero-cpp.sh`.

## See Also

[Java reference implementation](https://github.com/monero-ecosystem/monero-java-rpc)

[JavaScript reference implementation](https://github.com/monero-ecosystem/monero-javascript)

## License

This project is licensed under MIT.

## Donate

Please consider donating if you want to support this project.  Thank you!

<p align="center">
	<img src="donate.png" width="150" height="150"/>
</p>

`46FR1GKVqFNQnDiFkH7AuzbUBrGQwz2VdaXTDD4jcjRE8YkkoTYTmZ2Vohsz9gLSqkj5EM6ai9Q7sBoX4FPPYJdGKQQXPVz`