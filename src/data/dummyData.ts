import type { Dish, DishStatus } from '../types/dish';
import type { MealPlanDay } from '../types/mealPlan'; 

export const dummyDishes: Dish[] = [
    {
        id: '1',
        title: 'korvstroganoff',
        category: 'Husman',
        preferredDays: 'weekdays',
        proteinType: 'sausage',
        carbType: 'rice', 
    },
    {
        id: '2',
        title: 'Tacos',
        category: 'Mexikanskt',
        preferredDays: 'both',
        proteinType: 'mince',
        carbType: 'other',
        isQuick: true,
    },
    {
        id: '3',
        title: 'högrevsgryta',
        category: 'Husman',
        preferredDays: 'weekends',
        proteinType: 'stew',
        carbType: 'potatoes',
        isSlowCooked: true
    }, 
    {
        id: '4',
        title: 'köttfärssås',
        category: 'Husman',
        preferredDays: 'both',
        proteinType: 'mince',
        carbType: 'pasta',
        isQuick: true
    },
    {
        id: '5',
        title: 'korensk pulled tacos',
        category: 'Asiatiskt',
        preferredDays: 'weekends',
        proteinType: 'pulled',
        carbType: 'bread',
        isSlowCooked: true
    }
]

export const dummyDishStatuses: Record<string, DishStatus> = {
  '1': 'yes',
  '2': 'yes',
  '4': 'no',
  '5': 'maybe',
};

//------------------------------------------------------//

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const inThreeDays = new Date(today);
inThreeDays.setDate(today.getDate() + 3);

const inFiveDays = new Date(today);
inFiveDays.setDate(today.getDate() + 5);

const twoDaysAgo = new Date(today);
twoDaysAgo.setDate(today.getDate() - 2);

const fiveDaysAgo = new Date(today);
fiveDaysAgo.setDate(today.getDate() - 5);

const nineDaysAgo = new Date(today);
nineDaysAgo.setDate(today.getDate() - 9);

const twelveDaysAgo = new Date(today);
twelveDaysAgo.setDate(today.getDate() - 12);

const formatDate = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 10);
};

const formatDayOfWeek = (d: Date) =>
  d.toLocaleDateString('sv-SE', { weekday: 'long' });

// Exportera din fejkade matsedel
export const mockMealPlan: MealPlanDay[] = [
  {
    id: 'history-day-1',
    date: formatDate(twelveDaysAgo),
    dayOfWeek: formatDayOfWeek(twelveDaysAgo),
    status: 'generated',
    recipes: [dummyDishes[0]],
  },
  {
    id: 'history-day-2',
    date: formatDate(nineDaysAgo),
    dayOfWeek: formatDayOfWeek(nineDaysAgo),
    status: 'locked',
    recipes: [dummyDishes[1]],
    customNote: 'Extra mycket grönsaker',
  },
  {
    id: 'history-day-3',
    date: formatDate(fiveDaysAgo),
    dayOfWeek: formatDayOfWeek(fiveDaysAgo),
    status: 'generated',
    recipes: [dummyDishes[3]],
  },
  {
    id: 'history-day-4',
    date: formatDate(twoDaysAgo),
    dayOfWeek: formatDayOfWeek(twoDaysAgo),
    status: 'generated',
    recipes: [dummyDishes[2]],
  },
  {
    id: 'day-1',
    date: formatDate(tomorrow), // Imorgon
    dayOfWeek: 'Okänd', 
    status: 'generated',
    recipes: [dummyDishes[0]],  // Korvstroganoff
  },
  {
    id: 'day-2',
    date: formatDate(inThreeDays), // Om 3 dagar
    dayOfWeek: 'Okänd',
    status: 'locked',
    recipes: [dummyDishes[1]],  // Tacos
  },
  {
    id: 'day-3',
    date: formatDate(inFiveDays), // Om 5 dagar
    dayOfWeek: 'Okänd',
    status: 'eating_out',
    recipes: [],
    customNote: 'Middag hos vänner',
  }
];