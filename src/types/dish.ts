export type DishStatus = 'yes' | 'no' | 'maybe';
export type PreferredDays = 'weekdays' | 'weekends' | 'both';
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
| 'salad'
| 'bulgur_couscous' 
| 'noodles' 
| 'bread'
| 'other';

export interface Dish {
    id: string;
    title: string;
    proteinType: ProteinType;
    preferredDays: PreferredDays;
    category?: string;
    carbType?: CarbType; 
    isQuick?: boolean; 
    isSlowCooked?: boolean; }