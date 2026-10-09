---
version: alpha
name: "Tessera"
description: "An English-language Customer Success workspace with warm graphite surfaces, electric lime precision accents, diffuse olive depth, and tabular evidence."
colors:
  primary: "#9FE85C"
  on-primary: "#0D1508"
  secondary: "#242520"
  on-secondary: "#F5F5F3"
  neutral: "#0B0B0B"
  surface: "#191919"
  surface-elevated: "#242520"
  surface-featured: "#151C10"
  on-surface: "#F5F5F3"
  on-surface-muted: "#8F908A"
  outline: "#2F302D"
  outline-active: "#45473F"
  success: "#9FE85C"
  on-success: "#0D1508"
  success-container: "#1E2A12"
  warning: "#FBBF24"
  on-warning: "#261A04"
  danger: "#F87171"
  on-danger: "#1A0505"
  danger-container: "#3A1414"
  focus-ring: "#9FE85C"
  glow-lime: "#8DE02C"
  chart-strong: "#4A6B1A"
  on-chart-strong: "#FFFFFF"
  chart-soft: "#9AAE7A"
  on-chart-soft: "#0D1508"
  chart-prior: "#5F8538"
  graph-account: "#9FE85C"
  graph-conversation: "#60A5FA"
  graph-signal: "#FBBF24"
  graph-decision: "#C084FC"
  graph-evidence: "#94A3B8"
typography:
  headline-lg:
    fontFamily: "Inter"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  headline-md:
    fontFamily: "Inter"
    fontSize: "22px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Inter"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  display-number:
    fontFamily: "Inter"
    fontSize: "36px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  display-number-sm:
    fontFamily: "Inter"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body-md:
    fontFamily: "Inter"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  body-sm:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label-md:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.2
  label-sm:
    fontFamily: "Inter"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.2
  label-caps:
    fontFamily: "Inter"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  gutter: 16px
  margin: 16px
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.on-secondary}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.on-danger}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: "44px"
  icon-button:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    size: "44px"
  sidebar:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  nav-active:
    backgroundColor: "{colors.on-surface}"
    textColor: "{colors.neutral}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: "40px"
  nav-active-icon:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    rounded: "{rounded.sm}"
    size: "28px"
  nav-inactive:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    height: "40px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.full}"
    height: "44px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  card-featured:
    backgroundColor: "{colors.surface-featured}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  icon-housing:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.sm}"
    size: "36px"
  page:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.on-surface}"
  caption:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface-muted}"
    typography: "{typography.body-sm}"
  trend-up:
    backgroundColor: "{colors.success-container}"
    textColor: "{colors.success}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
  trend-down:
    backgroundColor: "{colors.danger-container}"
    textColor: "{colors.danger}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
  badge-warning:
    backgroundColor: "{colors.surface-elevated}"
    textColor: "{colors.warning}"
    typography: "{typography.label-caps}"
    rounded: "{rounded.sm}"
  chart-strong:
    backgroundColor: "{colors.chart-strong}"
    textColor: "{colors.on-chart-strong}"
  chart-soft:
    backgroundColor: "{colors.chart-soft}"
    textColor: "{colors.on-chart-soft}"
  divider:
    backgroundColor: "{colors.outline}"
  focus-ring:
    backgroundColor: "{colors.focus-ring}"
---

# Tessera — Design System

> Source of truth for product UI. Format: [Google DESIGN.md spec](https://github.com/google-labs-code/design.md). Status: Draf — menunggu ACC. Kemiripan referensi: belum diukur (tanpa preview).

## Overview

Tessera is an **Operate** workspace where Customer Success Managers (CSMs) investigate retention risks, verify cross-call evidence, and approve save plans before renewals.

The visual system is derived from the **InsightX Dark Analytics reference** (Dribbble shot supplied by the team):
- **Canvas & Shell:** Near-black canvas (`#0B0B0B`). The sidebar and every content block are floating graphite cards (`#191919`) with 16px radius, separated from the canvas by tone, not by heavy borders. Header sits directly on the canvas: page title left, pill search and circular icon buttons right.
- **Warm neutrals:** Grays are neutral-to-warm (`#191919`, `#242520`, `#2F302D`), never blue-tinted. Muted text is a warm gray (`#8F908A`).
- **Signature Accent & Lighting:** Electric Lime (`#9FE85C`) for the active-nav icon, primary action, and positive trends. One featured card per screen carries a top-centered olive glow over dark olive (`#151C10`).
- **Navigation Highlighting:** Active route is a solid off-white rounded rectangle (`#F5F5F3`, 12px radius) with dark text and a lime square icon housing.
- **Data & Metrics:** Large bold figures with `tabular-nums`, small trend pills on tinted containers (lime on dark green, coral on dark maroon), smooth dual-period line chart with a dashed cursor guide, and a three-bubble proportion chart in olive, lime, and sage.
- **Mode:** Dark only.
- **Language:** All user-facing UI copy is English. Engineering comments are English.
- **Exclusions:** No decorative photos, no avatar portraits, no emoji, no Unicode triangles as icons, no notification feed, no low-contrast gray on gray.

## Colors

All text pairs meet WCAG AA (≥ 4.5:1 body, ≥ 3:1 large text and UI). Ratios below are computed with the WCAG relative-luminance formula.

### Palette Tokens

| Token | Hex | Role & Usage | Contrast |
|---|---|---|---|
| `neutral` | `#0B0B0B` | App canvas behind sidebar and cards | Base |
| `surface` | `#191919` | Sidebar, cards, search bar, inactive nav, icon buttons | `on-surface` ≈ 16.1:1 |
| `surface-elevated` | `#242520` | Icon housings, popovers, tooltips, dropdowns | `on-surface-muted` ≈ 4.8:1 |
| `surface-featured` | `#151C10` | Base under the featured card's olive glow | `on-surface` ≈ 16.1:1 |
| `outline` | `#2F302D` | Table dividers, input borders, chart grid lines (decorative) | — |
| `outline-active` | `#45473F` | Hover ring on interactive cards (supplementary cue; focus uses `focus-ring`) | — |
| `primary` | `#9FE85C` | Electric Lime: primary action, active-nav icon, positive signal | `on-primary` ≈ 12.6:1 |
| `on-primary` | `#0D1508` | Text and icons on lime | — |
| `secondary` | `#242520` | Secondary buttons, dropdown triggers | `on-secondary` ≈ 14.1:1 |
| `on-surface` | `#F5F5F3` | Headlines, values, body text | AAA |
| `on-surface-muted` | `#8F908A` | Labels, timestamps, metadata, microcopy | ≈ 5.4:1 on `surface` |
| `success` | `#9FE85C` | Positive trend, healthy, approved | ≈ 10.1:1 on `success-container` |
| `success-container` | `#1E2A12` | Background of positive trend pills | — |
| `warning` | `#FBBF24` | Moderate risk, items in review | ≈ 9:1 on `surface-elevated` |
| `danger` | `#F87171` | High risk, negative trend, rejected | ≈ 6.4:1 on `surface`, ≈ 5.9:1 on `danger-container` |
| `on-danger` | `#1A0505` | Text on solid danger buttons | ≈ 7.3:1 on `danger` |
| `danger-container` | `#3A1414` | Background of negative trend pills | — |
| `focus-ring` | `#9FE85C` | 2px keyboard focus outline, 3px offset | ≥ 3:1 vs `neutral` and `surface` |
| `glow-lime` | `#8DE02C` | Only inside the featured-card radial gradient | — |

### Chart Colors

| Token | Hex | Use | Label on it |
|---|---|---|---|
| `chart-strong` | `#4A6B1A` | Largest category bubble, prior-year area fill | `on-chart-strong` `#FFFFFF` ≈ 6.2:1 |
| `primary` | `#9FE85C` | Second category, current-period line | `on-primary` |
| `chart-soft` | `#9AAE7A` | Third category | `on-chart-soft` `#0D1508` ≈ 7.7:1 |
| `chart-prior` | `#5F8538` | Prior-period line in dual-period chart | — |

### Graph Semantic Colors

| Node Type | Token | Hex | Meaning |
|---|---|---|---|
| Account | `graph-account` | `#9FE85C` | Customer account node |
| Conversation | `graph-conversation` | `#60A5FA` | Call transcript or ticket thread |
| Signal | `graph-signal` | `#FBBF24` | Extracted risk, competitor mention, or leadership change |
| Decision | `graph-decision` | `#C084FC` | Append-only human-approved save plan |
| Evidence | `graph-evidence` | `#94A3B8` | Quote span with timestamp and provenance |

Node color is always paired with a text label and Lucide icon, never color alone.

## Typography

**Inter** (fallback `system-ui, -apple-system, sans-serif`), `font-variant-numeric: tabular-nums` on every number. The reference headings look geometric; matching the exact face is not yet verified, Inter is kept for density and number legibility.

| Level | Size | Weight | Line Height | Tracking | Application |
|---|---|---|---|---|---|
| `headline-lg` | 28px | 700 | 1.15 | -0.03em | Page title in header ("Accounts") |
| `headline-md` | 22px | 600 | 1.20 | -0.02em | Chart and section titles ("Risk trend") |
| `title` | 18px | 600 | 1.30 | -0.01em | Card headers, modal titles |
| `display-number` | 36px | 700 | 1.10 | -0.02em | Primary KPI values |
| `display-number-sm` | 24px | 700 | 1.10 | -0.02em | Mini KPI values |
| `body-md` | 16px | 400 | 1.55 | normal | Transcript excerpts, plan text |
| `body-sm` | 14px | 400 | 1.50 | normal | Table rows, descriptions |
| `label-md` | 14px | 500 | 1.20 | normal | Buttons, nav items, tabs, KPI labels |
| `label-sm` | 12px | 500 | 1.20 | normal | KPI microcopy, trend pills, chart axes |
| `label-caps` | 11px | 600 | 1.20 | +0.08em | Status badges, sidebar section labels |

## Layout

### App Shell

1. **Sidebar card (desktop ≥ 1200px: 248px wide, 16px inset from viewport edges, full height minus insets):**
   - Background `surface`, radius 16px, padding 16px, no border.
   - **Header:** Tessera wordmark with a symbol in `primary` (placeholder until a logo is chosen; no off-token colors). No collapse toggle until a collapsed layout exists.
   - **Navigation:** One group, three destinations from PRD §6: **Accounts** (risk ranking), **Review** (save plans), **Data**, and nothing else. Review shows a count chip of pending plans. Benchmark is not a screen: retrieval benchmark results, if run, live in the pitch, not the nav. Account Detail is a drill-down from Accounts, not a menu item. No Settings, no Analysis/System groups.
   - **Bottom card:** workspace label and data source line in text (no avatar). Text: `KasirNusa · synthetic dataset` with snapshot date `1 Oct 2026`; before ingest it reads `Synthetic seed data · resets on refresh`. This replaces the reference user dock and its ⋯ menu.
2. **Header (on canvas, 64px tall):**
   - Left: page title (`headline-lg`).
   - Right: pill search (`input`, 320px) with placeholder `Search accounts, signals, or evidence`, then only the icon buttons the current screen uses (e.g., Accounts: renewal-window picker; Data: refresh compile status). No global notification bell.
3. **Content canvas:** 12-column grid, 16px gutter, cards on `neutral`. Fluid full width: sidebar pinned left, content fills the rest of the viewport.

### Responsive Breakpoints

| Breakpoint | Width | Grid | Navigation | Touch Target |
|---|---|---|---|---|
| **Mobile** | < 768px | 1 column, 16px gutter | Header with 44×44px burger; sidebar becomes left drawer | ≥ 44×44px |
| **Tablet** | 768–1199px | 6 columns, 16px gutter | Burger + drawer; search collapses to icon button that expands | ≥ 44×44px |
| **Desktop** | ≥ 1200px | 12 columns, 16px gutter | Sidebar card always visible | ≥ 36×36px |

Drawer rules: scrim `rgba(0,0,0,0.6)`, Escape closes, focus moves into drawer and is trapped, focus returns to burger on close, body scroll locked. No horizontal page scroll at 375/768/1440.

### Screen Specifications

| Screen | Task | Reference Pattern | Primary Information | Supporting | Key Actions |
|---|---|---|---|---|---|
| **Accounts** (risk ranking) | Decide which of the 40 customers to review | KPI row (first featured) + ranking table; C01–C06 pinned on top | Priority score (0–100, labelled "priority score", never churn probability), level Low/Medium/High/Critical, top risk factor, data coverage, `mismatch` flag vs CRM health | Annual contract value, weighted value for priority (`annual value × score / 100`), days to renewal, NPS as context | Open account; filter by level |
| **Account Detail** | Check evidence path, timeline, ask the graph, draft a plan | Left: factor breakdown, evidence subgraph, timeline; right: Ask-the-graph box + plan draft | Factors with their evidence paths (≥3 sources for a recommendation), cited nodes | Source file, row/interaction ID, snapshot period, Jev confidence | Ask a question (answer cites nodes or abstains); send plan to Review |
| **Review** (save plans) | Decide plans and see precedent | Single plan card with cited `decision_log` precedent and deviation note; feedback thread below | Plan text, precedent `decision_id`, why it deviates | Author, time, prior Decisions | Approve or reject (signed-in only, append-only, no email sent); reply to feedback |
| **Data** | See sources, ingest status, Jev status, errors, cost | Source table + compile stats card | 15 files with rows, hash, ingest status; node/edge counts per type | Jev calls written/reviewed/discarded, errors, actual cost | Run ingest (signed-in only) |

## Elevation & Depth

1. **Cards and sidebar:** `surface` on `neutral`, radius 16px, no border, no shadow. Depth comes from the tone step alone, as in the reference.
2. **Featured card (one per screen):**
   ```css
   background: radial-gradient(ellipse at 50% -10%, rgb(141 224 44 / 0.28) 0%, rgb(21 28 16 / 0) 70%), #151C10;
   ```
   Text on it stays `on-surface` / `on-surface-muted`; the glow sits behind the label row, never behind the value.
3. **Popovers, tooltips, dropdowns:** `surface-elevated`, 1px `outline`, radius 12px, shadow `0 12px 32px rgb(0 0 0 / 0.5)`.
4. **Interactive cards:** on hover, 1px `outline-active` inset ring appears; no lift, no transform. Transition 150ms ease-out. Respect `prefers-reduced-motion`.

## Shapes & Geometry

- **Corner radii:**
  - `sm` 8px: trend pills, badges, icon housings, active-nav icon square.
  - `md` 12px: buttons, nav items (active and inactive), dropdowns, popovers.
  - `lg` 16px: sidebar, cards, chart containers.
  - `xl` 20px: modal dialogs.
  - `full`: search input, circular icon buttons, chart bubbles.
- **Icons:** Lucide only, 1.75px stroke, 18–20px. Trend direction uses `TrendingUp` / `TrendingDown` (14px), not ▲▼ characters. Icon-only buttons carry `aria-label`.
- **Logo:** not yet designed; placeholder symbol uses `primary`.
- **Charts:**
  - **Risk trend:** smooth monotone curve, current period `primary` 2px line with area fill `primary` 12% → 0%; prior period `chart-prior` 1.5px line with `chart-strong` area at 20%. Vertical dashed guide in `on-surface-muted` at the inspected month, dot markers on both series, tooltip in `surface-elevated` showing both periods side by side. Grid lines `outline`, axis labels `label-sm` muted. Accessible data table toggle below.
  - **Risk categories:** three bubbles sized by share (`chart-strong`, `primary`, `chart-soft`) with in-bubble percentage and a dot legend showing category, percent, and count.

## Components

1. **Navigation item:** 40px tall (44px under 1200px), radius 12px, 12px horizontal padding, Lucide icon + label.
   - Active: `on-surface` background, `neutral` text, weight 600; icon inside a 28px `primary` square (radius 8px) with `on-primary` glyph.
   - Inactive: transparent on `surface`, `on-surface-muted` text; hover `surface-elevated` background and `on-surface` text.
2. **Search input:** 44px, pill, `surface`, 1px `outline`, leading search icon muted, focus ring lime.
3. **Circular icon button:** 44px, pill, `surface`, icon `on-surface`; hover `surface-elevated`.
4. **Primary button:** `primary` / `on-primary`, weight 600, 44px, radius 12px. Copy states the consequence: `Approve save plan — no email sent`. One per view.
5. **Secondary button:** `secondary` / `on-secondary`, 1px `outline`, 44px, radius 12px.
6. **KPI card:**
   - Top row: 36px `icon-housing` (radius 8px) left, ⋯ menu right (only if it has real actions; otherwise omit).
   - Label (`label-md`, muted), then value (`display-number`) with trend pill on the baseline right of it.
   - Microcopy (`label-sm`, muted) names the driver, e.g. `Driven by champion departure in 3 accounts`.
   - Metrics: **Weighted value for priority** (labelled weighted, never "loss"), **Accounts at High or Critical**, **Focus accounts C01–C06 flagged**.
7. **Mini KPI card:** half-width pair, icon housing, label, `display-number-sm` value, trend pill + `vs last week` muted. Used for **Plans in review** and **Median priority score**.
8. **Trend pill:** `trend-up` / `trend-down`, 4px × 6px padding, Lucide trend icon + signed value (`+12.5%`). Meaning never by color alone: icon and sign always present.
9. **Evidence quote card:** `surface`, 1px `outline`, padding 16px, quote in `body-md` italic, call ID chip, timestamp, confidence badge, link to transcript offset.
10. **Graph canvas (`@xyflow/react`):** background `neutral`, nodes as `surface-elevated` cards radius 12px with a 1px `outline` ring (`primary` when selected); type shown by semantic-colored Lucide icon and caps label, never by a thick side stripe. Evidence path edges `primary` 2px, other edges `outline-active` 1px. Keyboard-navigable list alternative always available.

## Do's and Don'ts

### UX Principles (1–9)

| # | Principle | Implementation in Tessera |
|---|---|---|
| 1 | **Design for variation** | Layout handles 1 to 20 evidence items; empty states explain and offer ingest; graph has list fallback. |
| 2 | **Consistency** | One warm graphite palette, one type family, Lucide 1.75px, 16px card radius everywhere. |
| 3 | **Hierarchy** | Priority score and weighted value are the largest numbers; IDs and hashes are small and muted. |
| 4 | **Decision-point information** | Quote span, confidence, timestamp, and actor sit beside every approval. |
| 5 | **Consequences before action** | Approval copy states `no email sent`; merge dialog shows the merged alias result. |
| 6 | **Lower friction** | Approval action stays sticky; renewal-window filter in header; review goes item by item. |
| 7 | **Remove excess** | No notification feed, no settings page, no generic e-commerce charts, no churn probability. |
| 8 | **Premium detail** | Tone-based depth, single olive glow, tabular figures, tinted trend pills. |
| 9 | **Clear but calm primary action** | One lime primary button per view, never oversized. |

### Anti-AI UI Standards (A1–A8)

| Standard | Concrete Implementation |
|---|---|
| **A1 No emoji** | Lucide only, including trend arrows; no emoji or Unicode triangles. |
| **A2 Deliberate palette** | Only tokens in this file; lime appears on the active nav icon, the primary button, positive trends, and data. The logo placeholder uses `primary`, not an off-token orange. |
| **A3 One task per screen** | Accounts ranks; Detail investigates, answers, and drafts; Review decides plans; Data ingests. |
| **A4 Focused navigation** | Four menu items only. Bottom card shows CSM name and data source in text, no avatar portrait. |
| **A5 Tidy density** | Numbers right-aligned and tabular; secondary actions in ⋯ menus; long chips become icon + tooltip. |
| **A6 No dead surfaces** | Header icon buttons appear only on screens where they act; ⋯ menus omitted when empty. |
| **A7 Container fits task** | Full screen for graph exploration; drawer for mobile nav; modal only for merge/reject confirmation. |
| **A8 Rich comparable data** | Paired-arm benchmark table; dual-period risk trend; per-account comparison toggle. |

## Deviations from Reference

| Aspect | InsightX Reference | Tessera | Rationale |
|---|---|---|---|
| **Domain metrics** | Revenue, Active Users, Conversion Rate | Risk-weighted contract value, Accounts above threshold, Signals this week | CSM job; avoids implying certain loss or churn probability (07-RULES §4). |
| **Navigation** | 3 groups, 10 items, Settings | 4 items, no groups, no Settings | PRD §5b and A4. |
| **User dock** | Avatar photo, name, owner ID, ⋯ | Name, role, data source attribution | A4 and CC BY-NC 4.0 attribution. |
| **Logo** | Orange gradient orb | `primary` placeholder | A2; logo not yet designed. |
| **Header actions** | Refresh, calendar, notifications on every page | Per-screen functional buttons only | A6 and PRD (no notification feed). |
| **Breakdown chart** | Revenue by channel | Risk by category (Champion loss, Competitor, Usage drop) | Categories drive save playbooks. |
| **Typeface** | Geometric sans (unverified) | Inter | Density and tabular numbers; revisit in preview pass. |

## Implementation

```sh
npx -p @google/design.md designmd lint docs/08-DESIGN.md
npx -p @google/design.md designmd export --format css-tailwind docs/08-DESIGN.md > frontend/src/app/theme.css
```

Components consume exported variables only; no hex values in component CSS.

## Changelog

| Date | Change |
|---|---|
| 2026-10-09 | Initial hackathon document setup. |
| 2026-10-09 | Redesign to InsightX dark analytics reference. |
| 2026-10-09 | KasirNusa pivot: screens follow PRD §6 (Accounts, Detail with Ask-the-graph, Review save plans with feedback, Data); Benchmark screen removed; product name Tessera. |
| 2026-10-09 | Alignment pass: warm graphite neutrals sampled from the reference, radius 16/12/8, sidebar as floating card, tinted trend pills, olive/lime/sage chart tokens, mini KPI spec; navigation cut to PRD's four screens (no notifications, no settings, no avatar); churn-labelled metrics renamed; `on-danger` fixed from 2.8:1 to 7.3:1. |
