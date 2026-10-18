import { useRef, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { DishContext } from './DishContext';
import type { Dish, DishStatus } from '../types/dish';
import type { MealPlanDay } from '../types/mealPlan';

const preferredDayOptions = ['weekdays', 'weekends', 'both'] as const;
const proteinOptions = [
  'mince', 'chicken', 'sausage', 'meat', 'pork', 'fish', 'stew',
  'soup', 'cheese', 'egg', 'mushroom', 'pulled', 'legumes', 'other',
] as const;

const isDish = (value: unknown): value is Dish =>
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
  preferredDayOptions.some(option => option === value.preferredDays) &&
  'proteinType' in value &&
  proteinOptions.some(option => option === value.proteinType);

// --- HJÄLPFUNKTION: Bygger ut matsedeln till 35 dagar ---
const generateFullPlan = (
  currentPlan: MealPlanDay[],
  availableDishes: Dish[],
  userDishStatuses: Record<string, DishStatus>
): MealPlanDay[] => {
  const yesDishes = availableDishes.filter(dish => userDishStatuses[dish.id] === 'yes');

  if (yesDishes.length === 0) return currentPlan;

  const today = new Date();
  const offsetToday = today.getTimezoneOffset() * 60000;
  const todayStr = new Date(today.getTime() - offsetToday).toISOString().slice(0, 10);

  // 1. Behåll historik
  const historyDays = currentPlan.filter(day => day.date < todayStr);

  // 2. Bygg kommande 35 dagar
  const upcomingDays: MealPlanDay[] = [];
  
  for (let i = 0; i < 35; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    
    const offset = d.getTimezoneOffset() * 60000;
    const dateStr = new Date(d.getTime() - offset).toISOString().slice(0, 10);
    
    const existingDay = currentPlan.find(p => p.date === dateStr);

    if (existingDay && existingDay.status === 'locked') {
      upcomingDays.push(existingDay);
    } else {
      const randomIndex = Math.floor(Math.random() * yesDishes.length);
      const randomDish = yesDishes[randomIndex];

      upcomingDays.push({
        ...(existingDay || {
          id: dateStr,
          date: dateStr,
          dayOfWeek: d.toLocaleDateString('sv-SE', { weekday: 'long' })
        }),
        status: 'generated',
        recipes: [randomDish]
      });
    }
  }

  return [...historyDays, ...upcomingDays];
};

export function DishProvider({ children }: { children: ReactNode }) {
  // STARTAR SOM EN TOM LISTA INNAN BACKEND SVARAR!
  const [dishes, setDishes] = useState<Dish[]>([]);
  
  // Startar med tomma statusar istället för dummyDishStatuses
  const [userDishStatuses, setUserDishStatuses] = useState<Record<string, DishStatus>>({});
  const userDishStatusesRef = useRef(userDishStatuses);
  
  // Startar med tom aktuell rätt innan backend svarar
  const [currentDish, setCurrentDish] = useState<Dish | null>(null);

  // --- NY KOD: Anropar din backend när appen startar ---
  useEffect(() => {
    fetch('http://localhost:3000/api/dishes')
      .then(response => response.json())
      .then(data => {
        console.log("Svar från backend:", data);
        setDishes(data); 
        
        // När datan laddats in från servern väljer vi en första rätt att visa på Slumpa-sidan
        const unseenDishes = data.filter((dish: Dish) => !userDishStatusesRef.current[dish.id]);
        if (unseenDishes.length > 0) {
           setCurrentDish(unseenDishes[0]);
        }
      })
      .catch(error => console.error("Kunde inte nå backend:", error));
  }, []);

  // Vi startar med en helt tom 35-dagarsplan istället för mockMealPlan
  const [mealPlan, setMealPlan] = useState<MealPlanDay[]>(() => {
    return generateFullPlan([], [], {});
  });

  const updateDishStatus = (id: string, newStatus: DishStatus | undefined) => {
    const nextStatuses = { ...userDishStatusesRef.current };
    if (newStatus) {
      nextStatuses[id] = newStatus;
    } else {
      delete nextStatuses[id];
    }
    userDishStatusesRef.current = nextStatuses;
    setUserDishStatuses(nextStatuses);

    if (newStatus !== 'yes') {
      const today = new Date();
      const offset = today.getTimezoneOffset() * 60000;
      const todayStr = new Date(today.getTime() - offset).toISOString().slice(0, 10);

      setMealPlan(prevPlan =>
        prevPlan.map(day =>
          day.date >= todayStr
            ? { ...day, recipes: day.recipes.filter(recipe => recipe.id !== id) }
            : day
        )
      );
    }
  };

  const addDish = async (newDish: Omit<Dish, 'id'>): Promise<Dish> => {
    const dish: Dish = {
      ...newDish,
      id: crypto.randomUUID(),
    };
    
    const response = await fetch('http://localhost:3000/api/dishes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dish)
    });

    const responseBody: unknown = await response.json().catch(() => undefined);
    if (!response.ok) {
      const message =
        typeof responseBody === 'object' &&
        responseBody !== null &&
        'error' in responseBody &&
        typeof responseBody.error === 'string'
          ? responseBody.error
          : `Kunde inte spara maträtten (HTTP ${response.status}).`;
      throw new Error(message);
    }

    if (!isDish(responseBody)) {
      throw new Error('Backend skickade ett ogiltigt svar när maträtten sparades.');
    }

    setDishes(prevDishes => [responseBody, ...prevDishes]);
    const nextStatuses = { ...userDishStatusesRef.current, [responseBody.id]: 'yes' as const };
    userDishStatusesRef.current = nextStatuses;
    setUserDishStatuses(nextStatuses);
    return responseBody;
  };

  const randomizeDish = () => {
    const unseenDishes = dishes.filter(dish => !userDishStatusesRef.current[dish.id]);
    if (unseenDishes.length === 0) {
      setCurrentDish(null);
      return;
    }
    const randomIndex = Math.floor(Math.random() * unseenDishes.length);
    setCurrentDish(unseenDishes[randomIndex]);
  };

  const updateMealPlanDay = (updatedDay: MealPlanDay) => {
    setMealPlan(prevPlan => {
      const dayExists = prevPlan.some(day => day.date === updatedDay.date);
      if (dayExists) {
        return prevPlan.map(day => day.date === updatedDay.date ? updatedDay : day);
      } else {
        return [...prevPlan, updatedDay].sort((a, b) => a.date.localeCompare(b.date));
      }
    });
  };

  const randomizeMealPlanDay = (date: string) => {
    const yesDishes = dishes.filter(dish => userDishStatusesRef.current[dish.id] === 'yes');
    if (yesDishes.length === 0) {
      alert('Du har inga rätter i Ja-listan att slumpa fram!');
      return;
    }

    const randomDish = yesDishes[Math.floor(Math.random() * yesDishes.length)];
    setMealPlan(prevPlan => {
      const existingDay = prevPlan.find(day => day.date === date);
      if (existingDay?.status === 'locked') return prevPlan;

      // Parse as a local date to avoid shifting weekdays across time zones.
      const dayDate = new Date(`${date}T12:00:00`);
      const updatedDay: MealPlanDay = {
        ...(existingDay ?? {
          id: date,
          date,
          dayOfWeek: dayDate.toLocaleDateString('sv-SE', { weekday: 'long' }),
        }),
        status: 'generated',
        recipes: [randomDish],
      };

      return existingDay
        ? prevPlan.map(day => day.date === date ? updatedDay : day)
        : [...prevPlan, updatedDay].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const randomizeMealPlan = () => {
    const yesDishes = dishes.filter(dish => userDishStatusesRef.current[dish.id] === 'yes');
    if (yesDishes.length === 0) {
      alert('Du har inga rätter i Ja-listan att slumpa fram!');
      return;
    }

    setMealPlan(prevPlan => generateFullPlan(prevPlan, dishes, userDishStatusesRef.current));
  };

  return (
    <DishContext.Provider value={{ 
      dishes, 
      userDishStatuses,
      currentDish, 
      randomizeDish, 
      addDish,
      updateDishStatus,
      mealPlan,
      updateMealPlanDay,
      randomizeMealPlanDay,
      randomizeMealPlan
    }}>
      {children}
    </DishContext.Provider>
  );
}