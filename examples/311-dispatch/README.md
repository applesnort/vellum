# Example: 311 dispatch board

A worked `critique` → `branch` loop on a dense operational screen with real, messy data.

## Data

`data/brooklyn-311-sample.json` holds 40 Brooklyn service requests from [NYC Open Data, 311 Service Requests](https://data.cityofnewyork.us/Social-Services/311-Service-Requests-from-2010-to-Present/erm2-nwe9), from a 2.5-hour window on 22–23 October 2026. NYC Open Data is free to use. House numbers are removed; only the street is kept. The sample has a fixed mix: 19 open, 14 in progress, 7 closed; 5 duplicates of a building-wide condition; 15 with no resolution text; 2 with no street; one 700-character resolution.

The desk-operator role in `brief.md` is fictional. The data is not.

## Files

`designs/` has the same layout as `.claude/designs/` in a real repo.

| File | What it shows |
|---|---|
| `designs/_context/` | A demo context: stock shadcn/ui neutral tokens, no app behind it |
| `designs/dispatch-board/brief.md` | The six-line brief that the first `critique` wrote |
| `designs/dispatch-board/drafts/baseline-3f1c0a.html` | The baseline: a plain shadcn data table with every field |
| `designs/dispatch-board/critiques/baseline-3f1c0a.md` | Five findings, each with principle, fix and evidence tier |
| `designs/dispatch-board/drafts/baseline-3f1c0a-b1-*.html` | Branch A: triage queue grouped by severity |
| `designs/dispatch-board/drafts/baseline-3f1c0a-b2-*.html` | Branch B: focused table with a detail rail |
| `designs/dispatch-board/manifest.json` | Each branch's `hypothesis`, `favors`, `sacrifices` and the findings it `addresses` |
| `designs/dispatch-board/shots/` | Lint screenshots at 1440 and 390 |

## What to notice

- The baseline passes the layout lint. All five findings concern task fit, which no lint measures.
- Findings 1, 3, 4 and 5 are `observed`: each one cites a screenshot. Finding 2 is `inferred`, and its key question (what makes a request urgent at this desk) is `needs users`.
- A and B address the same five findings with opposite bets: A gives up density to make the next action obvious, and B keeps density and asks the operator to trust a computed priority. Only operators doing the task can settle this. The critique's "Open questions for users" lists what to ask them.

The critique ran with `--no-blind`, because a committed example cannot hold a reader's prediction. To try the blind step, copy `designs/` into a repo as `.claude/designs/` and run `/vellum critique baseline-3f1c0a`.
