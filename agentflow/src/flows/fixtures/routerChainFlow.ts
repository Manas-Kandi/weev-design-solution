/**
 * Router Chain Flow - Tests unbounded chaining with 24 Router nodes
 */

import { FlowSpec } from '@/lib/validation/FlowSpecValidator';
import { CanvasNode, Connection } from '@/types';

// Generate 24 router nodes in a chain
const generateRouterChain = (): { nodes: CanvasNode[], edges: Connection[] } => {
  const nodes: CanvasNode[] = [];
  const edges: Connection[] = [];

  // Create 24 router nodes
  for (let i = 1; i <= 24; i++) {
    nodes.push({
      id: `router-${i}`,
      type: 'agent',
      subtype: 'router',
      position: { x: 100 + (i - 1) * 250, y: 100 },
      size: { width: 200, height: 120 },
      data: {
        title: `Router ${i}`,
        description: `Router node ${i}`,
        color: '#f59e0b',
        icon: 'GitBranch',
        mode: 'expression',
        expression: 'true' // Always evaluates to true for chaining
      },
      inputs: [
        { id: 'input', label: 'Input', type: 'json' }
      ],
      outputs: [
        { id: 'true', label: 'True', type: 'json' },
        { id: 'false', label: 'False', type: 'json' }
      ]
    });

    // Create edge from previous router (except for first router)
    if (i > 1) {
      edges.push({
        id: `edge-${i - 1}`,
        sourceNode: `router-${i - 1}`,
        sourceOutput: 'true',
        targetNode: `router-${i}`,
        targetInput: 'input'
      });
    }
  }

  // Add final message node
  nodes.push({
    id: 'message-final',
    type: 'agent',
    subtype: 'message-formatter',
    position: { x: 100 + 24 * 250, y: 100 },
    size: { width: 200, height: 120 },
    data: {
      title: 'Final Message',
      description: 'Chain completion',
      color: '#06b6d4',
      icon: 'Mail',
      preset: 'chat',
      tone: 'neutral',
      formatHint: 'markdown'
    },
    inputs: [
      { id: 'content', label: 'Content', type: 'json' }
    ],
    outputs: [
      { id: 'formatted', label: 'Formatted', type: 'text' }
    ]
  });

  // Connect last router to final message
  edges.push({
    id: 'edge-final',
    sourceNode: 'router-24',
    sourceOutput: 'true',
    targetNode: 'message-final',
    targetInput: 'content'
  });

  return { nodes, edges };
};

const { nodes, edges } = generateRouterChain();

export const routerChainFlow: FlowSpec = {
  nodes,
  edges,
  meta: {
    name: 'Router Chain Flow',
    description: 'Tests unbounded chaining with 24 Router nodes',
    version: '1.0.0'
  }
};

// Test input for the chain
export const routerChainInput = {
  input: {
    type: 'json',
    content: { message: 'Testing router chain performance', timestamp: Date.now() },
    meta: { nodeId: 'start', test: 'router-chain' }
  }
};
