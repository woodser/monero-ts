const assert = require("node:assert/strict");
const fs = require("node:fs");

/** Validate a stable release and, optionally, its exact npm pack manifest. */
function checkRelease(pkg, lock, tag, packed) {
  assert.equal(pkg.name, "monero-ts", "Unexpected package name");
  assert.match(pkg.version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, "Only stable numeric versions are supported");
  assert.equal(pkg.version.trim(), pkg.version, "Version must not contain surrounding whitespace");
  assert.equal(pkg.private, false, "Package must explicitly be public");
  assert.equal(pkg.license, "MIT", "Unexpected package license");
  assert.equal(lock.version, pkg.version, "Lockfile version differs from package.json");
  assert.equal(lock.packages[""].version, pkg.version, "Lockfile root package version differs");
  if (tag !== undefined) {
    assert.ok(tag === pkg.version || tag === `v${pkg.version}`, "Release tag differs from package version");
  }
  if (packed !== undefined) {
    assert.equal(packed.length, 1, "Expected exactly one package");
    const pack = packed[0];
    assert.equal(pack.name, pkg.name);
    assert.equal(pack.version, pkg.version);
    assert.equal(pack.filename, `monero-ts-${pkg.version}.tgz`, "Unexpected archive path");
    const files = new Set(pack.files.map(file => file.path));
    for (const required of ["package.json", "README.md", "LICENSE.txt", "dist/index.js", "dist/index.d.ts", "dist/monero.js", "dist/monero.worker.js"]) {
      assert.ok(files.has(required), `Missing required package file: ${required}`);
    }
    for (const file of files) {
      assert.ok(!/(^|\/)(\.env(?:\..*)?|\.npmrc|test_wallets|\.localnet|\.git)(\/|$)/.test(file), `Private file in package: ${file}`);
      assert.ok(!file.startsWith("dist/src/test/"), `Test code in package: ${file}`);
    }
  }
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    assert.ok(args.length === 0 || (args.length === 2 && args[0] === "--pack"), "Usage: node bin/check_release.cjs [--pack pack-result.json]");
    const pkg = JSON.parse(fs.readFileSync("package.json"));
    const lock = JSON.parse(fs.readFileSync("package-lock.json"));
    const packed = args.length ? JSON.parse(fs.readFileSync(args[1])) : undefined;
    if (!args.length) assert.ok(process.env.RELEASE_TAG, "RELEASE_TAG is required");
    checkRelease(pkg, lock, process.env.RELEASE_TAG, packed);
    console.log(packed ? "Release archive passed package checks" : "Release metadata passed checks");
  } catch (error) {
    console.error(`Release check failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { checkRelease };
