"use client";

import React from 'react';

type DesignerLayoutProps = {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
};

export default function DesignerLayout(props: DesignerLayoutProps) {
  const { left, center, right } = props;
  const layoutStyle: React.CSSProperties = {
    "--topbar-height": "40px",
    "--toolbar-height": "48px",
    "--header-total-height": "88px", // 40px + 48px
  } as React.CSSProperties;

  return (
    <div
      className="flex-1 w-full flex overflow-hidden bg-[var(--figma-bg)]"
      style={layoutStyle}
    >
      {/* Left Sidebar - Now renders as fixed position overlay */}
      {left}

      {/* Main Content - Full width since left panel is now fixed positioned */}
      <div className="flex-1 flex flex-col w-full">
        <div className="flex-1 flex bg-[var(--figma-bg)] w-full">{center}</div>
      </div>

      {/* Right Sidebar */}
      {right}
    </div>
  );
}
