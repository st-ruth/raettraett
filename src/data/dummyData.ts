import type {Dish} from '../types/dish'

export const dummyDishes: Dish[] = [
    {
        id: '1',
        title: 'korvstroganoff',
        status: 'repo', 
        category: 'Husman',
        mealType: 'weekday',
        proteinType: 'sausage',
        carbType: 'rice', 
        preferredDays: ['tuesday','wednesday'],
    },
    {
        id: '2',
        title: 'Tacos',
        status: 'repo',
        category: 'Mexikanskt',
        mealType: 'both',
        proteinType: 'mince',
        carbType: 'other',
        isQuick: true,
    },
    {
        id: '3',
        title: 'högrevsgryta',
        status: 'repo', 
        category: 'Husman',
        mealType: 'weekend',
        proteinType: 'stew',
        carbType: 'potatoes',
        preferredDays: ['sunday'],  
        isSlowCooked: true
    }, 
    {
        id: '4',
        title: 'köttfärssås',
        status:'blocked',
        category: 'Husman',
        mealType: 'both',
        proteinType: 'mince',
        carbType: 'pasta',
        isQuick: true
    },
    {
        id: '5',
        title: 'korensk pulled tacos',
        status: 'maybe',
        category: 'Asiatiskt',
        mealType: 'weekend',
        proteinType: 'pulled',
        carbType: 'bread',
        preferredDays: ['friday', 'saturday'],
        isSlowCooked: true
    }
]