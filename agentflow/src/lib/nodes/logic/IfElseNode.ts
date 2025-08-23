import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput } from "@/types";
// LLM logic removed
import { getRuleText } from "../util/rules";

export class IfElseNode extends BaseNode {
  async execute(context: NodeContext): Promise<NodeOutput> {
    // Use the strict IfElseNodeData type
    const data = this.node.data as import("@/types").IfElseNodeData & Record<string, unknown>;
    const condition = (data.condition && String(data.condition)) || getRuleText(data) || "";
    // Prefer V2 inputs (respecting transforms/block); fallback to legacy helper
    const v2Inputs = context.inputs
      ? Object.values(context.inputs)
      : [];
    const toText = (val: import("@/types").NodeOutput): string => {
      if (typeof val === "string") return val;
      if (val && typeof val === "object") {
        // Common fields
        if (typeof (val as any).output === "string") return (val as any).output;
        if (typeof (val as any).message === "string") return (val as any).message;
        // Gemini extraction
        // LLM-specific extraction removed
      }
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    };
    const inputValues = v2Inputs.length > 0 ? v2Inputs.map(toText) : this.getInputValues(context);
    const input = inputValues.length === 1 ? inputValues[0] : inputValues;
    const nodeContext = data.context || {};

    if (!condition) {
      return { error: "No condition specified" };
    }

    // LLM disabled; perform a simple non-LLM check: substring match
    const hay = typeof input === 'string' ? input : JSON.stringify(input);
    const truthy = condition && hay.includes(condition);
    return { output: truthy ? 'true' : 'false' } as any;
  }
}
