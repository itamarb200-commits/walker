"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff, BellRing } from "lucide-react";
import { pushStatus, enablePush, disablePush } from "@/lib/push-client";

// Enable/disable push reminders for this device + a self-test. Lives on the
// Statistics tab for now (mirrors Milo); moves into a real Settings screen
// in Phase 5 once per-task notification prefs need their own UI.
export default function NotifyToggle() {
  const [status, setStatus] = useState("loading"); // loading|unsupported|denied|off|on
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    pushStatus().then((s) => { if (alive) setStatus(s); });
    return () => { alive = false; };
  }, []);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      if (status === "on") {
        setStatus(await disablePush());
        toast("התראות כובו במכשיר הזה");
      } else {
        const next = await enablePush();
        setStatus(next);
        if (next === "on") toast.success("התראות הופעלו ✓");
        else if (next === "denied") toast.error("ההרשאה נחסמה — צריך לאפשר בהגדרות הדפדפן");
      }
    } finally {
      setBusy(false);
    }
  }

  async function sendTest() {
    if (busy) return;
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg && (await reg.pushManager.getSubscription());
      if (!sub) { toast.error("צריך להפעיל התראות קודם"); return; }
      const res = await fetch("/api/push/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selfTest: true, endpoint: sub.endpoint }),
      });
      if (res.ok) toast.success("נשלחה התראת בדיקה 🔔");
      else toast.error("שליחת הבדיקה נכשלה");
    } catch {
      toast.error("שליחת הבדיקה נכשלה");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading") return null;

  const isOn = status === "on";
  const Icon = isOn ? BellRing : status === "denied" ? BellOff : Bell;

  return (
    <section className="rounded-card border border-line bg-surface p-4 shadow-card">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-btn ${
            isOn ? "bg-accent/12 text-accent" : "bg-surface2 text-ink2"
          }`}
        >
          <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <div className="flex-1">
          <h2 className="text-body font-extrabold text-ink">תזכורות</h2>
          <p className="text-cap font-medium text-ink2">
            {status === "unsupported" ? "לא נתמך בדפדפן הזה"
              : status === "denied"   ? "חסום — אפשר התראות בהגדרות"
              : isOn                  ? "פעיל במכשיר הזה"
              :                         "כבוי"}
          </p>
        </div>

        {status !== "unsupported" && status !== "denied" && (
          <button
            onClick={toggle}
            disabled={busy}
            role="switch"
            aria-checked={isOn}
            aria-label="הפעלת תזכורות"
            className={`relative h-7 w-12 shrink-0 rounded-pill transition-colors duration-200 ease-out disabled:opacity-50 ${
              isOn ? "bg-accent" : "bg-surface2"
            }`}
          >
            <span
              className="absolute top-1 h-5 w-5 rounded-full bg-white shadow-card"
              style={{
                left: isOn ? "calc(100% - 1.25rem - 0.25rem)" : "0.25rem",
                transition: "left 200ms cubic-bezier(0.23,1,0.32,1)",
              }}
            />
          </button>
        )}
      </div>

      {isOn && (
        <button
          onClick={sendTest}
          disabled={busy}
          className="mt-3 w-full rounded-btn bg-surface2 py-2.5 text-sub font-semibold text-ink
                     transition-transform duration-150 ease-out active:scale-[0.98] disabled:opacity-50"
        >
          שלח התראת בדיקה
        </button>
      )}

      {status === "unsupported" && (
        <p className="mt-2.5 text-cap text-ink2">
          ב-iPhone: הוסיפו את האפליקציה למסך הבית (Safari ← שיתוף ← הוסף למסך הבית),
          פתחו אותה משם, ואז אפשרו תזכורות. דרוש iOS 16.4 ומעלה.
        </p>
      )}
    </section>
  );
}
