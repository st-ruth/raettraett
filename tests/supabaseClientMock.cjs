const sharedDishes = [
  {
    id: 'not-yes',
    title: 'Inte i JA-listan',
    protein_type: 'pork',
    preferred_days: 'both',
  },
  {
    id: 'personal-yes',
    title: 'Min JA-rätt',
    protein_type: 'chicken',
    preferred_days: 'both',
  },
];
const userDishStatuses = [];
let nextDishId = 42;
let statusWriteError = null;
let signupResult = { data: { user: null, session: null }, error: null };
let initialSession = {
  access_token: 'test-access-token',
  user: { id: 'test-user-id' },
};
const authStateListeners = new Set();

const resetSupabaseMock = () => {
  userDishStatuses.length = 0;
  nextDishId = 42;
  statusWriteError = null;
  signupResult = { data: { user: null, session: null }, error: null };
  initialSession = {
    access_token: 'test-access-token',
    user: { id: 'test-user-id' },
  };
  authStateListeners.clear();
};

globalThis.__resetSupabaseMock = resetSupabaseMock;
globalThis.__setStatusWriteError = error => {
  statusWriteError = error;
};
globalThis.__setSignupResult = result => {
  signupResult = result;
};
globalThis.__setInitialSession = session => {
  initialSession = session;
};

const supabase = {
  auth: {
    signInWithPassword: async () => ({ error: { message: 'Ogiltiga inloggningsuppgifter.' } }),
    signUp: async () => {
      if (signupResult.data.session) {
        for (const listener of authStateListeners) listener('SIGNED_IN', signupResult.data.session);
      }
      return signupResult;
    },
    signOut: async () => {
      for (const listener of authStateListeners) listener('SIGNED_OUT', null);
      return { error: null };
    },
    getSession: async () => ({
      data: {
        session: initialSession,
      },
      error: null,
    }),
    onAuthStateChange: callback => {
      authStateListeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe: () => authStateListeners.delete(callback),
          },
        },
      };
    },
  },
  from: (table) => {
    if (table === 'shared_dishes') {
      return {
        select: () => {
          let normalizedTitle;
          const query = {
            eq: (column, value) => {
              if (column === 'normalized_title') normalizedTitle = value;
              return query;
            },
            single: async () => ({
              data: sharedDishes.find(dish => dish.title.trim().toLowerCase() === normalizedTitle) ?? null,
              error: null,
            }),
            then: (resolve, reject) => Promise.resolve({
              data: sharedDishes,
              error: null,
            }).then(resolve, reject),
          };
          return query;
        },
        insert: (row) => ({
          select: () => ({
            single: async () => ({
              data: { ...row, id: String(nextDishId++) },
              error: null,
            }),
          }),
        }),
      };
    }

    if (table === 'user_dish_statuses') {
      return {
        select: () => {
          const filters = {};
          const query = {
            eq: (column, value) => {
              filters[column] = value;
              return query;
            },
            then: (resolve, reject) => Promise.resolve({
              data: userDishStatuses.filter(row =>
                Object.entries(filters).every(([column, value]) => row[column] === value)
              ),
              error: null,
            }).then(resolve, reject),
          };
          return query;
        },
        upsert: async (row) => {
          if (statusWriteError) return { error: statusWriteError };
          const index = userDishStatuses.findIndex(existing =>
            existing.user_id === row.user_id && existing.dish_id === row.dish_id
          );
          if (index >= 0) userDishStatuses[index] = row;
          else userDishStatuses.push(row);
          return { error: null };
        },
        delete: () => {
          const filters = {};
          const query = {
            eq: (column, value) => {
              filters[column] = value;
              if (column === 'dish_id') {
                for (let index = userDishStatuses.length - 1; index >= 0; index--) {
                  if (Object.entries(filters).every(([key, filterValue]) => userDishStatuses[index][key] === filterValue)) {
                    userDishStatuses.splice(index, 1);
                  }
                }
              }
              return query;
            },
            then: (resolve, reject) => Promise.resolve({ error: null }).then(resolve, reject),
          };
          return query;
        },
      };
    }

    throw new Error(`Unexpected Supabase table: ${table}`);
  },
};

module.exports = { supabase };
