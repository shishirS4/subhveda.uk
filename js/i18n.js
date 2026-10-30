(function() {
  const STORAGE_KEY = 'shubhveda_lang';
  const SUPPORTED = ['en', 'hi', 'ne'];
  const DEFAULT = 'en';
  let sessionLang;

  function getSavedLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return SUPPORTED.includes(saved) ? saved : null;
    } catch {
      return null;
    }
  }

  function detectBrowserLang() {
    const lang = navigator.language || navigator.userLanguage || '';
    const short = lang.split('-')[0].toLowerCase();
    return SUPPORTED.includes(short) ? short : DEFAULT;
  }

  function getCurrentLang() {
    return sessionLang || getSavedLang() || detectBrowserLang();
  }

  function applyTranslations(lang) {
    if (typeof TRANSLATIONS === 'undefined' || !TRANSLATIONS[lang]) return;
    sessionLang = lang;
    const t = TRANSLATIONS[lang];

    // data-i18n: set textContent
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (t[key] !== undefined) el.textContent = t[key];
    });

    // data-i18n-html: set innerHTML
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      if (t[key] !== undefined) el.innerHTML = t[key];
    });

    // data-i18n-placeholder: set placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (t[key] !== undefined) el.placeholder = t[key];
    });

    // data-i18n-title: set title
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (t[key] !== undefined) el.title = t[key];
    });

    // data-i18n-alt: set alt
    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
      const key = el.getAttribute('data-i18n-alt');
      if (t[key] !== undefined) el.alt = t[key];
    });

    // Update html lang attribute
    document.documentElement.lang = lang;

    // Update active button
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang') === lang));
    });
    document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
  }

  function setLang(lang) {
    if (!SUPPORTED.includes(lang)) return;
    try { localStorage.setItem(STORAGE_KEY, lang); } catch { /* Private browsing can disable storage. */ }
    applyTranslations(lang);
  }

  // Expose globally
  window.ShubhVedaI18n = {
    applyTranslations: applyTranslations,
    setLang: setLang,
    getCurrentLang: getCurrentLang
  };

  // Auto-init on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    const lang = getCurrentLang();
    applyTranslations(lang);

    // Listen for language button clicks
    document.addEventListener('click', function(e) {
      const btn = e.target.closest('.lang-btn');
      if (btn) {
        e.preventDefault();
        const lang = btn.getAttribute('data-lang');
        if (lang) setLang(lang);
      }
    });
  });
})();
