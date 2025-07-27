import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput } from "@/types";

interface MessageNodeData {
  content?: string;
  message?: string;
  passThrough?: boolean;
}

export class MessageNode extends BaseNode {
  async execute(context: NodeContext): Promise<NodeOutput> {
    const data = this.node.data as MessageNodeData;
    const message = data.content || data.message || "";
    const passThrough = data.passThrough || false;

    if (passThrough) {
      // Pass through input
      const inputs = this.getInputValues(context);
      return inputs.join("\n") || message;
    }

    return message;
  }
}
