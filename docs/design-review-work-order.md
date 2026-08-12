# Design review — work order

This is the entry point for the design corrections. Start here, not in the report.

The findings are in [`design-review-2026-08-11.html`](./design-review-2026-08-11.html). Open it and read the steps you are about to do. Each finding has a stable ID, so `F1` and `A2` in this file are anchors in that report.

## Before you change a file

Tell the repository owner what you are about to do and wait for the answer. Give five items and keep it short:

1. The step number you take, and why that step.
2. The finding IDs it covers.
3. The name of the worktree and the branch you create.
4. The skills you use.
5. What makes you stop and ask a question.

Also name the files you will **not** change in this step. This is the item that shows whether you read the order rules.

## How to use this file

1. Take the **first step that is not `done`** in the table below.
2. Do only that step. Do not start the next one.
3. Follow the Git workflow in [`AGENTS.md`](../AGENTS.md): one worktree and one branch for the step, small commits, no automatic merge into `main`.
4. Use the `implement` skill for the work and the `davinci` skill for every design decision inside it.
5. Run the checks in "How to verify" at the end of the report before you call the step complete.
6. Update this file: set the step to `done` and add the pull request number.
7. Use the `code-review` skill, then stop and report to the repository owner.

## Steps

| Step | Status | Findings | Work |
| --- | --- | --- | --- |
| 1 | done ([#11](https://github.com/noobieoffrails/doubtfire/pull/11)) | T1, S2, S1 | Acknowledge the primary action within 100 ms, add error and not-found boundaries, and give the Home Run actions an error path. |
| 2 | done ([#12](https://github.com/noobieoffrails/doubtfire/pull/12)) | F1, F2, X1 | Add the token layer, replace every literal value with the nearest token, and remove the dead CSS and the dead `phaseNote` key. |
| 3 | done ([#13](https://github.com/noobieoffrails/doubtfire/pull/13)) | A1, A2, A3, A4, A5, A7, A9 | Correct the measured accessibility failures: control borders, reflow at 200 % zoom, status messages, type below 12 px, disabled buttons, the disabled navigation item, and the thin semantic structure. |
| 4 | done ([#14](https://github.com/noobieoffrails/doubtfire/pull/14)) | C1, C3, N1, N2 | Correct the plural defects, remove the duplicated strings, and make the page name match the link that leads to it. |
| 5 | done ([#15](https://github.com/noobieoffrails/doubtfire/pull/15)) | L3, A6, H1, S4, S6, H5, L4, H10 | Rebuild the Home and Run overview flow. Move the primary action below the Routine list, which also corrects the tab order. |
| 6 | todo | L1, L2, L5, H2, H4, H6, H7, H8, A8, S5, S7, N3, T2, T3 | Rebuild the Run experience. **Ask the owner the question in "Open decisions" before you start.** |
| 7 | todo | S3, H3, H9 | Settings, including the archive restore path. **Ask the owner the question in "Open decisions" before you start.** |
| 8 | todo | C2 | Change interface copy to sentence case in both locales. Do this last so it covers the strings that steps 1 to 7 add. |
| 9 | todo | F3 | Rewrite `DESIGN.md` to describe the interface that now exists, with the token layer as the source of truth. |

## Order rules

- **Do the steps in order.** Step 2 rewrites almost every rule in `src/app/globals.css`, and most other steps also change that file. Land step 2 before you start step 3.
- **Do not run two steps at the same time.** Parallel branches will conflict in `globals.css`.
- Step 1 comes before step 2 because it repairs a reproduced crash and it barely touches the stylesheet.

## Open decisions

Two items need the repository owner. Do not decide them yourself, and do not start step 6 or step 7 before you have the answer. Ask one question at a time and include a recommended answer, as `AGENTS.md` requires.

- **Before step 6 — the wall-mounted tablet (finding `L5`).** `PRODUCT.md` names a wall-mounted tablet as one of two devices, but above 760 px the app renders the phone layout at a fixed 1020 px, with 11.5 px navigation labels and 32 px tick targets used at arm's length with occupied hands. Ask whether the tablet is an input device that needs its own larger scale on the Run screens, or a glanceable display with the phone as the input device. Recommended answer: give the Run screens a larger tablet scale, because both people tick Tasks while they clean.
- **Before step 7 — archiving (finding `S3`).** `CONTEXT.md` states that content is never deleted, and the data honours it, but the interface has no way to restore archived content. Ask whether to add an archived-content view with a restore action, or to keep archiving one-way and raise the friction. Recommended answer: add the restore view, because it makes the light friction that already exists correct.

## Constraints that apply to every step

- `docs/adr/` is settled. The review does not reopen any of it. ADR 0002 in particular: no denominators, no outstanding counts, no lateness messages.
- Do not put real household content in this repository. Use invented content for browser checks and remove it afterwards.
- The report has a section called "What is already correct". Read it. Several items there are easy to break during step 2.
- `PRODUCT.md` commits to WCAG 2.2 Level AA. Five findings are measured failures against that commitment.

## Verification

The report's "How to verify" section is the definition of done for every step. The four checks that matter most, because a visual review misses them:

- **Keyboard.** Tab through the screen and record the vertical position of each stop. The positions must increase.
- **200 % zoom.** Double the root font size at a 375 px viewport. `document.scrollWidth` must equal `clientWidth` on every route.
- **Timing.** Every action shows a visual change within 100 ms, whatever the work takes.
- **Break it on purpose.** Stop Postgres and tick a Task. Double-click the primary action. Open `/run/<random-uuid>`.

To run the app for a browser check:

```bash
DOUBTFIRE_ALLOW_UNAUTHENTICATED_PREVIEW=1 pnpm dev
```
