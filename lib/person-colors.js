// Explicit class lookups keyed by color_idx (1-8) — Tailwind's JIT compiler
// only picks up class names it can see literally in source, so a template
// string like `bg-pal-${idx}` would silently fail to generate any CSS.
const BG = {
  1: "bg-pal-1", 2: "bg-pal-2", 3: "bg-pal-3", 4: "bg-pal-4",
  5: "bg-pal-5", 6: "bg-pal-6", 7: "bg-pal-7", 8: "bg-pal-8",
};
const BG_SOFT = {
  1: "bg-pal-1/12", 2: "bg-pal-2/12", 3: "bg-pal-3/12", 4: "bg-pal-4/12",
  5: "bg-pal-5/12", 6: "bg-pal-6/12", 7: "bg-pal-7/12", 8: "bg-pal-8/12",
};
const TEXT = {
  1: "text-pal-1", 2: "text-pal-2", 3: "text-pal-3", 4: "text-pal-4",
  5: "text-pal-5", 6: "text-pal-6", 7: "text-pal-7", 8: "text-pal-8",
};
const BORDER = {
  1: "border-pal-1", 2: "border-pal-2", 3: "border-pal-3", 4: "border-pal-4",
  5: "border-pal-5", 6: "border-pal-6", 7: "border-pal-7", 8: "border-pal-8",
};

const clamp = (idx) => (((idx - 1) % 8 + 8) % 8) + 1;

export const personBg = (idx) => BG[clamp(idx)];
export const personBgSoft = (idx) => BG_SOFT[clamp(idx)];
export const personText = (idx) => TEXT[clamp(idx)];
export const personBorder = (idx) => BORDER[clamp(idx)];
