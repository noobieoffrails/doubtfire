---
name: Doubtfire
description: Calm household care shaped through broad color islands.
tokenSource: "src/app/globals.css :root"
---

# Doubtfire interface design system

## Authority

This file describes the interface rules and the patterns that use them. It does not copy the token values.

The `:root` block in `src/app/globals.css` is the source of truth for color, type, spacing, shape, motion, effects, and interface dimensions. Add or change a value there first. Application rules must use a token instead of a new literal value.

The token families are:

| Family | CSS custom properties | Purpose |
| --- | --- | --- |
| Spacing | `--space-*` | Gaps, padding, margins, and control height |
| Type | `--text-*`, `--weight-*`, `--tracking-*`, `--measure-*` | Type hierarchy and readable line length |
| Shape | `--radius-*`, `--stroke-*` | Controls, islands, panels, and focus outlines |
| Motion | `--duration-*`, `--ease-*` | Feedback and the care-image entrance |
| Size | `--size-*`, `--blur-*` | Named component and layout dimensions |
| Color | Named ink, action, surface, state, and glow properties | Text, controls, feedback, and atmosphere |
| Effect | `--shadow-*` | Action, control, art, toast, Room, and surface depth |

Media-query conditions, percentages, viewport units, and unitless geometry can remain local when CSS needs them for context. They must not become an independent visual scale.

## Design direction

The creative direction is **Color islands**. Familiar household controls sit on open white or ice surfaces. Broad sky, mint, and lilac fields make choices clear and give the product its identity. Deep navy carries the hierarchy. Cobalt identifies actions, focus, and active state.

The interface is calm, direct, and supportive. It helps the household start and continue a Run without showing debt, urgency, or competition.

The main rules are:

- Use broad color fields for important choices. Do not turn them into small status badges.
- Keep one clear primary action in each state.
- Use spacing and color before borders or shadows.
- Use asymmetric soft shapes for signature islands. Do not put every region in a rounded card.
- Show count-ups and completed work. Do not show denominators, outstanding counts, scores, lateness, or progress bars.
- Keep authored content neutral. Due Tasks do not get warning treatment.

## Foundations

### Color

Use the ink tokens for text hierarchy and the white and ice tokens for the main surfaces. Use cobalt for primary actions, focus, and active controls. Sky, mint, and lilac organize Routine, Room, and Settings choices. Stronger forms of these colors support selection and small accents.

Success and error colors have explicit state tokens. Error feedback can use the soft error surface. Coral is a rare decorative accent and never means danger, debt, or urgency.

### Typography

The interface uses Manrope with a sans-serif fallback. Use the type tokens in `globals.css`; do not restate their values here.

- Display type is for the Home greeting and completion message only.
- Headline type identifies a screen or major section.
- Title type identifies strong choices such as Routines and Rooms.
- Body type carries instructions, Task text, Notes, and form content.
- Small type is reserved for supporting information. It must remain readable at 200% text size.
- Supporting copy uses the measure tokens. Do not let paragraphs stretch across a wide panel.

Use sentence case in both interface locales. Keep the domain terms from `CONTEXT.md` and proper names capitalized where the language requires it.

### Spacing and grouping

Use only the spacing tokens. Space inside a group must be smaller than the space around it. A heading, its description, and its controls form one group. Separate the next section with a larger gap.

Phone layouts use one main column. Wide layouts can use two columns when the content remains in a clear reading and keyboard order.

### Shape and depth

Controls use compact radii. Routine, Room, completion, Settings, and decorative islands use named asymmetric radii. Full pills are for compact toggles and choice controls.

The system is almost flat. Use the action shadow for an enabled primary action, the Room shadow for navigable Room islands, the toast shadow for transient feedback, and the surface shadow for the contained wide-screen panel. Do not add a shadow only for decoration.

### Icons and art

Lucide icons use a consistent authored line style. Decorative icons are hidden from assistive technology. Icon-only controls need a localized accessible name.

The Home care image and the simple island linework support the composition. They do not carry information. The Home image can settle into place when reduced motion is not requested.

## Responsive structure

Phone and wall-mounted tablet are both input devices. Both people can Tick Tasks while they clean.

On a phone, each application surface fills the viewport. Home and Settings use the bottom navigation. The Run flow removes that navigation so the current cleaning action stays prominent. Sticky action regions respect the safe-area inset.

At the wide breakpoint declared in `globals.css`, the application becomes a contained panel on the ice ground:

- Home becomes a two-column composition with the welcome and care image beside the Routine choices.
- Run and Settings use the same contained surface and larger targets, text, gaps, and Room islands.
- Settings forms can use two columns, while wide fields span the full form.
- The bottom navigation joins the Home or Settings panel flow instead of floating over it.

All routes must reflow at a narrow phone viewport when the root text size is doubled. Horizontal page scrolling is a failure.

## Screen patterns

### Home

Home has three exclusive states.

**Ready to start:** Show the greeting, short instruction, care image, and active Routine choices. Routines come from household content; there are no fixed names or fixed count. Present them as one named radio group. Cycle the sky, mint, and lilac island treatments when the list is longer than the visual set. Put the primary start action after the Routine list so visual and keyboard order agree.

When no active Routine exists, keep the start action disabled and explain how to add one in Settings. When the last closed Run can be reopened, show one quiet resumable-Run island before the Routine list.

**Run open:** Replace the greeting with the in-progress message and an absolute Tasks-done count. Show one primary action to continue the Run and show its current Routine. Do not show alternative Routines or another start action.

### Run overview

The Run header shows the wordmark, current Routine, and absolute Tasks-done count. The default overview is Rooms. Each Room is a broad navigable island with its name and its own count-up.

A segmented choice switches between Rooms and all Tasks. The all-Tasks view is secondary and remembers the choice on the device. Keep `Mark as done` after the overview content. An empty Run uses a neutral empty state and still allows the Run to close.

### Room Task view

The Room view uses a headline, a back control, and a named Room switcher. Group labels are quiet subheadings. They organize Tasks but are not controls and do not carry progress.

Each Task has a large Tick target, a visible control state, and an optional Note below it. A Tick changes immediately and then synchronizes. If synchronization fails, restore the confirmed state and show a localized inline retry action for that Task.

The bottom action moves to the next Room. In the last Room, it returns to the Room overview. The action is large enough for phone and wall-mounted tablet use.

### Completion and undo

Closing a Run opens a dedicated completion surface. Use display type, a calm completion island, an absolute Tasks-done count, and a Home link. Do not show a fraction or compare the result with the Presented set.

Show the temporary undo toast as a status message after close. It contains one clear undo action. A failed close or reopen uses the persistent localized alert region.

### Settings

Settings uses one long management page with in-page links to Routines, Rooms, Tasks, and archived content. Each active-content manager has a heading, a short description, a toned icon, one add disclosure, and editable content rows.

- Routine forms manage the name, Cadence, and included Routine.
- Room forms manage the name.
- Task forms manage the Task text, Routine, Room, optional Group, and optional Note.
- Task creation stays unavailable until an active Routine and Room exist. Explain this dependency next to the unavailable state.

Add and edit forms use visible labels. Add disclosures open automatically for an empty manager. Existing rows open into an editor. Archive is a separate nested disclosure with explanatory text so it has more friction than save.

The archived-content manager groups archived Routines, Rooms, and Tasks. Restore is direct when the required active references exist. If an archived Task depends on an archived Room or Routine, explain the dependency instead of offering an action that cannot succeed.

### Authentication and supporting pages

The sign-in page uses a split composition on wide screens and one column on phones. Its introduction, language toggle, Clerk form, and cookie-information link use the same type and color system.

Access denied, not found, and unexpected error pages reuse the quiet introduction pattern. Give the user one clear recovery action. Never show a thrown error message in the interface.

The cookie-information page is a narrow reading surface with the wordmark, language toggle, clear heading order, and a route back to sign in.

### Loading, empty, and error states

Run and Settings loading routes use skeletons that match the destination layout. The visible skeleton is decorative. A localized screen-reader status announces loading, and the route is marked busy.

Empty states stay close to the content they explain. They use neutral surfaces and direct next-step copy. Errors use localized dictionary text, an alert or live region, and a retry only when retry can help.

## Component rules

### Actions

The cobalt button is the primary action. It has hover, active, focus, pending, and disabled states. A pending label must acknowledge the action immediately. Disabled controls stay legible and have nearby explanatory text when the reason is not clear.

Secondary actions use a quieter fill, outline, or text treatment. Destructive archive actions use the error color only inside the explicit archive disclosure. Links that look like buttons must keep link behavior and accessible focus.

### Choice controls

Routine islands are native radio controls with full-field labels. Segmented Run choices and the Room switcher use pressed buttons. Selection must remain clear without color alone, and every target must meet the current target-size tokens.

### Navigation

Primary navigation contains Home and Settings. The current destination uses cobalt and `aria-current`. Run navigation is a separate named landmark that contains the wordmark, Routine, and count-up.

### Forms and disclosures

Place each label above its field. Use one column on phones and the documented wide form grid when space allows. Keep success and error feedback in the form footer so it stays connected to the action.

Use native `details` and `summary` for add, edit, and archive disclosures. The summary is the target. Keep its chevron and focus state consistent.

### Feedback and motion

Every action must show a visible change within 100 ms. Optimistic Ticks, pending labels, disabled pending actions, inline form messages, alerts, and the undo toast are the standard feedback patterns.

Motion is short and functional. Do not animate core navigation or Task state in a way that delays input. Honor `prefers-reduced-motion` for optional motion.

## Accessibility and language

- Meet WCAG 2.2 Level AA contrast and reflow requirements.
- Keep keyboard order equal to visual order. The vertical position of successive stops must not move backward through the page.
- Use real buttons, links, labels, headings, lists, landmarks, and form controls.
- Keep focus visible with the global focus tokens.
- Keep interactive targets usable with occupied hands on both supported device types.
- Associate status and error text with live regions. Keep the Run alert mounted so repeated failures announce.
- Put all interface copy in `src/i18n/config.ts` in English and Finnish. Content entered by the household is not translated.
- Use the domain terms in `CONTEXT.md`. A Routine is not a checklist, a Room is not an area, and a Task is the only checkable thing.

## Maintenance checklist

When the interface changes:

1. Add or change tokens in `src/app/globals.css` before component rules use them.
2. Reuse a semantic class or add one that states the pattern's role.
3. Update this file when a screen, state, or reusable pattern changes.
4. Check phone and wall-mounted tablet layouts with both locales and realistic invented content.
5. Test keyboard order, visible focus, 200% text size, reduced motion, loading, empty, pending, success, and failure states.
6. Check every new count and status against ADR 0002 before it ships.
