import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MessageNode } from '@/lib/nodes/message/MessageNode';
import { CanvasNode } from '@/types';
import { MessageNodeData } from '@/lib/nodes/message/types';
import { NodeContext } from '@/lib/nodes/base/BaseNode';
import * as llmClient from '@/lib/llmClient';

// Mock the LLM client
vi.mock('@/lib/llmClient', () => ({
  callLLM: vi.fn(),
}));

const mockCallLLM = vi.mocked(llmClient.callLLM);

describe('MessageNode', () => {
  let messageNode: MessageNode;
  let mockNode: CanvasNode;
  let mockContext: NodeContext;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockNode = {
      id: 'message-1',
      type: 'conversation',
      subtype: 'message-formatter',
      position: { x: 0, y: 0 },
      data: {
        preset: 'chat',
        tone: 'friendly',
        formatHint: 'markdown',
      } as MessageNodeData,
    };

    messageNode = new MessageNode(mockNode);

    mockContext = {
      nodes: [mockNode],
      connections: [],
      nodeOutputs: {},
      currentNode: mockNode,
      inputs: {},
      config: {},
      flowContext: {},
      mode: 'test',
      runOptions: {},
    };
  });

  describe('Basic Execution', () => {
    it('should execute successfully with default settings', async () => {
      const mockResponse = 'Hey there! Here\'s your formatted message.';
      mockCallLLM.mockResolvedValue(mockResponse);

      const result = await messageNode.execute(mockContext);

      expect(result).toEqual({
        type: 'text',
        content: 'Hey there! Here\'s your formatted message.',
        meta: {
          nodeType: 'message',
          preset: 'chat',
          tone: 'friendly',
          formatHint: 'markdown',
          audience: undefined,
        },
      });

      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('Transform the following data into a chat message'),
        expect.objectContaining({
          temperature: 0.1,
          maxTokens: 1000,
        })
      );
    });

    it('should handle empty inputs gracefully', async () => {
      const mockResponse = 'No data provided.';
      mockCallLLM.mockResolvedValue(mockResponse);

      const result = await messageNode.execute(mockContext);

      expect(result.type).toBe('text');
      expect(result.content).toBe('No data provided.');
      expect(mockCallLLM).toHaveBeenCalled();
    });
  });

  describe('Input Processing', () => {
    it('should merge multiple FlowIO inputs', async () => {
      const mockResponse = 'Combined message content.';
      mockCallLLM.mockResolvedValue(mockResponse);

      mockContext.inputs = {
        'input-1': {
          type: 'json',
          content: { data: 'value1' },
          meta: { nodeType: 'thinking' },
        },
        'input-2': {
          type: 'text',
          content: 'Additional context',
          meta: { nodeType: 'agent' },
        },
      };

      await messageNode.execute(mockContext);

      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('{"data":"value1"}'),
        expect.any(Object)
      );
      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('Additional context'),
        expect.any(Object)
      );
    });

    it('should handle non-FlowIO inputs by converting to text', async () => {
      const mockResponse = 'Converted message.';
      mockCallLLM.mockResolvedValue(mockResponse);

      mockContext.inputs = {
        'input-1': 'Simple string input',
        'input-2': { someObject: 'value' },
      };

      await messageNode.execute(mockContext);

      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('Simple string input'),
        expect.any(Object)
      );
      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('{"someObject":"value"}'),
        expect.any(Object)
      );
    });
  });

  describe('Preset Handling', () => {
    it('should use email preset correctly', async () => {
      const mockResponse = 'Subject: Important Update\n\nDear recipient,\n\nThis is your email content.';
      mockCallLLM.mockResolvedValue(mockResponse);

      mockNode.data = {
        preset: 'email',
        tone: 'formal',
        formatHint: 'plain',
        audience: 'team members',
      } as MessageNodeData;

      messageNode = new MessageNode(mockNode);
      const result = await messageNode.execute(mockContext);

      expect(result.meta.preset).toBe('email');
      expect(result.meta.tone).toBe('formal');
      expect(result.meta.audience).toBe('team members');
      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('Transform the following data into an email'),
        expect.any(Object)
      );
    });

    it('should use report preset correctly', async () => {
      const mockResponse = '# Report Summary\n\nKey findings and analysis.';
      mockCallLLM.mockResolvedValue(mockResponse);

      mockNode.data = {
        preset: 'report',
        tone: 'neutral',
        formatHint: 'markdown',
      } as MessageNodeData;

      messageNode = new MessageNode(mockNode);
      const result = await messageNode.execute(mockContext);

      expect(result.meta.preset).toBe('report');
      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('Transform the following data into a report'),
        expect.any(Object)
      );
    });

    it('should use custom template when preset is custom', async () => {
      const mockResponse = 'Custom formatted output based on template.';
      mockCallLLM.mockResolvedValue(mockResponse);

      mockNode.data = {
        preset: 'custom',
        tone: 'friendly',
        formatHint: 'html',
        customTemplate: 'Custom template: {context}',
      } as MessageNodeData;

      messageNode = new MessageNode(mockNode);
      const result = await messageNode.execute(mockContext);

      expect(result.meta.preset).toBe('custom');
      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('Custom template: {context}'),
        expect.any(Object)
      );
    });
  });

  describe('Output Cleaning', () => {
    it('should remove markdown code fences', async () => {
      const mockResponse = '```markdown\n# Clean Output\nThis should be cleaned.\n```';
      mockCallLLM.mockResolvedValue(mockResponse);

      const result = await messageNode.execute(mockContext);

      expect(result.content).toBe('# Clean Output\nThis should be cleaned.');
      expect(result.content).not.toContain('```');
    });

    it('should remove common LLM artifacts', async () => {
      const mockResponse = 'Here is your message:\n\n**Final Answer:** Clean content here.';
      mockCallLLM.mockResolvedValue(mockResponse);

      const result = await messageNode.execute(mockContext);

      expect(result.content).toBe('Clean content here.');
      expect(result.content).not.toContain('Here is your message:');
      expect(result.content).not.toContain('**Final Answer:**');
    });

    it('should trim whitespace and normalize line breaks', async () => {
      const mockResponse = '\n\n  Properly formatted content.  \n\n';
      mockCallLLM.mockResolvedValue(mockResponse);

      const result = await messageNode.execute(mockContext);

      expect(result.content).toBe('Properly formatted content.');
    });
  });

  describe('Deterministic Behavior', () => {
    it('should produce consistent output for same inputs', async () => {
      const mockResponse = 'Consistent output message.';
      mockCallLLM.mockResolvedValue(mockResponse);

      mockContext.inputs = {
        'input-1': { type: 'text', content: 'Same input', meta: {} },
      };

      const result1 = await messageNode.execute(mockContext);
      const result2 = await messageNode.execute(mockContext);

      expect(result1.content).toBe(result2.content);
      expect(result1.meta).toEqual(result2.meta);
    });

    it('should use low temperature for deterministic output', async () => {
      const mockResponse = 'Deterministic response.';
      mockCallLLM.mockResolvedValue(mockResponse);

      await messageNode.execute(mockContext);

      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          temperature: 0.1,
        })
      );
    });
  });

  describe('Format Hints', () => {
    it('should handle markdown format hint', async () => {
      const mockResponse = '# Markdown Content\n\n**Bold text** and *italic text*.';
      mockCallLLM.mockResolvedValue(mockResponse);

      mockNode.data = {
        preset: 'chat',
        tone: 'friendly',
        formatHint: 'markdown',
      } as MessageNodeData;

      messageNode = new MessageNode(mockNode);
      const result = await messageNode.execute(mockContext);

      expect(result.meta.formatHint).toBe('markdown');
      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('Format: markdown'),
        expect.any(Object)
      );
    });

    it('should handle plain text format hint', async () => {
      const mockResponse = 'Plain text without any formatting.';
      mockCallLLM.mockResolvedValue(mockResponse);

      mockNode.data = {
        preset: 'email',
        tone: 'formal',
        formatHint: 'plain',
      } as MessageNodeData;

      messageNode = new MessageNode(mockNode);
      const result = await messageNode.execute(mockContext);

      expect(result.meta.formatHint).toBe('plain');
      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('Format: plain'),
        expect.any(Object)
      );
    });

    it('should handle HTML format hint', async () => {
      const mockResponse = '<h1>HTML Content</h1><p>Formatted as HTML.</p>';
      mockCallLLM.mockResolvedValue(mockResponse);

      mockNode.data = {
        preset: 'report',
        tone: 'neutral',
        formatHint: 'html',
      } as MessageNodeData;

      messageNode = new MessageNode(mockNode);
      const result = await messageNode.execute(mockContext);

      expect(result.meta.formatHint).toBe('html');
      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('Format: html'),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle LLM call failures gracefully', async () => {
      const error = new Error('LLM service unavailable');
      mockCallLLM.mockRejectedValue(error);

      const result = await messageNode.execute(mockContext);

      expect(result.type).toBe('text');
      expect(result.content).toContain('Error formatting message');
      expect(result.meta.error).toBe('LLM service unavailable');
    });

    it('should handle missing preset gracefully', async () => {
      const mockResponse = 'Default formatted message.';
      mockCallLLM.mockResolvedValue(mockResponse);

      mockNode.data = {
        // Missing preset - should default to 'chat'
        tone: 'friendly',
        formatHint: 'markdown',
      } as MessageNodeData;

      messageNode = new MessageNode(mockNode);
      const result = await messageNode.execute(mockContext);

      expect(result.meta.preset).toBe('chat');
      expect(result.type).toBe('text');
    });
  });

  describe('Audience Handling', () => {
    it('should include audience in prompt when specified', async () => {
      const mockResponse = 'Message tailored for developers.';
      mockCallLLM.mockResolvedValue(mockResponse);

      mockNode.data = {
        preset: 'chat',
        tone: 'friendly',
        formatHint: 'markdown',
        audience: 'software developers',
      } as MessageNodeData;

      messageNode = new MessageNode(mockNode);
      await messageNode.execute(mockContext);

      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.stringContaining('Audience: software developers'),
        expect.any(Object)
      );
    });

    it('should omit audience from prompt when not specified', async () => {
      const mockResponse = 'General message.';
      mockCallLLM.mockResolvedValue(mockResponse);

      await messageNode.execute(mockContext);

      const callArgs = mockCallLLM.mock.calls[0];
      expect(callArgs[0]).not.toContain('Audience:');
    });
  });

  describe('Integration with NVIDIA GPT-OSS', () => {
    it('should use correct model parameters for NVIDIA GPT-OSS', async () => {
      const mockResponse = 'NVIDIA model response.';
      mockCallLLM.mockResolvedValue(mockResponse);

      await messageNode.execute(mockContext);

      expect(mockCallLLM).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          temperature: 0.1,
          maxTokens: 1000,
          seed: expect.any(Number),
        })
      );
    });

    it('should generate consistent seed based on inputs', async () => {
      const mockResponse = 'Seeded response.';
      mockCallLLM.mockResolvedValue(mockResponse);

      mockContext.inputs = {
        'input-1': { type: 'text', content: 'Test input', meta: {} },
      };

      await messageNode.execute(mockContext);
      const firstCall = mockCallLLM.mock.calls[0][1];

      // Reset and call again with same inputs
      vi.clearAllMocks();
      mockCallLLM.mockResolvedValue(mockResponse);
      
      await messageNode.execute(mockContext);
      const secondCall = mockCallLLM.mock.calls[0][1];

      expect(firstCall.seed).toBe(secondCall.seed);
    });
  });
});
