import { useContext } from 'react';
import { DishContext } from './DishContext';

export function useDishContext() {
  const context = useContext(DishContext);
  if (context === undefined) {
    throw new Error('useDishContext måste användas inuti en DishProvider');
  }
  return context;
}
