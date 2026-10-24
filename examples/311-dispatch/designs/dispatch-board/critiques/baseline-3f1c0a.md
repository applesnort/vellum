# Critique: Service requests — baseline table

Draft: drafts/baseline-3f1c0a.html · Brief: brief.md · Lint: PASS at 1440, 390 · Shots: shots/baseline-3f1c0a-1440.png, shots/baseline-3f1c0a-390.png · Mode: `--no-blind`

The lint passes: spacing, headings and reflow are sound. Every finding below is about task fit, which the lint cannot measure.

## 1. [high] Resolution column — duplicates look like new work

- **Problem:** 5 of the 12 open heat complaints are duplicates of a building-wide condition. The only place that says so is the Resolution cell, which is truncated to "This complaint is a duplicate of…" in muted grey. In every other column a duplicate row is identical to a new one. Task: decide whether a request is new work. The operator must read the end of the row for each heat complaint, or open it.
- **Principle:** decision attributes in lists (Baymard) `empirical`, e-commerce, so a `hypothesis` here; information scent (Pirolli & Card) `empirical`.
- **Fix:** make duplicate a derived state, not prose: a "Duplicate" badge next to the status, and group duplicates under their parent condition (collapsed, with a count).
- **Evidence:** `observed` — shots/baseline-3f1c0a-1440.png, rows 70848136, 70851043, 70855602, 70852581, 70855519.

## 2. [high] Row order and weight — no severity or wait time

- **Problem:** rows are sorted by creation time only, and every row has the same visual weight. Eleven open heat complaints for an entire building (the oldest at 11:25 PM) sit below an in-progress posted-parking violation at 1:05 AM. The screen shows absolute times ("Oct 22, 11:25 PM"), so the operator must work out how long each request has waited. Task: pick the next request to act on.
- **Principle:** visual hierarchy `practitioner`; recognition rather than recall (Nielsen 6) `practitioner`; suitability for the user's tasks (ISO 9241-110) `standard`.
- **Fix:** default sort by an explicit priority (severity, then wait time), and show wait time as an age ("2 h 18 m") with the absolute time on hover. Mark "entire building" scope visibly.
- **Evidence:** `inferred` from the brief and the sort order. Which attributes define priority for this desk is `needs users`.

## 3. [high] Phone layout — the decision columns are off screen

- **Problem:** at 390 px the visible columns are the checkbox, ID, Created and Agency. Complaint type, street and status need a sideways scroll on each row. A supervisor on a phone cannot tell what any request is without scrolling. WCAG 1.4.10 exempts data tables from reflow, so this is not a conformance failure; it is a task failure.
- **Principle:** suitability for the user's tasks (ISO 9241-110) `standard`.
- **Fix:** below `md`, render each request as a list row: complaint type and scope on line 1, street and age on line 2, status badge at the end. Drop the ID and checkbox on phone.
- **Evidence:** `observed` — shots/baseline-3f1c0a-390.png, the whole table.

## 4. [medium] Status badges — three states, one appearance

- **Problem:** Open, In Progress and Closed use the same outline badge. Telling them apart means reading each label. The status column is the main way to separate queue work from finished work.
- **Principle:** preattentive features (Healey & Enns) `empirical`. WCAG 1.4.1 is not violated, because the text is the signal and colour is not used at all.
- **Fix:** a distinct treatment per state: Open as a filled warning badge, In Progress as an outline badge with a dot, Closed as muted text with no badge. Keep the text label.
- **Evidence:** `observed` — shots/baseline-3f1c0a-1440.png, Status column.

## 5. [medium] Default view — a log, not a queue

- **Problem:** the default tab is "All", so 7 closed requests sit between open ones. Each closed row is noise for the primary task. The row-action button is also cut off at the right edge at 1440 px, because 11 columns are wider than the container.
- **Principle:** aesthetic and minimalist design (Nielsen 8: irrelevant information competes with relevant information) `practitioner`.
- **Fix:** open on a "Needs action" view (Open + In Progress, closed hidden). Move Location Type and Descriptor into the detail; that removes 2 columns and brings the actions back on screen.
- **Evidence:** `observed` — shots/baseline-3f1c0a-1440.png: closed rows 1, 3, 4, 6, 17, 21 and 22; the action column clipped on every row.

## Open questions for users

- Which attributes decide what an operator handles next: scope (entire building), complaint type, wait time, or the agency's SLA?
- Do operators act on duplicates at all, or only on the parent condition?
- Does a supervisor on a phone act on requests, or only watch the queue?
