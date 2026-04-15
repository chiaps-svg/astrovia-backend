const express = require('express');
const cors = require('cors');
const swisseph = require('swisseph');

const app = express();

app.use(cors());
app.use(express.json());

// =======================
// 🔵 TEST
// =======================
app.get('/', (req, res) => {
  res.send('Backend Astrovia funzionante 🚀');
});

// =======================
// 🔧 SAFE CALC
// =======================
function calcPlanet(jd, planet) {
  try {

    if (!planet) return null;

    const result = swisseph.swe_calc_ut(
      jd,
      planet,
      swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED
    );

    if (!result) return null;

    // Node binding compatibility
    const data = Array.isArray(result) ? result : result.xx;

    if (!data || data.length === 0) return null;

    return data[0];

  } catch (e) {
    console.error('Planet calc error:', e.message);
    return null;
  }
}

// =======================
// 🌌 API
// =======================
app.post('/tema-natale', (req, res) => {

  try {

    const { data, ora } = req.body;

    if (!data || !ora) {
      return res.status(400).json({ errore: 'Dati mancanti' });
    }

    const [y, m, d] = data.split('-').map(Number);
    const [h, min] = ora.split(':').map(Number);

    const ut = h + min / 60;

    const jd = swisseph.swe_julday(
      y, m, d, ut,
      swisseph.SE_GREG_CAL
    );

    const flags = swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED;

    // =======================
    // 🌟 PIANETI
    // =======================
    const pianeti = {
      sole: calcPlanet(jd, swisseph.SE_SUN),
      luna: calcPlanet(jd, swisseph.SE_MOON),
      mercurio: calcPlanet(jd, swisseph.SE_MERCURY),
      venere: calcPlanet(jd, swisseph.SE_VENUS),
      marte: calcPlanet(jd, swisseph.SE_MARS),
      giove: calcPlanet(jd, swisseph.SE_JUPITER),
      saturno: calcPlanet(jd, swisseph.SE_SATURN),
      urano: calcPlanet(jd, swisseph.SE_URANUS),
      nettuno: calcPlanet(jd, swisseph.SE_NEPTUNE),
      plutone: calcPlanet(jd, swisseph.SE_PLUTO),

      chirone: calcPlanet(jd, swisseph.SE_CHIRON || null),
      lilith: calcPlanet(jd, swisseph.SE_MEAN_APOG || null)
    };

    // =======================
    // 📡 OUTPUT COMPATIBILE FRONTEND
    // =======================
    res.json({
      jd,
      pianeti
    });

  } catch (err) {

    console.error('❌ ERROR:', err);

    res.status(500).json({
      errore: err.message || 'Errore server'
    });
  }
});

// =======================
// 🚀 START
// =======================
const PORT = process.env.PORT;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server attivo su porta ${PORT}`);
});