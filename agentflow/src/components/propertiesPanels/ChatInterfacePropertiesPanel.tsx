import React, { useState } from "react";
import { CanvasNode } from "@/types";
import { Input } from "../ui/input";

interface ChatInterfacePropertiesPanelProps {
  node: CanvasNode;
  onChange: (node: CanvasNode) => void;
}

export default function ChatInterfacePropertiesPanel({
  node,
  onChange,
}: ChatInterfacePropertiesPanelProps) {
  interface ChatNodeData {
    title?: string;
    placeholder?: string;
    enableFileUpload?: boolean;
    showHistory?: boolean;
    [key: string]: unknown;
  }

  const [title, setTitle] = useState<string>(() => {
    const data = node.data as ChatNodeData | undefined;
    if (data && typeof data.title === "string") {
      return data.title;
    }
    return "";
  });
  const [placeholder, setPlaceholder] = useState<string>(() => {
    if ("placeholder" in (node.data ?? {})) {
      // @ts-expect-error: placeholder may exist on some node types
      return node.data?.placeholder || "";
    }
    return "";
  });
  const [enableFileUpload, setEnableFileUpload] = useState<boolean>(() => {
    if ("enableFileUpload" in (node.data ?? {})) {
      // Only use if property exists on this node type
      // @ts-expect-error: enableFileUpload may exist on some node types
      return !!node.data?.enableFileUpload;
    }
    return false;
  });
  const [showHistory, setShowHistory] = useState<boolean>(() => {
    if ("showHistory" in (node.data ?? {})) {
      // Only use if property exists on this node type
      // @ts-expect-error: showHistory may exist on some node types
      return !!node.data?.showHistory;
    }
    return false;
  });

  const handleFieldChange = (field: string, value: unknown) => {
    onChange({ ...node, data: { ...node.data, [field]: value } });
  };

  return (
    <div className="flex flex-col gap-4">
      <section>
        <h3 className="text-accent font-semibold mb-2">Title</h3>
        <Input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            handleFieldChange("title", e.target.value);
          }}
          placeholder="Chat interface title..."
        />
      </section>
      <section>
        <h3 className="text-accent font-semibold mb-2">Placeholder</h3>
        <Input
          value={placeholder}
          onChange={(e) => {
            setPlaceholder(e.target.value);
            handleFieldChange("placeholder", e.target.value);
          }}
          placeholder="Type your message..."
        />
      </section>
      <section>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enableFileUpload}
            onChange={(e) => {
              setEnableFileUpload(e.target.checked);
              handleFieldChange("enableFileUpload", e.target.checked);
            }}
          />
          <span>Enable File Upload</span>
        </label>
      </section>
      <section>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={showHistory}
            onChange={(e) => {
              setShowHistory(e.target.checked);
              handleFieldChange("showHistory", e.target.checked);
            }}
          />
          <span>Show History</span>
        </label>
      </section>
      {/* TODO: Add unit tests for this panel to ensure type safety and prevent regressions. */}
    </div>
  );
}
