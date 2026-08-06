# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js App Router in a persistent Railway container, with Postgres, Drizzle ORM, Clerk, Tailwind CSS, and shadcn/ui.

## Users

Two people in one household use one shared account. They use the app from a phone and a wall-mounted tablet while they clean their home.

## Product Purpose

Doubtfire holds the household's cleaning Routines and Tasks. It records what the household did and helps the household understand what it ignores. Success means that either person can start a Run, Tick Tasks without delay, and stop without creating a sense of failure.

## Positioning

Due-ness belongs to each Task. A Run only presents Tasks that are Due. The app does not present unfinished work as debt and does not volunteer negative numbers.

## Operating Context

- Both devices can use the same Run at the same time on the home Wi-Fi network.
- The tablet must stay signed in between cleaning days.
- A Run closes when a person marks it done or at the 04:00 rollover.
- English and Finnish are available for app text. Seeded Task text is never translated.

## Capabilities and Constraints

- Use the domain terms in `CONTEXT.md`.
- Treat the decisions in `docs/adr/` as settled.
- Use one shared Clerk account as an access gate. Do not add users, households, or personal attribution to the data model.
- Derive Due from Tick history and Routine cadence. Do not store Due as data.
- Keep the Presented set for each Run.
- Archive content instead of deleting it.
- Use Postgres `LISTEN/NOTIFY` and server-sent events for real-time updates.
- Run the Next.js app as a persistent container. Do not deploy it as a serverless app.
- Make the PWA installable. Do not add a service worker or offline cache.
- Do not add progress fractions, outstanding counts, push notifications, or unrequested lateness messages.

## Brand Commitments

The product name is Doubtfire. English product text uses ASD-STE100 Simplified Technical English. The interface must feel supportive and direct. It must not judge the household.

## Evidence on Hand

- `CONTEXT.md` contains the domain language.
- `docs/implementation-plan.md` contains the delivery plan and stack.
- `docs/adr/` contains the settled product and architecture decisions.
- `fixtures/example-cleaning-list.md` contains invented public content for development and tests.
- The repository has no approved logo, color palette, font system, or real household content.

## Product Principles

- Make the next useful action clear.
- Count completed work up from zero.
- Keep unfinished work neutral.
- Preserve history without adding personal competition.
- Make shared-device use reliable and quick.

## Accessibility & Inclusion

Meet WCAG 2.2 Level AA. Support touch input, keyboard input, reduced motion, readable focus states, and mobile screen sizes.
