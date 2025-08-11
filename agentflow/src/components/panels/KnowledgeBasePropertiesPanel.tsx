// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState, useRef, useEffect } from "react";
import { VSCodeSelect, VSCodeInput } from "../primitives/vsCodeFormComponents";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";
import { Database, FileText, Info } from "lucide-react";
import { KnowledgeBaseNode } from "@/lib/nodes/knowledge/KnowledgeBaseNode";

import { PanelSection } from "../primitives/PanelSection";

interface KnowledgeBaseNodeData {
  operation?: "store" | "retrieve" | "search";
  documents?: unknown[];
  metadata?: Record<string, unknown>;
}

interface UploadedDocument {
  name: string;
  content: string;
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

  const [documents, setDocuments] = useState<UploadedDocument[]>(
    (knowledgeData.documents as UploadedDocument[]) || []
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    KnowledgeBaseNode.setDocuments(node.id, documents);
  }, [node.id, documents]);

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
    } else if (field === "documents") {
      const docs = value as UploadedDocument[];
      setDocuments(docs);
    } else if (field === "metadata") {
      setMetadata(value as string);
    }

    const docs =
      field === "documents" ? (value as UploadedDocument[]) : documents;
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

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const newDocs = await Promise.all(
      Array.from(files).map(async (file) => ({
        name: file.name,
        content: await file.text(),
      }))
    );
    handleFieldChange("documents", [...documents, ...newDocs]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
        description="Upload documents"
        icon={<FileText size={16} />}
      >
        <div
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing.sm,
          }}
        >
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${theme.colors.border}`,
              borderRadius: theme.borderRadius.sm,
              padding: theme.spacing.md,
              textAlign: "center",
              background: theme.colors.backgroundTertiary,
              color: theme.colors.textSecondary,
              cursor: "pointer",
            }}
          >
            <p style={{ margin: 0 }}>
              Drag & drop files here or click to upload
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              style={{ display: "none" }}
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
          {documents.length > 0 && (
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                color: theme.colors.textPrimary,
                textAlign: "left",
              }}
            >
              {documents.map((doc, idx) => (
                <li key={idx}>{doc.name}</li>
              ))}
            </ul>
          )}
        </div>
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
