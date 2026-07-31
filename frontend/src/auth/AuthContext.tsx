import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { setAuthTokenResolver } from '@/api';
import type { LoginResponse } from '@/api/auth';

const AUTH_STORAGE_KEY = 'ripplemail.auth';

interface AuthUser {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
}

interface AuthState {
  token: string | null;
  user: AuthUser | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  login: (auth: LoginResponse) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): AuthState {
  if (typeof window === 'undefined') {
    return {
      token: null,
      user: null,
    };
  }

  const storedValue = window.localStorage.getItem(AUTH_STORAGE_KEY);

  if (!storedValue) {
    return {
      token: null,
      user: null,
    };
  }

  try {
    return JSON.parse(storedValue) as AuthState;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);

    return {
      token: null,
      user: null,
    };
  }
}

function persistAuthState(state: AuthState) {
  if (typeof window === 'undefined') {
    return;
  }

  if (!state.token || !state.user) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>(() => readStoredAuth());

  useEffect(() => {
    setAuthTokenResolver(() => authState.token);
    persistAuthState(authState);

    return () => {
      setAuthTokenResolver(null);
    };
  }, [authState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...authState,
      isAuthenticated: Boolean(authState.token && authState.user),
      login: (auth) => {
        setAuthState({
          token: auth.token,
          user: auth.user,
        });
      },
      logout: () => {
        setAuthState({
          token: null,
          user: null,
        });
      },
    }),
    [authState],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
