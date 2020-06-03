#!/usr/bin/env bash

git submodule update --init --recursive
git submodule foreach --recursive git fetch
git submodule foreach --recursive git pull
