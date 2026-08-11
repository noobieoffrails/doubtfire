# Design review — 2026-08-11

This review covers the interface on `main` at commit `3984077`. It is written for the agent that does the corrective work. Each finding gives the symptom, the principle, and the fix.

The review used a local Postgres database, invented content, and the local preview flag. It checked Home, the Run overview, the Room Task screen, the completion screen, and Settings at 375 px and 1280 px. It measured every contrast pair, every font size, every font weight, and every spacing value in `src/app/globals.css`.

## Read these files first

1. [`CONTEXT.md`](../CONTEXT.md) defines the domain language.
2. [`PRODUCT.md`](../PRODUCT.md) defines the users, the two devices, and the accessibility commitment.
3. [`DESIGN.md`](../DESIGN.md) defines the current design system.
4. [`docs/adr`](./adr/) contains the settled decisions. This review does not reopen any of them.

## What is already correct

Do not change these. They are correct and they are easy to break during the corrective work.

- **Text contrast passes.** Every text pair measures between 5.2:1 and 16.7:1. The palette is sound.
- **Focus is visible everywhere.** `globals.css:69` applies a 3 px cobalt outline to buttons, links, inputs, selects, summaries, and text areas.
- **The Undo action is generous.** A closed Run stays reversible for 30 seconds, and it can also be reopened from Home.
- **Ticks are optimistic and they roll back.** `run-flow.tsx:136` queues each change per Task, keeps a version number, and restores the previous state when the request fails.
- **Reduced motion is respected.** Both animations sit inside `prefers-reduced-motion: no-preference`.
- **Counters use tabular figures**, so a number does not shift the layout when it changes.
- **`.formMessage` reserves 1.4 em**, so a save message does not push the form.
- **ADR 0002 holds.** No screen shows a denominator, an outstanding count, or a lateness message.
- **Safe-area insets are handled** in the header, the bottom navigation, and the toast.

---

## 1. Root cause

Fix this first. Most findings in section 4 are symptoms of it, and fixing them individually without this step recreates the drift.

### R1 — The design system has no token layer in code

[`DESIGN.md`](../DESIGN.md) declares a spacing scale, a type scale, a weight set, and radius values. `src/app/globals.css` declares 13 colour variables and 2 shadows. It declares no spacing token, no size token, and no weight token.

Every other value is therefore typed by hand where it is used. The result, measured across 1794 lines and 4 screens:

| Value type | Distinct values | On the declared scale |
| --- | --- | --- |
| `font-size` | 34 | no scale declared in code |
| `font-weight` | 14 | no scale declared in code |
| spacing (`padding`, `margin`, `gap`) | 37 | about 40 % |

The font weights are `520, 540, 600, 650, 680, 700, 720, 730, 740, 750, 760, 770, 780, 800`. The difference between 720 and 730 is not visible. The difference between fourteen weights and two is visible immediately, and it reads as carelessness.

The font sizes include `0.72, 0.74, 0.76, 0.78, 0.8, 0.82, 0.84, 0.875, 0.88, 0.9, 0.92, 0.98` rem. In pixels that is 11.5, 11.8, 12.2, 12.5, 12.8, 13.1, 13.4, 14.0, 14.1, 14.4, 14.7, 15.7. Twelve sizes inside a 4 px band.

The spacing values include `7, 10, 11, 13, 14, 18, 22, 26, 30, 34, 38, 42, 44, 52, 56, 60, 68, 88, 94, 112, 118` px. None of these is on the scale that `DESIGN.md` declares.

**Principle.** A constrained modular scale creates rhythm. Arbitrary values read as accidental because they are accidental. (*Refactoring UI*, *Practical UI*)

**Fix.** Add a token layer to `:root` in `globals.css` before any other change:

```css
:root {
  /* Spacing — the DESIGN.md scale, extended for layout */
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;  --space-4: 16px;
  --space-5: 20px;  --space-6: 24px;  --space-8: 32px;  --space-10: 40px;
  --space-12: 48px; --space-16: 64px; --space-20: 80px;

  /* Type — 12 is the floor, see A2 */
  --text-xs: 0.75rem;  --text-sm: 0.875rem; --text-base: 1rem;
  --text-lg: 1.125rem; --text-xl: 1.25rem;  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem; --text-4xl: 2.25rem; --text-5xl: 3rem;

  /* Weight — two, plus one display weight for the greeting */
  --weight-body: 450; --weight-strong: 700; --weight-display: 780;

  /* Radius */
  --radius-control: 14px; --radius-pill: 999px;
}
```

Then replace every literal value in `globals.css` with the nearest token. Where a literal is more than one step from a token, choose the token and accept the change. The nearest-token rule is the point of the exercise.

### R2 — Two styling systems are installed and neither enforces a scale

Tailwind v4 is imported at `globals.css:1` and `components.json` configures shadcn/ui. Exactly one component uses Tailwind: `src/components/ui/button.tsx:10`. Every class in it is an arbitrary value — `rounded-[14px]`, `bg-[var(--cobalt)]`, `shadow-[var(--shadow-action)]` — which bypasses the Tailwind scales completely. Everything else in the app is hand-written CSS with bespoke class names.

**Fix.** Choose one system and state the choice in `DESIGN.md`. The recommendation is to **keep the hand-written CSS and drop the Tailwind dependency**, because the interface is small, the class names are already semantic, and the asymmetric island shapes are awkward in utility classes. If Tailwind stays instead, map the tokens from R1 into the Tailwind theme so the utilities and the stylesheet share one scale.

### R3 — `DESIGN.md` documents Phase 1 only

`DESIGN.md` describes three fixed Routines, disabled Routine fields, and a locked primary action. None of that is still true. It has no entry for the Run overview, the Room islands, the Task rows, the tick control, the Settings managers, the disclosure rows, the forms, the completion screen, or the toast. About half of the current interface has no design documentation at all.

**Fix.** Rewrite `DESIGN.md` after the work in sections 2 to 5 is complete, and record the token layer from R1 as the source of truth.

---

## 2. Accessibility

`PRODUCT.md` commits to WCAG 2.2 Level AA. These are measured failures against that commitment, not opinions.

### A1 — Form control borders measure 1.49:1 (blocking)

`globals.css:1319` sets the border of every input, select, and text area to `rgb(16 24 77 / 18%)`. Over white that composites to `#d4d5de`, which is **1.49:1**. WCAG 2.2 success criterion 1.4.11 Non-text Contrast requires **3:1** for the visual boundary of a control.

**Fix.** Use a border that measures at least 3:1 against both white and the island fills the fields sit on. `#8a90a8` gives 3.1:1 over white. Verify against `--sky`, `--mint`, `--lilac`, and `--ice`, because fields appear on all four.

### A2 — Type below the 12 px floor

| Selector | Size | Pixels |
| --- | --- | --- |
| `.navItem` (`globals.css:922`) | `0.72rem` | 11.5 |
| `.allTasksDisclosure li small`, `.runTaskCopy small` (`:736`) | `0.74rem` | 11.8 |
| `.availabilityNote` (`:245`) | `0.76rem` | 12.2 |
| `.runCount`, `.resumableRunIsland small` (`:540`) | `0.78rem` | 12.5 |

`PRODUCT.md` states that one of the two devices is a **wall-mounted tablet** used while cleaning. Text at 11.5 px is not readable at arm's length, and none of these sizes survives a wet or gloved hand reaching for the wrong control.

**Fix.** Set 12 px as the absolute floor and 14 px as the floor for anything a person reads while standing away from the screen. Raise the navigation labels to 12 px and the Run counters to 14 px.

### A3 — Disabled buttons have no visual disabled state

`button.tsx:10` sets `disabled:opacity-100`, which cancels the browser's dimming, and nothing replaces it. Only `.startButton:disabled` supplies its own colour. Two consequences:

- `markDoneButton` during `isClosing` (`run-flow.tsx:337`) looks fully enabled and the label does not change. A person who taps it during a slow request gets no feedback at all.
- The `ContentForm` submit button during `pending` (`content-form.tsx:47`) changes its label to "Saving…" but keeps the enabled appearance.

**Fix.** Give the shared `Button` one disabled treatment: a muted fill, no action shadow, and `cursor: not-allowed`. Add a busy label to `markDoneButton` in the same way `ContentForm` already does.

### A4 — The disabled navigation item is indistinguishable from a working one

`page.tsx:193` and `settings/page.tsx:127` render History as `<span className="navItem disabled" aria-disabled="true">`. It uses the same colour, the same icon weight, and the same label style as Settings. It is not focusable, so a keyboard user cannot reach it to learn it is disabled, and `.navItem.disabled` changes only the cursor.

**Fix.** Either remove the item until History exists, or reduce it to 55 % opacity and give it an accessible explanation. Removing it is the better choice: a two-item navigation is honest, and the item returns when the feature does.

### A5 — The Routine radio group has no group name

The three Routine radios in `page.tsx:156` are correctly labelled by their wrapping `<label>`, but the group itself is unnamed. A screen reader announces "Weekly, radio button, 1 of 3" with no indication of what is being chosen.

**Fix.** Wrap the list in a `<fieldset>` with a visually hidden `<legend>`, or give the `<ul>` `role="radiogroup"` and point `aria-labelledby` at the existing `routine-title` heading.

---

## 3. Broken and missing states

### S1 — The app has no error, not-found, or loading boundaries

There is no `error.tsx`, `global-error.tsx`, `not-found.tsx`, or `loading.tsx` anywhere in `src/app`. Verified against the running app:

- `GET /run/<unknown-uuid>` returns **HTTP 500**. `createRunManager().get()` throws and nothing catches it.
- `GET /nope` returns Next.js's default page: unstyled, English only, and outside the design language.

This matters more than usual here. The tablet stays signed in between cleaning days and can hold a stale Run URL.

**Fix.** Add `not-found.tsx` and `error.tsx` in the Doubtfire visual language, localised through the existing dictionary. Make `RunPage` call `notFound()` when the Run does not exist, so a stale link gives a designed page instead of a crash.

### S2 — The Run server actions have no error path

`ContentForm` handles errors well: it has a typed form state, an `aria-live` message, and a `role="alert"` on failure. `startRunAction` and `reopenRunFromHomeAction` have none of that. Both return `void` and throw on failure, and with no error boundary above them (S1) a failure replaces the whole page.

This was reproduced during the review: a rejected `routineId` produced an unhandled `ZodError` and a 500 on `POST /`.

**Fix.** Give the Home actions the same `ContentFormState` treatment `ContentForm` already uses, and show the failure next to the button that caused it.

### S3 — Inert Routine islands look tappable

When a Run is open, `page.tsx:154` adds `.inactive`, which is `opacity: 0.72; pointer-events: none` (`globals.css:360`). The islands keep their full size, their fill, their icons, and — on the previously chosen Routine — the cobalt selection ring. Nothing says why they no longer work.

**Fix.** When a Run is open, either replace the Routine list with the open Run's own card, or reduce the list to a quiet non-interactive summary and remove the selection ring. Do not leave full-size controls that ignore taps.

### S4 — A completed Task looks the same as an outstanding one

`RunTaskControl` changes only the 32 px circle when a Task is ticked. The Task text keeps its full weight, its full colour, and its position.

**Principle.** Professional work decides what recedes. Work that is done should stop competing for attention. (*Refactoring UI*)

This is compatible with ADR 0002. De-emphasising **completed** work is not the same as escalating unfinished work, and it adds no denominator.

**Fix.** On a ticked row, drop the Task text to `--ink-soft` and reduce its weight by one step. Do not strike it through and do not reorder the list — reordering under a moving finger causes mistakes, and the second device would see rows jump.

### S5 — The empty state disables the primary action without saying why

`page.tsx:99` disables "Start cleaning" when no Routine exists. The explanation lives in `.homeEmptyState`, further down the page and visually separate from the button. The note that used to sit under the button is gone: `.availabilityNote` and the `phaseNote` dictionary key are now dead code.

**Fix.** Put one short line under the disabled button that says what is missing and links to Settings. Then delete `.availabilityNote` from the stylesheet and `phaseNote` from both dictionaries.

---

## 4. Flow and hierarchy

### H1 — On Home, the primary action sits above the choice it depends on

The reading order is: greeting, then "Choose a routine and start.", then **[Start cleaning]**, then the Routine list. The button submits `start-run-form`, which is declared 50 lines further down (`page.tsx:146`). The instruction tells the user to choose first, and the interface presents the action first.

On a phone the user reads down to the Routines, taps one, and must then look back up to start. At 375 px the button and the third Routine are about 700 px apart.

**Fix.** Move the primary action below the Routine list. Keep the greeting and the still life at the top. This makes the sequence match the sentence: choose, then start.

### H2 — The loudest control on the Run overview is the one that ends the Run

`markDoneButton` is a full-width solid cobalt button — the single strongest visual element on the screen — and it closes the Run. The actual primary path is "tap a Room and tick Tasks". A person scrolling to the bottom of the Room list meets the end-the-session control first.

The 30-second Undo makes this recoverable, which is why this is a hierarchy finding and not a blocking one.

**Fix.** Step "Mark as done" down to a secondary treatment: an outline button or a cobalt text action. Reserve the solid fill for the forward path. Count the solid high-contrast buttons in each viewport; more than one is the defect.

### H3 — The Room Task screen is the least designed screen in the app

This is where the household spends nearly all of its time, and it is the only screen with no colour, no shape, and no continuity. Kitchen is a sky island on the Room grid and a plain white list one tap later. The screen is white, hairline-ruled, and, with a short Task list, more than half empty below an unpinned button.

**Fix.** Carry the Room's colour into the screen — a coloured header band or a coloured heading rule is enough. Pin the forward button to the bottom of the viewport so its position does not depend on how many Tasks the Room has.

### H4 — A decorative icon wears the action colour

`roomTaskHeading > svg` (`globals.css:785`) renders `ListChecks` at 46 × 46 px in `--cobalt`, beside the Room name. It is decorative and `aria-hidden`. `DESIGN.md` reserves cobalt for actions, focus, and active state.

**Fix.** Remove it, or reduce it to 24 px in `--ink-soft`.

### H5 — The Settings introduction fills the first viewport

`.settingsIntro` sets the heading to 2.45 rem. "Manage cleaning content" wraps to three lines, and with the description and the link pills the island runs about 660 px on an 812 px screen. The first Routine sits below the fold on a utility screen that exists to edit lists.

**Fix.** Drop the heading to `--text-3xl`, cut the island padding to `--space-6`, and let the first manager section start inside the first viewport.

### H6 — The section links look like controls they are not

`.sectionLinks a` renders as white pills on the sky island — the same treatment as the language toggle pill in the header. They read as filters or tabs. They are anchor jumps within a page that has three sections.

**Fix.** Remove them on phones, where scrolling is cheaper than deciding what a pill does. If they stay on wide screens, render them as plain underlined links so their behaviour is legible.

### H7 — Display type is used for wayfinding

`.runOverviewHeading h1` and `.roomTaskHeading h1` use `clamp(2.5rem, 10vw, 4.7rem)` — the same treatment as the "Ready when you are." greeting. "Choose a Room" is an instruction, not a greeting. `DESIGN.md` states its own Short-Display Rule: display type is for short greetings only.

**Fix.** Use the headline step for both. Reserve display type for Home and the completion screen.

### H8 — The coral dot lands in dead space

`.coralDot` is absolutely positioned at `right: -15px; bottom: 42px` inside `.welcomeCopy`. On a phone it sits between the button and the still life; at 1280 px it floats alone in the gutter between the two columns. It is a small filled circle in a warning-adjacent colour, unattached to anything, and it reads as an unread badge.

**Fix.** Anchor it to the still-life island so it reads as part of the composition, or remove it.

### H9 — Group labels outrank the Tasks they describe

`.runTaskCopy small` renders the Group label in `--cobalt` at weight 760, above the Task text. `CONTEXT.md` is explicit that a Group is "purely a visual cluster — never checkable". The interface gives it the action colour and the top position.

The label also repeats on every member instead of heading the cluster once, so two Tasks in "Sink" print "Sink" twice and form no visible group.

**Fix.** Render the Group once as a quiet subheading in `--ink-soft` above its Tasks, and remove the per-Task eyebrow.

### H10 — Room colours cycle and imply a grouping that does not exist

`page.tsx` and `run-flow.tsx:298` assign island colours by `index % 3`. With six Rooms, Kitchen and Bedroom are both sky and Bathroom and Koti are both mint.

**Principle.** Gestalt similarity: things that look alike are read as belonging together. (*Designing with the Mind in Mind*)

**Fix.** Either give each Room a stable colour derived from its identity rather than its position, or use one calm fill for all Rooms and let the name carry the distinction. The second option is simpler and it costs nothing.

---

## 5. Spacing and grouping

### P1 — Most spacing is off the project's own scale

See R1. `DESIGN.md` declares `8, 12, 16, 20, 28, 48`. The stylesheet also uses `7, 10, 11, 13, 14, 18, 22, 26, 30, 34, 38, 42, 44, 52, 56, 60, 68, 88, 94, 112, 118`. The dominant rhythm in the code is 14/18/20/28, which is not the declared rhythm.

**Fix.** Covered by R1. Do the replacement as one mechanical pass, not opportunistically.

### P2 — Form grouping is too tight to read

`.formField` puts 7 px between a label and its field. `.fieldGrid` puts 14 px between one field group and the next. The ordering is correct — inner is smaller than outer — but a 2:1 ratio at these sizes does not separate the groups.

**Principle.** Grouping is read from relative distance. Equal or near-equal spacing destroys the grouping information. (*Refactoring UI*)

**Fix.** Use `--space-2` (8 px) inside a field group and `--space-6` (24 px) between them. A 3:1 ratio reads immediately.

### P3 — Run Room islands have more space inside than between

`.runRoomIsland` uses 20–22 px of padding. `.runRoomGrid` uses a 12 px gap. The space inside each card exceeds the space around it, so the cards read as one block rather than as six choices.

**Fix.** Set the grid gap to `--space-4` (16 px) and keep the padding at 20 px, or raise the gap to `--space-6` (24 px). The outer value must exceed the inner one.

### P4 — The Home Routine list nearly touches the fixed navigation

`.routineSection` reserves 88 px of bottom padding. The navigation is `78px + env(safe-area-inset-bottom)`. On a 375 × 812 screen the third Routine clears the navigation border by about 10 px, which reads as a clipped card.

**Fix.** Set the bottom padding to `calc(var(--space-20) + env(safe-area-inset-bottom))`.

---

## 6. Copy

### C1 — "1 Tasks done" (blocking)

`tasksDone: "{count} Tasks done"` has no plural form. The string is visible on Home, in the Run header, in the Run overview subheading, and on the completion screen. It was reproduced at every one of those places during the review.

Finnish has the same class of defect: `"{count} tehtävää tehty"` gives "1 tehtävää tehty", where Finnish needs the nominative singular "1 tehtävä tehty".

**Fix.** Use `Intl.PluralRules` for both locales, with a `one` form and an `other` form per language.

### C2 — "Every 1 days"

`everyDays: "Every {days} days"` has the same defect and appears on every Routine row in Settings. Finnish `"Joka {days}. päivä"` gives "Joka 1. päivä", which reads as "every 1st day".

**Fix.** As C1.

### C3 — English capitalises domain terms and Finnish does not

English: "Add Room", "Archive Task", "All Tasks", "Choose a Room", "No Tasks are Due in this Run.", "A Routine gives its Tasks a Cadence and can include another Routine."

Finnish: "Lisää huone", "Arkistoi tehtävä", "Kaikki tehtävät", "Valitse huone".

The two locales follow different conventions for the same interface. `CONTEXT.md` capitalises domain terms so that **documentation** is unambiguous; that convention has leaked into end-user copy. The Finnish strings show that the product does not need it — they are already clear.

Four capitalised nouns in an eleven-word sentence make a two-person household app read like a specification.

**Fix.** Use sentence case for interface copy in both locales. Keep the capitalised domain terms in `CONTEXT.md`, `AGENTS.md`, the ADRs, and the code identifiers, where they do their job.

### C4 — Title case on controls

"Add Routine", "Add Room", "Add Task", "All Tasks", "Next Room", "Archive Task", "Archive Room", "Archive Routine", "Reopen Run", "Manage Routines", "Last Run", "Back to Rooms", "Done with this Room".

**Fix.** Sentence case throughout. Covered by C3.

### C5 — Two counters, two phrasings, one slot

`roomProgress` is `"{count} done"` and `tasksDone` is `"{count} Tasks done"`. Both render in the top-right of the Run header — the Room screen shows one and the overview shows the other. The same slot changes its wording as the user moves between two screens of the same flow.

**Fix.** Use one string for the header counter on both screens.

### C6 — The completion card and the toast print the same sentence

`run-flow.tsx:212` and `:219` both render `copy.runCompleteDescription`. "This Run is marked as done." appears twice on screen at the same time, once in the card and once in the toast below it.

**Fix.** Give the toast its own short string. The toast exists to offer Undo, so "Run closed" with the Undo action is enough. Consider warming the card line: it currently states a fact about a record rather than telling the household what it did.

### C7 — Two different controls share one label

"Add Routine" labels both the disclosure that opens the form and the submit button inside it. The same words describe two different actions about 660 px apart.

**Fix.** Keep "Add routine" on the disclosure and use "Save routine" on the submit button. Apply the same change to Rooms and Tasks.

### C8 — The Run overview prints its counter twice

"0 Tasks done" appears in the sticky header and again as the subheading under the H1, in different sizes and colours.

**Fix.** Remove the subheading. The header counter is persistent and sufficient.

---

## 7. Cleanup

Dead code found during the review. Remove it in the same pass as R1.

- `.availabilityNote` (`globals.css:242`) — no longer used by any component.
- `.islandWeekly`, `.islandFortnightly`, `.islandQuarterly` — replaced by `.islandSky`, `.islandMint`, `.islandLilac`.
- `phaseNote` in both dictionaries (`i18n/config.ts:68`, `:161`) — no longer rendered.

---

## 8. Suggested order of work

Each step is independently reviewable. Follow the repository workflow in [`AGENTS.md`](../AGENTS.md): one worktree and one branch per step, with small coherent commits.

| Step | Contents | Why this position |
| --- | --- | --- |
| 1 | R1, R2, section 7 | The token layer must exist before anything is restyled. Doing this first means every later step is a token change, not a new literal. |
| 2 | A1, A2, A3, A4, A5 | Measured failures against a stated commitment. They are small, self-contained, and they are the ones that can be verified objectively. |
| 3 | S1, S2 | Error and not-found boundaries. Everything after this can fail safely. |
| 4 | C1, C2, C5, C6, C7, C8 | The plural defects are visible on four screens. Copy work is low-risk and it makes the screenshots in step 5 readable. |
| 5 | H1, H2, S3, S5, P4 | The Home and Run overview flow. This is the largest behavioural change and it deserves its own review. |
| 6 | H3, H4, H7, H9, S4, P3 | The Room Task screen and the Run visual language. |
| 7 | H5, H6, P2, A1 verification | Settings and the forms. |
| 8 | C3, C4 | The sentence-case pass across both locales. Do it last so it covers strings added in steps 3 to 7. |
| 9 | R3 | Rewrite `DESIGN.md` to describe what now exists. |

## 9. How to verify

Run the app with a local database and the preview flag:

```bash
DOUBTFIRE_ALLOW_UNAUTHENTICATED_PREVIEW=1 pnpm dev
```

Check each of these after every step.

- **Scale audit.** `grep -oE 'font-size: [^;]+;' src/app/globals.css | sort -u | wc -l` must fall from 34 to the size of the declared scale. Repeat for `font-weight` and for spacing.
- **Squint test.** Blur each screen until the text is illegible. The single most important element must still stand out, and the groups must still separate.
- **Solid-button count.** Count the solid high-contrast buttons in each viewport. More than one is a defect.
- **Contrast.** Measure every new border and every new text pair. Body text needs 4.5:1. Control boundaries and large text need 3:1.
- **Keyboard pass.** Tab through every screen. Every interactive element must show the focus outline, and no element may be reachable without one.
- **Extremes.** Check a Room name of 40 characters, a Task text of 200 characters, a Run with one Room, and a Run with no Due Tasks.
- **Both locales.** Check English and Finnish. Finnish strings are consistently longer and they break layouts that English survives.
- **Both devices.** Check 375 px and 1024 px. `PRODUCT.md` names a phone and a wall-mounted tablet, and the tablet is viewed from further away.
