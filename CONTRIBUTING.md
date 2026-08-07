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

## Two manifests, one skill

`plugins/review-loop/` carries a manifest for each of two plugin formats over a single
copy of the skill:

- `plugin.json` — clients that implement [Agent Plugins 1.0](https://agent-plugins.org/)
  read this file.
- `.claude-plugin/plugin.json` — Claude Code reads this file.

Both formats discover skills at the plugin root's `skills/`, so they share
`skills/review-loop/` with no duplication. `LICENSE` sits in the plugin root too, because
clients install that directory as the whole unit.

Four files carry this plugin's identity — the two manifests, `package.json`, and the
`plugins[]` entry in `.claude-plugin/marketplace.json`. Don't sync them by hand:

```bash
npm run check:manifests
```

That also validates `plugin.json` against Agent Plugins 1.0, which `jq empty` cannot do.
The schema sets `additionalProperties: false` and pins `$schema` with `const`, and the
spec makes every violation fatal at load except an unknown top-level field — which clients
report and ignore. So a stray field or a typo'd `$schema` parses fine and then fails in
every client.

Agent Plugins 1.0 covers skills and MCP servers only — commands, hooks, and agents are
explicitly out of scope. `commands/review-loop.md` stays Claude Code-specific, and the
Cursor, Codex, and OpenCode adapters stay as they are. To attach client-specific data to
`plugin.json`, the spec's sanctioned slot is the `extensions` object, keyed by
reverse-domain namespace. Nothing here needs it yet.

## Checks before opening a PR

```bash
npm run build:adapters                                  # regenerate; leaves no diff if adapters are current
npm run check:manifests                                 # validates plugin.json and cross-checks all four manifests
jq empty .claude-plugin/marketplace.json
node --check .opencode/plugin.js
```

## Commits

Keep messages to what changed and why. Conventional-commit prefixes
(`feat:`, `docs:`, `fix:`, `chore:`) are welcome.
