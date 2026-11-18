import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Page, ErrorNotice } from '../components/Page';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { api } from '../api';
import { messageOf } from '../api/client';
import { passwordError } from '../lib/validation';

export function AccountScreen() {
  const { user, logout } = useAuth();
  const { favorites } = useCatalog();
  const navigate = useNavigate();
  if (!user) return null;
  return <section className="min-h-screen bg-gray-50 pb-28">
    <header className="bg-gradient-to-br from-violet-950 to-violet-600 px-5 pt-12 pb-8 rounded-b-3xl">
      <div className="flex items-center gap-4"><span className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/60 flex items-center justify-center text-2xl text-white font-bold" aria-hidden="true">{user.nome.slice(0, 1)}</span>
        <div className="min-w-0"><h1 className="font-display font-bold text-xl text-white break-words">{user.nome}</h1><p className="text-violet-200 text-xs mt-1 break-all">{user.email}</p><p className="text-violet-200 text-xs mt-2">{user.tipo_usuario.replaceAll('_', ' ')}</p></div>
      </div>
      <div className="mt-5 bg-white/15 rounded-2xl px-4 py-3 text-white text-sm"><strong>{favorites.length}</strong> hospedagens favoritas nesta sessão</div>
    </header>
    <div className="p-5 flex flex-col gap-3">
      {[
        ['✏️', 'Editar perfil', 'Nome, telefone e data de nascimento', '/app/edit-profile'],
        ['🔒', 'Segurança', 'Alterar sua senha', '/app/security'],
        ['♡', 'Favoritos', 'Lugares que você salvou', '/app/favorites'],
        ['📅', 'Minhas reservas', 'Acompanhar rascunhos e solicitações', '/app/reservations'],
        ['🧭', 'Área do guia', 'Em desenvolvimento', '/guia'],
        ['🏨', 'Área da hospedagem', 'Em desenvolvimento', '/hotel'],
        ['💬', 'Ajuda e SAC', 'Em desenvolvimento', '/app/chat'],
      ].map(([icon, label, subtitle, path]) => <Link key={path} to={path} className="card flex items-center gap-4"><span className="text-xl w-8 text-center" aria-hidden="true">{icon}</span><div className="flex-1"><p className="font-bold text-sm">{label}</p><p className="text-xs text-gray-500 mt-1">{subtitle}</p></div><span className="text-gray-400" aria-hidden="true">›</span></Link>)}
      <button className="mt-2 border border-red-200 rounded-2xl bg-red-50 text-red-700 font-semibold py-4" onClick={() => { logout(); navigate('/login', { replace: true }); }}>Sair da conta</button>
    </div>
  </section>;
}

export function EditAccountScreen() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.nome || '');
  const [phone, setPhone] = useState(user?.telefone || '');
  const [birth, setBirth] = useState(user?.data_nascimento?.slice(0, 10) || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const changed = name !== user?.nome || phone !== (user?.telefone || '') || birth !== (user?.data_nascimento?.slice(0, 10) || '');
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    setSaved(false); setError('');
    if (birth && birth > new Date().toISOString().slice(0, 10)) { setError('A data de nascimento não pode estar no futuro.'); return; }
    setLoading(true);
    try { await updateProfile({ nome: name.trim(), telefone: phone || null, data_nascimento: birth || null }); setSaved(true); }
    catch (e) { setError(messageOf(e)); }
    finally { setLoading(false); }
  }
  return <Page title="Editar perfil" back="/app/profile"><form onSubmit={save} className="card flex flex-col gap-5">
    {error && <ErrorNotice message={error} />}{saved && <p role="status" className="notice">Perfil atualizado com sucesso.</p>}
    <label className="field-label">Nome completo<input className="form-input mt-2" autoComplete="name" value={name} onChange={e => { setName(e.target.value); setSaved(false); }} required maxLength={120} /></label>
    <label className="field-label">E-mail<input className="form-input mt-2 bg-gray-100" value={user?.email} readOnly /></label>
    <p className="text-xs text-gray-500 -mt-3">O e-mail e o CPF não podem ser alterados por esta tela. Seu CPF não é exibido por privacidade.</p>
    <label className="field-label">Telefone<input className="form-input mt-2" type="tel" autoComplete="tel" value={phone} onChange={e => { setPhone(e.target.value); setSaved(false); }} maxLength={20} /></label>
    <label className="field-label">Data de nascimento<input className="form-input mt-2" type="date" value={birth} max={new Date().toISOString().slice(0, 10)} onChange={e => { setBirth(e.target.value); setSaved(false); }} /></label>
    <button className="primary-button" disabled={loading || !changed}>{loading ? 'Salvando…' : 'Salvar alterações'}</button>
    <Link className="secondary-button text-center" to="/app/profile">Voltar ao perfil</Link>
  </form></Page>;
}

export function PasswordScreen() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (loading) return;
    setError('');
    const invalid = passwordError(next);
    if (invalid) { setError(invalid); return; }
    if (next !== confirm) { setError('As senhas precisam ser iguais.'); return; }
    setLoading(true);
    try { await api.changePassword(current, next); logout('Senha alterada com sucesso. Entre novamente com sua nova senha.'); navigate('/login', { replace: true }); }
    catch (e) { setError(messageOf(e)); }
    finally { setLoading(false); }
  }
  return <Page title="Segurança" back="/app/profile"><form onSubmit={save} className="card flex flex-col gap-5">
    <h2 className="font-display font-bold">Alterar senha</h2><p className="text-sm text-gray-500">Após a alteração, entre novamente com a nova senha. As sessões anteriores serão revogadas.</p>
    {error && <ErrorNotice message={error} />}
    <label className="field-label">Senha atual<input type="password" autoComplete="current-password" className="form-input mt-2" value={current} onChange={e => setCurrent(e.target.value)} required /></label>
    <label className="field-label">Nova senha<input type="password" autoComplete="new-password" className="form-input mt-2" value={next} onChange={e => setNext(e.target.value)} minLength={10} maxLength={72} required /></label>
    <label className="field-label">Confirmar nova senha<input type="password" autoComplete="new-password" className="form-input mt-2" value={confirm} onChange={e => setConfirm(e.target.value)} minLength={10} maxLength={72} required /></label>
    <button className="primary-button" disabled={loading}>{loading ? 'Alterando…' : 'Alterar senha'}</button>
  </form><p className="notice">Autenticação em dois fatores e recuperação por e-mail estão previstas para uma próxima etapa.</p></Page>;
}
