// ===== SMALL FIX #2: PanelSection Component Consistency =====
// Update: src/components/propertiesPanels/PanelSection.tsx

import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { figmaPropertiesTheme as theme } from "../panels/propertiesPanelTheme";

interface PanelSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  className?: string;
  level?: 1 | 2 | 3; // For nested sections
  icon?: React.ReactNode;
  actions?: React.ReactNode; // For section-level actions
  sticky?: boolean; // Make header stick to top of scroll container
  stickyOffset?: number; // Optional offset for sticky headers
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
  sticky = false,
  stickyOffset = 0,
}) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [isHovered, setIsHovered] = useState(false);

  // Calculate left padding based on nesting level
  const basePadding = parseInt(theme.spacing.lg);
  const leftPadding = `${basePadding * level}px`;

  // ===== CONSISTENT SECTION STYLING =====
  const sectionStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    borderRadius: 0,
    marginBottom: theme.components.section.marginBottom,
    overflowX: "hidden",
    overflowY: "visible",
    transition: `all ${theme.animation.medium}`,
    boxShadow: "none",
    padding: 0,
    maxWidth: "100%",
    minWidth: 0,
    width: "100%",
    boxSizing: "border-box",
    wordBreak: "break-word",
  };

  const headerStyle: React.CSSProperties = {
    height: theme.components.section.headerHeight,
    background: sticky ? theme.colors.backgroundSecondary : "none",
    border: "none",
    borderBottom: "none",
    paddingRight: theme.spacing.lg,
    paddingLeft: leftPadding,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    transition: `all ${theme.animation.fast}`,
    width: "100%",
    textAlign: "left",
    boxShadow: "none",
    ...(sticky && {
      position: "sticky",
      top: stickyOffset,
      zIndex: 1,
    }),
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
    color: theme.colors.textSecondary,
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
    maxHeight: collapsed ? "0px" : "1000px",
    overflowX: "hidden",
    overflowY: "visible",
    transition: `max-height ${theme.animation.medium}, padding ${theme.animation.medium}`,
    paddingRight: collapsed ? "0" : theme.spacing.lg,
    paddingLeft: collapsed ? "0" : leftPadding,
    boxSizing: "border-box",
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
  };

  const contentInnerStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
    gap: theme.spacing.fieldGap,
    opacity: collapsed ? 0 : 1,
    transition: `opacity ${theme.animation.medium}`,
    transitionDelay: collapsed ? "0ms" : "100ms",
    width: "100%",
    minWidth: 0,
    maxWidth: "100%",
    margin: 0,
    boxSizing: "border-box",
    wordBreak: "break-word",
    whiteSpace: "pre-line",
    overflowX: "hidden",
  };

  return (
    <section style={sectionStyle} className={className}>
      <div
        role="button"
        tabIndex={0}
        style={headerStyle}
        onClick={() => setCollapsed(!collapsed)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setCollapsed(!collapsed);
          }
        }}
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
      </div>

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
