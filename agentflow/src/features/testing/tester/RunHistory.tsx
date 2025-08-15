import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, CheckCircle, AlertCircle, XCircle, Play, Download, Trash2, Search } from 'lucide-react';
import type { RunManifest } from '@/types/tester';

interface RunHistoryProps {
  runs: RunManifest[];
  onReplay: (manifest: RunManifest) => void;
  onClose: () => void;
}

export function RunHistory({ runs, onReplay, onClose }: RunHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRun, setSelectedRun] = useState<RunManifest | null>(null);

  const filteredRuns = runs.filter(run => 
    run.scenario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    run.environment.toLowerCase().includes(searchTerm.toLowerCase()) ||
    new Date(run.timestamp).toLocaleDateString().includes(searchTerm)
  );

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const exportRun = (run: RunManifest) => {
    const exportData = {
      manifest: {
        id: run.id,
        timestamp: run.timestamp,
        scenario: run.scenario,
        environment: run.environment,
        seed: run.seed,
        duration: run.duration,
        status: run.status,
        nodeCount: run.nodes.length,
        connectionCount: run.connections.length
      },
      nodes: run.results.map(result => ({
        id: result.nodeId,
        title: result.title,
        type: result.nodeType,
        status: result.status,
        duration: result.durationMs,
        summary: result.summary,
        output: result.output,
        error: result.error,
        startedAt: result.startedAt,
        endedAt: result.endedAt
      })),
      flow: {
        nodes: run.nodes,
        connections: run.connections,
        startNodeId: run.startNodeId
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weev-run-${run.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteRun = (runId: string) => {
    const updatedRuns = runs.filter(run => run.id !== runId);
    localStorage.setItem('weev_run_history', JSON.stringify(updatedRuns));
    // Note: This would need to trigger a re-render in parent component
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <h3 className="text-sm font-medium text-slate-300">Run History</h3>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200"
        >
          <XCircle size={16} />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search runs..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Run List */}
      <div className="flex-1 overflow-y-auto">
        {filteredRuns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <Clock className="w-12 h-12 mb-4" />
            <p className="text-sm">No runs found</p>
            {searchTerm && (
              <p className="text-xs mt-2">Try adjusting your search</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-700">
            {filteredRuns.map((run) => (
              <motion.div
                key={run.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(run.status)}
                    <div>
                      <div className="text-sm font-medium text-slate-200">
                        {run.scenario || 'Untitled Run'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {formatDate(run.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onReplay(run)}
                      className="p-1 text-slate-400 hover:text-green-400 transition-colors"
                      title="Replay this run"
                    >
                      <Play size={14} />
                    </button>
                    <button
                      onClick={() => exportRun(run)}
                      className="p-1 text-slate-400 hover:text-blue-400 transition-colors"
                      title="Export run data"
                    >
                      <Download size={14} />
                    </button>
                    <button
                      onClick={() => deleteRun(run.id)}
                      className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete run"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
                  <div>
                    <span className="font-medium">Environment:</span> {run.environment}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {formatDuration(run.duration)}
                  </div>
                  <div>
                    <span className="font-medium">Seed:</span> {run.seed}
                  </div>
                  <div>
                    <span className="font-medium">Nodes:</span> {run.results.length}
                  </div>
                </div>

                {run.results.length > 0 && (
                  <div className="mt-2">
                    <div className="text-xs text-slate-400 mb-1">Results:</div>
                    <div className="flex flex-wrap gap-1">
                      {run.results.slice(0, 5).map((result, index) => (
                        <span
                          key={result.nodeId}
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            result.status === 'success'
                              ? 'bg-green-500/20 text-green-400'
                              : result.status === 'error'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-slate-500/20 text-slate-400'
                          }`}
                        >
                          {result.title || result.nodeId}
                        </span>
                      ))}
                      {run.results.length > 5 && (
                        <span className="text-xs text-slate-500">
                          +{run.results.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Run Details */}
      {selectedRun && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-slate-700 p-4 bg-slate-800/50"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-slate-200">Run Details</h4>
            <button
              onClick={() => setSelectedRun(null)}
              className="text-slate-400 hover:text-slate-200"
            >
              <XCircle size={14} />
            </button>
          </div>
          
          <div className="text-xs text-slate-400 space-y-1">
            <div>Scenario: {selectedRun.scenario}</div>
            <div>Environment: {selectedRun.environment}</div>
            <div>Seed: {selectedRun.seed}</div>
            <div>Duration: {formatDuration(selectedRun.duration)}</div>
            <div>Status: {selectedRun.status}</div>
            <div>Nodes executed: {selectedRun.results.length}</div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
