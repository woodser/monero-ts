#!/usr/bin/env bash

# initialize submodules recursively
git submodule update --init --recursive

# update monero-core
cd ./external/monero-core
git checkout master
git pull --ff-only origin master
cd ../../