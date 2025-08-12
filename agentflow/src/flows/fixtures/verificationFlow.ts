/**
 * Verification Flow - Tests all five node types with multiple inputs/outputs
 */

import { FlowSpec } from '@/lib/validation/FlowSpecValidator';
import { CanvasNode, Connection } from '@/types';

export const verificationFlow: FlowSpec = {
  nodes: [
    // N1: Memory node
    {
      id: 'memory-1',
      type: 'agent',
      subtype: 'memory',
      position: { x: 100, y: 100 },
      size: { width: 200, height: 120 },
      data: {
        title: 'Memory',
        description: 'Document retrieval',
        color: '#8b5cf6',
        icon: 'HardDrive',
        indexName: 'verif-index',
        ingestMode: 'summary-only',
        retrievalTopK: 3,
        documents: [
          'Weev is a visual agentic flow builder that combines the best of Notion and Figma for AI workflow design.',
          'Pricing: Pro tier at $29/month, Team tier at $99/month. Support available via email and documentation.'
        ],
        metadata: {}
      },
      inputs: [
        { id: 'query', label: 'Query', type: 'text' }
      ],
      outputs: [
        { id: 'context', label: 'Context', type: 'json' }
      ]
    },

    // N2: Thinking node
    {
      id: 'thinking-1',
      type: 'agent',
      subtype: 'thinking',
      position: { x: 400, y: 100 },
      size: { width: 200, height: 120 },
      data: {
        title: 'Thinking',
        description: 'Intent analysis',
        color: '#8b5cf6',
        icon: 'Brain',
        systemPrompt: 'Summarize user intent and decide if we need a web search.',
        style: 'balanced',
        allowToolCalls: true,
        schemaHint: JSON.stringify({
          type: 'object',
          properties: {
            answer: { type: 'string' },
            needSearch: { type: 'boolean' },
            query: { type: 'string' }
          },
          required: ['answer', 'needSearch']
        })
      },
      inputs: [
        { id: 'context', label: 'Context', type: 'json' },
        { id: 'user-input', label: 'User Input', type: 'text' }
      ],
      outputs: [
        { id: 'result', label: 'Result', type: 'json' },
        { id: 'reasoning', label: 'Reasoning', type: 'text' }
      ]
    },

    // N3: Router node
    {
      id: 'router-1',
      type: 'agent',
      subtype: 'router',
      position: { x: 700, y: 100 },
      size: { width: 200, height: 120 },
      data: {
        title: 'Router',
        description: 'Search decision',
        color: '#f59e0b',
        icon: 'GitBranch',
        mode: 'expression',
        expression: 'inputs?.[0]?.content?.needSearch === true'
      },
      inputs: [
        { id: 'decision-input', label: 'Decision Input', type: 'json' }
      ],
      outputs: [
        { id: 'true', label: 'True', type: 'json' },
        { id: 'false', label: 'False', type: 'json' }
      ]
    },

    // N4: Tool node (web_search mock)
    {
      id: 'tool-1',
      type: 'agent',
      subtype: 'tool',
      position: { x: 1000, y: 50 },
      size: { width: 200, height: 120 },
      data: {
        title: 'Tool',
        description: 'Web search',
        color: '#10b981',
        icon: 'Wrench',
        toolName: 'web_search',
        operation: 'search',
        mode: 'mock',
        mockPreset: 'success',
        args: {
          topK: 3
        }
      },
      inputs: [
        { id: 'query', label: 'Query', type: 'json' }
      ],
      outputs: [
        { id: 'result', label: 'Result', type: 'json' }
      ]
    },

    // N5: Message node
    {
      id: 'message-1',
      type: 'agent',
      subtype: 'message-formatter',
      position: { x: 1300, y: 100 },
      size: { width: 200, height: 120 },
      data: {
        title: 'Message',
        description: 'Email formatter',
        color: '#06b6d4',
        icon: 'Mail',
        preset: 'email',
        tone: 'neutral',
        formatHint: 'markdown'
      },
      inputs: [
        { id: 'content-1', label: 'Content 1', type: 'json' },
        { id: 'content-2', label: 'Content 2', type: 'json' }
      ],
      outputs: [
        { id: 'formatted', label: 'Formatted', type: 'text' }
      ]
    }
  ],

  edges: [
    // N1 -> N2 (Memory context feeds Thinking)
    {
      id: 'edge-1',
      sourceNode: 'memory-1',
      sourceOutput: 'context',
      targetNode: 'thinking-1',
      targetInput: 'context'
    },

    // N2 -> N3 (Thinking result feeds Router)
    {
      id: 'edge-2',
      sourceNode: 'thinking-1',
      sourceOutput: 'result',
      targetNode: 'router-1',
      targetInput: 'decision-input'
    },

    // N3.true -> N4 (Router true branch to Tool)
    {
      id: 'edge-3',
      sourceNode: 'router-1',
      sourceOutput: 'true',
      targetNode: 'tool-1',
      targetInput: 'query'
    },

    // N4 -> N5 (Tool result to Message)
    {
      id: 'edge-4',
      sourceNode: 'tool-1',
      sourceOutput: 'result',
      targetNode: 'message-1',
      targetInput: 'content-1'
    },

    // N3.false -> N5 (Router false branch directly to Message)
    {
      id: 'edge-5',
      sourceNode: 'router-1',
      sourceOutput: 'false',
      targetNode: 'message-1',
      targetInput: 'content-2'
    }
  ],

  meta: {
    name: 'Verification Flow',
    description: 'Tests all five node types with multiple inputs/outputs and branching',
    version: '1.0.0'
  }
};

// Test input scenario
export const verificationInput = {
  query: 'Draft a short welcome email about Weev and search the latest mention of Weev if needed.',
  userInput: 'I need help creating a welcome email for new users about our Weev platform. Please include recent information if available.'
};
