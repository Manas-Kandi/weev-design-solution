import React, { useState, useCallback, useRef, useEffect } from "react";
import CanvasEngine from "@/components/canvas/Canvas";
import { CanvasNode, Connection } from "@/types";
import { runWorkflow } from "@/lib/workflowRunner";
import FloatingSidebarContainer from "@/components/canvas/FloatingSidebarContainer";
import { KnowledgeBaseNode } from "@/lib/nodes/knowledge/KnowledgeBaseNode";
import { validateMcpExport, McpExport } from "@/types/mcp.types";
import { mapFromMcpExport } from "@/lib/mcp/mapFromMcpExport";
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
  onDeleteNode: (nodeId: string) => void;
  projectId?: string | null;
  projectName?: string | null;
  onReplaceFlowFromMcp?: (payload: { nodes: CanvasNode[]; connections: Connection[]; startNodeId: string | null }) => Promise<void>;
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
    onDeleteNode,
    projectId = null,
    projectName = null,
    onReplaceFlowFromMcp,
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
    // Inform parent to remove node from state
    onDeleteNode(nodeId);
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
      <div className="absolute top-4 left-4 z-30">
        {/* Replace Flow from MCP */}
        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/10 hover:bg-white/15 text-xs text-white cursor-pointer select-none">
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              try {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                let parsed: McpExport;
                try {
                  parsed = JSON.parse(text);
                } catch (err) {
                  alert("Invalid JSON file.");
                  return;
                }
                const validation = validateMcpExport(parsed);
                if (!validation.valid) {
                  const first = validation.errors?.[0];
                  alert(`Invalid MCP file: ${first || "schema validation failed"}`);
                  return;
                }
                const mapped = mapFromMcpExport(parsed);
                const ok = window.confirm(
                  `Replace current flow with ${mapped.nodes.length} nodes and ${mapped.connections.length} connections? This will overwrite current canvas.`
                );
                if (!ok) return;
                if (!onReplaceFlowFromMcp) {
                  alert("Import handler not available in this view.");
                  return;
                }
                await onReplaceFlowFromMcp(mapped);
              } catch (err) {
                console.error("MCP import failed:", err);
                alert(err instanceof Error ? err.message : "MCP import failed");
              } finally {
                // reset input value so selecting the same file again will trigger onChange
                if (e.target) e.target.value = "";
              }
            }}
          />
          <span className="opacity-80">Replace Flow from MCP</span>
        </label>
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
      <FloatingSidebarContainer
        selectedNode={selectedNode}
        onNodeChange={onNodeUpdate}
        onNodeClose={() => onNodeSelect(null)}
        nodes={nodes}
        connections={connections}
        showTesting={showTester}
        onTestingClose={() => {
          setShowTester(false);
          setTestFlowResult(null);
        }}
        onTesterEvent={handleTesterEvent}
        onConnectionsChange={onConnectionsChange}
        projectId={projectId}
        projectName={projectName}
      />
      {/* Pass the selected node id here if available */}
    </div>
  );
}
