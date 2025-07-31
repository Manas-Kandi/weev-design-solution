import React, { useState } from "react";
import { CanvasNode } from "@/types";
import { Input } from "../ui/input";
import PanelSection from "./PanelSection";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../ui/select";
import { Button } from "../ui/button";

interface DashboardNodeData {
  widgets: string[];
  title: string;
  layout: string;
}

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
  const handleFieldChange = (
    field: keyof DashboardNodeData,
    value: unknown
  ) => {
    let updated: DashboardNodeData = { widgets, title, layout };
    if (field === "widgets" && Array.isArray(value)) {
      updated = { ...updated, widgets: value as string[] };
    } else if (field === "title" && typeof value === "string") {
      updated = { ...updated, title: value };
    } else if (field === "layout" && typeof value === "string") {
      updated = { ...updated, layout: value };
    }
    setWidgets(updated.widgets);
    setTitle(updated.title);
    setLayout(updated.layout);
    onChange({ ...node, data: updated });
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-[#23272e] rounded-xl shadow-lg min-w-[320px] max-w-[400px]">
      <PanelSection title="Title" description="Set a title for your dashboard.">
        <Input
          value={title}
          onChange={(e) => {
            handleFieldChange("title", e.target.value);
          }}
          placeholder="Dashboard title..."
        />
      </PanelSection>
      <PanelSection title="Layout" description="Choose the layout style for widgets.">
        <Select
          value={layout}
          onValueChange={(v) => {
            handleFieldChange("layout", v);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose layout" />
          </SelectTrigger>
          <SelectContent>
            {layoutOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PanelSection>
      <PanelSection title="Widgets" description="Manage the widgets displayed on your dashboard.">
        <div className="flex flex-col gap-1">
          {widgets.map((widget, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                value={widget}
                onChange={(e) => {
                  const next = [...widgets];
                  next[idx] = e.target.value;
                  handleFieldChange("widgets", next);
                }}
                className="w-40"
              />
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  const next = widgets.filter((_, i) => i !== idx);
                  handleFieldChange("widgets", next);
                }}
              >
                Remove
              </Button>
            </div>
          ))}
          <Button
            size="sm"
            variant="default"
            onClick={() => {
              const next = [...widgets, "newWidget"];
              handleFieldChange("widgets", next);
            }}
          >
            Add Widget
          </Button>
        </div>
      </PanelSection>
      {/* TODO: Add unit tests for this panel to ensure type safety and prevent regressions. */}
    </div>
  );
}
