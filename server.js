const express = require('express');
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

// =======================
// 🔥 MIDDLEWARE CORS
// =======================
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

app.use(express.json());

// =======================
// 🔵 TEST
// =======================
app.get('/', (req, res) => {
  res.send('Backend Astrovia funzionante 🚀');
});

app.get('/ping', (req, res) => {
  res.send('OK');
});

// =======================
// 🔧 CALCOLO SINGOLO PIANETA (VERSIONE ROBUSTA)
// =======================
function calcPlanet(jdUt, planet) {
  try {
    const result = swisseph.swe_calc_ut(jdUt, planet, swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED);
    if (!result) return null;
    
    // Estrae la longitudine in modo robusto
    if (typeof result.longitude === 'number') return result.longitude;
    if (typeof result === 'number') return result;
    if (Array.isArray(result) && result.length > 0) return result[0];
    
    return null;
  } catch (e) {
    console.error(`Errore pianeta ${planet}:`, e.message);
    return null;
  }
}

// =======================
// 🌟 CONVERTE LONGITUDINE IN SEGNO + GRADO
// =======================
function getPlanetData(jd, planet, nomePianeta) {
  const long = calcPlanet(jd, planet);
  if (long === null) {
    console.log(`⚠️ ${nomePianeta} -> null`);
    return null;
  }
  
  const segni = ['Ariete ♈', 'Toro ♉', 'Gemelli ♊', 'Cancro ♋', 'Leone ♌', 'Vergine ♍', 'Bilancia ♎', 'Scorpione ♏', 'Sagittario ♐', 'Capricorno ♑', 'Acquario ♒', 'Pesci ♓'];
  const indiceSegno = Math.floor(long / 30);
  const gradoNelSegno = (long % 30).toFixed(2);
  
  console.log(`✅ ${nomePianeta}: ${long}° -> ${segni[indiceSegno]} ${gradoNelSegno}°`);
  
  return {
    longitudine: long,
    segno: segni[indiceSegno],
    grado: gradoNelSegno
  };
}

// =======================
// 🏠 CALCOLO CASE
// =======================
function calcolaCase(jd, lat, lon) {
  try {
    const result = swisseph.swe_houses(jd, lat, lon, 'P');
    let cuspidi = result.house || result.cusps || result.houses;
    if (!cuspidi || cuspidi.length < 12) return null;
    
    let ascendenteLong = result.ascmc ? result.ascmc[0] : cuspidi[0];
    let medioCieloLong = result.ascmc ? result.ascmc[1] : cuspidi[9];
    
    const segni = ['Ariete ♈', 'Toro ♉', 'Gemelli ♊', 'Cancro ♋', 'Leone ♌', 'Vergine ♍', 'Bilancia ♎', 'Scorpione ♏', 'Sagittario ♐', 'Capricorno ♑', 'Acquario ♒', 'Pesci ♓'];
    const getSegnoGrado = (long) => ({ longitudine: long, segno: segni[Math.floor(long / 30)], grado: (long % 30).toFixed(2) });
    
    return {
      ascendente: getSegnoGrado(ascendenteLong),
      medioCielo: getSegnoGrado(medioCieloLong),
      discendente: getSegnoGrado((ascendenteLong + 180) % 360),
      fondoCielo: getSegnoGrado((medioCieloLong + 180) % 360),
      cuspidi: cuspidi,
      sistema: 'Placido'
    };
  } catch (e) {
    console.error('Errore case:', e.message);
    return null;
  }
}

// =======================
// 🌌 API PRINCIPALE
// =======================
app.post('/tema-natale', (req, res) => {
  console.log('\n🔥🔥🔥 NUOVA RICHIESTA 🔥🔥🔥');
  
  try {
    const { data, ora, lat, lon } = req.body;
    console.log(`📥 Ricevuti: data=${data}, ora=${ora}, lat=${lat}, lon=${lon}`);

    if (!data || !ora || !lat || !lon) {
      return res.status(400).json({ errore: 'Parametri mancanti' });
    }

    const latitudine = parseFloat(lat);
    const longitudine = parseFloat(lon);
    if (isNaN(latitudine) || isNaN(longitudine)) {
      return res.status(400).json({ errore: 'Latitudine/longitudine non valide' });
    }
    
    // =======================
    // CONVERSIONE TEMPO
    // =======================
    const [y, m, d] = data.split('-').map(Number);
    let [h, min] = ora.split(':').map(Number);
    const timezone = 1;
    const utc = swisseph.swe_utc_time_zone(y, m, d, h, min, 0, timezone);
    const jd = swisseph.swe_utc_to_jd(utc.year, utc.month, utc.day, utc.hour, utc.min, utc.sec, 1);
    const jdUt = jd[0];
    console.log(`📆 JD: ${jdUt}`);

    // =======================
    // CALCOLO PIANETI
    // =======================
    const pianeti = {
      sole: getPlanetData(jdUt, swisseph.SE_SUN, 'Sole'),
      luna: getPlanetData(jdUt, swisseph.SE_MOON, 'Luna'),
      mercurio: getPlanetData(jdUt, swisseph.SE_MERCURY, 'Mercurio'),
      venere: getPlanetData(jdUt, swisseph.SE_VENUS, 'Venere'),
      marte: getPlanetData(jdUt, swisseph.SE_MARS, 'Marte'),
      giove: getPlanetData(jdUt, swisseph.SE_JUPITER, 'Giove'),
      saturno: getPlanetData(jdUt, swisseph.SE_SATURN, 'Saturno'),
      urano: getPlanetData(jdUt, swisseph.SE_URANUS, 'Urano'),
      nettuno: getPlanetData(jdUt, swisseph.SE_NEPTUNE, 'Nettuno'),
      plutone: getPlanetData(jdUt, swisseph.SE_PLUTO, 'Plutone'),
      chirone: getPlanetData(jdUt, swisseph.SE_CHIRON, 'Chirone'),
      lilith: getPlanetData(jdUt, swisseph.SE_MEAN_APOG, 'Lilith')
    };

    // =======================
    // CALCOLO CASE
    // =======================
    const caseAstrologiche = calcolaCase(jdUt, latitudine, longitudine);
    
    // =======================
    // CALCOLO ASPETTI (semplificato per test)
    // =======================
    const aspetti = [];

    console.log('📤 INVIO RISPOSTA');
    res.json({ 
      jd: jdUt, 
      pianeti,
      case: caseAstrologiche,
      aspetti: aspetti,
      nodi: null
    });

  } catch (err) {
    console.error('❌ ERRORE:', err.message);
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