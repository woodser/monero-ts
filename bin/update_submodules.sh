#!/usr/bin/env bash

[ -d external ] \
|| {
  mkdir external
  git submodule add -f https://github.com/woodser/monero-cpp-library.git external/monero-cpp-library
}

git submodule update --init --recursive
git submodule foreach --recursive git fetch
git submodule foreach --recursive git checkout master
git submodule foreach --recursive git pull --ff-only origin master
