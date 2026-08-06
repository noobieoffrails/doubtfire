# Repository instructions

## Product sources

- Read `CONTEXT.md` before you change the product. Use its domain terms in code, UI text, documentation, and commits.
- Treat the decisions in `docs/adr/` as settled. Do not reopen a settled decision unless the repository owner asks you to do so.
- Follow `docs/implementation-plan.md`. Do not put real household content in this public repository.

## Skills

- Use the available Matt Pocock skills when they are suitable for the work.
- Use the `implement` skill for all implementation work.
- Use test-driven development at an agreed test boundary.
- Run type checks and focused tests regularly. Run the full test suite at the end.
- Use the `code-review` skill when implementation is complete.

## Git workflow

- Do not change files in the `main` branch or its worktree.
- Create a dedicated Git worktree and branch for each piece of work. Put local worktrees in `.worktrees/`.
- Use a short branch name with a clear prefix, such as `feat/`, `fix/`, `docs/`, or `chore/`.
- Divide the work into small, meaningful commits. Each commit must contain one coherent change.
- Commit completed work to the current branch.
- Use `origin/main` as the fixed point for code reviews.
- Do not merge a branch into `main` automatically.
- Push the branch and use a pull request or merge request for integration.

## Communication

- Use ASD-STE100 Simplified Technical English for English prose. This includes documentation, comments, commit messages, pull requests, and project communication.
- Keep code identifiers consistent with the language, framework, and domain model.
- If a requirement is not clear, stop and ask the repository owner. Ask one question at a time and include a recommended answer.
