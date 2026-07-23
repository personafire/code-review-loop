/**
 * Review Loop plugin for OpenCode.ai
 *
 * OpenCode discovers skills from a fixed set of directories plus any paths in
 * `config.skills.paths`. This repo's skill lives at
 * `plugins/review-loop/skills/review-loop/SKILL.md` (a Claude-plugin layout),
 * which is not one of OpenCode's default scan locations. The config hook below
 * injects the containing `skills` directory into `config.skills.paths` at
 * startup so OpenCode's native `skill` tool finds and can load `review-loop`
 * without the user symlinking or copying anything.
 *
 * The review logic itself is NOT duplicated here — it lives entirely in the
 * shared SKILL.md and its references/.
 */

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// From <repo>/.opencode/plugin.js up to <repo>, then into the skills root that
// holds `review-loop/SKILL.md`. OpenCode discovers `<path>/<name>/SKILL.md`.
const skillsDir = path.resolve(__dirname, "../plugins/review-loop/skills");

export const ReviewLoopPlugin = async ({ directory, project, client, $, worktree }) => {
  return {
    config: async (config) => {
      config.skills = config.skills || {};
      config.skills.paths = config.skills.paths || [];
      if (!config.skills.paths.includes(skillsDir)) {
        config.skills.paths.push(skillsDir);
      }
    },
  };
};
