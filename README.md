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
- Postgres
- A Clerk development application

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Set `DATABASE_URL`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, and `CLERK_SECRET_KEY`.
3. Install dependencies with `pnpm install`.
4. Apply migrations with `pnpm db:migrate`.
5. Start the app with `pnpm dev`.

Open [http://localhost:3000](http://localhost:3000).

## Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Deployment

Railway builds the root `Dockerfile`. It runs `pnpm db:migrate` before deployment and checks `/health` before it routes traffic to the new container.

The app requires a persistent container because later phases use server-sent events and Postgres `LISTEN/NOTIFY`.
