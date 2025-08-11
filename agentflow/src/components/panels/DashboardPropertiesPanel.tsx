// All UI rules for properties panels must come from propertiesPanelTheme.ts
import React, { useState } from "react";
import {
  figmaPropertiesTheme as theme,
  getPanelContainerStyle,
} from "./propertiesPanelTheme";
import { CanvasNode, DashboardNodeData } from "@/types";
import { PanelSection } from "../primitives/PanelSection";
import {
  VSCodeInput,
  VSCodeSelect,
  VSCodeButton,
} from "../primitives/vsCodeFormComponents";

interface DashboardPropertiesPanelProps {
  node: CanvasNode;
  onChange: (node: CanvasNode) => void;
}

const layoutOptions = [
  { value: "grid", label: "Grid" },
  { value: "list", label: "List" },
  { value: "custom", label: "Custom" },
];

export default function DashboardPropertiesPanel({
  node,
  onChange,
}: DashboardPropertiesPanelProps) {
  function isDashboardNodeData(data: unknown): data is DashboardNodeData {
    return (
      typeof data === "object" &&
      data !== null &&
      Array.isArray((data as DashboardNodeData).widgets) &&
      typeof (data as DashboardNodeData).title === "string" &&
      typeof (data as DashboardNodeData).layout === "string"
    );
  }

  const safeData: DashboardNodeData = isDashboardNodeData(node.data)
    ? (node.data as DashboardNodeData)
    : { widgets: [], title: "", layout: "grid" };

  const [widgets, setWidgets] = useState<string[]>(safeData.widgets);
  const [title, setTitle] = useState<string>(safeData.title);
  const [layout, setLayout] = useState<string>(safeData.layout);

  // Always update all fields to avoid partial updates
  const handleFieldChange = <K extends keyof DashboardNodeData>(
    field: K,
    value: DashboardNodeData[K],
    setter: (value: DashboardNodeData[K]) => void
  ) => {
    setter(value);
    const updated: DashboardNodeData = {
      ...node.data,
      widgets,
      title,
      layout,
      [field]: value,
    };
    setWidgets(updated.widgets);
    setTitle(updated.title);
    setLayout(updated.layout);
    onChange({ ...node, data: updated });
  };

  // Use theme-driven container style
  const panelStyle = {
    ...getPanelContainerStyle(),
    // Add any panel-specific overrides here if needed
  };

  return (
    <div style={panelStyle}>
      <PanelSection title="Title" description="Set a title for your dashboard.">
        <VSCodeInput
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleFieldChange("title", e.target.value, setTitle)
          }
          placeholder="Dashboard title..."
        />
      </PanelSection>
      <PanelSection
        title="Layout"
        description="Choose the layout style for widgets."
      >
        <VSCodeSelect
          value={layout}
          onValueChange={(v: string) =>
            handleFieldChange("layout", v, setLayout)
          }
          options={layoutOptions}
          placeholder="Choose layout"
        />
      </PanelSection>
      <PanelSection
        title="Widgets"
        description="Manage the widgets displayed on your dashboard."
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing.xs,
          }}
        >
          {widgets.map((widget, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: theme.spacing.xs,
              }}
            >
              <VSCodeInput
                value={widget}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const next = [...widgets];
                  next[idx] = e.target.value;
                  handleFieldChange("widgets", next, setWidgets);
                }}
                style={{ width: 180 }}
              />
              <VSCodeButton
                variant="danger"
                size="small"
                onClick={() => {
                  const next = widgets.filter((_, i) => i !== idx);
                  handleFieldChange("widgets", next, setWidgets);
                }}
              >
                Remove
              </VSCodeButton>
            </div>
          ))}
          <VSCodeButton
            variant="primary"
            size="small"
            onClick={() =>
              handleFieldChange(
                "widgets",
                [...widgets, "newWidget"],
                setWidgets
              )
            }
          >
            Add Widget
          </VSCodeButton>
        </div>
      </PanelSection>
      {/* TODO: Add unit tests for this panel to ensure type safety and prevent regressions. */}
    </div>
  );
}
