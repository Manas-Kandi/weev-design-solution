/**
 * ================================================================================
 * DEPRECATED: This component is replaced by UnifiedPropertiesPanel.tsx
 * ================================================================================
 * 
 * This individual panel component is deprecated in favor of the new 
 * UnifiedPropertiesPanel which provides a single source of truth for all 
 * Properties panel rendering with consistent liquid-glass design.
 * 
 * All router panel logic has been moved to UnifiedPropertiesPanel.tsx
 * ================================================================================
 */

import React, { useState, useEffect } from 'react';
import { RouterNodeData } from '@/lib/nodes/router/types';
import { 
  PanelContainer, 
  PanelSection, 
  FormField, 
  Select, 
  TextArea 
} from './shared/PropertiesPanelPrimitives';

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

  return (
    <PanelContainer>
      <PanelSection 
        title="Routing Configuration"
        subtitle="Configure how the router makes routing decisions"
      >
        <FormField 
          label="Routing Mode"
          help="Choose how the router makes decisions: JavaScript expression or LLM-based reasoning"
        >
          <Select
            value={mode}
            onChange={(value) => handleModeChange(value as "expression" | "llm")}
            options={[
              { value: 'expression', label: 'Expression' },
              { value: 'llm', label: 'LLM Decision' }
            ]}
          />
        </FormField>

        {mode === 'expression' && (
          <FormField 
            label="Expression"
            help="JavaScript expression that evaluates to true/false. Available: inputs, Math, String, Number, Boolean, Array, Object"
          >
            <TextArea
              value={expression}
              onChange={handleExpressionChange}
              placeholder="inputs[0]?.content?.score > 0.5"
              rows={4}
            />
            <div style={{ 
              fontSize: '11px', 
              color: '#888', 
              marginTop: '8px',
              fontFamily: 'Monaco, Consolas, monospace'
            }}>
              Examples:<br/>
              • inputs[0]?.content?.score &gt; 0.7<br/>
              • inputs.length &gt; 2<br/>
              • inputs[0]?.content?.status === 'approved'
            </div>
          </FormField>
        )}

        {mode === 'llm' && (
          <FormField 
            label="LLM Rule"
            help="Instruction for the LLM to make a true/false decision based on the inputs"
          >
            <TextArea
              value={llmRule}
              onChange={handleLlmRuleChange}
              placeholder="Return true if the input indicates a positive sentiment, false otherwise."
              rows={4}
            />
          </FormField>
        )}
      </PanelSection>

      <PanelSection title="Router Outputs">
        <div style={{ fontSize: '12px', color: '#aaa', lineHeight: '1.5' }}>
          • <strong>true</strong> port: Routes when decision is true<br/>
          • <strong>false</strong> port: Routes when decision is false
        </div>
      </PanelSection>
    </PanelContainer>
  );
};
