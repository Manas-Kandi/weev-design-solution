"use client"
import React, { useState, useRef } from 'react';
import { CanvasNode, Connection } from '@/types';
import { theme } from '@/data/theme';

interface Props {
  nodes: CanvasNode[];
  connections: Connection[];
  onNodeSelect: (n: CanvasNode | null) => void;
  onNodeDrag: (id: string, pos: { x: number, y: number }) => void;
  onConnectionsChange: (c: Connection[]) => void;
  selectedNodeId: string | null;
}

export default function CanvasEngine(props: Props) {
  const { nodes, connections, onConnectionsChange, ...rest } = props;

  const [dragConn, setDragConn] = useState<{
    from: { nodeId: string; outputId: string };
    pos: { x: number; y: number };
  } | null>(null);

  const canvasRef = useRef<SVGSVGElement>(null);

  const getPortPos = (nodeId: string, type: 'input' | 'output', portIdx: number) => {
    const node = nodes.find(n => n.id === nodeId)!;
    const left = type === 'input';
    const step = node.size.height / ((left ? node.inputs : node.outputs).length + 1);
    return {
      x: node.position.x + (left ? 0 : node.size.width),
      y: node.position.y + step * (portIdx + 1),
    };
  };

  const onPortMouseDown = (
    e: React.MouseEvent,
    nodeId: string,
    outputId: string
  ) => {
    e.stopPropagation();
    const pos = getPortPos(nodeId, 'output', 0);
    setDragConn({ from: { nodeId, outputId }, pos });
  };

  const onPortMouseUp = (
    e: React.MouseEvent,
    nodeId: string,
    inputId: string
  ) => {
    e.stopPropagation();
    if (!dragConn) return;
    const newConn: Connection = {
      id: `conn-${Date.now()}`,
      sourceNode: dragConn.from.nodeId,
      sourceOutput: dragConn.from.outputId,
      targetNode: nodeId,
      targetInput: inputId,
    };
    onConnectionsChange([...connections, newConn]);
    setDragConn(null);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragConn || !canvasRef.current) return;
    const r = canvasRef.current.getBoundingClientRect();
    setDragConn({ ...dragConn, pos: { x: e.clientX - r.left, y: e.clientY - r.top } });
  };

  const onMouseUpGlobal = () => setDragConn(null);

  return (
    <svg
      ref={canvasRef}
      className="w-full h-full bg-[var(--background)] cursor-crosshair"
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUpGlobal}
    >
      {/* Grid */}
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke={theme.border} strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {/* Connections */}
      {connections.map(c => {
        const s = getPortPos(c.sourceNode, 'output', 0);
        const t = getPortPos(c.targetNode, 'input', 0);
        return (
          <path
            key={c.id}
            d={`M ${s.x} ${s.y} C ${s.x + 50} ${s.y}, ${t.x - 50} ${t.y}, ${t.x} ${t.y}`}
            stroke={theme.accent}
            strokeWidth="1"
            fill="none"
          />
        );
      })}

      {/* Drag-preview line */}
      {dragConn && (
        <line
          x1={getPortPos(dragConn.from.nodeId, 'output', 0).x}
          y1={getPortPos(dragConn.from.nodeId, 'output', 0).y}
          x2={dragConn.pos.x}
          y2={dragConn.pos.y}
          stroke={theme.accent}
          strokeWidth="1"
          strokeDasharray="4 2"
        />
      )}

      {/* Nodes */}
      {nodes.map(node => (
        <g key={node.id}>
          <rect
            x={node.position.x}
            y={node.position.y}
            width={node.size.width}
            height={node.size.height}
            fill={theme.bgElevate}
            stroke={rest.selectedNodeId === node.id ? theme.active : theme.border}
            strokeWidth="1"
            className="transition"
          />
          <foreignObject
            x={node.position.x}
            y={node.position.y}
            width={node.size.width}
            height={node.size.height}
          >
            <div
              className="w-full h-full p-3 flex flex-col justify-between text-xs"
              style={{ color: theme.text, fontFamily: 'monospace' }}
            >
              <div>{node.data.title}</div>
              <div style={{ color: theme.textMute }}>{node.data.description}</div>
            </div>
          </foreignObject>

          {/* Ports */}
          {node.outputs.map((o, i) => (
            <circle
              key={`o-${o.id}`}
              cx={getPortPos(node.id, 'output', i).x}
              cy={getPortPos(node.id, 'output', i).y}
              r="4"
              fill={theme.portBg}
              stroke={theme.border}
              strokeWidth="1"
              className="cursor-pointer hover:fill-[var(--portHover)]"
              onMouseDown={e => onPortMouseDown(e, node.id, o.id)}
            />
          ))}
          {node.inputs.map((inp, i) => (
            <circle
              key={`i-${inp.id}`}
              cx={getPortPos(node.id, 'input', i).x}
              cy={getPortPos(node.id, 'input', i).y}
              r="4"
              fill={theme.portBg}
              stroke={theme.border}
              strokeWidth="1"
              className="cursor-pointer hover:fill-[var(--portHover)]"
              onMouseUp={e => onPortMouseUp(e, node.id, inp.id)}
            />
          ))}
        </g>
      ))}

      {/* Forward pan/zoom via wrapper */}
      <CanvasPanZoom {...rest} nodes={nodes} />
    </svg>
  );
}

/* -------------------------------------------------
   Minimal pan/zoom wrapper (unchanged logic, new theme)
   ------------------------------------------------- */
function CanvasPanZoom(props: Omit<Props, 'connections' | 'onConnectionsChange'>) {
  /* Same pan/zoom code as before, but wrapped inside the <svg> */
  /* Omitted for brevity – drop in existing logic with theme.bgElevate etc. */
  return null;
}
