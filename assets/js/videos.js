/* Cash Clinic — Ghalia's videos (27 Nov 2026).
   ---------------------------------------------------------------------------
   One list for the whole site. The home page shows the first three, the page
   /videos/ shows them all.

   TO ADD A VIDEO: add one line at the TOP of VIDEOS with the video's id — the
   part after youtu.be/ (or after v=) in its link. Nothing else to change.
   The title is read from YouTube when the page opens; to write your own,
   add  title: "…"  to that line.

   A video is only a picture until the visitor taps it: nothing of YouTube's
   player is loaded before that, so the page stays as fast as it was. The
   player comes from youtube-nocookie.com, which sets no cookie until the
   video is actually played.
   --------------------------------------------------------------------------- */
(function () {
  var VIDEOS = [
    { id: "kxGk6eFIdMo" },
    { id: "aON7kODa1is" },
    { id: "2y28GAWZmCo" },
    { id: "DTJGMQkXmI8" },
    { id: "gywu8x6uXAE" }
  ];

  var ID = /^[A-Za-z0-9_-]{11}$/;
  var WEEK = 7 * 864e5;
  var PLAY = '<span class="ccv-play" aria-hidden="true"><svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.9-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14Z"/></svg></span>';

  /* ---- titles: asked from YouTube once, then kept in this browser for a week ---- */
  function cached(id) {
    try {
      var c = JSON.parse(localStorage.getItem("cc_vt_" + id) || "null");
      if (c && c.t && Date.now() - Number(c.at) < WEEK) return String(c.t);
    } catch (e) {}
    return "";
  }
  function setTitle(card, t) {
    var h = card.querySelector(".ccv-title");
    if (h) { h.textContent = t; h.classList.remove("is-wait"); }
    var b = card.querySelector(".ccv-thumb");
    if (b) b.setAttribute("aria-label", "شغّل الفيديو: " + t);
  }
  function noTitle(card) {
    var h = card.querySelector(".ccv-title");
    if (h && h.classList.contains("is-wait")) { h.textContent = "شاهد الفيديو"; h.classList.remove("is-wait"); }
  }
  function askTitle(id, done, fail) {
    if (!window.fetch) return fail();
    fetch("https://www.youtube.com/oembed?format=json&url=" + encodeURIComponent("https://www.youtube.com/watch?v=" + id))
      .then(function (r) { if (!r.ok) throw new Error("no title"); return r.json(); })
      .then(function (j) {
        var t = String((j && j.title) || "").trim();
        if (!t) throw new Error("no title");
        try { localStorage.setItem("cc_vt_" + id, JSON.stringify({ t: t, at: Date.now() })); } catch (e) {}
        done(t);
      })
      .catch(fail);
  }

  /* ---- one card ---- */
  function card(v) {
    var el = document.createElement("article");
    el.className = "ccv-card";
    var frame = document.createElement("div");
    frame.className = "ccv-frame";
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "ccv-thumb";
    btn.setAttribute("aria-label", "شغّل الفيديو");
    var img = document.createElement("img");
    img.loading = "lazy"; img.decoding = "async"; img.alt = "";
    img.src = "https://i.ytimg.com/vi/" + v.id + "/hqdefault.jpg";
    /* a video that was removed has no picture: the card keeps its shape, in brand purple */
    img.onerror = function () { img.remove(); };
    btn.appendChild(img);
    btn.insertAdjacentHTML("beforeend", PLAY);
    frame.appendChild(btn);
    var h = document.createElement("h3");
    h.className = "ccv-title";
    el.appendChild(frame); el.appendChild(h);

    var own = String(v.title || "").trim(), had = own || cached(v.id);
    if (had) setTitle(el, had);
    else {
      h.classList.add("is-wait"); h.textContent = " ";
      askTitle(v.id, function (t) { setTitle(el, t); }, function () { noTitle(el); });
    }

    btn.addEventListener("click", function () { play(frame, v.id, h.textContent); });
    return el;
  }

  /* ---- playing: one at a time; starting another puts the first back to its picture ---- */
  var playing = null;
  function play(frame, id, title) {
    if (playing && playing.frame !== frame) stop();
    var f = document.createElement("iframe");
    f.src = "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0&playsinline=1";
    f.title = title && title.trim() ? title : "فيديو";
    f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    f.setAttribute("allowfullscreen", "");
    f.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    var btn = frame.querySelector(".ccv-thumb");
    playing = { frame: frame, btn: btn };
    btn.hidden = true;
    frame.appendChild(f);
  }
  function stop() {
    if (!playing) return;
    var f = playing.frame.querySelector("iframe");
    if (f) f.remove();
    playing.btn.hidden = false;
    playing = null;
  }

  function fill() {
    var list = VIDEOS.filter(function (v) { return v && ID.test(v.id || ""); });
    var boxes = document.querySelectorAll("[data-cc-videos]");
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i], n = Number(box.getAttribute("data-limit")) || list.length;
      box.textContent = "";
      var show = list.slice(0, n);
      for (var k = 0; k < show.length; k++) box.appendChild(card(show[k]));
      /* the section hides itself rather than stand empty */
      var sec = box.closest("[data-cc-videos-section]");
      if (sec) sec.hidden = !show.length;
      var more = document.querySelectorAll("[data-cc-videos-count]");
      for (var m = 0; m < more.length; m++) more[m].textContent = String(list.length);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fill);
  else fill();
})();
