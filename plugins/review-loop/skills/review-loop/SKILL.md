---
name: review-loop
description: Use when the user wants a code review before committing/opening a PR, or says "review this", "review loop", "check my changes". Runs a multi-agent review that auto-fixes safe findings and re-reviews until clean.
---

# Code Review Loop

Run an iterative, multi-agent code review: fan out reviewer personas, merge
their findings, auto-apply the safe fixes, verify nothing broke, then re-review
— repeating until the diff is clean or only human decisions remain.

## Reference files (read as needed)
- `references/personas.md` — which reviewers exist and when each is triggered
- `references/findings-schema.md` — the structured finding shape all reviewers return
- `references/severity-rubric.md` — severity levels, risky surfaces, the fix gate
- `references/config.md` — tunable defaults (iteration cap, confidence threshold, risky list)

## Procedure

### 1. Resolve the target
- If the working tree is dirty → review the uncommitted diff (`git diff HEAD`).
- If clean → review branch-vs-base. Auto-detect base in order: `develop`, then
  `main`, then `master` (first that exists and is an ancestor).
- Override always wins: a PR number/URL, an explicit branch, `staged`
  (`git diff --cached`), or explicit file paths passed by the user.
- State the resolved target back to the user before reviewing.

### 2. Select the panel
Read `references/personas.md`. Always run: correctness, maintainability,
test-coverage. Add conditional personas only when the diff's files/contents
match their trigger signals (security, performance, api-contract,
data-migrations, concurrency). Do not spin up personas the diff doesn't warrant.

### 3. Fan out reviewers
- Where the tool supports parallel subagents, dispatch one per selected persona
  concurrently. Where it does not, run them as sequential review lenses in one
  pass. Either way each returns findings in the `findings-schema.md` shape.
- Merge and dedupe findings: same `file:line` collapses; higher severity wins,
  confidence breaks ties (see rubric).

### 4. Apply fixes, gated by confidence + risk (not severity)
Per `severity-rubric.md`:
- **Auto-apply** a finding's fix when confidence ≥ the config threshold AND it is
  not in a risky zone — regardless of severity.
- **Human-gate** (report, do not change) when confidence is below threshold,
  reviewers disagree, or the fix touches a risky surface (public API, migrations,
  security-category findings, deletions).
- After applying, **verify**: detect and run the repo's tests / lint / build. If
  a fix breaks them, revert that fix and move it to the human gate.

### 5. Converge, then loop
Re-run the panel on the new diff. Stop when any of: no auto-fixable findings
remain, only human-gated items are left, or the iteration cap (config default 3)
is hit. If the same finding reappears after being "fixed" (oscillation), stop and
human-gate it.

### 6. Report
Summarize: what was found, what was auto-fixed, what needs a human decision, and
which verification commands ran with their results. Do NOT commit — leave fixes
as a reviewable diff unless the user explicitly asks to commit.
