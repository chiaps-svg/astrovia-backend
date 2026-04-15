const express = require('express');
const cors = require('cors');
const swisseph = require('swisseph');
const path = require('path');

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
  const result = swisseph.swe_calc_ut(jd, planet);

  if (!result || result.error) {
    throw new Error('Errore Swiss Ephemeris');
  }

  return result.longitude;
}

// =======================
// 🔵 TEMA NATALE
// =======================
app.post('/tema-natale', (req, res) => {

  console.log('📩 REQUEST BODY:', req.body);

  const { data, ora, lat, lon } = req.body;

  if (!data || !ora || lat == null || lon == null) {
    return res.status(400).json({
      errore: 'Dati mancanti'
    });
  }

  try {

    // =======================
    // 🔢 CONVERSIONE DATA
    // =======================
    const [year, month, day] = data.split('-').map(Number);
    const [hour, minute] = ora.split(':').map(Number);

    const ut = hour + minute / 60;

    const jd = swisseph.swe_julday(
      year,
      month,
      day,
      ut,
      swisseph.SE_GREG_CAL
    );

    // =======================
    // 🌌 PIANETI BASE
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
    // ⚷ CHIRONE (asteroide)
    // =======================
    const chirone = calcPlanet(jd, swisseph.SE_CHIRON);

    // =======================
    // ⚸ LILITH (Black Moon Mean Apogee)
    // =======================
    const lilith = calcPlanet(jd, swisseph.SE_MEAN_APOG);

    // =======================
    // 📡 RESPONSE
    // =======================
    res.json({
      messaggio: 'Calcolo tema natale completo',

      // 🌌 pianeti
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

      // 🪐 extra astrologici
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