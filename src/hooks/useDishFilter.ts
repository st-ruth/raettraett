import { useState, useMemo } from 'react';
import type { Dish, ProteinType } from '../types/dish';

export type SortOption = 'a-z' | 'z-a';

export function useDishFilter(initialDishes: Dish[]) {
  // States för våra aktiva val
  const [sortBy, setSortBy] = useState<SortOption>('a-z');
  const [proteinFilter, setProteinFilter] = useState<ProteinType | 'all'>('all');
  const [quickFilter, setQuickFilter] = useState<boolean>(false); // Bara visa under 30 min?

  // useMemo gör att den bara räknar om listan när du faktiskt ändrar ett filter
  const processedDishes = useMemo(() => {
    let result = [...initialDishes];

    // 1. Filtrera på protein om vi inte har valt 'all'
    if (proteinFilter !== 'all') {
      result = result.filter(dish => dish.proteinType === proteinFilter);
    }

    // 2. Filtrera på snabblagat om switchen är på
    if (quickFilter) {
      result = result.filter(dish => dish.isQuick);
    }

    // 3. Sortera resultatet
    result.sort((a, b) => {
      if (sortBy === 'a-z') return a.title.localeCompare(b.title);
      if (sortBy === 'z-a') return b.title.localeCompare(a.title);
      return 0;
    });

    return result;
  }, [initialDishes, sortBy, proteinFilter, quickFilter]);

  // Returnera all data och funktioner så de kan användas i dina komponenter
  return {
    processedDishes,
    sortBy,
    setSortBy,
    proteinFilter,
    setProteinFilter,
    quickFilter,
    setQuickFilter
  };
}