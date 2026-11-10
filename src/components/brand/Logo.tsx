import React, { useState } from 'react';

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
  const [imageError, setImageError] = useState(false);

  // Height mappings matching the 3:2 ratio of the official 1536x1024 3D emblem
  const sizeClasses = {
    sm: 'h-8 sm:h-9',
    md: 'h-11 sm:h-12',
    lg: 'h-14 sm:h-16',
    xl: 'h-20 sm:h-24'
  };

  const logoSrc = '/assets/aistudio/IMG_9224_d9a72974.jpeg';

  return (
    <div className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${className}`}>
      {/* Official 3D ZEZ Automation Corporation Emblem */}
      <div
        className={`relative inline-flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-[1.02] ${
          isDarkBg
            ? 'bg-white rounded-xl p-1.5 shadow-sm border border-white/20'
            : 'rounded-lg p-0.5'
        }`}
      >
        {!imageError ? (
          <img
            src={logoSrc}
            alt="ZEZ Automation Corporation"
            className={`${sizeClasses[size]} w-auto object-contain ${!isDarkBg ? 'mix-blend-multiply' : ''}`}
            loading="eager"
            onError={() => setImageError(true)}
          />
        ) : (
          /* High-fidelity fallback vector if image asset is unavailable */
          <div className="flex items-center gap-2">
            <svg
              className={`${sizeClasses[size]} w-auto aspect-[1.1/1]`}
              viewBox="0 0 120 110"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="zezRedGradFallback" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#B5121B" />
                  <stop offset="100%" stopColor="#8F1018" />
                </linearGradient>
              </defs>
              <polygon
                points="60,6 108,32 108,82 60,104 12,82 12,32"
                fill={isDarkBg ? '#1E232A' : '#F4F5F7'}
                stroke="#B5121B"
                strokeWidth="3.5"
                strokeLinejoin="round"
              />
              <path
                d="M32 32 H88 L46 60 H88 M46 60 L32 80 H88"
                stroke="url(#zezRedGradFallback)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="font-black text-[#B5121B] text-xl tracking-wider">ZEZ</span>
          </div>
        )}
      </div>

      {/* Supplementary Corporate Subtitle on larger viewports */}
      {showSubtitle && (
        <div
          className={`hidden sm:flex flex-col justify-center border-l pl-2.5 ${
            isDarkBg ? 'border-gray-700 text-gray-200' : 'border-gray-200 text-[#292F36]'
          }`}
        >
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`text-[10px] font-extrabold tracking-[0.16em] uppercase font-sans ${
                isDarkBg ? 'text-white' : 'text-[#292F36]'
              }`}
            >
              ICT DISTRIBUTION
            </span>
            <span className="text-[8.5px] font-bold tracking-wider uppercase py-0.5 px-1 rounded bg-[#B5121B] text-white">
              B2B
            </span>
          </div>
          <span
            className={`text-[8px] font-medium tracking-[0.08em] uppercase mt-1 ${
              isDarkBg ? 'text-gray-400' : 'text-[#5E646D]'
            }`}
          >
            Engineering & Infrastructure Solutions
          </span>
        </div>
      )}
    </div>
  );
};
