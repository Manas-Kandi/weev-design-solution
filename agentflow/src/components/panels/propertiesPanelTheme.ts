// ===== Figma/VS Code-inspired Properties Panel Theme =====
// Single source of truth for all properties panel UI rules
// Do not use Tailwind, global CSS, or theme.ts for these components.

export const figmaPropertiesTheme = {
  colors: {
    background: "#0D0D0D", // solid black
    backgroundSecondary: "rgba(32,32,36,0.38)", // even more transparent
    backgroundTertiary: "rgba(40,40,44,0.22)", // hover/input, barely visible
    backgroundElevated: "rgba(50,50,54,0.32)", // cards, very subtle
    border: "rgba(60,60,60,0.18)", // subtle gray left border
    borderLight: "rgba(40,40,44,0.06)", // almost invisible
    borderActive: "#007acc", // VS Code blue for active states
    textPrimary: "#cccccc", // Primary text - VS Code text color
    textSecondary: "#9d9d9d", // Secondary text
    textMuted: "#6a6a6a", // Muted text
    textAccent: "#007acc", // Accent text/links - VS Code blue
    success: "#4ec9b0", // VS Code success green
    warning: "#ffcd3c", // VS Code warning yellow
    error: "#f44747", // VS Code error red
    info: "#007acc", // VS Code info blue
    buttonPrimary: "#007acc",
    buttonSecondary: "#2d2d30",
    buttonHover: "#005a9e",
    codeBackground: "#0d1117",
    tagBackground: "#2d2d30",
    accentGlow: "rgba(0, 122, 204, 0.3)",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "20px",
    xxl: "24px",
    sectionPadding: "16px",
    fieldGap: "12px",
    inputPadding: "8px 12px",
    labelMargin: "4px",
    panelPadding: "0px",
    headerHeight: "40px",
    inputHeight: "32px",
    buttonHeight: "28px",
  },
  typography: {
    fontFamily:
      'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontMono:
      '"SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace',
    fontSize: {
      xs: "11px",
      sm: "12px",
      base: "13px",
      md: "14px",
      lg: "16px",
      xl: "18px",
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
    sm: "4px",
    md: "4px",
    lg: "6px",
    xl: "8px",
  },
  shadows: {
    none: "none",
    subtle: "0 2px 12px 0 rgba(0,0,0,0.10)", // softer, lighter
    medium: "0 6px 24px 0 rgba(0,0,0,0.14)",
    strong: "0 8px 32px 0 rgba(0,0,0,0.18)",
    glow: "0 0 0 2px rgba(0,0,0,0.10)",
  },
  animation: {
    fast: "0.1s ease-out",
    medium: "0.2s ease-out",
    slow: "0.3s ease-out",
  },
  components: {
    panel: {
      width: "320px",
      minWidth: "280px",
      maxWidth: "400px",
      position: "fixed" as const,
      right: "0",
      top: "0",
      height: "100vh",
      zIndex: 100,
    },
    section: {
      headerHeight: "40px",
      borderWidth: "1px",
      collapsedHeight: "40px",
      marginBottom: "12px",
    },
    input: {
      height: "32px",
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
      background: "rgba(45,45,48,0.32)",
      border: "rgba(40,40,44,0.10)",
      text: "#cccccc",
    },
    hover: {
      background: "rgba(55,55,58,0.18)",
      border: "rgba(40,40,44,0.14)",
      text: "#cccccc",
    },
    focus: {
      background: "rgba(45,45,48,0.18)",
      border: "rgba(40,40,44,0.18)",
      text: "#cccccc",
      boxShadow: "0 0 0 2px rgba(0,0,0,0.10)",
    },
    active: {
      background: "rgba(40,40,44,0.22)",
      border: "rgba(40,40,44,0.18)",
      text: "white",
    },
    disabled: {
      background: "rgba(45,45,48,0.10)",
      border: "rgba(40,40,44,0.06)",
      text: "#6a6a6a",
      opacity: 0.6,
    },
  },
} as const;

// Helper to get consistent panel container style
export const getPanelContainerStyle = (): React.CSSProperties => ({
  width: figmaPropertiesTheme.components.panel.width,
  minWidth: figmaPropertiesTheme.components.panel.minWidth,
  maxWidth: figmaPropertiesTheme.components.panel.maxWidth,
  height: figmaPropertiesTheme.components.panel.height,
  position: figmaPropertiesTheme.components.panel.position,
  right: figmaPropertiesTheme.components.panel.right,
  top: figmaPropertiesTheme.components.panel.top,
  zIndex: figmaPropertiesTheme.components.panel.zIndex,
  display: "flex",
  flexDirection: "column",
  backgroundColor: figmaPropertiesTheme.colors.background,
  borderLeft: `1px solid ${figmaPropertiesTheme.colors.border}`,
  fontFamily: figmaPropertiesTheme.typography.fontFamily,
  fontSize: figmaPropertiesTheme.typography.fontSize.base,
  color: figmaPropertiesTheme.colors.textPrimary,
  overflowY: "auto",
  overflowX: "hidden",
  padding: 0,
  margin: 0,
  boxSizing: "border-box",
});

// Enhanced theme helpers with better consistency
export const themeHelpers = {
  getInputStyle: (
    state: "default" | "hover" | "focus" | "error" = "default"
  ): React.CSSProperties => ({
    width: "100%",
    height: figmaPropertiesTheme.components.input.height,
    padding: figmaPropertiesTheme.spacing.inputPadding,
    fontSize: figmaPropertiesTheme.typography.fontSize.sm,
    fontFamily: figmaPropertiesTheme.typography.fontFamily,
    fontWeight: figmaPropertiesTheme.typography.fontWeight.normal,
    lineHeight: figmaPropertiesTheme.typography.lineHeight.normal,
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
  getButtonStyle: (
    variant: "primary" | "secondary" = "secondary"
  ): React.CSSProperties => ({
    fontFamily: figmaPropertiesTheme.typography.fontFamily,
    fontSize: figmaPropertiesTheme.typography.fontSize.sm,
    fontWeight: figmaPropertiesTheme.typography.fontWeight.medium,
    height: figmaPropertiesTheme.components.button.height,
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
  getSectionHeaderStyle: (): React.CSSProperties => ({
    fontFamily: figmaPropertiesTheme.typography.fontFamily,
    fontSize: figmaPropertiesTheme.typography.fontSize.sm,
    fontWeight: figmaPropertiesTheme.typography.fontWeight.semibold,
    lineHeight: figmaPropertiesTheme.typography.lineHeight.tight,
    color: figmaPropertiesTheme.colors.textPrimary,
    height: figmaPropertiesTheme.components.section.headerHeight,
    padding: `0 ${figmaPropertiesTheme.spacing.lg}`,
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: figmaPropertiesTheme.spacing.sm,
    borderBottom: `1px solid ${figmaPropertiesTheme.colors.border}`,
    backgroundColor: figmaPropertiesTheme.colors.backgroundSecondary,
    cursor: "pointer",
    transition: `all ${figmaPropertiesTheme.animation.fast}`,
  }),
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
