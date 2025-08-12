import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CanvasNode } from '@/types';
import { ThinkingNodeData } from '@/lib/nodes/thinking/types';

interface ThinkingPropertiesPanelProps {
  node: CanvasNode;
  onNodeUpdate: (nodeId: string, updates: Partial<CanvasNode>) => void;
}

export const ThinkingPropertiesPanel: React.FC<ThinkingPropertiesPanelProps> = ({
  node,
  onNodeUpdate,
}) => {
  const data = node.data as ThinkingNodeData;
  
  const [systemPrompt, setSystemPrompt] = useState(
    data.systemPrompt || "You are a careful, stepwise thinker. Break down problems methodically and provide clear reasoning for your conclusions."
  );
  const [style, setStyle] = useState<"balanced" | "fast" | "deep">(data.style || "balanced");
  const [schemaHint, setSchemaHint] = useState(data.schemaHint || "");
  const [allowToolCalls, setAllowToolCalls] = useState(data.allowToolCalls ?? true);

  // Save changes to node data
  useEffect(() => {
    const updates = {
      data: {
        ...data,
        systemPrompt,
        style,
        schemaHint: schemaHint.trim() || undefined,
        allowToolCalls,
      },
    };
    onNodeUpdate(node.id, updates);
  }, [systemPrompt, style, schemaHint, allowToolCalls, node.id, onNodeUpdate, data]);

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

  const checkboxContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '16px',
  };

  const checkboxStyle: React.CSSProperties = {
    width: '16px',
    height: '16px',
    accentColor: '#3b82f6',
  };

  const checkboxLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.8)',
    cursor: 'pointer',
  };

  const styleDescriptions = {
    fast: "Quick responses with focused reasoning (temp: 0.3, 1k tokens)",
    balanced: "Thoughtful analysis with moderate depth (temp: 0.7, 2k tokens)", 
    deep: "Comprehensive reasoning with extensive exploration (temp: 0.9, 4k tokens)"
  };

  return (
    <motion.div
      style={panelStyle}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.2 }}
    >
      <div style={titleStyle}>Thinking</div>
      <div style={subtitleStyle}>
        Configure structured chain-of-thought reasoning with optional tool calls
      </div>

      <label style={labelStyle}>System Prompt</label>
      <textarea
        style={textareaStyle}
        value={systemPrompt}
        onChange={(e) => setSystemPrompt(e.target.value)}
        placeholder="You are a careful, stepwise thinker..."
      />

      <label style={labelStyle}>Reasoning Style</label>
      <select
        style={selectStyle}
        value={style}
        onChange={(e) => setStyle(e.target.value as "balanced" | "fast" | "deep")}
      >
        <option value="fast">Fast</option>
        <option value="balanced">Balanced</option>
        <option value="deep">Deep</option>
      </select>
      <div style={{ 
        fontSize: '11px', 
        color: 'rgba(255, 255, 255, 0.5)', 
        marginTop: '4px',
        lineHeight: '1.3'
      }}>
        {styleDescriptions[style]}
      </div>

      <label style={labelStyle}>Schema Hint (Optional)</label>
      <textarea
        style={{
          ...textareaStyle,
          minHeight: '60px',
        }}
        value={schemaHint}
        onChange={(e) => setSchemaHint(e.target.value)}
        placeholder='{"answer": "string", "confidence": "number"}'
      />
      <div style={{ 
        fontSize: '11px', 
        color: 'rgba(255, 255, 255, 0.5)', 
        marginTop: '4px' 
      }}>
        JSON schema to guide output structure
      </div>

      <div style={checkboxContainerStyle}>
        <input
          type="checkbox"
          id="allowToolCalls"
          style={checkboxStyle}
          checked={allowToolCalls}
          onChange={(e) => setAllowToolCalls(e.target.checked)}
        />
        <label htmlFor="allowToolCalls" style={checkboxLabelStyle}>
          Allow tool calls
        </label>
      </div>
      <div style={{ 
        fontSize: '11px', 
        color: 'rgba(255, 255, 255, 0.5)', 
        marginTop: '4px',
        marginLeft: '24px'
      }}>
        Enable the model to propose tool invocations in response
      </div>
    </motion.div>
  );
};
