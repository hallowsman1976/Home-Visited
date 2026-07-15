import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { apiPost } from '../lib/api';
import type { AuthUser, LoginData } from '../types/api';

const TOKEN_KEY = 'inhomesss_session_token';
const EXPIRY_KEY = 'inhomesss_session_expiry';

interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  token: string;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '');
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(EXPIRY_KEY);
    setToken(''); setUser(null);
  }, []);

  useEffect(() => {
    const expiry = sessionStorage.getItem(EXPIRY_KEY);
    if (!token || !expiry || new Date(expiry).getTime() <= Date.now()) { clearSession(); setLoading(false); return; }
    apiPost<{ user: AuthUser }>('auth.me', {}, token).then((data) => setUser(data.user)).catch(clearSession).finally(() => setLoading(false));
  }, [token, clearSession]);

  const login = async (username: string, password: string) => {
    const data = await apiPost<LoginData>('auth.login', { username, password });
    sessionStorage.setItem(TOKEN_KEY, data.sessionToken); sessionStorage.setItem(EXPIRY_KEY, data.expiresAt);
    setToken(data.sessionToken); setUser(data.user);
  };

  const logout = async () => {
    try { if (token) await apiPost('auth.logout', {}, token); } finally { clearSession(); }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    await apiPost<{ changed: boolean }>('auth.changePassword', { currentPassword, newPassword }, token);
    setUser((current) => current ? { ...current, mustChangePassword: false } : current);
  };

  const value = useMemo(() => ({ user, loading, login, logout, changePassword, token }), [user, loading, token]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
