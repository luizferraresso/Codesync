import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

export default function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => navigate('/onboarding'), 2400);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(145deg, #4C1D95 0%, #7C3AED 50%, #8B5CF6 100%)' }}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #F97316, transparent)' }}
        />
        <div
          className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, #C4B5FD, transparent)' }}
        />
        <div
          className="absolute top-1/3 -left-10 w-40 h-40 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, white, transparent)' }}
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6 animate-pulse">
        <Logo size={72} variant="icon" light />
        <div className="flex flex-col items-center gap-1">
          <span className="font-display text-4xl font-bold text-white tracking-tight">
            Hosped<span style={{ color: '#FDBA74' }}>Já</span>
          </span>
          <span className="text-violet-200 text-sm font-medium tracking-widest uppercase">
            Viaje. Descubra. Hospede.
          </span>
        </div>
      </div>

      <div className="absolute bottom-16 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-1.5 rounded-full"
            style={{
              width: i === 0 ? 24 : 8,
              background: i === 0 ? '#F97316' : 'rgba(255,255,255,0.3)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
