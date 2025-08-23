"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { CanvasNode, Connection } from "@/types";
import { theme } from "@/data/theme";
import { simplifiedNodeCategories as nodeCategories } from "@/data/simplifiedNodeDefinitions";
import Ports from "./Ports";
import Connections, { ConnectionsHandle } from "./Connections";
import { externalToolsCatalog, ExternalTool, getExternalToolIcon } from "@/data/externalTools";
import TrackpadController, { type Transform } from "@/canvas/input/TrackpadController";

const canvasStyle: React.CSSProperties = {
  backgroundColor: "#0D0D0D", // pure dark
  backgroundImage: `radial-gradient(circle, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
  backgroundSize: "20px 20px",
};

const rulerStyle: React.CSSProperties = {
  position: "absolute",
  backgroundColor: theme.bgElevate,
  color: theme.textMute,
  fontSize: "10px",
  pointerEvents: "none",
  zIndex: 30,
};

interface CanvasProps {
  nodes: CanvasNode[];
  connections: Connection[];
  onNodeSelect: (node: CanvasNode | null) => void;
  onNodeUpdate: (node: CanvasNode) => void;
  onConnectionsChange: (connections: Connection[]) => void;
  onCreateConnection: (connectionData: Connection) => void;
  onNodeDrag?: (nodeId: string, position: { x: number; y: number }) => void;
  selectedNodeId?: string | null;
  startNodeId?: string | null;
  onStartNodeChange?: (nodeId: string | null) => void;
  onNodeDelete?: (nodeId: string) => void;
  nodeStatuses?: Record<string, "running" | "success" | "error">;
  pulsingConnectionIds?: string[];
}

export default function CanvasEngine(props: CanvasProps) {
  const {
    nodes,
    connections,
    onNodeSelect,
    onNodeDrag,
    onConnectionsChange,
    onCreateConnection,
    selectedNodeId,
    onNodeUpdate,
    startNodeId,
    onStartNodeChange,
    nodeStatuses = {},
    pulsingConnectionIds = [],
  } = props;

  // Canvas state
  const [viewportTransform, setViewportTransform] = useState({
    x: 0,
    y: 0,
    scale: 1,
  });
  const [isDragging, setIsDragging] = useState(false);
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Advanced features state
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectionRect, setSelectionRect] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);
  const [pulsingNodeId, setPulsingNodeId] = useState<string | null>(null);
  const [expandedToolPicker, setExpandedToolPicker] = useState<string | null>(null);
  const [toolSearch, setToolSearch] = useState<Record<string, string>>({});

  const canvasRef = useRef<HTMLDivElement>(null);
  const connectionsRef = useRef<ConnectionsHandle>(null);
  const controllerRef = useRef<TrackpadController | null>(null);
  const latestTransformRef = useRef<Transform>({ x: 0, y: 0, scale: 1 });

  // Keep latest transform in a ref for the controller's getter
  useEffect(() => {
    latestTransformRef.current = {
      x: viewportTransform.x,
      y: viewportTransform.y,
      scale: viewportTransform.scale,
    };
  }, [viewportTransform.x, viewportTransform.y, viewportTransform.scale]);

  // Initialize TrackpadController
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    controllerRef.current?.dispose?.();
    controllerRef.current = new TrackpadController(
      el,
      () => latestTransformRef.current,
      (next) => {
        setViewportTransform({ x: next.x, y: next.y, scale: next.scale });
      }
    );
    return () => {
      controllerRef.current?.dispose?.();
      controllerRef.current = null;
    };
  }, []);

  const handleNodeUpdateWithPulse = useCallback(
    (node: CanvasNode) => {
      setPulsingNodeId(node.id);
      onNodeUpdate(node);
      setTimeout(() => setPulsingNodeId(null), 600);
    },
    [onNodeUpdate]
  );

  // Helper functions
  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      return {
        x:
          (screenX - rect.left - viewportTransform.x) / viewportTransform.scale,
        y: (screenY - rect.top - viewportTransform.y) / viewportTransform.scale,
      };
    },
    [viewportTransform]
  );

  const canvasToScreen = useCallback(
    (canvasX: number, canvasY: number) => {
      return {
        x: canvasX * viewportTransform.scale + viewportTransform.x,
        y: canvasY * viewportTransform.scale + viewportTransform.y,
      };
    },
    [viewportTransform]
  );

  const getPortPosition = useCallback(
    (nodeId: string, portType: "input" | "output", portIndex: number) => {
      const node = nodes.find((n: CanvasNode) => n.id === nodeId);
      if (!node) return { x: 0, y: 0 };

      // Our Ports UI renders floating 24x24 circles offset by 15px from edges.
      // The connector should originate from the CENTER of those circles.
      const actualNodeHeight = Math.max(46, node.size.height * 0.7);
      if (portType === "input") {
        return {
          x: node.position.x - 3, // -15 + 12 (center of 24px)
          y: node.position.y + actualNodeHeight / 2,
        };
      } else {
        return {
          x: node.position.x + node.size.width + 3, // +15 - 12 (center of 24px)
          y: node.position.y + actualNodeHeight / 2,
        };
      }
    },
    [nodes]
  );

  const getNodeIcon = useCallback((node: CanvasNode) => {
    // Type guard for icon property
    const icon =
      typeof node.data === "object" && node.data !== null && "icon" in node.data
        ? (node.data as { icon?: string }).icon
        : undefined;
    for (const category of nodeCategories) {
      const found = category.nodes.find(
        (n) => n.id === icon || n.id === node.subtype
      );
      if (found) return found.icon;
    }
    return null;
  }, []);

  // Type guard for title and description
  const getNodeTitle = (node: CanvasNode) => {
    return typeof node.data === "object" &&
      node.data !== null &&
      "title" in node.data
      ? (node.data as { title?: string }).title || ""
      : "";
  };
  const getNodeDescription = (node: CanvasNode) => {
    return typeof node.data === "object" &&
      node.data !== null &&
      "description" in node.data
      ? (node.data as { description?: string }).description || ""
      : "";
  };

  // Get node accent color based on node type - muted professional palette
  const getNodeAccentColor = useCallback((node: CanvasNode) => {
    // Type guard for icon property
    const icon =
      typeof node.data === "object" && node.data !== null && "icon" in node.data
        ? (node.data as { icon?: string }).icon
        : undefined;
    
    // Check for specific node subtypes first
    if (icon === "agent-node" || node.subtype === "agent") return "#4AA3FF";
    if (icon === "tool-node" || node.subtype === "tool") return "#FFB84A";
    if (icon === "router-node" || node.subtype === "router" || node.subtype === "if-else" || node.subtype === "decision-tree") return "#FF6E6E";
    if (icon === "memory-node" || node.subtype === "memory" || node.subtype === "knowledge-base") return "#E06AFF";
    if (icon === "message-node" || node.subtype === "message") return "#4ECDC4";
    if (icon === "template-node" || node.subtype === "template" || node.subtype === "prompt-template") return "#95E1D3";
    
    // Fallback to category colors from nodeCategories
    for (const category of nodeCategories) {
      const found = category.nodes.find(
        (n) => n.id === icon || n.id === node.subtype
      );
      if (found) {
        // Desaturate the category color by 40%
        const color = found.color;
        if (color.startsWith('#')) {
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          // Desaturate by moving towards gray
          const gray = (r + g + b) / 3;
          const newR = Math.round(r + (gray - r) * 0.4);
          const newG = Math.round(g + (gray - g) * 0.4);
          const newB = Math.round(b + (gray - b) * 0.4);
          return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
        }
        return color;
      }
    }
    
    // Default muted colors based on node type
    switch (node.type) {
      case "agent":
        return "#4AA3FF";
      case "logic":
        return "#FF6E6E";
      case "conversation":
        return "#4ECDC4";
      case "testing":
        return "#FFB84A";
      case "ui":
        return "#E06AFF";
      default:
        return "#8B8B8B";
    }
  }, []);

  // Event handlers
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging) return;
      if (e.button === 1 || (e.button === 0 && e.metaKey)) {
        setIsPanning(true);
        setPanStart({
          x: e.clientX - viewportTransform.x,
          y: e.clientY - viewportTransform.y,
        });
        e.preventDefault();
      }
    },
    [viewportTransform, isDragging]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setViewportTransform((prev) => ({
          ...prev,
          x: e.clientX - panStart.x,
          y: e.clientY - panStart.y,
        }));
      } else {
        connectionsRef.current?.handleCanvasMouseMove(e);
      }
    },
    [isPanning, panStart]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsPanning(false);
    setIsDragging(false);
    setDraggedNode(null);
    connectionsRef.current?.handleCanvasMouseUp();
  }, []);

  // Node interaction handlers
  const handleNodeMouseDown = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.stopPropagation();
      if (isPanning) return;
      const node = nodes.find((n: CanvasNode) => n.id === nodeId);
      if (!node) return;

      // For external-apps nodes, allow dragging but don't open properties panel
      if (node.subtype !== 'external-apps') {
        onNodeSelect(node);
      }

      setIsDragging(true);
      setDraggedNode(nodeId);

      // Calculate precise drag offset for cursor lock
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setDragOffset({
        x: canvasPos.x - node.position.x,
        y: canvasPos.y - node.position.y,
      });

      // Set cursor to grabbing for visual feedback
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    },
    [nodes, onNodeSelect, screenToCanvas, isPanning]
  );

  const handleNodeClick = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (e.shiftKey) {
      setSelectedNodeIds((prev) =>
        prev.includes(nodeId)
          ? prev.filter((id) => id !== nodeId)
          : [...prev, nodeId]
      );
    } else {
      setSelectedNodeIds([nodeId]);
    }
  }, []);

  const handleNodeContextMenu = useCallback(
    (e: React.MouseEvent, nodeId: string) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        setContextMenu({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
          nodeId: nodeId,
        });
      }
    },
    []
  );

  // Port interaction handlers are managed by Connections component via ref

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onNodeSelect(null);
        setContextMenu(null);
      }
    },
    [onNodeSelect]
  );



  // Optimized node dragging with requestAnimationFrame for minimal lag
  useEffect(() => {
    if (!isDragging || !draggedNode) return;
    
    let animationId: number;
    let lastMouseEvent: MouseEvent | null = null;
    let isUpdateScheduled = false;

    const updateNodePosition = () => {
      if (lastMouseEvent && draggedNode) {
        const canvasPos = screenToCanvas(lastMouseEvent.clientX, lastMouseEvent.clientY);
        onNodeDrag(draggedNode, {
          x: canvasPos.x - dragOffset.x,
          y: canvasPos.y - dragOffset.y,
        });
      }
      isUpdateScheduled = false;
    };

    const handleMove = (e: MouseEvent) => {
      lastMouseEvent = e;
      // Use requestAnimationFrame for smooth 60fps updates
      if (!isUpdateScheduled) {
        isUpdateScheduled = true;
        animationId = requestAnimationFrame(updateNodePosition);
      }
    };

    const handleUp = () => {
      setIsDragging(false);
      setDraggedNode(null);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      // Restore cursor and user selection
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener("mousemove", handleMove, { passive: true });
    window.addEventListener("mouseup", handleUp);
    
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isDragging, draggedNode, dragOffset, screenToCanvas, onNodeDrag]);

  // Canvas panning effect
  useEffect(() => {
    if (!isPanning) return;
    const handleMove = (e: MouseEvent) => {
      setViewportTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
    };
    const handleUp = () => setIsPanning(false);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [isPanning, panStart]);

  // Connection rendering handled by Connections component

  // Context menu actions
  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return;
    if (action === "set-start") {
      onStartNodeChange(contextMenu.nodeId);
    } else if (action === "remove-start") {
      if (startNodeId === contextMenu.nodeId) {
        onStartNodeChange(null);
      }
    } else if (action === "delete-node") {
      if (props.onNodeDelete) {
        props.onNodeDelete(contextMenu.nodeId);
      }
    }
    setContextMenu(null);
  };

  // Zoom to fit
  const zoomToFit = () => {
    if (nodes.length === 0) return;
    const minX = Math.min(...nodes.map((n: CanvasNode) => n.position.x));
    const minY = Math.min(...nodes.map((n: CanvasNode) => n.position.y));
    const maxX = Math.max(...nodes.map((n: CanvasNode) => n.position.x + n.size.width));
    const maxY = Math.max(...nodes.map((n: CanvasNode) => n.position.y + n.size.height));
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
      scale,
    });
  };

  const getCursor = () => {
    if (isDragging) return "grabbing";
    if (isPanning) return "grabbing";
    return "grab";
  };

  // Debug logging
  useEffect(() => {
    console.log("Canvas state:", {
      nodes: nodes.length,
      connections: connections.length,
      viewportTransform,
    });
  }, [nodes.length, connections.length, viewportTransform]);

  useEffect(() => {
    console.log("Canvas received connections:", connections);
    console.log("Connections count:", connections.length);
    if (connections.length > 0) {
      console.log("Connection details:", connections);
    }
  }, [connections]);

  const handleConnect = useCallback(
    (sourceNodeId: string, outputPortId: string, targetNodeId: string, inputPortId: string) => {
      // Check if a connection already exists between these nodes
      const existingConnection = connections.find(
        (c: Connection) => c.sourceNodeId === sourceNodeId && c.targetNodeId === targetNodeId
      );

      if (!existingConnection) {
        // Create a new connection
        const newConnection = {
          id: `${sourceNodeId}-${targetNodeId}-${Date.now()}`,
          sourceNodeId,
          sourcePortId: outputPortId,
          targetNodeId,
          targetPortId: inputPortId,
          createdAt: Date.now(),
        };
        onConnectionsChange((prev: Connection[]) => [...prev, newConnection]);
        onCreateConnection?.(newConnection);
      }
      // If a connection exists, we allow multiple connections on the same ports (fan-in/fan-out)
      // So we still clear the active connection state to reset the UI
      // connectionsRef.current?.setActiveConnection(null); // Commented out as setActiveConnection is not defined
    },
    [connections, onCreateConnection]
  );

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden"
      style={{
        ...canvasStyle,
        backgroundSize: `${20 * viewportTransform.scale}px ${
          20 * viewportTransform.scale
        }px`,
        backgroundPosition: `${viewportTransform.x}px ${viewportTransform.y}px`,
        touchAction: "none",
        // @ts-expect-error: CSS property supported in modern browsers
        overscrollBehavior: "none",
        willChange: "transform",
        cursor: getCursor(),
      }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onClick={handleCanvasClick}
      tabIndex={0}
      data-start-node-id={startNodeId}
    >
      {/* Edge pulse keyframes */}
      <style>{`
        @keyframes edgePulse { to { stroke-dashoffset: -20; } }
        @keyframes nodePulse { 
          0%, 100% { box-shadow: 0 0 0 1.5px rgba(255, 255, 255, 0.47), 0 0 20px rgba(255, 255, 255, 0.24), 0 6px 20px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08), inset 0 -1px 1px rgba(255,255,255,0.03); }
          50% { box-shadow: 0 0 0 1.5px rgba(255, 255, 255, 0.58), 0 0 24px rgba(255, 255, 255, 0.35), 0 6px 20px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.08), inset 0 -1px 1px rgba(255,255,255,0.03); }
        }
      `}</style>

      {/* Background Grid and Connections */}
      <Connections
        ref={connectionsRef}
        nodes={nodes}
        connections={connections}
        getPortPosition={getPortPosition}
        canvasToScreen={canvasToScreen}
        screenToCanvas={screenToCanvas}
        onConnectionsChange={onConnectionsChange}
        onCreateConnection={onCreateConnection}
        pulsingConnectionIds={pulsingConnectionIds}
        theme={theme}
      />

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="absolute bg-gray-800 border border-gray-700 rounded shadow-lg py-1 z-50"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-700 text-sm text-white"
            onClick={() => handleContextMenuAction("set-start")}
          >
            Set as Start Node
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-gray-700 text-sm text-white"
            onClick={() => handleContextMenuAction("remove-start")}
          >
            Remove Start Node
          </button>
          <button
            className="w-full px-4 py-2 text-left hover:bg-red-600 text-sm text-white"
            onClick={() => handleContextMenuAction("delete-node")}
          >
            Delete Node
          </button>
        </div>
      )}

      {/* Nodes Layer */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 2,
          transform: `translate(${viewportTransform.x}px, ${viewportTransform.y}px) scale(${viewportTransform.scale})`,
          transformOrigin: "0 0",
          pointerEvents: 'none',
        }}
      >
        {nodes.map((node: CanvasNode) => {
          let IconComponent = getNodeIcon(node);
          const isSelected = selectedNodeIds.includes(node.id);
          const isStart = node.id === startNodeId;
          const status = nodeStatuses[node.id];
          const glowShadow =
            status === "running"
              ? "0 0 0 3px rgba(59,130,246,0.5), 0 0 14px rgba(59,130,246,0.7)"
              : status === "success"
              ? "0 0 0 3px rgba(16,185,129,0.5), 0 0 14px rgba(16,185,129,0.7)"
              : status === "error"
              ? "0 0 0 3px rgba(239,68,68,0.5), 0 0 14px rgba(239,68,68,0.7)"
              : undefined;

          // Chat Interface Node Rendering (removed)

          return (
            <div
              key={node.id}
              className={`absolute cursor-pointer pointer-events-auto ${
                pulsingNodeId === node.id ? "node-pulse" : ""
              }`}
              style={{
                transform: `translate3d(${node.position.x}px, ${node.position.y}px, 0)`,
                width: node.size.width,
                height: Math.max(46, node.size.height * 0.7),
                backgroundColor: "rgba(20, 20, 22, 0.32)",
                backdropFilter: "blur(16px) saturate(160%)",
                border: "1px solid rgba(255, 255, 255, 0.025)", // Very subtle
                borderRadius: "6px", // Less rounded than current 8px
                boxShadow:
                  glowShadow ||
                  (isSelected
                    ? `0 0 16px 1px ${getNodeAccentColor(node)}25, 0 2px 8px rgba(0,0,0,0.12)`
                    : "0 1px 4px rgba(0, 0, 0, 0.08)"), // Much softer
                backgroundImage: "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))",
                zIndex: isSelected ? 10 : isStart ? 9 : 1,
                transition:
                  draggedNode === node.id
                    ? "none"
                    : "box-shadow 180ms ease-out, border-color 180ms ease-out, background-color 180ms ease-out, filter 180ms ease-out",
                willChange: draggedNode === node.id ? "transform" : "auto",
                animation: isSelected ? "nodePulse 1.8s infinite ease-in-out" : "none",
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onClick={(e) => handleNodeClick(e, node.id)}
              onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
              onMouseEnter={(e) => {
                // Skip hover effects during drag for better performance
                if (!isSelected && !isStart && draggedNode !== node.id) {
                  e.currentTarget.style.backgroundColor = "rgba(22, 22, 24, 0.42)";
                  e.currentTarget.style.boxShadow = `0 0 14px ${getNodeAccentColor(node)}45, 0 2px 8px rgba(0,0,0,0.12)`;
                  e.currentTarget.style.borderColor = `${getNodeAccentColor(node)}35`;
                  (e.currentTarget as HTMLElement).style.filter = "brightness(1.1) saturate(1.05)";
                }
              }}
              onMouseLeave={(e) => {
                // Skip hover effects during drag for better performance
                if (!isSelected && !isStart && draggedNode !== node.id) {
                  e.currentTarget.style.backgroundColor = "rgba(20, 20, 22, 0.32)";
                  e.currentTarget.style.boxShadow = "0 1px 4px rgba(0, 0, 0, 0.08)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.025)";
                  (e.currentTarget as HTMLElement).style.filter = "";
                }
              }}
            >
              {/* Start Node Indicator */}
              {isStart && (
                <div
                  style={{
                    position: "absolute",
                    left: -28,
                    top: node.size.height / 2 - 12,
                    width: 24,
                    height: 24,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 20,
                  }}
                >
                  <svg width="24" height="24">
                    <circle
                      cx={12}
                      cy={12}
                      r={10}
                      fill="#30d158"
                      stroke="white"
                      strokeWidth="2"
                    />
                    <polygon points="10,8 16,12 10,16" fill="white" />
                  </svg>
                </div>
              )}
              {/* Node Content */}
              <div className="w-full h-full" style={{ padding: "8px 12px" }}>
                {/* Header Row */}
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    if (node.subtype === 'external-apps' && (node.data as any)?.tool?.id) {
                      IconComponent = getExternalToolIcon((node.data as any).tool.id);
                    }
                    return IconComponent ? (
                      <IconComponent size={16} style={{ color: `${getNodeAccentColor(node)}CC` }} />
                    ) : null;
                  })()}
                  <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{getNodeTitle(node)}</div>
                  {node.subtype === 'external-apps' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setExpandedToolPicker(expandedToolPicker === node.id ? null : node.id); }}
                      style={{ padding: '4px 8px', fontSize: 11, borderRadius: 999, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.85)' }}
                    >
                      {expandedToolPicker === node.id ? 'Close' : 'Browse'}
                    </button>
                  )}
                </div>

                {/* Special UI for External Apps */}
                {node.subtype === 'external-apps' ? (
                  <div className="flex flex-col gap-6" style={{ color: '#e5e7eb' }}>
                    {/* Selected Tool Summary (no duplicate title/icon) */}
                    {(node.data as any)?.tool ? (
                      <div>
                        <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 2 }}>
                          {(node.data as any).tool.category}
                        </div>
                        <div style={{ fontSize: 11.5, opacity: 0.8, lineHeight: 1.3 }}>
                          {(node.data as any).tool.description}
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, opacity: 0.7 }}>No tool selected. Click Browse.</div>
                    )}

                    {/* Access Mode - Simplified & Small */}
                    {(node.data as any)?.tool && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <span style={{ fontSize: 10, opacity: 0.6 }}>Access:</span>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {(['read', 'write', 'both'] as const).map((mode) => (
                            <button
                              key={mode}
                              onClick={() => {
                                const nd = { ...node, data: { ...(node.data as any), accessMode: mode } } as any;
                                onNodeUpdate(nd);
                              }}
                              style={{
                                padding: '1px 6px',
                                borderRadius: 3,
                                fontSize: 9,
                                fontWeight: 500,
                                border: '1px solid rgba(255,255,255,0.06)',
                                background: (node.data as any)?.accessMode === mode 
                                  ? 'rgba(59,130,246,0.25)' 
                                  : 'rgba(255,255,255,0.02)',
                                color: (node.data as any)?.accessMode === mode 
                                  ? 'white' : 'rgba(255,255,255,0.65)',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.3px'
                              }}
                            >
                              {mode.charAt(0)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center" style={{ height: '100%' }} />
                )}
              </div>

              {/* Floating Tool Picker */}
              {node.subtype === 'external-apps' && expandedToolPicker === node.id && (
                <div
                  className="absolute"
                  style={{
                    top: 36,
                    right: -12,
                    width: 320,
                    maxHeight: 360,
                    background: 'rgba(10,10,12,0.92)',
                    backdropFilter: 'blur(16px) saturate(140%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14,
                    padding: 12,
                    zIndex: 50,
                    boxShadow: '0 12px 48px rgba(0,0,0,0.5)'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <input
                      type="text"
                      placeholder="Search tools…"
                      value={toolSearch[node.id] || ''}
                      onChange={(e) => setToolSearch({ ...toolSearch, [node.id]: e.target.value })}
                      style={{
                        flex: 1,
                        height: 32,
                        borderRadius: 8,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '0 10px',
                        fontSize: 12,
                        color: 'white',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={() => setExpandedToolPicker(null)}
                      style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.85)', fontSize: 11 }}
                    >
                      Done
                    </button>
                  </div>
                  <ExternalToolsList
                    search={toolSearch[node.id] || ''}
                    selectedId={(node.data as any)?.tool?.id || ''}
                    onSelect={(tool) => {
                      const nd = { ...node, data: { ...(node.data as any), tool, title: tool.name } } as any;
                      onNodeUpdate(nd);
                      // store recent
                      try {
                        const key = 'af_recent_tools';
                        const prev = JSON.parse(localStorage.getItem(key) || '[]');
                        const next = [tool.id, ...prev.filter((id: string) => id !== tool.id)].slice(0, 8);
                        localStorage.setItem(key, JSON.stringify(next));
                      } catch {}
                      setExpandedToolPicker(null);
                    }}
                    withFilter
                  />
                </div>
              )}

              <Ports
                node={node}
                onInputPortMouseUp={(e, nodeId) =>
                  connectionsRef.current?.handlePortMouseUp(
                    e,
                    nodeId,
                    (node.inputs && node.inputs[0]?.id) || 'input-1'
                  )
                }
                onOutputPortMouseDown={(e, nodeId) =>
                  connectionsRef.current?.handlePortMouseDown(
                    e,
                    nodeId,
                    'output',
                    (node.outputs && node.outputs[0]?.id) || 'output-1',
                    0
                  )
                }
                onInputPortMouseDown={(e, nodeId) =>
                  connectionsRef.current?.handlePortMouseDown(
                    e,
                    nodeId,
                    'input',
                    (node.inputs && node.inputs[0]?.id) || 'input-1',
                    0
                  )
                }
                onOutputPortMouseUp={(e, nodeId) =>
                  connectionsRef.current?.handlePortMouseUp(
                    e,
                    nodeId,
                    (node.inputs && node.inputs[0]?.id) || 'input-1'
                  )
                }
                onContextInputPortMouseDown={(e, nodeId) =>
                  connectionsRef.current?.handlePortMouseDown(
                    e,
                    nodeId,
                    'input',
                    (node.inputs && node.inputs[0]?.id) || 'input-1',
                    0
                  )
                }
                onContextOutputPortMouseDown={(e, nodeId) =>
                  connectionsRef.current?.handlePortMouseDown(
                    e,
                    nodeId,
                    'output',
                    (node.outputs && node.outputs[0]?.id) || 'output-1',
                    0
                  )
                }
              />
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
                <path d="M10 2L3 7v11a1 1 0 001 1h12a1 1 0 001-1V7l-7-5z" />
              </svg>
            </div>
            <div
              className="text-lg font-medium mb-2"
              style={{ color: theme.textMute }}
            >
              Start building your agent system
            </div>
            <div className="text-sm" style={{ color: theme.textMute }}>
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
          border: `1px solid ${theme.border}`,
        }}
      >
        {Math.round(viewportTransform.scale * 100)}%
      </div>
    </div>
  );
}

function ExternalToolsList({
  search,
  selectedId,
  onSelect,
  withFilter = false,
}: {
  search: string;
  selectedId: string;
  onSelect: (tool: ExternalTool) => void;
  withFilter?: boolean;
}) {
  const q = search.trim().toLowerCase();
  const keyRecent = 'af_recent_tools';
  let recent: string[] = [];
  try { recent = JSON.parse(localStorage.getItem(keyRecent) || '[]'); } catch {}

  const match = (t: ExternalTool) => {
    const hay = [t.name, t.category, ...(t.aliases || []), ...(t.capabilities || [])]
      .join(' ') 
      .toLowerCase();
    return hay.includes(q);
  };

  const filtered = (q ? externalToolsCatalog.filter(match) : externalToolsCatalog);

  const categories = Array.from(new Set(filtered.map(t => t.category)));

  const [expanded, setExpanded] = React.useState<Record<string, boolean>>(
    Object.fromEntries(categories.map(c => [c, true]))
  );
  const [selectedCategory, setSelectedCategory] = React.useState<string>('All');

  const visibleCategories = selectedCategory === 'All' ? categories : categories.filter(c => c === selectedCategory);

  const toolsByCategory = (cat: string) => filtered.filter(t => t.category === cat);

  return (
    <div style={{ marginTop: 8, maxHeight: 260, overflowY: 'auto' }} className="figma-scrollbar">
      {withFilter && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              height: 28,
              borderRadius: 6,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'white',
              fontSize: 12,
              padding: '0 8px',
            }}
          >
            <option>All</option>
            {categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
      )}

      {/* Recently Used */}
      {recent.length > 0 && !q && selectedCategory === 'All' && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, opacity: 0.75, margin: '6px 0' }}>Recently Used</div>
          {recent
            .map(id => externalToolsCatalog.find(t => t.id === id))
            .filter(Boolean)
            .slice(0, 6)
            .map((t) => (
              <ToolCard key={(t as ExternalTool).id} tool={t as ExternalTool} selected={selectedId === (t as ExternalTool).id} onSelect={onSelect} />
            ))}
        </div>
      )}

      {/* Grouped Categories */}
      {visibleCategories.map((cat) => (
        <div key={cat} style={{ marginBottom: 12 }}>
          <button
            onClick={() => setExpanded({ ...expanded, [cat]: !expanded[cat] })}
            style={{
              width: '100%',
              textAlign: 'left',
              fontSize: 11,
              letterSpacing: '0.3px',
              color: 'rgba(255,255,255,0.75)',
              padding: '4px 0',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer'
            }}
          >
            {expanded[cat] ? '▾' : '▸'} {cat}
          </button>
          {expanded[cat] && (
            <div>
              {toolsByCategory(cat).map((t) => (
                <ToolCard key={t.id} tool={t} selected={selectedId === t.id} onSelect={onSelect} />
              ))}
            </div>
          )}
        </div>
      ))}

      {filtered.length === 0 && (
        <div style={{ fontSize: 11, opacity: 0.7 }}>No tools match “{search}”.</div>
      )}
    </div>
  );
}

function ToolCard({ tool, selected, onSelect }: { tool: ExternalTool; selected: boolean; onSelect: (t: ExternalTool) => void }) {
  const Icon = getExternalToolIcon(tool.id);
  const complexity = tool.complexity || 'simple';
  const complexityChip = complexity === 'simple' ? '🟢 Simple' : complexity === 'medium' ? '🟡 Medium' : '🔴 Complex';
  const usage = tool.usage ? `• Used by ${Math.round(tool.usage / 100000)/10}M+ workflows` : '';
  const isSelected = selected;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        marginBottom: 6,
        borderRadius: 10,
        background: isSelected ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        color: 'rgba(255,255,255,0.9)',
        fontSize: 12,
      }}
    >
      {Icon && <Icon size={16} style={{ color: 'rgba(255,255,255,0.85)' }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.name}</div>
          <div style={{ fontSize: 10, opacity: 0.75 }}>{complexityChip}</div>
        </div>
        <div style={{ fontSize: 11, opacity: 0.7 }}>{tool.category} {usage}</div>
        <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.description}</div>
      </div>
      <div>
        {!isSelected ? (
          <button
            onClick={() => onSelect(tool)}
            style={{ padding: '4px 8px', fontSize: 11, borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.9)' }}
          >
            [+]
          </button>
        ) : (
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.85)' }}>✓ Added</span>
        )}
      </div>
    </div>
  );
}
