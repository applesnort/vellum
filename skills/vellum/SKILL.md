---
name: vellum
description: >
  Local design-iteration skill — a self-hosted alternative to SuperDesign. Generates static HTML/CSS mockups using YOUR codebase's real design tokens and component vocabulary, whatever frontend stack it's built on (Tailwind+shadcn, Quasar+Vue, or a generic fallback for anything else). No paid service, no account, no remote API. Files live in `.claude/designs/` in the repo. Verbs: init, create, draft, iterate (replace|branch), critique, open, list. Invoke with `/vellum <verb> <args>` or call directly when the user asks to mock up, sketch, prototype, iterate on, or critique UI.
---

# Vellum

Vellum mirrors the SuperDesign workflow but generates locally. It produces self-contained HTML files that load the project's real CSS framework/tokens and use real component class vocabulary extracted from the actual codebase — so generated mocks visually match the real app, not a generic Tailwind/shadcn default that happens to be wrong for this project.

Vellum is stack-aware, not stack-specific. `init` detects which of a small set of **profiles** the repo actually uses (Tailwind+shadcn, Quasar+Vue, or a generic fallback for anything else) and extracts tokens/vocabulary the way that stack actually expresses them. Everything downstream (`draft`, `iterate`) is profile-agnostic — it just reads whatever `init` wrote.

## Storage layout

```
<repo>/.claude/designs/
  _context/
    context.md          # design tokens + component vocabulary + detected stack (written by init)
    tokens.css           # design tokens in whatever form the stack uses (written by init)
    head.html             # stack-specific <head>/body-script boilerplate (written by init)
    tailwind-config.js   # ONLY present for the tailwind-shadcn/tailwind-only profiles
    components/          # one .md per real component sampled (profile-appropriate)
  <project-slug>/
    manifest.json      # { id, title, drafts: [{ id, title, parent, prompt, createdAt, ... }] }
    brief.md           # six-line design brief (written by the first critique)
    drafts/
      <draft-id>.html  # one self-contained file per draft
    critiques/
      <draft-id>.md    # one critique per draft (written by critique)
    shots/
      <draft-id>-<width>.png  # screenshots (written by lint --shots)
```

Skill assets:
- `~/.claude/skills/vellum/SKILL.md` — this file (verb dispatch)
- `~/.claude/skills/vellum/HTML_TEMPLATE.html` — stack-neutral boilerplate scaffold for new drafts
- `~/.claude/skills/vellum/INIT.md` — detailed init procedure, including all stack profiles
- `~/.claude/skills/vellum/lint.mjs` — layout check run after every `draft` and `iterate` (see Layout lint)
- `~/.claude/skills/vellum/CRITIQUE.md` — principles, evidence tiers and finding format for `critique`

## Verb dispatch

When the user types `/vellum <verb> ...`, run the matching section below.

If no verb is given, list available verbs and short usage.

### Verb: `init`

**Run once per repo. Idempotent — re-run if tokens/components change, or if the project's frontend stack changes.**

Follow `INIT.md`'s full procedure. Summary:

1. Detect the stack profile (`quasar-vue`, `tailwind-shadcn`, `tailwind-only`, or `generic` — see INIT.md Step 1). **Never abort just because the stack doesn't match a named profile** — the `generic` fallback exists precisely so vellum works on any repo. Only abort if the working directory isn't a frontend project at all (no `package.json`, no component files of any kind).
2. Run that profile's extraction procedure (INIT.md has one section per profile) to produce `tokens.css`, `head.html`, `tailwind-config.js` (tailwind profiles only), and `components/*.md`.
3. Write `context.md` aggregating all of it, with a `**Stack:**` header line naming the detected profile — every later `draft`/`iterate` call reads this first.
4. Print a summary: detected profile + what triggered it, tokens found (or "stock defaults used" / "none found"), components sampled, output path.

### Verb: `create <project-name>`

Args: project name (free-form string).

1. Slugify name → `<slug>` (lowercase, kebab-case, alphanumeric + dashes only).
2. Generate a short project ID: timestamp-based or `<slug>-<random4>`.
3. Create `<repo>/.claude/designs/<slug>/drafts/`.
4. Write `<repo>/.claude/designs/<slug>/manifest.json`:
   ```json
   { "id": "<slug>", "title": "<original name>", "createdAt": "<ISO>", "drafts": [] }
   ```
5. If `<repo>/.claude/designs/_context/context.md` does NOT exist, automatically run `init` first before creating the project.
6. Print the project slug and full path.

### Verb: `draft <project-slug> --title "..." -p "prompt"`

Required args: `<project-slug>`, `--title`, `-p` (prompt — describes what to design).

Optional args:
- `--context-file <path>` — additional file to read for visual reference (e.g., a screenshot of an existing component; can repeat).

1. Verify project exists: `<repo>/.claude/designs/<project-slug>/manifest.json`.
2. Generate draft ID: `<short-slug>-<6-char-hash>` from the title.
3. Read `<repo>/.claude/designs/_context/context.md` — note the `**Stack:**` line.
4. Read `~/.claude/skills/vellum/HTML_TEMPLATE.html`.
5. Read `<repo>/.claude/designs/_context/head.html` and split it at the `===VELLUM-BODY-SCRIPT-SPLIT===` marker: everything above → `{{HEAD_EXTRA}}`, everything below → `{{BODY_SCRIPT_EXTRA}}`.
6. Read any `--context-file` paths.
7. Generate the draft HTML by:
   - Starting from `HTML_TEMPLATE.html`
   - Filling `{{TITLE}}`, `{{HTML_ATTRS}}`, `{{BODY_CLASS}}` per the profile's documented values (see INIT.md's per-profile "HTML_ATTRS"/"BODY_CLASS" lines)
   - Splicing in `{{HEAD_EXTRA}}` / `{{BODY_SCRIPT_EXTRA}}` from `head.html`
   - Generating the body content from the user's prompt, using ONLY class/prop patterns from `context.md`'s component vocabulary section. Do NOT invent new component vocabularies, and do NOT default to Tailwind/shadcn conventions if `context.md` says the stack is something else.
8. Write to `<repo>/.claude/designs/<project-slug>/drafts/<draft-id>.html`.
9. Run the layout lint (see Layout lint) and fix every FAIL before you continue.
10. Append to manifest:
   ```json
   { "id": "<draft-id>", "title": "<title>", "parent": null, "prompt": "<prompt>", "scenario": "<data condition>", "createdAt": "<ISO>" }
   ```
   `scenario` names the data the draft shows, in a few words: `typical`, `max density`, `missing fields`, `long text`, `large collection`, or a mix (`typical + 2 long resolutions`). If `brief.md` exists, use its data conditions. Fill the draft with realistic data for that condition — real values from the project's schema or fixtures when they exist — never a tidy three-row sample.
11. Print: draft ID, file path, the lint result, and the `open` command they can run next.

### Verb: `iterate <draft-id> --mode <replace|branch> -p "prompt" [-p "prompt2" ...]`

Required args: `<draft-id>`, `--mode` (replace or branch), one or more `-p` prompts.

#### Mode: `replace`
- Single `-p` prompt expected.
- Read existing draft HTML.
- Read `_context/context.md` (for the stack/vocabulary, not to re-splice head.html — the existing draft's head is presumably still correct unless the prompt specifically asks to change stacks, which shouldn't happen mid-project).
- Apply the prompt as a refinement (e.g., "swap rows 2 and 3", "increase row gap", "convert this section to a tab group", "remove duplicated labels", "add more spacing").
- Overwrite the same file at the same path.
- Update the manifest entry's `prompt` field by appending the new prompt as a new array element under `iterations` (don't lose history).
- Keep the same `<draft-id>`.
- Run the layout lint on the file and fix every FAIL before you show the draft.

#### Mode: `branch`
- One or more `-p` prompts. Each prompt produces ONE new sibling draft.
- For each prompt:
  - Generate a new draft ID: `<draft-id>-b<n>-<6-char-hash>` where `n` is the branch number.
  - Copy the existing draft as a starting point.
  - Apply the prompt as a transformation.
  - Write to a new file.
  - Add a manifest entry with `parent: <draft-id>`, the prompt, the parent's `scenario` (keep the same data so siblings compare fairly), and three fields:
    ```json
    { "hypothesis": "<the one structural bet this draft makes>", "favors": "<task or context it helps>", "sacrifices": "<what gets worse>" }
    ```
    If `critiques/<parent-id>.md` exists, add `"addresses": [<finding numbers>]`.
- Siblings must differ in structure — layout, grouping, hierarchy, disclosure or interaction — not only in colour, type or spacing. If the user asks for cosmetic-only branches, make them and write `"hypothesis": "visual only"`.
- Run the layout lint on each new file and fix every FAIL before you show the drafts.
- Print all new draft IDs, their lint results, their hypotheses, and their open commands.

### Verb: `critique <draft-id> [--no-blind] [--task "..."]`

Expert inspection of one draft. It produces at most five ranked findings, each tied to a principle and to evidence. It is not user research: every finding is a hypothesis until users confirm it.

1. Find the draft and its project. Read `~/.claude/skills/vellum/CRITIQUE.md` in full.
2. **Brief.** If `<project>/brief.md` does not exist, write it, inferred from the draft, the manifest prompts and `context.md`:
   ```markdown
   - **User:** <role, expertise, how often they use this screen>
   - **Primary task:** <the one task this screen exists for>
   - **Decisions:** <what the user must decide or compare>
   - **Data conditions:** <typical volume + the stress cases to test: missing fields, long text, large collections, exceptional states>
   - **Viewports:** <e.g. 1440 desk, 390 phone>
   - **Known pain points:** <from the prompts, or "none stated">
   ```
   Ask the user only if you cannot infer the primary task. `--task` overrides the primary task for this run only.
3. **Evidence.** Run `node ~/.claude/skills/vellum/lint.mjs <draft> --shots <project>/shots` at the brief's viewports. Look at every screenshot. Lint exit 2 means you have no screenshots: say so, and tag nothing as `observed` from a screenshot.
4. **Blind prediction** (skip with `--no-blind`). Before you show any finding, ask the user: "What are the top 3 problems you see in this draft?" Wait for the answer. Do not hint.
5. **Inspect.** Do a heuristic evaluation and a cognitive walkthrough of the primary task (both in CRITIQUE.md). Check the draft against the brief's data conditions: if it shows only tidy data, that is a finding.
6. **Write `<project>/critiques/<draft-id>.md`:**
   ```markdown
   # Critique: <draft title>
   Draft: drafts/<draft-id>.html · Brief: brief.md · Lint: <PASS | n fail, n warn> · Shots: <files>

   ## 1. [high] <element> — <problem in a few words>
   - **Problem:** <what is wrong, and which task it affects>
   - **Principle:** <name> `<source tier>`
   - **Fix:** <concrete change to this draft>
   - **Evidence:** `<observed | inferred | needs users>` — <lint rule + width, or shot file + element, or what would settle it>

   ## Prediction vs. critique
   - **Both found:** …
   - **Critique only:** … (why it is easy to miss)
   - **You only:** … (valid, but below the top 5 / not a usability issue / a miss by this critique)

   ## Open questions for users
   - <each `needs users` finding as a question a test could answer>
   ```
   Omit "Prediction vs. critique" with `--no-blind`. Five findings at most; fewer is fine.
7. Add `"critique": "critiques/<draft-id>.md"` to the draft's manifest entry.
8. Print the critique path, the finding titles, and the blind comparison. Suggest a `branch` command whose prompts each test a different fix for the top findings.

### Verb: `open <draft-id>`

1. Find the draft file by scanning `<repo>/.claude/designs/*/drafts/<draft-id>.html`.
2. Run `open <path>` (macOS) — opens in the default browser.
3. Print the file path.

For Linux, use `xdg-open`. For Windows (WSL), use `wslview` or `explorer.exe`.

### Verb: `list [project-slug]`

If `<project-slug>` provided: list drafts in that project's manifest as a tree (parent → children).

If no slug: list all projects in `<repo>/.claude/designs/` with their draft counts.

Format the output as a clear tree:
```
my-modal-redesign (3 drafts)
├── baseline-a8c3d1
│   ├── baseline-a8c3d1-b1-fe92ac (branch: "tighter spacing")
│   └── baseline-a8c3d1-b2-77b104 (branch: "two-column layout")
└── alt-direction-ee7720
```

## Generation rules — READ EVERY ITERATION

When generating or iterating draft HTML, you MUST:

1. **Read `_context/context.md` first, and note its `Stack:` line.** It contains the project's real design vocabulary for whatever stack was detected. Use those exact class/prop patterns. Do not invent new patterns, and do not substitute a different stack's conventions (e.g. don't write Tailwind utility classes into a `quasar-vue`-profile draft).

2. **Self-contained file.** Every draft is a single `.html` file with NO external dependencies except whatever `_context/head.html` already specifies for the detected profile (a framework CDN, fonts, icons) plus inline `<style>`/`<script>` blocks. Don't add a new CDN dependency that isn't already in `head.html` — if a draft genuinely needs something new (e.g. a chart library), that's a signal to re-run `init` or ask the user, not to silently bolt it on.

3. **Respect the profile's dark-mode/body-class defaults** as documented in `context.md` (from `INIT.md`'s per-profile HTML_ATTRS/BODY_CLASS) — don't assume dark-mode-primary if the detected stack doesn't use that convention.

4. **Use the profile's real spacing/sizing vocabulary, not px, and not a different framework's units.** Tailwind/shadcn: rem-based utilities (`gap-4`, `h-9`, `max-w-xs`). Quasar: Quasar's own scale (`q-pa-md`, `q-gutter-sm`, `row`/`column` flex helpers). Generic: whatever unit the sampled real components actually use.

5. **No JavaScript framework runtime.** Plain HTML. Static content. Interactive states (hover, focus, active tab, open/checked) are shown by hardcoding the "on" state's classes/attributes directly in the markup — never by loading Vue/React/Quasar's JS runtime into a static mock.

6. **Icons:** use whatever `head.html` already wired up for the profile (Lucide for tailwind-shadcn, inline SVG for quasar-vue and generic) — don't introduce a different icon library mid-project.

7. **Match the user's project conventions exactly**, per `context.md`'s Conventions section (e.g. shadcn `baseColor`/`style`, or Quasar's `:no-caps` convention, or whatever the generic profile found). Don't drift toward a "close enough" default.

8. **Always update the manifest** when writing a new draft or modifying an existing one.

9. **Never contradict `_context/`.** If a token/value is documented there, use it exactly — don't approximate ("looks about blue-600") when the real value is known.

10. **When the user flags real usability problems in a draft — redundant labels, cramped spacing, unclear hierarchy — treat that as a normal `iterate --mode replace` prompt, not a reason to second-guess the stack/tokens.** Content and layout problems are fixed by editing the draft's body; they have nothing to do with which CDN/profile is loaded.

## Layout lint

After every `draft` and `iterate`, run `node ~/.claude/skills/vellum/lint.mjs <file>` from the repo root. It opens the draft in Chromium through the repo's own `playwright` package at 1440px and 390px (`--width 1440,390` to change; `--shots <dir>` also saves a full-page PNG per width), waits for fonts and the Tailwind browser CDN, and measures the rendered DOM. Exit 0 = no FAIL, 1 = one or more FAIL, 2 = the check could not run (no `playwright` in the repo's `node_modules`, no Chromium, or the page did not load). Fix every FAIL before you show the draft. Tell the user about each WARN. An exit 2 is not a pass: say that the lint did not run and why.

Rules (the output prints each rule with its heuristic, the elements, and the measured px):

- `empty-page` (FAIL): the page shows no text, control or media. Usually the body is still inside the template's `<!-- {{BODY}} -->` marker.
- `h-scroll` (FAIL): the page scrolls horizontally.
- `heading-stack` (FAIL): three or more heading-styled elements stack in one column with no content between them.
- `gap-order` (FAIL): the gap between two sections is not larger than the largest gap between fields inside them.
- `box-smash` (FAIL): two separate bordered boxes are less than 8px apart (touching boxes count as one joined group).
- `helper-ratio` (WARN): more than one third of fields show helper text.
- `column-align` (WARN): in a multi-column row, the first bordered box of each column does not start at the same top edge (more than 4px apart).
- `page-error` / `load` (FAIL): the page threw an error or a resource did not load, so the measurement may not match what the user sees.

The lint measures the default state only. Hidden tabs and panels are not checked; switch to them in the markup and run it again if they matter.

## Common errors

- **"context.md not found"** — run `/vellum init` first, or the user is in the wrong directory.
- **"manifest.json not found for project"** — run `/vellum create <name>` first.
- **Draft doesn't visually resemble the real app** — check `context.md`'s `Stack:` line matches the project's actual frontend framework. If `init` detected the wrong profile (rare — e.g. a repo migrating between two frameworks), re-run `init` and correct it, or ask the user which framework is the real UI layer.
- **"the colors are wrong"** — re-run `/vellum init` to re-extract tokens; the project's stylesheet/theme file may have changed since last init. For `quasar-vue`, check whether a custom `*.variables.scss` was added since — stock defaults were likely used if none existed at init time.
- **HTML draft has broken/invented classes** — re-read `context.md`. Do not invent classes, and do not carry over a different profile's class vocabulary from a prior project.

## Phase 2 — out of scope for MVP

These verbs are NOT implemented in the MVP. If a user asks for them, explain they're future work:
- `decide <project>` — compare sibling drafts against the brief and write a decision record (`DECISION.md`: problem, alternatives, choice, tradeoffs accepted, what to validate with users)
- `promote <draft-id>` — convert HTML draft to a real component file (React/Vue) using the project's actual component imports
- `serve` — start a local HTTP server to preview drafts in a gallery
- `flow <draft-id> --pages "..."` — multi-page flows (SuperDesign's `execute-flow-pages`)
- Storybook export
- Named profiles for Bootstrap, Vuetify, Material UI, Svelte, etc. — until then, these get the `generic` fallback, which still samples real tokens/components rather than assuming Tailwind. Add a named profile the same way `quasar-vue` was added, if one of these comes up often enough to be worth it.

## Why "vellum"?

Vellum is the translucent drafting paper architects use to sketch over a base drawing without committing. This skill drafts over your real codebase — using its tokens, its components, its conventions, whatever framework they're written in — so the sketch is always anchored to reality.
