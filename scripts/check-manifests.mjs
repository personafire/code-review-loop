// Validates the Agent Plugins manifest and keeps the repo's manifests in sync.
//
// `jq empty` only proves a file parses. The Agent Plugins schema is
// additionalProperties:false with $schema pinned by const, and the spec makes
// every violation except an unknown top-level field fatal at load — so a typo'd
// $schema or a stray field parses fine and then fails in every client.
//
// Run with: npm run check:manifests

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));

const SCHEMA_URI = "https://agent-plugins.org/schemas/1.0.0/plugin.schema.json";
const NAME_PATTERN = /^(?!.*(?:--|\.\.))[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/;
const FIELDS = ["$schema", "name", "version", "description", "author", "homepage", "repository", "license", "keywords", "extensions"];
const AUTHOR_FIELDS = ["name", "email", "url"];

const errors = [];
const fail = (msg) => errors.push(msg);

// --- Agent Plugins 1.0 manifest ---------------------------------------------
const plugin = read("plugins/review-loop/plugin.json");

if (plugin.$schema !== SCHEMA_URI) fail(`plugin.json: $schema must be exactly ${SCHEMA_URI}`);
if (typeof plugin.name !== "string" || !NAME_PATTERN.test(plugin.name) || plugin.name.length > 64) {
  fail(`plugin.json: name "${plugin.name}" fails the spec pattern or the 1-64 char limit`);
}
for (const key of Object.keys(plugin)) {
  if (!FIELDS.includes(key)) fail(`plugin.json: "${key}" is not a spec field (schema is additionalProperties:false)`);
}
for (const key of ["version", "description", "homepage", "repository", "license"]) {
  if (key in plugin && typeof plugin[key] !== "string") fail(`plugin.json: "${key}" must be a string`);
}
if ("keywords" in plugin && !Array.isArray(plugin.keywords)) fail("plugin.json: keywords must be an array");
if ("author" in plugin) {
  for (const key of Object.keys(plugin.author)) {
    if (!AUTHOR_FIELDS.includes(key)) fail(`plugin.json: author.${key} is not allowed (spec permits name, email, url)`);
  }
}

// --- Cross-manifest sync -----------------------------------------------------
// Four files carry this plugin's identity. package.json's description
// intentionally differs (it names the OpenCode entry point), so only its name
// and version are compared.
const claude = read("plugins/review-loop/.claude-plugin/plugin.json");
const pkg = read("package.json");
const entry = read(".claude-plugin/marketplace.json").plugins.find((p) => p.name === plugin.name);

const same = (label, a, b, aPath, bPath) => {
  if (a !== b) fail(`${label} differs: ${aPath} has "${a}", ${bPath} has "${b}"`);
};

same("name", plugin.name, claude.name, "plugin.json", ".claude-plugin/plugin.json");
same("name", plugin.name, pkg.name, "plugin.json", "package.json");
same("version", plugin.version, claude.version, "plugin.json", ".claude-plugin/plugin.json");
same("version", plugin.version, pkg.version, "plugin.json", "package.json");
same("description", plugin.description, claude.description, "plugin.json", ".claude-plugin/plugin.json");

if (!entry) fail(`.claude-plugin/marketplace.json: no plugins[] entry named "${plugin.name}"`);
else same("description", plugin.description, entry.description, "plugin.json", "marketplace.json");

// --- Report ------------------------------------------------------------------
if (errors.length) {
  for (const e of errors) console.error("✗", e);
  process.exit(1);
}
console.log("manifests OK");
