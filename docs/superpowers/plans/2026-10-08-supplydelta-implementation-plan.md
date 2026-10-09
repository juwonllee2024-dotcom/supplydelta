# SupplyDelta Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a read-only npm package trust-surface diff CLI that compares two local package artifacts and produces bounded human/JSON review output.

**Architecture:** TypeScript library layers: source loader → normalized package snapshot → deterministic delta engine → renderers/CLI. The loader accepts directories and `.tgz` archives; the comparison core has no filesystem or process side effects.

**Tech Stack:** Node.js 18+, TypeScript, Vitest, `tar` for guarded archive inspection, npm package bin.

**Spec:** `docs/superpowers/specs/2026-10-08-supplydelta-design.md`

## Global Constraints

- Never execute package lifecycle scripts.
- Never use shell interpolation with user input.
- Keep the runtime local and telemetry-free.
- Keep the report bounded and explicit about heuristic limits.
- Existing user repositories are out of scope; this new repository is isolated.

## Review Focus

- Correct lifecycle hook classification.
- Stable JSON schema and deterministic ordering.
- Safe archive path handling.
- Exit code behavior for CI gates.
- No accidental network or install side effects.

## Tasks

- [ ] Create package metadata, TypeScript config, license, and test runner.
- [ ] Write pure comparison tests first and confirm RED.
- [ ] Implement normalized snapshots, capability signals, and delta scoring.
- [ ] Implement directory and guarded tarball loading.
- [ ] Implement CLI rendering, JSON mode, help, and fail gates.
- [ ] Add fixtures, README, contribution/security docs, CI, and verification record.
- [ ] Run fresh typecheck, lint, unit tests, build, package smoke test, audit, and diff checks.
- [ ] Commit, push, tag, and publish the v0.1.0 GitHub release after all checks pass.

