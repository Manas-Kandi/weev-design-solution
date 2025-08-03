// ===== SMALL FIX #2: PanelSection Component Consistency =====
// Update: src/components/propertiesPanels/PanelSection.tsx

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";

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

export const PanelSection: React.FC<PanelSectionProps> = ({
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
  const [isHovered, setIsHovered] = useState(false);

  // ===== CONSISTENT SECTION STYLING =====
  const sectionStyle: React.CSSProperties = {
    backgroundColor:
      level === 1
        ? theme.colors.backgroundElevated
        : theme.colors.backgroundSecondary,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.components.section.marginBottom,
    overflow: "hidden",
    transition: `all ${theme.animation.medium}`,
  };

  const headerStyle: React.CSSProperties = {
    height: theme.components.section.headerHeight,
    backgroundColor: isHovered
      ? theme.colors.backgroundTertiary
      : theme.colors.backgroundSecondary,
    borderBottom: collapsed ? "none" : `1px solid ${theme.colors.border}`,
    padding: `0 ${theme.spacing.lg}`,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    transition: `all ${theme.animation.fast}`,
    border: "none",
    width: "100%",
    textAlign: "left",
  };

  const headerContentStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.sm,
    flex: 1,
    minWidth: 0, // Prevent flex item from growing beyond container
  };

  const chevronStyle: React.CSSProperties = {
    width: "16px",
    height: "16px",
    color: theme.colors.textSecondary,
    transition: `transform ${theme.animation.fast}`,
    transform: collapsed ? "rotate(0deg)" : "rotate(90deg)",
    flexShrink: 0, // Prevent chevron from shrinking
  };

  const iconStyle: React.CSSProperties = {
    color: theme.colors.textAccent,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "16px",
    height: "16px",
    flexShrink: 0,
  };

  const titleContentStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: "2px",
    flex: 1,
    minWidth: 0,
  };

  const titleStyle: React.CSSProperties = {
    fontSize:
      level === 1 ? theme.typography.fontSize.sm : theme.typography.fontSize.xs,
    fontWeight:
      level === 1
        ? theme.typography.fontWeight.semibold
        : theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    margin: 0,
    lineHeight: theme.typography.lineHeight.tight,
    fontFamily: theme.typography.fontFamily,
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textMuted,
    margin: 0,
    fontStyle: "normal", // Remove italic
    lineHeight: theme.typography.lineHeight.normal,
    fontFamily: theme.typography.fontFamily,
  };

  const actionsStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.sm,
    opacity: isHovered ? 1 : 0.7,
    transition: `opacity ${theme.animation.fast}`,
    flexShrink: 0,
  };

  // ===== PROPER COLLAPSIBLE ANIMATION =====
  const contentStyle: React.CSSProperties = {
    maxHeight: collapsed ? "0px" : "1000px", // Use maxHeight for smooth animation
    overflow: "hidden",
    transition: `max-height ${theme.animation.medium}, padding ${theme.animation.medium}`,
    padding: collapsed ? "0" : theme.spacing.sectionPadding,
  };

  const contentInnerStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.fieldGap,
    opacity: collapsed ? 0 : 1,
    transition: `opacity ${theme.animation.medium}`,
    // Add a slight delay to opacity animation when expanding
    transitionDelay: collapsed ? "0ms" : "100ms",
  };

  return (
    <section style={sectionStyle} className={className}>
      <button
        type="button"
        style={headerStyle}
        onClick={() => setCollapsed(!collapsed)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-expanded={!collapsed}
        aria-controls={`panel-section-${title
          .replace(/\s+/g, "-")
          .toLowerCase()}`}
      >
        <div style={headerContentStyle}>
          <ChevronRight style={chevronStyle} />
          {icon && <div style={iconStyle}>{icon}</div>}
          <div style={titleContentStyle}>
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
