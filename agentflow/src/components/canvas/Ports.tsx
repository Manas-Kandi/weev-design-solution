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
}

export default function Ports({
  node,
  theme,
  onInputPortMouseUp,
  onOutputPortMouseDown,
  accentColor = "#8B8B8B",
}: PortsProps) {
  return (
    <>
      {node.inputs.map((input, index) => (
        <div
          key={input.id}
          className="absolute cursor-pointer hover:scale-110 transition-all duration-200"
          style={{
            left: -6,
            top: (node.size.height / (node.inputs.length + 1)) * (index + 1) - 6,
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: "rgba(20, 20, 20, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            zIndex: 20,
            boxShadow: `0 0 6px ${accentColor}44`,
          }}
          onMouseUp={(e) => onInputPortMouseUp(e, node.id, input.id)}
          title={input.label}
        >
          {/* middle ring */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 9,
              height: 9,
              borderRadius: "50%",
              border: `1px solid ${accentColor}66`,
            }}
          />
          {/* inner dot */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 4,
              height: 4,
              borderRadius: "50%",
              backgroundColor: `${accentColor}CC`,
            }}
          />
        </div>
      ))}

      {node.outputs.map((output, index) => (
        <div
          key={output.id}
          className="absolute cursor-pointer hover:scale-110 transition-all duration-200"
          style={{
            right: -6,
            top: (node.size.height / (node.outputs.length + 1)) * (index + 1) - 6,
            width: 12,
            height: 12,
            borderRadius: "50%",
            backgroundColor: "rgba(20, 20, 20, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            zIndex: 20,
            boxShadow: `0 0 6px ${accentColor}44`,
          }}
          onMouseDown={(e) => onOutputPortMouseDown(e, node.id, output.id, index)}
          title={output.label}
        >
          {/* middle ring */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 9,
              height: 9,
              borderRadius: "50%",
              border: `1px solid ${accentColor}66`,
            }}
          />
          {/* inner dot */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 4,
              height: 4,
              borderRadius: "50%",
              backgroundColor: `${accentColor}CC`,
            }}
          />
        </div>
      ))}
    </>
  );
}

