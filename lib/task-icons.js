import { PawPrint, Utensils, Pill, Sparkles } from "lucide-react";

// Maps a task's stored `icon` key (chosen from templates today, a picker in
// Phase 5) to its lucide component. Unknown keys fall back to a generic icon
// rather than crashing — a task should never fail to render.
const ICONS = {
  paw: PawPrint,
  utensils: Utensils,
  pill: Pill,
};

export function TaskIcon({ icon, ...props }) {
  const Cmp = ICONS[icon] || Sparkles;
  return <Cmp {...props} />;
}
