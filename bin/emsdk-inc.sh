#!/bin/sh

[ -z ${EMSDK} ] \
  && {
    echo "Missing EMSDK Environment variable.."
    echo "Did you remember to run '/path/to/emsdk/emsdk_env.sh' ?"
    exit 1
  }

[ -z ${EMSCRIPTEN} ] \
  && {
    export EMSCRIPTEN="${EMSDK}/upstream/emscripten"
  }
