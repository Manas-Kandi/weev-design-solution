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
        <label className="block mb-1 text-[var(--af-label-size)] font-semibold text-[var(--af-text-secondary)]">
          Title <span className="text-[var(--af-danger)]">*</span>
        </label>
        <input
          className="w-full rounded-[var(--af-border-radius)] bg-[var(--af-panel-bg)] border border-[var(--af-border)] px-3 py-2 text-[var(--af-text-secondary)] focus:ring-2 focus:ring-[var(--af-accent)] transition-all duration-200"
          value={safeData.title}
          maxLength={TITLE_MAX}
          placeholder="Message"
          onChange={e => handleFieldChange("title", e.target.value)}
          onBlur={() => setTouched(t => ({ ...t, title: true }))}
        />
        <span className="text-[var(--af-helper-size)] text-[var(--af-text-helper)]">Max {TITLE_MAX} characters</span>
        {touched.title && errors.title && <div className="text-[var(--af-danger)] text-xs mt-1">{errors.title}</div>}

        <label className="block mb-1 text-[var(--af-label-size)] font-semibold text-[var(--af-text-secondary)]">
          Message Content <span className="text-[var(--af-danger)]">*</span>
        </label>
        <textarea
          className="w-full min-h-[64px] rounded-[var(--af-border-radius)] bg-[var(--af-panel-bg)] border border-[var(--af-border)] px-3 py-2 text-[var(--af-text-secondary)] focus:ring-2 focus:ring-[var(--af-accent)] transition-all duration-200"
          value={safeData.content}
          maxLength={500}
          placeholder="Message to send..."
          onChange={e => handleFieldChange("content", e.target.value)}
          onBlur={() => setTouched(t => ({ ...t, content: true }))}
        />
        <span className="text-[var(--af-helper-size)] text-[var(--af-text-helper)]">Required. This will be sent as the message.</span>
        {touched.content && errors.content && <div className="text-[var(--af-danger)] text-xs mt-1">{errors.content}</div>}

        <label className="block mb-1 text-[var(--af-label-size)] font-semibold text-[var(--af-text-secondary)]">
          Message Type
        </label>
        <select
          className="w-full rounded-[var(--af-border-radius)] bg-[var(--af-panel-bg)] border border-[var(--af-border)] px-3 py-2 text-[var(--af-text-secondary)] focus:ring-2 focus:ring-[var(--af-accent)] transition-all duration-200"
          value={safeData.messageType}
          onChange={e => handleFieldChange("messageType", e.target.value as MessageNodeData["messageType"])}
        >
          <option value="System">System</option>
          <option value="User">User</option>
          <option value="Assistant">Assistant</option>
        </select>
        <span className="text-[var(--af-helper-size)] text-[var(--af-text-helper)]">Choose the role for this message.</span>

      </PanelSection>
      <PanelSection title="Advanced" description="Optional: pass input through">
        <div className="flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            checked={!!safeData.passThrough}
            onChange={e => handleFieldChange("passThrough", e.target.checked)}
            id="passThrough"
            className="accent-[var(--af-accent)] w-4 h-4 rounded-[var(--af-border-radius)] border border-[var(--af-border)] focus:ring-2 focus:ring-[var(--af-accent)] transition-all duration-200"
          />
          <label htmlFor="passThrough" className="text-[var(--af-label-size)] font-semibold text-[var(--af-text-secondary)]">
            Pass Through Mode
            <span className="block text-[var(--af-helper-size)] text-[var(--af-text-helper)]">If enabled, this node will pass its input through instead of using the message content.</span>
          </label>
        </div>
      </PanelSection>
    </div>
  );
}
// TODO: Add unit tests for this panel to ensure type safety and prevent regressions.
