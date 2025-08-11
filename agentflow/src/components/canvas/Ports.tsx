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
            left: -8,
            top: (node.size.height / (node.inputs.length + 1)) * (index + 1) - 8,
            width: 16,
            height: 16,
            borderRadius: "50%",
            backgroundColor: "rgba(20, 20, 20, 0.9)",
            border: "2px solid #333",
            zIndex: 20,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
          }}
          onMouseUp={(e) => onInputPortMouseUp(e, node.id, input.id)}
          title={input.label}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 6,
              height: 6,
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
            right: -8,
            top: (node.size.height / (node.outputs.length + 1)) * (index + 1) - 8,
            width: 16,
            height: 16,
            borderRadius: "50%",
            backgroundColor: "rgba(20, 20, 20, 0.9)",
            border: "2px solid #333",
            zIndex: 20,
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.3)",
          }}
          onMouseDown={(e) => onOutputPortMouseDown(e, node.id, output.id, index)}
          title={output.label}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 6,
              height: 6,
              borderRadius: "50%",
              backgroundColor: `${accentColor}CC`,
            }}
          />
        </div>
      ))}
    </>
  );
}

