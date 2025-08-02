"use client";

import { ReactNode } from "react";
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
  return (
    <div className="h-screen w-full flex overflow-hidden bg-[var(--figma-bg)]">
      {/* Left Sidebar */}
      {left}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <TabBar />
        {/* Toolbar */}
        <div className="h-12 border-b flex items-center justify-between px-3 bg-[var(--figma-surface)] border-[var(--figma-border)]">
          <div className="flex items-center gap-1">
            {[
              { id: "select", name: "Select", icon: MousePointer, shortcut: "V" },
              { id: "hand", name: "Hand", icon: Hand, shortcut: "H" },
              { id: "connect", name: "Connect", icon: Link, shortcut: "C" },
              { id: "text", name: "Comment", icon: FileText, shortcut: "T" },
            ].map((tool) => (
              <button
                key={tool.id}
                className="w-7 h-7 flex items-center justify-center transition-colors text-[var(--figma-text-secondary)] hover:bg-[var(--figma-bg)]"
                style={{ borderRadius: "var(--figma-radius)" }}
                title={`${tool.name} (${tool.shortcut})`}
              >
                <tool.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--figma-text-secondary)] font-mono">100%</span>
            <button
              className="w-7 h-7 flex items-center justify-center text-[var(--figma-text-secondary)] hover:bg-[var(--figma-bg)] transition-colors"
              style={{ borderRadius: "var(--figma-radius)" }}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              className="w-7 h-7 flex items-center justify-center text-[var(--figma-text-secondary)] hover:bg-[var(--figma-bg)] transition-colors"
              style={{ borderRadius: "var(--figma-radius)" }}
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
