"use client";

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
      {/* Left Sidebar */}
      {left}

      {/* Main Content - toolbar removed, only canvas remains */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 flex bg-[var(--figma-bg)]">{center}</div>
      </div>

      {/* Right Sidebar */}
      {right}
    </div>
  );
}
