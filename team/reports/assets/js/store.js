/* ================================================================
   Cash Nas — تخزين ملفات العملاء على قاعدة البيانات (Firestore)
   ----------------------------------------------------------------
   كانت الملفات تُحفظ بمتصفح الجهاز نفسه، يعني الملف يعيش على لابتوب
   واحد ويروح لو انمسح الكاش. الحين تنحفظ بقاعدة البيانات، فأي وحدة
   من الفريق تقدر تفتح ملف العميل من أي جهاز.

   الواجهة نفس القديمة (all / get / upsert / remove) بس صارت
   غير متزامنة لأن الحفظ صار على السيرفر.
   ================================================================ */
(function () {
  "use strict";

  var CONFIG = {
    firebase: {
      apiKey: "AIzaSyCfD6ocmBsGVJms69TDbKt1PkcdSsGc3so",
      authDomain: "cash-quiz-906a6.firebaseapp.com",
      projectId: "cash-quiz-906a6",
      storageBucket: "cash-quiz-906a6.firebasestorage.app",
      messagingSenderId: "547780714224",
      appId: "1:547780714224:web:0e97107045a803623dec35"
    },
    region: "us-central1",
    reportType: "asas-alhurriya",
    loginUrl: "../../dashboard.html"
  };

  var app = null, fns = null, auth = null, ready = null;
  var CACHE = [];

  function boot() {
    if (ready) return ready;
    ready = new Promise(function (resolve, reject) {
      try {
        app  = firebase.initializeApp(CONFIG.firebase);
        auth = firebase.auth();
        fns  = firebase.app().functions(CONFIG.region);
      } catch (e) { reject(e); return; }
      auth.onAuthStateChanged(function (user) {
        if (!user) { reject(new Error("not-signed-in")); return; }
        resolve(user);
      });
    });
    return ready;
  }

  function call(name, payload) {
    return boot().then(function () {
      return fns.httpsCallable(name)(payload || {});
    }).then(function (r) { return (r && r.data) || {}; });
  }

  function toast(msg, bad) {
    var el = document.getElementById("nasToast");
    if (!el) {
      el = document.createElement("div");
      el.id = "nasToast";
      el.style.cssText = "position:fixed;left:50%;transform:translateX(-50%);bottom:26px;" +
        "z-index:99999;padding:12px 22px;border-radius:999px;font-size:14px;" +
        "box-shadow:0 10px 30px rgba(0,0,0,.18);display:none;font-family:inherit";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.background = bad ? "#FDECEC" : "#E8F5E9";
    el.style.color = bad ? "#962E37" : "#2E7D32";
    el.style.display = "block";
    clearTimeout(el._t);
    el._t = setTimeout(function () { el.style.display = "none"; }, bad ? 7000 : 4000);
  }

  var Store = {
    reportType: CONFIG.reportType,
    isCloud: true,

    init: function () {
      return boot().then(function (user) {
        return Store.refresh().then(function () { return user; });
      }).catch(function (e) {
        if (e && e.message === "not-signed-in") {
          if (confirm("لازم تسجّلين دخول الفريق أول عشان تفتحين ملفات العملاء.\n\nتبين تروحين لصفحة الدخول؟")) {
            location.href = CONFIG.loginUrl;
          }
        } else {
          toast("تعذّر الاتصال بقاعدة البيانات: " + ((e && e.message) || ""), true);
        }
        throw e;
      });
    },

    refresh: function () {
      return call("listNasReports", { reportType: CONFIG.reportType }).then(function (d) {
        CACHE = (d.list || []);
        return CACHE;
      });
    },

    all: function () { return CACHE.slice(); },
    count: function () { return CACHE.length; },

    /* everyone with a confirmed appointment, for «ابدأ من حجز» */
    booked: function () {
      return call("listBookedClients", {}).then(function (d) { return d.list || []; });
    },

    get: function (id) {
      return call("getNasReport", { id: id }).then(function (d) { return d.report || null; });
    },

    upsert: function (rec) {
      return call("saveNasReport", {
        id: rec.id || "", reportType: CONFIG.reportType,
        name: rec.name, caseNo: rec.caseNo, pkg: rec.pkg,
        date: rec.date, consultant: rec.consultant,
        email: rec.email || "", phone: rec.phone || "",
        data: rec.data
      }).then(function (d) {
        rec.id = d.id;
        rec.updatedAt = d.savedAt || Date.now();
        var hit = false;
        for (var i = 0; i < CACHE.length; i++) {
          if (CACHE[i].id === rec.id) {
            CACHE[i] = { id: rec.id, name: rec.name, caseNo: rec.caseNo, pkg: rec.pkg,
                         date: rec.date, consultant: rec.consultant,
                         createdAt: CACHE[i].createdAt, updatedAt: rec.updatedAt };
            hit = true; break;
          }
        }
        if (!hit) CACHE.push({ id: rec.id, name: rec.name, caseNo: rec.caseNo, pkg: rec.pkg,
                               date: rec.date, consultant: rec.consultant,
                               createdAt: rec.updatedAt, updatedAt: rec.updatedAt });
        CACHE.sort(function (a, b) { return (b.updatedAt || 0) - (a.updatedAt || 0); });
        return rec;
      });
    },

    remove: function (id) {
      return call("deleteNasReport", { id: id }).then(function () {
        CACHE = CACHE.filter(function (r) { return r.id !== id; });
        return true;
      });
    },

    exportAll: function () {
      var out = [];
      return CACHE.map(function (r) { return r.id; }).reduce(function (p, id) {
        return p.then(function () {
          return Store.get(id).then(function (r) { if (r) out.push(r); });
        });
      }, Promise.resolve()).then(function () {
        return JSON.stringify({ schema: "cashnas-clients", version: 2,
          exportedAt: new Date().toISOString(), clients: out }, null, 2);
      });
    },

    importAll: function (text) {
      var obj = JSON.parse(text);
      var incoming = Array.isArray(obj) ? obj : obj.clients;
      if (!Array.isArray(incoming)) throw new Error("bad file");
      var added = 0;
      return incoming.reduce(function (p, r) {
        return p.then(function () {
          return Store.upsert({ id: "", name: r.name || "(بدون اسم)", caseNo: r.caseNo || "",
            pkg: r.pkg || "", date: r.date || "", consultant: r.consultant || "",
            data: r.data || {} }).then(function () { added++; });
        });
      }, Promise.resolve()).then(function () { return added; });
    },

    download: function (filename, text) {
      var blob = new Blob([text], { type: "application/json;charset=utf-8" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1200);
    },

    fmtDate: function (ts) {
      if (!ts) return "—";
      var d = new Date(ts);
      var p = function (n) { return n < 10 ? "0" + n : "" + n; };
      return p(d.getDate()) + "/" + p(d.getMonth() + 1) + "/" + d.getFullYear() +
             " · " + p(d.getHours()) + ":" + p(d.getMinutes());
    },

    esc: function (s) {
      return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
        return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
      });
    },

    toast: toast
  };

  window.NasStore = Store;
})();
