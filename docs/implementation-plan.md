# Implementation Plan

**This repository is public and holds no real household content.** Household Routines, Rooms, and Tasks are created through the authenticated Settings UI and stay in Postgres. They must never be committed, inlined into a test, or quoted in a comment.

Read [CONTEXT.md](../CONTEXT.md) first — it defines Routine, Task, Room, Group, Cadence, Run, Tick, Due, Presented, Ignored and Archived, and lists the words to avoid. Use those terms in code, in UI copy and in commits. When a new domain term is settled during the build, add it there.

Four decisions are recorded in [docs/adr](./adr) and are settled. Each has a "do not re-open" section listing what was already rejected.

## Stack

| Concern | Choice |
|---|---|
| App | Next.js (App Router), running as a **persistent container** — not serverless |
| Hosting | Railway — app and database |
| Database | Postgres on Railway, Drizzle ORM |
| Real-time | SSE route handler, driven by Postgres `LISTEN/NOTIFY` |
| Auth | Clerk Restricted mode, one predefined account, exact user ID check |
| Styling | Tailwind + shadcn/ui |
| Drag & drop | `dnd-kit` — pointer + touch sensors; the HTML5 drag API does not work on mobile |
| PWA | Manifest, icons, `theme-color`, `display: standalone`. No service worker |

**UI language:** English by default, Finnish via a toggle stored in a cookie — per-device, and readable during SSR so there is no flash of the wrong language. A dictionary of ~100 strings, no i18n framework.

This covers the app's own chrome only. **Task text is content, and the app never translates it** — it is stored and displayed exactly as the household entered it. The language toggle must not touch it.

## Data model

```
routine    id, name, cadence_days, includes_routine_id?, sort_order, archived_at?
room       id, name, sort_order, archived_at?
task       id, text, note?, room_id, group_label?, routine_id, sort_order, archived_at?
run        id, routine_id, started_at, closed_at?, closed_by_rollover
run_task   run_id, task_id            -- the Presented set, written at Run start
tick       id, run_id, task_id, ticked_at
```

- `includes_routine_id` resolves transitively: Quarterly → Fortnightly → Weekly. A standalone tier points at nothing.
- `group_label` is a plain nullable string. Groups are presentational — not rows, no identity, no statistics.
- `sort_order` is an integer with gaps, so a drag reorder is one row update rather than a renumbering.
- Nothing is hard-deleted. `archived_at` withdraws content from future Runs while preserving history.
- `run_task` exists so "Presented but not Ticked" stays answerable later. It is recorded, not displayed.

**Due-ness is derived, never stored:**

```
due(task) = now() - last_tick(task) >= task.routine.cadence_days
```

A Task never Ticked is Due. A Run for Routine R presents every non-archived Task whose home Routine is in R's resolved `includes` chain and which is Due at Run start.

## Phases

### 1 — Scaffold

Next.js on Railway, Postgres provisioned, Drizzle with migrations, Clerk gating every route, manifest and icon set, and a deploy that installs to an iPhone home screen and looks like an app. The Clerk Hobby plan has a fixed seven-day session lifetime. Track the repeat sign-in check as a deployment follow-up. It does not block product work. Android tablet acceptance is deferred by the repository owner.

### 2 — Content management

Build authenticated Settings forms before Runs. The household enters its real content directly in the app.

- Routines: create, edit the name and Cadence, set `includes`, and archive.
- Rooms: create, rename, and archive.
- Tasks: create, edit text and Note, move between Rooms and Routines, set an optional Group label, and archive.
- Add new content at the end of its current order. Advanced reordering can follow after real use shows where it is necessary.
- Reject empty required text, duplicate active Routine or Room names, inactive references, and Routine `includes` cycles.
- **Archiving a Routine re-points** any Routine that includes it at *its* target. Archive Fortnightly and Quarterly starts including Weekly directly.
- Archive content instead of deleting it. Keep existing identity and history.

Test the content-management interface with an isolated Postgres database. Verify the authenticated forms on phone and tablet-sized screens.

### 3 — Runs

The core loop, and the first phase that produces a usable app.

- Home: `Start cleaning`, the Routines, and an open Run shown as `Cleaning in progress · 12 done`.
- Run view: room grid with per-room count-ups → room detail (6–16 Tasks) → `Done with this room` / `Next room`. A collapsed all-Tasks view as a secondary option, not the default.
- Ticking is optimistic and instant. Un-ticking is free while the Run is open and deletes the Tick outright — no tombstone.
- `Mark as done` closes the Run for the household, with an `Undo` toast for ~30s. A closed Run can also be re-opened from home until the 04:00 rollover, after which it is immutable.
- A scheduled job closes Runs left open past 04:00, setting `closed_by_rollover`.
- Completion screen: absolute numbers only.

Check every screen against [ADR-0002](./adr/0002-the-app-never-volunteers-a-negative-number.md) before moving on. No denominators, no lateness, no debt.

### 4 — Real-time

SSE endpoint subscribed to `LISTEN/NOTIFY` on Tick insert/delete and Run open/close. Reconnect with backoff; on reconnect, refetch rather than replay.

Test the case the feature exists for: phone and tablet in the same Run, one Ticks, the other updates without a refresh.

**The app is usable for real cleaning at the end of this phase.** Worth a few weekends of actual use before phase 5 — it will narrow what "full CRUD" needs to mean.

### 5 — Content organization

Refine the Phase 2 management tools after real household use.

- Add Routine, Room, and Task reordering where creation order is not sufficient.
- Add bulk Group rename or clearing if editing individual Task labels is too slow.
- Add archived-content inspection or restore controls if the household needs them.
- Moving a Task between Routines continues to change its Cadence while its Tick history follows the Task.
- Prefer move-up and move-down controls when touch dragging is not reliable.

### 6 — Statistics

Its own tab, never surfaced elsewhere.

- Per Task: done N times · ignored N times · last done · average real interval vs cadence.
- Per Room: the same, rolled up.
- Never done since the Task was added.

**Ignored** means a Task stayed Due for a full further cadence period without being Ticked — one missed cycle, counted once. It does *not* mean "shown in a Run and not Ticked", which would punish every Task in a room that simply was not reached that day.

## Out of scope

Do not build these. Each was considered and deferred; see the ADRs for why.

- **Google Calendar integration** — deferred, addable later without migration ([ADR-0002](./adr/0002-the-app-never-volunteers-a-negative-number.md))
- **Push notifications** — contradicts ADR-0002
- **Effort labels on Tasks** — durations will be derived from Tick timestamps instead
- **Floor-plan map view** — the room grid is the shape it slots into; Room needs no geometry until then
- **Offline / local-first** — [ADR-0004](./adr/0004-postgres-and-sse-over-a-realtime-backend.md)
- **Per-person attribution** — [ADR-0003](./adr/0003-single-tenant-with-auth-as-a-door.md)
- **Service worker / offline caching** — the PWA requirement is purely cosmetic
