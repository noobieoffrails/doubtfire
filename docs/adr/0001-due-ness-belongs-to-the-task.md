# Due-ness belongs to the Task, not the Run

A Run is one cleaning day and closes with Tasks left un-ticked — that is the normal case, not a failure. So rather than tracking partial completion of a Routine, each Task carries its own due-ness, derived from its home Routine's cadence and the timestamp of its last Tick. A Run simply presents whatever is Due.

## Consequences

- **Carry-over is automatic and invisible.** Tick 23 of 61 on Saturday, close the Run, start a fresh Run on Sunday and it shows the 38 still Due. Nothing is resumed, and the app never refers to the 23 already done.
- **Postponement is not a feature.** There is no snooze, defer or reschedule: an un-ticked Task is not overdue work, it is simply still Due. Any postpone UI would be a second, redundant mechanism.
- **Closing a Run early is harmless.** Starting another costs one tap and loses nothing, which is why `Mark as done` closes the Run for the whole household rather than guarding against premature closure.
- **There is no single record of "the Q3 quarterly clean."** A big clean spread over two days is two Runs. Elapsed time across a multi-day clean is inferred from Run history rather than read off one row. Accepted knowingly.
- **Cadence edits are retroactive and instant**, since due-ness is derived. Moving a Task between Routines changes its cadence and keeps its Tick history.
