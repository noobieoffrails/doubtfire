# Handoff — Doubtfire (household cleaning PWA)

**Workspace:** the repository root. Currently contains documentation only — no code, no git repo, no package.json. Greenfield.

**What happened in the previous session:** a full design interview (`/grill-with-docs`). No implementation was attempted. The output is the glossary, the plan, four ADRs and one fixture — those are the spec, and this handoff deliberately does not restate them.

## Read these first, in order

1. [`CONTEXT.md`](../CONTEXT.md) — the glossary. Routine, Task, Room, Group, Cadence, Run, Tick, Due, Presented, Ignored, Archived. Each has an `_Avoid_` list; honour it in code, UI copy and commits.
2. [`docs/implementation-plan.md`](./implementation-plan.md) — stack, schema, six phases, out-of-scope list.
3. [`docs/adr/0001`–`0004`](./adr/) — the four decisions that shape everything. Each ends with a "Settled, do not re-open" section.
4. [`fixtures/example-cleaning-list.md`](../fixtures/example-cleaning-list.md) — invented content that defines the import format and is the default seed. The repository ships no real household data; a real list is passed to the seed command by path from outside the repo.

## Where to start

**Phase 1 (scaffold)** in the plan. Nothing precedes it.

The one gating check in phase 1 is easy to skip and expensive to discover late: confirm Clerk sessions survive weeks of tablet idling. The whole auth design (ADR-0003) assumes a tablet that stays signed in between cleans.

## Things a fresh agent will get wrong without warning

- **This is a two-person app with one shared account.** Do not add a users table, tenant scoping, or "who did this" anywhere. It looks like an omission; it is ADR-0003.
- **No progress bars, no `12/38`, no "you're 4 days late".** Counters start at zero and only go up. This will feel like missing polish. It is ADR-0002, and it is the most distinctive thing about the product.
- **Un-ticked tasks are not failures and there is no postpone feature.** ADR-0001.
- **Must deploy as a persistent container, not serverless** — SSE and `LISTEN/NOTIFY` need long-lived connections.
- **The PWA requirement is purely cosmetic** — manifest, icons, theme colour, standalone display. No service worker, no offline caching.
- **The language toggle covers app chrome only.** Task text is content and is never translated — it displays exactly as the seeded list wrote it. The shipped fixture is English; the household's own list is Finnish.
- **The repository is public and holds no real household content.** Use the invented fixture for examples, tests and defaults. Never commit, inline or quote a real room name or task.

## Open items needing the user, not the agent

- **The phase 2 import diff**, when a real list is imported. Roughly a dozen nested bullets are genuinely ambiguous between Group heading, Task and Note, and one tier says "plus all of the above" without meaning it. Produce a two-column diff and get it reviewed before writing to the database. Building and testing the parser against the fixture needs nobody.
- **One small content call awaiting confirmation:** a personal-name prefix was dropped from one task during the earlier import review, since the app has no attribution. Flagged to the user; not yet confirmed.
- **Phase 5 scope.** CRUD is sequenced before Statistics at the user's explicit request. The plan suggests a few weekends of real use after phase 4 first, which will likely shrink what "full CRUD" needs to mean. Raise this at the phase 4/5 boundary rather than silently building everything.

## Working style

The user wants design questions **one at a time**, not batched rounds, each with a recommended answer. They are a developer, decide quickly, and prefer a clear recommendation over a survey of options. They respond well to being told when a premise conflicts with their own data.

## Credentials

None exist yet. Railway, Clerk and Postgres all need provisioning in phase 1 — no keys have been generated or shared, and none appear in any committed file.

## Suggested skills

- **`wizard`** — for phase 1. Railway project setup, Postgres provisioning, and Clerk app creation with long-lived session config are all dashboard steps only the user can perform. Generate a walkthrough rather than guessing at their console state.
- **`domain-modeling`** — keep `CONTEXT.md` current as terms firm up during the build, and add ADRs if a phase forces a genuinely new trade-off. Do not use it to revisit the four settled decisions.
- **`tdd`** — the due-ness engine (`due(task)`, transitive `includes` resolution, the 04:00 rollover, "Ignored = missed a full cadence cycle") is pure logic with fiddly date arithmetic and no UI. Best thing in the codebase to drive test-first.
- **`prototype`** — before committing to the phase 3 run view (room grid → room detail), if its feel is in doubt. UX was called crucial and this is the screen that carries it.
- **`code-review`** — at each phase boundary. Ask it to check ADR-0002 compliance specifically; denominators and lateness copy creep back in easily.
- **`init`** — once code exists, to write `CLAUDE.md`. It should point at `CONTEXT.md` and the ADRs rather than restating them.
