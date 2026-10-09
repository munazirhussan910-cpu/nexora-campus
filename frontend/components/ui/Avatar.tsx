'use client';

import React, { useState } from 'react';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  fallbackInitials?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'circle' | 'rounded';
  roleBadgeColor?: string;
  className?: string;
  alt?: string;
}

const sizeClasses: Record<string, { container: string; text: string }> = {
  xs: { container: 'w-6 h-6', text: 'text-[10px]' },
  sm: { container: 'w-7 h-7 sm:w-8 sm:h-8', text: 'text-xs' },
  md: { container: 'w-10 h-10', text: 'text-sm font-bold' },
  lg: { container: 'w-14 h-14', text: 'text-lg font-bold' },
  xl: { container: 'w-16 h-16 sm:w-20 sm:h-20', text: 'text-2xl sm:text-3xl font-black' },
  '2xl': { container: 'w-24 h-24 sm:w-28 sm:h-28', text: 'text-3xl sm:text-4xl font-black' },
};

export function Avatar({
  src,
  name,
  fallbackInitials,
  size = 'md',
  shape = 'circle',
  roleBadgeColor,
  className = '',
  alt,
}: AvatarProps) {
  const [hasError, setHasError] = useState(false);

  // Helper to compute initials
  const getInitials = (inputName?: string): string => {
    if (fallbackInitials) return fallbackInitials;
    if (!inputName || !inputName.trim()) return 'NX';
    const parts = inputName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return inputName.slice(0, 2).toUpperCase();
  };

  const roundedClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';
  const sizeConfig = sizeClasses[size] || sizeClasses.md;

  const defaultBackground = roleBadgeColor
    ? `bg-gradient-to-br ${roleBadgeColor} text-white`
    : 'bg-primary/10 text-primary border border-primary/25';

  const shouldRenderImage = !!src && !hasError;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden select-none ${roundedClass} ${sizeConfig.container} ${className}`}
    >
      {shouldRenderImage ? (
        <img
          src={src!}
          alt={alt || name || 'Profile Avatar'}
          onError={() => setHasError(true)}
          className={`w-full h-full object-cover object-center ${roundedClass}`}
          loading="eager"
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center font-mono tracking-tight shadow-inner ${roundedClass} ${defaultBackground} ${sizeConfig.text}`}
        >
          {getInitials(name)}
        </div>
      )}
    </div>
  );
}
