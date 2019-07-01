# Monero C++ Library

This project is a lightweight wrapper of Monero's core c++ wallet, [wallet2](https://github.com/monero-project/monero/blob/master/src/wallet/wallet2.h), which focuses on ease-of-use and which conforms to the specification defined [here](https://github.com/monero-ecosystem/monero-javascript/blob/master/monero-model.pdf).

## Building a Dynamic / Shared Library

The source code in this project may be built as a dynamic or "shared" library for use on a target platform (e.g. Linux, Mac, Windows, etc).  For example, the associated [Java library](https://github.com/monero-ecosystem/monero-java-rpc) depends on a dynamic library built from this project to support a wallet using JNI.

### Build Steps

1. Download the boost source code to ./external/boost-sdk
2. Download the OpenSSL source code to ./external/openssl-sdk
3. Build dependent libraries (boost, hidapi, libsodium, monero-core, and OpenSSL) and place .a files in corresponding folders in ./external-libs per CMakeLists.txt (todo: document/automate further)
4. Build libmonero-cpp.dylib to ./build: `./bin/build-libmonero-cpp.sh`

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