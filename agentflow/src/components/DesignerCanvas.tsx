import React from "react";
import CanvasEngine from "@/components/Canvas";
import { CanvasNode, Connection } from "@/types";
import { runWorkflow } from "@/lib/workflowRunner";
import ConversationTester from "@/components/ConversationTester";
import PropertiesPanel from "./PropertiesPanel";
import { KnowledgeBaseNode } from "@/lib/nodes/knowledge/KnowledgeBaseNode";

interface DesignerCanvasProps {
  nodes: CanvasNode[];
  connections: Connection[];
  onNodeSelect: (n: CanvasNode | null) => void;
  onNodeUpdate: (updated: CanvasNode) => void;
  onConnectionsChange: (c: Connection[]) => void;
  onCreateConnection: (connectionData: Connection) => Promise<void>;
  showTester: boolean;
  isTesting: boolean;
  testFlowResult: Record<string, unknown> | null;
  setShowTester: (show: boolean) => void;
  setTestFlowResult: (result: Record<string, unknown> | null) => void;
  setNodes?: (nodes: CanvasNode[]) => void; // Added optional setNodes prop
  selectedNode: CanvasNode | null; // Add selectedNode as a prop
}

export default function DesignerCanvas(props: DesignerCanvasProps) {
  const {
    nodes,
    connections,
    onNodeSelect,
    onNodeUpdate,
    onConnectionsChange,
    onCreateConnection,
    showTester,
    isTesting,
    testFlowResult,
    setShowTester,
    setTestFlowResult,
    setNodes,
    selectedNode,
  } = props;

  const [startNodeId, setStartNodeId] = React.useState<string | null>(null);
  const [testLogs, setTestLogs] = React.useState<
    Array<{
      nodeId: string;
      title: string;
      type: string;
      log: string;
      output?: unknown;
      error?: string;
    }>
  >([]);
  const [isTestingState, setIsTestingState] = React.useState(false);

  // --- Node Deletion: Clear KnowledgeBaseNode cache ---
  const handleNodeDelete = (nodeId: string) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node && node.type === "logic" && node.subtype === "knowledge-base") {
      KnowledgeBaseNode.clearCache(nodeId);
    }
    // Remove node and its connections
    onConnectionsChange(
      connections.filter(
        (c) => c.sourceNode !== nodeId && c.targetNode !== nodeId
      )
    );
    if (props.setNodes) props.setNodes(nodes.filter((n) => n.id !== nodeId));
  };

  // --- Real-time Test Flow Execution ---
  const handleTestFlow = async () => {
    if (typeof window === "undefined") return;
    if (typeof document === "undefined") return;
    if (!nodes || !connections) return;
    setTestLogs([]);
    setTestFlowResult(null);
    setIsTestingState(true);
    try {
      const result = await runWorkflow(
        nodes,
        connections,
        startNodeId,
        (
          nodeId: string,
          log: string,
          output?: unknown,
          error?: string
        ) => {
          const node = nodes.find((n) => n.id === nodeId);
          setTestLogs((prev) => [
            ...prev,
            {
              nodeId,
              title: node?.data.title || nodeId,
              type: node?.type || "",
              log,
              output,
              error,
            },
          ]);
        }
      );
      setTestFlowResult(result);
    } catch (err) {
      setTestFlowResult({
        error: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsTestingState(false);
    }
  };

  // Provide a default handleNodeDrag implementation
  const handleNodeDrag = (id: string, pos: { x: number; y: number }) => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    onNodeUpdate({ ...node, position: { x: pos.x, y: pos.y } });
  };

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Real-time Test Flow Panel */}
      {testLogs.length > 0 && (
        <div className="absolute top-16 right-4 w-96 max-h-[60vh] overflow-auto bg-[#1e1e1e] text-vscode-text p-4 rounded shadow z-20 font-mono text-xs">
          <div className="font-bold text-vscode-title mb-2">Test Flow Log</div>
          {testLogs.map((log, i) => (
            <div
              key={i}
              className={`mb-3 pb-2 border-b border-vscode-border ${
                log.error ? "text-red-400" : ""
              }`}
            >
              <div className="font-semibold">
                {log.title}{" "}
                <span className="text-xs text-gray-400">({log.type})</span>
              </div>
              <div className="whitespace-pre-wrap">{log.log}</div>
              {log.output !== undefined && (
                <div className="mt-1 text-green-400">
                  Output:{" "}
                  {typeof log.output === "string" || typeof log.output === "number"
                    ? log.output
                    : typeof log.output === "object"
                    ? <span>{JSON.stringify(log.output)}</span>
                    : String(log.output)}
                </div>
              )}
              {log.error && (
                <div className="mt-1 text-red-400">
                  Error: {log.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Conversation Tester Modal */}
      {showTester && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg w-[600px] max-w-full p-6 relative">
            <button
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
              onClick={() => {
                setShowTester(false);
                setTestFlowResult(null);
              }}
            >
              ✕
            </button>
            {isTesting ? (
              <div className="flex flex-col items-center justify-center h-48">
                <span className="animate-spin text-3xl mb-2">⏳</span>
                <span className="text-gray-700">Running workflow...</span>
              </div>
            ) : (
              <ConversationTester
                nodes={nodes}
                connections={connections}
                onClose={() => {
                  setShowTester(false);
                  setTestFlowResult(null);
                }}
              />
            )}
          </div>
        </div>
      )}
      {/* Results Panel */}
      {testFlowResult && (
        <div className="absolute top-16 right-4 w-96 max-h-[60vh] overflow-auto bg-gray-900 text-white p-4 rounded shadow z-20">
          <h4 className="font-bold mb-2">Flow Results</h4>
          <div className="space-y-3">
            {Object.entries(testFlowResult).map(([nodeId, output]) => {
              const node = nodes.find((n) => n.id === nodeId);
              const title = node?.data.title || nodeId;
              const type = node?.type || "";
              let display;
              let isError = false;
              if (output === null) {
                display = <span className="text-gray-400">No output</span>;
              } else if (typeof output === "string") {
                display = <span>{output}</span>;
                if (output.toLowerCase().includes("error")) isError = true;
              } else if (
                output &&
                typeof output === "object" &&
                "error" in output
              ) {
                display = (
                  <span className="text-red-400">
                    {String((output as { error: string }).error)}
                  </span>
                );
                isError = true;
              } else if (
                output &&
                typeof output === "object" &&
                "gemini" in output &&
                output.gemini &&
                typeof output.gemini === "object" &&
                Array.isArray(
                  (
                    output.gemini as {
                      candidates?: {
                        content?: { parts?: { text?: string }[] };
                      }[];
                    }
                  ).candidates
                )
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
                display = (
                  <span>
                    {text ? (
                      text
                    ) : (
                      <span className="text-gray-400">No response</span>
                    )}
                  </span>
                );
              } else {
                display = <span>{JSON.stringify(output)}</span>;
              }
              return (
                <div
                  key={nodeId}
                  className={`border-b pb-2 ${
                    isError ? "border-red-400" : "border-gray-700"
                  }`}
                >
                  <div className="font-semibold text-sm mb-1">
                    {title}{" "}
                    <span className="text-xs text-gray-400">({type})</span>
                  </div>
                  <div className="text-xs">{display}</div>
                </div>
              );
            })}
          </div>
          <button
            className="mt-2 w-full bg-blue-600 text-white px-4 py-2 rounded shadow"
            onClick={() => setTestFlowResult(null)}
          >
            Close
          </button>
        </div>
      )}
      <div className="absolute top-4 left-4 z-30">
        <button
          className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700"
          onClick={handleTestFlow}
        >
          Test Flow
        </button>
      </div>
      <CanvasEngine
        nodes={nodes}
        connections={connections}
        onNodeSelect={onNodeSelect}
        onNodeUpdate={onNodeUpdate}
        onConnectionsChange={onConnectionsChange}
        onCreateConnection={onCreateConnection}
        onNodeDrag={handleNodeDrag}
        selectedNodeId={selectedNode ? selectedNode.id : null}
        startNodeId={startNodeId}
        onStartNodeChange={setStartNodeId}
        onNodeDelete={handleNodeDelete}
      />
      <PropertiesPanel
        selectedNode={selectedNode}
        onChange={onNodeUpdate}
        isTesting={isTestingState}
      />
      {/* Pass the selected node id here if available */}
    </div>
  );
}
