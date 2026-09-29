import assert from "assert";
import HttpClient from "../main/ts/common/HttpClient";

/**
 * Test HTTP request scheduling without network access or real timers.
 */
export default class TestHttpClient {

  runTests() {
    describe("TEST HTTP CLIENT", function() {
      const client = HttpClient as any;
      let original;
      let now: number;
      let delays: number[];
      let starts: number[];

      beforeEach(function() {
        original = {
          rate: HttpClient.MAX_REQUESTS_PER_SECOND,
          startTimes: client.REQUEST_START_TIMES,
          queues: client.TASK_QUEUES,
          transport: client.axiosDigestAuthRequest,
          now: Date.now,
          setTimeout: globalThis.setTimeout
        };
        HttpClient.MAX_REQUESTS_PER_SECOND = 50;
        client.REQUEST_START_TIMES = [];
        client.TASK_QUEUES = [];
        now = 0;
        delays = [];
        starts = [];
        Date.now = () => now;
        globalThis.setTimeout = ((callback, delay) => {
          delays.push(delay);
          Promise.resolve().then(() => {
            now += Math.floor(delay); // timers truncate fractional delays
            callback();
          });
          return 0;
        }) as any;
        client.axiosDigestAuthRequest = async function(method, uri, username, password, body, proxyUri, rejectUnauthorized, cancelToken) {
          if (cancelToken) cancelToken.throwIfRequested();
          starts.push(now);
          return {status: 200, statusText: "OK", headers: {}, data: "ok"};
        };
      });

      afterEach(function() {
        HttpClient.MAX_REQUESTS_PER_SECOND = original.rate;
        client.REQUEST_START_TIMES = original.startTimes;
        client.TASK_QUEUES = original.queues;
        client.axiosDigestAuthRequest = original.transport;
        Date.now = original.now;
        globalThis.setTimeout = original.setTimeout;
      });

      async function request(host = "rate-limit.test", cancelToken?) {
        return HttpClient.request({uri: "http://" + host + "/rpc", cancelToken: cancelToken});
      }

      it("Can send requests below the limit without timers", async function() {
        for (let i = 0; i < 50; i++) assert.equal((await request()).body, "ok");
        assert.equal(starts.length, 50);
        assert.equal(now, 0);
        assert.deepEqual(delays, []);
      });

      it("Can rate limit queued requests and bound the request history", async function() {
        await Promise.all(Array.from({length: 151}, () => request()));
        for (let i = 0; i < starts.length; i++) assert.equal(starts[i], Math.floor(i / 50) * 1000);
        assert.deepEqual(delays, [1000, 1000, 1000]);
        assert.equal(client.REQUEST_START_TIMES["rate-limit.test"].length, 50);
      });

      it("Can resume an idle host without timers", async function() {
        for (let i = 0; i < 50; i++) await request();
        now = 10000;
        for (let i = 0; i < 50; i++) await request();
        assert.deepEqual(delays, []);
        assert.equal(starts[99], 10000);
      });

      it("Can recheck the rate limit when a timer fires early", async function() {
        const setTimeout = globalThis.setTimeout;
        let firstTimer = true;
        globalThis.setTimeout = ((callback, delay) => setTimeout(() => {
          if (firstTimer) {
            now--;
            firstTimer = false;
          }
          callback();
        }, delay)) as any;
        for (let i = 0; i < 51; i++) await request();
        assert.equal(starts[50], 1000);
        assert.deepEqual(delays, [1000, 1]);
      });

      it("Can rate limit hosts independently", async function() {
        for (let i = 0; i < 50; i++) await request();
        for (let i = 0; i < 50; i++) await request("other.test");
        assert.deepEqual(delays, []);
        assert.equal(starts.length, 100);
      });

      for (const rate of [0.5, 1.5, 2.5, 50.5]) {
        it("Can preserve fractional request rates of " + rate + " per second", async function() {
          HttpClient.MAX_REQUESTS_PER_SECOND = rate;
          const maxRequests = Math.ceil(rate);
          const windowMs = Math.ceil(1000 * maxRequests / rate);
          for (let i = 0; i < maxRequests * 3; i++) await request();
          for (let i = 0; i < starts.length; i++) assert.equal(starts[i], Math.floor(i / maxRequests) * windowMs);
          assert.equal(delays.length, 2);
        });
      }

      it("Can bound the request history for large rates", async function() {
        HttpClient.MAX_REQUESTS_PER_SECOND = Number.MAX_SAFE_INTEGER;
        for (let i = 0; i < 200; i++) {
          await request();
          now += 100;
        }
        assert.deepEqual(delays, []);
        assert.equal(client.REQUEST_START_TIMES["rate-limit.test"].length, 10);
      });

      it("Can disable throttling without retaining request history", async function() {
        await request();
        HttpClient.MAX_REQUESTS_PER_SECOND = Infinity;
        for (let i = 0; i < 200; i++) await request();
        now = 10000;
        await request();
        assert.deepEqual(delays, []);
        assert.equal(client.REQUEST_START_TIMES["rate-limit.test"].length, 0);
      });

      it("Can reject invalid rates and recover the queue", async function() {
        for (const rate of [0, -1, NaN, -Infinity]) {
          HttpClient.MAX_REQUESTS_PER_SECOND = rate;
          await assert.rejects(request(), /Max requests per second must be greater than 0 or Infinity/);
        }
        assert.deepEqual(starts, []);
        HttpClient.MAX_REQUESTS_PER_SECOND = 50;
        assert.equal((await request()).statusCode, 200);
      });

      it("Can cancel a queued request while keeping requests serialized", async function() {
        let release;
        let started;
        const blocked = new Promise<void>(resolve => { release = resolve; });
        const firstStarted = new Promise<void>(resolve => { started = resolve; });
        const transport = client.axiosDigestAuthRequest;
        client.axiosDigestAuthRequest = async function(...args) {
          const response = await transport(...args);
          started();
          await blocked;
          return response;
        };
        const first = request();
        await firstStarted;
        try {
          const cancellation = HttpClient.createCancelToken();
          const second = request("rate-limit.test", cancellation.token);
          cancellation.cancel("cancelled while queued");
          await assert.rejects(second, /cancelled while queued/);
          assert.equal(starts.length, 1);
        } finally {
          release();
          await first;
        }
        assert.equal((await request()).statusCode, 200);
        assert.equal(starts.length, 2);
      });

      it("Can preserve HTTP errors and recover from transport errors", async function() {
        const transport = client.axiosDigestAuthRequest;
        client.axiosDigestAuthRequest = async function() {
          throw {response: {status: 503, headers: {}, data: "unavailable"}};
        };
        assert.equal((await request()).statusCode, 503);
        client.axiosDigestAuthRequest = async function() { throw new Error("offline"); };
        await assert.rejects(request(), /offline/);
        client.axiosDigestAuthRequest = transport;
        assert.equal((await request()).statusCode, 200);
      });

      it("Can cancel a request during a rate limit wait", async function() {
        HttpClient.MAX_REQUESTS_PER_SECOND = 1;
        await request();
        const setTimeout = globalThis.setTimeout;
        let wake;
        let waiting;
        const waitStarted = new Promise<void>(resolve => { waiting = resolve; });
        globalThis.setTimeout = ((callback, delay) => {
          wake = () => {
            now += Math.floor(delay);
            callback();
          };
          waiting();
          return 0;
        }) as any;
        const cancellation = HttpClient.createCancelToken();
        const cancelled = request("rate-limit.test", cancellation.token);
        await waitStarted;
        try {
          cancellation.cancel("cancelled while throttled");
          await assert.rejects(cancelled, /cancelled while throttled/);
          assert.equal(starts.length, 1);
          assert.equal(now, 0);
        } finally {
          globalThis.setTimeout = setTimeout;
          wake();
          await client.TASK_QUEUES["rate-limit.test"].awaitAll();
        }
        assert.equal((await request()).statusCode, 200);
        assert.equal(starts.length, 2);
      });
    });
  }
}
