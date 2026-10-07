import { useState } from 'react';
import type { ReactNode } from 'react';
import { DishContext } from './DishContext';
import { dummyDishes } from '../data/dummyData';
import type { Dish } from '../types/dish';

export function DishProvider({ children }: { children: ReactNode }) {
  const [dishes] = useState<Dish[]>(dummyDishes);
  const [currentDish, setCurrentDish] = useState<Dish>(dummyDishes[0]);

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
