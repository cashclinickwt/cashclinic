/* Cash Clinic — page-view counter.
   ---------------------------------------------------------------------------
   One fire-and-forget beacon per page load. sendBeacon rather than fetch on
   purpose: the browser posts it on its own schedule and does not hold the page
   open waiting for a reply, so a slow or unreachable counter can never cost a
   visitor a millisecond of load time. For an ordinary visitor nothing is sent
   but which page was opened.

   Personal links (24 Nov 2026) — cashclinic.net/sarah and the like.
   The link page leaves a note in this browser of which link brought the
   visitor (cc_ref, kept 30 days), with a random number it made up for this
   browser (27 Nov 2026). While that note is there:
     · the beacon also says which link, and that number, so the dashboard can
       show which pages the link's visitors open — the number is not a name,
       an address or anything that identifies a person;
     · the four calls that start something — a book or digital purchase, a
       workshop seat, a booking, a quiz result — carry the same two, so the
       dashboard can say what visitors from that link went on to do.
   Team pages are never logged. Anything that goes wrong leaves the page and
   its calls exactly as they were.
   --------------------------------------------------------------------------- */
(function () {
  var note = null, v = "";
  try {
    var raw = localStorage.getItem("cc_ref");
    if (raw) {
      note = JSON.parse(raw);
      if (!note || !/^[a-z0-9-]{1,30}$/.test(note.k) || !(Date.now() - Number(note.t) < 30 * 864e5)) {
        localStorage.removeItem("cc_ref"); note = null;
      }
    }
    if (note && /^\/team\//.test(location.pathname || "")) note = null;
    if (note && /^[a-z0-9]{10,24}$/.test(note.v || "")) v = note.v;
  } catch (e) { note = null; v = ""; }

  try {
    var URL_ = "https://us-central1-cash-quiz-906a6.cloudfunctions.net/trackVisit";
    var hit = { p: location.pathname || "/" };
    if (note) {
      hit.ref = note.k;
      if (v) {
        hit.v = v;
        /* how many pages this browser has opened since the click: the second one means they looked around */
        note.pv = (Number(note.pv) || 0) + 1; hit.pv = note.pv;
        try { localStorage.setItem("cc_ref", JSON.stringify(note)); } catch (e) {}
      }
    }
    var body = JSON.stringify(hit);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(URL_, new Blob([body], { type: "text/plain;charset=UTF-8" }));
    } else {
      /* keepalive lets it survive the page being navigated away from */
      fetch(URL_, { method: "POST", body: body, keepalive: true, mode: "no-cors",
                    headers: { "Content-Type": "text/plain" } }).catch(function () {});
    }
  } catch (e) { /* a counter is never worth an error on a customer's screen */ }

  if (!note) return;
  try {
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
            if (v) b.data.refV = v;
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
