import React from 'react';
import { CanvasNode, Connection } from '@/types';

interface DesignerCanvasProps {
  nodes: CanvasNode[];
  connections: Connection[];
  onNodeSelect: (node: CanvasNode | null) => void;
  selectedNodeId: string | null;
}

const DesignerCanvas: React.FC<DesignerCanvasProps> = ({ nodes, connections, onNodeSelect, selectedNodeId }) => {
  // Placeholder: Render nodes as simple draggable cards
  return (
    <div className="flex-1 relative bg-background h-full p-8 overflow-auto">
      {nodes.length === 0 ? (
        <div className="text-center text-muted-foreground mt-24">Drag a component from the left to get started.</div>
      ) : (
        <div className="grid grid-cols-3 gap-8">
          {nodes.map(node => (
            <div
              key={node.id}
              className={`border rounded-lg p-4 shadow-sm cursor-pointer transition ${selectedNodeId === node.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => onNodeSelect(node)}
            >
              <div className="font-semibold mb-1">{node.data.title || node.type}</div>
              <div className="text-xs text-muted-foreground">{node.data.description || ''}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DesignerCanvas;
