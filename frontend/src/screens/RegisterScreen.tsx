import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import Logo from "../components/Logo"
import { api } from "../api"
import { messageOf } from "../api/client"
import { ErrorNotice } from "../components/Page"
import { isValidCpf, passwordError } from "../lib/validation"
import { maskCpf, maskPhone } from "../lib/masks"

export default function RegisterScreen() {
  const type = "client"
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: "",
    cpf: "",
    birth: "",
    phone: "",
    email: "",
    password: "",
    confirm: "",
  })

  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setError("")
    if (!isValidCpf(form.cpf)) { setError("Informe um CPF válido."); return }
    const invalidPassword = passwordError(form.password)
    if (invalidPassword) { setError(invalidPassword); return }
    if (form.password !== form.confirm) { setError("As senhas precisam ser iguais."); return }
    if (form.birth && form.birth > new Date().toISOString().slice(0, 10)) { setError("A data de nascimento não pode estar no futuro."); return }
    setLoading(true)
    try {
      await api.register({ nome: form.name.trim(), email: form.email.trim().toLowerCase(), cpf: form.cpf,
        senha: form.password, telefone: form.phone || null, data_nascimento: form.birth || null })
      navigate("/login", { replace: true, state: { registered: true } })
    } catch (error) { setError(messageOf(error)) }
    finally { setLoading(false) }
  }

  const chooseType = (type: "client" | "guide") => {
    if (type === "guide") navigate("/register/guia")
  }

  const inputClass =
    "w-full px-4 py-3.5 rounded-xl border border-gray-200 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition-all bg-gray-50"

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div
        className="px-6 pt-14 pb-8 rounded-b-3xl"
        style={{ background: "linear-gradient(135deg, #4C1D95, #7C3AED)" }}
      >
        <button aria-label="Voltar ao login" onClick={() => navigate("/login")} className="mb-4">
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
          Criar Conta
        </h1>
        <p className="text-violet-200 text-sm mt-1">
          Como você quer usar o HospedJá?
        </p>
      </div>

      {/* Type selector */}
      <div className="px-6 pt-6">
        <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
          {(["client", "guide"] as const).map((t) => (
            <button
              key={t}
              onClick={() => chooseType(t)}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: type === t ? "#7C3AED" : "transparent",
                color: type === t ? "white" : "#6B7280",
              }}
            >
              {t === "client" ? "Sou Cliente" : "Sou Guia"}
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex-1 px-6 py-6 flex flex-col gap-4"
      >
        {error && <ErrorNotice message={error} />}
        <input
          className={inputClass}
          maxLength={120}
          autoComplete="name"
          aria-label="Nome completo"
          placeholder="Nome completo"
          value={form.name}
          onChange={(e) => update("name", e.target.value)}
          required
        />
        <input
          className={inputClass}
          inputMode="numeric"
          aria-label="CPF"
          placeholder="CPF (000.000.000-00)"
          value={form.cpf}
          onChange={(e) => update("cpf", maskCpf(e.target.value))}
          required
        />
        <input
          className={inputClass}
          type="date"
          aria-label="Data de nascimento"
          max={new Date().toISOString().slice(0, 10)}
          placeholder="Data de nascimento"
          value={form.birth}
          onChange={(e) => update("birth", e.target.value)}
          required
        />
        <input
          className={inputClass}
          aria-label="Telefone com DDD"
          autoComplete="tel"
          placeholder="Telefone com DDD"
          value={form.phone}
          onChange={(e) => update("phone", maskPhone(e.target.value))}
          required
        />
        <input
          className={inputClass}
          type="email"
          aria-label="E-mail"
          autoComplete="email"
          maxLength={190}
          placeholder="E-mail"
          value={form.email}
          onChange={(e) => update("email", e.target.value)}
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
          onChange={(e) => update("password", e.target.value)}
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
          onChange={(e) => update("confirm", e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl font-semibold text-white text-base transition-all active:scale-98"
          style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)" }}
        >
          {loading ? "Criando conta..." : "Criar Conta"}
        </button>

        <p className="text-center text-sm text-gray-500">
          Já tem conta?{" "}
          <Link to="/login" className="text-violet-600 font-semibold">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  )
}
