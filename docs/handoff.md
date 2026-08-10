# Handoff — Doubtfire

## Current state

Phase 1 implementation and deployment are complete. Phase 2 content management is complete. Phase 3 Run work is ready for review. The repository contains the Next.js app, Postgres schema and migrations, Clerk access guard, PWA assets, language toggle, crawler controls, tests, CI, and Railway deployment configuration.

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

Phase 3 provides the cleaning Run. Home starts or resumes one open Run. The Run uses a Room-first flow, optimistic Ticks, reversible un-Ticks, closing, a 30-second Undo action, and reopening before the Helsinki 04:00 rollover. Due Tasks are derived at Run start and recorded as the Presented set.

The app closes stale Runs during normal use. The Railway rollover service runs at 01:00 and 02:00 UTC so that local 04:00 is covered across daylight-saving changes. It uses `/railway.rollover.json`, needs only the Postgres `DATABASE_URL` reference, and has no public domain.

The 2026-08-10 browser check covered create, edit, Task move, and archive flows with invented content. The phone check used a 390 × 844 viewport. The tablet check used a 1024 px viewport and confirmed that the two-column forms fit without horizontal overflow. The test records were removed from the local database after the check. The explicit local-preview flag was active for this UI check. A separate check without that flag confirmed that Settings shows the Clerk sign-in screen. Outside the preview, the Settings route and each server action require the allowed Clerk user.

The 2026-08-10 Phase 3 browser check covered start, Room navigation, Tick, un-Tick, the all-Tasks view, close, Undo, Home resume, and Home reopen. It used 390 × 844 and 820 × 1180 viewports and checked English and Finnish copy. Invented local test content must be removed after the final review.

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
