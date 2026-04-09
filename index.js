const express = require('express');
const cors = require('cors');
const swisseph = require('swisseph');

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint di test
app.get('/', (req, res) => {
  res.send('Backend Astrovia funzionante!');
});

// Endpoint per calcolare tema natale
app.post('/calcola-tema', (req, res) => {
  const { data, ora, lat, lon } = req.body;

  // Per ora solo ritorna i dati ricevuti
  res.json({ data, ora, lat, lon, messaggio: "Calcolo da implementare" });
});

// Avvio server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server avviato sulla porta ${PORT}`);
});