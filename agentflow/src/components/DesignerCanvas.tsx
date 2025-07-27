import React, { useState } from 'react';
import CanvasEngine from '@/components/Canvas';
import { CanvasNode, Connection } from '@/types';
import { runWorkflow } from '@/lib/workflowRunner';
import { Button } from '@/components/ui/button';
import ConversationTester from '@/components/ConversationTester';

interface DesignerCanvasProps {
  nodes: CanvasNode[];
  connections: Connection[];
  onNodeSelect: (n: CanvasNode | null) => void;
  selectedNodeId: string | null;
  onNodeUpdate: (updated: CanvasNode) => void;
  onConnectionsChange: (c: Connection[]) => void;
  onCreateConnection: (connectionData: Connection) => Promise<void>;
}

export default function DesignerCanvas(props: DesignerCanvasProps & { onTestFlow?: () => void }) {
  const {
    nodes,
    connections,
    onNodeSelect,
    selectedNodeId,
    onNodeUpdate,
    onConnectionsChange,
    onCreateConnection,
    onTestFlow // Add this
  } = props;

  const [testFlowResult, setTestFlowResult] = useState<Record<string, unknown> | null>(null);
  const [testing, setTesting] = useState(false);
  const [showTester, setShowTester] = useState(false);

  const handleNodeDrag = (id: string, pos: { x: number; y: number }) => {
    const node = nodes.find(n => n.id === id);
    if (!node) return;
    
    onNodeUpdate({ ...node, position: { x: pos.x, y: pos.y } });
  };

  const handleTestFlow = async () => {
    setTesting(true);
    try {
      // Debug: Check if we have the latest node data
      const chatNode = nodes.find(n => n.type === 'ui' && n.subtype === 'chat');
      console.log('Chat node data in handleTestFlow:', chatNode?.data);
      const result = await runWorkflow(nodes, connections);
      setTestFlowResult(result);
      if (onTestFlow) onTestFlow();
      setShowTester(true); // Show the ConversationTester modal
    } catch (err) {
      setTestFlowResult({ error: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Test Flow Button */}
      <div className="absolute top-4 right-4 z-10">
        <Button
          className="bg-blue-600 text-white px-4 py-2 rounded shadow"
          onClick={handleTestFlow}
          disabled={testing}
        >
          {testing ? 'Testing...' : 'Test Flow'}
        </Button>
      </div>
      {/* Conversation Tester Modal */}
      {showTester && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-[600px] max-w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => setShowTester(false)}
            >
              ✕
            </button>
            <ConversationTester
              nodes={nodes}
              connections={connections}
              onClose={() => setShowTester(false)}
            />
          </div>
        </div>
      )}
      {/* Results Panel */}
      {testFlowResult && (
        <div className="absolute top-16 right-4 w-96 max-h-[60vh] overflow-auto bg-gray-900 text-white p-4 rounded shadow z-20">
          <h4 className="font-bold mb-2">Flow Results</h4>
          <div className="space-y-3">
            {Object.entries(testFlowResult).map(([nodeId, output]) => {
              const node = nodes.find(n => n.id === nodeId);
              const title = node?.data.title || nodeId;
              const type = node?.type || '';
              let display;
              let isError = false;
              if (output === null) {
                display = <span className="text-gray-400">No output</span>;
              } else if (typeof output === 'string') {
                display = <span>{output}</span>;
                if (output.toLowerCase().includes('error')) isError = true;
              } else if (output && typeof output === 'object' && 'error' in output) {
                display = <span className="text-red-400">{String((output as { error: string }).error)}</span>;
                isError = true;
              } else if (
                output &&
                typeof output === 'object' &&
                'gemini' in output &&
                output.gemini &&
                typeof output.gemini === 'object' &&
                Array.isArray((output.gemini as { candidates?: { content?: { parts?: { text?: string }[] } }[] }).candidates)
              ) {
                type GeminiCandidate = {
                  content?: {
                    parts?: {
                      text?: string;
                    }[];
                  };
                };
                type GeminiOutput = {
                  candidates?: GeminiCandidate[];
                };
                const gemini = output.gemini as GeminiOutput;
                const text = gemini.candidates?.[0]?.content?.parts?.[0]?.text;
                display = <span>{text ? text : <span className="text-gray-400">No response</span>}</span>;
              } else {
                display = <span>{JSON.stringify(output)}</span>;
              }
              return (
                <div key={nodeId} className={`border-b pb-2 ${isError ? 'border-red-400' : 'border-gray-700'}`}>
                  <div className="font-semibold text-sm mb-1">
                    {title} <span className="text-xs text-gray-400">({type})</span>
                  </div>
                  <div className="text-xs">{display}</div>
                </div>
              );
            })}
          </div>
          <Button className="mt-2 w-full" variant="outline" onClick={() => setTestFlowResult(null)}>
            Close
          </Button>
        </div>
      )}
      <CanvasEngine
        nodes={nodes}
        connections={connections}
        onNodeSelect={onNodeSelect}
        onNodeDrag={handleNodeDrag}
        onConnectionsChange={onConnectionsChange}
        onCreateConnection={onCreateConnection}
        onNodeUpdate={onNodeUpdate}
      />
    </div>
  );
}