# Child-support calculation engine

This module (`src/domain/support/`) is the pure, framework-free engine behind the
estimate: `calculateChildSupport(input, rules) => estimate`. It imports no React, no
services, and performs no I/O — every statutory number it uses arrives as data on
`rules: SupportRuleSet` (`src/services/rules/`), never as a constant in this code. That
split is what makes the methodology below "implement the statute" rather than "implement
this year's numbers": a future amendment or a new state is a data change, not a rewrite
of these files.

This document explains *how* the engine gets from a worksheet to a dollar figure, and
points each step at both the source code and the statute subsection it implements. It's
the same explanation surfaced in the app's **Statute Library** (`src/features/statutes/`,
opened from the header's "Statutes" button) — that page shows *which documents* the
numbers came from and *what each one informs*; this README explains *what the engine does
with them*.

## Controlling law

**HB 25-1159**, effective **2026-03-01**, amending **C.R.S. §14-10-115**. It replaced the
former 93-overnight "cliff" and the 1.50 shared-care multiplier with a continuous
parenting-time credit table, raised the schedule ceiling from $30,000 to $40,000 combined
monthly income, and redefined the self-support reserve as a formula keyed to the state
minimum wage ($15.16/hr × 29 hrs/week × 50 weeks ÷ 12 months ≈ $1,831.83/month today).

**This engine has no code path for the pre-2026 methodology** — no 93-night cliff, no
1.50 multiplier. Every function here assumes the continuous-credit model. Supporting an
older vintage (or letting a user switch between vintages) is out of scope until that
methodology is added as a real, separate code path — see the note in `parentingTime.ts`'s
doc comment and the roadmap in the root `CLAUDE.md`.

## Source documents

The two PDFs the rule set was transcribed from and amends are bundled in-app and
browsable from the **Statute Library**:

- **HB 25-1159 Final Act** (`apps/web/public/statutes/co-hb25-1159-final-act.pdf`) — the
  machine-readable enrolled bill text. Supplies the schedule, the parenting-time credit
  table, low-income bands, and the self-support reserve formula: everything in
  `rules.schedule`, `rules.parentingTimeCredit`, `rules.lowIncome`, and
  `rules.selfSupportReserve`.
- **C.R.S. Title 14 — Domestic Matters (2024)**
  (`apps/web/public/statutes/co-title-14-2024.pdf`) — the base statutory chapter
  §14-10-115 sits within. It does **not** contain the schedule itself (§14-10-115(7)(b)
  is a publisher placeholder in this edition); it's the source for the surrounding
  statutory framework the sections below cite.

See `src/services/statutes/statuteDocuments.ts` for the curated, machine-readable list
(`STATUTE_DOCUMENTS`) — each entry names which rule-set `citations` topics it informs, and
that same join is what the Statute Library page renders per document.

## The seven steps

`calculateChildSupport.ts`'s own doc comment is the authoritative summary; this expands
each step with the file that implements it and the exact subsection.

### 1. Adjusted gross income

`income.ts` → `adjustedGrossIncome()`. Sums each party's income lines
(`rules.incomeLines`), applying each line's declared `effect` (`'add'` or `'subtract'`) —
the *which lines exist and how they move income* question is entirely rule-set data, not
this file. Never negative. Each line carries its own per-line citation in the rule set
(e.g. gross income → `§14-10-115(5)(a)`, support for other children → `§14-10-115(6)(b)`).

### 2. Combined income and income shares

`income.ts` → `combinedIncome()`, `incomeShares()`. Simple sum and fractional split;
shares default to 50/50 only when combined income is zero, so downstream math stays
finite instead of dividing by zero.

### 3. Basic obligation from the schedule

`schedule.ts` → `basicObligation()`. Table lookup against `rules.schedule.rows`, keyed by
combined income and child count, interpolated between rows when the rule set says to.
Above the top row, the statute leaves the amount to judicial discretion but sets the top
row as a floor — the engine returns that floor and flags the estimate `aboveScheduleCeiling`.
Citations: schedule table → `§14-10-115(7)(b)`; above-ceiling guidance →
`§14-10-115(7)(a)(VII)`.

### 4. Parenting-time credit

`parentingTime.ts` → `parentingTimeCreditPct()`, `parentingTimeCredit()`. Looks up each
parent's overnights in `rules.parentingTimeCredit.table` (interpolating between entries —
the table carries a fractional 182.5-night midpoint) to get a credit **percentage**, then
multiplies that percentage by the **total** basic obligation — not that parent's own
share — per the statute's literal wording. Two distinct citations apply here: the
percentage table itself → `§14-10-115(8)(h)`; the "total obligation × percentage" formula
→ `§14-10-115(8)(b)`.

### 5. Who pays whom

`calculateChildSupport.ts`, the payer/recipient block. Each party's "basic net" (share of
basic obligation minus their own parenting-time credit) is computed; because credit
percentages sum to 100% and income shares sum to 100%, the two parties' basic-net figures
always sum to zero. The transfer is the **payer's own** basic-net figure, not the
difference between the two (which would be exactly double) — the one formulation that
satisfies all three statutory boundary cases: sole care, an even split with equal
incomes, and every overnight incrementally reducing the amount.

### 6. Low-income adjustments and caps

`lowIncome.ts` → `applyLowIncomeAdjustment()`, `obligationCap()`. Applies to the payer
only, in bands:

- At or below the minimum-order income ceiling: a flat minimum order.
- At or below the self-support reserve: a reduced obligation set by child count, never
  more than the schedule would have charged.
- Above the reserve: the obligation is capped at a percentage of (income − reserve),
  bounded by the reduced amount and the schedule amount.
- A separate statutory rule (`obligationCap`) caps the *final* obligation at a percentage
  of income while the payer earns above the reserve but no more than full-time minimum
  wage.

Citations: low-income bands → `§14-10-115(7)(a)(III)`; self-support reserve formula →
`§14-10-115(3)(g.5)`.

A parent with overnights can also never owe *more* than the same parent would owe with
zero overnights — enforced directly in `calculateChildSupport.ts` alongside these caps,
not inside `lowIncome.ts`.

### 7. Add-on credits

`calculateChildSupport.ts`, the add-on block (`C.R.S. §14-10-115(9)–(10)`). Shared costs
(work-related childcare, health insurance, extraordinary medical — `rules.addOnLines`,
each with its own citation, e.g. childcare → `§14-10-115(9)`, health insurance →
`§14-10-115(10)`) stay in the pooled obligation: both parents owe their income share.
Separately, whichever parent actually carries a line's bill in full is credited that full
monthly amount off their transfer — applied **after** the caps above, since the caps
limit the obligation while the credit is money already paid against it. An unattributed
line is treated as carried by the recipient (the assumption the engine has always made).
The result is floored at $0 — the direction of payment never reverses — with the excess,
if any, surfaced as a named warning rather than silently discarded.

## Rounding

`rounding.ts`. Money rounds to the rule set's unit (whole dollars for Colorado);
percentages display to one decimal place. Applied once, at the end, to the final
estimate — intermediate math stays unrounded so errors don't compound step to step.

## Validation vs. calculation

`validate.ts` is the counterpart to this engine: it answers *is this input safe to
calculate from?*, this engine answers *what does it come to?*. The engine is
**total** — it returns a figure for nearly any input — so `validate.ts` exists
specifically to catch the cases where a confident number would be meaningless (365
overnights entered for both parents computes a confident $0). See that file's own doc
comment for the full split between blocking `ValidationError`s and the non-blocking
`SupportEstimate.warnings` this engine raises directly (above-ceiling, add-on floor
shortfall, the add-on documentation advisory).
