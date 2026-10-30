(function () {
  'use strict';

  const PC = typeof window !== 'undefined' ? window.ShubhPanchang : null;
  if (!PC) return;

  const R2D = 180 / Math.PI;
  const norm360 = d => ((d % 360) + 360) % 360;

  /* JPL mean elements, same source as the kundali module. */
  const EL = {
    earth: { a: 1.00000261, e: 0.01671123, I: -0.00001531, L: 100.46457166, P: 102.93768193, N: 0.0, ra: 0.00000562, re: -0.00004392, rI: -0.01294668, rL: 35999.37244981, rP: 0.32327364, rN: 0.0 },
    jupiter: { a: 5.20288700, e: 0.04838624, I: 1.30439695, L: 34.39644051, P: 14.72847983, N: 100.47390909, ra: -0.00011607, re: -0.00013253, rI: -0.00183714, rL: 3034.74612775, rP: 0.21252668, rN: 0.20469106 },
    saturn: { a: 9.53667594, e: 0.05386179, I: 2.48599187, L: 49.95424423, P: 92.59887831, N: 113.66242448, ra: -0.00125060, re: -0.00050991, rI: 0.00193609, rL: 1222.49362201, rP: -0.41897216, rN: -0.28867794 }
  };

  function helio(id, T) {
    const e0 = EL[id];
    const a = e0.a + e0.ra * T;
    const e = e0.e + e0.re * T;
    const I = (e0.I + e0.rI * T) * (Math.PI / 180);
    const L = e0.L + e0.rL * T;
    const P = e0.P + e0.rP * T;
    const N = (e0.N + e0.rN * T) * (Math.PI / 180);
    const w = P * (Math.PI / 180) - N;
    const M = (norm360(L - P + 180) - 180) * (Math.PI / 180);
    let E = M;
    for (let i = 0; i < 6; i++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    const xv = a * (Math.cos(E) - e);
    const yv = a * Math.sqrt(1 - e * e) * Math.sin(E);
    const cosN = Math.cos(N), sinN = Math.sin(N);
    const cosw = Math.cos(w), sinw = Math.sin(w);
    const cosI = Math.cos(I), sinI = Math.sin(I);
    return {
      x: xv * (cosN * cosw - sinN * sinw * cosI) - yv * (sinN * cosw + cosN * sinw * cosI),
      y: xv * (cosN * sinw + sinN * cosw * cosI) + yv * (cosN * cosw * cosI - sinN * sinw),
      z: xv * sinw * sinI + yv * cosw * sinI
    };
  }

  function planetTropical(id, T) {
    const p = helio(id, T);
    const b = helio('earth', T);
    const lonJ2000 = Math.atan2(p.y - b.y, p.x - b.x) * R2D;
    return norm360(lonJ2000 + 1.396971 * T + 0.0003086 * T * T);
  }

  const jdOf = date => date.getTime() / 86400000 + 2440587.5;
  const dateOf = jd => new Date((jd - 2440587.5) * 86400000);

  function siderealOf(planet, jd) {
    if (planet === 'sun') return PC.sunSidereal(jd);
    if (planet === 'moon') return PC.moonSidereal(jd);
    const T = (jd - 2451545.0) / 36525;
    return norm360(planetTropical(planet, T) - PC.ayanamsa(jd));
  }

  const signAt = (planet, jd) => Math.floor(siderealOf(planet, jd) / 30);

  /* Date when the planet started its current sign, or null. */
  function signStart(planet, jdNow, stepDays, maxDays) {
    const startSign = signAt(planet, jdNow);
    let prevJd = jdNow;
    let hitJd = null;
    for (let d = stepDays; d <= maxDays; d += stepDays) {
      const jd = jdNow - d;
      if (signAt(planet, jd) !== startSign) { hitJd = jd; break; }
      prevJd = jd;
    }
    if (hitJd === null) return null;
    let lo = hitJd, hi = prevJd;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (signAt(planet, mid) === startSign) hi = mid; else lo = mid;
    }
    return dateOf(hi);
  }

  /* Date when the planet next leaves its current sign, or null.
     Compares actual signs so retrograde motion is handled correctly. */
  function nextSignEnd(planet, jdNow, stepDays, maxDays) {
    const startSign = signAt(planet, jdNow);
    let prevJd = jdNow;
    let hitJd = null;
    for (let d = stepDays; d <= maxDays; d += stepDays) {
      const jd = jdNow + d;
      if (signAt(planet, jd) !== startSign) { hitJd = jd; break; }
      prevJd = jd;
    }
    if (hitJd === null) return null;
    let lo = prevJd, hi = hitJd;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (signAt(planet, mid) === startSign) lo = mid; else hi = mid;
    }
    return dateOf(hi);
  }

  /* ---------- timezone helpers ---------- */
  function tzOffsetMs(date, tz) {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    const p = {};
    dtf.formatToParts(date).forEach(x => { p[x.type] = x.value; });
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return asUTC - Math.floor(date.getTime() / 1000) * 1000;
  }

  function zonedToUtc(y, mo, d, h, mi, tz) {
    const base = Date.UTC(y, mo - 1, d, h, mi);
    let ts = base;
    for (let i = 0; i < 4; i++) ts = base - tzOffsetMs(new Date(ts), tz);
    return new Date(ts);
  }

  function cityTz() {
    try {
      const id = localStorage.getItem('shubhveda_panchang_city') || 'delhi';
      const c = (PC.CITIES || []).filter(x => x.id === id)[0];
      if (c && c.tz) return c.tz;
    } catch (e) {}
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) return tz;
    } catch (e) {}
    return 'Asia/Kolkata';
  }

  function localPartsIn(tz) {
    const s = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
    const p = s.split('-').map(Number);
    return { y: p[0], m: p[1], d: p[2] };
  }

  function addDays(p, n) {
    const d = new Date(Date.UTC(p.y, p.m - 1, p.d + n));
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, d: d.getUTCDate() };
  }

  /* ---------- text data ---------- */
  const LOCALE = { en: 'en-IN', hi: 'hi-IN', ne: 'ne-NP' };
  const NE_SUPPORTED = (function () {
    try { return Intl.DateTimeFormat.supportedLocalesOf(['ne-NP']).length > 0; } catch (e) { return false; }
  })();
  const NE_MONTHS = ['जनवरी', 'फेब्रुअरी', 'मार्च', 'अप्रिल', 'मे', 'जुन', 'जुलाई', 'अगस्ट', 'सेप्टेम्बर', 'अक्टोबर', 'नोभेम्बर', 'डिसेम्बर'];
  const NE_WEEKDAYS = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहीबार', 'शुक्रबार', 'शनिबार'];

  const SIGNS = {
    en: ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'],
    hi: ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'],
    ne: ['मेष', 'वृष', 'मिथुन', 'कर्कट', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुम्भ', 'मीन']
  };

  const LORDS = {
    en: ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'],
    hi: ['मंगल', 'शुक्र', 'बुध', 'चन्द्र', 'सूर्य', 'बुध', 'शुक्र', 'मंगल', 'गुरु', 'शनि', 'शनि', 'गुरु'],
    ne: ['मंगल', 'शुक्र', 'बुध', 'चन्द्र', 'सूर्य', 'बुध', 'शुक्र', 'मंगल', 'गुरु', 'शनि', 'शनि', 'गुरु']
  };

  const THEME = {
    en: [
      'self, health and vitality',
      'wealth, family and speech',
      'courage, siblings and self-effort',
      'home, mother and inner comfort',
      'children, study and creativity',
      'health, debts and obstacles',
      'marriage, partnership and travel',
      'inheritance, sudden change and deeper study',
      'fortune, dharma and teachers',
      'career, status and responsibility',
      'gains, friends and fulfilment of wishes',
      'expenses, sleep and matters abroad'
    ],
    hi: [
      'स्वयं, स्वास्थ्य और ऊर्जा',
      'धन, परिवार और वाणी',
      'साहस, भाई-बहन और पुरुषार्थ',
      'घर, माता और आंतरिक सुख',
      'संतान, अध्ययन और सृजन',
      'स्वास्थ्य, ऋण और बाधाएँ',
      'विवाह, साझेदारी और यात्रा',
      'विरासत, अचानक परिवर्तन और गहन अध्ययन',
      'भाग्य, धर्म और गुरुजन',
      'करियर, प्रतिष्ठा और जिम्मेदारी',
      'लाभ, मित्र और इच्छापूर्ति',
      'खर्च, नींद और विदेश के मामले'
    ],
    ne: [
      'आफ्नो, स्वास्थ्य र ऊर्जा',
      'धन, परिवार र वाणी',
      'साहस, दाजुभाइ-दिदीबहिनी र पुरुषार्थ',
      'घर, माता र आन्तरिक सुख',
      'सन्तान, अध्ययन र सिर्जना',
      'स्वास्थ्य, ऋण र बाधा',
      'विवाह, साझेदारी र यात्रा',
      'सम्पत्ति, अचानक परिवर्तन र गहिरो अध्ययन',
      'भाग्य, धर्म र गुरुजन',
      'करियर, प्रतिष्ठा र जिम्मेवारी',
      'लाभ, मित्र र इच्छापूर्ति',
      'खर्च, निद्रा र विदेशका विषय'
    ]
  };

  const CAUTION = {
    en: 'Take care and avoid needless risk.',
    hi: 'सावधानी रखें और अनावश्यक जोखिम से बचें।',
    ne: 'सावधानी राख्नुहोस् र अनावश्यक जोखिमबाट बच्नुहोस्।'
  };

  const T = {
    en: {
      eyebrow: 'Rashi Phal',
      title: 'Aaj Ka Rashi Phal',
      desc: 'Daily, weekly, monthly and yearly readings for all twelve rashis, read from the Moon, Sun, Jupiter and Saturn transits against your Janma Rashi.',
      tabs: ['Today', 'This Week', 'This Month', 'This Year'],
      note: 'Rashi phal is read from your Janma Rashi (Moon sign) using classical gochar. For decisions that matter, confirm with a personal consultation.',
      grades: ['Favourable', 'Steady', 'Needs care'],
      planets: { moon: 'Moon', sun: 'Sun', jupiter: 'Jupiter', saturn: 'Saturn' },
      focus: 'Matters of {t} will remain in focus.',
      yearFocus: "This year's main focus stays on two areas: {j}; and {s}.",
      moonIn: 'The Moon is transiting house {n} from your Janma Rashi.',
      sunIn: 'The Sun is transiting house {n} from your Janma Rashi.',
      yearIn: 'Jupiter is transiting house {j} and Saturn house {s} from your Janma Rashi.',
      weekLine: 'This week the Moon moves through houses {h} from your Janma Rashi; {k} of the seven days are favourable.',
      bestDay: 'The most favourable day is {d}.',
      sunUntil: 'The Sun changes sign on {d}.',
      jupUntil: 'Jupiter changes sign on {d}.',
      satUntil: 'Saturn changes sign on {d}.',
      lord: 'Lord: {l}',
      aria: 'Rashi phal period'
    },
    hi: {
      eyebrow: 'राशि फल',
      title: 'आज का राशि फल',
      desc: 'चन्द्र, सूर्य, गुरु और शनि के गोचर से बारहों राशियों का दैनिक, साप्ताहिक, मासिक और वार्षिक फल।',
      tabs: ['आज', 'यह सप्ताह', 'यह माह', 'यह वर्ष'],
      note: 'राशि फल आपकी जन्म राशि (चन्द्र राशि) से शास्त्रीय गोचर के अनुसार निकाला गया है। महत्वपूर्ण निर्णयों के लिए व्यक्तिगत परामर्श लें।',
      grades: ['अनुकूल', 'स्थिर', 'सावधानी'],
      planets: { moon: 'चन्द्रमा', sun: 'सूर्य', jupiter: 'गुरु', saturn: 'शनि' },
      focus: '{t} से जुड़े विषय ध्यान में रहेंगे।',
      yearFocus: 'इस वर्ष का मुख्य ध्यान दो क्षेत्रों पर रहेगा: {j}; और {s}।',
      moonIn: 'चन्द्रमा आपकी जन्म राशि से भाव {n} में गोचर कर रहा है।',
      sunIn: 'सूर्य आपकी जन्म राशि से भाव {n} में गोचर कर रहा है।',
      yearIn: 'गुरु आपकी जन्म राशि से भाव {j} में और शनि भाव {s} में गोचर कर रहे हैं।',
      weekLine: 'इस सप्ताह चन्द्रमा आपकी जन्म राशि से भाव {h} से गुज़रेगा; सात में से {k} दिन अनुकूल रहेंगे।',
      bestDay: 'सर्वाधिक अनुकूल दिन {d} रहेगा।',
      sunUntil: 'सूर्य {d} को राशि बदलेगा।',
      jupUntil: 'गुरु {d} को राशि बदलेंगे।',
      satUntil: 'शनि {d} को राशि बदलेंगे।',
      lord: 'स्वामी: {l}',
      aria: 'राशि फल अवधि'
    },
    ne: {
      eyebrow: 'राशिफल',
      title: 'आजको राशिफल',
      desc: 'चन्द्र, सूर्य, गुरु र शनिको गोचरबाट बाह्रै राशिको दैनिक, साप्ताहिक, मासिक र वार्षिक फल।',
      tabs: ['आज', 'यो हप्ता', 'यो महिना', 'यो वर्ष'],
      note: 'राशिफल तपाईंको जन्म राशि (चन्द्र राशि) बाट शास्त्रीय गोचर अनुसार निकालिएको हो। महत्वपूर्ण निर्णयका लागि व्यक्तिगत परामर्श लिनुहोस्।',
      grades: ['अनुकूल', 'स्थिर', 'सावधानी'],
      planets: { moon: 'चन्द्रमा', sun: 'सूर्य', jupiter: 'गुरु', saturn: 'शनि' },
      focus: '{t}सँग सम्बन्धित विषयमा ध्यान रहनेछ।',
      yearFocus: 'यो वर्षको मुख्य ध्यान दुई क्षेत्रमा रहनेछ: {j}; र {s}।',
      moonIn: 'चन्द्रमा तपाईंको जन्म राशिबाट भाव {n} मा गोचर गर्दै छ।',
      sunIn: 'सूर्य तपाईंको जन्म राशिबाट भाव {n} मा गोचर गर्दै छ।',
      yearIn: 'गुरु तपाईंको जन्म राशिबाट भाव {j} मा र शनि भाव {s} मा गोचर गर्दै छन्।',
      weekLine: 'यो हप्ता चन्द्रमा तपाईंको जन्म राशिबाट भाव {h} हुँदै जानेछ; सातमध्ये {k} दिन अनुकूल रहनेछन्।',
      bestDay: 'सबैभन्दा अनुकूल दिन {d} रहनेछ।',
      sunUntil: 'सूर्य {d} मा राशि बदल्नेछ।',
      jupUntil: 'गुरु {d} मा राशि बदल्नुहुनेछ।',
      satUntil: 'शनि {d} मा राशि बदल्नेछ।',
      lord: 'स्वामी: {l}',
      aria: 'राशिफल अवधि'
    }
  };

  /* Classical gochar grading: houses counted from the Janma Rashi. */
  const GRADES = {
    moon: { good: [1, 3, 6, 7, 10, 11], mixed: [2, 5, 9] },
    sun: { good: [3, 6, 10, 11], mixed: [2, 5, 9] },
    jupiter: { good: [2, 5, 7, 9, 11], mixed: [1, 3, 4, 10] },
    saturn: { good: [3, 6, 11], mixed: [1, 2, 4, 5, 7, 9, 10] }
  };

  function gradeOf(planet, house) {
    const g = GRADES[planet];
    if (g.good.indexOf(house) >= 0) return 0;
    if (g.mixed.indexOf(house) >= 0) return 1;
    return 2;
  }

  const houseFrom = (rashi, sign) => ((sign - rashi + 12) % 12) + 1;

  function currentLang() {
    try {
      if (window.ShubhVedaI18n && window.ShubhVedaI18n.getCurrentLang) {
        const l = String(window.ShubhVedaI18n.getCurrentLang() || 'en').slice(0, 2);
        if (LOCALE[l]) return l;
      }
      const dt = String(document.documentElement.lang || 'en').slice(0, 2);
      if (LOCALE[dt]) return dt;
    } catch (e) {}
    return 'en';
  }

  function fmt(lang, opts, value) {
    if (lang === 'ne' && !NE_SUPPORTED) {
      const utc = opts.timeZone === 'UTC';
      const wd = utc ? value.getUTCDay() : value.getDay();
      if (opts.weekday) return NE_WEEKDAYS[wd];
      const y = utc ? value.getUTCFullYear() : value.getFullYear();
      const mo = utc ? value.getUTCMonth() : value.getMonth();
      const dd = utc ? value.getUTCDate() : value.getDate();
      const parts = [];
      if (opts.day) parts.push(dd);
      if (opts.month) parts.push(NE_MONTHS[mo]);
      if (opts.year) parts.push(y);
      return parts.join(' ');
    }
    return new Intl.DateTimeFormat(LOCALE[lang], opts).format(value);
  }

  function dayLabel(lang, date) {
    return fmt(lang, { day: 'numeric', month: 'short', year: 'numeric' }, date);
  }

  function weekdayLabel(lang, parts) {
    return fmt(lang, { weekday: 'long', timeZone: 'UTC' }, new Date(Date.UTC(parts.y, parts.m - 1, parts.d, 12)));
  }

  function fill(tpl, map) {
    return tpl.replace(/\{(\w+)\}/g, (m, k) => (map[k] !== undefined ? map[k] : m));
  }

  function rangeLabel(lang, a, b) {
    return fmt(lang, { day: 'numeric', month: 'short' }, a) + ' \u2013 ' +
      fmt(lang, { day: 'numeric', month: 'short', year: 'numeric' }, b);
  }

  /* The actual window each tab's reading covers. */
  function periodRangeText(lang, tz, ctx) {
    const today = localPartsIn(tz);
    const noon = new Date(Date.UTC(today.y, today.m - 1, today.d, 12));
    if (period === 'day') return fmt(lang, { day: 'numeric', month: 'short', year: 'numeric' }, noon);
    if (period === 'week') {
      const end = addDays(today, 6);
      return rangeLabel(lang, noon, new Date(Date.UTC(end.y, end.m - 1, end.d, 12)));
    }
    if (period === 'month') {
      if (ctx.sunStart && ctx.sunEnd) return rangeLabel(lang, ctx.sunStart, ctx.sunEnd);
      return fmt(lang, { month: 'long', year: 'numeric' }, noon);
    }
    return fmt(lang, { year: 'numeric' }, noon);
  }

  function el(id) { return document.getElementById(id); }

  let period = 'day';
  let timer = null;

  function computeWeek(tz) {
    const today = localPartsIn(tz);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const p = addDays(today, i);
      const utc = zonedToUtc(p.y, p.m, p.d, 12, 0, tz);
      days.push({ parts: p, jd: jdOf(utc) });
    }
    return days;
  }

  function buildCard(r, lang, ctx) {
    const t = T[lang];
    const moonHouse = houseFrom(r, ctx.moonSign);
    let grade = 0;
    let meta = '';
    let body = '';
    let until = '';

    if (period === 'day') {
      grade = gradeOf('moon', moonHouse);
      meta = t.planets.moon + ' \u00B7 ' + moonHouse;
      body = fill(t.moonIn, { n: moonHouse }) + ' ' + fill(t.focus, { t: THEME[lang][moonHouse - 1] });
    } else if (period === 'week') {
      const houses = [];
      const list = [];
      ctx.week.forEach(d => {
        const s = signAt('moon', d.jd);
        const h = houseFrom(r, s);
        list.push({ parts: d.parts, h: h, g: gradeOf('moon', h) });
        if (houses.indexOf(h) === -1) houses.push(h);
      });
      const good = list.filter(x => x.g === 0);
      const best = good.length ? good[0] : list.slice().sort((a, b) => a.g - b.g)[0];
      grade = good.length >= 4 ? 0 : (good.length >= 2 ? 1 : 2);
      meta = t.planets.moon + ' \u00B7 ' + houses.join(' \u2192 ');
      const top = houses.slice().sort((a, b) => gradeOf('moon', a) - gradeOf('moon', b))[0];
      body = fill(t.weekLine, { h: houses.join(', '), k: good.length }) + ' ' +
        fill(t.bestDay, { d: weekdayLabel(lang, best.parts) }) + ' ' +
        fill(t.focus, { t: THEME[lang][top - 1] });
    } else if (period === 'month') {
      const h = houseFrom(r, ctx.sunSign);
      grade = gradeOf('sun', h);
      meta = t.planets.sun + ' \u00B7 ' + h;
      body = fill(t.sunIn, { n: h }) + ' ' + fill(t.focus, { t: THEME[lang][h - 1] });
      if (ctx.sunEnd) until = fill(t.sunUntil, { d: dayLabel(lang, ctx.sunEnd) });
    } else {
      const hj = houseFrom(r, ctx.jupSign);
      const hs = houseFrom(r, ctx.satSign);
      grade = Math.round((gradeOf('jupiter', hj) + gradeOf('saturn', hs)) / 2);
      meta = t.planets.jupiter + ' \u00B7 ' + hj + '  ' + t.planets.saturn + ' \u00B7 ' + hs;
      body = fill(t.yearIn, { j: hj, s: hs }) + ' ' +
        fill(t.yearFocus, { j: THEME[lang][hj - 1], s: THEME[lang][hs - 1] });
      const parts = [];
      if (ctx.jupEnd) parts.push(fill(t.jupUntil, { d: dayLabel(lang, ctx.jupEnd) }));
      if (ctx.satEnd) parts.push(fill(t.satUntil, { d: dayLabel(lang, ctx.satEnd) }));
      if (parts.length) until = parts.join(' ');
    }

    return {
      grade: grade,
      meta: meta,
      body: grade === 2 ? body + ' ' + CAUTION[lang] : body,
      until: until
    };
  }

  function renderTabs(lang) {
    const wrap = el('rashi-tabs');
    if (!wrap) return;
    const t = T[lang];
    const keys = ['day', 'week', 'month', 'year'];
    wrap.setAttribute('aria-label', t.aria);
    wrap.replaceChildren();
    keys.forEach((key, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rashi-tab';
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', key === period ? 'true' : 'false');
      btn.textContent = t.tabs[i];
      btn.addEventListener('click', () => {
        if (period === key) return;
        period = key;
        render();
      });
      wrap.append(btn);
    });
  }

  function render() {
    const grid = el('rashi-grid');
    if (!grid) return;
    const lang = currentLang();
    const t = T[lang];

    const lblEyebrow = el('rashi-eyebrow');
    const lblTitle = el('rashi-title');
    const lblDesc = el('rashi-desc');
    const lblNote = el('rashi-note');
    if (lblEyebrow) lblEyebrow.textContent = t.eyebrow;
    if (lblTitle) lblTitle.textContent = t.title;
    if (lblDesc) lblDesc.textContent = t.desc;
    if (lblNote) lblNote.textContent = t.note;

    renderTabs(lang);

    const now = new Date();
    const jdNow = jdOf(now);
    const tz = cityTz();
    const ctx = {
      moonSign: signAt('moon', jdNow),
      sunSign: signAt('sun', jdNow),
      jupSign: signAt('jupiter', jdNow),
      satSign: signAt('saturn', jdNow),
      week: period === 'week' ? computeWeek(tz) : []
    };
    if (period === 'month') {
      ctx.sunStart = signStart('sun', jdNow, 1, 45);
      ctx.sunEnd = nextSignEnd('sun', jdNow, 1, 45);
    }
    if (period === 'year') {
      ctx.jupEnd = nextSignEnd('jupiter', jdNow, 5, 760);
      ctx.satEnd = nextSignEnd('saturn', jdNow, 10, 1500);
    }

    const range = periodRangeText(lang, tz, ctx);
    grid.replaceChildren();
    for (let r = 0; r < 12; r++) {
      const card = buildCard(r, lang, ctx);
      const node = document.createElement('article');
      node.className = 'rashi-card';
      node.setAttribute('data-grade', String(card.grade));

      const head = document.createElement('div');
      head.className = 'rashi-card-head';

      const name = document.createElement('div');
      name.className = 'rashi-name';
      const strong = document.createElement('strong');
      strong.textContent = SIGNS[lang][r];
      const span = document.createElement('span');
      span.textContent = range;
      name.append(strong, span);

      const chip = document.createElement('span');
      chip.className = 'rashi-chip';
      chip.textContent = t.grades[card.grade];

      head.append(name, chip);

      const meta = document.createElement('p');
      meta.className = 'rashi-meta';
      meta.textContent = card.meta + ' \u00B7 ' + fill(t.lord, { l: LORDS[lang][r] });

      const body = document.createElement('p');
      body.className = 'rashi-body';
      body.textContent = card.body;

      node.append(head, meta, body);

      if (card.until) {
        const until = document.createElement('p');
        until.className = 'rashi-until';
        until.textContent = card.until;
        node.append(until);
      }

      grid.append(node);
    }
  }

  function init() {
    if (!el('rashi-grid')) return;
    render();
    if (timer) clearInterval(timer);
    timer = setInterval(render, 300000);

    document.addEventListener('languagechange', render);
    const select = el('panchang-city');
    if (select) select.addEventListener('change', render);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
