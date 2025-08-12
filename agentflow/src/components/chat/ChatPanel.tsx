"use client";

import { useState } from 'react';
import { CanvasNode, Connection } from '@/types';

interface ChatPanelProps {
  onFlowGenerated: (payload: { nodes: CanvasNode[]; connections: Connection[]; startNodeId: string | null }) => void;
}

export default function ChatPanel({ onFlowGenerated }: ChatPanelProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (input.trim() && !isLoading) {
      const userMessage = { text: input, sender: 'user' };
      setMessages(prev => [...prev, userMessage]);
      setInput('');
      setIsLoading(true);

      try {
        const res = await fetch('/api/flow-builder', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: input }),
        });

        if (res.ok) {
          const flowSpec = await res.json();
          const agentMessage = {
            text: 'I have generated a flow for you. You can add it to your canvas.',
            sender: 'agent',
            flowSpec: flowSpec,
          };
          setMessages(prev => [...prev, agentMessage]);
        } else {
          const agentMessage = {
            text: 'Sorry, I was unable to generate a flow. Please try again.',
            sender: 'agent',
            error: true,
          };
          setMessages(prev => [...prev, agentMessage]);
        }
      } catch (error) {
        const agentMessage = {
          text: 'An error occurred. Please check the console.',
          sender: 'agent',
          error: true,
        };
        setMessages(prev => [...prev, agentMessage]);
        console.error("Failed to call flow builder API:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-800 text-white">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <div key={index} className={`p-2 my-2 rounded max-w-xs ${msg.sender === 'user' ? 'bg-blue-600 self-end ml-auto' : 'bg-gray-700 self-start'}`}>
            <p>{msg.text}</p>
            {msg.flowSpec && (
              <button
                onClick={() => onFlowGenerated(msg.flowSpec)}
                className="mt-2 px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm"
              >
                Insert to Canvas
              </button>
            )}
          </div>
        ))}
        {isLoading && <div className="p-2 my-1 rounded bg-gray-700 self-start">Thinking...</div>}
      </div>
      <div className="p-4 border-t border-gray-700">
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 p-2 bg-gray-900 rounded-l-md focus:outline-none"
            placeholder="Describe the flow you want to build..."
            disabled={isLoading}
          />
          <button onClick={handleSend} className="px-4 py-2 bg-blue-600 rounded-r-md" disabled={isLoading}>
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
