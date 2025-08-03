"use client";

import { Bot } from "lucide-react";

export default function AgentFlowLogo() {
  return (
    <div className="flex items-center gap-2 select-none" style={{ height: 32 }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--figma-accent)]">
        <Bot className="w-6 h-6 text-[var(--figma-bg)]" />
      </div>
      <span className="text-lg font-mono font-semibold text-[var(--figma-text)] tracking-wide">AgentFlow</span>
    </div>
  );
}
