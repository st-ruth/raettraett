import type {Dish} from '../types/dish';
import type { MealPlanDay } from '../types/mealPlan'; 

export const dummyDishes: Dish[] = [
    {
        id: '1',
        title: 'korvstroganoff',
        status: 'repo', 
        category: 'Husman',
        preferredDays: 'weekdays',
        proteinType: 'sausage',
        carbType: 'rice', 
    },
    {
        id: '2',
        title: 'Tacos',
        status: 'repo',
        category: 'Mexikanskt',
        preferredDays: 'both',
        proteinType: 'mince',
        carbType: 'other',
        isQuick: true,
    },
    {
        id: '3',
        title: 'högrevsgryta',
        status: 'repo', 
        category: 'Husman',
        preferredDays: 'weekends',
        proteinType: 'stew',
        carbType: 'potatoes',
        isSlowCooked: true
    }, 
    {
        id: '4',
        title: 'köttfärssås',
        status:'blocked',
        category: 'Husman',
        preferredDays: 'both',
        proteinType: 'mince',
        carbType: 'pasta',
        isQuick: true
    },
    {
        id: '5',
        title: 'korensk pulled tacos',
        status: 'maybe',
        category: 'Asiatiskt',
        preferredDays: 'weekends',
        proteinType: 'pulled',
        carbType: 'bread',
        isSlowCooked: true
    }
]

//------------------------------------------------------//

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);

const inThreeDays = new Date(today);
inThreeDays.setDate(today.getDate() + 3);

const inFiveDays = new Date(today);
inFiveDays.setDate(today.getDate() + 5);

const formatDate = (d: Date) => d.toISOString().split('T')[0];

// Exportera din fejkade matsedel
export const mockMealPlan: MealPlanDay[] = [
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