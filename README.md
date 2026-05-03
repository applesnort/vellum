# Vellum

> Local design iteration for Claude Code. A self-hosted alternative to SuperDesign that generates static HTML/CSS mockups using your real Tailwind tokens and shadcn/ui class vocabulary.

No paid service. No account. No remote API. Files live in `.claude/designs/` inside your repo.

## Why

SuperDesign is great, but it's a paid service that runs your design iterations on a remote canvas. Vellum does the same workflow — branch, replace, iterate — but stays entirely local and reads your project's actual design tokens, `tailwind.config.ts`, and shadcn/ui components so generated drafts match your real app at ~95% fidelity.

You stay in your editor. Drafts are git-trackable. Tokens never leave your machine.

## Install

```
/plugin marketplace add applesnort/vellum
/plugin install vellum@applesnort
```

## First-time setup

From any frontend project root with `tailwind.config.{ts,js}` and a shadcn `components.json`:

```
/vellum init
```

This scans `globals.css`, the Tailwind config, and ~10 shadcn primitives, and writes `.claude/designs/_context/` (tokens.css, context.md, per-component vocabularies). Re-run any time tokens change.

## Workflow

```
/vellum create modal-redesign
/vellum draft modal-redesign --title "Baseline" -p "Reproduce the current trip booking modal at 1100px wide, dark theme, all sections visible."
/vellum open <draft-id>

# branch into 4 variants
/vellum iterate <draft-id> --mode branch -p "Linear command-bar header" -p "Editorial magazine" -p "Stripe-dense" -p "Terminal/Vercel"

# refine the winner in place
/vellum iterate <chosen-draft-id> --mode replace -p "Tighten field widths via 12-col grid; cap email at max-w-sm; group passenger contact in one row."
```

Drafts are self-contained `.html` files that load Tailwind via CDN, inline your project tokens, and use Lucide for icons. Open in any browser — no dev server needed.

## Verbs

| Verb | Purpose |
|---|---|
| `init` | One-time per repo. Extracts tokens + shadcn class vocabulary into `.claude/designs/_context/`. |
| `create <name>` | New project folder under `.claude/designs/<slug>/`. |
| `draft <project> --title "X" -p "..."` | Generate a baseline draft from a prompt. |
| `iterate <draft-id> --mode replace -p "..."` | Refine in place. Updates same file. |
| `iterate <draft-id> --mode branch -p "..." -p "..."` | Spawn N sibling drafts from one parent. |
| `open <draft-id>` | Open the HTML in your default browser. |
| `list [project]` | Show project tree of drafts. |

## What Vellum is NOT (yet)

- **Not a real-component renderer.** Drafts are static HTML that mimics your shadcn classes — they won't show interactive Switch state or animated Tabs transitions. Hardcoded data-state classes work for static visual mocks (the same approach SuperDesign uses).
- **Not a Storybook replacement.** If you need real React components rendered with Vitest interactions, Storybook is still the answer. A `promote <draft-id>` verb that converts HTML → JSX with shadcn imports is on the roadmap.
- **Not a multi-page flow generator.** One draft = one page. SuperDesign's `execute-flow-pages` equivalent is roadmap.

## How it works

Vellum is a Claude Code skill — a markdown file (`SKILL.md`) that instructs the Claude model what to do when invoked. It doesn't run as a daemon or background process; it executes inside your Claude Code session.

When you run `/vellum draft …`, Claude:

1. Reads `.claude/designs/_context/context.md` for your project's design vocabulary
2. Reads `HTML_TEMPLATE.html` for the boilerplate scaffold (Tailwind CDN, font wiring, token injection)
3. Generates body markup using only the shadcn class strings extracted from your real components
4. Writes a self-contained `.html` file you can open immediately

The intelligence is in the **`init` extraction**: it grabs your `:root` and `.dark` CSS variable blocks verbatim, your `theme.extend.colors` mapping, and the canonical className strings from each shadcn primitive. Subsequent iterations reference this context instead of re-reading the codebase, so prompts stay tight and drafts stay consistent.

## Roadmap

- [ ] `promote <draft-id>` — convert locked HTML draft into a React component file with proper shadcn imports and `cn()` usage
- [ ] `serve` — local HTTP gallery for flipping through drafts side-by-side
- [ ] Multi-page flows
- [ ] Storybook story export
- [ ] Per-project `.vellumrc` to override extraction paths for non-standard repo layouts

## Philosophy

The name comes from drafting paper architects use — translucent, you sketch over the base drawing without committing. Vellum drafts over your real codebase. Tokens, fonts, components, conventions — all anchored to what's actually there. The sketch is always grounded.

## License

MIT — see [LICENSE](./LICENSE).

## Credits

Inspired by [SuperDesign](https://app.superdesign.dev/), which set the bar for design-iteration agents. Vellum is the local, self-hosted variant for teams who want their iteration loop offline and in-repo.
