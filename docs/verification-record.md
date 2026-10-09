# Verification record

**Release target:** `v0.1.0`  
**Recorded:** 2026-10-08

This file is updated only from fresh command output before release.

## Commands

| Check | Result |
| --- | --- |
| `npm ci --ignore-scripts --no-audit` | PASS — 153 packages installed; lifecycle scripts disabled |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm test` | PASS — 2 files, 4 tests |
| `npm run build` | PASS |
| package smoke test | PASS — guarded `.tgz` artifacts compared; human and JSON output verified |
| `--fail-on install-script` gate | PASS — expected exit code `1` for the deliberate hook addition |
| clean `--fail-on any-change` gate | PASS — exit code `0` for identical artifacts |
| `npm audit --audit-level=high` | PASS — 0 vulnerabilities |
| secret-pattern scan with `rg` | PASS — no matches |
| `git diff --check` | pending staged final run |

## Recorded smoke input

The final smoke test compares `test/fixtures/old-package` with `test/fixtures/new-package`. The new fixture contains a `postinstall` hook with a network-shaped string. SupplyDelta must report `HIGH-ATTENTION`, the added hook, the network signal, and the added dependency without executing `install.js`.

## Limitations

- No claim of malware detection or complete behavior analysis.
- Registry download convenience is intentionally not part of v0.1.0; callers can create artifacts with `npm pack --ignore-scripts`.
- On this Windows host, `npm pack --ignore-scripts` terminated with exit `-1073741502` before producing an artifact. The archive smoke used Node's `tar` API instead; no package lifecycle script ran. This is a host/npm issue, not a SupplyDelta result.
- GitHub Actions and release URLs are recorded after remote publication.

