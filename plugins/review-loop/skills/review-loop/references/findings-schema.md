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
