import React, { useState } from "react";
import { CanvasNode } from "@/types";
import { Input } from "../ui/input";
import PanelSection from "./PanelSection";

interface MessagePropertiesPanelProps {
  node: CanvasNode;
  onChange: (node: CanvasNode) => void;
}

interface MessageNodeData {
  title?: string;
  content?: string;
  messageType?: "System" | "User" | "Assistant";
  passThrough?: boolean;
}

import { isMessageNodeData } from "@/utils/typeGuards";

const TITLE_MAX = 50;

export default function MessagePropertiesPanel({ node, onChange }: MessagePropertiesPanelProps) {
  // Extract and normalize data
  const safeData: MessageNodeData = isMessageNodeData(node.data)
    ? {
        title: 'title' in node.data && typeof node.data.title === 'string' ? node.data.title : "Message",
        content: 'content' in node.data && typeof node.data.content === 'string'
          ? node.data.content
          : (('message' in node.data && typeof (node.data as { message?: string }).message === 'string') 
              ? (node.data as { message: string }).message 
              : ""),
        messageType: 'messageType' in node.data && typeof node.data.messageType === 'string'
          ? node.data.messageType as MessageNodeData["messageType"]
          : "User",
        passThrough: 'passThrough' in node.data
          ? Boolean(
              typeof (node.data as { passThrough?: unknown }).passThrough === "boolean"
                ? (node.data as { passThrough: boolean }).passThrough
                : false
            )
          : false,
      }
    : { title: "Message", content: "", messageType: "User", passThrough: false };

  // Validation state
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const handleFieldChange = (field: keyof MessageNodeData, value: unknown) => {
    // Always spread the original node.data to preserve union fields
    onChange({ ...node, data: { ...node.data, [field]: value } });
  };


  // Validation logic
  const errors: { [key: string]: string } = {};
  if (!safeData.title || safeData.title.trim().length === 0) {
    errors.title = "Title is required.";
  } else if (safeData.title.length > TITLE_MAX) {
    errors.title = `Title must be under ${TITLE_MAX} characters.`;
  }
  if (!safeData.content || safeData.content.trim().length === 0) {
    errors.content = "Message content is required.";
  }

  // UI
  return (
    <div className="flex flex-col gap-6 p-1">
      {/* Required Fields */}
      <PanelSection title="Required" description="">
        <h3 className="text-accent font-semibold mb-1">Required</h3>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">
            Title <span className="text-error">*</span>
            <Input
              className="w-full bg-panel border border-border rounded p-2 text-text mt-1"
              value={safeData.title}
              maxLength={TITLE_MAX}
              placeholder="Message"
              onChange={e => handleFieldChange("title", e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, title: true }))}
            />
            <span className="text-xs text-textMute">Max {TITLE_MAX} characters</span>
            {touched.title && errors.title && <div className="text-error text-xs mt-1">{errors.title}</div>}
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">
            Message Content <span className="text-error">*</span>
            <textarea
              className="w-full min-h-[64px] bg-panel border border-border rounded p-2 text-text mt-1"
              value={safeData.content}
              maxLength={500}
              placeholder="Message to send..."
              onChange={e => handleFieldChange("content", e.target.value)}
              onBlur={() => setTouched(t => ({ ...t, content: true }))}
            />
            <span className="text-xs text-textMute">Required. This will be sent as the message.</span>
            {touched.content && errors.content && <div className="text-error text-xs mt-1">{errors.content}</div>}
          </label>
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1">
            Message Type
            <select
              className="w-full bg-panel border border-border rounded p-2 text-text mt-1"
              value={safeData.messageType}
              onChange={e => handleFieldChange("messageType", e.target.value as MessageNodeData["messageType"])}
            >
              <option value="System">System</option>
              <option value="User">User</option>
              <option value="Assistant">Assistant</option>
            </select>
            <span className="text-xs text-textMute">Choose the role for this message.</span>
          </label>
        </div>
      </PanelSection>
      <PanelSection title="Advanced" description="Optional: pass input through">
        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            checked={!!safeData.passThrough}
            onChange={e => handleFieldChange("passThrough", e.target.checked)}
            id="passThrough"
          />
          <label htmlFor="passThrough" className="text-sm">
            Pass Through Mode
            <span className="block text-xs text-textMute">If enabled, this node will pass its input through instead of using the message content.</span>
          </label>
        </div>
      </PanelSection>
    </div>
  );
}
// TODO: Add unit tests for this panel to ensure type safety and prevent regressions.
