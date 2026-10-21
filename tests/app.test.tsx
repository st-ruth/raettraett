import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { useCallback, useState, type PropsWithChildren } from 'react';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DishProvider } from '../src/context/DishProvider';
import { AuthContext, AUTH_REQUIRED_MESSAGE } from '../src/context/AuthContext';
import type { AuthContextType } from '../src/context/AuthContext';
import { ThemeContext } from '../src/context/theme-context';
import { useDishContext } from '../src/context/useDishContext';
import { useDishFilter } from '../src/hooks/useDishFilter';
import type { Dish } from '../src/types/dish';
import type { User } from '@supabase/supabase-js';

jest.unstable_mockModule('lucide-react', () => ({
  X: () => null,
  Dices: () => null,
  Dice5: () => null,
  Moon: () => null,
  Sun: () => null,
  LogIn: () => null,
  LogOut: () => null,
  CalendarDays: () => null,
  Home: () => null,
  Heart: () => null,
  ChevronLeft: () => null,
  ChevronRight: () => null,
  LockKeyhole: () => null,
  Trash2: () => null,
  MessageSquareMore: () => null,
  Clock: () => null,
  Ghost: () => null,
  Hourglass: () => null,
  Smile: () => null,
  Meh: () => null,
  Angry: () => null,
}));

const { default: Home } = await import('../src/pages/Home');
const { default: Randomizer } = await import('../src/pages/Randomizer');
const { default: AuthModal } = await import('../src/components/AuthModal');
const { default: Header } = await import('../src/components/Header');
const { default: CalendarPage } = await import('../src/pages/Calendar');

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

function HeaderAuthHarness() {
  const [user, setUser] = useState<User | null>(null);
  const [authPrompt, setAuthPrompt] = useState<string | null>(null);
  const requireAuth = useCallback((message: string) => {
    if (user) return true;
    setAuthPrompt(message);
    return false;
  }, [user]);
  const value: AuthContextType = {
    user,
    loading: false,
    signOut: async () => setUser(null),
    authPrompt,
    requireAuth,
    clearAuthPrompt: () => setAuthPrompt(null),
  };

  return (
    <AuthContext.Provider value={value}>
      <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {} }}>
        <MemoryRouter>
          <Header />
          <button type="button" onClick={() => setUser(testUser)}>Simulera lyckad inloggning</button>
        </MemoryRouter>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}

function CalendarAuthHarness({
  initialUser = null,
  initialLoading = false,
}: {
  initialUser?: User | null;
  initialLoading?: boolean;
}) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(initialLoading);
  const [authPrompt, setAuthPrompt] = useState<string | null>(null);
  const requireAuth = useCallback((message: string) => {
    if (user) return true;
    setAuthPrompt(message);
    return false;
  }, [user]);
  const value: AuthContextType = {
    user,
    loading,
    signOut: async () => setUser(null),
    authPrompt,
    requireAuth,
    clearAuthPrompt: () => setAuthPrompt(null),
  };

  return (
    <AuthContext.Provider value={value}>
      <ThemeContext.Provider value={{ theme: 'light', toggleTheme: () => {} }}>
        <MemoryRouter initialEntries={['/kalender']}>
          <DishProvider>
            <Header />
            <Link to="/">Startsida</Link>
            {loading && (
              <button type="button" onClick={() => setLoading(false)}>
                Slutför autentisering
              </button>
            )}
            <Routes>
              <Route path="/kalender" element={<CalendarPage />} />
              <Route path="/" element={<Link to="/kalender">Återgå till kalender</Link>} />
            </Routes>
          </DishProvider>
        </MemoryRouter>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}

function makeDish(
  id: string,
  title: string,
  proteinType: Dish['proteinType'],
  isQuick = false,
): Dish {
  return { id, title, proteinType, preferredDays: 'both', isQuick };
}

function DishActionNotice() {
  const { dishActionNotice } = useDishContext();
  return dishActionNotice ? (
    <p role={dishActionNotice.type === 'error' ? 'alert' : 'status'}>
      {dishActionNotice.message}
    </p>
  ) : null;
}

async function finishDishLoading() {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });
}

const resetSupabaseMock = (globalThis as typeof globalThis & {
  __resetSupabaseMock?: () => void;
}).__resetSupabaseMock;
const setStatusWriteError = (globalThis as typeof globalThis & {
  __setStatusWriteError?: (error: { message: string }) => void;
}).__setStatusWriteError;
let originalFetchDescriptor: PropertyDescriptor | undefined;
let originalScrollIntoViewDescriptor: PropertyDescriptor | undefined;

interface MockFetchResponse {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}

const makeFetchResponse = (body: unknown, status = 200) =>
  ({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }) satisfies MockFetchResponse;

beforeEach(() => {
  resetSupabaseMock?.();
  originalFetchDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch');
  originalScrollIntoViewDescriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
    configurable: true,
    value: jest.fn(),
  });
  Object.defineProperty(globalThis, 'fetch', {
    configurable: true,
    writable: true,
    value: () => Promise.resolve(makeFetchResponse([{
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
      }])),
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
  if (originalScrollIntoViewDescriptor) {
    Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScrollIntoViewDescriptor);
  } else {
    Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
  }
});

describe('rättRätt-enhetstester', () => {
  it('återställer AuthModal efter stängning och rensar formulärfel vid lägesbyte', async () => {
    const onClose = jest.fn();
    const renderAuthModal = (isOpen: boolean) =>
      isOpen ? <AuthModal isOpen onClose={onClose} /> : null;
    const { rerender } = render(renderAuthModal(true));

    fireEvent.change(screen.getByLabelText('E-post'), {
      target: { value: 'gammal@exempel.se' },
    });
    fireEvent.change(screen.getByLabelText('Lösenord'), {
      target: { value: 'secret-password' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Logga in' }));
    expect(await screen.findByText(/Fel vid inloggning/)).toBeTruthy();

    fireEvent.click(screen.getByText('Har du inget konto? Skapa ett här.'));
    expect(screen.queryByText(/Fel vid inloggning/)).toBeNull();
    expect(screen.getByRole('heading', { name: 'Skapa konto' })).toBeTruthy();

    rerender(renderAuthModal(false));
    rerender(renderAuthModal(true));
    expect((screen.getByLabelText('E-post') as HTMLInputElement).value).toBe('');
    expect(screen.getByLabelText('E-post').getAttribute('placeholder')).toBe('namn@exempel.se');
    expect((screen.getByLabelText('Lösenord') as HTMLInputElement).value).toBe('');
    expect(screen.getByRole('heading', { name: 'Logga in' })).toBeTruthy();

    fireEvent.change(screen.getByLabelText('E-post'), {
      target: { value: 'gammal@exempel.se' },
    });
    fireEvent.change(screen.getByLabelText('Lösenord'), {
      target: { value: 'secret-password' },
    });
    expect((screen.getByLabelText('E-post') as HTMLInputElement).value).toBe('gammal@exempel.se');
  });

  it('återställer autentiseringsformuläret genom Header när användaren loggar ut', async () => {
    render(<HeaderAuthHarness />);

    fireEvent.click(screen.getByRole('button', { name: 'Logga in' }));
    fireEvent.change(screen.getByLabelText('E-post'), {
      target: { value: 'gammal@exempel.se' },
    });
    fireEvent.change(screen.getByLabelText('Lösenord'), {
      target: { value: 'secret-password' },
    });
    const authForm = document.querySelector('form.auth-form');
    expect(authForm).not.toBeNull();
    fireEvent.submit(authForm!);
    expect(await screen.findByText(/Fel vid inloggning/)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Simulera lyckad inloggning' }));
    fireEvent.click(screen.getByRole('button', { name: 'Logga ut' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Logga in' }));

    expect((screen.getByLabelText('E-post') as HTMLInputElement).value).toBe('');
    expect(screen.getByLabelText('E-post').getAttribute('placeholder')).toBe('namn@exempel.se');
    expect((screen.getByLabelText('Lösenord') as HTMLInputElement).value).toBe('');
    expect(screen.queryByText(/Fel vid inloggning/)).toBeNull();
  });

  it('visar automatisk inloggning först efter autentisering och öppnar igen vid återbesök', async () => {
    render(<CalendarAuthHarness initialLoading />);
    await finishDishLoading();

    expect(screen.queryByRole('heading', { name: 'Logga in' })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Slutför autentisering' }));
    expect(await screen.findByRole('heading', { name: 'Logga in' })).toBeTruthy();
    expect(screen.getByText(
      'Logga in för att spara ändringar och använda personliga funktioner.',
      { selector: '.auth-info-notice' },
    )).toBeTruthy();
    expect(document.querySelector('.calendar-login-notice')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Stäng' }));
    fireEvent.click(screen.getByRole('button', { name: 'Byt till mörkt läge' }));
    expect(screen.queryByRole('heading', { name: 'Logga in' })).toBeNull();

    fireEvent.click(screen.getByRole('link', { name: 'Startsida' }));
    fireEvent.click(await screen.findByRole('link', { name: 'Återgå till kalender' }));
    expect(await screen.findByRole('heading', { name: 'Logga in' })).toBeTruthy();
  });

  it('öppnar inte automatiskt inloggningsrutan för inloggad användare', async () => {
    render(<CalendarAuthHarness initialUser={testUser} />);
    await finishDishLoading();

    expect(screen.queryByRole('heading', { name: 'Logga in' })).toBeNull();
    expect(screen.queryByText(AUTH_REQUIRED_MESSAGE)).toBeNull();
  });

  it('visar MonthModal-rubriken exakt som Matsedel', async () => {
    render(<CalendarAuthHarness initialUser={testUser} />);
    await finishDishLoading();

    fireEvent.click(screen.getByRole('button', { name: '30 DAGAR' }));
    const heading = await screen.findByRole('heading', { name: 'Matsedel' });
    expect(heading.textContent).toBe('Matsedel');
  });

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

  it('visar laddningsmeddelande tills recept hämtats', async () => {
    let resolveFetch: (response: MockFetchResponse) => void = () => {};
    const pendingFetch = new Promise<MockFetchResponse>(resolve => {
      resolveFetch = resolve;
    });
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: () => pendingFetch,
    });

    render(
      <AuthContext.Provider value={authenticatedTestContext}>
        <DishProvider>
          <Randomizer />
        </DishProvider>
      </AuthContext.Provider>,
    );

    expect(screen.getByRole('status').textContent).toBe('Hämtar recept...');
    resolveFetch(makeFetchResponse([{
        id: 'loaded-dish',
        title: 'Hämtad rätt',
        proteinType: 'fish',
        preferredDays: 'both',
      }]));

    expect(await screen.findByText('Hämtad rätt')).toBeTruthy();
  });

  it('visar ett felmeddelande om receptservern svarar med HTTP-fel', async () => {
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: () => Promise.resolve(makeFetchResponse(null, 503)),
    });

    render(
      <AuthContext.Provider value={authenticatedTestContext}>
        <DishProvider>
          <Randomizer />
        </DishProvider>
      </AuthContext.Provider>,
    );

    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage.textContent).toContain('Recepten kunde inte hämtas från servern.');
  });

  it('går inte vidare till nästa rätt när statusen inte kan sparas', async () => {
    setStatusWriteError?.({ message: 'Databasen är tillfälligt otillgänglig.' });

    render(
      <AuthContext.Provider value={authenticatedTestContext}>
        <DishProvider>
          <Randomizer />
          <DishActionNotice />
        </DishProvider>
      </AuthContext.Provider>,
    );

    expect(await screen.findByText('JSON-rätt')).toBeTruthy();
    const random = jest.spyOn(Math, 'random').mockReturnValue(0);
    fireEvent.click(screen.getByRole('button', { name: 'Ja, spara rätten som ja' }));

    const errorMessage = await screen.findByRole('alert');
    expect(errorMessage.textContent).toContain('Databasen är tillfälligt otillgänglig.');
    expect(screen.getByText('JSON-rätt')).toBeTruthy();
    expect(random).not.toHaveBeenCalled();
  });

  it('går vidare till nästa rätt efter en lyckad statussparning', async () => {
    render(
      <AuthContext.Provider value={authenticatedTestContext}>
        <DishProvider>
          <Randomizer />
        </DishProvider>
      </AuthContext.Provider>,
    );

    expect(await screen.findByText('JSON-rätt')).toBeTruthy();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    fireEvent.click(screen.getByRole('button', { name: 'Ja, spara rätten som ja' }));

    expect(await screen.findByText('Inte i JA-listan')).toBeTruthy();
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

  it('sparar en ny rätt via Express med sessionstoken och lägger till den med JA-status', async () => {
    const newDish = {
      title: 'Hemlagad rätt',
      proteinType: 'fish',
      preferredDays: 'weekends',
      isQuick: true,
    } satisfies Omit<Dish, 'id'>;
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      writable: true,
      value: (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        requests.push({ url, init });
        if (init?.method === 'POST') {
          return Promise.resolve(makeFetchResponse({
            id: '42',
            title: 'Hemlagad rätt',
            protein_type: 'fish',
            preferred_days: 'weekends',
            is_quick: true,
          }, 201));
        }
        return Promise.resolve(makeFetchResponse([{
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
        }]));
      },
    });

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
    const createRequest = requests.find(request => request.init?.method === 'POST');
    expect(createRequest?.url).toBe('http://localhost:3000/api/dishes');
    expect(createRequest?.init?.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-access-token',
    });
    expect(JSON.parse(String(createRequest?.init?.body))).toEqual(newDish);
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
