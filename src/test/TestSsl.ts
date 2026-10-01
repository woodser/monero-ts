import assert from "assert";
import axios from "axios";
import GenUtils from "../main/ts/common/GenUtils";
import HttpClient from "../main/ts/common/HttpClient";
import MoneroRpcConnection from "../main/ts/common/MoneroRpcConnection";
import SslOptions from "../main/ts/common/SslOptions";
import ThreadPool from "../main/ts/common/ThreadPool";
import MoneroWalletFull from "../main/ts/wallet/MoneroWalletFull";
import MoneroWalletRpc from "../main/ts/wallet/MoneroWalletRpc";
import MoneroWalletConfig from "../main/ts/wallet/model/MoneroWalletConfig";

/**
 * Test TLS settings without remote daemons or wallets.
 */
export default class TestSsl {

  runTests() {
    describe("TEST SSL", function() {
      describe("HTTP transport", function() {
        let request;
        let calls: any[];

        before(function() {
          if (GenUtils.isBrowser() || GenUtils.isDeno()) this.skip();
        });

        beforeEach(function() {
          request = axios.request;
          calls = [];
          axios.request = (async config => {
            calls.push(config);
            if (calls.length === 1) throw {response: {status: 401, headers: {"www-authenticate": 'Digest realm="monero-rpc",nonce="nonce",qop="auth"'}}};
            return {status: 200, statusText: "OK", headers: {}, data: "ok"};
          }) as any;
        });

        afterEach(function() {
          axios.request = request;
        });

        for (const proxyUri of [undefined, "socks5://127.0.0.1:9050"]) {
          for (const rejectUnauthorized of [false, true, undefined, null]) {
            it("Can preserve TLS and proxy settings through digest authentication: " + proxyUri + ", " + rejectUnauthorized, async function() {
              const response = await HttpClient.request({uri: "https://localhost/json_rpc", username: "user", password: "password", proxyUri, rejectUnauthorized});
              assert.equal(response.body, "ok");
              assert.equal(calls.length, 2);
              assert.equal(calls[0].httpsAgent.options.rejectUnauthorized, rejectUnauthorized !== false);
              assert.strictEqual(calls[1].httpsAgent, calls[0].httpsAgent);
              assert.strictEqual(calls[1].httpAgent, calls[0].httpAgent);
              assert.equal(calls[1].proxy, proxyUri ? false : undefined);
              assert(calls[1].headers.Authorization.startsWith("Digest "));
            });
          }
        }
      });

      it("Can propagate daemon TLS settings to wallet RPC and preserve explicit SSL options", async function() {
        const server = new MoneroRpcConnection("http://localhost:18083");
        let params;
        server.sendJsonRequest = async (method, request) => {
          assert.equal(method, "set_daemon");
          params = request;
        };
        const wallet = new MoneroWalletRpc(new MoneroWalletConfig({server}));
        for (const rejectUnauthorized of [false, true, undefined, null]) {
          const connection = new MoneroRpcConnection({uri: "https://localhost:18081", rejectUnauthorized});
          await wallet.setDaemonConnection(connection);
          assert.strictEqual(params.ssl_allow_any_cert, rejectUnauthorized === false);
          assert.strictEqual((await wallet.getDaemonConnection()).getRejectUnauthorized(), rejectUnauthorized !== false);
          for (const sslOptions of [new SslOptions(), new SslOptions({allowAnyCert: false}), new SslOptions({allowAnyCert: true}), new SslOptions({certificateAuthorityFile: "ca.pem", allowedFingerprints: ["fingerprint"]}), new SslOptions({allowAnyCert: true, allowedFingerprints: ["fingerprint"]})]) {
            const before = JSON.stringify(sslOptions);
            await wallet.setDaemonConnection(connection, undefined, sslOptions);
            assert.strictEqual(params.ssl_allow_any_cert, sslOptions.getAllowAnyCert());
            assert.strictEqual(params.ssl_support, sslOptions.getCertificateAuthorityFile() ? "enabled" : "autodetect"); // a ca file or fingerprints must be enforced
            assert.equal(params.ssl_ca_file, sslOptions.getCertificateAuthorityFile());
            assert.deepEqual(params.ssl_allowed_fingerprints, sslOptions.getAllowedFingerprints());
            assert.equal(JSON.stringify(sslOptions), before);
            assert.strictEqual(connection.getRejectUnauthorized(), rejectUnauthorized);
            const cached = await wallet.getDaemonConnection();
            assert.notStrictEqual(cached, connection);
            assert.strictEqual(cached.getRejectUnauthorized(), sslOptions.getAllowAnyCert() !== true);
            await wallet.setDaemonConnection(cached);
            assert.strictEqual(params.ssl_allow_any_cert, sslOptions.getAllowAnyCert() === true);
          }
        }
        await wallet.setDaemonConnection("https://localhost:18081");
        assert.strictEqual(params.ssl_allow_any_cert, false);
        await wallet.setDaemonConnection();
        assert.strictEqual(params.ssl_allow_any_cert, undefined);
        assert.strictEqual(await wallet.getDaemonConnection(), undefined);
      });

      it("Can snapshot wallet RPC settings before the request and retain them on failure", async function() {
        const connection = new MoneroRpcConnection({uri: "https://localhost:18081", rejectUnauthorized: false});
        const server = new MoneroRpcConnection("http://localhost:18083");
        server.sendJsonRequest = async () => { connection.rejectUnauthorized = true; };
        const wallet = new MoneroWalletRpc(new MoneroWalletConfig({server}));
        await wallet.setDaemonConnection(connection);
        const cached = await wallet.getDaemonConnection();
        assert.strictEqual(cached.getRejectUnauthorized(), false);
        server.sendJsonRequest = async () => { throw new Error("Rejected"); };
        await assert.rejects(wallet.setDaemonConnection(connection), /Rejected/);
        assert.strictEqual(await wallet.getDaemonConnection(), cached);
        assert.strictEqual(cached.getRejectUnauthorized(), false);
      });

      it("Can apply full wallet TLS settings in queue order and preserve them on failure", async function() {
        const wallet = Object.create(MoneroWalletFull.prototype);
        const queue = new ThreadPool(1);
        wallet.rejectUnauthorized = true;
        wallet.cppAddress = 1;
        wallet.module = {
          queueTask: task => queue.submit(task),
          set_daemon_connection: (address, uri, username, password, proxyUri, isTrusted, callback) => callback()
        };
        const pending = queue.submit(async () => assert.strictEqual(wallet.rejectUnauthorized, true));
        const setConnection = wallet.setDaemonConnection({uri: "https://localhost:18081", rejectUnauthorized: false});
        await pending;
        await setConnection;
        assert.strictEqual(wallet.rejectUnauthorized, false);
        wallet.module.set_daemon_connection = () => { throw new Error("connection failed"); };
        await assert.rejects(wallet.setDaemonConnection("https://localhost:18081"), /connection failed/);
        assert.strictEqual(wallet.rejectUnauthorized, false);
      });
    });
  }
}
