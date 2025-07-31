import React, { useState } from "react";
import { CanvasNode } from "@/types";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../ui/select";
import PanelSection from "./PanelSection";

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

// Define NodeData locally as per the project spec
interface Message {
  role: string;
  content: string;
  timestamp?: number;
}

interface NodeData {
  message: string;
  context: {
    flowId: string;
    nodeId: string;
    timestamp: number;
    metadata: Record<string, unknown>;
  };
  history?: Message[];
  state?: unknown;
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
    // Convert metadata values to strings for compatibility
    const safeMetadata =
      field === "metadata"
        ? Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([k, v]) => [
              k,
              typeof v === "string" ? v : JSON.stringify(v),
            ])
          )
        : Object.fromEntries(
            Object.entries(knowledgeData.metadata || {}).map(([k, v]) => [
              k,
              typeof v === "string" ? v : JSON.stringify(v),
            ])
          );

    const updated: KnowledgeBaseNodeData = {
      operation,
      documents:
        field === "documents"
          ? (value as unknown[])
          : knowledgeData.documents || [],
      metadata: safeMetadata,
    };
    if (field === "operation")
      setOperation(value as "store" | "retrieve" | "search");
    if (field === "documents") setDocuments(JSON.stringify(value, null, 2));
    if (field === "metadata") setMetadata(JSON.stringify(value, null, 2));
    if (isKnowledgeBaseNodeData(updated)) {
      onChange({
        ...node,
        type: "logic",
        data: {
          // Ensure context.metadata is Record<string, string>
          message: "",
          context: {
            flowId: node.id,
            nodeId: node.id,
            timestamp: Date.now(),
            metadata: safeMetadata,
          },
          history: [],
          state: undefined,
          ...updated,
        },
      });
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
    <div className="flex flex-col gap-4">
      <PanelSection title="Operation" description="Choose what this node does">
        <label className="text-sm">Operation</label>
        <Select
          value={operation}
          onValueChange={(val) =>
            handleFieldChange(
              "operation",
              val as "store" | "retrieve" | "search"
            )
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select operation" />
          </SelectTrigger>
          <SelectContent>
            {operationOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PanelSection>
      <PanelSection title="Documents" description="JSON array of documents">
        <label className="text-sm">Documents (JSON)</label>
        <textarea
          className="w-full min-h-[48px] bg-vscode-panel border border-vscode-border rounded p-2 text-vscode-text font-mono"
          value={documents}
          onChange={(e) => {
            setDocuments(e.target.value);
            try {
              handleFieldChange("documents", JSON.parse(e.target.value));
            } catch {}
          }}
          placeholder={`[
  {"id": 1, "content": "..."}
]`}
        />
      </PanelSection>
      <PanelSection title="Metadata" description="Additional metadata as JSON">
        <h3 className="text-sm">Metadata (JSON)</h3>
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
      </PanelSection>
    </div>
  );
}
