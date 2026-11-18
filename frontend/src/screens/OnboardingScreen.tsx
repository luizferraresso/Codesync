import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const slides = [
  {
    image: 'https://images.unsplash.com/photo-1742171046853-0961eabdc7d4?w=800&h=900&fit=crop&auto=format',
    title: 'Hotéis dos Seus Sonhos',
    subtitle: 'Conheça hotéis, pousadas e resorts e encontre inspiração para sua próxima viagem.',
    color: '#7C3AED',
  },
  {
    image: 'https://images.unsplash.com/photo-1777913319909-1d27d36db93e?w=800&h=900&fit=crop&auto=format',
    title: 'Guias Locais Incríveis',
    subtitle: 'Conecte-se com guias turísticos experientes e viva experiências únicas em cada destino.',
    color: '#6D28D9',
  },
  {
    image: 'https://images.unsplash.com/photo-1637876308735-74230b34461a?w=800&h=900&fit=crop&auto=format',
    title: 'Reserve com Facilidade',
    subtitle: 'Comece pelo planejamento: salve suas datas e hóspedes em um rascunho. Reservas completas e pagamentos chegam em uma próxima etapa.',
    color: '#4C1D95',
  },
];

export default function OnboardingScreen() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();

  const next = () => {
    if (current < slides.length - 1) setCurrent(current + 1);
    else navigate('/login');
  };

  const slide = slides[current];

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-black">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={slide.image}
          alt=""
          className="w-full h-full object-cover transition-all duration-700"
        />
        <div className="absolute inset-0" style={{ background: `linear-gradient(to top, ${slide.color}F0 0%, ${slide.color}60 50%, transparent 100%)` }} />
      </div>

      {/* Skip button */}
      <div className="relative z-10 flex justify-end p-6">
        <button
          onClick={() => navigate('/login')}
          className="text-white/80 text-sm font-medium bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-sm"
        >
          Pular
        </button>
      </div>

      {/* Content */}
      <div className="relative z-10 mt-auto px-6 pb-14">
        <div className="mb-6">
          <div className="flex gap-1.5 mb-6">
            {slides.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === current ? 32 : 8,
                  background: i === current ? '#F97316' : 'rgba(255,255,255,0.4)',
                }}
              />
            ))}
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-3 leading-tight">
            {slide.title}
          </h1>
          <p className="text-white/80 text-base leading-relaxed">
            {slide.subtitle}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={next}
            className="flex-1 py-4 rounded-2xl font-semibold text-white text-base transition-transform active:scale-98"
            style={{ background: '#F97316' }}
          >
            {current === slides.length - 1 ? 'Começar' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
}
