import { createContext } from 'react';
import type { Dish } from '../types/dish';

export interface DishContextType {
  dishes: Dish[];
  currentDish: Dish;
  randomizeDish: () => void;
}

export const DishContext = createContext<DishContextType | undefined>(undefined);
