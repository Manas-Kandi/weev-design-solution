import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput } from "@/types";
import { RouterNodeData, RouterNodeOutput } from "./types";
// LLM logic removed
import { logger } from "@/lib/logger";

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
        // Debugging router expression evaluation for test parity.
        logger.debug('Router Expression Evaluation Debug:', { expression, inputs });
        try {
          decision = this.evaluateExpression(expression, inputs);
          evaluationResult = decision;
        } catch (err) {
          logger.error('Router expression evaluation error:', err);
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
      logger.error('RouterNode execution error:', error);
      
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

  // Removed LLM evaluation helper

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
