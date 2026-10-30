(function () {
  'use strict';

  const D2R = Math.PI / 180;
  const norm360 = d => ((d % 360) + 360) % 360;
  const norm180 = d => { d = norm360(d); return d > 180 ? d - 360 : d; };

  function julianDay(date) { return date.getTime() / 86400000 + 2440587.5; }

  function gmst(jd) {
    const T = (jd - 2451545.0) / 36525;
    return norm360(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T - T * T * T / 38710000);
  }

  function moonPosition(jd) {
    const T = (jd - 2451545.0) / 36525;
    const D = (297.8501921 + 445267.1114034 * T - 0.0018819 * T * T) * D2R;
    const M = (357.5291092 + 35999.0502909 * T - 0.0001536 * T * T) * D2R;
    const Mp = (134.9633964 + 477198.8675055 * T + 0.0087414 * T * T) * D2R;
    const F = (93.2720950 + 483202.0175233 * T - 0.0036539 * T * T) * D2R;
    const lon = norm360(moonLongitude(jd));
    const lat = 5.128122 * Math.sin(F) + 0.280602 * Math.sin(Mp + F) + 0.277693 * Math.sin(Mp - F)
              + 0.173237 * Math.sin(2 * D - F) + 0.055413 * Math.sin(2 * D - Mp + F)
              + 0.046271 * Math.sin(2 * D - Mp - F) + 0.032573 * Math.sin(2 * D + F)
              + 0.017198 * Math.sin(2 * Mp + F) + 0.009266 * Math.sin(2 * D + Mp - F)
              + 0.008822 * Math.sin(2 * Mp - F) + 0.008216 * Math.sin(2 * D - M + F)
              + 0.004324 * Math.sin(2 * D - 2 * Mp - F) + 0.0042 * Math.sin(2 * D + Mp + F);
    const eps = (23.439291 - 0.0130042 * T) * D2R;
    const lam = lon * D2R;
    const bet = lat * D2R;
    const ra = norm360(Math.atan2(Math.sin(lam) * Math.cos(eps) - Math.tan(bet) * Math.sin(eps), Math.cos(lam)) / D2R);
    const dec = Math.asin(Math.sin(bet) * Math.cos(eps) + Math.cos(bet) * Math.sin(eps) * Math.sin(lam)) / D2R;
    return { lon: lon, lat: lat, ra: ra, dec: dec };
  }

  function moonAltitude(date, lat, lon) {
    const jd = julianDay(date);
    const pos = moonPosition(jd);
    const lst = norm360(gmst(jd) + lon);
    const ha = norm180(lst - pos.ra) * D2R;
    const phi = lat * D2R;
    const dec = pos.dec * D2R;
    return Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(ha)) / D2R;
  }

  function sunLongitude(jd) {
    const T = (jd - 2451545.0) / 36525;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) * D2R;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M)
            + (0.019993 - 0.000101 * T) * Math.sin(2 * M)
            + 0.000289 * Math.sin(3 * M);
    const omega = (125.04 - 1934.136 * T) * D2R;
    return norm360(L0 + C - 0.00569 - 0.00478 * Math.sin(omega));
  }

  function moonLongitude(jd) {
    const T = (jd - 2451545.0) / 36525;
    const Lp = norm360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + T * T * T / 538841);
    const D = (297.8501921 + 445267.1114034 * T - 0.0018819 * T * T) * D2R;
    const M = (357.5291092 + 35999.0502909 * T - 0.0001536 * T * T) * D2R;
    const Mp = (134.9633964 + 477198.8675055 * T + 0.0087414 * T * T) * D2R;
    const F = (93.2720950 + 483202.0175233 * T - 0.0036539 * T * T) * D2R;
    const l = 6.288774 * Math.sin(Mp) + 1.274027 * Math.sin(2 * D - Mp) + 0.658314 * Math.sin(2 * D)
            + 0.213618 * Math.sin(2 * Mp) - 0.185116 * Math.sin(M) - 0.114332 * Math.sin(2 * F)
            + 0.058793 * Math.sin(2 * D - 2 * Mp) + 0.057066 * Math.sin(2 * D - M - Mp)
            + 0.053322 * Math.sin(2 * D + Mp) + 0.045758 * Math.sin(2 * D - M)
            - 0.040923 * Math.sin(M - Mp) - 0.034720 * Math.sin(D)
            - 0.030383 * Math.sin(M + Mp) + 0.015327 * Math.sin(2 * D - 2 * F)
            - 0.012528 * Math.sin(Mp + 2 * F) + 0.010980 * Math.sin(Mp - 2 * F)
            + 0.010675 * Math.sin(4 * D - Mp) + 0.010034 * Math.sin(3 * Mp);
    return norm360(Lp + l);
  }

  function ayanamsa(jd) {
    const t = (jd - 2451545.0) / 365.25;
    return 23.85236 + 0.0139722 * t;
  }

  const moonSidereal = jd => norm360(moonLongitude(jd) - ayanamsa(jd));
  const sunSidereal = jd => norm360(sunLongitude(jd) - ayanamsa(jd));

  function panchangAt(date) {
    const jd = julianDay(date);
    const ms = moonSidereal(jd);
    const ss = sunSidereal(jd);
    const rel = norm360(ms - ss);
    return {
      rel,
      tithi: Math.floor(rel / 12),
      karanaIndex: Math.floor(rel / 6),
      nakshatra: Math.floor(ms / (360 / 27)),
      pada: Math.floor((ms % (360 / 27)) / (360 / 108)) + 1,
      yoga: Math.floor(norm360(ms + ss) / (360 / 27)),
      rashi: Math.floor(ms / 30)
    };
  }

  function karanaNumber(k) {
    if (k === 0) return 0;
    if (k <= 56) return 1 + ((k - 1) % 7);
    return 7 + (k - 56);
  }

  function relativeLongitude(date) {
    const jd = julianDay(date);
    return norm360(moonSidereal(jd) - sunSidereal(jd));
  }

  const BOUNDARIES = {
    tithi: { width: 12, speed: 12.19, angle: function (date) { return relativeLongitude(date); } },
    nakshatra: { width: 360 / 27, speed: 13.176, angle: function (date) { return moonSidereal(julianDay(date)); } },
    yoga: { width: 360 / 27, speed: 14.16, angle: function (date) { return norm360(moonSidereal(julianDay(date)) + sunSidereal(julianDay(date))); } },
    karana: { width: 6, speed: 12.19, angle: function (date) { return relativeLongitude(date); } },
    rashi: { width: 30, speed: 13.176, angle: function (date) { return moonSidereal(julianDay(date)); } }
  };

  function boundary(kind, date, dir) {
    const cfg = BOUNDARIES[kind];
    const d0 = cfg.angle(date);
    const pos = ((d0 % cfg.width) + cfg.width) % cfg.width;
    const delta = dir > 0 ? cfg.width - pos : -(pos || cfg.width);
    let t = (delta / cfg.speed) * 86400e3;
    for (let i = 0; i < 6; i++) {
      const at = new Date(date.getTime() + t);
      const d = cfg.angle(at);
      const err = delta - norm180(d - d0);
      if (Math.abs(err) < 1e-4) break;
      const ahead = new Date(at.getTime() + 1800e3);
      const rate = norm180(cfg.angle(ahead) - d) / 0.5;
      t += (err / (rate || cfg.speed)) * 3600e3;
    }
    return new Date(date.getTime() + t);
  }

  function tithiEnd(date) {
    return boundary('tithi', date, 1);
  }

  function tithiStart(date) {
    return boundary('tithi', date, -1);
  }

  function sunTimes(date, lat, lon) {
    const jd = julianDay(date);
    const n = jd - 2451545.0;
    const L = norm360(280.460 + 0.9856474 * n);
    const g = norm360(357.528 + 0.9856003 * n) * D2R;
    const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * D2R;
    const eps = (23.439 - 0.0000004 * n) * D2R;
    const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
    const ra = norm360(Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) / D2R);
    const eot = 4 * norm180(L - 0.0057183 - ra);
    const noonUTC = 12 - lon / 15 - eot / 60;
    const cosH = (Math.sin(-0.833 * D2R) - Math.sin(lat * D2R) * Math.sin(dec)) /
                 (Math.cos(lat * D2R) * Math.cos(dec));
    if (cosH < -1 || cosH > 1) return null;
    const H = Math.acos(cosH) / D2R / 15;
    const base = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
    return {
      sunrise: new Date(base + (noonUTC - H) * 3600e3),
      sunset: new Date(base + (noonUTC + H) * 3600e3)
    };
  }

  function tzOffsetMs(tz, date) {
    const f = new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    const p = {};
    f.formatToParts(date).forEach(x => { p[x.type] = x.value; });
    const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
    return asUTC - Math.floor(date.getTime() / 1000) * 1000;
  }

  function localDateToUTC(y, m, d, h, min, tz) {
    const target = Date.UTC(y, m, d, h, min, 0);
    let ts = target;
    for (let i = 0; i < 4; i++) {
      const off = tzOffsetMs(tz, new Date(ts));
      const next = target - off;
      if (Math.abs(next - ts) < 1000) { ts = next; break; }
      ts = next;
    }
    return new Date(ts);
  }

  function sunTimesFor(parts, c) {
    const noon = localDateToUTC(parts.y, parts.m, parts.d, 12, 0, c.tz);
    const jd = julianDay(noon);
    const n = jd - 2451545.0;
    const L = norm360(280.460 + 0.9856474 * n);
    const g = norm360(357.528 + 0.9856003 * n) * D2R;
    const lambda = (L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g)) * D2R;
    const eps = (23.439 - 0.0000004 * n) * D2R;
    const dec = Math.asin(Math.sin(eps) * Math.sin(lambda));
    const ra = norm360(Math.atan2(Math.cos(eps) * Math.sin(lambda), Math.cos(lambda)) / D2R);
    const eot = 4 * norm180(L - 0.0057183 - ra);
    const noonUTC = 12 - c.lon / 15 - eot / 60;
    const cosH = (Math.sin(-0.833 * D2R) - Math.sin(c.lat * D2R) * Math.sin(dec)) /
                 (Math.cos(c.lat * D2R) * Math.cos(dec));
    if (cosH < -1 || cosH > 1) return null;
    const H = Math.acos(cosH) / D2R / 15;
    const base = Date.UTC(noon.getUTCFullYear(), noon.getUTCMonth(), noon.getUTCDate());
    return {
      sunrise: new Date(base + (noonUTC - H) * 3600e3),
      sunset: new Date(base + (noonUTC + H) * 3600e3)
    };
  }

  function moonTimesFor(parts, c) {
    const start = localDateToUTC(parts.y, parts.m, parts.d, 0, 0, c.tz);
    const next = addDaysParts(parts, 1);
    const end = localDateToUTC(next.y, next.m, next.d, 0, 0, c.tz);
    const H0 = 0.125;
    const step = 10 * 60e3;
    const rise = [];
    const set = [];
    let prev = start;
    let prevAlt = moonAltitude(prev, c.lat, c.lon);
    for (let t = start.getTime() + step; t <= end.getTime() + 1; t += step) {
      const cur = new Date(t);
      const alt = moonAltitude(cur, c.lat, c.lon);
      let lo = prev;
      let hi = cur;
      if (prevAlt < H0 && alt >= H0) {
        for (let k = 0; k < 24; k++) {
          const mid = new Date((lo.getTime() + hi.getTime()) / 2);
          if (moonAltitude(mid, c.lat, c.lon) < H0) lo = mid; else hi = mid;
        }
        rise.push(new Date((lo.getTime() + hi.getTime()) / 2));
      } else if (prevAlt >= H0 && alt < H0) {
        for (let k = 0; k < 24; k++) {
          const mid = new Date((lo.getTime() + hi.getTime()) / 2);
          if (moonAltitude(mid, c.lat, c.lon) >= H0) lo = mid; else hi = mid;
        }
        set.push(new Date((lo.getTime() + hi.getTime()) / 2));
      }
      prev = cur;
      prevAlt = alt;
    }
    return { rise: rise, set: set };
  }

  // Bikram Sambat calendar data (BS 2070-2090), epoch: BS 2070/01/01 = AD 2013-04-14
  const BS_DATA = {
    2070: [31, 31, 31, 32, 31, 31, 29, 30, 30, 29, 30, 30],
    2071: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2072: [31, 32, 31, 32, 31, 30, 30, 29, 30, 29, 30, 30],
    2073: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2074: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
    2075: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2076: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
    2077: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
    2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
    2081: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2082: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2084: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
    2085: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 29, 31],
    2086: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
    2087: [31, 31, 32, 31, 31, 31, 30, 30, 29, 30, 30, 30],
    2088: [30, 31, 32, 32, 30, 31, 30, 30, 29, 30, 30, 30],
    2089: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
    2090: [30, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30]
  };
  const BS_BASE_YEAR = 2070;
  const BS_BASE_AD = Date.UTC(2013, 3, 14);

  function adToBs(y, m, d) {
    let days = Math.round((Date.UTC(y, m, d) - BS_BASE_AD) / 86400000);
    let year = BS_BASE_YEAR;
    while (BS_DATA[year]) {
      let total = 0;
      for (let i = 0; i < 12; i++) total += BS_DATA[year][i];
      if (days < total) break;
      days -= total;
      year++;
    }
    if (!BS_DATA[year] || days < 0) return null;
    let month = 0;
    while (days >= BS_DATA[year][month]) {
      days -= BS_DATA[year][month];
      month++;
    }
    return { year, month, day: days + 1 };
  }

  const api = {
    sunLongitude, moonLongitude, moonSidereal, sunSidereal, panchangAt, tithiEnd, sunTimes, ayanamsa, adToBs,
    karanaNumber, sunTimesFor, moonTimesFor, localDateToUTC, tzOffsetMs
  };
  if (typeof window !== 'undefined') window.ShubhPanchang = api;
  if (typeof globalThis !== 'undefined' && typeof document === 'undefined') globalThis.__PC = api;
  if (typeof document === 'undefined') return;

  const NAMES = {
    tithi: {
      en: ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima', 'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Amavasya'],
      hi: ['प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा', 'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'अमावस्या'],
      ne: ['प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पञ्चमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा', 'प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पञ्चमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'औंसी']
    },
    nakshatra: {
      en: ['Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra', 'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni', 'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha', 'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishtha', 'Shatabhisha', 'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati'],
      hi: ['अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा', 'पूर्वा फाल्गुनी', 'उत्तरा फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढ़ा', 'उत्तराषाढ़ा', 'श्रवण', 'धनिष्ठा', 'शतभिषा', 'पूर्वा भाद्रपद', 'उत्तरा भाद्रपद', 'रेवती'],
      ne: ['अश्विनी', 'भरणी', 'कृत्तिका', 'रोहिणी', 'मृगशिरा', 'आर्द्रा', 'पुनर्वसु', 'पुष्य', 'आश्लेषा', 'मघा', 'पूर्वा फाल्गुनी', 'उत्तरा फाल्गुनी', 'हस्त', 'चित्रा', 'स्वाति', 'विशाखा', 'अनुराधा', 'ज्येष्ठा', 'मूल', 'पूर्वाषाढा', 'उत्तराषाढा', 'श्रवण', 'धनिष्ठा', 'शतभिषा', 'पूर्वा भाद्रपद', 'उत्तरा भाद्रपद', 'रेवती']
    },
    yoga: {
      en: ['Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma', 'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra', 'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha', 'Shukla', 'Brahma', 'Indra', 'Vaidhriti'],
      hi: ['विष्कंभ', 'प्रीति', 'आयुष्मान', 'सौभाग्य', 'शोभन', 'अतिगंड', 'सुकर्मा', 'धृति', 'शूल', 'गंड', 'वृद्धि', 'ध्रुव', 'व्याघात', 'हर्षण', 'वज्र', 'सिद्धि', 'व्यतीपात', 'वरीयान', 'परिघ', 'शिव', 'सिद्ध', 'साध्य', 'शुभ', 'शुक्ल', 'ब्रह्म', 'इंद्र', 'वैधृति'],
      ne: ['विष्कम्भ', 'प्रीति', 'आयुष्मान्', 'सौभाग्य', 'शोभन', 'अतिगण्ड', 'सुकर्मा', 'धृति', 'शूल', 'गण्ड', 'वृद्धि', 'ध्रुव', 'व्याघात', 'हर्षण', 'वज्र', 'सिद्धि', 'व्यतिपात', 'वरीयान्', 'परिघ', 'शिव', 'सिद्ध', 'साध्य', 'शुभ', 'शुक्ल', 'ब्रह्म', 'इन्द्र', 'वैधृति']
    },
    karana: {
      en: ['Kimstughna', 'Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti', 'Shakuni', 'Chatushpada', 'Naga'],
      hi: ['किंस्तुघ्न', 'बव', 'बालव', 'कौलव', 'तैतिल', 'गर', 'वणिज', 'विष्टि', 'शकुनि', 'चतुष्पद', 'नाग'],
      ne: ['किंस्तुघ्न', 'बव', 'बालव', 'कौलव', 'तैतिल', 'गर', 'वणिज', 'विष्टि', 'शकुनि', 'चतुष्पद', 'नाग']
    },
    rashi: {
      en: ['Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya', 'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena'],
      hi: ['मेष', 'वृषभ', 'मिथुन', 'कर्क', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुंभ', 'मीन'],
      ne: ['मेष', 'वृष', 'मिथुन', 'कर्कट', 'सिंह', 'कन्या', 'तुला', 'वृश्चिक', 'धनु', 'मकर', 'कुम्भ', 'मीन']
    }
  };

  const CITIES = [
    { id: 'delhi', lat: 28.6139, lon: 77.2090, tz: 'Asia/Kolkata', name: { en: 'New Delhi', hi: 'नई दिल्ली', ne: 'नयाँ दिल्ली' } },
    { id: 'mumbai', lat: 19.0760, lon: 72.8777, tz: 'Asia/Kolkata', name: { en: 'Mumbai', hi: 'मुंबई', ne: 'मुम्बई' } },
    { id: 'kathmandu', np: true, lat: 27.7172, lon: 85.3240, tz: 'Asia/Kathmandu', name: { en: 'Kathmandu', hi: 'काठमांडू', ne: 'काठमाडौं' } },
    { id: 'dubai', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai', name: { en: 'Dubai', hi: 'दुबई', ne: 'दुबई' } },
    { id: 'london', lat: 51.5074, lon: -0.1278, tz: 'Europe/London', name: { en: 'London', hi: 'लंदन', ne: 'लण्डन' } },
    { id: 'newyork', lat: 40.7128, lon: -74.0060, tz: 'America/New_York', name: { en: 'New York', hi: 'न्यूयॉर्क', ne: 'न्युयोर्क' } },
    { id: 'toronto', lat: 43.6532, lon: -79.3832, tz: 'America/Toronto', name: { en: 'Toronto', hi: 'टोरंटो', ne: 'टोरोन्टो' } },
    { id: 'sydney', lat: -33.8688, lon: 151.2093, tz: 'Australia/Sydney', name: { en: 'Sydney', hi: 'सिडनी', ne: 'सिड्नी' } },
    { id: 'ahmedabad', lat: 23.0225, lon: 72.5714, tz: 'Asia/Kolkata', name: { en: 'Ahmedabad', hi: 'अहमदाबाद', ne: 'अहमदाबाद' } },
    { id: 'bengaluru', lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata', name: { en: 'Bengaluru', hi: 'बेंगलुरु', ne: 'बेंगलुरु' } },
    { id: 'chennai', lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata', name: { en: 'Chennai', hi: 'चेन्नई', ne: 'चेन्नई' } },
    { id: 'hyderabad', lat: 17.3850, lon: 78.4867, tz: 'Asia/Kolkata', name: { en: 'Hyderabad', hi: 'हैदराबाद', ne: 'हैदराबाद' } },
    { id: 'kolkata', lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata', name: { en: 'Kolkata', hi: 'कोलकाता', ne: 'कोलकाता' } },
    { id: 'pune', lat: 18.5204, lon: 73.8567, tz: 'Asia/Kolkata', name: { en: 'Pune', hi: 'पुणे', ne: 'पुणे' } },
    { id: 'jaipur', lat: 26.9124, lon: 75.7873, tz: 'Asia/Kolkata', name: { en: 'Jaipur', hi: 'जयपुर', ne: 'जयपुर' } },
    { id: 'lucknow', lat: 26.8467, lon: 80.9462, tz: 'Asia/Kolkata', name: { en: 'Lucknow', hi: 'लखनऊ', ne: 'लखनऊ' } },
    { id: 'varanasi', lat: 25.3176, lon: 82.9739, tz: 'Asia/Kolkata', name: { en: 'Varanasi', hi: 'वाराणसी', ne: 'वाराणसी' } },
    { id: 'pokhara', np: true, lat: 28.2096, lon: 83.9856, tz: 'Asia/Kathmandu', name: { en: 'Pokhara', hi: 'पोखरा', ne: 'पोकरा' } },
    { id: 'biratnagar', np: true, lat: 26.4525, lon: 87.2718, tz: 'Asia/Kathmandu', name: { en: 'Biratnagar', hi: 'बीराटनगर', ne: 'विराटनगर' } }
  ];

  const CITY_META = {
    delhi: ['India', 'Delhi', 'in-dl'],
    mumbai: ['India', 'Maharashtra', 'in-mh'],
    kathmandu: ['Nepal', 'Bagmati', 'np-ba'],
    dubai: ['United Arab Emirates', 'Dubai', ''],
    london: ['United Kingdom', 'England', ''],
    newyork: ['United States', 'New York', ''],
    toronto: ['Canada', 'Ontario', ''],
    sydney: ['Australia', 'New South Wales', ''],
    ahmedabad: ['India', 'Gujarat', 'in-gj'],
    bengaluru: ['India', 'Karnataka', 'in-ka'],
    chennai: ['India', 'Tamil Nadu', 'in-tn'],
    hyderabad: ['India', 'Telangana', 'in-tg'],
    kolkata: ['India', 'West Bengal', 'in-wb'],
    pune: ['India', 'Maharashtra', 'in-mh'],
    jaipur: ['India', 'Rajasthan', 'in-rj'],
    lucknow: ['India', 'Uttar Pradesh', 'in-up'],
    varanasi: ['India', 'Uttar Pradesh', 'in-up'],
    pokhara: ['Nepal', 'Gandaki', 'np-ga'],
    biratnagar: ['Nepal', 'Koshi', 'np-ko']
  };
  CITIES.forEach(function (c) {
    const meta = CITY_META[c.id];
    if (meta) { c.country = meta[0]; c.admin1 = meta[1]; c.regionId = meta[2]; }
    else if (c.np) c.country = 'Nepal';
  });

  // Every Indian state/UT and every Nepali province, with its capital as the
  // calculation city. These power the place-of-birth region selects and the
  // calendar city list; they are not a replacement for a precise birth town.
  const REGIONS = [
    { id: 'in-ap', country: 'India', kind: 'state', name: { en: 'Andhra Pradesh', hi: 'आंध्र प्रदेश', ne: 'आन्ध्र प्रदेश' }, capital: { en: 'Amaravati', hi: 'अमरावती', ne: 'अमरावती' }, lat: 16.5131, lon: 80.5165, tz: 'Asia/Kolkata' },
    { id: 'in-ar', country: 'India', kind: 'state', name: { en: 'Arunachal Pradesh', hi: 'अरुणाचल प्रदेश', ne: 'अरुणाचल प्रदेश' }, capital: { en: 'Itanagar', hi: 'ईटानगर', ne: 'इटानगर' }, lat: 27.0844, lon: 93.6053, tz: 'Asia/Kolkata' },
    { id: 'in-as', country: 'India', kind: 'state', name: { en: 'Assam', hi: 'असम', ne: 'असम' }, capital: { en: 'Dispur', hi: 'दिसपुर', ne: 'दिसपुर' }, lat: 26.1433, lon: 91.7898, tz: 'Asia/Kolkata' },
    { id: 'in-br', country: 'India', kind: 'state', name: { en: 'Bihar', hi: 'बिहार', ne: 'बिहार' }, capital: { en: 'Patna', hi: 'पटना', ne: 'पटना' }, lat: 25.5941, lon: 85.1376, tz: 'Asia/Kolkata' },
    { id: 'in-cg', country: 'India', kind: 'state', name: { en: 'Chhattisgarh', hi: 'छत्तीसगढ़', ne: 'छत्तीसगढ' }, capital: { en: 'Raipur', hi: 'रायपुर', ne: 'रायपुर' }, lat: 21.2514, lon: 81.6296, tz: 'Asia/Kolkata' },
    { id: 'in-ga', country: 'India', kind: 'state', name: { en: 'Goa', hi: 'गोवा', ne: 'गोवा' }, capital: { en: 'Panaji', hi: 'पणजी', ne: 'पन्जी' }, lat: 15.4909, lon: 73.8278, tz: 'Asia/Kolkata' },
    { id: 'in-gj', country: 'India', kind: 'state', name: { en: 'Gujarat', hi: 'गुजरात', ne: 'गुजरात' }, capital: { en: 'Gandhinagar', hi: 'गांधीनगर', ne: 'गान्धीनगर' }, lat: 23.2156, lon: 72.6369, tz: 'Asia/Kolkata' },
    { id: 'in-hr', country: 'India', kind: 'state', name: { en: 'Haryana', hi: 'हरियाणा', ne: 'हरियाणा' }, capital: { en: 'Chandigarh', hi: 'चंडीगढ़', ne: 'चण्डीगढ' }, lat: 30.7333, lon: 76.7794, tz: 'Asia/Kolkata' },
    { id: 'in-hp', country: 'India', kind: 'state', name: { en: 'Himachal Pradesh', hi: 'हिमाचल प्रदेश', ne: 'हिमाचल प्रदेश' }, capital: { en: 'Shimla', hi: 'शिमला', ne: 'सिम्ला' }, lat: 31.1048, lon: 77.1734, tz: 'Asia/Kolkata' },
    { id: 'in-jh', country: 'India', kind: 'state', name: { en: 'Jharkhand', hi: 'झारखंड', ne: 'झारखण्ड' }, capital: { en: 'Ranchi', hi: 'रांची', ne: 'राँची' }, lat: 23.3441, lon: 85.3096, tz: 'Asia/Kolkata' },
    { id: 'in-ka', country: 'India', kind: 'state', name: { en: 'Karnataka', hi: 'कर्नाटक', ne: 'कर्नाटक' }, capital: { en: 'Bengaluru', hi: 'बेंगलुरु', ne: 'बेङ्गलुरु' }, lat: 12.9716, lon: 77.5946, tz: 'Asia/Kolkata' },
    { id: 'in-kl', country: 'India', kind: 'state', name: { en: 'Kerala', hi: 'केरल', ne: 'केरल' }, capital: { en: 'Thiruvananthapuram', hi: 'तिरुवनंतपुरम', ne: 'तिरुवनन्तपुरम' }, lat: 8.5241, lon: 76.9366, tz: 'Asia/Kolkata' },
    { id: 'in-mp', country: 'India', kind: 'state', name: { en: 'Madhya Pradesh', hi: 'मध्य प्रदेश', ne: 'मध्य प्रदेश' }, capital: { en: 'Bhopal', hi: 'भोपाल', ne: 'भोपाल' }, lat: 23.2599, lon: 77.4126, tz: 'Asia/Kolkata' },
    { id: 'in-mh', country: 'India', kind: 'state', name: { en: 'Maharashtra', hi: 'महाराष्ट्र', ne: 'महाराष्ट्र' }, capital: { en: 'Mumbai', hi: 'मुंबई', ne: 'मुम्बई' }, lat: 19.0760, lon: 72.8777, tz: 'Asia/Kolkata' },
    { id: 'in-mn', country: 'India', kind: 'state', name: { en: 'Manipur', hi: 'मणिपुर', ne: 'मणिपुर' }, capital: { en: 'Imphal', hi: 'इंफाल', ne: 'इम्फाल' }, lat: 24.8170, lon: 93.9368, tz: 'Asia/Kolkata' },
    { id: 'in-ml', country: 'India', kind: 'state', name: { en: 'Meghalaya', hi: 'मेघालय', ne: 'मेघालय' }, capital: { en: 'Shillong', hi: 'शिलांग', ne: 'सिलोङ' }, lat: 25.5788, lon: 91.8933, tz: 'Asia/Kolkata' },
    { id: 'in-mz', country: 'India', kind: 'state', name: { en: 'Mizoram', hi: 'मिज़ोरम', ne: 'मिजोरम' }, capital: { en: 'Aizawl', hi: 'आइजोल', ne: 'आइजोल' }, lat: 23.7271, lon: 92.7176, tz: 'Asia/Kolkata' },
    { id: 'in-nl', country: 'India', kind: 'state', name: { en: 'Nagaland', hi: 'नागालैंड', ne: 'नागाल्यान्ड' }, capital: { en: 'Kohima', hi: 'कोहिमा', ne: 'कोहिमा' }, lat: 25.6751, lon: 94.1086, tz: 'Asia/Kolkata' },
    { id: 'in-od', country: 'India', kind: 'state', name: { en: 'Odisha', hi: 'ओडिशा', ne: 'ओडिशा' }, capital: { en: 'Bhubaneswar', hi: 'भुवनेश्वर', ne: 'भुवनेश्वर' }, lat: 20.2961, lon: 85.8245, tz: 'Asia/Kolkata' },
    { id: 'in-pb', country: 'India', kind: 'state', name: { en: 'Punjab', hi: 'पंजाब', ne: 'पञ्जाब' }, capital: { en: 'Chandigarh', hi: 'चंडीगढ़', ne: 'चण्डीगढ' }, lat: 30.7333, lon: 76.7794, tz: 'Asia/Kolkata' },
    { id: 'in-rj', country: 'India', kind: 'state', name: { en: 'Rajasthan', hi: 'राजस्थान', ne: 'राजस्थान' }, capital: { en: 'Jaipur', hi: 'जयपुर', ne: 'जयपुर' }, lat: 26.9124, lon: 75.7873, tz: 'Asia/Kolkata' },
    { id: 'in-sk', country: 'India', kind: 'state', name: { en: 'Sikkim', hi: 'सिक्किम', ne: 'सिक्किम' }, capital: { en: 'Gangtok', hi: 'गंगटोक', ne: 'गान्तोक' }, lat: 27.3389, lon: 88.6065, tz: 'Asia/Kolkata' },
    { id: 'in-tn', country: 'India', kind: 'state', name: { en: 'Tamil Nadu', hi: 'तमिलनाडु', ne: 'तामिलनाडु' }, capital: { en: 'Chennai', hi: 'चेन्नई', ne: 'चेन्नई' }, lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata' },
    { id: 'in-tg', country: 'India', kind: 'state', name: { en: 'Telangana', hi: 'तेलंगाना', ne: 'तेलङ्गाना' }, capital: { en: 'Hyderabad', hi: 'हैदराबाद', ne: 'हैदराबाद' }, lat: 17.3850, lon: 78.4867, tz: 'Asia/Kolkata' },
    { id: 'in-tr', country: 'India', kind: 'state', name: { en: 'Tripura', hi: 'त्रिपुरा', ne: 'त्रिपुरा' }, capital: { en: 'Agartala', hi: 'अगरतला', ne: 'अगरतला' }, lat: 23.8315, lon: 91.2868, tz: 'Asia/Kolkata' },
    { id: 'in-up', country: 'India', kind: 'state', name: { en: 'Uttar Pradesh', hi: 'उत्तर प्रदेश', ne: 'उत्तर प्रदेश' }, capital: { en: 'Lucknow', hi: 'लखनऊ', ne: 'लखनउ' }, lat: 26.8467, lon: 80.9462, tz: 'Asia/Kolkata' },
    { id: 'in-ut', country: 'India', kind: 'state', name: { en: 'Uttarakhand', hi: 'उत्तराखंड', ne: 'उत्तराखण्ड' }, capital: { en: 'Dehradun', hi: 'देहरादून', ne: 'देहरादुन' }, lat: 30.3165, lon: 78.0322, tz: 'Asia/Kolkata' },
    { id: 'in-wb', country: 'India', kind: 'state', name: { en: 'West Bengal', hi: 'पश्चिम बंगाल', ne: 'पश्चिम बङ्गाल' }, capital: { en: 'Kolkata', hi: 'कोलकाता', ne: 'कोलकाता' }, lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata' },
    { id: 'in-an', country: 'India', kind: 'ut', name: { en: 'Andaman and Nicobar Islands', hi: 'अंडमान और निकोबार द्वीपसमूह', ne: 'अन्डमान र निकोबार द्वीपसमूह' }, capital: { en: 'Port Blair', hi: 'पोर्ट ब्लेयर', ne: 'पोर्ट ब्लेयर' }, lat: 11.6234, lon: 92.7265, tz: 'Asia/Kolkata' },
    { id: 'in-ch', country: 'India', kind: 'ut', name: { en: 'Chandigarh', hi: 'चंडीगढ़', ne: 'चण्डीगढ' }, capital: { en: 'Chandigarh', hi: 'चंडीगढ़', ne: 'चण्डीगढ' }, lat: 30.7333, lon: 76.7794, tz: 'Asia/Kolkata' },
    { id: 'in-dh', country: 'India', kind: 'ut', name: { en: 'Dadra and Nagar Haveli and Daman and Diu', hi: 'दादरा और नगर हवेली और दमन और दीव', ne: 'दादरा र नगर हवेली र दमन र दीव' }, capital: { en: 'Daman', hi: 'दमन', ne: 'दमन' }, lat: 20.3974, lon: 72.8328, tz: 'Asia/Kolkata' },
    { id: 'in-dl', country: 'India', kind: 'ut', name: { en: 'Delhi', hi: 'दिल्ली', ne: 'दिल्ली' }, capital: { en: 'New Delhi', hi: 'नई दिल्ली', ne: 'नयाँ दिल्ली' }, lat: 28.6139, lon: 77.2090, tz: 'Asia/Kolkata' },
    { id: 'in-jk', country: 'India', kind: 'ut', name: { en: 'Jammu and Kashmir', hi: 'जम्मू और कश्मीर', ne: 'जम्मु र कश्मीर' }, capital: { en: 'Srinagar', hi: 'श्रीनगर', ne: 'श्रीनगर' }, lat: 34.0837, lon: 74.7973, tz: 'Asia/Kolkata' },
    { id: 'in-la', country: 'India', kind: 'ut', name: { en: 'Ladakh', hi: 'लद्दाख', ne: 'लद्दाख' }, capital: { en: 'Leh', hi: 'लेह', ne: 'लेह' }, lat: 34.1526, lon: 77.5771, tz: 'Asia/Kolkata' },
    { id: 'in-ld', country: 'India', kind: 'ut', name: { en: 'Lakshadweep', hi: 'लक्षद्वीप', ne: 'लक्षद्वीप' }, capital: { en: 'Kavaratti', hi: 'कवरत्ती', ne: 'कवरत्ती' }, lat: 10.5669, lon: 72.6420, tz: 'Asia/Kolkata' },
    { id: 'in-py', country: 'India', kind: 'ut', name: { en: 'Puducherry', hi: 'पुदुचेरी', ne: 'पुदुच्चेरी' }, capital: { en: 'Puducherry', hi: 'पुदुचेरी', ne: 'पुदुच्चेरी' }, lat: 11.9416, lon: 79.8083, tz: 'Asia/Kolkata' },
    { id: 'np-ko', country: 'Nepal', kind: 'province', name: { en: 'Koshi', hi: 'कोशी', ne: 'कोशी' }, capital: { en: 'Biratnagar', hi: 'बीराटनगर', ne: 'विराटनगर' }, lat: 26.4525, lon: 87.2718, tz: 'Asia/Kathmandu' },
    { id: 'np-md', country: 'Nepal', kind: 'province', name: { en: 'Madhesh', hi: 'मधेश', ne: 'मधेश' }, capital: { en: 'Janakpur', hi: 'जनकपुर', ne: 'जनकपुर' }, lat: 26.7288, lon: 85.9250, tz: 'Asia/Kathmandu' },
    { id: 'np-ba', country: 'Nepal', kind: 'province', name: { en: 'Bagmati', hi: 'बागमती', ne: 'बागमती' }, capital: { en: 'Kathmandu', hi: 'काठमांडू', ne: 'काठमाडौं' }, lat: 27.7172, lon: 85.3240, tz: 'Asia/Kathmandu' },
    { id: 'np-ga', country: 'Nepal', kind: 'province', name: { en: 'Gandaki', hi: 'गंडकी', ne: 'गण्डकी' }, capital: { en: 'Pokhara', hi: 'पोखरा', ne: 'पोकरा' }, lat: 28.2096, lon: 83.9856, tz: 'Asia/Kathmandu' },
    { id: 'np-lu', country: 'Nepal', kind: 'province', name: { en: 'Lumbini', hi: 'लुंबिनी', ne: 'लुम्बिनी' }, capital: { en: 'Deukhuri', hi: 'देउखुरी', ne: 'देउखुरी' }, lat: 27.8500, lon: 82.5300, tz: 'Asia/Kathmandu' },
    { id: 'np-kr', country: 'Nepal', kind: 'province', name: { en: 'Karnali', hi: 'कर्णाली', ne: 'कर्णाली' }, capital: { en: 'Birendranagar', hi: 'बिरेंद्रनगर', ne: 'वीरेन्द्रनगर' }, lat: 28.6006, lon: 81.6339, tz: 'Asia/Kathmandu' },
    { id: 'np-su', country: 'Nepal', kind: 'province', name: { en: 'Sudurpashchim', hi: 'सुदूरपश्चिम', ne: 'सुदूरपश्चिम' }, capital: { en: 'Godawari', hi: 'गोदावरी', ne: 'गोदावरी' }, lat: 28.8760, lon: 80.5770, tz: 'Asia/Kathmandu' }
  ];

  const REGION_CITIES = REGIONS.map(function (r) {
    return {
      id: 'region-' + r.id,
      lat: r.lat,
      lon: r.lon,
      tz: r.tz,
      country: r.country,
      admin1: r.name.en,
      regionId: r.id,
      kind: 'city',
      name: { en: r.capital.en, hi: r.capital.hi, ne: r.capital.ne }
    };
  });

  const LOCALES = { en: 'en-IN', hi: 'hi-IN', ne: 'ne-NP' };
  const UNITS = { en: { h: 'h', m: 'm' }, hi: { h: 'घं', m: 'मि' }, ne: { h: 'घण्टा', m: 'मिनट' } };
  const BS_MONTHS = ['बैशाख', 'जेठ', 'असार', 'साउन', 'भदौ', 'असोज', 'कात्तिक', 'मंसिर', 'पुष', 'माघ', 'फाल्गुन', 'चैत'];
  const NP_WEEKDAYS = ['आइतबार', 'सोमबार', 'मंगलबार', 'बुधबार', 'बिहिबार', 'शुक्रबार', 'शनिबार'];
  const DEV_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];
  const devNum = n => String(n).split('').map(c => DEV_DIGITS[+c]).join('');

  const PLANET_NAMES = {
    en: { Sun: 'Sun', Moon: 'Moon', Mars: 'Mars', Mercury: 'Mercury', Jupiter: 'Jupiter', Venus: 'Venus', Saturn: 'Saturn', Rahu: 'Rahu', Ketu: 'Ketu' },
    hi: { Sun: 'सूर्य', Moon: 'चंद्र', Mars: 'मंगल', Mercury: 'बुध', Jupiter: 'गुरु', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु' },
    ne: { Sun: 'सूर्य', Moon: 'चन्द्रमा', Mars: 'मङ्गल', Mercury: 'बुध', Jupiter: 'बृहस्पति', Venus: 'शुक्र', Saturn: 'शनि', Rahu: 'राहु', Ketu: 'केतु' }
  };
  const WEEKDAY_LORDS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];
  const RASHI_LORDS = ['Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter'];
  const NAK_LORDS = [
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury',
    'Ketu', 'Venus', 'Sun', 'Moon', 'Mars', 'Rahu', 'Jupiter', 'Saturn', 'Mercury'
  ];
  const TITHI_LORDS = {
    en: ['Agni', 'Brahma', 'Gauri', 'Ganesha', 'Nagas', 'Kartikeya', 'Surya', 'Shiva', 'Durga', 'Yama', 'Vishvedeva', 'Vishnu', 'Kamadeva', 'Shiva', 'Chandra', 'Pitris'],
    hi: ['अग्नि', 'ब्रह्मा', 'गौरी', 'गणेश', 'नाग', 'कार्तिकेय', 'सूर्य', 'शिव', 'दुर्गा', 'यम', 'विश्वेदेवा', 'विष्णु', 'कामदेव', 'शिव', 'चंद्र', 'पितृ'],
    ne: ['अग्नि', 'ब्रह्मा', 'गौरी', 'गणेश', 'नाग', 'कार्तिकेय', 'सूर्य', 'शिव', 'दुर्गा', 'यम', 'विश्वदेव', 'विष्णु', 'कामदेव', 'शिव', 'चन्द्रमा', 'पितृ']
  };
  const NAK_DEITIES = {
    en: ['Ashwini Kumaras', 'Yama', 'Agni', 'Brahma', 'Soma', 'Rudra', 'Aditi', 'Brihaspati', 'Nagas', 'Pitris', 'Bhaga', 'Aryaman', 'Savitar', 'Tvashtar', 'Vayu', 'Indra-Agni', 'Mitra', 'Indra', 'Nirriti', 'Apas', 'Vishvedevas', 'Vishnu', 'Vasus', 'Varuna', 'Aja Ekapada', 'Ahir Budhnya', 'Pushan'],
    hi: ['अश्विनी कुमार', 'यम', 'अग्नि', 'ब्रह्मा', 'सोम', 'रुद्र', 'अदिति', 'बृहस्पति', 'नाग', 'पितृ', 'भग', 'अर्यमा', 'सविता', 'त्वष्टा', 'वायु', 'इंद्र-अग्नि', 'मित्र', 'इंद्र', 'निर्ऋति', 'आप', 'विश्वेदेवा', 'विष्णु', 'वसु', 'वरुण', 'अज एकपाद', 'अहिर्बुध्न्य', 'पूषन'],
    ne: ['अश्विनी कुमार', 'यम', 'अग्नि', 'ब्रह्मा', 'सोम', 'रुद्र', 'अदिति', 'बृहस्पति', 'नाग', 'पितृ', 'भग', 'अर्यमा', 'सविता', 'त्वष्टा', 'वायु', 'इन्द्र-अग्नि', 'मित्र', 'इन्द्र', 'निर्ऋति', 'आप', 'विश्वदेव', 'विष्णु', 'वसु', 'वरुण', 'अज एकपाद', 'अहिर्बुध्न्य', 'पूषन']
  };
  const CHOG_NAMES = {
    en: { Udveg: 'Udveg', Char: 'Char', Labh: 'Labh', Amrit: 'Amrit', Kaal: 'Kaal', Shubh: 'Shubh', Rog: 'Rog' },
    hi: { Udveg: 'उद्वेग', Char: 'चर', Labh: 'लाभ', Amrit: 'अमृत', Kaal: 'काल', Shubh: 'शुभ', Rog: 'रोग' },
    ne: { Udveg: 'उद्वेग', Char: 'चर', Labh: 'लाभ', Amrit: 'अमृत', Kaal: 'काल', Shubh: 'शुभ', Rog: 'रोग' }
  };
  const CHOG_GOOD = new Set(['Amrit', 'Shubh', 'Labh', 'Char']);
  const CHOG_DAY = [
    ['Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg'],
    ['Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg', 'Char', 'Labh', 'Amrit'],
    ['Rog', 'Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog'],
    ['Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg', 'Char', 'Labh'],
    ['Shubh', 'Rog', 'Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh'],
    ['Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg', 'Char'],
    ['Kaal', 'Shubh', 'Rog', 'Udveg', 'Char', 'Labh', 'Amrit', 'Kaal']
  ];
  const CHOG_NIGHT = ['Shubh', 'Amrit', 'Char', 'Rog', 'Kaal', 'Labh', 'Udveg'];
  const CHOG_NIGHT_START = [0, 2, 4, 6, 1, 3, 5];
  const HORA_CYCLE = ['Sun', 'Venus', 'Mercury', 'Moon', 'Saturn', 'Jupiter', 'Mars'];
  const HORA_START = [0, 3, 6, 2, 5, 1, 4];
  const RAHU_PART = [7, 1, 6, 4, 5, 3, 2];
  const YAMA_PART = [4, 3, 2, 1, 0, 6, 5];
  const GULIKA_PART = [6, 5, 4, 3, 2, 1, 0];
  const YOGA_BAD = new Set([0, 5, 8, 9, 12, 14, 16, 18, 26]);
  const SAURA_MONTHS = {
    en: ['Vaishakha', 'Jyeshtha', 'Ashadha', 'Shravana', 'Bhadrapada', 'Ashwina', 'Kartika', 'Margashirsha', 'Pausha', 'Magha', 'Phalguna', 'Chaitra'],
    hi: ['वैशाख', 'ज्येष्ठ', 'आषाढ़', 'श्रावण', 'भाद्रपद', 'आश्विन', 'कार्तिक', 'मार्गशीर्ष', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र'],
    ne: BS_MONTHS
  };

  const el = id => document.getElementById(id);
  const LOCAL_CITY_KEY = 'shubhveda_panchang_local';
  let timer = null;
  let cityId = 'delhi';
  let selectedDate = null;
  let boundaryCache = { key: '', vals: {} };
  let detailsKey = '';
  let locateBusy = false;
  const dailyCache = new Map();
  const sunCache = new Map();

  function lg() {
    let l = 'en';
    try {
      if (window.ShubhVedaI18n && window.ShubhVedaI18n.getCurrentLang) {
        l = String(window.ShubhVedaI18n.getCurrentLang() || 'en').slice(0, 2);
      } else if (document.documentElement.lang) {
        l = String(document.documentElement.lang).slice(0, 2);
      }
    } catch (e) {}
    return ['en', 'hi', 'ne'].includes(l) ? l : 'en';
  }

  function T(key, fallback) {
    try {
      const dict = TRANSLATIONS[lg()];
      if (dict && dict[key]) return dict[key];
    } catch (e) {}
    return fallback || key;
  }

  function city() {
    return CITIES.find(c => c.id === cityId) || CITIES[0];
  }

  const fmtCache = {};
  function dtf(locale, opts, tz) {
    const key = locale + '|' + JSON.stringify(opts) + '|' + (tz || '');
    if (!fmtCache[key]) {
      const o = tz ? Object.assign({}, opts, { timeZone: tz }) : opts;
      fmtCache[key] = new Intl.DateTimeFormat(locale, o);
    }
    return fmtCache[key];
  }

  function fmtGregorian(tz) {
    return dtf(LOCALES[lg()] || 'en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, tz).format(new Date());
  }

  function fmtTime(date, tz) {
    return dtf(LOCALES[lg()] || 'en-IN', { hour: 'numeric', minute: '2-digit' }, tz).format(date);
  }

  function localPartsOf(date, tz) {
    const s = dtf('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }, tz).format(date);
    const p = s.split('-').map(Number);
    return { y: p[0], m: p[1] - 1, d: p[2] };
  }

  function fmtWhen(date, tz) {
    const p = localPartsOf(date, tz);
    const today = localParts(tz);
    const time = fmtTime(date, tz);
    if (p.y === today.y && p.m === today.m && p.d === today.d) return time;
    return time + ', ' + dtf(LOCALES[lg()] || 'en-IN', { day: 'numeric', month: 'short' }, tz).format(date);
  }

  function fmtClock(tz) {
    return dtf('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }, tz).format(new Date()).toLowerCase();
  }

  function localParts(tz) {
    const p = localPartsOf(new Date(), tz);
    return p;
  }

  function weekdayIndex(tz) {
    const short = dtf('en-US', { weekday: 'short' }, tz).format(new Date());
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(short);
  }

  const pad2 = n => String(n).padStart(2, '0');

  function dateKeyOf(p) { return p.y + '-' + pad2(p.m + 1) + '-' + pad2(p.d); }
  function sameParts(a, b) { return !!a && !!b && a.y === b.y && a.m === b.m && a.d === b.d; }
  function addDaysParts(p, n) {
    const d = new Date(Date.UTC(p.y, p.m, p.d + n));
    return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate() };
  }
  function weekdayForParts(p) { return new Date(Date.UTC(p.y, p.m, p.d)).getUTCDay(); }

  function fmtParts(parts, opts) {
    const d = new Date(Date.UTC(parts.y, parts.m, parts.d, 12));
    return dtf(LOCALES[lg()] || 'en-IN', opts, 'UTC').format(d);
  }

  function weekdayName(i, style) {
    if (lg() === 'ne' && (!style || style === 'long')) return NP_WEEKDAYS[i] || '';
    const d = new Date(Date.UTC(2024, 0, 7 + i, 12));
    return dtf(LOCALES[lg()] || 'en-IN', { weekday: style || 'long' }, 'UTC').format(d);
  }

  function fmtWhenOn(date, parts, tz) {
    const p = localPartsOf(date, tz);
    if (sameParts(p, parts)) return fmtTime(date, tz);
    return fmtTime(date, tz) + ', ' + fmtParts(p, { day: 'numeric', month: 'short' });
  }

  function timeRange(a, b, tz) {
    return fmtTime(a, tz) + ' \u2013 ' + fmtTime(b, tz);
  }

  function eventRange(a, b, parts, tz) {
    return fmtWhenOn(a, parts, tz) + ' \u2013 ' + fmtWhenOn(b, parts, tz);
  }

  function durationText(ms) {
    const total = Math.max(0, Math.round(ms / 60e3));
    const h = Math.floor(total / 60);
    const m = total % 60;
    const u = UNITS[lg()] || UNITS.en;
    return (h > 0 ? h + ' ' + u.h + ' ' : '') + m + ' ' + u.m;
  }

  function tzOffsetLabel(tz, date) {
    const off = Math.round(tzOffsetMs(tz, date) / 60e3);
    const sign = off >= 0 ? '+' : '-';
    const abs = Math.abs(off);
    return 'UTC' + sign + pad2(Math.floor(abs / 60)) + ':' + pad2(abs % 60);
  }

  function coordsLabel(c) {
    return Math.abs(c.lat).toFixed(2) + '\u00B0 ' + (c.lat >= 0 ? 'N' : 'S') + ', ' +
      Math.abs(c.lon).toFixed(2) + '\u00B0 ' + (c.lon >= 0 ? 'E' : 'W');
  }

  function localNum(n) {
    return lg() === 'en' ? String(n) : devNum(String(n));
  }

  function moonShadowPx(rel, diameter) {
    const f = (1 - Math.cos(rel * D2R)) / 2;
    const target = 1 - f;
    const ratio = u => (2 / Math.PI) * (Math.acos(u) - u * Math.sqrt(1 - u * u));
    let lo = 0, hi = 1;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (ratio(mid) > target) lo = mid; else hi = mid;
    }
    const u = (lo + hi) / 2;
    return (rel < 180 ? -1 : 1) * u * diameter;
  }

  function countdown(ms) {
    const h = Math.floor(ms / 3600e3);
    const m = Math.floor((ms % 3600e3) / 60e3);
    const u = UNITS[lg()] || UNITS.en;
    return (h > 0 ? h + ' ' + u.h + ' ' : '') + m + ' ' + u.m;
  }

  function boundaryAt(kind, date, dir) {
    const key = date.toISOString().slice(0, 16);
    if (boundaryCache.key !== key) boundaryCache = { key: key, vals: {} };
    const id = kind + '|' + dir;
    if (!boundaryCache.vals[id]) boundaryCache.vals[id] = boundary(kind, date, dir);
    return boundaryCache.vals[id];
  }

  function fillCityOptions() {
    const select = el('panchang-city');
    if (!select) return;
    const names = l => CITIES.map(c => ({ id: c.id, label: c.name[l] || c.name.en }));
    select.replaceChildren();
    names(lg()).forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.id;
      opt.textContent = c.label;
      select.append(opt);
    });
    select.value = cityId;
  }

  function readLocalCity() {
    try {
      const raw = localStorage.getItem(LOCAL_CITY_KEY);
      if (!raw) return null;
      const o = JSON.parse(raw);
      if (!o || !isFinite(o.lat) || !isFinite(o.lon) || typeof o.tz !== 'string' || !o.tz) return null;
      const label = typeof o.name === 'string' && o.name ? o.name : T('panchang_my_location', 'My location');
      return {
        id: 'local',
        lat: Number(o.lat),
        lon: Number(o.lon),
        tz: o.tz,
        name: { en: label, hi: label, ne: label }
      };
    } catch (e) {
      return null;
    }
  }

  function mountLocalCity(c) {
    const i = CITIES.findIndex(x => x.id === 'local');
    if (i >= 0) CITIES[i] = c; else CITIES.push(c);
  }

  function locateStatus(message, kind) {
    const box = el('panchang-geo-status');
    if (!box) return;
    if (!message) {
      box.hidden = true;
      box.textContent = '';
      box.className = 'panchang-geo-status';
      return;
    }
    box.hidden = false;
    box.textContent = message;
    box.className = 'panchang-geo-status' + (kind ? ' is-' + kind : '');
  }

  function setLocateBusy(busy) {
    locateBusy = busy;
    const btn = el('panchang-locate');
    if (!btn) return;
    btn.disabled = busy;
    btn.classList.toggle('is-busy', busy);
    const label = btn.querySelector('[data-i18n="panchang_use_location"]');
    if (label) label.textContent = busy ? T('panchang_locating', 'Locating\u2026') : T('panchang_use_location', 'Use my location');
  }

  async function reverseGeocode(lat, lon) {
    try {
      const ctrl = new AbortController();
      const timeout = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch('https://photon.komoot.io/reverse?lat=' + encodeURIComponent(lat) + '&lon=' + encodeURIComponent(lon) + '&limit=1', { signal: ctrl.signal });
      clearTimeout(timeout);
      if (!res.ok) return '';
      const data = await res.json();
      const props = data && data.features && data.features[0] && data.features[0].properties;
      if (!props) return '';
      const bits = [];
      [props.city, props.name, props.state, props.country].forEach(value => {
        if (typeof value !== 'string' || !value) return;
        if (bits.some(b => b.toLowerCase() === value.toLowerCase())) return;
        bits.push(value);
      });
      const label = bits.slice(0, 2).join(', ');
      return label.length > 46 ? label.slice(0, 45) + '\u2026' : label;
    } catch (e) {
      return '';
    }
  }

  function useMyLocation() {
    if (locateBusy) return;
    if (!navigator.geolocation) {
      locateStatus(T('panchang_geo_unsupported', 'This browser cannot detect your location. Please choose a city.'), 'err');
      return;
    }
    locateStatus('');
    setLocateBusy(true);
    navigator.geolocation.getCurrentPosition(async position => {
      try {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        let tz = '';
        try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
        const label = (await reverseGeocode(lat, lon)) || T('panchang_my_location', 'My location');
        const c = {
          id: 'local',
          lat: lat,
          lon: lon,
          tz: tz || 'Asia/Kolkata',
          name: { en: label, hi: label, ne: label }
        };
        mountLocalCity(c);
        try {
          localStorage.setItem(LOCAL_CITY_KEY, JSON.stringify({ lat: lat, lon: lon, tz: c.tz, name: label }));
        } catch (e) {}
        cityId = 'local';
        try { localStorage.setItem('shubhveda_panchang_city', cityId); } catch (e) {}
        dailyCache.clear();
        sunCache.clear();
        detailsKey = '';
        selectedDate = null;
        fillCityOptions();
        syncDateInput();
        render();
        locateStatus(T('panchang_geo_ok', 'Using your current location') + ': ' + label, 'ok');
        setTimeout(() => { if (!locateBusy) locateStatus(''); }, 7000);
      } finally {
        setLocateBusy(false);
      }
    }, err => {
      setLocateBusy(false);
      const denied = err && err.code === 1;
      locateStatus(denied
        ? T('panchang_geo_denied', 'Location access was blocked. Allow it in your browser, or choose a city from the list.')
        : T('panchang_geo_failed', 'Could not detect your location. Please choose a city from the list.'), 'err');
    }, { enableHighAccuracy: false, timeout: 12000, maximumAge: 600000 });
  }

  function syncDateInput() {
    const input = el('panchang-date-pick');
    if (!input) return;
    input.value = selectedDate ? dateKeyOf(selectedDate) : dateKeyOf(localParts(city().tz));
  }

  function memoize(map, key, build, cap) {
    if (map.has(key)) return map.get(key);
    const value = build();
    map.set(key, value);
    if (map.size > cap) map.delete(map.keys().next().value);
    return value;
  }

  function sunFor(parts) {
    const key = cityId + '|' + dateKeyOf(parts);
    return memoize(sunCache, key, () => sunTimesFor(parts, city()), 180);
  }

  function tithiLord(t) {
    const idx = t < 15 ? t : (t === 29 ? 15 : t - 15);
    return TITHI_LORDS[lg()][idx];
  }

  function yogaNature(y) { return YOGA_BAD.has(y) ? 'bad' : 'good'; }
  function karanaNature(k) { return karanaNumber(k) === 7 ? 'bad' : 'good'; }

  function daySnapshot(parts) {
    const st = sunFor(parts);
    const anchor = st ? st.sunrise : localDateToUTC(parts.y, parts.m, parts.d, 12, 0, city().tz);
    const p = panchangAt(anchor);
    p.sunRashi = Math.floor(sunSidereal(julianDay(anchor)) / 30);
    return { st: st, anchor: anchor, p: p };
  }

  function findUpcoming(parts) {
    const out = {};
    let left = 3;
    for (let i = 0; i < 80 && left > 0; i++) {
      const p = addDaysParts(parts, i);
      const st = sunFor(p);
      if (!st) continue;
      const t = panchangAt(st.sunrise).tithi;
      if (!out.ekadashi && (t === 10 || t === 25)) { out.ekadashi = { parts: p, days: i, tithi: t }; left--; }
      if (!out.purnima && t === 14) { out.purnima = { parts: p, days: i, tithi: t }; left--; }
      if (!out.amavasya && t === 29) { out.amavasya = { parts: p, days: i, tithi: t }; left--; }
    }
    return out;
  }

  function findBhadra(parts) {
    const c = city();
    const st = sunFor(parts);
    const startAt = st ? st.sunrise : localDateToUTC(parts.y, parts.m, parts.d, 6, 0, c.tz);
    for (let i = 0; i <= 6 * 24; i++) {
      const at = new Date(startAt.getTime() + i * 3600e3);
      let p;
      try { p = panchangAt(at); } catch (e) { break; }
      if (karanaNumber(p.karanaIndex) !== 7) continue;
      const start = boundary('karana', at, -1);
      const end = boundary('karana', at, 1);
      if (!start || !end || end <= start) continue;
      const active = start <= startAt && end > startAt;
      return { start: start, end: end, active: active };
    }
    return null;
  }

  function buildDaily(parts) {
    const c = city();
    const snap = daySnapshot(parts);
    const next = addDaysParts(parts, 1);
    const nextSt = sunFor(next);
    const moon = moonTimesFor(parts, c);
    const next7 = [];
    for (let i = 1; i <= 7; i++) {
      const np = addDaysParts(parts, i);
      const ns = sunFor(np);
      const t = ns ? panchangAt(ns.sunrise) : null;
      next7.push({
        parts: np,
        tithi: t ? t.tithi : null,
        nakshatra: t ? t.nakshatra : null,
        sunrise: ns ? ns.sunrise : null,
        sunset: ns ? ns.sunset : null
      });
    }
    return {
      key: dateKeyOf(parts),
      parts: parts,
      sunrise: snap.st ? snap.st.sunrise : null,
      sunset: snap.st ? snap.st.sunset : null,
      nextSunrise: nextSt ? nextSt.sunrise : null,
      sunriseAt: snap.anchor,
      atSunrise: snap.p,
      weekday: weekdayForParts(parts),
      moon: moon,
      next7: next7,
      bhadra: findBhadra(parts),
      upcoming: findUpcoming(parts)
    };
  }

  function dailyFor(parts) {
    return memoize(dailyCache, cityId + '|' + dateKeyOf(parts), () => buildDaily(parts), 30);
  }

  function render() {
    const now = new Date();
    const l = lg();
    const c = city();
    const today = localParts(c.tz);
    const parts = selectedDate || today;
    const isToday = sameParts(parts, today);
    const daily = dailyFor(parts);
    const anchor = isToday ? now : (daily.sunrise || localDateToUTC(parts.y, parts.m, parts.d, 12, 0, c.tz));
    const p = panchangAt(anchor);

    const clock = el('panchang-clock');
    if (clock) clock.textContent = isToday ? fmtClock(c.tz) : fmtParts(parts, { day: 'numeric', month: 'short' });
    const live = el('panchang-live');
    if (live) live.classList.toggle('is-static', !isToday);
    const liveLabel = el('panchang-live-label');
    if (liveLabel) liveLabel.textContent = isToday ? T('panchang_live', 'Live') : T('panchang_selected_date', 'Selected date');

    const dateEl = el('panchang-date');
    const dateSubEl = el('panchang-date-sub');
    if (dateEl) {
      const bs = c.np ? adToBs(parts.y, parts.m, parts.d) : null;
      if (bs) {
        const wd = NP_WEEKDAYS[weekdayForParts(parts)] || '';
        dateEl.textContent = wd + ', ' + devNum(bs.day) + ' ' + BS_MONTHS[bs.month] + ' ' + devNum(bs.year) + ' वि.सं.';
        if (dateSubEl) dateSubEl.textContent = fmtParts(parts, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      } else {
        dateEl.textContent = fmtParts(parts, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        if (dateSubEl) dateSubEl.textContent = '';
      }
    }

    const tithiEl = el('pc-tithi');
    if (tithiEl) tithiEl.textContent = NAMES.tithi[l][p.tithi];
    const pakshaEl = el('pc-paksha');
    if (pakshaEl) {
      pakshaEl.textContent = p.tithi < 15 ? T('panchang_paksha_shukla', 'Shukla Paksha') : T('panchang_paksha_krishna', 'Krishna Paksha');
    }

    const tEnd = boundaryAt('tithi', anchor, 1);
    const tithiSub = el('pc-tithi-sub');
    if (tithiSub) {
      if (isToday) {
        const remaining = tEnd.getTime() - now.getTime();
        tithiSub.textContent = T('panchang_ends_in', 'Ends in') + ' ' + countdown(Math.max(remaining, 0));
      } else {
        tithiSub.textContent = T('panchang_ends', 'Ends') + ' ' + fmtWhenOn(tEnd, parts, c.tz);
      }
    }
    const tithiRange = el('pc-tithi-range');
    if (tithiRange) {
      const start = boundaryAt('tithi', anchor, -1);
      tithiRange.textContent = T('panchang_starts', 'Starts') + ' ' +
        (isToday ? fmtWhen(start, c.tz) : fmtWhenOn(start, parts, c.tz)) + ' \u00B7 ' +
        T('panchang_ends', 'Ends') + ' ' +
        (isToday ? fmtWhen(tEnd, c.tz) : fmtWhenOn(tEnd, parts, c.tz));
    }

    const nextTithi = el('pc-next-tithi');
    if (nextTithi) {
      const nextIndex = (p.tithi + 1) % 30;
      const nextPaksha = nextIndex < 15
        ? T('panchang_paksha_shukla', 'Shukla Paksha')
        : T('panchang_paksha_krishna', 'Krishna Paksha');
      nextTithi.textContent = T('panchang_next_tithi', 'Next tithi') + ': ' +
        NAMES.tithi[l][nextIndex] + ' (' + nextPaksha + ') \u00B7 ' +
        T('panchang_starts', 'Starts') + ' ' +
        (isToday ? fmtWhen(tEnd, c.tz) : fmtWhenOn(tEnd, parts, c.tz));
    }

    const moonShadow = el('pc-moon-shadow');
    if (moonShadow && moonShadow.style) {
      moonShadow.style.transform = 'translateX(' + moonShadowPx(p.rel, 86).toFixed(1) + 'px)';
    }

    const nakEnd = boundaryAt('nakshatra', anchor, 1);
    const nakEl = el('pc-nakshatra');
    if (nakEl) nakEl.textContent = NAMES.nakshatra[l][p.nakshatra];
    const nakSub = el('pc-nakshatra-sub');
    if (nakSub) {
      nakSub.textContent = T('panchang_pada', 'Pada') + ' ' + p.pada + ' \u00B7 ' +
        T('panchang_ends', 'Ends') + ' ' + (isToday ? fmtWhen(nakEnd, c.tz) : fmtWhenOn(nakEnd, parts, c.tz));
    }

    const yogaEnd = boundaryAt('yoga', anchor, 1);
    const yogaEl = el('pc-yoga');
    if (yogaEl) yogaEl.textContent = NAMES.yoga[l][p.yoga];
    const yogaSub = el('pc-yoga-sub');
    if (yogaSub) yogaSub.textContent = T('panchang_ends', 'Ends') + ' ' + (isToday ? fmtWhen(yogaEnd, c.tz) : fmtWhenOn(yogaEnd, parts, c.tz));

    const karanaEnd = boundaryAt('karana', anchor, 1);
    const karanaEl = el('pc-karana');
    if (karanaEl) karanaEl.textContent = NAMES.karana[l][karanaNumber(p.karanaIndex)];
    const karanaSub = el('pc-karana-sub');
    if (karanaSub) karanaSub.textContent = T('panchang_ends', 'Ends') + ' ' + (isToday ? fmtWhen(karanaEnd, c.tz) : fmtWhenOn(karanaEnd, parts, c.tz));

    const rashiEnd = boundaryAt('rashi', anchor, 1);
    const rashiEl = el('pc-rashi');
    if (rashiEl) rashiEl.textContent = NAMES.rashi[l][p.rashi];
    const rashiSub = el('pc-rashi-sub');
    if (rashiSub) rashiSub.textContent = T('panchang_ends', 'Ends') + ' ' + (isToday ? fmtWhen(rashiEnd, c.tz) : fmtWhenOn(rashiEnd, parts, c.tz));

    const cityLabel = c.name[l] || c.name.en;
    const sunriseEl = el('pc-sunrise');
    const sunsetEl = el('pc-sunset');
    const sunriseSub = el('pc-sunrise-sub');
    const sunsetSub = el('pc-sunset-sub');
    if (sunriseEl) sunriseEl.textContent = daily.sunrise ? fmtTime(daily.sunrise, c.tz) : '—';
    if (sunsetEl) sunsetEl.textContent = daily.sunset ? fmtTime(daily.sunset, c.tz) : '—';
    if (sunriseSub) sunriseSub.textContent = cityLabel;
    if (sunsetSub) sunsetSub.textContent = cityLabel;

    if (!selectedDate) {
      const input = el('panchang-date-pick');
      if (input && document.activeElement !== input) {
        const v = dateKeyOf(today);
        if (input.value !== v) input.value = v;
      }
    }

    renderDetails(daily, isToday, now, parts, c, l);
  }

  function node(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function factCard(label, value, sub, kind, wrap) {
    const card = node('div', 'panchang-fact' + (kind ? ' is-' + kind : ''));
    card.append(node('span', 'panchang-fact-label', label));
    card.append(node('span', 'panchang-fact-value' + (wrap ? ' is-wrap' : ''), value));
    if (sub) card.append(node('span', 'panchang-fact-sub', sub));
    return card;
  }

  function renderDetails(daily, isToday, now, parts, c, l) {
    const minute = Math.floor(now.getTime() / 60000);
    const key = cityId + '|' + l + '|' + daily.key + '|' + (isToday ? minute : 'static');
    if (key === detailsKey) return;
    detailsKey = key;

    renderFacts(daily, c, l, parts);
    renderArc(daily, isToday, now, c);
    renderMuhurat(daily, c, l);
    renderChoghadiya(daily, c, l, isToday, now);
    renderHora(daily, c, l, isToday, now);
    renderNextDays(daily, c, l);
    renderUpcoming(daily, c, l);
  }

  function renderFacts(daily, c, l, parts) {
    const box = el('pc-facts');
    if (!box) return;
    const p = daily.atSunrise;
    const planet = key => PLANET_NAMES[l][key];
    const tithiName = NAMES.tithi[l][p.tithi];
    const paksha = p.tithi < 15 ? T('panchang_paksha_shukla', 'Shukla Paksha') : T('panchang_paksha_krishna', 'Krishna Paksha');
    const bs = adToBs(parts.y, parts.m, parts.d);
    const shaka = (parts.m < 2 || (parts.m === 2 && parts.d < 22)) ? parts.y - 79 : parts.y - 78;
    const samvat = (bs ? T('panchang_vikram', 'Vikram Samvat') + ' ' + localNum(bs.year) : '—') +
      ' \u00B7 ' + T('panchang_shaka', 'Shaka Samvat') + ' ' + localNum(shaka);

    const cards = [];
    cards.push(factCard(T('panchang_vara', 'Vara'), weekdayName(daily.weekday),
      T('panchang_day_lord', 'Day lord') + ': ' + planet(WEEKDAY_LORDS[daily.weekday])));
    cards.push(factCard(T('panchang_sun_rashi', 'Surya Rashi'), NAMES.rashi[l][p.sunRashi],
      T('panchang_lord', 'Lord') + ': ' + planet(RASHI_LORDS[p.sunRashi])));
    cards.push(factCard(T('panchang_rashi', 'Chandra Rashi'), NAMES.rashi[l][p.rashi],
      T('panchang_moon_lord', 'Chandra Rashi lord') + ': ' + planet(RASHI_LORDS[p.rashi])));
    cards.push(factCard(T('panchang_nakshatra', 'Nakshatra'), NAMES.nakshatra[l][p.nakshatra],
      T('panchang_nak_lord', 'Nakshatra lord') + ': ' + planet(NAK_LORDS[p.nakshatra]) + ' \u00B7 ' +
      T('panchang_deity', 'Deity') + ': ' + NAK_DEITIES[l][p.nakshatra]));
    cards.push(factCard(T('panchang_tithi_lord', 'Tithi lord'), tithiLord(p.tithi),
      T('panchang_tithi_sunrise', 'Tithi at sunrise') + ': ' + tithiName + ' \u00B7 ' + paksha));
    cards.push(factCard(T('panchang_tithi_sunrise', 'Tithi at sunrise'), tithiName + ' \u00B7 ' + paksha,
      T('panchang_sunrise_note', 'Calculated at sunrise')));

    const yn = yogaNature(p.yoga);
    cards.push(factCard(T('panchang_yoga_nature', 'Yoga nature'),
      yn === 'good' ? T('panchang_nature_auspicious', 'Auspicious') : T('panchang_nature_challenging', 'Challenging'),
      yn === 'good' ? T('panchang_yoga_good', '') : T('panchang_yoga_bad', ''), yn));

    const kn = karanaNature(p.karanaIndex);
    cards.push(factCard(T('panchang_karana_nature', 'Karana nature'),
      kn === 'good' ? T('panchang_nature_auspicious', 'Auspicious') : T('panchang_nature_challenging', 'Challenging'),
      kn === 'good' ? T('panchang_karana_good', '') : T('panchang_karana_bad', ''), kn));

    const illum = Math.round((1 - Math.cos(p.rel * D2R)) / 2 * 100);
    cards.push(factCard(T('panchang_moon_illum', 'Moon illumination'), localNum(illum) + '%',
      p.tithi < 15 ? T('panchang_waxing', 'Waxing moon') : T('panchang_waning', 'Waning moon')));
    cards.push(factCard(T('panchang_samvat', 'Samvat'), samvat,
      T('panchang_saura_maas', 'Saura Maas') + ': ' + SAURA_MONTHS[l][p.sunRashi]));
    cards.push(factCard(T('panchang_timezone', 'Time zone'), tzOffsetLabel(c.tz, daily.sunriseAt),
      c.tz + ' \u00B7 ' + coordsLabel(c)));

    box.replaceChildren(...cards);
  }

  function renderArc(daily, isToday, now, c) {
    const box = el('pc-arc');
    if (!box) return;
    const sr = daily.sunrise;
    const ss = daily.sunset;
    if (!sr || !ss) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    const sunriseLabel = el('pc-arc-sunrise');
    const sunsetLabel = el('pc-arc-sunset');
    const lengthLabel = el('pc-arc-length');
    if (sunriseLabel) sunriseLabel.textContent = fmtTime(sr, c.tz);
    if (sunsetLabel) sunsetLabel.textContent = fmtTime(ss, c.tz);
    if (lengthLabel) lengthLabel.textContent = durationText(ss.getTime() - sr.getTime());
    const sun = el('pc-arc-sun');
    if (!sun) return;
    const visible = isToday && now >= sr && now <= ss;
    sun.hidden = !visible;
    if (!visible) return;
    const t = Math.min(1, Math.max(0, (now.getTime() - sr.getTime()) / (ss.getTime() - sr.getTime())));
    sun.style.left = (2 + 96 * t).toFixed(2) + '%';
    sun.style.top = (96 - 212 * t * (1 - t)).toFixed(2) + '%';
  }

  function renderMuhurat(daily, c, l) {
    const box = el('pc-muhurat');
    if (!box) return;
    const cards = [];
    const sr = daily.sunrise;
    const ss = daily.sunset;
    const nsr = daily.nextSunrise;
    if (sr && ss) {
      const dayMs = ss.getTime() - sr.getTime();
      const part = dayMs / 8;
      const wd = daily.weekday;
      const at = i => new Date(sr.getTime() + part * i);
      cards.push(factCard(T('panchang_brahma', 'Brahma Muhurta'),
        timeRange(new Date(sr.getTime() - 96 * 60e3), new Date(sr.getTime() - 48 * 60e3), c.tz),
        T('panchang_good', 'Good'), 'good'));
      const noon = new Date((sr.getTime() + ss.getTime()) / 2);
      const half = dayMs / 30;
      cards.push(factCard(T('panchang_abhijit', 'Abhijit Muhurta'),
        timeRange(new Date(noon.getTime() - half), new Date(noon.getTime() + half), c.tz),
        T('panchang_good', 'Good'), 'good'));
      cards.push(factCard(T('panchang_rahu', 'Rahu Kaal'),
        timeRange(at(RAHU_PART[wd]), at(RAHU_PART[wd] + 1), c.tz), T('panchang_avoid', 'Avoid'), 'bad'));
      cards.push(factCard(T('panchang_yamaganda', 'Yamaganda'),
        timeRange(at(YAMA_PART[wd]), at(YAMA_PART[wd] + 1), c.tz), T('panchang_avoid', 'Avoid'), 'bad'));
      cards.push(factCard(T('panchang_gulika', 'Gulika Kaal'),
        timeRange(at(GULIKA_PART[wd]), at(GULIKA_PART[wd] + 1), c.tz), T('panchang_avoid', 'Avoid'), 'bad'));
      if (daily.bhadra) {
        const b = daily.bhadra;
        cards.push(factCard(T('panchang_bhadra', 'Bhadra (Vishti)'),
          eventRange(b.start, b.end, daily.parts, c.tz),
          b.active
            ? T('panchang_bhadra_active', 'In effect at sunrise. Avoid new beginnings.')
            : T('panchang_bhadra_note', 'Avoid starting auspicious work.'), 'bad', true));
      }
      cards.push(factCard(T('panchang_dinamaan', 'Dinamaan'), durationText(dayMs),
        timeRange(sr, ss, c.tz)));
      if (nsr) {
        cards.push(factCard(T('panchang_ratrimaan', 'Ratrimaan'), durationText(nsr.getTime() - ss.getTime()),
          timeRange(ss, nsr, c.tz)));
      }
    }
    const rise = daily.moon.rise[0];
    const set = daily.moon.set[0];
    cards.push(factCard(T('panchang_moonrise', 'Moonrise'), rise ? fmtTime(rise, c.tz) : '—',
      rise ? '' : T('panchang_no_event', 'Not in this 24-hour window')));
    cards.push(factCard(T('panchang_moonset', 'Moonset'), set ? fmtTime(set, c.tz) : '—',
      set ? '' : T('panchang_no_event', 'Not in this 24-hour window')));
    box.replaceChildren(...cards);
  }

  function chogGroup(title, sequence, startDate, stepMs, c, l, isToday, now) {
    const group = node('div', 'panchang-chog-group');
    const head = node('div', 'panchang-chog-title');
    head.append(node('span', '', title));
    const legend = node('span', 'panchang-chog-legend');
    legend.append(node('span', '', T('panchang_good', 'Good')));
    legend.append(node('span', 'is-bad', T('panchang_avoid', 'Avoid')));
    head.append(legend);
    group.append(head);
    const grid = node('div', 'panchang-chog-grid');
    sequence.forEach((name, i) => {
      const a = new Date(startDate.getTime() + stepMs * i);
      const b = new Date(startDate.getTime() + stepMs * (i + 1));
      const good = CHOG_GOOD.has(name);
      const item = node('div', 'panchang-chog-item' + (isToday && now >= a && now < b ? ' is-now' : ''));
      item.append(node('span', 'panchang-chog-name ' + (good ? 'is-good' : 'is-bad'), CHOG_NAMES[l][name]));
      item.append(node('span', 'panchang-chog-time', timeRange(a, b, c.tz)));
      grid.append(item);
    });
    group.append(grid);
    return group;
  }

  function renderChoghadiya(daily, c, l, isToday, now) {
    const box = el('pc-choghadiya');
    if (!box) return;
    const sr = daily.sunrise;
    const ss = daily.sunset;
    const nsr = daily.nextSunrise;
    if (!sr || !ss || !nsr) {
      box.replaceChildren(node('p', 'panchang-fact-sub', T('panchang_no_event', 'Not in this 24-hour window')));
      return;
    }
    const nightSeq = [];
    const base = CHOG_NIGHT_START[daily.weekday];
    for (let i = 0; i < 8; i++) nightSeq.push(CHOG_NIGHT[(base + i) % 7]);
    box.replaceChildren(
      chogGroup(T('panchang_day_choghadiya', 'Day Choghadiya'), CHOG_DAY[daily.weekday], sr, (ss - sr) / 8, c, l, isToday, now),
      chogGroup(T('panchang_night_choghadiya', 'Night Choghadiya'), nightSeq, ss, (nsr - ss) / 8, c, l, isToday, now)
    );
  }

  function renderHora(daily, c, l, isToday, now) {
    const box = el('pc-hora');
    if (!box) return;
    const sr = daily.sunrise;
    const nsr = daily.nextSunrise;
    if (!sr || !nsr) {
      box.replaceChildren(node('p', 'panchang-fact-sub', T('panchang_no_event', 'Not in this 24-hour window')));
      return;
    }
    const step = (nsr - sr) / 24;
    const start = HORA_START[daily.weekday];
    const grid = node('div', 'panchang-hora-grid');
    let nowLine = null;
    for (let i = 0; i < 24; i++) {
      const planet = HORA_CYCLE[(start + i) % 7];
      const a = new Date(sr.getTime() + step * i);
      const b = new Date(sr.getTime() + step * (i + 1));
      const active = isToday && now >= a && now < b;
      if (active) nowLine = { planet: planet, a: a, b: b };
      const item = node('div', 'panchang-hora-item' + (active ? ' is-now' : ''));
      item.append(node('span', 'panchang-hora-planet', PLANET_NAMES[l][planet]));
      item.append(node('span', 'panchang-hora-time', timeRange(a, b, c.tz)));
      grid.append(item);
    }
    const frag = document.createDocumentFragment();
    if (nowLine) {
      const line = node('div', 'panchang-hora-now');
      line.append(document.createTextNode(T('panchang_hora_now', 'Current Hora') + ': '));
      line.append(node('strong', '', PLANET_NAMES[l][nowLine.planet]));
      line.append(document.createTextNode(' \u00B7 ' + timeRange(nowLine.a, nowLine.b, c.tz)));
      frag.append(line);
    }
    frag.append(grid);
    box.replaceChildren(frag);
  }

  function renderNextDays(daily, c, l) {
    const table = el('pc-next-days');
    if (!table) return;
    const tbody = table.querySelector('tbody');
    if (!tbody) return;
    const today = localParts(c.tz);
    const rows = daily.next7.map(d => {
      const tr = document.createElement('tr');
      if (sameParts(d.parts, today)) tr.className = 'is-today';
      tr.append(node('td', '', fmtParts(d.parts, { weekday: 'short', day: 'numeric', month: 'short' })));
      const tithiCell = node('td', 'pc-tithi-cell');
      if (d.tithi == null) {
        tithiCell.textContent = '—';
      } else {
        tithiCell.append(document.createTextNode(NAMES.tithi[l][d.tithi]));
        tithiCell.append(node('span', 'pc-tithi-paksha',
          d.tithi < 15 ? T('panchang_paksha_shukla', 'Shukla Paksha') : T('panchang_paksha_krishna', 'Krishna Paksha')));
      }
      tr.append(tithiCell);
      tr.append(node('td', '', d.nakshatra == null ? '—' : NAMES.nakshatra[l][d.nakshatra]));
      tr.append(node('td', '', d.sunrise ? fmtTime(d.sunrise, c.tz) : '—'));
      tr.append(node('td', '', d.sunset ? fmtTime(d.sunset, c.tz) : '—'));
      return tr;
    });
    tbody.replaceChildren(...rows);
  }

  function renderUpcoming(daily, c, l) {
    const box = el('pc-upcoming');
    if (!box) return;
    const defs = [
      ['ekadashi', T('panchang_next_ekadashi', 'Next Ekadashi')],
      ['purnima', T('panchang_next_purnima', 'Next Purnima')],
      ['amavasya', T('panchang_next_amavasya', 'Next Amavasya')]
    ];
    const cards = defs.map(def => {
      const ev = daily.upcoming[def[0]];
      const card = node('div', 'panchang-upcoming-card');
      card.append(node('span', 'panchang-upcoming-label', def[1]));
      if (!ev) {
        card.append(node('span', 'panchang-upcoming-date', '—'));
        card.append(node('span', 'panchang-upcoming-sub', T('panchang_no_event', 'Not in this 24-hour window')));
      } else {
        card.append(node('span', 'panchang-upcoming-date',
          fmtParts(ev.parts, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })));
        const when = ev.days === 0
          ? T('panchang_today', 'Today')
          : localNum(ev.days) + ' ' + T('panchang_days_left', 'days left');
        card.append(node('span', 'panchang-upcoming-sub',
          when + ' \u00B7 ' + T('panchang_th_tithi', 'Tithi') + ': ' + NAMES.tithi[l][ev.tithi]));
      }
      return card;
    });
    box.replaceChildren(...cards);
  }

  function shareNote(message, kind) {
    const box = el('panchang-share-note');
    if (!box) return;
    if (!message) {
      box.hidden = true;
      box.textContent = '';
      box.className = 'panchang-actions-note';
      return;
    }
    box.hidden = false;
    box.textContent = message;
    box.className = 'panchang-actions-note' + (kind ? ' is-' + kind : '');
  }

  function canvasRoundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function buildShareCanvas(c, l, parts, daily, p) {
    const W = 1080;
    const H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const family = l === 'en'
      ? '"Plus Jakarta Sans", "Noto Sans Devanagari", sans-serif'
      : '"Noto Sans Devanagari", "Plus Jakarta Sans", sans-serif';
    const font = (weight, size) => weight + ' ' + size + 'px ' + family;
    const fit = (text, maxWidth, size, weight) => {
      let s = size;
      ctx.font = font(weight, s);
      while (s > 16 && ctx.measureText(text).width > maxWidth) {
        s -= 2;
        ctx.font = font(weight, s);
      }
      return s;
    };
    const centered = (text, y, size, weight, color, maxWidth) => {
      fit(text, maxWidth || 900, size, weight);
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(text, W / 2, y);
    };
    const label = text => String(text).toUpperCase();

    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, '#082E22');
    bg.addColorStop(0.55, '#06251B');
    bg.addColorStop(1, '#0B3A2A');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const glow = ctx.createRadialGradient(880, 120, 10, 880, 120, 360);
    glow.addColorStop(0, 'rgba(232, 163, 61, .2)');
    glow.addColorStop(1, 'rgba(232, 163, 61, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, 620);

    const stars = [
      [92, 112, 1.6], [188, 196, 1.1], [268, 86, 1.4], [372, 168, 1],
      [486, 104, 1.2], [592, 206, 1.5], [704, 92, 1], [770, 248, 1.2],
      [164, 296, 1.1], [326, 344, 1.3], [540, 308, 1], [668, 330, 1.4],
      [836, 362, 1.1], [960, 286, 1.2], [418, 76, 1]
    ];
    stars.forEach(s => {
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 255, 255, .5)';
      ctx.arc(s[0], s[1], s[2], 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.strokeStyle = 'rgba(232, 163, 61, .34)';
    ctx.lineWidth = 2;
    canvasRoundRect(ctx, 40, 40, W - 80, H - 80, 40);
    ctx.stroke();

    const moonX = 918;
    const moonY = 176;
    const moonR = 44;
    const moonGlow = ctx.createRadialGradient(moonX, moonY, 4, moonX, moonY, moonR * 2.2);
    moonGlow.addColorStop(0, 'rgba(240, 206, 130, .34)');
    moonGlow.addColorStop(1, 'rgba(240, 206, 130, 0)');
    ctx.fillStyle = moonGlow;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.clip();
    const moonFill = ctx.createRadialGradient(moonX - 16, moonY - 18, 3, moonX, moonY, moonR);
    moonFill.addColorStop(0, '#FFF9EA');
    moonFill.addColorStop(0.5, '#F4DFAC');
    moonFill.addColorStop(1, '#CFA65B');
    ctx.fillStyle = moonFill;
    ctx.fillRect(moonX - moonR, moonY - moonR, moonR * 2, moonR * 2);
    const shadowOffset = moonShadowPx(p.rel, moonR * 2);
    const dark = ctx.createRadialGradient(moonX + shadowOffset - 12, moonY - 12, 2, moonX + shadowOffset, moonY, moonR);
    dark.addColorStop(0, '#10382A');
    dark.addColorStop(1, '#071E14');
    ctx.fillStyle = dark;
    ctx.beginPath();
    ctx.arc(moonX + shadowOffset, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.textAlign = 'left';
    ctx.letterSpacing = '5px';
    ctx.font = font(700, 25);
    ctx.fillStyle = '#F1C98B';
    ctx.fillText('SUBHVEDA', 88, 112);
    ctx.letterSpacing = '0px';
    ctx.font = font(600, 17);
    ctx.fillStyle = 'rgba(191, 233, 210, .8)';
    ctx.fillText(label(T('panchang_export_kicker', 'Daily Panchang')), 89, 148);

    const cityName = c.name[l] || c.name.en;
    centered(cityName, 228, 44, 700, '#FFFFFF', 640);
    centered(fmtParts(parts, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), 272, 24, 500, 'rgba(236, 247, 241, .8)', 780);
    const bs = c.np ? adToBs(parts.y, parts.m, parts.d) : null;
    if (bs) {
      centered(devNum(bs.day) + ' ' + BS_MONTHS[bs.month] + ' ' + devNum(bs.year) + ' \u0935\u093F.\u0938\u0902.', 304, 22, 600, '#BFE9D2', 700);
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, .16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(88, bs ? 330 : 312);
    ctx.lineTo(W - 88, bs ? 330 : 312);
    ctx.stroke();

    centered(NAMES.tithi[l][p.tithi], 416, 76, 700, '#FFFFFF', 860);
    centered(p.tithi < 15 ? T('panchang_paksha_shukla', 'Shukla Paksha') : T('panchang_paksha_krishna', 'Krishna Paksha'), 458, 26, 600, '#F1C98B', 700);

    const tEnd = boundaryAt('tithi', daily.sunriseAt, 1);
    const tStart = boundaryAt('tithi', daily.sunriseAt, -1);
    centered(T('panchang_starts', 'Starts') + ' ' + fmtWhenOn(tStart, parts, c.tz) + ' \u00B7 ' + T('panchang_ends', 'Ends') + ' ' + fmtWhenOn(tEnd, parts, c.tz), 496, 21, 500, 'rgba(191, 233, 210, .92)', 900);

    const factX = 88;
    const factW = (W - 176 - 22) / 2;
    const factH = 110;
    const drawFact = (x, y, cap, value) => {
      ctx.fillStyle = 'rgba(255, 255, 255, .055)';
      canvasRoundRect(ctx, x, y, factW, factH, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, .12)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.textAlign = 'left';
      ctx.font = font(700, 16);
      ctx.fillStyle = 'rgba(233, 245, 238, .62)';
      ctx.fillText(label(cap), x + 22, y + 34);
      fit(value, factW - 44, 30, 700);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(value, x + 22, y + 82);
    };

    const facts = [
      [T('panchang_nakshatra', 'Nakshatra'), NAMES.nakshatra[l][p.nakshatra] + ' \u00B7 ' + T('panchang_pada', 'Pada') + ' ' + localNum(p.pada)],
      [T('panchang_yoga', 'Yoga'), NAMES.yoga[l][p.yoga]],
      [T('panchang_karana', 'Karana'), NAMES.karana[l][karanaNumber(p.karanaIndex)]],
      [T('panchang_rashi', 'Chandra Rashi'), NAMES.rashi[l][p.rashi]]
    ];
    facts.forEach((f, i) => {
      const x = factX + (i % 2) * (factW + 22);
      const y = 534 + Math.floor(i / 2) * (factH + 22);
      drawFact(x, y, f[0], f[1]);
    });

    const sunY = 800;
    const sunW = (W - 176 - 32) / 3;
    const drawSun = (i, cap, value, accent) => {
      const x = 88 + i * (sunW + 16);
      ctx.fillStyle = 'rgba(255, 255, 255, .05)';
      canvasRoundRect(ctx, x, sunY, sunW, 102, 16);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, .1)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.textAlign = 'center';
      ctx.font = font(700, 15);
      ctx.fillStyle = 'rgba(233, 245, 238, .6)';
      ctx.fillText(label(cap), x + sunW / 2, sunY + 34);
      fit(value, sunW - 28, 28, 700);
      ctx.fillStyle = accent || '#FFFFFF';
      ctx.fillText(value, x + sunW / 2, sunY + 76);
    };
    drawSun(0, T('panchang_sunrise', 'Sunrise'), fmtTime(daily.sunrise, c.tz), '#FFFFFF');
    drawSun(1, T('panchang_sunset', 'Sunset'), fmtTime(daily.sunset, c.tz), '#FFFFFF');
    drawSun(2, T('panchang_day_length', 'Day length'), durationText(daily.sunset.getTime() - daily.sunrise.getTime()), '#F1C98B');

    const rowY = [986, 1042, 1098];
    const drawRow = (index, cap, value) => {
      const y = rowY[index];
      if (index === 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, .14)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(88, y - 38);
        ctx.lineTo(W - 88, y - 38);
        ctx.stroke();
      }
      ctx.textAlign = 'left';
      ctx.font = font(700, 17);
      ctx.fillStyle = 'rgba(233, 245, 238, .62)';
      ctx.fillText(label(cap), 88, y);
      ctx.textAlign = 'right';
      fit(value, 600, 24, 700);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(value, W - 88, y);
    };

    const dayMs = daily.sunset.getTime() - daily.sunrise.getTime();
    const part = dayMs / 8;
    const wd = daily.weekday;
    const at = i => new Date(daily.sunrise.getTime() + part * i);
    drawRow(0, T('panchang_rahu', 'Rahu Kaal'), timeRange(at(RAHU_PART[wd]), at(RAHU_PART[wd] + 1), c.tz));
    const noon = new Date((daily.sunrise.getTime() + daily.sunset.getTime()) / 2);
    const half = dayMs / 30;
    drawRow(1, T('panchang_abhijit', 'Abhijit Muhurta'), timeRange(new Date(noon.getTime() - half), new Date(noon.getTime() + half), c.tz));
    drawRow(2, T('panchang_bhadra', 'Bhadra (Vishti)'), daily.bhadra ? eventRange(daily.bhadra.start, daily.bhadra.end, parts, c.tz) : '\u2014');

    ctx.strokeStyle = 'rgba(255, 255, 255, .14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(88, 1142);
    ctx.lineTo(W - 88, 1142);
    ctx.stroke();

    centered('Subhveda', 1198, 25, 700, '#F1C98B', 500);
    centered(T('panchang_export_footer', 'Calculated with the Lahiri ayanamsa') + ' \u00B7 ' + c.tz, 1238, 18, 500, 'rgba(233, 245, 238, .6)', 820);
    return canvas;
  }

  function canvasToBlob(canvas) {
    return new Promise(resolve => {
      if (canvas.toBlob) {
        canvas.toBlob(blob => resolve(blob), 'image/png');
        return;
      }
      try {
        const data = canvas.toDataURL('image/png').split(',')[1];
        const bytes = atob(data);
        const arr = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
        resolve(new Blob([arr], { type: 'image/png' }));
      } catch (e) {
        resolve(null);
      }
    });
  }

  async function sharePanchangImage() {
    const btn = el('panchang-share');
    if (btn && btn.disabled) return;
    if (btn) btn.disabled = true;
    shareNote('');
    try {
      try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
      const c = city();
      const l = lg();
      const parts = selectedDate || localParts(c.tz);
      const daily = dailyFor(parts);
      const canvas = buildShareCanvas(c, l, parts, daily, daily.atSunrise);
      const blob = await canvasToBlob(canvas);
      if (!blob) throw new Error('image');
      const filename = 'shubh-veda-panchang-' + dateKeyOf(parts) + '.png';
      let file = null;
      try { file = new File([blob], filename, { type: 'image/png' }); } catch (e) { file = null; }
      if (file && navigator.canShare && navigator.share) {
        try {
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: T('panchang_share_title', 'Daily Panchang') });
            shareNote(T('panchang_share_shared', 'Panchang shared.'), 'ok');
            setTimeout(() => shareNote(''), 5000);
            return;
          }
        } catch (e) {
          if (e && e.name === 'AbortError') return;
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      shareNote(T('panchang_share_saved', 'Panchang image saved. You can share it on WhatsApp.'), 'ok');
      setTimeout(() => shareNote(''), 7000);
    } catch (e) {
      shareNote(T('panchang_share_failed', 'Could not create the image. Please try again.'), 'err');
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  window.ShubhPanchang = {
    julianDay: julianDay,
    sunLongitude: sunLongitude,
    moonLongitude: moonLongitude,
    ayanamsa: ayanamsa,
    moonSidereal: moonSidereal,
    sunSidereal: sunSidereal,
    boundary: boundary,
    tithiStart: tithiStart,
    tithiEnd: tithiEnd,
    panchangAt: panchangAt,
    karanaNumber: karanaNumber,
    sunTimesFor: sunTimesFor,
    moonTimesFor: moonTimesFor,
    localDateToUTC: localDateToUTC,
    tzOffsetMs: tzOffsetMs,
    NAMES: NAMES,
    CITIES: CITIES,
    REGIONS: REGIONS,
    REGION_CITIES: REGION_CITIES
  };

  function start() {
    if (timer) clearInterval(timer);
    render();
    timer = setInterval(render, 1000);
  }

  function init() {
    if (!el('panchang-panel')) return;
    const savedLocal = readLocalCity();
    if (savedLocal) mountLocalCity(savedLocal);
    try { cityId = localStorage.getItem('shubhveda_panchang_city') || 'delhi'; } catch (e) {}
    if (!CITIES.some(c => c.id === cityId)) cityId = 'delhi';
    fillCityOptions();
    syncDateInput();

    const select = el('panchang-city');
    if (select) {
      select.addEventListener('change', () => {
        cityId = select.value;
        try { localStorage.setItem('shubhveda_panchang_city', cityId); } catch (e) {}
        detailsKey = '';
        syncDateInput();
        render();
      });
    }

    const datePick = el('panchang-date-pick');
    if (datePick) {
      datePick.addEventListener('change', () => {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePick.value);
        if (!m) return;
        const picked = { y: +m[1], m: +m[2] - 1, d: +m[3] };
        selectedDate = sameParts(picked, localParts(city().tz)) ? null : picked;
        detailsKey = '';
        render();
      });
    }

    const todayBtn = el('panchang-today');
    if (todayBtn) {
      todayBtn.addEventListener('click', () => {
        selectedDate = null;
        detailsKey = '';
        syncDateInput();
        render();
      });
    }

    const locateBtn = el('panchang-locate');
    if (locateBtn) locateBtn.addEventListener('click', useMyLocation);

    const shareBtn = el('panchang-share');
    if (shareBtn) shareBtn.addEventListener('click', sharePanchangImage);

    const printBtn = el('panchang-print');
    if (printBtn) printBtn.addEventListener('click', () => window.print());

    document.addEventListener('languagechange', () => {
      fillCityOptions();
      syncDateInput();
      detailsKey = '';
      render();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (timer) { clearInterval(timer); timer = null; }
      } else {
        start();
      }
    });

    start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
