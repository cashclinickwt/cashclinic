/* Cash Clinic — mobile navigation (hamburger).
   The desktop nav (.cc-nav-links) is hidden under 900px, so this builds a
   burger button + a drop-down panel that mirrors the same links.
   Links are CLONED, so they keep data-ar/data-en and i18n.js translates them
   (this file must load BEFORE i18n.js) and keep data-quiz-open behaviour. */
(function () {
  var header = document.querySelector('.cc-header');
  var headerIn = document.querySelector('.cc-header-in');
  var navLinks = document.querySelector('.cc-nav-links');
  if (!header || !headerIn || !navLinks) return;

  /* ---- burger button ---- */
  var burger = document.createElement('button');
  burger.type = 'button';
  burger.className = 'cc-burger';
  burger.setAttribute('aria-label', 'القائمة');
  burger.setAttribute('aria-expanded', 'false');
  burger.setAttribute('aria-controls', 'ccMobNav');
  burger.innerHTML = '<span></span><span></span><span></span>';

  var cta = headerIn.querySelector('.cc-header-cta');
  if (cta) cta.insertBefore(burger, cta.firstChild);
  else headerIn.appendChild(burger);

  /* ---- panel ---- */
  var panel = document.createElement('nav');
  panel.className = 'cc-mobnav';
  panel.id = 'ccMobNav';
  panel.hidden = true;

  var list = document.createElement('div');
  list.className = 'cc-mobnav-in';
  var links = navLinks.querySelectorAll('a');
  for (var i = 0; i < links.length; i++) {
    var c = links[i].cloneNode(true);
    c.className = 'cc-moblink';
    list.appendChild(c);
  }
  panel.appendChild(list);
  header.appendChild(panel);

  /* ---- open / close ---- */
  function open() {
    panel.hidden = false;
    /* next frame so the transition runs */
    requestAnimationFrame(function () { panel.classList.add('is-open'); });
    burger.classList.add('is-open');
    burger.setAttribute('aria-expanded', 'true');
  }
  function close() {
    panel.classList.remove('is-open');
    burger.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    setTimeout(function () { if (!panel.classList.contains('is-open')) panel.hidden = true; }, 200);
  }
  function isOpen() { return panel.classList.contains('is-open'); }

  burger.addEventListener('click', function () { isOpen() ? close() : open(); });

  /* close after choosing a link */
  list.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a')) close();
  });

  /* close on outside click / Escape / resize back to desktop */
  document.addEventListener('click', function (e) {
    if (!isOpen()) return;
    if (header.contains(e.target)) return;
    close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) close();
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 900 && isOpen()) close();
  });
})();
