import React from "react";
import { CanvasNode } from "@/types";
import { theme as defaultTheme } from "@/data/theme";

interface PortsProps {
  node: CanvasNode;
  theme: typeof defaultTheme;
  onInputPortMouseUp: (
    e: React.MouseEvent,
    nodeId: string,
    inputId: string
  ) => void;
  onOutputPortMouseDown: (
    e: React.MouseEvent,
    nodeId: string,
    outputId: string,
    index: number
  ) => void;
  accentColor?: string;
  isConnecting?: boolean;
  activeConnection?: {
    sourceNodeId: string;
    targetNodeId: string;
  };
}

export default function Ports({
  node,
  theme,
  onInputPortMouseUp,
  onOutputPortMouseDown,
  accentColor = "#8B8B8B",
  isConnecting = false,
  activeConnection = null,
}: PortsProps) {
  return (
    <>
      {/* Single Input Port */}
      {node.inputs.length > 0 && (
        <div
          className="absolute cursor-pointer transition-all duration-200"
          style={{
            left: -6,
            top: Math.max(46, node.size.height * 0.7) / 2 - 6,
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: "rgba(20, 20, 20, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            zIndex: 20,
            boxShadow: isConnecting && activeConnection?.targetNodeId === node.id 
              ? `0 0 8px ${accentColor}66, 0 0 12px ${accentColor}44`
              : `0 0 6px ${accentColor}44`,
            transform: isConnecting && activeConnection?.targetNodeId === node.id ? "scale(1.4)" : "scale(1.0)",
          }}
          onMouseUp={(e) => onInputPortMouseUp(e, node.id, node.inputs[0].id)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.4)";
            e.currentTarget.style.boxShadow = `0 0 8px ${accentColor}66, 0 0 12px ${accentColor}44`;
            e.currentTarget.style.cursor = "crosshair";
          }}
          onMouseLeave={(e) => {
            if (!(isConnecting && activeConnection?.targetNodeId === node.id)) {
              e.currentTarget.style.transform = "scale(1.0)";
              e.currentTarget.style.boxShadow = `0 0 6px ${accentColor}44`;
              e.currentTarget.style.cursor = "pointer";
            }
          }}
          title="Input (supports multiple connections)"
        >
          {/* Middle ring */}
          <div
            style={{
              position: "absolute",
              top: 1.5,
              left: 1.5,
              width: 9,
              height: 9,
              borderRadius: "50%",
              border: "0.5px solid rgba(255, 255, 255, 0.1)",
            }}
          />
          {/* Inner dot with accent color */}
          <div
            style={{
              position: "absolute",
              top: 4,
              left: 4,
              width: 4,
              height: 4,
              borderRadius: "50%",
              backgroundColor: accentColor,
            }}
          />
        </div>
      )}

      {/* Single Output Port */}
      {node.outputs.length > 0 && (
        <div
          className="absolute cursor-pointer transition-all duration-200"
          style={{
            right: -6,
            top: Math.max(46, node.size.height * 0.7) / 2 - 6,
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: "rgba(20, 20, 20, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            zIndex: 20,
            boxShadow: isConnecting && activeConnection?.sourceNodeId === node.id 
              ? `0 0 8px ${accentColor}66, 0 0 12px ${accentColor}44`
              : `0 0 6px ${accentColor}44`,
            transform: isConnecting && activeConnection?.sourceNodeId === node.id ? "scale(1.4)" : "scale(1.0)",
          }}
          onMouseDown={(e) => onOutputPortMouseDown(e, node.id, node.outputs[0].id, 0)}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.4)";
            e.currentTarget.style.boxShadow = `0 0 8px ${accentColor}66, 0 0 12px ${accentColor}44`;
            e.currentTarget.style.cursor = "crosshair";
          }}
          onMouseLeave={(e) => {
            if (!(isConnecting && activeConnection?.sourceNodeId === node.id)) {
              e.currentTarget.style.transform = "scale(1.0)";
              e.currentTarget.style.boxShadow = `0 0 6px ${accentColor}44`;
              e.currentTarget.style.cursor = "pointer";
            }
          }}
          title="Output (supports multiple connections)"
        >
          {/* Middle ring */}
          <div
            style={{
              position: "absolute",
              top: 1.5,
              left: 1.5,
              width: 9,
              height: 9,
              borderRadius: "50%",
              border: "0.5px solid rgba(255, 255, 255, 0.1)",
            }}
          />
          {/* Inner dot with accent color */}
          <div
            style={{
              position: "absolute",
              top: 4,
              left: 4,
              width: 4,
              height: 4,
              borderRadius: "50%",
              backgroundColor: accentColor,
            }}
          />
        </div>
      )}
    </>
  );
}
