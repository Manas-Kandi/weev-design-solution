import type { CSSProperties } from 'react';

export const figmaNodeStyle: CSSProperties = {
  backgroundColor: 'var(--figma-surface)',
  border: '1px solid var(--figma-border)',
  borderRadius: 'var(--figma-radius)',
  boxShadow: '0 2px 8px #000a',
  transition: 'box-shadow 0.2s ease'
};

export const selectedNodeStyle: CSSProperties = {
  boxShadow: '0 0 0 2px var(--figma-accent), 0 2px 8px #000a'
};

export const hoverNodeStyle: CSSProperties = {
  boxShadow: '0 0 0 2px var(--figma-border), 0 2px 8px #000a'
};
