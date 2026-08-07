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
