import express from 'express';
import cors from 'cors';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Skapa kopplingen till Supabase från backenden
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// GET-route: Uppfyller VG-kravet genom att agera mellanhand mot tredjeparts-API (Supabase)
app.get('/api/dishes', async (req, res) => {
  try {
    // 1. Läs dina hårdkodade bas-rätter från json
    const jsonData = fs.readFileSync('./dishes.json', 'utf-8');
    const jsonDishes = JSON.parse(jsonData);

    // 2. Hämta gemensamma användarskapade rätter från Supabase
    const { data: supabaseDishes, error } = await supabase
      .from('shared_dishes')
      .select('*');

    if (error) throw error;

    // 3. Slå ihop all data och skicka till frontend
    const allDishes = [...jsonDishes, ...(supabaseDishes || [])];
    res.json(allDishes);
  } catch (error) {
    console.error("Fel vid hämtning av rätter:", error);
    res.status(500).json({ error: 'Kunde inte hämta receptbanken' });
  }
});

const preferredDayOptions = ['weekdays', 'weekends', 'both'] as const;
const proteinOptions = [
  'mince', 'chicken', 'sausage', 'meat', 'pork', 'fish', 'stew',
  'soup', 'cheese', 'egg', 'mushroom', 'pulled', 'legumes', 'other',
] as const;
const carbOptions = [
  'pasta', 'rice', 'potatoes', 'salad', 'bulgur_couscous', 'noodles', 'bread', 'other',
] as const;

const isChoice = <T extends readonly string[]>(options: T, value: unknown): value is T[number] =>
  typeof value === 'string' && options.some(option => option === value);

const isDish = (value: unknown): value is {
  id: string;
  title: string;
  preferredDays: typeof preferredDayOptions[number];
  proteinType: typeof proteinOptions[number];
  category?: string;
  carbType?: typeof carbOptions[number];
  isQuick?: boolean;
  isSlowCooked?: boolean;
} =>
  typeof value === 'object' &&
  value !== null &&
  !Array.isArray(value) &&
  'id' in value &&
  typeof value.id === 'string' &&
  value.id.trim().length > 0 &&
  'title' in value &&
  typeof value.title === 'string' &&
  value.title.trim().length > 0 &&
  'preferredDays' in value &&
  isChoice(preferredDayOptions, value.preferredDays) &&
  'proteinType' in value &&
  isChoice(proteinOptions, value.proteinType) &&
  (!('category' in value) || typeof value.category === 'string') &&
  (!('carbType' in value) || isChoice(carbOptions, value.carbType)) &&
  (!('isQuick' in value) || typeof value.isQuick === 'boolean') &&
  (!('isSlowCooked' in value) || typeof value.isSlowCooked === 'boolean');

// C (CREATE) - Din intakta route för att spara till dishes.json
app.post('/api/dishes', (req, res) => {
  const newDish: unknown = req.body;
  if (!isDish(newDish)) {
    res.status(400).json({ error: 'Ogiltig maträtt. Kontrollera obligatoriska fält och deras värden.' });
    return;
  }

  try {
    const data = fs.readFileSync('./dishes.json', 'utf-8');
    const dishes: unknown = JSON.parse(data);
    if (!Array.isArray(dishes)) {
      throw new Error('dishes.json innehåller inte en lista.');
    }

    dishes.push(newDish);
    fs.writeFileSync('./dishes.json', JSON.stringify(dishes, null, 2));
    res.status(201).json(newDish);
  } catch (error) {
    console.error('Kunde inte spara maträtten i dishes.json:', error);
    res.status(500).json({ error: 'Ett serverfel hindrade sparningen av maträtten.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servern snurrar och lyssnar på http://localhost:${PORT}`);
});