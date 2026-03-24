"use client";

type PixelIconProps = {
  className?: string;
};

export function PixelArrowIcon({ className = "h-4 w-4" }: PixelIconProps) {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" className={className} fill="currentColor">
      <rect x="4" y="2" width="2" height="2" />
      <rect x="6" y="4" width="2" height="2" />
      <rect x="8" y="6" width="2" height="2" />
      <rect x="6" y="8" width="2" height="2" />
      <rect x="4" y="10" width="2" height="2" />
    </svg>
  );
}

export function PixelChevronDownIcon({ className = "h-4 w-4" }: PixelIconProps) {
  return (
    <svg viewBox="0 0 14 14" aria-hidden="true" className={className} fill="currentColor">
      <rect x="2" y="4" width="2" height="2" />
      <rect x="4" y="6" width="2" height="2" />
      <rect x="8" y="6" width="2" height="2" />
      <rect x="10" y="4" width="2" height="2" />
      <rect x="6" y="8" width="2" height="2" />
    </svg>
  );
}
