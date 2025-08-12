import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CanvasNode } from '@/types';
import { MessageNodeData } from '@/lib/nodes/message/types';
import { MESSAGE_PRESETS, getPresetDefaults } from '@/lib/nodes/message/presets';

interface MessageFormatterPropertiesPanelProps {
  node: CanvasNode;
  onChange: (updatedNode: CanvasNode) => void;
}

export const MessageFormatterPropertiesPanel: React.FC<MessageFormatterPropertiesPanelProps> = ({
  node,
  onChange,
}) => {
  const data = node.data as MessageNodeData;
  
  const [preset, setPreset] = useState<"email" | "chat" | "report" | "custom">(data.preset || "chat");
  const [tone, setTone] = useState<"neutral" | "friendly" | "formal">(data.tone || "friendly");
  const [audience, setAudience] = useState(data.audience || "");
  const [formatHint, setFormatHint] = useState<"markdown" | "plain" | "html">(data.formatHint || "markdown");
  const [customTemplate, setCustomTemplate] = useState(data.customTemplate || "");
  const [outputPreview, setOutputPreview] = useState("");

  // Update output preview when settings change
  useEffect(() => {
    const generatePreview = () => {
      const presetConfig = MESSAGE_PRESETS[preset];
      if (!presetConfig) return "";

      let template = preset === 'custom' ? customTemplate : presetConfig.template;
      if (!template) return "";

      // Replace template variables with sample data for preview
      let preview = template
        .replace(/{context}/g, "Sample context data...")
        .replace(/{tone}/g, tone)
        .replace(/{formatHint}/g, formatHint)
        .replace(/{audience}/g, audience || "general audience");

      // Remove conditional audience lines if no audience
      if (!audience) {
        preview = preview.replace(/\$\{'{audience}' && 'Audience: {audience}'\}/g, '');
      }

      // Truncate to first 200 characters
      if (preview.length > 200) {
        preview = preview.substring(0, 200) + "...";
      }

      return preview;
    };

    setOutputPreview(generatePreview());
  }, [preset, tone, audience, formatHint, customTemplate]);

  // Save changes to node data
  useEffect(() => {
    onChange({
      ...node,
      data: {
        ...data,
        preset,
        tone,
        audience: audience.trim() || undefined,
        formatHint,
        customTemplate: preset === 'custom' ? customTemplate : undefined,
      } as MessageNodeData,
    });
  }, [preset, tone, audience, formatHint, customTemplate, node, onChange, data]);

  // Update defaults when preset changes
  useEffect(() => {
    if (preset !== 'custom') {
      const defaults = getPresetDefaults(preset);
      setTone(defaults.defaultTone);
      setFormatHint(defaults.suggestedFormat);
    }
  }, [preset]);

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    right: '20px',
    top: '20px',
    bottom: '20px',
    width: '320px',
    background: 'rgba(30, 30, 30, 0.65)',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '20px',
    color: 'white',
    fontSize: '13px',
    overflowY: 'auto' as const,
    zIndex: 1000,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '4px',
    color: 'rgba(255, 255, 255, 0.95)',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: '24px',
    lineHeight: '1.4',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: '8px',
    marginTop: '20px',
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    color: 'white',
    fontSize: '12px',
    outline: 'none',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    color: 'white',
    fontSize: '12px',
    outline: 'none',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '80px',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '6px',
    color: 'white',
    fontSize: '12px',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    resize: 'vertical' as const,
    outline: 'none',
  };

  const previewStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '6px',
    padding: '12px',
    fontSize: '11px',
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
    whiteSpace: 'pre-wrap' as const,
    maxHeight: '120px',
    overflowY: 'auto' as const,
  };

  return (
    <motion.div
      style={panelStyle}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
    >
      <div style={titleStyle}>Message</div>
      <div style={subtitleStyle}>
        Transform upstream data into human-facing messages with presets
      </div>

      <label style={labelStyle}>Preset</label>
      <select
        style={selectStyle}
        value={preset}
        onChange={(e) => setPreset(e.target.value as typeof preset)}
      >
        <option value="email">Email</option>
        <option value="chat">Chat Reply</option>
        <option value="report">Report</option>
        <option value="custom">Custom</option>
      </select>
      <div style={{ 
        fontSize: '11px', 
        color: 'rgba(255, 255, 255, 0.5)', 
        marginTop: '4px',
        lineHeight: '1.3'
      }}>
        {MESSAGE_PRESETS[preset]?.description || 'Select a message format preset'}
      </div>

      <label style={labelStyle}>Tone</label>
      <select
        style={selectStyle}
        value={tone}
        onChange={(e) => setTone(e.target.value as typeof tone)}
      >
        <option value="neutral">Neutral</option>
        <option value="friendly">Friendly</option>
        <option value="formal">Formal</option>
      </select>

      <label style={labelStyle}>Audience (Optional)</label>
      <input
        type="text"
        style={inputStyle}
        value={audience}
        onChange={(e) => setAudience(e.target.value)}
        placeholder="e.g., technical team, customers, executives"
      />

      <label style={labelStyle}>Format</label>
      <select
        style={selectStyle}
        value={formatHint}
        onChange={(e) => setFormatHint(e.target.value as typeof formatHint)}
      >
        <option value="markdown">Markdown</option>
        <option value="plain">Plain Text</option>
        <option value="html">HTML</option>
      </select>

      {preset === 'custom' && (
        <>
          <label style={labelStyle}>Custom Template</label>
          <textarea
            style={textareaStyle}
            value={customTemplate}
            onChange={(e) => setCustomTemplate(e.target.value)}
            placeholder="Enter your custom template with {context}, {tone}, {audience}, {formatHint} variables..."
          />
        </>
      )}

      <label style={labelStyle}>Output Preview</label>
      <div style={previewStyle}>
        {outputPreview || "Configure settings above to see preview..."}
      </div>
    </motion.div>
  );
};
