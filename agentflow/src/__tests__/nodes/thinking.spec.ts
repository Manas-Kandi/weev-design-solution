import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThinkingNode } from '@/lib/nodes/thinking/ThinkingNode';
import { ThinkingNodeData, THINKING_STYLE_PRESETS } from '@/lib/nodes/thinking/types';
import { CanvasNode } from '@/types';
import { NodeContext } from '@/lib/nodes/base/BaseNode';

// Mock the LLM client
vi.mock('@/lib/llmClient', () => ({
  callLLM: vi.fn(),
}));

const { callLLM: mockCallLLM } = await import('@/lib/llmClient');

describe('ThinkingNode', () => {
  let mockNode: CanvasNode;
  let mockContext: NodeContext;
  let thinkingNode: ThinkingNode;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock node with ThinkingNodeData
    mockNode = {
      id: 'thinking-1',
      type: 'agent',
      subtype: 'thinking',
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      data: {
        title: 'Test Thinking Node',
        description: 'A test thinking node',
        color: '#8b5cf6',
        icon: 'Brain',
        systemPrompt: 'You are a careful, stepwise thinker.',
        style: 'balanced',
        allowToolCalls: true,
      } as ThinkingNodeData,
      inputs: [
        { id: 'context', label: 'Context', type: 'text' },
        { id: 'data', label: 'Data', type: 'json' },
      ],
      outputs: [
        { id: 'result', label: 'Result', type: 'json' },
        { id: 'reasoning', label: 'Reasoning', type: 'text' },
      ],
    };

    // Create mock context
    mockContext = {
      nodes: [mockNode],
      connections: [],
      nodeOutputs: {},
      currentNode: mockNode,
    };

    thinkingNode = new ThinkingNode(mockNode);
  });

  describe('Style Presets', () => {
    it('should have correct style presets', () => {
      expect(THINKING_STYLE_PRESETS.fast).toEqual({
        temperature: 0.3,
        maxTokens: 1000,
      });
      expect(THINKING_STYLE_PRESETS.balanced).toEqual({
        temperature: 0.7,
        maxTokens: 2000,
      });
      expect(THINKING_STYLE_PRESETS.deep).toEqual({
        temperature: 0.9,
        maxTokens: 4000,
      });
    });
  });

  describe('Node Validation', () => {
    it('should validate a valid thinking node', () => {
      expect(thinkingNode.validate(mockNode)).toBe(true);
    });

    it('should reject invalid style', () => {
      const invalidNode = {
        ...mockNode,
        data: {
          ...mockNode.data,
          style: 'invalid-style',
        },
      };
      expect(thinkingNode.validate(invalidNode)).toBe(false);
    });

    it('should reject invalid schema hint', () => {
      const invalidNode = {
        ...mockNode,
        data: {
          ...mockNode.data,
          schemaHint: 'invalid json',
        },
      };
      expect(thinkingNode.validate(invalidNode)).toBe(false);
    });

    it('should accept valid schema hint', () => {
      const validNode = {
        ...mockNode,
        data: {
          ...mockNode.data,
          schemaHint: '{"answer": "string", "confidence": "number"}',
        },
      };
      expect(thinkingNode.validate(validNode)).toBe(true);
    });
  });

  describe('Node Execution', () => {
    it('should execute successfully with basic input', async () => {
      // Mock LLM response
      mockCallLLM.mockResolvedValue({
        text: '{"answer": "Test response", "reasoning": "Step by step analysis"}',
        raw: { usage: { total_tokens: 150 } },
      });

      const result = await thinkingNode.execute(mockContext);

      expect(result.type).toBe('json');
      expect(result.content).toEqual({
        answer: 'Test response',
        structured: {
          answer: 'Test response',
          reasoning: 'Step by step analysis',
        },
      });
      expect(result.meta.nodeType).toBe('thinking');
      expect(result.meta.tokens).toBe(150);
    });

    it('should handle tool calls when allowed', async () => {
      // Mock LLM response with tool intents
      mockCallLLM.mockResolvedValue({
        text: '{"answer": "I need to search for information", "toolIntents": [{"name": "web_search", "args": {"query": "test query"}}]}',
        raw: { usage: { total_tokens: 200 } },
      });

      const result = await thinkingNode.execute(mockContext);

      expect(result.type).toBe('json');
      expect(result.meta.toolIntents).toEqual([
        { name: 'web_search', args: { query: 'test query' } },
      ]);
    });

    it('should not include tool intents when not allowed', async () => {
      // Update node to disallow tool calls
      const nodeData = mockNode.data as ThinkingNodeData;
      nodeData.allowToolCalls = false;

      mockCallLLM.mockResolvedValue({
        text: '{"answer": "Response without tools", "toolIntents": [{"name": "web_search", "args": {}}]}',
        raw: { usage: { total_tokens: 100 } },
      });

      const result = await thinkingNode.execute(mockContext);

      expect(result.meta.toolIntents).toBeUndefined();
    });

    it('should validate against schema hint', async () => {
      // Add schema hint to node
      const nodeData = mockNode.data as ThinkingNodeData;
      nodeData.schemaHint = '{"answer": "string", "confidence": "number"}';

      mockCallLLM.mockResolvedValue({
        text: '{"answer": "Test response", "confidence": 0.8}',
        raw: { usage: { total_tokens: 120 } },
      });

      const result = await thinkingNode.execute(mockContext);

      expect(result.meta.validation?.schemaValid).toBe(true);
      expect(result.meta.validation?.error).toBeUndefined();
    });

    it('should handle schema validation errors', async () => {
      // Add schema hint to node
      const nodeData = mockNode.data as ThinkingNodeData;
      nodeData.schemaHint = 'invalid json schema';

      mockCallLLM.mockResolvedValue({
        text: '{"answer": "Test response"}',
        raw: { usage: { total_tokens: 100 } },
      });

      const result = await thinkingNode.execute(mockContext);

      expect(result.meta.validation?.schemaValid).toBe(false);
      expect(result.meta.validation?.error).toContain('Schema validation error');
    });

    it('should handle LLM errors gracefully', async () => {
      mockCallLLM.mockRejectedValue(new Error('LLM service unavailable'));

      const result = await thinkingNode.execute(mockContext);

      expect(result.type).toBe('error');
      expect(result.content.error).toBe('LLM service unavailable');
      expect(result.meta.validation?.schemaValid).toBe(false);
    });

    it('should handle invalid JSON responses', async () => {
      mockCallLLM.mockResolvedValue({
        text: 'This is not valid JSON',
        raw: { usage: { total_tokens: 50 } },
      });

      const result = await thinkingNode.execute(mockContext);

      expect(result.type).toBe('json');
      expect(result.content.answer).toBe('This is not valid JSON');
      expect(result.content.structured).toBe(null);
    });

    it('should use correct style presets', async () => {
      // Test fast style
      const nodeData = mockNode.data as ThinkingNodeData;
      nodeData.style = 'fast';

      mockCallLLM.mockResolvedValue({
        text: '{"answer": "Fast response"}',
        raw: { usage: { total_tokens: 75 } },
      });

      await thinkingNode.execute(mockContext);

      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          temperature: 0.3,
          max_tokens: 1000,
        })
      );
    });

    it('should merge inputs from connections', async () => {
      // Add connections and node outputs to context
      mockContext.connections = [
        {
          id: 'conn-1',
          sourceNode: 'source-1',
          sourceOutput: 'output-1',
          targetNode: 'thinking-1',
          targetInput: 'context',
        },
      ];
      mockContext.nodeOutputs = {
        'source-1': {
          type: 'text',
          content: 'Input from previous node',
          timestamp: Date.now(),
          nodeId: 'source-1',
        },
      };

      mockCallLLM.mockResolvedValue({
        text: '{"answer": "Processed input"}',
        raw: { usage: { total_tokens: 100 } },
      });

      await thinkingNode.execute(mockContext);

      // Verify that the LLM was called with the merged context
      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('Input from previous node'),
        expect.any(Object)
      );
    });
  });

  describe('FlowIO Output', () => {
    it('should emit valid FlowIO format', async () => {
      mockCallLLM.mockResolvedValue({
        text: '{"answer": "Test response"}',
        raw: { usage: { total_tokens: 100 } },
      });

      const result = await thinkingNode.execute(mockContext);

      // Verify FlowIO structure
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('meta');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('nodeId');
      
      expect(result.meta.nodeType).toBe('thinking');
      expect(typeof result.timestamp).toBe('number');
      expect(result.nodeId).toBe('thinking-1');
    });
  });

  describe('Node Chaining', () => {
    it('should support chaining multiple thinking nodes', async () => {
      // Create a second thinking node
      const secondNode: CanvasNode = {
        ...mockNode,
        id: 'thinking-2',
      };

      // Set up connection from first to second node
      mockContext.connections = [
        {
          id: 'conn-1',
          sourceNode: 'thinking-1',
          sourceOutput: 'result',
          targetNode: 'thinking-2',
          targetInput: 'context',
        },
      ];

      // Mock first node output
      mockContext.nodeOutputs = {
        'thinking-1': {
          type: 'json',
          content: {
            answer: 'First node result',
            structured: { analysis: 'Initial analysis' },
          },
          meta: { nodeType: 'thinking' },
          timestamp: Date.now(),
          nodeId: 'thinking-1',
        },
      };

      mockCallLLM.mockResolvedValue({
        text: '{"answer": "Second node result based on first"}',
        raw: { usage: { total_tokens: 150 } },
      });

      const secondThinkingNode = new ThinkingNode(secondNode);
      const result = await secondThinkingNode.execute({
        ...mockContext,
        currentNode: secondNode,
      });

      expect(result.type).toBe('json');
      expect(result.content.answer).toBe('Second node result based on first');
      
      // Verify that the second node received input from the first
      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('First node result'),
        expect.any(Object)
      );
    });
  });
});
