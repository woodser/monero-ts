#!/bin/sh

# docker buildx build --build-arg="NPROC=6" --progress plain -t mainnetpat/monerod:v0.18.3.2 --platform linux/arm64/v8 --load .
# docker buildx build --build-arg="NPROC=6" --progress plain -t mainnetpat/monerod:v0.18.3.2 --platform linux/amd64 --load .

docker buildx build --build-arg="NPROC=6" --progress plain -t mainnetpat/monerod:v0.18.3.2 --platform linux/arm64/v8,linux/amd64 --push .
