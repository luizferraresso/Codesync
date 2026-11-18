import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Logo from '../components/Logo';
import { Empty, ErrorNotice, Page } from '../components/Page';
import { useCatalog } from '../context/CatalogContext';
import { useAuth } from '../context/AuthContext';
import { amenitiesOf, money } from '../lib/format';
import type { HotelRecord, RoomRecord } from '../api/types';

export function CatalogStatus() {
  const { loading, error, retry } = useCatalog();
  if (loading) return <p role="status" className="notice">Carregando o catálogo…</p>;
  return error ? <ErrorNotice message={error} retry={retry} /> : null;
}

function HotelArtwork({ small = false }: { small?: boolean }) {
  return <div className={`relative flex items-center justify-center overflow-hidden ${small ? 'h-32' : 'h-52'} rounded-2xl bg-gradient-to-br from-violet-900 via-violet-600 to-indigo-400`}>
    <svg aria-hidden="true" width="86" height="86" viewBox="0 0 80 80" fill="none" className="text-white/80">
      <path d="M12 68h56M20 68V20l20-9 20 9v48M32 68V54h16v14" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {[28, 40, 52].map(x => [28, 40].map(y => <rect key={`${x}-${y}`} x={x - 2} y={y - 2} width="4" height="4" rx="1" fill="currentColor" />))}
    </svg><span className="absolute bottom-3 text-white/70 text-[10px] tracking-wide">IMAGEM ILUSTRATIVA</span>
  </div>;
}

function HotelCard({ hotel }: { hotel: HotelRecord }) {
  const { rooms, favorites, toggleFavorite } = useCatalog();
  const prices = rooms.filter(r => String(r.id_hotel) === String(hotel.id_hotel)).map(r => Number(r.valor_diaria));
  const liked = favorites.includes(String(hotel.id_hotel));
  return <article className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="relative p-2 pb-0">
      <Link to={`/app/hotel/${hotel.id_hotel}`} aria-label={`Conhecer ${hotel.nome}`}><HotelArtwork small /></Link>
      <button aria-label={`${liked ? 'Remover dos' : 'Adicionar aos'} favoritos: ${hotel.nome}`} aria-pressed={liked} onClick={() => toggleFavorite(String(hotel.id_hotel))} className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white flex items-center justify-center text-violet-700 shadow-sm">{liked ? '♥' : '♡'}</button>
    </div>
    <Link to={`/app/hotel/${hotel.id_hotel}`} className="block p-4">
      <p className="text-[10px] uppercase tracking-widest text-violet-600 font-bold mb-1">{hotel.categoria?.replaceAll('_', ' ') || 'Hospedagem'}</p>
      <h3 className="font-display font-bold text-gray-900 text-sm">{hotel.nome}</h3>
      <p className="text-xs text-gray-500 mt-2 line-clamp-2">{hotel.descricao || 'Conheça esta hospedagem.'}</p>
      <p className="text-orange-600 font-bold text-sm mt-3">{prices.length ? <>A partir de {money(Math.min(...prices))}<span className="font-normal text-gray-500 text-xs"> / diária</span></> : 'Consulte os quartos'}</p>
    </Link>
  </article>;
}

export function CatalogScreen({ favoritesOnly = false, explore = false }: { favoritesOnly?: boolean; explore?: boolean }) {
  const { hotels, loading, error, favorites } = useCatalog();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('TODOS');
  const matches = hotels.filter(h => (!favoritesOnly || favorites.includes(String(h.id_hotel))) &&
    (category === 'TODOS' || h.categoria === category) &&
    `${h.nome} ${h.descricao ?? ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .includes(query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()));
  return <section className="min-h-screen bg-gray-50 pb-28">
    <header className="px-5 pt-12 pb-7 rounded-b-3xl bg-gradient-to-br from-violet-950 to-violet-600">
      <div className="flex items-center justify-between mb-8"><Logo size={36} variant="full" light />
        <Link to={user ? '/app/profile' : '/login'} className="text-xs font-bold text-white bg-white/15 px-4 py-2 rounded-full">{user ? 'Meu perfil' : 'Entrar'}</Link>
      </div>
      <p className="text-violet-200 text-sm">{user ? `Olá, ${user.nome.split(' ')[0]}!` : 'Olá, bem-vindo!'}</p>
      <h1 className="font-display font-bold text-2xl text-white mt-1 mb-5">{favoritesOnly ? 'Seus lugares favoritos' : explore ? 'Descubra sua próxima viagem' : 'Para onde vamos hoje?'}</h1>
      <label className="sr-only" htmlFor="hotel-search">Buscar hospedagem</label>
      <div className="bg-white rounded-2xl flex gap-2 items-center p-2 shadow-lg">
        <span className="text-violet-600 pl-2" aria-hidden="true">⌕</span>
        <input id="hotel-search" value={query} onChange={e => setQuery(e.target.value)} placeholder="Nome ou descrição do hotel…" className="w-full py-2 pr-2 bg-transparent text-sm outline-none" />
      </div>
    </header>
    <div className="p-5 flex flex-col gap-5">
      <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Categorias">
        {[['TODOS', 'Todos'], ['HOTEL', 'Hotéis'], ['POUSADA', 'Pousadas'], ['RESORT', 'Resorts'], ['HOSTEL', 'Hostels']].map(([value, label]) =>
          <button key={value} aria-pressed={category === value} onClick={() => setCategory(value)} className={`px-4 py-2.5 rounded-full whitespace-nowrap text-xs font-semibold ${category === value ? 'bg-violet-600 text-white' : 'bg-white text-gray-600 border border-gray-100'}`}>{label}</button>)}
      </div>
      {favoritesOnly && <p className="text-xs text-gray-500">Seus favoritos ficam disponíveis durante esta sessão.</p>}
      <CatalogStatus />
      {!loading && !error && <>
        <div className="flex justify-between items-center"><h2 className="font-display font-bold text-gray-900">{favoritesOnly ? 'Hospedagens salvas' : 'Encontre seu lugar'}</h2><span className="text-xs text-gray-500">{matches.length} opções</span></div>
        {matches.length ? <div className="grid gap-4">{matches.map(hotel => <HotelCard key={hotel.id_hotel} hotel={hotel} />)}</div> : <Empty>{hotels.length ? 'Nenhuma hospedagem encontrada com esses filtros.' : 'Ainda não há hospedagens cadastradas disponíveis. Volte em breve.'}</Empty>}
      </>}
      <div className="rounded-3xl bg-violet-100 p-5 flex items-center gap-4"><span className="text-3xl" aria-hidden="true">🧭</span><div><h2 className="font-display text-sm font-bold text-violet-950">Conheça quem conhece o destino</h2><Link to="/app/guides" className="inline-block mt-2 text-violet-700 text-xs font-bold underline">Explorar guias locais →</Link></div></div>
    </div>
  </section>;
}

function RoomCard({ room, hotelId, detail = false }: { room: RoomRecord; hotelId: string; detail?: boolean }) {
  return <article className="bg-white border border-gray-100 rounded-2xl p-5">
    <span className="text-xs font-bold text-violet-600 bg-violet-50 rounded-full px-3 py-1">{room.tipo}</span>
    <h2 className="font-display font-bold text-lg mt-3">{room.nome}</h2>
    <p className="text-gray-500 text-sm mt-2">Até {room.capacidade} hóspedes{room.tamanho_m2 ? ` · ${room.tamanho_m2} m²` : ''}{room.quantidade_camas ? ` · ${room.quantidade_camas} cama(s)` : ''}</p>
    {detail && <p className="text-gray-600 text-sm leading-relaxed mt-4">{room.descricao || 'Descrição não informada.'}</p>}
    <p className="font-bold text-orange-600 text-lg mt-4">{money(room.valor_diaria)} <span className="text-xs font-normal text-gray-500">/ diária de referência</span></p>
    {detail ? <p className="notice mt-4">A reserva deste quarto e a consulta de disponibilidade por data estarão disponíveis em uma próxima etapa.</p> : <Link className="secondary-button block mt-4" to={`/app/hotel/${hotelId}/room/${room.id_tipo_quarto}`}>Ver detalhes</Link>}
  </article>;
}

export function HotelDetailScreen({ roomsOnly = false, roomOnly = false }: { roomsOnly?: boolean; roomOnly?: boolean }) {
  const { id, roomId } = useParams();
  const { hotels, rooms, loading, error } = useCatalog();
  const hotel = hotels.find(h => String(h.id_hotel) === id);
  const matches = rooms.filter(r => String(r.id_hotel) === id && (!roomOnly || String(r.id_tipo_quarto) === roomId));
  return <Page title={roomOnly ? 'Detalhes do quarto' : roomsOnly ? 'Conheça os quartos' : 'Sua próxima hospedagem'} back={roomsOnly || roomOnly ? `/app/hotel/${id}` : '/app/home'}>
    <CatalogStatus />
    {!loading && !error && (!hotel ? <Empty>Hospedagem não encontrada ou indisponível.</Empty> : <>
      {!roomsOnly && !roomOnly && <>
        <HotelArtwork />
        <div><p className="text-xs text-violet-600 font-bold uppercase">{hotel.categoria?.replaceAll('_', ' ')}</p><h2 className="font-display font-bold text-2xl mt-1">{hotel.nome}</h2>
          {hotel.classificacao && <p className="text-orange-500 mt-2" aria-label={`${hotel.classificacao} estrelas`}>{'★'.repeat(hotel.classificacao)}</p>}
        </div>
        <div className="card"><h3 className="font-bold mb-3">Sobre a hospedagem</h3><p className="text-gray-600 text-sm leading-relaxed">{hotel.descricao || 'Descrição não informada.'}</p></div>
        {amenitiesOf(hotel.comodidades).length > 0 && <div className="card"><h3 className="font-bold mb-3">Comodidades</h3><ul className="grid grid-cols-2 gap-3 text-sm text-gray-600">{amenitiesOf(hotel.comodidades).map((a, i) => <li key={i}>✓ {a}</li>)}</ul></div>}
        <h3 className="font-display font-bold">Quartos cadastrados</h3>
      </>}
      {matches.length ? matches.map(r => <RoomCard key={r.id_tipo_quarto} room={r} hotelId={id!} detail={roomOnly} />) : <Empty>Nenhum quarto disponível para consulta.</Empty>}
      <p className="text-xs text-gray-500 leading-relaxed">Os valores são diárias de referência do catálogo. A disponibilidade por período e o orçamento final ainda não estão disponíveis.</p>
    </>)}
  </Page>;
}

export function GuidesCatalogScreen() {
  const { guides, loading, error } = useCatalog();
  const [query, setQuery] = useState('');
  const matches = guides.filter(g => `${g.nome} ${g.especialidade ?? ''} ${g.area_atuacao ?? ''}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')));
  return <Page title="Guias locais"><p className="text-gray-500 text-sm">Conheça os profissionais e suas especialidades.</p>
    <input aria-label="Buscar guia" className="form-input" value={query} onChange={e => setQuery(e.target.value)} placeholder="Nome, especialidade ou região…" />
    <CatalogStatus />
    {!loading && !error && (matches.length ? matches.map(g => <Link key={g.id_guia} className="card block" to={`/app/guide/${g.id_guia}`}>
      <span className="text-3xl" aria-hidden="true">🧭</span><h2 className="font-display font-bold mt-3">{g.nome}</h2><p className="text-violet-600 text-sm mt-1">{g.especialidade || 'Guia de turismo'}</p><p className="text-gray-500 text-xs mt-2">{g.area_atuacao || 'Área de atuação não informada'}</p><p className="text-orange-600 font-bold text-sm mt-3">{g.valor_diaria === null ? 'Valor sob consulta' : `${money(g.valor_diaria)} / diária de referência`}</p>
    </Link>) : <Empty>Nenhum guia encontrado. Novos profissionais aparecerão aqui quando estiverem disponíveis.</Empty>)}
  </Page>;
}

export function GuideDetailScreen() {
  const { id } = useParams();
  const { guides, loading, error } = useCatalog();
  const guide = guides.find(g => String(g.id_guia) === id);
  return <Page title="Conheça seu guia" back="/app/guides"><CatalogStatus />
    {!loading && !error && (guide ? <div className="card"><div className="rounded-2xl bg-gradient-to-br from-violet-900 to-violet-500 h-36 flex items-center justify-center text-5xl" aria-hidden="true">🧭</div><h2 className="font-display font-bold text-2xl mt-5">{guide.nome}</h2><p className="text-violet-600 font-semibold text-sm mt-2">{guide.especialidade}</p><p className="text-gray-500 text-sm mt-2">{guide.area_atuacao}</p><p className="text-gray-600 text-sm leading-relaxed mt-5">{guide.descricao || 'Apresentação não informada.'}</p>{guide.servicos_oferecidos && <p className="text-sm text-gray-600 mt-4">{guide.servicos_oferecidos}</p>}<p className="notice mt-5">A contratação de guias ainda não está disponível nesta etapa.</p></div> : <Empty>Guia não encontrado ou indisponível.</Empty>)}
  </Page>;
}
