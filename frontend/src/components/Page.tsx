import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
export function Page({ title, children, back = '/app/home' }: { title: string; children: ReactNode; back?: string }) {
  return <section className="min-h-screen bg-gray-50 pb-28">
    <header className="bg-white px-5 pt-10 pb-5 flex items-center gap-3 border-b border-gray-100">
      <Link to={back} aria-label="Voltar" className="w-10 h-10 rounded-full bg-violet-50 text-violet-700 flex items-center justify-center text-xl">←</Link>
      <h1 className="font-display font-bold text-xl text-gray-900">{title}</h1>
    </header><div className="p-5 flex flex-col gap-5">{children}</div>
  </section>;
}
export function ErrorNotice({ message, retry }: { message: string; retry?: () => void }) {
  return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
    <p>{message}</p>{retry && <button onClick={retry} className="mt-3 font-bold underline">Tentar novamente</button>}
  </div>;
}
export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border border-violet-100 bg-white p-6 text-center text-sm text-gray-600 leading-relaxed">{children}</div>;
}
