// Simplified Prompt Template Properties Panel with floating, minimal design
import React, { useEffect, useState } from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode, PromptTemplateNodeData } from "@/types";

interface PromptTemplatePropertiesPanelProps {
  node: CanvasNode;
  onChange: (node: CanvasNode) => void;
}

export default function PromptTemplatePropertiesPanel({
  node,
  onChange,
}: PromptTemplatePropertiesPanelProps) {
  const data = node.data as PromptTemplateNodeData;
  
  // Initialize state from existing data
  const [template, setTemplate] = useState<string>(data.template || "");
  const [variables, setVariables] = useState<Record<string, string>>(data.variables || {});
  const [extractVariablesFromInput, setExtractVariablesFromInput] = useState<boolean>(
    data.extractVariablesFromInput || false
  );
  
  // Update node data when fields change
  useEffect(() => {
    const updatedData = {
      ...data,
      template,
      variables,
      extractVariablesFromInput,
    };
    onChange({ ...node, data: updatedData });
  }, [template, variables, extractVariablesFromInput]);
  
  // Update local state if node changes externally
  useEffect(() => {
    if (data.template !== template) setTemplate(data.template || "");
    if (JSON.stringify(data.variables) !== JSON.stringify(variables)) {
      setVariables(data.variables || {});
    }
    if (data.extractVariablesFromInput !== extractVariablesFromInput) {
      setExtractVariablesFromInput(data.extractVariablesFromInput || false);
    }
  }, [node.id]);

  // Variable management functions
  const handleVariableChange = (key: string, value: string) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  };

  const handleVariableKeyChange = (oldKey: string, newKey: string) => {
    setVariables(prev => {
      const updated = { ...prev };
      if (newKey && newKey !== oldKey) {
        updated[newKey] = updated[oldKey];
        delete updated[oldKey];
      }
      return updated;
    });
  };

  const handleAddVariable = () => {
    const existingKeys = Object.keys(variables);
    let newKey = "name";
    let counter = 1;
    while (existingKeys.includes(newKey)) {
      newKey = `var${counter}`;
      counter++;
    }
    setVariables(prev => ({ ...prev, [newKey]: "" }));
  };

  const handleRemoveVariable = (key: string) => {
    setVariables(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
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
  
  const textAreaStyle: React.CSSProperties = {
    width: "100%",
    minHeight: "100px",
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
  
  const inputStyle: React.CSSProperties = {
    padding: theme.spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily,
    outline: "none",
    transition: "border-color 0.2s, background-color 0.2s",
    flex: 1,
  };
  
  const buttonStyle: React.CSSProperties = {
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    backgroundColor: theme.colors.buttonPrimary,
    border: "none",
    borderRadius: theme.borderRadius.md,
    color: "white",
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily,
    cursor: "pointer",
    transition: "background-color 0.2s",
  };
  
  const removeButtonStyle: React.CSSProperties = {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.error,
    border: "none",
    borderRadius: theme.borderRadius.md,
    color: "white",
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily,
    cursor: "pointer",
    transition: "background-color 0.2s",
    minWidth: "32px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  
  const variableRowStyle: React.CSSProperties = {
    display: "flex",
    gap: theme.spacing.sm,
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  };
  
  const labelStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.textPrimary,
    margin: 0,
    fontFamily: theme.typography.fontFamily,
    marginBottom: theme.spacing.xs,
  };
  
  const switchContainerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.sm,
  };
  
  const switchStyle: React.CSSProperties = {
    width: "16px",
    height: "16px",
    accentColor: theme.colors.buttonPrimary,
  };
  
  const switchLabelStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textPrimary,
    fontFamily: theme.typography.fontFamily,
    cursor: "pointer",
  };

  return (
    <div style={containerStyle}>
      {/* Title */}
      <h3 style={titleStyle}>Template</h3>
      
      {/* Subtitle */}
      <p style={subtitleStyle}>
        Define prompt template with variables
      </p>
      
      {/* Template Textarea */}
      <div>
        <label style={labelStyle}>Prompt Template</label>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          placeholder="Hello {{name}}, welcome to {{place}}!"
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
      
      {/* Variables */}
      <div>
        <label style={labelStyle}>Variables</label>
        {Object.entries(variables).map(([key, value]) => (
          <div key={key} style={variableRowStyle}>
            <input
              type="text"
              value={key}
              onChange={(e) => handleVariableKeyChange(key, e.target.value)}
              placeholder="name"
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.buttonPrimary;
                e.target.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.colors.border;
                e.target.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
              }}
            />
            <input
              type="text"
              value={value}
              onChange={(e) => handleVariableChange(key, e.target.value)}
              placeholder="Value"
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = theme.colors.buttonPrimary;
                e.target.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = theme.colors.border;
                e.target.style.backgroundColor = "rgba(255, 255, 255, 0.03)";
              }}
            />
            <button
              onClick={() => handleRemoveVariable(key)}
              style={removeButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#dc3545";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.error;
              }}
            >
              −
            </button>
          </div>
        ))}
        
        <button
          onClick={handleAddVariable}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#0066cc";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.buttonPrimary;
          }}
        >
          Add Variable
        </button>
      </div>
      
      {/* Extract Variables Toggle */}
      <div style={switchContainerStyle}>
        <input
          type="checkbox"
          id="extractVariables"
          checked={extractVariablesFromInput}
          onChange={(e) => setExtractVariablesFromInput(e.target.checked)}
          style={switchStyle}
        />
        <label htmlFor="extractVariables" style={switchLabelStyle}>
          Extract variables from input
        </label>
      </div>
    </div>
  );
}
