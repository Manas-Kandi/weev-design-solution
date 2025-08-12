"use client";

import React, { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  ChevronRight, 
  ChevronDown, 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Settings, 
  Download, 
  Upload, 
  History, 
  Plus, 
  Minus,
  Clock,
  AlertCircle,
  CheckCircle,
  Zap,
  Database,
  Globe,
  Shield
} from "lucide-react";
import { CanvasNode, Connection } from "@/types";
import { runWorkflow } from "@/lib/workflowRunner";
import { toolSimulator } from '@/lib/toolSimulator';

import ResultCard from "@/components/canvas/tester/ResultCard";
import { ToolMockEditor } from './tester/ToolMockEditor';
import { ScenarioInput } from './tester/ScenarioInput';
import { EnvironmentSelector } from './tester/EnvironmentSelector';
import { RunHistory } from './tester/RunHistory';
import type {
  TesterEvent,
  NodeExecutionArtifact,
  NodeStartEvent,
  NodeFinishEvent,
  FlowStartedEvent,
  FlowFinishedEvent,
  RunManifest,
} from "@/types/tester";
import type { ToolEnvironment } from "@/types/toolSimulator";
import type { ToolMockProfile } from "@/types/toolSimulator";

interface EnhancedTestingPanelProps {
  nodes: CanvasNode[];
  connections: Connection[];
  isVisible: boolean;
  onClose: () => void;
  isPropertiesPanelVisible: boolean;
  compactMode?: boolean;
  startNodeId?: string | null;
  onTesterEvent?: (event: TesterEvent) => void;
  onNodeSelect?: (nodeId: string) => void;
}


// Timeline component
function Timeline({
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
  
  const colorFor = (status: string) => {
    switch (status) {
      case "running": return "#60a5fa";
      case "success": return "#10b981";
      case "error": return "#ef4444";
      default: return "#6b7280";
    }
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-300">Timeline</h3>
        <span className="text-xs text-slate-500">
          {Math.round(total / 1000)}s total
        </span>
      </div>
      <div className="relative h-8 bg-slate-800 rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex items-center px-2">
          {items.map((item, index) => {
            const left = ((item.startedAt - startTs) / total) * 100;
            const width = Math.max(2, ((item.endedAt - item.startedAt) / total) * 100);
            const isSelected = selectedId === item.nodeId;
            
            return (
              <motion.button
                key={`${item.nodeId}-${index}`}
                className={`absolute h-4 rounded text-xs font-medium transition-all ${
                  isSelected ? 'ring-2 ring-blue-400' : ''
                }`}
                style={{
                  left: `${left}%`,
                  width: `${width}%`,
                  backgroundColor: colorFor(item.status),
                }}
                onClick={() => onSelect(item.nodeId)}
                title={`${item.title} • ${((item.endedAt - item.startedAt) / 1000).toFixed(1)}s`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <span className="sr-only">{item.title}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Status indicator
function StatusIndicator({ status }: { status: string }) {
  const statusConfig = {
    idle: { icon: Clock, color: 'text-slate-400', text: 'Idle' },
    running: { icon: Zap, color: 'text-blue-400', text: 'Running' },
    paused: { icon: Pause, color: 'text-yellow-400', text: 'Paused' },
    finished: { icon: CheckCircle, color: 'text-green-400', text: 'Finished' },
    error: { icon: AlertCircle, color: 'text-red-400', text: 'Error' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.idle;
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <Icon className={`w-4 h-4 ${config.color}`} />
      <span className={`text-sm font-medium ${config.color}`}>{config.text}</span>
    </div>
  );
}

export function EnhancedTestingPanel({
  nodes,
  connections,
  isVisible,
  onClose,
  isPropertiesPanelVisible,
  compactMode = false,
  startNodeId = null,
  onTesterEvent,
  onNodeSelect,
}: EnhancedTestingPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [scenario, setScenario] = useState("");
  const [environment, setEnvironment] = useState<ToolEnvironment>('mock');
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seed, setSeed] = useState<string>("");
  const [latency, setLatency] = useState<number>(500);
  const [errorInjection, setErrorInjection] = useState<boolean>(false);
  const [events, setEvents] = useState<TesterEvent[]>([]);
  const [artifacts, setArtifacts] = useState<NodeExecutionArtifact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runStartedAt, setRunStartedAt] = useState<number | null>(null);
  const [runEndedAt, setRunEndedAt] = useState<number | null>(null);
  const [nowTs, setNowTs] = useState<number>(() => Date.now());
  const [breakpoints, setBreakpoints] = useState<Set<string>>(new Set());
  const [activeProfile, setActiveProfile] = useState<ToolMockProfile>(() => {
    return toolSimulator.getActiveProfile();
  });
  const [showMockEditor, setShowMockEditor] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [runHistory, setRunHistory] = useState<RunManifest[]>([]);
  const [activeTab, setActiveTab] = useState<string>('scenario');

  // State refs for async operations
  const draftsRef = useRef<Map<string, Partial<NodeExecutionArtifact>>>(new Map());
  const isPausedRef = useRef<boolean>(false);
  const breakpointsRef = useRef<Set<string>>(new Set());
  const stepTokensRef = useRef<number>(0);
  const gateListenersRef = useRef<Set<() => void>>(new Set());

  // Load run history
  useEffect(() => {
    const stored = localStorage.getItem('weev_run_history');
    if (stored) {
      try {
        const history = JSON.parse(stored);
        setRunHistory(history);
      } catch {
        setRunHistory([]);
      }
    }
  }, []);

  // Update refs
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

  const handleTesterEvent = useCallback((evt: TesterEvent) => {
    onTesterEvent?.(evt);
    
    setEvents(prev => [...prev, evt]);
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
          setSelectedId(cur => cur ?? e.nodeId);
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
          status: evt.type === 'flow-finished' ? 'success' : 'error',
          output: e.output,
          summary: e.summary,
          error: e.error,
          flowContextBefore: existingDraft.flowContextBefore ?? e.flowContextBefore,
          flowContextAfter: e.flowContextAfter,
          flowContextDiff: e.flowContextDiff,
        };
        draftsRef.current.delete(e.nodeId);
        setArtifacts(prev => {
          const others = prev.filter(a => a.nodeId !== artifact.nodeId);
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
        
        // Save run to history
        if (runStartedAt) {
          const manifest: RunManifest = {
            id: `run_${Date.now()}`,
            timestamp: runStartedAt,
            scenario,
            environment,
            seed: seed || 'auto',
            toolProfile: toolSimulator.getActiveProfile()?.id || null,
            nodes,
            connections,
            startNodeId: startNodeId || null,
            results: artifacts,
            duration: e.at - runStartedAt,
            status: e.status || 'success'
          };
          
          setRunHistory(prev => [manifest, ...prev.slice(0, 49)]);
          localStorage.setItem('weev_run_history', JSON.stringify([manifest, ...runHistory.slice(0, 49)]));
        }
        break;
      }
    }
  }, [onTesterEvent, scenario, environment, seed, runStartedAt, artifacts, nodes, connections, startNodeId, runHistory]);

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
          overrides: { 
            seed: (seed || "").trim() || undefined,
            environment,
            latency,
            errorInjection
          },
        }
      );
    } catch (err) {
      console.error("Test run failed:", err);
      setIsRunning(false);
    }
  }, [connections, nodes, handleTesterEvent, scenario, seed, environment, latency, errorInjection, isRunning, startNodeId]);

  const handlePause = useCallback(() => {
    if (!runStartedAt || !isRunning) return;
    setIsPaused(prev => !prev);
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

  const handleExport = useCallback(() => {
    if (!runStartedAt) return;
    
    const exportData = {
      manifest: {
        timestamp: runStartedAt,
        scenario,
        environment,
        seed,
        duration: runEndedAt ? runEndedAt - runStartedAt : null,
        status: artifacts.some(a => a.status === 'error') ? 'error' : 'success'
      },
      nodes: artifacts.map(a => ({
        id: a.nodeId,
        title: a.title,
        type: a.nodeType,
        status: a.status,
        duration: a.durationMs,
        summary: a.summary,
        output: a.output,
        error: a.error
      }))
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weev-run-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [runStartedAt, runEndedAt, scenario, environment, seed, artifacts]);

  const handleReplay = useCallback((manifest: RunManifest) => {
    setScenario(manifest.scenario);
    setEnvironment(manifest.environment);
    setSeed(manifest.seed);
    handleRun();
  }, [handleRun]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = (target?.tagName || "").toLowerCase();
      const isEditable =
        tag === "input" ||
        tag === "textarea" ||
        target?.getAttribute("contenteditable") === "true";

      if (isEditable || e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (isRunning) handlePause();
          else handleRun();
          break;
        case "n":
          handleStep();
          break;
        case "b":
          if (selectedId) {
            setBreakpoints(prev => {
              const next = new Set(prev);
              if (next.has(selectedId)) next.delete(selectedId);
              else next.add(selectedId);
              return next;
            });
          }
          break;
        case "Escape":
          if (showMockEditor) {
            setShowMockEditor(false);
          }
          break;
      }
    };
    
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handlePause, handleRun, handleStep, isRunning, selectedId, showMockEditor]);

  // Timeline data
  const timelineItems = useMemo(() => {
    const items: Array<{
      nodeId: string;
      title: string;
      startedAt: number;
      endedAt: number;
      status: "running" | "success" | "error";
    }> = [];

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

  const selected = artifacts.find(a => a.nodeId === selectedId);
  const elapsed = runStartedAt ? (runEndedAt || nowTs) - runStartedAt : 0;

  // Update nowTs for running items
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => setNowTs(Date.now()), 250);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Panel positioning
  const getPanelStyle = () => {
    const baseStyle = {
      position: "fixed" as const,
      zIndex: 1000,
      background: "rgba(15, 23, 42, 0.95)",
      backdropFilter: "blur(16px)",
      border: "1px solid rgba(51, 65, 85, 0.5)",
      borderRadius: "16px",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
    };

    if (isPropertiesPanelVisible) {
      // Stacked mode - split vertically
      return {
        ...baseStyle,
        right: "20px",
        top: "calc(50vh + 10px)",
        bottom: "20px",
        width: "420px",
        height: isCollapsed ? "60px" : undefined,
      };
    } else {
      // Full mode
      return {
        ...baseStyle,
        right: "20px",
        top: "20px",
        bottom: "20px",
        width: "420px",
        height: isCollapsed ? "60px" : undefined,
      };
    }
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={`fixed right-4 top-4 bottom-4 w-96 z-50 flex flex-col ${
        compactMode ? 'w-80' : 'w-96'
      }`}
      style={{
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '16px',
        boxShadow: `
          0 8px 32px rgba(0, 0, 0, 0.3),
          0 1px 0 rgba(255, 255, 255, 0.1) inset,
          0 -1px 0 rgba(0, 0, 0, 0.2) inset
        `,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700/30">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-slate-100">Testing Panel</h2>
          <StatusIndicator status={
            isRunning ? (isPaused ? 'paused' : 'running') : 
            runEndedAt ? 'finished' : 'idle'
          } />
          {isRunning && (
            <span className="text-sm text-slate-400">
              {Math.round((nowTs - (runStartedAt || nowTs)) / 1000)}s
            </span>
          )}
        </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded"
            >
              {isCollapsed ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-700 rounded"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {!isCollapsed && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-slate-700">
              {[
                { key: 'controls', label: 'Controls', icon: Settings },
                { key: 'mocks', label: 'Tool Mocks', icon: Database },
                { key: 'history', label: 'History', icon: History }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as any)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                    activeTab === key
                      ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800/50'
                      : 'text-slate-400 hover:text-slate-100'
                  }`}
                >
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'controls' && (
                <div className="h-full overflow-y-auto">
                  {/* Controls */}
                  <div className="p-4 space-y-4 border-b border-slate-700">
                    <div className="flex gap-2">
                      <button
                        onClick={handleRun}
                        disabled={isRunning}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Play size={16} />
                        {isRunning ? 'Running...' : 'Run'}
                      </button>
                      <button
                        onClick={handlePause}
                        disabled={!isRunning}
                        className="px-3 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Pause size={16} />
                      </button>
                      <button
                        onClick={handleStep}
                        disabled={!isRunning || !isPaused}
                        className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                      <button
                        onClick={handleReset}
                        className="px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>

                    <ScenarioInput
                      value={scenario}
                      onChange={setScenario}
                      placeholder="Describe your test scenario..."
                    />

                    <EnvironmentSelector
                      value={environment}
                      onChange={setEnvironment}
                    />

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Seed
                        </label>
                        <input
                          type="text"
                          value={seed}
                          onChange={(e) => setSeed(e.target.value)}
                          placeholder="auto"
                          className="w-full px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Latency (ms)
                        </label>
                        <input
                          type="number"
                          value={latency}
                          onChange={(e) => setLatency(Number(e.target.value))}
                          min="0"
                          max="3000"
                          className="w-full px-2 py-1 text-sm bg-slate-700 border border-slate-600 rounded text-slate-200 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={errorInjection}
                        onChange={(e) => setErrorInjection(e.target.checked)}
                        className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-slate-300">Enable error injection</span>
                    </label>
                  </div>

                  {/* Timeline */}
                  {timelineItems.length > 0 && (
                    <div className="p-4 border-b border-slate-700">
                      <Timeline
                        items={timelineItems}
                        startTs={runStartedAt || Date.now()}
                        endTs={runEndedAt || nowTs}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                      />
                    </div>
                  )}

                  {/* Results */}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-slate-300">Results</h3>
                      {artifacts.length > 0 && (
                        <button
                          onClick={handleExport}
                          className="text-xs text-blue-400 hover:text-blue-300"
                        >
                          Export
                        </button>
                      )}
                    </div>
                    
                    {artifacts.map(artifact => (
                      <ResultCard
                        key={artifact.nodeId}
                        artifact={artifact}
                        selected={selectedId === artifact.nodeId}
                        onClick={() => setSelectedId(artifact.nodeId)}
                        hasBreakpoint={breakpoints.has(artifact.nodeId)}
                        onToggleBreakpoint={() => {
                          setBreakpoints(prev => {
                            const next = new Set(prev);
                            if (next.has(artifact.nodeId)) next.delete(artifact.nodeId);
                            else next.add(artifact.nodeId);
                            return next;
                          });
                        }}
                        isBreakpoint={breakpoints.has(artifact.nodeId)}
                      />
                    ))}
                    
                    {artifacts.length === 0 && !isRunning && (
                      <div className="text-center py-8">
                        <p className="text-sm text-slate-500">No results yet. Run a test to see results here.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'mocks' && (
                <ToolMockEditor
                  onClose={() => setActiveTab('controls')}
                />
              )}

              {activeTab === 'history' && (
                <RunHistory
                  runs={runHistory}
                  onReplay={handleReplay}
                  onClose={() => setActiveTab('controls')}
                />
              )}
            </div>
          </>
        )}
      </motion.div>

      {/* Mock Editor Modal */}
      <AnimatePresence>
        {showMockEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1001]"
            onClick={() => setShowMockEditor(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <ToolMockEditor onClose={() => setShowMockEditor(false)} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
