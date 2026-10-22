import express from 'express';
import cors from 'cors';
import fs from 'fs';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'node:url';

dotenv.config();

const app = express();
app.use(cors({
  origin: ['https://raettraett.netlify.app', 'http://localhost:5173', 'https://rattratt.vercel.app'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
}));
app.use(express.json());

// Skapa kopplingen till Supabase från backenden
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const dishesFilePath = [
  new URL('./dishes.json', import.meta.url),
  new URL('../dishes.json', import.meta.url),
]
  .map(url => fileURLToPath(url))
  .find(filePath => fs.existsSync(filePath));

if (!dishesFilePath) {
  throw new Error('Kunde inte hitta dishes.json bredvid servern eller dess dist-mapp.');
}

// GET-route: agerar mellanhand mot tredjeparts-API (Supabase)
app.get('/api/dishes', async (req, res) => {
  try {
    // 1. Läs hårdkodade bas-rätter från json
    const jsonData = fs.readFileSync(dishesFilePath, 'utf-8');
    const jsonDishes = JSON.parse(jsonData);

    // 2. Hämta gemensamma användarskapade rätter från Supabase
    const { data: supabaseDishes, error } = await supabase
      .from('shared_dishes')
      .select('id, title, category, protein_type, preferred_days, carb_type, is_quick, is_slow_cooked');

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
  id?: string;
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
  (!('id' in value) || (
    typeof value.id === 'string' &&
    value.id.trim().length > 0
  )) &&
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

app.post('/api/dishes', async (req, res) => {
  const newDish: unknown = req.body;
  if (!isDish(newDish)) {
    res.status(400).json({ error: 'Ogiltig maträtt. Kontrollera obligatoriska fält och deras värden.' });
    return;
  }

  const authorization = req.get('authorization');
  const accessToken = authorization?.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length).trim()
    : '';
  if (!accessToken) {
    res.status(401).json({ error: 'Du måste vara inloggad för att spara en maträtt.' });
    return;
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !authData.user) {
      res.status(401).json({ error: 'Din inloggning kunde inte verifieras. Logga in igen.' });
      return;
    }

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      accessToken: async () => accessToken,
    });
    const normalizedTitle = newDish.title.trim().toLowerCase();
    const { data: savedDish, error: insertError } = await userSupabase
      .from('shared_dishes')
      .insert({
        title: newDish.title.trim(),
        category: newDish.category ?? null,
        protein_type: newDish.proteinType,
        preferred_days: newDish.preferredDays,
        carb_type: newDish.carbType ?? null,
        is_quick: newDish.isQuick ?? false,
        is_slow_cooked: newDish.isSlowCooked ?? false,
      })
      .select('*')
      .single();

    if (insertError?.code === '23505') {
      const { data: duplicate, error: duplicateError } = await userSupabase
        .from('shared_dishes')
        .select('id, title, category, protein_type, preferred_days, carb_type, is_quick, is_slow_cooked')
        .eq('normalized_title', normalizedTitle)
        .single();
      if (duplicateError) {
        console.error('Kunde inte hitta den gemensamma maträtten efter en dubblettkonflikt:', duplicateError);
        res.status(500).json({ error: 'Kunde inte hitta den befintliga maträtten efter en dubblettkonflikt.' });
        return;
      }
      res.status(200).json(duplicate);
      return;
    }

    if (insertError) {
      console.error('Kunde inte spara den gemensamma maträtten i Supabase:', insertError);
      const status = insertError.code === '42501' ? 403 : 500;
      res.status(status).json({ error: 'Ett serverfel hindrade sparningen av maträtten.' });
      return;
    }

    res.status(201).json(savedDish);
  } catch (error) {
    console.error('Kunde inte spara maträtten i Supabase:', error);
    res.status(500).json({ error: 'Ett serverfel hindrade sparningen av maträtten.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servern snurrar och lyssnar på http://localhost:${PORT}`);
});