import { CSSProperties } from 'react';

// Standardized badge styles - 24px height with consistent padding and border radius
export const BADGE_STYLES: CSSProperties = {
  height: '24px',
  padding: '0.25rem 0.5rem',
  fontSize: '0.75rem',
  borderRadius: '12px', // Half of height for perfect pill shape
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.25rem'
};

// For nested badges (like skill level descriptions)
export const NESTED_BADGE_STYLES: CSSProperties = {
  fontSize: '0.65rem',
  padding: '0.125rem 0.375rem',
  borderRadius: '8px'
};