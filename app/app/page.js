"use client";

// ─── Main app shell ───────────────────────────────────────────────────────────
// Guards on: signed in (else /auth) + onboarded (else /onboard). Tab state is
// local (today/week/stats), matching Milo's single-page pattern.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sun, CalendarDays, BarChart3, Settings } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { getMyContext } from "@/lib/family";
import { supabaseBrowser } from "@/lib/supabase/client";
import TodayBoard from "@/components/TodayBoard";
import WeekBoard from "@/components/WeekBoard";
import StatsBoard from "@/components/StatsBoard";
import SettingsBoard from "@/components/SettingsBoard";

const TABS = [
  { key: "today", labelKey: "nav.today", Icon: Sun },
  { key: "week", labelKey: "nav.week", Icon: CalendarDays },
  { key: "stats", labelKey: "nav.stats", Icon: BarChart3 },
  { key: "settings", labelKey: "nav.settings", Icon: Settings },
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
    <div className="mx-auto flex min-h-dvh max-w-md flex-col pb-28">
      <main className="flex-1 px-5 pt-8">
        {tab === "today" && <TodayBoard ctx={ctx} />}
        {tab === "week" && <WeekBoard ctx={ctx} />}
        {tab === "stats" && <StatsBoard ctx={ctx} />}
        {tab === "settings" && <SettingsBoard ctx={ctx} />}
      </main>

      {/* Floating pill — an independent "island" detached from the screen
          edge, rather than a bar fused to the bottom of the viewport. */}
      <nav
        className="fixed inset-x-4 z-40 mx-auto flex max-w-[416px] items-center justify-around rounded-pill bg-surface px-2 py-1.5 shadow-float"
        style={{ bottom: "max(env(safe-area-inset-bottom), 16px)" }}
      >
        {TABS.map((tb) => {
          const active = tab === tb.key;
          return (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-pill text-cap font-semibold transition-colors active:scale-[0.97] ${
                active ? "text-accent" : "text-ink2"
              }`}
            >
              <span
                className={`flex h-7 items-center justify-center rounded-pill px-4 transition-colors ${
                  active ? "bg-accent/10" : "bg-transparent"
                }`}
              >
                <tb.Icon size={19} strokeWidth={active ? 2.4 : 2} />
              </span>
              {t(tb.labelKey)}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
