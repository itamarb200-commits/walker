"use client";

// ─── Main app shell ───────────────────────────────────────────────────────────
// Guards on: signed in (else /auth) + onboarded (else /onboard). Tab state is
// local (today/week/stats), matching Milo's single-page pattern. Week board
// and Statistics are built in Phase 3 — today they're friendly placeholders.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, BarChart3 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getMyContext } from "@/lib/family";
import { supabaseBrowser } from "@/lib/supabase/client";
import TodayBoard from "@/components/TodayBoard";
import WeekBoard from "@/components/WeekBoard";
import StatsBoard from "@/components/StatsBoard";

const TABS = [
  { key: "today", labelKey: "nav.today", Icon: null },
  { key: "week", labelKey: "nav.week", Icon: CalendarDays },
  { key: "stats", labelKey: "nav.stats", Icon: BarChart3 },
];

export default function AppHome() {
  const router = useRouter();
  const { t } = useI18n();
  const [ctx, setCtx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("today");

  const load = useCallback(async () => {
    const { data: { user } } = await supabaseBrowser().auth.getUser();
    if (!user) {
      router.push("/auth");
      return;
    }
    const context = await getMyContext();
    if (!context) {
      router.push("/onboard");
      return;
    }
    setCtx(context);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="loader" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col pb-24">
      <main className="flex-1 px-5 pt-8">
        {tab === "today" && <TodayBoard ctx={ctx} />}
        {tab === "week" && <WeekBoard ctx={ctx} />}
        {tab === "stats" && <StatsBoard ctx={ctx} />}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md items-center justify-around border-t border-line bg-surface/95 px-4 pb-safe-b pt-2 backdrop-blur-md">
        {TABS.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-btn text-cap font-semibold transition-colors ${
              tab === tb.key ? "text-accent" : "text-ink2"
            }`}
          >
            {t(tb.labelKey)}
          </button>
        ))}
      </nav>
    </div>
  );
}
