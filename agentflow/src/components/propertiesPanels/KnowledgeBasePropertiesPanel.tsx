// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { VSCodeSelect, VSCodeInput } from "./vsCodeFormComponents";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";
import { Database, FileText, Info } from "lucide-react";

import { PanelSection } from "./PanelSection";

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

  const parseOrDefault = <T,>(input: string, defaultVal: T): T => {
    try {
      return JSON.parse(input) as T;
    } catch {
      return defaultVal;
    }
  };

  const handleFieldChange = (
    field: keyof KnowledgeBaseNodeData,
    value: unknown
  ) => {
    if (field === "operation") {
      setOperation(value as "store" | "retrieve" | "search");
    }
    if (field === "documents") {
      setDocuments(value as string);
    }
    if (field === "metadata") {
      setMetadata(value as string);
    }

    const docs =
      field === "documents"
        ? parseOrDefault(value as string, [])
        : parseOrDefault(documents, []);
    const metaRaw =
      field === "metadata"
        ? parseOrDefault(value as string, {})
        : parseOrDefault(metadata, {});
    const safeMetadata = Object.fromEntries(
      Object.entries(metaRaw).map(([k, v]) => [
        k,
        typeof v === "string" ? v : JSON.stringify(v),
      ])
    );

    const updated: KnowledgeBaseNodeData = {
      ...node.data,
      operation:
        field === "operation"
          ? (value as "store" | "retrieve" | "search")
          : operation,
      documents: docs,
      metadata: safeMetadata,
    };

    if (isKnowledgeBaseNodeData(updated)) {
      onChange({
        ...node,
        type: "logic",
        data: {
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
    return null;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: theme.spacing.lg,
        background: theme.colors.background,
        padding: theme.spacing.lg,
        width: "100%",
        minWidth: 0,
        maxWidth: "100%",
        height: "100%",
        boxSizing: "border-box",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      <PanelSection
        title="Operation"
        description="Choose what this node does"
        icon={<Database size={16} />}
      >
        <VSCodeSelect
          value={operation}
          onValueChange={(val: string) =>
            handleFieldChange("operation", val as string)
          }
          options={operationOptions}
          placeholder="Select operation"
        />
      </PanelSection>
      <PanelSection
        title="Documents"
        description="JSON array of documents"
        icon={<FileText size={16} />}
      >
        <VSCodeInput
          style={{
            minHeight: 48,
            fontFamily: theme.typography.fontMono,
            fontSize: theme.typography.fontSize.base,
            background: theme.colors.backgroundTertiary,
            color: theme.colors.textPrimary,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.sm,
            padding: theme.spacing.inputPadding,
            resize: "vertical",
            width: "100%",
            boxSizing: "border-box",
          }}
          value={documents}
          onChange={(
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
          ) => handleFieldChange("documents", e.target.value)}
          placeholder={`[
  {
    "title": "Document 1",
    "content": "..."
  }
]`}
        />
      </PanelSection>
      <PanelSection
        title="Metadata"
        description="Additional metadata as JSON"
        icon={<Info size={16} />}
      >
        <VSCodeInput
          style={{
            minHeight: 48,
            fontFamily: theme.typography.fontMono,
            fontSize: theme.typography.fontSize.base,
            background: theme.colors.backgroundTertiary,
            color: theme.colors.textPrimary,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.sm,
            padding: theme.spacing.inputPadding,
            resize: "vertical",
            width: "100%",
            boxSizing: "border-box",
          }}
          value={metadata}
          onChange={(
            e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
          ) => handleFieldChange("metadata", e.target.value)}
          placeholder={`{
  "source": "user"
}`}
        />
      </PanelSection>
    </div>
  );
}
