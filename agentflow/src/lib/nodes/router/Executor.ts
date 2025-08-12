import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput } from "@/types";
import { RouterNodeData, RouterNodeOutput } from "./types";
import { callLLM } from "@/lib/llmClient";

export class RouterNode extends BaseNode {
  async execute(context: NodeContext): Promise<NodeOutput> {
    try {
      const data = this.node.data as RouterNodeData;
      
      // Provide defaults
      const mode = data.mode || 'expression';
      
      // Get inputs from connections or use context inputs
      const inputs = context.inputs || this.getInputsFromConnections(context);
      
      let decision = false;
      let evaluationResult: any;
      let llmResponse: string | undefined;
      let error: string | undefined;

      if (mode === 'expression') {
        // Expression-based evaluation
        const expression = data.expression || 'false';
        try {
          decision = this.evaluateExpression(expression, inputs);
          evaluationResult = decision;
        } catch (err) {
          console.error('Router expression evaluation error:', err);
          decision = false; // Default to false on error
          error = err instanceof Error ? err.message : String(err);
        }
      } else if (mode === 'llm') {
        // LLM-based evaluation
        const llmRule = data.llmRule || 'Return true or false based on the input.';
        try {
          const result = await this.evaluateWithLLM(llmRule, inputs);
          decision = result.decision;
          llmResponse = result.response;
        } catch (err) {
          console.error('Router LLM evaluation error:', err);
          decision = false; // Default to false on error
          error = err instanceof Error ? err.message : String(err);
        }
      }

      // Return NodeOutput format
      return {
        type: 'json',
        content: {
          decision
        },
        meta: {
          nodeType: 'router',
          mode,
          ...(error && { error }),
          ...(evaluationResult !== undefined && { evaluationResult }),
          ...(llmResponse && { llmResponse })
        }
      } as NodeOutput;

    } catch (error) {
      console.error('RouterNode execution error:', error);
      
      return {
        type: 'json',
        content: {
          decision: false
        },
        meta: {
          nodeType: 'router',
          mode: (this.node.data as RouterNodeData).mode || 'expression',
          error: error instanceof Error ? error.message : String(error)
        }
      } as NodeOutput;
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

  private evaluateExpression(expression: string, inputs: Record<string, any>): boolean {
    // Convert inputs to both object and array format for flexibility
    const inputsArray = Object.values(inputs);
    const inputsObject = inputs;
    
    // Create a safe sandbox for expression evaluation
    const sandbox = {
      inputs: inputsArray, // Array format for inputs[0] access
      inputsObj: inputsObject, // Object format for inputs.key access
      // Add safe utility functions
      Math: {
        abs: Math.abs,
        max: Math.max,
        min: Math.min,
        round: Math.round,
        floor: Math.floor,
        ceil: Math.ceil
      },
      String,
      Number,
      Boolean,
      Array: {
        isArray: Array.isArray
      },
      Object: {
        keys: Object.keys,
        values: Object.values,
        entries: Object.entries
      }
    };

    // Validate expression for basic safety
    if (this.containsUnsafeCode(expression)) {
      throw new Error('Expression contains potentially unsafe code');
    }

    try {
      // Create a function with the sandbox as context
      const func = new Function(...Object.keys(sandbox), `return (${expression})`);
      const result = func(...Object.values(sandbox));
      
      // Ensure result is boolean
      return Boolean(result);
    } catch (err) {
      throw new Error(`Expression evaluation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private containsUnsafeCode(expression: string): boolean {
    // Check for potentially dangerous patterns
    const unsafePatterns = [
      /\beval\b/,
      /\bFunction\b/,
      /\bsetTimeout\b/,
      /\bsetInterval\b/,
      /\brequire\b/,
      /\bimport\b/,
      /\bprocess\b/,
      /\bglobal\b/,
      /\bwindow\b/,
      /\bdocument\b/,
      /\blocation\b/,
      /\bfetch\b/,
      /\bXMLHttpRequest\b/,
      /\bWebSocket\b/,
      /\b__proto__\b/,
      /\bconstructor\b/,
      /\bprototype\b/
    ];

    return unsafePatterns.some(pattern => pattern.test(expression));
  }

  private async evaluateWithLLM(llmRule: string, inputs: Record<string, any>): Promise<{ decision: boolean; response: string }> {
    // Convert inputs to a readable format for the LLM
    const inputsText = this.formatInputsForLLM(inputs);
    
    const systemPrompt = `You are a decision-making assistant. You must respond with ONLY "true" or "false" - no other text, explanation, or formatting. 

Rule: ${llmRule}

Analyze the provided inputs and respond with exactly "true" or "false" based on the rule.`;

    const userPrompt = `Inputs to evaluate:
${inputsText}

Based on the rule provided, respond with exactly "true" or "false":`;

    const llmResult = await callLLM(userPrompt, {
      provider: "nvidia",
      model: process.env.NEXT_PUBLIC_NVIDIA_MODEL || "openai/gpt-oss-120b",
      temperature: 0.1, // Low temperature for consistent output
      max_tokens: 10, // Very short response
      system: systemPrompt
    });

    const response = llmResult.text.trim().toLowerCase();
    
    // Parse the response strictly
    let decision = false;
    if (response === 'true') {
      decision = true;
    } else if (response === 'false') {
      decision = false;
    } else {
      // If response is not exactly "true" or "false", try to parse it
      if (response.includes('true')) {
        decision = true;
      } else {
        decision = false; // Default to false for unclear responses
      }
    }

    return {
      decision,
      response: llmResult.text
    };
  }

  private formatInputsForLLM(inputs: Record<string, any>): string {
    const parts: string[] = [];
    
    for (const [key, value] of Object.entries(inputs)) {
      if (value && typeof value === 'object' && 'type' in value && 'content' in value) {
        // FlowIO format
        if (value.type === 'json') {
          parts.push(`${key}: ${JSON.stringify(value.content, null, 2)}`);
        } else {
          parts.push(`${key}: ${String(value.content)}`);
        }
      } else if (typeof value === 'string') {
        parts.push(`${key}: ${value}`);
      } else if (typeof value === 'object') {
        parts.push(`${key}: ${JSON.stringify(value, null, 2)}`);
      } else {
        parts.push(`${key}: ${String(value)}`);
      }
    }
    
    return parts.join('\n\n') || 'No inputs provided';
  }
}
