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
// 🌌 API - VERSIONE MINIMALE CHE FUNZIONA
// =======================
app.post('/tema-natale', (req, res) => {
  console.log('\n🔥 RICHIESTA RICEVUTA');
  console.log('📦 BODY:', req.body);
  
  try {
    const { data, ora, lat, lon } = req.body;
    
    // Conversione data/ora
    const [y, m, d] = data.split('-').map(Number);
    let [h, min] = ora.split(':').map(Number);
    const ut = h + min / 60;
    
    const jd = swisseph.swe_julday(y, m, d, ut, swisseph.SE_GREG_CAL);
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    
    // Calcolo case
    const houses = swisseph.swe_houses(jd, latNum, lonNum, 'P');
    const ascendenteLong = houses.ascmc ? houses.ascmc[0] : houses.house[0];
    
    const segni = ['Ariete', 'Toro', 'Gemelli', 'Cancro', 'Leone', 'Vergine', 'Bilancia', 'Scorpione', 'Sagittario', 'Capricorno', 'Acquario', 'Pesci'];
    const segnoAsc = segni[Math.floor(ascendenteLong / 30)];
    const gradoAsc = (ascendenteLong % 30).toFixed(2);
    
    // Calcolo pianeta Sole per test
    const soleResult = swisseph.swe_calc_ut(jd, swisseph.SE_SUN, swisseph.SEFLG_SWIEPH);
    const soleLong = soleResult.longitude;
    const segnoSole = segni[Math.floor(soleLong / 30)];
    const gradoSole = (soleLong % 30).toFixed(2);
    
    console.log(`✅ Sole: ${segnoSole} ${gradoSole}°`);
    console.log(`✅ Ascendente: ${segnoAsc} ${gradoAsc}°`);
    
    // Risposta
    res.json({ 
      success: true,
      ascendente: {
        segno: segnoAsc,
        grado: gradoAsc,
        longitudine: ascendenteLong
      },
      sole: {
        segno: segnoSole,
        grado: gradoSole,
        longitudine: soleLong
      }
    });
    
  } catch (err) {
    console.error('❌ ERRORE:', err.message);
    res.status(500).json({ errore: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server su porta ${PORT}`));