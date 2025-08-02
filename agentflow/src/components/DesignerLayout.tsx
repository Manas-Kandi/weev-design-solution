"use client";

import { ReactNode, CSSProperties } from "react";
import TabBar from "@/components/TabBar";
import {
  MousePointer,
  Hand,
  Link,
  FileText,
  Play,
  Share,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

const toolbarStyle: CSSProperties = {
  height: "48px",
  width: "100%",
  borderBottom: "1px solid var(--figma-border)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 12px",
  backgroundColor: "var(--figma-surface)",
};

const toolButtonStyle: CSSProperties = {
  width: "28px",
  height: "28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "var(--figma-radius)",
  border: "1px solid var(--figma-border)",
  backgroundColor: "var(--figma-surface)",
  color: "var(--figma-text-secondary)",
  cursor: "pointer",
  padding: 0,
  transition: "background-color 0.15s ease, color 0.15s ease",
};

interface DesignerLayoutProps {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
  onTestFlow?: () => void;
  testButtonDisabled?: boolean;
}

export default function DesignerLayout({
  left,
  center,
  right,
  onTestFlow,
  testButtonDisabled = false,
}: DesignerLayoutProps) {
  const layoutStyle: React.CSSProperties = {
    "--toolbar-height": "calc(var(--space-xl) + 48px)",
  } as React.CSSProperties;

  return (
    <div
      className="h-screen w-full flex overflow-hidden bg-[var(--figma-bg)]"
      style={layoutStyle}
    >
      {/* Left Sidebar */}
      {left}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <TabBar />
        {/* Toolbar */}
        <div style={toolbarStyle}>
          <div className="flex items-center gap-1">
            {[
              { id: "select", name: "Select", icon: MousePointer, shortcut: "V" },
              { id: "hand", name: "Hand", icon: Hand, shortcut: "H" },
              { id: "connect", name: "Connect", icon: Link, shortcut: "C" },
              { id: "text", name: "Comment", icon: FileText, shortcut: "T" },
            ].map((tool) => (
              <button
                key={tool.id}
                style={toolButtonStyle}
                className="hover:bg-[var(--figma-bg)] active:bg-[var(--figma-border)]"
                title={`${tool.name} (${tool.shortcut})`}
              >
                <tool.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--figma-text-secondary)] font-mono">100%</span>
            <button
              style={toolButtonStyle}
              className="hover:bg-[var(--figma-bg)] active:bg-[var(--figma-border)]"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              style={toolButtonStyle}
              className="hover:bg-[var(--figma-bg)] active:bg-[var(--figma-border)]"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              className="flex items-center gap-1 px-3 py-1 text-xs font-mono bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              style={{ borderRadius: "var(--figma-radius)" }}
              onClick={onTestFlow}
              disabled={testButtonDisabled}
            >
              <Play className="w-4 h-4" />
              Test
            </button>
            <button
              className="flex items-center gap-1 px-3 py-1 text-xs font-mono bg-[var(--figma-surface)] text-[var(--figma-text-secondary)] hover:bg-[var(--figma-bg)] transition-colors"
              style={{ borderRadius: "var(--figma-radius)" }}
            >
              <Share className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex bg-[var(--figma-bg)]">{center}</div>
      </div>

      {/* Right Sidebar */}
      {right}
    </div>
  );
}
