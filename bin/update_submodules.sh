#!/usr/bin/env bash

# initialize submodules recursively
git submodule update --init --recursive

# update monero-cpp
cd ./external/monero-cpp
git checkout tags/v0.5.0
git pull --ff-only origin tags/v0.5.0

# update monero-project
cd ./external/monero-project
git checkout tags/v0.17.1.9
git pull --ff-only origin tags/v0.17.1.9
cd ../../../../