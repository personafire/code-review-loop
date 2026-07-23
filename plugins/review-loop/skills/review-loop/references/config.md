# Tunable Config

These are defaults. A project may override by editing this file in its local
install.

| Key | Default | Meaning |
|-----|---------|---------|
| `max_iterations` | 3 | hard cap on review→fix→re-review rounds |
| `auto_apply_threshold` | 0.8 | minimum confidence to auto-apply a fix |
| `risky_surfaces` | public/exported API, migrations, security findings, deletions | forces the human gate regardless of confidence |
| `base_branch_order` | develop, main, master | order to auto-detect the review base |
