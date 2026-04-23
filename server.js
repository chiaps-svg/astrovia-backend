const express = require('express');

const app = express();

// =======================
// 🔥 MIDDLEWARE CORS - VERSIONE SEMPLICE
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

// =======================
// 🏓 PING
// =======================
app.get('/ping', (req, res) => {
  res.send('OK');
});

// =======================
// 🌌 API DI TEST (versione semplificata)
// =======================
app.post('/tema-natale', (req, res) => {
  console.log('🔥🔥🔥 CHIAMATA RICEVUTA SU /tema-natale 🔥🔥🔥');
  console.log('📦 BODY RICEVUTO:', JSON.stringify(req.body));
  
  try {
    // Risposta fissa per test
    res.json({ 
      success: true, 
      message: 'Backend funzionante!',
      dati_ricevuti: req.body
    });
  } catch (err) {
    console.error('❌ ERRORE:', err.message);
    res.status(500).json({ errore: err.message });
  }
});

// =======================
// 🚀 START
// =======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server attivo su porta ${PORT}`);
});