import { createContext } from 'react';
import type { User } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  authPrompt: string | null;
  requireAuth: (message: string) => boolean;
  clearAuthPrompt: () => void;
}

export const AUTH_REQUIRED_MESSAGE = 'Du måste logga in för att spara din matsedel!';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);