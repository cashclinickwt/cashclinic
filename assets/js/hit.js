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
