# Single tenant, with auth as a door rather than an identity

The app serves a single household of two, from a phone and a tablet at the same time. Clerk exists solely to stop the public internet reaching a Railway-hosted app; it is not an identity system. There is no user table, no household, no tenant scoping and no per-person attribution.

## Consequences

- **No user foreign key anywhere.** Every query and every real-time subscription is unscoped.
- **Ticks record when, not who.** Per-person statistics are impossible by construction, deliberately: the only people-shaped number this app could produce is "who cleans less", which invites competition, unlike the room- and task-shaped numbers in Statistics.
- **Clerk uses Restricted sign-up mode.** An administrator creates the one account. The app also compares the signed-in Clerk user ID with its configured allowed user ID.
- **The Clerk Hobby plan fixes sessions at seven days.** The repository owner accepted repeat sign-in after this limit instead of a paid custom session lifetime. Track this flow as a deployment follow-up. It does not block product work. Android tablet acceptance is deferred.
- **Adding real users later is a genuine migration** and would not recover history. Accepted knowingly.

## Settled, do not re-open

- **A non-auth attribution label** — a `who is cleaning?` prompt at Run start would preserve per-person data without Clerk users, at the cost of a tap between the user and `Start cleaning`. Rejected on both the friction and the competition grounds above.
