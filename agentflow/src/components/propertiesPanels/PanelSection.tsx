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
      className={`border-b border-[#3e3e42] pb-2 mb-2 ${className}`}
      style={{ background: "#232326", borderRadius: 6, padding: "12px 0 0 0" }}
    >
      <button
        type="button"
        className="flex items-center w-full text-left focus:outline-none group"
        onClick={() => setCollapsed((prev) => !prev)}
        style={{ color: "#cccccc", fontWeight: 600, fontSize: 15 }}
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
        <div className="ml-6 mt-1 text-xs text-[#858585]">{description}</div>
      )}
      {!collapsed && (
        <div
          id={`panel-section-${title.replace(/\s+/g, "-").toLowerCase()}`}
          className="mt-2 ml-6"
        >
          {children}
        </div>
      )}
    </section>
  );
};

export default PanelSection;
