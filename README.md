# SupplyDelta

## See what a package update can do before you approve it. 📦🔍

`npm diff` tells you which files changed. `SupplyDelta` tells you whether the **install-time trust surface** changed too: lifecycle hooks, capability-shaped command text, dependencies, files, and implicit native builds.

```text
SupplyDelta — package trust-surface diff
demo-widget@1.0.0  →  demo-widget@1.1.0

REVIEW LEVEL: HIGH-ATTENTION

INSTALL SCRIPTS
  + postinstall: node install.js && fetch('https://example.test')

CAPABILITY SIGNALS
  ! postinstall: network

DEPENDENCIES
    + tiny-helper [dependencies]: 2.0.0
```

No account. No cloud service. No package installation. No lifecycle script execution.

## Why this exists

Dependency updates are usually reviewed as a version bump or a lockfile diff. But npm lifecycle hooks can run during installation, and a version update can quietly add or change one. SupplyDelta creates a small, reviewable delta **before** approval so a maintainer can decide what deserves a closer look.

It is deliberately not a malware detector. A clean result means “no observed change in the signals SupplyDelta checks,” not “safe.”

## Quick start

```bash
npm install --save-dev supplydelta

# Compare two package directories.
npx supplydelta diff ./package-before ./package-after

# Or create reviewable tarballs without running package scripts, then compare them.
npm pack --ignore-scripts --pack-destination ./artifacts demo-widget@1.0.0
npm pack --ignore-scripts --pack-destination ./artifacts demo-widget@1.1.0
npx supplydelta diff ./artifacts/demo-widget-1.0.0.tgz ./artifacts/demo-widget-1.1.0.tgz
```

The first input is the older artifact; the second is the proposed artifact.

## CI gate

```bash
supplydelta diff --fail-on install-script before.tgz after.tgz
supplydelta diff --json before.tgz after.tgz > supplydelta.json
```

Exit codes:

- `0` — report generated and the selected gate passed.
- `1` — a selected `--fail-on` gate detected a change.
- `2` — invalid input or an inspection error.

## What is compared

- npm lifecycle hooks: `preinstall`, `install`, `postinstall`, and `prepare`.
- Conservative text signals in changed hooks: network, environment, shell, credential paths, and obfuscation.
- `dependencies`, `optionalDependencies`, and `peerDependencies`.
- Package file additions, removals, changes, sizes, and SHA-256 fingerprints.
- `binding.gyp` changes that may trigger npm's implicit native build behavior.

The human report is bounded. `--json` emits `schemaVersion: 1` for automation.

## Safety boundary

SupplyDelta is read-only and local-first:

- It reads a package directory or `.tgz` archive; it never runs package code.
- Archive paths are checked for traversal, absolute paths, symlinks, file-count limits, and a 50 MiB inspection limit.
- User-supplied paths are passed to filesystem APIs without shell interpolation.
- It does not send telemetry, read registry credentials, install dependencies, or modify the project being reviewed.

## What it is not

SupplyDelta does not prove that a package is safe, replace `npm audit`, verify provenance, inspect every code path, or report known vulnerabilities. Treat `high-attention` as a prompt to review the artifact—not as a verdict.

## Development

```bash
npm ci --ignore-scripts
npm run verify
npm audit --audit-level=high
```

The pure comparison engine is independent of filesystem and process I/O, which keeps the important behavior deterministic and testable.

## Design and research

- [Design specification](docs/superpowers/specs/2026-10-08-supplydelta-design.md)
- [Implementation plan](docs/superpowers/plans/2026-10-08-supplydelta-implementation-plan.md)
- [Market and founder research](docs/research/2026-10-08-market-and-founder.md)
- [Verification record](docs/verification-record.md)

## License

MIT © 2026 juwonllee2024-dotcom

