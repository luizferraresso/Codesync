import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import { useAuth } from '../context/AuthContext';
import { messageOf } from '../api/client';
import { ErrorNotice } from '../components/Page';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, notice } = useAuth();
  const location = useLocation();
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(''); setLoading(true);
    try {
      await login(email, password);
      const from = location.state?.from;
      navigate(typeof from === 'string' && from.startsWith('/app/') ? from : '/app/home', { replace: true });
    } catch (error) { setError(messageOf(error)); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div
        className="px-6 pt-14 pb-10 rounded-b-3xl"
        style={{ background: 'linear-gradient(135deg, #4C1D95, #7C3AED)' }}
      >
        <Logo size={40} variant="full" light />
        <div className="mt-8">
          <h1 className="font-display text-2xl font-bold text-white">Bem-vindo de volta!</h1>
          <p className="text-violet-200 text-sm mt-1">Faça login para continuar</p>
        </div>
      </div>

      <form onSubmit={handleLogin} className="flex-1 px-6 pt-8 pb-6 flex flex-col gap-5">
        {notice && <p role="status" className="notice">{notice}</p>}
        {location.state?.registered && <p role="status" className="notice">Conta criada com sucesso. Entre com seu e-mail e senha.</p>}
        {error && <ErrorNotice message={error} />}
        <div>
          <label htmlFor="login-email" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">E-mail</label>
          <div className="mt-1.5 relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/>
              <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <input
              id="login-email" autoComplete="email" type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all bg-gray-50"
              required
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label htmlFor="login-password" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Senha</label>
            <Link to="/forgot-password" className="text-xs text-violet-600 font-medium">Esqueci a senha</Link>
          </div>
          <div className="relative">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <input
              id="login-password" autoComplete="current-password" type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-10 pr-12 py-3.5 rounded-xl border border-gray-200 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all bg-gray-50"
              required
            />
            <button type="button" aria-label={showPwd ? "Ocultar senha" : "Mostrar senha"} onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                {showPwd ? (
                  <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="currentColor" strokeWidth="2"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="currentColor" strokeWidth="2"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2"/></>
                ) : (
                  <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></>
                )}
              </svg>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl font-semibold text-white text-base mt-2 transition-all active:scale-98 disabled:opacity-70"
          style={{ background: loading ? '#8B5CF6' : 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <Link to="/app/home" className="text-center text-sm font-semibold text-violet-600">Explorar sem entrar</Link>

        <p className="text-center text-sm text-gray-500 mt-auto pt-4">
          Não tem conta?{' '}
          <Link to="/register" className="text-violet-600 font-semibold">
            Criar conta
          </Link>
        </p>
      </form>
    </div>
  );
}
