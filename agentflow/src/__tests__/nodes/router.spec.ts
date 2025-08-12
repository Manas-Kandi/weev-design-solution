import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RouterNode } from '@/lib/nodes/router/Executor';
import { RouterNodeData } from '@/lib/nodes/router/types';
import { NodeContext } from '@/lib/nodes/base/BaseNode';
import { CanvasNode, Connection, NodeOutput } from '@/types';

// Mock the LLM client
vi.mock('@/lib/llmClient', () => ({
  callLLM: vi.fn()
}));

import { callLLM } from '@/lib/llmClient';

describe('RouterNode', () => {
  let routerNode: RouterNode;
  let mockNode: CanvasNode;
  let mockContext: NodeContext;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockNode = {
      id: 'router-1',
      type: 'logic',
      subtype: 'router',
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      data: {
        mode: 'expression',
        expression: 'inputs[0]?.content?.score > 0.5',
        llmRule: 'Return true if positive sentiment, false otherwise'
      } as RouterNodeData,
      inputs: [{ id: 'input', label: 'Input', type: 'any' }],
      outputs: [
        { id: 'true', label: 'True', type: 'any' },
        { id: 'false', label: 'False', type: 'any' }
      ]
    };

    mockContext = {
      nodes: [mockNode],
      connections: [],
      nodeOutputs: {},
      currentNode: mockNode,
      inputs: {},
      config: {},
      flowContext: {},
      mode: 'test',
      runOptions: {}
    };

    routerNode = new RouterNode(mockNode);
  });

  describe('Expression Mode', () => {
    it('should evaluate simple expression and return true', async () => {
      const inputs = {
        input: {
          type: 'json',
          content: { score: 0.8 }
        }
      };

      mockContext.inputs = inputs;
      mockNode.data = {
        mode: 'expression',
        expression: 'inputs[0]?.content?.score > 0.5'
      };

      const result = await routerNode.execute(mockContext);

      expect(result.type).toBe('json');
      expect(result.content).toEqual({ decision: true });
      expect(result.meta.nodeType).toBe('router');
      expect(result.meta.mode).toBe('expression');
    });

    it('should evaluate simple expression and return false', async () => {
      const inputs = {
        input: {
          type: 'json',
          content: { score: 0.3 }
        }
      };

      mockContext.inputs = inputs;
      mockNode.data = {
        mode: 'expression',
        expression: 'inputs[0]?.content?.score > 0.5'
      };

      const result = await routerNode.execute(mockContext);

      expect(result.type).toBe('json');
      expect(result.content).toEqual({ decision: false });
      expect(result.meta.nodeType).toBe('router');
      expect(result.meta.mode).toBe('expression');
    });

    it('should handle complex expressions with multiple inputs', async () => {
      const inputs = {
        input1: { type: 'json', content: { count: 5 } },
        input2: { type: 'json', content: { threshold: 3 } }
      };

      mockContext.inputs = inputs;
      mockNode.data = {
        mode: 'expression',
        expression: 'Object.values(inputs).length > 1 && inputs.input1?.content?.count > inputs.input2?.content?.threshold'
      };

      const result = await routerNode.execute(mockContext);

      expect(result.content).toEqual({ decision: true });
    });

    it('should handle expression errors gracefully', async () => {
      const inputs = {
        input: { type: 'json', content: { score: 0.8 } }
      };

      mockContext.inputs = inputs;
      mockNode.data = {
        mode: 'expression',
        expression: 'invalid.syntax.here'
      };

      const result = await routerNode.execute(mockContext);

      expect(result.content).toEqual({ decision: false });
      expect(result.meta.error).toBeDefined();
    });

    it('should reject unsafe expressions', async () => {
      const inputs = {
        input: { type: 'json', content: { score: 0.8 } }
      };

      mockContext.inputs = inputs;
      mockNode.data = {
        mode: 'expression',
        expression: 'eval("malicious code")'
      };

      const result = await routerNode.execute(mockContext);

      expect(result.content).toEqual({ decision: false });
      expect(result.meta.error).toContain('unsafe code');
    });

    it('should provide safe sandbox utilities', async () => {
      const inputs = {
        input: { type: 'json', content: { values: [1, 2, 3, 4, 5] } }
      };

      mockContext.inputs = inputs;
      mockNode.data = {
        mode: 'expression',
        expression: 'Math.max(...inputs.input?.content?.values) > 3'
      };

      const result = await routerNode.execute(mockContext);

      expect(result.content).toEqual({ decision: true });
    });
  });

  describe('LLM Mode', () => {
    beforeEach(() => {
      mockNode.data = {
        mode: 'llm',
        llmRule: 'Return true if the sentiment is positive, false otherwise'
      };
    });

    it('should call LLM and return true for "true" response', async () => {
      const mockLLMResult = {
        text: 'true',
        raw: { usage: { total_tokens: 10 } }
      };
      (callLLM as any).mockResolvedValue(mockLLMResult);

      const inputs = {
        input: { type: 'text', content: 'I love this product!' }
      };

      mockContext.inputs = inputs;

      const result = await routerNode.execute(mockContext);

      expect(callLLM).toHaveBeenCalledWith(
        expect.stringContaining('I love this product!'),
        expect.objectContaining({
          provider: 'nvidia',
          temperature: 0.1,
          max_tokens: 10,
          system: expect.stringContaining('Return true if the sentiment is positive')
        })
      );

      expect(result.content).toEqual({ decision: true });
      expect(result.meta.llmResponse).toBe('true');
    });

    it('should call LLM and return false for "false" response', async () => {
      const mockLLMResult = {
        text: 'false',
        raw: { usage: { total_tokens: 8 } }
      };
      (callLLM as any).mockResolvedValue(mockLLMResult);

      const inputs = {
        input: { type: 'text', content: 'I hate this product!' }
      };

      mockContext.inputs = inputs;

      const result = await routerNode.execute(mockContext);

      expect(result.content).toEqual({ decision: false });
      expect(result.meta.llmResponse).toBe('false');
    });

    it('should handle ambiguous LLM responses', async () => {
      const mockLLMResult = {
        text: 'The sentiment seems somewhat positive, so I would say true.',
        raw: { usage: { total_tokens: 15 } }
      };
      (callLLM as any).mockResolvedValue(mockLLMResult);

      const inputs = {
        input: { type: 'text', content: 'This is okay I guess' }
      };

      mockContext.inputs = inputs;

      const result = await routerNode.execute(mockContext);

      expect(result.content).toEqual({ decision: true });
      expect(result.meta.llmResponse).toContain('positive');
    });

    it('should default to false for unclear responses', async () => {
      const mockLLMResult = {
        text: 'I am not sure about this',
        raw: { usage: { total_tokens: 12 } }
      };
      (callLLM as any).mockResolvedValue(mockLLMResult);

      const inputs = {
        input: { type: 'text', content: 'Neutral statement' }
      };

      mockContext.inputs = inputs;

      const result = await routerNode.execute(mockContext);

      expect(result.content).toEqual({ decision: false });
    });

    it('should handle LLM errors gracefully', async () => {
      (callLLM as any).mockRejectedValue(new Error('LLM service unavailable'));

      const inputs = {
        input: { type: 'text', content: 'Test input' }
      };

      mockContext.inputs = inputs;

      const result = await routerNode.execute(mockContext);

      expect(result.content).toEqual({ decision: false });
      expect(result.meta.error).toContain('LLM service unavailable');
    });
  });

  describe('Input Handling', () => {
    it('should handle empty inputs', async () => {
      mockContext.inputs = {};
      mockNode.data = {
        mode: 'expression',
        expression: 'Object.keys(inputs).length === 0'
      };

      const result = await routerNode.execute(mockContext);

      expect(result.content).toEqual({ decision: true });
    });

    it('should handle mixed input types', async () => {
      const inputs = {
        text: { type: 'text', content: 'Hello' },
        json: { type: 'json', content: { value: 42 } },
        primitive: 'raw string'
      };

      mockContext.inputs = inputs;
      mockNode.data = {
        mode: 'expression',
        expression: 'inputs.text?.content === "Hello" && inputs.json?.content?.value === 42'
      };

      const result = await routerNode.execute(mockContext);

      expect(result.content).toEqual({ decision: true });
    });

    it('should get inputs from connections when context.inputs is not provided', async () => {
      const sourceNode = {
        id: 'source-1',
        type: 'agent',
        position: { x: 0, y: 0 },
        size: { width: 200, height: 100 },
        data: {},
        inputs: [],
        outputs: [{ id: 'output', label: 'Output', type: 'text' }]
      };

      const connection: Connection = {
        id: 'conn-1',
        sourceNode: 'source-1',
        sourceOutput: 'output',
        targetNode: 'router-1',
        targetInput: 'input'
      };

      mockContext.nodes = [sourceNode, mockNode];
      mockContext.connections = [connection];
      mockContext.nodeOutputs = {
        'source-1': { type: 'text', content: 'Connected input', meta: {} }
      };
      mockContext.inputs = undefined;

      mockNode.data = {
        mode: 'expression',
        expression: 'inputs.input?.content === "Connected input"'
      };

      const result = await routerNode.execute(mockContext);

      expect(result.content).toEqual({ decision: true });
    });
  });

  describe('Deterministic Behavior', () => {
    it('should produce consistent results for same inputs in expression mode', async () => {
      const inputs = {
        input: { type: 'json', content: { score: 0.7 } }
      };

      mockContext.inputs = inputs;
      mockNode.data = {
        mode: 'expression',
        expression: 'inputs.input?.content?.score > 0.5'
      };

      const result1 = await routerNode.execute(mockContext);
      const result2 = await routerNode.execute(mockContext);

      expect(result1.content).toEqual(result2.content);
      expect(result1.meta.mode).toEqual(result2.meta.mode);
    });

    it('should produce consistent results for same inputs in LLM mode', async () => {
      const mockLLMResult = {
        text: 'true',
        raw: { usage: { total_tokens: 5 } }
      };
      (callLLM as any).mockResolvedValue(mockLLMResult);

      const inputs = {
        input: { type: 'text', content: 'Consistent input' }
      };

      mockContext.inputs = inputs;

      const result1 = await routerNode.execute(mockContext);
      const result2 = await routerNode.execute(mockContext);

      expect(result1.content).toEqual(result2.content);
      expect(result1.meta.llmResponse).toEqual(result2.meta.llmResponse);
    });
  });

  describe('Default Values', () => {
    it('should use default mode when not specified', async () => {
      mockNode.data = {};
      mockContext.inputs = {};

      const result = await routerNode.execute(mockContext);

      expect(result.meta.mode).toBe('expression');
      expect(result.content).toEqual({ decision: false }); // Default expression is 'false'
    });

    it('should use default expression when not specified', async () => {
      mockNode.data = { mode: 'expression' };
      mockContext.inputs = {};

      const result = await routerNode.execute(mockContext);

      expect(result.content).toEqual({ decision: false });
    });

    it('should use default LLM rule when not specified', async () => {
      const mockLLMResult = {
        text: 'false',
        raw: { usage: { total_tokens: 3 } }
      };
      (callLLM as any).mockResolvedValue(mockLLMResult);

      mockNode.data = { mode: 'llm' };
      mockContext.inputs = { input: { type: 'text', content: 'test' } };

      const result = await routerNode.execute(mockContext);

      expect(callLLM).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          system: expect.stringContaining('Return true or false based on the input')
        })
      );
      expect(result.content).toEqual({ decision: false });
    });
  });
});
