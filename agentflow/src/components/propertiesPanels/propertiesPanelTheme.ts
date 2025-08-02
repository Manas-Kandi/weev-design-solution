// This file is the single source of truth for all UI rules for properties panels.
// Do not use Tailwind, global CSS, or theme.ts for these components.

export const propertiesPanelTheme = {
  colors: {
    background: "#23272e",
    border: "#353a42",
    sectionHeader: "#0e639c",
    label: "#858585",
    inputBackground: "#1e1e1e",
    inputText: "#cccccc",
    accent: "#4ec9b0",
    error: "#f48771",
  },
  spacing: {
    sectionPadding: "16px 24px",
    fieldGap: "12px",
    labelMargin: "4px",
    inputPadding: "8px 12px",
  },
  borderRadius: {
    input: "6px",
    section: "10px",
  },
  font: {
    sectionTitle: "600 1rem 'Inter', sans-serif",
    label: "400 0.85rem 'Inter', sans-serif",
    input: "400 1rem 'Inter', sans-serif",
  },
};
