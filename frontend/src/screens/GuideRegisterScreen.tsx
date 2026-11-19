
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import Logo from '../components/Logo';
import { api } from '../api';
import { messageOf } from '../api/client';
import { ErrorNotice } from '../components/Page';
import { isValidCpf, passwordError } from '../lib/validation';
import { maskCpf, maskPhone } from '../lib/masks';

export default function GuideRegisterScreen() {
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [form, setForm] = useState({
    name: '',
    cpf: '',
    birth: '',
    phone: '',
    email: '',
    password: '',
    confirm: '',
    especialidade: '',
    areaAtuacao: '',
    descricao: '',
    servicos: '',
  });

  const update = (key: string, value: string) => {
    setForm(previous => ({ ...previous, [key]: value }));
  };

  const inputClass =
    'w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all bg-gray-50';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (loading) return;

    setError('');

    if (!isValidCpf(form.cpf)) {
      setError('Informe um CPF válido.');
      return;
    }

    const invalidPassword = passwordError(form.password);

    if (invalidPassword) {
      setError(invalidPassword);
      return;
    }

    if (form.password !== form.confirm) {
      setError('As senhas precisam ser iguais.');
      return;
    }

    if (form.birth > new Date().toISOString().slice(0, 10)) {
      setError('A data de nascimento não pode estar no futuro.');
      return;
    }

    setLoading(true);

    try {
      const result = await api.registerGuide({
        nome: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        cpf: form.cpf,
        senha: form.password,
        telefone: form.phone || null,
        data_nascimento: form.birth || null,
        especialidade: form.especialidade.trim() || undefined,
        area_atuacao: form.areaAtuacao.trim() || undefined,
        descricao: form.descricao.trim() || undefined,
        servicos_oferecidos: form.servicos.trim() || undefined,
      });

      setSuccessMessage(
        result.message ||
          'Cadastro recebido! Aguarde a aprovação da equipe HospedJá.',
      );
    } catch (submitError) {
      setError(messageOf(submitError));
    } finally {
      setLoading(false);
    }
  };

  if (successMessage) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <div
          className="px-6 pt-14 pb-10 rounded-b-3xl"
          style={{
            background: 'linear-gradient(135deg, #4C1D95, #7C3AED)',
          }}
        >
          <Logo size={36} variant="full" light />

          <h1 className="font-display text-2xl font-bold text-white mt-8">
            Cadastro recebido!
          </h1>

          <p className="text-violet-200 text-sm mt-2">
            Estamos felizes por ter você com a gente.
          </p>
        </div>

        <div className="flex-1 px-6 py-10 flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 12.5L9.5 17L19 7"
                stroke="#15803D"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2 className="text-xl font-bold text-gray-900">
            Tudo certo com seu cadastro
          </h2>

          <p className="text-sm text-gray-600 leading-relaxed mt-4">
            {successMessage}
          </p>

          <div className="w-full rounded-2xl bg-violet-50 border border-violet-100 p-5 mt-8 text-left">
            <p className="font-semibold text-violet-900 text-sm">
              Próxima etapa
            </p>

            <p className="text-sm text-violet-800 mt-2 leading-relaxed">
              Nossa equipe analisará suas informações profissionais.
              Enquanto a aprovação estiver pendente, seu perfil não
              aparecerá no catálogo público de guias.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/login', { replace: true })}
            className="w-full py-4 rounded-2xl font-semibold text-white text-base mt-8"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
            }}
          >
            Ir para o login
          </button>

          <Link
            to="/"
            className="text-violet-600 font-semibold text-sm mt-5"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div
        className="px-6 pt-14 pb-8 rounded-b-3xl"
        style={{
          background: 'linear-gradient(135deg, #4C1D95, #7C3AED)',
        }}
      >
        <button
          type="button"
          aria-label="Voltar ao cadastro"
          onClick={() => navigate('/register')}
          className="mb-4"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <Logo size={36} variant="full" light />

        <h1 className="font-display text-2xl font-bold text-white mt-6">
          Cadastro de Guia
        </h1>

        <p className="text-violet-200 text-sm mt-1">
          Faça parte da comunidade de profissionais HospedJá.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 px-6 py-6 flex flex-col gap-4"
      >
        {error && <ErrorNotice message={error} />}

        <div>
          <h2 className="font-bold text-gray-900 text-base">
            Dados pessoais
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Informe seus dados para criar sua conta.
          </p>
        </div>

        <input
          className={inputClass}
          maxLength={120}
          autoComplete="name"
          aria-label="Nome completo"
          placeholder="Nome completo"
          value={form.name}
          onChange={event => update('name', event.target.value)}
          required
        />

        <input
          className={inputClass}
          inputMode="numeric"
          aria-label="CPF"
          placeholder="CPF (000.000.000-00)"
          value={form.cpf}
          onChange={event => update('cpf', maskCpf(event.target.value))}
          required
        />

        <input
          className={inputClass}
          type="date"
          aria-label="Data de nascimento"
          max={new Date().toISOString().slice(0, 10)}
          value={form.birth}
          onChange={event => update('birth', event.target.value)}
          required
        />

        <input
          className={inputClass}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          aria-label="Telefone com DDD"
          placeholder="Telefone com DDD"
          value={form.phone}
          onChange={event => update('phone', maskPhone(event.target.value))}
          required
        />

        <input
          className={inputClass}
          type="email"
          autoComplete="email"
          maxLength={190}
          aria-label="E-mail"
          placeholder="E-mail"
          value={form.email}
          onChange={event => update('email', event.target.value)}
          required
        />

        <input
          className={inputClass}
          type="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={72}
          aria-label="Senha"
          placeholder="Senha (mínimo 10 caracteres)"
          value={form.password}
          onChange={event => update('password', event.target.value)}
          required
        />

        <input
          className={inputClass}
          type="password"
          autoComplete="new-password"
          minLength={10}
          maxLength={72}
          aria-label="Confirmar senha"
          placeholder="Confirmar senha"
          value={form.confirm}
          onChange={event => update('confirm', event.target.value)}
          required
        />

        <div className="pt-4 border-t border-gray-100">
          <h2 className="font-bold text-gray-900 text-base">
            Perfil profissional
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Conte um pouco sobre sua experiência e os serviços que oferece.
          </p>
        </div>

        <input
          className={inputClass}
          maxLength={120}
          aria-label="Especialidade"
          placeholder="Especialidade (ex.: Ecoturismo)"
          value={form.especialidade}
          onChange={event => update('especialidade', event.target.value)}
        />

        <input
          className={inputClass}
          maxLength={150}
          aria-label="Área de atuação"
          placeholder="Área de atuação (ex.: Uberlândia e região)"
          value={form.areaAtuacao}
          onChange={event => update('areaAtuacao', event.target.value)}
        />

        <textarea
          className={`${inputClass} min-h-28 resize-y`}
          maxLength={2000}
          aria-label="Descrição profissional"
          placeholder="Conte sobre você e sua experiência como guia..."
          value={form.descricao}
          onChange={event => update('descricao', event.target.value)}
        />

        <textarea
          className={`${inputClass} min-h-28 resize-y`}
          maxLength={2000}
          aria-label="Serviços oferecidos"
          placeholder="Quais serviços e experiências você oferece?"
          value={form.servicos}
          onChange={event => update('servicos', event.target.value)}
        />

        <div className="rounded-xl bg-violet-50 border border-violet-100 p-4">
          <p className="text-sm font-semibold text-violet-900">
            Atenção: aprovação necessária
          </p>
          <p className="text-xs text-violet-800 mt-1 leading-relaxed">
            Após o envio, seu cadastro ficará pendente de análise pela
            equipe HospedJá. Seu perfil só será disponibilizado no catálogo
            depois da aprovação.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl font-semibold text-white text-base transition-all disabled:opacity-60"
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
          }}
        >
          {loading ? 'Enviando cadastro...' : 'Enviar cadastro'}
        </button>

        <p className="text-center text-sm text-gray-500">
          Já tem conta?{' '}
          <Link to="/login" className="text-violet-600 font-semibold">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  );
}
