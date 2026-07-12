"use client";

// ─── Statistics — per-person tally + recent history ───────────────────────────
// Help entries count toward the family total just like a regular log (the
// same fix Milo needed: parent help was invisible in stats before). Only the
// fairness *recommendation* on the today/week boards ignores help entries.

import { useCallback, useEffect, useState } from "react";
import { Crown } from "lucide-react";
import { dateKey, weekDays, fetchRangeBoard } from "@/lib/family";
import { personBg } from "@/lib/person-colors";
import { useI18n } from "@/lib/i18n";

const RANGE_KEYS = ["week", "month", "all"];

function rangeDates(range) {
  const today = new Date();
  if (range === "week") {
    const days = weekDays(0);
    return { start: dateKey(days[0]), end: dateKey(days[6]) };
  }
  if (range === "month") {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    const last = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { start: dateKey(first), end: dateKey(last) };
  }
  return { start: "1970-01-01", end: dateKey(today) };
}

export default function StatsBoard({ ctx }) {
  const { t } = useI18n();
  const [range, setRange] = useState("week");
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    const { start, end } = rangeDates(range);
    const board = await fetchRangeBoard(ctx.familyId, start, end);
    setData(board);
  }, [ctx.familyId, range]);

  useEffect(() => {
    load();
  }, [load]);

  if (!data) {
    return (
      <div className="flex justify-center pt-24">
        <div className="loader" />
      </div>
    );
  }

  const tasksById = new Map(data.tasks.map((t) => [t.id, t]));
  const tally = new Map(data.persons.map((p) => [p.id, 0]));
  for (const log of data.logs) {
    if (tally.has(log.person_id)) tally.set(log.person_id, tally.get(log.person_id) + 1);
  }
  const maxCount = Math.max(1, ...tally.values());

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-h1">{t("nav.stats")}</h1>
        <div className="flex gap-1 rounded-pill bg-surface2 p-1">
          {RANGE_KEYS.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-pill px-3 py-1.5 text-cap font-semibold transition-colors ${
                range === r ? "bg-accent text-accent-fg" : "text-ink2"
              }`}
            >
              {t(`stats.range.${r}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Tally bars */}
      <div className="rounded-card bg-surface p-5 shadow-card">
        <p className="mb-4 text-cap font-semibold text-ink2">
          {t("stats.tally", { range: t(`stats.range.${range}`) })}
        </p>
        <div className="space-y-3">
          {data.persons.map((person) => {
            const count = tally.get(person.id) || 0;
            const isLeader = count > 0 && count === maxCount;
            return (
              <div key={person.id} className="flex items-center gap-3">
                <span className="flex w-20 shrink-0 items-center gap-1 text-sub font-semibold text-ink">
                  {/* One earned golden moment: the range leader wears the crown */}
                  {isLeader && <Crown size={14} className="shrink-0 fill-highlight text-highlight" aria-label={t("stats.leader")} />}
                  <span className="truncate">{person.name}</span>
                </span>
                <div className="h-6 flex-1 overflow-hidden rounded-pill bg-surface2">
                  <div
                    className={`h-full rounded-pill ${personBg(person.color_idx)} transition-[width] duration-300 ease-out`}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-end text-sub font-bold tabular-nums text-ink anim-count-pop" key={count}>
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent history */}
      <div className="rounded-card bg-surface p-5 shadow-card">
        <p className="mb-3 text-cap font-semibold text-ink2">{t("stats.history")}</p>
        {data.logs.length === 0 ? (
          <p className="py-6 text-center text-sub text-ink2">{t("stats.empty")}</p>
        ) : (
          <div className="space-y-2">
            {data.logs.slice(0, 25).map((log) => {
              const person = data.persons.find((p) => p.id === log.person_id);
              const task = tasksById.get(log.task_id);
              if (!person || !task) return null;
              return (
                <div key={log.id} className="flex items-center justify-between border-b border-line pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${personBg(person.color_idx)}`} />
                    <span className="text-sub text-ink">
                      {person.name} · {log.is_help ? t("stats.help") : ""}
                      {task.label}
                      {log.slot_time ? ` · ${log.slot_time}` : ""}
                    </span>
                  </div>
                  <span className="text-cap text-ink2">{log.local_date}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
