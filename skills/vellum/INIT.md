# Vellum Init — Detailed Procedure

This is the one-time-per-repo bootstrap that captures the project's design
vocabulary into `.claude/designs/_context/`. Re-run any time tokens or
components change, or if the project's frontend stack changes.

## What it produces (same shape for every stack)

```
<repo>/.claude/designs/_context/
  context.md           # human-readable design vocabulary (Claude reads on every iteration)
                        # — starts with a "Stack:" line naming the detected profile
  tokens.css            # design tokens in whatever form the stack actually uses
                        # (Tailwind/shadcn: :root + .dark CSS vars. Quasar: SCSS var
                        # notes or "stock palette". Generic: whatever :root{} was found.)
  head.html             # the <head> boilerplate (CDN CSS/JS, fonts, icons) AND a
                        # paired body-end script block, both stack-specific — spliced
                        # into HTML_TEMPLATE.html's {{HEAD_EXTRA}} / {{BODY_SCRIPT_EXTRA}}
                        # markers by draft/iterate. This is what makes generated
                        # drafts look like a Tailwind app, a Quasar app, etc.
  tailwind-config.js    # ONLY written for the tailwind-shadcn profile — other
                        # profiles skip this file entirely (not "empty", absent)
  components/           # one .md per real component sampled, profile-appropriate
```

`draft` and `iterate` never need to know which profile produced these files —
they just read `context.md` for vocabulary and splice `head.html` into the
template. All stack-specific logic lives here, in `init`.

## Step 1 — Detect the stack profile

Check signals in this order and stop at the first match. Read `package.json`
once up front (dependencies + devDependencies) since multiple profiles check it.

1. **`quasar-vue`** — `quasar.config.js` or `quasar.conf.js` exists at repo
   root, OR `quasar` appears in package.json dependencies.
2. **`tailwind-shadcn`** — `tailwind.config.ts` or `tailwind.config.js`
   exists AND `components.json` (shadcn registry) exists.
3. **`tailwind-only`** — a `tailwind.config.*` exists but no
   `components.json`. Same as `tailwind-shadcn` minus the component
   vocabulary step (skip Step 6-equivalent, note "no component library
   detected" in context.md).
4. **`generic`** — none of the above matched. **This is not an error** —
   proceed with the generic fallback profile (Step 5 below). Never abort
   `init` just because the stack isn't one of the named profiles; that
   defeats the point of a design tool that's supposed to work on whatever
   repo the user is actually in.

Print which profile was detected and why (which file/dependency triggered
the match) before proceeding — this is the one thing worth surfacing to the
user even on a clean run, since a wrong detection produces a mockup that
doesn't resemble the real app.

If you genuinely can't tell (e.g. a repo with both `tailwind.config.js` and
`quasar.config.js` — unusual but possible in a migration), ask the user
which one is the actual UI layer rather than guessing.

## Profile: `tailwind-shadcn`

Required: `tailwind.config.ts`/`.js` AND `components.json`.

### Find globals.css

Search candidate paths in order:
1. `app/globals.css`
2. `src/app/globals.css`
3. `src/globals.css`
4. `styles/globals.css`
5. `src/styles/globals.css`

If none exist, fall back to whatever `components.json` → `tailwind.css` points to.

### Read

- The globals.css found above
- `tailwind.config.ts` or `.js`
- `components.json`
- `package.json` (`name` field)
- Shadcn primitives if present (skip silently if missing; adjust path root,
  e.g. `src/components/ui/`, to match the project):
  ```
  button.tsx  input.tsx  textarea.tsx  label.tsx  switch.tsx  checkbox.tsx
  tabs.tsx  card.tsx  badge.tsx (or .jsx)  dialog.tsx  select.tsx
  separator.tsx  dropdown-menu.tsx
  ```

### Extract from globals.css → `tokens.css`

Copy verbatim: everything inside `:root { ... }`, everything inside
`.dark { ... }`, any top-level `@keyframes` blocks, any top-level utility
classes (`.bg-dotted`, `.animate-pulse-blue`, etc.). Wrap in
`@layer base { ... }` matching the original structure.

### Extract from tailwind.config → `tailwind-config.js`

Pull `darkMode` and everything under `theme.extend` (fontFamily, colors,
borderRadius, keyframes, animation). Write:

```js
// Auto-extracted from tailwind.config.{ts|js}. Inlined into HTML drafts.
tailwind.config = {
  darkMode: 'class',
  theme: { extend: { /* fontFamily, colors (semantic hsl(var(--x)) mappings), borderRadius */ } }
};
```

Replace any CSS-variable font fallback (`var(--font-geist-sans)`) with the
literal Google Fonts family name (`'Geist'`) so the CDN-loaded font resolves
in standalone HTML.

### Extract component vocabulary → `components/<name>.md`

For each shadcn file read, find the base className (usually the first arg to
`cva()`), every `variants.variant` and `variants.size` override, and any
`data-state` styles (Switch/Tabs/Accordion/Dialog). Write one file per
component:

```markdown
# Switch
**Source:** `app/components/ui/switch.tsx`
**Base:** `peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full ...`
**State variants:** `data-[state=checked]:bg-primary` (on) / `data-[state=unchecked]:bg-input` (off)
**Static HTML mock (off):**
```html
<button role="switch" aria-checked="false" data-state="unchecked" class="peer inline-flex h-6 w-11 ... bg-input">
  <span class="block h-5 w-5 rounded-full bg-background shadow-lg translate-x-0"></span>
</button>
```
```

### Write `head.html`

```html
<!-- Geist. Swap the family name below if the project uses a different font. -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet" />
<script src="https://cdn.tailwindcss.com?plugins=forms,typography"></script>
<script src="https://unpkg.com/lucide@latest"></script>
<script data-vellum="config">
  {{contents of tailwind-config.js}}
</script>
<style data-vellum="tokens">
  {{contents of tokens.css}}
</style>
<style>
  body { font-family: "Geist", ui-sans-serif, system-ui, -apple-system, sans-serif; font-feature-settings: "ss01", "cv11"; }
  .font-geist-mono, .font-mono, code, kbd { font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace; }
</style>
<!-- ===VELLUM-BODY-SCRIPT-SPLIT=== -->
<script>
  window.addEventListener("DOMContentLoaded", () => { if (window.lucide) window.lucide.createIcons(); });
</script>
```

(The `===VELLUM-BODY-SCRIPT-SPLIT===` marker tells `draft`/`iterate` where to
cut this file: everything above goes in `{{HEAD_EXTRA}}`, everything below
goes in `{{BODY_SCRIPT_EXTRA}}`.)

**HTML_ATTRS:** `class="dark"` — dark mode is primary for this profile.
**BODY_CLASS:** `dark bg-background text-foreground font-geist antialiased`

### Conventions to record in context.md

1. Dark theme is primary — always `class="dark"` on `<html>`.
2. Use semantic classes from `theme.extend.colors` (`bg-background`,
   `text-foreground`, `bg-primary text-primary-foreground`) — never raw
   `bg-neutral-950`.
3. Border radius via tokens (`rounded-lg`/`md`/`sm`), never `rounded-[0.5rem]`.
4. Spacing via Tailwind utilities (`p-4`, `gap-6`, `space-y-8`), never
   `style="padding: 16px"`.
5. Icons via Lucide (`<i data-lucide="plus"></i>`) — the template auto-inits
   on `DOMContentLoaded`.

---

## Profile: `quasar-vue`

Detected via `quasar.config.js`/`quasar.conf.js` or a `quasar` dependency.

### Find design tokens

Search for a custom variables file (project-specific name, but usually):
1. `quasar.variables.scss` (or `*.variables.scss`) anywhere outside
   `node_modules`
2. `src/css/quasar.variables.scss`

If found, read it and extract every `$primary`, `$secondary`, `$accent`,
`$dark`, `$positive`, `$negative`, `$warning`, `$info` (etc.) override.

If **not** found, do not treat this as missing data — Quasar ships real
default values. Record them as the effective palette instead of leaving a
gap: `$primary: #1976D2`, `$secondary: #26A69A`, `$accent: #9C27B0`,
`$dark: #1D1D1D`, `$positive: #21BA45`, `$negative: #C10015`,
`$warning: #F2C037`, `$info: #31CCEC`. Note explicitly in context.md that
these are Quasar's stock defaults, not a project-specific override — that
distinction matters if the user later adds a real theme file.

### Find component vocabulary

Sample a handful of real `.vue` single-file components that use Quasar tags
(grep for `<q-` across `src/`/`web/` — prioritize files with the most
distinct `<q-*>` tags, up to ~6 files, skip `node_modules`). For each, record
the actual class strings applied to Quasar components in that file — e.g.
`<q-card class="q-pa-md items-center full-width">`,
`<q-tabs dense align="justify" active-color="primary" indicator-color="primary" narrow-indicator>`.
This is the equivalent of shadcn's cva base/variant classes: Quasar
components are configured via props + utility classes (the `q-pa-*`,
`text-*`, `bg-*`, `row`/`column` spacing/flex helpers) rather than a single
className string, so capture prop+class combinations together, not classes
alone.

Also note the Quasar version pinned in `package.json` (`quasar: ^X.Y.Z`) —
the CDN URL needs an exact version, and dev-mode Quasar has real version
floors for some plugin features (see quasar-vite-spike learnings in the
personal worklog if present — quasar < 2.16 has known dev-mode gaps with
`@quasar/vite-plugin`, irrelevant to this static-mock use case but worth a
one-line note in case the user asks why a version matters).

### Write `tokens.css`

Not literal CSS custom properties (Quasar doesn't use them the way
Tailwind/shadcn does) — write the extracted or stock SCSS variable values as
a labeled list instead, for `context.md` to embed directly:

```
$primary:   #1976D2   (stock default | project override — state which)
$secondary: #26A69A
$accent:    #9C27B0
$dark:      #1D1D1D
$positive:  #21BA45
$negative:  #C10015
$warning:   #F2C037
$info:      #31CCEC
```

### Write `head.html`

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/quasar@{{VERSION}}/dist/quasar.prod.css">
<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500,700,900|Material+Icons">
<style>
  body { font-family: Roboto, -apple-system, sans-serif; }
</style>
<!-- ===VELLUM-BODY-SCRIPT-SPLIT=== -->
<!-- No body-end script needed — drafts use inline SVG for icons/QR-style
     placeholders rather than a runtime icon library, and no Quasar JS
     runtime is loaded (static mock only, per the no-framework-JS rule). -->
```

Replace `{{VERSION}}` with the exact version from package.json (e.g. `2.15.4`).

**HTML_ATTRS:** none needed (Quasar's Material look doesn't default to a
global dark-mode class the way this profile's drafts should assume).
**BODY_CLASS:** empty, or a project-specific default background color if one
was found in the sampled components.

### Conventions to record in context.md

1. Components are configured via **props + utility classes together**, not
   a single className string — always show both when documenting a pattern.
2. `:no-caps="true"` is common app-wide on `<q-tab>`/`<q-btn>` in DB's Quasar
   apps — check the sampled files and note whether this project follows
   that convention before assuming it.
3. Spacing utilities follow Quasar's own scale: `q-pa-*`/`q-ma-*` (padding/
   margin, `xs`/`sm`/`md`/`lg`/`xl` or a number), not Tailwind's `p-*`/`m-*`.
4. No JS framework in drafts — represent interactive states (active tab,
   open dialog) by hardcoding the "on" state's classes, same rule as every
   other profile.

---

## Profile: `generic` (fallback — no named profile matched)

This is not a degraded mode to apologize for — it's the profile that keeps
vellum usable on any repo, including stacks nobody's written a named profile
for yet (Bootstrap, Vuetify, Material UI, Svelte, plain CSS, etc.). Extract
what's real; never invent a design system that isn't there.

### Find design tokens

Search common global-stylesheet locations generically (not framework-
specific paths): any `.css`/`.scss` file matching `*global*`, `*root*`,
`*variables*`, or `*theme*` under `src/`, `styles/`, `assets/`, or repo root
(excluding `node_modules`). If one or more matches contain a `:root { ... }`
block, extract those CSS custom properties verbatim — this works regardless
of framework, since CSS variables aren't Tailwind-specific.

If nothing matches: don't fabricate a palette. Write "no CSS variable system
found" in context.md and fall back to extracting a handful of literal
colors actually used in the most-imported stylesheet, if one exists, or
note "no design tokens found — drafts will use a neutral system-default
palette" if truly nothing is there.

### Find component vocabulary

Identify the project's UI framework from `package.json` (react/vue/svelte/
angular/none) and sample the 4-6 largest or most-imported component files
matching that framework's extension (`.tsx`/`.jsx`, `.vue`, `.svelte`).
Extract whatever class patterns repeat across them — if the project uses
Bootstrap, this surfaces Bootstrap's own class vocabulary (`btn btn-primary`,
`card`, `form-control`) naturally, since those classes will show up in the
sampled markup. Don't assume a specific library; report what's actually
there.

If nothing coherent emerges (e.g. every component's markup is bespoke,
no shared vocabulary), say so explicitly rather than inventing a fake
"design system" — draft/iterate should fall back to clean, unopinionated
semantic HTML + a minimal CSS reset in that case.

### Write `head.html`

```html
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
</style>
<!-- No framework CDN — none was detected. If the project's real stylesheet
     was found above, its actual color values are inlined into tokens.css
     and should be used directly in drafts rather than guessed Tailwind-
     style utility classes that don't exist in this project. -->
<!-- ===VELLUM-BODY-SCRIPT-SPLIT=== -->
```

**HTML_ATTRS:** none.
**BODY_CLASS:** empty.

### Conventions to record in context.md

State plainly which of the three states applied: (a) a real global
stylesheet + component vocabulary was found and is being used, (b) partial
— tokens found but no coherent component vocabulary (or vice versa), or (c)
neither — drafts will be plain semantic HTML/CSS. Whichever it is, say it
explicitly so a later `draft`/`iterate` call doesn't silently invent
patterns that aren't grounded in the real app.

---

## Common final step — write `context.md`

Regardless of profile, aggregate into `_context/context.md`:

```markdown
# <Project Name> — Vellum Design Context

Auto-generated by `/vellum init` on <ISO date>. Re-run to refresh, or if the
project's frontend stack changes.

**Stack:** <tailwind-shadcn | tailwind-only | quasar-vue | generic>
**Detected via:** <the file/dependency that triggered this profile>

## Design tokens
<profile-appropriate rendering of tokens.css's contents — a table for
CSS-variable-based profiles, a labeled list for Quasar's SCSS values, or an
explicit "none found" note for generic-with-nothing>

## Component vocabulary
<profile-appropriate: shadcn per-component links, or Quasar prop+class
patterns, or generic-framework class patterns, or "no coherent vocabulary
found — use plain semantic HTML">

## Conventions to honor in drafts
<the profile-specific conventions list above>

## Anti-patterns (project-agnostic, apply regardless of stack)
- ❌ `<input type="number">` for currency/quantity — use `type="text"` + `inputMode="numeric"`
- ❌ Loading spinners — prefer a skeleton pattern
- ❌ `window.confirm()` — use the project's real dialog/modal component
- ❌ Hard-coded hex colors when a token/variable exists for the same value
```

## Print summary

```
✓ Vellum init complete

Stack detected: <profile> (via <signal>)
Project: <name>
Tokens: <N found | stock defaults used | none found>
Components sampled: <N>
Output: .claude/designs/_context/

Next: /vellum create <project-name>
```
