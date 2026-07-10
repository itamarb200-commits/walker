import { NextResponse } from "next/server";
import webpush from "web-push";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FIRE_WINDOW_MIN = 16; // must exceed the cron cadence (15 min) so no minute is missed

// Minimal server-side strings — families.locale (set at signup) picks he/en.
// Not the full app dictionary; just enough for a push payload.
const PUSH_STRINGS = {
  he: { testTitle: "🔔 התראת בדיקה", testBody: "התזכורות עובדות! ככה ייראו תזכורות המשימות שלכם.", at: "שעה" },
  en: { testTitle: "🔔 Test reminder", testBody: "Reminders are working! This is what your task reminders will look like.", at: "At" },
};
const pushStrings = (locale) => PUSH_STRINGS[locale] || PUSH_STRINGS.he;

function configureVapid() {
  const pub = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "").trim();
  const priv = (process.env.VAPID_PRIVATE_KEY || "").trim();
  const subject = (process.env.VAPID_SUBJECT || "mailto:itamarb200@gmail.com").trim();
  if (!pub || !priv) return { ok: false, reason: "missing keys" };
  try {
    webpush.setVapidDetails(subject, pub, priv);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: String(e.message || e) };
  }
}

function authorized(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization") || "";
  const url = new URL(req.url);
  return auth === `Bearer ${secret}` || url.searchParams.get("key") === secret;
}

// "HH:MM" + calendar date for a family, in the family's own timezone.
function familyLocalNow(timezone) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    hour: "2-digit", minute: "2-digit", hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t)?.value;
  return {
    hhmm: `${get("hour")}:${get("minute")}`,
    minutes: Number(get("hour")) * 60 + Number(get("minute")),
    dateStr: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

async function sendToSubs(admin, subs, payload) {
  const body = JSON.stringify(payload);
  const dead = [];
  await Promise.all(
    subs.map(async (row) => {
      try {
        await webpush.sendNotification(row.sub_json, body);
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) dead.push(row.endpoint);
      }
    })
  );
  if (dead.length) await admin.from("push_subs").delete().in("endpoint", dead);
  return subs.length - dead.length;
}

export async function POST(req) {
  let body = {};
  try { body = await req.json(); } catch { /* optional */ }

  const admin = supabaseAdmin();

  // Self-test — no secret needed, only ever targets the caller's own already
  // registered endpoint, so it can't be used to spam anyone else's device.
  if (body.selfTest && body.endpoint) {
    const v = configureVapid();
    if (!v.ok) return NextResponse.json({ error: "VAPID not configured", reason: v.reason }, { status: 500 });
    const { data: sub } = await admin.from("push_subs").select("*").eq("endpoint", body.endpoint).maybeSingle();
    if (!sub) return NextResponse.json({ error: "unknown endpoint" }, { status: 404 });
    const { data: subFamily } = await admin.from("families").select("locale").eq("id", sub.family_id).maybeSingle();
    const strings = pushStrings(subFamily?.locale);
    const delivered = await sendToSubs(admin, [sub], {
      title: strings.testTitle,
      body: strings.testBody,
      tag: "self-test",
      data: { kind: "test", url: "/app" },
    });
    return NextResponse.json({ ok: true, selfTest: true, delivered });
  }

  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const v = configureVapid();
  if (!v.ok) return NextResponse.json({ error: "VAPID not configured", reason: v.reason }, { status: 500 });

  const [{ data: families }, { data: tasks }, { data: disabledPrefs }] = await Promise.all([
    admin.from("families").select("id, timezone, locale"),
    admin.from("tasks").select("id, family_id, label, icon, times"),
    admin.from("notif_prefs").select("user_id, task_id").eq("enabled", false),
  ]);

  const disabledSet = new Set((disabledPrefs || []).map((p) => `${p.user_id}:${p.task_id}`));
  const tasksByFamily = new Map();
  for (const t of tasks || []) {
    if (!tasksByFamily.has(t.family_id)) tasksByFamily.set(t.family_id, []);
    tasksByFamily.get(t.family_id).push(t);
  }

  const fired = [];
  for (const family of families || []) {
    const familyTasks = tasksByFamily.get(family.id) || [];
    if (familyTasks.length === 0) continue;
    const { hhmm, minutes, dateStr } = familyLocalNow(family.timezone || "Asia/Jerusalem");
    const strings = pushStrings(family.locale);

    for (const task of familyTasks) {
      for (const slotTime of task.times || []) {
        const [h, m] = slotTime.split(":").map(Number);
        const due = h * 60 + m;
        const inWindow = minutes >= due && minutes < due + FIRE_WINDOW_MIN;
        if (!inWindow) continue;

        // Dedup: has this exact task+time+day already fired?
        const { data: already } = await admin
          .from("reminders_sent")
          .select("task_id")
          .eq("task_id", task.id)
          .eq("slot_time", slotTime)
          .eq("local_date", dateStr)
          .maybeSingle();
        if (already) continue;

        const { data: subs } = await admin.from("push_subs").select("*").eq("family_id", family.id);
        const eligibleSubs = (subs || []).filter((s) => !disabledSet.has(`${s.user_id}:${task.id}`));

        if (eligibleSubs.length > 0) {
          const delivered = await sendToSubs(admin, eligibleSubs, {
            title: task.label,
            body: `${strings.at} ${slotTime}`,
            tag: `${task.id}:${slotTime}:${dateStr}`,
            data: { taskId: task.id, slotTime, familyId: family.id, url: "/app" },
          });
          fired.push({ familyId: family.id, taskId: task.id, slotTime, delivered });
        }

        // Mark sent even with zero subscribers, so we don't recheck every 15 min.
        await admin.from("reminders_sent").insert({ task_id: task.id, slot_time: slotTime, local_date: dateStr });
      }
    }
  }

  return NextResponse.json({ ok: true, fired });
}

// GET ?diag=1 → safe setup report (booleans only, never leaks secret values).
// GET ?key=SECRET → same as a scheduled POST (for cron providers that only do GET).
export async function GET(req) {
  const url = new URL(req.url);
  if (url.searchParams.get("diag") === "1") {
    if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const v = configureVapid();
    const admin = supabaseAdmin();
    const { count: familyCount } = await admin.from("families").select("id", { count: "exact", head: true });
    const { count: subCount } = await admin.from("push_subs").select("id", { count: "exact", head: true });
    return NextResponse.json({
      hasCronSecret: Boolean((process.env.CRON_SECRET || "").trim()),
      hasVapidPrivate: Boolean((process.env.VAPID_PRIVATE_KEY || "").trim()),
      hasServiceRole: Boolean((process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim()),
      vapidOk: v.ok,
      vapidReason: v.ok ? undefined : v.reason,
      families: familyCount ?? -1,
      subscriptions: subCount ?? -1,
    });
  }
  return POST(req);
}
