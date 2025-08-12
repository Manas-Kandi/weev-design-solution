import type { McpExport, McpFlowSpec, McpNodeSpec } from "@/types/mcp.types";
import type { CanvasNode, Connection } from "@/types";

export interface MapFromMcpResult {
  nodes: CanvasNode[];
  connections: Connection[];
  startNodeId: string | null;
}

function nodeKindToTypeAndSubtype(kind: McpNodeSpec["kind"]): { type: CanvasNode["type"]; subtype: string } {
  switch (kind) {
    case "ToolAgent":
      return { type: "agent", subtype: "tool-agent" };
    case "DecisionTree":
      return { type: "logic", subtype: "decision-tree" };
    case "KnowledgeBase":
      return { type: "logic", subtype: "knowledge-base" };
    case "Agent":
    default:
      return { type: "agent", subtype: "agent" };
  }
}

export function mapFromMcpExport(doc: McpExport): MapFromMcpResult {
  const flow: McpFlowSpec | undefined = Array.isArray(doc.flows) && doc.flows.length > 0 ? doc.flows[0] : undefined;
  if (!flow) {
    return { nodes: [], connections: [], startNodeId: null };
  }

  const nodes: CanvasNode[] = (flow.nodes || []).map((n, idx) => {
    const { type, subtype } = nodeKindToTypeAndSubtype(n.kind);

    // Merge prompts into data when relevant
    const data: Record<string, unknown> = { ...(n.config || {}) };
    if (n.prompts) {
      if (n.prompts.systemPrompt !== undefined) data["systemPrompt"] = n.prompts.systemPrompt;
      if (n.prompts.userPrompt !== undefined) data["prompt"] = n.prompts.userPrompt;
      if (n.prompts.behavior !== undefined) data["behavior"] = n.prompts.behavior;
      if (n.prompts.temperature !== undefined) data["temperature"] = n.prompts.temperature;
      if (n.prompts.provider !== undefined) data["provider"] = n.prompts.provider;
      if (n.prompts.model !== undefined) data["model"] = n.prompts.model;
    }

    // Basic defaults for visual layout
    const baseX = 200 + (idx % 3) * 250;
    const baseY = 100 + Math.floor(idx / 3) * 150;

    // Title/label convenience
    const title = n.label || (typeof (n.config as any)?.title === "string" ? (n.config as any).title : undefined) || subtype || n.id;

    return {
      id: n.id,
      type,
      subtype,
      position: { x: baseX, y: baseY },
      size: { width: 250, height: 120 },
      data: {
        title,
        description: (n.config as any)?.description || "",
        color: (n.config as any)?.color || "#0066cc",
        icon: (n.config as any)?.icon || subtype,
        ...data,
      },
      inputs: [{ id: "input-1", label: "Input" }],
      outputs: [{ id: "output-1", label: "Output" }],
    } satisfies CanvasNode;
  });

  const connections: Connection[] = (flow.edges || []).map((e) => ({
    id: e.id,
    sourceNode: e.from,
    sourceOutput: "output-1",
    targetNode: e.to,
    targetInput: "input-1",
  }));

  const startNodeId: string | null = Array.isArray(flow.startNodeIds) && flow.startNodeIds.length > 0 ? flow.startNodeIds[0] : null;

  return { nodes, connections, startNodeId };
}
