# Installing the Code Review Loop for OpenCode

## Prerequisites

- [OpenCode](https://opencode.ai) installed (a recent version — native `skill`
  tool + git-backed plugins required)

## Installation

Add `review-loop` to the `plugin` array in your `opencode.json` (project-level
or the global `~/.config/opencode/opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["review-loop@git+https://github.com/personafire/code-review-loop.git"]
}
```

Restart OpenCode. OpenCode installs the git-backed plugin through its own plugin
manager (Bun) and the plugin registers this repo's `review-loop` skill with
OpenCode's native `skill` tool — no symlinks or file copying needed.

To pin a specific version, append a git ref:

```json
{
  "plugin": ["review-loop@git+https://github.com/personafire/code-review-loop.git#v0.1.0"]
}
```

## How it works

- The plugin entry (`.opencode/plugin.js`, referenced by `package.json`'s `main`)
  runs a `config` hook that adds this repo's `plugins/review-loop/skills`
  directory to `config.skills.paths`.
- OpenCode's native `skill` tool then discovers `review-loop/SKILL.md` and can
  load it on demand.
- All review logic lives in `plugins/review-loop/skills/review-loop/SKILL.md`
  and its `references/` — the plugin only points OpenCode at it.

## Usage

Just ask for a review; OpenCode's `skill` tool surfaces `review-loop` based on
its description:

```
review this
run the review loop on my changes
```

Or drive the skill tool explicitly:

```
use the skill tool to list skills
use the skill tool to load review-loop
```

An argument (a PR number/URL, a branch, `staged`, or file paths) is treated as
the review-target override; otherwise the loop reviews the current changes.

## Troubleshooting

### Plugin or skill not loading

1. Check logs: `opencode run --print-logs "hello" 2>&1 | grep -i review-loop`
2. Verify the `plugin` line in your `opencode.json`.
3. Confirm the skill is discovered: ask OpenCode to "use the skill tool to list
   skills" and look for `review-loop`.
4. Make sure you're on a recent OpenCode build (older builds lack the native
   `skill` tool / `config.skills.paths`).

### Updates not appearing

OpenCode/Bun may pin the resolved git dependency in a lockfile or cache, so a
restart might not pick up the newest commit. If updates don't appear, clear
OpenCode's package cache (`~/.cache/opencode/node_modules/`) or reinstall.

## Other harnesses

This repo also ships adapters for Claude Code (`plugins/review-loop/`), Cursor
(`.cursor/commands/review-loop.md`), and Codex (`codex/prompts/review-loop.md`).
Install for each harness separately; they all point at the same core SKILL.md.
