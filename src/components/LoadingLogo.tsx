import React from 'react';
import { brand } from '../config/brand';
import { RaloaLogo } from './RaloaLogo';

interface LoadingLogoProps {
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark' | 'auto';
  className?: string;
}

/**
 * Reusable animated logo component that shows a premium branded loading
 * spinner with pulsating bars when loading, or the regular RaloaLogo mark otherwise.
 */
export const LoadingLogo: React.FC<LoadingLogoProps> = ({
  loading = false,
  size = 'md',
  variant = 'light',
  className = ''
}) => {
  const sizeClasses = { sm: 'w-8 h-8', md: 'w-9 h-9', lg: 'w-14 h-14' };

  if (loading) {
    return (
      <div
        className={`${sizeClasses[size]} rounded-2xl bg-[#0F172A] shadow-xl shadow-neutral-900/10 border border-white/10 flex items-center justify-center ${className} transition-transform hover:scale-105`}
        aria-label={brand.productShortName}
        role="status"
      >
        <div className="flex items-center gap-1.5 h-[calc(1em-0.5px)]">
          <span className="w-1.5 h-[calc(1em-0.5px)] bg-white rounded-full animate-raloa-bar-1 origin-center" />
          <span className="w-1.5 h-[calc(1em-0.5px)] bg-[#6366F1] rounded-full animate-raloa-bar-2 origin-center shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
          <span className="w-1.5 h-[calc(1em-0.5px)] bg-white rounded-full animate-raloa-bar-3 origin-center" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-xl ${
        variant === 'dark' ? 'bg-neutral-900 border border-neutral-800' : 'bg-neutral-100/80 border border-neutral-200/80'
      } flex items-center justify-center ${className} transition-transform`}
    >
      <RaloaLogo variant={variant} size={size === 'lg' ? 'md' : 'sm'} />
    </div>
  );
};