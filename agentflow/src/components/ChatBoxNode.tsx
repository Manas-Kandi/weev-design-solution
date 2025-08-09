import React, { useState, useEffect } from 'react';
import { CanvasNode, Colors, Connection } from '@/types';
import {
  figmaNodeStyle,
  selectedNodeStyle,
  hoverNodeStyle
} from './nodeStyles';

interface ChatBoxNodeProps {
  node: CanvasNode;
  isSelected: boolean;
  onNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onNodeClick: (e: React.MouseEvent, nodeId: string) => void;
  onNodeContextMenu: (e: React.MouseEvent, nodeId: string) => void;
  onNodeUpdate: (node: CanvasNode) => void;
  theme: Colors;
  onOutputPortMouseDown: (
    e: React.MouseEvent,
    nodeId: string,
    outputId: string,
    index: number
  ) => void;
  connections: Connection[]; // Add this
  nodes: CanvasNode[]; // Add this
  isPulsing?: boolean;
}

export default function ChatBoxNode(props: ChatBoxNodeProps) {
  const {
    node,
    isSelected,
    onNodeMouseDown,
    onNodeClick,
    onNodeContextMenu,
    onNodeUpdate,
    theme,
    onOutputPortMouseDown,
    connections,
    nodes,
    isPulsing
  } = props;

  interface ChatBoxNodeData {
    inputValue?: string;
    title?: string;
    // add other properties as needed
  }

  // Get the current input value from node data
  const [input, setInput] = useState((node.data as ChatBoxNodeData).inputValue || '');
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setInput((node.data as ChatBoxNodeData).inputValue || '');
  }, [node.data]);

  // Update node data when input changes
  const handleInputChange = (value: string) => {
    console.log('Input changed to:', value); // Add this
    setInput(value);
    const updatedNode = {
      ...node,
      data: { ...node.data, inputValue: value }
    };
    console.log('Updated node data:', updatedNode.data); // Add this
    console.log('Calling onNodeUpdate...'); // Debug log
    onNodeUpdate(updatedNode);
    console.log('onNodeUpdate called'); // Debug log
  };

  const nodeStyle: React.CSSProperties = {
    ...figmaNodeStyle,
    left: node.position.x,
    top: node.position.y,
    width: node.size.width,
    height: node.size.height,
    borderColor: isSelected ? 'var(--figma-accent)' : 'var(--figma-border)',
    ...(isHovered ? hoverNodeStyle : {}),
    ...(isSelected ? selectedNodeStyle : {}),
    zIndex: 3
  };

  return (
    <div
      className={`absolute flex flex-col ${isPulsing ? 'node-pulse' : ''}`}
      style={nodeStyle}
      onMouseDown={e => onNodeMouseDown(e, node.id)}
      onClick={e => onNodeClick(e, node.id)}
      onContextMenu={e => onNodeContextMenu(e, node.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-2 border-b" style={{ borderColor: theme.border }}>
        <span className="text-sm font-medium truncate" style={{ color: theme.text }}>
          {(node.data as ChatBoxNodeData).title || 'Text Input'}
        </span>
      </div>

      {/* Simple Text Input */}
      <div className="flex-1 p-3 flex items-center">
        <input
          className="w-full px-3 py-2 rounded border text-sm"
          style={{ 
            backgroundColor: theme.background, 
            borderColor: theme.border,
            color: theme.text
          }}
          type="text"
          value={input}
          onChange={e => handleInputChange(e.target.value)}
          placeholder="Enter text..."
          onMouseDown={e => e.stopPropagation()} // Prevent node drag when typing
          onClick={e => e.stopPropagation()} // Prevent node selection when clicking input
        />
      </div>

      {/* Output Ports */}
      {node.outputs.map((output, index) => (
        <div
          key={output.id}
          className="absolute w-3 h-3 rounded-full border-2 cursor-pointer hover:scale-125 transition-transform bg-blue-500"
          style={{
            right: -6,
            top: (node.size.height / (node.outputs.length + 1)) * (index + 1) - 6,
            borderColor: theme.accent,
            zIndex: 10
          }}
          onMouseDown={e => {
            e.stopPropagation();
            onOutputPortMouseDown(e, node.id, output.id, index);
          }}
          title={output.label}
        />
      ))}
    </div>
  );
}