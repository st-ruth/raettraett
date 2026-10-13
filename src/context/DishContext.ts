//Ritningen/typerna och sjävla createContext

import { createContext } from 'react';
import type { Dish, DishStatus } from '../types/dish';

export interface DishContextType {
  dishes: Dish[];
  currentDish: Dish | null; 
  randomizeDish: () => void;
  updateDishStatus: (id: string, newStatus: DishStatus) => void;
}

export const DishContext = createContext<DishContextType | undefined>(undefined);