"use client";

// ─── Today board — one dynamic card per family task ───────────────────────────
// Replaces Milo's hardcoded TodaySlots: cards, times and eligible people all
// come from the `tasks` table, so this renders correctly for any family's
// configuration (3 walks + 2 feeds, or 1 walk + meds, or anything else).

import { useCallback, useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { fetchFamilyBoard, recommendPerson, toggleLog } from "@/lib/family";
import { TaskIcon } from "@/lib/task-icons";
import { personBg, personBgSoft, personBorder, personText } from "@/lib/person-colors";

const CARD_TINTS = ["bg-c-blue", "bg-c-mint", "bg-c-peach", "bg-c-purple", "bg-c-pink", "bg-c-yellow"];

export default function TodayBoard({ ctx }) {
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
      <div className="flex flex-col items-center gap-2 pt-24 text-center">
        <p className="text-body text-ink2">עדיין אין משימות מוגדרות</p>
      </div>
    );
  }

  const personById = new Map(board.persons.map((p) => [p.id, p]));

  return (
    <div className="space-y-4">
      <h1 className="text-h1">היום</h1>
      {board.tasks.map((task, idx) => {
        const tint = CARD_TINTS[idx % CARD_TINTS.length];
        const eligible = task.eligible_ids.map((id) => personById.get(id)).filter(Boolean);
        const recommendedId = recommendPerson(task, board.recentLogs);

        return (
          <div key={task.id} className={`rounded-card ${tint} p-5 shadow-card`}>
            <div className="mb-3 flex items-center gap-2">
              <TaskIcon icon={task.icon} size={20} className="text-ink" />
              <h2 className="text-h2">{task.label}</h2>
            </div>

            <div className="space-y-2.5">
              {(task.times.length > 0 ? task.times : [null]).map((slotTime) => {
                const entry = board.logsToday.find(
                  (l) => l.task_id === task.id && l.slot_time === slotTime && !l.is_help
                );
                const doneBy = entry ? personById.get(entry.person_id) : null;
                const key = `${task.id}:${slotTime}`;
                const isPending = pending === key;

                return (
                  <div key={key} className="rounded-btn bg-surface/70 p-3">
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
                            className={`flex min-h-[40px] items-center gap-1.5 rounded-pill px-3.5 text-sub font-semibold transition-all active:scale-[0.96]
                              disabled:cursor-default
                              ${
                                isDone
                                  ? `${personBg(person.color_idx)} text-white`
                                  : doneBy
                                  ? "bg-surface2 text-ink2/50"
                                  : isRecommended
                                  ? `${personBgSoft(person.color_idx)} ${personText(person.color_idx)} border-2 ${personBorder(person.color_idx)}`
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
