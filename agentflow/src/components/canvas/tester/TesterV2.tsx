"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CanvasNode, Connection } from "@/types";
import { TESTER_V2_ENABLED } from "@/lib/flags";
import { runWorkflow } from "@/lib/workflowRunner";
import ResultCard from "@/components/canvas/tester/ResultCard";
import { SummaryText, JSONBlock, KeyValueList, NodeOutputRenderer, LLMRawBlock } from "@/components/canvas/tester/Renderers";
import type {
  TesterEvent,
  NodeExecutionArtifact,
  NodeStartEvent,
  NodeFinishEvent,
  FlowStartedEvent,
  FlowFinishedEvent,
} from "@/types/tester";

interface TesterV2Props {
  nodes: CanvasNode[];
  connections: Connection[];
  onClose: () => void;
  onTesterEvent?: (event: TesterEvent) => void; // mirror events to parent (DesignerCanvas)
}

// --- Timeline (Gantt-like) panel ---
function TimelinePanel({
  items,
  startTs,
  endTs,
  selectedId,
  onSelect,
}: {
  items: Array<{
    nodeId: string;
    title: string;
    startedAt: number;
    endedAt: number;
    status: "running" | "success" | "error";
  }>;
  startTs: number;
  endTs: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const total = Math.max(1, endTs - startTs);

  // Place items into non-overlapping lanes (waves) by time
  type Lane = { lastEnd: number; items: typeof items };
  const lanes: Lane[] = [];
  for (const it of items) {
    let placed = false;
    for (const lane of lanes) {
      if (it.startedAt >= lane.lastEnd) {
        lane.items.push(it);
        lane.lastEnd = it.endedAt;
        placed = true;
        break;
      }
    }
    if (!placed) {
      lanes.push({ lastEnd: it.endedAt, items: [it] });
    }
  }

  const colorFor = (s: "running" | "success" | "error"): string =>
    s === "running" ? "#60a5fa" : s === "success" ? "#10b981" : "#ef4444";

  const fmt = (ms: number): string => `${(ms / 1000).toFixed(2)}s`;

  return (
    <div className="mb-2">
      <div className="text-[11px] text-gray-400 mb-1">Timeline</div>
      <div className="relative border border-gray-800 rounded bg-[#0f1115] overflow-x-auto">
        {/* Axis */}
        <div className="sticky top-0 z-0 text-[10px] text-gray-500 px-2 py-1 border-b border-gray-800 bg-[#0f1115]">
          <div className="flex items-center justify-between">
            <span>0s</span>
            <span>{fmt(total * 0.25)}</span>
            <span>{fmt(total * 0.5)}</span>
            <span>{fmt(total * 0.75)}</span>
            <span>{fmt(total)}</span>
          </div>
        </div>
        {/* Lanes */}
        <div className="p-2 space-y-2 min-w-full">
          {lanes.map((lane, i) => (
            <div key={i} className="relative h-6">
              {/* Lane label */}
              <div className="absolute left-0 -translate-x-[100%] pr-2 h-full flex items-center text-[10px] text-gray-500 select-none">
                Wave {i + 1}
              </div>
              {/* Bars */}
              {lane.items.map((it) => {
                const leftPct = ((it.startedAt - startTs) / total) * 100;
                const widthPct = Math.max(0.5, ((it.endedAt - it.startedAt) / total) * 100);
                const isSel = selectedId === it.nodeId;
                return (
                  <button
                    key={it.nodeId + it.startedAt}
                    title={`${it.title}\n${fmt(it.endedAt - it.startedAt)} • ${new Date(it.startedAt).toLocaleTimeString()} → ${new Date(it.endedAt).toLocaleTimeString()}`}
                    onClick={() => onSelect(it.nodeId)}
                    className={`absolute h-5 rounded-sm border transition-[box-shadow] focus:outline-none ${
                      isSel ? "ring-2 ring-blue-400/60" : ""
                    }`}
                    style={{
                      left: `${leftPct}%`,
                      width: `${widthPct}%`,
                      backgroundColor: colorFor(it.status),
                      borderColor: "rgba(0,0,0,0.25)",
                      boxShadow: isSel
                        ? "0 0 0 1px rgba(59,130,246,0.6), 0 0 10px rgba(59,130,246,0.4)"
                        : "0 1px 0 rgba(0,0,0,0.15)",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
// Initial scaffold: summary-first shell with header, placeholder regions for Timeline and Inspector.
export default function TesterV2({ nodes, connections, onClose, onTesterEvent: onExternalTesterEvent }: TesterV2Props) {
  const [scenario, setScenario] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [runTitle, setRunTitle] = useState<string>("Untitled Run");
  const [seed, setSeed] = useState<string>("");
  const [events, setEvents] = useState<TesterEvent[]>([]);
  const [artifacts, setArtifacts] = useState<NodeExecutionArtifact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [runEndedAt, setRunEndedAt] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState<number>(() => Date.now());
  const [breakpoints, setBreakpoints] = useState<Set<string>>(new Set());

  // Draft map for in-progress node artifacts
  const draftsRef = useRef<Map<string, Partial<NodeExecutionArtifact>>>(new Map());
  // Pause/breakpoint gating refs and listeners
  const isPausedRef = useRef<boolean>(false);
  const breakpointsRef = useRef<Set<string>>(new Set());
  const stepTokensRef = useRef<number>(0);
  const gateListenersRef = useRef<Set<() => void>>(new Set());

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);
  useEffect(() => {
    breakpointsRef.current = breakpoints;
  }, [breakpoints]);

  const notifyGate = useCallback(() => {
    // Snapshot listeners to avoid mutation during iteration
    const listeners = Array.from(gateListenersRef.current);
    for (const fn of listeners) {
      try {
        fn();
      } catch {}
    }
  }, []);

  const toggleBreakpoint = useCallback((nodeId: string) => {
    setBreakpoints((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId); else next.add(nodeId);
      return next;
    });
    // Wake waiters so they can re-check (esp. if removing a breakpoint)
    notifyGate();
  }, [notifyGate]);

  const onTesterEvent = useCallback((evt: TesterEvent) => {
    setEvents((prev) => [...prev, evt]);
    switch (evt.type) {
      case "flow-started": {
        const e = evt as FlowStartedEvent;
        setRunStartedAt(e.at);
        setRunEndedAt(null);
        setIsPaused(false);
        break;
      }
      case "node-started": {
        const e = evt as NodeStartEvent;
        const draft: Partial<NodeExecutionArtifact> = {
          nodeId: e.nodeId,
          title: e.title,
          nodeType: e.nodeType,
          nodeSubtype: e.nodeSubtype,
          cause: e.cause,
          startedAt: e.at,
          flowContextBefore: e.flowContextBefore,
        };
        draftsRef.current.set(e.nodeId, draft);
        // If paused or breakpoint, auto-focus the waiting node for preview
        if (isPausedRef.current || breakpointsRef.current.has(e.nodeId)) {
          setSelectedId((cur) => cur ?? e.nodeId);
        }
        break;
      }
      case "node-finished": {
        const e = evt as NodeFinishEvent;
        const existingDraft = draftsRef.current.get(e.nodeId) || {};
        const startedAt = existingDraft.startedAt ?? Math.max(0, e.at - (e.durationMs || 0));
        const artifact: NodeExecutionArtifact = {
          nodeId: e.nodeId,
          title: existingDraft.title ?? e.title,
          nodeType: existingDraft.nodeType ?? e.nodeType,
          nodeSubtype: existingDraft.nodeSubtype ?? e.nodeSubtype,
          cause: existingDraft.cause ?? { kind: "all-inputs-ready", inputCount: 0 },
          startedAt,
          endedAt: e.at,
          durationMs: e.durationMs,
          status: e.status,
          output: e.output,
          summary: e.summary,
          error: e.error,
          flowContextBefore: existingDraft.flowContextBefore ?? e.flowContextBefore,
          flowContextAfter: e.flowContextAfter,
          flowContextDiff: e.flowContextDiff,
        };
        draftsRef.current.delete(e.nodeId);
        setArtifacts((prev) => {
          const others = prev.filter((a) => a.nodeId !== artifact.nodeId);
          const next = [...others, artifact];
          next.sort((a, b) => a.startedAt - b.startedAt || a.endedAt - b.endedAt);
          return next;
        });
        break;
      }
      case "flow-finished": {
        const e = evt as FlowFinishedEvent;
        setRunEndedAt(e.at);
        setIsRunning(false);
        setIsPaused(false);
        break;
      }
    }
    // Mirror to parent so canvas can update live highlighting/pulses
    try {
      onExternalTesterEvent?.(evt);
    } catch {
      // no-op: parent handler optional
    }
  }, [onExternalTesterEvent]);

  const handleRun = useCallback(async () => {
    if (isRunning) return;
    setIsRunning(true);
    setEvents([]);
    setArtifacts([]);
    draftsRef.current.clear();
    setSelectedId(null);
    setRunStartedAt(null);
    setRunEndedAt(null);
    setIsPaused(false);
    stepTokensRef.current = 0;

    try {
      await runWorkflow(
        nodes,
        connections,
        /* startNodeId */ null,
        /* emitLog */ undefined,
        {
          emitTesterEvent: onTesterEvent,
          beforeNodeExecute: async (node) => {
            const nodeId = node.id;
            const shouldBlock = () => isPausedRef.current || breakpointsRef.current.has(nodeId);
            if (!shouldBlock()) return;
            // Wait until unpaused or a step token is available
            await new Promise<void>((resolve) => {
              const listener = () => {
                // If unpaused and breakpoint not set -> proceed
                if (!shouldBlock()) {
                  gateListenersRef.current.delete(listener);
                  resolve();
                  return;
                }
                // If a step token is available, consume and proceed
                if (stepTokensRef.current > 0) {
                  stepTokensRef.current -= 1;
                  gateListenersRef.current.delete(listener);
                  resolve();
                  return;
                }
              };
              // Register and run initial check to handle race conditions
              gateListenersRef.current.add(listener);
              try { listener(); } catch {}
            });
          },
        },
        {
          scenario: { description: scenario || undefined },
          overrides: { seed: (seed || "").trim() || undefined },
        }
      );
    } catch (err) {
      // Surface a synthetic error finish event
      const at = Date.now();
      onTesterEvent({ type: "flow-finished", at, durationMs: runStartedAt ? at - runStartedAt : 0 });
    } finally {
      // Safety fallback in case flow-finished didn't fire
      setIsRunning(false);
    }
  }, [connections, nodes, isRunning, onTesterEvent, runStartedAt]);

  // Derive selected artifact and ensure selection follows latest when empty
  const selected = useMemo(() => artifacts.find((a) => a.nodeId === selectedId) || null, [artifacts, selectedId]);

  useEffect(() => {
    if (!selectedId && artifacts.length > 0) {
      setSelectedId(artifacts[artifacts.length - 1].nodeId);
    } else if (selectedId && !artifacts.some((a) => a.nodeId === selectedId)) {
      // Selected artifact no longer exists (reset/run) -> clear
      setSelectedId(null);
    }
  }, [artifacts, selectedId]);

  // Map nodeId -> provider:model for per-card badge
  const providerModelByNodeId = useMemo(() => {
    const map = new Map<string, string>();
    for (const n of nodes) {
      const d = (n as { data?: Record<string, unknown> }).data;
      const provider = typeof d?.provider === "string" ? (d.provider as string) : undefined;
      const model = typeof d?.model === "string" ? (d.model as string) : undefined;
      if (provider || model) map.set(n.id, `${provider ?? "unknown"}:${model ?? "default"}`);
    }
    return map;
  }, [nodes]);

  // Live elapsed ticker while running
  useEffect(() => {
    if (!isRunning || !runStartedAt) return;
    const id = setInterval(() => setNowTs(Date.now()), 250);
    return () => clearInterval(id);
  }, [isRunning, runStartedAt]);

  const elapsedMs = useMemo(() => {
    if (!runStartedAt) return 0;
    const end = runEndedAt ?? nowTs;
    return Math.max(0, end - runStartedAt);
  }, [runStartedAt, runEndedAt, nowTs]);

  const hasError = useMemo(() => artifacts.some((a) => a.status === "error"), [artifacts]);
  const statusLabel = runStartedAt
    ? isRunning
      ? isPaused
        ? "Paused"
        : "Running"
      : hasError
      ? "Error"
      : "Finished"
    : "Idle";

  const statusClass =
    statusLabel === "Running"
      ? "bg-blue-600 text-white"
      : statusLabel === "Paused"
      ? "bg-amber-500 text-white"
      : statusLabel === "Finished"
      ? "bg-emerald-600 text-white"
      : statusLabel === "Error"
      ? "bg-red-600 text-white"
      : "bg-gray-300 text-gray-800";

  // Aggregate provider:model badges from nodes (Agent/ToolAgent primarily)
  const providerModels = useMemo(() => {
    const set = new Set<string>();
    for (const n of nodes) {
      const d = (n as { data?: Record<string, unknown> }).data;
      const provider = typeof d?.provider === "string" ? (d.provider as string) : undefined;
      const model = typeof d?.model === "string" ? (d.model as string) : undefined;
      if (provider || model) set.add(`${provider ?? "unknown"}:${model ?? "default"}`);
    }
    return Array.from(set);
  }, [nodes]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setEvents([]);
    setArtifacts([]);
    draftsRef.current.clear();
    setSelectedId(null);
    setRunStartedAt(null);
    setRunEndedAt(null);
    setBreakpoints(new Set());
    stepTokensRef.current = 0;
    // Ensure any waiting gates get released to avoid dangling promises
    notifyGate();
  }, []);

  const handlePause = useCallback(() => {
    if (!runStartedAt || !isRunning) return;
    setIsPaused((p) => !p);
    // If resuming, wake waiters; if pausing, no-op (new nodes will wait)
    setTimeout(() => notifyGate(), 0);
  }, [isRunning, notifyGate, runStartedAt]);

  const handleStep = useCallback(() => {
    if (!runStartedAt || !isRunning) return;
    // Grant a single step token and wake waiters
    stepTokensRef.current += 1;
    notifyGate();
  }, [isRunning, notifyGate, runStartedAt]);

  const handleShare = useCallback(async () => {
    const payload = {
      title: runTitle,
      scenario,
      status: statusLabel,
      startedAt: runStartedAt,
      endedAt: runEndedAt,
      elapsedMs,
      providerModels,
      seed: seed || undefined,
      nodesCount: nodes.length,
      connectionsCount: connections.length,
      artifacts,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    } catch {}
  }, [artifacts, connections.length, elapsedMs, nodes.length, providerModels, runEndedAt, runStartedAt, runTitle, scenario, seed, statusLabel]);

  const handleExport = useCallback(() => {
    const payload = {
      title: runTitle,
      scenario,
      status: statusLabel,
      startedAt: runStartedAt,
      endedAt: runEndedAt,
      elapsedMs,
      providerModels,
      seed: seed || undefined,
      events,
      artifacts,
      nodes,
      connections,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    a.download = `agentflow-run-${ts}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [artifacts, connections, elapsedMs, events, nodes, providerModels, runEndedAt, runStartedAt, runTitle, scenario, seed, statusLabel]);

  // Accessibility & shortcuts: Space=Run/Pause, N=Step, B=Toggle Breakpoint (selected)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore when focus is in inputs/textareas or with modifiers
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === " ") {
        e.preventDefault();
        if (isRunning) handlePause(); else handleRun();
      } else if (e.key.toLowerCase() === "n") {
        handleStep();
      } else if (e.key.toLowerCase() === "b") {
        if (selectedId) toggleBreakpoint(selectedId);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlePause, handleRun, handleStep, isRunning, selectedId, toggleBreakpoint]);

  // --- Timeline data (Gantt-like) ---
  type TimelineItem = {
    nodeId: string;
    title: string;
    startedAt: number;
    endedAt: number; // for running items, this is nowTs
    status: "running" | "success" | "error";
  };

  const timelineItems = useMemo<TimelineItem[]>(() => {
    const items: TimelineItem[] = [];
    // Finished artifacts
    for (const a of artifacts) {
      if (a.startedAt && a.endedAt) {
        items.push({
          nodeId: a.nodeId,
          title: a.title || a.nodeId,
          startedAt: a.startedAt,
          endedAt: a.endedAt,
          status: a.status === "error" ? "error" : "success",
        });
      }
    }
    // Running drafts
    draftsRef.current.forEach((draft, nodeId) => {
      const s = (draft.startedAt as number) || 0;
      if (s > 0) {
        items.push({
          nodeId,
          title: (draft.title as string) || nodeId,
          startedAt: s,
          endedAt: nowTs,
          status: "running",
        });
      }
    });
    // Sort by start
    items.sort((a, b) => a.startedAt - b.startedAt || a.endedAt - b.endedAt);
    return items;
  }, [artifacts, nowTs]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="w-full rounded-none bg-transparent text-gray-200 p-0"
    >
      {/* Persistent Run Header */}
      <div className="sticky top-0 z-20 bg-[#0f1115]/95 backdrop-blur supports-[backdrop-filter]:bg-[#0f1115]/80 pb-1 mb-2 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-100">Agentic Tester (V2)</h2>
            <span className="text-[10px] uppercase tracking-wide rounded px-2 py-0.5 bg-gray-800 text-gray-200">
              {TESTER_V2_ENABLED ? "Enabled" : "Disabled"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Title, Status, Elapsed */}
          <div className="flex items-center gap-3 min-w-0">
            <input
              className="h-8 w-[220px] truncate rounded bg-[#121316] border border-gray-700 text-gray-200 placeholder:text-gray-500 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              value={runTitle}
              onChange={(e) => setRunTitle(e.target.value)}
              placeholder="Untitled Run"
              aria-label="Run title"
            />
            <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] ${statusClass}`}>{statusLabel}</span>
            <span className="text-[11px] text-gray-400">Elapsed: {(elapsedMs / 1000).toFixed(2)}s</span>
          </div>

          {/* Middle: provider/model badges, seed */}
          <div className="flex items-center gap-2 min-w-0">
            {providerModels.length === 0 ? (
              <span className="text-[11px] text-gray-400">Provider/Model: default</span>
            ) : providerModels.length <= 2 ? (
              providerModels.map((pm) => (
                <span key={pm} className="text-[11px] rounded border border-gray-700 px-2 py-0.5 text-gray-200 bg-[#121316]">
                  {pm}
                </span>
              ))
            ) : (
              <>
                {providerModels.slice(0, 2).map((pm) => (
                  <span key={pm} className="text-[11px] rounded border border-gray-700 px-2 py-0.5 text-gray-200 bg-[#121316]">
                    {pm}
                  </span>
                ))}
                <span className="text-[11px] text-gray-500">+{providerModels.length - 2} more</span>
              </>
            )}
            <div className="flex items-center gap-1">
              <label className="text-[11px] text-gray-400" htmlFor="seed-input">Seed</label>
              <input
                id="seed-input"
                className="h-7 w-[90px] rounded bg-[#121316] border border-gray-700 text-gray-200 placeholder:text-gray-500 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                placeholder="auto"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
              />
            </div>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-2">
            <button
              className="h-8 px-3 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleRun}
              disabled={isRunning}
            >
              {isRunning ? "Running…" : "Run"}
            </button>
            <button
              className="h-8 px-3 text-sm rounded bg-[#1a1c20] border border-gray-700 text-gray-200 hover:bg-[#1f2227] disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleStep}
              disabled={!isRunning}
              title="Step-through coming soon"
            >
              Step
            </button>
            <button
              className="h-8 px-3 text-sm rounded bg-[#1a1c20] border border-gray-700 text-gray-200 hover:bg-[#1f2227] disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handlePause}
              disabled={!isRunning}
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button
              className="h-8 px-3 text-sm rounded bg-[#1a1c20] border border-gray-700 text-gray-200 hover:bg-[#1f2227]"
              onClick={handleReset}
            >
              Reset
            </button>
            <button
              className="h-8 px-3 text-sm rounded bg-[#1a1c20] border border-gray-700 text-gray-200 hover:bg-[#1f2227]"
              onClick={handleShare}
            >
              Share
            </button>
            <button
              className="h-8 px-3 text-sm rounded bg-[#1a1c20] border border-gray-700 text-gray-200 hover:bg-[#1f2227]"
              onClick={handleExport}
            >
              Export
            </button>
            <button
              className="h-8 px-3 text-sm rounded bg-[#1a1c20] border border-gray-700 text-gray-200 hover:bg-[#1f2227]"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-12 gap-3">
        {/* Left: Scenario */}
        <aside className="col-span-3 rounded-lg border border-gray-800 bg-[#101214] p-2">
          <div className="text-xs font-medium text-gray-400 mb-2">Scenario</div>
          <textarea
            className="w-full h-20 border border-gray-800 bg-[#0f1115] text-gray-200 rounded p-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            placeholder="Describe the test scenario..."
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
          />
          <div className="mt-3 text-[11px] text-gray-400">
            {nodes.length} nodes • {connections.length} connections
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            {runStartedAt && (
              <span>
                Started: {new Date(runStartedAt).toLocaleTimeString()} {runEndedAt && `• Duration: ${((runEndedAt - runStartedAt) / 1000).toFixed(2)}s`}
              </span>
            )}
          </div>
        </aside>

        {/* Center: Timeline/Results */}
        <main className="col-span-6 rounded-lg border border-gray-800 bg-[#101214] p-2 min-h-[220px]">
          <div className="text-xs font-medium text-gray-400 mb-2">Run Timeline & Results</div>
          {/* Timeline (Gantt-like) */}
          {(runStartedAt || timelineItems.length > 0) && (
            <TimelinePanel
              items={timelineItems}
              startTs={runStartedAt ?? (timelineItems.length ? timelineItems[0].startedAt : nowTs)}
              endTs={runEndedAt ?? nowTs}
              selectedId={selectedId}
              onSelect={(id) => setSelectedId(id)}
            />
          )}
          {artifacts.length === 0 ? (
            <p className="text-sm text-gray-400">No results yet. Click Run to execute the flow.</p>
          ) : (
            <ul className="space-y-2">
              {artifacts.map((a) => (
                <li key={a.nodeId}>
                  <ResultCard
                    artifact={a}
                    providerModel={providerModelByNodeId.get(a.nodeId)}
                    selected={selectedId === a.nodeId}
                    onClick={() => setSelectedId(a.nodeId)}
                    hasBreakpoint={breakpoints.has(a.nodeId)}
                    onToggleBreakpoint={() => toggleBreakpoint(a.nodeId)}
                  />
                </li>
              ))}
            </ul>
          )}
        </main>

        {/* Right: Inspector */}
        <section className="col-span-3 rounded-lg border border-gray-800 bg-[#101214] p-2">
          <div className="text-xs font-medium text-gray-400 mb-2">Inspector</div>
          {!selected ? (
            <p className="text-sm text-gray-400">Select a step to view details.</p>
          ) : (
            <InspectorPanel
              artifact={selected}
              providerModel={providerModelByNodeId.get(selected.nodeId)}
              hasBreakpoint={breakpoints.has(selected.nodeId)}
              onToggleBreakpoint={() => toggleBreakpoint(selected.nodeId)}
            />
          )}
        </section>
      </div>
    </div>
  );
}

function InspectorPanel({
  artifact,
  providerModel,
  hasBreakpoint,
  onToggleBreakpoint,
}: {
  artifact: NodeExecutionArtifact;
  providerModel?: string;
  hasBreakpoint?: boolean;
  onToggleBreakpoint?: () => void;
}) {
  type TabId = "summary" | "output" | "inputs" | "llm" | "trace" | "errors";
  type TabDef = { id: TabId; label: string; disabled?: boolean };
  const [tab, setTab] = useState<TabId>("summary");
  const outputObj: Record<string, unknown> | null =
    artifact.output && typeof artifact.output === "object" && !Array.isArray(artifact.output)
      ? (artifact.output as Record<string, unknown>)
      : null;
  const isLLM = !!(outputObj && ("gemini" in outputObj || "llm" in outputObj));

  //

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="min-w-0">
          <div className="text-sm font-medium text-gray-100 truncate">{artifact.title || artifact.nodeId}</div>
          <div className="text-[11px] text-gray-500 truncate">{artifact.nodeType}{artifact.nodeSubtype ? `:${artifact.nodeSubtype}` : ""}</div>
        </div>
        <div className="flex items-center gap-2">
          {onToggleBreakpoint && (
            <button
              type="button"
              title={hasBreakpoint ? "Remove breakpoint" : "Add breakpoint"}
              aria-pressed={!!hasBreakpoint}
              onClick={() => onToggleBreakpoint?.()}
              className={`inline-flex items-center justify-center h-5 w-5 rounded-full border text-[10px] ${
                hasBreakpoint ? "border-red-500 bg-red-500/20 text-red-400" : "border-gray-600 text-gray-400 hover:bg-[#1a1c20]"
              }`}
            >
              B
            </button>
          )}
          {providerModel && (
            <span className="text-[11px] rounded border border-gray-700 px-2 py-0.5 text-gray-200 bg-[#121316] whitespace-nowrap">
              {providerModel}
            </span>
          )}
          <span className="text-[11px] text-gray-400 whitespace-nowrap">{((artifact.durationMs || 0) / 1000).toFixed(2)}s</span>
        </div>
      </div>

      {/* Quick metadata */}
      <div className="mb-2">
        <KeyValueList
          obj={{
            cause: ((): string | undefined => {
              const c = (artifact as unknown as { cause?: { kind?: string } }).cause;
              return c?.kind;
            })(),
            startedAt: artifact.startedAt ? new Date(artifact.startedAt).toLocaleTimeString() : undefined,
            endedAt: artifact.endedAt ? new Date(artifact.endedAt).toLocaleTimeString() : undefined,
          }}
        />
      </div>

      {/* Tabs (expanded views by default) */}
      <div className="flex items-center gap-1 text-[11px]">
        {([
          { id: "summary", label: "Summary" },
          { id: "output", label: "Output" },
          { id: "inputs", label: "Inputs" },
          { id: "llm", label: "LLM", disabled: !isLLM },
          { id: "trace", label: "Trace" },
          { id: "errors", label: "Errors" },
        ] as TabDef[]).map((t) => (
          <button
            key={t.id}
            disabled={!!t.disabled}
            onClick={() => setTab(t.id)}
            className={`px-2 py-1 rounded ${tab === t.id ? "bg-gray-800 text-gray-100" : "text-gray-400 hover:bg-[#1a1c20]"} ${t.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-2">
        {tab === "summary" && <SummaryText text={artifact.summary} maxChars={2000} />}
        {tab === "output" && (
          <div className="text-[11px] text-gray-200">
            <NodeOutputRenderer artifact={artifact} />
          </div>
        )}
        {tab === "inputs" && (
          <div className="text-[11px] text-gray-200">
            <div className="mb-1 font-medium">flowContextBefore</div>
            <JSONBlock value={artifact.flowContextBefore} className="max-h-[420px]" />
          </div>
        )}
        {tab === "llm" && isLLM && (
          <div className="text-[11px] text-gray-200">
            <LLMRawBlock outputObj={outputObj} className="max-h-[420px]" />
          </div>
        )}
        {tab === "trace" && (
          <div className="text-[11px] text-gray-200 space-y-2">
            <div>
              <div className="font-medium">Flow Context Diff</div>
              <JSONBlock value={artifact.flowContextDiff} className="max-h-[220px]" />
            </div>
            <div>
              <div className="font-medium">flowContextAfter</div>
              <JSONBlock value={artifact.flowContextAfter} className="max-h-[220px]" />
            </div>
          </div>
        )}
        {tab === "errors" && <div className="text-sm text-red-600">{artifact.error || "(no errors)"}</div>}
      </div>
    </div>
  );
}
 
