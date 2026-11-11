import React from 'react';

interface StudioLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showGlow?: boolean;
}

export function StudioLogo({ className = '', size = 'md', showGlow = false }: StudioLogoProps) {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const dim = sizeMap[size] || sizeMap.md;

  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 ${className}`}>
      {showGlow && (
        <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-md pointer-events-none transform scale-110" />
      )}

      {/* Professional PixelBridge App Icon in Single-Color Blue Theme */}
      <div
        className={`${dim} relative rounded-2xl bg-blue-600 p-[1.5px] shadow-lg shadow-blue-600/20 overflow-hidden flex items-center justify-center border border-blue-400/40`}
      >
        {/* Subtle royal blue gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500 to-blue-700" />

        {/* Vector SVG Emblem: PixelBridge Geometric Monogram & Bridge Arch */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-2 relative z-10"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="pbBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#DBEAFE" />
            </linearGradient>
            <linearGradient id="bridgeLineGrad" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.4" />
            </linearGradient>
          </defs>

          {/* Precision Pixel Grid Matrix (Pixel Bridge Motif) */}
          <rect x="22" y="24" width="9" height="9" rx="2" fill="#FFFFFF" fillOpacity="0.95" />
          <rect x="35" y="24" width="9" height="9" rx="2" fill="#FFFFFF" fillOpacity="0.8" />
          <rect x="48" y="24" width="9" height="9" rx="2" fill="#FFFFFF" fillOpacity="0.65" />
          <rect x="61" y="24" width="9" height="9" rx="2" fill="#FFFFFF" fillOpacity="0.8" />
          <rect x="74" y="24" width="9" height="9" rx="2" fill="#FFFFFF" fillOpacity="0.95" />

          {/* Central Connecting Pixel Gateway */}
          <rect x="22" y="37" width="9" height="9" rx="2" fill="#FFFFFF" fillOpacity="0.95" />
          <rect x="74" y="37" width="9" height="9" rx="2" fill="#FFFFFF" fillOpacity="0.95" />

          {/* Architectural Arch Bridge Curve */}
          <path
            d="M 18 72 C 32 46, 68 46, 82 72"
            stroke="url(#pbBlueGrad)"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Bridge Suspension Vertical Beams */}
          <line x1="34" y1="58" x2="34" y2="72" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.85" />
          <line x1="50" y1="52" x2="50" y2="72" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          <line x1="66" y1="58" x2="66" y2="72" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeOpacity="0.85" />

          {/* Bridge Base Horizon Deck */}
          <line x1="14" y1="72" x2="86" y2="72" stroke="url(#bridgeLineGrad)" strokeWidth="3" strokeLinecap="round" />

          {/* Core Pixel Diamond Anchor */}
          <rect x="46" y="38" width="8" height="8" rx="1.5" fill="#BFDBFE" />
        </svg>
      </div>
    </div>
  );
}
