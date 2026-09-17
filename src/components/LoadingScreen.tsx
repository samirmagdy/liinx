import React from 'react';
import { brand } from '../config/brand';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
  fullscreen?: boolean;
  className?: string;
}

/**
 * Premium branded loading screen with ambient glow, animated logo mark,
 * and indeterminate progress indicator.
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  submessage = 'Crafted for creators',
  fullscreen = true,
  className = ''
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`${
        fullscreen ? 'fixed inset-0 z-50 min-h-screen' : 'relative min-h-[420px] w-full'
      } flex flex-col items-center justify-center bg-[#FAF9F6] text-neutral-900 overflow-hidden select-none animate-in fade-in duration-300 ${className}`}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
        <div className="w-[500px] h-[340px] rounded-full bg-gradient-to-tr from-amber-500/10 via-amber-400/5 to-transparent blur-3xl animate-liinx-glow" />
      </div>

      {/* Center Branded Card */}
      <div className="relative z-10 flex flex-col items-center max-w-xs px-6 py-8 text-center">
        {/* Animated Emblem */}
        <div className="relative mb-5 group">
          {/* Subtle pulsating back-shadow */}
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500/20 to-neutral-900/10 blur-sm animate-pulse" />

          {/* Logo Badge */}
          <div className="relative w-14 h-14 rounded-2xl bg-[#111315] shadow-xl shadow-neutral-900/10 border border-white/10 flex items-center justify-center transition-transform">
            <div className="flex items-center gap-1.5 h-6">
              <span className="w-1.5 h-5 bg-white rounded-full animate-liinx-bar-1 origin-center" />
              <span className="w-1.5 h-4 bg-[#F59E0B] rounded-full animate-liinx-bar-2 origin-center shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
              <span className="w-1.5 h-5 bg-white rounded-full animate-liinx-bar-3 origin-center" />
            </div>
          </div>
        </div>

        {/* Brand Name & Title */}
        <span className="font-brand font-extrabold text-xl tracking-tight text-neutral-900 mb-1">
          {brand.productShortName}
        </span>

        {/* Dynamic Context Message */}
        <p className="text-xs font-medium text-neutral-600 mb-4 tracking-normal">
          {message}
        </p>

        {/* Sleek Hairline Indeterminate Progress Bar */}
        <div className="w-36 h-1 rounded-full bg-neutral-200/80 overflow-hidden relative shadow-inner mb-3">
          <div className="absolute inset-y-0 w-1/2 rounded-full bg-gradient-to-r from-transparent via-amber-500 to-neutral-900 animate-liinx-shimmer" />
        </div>

        {/* Subdued Subtitle */}
        {submessage && (
          <span className="text-[11px] font-mono uppercase tracking-widest text-neutral-400">
            {submessage}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Design-first skeleton loader for Public Bio Views.
 * Matches realistic Link-in-Bio mobile phone layout with elegant synchronized shimmer.
 */
export const BioSkeletonLoader: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="Loading creator page"
      className="min-h-screen w-full bg-[#FAF9F6] flex flex-col items-center justify-start pt-14 pb-20 px-4 select-none overflow-hidden animate-in fade-in duration-300"
    >
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />
      </div>

      {/* Main Bio Container */}
      <div className="relative z-10 w-full max-w-[440px] flex flex-col items-center">
        {/* Avatar Skeleton */}
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full bg-neutral-200/80 ring-4 ring-white shadow-sm overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-liinx-shimmer" />
          </div>
        </div>

        {/* Display Name Pill */}
        <div className="w-40 h-5 rounded-full bg-neutral-200/80 overflow-hidden relative mb-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-liinx-shimmer" />
        </div>

        {/* Handle Pill */}
        <div className="w-24 h-3.5 rounded-full bg-neutral-200/60 overflow-hidden relative mb-3">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-liinx-shimmer" />
        </div>

        {/* Bio text lines */}
        <div className="w-64 h-3 rounded-full bg-neutral-200/60 overflow-hidden relative mb-1.5">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-liinx-shimmer" />
        </div>
        <div className="w-48 h-3 rounded-full bg-neutral-200/50 overflow-hidden relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-liinx-shimmer" />
        </div>

        {/* Social Icons Row */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-9 h-9 rounded-full bg-neutral-200/70 overflow-hidden relative shadow-2xs">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-liinx-shimmer" />
            </div>
          ))}
        </div>

        {/* Link Cards Skeletons */}
        <div className="w-full space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-full h-14 rounded-2xl bg-white border border-neutral-200/70 p-3.5 flex items-center justify-between shadow-xs overflow-hidden relative"
            >
              <div className="flex items-center gap-3 w-full">
                {/* Icon box placeholder */}
                <div className="w-8 h-8 rounded-xl bg-neutral-100 overflow-hidden relative shrink-0">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-liinx-shimmer" />
                </div>
                {/* Title line placeholder */}
                <div
                  className="h-3.5 rounded-full bg-neutral-200/70 overflow-hidden relative"
                  style={{ width: `${55 + (i * 11) % 35}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-liinx-shimmer" />
                </div>
              </div>
              {/* Chevron circle placeholder */}
              <div className="w-4 h-4 rounded-full bg-neutral-100 shrink-0" />
            </div>
          ))}
        </div>

        {/* Footer Brand Mark Skeleton */}
        <div className="mt-10 flex items-center gap-1.5 opacity-60">
          <div className="w-4 h-4 rounded-md bg-[#111315] flex items-center justify-center p-0.5">
            <span className="w-0.5 h-2 bg-white rounded-full mr-0.5" />
            <span className="w-0.5 h-1.5 bg-[#F59E0B] rounded-full" />
          </div>
          <span className="text-[11px] font-brand font-bold text-neutral-500 tracking-wider">LIINX</span>
        </div>
      </div>
    </div>
  );
};
