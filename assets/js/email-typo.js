/* ==========================================================================
   Cash Clinic — email typo guard
   --------------------------------------------------------------------------
   Catches the mistakes that silently cost us a registrant:
       ahmed@gmail.cim   -> impossible TLD
       sara@hotmai       -> domain with no TLD at all
       ali@gmial.com     -> misspelled provider

   Mirrors the same logic that runs server-side in functions/index.js, so a
   person is warned in the browser first and, if they submit anyway, the
   backend refuses with the identical suggestion.

   Zero dependencies. Drop it on any page:
       <script src="assets/js/email-typo.js"></script>

   It auto-attaches to every <input type="email"> and exposes:
       window.ccEmailSuggest(value)  -> corrected address, or ""
   ========================================================================== */
(function () {
  "use strict";

  var BAD_TLD = {
    cim: "com", con: "com", vom: "com", comm: "com", ocm: "com", cmo: "com",
    xom: "com", cpm: "com", clm: "com", c0m: "com", ccom: "com", como: "com",
    coom: "com", cbm: "com", cok: "com", cmm: "com",
    nte: "net", ner: "net", nrt: "net", nett: "net",
    ogr: "org", rog: "org", orh: "org", orgg: "org"
  };

  var TYPO = {
    "gmial.com": "gmail.com", "gmai.com": "gmail.com", "gmil.com": "gmail.com",
    "gmaill.com": "gmail.com", "gamil.com": "gmail.com", "gmali.com": "gmail.com",
    "gnail.com": "gmail.com", "gmail.co": "gmail.com", "gmail.cm": "gmail.com",
    "gmail.om": "gmail.com", "gmaul.com": "gmail.com", "gmeil.com": "gmail.com",
    "gmailcom": "gmail.com",
    "hotmai.com": "hotmail.com", "hotmial.com": "hotmail.com", "hotmil.com": "hotmail.com",
    "hotmall.com": "hotmail.com", "hotmaill.com": "hotmail.com", "hotamil.com": "hotmail.com",
    "homail.com": "hotmail.com", "hotmail.co": "hotmail.com", "hotmail.cm": "hotmail.com",
    "hormail.com": "hotmail.com", "hotmaol.com": "hotmail.com", "hotmailcom": "hotmail.com",
    "outlok.com": "outlook.com", "outllok.com": "outlook.com", "outloo.com": "outlook.com",
    "oultook.com": "outlook.com", "outlook.co": "outlook.com", "outook.com": "outlook.com",
    "yaho.com": "yahoo.com", "yahho.com": "yahoo.com", "yhaoo.com": "yahoo.com",
    "yahoo.co": "yahoo.com", "yahooo.com": "yahoo.com", "yahoocom": "yahoo.com",
    "iclould.com": "icloud.com", "icloud.co": "icloud.com", "iclod.com": "icloud.com",
    "icoud.com": "icloud.com", "live.co": "live.com"
  };

  var BASES = ["gmail", "hotmail", "outlook", "yahoo", "icloud", "live",
               "msn", "aol", "ymail", "proton", "protonmail", "googlemail"];

  function editDistance(a, b) {
    a = String(a); b = String(b);
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 3) return 9;
    var prev = [], i, j, carry, tmp;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      carry = prev[0]; prev[0] = i;
      for (j = 1; j <= b.length; j++) {
        tmp = prev[j];
        prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, carry + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
        carry = tmp;
      }
    }
    return prev[b.length];
  }

  /* returns a corrected address, or "" when nothing is clearly wrong */
  function suggest(raw) {
    var email = String(raw || "").trim().toLowerCase();
    var at = email.lastIndexOf("@");
    if (at < 1 || at === email.length - 1) return "";
    var local  = email.slice(0, at);
    var domain = email.slice(at + 1);
    if (!local || !domain) return "";

    if (TYPO[domain]) return local + "@" + TYPO[domain];

    /* a domain with no dot can never be valid, so guessing here is safe */
    if (domain.indexOf(".") === -1) {
      var best = null, bestDist = 99, d, k;
      for (k = 0; k < BASES.length; k++) {
        d = Math.min(editDistance(domain, BASES[k]), editDistance(domain, BASES[k] + "com"));
        if (d < bestDist) { bestDist = d; best = BASES[k]; }
      }
      return (best && bestDist <= 2) ? local + "@" + best + ".com" : "";
    }

    var dot = domain.lastIndexOf(".");
    var tld = domain.slice(dot + 1);
    if (BAD_TLD[tld]) {
      var fixed = domain.slice(0, dot) + "." + BAD_TLD[tld];
      return local + "@" + (TYPO[fixed] || fixed);
    }
    return "";
  }

  window.ccEmailSuggest = suggest;

  /* ---------------- inline hint under the field ---------------- */

  var STYLE_ID = "cc-etip-style";
  function ensureStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var st = document.createElement("style");
    st.id = STYLE_ID;
    st.textContent =
      ".cc-etip{display:none;flex:1 0 100%;width:100%;box-sizing:border-box;margin:8px 0 0;" +
      "background:#F7ECD3;border:1px solid #D3A146;border-radius:12px;padding:10px 13px;" +
      "font-size:13.5px;line-height:1.7;color:#2F1749;text-align:right;" +
      "font-family:inherit;order:99}" +
      ".cc-etip.on{display:block}" +
      ".cc-etip b{direction:ltr;unicode-bidi:embed;display:inline-block}" +
      ".cc-etip button{margin-inline-start:8px;border:0;background:#2F1749;color:#FFE6BB;" +
      "border-radius:999px;padding:5px 14px;font-size:12.5px;font-weight:700;" +
      "font-family:inherit;cursor:pointer}";
    (document.head || document.documentElement).appendChild(st);
  }

  function tipFor(input) {
    if (input.__ccTip && input.__ccTip.parentNode) return input.__ccTip;
    ensureStyle();
    var tip = document.createElement("div");
    tip.className = "cc-etip";
    var host = input.parentNode || input;
    if (input.nextSibling) host.insertBefore(tip, input.nextSibling);
    else host.appendChild(tip);
    input.__ccTip = tip;
    return tip;
  }

  function hide(input) {
    if (input.__ccTip) input.__ccTip.className = "cc-etip";
    var err = siblingErr(input);
    if (err && err.__ccOrig != null) { err.textContent = err.__ccOrig; }
  }

  /* the quiz gate already renders a ".err" line under each field: reuse it */
  function siblingErr(input) {
    var host = input.parentNode;
    if (!host || !host.querySelector) return null;
    return host.querySelector(".err");
  }

  function check(input) {
    var v = (input.value || "").trim();
    if (!v) { hide(input); return ""; }
    var s = suggest(v);
    if (!s || s === v.toLowerCase()) { hide(input); return ""; }

    var tip = tipFor(input);
    tip.innerHTML = "";
    tip.appendChild(document.createTextNode("تأكد من إيميلك، هل تقصد "));
    var b = document.createElement("b"); b.textContent = s; tip.appendChild(b);
    tip.appendChild(document.createTextNode("؟"));
    var btn = document.createElement("button");
    btn.type = "button"; btn.textContent = "صحّحه";
    btn.addEventListener("click", function () {
      input.value = s;
      hide(input);
      try { input.dispatchEvent(new Event("input", { bubbles: true })); } catch (e) {}
      try { input.dispatchEvent(new Event("change", { bubbles: true })); } catch (e) {}
      input.focus();
    });
    tip.appendChild(btn);
    tip.className = "cc-etip on";

    var err = siblingErr(input);
    if (err) {
      if (err.__ccOrig == null) err.__ccOrig = err.textContent;
      err.textContent = "تأكد من إيميلك، هل تقصد " + s + "؟";
    }
    return s;
  }

  window.ccEmailCheck = check;

  function attach(input) {
    if (input.__ccBound) return;
    input.__ccBound = true;
    input.addEventListener("blur", function () { check(input); });
    input.addEventListener("input", function () { hide(input); });
  }

  function scan() {
    var list = document.querySelectorAll('input[type="email"]');
    for (var i = 0; i < list.length; i++) attach(list[i]);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan);
  else scan();

  /* fields inside modals/gates are created or revealed later, so re-scan */
  setTimeout(scan, 1200);
  setTimeout(scan, 4000);
})();
