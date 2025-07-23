"use client";

import { ReactNode } from "react";
import { theme as colors } from "@/data/theme";
import { Button } from "@/components/ui/button";
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
}

export default function DesignerLayout({
  left,
  center,
  right,
}: DesignerLayoutProps) {
  return (
    <div
      className="h-screen w-full flex overflow-hidden"
      style={{ backgroundColor: colors.bg }}
    >
      {/* Left Sidebar */}
      {left}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div
          className="h-12 border-b flex items-center justify-between px-4"
          style={{
            backgroundColor: colors.sidebar,
            borderColor: colors.border,
          }}
        >
          <div className="flex items-center space-x-1">
            {[
              { id: "select", name: "Select", icon: MousePointer, shortcut: "V" },
              { id: "hand", name: "Hand", icon: Hand, shortcut: "H" },
              { id: "connect", name: "Connect", icon: Link, shortcut: "C" },
              { id: "text", name: "Comment", icon: FileText, shortcut: "T" },
            ].map((tool) => (
              <button
                key={tool.id}
                className="w-8 h-8 rounded flex items-center justify-center transition-colors hover:bg-white/10"
                style={{ color: colors.textSecondary }}
                title={`${tool.name} (${tool.shortcut})`}
              >
                <tool.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-sm" style={{ color: colors.textSecondary }}>
              100%
            </span>
            <div className="flex items-center space-x-1">
              <button
                className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
                style={{ color: colors.textSecondary }}
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                className="w-7 h-7 rounded flex items-center justify-center hover:bg-white/10 transition-colors"
                style={{ color: colors.textSecondary }}
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-0"
              style={{
                backgroundColor: colors.panel,
                color: colors.text,
                borderColor: colors.border,
              }}
            >
              <Play className="w-4 h-4" />
              Test
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-0"
              style={{
                backgroundColor: colors.panel,
                color: colors.text,
                borderColor: colors.border,
              }}
            >
              <Share className="w-4 h-4" />
              Share
            </Button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex">{center}</div>
      </div>

      {/* Right Sidebar */}
      {right}
    </div>
  );
}
