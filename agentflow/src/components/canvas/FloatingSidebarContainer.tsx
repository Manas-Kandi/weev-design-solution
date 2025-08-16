"use client";

import React from "react";
import { CanvasNode, Connection } from "@/types";
import PropertiesPanel from "./PropertiesPanel";
import FlowExecutionPanel from "@/features/testing/FlowExecutionPanel";

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
  onPropertiesClose?: () => void;
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
  onPropertiesClose,
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
            onClose={onPropertiesClose}
          />
        </div>

        {/* Flow Execution Panel - Bottom Half */}
        <div className="flex-1 min-h-0">
          <FlowExecutionPanel
            nodes={nodes}
            connections={connections}
            selectedNode={selectedNode}
            isVisible={true}
            onClose={onTestingClose}
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
            onClose={onPropertiesClose}
          />
        </div>
      </div>
    );
  }

  if (hasTestingPanel) {
    return (
      <div className="w-[320px] h-full flex flex-col">
        <div className="flex-1 min-h-0">
          <FlowExecutionPanel
            nodes={nodes}
            connections={connections}
            selectedNode={selectedNode}
            isVisible={true}
            onClose={onTestingClose}
          />
        </div>
      </div>
    );
  }

  return null;
}
