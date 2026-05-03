---
name: vellum
description: >
  Local design-iteration skill — a self-hosted alternative to SuperDesign. Generates static HTML/CSS mockups using YOUR codebase's design tokens, Tailwind config, and shadcn/ui class vocabulary. No paid service, no account, no remote API. Files live in `.claude/designs/` in the repo. Verbs: init, create, draft, iterate (replace|branch), open, list. Invoke with `/vellum <verb> <args>` or call directly when the user asks to mock up, sketch, prototype, or iterate on UI.
---

# Vellum

Vellum mirrors the SuperDesign workflow but generates locally. It produces self-contained HTML files that load Tailwind via CDN, inject your project's CSS variable tokens, and use shadcn/ui class vocabulary extracted from your real components — so generated mocks visually match your real app at ~95% fidelity.

## Storage layout

```
<repo>/.claude/designs/
  _context/
    context.md         # design tokens + shadcn class vocabulary (written by init)
    tokens.css         # :root and .dark CSS variable blocks (written by init)
    tailwind-config.js # extracted Tailwind theme.extend block (written by init)
  <project-slug>/
    manifest.json      # { id, title, drafts: [{ id, title, parent, prompt, createdAt }] }
    drafts/
      <draft-id>.html  # one self-contained file per draft
```

Skill assets:
- `~/.claude/skills/vellum/SKILL.md` — this file
- `~/.claude/skills/vellum/HTML_TEMPLATE.html` — boilerplate scaffold for new drafts
- `~/.claude/skills/vellum/INIT.md` — detailed init procedure

## Verb dispatch

When the user types `/vellum <verb> ...`, run the matching section below.

If no verb is given, list available verbs and short usage.

### Verb: `init`

**Run once per repo. Idempotent — re-run if tokens or shadcn components change.**

1. Confirm the working directory is a frontend repo: check for `tailwind.config.ts` OR `tailwind.config.js`, AND `components.json` (shadcn registry). If neither exists, abort with a message asking the user to run vellum from a frontend project root.

2. Read these files:
   - `app/globals.css` (or `src/globals.css` / `styles/globals.css` — find via search)
   - `tailwind.config.ts` (or `.js`)
   - `components.json`
   - A sampling of `app/components/ui/*.tsx` — read these specific files if present (in priority order; skip any that don't exist):
     - `button.tsx`
     - `input.tsx`
     - `switch.tsx`
     - `tabs.tsx`
     - `card.tsx`
     - `badge.tsx` or `badge.jsx`
     - `dialog.tsx`
     - `select.tsx`
     - `textarea.tsx`
     - `label.tsx`

3. Extract from `globals.css`:
   - The `:root { ... }` block (light tokens)
   - The `.dark { ... }` block (dark tokens)
   - Any custom `@keyframes` and utility classes that extend Tailwind (animations like `pulse-blue`, `bg-dotted`, etc.)

4. Extract from `tailwind.config.ts`:
   - `theme.extend.colors` mapping
   - `theme.extend.fontFamily`
   - `theme.extend.borderRadius`
   - Any other extend keys
   - The `darkMode` setting

5. Extract from each shadcn component you read:
   - The default variant's full className string (or the cva config if it uses cva)
   - Each variant's className overrides
   - Note any data-state styles (e.g. Switch's `data-[state=checked]:bg-primary`)

6. Write `<repo>/.claude/designs/_context/tokens.css`:
   ```css
   /* Auto-extracted from app/globals.css. Re-run /vellum init to refresh. */
   @layer base {
     :root { /* ...all light vars... */ }
     .dark { /* ...all dark vars... */ }
   }
   /* Plus any custom @keyframes / utility classes */
   ```

7. Write `<repo>/.claude/designs/_context/tailwind-config.js`:
   ```js
   // Auto-extracted Tailwind theme. Used inline by HTML drafts via cdn.tailwindcss.com.
   tailwind.config = { darkMode: 'class', theme: { extend: { /* ...colors, fontFamily, borderRadius... */ } } }
   ```

8. Write `<repo>/.claude/designs/_context/context.md`:
   - Header: project name (from package.json), shadcn baseColor (from components.json), darkMode setting
   - Section: **Design tokens** — list every CSS variable with its dark and light value, organized by purpose (background, foreground, primary, etc.)
   - Section: **Tailwind theme** — colors mapping, font families, border radius
   - Section: **Component vocabulary** — for each shadcn component read, write a 2-4 line entry with its canonical className. Example:
     ```
     ### Button
     Base: inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors disabled:opacity-50
     Default variant: bg-primary text-primary-foreground hover:bg-primary/90
     Outline variant: border border-input bg-background hover:bg-accent
     Ghost variant: hover:bg-accent hover:text-accent-foreground
     Sizes: h-10 px-4 py-2 (default), h-9 px-3 (sm), h-11 px-8 (lg), h-10 w-10 (icon)
     ```
   - Section: **Conventions** — note `cn()` from `@/lib/utils`, dark mode is class-based on `<html>` or `<body>`, font is Geist by default (or whatever the project uses), default body classes `bg-background text-foreground`.

9. Print a summary to the user: number of components read, number of CSS variables extracted, path to context.md.

If `INIT.md` exists in the skill directory, follow its more detailed procedure instead.

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
3. Read `<repo>/.claude/designs/_context/context.md` and `tokens.css`.
4. Read `~/.claude/skills/vellum/HTML_TEMPLATE.html`.
5. Read any `--context-file` paths.
6. Generate the draft HTML by:
   - Starting from `HTML_TEMPLATE.html`
   - Filling the `<title>` with `<title>`
   - Inlining the contents of `_context/tokens.css` into the `<style data-vellum="tokens">` block
   - Inlining the contents of `_context/tailwind-config.js` into the `<script data-vellum="config">` block
   - Generating the body content from the user's prompt, using ONLY class patterns from `context.md`. Do NOT invent new component vocabularies.
7. Write to `<repo>/.claude/designs/<project-slug>/drafts/<draft-id>.html`.
8. Append to manifest:
   ```json
   { "id": "<draft-id>", "title": "<title>", "parent": null, "prompt": "<prompt>", "createdAt": "<ISO>" }
   ```
9. Print: draft ID, file path, and the `open` command they can run next.

### Verb: `iterate <draft-id> --mode <replace|branch> -p "prompt" [-p "prompt2" ...]`

Required args: `<draft-id>`, `--mode` (replace or branch), one or more `-p` prompts.

#### Mode: `replace`
- Single `-p` prompt expected.
- Read existing draft HTML.
- Read `_context/context.md`.
- Apply the prompt as a refinement (e.g., "swap rows 2 and 3", "increase row gap to 1.5rem", "convert this section to a tab group").
- Overwrite the same file at the same path.
- Update the manifest entry's `prompt` field by appending the new prompt as a new array element under `iterations` (don't lose history).
- Keep the same `<draft-id>`.

#### Mode: `branch`
- One or more `-p` prompts. Each prompt produces ONE new sibling draft.
- For each prompt:
  - Generate a new draft ID: `<draft-id>-b<n>-<6-char-hash>` where `n` is the branch number.
  - Copy the existing draft as a starting point.
  - Apply the prompt as a transformation.
  - Write to a new file.
  - Add a manifest entry with `parent: <draft-id>` and the prompt.
- Print all new draft IDs and their open commands.

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

1. **Read `_context/context.md` first.** It contains the project's design vocabulary. Use those exact class strings for shadcn primitives. Do not invent new patterns.

2. **Self-contained file.** Every draft is a single `.html` file with NO external dependencies except:
   - `https://cdn.tailwindcss.com` — Tailwind JIT
   - Google Fonts CDN for Geist (or whatever the project uses)
   - Inline `<style>` blocks for tokens and animations
   - Inline `<script>` block for `tailwind.config = {...}`

3. **Dark mode is class-based.** Put `class="dark"` on `<html>` (or `<body>`) by default — the project uses dark as primary.

4. **Body defaults.** `<body class="dark bg-background text-foreground font-geist">` (or font-sans if no Geist).

5. **Use rem and Tailwind utilities, not px.** No `style="width: 280px"`. Use `max-w-xs`, `w-20`, `h-9`, `grid-cols-12`, `gap-4`, `space-y-6`, etc.

6. **No JavaScript framework.** Plain HTML. Static content. Interactive states (hover, focus, data-state=checked) can be shown by hardcoding the active state's classes if needed for the mock.

7. **Use Lucide icons via CDN** if needed: `<i data-lucide="plus"></i>` with the lucide auto-init script, OR inline SVG copies. Prefer inline SVG for self-containment.

8. **Match the user's project conventions.** If components.json says `style: "default"` and `baseColor: "neutral"`, the visual baseline is shadcn neutral. Don't drift toward zinc or slate.

9. **Always update the manifest** when writing a new draft or modifying an existing one.

10. **Never read from `.claude/designs/_context/` and then write generated content that contradicts it.** If the project's `--primary` is HSL `0 0% 98%` (near-white in dark mode), don't generate a draft assuming `--primary` is blue.

## Common errors

- **"context.md not found"** — run `/vellum init` first, or the user is in the wrong directory.
- **"manifest.json not found for project"** — run `/vellum create <name>` first.
- **HTML draft has broken Tailwind classes** — re-read `context.md`. Do not invent classes.
- **User says "the colors are wrong"** — re-run `/vellum init` to re-extract tokens; the project's globals.css may have changed since last init.

## Phase 2 — out of scope for MVP

These verbs are NOT implemented in the MVP. If a user asks for them, explain they're future work:
- `promote <draft-id>` — convert HTML draft to a real React component file using shadcn imports
- `serve` — start a local HTTP server to preview drafts in a gallery
- `flow <draft-id> --pages "..."` — multi-page flows (SuperDesign's `execute-flow-pages`)
- Storybook export

## Why "vellum"?

Vellum is the translucent drafting paper architects use to sketch over a base drawing without committing. This skill drafts over your real codebase — using its tokens, its components, its conventions — so the sketch is always anchored to reality.
