// All UI rules for properties panels must come from propertiesPanelTheme.ts
// Enhanced PanelSection component with VS Code styling
import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { useFigmaHover } from "../../utils/figmaInteractions";

interface PanelSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
  level?: 1 | 2 | 3; // For nested sections
  icon?: React.ReactNode;
  actions?: React.ReactNode; // For section-level actions
}

const PanelSection: React.FC<PanelSectionProps> = ({
  title,
  description,
  children,
  defaultCollapsed = false,
  className = "",
  level = 1,
  icon,
  actions,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const { isHovered, hoverProps } = useFigmaHover<HTMLButtonElement>();

  // Get styles based on section level
  const sectionStyle: React.CSSProperties = {
    border: `1px solid ${theme.colors.border}`,
    borderRadius: "6px",
    backgroundColor:
      level === 1 ? theme.colors.background : theme.colors.backgroundSecondary,
    marginBottom: "16px",
    overflow: "hidden",
    transition: "all 0.2s",
  };

  const headerStyle: React.CSSProperties = {
    backgroundColor: isHovered
      ? theme.colors.backgroundTertiary
      : level === 1
      ? theme.colors.backgroundSecondary
      : theme.colors.backgroundTertiary,
    borderBottom: collapsed ? "none" : `1px solid ${theme.colors.border}`,
    justifyContent: "space-between",
    minHeight: "40px",
    padding: "0 16px",
  };

  const headerContentStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    flex: 1,
  };

  const chevronStyle: React.CSSProperties = {
    transition: "transform 0.12s",
    transform: collapsed ? "rotate(0deg)" : "rotate(90deg)",
    color: "#b0b0b0",
    width: "16px",
    height: "16px",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: level === 1 ? "15px" : "13px",
    fontWeight: level === 1 ? 600 : 500,
    color: "#f3f3f3",
    margin: 0,
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: "12px",
    color: "#b0b0b0",
    margin: 0,
    fontStyle: "italic",
  };

  const actionsStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    opacity: isHovered ? 1 : 0.7,
    transition: "opacity 0.12s",
  };

  const contentStyle: React.CSSProperties = {
    padding: collapsed ? "0" : "16px 24px",
    maxHeight: collapsed ? "0px" : "1000px", // Animate height
    overflow: "hidden",
    transition: "all 0.2s",
    backgroundColor: level === 1 ? theme.colors.background : "transparent",
  };

  const contentInnerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    opacity: collapsed ? 0 : 1,
    transition: "opacity 0.2s",
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
        {...hoverProps}
      >
        <div style={headerContentStyle}>
          <ChevronRight size={16} style={chevronStyle} />
          {icon && (
            <div
              style={{
                color: "#38bdf8",
                display: "flex",
                alignItems: "center",
                width: "16px",
                height: "16px",
              }}
            >
              {icon}
            </div>
          )}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: "2px",
            }}
          >
            <h3 style={titleStyle}>{title}</h3>
            {description && <p style={descriptionStyle}>{description}</p>}
          </div>
        </div>
        {actions && (
          <div style={actionsStyle} onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        )}
      </button>
      <div
        id={`panel-section-${title.replace(/\s+/g, "-").toLowerCase()}`}
        style={contentStyle}
        aria-hidden={collapsed}
      >
        <div style={contentInnerStyle}>{children}</div>
      </div>
    </section>
  );
};

export default PanelSection;
