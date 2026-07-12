"use client";

// ─── Landing — pre-auth entry point ──────────────────────────────────────────
// Shown to signed-out visitors. A returning signed-in user is bounced
// straight to /app (or /onboard if they never finished the wizard) so "/"
// never shows stale marketing copy to someone already using the product.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { PawPrint, Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { supabaseBrowser } from "@/lib/supabase/client";

const EASE = [0.23, 1, 0.32, 1];

// A trail of paw prints "walking" diagonally across the hero, in the brand
// color at whisper opacity. Alternating step offsets + rotation read as a
// real walk, not a wallpaper grid.
function PawTrail() {
  const steps = [
    { x: 305, y: 640, r: -24 },
    { x: 255, y: 560, r: -18 },
    { x: 295, y: 480, r: -26 },
    { x: 240, y: 400, r: -14 },
    { x: 285, y: 320, r: -22 },
    { x: 225, y: 240, r: -10 },
    { x: 265, y: 160, r: -20 },
    { x: 205, y: 85, r: -8 },
  ];
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full text-accent opacity-[0.07]"
      viewBox="0 0 375 720"
      fill="currentColor"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <g id="paw">
          <ellipse cx="0" cy="7" rx="8" ry="10" />
          <circle cx="-9.5" cy="-5" r="4" />
          <circle cx="-3.5" cy="-10" r="4" />
          <circle cx="3.5" cy="-10" r="4" />
          <circle cx="9.5" cy="-5" r="4" />
        </g>
      </defs>
      {steps.map((s, i) => (
        <use key={i} href="#paw" transform={`translate(${s.x} ${s.y}) rotate(${s.r}) scale(1.15)`} />
      ))}
    </svg>
  );
}

export default function Landing() {
  const { t, locale, setLocale } = useI18n();
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const redirectIfSignedIn = async () => {
      const { data: { user } } = await supabaseBrowser().auth.getUser();
      if (!user) {
        setChecked(true);
        return;
      }
      const { data: person } = await supabaseBrowser()
        .from("persons")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      router.push(person ? "/app" : "/onboard");
    };
    redirectIfSignedIn();
  }, [router]);

  if (!checked) return null;

  const entrance = (delay) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, ease: EASE, delay },
        };

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 overflow-hidden px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-10">
      <PawTrail />

      {/* Locale switch */}
      <motion.button
        {...entrance(0)}
        onClick={() => setLocale(locale === "he" ? "en" : "he")}
        className="flex min-h-[44px] items-center gap-2 self-end rounded-pill bg-surface px-4 py-2 text-sub font-semibold text-ink2 shadow-card cursor-pointer
                   transition-transform duration-150 ease-out active:scale-[0.97] hover:text-ink"
      >
        <Globe size={16} aria-hidden="true" />
        {t("locale.switch")}
      </motion.button>

      {/* Hero */}
      <motion.div {...entrance(0.05)} className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-tile bg-accent text-accent-fg shadow-float">
          <PawPrint size={40} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <h1 className="text-display">{t("app.name")}</h1>
        <p className="text-body text-ink2">{t("landing.pitch")}</p>
      </motion.div>

      {/* CTAs — route to auth (choice made in onboarding wizard) */}
      <motion.div {...entrance(0.12)} className="flex w-full">
        <a
          href="/auth"
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-btn bg-accent text-body font-bold text-accent-fg shadow-card cursor-pointer
                     transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          <PawPrint size={20} aria-hidden="true" />
          {t("landing.cta.start")}
        </a>
      </motion.div>
    </div>
  );
}
