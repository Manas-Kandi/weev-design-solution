// This file is the single source of truth for all UI rules for properties panels.
// Do not use Tailwind, global CSS, or theme.ts for these components.

// Figma-inspired theme that maps design tokens to global CSS variables defined in
// `src/app/globals.css`. All properties panels should consume values from this
// theme so visual styling stays consistent.

export const figmaPropertiesTheme = {
  colors: {
    background: "var(--figma-bg)",
    backgroundSecondary: "var(--figma-surface)",
    backgroundTertiary: "var(--figma-surface)",
    border: "var(--figma-border)",
    borderLight: "var(--figma-border)",
    borderActive: "var(--figma-accent)",
    textPrimary: "var(--figma-text)",
    textSecondary: "var(--figma-text-secondary)",
    textMuted: "var(--figma-text-secondary)",
    textAccent: "var(--figma-accent)",
    success: "#89d185",
    warning: "#ffb62c",
    error: "#f85149",
    info: "#58a6ff",
    buttonPrimary: "var(--figma-accent)",
    buttonSecondary: "var(--figma-surface)",
    buttonHover: "var(--figma-accent)",
    codeBackground: "#0d1117",
    tagBackground: "var(--figma-surface)",
    accentGlow: "rgba(10, 132, 255, 0.3)",
  },
  spacing: {
    xs: "var(--space-xs)",
    sm: "var(--space-sm)",
    md: "calc(var(--space-sm) + var(--space-xs))",
    lg: "var(--space-md)",
    xl: "calc(var(--space-md) + var(--space-xs))",
    xxl: "var(--space-lg)",
    sectionPadding: "calc(var(--space-sm) + var(--space-xs))",
    fieldGap: "calc(var(--space-sm) * 0.75)",
    inputPadding: "calc(var(--space-sm) * 0.75) var(--space-sm)",
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
      sm: "calc(var(--fs-xs) + 1px)",
      base: "var(--fs-sm)",
      lg: "calc(var(--fs-sm) + 1px)",
      xl: "var(--fs-md)",
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
    xs: "calc(var(--figma-radius) / 2)",
    sm: "calc(var(--figma-radius) * 0.75)",
    md: "var(--figma-radius)",
    lg: "calc(var(--figma-radius) * 1.5)",
  },
  shadows: {
    none: "none",
    subtle: "0 1px 2px rgba(0, 0, 0, 0.1)",
    medium: "0 2px 8px rgba(0, 0, 0, 0.15)",
    strong: "0 4px 16px rgba(0, 0, 0, 0.25)",
    glow: "0 0 0 2px rgba(10, 132, 255, 0.3)",
  },
  animation: {
    fast: "0.15s ease-out",
    medium: "0.25s ease-out",
    slow: "0.35s ease-out",
  },
  components: {
    panel: {
      width: "280px",
      minWidth: "260px",
      maxWidth: "300px",
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
      paddingX: "var(--space-sm)",
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
      background: "var(--figma-border)",
      border: "var(--figma-border)",
      text: "var(--figma-text)",
    },
    focus: {
      background: "var(--figma-surface)",
      border: "var(--figma-accent)",
      text: "var(--figma-text)",
      boxShadow: "0 0 0 2px rgba(10, 132, 255, 0.3)",
    },
    active: {
      background: "var(--figma-bg)",
      border: "var(--figma-accent)",
      text: "var(--figma-text)",
    },
    disabled: {
      background: "var(--figma-surface)",
      border: "var(--figma-border)",
      text: "var(--figma-text-secondary)",
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
    fontSize: figmaPropertiesTheme.typography.fontSize.base,
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
    fontSize: figmaPropertiesTheme.typography.fontSize.base,
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
    color: figmaPropertiesTheme.colors.textPrimary,
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
    fontSize: figmaPropertiesTheme.typography.fontSize.base,
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
    fontSize: figmaPropertiesTheme.typography.fontSize.sm,
    fontWeight: figmaPropertiesTheme.typography.fontWeight.normal,
    lineHeight: figmaPropertiesTheme.typography.lineHeight.normal,
    color: figmaPropertiesTheme.colors.textSecondary,
    marginBottom: figmaPropertiesTheme.spacing.labelMargin,
    display: "block",
  }),
};

