"use client";

// ─── Today board — one dynamic card per family task ───────────────────────────
// Replaces Milo's hardcoded TodaySlots: cards, times and eligible people all
// come from the `tasks` table, so this renders correctly for any family's
// configuration (3 walks + 2 feeds, or 1 walk + meds, or anything else).

import { useCallback, useEffect, useState } from "react";
import { Check, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { fetchFamilyBoard, recommendPerson, toggleLog } from "@/lib/family";
import { TaskIcon } from "@/lib/task-icons";
import { personBg, personBgSoft, personRing, personText } from "@/lib/person-colors";
import { useI18n } from "@/lib/i18n";

// Gouache fields — each task card is a full painted color surface. Cobalt
// leads (the signature), then the warm/cool alternation keeps neighbors
// distinct even for color-blind users (paired with the task icon).
const CARD_FIELDS = ["field-5", "field-1", "field-3", "field-4", "field-2", "field-6"];

// A small personal touch (Apple Watch's "Good Evening"): the family checks
// this screen at different points across the day, so greet accordingly.
function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 12) return "today.greeting.morning";
  if (hour < 18) return "today.greeting.afternoon";
  return "today.greeting.evening";
}

export default function TodayBoard({ ctx }) {
  const { t } = useI18n();
  const [board, setBoard] = useState(null);
  const [pending, setPending] = useState(null); // `${taskId}:${slotTime}` while a tap is in flight

  const load = useCallback(async () => {
    const data = await fetchFamilyBoard(ctx.familyId);
    setBoard(data);
  }, [ctx.familyId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleTap = async (task, slotTime, personId) => {
    const key = `${task.id}:${slotTime}`;
    setPending(key);
    try {
      await toggleLog({ task, slotTime, personId, familyId: ctx.familyId });
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setPending(null);
    }
  };

  if (!board) {
    return (
      <div className="flex justify-center pt-24">
        <div className="loader" />
      </div>
    );
  }

  if (board.tasks.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 pt-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-tile bg-accent/10 text-accent">
          <ClipboardList size={26} />
        </div>
        <p className="text-body font-semibold">{t("today.empty")}</p>
        <p className="max-w-[26ch] text-sub text-ink2">{t("today.emptyHint")}</p>
      </div>
    );
  }

  const personById = new Map(board.persons.map((p) => [p.id, p]));

  return (
    <div className="space-y-4">
      <h1 className="text-display">{t(greetingKey())}</h1>
      {board.tasks.map((task, idx) => {
        const field = CARD_FIELDS[idx % CARD_FIELDS.length];
        const eligible = task.eligible_ids.map((id) => personById.get(id)).filter(Boolean);
        const recommendedId = recommendPerson(task, board.recentLogs);

        const slots = task.times.length > 0 ? task.times : [null];
        const doneCount = slots.filter((slotTime) =>
          board.logsToday.some(
            (l) => l.task_id === task.id && l.slot_time === slotTime && !l.is_help
          )
        ).length;
        const allDone = doneCount === slots.length;

        return (
          <div key={task.id} className={`field ${field} rounded-card p-5 shadow-card`}>
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {/* Hand-cut paper blob behind the icon — the field's one flourish */}
                <span className="blob flex h-10 w-10 shrink-0 items-center justify-center bg-well/25">
                  <TaskIcon icon={task.icon} size={20} className="text-f-fg" />
                </span>
                <h2 className="text-h2 text-f-fg">{task.label}</h2>
              </div>
              {/* Progress counter — turns golden when the day's slots are all done */}
              <span
                className={`flex min-h-[26px] items-center gap-1 rounded-pill px-2.5 text-cap font-bold tabular-nums transition-colors ${
                  allDone ? "bg-highlight text-highlight-fg" : "bg-well/25 text-f-fg"
                }`}
              >
                {allDone && <Check size={13} strokeWidth={3} />}
                {doneCount}/{slots.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {slots.map((slotTime) => {
                const entry = board.logsToday.find(
                  (l) => l.task_id === task.id && l.slot_time === slotTime && !l.is_help
                );
                const doneBy = entry ? personById.get(entry.person_id) : null;
                const key = `${task.id}:${slotTime}`;
                const isPending = pending === key;

                return (
                  <div key={key} className="rounded-btn bg-well/85 p-3">
                    {slotTime && (
                      <div className="mb-2 text-cap font-semibold text-ink2">{slotTime}</div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {eligible.map((person) => {
                        const isDone = doneBy?.id === person.id;
                        const isRecommended = !doneBy && person.id === recommendedId;
                        return (
                          <button
                            key={person.id}
                            onClick={() => handleTap(task, slotTime, person.id)}
                            disabled={isPending || (doneBy && !isDone)}
                            aria-pressed={isDone}
                            className={`flex min-h-[40px] items-center gap-1.5 rounded-pill px-3.5 text-sub font-semibold transition active:scale-[0.97]
                              disabled:cursor-default
                              ${
                                isDone
                                  ? `${personBg(person.color_idx)} text-on-pal`
                                  : doneBy
                                  ? "bg-surface2 text-ink2/50"
                                  : isRecommended
                                  ? `${personBgSoft(person.color_idx)} ${personText(person.color_idx)} ring-2 ring-inset ${personRing(person.color_idx)}`
                                  : "bg-surface2 text-ink2"
                              }`}
                          >
                            {isDone && <Check size={14} strokeWidth={3} />}
                            {person.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
