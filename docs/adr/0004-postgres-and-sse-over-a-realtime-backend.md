# Postgres with SSE, rather than a hosted real-time backend

Real-time sync between a phone and a tablet is a requirement, which makes a hosted reactive backend the obvious candidate. We chose Postgres on Railway with Drizzle instead, pushing changes to clients over SSE driven by `LISTEN/NOTIFY`.

Two reasons, both about fit rather than cost. Statistics is an exploratory feature whose questions are not yet known, and Postgres answers those in ad-hoc SQL rather than as a function to write, index and deploy per question. And the app's real-time problem — two devices watching one list — is the easiest kind there is, so a platform built to solve it well would have saved effort in the wrong place while splitting hosting across two providers.

## Consequences

- **The Next.js app must run as a persistent container**, never serverless: SSE and `LISTEN/NOTIFY` both need long-lived connections. Railway does this natively.
- **Statistics are written as SQL.** That is the point of the choice.
- **Ticks are optimistic locally and confirmed by the server.** If the app is killed while offline, unsynced Ticks are lost; carry-over means the Task simply appears Due again.

## Settled, do not re-open

- **Local-first with a sync engine** — doubles the data layer, and offline is out of scope. Both devices are on one home wifi network, so the failure mode is seconds of flakiness, covered by optimistic UI.
- **Effect** — the app has a form, a list and a subscription. None of its strengths in concurrency, retries or resource lifecycles apply here.
