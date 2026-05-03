# Vellum Init — Detailed Procedure

This is the one-time-per-repo bootstrap that captures the project's design vocabulary into `.claude/designs/_context/`. Re-run any time tokens or shadcn components change.

## What it produces

```
<repo>/.claude/designs/_context/
  context.md           # human-readable design vocabulary (Claude reads on every iteration)
  tokens.css           # :root + .dark CSS variable blocks
  tailwind-config.js   # tailwind.config = { ... } block to inline in drafts
  components/          # one .md per shadcn primitive read (button.md, switch.md, …)
```

## Step 1 — Verify project shape

Required:
- `tailwind.config.ts` OR `tailwind.config.js` at repo root or in a known frontend subdirectory
- `components.json` (shadcn registry)

Optional but ideal:
- `app/globals.css`, `src/globals.css`, or `styles/globals.css`
- `app/components/ui/*.tsx` (shadcn primitives)
- `package.json` (for project name)
- `app/layout.tsx` or `pages/_app.tsx` (font wiring)

If `components.json` is missing but Tailwind exists, proceed in degraded mode — extract tokens but skip the component vocabulary section. Print a warning.

If both Tailwind AND `components.json` are missing, abort: this isn't a Tailwind/shadcn project. Print a clear error.

## Step 2 — Find globals.css

Search candidate paths in order:
1. `app/globals.css`
2. `src/app/globals.css`
3. `src/globals.css`
4. `styles/globals.css`
5. `src/styles/globals.css`

If none exist, fall back to whatever `components.json` → `tailwind.css` points to.

## Step 3 — Read and extract

Read these files in parallel:
- The globals.css you found
- `tailwind.config.ts` or `.js`
- `components.json`
- `package.json` (just the `name` field)

Then read these shadcn components if present (skip silently if any don't exist):

```
app/components/ui/button.tsx
app/components/ui/input.tsx
app/components/ui/textarea.tsx
app/components/ui/label.tsx
app/components/ui/switch.tsx
app/components/ui/checkbox.tsx
app/components/ui/tabs.tsx
app/components/ui/card.tsx
app/components/ui/badge.tsx (or badge.jsx — note the legacy)
app/components/ui/dialog.tsx
app/components/ui/select.tsx
app/components/ui/separator.tsx
app/components/ui/dropdown-menu.tsx
```

Adjust path roots to match the project (e.g., `src/components/ui/`).

## Step 4 — Extract from globals.css

Copy verbatim:
- Everything inside `:root { ... }`
- Everything inside `.dark { ... }`
- Any `@keyframes` blocks at the file's top level
- Any utility classes (e.g., `.bg-dotted`, `.animate-pulse-blue`) at the top level

Wrap in `@layer base { ... }` to match the original structure. Write to `_context/tokens.css`.

## Step 5 — Extract from tailwind.config

Read the config file. Pull out:
- `darkMode` (likely `["class"]` or `"class"`)
- Everything under `theme.extend`:
  - `fontFamily`
  - `colors`
  - `borderRadius`
  - `keyframes` (if any aren't already in globals.css)
  - `animation` (if any)

Write a JS snippet to `_context/tailwind-config.js` like:

```js
// Auto-extracted from tailwind.config.{ts|js}. Inlined into HTML drafts.
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        geist: ['var(--font-geist-sans)', 'sans-serif'],
        'geist-mono': ['var(--font-geist-mono)', 'monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
};
```

Important: replace the Geist font fallback `var(--font-geist-sans)` with the literal Google Fonts family name (`'Geist'`) so the CDN-loaded font resolves correctly in standalone HTML. Same for mono.

## Step 6 — Extract component vocabulary

For each shadcn component file you read:

1. Identify the component's base className. For most shadcn components this is in a `cva()` call:
   ```ts
   const buttonVariants = cva(
     "inline-flex items-center justify-center ...",  // ← base
     {
       variants: {
         variant: {
           default: "bg-primary text-primary-foreground hover:bg-primary/90",
           outline: "border border-input bg-background ...",
           ...
         },
         size: { default: "h-10 px-4 py-2", sm: "h-9 px-3", ... },
       },
     }
   )
   ```
2. Capture: base, every variant, every size.
3. For components that use data-state styles (Switch, Tabs, Accordion, Dialog), also capture those state-specific classes:
   ```ts
   "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
   ```

Write one markdown file per component to `_context/components/<name>.md`:

```markdown
# Switch

**Source:** `app/components/ui/switch.tsx`

**Base:**
```
peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50
```

**State variants:**
- `data-[state=checked]:bg-primary` — on
- `data-[state=unchecked]:bg-input` — off

**Thumb:**
```
pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0
```

**Static HTML mock (off):**
```html
<button role="switch" aria-checked="false" data-state="unchecked" class="peer inline-flex h-6 w-11 ... bg-input">
  <span class="block h-5 w-5 rounded-full bg-background shadow-lg translate-x-0"></span>
</button>
```

**Static HTML mock (on):**
```html
<button role="switch" aria-checked="true" data-state="checked" class="peer inline-flex h-6 w-11 ... bg-primary">
  <span class="block h-5 w-5 rounded-full bg-background shadow-lg translate-x-5"></span>
</button>
```
```

The static HTML mock is the most useful part — drafts can copy-paste these directly.

## Step 7 — Write context.md

Aggregate everything into a single human-readable file at `_context/context.md`:

```markdown
# <Project Name> — Vellum Design Context

Auto-generated by `/vellum init` on <ISO date>. Re-run to refresh.

## Project

- Name: <package.json name>
- shadcn baseColor: <from components.json>
- shadcn style: <default | new-york>
- Dark mode: class-based (toggle via `class="dark"` on `<html>` or `<body>`)
- Default body classes: `bg-background text-foreground`
- Font: <Geist | Inter | etc.>

## Design tokens

### Light (`:root`)
| Variable | Value | Notes |
|---|---|---|
| `--background` | `0 0% 100%` | white |
| `--foreground` | `0 0% 3.9%` | near-black |
| `--primary` | `0 0% 9%` | near-black |
| `--primary-foreground` | `0 0% 98%` | near-white |
| ... | ... | ... |

### Dark (`.dark`)
| Variable | Value | Notes |
|---|---|---|
| `--background` | `0 0% 3.9%` | near-black |
| `--foreground` | `0 0% 98%` | near-white |
| `--primary` | `0 0% 98%` | near-white (inverted from light) |
| ... | ... | ... |

## Tailwind theme extensions

- `colors.primary` → `hsl(var(--primary))` (and same pattern for background, foreground, card, popover, secondary, muted, accent, destructive, border, input, ring)
- `borderRadius.lg` → `var(--radius)` (default 0.5rem)
- `fontFamily.geist` → Geist sans
- `fontFamily.geist-mono` → Geist Mono

## Component vocabulary

For each component, see `_context/components/<name>.md` for full class strings and static-HTML mocks.

- Button → `components/button.md`
- Input → `components/input.md`
- Switch → `components/switch.md`
- Tabs → `components/tabs.md`
- Card → `components/card.md`
- Badge → `components/badge.md`
- Dialog → `components/dialog.md`
- Select → `components/select.md`

## Conventions to honor in drafts

1. **Dark theme is primary.** Always set `class="dark"` on `<html>` (or `<body>`).
2. **Use semantic Tailwind classes from theme.extend.colors** — write `bg-background`, `text-foreground`, `bg-primary text-primary-foreground`, NOT raw `bg-neutral-950`.
3. **Border radius via tokens** — `rounded-lg`, `rounded-md`, `rounded-sm` map to `--radius` derivatives. Don't hard-code `rounded-[0.5rem]`.
4. **Spacing in rem via Tailwind utilities** — `p-4`, `gap-6`, `space-y-8`. No inline `style="padding: 16px"`.
5. **Field widths via grid columns or max-w-* utilities** — never `style="width: 280px"`.
6. **Match the user's font stack** — body uses Geist (or whatever the project uses).
7. **Use Lucide icons** — `<i data-lucide="plus"></i>` (the template auto-inits Lucide on DOMContentLoaded).

## Anti-patterns (matches PathSync's CLAUDE.md but applies broadly)

- ❌ `<input type="number">` — use `type="text"` + `inputMode="numeric"` for currency/quantity fields
- ❌ Loading spinners (`Loader2 animate-spin`) — use a skeleton (`bg-muted animate-pulse rounded h-X w-Y`)
- ❌ `window.confirm()` — use the `Dialog` / `AlertDialog` shape
- ❌ Hard-coded hex colors — use semantic tokens
```

## Step 8 — Print summary

After writing all files, print:

```
✓ Vellum init complete

Project: <name>
shadcn baseColor: <neutral|zinc|...>
Tokens extracted: <N> CSS variables (light + dark)
Components captured: <N> primitives
Output: .claude/designs/_context/

Next: /vellum create <project-name>
```
