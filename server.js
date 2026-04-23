const express = require('express');
const swisseph = require('swisseph');
const fs = require('fs');

console.log('🔍 DIRECTORY CORRENTE:', __dirname);
console.log('🔍 La cartella ./ephe esiste?', fs.existsSync('./ephe'));

if (fs.existsSync('./ephe')) {
  console.log('🔍 Contenuto di ./ephe:', fs.readdirSync('./ephe'));
  swisseph.swe_set_ephe_path('./ephe');
  console.log('✅ Percorso impostato su ./ephe');
  
  // =======================
  // 🔥 FORZA L'USO DEL FILE swe_deltat.txt
  // =======================
  try {
    // Verifica se il file esiste
    const deltaTFile = './ephe/swe_deltat.txt';
    if (fs.existsSync(deltaTFile)) {
      console.log('✅ File swe_deltat.txt trovato');
      
      // Se disponibile, forza l'uso del file
      if (typeof swisseph.swe_set_delta_t_userdef === 'function') {
        swisseph.swe_set_delta_t_userdef(1);
        console.log('✅ Uso forzato di swe_deltat.txt');
      } else {
        console.log('⚠️ swe_set_delta_t_userdef non disponibile in questa versione');
      }
    } else {
      console.log('⚠️ File swe_deltat.txt non trovato nella cartella ephe');
    }
  } catch(e) {
    console.log('⚠️ Errore configurazione Delta T:', e.message);
  }
  
} else {
  console.log('❌ NESSUN PERCORSO TROVATO!');
}

// =======================
// ⚙️ CONFIGURAZIONE PRECISIONE MASSIMA (DE431)
// =======================
if (typeof swisseph.swe_set_tid_acc === 'function') {
    swisseph.swe_set_tid_acc(-26.0);
    console.log('✅ Precisione massima attivata (modello DE431)');
} else {
    console.log('⚠️ Configurazione precisione non disponibile');
}

const app = express();

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

app.get('/', (req, res) => res.send('Backend Astrovia funzionante 🚀'));
app.get('/ping', (req, res) => res.send('OK'));

// =======================
// 🔗 CALCOLO ASPETTI PLANETARI
// =======================
function calcolaAspetti(pianeti) {
  const aspetti = [];
  
  const aspettiLista = [
    { nome: 'Congiunzione ♌', angolo: 0, orb: 8, colore: '#ffffff' },
    { nome: 'Sestile ⚹', angolo: 60, orb: 6, colore: '#66ff66' },
    { nome: 'Quadrato □', angolo: 90, orb: 8, colore: '#ff6666' },
    { nome: 'Trigono △', angolo: 120, orb: 8, colore: '#6666ff' },
    { nome: 'Opposizione ☍', angolo: 180, orb: 8, colore: '#ff3366' }
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
// 🌌 API - CONVERSIONE MANUALE PRECISA
// =======================
app.post('/tema-natale', (req, res) => {
  console.log('\n🔥 RICHIESTA RICEVUTA');
  
  try {
    const { data, ora, lat, lon } = req.body;
    console.log(`📥 ${data} ${ora} ${lat} ${lon}`);

    if (!data || !ora || !lat || !lon) {
      return res.status(400).json({ errore: 'Parametri mancanti' });
    }

    // =======================
    // 🔥 CONVERSIONE ORA ITALIANA -> UT
    // Per l'Italia: CET = UTC+1 (sottrai 1 ora)
    // =======================
    const [y, m, d] = data.split('-').map(Number);
    let [h, min] = ora.split(':').map(Number);
    
    // Calcola l'ora UT sottraendo 1 ora (per l'Italia CET)
    let oraUt = h + min / 60 - 1;
    console.log(`🔍 Verifica: ora italiana ${h}:${min} -> UT=${oraUt.toFixed(6)}`);
    let giornoJD = d;
    let meseJD = m;
    let annoJD = y;

        
    // Gestisci il cambio di giorno
    if (oraUt < 0) {
      oraUt += 24;
      giornoJD--;
      
      if (giornoJD < 1) {
        const giorniMese = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        const isLeap = (y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0);
        if (isLeap) giorniMese[1] = 29;
        
        meseJD--;
        if (meseJD < 1) {
          meseJD = 12;
          annoJD--;
        }
        giornoJD = giorniMese[meseJD - 1];
      }
    }
    
    console.log(`📅 Ora italiana: ${h}:${min} (CET UTC+1) -> UT: ${oraUt.toFixed(6)}`);
    console.log(`📅 Data UT: ${annoJD}-${meseJD}-${giornoJD}`);
    
    // Calcola Julian Day
    const jd = swisseph.swe_julday(annoJD, meseJD, giornoJD, oraUt, swisseph.SE_GREG_CAL);
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    
    console.log(`📆 Julian Day (UT): ${jd.toFixed(8)}`);
    
    const segni = ['Ariete ♈', 'Toro ♉', 'Gemelli ♊', 'Cancro ♋', 'Leone ♌', 'Vergine ♍', 'Bilancia ♎', 'Scorpione ♏', 'Sagittario ♐', 'Capricorno ♑', 'Acquario ♒', 'Pesci ♓'];
    
    function getSegnoGrado(long) {
      if (long === undefined || long === null) return null;
      const indiceSegno = Math.floor(long / 30);
      const grado = (long % 30).toFixed(2);
      return {
        longitudine: long,
        segno: segni[indiceSegno],
        grado: grado
      };
    }
    
    // =======================
    // 1. CALCOLO CASE E CARDINI
    // =======================
    const houses = swisseph.swe_houses(jd, latNum, lonNum, 'P');
    const cuspidi = houses.house;
    const ascendenteLong = houses.ascmc ? houses.ascmc[0] : cuspidi[0];
    const medioCieloLong = houses.ascmc ? houses.ascmc[1] : cuspidi[9];
    
    console.log(`📊 Ascendente: ${ascendenteLong.toFixed(4)}° -> ${segni[Math.floor(ascendenteLong / 30)]} ${(ascendenteLong % 30).toFixed(2)}°`);
    
    const caseAstrologiche = {
      ascendente: getSegnoGrado(ascendenteLong),
      medioCielo: getSegnoGrado(medioCieloLong),
      discendente: getSegnoGrado((ascendenteLong + 180) % 360),
      fondoCielo: getSegnoGrado((medioCieloLong + 180) % 360),
      cuspidi: cuspidi,
      sistema: 'Placido'
    };
    
    // =======================
    // 2. CALCOLO PIANETI
    // =======================
    function calcPlanet(id, nome) {
      try {
        const result = swisseph.swe_calc_ut(jd, id, swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED);
        if (result && result.longitude !== undefined) {
          const long = result.longitude;
          console.log(`✅ ${nome}: ${long.toFixed(4)}°`);
          return getSegnoGrado(long);
        }
      } catch(e) {
        console.log(`❌ ${nome}: errore - ${e.message}`);
      }
      return null;
    }
    
    const pianeti = {
      sole: calcPlanet(swisseph.SE_SUN, 'Sole'),
      luna: calcPlanet(swisseph.SE_MOON, 'Luna'),
      mercurio: calcPlanet(swisseph.SE_MERCURY, 'Mercurio'),
      venere: calcPlanet(swisseph.SE_VENUS, 'Venere'),
      marte: calcPlanet(swisseph.SE_MARS, 'Marte'),
      giove: calcPlanet(swisseph.SE_JUPITER, 'Giove'),
      saturno: calcPlanet(swisseph.SE_SATURN, 'Saturno'),
      urano: calcPlanet(swisseph.SE_URANUS, 'Urano'),
      nettuno: calcPlanet(swisseph.SE_NEPTUNE, 'Nettuno'),
      plutone: calcPlanet(swisseph.SE_PLUTO, 'Plutone'),
      chirone: calcPlanet(swisseph.SE_CHIRON, 'Chirone'),
      lilith: calcPlanet(swisseph.SE_MEAN_APOG, 'Lilith')
    };
    
    // =======================
    // 3. CALCOLO NODI LUNARI
    // =======================
    let nodiLunari = null;
    try {
      const nodoNordResult = swisseph.swe_calc_ut(jd, 11, swisseph.SEFLG_SWIEPH);
      if (nodoNordResult && nodoNordResult.longitude !== undefined) {
        const nodoNordLong = nodoNordResult.longitude;
        nodiLunari = {
          nodoNord: getSegnoGrado(nodoNordLong),
          nodoSud: getSegnoGrado((nodoNordLong + 180) % 360)
        };
      }
    } catch(e) {
      console.log('❌ Nodi Lunari: errore');
    }
    
    // =======================
    // 4. CALCOLO ASPETTI
    // =======================
    const aspetti = calcolaAspetti(pianeti);
    console.log(`🔗 Trovati ${aspetti.length} aspetti planetari`);
    
    console.log('📤 INVIO RISPOSTA AL FRONTEND');
    
    res.json({ 
      jd: jd,
      pianeti: pianeti,
      case: caseAstrologiche,
      aspetti: aspetti,
      nodi: nodiLunari
    });
    
  } catch (err) {
    console.error('❌ ERRORE GENERALE:', err.message);
    console.error(err.stack);
    res.status(500).json({ errore: err.message || 'Errore server' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server su porta ${PORT}`));