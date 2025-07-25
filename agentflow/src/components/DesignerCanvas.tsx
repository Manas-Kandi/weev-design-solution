import React from 'react';
import CanvasEngine from '@/components/Canvas';
import { CanvasNode, Connection } from '@/types';

interface DesignerCanvasProps {
  nodes: CanvasNode[];
  connections: Connection[];
  onNodeSelect: (n: CanvasNode | null) => void;
  selectedNodeId: string | null;
  onNodeUpdate: (updated: CanvasNode) => void;
  onConnectionsChange: (c: Connection[]) => void;
  onCreateConnection: (connectionData: Connection) => Promise<void>;
}

export default function DesignerCanvas(props: DesignerCanvasProps) {
  const {
    nodes,
    connections,
    onNodeSelect,
    selectedNodeId,
    onNodeUpdate,
    onConnectionsChange,
    onCreateConnection
  } = props;

  const handleNodeDrag = (id: string, pos: { x: number; y: number }) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    
    onNodeUpdate({ ...node, position: { x: pos.x, y: pos.y } });
  };

  return (
    <div className="flex-1 relative overflow-hidden">
      <CanvasEngine
        nodes={nodes}
        connections={connections}
        onNodeSelect={onNodeSelect}
        onNodeDrag={handleNodeDrag}
        onConnectionsChange={onConnectionsChange}
        onCreateConnection={onCreateConnection}
        selectedNodeId={selectedNodeId}
        onNodeUpdate={onNodeUpdate}
      />
    </div>
  );
}