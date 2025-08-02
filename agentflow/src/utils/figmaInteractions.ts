import { useState, type HTMLAttributes } from 'react';
import type { CSSProperties } from 'react';

/**
 * Utility hooks and styles for common Figma-like interaction patterns.
 */
export function useFigmaHover<T extends HTMLElement>() {
  const [isHovered, setIsHovered] = useState(false);

  const hoverProps: HTMLAttributes<T> = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  };

  return { isHovered, hoverProps };
}

export function useFigmaActive<T extends HTMLElement>() {
  const [isActive, setIsActive] = useState(false);

  const activeProps: HTMLAttributes<T> = {
    onMouseDown: () => setIsActive(true),
    onMouseUp: () => setIsActive(false),
    onMouseLeave: () => setIsActive(false),
  };

  return { isActive, activeProps };
}

export function useFigmaFocus<T extends HTMLElement>() {
  const [isFocused, setIsFocused] = useState(false);

  const focusProps: HTMLAttributes<T> = {
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  };

  return { isFocused, focusProps };
}

export const figmaHoverStyle: CSSProperties = {
  boxShadow: '0 0 0 2px var(--figma-border), 0 2px 8px #000a',
};

export const figmaSelectedStyle: CSSProperties = {
  boxShadow: '0 0 0 2px var(--figma-accent), 0 2px 8px #000a',
};
