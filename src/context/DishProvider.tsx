import { useState } from 'react';
import type { ReactNode } from 'react';
import { DishContext } from './DishContext';
import type { Dish, DishStatus } from '../types/dish';
import type { MealPlanDay } from '../types/mealPlan';
import { dummyDishes, mockMealPlan } from '../data/dummyData';

// --- HJÄLPFUNKTION: Bygger ut matsedeln till 35 dagar ---
// Vi lägger den utanför så vi kan använda den både vid start och när man trycker "Slumpa Ny"
const generateFullPlan = (currentPlan: MealPlanDay[], availableDishes: Dish[]): MealPlanDay[] => {
  const repoDishes = availableDishes.filter(d => d.status === 'repo');
  
  if (repoDishes.length === 0) return currentPlan;

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
      const randomIndex = Math.floor(Math.random() * repoDishes.length);
      const randomDish = repoDishes[randomIndex];

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
  const [currentDish, setCurrentDish] = useState<Dish | null>(dummyDishes[0]);

  // --- LAZY INITIALIZATION ---
  // Genom att skicka in en pilfunktion här, körs den bara EN gång vid start.
  // Appen får 35 dagar direkt, ingen useEffect behövs!
  const [mealPlan, setMealPlan] = useState<MealPlanDay[]>(() => {
    return generateFullPlan(mockMealPlan, dummyDishes);
  });

  const updateDishStatus = (id: string, newStatus: DishStatus) => {
    setDishes(prevDishes => 
      prevDishes.map(dish => 
        dish.id === id ? { ...dish, status: newStatus } : dish
      )
    );
  };

  const addDish = (newDish: Omit<Dish, 'id' | 'status'>) => {
    const dish: Dish = {
      ...newDish,
      id: crypto.randomUUID(),
      status: 'yes',
    };

    setDishes(prevDishes => [dish, ...prevDishes]);
  };

  const randomizeDish = () => {
    const repoDishes = dishes.filter(dish => dish.status === 'repo');
    if (repoDishes.length === 0) {
      setCurrentDish(null);
      return;
    }
    const randomIndex = Math.floor(Math.random() * repoDishes.length);
    setCurrentDish(repoDishes[randomIndex]);
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

  // Vår Slumpa-knapp anropar nu bara hjälpfunktionen!
  const randomizeMealPlan = () => {
    const repoDishes = dishes.filter(d => d.status === 'repo');
    if (repoDishes.length === 0) {
      alert("Du har inga rätter i din bank att slumpa fram!");
      return;
    }

    setMealPlan(prevPlan => generateFullPlan(prevPlan, dishes));
  };

  return (
    <DishContext.Provider value={{ 
      dishes, 
      currentDish, 
      randomizeDish, 
      addDish,
      updateDishStatus,
      mealPlan,
      updateMealPlanDay,
      randomizeMealPlan
    }}>
      {children}
    </DishContext.Provider>
  );
}