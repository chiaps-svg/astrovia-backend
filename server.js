const express = require('express');
const cors = require('cors');
const swisseph = require('swisseph');

const app = express();
app.use(cors());
app.use(express.json());

// percorso dei file ephemeris (crea cartella 'ephe' nella root)
swisseph.swe_set_ephe_path('./ephe');

app.post('/tema-natale', (req, res) => {
  const { data, ora, lat, lon } = req.body;

  try {
    const [year, month, day] = data.split('-').map(Number);
    const [hour, minute] = ora.split(':').map(Number);

    const ut = hour + minute / 60;

    const jd = swisseph.swe_julday(year, month, day, ut, swisseph.SE_GREG_CAL);

    // esempio calcolo Sole
    const sun = swisseph.swe_calc_ut(jd, swisseph.SE_SUN);

    res.json({
      messaggio: 'Calcolo OK',
      sole: sun.longitude
    });

  } catch (err) {
    res.status(500).json({ errore: err.message });
  }
});

app.listen(3000, () => {
  console.log('Server avviato su http://localhost:3000');
});