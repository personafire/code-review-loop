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
