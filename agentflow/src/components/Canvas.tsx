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

  // --- New state for advanced features ---
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [undoStack, setUndoStack] = useState<CanvasNode[][]>([]);
  const [redoStack, setRedoStack] = useState<CanvasNode[][]>([]);

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

  // --- Mouse Down on Canvas ---
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only start panning if not dragging a node or connection
    if (isDragging || dragConnection) return;
    if (e.button === 1 || (e.button === 0 && e.metaKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewportTransform.x, y: e.clientY - viewportTransform.y });
      e.preventDefault();
    }
  }, [viewportTransform, isDragging, dragConnection]);

  // --- Mouse Move on Canvas ---
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setViewportTransform(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      }));
    } else if (dragConnection) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setDragConnection(prev => prev ? { ...prev, currentPos: canvasPos } : null);
    } else if (isSelecting && selectionRect) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setSelectionRect(rect => rect ? {
        x: rect.x,
        y: rect.y,
        w: canvasPos.x - rect.x,
        h: canvasPos.y - rect.y
      } : null);
    }
  }, [isPanning, panStart, dragConnection, screenToCanvas, isSelecting, selectionRect]);

  // --- Mouse Up on Canvas ---
  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDragging(false);
    setDraggedNode(null);
    setDragConnection(null);
  }, []);

  // --- Node Dragging ---
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (isPanning) return; // Don't drag node while panning
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
  }, [nodes, onNodeSelect, screenToCanvas, isPanning]);

  // --- Connection Dragging ---
  const handlePortMouseDown = useCallback((e: React.MouseEvent, nodeId: string, outputId: string, portIndex: number) => {
    e.stopPropagation();
    if (isPanning) return; // Don't start connection while panning
    const portPos = getPortPosition(nodeId, 'output', portIndex);
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setDragConnection({
      from: { nodeId, outputId, pos: portPos },
      currentPos: canvasPos
    });
  }, [getPortPosition, screenToCanvas, isPanning]);

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

  // --- Wheel Zoom ---
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = 1.1;
    const mousePos = screenToCanvas(e.clientX, e.clientY);
    const newScale = e.deltaY > 0 
      ? Math.max(0.1, viewportTransform.scale / scaleFactor)
      : Math.min(3, viewportTransform.scale * scaleFactor);
    // Keep mouse position fixed during zoom
    setViewportTransform(prev => ({
      x: mousePos.x * newScale - (mousePos.x * prev.scale - prev.x),
      y: mousePos.y * newScale - (mousePos.y * prev.scale - prev.y),
      scale: newScale
    }));
  }, [viewportTransform, screenToCanvas]);

  // --- Node Dragging: Attach listeners to window for smooth drag ---
  useEffect(() => {
    if (!isDragging || !draggedNode) return;
    const handleMove = (e: MouseEvent) => {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      onNodeDrag(draggedNode, {
        x: canvasPos.x - dragOffset.x,
        y: canvasPos.y - dragOffset.y
      });
    };
    const handleUp = () => {
      setIsDragging(false);
      setDraggedNode(null);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, draggedNode, dragOffset, screenToCanvas, onNodeDrag]);

  // --- Canvas Panning: Attach listeners to window for smooth pan ---
  useEffect(() => {
    if (!isPanning) return;
    const handleMove = (e: MouseEvent) => {
      setViewportTransform(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      }));
    };
    const handleUp = () => setIsPanning(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isPanning, panStart]);

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

  // --- Cursor logic ---
  const getCursor = () => {
    if (isDragging) return 'grabbing';
    if (isPanning) return 'grabbing';
    return 'grab';
  };

  // --- Multi-select logic ---
  const handleNodeClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (e.shiftKey) {
      setSelectedNodeIds(prev => prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]);
    } else {
      setSelectedNodeIds([nodeId]);
      onNodeSelect(nodes.find(n => n.id === nodeId) || null);
    }
  }, [nodes, onNodeSelect]);

  // --- Selection rectangle logic ---
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (isDragging || dragConnection || isPanning) return;
    if (e.button !== 0) return;
    setIsSelecting(true);
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    setSelectionRect({ x: canvasPos.x, y: canvasPos.y, w: 0, h: 0 });
  }, [isDragging, dragConnection, isPanning, screenToCanvas]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isSelecting && selectionRect) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setSelectionRect(rect => rect ? {
        x: rect.x,
        y: rect.y,
        w: canvasPos.x - rect.x,
        h: canvasPos.y - rect.y
      } : null);
    }
  }, [isSelecting, selectionRect, screenToCanvas]);

  const handleCanvasMouseUp = useCallback(() => {
    if (isSelecting && selectionRect) {
      // Select all nodes within rectangle
      const x1 = Math.min(selectionRect.x, selectionRect.x + selectionRect.w);
      const y1 = Math.min(selectionRect.y, selectionRect.y + selectionRect.h);
      const x2 = Math.max(selectionRect.x, selectionRect.x + selectionRect.w);
      const y2 = Math.max(selectionRect.y, selectionRect.y + selectionRect.h);
      const selected = nodes.filter(n =>
        n.position.x >= x1 && n.position.x + n.size.width <= x2 &&
        n.position.y >= y1 && n.position.y + n.size.height <= y2
      ).map(n => n.id);
      setSelectedNodeIds(selected);
      setSelectionRect(null);
      setIsSelecting(false);
    }
  }, [isSelecting, selectionRect, nodes]);

  // --- Delete selected nodes ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeIds.length > 0) {
        // Remove selected nodes
        const remaining = nodes.filter(n => !selectedNodeIds.includes(n.id));
        setUndoStack(stack => [...stack, nodes]);
        setSelectedNodeIds([]);
        onConnectionsChange(connections.filter(c => !selectedNodeIds.includes(c.sourceNode) && !selectedNodeIds.includes(c.targetNode)));
        onNodeSelect(null);
        props.onNodeUpdate && remaining.forEach(n => props.onNodeUpdate(n));
      }
      // Select all
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'a') {
        setSelectedNodeIds(nodes.map(n => n.id));
        e.preventDefault();
      }
      // Deselect
      if (e.key === 'Escape') {
        setSelectedNodeIds([]);
        onNodeSelect(null);
      }
      // Duplicate
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'd' && selectedNodeIds.length > 0) {
        const newNodes = nodes.filter(n => selectedNodeIds.includes(n.id)).map(n => ({
          ...n,
          id: `${n.id}-copy-${Date.now()}`,
          position: { x: n.position.x + 30, y: n.position.y + 30 }
        }));
        setUndoStack(stack => [...stack, nodes]);
        props.onNodeUpdate && newNodes.forEach(n => props.onNodeUpdate(n));
        setSelectedNodeIds(newNodes.map(n => n.id));
      }
      // Undo
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        setUndoStack(stack => {
          if (stack.length === 0) return stack;
          setRedoStack(r => [nodes, ...r]);
          props.onNodeUpdate && stack[stack.length - 1].forEach(n => props.onNodeUpdate(n));
          return stack.slice(0, -1);
        });
      }
      // Redo
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'z') {
        setRedoStack(stack => {
          if (stack.length === 0) return stack;
          setUndoStack(u => [...u, nodes]);
          props.onNodeUpdate && stack[0].forEach(n => props.onNodeUpdate(n));
          return stack.slice(1);
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeIds, nodes, connections, onConnectionsChange, onNodeSelect, props.onNodeUpdate]);

  // --- Snap to grid ---
  const snapToGrid = (pos: { x: number; y: number }) => {
    const grid = 20;
    return {
      x: Math.round(pos.x / grid) * grid,
      y: Math.round(pos.y / grid) * grid
    };
  };

  // --- Multi-drag logic ---
  useEffect(() => {
    if (!isDragging || !draggedNode) return;
    const handleMove = (e: MouseEvent) => {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      if (selectedNodeIds.length > 1) {
        // Move all selected nodes by delta
        const node = nodes.find(n => n.id === draggedNode);
        if (!node) return;
        const delta = {
          x: canvasPos.x - dragOffset.x - node.position.x,
          y: canvasPos.y - dragOffset.y - node.position.y
        };
        selectedNodeIds.forEach(id => {
          const n = nodes.find(n => n.id === id);
          if (n) onNodeDrag(id, snapToGrid({ x: n.position.x + delta.x, y: n.position.y + delta.y }));
        });
      } else {
        onNodeDrag(draggedNode, snapToGrid({ x: canvasPos.x - dragOffset.x, y: canvasPos.y - dragOffset.y }));
      }
    };
    const handleUp = () => {
      setIsDragging(false);
      setDraggedNode(null);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, draggedNode, dragOffset, screenToCanvas, onNodeDrag, selectedNodeIds, nodes]);

  // --- Context menu logic ---
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);
  const handleNodeContextMenu = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  }, []);
  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return;
    if (action === 'delete') {
      setSelectedNodeIds(ids => ids.filter(id => id !== contextMenu.nodeId));
      // ...existing delete logic...
    }
    if (action === 'duplicate') {
      // ...existing duplicate logic...
    }
    setContextMenu(null);
  };

  // --- Zoom to fit ---
  const zoomToFit = () => {
    if (nodes.length === 0) return;
    const minX = Math.min(...nodes.map(n => n.position.x));
    const minY = Math.min(...nodes.map(n => n.position.y));
    const maxX = Math.max(...nodes.map(n => n.position.x + n.size.width));
    const maxY = Math.max(...nodes.map(n => n.position.y + n.size.height));
    const padding = 40;
    const canvasW = canvasRef.current?.offsetWidth || 800;
    const canvasH = canvasRef.current?.offsetHeight || 600;
    const scale = Math.min(
      (canvasW - padding) / (maxX - minX),
      (canvasH - padding) / (maxY - minY),
      2
    );
    setViewportTransform({
      x: padding - minX * scale,
      y: padding - minY * scale,
      scale
    });
  };

  // --- Render ---
  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: theme.bg, cursor: getCursor() }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onClick={handleCanvasClick}
      onWheel={handleWheel}
      tabIndex={0}
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

      {/* Selection Rectangle */}
      {selectionRect && (
        <div
          className="absolute border-2 border-blue-400 bg-blue-400/10 pointer-events-none"
          style={{
            left: Math.min(selectionRect.x, selectionRect.x + selectionRect.w) * viewportTransform.scale + viewportTransform.x,
            top: Math.min(selectionRect.y, selectionRect.y + selectionRect.h) * viewportTransform.scale + viewportTransform.y,
            width: Math.abs(selectionRect.w) * viewportTransform.scale,
            height: Math.abs(selectionRect.h) * viewportTransform.scale,
            zIndex: 10
          }}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="absolute bg-white border rounded shadow-lg z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button className="block w-full px-4 py-2 text-left" onClick={() => handleContextMenuAction('delete')}>Delete</button>
          <button className="block w-full px-4 py-2 text-left" onClick={() => handleContextMenuAction('duplicate')}>Duplicate</button>
        </div>
      )}

      {/* Zoom to fit button */}
      <button
        className="absolute top-4 right-4 px-2 py-1 rounded bg-gray-800 text-white text-xs z-20"
        onClick={zoomToFit}
      >
        Zoom to Fit
      </button>

      {/* Nodes Layer */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 2,
          transform: `translate(${viewportTransform.x}px, ${viewportTransform.y}px) scale(${viewportTransform.scale})`,
          transformOrigin: '0 0'
        }}
      >
        {nodes.map(node => {
          const IconComponent = getNodeIcon(node);
          const isSelected = selectedNodeIds.includes(node.id);
          return (
            <div
              key={node.id}
              className={`absolute cursor-pointer pointer-events-auto ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
              style={{
                left: node.position.x,
                top: node.position.y,
                width: node.size.width,
                height: node.size.height,
                backgroundColor: theme.bgElevate,
                border: `2px solid ${isSelected ? theme.accent : theme.border}`,
                borderRadius: '8px',
                boxShadow: isSelected ? `0 0 0 2px ${theme.accent}33` : '0 2px 8px rgba(0,0,0,0.3)',
                zIndex: 3
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onClick={(e) => handleNodeClick(e, node.id)}
              onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
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