// här i ska kanban-logiken bo 

import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Dish } from '../types/dish';
import { dummyDishes } from '../data/dummyData';

// 1. Vi talar om för TypeScript vad vår Context ska innehålla
interface DishContextType {
  dishes: Dish[];
  currentDish: Dish;
  randomizeDish: () => void;
}

// 2. Vi skapar själva Contexten
const DishContext = createContext<DishContextType | undefined>(undefined);

// 3. Vi skapar en Provider som ska "krama om" hela din app
export function DishProvider({ children }: { children: ReactNode }) {
  const [dishes] = useState<Dish[]>(dummyDishes);
  
  // Sätter den första rätten som standard
  const [currentDish, setCurrentDish] = useState<Dish>(dummyDishes[0]);

  // Den globala slump-funktionen
  const randomizeDish = () => {
    const randomIndex = Math.floor(Math.random() * dishes.length);
    setCurrentDish(dishes[randomIndex]);
  };

  return (
    <DishContext.Provider value={{ dishes, currentDish, randomizeDish }}>
      {children}
    </DishContext.Provider>
  );
}

// 4. En smart egen hook (Custom Hook) för att lätt hämta datan i dina sidor
export function useDishContext() {
  const context = useContext(DishContext);
  if (context === undefined) {
    throw new Error('useDishContext måste användas inuti en DishProvider');
  }
  return context;
}