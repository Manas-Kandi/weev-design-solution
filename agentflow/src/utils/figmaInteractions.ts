import { useState, type HTMLAttributes } from "react";
import type { CSSProperties } from "react";

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
  boxShadow: "0 0 0 2px var(--figma-border), 0 2px 8px #000a",
};

export const figmaSelectedStyle: CSSProperties = {
  boxShadow: "0 0 0 2px var(--figma-accent), 0 2px 8px #000a",
};

// Figma interaction states
export const figmaStates = {
  button: {
    default: {
      backgroundColor: "var(--figma-surface)",
      color: "var(--figma-text-secondary)",
      border: "1px solid var(--figma-border)",
    },
    hover: {
      backgroundColor: "var(--figma-surface-hover)",
      color: "var(--figma-text)",
      border: "1px solid var(--figma-border-strong)",
    },
    active: {
      backgroundColor: "var(--figma-accent)",
      color: "white",
      border: "1px solid var(--figma-accent)",
    },
    disabled: {
      backgroundColor: "var(--figma-surface)",
      color: "var(--figma-text-tertiary)",
      border: "1px solid var(--figma-border)",
      opacity: 0.5,
      cursor: "not-allowed",
    },
  },
  input: {
    default: {
      backgroundColor: "var(--figma-surface)",
      color: "var(--figma-text)",
      border: "1px solid var(--figma-border)",
    },
    focus: {
      backgroundColor: "var(--figma-surface)",
      color: "var(--figma-text)",
      border: "1px solid var(--figma-accent)",
      boxShadow: "0 0 0 2px rgba(24, 160, 251, 0.3)",
    },
    error: {
      backgroundColor: "var(--figma-surface)",
      color: "var(--figma-text)",
      border: "1px solid var(--figma-danger)",
      boxShadow: "0 0 0 2px rgba(248, 72, 34, 0.3)",
    },
  },
};
