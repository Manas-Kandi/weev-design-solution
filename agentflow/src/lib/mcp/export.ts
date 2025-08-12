import { CanvasNode, Connection, ProjectFile } from '@/types';

// MCP export structure with comprehensive contextual protocol for Windsurf/Cursor
export interface McpExportFormat {
  projectId: string;
  projectName: string;
  version: string;
  timestamp: string;
  startNodeId: string | null;
  
  // Comprehensive workflow context for AI tools
  context: {
    purpose: string;
    description: string;
    intendedBehavior: string;
    keyDecisionPoints: string[];
    dataFlow: string;
  };
  
  flow: {
    nodes: CanvasNode[];
    connections: Connection[];
  };
  
  // Enhanced metadata for better AI understanding
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
    // Node reasoning and behavior descriptions
    nodeDescriptions: Record<string, {
      role: string;
      reasoning: string;
      expectedBehavior: string;
    }>;
    // Knowledge base / project assets associated with this flow
    knowledgeBaseAssets: Array<
      Pick<
        ProjectFile,
        'id' | 'name' | 'file_path' | 'file_type' | 'size_bytes' | 'created_at'
      >
    >;
    // Test scenarios and expected outcomes
    testScenarios: Array<{
      name: string;
      input: string;
      expectedOutput: string;
    }>;
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
  const nodeDescriptions: McpExportFormat['metadata']['nodeDescriptions'] = {};
  
  // Generate comprehensive node descriptions for AI understanding
  for (const n of nodes) {
    portSchemas[n.id] = {
      inputs: Array.isArray(n.inputs) ? n.inputs : [],
      outputs: Array.isArray(n.outputs) ? n.outputs : [],
    };
    nodeConfigs[n.id] = n.data ?? {};
    
    // Generate intelligent descriptions based on node type
    nodeDescriptions[n.id] = {
      role: getNodeRole(n),
      reasoning: getNodeReasoning(n),
      expectedBehavior: getNodeExpectedBehavior(n)
    };
  }
  
  // Generate workflow context from the flow structure
  const context = generateWorkflowContext(nodes, connections, startNodeId);
  
  // Generate test scenarios (placeholder for now)
  const testScenarios = [
    {
      name: "Basic Flow Test",
      input: "Test input for the workflow",
      expectedOutput: "Expected output based on the workflow design"
    }
  ];

  return {
    projectId,
    projectName,
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    startNodeId,
    context,
    flow: {
      nodes,
      connections,
    },
    metadata: {
      portSchemas,
      nodeConfigs,
      nodeDescriptions,
      knowledgeBaseAssets: assets.map((f) => ({
        id: f.id,
        name: f.name,
        file_path: f.file_path,
        file_type: f.file_type,
        size_bytes: f.size_bytes,
        created_at: f.created_at,
      })),
      testScenarios,
    },
  };
}

// Helper functions to generate intelligent descriptions
function getNodeRole(node: CanvasNode): string {
  const roleMap: Record<string, string> = {
    'agent': 'Reasoning and decision-making agent',
    'tool-agent': 'Tool execution agent',
    'knowledge-base': 'Knowledge storage and retrieval',
    'template': 'Message template processor',
    'if-else': 'Conditional logic branching',
    'decision-tree': 'Multi-path decision logic',
  };
  return roleMap[node.subtype] || `${node.type} node for workflow processing`;
}

function getNodeReasoning(node: CanvasNode): string {
  const data = node.data as any;
  if (node.subtype === 'agent') {
    return `This agent analyzes inputs using LLM reasoning. ${data.behavior ? `Behavior: ${data.behavior}` : 'It processes information and makes decisions based on context.'}`;
  }
  if (node.subtype === 'tool-agent') {
    return `Executes ${data.toolConfig?.toolType || 'tool'} operations and returns results to the workflow.`;
  }
  if (node.subtype === 'knowledge-base') {
    return `${data.operation === 'store' ? 'Stores' : 'Retrieves'} information from the knowledge base for context-aware processing.`;
  }
  return 'Processes data according to its configuration and passes results to connected nodes.';
}

function getNodeExpectedBehavior(node: CanvasNode): string {
  const data = node.data as any;
  if (node.subtype === 'agent') {
    return 'Receives input, applies reasoning based on system prompt and behavior rules, and outputs structured responses.';
  }
  if (node.subtype === 'tool-agent') {
    return `Simulates ${data.toolConfig?.toolType || 'tool'} functionality and returns mock or live data based on configuration.`;
  }
  return 'Processes inputs according to type-specific logic and forwards results through output connections.';
}

function generateWorkflowContext(
  nodes: CanvasNode[],
  connections: Connection[],
  startNodeId: string | null
): McpExportFormat['context'] {
  const agentNodes = nodes.filter(n => n.subtype === 'agent');
  const toolNodes = nodes.filter(n => n.subtype === 'tool-agent');
  const decisionNodes = nodes.filter(n => n.subtype === 'if-else' || n.subtype === 'decision-tree');
  
  return {
    purpose: `Agentic workflow with ${agentNodes.length} reasoning agents, ${toolNodes.length} tool agents, and ${decisionNodes.length} decision points`,
    description: `This workflow starts from ${startNodeId ? `node ${startNodeId}` : 'the designated start node'} and processes data through ${nodes.length} total nodes with ${connections.length} connections.`,
    intendedBehavior: 'The workflow simulates an intelligent agent system that can reason about inputs, access tools and knowledge bases, make decisions, and produce contextual outputs.',
    keyDecisionPoints: decisionNodes.map(n => `${n.id}: ${(n.data as any).condition || 'Decision logic'}`),
    dataFlow: `Data flows from ${startNodeId || 'start'} through ${connections.length} connections, transforming at each node according to its specific logic.`
  };
}
