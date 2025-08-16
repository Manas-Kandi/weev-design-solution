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

import { CanvasNode } from "@/types";

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
  inputData: Record<string, any> = {},
  llmExecutor?: (prompt: string) => Promise<string>
): Promise<PropertiesExecutionResult> {
  const nodeData = node.data as any;
  const nodeTitle = nodeData?.title || node.id;
  
  // Base result structure
  const baseResult: PropertiesExecutionResult = {
    result: null,
    propertiesUsed: {},
    executionSummary: '',
    nodeType: node.subtype || node.type,
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
    }
  };

  try {
    switch (node.subtype) {
      case 'agent':
        return await executeAgentNode(node, nodeData, inputData, llmExecutor, baseResult);
      
      case 'tool-agent':
      case 'tool':
        return await executeToolNode(node, nodeData, inputData, llmExecutor, baseResult);
      
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
  inputData: Record<string, any>,
  llmExecutor: ((prompt: string) => Promise<string>) | undefined,
  baseResult: PropertiesExecutionResult
): Promise<PropertiesExecutionResult> {
  const systemPrompt = nodeData?.systemPrompt;
  const behavior = nodeData?.behavior;
  const rulesNl = nodeData?.rules?.nl; // Generic agent rules from Properties Panel
  const mockResponse = nodeData?.mockResponse;
  const userPrompt = inputData.input || '';

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
    
    if (rulesNl) {
      // Use natural language rules directly as the primary instruction
      fullPrompt = `${rulesNl}

User Input: ${userPrompt}

Follow the rules above exactly as specified.`.trim();
    } else {
      // Fallback to system prompt + behavior format
      fullPrompt = `${systemPrompt || 'You are a helpful AI assistant.'}

${behavior ? `User-Defined Behavior: ${behavior}` : ''}

User Input: ${userPrompt}

Respond according to the exact behavior and system prompt configured in the Properties Panel.`.trim();
    }

    baseResult.result = await llmExecutor(fullPrompt);
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
  } else {
    baseResult.outputsTab.result = 'No info input in properties panel';
    baseResult.outputsTab.resultType = 'error';
    baseResult.outputsTab.source = 'Insufficient Properties Panel configuration';
    baseResult.summaryTab.explanation = 'Properties Panel has partial configuration but no execution method available';
    baseResult.executionSummary = 'Insufficient configuration';
  }

  baseResult.propertiesUsed = {
    systemPrompt: systemPrompt || null,
    behavior: behavior || null,
    mockResponse: mockResponse || null
  };

  return baseResult;
}

async function executeToolNode(
  node: CanvasNode,
  nodeData: any,
  inputData: Record<string, any>,
  llmExecutor: ((prompt: string) => Promise<string>) | undefined,
  baseResult: PropertiesExecutionResult
): Promise<PropertiesExecutionResult> {
  const toolBehavior = nodeData?.rules?.nl;
  const mockResponse = nodeData?.mockResponse;
  const simulation = nodeData?.simulation || {};
  const providerId = simulation.providerId;
  const operation = simulation.operation;

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
    }
  ];

  // Check for required properties
  if (!toolBehavior && !mockResponse && !providerId) {
    baseResult.summaryTab.missingProperties = ['toolBehavior', 'mockResponse', 'providerId'];
    baseResult.summaryTab.explanation = `No configuration found in Properties Panel. Please configure Tool Behavior, Mock Response, or Provider.`;
    baseResult.outputsTab.result = 'No info input in properties panel';
    baseResult.outputsTab.resultType = 'error';
    baseResult.outputsTab.source = 'Missing Properties Panel configuration';
    baseResult.executionSummary = 'Missing required properties';
    return baseResult;
  }

  // Execute based on Properties Panel configuration
  if (mockResponse) {
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
    const toolPrompt = `Tool: ${providerId || 'Generic Tool'}
Operation: ${operation || 'execute'}
Behavior: ${toolBehavior || 'No specific behavior defined'}

User Input: ${inputData.input || ''}

Execute according to the exact configuration in the Properties Panel.`;

    baseResult.result = await llmExecutor(toolPrompt);
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
  }

  baseResult.propertiesUsed = {
    toolBehavior: toolBehavior || null,
    mockResponse: mockResponse || null,
    providerId: providerId || null,
    operation: operation || null
  };

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
