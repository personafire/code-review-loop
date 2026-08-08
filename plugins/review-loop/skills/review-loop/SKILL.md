---
name: review-loop
description: Use when the user wants a code review before committing/opening a PR, or says "review this", "review loop", "check my changes". Runs a multi-agent review that auto-fixes safe findings and re-reviews until clean.
argument-hint: "[light|deep] and/or a target (PR number, branch, staged, paths)"
---

# Code Review Loop

Run an iterative, multi-agent code review: fan out reviewer personas, merge
their findings, auto-apply the safe fixes, verify nothing broke, then re-review
— repeating until the diff is clean or only human decisions remain.

## Arguments

`$ARGUMENTS` holds whatever followed the invocation — a depth word, a target
override, both, or nothing. Read each independently.

**Depth** sets the panel and the iteration cap. It never loosens the fix gate:
what auto-applies is the same at every depth.

| Depth | Panel | Iteration cap |
|-------|-------|---------------|
| `light` | the four always-on personas; skip every conditional | 1 |
| *(absent)* | always-on plus conditionals the diff triggers | config `max_iterations` |
| `deep` | every persona, conditionals included whether or not the diff triggers them | config `max_iterations` + 2 |

**Target override** — a PR number/URL, a branch name, `staged`, or file paths.
Feeds step 1. Anything that isn't a depth word is a target.

## Reference files (read as needed)
- `references/personas.md` — which reviewers exist and when each is triggered
- `references/findings-schema.md` — the structured finding shape all reviewers return
- `references/severity-rubric.md` — severity levels, risky surfaces, the fix gate
- `references/comment-standard.md` — the bar every new comment has to clear
- `references/config.md` — tunable defaults (iteration cap, confidence threshold, risky list)

## Procedure

### 1. Resolve the target
- If the working tree is dirty → review the uncommitted diff (`git diff HEAD`).
- If clean → review branch-vs-base. Auto-detect base in order: `develop`, then
  `main`, then `master` (first that exists and is an ancestor).
- Override always wins: a PR number/URL, an explicit branch, `staged`
  (`git diff --cached`), or explicit file paths passed by the user.
- State the resolved target back to the user before reviewing, along with the
  depth if one was passed.

### 2. Select the panel
Read `references/personas.md`. Always run: correctness, maintainability,
test-coverage, comment-quality. Add conditional personas only when the diff's
files/contents match their trigger signals (security, performance, api-contract,
data-migrations, concurrency). Do not spin up personas the diff doesn't warrant.
The depth argument overrides this both ways — see **Arguments**.

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
- Cutting or rewriting a comment this diff introduced is not a risky deletion —
  it auto-applies on the normal confidence rule. Removing a comment the diff did
  not write is human-gated.
- After applying, **verify**: detect and run the repo's tests / lint / build. If
  a fix breaks them, revert that fix and move it to the human gate.

### 5. Converge, then loop
Re-run the panel on the new diff. Stop when any of: no auto-fixable findings
remain, only human-gated items are left, or the iteration cap is hit (config
default 3; the depth argument can override it). If the same finding reappears
after being "fixed" (oscillation), stop and human-gate it.

### 6. Report
Summarize: what was found, what was auto-fixed, what needs a human decision, and
which verification commands ran with their results. Do NOT commit — leave fixes
as a reviewable diff unless the user explicitly asks to commit.
