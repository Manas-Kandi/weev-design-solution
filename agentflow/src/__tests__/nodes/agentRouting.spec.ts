
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runWorkflowWithProperties } from '../../lib/workflowRunnerPropertiesDriven';
import { CanvasNode, Connection } from '@/types';

// Mock the callGemini function as it's an external dependency
vi.mock('../../lib/geminiClient', () => ({
  callGemini: vi.fn(),
}));

const { callGemini: mockCallGemini } = await import('@/lib/geminiClient');

describe('Agent Smart Routing', () => {
  let agentNode: CanvasNode;
  let calendarToolNode: CanvasNode;
  let webSearchToolNode: CanvasNode;
  let nodes: CanvasNode[];
  let connections: Connection[];

  beforeEach(() => {
    vi.clearAllMocks();

    agentNode = {
      id: 'agent-1',
      type: 'agent',
      subtype: 'generic',
      data: {
        title: 'Agent Node',
        rules: { nl: '' }, // Will be set per test
      },
      position: { x: 0, y: 0 },
      width: 100,
      height: 100,
      inputs: [],
      outputs: [{ id: 'output' }],
    };

    calendarToolNode = {
      id: 'tool-calendar',
      type: 'tool',
      subtype: 'tool',
      data: {
        title: 'Calendar Tool',
        simulation: {
          providerId: 'calendar',
          operation: 'list_events',
          mockPreset: 'list_success',
          latency: 0,
        },
      },
      position: { x: 200, y: 0 },
      width: 100,
      height: 100,
      inputs: [{ id: 'input' }],
      outputs: [{ id: 'output' }],
    };

    webSearchToolNode = {
      id: 'tool-websearch',
      type: 'tool',
      subtype: 'tool',
      data: {
        title: 'Web Search Tool',
        simulation: {
          providerId: 'web_search',
          operation: 'search',
          mockPreset: 'success',
          latency: 0,
        },
      },
      position: { x: 400, y: 0 },
      width: 100,
      height: 100,
      inputs: [{ id: 'input' }],
      outputs: [{ id: 'output' }],
    };

    nodes = [agentNode, calendarToolNode, webSearchToolNode];
    connections = [
      {
        id: 'conn-agent-calendar',
        source: 'agent-1',
        sourceHandle: 'output',
        target: 'tool-calendar',
        targetHandle: 'input',
      },
      {
        id: 'conn-agent-websearch',
        source: 'agent-1',
        sourceHandle: 'output',
        target: 'tool-websearch',
        targetHandle: 'input',
      },
    ];
  });

  // Tests for agent smart routing across multiple tools.
  it('should route to calendar tool when agent requests calendar capability', async () => {
    agentNode.data.rules.nl = "can you find 30 minutes free on my calendar?";
    mockCallGemini.mockImplementation((prompt: string) => {
      if (prompt.includes("find 30 minutes free on my calendar")) {
        return Promise.resolve(JSON.stringify({ capability: "calendar.find_free_time" }));
      }
      return Promise.resolve(null);
    });

    const result = await runWorkflowWithProperties(nodes, connections, 'agent-1');

    const toolResult = result['tool-calendar']._propertiesResult;
    expect(toolResult.trace.delegatedToTool.toolName).toBe('calendar');
    expect(toolResult.trace.delegatedToTool.operation).toBe('list_events'); // Overridden by tool node config
    expect(toolResult.executionSummary).toContain('Agent delegated request to Tool: calendar → operation: list_events');
    expect(toolResult.outputsTab.result).toEqual({ status: 'success', data: ["item1", "item2", "item3"] });
  });

  it('should route to web_search tool when agent requests web_search capability', async () => {
    agentNode.data.rules.nl = "search the web for cat pictures";
    mockCallGemini.mockImplementation((prompt: string) => {
      if (prompt.includes("search the web for cat pictures")) {
        return Promise.resolve(JSON.stringify({ capability: "web_search.search" }));
      }
      return Promise.resolve(null);
    });

    const result = await runWorkflowWithProperties(nodes, connections, 'agent-1');

    const toolResult = result['tool-websearch']._propertiesResult;
    expect(toolResult.trace.delegatedToTool.toolName).toBe('web_search');
    expect(toolResult.trace.delegatedToTool.operation).toBe('search');
    expect(toolResult.executionSummary).toContain('Agent delegated request to Tool: web_search → operation: search');
    expect(toolResult.outputsTab.result).toEqual({
      results: [
        {
          title: 'What is Artificial Intelligence?',
          url: 'https://example.com/ai-intro',
          snippet: 'Artificial Intelligence (AI) is the simulation of human intelligence in machines...'
        },
        {
          title: 'AI Applications in 2024',
          url: 'https://example.com/ai-2024',
          snippet: 'Explore the latest applications of AI technology across various industries...'
        },
        {
          title: 'Machine Learning vs AI',
          url: 'https://example.com/ml-vs-ai',
          snippet: 'Understanding the difference between Machine Learning and Artificial Intelligence...'
        }
      ],
      total: 1250000
    });
  });
});
