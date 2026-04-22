const express = require('express');
const cors = require('cors');
const swisseph = require('swisseph');
const fs = require('fs');

// =======================
// 🔍 DEBUG - Controllo cartella ephe
// =======================
console.log('🔍 DIRECTORY CORRENTE:', __dirname);
console.log('🔍 La cartella ./ephe esiste?', fs.existsSync('./ephe'));

if (fs.existsSync('./ephe')) {
  console.log('🔍 Contenuto di ./ephe:', fs.readdirSync('./ephe'));
} else {
  console.log('🔍 Cartella ./ephe NON TROVATA!');
  console.log('🔍 Provo a cercare in /app/ephe...');
  console.log('🔍 /app/ephe esiste?', fs.existsSync('/app/ephe'));
  if (fs.existsSync('/app/ephe')) {
    console.log('🔍 Contenuto di /app/ephe:', fs.readdirSync('/app/ephe'));
  }
}

// Imposta il percorso dei file ephemeris (prova entrambi)
if (fs.existsSync('./ephe')) {
  swisseph.swe_set_ephe_path('./ephe');
  console.log('✅ Percorso impostato su ./ephe');
} else if (fs.existsSync('/app/ephe')) {
  swisseph.swe_set_ephe_path('/app/ephe');
  console.log('✅ Percorso impostato su /app/ephe');
} else {
  console.log('❌ NESSUN PERCORSO TROVATO!');
}

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

    console.log(`🪐 Calcolo pianeta ID: ${planet} per JD: ${jd}`);

    const result = swisseph.swe_calc_ut(
      jd,
      planet,
      swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED
    );

    console.log(`📊 Risultato grezzo per ID ${planet}:`, JSON.stringify(result));

    if (!result) {
      console.log(`❌ Nessun risultato per pianeta ${planet}`);
      return null;
    }

    // Node binding compatibility
    const data = Array.isArray(result) ? result : result.xx;

    if (!data || data.length === 0) {
      console.log(`❌ Nessun dato per pianeta ${planet}`);
      return null;
    }

    console.log(`✅ Longitudine per pianeta ${planet}: ${data[0]}`);
    return data[0];

  } catch (e) {
    console.error(`❌ Planet calc error per ID ${planet}:`, e.message);
    return null;
  }
}

// =======================
// 🌟 CONVERTE LONGITUDINE IN SEGNO + GRADO
// =======================
function getPlanetData(jd, planet) {
  console.log(`🔍 getPlanetData chiamato per planet ID: ${planet}`);
  const long = calcPlanet(jd, planet);
  if (long === null) {
    console.log(`❌ getPlanetData: long è null per ID ${planet}`);
    return null;
  }
  
  const segni = [
    'Ariete ♈', 'Toro ♉', 'Gemelli ♊', 'Cancro ♋',
    'Leone ♌', 'Vergine ♍', 'Bilancia ♎', 'Scorpione ♏',
    'Sagittario ♐', 'Capricorno ♑', 'Acquario ♒', 'Pesci ♓'
  ];
  
  const indiceSegno = Math.floor(long / 30);
  const gradoNelSegno = (long % 30).toFixed(2);
  
  const risultato = {
    longitudine: long,
    segno: segni[indiceSegno],
    grado: gradoNelSegno
  };
  
  console.log(`✅ getPlanetData risultato per ID ${planet}:`, risultato);
  return risultato;
}

// =======================
// 🌌 API
// =======================
app.post('/tema-natale', (req, res) => {

  try {

    const { data, ora } = req.body;

    console.log(`📥 Ricevuta richiesta: data=${data}, ora=${ora}`);

    if (!data || !ora) {
      return res.status(400).json({ errore: 'Dati mancanti' });
    }

    const [y, m, d] = data.split('-').map(Number);
    const [h, min] = ora.split(':').map(Number);

    const ut = h + min / 60;

    console.log(`📅 Data convertita: y=${y}, m=${m}, d=${d}, ut=${ut}`);

    const jd = swisseph.swe_julday(
      y, m, d, ut,
      swisseph.SE_GREG_CAL
    );

    console.log(`📆 Julian Day calcolato: ${jd}`);

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

    console.log(`📤 Risultato finale pianeti:`, JSON.stringify(pianeti));

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