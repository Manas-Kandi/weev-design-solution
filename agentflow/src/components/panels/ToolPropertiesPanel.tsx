/**
 * Tool node properties panel
 */

import React, { useState, useEffect } from 'react';
import { ToolNodeData } from '@/types';
import { TOOL_MODES, MOCK_ERROR_MODES } from '@/lib/nodes/tool/types';
import { getAvailableTools, getToolSchema, getToolMockPresets, getMockPreset } from '@/lib/nodes/tool/catalog';
import { figmaPropertiesTheme } from './propertiesPanelTheme';

interface ToolPropertiesPanelProps {
  nodeData: ToolNodeData;
  onChange: (data: Partial<ToolNodeData>) => void;
}

export function ToolPropertiesPanel({ nodeData, onChange }: ToolPropertiesPanelProps) {
  const [selectedTool, setSelectedTool] = useState(nodeData.toolName || '');
  const [selectedOperation, setSelectedOperation] = useState(nodeData.operation || '');
  const [args, setArgs] = useState(nodeData.args || {});
  const [mode, setMode] = useState(nodeData.mode || 'mock');
  const [mockPreset, setMockPreset] = useState(nodeData.mockPreset || '');
  const [latencyMs, setLatencyMs] = useState(nodeData.latencyMs || 500);
  const [errorMode, setErrorMode] = useState(nodeData.errorMode || 'none');
  const [previewResult, setPreviewResult] = useState<any>(null);

  const availableTools = getAvailableTools();
  const toolSchema = getToolSchema(selectedTool);
  const availableOperations = toolSchema?.operations ? Object.keys(toolSchema.operations) : [];
  const mockPresets = getToolMockPresets(selectedTool);

  // Update parent when local state changes
  useEffect(() => {
    onChange({
      toolName: selectedTool,
      operation: selectedOperation,
      args,
      mode,
      mockPreset,
      latencyMs,
      errorMode
    });
  }, [selectedTool, selectedOperation, args, mode, mockPreset, latencyMs, errorMode]);

  // Update preview when preset changes
  useEffect(() => {
    if (selectedTool && mockPreset) {
      const preset = getMockPreset(selectedTool, mockPreset);
      if (preset) {
        setPreviewResult(preset.result || preset.error);
        if (preset.latencyMs) {
          setLatencyMs(preset.latencyMs);
        }
      }
    }
  }, [selectedTool, mockPreset]);

  // Reset operation when tool changes
  useEffect(() => {
    if (toolSchema?.operations && !toolSchema.operations[selectedOperation]) {
      setSelectedOperation(Object.keys(toolSchema.operations)[0] || '');
    }
  }, [selectedTool, toolSchema, selectedOperation]);

  const handleToolChange = (toolName: string) => {
    setSelectedTool(toolName);
    setSelectedOperation('');
    setArgs({});
    setMockPreset('');
    setPreviewResult(null);
  };

  const handleArgChange = (key: string, value: any) => {
    const newArgs = { ...args };
    if (value === '' || value === null || value === undefined) {
      delete newArgs[key];
    } else {
      newArgs[key] = value;
    }
    setArgs(newArgs);
  };

  const handleAddArg = () => {
    const newKey = `arg${Object.keys(args).length + 1}`;
    setArgs({ ...args, [newKey]: '' });
  };

  const handleRemoveArg = (key: string) => {
    const newArgs = { ...args };
    delete newArgs[key];
    setArgs(newArgs);
  };

  const getParametersForCurrentContext = () => {
    if (!toolSchema) return [];
    
    if (toolSchema.operations && selectedOperation) {
      return toolSchema.operations[selectedOperation]?.parameters || [];
    }
    
    return toolSchema.parameters || [];
  };

  const renderArgInput = (key: string, value: any, parameter?: any) => {
    const paramType = parameter?.type || 'string';
    const isRequired = parameter?.required || false;
    const enumValues = parameter?.enum;

    if (enumValues) {
      return (
        <select
          value={value || ''}
          onChange={(e) => handleArgChange(key, e.target.value)}
          style={figmaPropertiesTheme.select}
        >
          <option value="">Select...</option>
          {enumValues.map((enumValue: string) => (
            <option key={enumValue} value={enumValue}>
              {enumValue}
            </option>
          ))}
        </select>
      );
    }

    switch (paramType) {
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleArgChange(key, parseFloat(e.target.value) || 0)}
            style={figmaPropertiesTheme.input}
            placeholder={parameter?.description}
          />
        );
      case 'boolean':
        return (
          <select
            value={value?.toString() || 'false'}
            onChange={(e) => handleArgChange(key, e.target.value === 'true')}
            style={figmaPropertiesTheme.select}
          >
            <option value="false">False</option>
            <option value="true">True</option>
          </select>
        );
      case 'object':
      case 'array':
        return (
          <textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value || ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleArgChange(key, parsed);
              } catch {
                handleArgChange(key, e.target.value);
              }
            }}
            style={{ ...figmaPropertiesTheme.textarea, minHeight: '60px' }}
            placeholder={`${parameter?.description} (JSON format)`}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleArgChange(key, e.target.value)}
            style={figmaPropertiesTheme.input}
            placeholder={parameter?.description}
          />
        );
    }
  };

  return (
    <div style={figmaPropertiesTheme.container}>
      <div style={figmaPropertiesTheme.header}>
        <h3 style={figmaPropertiesTheme.title}>Tool Configuration</h3>
      </div>

      <div style={figmaPropertiesTheme.content}>
        {/* Tool Selection */}
        <div style={figmaPropertiesTheme.section}>
          <label style={figmaPropertiesTheme.label}>Tool Name</label>
          <select
            value={selectedTool}
            onChange={(e) => handleToolChange(e.target.value)}
            style={figmaPropertiesTheme.select}
          >
            <option value="">Select a tool...</option>
            {availableTools.map(tool => (
              <option key={tool} value={tool}>
                {tool}
              </option>
            ))}
            <option value="custom">Custom Tool</option>
          </select>
          {toolSchema && (
            <div style={figmaPropertiesTheme.helpText}>
              {toolSchema.description}
            </div>
          )}
        </div>

        {/* Operation Selection (for multi-operation tools) */}
        {availableOperations.length > 0 && (
          <div style={figmaPropertiesTheme.section}>
            <label style={figmaPropertiesTheme.label}>Operation</label>
            <select
              value={selectedOperation}
              onChange={(e) => setSelectedOperation(e.target.value)}
              style={figmaPropertiesTheme.select}
            >
              <option value="">Select operation...</option>
              {availableOperations.map(op => (
                <option key={op} value={op}>
                  {op}
                </option>
              ))}
            </select>
            {toolSchema?.operations?.[selectedOperation] && (
              <div style={figmaPropertiesTheme.helpText}>
                {toolSchema.operations[selectedOperation].description}
              </div>
            )}
          </div>
        )}

        {/* Arguments */}
        <div style={figmaPropertiesTheme.section}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={figmaPropertiesTheme.label}>Arguments</label>
            <button
              onClick={handleAddArg}
              style={figmaPropertiesTheme.button}
            >
              Add Argument
            </button>
          </div>

          {/* Schema-based parameters */}
          {getParametersForCurrentContext().map(param => (
            <div key={param.name} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label style={{ ...figmaPropertiesTheme.label, fontSize: '12px' }}>
                  {param.name}
                  {param.required && <span style={{ color: '#f24822' }}>*</span>}
                </label>
                <span style={{ fontSize: '10px', color: figmaPropertiesTheme.colors.textSecondary }}>
                  {param.type}
                </span>
              </div>
              {renderArgInput(param.name, args[param.name], param)}
              {param.description && (
                <div style={{ ...figmaPropertiesTheme.helpText, fontSize: '10px' }}>
                  {param.description}
                </div>
              )}
            </div>
          ))}

          {/* Custom arguments */}
          {Object.entries(args).filter(([key]) => 
            !getParametersForCurrentContext().some(p => p.name === key)
          ).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '8px' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <input
                  type="text"
                  value={key}
                  onChange={(e) => {
                    const newArgs = { ...args };
                    delete newArgs[key];
                    newArgs[e.target.value] = value;
                    setArgs(newArgs);
                  }}
                  style={{ ...figmaPropertiesTheme.input, flex: '0 0 80px', fontSize: '11px' }}
                  placeholder="Key"
                />
                {renderArgInput(key, value)}
                <button
                  onClick={() => handleRemoveArg(key)}
                  style={{ ...figmaPropertiesTheme.button, padding: '4px 8px', fontSize: '11px' }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Execution Mode */}
        <div style={figmaPropertiesTheme.section}>
          <label style={figmaPropertiesTheme.label}>Mode</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {TOOL_MODES.map(modeOption => (
              <label key={modeOption} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <input
                  type="radio"
                  value={modeOption}
                  checked={mode === modeOption}
                  onChange={(e) => setMode(e.target.value as any)}
                />
                <span style={{ fontSize: '12px' }}>{modeOption}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Mock Configuration */}
        {mode === 'mock' && (
          <div style={figmaPropertiesTheme.section}>
            <label style={figmaPropertiesTheme.label}>Mock Configuration</label>
            
            {/* Mock Preset */}
            {mockPresets.length > 0 && (
              <div style={{ marginBottom: '8px' }}>
                <label style={{ ...figmaPropertiesTheme.label, fontSize: '12px' }}>Preset</label>
                <select
                  value={mockPreset}
                  onChange={(e) => setMockPreset(e.target.value)}
                  style={figmaPropertiesTheme.select}
                >
                  <option value="">Auto (based on args)</option>
                  {mockPresets.map(preset => (
                    <option key={preset} value={preset}>
                      {preset}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Latency */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ ...figmaPropertiesTheme.label, fontSize: '12px' }}>
                Latency (ms): {latencyMs}
              </label>
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={latencyMs}
                onChange={(e) => setLatencyMs(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Error Mode */}
            <div style={{ marginBottom: '8px' }}>
              <label style={{ ...figmaPropertiesTheme.label, fontSize: '12px' }}>Error Mode</label>
              <select
                value={errorMode}
                onChange={(e) => setErrorMode(e.target.value)}
                style={figmaPropertiesTheme.select}
              >
                {MOCK_ERROR_MODES.map(error => (
                  <option key={error} value={error}>
                    {error === 'none' ? 'No Error' : error.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Preview Result */}
        {previewResult && (
          <div style={figmaPropertiesTheme.section}>
            <label style={figmaPropertiesTheme.label}>Preview Result</label>
            <div style={{
              ...figmaPropertiesTheme.codeBlock,
              maxHeight: '200px',
              overflow: 'auto'
            }}>
              <pre style={{ margin: 0, fontSize: '11px' }}>
                {typeof previewResult === 'string' 
                  ? previewResult 
                  : JSON.stringify(previewResult, null, 2)
                }
              </pre>
            </div>
          </div>
        )}

        {/* Live Mode Notice */}
        {mode === 'live' && (
          <div style={{
            ...figmaPropertiesTheme.section,
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            padding: '8px'
          }}>
            <div style={{ fontSize: '12px', color: '#856404' }}>
              <strong>Live Mode:</strong> This will execute real tool operations. 
              Ensure you have proper authentication and permissions configured.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
