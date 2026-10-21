import { useRef, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { DishContext } from './DishContext';
import type { Dish, DishStatus } from '../types/dish';
import type { MealPlanDay } from '../types/mealPlan';
import { supabase } from '../services/supabaseClient';
import { fetchDishes } from '../services/api';
import { useAuth } from './useAuth';
import { AUTH_REQUIRED_MESSAGE } from './AuthContext';

const preferredDayOptions = ['weekdays', 'weekends', 'both'] as const;
const dishStatusOptions = ['yes', 'no', 'maybe'] as const;
const carbOptions = [
  'pasta', 'rice', 'potatoes', 'salad', 'bulgur_couscous', 'noodles', 'bread', 'other',
] as const;
const proteinOptions = [
  'mince', 'chicken', 'sausage', 'meat', 'pork', 'fish', 'stew',
  'soup', 'cheese', 'egg', 'mushroom', 'pulled', 'legumes', 'other',
] as const;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isChoice = <T extends string>(
  options: readonly T[],
  value: unknown
): value is T => typeof value === 'string' && options.some(option => option === value);

const normalizeDishTitle = (title: string) => title.trim().toLowerCase();

const parseDish = (value: unknown): Dish | null => {
  if (!isRecord(value)) return null;

  const id =
    typeof value.id === 'string' && value.id.trim().length > 0
      ? value.id
      : typeof value.id === 'number' && Number.isSafeInteger(value.id)
        ? String(value.id)
        : null;

  const preferredDays = value.preferredDays ?? value.preferred_days;
  const proteinType = value.proteinType ?? value.protein_type;
  const carbType = value.carbType ?? value.carb_type;
  const isQuick = value.isQuick ?? value.is_quick;
  const isSlowCooked = value.isSlowCooked ?? value.is_slow_cooked;

  if (
    id === null ||
    typeof value.title !== 'string' ||
    value.title.trim().length === 0 ||
    !isChoice(preferredDayOptions, preferredDays) ||
    !isChoice(proteinOptions, proteinType) ||
    (value.category != null && typeof value.category !== 'string') ||
    (carbType != null && !isChoice(carbOptions, carbType)) ||
    (isQuick != null && typeof isQuick !== 'boolean') ||
    (isSlowCooked != null && typeof isSlowCooked !== 'boolean')
  ) {
    return null;
  }

  return {
    id,
    title: value.title,
    preferredDays,
    proteinType,
    ...(typeof value.category === 'string' ? { category: value.category } : {}),
    ...(isChoice(carbOptions, carbType) ? { carbType } : {}),
    ...(typeof isQuick === 'boolean' ? { isQuick } : {}),
    ...(typeof isSlowCooked === 'boolean' ? { isSlowCooked } : {}),
  };
};

const parseStatusRow = (value: unknown): [string, DishStatus] | null => {
  if (!isRecord(value)) return null;

  const dishId = value.dish_id;
  const status = value.status;
  return typeof dishId === 'string' && isChoice(dishStatusOptions, status)
    ? [dishId, status]
    : null;
};

// --- HJÄLPFUNKTION: Bygger ut matsedeln till 35 dagar ---
const generateFullPlan = (
  currentPlan: MealPlanDay[],
  availableDishes: Dish[],
  userDishStatuses: Record<string, DishStatus>
): MealPlanDay[] => {
  const yesDishes = availableDishes.filter(dish => userDishStatuses[dish.id] === 'yes');

  if (yesDishes.length === 0) return currentPlan;

  const today = new Date();
  const offsetToday = today.getTimezoneOffset() * 60000;
  const todayStr = new Date(today.getTime() - offsetToday).toISOString().slice(0, 10);

  // 1. Behåll historik
  const historyDays = currentPlan.filter(day => day.date < todayStr);

  // 2. Bygg kommande 35 dagar
  const upcomingDays: MealPlanDay[] = [];
  
  for (let i = 0; i < 35; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    
    const offset = d.getTimezoneOffset() * 60000;
    const dateStr = new Date(d.getTime() - offset).toISOString().slice(0, 10);
    
    const existingDay = currentPlan.find(p => p.date === dateStr);

    if (existingDay && existingDay.status === 'locked') {
      upcomingDays.push(existingDay);
    } else {
      const randomIndex = Math.floor(Math.random() * yesDishes.length);
      const randomDish = yesDishes[randomIndex];

      upcomingDays.push({
        ...(existingDay || {
          id: dateStr,
          date: dateStr,
          dayOfWeek: d.toLocaleDateString('sv-SE', { weekday: 'long' })
        }),
        status: 'generated',
        recipes: [randomDish]
      });
    }
  }

  return [...historyDays, ...upcomingDays];
};

export function DishProvider({ children }: { children: ReactNode }) {
  const { requireAuth, user } = useAuth();
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [dishLoadState, setDishLoadState] = useState<{
    userId: string | null;
    loading: boolean;
    error: string | null;
  }>({ userId: null, loading: true, error: null });
  const [userDishStatusState, setUserDishStatusState] = useState<{
    userId: string | null;
    statuses: Record<string, DishStatus>;
  }>({ userId: null, statuses: {} });
  const currentUserId = user?.id ?? null;
  const dishesLoading = dishLoadState.userId !== currentUserId || dishLoadState.loading;
  const dishesError = dishLoadState.userId === currentUserId ? dishLoadState.error : null;
  const userDishStatusesRef = useRef<Record<string, DishStatus>>({});
  const userDishStatuses = userDishStatusState.userId === currentUserId
    ? userDishStatusState.statuses
    : {};
  const [currentDish, setCurrentDish] = useState<Dish | null>(null);

  useEffect(() => {
    let isCurrentRequest = true;
    userDishStatusesRef.current = {};

    const fetchDishData = async () => {
      let errorMessage: string | null = null;
      try {
        const dishRequest = fetchDishes()
          .then(data => ({ data, error: null }))
          .catch(error => ({ data: null, error }));
        const [dishResult, statusResult] = await Promise.all([
          dishRequest,
          user
            ? supabase
              .from('user_dish_statuses')
              .select('dish_id, status')
              .eq('user_id', user.id)
            : Promise.resolve({ data: [], error: null }),
        ]);

        if (!isCurrentRequest) return;

        if (dishResult.error) {
          console.error('Kunde inte nå Express-servern för gemensamma maträtter:', dishResult.error);
          errorMessage = dishResult.error instanceof Error && dishResult.error.message.startsWith('HTTP ')
            ? 'Recepten kunde inte hämtas från servern. Försök igen senare.'
            : 'Kunde inte hämta recepten från servern. Kontrollera anslutningen och försök igen.';
          return;
        }

        const dishRows: unknown = dishResult.data;
        if (!Array.isArray(dishRows)) {
          console.error('Express-servern returnerade inte en lista med maträtter:', dishRows);
          errorMessage = 'Servern returnerade ett ogiltigt receptsvar.';
          return;
        }

        const parsedDishes = dishRows.map(parseDish);
        if (parsedDishes.some(dish => dish === null)) {
          console.error('Express-servern returnerade en eller flera ogiltiga maträtter:', dishRows);
          errorMessage = 'Servern returnerade recept med ogiltigt innehåll.';
          return;
        }

        if (statusResult.error) {
          console.error('Kunde inte hämta personliga maträttsstatusar:', statusResult.error);
          errorMessage = 'Dina personliga listor kunde inte hämtas. Försök igen senare.';
          return;
        }

        const statusRows: unknown = statusResult.data;
        if (!Array.isArray(statusRows)) {
          console.error('Supabase returnerade inte en lista med personliga maträttsstatusar:', statusRows);
          errorMessage = 'Dina personliga listor returnerade ett ogiltigt svar.';
          return;
        }

        const parsedStatuses = statusRows.map(parseStatusRow);
        if (parsedStatuses.some(status => status === null)) {
          console.error('Supabase returnerade en eller flera ogiltiga personliga maträttsstatusar:', statusRows);
          errorMessage = 'Dina personliga listor innehåller ogiltiga statusar.';
          return;
        }

        const catalogById = new Map<string, Dish>();
        parsedDishes.filter((dish): dish is Dish => dish !== null)
          .forEach(dish => catalogById.set(dish.id, dish));
        const seenTitles = new Set<string>();
        const mergedDishes = [...catalogById.values()].filter(dish => {
          const normalizedTitle = normalizeDishTitle(dish.title);
          if (seenTitles.has(normalizedTitle)) return false;
          seenTitles.add(normalizedTitle);
          return true;
        });
        const statuses = Object.fromEntries(
          parsedStatuses.filter((status): status is [string, DishStatus] => status !== null)
        );

        if (!isCurrentRequest) return;
        setDishes(mergedDishes);
        userDishStatusesRef.current = statuses;
        setUserDishStatusState({ userId: user?.id ?? null, statuses });

        const unseenDish = mergedDishes.find(dish => !statuses[dish.id]);
        setCurrentDish(unseenDish ?? null);
      } catch (error) {
        if (isCurrentRequest) {
          console.error('Ett oväntat fel inträffade när maträtter hämtades:', error);
          errorMessage = 'Ett oväntat fel inträffade när recepten skulle hämtas. Försök igen senare.';
        }
      } finally {
        if (isCurrentRequest) {
          setDishLoadState({
            userId: user?.id ?? null,
            loading: false,
            error: errorMessage,
          });
        }
      }
    };

    void fetchDishData();

    return () => {
      isCurrentRequest = false;
    };
  }, [user]);

  // Vi startar med en helt tom 35-dagarsplan istället för mockMealPlan
  const [mealPlan, setMealPlan] = useState<MealPlanDay[]>(() => {
    return generateFullPlan([], [], {});
  });

  const updateDishStatus = async (id: string, newStatus: DishStatus | undefined) => {
    if (!requireAuth(AUTH_REQUIRED_MESSAGE)) return;
    if (!user) return;

    try {
      const result = newStatus
        ? await supabase
          .from('user_dish_statuses')
          .upsert(
            { user_id: user.id, dish_id: id, status: newStatus },
            { onConflict: 'user_id,dish_id' }
          )
        : await supabase
          .from('user_dish_statuses')
          .delete()
          .eq('user_id', user.id)
          .eq('dish_id', id);

      if (result.error) {
        console.error('Kunde inte spara personlig maträttsstatus:', result.error);
        alert(`Kunde inte spara ändringen i din lista:\n${result.error.message}`);
        return;
      }
    } catch (error) {
      console.error('Ett oväntat fel inträffade när personlig maträttsstatus sparades:', error);
      alert('Ett oväntat fel inträffade när ändringen i din lista skulle sparas.');
      return;
    }

    const nextStatuses = { ...userDishStatusesRef.current };
    if (newStatus) {
      nextStatuses[id] = newStatus;
    } else {
      delete nextStatuses[id];
    }
    userDishStatusesRef.current = nextStatuses;
    setUserDishStatusState({ userId: user.id, statuses: nextStatuses });

    if (newStatus !== 'yes') {
      const today = new Date();
      const offset = today.getTimezoneOffset() * 60000;
      const todayStr = new Date(today.getTime() - offset).toISOString().slice(0, 10);

      setMealPlan(prevPlan =>
        prevPlan.map(day =>
          day.date >= todayStr
            ? { ...day, recipes: day.recipes.filter(recipe => recipe.id !== id) }
            : day
        )
      );
    }
  };

  const addDish = async (newDish: Omit<Dish, 'id'>): Promise<Dish | null> => {
    if (!requireAuth(AUTH_REQUIRED_MESSAGE)) return null;
    if (!user) {
      return null;
    }

    const normalizedTitle = normalizeDishTitle(newDish.title);
    let savedDish = dishes.find(
      dish => normalizeDishTitle(dish.title) === normalizedTitle
    ) ?? null;

    if (!savedDish) {
      const { data, error } = await supabase
        .from('shared_dishes')
        .insert({
          title: newDish.title.trim(),
          category: newDish.category ?? null,
          protein_type: newDish.proteinType,
          preferred_days: newDish.preferredDays,
          carb_type: newDish.carbType ?? null,
          is_quick: newDish.isQuick ?? false,
          is_slow_cooked: newDish.isSlowCooked ?? false,
        })
        .select('*')
        .single();

      if (error?.code === '23505') {
        const { data: duplicate, error: duplicateError } = await supabase
          .from('shared_dishes')
          .select('*')
          .eq('normalized_title', normalizedTitle)
          .single();
        if (duplicateError) {
          console.error('Kunde inte hitta den gemensamma maträtten efter en dubblettkonflikt:', duplicateError);
          alert(`Kunde inte hitta den befintliga maträtten:\n${duplicateError.message}`);
          return null;
        }
        savedDish = parseDish(duplicate);
      } else if (error) {
        console.error('Kunde inte spara den gemensamma maträtten:', error);
        alert(`Maträtten kunde inte sparas i den gemensamma receptbanken:\n${error.message}`);
        return null;
      } else {
        savedDish = parseDish(data);
      }
    }

    if (!savedDish) {
      alert('Supabase returnerade en ogiltig maträtt efter sparning.');
      return null;
    }

    const { error: statusError } = await supabase
      .from('user_dish_statuses')
      .upsert(
        { user_id: user.id, dish_id: savedDish.id, status: 'yes' },
        { onConflict: 'user_id,dish_id' }
      );

    if (statusError) {
      console.error('Den gemensamma maträtten sparades, men personlig JA-status kunde inte sparas:', statusError);
      alert(`Maträtten finns i den gemensamma receptbanken, men kunde inte läggas i din JA-lista:\n${statusError.message}`);
      setDishes(prevDishes => prevDishes.some(dish => dish.id === savedDish.id)
        ? prevDishes
        : [savedDish, ...prevDishes]);
      return null;
    }

    setDishes(prevDishes => prevDishes.some(dish => dish.id === savedDish.id)
      ? prevDishes
      : [savedDish, ...prevDishes]);

    const nextStatuses = { ...userDishStatusesRef.current, [savedDish.id]: 'yes' as const };
    userDishStatusesRef.current = nextStatuses;
    setUserDishStatusState({ userId: user.id, statuses: nextStatuses });
    return savedDish;
  };

  const randomizeDish = () => {
    const unseenDishes = dishes.filter(dish => !userDishStatusesRef.current[dish.id]);
    if (unseenDishes.length === 0) {
      setCurrentDish(null);
      return;
    }
    const randomIndex = Math.floor(Math.random() * unseenDishes.length);
    setCurrentDish(unseenDishes[randomIndex]);
  };

  const updateMealPlanDay = (updatedDay: MealPlanDay) => {
    if (!requireAuth(AUTH_REQUIRED_MESSAGE)) return;

    setMealPlan(prevPlan => {
      const dayExists = prevPlan.some(day => day.date === updatedDay.date);
      if (dayExists) {
        return prevPlan.map(day => day.date === updatedDay.date ? updatedDay : day);
      } else {
        return [...prevPlan, updatedDay].sort((a, b) => a.date.localeCompare(b.date));
      }
    });
  };

  const randomizeMealPlanDay = (date: string) => {
    if (!requireAuth(AUTH_REQUIRED_MESSAGE)) return;

    const yesDishes = dishes.filter(dish => userDishStatusesRef.current[dish.id] === 'yes');
    if (yesDishes.length === 0) {
      alert('Du har inga rätter i Ja-listan att slumpa fram!');
      return;
    }

    const randomDish = yesDishes[Math.floor(Math.random() * yesDishes.length)];
    setMealPlan(prevPlan => {
      const existingDay = prevPlan.find(day => day.date === date);
      if (existingDay?.status === 'locked') return prevPlan;

      // Parse as a local date to avoid shifting weekdays across time zones.
      const dayDate = new Date(`${date}T12:00:00`);
      const updatedDay: MealPlanDay = {
        ...(existingDay ?? {
          id: date,
          date,
          dayOfWeek: dayDate.toLocaleDateString('sv-SE', { weekday: 'long' }),
        }),
        status: 'generated',
        recipes: [randomDish],
      };

      return existingDay
        ? prevPlan.map(day => day.date === date ? updatedDay : day)
        : [...prevPlan, updatedDay].sort((a, b) => a.date.localeCompare(b.date));
    });
  };

  const randomizeMealPlan = () => {
    if (!requireAuth(AUTH_REQUIRED_MESSAGE)) return;

    const yesDishes = dishes.filter(dish => userDishStatusesRef.current[dish.id] === 'yes');
    if (yesDishes.length === 0) {
      alert('Du har inga rätter i Ja-listan att slumpa fram!');
      return;
    }

    setMealPlan(prevPlan => generateFullPlan(prevPlan, dishes, userDishStatusesRef.current));
  };

  return (
    <DishContext.Provider value={{ 
      dishes, 
      userDishStatuses,
      dishesLoading,
      dishesError,
      currentDish, 
      randomizeDish, 
      addDish,
      updateDishStatus,
      mealPlan,
      updateMealPlanDay,
      randomizeMealPlanDay,
      randomizeMealPlan
    }}>
      {children}
    </DishContext.Provider>
  );
}