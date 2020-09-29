cmake_minimum_required(VERSION 3.4.1)

#SET(CMAKE_C_COMPILER /path/to/c/compiler)
#SET(CMAKE_CXX_COMPILER /path/to/cpp/compiler)
SET(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fPIC -std=c++11 -F/Library/Frameworks -pthread")
#SET(CMAKE_C_FLAGS "${CMAKE_C_FLAGS} -fsanitize=address")
#SET(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -fPIC -std=c++11 -F/Library/Frameworks -pthread -fsanitize=address")	# TODO: way to enable sanitize?  get runtime error with this on

project(MoneroCppLibrary)

set(BUILD_LIBRARY ON)
set(BUILD_SAMPLE ON)
set(BUILD_SCRATCHPAD ON)

###################
# monero-project
###################

set(MONERO_CORE "${CMAKE_SOURCE_DIR}/external/monero-core")
set(MONERO_CORE_SRC "${MONERO_CORE}/src")

# header includes
include_directories(src/)
include_directories("${MONERO_CORE}/contrib/epee/include")
include_directories("${MONERO_CORE}/external/")
include_directories("${MONERO_CORE}/external/easylogging++")
include_directories("${MONERO_CORE}/external/rapidjson/include")
include_directories("${MONERO_CORE_SRC}/")
include_directories("${MONERO_CORE_SRC}/wallet")
include_directories("${MONERO_CORE_SRC}/wallet/api")
include_directories("${MONERO_CORE_SRC}/crypto/crypto_ops_builder/include/")

set(EXTERNAL_LIBS_DIR ${CMAKE_SOURCE_DIR}/external-libs)
message(STATUS EXTERNAL_LIBS_DIR : ${EXTERNAL_LIBS_DIR})

####################
# Extra libraries
####################

if (APPLE)
  if (DEPENDS)
    list(APPEND EXTRA_LIBRARIES "-framework Foundation -framework IOKit")
  else()
    find_library(COREFOUNDATION CoreFoundation)
    find_library(IOKIT IOKit)
    list(APPEND EXTRA_LIBRARIES ${IOKIT})
    list(APPEND EXTRA_LIBRARIES ${COREFOUNDATION})
  endif()
endif()
if (WIN32)
  list(APPEND EXTRA_LIBRARIES setupapi)
endif()

message(STATUS EXTRA_LIBRARIES: ${EXTRA_LIBRARIES})

############
# hidapi
############

add_library(hidapi STATIC IMPORTED)
set_target_properties(hidapi PROPERTIES IMPORTED_LOCATION
        ${EXTERNAL_LIBS_DIR}/hidapi/libhidapi.a)
        
############
# Epee
############



############
# Boost
############

#include_directories(external/boost-sdk)
#include_directories("${BOOST_SRC}")
#link_directories(${BOOST_LIB})
#SET(BOOST_SRC ${BOOST}/boost)
#SET(BOOST_LIB ${BOOST}/stage/lib)

set(Boost_USE_MULTITHREADED ON)
SET(BOOST ${CMAKE_SOURCE_DIR}/external/boost-sdk)
include_directories(${BOOST})
link_directories(${EXTERNAL_LIBS_DIR}/boost)

find_package(Boost 1.72 REQUIRED COMPONENTS chrono date_time filesystem program_options regex serialization wserialization system thread)

add_library(boost_chrono STATIC IMPORTED)
set_target_properties(boost_chrono PROPERTIES IMPORTED_LOCATION
    ${EXTERNAL_LIBS_DIR}/boost/libboost_chrono.a)

add_library(boost_date_time STATIC IMPORTED)
set_target_properties(boost_date_time PROPERTIES IMPORTED_LOCATION
    ${EXTERNAL_LIBS_DIR}/boost/libboost_date_time.a)

add_library(boost_filesystem STATIC IMPORTED)
set_target_properties(boost_filesystem PROPERTIES IMPORTED_LOCATION
    ${EXTERNAL_LIBS_DIR}/boost/libboost_filesystem.a)

add_library(boost_program_options STATIC IMPORTED)
set_target_properties(boost_program_options PROPERTIES IMPORTED_LOCATION
    ${EXTERNAL_LIBS_DIR}/boost/libboost_program_options.a)

add_library(boost_regex STATIC IMPORTED)
set_target_properties(boost_regex PROPERTIES IMPORTED_LOCATION
    ${EXTERNAL_LIBS_DIR}/boost/libboost_regex.a)

add_library(boost_serialization STATIC IMPORTED)
set_target_properties(boost_serialization PROPERTIES IMPORTED_LOCATION
    ${EXTERNAL_LIBS_DIR}/boost/libboost_serialization.a)
    
add_library(boost_wserialization STATIC IMPORTED)
set_target_properties(boost_wserialization PROPERTIES IMPORTED_LOCATION
    ${EXTERNAL_LIBS_DIR}/boost/libboost_wserialization.a)

add_library(boost_system STATIC IMPORTED)
set_target_properties(boost_system PROPERTIES IMPORTED_LOCATION
    ${EXTERNAL_LIBS_DIR}/boost/libboost_system.a)

add_library(boost_thread STATIC IMPORTED)
set_target_properties(boost_thread PROPERTIES IMPORTED_LOCATION
    ${EXTERNAL_LIBS_DIR}/boost/libboost_thread.a)

############
# OpenSSL
############

include_directories(external/openssl-sdk/include)

add_library(crypto STATIC IMPORTED)
set_target_properties(crypto PROPERTIES IMPORTED_LOCATION
        ${EXTERNAL_LIBS_DIR}/openssl/libcrypto.a)

add_library(ssl STATIC IMPORTED)
set_target_properties(ssl PROPERTIES IMPORTED_LOCATION
    ${EXTERNAL_LIBS_DIR}/openssl/libssl.a)
    
############
# libsodium
############

include_directories(external/libsodium/include/sodium)

add_library(sodium STATIC IMPORTED)
set_target_properties(sodium PROPERTIES IMPORTED_LOCATION
    ${EXTERNAL_LIBS_DIR}/libsodium/libsodium.a)

#############
# Monero
#############

set(MONERO_CORE_BUILD "${MONERO_CORE}/build/release")
message(STATUS MONERO_CORE_BUILD : ${MONERO_CORE_BUILD})

add_library(wallet_merged STATIC IMPORTED)
set_target_properties(wallet_merged PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/lib/libwallet_merged.a)
    
add_library(wallet STATIC IMPORTED)
set_target_properties(wallet PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/lib/libwallet.a)
    
add_library(wallet_crypto STATIC IMPORTED)
set_target_properties(wallet_crypto PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/src/crypto/wallet/libwallet-crypto.a)
    
add_library(lmdb STATIC IMPORTED)
set_target_properties(lmdb PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/external/db_drivers/liblmdb/liblmdb.a)
    
add_library(epee STATIC IMPORTED)
set_target_properties(epee PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/contrib/epee/src/libepee.a)
    
add_library(unbound STATIC IMPORTED)
set_target_properties(unbound PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/external/unbound/libunbound.a)
    
add_library(easylogging STATIC IMPORTED)
set_target_properties(easylogging PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/external/easylogging++/libeasylogging.a)

add_library(cryptonote_core STATIC IMPORTED)
set_target_properties(cryptonote_core PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/src/cryptonote_core/libcryptonote_core.a)

add_library(cryptonote_basic STATIC IMPORTED)
set_target_properties(cryptonote_basic PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/src/cryptonote_basic/libcryptonote_basic.a)

add_library(mnemonics STATIC IMPORTED)
set_target_properties(mnemonics PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/src/mnemonics/libmnemonics.a)

add_library(common STATIC IMPORTED)
set_target_properties(common PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/src/common/libcommon.a)

add_library(cncrypto STATIC IMPORTED)
set_target_properties(cncrypto PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/src/crypto/libcncrypto.a)

add_library(ringct STATIC IMPORTED)
set_target_properties(ringct PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/src/ringct/libringct.a)

add_library(ringct_basic STATIC IMPORTED)
set_target_properties(ringct_basic PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/src/ringct/libringct_basic.a)

add_library(blockchain_db STATIC IMPORTED)
set_target_properties(blockchain_db PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/src/blockchain_db/libblockchain_db.a)

add_library(blocks STATIC IMPORTED)
set_target_properties(blocks PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/src/blocks/libblocks.a)

add_library(checkpoints STATIC IMPORTED)
set_target_properties(checkpoints PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/src/checkpoints/libcheckpoints.a)

add_library(device STATIC IMPORTED)
set_target_properties(device PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/src/device/libdevice.a)
    
add_library(device_trezor STATIC IMPORTED)
set_target_properties(device_trezor PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/src/device_trezor/libdevice_trezor.a)

add_library(multisig STATIC IMPORTED)
set_target_properties(multisig PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/src/multisig/libmultisig.a)

add_library(version STATIC IMPORTED)
set_target_properties(version PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/src/libversion.a)
    
add_library(randomx STATIC IMPORTED)
set_target_properties(randomx PROPERTIES IMPORTED_LOCATION
    ${MONERO_CORE_BUILD}/external/randomx/librandomx.a)
    
########################
# Build c++ library
########################

set(
    LIBRARY_SRC_FILES
    src/utils/gen_utils.cpp
    src/utils/monero_utils.cpp
    src/daemon/monero_daemon_model.cpp
    src/daemon/monero_daemon.cpp
    src/wallet/monero_wallet_model.cpp
    src/wallet/monero_wallet_keys.cpp
    src/wallet/monero_wallet_core.cpp
)

if (BUILD_LIBRARY)

	add_library(monero-cpp SHARED ${LIBRARY_SRC_FILES})
	
	target_link_libraries(monero-cpp
	
		hidapi
		
		boost_chrono
		boost_date_time
		boost_filesystem
		boost_program_options
		boost_regex
		boost_serialization
		boost_wserialization
		boost_system
		boost_thread
		
		ssl
		crypto
		
		wallet_merged
		wallet_crypto
		#wallet_api
		wallet
		lmdb
		epee
		unbound
		sodium
		easylogging
		
		cryptonote_core
		cryptonote_basic
		mnemonics
		ringct
		ringct_basic
		common
		cncrypto
		blockchain_db
		blocks
		checkpoints
		device
		device_trezor
		multisig
		version
		randomx
		
		${EXTRA_LIBRARIES}
	)
endif()

########################
# Build C++ Sample Code
########################

if (BUILD_SAMPLE)
	set(SAMPLE_CODE_SRC_FILES test/sample_code.cpp)
	
	add_executable(sample_code ${LIBRARY_SRC_FILES} ${SAMPLE_CODE_SRC_FILES})
	
	target_link_libraries(sample_code
	
		hidapi
		
		boost_chrono
		boost_date_time
		boost_filesystem
		boost_program_options
		boost_regex
		boost_serialization
		boost_wserialization
		boost_system
		boost_thread
		
		ssl
		crypto
		
		wallet_merged
		wallet_crypto
		#wallet_api
		wallet
		lmdb
		epee
		unbound
		sodium
		easylogging
		
		cryptonote_core
		cryptonote_basic
		mnemonics
		ringct
		ringct_basic
		common
		cncrypto
		blockchain_db
		blocks
		checkpoints
		device
		device_trezor
		multisig
		version
		randomx
		
		${EXTRA_LIBRARIES}
	)
endif()

########################
# Build C++ scratchpad
########################

if (BUILD_SCRATCHPAD)
	set(SCRATCHPAD_SRC_FILES test/scratchpad.cpp)
	
	add_executable(scratchpad ${LIBRARY_SRC_FILES} ${SCRATCHPAD_SRC_FILES})
	
	target_link_libraries(scratchpad
	
		hidapi
		
		boost_chrono
		boost_date_time
		boost_filesystem
		boost_program_options
		boost_regex
		boost_serialization
		boost_wserialization
		boost_system
		boost_thread
		
		ssl
		crypto
		
		wallet_merged
		wallet_crypto
		#wallet_api
		wallet
		lmdb
		epee
		unbound
		sodium
		easylogging
		
		cryptonote_core
		cryptonote_basic
		mnemonics
		ringct
		ringct_basic
		common
		cncrypto
		blockchain_db
		blocks
		checkpoints
		device
		device_trezor
		multisig
		version
		randomx
		
		${EXTRA_LIBRARIES}
	)
endif()