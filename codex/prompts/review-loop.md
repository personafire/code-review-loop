<!-- GENERATED — do not edit directly.
     Source: plugins/review-loop/skills/review-loop/SKILL.md + references/
     Regenerate with: npm run build:adapters -->

# Code Review Loop

Run an iterative, multi-agent code review: fan out reviewer personas, merge
their findings, auto-apply the safe fixes, verify nothing broke, then re-review
— repeating until the diff is clean or only human decisions remain.


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

---

## Reference material

# Reviewer Personas

Each persona reviews the resolved diff and returns findings in the schema shape.
"Trigger" is when to include a conditional persona; always-on personas run every time.

## Always-on

### correctness
Logic errors, wrong edge-case handling, off-by-one, state/ordering bugs, error
paths that swallow or mis-propagate, intent-vs-implementation mismatch.

### maintainability
Premature abstraction, dead code, misleading names, unnecessary coupling,
duplicated logic that should be shared.

### test-coverage
New/changed behavior without a test, weak assertions, tests coupled to
implementation detail, missing edge-case coverage.

## Conditional

### security  — trigger: auth code, user input handling, public endpoints, permission checks, crypto, secrets
Exploitable input handling, authz gaps, injection, secret exposure. NOTE:
security findings are always human-gated (see severity-rubric.md).

### performance  — trigger: DB queries, hot loops, N+1 patterns, large-collection transforms, IO-heavy paths
Algorithmic blowups, N+1 queries, avoidable IO, unbounded growth.

### api-contract  — trigger: route definitions, request/response types, serializers, exported/public signatures, versioning
Breaking changes to a consumed contract, silent shape changes, missing versioning.

### data-migrations  — trigger: migration files, schema changes, backfills, enum/column renames
Irreversible/destructive migrations, unsafe backfills, lock risk, drift from schema.

### concurrency  — trigger: async/await, threads, background jobs, DOM-timing-sensitive frontend code
Races, missing awaits, ordering assumptions, shared-state mutation.

---

# Findings Schema

Every reviewer returns a list of findings, each with these fields:

| Field | Type | Notes |
|-------|------|-------|
| `file` | string | repo-relative path |
| `line` | integer | 1-indexed; best-effort anchor |
| `category` | enum | correctness \| maintainability \| test-coverage \| security \| performance \| api-contract \| data-migrations \| concurrency |
| `severity` | enum | critical \| high \| medium \| low |
| `confidence` | number | 0.0–1.0 |
| `problem` | string | one-sentence statement of the defect |
| `suggested_fix` | string | concrete change, or "human decision needed: …" |

Reviewers must not invent findings to fill quota. Zero findings is a valid,
good result.

---

# Severity Rubric & Fix Gate

## Severity (orders the report; never on its own forces or suppresses a fix)
- **critical** — data loss, security breach, or crash on a common path
- **high** — incorrect behavior on a realistic path
- **medium** — narrow-case bug, notable maintainability/perf issue
- **low** — nit, style, minor clarity

## Dedup tiebreak
Same `file:line` collapses to one finding: keep the **higher severity**; if
severity ties, keep the **higher confidence**.

## The fix gate (decided by confidence + risk, NOT severity)
Auto-apply a fix when BOTH:
1. `confidence >= auto_apply_threshold` (see config.md), AND
2. the fix is not in a risky zone.

Human-gate (report only, never auto-change) when ANY of:
- `confidence < auto_apply_threshold`, OR
- reviewers disagree on the same location, OR
- the fix touches a **risky surface**: public/exported API, migrations,
  security-category findings (always), or deletions of code/data.

## Verify-after-fix
After applying auto-fixes, run the repo's tests/lint/build. If any fix breaks
them, revert that specific fix and move it to the human gate.

---

# Tunable Config

These are defaults. A project may override by editing this file in its local
install.

| Key | Default | Meaning |
|-----|---------|---------|
| `max_iterations` | 3 | hard cap on review→fix→re-review rounds |
| `auto_apply_threshold` | 0.8 | minimum confidence to auto-apply a fix |
| `risky_surfaces` | public/exported API, migrations, security findings, deletions | forces the human gate regardless of confidence |
| `base_branch_order` | develop, main, master | order to auto-detect the review base |
