import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutputObject } from "@/types";
import { MessageNodeData } from "./types";
import { getPresetTemplate } from "./presets";
// LLM logic removed

export class MessageNode extends BaseNode {
  async execute(context: NodeContext): Promise<NodeOutputObject> {
    try {
      const data = this.node.data as MessageNodeData;
      
      // Provide defaults for missing values
      const preset = data.preset || 'chat';
      const tone = data.tone || 'friendly';
      const formatHint = data.formatHint || 'markdown';
      const audience = data.audience;
      
      // Get inputs from connections or use context inputs
      const inputs = context.inputs || this.getInputsFromConnections(context);
      
      // Merge all inputs into a single context
      const mergedContext = this.mergeInputs(inputs);
      
      // Build prompt using preset and configuration
      const prompt = this.buildPrompt(preset, tone, formatHint, audience, data.customTemplate, mergedContext);
      
      // LLM disabled; return prompt merged context directly
      const cleanedContent = this.cleanOutput(mergedContext, formatHint);

      // Return NodeOutput compatible format
      return {
        type: 'text',
        content: cleanedContent,
        meta: {
          nodeType: 'message',
          preset,
          tone,
          formatHint,
          ...(audience && { audience }),
          model: 'disabled',
          tokens: 0
        }
      };

    } catch (error) {
      console.error('MessageNode execution error:', error);
      // Re-read node data safely (avoid referencing out-of-scope 'data')
      const safe = (this.node.data as Partial<MessageNodeData>) || {};
      return {
        type: 'text',
        content: `Error formatting message: ${error instanceof Error ? error.message : String(error)}`,
        meta: {
          nodeType: 'message',
          preset: safe.preset || 'chat',
          tone: safe.tone || 'friendly',
          formatHint: safe.formatHint || 'markdown',
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  private getInputsFromConnections(context: NodeContext): Record<string, any> {
    const inputs: Record<string, any> = {};
    
    // Get all connections targeting this node
    const incomingConnections = context.connections.filter(
      conn => conn.targetNode === this.node.id
    );

    // Collect outputs from connected nodes
    for (const connection of incomingConnections) {
      const sourceOutput = context.nodeOutputs[connection.sourceNode];
      if (sourceOutput) {
        inputs[connection.targetInput || 'input'] = sourceOutput;
      }
    }

    return inputs;
  }

  private mergeInputs(inputs: Record<string, any>): string {
    const contextParts: string[] = [];
    
    for (const [key, value] of Object.entries(inputs)) {
      if (value && typeof value === 'object' && 'type' in value && 'content' in value) {
        // FlowIO format
        if (value.type === 'json') {
          contextParts.push(JSON.stringify(value.content, null, 2));
        } else {
          contextParts.push(String(value.content));
        }
      } else if (typeof value === 'string') {
        contextParts.push(value);
      } else if (typeof value === 'object') {
        contextParts.push(JSON.stringify(value, null, 2));
      } else {
        contextParts.push(String(value));
      }
    }
    
    return contextParts.join('\n\n');
  }

  private buildPrompt(
    preset: string,
    tone: string,
    formatHint: string,
    audience: string | undefined,
    customTemplate: string | undefined,
    context: string
  ): string {
    // Get the appropriate template
    const template = getPresetTemplate(preset, customTemplate);
    
    // Build the prompt by replacing template variables
    let prompt = template
      .replace(/{context}/g, context || '{}')
      .replace(/{tone}/g, tone)
      .replace(/{formatHint}/g, formatHint);

    // Add audience if provided
    if (audience) {
      prompt = prompt.replace(/{audience}/g, audience);
      prompt = prompt.replace(/\{audience\s*\?\s*'[^']*'\s*:\s*'[^']*'\}/g, `Audience: ${audience}`);
    } else {
      // Remove audience placeholders if no audience specified
      prompt = prompt.replace(/\{audience\s*\?\s*'[^']*'\s*:\s*'[^']*'\}/g, '');
    }

    // Add format hint to prompt for test compatibility
    prompt += `\n\nFormat: ${formatHint}`;

    return prompt;
  }

  private generateDeterministicSeed(
    context: string,
    preset: string,
    tone: string,
    formatHint: string,
    audience?: string
  ): number {
    // Create a hash-like seed from inputs for deterministic output
    const seedString = `${context}${preset}${tone}${formatHint}${audience || ''}`;
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
      const char = seedString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private cleanOutput(text: string, formatHint: string): string {
    if (!text) return '';
    
    let cleaned = text.trim();
    
    // Remove markdown code fences
    cleaned = cleaned.replace(/^```(?:markdown|html|plain)?\s*\n?/i, '');
    cleaned = cleaned.replace(/\n?```\s*$/i, '');
    
    // Remove common LLM artifacts
    cleaned = cleaned.replace(/^Here is your message:\s*\n*/i, '');
    cleaned = cleaned.replace(/^\*\*Final Answer:\*\*\s*/i, '');
    cleaned = cleaned.replace(/^Final Answer:\s*/i, '');
    
    // Normalize whitespace
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    cleaned = cleaned.trim();
    
    return cleaned;
  }
}
