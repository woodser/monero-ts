#!/bin/sh

mkdir -p build && 
cd build && 
cmake .. && 
cmake --build . && 
make .