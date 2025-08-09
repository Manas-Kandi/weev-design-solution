import { CanvasNode, Connection } from "@/types";
import type { TesterEvent } from "@/types/tester";
import type { RunExecutionOptions } from "@/types/run";
import { FlowEngine } from "./flow/FlowEngine";
import { evaluateAssertions } from "@/lib/assertions";

// Helper to safely get node title
function getNodeTitle(node: CanvasNode): string {
  if (!node) return "";
  const data = node.data;
  if (
    typeof data === "object" &&
    data !== null &&
    "title" in data &&
    typeof (data as { title?: unknown }).title === "string"
  ) {
    return (data as { title: string }).title;
  }
  return "";
}

export async function runWorkflow(
  nodes: CanvasNode[],
  connections: Connection[],
  startNodeId?: string | null,
  emitLog?: (
    nodeId: string,
    log: string,
    output?: unknown,
    error?: string
  ) => void,
  hooks?: {
    emitTesterEvent?: (event: TesterEvent) => void;
    beforeNodeExecute?: (node: CanvasNode) => Promise<void>;
  },
  options?: RunExecutionOptions
) {
  const engine = new FlowEngine(nodes, connections, options);

  // Use provided startNodeId or find start node
  if (startNodeId) {
    engine.setStartNode(startNodeId);
  } else {
    const startNode =
      nodes.find((n) => getNodeTitle(n).toLowerCase().includes("start")) ||
      nodes[0];
    if (startNode) {
      engine.setStartNode(startNode.id);
    }
  }

  const outputs = await engine.execute(emitLog, hooks);

  // Post-run: evaluate assertions if provided
  if (options?.assertions && options.assertions.length > 0) {
    try {
      const result = evaluateAssertions({
        assertions: options.assertions,
        nodeOutputs: outputs,
        connections,
      });
      const header = `Assertions: ${result.passed ? "PASSED" : "FAILED"} (${result.results.filter(r=>r.pass).length}/${result.results.length})`;
      if (emitLog) emitLog("flow", header, result as unknown, result.passed ? undefined : "Some assertions failed");
      else console.log("[Tester]", header, result);
      // Also log each assertion result for clarity
      for (const r of result.results) {
        const msg = `${r.pass ? "✓" : "✗"} ${r.description || r.op}${r.path ? ` @ ${r.path}` : ""} → ${r.pass ? "pass" : "fail"}. ${r.message}`;
        if (emitLog) emitLog("flow", msg);
        else console.log("[Tester]", msg);
      }
    } catch (err) {
      const emsg = err instanceof Error ? err.message : String(err);
      if (emitLog) emitLog("flow", "Assertions evaluation error", undefined, emsg);
      else console.warn("[Tester] Assertions evaluation error:", err);
    }
  }

  return outputs;
}
