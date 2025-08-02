// This file is the single source of truth for all UI rules for properties panels.
// Do not use Tailwind, global CSS, or theme.ts for these components.

// Enhanced VS Code-inspired theme for AgentFlow properties panels
// This replaces propertiesPanelTheme.ts with a much more sophisticated design system

export const vsCodePropertiesTheme = {
  colors: {
    // Background layers - authentic VS Code hierarchy
    background: "#1e1e1e", // Main background (VS Code side panel)
    backgroundSecondary: "#252526", // Elevated sections
    backgroundTertiary: "#2d2d30", // Input fields and deeper content
    // Borders - subtle but defined
    border: "#3e3e42", // Primary borders
    borderLight: "#484848", // Hover/focus borders
    borderActive: "#007acc", // Active/selected borders (VS Code blue)
    // Text hierarchy - perfect contrast ratios
    textPrimary: "#cccccc", // Main text
    textSecondary: "#9da5b4", // Secondary text, descriptions
    textMuted: "#6a6a6a", // Disabled/muted text
    textAccent: "#007acc", // Links, accents (VS Code blue)
    // Status colors - authentic VS Code palette
    success: "#89d185", // Success states
    warning: "#ffb62c", // Warning states
    error: "#f85149", // Error states
    info: "#58a6ff", // Info states
    // Interactive elements
    buttonPrimary: "#007acc", // Primary action buttons
    buttonSecondary: "#2d2d30", // Secondary buttons
    buttonHover: "#1177bb", // Hover states
    // Special elements
    codeBackground: "#0d1117", // Code blocks, JSON editors
    tagBackground: "#1f2937", // Tags, chips
    accentGlow: "rgba(0, 122, 204, 0.3)", // Glow effects
  },
  spacing: {
    // Precise spacing system - follows VS Code conventions
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    xxl: "24px",
    // Specific component spacing
    sectionPadding: "16px",
    fieldGap: "12px",
    inputPadding: "8px 12px",
    labelMargin: "6px",
    panelPadding: "0px",
    // Layout spacing
    headerHeight: "35px",
    inputHeight: "28px",
    buttonHeight: "28px",
  },
  typography: {
    // Font stack - VS Code uses Consolas/Monaco primarily
    fontFamily:
      "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif",
    fontMono:
      "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, 'Courier New', monospace",
    // Text sizes - precise hierarchy
    fontSize: {
      xs: "11px",
      sm: "12px",
      base: "13px",
      lg: "14px",
      xl: "16px",
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
    },
  },
  borderRadius: {
    none: "0px",
    xs: "2px",
    sm: "3px",
    md: "4px",
    lg: "6px",
  },
  shadows: {
    none: "none",
    subtle: "0 1px 2px rgba(0, 0, 0, 0.1)",
    medium: "0 2px 8px rgba(0, 0, 0, 0.15)",
    strong: "0 4px 16px rgba(0, 0, 0, 0.25)",
    glow: "0 0 0 2px rgba(0, 122, 204, 0.3)",
  },
  animation: {
    // Smooth, professional transitions
    fast: "0.15s ease-out",
    medium: "0.25s ease-out",
    slow: "0.35s ease-out",
  },
  // Component-specific design tokens
  components: {
    panel: {
      width: "320px",
      minWidth: "280px",
      maxWidth: "400px",
    },
    section: {
      headerHeight: "32px",
      borderWidth: "1px",
      collapsedHeight: "32px",
    },
    input: {
      height: "28px",
      borderWidth: "1px",
      focusRingWidth: "2px",
    },
    button: {
      height: "28px",
      paddingX: "12px",
      borderWidth: "1px",
    },
    dropdown: {
      itemHeight: "28px",
      maxHeight: "200px",
    },
  },
  // State variants for interactive elements
  states: {
    default: {
      background: "#2d2d30",
      border: "#3e3e42",
      text: "#cccccc",
    },
    hover: {
      background: "#3e3e42",
      border: "#484848",
      text: "#e1e1e1",
    },
    focus: {
      background: "#2d2d30",
      border: "#007acc",
      text: "#cccccc",
      boxShadow: "0 0 0 2px rgba(0, 122, 204, 0.3)",
    },
    active: {
      background: "#1f1f20",
      border: "#007acc",
      text: "#e1e1e1",
    },
    disabled: {
      background: "#252526",
      border: "#3e3e42",
      text: "#6a6a6a",
    },
  },
} as const;

// Type definitions for better TypeScript support
export type VSCodeTheme = typeof vsCodePropertiesTheme;
export type ThemeColors = VSCodeTheme["colors"];
export type ThemeSpacing = VSCodeTheme["spacing"];
export type ThemeTypography = VSCodeTheme["typography"];

// Helper functions for common styling patterns
export const themeHelpers = {
  // Get consistent input styling
  getInputStyle: (
    state: "default" | "hover" | "focus" | "error" = "default"
  ): React.CSSProperties => ({
    fontFamily: vsCodePropertiesTheme.typography.fontFamily,
    fontSize: vsCodePropertiesTheme.typography.fontSize.base,
    fontWeight: vsCodePropertiesTheme.typography.fontWeight.normal,
    lineHeight: vsCodePropertiesTheme.typography.lineHeight.normal,
    height: vsCodePropertiesTheme.spacing.inputHeight,
    padding: vsCodePropertiesTheme.spacing.inputPadding,
    borderRadius: vsCodePropertiesTheme.borderRadius.sm,
    border: `1px solid ${
      state === "error"
        ? vsCodePropertiesTheme.colors.error
        : state === "focus"
        ? vsCodePropertiesTheme.colors.borderActive
        : vsCodePropertiesTheme.colors.border
    }`,
    backgroundColor: vsCodePropertiesTheme.colors.backgroundTertiary,
    color: vsCodePropertiesTheme.colors.textPrimary,
    outline: "none",
    transition: `all ${vsCodePropertiesTheme.animation.fast}`,
    ...(state === "focus" && {
      boxShadow: vsCodePropertiesTheme.shadows.glow,
    }),
  }),
  // Get consistent button styling
  getButtonStyle: (
    variant: "primary" | "secondary" = "secondary"
  ): React.CSSProperties => ({
    fontFamily: vsCodePropertiesTheme.typography.fontFamily,
    fontSize: vsCodePropertiesTheme.typography.fontSize.base,
    fontWeight: vsCodePropertiesTheme.typography.fontWeight.medium,
    height: vsCodePropertiesTheme.spacing.buttonHeight,
    padding: `0 ${vsCodePropertiesTheme.spacing.md}`,
    borderRadius: vsCodePropertiesTheme.borderRadius.sm,
    border: `1px solid ${
      variant === "primary"
        ? vsCodePropertiesTheme.colors.buttonPrimary
        : vsCodePropertiesTheme.colors.border
    }`,
    backgroundColor:
      variant === "primary"
        ? vsCodePropertiesTheme.colors.buttonPrimary
        : vsCodePropertiesTheme.colors.buttonSecondary,
    color: vsCodePropertiesTheme.colors.textPrimary,
    cursor: "pointer",
    outline: "none",
    transition: `all ${vsCodePropertiesTheme.animation.fast}`,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: vsCodePropertiesTheme.spacing.sm,
  }),
  // Get section header styling
  getSectionHeaderStyle: (): React.CSSProperties => ({
    fontFamily: vsCodePropertiesTheme.typography.fontFamily,
    fontSize: vsCodePropertiesTheme.typography.fontSize.base,
    fontWeight: vsCodePropertiesTheme.typography.fontWeight.semibold,
    lineHeight: vsCodePropertiesTheme.typography.lineHeight.tight,
    color: vsCodePropertiesTheme.colors.textPrimary,
    height: vsCodePropertiesTheme.spacing.headerHeight,
    padding: `0 ${vsCodePropertiesTheme.spacing.md}`,
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: vsCodePropertiesTheme.spacing.sm,
    borderBottom: `1px solid ${vsCodePropertiesTheme.colors.border}`,
    backgroundColor: vsCodePropertiesTheme.colors.backgroundSecondary,
    cursor: "pointer",
    transition: `all ${vsCodePropertiesTheme.animation.fast}`,
  }),
  // Get label styling
  getLabelStyle: (): React.CSSProperties => ({
    fontFamily: vsCodePropertiesTheme.typography.fontFamily,
    fontSize: vsCodePropertiesTheme.typography.fontSize.sm,
    fontWeight: vsCodePropertiesTheme.typography.fontWeight.normal,
    lineHeight: vsCodePropertiesTheme.typography.lineHeight.normal,
    color: vsCodePropertiesTheme.colors.textSecondary,
    marginBottom: vsCodePropertiesTheme.spacing.labelMargin,
    display: "block",
  }),
};
