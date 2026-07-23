# Code Review Loop

A portable multi-agent code-review-loop skill for coding agents. It fans out
reviewer personas, merges findings, auto-applies the safe fixes, verifies
nothing broke, and re-reviews until the diff is clean or only human decisions
remain. All logic lives in one core `SKILL.md`; each tool gets it via a thin
adapter or a self-contained copy generated from that core.

## Install

All four tools support a global install (available in every project) and a local
install (scoped to one repo). Each command below is its own copy-paste block.

### Claude Code

Register the marketplace:

```text
/plugin marketplace add personafire/code-review-loop
```

Install the plugin — choose **User** scope when prompted for a global install, or
**Project**/**Local** to scope it to the current repo:

```text
/plugin install review-loop@code-review-loop
```

### OpenCode

OpenCode uses its own plugin install — set it up separately even if you already
use this in another tool.

Tell OpenCode:

```text
Fetch and follow instructions from https://raw.githubusercontent.com/personafire/code-review-loop/main/.opencode/INSTALL.md
```

Detailed docs: [`.opencode/INSTALL.md`](.opencode/INSTALL.md)

### Cursor

Consume the same marketplace via Cursor's plugin UI, or copy the adapter into the
target repo:

```bash
mkdir -p .cursor/commands
curl -sSL https://raw.githubusercontent.com/personafire/code-review-loop/main/.cursor/commands/review-loop.md \
  -o .cursor/commands/review-loop.md
```

### Codex

Copy the prompt into your Codex prompts directory — `~/.codex/prompts/` for a
global install, or the project prompts dir for a local one:

```bash
mkdir -p ~/.codex/prompts
curl -sSL https://raw.githubusercontent.com/personafire/code-review-loop/main/codex/prompts/review-loop.md \
  -o ~/.codex/prompts/review-loop.md
```

---

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
