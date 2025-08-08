import { CanvasNode, Connection, ProjectFile } from '@/types';

// MCP export structure with richer metadata for handoff quality
export interface McpExportFormat {
  projectId: string;
  projectName: string;
  version: string;
  timestamp: string;
  startNodeId: string | null;
  flow: {
    nodes: CanvasNode[];
    connections: Connection[];
  };
  metadata: {
    // Per-node port schemas for easier external consumption
    portSchemas: Record<
      string,
      {
        inputs: { id: string; label: string; type?: string }[];
        outputs: { id: string; label: string; type?: string }[];
      }
    >;
    // Node configurations (the node's data payload) keyed by node id
    nodeConfigs: Record<string, unknown>;
    // Knowledge base / project assets associated with this flow
    knowledgeBaseAssets: Array<
      Pick<
        ProjectFile,
        'id' | 'name' | 'file_path' | 'file_type' | 'size_bytes' | 'created_at'
      >
    >;
  };
}

export function exportToMcpFormat(
  projectId: string,
  projectName: string,
  nodes: CanvasNode[],
  connections: Connection[],
  startNodeId: string | null,
  assets: ProjectFile[] = []
): McpExportFormat {
  // Derive port schemas and configs for quick consumption by external tools
  const portSchemas: McpExportFormat['metadata']['portSchemas'] = {};
  const nodeConfigs: McpExportFormat['metadata']['nodeConfigs'] = {};
  for (const n of nodes) {
    portSchemas[n.id] = {
      inputs: Array.isArray(n.inputs) ? n.inputs : [],
      outputs: Array.isArray(n.outputs) ? n.outputs : [],
    };
    nodeConfigs[n.id] = n.data ?? {};
  }

  return {
    projectId,
    projectName,
    version: '1.1.0',
    timestamp: new Date().toISOString(),
    startNodeId,
    flow: {
      nodes,
      connections,
    },
    metadata: {
      portSchemas,
      nodeConfigs,
      knowledgeBaseAssets: assets.map((f) => ({
        id: f.id,
        name: f.name,
        file_path: f.file_path,
        file_type: f.file_type,
        size_bytes: f.size_bytes,
        created_at: f.created_at,
      })),
    },
  };
}
