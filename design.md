# Cortex — Design System ("Fieldbook")

A design language for Cortex, the home-pricing advisor. This document is the
single source of truth for color, type, icons, spacing, components, motion, and
voice. Build from these tokens; don't invent values inline.

---

## 1. Direction

**The thesis: a surveyor's fieldbook.** Cortex is fundamentally about *place and
measurement* — it geocodes an address, pulls county FIPS codes and land area,
derives a walk score from density, plots the home on a map, and projects three
temperaments over twelve weeks. The interface should feel like the precise,
ruled notebook a field surveyor carries: flat neutral paper, ink linework,
measured entries, and redline markup for anything that needs attention.

This deliberately rejects the default "dark dashboard with one bright accent"
look — which is both a generic AI tell *and* what a finance/proptech dashboard
reaches for by reflex. Fieldbook is light, flat, and quiet, so that the two
things that carry meaning can carry color:

- **Temperature scale.** The three strategies are a literal hot→cool scale.
  Aggressive (cut fast) runs hot, Patient (hold and wait) runs cool, Moderate
  sits between them. Color encodes the actual decision, not decoration.
- **The redline.** A single signal color marks the things a homeowner must not
  miss: the current asking price, critical alerts, and the **fairness floor**,
  which is drawn on charts as a hatched "restricted zone" you don't price below
  — the way a plat map hatches a protected boundary.

**Audience:** a stressed, non-expert homeowner (the "Riya in Newark" case) plus
the occasional human advisor reviewing the AI's work. **The page's one job:**
make a high-stakes pricing decision legible and trustworthy.

### Non-negotiables
- **No gradient backgrounds, anywhere.** All surfaces are flat, solid color —
  no gradients and no background pattern or texture. Separation comes from the
  paper steps and hairline borders alone.
- **One typeface: Inter**, across display, body, and data.
- **Material Symbols (Sharp)** for every icon.
- Color is never the *only* signal — pair it with text, an icon, or a value.

---

## 2. Color

A near-monochrome ink-on-paper base. Chroma appears only for the three strategy
temperatures and for status. Everything else is paper, ink, and rule lines.

### 2.1 Light tokens (canonical)

```css
:root {
  /* Surfaces — flat, neutral "drafting paper" (no green cast). Never gradients. */
  --paper:        #ECECEC;  /* app background */
  --paper-2:      #F5F5F5;  /* cards, panels */
  --paper-3:      #FCFCFC;  /* inputs, raised wells */

  /* Ink — text and linework (neutral, no green cast) */
  --ink:          #1C1F21;  /* primary text, strong lines */
  --ink-2:        #545A5E;  /* secondary text, captions at body size */
  --ink-3:        #84888C;  /* tertiary, large/decorative only (low contrast) */

  /* Rules — borders, dividers */
  --rule:         #D7D7D5;  /* default 1px hairline */
  --rule-strong:  #BCBCBA;  /* hover/active borders, heavier dividers */

  /* Accent — the single signal accent (olive green) */
  --redline:      #5D7828;  /* current price marker, accent, fairness hatch */
  --redline-weak: #D8E1C3;  /* accent tint for fills/zones */

  /* Strategy temperatures — the only "brand" chroma */
  --strat-aggressive: #BD4433;  /* hot  */
  --strat-moderate:   #B0792B;  /* temperate brass */
  --strat-patient:    #3A6486;  /* cool */

  /* Status */
  --ok:    #3F7359;  /* at/below median, equity retained, passed checks */
  --warn:  #BE8A24;  /* above median, caution */
  --crit:  #C03A28;  /* = redline; critical alerts, failed fairness */
  --info:  #3A6486;  /* = patient; neutral notices */

  /* Focus */
  --focus: #5D7828;  /* accent ring */
}
```

### 2.2 Dark variant ("Fieldbook Night")

For low-light use. A near-black base — deep enough that the page content reads
as true dark, with foreground surfaces a hair above it. No green cast on the
neutrals. Same semantics.

```css
:root[data-theme="night"] {
  --paper:        #020202;  /* app / page content background */
  --paper-2:      #060708;  /* cards, panels, sidebar, header */
  --paper-3:      #0D0F11;  /* inputs, raised wells */
  --ink:          #E9E9E7;
  --ink-2:        #ADAEAC;
  --ink-3:        #7F8082;
  --rule:         #303133;
  --rule-strong:  #3F4042;
  --redline:      #7EA22F;  /* accent, brightened for the near-black base */
  --redline-weak: #232B16;
  --strat-aggressive: #DE6452;
  --strat-moderate:   #D29A4A;
  --strat-patient:    #6C9BC0;
  --ok:    #5FA17E;
  --warn:  #D6A33F;
  --crit:  #E0594A;
  --info:  #6C9BC0;
  --focus: #7EA22F;
}
```

### 2.3 Usage rules
- **Redline is rationed.** It belongs to the current price, critical state, and
  the fairness boundary. If everything is redlined, nothing is.
- **Temperature colors mean strategy only.** Don't reuse `--strat-patient` for a
  generic link or button; use ink. (Status `--info` happens to share the value
  because the patient/neutral reading is the same — that overlap is intentional.)
- **Good is `--ok`, caution is `--warn`.** On the Home cards, a price at or below
  the neighborhood median reads `--ok`; above it reads `--warn`.

---

## 3. Typography

**Inter, and only Inter.** One family does all three roles — display, body, and
data — separated by size, weight, tracking, case, and OpenType features. The
"data" role is not a second font; it's Inter with **tabular figures** and the
**slashed-zero** stylistic set turned on, so numbers align in columns and read
as instrument readouts.

```css
:root { --font: "Inter", system-ui, sans-serif; }

/* Data / readout role — still Inter, just measured */
.fb-data {
  font-feature-settings: "tnum" 1, "cv05" 1, "zero" 1; /* tabular + slashed 0 */
  font-variant-numeric: tabular-nums;
}

/* Eyebrow / label role — uppercase, tracked, never a different family */
.fb-eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.10em;
  font-weight: 600;
  font-size: 0.75rem;       /* 12px */
  color: var(--ink-2);
}
```

### 3.1 Type scale (base 16px)

| Token | Size | Weight | Tracking | Line-height | Use |
|---|---|---|---|---|---|
| `display-xl` | 56px / 3.5rem | 700 | -0.03em | 1.0 | Home hero headline |
| `display-l`  | 40px / 2.5rem | 700 | -0.025em | 1.05 | Recommended price, big numbers |
| `heading`    | 28px / 1.75rem | 650 | -0.02em | 1.15 | Section titles |
| `subhead`    | 20px / 1.25rem | 600 | -0.01em | 1.25 | Card titles |
| `body-l`     | 17px / 1.0625rem | 400 | 0 | 1.55 | Lead paragraphs, AI explanation |
| `body`       | 16px / 1rem | 400 | 0 | 1.55 | Default text |
| `small`      | 14px / 0.875rem | 400 | 0 | 1.5 | Secondary text |
| `eyebrow`    | 12px / 0.75rem | 600 | +0.10em | 1.2 | Uppercase labels, data-source tags |
| `data`       | 15px / 0.9375rem | 500 | 0 | 1.4 | Inline numbers, week labels, FIPS |

### 3.2 Rules
- Large prices use `display-l` weight 700 **with** `.fb-data` so figures stay
  monospaced-in-spirit and the zero is slashed — confident and technical.
- Body copy never goes below 14px. Captions at 12px use `--ink-2`, not `--ink-3`
  (which is reserved for large or non-essential text to preserve contrast).
- Don't fake a "mono" look with `letter-spacing` on numbers — use `tnum`.

---

## 4. Iconography — Material Symbols (Sharp)

Sharp cut to match the crisp drafting linework. Load the variable font and drive
it with `font-variation-settings`.

```html
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp:opsz,wght,FILL,GRAD@20..48,400,0..1,0" />
```

```css
.sym {
  font-family: "Material Symbols Sharp";
  font-weight: normal;
  font-style: normal;
  line-height: 1;
  letter-spacing: normal;
  /* unfilled, regular weight, sized to context */
  font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24;
}
.sym--active { font-variation-settings: "FILL" 1, "wght" 500, "GRAD" 0, "opsz" 24; }
.sym--lg     { font-variation-settings: "FILL" 0, "wght" 300, "GRAD" 0, "opsz" 40; }
```

- **Default:** FILL 0 (outlined), weight 400 — hairline and technical.
- **Active/selected** (current tab, chosen strategy): FILL 1, weight 500.
- **Color:** inherit `currentColor`; icons take ink unless they sit inside a
  colored element (alert, strategy chip).
- Icons are 20px in dense UI, 24px standard, 40px for the rare large/empty-state
  glyph. Always pair an icon with a text label for primary actions.

### Icon map
| Concept | Symbol |
|---|---|
| Listings / home | `home_work` |
| Map / location | `location_on`, `explore` |
| Aggressive strategy | `bolt` |
| Moderate strategy | `equalizer` |
| Patient strategy | `schedule` |
| Price path / projection | `show_chart` |
| Price history | `bar_chart` |
| Fairness floor | `shield` |
| Alert: info / warn / critical | `info`, `warning`, `report` |
| Advisor chat | `forum` |
| Re-run analysis | `restart_alt` |
| Delete | `delete` |
| Edit listing | `tune` |
| Data source | `database` |

---

## 5. Space, grid, radius, elevation

```css
:root {
  --s-1: 4px;  --s-2: 8px;  --s-3: 12px; --s-4: 16px;
  --s-5: 24px; --s-6: 32px; --s-7: 48px; --s-8: 64px; --s-9: 96px;

  --r-sm: 3px; --r: 5px; --r-lg: 8px;   /* crisp, not pill-round, not zero */

  --border: 1px solid var(--rule);
  --shadow: 0 1px 2px rgba(24,36,42,.06), 0 2px 8px rgba(24,36,42,.05);
}
```

- **8px rhythm**, 4px for tight inline gaps. Page gutters: 24px mobile, 48px+
  desktop. Max content width ~1200px.
- **Separation comes from hairline borders and the paper steps**
  (`--paper` → `--paper-2` → `--paper-3`), not shadows. Reserve `--shadow` for
  genuinely floating things: the map card, the chat composer, popovers.
- Radius is consistent and small. Cards/inputs/buttons use `--r` (5px); large
  containers `--r-lg`.

### Flat background (no texture)
The app background is a single flat fill — `background-color: var(--paper)` with
**no** background image, pattern, or gradient. Surfaces read apart through the
paper steps (`--paper` → `--paper-2` → `--paper-3`) and hairline borders, not a
texture behind them.

```css
body {
  background-color: var(--paper);
}
```

---

## 6. Components

Built from generic primitives (shadcn-style: button, card, input, tabs, badge,
alert, slider, progress, etc.), re-skinned to the tokens above. Patterns below
map to the existing Cortex components.

### 6.1 Buttons
- **Primary:** ink fill (`--ink`), paper text, `--r`, weight 600. Hover: lifts
  no pixels; border/fill deepens slightly. This is the "Analyze listing" /
  "Apply override" action.
- **Secondary:** transparent, `--border`, ink text. Hover: border →
  `--rule-strong`, background → `--paper-3`.
- **Destructive:** secondary style with `--redline` text + icon; fill turns
  redline only on confirm.
- Min target 44×44px. Icon + label for every primary action.

### 6.2 Cards / panels
`--paper-2` surface, `--border`, `--r-lg`, padding `--s-5`. Title uses `subhead`;
an optional `eyebrow` sits above it. Hairline divider (`--rule`) between header
and body. No drop shadow unless floating.

### 6.3 Fieldbook entry card (Home listing cards)
Styled as a ruled notebook entry rather than a generic tile:
- Top row: a `.fb-data` index/coordinate tag (e.g. lat,long or slug) in
  `--ink-3`, and the days-on-market badge at right (`--warn` if >90d).
- Address as `subhead`; below it the asking price in `display-l`-lite with
  `.fb-data`, colored `--ok` (at/below median) or `--warn` (above).
- A single hairline rule, then the AI one-line summary in `small`.
- Footer: recommended strategy as a temperature chip (§6.6). Whole card is the
  click target; a `delete` icon-button sits top-right, revealed on hover/focus.

### 6.4 Inputs (address, price, days)
`--paper-3` fill, `--border`, `--r`, 44px tall. Focus: 2px `--focus` outline,
2px offset. Numeric inputs use `.fb-data`. Address field shows the debounced
autocomplete list in a bordered popover; each suggestion has a `location_on`
icon and the matched text in `body`, secondary detail in `small`/`--ink-2`.

### 6.5 Tabs (Dashboard: General Info / Strategy & Advisor / Edit Listing)
Rounded segmented control. The list is a recessed `--paper-2` track with a
`--rule` border and `--r` (5px) corners. Inactive triggers: `--ink-2`, no fill.
Active trigger: a raised `--paper` button with `--ink` text, a small `--shadow`,
and the icon flipped to `.sym--active`. Color/fill transition 150ms.

### 6.6 Strategy temperature chip & ScenarioComparison
The core of the system.
- **Chip:** small rounded tag, 1.5px left border in the strategy color, label in
  ink, a `.fb-data` price. Icon per strategy (`bolt`/`equalizer`/`schedule`).
- **ScenarioComparison:** three cards side by side, left-to-right in temperature
  order Aggressive → Moderate → Patient. Each card's **top edge is a 3px bar** in
  its strategy color (the only chroma on the card). The **recommended** scenario
  gets a 2px full border in `--ink` (not color) plus an `eyebrow` "RECOMMENDED" —
  selection is shown by ink weight, not by competing with the temperature hue.
- Each card lists price (`display-l`-lite, `.fb-data`), days-to-sale, equity
  retained (`--ok`), incentives, and reasoning (`small`). A failed fairness check
  shows a `--warn` inline notice with a `warning` icon and the human reason.

### 6.7 Charts (Recharts)
Shared chart grammar:
- Gridlines `--rule`; axes and tick labels `.fb-data` in `--ink-2`.
- **PricePath:** one line per strategy in its temperature color, 2px stroke.
  Neighborhood median = dashed `--ink-3` reference line, labeled. The **fairness
  floor** = solid `--redline` line at 85% of median, with a diagonal **hatch
  zone** filling the area below it (see snippet). Twelve week ticks on the x-axis.
- **PriceHistoryChart:** bars in `--rule-strong` for past prices; the current
  price bar in `--redline` (it's the live number). Labels Original → cuts →
  Current.
- **NeighborhoodComparisonChart:** horizontal bars — original (`--ink-3`),
  current (`--redline`), median (`--ink`) — so the comparison reads instantly.

```html
<!-- Fairness "restricted zone" hatch — SVG pattern, no gradient -->
<defs>
  <pattern id="floorHatch" width="6" height="6" patternUnits="userSpaceOnUse"
           patternTransform="rotate(45)">
    <rect width="6" height="6" fill="var(--redline-weak)"/>
    <line x1="0" y1="0" x2="0" y2="6" stroke="var(--redline)" stroke-width="1"/>
  </pattern>
</defs>
```

### 6.8 PropertyMap (Leaflet)
A muted, light basemap (desaturated, low-saturation tiles à la Positron) so it
sits inside the paper palette — not the old dark map. Marker is a **survey
point**: a `--redline` dot with a thin `--paper` ring and a 1px `--ink` outer
ring. Card gets `--shadow` since the map floats above paper.

### 6.9 The provenance trail (justified numbering)
Cortex's analysis really is a five-step pipeline (collect → analyze → scenarios →
fairness → output), so numbered markers earn their place here — they encode a
true sequence. Show it as a compact `01–05` ruled list with each step's status,
in `.fb-data`. Use numbering **only** for this real sequence, nowhere decorative.

### 6.10 FairnessPanel
States the two rules plainly — "Floor: 85% of neighborhood median" and "Max cut:
12% of original price" — each with a `shield` icon. Per-scenario rows show a
pass/flag state: pass = `--ok` with `check_circle`; flag = `--warn`/`--crit` with
`warning`, plus the human-readable reason. Reasons are full sentences, never just
a colored dot.

### 6.11 AlertFeed
Each alert: left border 2px in its status color, `--paper-2` body, status icon,
title in `subhead`-lite, detail in `small`. info → `--info`, warning → `--warn`,
critical → `--crit`. Newest on top.

### 6.12 AdvisorChat
Composer floats with `--shadow`; transcript scrolls above it. Homeowner messages
right-aligned on `--paper-3`; advisor (AI) messages left-aligned on `--paper-2`.
Enter sends, Shift+Enter newlines.
"Thinking" indicator is a quiet `.fb-data` line — `measuring···` — with the dots
animating, not a bouncing-blob spinner. Auto-scroll to newest.

### 6.13 OverridePanel (advisor controls)
Reads like instrument controls: a labeled `slider` for the price floor (value
shown live in `.fb-data`), a `select` to lock a scenario, a `textarea` note.
Primary button "Apply override"; on success the panel shows an inline `--ok`
confirmation, and the dashboard re-runs.

---

## 7. Motion

Restrained; motion serves orientation, not flourish.
- **Page load:** cards fade in and rise 8px, staggered ~40ms. One pass only.
- **Hero (Home):** the three temperature paths *draw in* once via
  `stroke-dashoffset` (Aggressive first, Patient last) so the fan-out reads as
  three diverging futures. Single play.
- **Hover:** borders deepen `--rule` → `--rule-strong`; no scale/bounce.
- **Tabs/underline:** 150ms ease.
- **Durations:** 120–200ms micro, ≤320ms entrances. Easing `cubic-bezier(.2,.6,.2,1)`.
- **`prefers-reduced-motion: reduce`** disables the path-draw and stagger; content
  appears immediately.

---

## 8. Quality floor (accessibility)

- Body text and UI meet WCAG AA (`--ink`/`--ink-2` on paper clear it
  comfortably). Don't put body text on `--ink-3`.
- Every interactive element has a visible 2px `--focus` ring, 2px offset, and a
  ≥44px target.
- **Color is never the sole carrier of meaning:** strategies show an icon + label
  + value; fairness shows icon + sentence; status shows icon + text.
- Charts include text labels and accessible names; the fairness hatch is
  reinforced by the labeled redline so it survives grayscale.
- Respect reduced motion (§7). Map and icon-only controls have `aria-label`s.

---

## 9. Voice & copy

Plain, active, fieldbook-precise. Name things by what the homeowner controls.

- **Actions are verbs that match their result.** "Analyze listing" →
  toast "Listing analyzed." "Apply override" → "Override applied." "Re-run
  analysis" → "Analysis updated." A button never says "Submit."
- **Empty states invite action,** in the interface's voice:
  *"No listings yet. Add an address to get a pricing read."*
- **Errors are specific and own the problem, without apology or mood:**
  *"Couldn't reach the market data service. Your listing wasn't saved — try
  again."* (Cortex deletes half-created listings on failure; the copy should
  reflect that nothing was left behind.)
- **Numbers get context.** Not "$420,000" alone but "$420,000 — 4% below the
  neighborhood median." Sentence case throughout; no exclamation marks; no
  filler. Each label does one job.

---

## 10. Implementation notes

- **Fonts:** load Inter (weights 400/500/600/650/700) and Material Symbols Sharp.
  Inter is the only text family; the "data" treatment is Inter +
  `font-variant-numeric: tabular-nums` + features `cv05`/`zero` for the slashed
  zero. Do not add a second family for code, numbers, or labels.
- **Tokens:** put §2 and §5 variables in `index.css` `:root`; the dark set under
  `:root[data-theme="night"]`. Reference variables only — no hard-coded hex in
  components.
- **No gradients, no background texture:** the app background is a flat solid
  fill (§5). The fairness hatch (§6.7) is the only SVG texture, and it's
  meaningful, not decorative. If you ever reach for
  `linear-gradient`/`radial-gradient` or a tiled background image, stop — it's
  outside this system.
- **Keep frontend/backend shapes in sync:** the visual system assumes the data
  contract in `types.ts` ↔ the Pydantic models; new fields get a token-based
  treatment here before they ship.

### Signature recap (what makes this Cortex, not a template)
1. Surveyor's **fieldbook** base — flat neutral paper, ink linework, and the
   rationed redline (no background texture).
2. The strategy **temperature scale** (hot Aggressive → cool Patient) as the only
   brand chroma.
3. The **redline** accent and the hatched **fairness restricted zone**.
4. **Inter-only** type, with a tabular/slashed-zero "data" voice instead of a
   second font.
5. The **diverging-paths** hero and the honest **01–05 provenance trail**.