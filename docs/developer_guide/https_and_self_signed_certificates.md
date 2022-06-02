# HTTPS and self-signed certificates

## Enable Daemon and Wallet RPC SSL

1. `cd /path/to/monero_cli`
2. Generate certificates for daemon RPC (set password, use defaults except common name "localhost"): `openssl req -x509 -newkey rsa:4096 -keyout daemon-rpc-key.pem -out daemon-rpc-cert.pem -days 365`
3. Generate certificates for wallet RPC (set password, use defaults except common name "localhost"): `openssl req -x509 -newkey rsa:4096 -keyout wallet-rpc-key.pem -out wallet-rpc-cert.pem -days 365`
4. Start daemon RPC with SSL and enter password, e.g.: `./monerod --stagenet --rpc-login superuser:abctesting123 --rpc-access-control-origins https://localhost:9100 --rpc-ssl enabled --rpc-ssl-private-key daemon-rpc-key.pem --rpc-ssl-certificate daemon-rpc-cert.pem`
5. Start wallet RPC with SSL and enter password, e.g.: `./monero-wallet-rpc --daemon-address https://localhost:38081 --daemon-login superuser:abctesting123 --stagenet --rpc-bind-port 38083 --rpc-login rpc_user:abc123 --wallet-dir ./ --rpc-access-control-origins https://localhost:9100 --rpc-ssl enabled --rpc-ssl-private-key wallet-rpc-key.pem --rpc-ssl-certificate wallet-rpc-cert.pem`

## Enable SSL in Node.js
1. Change RPC URIs to "https://..."
2. Construct `MoneroWalletRpc` and `MoneroDaemonRpc` with `rejectUnauthorized: false` if using self-signed certificates

## Enable SSL in web application
1. Change RPC URIs to "https://..."
2. Generate certificates for localhost web app (set password, use defaults except common name "localhost"), e.g.: `openssl req -x509 -newkey rsa:4096 -keyout localhost-key.pem -out localhost-cert.pem -days 365`
    Note: dev certificates are already committed to src/test/browser with password `abctesting123`
3. Modify run_server.py to use generated certificates by uncommenting commented lines
4. Run ./bin/start_browser_test_server.sh and enter certificate password
5. Test in Chrome: chrome://flags/#allow-insecure-localhost, set "Allow invalid certificates for resources loaded from localhost." to "Enabled"
6. Test in Firefox: authenticate with https://localhost:38081/json_rpc and https://localhost:38083/json_rpc first, then access https://localhost:9100/