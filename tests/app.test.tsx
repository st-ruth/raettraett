import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DishProvider } from '../src/context/DishProvider';
import { AuthContext, AUTH_REQUIRED_MESSAGE } from '../src/context/AuthContext';
import type { AuthContextType } from '../src/context/AuthContext';
import { useDishContext } from '../src/context/useDishContext';
import { useDishFilter } from '../src/hooks/useDishFilter';
import type { Dish } from '../src/types/dish';
import type { User } from '@supabase/supabase-js';

jest.unstable_mockModule('lucide-react', () => ({
  Dices: () => null,
  MessageSquareMore: () => null,
  Clock: () => null,
  Ghost: () => null,
  Hourglass: () => null,
}));

const { default: Home } = await import('../src/pages/Home');

const testUser = {
  id: 'test-user-id',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: '2026-01-01T00:00:00.000Z',
} satisfies User;
const authenticatedTestContext: AuthContextType = {
  user: testUser,
  loading: false,
  signOut: async () => {},
  authPrompt: null,
  requireAuth: () => true,
  clearAuthPrompt: () => {},
};

function makeDish(
  id: string,
  title: string,
  proteinType: Dish['proteinType'],
  isQuick = false,
): Dish {
  return { id, title, proteinType, preferredDays: 'both', isQuick };
}

const resetSupabaseMock = (globalThis as typeof globalThis & {
  __resetSupabaseMock?: () => void;
}).__resetSupabaseMock;
let originalFetchDescriptor: PropertyDescriptor | undefined;

beforeEach(() => {
  resetSupabaseMock?.();
  originalFetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    writable: true,
    value: jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [{
        id: 'json-dish',
        title: 'JSON-rätt',
        proteinType: 'mince',
        preferredDays: 'weekdays',
      }, {
        id: 'not-yes',
        title: 'Inte i JA-listan',
        protein_type: 'pork',
        preferred_days: 'both',
      }, {
        id: 'personal-yes',
        title: 'Min JA-rätt',
        protein_type: 'chicken',
        preferred_days: 'both',
      }],
    }),
  });
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  if (originalFetchDescriptor) {
    Object.defineProperty(globalThis, 'fetch', originalFetchDescriptor);
  } else {
    delete (globalThis as typeof globalThis & { fetch?: typeof fetch }).fetch;
  }
});

describe('rättRätt-enhetstester', () => {
  it('filtrerar maträtter på proteintyp och snabblagat samtidigt', () => {
    const dishes = [
      makeDish('chicken-fast', 'Snabb kyckling', 'chicken', true),
      makeDish('chicken-slow', 'Långsam kyckling', 'chicken'),
      makeDish('pork-fast', 'Snabbt fläsk', 'pork', true),
    ];
    const { result } = renderHook(() => useDishFilter(dishes));

    act(() => {
      result.current.setProteinFilter('chicken');
      result.current.setQuickFilter(true);
    });

    expect(result.current.processedDishes.map(dish => dish.id)).toEqual(['chicken-fast']);
  });

  it('slumpar på startsidan endast bland rätter som markerats JA personligen', async () => {
    const personalYes = makeDish('personal-yes', 'Min JA-rätt', 'chicken');
    jest.spyOn(Math, 'random').mockReturnValue(0);

    function TestControls() {
      const { dishes, mealPlan, updateDishStatus, userDishStatuses } = useDishContext();
      const today = new Date();
      const offset = today.getTimezoneOffset() * 60000;
      const todayString = new Date(today.getTime() - offset).toISOString().slice(0, 10);
      const selectedDish = mealPlan.find(day => day.date === todayString)?.recipes[0];

      return (
        <>
          <button type="button" onClick={() => updateDishStatus(personalYes.id, 'yes')}>
            Markera personlig JA
          </button>
          <output data-testid="loaded-dish-count">{dishes.length}</output>
          <output data-testid="personal-status">{userDishStatuses[personalYes.id] ?? ''}</output>
          <output data-testid="selected-dish">{selectedDish?.title ?? ''}</output>
        </>
      );
    }

    render(
      <MemoryRouter>
        <AuthContext.Provider value={authenticatedTestContext}>
          <DishProvider>
            <Home />
            <TestControls />
          </DishProvider>
        </AuthContext.Provider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('loaded-dish-count').textContent).toBe('3');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Markera personlig JA' }));
    await waitFor(() => {
      expect(screen.getByTestId('personal-status').textContent).toBe('yes');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Slumpa om dagens rätt' }));

    await waitFor(() => {
      expect(screen.getByTestId('selected-dish').textContent).toBe('Min JA-rätt');
    });
    expect(screen.queryByText('Inte i JA-listan')).toBeNull();
  });

  it('sparar en ny rätt via Supabase och lägger till den med JA-status', async () => {
    const newDish = {
      title: 'Hemlagad rätt',
      proteinType: 'fish',
      preferredDays: 'weekends',
      isQuick: true,
    } satisfies Omit<Dish, 'id'>;

    const wrapper = ({ children }: PropsWithChildren) => (
      <AuthContext.Provider value={authenticatedTestContext}>
        <DishProvider>{children}</DishProvider>
      </AuthContext.Provider>
    );
    const { result } = renderHook(() => useDishContext(), { wrapper });
    let createdDish: Dish | null | undefined;

    await waitFor(() => expect(result.current.dishes).toHaveLength(3));
    await act(async () => {
      createdDish = await result.current.addDish(newDish);
    });

    if (!createdDish) {
      throw new Error('addDish returnerade ingen sparad maträtt.');
    }
    expect(createdDish.id).toBe('42');
    expect(result.current.dishes).toContainEqual(createdDish);
    expect(result.current.userDishStatuses[createdDish.id]).toBe('yes');
  });

  it('håller personliga statusar åtskilda mellan användare', async () => {
    const firstWrapper = ({ children }: PropsWithChildren) => (
      <AuthContext.Provider value={authenticatedTestContext}>
        <DishProvider>{children}</DishProvider>
      </AuthContext.Provider>
    );
    const firstUser = renderHook(() => useDishContext(), { wrapper: firstWrapper });

    await waitFor(() => expect(firstUser.result.current.dishes).toHaveLength(3));
    await act(async () => {
      await firstUser.result.current.updateDishStatus('personal-yes', 'yes');
    });

    const secondUserContext = {
      ...authenticatedTestContext,
      user: { ...testUser, id: 'another-user-id' },
    } satisfies AuthContextType;
    const secondWrapper = ({ children }: PropsWithChildren) => (
      <AuthContext.Provider value={secondUserContext}>
        <DishProvider>{children}</DishProvider>
      </AuthContext.Provider>
    );
    const secondUser = renderHook(() => useDishContext(), { wrapper: secondWrapper });

    await waitFor(() => expect(secondUser.result.current.dishes).toHaveLength(3));
    expect(secondUser.result.current.userDishStatuses).toEqual({});
  });

  it('stoppar sparning och begär inloggning för en utloggad besökare', async () => {
    const requestLogin = jest.fn((message: string) => !message);
    const unauthenticatedContext: AuthContextType = {
      ...authenticatedTestContext,
      requireAuth: requestLogin,
    };
    const wrapper = ({ children }: PropsWithChildren) => (
      <AuthContext.Provider value={unauthenticatedContext}>
        <DishProvider>{children}</DishProvider>
      </AuthContext.Provider>
    );
    const { result } = renderHook(() => useDishContext(), { wrapper });

    await waitFor(() => expect(result.current.dishes).toHaveLength(3));
    let savedDish: Dish | null = null;
    await act(async () => {
      savedDish = await result.current.addDish({
        title: 'Gästmat',
        proteinType: 'fish',
        preferredDays: 'weekends',
      });
    });

    expect(savedDish).toBeNull();
    expect(requestLogin).toHaveBeenCalledWith(AUTH_REQUIRED_MESSAGE);
  });
});
