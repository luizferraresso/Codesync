import { createClient } from './client';
import type { User, Registration, ProfilePatch, HotelRecord, RoomRecord, GuideRecord, ReservationRecord, ReservationDraft } from './types';

// Somente o token da aba é guardado; senhas e documentos nunca são persistidos no navegador.
const storageKey = 'hospedja.session';
function readToken() { try { return sessionStorage.getItem(storageKey); } catch { return null; } }
let token = readToken();
export function setToken(next: string | null) {
  token = next;
  try { if (next) sessionStorage.setItem(storageKey, next); else sessionStorage.removeItem(storageKey); } catch { /* sessão em memória */ }
}
export const hasToken = () => Boolean(token);
const request = createClient({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  getToken: () => token,
  onUnauthorized: usedToken => {
    if (usedToken !== token) return;
    setToken(null);
    window.dispatchEvent(new Event('hospedja:unauthorized'));
  },
});
const json = (method: string, body: unknown) => ({ method, body: JSON.stringify(body) });
async function listAll<T>(resource: string, signal?: AbortSignal): Promise<T[]> {
  const items: T[] = [];
  for (let offset = 0; offset <= 1000000; offset += 100) {
    const page = await request<T[]>(`/${resource}?limit=100&offset=${offset}`, { signal });
    items.push(...page);
    if (page.length < 100) break;
  }
  return items;
}
export const api = {
  login: (email: string, senha: string) => request<{ token: string; user: User }>('/auth/login', json('POST', { email, senha })),
  register: (data: Registration) => request<User>('/auth/register', json('POST', data)),
  me: () => request<User>('/usuarios/me'),
  updateProfile: (data: ProfilePatch) => request<User>('/usuarios/me', json('PATCH', data)),
  changePassword: (atual: string, nova: string) => request<void>('/auth/password', json('PATCH', { atual, nova })),
  hotels: (signal?: AbortSignal) => listAll<HotelRecord>('hoteis', signal),
  hotel: (id: string, signal?: AbortSignal) => request<HotelRecord>(`/hoteis/${encodeURIComponent(id)}`, { signal }),
  rooms: (signal?: AbortSignal) => listAll<RoomRecord>('quartos', signal),
  guides: (signal?: AbortSignal) => listAll<GuideRecord>('guias', signal),
  guide: (id: string, signal?: AbortSignal) => request<GuideRecord>(`/guias/${encodeURIComponent(id)}`, { signal }),
  reservations: () => request<ReservationRecord[]>('/reservas'),
  createDraft: (data: ReservationDraft) => request<ReservationRecord>('/reservas', json('POST', data)),
  cancelDraft: (id: string) => request<{ status: string }>(`/reservas/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
