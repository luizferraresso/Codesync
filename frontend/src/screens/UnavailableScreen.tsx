import { Link } from 'react-router-dom';
import { Page } from '../components/Page';
export default function UnavailableScreen({ title = 'Em desenvolvimento', message = 'Esta função está prevista para uma próxima etapa do HospedJá e ainda não está disponível.' }: { title?: string; message?: string }) {
  return <Page title={title}><div className="bg-white rounded-3xl p-6 text-center">
    <div className="text-4xl mb-5" aria-hidden="true">🧭</div>
    <h2 className="font-display font-bold text-lg text-violet-900 mb-3">Estamos preparando esta experiência</h2>
    <p className="text-gray-600 text-sm leading-relaxed">{message}</p>
    <Link to="/app/home" className="primary-button block mt-6">Explorar hospedagens</Link>
  </div></Page>;
}
