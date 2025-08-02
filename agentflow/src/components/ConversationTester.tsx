import React from 'react';
import { User, Bot, AlertCircle, TrendingUp } from 'lucide-react';
import { CanvasNode, Connection } from '@/types';

interface ConversationTesterProps {
  nodes: CanvasNode[];
  connections: Connection[];
  onClose: () => void;
}

export default function ConversationTester({ nodes, connections, onClose }: ConversationTesterProps) {
  // Render the execution trace as a timeline/chat
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex overflow-hidden">
        <div className="flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between bg-gray-800">
            <span className="text-white font-medium">Test Flow Timeline</span>
            {onClose && (
              <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto figma-scrollbar p-6 space-y-4">
            {nodes && nodes.length > 0 ? (
              nodes.map(node => (
                <div key={node.id} className={`flex ${node.type === 'agent' ? 'justify-start' : node.type === 'ui' ? 'justify-end' : 'justify-center'}`}>
                  <div className={`max-w-[70%]`}>
                    <div className="flex items-center gap-2 mb-1">
                      {node.type === 'agent' ? (
                        <Bot className="w-4 h-4 text-green-400" />
                      ) : node.type === 'ui' ? (
                        <User className="w-4 h-4 text-blue-400" />
                      ) : node.type === 'logic' ? (
                        <TrendingUp className="w-4 h-4 text-yellow-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-gray-400" />
                      )}
                      <span className="text-xs text-gray-400">
                        {node.type.charAt(0).toUpperCase() + node.type.slice(1)}
                        {(node.data && 'title' in node.data && node.data.title) ? ` (${node.data.title})` : ''}
                      </span>
                    </div>
                    <div className={`rounded-lg px-4 py-2 ${node.type === 'agent' ? 'bg-gray-700 text-gray-100' : node.type === 'ui' ? 'bg-blue-600 text-white' : node.type === 'logic' ? 'bg-yellow-900 text-yellow-100' : 'bg-gray-800 text-gray-300'}`}>{typeof node.output === 'string' ? node.output : JSON.stringify(node.output)}</div>
                    <div className="mt-2 text-xs text-gray-500">
                      <strong>Inputs:</strong> {Object.keys(node.inputs).length ? JSON.stringify(node.inputs) : 'None'}<br />
                      <strong>Context:</strong> {Object.keys(node.context ?? {}).length ? JSON.stringify(node.context) : 'None'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-gray-400">No test flow results. Click the Test button to run the flow.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
