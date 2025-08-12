"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronDown, Play, Pause, Square, RotateCcw, Download } from "lucide-react";
import { CanvasNode, Connection } from "@/types";
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
import { featureFlags } from "@/config/featureFlags";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/primitives/dialog";

interface FloatingTestingPanelProps {
  nodes: CanvasNode[];
  connections: Connection[];
  isVisible: boolean;
  onClose: () => void;
  isPropertiesPanelVisible: boolean;
  compactMode?: boolean;
  startNodeId?: string | null;
  onTesterEvent?: (event: TesterEvent) => void;
  projectId?: string | null;
  projectName?: string | null;
}

// Timeline component for compact mode
function CompactTimelinePanel({
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
  const colorFor = (s: "running" | "success" | "error"): string =>
    s === "running" ? "#60a5fa" : s === "success" ? "#10b981" : "#ef4444";

  return (
    <div className="mb-2">
      <div className="text-[10px] text-slate-200 mb-1 drop-shadow-sm">Timeline</div>
      <div 
        className="relative rounded-lg overflow-x-auto"
        style={{
          background: "rgba(255, 255, 255, 0.06)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.15)",
        }}
      >
        <div className="p-1 space-y-1 min-w-full">
          {items.map((item, i) => {
            const leftPct = ((item.startedAt - startTs) / total) * 100;
            const widthPct = Math.max(2, ((item.endedAt - item.startedAt) / total) * 100);
            const isSel = selectedId === item.nodeId;
            return (
              <button
                key={item.nodeId + item.startedAt}
                className={`relative h-3 rounded-md text-[9px] text-white font-medium transition-all duration-200 ${
                  isSel ? "" : ""
                }`}
                style={{
                  left: `${leftPct}%`,
                  width: `${widthPct}%`,
                  backgroundColor: colorFor(item.status),
                  border: isSel ? "1px solid rgba(255, 255, 255, 0.3)" : "1px solid rgba(255, 255, 255, 0.1)",
                  boxShadow: isSel 
                    ? `0 0 8px ${colorFor(item.status)}40, inset 0 1px 0 rgba(255, 255, 255, 0.2)` 
                    : "inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                }}
                onClick={() => onSelect(item.nodeId)}
                title={`${item.title} • ${((item.endedAt - item.startedAt) / 1000).toFixed(2)}s`}
              >
                {item.title.length > 8 ? item.title.slice(0, 6) + "..." : item.title}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function FloatingTestingPanel({
  nodes,
  connections,
  isVisible,
  onClose,
  isPropertiesPanelVisible,
  compactMode = false,
  startNodeId = null,
  onTesterEvent,
  projectId = null,
  projectName = null,
}: FloatingTestingPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [scenario, setScenario] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [runTitle, setRunTitle] = useState<string>("Test Run");
  const [seed, setSeed] = useState<string>("");
  const [events, setEvents] = useState<TesterEvent[]>([]);
  const [artifacts, setArtifacts] = useState<NodeExecutionArtifact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [runEndedAt, setRunEndedAt] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState<number>(() => Date.now());
  const [breakpoints, setBreakpoints] = useState<Set<string>>(new Set());
  const [exportOpen, setExportOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportJson, setExportJson] = useState<string>("");

  // Draft map for in-progress node artifacts
  const draftsRef = useRef<Map<string, Partial<NodeExecutionArtifact>>>(new Map());
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
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
    notifyGate();
  }, [notifyGate]);

  const handleTesterEvent = useCallback((evt: TesterEvent) => {
    // Forward event to parent for canvas visualization
    onTesterEvent?.(evt);
    
    // Handle local state updates for the testing panel
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
  }, [onTesterEvent]);

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
        startNodeId ?? null,
        undefined,
        {
          emitTesterEvent: handleTesterEvent,
          beforeNodeExecute: async (node) => {
            const nodeId = node.id;
            const shouldBlock = () => isPausedRef.current || breakpointsRef.current.has(nodeId);
            if (!shouldBlock()) return;
            await new Promise<void>((resolve) => {
              const listener = () => {
                if (!shouldBlock()) {
                  gateListenersRef.current.delete(listener);
                  resolve();
                  return;
                }
                if (stepTokensRef.current > 0) {
                  stepTokensRef.current -= 1;
                  gateListenersRef.current.delete(listener);
                  resolve();
                  return;
                }
              };
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
      console.error("Test run failed:", err);
    }
  }, [connections, nodes, onTesterEvent, scenario, seed, isRunning, startNodeId]);

  const handlePause = useCallback(() => {
    if (!runStartedAt || !isRunning) return;
    setIsPaused((prev) => !prev);
    setTimeout(() => notifyGate(), 0);
  }, [isRunning, notifyGate, runStartedAt]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setEvents([]);
    setArtifacts([]);
    setSelectedId(null);
    setRunStartedAt(null);
    setRunEndedAt(null);
    draftsRef.current.clear();
    stepTokensRef.current = 0;
  }, []);

  const handleStep = useCallback(() => {
    if (!runStartedAt || !isRunning) return;
    stepTokensRef.current += 1;
    notifyGate();
  }, [isRunning, notifyGate, runStartedAt]);

  // Accessibility & shortcuts: Space=Run/Pause, N=Step, B=Toggle Breakpoint (selected)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore when focus is in inputs/textareas/contenteditables or with modifiers
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || "").toLowerCase();
      const isEditable =
        tag === "input" ||
        tag === "textarea" ||
        target?.getAttribute("contenteditable") === "true";

      if (isEditable || e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === " ") {
        e.preventDefault();
        if (isRunning) handlePause();
        else handleRun();
      } else if (e.key.toLowerCase() === "n") {
        handleStep();
      } else if (e.key.toLowerCase() === "b") {
        if (selectedId) toggleBreakpoint(selectedId);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlePause, handleRun, handleStep, isRunning, selectedId, toggleBreakpoint]);

  // Timeline data
  const timelineItems = React.useMemo(() => {
    const items: Array<{
      nodeId: string;
      title: string;
      startedAt: number;
      endedAt: number;
      status: "running" | "success" | "error";
    }> = [];

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
    for (const [nodeId, draft] of draftsRef.current) {
      if (draft.startedAt) {
        items.push({
          nodeId,
          title: draft.title || nodeId,
          startedAt: draft.startedAt,
          endedAt: nowTs,
          status: "running",
        });
      }
    }

    return items.sort((a, b) => a.startedAt - b.startedAt);
  }, [artifacts, nowTs]);

  const selected = artifacts.find((a) => a.nodeId === selectedId);

  // Update nowTs for running items
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setNowTs(Date.now()), 250);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Panel positioning logic
  const getPanelStyle = () => {
    const baseStyle = {
      position: "fixed" as const,
      right: "20px",
      width: "360px",
      zIndex: 1000,
      background: "linear-gradient(145deg, rgba(15, 23, 42, 0.75) 0%, rgba(30, 41, 59, 0.65) 50%, rgba(15, 23, 42, 0.75) 100%)",
      backdropFilter: "blur(12px)",
      border: "none",
      borderRadius: "16px",
      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.06)",
      overflow: "hidden",
    };

    if (compactMode || isPropertiesPanelVisible) {
      // Compact mode - positioned in bottom half when properties panel is visible
      return {
        ...baseStyle,
        top: "calc(50vh + 10px)",
        bottom: "20px",
        height: isCollapsed ? "60px" : undefined,
      };
    } else {
      // Full mode - takes most of the right side
      return {
        ...baseStyle,
        top: "20px",
        bottom: "20px",
        height: isCollapsed ? "60px" : undefined,
      };
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        style={getPanelStyle()}
        className="relative"
      >
        {/* Light diffusion radial gradient */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.05) 0%, transparent 60%)",
            borderRadius: "16px",
          }}
        />
        
        {/* Subtle shimmer overlay */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(45deg, transparent 40%, rgba(255, 255, 255, 0.02) 50%, transparent 60%)",
            animation: "shimmer 10s ease-in-out infinite",
            borderRadius: "16px",
          }}
        />
        <style jsx>{`
          @keyframes shimmer {
            0%, 100% { transform: translateX(-100%) translateY(-100%); }
            50% { transform: translateX(100%) translateY(100%); }
          }
        `}</style>
        {/* Header */}
        <div className="flex items-center justify-between p-4 relative z-10" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.06)" }}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg transition-all duration-200"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "none",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
              }}
            >
              {isCollapsed ? (
                <ChevronRight size={16} className="text-slate-300" />
              ) : (
                <ChevronDown size={16} className="text-slate-300" />
              )}
            </button>
            <h3 className="text-sm font-semibold text-slate-100 drop-shadow-sm">
              Testing Panel
            </h3>
            {compactMode && (
              <span 
                className="text-xs text-slate-300 px-2 py-0.5 rounded-md"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "none",
                }}
              >
                Compact
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-all duration-200"
            style={{
              background: "rgba(255, 255, 255, 0.04)",
              border: "none",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
            }}
          >
            <X size={16} className="text-slate-300" />
          </button>
        </div>

        {/* Content */}
        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-4">
                {/* Controls */}
                <div className="flex items-center gap-2 relative z-10">
                  <button
                    onClick={handleRun}
                    disabled={isRunning}
                    className="flex items-center gap-1 px-3 py-1.5 text-white text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: isRunning 
                        ? "rgba(100, 116, 139, 0.3)" 
                        : "linear-gradient(135deg, rgba(59, 130, 246, 0.7) 0%, rgba(37, 99, 235, 0.8) 100%)",
                      border: "none",
                      boxShadow: isRunning 
                        ? "inset 0 2px 4px rgba(0, 0, 0, 0.2)" 
                        : "0 2px 8px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isRunning) {
                        e.currentTarget.style.background = "linear-gradient(135deg, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 0.9) 100%)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.12)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isRunning) {
                        e.currentTarget.style.background = "linear-gradient(135deg, rgba(59, 130, 246, 0.7) 0%, rgba(37, 99, 235, 0.8) 100%)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.08)";
                      }
                    }}
                  >
                    <Play size={14} />
                    Run
                  </button>
                  <button
                    onClick={handlePause}
                    disabled={!isRunning}
                    className="flex items-center gap-1 px-3 py-1.5 text-white text-sm rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "none",
                      boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.04)",
                    }}
                    onMouseEnter={(e) => {
                      if (isRunning) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                        e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.06)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isRunning) {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                        e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255, 255, 255, 0.04)";
                      }
                    }}
                  >
                    <Pause size={14} />
                    {isPaused ? "Resume" : "Pause"}
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1 px-3 py-1.5 text-white text-sm rounded-lg transition-all duration-200"
                    style={{
                      background: "rgba(255, 255, 255, 0.05)",
                      border: "none",
                      boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.04)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(255, 255, 255, 0.05)";
                      e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255, 255, 255, 0.04)";
                    }}
                  >
                    <RotateCcw size={14} />
                    Reset
                  </button>
                </div>

                {/* Scenario Input */}
                {!compactMode && (
                  <div className="relative z-10">
                    <label className="block text-xs font-medium text-slate-200 mb-1 drop-shadow-sm">
                      Test Scenario
                    </label>
                    <textarea
                      value={scenario}
                      onChange={(e) => setScenario(e.target.value)}
                      placeholder="Describe the test scenario..."
                      className="w-full h-16 px-3 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none resize-none transition-all duration-200"
                      style={{
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "none",
                        borderRadius: "8px",
                        boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
                      }}
                      onFocus={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                        e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(59, 130, 246, 0.3)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                        e.currentTarget.style.boxShadow = "inset 0 2px 4px rgba(0, 0, 0, 0.1)";
                      }}
                    />
                  </div>
                )}

                {/* Timeline */}
                {timelineItems.length > 0 && (
                  <div>
                    {compactMode ? (
                      <CompactTimelinePanel
                        items={timelineItems}
                        startTs={runStartedAt ?? (timelineItems.length ? timelineItems[0].startedAt : nowTs)}
                        endTs={runEndedAt ?? nowTs}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                      />
                    ) : (
                      <div className="relative z-10">
                        <div className="text-xs font-medium text-slate-200 mb-2 drop-shadow-sm">Timeline</div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {timelineItems.map((item) => (
                            <button
                              key={item.nodeId}
                              onClick={() => setSelectedId(item.nodeId)}
                              className={`w-full text-left p-2 rounded-lg text-sm transition-all duration-200 ${
                                selectedId === item.nodeId ? "" : ""
                              }`}
                              style={{
                                background: selectedId === item.nodeId 
                                  ? "rgba(59, 130, 246, 0.12)" 
                                  : "rgba(255, 255, 255, 0.04)",
                                border: "none",
                                boxShadow: selectedId === item.nodeId 
                                  ? "0 2px 8px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.08)" 
                                  : "inset 0 1px 0 rgba(255, 255, 255, 0.03)",
                              }}
                              onMouseEnter={(e) => {
                                if (selectedId !== item.nodeId) {
                                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                                  e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255, 255, 255, 0.05)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (selectedId !== item.nodeId) {
                                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.04)";
                                  e.currentTarget.style.boxShadow = "inset 0 1px 0 rgba(255, 255, 255, 0.03)";
                                }
                              }}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-slate-100 font-medium">{item.title}</span>
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    item.status === "running"
                                      ? "bg-blue-400"
                                      : item.status === "success"
                                      ? "bg-green-400"
                                      : "bg-red-400"
                                  }`}
                                  style={{
                                    boxShadow: `0 0 4px ${
                                      item.status === "running"
                                        ? "rgba(96, 165, 250, 0.6)"
                                        : item.status === "success"
                                        ? "rgba(52, 211, 153, 0.6)"
                                        : "rgba(248, 113, 113, 0.6)"
                                    }`
                                  }}
                                />
                              </div>
                              <div className="text-xs text-slate-300 mt-1">
                                {((item.endedAt - item.startedAt) / 1000).toFixed(2)}s
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Results */}
                {artifacts.length > 0 && (
                  <div className="relative z-10">
                    <div className="text-xs font-medium text-slate-200 mb-2 drop-shadow-sm">Results</div>
                    <div className={`space-y-2 ${compactMode ? "max-h-32" : "max-h-48"} overflow-y-auto`}>
                      {artifacts.map((artifact) => (
                        <ResultCard
                          key={artifact.nodeId}
                          artifact={artifact}
                          selected={selectedId === artifact.nodeId}
                          onClick={() => setSelectedId(artifact.nodeId)}
                          hasBreakpoint={breakpoints.has(artifact.nodeId)}
                          onToggleBreakpoint={() => toggleBreakpoint(artifact.nodeId)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Inspector */}
                {selected && (
                  <div className="relative z-10">
                    <div className="text-xs font-medium text-slate-200 mb-2 drop-shadow-sm">Inspector</div>
                    <div 
                      className="rounded-lg p-3 text-sm"
                      style={{
                        background: "rgba(255, 255, 255, 0.04)",
                        border: "none",
                        boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.1)",
                      }}
                    >
                      <div className="text-slate-100 font-medium mb-2 drop-shadow-sm">{selected.title}</div>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-slate-300">Status:</span>{" "}
                          <span 
                            className={selected.status === "error" ? "text-red-300" : "text-green-300"}
                            style={{
                              textShadow: selected.status === "error" 
                                ? "0 0 4px rgba(248, 113, 113, 0.4)" 
                                : "0 0 4px rgba(52, 211, 153, 0.4)"
                            }}
                          >
                            {selected.status}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-300">Duration:</span>{" "}
                          <span className="text-slate-100">
                            {selected.durationMs ? `${selected.durationMs}ms` : "N/A"}
                          </span>
                        </div>
                        {selected.output && (
                          <div>
                            <span className="text-slate-300">Output:</span>
                            <div 
                              className="mt-1 p-2 rounded-md font-mono text-xs"
                              style={{
                                background: "rgba(0, 0, 0, 0.15)",
                                border: "none",
                                boxShadow: "inset 0 2px 4px rgba(0, 0, 0, 0.15)",
                              }}
                            >
                              <NodeOutputRenderer artifact={selected} />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {artifacts.length === 0 && !isRunning && (
                  <div className="text-center py-8 text-slate-400">
                    <div className="text-sm">No test results yet</div>
                    <div className="text-xs mt-1">Click Run to execute the flow</div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Footer */}
        {featureFlags.mcpExport.enabled && projectId && (
          <div className="flex items-center justify-between p-3 border-t border-slate-600/30 bg-slate-900/30">
            <div className="text-xs text-slate-400">
              MCP Export
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  if (!projectId) return;
                  setExportLoading(true);
                  setExportError(null);
                  try {
                    const res = await fetch(`/api/projects/${projectId}/export/mcp`);
                    const ct = res.headers.get("content-type") || "";
                    const isJson = ct.includes("application/json");
                    const data = isJson ? await res.json().catch(() => null) : null;
                    if (!res.ok || !data) {
                      const msg = isJson ? (data?.message || "Export failed") : `HTTP ${res.status}`;
                      throw new Error(msg);
                    }
                    const pretty = JSON.stringify(data, null, 2);
                    setExportJson(pretty);
                    // Trigger download
                    const filenameBase = (projectName || "project").toLowerCase().replace(/[^a-z0-9-_]+/g, "-").replace(/^-+|-+$/g, "");
                    const blob = new Blob([pretty], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `weev-${filenameBase}-mcp.json`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    setTimeout(() => URL.revokeObjectURL(url), 5000);
                    // Open preview (non-blocking)
                    setExportOpen(true);
                  } catch (err) {
                    console.error("MCP export error:", err);
                    setExportError(err instanceof Error ? err.message : "Unknown error");
                  } finally {
                    setExportLoading(false);
                  }
                }}
                disabled={exportLoading}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white text-sm rounded transition-colors"
                title="Export MCP JSON"
              >
                <Download size={14} />
                {exportLoading ? "Exporting..." : "Export MCP JSON"}
              </button>
            </div>
          </div>
        )}
        <Dialog open={exportOpen} onOpenChange={setExportOpen}>
          <DialogContent className="sm:max-w-[720px]">
            <DialogHeader>
              <DialogTitle>Export Preview{projectName ? ` — ${projectName}` : ""}</DialogTitle>
              <DialogDescription>
                Pretty-printed MCP JSON for quick inspection. Close anytime; testing can continue.
              </DialogDescription>
            </DialogHeader>
            {exportError ? (
              <div className="text-sm text-red-400">{exportError}</div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-auto">
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  <div className="bg-slate-800/40 rounded p-2"><span className="text-slate-400">Name:</span> <span className="text-slate-200">{projectName || "Untitled Project"}</span></div>
                  <div className="bg-slate-800/40 rounded p-2"><span className="text-slate-400">Start Node:</span> <span className="text-slate-200">{startNodeId || "—"}</span></div>
                  <div className="bg-slate-800/40 rounded p-2"><span className="text-slate-400">Nodes:</span> <span className="text-slate-200">{nodes.length}</span></div>
                  <div className="bg-slate-800/40 rounded p-2"><span className="text-slate-400">Connections:</span> <span className="text-slate-200">{connections.length}</span></div>
                </div>
                <pre className="text-xs bg-slate-900/60 p-3 rounded border border-slate-700/40 overflow-auto">
{exportJson}
                </pre>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </AnimatePresence>
  );
}
