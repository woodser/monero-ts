const assert = require("node:assert/strict");
const { test } = require("node:test");
const { checkRelease } = require("./check_release.cjs");

function fixture() {
  return {
    pkg: { name: "monero-ts", version: "1.2.3", private: false, license: "MIT" },
    lock: { version: "1.2.3", packages: { "": { version: "1.2.3" } } },
    pack: [{ name: "monero-ts", version: "1.2.3", filename: "monero-ts-1.2.3.tgz", files: ["package.json", "README.md", "LICENSE.txt", "dist/index.js", "dist/index.d.ts", "dist/monero.js", "dist/monero.worker.js"].map(path => ({ path })) }]
  };
}
test("accepts exact stable tags, with or without v", () => {
  const { pkg, lock, pack } = fixture();
  checkRelease(pkg, lock, "1.2.3", pack);
  checkRelease(pkg, lock, "v1.2.3", pack);
});
test("rejects tag mismatch and tag-shaped shell input", () => {
  const { pkg, lock } = fixture();
  for (const tag of ["v1.2.4", "v1.2.3;echo bad", "main", ""]) assert.throws(() => checkRelease(pkg, lock, tag));
});
test("rejects prereleases and malformed package versions", () => {
  for (const version of ["1.2.3-beta.1", "01.2.3", "1.2.3\n", "../../bad"]) {
    const { pkg, lock } = fixture(); pkg.version = version;
    assert.throws(() => checkRelease(pkg, lock, version));
  }
});
test("rejects stale lock metadata", () => {
  const { pkg, lock } = fixture(); lock.packages[""].version = "1.2.2";
  assert.throws(() => checkRelease(pkg, lock, "v1.2.3"));
});
test("rejects unexpected package name, visibility or license", () => {
  for (const [key, value] of [["name", "other"], ["private", true], ["license", "UNLICENSED"]]) {
    const { pkg, lock } = fixture(); pkg[key] = value;
    assert.throws(() => checkRelease(pkg, lock, "v1.2.3"));
  }
});
test("rejects missing binary/type/license payload", () => {
  const { pkg, lock, pack } = fixture(); pack[0].files.pop();
  assert.throws(() => checkRelease(pkg, lock, "v1.2.3", pack));
});
test("rejects private or test material", () => {
  for (const path of [".env", "dist/.env.local", ".npmrc", "test_wallets/keys", ".localnet/wallet", "dist/src/test/TestAll.js"]) {
    const { pkg, lock, pack } = fixture(); pack[0].files.push({ path });
    assert.throws(() => checkRelease(pkg, lock, "v1.2.3", pack));
  }
});
test("rejects archive paths and multiple packed packages", () => {
  const { pkg, lock, pack } = fixture(); pack[0].filename = "../other.tgz";
  assert.throws(() => checkRelease(pkg, lock, "v1.2.3", pack));
  pack.push(pack[0]);
  assert.throws(() => checkRelease(pkg, lock, "v1.2.3", pack));
});
