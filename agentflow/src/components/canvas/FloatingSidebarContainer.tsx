"use client";

import React from "react";
import { CanvasNode, Connection } from "@/types";
import FloatingPropertiesPanel from "./FloatingPropertiesPanel";
import { SimpleTestingPanel } from "./SimpleTestingPanel";

interface FloatingSidebarContainerProps {
  // Properties Panel props
  selectedNode: CanvasNode | null;
  onNodeChange: (updatedNode: CanvasNode) => void;
  onNodeClose: () => void;
  
  // Testing Panel props
  nodes: CanvasNode[];
  connections: Connection[];
  showTesting: boolean;
  onTestingClose: () => void;
  onTesterEvent?: (event: any) => void;
  
  // Shared props
  onConnectionsChange: (next: Connection[]) => void;
  startNodeId?: string | null;
  projectId?: string | null;
  projectName?: string | null;
}

export default function FloatingSidebarContainer({
  selectedNode,
  onNodeChange,
  onNodeClose,
  nodes,
  connections,
  showTesting,
  onTestingClose,
  onTesterEvent,
  onConnectionsChange,
  startNodeId,
  projectId = null,
  projectName = null,
}: FloatingSidebarContainerProps) {
  const hasPropertiesPanel = selectedNode !== null;
  const hasTestingPanel = showTesting;
  const bothPanelsVisible = hasPropertiesPanel && hasTestingPanel;

  return (
    <>
      {/* Properties Panel */}
      {hasPropertiesPanel && (
        <FloatingPropertiesPanel
          selectedNode={selectedNode}
          onChange={onNodeChange}
          nodes={nodes}
          connections={connections}
          onConnectionsChange={onConnectionsChange}
          onClose={onNodeClose}
          compactMode={bothPanelsVisible}
        />
      )}

      {/* Testing Panel */}
      {hasTestingPanel && (
        <SimpleTestingPanel
          nodes={nodes}
          connections={connections}
          isVisible={true}
          onClose={onTestingClose}
          isPropertiesPanelVisible={hasPropertiesPanel}
          compactMode={bothPanelsVisible}
          onTesterEvent={onTesterEvent}
          startNodeId={startNodeId ?? null}
        />
      )}
    </>
  );
}
