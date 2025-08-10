"use client";

import { Layers as LayersIcon } from "lucide-react";
import { CanvasNode } from "@/types";

interface LayersPanelProps {
  nodes: CanvasNode[];
}

export default function LayersPanel({ nodes }: LayersPanelProps) {
  return (
    <aside className="w-64 bg-[var(--figma-surface)] flex flex-col">
      <div className="p-[var(--space-md)]">
        <h2 className="font-medium text-[var(--fs-sm)]">Layers</h2>
      </div>
      <div className="flex-1 overflow-y-auto figma-scrollbar p-[var(--space-sm)]">
        <ul className="space-y-[var(--space-xs)]">
          {nodes.map((node) => {
            const title = (node.data as { title?: string }).title ?? node.id;

            return (
              <li
                key={node.id}
                className="flex items-center gap-[var(--space-sm)] rounded cursor-pointer hover:bg-[var(--figma-bg)] px-[var(--space-sm)] py-[var(--space-xs)] text-[var(--fs-sm)]"
              >
                <LayersIcon className="w-4 h-4 text-[var(--figma-text-secondary)]" />
                <span className="truncate">{title}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

