# Anthropic Catalog Submission — Prep Notes

This file is for **Joel's eyes only** — it's a checklist for submitting Vellum to Anthropic's official Claude Code plugin catalog. Delete or move to `.github/` before next push if you don't want it public.

## Where to submit

- Web form: https://claude.ai/settings/plugins/submit
- Or: https://platform.claude.com/plugins/submit

You'll need to be logged into the same Anthropic account you use for Claude.

## Pre-submission checklist

- [x] Plugin manifest at `.claude-plugin/plugin.json` with `name`, `description`, `version`, `author`
- [x] Marketplace manifest at `.claude-plugin/marketplace.json` with `name`, `owner`, `plugins`
- [x] Skill files in `skills/vellum/` (SKILL.md, INIT.md, HTML_TEMPLATE.html)
- [x] README with install instructions, workflow, verbs, roadmap
- [x] LICENSE (MIT)
- [x] Public GitHub repo: https://github.com/applesnort/vellum
- [ ] Tag a release: `git tag v0.1.0 && git push --tags`
- [ ] Test local install end-to-end before submitting (see below)
- [ ] Add a screenshot or short demo GIF to README (recommended — improves catalog acceptance odds)

## Local install test (do this before submitting)

```
# Remove the user-level skill so we test the marketplace install path cleanly
mv ~/.claude/skills/vellum ~/.claude/skills/vellum.bak

# Install from local clone
/plugin marketplace add /tmp/vellum-plugin
/plugin install vellum@applesnort

# Verify
/plugin list

# Test a real flow in pathsync-frontend
cd /Users/jorml/source/encompass/pathsync-frontend
/vellum:vellum init
/vellum:vellum create test-modal
/vellum:vellum draft test-modal --title "Smoke test" -p "A simple card with a button"
/vellum:vellum open <draft-id>

# Open the resulting HTML in browser, verify tokens render correctly

# Cleanup test
/plugin uninstall vellum@applesnort
mv ~/.claude/skills/vellum.bak ~/.claude/skills/vellum
```

After local test passes, install from GitHub to verify marketplace fetch:

```
/plugin marketplace remove /tmp/vellum-plugin
/plugin marketplace add applesnort/vellum
/plugin install vellum@applesnort
```

## Submission form fields (what to expect)

Based on the public submission form, you'll likely be asked for:

- **Plugin name**: `vellum`
- **Marketplace repo URL**: `https://github.com/applesnort/vellum`
- **Plugin version to list**: `v0.1.0` (use a tag, not a commit SHA)
- **Description** (short, ~140 chars): "Local design-iteration skill — self-hosted alternative to SuperDesign. Iterates static HTML/CSS mockups using your real Tailwind tokens and shadcn/ui class vocabulary."
- **Long description**: copy from README
- **Categories/tags**: `design`, `ui`, `mockup`, `shadcn`, `tailwind`, `iteration`
- **Author handle**: `applesnort`
- **License**: MIT

## Acceptance criteria (typical)

- Repo is public and reachable
- Manifests parse (validate against the JSON schemas Anthropic publishes)
- README has install + usage
- License file present
- No malicious code, no telemetry, no exfiltration
- Skill file frontmatter is valid

## After submission

- Reviews typically take 1–2 weeks (this is anecdotal — verify when submitting)
- If rejected, the form will tell you why; common reasons: missing license, no README, broken manifest, name collision with existing plugin
- Once accepted, the plugin appears in the `/plugin` Discover tab inside Claude Code

## Roadmap before next submission update

If you bump versions later:
1. Update `version` in BOTH `.claude-plugin/plugin.json` AND `.claude-plugin/marketplace.json`
2. Tag a release (`git tag v0.2.0 && git push --tags`)
3. The marketplace will auto-pick up the latest tag — no need to re-submit unless major change in description/scope
