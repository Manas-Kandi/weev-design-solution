// Simplified Router Properties Panel with floating, minimal design
import React, { useEffect, useState } from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode } from "@/types";

interface RouterPropertiesPanelProps {
  node: CanvasNode;
  onChange: (node: CanvasNode) => void;
}

interface RouterNodeData {
  routingLogic?: string;  // Natural language routing instructions
  branches?: BranchMapping[];  // Branch name and condition mappings
  // Legacy fields for backward compatibility
  condition?: string;
  message?: string;
  context?: {
    flowId: string;
    nodeId: string;
    timestamp: number;
    metadata: Record<string, string>;
  };
  history?: unknown[];
  state?: Record<string, unknown>;
  [key: string]: unknown;
}

interface BranchMapping {
  name: string;
  description: string;
}

// Helper function to migrate legacy config to new format
function migrateLegacyRouterConfig(data: RouterNodeData): { routingLogic: string; branches: BranchMapping[] } {
  // Get routing logic
  let routingLogic = "";
  if (data.routingLogic) {
    routingLogic = data.routingLogic;
  } else if (data.condition) {
    // Convert old condition expression to natural language
    routingLogic = `If condition is true: ${data.condition}`;
    if (data.message) {
      routingLogic += `\nMessage: ${data.message}`;
    }
  }
  
  // Get branches (default if none exist)
  let branches: BranchMapping[] = [];
  if (data.branches && Array.isArray(data.branches)) {
    branches = data.branches;
  } else {
    // Default branches for router
    branches = [
      { name: "true", description: "Condition is met" },
      { name: "false", description: "Condition is not met" }
    ];
  }
  
  return { routingLogic, branches };
}

export default function RouterPropertiesPanel({
  node,
  onChange,
}: RouterPropertiesPanelProps) {
  const data = node.data as RouterNodeData;
  
  // Initialize state from existing data or migrate legacy config
  const { routingLogic: initialRoutingLogic, branches: initialBranches } = migrateLegacyRouterConfig(data);
  const [routingLogic, setRoutingLogic] = useState<string>(initialRoutingLogic);
  const [branches, setBranches] = useState<BranchMapping[]>(initialBranches);
  
  // Update node data when fields change
  useEffect(() => {
    const updatedData = {
      ...data,
      routingLogic,
      branches,
    };
    onChange({ ...node, data: updatedData });
  }, [routingLogic, branches]);
  
  // Update local state if node changes externally
  useEffect(() => {
    const { routingLogic: newRoutingLogic, branches: newBranches } = migrateLegacyRouterConfig(data);
    if (newRoutingLogic !== routingLogic) setRoutingLogic(newRoutingLogic);
    if (JSON.stringify(newBranches) !== JSON.stringify(branches)) setBranches(newBranches);
  }, [node.id]);

  // Branch management functions
  const handleBranchChange = (index: number, field: keyof BranchMapping, value: string) => {
    setBranches(prev => prev.map((branch, i) => 
      i === index ? { ...branch, [field]: value } : branch
    ));
  };

  const handleAddBranch = () => {
    setBranches(prev => [...prev, { name: "", description: "" }]);
  };

  const handleRemoveBranch = (index: number) => {
    setBranches(prev => prev.filter((_, i) => i !== index));
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
    minHeight: "120px",
    maxHeight: "250px",
    padding: theme.spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    color: theme.colors.textPrimary,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily,
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
  
  const branchRowStyle: React.CSSProperties = {
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

  return (
    <div style={containerStyle}>
      {/* Title */}
      <h3 style={titleStyle}>Router Logic</h3>
      
      {/* Subtitle */}
      <p style={subtitleStyle}>
        Describe how this node should decide which branch to follow
      </p>
      
      {/* Routing Instructions Textarea */}
      <div>
        <label style={labelStyle}>Routing Instructions</label>
        <textarea
          value={routingLogic}
          onChange={(e) => setRoutingLogic(e.target.value)}
          placeholder={`e.g., If the message contains a price or cost, go to 'pricing' branch.
If it's a greeting, go to 'greeting' branch.
Otherwise, go to 'default'.`}
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
      
      {/* Branch Mapping Section */}
      <div>
        <label style={labelStyle}>Branch Mapping</label>
        {branches.map((branch, index) => (
          <div key={index} style={branchRowStyle}>
            <input
              type="text"
              value={branch.name}
              onChange={(e) => handleBranchChange(index, 'name', e.target.value)}
              placeholder="pricing"
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
              value={branch.description}
              onChange={(e) => handleBranchChange(index, 'description', e.target.value)}
              placeholder="For price-related queries"
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
              onClick={() => handleRemoveBranch(index)}
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
          onClick={handleAddBranch}
          style={buttonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#0066cc";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.buttonPrimary;
          }}
        >
          Add Branch
        </button>
      </div>
    </div>
  );
}
