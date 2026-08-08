# Columbine — Design System & Style Guide

The visual foundation for **support-calculator**, a Colorado family-support estimator.
This document is the written reference; the rendered sheets are the visual reference.

| Artifact | File |
|---|---|
| Token source of truth (CSS variables) | [`theme.css`](./theme.css) |
| Worksheet mockup — light | [`worksheet-light.png`](./worksheet-light.png) |
| Worksheet mockup — dark | [`worksheet-dark.png`](./worksheet-dark.png) |
| Component reference sheet | [`styleguide.png`](./styleguide.png) |
| Render sources (self-contained HTML) | [`src/worksheet.html`](./src/worksheet.html), [`src/styleguide.html`](./src/styleguide.html) |

## How theming works

Every value is a **CSS custom property** defined in `theme.css`:

- Light theme -> `:root`
- Dark theme -> `[data-theme="dark"]`

A future theme service switches themes by setting `data-theme` on `<html>`. When Tailwind
is added, these map 1:1 into an `@theme` block (e.g. `--color-primary: var(--primary)`), so
utilities like `bg-primary` / `text-muted` resolve to the same tokens the mockups use.

**Regenerate the PNGs** after editing the HTML/CSS with headless Chrome (see the commands in
this repo's mockups; `--window-size` controls the captured height, `?theme=dark` on the
worksheet URL renders the dark variant).

---

## Palette — "Columbine"

Grounded in Colorado: columbine indigo/periwinkle primary, sandstone/sunset accent, slate
neutrals, spruce positive, clay alert. Calm and trustworthy for pro-se parents, precise for
practitioners.

| Token | Role | Light | Dark |
|---|---|---|---|
| `--bg` | App background | `#F7F7FB` | `#14141B` |
| `--surface` | Cards, inputs | `#FFFFFF` | `#1C1C28` |
| `--surface-2` | Subtle fills, input rest | `#EEEEF4` | `#252533` |
| `--border` | Hairlines, input borders | `#DBDBE6` | `#33333F` |
| `--border-strong` | Emphasized dividers | `#C3C3D4` | `#454556` |
| `--text` | Primary ink | `#1C1C28` | `#ECECF2` |
| `--text-muted` | Secondary text, labels | `#5A5A6A` | `#A0A0B0` |
| `--text-subtle` | Hints, placeholders | `#8A8A99` | `#6E6E80` |
| `--primary` | Parent A, primary actions, focus | `#5B57D1` | `#8B87F0` |
| `--primary-hover` | Hover state | `#4A46B8` | `#9E9AF5` |
| `--primary-weak` | Tint bg (selected/help) | `#ECEBFB` | `#262445` |
| `--accent` | Parent B, fills, big numerals | `#E0A46B` | `#E8B27E` |
| `--accent-strong` | Accent as **text** on light | `#B4712F` | `#E8B27E` |
| `--positive` | Who receives / good state | `#2F8F6B` | `#4FB58C` |
| `--alert` | Errors | `#C4553B` | `#E07A5F` |
| `--focus` | Focus ring color | `rgba(91,87,209,.45)` | `rgba(139,135,240,.55)` |

**Accessibility rules**

- `--accent` (sandstone) is for **fills, underlines, and large numerals only** — never
  small body text on light surfaces. For accent-colored text on light, use
  `--accent-strong` (`#B4712F`), which meets WCAG AA on `--surface`.
- Body text (`--text` on `--bg`/`--surface`) and muted text (`--text-muted`) both meet AA.
- Focus is always a visible 3px ring (`--focus-ring`), never removed.

**Semantic party colors** — Parent A is always `--primary`, Parent B is always `--accent`.
This pairing is used everywhere the two parents are compared (income columns, the
parenting-time bar, the income-share split), so the color itself carries meaning.

---

## Typography

| Role | Face | Size / weight | Notes |
|---|---|---|---|
| Display | **Bricolage Grotesque** | 32–34px / 700, `-0.02em` | Page titles; used with restraint |
| Heading | Bricolage Grotesque | 18px / 600 | Section titles |
| Body | **Public Sans** | 15px / 400 | Default UI text |
| Label | Public Sans | 13–14px / 600 | Field labels |
| Numeral | Public Sans, `font-variant-numeric: tabular-nums` | — | **All** dollar amounts, %, overnights |
| Eyebrow | Public Sans | 12px / 600, `.09em`, uppercase, `--accent-strong` | Section kickers |

Public Sans is the USWDS government typeface — a deliberate "official / trustworthy"
signal appropriate for a legal-adjacent calculator. Bricolage Grotesque supplies warmth and
character in the display role so the page doesn't read as generic. Always apply tabular
figures to numbers so columns of currency align.

Load in the app via `@fontsource/bricolage-grotesque` and `@fontsource/public-sans` (or a
`<link>` to Google Fonts). Fallback stack: `system-ui, sans-serif`.

---

## Spacing, radius, elevation

- **Spacing** — 4px base: `--sp-1`...`--sp-8` = 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64.
- **Radius** — `--r-sm` 6px (inline), `--r-md` 10px (fields, buttons), `--r-lg` 16px
  (cards), `--r-pill` 999px (toggles, chips).
- **Elevation** — `--shadow-sm` (resting cards), `--shadow-md` (results rail, popovers),
  `--shadow-lg` (modals). Shadows deepen in dark mode (defined per theme).

---

## Components

Each maps to a future React component; keep calculation logic out of these (see CLAUDE.md).

### Section card
White `--surface` on `--bg`, `--r-lg`, `--shadow-sm`, numbered badge (`--primary` on
`--primary-weak`) + title + one-line helper. One numbered card per worksheet step.

### Party column header
Two right-aligned labels (Parent A / Parent B) each prefixed with their semantic dot
(`--primary` / `--accent`). Sits above the income rows and aligns to the two input columns.

### Field row
`label (+ sub-hint)` on the left, one or two inputs on the right in the party columns. Rows
are separated by a top `--border` hairline.

### Currency input
`--r-md` field, right-aligned, tabular figures, `$` prefix rendered as a `::before` on a
`.money` wrapper. Focus -> `--primary` border + `--focus-ring`. **Do not** put the `$`
affordance on non-currency fields (e.g. overnights).

### Field states
Default -> `--border`. Focus -> `--primary` + ring. Error -> `--alert` border + `--alert-weak`
ring, with the message carried in an **error tooltip** (see Validation below) rather than an
inline line of text — worksheet inputs sit in a tight two-column grid, and a message that
appears and disappears inline reflows the row. Disabled -> `--surface-2` fill, `--text-subtle`
text.

### Validation
Invalid input is always **surfaced, never silently corrected** — a value quietly clamped to a
legal one makes the field and the estimate disagree with nothing on screen saying so.

- **Error tooltip** — the field-level message. Same bubble as the help affordance but filled
  `--alert` with white text, revealed on hover / focus, positioned *below* the field (upward
  would cover the row label). Always present in the DOM so it can be referenced by
  `aria-describedby`.
- **Validation summary** — `--alert` border on `--alert-weak`, above the worksheet, one row
  per error, each row focusing its field. The tooltip needs hover or focus, so it is
  effectively invisible on touch and unreachable once scrolled away; this is the counterpart.
  A cross-field error (overnights not totalling the year) highlights **both** inputs and
  appears once here.
- **Frozen estimate** — when input is invalid the results rail keeps the last complete figures
  rather than recalculating, dims them to 45%, and states why in an `--alert` bar. Progression
  is disabled at the same time, so the gate is visible rather than a click that does nothing.

Copy follows the Voice rules below: say what happened *and* the fix ("Overnights add up to
730, not 365. Remove 365 nights from one parent.").

### Segmented toggle
Pill track (`--surface-2`) with a raised selected segment (`--surface` + `--shadow-sm`). For
mutually exclusive choices: pay period, yes/no, paid vs received.

### Number stepper
Pill with `–` / value / `+`; value in tabular 700. Used for the number of children.

### Help affordance
Small circular `?` (`--surface-2`, `--border`). Reveals a dark tooltip (`--text` bg,
`--surface` text) with a caret. Keep copy to one plain sentence.

### Parenting-time balance bar — *signature element*
A 0–365 overnight track split between the two parents (`--primary` | `--accent`), with a
0 / 183 / 365 scale and a legend of nights + percentage. It visually encodes the
parenting-time multiplier that is the conceptual heart of Colorado's 2026 unified worksheet
— the one thing this UI is remembered by. Reuse the same two colors as the income columns.

### Results callout (sticky rail)
`--surface` card, `--shadow-md`. Eyebrow, big display amount with an `--accent` underline
(sandstone highlight), a plain "**Payer** pays **Recipient**" line (payer `--primary`,
recipient `--positive`), then the breakdown: combined income, income-share split bar,
line items (basic obligation, parenting-time adjustment as a `--positive` credit, add-ons),
and a bold net total. Ends with a primary + ghost button and a guideline citation footnote.

### Buttons
- **Primary** — `--primary` bg, `--on-primary` text (main action).
- **Secondary** — `--primary-weak` bg, `--primary` text (additive, e.g. "Add a parent").
- **Ghost** — transparent, `--border` outline (low-emphasis, e.g. Print / Export).
- All: `--r-md`, 600 weight, visible `--focus-ring` on focus.

---

## Voice

Plain, active, sentence case. Name things the way a parent recognizes them ("Overnights per
year", not "parenting-time coefficient"). Errors say what happened and how to fix it
("Enter a number between 0 and 365."). Always frame output as an **estimate** and cite the
guideline (`C.R.S. §14-10-115`) — trust is part of the design.
