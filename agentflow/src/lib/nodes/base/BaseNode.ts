import { CanvasNode, Connection, NodeOutput } from "@/types";
import { callGemini } from "@/lib/geminiClient";

export interface NodeContext {
  nodes: CanvasNode[];
  connections: Connection[];
  nodeOutputs: Record<string, NodeOutput>;
  currentNode: CanvasNode;
}

export interface NodeExecutor {
  execute(context: NodeContext): Promise<NodeOutput>;
  validate(node: CanvasNode): boolean;
}

export abstract class BaseNode implements NodeExecutor {
  protected node: CanvasNode;

  constructor(node: CanvasNode) {
    this.node = node;
  }

  abstract execute(context: NodeContext): Promise<NodeOutput>;

  validate(node: CanvasNode): boolean {
    return true; // Default validation
  }

  // Helper to get input values from connected nodes
  protected getInputValues(context: NodeContext): string[] {
    const incoming = context.connections.filter(
      (c) => c.targetNode === this.node.id
    );
    return incoming
      .map((conn) => {
        const output = context.nodeOutputs[conn.sourceNode];
        if (typeof output === "string") return output;
        if (output && typeof output === "object" && "gemini" in output) {
          type GeminiOutput = {
            candidates?: Array<{
              content?: {
                parts?: Array<{
                  text?: string;
                }>;
              };
            }>;
          };
          const geminiOutput = output.gemini as GeminiOutput;
          return geminiOutput?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        }
        return JSON.stringify(output);
      })
      .filter(Boolean);
  }

  // Helper to format all inputs as context
  protected formatInputContext(context: NodeContext): string {
    const inputs = this.getInputValues(context);
    return inputs.join("\n\n");
  }
}
