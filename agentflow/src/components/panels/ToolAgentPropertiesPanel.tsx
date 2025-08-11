// Simplified Tool Agent Properties Panel with floating, minimal design
import React, { useEffect, useState } from "react";
import { figmaPropertiesTheme as theme } from "./propertiesPanelTheme";
import { CanvasNode, ToolAgentNodeData } from "@/types";
import { ChevronDown, ChevronRight } from "lucide-react";

interface ToolAgentPropertiesPanelProps {
  node: CanvasNode & { data: ToolAgentNodeData };
  onChange: (node: CanvasNode & { data: ToolAgentNodeData }) => void;
}

export default function ToolAgentPropertiesPanel({
  node,
  onChange,
}: ToolAgentPropertiesPanelProps) {
  const data = node.data;
  
  // Initialize state from existing data
  const [behaviorRule, setBehaviorRule] = useState<string>(
    data.rules?.nl || ""
  );
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  
  // Advanced settings state
  const [simulationMode, setSimulationMode] = useState<string>(
    data.simulation?.mode || "simulate"
  );
  const [provider, setProvider] = useState<string>(
    data.simulation?.providerId || "calendar"
  );
  const [operation, setOperation] = useState<string>(
    data.simulation?.operation || "findEvents"
  );
  const [scenario, setScenario] = useState<string>(
    data.simulation?.scenarioId || "busy-week"
  );
  const [parameters, setParameters] = useState<string>(
    data.simulation?.params ? JSON.stringify(data.simulation.params) : "{}"
  );
  
  // Update node data when fields change
  useEffect(() => {
    let parsedParams = {};
    try {
      parsedParams = JSON.parse(parameters);
    } catch {
      parsedParams = {};
    }
    
    const updatedData: ToolAgentNodeData = {
      ...data,
      rules: {
        nl: behaviorRule,
        compiled: data.rules?.compiled,
      },
      simulation: {
        mode: simulationMode as any,
        providerId: provider,
        operation,
        scenarioId: scenario,
        params: parsedParams,
        latencyMs: data.simulation?.latencyMs || 120,
        injectError: data.simulation?.injectError || null,
      },
    };
    
    onChange({ ...node, data: updatedData });
  }, [behaviorRule, simulationMode, provider, operation, scenario, parameters]);
  
  // Update local state if node changes externally
  useEffect(() => {
    if (data.rules?.nl !== behaviorRule) setBehaviorRule(data.rules?.nl || "");
    if (data.simulation?.mode !== simulationMode) setSimulationMode(data.simulation?.mode || "simulate");
    if (data.simulation?.providerId !== provider) setProvider(data.simulation?.providerId || "calendar");
    if (data.simulation?.operation !== operation) setOperation(data.simulation?.operation || "findEvents");
    if (data.simulation?.scenarioId !== scenario) setScenario(data.simulation?.scenarioId || "busy-week");
    const currentParams = data.simulation?.params ? JSON.stringify(data.simulation.params) : "{}";
    if (currentParams !== parameters) setParameters(currentParams);
  }, [node.id]);

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
    marginBottom: theme.spacing.sm,
  };
  
  const inputStyle: React.CSSProperties = {
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
  
  const advancedToggleStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.xs,
    cursor: "pointer",
    padding: theme.spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    color: theme.colors.textMuted,
    fontSize: theme.typography.fontSize.sm,
    fontFamily: theme.typography.fontFamily,
    transition: "background-color 0.2s, border-color 0.2s",
  };
  
  const advancedSectionStyle: React.CSSProperties = {
    marginTop: theme.spacing.sm,
    padding: theme.spacing.md,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    border: `1px solid ${theme.colors.border}`,
    borderRadius: theme.borderRadius.md,
    display: showAdvanced ? "block" : "none",
  };

  return (
    <div style={containerStyle}>
      {/* Title */}
      <h3 style={titleStyle}>Tool Agent</h3>
      
      {/* Subtitle */}
      <p style={subtitleStyle}>
        Configure tool behavior and simulation settings
      </p>
      
      {/* Behavior Rule - Prominently Displayed */}
      <div>
        <label style={labelStyle}>Behavior Rule</label>
        <textarea
          value={behaviorRule}
          onChange={(e) => setBehaviorRule(e.target.value)}
          placeholder="e.g., When asked about upcoming meetings, call findEvents and return today's events with start/end and location"
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
      
      {/* Advanced Settings Toggle */}
      <div
        style={advancedToggleStyle}
        onClick={() => setShowAdvanced(!showAdvanced)}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.05)";
          e.currentTarget.style.borderColor = theme.colors.buttonPrimary;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.02)";
          e.currentTarget.style.borderColor = theme.colors.border;
        }}
      >
        {showAdvanced ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        Advanced Settings
      </div>
      
      {/* Advanced Settings Section */}
      <div style={advancedSectionStyle}>
        {/* Simulation Mode */}
        <div>
          <label style={labelStyle}>Simulation Mode</label>
          <select
            value={simulationMode}
            onChange={(e) => setSimulationMode(e.target.value)}
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
            <option value="simulate">Simulate</option>
            <option value="live">Live (future)</option>
          </select>
        </div>
        
        {/* Provider */}
        <div>
          <label style={labelStyle}>Provider</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
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
            <option value="calendar">Calendar</option>
            <option value="email">Email</option>
            <option value="web-search">Web Search</option>
          </select>
        </div>
        
        {/* Operation */}
        <div>
          <label style={labelStyle}>Operation</label>
          <select
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
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
            <option value="findEvents">Find Events</option>
            <option value="createEvent">Create Event</option>
            <option value="sendEmail">Send Email</option>
            <option value="listEmails">List Emails</option>
          </select>
        </div>
        
        {/* Scenario */}
        <div>
          <label style={labelStyle}>Scenario</label>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
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
            <option value="busy-week">Busy week with double-bookings</option>
            <option value="light-schedule">Light schedule</option>
            <option value="no-events">No events</option>
          </select>
        </div>
        
        {/* Parameters */}
        <div>
          <label style={labelStyle}>Parameters (JSON)</label>
          <input
            type="text"
            value={parameters}
            onChange={(e) => setParameters(e.target.value)}
            placeholder='{"date": "2025-08-10"}'
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
        </div>
      </div>
    </div>
  );
}
