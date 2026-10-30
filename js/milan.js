/* =========================================================================
   VIVAH KUNDALI MILAN — Ashtakoota guna milan (36 points)
   Needs window.ShubhPanchang (js/panchang.js) for sidereal positions.
   Moon sign + nakshatra depend only on birth date, time and timezone.
   ========================================================================= */
(function () {
  'use strict';

  const PC = window.ShubhPanchang;
  if (!PC || !document.getElementById('milan-submit')) return;

  const D2R = Math.PI / 180;
  const R2D = 180 / Math.PI;
  const NAK_SPAN = 360 / 27;

  function norm360(x) { return ((x % 360) + 360) % 360; }

  /* ---------- positions ---------- */
  const ELEMENTS = {
    earth: { a: 1.00000261, e: 0.01671123, I: -0.00001531, L: 100.46457166, P: 102.93768193, N: 0.0, ra: 0.00000562, re: -0.00004392, rI: -0.01294668, rL: 35999.37244981, rP: 0.32327364, rN: 0.0 },
    mars: { a: 1.52371034, e: 0.09339410, I: 1.84969142, L: -4.55343205, P: -23.94362959, N: 49.55953891, ra: 0.00001847, re: 0.00007882, rI: -0.00813131, rL: 19140.30268499, rP: 0.44441088, rN: -0.29257343 }
  };

  function helio(id, T) {
    const elm = ELEMENTS[id];
    const a = elm.a + elm.ra * T;
    const e = elm.e + elm.re * T;
    const I = (elm.I + elm.rI * T) * D2R;
    const L = elm.L + elm.rL * T;
    const P = elm.P + elm.rP * T;
    const N = (elm.N + elm.rN * T) * D2R;
    const w = P * D2R - N;
    const M = (norm360(L - P + 180) - 180) * D2R;
    let E = M;
    for (let i = 0; i < 6; i++) {
      E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    }
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

  function marsSidereal(jd) {
    const T = (jd - 2451545.0) / 36525;
    const p = helio('mars', T);
    const b = helio('earth', T);
    const lonJ2000 = Math.atan2(p.y - b.y, p.x - b.x) * R2D;
    const precession = 1.396971 * T + 0.0003086 * T * T;
    return norm360(lonJ2000 + precession - PC.ayanamsa(jd));
  }

  function gmst(jd) {
    const T = (jd - 2451545.0) / 36525;
    return norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000);
  }

  function ascendant(jd, lat, lon, ay) {
    const T = (jd - 2451545.0) / 36525;
    const eps = (23.4392911 - 0.0130042 * T) * D2R;
    const lst = (gmst(jd) + lon) * D2R;
    const phi = lat * D2R;
    const asc = Math.atan2(Math.cos(lst), -(Math.sin(lst) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) * R2D;
    return norm360(asc - ay);
  }

  /* ---------- timezone ---------- */
  function tzOffsetMs(date, tz) {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    const p = {};
    dtf.formatToParts(date).forEach((x) => { p[x.type] = x.value; });
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return asUTC - Math.floor(date.getTime() / 1000) * 1000;
  }

  function zonedToUtc(y, mo, d, h, mi, tz) {
    const base = Date.UTC(y, mo - 1, d, h, mi);
    let ts = base;
    for (let i = 0; i < 4; i++) {
      const next = base - tzOffsetMs(new Date(ts), tz);
      if (next === ts) break;
      ts = next;
    }
    return new Date(ts);
  }

  function chartFor(y, mo, d, h, mi, tz, lat, lon) {
    const utc = zonedToUtc(y, mo, d, h, mi, tz);
    const jd = utc.getTime() / 86400000 + 2440587.5;
    const ay = PC.ayanamsa(jd);
    const moon = PC.moonSidereal(jd);
    const mars = marsSidereal(jd);
    const nak = Math.floor(moon / NAK_SPAN);
    const hasPlace = isFinite(lat) && isFinite(lon);
    return {
      moon: moon,
      mars: mars,
      rashi: Math.floor(moon / 30),
      deg: moon % 30,
      nak: nak,
      pada: Math.floor((moon - nak * NAK_SPAN) / (NAK_SPAN / 4)) + 1,
      asc: hasPlace ? ascendant(jd, lat, lon, ay) : null
    };
  }

  /* ---------- classical tables ---------- */
  const SIGNS = {
    en: ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'],
    hi: ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'],
    ne: ['मेष', 'वृष', 'मिथुन', 'कर्कट', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुम्भ', 'मीन']
  };

  const NAKSHATRAS = {
    en: ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'],
    hi: ['अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा', 'पूर्वा फाल्गुनी', 'उत्तरा फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण', 'धनिष्ठा', 'शतभिषा', 'पूर्वा भाद्रपद', 'उत्तरा भाद्रपद', 'रेवती'],
    ne: ['अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा', 'पूर्व फाल्गुनी', 'उत्तर फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढा', 'उत्तराषाढा', 'श्रवण', 'धनिष्ठा', 'शतभिषा', 'पूर्व भाद्रपद', 'उत्तर भाद्रपद', 'रेवती']
  };

  const VARNA_NAMES = {
    en: ['Brahmin', 'Kshatriya', 'Vaishya', 'Shudra'],
    hi: ['ब्राह्मण', 'क्षत्रिय', 'वैश्य', 'शूद्र'],
    ne: ['ब्राह्मण', 'क्षत्रिय', 'वैश्य', 'शूद्र']
  };

  const VASHYA_NAMES = {
    en: ['Chatushpada', 'Manava', 'Jalachara', 'Vanachara', 'Keeta'],
    hi: ['चतुष्पद', 'मानव', 'जलचर', 'वनचर', 'कीट'],
    ne: ['चतुष्पद', 'मानव', 'जलचर', 'वनचर', 'कीट']
  };

  const GANA_NAMES = {
    en: ['Deva', 'Manushya', 'Rakshasa'],
    hi: ['देव', 'मनुष्य', 'राक्षस'],
    ne: ['देव', 'मनुष्य', 'राक्षस']
  };

  const NADI_NAMES = {
    en: ['Adi', 'Madhya', 'Antya'],
    hi: ['आदि', 'मध्य', 'अन्त्य'],
    ne: ['आदि', 'मध्य', 'अन्त्य']
  };

  const YONI_NAMES = {
    en: ['Horse', 'Elephant', 'Sheep', 'Serpent', 'Dog', 'Cat', 'Rat', 'Cow', 'Buffalo', 'Tiger', 'Deer', 'Monkey', 'Mongoose', 'Lion'],
    hi: ['अश्व', 'गज', 'मेष', 'सर्प', 'श्वान', 'मार्जार', 'मूषक', 'गौ', 'महिष', 'व्याघ्र', 'मृग', 'वानर', 'नकुल', 'सिंह'],
    ne: ['अश्व', 'गज', 'मेष', 'सर्प', 'कुकुर', 'बिरालो', 'मुसा', 'गाई', 'भैंसी', 'बाघ', 'मृग', 'बाँदर', 'न्याउरी', 'सिंह']
  };

  const PLANETS = {
    en: ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'],
    hi: ['सूर्य', 'चन्द्र', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
    ne: ['सूर्य', 'चन्द्र', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि']
  };

  const KOOTA_NAMES = {
    en: ['Varna', 'Vashya', 'Tara', 'Yoni', 'Graha Maitri', 'Gana', 'Bhakoot', 'Nadi'],
    hi: ['वर्ण', 'वश्य', 'तारा', 'योनी', 'ग्रह मैत्री', 'गण', 'भकूट', 'नाड़ी'],
    ne: ['वर्ण', 'वश्य', 'तारा', 'योनी', 'ग्रह मैत्री', 'गण', 'भकूट', 'नाडी']
  };

  const KOOTA_MAX = [1, 2, 3, 4, 5, 6, 7, 8];

  /* Varna: 0 Brahmin, 1 Kshatriya, 2 Vaishya, 3 Shudra */
  const VARNA_OF = [1, 2, 3, 0, 1, 2, 3, 0, 1, 2, 3, 0];

  /* Vashya groups: 0 Chatushpada, 1 Manava, 2 Jalachara, 3 Vanachara, 4 Keeta */
  const VASHYA_GROUP = [0, 0, 1, 2, 3, 1, 1, 4, 1, 0, 1, 2];

  const VASHYA_TABLE = [
    [2, 1, 1, 1, 1],
    [1, 2, 0.5, 0, 1],
    [1, 0.5, 2, 1, 1],
    [1, 0, 1, 2, 1],
    [1, 1, 1, 1, 2]
  ];

  /* Rashi lords, planet ids: 0 Sun, 1 Moon, 2 Mars, 3 Mercury, 4 Jupiter, 5 Venus, 6 Saturn */
  const SIGN_LORD = [2, 5, 3, 1, 0, 3, 5, 2, 4, 6, 6, 4];

  /* Natural friendship: 1 friend, 0 neutral, -1 enemy */
  const FRIENDS = [
    { 1: 1, 2: 1, 3: 0, 4: 1, 5: -1, 6: -1 },
    { 0: 1, 2: 0, 3: 1, 4: 0, 5: 0, 6: 0 },
    { 0: 1, 1: 1, 3: -1, 4: 1, 5: 0, 6: 0 },
    { 0: 1, 1: -1, 2: 0, 4: 0, 5: 1, 6: 0 },
    { 0: 1, 1: 1, 2: 1, 3: -1, 5: -1, 6: 0 },
    { 0: -1, 1: -1, 2: 0, 3: 1, 4: 0, 6: 1 },
    { 0: -1, 1: -1, 2: -1, 3: 1, 4: 0, 5: 1 }
  ];

  /* Gana per nakshatra: 0 Deva, 1 Manushya, 2 Rakshasa */
  const GANA_OF = [0, 1, 2, 1, 0, 1, 0, 0, 2, 2, 1, 1, 0, 2, 0, 2, 0, 2, 2, 1, 1, 0, 2, 2, 1, 1, 0];

  const GANA_TABLE = [
    [6, 6, 1],
    [5, 6, 0],
    [1, 0, 6]
  ];

  /* Yoni per nakshatra */
  const YONI_OF = [0, 1, 2, 3, 3, 4, 5, 2, 5, 6, 6, 7, 8, 9, 8, 9, 10, 10, 4, 11, 12, 11, 13, 0, 13, 7, 1];

  const YONI_TABLE = [
    [4, 2, 2, 3, 2, 2, 2, 1, 3, 1, 2, 3, 2, 1],
    [2, 4, 3, 3, 2, 2, 2, 2, 3, 1, 2, 3, 2, 1],
    [2, 3, 4, 2, 2, 2, 2, 3, 2, 1, 2, 1, 3, 1],
    [3, 3, 2, 4, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2],
    [2, 2, 2, 2, 4, 2, 1, 2, 2, 1, 1, 2, 2, 1],
    [2, 2, 2, 2, 2, 4, 1, 2, 2, 1, 2, 2, 2, 1],
    [2, 2, 2, 2, 1, 1, 4, 2, 2, 2, 2, 2, 1, 2],
    [1, 2, 3, 2, 2, 2, 2, 4, 3, 1, 2, 3, 2, 1],
    [3, 3, 2, 2, 2, 2, 2, 3, 4, 1, 2, 3, 2, 1],
    [1, 1, 1, 2, 1, 1, 2, 1, 1, 4, 1, 1, 2, 1],
    [2, 2, 2, 2, 1, 2, 2, 2, 2, 1, 4, 2, 2, 1],
    [3, 3, 1, 2, 2, 2, 2, 3, 3, 1, 2, 4, 2, 1],
    [2, 2, 3, 1, 2, 2, 1, 2, 2, 2, 2, 2, 4, 1],
    [1, 1, 1, 2, 1, 1, 2, 1, 1, 1, 1, 1, 1, 4]
  ];

  /* Nadi per nakshatra: 0 Adi, 1 Madhya, 2 Antya */
  const NADI_OF = [0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2, 2, 1, 0, 0, 1, 2];

  const MANGAL_HOUSES = [1, 2, 4, 7, 8, 12];

  /* ---------- scoring ---------- */
  function varnaScore(brideRashi, groomRashi) {
    return VARNA_OF[groomRashi] <= VARNA_OF[brideRashi] ? 1 : 0;
  }

  function vashyaGroup(rashi, deg) {
    if (rashi === 8) return deg < 15 ? 1 : 0;
    if (rashi === 9) return deg < 15 ? 0 : 2;
    return VASHYA_GROUP[rashi];
  }

  function taraGood(fromNak, toNak) {
    const count = ((toNak - fromNak + 27) % 27) + 1;
    const rem = count % 9;
    return !(rem === 3 || rem === 5 || rem === 7);
  }

  function maitriScore(a, b) {
    if (a === b) return 5;
    const x = FRIENDS[a][b];
    const y = FRIENDS[b][a];
    if (x === 1 && y === 1) return 5;
    if ((x === 1 && y === 0) || (x === 0 && y === 1)) return 4;
    if (x === 0 && y === 0) return 3;
    if ((x === 1 && y === -1) || (x === -1 && y === 1)) return 1;
    if ((x === 0 && y === -1) || (x === -1 && y === 0)) return 0.5;
    return 0;
  }

  function houseFrom(fromRashi, toRashi) {
    return ((toRashi - fromRashi + 12) % 12) + 1;
  }

  function computeMilan(vadhu, varu) {
    const vRashi = vadhu.rashi;
    const gRashi = varu.rashi;
    const vNak = vadhu.nak;
    const gNak = varu.nak;

    const varna = varnaScore(vRashi, gRashi);

    const vg = vashyaGroup(vRashi, vadhu.deg);
    const gg = vashyaGroup(gRashi, varu.deg);
    const vashya = VASHYA_TABLE[gg][vg];

    const t1 = taraGood(vNak, gNak) ? 1.5 : 0;
    const t2 = taraGood(gNak, vNak) ? 1.5 : 0;
    const tara = t1 + t2;

    const vy = YONI_OF[vNak];
    const gy = YONI_OF[gNak];
    const yoni = YONI_TABLE[gy][vy];

    const vLord = SIGN_LORD[vRashi];
    const gLord = SIGN_LORD[gRashi];
    const maitri = maitriScore(vLord, gLord);

    const vGana = GANA_OF[vNak];
    const gGana = GANA_OF[gNak];
    const gana = GANA_TABLE[gGana][vGana];

    const b2g = houseFrom(vRashi, gRashi);
    const g2b = houseFrom(gRashi, vRashi);
    const bhDosha = [2, 12, 5, 9, 6, 8].indexOf(b2g) !== -1;
    const bhakoot = bhDosha ? 0 : 7;

    const vNadi = NADI_OF[vNak];
    const gNadi = NADI_OF[gNak];
    const nadi = vNadi === gNadi ? 0 : 8;

    const scores = [varna, vashya, tara, yoni, maitri, gana, bhakoot, nadi];
    const total = scores.reduce((a, b) => a + b, 0);

    return {
      scores: scores,
      total: total,
      groups: { vg: vg, gg: gg, vLord: vLord, gLord: gLord, vGana: vGana, gGana: gGana, vNadi: vNadi, gNadi: gNadi },
      bhakootPair: b2g + '/' + g2b,
      taraDir: [t1 > 0, t2 > 0],
      mangal: {
        vadhu: mangalFor(vadhu),
        varu: mangalFor(varu)
      }
    };
  }

  function mangalFor(chart) {
    const marsRashi = Math.floor(chart.mars / 30);
    const moonHouse = houseFrom(chart.rashi, marsRashi);
    const lagnaHouse = chart.asc == null ? null : houseFrom(Math.floor(chart.asc / 30), marsRashi);
    const hit = h => h != null && MANGAL_HOUSES.indexOf(h) !== -1;
    return {
      house: moonHouse,
      lagnaHouse: lagnaHouse,
      moonDosha: hit(moonHouse),
      lagnaDosha: hit(lagnaHouse),
      dosha: hit(moonHouse) || hit(lagnaHouse),
      mild: marsRashi === 0 || marsRashi === 7 || marsRashi === 9
    };
  }

  /* ---------- strings ---------- */
  const L = {
    en: {
      k: ['Varna', 'Vashya', 'Tara', 'Yoni', 'Graha Maitri', 'Gana', 'Bhakoot', 'Nadi'],
      bride: 'Bride',
      groom: 'Groom',
      min: 'Traditional minimum: 18',
      bands: [
        { title: 'Excellent match', note: 'Most kootas agree. On the classical scale this is a strong pairing.' },
        { title: 'Good match', note: 'The score is above the traditional threshold of 18. The weak kootas below are worth discussing in a consultation.' },
        { title: 'Average match', note: 'The score is below 18. Classical practice asks for a closer look at the weak kootas before deciding.' },
        { title: 'Needs careful thought', note: 'Several kootas do not agree. Traditionally this pairing is not recommended without a detailed study.' }
      ],
      strongest: 'Strongest koota: {k} ({s}/{m}).',
      weakest: 'Weakest koota: {k} ({s}/{m}).',
      moonTitle: 'Moon at birth',
      rashiLabel: 'Rashi',
      lagnaLabel: 'Lagna',
      nakLabel: 'Nakshatra',
      padaLabel: 'Pada',
      placeLabel: 'Place',
      tzLabel: 'Timezone',
      kootaTitle: 'Ashtakoota',
      mangalTitle: 'Mangal Dosha',
      mangalLagna: 'From the lagna: house {h} — {v}.',
      mangalMoon: 'From the Moon: house {h} — {v}.',
      mangalNoLagna: 'From the Moon: house {h} — {v}. Add the birth place to include the lagna.',
      mangalYes: 'dosha present',
      mangalNo: 'no dosha',
      mangalMild: ' Mars is in its own or exaltation sign, which traditionally softens this.',
      mangalBoth: 'Both charts carry it, which is traditionally treated as balanced.',
      mangalOne: 'Only one chart carries it — this is normally discussed in a consultation.',
      mangalNone: 'Neither chart carries it from the lagna or the Moon.',
      mangalNote: 'Counted from the lagna and the Moon. Mars in the 1st, 2nd, 4th, 7th, 8th or 12th from either gives the dosha; a final view also weighs Venus and the Navamsha chart.',
      mangalNoteMoon: 'Birth place was not entered, so this is counted from the Moon only. Add both birth places to include the lagna.',
      note: {
        varna: [
          "The bride's varna is above the groom's.",
          "The groom's varna is equal to or above the bride's."
        ],
        vashya: [
          'The two groups are not mutually amenable.',
          'The two groups are different but compatible.',
          'Both signs fall in the same vashya group.'
        ],
        tara: [
          'Both directions fall in weak taras (3rd, 5th or 7th).',
          'One direction falls in a weak tara (3rd, 5th or 7th).',
          'Both directions fall in favourable taras.'
        ],
        yoni: [
          'The two yonis are opposed.',
          'The two yonis are only partly compatible.',
          'The two yonis are neutral.',
          'The two yonis are friendly.',
          'Both charts have the same yoni.'
        ],
        maitri: [
          'The two lords are natural enemies.',
          'One lord is neutral and the other an enemy.',
          'One lord is a friend and the other an enemy.',
          'The two lords are neutral to each other.',
          'One lord is a friend and the other is neutral.',
          'The two Moon-sign lords are natural friends.'
        ],
        gana: {
          same: 'Both belong to the same gana.',
          good: 'Deva and Manushya ganas are compatible.',
          ok: 'Manushya and Deva ganas are acceptable.',
          devaRak: 'Deva and Rakshasa ganas do not agree.',
          manuRak: 'Manushya and Rakshasa ganas do not agree.'
        },
        bhakoot: [
          'The sign distance ({p}) forms Bhakoot dosha.',
          'The sign distance ({p}) does not form Bhakoot dosha.'
        ],
        nadi: [
          'Both charts have the same nadi — Nadi dosha.',
          'The two nadis are different.'
        ]
      },
      errBoth: 'Please enter the date and time of birth for both the bride and the groom.',
      placeSearching: 'Searching places\u2026',
      placeNone: 'No place found. Check the spelling or pick the nearest town.',
      placeOffline: 'Could not search places right now. You can choose the timezone manually.',
      regionDefault: 'All states and provinces',
      regionCapital: 'State capital selected. Type a town or village to change it.',
      countryIndia: 'India',
      countryNepal: 'Nepal',
      disclaimer: 'Guna milan follows the classical Ashtakoota tables (Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot, Nadi). The Moon uses the Lahiri ayanamsa and an approximate ephemeris, so a koota on a boundary may differ slightly from specialised software. Mangal dosha is counted from the lagna and the Moon wherever the birth place is known. This is guidance, not a decision — speak to Pandit ji before finalising a marriage.'
    },
    hi: {
      k: ['वर्ण', 'वश्य', 'तारा', 'योनी', 'ग्रह मैत्री', 'गण', 'भकूट', 'नाड़ी'],
      bride: 'वधू',
      groom: 'वर',
      min: 'शास्त्रीय न्यूनतम: 18',
      bands: [
        { title: 'उत्तम मिलान', note: 'अधिकांश कूट मिलते हैं। शास्त्रीय पैमाने पर यह प्रबल जोड़ी है।' },
        { title: 'शुभ मिलान', note: 'गुण 18 से अधिक हैं। नीचे दिए कमज़ोर कूटों पर परामर्श में चर्चा करना उचित है।' },
        { title: 'सामान्य मिलान', note: 'गुण 18 से कम हैं। शास्त्रीय परंपरा निर्णय से पहले कमज़ोर कूटों को गहराई से देखने को कहती है।' },
        { title: 'गहन विचार आवश्यक', note: 'कई कूट नहीं मिलते। परंपरा में विस्तृत अध्ययन के बिना यह जोड़ी नहीं सुझाई जाती।' }
      ],
      strongest: 'सबसे प्रबल कूट: {k} ({s}/{m})।',
      weakest: 'सबसे कमज़ोर कूट: {k} ({s}/{m})।',
      moonTitle: 'जन्म के समय चन्द्रमा',
      rashiLabel: 'राशि',
      lagnaLabel: 'लग्न',
      nakLabel: 'नक्षत्र',
      padaLabel: 'चरण',
      placeLabel: 'स्थान',
      tzLabel: 'समय क्षेत्र',
      kootaTitle: 'अष्टकूट',
      mangalTitle: 'मंगल दोष',
      mangalLagna: 'लग्न से: {h} भाव — {v}।',
      mangalMoon: 'चन्द्रमा से: {h} भाव — {v}।',
      mangalNoLagna: 'चन्द्रमा से: {h} भाव — {v}। लग्न जाँच के लिए जन्म स्थान भरें।',
      mangalYes: 'दोष है',
      mangalNo: 'दोष नहीं',
      mangalMild: ' मंगल अपनी राशि या उच्च राशि में है, जो परंपरा में इसे हल्का करता है।',
      mangalBoth: 'दोनों कुंडलियों में यह दोष है, जिसे परंपरा में संतुलित माना जाता है।',
      mangalOne: 'केवल एक कुंडली में यह दोष है — इस पर परामर्श में चर्चा की जाती है।',
      mangalNone: 'लग्न या चन्द्रमा से किसी भी कुंडली में यह दोष नहीं है।',
      mangalNote: 'लग्न और चन्द्रमा दोनों से देखा गया है। इनमें से किसी से भी मंगल 1, 2, 4, 7, 8 या 12 भाव में हो तो दोष माना जाता है; अंतिम दृष्टि में शुक्र और नवमांश को भी देखा जाता है।',
      mangalNoteMoon: 'जन्म स्थान नहीं भरा गया, इसलिए यह केवल चन्द्रमा से देखा गया है। लग्न जाँच के लिए दोनों के जन्म स्थान भरें।',
      note: {
        varna: [
          'वधू का वर्ण वर से ऊपर है।',
          'वर का वर्ण वधू के बराबर या ऊपर है।'
        ],
        vashya: [
          'दोनों वर्ग एक-दूसरे के अनुकूल नहीं हैं।',
          'वर्ग अलग हैं, पर अनुकूल हैं।',
          'दोनों राशियाँ एक ही वश्य वर्ग में हैं।'
        ],
        tara: [
          'दोनों दिशाओं में तारा कमज़ोर (तीसरा, पाँचवाँ या सातवाँ) है।',
          'एक दिशा में तारा कमज़ोर (तीसरा, पाँचवाँ या सातवाँ) है।',
          'दोनों दिशाओं में तारा शुभ है।'
        ],
        yoni: [
          'दोनों योनियाँ विरोधी हैं।',
          'दोनों योनियाँ आंशिक रूप से अनुकूल हैं।',
          'दोनों योनियाँ तटस्थ हैं।',
          'दोनों योनियाँ मैत्रीपूर्ण हैं।',
          'दोनों कुंडलियों की योनी एक ही है।'
        ],
        maitri: [
          'दोनों स्वामी स्वाभाविक शत्रु हैं।',
          'एक स्वामी तटस्थ और दूसरा शत्रु है।',
          'एक स्वामी मित्र और दूसरा शत्रु है।',
          'दोनों स्वामी एक-दूसरे के प्रति तटस्थ हैं।',
          'एक स्वामी मित्र और दूसरा तटस्थ है।',
          'दोनों राशि स्वामी स्वाभाविक मित्र हैं।'
        ],
        gana: {
          same: 'दोनों एक ही गण के हैं।',
          good: 'देव और मनुष्य गण अनुकूल हैं।',
          ok: 'मनुष्य और देव गण स्वीकार्य हैं।',
          devaRak: 'देव और राक्षस गण अनुकूल नहीं हैं।',
          manuRak: 'मनुष्य और राक्षस गण अनुकूल नहीं हैं।'
        },
        bhakoot: [
          'राशि दूरी ({p}) भकूट दोष बनाती है।',
          'राशि दूरी ({p}) भकूट दोष नहीं बनाती।'
        ],
        nadi: [
          'दोनों की नाड़ी एक ही है — नाड़ी दोष।',
          'दोनों की नाड़ियाँ अलग हैं।'
        ]
      },
      errBoth: 'वधू और वर दोनों की जन्म तिथि और जन्म समय भरें।',
      placeSearching: 'स्थान खोजा जा रहा है\u2026',
      placeNone: 'कोई स्थान नहीं मिला। वर्तनी जाँचें या निकटतम नगर चुनें।',
      placeOffline: 'अभी स्थान खोज नहीं हो सकी। आप समय क्षेत्र स्वयं चुन सकते हैं।',
      regionDefault: 'सभी राज्य और प्रांत',
      regionCapital: 'राज्य की राजधानी चुनी गई है। बदलने के लिए नगर या गाँव लिखें।',
      countryIndia: 'भारत',
      countryNepal: 'नेपाल',
      disclaimer: 'गुण मिलान शास्त्रीय अष्टकूट तालिकाओं (वर्ण, वश्य, तारा, योनी, ग्रह मैत्री, गण, भकूट, नाड़ी) पर आधारित है। चन्द्रमा की स्थिति लाहिड़ी अयनांश और अनुमानित एफेमेरिस से निकाली जाती है, इसलिए सीमा पर स्थित कोई कूट विशेष सॉफ़्टवेयर से थोड़ा भिन्न हो सकता है। जहाँ जन्म स्थान उपलब्ध है वहाँ मंगल दोष लग्न और चन्द्रमा दोनों से देखा जाता है। यह मार्गदर्शन है, निर्णय नहीं — विवाह तय करने से पहले पंडित जी से परामर्श करें।'
    },
    ne: {
      k: ['वर्ण', 'वश्य', 'तारा', 'योनी', 'ग्रह मैत्री', 'गण', 'भकूट', 'नाडी'],
      bride: 'वधू',
      groom: 'वर',
      min: 'शास्त्रीय न्यूनतम: १८',
      bands: [
        { title: 'उत्कृष्ट मिलन', note: 'अधिकांश कूट मिल्छन्। शास्त्रीय मापदण्डमा यो बलियो जोडी हो।' },
        { title: 'शुभ मिलन', note: 'गुण १८ भन्दा माथि छ। तलका कमजोर कूटबारे परामर्शमा छलफल गर्नु उचित हुन्छ।' },
        { title: 'सामान्य मिलन', note: 'गुण १८ भन्दा कम छ। शास्त्रीय परम्पराले निर्णयअघि कमजोर कूट गहिरोसँग हेर्न भन्छ।' },
        { title: 'गहिरो विचार आवश्यक', note: 'धेरै कूट मिल्दैनन्। परम्परामा विस्तृत अध्ययनबिना यो जोडी सिफारिस गरिँदैन।' }
      ],
      strongest: 'सबैभन्दा बलियो कूट: {k} ({s}/{m})।',
      weakest: 'सबैभन्दा कमजोर कूट: {k} ({s}/{m})।',
      moonTitle: 'जन्मको समयमा चन्द्रमा',
      rashiLabel: 'राशि',
      lagnaLabel: 'लग्न',
      nakLabel: 'नक्षत्र',
      padaLabel: 'पाद',
      placeLabel: 'स्थान',
      tzLabel: 'समय क्षेत्र',
      kootaTitle: 'अष्टकूट',
      mangalTitle: 'मंगल दोष',
      mangalLagna: 'लग्नबाट: {h} भाव — {v}।',
      mangalMoon: 'चन्द्रमाबाट: {h} भाव — {v}।',
      mangalNoLagna: 'चन्द्रमाबाट: {h} भाव — {v}। लग्न जाँचका लागि जन्म स्थान भर्नुहोस्।',
      mangalYes: 'दोष छ',
      mangalNo: 'दोष छैन',
      mangalMild: ' मंगल आफ्नै वा उच्च राशिमा छ, जसले परम्परामा यसलाई हल्का बनाउँछ।',
      mangalBoth: 'दुवै कुण्डलीमा यो दोष छ, जसलाई परम्परामा सन्तुलित मानिन्छ।',
      mangalOne: 'एउटा कुण्डलीमा मात्र यो दोष छ — यसबारे परामर्शमा छलफल गरिन्छ।',
      mangalNone: 'लग्न वा चन्द्रमाबाट कुनै पनि कुण्डलीमा यो दोष छैन।',
      mangalNote: 'लग्न र चन्द्रमा दुवैबाट हेरिएको छ। यीमध्ये कुनैबाट पनि मंगल १, २, ४, ७, ८ वा १२ भावमा भए दोष मानिन्छ; अन्तिम दृष्टिमा शुक्र र नवमांश पनि हेरिन्छ।',
      mangalNoteMoon: 'जन्म स्थान भरिएको छैन, त्यसैले यो चन्द्रमाबाट मात्र हेरिएको हो। लग्न जाँचका लागि दुवैको जन्म स्थान भर्नुहोस्।',
      note: {
        varna: [
          'वधूको वर्ण वरभन्दा माथि छ।',
          'वरको वर्ण वधूको बराबर वा माथि छ।'
        ],
        vashya: [
          'दुवै वर्ग एकअर्काका अनुकूल छैनन्।',
          'वर्ग फरक छन्, तर अनुकूल छन्।',
          'दुवै राशि एउटै वश्य वर्गमा छन्।'
        ],
        tara: [
          'दुवै दिशामा तारा कमजोर (तेस्रो, पाँचौँ वा सातौँ) छ।',
          'एउटा दिशामा तारा कमजोर (तेस्रो, पाँचौँ वा सातौँ) छ।',
          'दुवै दिशामा तारा शुभ छ।'
        ],
        yoni: [
          'दुवै योनी विरोधी छन्।',
          'दुवै योनी आंशिक रूपमा अनुकूल छन्।',
          'दुवै योनी तटस्थ छन्।',
          'दुवै योनी मैत्रीपूर्ण छन्।',
          'दुवै कुण्डलीको योनी एउटै छ।'
        ],
        maitri: [
          'दुवै स्वामी स्वाभाविक शत्रु हुन्।',
          'एउटा स्वामी तटस्थ र अर्को शत्रु छ।',
          'एउटा स्वामी मित्र र अर्को शत्रु छ।',
          'दुवै स्वामी एकअर्काप्रति तटस्थ छन्।',
          'एउटा स्वामी मित्र र अर्को तटस्थ छ।',
          'दुवै राशि स्वामी स्वाभाविक मित्र हुन्।'
        ],
        gana: {
          same: 'दुवै एउटै गणका हुन्।',
          good: 'देव र मनुष्य गण अनुकूल छन्।',
          ok: 'मनुष्य र देव गण स्वीकार्य छन्।',
          devaRak: 'देव र राक्षस गण अनुकूल छैनन्।',
          manuRak: 'मनुष्य र राक्षस गण अनुकूल छैनन्।'
        },
        bhakoot: [
          'राशि दूरी ({p}) भकूट दोष बनाउँछ।',
          'राशि दूरी ({p}) भकूट दोष बनाउँदैन।'
        ],
        nadi: [
          'दुवैको नाडी एउटै छ — नाडी दोष।',
          'दुवैको नाडी फरक छ।'
        ]
      },
      errBoth: 'वधू र वर दुवैको जन्म मिति र जन्म समय भर्नुहोस्।',
      placeSearching: 'स्थान खोजिँदैछ\u2026',
      placeNone: 'कुनै स्थान भेटिएन। हिज्जे जाँच्नुहोस् वा नजिकको सहर छान्नुहोस्।',
      placeOffline: 'अहिले स्थान खोज्न सकिएन। तपाईं समय क्षेत्र आफैं छान्न सक्नुहुन्छ।',
      regionDefault: 'सबै प्रदेश र राज्य',
      regionCapital: 'प्रदेश राजधानी छानिएको छ। फेर्न सहर वा गाउँ लेख्नुहोस्।',
      countryIndia: 'भारत',
      countryNepal: 'नेपाल',
      disclaimer: 'गुण मिलन शास्त्रीय अष्टकूट तालिका (वर्ण, वश्य, तारा, योनी, ग्रह मैत्री, गण, भकूट, नाडी) मा आधारित छ। चन्द्रमाको स्थिति लाहिडी अयनांश र अनुमानित एफेमेरिसबाट निकालिन्छ, त्यसैले सीमामा रहेको कुनै कूट विशेष सफ्टवेयरभन्दा अलि फरक हुन सक्छ। जहाँ जन्म स्थान उपलब्ध छ त्यहाँ मंगल दोष लग्न र चन्द्रमा दुवैबाट हेरिन्छ। यो मार्गदर्शन हो, निर्णय होइन — विवाह तय गर्नुअघि पण्डित जीसँग परामर्श गर्नुहोस्।'
    }
  };

  /* ---------- helpers ---------- */
  function currentLang() {
    try {
      const api = window.ShubhVedaI18n;
      if (api && typeof api.getCurrentLang === 'function') {
        const l = api.getCurrentLang();
        if (L[l]) return l;
      }
      const stored = localStorage.getItem('shubhveda_lang');
      if (L[stored]) return stored;
    } catch (e) {}
    const dt = String(document.documentElement.lang || 'en').slice(0, 2);
    return L[dt] ? dt : 'en';
  }

  function el(id) { return document.getElementById(id); }

  function node(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function fill(tpl, map) {
    return tpl.replace(/\{(\w+)\}/g, (m, k) => (map[k] !== undefined ? map[k] : m));
  }

  function fmtScore(n) {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
  }

  function bandOf(total) {
    if (total >= 28) return 0;
    if (total >= 18) return 1;
    if (total >= 8) return 2;
    return 3;
  }

  function ganaNote(t, vg, gg) {
    if (vg === gg) return t.note.gana.same;
    if (vg === 1 && gg === 0) return t.note.gana.good;
    if (vg === 0 && gg === 1) return t.note.gana.ok;
    if (vg === 0 && gg === 2) return t.note.gana.devaRak;
    if (vg === 2 && gg === 0) return t.note.gana.devaRak;
    return t.note.gana.manuRak;
  }

  /* ---------- rows ---------- */
  function buildRows(res, lang) {
    const t = L[lang];
    const scores = res.scores;
    const g = res.groups;
    const rows = [];

    rows.push({
      name: t.k[0],
      score: scores[0],
      max: KOOTA_MAX[0],
      fact: t.bride + ': ' + VARNA_NAMES[lang][res.varnaBride] + ' \u00B7 ' + t.groom + ': ' + VARNA_NAMES[lang][res.varnaGroom],
      note: t.note.varna[scores[0] > 0 ? 1 : 0]
    });

    rows.push({
      name: t.k[1],
      score: scores[1],
      max: KOOTA_MAX[1],
      fact: t.bride + ': ' + VASHYA_NAMES[lang][g.vg] + ' \u00B7 ' + t.groom + ': ' + VASHYA_NAMES[lang][g.gg],
      note: t.note.vashya[scores[1] === 2 ? 2 : scores[1] === 0 ? 0 : 1]
    });

    rows.push({
      name: t.k[2],
      score: scores[2],
      max: KOOTA_MAX[2],
      fact: t.bride + ' \u2192 ' + t.groom + ': ' + (res.taraDir[0] ? '\u2713' : '\u2717') +
        ' \u00B7 ' + t.groom + ' \u2192 ' + t.bride + ': ' + (res.taraDir[1] ? '\u2713' : '\u2717'),
      note: t.note.tara[scores[2] === 3 ? 2 : scores[2] === 0 ? 0 : 1]
    });

    rows.push({
      name: t.k[3],
      score: scores[3],
      max: KOOTA_MAX[3],
      fact: t.bride + ': ' + YONI_NAMES[lang][res.yoniBride] + ' \u00B7 ' + t.groom + ': ' + YONI_NAMES[lang][res.yoniGroom],
      note: t.note.yoni[scores[3]]
    });

    rows.push({
      name: t.k[4],
      score: scores[4],
      max: KOOTA_MAX[4],
      fact: t.bride + ': ' + PLANETS[lang][g.vLord] + ' \u00B7 ' + t.groom + ': ' + PLANETS[lang][g.gLord],
      note: t.note.maitri[scores[4] === 5 ? 5 : scores[4] === 4 ? 4 : scores[4] === 3 ? 3 : scores[4] === 1 ? 2 : scores[4] === 0.5 ? 1 : 0]
    });

    rows.push({
      name: t.k[5],
      score: scores[5],
      max: KOOTA_MAX[5],
      fact: t.bride + ': ' + GANA_NAMES[lang][g.vGana] + ' \u00B7 ' + t.groom + ': ' + GANA_NAMES[lang][g.gGana],
      note: ganaNote(t, g.vGana, g.gGana)
    });

    rows.push({
      name: t.k[6],
      score: scores[6],
      max: KOOTA_MAX[6],
      fact: SIGNS[lang][res.vadhu.rashi] + ' \u00B7 ' + SIGNS[lang][res.varu.rashi] + ' \u00B7 ' + res.bhakootPair,
      note: fill(t.note.bhakoot[scores[6] > 0 ? 1 : 0], { p: res.bhakootPair })
    });

    rows.push({
      name: t.k[7],
      score: scores[7],
      max: KOOTA_MAX[7],
      fact: t.bride + ': ' + NADI_NAMES[lang][g.vNadi] + ' \u00B7 ' + t.groom + ': ' + NADI_NAMES[lang][g.gNadi],
      note: t.note.nadi[scores[7] > 0 ? 1 : 0]
    });

    return rows;
  }

  /* ---------- render ---------- */
  let lastResult = null;

  function render(res) {
    const box = el('milan-results');
    if (!box || !res) return;
    const lang = currentLang();
    const t = L[lang];
    const rows = buildRows(res, lang);
    const band = bandOf(res.total);

    const frag = document.createDocumentFragment();

    const card = node('div', 'milan-score-card');
    card.setAttribute('data-band', String(band));
    const head = node('div', 'milan-score-head');
    head.append(node('span', 'milan-verdict', t.bands[band].title));
    const value = node('span', 'milan-score-value');
    value.append(document.createTextNode(fmtScore(res.total)));
    value.append(node('small', '', '/36'));
    head.append(value);
    card.append(head);

    const meter = node('div', 'milan-meter');
    meter.setAttribute('role', 'img');
    meter.setAttribute('aria-label', fmtScore(res.total) + ' / 36');
    const bar = node('span');
    bar.style.width = Math.max(2, (res.total / 36) * 100).toFixed(1) + '%';
    meter.append(bar);
    card.append(meter);

    card.append(node('p', 'milan-score-note', t.bands[band].note));
    card.append(node('p', 'milan-score-min', t.min));

    const byRatio = (a, b) => (a.score / a.max) - (b.score / b.max);
    const best = rows.slice().sort((a, b) => byRatio(b, a) || (b.max - a.max))[0];
    const worst = rows.slice().sort((a, b) => byRatio(a, b) || (b.max - a.max))[0];
    const insights = node('p', 'milan-insight');
    insights.textContent = fill(t.strongest, { k: best.name, s: fmtScore(best.score), m: best.max }) + ' ' +
      fill(t.weakest, { k: worst.name, s: fmtScore(worst.score), m: worst.max });
    card.append(insights);
    frag.append(card);

    const pair = node('div', 'milan-pair');
    [['vadhu', t.bride], ['varu', t.groom]].forEach((side) => {
      const chart = res[side[0]];
      const owner = res[side[0] + 'Name'] || side[1];
      const cardEl = node('div', 'milan-moon-card');
      cardEl.append(node('span', 'milan-moon-role', side[1]));
      cardEl.append(node('strong', 'milan-moon-name', owner));
      const dl = node('dl', 'milan-moon-list');
      const put = (label, val) => {
        const row = node('div', 'milan-moon-row');
        row.append(node('dt', '', label));
        row.append(node('dd', '', val));
        dl.append(row);
      };
      put(t.rashiLabel, SIGNS[lang][chart.rashi]);
      if (chart.asc != null) put(t.lagnaLabel, SIGNS[lang][Math.floor(chart.asc / 30)]);
      put(t.nakLabel, NAKSHATRAS[lang][chart.nak]);
      put(t.padaLabel, String(chart.pada));
      if (chart.place) put(t.placeLabel, chart.place);
      put(t.tzLabel, chart.tz || '\u2014');
      cardEl.append(dl);
      pair.append(cardEl);
    });
    frag.append(pair);

    const list = node('div', 'milan-koota-list');
    const listHead = node('h3', 'milan-block-title', t.kootaTitle);
    frag.append(listHead);
    rows.forEach((row) => {
      const state = row.score === row.max ? 'full' : row.score === 0 ? 'zero' : 'part';
      const item = node('div', 'milan-koota');
      item.setAttribute('data-state', state);
      const rowHead = node('div', 'milan-koota-head');
      rowHead.append(node('span', 'milan-koota-name', row.name));
      rowHead.append(node('span', 'milan-koota-score', fmtScore(row.score) + ' / ' + row.max));
      item.append(rowHead);
      const track = node('div', 'milan-koota-track');
      const fillBar = node('span');
      fillBar.style.width = (row.score / row.max) * 100 + '%';
      track.append(fillBar);
      item.append(track);
      if (row.fact) item.append(node('p', 'milan-koota-fact', row.fact));
      item.append(node('p', 'milan-koota-note', row.note));
      list.append(item);
    });
    frag.append(list);

    const dosha = node('div', 'milan-dosha');
    dosha.append(node('h3', 'milan-block-title', t.mangalTitle));
    const mk = res.mangal;
    let anyLagna = false;
    [['vadhu', t.bride], ['varu', t.groom]].forEach((side) => {
      const m = mk[side[0]];
      const owner = res[side[0] + 'Name'] || side[1];
      const line = node('p', 'milan-dosha-line');
      line.append(node('strong', '', owner + ': '));
      if (m.lagnaHouse != null) {
        anyLagna = true;
        line.append(document.createTextNode(fill(t.mangalLagna, {
          h: String(m.lagnaHouse),
          v: m.lagnaDosha ? t.mangalYes : t.mangalNo
        })));
        line.append(node('span', 'milan-dosha-sep', ' \u00B7 '));
        line.append(document.createTextNode(fill(t.mangalMoon, {
          h: String(m.house),
          v: m.moonDosha ? t.mangalYes : t.mangalNo
        })));
      } else {
        line.append(document.createTextNode(fill(t.mangalNoLagna, {
          h: String(m.house),
          v: m.moonDosha ? t.mangalYes : t.mangalNo
        })));
      }
      if (m.dosha && m.mild) line.append(document.createTextNode(t.mangalMild));
      line.setAttribute('data-dosha', m.dosha ? 'yes' : 'no');
      dosha.append(line);
    });
    const both = mk.vadhu.dosha && mk.varu.dosha;
    const one = mk.vadhu.dosha !== mk.varu.dosha;
    dosha.append(node('p', 'milan-dosha-summary', both ? t.mangalBoth : one ? t.mangalOne : t.mangalNone));
    dosha.append(node('p', 'milan-dosha-note', anyLagna ? t.mangalNote : t.mangalNoteMoon));
    frag.append(dosha);

    box.replaceChildren(frag);
    box.hidden = false;
    lastResult = res;
  }

  function renderDisclaimer() {
    const p = el('milan-disclaimer');
    if (p) p.textContent = L[currentLang()].disclaimer;
  }

  /* ---------- timezone selects ---------- */
  const TZ_FALLBACK = [
    'Asia/Kolkata', 'Asia/Kathmandu', 'Asia/Colombo', 'Asia/Karachi', 'Asia/Dhaka',
    'Asia/Dubai', 'Asia/Qatar', 'Asia/Riyadh', 'Asia/Singapore', 'Asia/Kuala_Lumpur',
    'Asia/Hong_Kong', 'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Bangkok', 'Asia/Jakarta',
    'Australia/Sydney', 'Australia/Melbourne', 'Australia/Perth', 'Pacific/Auckland',
    'Europe/London', 'Europe/Dublin', 'Europe/Paris', 'Europe/Berlin', 'Europe/Amsterdam',
    'Europe/Zurich', 'Europe/Rome', 'Europe/Madrid', 'Europe/Stockholm', 'Europe/Moscow',
    'Africa/Nairobi', 'Africa/Johannesburg', 'Africa/Lagos', 'Africa/Cairo',
    'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
    'America/Toronto', 'America/Vancouver', 'America/Sao_Paulo', 'America/Mexico_City'
  ];

  function tzList() {
    try {
      if (typeof Intl.supportedValuesOf === 'function') {
        const all = Intl.supportedValuesOf('timeZone');
        if (all && all.length > 100) return all;
      }
    } catch (e) {}
    return TZ_FALLBACK;
  }

  let cachedZones = null;

  function fillTz(select) {
    if (!select) return;
    if (!cachedZones) cachedZones = tzList();
    let browserTz = 'Asia/Kolkata';
    try {
      const bz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (bz) browserTz = bz;
    } catch (e) {}
    const opts = cachedZones.indexOf(browserTz) === -1
      ? [browserTz].concat(cachedZones)
      : cachedZones;
    const frag = document.createDocumentFragment();
    opts.forEach((z) => {
      const opt = document.createElement('option');
      opt.value = z;
      opt.textContent = z;
      frag.append(opt);
    });
    select.replaceChildren(frag);
    select.value = browserTz;
  }

  /* ---------- form ---------- */
  function readSide(prefix) {
    const nameEl = el('milan-' + prefix + '-name');
    const dobEl = el('milan-' + prefix + '-dob');
    const tobEl = el('milan-' + prefix + '-tob');
    const tzEl = el('milan-' + prefix + '-tz');
    const placeEl = el('milan-' + prefix + '-place');
    return {
      name: nameEl ? nameEl.value.trim() : '',
      dob: dobEl ? dobEl.value : '',
      tob: tobEl ? tobEl.value : '',
      tz: tzEl ? tzEl.value : '',
      place: placeEl ? placeEl.value.trim() : ''
    };
  }

  /* ---------- place of birth ---------- */
  const placeState = { vadhu: null, var: null };
  const placeTimers = { vadhu: null, var: null };
  const placeSeq = { vadhu: 0, var: 0 };
  const placeAbort = { vadhu: null, var: null };
  const tzManual = { vadhu: false, var: false };
  const regionState = { vadhu: '', var: '' };

  function normPlace(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\u0900-\u097F ]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function regions() {
    return (window.ShubhPanchang && window.ShubhPanchang.REGIONS) || [];
  }

  function regionById(id) {
    return regions().filter((r) => r.id === id)[0] || null;
  }

  function regionName(region) {
    const lang = currentLang();
    if (!region || !region.name) return '';
    return region.name[lang] || region.name.en || '';
  }

  function regionCapital(region) {
    if (!region) return null;
    const list = (window.ShubhPanchang && window.ShubhPanchang.REGION_CITIES) || [];
    const found = list.filter((c) => c.regionId === region.id)[0];
    if (found) return found;
    return {
      id: 'region-' + region.id,
      lat: region.lat, lon: region.lon, tz: region.tz,
      country: region.country, admin1: region.name.en, regionId: region.id,
      name: region.capital
    };
  }

  function normRegion(value) {
    return normPlace(value).replace(/&/g, ' and ').replace(/\band\b/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function regionForCity(city) {
    if (!city) return null;
    if (city.regionId) {
      const direct = regionById(city.regionId);
      if (direct) return direct;
    }
    if (!city.country) return null;
    const country = normRegion(city.country);
    const admin = normRegion(city.admin1 || '');
    if (!admin) return null;
    return regions().filter((r) => {
      if (normRegion(r.country) !== country) return false;
      const name = normRegion(r.name.en);
      return admin === name || admin.indexOf(name) !== -1 || name.indexOf(admin) !== -1;
    })[0] || null;
  }

  function regionMatchesCity(prefix, city) {
    const regionId = regionState[prefix];
    if (!regionId) return true;
    const region = regionById(regionId);
    if (!region || !city) return false;
    if (city.regionId) return city.regionId === regionId;
    if (city.country && normRegion(city.country) !== normRegion(region.country)) return false;
    const admin = normRegion(city.admin1 || '');
    if (!admin) return false;
    const name = normRegion(region.name.en);
    return admin === name || admin.indexOf(name) !== -1 || name.indexOf(admin) !== -1;
  }

  function fillMilanRegions() {
    const t = L[currentLang()];
    ['vadhu', 'var'].forEach((prefix) => {
      const select = el('milan-' + prefix + '-region');
      if (!select) return;
      const current = regionState[prefix] || select.value || '';
      select.replaceChildren();
      const all = document.createElement('option');
      all.value = '';
      all.textContent = t.regionDefault;
      select.appendChild(all);
      ['India', 'Nepal'].forEach((country) => {
        const items = regions().filter((r) => r.country === country);
        if (!items.length) return;
        const group = document.createElement('optgroup');
        group.label = L[currentLang()][country === 'India' ? 'countryIndia' : 'countryNepal'] || country;
        items.forEach((r) => {
          const opt = document.createElement('option');
          opt.value = r.id;
          opt.textContent = regionName(r);
          group.appendChild(opt);
        });
        select.appendChild(group);
      });
      if (current && select.querySelector('option[value="' + current + '"]')) {
        select.value = current;
      } else {
        regionState[prefix] = '';
        select.value = '';
      }
    });
  }

  function resetMilanPlace(prefix) {
    placeState[prefix] = null;
    placeSeq[prefix]++;
    if (placeTimers[prefix]) { clearTimeout(placeTimers[prefix]); placeTimers[prefix] = null; }
    if (placeAbort[prefix]) { try { placeAbort[prefix].abort(); } catch (e) {} placeAbort[prefix] = null; }
    const input = el('milan-' + prefix + '-place');
    if (input) input.value = '';
    const status = el('milan-' + prefix + '-place-status');
    if (status) { status.hidden = true; status.textContent = ''; status.className = 'milan-place-status'; }
    hideMilanPlaceList(prefix);
  }

  function onMilanRegionChange(prefix) {
    const select = el('milan-' + prefix + '-region');
    const t = L[currentLang()];
    regionState[prefix] = select ? select.value : '';
    resetMilanPlace(prefix);
    if (!regionState[prefix]) return;
    const region = regionById(regionState[prefix]);
    const capital = regionCapital(region);
    if (!capital) return;
    const capitalLabel = (capital.name && (capital.name[currentLang()] || capital.name.en)) || '';
    chooseMilanPlace(prefix, {
      name: capitalLabel,
      lat: capital.lat,
      lon: capital.lon,
      tz: capital.tz,
      admin1: region.name.en,
      country: region.country,
      regionId: region.id
    });
    const status = el('milan-' + prefix + '-place-status');
    if (status) {
      status.hidden = false;
      status.className = 'milan-place-status is-ok';
      status.textContent = [capitalLabel, regionName(region)].filter(Boolean).join(', ') +
        (capital.tz ? ' \u00B7 ' + capital.tz : '') + '. ' + t.regionCapital;
    }
  }

  function localMilanPlaces(query, regionId) {
    const list = ((window.ShubhPanchang && window.ShubhPanchang.CITIES) || [])
      .concat((window.ShubhPanchang && window.ShubhPanchang.REGION_CITIES) || []);
    const q = normPlace(query);
    if (!q) return [];
    const out = [];
    list.forEach((c) => {
      if (out.some((x) => Math.abs(x.lat - c.lat) < 0.02 && Math.abs(x.lon - c.lon) < 0.02)) return;
      if (regionId) {
        if (c.regionId) {
          if (c.regionId !== regionId) return;
        } else {
          const region = regionById(regionId);
          if (!region || normRegion(c.country) !== normRegion(region.country)) return;
          const admin = normRegion(c.admin1 || '');
          const name = normRegion(region.name.en);
          if (!admin || (admin !== name && admin.indexOf(name) === -1 && name.indexOf(admin) === -1)) return;
        }
      }
      const hit = [c.name.en, c.name.hi, c.name.ne].some((n) => normPlace(n).indexOf(q) !== -1);
      if (!hit) return;
      out.push({
        name: c.name.en, lat: c.lat, lon: c.lon, tz: c.tz,
        admin1: c.admin1 || '', country: c.country || '', regionId: c.regionId || '',
        localName: c.name
      });
    });
    return out.slice(0, 6);
  }

  function searchMilanPlaces(query, signal) {
    if (typeof fetch !== 'function') return Promise.reject(new Error('fetch unavailable'));
    const url = 'https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(query) +
      '&count=6&language=en&format=json';
    return fetch(url, signal ? { signal: signal } : undefined).then((res) => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }).then((data) => (data.results || []).map((r) => ({
      name: r.name,
      lat: Number(r.latitude),
      lon: Number(r.longitude),
      tz: r.timezone || '',
      admin1: r.admin1 || '',
      country: r.country || ''
    })).filter((p) => isFinite(p.lat) && isFinite(p.lon)));
  }

  function hideMilanPlaceList(prefix) {
    const list = el('milan-' + prefix + '-place-list');
    if (list) { list.hidden = true; list.replaceChildren(); }
    const input = el('milan-' + prefix + '-place');
    if (input) input.setAttribute('aria-expanded', 'false');
  }

  function setMilanTz(prefix, tz) {
    const select = el('milan-' + prefix + '-tz');
    if (!select || !tz) return;
    const exists = Array.prototype.some.call(select.options, (o) => o.value === tz);
    if (!exists) {
      const opt = document.createElement('option');
      opt.value = tz;
      opt.textContent = tz;
      select.append(opt);
    }
    select.value = tz;
    tzManual[prefix] = false;
  }

  function renderMilanPlaceList(prefix, places) {
    const list = el('milan-' + prefix + '-place-list');
    const input = el('milan-' + prefix + '-place');
    if (!list) return;
    if (!places.length) { hideMilanPlaceList(prefix); return; }
    const frag = document.createDocumentFragment();
    places.forEach((place) => {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'milan-suggestion';
      btn.setAttribute('role', 'option');
      btn.append(node('span', 'milan-suggestion-name', place.name));
      btn.append(node('span', 'milan-suggestion-meta',
        [place.admin1, place.country, place.tz].filter(Boolean).join(' \u00B7 ')));
      btn.addEventListener('click', () => chooseMilanPlace(prefix, place));
      li.append(btn);
      frag.append(li);
    });
    list.replaceChildren(frag);
    list.hidden = false;
    if (input) input.setAttribute('aria-expanded', 'true');
  }

  function chooseMilanPlace(prefix, place) {
    const input = el('milan-' + prefix + '-place');
    if (input) input.value = place.name;
    placeState[prefix] = place;
    const region = regionForCity(place);
    regionState[prefix] = region ? region.id : '';
    const regionSelect = el('milan-' + prefix + '-region');
    if (regionSelect) regionSelect.value = regionState[prefix];
    if (place.tz) setMilanTz(prefix, place.tz);
    const status = el('milan-' + prefix + '-place-status');
    if (status) {
      status.hidden = false;
      status.className = 'milan-place-status is-ok';
      status.textContent = [place.name, place.admin1, place.country].filter(Boolean).join(', ') +
        (place.tz ? ' \u00B7 ' + place.tz : '');
    }
    hideMilanPlaceList(prefix);
    placeSeq[prefix]++;
    if (placeAbort[prefix]) { try { placeAbort[prefix].abort(); } catch (e) {} placeAbort[prefix] = null; }
  }

  function runMilanPlaceSearch(prefix, query, seq) {
    const t = L[currentLang()];
    const local = localMilanPlaces(query, regionState[prefix]);
    if (local.length) renderMilanPlaceList(prefix, local);
    const status = el('milan-' + prefix + '-place-status');
    if (status) {
      status.hidden = false;
      status.className = 'milan-place-status';
      status.textContent = t.placeSearching;
    }
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    placeAbort[prefix] = controller;
    searchMilanPlaces(query, controller ? controller.signal : null).then((remote) => {
      if (seq !== placeSeq[prefix]) return;
      const merged = local.slice();
      remote.forEach((p) => {
        if (!regionMatchesCity(prefix, p)) return;
        const dup = merged.some((m) => Math.abs(m.lat - p.lat) < 0.03 && Math.abs(m.lon - p.lon) < 0.03);
        if (!dup) merged.push(p);
      });
      if (merged.length) {
        renderMilanPlaceList(prefix, merged);
        if (status) { status.hidden = true; status.textContent = ''; }
      } else {
        hideMilanPlaceList(prefix);
        if (status) {
          status.hidden = false;
          status.className = 'milan-place-status is-err';
          status.textContent = t.placeNone;
        }
      }
    }).catch((err) => {
      if (seq !== placeSeq[prefix] || (err && err.name === 'AbortError')) return;
      if (!local.length && status) {
        status.hidden = false;
        status.className = 'milan-place-status is-err';
        status.textContent = t.placeOffline;
      }
    }).then(() => {
      if (seq === placeSeq[prefix]) placeAbort[prefix] = null;
    });
  }

  function resolveMilanPlace(prefix) {
    const input = el('milan-' + prefix + '-place');
    if (!input) return Promise.resolve(null);
    const q = input.value.trim();
    if (!q) return Promise.resolve(null);
    if (placeState[prefix] && normPlace(placeState[prefix].name) === normPlace(q)) {
      return Promise.resolve(placeState[prefix]);
    }
    const local = localMilanPlaces(q, regionState[prefix]);
    if (local.length) {
      chooseMilanPlace(prefix, local[0]);
      return Promise.resolve(local[0]);
    }
    return searchMilanPlaces(q).then((list) => {
      const match = list.filter((p) => regionMatchesCity(prefix, p))[0];
      if (!match) return null;
      chooseMilanPlace(prefix, match);
      return match;
    }).catch(() => null);
  }

  function bindMilanPlace(prefix) {
    const input = el('milan-' + prefix + '-place');
    const list = el('milan-' + prefix + '-place-list');
    const status = el('milan-' + prefix + '-place-status');
    if (!input) return;
    input.addEventListener('input', () => {
      placeState[prefix] = null;
      if (status) { status.hidden = true; status.textContent = ''; }
      if (placeTimers[prefix]) { clearTimeout(placeTimers[prefix]); placeTimers[prefix] = null; }
      if (placeAbort[prefix]) { try { placeAbort[prefix].abort(); } catch (e) {} placeAbort[prefix] = null; }
      hideMilanPlaceList(prefix);
      const q = input.value.trim();
      if (q.length < 2) return;
      const seq = ++placeSeq[prefix];
      placeTimers[prefix] = setTimeout(() => runMilanPlaceSearch(prefix, q, seq), 350);
    });
    input.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') { hideMilanPlaceList(prefix); return; }
      if (ev.key === 'ArrowDown' && list && !list.hidden) {
        const first = list.querySelector('button');
        if (first) { ev.preventDefault(); first.focus(); }
      }
    });
    if (list) {
      list.addEventListener('keydown', (ev) => {
        const buttons = Array.prototype.slice.call(list.querySelectorAll('button'));
        const idx = buttons.indexOf(document.activeElement);
        if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
          if (!buttons.length) return;
          ev.preventDefault();
          const next = ev.key === 'ArrowDown'
            ? (idx + 1) % buttons.length
            : (idx - 1 + buttons.length) % buttons.length;
          buttons[next].focus();
        } else if (ev.key === 'Enter' && idx >= 0) {
          ev.preventDefault();
          buttons[idx].click();
        } else if (ev.key === 'Escape') {
          ev.preventDefault();
          hideMilanPlaceList(prefix);
          input.focus();
        }
      });
    }
  }

  function showError(msg) {
    const box = el('milan-error');
    if (!box) return;
    box.textContent = msg;
    box.hidden = false;
  }

  function hideError() {
    const box = el('milan-error');
    if (box) box.hidden = true;
  }

  function parseSide(side) {
    if (!side.dob || !side.tob) return null;
    const dp = side.dob.split('-').map(Number);
    const tp = side.tob.split(':').map(Number);
    if (dp.length !== 3 || tp.length < 2) return null;
    const y = dp[0], mo = dp[1], d = dp[2], h = tp[0], mi = tp[1];
    if (!y || !mo || !d || isNaN(h) || isNaN(mi)) return null;
    const check = new Date(Date.UTC(y, mo - 1, d));
    if (isNaN(check.getTime()) || check.getTime() > Date.now()) return null;
    let tz = side.tz;
    try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); } catch (e) { tz = 'Asia/Kolkata'; }
    return { y: y, mo: mo, d: d, h: h, mi: mi, tz: tz };
  }

  async function onSubmit() {
    hideError();
    const lang = currentLang();
    const t = L[lang];
    const vSide = readSide('vadhu');
    const gSide = readSide('var');

    const v = parseSide(vSide);
    const g = parseSide(gSide);
    if (!v || !g) {
      showError(t.errBoth);
      const target = !v ? el('milan-vadhu-dob') : el('milan-var-dob');
      if (target) target.focus();
      return;
    }

    const submit = el('milan-submit');
    let vPlace = null;
    let gPlace = null;
    if (vSide.place || gSide.place) {
      if (submit) submit.disabled = true;
      try {
        const found = await Promise.all([
          vSide.place ? resolveMilanPlace('vadhu') : Promise.resolve(null),
          gSide.place ? resolveMilanPlace('var') : Promise.resolve(null)
        ]);
        vPlace = found[0];
        gPlace = found[1];
      } finally {
        if (submit) submit.disabled = false;
      }
      if ((vSide.place && !vPlace) || (gSide.place && !gPlace)) {
        showError(t.errPlace);
        const target = (vSide.place && !vPlace) ? el('milan-vadhu-place') : el('milan-var-place');
        if (target) target.focus();
        return;
      }
    }

    if (!tzManual.vadhu && vPlace && vPlace.tz) { setMilanTz('vadhu', vPlace.tz); v.tz = vPlace.tz; }
    if (!tzManual['var'] && gPlace && gPlace.tz) { setMilanTz('var', gPlace.tz); g.tz = gPlace.tz; }

    let vadhu, varu;
    try {
      vadhu = chartFor(v.y, v.mo, v.d, v.h, v.mi, v.tz, vPlace ? vPlace.lat : NaN, vPlace ? vPlace.lon : NaN);
      varu = chartFor(g.y, g.mo, g.d, g.h, g.mi, g.tz, gPlace ? gPlace.lat : NaN, gPlace ? gPlace.lon : NaN);
    } catch (err) {
      showError(t.errBoth);
      return;
    }

    const res = computeMilan(vadhu, varu);
    vadhu.place = vPlace ? vPlace.name : '';
    vadhu.tz = v.tz;
    varu.place = gPlace ? gPlace.name : '';
    varu.tz = g.tz;
    res.vadhu = vadhu;
    res.varu = varu;
    res.vadhuName = vSide.name;
    res.varuName = gSide.name;
    res.varnaBride = VARNA_OF[vadhu.rashi];
    res.varnaGroom = VARNA_OF[varu.rashi];
    res.yoniBride = YONI_OF[vadhu.nak];
    res.yoniGroom = YONI_OF[varu.nak];

    render(res);
    const box = el('milan-results');
    if (box) {
      setTimeout(() => {
        try { box.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {}
      }, 60);
    }
  }

  function onReset() {
    ['vadhu', 'var'].forEach((prefix) => {
      ['name', 'dob', 'tob', 'place'].forEach((field) => {
        const input = el('milan-' + prefix + '-' + field);
        if (input) input.value = '';
      });
      if (placeTimers[prefix]) { clearTimeout(placeTimers[prefix]); placeTimers[prefix] = null; }
      if (placeAbort[prefix]) { try { placeAbort[prefix].abort(); } catch (e) {} placeAbort[prefix] = null; }
      placeSeq[prefix]++;
      placeState[prefix] = null;
      regionState[prefix] = '';
      const regionEl = el('milan-' + prefix + '-region');
      if (regionEl) regionEl.value = '';
      tzManual[prefix] = false;
      const status = el('milan-' + prefix + '-place-status');
      if (status) { status.hidden = true; status.textContent = ''; status.className = 'milan-place-status'; }
      hideMilanPlaceList(prefix);
      fillTz(el('milan-' + prefix + '-tz'));
    });
    hideError();
    const box = el('milan-results');
    if (box) {
      box.hidden = true;
      box.replaceChildren();
    }
    lastResult = null;
    const target = el('milan-vadhu-name');
    if (target) { try { target.focus(); } catch (e) {} }
  }

  /* ---------- init ---------- */
  function init() {
    const today = new Date();
    const maxDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
    ['milan-vadhu-dob', 'milan-var-dob'].forEach((id) => {
      const input = el(id);
      if (input) {
        input.max = maxDate;
        input.removeAttribute('required');
      }
    });

    fillTz(el('milan-vadhu-tz'));
    fillTz(el('milan-var-tz'));
    fillMilanRegions();

    ['vadhu', 'var'].forEach((prefix) => {
      bindMilanPlace(prefix);
      const regionEl = el('milan-' + prefix + '-region');
      if (regionEl) {
        regionEl.addEventListener('change', () => onMilanRegionChange(prefix));
      }
      const tzEl = el('milan-' + prefix + '-tz');
      if (tzEl) {
        tzEl.addEventListener('change', () => { tzManual[prefix] = true; });
      }
    });

    document.addEventListener('click', (e) => {
      ['vadhu', 'var'].forEach((prefix) => {
        const input = el('milan-' + prefix + '-place');
        const group = input && input.closest ? input.closest('.milan-place-group') : null;
        if (group && !group.contains(e.target)) hideMilanPlaceList(prefix);
      });
    });

    const submit = el('milan-submit');
    if (submit) submit.addEventListener('click', onSubmit);
    const reset = el('milan-reset');
    if (reset) reset.addEventListener('click', onReset);

    ['milan-vadhu-dob', 'milan-var-dob', 'milan-vadhu-tob', 'milan-var-tob'].forEach((id) => {
      const input = el(id);
      if (input) {
        input.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter') {
            ev.preventDefault();
            onSubmit();
          }
        });
      }
    });

    document.addEventListener('languagechange', () => {
      renderDisclaimer();
      fillMilanRegions();
      if (lastResult) render(lastResult);
      ['vadhu', 'var'].forEach((prefix) => {
        const place = placeState[prefix];
        const status = el('milan-' + prefix + '-place-status');
        if (place && status && !status.hidden) {
          status.textContent = [place.name, place.admin1, place.country].filter(Boolean).join(', ') +
            (place.tz ? ' \u00B7 ' + place.tz : '');
        }
      });
    });

    renderDisclaimer();
  }

  init();
})();
