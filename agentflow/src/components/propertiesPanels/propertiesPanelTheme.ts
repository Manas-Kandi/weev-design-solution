// This file is the single source of truth for all UI rules for properties panels.
// Do not use Tailwind, global CSS, or theme.ts for these components.

// Figma-inspired theme that maps design tokens to global CSS variables defined in
// `src/app/globals.css`. All properties panels should consume values from this
// theme so visual styling stays consistent.

export const figmaPropertiesTheme = {
  colors: {
    background: "var(--figma-surface)",
    backgroundSecondary: "var(--figma-surface-hover)",
    backgroundTertiary: "var(--figma-surface-hover)",
    border: "var(--figma-border)",
    borderLight: "var(--figma-border)",
    borderActive: "var(--figma-accent)",
    textPrimary: "var(--figma-text)",
    textSecondary: "var(--figma-text-secondary)",
    textMuted: "var(--figma-text-tertiary)",
    textAccent: "var(--figma-accent)",
    success: "var(--figma-success)",
    warning: "var(--figma-warning)",
    error: "var(--figma-danger)",
    info: "var(--figma-accent)",
    buttonPrimary: "var(--figma-accent)",
    buttonSecondary: "var(--figma-surface)",
    buttonHover: "var(--figma-accent-hover)",
    codeBackground: "#0d1117",
    tagBackground: "var(--figma-surface)",
    accentGlow: "rgba(24, 160, 251, 0.3)",
  },
  spacing: {
    xs: "var(--space-xs)",
    sm: "var(--space-sm)",
    md: "var(--space-md)",
    lg: "var(--space-lg)",
    xl: "var(--space-xl)",
    xxl: "var(--space-20)",
    sectionPadding: "var(--space-md)",
    fieldGap: "var(--space-sm)",
    inputPadding: "var(--space-sm) var(--space-md)",
    labelMargin: "var(--space-xs)",
    panelPadding: "0px",
    headerHeight: "var(--space-xl)",
    inputHeight: "28px",
    buttonHeight: "28px",
  },
  typography: {
    fontFamily: "var(--font-ui)",
    fontMono: "var(--font-code)",
    fontSize: {
      xs: "var(--fs-xs)",
      sm: "var(--fs-sm)",
      base: "var(--fs-base)",
      md: "var(--fs-md)",
      lg: "var(--fs-lg)",
      xl: "var(--fs-xl)",
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
    xs: "var(--figma-radius-sm)",
    sm: "var(--figma-radius-sm)",
    md: "var(--figma-radius)",
    lg: "var(--figma-radius-lg)",
  },
  shadows: {
    none: "none",
    subtle: "0 1px 2px rgba(0, 0, 0, 0.1)",
    medium: "0 2px 8px rgba(0, 0, 0, 0.15)",
    strong: "0 4px 16px rgba(0, 0, 0, 0.25)",
    glow: "0 0 0 2px rgba(24, 160, 251, 0.3)",
  },
  animation: {
    fast: "0.15s ease-out",
    medium: "0.25s ease-out",
    slow: "0.35s ease-out",
  },
  components: {
    panel: {
      width: "var(--properties-width)",
      minWidth: "260px",
      maxWidth: "320px",
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
  states: {
    default: {
      background: "var(--figma-surface)",
      border: "var(--figma-border)",
      text: "var(--figma-text)",
    },
    hover: {
      background: "var(--figma-surface-hover)",
      border: "var(--figma-border-strong)",
      text: "var(--figma-text)",
    },
    focus: {
      background: "var(--figma-surface)",
      border: "var(--figma-accent)",
      text: "var(--figma-text)",
      boxShadow: "0 0 0 2px rgba(24, 160, 251, 0.3)",
    },
    active: {
      background: "var(--figma-accent)",
      border: "var(--figma-accent)",
      text: "white",
    },
    disabled: {
      background: "var(--figma-surface)",
      border: "var(--figma-border)",
      text: "var(--figma-text-tertiary)",
    },
  },
} as const;

// Type definitions for better TypeScript support
export type FigmaTheme = typeof figmaPropertiesTheme;
export type ThemeColors = FigmaTheme["colors"];
export type ThemeSpacing = FigmaTheme["spacing"];
export type ThemeTypography = FigmaTheme["typography"];

// Helper functions for common styling patterns
export const themeHelpers = {
  // Get consistent input styling
  getInputStyle: (
    state: "default" | "hover" | "focus" | "error" = "default"
  ): React.CSSProperties => ({
    fontFamily: figmaPropertiesTheme.typography.fontFamily,
    fontSize: figmaPropertiesTheme.typography.fontSize.sm,
    fontWeight: figmaPropertiesTheme.typography.fontWeight.normal,
    lineHeight: figmaPropertiesTheme.typography.lineHeight.normal,
    height: figmaPropertiesTheme.spacing.inputHeight,
    padding: figmaPropertiesTheme.spacing.inputPadding,
    borderRadius: figmaPropertiesTheme.borderRadius.sm,
    border: `1px solid ${
      state === "error"
        ? figmaPropertiesTheme.colors.error
        : state === "focus"
        ? figmaPropertiesTheme.colors.borderActive
        : figmaPropertiesTheme.colors.border
    }`,
    backgroundColor: figmaPropertiesTheme.colors.backgroundTertiary,
    color: figmaPropertiesTheme.colors.textPrimary,
    outline: "none",
    transition: `all ${figmaPropertiesTheme.animation.fast}`,
    ...(state === "focus" && {
      boxShadow: figmaPropertiesTheme.shadows.glow,
    }),
  }),

  // Get consistent button styling
  getButtonStyle: (
    variant: "primary" | "secondary" = "secondary"
  ): React.CSSProperties => ({
    fontFamily: figmaPropertiesTheme.typography.fontFamily,
    fontSize: figmaPropertiesTheme.typography.fontSize.sm,
    fontWeight: figmaPropertiesTheme.typography.fontWeight.medium,
    height: figmaPropertiesTheme.spacing.buttonHeight,
    padding: `0 ${figmaPropertiesTheme.spacing.md}`,
    borderRadius: figmaPropertiesTheme.borderRadius.sm,
    border: `1px solid ${
      variant === "primary"
        ? figmaPropertiesTheme.colors.buttonPrimary
        : figmaPropertiesTheme.colors.border
    }`,
    backgroundColor:
      variant === "primary"
        ? figmaPropertiesTheme.colors.buttonPrimary
        : figmaPropertiesTheme.colors.buttonSecondary,
    color:
      variant === "primary" ? "white" : figmaPropertiesTheme.colors.textPrimary,
    cursor: "pointer",
    outline: "none",
    transition: `all ${figmaPropertiesTheme.animation.fast}`,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: figmaPropertiesTheme.spacing.sm,
  }),

  // Get section header styling
  getSectionHeaderStyle: (): React.CSSProperties => ({
    fontFamily: figmaPropertiesTheme.typography.fontFamily,
    fontSize: figmaPropertiesTheme.typography.fontSize.sm,
    fontWeight: figmaPropertiesTheme.typography.fontWeight.semibold,
    lineHeight: figmaPropertiesTheme.typography.lineHeight.tight,
    color: figmaPropertiesTheme.colors.textPrimary,
    height: figmaPropertiesTheme.spacing.headerHeight,
    padding: `0 ${figmaPropertiesTheme.spacing.md}`,
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: figmaPropertiesTheme.spacing.sm,
    borderBottom: `1px solid ${figmaPropertiesTheme.colors.border}`,
    backgroundColor: figmaPropertiesTheme.colors.backgroundSecondary,
    cursor: "pointer",
    transition: `all ${figmaPropertiesTheme.animation.fast}`,
  }),

  // Get label styling
  getLabelStyle: (): React.CSSProperties => ({
    fontFamily: figmaPropertiesTheme.typography.fontFamily,
    fontSize: figmaPropertiesTheme.typography.fontSize.xs,
    fontWeight: figmaPropertiesTheme.typography.fontWeight.medium,
    lineHeight: figmaPropertiesTheme.typography.lineHeight.normal,
    color: figmaPropertiesTheme.colors.textSecondary,
    marginBottom: figmaPropertiesTheme.spacing.labelMargin,
    display: "block",
  }),
};
