# Doubtfire

A household cleaning app. It holds the routines and tasks we clean by, tracks what has actually been done, and answers questions about what we neglect.

## Language

### Content

**Routine**:
A named cadence tier of cleaning work, such as Weekly or Quarterly. Carries a cadence and an optional `includes` pointer to another Routine, which resolves transitively.
_Avoid_: Checklist, plan, schedule

**Task**:
The only checkable thing in the app — one instruction that either happened or didn't. Belongs to exactly one Room and one home Routine.
_Avoid_: Item, chore, todo, step

**Note**:
Guidance attached to a Task that is not itself checkable, such as a hint about which tool makes the job easier.
_Avoid_: Description, subtask, comment

**Room**:
A place in the flat that Tasks belong to. Includes `Koti`, which covers whole-flat work such as running the robot vacuum.
_Avoid_: Area, zone, location, space

**Group**:
An optional presentational sub-heading within a Room, such as `Sofa`. Purely a visual cluster — never checkable, never carries due-ness, never appears in statistics.
_Avoid_: Category, section, subtask, parent task

**Cadence**:
How often a Routine's Tasks should be done, expressed in days. A Task inherits the cadence of its home Routine.
_Avoid_: Frequency, interval, schedule, period

### Doing the work

**Run**:
One cleaning day. Presents the Tasks that are due for a chosen Routine, accumulates Ticks, and closes when someone marks it done or at the 04:00 rollover.
_Avoid_: Session, sitting, workout, cleaning

**Tick**:
The record that a Task was completed during a Run, at a point in time.
_Avoid_: Completion, check, entry, event

**Due**:
The state of a Task whose cadence has elapsed since it was last Ticked. Due-ness belongs to the Task, never to the Routine or the Run.
_Avoid_: Pending, outstanding, overdue, owed, remaining

**Presented**:
The set of Tasks a Run showed. Recorded per Run so that "shown but not ticked" stays answerable later.
_Avoid_: Assigned, planned, scheduled

**Ignored**:
A Task that stayed Due for a full further cadence period without being Ticked. One missed cycle, counted once.
_Avoid_: Skipped, failed, missed, incomplete

**Archived**:
A Task, Room or Routine withdrawn from future Runs while keeping its identity and its history. Content is never deleted.
_Avoid_: Deleted, removed, disabled, hidden
