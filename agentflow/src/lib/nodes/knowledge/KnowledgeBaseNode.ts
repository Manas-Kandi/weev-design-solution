import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput } from "@/types";

export interface KnowledgeBaseNodeData {
  operation?: "store" | "retrieve" | "search";
  documents?: unknown[];
  metadata?: Record<string, unknown>;
}

export class KnowledgeBaseNode extends BaseNode {
  private static cache = new Map<
    string,
    { documents: unknown[]; metadata: Record<string, unknown> }
  >();

  async execute(context: NodeContext): Promise<NodeOutput> {
    const data = this.node.data as KnowledgeBaseNodeData;
    const operation = data.operation || "retrieve"; // store, retrieve, search
    const inputContext = this.formatInputContext(context);

    if (operation === "store") {
      // Store documents in cache
      const documents = data.documents || [];
      KnowledgeBaseNode.cache.set(this.node.id, {
        documents,
        metadata: data.metadata || {},
      });
      return `Stored ${documents.length} documents`;
    } else if (operation === "retrieve" || operation === "search") {
      // Retrieve documents from cache
      const stored = KnowledgeBaseNode.cache.get(this.node.id);
      if (!stored) {
        return "No documents found in knowledge base";
      }

      // For now, return all documents
      // In production, implement proper search
      return JSON.stringify(stored);
    }

    return { error: "Unknown operation" };
  }

  static clearCache(nodeId?: string) {
    if (nodeId) {
      this.cache.delete(nodeId);
    } else {
      this.cache.clear();
    }
  }
}
