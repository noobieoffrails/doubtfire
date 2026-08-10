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

## Import a cleaning list

The default command reads the invented example fixture:

```bash
pnpm seed
```

Pass a private file path to import a real list. Keep that file outside this public repository:

```bash
pnpm seed /path/to/private-cleaning-list.md
```

Each Routine must have a Cadence in days:

```md
## Weekly

Cadence: 7 days
```

The command asks whether each ambiguous parent bullet is a Group or a Task with Notes. It then shows the source and proposed structure in two columns. Review every row. The command writes only when you type `WRITE` exactly.

The seed command writes in one transaction and only to an empty database. It does not replace or delete existing Routines, Rooms, or Tasks.

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

CI uses an isolated Postgres service for the seed integration tests.

See [`docs/private-deployment.md`](./docs/private-deployment.md) for the security model and manual checks. See [`docs/privacy-and-cookies.md`](./docs/privacy-and-cookies.md) for the current cookie assessment.
