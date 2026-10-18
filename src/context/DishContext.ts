//Ritningen/typerna och sjävla createContext

import { createContext } from 'react';
import type { Dish, DishStatus } from '../types/dish';
import type { MealPlanDay } from '../types/mealPlan';

export interface DishContextType {
  dishes: Dish[];
  userDishStatuses: Record<string, DishStatus>;
  currentDish: Dish | null; 
  randomizeDish: () => void;
  addDish: (newDish: Omit<Dish, 'id'>) => Promise<Dish>;
  updateDishStatus: (id: string, newStatus: DishStatus | undefined) => void;
  mealPlan: MealPlanDay[];
  updateMealPlanDay: (updatedDay: MealPlanDay) => void;
  randomizeMealPlanDay: (date: string) => void;
  randomizeMealPlan: () => void;
}

export const DishContext = createContext<DishContextType | undefined>(undefined);