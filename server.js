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
  // 🔥 VERIFICA FILE swe_deltat.txt
  // =======================
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
// 🔧 CALCOLO PRECISO - METODO UFFICIALE CON CORREZIONE DELTA T
// =======================
function calcPlanet(id, nome, jdUt) {
  try {
    if (!id && id !== 0) return null;
    
    let deltaT = swisseph.swe_deltat(jdUt);
    if (typeof deltaT === 'object' && deltaT !== null) {
        deltaT = deltaT.delta_t || deltaT.deltat || 0;
    }
    
    console.log(`📐 Delta T per ${nome}: ${deltaT} giorni`);
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
    
    if (longitudine !== null && !isNaN(longitudine)) {
      console.log(`✅ ${nome}: ${longitudine.toFixed(4)}° (TT)`);
    }
    
    return longitudine;
    
  } catch (e) {
    console.error(`❌ Errore calcolo ${nome}:`, e.message);
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
    console.log(`🔍 Verifica: ora italiana ${h}:${min} -> UT=${oraUt.toFixed(6)}`);
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
    
    console.log(`📅 Ora italiana: ${h}:${min} (CET UTC+1) -> UT: ${oraUt.toFixed(6)}`);
    console.log(`📅 Data UT: ${annoJD}-${meseJD}-${giornoJD}`);
    
    const jdUt = swisseph.swe_julday(annoJD, meseJD, giornoJD, oraUt, swisseph.SE_GREG_CAL);
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    
    console.log(`📆 Julian Day (UT): ${jdUt.toFixed(8)}`);
    
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
    
    console.log(`📊 Ascendente: ${ascendenteLong.toFixed(4)}° -> ${segni[Math.floor(ascendenteLong / 30)]} ${(ascendenteLong % 30).toFixed(2)}°`);
    
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
    } catch(e) {
      console.log('❌ Nodi Lunari: errore');
    }
    
    const aspetti = calcolaAspetti(pianeti);
    console.log(`🔗 Trovati ${aspetti.length} aspetti planetari`);
    
    console.log('📤 INVIO RISPOSTA AL FRONTEND');
    
    res.json({ 
      jd: jdUt,
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
    
    console.log(`📆 Julian Day (UT): ${jdUt.toFixed(8)}`);
    
    const ascendenteLong = calcolaAscendente(jdUt, latNum, lonNum);
    
    const segni = ['Ariete', 'Toro', 'Gemelli', 'Cancro', 'Leone', 'Vergine', 'Bilancia', 'Scorpione', 'Sagittario', 'Capricorno', 'Acquario', 'Pesci'];
    const segnoIndex = Math.floor(ascendenteLong / 30);
    const grado = (ascendenteLong % 30).toFixed(2);
    
    console.log(`📊 Ascendente calcolato: ${ascendenteLong.toFixed(4)}° -> ${segni[segnoIndex]} ${grado}°`);
    
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
  
  try {
    const { data, ora, lat, lon, dataPrevisione } = req.body;
    console.log(`📥 Nascita: ${data} ${ora} ${lat} ${lon}`);
    console.log(`📥 Data previsione: ${dataPrevisione}`);

    if (!data || !ora || !lat || !lon || !dataPrevisione) {
      return res.status(400).json({ errore: 'Parametri mancanti' });
    }

    // CONVERSIONE ORA ITALIANA -> UT per la data di nascita
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
    
    console.log(`📆 Julian Day nascita (UT): ${jdUtNascita.toFixed(8)}`);
    
    // CONVERSIONE DATA PREVISIONE (assumiamo mezzogiorno come ora)
    const [y2, m2, d2] = dataPrevisione.split('T')[0].split('-').map(Number);
    const oraPrevisioneUt = 12; // mezzogiorno UT
    const jdUtPrevisione = swisseph.swe_julday(y2, m2, d2, oraPrevisioneUt, swisseph.SE_GREG_CAL);
    
    console.log(`📆 Julian Day previsione (UT): ${jdUtPrevisione.toFixed(8)}`);
    
    // CALCOLO POSIZIONI PIANETI AL MOMENTO DELLA PREVISIONE
    function getPosizionePianeta(id, nome, jdUt) {
      let deltaT = swisseph.swe_deltat(jdUt);
      if (typeof deltaT === 'object' && deltaT !== null) {
        deltaT = deltaT.delta_t || deltaT.deltat || 0;
      }
      const jdTT = jdUt + deltaT;
      const result = swisseph.swe_calc(jdTT, id, swisseph.SEFLG_SWIEPH);
      return result ? result.longitude : null;
    }
    
    // CALCOLO POSIZIONI DEI PIANETI DEL TEMA NATALE
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
    
    // CALCOLO POSIZIONI DEI PIANETI DEL GIORNO DELLA PREVISIONE
    const pianetiPrevisione = {
      sole: getPosizionePianeta(swisseph.SE_SUN, 'Sole', jdUtPrevisione),
      luna: getPosizionePianeta(swisseph.SE_MOON, 'Luna', jdUtPrevisione),
      mercurio: getPosizionePianeta(swisseph.SE_MERCURY, 'Mercurio', jdUtPrevisione),
      venere: getPosizionePianeta(swisseph.SE_VENUS, 'Venere', jdUtPrevisione),
      marte: getPosizionePianeta(swisseph.SE_MARS, 'Marte', jdUtPrevisione),
      giove: getPosizionePianeta(swisseph.SE_JUPITER, 'Giove', jdUtPrevisione),
      saturno: getPosizionePianeta(swisseph.SE_SATURN, 'Saturno', jdUtPrevisione),
      urano: getPosizionePianeta(swisseph.SE_URANUS, 'Urano', jdUtPrevisione),
      nettuno: getPosizionePianeta(swisseph.SE_NEPTUNE, 'Nettuno', jdUtPrevisione),
      plutone: getPosizionePianeta(swisseph.SE_PLUTO, 'Plutone', jdUtPrevisione)
    };
    
    // CALCOLO ASPETTI TRA NATALE E PREVISIONE
    const aspettiPrevisioni = [];
    
    // Aspetti tra Sole natale e pianeti in transito
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
            orb: diff.toFixed(2),
            colore: '#ffffff'
          });
        } else if (Math.abs(diff - 60) < 6) {
          aspettiPrevisioni.push({
            pianetaNatale: nomeNatale,
            pianetaTransito: nomeTransito,
            aspetto: 'Sestile',
            orb: Math.abs(diff - 60).toFixed(2),
            colore: '#66ff66'
          });
        } else if (Math.abs(diff - 90) < 8) {
          aspettiPrevisioni.push({
            pianetaNatale: nomeNatale,
            pianetaTransito: nomeTransito,
            aspetto: 'Quadrato',
            orb: Math.abs(diff - 90).toFixed(2),
            colore: '#ff6666'
          });
        } else if (Math.abs(diff - 120) < 8) {
          aspettiPrevisioni.push({
            pianetaNatale: nomeNatale,
            pianetaTransito: nomeTransito,
            aspetto: 'Trigono',
            orb: Math.abs(diff - 120).toFixed(2),
            colore: '#6666ff'
          });
        } else if (Math.abs(diff - 180) < 8) {
          aspettiPrevisioni.push({
            pianetaNatale: nomeNatale,
            pianetaTransito: nomeTransito,
            aspetto: 'Opposizione',
            orb: Math.abs(diff - 180).toFixed(2),
            colore: '#ff3366'
          });
        }
      }
    }
    
    // GENERAZIONE TESTO PREVISIONI
    const segni = ['Ariete', 'Toro', 'Gemelli', 'Cancro', 'Leone', 'Vergine', 'Bilancia', 'Scorpione', 'Sagittario', 'Capricorno', 'Acquario', 'Pesci'];
    
    const aspettiTesto = aspettiPrevisioni.map(a => {
      const segnoNatale = segni[Math.floor(pianetiNatali[a.pianetaNatale] / 30)];
      const segnoTransito = segni[Math.floor(pianetiPrevisione[a.pianetaTransito] / 30)];
      return {
        testo: `${a.pianetaNatale} (${segnoNatale}) in ${a.aspetto} con ${a.pianetaTransito} (${segnoTransito}) - orb ${a.orb}°`
      };
    }).slice(0, 5); // limitiamo a 5 aspetti per non sovraccaricare
    
    // GENERAZIONE CONSIGLIO GENERICO
    let consiglio = '';
    if (aspettiPrevisioni.some(a => a.aspetto === 'Trigono')) {
      consiglio = '✨ Un momento favorevole! Le energie cosmiche sono allineate per i tuoi progetti.';
    } else if (aspettiPrevisioni.some(a => a.aspetto === 'Quadrato' || a.aspetto === 'Opposizione')) {
      consiglio = '⚠️ Possibili tensioni oggi. Cerca di mantenere la calma e riflettere prima di agire.';
    } else if (aspettiPrevisioni.some(a => a.aspetto === 'Sestile')) {
      consiglio = '🌱 Ottime opportunità si presentano. Sii aperto alle novità e alle collaborazioni.';
    } else {
      consiglio = '⭐ Giornata equilibrata. Ascolta il tuo intuito e seguì il tuo ritmo.';
    }
    
    console.log(`🔗 Trovati ${aspettiPrevisioni.length} aspetti di transito`);
    
    res.json({
      aspetti: aspettiTesto,
      consiglio: consiglio,
      dataPrevisione: dataPrevisione
    });
    
  } catch (err) {
    console.error('❌ ERRORE PREVISIONI:', err.message);
    console.error(err.stack);
    res.status(500).json({ errore: err.message || 'Errore server' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server su porta ${PORT}`));