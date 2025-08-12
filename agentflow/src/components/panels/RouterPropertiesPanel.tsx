import React, { useState, useEffect } from 'react';
import { RouterNodeData } from '@/lib/nodes/router/types';
import { figmaPropertiesTheme } from './propertiesPanelTheme';

interface RouterPropertiesPanelProps {
  nodeData: RouterNodeData;
  onChange: (data: Partial<RouterNodeData>) => void;
}

export const RouterPropertiesPanel: React.FC<RouterPropertiesPanelProps> = ({
  nodeData,
  onChange
}) => {
  const [mode, setMode] = useState<"expression" | "llm">(nodeData.mode || 'expression');
  const [expression, setExpression] = useState(nodeData.expression || 'inputs[0]?.content?.score > 0.5');
  const [llmRule, setLlmRule] = useState(nodeData.llmRule || 'Return true if the input indicates a positive sentiment, false otherwise.');

  // Sync local state with node data changes
  useEffect(() => {
    setMode(nodeData.mode || 'expression');
    setExpression(nodeData.expression || 'inputs[0]?.content?.score > 0.5');
    setLlmRule(nodeData.llmRule || 'Return true if the input indicates a positive sentiment, false otherwise.');
  }, [nodeData]);

  const handleModeChange = (newMode: "expression" | "llm") => {
    setMode(newMode);
    onChange({ mode: newMode });
  };

  const handleExpressionChange = (newExpression: string) => {
    setExpression(newExpression);
    onChange({ expression: newExpression });
  };

  const handleLlmRuleChange = (newRule: string) => {
    setLlmRule(newRule);
    onChange({ llmRule: newRule });
  };

  const containerStyle: React.CSSProperties = {
    padding: '16px',
    fontFamily: figmaPropertiesTheme.typography.fontFamily,
    fontSize: figmaPropertiesTheme.typography.fontSize.sm,
    color: figmaPropertiesTheme.colors.textPrimary,
  };

  const sectionStyle: React.CSSProperties = {
    marginBottom: '16px',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    marginBottom: '6px',
    fontSize: figmaPropertiesTheme.typography.fontSize.sm,
    fontWeight: figmaPropertiesTheme.typography.fontWeight.medium,
    color: figmaPropertiesTheme.colors.textPrimary,
  };

  const selectStyle: React.CSSProperties = {
    width: '100%',
    height: '32px',
    padding: '4px 8px',
    fontSize: figmaPropertiesTheme.typography.fontSize.sm,
    fontFamily: figmaPropertiesTheme.typography.fontFamily,
    borderRadius: figmaPropertiesTheme.borderRadius.sm,
    border: `1px solid ${figmaPropertiesTheme.colors.border}`,
    backgroundColor: figmaPropertiesTheme.colors.backgroundTertiary,
    color: figmaPropertiesTheme.colors.textPrimary,
    outline: 'none',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px',
    fontSize: figmaPropertiesTheme.typography.fontSize.sm,
    fontFamily: figmaPropertiesTheme.typography.fontFamily,
    borderRadius: figmaPropertiesTheme.borderRadius.sm,
    border: `1px solid ${figmaPropertiesTheme.colors.border}`,
    backgroundColor: figmaPropertiesTheme.colors.backgroundTertiary,
    color: figmaPropertiesTheme.colors.textPrimary,
    outline: 'none',
    resize: 'vertical' as const,
  };

  const helpTextStyle: React.CSSProperties = {
    marginTop: '4px',
    fontSize: figmaPropertiesTheme.typography.fontSize.xs,
    color: figmaPropertiesTheme.colors.textSecondary,
    lineHeight: figmaPropertiesTheme.typography.lineHeight.normal,
  };

  const infoBoxStyle: React.CSSProperties = {
    padding: '12px',
    backgroundColor: figmaPropertiesTheme.colors.backgroundSecondary,
    border: `1px solid ${figmaPropertiesTheme.colors.border}`,
    borderRadius: figmaPropertiesTheme.borderRadius.sm,
  };

  return (
    <div style={containerStyle}>
      <div style={sectionStyle}>
        <label style={labelStyle}>
          Routing Mode
        </label>
        <select
          value={mode}
          onChange={(e) => handleModeChange(e.target.value as "expression" | "llm")}
          style={selectStyle}
        >
          <option value="expression">Expression</option>
          <option value="llm">LLM Decision</option>
        </select>
        <div style={helpTextStyle}>
          Choose how the router makes decisions: JavaScript expression or LLM-based reasoning
        </div>
      </div>

      {mode === 'expression' && (
        <div style={sectionStyle}>
          <label style={labelStyle}>
            Expression
          </label>
          <textarea
            value={expression}
            onChange={(e) => handleExpressionChange(e.target.value)}
            placeholder="inputs[0]?.content?.score > 0.5"
            style={{
              ...textareaStyle,
              fontFamily: 'Monaco, Consolas, monospace',
              fontSize: '12px'
            }}
            rows={4}
          />
          <div style={helpTextStyle}>
            JavaScript expression that evaluates to true/false. Available: inputs, Math, String, Number, Boolean, Array, Object
          </div>
          <div style={{
            ...helpTextStyle,
            fontSize: '11px',
            color: figmaPropertiesTheme.colors.textMuted,
            marginTop: '4px'
          }}>
            Examples:<br/>
            • inputs[0]?.content?.score &gt; 0.7<br/>
            • inputs.length &gt; 2<br/>
            • inputs[0]?.content?.status === 'approved'
          </div>
        </div>
      )}

      {mode === 'llm' && (
        <div style={sectionStyle}>
          <label style={labelStyle}>
            LLM Rule
          </label>
          <textarea
            value={llmRule}
            onChange={(e) => handleLlmRuleChange(e.target.value)}
            placeholder="Return true if the input indicates a positive sentiment, false otherwise."
            style={textareaStyle}
            rows={4}
          />
          <div style={helpTextStyle}>
            Instruction for the LLM to make a true/false decision based on the inputs
          </div>
        </div>
      )}

      <div style={sectionStyle}>
        <div style={infoBoxStyle}>
          <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Router Outputs</div>
          <div style={{ fontSize: '12px', color: figmaPropertiesTheme.colors.textSecondary }}>
            • <strong>true</strong> port: Routes when decision is true<br/>
            • <strong>false</strong> port: Routes when decision is false
          </div>
        </div>
      </div>
    </div>
  );
};
