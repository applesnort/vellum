# Design context

**Stack:** tailwind-shadcn (Tailwind v4 browser CDN, stock shadcn/ui neutral theme, light mode)

This is a demo context with no app behind it. Tokens are the stock shadcn/ui neutral palette (MIT) plus two status tokens, `warning` and `success`.

**HTML_ATTRS:** none (light mode).
**BODY_CLASS:** `bg-background text-foreground font-sans antialiased`

## Tokens

See `head.html`. Utilities: `bg-background`, `text-foreground`, `bg-muted`, `text-muted-foreground`, `border-border`, `bg-primary text-primary-foreground`, `text-destructive`, `bg-destructive/10`, `text-warning`, `bg-warning/15`, `text-success`, `bg-success/15`. Radius: `rounded-md`, `rounded-lg`.

## Component vocabulary (shadcn/ui v4)

- **Button (default):** `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90`
- **Button (outline):** `inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 border bg-background shadow-xs hover:bg-accent`
- **Button (ghost, sm):** `inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium h-8 px-3 hover:bg-accent`
- **Badge (outline):** `inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap gap-1`
- **Badge (secondary):** `inline-flex items-center justify-center rounded-md border border-transparent px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap bg-secondary text-secondary-foreground`
- **Input:** `h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs`
- **Card:** `bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm`
- **Table:** container `relative w-full overflow-x-auto`; table `w-full caption-bottom text-sm`; header row `border-b`; th `h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground`; body row `border-b transition-colors hover:bg-muted/50`; td `p-2 align-middle whitespace-nowrap`
- **Tabs:** list `bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]`; trigger `inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium whitespace-nowrap`; active trigger adds `bg-background text-foreground shadow-sm`
- **Separator:** `bg-border shrink-0 h-px w-full`

## Conventions

- Icons: Lucide, `<i data-lucide="name" class="size-4"></i>`.
- Spacing roles: field 12px, item 10px, grid 24px, group 32px, section 64px, card inset 24px.
