// ritningen av en rätt

export type DishStatus = 'repo' | 'yes' | 'maybe' | 'blocked';  // repo- ligger i matrepon, yes -är vald in i kalendern 
export type MealType = 'weekday' | 'weekend' | 'both';
export type ProteinType = 
| 'mince' 
| 'chicken' 
| 'sausage' 
| 'meat' 
| 'pork'
| 'fish' 
| 'stew' 
| 'soup' 
| 'cheese' 
| 'egg'
| 'mushroom'
| 'pulled'
| 'legumes' 
| 'other'; 
export type CarbType = 
| 'pasta' 
| 'rice' 
| 'potatoes' 
| 'bulgur_couscous' 
| 'noodles' 
| 'bread'
| 'other';

export interface Dish {
    id: string;
    title: string;
    status: DishStatus; 
    category: string;
    mealType?: MealType;
    proteinType?: ProteinType;
    carbType?: CarbType; 
    preferredDays?: string[];
    isQuick?: boolean;      //true för snabba rätter <30 min
    isSlowCooked?: boolean; // true för långkok 
  }