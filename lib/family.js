import { supabaseBrowser } from "@/lib/supabase/client";

// ─── Family data layer ───────────────────────────────────────────────────────
// Client-side helpers around Supabase — fetch the signed-in user's family
// context, load today's board, and mutate task_logs. RLS (my_family_id())
// is the real guard; these just shape the queries.

// YYYY-MM-DD for any Date, in local time. Good enough until Phase 4 threads
// the family's stored timezone through.
export function dateKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
export function todayKey() {
  return dateKey(new Date());
}

// Sunday..Saturday for the week `offset` weeks from this one (0 = current).
export function weekDays(offset = 0) {
  const now = new Date();
  const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    return d;
  });
}

// The signed-in user's family_id + own person_id, or null if not onboarded.
export async function getMyContext() {
  const supabase = supabaseBrowser();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: person, error } = await supabase
    .from("persons")
    .select("id, family_id, name, color_idx")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error || !person) return null;

  return { userId: user.id, personId: person.id, familyId: person.family_id, me: person };
}

// Everything the "today" screen needs in one round-trip-ish batch.
export async function fetchFamilyBoard(familyId) {
  const supabase = supabaseBrowser();
  const [{ data: persons }, { data: pets }, { data: tasks }, { data: logsToday }, { data: recentLogs }] =
    await Promise.all([
      supabase.from("persons").select("id, name, color_idx").eq("family_id", familyId).order("created_at"),
      supabase.from("pets").select("id, name, species").eq("family_id", familyId).order("created_at"),
      supabase.from("tasks").select("*").eq("family_id", familyId).order("sort_order"),
      supabase.from("task_logs").select("*").eq("family_id", familyId).eq("local_date", todayKey()),
      // Fairness needs history — 60 days is enough signal without unbounded growth.
      supabase
        .from("task_logs")
        .select("task_id, person_id, is_help")
        .eq("family_id", familyId)
        .eq("is_help", false)
        .gte("local_date", new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10)),
    ]);

  return {
    persons: persons || [],
    pets: pets || [],
    tasks: tasks || [],
    logsToday: logsToday || [],
    recentLogs: recentLogs || [],
  };
}

// Fewest-logs-first fairness: the eligible person with the lowest count for
// this task over the recent window. Ties keep the task's declared order.
export function recommendPerson(task, recentLogs) {
  const counts = new Map(task.eligible_ids.map((id) => [id, 0]));
  for (const log of recentLogs) {
    if (log.task_id === task.id && counts.has(log.person_id)) {
      counts.set(log.person_id, counts.get(log.person_id) + 1);
    }
  }
  let best = null;
  for (const id of task.eligible_ids) {
    if (best === null || counts.get(id) < counts.get(best)) best = id;
  }
  return best;
}

// Tap semantics for a task+time cell, mirroring the Milo picker:
//  - no existing entry            -> insert (assign personId)
//  - existing entry, same person  -> delete (undo)
//  - existing entry, other person -> update (reassign)
// localDate defaults to today; the week board passes an arbitrary past day.
export async function toggleLog({ task, slotTime, personId, familyId, isHelp = false, localDate = todayKey() }) {
  const supabase = supabaseBrowser();

  const { data: existing } = await supabase
    .from("task_logs")
    .select("id, person_id")
    .eq("task_id", task.id)
    .eq("local_date", localDate)
    .eq("is_help", isHelp)
    .eq("slot_time", slotTime)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from("task_logs").insert({
      family_id: familyId,
      task_id: task.id,
      person_id: personId,
      local_date: localDate,
      slot_time: slotTime,
      is_help: isHelp,
    });
    if (error) throw error;
    return "logged";
  }

  if (existing.person_id === personId) {
    const { error } = await supabase.from("task_logs").delete().eq("id", existing.id);
    if (error) throw error;
    return "undone";
  }

  const { error } = await supabase.from("task_logs").update({ person_id: personId }).eq("id", existing.id);
  if (error) throw error;
  return "reassigned";
}

// Helper-credit entries stack (unlimited, outside fairness) — always insert.
export async function addHelp({ task, slotTime, personId, familyId }) {
  const supabase = supabaseBrowser();
  const { error } = await supabase.from("task_logs").insert({
    family_id: familyId,
    task_id: task.id,
    person_id: personId,
    local_date: todayKey(),
    slot_time: slotTime,
    is_help: true,
  });
  if (error) throw error;
}

export async function deleteLog(logId) {
  const supabase = supabaseBrowser();
  const { error } = await supabase.from("task_logs").delete().eq("id", logId);
  if (error) throw error;
}

// Persons + tasks + all logs (incl. help) for an inclusive [startDate, endDate]
// range — backs both the week board and the statistics tab.
export async function fetchRangeBoard(familyId, startDate, endDate) {
  const supabase = supabaseBrowser();
  const [{ data: persons }, { data: tasks }, { data: logs }] = await Promise.all([
    supabase.from("persons").select("id, name, color_idx").eq("family_id", familyId).order("created_at"),
    supabase.from("tasks").select("*").eq("family_id", familyId).order("sort_order"),
    supabase
      .from("task_logs")
      .select("*")
      .eq("family_id", familyId)
      .gte("local_date", startDate)
      .lte("local_date", endDate)
      .order("created_at", { ascending: false }),
  ]);
  return { persons: persons || [], tasks: tasks || [], logs: logs || [] };
}
