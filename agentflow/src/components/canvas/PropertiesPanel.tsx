/**
 * ================================================================================
 * DEPRECATED: This file is being replaced by UnifiedPropertiesPanel.tsx
 * ================================================================================
 * 
 * This component is deprecated in favor of the new UnifiedPropertiesPanel which
 * provides a single source of truth for all Properties panel rendering with
 * consistent liquid-glass design.
 * 
 * Use UnifiedPropertiesPanel instead for all new development.
 * ================================================================================
 */

"use client";
import React from "react";
import UnifiedPropertiesPanel from "./UnifiedPropertiesPanel";
import { CanvasNode, Connection } from "@/types";

interface PropertiesPanelProps {
  selectedNode: CanvasNode | null;
  onChange: (updatedNode: CanvasNode) => void;
  nodes: CanvasNode[];
  connections: Connection[];
  onConnectionsChange: (next: Connection[]) => void;
  onClose?: () => void;
}

/**
 * DEPRECATED: This component now simply wraps UnifiedPropertiesPanel
 * All Properties panel logic has been moved to UnifiedPropertiesPanel.tsx
 */
export default function PropertiesPanel(props: PropertiesPanelProps) {
  return <UnifiedPropertiesPanel {...props} />;
}
