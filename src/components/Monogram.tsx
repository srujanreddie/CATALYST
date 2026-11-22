import React from 'react';

interface MonogramProps {
  className?: string;
}

/**
 * Minimalist geometric CTY studio monogram mark.
 */
export function Monogram({ className = 'h-7 w-auto' }: MonogramProps) {
  return (
    <svg
      viewBox="0 0 64 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="CATALYS CTY Monogram"
      role="img"
    >
      {/* Architectural C */}
      <path
        d="M21 8.5H12.5C8.35786 8.5 5 11.8579 5 16V20C5 24.1421 8.35786 27.5 12.5 27.5H21"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="square"
      />
      {/* Architectural T */}
      <path
        d="M24 8.5H40M32 8.5V27.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="square"
      />
      {/* Architectural Y */}
      <path
        d="M43 8.5L51 18.5M59 8.5L51 18.5M51 18.5V27.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}
