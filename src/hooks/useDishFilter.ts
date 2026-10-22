import { useState, useMemo } from 'react';
import type { Dish, ProteinType } from '../types/dish';

export type SortOption = 'a-z' | 'z-a';

export function useDishFilter(initialDishes: Dish[]) {
  const [sortBy, setSortBy] = useState<SortOption>('a-z');
  const [proteinFilter, setProteinFilter] = useState<ProteinType | 'all'>('all');
  const [quickFilter, setQuickFilter] = useState<boolean>(false); // Visa bara snabblagade rätter

  // Beräkna om listan när maträtterna eller filtren ändras
  const processedDishes = useMemo(() => {
    let result = [...initialDishes];

    if (proteinFilter !== 'all') {
      result = result.filter(dish => dish.proteinType === proteinFilter);
    }

    if (quickFilter) {
      result = result.filter(dish => dish.isQuick);
    }

    result.sort((a, b) => {
      if (sortBy === 'a-z') return a.title.localeCompare(b.title);
      if (sortBy === 'z-a') return b.title.localeCompare(a.title);
      return 0;
    });

    return result;
  }, [initialDishes, sortBy, proteinFilter, quickFilter]);

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