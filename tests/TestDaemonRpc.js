const assert = require("assert");
const MoneroDaemonRpc = require("../src/daemon/MoneroDaemonRpc");

let daemon; // daemon to test

before(function() {
  daemon = new MoneroDaemonRpc({ port: 38081, user: "superuser", pass: "abctesting123", protocol: "http" });
})

beforeEach(function() {
});

describe("Daemon", function() {
  it("Has a height", async function() {
    let height = await daemon.getHeight();
    assert(height, "Height must be initialized");
    assert(height > 0, "Height must be greater than 0");
  });
});