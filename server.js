const express = require('express');
const cors = require('cors');
const swisseph = require('swisseph');

const app = express();

app.use(cors());
app.use(express.json());

// =======================
// 🔵 TEST SERVER
// =======================
app.get('/', (req, res) => {
  res.send('Backend Astrovia funzionante 🚀');
});

// =======================
// 🔧 FUNZIONE SICURA CALCOLO
// =======================
function calcPlanet(jd, planet) {

  const result = swisseph.swe_calc_ut(
    jd,
    planet,
    swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED
  );

  if (!result) {
    throw new Error('Swiss Ephemeris null result');
  }

  if (result.error) {
    throw new Error(result.error);
  }

  // 🔥 compatibilità reale Node binding
  const lon = result.xx ?? result.longitude;

  if (lon === undefined || lon === null) {
    throw new Error('Invalid Swiss Ephemeris output');
  }

  return lon;
}

// =======================
// 🔵 TEMA NATALE
// =======================
app.post('/tema-natale', (req, res) => {

  try {

    const { data, ora, lat, lon } = req.body;

    if (!data || !ora) {
      return res.status(400).json({
        errore: 'Dati mancanti'
      });
    }

    const [year, month, day] = data.split('-').map(Number);
    const [hour, minute] = ora.split(':').map(Number);

    if (
      isNaN(year) || isNaN(month) || isNaN(day) ||
      isNaN(hour) || isNaN(minute)
    ) {
      return res.status(400).json({
        errore: 'Formato data/ora non valido'
      });
    }

    const ut = hour + minute / 60;

    const jd = swisseph.swe_julday(
      year,
      month,
      day,
      ut,
      swisseph.SE_GREG_CAL
    );

    // =======================
    // 🌌 PIANETI PRINCIPALI
    // =======================
    const sole = calcPlanet(jd, swisseph.SE_SUN);
    const luna = calcPlanet(jd, swisseph.SE_MOON);
    const mercurio = calcPlanet(jd, swisseph.SE_MERCURY);
    const venere = calcPlanet(jd, swisseph.SE_VENUS);
    const marte = calcPlanet(jd, swisseph.SE_MARS);
    const giove = calcPlanet(jd, swisseph.SE_JUPITER);
    const saturno = calcPlanet(jd, swisseph.SE_SATURN);
    const urano = calcPlanet(jd, swisseph.SE_URANUS);
    const nettuno = calcPlanet(jd, swisseph.SE_NEPTUNE);
    const plutone = calcPlanet(jd, swisseph.SE_PLUTO);

    // =======================
    // ⚷ CHIRONE
    // =======================
    const chirone = calcPlanet(jd, swisseph.SE_CHIRON);

    // =======================
    // ⚸ LILITH
    // =======================
    const lilith = calcPlanet(jd, swisseph.SE_MEAN_APOG);

    // =======================
    // 📡 RESPONSE
    // =======================
    res.json({
      messaggio: 'Calcolo tema natale completo',

      sole,
      luna,
      mercurio,
      venere,
      marte,
      giove,
      saturno,
      urano,
      nettuno,
      plutone,

      chirone,
      lilith,

      debug: {
        jd,
        lat,
        lon
      }
    });

  } catch (err) {

    console.error('❌ SERVER ERROR:', err);

    res.status(500).json({
      errore: err.message || 'Errore interno server'
    });
  }
});

// =======================
// 🔵 AVVIO SERVER
// =======================
const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server avviato su porta ${PORT}`);
});