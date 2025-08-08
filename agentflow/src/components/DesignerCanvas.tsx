import React, { useState, useCallback, useRef, useEffect } from "react";
import CanvasEngine from "@/components/Canvas";
import { CanvasNode, Connection } from "@/types";
import { runWorkflow } from "@/lib/workflowRunner";
import ConversationTester from "@/components/ConversationTester";
import TesterV2 from "@/components/tester/TesterV2";
import { TESTER_V2_ENABLED } from "@/lib/flags";
import PropertiesPanel from "./PropertiesPanel";
import { KnowledgeBaseNode } from "@/lib/nodes/knowledge/KnowledgeBaseNode";
import type {
  TesterEvent,
  NodeStartEvent,
  NodeFinishEvent,
} from "@/types/tester";

interface DesignerCanvasProps {
  nodes: CanvasNode[];
  connections: Connection[];
  onNodeSelect: (n: CanvasNode | null) => void;
  onNodeUpdate: (updated: CanvasNode) => void;
  onConnectionsChange: (c: Connection[]) => void;
  onCreateConnection: (connectionData: Connection) => Promise<void>;
  showTester: boolean;
  testFlowResult: Record<string, unknown> | null;
  setShowTester: (show: boolean) => void;
  setTestFlowResult: (result: Record<string, unknown> | null) => void;
  selectedNode: CanvasNode | null;
  onTestFlow: () => void;
  testButtonDisabled?: boolean;
  startNodeId: string | null;
  onStartNodeChange: (id: string | null) => void;
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
    testFlowResult,
    setShowTester,
    setTestFlowResult,
    selectedNode,
    onTestFlow,
    testButtonDisabled = false,
    startNodeId,
    onStartNodeChange,
  } = props;

  // --- Local state for test logs and testing status ---
  const [testLogs, setTestLogs] = useState<{
    nodeId: string;
    title: string;
    type: string;
    log: string;
    output?: unknown;
    error?: string;
  }[]>([]);
  const [isTesting, setIsTestingState] = useState(false);

  // Resizable Tester panel height
  const [testerHeight, setTesterHeight] = useState<number>(300);
  const resizeRef = useRef<{ startY: number; startH: number } | null>(null);

  function onResizeMouseMove(e: MouseEvent) {
    if (!resizeRef.current) return;
    const dy = e.clientY - resizeRef.current.startY;
    // Panel is anchored to bottom; dragging up (dy < 0) increases height
    const next = Math.max(180, Math.min(window.innerHeight - 120, resizeRef.current.startH - dy));
    setTesterHeight(next);
  }

  function onResizeMouseUp() {
    window.removeEventListener("mousemove", onResizeMouseMove);
    window.removeEventListener("mouseup", onResizeMouseUp);
    resizeRef.current = null;
  }

  const onResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    resizeRef.current = { startY: e.clientY, startH: testerHeight };
    window.addEventListener("mousemove", onResizeMouseMove);
    window.addEventListener("mouseup", onResizeMouseUp);
    e.preventDefault();
  };

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", onResizeMouseMove);
      window.removeEventListener("mouseup", onResizeMouseUp);
    };
  }, []);

  // Live tester visualization state
  const [nodeStatuses, setNodeStatuses] = useState<
    Record<string, "running" | "success" | "error">
  >({});
  const [pulsingConnectionIds, setPulsingConnectionIds] = useState<string[]>(
    []
  );

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
    if (startNodeId === nodeId) {
      onStartNodeChange(null);
    }
  };

  // Mirror TesterV2 events into live canvas visuals
  const handleTesterEvent = useCallback((evt: TesterEvent) => {
    switch (evt.type) {
      case "flow-started": {
        // Reset transient visuals at the beginning of a run
        setPulsingConnectionIds([]);
        setNodeStatuses({});
        break;
      }
      case "node-started": {
        const e = evt as NodeStartEvent;
        setNodeStatuses((prev) => ({ ...prev, [e.nodeId]: "running" }));
        break;
      }
      case "node-finished": {
        const e = evt as NodeFinishEvent;
        setNodeStatuses((prev) => {
          const next = { ...prev } as Record<
            string,
            "running" | "success" | "error"
          >;
          if (e.status === "success" || e.status === "error") {
            next[e.nodeId] = e.status;
          } else {
            // skipped → remove glow
            delete next[e.nodeId];
          }
          return next;
        });
        if (Array.isArray(e.forwardedConnectionIds) && e.forwardedConnectionIds.length) {
          const ids = e.forwardedConnectionIds;
          setPulsingConnectionIds((prev) => Array.from(new Set([...prev, ...ids])));
          // Clear these pulses after one animation cycle
          setTimeout(() => {
            setPulsingConnectionIds((prev) => prev.filter((id) => !ids.includes(id)));
          }, 600);
        }
        break;
      }
      case "flow-finished": {
        // Ensure no lingering pulses
        setTimeout(() => setPulsingConnectionIds([]), 200);
        break;
      }
    }
  }, []);

  // --- Real-time Test Flow Execution ---
  // --- Real-time Test Flow Execution ---
  // (Note: This is not used directly in the UI, but kept for completeness. The onTestFlow prop is used for the test button.)
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
        (nodeId: string, log: string, output?: unknown, error?: string) => {
          const node = nodes.find((n) => n.id === nodeId);
          setTestLogs((prev) => [
            ...prev,
            {
              nodeId,
              title: node ? getNodeTitle(node) : nodeId,
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

  // Helper to safely get node title
  function getNodeTitle(node: CanvasNode): string {
    if (!node) return "";
    const data = node.data;
    // DashboardNodeData, DecisionTreeNodeData, ConversationFlowNodeData, ChatNodeData, etc.
    if (
      typeof data === "object" &&
      data !== null &&
      "title" in data &&
      typeof (data as { title?: unknown }).title === "string"
    ) {
      return (data as { title: string }).title;
    }
    // DecisionTreeNodeData may have title
    if (
      typeof data === "object" &&
      data !== null &&
      "description" in data &&
      typeof (data as { description?: unknown }).description === "string"
    ) {
      // Optionally use description if present
      return (data as { description: string }).description;
    }
    // Fallback to node id
    return node.id;
  }

  return (
    <div className="flex-1 relative overflow-hidden">
      {/* Real-time Test Flow Panel */}
      {testLogs.length > 0 && (
        <div className="absolute top-16 right-4 w-96 max-h-[60vh] overflow-auto figma-scrollbar bg-[#1e1e1e] text-vscode-text p-4 rounded shadow z-20 font-mono text-xs">
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
                  {typeof log.output === "string" ||
                  typeof log.output === "number" ? (
                    log.output
                  ) : typeof log.output === "object" ? (
                    <span>{JSON.stringify(log.output)}</span>
                  ) : (
                    String(log.output)
                  )}
                </div>
              )}
              {log.error && (
                <div className="mt-1 text-red-400">Error: {log.error}</div>
              )}
            </div>
          ))}
        </div>
      )}
      {/* Tester bottom bar (compact terminal style) */}
      {showTester && (
        <div className="absolute left-0 right-0 bottom-0 z-40 bg-[#0e0f11] border-t border-gray-800/80 shadow-[0_-8px_16px_rgba(0,0,0,0.35)]">
          {/* Resize handle */}
          <div
            className="h-2 cursor-row-resize flex items-center justify-center hover:bg-gray-800/40"
            onMouseDown={onResizeMouseDown}
            role="separator"
            aria-orientation="horizontal"
            title="Drag to resize"
          >
            <div className="w-16 h-1 rounded bg-gray-600" />
          </div>
          {/* Header */}
          <div className="h-8 px-3 flex items-center justify-between bg-[#121316] border-b border-gray-800/60">
            <div className="text-[11px] tracking-wide text-gray-300 font-medium">
              Tester
            </div>
            <button
              className="text-xs text-gray-400 hover:text-white transition"
              onClick={() => {
                setShowTester(false);
                setTestFlowResult(null);
              }}
            >
              Close
            </button>
          </div>
          {/* Content */}
          <div className="overflow-hidden" style={{ height: testerHeight }}>
            <div className="h-full overflow-auto overscroll-contain figma-scrollbar p-2">
              {TESTER_V2_ENABLED ? (
                <TesterV2
                  nodes={nodes}
                  connections={connections}
                  onClose={() => {
                    setShowTester(false);
                    setTestFlowResult(null);
                  }}
                  onTesterEvent={handleTesterEvent}
                />
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
        </div>
      )}
      {/* Results Panel (hidden when Tester V2 is enabled) */}
      {(!TESTER_V2_ENABLED && testFlowResult) && (
        <div className="absolute top-16 right-4 w-96 max-h-[60vh] overflow-auto figma-scrollbar bg-gray-900 text-white p-4 rounded shadow z-20">
          <h4 className="font-bold mb-2">Flow Results</h4>
          <div className="space-y-3">
            {Object.entries(testFlowResult).map(([nodeId, output]) => {
              const node = nodes.find((n) => n.id === nodeId);
              const title = node ? getNodeTitle(node) : nodeId;
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
        onStartNodeChange={onStartNodeChange}
        onNodeDelete={handleNodeDelete}
        nodeStatuses={nodeStatuses}
        pulsingConnectionIds={pulsingConnectionIds}
      />
      <PropertiesPanel
        selectedNode={selectedNode}
        onChange={onNodeUpdate}
        nodes={nodes}
        connections={connections}
        onConnectionsChange={onConnectionsChange}
      />
      {/* Pass the selected node id here if available */}
    </div>
  );
}
