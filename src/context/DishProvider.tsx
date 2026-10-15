import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { DishContext } from './DishContext';
import type { Dish, DishStatus } from '../types/dish';
import type { MealPlanDay } from '../types/mealPlan';
import { dummyDishes, dummyDishStatuses, mockMealPlan } from '../data/dummyData';

// --- HJÄLPFUNKTION: Bygger ut matsedeln till 35 dagar ---
// Vi lägger den utanför så vi kan använda den både vid start och när man trycker "Slumpa Ny"
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
  const [dishes, setDishes] = useState<Dish[]>(dummyDishes);
  const [userDishStatuses, setUserDishStatuses] = useState<Record<string, DishStatus>>(dummyDishStatuses);
  const userDishStatusesRef = useRef(userDishStatuses);
  const [currentDish, setCurrentDish] = useState<Dish | null>(
    () => dummyDishes.find(dish => !dummyDishStatuses[dish.id]) ?? null
  );

  // --- LAZY INITIALIZATION ---
  // Genom att skicka in en pilfunktion här, körs den bara EN gång vid start.
  // Appen får 35 dagar direkt, ingen useEffect behövs!
  const [mealPlan, setMealPlan] = useState<MealPlanDay[]>(() => {
    return generateFullPlan(mockMealPlan, dummyDishes, dummyDishStatuses);
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

  const addDish = (newDish: Omit<Dish, 'id'>) => {
    const dish: Dish = {
      ...newDish,
      id: crypto.randomUUID(),
    };

    setDishes(prevDishes => [dish, ...prevDishes]);
    const nextStatuses = { ...userDishStatusesRef.current, [dish.id]: 'yes' as const };
    userDishStatusesRef.current = nextStatuses;
    setUserDishStatuses(nextStatuses);
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

  // Vår Slumpa-knapp anropar nu bara hjälpfunktionen!
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