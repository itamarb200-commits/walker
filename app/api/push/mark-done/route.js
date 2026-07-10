import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Called from sw.js when the user taps "בוצע ✓" on a reminder — same-origin
// fetch from the service worker carries the session cookie, so this
// authenticates as whoever received the notification.
export async function POST(req) {
  const supabase = supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { taskId, slotTime, familyId } = await req.json();
  if (!taskId || !familyId) return NextResponse.json({ error: "missing fields" }, { status: 400 });

  const { data: person } = await supabase
    .from("persons")
    .select("id, family_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!person || person.family_id !== familyId) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { data: family } = await supabase.from("families").select("timezone").eq("id", familyId).maybeSingle();
  const localDate = new Intl.DateTimeFormat("en-CA", { timeZone: family?.timezone || "Asia/Jerusalem" }).format(new Date());

  // Idempotent: if it's already logged (by anyone, e.g. a race with the app),
  // the unique index rejects the insert — that's a success from the user's
  // point of view, the task is done either way.
  const { error } = await supabase.from("task_logs").insert({
    family_id: familyId,
    task_id: taskId,
    person_id: person.id,
    local_date: localDate,
    slot_time: slotTime || null,
    is_help: false,
  });
  if (error && error.code !== "23505") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
