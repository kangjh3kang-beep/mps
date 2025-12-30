/**
 * Global Loading Component
 * Shown during page transitions and data fetching
 */

import React from 'react';

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        {/* Manpasik Logo Animation */}
        <div className="relative w-24 h-24 mx-auto mb-6">
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-muted animate-pulse" />
          
          {/* Inner spinning ring */}
          <div className="absolute inset-2 rounded-full border-4 border-t-primary border-r-transparent border-b-primary/30 border-l-transparent animate-spin" />
          
          {/* Center dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-dancheong-red to-dancheong-blue animate-pulse" />
          </div>
        </div>

        {/* Text */}
        <p className="text-muted-foreground text-sm animate-pulse">
          로딩 중...
        </p>
      </div>
    </div>
  );
}


