import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { messageOf } from '../api/client';
import type { ReservationRecord } from '../api/types';
import { Empty, ErrorNotice, Page } from '../components/Page';
import { draftError } from '../lib/validation';
import { shortDate } from '../lib/format';
import ConfirmDialog from '../components/ConfirmDialog';

export function ReservationsListScreen() {
  const [items, setItems] = useState<ReservationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const alive = useRef(true);
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { const rows = await api.reservations(); if (alive.current) setItems(rows); }
    catch (e) { if (alive.current) setError(messageOf(e)); }
    finally { if (alive.current) setLoading(false); }
  }, []);
  useEffect(() => { alive.current = true; void load(); return () => { alive.current = false; }; }, [load]);
  async function cancel() {
    if (!cancelId || busy) return;
    setBusy(true); setError(''); setNotice('');
    try { await api.cancelDraft(cancelId); setCancelId(null); setNotice('Rascunho cancelado com sucesso.'); await load(); }
    catch (e) { setError(messageOf(e)); }
    finally { setBusy(false); }
  }
  return <Page title="Minhas reservas"><Link to="/app/booking" className="primary-button text-center">Criar rascunho de reserva</Link>
    <p className="notice">Os rascunhos registram datas e hóspedes. Ainda não reservam hotel ou quarto, não bloqueiam vagas e não geram cobrança.</p>
    {notice && <p role="status" className="notice">{notice}</p>}
    {loading && <p role="status" className="text-sm text-gray-500">Consultando suas reservas…</p>}
    {error && <ErrorNotice message={error} retry={() => void load()} />}
    {!loading && !error && (items.length ? items.map(r => <article key={r.id_reserva} className="card flex flex-col gap-3">
      <div className="flex justify-between gap-2"><h2 className="font-display text-sm font-bold">Reserva #{r.id_reserva}</h2><span className="text-[10px] text-violet-700 bg-violet-50 rounded-full px-3 py-1 font-bold">{r.status_codigo}</span></div>
      <p className="text-gray-700 text-sm">{shortDate(r.checkin)} → {shortDate(r.checkout)}</p>
      <p className="text-sm text-gray-500">{r.quantidade_hospedes} hóspede(s)</p>
      <p className="text-xs text-gray-500 break-all">Protocolo: {r.codigo_confirmacao}</p>
      {r.observacoes && <p className="text-sm text-gray-600 whitespace-pre-wrap">{r.observacoes}</p>}
      {r.status_codigo === 'PENDENTE' && <button onClick={() => { setCancelId(String(r.id_reserva)); setError(''); }} className="text-red-700 border border-red-100 rounded-xl py-3 text-sm font-semibold">Cancelar rascunho</button>}
    </article>) : <Empty>Você ainda não tem reservas. Salve um rascunho para começar a planejar.</Empty>)}
    {cancelId && <ConfirmDialog title={`Cancelar rascunho #${cancelId}?`} busy={busy} onDismiss={() => setCancelId(null)}>
        <p className="text-sm text-gray-600">O cancelamento será registrado e não pode ser desfeito. Rascunhos com pagamentos não podem ser cancelados por esta operação.</p>
        {error && <ErrorNotice message={error} />}
        <button autoFocus className="secondary-button" disabled={busy} onClick={() => setCancelId(null)}>Manter rascunho</button><button className="primary-button" disabled={busy} onClick={() => void cancel()}>{busy ? 'Cancelando…' : 'Confirmar cancelamento'}</button>
    </ConfirmDialog>}
  </Page>;
}

export function DraftScreen() {
  const navigate = useNavigate();
  const [checkin, setCheckin] = useState('');
  const [checkout, setCheckout] = useState('');
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<ReservationRecord | null>(null);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (loading || created) return;
    setError('');
    const invalid = draftError(checkin, checkout, guests);
    if (invalid) { setError(invalid); return; }
    setLoading(true);
    try { setCreated(await api.createDraft({ checkin, checkout, quantidade_hospedes: guests, observacoes: notes || null })); }
    catch (e) { setError(messageOf(e)); }
    finally { setLoading(false); }
  }
  return <Page title="Planejar reserva" back="/app/reservations">
    {created ? <div className="card text-center"><div className="text-4xl text-emerald-600 mb-4" aria-hidden="true">✓</div><h2 className="font-display text-xl font-bold">Rascunho salvo</h2><p role="status" className="text-sm text-gray-600 mt-3">Seu rascunho #{created.id_reserva} está pendente. Nenhuma hospedagem foi reservada e nenhum pagamento foi realizado.</p><p className="text-xs text-violet-600 break-all mt-3">Protocolo: {created.codigo_confirmacao}</p><button onClick={() => navigate('/app/reservations', { replace: true })} className="primary-button w-full mt-6">Ver minhas reservas</button></div> : <>
      <p className="notice">Salve suas datas e a quantidade de hóspedes como rascunho. A escolha de hotel, quarto, disponibilidade e pagamento ainda não está disponível.</p>
      <form onSubmit={save} className="card flex flex-col gap-5">
        {error && <ErrorNotice message={error} />}
        <label className="field-label">Check-in<input className="form-input mt-2" type="date" value={checkin} min={tomorrow} onChange={e => setCheckin(e.target.value)} required /></label>
        <label className="field-label">Check-out<input className="form-input mt-2" type="date" value={checkout} min={checkin || tomorrow} onChange={e => setCheckout(e.target.value)} required /></label>
        <label className="field-label">Hóspedes<input className="form-input mt-2" type="number" min={1} max={100} value={guests} onChange={e => setGuests(Number(e.target.value))} required /></label>
        <label className="field-label">Observações (opcional)<textarea rows={4} maxLength={2000} className="form-input mt-2 resize-y" value={notes} onChange={e => setNotes(e.target.value)} /></label>
        <button className="primary-button" disabled={loading}>{loading ? 'Salvando…' : 'Salvar rascunho'}</button>
      </form>
    </>}
  </Page>;
}
