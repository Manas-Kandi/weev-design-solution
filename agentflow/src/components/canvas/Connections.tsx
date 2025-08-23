import React, { useCallback, useEffect, useState, useImperativeHandle, forwardRef, useRef } from "react";
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
    portType: "input" | "output",
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

    const [snapTarget, setSnapTarget] = useState<
      { nodeId: string; inputId: string; pos: { x: number; y: number } } | null
    >(null);

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; connectionId: string } | null>(null);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const [hoveredConnection, setHoveredConnection] = useState<string | null>(null);

    const handlePortMouseDown = useCallback(
      (
        e: React.MouseEvent,
        nodeId: string,
        portType: "input" | "output",
        outputId: string,
        portIndex: number
      ) => {
        e.stopPropagation();
        const portPos = getPortPosition(nodeId, portType, portIndex);
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
            direction: 'uni',
          };
          // Allow all node types to connect regardless of declared port lists
          onConnectionsChange([...connections, connectionData]);
          try {
            await onCreateConnection(connectionData);
          } catch (err) {
            console.error("Failed to save connection", err);
          }
          setDragConnection(null);
        }
      },
      [dragConnection, connections, onConnectionsChange, onCreateConnection]
    );

    const handleCanvasMouseMove = useCallback(
      (e: React.MouseEvent) => {
        if (dragConnection) {
          const canvasPos = screenToCanvas(e.clientX, e.clientY);

          // Find nearest input port on other nodes using SCREEN distance for consistent UX across zoom levels
          const thresholdScreen = 28; // pixels on screen
          let closest: { nodeId: string; inputId: string; pos: { x: number; y: number }; distScreen: number } | null = null;
          for (const n of nodes) {
            if (n.id === dragConnection.from.nodeId) continue;
            const inPosCanvas = getPortPosition(n.id, 'input', 0);
            const inPosScreen = canvasToScreen(inPosCanvas.x, inPosCanvas.y);
            const dx = inPosScreen.x - e.clientX;
            const dy = inPosScreen.y - e.clientY;
            const distScreen = Math.hypot(dx, dy);
            const inputId = (n.inputs && n.inputs[0]?.id) || 'input-1';
            if (!closest || distScreen < closest.distScreen) {
              closest = { nodeId: n.id, inputId, pos: inPosCanvas, distScreen };
            }
          }

          if (closest && closest.distScreen <= thresholdScreen) {
            setSnapTarget({ nodeId: closest.nodeId, inputId: closest.inputId, pos: closest.pos });
            setDragConnection((prev) => (prev ? { ...prev, currentPos: closest!.pos } : null));
          } else {
            setSnapTarget(null);
            setDragConnection((prev) => (prev ? { ...prev, currentPos: canvasPos } : null));
          }
        }
      },
      [dragConnection, screenToCanvas, canvasToScreen, nodes, getPortPosition]
    );

    const handleCanvasMouseUp = useCallback(() => {
      if (dragConnection && snapTarget) {
        const connectionData: Connection = {
          id:
            typeof crypto !== "undefined" && "randomUUID" in crypto
              ? crypto.randomUUID()
              : `conn-${Date.now()}`,
          sourceNode: dragConnection.from.nodeId,
          sourceOutput: dragConnection.from.outputId || 'out',
          targetNode: snapTarget.nodeId,
          targetInput: snapTarget.inputId,
          direction: 'uni',
        };
        onConnectionsChange([...connections, connectionData]);
        onCreateConnection(connectionData).catch((err) =>
          console.error('Failed to save connection', err)
        );
      }
      setSnapTarget(null);
      setDragConnection(null);
    }, [dragConnection, snapTarget, connections, onConnectionsChange, onCreateConnection]);

    const openMenuAtEvent = useCallback((e: React.MouseEvent, connectionId: string) => {
      e.preventDefault();
      e.stopPropagation();
      // Position relative to the SVG so absolute menu aligns correctly
      const svgEl = (e.currentTarget as SVGPathElement).ownerSVGElement;
      const rect = svgEl ? svgEl.getBoundingClientRect() : { left: 0, top: 0 } as DOMRect;
      setContextMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top, connectionId });
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
      const handleClickOutside = (evt: MouseEvent) => {
        if (!contextMenu) return;
        if (menuRef.current && evt.target instanceof Node) {
          if (!menuRef.current.contains(evt.target)) {
            setContextMenu(null);
          }
        } else {
          setContextMenu(null);
        }
      };
      const handleKeyDown = (e: KeyboardEvent) => {
        if (contextMenu) {
          if (e.key === "Delete" || e.key === "Backspace") {
            handleDeleteConnection(contextMenu.connectionId);
          } else if (e.key === "Escape") {
            setContextMenu(null);
          }
        }
      };
      window.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("mousedown", handleClickOutside);
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
        const dir = connection.direction || 'uni';
        const markerStart = dir === 'bi' ? 'url(#arrow-start)' : undefined;
        const markerEnd = 'url(#arrow-end)';
        const dash = dir === 'request-response' ? '6 4' : undefined;

        return (
          <g key={connection.id} className="pointer-events-auto">
            <path
              d={path}
              fill="none"
              stroke={isPulsing ? "#60a5fa" : theme.accent}
              strokeWidth={isHovered || isContextMenuOpen ? 2 : 1.5}
              strokeOpacity={isHovered || isContextMenuOpen ? 0.8 : 0.6}
              strokeDasharray={dash}
              style={{
                cursor: "context-menu",
                transition: "stroke-width 0.2s, stroke-opacity 0.2s",
                color: isPulsing ? "#60a5fa" : theme.accent,
              }}
              markerStart={markerStart}
              markerEnd={markerEnd}
              onContextMenu={(e) => openMenuAtEvent(e, connection.id)}
              onClick={(e) => openMenuAtEvent(e, connection.id)}
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
              onContextMenu={(e) => openMenuAtEvent(e, connection.id)}
              onClick={(e) => openMenuAtEvent(e, connection.id)}
              onMouseEnter={() => setHoveredConnection(connection.id)}
              onMouseLeave={() => setHoveredConnection(null)}
            />
          </g>
        );
      },
      [getPortPosition, canvasToScreen, pulsingConnectionIds, theme, hoveredConnection, contextMenu, openMenuAtEvent]
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
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 0, pointerEvents: 'auto' }}
        >
          <defs>
            <marker id="arrow-end" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
            </marker>
            <marker id="arrow-start" viewBox="0 0 10 10" refX="0" refY="5" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 10 0 L 0 5 L 10 10 z" fill="currentColor" />
            </marker>
          </defs>
          <g>
            {connections.map((connection) => renderConnection(connection))}
            {/* Snap target highlight */}
            {dragConnection && snapTarget && (() => {
              const s = canvasToScreen(snapTarget.pos.x, snapTarget.pos.y);
              return (
                <g>
                  <circle cx={s.x} cy={s.y} r={8} fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.4)" strokeWidth={2} />
                  <circle cx={s.x} cy={s.y} r={3} fill="#3b82f6" />
                </g>
              );
            })()}
            {dragConnection && dragConnection.from && dragConnection.currentPos && (() => {
              const fromScreen = canvasToScreen(
                dragConnection.from.pos.x,
                dragConnection.from.pos.y
              );
              const curScreen = canvasToScreen(
                dragConnection.currentPos.x,
                dragConnection.currentPos.y
              );
              return (
                <path
                  d={`M ${fromScreen.x} ${fromScreen.y} L ${curScreen.x} ${curScreen.y}`}
                  stroke={theme.accent}
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray="5 5"
                  markerEnd="url(#arrow-end)"
                  style={{ color: theme.accent }}
                />
              );
            })()}
          </g>
        </svg>

        {/* Context Menu for Deleting Connections */}
        {contextMenu && (() => {
          const conn = connections.find(c => c.id === contextMenu.connectionId);
          const current = conn?.direction || 'uni';
          const setDirection = (dir: 'uni' | 'request-response' | 'bi') => {
            const idx = connections.findIndex(c => c.id === contextMenu.connectionId);
            if (idx >= 0) {
              const next = connections.slice();
              next[idx] = { ...next[idx], direction: dir } as Connection;
              onConnectionsChange(next);
            }
            setContextMenu(null);
          };
          return (
            <div
              className="absolute bg-[rgba(30,30,32,0.95)] backdrop-blur-md border border-[rgba(255,255,255,0.1)] rounded-md shadow-lg z-50 py-1 px-2 min-w-[220px]"
              style={{ top: contextMenu.y, left: contextMenu.x }}
              role="menu"
              aria-label="Connection context menu"
              ref={menuRef}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="px-2 py-1 text-[rgba(255,255,255,0.7)] text-xs">Direction</div>
              <button
                className={`w-full text-left px-2 py-1 rounded text-sm ${current === 'uni' ? 'text-white' : 'text-[rgba(255,255,255,0.8)]'} hover:bg-[rgba(255,255,255,0.1)]`}
                onClick={() => setDirection('uni')}
                role="menuitem"
              >
                {current === 'uni' ? '• ' : ''}Unidirectional (send only)
              </button>
              <button
                className={`w-full text-left px-2 py-1 rounded text-sm ${current === 'request-response' ? 'text-white' : 'text-[rgba(255,255,255,0.8)]'} hover:bg-[rgba(255,255,255,0.1)]`}
                onClick={() => setDirection('request-response')}
                role="menuitem"
              >
                {current === 'request-response' ? '• ' : ''}Request & response back
              </button>
              <button
                className={`w-full text-left px-2 py-1 rounded text-sm ${current === 'bi' ? 'text-white' : 'text-[rgba(255,255,255,0.8)]'} hover:bg-[rgba(255,255,255,0.1)]`}
                onClick={() => setDirection('bi')}
                role="menuitem"
              >
                {current === 'bi' ? '• ' : ''}Bidirectional (sync)
              </button>
              <div className="h-px my-1 bg-[rgba(255,255,255,0.08)]" />
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
          );
        })()}
      </>
    );
  }
);

Connections.displayName = "Connections";

export default Connections;
