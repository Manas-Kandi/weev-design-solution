// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React from "react";
import { Wrench, Play, AlertTriangle } from "lucide-react";
import { CanvasNode, ToolAgentNodeData } from "@/types";
import {
  figmaPropertiesTheme as theme,
  getPanelContainerStyle,
} from "./propertiesPanelTheme";
import { PanelSection } from "./PanelSection";
import { VSCodeInput, VSCodeSelect, VSCodeButton, VSCodeTextArea } from "./vsCodeFormComponents";
import { providers, getProvider } from "@/lib/simulation/providers";
import { SimulationMode } from "@/types/simulation";

interface ToolAgentPropertiesPanelProps {
  node: CanvasNode & { data: ToolAgentNodeData };
  onChange: (node: CanvasNode & { data: ToolAgentNodeData }) => void;
}

export default function ToolAgentPropertiesPanel({
  node,
  onChange,
}: ToolAgentPropertiesPanelProps) {
  const data = node.data;
  const defaultToolConfig: NonNullable<ToolAgentNodeData["toolConfig"]> = {
    toolType: "web-search",
    endpoint: "",
    apiKey: "",
    parameters: {},
  };
  const toolConfig: NonNullable<ToolAgentNodeData["toolConfig"]> =
    data.toolConfig ?? defaultToolConfig;

  const rules = data.rules ?? { nl: "", compiled: undefined };
  const [ruleText, setRuleText] = React.useState<string>(rules.nl || "");
  // Sync local editor when selected node or external rules change
  React.useEffect(() => {
    setRuleText(rules.nl || "");
  }, [node.id, rules.nl]);
  const simulation = data.simulation ?? {
    providerId: providers[0]?.id || "calendar",
    operation: undefined,
    scenarioId: getProvider(providers[0]?.id || "calendar")?.scenarios[0]?.id || "busy-week",
    latencyMs: 120,
    injectError: null,
    params: {},
    mode: "simulate" as SimulationMode,
  };

  const handleConfigChange = (
    field: keyof NonNullable<ToolAgentNodeData["toolConfig"]>,
    value: unknown
  ) => {
    const updatedData: ToolAgentNodeData = {
      ...data,
      toolConfig: { ...toolConfig, [field]: value } as NonNullable<
        ToolAgentNodeData["toolConfig"]
      >,
    };
    onChange({ ...node, data: updatedData });
  };

  const setRules = (next: Partial<NonNullable<ToolAgentNodeData["rules"]>>) => {
    const updated: ToolAgentNodeData = {
      ...data,
      rules: { ...rules, ...next },
    };
    onChange({ ...node, data: updated });
  };

  const setSimulation = (
    next: Partial<NonNullable<ToolAgentNodeData["simulation"]>>
  ) => {
    const updated: ToolAgentNodeData = {
      ...data,
      simulation: { ...simulation, ...next },
    };
    onChange({ ...node, data: updated });
  };

  const toolTypeOptions = [
    { value: "web-search", label: "Web Search" },
    { value: "calculator", label: "Calculator" },
    { value: "code-executor", label: "Code Executor" },
    { value: "file-operations", label: "File Operations" },
    { value: "database-query", label: "Database Query" },
    { value: "custom-api", label: "Custom API" },
  ];

  // Provider options
  const providerOptions = providers.map((p) => ({ value: p.id, label: p.label }));
  const activeProvider = getProvider(simulation.providerId) || providers[0];
  const operationOptions = (activeProvider?.operations || []).map((o) => ({ value: o.name, label: o.name }));
  const scenarioOptions = (activeProvider?.scenarios || []).map((s) => ({ value: s.id, label: s.label }));

  const headerStyle: React.CSSProperties = {
    padding: theme.spacing.lg,
    borderBottom: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.backgroundSecondary,
    display: "flex",
    alignItems: "center",
    gap: theme.spacing.md,
  };

  const headerTitleStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.textPrimary,
    margin: 0,
    lineHeight: theme.typography.lineHeight.tight,
    fontFamily: theme.typography.fontFamily,
  };

  const headerSubtitleStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.textSecondary,
    margin: `${theme.spacing.xs} 0 0 0`,
    lineHeight: theme.typography.lineHeight.normal,
    fontFamily: theme.typography.fontFamily,
  };

  const contentStyle: React.CSSProperties = {
    padding: theme.spacing.lg,
    display: "flex",
    flexDirection: "column",
    gap: theme.spacing.lg,
    flex: 1,
  };

  const labelStyle: React.CSSProperties = {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.xs,
    fontFamily: theme.typography.fontFamily,
  };

  // NL → operation guesser with simple heuristics
  const guessOperation = (text: string): string | undefined => {
    const lower = (text || "").toLowerCase();
    // Direct mention of operation names
    const allOps = providers.flatMap((p) => p.operations.map((o) => o.name));
    const direct = allOps.find((op) => lower.includes(op.toLowerCase()));
    if (direct) return direct;

    // Calendar heuristics → findEvents or createEvent
    const isCalendarLike = /(calendar|calander|schedule|meeting|meetings|event|events|availability|free|busy|slots|times)/.test(lower);
    if (isCalendarLike) {
      if (/(create|add|schedule|book)/.test(lower)) return "createEvent";
      return "findEvents";
    }

    // Email heuristics → sendEmail or listEmails
    const isEmailLike = /(email|inbox|message|mailer|gmail|outlook)/.test(lower);
    if (isEmailLike) {
      if (/(send|reply|respond)/.test(lower)) return "sendEmail";
      return "listEmails";
    }

    return undefined;
  };

  const compiledSummary = React.useMemo(() => {
    const op = rules.compiled?.operation ?? guessOperation(rules.nl || "");
    return op ? `Operation: ${op}` : "No operation inferred yet";
  }, [rules]);

  const [previewResult, setPreviewResult] = React.useState<{ data?: unknown; error?: string } | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);

  const runPreview = async () => {
    setIsRunning(true);
    setPreviewResult(null);
    try {
      if (simulation.mode === "live") {
        setPreviewResult({ error: "Live mode not implemented—switch to Simulate" });
        return;
      }
      const provider = activeProvider;
      if (!provider) {
        setPreviewResult({ error: "No provider selected" });
        return;
      }
      const operation = simulation.operation || guessOperation(rules.nl || "") || provider.operations[0]?.name;
      if (!operation) {
        setPreviewResult({ error: "No operation selected or inferred" });
        return;
      }
      const res = await provider.run({
        operation,
        params: simulation.params || {},
        scenarioId: simulation.scenarioId,
        latencyMs: simulation.latencyMs,
        injectError: simulation.injectError || null,
      });
      setPreviewResult(res);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={getPanelContainerStyle()}>
      <div style={headerStyle}>
        <div
          style={{
            backgroundColor: theme.colors.buttonPrimary,
            borderRadius: theme.borderRadius.md,
            padding: theme.spacing.md,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Wrench size={20} color="white" />
        </div>
        <div>
          <h2 style={headerTitleStyle}>Tool Agent Configuration</h2>
          <p style={headerSubtitleStyle}>
            Simulate realistic tool behavior with rules and presets
          </p>
        </div>
      </div>

      <div style={contentStyle}>
        <PanelSection
          title="Behavior Rule"
          description="Describe how this tool should behave in plain language"
          icon={<Wrench size={16} />}
        >
          <label style={labelStyle}>Rule</label>
          <VSCodeTextArea
            placeholder="e.g., When asked about upcoming meetings, call findEvents and return today's events with start/end and location"
            value={ruleText}
            onChange={(e) => {
              const v = (e.target as HTMLTextAreaElement).value;
              setRuleText(v);
              setRules({ nl: v });
            }}
            rows={6}
          />
          <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.md }}>
            <VSCodeButton
              variant="secondary"
              size="small"
              onClick={() => {
                const op = guessOperation(ruleText || rules.nl || "");
                setRules({ compiled: { operation: op, notes: op ? `Inferred ${op}` : "No operation inferred" } });
                if (op) setSimulation({ operation: op });
              }}
            >
              Infer Operation
            </VSCodeButton>
            <span style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.textMuted }}>{compiledSummary}</span>
          </div>
        </PanelSection>

        <PanelSection
          title="Preset & Provider"
          description="Pick a provider, operation, and scenario to simulate"
          icon={<Wrench size={16} />}
        >
          <label style={labelStyle}>Simulation Mode</label>
          <VSCodeSelect
            value={simulation.mode || "simulate"}
            options={[{ value: "simulate", label: "Simulate" }, { value: "live", label: "Live (future)" }]}
            onValueChange={(v) => setSimulation({ mode: v as SimulationMode })}
          />

          <label style={labelStyle}>Provider</label>
          <VSCodeSelect
            value={activeProvider?.id || ""}
            options={providerOptions}
            onValueChange={(v) => {
              const p = getProvider(v);
              setSimulation({
                providerId: v,
                operation: p?.operations[0]?.name,
                scenarioId: p?.scenarios[0]?.id,
                params: {},
              });
            }}
          />

          <label style={labelStyle}>Operation</label>
          <VSCodeSelect
            value={simulation.operation || ""}
            options={operationOptions}
            onValueChange={(v) => setSimulation({ operation: v })}
          />

          <label style={labelStyle}>Scenario</label>
          <VSCodeSelect
            value={simulation.scenarioId || ""}
            options={scenarioOptions}
            onValueChange={(v) => setSimulation({ scenarioId: v })}
          />

          <label style={labelStyle}>Parameters (JSON)</label>
          <VSCodeInput
            value={simulation.params ? JSON.stringify(simulation.params) : ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              try {
                const parsed = e.target.value ? JSON.parse(e.target.value) : {};
                setSimulation({ params: parsed });
              } catch {
                // ignore, keep last good
              }
            }}
            placeholder='{"date":"2025-08-10"}'
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: theme.spacing.md }}>
            <div>
              <label style={labelStyle}>Latency (ms)</label>
              <VSCodeInput
                type="number"
                value={String(simulation.latencyMs ?? 120)}
                onChange={(e) => setSimulation({ latencyMs: Number((e.target as HTMLInputElement).value || 0) })}
              />
            </div>
            <div>
              <label style={labelStyle}>Inject Error</label>
              <VSCodeSelect
                value={simulation.injectError?.type || ""}
                options={[{ value: "", label: "None" }, { value: "timeout", label: "Timeout" }, { value: "rate_limit", label: "Rate limit" }]}
                onValueChange={(v) => setSimulation({ injectError: v ? { type: v } : null })}
              />
            </div>
          </div>
        </PanelSection>

        <PanelSection
          title="Preview"
          description="Run the provider with the selected scenario"
          icon={<Play size={16} />}
        >
          <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.md }}>
            <VSCodeButton onClick={runPreview} loading={isRunning}>
              Run Preview
            </VSCodeButton>
            {simulation.mode === "live" && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: theme.colors.warning, fontSize: theme.typography.fontSize.xs }}>
                <AlertTriangle size={14} /> Live mode is not implemented
              </span>
            )}
          </div>
          <div style={{
            marginTop: theme.spacing.md,
            background: theme.colors.backgroundSecondary,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.sm,
            padding: theme.spacing.md,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            fontSize: theme.typography.fontSize.xs,
            color: theme.colors.textSecondary,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}>
            {previewResult ? JSON.stringify(previewResult, null, 2) : "No preview yet"}
          </div>
        </PanelSection>

        <PanelSection
          title="Tool Settings"
          description="Configure tool integration"
          icon={<Wrench size={16} />}
        >
          <label style={labelStyle}>Tool Type</label>
          <VSCodeSelect
            value={toolConfig.toolType || "web-search"}
            options={toolTypeOptions}
            onValueChange={(value: string) =>
              handleConfigChange("toolType", value)
            }
          />

          <label style={labelStyle}>Endpoint</label>
          <VSCodeInput
            value={toolConfig.endpoint || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleConfigChange("endpoint", e.target.value)
            }
            placeholder="https://api.example.com"
          />

          <label style={labelStyle}>API Key</label>
          <VSCodeInput
            value={toolConfig.apiKey || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleConfigChange("apiKey", e.target.value)
            }
            placeholder="sk-..."
          />

          <label style={labelStyle}>Parameters (JSON)</label>
          <VSCodeInput
            value={
              toolConfig.parameters
                ? JSON.stringify(toolConfig.parameters)
                : ""
            }
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              try {
                const parsed = e.target.value
                  ? JSON.parse(e.target.value)
                  : {};
                handleConfigChange("parameters", parsed);
              } catch {
                handleConfigChange("parameters", {});
              }
            }}
            placeholder='{"key":"value"}'
          />
        </PanelSection>
      </div>
    </div>
  );
}

