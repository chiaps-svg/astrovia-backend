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
}

// Imposta il percorso dei file ephemeris
if (fs.existsSync('./ephe')) {
  swisseph.swe_set_ephe_path('./ephe');
  console.log('✅ Percorso impostato su ./ephe');
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
// 🔧 SAFE CALC - CORRETTO
// =======================
function calcPlanet(jd, planet) {
  try {
    if (!planet && planet !== 0) return null;

    console.log(`🪐 Calcolo pianeta ID: ${planet} per JD: ${jd}`);

    const result = swisseph.swe_calc_ut(
      jd,
      planet,
      swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED
    );

    if (!result) {
      console.log(`❌ Nessun risultato per pianeta ${planet}`);
      return null;
    }

    // Gestione speciale per il Sole (ID 0)
    if (planet === 0) {
      console.log(`🔴 SOLE - Risultato:`, JSON.stringify(result));
    }

    // Estrae la longitudine - la libreria restituisce un oggetto
    let longitudine = null;
    
    if (typeof result.longitude === 'number') {
      longitudine = result.longitude;
    } else if (typeof result === 'number') {
      longitudine = result;
    } else if (Array.isArray(result) && result.length > 0) {
      longitudine = result[0];
    }

    if (longitudine === null || longitudine === undefined) {
      console.log(`❌ Nessuna longitudine per pianeta ${planet}`);
      return null;
    }

    console.log(`✅ Longitudine per pianeta ${planet}: ${longitudine}`);
    return longitudine;

  } catch (e) {
    console.error(`❌ Planet calc error per ID ${planet}:`, e.message);
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

    console.log(`📥 Ricevuta richiesta: data=${data}, ora=${ora}`);

    if (!data || !ora) {
      return res.status(400).json({ errore: 'Dati mancanti' });
    }

    const [y, m, d] = data.split('-').map(Number);
    const [h, min] = ora.split(':').map(Number);
    const ut = h + min / 60;

    const jd = swisseph.swe_julday(y, m, d, ut, swisseph.SE_GREG_CAL);

    console.log(`📆 Julian Day calcolato: ${jd}`);

    // =======================
    // 🌟 PIANETI
    // =======================
    const pianeti = {
      sole: getPlanetData(jd, swisseph.SE_SUN),        // ID 0
      luna: getPlanetData(jd, swisseph.SE_MOON),       // ID 1
      mercurio: getPlanetData(jd, swisseph.SE_MERCURY), // ID 2
      venere: getPlanetData(jd, swisseph.SE_VENUS),    // ID 3
      marte: getPlanetData(jd, swisseph.SE_MARS),      // ID 4
      giove: getPlanetData(jd, swisseph.SE_JUPITER),   // ID 5
      saturno: getPlanetData(jd, swisseph.SE_SATURN),  // ID 6
      urano: getPlanetData(jd, swisseph.SE_URANUS),    // ID 7
      nettuno: getPlanetData(jd, swisseph.SE_NEPTUNE), // ID 8
      plutone: getPlanetData(jd, swisseph.SE_PLUTO),   // ID 9
      chirone: getPlanetData(jd, swisseph.SE_CHIRON),  // ID 15
      lilith: getPlanetData(jd, swisseph.SE_MEAN_APOG) // ID 12
    };

    res.json({ jd, pianeti });

  } catch (err) {
    console.error('❌ ERROR:', err);
    res.status(500).json({ errore: err.message || 'Errore server' });
  }
});

// =======================
// 🚀 START
// =======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server attivo su porta ${PORT}`);
});