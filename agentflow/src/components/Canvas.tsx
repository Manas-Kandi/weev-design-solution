"use client"
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { CanvasNode, Connection } from '@/types';
import { theme } from '@/data/theme';
import { nodeCategories } from '@/data/nodeDefinitions';
import ChatBoxNode from './ChatBoxNode';

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

  // Advanced features state
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectionRect, setSelectionRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; nodeId: string } | null>(null);

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
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (isDragging || dragConnection) return;
    if (e.button === 1 || (e.button === 0 && e.metaKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewportTransform.x, y: e.clientY - viewportTransform.y });
      e.preventDefault();
    }
  }, [viewportTransform, isDragging, dragConnection]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setViewportTransform(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      }));
    } else if (dragConnection) {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setDragConnection(prev => prev ? { ...prev, currentPos: canvasPos } : null);
    }
  }, [isPanning, panStart, dragConnection, screenToCanvas]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDragging(false);
    setDraggedNode(null);
    setDragConnection(null);
  }, []);

  // Node interaction handlers
  const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (isPanning) return;
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

  const handleNodeClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (e.shiftKey) {
      setSelectedNodeIds(prev => prev.includes(nodeId) 
        ? prev.filter(id => id !== nodeId)
        : [...prev, nodeId]
      );
    } else {
      setSelectedNodeIds([nodeId]);
    }
  }, []);

  const handleNodeContextMenu = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  }, []);

  // Port interaction handlers - FIXED
  const handlePortMouseDown = useCallback((e: React.MouseEvent, nodeId: string, outputId: string, portIndex: number) => {
    e.stopPropagation();
    console.log('handlePortMouseDown called:', { nodeId, outputId, portIndex });
    if (isPanning) {
      console.log('Ignoring port click during panning');
      return;
    }
    const portPos = getPortPosition(nodeId, 'output', portIndex);
    const canvasPos = screenToCanvas(e.clientX, e.clientY);
    console.log('Port position:', portPos, 'Canvas position:', canvasPos);
    setDragConnection({
      from: { nodeId, outputId, pos: portPos },
      currentPos: canvasPos
    });
    console.log('Drag connection set successfully');
  }, [getPortPosition, screenToCanvas, isPanning]);

  const handlePortMouseUp = useCallback(async (e: React.MouseEvent, nodeId: string, inputId: string) => {
    e.stopPropagation();
    console.log('handlePortMouseUp called:', { nodeId, inputId, dragConnection });
    if (dragConnection) {
      if (dragConnection.from.nodeId === nodeId) {
        console.log('Cannot connect to the same node');
        setDragConnection(null);
        return;
      }
      try {
        const connectionData: Connection = {
          id: `conn-${Date.now()}`,
          sourceNode: dragConnection.from.nodeId,
          sourceOutput: dragConnection.from.outputId,
          targetNode: nodeId,
          targetInput: inputId
        };
        console.log('Creating connection:', connectionData);
        // IMMEDIATE UPDATE: Add to local connections first for instant visual feedback
        console.log('Adding connection immediately to props.onConnectionsChange');
        onConnectionsChange([...connections, connectionData]);
        // Then try to save to database
        try {
          await onCreateConnection(connectionData);
          console.log('Connection saved to database successfully!');
        } catch (dbError) {
          console.error('Failed to save to database, but connection shown locally:', dbError);
          // Connection is already visible, so this is ok for now
        }
      } catch (error) {
        console.error('Failed to create connection:', error);
      } finally {
        setDragConnection(null);
      }
    } else {
      console.log('No drag connection active');
    }
  }, [dragConnection, onCreateConnection, onConnectionsChange, connections]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onNodeSelect(null);
      setContextMenu(null);
    }
  }, [onNodeSelect]);

  // Wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const scaleFactor = 1.1;
    const mousePos = screenToCanvas(e.clientX, e.clientY);
    const newScale = e.deltaY > 0 
      ? Math.max(0.1, viewportTransform.scale / scaleFactor)
      : Math.min(3, viewportTransform.scale * scaleFactor);
    setViewportTransform(prev => ({
      x: mousePos.x * newScale - (mousePos.x * prev.scale - prev.x),
      y: mousePos.y * newScale - (mousePos.y * prev.scale - prev.y),
      scale: newScale
    }));
  }, [viewportTransform, screenToCanvas]);

  // Node dragging effect
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

  // Canvas panning effect
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

  // Render connection lines - FIXED
  const renderConnection = useCallback((connection: Connection) => {
    const sourcePos = getPortPosition(connection.sourceNode, 'output', 0);
    const targetPos = getPortPosition(connection.targetNode, 'input', 0);
    
    // Transform to screen coordinates
    const sourceScreen = canvasToScreen(sourcePos.x, sourcePos.y);
    const targetScreen = canvasToScreen(targetPos.x, targetPos.y);
    
    const controlOffset = Math.abs(targetScreen.x - sourceScreen.x) * 0.3;
    
    const path = `M ${sourceScreen.x} ${sourceScreen.y} C ${sourceScreen.x + controlOffset} ${sourceScreen.y}, ${targetScreen.x - controlOffset} ${targetScreen.y}, ${targetScreen.x} ${targetScreen.y}`;
    
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
  }, [getPortPosition, canvasToScreen]);

  // Context menu actions
  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return;
    if (action === 'delete') {
      setSelectedNodeIds(ids => ids.filter(id => id !== contextMenu.nodeId));
    }
    setContextMenu(null);
  };

  // Zoom to fit
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

  const getCursor = () => {
    if (isDragging) return 'grabbing';
    if (isPanning) return 'grabbing';
    return 'grab';
  };

  // Debug logging
  useEffect(() => {
    console.log('Canvas state:', {
      nodes: nodes.length,
      connections: connections.length,
      dragConnection,
      viewportTransform
    });
  }, [nodes.length, connections.length, dragConnection, viewportTransform]);

  useEffect(() => {
    console.log('Canvas received connections:', connections);
    console.log('Connections count:', connections.length);
    if (connections.length > 0) {
      console.log('Connection details:', connections);
    }
  }, [connections]);

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
      {/* Background Grid and Connections */}
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
        {/* Connections Layer - FIXED */}
        <g>
          {connections.map(renderConnection)}
          
          {/* Drag connection preview - FIXED */}
          {dragConnection && (
            <path
              d={`M ${canvasToScreen(dragConnection.from.pos.x, dragConnection.from.pos.y).x} ${canvasToScreen(dragConnection.from.pos.x, dragConnection.from.pos.y).y} L ${canvasToScreen(dragConnection.currentPos.x, dragConnection.currentPos.y).x} ${canvasToScreen(dragConnection.currentPos.x, dragConnection.currentPos.y).y}`}
              stroke={theme.accent}
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
              opacity={0.7}
            />
          )}
        </g>
      </svg>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="absolute bg-white border rounded shadow-lg z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button className="block w-full px-4 py-2 text-left hover:bg-gray-100" onClick={() => handleContextMenuAction('delete')}>Delete</button>
          <button className="block w-full px-4 py-2 text-left hover:bg-gray-100" onClick={() => handleContextMenuAction('duplicate')}>Duplicate</button>
        </div>
      )}

      {/* Zoom to fit button */}
      <button
        className="absolute top-4 right-4 px-2 py-1 rounded bg-gray-800 text-white text-xs z-20"
        onClick={zoomToFit}
      >
        Zoom to Fit
      </button>

      {/* Debug: Manual Connection Test */}
      <button
        className="absolute top-16 right-4 px-2 py-1 rounded bg-red-600 text-white text-xs z-20"
        onClick={() => {
          if (nodes.length >= 2) {
            const testConnection: Connection = {
              id: `test-conn-${Date.now()}`,
              sourceNode: nodes[0].id,
              sourceOutput: nodes[0].outputs[0]?.id || 'output-1',
              targetNode: nodes[1].id,
              targetInput: nodes[1].inputs[0]?.id || 'input-1'
            };
            console.log('Adding test connection:', testConnection);
            onConnectionsChange([...connections, testConnection]);
          }
        }}
      >
        Test Connection
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
          
          // Chat Interface Node Rendering
          if (node.type === 'ui' && node.subtype === 'chat') {
            return (
              <ChatBoxNode
                key={node.id}
                node={node}
                isSelected={isSelected}
                onNodeMouseDown={handleNodeMouseDown}
                onNodeClick={handleNodeClick}
                onNodeContextMenu={handleNodeContextMenu}
                onNodeUpdate={onNodeUpdate}
                nodes={nodes}
                connections={connections}
                theme={theme}
                onOutputPortMouseDown={handlePortMouseDown}
              />
            );
          }
          
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
                boxShadow: isSelected ? '0 0 0 2px rgba(59, 130, 246, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                zIndex: isSelected ? 10 : 1
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onClick={(e) => handleNodeClick(e, node.id)}
              onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
            >
              {/* Node Content */}
              <div className="w-full h-full p-3 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {IconComponent && <IconComponent size={16} style={{ color: theme.accent }} />}
                    <div style={{ color: theme.text, fontSize: '14px', fontWeight: '500' }}>
                      {node.data.title}
                    </div>
                  </div>
                </div>
                <div style={{ color: theme.textMute, fontSize: '12px', marginTop: '8px' }}>
                  {node.data.description}
                </div>
              </div>

              {/* Input Ports - LARGER AND MORE RESPONSIVE */}
              {node.inputs.map((input, index) => (
                <div
                  key={input.id}
                  className="absolute cursor-pointer hover:scale-125 transition-transform"
                  style={{
                    left: -10,
                    top: (node.size.height / (node.inputs.length + 1)) * (index + 1) - 10,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: theme.portBg,
                    border: `3px solid ${theme.border}`,
                    zIndex: 20
                  }}
                  onMouseUp={(e) => {
                    console.log('Input port mouse up triggered!', node.id, input.id);
                    handlePortMouseUp(e, node.id, input.id);
                  }}
                  onMouseEnter={() => console.log('Hovering input port:', input.id)}
                  title={input.label}
                >
                  {/* Inner dot for better visibility */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: theme.accent
                    }}
                  />
                </div>
              ))}

              {/* Output Ports - LARGER AND MORE RESPONSIVE */}
              {node.outputs.map((output, index) => (
                <div
                  key={output.id}
                  className="absolute cursor-pointer hover:scale-125 transition-transform"
                  style={{
                    right: -10,
                    top: (node.size.height / (node.outputs.length + 1)) * (index + 1) - 10,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    backgroundColor: theme.portBg,
                    border: `3px solid ${theme.border}`,
                    zIndex: 20
                  }}
                  onMouseDown={(e) => {
                    console.log('Output port mouse down triggered!', node.id, output.id, index);
                    handlePortMouseDown(e, node.id, output.id, index);
                  }}
                  onMouseEnter={() => console.log('Hovering output port:', output.id)}
                  title={output.label}
                >
                  {/* Inner dot for better visibility */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: theme.accent
                    }}
                  />
                </div>
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