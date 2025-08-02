
// ===== Figma UI3-inspired Properties Panel Theme =====
// Single source of truth for all properties panel UI rules
// Do not use Tailwind, global CSS, or theme.ts for these components.

export const figmaPropertiesTheme = {
  colors: {
    background: "#1a1a1a",
    backgroundSecondary: "#242424",
    backgroundTertiary: "#2a2a2a",
    backgroundElevated: "#202020",
    border: "#333333",
  borderRadius: {
    none: "0px",
      height: "32px",
      borderWidth: "1px",
      focusRingWidth: "3px",
    },
    button: {
      height: "32px",
      paddingX: "12px",
      borderWidth: "1px",
    },
    dropdown: {
      itemHeight: "32px",
      maxHeight: "240px",
    },
  },
  states: {
    default: {
      background: "#2a2a2a",
      border: "#404040",
      text: "#ffffff",
    },
    hover: {
      background: "#333333",
      border: "#4a5568",
      text: "#ffffff",
    },
    focus: {
      background: "#2a2a2a",
      border: "#0ea5e9",
      text: "#ffffff",
      boxShadow: "0 0 0 3px rgba(14, 165, 233, 0.3)",
    },
    active: {
      background: "#0ea5e9",
      border: "#0ea5e9",
      text: "white",
    },
    disabled: {
      background: "#1a1a1a",
      border: "#333333",
      text: "#6b7280",
    },
    error: {
      background: "#2a2a2a",
      border: "#ef4444",
      text: "#ffffff",
      boxShadow: "0 0 0 3px rgba(239, 68, 68, 0.3)",
    },
  },
} as const;

export const themeHelpers = {};