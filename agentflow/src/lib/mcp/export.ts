import { CanvasNode, Connection } from "@/types";

let nodes: CanvasNode[] = [];
let connections: Connection[] = [];

/**
 * Update the in-memory agent flow used by the MCP tools.
 */
export const setAgentFlow = (
  newNodes: CanvasNode[],
  newConnections: Connection[]
): void => {
  nodes = newNodes;
  connections = newConnections;
};

/**
 * Tool: get_agent_flow
 * Returns the current nodes and connections.
 */
export const getAgentFlow = () => ({
  nodes,
  connections,
});

/**
 * Tool: get_node_config
 * Returns a single node's configuration by id.
 */
export const getNodeConfig = (id: string) =>
  nodes.find((n) => n.id === id) || null;

/**
 * Serialize the current agent flow and tool definitions into an MCP spec.
 */
export const getSpec = () => ({
  tools: {
    get_agent_flow: {
      description:
        "Return all nodes and connections in the current agent flow.",
    },
    get_node_config: {
      description: "Return configuration for a node by id.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string" },
        },
        required: ["id"],
      },
    },
  },
  nodes,
  connections,
});

export default getSpec;
