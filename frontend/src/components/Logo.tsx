interface LogoProps {
  size?: number;
  variant?: 'full' | 'icon';
  light?: boolean;
}

export default function Logo({ size = 32, variant = 'full', light = false }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="20" fill="#7C3AED" />
        <path
          d="M20 8C14.477 8 10 12.477 10 18c0 7.5 10 18 10 18s10-10.5 10-18c0-5.523-4.477-10-10-10z"
          fill="white"
          fillOpacity="0.2"
        />
        <path
          d="M20 9C14.925 9 10.842 13.083 10.842 18.158c0 6.818 9.158 16.842 9.158 16.842s9.158-10.024 9.158-16.842C29.158 13.083 25.075 9 20 9z"
          fill="white"
          fillOpacity="0.15"
        />
        <path
          d="M20 11l-7 6.5V27h5v-4.5h4V27h5V17.5L20 11z"
          fill="white"
        />
        <circle cx="20" cy="20.5" r="2" fill="#F97316" />
      </svg>
      {variant === 'full' && (
        <span
          className="font-display font-bold tracking-tight"
          style={{
            fontSize: size * 0.55,
            color: light ? 'white' : '#7C3AED',
          }}
        >
          Hosped<span style={{ color: '#F97316' }}>Já</span>
        </span>
      )}
    </div>
  );
}
