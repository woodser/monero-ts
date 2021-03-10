#!/usr/bin/env bash

# initialize submodules recursively
git submodule update --init --force --recursive

# update monero-project
cd ./external/monero-project
git checkout tags/pr_7321
git pull --ff-only origin tags/pr_7321
cd ../../