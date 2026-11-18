import { useLocation, useNavigate } from 'react-router-dom';

const tabs = [
  {
    path: '/app/home',
    label: 'Início',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
          stroke={active ? '#7C3AED' : '#9CA3AF'}
          strokeWidth="2"
          fill={active ? '#EDE9FE' : 'none'}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9 21V12h6v9"
          stroke={active ? '#7C3AED' : '#9CA3AF'}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    path: '/app/explore',
    label: 'Explorar',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="2" />
        <path
          d="M16.5 7.5l-2.89 5.78L8 16.5l2.89-5.78L16.5 7.5z"
          stroke={active ? '#7C3AED' : '#9CA3AF'}
          strokeWidth="2"
          fill={active ? '#EDE9FE' : 'none'}
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    path: '/app/guides',
    label: 'Guias',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="8"
          r="4"
          stroke={active ? '#7C3AED' : '#9CA3AF'}
          strokeWidth="2"
          fill={active ? '#EDE9FE' : 'none'}
        />
        <path
          d="M4 20c0-4 3.582-7 8-7s8 3 8 7"
          stroke={active ? '#7C3AED' : '#9CA3AF'}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    path: '/app/reservations',
    label: 'Reservas',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <rect
          x="3"
          y="4"
          width="18"
          height="18"
          rx="3"
          stroke={active ? '#7C3AED' : '#9CA3AF'}
          strokeWidth="2"
          fill={active ? '#EDE9FE' : 'none'}
        />
        <path d="M3 9h18" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="2" />
        <path d="M8 2v4M16 2v4" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" />
        <path d="M7 13h4M7 17h6" stroke={active ? '#7C3AED' : '#9CA3AF'} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    path: '/app/profile',
    label: 'Perfil',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle
          cx="12"
          cy="8"
          r="4"
          stroke={active ? '#7C3AED' : '#9CA3AF'}
          strokeWidth="2"
          fill={active ? '#EDE9FE' : 'none'}
        />
        <path
          d="M20 21a8 8 0 10-16 0"
          stroke={active ? '#7C3AED' : '#9CA3AF'}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav aria-label="Navegação principal" className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-sm bg-white border-t border-gray-100 z-50 shadow-lg">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {tabs.map((tab) => {
          const active = location.pathname.startsWith(tab.path);
          return (
            <button
              key={tab.path}
              aria-current={active ? 'page' : undefined}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all"
            >
              {tab.icon(active)}
              <span
                className="text-[10px] font-medium transition-colors"
                style={{ color: active ? '#7C3AED' : '#9CA3AF' }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
