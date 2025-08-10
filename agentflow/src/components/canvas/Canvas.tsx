"use client";
import React, { useState, useRef, useCallback, useEffect } from "react";
import { CanvasNode, Connection } from "@/types";
import { theme } from "@/data/theme";
import { nodeCategories } from "@/data/nodeDefinitions";
import ChatBoxNode from "@/components/nodes/ChatBoxNode";
import Ports from "./Ports";
import Connections, { ConnectionsHandle } from "./Connections";

const canvasStyle: React.CSSProperties = {
  backgroundColor: "#0D0D0D", // pure dark
};

const rulerStyle: React.CSSProperties = {
  position: "absolute",
  backgroundColor: theme.bgElevate,
  color: theme.textMute,
  fontSize: "10px",
  pointerEvents: "none",
  zIndex: 30,
};

interface Props {
  nodes: CanvasNode[];
  connections: Connection[];
  onNodeSelect: (n: CanvasNode | null) => void;
  onNodeDrag: (id: string, pos: { x: number; y: number }) => void;
  onConnectionsChange: (c: Connection[]) => void;
  onCreateConnection: (connectionData: Connection) => Promise<void>;
  selectedNodeId: string | null;
  onNodeUpdate: (node: CanvasNode) => void;
  startNodeId: string | null; // NEW: controlled start node
  onStartNodeChange: (id: string | null) => void; // NEW: propagate up
  onNodeDelete?: (nodeId: string) => void; // <-- Add this line
  // Tester visualization props
  nodeStatuses?: Record<string, "running" | "success" | "error">;
  pulsingConnectionIds?: string[];
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

  const canvasRef = useRef<HTMLDivElement>(null);
  const connectionsRef = useRef<ConnectionsHandle>(null);

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
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return { x: 0, y: 0 };

      const ports = portType === "input" ? node.inputs : node.outputs;
      const portCount = ports.length;
      const spacing = node.size.height / (portCount + 1);

      return {
        x: node.position.x + (portType === "input" ? 0 : node.size.width),
        y: node.position.y + spacing * (portIndex + 1),
      };
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
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      onNodeSelect(node);
      setIsDragging(true);
      setDraggedNode(nodeId);
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      setDragOffset({
        x: canvasPos.x - node.position.x,
        y: canvasPos.y - node.position.y,
      });
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

  // Wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const scaleFactor = 1.1;
      const mousePos = screenToCanvas(e.clientX, e.clientY);
      const newScale =
        e.deltaY > 0
          ? Math.max(0.1, viewportTransform.scale / scaleFactor)
          : Math.min(3, viewportTransform.scale * scaleFactor);
      setViewportTransform((prev) => ({
        x: mousePos.x * newScale - (mousePos.x * prev.scale - prev.x),
        y: mousePos.y * newScale - (mousePos.y * prev.scale - prev.y),
        scale: newScale,
      }));
    },
    [viewportTransform, screenToCanvas]
  );

  // Node dragging effect
  useEffect(() => {
    if (!isDragging || !draggedNode) return;
    const handleMove = (e: MouseEvent) => {
      const canvasPos = screenToCanvas(e.clientX, e.clientY);
      onNodeDrag(draggedNode, {
        x: canvasPos.x - dragOffset.x,
        y: canvasPos.y - dragOffset.y,
      });
    };
    const handleUp = () => {
      setIsDragging(false);
      setDraggedNode(null);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
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
    const minX = Math.min(...nodes.map((n) => n.position.x));
    const minY = Math.min(...nodes.map((n) => n.position.y));
    const maxX = Math.max(...nodes.map((n) => n.position.x + n.size.width));
    const maxY = Math.max(...nodes.map((n) => n.position.y + n.size.height));
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
        cursor: getCursor(),
      }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onClick={handleCanvasClick}
      onWheel={handleWheel}
      tabIndex={0}
      data-start-node-id={startNodeId}
    >
      {/* Edge pulse keyframes */}
      <style>{`
        @keyframes edgePulse { to { stroke-dashoffset: -20; } }
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
        }}
      >
        {nodes.map((node) => {
          const IconComponent = getNodeIcon(node);
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

          // Chat Interface Node Rendering
          if (node.type === "ui" && node.subtype === "chat") {
            return (
              <ChatBoxNode
                key={node.id}
                node={node}
                isSelected={isSelected}
                onNodeMouseDown={handleNodeMouseDown}
                onNodeClick={handleNodeClick}
                onNodeContextMenu={handleNodeContextMenu}
                onNodeUpdate={handleNodeUpdateWithPulse}
                nodes={nodes}
                connections={connections}
                theme={theme}
                onOutputPortMouseDown={(e, nodeId, outputId, index) =>
                  connectionsRef.current?.handlePortMouseDown(
                    e,
                    nodeId,
                    outputId,
                    index
                  )
                }
                isPulsing={pulsingNodeId === node.id}
              />
            );
          }

          return (
            <div
              key={node.id}
              className={`absolute cursor-pointer pointer-events-auto ${
                isSelected ? "ring-2 ring-blue-400" : ""
              } ${isStart ? "border-2 border-green-500 shadow-lg" : ""} ${
                pulsingNodeId === node.id ? "node-pulse" : ""
              }`}
              style={{
                left: node.position.x,
                top: node.position.y,
                width: node.size.width,
                height: node.size.height,
                backgroundColor: theme.bgElevate,
                border: `2px solid ${
                  isStart ? "#30d158" : isSelected ? theme.accent : theme.border
                }`,
                borderRadius: "8px",
                boxShadow:
                  glowShadow ||
                  (isSelected
                    ? "0 0 0 2px rgba(59, 130, 246, 0.3)"
                    : isStart
                    ? "0 0 0 3px #30d15855"
                    : "0 1px 3px rgba(0, 0, 0, 0.1)"),
                zIndex: isSelected ? 10 : isStart ? 9 : 1,
              }}
              onMouseDown={(e) => handleNodeMouseDown(e, node.id)}
              onClick={(e) => handleNodeClick(e, node.id)}
              onContextMenu={(e) => handleNodeContextMenu(e, node.id)}
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
              <div className="w-full h-full p-3 flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {IconComponent && (
                      <IconComponent
                        size={16}
                        style={{ color: theme.accent }}
                      />
                    )}
                    <div
                      style={{
                        color: theme.text,
                        fontSize: "14px",
                        fontWeight: "500",
                      }}
                    >
                      {getNodeTitle(node)}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    color: theme.textMute,
                    fontSize: "12px",
                    marginTop: "8px",
                  }}
                >
                  {getNodeDescription(node)}
                </div>
              </div>

              <Ports
                node={node}
                theme={theme}
                onInputPortMouseUp={(e, nodeId, inputId) =>
                  connectionsRef.current?.handlePortMouseUp(e, nodeId, inputId)
                }
                onOutputPortMouseDown={(e, nodeId, outputId, index) =>
                  connectionsRef.current?.handlePortMouseDown(
                    e,
                    nodeId,
                    outputId,
                    index
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
