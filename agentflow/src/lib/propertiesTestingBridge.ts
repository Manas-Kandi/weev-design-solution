/**
 * Properties Panel → Testing Panel Bridge
 * 
 * This module implements the connection between Properties Panel configurations
 * and Testing Panel outputs, treating properties as authoritative rules.
 * 
 * Key principles:
 * 1. Properties Panel values become rules - no random mocks unless fields are empty
 * 2. Immediate sync from Properties Panel edits to flow state
 * 3. Runner consumes properties directly during execution
 * 4. Testing Panel shows: Inputs (raw properties), Outputs (results from properties), Summary (rule explanations)
 * 5. Show "No info input in properties panel" instead of fabricated results
 * 6. Error handling for missing required properties
 */

import { CanvasNode } from "@/types/index";
import { getToolSchema } from "@/lib/nodes/tool/catalog";

export interface PropertiesExecutionResult {
  result: any;
  propertiesUsed: Record<string, any>;
  executionSummary: string;
  nodeType: string;
  nodeId: string;
  timestamp: number;
  inputsTab: PropertiesInputsTab;
  outputsTab: PropertiesOutputsTab;
  summaryTab: PropertiesSummaryTab;
  trace: Record<string, any>; // New field for trace information
  parsedIntent?: { capability: string } | null;
}

export interface PropertiesInputsTab {
  title: string;
  properties: Array<{
    key: string;
    label: string;
    value: any;
    configured: boolean;
  }>;
}

export interface PropertiesOutputsTab {
  title: string;
  result: any;
  resultType: 'mock' | 'computed' | 'error';
  source: string;
}

export interface PropertiesSummaryTab {
  title: string;
  explanation: string;
  rulesFired: string[];
  missingProperties: string[];
}

/**
 * Execute a node using Properties Panel data as the authoritative source
 */
export async function executeNodeFromProperties(
  node: CanvasNode,
  inputData: any,
  llmExecutor: (prompt: string, systemPrompt?: string, tools?: any[]) => Promise<string>,
  tools?: any[],
  contextFromPreviousNodes?: {
    previousNodes: Array<{
      id: string;
      type: string;
      output: any;
      summary: string;
    }>;
    flowContext?: Record<string, any>;
  },
  delegationContext?: Record<string, any> // Add delegation context parameter
): Promise<PropertiesExecutionResult> {
  // Defensive check to ensure llmExecutor is actually a function
  if (typeof llmExecutor !== 'function') {
    throw new Error(`executeNodeFromProperties: llmExecutor must be a function, received: ${typeof llmExecutor} (${JSON.stringify(llmExecutor)})`);
  }
  const nodeData = node.data as any;
  
  console.log('🔍 Properties Testing Bridge - Node Execution Start:', {
    nodeId: node.id,
    nodeType: node.type,
    nodeSubtype: node.subtype,
    nodeData,
    inputData,
    hasLlmExecutor: !!llmExecutor
  });
  const nodeTitle = nodeData?.title || node.id;

  // Resolve effective node kind from type/subtype to avoid misrouting
  const rawType = (node.type || '').toLowerCase();
  const rawSubtype = (node.subtype || '').toLowerCase();
  const effectiveKind =
    rawType === 'agent' ? 'agent' :
    rawType === 'tool' || rawSubtype === 'tool' || rawSubtype === 'tool-agent' ? 'tool' :
    rawType === 'knowledge-base' || rawSubtype === 'knowledge-base' ? 'knowledge-base' :
    rawType === 'router' || rawSubtype === 'router' ? 'router' :
    (rawSubtype || rawType);

  // Base result structure
  const baseResult: PropertiesExecutionResult = {
    result: null,
    propertiesUsed: {},
    executionSummary: '',
    nodeType: effectiveKind,
    nodeId: node.id,
    timestamp: Date.now(),
    inputsTab: {
      title: 'Properties Panel Configuration',
      properties: []
    },
    outputsTab: {
      title: 'Execution Result',
      result: null,
      resultType: 'error',
      source: ''
    },
    summaryTab: {
      title: 'Execution Summary',
      explanation: '',
      rulesFired: [],
      missingProperties: []
    },
    trace: {}
  };

  try {
    switch (effectiveKind) {
      case 'agent':
        return await executeAgentNode(node, nodeData, inputData, llmExecutor, baseResult, tools, contextFromPreviousNodes);
      
      case 'tool-agent':
      case 'tool':
        return await executeToolNode(node, nodeData, inputData, llmExecutor, baseResult, tools, delegationContext);
      
      case 'knowledge-base':
        return await executeKnowledgeBaseNode(node, nodeData, inputData, llmExecutor, baseResult);
      
      case 'router':
      case 'decision-tree':
        return await executeRouterNode(node, nodeData, inputData, llmExecutor, baseResult);
      
      case 'message':
        return await executeMessageNode(node, nodeData, inputData, baseResult);
      
      default:
        return await executeGenericNode(node, nodeData, inputData, llmExecutor, baseResult);
    }
  } catch (error) {
    baseResult.result = null;
    baseResult.executionSummary = `Error: ${error}`;
    baseResult.outputsTab.result = null;
    baseResult.outputsTab.resultType = 'error';
    baseResult.outputsTab.source = 'Error during execution';
    baseResult.summaryTab.explanation = `Execution failed: ${error}`;
    return baseResult;
  }
}

async function executeAgentNode(
  node: CanvasNode,
  nodeData: any,
  inputData: any,
  llmExecutor: (prompt: string, systemPrompt?: string, tools?: any[]) => Promise<string>,
  baseResult: PropertiesExecutionResult,
  tools?: any[],
  contextFromPreviousNodes?: {
    previousNodes: Array<{
      id: string;
      type: string;
      output: any;
      summary: string;
    }>;
    flowContext?: Record<string, any>;
  }
): Promise<PropertiesExecutionResult> {
  // Helper to probe multiple possible paths
  const pick = (...paths: Array<string>): any => {
    for (const p of paths) {
      try {
        const val = p.split('.').reduce((acc: any, key: string) => (acc ? acc[key] : undefined), nodeData);
        if (val !== undefined && val !== null && val !== '') return val;
      } catch {}
    }
    return undefined;
  };

  const systemPrompt = pick('systemPrompt', 'config.systemPrompt', 'properties.systemPrompt');
  const behavior = pick('behavior', 'config.behavior', 'properties.behavior');
  const rulesNl = pick('rules.nl', 'rulesNl', 'agentRules.nl', 'prompt', 'content', 'input', 'config.rules.nl', 'properties.rules.nl');
  const mockResponse = pick('mockResponse', 'properties.mockResponse', 'config.mockResponse');
  const userPrompt = (inputData && (inputData.input ?? inputData.text ?? inputData.content)) || '';

  // Add to executeAgentNode function
  const reasoning = await generateAgentReasoning(nodeData, inputData, llmExecutor);

  console.log('🤖 Agent Node Execution:', {
    nodeId: node.id,
    systemPrompt,
    behavior,
    rulesNl,
    mockResponse,
    userPrompt,
    inputData,
    nodeData
  });

  // Build inputs tab
  baseResult.inputsTab.properties = [
    {
      key: 'rulesNl',
      label: 'Agent Rules (NL)',
      value: rulesNl || null,
      configured: !!rulesNl
    },
    {
      key: 'systemPrompt',
      label: 'System Prompt',
      value: systemPrompt || null,
      configured: !!systemPrompt
    },
    {
      key: 'behavior',
      label: 'Behavior Rules',
      value: behavior || null,
      configured: !!behavior
    },
    {
      key: 'mockResponse',
      label: 'Mock Response',
      value: mockResponse || null,
      configured: !!mockResponse
    }
  ];

  // Check for required properties
  if (!systemPrompt && !behavior && !rulesNl && !mockResponse) {
    baseResult.summaryTab.missingProperties = ['rulesNl', 'systemPrompt', 'behavior', 'mockResponse'];
    baseResult.summaryTab.explanation = `No configuration found in Properties Panel. Please configure Agent Rules, System Prompt, Behavior Rules, or Mock Response.`;
    baseResult.outputsTab.result = 'No info input in properties panel';
    baseResult.outputsTab.resultType = 'error';
    baseResult.outputsTab.source = 'Missing Properties Panel configuration';
    baseResult.executionSummary = 'Missing required properties';
    return baseResult;
  }

  // Execute based on Properties Panel configuration
  if (mockResponse) {
    // Use mock response directly (Properties Panel as rules)
    try {
      baseResult.result = typeof mockResponse === 'string' ? JSON.parse(mockResponse) : mockResponse;
      baseResult.outputsTab.result = baseResult.result;
      baseResult.outputsTab.resultType = 'mock';
      baseResult.outputsTab.source = 'Mock Response from Properties Panel';
      baseResult.summaryTab.rulesFired = ['Mock Response'];
      baseResult.summaryTab.explanation = 'Used mock response configured in Properties Panel';
      baseResult.executionSummary = 'Used mock response from Properties Panel';
    } catch {
      baseResult.result = mockResponse;
      baseResult.outputsTab.result = mockResponse;
      baseResult.outputsTab.resultType = 'mock';
      baseResult.outputsTab.source = 'Mock Response (text) from Properties Panel';
      baseResult.summaryTab.rulesFired = ['Mock Response (text)'];
      baseResult.summaryTab.explanation = 'Used mock response text configured in Properties Panel';
      baseResult.executionSummary = 'Used mock response text from Properties Panel';
    }
  } else if (llmExecutor && (systemPrompt || behavior || rulesNl)) {
    // Use LLM with Properties Panel configuration
    let fullPrompt = '';
    
    // Build context from previous nodes if available
    let contextSection = '';
    if (contextFromPreviousNodes?.previousNodes && contextFromPreviousNodes.previousNodes.length > 0) {
      contextSection = `
CONTEXT FROM PREVIOUS NODES:
`;
      contextFromPreviousNodes.previousNodes.forEach((prevNode, index) => {
        contextSection += `${index + 1}. Node "${prevNode.id}" (${prevNode.type}):
`;
        if (typeof prevNode.output === 'string') {
          contextSection += `   Output: ${prevNode.output.slice(0, 200)}${prevNode.output.length > 200 ? '...' : ''}
`;
        } else if (prevNode.output && typeof prevNode.output === 'object') {
          contextSection += `   Output: ${JSON.stringify(prevNode.output).slice(0, 200)}...
`;
        }
        contextSection += `   Summary: ${prevNode.summary}

`;
      });
      contextSection += `Use this context to inform your response. Previous nodes have provided relevant information for your task.
`;
    }
    
    // Create structured tool list for LLM
    let toolListSection = '';
    if (tools && tools.length > 0) {
      toolListSection = `

AVAILABLE TOOLS:
`;
      tools.forEach((tool, index) => {
        toolListSection += `${index + 1}. ${tool.name} (${tool.provider}.${tool.operation})
`;
        toolListSection += `   Description: ${tool.description}
`;
        toolListSection += `   Capabilities: ${tool.capabilities.join(', ')}
`;
        if (tool.parameters && Object.keys(tool.parameters.properties || {}).length > 0) {
          toolListSection += `   Parameters: ${JSON.stringify(tool.parameters.properties, null, 2)}
`;
        }
        toolListSection += `
`;
      });
      toolListSection += `Choose the most appropriate tool(s) based on the user's request and the available capabilities.
`;
    }
    
    if (rulesNl) {
      // Enhanced intent extraction with structured tool awareness
      const intentPrompt = `
Extract the best-fit capability for the user's rule.
Return ONLY JSON: {"capability":"<tool_name>.<operation>"} or null.

Available tools and their capabilities:
${tools && tools.length > 0 
  ? tools.map(tool => `- ${tool.provider}.${tool.operation}: ${tool.description} (capabilities: ${tool.capabilities.join(', ')})`).join('\n')
  : 'No tools connected'}

Rule: ${rulesNl}
`.trim();
      
      // Call the intent extractor using the injected LLM executor (not callGemini)
      const intentResult = await llmExecutor(intentPrompt, undefined, tools);

      // Parse the intent extractor output and populate baseResult.parsedIntent so
      // downstream routing can match against tool capabilities.
      try {
        let parsed: any = null;
        if (typeof intentResult === 'string') {
          try {
            parsed = JSON.parse(intentResult);
          } catch {
            // Not JSON — leave parsed as null and try a regex fallback
            parsed = null;
          }
        } else if (typeof intentResult === 'object') {
          parsed = intentResult;
        }

        if (parsed && typeof parsed === 'object' && parsed.capability) {
          baseResult.parsedIntent = { capability: String(parsed.capability) };
          baseResult.trace.intent = { raw: intentResult, parsed: baseResult.parsedIntent };
        } else {
          // Regex fallback: extract a capability-like token from plain text (e.g. web_search.search)
          const match = String(intentResult || '').match(/([a-z0-9_]+\.[a-z0-9_]+)/i);
          if (match) {
            baseResult.parsedIntent = { capability: match[1] };
            baseResult.trace.intent = { raw: intentResult, parsed: baseResult.parsedIntent, note: 'regex-fallback' };
          } else {
            baseResult.parsedIntent = null;
            baseResult.trace.intent = { raw: intentResult, parsed: null };
          }
        }
      } catch {
        // If anything goes wrong while parsing intent, set parsedIntent to null
        baseResult.parsedIntent = null;
        baseResult.trace.intent = { raw: intentResult, parsed: null, error: 'parse-failed' };
      }

      // Enhanced prompt with tool awareness for intelligent tool selection
      fullPrompt = `${systemPrompt || 'You are a helpful AI assistant.'}

AGENT RULES:
${rulesNl}${toolListSection}${contextSection}

User Input: ${userPrompt}

Respond according to the exact rules configured in the Properties Panel. Execute the rules while taking into account any context from previous nodes and the available tools.

INSTRUCTIONS FOR TOOL SELECTION:
1. Analyze the user's request and match it to the most appropriate tool from the AVAILABLE TOOLS list.
2. If multiple tools are needed, plan their sequential execution.
3. If no tool matches, respond with a natural language response.
4. Respond with either a natural language response, a tool call, or both.

FORMAT OPTIONS:
1. Natural language only: Plain text response
2. Tool call only: {"tool_call": {"tool_name": "TOOL_NAME", "operation": "OPERATION_NAME", "args": { ...ARGS... }}}
3. Both: {"natural_language_response": "TEXT", "tool_call": {"tool_name": "TOOL_NAME", "operation": "OPERATION_NAME", "args": { ...ARGS... }}}
4. Multiple tools: {"tool_calls": [{"tool_name": "TOOL_NAME_1", "operation": "OPERATION_NAME_1", "args": { ...ARGS_1... }}, {"tool_name": "TOOL_NAME_2", "operation": "OPERATION_NAME_2", "args": { ...ARGS_2... }}]}
`.trim();
    } else {
      // Fallback to system prompt + behavior format with tool awareness
      fullPrompt = `${systemPrompt || 'You are a helpful AI assistant.'}

${behavior ? `User-Defined Behavior: ${behavior}` : ''}${toolListSection}${contextSection}

User Input: ${userPrompt}

Respond according to the exact behavior and system prompt configured in the Properties Panel.

INSTRUCTIONS FOR TOOL SELECTION:
1. Analyze the user's request and match it to the most appropriate tool from the AVAILABLE TOOLS list.
2. If multiple tools are needed, plan their sequential execution.
3. If no tool matches, respond with a natural language response.
4. Respond with either a natural language response, a tool call, or both.

FORMAT OPTIONS:
1. Natural language only: Plain text response
2. Tool call only: {"tool_call": {"tool_name": "TOOL_NAME", "operation": "OPERATION_NAME", "args": { ...ARGS... }}}
3. Both: {"natural_language_response": "TEXT", "tool_call": {"tool_name": "TOOL_NAME", "operation": "OPERATION_NAME", "args": { ...ARGS... }}}
4. Multiple tools: {"tool_calls": [{"tool_name": "TOOL_NAME_1", "operation": "OPERATION_NAME_1", "args": { ...ARGS_1... }}, {"tool_name": "TOOL_NAME_2", "operation": "OPERATION_NAME_2", "args": { ...ARGS_2... }}]}
`.trim();
    }

    console.log('🚀 Executing LLM with Properties Panel config:', {
      fullPrompt,
      rulesNl,
      systemPrompt,
      behavior,
      userPrompt
    });

    try {
      baseResult.result = await llmExecutor(fullPrompt, undefined, tools);
      baseResult.outputsTab.result = baseResult.result;
      baseResult.outputsTab.resultType = 'computed';
      baseResult.outputsTab.source = 'LLM execution with Properties Panel configuration';
      baseResult.summaryTab.rulesFired = [
        rulesNl ? 'Agent Rules (NL)' : '',
        systemPrompt ? 'System Prompt' : '',
        behavior ? 'Behavior Rules' : ''
      ].filter(Boolean);
      baseResult.summaryTab.explanation = `Executed with Properties Panel configuration: ${baseResult.summaryTab.rulesFired.join(' + ')}`;
      baseResult.executionSummary = `Executed with Properties Panel: ${baseResult.summaryTab.rulesFired.join(', ')}`;
    } catch (llmError: any) {
      console.error('❌ LLM execution failed:', llmError);
      baseResult.result = `LLM execution failed: ${llmError?.message || 'Unknown error'}`;
      baseResult.outputsTab.result = baseResult.result;
      baseResult.outputsTab.resultType = 'error';
      baseResult.outputsTab.source = 'Error during LLM execution';
      baseResult.summaryTab.explanation = `Execution failed: ${llmError?.message || 'Unknown error'}`;
      baseResult.executionSummary = 'LLM execution failed';
    }
  } else {
    // Fallback if no specific execution path is determined
    baseResult.outputsTab.result = 'No executable configuration for agent node.';
    baseResult.outputsTab.resultType = 'error';
    baseResult.outputsTab.source = 'No valid agent configuration';
    baseResult.summaryTab.explanation = 'Agent node has configuration but no valid execution path (e.g., no rules, system prompt, or LLM executor).';
    baseResult.executionSummary = 'No valid agent configuration';
  }

  baseResult.propertiesUsed = {
    systemPrompt: systemPrompt || null,
    behavior: behavior || null,
    mockResponse: mockResponse || null,
    rulesNl: rulesNl || null
  };

  console.log('🏁 Agent Node Execution Complete:', {
    nodeId: node.id,
    result: baseResult.result,
    outputsTabResult: baseResult.outputsTab.result,
    executionSummary: baseResult.executionSummary,
    propertiesUsed: baseResult.propertiesUsed
  });

  return baseResult;
}

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

async function executeToolNode(
  node: CanvasNode,
  nodeData: any,
  inputData: Record<string, any>,
  llmExecutor: ((prompt: string, systemPrompt?: string, tools?: any[]) => Promise<string>) | undefined,
  baseResult: PropertiesExecutionResult,
  tools?: any[],
  delegationContext?: Record<string, any> // Add delegation context parameter
): Promise<PropertiesExecutionResult> {
  const toolBehavior = nodeData?.rules?.nl;
  const mockResponse = nodeData?.mockResponse;
  const simulation = nodeData?.simulation || {};
  const providerId = simulation.providerId;
  const operation = simulation.operation;
  const mode = simulation.mode || 'live'; // 'mock', 'mixed', 'live' - default to live
  const mockPreset = simulation.mockPreset; // 'success', 'not_found', 'timeout', etc.
  const latency = simulation.latency; // in ms

  // Build inputs tab
  baseResult.inputsTab.properties = [
    {
      key: 'toolBehavior',
      label: 'Tool Behavior',
      value: toolBehavior || null,
      configured: !!toolBehavior
    },
    {
      key: 'mockResponse',
      label: 'Mock Response',
      value: mockResponse || null,
      configured: !!mockResponse
    },
    {
      key: 'providerId',
      label: 'Provider',
      value: providerId || null,
      configured: !!providerId
    },
    {
      key: 'operation',
      label: 'Operation',
      value: operation || null,
      configured: !!operation
    },
    {
      key: 'mode',
      label: 'Mode',
      value: mode || null,
      configured: !!mode
    },
    {
      key: 'mockPreset',
      label: 'Mock Preset',
      value: mockPreset || null,
      configured: !!mockPreset
    },
    {
      key: 'latency',
      label: 'Latency (ms)',
      value: latency !== undefined ? latency : null,
      configured: latency !== undefined
    }
  ];

  // Check for required properties
  if (!toolBehavior && !mockResponse && !providerId && !mode && !mockPreset) {
    baseResult.summaryTab.missingProperties = ['toolBehavior', 'mockResponse', 'providerId', 'mode', 'mockPreset'];
    baseResult.summaryTab.explanation = `No configuration found in Properties Panel. Please configure Tool Behavior, Mock Response, Provider, Mode, or Mock Preset.`;
    baseResult.outputsTab.result = 'No info input in properties panel';
    baseResult.outputsTab.resultType = 'error';
    baseResult.outputsTab.source = 'Missing Properties Panel configuration';
    baseResult.executionSummary = 'Missing required properties';
    return baseResult;
  }

  // Simulate latency if configured
  if (latency && latency > 0) {
    await delay(latency);
    baseResult.propertiesUsed.latency = latency; // Log actual latency applied
  }

  // Execute based on Properties Panel configuration
  if (mode === 'live') {
    // Use LLM to simulate tool behavior in live mode
    const toolPrompt = `You are a ${providerId || 'Generic Tool'} tool simulator. Simulate the result of a ${operation || 'execute'} operation with the following arguments:
${JSON.stringify({ input: inputData.input || '' }, null, 2)}

Provide a realistic response that would come from this tool. Return ONLY the result data as JSON, without any explanations or markdown.`;

    baseResult.result = await llmExecutor!(toolPrompt, `You are a tool simulator. Return ONLY the result data as JSON, without any explanations or markdown.`);
    baseResult.outputsTab.result = baseResult.result;
    baseResult.outputsTab.resultType = 'computed';
    baseResult.outputsTab.source = 'Live tool execution with LLM';
    baseResult.summaryTab.rulesFired = [
      providerId ? `Provider: ${providerId}` : '',
      operation ? `Operation: ${operation}` : '',
      'Live Mode'
    ].filter(Boolean);
    baseResult.summaryTab.explanation = `Executed tool in live mode with LLM: ${providerId}:${operation}`;
    baseResult.executionSummary = `Executed ${providerId || 'Tool'} with operation '${operation || 'N/A'}' in live mode`;
  } else if (mockPreset) {
    // Testing Panel must display resolved mock outputs, not raw tool_call JSON.
    let presetResult: any = null;
    let presetExplanation = '';
    const presetSource = `Mock Preset: ${mockPreset}`;

    // Use the getMockPresetData function from workflowRunnerPropertiesDriven.ts
    // Assuming getMockPresetData is accessible or can be imported/passed.
    // For now, I'll use a local placeholder if it's not directly available.
    // In a real scenario, this would be a shared utility.
    const getMockPresetDataLocal = (presetName: string): any => {
      switch (presetName) {
        case "list_success":
          return { status: 'success', data: ["item1", "item2", "item3"] };
        case "not_found":
          return { status: 'error', message: `${providerId || 'Tool'} ${operation || 'operation'} not found.` };
        case "timeout":
          // This case should ideally be handled by the latency simulation,
          // but for explicit mock preset, we return a timeout message.
          return { status: 'error', message: `Tool error: ${providerId || 'Tool'} ${operation || 'operation'} timed out.` };
        default:
          return mockResponse || { status: 'info', message: `Unknown mock preset '${mockPreset}'. Using generic response.` };
      }
    };

    presetResult = getMockPresetDataLocal(mockPreset);
    presetExplanation = `Used mock preset '${mockPreset}' for ${providerId || 'Tool'}:${operation || 'operation'}.`;

    baseResult.result = presetResult;
    baseResult.outputsTab.result = presetResult;
    baseResult.outputsTab.resultType = 'mock';
    baseResult.outputsTab.source = presetSource;
    baseResult.summaryTab.rulesFired = [`Mock Preset: ${mockPreset}`];
    baseResult.summaryTab.explanation = presetExplanation;
    baseResult.executionSummary = `Executed ${providerId || 'Tool'} with configured operation '${operation || 'N/A'}' using mock preset '${mockPreset}'.`;

  } else if (mockResponse) {
    // Fallback to direct mock response if no preset is specified
    try {
      baseResult.result = typeof mockResponse === 'string' ? JSON.parse(mockResponse) : mockResponse;
      baseResult.outputsTab.resultType = 'mock';
      baseResult.summaryTab.rulesFired = ['Mock Response'];
      baseResult.summaryTab.explanation = 'Used mock response configured in Properties Panel';
    } catch {
      baseResult.result = mockResponse;
      baseResult.outputsTab.resultType = 'mock';
      baseResult.summaryTab.rulesFired = ['Mock Response (text)'];
      baseResult.summaryTab.explanation = 'Used mock response text configured in Properties Panel';
    }
    baseResult.outputsTab.result = baseResult.result;
    baseResult.outputsTab.source = 'Mock Response from Properties Panel';
    baseResult.executionSummary = 'Used mock response from Properties Panel';
  } else if (llmExecutor) {
    // Use LLM to simulate tool behavior if no mock response or preset is provided
      const toolSchema = getToolSchema(providerId);
      const toolPrompt = `Tool: ${providerId || 'Generic Tool'}
Operation: ${operation || 'execute'}
Behavior: ${toolBehavior || 'No specific behavior defined'}

User Input: ${inputData.input || ''}

Execute according to the exact configuration in the Properties Panel.`;

      // Pass structured tool information to LLM
      const toolFunctions = tools ? tools.map(t => ({
        name: t.operation,
        description: t.description || `Tool for ${t.provider} with operation ${t.operation}`,
        parameters: t.parameters || { type: "OBJECT", properties: {} }
      })) : undefined;

      baseResult.result = await llmExecutor(toolPrompt, undefined, toolFunctions);
    baseResult.outputsTab.result = baseResult.result;
    baseResult.outputsTab.resultType = 'computed';
    baseResult.outputsTab.source = 'Tool execution with Properties Panel configuration';
    baseResult.summaryTab.rulesFired = [
      providerId ? `Provider: ${providerId}` : '',
      operation ? `Operation: ${operation}` : '',
      toolBehavior ? 'Behavior Rules' : ''
    ].filter(Boolean);
    baseResult.summaryTab.explanation = `Executed tool with Properties Panel configuration: ${baseResult.summaryTab.rulesFired.join(', ')}`;
    baseResult.executionSummary = `Executed with Properties Panel: ${baseResult.summaryTab.rulesFired.join(', ')}`;
  } else {
    // Fallback if no specific execution path is determined
    baseResult.outputsTab.result = 'No executable configuration for tool node.';
    baseResult.outputsTab.resultType = 'error';
    baseResult.outputsTab.source = 'No valid tool configuration';
    baseResult.summaryTab.explanation = 'Tool node has configuration but no valid execution path (e.g., no mock, preset, or LLM executor).';
    baseResult.executionSummary = 'No valid tool configuration';
  }

  baseResult.propertiesUsed = {
    toolBehavior: toolBehavior || null,
    mockResponse: mockResponse || null,
    providerId: providerId || null,
    operation: operation || null,
    mode: mode || null,
    mockPreset: mockPreset || null,
    latency: latency || null
  };

  // Populate trace information
  baseResult.trace = {
    tool: providerId || 'N/A',
    operation: operation || 'N/A',
    mode: mode || 'N/A',
    mockPreset: mockPreset || 'N/A',
    latencyAppliedMs: latency || 0,
    simulatedResponse: baseResult.result,
    executionPath: baseResult.executionSummary // Re-using summary for path
  };

  // Check for delegation context and add delegation information if present
  if (delegationContext && delegationContext[node.id]) {
    const delegationInfo = delegationContext[node.id];
    baseResult.trace.delegatedToTool = delegationInfo;
    baseResult.executionSummary = `Agent delegated request to Tool: ${delegationInfo.toolName} → operation: ${delegationInfo.operation}`;
  }

  return baseResult;
}

async function executeKnowledgeBaseNode(
  node: CanvasNode,
  nodeData: any,
  inputData: Record<string, any>,
  llmExecutor: ((prompt: string) => Promise<string>) | undefined,
  baseResult: PropertiesExecutionResult
): Promise<PropertiesExecutionResult> {
  const documents = nodeData?.documents || [];
  const operation = nodeData?.operation;
  const mockResponse = nodeData?.mockResponse;

  baseResult.inputsTab.properties = [
    {
      key: 'documents',
      label: 'Documents',
      value: documents.length > 0 ? `${documents.length} documents` : null,
      configured: documents.length > 0
    },
    {
      key: 'operation',
      label: 'Operation',
      value: operation || null,
      configured: !!operation
    },
    {
      key: 'mockResponse',
      label: 'Mock Response',
      value: mockResponse || null,
      configured: !!mockResponse
    }
  ];

  if (!documents.length && !mockResponse) {
    baseResult.summaryTab.missingProperties = ['documents', 'mockResponse'];
    baseResult.summaryTab.explanation = `No documents uploaded and no mock response configured in Properties Panel.`;
    baseResult.outputsTab.result = 'No info input in properties panel';
    baseResult.outputsTab.resultType = 'error';
    baseResult.outputsTab.source = 'Missing Properties Panel configuration';
    baseResult.executionSummary = 'Missing required properties';
    return baseResult;
  }

  if (mockResponse) {
    try {
      baseResult.result = typeof mockResponse === 'string' ? JSON.parse(mockResponse) : mockResponse;
      baseResult.outputsTab.resultType = 'mock';
    } catch {
      baseResult.result = mockResponse;
      baseResult.outputsTab.resultType = 'mock';
    }
    baseResult.outputsTab.result = baseResult.result;
    baseResult.outputsTab.source = 'Mock Response from Properties Panel';
    baseResult.summaryTab.rulesFired = ['Mock Response'];
    baseResult.summaryTab.explanation = 'Used mock response configured in Properties Panel';
    baseResult.executionSummary = 'Used mock response from Properties Panel';
  } else if (llmExecutor && documents.length > 0) {
    const kbPrompt = `Knowledge Base Query
Operation: ${operation || 'retrieve'}
Available Documents: ${documents.map((doc: any) => `- ${doc.name || doc.title || 'Document'}`).join('\n')}
Query: ${inputData.input || ''}

Based on the documents uploaded in the Properties Panel, provide relevant information.`;

    baseResult.result = await llmExecutor(kbPrompt);
    baseResult.outputsTab.result = baseResult.result;
    baseResult.outputsTab.resultType = 'computed';
    baseResult.outputsTab.source = 'Knowledge Base execution with Properties Panel documents';
    baseResult.summaryTab.rulesFired = [`${documents.length} documents`, operation || 'retrieve operation'];
    baseResult.summaryTab.explanation = `Executed knowledge base query using ${documents.length} documents from Properties Panel`;
    baseResult.executionSummary = `Executed with ${documents.length} documents from Properties Panel`;
  }

  baseResult.propertiesUsed = {
    documents: documents,
    operation: operation || null,
    mockResponse: mockResponse || null
  };

  return baseResult;
}

async function executeRouterNode(
  node: CanvasNode,
  nodeData: any,
  inputData: Record<string, any>,
  llmExecutor: ((prompt: string) => Promise<string>) | undefined,
  baseResult: PropertiesExecutionResult
): Promise<PropertiesExecutionResult> {
  const mode = nodeData?.mode;
  const expression = nodeData?.expression;
  const llmRule = nodeData?.llmRule;
  const mockResponse = nodeData?.mockResponse;

  // TODO: Implement generateRoutingReasoning
  // const routingReasoning = await generateRoutingReasoning(nodeData, inputData, availableTools);

  baseResult.inputsTab.properties = [
    {
      key: 'mode',
      label: 'Routing Mode',
      value: mode || null,
      configured: !!mode
    },
    {
      key: 'expression',
      label: 'Expression',
      value: expression || null,
      configured: !!expression
    },
    {
      key: 'llmRule',
      label: 'LLM Rule',
      value: llmRule || null,
      configured: !!llmRule
    },
    {
      key: 'mockResponse',
      label: 'Mock Response',
      value: mockResponse || null,
      configured: !!mockResponse
    }
  ];

  if (!mode && !expression && !llmRule && !mockResponse) {
    baseResult.summaryTab.missingProperties = ['mode', 'expression', 'llmRule', 'mockResponse'];
    baseResult.summaryTab.explanation = `No routing configuration found in Properties Panel.`;
    baseResult.outputsTab.result = 'No info input in properties panel';
    baseResult.outputsTab.resultType = 'error';
    baseResult.outputsTab.source = 'Missing Properties Panel configuration';
    baseResult.executionSummary = 'Missing required properties';
    return baseResult;
  }

  if (mockResponse) {
    try {
      baseResult.result = typeof mockResponse === 'string' ? JSON.parse(mockResponse) : mockResponse;
      baseResult.outputsTab.resultType = 'mock';
    } catch {
      baseResult.result = mockResponse;
      baseResult.outputsTab.resultType = 'mock';
    }
    baseResult.outputsTab.result = baseResult.result;
    baseResult.outputsTab.source = 'Mock Response from Properties Panel';
    baseResult.summaryTab.rulesFired = ['Mock Response'];
    baseResult.summaryTab.explanation = 'Used mock response configured in Properties Panel';
    baseResult.executionSummary = 'Used mock response from Properties Panel';
  } else if (mode === 'expression' && expression) {
    // Evaluate expression (simplified for demo)
    baseResult.result = `Expression result: ${expression}`;
    baseResult.outputsTab.result = baseResult.result;
    baseResult.outputsTab.resultType = 'computed';
    baseResult.outputsTab.source = 'Expression evaluation from Properties Panel';
    baseResult.summaryTab.rulesFired = ['Expression'];
    baseResult.summaryTab.explanation = `Evaluated expression from Properties Panel: ${expression}`;
    baseResult.executionSummary = 'Evaluated expression from Properties Panel';
  } else if (mode === 'llm' && llmRule && llmExecutor) {
    const routerPrompt = `${llmRule}

Input: ${JSON.stringify(inputData)}

Make a routing decision based on the rule configured in Properties Panel.`;

    baseResult.result = await llmExecutor(routerPrompt);
    baseResult.outputsTab.result = baseResult.result;
    baseResult.outputsTab.resultType = 'computed';
    baseResult.outputsTab.source = 'LLM routing with Properties Panel rule';
    baseResult.summaryTab.rulesFired = ['LLM Rule'];
    baseResult.summaryTab.explanation = `Applied LLM rule from Properties Panel: ${llmRule}`;
    baseResult.executionSummary = 'Applied LLM rule from Properties Panel';
  }

  baseResult.propertiesUsed = {
    mode: mode || null,
    expression: expression || null,
    llmRule: llmRule || null,
    mockResponse: mockResponse || null
  };

  return baseResult;
}

async function executeMessageNode(
  node: CanvasNode,
  nodeData: any,
  inputData: Record<string, any>,
  baseResult: PropertiesExecutionResult
): Promise<PropertiesExecutionResult> {
  const message = nodeData?.message;
  const template = nodeData?.template;
  const mockResponse = nodeData?.mockResponse;

  baseResult.inputsTab.properties = [
    {
      key: 'message',
      label: 'Message',
      value: message || null,
      configured: !!message
    },
    {
      key: 'template',
      label: 'Template',
      value: template || null,
      configured: !!template
    },
    {
      key: 'mockResponse',
      label: 'Mock Response',
      value: mockResponse || null,
      configured: !!mockResponse
    }
  ];

  if (!message && !template && !mockResponse) {
    baseResult.summaryTab.missingProperties = ['message', 'template', 'mockResponse'];
    baseResult.summaryTab.explanation = `No message configuration found in Properties Panel.`;
    baseResult.outputsTab.result = 'No info input in properties panel';
    baseResult.outputsTab.resultType = 'error';
    baseResult.outputsTab.source = 'Missing Properties Panel configuration';
    baseResult.executionSummary = 'Missing required properties';
    return baseResult;
  }

  if (mockResponse) {
    baseResult.result = mockResponse;
    baseResult.outputsTab.result = mockResponse;
    baseResult.outputsTab.resultType = 'mock';
    baseResult.outputsTab.source = 'Mock Response from Properties Panel';
    baseResult.summaryTab.rulesFired = ['Mock Response'];
    baseResult.summaryTab.explanation = 'Used mock response configured in Properties Panel';
    baseResult.executionSummary = 'Used mock response from Properties Panel';
  } else if (message) {
    baseResult.result = message;
    baseResult.outputsTab.result = message;
    baseResult.outputsTab.resultType = 'computed';
    baseResult.outputsTab.source = 'Message from Properties Panel';
    baseResult.summaryTab.rulesFired = ['Message'];
    baseResult.summaryTab.explanation = 'Used message configured in Properties Panel';
    baseResult.executionSummary = 'Used message from Properties Panel';
  } else if (template) {
    // Simple template processing
    let processedTemplate = template;
    Object.keys(inputData).forEach(key => {
      processedTemplate = processedTemplate.replace(new RegExp(`{{${key}}}`, 'g'), inputData[key] || '');
    });
    baseResult.result = processedTemplate;
    baseResult.outputsTab.result = processedTemplate;
    baseResult.outputsTab.resultType = 'computed';
    baseResult.outputsTab.source = 'Template processing from Properties Panel';
    baseResult.summaryTab.rulesFired = ['Template'];
    baseResult.summaryTab.explanation = 'Processed template configured in Properties Panel';
    baseResult.executionSummary = 'Processed template from Properties Panel';
  }

  baseResult.propertiesUsed = {
    message: message || null,
    template: template || null,
    mockResponse: mockResponse || null
  };

  return baseResult;
}

async function executeGenericNode(
  node: CanvasNode,
  nodeData: any,
  inputData: Record<string, any>,
  llmExecutor: ((prompt: string) => Promise<string>) | undefined,
  baseResult: PropertiesExecutionResult
): Promise<PropertiesExecutionResult> {
  const title = nodeData?.title;
  const description = nodeData?.description;
  const mockResponse = nodeData?.mockResponse;

  baseResult.inputsTab.properties = [
    {
      key: 'title',
      label: 'Title',
      value: title || null,
      configured: !!title
    },
    {
      key: 'description',
      label: 'Description',
      value: description || null,
      configured: !!description
    },
    {
      key: 'mockResponse',
      label: 'Mock Response',
      value: mockResponse || null,
      configured: !!mockResponse
    }
  ];

  if (!title && !description && !mockResponse) {
    baseResult.summaryTab.missingProperties = ['title', 'description', 'mockResponse'];
    baseResult.summaryTab.explanation = `No configuration found in Properties Panel for ${node.subtype || node.type} node.`;
    baseResult.outputsTab.result = 'No info input in properties panel';
    baseResult.outputsTab.resultType = 'error';
    baseResult.outputsTab.source = 'Missing Properties Panel configuration';
    baseResult.executionSummary = 'Missing required properties';
    return baseResult;
  }

  if (mockResponse) {
    try {
      baseResult.result = typeof mockResponse === 'string' ? JSON.parse(mockResponse) : mockResponse;
      baseResult.outputsTab.resultType = 'mock';
    } catch {
      baseResult.result = mockResponse;
      baseResult.outputsTab.resultType = 'mock';
    }
    baseResult.outputsTab.result = baseResult.result;
    baseResult.outputsTab.source = 'Mock Response from Properties Panel';
    baseResult.summaryTab.rulesFired = ['Mock Response'];
    baseResult.summaryTab.explanation = 'Used mock response configured in Properties Panel';
    baseResult.executionSummary = 'Used mock response from Properties Panel';
  } else if (llmExecutor && (title || description)) {
    const genericPrompt = `Node: ${title || node.id}
Type: ${node.subtype || node.type}
${description ? `Description: ${description}` : ''}

Input: ${JSON.stringify(inputData)}

Process according to the configuration in Properties Panel.`;

    baseResult.result = await llmExecutor(genericPrompt);
    baseResult.outputsTab.result = baseResult.result;
    baseResult.outputsTab.resultType = 'computed';
    baseResult.outputsTab.source = 'Generic execution with Properties Panel configuration';
    baseResult.summaryTab.rulesFired = [title ? 'Title' : '', description ? 'Description' : ''].filter(Boolean);
    baseResult.summaryTab.explanation = `Executed with Properties Panel configuration: ${baseResult.summaryTab.rulesFired.join(', ')}`;
    baseResult.executionSummary = `Executed with Properties Panel: ${baseResult.summaryTab.rulesFired.join(', ')}`;
  }

  baseResult.propertiesUsed = {
    title: title || null,
    description: description || null,
    mockResponse: mockResponse || null
  };

  return baseResult;
}

// New function for LLM-powered reasoning extraction
async function generateAgentReasoning(
  nodeData: any, 
  inputData: any, 
  llmExecutor: Function
): Promise<string> {
  const reasoningPrompt = `
Explain your reasoning for handling this request:

Node Configuration:
- Type: ${nodeData.type}
- Rules: ${nodeData.rules?.nl || 'None'}
- System Prompt: ${nodeData.systemPrompt || 'None'}

Input Received: ${JSON.stringify(inputData)}

Provide a 1-2 sentence explanation of your approach and decision-making process.
`;
  
  return await llmExecutor(reasoningPrompt);
}
