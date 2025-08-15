import React, { useCallback, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { CanvasNode, Connection } from "@/types";
import { theme as defaultTheme } from "@/data/theme";

// import { getNodeAccentColor } from "../../utils/nodeUtils"; // Commented out due to import error

// Fallback function for node accent color if utility is unavailable
const getNodeAccentColor = (node: CanvasNode) => {
  // Default color mapping based on node type; adjust as needed
  if (node.type === 'logic') return '#60a5fa'; // Blue
  if (node.type === 'ui') return '#fbbf24'; // Amber
  if (node.type === 'conversation') return '#ef4444'; // Red
  return '#8B8B8B'; // Default gray
};

export interface ConnectionsHandle {
  handlePortMouseDown: (
    e: React.MouseEvent,
    nodeId: string,
    outputId: string,
    portIndex: number
  ) => void;
  handlePortMouseUp: (
    e: React.MouseEvent,
    nodeId: string,
    inputId: string
  ) => void;
  handleCanvasMouseMove: (e: React.MouseEvent) => void;
  handleCanvasMouseUp: () => void;
}

interface ConnectionsProps {
  nodes: CanvasNode[];
  connections: Connection[];
  getPortPosition: (
    nodeId: string,
    portType: "input" | "output",
    portIndex: number
  ) => { x: number; y: number };
  canvasToScreen: (x: number, y: number) => { x: number; y: number };
  screenToCanvas: (x: number, y: number) => { x: number; y: number };
  onConnectionsChange: (c: Connection[]) => void;
  onCreateConnection: (connectionData: Connection) => Promise<void>;
  onDeleteConnection?: (connection: Connection) => void;
  onUndo?: () => void;
  pulsingConnectionIds: string[];
  theme: typeof defaultTheme;
}

const Connections = forwardRef<ConnectionsHandle, ConnectionsProps>(
  (
    {
      nodes,
      connections,
      getPortPosition,
      canvasToScreen,
      screenToCanvas,
      onConnectionsChange,
      onCreateConnection,
      onDeleteConnection,
      onUndo,
      pulsingConnectionIds,
      theme,
    },
    ref
  ) => {
    const [dragConnection, setDragConnection] = useState<{
      from: { nodeId: string; outputId: string; pos: { x: number; y: number } };
      currentPos: { x: number; y: number };
    } | null>(null);

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; connectionId: string } | null>(null);
    const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);

    const handlePortMouseDown = useCallback(
      (
        e: React.MouseEvent,
        nodeId: string,
        outputId: string,
        portIndex: number
      ) => {
        e.stopPropagation();
        const portPos = getPortPosition(nodeId, "output", portIndex);
        const canvasPos = screenToCanvas(e.clientX, e.clientY);
        setDragConnection({
          from: { nodeId, outputId, pos: portPos },
          currentPos: canvasPos,
        });
      },
      [getPortPosition, screenToCanvas]
    );

    const handlePortMouseUp = useCallback(
      async (e: React.MouseEvent, nodeId: string, inputId: string) => {
        e.stopPropagation();
        if (dragConnection) {
          if (dragConnection.from.nodeId === nodeId) {
            setDragConnection(null);
            return;
          }
          const connectionData: Connection = {
            id:
              typeof crypto !== "undefined" && "randomUUID" in crypto
                ? crypto.randomUUID()
                : `conn-${Date.now()}`,
            sourceNode: dragConnection.from.nodeId,
            sourceOutput: dragConnection.from.outputId,
            targetNode: nodeId,
            targetInput: inputId,
          };
          const src = nodes.find((n) => n.id === connectionData.sourceNode);
          const tgt = nodes.find((n) => n.id === connectionData.targetNode);
          const srcPort = src?.outputs?.find((p) => p.id === connectionData.sourceOutput);
          const tgtPort = tgt?.inputs?.find((p) => p.id === connectionData.targetInput);
          if (!src || !tgt || !srcPort || !tgtPort) {
            setDragConnection(null);
            return;
          }
          // Allow all node types to connect to each other
          // Removed type restriction to enable universal connectivity
          onConnectionsChange([...connections, connectionData]);
          try {
            await onCreateConnection(connectionData);
          } catch (err) {
            console.error("Failed to save connection", err);
          }
          setDragConnection(null);
        }
      },
      [dragConnection, nodes, connections, onConnectionsChange, onCreateConnection]
    );

    const handleCanvasMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (dragConnection) {
          const canvasPos = screenToCanvas(e.clientX, e.clientY);
          setDragConnection((prev) =>
            prev ? { ...prev, currentPos: canvasPos } : null
          );
        }
      },
      [dragConnection, screenToCanvas]
    );

    const handleCanvasMouseUp = useCallback(() => {
      setDragConnection(null);
    }, []);

    const handleContextMenu = useCallback((e: React.MouseEvent, connectionId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, connectionId });
    }, []);

    const handleDeleteConnection = useCallback((connectionId: string) => {
      const connection = connections.find(c => c.id === connectionId);
      if (connection) {
        onDeleteConnection?.(connection);
        // Show toast with undo action
        const toastId = Date.now().toString();
        // Assuming a toast system exists; if not, this can be adapted
        console.log("Toast: Connection deleted. [Undo]");
        // Remove connection from state
        onConnectionsChange(connections.filter(c => c.id !== connectionId));
      }
      setContextMenu(null);
    }, [connections, onDeleteConnection, onConnectionsChange]);

    const handleUndo = useCallback(() => {
      // Assuming history stack exists and can restore the last deleted connection
      console.log("Undo: Restoring last deleted connection");
      // This should trigger history stack undo; adapt based on actual history API
      onUndo?.();
    }, [onUndo]);

    useEffect(() => {
      const handleClickOutside = () => setContextMenu(null);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (contextMenu) {
          if (e.key === "Delete" || e.key === "Backspace") {
            handleDeleteConnection(contextMenu.connectionId);
          } else if (e.key === "Escape") {
            setContextMenu(null);
          }
        }
      };
      window.addEventListener("click", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("click", handleClickOutside);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }, [contextMenu, handleDeleteConnection]);

    const renderConnection = useCallback(
      (connection: Connection) => {
        const sourcePos = getPortPosition(connection.sourceNode, "output", 0);
        const targetPos = getPortPosition(connection.targetNode, "input", 0);
        const sourceScreen = canvasToScreen(sourcePos.x, sourcePos.y);
        const targetScreen = canvasToScreen(targetPos.x, targetPos.y);
        const controlOffset = Math.abs(targetScreen.x - sourceScreen.x) * 0.3;
        const path = `M ${sourceScreen.x} ${sourceScreen.y} C ${
          sourceScreen.x + controlOffset
        } ${sourceScreen.y}, ${targetScreen.x - controlOffset} ${
          targetScreen.y
        }, ${targetScreen.x} ${targetScreen.y}`;
        const isPulsing = pulsingConnectionIds.includes(connection.id);
        const isHovered = hoveredConnection === connection.id;
        const isContextMenuOpen = contextMenu?.connectionId === connection.id;

        return (
          <g key={connection.id} className="pointer-events-auto">
            <path
              d={path}
              fill="none"
              stroke={isPulsing ? "#60a5fa" : theme.accent}
              strokeWidth={isHovered || isContextMenuOpen ? 2 : 1.5}
              strokeOpacity={isHovered || isContextMenuOpen ? 0.8 : 0.6}
              style={{
                cursor: "context-menu",
                transition: "stroke-width 0.2s, stroke-opacity 0.2s",
              }}
              onContextMenu={(e) => handleContextMenu(e, connection.id)}
              onMouseEnter={() => setHoveredConnection(connection.id)}
              onMouseLeave={() => setHoveredConnection(null)}
              role="button"
              aria-label={`Connection from ${connection.sourceNode} to ${connection.targetNode}, right-click to delete`}
            />
            {/* Invisible hit area for easier right-click */}
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth={10}
              onContextMenu={(e) => handleContextMenu(e, connection.id)}
              onMouseEnter={() => setHoveredConnection(connection.id)}
              onMouseLeave={() => setHoveredConnection(null)}
            />
          </g>
        );
      },
      [getPortPosition, canvasToScreen, pulsingConnectionIds, theme, hoveredConnection, contextMenu]
    );

    useImperativeHandle(ref, () => ({
      handlePortMouseDown,
      handlePortMouseUp,
      handleCanvasMouseMove,
      handleCanvasMouseUp,
    }));

    return (
      <>
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 0 }}
        >
          <g>
            {connections.map((connection) => renderConnection(connection))}
            {dragConnection && dragConnection.from && dragConnection.currentPos && (
              <path
                d={`M ${dragConnection.from.pos.x} ${dragConnection.from.pos.y} L ${dragConnection.currentPos.x} ${dragConnection.currentPos.y}`}
                stroke={theme.accent}
                strokeWidth="2"
                fill="none"
                strokeDasharray="5 5"
              />
            )}
          </g>
        </svg>

        {/* Context Menu for Deleting Connections */}
        {contextMenu && (
          <div
            className="absolute bg-[rgba(30,30,32,0.95)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded-md shadow-lg z-50 py-1 px-2 min-w-[120px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            role="menu"
            aria-label="Connection context menu"
          >
            <button
              className="w-full text-left px-2 py-1 text-white hover:bg-[rgba(255,255,255,0.1)] rounded text-sm font-medium"
              onClick={() => handleDeleteConnection(contextMenu.connectionId)}
              role="menuitem"
              aria-label="Delete connection"
            >
              Delete connection
            </button>
            <button
              className="w-full text-left px-2 py-1 text-[rgba(255,255,255,0.7)] hover:bg-[rgba(255,255,255,0.1)] rounded text-sm"
              onClick={() => setContextMenu(null)}
              role="menuitem"
              aria-label="Cancel"
            >
              Cancel
            </button>
          </div>
        )}
      </>
    );
  }
);

Connections.displayName = "Connections";

export default Connections;
