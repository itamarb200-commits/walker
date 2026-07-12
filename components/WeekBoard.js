"use client";

// ─── Week board — every task×time cell, any person, any (past/today) day ─────
// Learned from Milo's WeekBoard bug: cycling only through a slot's "eligible"
// pair blocked legitimate reassignment and had no delete. Here every cell
// opens a picker listing the whole family, plus a clear button — from day one.

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ChevronRight, ChevronLeft, X, Eraser } from "lucide-react";
import { toast } from "sonner";
import { dateKey, weekDays, fetchRangeBoard, toggleLog, deleteLog } from "@/lib/family";
import { TaskIcon } from "@/lib/task-icons";
import { personBg } from "@/lib/person-colors";
import { useI18n } from "@/lib/i18n";

const DAY_LETTERS = ["א'", "ב'", "ג'", "ד'", "ה'", "ו'", "ש'"];
const SHEET_SPRING = { type: "spring", duration: 0.45, bounce: 0.18 };

// Flatten tasks into one row per (task, time) — a task with 3 daily times
// becomes 3 rows, each independently assignable.
function taskRows(tasks) {
  return tasks.flatMap((task) =>
    (task.times.length > 0 ? task.times : [null]).map((slotTime) => ({ task, slotTime }))
  );
}

export default function WeekBoard({ ctx }) {
  const { t } = useI18n();
  const [offset, setOffset] = useState(0);
  const [data, setData] = useState(null);
  const [picker, setPicker] = useState(null); // { row, day }
  const reduceMotion = useReducedMotion();

  const days = weekDays(offset);
  const start = dateKey(days[0]);
  const end = dateKey(days[6]);
  const today = dateKey(new Date());

  const load = useCallback(async () => {
    const board = await fetchRangeBoard(ctx.familyId, start, end);
    setData(board);
  }, [ctx.familyId, start, end]);

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

  const personById = new Map(data.persons.map((p) => [p.id, p]));
  const rows = taskRows(data.tasks);

  const entryFor = (row, day) =>
    data.logs.find(
      (l) => l.task_id === row.task.id && l.slot_time === row.slotTime && l.local_date === dateKey(day) && !l.is_help
    );

  const pick = async (personId) => {
    if (!picker) return;
    try {
      await toggleLog({
        task: picker.row.task,
        slotTime: picker.row.slotTime,
        personId,
        familyId: ctx.familyId,
        localDate: dateKey(picker.day),
      });
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPicker(null);
    }
  };

  const clearEntry = async () => {
    if (!picker) return;
    const existing = entryFor(picker.row, picker.day);
    if (!existing) return;
    try {
      await deleteLog(existing.id);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPicker(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setOffset((o) => o - 1)} className="rounded-btn p-2 text-ink2 active:scale-[0.97]">
          <ChevronRight size={20} />
        </button>
        <h1 className="text-h2">
          {offset === 0 ? t("week.title") : offset > 0 ? t("week.future", { n: offset }) : t("week.past", { n: -offset })}
        </h1>
        <button onClick={() => setOffset((o) => o + 1)} className="rounded-btn p-2 text-ink2 active:scale-[0.97]">
          <ChevronLeft size={20} />
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="pt-16 text-center text-body text-ink2">{t("week.empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-card bg-surface shadow-card">
          <table className="w-full min-w-[560px] border-collapse text-cap">
            <thead>
              <tr>
                <th className="w-28 p-2 text-start" />
                {days.map((day) => {
                  const isToday = dateKey(day) === today;
                  return (
                    <th
                      key={day.toISOString()}
                      className={`p-2 text-center font-semibold ${
                        isToday ? "rounded-t-btn bg-accent/5 text-accent" : "text-ink2"
                      }`}
                    >
                      {DAY_LETTERS[day.getDay()]} {day.getDate()}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={`${row.task.id}:${row.slotTime}`} className="border-t border-line">
                  <td className="p-2 text-start">
                    <div className="flex items-center gap-1.5">
                      <TaskIcon icon={row.task.icon} size={14} className="shrink-0 text-ink2" />
                      <div className="leading-tight">
                        <div className="font-semibold text-ink">{row.task.label}</div>
                        {row.slotTime && <div className="text-ink2">{row.slotTime}</div>}
                      </div>
                    </div>
                  </td>
                  {days.map((day) => {
                    const entry = entryFor(row, day);
                    const person = entry ? personById.get(entry.person_id) : null;
                    const isFuture = dateKey(day) > today;
                    const isToday = dateKey(day) === today;
                    return (
                      <td key={day.toISOString()} className={`p-1.5 text-center ${isToday ? "bg-accent/5" : ""}`}>
                        <button
                          disabled={isFuture}
                          onClick={() => setPicker({ row, day })}
                          aria-label={`${row.task.label} ${DAY_LETTERS[day.getDay()]}: ${person ? person.name : t("week.unassigned")}`}
                          className={`flex min-h-[44px] w-full items-center justify-center rounded-btn text-cap font-semibold transition-transform active:scale-[0.97]
                            ${isFuture ? "cursor-default opacity-30" : ""}
                            ${person ? `${personBg(person.color_idx)} text-knob` : "bg-surface2 text-ink2"}`}
                        >
                          {person ? person.name : "—"}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {picker && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={picker.row.task.label}
            className="fixed inset-0 z-50 flex items-end justify-center bg-scrim backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.14 } }}
            onClick={() => setPicker(null)}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-card bg-surface p-5 pb-safe-b shadow-float"
              initial={reduceMotion ? false : { y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%", transition: { duration: 0.18 } }}
              transition={SHEET_SPRING}
            >
              <div className="mx-auto mb-3 h-1 w-10 rounded-pill bg-ink/15" aria-hidden="true" />
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-h2">{picker.row.task.label}</h2>
                  <p className="text-cap text-ink2">
                    {DAY_LETTERS[picker.day.getDay()]} {picker.day.getDate()}
                    {picker.row.slotTime ? ` · ${picker.row.slotTime}` : ""}
                  </p>
                </div>
                <button onClick={() => setPicker(null)} aria-label={t("common.close")} className="rounded-btn p-2 text-ink2 active:scale-[0.97]">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {data.persons.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => pick(person.id)}
                    className={`flex min-h-[48px] items-center justify-center gap-2 rounded-btn text-body font-semibold text-knob transition-transform active:scale-[0.97] ${personBg(person.color_idx)}`}
                  >
                    {person.name}
                  </button>
                ))}
              </div>

              <button
                onClick={clearEntry}
                disabled={!entryFor(picker.row, picker.day)}
                className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-btn border border-line text-body font-semibold text-danger
                           disabled:opacity-40 active:scale-[0.97]"
              >
                <Eraser size={16} />
                {t("week.clear")}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
