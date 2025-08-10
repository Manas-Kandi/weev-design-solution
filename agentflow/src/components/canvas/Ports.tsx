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
}

export default function Ports({
  node,
  theme,
  onInputPortMouseUp,
  onOutputPortMouseDown,
}: PortsProps) {
  return (
    <>
      {node.inputs.map((input, index) => (
        <div
          key={input.id}
          className="absolute cursor-pointer hover:scale-125 transition-transform"
          style={{
            left: -10,
            top: (node.size.height / (node.inputs.length + 1)) * (index + 1) - 10,
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: theme.portBg,
            border: `3px solid ${theme.border}`,
            zIndex: 20,
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
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: theme.accent,
            }}
          />
        </div>
      ))}

      {node.outputs.map((output, index) => (
        <div
          key={output.id}
          className="absolute cursor-pointer hover:scale-125 transition-transform"
          style={{
            right: -10,
            top: (node.size.height / (node.outputs.length + 1)) * (index + 1) - 10,
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: theme.portBg,
            border: `3px solid ${theme.border}`,
            zIndex: 20,
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
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: theme.accent,
            }}
          />
        </div>
      ))}
    </>
  );
}

