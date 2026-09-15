/* Cash Clinic — team dashboard service worker.
   ---------------------------------------------------------------------------
   This worker exists for ONE reason: a web push cannot be delivered without
   one. It deliberately has NO fetch handler and caches nothing.

   That is a decision, not an omission. The dashboard is an always-online,
   auth-gated page whose whole job is showing today's numbers. Caching its
   shell would mean that after a deploy some of the team keep running last
   week's JavaScript against this week's backend — with no way for them to
   tell, because the page would look fine. A stale dashboard is worse than a
   dashboard that needs a connection. If offline reading is ever wanted, it
   should be a deliberate, versioned cache keyed on BUILD_ID, not this file
   quietly growing one.
   --------------------------------------------------------------------------- */

importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCfD6ocmBsGVJms69TDbKt1PkcdSsGc3so",
  authDomain: "cash-quiz-906a6.firebaseapp.com",
  projectId: "cash-quiz-906a6",
  storageBucket: "cash-quiz-906a6.firebasestorage.app",
  messagingSenderId: "547780714224",
  appId: "1:547780714224:web:0e97107045a803623dec35",
});

const messaging = firebase.messaging();

/* A new worker should take over immediately. Without these two the team would
   keep running the previous worker until every dashboard tab was closed —
   which on a phone is approximately never. */
self.addEventListener("install", (e) => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

/* Sent as a data-only message on purpose: a `notification` payload is drawn by
   the browser itself and cannot be given a tag, an icon or a click target we
   control, which is how you end up with four identical "موعد جديد" banners
   stacked on a lock screen. Data-only means this code draws it. */
messaging.onBackgroundMessage((payload) => {
  const d = (payload && payload.data) || {};
  const title = d.title || "كاش كلينك";
  self.registration.showNotification(title, {
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
  });
});

/* Tapping it should land on the tab it is about, and should re-use a dashboard
   that is already open rather than opening a second copy of it. */
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/team/dashboard.html";
  e.waitUntil((async () => {
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
