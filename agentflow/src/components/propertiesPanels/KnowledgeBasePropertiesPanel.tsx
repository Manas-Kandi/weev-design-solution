// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import { VSCodeSelect, VSCodeInput } from "./vsCodeFormComponents";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";

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
        minWidth: 360,
        maxWidth: 480,
        height: "100%",
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      <PanelSection title="Operation" description="Choose what this node does">
        <VSCodeSelect
          value={operation}
          onValueChange={(val: string) =>
            handleFieldChange(
              "operation",
              val as "store" | "retrieve" | "search"
            )
          }
          options={operationOptions}
          placeholder="Select operation"
        />
      </PanelSection>
      <PanelSection title="Documents" description="JSON array of documents">
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
          ) => {
            setDocuments(e.target.value);
            try {
              handleFieldChange("documents", JSON.parse(e.target.value));
            } catch {}
          }}
          placeholder={`[
  {
    "title": "Document 1",
    "content": "..."
  }
]`}
        />
      </PanelSection>
      <PanelSection title="Metadata" description="Additional metadata as JSON">
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
          ) => {
            setMetadata(e.target.value);
            try {
              handleFieldChange("metadata", JSON.parse(e.target.value));
            } catch {}
          }}
          placeholder={`{
  "source": "user"
}`}
        />
      </PanelSection>
    </div>
  );
}
