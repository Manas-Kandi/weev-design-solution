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
    console.log(
      "[DEBUG] getInputValues: node",
      this.node.id,
      "incoming connections",
      incoming
    );
    return incoming
      .map((conn) => {
        const upstreamNode = context.nodes.find(
          (n) => n.id === conn.sourceNode
        );
        // --- PATCH: Always use nodeOutputs for UI nodes if available ---
        if (
          upstreamNode &&
          (upstreamNode.type === "ui" || upstreamNode.subtype === "ui")
        ) {
          const output = context.nodeOutputs[conn.sourceNode];
          console.log("[DEBUG] getInputValues (UI node)", {
            currentNode: this.node.id,
            upstreamNode: upstreamNode.id,
            output,
            data: upstreamNode.data,
          });
          if (typeof output === "string" && output) return output;
          if (
            output &&
            typeof output === "object" &&
            "message" in output &&
            output.message
          )
            return output.message as string;
          if (
            output &&
            typeof output === "object" &&
            "content" in output &&
            output.content
          )
            return output.content as string;
          // Fallback to node data
          type UIData = { content?: string; message?: string };
          const data = upstreamNode.data as UIData;
          return data?.content || data?.message || "";
        }
        const output = context.nodeOutputs[conn.sourceNode];
        console.log("[DEBUG] getInputValues (other node)", {
          currentNode: this.node.id,
          upstreamNode: upstreamNode?.id,
          output,
        });
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
          // Optionally extract text from Gemini output
          if (geminiOutput?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return geminiOutput.candidates[0].content.parts[0].text as string;
          }
        }
        return JSON.stringify(output);
      })
      .filter(Boolean);
  }

  // Helper to format all inputs as context
  protected formatInputContext(context: NodeContext): string {
    const inputs = this.getInputValues(context);
    console.log("[DEBUG] formatInputContext", {
      node: this.node.id,
      inputs,
    });
    return inputs.join("\n\n");
  }
}
