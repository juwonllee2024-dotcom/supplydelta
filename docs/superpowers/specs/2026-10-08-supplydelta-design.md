# SupplyDelta Design Specification

**Date:** 2026-10-08  
**Status:** Self-reviewed for autonomous MVP implementation  
**Product sentence:** See how a package update changes its install-time trust surface before you approve it.

## Problem

Dependency diffs show names and versions, but an update can also change what happens on a developer's machine during installation. npm documents lifecycle hooks such as `preinstall`, `install`, `postinstall`, and `prepare`; reviewing those changes by hand is slow and easy to skip. The existing tools found during research either compare lockfiles, scan one package, or rely on a hosted security service. SupplyDelta tests a narrower, reviewable question: **what changed between these two package artifacts before either artifact is installed?**

## Users

- JavaScript maintainers reviewing a dependency update.
- Developers using AI coding agents that suggest a new package or version.
- CI authors who want a small, offline, explainable gate for package artifacts.

## Core flow

1. Obtain two package directories or tarballs without executing package lifecycle scripts.
2. Run `supplydelta diff <before> <after>`.
3. Read one bounded report showing lifecycle scripts, suspicious capability signals, dependencies, files, and a review level.
4. Use `--json` in CI or `--fail-on install-script` to block newly added or changed install hooks.

## MVP boundaries

### In scope

- npm package directories and `.tgz` artifacts.
- Deterministic comparison of `package.json`, lifecycle scripts, dependencies, package files, file sizes, and SHA-256 file fingerprints.
- Explainable heuristic signals in changed lifecycle script text.
- Human-readable and JSON output.
- Non-zero CI exit code for configured review gates.
- No package code execution, no registry credentials, no telemetry, and no automatic install.

### Out of scope

- Malware verdicts, vulnerability database lookups, author reputation, or provenance verification.
- AST/data-flow analysis.
- Python, Ruby, Rust, or container packages in the first release.
- Automatic allowlisting, installing, deleting, or changing a user's project.

## Safety contract

- Never invoke package lifecycle scripts.
- Never use a shell string for user-provided package paths.
- Only read the supplied directory or archive and write to an operating-system temporary directory during archive inspection.
- Reject archive paths that are absolute, traverse with `..`, or contain symlink entries.
- Make clear that a clean result is not proof of safety.

## Output contract

The report has stable sections:

- `REVIEW LEVEL`: `clean`, `notice`, or `high-attention`.
- `INSTALL SCRIPTS`: additions, removals, and changes to npm lifecycle hooks.
- `CAPABILITY SIGNALS`: conservative text signals such as network, environment, shell, or credential paths.
- `DEPENDENCIES`: added, removed, and changed dependency declarations.
- `FILES`: added, removed, changed, and total file counts.
- `LIMITS`: explicit statement that SupplyDelta is static and not a malware detector.

JSON mirrors those facts and includes `schemaVersion: 1` for automation.

## Experiment

Seven-day experiment: give the command and a deliberately changed fixture package to five JavaScript maintainers. Success is at least three people saying the one-screen report changed what they would approve, plus one request for a package-manager integration. The first public artifact should make that experiment possible without a cloud account.

## Alternatives considered

- A generic terminal-output compressor was rejected because RTK, chop, probe, and other current projects already solve that adjacent problem.
- A browser resume tool was rejected because the category is crowded and does not fit the user's existing OSS direction.
- A single-package malware scanner was rejected because it overclaims and overlaps existing security scanners.

## Self-review

- **Scope:** small enough to implement and test in one run.
- **Novelty:** version-to-version trust-surface delta, not a generic vulnerability scan or lockfile diff.
- **Safety:** read-only analysis; no install, no script execution, no network required for the MVP.
- **Failure mode:** archive inspection errors stop with a clear message; no partial approval is emitted.
- **Adoption hook:** local CLI, JSON output, and a CI gate make the first use one command.

