#!/usr/bin/env bash

# initialize submodules recursively
git submodule update --init --recursive

# update monero-core
cd ./external/monero-core
git checkout tags/v0.16.0.3
git pull --ff-only origin tags/v0.16.0.3
cd ../../