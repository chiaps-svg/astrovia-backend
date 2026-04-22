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
// 🏠 CALCOLO CASE ASTROLOGICHE (versione corretta con swe_houses)
// =======================
function calcolaCase(jd, lat, lon) {
  try {
    // Usa swe_houses che restituisce tutte le cuspidi in una volta
    const caseData = swisseph.swe_houses(jd, lat, lon, 'P');
    
    if (!caseData || !caseData.cusps) {
      console.log('❌ swe_houses non ha restituito cuspidi');
      return null;
    }
    
    const cuspidi = caseData.cusps;
    
    const segni = [
      'Ariete ♈', 'Toro ♉', 'Gemelli ♊', 'Cancro ♋',
      'Leone ♌', 'Vergine ♍', 'Bilancia ♎', 'Scorpione ♏',
      'Sagittario ♐', 'Capricorno ♑', 'Acquario ♒', 'Pesci ♓'
    ];
    
    function getSegnoGrado(long) {
      const indiceSegno = Math.floor(long / 30);
      const grado = (long % 30).toFixed(2);
      return {
        longitudine: long,
        segno: segni[indiceSegno],
        grado: grado
      };
    }
    
    const ascendenteLong = cuspidi[0];
    const medioCieloLong = cuspidi[9];
    const discendenteLong = (ascendenteLong + 180) % 360;
    const fondoCieloLong = (medioCieloLong + 180) % 360;
    
    return {
      ascendente: getSegnoGrado(ascendenteLong),
      medioCielo: getSegnoGrado(medioCieloLong),
      discendente: getSegnoGrado(discendenteLong),
      fondoCielo: getSegnoGrado(fondoCieloLong),
      cuspidi: cuspidi,
      sistema: 'Placido'
    };
  } catch (e) {
    console.error('Errore calcolo case:', e.message);
    return null;
  }
}

// =======================
// 🔗 CALCOLO ASPETTI PLANETARI
// =======================
function calcolaAspetti(pianeti) {
  const aspetti = [];
  
  // Lista degli aspetti da cercare
  const aspettiLista = [
    { nome: 'Congiunzione', angolo: 0, orb: 8, colore: '#ffffff' },
    { nome: 'Sestile', angolo: 60, orb: 6, colore: '#66ff66' },
    { nome: 'Quadrato', angolo: 90, orb: 8, colore: '#ff6666' },
    { nome: 'Trigono', angolo: 120, orb: 8, colore: '#6666ff' },
    { nome: 'Opposizione', angolo: 180, orb: 8, colore: '#ff3366' }
  ];
  
  // Lista dei pianeti con i loro nomi
  const pianetiLista = [
    { nome: 'sole' },
    { nome: 'luna' },
    { nome: 'mercurio' },
    { nome: 'venere' },
    { nome: 'marte' },
    { nome: 'giove' },
    { nome: 'saturno' },
    { nome: 'urano' },
    { nome: 'nettuno' },
    { nome: 'plutone' },
    { nome: 'chirone' },
    { nome: 'lilith' }
  ];
  
  // Per ogni coppia di pianeti
  for (let i = 0; i < pianetiLista.length; i++) {
    for (let j = i + 1; j < pianetiLista.length; j++) {
      const p1 = pianetiLista[i];
      const p2 = pianetiLista[j];
      
      const p1Data = pianeti[p1.nome];
      const p2Data = pianeti[p2.nome];
      
      if (!p1Data || !p2Data) continue;
      
      const long1 = p1Data.longitudine;
      const long2 = p2Data.longitudine;
      
      // Calcola la differenza angolare
      let diff = Math.abs(long1 - long2);
      if (diff > 180) diff = 360 - diff;
      
      // Controlla ogni tipo di aspetto
      for (const aspetto of aspettiLista) {
        let diffAspetto = Math.abs(diff - aspetto.angolo);
        if (diffAspetto <= aspetto.orb) {
          aspetti.push({
            pianeta1: p1.nome,
            pianeta2: p2.nome,
            aspetto: aspetto.nome,
            angolo: aspetto.angolo,
            orb: diffAspetto.toFixed(2),
            colore: aspetto.colore
          });
        }
      }
    }
  }
  
  return aspetti;
}

// =======================
// 🌌 API
// =======================
app.post('/tema-natale', (req, res) => {

  try {
    const { data, ora, lat, lon } = req.body;

    console.log(`📥 Ricevuta richiesta: data=${data}, ora=${ora}, lat=${lat}, lon=${lon}`);

    if (!data || !ora) {
      return res.status(400).json({ errore: 'Dati mancanti' });
    }

    // 🔥 CORREZIONE: usa SOLO i valori inviati dal frontend
    if (!lat || !lon) {
      console.log(`❌ ERRORE: lat o lon mancanti!`);
      return res.status(400).json({ errore: 'Latitudine e longitudine richieste' });
    }

    const latitudine = parseFloat(lat);
    const longitudine = parseFloat(lon);

    if (isNaN(latitudine) || isNaN(longitudine)) {
      console.log(`❌ ERRORE: lat o lon non validi: lat=${lat}, lon=${lon}`);
      return res.status(400).json({ errore: 'Latitudine o longitudine non valide' });
    }
    
    console.log(`📍 Calcolo con lat=${latitudine}, lon=${longitudine}`);

    const [y, m, d] = data.split('-').map(Number);
    const [h, min] = ora.split(':').map(Number);
    const ut = h + min / 60;

    const jd = swisseph.swe_julday(y, m, d, ut, swisseph.SE_GREG_CAL);

    console.log(`📆 Julian Day calcolato: ${jd}`);

    // =======================
    // 🌟 PIANETI
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
    // 🏠 CASE ASTROLOGICHE
    // =======================
    const caseAstrologiche = calcolaCase(jd, latitudine, longitudine);

    // =======================
    // 🔗 ASPETTI PLANETARI
    // =======================
    const aspetti = calcolaAspetti(pianeti);

    res.json({ 
      jd, 
      pianeti,
      case: caseAstrologiche,
      aspetti: aspetti
    });

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