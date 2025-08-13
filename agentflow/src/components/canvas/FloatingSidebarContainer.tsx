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

  if (bothPanelsVisible) {
    // Vertical split layout when both panels are visible
    return (
      <div
        className="fixed top-4 bottom-4 right-4 z-50 flex flex-col gap-2"
        style={{ width: '400px' }}
      >
        {/* Properties Panel - Top Half */}
        <div className="flex-1 min-h-0">
          <FloatingPropertiesPanel
            selectedNode={selectedNode}
            onNodeChange={onNodeChange}
            onClose={onNodeClose}
            onConnectionsChange={onConnectionsChange}
            isTestingPanelVisible={hasTestingPanel}
            compactMode={true}
            isVerticalSplit={true}
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

  return (
    <>
      {/* Properties Panel - Full Size */}
      {hasPropertiesPanel && (
        <FloatingPropertiesPanel
          selectedNode={selectedNode}
          onNodeChange={onNodeChange}
          onClose={onNodeClose}
          onConnectionsChange={onConnectionsChange}
          isTestingPanelVisible={hasTestingPanel}
          compactMode={false}
          isVerticalSplit={false}
        />
      )}

      {/* Testing Panel - Full Size */}
      {hasTestingPanel && (
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
      )}
    </>
  );
}
