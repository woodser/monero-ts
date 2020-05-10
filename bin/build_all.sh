#!/bin/sh

# check for emscripten
[ -z ${EMSDK} ] \
  && {
    echo "Missing EMSDK Environment variable.  Did you remember to run 'source /path/to/emsdk/emsdk_env.sh' ?"
    [ "$(basename $0)" = "bash" ] \
    || { 
      echo "Terminating..."
      exit 1
    }
  }

# update submodules
./bin/update_submodules.sh || exit

# build monero-core translations directory
cd ./external/monero-cpp-library/external/monero-core || exit 1
git submodule update --init --force || exit 1
git fetch || exit 1
make release-static -j8		# don't exit because this will build translations directory even if build fails
cd ../../../../ || exit 1

# build boost
./bin/build_boost_emscripten.sh || exit

# build openssl
./bin/build_openssl_emscripten.sh || exit

# build webassembly for distribution
./bin/build_wasm_emscripten.sh || exit

# build web worker
./bin/build_web_worker.sh || exit

# build browser tests
./bin/build_browser_tests.sh || exit