const express = require('express');
const swisseph = require('swisseph');
const fs = require('fs');

// Importa le frasi per le previsioni
let frasiAspetti, consigliPositivi, consigliNegativi, consigliNeutri;
try {
  const frasiModule = require('./data/frasi-previsioni');
  frasiAspetti = frasiModule.frasiAspetti;
  consigliPositivi = frasiModule.consigliPositivi;
  consigliNegativi = frasiModule.consigliNegativi;
  consigliNeutri = frasiModule.consigliNeutri;
  console.log('✅ File frasi-previsioni.js caricato');
} catch(e) {
  console.log('⚠️ File frasi-previsioni.js non trovato, uso frasi di default');
  frasiAspetti = {};
  consigliPositivi = ["✨ Le stelle oggi sono allineate per te."];
  consigliNegativi = ["⚠️ Giornata potenzialmente complessa."];
  consigliNeutri = ["⚖️ Giornata equilibrata."];
}

console.log('🔍 DIRECTORY CORRENTE:', __dirname);
console.log('🔍 La cartella ./ephe esiste?', fs.existsSync('./ephe'));

if (fs.existsSync('./ephe')) {
  console.log('🔍 Contenuto di ./ephe:', fs.readdirSync('./ephe'));
  swisseph.swe_set_ephe_path('./ephe');
  console.log('✅ Percorso impostato su ./ephe');
  
  try {
    const deltaTFile = './ephe/swe_deltat.txt';
    if (fs.existsSync(deltaTFile)) {
      console.log('✅ File swe_deltat.txt trovato');
    } else {
      console.log('⚠️ File swe_deltat.txt non trovato nella cartella ephe');
    }
  } catch(e) {
    console.log('⚠️ Errore verifica Delta T:', e.message);
  }
  
} else {
  console.log('❌ NESSUN PERCORSO TROVATO!');
}

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
// 🔧 CALCOLO PRECISO
// =======================
function calcPlanet(id, nome, jdUt) {
  try {
    if (!id && id !== 0) return null;
    
    let deltaT = swisseph.swe_deltat(jdUt);
    if (typeof deltaT === 'object' && deltaT !== null) {
        deltaT = deltaT.delta_t || deltaT.deltat || 0;
    }
    
    const jdTT = jdUt + deltaT;
    const result = swisseph.swe_calc(jdTT, id, swisseph.SEFLG_SWIEPH | swisseph.SEFLG_SPEED);
    
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
// 📍 FUNZIONE PER CALCOLARE L'ASCENDENTE
// =======================
function calcolaAscendente(jdUt, latNum, lonNum) {
  const houses = swisseph.swe_houses(jdUt, latNum, lonNum, 'P');
  const ascendenteLong = houses.ascmc ? houses.ascmc[0] : houses.house[0];
  return ascendenteLong;
}

// =======================
// 🔮 FUNZIONE PER GENERARE TESTO ASPETTO (SENZA RIPETIZIONI)
// =======================
const frasiUsateNelProfilo = [];

function generaTestoAspetto(aspetto, pianetaNatale, segnoNatale, pianetaTransito, segnoTransito) {
  const categoria = frasiAspetti[aspetto] || frasiAspetti['Sestile'] || {};
  const listaFrasi = categoria[pianetaNatale] || categoria['default'] || [
    "{pianetaNatale} in {segnoNatale} è in {aspetto} con {pianetaTransito} in {segnoTransito}."
  ];
  
  let frasiDisponibili = listaFrasi.filter(f => !frasiUsateNelProfilo.includes(f));
  
  if (frasiDisponibili.length === 0) {
    frasiDisponibili = [...listaFrasi];
    frasiUsateNelProfilo.length = 0;
  }
  
  const template = frasiDisponibili[Math.floor(Math.random() * frasiDisponibili.length)];
  frasiUsateNelProfilo.push(template);
  
  return template
    .replace(/{pianetaNatale}/g, pianetaNatale.charAt(0).toUpperCase() + pianetaNatale.slice(1))
    .replace(/{segnoNatale}/g, segnoNatale)
    .replace(/{pianetaTransito}/g, pianetaTransito.charAt(0).toUpperCase() + pianetaTransito.slice(1))
    .replace(/{segnoTransito}/g, segnoTransito)
    .replace(/{aspetto}/g, aspetto.toLowerCase());
}

// =======================
// 🌌 API - TEMA NATALE
// =======================
app.post('/tema-natale', (req, res) => {
  console.log('\n🔥 RICHIESTA TEMA NATALE');
  
  try {
    const { data, ora, lat, lon } = req.body;
    console.log(`📥 ${data} ${ora} ${lat} ${lon}`);

    if (!data || !ora || !lat || !lon) {
      return res.status(400).json({ errore: 'Parametri mancanti' });
    }

    const [y, m, d] = data.split('-').map(Number);
    let [h, min] = ora.split(':').map(Number);
    
    let oraUt = h + min / 60 - 1;
    let giornoJD = d;
    let meseJD = m;
    let annoJD = y;
    
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
    
    const jdUt = swisseph.swe_julday(annoJD, meseJD, giornoJD, oraUt, swisseph.SE_GREG_CAL);
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    
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
    
    const houses = swisseph.swe_houses(jdUt, latNum, lonNum, 'P');
    const cuspidi = houses.house;
    const ascendenteLong = houses.ascmc ? houses.ascmc[0] : cuspidi[0];
    const medioCieloLong = houses.ascmc ? houses.ascmc[1] : cuspidi[9];
    
    const caseAstrologiche = {
      ascendente: getSegnoGrado(ascendenteLong),
      medioCielo: getSegnoGrado(medioCieloLong),
      discendente: getSegnoGrado((ascendenteLong + 180) % 360),
      fondoCielo: getSegnoGrado((medioCieloLong + 180) % 360),
      cuspidi: cuspidi,
      sistema: 'Placido'
    };
    
    const pianeti = {
      sole: getSegnoGrado(calcPlanet(swisseph.SE_SUN, 'Sole', jdUt)),
      luna: getSegnoGrado(calcPlanet(swisseph.SE_MOON, 'Luna', jdUt)),
      mercurio: getSegnoGrado(calcPlanet(swisseph.SE_MERCURY, 'Mercurio', jdUt)),
      venere: getSegnoGrado(calcPlanet(swisseph.SE_VENUS, 'Venere', jdUt)),
      marte: getSegnoGrado(calcPlanet(swisseph.SE_MARS, 'Marte', jdUt)),
      giove: getSegnoGrado(calcPlanet(swisseph.SE_JUPITER, 'Giove', jdUt)),
      saturno: getSegnoGrado(calcPlanet(swisseph.SE_SATURN, 'Saturno', jdUt)),
      urano: getSegnoGrado(calcPlanet(swisseph.SE_URANUS, 'Urano', jdUt)),
      nettuno: getSegnoGrado(calcPlanet(swisseph.SE_NEPTUNE, 'Nettuno', jdUt)),
      plutone: getSegnoGrado(calcPlanet(swisseph.SE_PLUTO, 'Plutone', jdUt)),
      chirone: getSegnoGrado(calcPlanet(swisseph.SE_CHIRON, 'Chirone', jdUt)),
      lilith: getSegnoGrado(calcPlanet(swisseph.SE_MEAN_APOG, 'Lilith', jdUt))
    };
    
    let nodiLunari = null;
    try {
      const nodoNordLong = calcPlanet(11, 'Nodo Nord', jdUt);
      if (nodoNordLong !== null && !isNaN(nodoNordLong)) {
        nodiLunari = {
          nodoNord: getSegnoGrado(nodoNordLong),
          nodoSud: getSegnoGrado((nodoNordLong + 180) % 360)
        };
      }
    } catch(e) {}
    
    const aspetti = calcolaAspetti(pianeti);
    
    res.json({ 
      jd: jdUt,
      pianeti: pianeti,
      case: caseAstrologiche,
      aspetti: aspetti,
      nodi: nodiLunari
    });
    
  } catch (err) {
    console.error('❌ ERRORE GENERALE:', err.message);
    res.status(500).json({ errore: err.message || 'Errore server' });
  }
});

// =======================
// 🌟 API - ASCENDENTE
// =======================
app.post('/ascendente', (req, res) => {
  console.log('\n🔥 RICHIESTA ASCENDENTE');
  
  try {
    const { data, ora, lat, lon } = req.body;
    console.log(`📥 ${data} ${ora} ${lat} ${lon}`);

    if (!data || !ora || !lat || !lon) {
      return res.status(400).json({ errore: 'Parametri mancanti' });
    }

    const [y, m, d] = data.split('-').map(Number);
    let [h, min] = ora.split(':').map(Number);
    
    let oraUt = h + min / 60 - 1;
    let giornoJD = d;
    let meseJD = m;
    let annoJD = y;
    
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
    
    const jdUt = swisseph.swe_julday(annoJD, meseJD, giornoJD, oraUt, swisseph.SE_GREG_CAL);
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    
    const ascendenteLong = calcolaAscendente(jdUt, latNum, lonNum);
    
    const segni = ['Ariete', 'Toro', 'Gemelli', 'Cancro', 'Leone', 'Vergine', 'Bilancia', 'Scorpione', 'Sagittario', 'Capricorno', 'Acquario', 'Pesci'];
    const segnoIndex = Math.floor(ascendenteLong / 30);
    const grado = (ascendenteLong % 30).toFixed(2);
    
    res.json({ 
      segno: segni[segnoIndex],
      grado: grado,
      longitudine: ascendenteLong
    });
    
  } catch (err) {
    console.error('❌ ERRORE ASCENDENTE:', err.message);
    res.status(500).json({ errore: err.message || 'Errore server' });
  }
});

// =======================
// 🔮 API - PREVISIONI
// =======================
app.post('/previsioni', (req, res) => {
  console.log('\n🔥 RICHIESTA PREVISIONI');
  
  frasiUsateNelProfilo.length = 0;
  
  try {
    const { data, ora, lat, lon, dataPrevisione } = req.body;
    console.log(`📥 Nascita: ${data} ${ora} ${lat} ${lon}`);
    console.log(`📥 Data previsione: ${dataPrevisione}`);

    if (!data || !ora || !lat || !lon || !dataPrevisione) {
      return res.status(400).json({ errore: 'Parametri mancanti' });
    }

    const [y, m, d] = data.split('-').map(Number);
    let [h, min] = ora.split(':').map(Number);
    
    let oraUt = h + min / 60 - 1;
    let giornoJD = d;
    let meseJD = m;
    let annoJD = y;
    
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
    
    const jdUtNascita = swisseph.swe_julday(annoJD, meseJD, giornoJD, oraUt, swisseph.SE_GREG_CAL);
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    
    const [y2, m2, d2] = dataPrevisione.split('T')[0].split('-').map(Number);
    const oraPrevisioneUt = 12;
    const jdUtPrevisione = swisseph.swe_julday(y2, m2, d2, oraPrevisioneUt, swisseph.SE_GREG_CAL);
    
    function getPosizionePianeta(id, jdUt) {
      let deltaT = swisseph.swe_deltat(jdUt);
      if (typeof deltaT === 'object' && deltaT !== null) {
        deltaT = deltaT.delta_t || deltaT.deltat || 0;
      }
      const jdTT = jdUt + deltaT;
      const result = swisseph.swe_calc(jdTT, id, swisseph.SEFLG_SWIEPH);
      return result ? result.longitude : null;
    }
    
    const pianetiNatali = {
      sole: calcPlanet(swisseph.SE_SUN, 'Sole', jdUtNascita),
      luna: calcPlanet(swisseph.SE_MOON, 'Luna', jdUtNascita),
      mercurio: calcPlanet(swisseph.SE_MERCURY, 'Mercurio', jdUtNascita),
      venere: calcPlanet(swisseph.SE_VENUS, 'Venere', jdUtNascita),
      marte: calcPlanet(swisseph.SE_MARS, 'Marte', jdUtNascita),
      giove: calcPlanet(swisseph.SE_JUPITER, 'Giove', jdUtNascita),
      saturno: calcPlanet(swisseph.SE_SATURN, 'Saturno', jdUtNascita),
      urano: calcPlanet(swisseph.SE_URANUS, 'Urano', jdUtNascita),
      nettuno: calcPlanet(swisseph.SE_NEPTUNE, 'Nettuno', jdUtNascita),
      plutone: calcPlanet(swisseph.SE_PLUTO, 'Plutone', jdUtNascita)
    };
    
    const pianetiPrevisione = {
      sole: getPosizionePianeta(swisseph.SE_SUN, jdUtPrevisione),
      luna: getPosizionePianeta(swisseph.SE_MOON, jdUtPrevisione),
      mercurio: getPosizionePianeta(swisseph.SE_MERCURY, jdUtPrevisione),
      venere: getPosizionePianeta(swisseph.SE_VENUS, jdUtPrevisione),
      marte: getPosizionePianeta(swisseph.SE_MARS, jdUtPrevisione),
      giove: getPosizionePianeta(swisseph.SE_JUPITER, jdUtPrevisione),
      saturno: getPosizionePianeta(swisseph.SE_SATURN, jdUtPrevisione),
      urano: getPosizionePianeta(swisseph.SE_URANUS, jdUtPrevisione),
      nettuno: getPosizionePianeta(swisseph.SE_NEPTUNE, jdUtPrevisione),
      plutone: getPosizionePianeta(swisseph.SE_PLUTO, jdUtPrevisione)
    };
    
    const aspettiPrevisioni = [];
    
    for (const [nomeNatale, longNatale] of Object.entries(pianetiNatali)) {
      for (const [nomeTransito, longTransito] of Object.entries(pianetiPrevisione)) {
        if (longNatale === null || longTransito === null) continue;
        
        let diff = Math.abs(longNatale - longTransito);
        if (diff > 180) diff = 360 - diff;
        
        if (diff < 8) {
          aspettiPrevisioni.push({
            pianetaNatale: nomeNatale,
            pianetaTransito: nomeTransito,
            aspetto: 'Congiunzione',
            orb: diff.toFixed(2)
          });
        } else if (Math.abs(diff - 60) < 6) {
          aspettiPrevisioni.push({
            pianetaNatale: nomeNatale,
            pianetaTransito: nomeTransito,
            aspetto: 'Sestile',
            orb: Math.abs(diff - 60).toFixed(2)
          });
        } else if (Math.abs(diff - 90) < 8) {
          aspettiPrevisioni.push({
            pianetaNatale: nomeNatale,
            pianetaTransito: nomeTransito,
            aspetto: 'Quadrato',
            orb: Math.abs(diff - 90).toFixed(2)
          });
        } else if (Math.abs(diff - 120) < 8) {
          aspettiPrevisioni.push({
            pianetaNatale: nomeNatale,
            pianetaTransito: nomeTransito,
            aspetto: 'Trigono',
            orb: Math.abs(diff - 120).toFixed(2)
          });
        } else if (Math.abs(diff - 180) < 8) {
          aspettiPrevisioni.push({
            pianetaNatale: nomeNatale,
            pianetaTransito: nomeTransito,
            aspetto: 'Opposizione',
            orb: Math.abs(diff - 180).toFixed(2)
          });
        }
      }
    }
    
    const segni = ['Ariete', 'Toro', 'Gemelli', 'Cancro', 'Leone', 'Vergine', 'Bilancia', 'Scorpione', 'Sagittario', 'Capricorno', 'Acquario', 'Pesci'];
    
    const aspettiTesto = [];
    for (const a of aspettiPrevisioni) {
      const segnoNatale = segni[Math.floor(pianetiNatali[a.pianetaNatale] / 30)];
      const segnoTransito = segni[Math.floor(pianetiPrevisione[a.pianetaTransito] / 30)];
      
      const testo = generaTestoAspetto(
        a.aspetto,
        a.pianetaNatale,
        segnoNatale,
        a.pianetaTransito,
        segnoTransito
      );
      
      aspettiTesto.push({ testo: testo });
    }
    
    const aspettiFinali = aspettiTesto.slice(0, 5);
    
    const aspettiPositivi = aspettiPrevisioni.filter(a => a.aspetto === 'Trigono' || a.aspetto === 'Sestile');
    const aspettiNegativi = aspettiPrevisioni.filter(a => a.aspetto === 'Quadrato' || a.aspetto === 'Opposizione');
    
    let consiglio = '';
    if (aspettiPositivi.length > aspettiNegativi.length) {
      consiglio = consigliPositivi[Math.floor(Math.random() * consigliPositivi.length)];
    } else if (aspettiNegativi.length > aspettiPositivi.length) {
      consiglio = consigliNegativi[Math.floor(Math.random() * consigliNegativi.length)];
    } else {
      consiglio = consigliNeutri[Math.floor(Math.random() * consigliNeutri.length)];
    }
    
    console.log(`🔗 Trovati ${aspettiPrevisioni.length} aspetti di transito`);
    
    res.json({
      aspetti: aspettiFinali,
      consiglio: consiglio,
      dataPrevisione: dataPrevisione
    });
    
  } catch (err) {
    console.error('❌ ERRORE PREVISIONI:', err.message);
    res.status(500).json({ errore: err.message || 'Errore server' });
  }
});

// =======================
// 🪐 API - TRANSITI
// =======================
app.post('/transiti', (req, res) => {
  console.log('\n🔥 RICHIESTA TRANSITI');
  
  try {
    const { data, ora, lat, lon, dataTransito } = req.body;
    console.log(`📥 Nascita: ${data} ${ora} ${lat} ${lon}`);
    console.log(`📥 Data transito: ${dataTransito}`);

    if (!data || !ora || !lat || !lon || !dataTransito) {
      return res.status(400).json({ errore: 'Parametri mancanti' });
    }

    const [y, m, d] = data.split('-').map(Number);
    let [h, min] = ora.split(':').map(Number);
    
    let oraUt = h + min / 60 - 1;
    let giornoJD = d;
    let meseJD = m;
    let annoJD = y;
    
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
    
    const jdUtNascita = swisseph.swe_julday(annoJD, meseJD, giornoJD, oraUt, swisseph.SE_GREG_CAL);
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    
    const [y2, m2, d2] = dataTransito.split('-').map(Number);
    const oraTransitoUt = 12;
    const jdUtTransito = swisseph.swe_julday(y2, m2, d2, oraTransitoUt, swisseph.SE_GREG_CAL);
    
    function getPosizionePianeta(id, jdUt) {
      let deltaT = swisseph.swe_deltat(jdUt);
      if (typeof deltaT === 'object' && deltaT !== null) {
        deltaT = deltaT.delta_t || deltaT.deltat || 0;
      }
      const jdTT = jdUt + deltaT;
      const result = swisseph.swe_calc(jdTT, id, swisseph.SEFLG_SWIEPH);
      return result ? result.longitude : null;
    }
    
    const pianetiNatali = {
      sole: calcPlanet(swisseph.SE_SUN, 'Sole', jdUtNascita),
      luna: calcPlanet(swisseph.SE_MOON, 'Luna', jdUtNascita),
      mercurio: calcPlanet(swisseph.SE_MERCURY, 'Mercurio', jdUtNascita),
      venere: calcPlanet(swisseph.SE_VENUS, 'Venere', jdUtNascita),
      marte: calcPlanet(swisseph.SE_MARS, 'Marte', jdUtNascita),
      giove: calcPlanet(swisseph.SE_JUPITER, 'Giove', jdUtNascita),
      saturno: calcPlanet(swisseph.SE_SATURN, 'Saturno', jdUtNascita),
      urano: calcPlanet(swisseph.SE_URANUS, 'Urano', jdUtNascita),
      nettuno: calcPlanet(swisseph.SE_NEPTUNE, 'Nettuno', jdUtNascita),
      plutone: calcPlanet(swisseph.SE_PLUTO, 'Plutone', jdUtNascita)
    };
    
    const pianetiTransito = {
      sole: getPosizionePianeta(swisseph.SE_SUN, jdUtTransito),
      luna: getPosizionePianeta(swisseph.SE_MOON, jdUtTransito),
      mercurio: getPosizionePianeta(swisseph.SE_MERCURY, jdUtTransito),
      venere: getPosizionePianeta(swisseph.SE_VENUS, jdUtTransito),
      marte: getPosizionePianeta(swisseph.SE_MARS, jdUtTransito),
      giove: getPosizionePianeta(swisseph.SE_JUPITER, jdUtTransito),
      saturno: getPosizionePianeta(swisseph.SE_SATURN, jdUtTransito),
      urano: getPosizionePianeta(swisseph.SE_URANUS, jdUtTransito),
      nettuno: getPosizionePianeta(swisseph.SE_NEPTUNE, jdUtTransito),
      plutone: getPosizionePianeta(swisseph.SE_PLUTO, jdUtTransito)
    };
    
    const segni = ['Ariete', 'Toro', 'Gemelli', 'Cancro', 'Leone', 'Vergine', 'Bilancia', 'Scorpione', 'Sagittario', 'Capricorno', 'Acquario', 'Pesci'];
    const aspettiTransito = [];
    
    for (const [nomeNatale, longNatale] of Object.entries(pianetiNatali)) {
      for (const [nomeTransito, longTransito] of Object.entries(pianetiTransito)) {
        if (longNatale === null || longTransito === null) continue;
        
        let diff = Math.abs(longNatale - longTransito);
        if (diff > 180) diff = 360 - diff;
        
        let aspetto = null;
        let orb = null;
        let colore = null;
        
        if (diff < 8) {
          aspetto = 'Congiunzione';
          orb = diff.toFixed(2);
          colore = '#ffffff';
        } else if (Math.abs(diff - 60) < 6) {
          aspetto = 'Sestile';
          orb = Math.abs(diff - 60).toFixed(2);
          colore = '#66ff66';
        } else if (Math.abs(diff - 90) < 8) {
          aspetto = 'Quadrato';
          orb = Math.abs(diff - 90).toFixed(2);
          colore = '#ff6666';
        } else if (Math.abs(diff - 120) < 8) {
          aspetto = 'Trigono';
          orb = Math.abs(diff - 120).toFixed(2);
          colore = '#6666ff';
        } else if (Math.abs(diff - 180) < 8) {
          aspetto = 'Opposizione';
          orb = Math.abs(diff - 180).toFixed(2);
          colore = '#ff3366';
        }
        
        if (aspetto) {
          const segnoNatale = segni[Math.floor(longNatale / 30)];
          const segnoTransito = segni[Math.floor(longTransito / 30)];
          
          aspettiTransito.push({
            pianetaNatale: nomeNatale,
            pianetaTransito: nomeTransito,
            aspetto: aspetto,
            orb: orb,
            colore: colore,
            segnoNatale: segnoNatale,
            segnoTransito: segnoTransito
          });
        }
      }
    }
    
    aspettiTransito.sort((a, b) => parseFloat(a.orb) - parseFloat(b.orb));
    
    const aspettiFinali = aspettiTransito.slice(0, 15).map(a => {
      let descrizione = '';
      if (a.aspetto === 'Congiunzione') {
        descrizione = `${a.pianetaNatale} e ${a.pianetaTransito} si uniscono, amplificando le rispettive energie. Momento di concentrazione e intensità.`;
      } else if (a.aspetto === 'Sestile') {
        descrizione = `Opportunità di collaborazione tra ${a.pianetaNatale} e ${a.pianetaTransito}. Un'occasione da non perdere.`;
      } else if (a.aspetto === 'Quadrato') {
        descrizione = `Tensione costruttiva. ${a.pianetaNatale} e ${a.pianetaTransito} creano attrito che può diventare motore di cambiamento.`;
      } else if (a.aspetto === 'Trigono') {
        descrizione = `Armonia e fluidità. ${a.pianetaNatale} e ${a.pianetaTransito} lavorano insieme senza sforzo.`;
      } else if (a.aspetto === 'Opposizione') {
        descrizione = `Bisogno di equilibrio. ${a.pianetaNatale} e ${a.pianetaTransito} richiedono una sintesi tra poli opposti.`;
      }
      return { ...a, descrizione };
    });
    
    console.log(`🔗 Trovati ${aspettiTransito.length} aspetti di transito`);
    
    res.json({
      aspetti: aspettiFinali,
      dataTransito: dataTransito
    });
    
  } catch (err) {
    console.error('❌ ERRORE TRANSITI:', err.message);
    res.status(500).json({ errore: err.message || 'Errore server' });
  }
});

// =======================
// 💞 API - COMPATIBILITÀ
// =======================
app.post('/compatibilita', (req, res) => {
  console.log('\n🔥 RICHIESTA COMPATIBILITÀ');
  
  try {
    const { personaA, personaB } = req.body;
    console.log(`📥 Persona A: ${JSON.stringify(personaA)}`);
    console.log(`📥 Persona B: ${JSON.stringify(personaB)}`);

    if (!personaA || !personaB) {
      return res.status(400).json({ errore: 'Parametri mancanti' });
    }

    // Funzione per calcolare i pianeti di una persona
    function calcolaPianetiPersona(data, ora, lat, lon) {
      const [y, m, d] = data.split('-').map(Number);
      let [h, min] = ora.split(':').map(Number);
      
      let oraUt = h + min / 60 - 1;
      let giornoJD = d;
      let meseJD = m;
      let annoJD = y;
      
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
      
      const jdUt = swisseph.swe_julday(annoJD, meseJD, giornoJD, oraUt, swisseph.SE_GREG_CAL);
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      
      const houses = swisseph.swe_houses(jdUt, latNum, lonNum, 'P');
      const ascendenteLong = houses.ascmc ? houses.ascmc[0] : houses.house[0];
      
      const pianeti = {
        sole: calcPlanet(swisseph.SE_SUN, 'Sole', jdUt),
        luna: calcPlanet(swisseph.SE_MOON, 'Luna', jdUt),
        mercurio: calcPlanet(swisseph.SE_MERCURY, 'Mercurio', jdUt),
        venere: calcPlanet(swisseph.SE_VENUS, 'Venere', jdUt),
        marte: calcPlanet(swisseph.SE_MARS, 'Marte', jdUt),
        giove: calcPlanet(swisseph.SE_JUPITER, 'Giove', jdUt),
        saturno: calcPlanet(swisseph.SE_SATURN, 'Saturno', jdUt),
        urano: calcPlanet(swisseph.SE_URANUS, 'Urano', jdUt),
        nettuno: calcPlanet(swisseph.SE_NEPTUNE, 'Nettuno', jdUt),
        plutone: calcPlanet(swisseph.SE_PLUTO, 'Plutone', jdUt)
      };
      
      return { pianeti, ascendenteLong };
    }
    
    // Calcola i pianeti per entrambe le persone
    const personaAData = calcolaPianetiPersona(personaA.data, personaA.ora, personaA.lat, personaA.lon);
    const personaBData = calcolaPianetiPersona(personaB.data, personaB.ora, personaB.lat, personaB.lon);
    
    const pianetiA = personaAData.pianeti;
    const pianetiB = personaBData.pianeti;
    
    // Calcola aspetti tra i pianeti delle due persone
    const segni = ['Ariete', 'Toro', 'Gemelli', 'Cancro', 'Leone', 'Vergine', 'Bilancia', 'Scorpione', 'Sagittario', 'Capricorno', 'Acquario', 'Pesci'];
    const aspettiCompatibilita = [];
    
    for (const [nomeA, longA] of Object.entries(pianetiA)) {
      for (const [nomeB, longB] of Object.entries(pianetiB)) {
        if (longA === null || longB === null) continue;
        
        let diff = Math.abs(longA - longB);
        if (diff > 180) diff = 360 - diff;
        
        let aspetto = null;
        let orb = null;
        
        if (diff < 8) {
          aspetto = 'Congiunzione';
          orb = diff.toFixed(2);
        } else if (Math.abs(diff - 60) < 6) {
          aspetto = 'Sestile';
          orb = Math.abs(diff - 60).toFixed(2);
        } else if (Math.abs(diff - 90) < 8) {
          aspetto = 'Quadrato';
          orb = Math.abs(diff - 90).toFixed(2);
        } else if (Math.abs(diff - 120) < 8) {
          aspetto = 'Trigono';
          orb = Math.abs(diff - 120).toFixed(2);
        } else if (Math.abs(diff - 180) < 8) {
          aspetto = 'Opposizione';
          orb = Math.abs(diff - 180).toFixed(2);
        }
        
        if (aspetto) {
          const segnoA = segni[Math.floor(longA / 30)];
          const segnoB = segni[Math.floor(longB / 30)];
          
          let descrizione = '';
          if (aspetto === 'Congiunzione') {
            descrizione = `${nomeA} e ${nomeB} si uniscono, creando una forte connessione energetica.`;
          } else if (aspetto === 'Sestile') {
            descrizione = `Opportunità di collaborazione e supporto reciproco.`;
          } else if (aspetto === 'Quadrato') {
            descrizione = `Tensione costruttiva: le differenze possono diventare un motore di crescita.`;
          } else if (aspetto === 'Trigono') {
            descrizione = `Armonia naturale: i vostri pianeti danzano insieme senza sforzo.`;
          } else if (aspetto === 'Opposizione') {
            descrizione = `Attrazione degli opposti: potete completarvi a vicenda.`;
          }
          
          aspettiCompatibilita.push({
            pianetaA: nomeA,
            pianetaB: nomeB,
            aspetto: aspetto,
            orb: orb,
            segnoA: segnoA,
            segnoB: segnoB,
            descrizione: descrizione
          });
        }
      }
    }
    
    // Ordina per orb (più stretto prima)
    aspettiCompatibilita.sort((a, b) => parseFloat(a.orb) - parseFloat(b.orb));
    
    // Calcolo punteggio semplice
    let punteggio = 0;
    for (const a of aspettiCompatibilita) {
      if (a.aspetto === 'Trigono' || a.aspetto === 'Sestile') punteggio += 10;
      if (a.aspetto === 'Congiunzione') punteggio += 5;
      if (a.aspetto === 'Opposizione') punteggio += 3;
      if (a.aspetto === 'Quadrato') punteggio += 2;
      punteggio += Math.max(0, 8 - parseFloat(a.orb));
    }
    punteggio = Math.min(100, Math.round(punteggio));
    
    // Riepilogo
    let riepilogo = '';
    if (punteggio >= 70) {
      riepilogo = '🌟 Compatibilità eccellente! C\'è una forte armonia naturale tra di voi. I pianeti danzano insieme, favorendo comprensione e sostegno reciproco.';
    } else if (punteggio >= 50) {
      riepilogo = '💫 Buona compatibilità. Ci sono molti aspetti armonici, ma anche qualche tensione costruttiva che può aiutarvi a crescere insieme.';
    } else if (punteggio >= 30) {
      riepilogo = '🌙 Compatibilità nella media. Il vostro rapporto richiede impegno e comunicazione, ma le potenzialità ci sono.';
    } else {
      riepilogo = '🌊 Compatibilità complessa. Molti aspetti di tensione: il vostro è un rapporto che può essere stimolante ma anche impegnativo.';
    }
    
    // Aggiungi anche l'Ascendente di ciascuno per info extra
    const ascendenteASegno = segni[Math.floor(personaAData.ascendenteLong / 30)];
    const ascendenteAGrado = (personaAData.ascendenteLong % 30).toFixed(2);
    const ascendenteBSegno = segni[Math.floor(personaBData.ascendenteLong / 30)];
    const ascendenteBGrado = (personaBData.ascendenteLong % 30).toFixed(2);
    
    console.log(`🔗 Trovati ${aspettiCompatibilita.length} aspetti di compatibilità`);
    
    res.json({
      aspetti: aspettiCompatibilita.slice(0, 20),
      punteggio: punteggio,
      riepilogo: riepilogo,
      ascendenteA: { segno: ascendenteASegno, grado: ascendenteAGrado },
      ascendenteB: { segno: ascendenteBSegno, grado: ascendenteBGrado }
    });
    
  } catch (err) {
    console.error('❌ ERRORE COMPATIBILITÀ:', err.message);
    res.status(500).json({ errore: err.message || 'Errore server' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server su porta ${PORT}`));