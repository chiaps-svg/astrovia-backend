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
// 🔧 SAFE CALC (restituisce solo la longitudine)
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
// 🌟 CONVERTE LONGITUDINE IN SEGNO + GRADO
// =======================
function getPlanetData(jd, planet) {
  const long = calcPlanet(jd, planet);
  if (long === null) return null;
  
  const segni = [
    'Ariete ♈', 'Toro ♉', 'Gemelli ♊', 'Cancro ♋',
    'Leone ♌', 'Vergine ♍', 'Bilancia ♎', 'Scorpione ♏',
    'Sagittario ♐', 'Capricorno ♑', 'Acquario ♒', 'Pesci ♓'
  ];
  
  const indiceSegno = Math.floor(long / 30);
  const gradoNelSegno = (long % 30).toFixed(2);
  
  return {
    longitudine: long,
    segno: segni[indiceSegno],
    grado: gradoNelSegno
  };
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

    // =======================
    // 🌟 PIANETI (con segno e grado)
    // =======================
    const pianeti = {
      sole: getPlanetData(jd, swisseph.SE_SUN),
      luna: getPlanetData(jd, swisseph.SE_MOON),
      mercurio: getPlanetData(jd, swisseph.SE_MERCURY),
      venere: getPlanetData(jd, swisseph.SE_VENUS),
      marte: getPlanetData(jd, swisseph.SE_MARS),
      giove: getPlanetData(jd, swisseph.SE_JUPITER),
      saturno: getPlanetData(jd, swisseph.SE_SATURN),
      urano: getPlanetData(jd, swisseph.SE_URANUS),
      nettuno: getPlanetData(jd, swisseph.SE_NEPTUNE),
      plutone: getPlanetData(jd, swisseph.SE_PLUTO),
      chirone: getPlanetData(jd, swisseph.SE_CHIRON),
      lilith: getPlanetData(jd, swisseph.SE_MEAN_APOG)
    };

    // =======================
    // 📡 OUTPUT
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
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server attivo su porta ${PORT}`);
});