# Walker — Design System: "Gouache"

Painted paper. The register is **product** (design serves the task): consistent,
fast, familiar — but the color is committed, not decorative: task cards ARE
full saturated paint fields, laid on a quiet paper canvas like hand-cut
gouache shapes.

## Voice

- **Anchors:** Matisse paper cutouts, printed gouache posters, Things 3's clarity.
- **Scene:** a parent checks before work in morning light; a kid taps after the
  afternoon walk; everyone glances from the couch at night. Light = paper in
  daylight; dark = the same painted paper on a dark table under lamplight
  (`prefers-color-scheme`, automatic).
- **Color strategy:** Committed on the boards (fields carry 40–60% of the
  Today screen); chrome (nav, settings, forms) stays restrained ink + cobalt.
- The canvas is a **chroma-zero neutral paper** — never cream/beige. All the
  warmth and life lives in the paint fields.

## Tokens (defined in `app/globals.css`, mapped in `tailwind.config.js`)

All colors are RGB triplets in CSS vars so Tailwind alpha modifiers work
(`bg-accent/12`). Dark mode overrides the vars in a `prefers-color-scheme`
media query — **components never use `dark:` variants.**

| Token | Light | Dark | Use |
|---|---|---|---|
| `bg` | #F4F4F1 neutral paper | #151420 ink-navy table | page background |
| `surface` | #FFFFFF | #1F1E2E | cards |
| `surface2` | #E9E9E4 | #2C2B3E | wells, idle chips |
| `ink` / `ink2` | #252336 ink-indigo / #68667C | #EFEEE8 paper / #A8A6BA | text |
| `accent` (+`accent-fg`) | #2A57C7 cobalt (white ≥5.4:1) | #7C9CF5 (fg: deep navy) | CTAs, nav pill, selection, state |
| `highlight` (+`highlight-fg`) | #F2B90D sunflower | #F7C948 | **earned** moments only: all-done counter, stats crown |
| `success` / `danger` | green / crimson | brightened | status |
| `line` / `scrim` / `knob` | ink 10% / ink-navy 50% / white | white 10% / black 60% / white | hairlines, backdrops, switch knob |
| `on-pal` | white | ink-navy | text on a filled person pill |
| `well` | white | ink-navy | translucent wells laid **on** fields (`bg-well/85`) |
| `pal-1..8` | 8 gouache hues (≥4.5:1 as text on surface) | brightened | per-person colors, by join index |
| `c-yellow…c-peach` | soft paper tints | deep muted | quiet chart/chip backgrounds only |

### Gouache fields (`--f1..--f6` + `.field-N` classes)

The Today cards' paint. A card gets `field field-N`; the class sets the paint
(`--f`) **and** its matching foreground (`--f-fg`) — ink type on bright paints
(sunflower, tangerine, flamingo), paper type on deep paints (kelly, cobalt,
plum). Children use `text-f-fg` and `bg-well/85`. Dark mode keeps the fields
saturated (cutouts under lamplight) and flips the wells to ink-navy glass.

Order on the Today board: cobalt leads (signature), then sunflower, flamingo,
kelly, tangerine, plum — warm/cool alternation keeps neighbors distinct.

Person colors go through `lib/person-colors.js` (literal class lookups —
Tailwind JIT can't see template strings).

## Typography

**Rubik** (variable, hebrew+latin) via `next/font` → `--font-rubik` → `font-sans`.
One family for everything. Fixed scale, no negative tracking (cramps Hebrew):
`cap 13.5 · sub 15 · body 17 · h2 22/600 · h1 28/800 · display 36/800`.
The Today greeting uses `display` — the one big-type moment per screen.

## Shape & elevation

- Radius tokens: `rounded-card 28` · `rounded-tile 24` · `rounded-btn 18` ·
  `rounded-pill`. Plus the **blob** (`.blob`, `.blob-2`): an organic hand-cut
  border-radius for icon tiles, the logo mark, and settings section badges —
  the system's signature shape. One blob per composition zone, never a wall
  of blobs.
- Shadows: `shadow-card` / `shadow-float` (ink-tinted CSS vars). No borders +
  shadow together except hairline `border-line`.
- **Paper grain:** one fixed `body::after` overlay (SVG turbulence tile,
  opacity 4–5%, multiply/soft-light). Material, not noise.

## Motion

- Press feedback everywhere: `active:scale-[0.97]` — one value, one voice.
- Entrances: `anim-entry` (fade-up 320ms) / tab crossfade, ease
  `cubic-bezier(0.23,1,0.32,1)`. Sheets: motion spring (duration .45, bounce .18).
- Never `transition-all`; name the properties. `prefers-reduced-motion` zeroes
  everything globally (plus `useReducedMotion()` gates JS animations).

## Component vocabulary

- **Task cards (Today):** `field field-N rounded-card` — full paint, blob icon
  tile (`bg-well/25`), `text-f-fg` title, slots as `bg-well/85` wells.
- **Chips (people):** solid `personBg + text-on-pal` = done · soft
  `personBgSoft + personText + ring personRing` = recommended · `surface2 +
  ink2` = idle. Check icon on done.
- **Bottom nav:** the **ink island** — `bg-ink` bar (inverts with the theme:
  ink bar on paper / paper bar on dark table), active tab = filled `accent`
  pill, inactive = `text-bg/60`.
- **Icons:** lucide only, stroke 2–2.4. No emoji as UI controls.
- **Progress counter:** `n/m` pill on the field (`bg-well/25 text-f-fg`), flips
  to `highlight/highlight-fg` + Check when complete.
- **Sheets:** grabber handle, `bg-scrim` backdrop, `rounded-t-card`.
- **Settings sections:** blob icon badge (accent / pal tints) + h2.
- **Landing hero:** three gouache cutout blobs (f1/f3/f4 at 13–16% opacity)
  behind a cobalt blob logo mark; committed color, type stays fully readable.
- **Empty states teach** — icon tile + one-line hint where to go next.
- **Danger zone:** destructive buttons are `danger` tinted and separated.

## Bans

Side-stripe borders · gradient text · glassmorphism-as-default · display fonts
in UI · decorative motion · heavy color on inactive states · `transition-all` ·
hardcoded colors that bypass tokens (`bg-white`, `bg-black/50` — use `well`,
`knob`, `scrim`) · cream/beige canvas · blobs on more than one element per
composition zone.
