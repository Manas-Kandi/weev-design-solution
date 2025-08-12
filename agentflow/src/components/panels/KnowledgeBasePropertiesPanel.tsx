// Simplified Knowledge Base Properties Panel with floating, minimal design
import React, { useEffect, useState, useRef } from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";
import { KnowledgeBaseNode } from "@/lib/nodes/knowledge/KnowledgeBaseNode";

interface KnowledgeBasePropertiesPanelProps {
  node: CanvasNode;
  onChange: (node: CanvasNode) => void;
}

interface KnowledgeBaseNodeData {
  operation?: "store" | "retrieve" | "search";
  documents?: UploadedDocument[];
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface UploadedDocument {
  name: string;
  content: string;
}

export default function KnowledgeBasePropertiesPanel({
  node,
  onChange,
}: KnowledgeBasePropertiesPanelProps) {
  const data = node.data as KnowledgeBaseNodeData;
  
  // Initialize state from existing data
  const [operation, setOperation] = useState<"store" | "retrieve" | "search">(
    data.operation || "retrieve"
  );
  const [documents, setDocuments] = useState<UploadedDocument[]>(
    (data.documents as UploadedDocument[]) || []
  );
  const [metadata, setMetadata] = useState<string>(
    data.metadata ? JSON.stringify(data.metadata, null, 2) : "{}"
  );
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Update KnowledgeBaseNode documents when they change
  useEffect(() => {
    KnowledgeBaseNode.setDocuments(node.id, documents);
  }, [node.id, documents]);
  
  // Update node data when fields change
  useEffect(() => {
    let parsedMetadata = {};
    try {
      parsedMetadata = JSON.parse(metadata);
    } catch {
      parsedMetadata = {};
    }
    
    const updatedData: KnowledgeBaseNodeData = {
      ...data,
      operation,
      documents,
      metadata: parsedMetadata,
    };
    
    onChange({ ...node, data: updatedData as any });
  }, [operation, documents, metadata]);
  
  // Update local state if node changes externally
  useEffect(() => {
    if (data.operation !== operation) setOperation(data.operation || "retrieve");
    if (data.documents !== documents) setDocuments((data.documents as UploadedDocument[]) || []);
    const currentMetadata = data.metadata ? JSON.stringify(data.metadata, null, 2) : "{}";
    if (currentMetadata !== metadata) setMetadata(currentMetadata);
  }, [node.id]);

  // Handle file uploads with enhanced PDF support
  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    
    const newDocs = await Promise.all(
      Array.from(files).map(async (file) => {
        let content = "";
        
        if (file.type === "application/pdf") {
          // For PDFs, we'll simulate extraction (in production, use a PDF library)
          content = `[PDF Content from ${file.name}]\n\nThis is a simulated extraction of PDF content. In production, this would use a PDF parsing library to extract actual text content, tables, and metadata from the PDF document.\n\nFile: ${file.name}\nSize: ${(file.size / 1024).toFixed(2)} KB\nType: ${file.type}`;
        } else {
          // For text files, read directly
          content = await file.text();
        }
        
        return {
          name: file.name,
          content: content,
        };
      })
    );
    
    setDocuments(prev => [...prev, ...newDocs]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    padding: theme.spacing.lg,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.md,
    height: "100%",
  };
  
  const titleStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    margin: 0,
    fontFamily: theme.typography.fontFamily,
  };
  
  const subtitleStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textMuted,
    margin: 0,
    fontFamily: theme.typography.fontFamily,
  };
  
  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: theme.spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily,
    outline: "none",
    transition: "border-color 0.2s, background-color 0.2s",
  };
  
  const uploadAreaStyle: React.CSSProperties = {
    border: `2px dashed ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    textAlign: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    color: theme.colors.textMuted,
    cursor: "pointer",
    transition: "border-color 0.2s, background-color 0.2s",
    minHeight: "80px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  
  const textAreaStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "80px",
    maxHeight: "200px",
    padding: theme.spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontMono,
    lineHeight: theme.typography.lineHeight.relaxed,
    resize: "vertical",
    outline: "none",
    transition: "border-color 0.2s, background-color 0.2s",
  };
  
  const labelStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    margin: 0,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.xs,
  };
  
  const documentListStyle: React.CSSProperties = {
    listStyle: "none",
    margin: 0,
    padding: 0,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
  };
  
  const documentItemStyle: React.CSSProperties = {
    padding: theme.spacing.xs,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: theme.borderRadius.sm,
    marginBottom: theme.spacing.xs,
  };

  return (
    <div style={containerStyle}>
      {/* Title */}
      <h3 style={titleStyle}>Memory</h3>
      
      {/* Subtitle */}
      <p style={subtitleStyle}>
        Configure knowledge base operations and documents
      </p>
      
      {/* Operation Dropdown */}
      <div>
        <label style={labelStyle}>Operation</label>
        <select
          value={operation}
          onChange={(e) => setOperation(e.target.value as "store" | "retrieve" | "search")}
          style={selectStyle}
          onFocus={(e) => {
            e.target.style.borderColor = theme.colors.buttonPrimary;
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = theme.colors.border;
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
          }}
        >
          <option value="retrieve">Retrieve</option>
          <option value="store">Store</option>
          <option value="search">Search</option>
        </select>
      </div>
      
      {/* Documents Upload */}
      <div>
        <label style={labelStyle}>Documents</label>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          style={uploadAreaStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = theme.colors.buttonPrimary;
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = theme.colors.border;
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)";
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
        
        {/* Document List */}
        {documents.length > 0 && (
          <ul style={documentListStyle}>
            {documents.map((doc, idx) => (
              <li key={idx} style={documentItemStyle}>
                {doc.name}
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {/* Metadata JSON */}
      <div>
        <label style={labelStyle}>Metadata</label>
        <textarea
          value={metadata}
          onChange={(e) => setMetadata(e.target.value)}
          placeholder='{\n  "source": "user"\n}'
          style={textAreaStyle}
          onFocus={(e) => {
            e.target.style.borderColor = theme.colors.buttonPrimary;
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = theme.colors.border;
            e.target.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
          }}
        />
      </div>
    </div>
  );
}
