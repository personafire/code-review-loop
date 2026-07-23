# Code Review Loop

A portable multi-agent code-review-loop skill for coding agents. It fans out
reviewer personas, merges findings, auto-applies the safe fixes, verifies
nothing broke, and re-reviews until the diff is clean or only human decisions
remain. All logic lives in one `SKILL.md`; each tool loads it via a thin adapter.

## Install

| Tool | Global / Local | Steps |
|------|----------------|-------|
| Claude Code | both | `/plugin marketplace add personafire/code-review-loop` then `/plugin install review-loop@code-review-loop` |
| Cursor | both | consume the same marketplace, or copy `.cursor/commands/review-loop.md` into your repo's `.cursor/commands/` |
| OpenCode | both | add `"review-loop@git+https://github.com/personafire/code-review-loop.git"` to the `plugin` array in `opencode.json` (see `.opencode/INSTALL.md`) |
| Codex | both | copy `codex/prompts/review-loop.md` into `~/.codex/prompts/` (global) or the project prompts dir (local) |

Trigger with `/review-loop` (or OpenCode's skill tool where slash commands aren't used).

## What a run does
1. Resolves the target (dirty tree → working diff; clean → branch-vs-base; override wins).
2. Selects reviewer personas by what the diff touches.
3. Fans them out, merges + dedupes findings.
4. Auto-applies high-confidence non-risky fixes; human-gates the rest; verifies via tests/lint/build.
5. Re-reviews until clean, only human items remain, or the iteration cap hits.
6. Reports; leaves fixes as a reviewable diff (never auto-commits).

## Verify it loads (per tool)
1. Install via the tool's mechanism (test both global and local).
2. In a repo with deliberate issues, make the tree dirty.
3. Trigger `/review-loop`.
4. Confirm it states the resolved target and produces a findings report.
5. Confirm auto-fix → verify → re-review runs and the loop stops correctly.
