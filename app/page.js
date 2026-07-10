"use client";

// ─── Landing — pre-auth entry point ──────────────────────────────────────────
// Phase 0 placeholder: shows the design system + locale switch. The two CTAs
// will route into the auth + onboarding flow in Phase 1.

import { motion, useReducedMotion } from "motion/react";
import { PawPrint, Users, Globe } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

const EASE = [0.23, 1, 0.32, 1];

export default function Landing() {
  const { t, locale, setLocale } = useI18n();
  const reduceMotion = useReducedMotion();

  const entrance = (delay) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 14 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, ease: EASE, delay },
        };

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 pb-[max(env(safe-area-inset-bottom),24px)] pt-10">
      {/* Locale switch */}
      <motion.button
        {...entrance(0)}
        onClick={() => setLocale(locale === "he" ? "en" : "he")}
        className="flex min-h-[44px] items-center gap-2 self-end rounded-pill bg-surface px-4 py-2 text-sub font-semibold text-ink2 shadow-card cursor-pointer
                   transition-transform duration-150 ease-out active:scale-[0.96] hover:text-ink"
      >
        <Globe size={16} aria-hidden="true" />
        {t("locale.switch")}
      </motion.button>

      {/* Hero */}
      <motion.div {...entrance(0.05)} className="flex flex-col items-center gap-3 text-center">
        <span className="flex h-20 w-20 items-center justify-center rounded-[24px] bg-accent text-accent-fg shadow-float">
          <PawPrint size={40} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <h1 className="text-display">{t("app.name")}</h1>
        <p className="text-body text-ink2">{t("landing.pitch")}</p>
      </motion.div>

      {/* CTAs — wired to onboarding in Phase 1 */}
      <motion.div {...entrance(0.12)} className="flex w-full flex-col gap-2.5">
        <button
          onClick={() => toast(t("common.loading"))}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-btn bg-accent text-body font-bold text-accent-fg shadow-card cursor-pointer
                     transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          <PawPrint size={20} aria-hidden="true" />
          {t("landing.cta.start")}
        </button>
        <button
          onClick={() => toast(t("common.loading"))}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-btn bg-surface text-body font-semibold text-ink shadow-card cursor-pointer
                     transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          <Users size={20} aria-hidden="true" />
          {t("landing.cta.join")}
        </button>
      </motion.div>
    </div>
  );
}
