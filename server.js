// Astrovia Backend v10 Engine — MAX PRECISION MODE
// Goal: scientific consistency + Swiss Ephemeris correctness + zero duplicated logic

const express = require('express');
const swisseph = require('swisseph');
const fs = require('fs');

// =======================
// ⚙️ CONFIG ENGINE
// =======================
const CONFIG = {
  ephePath: './ephe',
  houseSystem: 'P',
  speedFlag: swisseph.SEFLG_SPEED,
  baseFlag: swisseph.SEFLG_SWIEPH,
  useTrueNode: false,
  debug: false
};

// =======================
// 📦 FRASES
// =======================
let frasiAspetti, consigliPositivi, consigliNegativi, consigliNeutri;

try {
  const m = require('./data/frasi-previsioni');
  frasiAspetti = m.frasiAspetti;
  consigliPositivi = m.consigliPositivi;
  consigliNegativi = m.consigliNegativi;
  consigliNeutri = m.consigliNeutri;
} catch {
  frasiAspetti = {};
  consigliPositivi = ['✨ Energia favorevole'];
  consigliNegativi = ['⚠️ Energia critica'];
  consigliNeutri = ['⚖️ Energia stabile'];
}

// =======================
// 🌍 EPHE SETUP
// =======================
if (fs.existsSync(CONFIG.ephePath)) {
  swisseph.swe_set_ephe_path(CONFIG.ephePath);
}

if (typeof swisseph.swe_set_tid_acc === 'function') {
  swisseph.swe_set_tid_acc(-26.0);
}

// =======================
// 🚀 APP
// =======================
const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.get('/', (_, res) => res.send('Astrovia v10 MAX PRECISION'));
app.get('/ping', (_, res) => res.send('OK'));

// =======================
// 🧠 CORE CONSTANTS
// =======================
const SEGNI = ['Ariete','Toro','Gemelli','Cancro','Leone','Vergine','Bilancia','Scorpione','Sagittario','Capricorno','Acquario','Pesci'];

function segno(long) {
  return SEGNI[Math.floor(long / 30)];
}

function grado(long) {
  return (long % 30).toFixed(6);
}

function wrap(long) {
  if (long === null || long === undefined || isNaN(long)) return null;
  return { longitudine: long, segno: segno(long), grado: grado(long) };
}

// =======================
// ⏱ TIME ENGINE (UNIFIED)
// =======================
function isDST(y, m, d) {
  const date = new Date(y, m - 1, d);

  const start = new Date(y, 2, 31);
  start.setDate(start.getDate() - start.getDay());

  const end = new Date(y, 9, 31);
  end.setDate(end.getDate() - end.getDay());

  return date >= start && date < end;
}

function toJD(date, time) {
  const [y, m, d] = date.split('-').map(Number);
  let [h, mi] = time.split(':').map(Number);

  const offset = isDST(y, m, d) ? 2 : 1;
  let ut = h + mi / 60 - offset;

  return swisseph.swe_julday(y, m, d, ut, swisseph.SE_GREG_CAL);
}

// =======================
// 🌙 ΔT ENGINE
// =======================
function deltaT(jd) {
  const dt = swisseph.swe_deltat(jd);
  if (typeof dt === 'number') return dt;
  return dt?.delta_t || dt?.deltat || 0;
}

// =======================
// 🪐 PLANET ENGINE (SINGLE SOURCE OF TRUTH)
// =======================
function planet(id, jd) {
  try {
    const tt = jd + deltaT(jd);

    const res = swisseph.swe_calc(
      tt,
      id,
      CONFIG.baseFlag | CONFIG.speedFlag
    );

    if (!res) return null;

    let lon = null;

    if (Array.isArray(res)) lon = res[0];
    else if (typeof res === 'number') lon = res;
    else if (typeof res.longitude === 'number') lon = res.longitude;

    if (lon === null || !isFinite(lon)) return null;

    return lon;

  } catch {
    return null;
  }
}

// =======================
// 🏠 HOUSES ENGINE
// =======================
function houses(jd, lat, lon) {
  try {
    const res = swisseph.swe_houses(jd, lat, lon, CONFIG.houseSystem);

    if (!res) return { asc: null, mc: null, dc: null, ic: null, cusps: [] };

    const cusps = res.house || res.cusps || [];
    const ascmc = res.ascmc || [];

    return {
      asc: wrap(ascmc?.[0]),
      mc: wrap(ascmc?.[1]),
      dc: wrap((ascmc?.[0] + 180) % 360),
      ic: wrap((ascmc?.[1] + 180) % 360),
      cusps
    };

  } catch (e) {
    return { asc: null, mc: null, dc: null, ic: null, cusps: [] };
  }
}

// =======================
// 🔗 ASPECT ENGINE
// =======================
function diff(a, b) {
  let d = Math.abs(a - b);
  return d > 180 ? 360 - d : d;
}

const ASPECTS = [
  ['Congiunzione', 0, 8],
  ['Sestile', 60, 6],
  ['Quadrato', 90, 8],
  ['Trigono', 120, 8],
  ['Opposizione', 180, 8]
];

function aspects(a, b) {
  const d = diff(a, b);
  const out = [];

  for (const [name, angle, orb] of ASPECTS) {
    const delta = Math.abs(d - angle);
    if (delta <= orb) {
      out.push({ aspetto: name, orb: delta.toFixed(6) });
    }
  }

  return out;
}

function checkAspects(p1, p2) {
  const out = [];

  for (const [k1, v1] of Object.entries(p1)) {
    for (const [k2, v2] of Object.entries(p2)) {

      if (!isFinite(v1) || !isFinite(v2)) continue;

      const hits = aspects(v1, v2);

      for (const h of hits) {
        out.push({
          p1: k1,
          p2: k2,
          ...h
        });
      }
    }
  }

  return out;
}

// =======================
// 🔮 API TEMA NATALE
// =======================
app.post('/tema-natale', (req, res) => {
  try {
    const { data, ora, lat, lon } = req.body;
    if (!data || !ora || !lat || !lon)
      return res.status(400).json({ error: 'missing params' });

    const jd = toJD(data, ora);

    const planets = {
      sole: wrap(planet(swisseph.SE_SUN, jd)),
      luna: wrap(planet(swisseph.SE_MOON, jd)),
      mercurio: wrap(planet(swisseph.SE_MERCURY, jd)),
      venere: wrap(planet(swisseph.SE_VENUS, jd)),
      marte: wrap(planet(swisseph.SE_MARS, jd)),
      giove: wrap(planet(swisseph.SE_JUPITER, jd)),
      saturno: wrap(planet(swisseph.SE_SATURN, jd)),
      urano: wrap(planet(swisseph.SE_URANUS, jd)),
      nettuno: wrap(planet(swisseph.SE_NEPTUNE, jd)),
      plutone: wrap(planet(swisseph.SE_PLUTO, jd))
    };

    const houseData = houses(jd, parseFloat(lat), parseFloat(lon));

    const aspectsOut = checkAspects(
      Object.fromEntries(Object.entries(planets).map(([k,v]) => [k, v?.longitudine]))
    );

    res.json({
      jd,
      planets,
      houses: houseData,
      aspects: aspectsOut
    });

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =======================
// 🚀 START
// =======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Astrovia v10 running on', PORT));