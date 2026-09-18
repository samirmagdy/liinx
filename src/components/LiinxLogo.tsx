import React from 'react';
import { brand } from '../config/brand';

export interface LiinxLogoProps {
  /**
   * 'light': Dark outer bars on light background (e.g. Navbar, light cards, auth)
   * 'dark': White outer bars on dark background (e.g. Footer, dark builder, dark cards)
   * 'auto': Uses current text color for outer bars
   */
  variant?: 'light' | 'dark' | 'auto';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
}

/**
 * Standardized Liinx brand mark component.
 * Ensures the outer bars always maintain strong contrast against their container,
 * preventing visual collapse into only the amber center bar.
 */
export const LiinxLogo: React.FC<LiinxLogoProps> = ({
  variant = 'light',
  size = 'md',
  className = '',
  showText = false
}) => {
  const outerColor =
    variant === 'light'
      ? '#181817'
      : variant === 'dark'
      ? '#FFFFFF'
      : 'currentColor';

  const amberColor = '#F59E0B';

  const dimensions = {
    sm: { height: 16, barWidth: 3.5, gap: 2.5, radius: 1.75 },
    md: { height: 22, barWidth: 4.5, gap: 3, radius: 2.25 },
    lg: { height: 32, barWidth: 6, gap: 4, radius: 3 },
    xl: { height: 44, barWidth: 8, gap: 5, radius: 4 }
  }[size];

  const totalWidth = dimensions.barWidth * 3 + dimensions.gap * 2;
  const sideBarHeight = dimensions.height;
  const centerBarHeight = dimensions.height * 0.78;
  const centerBarY = (dimensions.height - centerBarHeight) / 2;

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={totalWidth}
        height={dimensions.height}
        viewBox={`0 0 ${totalWidth} ${dimensions.height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label={brand.productShortName}
        role="img"
        className="shrink-0"
      >
        {/* Left Outer Bar */}
        <rect
          x={0}
          y={0}
          width={dimensions.barWidth}
          height={sideBarHeight}
          rx={dimensions.radius}
          fill={outerColor}
        />
        {/* Center Accent Bar */}
        <rect
          x={dimensions.barWidth + dimensions.gap}
          y={centerBarY}
          width={dimensions.barWidth}
          height={centerBarHeight}
          rx={dimensions.radius}
          fill={amberColor}
        />
        {/* Right Outer Bar */}
        <rect
          x={(dimensions.barWidth + dimensions.gap) * 2}
          y={0}
          width={dimensions.barWidth}
          height={sideBarHeight}
          rx={dimensions.radius}
          fill={outerColor}
        />
      </svg>
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
