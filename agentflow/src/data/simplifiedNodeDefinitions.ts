// Simplified node definitions for minimal Components panel
import { NodeCategory, NodeType } from "@/types";
import { User, Wrench, GitBranch, Database, FileText, MessageSquare, Brain } from "lucide-react";
import { theme } from "@/data/theme";

export const colors = theme;

// Map old node types to new simplified types for backward compatibility
export const nodeTypeMapping: Record<string, string> = {
  // Agent mappings
  'agent': 'agent',
  'human-handoff': 'agent',
  
  // Tool mappings
  'tool-agent': 'tool',
  
  // Router mappings
  'if-else': 'router',
  'decision-tree': 'router',
  'state-machine': 'router',
  'conversation-flow': 'router',
  
  // Memory mappings
  'knowledge-base': 'memory',
  
  // Template mappings
  'prompt-template': 'template',
  
  // Message mappings
  'message': 'message',
  
  // Hidden nodes (testing and UI)
  'simulator': 'hidden',
  'test-case': 'hidden',
  'dashboard': 'hidden',
  'chat-interface': 'hidden',
};

export const simplifiedNodeCategories: NodeCategory[] = [
  {
    id: 'components',
    name: 'Components',
    type: 'ui',
    nodes: [
      {
        id: 'brain',
        name: 'Brain',
        icon: Brain,
        color: '#8b5cf6',
        description: 'Reasoning or decision component',
        type: 'ui',
        subtype: 'brain',
        defaultInputs: [],
        defaultOutputs: [],
      },
      {
        id: 'external-apps',
        name: 'External Apps',
        icon: Wrench,
        color: '#ff9f0a',
        description: 'Integrations and external services',
        type: 'ui',
        subtype: 'external-apps',
        defaultInputs: [
          { id: 'in', label: 'Input', type: 'any' },
        ],
        defaultOutputs: [
          { id: 'out', label: 'Output', type: 'any' },
        ],
      },
      {
        id: 'input',
        name: 'Input',
        icon: FileText,
        color: '#34c759',
        description: 'User or data input source',
        type: 'ui',
        subtype: 'input',
        defaultInputs: [],
        defaultOutputs: [],
      },
      {
        id: 'output',
        name: 'Output',
        icon: MessageSquare,
        color: '#00c4ff',
        description: 'Display or deliver results',
        type: 'ui',
        subtype: 'output',
        defaultInputs: [],
        defaultOutputs: [],
      },
      {
        id: 'knowledge-base',
        name: 'Knowledge Base',
        icon: Database,
        color: '#ff2d92',
        description: 'Reference and context data',
        type: 'ui',
        subtype: 'knowledge-base',
        defaultInputs: [],
        defaultOutputs: [],
      },
    ],
  },
];

// Function to get simplified node type from original type
export function getSimplifiedNodeType(originalType: string): NodeType | null {
  const mappedType = nodeTypeMapping[originalType];
  if (!mappedType || mappedType === 'hidden') {
    return null;
  }
  
  for (const category of simplifiedNodeCategories) {
    for (const node of category.nodes) {
      if (node.id === mappedType) {
        return node;
      }
    }
  }
  return null;
}

// Function to check if a node type should be visible
export function isNodeTypeVisible(nodeId: string): boolean {
  return nodeTypeMapping[nodeId] !== 'hidden';
}
