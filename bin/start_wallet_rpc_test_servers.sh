#!/bin/sh

# build commonjs
npm run build_commonjs || exit 1

# run monero-wallet-rpc servers until terminated
node ./dist/src/test/utils/RunWalletRpcTestServers.js