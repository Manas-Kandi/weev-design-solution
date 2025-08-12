import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput } from "@/types";
import { ThinkingNodeData, ThinkingOutput, ThinkingMeta, THINKING_STYLE_PRESETS, ToolIntent } from "./types";
import { callLLM } from "@/lib/llmClient";

export class ThinkingNode extends BaseNode {
  async execute(context: NodeContext): Promise<NodeOutput> {
    const data = this.node.data as ThinkingNodeData;

    try {
      // Get style preset
      const stylePreset = THINKING_STYLE_PRESETS[data.style] || THINKING_STYLE_PRESETS.balanced;

      // Build system prompt
      const systemPrompt = data.systemPrompt || 
        "You are a careful, stepwise thinker. Break down problems methodically and provide clear reasoning for your conclusions.";

      // Merge incoming inputs into context payload
      const contextInputs = this.getInputsFromConnections(context);
      const mergedContext = this.mergeInputsToContext(contextInputs);

      // Prepare the prompt
      const userPrompt = `Context: ${JSON.stringify(mergedContext, null, 2)}

Please analyze this context and provide a thoughtful response. Think through the problem step by step.

${data.schemaHint ? `Expected output format: ${data.schemaHint}` : ''}

${data.allowToolCalls ? 'If you need to call tools, include them in your response as a "toolIntents" array with objects containing "name" and "args" properties.' : ''}`;

      // Call LLM with NVIDIA provider
      const llmResult = await callLLM(userPrompt, {
        provider: "nvidia",
        model: process.env.NEXT_PUBLIC_NVIDIA_MODEL || "openai/gpt-oss-120b",
        temperature: stylePreset.temperature,
        max_tokens: stylePreset.maxTokens,
        system: systemPrompt,
        response_format: 'json'
      });

      // Parse the response
      let parsedResponse: any;
      let validationError: string | undefined;
      
      try {
        parsedResponse = JSON.parse(llmResult.text);
      } catch (e) {
        // Fallback: treat as plain text response
        parsedResponse = {
          answer: llmResult.text,
          structured: null
        };
      }

      // Validate against schema hint if provided
      let schemaValid = true;
      if (data.schemaHint && parsedResponse) {
        try {
          // Basic validation - in a real implementation, you'd use a proper JSON schema validator
          const expectedSchema = JSON.parse(data.schemaHint);
          schemaValid = this.validateBasicSchema(parsedResponse, expectedSchema);
        } catch (e) {
          validationError = `Schema validation error: ${e instanceof Error ? e.message : String(e)}`;
          schemaValid = false;
        }
      }

      // Extract tool intents if present and allowed
      let toolIntents: ToolIntent[] | undefined;
      if (data.allowToolCalls && parsedResponse.toolIntents) {
        toolIntents = Array.isArray(parsedResponse.toolIntents) ? parsedResponse.toolIntents : [];
      }

      // Build the output
      const thinkingOutput: ThinkingOutput = {
        answer: parsedResponse.answer || llmResult.text,
        structured: parsedResponse.structured || parsedResponse
      };

      const meta: ThinkingMeta = {
        nodeType: 'thinking',
        model: process.env.NEXT_PUBLIC_NVIDIA_MODEL || "openai/gpt-oss-120b",
        tokens: llmResult.raw?.usage?.total_tokens,
        ...(toolIntents && { toolIntents }),
        ...(data.schemaHint && {
          validation: {
            schemaValid,
            ...(validationError && { error: validationError })
          }
        })
      };

      return {
        type: 'json',
        content: thinkingOutput,
        meta,
        timestamp: Date.now(),
        nodeId: this.node.id
      };

    } catch (error) {
      console.error('ThinkingNode execution error:', error);
      
      return {
        type: 'error',
        content: {
          error: error instanceof Error ? error.message : String(error),
          nodeType: 'thinking'
        },
        meta: {
          nodeType: 'thinking',
          model: process.env.NEXT_PUBLIC_NVIDIA_MODEL || "openai/gpt-oss-120b",
          validation: {
            schemaValid: false,
            error: error instanceof Error ? error.message : String(error)
          }
        },
        timestamp: Date.now(),
        nodeId: this.node.id
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

  private mergeInputsToContext(inputs: Record<string, any>): any {
    // Merge text and JSON inputs into a single context payload
    const context: any = {};
    
    for (const [key, input] of Object.entries(inputs)) {
      if (input.type === 'text') {
        context[key] = input.content;
      } else if (input.type === 'json') {
        context[key] = input.content;
      } else {
        context[key] = input;
      }
    }

    return context;
  }

  private validateBasicSchema(data: any, schema: any): boolean {
    // Basic schema validation - in a real implementation, use ajv or similar
    if (typeof schema === 'object' && schema !== null) {
      for (const key in schema) {
        if (!(key in data)) {
          return false;
        }
      }
    }
    return true;
  }

  validate(node: any): boolean {
    const data = node.data as ThinkingNodeData;
    
    // Basic validation
    if (!data.style || !['fast', 'balanced', 'deep'].includes(data.style)) {
      return false;
    }

    // Validate schema hint if provided
    if (data.schemaHint) {
      try {
        JSON.parse(data.schemaHint);
      } catch {
        return false;
      }
    }

    return true;
  }
}
