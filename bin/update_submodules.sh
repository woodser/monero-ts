#!/usr/bin/env bash

# initialize submodules recursively
git submodule update --init --recursive

# update monero-cpp
cd ./external/monero-cpp
git checkout tags/v0.5.2
git pull --ff-only origin tags/v0.5.2

# update monero-project
cd ./external/monero-project
git checkout tags/pr_7321
git pull --ff-only origin tags/pr_7321
cd ../../../../