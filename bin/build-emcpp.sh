#!/bin/sh

#EMCC_DEBUG=1 

source "$(realpath $(dirname $0))/emsdk-inc.sh"

export BOOSTROOT="build/boost/lib"
export BOOST_ROOT=$BOOSTROOT
export BOOST_LIB=$BOOSTROOT/lib
export BOOST_IGNORE_SYSTEM_PATHS=1
export BOOST_LIBRARYDIR=$BOOSTROOT/lib

mkdir -p build && 
cd build && 
emconfigure cmake .. && 
emmake cmake --build . && 
emmake make -j8 .