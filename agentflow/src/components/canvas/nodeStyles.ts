import type { CSSProperties } from 'react';
import { figmaHoverStyle, figmaSelectedStyle } from '@/utils/figmaInteractions';

export const figmaNodeStyle: CSSProperties = {
  backgroundColor: 'var(--figma-surface)',
  border: '1px solid var(--figma-border)',
  borderRadius: 'var(--figma-radius)',
  boxShadow: '0 2px 8px #000a',
  transition: 'box-shadow 0.2s ease'
};

export const selectedNodeStyle: CSSProperties = figmaSelectedStyle;

export const hoverNodeStyle: CSSProperties = figmaHoverStyle;
