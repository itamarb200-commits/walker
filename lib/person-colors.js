// Explicit class lookups keyed by color_idx (1-8) — Tailwind's JIT compiler
// only picks up class names it can see literally in source, so a template
// string like `bg-pal-${idx}` would silently fail to generate any CSS.
const BG = {
  1: "bg-pal-1", 2: "bg-pal-2", 3: "bg-pal-3", 4: "bg-pal-4",
  5: "bg-pal-5", 6: "bg-pal-6", 7: "bg-pal-7", 8: "bg-pal-8",
};
const BG_SOFT = {
  1: "bg-pal-1/10", 2: "bg-pal-2/10", 3: "bg-pal-3/10", 4: "bg-pal-4/10",
  5: "bg-pal-5/10", 6: "bg-pal-6/10", 7: "bg-pal-7/10", 8: "bg-pal-8/10",
};
const TEXT = {
  1: "text-pal-1", 2: "text-pal-2", 3: "text-pal-3", 4: "text-pal-4",
  5: "text-pal-5", 6: "text-pal-6", 7: "text-pal-7", 8: "text-pal-8",
};
const BORDER = {
  1: "border-pal-1", 2: "border-pal-2", 3: "border-pal-3", 4: "border-pal-4",
  5: "border-pal-5", 6: "border-pal-6", 7: "border-pal-7", 8: "border-pal-8",
};
const RING = {
  1: "ring-pal-1", 2: "ring-pal-2", 3: "ring-pal-3", 4: "ring-pal-4",
  5: "ring-pal-5", 6: "ring-pal-6", 7: "ring-pal-7", 8: "ring-pal-8",
};

const clamp = (idx) => (((idx - 1) % 8 + 8) % 8) + 1;

export const personBg = (idx) => BG[clamp(idx)];
export const personBgSoft = (idx) => BG_SOFT[clamp(idx)];
export const personText = (idx) => TEXT[clamp(idx)];
export const personBorder = (idx) => BORDER[clamp(idx)];
export const personRing = (idx) => RING[clamp(idx)];
