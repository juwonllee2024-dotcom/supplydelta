# SupplyDelta — market and founder research

**Research date:** 2026-10-08

## Confirmed facts

- GitHub's current Trending page is heavily populated by agent skills, agent memory, and agent workflow tooling. That is a useful signal for developer attention, but it is also a crowded category.
- npm documents that `preinstall`, `install`, `postinstall`, and `prepare` can run during installation. That makes an install-time behavior change a distinct review surface from a version or lockfile change.
- GitHub's dependency review documentation recommends reviewing the source diff too, because dependency review does not expose every source-level change. A small local artifact diff can complement, rather than replace, that review.
- Current adjacent projects include `npm diff`, `pnpm approve-builds`, `npm-script-lens`, and `dep-delta`. They validate demand but also mean SupplyDelta must stay narrow: compare two artifacts, explain install-time deltas, and work offline.

## Four independent invention questions

| Candidate | Pain | Novelty | Build today | Shareability | OSS fit | Decision |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| **SupplyDelta** — version-to-version install trust-surface diff | 5 | 4 | 5 | 4 | 5 | **Selected — 23/25** |
| AnswerFront — bounded result card for long agent/CLI output | 4 | 2 | 5 | 3 | 4 | Reject: RTK, chop, probe, and related tools are already close |
| WhyFile — one-command code archaeology card | 4 | 3 | 4 | 3 | 3 | Reject: whyfile, git-why, and Claude skills already occupy the core promise |
| ReturnPoint — resume any browser page at the exact place left | 4 | 2 | 4 | 3 | 3 | Reject: browser/video resume tools are established and crowded |

### Candidate 1: SupplyDelta

- **Fact:** lifecycle hooks run at package-management boundaries; new versions can alter them.
- **Innovation hypothesis:** maintainers will make better approval decisions when a version update is expressed as a trust-surface delta, not just a file or lockfile diff.
- **One difference:** it compares two package artifacts before installation and highlights behavior-shaped changes without executing code or requiring a service.
- **Smallest 7-day experiment:** ask five JavaScript maintainers to review the deliberate fixture update and measure whether the one-screen report changes their approval decision.

### Candidate 2: AnswerFront

- **Fact:** long tool output consumes agent context and human attention.
- **Innovation hypothesis:** every command should put a bounded result before its evidence.
- **One difference:** a deterministic, model-free result envelope.
- **Smallest experiment:** wrap ten real CI commands and compare review time.
- **Decision:** rejected for this run because existing output compressors and the user's evidence/reporting projects make the novelty and separation weak.

### Candidate 3: WhyFile

- **Fact:** unfamiliar code often requires manual `git log`, blame, and dependency archaeology.
- **Innovation hypothesis:** one factual file card would reduce unsafe edits in legacy code.
- **One difference:** combines history, dependency edges, and ownership in one local output.
- **Smallest experiment:** run on five unfamiliar files and record time to safe edit.
- **Decision:** rejected because public tools already make essentially this promise, including offline and AI-assisted variants.

### Candidate 4: ReturnPoint

- **Fact:** people reopen tabs and videos without remembering where they stopped.
- **Innovation hypothesis:** a local exact-position marker would be used more often than a full bookmark manager.
- **One difference:** saves a place, not just a URL.
- **Smallest experiment:** ten people restore five interrupted pages.
- **Decision:** rejected because browser/video resume is a mature extension category and not a strong fit for this account's open-source audience.

## Business hypothesis

- **First users:** JavaScript maintainers, security-minded teams, and developers reviewing AI-suggested dependency changes.
- **First ten users:** npm/pnpm community discussions, supply-chain security project maintainers, and GitHub Action users who already use dependency review.
- **Retention reason:** dependency updates recur; the command can become a required review gate.
- **Revenue hypothesis:** keep the CLI MIT/free; later offer optional hosted policy history or team reporting, only if users request it. No revenue is assumed.

## Why this candidate is worth shipping

It has a visible before/after demo, a safe local boundary, a small install surface, and a current supply-chain reason to exist. It does not promise 100,000 stars; adoption depends on whether maintainers value the narrower decision and whether integrations make the one-command habit stick.

## Sources

- [GitHub Trending](https://github.com/trending)
- [npm lifecycle scripts](https://docs.npmjs.com/cli/v11/using-npm/scripts/)
- [npm diff](https://docs.npmjs.com/cli/v7/commands/npm-diff/)
- [GitHub dependency review guidance](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/reviewing-dependency-changes-in-a-pull-request)
- [pnpm approve-builds](https://pnpm.io/cli/approve-builds)
- [npm-script-lens](https://github.com/marketplace/actions/npm-script-lens)
- [dep-delta](https://github.com/luoowei/dep-delta)
- [whyfile](https://github.com/heyncth/whyfile)
- [git-why](https://github.com/muin-company/git-why)
- [probe](https://github.com/somudatta06/probe)
- [chop](https://getchop.run/)

