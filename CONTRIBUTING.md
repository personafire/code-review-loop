# Contributing

Thanks for helping improve Code Review Loop. It's a small repo — here's what you need.

## Workflow

`main` is protected: every change lands through a pull request, no direct pushes.

1. Branch off `main`.
2. Make your change (see **Editing the skill**).
3. Run the checks.
4. Open a PR against `main`.

## Editing the skill

All review logic lives in the core skill — **edit that, never the generated copies**:

- `plugins/review-loop/skills/review-loop/SKILL.md` — the loop procedure
- `plugins/review-loop/skills/review-loop/references/` — personas, findings schema, severity rubric, config

The Cursor and Codex adapters (`.cursor/commands/review-loop.md`, `codex/prompts/review-loop.md`)
are **generated** and carry a do-not-edit banner. After changing the core, regenerate and
commit them alongside your change:

```bash
npm run build:adapters
```

## Checks before opening a PR

```bash
npm run build:adapters                                  # regenerate; leaves no diff if adapters are current
jq empty .claude-plugin/marketplace.json
jq empty plugins/review-loop/.claude-plugin/plugin.json
node --check .opencode/plugin.js
```

## Commits

Keep messages to what changed and why. Conventional-commit prefixes
(`feat:`, `docs:`, `fix:`, `chore:`) are welcome.
