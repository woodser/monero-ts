#!/bin/sh

[ -z ${EMSDK} ] \
  && {
    echo "Missing EMSDK Environment variable.."
    echo "Did you remember to run '/path/to/emsdk/emsdk_env.sh' ?"
    [ "$(basename $0)" = "bash" ] \
    || { 
      echo "Terminating..."
      exit 1
    }
  }

#unset EMSCRIPTEN
[ -z ${EMSCRIPTEN} ] \
  && {
    [ -d "${EMSDK}/upstream/emscripten" ] \
    && {
      export EMSCRIPTEN="${EMSDK}/upstream/emscripten"
      echo "export EMSCRIPTEN = ${EMSCRIPTEN}"
    } \
    || {
      echo "Missing directory: \${EMSDK}/upstream/emscripten"
    }
  } \
  || {
    echo "EMSCRIPTEN Environment OK"
  }

get_boost_github() {
  local SDK_PATH=$1
  [ -z ${SDK_PATH} ] && { echo "get_boost_github: Missing SDK_PATH parameter..."; return 1; }

  [ "$(basename ${SDK_PATH})" = "boost-sdk" ] \
  && {
    rm -fr ${SDK_PATH}
    SDK_PATH=$(dirname ${SDK_PATH})
  }
  
  [ -d ${SDK_PATH} ] || { echo "get_boost_github: Missing directory: ${SDK_PATH}"; return 1; }

  echo "Downloading boost from GitHub..."
  git clone --recursive https://github.com/boostorg/boost.git --branch "boost-1.72.0" "${SDK_PATH}/boost-sdk" \
  || {
    echo "Download failed.."
    return 1
  }
  return 0
}

get_openssl_github() {
  local SDK_PATH=$1
  [ -z ${SDK_PATH} ] && { echo "get_openssl_github: Missing SDK_PATH parameter..."; return 1; }

  [ "$(basename ${SDK_PATH})" = "openssl-sdk" ] \
  && {
    rm -fr ${SDK_PATH}
    SDK_PATH=$(dirname ${SDK_PATH})
  }
  
  [ -d ${SDK_PATH} ] || { echo "get_openssl_github: Missing directory: ${SDK_PATH}"; return 1; }

  echo "Downloading openssl repository from GitHub..."

  git clone --recursive https://github.com/openssl/openssl.git "${SDK_PATH}/openssl-sdk" \
    && {
      (
        cd "${SDK_PATH}/openssl-sdk"
        git checkout OpenSSL_1_1_1-stable
      )
    } \
    || {
      echo "Download failed.."
      return 1
    }

  return 0
}

get_boost_source() {
  local SDK_PATH=$1
  [ -z ${SDK_PATH} ] && { echo "get_boost_source: Missing SDK_PATH parameter..."; return 1; }

  [ "$(basename ${SDK_PATH})" = "boost-sdk" ] \
  && {
    rm -fr ${SDK_PATH}
    SDK_PATH=$(dirname ${SDK_PATH})
  }
  
  [ -d ${SDK_PATH} ] || { echo "get_boost_source: Missing directory: ${SDK_PATH}"; return 1; }

  [ -f "${SDK_PATH}/boost-1.72.0.tar.gz" ] \
  || {
    echo "Downloading boost from boost.org..."
    # "https://github.com/boostorg/boost/archive/boost-1.72.0.tar.gz"
    # "https://dl.bintray.com/boostorg/release/1.72.0/source/boost_1_72_0.tar.bz2"
    wget -P ${SDK_PATH} "https://github.com/boostorg/boost/archive/boost-1.72.0.tar.gz" \
    || {
      echo "Download failed.."
      return 1
    }
  }

  mkdir ${SDK_PATH}/boost-sdk
  tar -C ${SDK_PATH}/boost-sdk --strip-components=1 -xvf "${SDK_PATH}/boost-1.72.0.tar.gz" || return 1

  return 0
}

get_openssl_source() {
  local SDK_PATH=$1
  [ -z ${SDK_PATH} ] && { echo "get_openssl_source: Missing SDK_PATH parameter..."; return 1; }

  [ "$(basename ${SDK_PATH})" = "openssl-sdk" ] \
  && {
    rm -fr ${SDK_PATH}
    SDK_PATH=$(dirname ${SDK_PATH})
  }
  
  [ -d ${SDK_PATH} ] || { echo "get_openssl_source: Missing directory: ${SDK_PATH}"; return 1; }

  [ -f ${SDK_PATH}/OpenSSL_1_1_1d.tar.gz ] \
  || {
    echo "Downloading openssl source from GitHub..."
    wget -P ${SDK_PATH} "https://github.com/openssl/openssl/archive/OpenSSL_1_1_1d.tar.gz" \
    || {
      echo "Download failed.."
      return 1
    }
  }

  mkdir ${SDK_PATH}/openssl-sdk
  tar -C ${SDK_PATH}/openssl-sdk --strip-components=1 -xvf ${SDK_PATH}/OpenSSL_1_1_1d.tar.gz || return 1

  return 0
}