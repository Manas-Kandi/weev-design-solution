"use client"
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CanvasNode, Connection } from '@/types';
import { theme } from '@/data/theme';
import { nodeCategories } from '@/data/nodeDefinitions';

interface Props {
  nodes: CanvasNode[];
  connections: Connection[];
  onNodeSelect: (n: CanvasNode | null) => void;
  onNodeDrag: (id: string, pos: { x: number; y: number }) => void;
  onConnectionsChange: (c: Connection[]) => void;
  onCreateConnection: (connectionData: Connection) => Promise<void>;
  selectedNodeId: string | null;
  onNodeUpdate: (node: CanvasNode) => void;
}

export default function CanvasEngine(props: Props) {
  const {
    nodes,
    connections,
    onNodeSelect,
    onNodeDrag,
    onConnectionsChange,
    onCreateConnection,
    selectedNodeId,
    onNodeUpdate
  } = props;

  // Canvas state
  const [viewportTransform, setViewportTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Connection state
  const [dragConnection, setDragConnection] = useState<{
    from: { nodeId: string; outputId: string; pos: { x: number; y: number } };
    currentPos: { x: number; y: number };
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Helper functions
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (screenX - rect.left - viewportTransform.x) / viewportTransform.scale,
      y: (screenY - rect.top - viewportTransform.y) / viewportTransform.scale
    };
  }, [viewportTransform]);

  const canvasToScreen = useCallback((canvasX: number, canvasY: number) => {
    return {
      x: canvasX * viewportTransform.scale + viewportTransform.x,
      y: canvasY * viewportTransform.scale + viewportTransform.y
    };
  }, [viewportTransform]);

  const getPortPosition = useCallback((nodeId: string, portType: 'input' | 'output', portIndex: number) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return { x: 0, y: 0 };

    const ports = portType === 'input' ? node.inputs : node.outputs;
    const portCount = ports.length;
    const spacing = node.size.height / (portCount + 1);
    
    return {
      x: node.position.x + (portType === 'input' ? 0 : node.size.width),
      y: node.position.y + spacing * (portIndex + 1)
    };
  }, [nodes]);

  const getNodeIcon = useCallback((node: CanvasNode) => {
    for (const category of nodeCategories) {
      const found = category.nodes.find(n => n.id === node.data.icon || n.id === node.subtype);
      if (found) return found.icon;
    }
    return null;
  }, []);

  // Event handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.metaKey)) {
      // Middle mouse or Cmd+click for panning
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewportTransform.x, y: e.clientY - viewportTransform.y });
      e.preventDefault();
    }
  }, [viewportTransform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setViewportTransform(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      }));
    } else if (isDragging && draggedNode) {
      const canvasPos = screenToCanvas(e.clientX - dragOffset.x, e.clientY - dragOffset.y);
      onNodeDrag(draggedNode, canvasPos);
    } else if (dragConnection) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setDragConnection(prev => prev ? { ...prev, currentPos: canvasPos } : null);
    }
  }, [isPanning, isDragging, draggedNode, dragConnection, panStart, dragOffset, screenToCanvas, onNodeDrag]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDragging(false);
    setDraggedNode(null);
    setDragConnection(null);
  }, []);

  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    onNodeSelect(node);
    setIsDragging(true);
    setDraggedNode(nodeId);

    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setDragOffset({
      x: canvasPos.x - node.position.x,
      y: canvasPos.y - node.position.y
    });
  }, [nodes, onNodeSelect, screenToCanvas]);

  const handlePortMouseDown = useCallback((e: React.MouseEvent, nodeId: string, outputId: string, portIndex: number) => {
    e.stopPropagation();
    
    const portPos = getPortPosition(nodeId, 'output', portIndex);
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    
    setDragConnection({
      from: { nodeId, outputId, pos: portPos },
      currentPos: canvasPos
    });
  }, [getPortPosition, screenToCanvas]);

  const handlePortMouseUp = useCallback(async (e: React.MouseEvent, nodeId: string, inputId: string) => {
    e.stopPropagation();
    
    if (dragConnection) {
      try {
        const connectionData: Connection = {
          id: `conn-${Date.now()}`,
          sourceNode: dragConnection.from.nodeId,
          sourceOutput: dragConnection.from.outputId,
          targetNode: nodeId,
          targetInput: inputId
        };
        
        await onCreateConnection(connectionData);
      } catch (error) {
        console.error('Failed to create connection:', error);
      }
      setDragConnection(null);
    }
  }, [dragConnection, onCreateConnection]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onNodeSelect(null);
    }
  }, [onNodeSelect]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    
    const scaleFactor = 1.1;
    const mousePos = screenToCanvas(e.clientX, e.clientY);
    
    const newScale = e.deltaY > 0 
      ? Math.max(0.1, viewportTransform.scale / scaleFactor)
      : Math.min(3, viewportTransform.scale * scaleFactor);
    
    const scaleRatio = newScale / viewportTransform.scale;
    
    setViewportTransform(prev => ({
      x: e.clientX - (e.clientX - prev.x) * scaleRatio,
      y: e.clientY - (e.clientY - prev.y) * scaleRatio,
      scale: newScale
    }));
  }, [viewportTransform, screenToCanvas]);

  // Add global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => handleMouseUp();
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [handleMouseUp]);

  // Render bezier curve for connections
  const renderConnection = useCallback((connection: Connection) => {
    const sourcePos = getPortPosition(connection.sourceNode, 'output', 0);
    const targetPos = getPortPosition(connection.targetNode, 'input', 0);
    
    const controlOffset = Math.abs(targetPos.x - sourcePos.x) * 0.5;
    
    const path = `M ${sourcePos.x} ${sourcePos.y} C ${sourcePos.x + controlOffset} ${sourcePos.y}, ${targetPos.x - controlOffset} ${targetPos.y}, ${targetPos.x} ${targetPos.y}`;
    
    return (
      <path
        key={connection.id}
        d={path}
        stroke={theme.accent}
        strokeWidth="2"
        fill="none"
        className="drop-shadow-sm"
      />
    );
  }, [getPortPosition]);

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing"
      style={{ backgroundColor: theme.bg }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleCanvasClick}
      onWheel={handleWheel}
    >
      {/* Background Grid */}
      <svg
        ref={svgRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ 
          backgroundImage: `
            linear-gradient(${theme.border} 1px, transparent 1px),
            linear-gradient(90deg, ${theme.border} 1px, transparent 1px)
          `,
          backgroundSize: `${20 * viewportTransform.scale}px ${20 * viewportTransform.scale}px`,
          backgroundPosition: `${viewportTransform.x}px ${viewportTransform.y}px`
        }}
      >
        {/* Connections Layer */}
        <g
          style={{
            transform: `translate(${viewportTransform.x}px, ${viewportTransform.y}px) scale(${viewportTransform.scale})`
          }}
        >
          {connections.map(renderConnection)}
          
          {/* Drag connection preview */}
          {dragConnection && (
            <path
              d={`M ${dragConnection.from.pos.x} ${dragConnection.from.pos.y} L ${dragConnection.currentPos.x} ${dragConnection.currentPos.y}`}
              stroke={theme.accent}
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
              opacity={0.7}
            />
          )}
        </g>
      </svg>

      {/* Nodes Layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${viewportTransform.x}px, ${viewportTransform.y}px) scale(${viewportTransform.scale})`,
          transformOrigin: '0 0'
        }}
      >
        {nodes.map(node => {
          const IconComponent = getNodeIcon(node);
          const isSelected = selectedNodeId === node.id;
          
          return (
            <div
              key={node.id}
              className="absolute pointer-events-auto cursor-pointer"
              style={{
                left: node.position.x,
                top: node.position.y,
                width: node.size.width,
                height: node.size.height,
                backgroundColor: theme.bgElevate,
                border: `2px solid ${isSelected ? theme.accent : theme.border}`,
                borderRadius: '8px',
                boxShadow: isSelected ? `0 0 0 2px ${theme.accent}33` : '0 2px 8px rgba(0,0,0,0.3)'
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
            >
              {/* Node Header */}
              <div 
                className="flex items-center gap-2 p-3 border-b"
                style={{ 
                  borderColor: theme.border,
                  color: theme.text
                }}
              >
                <div
                  className="w-4 h-4 rounded flex items-center justify-center"
                  style={{ backgroundColor: node.data.color }}
                >
                  {IconComponent && (
                    <IconComponent className="w-3 h-3 text-white" />
                  )}
                </div>
                <span className="text-sm font-medium truncate">
                  {node.data.title}
                </span>
              </div>

              {/* Node Body */}
              <div className="p-3">
                <p 
                  className="text-xs truncate"
                  style={{ color: theme.textMute }}
                >
                  {node.data.description}
                </p>
              </div>

              {/* Input Ports */}
              {node.inputs.map((input, index) => (
                <div
                  key={input.id}
                  className="absolute w-3 h-3 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    left: -6,
                    top: (node.size.height / (node.inputs.length + 1)) * (index + 1) - 6,
                    backgroundColor: theme.portBg,
                    borderColor: theme.border
                  }}
                  onMouseUp={(e) => handlePortMouseUp(e, node.id, input.id)}
                  title={input.label}
                />
              ))}

              {/* Output Ports */}
              {node.outputs.map((output, index) => (
                <div
                  key={output.id}
                  className="absolute w-3 h-3 rounded-full border-2 cursor-pointer hover:scale-110 transition-transform"
                  style={{
                    right: -6,
                    top: (node.size.height / (node.outputs.length + 1)) * (index + 1) - 6,
                    backgroundColor: theme.portBg,
                    borderColor: theme.border
                  }}
                  onMouseDown={(e) => handlePortMouseDown(e, node.id, output.id, index)}
                  title={output.label}
                />
              ))}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div 
              className="w-16 h-16 rounded-lg flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: theme.bgElevate }}
            >
              <svg 
                className="w-8 h-8" 
                style={{ color: theme.textMute }}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5z"/>
              </svg>
            </div>
            <div 
              className="text-lg font-medium mb-2"
              style={{ color: theme.textMute }}
            >
              Start building your agent system
            </div>
            <div 
              className="text-sm"
              style={{ color: theme.textMute }}
            >
              Add nodes from the component library to begin
            </div>
          </div>
        </div>
      )}

      {/* Zoom indicator */}
      <div 
        className="absolute bottom-4 right-4 px-2 py-1 rounded text-xs"
        style={{ 
          backgroundColor: theme.bgElevate,
          color: theme.textMute,
          border: `1px solid ${theme.border}`
        }}
      >
        {Math.round(viewportTransform.scale * 100)}%
      </div>
    </div>
  );
}