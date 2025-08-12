import React, { useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { CanvasNode, Connection } from "@/types";
import { theme as defaultTheme } from "@/data/theme";

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
      pulsingConnectionIds,
      theme,
    },
    ref
  ) => {
    const [dragConnection, setDragConnection] = useState<{
      from: { nodeId: string; outputId: string; pos: { x: number; y: number } };
      currentPos: { x: number; y: number };
    } | null>(null);

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
        return (
          <path
            key={connection.id}
            d={path}
            stroke={isPulsing ? "#60a5fa" : theme.accent}
            strokeWidth="2"
            fill="none"
            strokeDasharray={isPulsing ? "6 6" : undefined}
            style={
              isPulsing
                ? ({
                    animation: "edgePulse 0.6s linear infinite",
                    filter: "drop-shadow(0 0 6px rgba(96,165,250,0.8))",
                  } as React.CSSProperties)
                : undefined
            }
            className="drop-shadow-sm"
          />
        );
      },
      [getPortPosition, canvasToScreen, pulsingConnectionIds, theme]
    );

    useImperativeHandle(ref, () => ({
      handlePortMouseDown,
      handlePortMouseUp,
      handleCanvasMouseMove,
      handleCanvasMouseUp,
    }));

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <g>
          {connections.map(renderConnection)}
          {dragConnection && (
            <path
              d={`M ${canvasToScreen(
                dragConnection.from.pos.x,
                dragConnection.from.pos.y
              ).x} ${canvasToScreen(
                dragConnection.from.pos.x,
                dragConnection.from.pos.y
              ).y} L ${canvasToScreen(
                dragConnection.currentPos.x,
                dragConnection.currentPos.y
              ).x} ${canvasToScreen(
                dragConnection.currentPos.x,
                dragConnection.currentPos.y
              ).y}`}
              stroke={theme.accent}
              strokeWidth="2"
              strokeDasharray="5,5"
              fill="none"
              opacity={0.7}
            />
          )}
        </g>
      </svg>
    );
  }
);

Connections.displayName = "Connections";

export default Connections;

