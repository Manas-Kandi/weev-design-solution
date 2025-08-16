
import { describe, it, expect, vi } from 'vitest';
import { runWorkflowWithProperties } from '../../lib/workflowRunnerPropertiesDriven';
import { CanvasNode, Connection } from '@/types'; // Assuming '@/types' is correctly aliased

// Mock the callGemini function as it's an external dependency
vi.mock('../../lib/geminiClient', () => ({
  callGemini: vi.fn((prompt: string) => {
    // Simulate Agent's tool_call output
    if (prompt.includes("calendar") && prompt.includes("find time")) {
      return Promise.resolve(JSON.stringify({
        tool_call: {
          tool_name: "calendar",
          operation: "find_free_time", // Agent's invented operation
          args: { duration: 30 }
        }
      }));
    }
    return Promise.resolve("Mock LLM response");
  }),
}));

describe('Agent and Tool Node Interaction', () => {
  it('should override agent's invented operation with tool node's configured operation and return mock preset', async () => {
    const agentNode: CanvasNode = {
      id: 'agent-1',
      type: 'agent',
      subtype: 'generic',
      data: {
        title: 'Agent Node',
        rules: { nl: 'can you find time of 30 mins on my calendar?' },
      },
      position: { x: 0, y: 0 },
      width: 100,
      height: 100,
      inputs: [],
      outputs: [{ id: 'output' }],
    };

    const toolNode: CanvasNode = {
      id: 'tool-1',
      type: 'tool',
      subtype: 'tool',
      data: {
        title: 'Calendar Tool',
        simulation: {
          providerId: 'calendar',
          operation: 'list_events', // Configured operation
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

    const connection: Connection = {
      id: 'conn-1',
      source: 'agent-1',
      sourceHandle: 'output',
      target: 'tool-1',
      targetHandle: 'input',
    };

    const nodes = [agentNode, toolNode];
    const connections = [connection];

    const result = await runWorkflowWithProperties(nodes, connections, 'agent-1');

    // Find the result for the tool node
    const toolNodeResult = result['tool-1']._propertiesResult;

    // Confirm the Testing Panel shows:
    // - Summary: "Agent delegated to Calendar Tool → operation: list_events → returned mock preset: list_success."
    expect(toolNodeResult.executionSummary).toContain("Executed calendar with configured operation 'list_events' using mock preset 'list_success'.");

    // - Inputs: tool properties (operation, latency, preset).
    const inputs = toolNodeResult.inputsTab.properties;
    expect(inputs).toContainEqual(expect.objectContaining({ key: 'operation', value: 'list_events', configured: true }));
    expect(inputs).toContainEqual(expect.objectContaining({ key: 'latency', value: 0, configured: true }));
    expect(inputs).toContainEqual(expect.objectContaining({ key: 'mockPreset', value: 'list_success', configured: true }));

    // - Outputs: the mock preset result.
    expect(toolNodeResult.outputsTab.result).toEqual({ status: 'success', data: ["item1", "item2", "item3"] });
    expect(toolNodeResult.outputsTab.resultType).toBe('mock');
  });
});
