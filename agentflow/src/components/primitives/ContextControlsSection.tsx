import React from "react";
import { CanvasNode, Connection } from "@/types";
import { ContextControls, TransformSpec } from "@/types/flow-io";
import { PanelSection } from "./PanelSection";
import { figmaPropertiesTheme as theme, themeHelpers } from "../panels/propertiesPanelTheme";
import { VSCodeInput, VSCodeButton } from "./vsCodeFormComponents";

interface ContextControlsSectionProps {
  node: CanvasNode;
  nodes: CanvasNode[];
  connections: Connection[];
  onConnectionsChange: (next: Connection[]) => void;
}

function getNodeTitle(node?: CanvasNode): string {
  if (!node) return "";
  const d = node.data as unknown;
  if (d && typeof d === "object" && !Array.isArray(d)) {
    const obj = d as Record<string, unknown>;
    const title = obj["title"];
    if (typeof title === "string" && title.trim().length > 0) {
      return title;
    }
    const description = obj["description"];
    if (typeof description === "string" && description.trim().length > 0) {
      return description;
    }
  }
  return node.id;
}

function parseCsv(input: string): string[] | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  return trimmed
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function stringifyCsv(list?: string[]): string {
  return Array.isArray(list) ? list.join(", ") : "";
}

function parseRenameMap(input: string): Record<string, string> | undefined {
  const trimmed = input.trim();
  if (!trimmed) return undefined;

  // Try JSON first
  try {
    const obj = JSON.parse(trimmed);
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      const result: Record<string, string> = {};
      for (const [k, v] of Object.entries(obj)) {
        if (typeof v === "string") result[k] = v;
      }
      return Object.keys(result).length ? result : undefined;
    }
  } catch (_) {
    // not JSON; fall back to colon CSV: "a:b, c:d"
  }

  const pairs = trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  const map: Record<string, string> = {};
  for (const pair of pairs) {
    const [from, to] = pair.split(":").map((s) => s.trim());
    if (from && to) map[from] = to;
  }
  return Object.keys(map).length ? map : undefined;
}

function stringifyRenameMap(map?: Record<string, string>): string {
  if (!map || Object.keys(map).length === 0) return "";
  return Object.entries(map)
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

export const ContextControlsSection: React.FC<ContextControlsSectionProps> = ({
  node,
  nodes,
  connections,
  onConnectionsChange,
}) => {
  type ConnWithOptionalControls = Connection & { contextControls?: ContextControls };

  const getContextControls = (c: Connection): ContextControls | undefined => {
    return (c as unknown as { contextControls?: ContextControls }).contextControls;
  };

  const applyControls = (c: Connection, cc?: ContextControls): Connection => {
    const base: ConnWithOptionalControls = { ...(c as ConnWithOptionalControls) };
    if (cc && Object.keys(cc).length > 0) {
      base.contextControls = cc;
    } else {
      delete base.contextControls;
    }
    return base;
  };

  const incoming = React.useMemo(
    () => connections.filter((c) => c.targetNode === node.id),
    [connections, node.id]
  );

  const updateConn = (connId: string, updater: (c: Connection) => Connection) => {
    const next = connections.map((c) => (c.id === connId ? updater(c) : c));
    onConnectionsChange(next);
  };

  const buildHeaderChip = (conn: Connection) => {
    const upstream = nodes.find((n) => n.id === conn.sourceNode);
    const upstreamTitle = getNodeTitle(upstream);
    return (
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: theme.spacing.sm,
          alignItems: "center",
          color: theme.colors.textSecondary,
          fontSize: theme.typography.fontSize.xs,
        }}
      >
        <span
          style={{
            backgroundColor: theme.colors.tagBackground,
            padding: "2px 6px",
            borderRadius: theme.borderRadius.xs,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          {upstreamTitle}
        </span>
        <span>→</span>
        <span
          style={{
            backgroundColor: theme.colors.tagBackground,
            padding: "2px 6px",
            borderRadius: theme.borderRadius.xs,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          {conn.targetInput}
        </span>
      </div>
    );
  };

  if (incoming.length === 0) return null;

  return (
    <PanelSection
      title="Advanced ▶ Context"
      description="Per-connection controls for upstream context propagation"
      defaultCollapsed={true}
      level={1}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: theme.spacing.lg }}>
        {incoming.map((conn) => {
          const controls = getContextControls(conn);
          const blocked = !!controls?.blocked;
          const weight = typeof controls?.weight === "number" ? controls!.weight : undefined;
          const control: TransformSpec | undefined = controls?.control;
          const pickCsv = stringifyCsv(control?.pickPaths);
          const dropCsv = stringifyCsv(control?.dropPaths);
          const renameStr = stringifyRenameMap(control?.rename);

          return (
            <div
              key={conn.id}
              style={{
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.sm,
                backgroundColor: theme.colors.backgroundSecondary,
                padding: theme.spacing.md,
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing.md,
              }}
            >
              {buildHeaderChip(conn)}

              {/* Row: Weight & Block */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: theme.spacing.md }}>
                <div>
                  <label style={themeHelpers.getLabelStyle()} title="Advisory weight for this upstream source (used in metadata)">
                    Weight
                  </label>
                  <VSCodeInput
                    type="number"
                    min={0}
                    step={0.1}
                    placeholder="1"
                    value={weight ?? ""}
                    onChange={(e) => {
                      const v = (e.target as HTMLInputElement).value;
                      updateConn(conn.id, (c) => {
                        const cc: ContextControls = { ...(getContextControls(c) || {}) };
                        const num = v === "" ? undefined : Number(v);
                        if (typeof num === "number" && !Number.isNaN(num)) cc.weight = num;
                        else delete (cc as { weight?: number }).weight;
                        return applyControls(c, cc);
                      });
                    }}
                    disabled={blocked}
                  />
                </div>
                <div>
                  <label style={themeHelpers.getLabelStyle()} title="If enabled, this upstream is excluded entirely from inputs and transitive context">
                    Block upstream
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: theme.spacing.sm }}>
                    <input
                      type="checkbox"
                      checked={blocked}
                      onChange={(e) => {
                        const checked = e.currentTarget.checked;
                        updateConn(conn.id, (c) => {
                          const cc: ContextControls = { ...(getContextControls(c) || {}) };
                          cc.blocked = checked;
                          // When blocked, we can optionally clear other controls to avoid confusion
                          if (checked) {
                            delete (cc as { weight?: number }).weight;
                            delete (cc as { control?: TransformSpec }).control;
                          }
                          return applyControls(c, cc);
                        });
                      }}
                      title="Exclude this upstream entirely"
                      style={{ width: 16, height: 16 }}
                    />
                    <span style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary }}>
                      Exclude this source
                    </span>
                  </div>
                </div>
              </div>

              {/* Row: Transform Controls */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: theme.spacing.md }}>
                <div>
                  <label style={themeHelpers.getLabelStyle()} title="Keep only these top-level keys when upstream output is an object">
                    Pick keys
                  </label>
                  <VSCodeInput
                    placeholder="key1, key2"
                    value={pickCsv}
                    onChange={(e) => {
                      const v = (e.target as HTMLInputElement).value;
                      updateConn(conn.id, (c) => {
                        const cc: ContextControls = { ...(getContextControls(c) || {}) };
                        const ctl: TransformSpec = { ...(cc.control || {}) };
                        const list = parseCsv(v);
                        if (list && list.length) ctl.pickPaths = list; else delete (ctl as { pickPaths?: string[] }).pickPaths;
                        cc.control = Object.keys(ctl).length ? ctl : undefined;
                        return applyControls(c, cc);
                      });
                    }}
                    disabled={blocked}
                  />
                </div>
                <div>
                  <label style={themeHelpers.getLabelStyle()} title="Drop these top-level keys when upstream output is an object">
                    Drop keys
                  </label>
                  <VSCodeInput
                    placeholder="keyA, keyB"
                    value={dropCsv}
                    onChange={(e) => {
                      const v = (e.target as HTMLInputElement).value;
                      updateConn(conn.id, (c) => {
                        const cc: ContextControls = { ...(getContextControls(c) || {}) };
                        const ctl: TransformSpec = { ...(cc.control || {}) };
                        const list = parseCsv(v);
                        if (list && list.length) ctl.dropPaths = list; else delete (ctl as { dropPaths?: string[] }).dropPaths;
                        cc.control = Object.keys(ctl).length ? ctl : undefined;
                        return applyControls(c, cc);
                      });
                    }}
                    disabled={blocked}
                  />
                </div>
              </div>

              <div>
                <label
                  style={themeHelpers.getLabelStyle()}
                  title={`Rename top-level keys: JSON (e.g. {"old":"new"}) or pairs (old:new, a:b)`}
                >
                  Rename keys
                </label>
                <VSCodeInput
                  placeholder="old:new, a:b"
                  value={renameStr}
                  onChange={(e) => {
                    const v = (e.target as HTMLInputElement).value;
                    updateConn(conn.id, (c) => {
                      const cc: ContextControls = { ...(getContextControls(c) || {}) };
                      const ctl: TransformSpec = { ...(cc.control || {}) };
                      const map = parseRenameMap(v);
                      if (map && Object.keys(map).length) ctl.rename = map; else delete (ctl as { rename?: Record<string, string> }).rename;
                      cc.control = Object.keys(ctl).length ? ctl : undefined;
                      return applyControls(c, cc);
                    });
                  }}
                  disabled={blocked}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.textMuted }}>
                  Defaults: weight 1, not blocked, no transform
                </span>
                <VSCodeButton
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    updateConn(conn.id, (c) => applyControls(c, undefined));
                  }}
                >
                  Reset
                </VSCodeButton>
              </div>
            </div>
          );
        })}
      </div>
    </PanelSection>
  );
};

export default ContextControlsSection;
