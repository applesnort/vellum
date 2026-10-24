# Critique reference

Read this before every `critique`. It is the full list of principles a finding may cite. If a problem fits none of them, it is probably taste; leave it out or label it a hypothesis.

## Evidence tiers

Two separate labels. Do not mix them.

**Source tier** — how strong the principle is. Tag every principle you cite.

| Tag | Meaning | Example |
|---|---|---|
| `standard` | Published standard, or a perceptual principle with broad agreement | ISO 9241-110, WCAG 2.2, Gestalt grouping |
| `empirical` | Result of a specific study, in a specific domain | Baymard list-item research (e-commerce) |
| `practitioner` | Expert-derived method or recommendation, not a study | Nielsen's heuristics, Fluent 2 layout guidance |
| `hypothesis` | Your own reasoning, no outside source | "Dispatchers scan by age before type" |

An `empirical` source applied outside its domain is a `hypothesis` for this design. Say so: "Baymard (e-commerce) suggests …; untested for dispatch."

**Finding evidence** — what supports this specific finding.

| Tag | Allowed only when |
|---|---|
| `observed` | The lint output or a screenshot shows it. Cite the rule and width, or the screenshot file and the element. |
| `inferred` | You reasoned it from the markup, the brief, or a principle, but nothing measured shows it. |
| `needs users` | Only real users doing the task can settle it (what they scan first, what they understand a label to mean, how long a task takes). |

Never write that users "will" or "do" behave a certain way. Write what a principle predicts and tag it.

## Methods

Run both on every critique. They find different defects.

### Heuristic evaluation

Inspect the screen against Nielsen's 10 usability heuristics (Nielsen, 1994, CHI '94; https://www.nngroup.com/articles/ten-usability-heuristics/). `practitioner` — long-established and widely used, but expert-derived, not a formal standard.

1. Visibility of system status
2. Match between the system and the real world
3. User control and freedom
4. Consistency and standards
5. Error prevention
6. Recognition rather than recall
7. Flexibility and efficiency of use
8. Aesthetic and minimalist design
9. Help users recognize, diagnose, and recover from errors
10. Help and documentation

Heuristic 8 is about irrelevant information competing with relevant information. It does not mean "less information". A dense screen where every item serves the task passes it.

Severity, adapted from Nielsen's 0–4 severity ratings (frequency × impact × persistence; https://www.nngroup.com/articles/how-to-rate-the-severity-of-usability-problems/): **high** = blocks or misleads the primary task, or repeats on every use; **medium** = slows the primary task or blocks a secondary one; **low** = friction an expert works around. Do not report Nielsen's level 1 ("cosmetic problem only") or level 0 ("not a usability problem").

### Cognitive walkthrough

Walk the brief's primary task one action at a time (Wharton, Rieman, Lewis & Polson, 1994, "The Cognitive Walkthrough: A practitioner's guide", in Nielsen & Mack, *Usability Inspection Methods*). `practitioner`. At each action ask:

1. Will the user try to achieve the right effect?
2. Will the user notice that the correct action is available?
3. Will the user associate the correct action with the effect they want?
4. If the correct action is performed, will the user see that progress is being made?

A "no" at any step is a finding. Name the step.

## Principles to cite

### Interaction — ISO 9241-110:2020 `standard`

Confirmed by ISO in 2025 (https://www.iso.org/standard/75258.html). Seven interaction principles: suitability for the user's tasks; self-descriptiveness; conformity with user expectations; learnability; controllability; use error robustness; user engagement. Use them when you compare alternatives that behave differently (for example, inline edit vs. a detail panel).

### Perception and layout

- **Gestalt grouping** (proximity, similarity, common region, connectedness) `standard`. Items that are spaced, coloured or boxed together are read as related. A finding names the two items that are grouped wrongly and the relation the task needs.
- **Visual hierarchy** `practitioner`. The most important item for the primary task must be the most salient (size, weight, contrast, position). Check it on the screenshot: what is the first thing you see, and is that the right thing?
- **Preattentive features** (Healey & Enns, 2012, IEEE TVCG 18(7); https://www.csc2.ncsu.edu/faculty/healey/download/tvcg.11.pdf) `empirical`. Colour hue, size, orientation and motion are seen in parallel; most conjunctions of features are not. An exceptional state that needs two features to find (for example "red AND bold") will probably not pop out. The studies use simple displays; on a dense screen treat this as a strong guide, not a guarantee.
- **Data-ink** (Tufte, 1983) `practitioner`. Remove ink that carries no data: heavy grid lines, repeated labels, decorative borders. Do not remove data to reach a lower density.
- **Layout grids** (Microsoft Fluent 2 layout guidance, https://fluent2.microsoft.design/layout) `practitioner`. Fixed, stretch and hybrid grids suit different content. Applying this, `hypothesis`: tables and maps usually want stretch width; navigation and detail rails want fixed width.

### Finding information

- **Information scent** (Pirolli & Card, 1999, "Information foraging", Psychological Review 106(4); https://doi.org/10.1037/0033-295X.106.4.643) `empirical`. Labels and link text must predict what is behind them. Weak scent shows as users opening items to check what they are.
- **Decision attributes in lists** (Baymard Institute, "What Information to Display in Product Listings", 2023; https://baymard.com/research-articles/product-listing-information) `empirical`, e-commerce. When a list row lacks the attribute users need to choose between rows, users open rows one by one. For other domains this is a hypothesis: ask "which field separates this row from its neighbours for the primary decision?", and check the row shows it.
- **Recognition over recall** (Nielsen heuristic 6) `practitioner`. Codes, IDs and abbreviations that the user must remember from another screen are a cost. Show the meaning beside the code.

### Accessibility — WCAG 2.2 `standard`

https://www.w3.org/TR/WCAG22/. Cite the success criterion number and level.

- 1.4.3 Contrast (Minimum), AA: 4.5:1 for normal text, 3:1 for large text.
- 1.4.11 Non-text Contrast, AA: 3:1 for UI component boundaries and states.
- 1.4.1 Use of Color, A: colour is never the only signal of a state.
- 1.4.10 Reflow, AA: no two-dimensional scrolling at 320 CSS px width, except for parts that need a two-dimensional layout for use or meaning (data tables, maps).
- 2.5.8 Target Size (Minimum), AA: 24×24 CSS px, or enough spacing (other exceptions apply).
- 1.3.1 Info and Relationships, A: structure shown visually is also in the markup (headings, table headers, labels).

### Workload

- **Expert efficiency** (Nielsen heuristic 7) `practitioner`. An operational screen is used hundreds of times a day. Count the clicks and the eye movements for the primary task. Shortcuts and bulk actions matter more than first-use clarity.
- **Cognitive workload** `hypothesis` unless measured. You can name what adds load (holding a value in memory across screens, comparing items that are far apart, decoding colour without a legend). You cannot measure it. Measuring it is NASA-TLX (Hart & Staveland, 1988; https://humansystems.arc.nasa.gov/publications/HFES_2006_Paper.pdf) with real users; never produce TLX scores yourself.

## Writing a finding

Bad: "Improve the spacing." "Make the status clearer." "Feels cluttered."

Good: "Status badge (row, 4th column) — Open and In Progress use the same grey badge, so finding the 111 in-progress requests means reading every label. Task: pick the next request to work. Principle: preattentive features `empirical`; WCAG 1.4.1 (A) `standard`. Fix: distinct hue per status plus an icon, sort In Progress to the top. Evidence: `observed`, screenshot `baseline-1440.png`, rows 3–9."

Rules:
- Five findings at most. Rank by severity, then by how many users and uses it affects.
- One element per finding. Merge findings that share a cause.
- A fix is a concrete change to this draft, not a principle restated.
- Do not report what the lint already reports unless it hurts the task; then cite the lint rule as the evidence.

## Validating with users (out of scope for Vellum)

The critique is expert inspection. It produces hypotheses. These methods test them:

- **First-click test** — show a static draft, ask where users would click to do a task. Good for comparing two drafts.
- **Task-based usability test** — users do the primary task on a clickable prototype; record success, time, errors and hesitation.
- **NASA-TLX** — perceived workload after a task, for comparing demanding workflows.

Tools such as Lyssna and Maze run the first two remotely. Put the open `needs users` findings into the test plan.
