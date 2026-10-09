# Security Policy

## Scope

SupplyDelta statically compares npm package directories and `.tgz` artifacts. It intentionally does not install or execute the package under review.

## Reporting a vulnerability

Please do not open a public issue for a security-sensitive report. Use GitHub's private vulnerability reporting for this repository when available. If it is unavailable, open a minimal issue asking for a private contact without including exploit details.

Include:

- the SupplyDelta version;
- operating system and Node.js version;
- the smallest safe reproduction;
- expected and observed behavior.

## Security limits

- A `clean` report is not a malware verdict.
- Heuristic capability signals can miss behavior or produce false positives.
- Archive inspection rejects traversal and symlink entries and limits archive size/count, but it is not a general sandbox.
- Do not pass untrusted paths to other commands or scripts merely because SupplyDelta produced a report.

