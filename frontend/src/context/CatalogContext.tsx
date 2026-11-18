import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../api';
import { messageOf } from '../api/client';
import type { HotelRecord, RoomRecord, GuideRecord } from '../api/types';
import { useAuth } from './AuthContext';

type Catalog = {
  hotels: HotelRecord[]; rooms: RoomRecord[]; guides: GuideRecord[];
  loading: boolean; error: string; retry: () => void;
  favorites: string[]; toggleFavorite: (id: string) => void;
};
const Context = createContext<Catalog | null>(null);
export function CatalogProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [hotels, setHotels] = useState<HotelRecord[]>([]);
  const [rooms, setRooms] = useState<RoomRecord[]>([]);
  const [guides, setGuides] = useState<GuideRecord[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { setFavorites([]); }, [user?.id_usuario]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    Promise.all([api.hotels(controller.signal), api.rooms(controller.signal), api.guides(controller.signal)])
      .then(([h, r, g]) => {
        if (!controller.signal.aborted) {
          const active = h.filter(item => item.status === 'ATIVO');
          const hotelIds = new Set(active.map(item => String(item.id_hotel)));
          setHotels(active);
          setRooms(r.filter(item => item.status === 'DISPONIVEL' && hotelIds.has(String(item.id_hotel))));
          setGuides(g.filter(item => item.status === 'ATIVO' && item.status_aprovacao === 'APROVADO'));
        }
      })
      .catch(e => { if (!controller.signal.aborted) setError(messageOf(e)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt, user?.id_usuario]);
  const retry = useCallback(() => setAttempt(n => n + 1), []);
  const toggleFavorite = useCallback((id: string) => setFavorites(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]), []);
  const value = useMemo(() => ({ hotels, rooms, guides, loading, error, retry, favorites, toggleFavorite }),
    [hotels, rooms, guides, loading, error, retry, favorites, toggleFavorite]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useCatalog() {
  const value = useContext(Context);
  if (!value) throw new Error('CatalogProvider ausente');
  return value;
}
