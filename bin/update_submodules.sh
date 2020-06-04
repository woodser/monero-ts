#!/usr/bin/env bash

# update monero-javascript
git submodule update --init
git checkout master
git pull --ff-only origin master

# update monero-cpp
cd ./external/monero-cpp
git submodule update --init
git checkout master
git pull --ff-only origin master

# update monero-core
cd ./external/monero-core
git submodule update --init
git checkout master
git pull --ff-only origin master
cd ../../../../