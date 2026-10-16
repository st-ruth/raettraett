import express from 'express';
import cors from 'cors';
import fs from 'fs';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/dishes', (req, res) => {
  // Läs filen
  const data = fs.readFileSync('./dishes.json', 'utf-8');
  // Översätt från text till kod och skicka
  const dishes = JSON.parse(data);
  res.json(dishes);
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servern snurrar och lyssnar på http://localhost:${PORT}`);
});