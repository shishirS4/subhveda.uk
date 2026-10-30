(function () {
  'use strict';

  const P = window.ShubhPanchang;
  if (!P) return;
  const K = window.ShubhKundali;

  const YEAR = 2026;
  const DAY = 86400000;
  const CITY_KEY = 'shubhveda_panchang_city';
  const LOCAL_KEY = 'shubhveda_panchang_local';
  const TABS = ['festivals', 'vrat', 'grahan', 'gochar', 'muhurat'];

  const MONTHS = {
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    hi: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'],
    ne: ['जनवरी', 'फेब्रुअरी', 'मार्च', 'अप्रिल', 'मे', 'जुन', 'जुलाई', 'अगस्ट', 'सेप्टेम्बर', 'अक्टोबर', 'नोभेम्बर', 'डिसेम्बर']
  };
  const WEEKDAYS_SHORT = {
    en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    hi: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
    ne: ['आइत', 'सोम', 'मंगल', 'बुध', 'बिही', 'शुक्र', 'शनि']
  };
  const WEEKDAYS_LONG = {
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    hi: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'],
    ne: ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार']
  };

  let lang = 'en';
  let city = null;
  let cityId = 'delhi';
  let localCity = null;
  let activeTab = 'festivals';
  const rendered = {};
  let vratCache = { id: '', data: null };
  let lunations = null;
  let gocharCache = null;
  let retroCache = null;
  let muhuratEvent = 'vivah';
  let muhuratWindow = 60;

  const LUNAR_MONTHS = {
    en: ['Chaitra', 'Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada', 'Ashwina', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna'],
    hi: ['चैत्र', 'वैशाख', 'ज्येष्ठ', 'आषाढ़', 'श्रावण', 'भाद्रपद', 'आश्विन', 'कार्तिक', 'मार्गशीर्ष', 'पौष', 'माघ', 'फाल्गुन'],
    ne: ['चैत', 'वैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कात्तिक', 'मंसिर', 'पुष', 'माघ', 'फाल्गुन']
  };

  const ADHIKA = { en: 'Adhika', hi: 'अधिक', ne: 'अधिक' };

  // [Shukla, Krishna] by amanta lunar month, Chaitra first.
  const EKADASHI = {
    en: [
      ['Kamada', 'Papmochani'], ['Mohini', 'Varuthini'], ['Nirjala', 'Apara'], ['Devshayani', 'Yogini'],
      ['Putrada', 'Kamika'], ['Parsva', 'Aja'], ['Papankusha', 'Indira'], ['Devutthana', 'Rama'],
      ['Mokshada', 'Utpanna'], ['Pausha Putrada', 'Saphala'], ['Jaya', 'Shattila'], ['Amalaki', 'Vijaya']
    ],
    hi: [
      ['कामदा', 'पापमोचनी'], ['मोहिनी', 'वरूथिनी'], ['निर्जला', 'अपरा'], ['देवशयनी', 'योगिनी'],
      ['पुत्रदा', 'कामिका'], ['पार्श्व', 'अजा'], ['पापांकुशा', 'इन्दिरा'], ['देवोत्थानी', 'रामा'],
      ['मोक्षदा', 'उत्पन्ना'], ['पौष पुत्रदा', 'सफला'], ['जया', 'षटतिला'], ['आमलकी', 'विजया']
    ],
    ne: [
      ['कामदा', 'पापमोचनी'], ['मोहिनी', 'वरूथिनी'], ['निर्जला', 'अपरा'], ['देवशयनी', 'योगिनी'],
      ['पुत्रदा', 'कामिका'], ['पार्श्व', 'अजा'], ['पापाङ्कुशा', 'इन्दिरा'], ['देवोत्थानी', 'रामा'],
      ['मोक्षदा', 'उत्पन्ना'], ['पौष पुत्रदा', 'सफला'], ['जया', 'षटतिला'], ['आमलकी', 'विजया']
    ]
  };
  const ADHIKA_EK = { en: ['Padmini', 'Parama'], hi: ['पद्मिनी', 'परमा'], ne: ['पद्मिनी', 'परमा'] };

  const FESTIVALS = [
    { m: 1, d: 14, key: 'fest_makar', en: 'Makar Sankranti' },
    { m: 1, d: 23, key: 'fest_vasant', en: 'Vasant Panchami' },
    { m: 2, d: 15, key: 'fest_shivratri', en: 'Maha Shivratri' },
    { m: 3, d: 3, key: 'fest_holika', en: 'Holika Dahan' },
    { m: 3, d: 4, key: 'fest_holi', en: 'Holi' },
    { m: 3, d: 19, key: 'fest_navratri_chaitra', en: 'Chaitra Navratri begins' },
    { m: 3, d: 26, key: 'fest_ram_navami', en: 'Ram Navami' },
    { m: 4, d: 2, key: 'fest_hanuman', en: 'Hanuman Jayanti' },
    { m: 4, d: 19, key: 'fest_akshaya', en: 'Akshaya Tritiya' },
    { m: 5, d: 1, key: 'fest_buddha', en: 'Buddha Purnima' },
    { m: 6, d: 25, key: 'fest_nirjala', en: 'Nirjala Ekadashi' },
    { m: 7, d: 16, key: 'fest_rath', en: 'Jagannath Rath Yatra' },
    { m: 7, d: 25, key: 'fest_devshayani', en: 'Devshayani Ekadashi' },
    { m: 7, d: 29, key: 'fest_guru_purnima', en: 'Guru Purnima' },
    { m: 8, d: 28, key: 'fest_raksha', en: 'Raksha Bandhan' },
    { m: 9, d: 4, key: 'fest_janmashtami', en: 'Krishna Janmashtami' },
    { m: 9, d: 14, key: 'fest_ganesh', en: 'Ganesh Chaturthi' },
    { m: 10, d: 11, key: 'fest_navratri_sharad', en: 'Sharad Navratri begins' },
    { m: 10, d: 20, key: 'fest_dussehra', en: 'Vijayadashami' },
    { m: 10, d: 25, key: 'fest_sharad_purnima', en: 'Sharad Purnima' },
    { m: 10, d: 28, key: 'fest_karwa', en: 'Karwa Chauth' },
    { m: 11, d: 6, key: 'fest_dhanteras', en: 'Dhanteras' },
    { m: 11, d: 8, key: 'fest_diwali', en: 'Diwali' },
    { m: 11, d: 9, key: 'fest_govardhan', en: 'Govardhan Puja' },
    { m: 11, d: 11, key: 'fest_bhai_dooj', en: 'Bhai Dooj' },
    { m: 11, d: 15, key: 'fest_chhath', en: 'Chhath Puja' },
    { m: 11, d: 24, key: 'fest_guru_nanak', en: 'Guru Nanak Jayanti' },
    { m: 12, d: 20, key: 'fest_gita', en: 'Mokshada Ekadashi (Gita Jayanti)' }
  ];

  const FESTIVALS_NP = [
    { m: 1, d: 14, key: 'fest_np_maghe', en: 'Maghe Sankranti' },
    { m: 1, d: 23, key: 'fest_np_saraswati', en: 'Saraswati Puja' },
    { m: 2, d: 15, key: 'fest_shivratri', en: 'Maha Shivaratri' },
    { m: 3, d: 3, key: 'fest_np_fagu', en: 'Fagu Purnima' },
    { m: 3, d: 19, key: 'fest_navratri_chaitra', en: 'Chaitra Navratri begins' },
    { m: 3, d: 26, key: 'fest_ram_navami', en: 'Ram Navami' },
    { m: 4, d: 2, key: 'fest_hanuman', en: 'Hanuman Jayanti' },
    { m: 4, d: 19, key: 'fest_akshaya', en: 'Akshaya Tritiya' },
    { m: 5, d: 1, key: 'fest_np_buddha', en: 'Buddha Jayanti' },
    { m: 6, d: 25, key: 'fest_nirjala', en: 'Nirjala Ekadashi' },
    { m: 7, d: 16, key: 'fest_rath', en: 'Jagannath Rath Yatra' },
    { m: 7, d: 25, key: 'fest_np_harishayani', en: 'Harishayani Ekadashi' },
    { m: 7, d: 29, key: 'fest_guru_purnima', en: 'Guru Purnima' },
    { m: 8, d: 28, key: 'fest_np_janai', en: 'Janai Purnima' },
    { m: 9, d: 4, key: 'fest_janmashtami', en: 'Krishna Janmashtami' },
    { m: 9, d: 14, key: 'fest_ganesh', en: 'Ganesh Chaturthi' },
    { m: 10, d: 11, key: 'fest_np_ghatasthapana', en: 'Ghatasthapana' },
    { m: 10, d: 17, key: 'fest_np_fulpati', en: 'Fulpati' },
    { m: 10, d: 18, key: 'fest_np_ashtami', en: 'Maha Ashtami' },
    { m: 10, d: 19, key: 'fest_np_navami', en: 'Maha Navami' },
    { m: 10, d: 20, key: 'fest_np_dashami', en: 'Vijaya Dashami' },
    { m: 10, d: 25, key: 'fest_np_kojagrat', en: 'Kojagrat Purnima' },
    { m: 11, d: 6, key: 'fest_dhanteras', en: 'Dhanteras' },
    { m: 11, d: 8, key: 'fest_np_laxmi', en: 'Laxmi Puja' },
    { m: 11, d: 9, key: 'fest_np_gai', en: 'Gai Tihar' },
    { m: 11, d: 11, key: 'fest_np_bhai', en: 'Bhai Tika' },
    { m: 11, d: 15, key: 'fest_chhath', en: 'Chhath Puja' },
    { m: 11, d: 24, key: 'fest_guru_nanak', en: 'Guru Nanak Jayanti' },
    { m: 12, d: 20, key: 'fest_gita', en: 'Mokshada Ekadashi' }
  ];

  const ECLIPSES = [
    {
      m: 2, d: 17, body: 'sun', kindKey: 'cal_grahan_annular', vis: 'no',
      greatest: Date.UTC(2026, 1, 17, 12, 12), visKey: 'cal_ecl1_vis', visEn: 'Not visible in India — visible in Antarctica, southern South America and southern Africa.',
      visNpKey: 'cal_ecl1_vis_np', visNpEn: 'Not visible in Nepal — visible in Antarctica, southern South America and southern Africa.'
    },
    {
      m: 3, d: 3, body: 'moon', kindKey: 'cal_grahan_total', vis: 'partly',
      greatest: Date.UTC(2026, 2, 3, 11, 34), visKey: 'cal_ecl2_vis', visEn: 'Partly visible in India — the closing phase is seen after moonrise; the penumbral shadow ends around 7:53 pm IST.',
      visNpKey: 'cal_ecl2_vis_np', visNpEn: 'Partly visible in Nepal — the closing phase is seen after moonrise; the penumbral shadow ends around 8:08 pm NPT.'
    },
    {
      m: 8, d: 12, body: 'sun', kindKey: 'cal_grahan_total', vis: 'no',
      greatest: Date.UTC(2026, 7, 12, 17, 46), visKey: 'cal_ecl3_vis', visEn: 'Not visible in India — total over Greenland, Iceland and Spain; partial across Europe and North Africa.',
      visNpKey: 'cal_ecl3_vis_np', visNpEn: 'Not visible in Nepal — total over Greenland, Iceland and Spain; partial across Europe and North Africa.'
    },
    {
      m: 8, d: 28, body: 'moon', kindKey: 'cal_grahan_partial', vis: 'no',
      greatest: Date.UTC(2026, 7, 28, 4, 13), visKey: 'cal_ecl4_vis', visEn: 'Not visible in India — visible across the Americas, Europe and Africa.',
      visNpKey: 'cal_ecl4_vis_np', visNpEn: 'Not visible in Nepal — visible across the Americas, Europe and Africa.'
    }
  ];

  const GRAHAS = ['sun', 'moon', 'mars', 'mercury', 'jupiter', 'venus', 'saturn', 'rahu', 'ketu'];
  const RETRO = ['mercury', 'venus', 'mars', 'jupiter', 'saturn'];

  const BAD_TITHI = [3, 7, 8, 10, 13, 18, 22, 23, 25, 28, 29];
  const NAK_ALLOWED = {
    vivah: [3, 4, 11, 12, 14, 16, 20, 21, 22, 25, 26],
    griha: [3, 4, 11, 12, 13, 14, 16, 20, 21, 22, 25, 26],
    vehicle: [0, 3, 4, 6, 7, 12, 13, 14, 16, 21, 22, 26],
    namkaran: [3, 4, 5, 7, 11, 12, 13, 14, 16, 20, 23, 25, 26]
  };
  const RAHU_SEGMENT = [7, 1, 6, 4, 5, 3, 2];

  function el(id) { return document.getElementById(id); }

  function currentLang() {
    try {
      if (window.ShubhVedaI18n) return window.ShubhVedaI18n.getCurrentLang();
    } catch (e) {}
    return 'en';
  }

  function t(key, fallback) {
    const dict = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[lang]) || {};
    const en = (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS.en) || {};
    return dict[key] || en[key] || fallback || key;
  }

  function esc(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function svgIcon(name, size) {
    const icon = (window.SHUBH_ICONS || {})[name];
    if (!icon) return '';
    const s = size || 20;
    return '<svg viewBox="' + icon.vb + '" width="' + s + '" height="' + s + '" aria-hidden="true">' + icon.b + '</svg>';
  }

  function monthLong(m) { return MONTHS[lang][m]; }
  function dayShort(date) { return date.getUTCDate() + ' ' + MONTHS[lang][date.getUTCMonth()]; }
  function dayOnly(date) { return String(date.getUTCDate()); }
  function weekdayShort(date) { return WEEKDAYS_SHORT[lang][date.getUTCDay()]; }
  function weekdayLong(date) { return WEEKDAYS_LONG[lang][date.getUTCDay()]; }
  function dateLong(date) {
    return date.getUTCDate() + ' ' + MONTHS[lang][date.getUTCMonth()] + ' ' + date.getUTCFullYear();
  }
  function dateMedium(date, withYear) {
    return date.getUTCDate() + ' ' + MONTHS[lang][date.getUTCMonth()] + (withYear ? ' ' + date.getUTCFullYear() : '');
  }
  function clock(date) {
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit', minute: '2-digit', hour12: false, timeZone: city.tz
    }).format(date);
  }
  function zoneAbbr(date) {
    if (city.tz === 'Asia/Kolkata') return 'IST';
    if (city.tz === 'Asia/Kathmandu') return 'NPT';
    try {
      const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: city.tz, timeZoneName: 'short'
      }).formatToParts(date || new Date());
      const zone = parts.find(function (p) { return p.type === 'timeZoneName'; });
      return zone ? zone.value : city.tz;
    } catch (e) { return city.tz; }
  }

  function norm(n) { return ((n % 30) + 30) % 30; }

  function formatDegree(lon) {
    const within = norm(lon);
    let d = Math.floor(within);
    let m = Math.round((within - d) * 60);
    if (m === 60) { d += 1; m = 0; }
    return d + '\u00B0' + String(m).padStart(2, '0') + '\u2032';
  }

  function readLocalCity() {
    try {
      const saved = JSON.parse(localStorage.getItem(LOCAL_KEY) || 'null');
      if (!saved || !isFinite(saved.lat) || !isFinite(saved.lon) || !saved.tz) return null;
      const label = saved.name || 'My location';
      const country = saved.tz === 'Asia/Kolkata' ? 'India' : saved.tz === 'Asia/Kathmandu' ? 'Nepal' : '';
      return {
        id: 'local', lat: Number(saved.lat), lon: Number(saved.lon), tz: saved.tz, country: country,
        name: { en: label, hi: label, ne: label }
      };
    } catch (e) { return null; }
  }

  function countryName(code) {
    if (code === 'India') return t('cal_country_india', 'India');
    if (code === 'Nepal') return t('cal_country_nepal', 'Nepal');
    return code || t('cal_country_other', 'Other locations');
  }

  function cityLabel(c) {
    const name = (c.name && (c.name[lang] || c.name.en)) || c.id;
    if (!c.country) return name;
    if (c.country === 'India' || c.country === 'Nepal') {
      return name + ', ' + (c.admin1 || countryName(c.country));
    }
    return name + ', ' + c.country;
  }

  function referenceName() {
    const code = city && city.country;
    if (code === 'Nepal') return t('cal_reference_himal', 'Himal Panchang');
    if (code === 'India') return t('cal_reference_diwakar', 'Panchang Diwakar');
    return t('cal_reference_sidereal', 'Nirayana panchang');
  }

  function updateReference() {
    const chip = el('cal-reference');
    if (chip) chip.textContent = t('cal_reference_label', 'Reference') + ': ' + referenceName();
    const festivals = el('cal-fest-source');
    if (festivals) {
      const code = city && city.country;
      festivals.textContent = code === 'Nepal'
        ? t('cal_fest_source_himal', 'Festival dates follow Himal Panchang for Nepal; regional traditions can vary by a day.')
        : code === 'India'
          ? t('cal_fest_source_diwakar', 'Festival dates follow Panchang Diwakar for India; regional traditions can vary by a day.')
          : t('cal_fest_source_sidereal', 'Festival dates follow the nirayana sidereal panchang; local traditions can vary by a day.');
    }
    const muhurat = el('cal-muhurat-source');
    if (muhurat) {
      muhurat.textContent = t('cal_muhurat_source', 'Windows use sunrise, sunset and the {ref} reference for the selected city.')
        .replace('{ref}', referenceName());
    }
  }

  function buildCities() {
    const list = [];
    const seen = {};
    function push(c) {
      if (!c || !isFinite(c.lat) || !isFinite(c.lon)) return;
      const key = Number(c.lat).toFixed(2) + ',' + Number(c.lon).toFixed(2);
      if (seen[key]) return;
      seen[key] = true;
      list.push(c);
    }
    if (localCity) push(localCity);
    P.CITIES.forEach(push);
    (P.REGION_CITIES || []).forEach(push);
    return list;
  }

  function fillCities() {
    const select = el('cal-city');
    if (!select) return;
    const list = buildCities();
    const groups = { India: [], Nepal: [], other: [] };
    list.forEach(function (c) {
      if (c.country === 'India') groups.India.push(c);
      else if (c.country === 'Nepal') groups.Nepal.push(c);
      else groups.other.push(c);
    });
    function group(label, items) {
      if (!items.length) return '';
      return '<optgroup label="' + esc(label) + '">' + items.map(function (c) {
        return '<option value="' + esc(c.id) + '">' + esc(cityLabel(c)) + '</option>';
      }).join('') + '</optgroup>';
    }
    select.innerHTML =
      group(countryName('India'), groups.India) +
      group(countryName('Nepal'), groups.Nepal) +
      group(t('cal_country_other', 'Other locations'), groups.other);
    if (!list.some(function (c) { return c.id === cityId; })) cityId = 'delhi';
    select.value = cityId;
    city = list.find(function (c) { return c.id === cityId; }) || list[0];
    updateReference();
  }

  function civil(parts) { return new Date(Date.UTC(parts.y, parts.m, parts.d)); }
  function addDays(parts, n) {
    const d = new Date(Date.UTC(parts.y, parts.m, parts.d) + n * DAY);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() };
  }
  function todayParts(tz) {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
    const p = {};
    f.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
    return { y: Number(p.year), m: Number(p.month) - 1, d: Number(p.day) };
  }

  /* ---------------- Lunar month model ---------------- */

  function relAt(date) { return P.panchangAt(date).rel; }

  function findNewMoon(fromMs) {
    let t = fromMs;
    let prev = relAt(new Date(t));
    for (let i = 0; i < 24 * 45; i++) {
      const nt = t + 3600e3;
      const cur = relAt(new Date(nt));
      if (prev > 300 && cur < 60) {
        let lo = t, hi = nt;
        for (let k = 0; k < 34; k++) {
          const mid = (lo + hi) / 2;
          if (relAt(new Date(mid)) < 180) hi = mid; else lo = mid;
        }
        return new Date((lo + hi) / 2);
      }
      t = nt;
      prev = cur;
    }
    return null;
  }

  function buildLunations() {
    const list = [];
    let t = Date.UTC(YEAR - 1, 9, 1);
    const limit = Date.UTC(YEAR + 1, 2, 1);
    while (true) {
      const nm = findNewMoon(t);
      if (!nm || nm.getTime() > limit) break;
      const jd = nm.getTime() / DAY + 2440587.5;
      list.push({ start: nm, idx: (Math.floor(P.sunSidereal(jd) / 30) + 1) % 12, adhika: false });
      t = nm.getTime() + 5 * DAY;
    }
    for (let i = 1; i < list.length; i++) {
      if (list[i].idx === list[i - 1].idx) list[i - 1].adhika = true;
    }
    return list;
  }

  function lunationFor(date) {
    if (!lunations) return null;
    const t = date.getTime();
    for (let i = 0; i < lunations.length; i++) {
      const start = lunations[i].start.getTime();
      const end = i + 1 < lunations.length ? lunations[i + 1].start.getTime() : Infinity;
      if (t >= start && t < end) return lunations[i];
    }
    return null;
  }

  function lunarLabel(idx, adhika) {
    return (adhika ? ADHIKA[lang] + ' ' : '') + LUNAR_MONTHS[lang][idx];
  }

  /* ---------------- Vrat scan ---------------- */

  function dedupe(list, keep) {
    const out = [];
    for (let i = 0; i < list.length; i++) {
      const next = list[i + 1];
      if (next && next.date.getTime() - list[i].date.getTime() === DAY) {
        if (keep === 'last') continue;
        out.push(list[i]);
        i += 1;
        continue;
      }
      out.push(list[i]);
    }
    return out;
  }

  function scanVrat() {
    if (vratCache.id === city.id && vratCache.data) return vratCache.data;
    const flat = { ekS: [], ekK: [], purnima: [], amavasya: [], pradosh: [] };
    for (let m = 0; m < 12; m++) {
      const days = new Date(Date.UTC(YEAR, m + 1, 0)).getUTCDate();
      for (let d = 1; d <= days; d++) {
        const parts = { y: YEAR, m: m, d: d };
        const st = P.sunTimesFor(parts, city);
        if (!st) continue;
        const date = new Date(Date.UTC(YEAR, m, d));
        const sr = P.panchangAt(new Date(st.sunrise.getTime() + 60e3));
        const md = P.panchangAt(new Date((st.sunrise.getTime() + st.sunset.getTime()) / 2 + 30 * 60e3));
        const pr = P.panchangAt(new Date(st.sunset.getTime() + 3600e3));
        if (sr.tithi === 10) flat.ekS.push({ date: date, tithi: 10, m: m, d: d });
        if (sr.tithi === 25) flat.ekK.push({ date: date, tithi: 25, m: m, d: d });
        if (sr.tithi === 29) flat.amavasya.push({ date: date, tithi: 29, m: m, d: d });
        if (md.tithi === 14) flat.purnima.push({ date: date, tithi: 14, m: m, d: d });
        if (pr.tithi === 12 || pr.tithi === 27) flat.pradosh.push({ date: date, m: m, d: d });
      }
    }
    flat.ekS = dedupe(flat.ekS, 'last');
    flat.ekK = dedupe(flat.ekK, 'last');
    flat.purnima = dedupe(flat.purnima, 'first');
    flat.amavasya = dedupe(flat.amavasya, 'first');
    flat.pradosh = dedupe(flat.pradosh, 'first');

    const rows = [];
    for (let m = 0; m < 12; m++) {
      rows.push({
        m: m,
        ekS: flat.ekS.filter(function (x) { return x.m === m; }),
        ekK: flat.ekK.filter(function (x) { return x.m === m; }),
        purnima: flat.purnima.filter(function (x) { return x.m === m; }),
        amavasya: flat.amavasya.filter(function (x) { return x.m === m; }),
        pradosh: flat.pradosh.filter(function (x) { return x.m === m; })
      });
    }
    vratCache = { id: city.id, data: rows };
    return rows;
  }

  function ekadashiName(entry) {
    const lun = lunationFor(new Date(entry.date.getTime() + 12 * 3600e3));
    if (!lun) return '';
    const nameIdx = entry.tithi === 10 ? 0 : 1;
    if (lun.adhika) return ADHIKA_EK[lang][nameIdx];
    const idx = entry.tithi === 10 ? lun.idx : (lun.idx + 1) % 12;
    return EKADASHI[lang][idx][nameIdx];
  }

  function purnimaName(entry) {
    const lun = lunationFor(new Date(entry.date.getTime() + 12 * 3600e3));
    if (!lun) return '';
    return lunarLabel(lun.idx, lun.adhika) + ' ' + t('cal_purnima', 'Purnima');
  }

  function amavasyaName(entry) {
    const lun = lunationFor(entry.date);
    if (!lun) return '';
    return lunarLabel(lun.idx, lun.adhika) + ' ' + t('cal_amavasya', 'Amavasya');
  }

  function cellEntry(date, name) {
    return '<span class="cal-cell"><strong>' + esc(dayShort(date)) + '</strong>' +
      (name ? '<small>' + esc(name) + '</small>' : '') + '</span>';
  }

  function renderVrat() {
    const wrap = el('cal-vrat');
    if (!wrap) return;
    const rows = scanVrat();
    let html = '<table class="cal-table cal-vrat-table"><thead><tr>' +
      '<th scope="col">' + esc(t('cal_th_month', 'Month')) + '</th>' +
      '<th scope="col">' + esc(t('cal_th_ekadashi_s', 'Ekadashi · Shukla')) + '</th>' +
      '<th scope="col">' + esc(t('cal_th_ekadashi_k', 'Ekadashi · Krishna')) + '</th>' +
      '<th scope="col">' + esc(t('cal_th_purnima', 'Purnima')) + '</th>' +
      '<th scope="col">' + esc(t('cal_th_amavasya', 'Amavasya')) + '</th>' +
      '<th scope="col">' + esc(t('cal_th_pradosh', 'Pradosh')) + '</th>' +
      '</tr></thead><tbody>';
    rows.forEach(function (row) {
      const cells = [
        ['cal_th_ekadashi_s', 'Ekadashi · Shukla', row.ekS.map(function (x) { return cellEntry(x.date, ekadashiName(x)); }).join('')],
        ['cal_th_ekadashi_k', 'Ekadashi · Krishna', row.ekK.map(function (x) { return cellEntry(x.date, ekadashiName(x)); }).join('')],
        ['cal_th_purnima', 'Purnima', row.purnima.map(function (x) { return cellEntry(x.date, purnimaName(x)); }).join('')],
        ['cal_th_amavasya', 'Amavasya', row.amavasya.map(function (x) { return cellEntry(x.date, amavasyaName(x)); }).join('')],
        ['cal_th_pradosh', 'Pradosh', row.pradosh.length
          ? '<span class="cal-pradosh">' + row.pradosh.map(function (x) { return esc(dayOnly(x.date)); }).join(' \u00B7 ') + '</span>'
          : '<span class="cal-muted">\u2014</span>']
      ];
      html += '<tr><th scope="row">' + esc(monthLong(row.m)) + '</th>';
      cells.forEach(function (cell) {
        html += '<td data-label="' + esc(t(cell[0], cell[1])) + '">' + (cell[2] || '<span class="cal-muted">\u2014</span>') + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }

  /* ---------------- Festivals ---------------- */

  function renderFestivals() {
    const wrap = el('cal-festivals');
    if (!wrap) return;
    const list = city && city.country === 'Nepal' ? FESTIVALS_NP : FESTIVALS;
    let html = '';
    for (let m = 1; m <= 12; m++) {
      const items = list.filter(function (f) { return f.m === m; });
      if (!items.length) continue;
      html += '<section class="cal-fest-month"><h4><span>' + esc(monthLong(m - 1)) + '</span><small>2026</small></h4>' +
        '<ul class="cal-fest-list">';
      items.forEach(function (f) {
        const date = new Date(Date.UTC(YEAR, f.m - 1, f.d));
        html += '<li class="cal-fest-item">' +
          '<span class="cal-fest-date"><strong>' + esc(dayOnly(date)) + '</strong><small>' + esc(weekdayShort(date)) + '</small></span>' +
          '<span class="cal-fest-name">' + esc(t(f.key, f.en)) + '</span>' +
          '</li>';
      });
      html += '</ul></section>';
    }
    wrap.innerHTML = html;
  }

  /* ---------------- Eclipses ---------------- */

  function renderEclipses() {
    const wrap = el('cal-eclipses');
    if (!wrap) return;
    const code = city && city.country;
    const place = code === 'India' || code === 'Nepal' ? countryName(code) : t('cal_country_your', 'your location');
    const visibility = t('cal_visibility_in', 'Visible in {country}').replace('{country}', place);
    wrap.innerHTML = ECLIPSES.map(function (e) {
      const date = new Date(Date.UTC(YEAR, e.m - 1, e.d));
      const badgeClass = e.vis === 'no' ? 'is-no' : e.vis === 'partly' ? 'is-partly' : 'is-yes';
      const badge = e.vis === 'no' ? t('cal_grahan_no', 'No') : e.vis === 'partly' ? t('cal_grahan_partly', 'Partly') : t('cal_grahan_yes', 'Yes');
      const body = e.body === 'sun' ? t('cal_grahan_solar', 'Solar eclipse') : t('cal_grahan_lunar', 'Lunar eclipse');
      const vis = code === 'Nepal'
        ? t(e.visNpKey, e.visNpEn)
        : code === 'India'
          ? t(e.visKey, e.visEn)
          : t('cal_ecl_other_vis', 'Local visibility and sutak depend on where you are; follow your local panchang.');
      return '<article class="cal-eclipse-card">' +
        '<div class="cal-eclipse-top"><span class="cal-eclipse-icon">' + svgIcon(e.body, 22) + '</span>' +
        '<span class="cal-eclipse-date">' + esc(dateLong(date)) + '</span>' +
        '<span class="cal-eclipse-badge ' + badgeClass + '">' + esc(visibility) + ': ' + esc(badge) + '</span></div>' +
        '<h4>' + esc(t(e.kindKey, 'Eclipse')) + ' \u00B7 ' + esc(body) + '</h4>' +
        '<p class="cal-eclipse-time"><span>' + esc(t('cal_grahan_greatest', 'Greatest')) + '</span><strong>' + esc(clock(new Date(e.greatest))) + ' ' + esc(zoneAbbr(new Date(e.greatest))) + '</strong></p>' +
        '<p class="cal-eclipse-vis">' + esc(vis) + '</p>' +
        '</article>';
    }).join('');
  }

  /* ---------------- Gochar ---------------- */

  function nextIngress(id) {
    const now = new Date();
    const sign0 = Math.floor(K.siderealPlanetsAt(now)[id] / 30);
    let prev = now.getTime();
    for (let i = 1; i <= 1300; i++) {
      const t = prev + DAY;
      const sign = Math.floor(K.siderealPlanetsAt(new Date(t))[id] / 30);
      if (sign !== sign0) {
        let lo = t - DAY, hi = t;
        while (hi - lo > 3600e3) {
          const mid = (lo + hi) / 2;
          if (Math.floor(K.siderealPlanetsAt(new Date(mid))[id] / 30) === sign0) lo = mid; else hi = mid;
        }
        return new Date(hi);
      }
      prev = t;
    }
    return null;
  }

  function getGochar() {
    if (gocharCache) return gocharCache;
    const now = new Date();
    const pos = K.siderealPlanetsAt(now);
    gocharCache = {
      now: now,
      rows: GRAHAS.map(function (id) {
        const lon = pos[id];
        return {
          id: id,
          lon: lon,
          sign: Math.floor(lon / 30),
          nak: Math.floor(lon / (360 / 27)),
          retro: K.isRetrograde(id, now),
          until: nextIngress(id)
        };
      })
    };
    return gocharCache;
  }

  function planetName(id) {
    return t('cal_planet_' + id, id.charAt(0).toUpperCase() + id.slice(1));
  }

  function renderGochar() {
    const wrap = el('cal-gochar');
    if (!wrap) return;
    const data = getGochar();
    let html = '<p class="cal-asof">' + esc(t('cal_gochar_asof', 'As of')) + ' ' +
      esc(dateLong(new Date(Date.UTC(data.now.getFullYear(), data.now.getMonth(), data.now.getDate())))) +
      ' \u00B7 ' + esc(referenceName()) + '</p>';
    html += '<table class="cal-table cal-gochar-table"><thead><tr>' +
      '<th scope="col">' + esc(t('cal_th_graha', 'Graha')) + '</th>' +
      '<th scope="col">' + esc(t('cal_th_rashi', 'Rashi')) + '</th>' +
      '<th scope="col">' + esc(t('cal_th_degree', 'Degree')) + '</th>' +
      '<th scope="col">' + esc(t('cal_th_nakshatra', 'Nakshatra')) + '</th>' +
      '<th scope="col">' + esc(t('cal_th_motion', 'Motion')) + '</th>' +
      '<th scope="col">' + esc(t('cal_th_until', 'In rashi until')) + '</th>' +
      '</tr></thead><tbody>';
    data.rows.forEach(function (r) {
      const motion = r.retro
        ? '<span class="cal-motion is-retro">' + esc(t('cal_retrograde', 'Retrograde')) + '</span>'
        : '<span class="cal-motion">' + esc(t('cal_direct', 'Direct')) + '</span>';
      const until = r.until ? dateMedium(r.until, r.until.getUTCFullYear() !== YEAR) : '\u2014';
      html += '<tr>' +
        '<th scope="row">' + esc(planetName(r.id)) + '</th>' +
        '<td data-label="' + esc(t('cal_th_rashi', 'Rashi')) + '">' + esc(P.NAMES.rashi[lang][r.sign]) + '</td>' +
        '<td data-label="' + esc(t('cal_th_degree', 'Degree')) + '" class="cal-num">' + esc(formatDegree(r.lon)) + '</td>' +
        '<td data-label="' + esc(t('cal_th_nakshatra', 'Nakshatra')) + '">' + esc(P.NAMES.nakshatra[lang][r.nak]) + '</td>' +
        '<td data-label="' + esc(t('cal_th_motion', 'Motion')) + '">' + motion + '</td>' +
        '<td data-label="' + esc(t('cal_th_until', 'In rashi until')) + '" class="cal-num">' + esc(until) + '</td>' +
        '</tr>';
    });
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }

  /* ---------------- Retrograde ---------------- */

  function refineTransition(id, lo, hi, state) {
    for (let k = 0; k < 32; k++) {
      const mid = (lo + hi) / 2;
      if (K.isRetrograde(id, new Date(mid)) === state) lo = mid; else hi = mid;
    }
    return hi;
  }

  function getRetro() {
    if (retroCache) return retroCache;
    const from = Date.UTC(YEAR - 1, 0, 1, 12);
    const to = Date.UTC(YEAR + 1, 11, 31, 12);
    const out = {};
    RETRO.forEach(function (id) {
      const periods = [];
      let open = null;
      let prevState = null;
      for (let t = from; t <= to; t += DAY) {
        const state = K.isRetrograde(id, new Date(t));
        if (prevState === false && state === true) open = refineTransition(id, t - DAY, t, false);
        else if (prevState === true && state === false && open !== null) {
          periods.push({ start: new Date(open), end: new Date(refineTransition(id, t - DAY, t, true)) });
          open = null;
        }
        prevState = state;
      }
      out[id] = periods.filter(function (p) {
        return p.end.getTime() > Date.UTC(YEAR, 0, 1) && p.start.getTime() < Date.UTC(YEAR + 1, 0, 1);
      });
    });
    retroCache = out;
    return out;
  }

  function periodLabel(a, b) {
    if (a.getUTCFullYear() === b.getUTCFullYear()) {
      return dateMedium(a, false) + ' \u2013 ' + dateMedium(b, true);
    }
    return dateMedium(a, true) + ' \u2013 ' + dateMedium(b, true);
  }

  function renderRetro() {
    const wrap = el('cal-retro');
    if (!wrap) return;
    const data = getRetro();
    let html = '<table class="cal-table cal-retro-table"><thead><tr>' +
      '<th scope="col">' + esc(t('cal_th_graha', 'Graha')) + '</th>' +
      '<th scope="col">' + esc(t('cal_th_period', 'Period')) + '</th>' +
      '<th scope="col">' + esc(t('cal_th_days', 'Days')) + '</th>' +
      '</tr></thead><tbody>';
    RETRO.forEach(function (id) {
      const periods = data[id];
      const content = periods.length
        ? periods.map(function (p) {
            const days = Math.round((p.end.getTime() - p.start.getTime()) / DAY);
            return '<div class="cal-period"><span>' + esc(periodLabel(p.start, p.end)) + '</span><small>' + days + ' ' + esc(t('cal_days_word', 'days')) + '</small></div>';
          }).join('')
        : '<span class="cal-muted">' + esc(t('cal_retro_none', 'No retrograde in 2026')) + '</span>';
      html += '<tr><th scope="row">' + esc(planetName(id)) + '</th>' +
        '<td data-label="' + esc(t('cal_th_period', 'Period')) + '">' + content + '</td>' +
        '<td data-label="' + esc(t('cal_th_days', 'Days')) + '" class="cal-num">' +
        (periods.length ? periods.reduce(function (sum, p) { return sum + Math.round((p.end - p.start) / DAY); }, 0) : '\u2014') +
        '</td></tr>';
    });
    html += '</tbody></table>';
    wrap.innerHTML = html;
  }

  /* ---------------- Muhurat ---------------- */

  function in2026Window(parts, sm, sd, em, ed) {
    if (parts.y !== YEAR) return false;
    const t = Date.UTC(parts.y, parts.m, parts.d);
    return t >= Date.UTC(YEAR, sm, sd) && t <= Date.UTC(YEAR, em, ed);
  }

  function isKharmas(st) {
    const noon = new Date((st.sunrise.getTime() + st.sunset.getTime()) / 2);
    const sign = Math.floor(P.sunSidereal(P.julianDay(noon)) / 30);
    return sign === 8 || sign === 11;
  }

  function overlapsRahu(st, parts, abStart, abEnd) {
    const dayLen = st.sunset.getTime() - st.sunrise.getTime();
    const wd = new Date(Date.UTC(parts.y, parts.m, parts.d)).getUTCDay();
    const start = st.sunrise.getTime() + RAHU_SEGMENT[wd] * dayLen / 8;
    const end = start + dayLen / 8;
    return abStart < end && abEnd > start;
  }

  function findMuhurats(event, days) {
    const start = todayParts(city.tz);
    const out = [];
    for (let i = 0; i < days && out.length < 8; i++) {
      const parts = addDays(start, i);
      const st = P.sunTimesFor(parts, city);
      if (!st) continue;
      const p = P.panchangAt(new Date(st.sunrise.getTime() + 60e3));
      if (BAD_TITHI.indexOf(p.tithi) !== -1) continue;
      if ((event === 'vivah' || event === 'griha') && p.tithi >= 15) continue;
      if (event === 'vivah' || event === 'griha') {
        if (isKharmas(st)) continue;
        if (in2026Window(parts, 6, 25, 10, 20)) continue;
      }
      if (NAK_ALLOWED[event].indexOf(p.nakshatra) === -1) continue;
      const dayLen = st.sunset.getTime() - st.sunrise.getTime();
      const noon = st.sunrise.getTime() + dayLen / 2;
      const abStart = noon - dayLen / 30;
      const abEnd = noon + dayLen / 30;
      const mid = P.panchangAt(new Date((abStart + abEnd) / 2));
      if (P.karanaNumber(mid.karanaIndex) === 7) continue;
      if (overlapsRahu(st, parts, abStart, abEnd)) continue;
      out.push({
        parts: parts,
        date: new Date(Date.UTC(parts.y, parts.m, parts.d)),
        tithi: p.tithi,
        nak: p.nakshatra,
        abStart: new Date(abStart),
        abEnd: new Date(abEnd)
      });
    }
    return out;
  }

  function renderMuhurat() {
    const wrap = el('cal-muhurat-results');
    if (!wrap) return;
    const list = findMuhurats(muhuratEvent, muhuratWindow);
    if (!list.length) {
      wrap.innerHTML = '<p class="cal-empty">' + esc(t('cal_muhurat_none', 'No suitable date in this window. Try a longer period or consult Panditji for a personal muhurat.')) + '</p>';
      return;
    }
    wrap.innerHTML = '<div class="cal-muhurat-grid">' + list.map(function (r) {
      const withYear = r.parts.y !== YEAR;
      const paksha = r.tithi < 15 ? t('cal_shukla', 'Shukla Paksha') : t('cal_krishna', 'Krishna Paksha');
      return '<article class="cal-muhurat-card">' +
        '<div class="cal-muhurat-date"><strong>' + esc(dateMedium(r.date, withYear)) + '</strong><small>' + esc(weekdayLong(r.date)) + '</small></div>' +
        '<div class="cal-muhurat-detail"><span class="cal-muhurat-tithi">' + esc(paksha) + ' \u00B7 ' + esc(P.NAMES.tithi[lang][r.tithi]) + ' \u00B7 ' + esc(P.NAMES.nakshatra[lang][r.nak]) + '</span>' +
        '<span class="cal-muhurat-window"><span>' + svgIcon('clock', 15) + esc(t('cal_muhurat_abhijit', 'Abhijit')) + '</span><strong>' + esc(clock(r.abStart)) + ' \u2013 ' + esc(clock(r.abEnd)) + '</strong></span>' +
        '</div></article>';
    }).join('') + '</div>';
  }

  /* ---------------- Tabs / init ---------------- */

  function renderTab(tab) {
    if (tab === 'festivals') renderFestivals();
    else if (tab === 'vrat') renderVrat();
    else if (tab === 'grahan') renderEclipses();
    else if (tab === 'gochar') { renderGochar(); renderRetro(); }
    else if (tab === 'muhurat') renderMuhurat();
    rendered[tab] = true;
  }

  function activate(tab, push) {
    if (TABS.indexOf(tab) === -1) tab = 'festivals';
    activeTab = tab;
    document.querySelectorAll('.calendar-tab').forEach(function (btn) {
      const on = btn.getAttribute('data-tab') === tab;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-selected', String(on));
      btn.tabIndex = on ? 0 : -1;
    });
    TABS.forEach(function (name) {
      const pane = el('cal-pane-' + name);
      if (pane) pane.hidden = name !== tab;
    });
    if (!rendered[tab]) renderTab(tab);
    if (push !== false && window.history && history.replaceState) {
      history.replaceState(null, '', '#' + tab);
    }
  }

  function init() {
    if (!el('cal-pane-festivals')) return;
    lang = currentLang();
    localCity = readLocalCity();
    try { cityId = localStorage.getItem(CITY_KEY) || 'delhi'; } catch (e) { cityId = 'delhi'; }
    fillCities();
    lunations = buildLunations();

    const citySelect = el('cal-city');
    if (citySelect) {
      citySelect.addEventListener('change', function () {
        cityId = citySelect.value;
        city = buildCities().find(function (c) { return c.id === cityId; }) || city;
        try { localStorage.setItem(CITY_KEY, cityId); } catch (e) {}
        vratCache = { id: '', data: null };
        TABS.forEach(function (name) { rendered[name] = false; });
        updateReference();
        activate(activeTab, false);
      });
    }

    document.querySelectorAll('.calendar-tab').forEach(function (btn) {
      btn.addEventListener('click', function () { activate(btn.getAttribute('data-tab')); });
      btn.addEventListener('keydown', function (e) {
        const i = TABS.indexOf(activeTab);
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          const next = TABS[(i + (e.key === 'ArrowRight' ? 1 : TABS.length - 1)) % TABS.length];
          activate(next);
          document.getElementById('cal-tab-' + next).focus();
        }
      });
    });

    document.querySelectorAll('.cal-event-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        muhuratEvent = btn.getAttribute('data-event');
        document.querySelectorAll('.cal-event-btn').forEach(function (b) {
          const on = b === btn;
          b.classList.toggle('is-active', on);
          b.setAttribute('aria-pressed', String(on));
        });
        rendered.muhurat = false;
        if (activeTab === 'muhurat') activate('muhurat', false);
      });
    });

    const winSelect = el('cal-window');
    if (winSelect) {
      winSelect.addEventListener('change', function () {
        muhuratWindow = Number(winSelect.value) || 60;
        rendered.muhurat = false;
        if (activeTab === 'muhurat') activate('muhurat', false);
      });
    }

    document.addEventListener('languagechange', function () {
      lang = currentLang();
      TABS.forEach(function (name) { rendered[name] = false; });
      fillCities();
      updateReference();
      activate(activeTab, false);
    });

    const hash = (location.hash || '').replace('#', '');
    activate(TABS.indexOf(hash) !== -1 ? hash : 'festivals', false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
