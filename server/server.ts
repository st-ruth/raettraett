import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ message: "Hej från din TypeScript-backend! 🥳" });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servern snurrar och lyssnar på http://localhost:${PORT}`);
});