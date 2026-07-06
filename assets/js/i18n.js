/* Cash Clinic — bilingual (AR default / EN) toggle + WhatsApp link builder.
   Any element with BOTH data-ar and data-en gets its text swapped by JS.
   The element's own text content should be the Arabic (no-JS fallback = Arabic).
   Language is stored in localStorage('cc-lang'); default 'ar'.
   <html> gets data-lang + dir + lang.
   Any <a class="wa" data-wa-msg="..."> gets a wa.me href with the Arabic message. */
(function () {
  var WA_NUMBER = '96522260820';
  var STORE = 'cc-lang';

  function currentLang() {
    try { return localStorage.getItem(STORE) === 'en' ? 'en' : 'ar'; }
    catch (e) { return 'ar'; }
  }

  function swapText(lang) {
    var els = document.querySelectorAll('[data-ar][data-en]');
    for (var i = 0; i < els.length; i++) {
      var v = els[i].getAttribute('data-' + lang);
      if (v !== null) els[i].textContent = v;
    }
  }

  function applyLang(lang) {
    var html = document.documentElement;
    html.setAttribute('data-lang', lang);
    html.setAttribute('lang', lang);
    html.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    swapText(lang);
    var btns = document.querySelectorAll('[data-langbtn]');
    for (var i = 0; i < btns.length; i++) btns[i].textContent = lang === 'ar' ? 'EN' : 'ع';
    try { localStorage.setItem(STORE, lang); } catch (e) {}
  }

  function toggle() { applyLang(currentLang() === 'ar' ? 'en' : 'ar'); }

  function buildWhatsApp() {
    var links = document.querySelectorAll('a.wa');
    for (var i = 0; i < links.length; i++) {
      var msg = links[i].getAttribute('data-wa-msg') || '';
      var href = 'https://wa.me/' + WA_NUMBER + (msg ? '?text=' + encodeURIComponent(msg) : '');
      links[i].setAttribute('href', href);
      links[i].setAttribute('target', '_blank');
      links[i].setAttribute('rel', 'noopener');
    }
  }

  function init() {
    applyLang(currentLang());
    buildWhatsApp();
    var btns = document.querySelectorAll('[data-langbtn]');
    for (var i = 0; i < btns.length; i++) btns[i].addEventListener('click', toggle);
  }

  window.CC = { applyLang: applyLang, toggle: toggle, buildWhatsApp: buildWhatsApp, WA_NUMBER: WA_NUMBER, lang: currentLang };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
