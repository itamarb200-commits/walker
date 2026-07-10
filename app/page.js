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
