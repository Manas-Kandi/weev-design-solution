import React from 'react';
import CanvasEngine from '@/lib/canvas-engine/CanvasEngine';
import { CanvasNode, Connection } from '@/types';

interface Props {
  nodes: CanvasNode[];
  connections: Connection[];
  onNodeSelect: (n: CanvasNode | null) => void;
  selectedNodeId: string | null;
  onNodeUpdate: (updated: CanvasNode) => void;
  onConnectionsChange: (c: Connection[]) => void;
}

export default function DesignerCanvas(props: Props) {
  const handleNodeDrag = (id: string, pos: { x: number; y: number }) => {
    const node = props.nodes.find(n => n.id === id)!;
    props.onNodeUpdate({ ...node, position: pos });
  };

  return <CanvasEngine {...props} onNodeDrag={handleNodeDrag} />;
}
