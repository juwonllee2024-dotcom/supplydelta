# Contributing

Thanks for helping make dependency review easier to understand.

## Before opening a change

1. Read the [design specification](docs/superpowers/specs/2026-10-08-supplydelta-design.md).
2. Keep the core comparison deterministic and offline.
3. Add a regression test before changing behavior.
4. Do not add package execution, telemetry, credential access, or automatic installation.

## Local checks

```bash
npm ci --ignore-scripts
npm run verify
npm audit --audit-level=high
```

## Pull requests

Explain the user-visible problem, the smallest behavior change, and the exact verification commands. New signals should include examples and a false-positive discussion. Avoid presenting a heuristic as a security guarantee.

