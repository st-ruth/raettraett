import type { Dish } from './dish';

export type DayStatus = 'generated' | 'locked' | 'eating_out'; 

export interface MealPlanDay {
    id: string;
    date: string;
    dayOfWeek: string;
    status: DayStatus;
    recipes: Dish[]; 
    customNote?: string; 
}