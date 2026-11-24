/* Cash Clinic — page-view counter.
   ---------------------------------------------------------------------------
   One fire-and-forget beacon per page load. sendBeacon rather than fetch on
   purpose: the browser posts it on its own schedule and does not hold the page
   open waiting for a reply, so a slow or unreachable counter can never cost a
   visitor a millisecond of load time. Nothing about the visitor is sent — no
   identifier of any kind and nothing that could rebuild one — just which
   page was opened.
   --------------------------------------------------------------------------- */
(function () {
  try {
    var URL_ = "https://us-central1-cash-quiz-906a6.cloudfunctions.net/trackVisit";
    var body = JSON.stringify({ p: location.pathname || "/" });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(URL_, new Blob([body], { type: "text/plain;charset=UTF-8" }));
    } else {
      /* keepalive lets it survive the page being navigated away from */
      fetch(URL_, { method: "POST", body: body, keepalive: true, mode: "no-cors",
                    headers: { "Content-Type": "text/plain" } }).catch(function () {});
    }
  } catch (e) { /* a counter is never worth an error on a customer's screen */ }
})();

/* Personal links (24 Nov 2026) — cashclinic.net/sara and the like.
   The link page leaves a note of which link brought the visitor (cc_ref, kept
   30 days). Here, on every page, that note is added to the four calls that
   start something — a book or digital purchase, a workshop seat, a booking, a
   quiz result — so the dashboard can say what visitors from that link did.
   Only the name of the link is sent, nothing about the visitor. Anything that
   goes wrong leaves the call exactly as the page made it. */
(function () {
  try {
    var raw = localStorage.getItem("cc_ref"); if (!raw) return;
    var note = JSON.parse(raw);
    if (!note || !/^[a-z0-9-]{1,30}$/.test(note.k) || !(Date.now() - Number(note.t) < 30 * 864e5)) {
      localStorage.removeItem("cc_ref"); return;
    }
    if (!window.fetch || window.fetch.__ccRef) return;
    var CALLS = /\/(createTapCharge|createCourseCharge|createBookingCharge|saveLead)(\?|$)/;
    var orig = window.fetch;
    var wrapped = function (input, init) {
      try {
        var url = typeof input === "string" ? input : (input && input.url) || "";
        if (CALLS.test(url) && init && typeof init.body === "string") {
          var b = JSON.parse(init.body);
          if (b && b.data && typeof b.data === "object" && !b.data.ref) {
            b.data.ref = note.k;
            init = Object.assign({}, init, { body: JSON.stringify(b) });
          }
        }
      } catch (e) {}
      return orig.call(this, input, init);
    };
    wrapped.__ccRef = true;
    window.fetch = wrapped;
  } catch (e) {}
})();
