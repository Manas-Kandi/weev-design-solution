import React from "react";
import { CanvasNode } from "@/types";

interface PortsProps {
  node: CanvasNode;
  onInputPortMouseDown?: (e: React.MouseEvent, nodeId: string) => void;
  onOutputPortMouseDown?: (e: React.MouseEvent, nodeId: string) => void;
  onInputPortMouseUp?: (e: React.MouseEvent, nodeId: string) => void;
  onOutputPortMouseUp?: (e: React.MouseEvent, nodeId: string) => void;
  onContextInputPortMouseDown?: (e: React.MouseEvent, nodeId: string) => void;
  onContextOutputPortMouseDown?: (e: React.MouseEvent, nodeId: string) => void;
}

const Ports = ({ 
  node, 
  onInputPortMouseDown, 
  onOutputPortMouseDown,
  onInputPortMouseUp,
  onOutputPortMouseUp,
  onContextInputPortMouseDown,
  onContextOutputPortMouseDown
}: PortsProps) => {
  const accentColor = "#00c4ff"; // or get from node

  const ConnectionPoint = ({ 
    position, 
    type, 
    onMouseDown, 
    onMouseUp,
    title,
    showPlus = true,
  }: {
    position: { x: number; y: number };
    type: 'input' | 'output' | 'context';
    onMouseDown?: (e: React.MouseEvent) => void;
    onMouseUp?: (e: React.MouseEvent) => void;
    title: string;
    showPlus?: boolean;
  }) => {
    const [isHovered, setIsHovered] = React.useState(false);
    
    return (
      <div
        style={{
          position: 'absolute',
          left: position.x - 12,
          top: position.y - 12,
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: isHovered 
            ? 'rgba(59, 130, 246, 0.15)'
            : 'transparent',
          border: isHovered 
            ? '2px solid rgba(59, 130, 246, 0.4)'
            : '1px solid transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transform: isHovered ? 'scale(1.1)' : 'scale(1)',
          transition: 'opacity 160ms ease, transform 160ms ease, background 160ms ease, border-color 160ms ease',
          backdropFilter: isHovered ? 'blur(8px)' : 'none',
          zIndex: 30,
          pointerEvents: 'all', // Ensure pointer events are enabled
          opacity: isHovered ? 1 : 0,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        title={title}
      >
        {showPlus && (
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path 
              d="M5 1v8M1 5h8" 
              stroke={isHovered ? "#3b82f6" : "transparent"}
              strokeWidth="1.5" 
              strokeLinecap="round"
            />
          </svg>
        )}
      </div>
    );
  };

  // Position them only 3px away from node edges
  // Use the same height calculation as in Canvas.tsx to ensure proper alignment
  const actualNodeHeight = Math.max(46, node.size.height * 0.7);
  const positions = {
    left: { x: -15, y: actualNodeHeight / 2 },          // Right edge 3px to the left of node
    right: { x: node.size.width + 15, y: actualNodeHeight / 2 },  // Left edge 3px to the right of node
    top: { x: node.size.width / 2, y: -15 },            // Bottom edge 3px above node
    bottom: { x: node.size.width / 2, y: actualNodeHeight + 15 }  // Top edge 3px below node
  };
  
  // Debug: Log positions to console
  // console.log('Port positions:', positions, 'Node size:', node.size, 'Actual height:', actualNodeHeight);

  return (
    <div style={{ position: 'absolute', top: 0, left: 0, width: node.size.width, height: actualNodeHeight, pointerEvents: 'none' }}>
      {/* Left input port intentionally not rendered. Snapping is handled globally. */}

      {/* Right Output */}
      <ConnectionPoint
        position={positions.right}
        type="output"
        onMouseDown={(e) => onOutputPortMouseDown?.(e, node.id)}
        onMouseUp={(e) => onOutputPortMouseUp?.(e, node.id)}
        title="Output"
        showPlus={true}
      />

      {/* Top Context Input */}
      <ConnectionPoint
        position={positions.top}
        type="context"
        onMouseDown={(e) => onContextInputPortMouseDown?.(e, node.id)}
        onMouseUp={(e) => onInputPortMouseUp?.(e, node.id)}
        title="Context In"
      />

      {/* Bottom Context Output */}
      <ConnectionPoint
        position={positions.bottom}
        type="context"
        onMouseDown={(e) => onContextOutputPortMouseDown?.(e, node.id)}
        onMouseUp={(e) => onOutputPortMouseUp?.(e, node.id)}
        title="Context Out"
      />
    </div>
  );
};

export default Ports;
