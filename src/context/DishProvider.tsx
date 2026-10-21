import { useCallback, useRef, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { DishContext } from './DishContext';
import type { Dish, DishStatus } from '../types/dish';
import type { MealPlanDay } from '../types/mealPlan';
import { supabase } from '../services/supabaseClient';
import { createDish, fetchDishes } from '../services/api';
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
  const [dishActionNotice, setDishActionNotice] = useState<{
    message: string;
    type: 'error' | 'status';
  } | null>(null);

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

  const updateDishStatus = useCallback(async (
    id: string,
    newStatus: DishStatus | undefined
  ): Promise<boolean> => {
    setDishActionNotice(null);
    if (!requireAuth(AUTH_REQUIRED_MESSAGE)) return false;
    if (!user) return false;

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
        setDishActionNotice({
          message: `Kunde inte spara ändringen i din lista: ${result.error.message}`,
          type: 'error',
        });
        return false;
      }
    } catch (error) {
      console.error('Ett oväntat fel inträffade när personlig maträttsstatus sparades:', error);
      setDishActionNotice({
        message: 'Ett oväntat fel inträffade när ändringen i din lista skulle sparas.',
        type: 'error',
      });
      return false;
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
    return true;
  }, [requireAuth, user]);

  const addDish = async (newDish: Omit<Dish, 'id'>): Promise<Dish | null> => {
    setDishActionNotice(null);
    if (!requireAuth(AUTH_REQUIRED_MESSAGE)) return null;
    if (!user) {
      return null;
    }

    const normalizedTitle = normalizeDishTitle(newDish.title);
    let savedDish = dishes.find(
      dish => normalizeDishTitle(dish.title) === normalizedTitle
    ) ?? null;

    if (!savedDish) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session || sessionData.session.user.id !== user.id) {
        const message = sessionError?.message ?? 'Din inloggning kunde inte verifieras.';
        console.error('Kunde inte verifiera sessionen för att spara en gemensam maträtt:', sessionError ?? message);
        setDishActionNotice({
          message: `Maträtten kunde inte sparas i den gemensamma receptbanken: ${message}`,
          type: 'error',
        });
        return null;
      }

      try {
        const data = await createDish(
          {
            ...newDish,
            title: newDish.title.trim(),
          },
          sessionData.session.access_token,
        );
        savedDish = parseDish(data);
      } catch (error) {
        console.error('Kunde inte spara den gemensamma maträtten via servern:', error);
        const message = error instanceof Error ? error.message : 'Okänt serverfel.';
        setDishActionNotice({
          message: `Maträtten kunde inte sparas i den gemensamma receptbanken: ${message}`,
          type: 'error',
        });
        return null;
      }
    }

    if (!savedDish) {
      setDishActionNotice({
        message: 'Servern returnerade en ogiltig maträtt efter sparning.',
        type: 'error',
      });
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
      setDishActionNotice({
        message: `Maträtten finns i den gemensamma receptbanken, men kunde inte läggas i din JA-lista: ${statusError.message}`,
        type: 'error',
      });
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
    setDishActionNotice(null);
    if (!requireAuth(AUTH_REQUIRED_MESSAGE)) return;

    const yesDishes = dishes.filter(dish => userDishStatusesRef.current[dish.id] === 'yes');
    if (yesDishes.length === 0) {
      setDishActionNotice({
        message: 'Du har inga rätter i Ja-listan att slumpa fram!',
        type: 'status',
      });
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
    setDishActionNotice(null);
    if (!requireAuth(AUTH_REQUIRED_MESSAGE)) return;

    const yesDishes = dishes.filter(dish => userDishStatusesRef.current[dish.id] === 'yes');
    if (yesDishes.length === 0) {
      setDishActionNotice({
        message: 'Du har inga rätter i Ja-listan att slumpa fram!',
        type: 'status',
      });
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
      dishActionNotice,
      clearDishActionNotice: () => setDishActionNotice(null),
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