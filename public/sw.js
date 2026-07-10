/* Walker service worker — Web Push reminders for any family's recurring
   tasks. Shows the notification and handles the in-notification "בוצע"
   action so a task can be logged without opening the app. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Walker", body: event.data ? event.data.text() : "" };
  }

  const { title = "Walker", body = "", tag, data = {} } = payload;

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,                       // same tag replaces an earlier unread reminder
      renotify: true,
      dir: data.dir || "rtl",
      lang: data.lang || "he",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data,
      actions: [
        { action: "done", title: data.doneLabel || "בוצע ✓" },
        { action: "open", title: data.openLabel || "פתח" },
      ],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  const notif = event.notification;
  notif.close();
  const data = notif.data || {};

  // "בוצע" — log the task straight from the notification, no app-open needed.
  if (event.action === "done" && data.taskId && data.familyId) {
    event.waitUntil(
      fetch("/api/push/mark-done", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: data.taskId, slotTime: data.slotTime, familyId: data.familyId }),
      }).catch(() => {})
    );
    return;
  }

  // Any other click → focus an open tab or open the app.
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) return client.focus();
      }
      return self.clients.openWindow(data.url || "/app");
    })
  );
});
