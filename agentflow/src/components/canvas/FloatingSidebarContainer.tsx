"use client";

import React from "react";
import { CanvasNode, Connection } from "@/types";
import PropertiesPanel from "./PropertiesPanel";
import { SimpleTestingPanel } from "@/features/testing/SimpleTestingPanel";

interface FloatingSidebarContainerProps {
  // Properties Panel props
  selectedNode: CanvasNode | null;
  onNodeChange: (updatedNode: CanvasNode) => void;
  
  // Testing Panel props
  nodes: CanvasNode[];
  connections: Connection[];
  showTesting: boolean;
  onTestingClose: () => void;
  onTesterEvent?: (event: any) => void;
  
  // Shared props
  onConnectionsChange: (next: Connection[]) => void;
  startNodeId?: string | null;
}

export default function FloatingSidebarContainer({
  selectedNode,
  onNodeChange,
  nodes,
  connections,
  showTesting,
  onTestingClose,
  onTesterEvent,
  onConnectionsChange,
  startNodeId,
}: FloatingSidebarContainerProps) {
  const hasPropertiesPanel = selectedNode !== null;
  const hasTestingPanel = showTesting;
  const bothPanelsVisible = hasPropertiesPanel && hasTestingPanel;

  if (bothPanelsVisible) {
    // Vertical split layout when both panels are visible
    return (
      <div className="w-[320px] h-full flex flex-col gap-2">
        {/* Properties Panel - Top Half */}
        <div className="flex-1 min-h-0">
          <PropertiesPanel
            selectedNode={selectedNode}
            onChange={onNodeChange}
            nodes={nodes}
            connections={connections}
            onConnectionsChange={onConnectionsChange}
          />
        </div>

        {/* Testing Panel - Bottom Half */}
        <div className="flex-1 min-h-0">
          <SimpleTestingPanel
            nodes={nodes}
            connections={connections}
            isVisible={true}
            onClose={onTestingClose}
            isPropertiesPanelVisible={hasPropertiesPanel}
            compactMode={true}
            onTesterEvent={onTesterEvent}
            startNodeId={startNodeId ?? null}
            isVerticalSplit={true}
          />
        </div>
      </div>
    );
  }

  // Single panel visible or none
  if (hasPropertiesPanel) {
    return (
      <div className="w-[320px] h-full flex flex-col">
        <div className="flex-1 min-h-0">
          <PropertiesPanel
            selectedNode={selectedNode}
            onChange={onNodeChange}
            nodes={nodes}
            connections={connections}
            onConnectionsChange={onConnectionsChange}
          />
        </div>
      </div>
    );
  }

  if (hasTestingPanel) {
    return (
      <div className="w-[320px] h-full flex flex-col">
        <div className="flex-1 min-h-0">
          <SimpleTestingPanel
            nodes={nodes}
            connections={connections}
            isVisible={true}
            onClose={onTestingClose}
            isPropertiesPanelVisible={hasPropertiesPanel}
            compactMode={false}
            onTesterEvent={onTesterEvent}
            startNodeId={startNodeId ?? null}
            isVerticalSplit={false}
          />
        </div>
      </div>
    );
  }

  return null;
}
