# Comment Standard

The bar: a comment earns its place only when it tells the reader something the
code in front of them and the tooling around it cannot. Everything else is
noise, and noise ages into lies.

## Keep — information the code can't carry

- **Why, not what.** The reason behind a non-obvious choice: "sorted here because
  the downstream matcher assumes ascending ids".
- **A rejected alternative with a live constraint.** "Can't use the batch
  endpoint — it caps at 100 ids and callers pass up to 500."
- **Invariants and preconditions the types don't express.** "Caller must hold the
  session lock." "Ids are unique per tenant, not globally."
- **Units, ranges, encodings.** "Timeout in milliseconds." "Returns basis points."
- **External anchors.** A spec section, RFC, ticket, vendor bug, benchmark. These
  point at context that lives outside the repo and can't be recovered from it.
- **Workarounds** — the upstream defect that forces the shape, and what would let
  it go away: `// Workaround for redis/redis#8271; drop once we're past 7.2.`
- **Traps.** "Do not reorder — the writer flushes on close."
- **Public API contracts.** Docstrings on exported surface: errors raised,
  nullability, ownership, side effects, thread-safety.

## Cut — comments that add nothing

- **Restating the code.** `// increment the counter` over `count += 1`. A
  docstring that only re-spells the signature in prose.
- **History the VCS already holds.** "Changed from map to filter." "Was
  synchronous before." "Renamed in v2." Changelog blocks, author/date headers.
  `git log` and `git blame` carry this; the file should not.
- **Narrating the change or the review.** "Fixed per review feedback." "Added
  null check here." "As discussed above." That is PR conversation, not source.
- **Decision journals.** Paragraphs justifying an ordinary choice nobody would
  question. If a rationale is durable and load-bearing, it belongs in one spec or
  ADR that comments can link to — not restated inline in five places.
- **Commented-out code.** Delete it. Git has it.
- **Section banners** standing in for structure: `// ===== HELPERS =====`.
- **Comments compensating for a bad name.** If the comment exists to explain what
  `handleData2` does, the fix is the rename.
- **Bare markers.** `// TODO fix later`, `// HACK`. Without a ticket and an owner
  it will never be picked up: `// TODO(PER-123): remove after the v2 migration`.
- **Stale comments** — anything the surrounding code no longer does. A wrong
  comment misleads worse than no comment at all.

## Never flag

License and copyright headers, SPDX tags, generated-file markers, lint and type
pragmas that state a reason (`// eslint-disable-next-line no-await-in-loop -- the
API is rate-limited per call`), compiler/serializer directives, doc comments a
documented project convention or doc generator requires, test names and
descriptions, and anything inside vendored or generated files.

## Rules of application

1. **Scope is what this change wrote.** Judge comments on lines this diff added
   or modified. Pre-existing comments are out of scope — with one exception.
2. **Stale-by-adjacency is in scope.** If this change made a nearby comment
   wrong, that comment is now this change's problem. Flag it.
3. **Prefer a rewrite to a delete** when a comment gestures at something real but
   says the wrong part — keep the constraint, drop the narration.
4. **Prefer better code to a comment.** If a rename, an extracted function, or a
   named constant removes the need for the comment, suggest that instead of
   wordsmithing.
5. **Match the file.** Dense docstrings on every method may be this codebase's
   convention, not a defect. Hold new code to the density and idiom around it.
6. **When genuinely unsure, keep the comment** and file nothing. Zero comment
   findings is a normal, good result — do not hunt for a quota.

## Severity guide

- **medium** — the comment is wrong, stale, or misleading, or it's a bare
  TODO/FIXME with no ticket. These actively cost the next reader time.
- **low** — the comment is merely dead weight: restates code, recounts history,
  narrates the review, journals a decision, or draws a banner.
- **Commented-out code** — low, unless it reads as a disabled code path someone
  intended to restore, which is a medium and a question for the author.
