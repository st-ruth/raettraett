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

jest.unstable_mockModule('lucide-react', () => ({
  Dices: () => null,
  MessageSquareMore: () => null,
  Clock: () => null,
  Ghost: () => null,
  Hourglass: () => null,
}));

const { default: Home } = await import('../src/pages/Home');

const endpoint = 'http://localhost:3000/api/dishes';
const authenticatedTestContext: AuthContextType = {
  user: null,
  loading: false,
  signOut: async () => {},
  authPrompt: null,
  requireAuth: () => true,
  clearAuthPrompt: () => {},
};

const originalFetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
let fetchMock: jest.MockedFunction<typeof fetch>;

function makeDish(
  id: string,
  title: string,
  proteinType: Dish['proteinType'],
  isQuick = false,
): Dish {
  return { id, title, proteinType, preferredDays: 'both', isQuick };
}

function jsonResponse<T>(body: T): Response {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  } as Response;
}

beforeEach(() => {
  fetchMock = jest.fn<typeof fetch>();
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    writable: true,
    value: fetchMock,
  });
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();

  if (originalFetchDescriptor) {
    Object.defineProperty(globalThis, 'fetch', originalFetchDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, 'fetch');
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
    const notInYesList = makeDish('not-yes', 'Inte i JA-listan', 'pork');
    const personalYes = makeDish('personal-yes', 'Min JA-rätt', 'chicken');
    fetchMock.mockResolvedValueOnce(jsonResponse([notInYesList, personalYes]));
    jest.spyOn(Math, 'random').mockReturnValue(0);

    function TestControls() {
      const { dishes, mealPlan, updateDishStatus } = useDishContext();
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
      expect(screen.getByTestId('loaded-dish-count').textContent).toBe('2');
    });

    fireEvent.click(screen.getByRole('button', { name: 'Markera personlig JA' }));
    fireEvent.click(screen.getByRole('button', { name: 'Slumpa om dagens rätt' }));

    await waitFor(() => {
      expect(screen.getByTestId('selected-dish').textContent).toBe('Min JA-rätt');
    });
    expect(screen.queryByText('Inte i JA-listan')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(endpoint);
  });

  it('sparar en ny rätt via POST och lägger till den med eget ID och JA-status', async () => {
    const newDish = {
      title: 'Hemlagad rätt',
      proteinType: 'fish',
      preferredDays: 'weekends',
      isQuick: true,
    } satisfies Omit<Dish, 'id'>;

    fetchMock
      .mockResolvedValueOnce(jsonResponse([]))
      .mockImplementationOnce(async (_input, init) => {
        const postedDish = JSON.parse(String(init?.body)) as Dish;
        return jsonResponse(postedDish);
      });

    const wrapper = ({ children }: PropsWithChildren) => (
      <AuthContext.Provider value={authenticatedTestContext}>
        <DishProvider>{children}</DishProvider>
      </AuthContext.Provider>
    );
    const { result } = renderHook(() => useDishContext(), { wrapper });
    let createdDish: Dish | undefined;

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
    await act(async () => {
      createdDish = await result.current.addDish(newDish);
    });

    if (!createdDish) {
      throw new Error('addDish returnerade ingen sparad maträtt.');
    }
    expect(createdDish.id).toEqual(expect.any(String));
    expect(createdDish.id).not.toBe('');
    expect(result.current.dishes).toContainEqual(createdDish);
    expect(result.current.userDishStatuses[createdDish.id]).toBe('yes');

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      endpoint,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const postOptions = fetchMock.mock.calls[1]?.[1];
    expect(JSON.parse(String(postOptions?.body))).toEqual({
      ...newDish,
      id: createdDish.id,
    });
  });

  it('stoppar sparning och begär inloggning för en utloggad besökare', async () => {
    const requestLogin = jest.fn(() => false);
    const unauthenticatedContext: AuthContextType = {
      ...authenticatedTestContext,
      requireAuth: requestLogin,
    };
    fetchMock.mockResolvedValueOnce(jsonResponse([]));

    const wrapper = ({ children }: PropsWithChildren) => (
      <AuthContext.Provider value={unauthenticatedContext}>
        <DishProvider>{children}</DishProvider>
      </AuthContext.Provider>
    );
    const { result } = renderHook(() => useDishContext(), { wrapper });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
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
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
