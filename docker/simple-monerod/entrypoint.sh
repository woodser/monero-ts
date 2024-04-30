#!/bin/sh
# Credit for the bulk of this entrypoint script goes to cornfeedhobo
# Source is https://github.com/cornfeedhobo/docker-monero/blob/master/entrypoint.sh
set -e

# Set require --non-interactive flag
set -- "monerod" "--non-interactive" "$@"

# Configure NUMA if present for improved performance
if command -v numactl >/dev/null 2>&1; then
    numa="numactl --interleave=all"
    set -- "$numa" "$@"
fi
# Start the daemon using fixuid
# to adjust permissions if needed
exec fixuid -q "$@"
