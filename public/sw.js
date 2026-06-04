// Service Worker — FitTrack Push Notifications
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

// ── Recibir notificación push ──────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data = {};
  try { data = event.data.json(); } catch { data = { title: "FitTrack", body: event.data.text() }; }

  const title = data.title || "FitTrack";
  const options = {
    body:    data.body    || "Recordatorio FitTrack",
    icon:    data.icon    || "/icon-192.png",
    badge:   data.badge   || "/icon-192.png",
    tag:     data.tag     || "fittrack-reminder",
    data:    { url: data.url || "/app" },
    actions: data.actions || [],
    vibrate: [200, 100, 200],
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Click en notificación ──────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const url = event.notification.data?.url || "/app";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      // Si la app ya está abierta, enfocarla
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Si no, abrir nueva ventana
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
