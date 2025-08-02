// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { propertiesPanelTheme as theme } from "./propertiesPanelTheme";
import { ChevronDown, ChevronRight } from "lucide-react";

interface PanelSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
}

const PanelSection: React.FC<PanelSectionProps> = ({
  title,
  description,
  children,
  defaultCollapsed = false,
  className = "",
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  // Theme-based styles
  const sectionStyle: React.CSSProperties = {
    borderBottom: `1px solid ${theme.colors.border}`,
    background: theme.colors.background,
    borderRadius: theme.borderRadius.section,
    marginBottom: theme.spacing.fieldGap,
    paddingTop: 12,
    paddingBottom: 0,
    boxSizing: "border-box",
  };
  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    width: "100%",
    textAlign: "left",
    outline: "none",
    font: theme.font.sectionTitle,
    color: theme.colors.sectionHeader,
    borderTopLeftRadius: theme.borderRadius.section,
    borderTopRightRadius: theme.borderRadius.section,
    padding: theme.spacing.inputPadding,
    background: "none",
    border: "none",
    cursor: "pointer",
    transition: "background 0.2s",
  };
  const descriptionStyle: React.CSSProperties = {
    marginLeft: 24,
    marginTop: 4,
    color: theme.colors.label,
    font: theme.font.label,
    fontWeight: 400,
  };
  const contentStyle: React.CSSProperties = {
    transition: "all 0.2s",
    overflow: "hidden",
    marginLeft: 24,
    marginTop: 8,
    gap: theme.spacing.fieldGap,
    display: collapsed ? "none" : "block",
  };

  return (
    <section style={sectionStyle} className={className}>
      <button
        type="button"
        style={headerStyle}
        onClick={() => setCollapsed((prev) => !prev)}
        aria-expanded={!collapsed}
        aria-controls={`panel-section-${title
          .replace(/\s+/g, "-")
          .toLowerCase()}`}
      >
        {collapsed ? (
          <ChevronRight
            size={18}
            style={{ marginRight: 8, transition: "transform 0.2s" }}
          />
        ) : (
          <ChevronDown
            size={18}
            style={{ marginRight: 8, transition: "transform 0.2s" }}
          />
        )}
        {title}
      </button>
      {description && <div style={descriptionStyle}>{description}</div>}
      <div
        id={`panel-section-${title.replace(/\s+/g, "-").toLowerCase()}`}
        style={contentStyle}
        aria-hidden={collapsed}
      >
        {!collapsed && children}
      </div>
    </section>
  );
};

export default PanelSection;
