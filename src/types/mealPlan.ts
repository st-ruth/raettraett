// hur en enskild dag ser ut i  3-dagarsvy, veckodagar & 30dagarsvy.

import type { Dish } from "./dish";

export type DayStatus = 'generated' | 'locked' | 'eating_out';  //status för specifik dag i kalendern 

export interface MealPlanDay {
    id: string;
    date: string;
    dayOfWeek: string;
    status: DayStatus;
    recipes: Dish[]; 
    customNote?: string;  //osäker på om jag vill ha detta? 
}