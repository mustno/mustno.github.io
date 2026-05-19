const express = require('express');
const fs = require('fs');
const app = express();

app.use(express.json());
// Serviert deine HTML/JS/CSS-Dateien aus demselben Ordner
app.use(express.static('.')); 

const dbFile = 'scores.json';

// Erstelle Datenbank-Datei, falls nicht vorhanden
if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({ snake: [], tetris: [] }));
}

// GET: Top 5 Scores abrufen
app.get('/api/scores/:game', (req, res) => {
    const db = JSON.parse(fs.readFileSync(dbFile));
    const gameScores = db[req.params.game] || [];
    res.json(gameScores.sort((a, b) => b.score - a.score).slice(0, 5));
});

// POST: Neuen Score eintragen
app.post('/api/scores/:game', (req, res) => {
    const { name, score } = req.body;
    if (!name || typeof score !== 'number') return res.status(400).send('Invalid data');
    
    const db = JSON.parse(fs.readFileSync(dbFile));
    if (!db[req.params.game]) db[req.params.game] = [];
    
    db[req.params.game].push({ name, score });
    fs.writeFileSync(dbFile, JSON.stringify(db));
    
    res.sendStatus(200);
});

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server läuft auf Port ${PORT} - HTML ist erreichbar unter http://localhost:${PORT}`);
});
