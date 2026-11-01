import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'monochrome';
  showSubtitle?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Logo: React.FC<LogoProps> = ({
  className = '',
  variant = 'light',
  showSubtitle = true,
  size = 'md'
}) => {
  const isDarkBg = variant === 'dark';

  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16'
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {/* Precision Geometric SVG Symbol */}
      <svg
        className={`${sizeClasses[size]} w-auto aspect-[1.1/1] transition-transform duration-200 hover:scale-105`}
        viewBox="0 0 120 110"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="zezRedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B5121B" />
            <stop offset="100%" stopColor="#8F1018" />
          </linearGradient>
          <linearGradient id="zezDarkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#292F36" />
            <stop offset="100%" stopColor="#1E2228" />
          </linearGradient>
        </defs>

        {/* Outer Hexagonal Shield / Tech Node Frame */}
        <polygon
          points="60,6 108,32 108,82 60,104 12,82 12,32"
          fill={isDarkBg ? '#1E232A' : '#F4F5F7'}
          stroke={isDarkBg ? '#B5121B' : '#B5121B'}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        {/* Red Tech Forward Arrow / Stylized Z Crest */}
        <path
          d="M32 32 H88 L46 60 H88 M46 60 L32 80 H88"
          stroke="url(#zezRedGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center Automation Precision Pulse Dot */}
        <circle cx="60" cy="55" r="4.5" fill="#FFFFFF" />
        <circle cx="60" cy="55" r="7.5" stroke="#B5121B" strokeWidth="2.5" />

        {/* Top & Bottom Precision Pins */}
        <rect x="57" y="10" width="6" height="8" rx="2" fill="#B5121B" />
        <rect x="57" y="92" width="6" height="8" rx="2" fill="#B5121B" />
      </svg>

      {/* Typography Wordmark */}
      <div className="flex flex-col justify-center">
        <div className="flex items-baseline tracking-tight font-extrabold leading-none">
          <span className="text-[#B5121B] text-2xl font-black tracking-widest font-sans">
            ZEZ
          </span>
          <span className="ml-1.5 text-xs font-bold tracking-widest uppercase py-0.5 px-1.5 rounded bg-[#B5121B]/10 text-[#B5121B]">
            ICT
          </span>
        </div>

        {showSubtitle && (
          <div className="flex flex-col mt-1">
            <span
              className={`text-[9px] font-bold tracking-[0.22em] uppercase leading-tight ${
                isDarkBg ? 'text-gray-300' : 'text-[#292F36]'
              }`}
            >
              AUTOMATION CORPORATION
            </span>
            <span className="text-[7.5px] font-medium tracking-[0.14em] text-[#5E646D] uppercase">
              Technology Supplies & Systems Distributor
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
