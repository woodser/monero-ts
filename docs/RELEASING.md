# Publishing monero-ts from GitHub Releases

The `release.yml` workflow publishes stable releases to npm from the
`woodser/monero-ts` repository. It does not publish on a push, pull request,
workflow dispatch, draft release, prerelease, or from a fork.

## One-time maintainer setup

In the **monero-ts** package settings on npm, configure a GitHub Actions trusted
publisher with:

| Field | Value |
|---|---|
| Organization or user | `woodser` |
| Repository | `monero-ts` |
| Workflow filename | `release.yml` |
| Environment | `npm` |

The package owner must configure this; contributors do not need an npm token.
If direct publishing permission is selectable, permit `npm publish` for this
publisher. Configure the GitHub `npm` environment with any required release
reviewers. The job has only `contents: read` and `id-token: write` permissions.

Trusted publishing requires npm 11.5.1+ and Node 22.14.0+ per the
[npm documentation](https://docs.npmjs.com/trusted-publishers/). The workflow uses
Node 22 and installs npm 11.5.1 explicitly. Provenance is attached at publish time.

## Release process

1. Update `package.json` and the lockfile to the same stable version. Commit the
   intended `dist/monero.js` WebAssembly bundle as usual; the existing CI dist job
   builds it separately. This release workflow does not rebuild the C++ bundle.
2. Create a matching tag (`v0.11.16` or `0.11.16` for package version `0.11.16`).
3. Publish a non-prerelease GitHub Release for that tag.
4. The workflow checks the metadata, installs locked dependencies, checks types,
   rebuilds CommonJS and the web worker, and runs the utility tests offline.
5. It packs an archive, validates required payload and excludes known private/test
   paths, retains it as an Actions artifact, and publishes that exact archive.

No token-presence condition silently skips a release. Misconfigured OIDC trust,
a version already on npm, build/test failures, or missing distribution files make
the job fail. Inspect the failed step before rerunning. A published npm version is
immutable; use a new version for changed package contents.

## Local validation without publishing

```sh
node --test bin/check_release.test.cjs
RELEASE_TAG=v0.11.15 node bin/check_release.cjs
npm ci --ignore-scripts
npx tsc --noEmit
npm run build_commonjs
npm run build_web_worker
npm test -- --grep "TEST MONERO UTILITIES"
npm pack --json > pack-result.json
node bin/check_release.cjs --pack pack-result.json
```

Use the actual package version in `RELEASE_TAG`. These commands do not publish.
The release guard checks package/tag/lock consistency, package identity/license,
archive filename, required JS/type/license files, and accidental private/test
paths. It is not a general secret scanner or a test of all runtime behavior.

## Scope relative to bounty #208

This completes a missing release-publishing piece alongside the existing
`ci.yml` build/dist jobs. It does **not** claim to complete #208's full daemon/wallet
integration-test environment. PR #209 by mainnet-pat already proposed that wider
work and remains open. This contribution is independently written against current
master and does not replace the original contributor's work or claim their share
of any bounty. The maintainer decides whether this contribution merits a share.
