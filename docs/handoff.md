# Handoff — Doubtfire

## Current state

Phase 1 implementation and deployment are complete. The repository contains the Next.js scaffold, Postgres schema and migration, Clerk access guard, PWA assets, language toggle, crawler controls, tests, CI, and Railway deployment configuration.

The production app runs on Railway in EU West with Postgres in the same region. Cloudflare serves the custom app domain. Clerk production uses Restricted mode and one predefined account. Production sign-in works.

The repository owner accepted installation and sign-in from the iPhone home screen on 2026-08-06. Android tablet acceptance is deferred. The iPhone repeat sign-in check after Clerk's seven-day session lifetime remains open.

## Read these files first

1. [`CONTEXT.md`](../CONTEXT.md) defines the domain language.
2. [`docs/implementation-plan.md`](./implementation-plan.md) defines the stack and delivery phases.
3. [`docs/adr`](./adr/) contains the settled decisions.
4. [`docs/private-deployment.md`](./private-deployment.md) defines the access and deployment controls.

## Deployment follow-up

Confirm the iPhone repeat sign-in experience after Clerk's seven-day session lifetime. This check does not block product work.

## Current product work

Phase 2 provides authenticated content management. Use Settings to add, edit, move, and archive Routines, Rooms, and Tasks. Groups are optional labels on Tasks. Do not add real household content to the repository.

## Product constraints

- This is a two-person app with one shared Clerk account. Do not add a users table or per-person attribution.
- Do not show progress denominators, lateness, or cleaning debt outside Statistics.
- A Task that is not Ticked is not a failure.
- Run the app as a persistent container. Later phases require SSE and Postgres `LISTEN/NOTIFY`.
- The PWA has no service worker and no offline cache.
- The language toggle changes app chrome only. It never translates Task content.
- The public repository must contain only invented household content.

## Items that need the repository owner

- Confirm the iPhone repeat sign-in experience after seven days.
- Decide which advanced organization controls are useful after several weekends of real use.

## Credentials

Development credentials exist only in the ignored `.env.local` file. Production credentials exist only in Railway. Do not copy production keys into local files, GitHub Actions, documentation, or commits.
