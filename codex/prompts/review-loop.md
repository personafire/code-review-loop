<!-- GENERATED — do not edit directly.
     Source: plugins/review-loop/skills/review-loop/SKILL.md + references/
     Regenerate with: npm run build:adapters -->

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
duplicated logic that should be shared. Comment text is not this persona's
job — comment-quality owns it. Report the structural cause instead: a comment
that only exists to explain a bad name is a rename finding.

### test-coverage
New/changed behavior without a test, weak assertions, tests coupled to
implementation detail, missing edge-case coverage.

### comment-quality
Every comment this diff adds or changes, judged against `comment-standard.md`:
does it say something the code and `git log` cannot? Also flags comments the
change has made stale, and bare TODO/FIXME markers with no ticket or owner.
Read `comment-standard.md` before reviewing — it holds the keep list, the cut
list, the never-flag exemptions, and the severity guide. If the diff adds no
comments and stales none, return zero findings.

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
| `category` | enum | correctness \| maintainability \| test-coverage \| comment-quality \| security \| performance \| api-contract \| data-migrations \| concurrency |
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

**Comment fixes are not risky deletions.** Cutting or rewording a comment this
diff introduced is text-only and reversible, so it auto-applies on the normal
confidence rule. Two exceptions stay human-gated: removing a comment the diff did
not write, and anything on the never-flag list in `comment-standard.md`.

## Verify-after-fix
After applying auto-fixes, run the repo's tests/lint/build. If any fix breaks
them, revert that specific fix and move it to the human gate.

---

# Comment Standard

The bar: a comment earns its place only when it tells the reader something the
code in front of them and the tooling around it cannot. Everything else is
noise, and noise ages into lies.

## Keep — information the code can't carry

- **Why, not what.** The reason behind a non-obvious choice: "sorted here because
  the downstream matcher assumes ascending ids".
- **A rejected alternative with a live constraint.** "Can't use the batch
  endpoint — it caps at 100 ids and callers pass up to 500."
- **Invariants and preconditions the types don't express.** "Caller must hold the
  session lock." "Ids are unique per tenant, not globally."
- **Units, ranges, encodings.** "Timeout in milliseconds." "Returns basis points."
- **External anchors.** A spec section, RFC, ticket, vendor bug, benchmark. These
  point at context that lives outside the repo and can't be recovered from it.
- **Workarounds** — the upstream defect that forces the shape, and what would let
  it go away: `// Workaround for redis/redis#8271; drop once we're past 7.2.`
- **Traps.** "Do not reorder — the writer flushes on close."
- **Public API contracts.** Docstrings on exported surface: errors raised,
  nullability, ownership, side effects, thread-safety.

## Cut — comments that add nothing

- **Restating the code.** `// increment the counter` over `count += 1`. A
  docstring that only re-spells the signature in prose.
- **History the VCS already holds.** "Changed from map to filter." "Was
  synchronous before." "Renamed in v2." Changelog blocks, author/date headers.
  `git log` and `git blame` carry this; the file should not.
- **Narrating the change or the review.** "Fixed per review feedback." "Added
  null check here." "As discussed above." That is PR conversation, not source.
- **Decision journals.** Paragraphs justifying an ordinary choice nobody would
  question. If a rationale is durable and load-bearing, it belongs in one spec or
  ADR that comments can link to — not restated inline in five places.
- **Commented-out code.** Delete it. Git has it.
- **Section banners** standing in for structure: `// ===== HELPERS =====`.
- **Comments compensating for a bad name.** If the comment exists to explain what
  `handleData2` does, the fix is the rename.
- **Bare markers.** `// TODO fix later`, `// HACK`. Without a ticket and an owner
  it will never be picked up: `// TODO(PER-123): remove after the v2 migration`.
- **Stale comments** — anything the surrounding code no longer does. A wrong
  comment misleads worse than no comment at all.

## Never flag

License and copyright headers, SPDX tags, generated-file markers, lint and type
pragmas that state a reason (`// eslint-disable-next-line no-await-in-loop -- the
API is rate-limited per call`), compiler/serializer directives, doc comments a
documented project convention or doc generator requires, test names and
descriptions, and anything inside vendored or generated files.

## Rules of application

1. **Scope is what this change wrote.** Judge comments on lines this diff added
   or modified. Pre-existing comments are out of scope — with one exception.
2. **Stale-by-adjacency is in scope.** If this change made a nearby comment
   wrong, that comment is now this change's problem. Flag it.
3. **Prefer a rewrite to a delete** when a comment gestures at something real but
   says the wrong part — keep the constraint, drop the narration.
4. **Prefer better code to a comment.** If a rename, an extracted function, or a
   named constant removes the need for the comment, suggest that instead of
   wordsmithing.
5. **Match the file.** Dense docstrings on every method may be this codebase's
   convention, not a defect. Hold new code to the density and idiom around it.
6. **When genuinely unsure, keep the comment** and file nothing. Zero comment
   findings is a normal, good result — do not hunt for a quota.

## Severity guide

- **medium** — the comment is wrong, stale, or misleading, or it's a bare
  TODO/FIXME with no ticket. These actively cost the next reader time.
- **low** — the comment is merely dead weight: restates code, recounts history,
  narrates the review, journals a decision, or draws a banner.
- **Commented-out code** — low, unless it reads as a disabled code path someone
  intended to restore, which is a medium and a question for the author.

---

# Tunable Config

These are defaults. A project may override by editing this file in its local
install.

| Key | Default | Meaning |
|-----|---------|---------|
| `max_iterations` | 3 | hard cap on review→fix→re-review rounds |
| `auto_apply_threshold` | 0.8 | minimum confidence to auto-apply a fix |
| `risky_surfaces` | public/exported API, migrations, security findings, deletions (except comments this diff added) | forces the human gate regardless of confidence |
| `base_branch_order` | develop, main, master | order to auto-detect the review base |
