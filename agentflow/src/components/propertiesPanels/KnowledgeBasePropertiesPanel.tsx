import React, { useState } from "react";
import { CanvasNode } from "@/types";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "../ui/select";

interface KnowledgeBaseNodeData {
  operation?: "store" | "retrieve" | "search";
  documents?: unknown[];
  metadata?: Record<string, unknown>;
}

interface KnowledgeBasePropertiesPanelProps {
  node: CanvasNode;
  onChange: (node: CanvasNode) => void;
}

const operationOptions = [
  { value: "store", label: "Store" },
  { value: "retrieve", label: "Retrieve" },
  { value: "search", label: "Search" },
];

function isKnowledgeBaseNodeData(data: unknown): data is KnowledgeBaseNodeData {
  return (
    typeof data === "object" &&
    data !== null &&
    ["store", "retrieve", "search"].includes(
      (data as KnowledgeBaseNodeData).operation || "retrieve"
    )
  );
}

export default function KnowledgeBasePropertiesPanel({
  node,
  onChange,
}: KnowledgeBasePropertiesPanelProps) {
  const knowledgeData = isKnowledgeBaseNodeData(node.data)
    ? (node.data as KnowledgeBaseNodeData)
    : { operation: "retrieve", documents: [], metadata: {} };

  const [documents, setDocuments] = useState<string>(
    knowledgeData.documents
      ? JSON.stringify(knowledgeData.documents, null, 2)
      : "[]"
  );
  const [metadata, setMetadata] = useState<string>(
    knowledgeData.metadata
      ? JSON.stringify(knowledgeData.metadata, null, 2)
      : "{}"
  );
  const [operation, setOperation] = useState<"store" | "retrieve" | "search">(
    ["store", "retrieve", "search"].includes(knowledgeData.operation as string)
      ? (knowledgeData.operation as "store" | "retrieve" | "search")
      : "retrieve"
  );

  const handleFieldChange = (
    field: keyof KnowledgeBaseNodeData,
    value: unknown
  ) => {
    const updated: KnowledgeBaseNodeData = {
      operation,
      documents:
        field === "documents"
          ? (value as unknown[])
          : knowledgeData.documents || [],
      metadata:
        field === "metadata"
          ? (value as Record<string, unknown>)
          : knowledgeData.metadata || {},
    };
    if (field === "operation")
      setOperation(value as "store" | "retrieve" | "search");
    if (field === "documents") setDocuments(JSON.stringify(value, null, 2));
    if (field === "metadata") setMetadata(JSON.stringify(value, null, 2));
    if (isKnowledgeBaseNodeData(updated)) {
      onChange({ ...node, data: updated });
    }
  };

  // Only render the panel if the node is a knowledge base node
  if (!isKnowledgeBaseNodeData(node.data)) {
    return (
      <div className="p-4 text-vscode-textSecondary">
        This properties panel is only for knowledge base nodes.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#23272e] rounded-xl shadow-lg min-w-[320px] max-w-[400px]">
      <section>
        <h3 className="text-vscode-title font-semibold mb-2">Operation</h3>
        <Select
          value={operation}
          onValueChange={(v) =>
            handleFieldChange("operation", v as "store" | "retrieve" | "search")
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose operation" />
          </SelectTrigger>
          <SelectContent>
            {operationOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </section>
      <section>
        <h3 className="text-vscode-title font-semibold mb-2">
          Documents (JSON)
        </h3>
        <textarea
          className="w-full min-h-[64px] bg-vscode-panel border border-vscode-border rounded p-2 text-vscode-text font-mono"
          value={documents}
          onChange={(e) => {
            setDocuments(e.target.value);
            try {
              handleFieldChange("documents", JSON.parse(e.target.value));
            } catch {}
          }}
          placeholder={`[\n  {"title": "Doc 1"}, ...\n]`}
        />
      </section>
      <section>
        <h3 className="text-vscode-title font-semibold mb-2">
          Metadata (JSON)
        </h3>
        <textarea
          className="w-full min-h-[48px] bg-vscode-panel border border-vscode-border rounded p-2 text-vscode-text font-mono"
          value={metadata}
          onChange={(e) => {
            setMetadata(e.target.value);
            try {
              handleFieldChange("metadata", JSON.parse(e.target.value));
            } catch {}
          }}
          placeholder={`{\n  "source": "user"\n}`}
        />
      </section>
      {/* TODO: Add unit tests for this panel to ensure type safety and prevent regressions. */}
    </div>
  );
}
