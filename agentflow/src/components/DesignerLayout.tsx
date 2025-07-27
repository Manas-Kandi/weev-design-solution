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
    <div
      className="h-screen w-full flex overflow-hidden bg-[#18181b]"
      style={{ fontFamily: 'Inter, Menlo, monospace' }}
    >
      {/* Left Sidebar */}
      {left}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div
          className="h-12 border-b flex items-center justify-between px-3 bg-[#23232a] border-[#23232a]"
          style={{ fontFamily: 'Inter, Menlo, monospace' }}
        >
          <div className="flex items-center gap-1">
            {[
              { id: "select", name: "Select", icon: MousePointer, shortcut: "V" },
              { id: "hand", name: "Hand", icon: Hand, shortcut: "H" },
              { id: "connect", name: "Connect", icon: Link, shortcut: "C" },
              { id: "text", name: "Comment", icon: FileText, shortcut: "T" },
            ].map((tool) => (
              <button
                key={tool.id}
                className="w-7 h-7 flex items-center justify-center transition-colors text-gray-400 hover:bg-[#18181b]"
                style={{ borderRadius: 4 }}
                title={`${tool.name} (${tool.shortcut})`}
              >
                <tool.icon className="w-4 h-4" />
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono">100%</span>
            <button
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:bg-[#18181b] transition-colors"
              style={{ borderRadius: 4 }}
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:bg-[#18181b] transition-colors"
              style={{ borderRadius: 4 }}
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              className="flex items-center gap-1 px-3 py-1 text-xs font-mono bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              style={{ borderRadius: 4 }}
              onClick={onTestFlow}
              disabled={testButtonDisabled}
            >
              <Play className="w-4 h-4" />
              Test
            </button>
            <button
              className="flex items-center gap-1 px-3 py-1 text-xs font-mono bg-[#23232a] text-gray-300 hover:bg-[#18181b] transition-colors"
              style={{ borderRadius: 4 }}
            >
              <Share className="w-4 h-4" />
              Share
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 flex bg-[#18181b]">{center}</div>
      </div>

      {/* Right Sidebar */}
      {right}
    </div>
  );
}
