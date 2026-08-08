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

## Trigger it

```text
/review-loop
```

Or OpenCode's skill tool, where slash commands aren't used.

Claude Code namespaces every plugin component, so its picker lists this as
`/review-loop:review-loop`. Typing the short `/review-loop` still resolves — the
skill registers it as an alias.

### Depth and target

Anything after the command is passed through. A depth word tunes the run; anything
else is read as a target override.

```text
/review-loop light        # always-on personas only, single pass
/review-loop deep         # every persona, whether or not the diff triggers it
/review-loop 412          # review PR 412 instead of the working tree
/review-loop deep staged  # both
```

| Depth | Panel | Iteration cap |
|-------|-------|---------------|
| `light` | the four always-on personas; skips conditionals | 1 |
| *(default)* | always-on plus conditionals the diff triggers | 3 |
| `deep` | every persona, conditionals included unconditionally | 5 |

Depth changes what gets reviewed and how long the loop runs. It never changes what
auto-applies — the confidence-and-risk gate is the same at every depth.

A target override is a PR number or URL, a branch name, `staged`, or file paths.
With no target, the loop resolves one itself: dirty tree → the working diff, clean
tree → branch-vs-base.

## What a run does
1. Resolves the target (dirty tree → working diff; clean → branch-vs-base; override wins).
2. Selects reviewer personas — four always, plus conditional ones by what the diff touches.
3. Fans them out, merges + dedupes findings.
4. Auto-applies high-confidence non-risky fixes; human-gates the rest; verifies via tests/lint/build.
5. Re-reviews until clean, only human items remain, or the iteration cap hits.
6. Reports; leaves fixes as a reviewable diff (never auto-commits).

## What gets reviewed
**correctness**, **maintainability**, **test-coverage**, and **comment-quality**
run on every diff. **security**, **performance**, **api-contract**,
**data-migrations**, and **concurrency** join only when the diff touches their
surface.

comment-quality holds every comment the diff writes to one test: does it say
something the code and `git log` cannot? It cuts restated code, history the VCS
already carries, review narration, decision journals, and bare TODOs — and flags
comments the change made stale. License headers, lint pragmas, and
convention-required docs are never touched. Full standard:
[`comment-standard.md`](plugins/review-loop/skills/review-loop/references/comment-standard.md).

## Verify it loads (per tool)
1. Install via the tool's mechanism (test both global and local).
2. In a repo with deliberate issues, make the tree dirty.
3. Trigger `/review-loop`.
4. Confirm it states the resolved target and produces a findings report.
5. Confirm auto-fix → verify → re-review runs and the loop stops correctly.
6. Trigger `/review-loop light` and confirm it names the depth back and runs one pass.
