import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Här skapar vi "bron" till din databas som vi kan använda överallt i appen
export const supabase = createClient(supabaseUrl, supabaseAnonKey);