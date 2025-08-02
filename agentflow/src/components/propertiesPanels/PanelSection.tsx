// All UI rules for properties panels must come from propertiesPanelTheme.ts
// Enhanced PanelSection component with VS Code styling
import React, { useState } from "react";
import { ChevronRight } from "lucide-react";
import { figmaPropertiesTheme as theme, themeHelpers } from "./propertiesPanelTheme";

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
  const [isHovered, setIsHovered] = useState(false);

  // Get styles based on section level
  const sectionStyle: React.CSSProperties = {
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: level === 1 ? theme.colors.background : theme.colors.backgroundSecondary,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
    transition: `all ${theme.animation.medium}`,
  };

  const headerStyle: React.CSSProperties = {
    ...themeHelpers.getSectionHeaderStyle(),
    backgroundColor: isHovered 
      ? theme.colors.backgroundTertiary 
      : (level === 1 ? theme.colors.backgroundSecondary : theme.colors.backgroundTertiary),
    borderBottom: collapsed ? 'none' : `1px solid ${theme.colors.border}`,
    justifyContent: 'space-between',
    minHeight: theme.components.section.headerHeight,
    padding: `0 ${theme.spacing.md}`,
  };

  const headerContentStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  };

  const chevronStyle: React.CSSProperties = {
    transition: `transform ${theme.animation.fast}`,
    transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)',
    color: theme.colors.textSecondary,
    width: '16px',
    height: '16px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: level === 1 ? theme.typography.fontSize.base : theme.typography.fontSize.sm,
    fontWeight: level === 1 ? theme.typography.fontWeight.semibold : theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    margin: 0,
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    margin: 0,
    fontStyle: 'italic',
  };

  const actionsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    opacity: isHovered ? 1 : 0.7,
    transition: `opacity ${theme.animation.fast}`,
  };

  const contentStyle: React.CSSProperties = {
    padding: collapsed ? '0' : `${theme.spacing.md} ${theme.spacing.lg}`,
    maxHeight: collapsed ? '0px' : '1000px', // Animate height
    overflow: 'hidden',
    transition: `all ${theme.animation.medium}`,
    backgroundColor: level === 1 ? theme.colors.background : 'transparent',
  };

  const contentInnerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.md,
    opacity: collapsed ? 0 : 1,
    transition: `opacity ${theme.animation.medium}`,
  };

  return (
    <section style={sectionStyle} className={className}>
      <button
        type="button"
        style={headerStyle}
        onClick={() => setCollapsed(prev => !prev)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-expanded={!collapsed}
        aria-controls={`panel-section-${title.replace(/\s+/g, "-").toLowerCase()}`}
      >
        <div style={headerContentStyle}>
          <ChevronRight
            size={16}
            style={chevronStyle}
          />
          {icon && (
            <div style={{ 
              color: theme.colors.textAccent, 
              display: 'flex', 
              alignItems: 'center',
              width: '16px',
              height: '16px',
            }}>
              {icon}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
            <h3 style={titleStyle}>{title}</h3>
            {description && (
              <p style={descriptionStyle}>{description}</p>
            )}
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
        <div style={contentInnerStyle}>
          {children}
        </div>
      </div>
    </section>
  );
};

export default PanelSection;
