import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api, hasToken, setToken } from '../api';
import { ApiError } from '../api/client';
import type { User, ProfilePatch } from '../api/types';

type Auth = {
  user: User | null; loading: boolean; unavailable: boolean; notice: string;
  login: (email: string, password: string) => Promise<void>;
  logout: (message?: string) => void; retry: () => Promise<void>;
  updateProfile: (patch: ProfilePatch) => Promise<void>;
};
const Context = createContext<Auth | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasToken);
  const [unavailable, setUnavailable] = useState(false);
  const [notice, setNotice] = useState('');
  const generation = useRef(0);
  const logout = useCallback((message = '') => {
    generation.current++;
    setToken(null); setUser(null); setLoading(false); setUnavailable(false);
    setNotice(message);
  }, []);
  const retry = useCallback(async () => {
    const current = ++generation.current;
    if (!hasToken()) { setLoading(false); return; }
    setLoading(true); setUnavailable(false);
    try {
      const profile = await api.me();
      if (current === generation.current) setUser(profile);
    } catch (error) {
      if (current === generation.current) {
        if (error instanceof ApiError && error.status === 401) logout();
        else setUnavailable(true);
      }
    } finally { if (current === generation.current) setLoading(false); }
  }, [logout]);
  useEffect(() => {
    void retry();
    const handleUnauthorized = () => logout('Sua sessão terminou. Entre novamente para continuar.');
    window.addEventListener('hospedja:unauthorized', handleUnauthorized);
    return () => { generation.current++; window.removeEventListener('hospedja:unauthorized', handleUnauthorized); };
  }, [retry, logout]);
  const login = async (email: string, password: string) => {
    setNotice('');
    const current = ++generation.current;
    const result = await api.login(email.trim().toLowerCase(), password);
    if (current !== generation.current) return;
    setToken(result.token); setUser(result.user); setUnavailable(false); setLoading(false);
  };
  const updateProfile = async (patch: ProfilePatch) => {
    const current = generation.current;
    const updated = await api.updateProfile(patch);
    if (current === generation.current) setUser(updated);
  };
  return <Context.Provider value={{ user, loading, unavailable, notice, login, logout, retry, updateProfile }}>{children}</Context.Provider>;
}
export function useAuth() {
  const value = useContext(Context);
  if (!value) throw new Error('AuthProvider ausente');
  return value;
}
