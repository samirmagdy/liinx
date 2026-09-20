import React from 'react';
import { brand } from '../config/brand';

export interface RaloaLogoProps {
  /**
   * 'light': Dark mark for light backgrounds (e.g. Navbar, light cards, auth)
   * 'dark': White mark for dark backgrounds (e.g. Footer, dark builder, dark cards)
   * 'auto': Gradient mark that works on either background
   */
  variant?: 'light' | 'dark' | 'auto';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

const MARK_BY_VARIANT: Record<NonNullable<RaloaLogoProps['variant']>, string> = {
  light: '/brand/raloa-mark-black.png',
  dark: '/brand/raloa-mark-white.png',
  auto: '/brand/raloa-mark-gradient.png'
};

const DIMENSIONS: Record<NonNullable<RaloaLogoProps['size']>, number> = {
  sm: 18,
  md: 24,
  lg: 34,
  xl: 48
};

/**
 * Standardized RALOA brand mark component.
 * Renders the official RALOA mark asset for the given background variant so the
 * logo stays consistent with the brand kit across the marketing site and studio.
 */
export const RaloaLogo: React.FC<RaloaLogoProps> = ({
  variant = 'light',
  size = 'md',
  className = '',
  showText = false
}) => {
  const px = DIMENSIONS[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={MARK_BY_VARIANT[variant]}
        width={px}
        height={px}
        alt={brand.productShortName}
        className="shrink-0"
        loading="eager"
        decoding="async"
      />
      {showText && (
        <span
          className={`font-brand font-extrabold tracking-tight ${
            variant === 'dark' ? 'text-white' : 'text-neutral-900'
          } ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-2xl' : 'text-lg'}`}
        >
          {brand.productShortName}
        </span>
      )}
    </div>
  );
};
