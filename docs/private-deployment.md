# Private deployment

This document records the private deployment controls for Doubtfire. Run [`scripts/setup-private-deployment.sh`](../scripts/setup-private-deployment.sh) for the dashboard steps.

## Authentication

Clerk is the authentication provider. The Clerk production instance must use Restricted sign-up mode. An administrator creates one production user manually. There is no sign-up route in Doubtfire.

Keep Clerk's email, username, and password sign-up methods enabled. These methods let the predefined account use those identifiers and its password. Restricted mode prevents public sign-up. If these methods are disabled, Clerk reports invalid authentication settings and the predefined user cannot sign in.

`ALLOWED_CLERK_USER_ID` contains the ID of that one user. Doubtfire compares each signed-in Clerk user with this value. It denies every other Clerk user. This check protects the app if the Clerk sign-up setting changes by mistake.

The request proxy provides the first app-wide check. Each page, route handler, and server action that reads or changes protected data must also call the server-side exact-user check. Do not treat a client component as a security boundary.

The only public routes are:

- `/sign-in` and its Clerk flow routes
- `/access-denied`
- `/health`, for Railway
- `/privacy`
- `/robots.txt`

Clerk provides account lockout and brute-force protection. Do not add an application rate limiter until operating data shows that one is necessary. Cloudflare can add a rate limit later without changing the application.

## Clerk production domain

In the Clerk production instance, open **Configure**, **Developers**, then **Domains**. Use **Configure automatically** to start the one-time Cloudflare authorization. Review the five Clerk CNAME records before you approve them. Each Clerk record must use **DNS only**. The Railway app CNAME remains proxied through Cloudflare.

Wait until Clerk shows that DNS is verified and both SSL certificates are ready. If Clerk shows a **Deploy certificates** button, select it. Clerk can also start certificate deployment automatically.

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

Run the app service and Postgres in Railway's **EU West** region. Both services must use the same region. A later Postgres region change moves its attached volume and causes downtime during the move.

Railway can start the first app deployment before the required variables exist. This first deployment can fail. Add all required variables, then review and deploy the staged changes. Do not add the suggested `DOUBTFIRE_ALLOW_UNAUTHENTICATED_PREVIEW` variable. It is only for local visual work.

Protect `main` with a GitHub ruleset. Require a pull request and the `Verify` status check. Do not let Railway or GitHub merge a pull request automatically.

## Test the app

For local development:

1. Run the setup wizard to create `.env.local`.
2. Let the wizard start Colima when it is installed and Docker is not running.
3. Let the wizard detect `docker compose` or `docker-compose` and start Postgres.
4. Let the wizard install packages and run `pnpm db:migrate`.
5. In another terminal, run `pnpm dev`.
6. Open `http://localhost:3000`.

Database commands load `.env.local` automatically. You do not need to copy `DATABASE_URL` into a terminal command.

For each production release, check these behaviors:

1. A signed-out request to `/` redirects to `/sign-in`.
2. The sign-in screen has no sign-up link.
3. The Clerk production instance contains only the predefined user.
4. The predefined user can open `/`.
5. `/robots.txt` contains `Disallow: /`.
6. `curl -I https://YOUR_HOSTNAME` shows an `X-Robots-Tag` header with `noindex` and `nofollow`.
7. `/health` returns `{"status":"ok"}`.
8. The app installs and opens from the iPhone home screen.

The Clerk Hobby plan has a fixed seven-day session lifetime. Check the repeat sign-in experience on the iPhone after seven days. This replaces the earlier requirement for a session that survives for weeks.

## Initial acceptance record

The repository owner accepted the production iPhone installation on 2026-08-06. Android tablet acceptance is deferred. The iPhone seven-day repeat sign-in check remains open.

## Package upgrades

All direct package versions are exact. The pnpm lock file pins the full dependency tree. Change package versions only in a dedicated pull request. Run the full CI workflow for each upgrade.
