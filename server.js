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
// 🔧 SAFE CALC
// =======================
function calcPlanet(jd, planet) {
  try {
    if (!planet && planet !== 0) return null;

    const result = swisseph.swe_calc_ut(
      jd,
      planet,
      swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED
    );

    if (!result) return null;

    let longitudine = null;
    
    if (typeof result.longitude === 'number') {
      longitudine = result.longitude;
    } else if (typeof result === 'number') {
      longitudine = result;
    } else if (Array.isArray(result) && result.length > 0) {
      longitudine = result[0];
    }

    return longitudine;

  } catch (e) {
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
// 🏠 CALCOLO CASE ASTROLOGICHE - VERSIONE CON DEBUG
// =======================
function calcolaCase(jd, lat, lon) {
  try {
    console.log(`🏠 Calcolo case con jd=${jd}, lat=${lat}, lon=${lon}`);
    
    const result = swisseph.swe_houses(jd, lat, lon, 'P');
    
    // 🔥 DEBUG: stampa TUTTE le proprietà dell'oggetto result
    console.log(`📊 TUTTE le proprietà di result:`, Object.keys(result));
    
    // 🔥 DEBUG: stampa ascmc se esiste
    if (result.ascmc) {
      console.log(`📊 ascmc: [${result.ascmc.join(', ')}]`);
    } else {
      console.log(`❌ ascmc NON TROVATO!`);
    }
    
    // 🔥 DEBUG: stampa asc e mc se esistono
    if (result.asc !== undefined) console.log(`📊 asc: ${result.asc}`);
    if (result.mc !== undefined) console.log(`📊 mc: ${result.mc}`);
    
    // Ottieni le cuspidi delle case
    let cuspidi = result.house || result.cusps || result.houses;
    
    if (!cuspidi || cuspidi.length < 12) {
      console.log(`❌ Impossibile trovare le cuspidi`);
      return null;
    }
    
    // Determina Ascendente e MC
    let ascendenteLong = null;
    let medioCieloLong = null;
    
    // Prova in ordine: ascmc, poi asc/mc separati, poi fallback cuspidi
    if (result.ascmc && Array.isArray(result.ascmc) && result.ascmc.length >= 2) {
      ascendenteLong = result.ascmc[0];
      medioCieloLong = result.ascmc[1];
      console.log(`✅ Usato ascmc: AC=${ascendenteLong}, MC=${medioCieloLong}`);
    } else if (result.asc !== undefined && result.mc !== undefined) {
      ascendenteLong = result.asc;
      medioCieloLong = result.mc;
      console.log(`✅ Usato asc/mc: AC=${ascendenteLong}, MC=${medioCieloLong}`);
    } else {
      ascendenteLong = cuspidi[0];
      medioCieloLong = cuspidi[9];
      console.log(`⚠️ Fallback cuspidi: AC=${ascendenteLong}, MC=${medioCieloLong}`);
    }
    
    console.log(`📊 ASCENDENTE FINALE: ${ascendenteLong}° -> Segno: ${Math.floor(ascendenteLong / 30)}`);
    
    const discendenteLong = (ascendenteLong + 180) % 360;
    const fondoCieloLong = (medioCieloLong + 180) % 360;
    
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
// 🌙 CALCOLO NODI LUNARI
// =======================
function calcolaNodiLunari(jd) {
  try {
    const nodoNordResult = swisseph.swe_calc_ut(jd, 11, swisseph.SEFLG_SWIEPH);
    
    let nodoNordLong = null;
    let nodoSudLong = null;
    
    if (nodoNordResult && nodoNordResult.longitude !== undefined) {
      nodoNordLong = nodoNordResult.longitude;
      nodoSudLong = (nodoNordLong + 180) % 360;
    }
    
    const segni = [
      'Ariete ♈', 'Toro ♉', 'Gemelli ♊', 'Cancro ♋',
      'Leone ♌', 'Vergine ♍', 'Bilancia ♎', 'Scorpione ♏',
      'Sagittario ♐', 'Capricorno ♑', 'Acquario ♒', 'Pesci ♓'
    ];
    
    function getSegnoGrado(long) {
      if (long === null) return null;
      const indiceSegno = Math.floor(long / 30);
      const grado = (long % 30).toFixed(2);
      return {
        longitudine: long,
        segno: segni[indiceSegno],
        grado: grado
      };
    }
    
    return {
      nodoNord: getSegnoGrado(nodoNordLong),
      nodoSud: getSegnoGrado(nodoSudLong)
    };
  } catch (e) {
    console.error('Errore calcolo Nodi Lunari:', e.message);
    return null;
  }
}

// =======================
// 🔗 CALCOLO ASPETTI PLANETARI
// =======================
function calcolaAspetti(pianeti) {
  const aspetti = [];
  
  const aspettiLista = [
    { nome: 'Congiunzione', angolo: 0, orb: 8, colore: '#ffffff' },
    { nome: 'Sestile', angolo: 60, orb: 6, colore: '#66ff66' },
    { nome: 'Quadrato', angolo: 90, orb: 8, colore: '#ff6666' },
    { nome: 'Trigono', angolo: 120, orb: 8, colore: '#6666ff' },
    { nome: 'Opposizione', angolo: 180, orb: 8, colore: '#ff3366' }
  ];
  
  const pianetiLista = [
    'sole', 'luna', 'mercurio', 'venere', 'marte',
    'giove', 'saturno', 'urano', 'nettuno', 'plutone', 'chirone', 'lilith'
  ];
  
  for (let i = 0; i < pianetiLista.length; i++) {
    for (let j = i + 1; j < pianetiLista.length; j++) {
      const p1 = pianetiLista[i];
      const p2 = pianetiLista[j];
      
      const p1Data = pianeti[p1];
      const p2Data = pianeti[p2];
      
      if (!p1Data || !p2Data) continue;
      
      const long1 = p1Data.longitudine;
      const long2 = p2Data.longitudine;
      
      let diff = Math.abs(long1 - long2);
      if (diff > 180) diff = 360 - diff;
      
      for (const aspetto of aspettiLista) {
        let diffAspetto = Math.abs(diff - aspetto.angolo);
        if (diffAspetto <= aspetto.orb) {
          aspetti.push({
            pianeta1: p1,
            pianeta2: p2,
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

    if (!lat || !lon) {
      return res.status(400).json({ errore: 'Latitudine e longitudine richieste' });
    }

    const latitudine = parseFloat(lat);
    const longitudine = parseFloat(lon);

    if (isNaN(latitudine) || isNaN(longitudine)) {
      return res.status(400).json({ errore: 'Latitudine o longitudine non valide' });
    }
    
    // 🔥 CORREZIONE FUSO ORARIO: sottrai 1 ora per l'Italia (CET)
    // L'ora inserita dall'utente è locale italiana, ma Swiss Ephemeris vuole UT/GMT
    const [y, m, d] = data.split('-').map(Number);
    let [h, min] = ora.split(':').map(Number);
    
    // Sottrai 1 ora per il fuso orario italiano (CET)
    let ut = h + min / 60 - 1;
    // Gestisci il cambio di giorno se l'ora diventa negativa
    let giornoJD = d;
    if (ut < 0) {
      ut += 24;
      giornoJD--;
    }
    
    console.log(`📅 Ora locale: ${h}:${min} -> UT: ${ut.toFixed(2)}`);

    const jd = swisseph.swe_julday(y, m, giornoJD, ut, swisseph.SE_GREG_CAL);

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

    const caseAstrologiche = calcolaCase(jd, latitudine, longitudine);
    const aspetti = calcolaAspetti(pianeti);
    const nodiLunari = calcolaNodiLunari(jd);

    res.json({ 
      jd, 
      pianeti,
      case: caseAstrologiche,
      aspetti: aspetti,
      nodi: nodiLunari
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