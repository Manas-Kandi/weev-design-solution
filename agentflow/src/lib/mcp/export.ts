import { CanvasNode, Connection } from '@/types';

// This is a simplified structure for our MCP export. We can expand this as needed.
export interface McpExportFormat {
  projectName: string;
  version: string;
  timestamp: string;
  flow: {
    nodes: CanvasNode[];
    connections: Connection[];
  };
  // We can add more structured data here later, like agent-specific configs, etc.
}

export function exportToMcpFormat(
  projectName: string,
  nodes: CanvasNode[],
  connections: Connection[]
): McpExportFormat {
  return {
    projectName,
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    flow: {
      nodes,
      connections,
    },
  };
}
