// Läs och skriv matsedeln i Supabase. Läggs i src/services/mealPlanApi.ts
import { supabase } from '../services/supabaseClient';
import type { Dish } from '../types/dish';
import type { DayStatus, MealPlanDay } from '../types/mealPlan';

interface MealPlanRow {
  plan_date: string;
  status: DayStatus;
  recipe_ids: string[];
  custom_note: string | null;
}

const isDayStatus = (value: unknown): value is DayStatus =>
  value === 'generated' || value === 'locked' || value === 'eating_out';

// Vi litar inte blint på databassvaret, utan validerar varje rad.
const isMealPlanRow = (value: unknown): value is MealPlanRow => {
  if (typeof value !== 'object' || value === null) return false;
  const row = value as Record<string, unknown>;

  return (
    typeof row.plan_date === 'string' &&
    isDayStatus(row.status) &&
    Array.isArray(row.recipe_ids) &&
    row.recipe_ids.every(id => typeof id === 'string') &&
    (row.custom_note === null || typeof row.custom_note === 'string')
  );
};

const rowToDay = (row: MealPlanRow, dishesById: Map<string, Dish>): MealPlanDay => ({
  id: row.plan_date,
  date: row.plan_date,
  // Lokal tid mitt på dagen, så att veckodagen inte förskjuts av tidszoner.
  dayOfWeek: new Date(`${row.plan_date}T12:00:00`).toLocaleDateString('sv-SE', {
    weekday: 'long',
  }),
  status: row.status,
  // Rätter som tagits bort sedan matsedeln sparades hoppas över.
  recipes: row.recipe_ids.flatMap(id => {
    const dish = dishesById.get(id);
    return dish ? [dish] : [];
  }),
  ...(row.custom_note ? { customNote: row.custom_note } : {}),
});

const dayToRow = (userId: string, day: MealPlanDay) => ({
  user_id: userId,
  plan_date: day.date,
  status: day.status,
  recipe_ids: day.recipes.map(recipe => recipe.id),
  custom_note: day.customNote ?? null,
});

export async function fetchMealPlan(userId: string, dishes: Dish[]): Promise<MealPlanDay[]> {
  const { data, error } = await supabase
    .from('meal_plan_days')
    .select('plan_date, status, recipe_ids, custom_note')
    .eq('user_id', userId)
    .order('plan_date', { ascending: true });

  if (error) throw error;

  const dishesById = new Map(dishes.map(dish => [dish.id, dish]));

  return (data ?? [])
    .filter(isMealPlanRow)
    .map(row => rowToDay(row, dishesById));
}

export async function saveMealPlanDays(userId: string, days: MealPlanDay[]): Promise<void> {
  if (days.length === 0) return;

  const { error } = await supabase
    .from('meal_plan_days')
    .upsert(
      days.map(day => dayToRow(userId, day)),
      { onConflict: 'user_id,plan_date' }
    );

  if (error) throw error;
}

// Städar bort sparade dagar efter planens sista dag, så att databasen
// matchar det som visas efter att hela planen slumpats om.
export async function deleteMealPlanAfter(userId: string, lastDate: string): Promise<void> {
  const { error } = await supabase
    .from('meal_plan_days')
    .delete()
    .eq('user_id', userId)
    .gt('plan_date', lastDate);

  if (error) throw error;
}