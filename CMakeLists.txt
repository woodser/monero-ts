cmake_minimum_required(VERSION 3.4.1)

project(monero-cpp-library-wasm)

SET(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -std=c++11")

#find_package(Threads)
#find_package(Backtrace)

##############
# C++ bridge
##############

include_directories("src/cpp")

#####################
# monero-cpp-library
#####################

set(MONERO_CPP "external/monero-cpp-library")
set(MONERO_CPP_SRC "${MONERO_CPP}/src")

# headers
include_directories("${MONERO_CPP}/external/libsodium/include/sodium")
include_directories("${MONERO_CPP}/external/openssl-sdk/include")
include_directories("${MONERO_CPP_SRC}")

#############
# Boost
#############

set(BOOST ${CMAKE_SOURCE_DIR}/build/boost)
include_directories("${BOOST}")
include_directories("${BOOST}/include") # must exist already - run bin/build-boost-emscripten.sh

add_library(boost_chrono STATIC IMPORTED)
set_target_properties(
    boost_chrono PROPERTIES IMPORTED_LOCATION
    ${BOOST}/lib/libboost_chrono.a
)

add_library(boost_system STATIC IMPORTED)
set_target_properties(
    boost_system PROPERTIES IMPORTED_LOCATION
    ${BOOST}/lib/libboost_system.a
)

add_library(boost_thread STATIC IMPORTED)
set_target_properties(
    boost_thread PROPERTIES IMPORTED_LOCATION
    ${BOOST}/lib/libboost_thread.a
)

##################
# monero-project
##################

set(MONERO_CORE ${MONERO_CPP}/external/monero-core)
set(MONERO_CORE_SRC "${MONERO_CORE}/src")

# headers
include_directories("${MONERO_CORE_SRC}/common")
include_directories("${MONERO_CORE_SRC}/vtlogger")
include_directories("${MONERO_CORE_SRC}/crypto")
include_directories("${MONERO_CORE_SRC}/cryptonote_basic")
include_directories("${MONERO_CORE_SRC}/multisig")
include_directories("${MONERO_CORE_SRC}/cryptonote_core")
include_directories("${MONERO_CORE_SRC}/cryptonote_protocol")
include_directories("${MONERO_CORE_SRC}/wallet")
include_directories("${MONERO_CORE_SRC}/rpc")
include_directories("${MONERO_CORE_SRC}/mnemonics")
include_directories("${MONERO_CORE}/contrib/libsodium/include") # support sodium/… paths
include_directories("${MONERO_CORE}/contrib/libsodium/include/sodium")

include_directories("${MONERO_CORE}/contrib/epee/include")
include_directories("${MONERO_CORE}/external/")
#include_directories("${MONERO_CORE}/external/unbound/libunbound")
#include_directories("${MONERO_CORE}/external/easylogging++")
include_directories("${CMAKE_CURRENT_BINARY_DIR}")
include_directories("${MONERO_CORE_SRC}/")
include_directories("${MONERO_CORE_SRC}/wallet")
include_directories("${MONERO_CORE_SRC}/wallet/api")
include_directories("${MONERO_CORE_SRC}/crypto/crypto_ops_builder/include/")

####################
# Source files
####################

set(
    SRC_FILES
    #
    src/main/cpp/index.cpp
    src/main/cpp/monero_wallet_wasm_bridge.cpp
    src/main/cpp/monero_utils_wasm_bridge.cpp
    #
    ${MONERO_CPP_SRC}/utils/monero_utils.cpp
    ${MONERO_CPP_SRC}/wallet/monero_wallet_dummy.cpp
    #${MONERO_CPP_SRC}/wallet/monero_wallet.cpp
    #
    ###[[	--- START BLOCK COMMENT ---
    ${MONERO_CORE_SRC}/cryptonote_basic/cryptonote_basic_impl.cpp
    ${MONERO_CORE_SRC}/cryptonote_basic/account.cpp
    ${MONERO_CORE_SRC}/cryptonote_basic/cryptonote_format_utils.cpp
    ${MONERO_CORE_SRC}/crypto/crypto.cpp
    ${MONERO_CORE_SRC}/crypto/hash.c
    ${MONERO_CORE_SRC}/crypto/slow-hash.c
    ${MONERO_CORE_SRC}/crypto/oaes_lib.c
    ${MONERO_CORE_SRC}/crypto/crypto-ops.c
    ${MONERO_CORE_SRC}/crypto/crypto-ops-data.c
    ${MONERO_CORE_SRC}/crypto/keccak.c
    ${MONERO_CORE_SRC}/crypto/chacha.c
    ${MONERO_CORE_SRC}/crypto/random.c
    ${MONERO_CORE_SRC}/crypto/aesb.c
    ${MONERO_CORE_SRC}/crypto/tree-hash.c
    ${MONERO_CORE_SRC}/crypto/hash-extra-blake.c
    ${MONERO_CORE_SRC}/crypto/blake256.c
    ${MONERO_CORE_SRC}/crypto/hash-extra-groestl.c
    ${MONERO_CORE_SRC}/crypto/hash-extra-jh.c
    ${MONERO_CORE_SRC}/crypto/hash-extra-skein.c
    ${MONERO_CORE_SRC}/crypto/groestl.c
    ${MONERO_CORE_SRC}/crypto/jh.c
    ${MONERO_CORE_SRC}/crypto/skein.c
    ${MONERO_CORE_SRC}/cryptonote_core/cryptonote_tx_utils.cpp
    ${MONERO_CORE_SRC}/common/base58.cpp
    ${MONERO_CORE_SRC}/common/threadpool.cpp
    ${MONERO_CORE_SRC}/common/aligned.c
    ${MONERO_CORE_SRC}/common/util.cpp
    ${MONERO_CORE}/contrib/epee/src/hex.cpp
    ${MONERO_CORE}/contrib/epee/src/string_tools.cpp
    ${MONERO_CORE}/contrib/epee/src/memwipe.c
    ${MONERO_CORE}/contrib/epee/src/mlocker.cpp
    ${MONERO_CORE}/contrib/epee/src/wipeable_string.cpp
    ${MONERO_CORE_SRC}/device/device.cpp
    ${MONERO_CORE_SRC}/device/device_default.cpp
    ${MONERO_CORE_SRC}/ringct/rctOps.cpp
    ${MONERO_CORE_SRC}/ringct/rctTypes.cpp
    ${MONERO_CORE_SRC}/ringct/rctCryptoOps.c
    ${MONERO_CORE_SRC}/ringct/rctSigs.cpp
    ${MONERO_CORE_SRC}/ringct/bulletproofs.cc
    ${MONERO_CORE_SRC}/ringct/multiexp.cc
    ${MONERO_CORE_SRC}/mnemonics/electrum-words.cpp
    ${MONERO_CORE_SRC}/vtlogger/logger.cpp
    ${MONERO_CORE}/contrib/libsodium/src/crypto_verify/verify.c
    ###]]	# --- END BLOCK COMMENT ---
)

####################
# Build parameters
####################
set (
    EMCC_LINKER_FLAGS___BASE
    #unsure if the -I...boost..include is necessary here due to include above
    #
    # TODO? does EXPORT_NAME need to be the same for both targets? (or should it be set per-target with …_WASM, …_ASMJS?)
    "-Wall -std=c++11 \
--bind -s MODULARIZE=1 \
-s 'EXPORT_NAME=\"monero_cpp_library\"' \
--llvm-lto 1 \
-s ERROR_ON_UNDEFINED_SYMBOLS=0 \
-s ASSERTIONS=2 \
-s EXIT_RUNTIME=0 \
-s \"BINARYEN_TRAP_MODE='clamp'\" \
-s PRECISE_F32=1 \
-s DISABLE_EXCEPTION_CATCHING=0 \
-s EXCEPTION_DEBUG=1 \
-s DEMANGLE_SUPPORT=1 \
-s NO_DYNAMIC_EXECUTION=1 \
-s NODEJS_CATCH_EXIT=0 \
-s EXTRA_EXPORTED_RUNTIME_METHODS='[\"UTF8ToString\"]' \
"
    # • Disabling exception catching does not introduce silent failures 
    # • Probably don't need PRECISE_F32 but wouldn't want to not use it
    #
    #
    # -s SAFE_HEAP=1 \
    # -g \
)
set(
    EMCC_LINKER_FLAGS__ASMJS
    "${EMCC_LINKER_FLAGS___BASE} \
-s WASM=0 \
-Os \
--separate-asm \
-s AGGRESSIVE_VARIABLE_ELIMINATION=1 \
-s ALLOW_MEMORY_GROWTH=0 \
--memory-init-file 0 \
"
    # --memory-init-file is explicitly set to 0 because optimization level is Oz, and some clients like React Native have trouble loading .mem files
    # .... it also didn't seem to have a giant impact on perf. but this should be tested again
    #
    # --closure 1 \
)
set(
    EMCC_LINKER_FLAGS__WASM
    "${EMCC_LINKER_FLAGS___BASE} \
-s WASM=1 \
-Oz \
-s ALLOW_MEMORY_GROWTH=1 \
--post-js ${CMAKE_CURRENT_LIST_DIR}/src/module-post.js \
"
    # -g \
)
#
#    -s EXPORTED_FUNCTIONS='[\"_sc_reduce\", \"_sc_reduce32\", \"_sc_check\", \"_sc_add\", \"_ge_fromfe_frombytes_vartime\", \"_ge_mul8\", \"_ge_p1p1_to_p3\", \"_ge_p3_tobytes\", \"_ge_scalarmult\", \"_ge_tobytes\", \"_sc_sub\", \"_sc_mulsub\", \"_ge_scalarmult_base\", \"_sc_0\", \"_ge_double_scalarmult_base_vartime\", \"_ge_double_scalarmult_precomp_vartime\", \"_ge_frombytes_vartime\", \"_ge_dsm_precomp\"]' \
#
#
message(STATUS "EMCC_LINKER_FLAGS__WASM ${EMCC_LINKER_FLAGS__WASM}")
message(STATUS "EMCC_LINKER_FLAGS__ASMJS ${EMCC_LINKER_FLAGS__ASMJS}")
#

#add_library(ssl STATIC IMPORTED)
#set_target_properties(ssl PROPERTIES IMPORTED_LOCATION
#    ${MONERO_CORE}/external-libs/openssl/libssl.a)

####################
# Build targets
####################

# WASM
add_executable(monero_cpp_library_WASM ${SRC_FILES})
set_target_properties(monero_cpp_library_WASM PROPERTIES LINK_FLAGS "${EMCC_LINKER_FLAGS__WASM}")
target_link_libraries(
    monero_cpp_library_WASM
    #
    boost_chrono
    boost_system
    boost_thread
    #
    ${log-lib}
)

# ASMJS
#add_executable(monero_cpp_library_ASMJS ${SRC_FILES})
#set_target_properties(monero_cpp_library_ASMJS PROPERTIES LINK_FLAGS "${EMCC_LINKER_FLAGS__ASMJS}")
#target_link_libraries(
	#monero_cpp_library_ASMJS
    ##
    #${log-lib}
#)

# build to bitcode instead of wasm
#SET(CMAKE_EXECUTABLE_SUFFIX ".bc")	