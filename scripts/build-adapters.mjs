// Compiles the self-contained Cursor and Codex adapters from the core skill.
// The core SKILL.md + references/ are the single source of truth; these two
// tools can't resolve the core's relative reference paths from a user's own
// repo, so they get a flattened copy instead of a thin pointer.
//
// Run with: npm run build:adapters

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const coreDir = join(root, "plugins/review-loop/skills/review-loop");

const read = (p) => readFileSync(join(coreDir, p), "utf8");

// SKILL.md's frontmatter and its "Reference files" pointer list are meaningful
// only in the installed-plugin layout; strip both so the flattened copy reads
// as one document with the reference material inlined below.
function skillProcedure() {
  return read("SKILL.md")
    .replace(/^---\n[\s\S]*?\n---\n/, "")
    .replace(/\n## Reference files \(read as needed\)[\s\S]*?(?=\n## )/, "\n")
    .trim();
}

const refs = ["personas.md", "findings-schema.md", "severity-rubric.md", "config.md"]
  .map((f) => read(join("references", f)).trim());

const body = [
  skillProcedure(),
  "---",
  "## Reference material\n\n" + refs.join("\n\n---\n\n"),
].join("\n\n");

const banner =
  "<!-- GENERATED — do not edit directly.\n" +
  "     Source: plugins/review-loop/skills/review-loop/SKILL.md + references/\n" +
  "     Regenerate with: npm run build:adapters -->\n";

const targets = [
  ".cursor/commands/review-loop.md",
  "codex/prompts/review-loop.md",
];

for (const rel of targets) {
  writeFileSync(join(root, rel), banner + "\n" + body + "\n");
  console.log("wrote", rel);
}
