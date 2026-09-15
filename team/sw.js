/* Cash Clinic — team dashboard service worker.
   ---------------------------------------------------------------------------
   This worker exists for ONE reason: a web push cannot be delivered without
   one. It deliberately has NO fetch handler and caches nothing.

   That is a decision, not an omission. The dashboard is an always-online,
   auth-gated page whose whole job is showing today's numbers. Caching its
   shell would mean that after a deploy some of the team keep running last
   week's JavaScript against this week's backend — with no way for them to
   tell, because the page would look fine.

   It also has NO external dependencies, and that IS a fix rather than a
   preference. The first version pulled the Firebase compat SDK in over
   importScripts and used onBackgroundMessage. If that fetch fails at install
   time — a phone on a bad connection, a captive portal, anything — the worker
   still installs and still reports itself healthy, but has no push handler
   whatsoever. Notifications then fail permanently and silently, with nothing
   anywhere to say why. An FCM data-only message is an ordinary Web Push
   message, so it can be read directly, and then there is nothing left to fail.
   --------------------------------------------------------------------------- */

const SW_VERSION = "2026-09-15-c";

/* A new worker should take over immediately. Without these two the team would
   keep running the previous worker until every dashboard tab was closed —
   which on a phone is approximately never. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

/* FCM sends us data-only, so the payload arrives as { data: {...} }. The other
   shapes are read too: a notification payload, or a flat object, in case the
   sending side is ever changed without this file being changed with it. */
function readPush(event) {
  if (!event.data) return {};
  let p = {};
  try { p = event.data.json() || {}; }
  catch (e) { return { title: "كاش كلينك", body: String(event.data.text() || "") }; }
  return p.data || p.notification || p;
}

self.addEventListener("push", (event) => {
  const d = readPush(event);
  /* iOS REQUIRES a visible notification for every push it delivers. A push
     that shows nothing gets the system's own "a website updated in the
     background" banner, and repeated offences cost the subscription outright —
     so this runs even when the payload arrives empty or unreadable. */
  event.waitUntil(
    self.registration.showNotification(d.title || "كاش كلينك", {
      body: d.body || "",
      icon: "/team/icons/icon-192.png",
      badge: "/team/icons/icon-192.png",
      dir: "rtl",
      lang: "ar",
      /* same tag replaces rather than stacks: five bookings in a morning should
         be five lines you scroll, not five notifications you dismiss */
      tag: d.type || "cc",
      renotify: true,
      data: { url: d.url || "/team/dashboard.html", type: d.type || "" },
    })
  );
});

/* Tapping it should land on the tab it is about, and should re-use a dashboard
   that is already open rather than opening a second copy of it. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/team/dashboard.html";
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) {
      if (c.url.indexOf("/team/dashboard.html") !== -1) {
        await c.focus();
        /* the page listens for this and switches tab without a reload */
        c.postMessage({ cc: "notification-click", url });
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});

/* So the diagnostics panel can prove WHICH worker is running. Without this,
   a phone stuck on an older worker looks identical to a healthy one. */
self.addEventListener("message", (event) => {
  if (!event.data || event.data.cc !== "version") return;
  const reply = { cc: "version", version: SW_VERSION };
  if (event.ports && event.ports[0]) event.ports[0].postMessage(reply);
  else if (event.source) event.source.postMessage(reply);
});
