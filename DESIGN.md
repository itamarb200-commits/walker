# Walker — Design System: "Hearth"

Warm & family. The register is **product** (design serves the task): consistent,
fast, familiar — with earned moments of warmth, never decoration.

## Voice

- **Anchors:** Headspace's warmth, Things 3's clarity, Apple Home's tiles.
- **Scene:** a parent checks before work in morning light; a kid taps after the
  afternoon walk; everyone glances from the couch at night. Light theme is the
  default; dark flips automatically with the device (`prefers-color-scheme`).
- **Color strategy:** Restrained inside the app (accent = actions, selection,
  state only). Committed on the landing page and onboarding.
- The background is a clean near-white — **never cream/beige**. Warmth comes
  from the coral accent, the golden highlight, and the card tints.

## Tokens (defined in `app/globals.css`, mapped in `tailwind.config.js`)

All colors are RGB triplets in CSS vars so Tailwind alpha modifiers work
(`bg-accent/12`). Dark mode overrides the vars in a `prefers-color-scheme`
media query — **components never use `dark:` variants.**

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | #FAFAF9 | #1B1917 espresso | page background |
| `surface` | #FFFFFF | #26221F | cards |
| `surface2` | #F2EFEC | #332E2A | wells, idle chips |
| `ink` / `ink2` | #292524 / #69625B | #F2EFEC / #A8A19A | text |
| `accent` (+`accent-fg`) | #CE442D coral (white text ≥4.7:1) | #F0785C (fg: deep brown) | CTAs, nav, selection, state |
| `highlight` (+`highlight-fg`) | #F0B429 golden | #F7C948 | **earned** moments only: all-done counter, stats crown |
| `success` / `danger` | warm green / crimson | brightened | status; danger is deeper than accent so they never read alike |
| `line` / `scrim` / `knob` | ink 10% / ink 50% / white | white 10% / black 60% / white | hairlines, sheet backdrop, switch knob |
| `on-pal` | white | near-black (#1B1917) | text on a **filled** person pill — flips per theme so the name always clears 4.5:1 |
| `pal-1..8` | 8 warm-harmonized hues (≥4.5:1 as text on surface) | brightened for dark-surface legibility | per-person colors, assigned by join index |
| `c-yellow…c-peach` | warm pastels | deep muted tints | Today card tints |

Person colors go through `lib/person-colors.js` (literal class lookups —
Tailwind JIT can't see template strings): `personBg/BgSoft/Text/Border/Ring`.

## Typography

**Rubik** (variable, hebrew+latin) via `next/font` → `--font-rubik` → `font-sans`.
One family for everything. Fixed rem-ish scale, no negative tracking (cramps
Hebrew): `cap 13.5 · sub 15 · body 17 · h2 22/600 · h1 28/700 · display 36/700`.

## Shape & elevation

- Radius tokens only: `rounded-card 28` (cards) · `rounded-tile 24` (hero/icon
  tiles, choice cards) · `rounded-btn 18` (buttons, inputs, wells) ·
  `rounded-pill` (chips, segments, counters).
- Shadows: `shadow-card` / `shadow-float` (CSS vars, theme-aware). No borders +
  shadow together except hairline `border-line` where separation is needed.

## Motion

- Press feedback everywhere: `active:scale-[0.97]` — one value, one voice.
- Entrances: `anim-entry` (fade-up 320ms) / tab crossfade 180ms, ease
  `cubic-bezier(0.23,1,0.32,1)`. Sheets: motion spring (duration .45, bounce .18).
- Never `transition-all`; name the properties. `prefers-reduced-motion` zeroes
  everything globally (plus `useReducedMotion()` gates JS animations).

## Component vocabulary

- **Chips (people):** solid `personBg + text-knob` = done · soft
  `personBgSoft + personText + ring personRing` = recommended · `surface2 +
  ink2` = idle. Check icon on done, never a "✓ " string.
- **Icons:** lucide only, stroke 2–2.4. No emoji as UI controls (emoji OK as
  content, e.g. species labels).
- **Progress counter** (Today cards): `n/m` pill, flips to
  `highlight/highlight-fg` + Check when complete.
- **Bottom nav:** icon above label, active = accent text + `bg-accent/12` pill.
- **Sheets:** grabber handle, `bg-scrim` backdrop, `rounded-t-card`.
- **Empty states teach** — icon tile + one-line hint where to go next.
- **Danger zone:** destructive buttons are `danger` tinted (`bg-danger/5
  border-danger/25`) and separated from safe actions.

## Bans

Side-stripe borders · gradient text · glassmorphism-as-default · display fonts
in UI · decorative motion · heavy color on inactive states · `transition-all` ·
hardcoded colors that bypass tokens (`bg-white`, `bg-black/50` — use `knob`,
`scrim`).
