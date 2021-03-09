#!/usr/bin/env bash

# initialize submodules recursively
git submodule update --init --force --recursive

# update monero-project
cd ./external/monero-project
git checkout master
git pull --ff-only origin master
cd ../../