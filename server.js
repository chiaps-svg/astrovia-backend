const express = require('express');
const cors = require('cors');
const swisseph = require('swisseph');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// 🔥 IMPORTANTE: path assoluto per Render/Linux
const ephePath = path.join(__dirname, 'ephe');
swisseph.swe_set_ephe_path(ephePath);

// =======================
// 🔵 TEST SERVER
// =======================
app.get('/', (req, res) => {
  res.send('Backend Astrovia funzionante 🚀');
});

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

    // 🔥 CALCOLO SICURO
    const sun = swisseph.swe_calc_ut(jd, swisseph.SE_SUN);

    console.log('☀️ SUN RAW:', sun);

    if (!sun) {
      return res.status(500).json({
        errore: 'Errore calcolo Swiss Ephemeris'
      });
    }

    res.json({
      messaggio: 'Calcolo OK',
      sole: sun.longitude ?? null,
      debug: {
        jd,
        lat,
        lon
      }
    });

  } catch (err) {

    console.error('❌ SERVER ERROR:', err);

    res.status(500).json({
      errore: err.message
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