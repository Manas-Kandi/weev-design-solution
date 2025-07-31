import React, { useState, ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface PanelSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
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

  return (
    <section
      className={`border-b border-[var(--af-border)] pb-0 mb-[var(--af-section-spacing)] bg-[var(--af-section-bg)] rounded-[var(--af-border-radius)] pt-[12px] ${className}`}
    >
      <button
        type="button"
        className="flex items-center w-full text-left focus:outline-none group px-4 py-2 transition-colors duration-200 rounded-t-[var(--af-border-radius)]"
        onClick={() => setCollapsed((prev) => !prev)}
        style={{ color: "var(--af-text-primary)", fontWeight: 600, fontSize: 'var(--af-section-header-size)' }}
        aria-expanded={!collapsed}
        aria-controls={`panel-section-${title.replace(/\s+/g, "-").toLowerCase()}`}
      >
        {collapsed ? (
          <ChevronRight size={18} className="mr-2 transition-transform" />
        ) : (
          <ChevronDown size={18} className="mr-2 transition-transform" />
        )}
        {title}
      </button>
      {description && (
        <div className="ml-8 mt-1 text-[var(--af-helper-size)] text-[var(--af-text-helper)] font-normal">{description}</div>
      )}
      <div
        id={`panel-section-${title.replace(/\s+/g, "-").toLowerCase()}`}
        className={`transition-all duration-200 overflow-hidden ${collapsed ? 'max-h-0 opacity-0' : 'max-h-[800px] opacity-100'} ml-8 mt-2 space-y-[var(--af-field-spacing)]`}
        aria-hidden={collapsed}
      >
        {!collapsed && children}
      </div>
    </section>
  );
};

export default PanelSection;
