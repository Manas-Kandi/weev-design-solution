import { BaseNode, NodeContext } from "../base/BaseNode";
import { NodeOutput } from "@/types";

export interface KnowledgeBaseNodeData {
  operation?: "store" | "retrieve" | "search";
  documents?: unknown[];
  metadata?: Record<string, unknown>;
}

export class KnowledgeBaseNode extends BaseNode {
  private static documentCache = new Map<string, unknown[]>();

  static setDocuments(nodeId: string, docs: unknown[]) {
    this.documentCache.set(nodeId, docs);
  }

  static getDocuments(nodeId: string): unknown[] | undefined {
    return this.documentCache.get(nodeId);
  }

  async execute(_context: NodeContext): Promise<NodeOutput> {
    void _context;
    const data = this.node.data as KnowledgeBaseNodeData;
    const operation = data.operation || "retrieve"; // store, retrieve, search

    if (operation === "store") {
      const documents = data.documents || [];
      KnowledgeBaseNode.setDocuments(this.node.id, documents);
      return `Stored ${documents.length} documents`;
    } else if (operation === "retrieve" || operation === "search") {
      const stored = KnowledgeBaseNode.getDocuments(this.node.id);
      if (!stored || stored.length === 0) {
        return "No documents found in knowledge base";
      }
      return JSON.stringify(stored);
    }

    return { error: "Unknown operation" };
  }

  static clearCache(nodeId?: string) {
    if (nodeId) {
      this.documentCache.delete(nodeId);
    } else {
      this.documentCache.clear();
    }
  }
}
