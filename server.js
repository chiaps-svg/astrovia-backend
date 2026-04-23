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
  swisseph.swe_set_ephe_path('./ephe');
  console.log('✅ Percorso impostato su ./ephe');
} else {
  console.log('❌ NESSUN PERCORSO TROVATO!');
}

const app = express();

// =======================
// 🔥 CORS
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
app.get('/', (req, res) => res.send('Backend Astrovia funzionante 🚀'));
app.get('/ping', (req, res) => res.send('OK'));

// =======================
// 🌌 API - CON CORREZIONE PRECISA DEL FUSO ORARIO
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
    // 🔥 CONVERSIONE FUSO ORARIO PRECISA PER L'ITALIA
    // =======================
    const [y, m, d] = data.split('-').map(Number);
    let [h, min] = ora.split(':').map(Number);
    
    // Funzione per determinare se è ora legale (semplificata per l'Italia)
    // Dal 1916, l'ora legale in Italia inizia l'ultima domenica di marzo e termina l'ultima domenica di ottobre
    function isDaylightSavings(year, month, day) {
      if (month < 3 || month > 10) return false; // Gen-Feb, Nov-Dic: ora solare
      if (month > 3 && month < 10) return true;  // Apr-Set: ora legale
      
      // Calcolo ultima domenica di marzo
      if (month === 3) {
        const lastSunday = new Date(year, 3, 0).getDate() - new Date(year, 3, 0).getDay();
        return day >= lastSunday;
      }
      
      // Calcolo ultima domenica di ottobre
      if (month === 10) {
        const lastSunday = new Date(year, 11, 0).getDate() - new Date(year, 11, 0).getDay();
        return day < lastSunday;
      }
      
      return false;
    }
    
    // Determina il fuso orario
    const isDST = isDaylightSavings(y, m, d);
    const timezoneOffset = isDST ? 2 : 1; // CEST = UTC+2, CET = UTC+1
    
    console.log(`📅 Data: ${y}-${m}-${d}`);
    console.log(`🕐 Ora legale: ${isDST ? 'SÌ (CEST UTC+2)' : 'NO (CET UTC+1)'}`);
    console.log(`📍 Fuso orario: UTC+${timezoneOffset}`);
    
    // Converti ora locale in UT
    let oraUt = h + min / 60 - timezoneOffset;
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
    
    console.log(`📅 Ora italiana: ${h}:${min} (UTC+${timezoneOffset}) -> UT: ${oraUt.toFixed(6)}`);
    console.log(`📅 Data UT: ${annoJD}-${meseJD}-${giornoJD}`);
    
    // Calcola Julian Day con l'ora UT corretta
    const jd = swisseph.swe_julday(annoJD, meseJD, giornoJD, oraUt, swisseph.SE_GREG_CAL);
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    
    console.log(`📆 Julian Day (UT): ${jd.toFixed(8)}`);
    
    const segni = ['Ariete ♈', 'Toro ♉', 'Gemelli ♊', 'Cancro ♋', 'Leone ♌', 'Vergine ♍', 'Bilancia ♎', 'Scorpione ♏', 'Sagittario ♐', 'Capricorno ♑', 'Acquario ♒', 'Pesci ♓'];
    
    // Funzione per convertire longitudine in segno + grado
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
    const aspetti = [];
    
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