//Själva komponenten som kramar om appen

import { useState } from 'react';
import type {ReactNode} from 'react';
import { DishContext } from './DishContext';
import type { Dish, DishStatus } from '../types/dish';
import { dummyDishes } from '../data/dummyData';

export function DishProvider({ children }: { children: ReactNode }) {
  const [dishes, setDishes] = useState<Dish[]>(dummyDishes);
  const [currentDish, setCurrentDish] = useState<Dish | null>(dummyDishes[0]);

  const updateDishStatus = (id: string, newStatus: DishStatus) => {
    setDishes(prevDishes => 
      prevDishes.map(dish => 
        dish.id === id ? { ...dish, status: newStatus } : dish
      )
    );
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

  return (
    <DishContext.Provider value={{ dishes, currentDish, randomizeDish, updateDishStatus }}>
      {children}
    </DishContext.Provider>
  );
}