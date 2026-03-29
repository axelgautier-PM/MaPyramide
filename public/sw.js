// Service Worker — MaPyramide
// Gère les push notifications Web Push (VAPID)
// Compatible iOS 16.4+ PWA installée depuis Safari

// ─── Push event : afficher la notification native ──────────────────────────
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};

  const title   = data.title ?? "MaPyramide";
  const options = {
    body:  data.body  ?? "",
    icon:  "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data:  { url: data.url ?? "/app" },
    // iOS : ces options sont ignorées mais n'empêchent pas la notif
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ─── Tap sur la notification → ouvre l'app ────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? "/app";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Fenêtre déjà ouverte → focus + navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Pas de fenêtre → ouvrir
      return clients.openWindow(targetUrl);
    })
  );
});

// ─── Activation : prise de contrôle immédiate ─────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});
