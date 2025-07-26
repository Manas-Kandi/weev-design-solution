import React, { useState } from 'react';
import { CanvasNode, ChatNodeData, Connection, Colors } from '@/types';
import { runWorkflow } from '@/lib/workflowRunner';
import { supabase } from '@/lib/supabaseClient';

interface ChatBoxNodeProps {
  node: CanvasNode;
  isSelected: boolean;
  onNodeMouseDown: (e: React.MouseEvent, nodeId: string) => void;
  onNodeClick: (e: React.MouseEvent, nodeId: string) => void;
  onNodeContextMenu: (e: React.MouseEvent, nodeId: string) => void;
  onNodeUpdate: (node: CanvasNode) => void;
  nodes: CanvasNode[];
  connections: Connection[];
  theme: Colors;
  onOutputPortMouseDown: (
    e: React.MouseEvent,
    nodeId: string,
    outputId: string,
    index: number
  ) => void;
}

export default function ChatBoxNode(props: ChatBoxNodeProps) {
  const {
    node,
    isSelected,
    onNodeMouseDown,
    onNodeClick,
    onNodeContextMenu,
    onNodeUpdate,
    nodes,
    connections,
    theme,
    onOutputPortMouseDown
  } = props;

  const chatData = node.data as ChatNodeData;
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ sender: 'user' | 'agent'; text: string }[]>(chatData.messages || []);

  // Find connected agent node
  const agentConnection = connections.find(c => c.sourceNode === node.id);
  const agentNode = agentConnection ? nodes.find(n => n.id === agentConnection.targetNode && n.type === 'agent') : null;

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = { sender: 'user' as const, text: input };
    const userMessages = [...messages, userMsg];
    setMessages(userMessages);
    setInput('');
    onNodeUpdate({ ...node, data: { ...chatData, messages: userMessages } });
    await supabase
      .from('nodes')
      .update({ data: { ...chatData, messages: userMessages } })
      .eq('id', node.id);

    if (agentNode) {
      try {
        const updatedNodes = nodes.map(n =>
          n.id === agentNode.id ? { ...n, data: { ...n.data, prompt: input } } : n
        );
        const result = await runWorkflow(updatedNodes, connections);
        let responseText = 'No response';
        const output = result[agentNode.id];

        type GeminiOutput = {
          gemini?: {
            candidates?: {
              content?: {
                parts?: {
                  text?: string;
                }[];
              };
            }[];
          };
          error?: string;
        };

        if (output && typeof output === 'object') {
          const typedOutput = output as GeminiOutput;
          if ('gemini' in typedOutput) {
            const gem = typedOutput.gemini;
            responseText = gem?.candidates?.[0]?.content?.parts?.[0]?.text || responseText;
          } else if ('error' in typedOutput) {
            responseText = `Error: ${typedOutput.error}`;
          }
        } else if (typeof output === 'string') {
          responseText = output;
        }
        const finalMessages = [...userMessages, { sender: 'agent' as const, text: responseText }];
        setMessages(finalMessages);
        onNodeUpdate({ ...node, data: { ...chatData, messages: finalMessages } });
        await supabase
          .from('nodes')
          .update({ data: { ...chatData, messages: finalMessages } })
          .eq('id', node.id);
      } catch (err) {
        const errorMsg = `Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
        const finalMessages = [...userMessages, { sender: 'agent' as const, text: errorMsg }];
        setMessages(finalMessages);
        onNodeUpdate({ ...node, data: { ...chatData, messages: finalMessages } });
        await supabase
          .from('nodes')
          .update({ data: { ...chatData, messages: finalMessages } })
          .eq('id', node.id);
      }
    }
  };

  return (
    <div
      className={`absolute flex flex-col bg-white/5 border rounded-lg shadow-lg ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
        borderColor: isSelected ? theme.accent : theme.border,
        zIndex: 3
      }}
      onMouseDown={e => onNodeMouseDown(e, node.id)}
      onClick={e => onNodeClick(e, node.id)}
      onContextMenu={e => onNodeContextMenu(e, node.id)}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-2 border-b" style={{ borderColor: theme.border }}>
        <span className="text-sm font-medium truncate" style={{ color: theme.text }}>{chatData.title || 'Chat Interface'}</span>
      </div>
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 text-xs" style={{ color: theme.textSecondary }}>
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <span className={`px-2 py-1 rounded ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-white'}`}>{msg.text}</span>
          </div>
        ))}
      </div>
      {/* Input Box */}
      {isSelected && (
        <form
          className="flex gap-1 p-2 border-t"
          style={{ borderColor: theme.border }}
          onSubmit={e => { e.preventDefault(); handleSend(); }}
        >
          <input
            className="flex-1 px-2 py-1 rounded bg-gray-900 text-white border"
            style={{ borderColor: theme.border }}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type a message..."
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1 rounded bg-blue-600 text-white text-xs"
            disabled={!input.trim()}
          >Send</button>
        </form>
      )}
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
