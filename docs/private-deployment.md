# Private deployment

This document records the private deployment controls for Doubtfire. Run [`scripts/setup-private-deployment.sh`](../scripts/setup-private-deployment.sh) for the dashboard steps.

## Authentication

Clerk is the authentication provider. The Clerk production instance must use Restricted sign-up mode. An administrator creates one production user manually. There is no sign-up route in Doubtfire.

`ALLOWED_CLERK_USER_ID` contains the ID of that one user. Doubtfire compares each signed-in Clerk user with this value. It denies every other Clerk user. This check protects the app if the Clerk sign-up setting changes by mistake.

The request proxy provides the first app-wide check. Each page, route handler, and server action that reads or changes protected data must also call the server-side exact-user check. Do not treat a client component as a security boundary.

The only public routes are:

- `/sign-in` and its Clerk flow routes
- `/access-denied`
- `/health`, for Railway
- `/privacy`
- `/robots.txt`

Clerk provides account lockout and brute-force protection. Do not add an application rate limiter until operating data shows that one is necessary. Cloudflare can add a rate limit later without changing the application.

## Search engines

Doubtfire uses three crawler controls:

- `/robots.txt` disallows every path.
- Page metadata sets `noindex` and `nofollow`.
- Each response includes an `X-Robots-Tag` header.

These controls request that search engines do not index the app. They do not provide security. Clerk provides security.

## Required Railway variables

Set these variables on the app service:

| Variable | Source |
| --- | --- |
| `DATABASE_URL` | Railway reference to `${{Postgres.DATABASE_URL}}` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk production Publishable Key |
| `CLERK_SECRET_KEY` | Clerk production Secret Key; seal it in Railway |
| `ALLOWED_CLERK_USER_ID` | Clerk production user ID |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` | `/` |

Do not put production values in `.env.local` or GitHub Actions.

## CI and deployment

The `CI` workflow runs for pull requests and pushes to `main`. It performs these checks:

1. Install packages from the frozen lock file.
2. Run ESLint.
3. Check TypeScript types.
4. Run Vitest.
5. Build the production application.

The workflow uses invalid placeholder authentication values because the build needs the variable shape but does not connect to Clerk. It has no production secrets.

Railway deploys from `main`. Enable **Wait for CI** in Railway. A failed GitHub workflow must stop the deployment. Railway runs database migrations before it starts the new version and checks `/health` before it sends traffic to it.

Protect `main` with a GitHub ruleset. Require a pull request and the `Verify` status check. Do not let Railway or GitHub merge a pull request automatically.

## Test the app

For local development:

1. Run the setup wizard to create `.env.local`.
2. Start Postgres with `docker compose up -d postgres`.
3. Run `pnpm db:migrate`.
4. Run `pnpm dev`.
5. Open `http://localhost:3000`.

For each production release, check these behaviors:

1. A signed-out request to `/` redirects to `/sign-in`.
2. The sign-in screen has no sign-up link.
3. The Clerk production instance contains only the predefined user.
4. The predefined user can open `/`.
5. `/robots.txt` contains `Disallow: /`.
6. `curl -I https://YOUR_HOSTNAME` shows an `X-Robots-Tag` header with `noindex` and `nofollow`.
7. `/health` returns `{"status":"ok"}`.
8. The app installs and opens from the tablet and phone home screens.

The Clerk Hobby plan has a fixed seven-day session lifetime. Check the sign-in experience on both devices after seven days. This replaces the earlier requirement for a session that survives for weeks.

## Package upgrades

All direct package versions are exact. The pnpm lock file pins the full dependency tree. Change package versions only in a dedicated pull request. Run the full CI workflow for each upgrade.
