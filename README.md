# Doubtfire

Doubtfire is a shared household cleaning PWA. It stores cleaning Routines and Tasks, records Ticks during a Run, and helps the household understand what it ignores.

Read these files before you change the product:

- [`CONTEXT.md`](./CONTEXT.md) defines the domain language.
- [`docs/implementation-plan.md`](./docs/implementation-plan.md) defines the stack and delivery phases.
- [`docs/adr`](./docs/adr) contains the settled product and architecture decisions.
- [`AGENTS.md`](./AGENTS.md) defines the repository workflow.

## Local requirements

- Node.js 22 or later
- pnpm 10.33.0
- Docker with Docker Compose, or Docker CLI with Colima and `docker-compose`
- A Clerk development application

The setup wizard gives you the exact dashboard steps for Clerk, Railway, Cloudflare, and GitHub:

```bash
./scripts/setup-private-deployment.sh
```

Run the wizard when you prepare a new local or production environment. It writes development values to `.env.local`, starts the included Postgres service, installs packages, and applies migrations. It also gives one dashboard action at a time for Clerk, Railway, Cloudflare, and GitHub.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, and `ALLOWED_CLERK_USER_ID`.
3. Install dependencies with `pnpm install --frozen-lockfile`.
4. Start the included local database with `docker compose up -d postgres`.
5. Apply migrations with `pnpm db:migrate`.
6. Start the app with `pnpm dev`.

Open [http://localhost:3000](http://localhost:3000).

Stop the local database with `docker compose stop postgres`.

For local visual work without a Clerk session, set `DOUBTFIRE_ALLOW_UNAUTHENTICATED_PREVIEW=1`. This flag has no effect in production.

Do not use the preview flag to test authentication. Use the Clerk development instance for authentication tests.

## Manage cleaning content

Sign in and open **Settings**. Use the content forms to add Routines, Rooms, and Tasks. Task text is private database content and is not stored in this public repository.

The app archives content instead of deleting it. Archived records keep their history and do not appear in future Runs.

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Deployment

Railway builds the root `Dockerfile`. It runs `pnpm db:migrate` before deployment and checks `/health` before it routes traffic to the new container.

`/health` is public so Railway can check the service. Application pages protect their data with Clerk at the page or server-function boundary.

The app requires a persistent container because later phases use server-sent events and Postgres `LISTEN/NOTIFY`.

GitHub Actions runs lint, type checks, tests, and a production build for each pull request. Railway deploys `main` after the GitHub checks pass. GitHub Actions does not hold production secrets and does not deploy the app.

CI uses an isolated Postgres service for the content-management integration tests.

### Run rollover service

The app closes a stale open Run when someone next opens the app. A separate Railway cron service also closes stale Runs without a request.

Create the service from the same repository. Set its Railway Config File path to `/railway.rollover.json`, give it the existing Postgres `DATABASE_URL` reference, and set this UTC cron schedule:

```text
0 1,2 * * *
```

The two UTC start times cover both Helsinki offsets. The database function closes a Run only after local 04:00. The service has no public domain and exits after each check.

The setup wizard gives these Railway steps one at a time.

See [`docs/private-deployment.md`](./docs/private-deployment.md) for the security model and manual checks. See [`docs/privacy-and-cookies.md`](./docs/privacy-and-cookies.md) for the current cookie assessment.
