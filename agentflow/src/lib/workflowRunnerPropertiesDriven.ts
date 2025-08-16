import { CanvasNode, Connection } from "@/types";
import { callGemini } from "./geminiClient";
import { executeNodeFromProperties } from "./propertiesTestingBridge";

// Local type definitions to make the file self-contained and avoid import issues.
interface Assertion {
  path: string;
  op: string;
  value: any;
  description?: string;
}

interface RunExecutionOptions {
  inputs?: Record<string, any>;
  assertions?: Assertion[];
  variables?: Record<string, any>;
}

// Enhanced testing panel callback types
interface TestingCallbacks {
  emitTesterEvent?: (event: any) => void;
  beforeNodeExecute?: (node: CanvasNode) => Promise<void>;
}

interface TestingOptions {
  scenario?: { description?: string };
  overrides?: {
    seed?: string;
    environment?: string;
    latency?: number;
    errorInjection?: boolean;
  };
}

/**
 * Properties-Driven Workflow Runner
 * 
 * This runner uses the Properties-Testing Bridge to execute nodes,
 * ensuring that Properties Panel configurations are the authoritative source
 * for all node behavior and outputs.
 */
const toolParameterSchemas: Record<string, any> = {
  'web_search.search': {
    type: "OBJECT",
    properties: {
      query: { type: "STRING", description: "The search query" }
    },
    required: ["query"]
  },
  'http_request.get': {
    type: "OBJECT",
    properties: {
      url: { type: "STRING", description: "The URL to send the GET request to" },
      headers: { type: "OBJECT", description: "Optional headers for the request" }
    },
    required: ["url"]
  },
  'http_request.post': {
    type: "OBJECT",
    properties: {
      url: { type: "STRING", description: "The URL to send the POST request to" },
      headers: { type: "OBJECT", description: "Optional headers for the request" },
      body: { type: "OBJECT", description: "The request body" }
    },
    required: ["url", "body"]
  },
  'calendar.list_events': {
    type: "OBJECT",
    properties: {
      startDate: { type: "STRING", description: "Start date for events (e.g., YYYY-MM-DD)" },
      endDate: { type: "STRING", description: "End date for events (e.g., YYYY-MM-DD)" },
      calendarId: { type: "STRING", description: "Optional calendar ID" }
    },
    required: []
  },
  'calendar.find_free_slot': {
    type: "OBJECT",
    properties: {
      durationMinutes: { type: "NUMBER", description: "Duration of the free slot in minutes" },
      startDate: { type: "STRING", description: "Start date to search from (e.g., YYYY-MM-DD)" },
      endDate: { type: "STRING", description: "End date to search until (e.g., YYYY-MM-DD)" }
    },
    required: ["durationMinutes", "startDate", "endDate"]
  },
  'calendar.create_event': {
    type: "OBJECT",
    properties: {
      title: { type: "STRING", description: "Title of the event" },
      startTime: { type: "STRING", description: "Start time of the event (e.g., YYYY-MM-DDTHH:MM:SS)" },
      endTime: { type: "STRING", description: "End time of the event (e.g., YYYY-MM-DDTHH:MM:SS)" },
      location: { type: "STRING", description: "Location of the event" },
      description: { type: "STRING", description: "Description of the event" }
    },
    required: ["title", "startTime", "endTime"]
  },
  'gmail.list_emails': {
    type: "OBJECT",
    properties: {
      maxResults: { type: "NUMBER", description: "Maximum number of emails to return" }
    },
    required: []
  },
  'gmail.search_emails': {
    type: "OBJECT",
    properties: {
      query: { type: "STRING", description: "Search query for emails" }
    },
    required: ["query"]
  },
  'gmail.send_email': {
    type: "OBJECT",
    properties: {
      to: { type: "STRING", description: "Recipient email address" },
      subject: { type: "STRING", description: "Email subject" },
      body: { type: "STRING", description: "Email body" }
    },
    required: ["to", "subject", "body"]
  },
  'sheets.read_range': {
    type: "OBJECT",
    properties: {
      range: { type: "STRING", description: "The range to read (e.g., Sheet1!A1:B10)" }
    },
    required: ["range"]
  },
  'sheets.insert_row': {
    type: "OBJECT",
    properties: {
      sheetName: { type: "STRING", description: "Name of the sheet" },
      data: { type: "OBJECT", description: "The row data as a JSON object" }
    },
    required: ["sheetName", "data"]
  },
  'sheets.update_row': {
    type: "OBJECT",
    properties: {
      sheetName: { type: "STRING", description: "Name of the sheet" },
      rowIndex: { type: "NUMBER", description: "Index of the row to update" },
      data: { type: "OBJECT", description: "The updated row data as a JSON object" }
    },
    required: ["sheetName", "rowIndex", "data"]
  },
  'image_generation.generate': {
    type: "OBJECT",
    properties: {
      prompt: { type: "STRING", description: "Text prompt for image generation" }
    },
    required: ["prompt"]
  },
  'database_query.select': {
    type: "OBJECT",
    properties: {
      query: { type: "STRING", description: "SQL-like query string" }
    },
    required: ["query"]
  },
  'database_query.insert': {
    type: "OBJECT",
    properties: {
      tableName: { type: "STRING", description: "Name of the table" },
      data: { type: "OBJECT", description: "Data to insert as a JSON object" }
    },
    required: ["tableName", "data"]
  },
  'database_query.update': {
    type: "OBJECT",
    properties: {
      tableName: { type: "STRING", description: "Name of the table" },
      condition: { type: "STRING", description: "SQL-like WHERE clause" },
      data: { type: "OBJECT", description: "Data to update as a JSON object" }
    },
    required: ["tableName", "condition", "data"]
  }
};

export async function runWorkflowWithProperties(
  nodes: CanvasNode[],
  connections: Connection[],
  startNodeId: string | null,
  options?: RunExecutionOptions,
  callbacks?: TestingCallbacks,
  testingOptions?: TestingOptions
): Promise<Record<string, unknown>> {
  console.log('🚀 Starting workflow execution:', {
    startNodeId,
    nodeCount: nodes.length,
    connectionCount: connections.length,
    options,
    testingOptions
  });

  if (!startNodeId) {
    throw new Error("Start node not set");
  }

  // Emit flow started event
  const flowStartTime = Date.now();
  callbacks?.emitTesterEvent?.({
    type: 'flow-started',
    at: flowStartTime,
    startNodeId
  });

  const executionResults: Record<string, any> = { ...(options?.inputs ?? {}) };
  let currentNodeId: string | null = startNodeId;
  let executionCount = 0;
  const maxSteps = nodes.length * 2; // Prevent infinite loops

  while (currentNodeId && executionCount < maxSteps) {
    const currentNode = nodes.find((n) => n.id === currentNodeId);
    if (!currentNode) {
      throw new Error(`Node with id ${currentNodeId} not found`);
    }

    // Emit node started event
    const nodeStartTime = Date.now();
    callbacks?.emitTesterEvent?.({
      type: 'node-started',
      nodeId: currentNode.id,
      title: (currentNode.data as any)?.title || currentNode.id,
      nodeType: currentNode.type,
      nodeSubtype: currentNode.subtype,
      at: nodeStartTime,
      cause: { kind: 'all-inputs-ready', inputCount: 0 },
      flowContextBefore: { ...executionResults }
    });

    // Call beforeNodeExecute callback if provided
    if (callbacks?.beforeNodeExecute) {
      await callbacks.beforeNodeExecute(currentNode);
    }

    // Prepare input data from connected nodes (support multiple connection shapes)
    const inputData: Record<string, any> = {};
    const inputConnections = connections.filter((c: any) => {
      const target = c.targetNode ?? c.target;
      return target === currentNode.id;
    });
    for (const raw of inputConnections as any[]) {
      const sourceNode = raw.sourceNode ?? raw.source;
      const targetInput = raw.targetInput ?? raw.targetHandle ?? 'input';
      const sourceOutput = raw.sourceOutput ?? raw.sourceHandle ?? Object.keys(executionResults[sourceNode] || {})[0];
      if (sourceNode && executionResults[sourceNode]) {
        inputData[targetInput] = executionResults[sourceNode][sourceOutput];
      }
    }
    console.log('🔗 Input connection resolution:', { nodeId: currentNode.id, inputConnections, inputData });

    // For the start node, merge any initial inputs from options
    if (currentNode.id === startNodeId && options?.inputs) {
      Object.assign(inputData, options.inputs);
    }

    // Add scenario input if this is the start node
    if (currentNode.id === startNodeId && testingOptions?.scenario?.description) {
      inputData.input = testingOptions.scenario.description;
    }

    let output: any;
    let executionError: any = null;
    
    try {
      console.log('🔄 Executing node:', {
        nodeId: currentNode.id,
        nodeType: currentNode.type,
        nodeSubtype: currentNode.subtype,
        inputData,
        nodeData: currentNode.data
      });

      let modifiedCurrentNode = { ...currentNode }; // Create a shallow copy of the node
    let modifiedNodeData = { ...(currentNode.data as any) }; // Create a shallow copy of node data

    // Logic for injecting tool knowledge into Agent node data
    if (modifiedCurrentNode.type === 'agent' || modifiedCurrentNode.subtype === 'agent') {
      const connectedToolNodes = connections.filter((c: any) => {
        const source = c.sourceNode ?? c.source;
        const target = c.targetNode ?? c.target;
        return source === modifiedCurrentNode.id && (nodes.find(n => n.id === target)?.type === 'tool' || nodes.find(n => n.id === target)?.subtype === 'tool');
      }).map((c: any) => nodes.find(n => n.id === (c.targetNode ?? c.target)));

      if (connectedToolNodes.length > 0) {
        let toolRules = '';
        connectedToolNodes.forEach(toolNode => {
          if (toolNode) {
            const simulation = (toolNode.data as any)?.simulation || {};
            const providerId = simulation.providerId;
            const operation = simulation.operation;
            const mode = simulation.mode; // Although mode is not used in the rule, it's part of the tool's context

            if (providerId && operation) {
              const toolRule = `You now have access to the ${providerId} tool with the ${operation} operation. This tool is a mock simulator, and you have full, implicit permission to use it. When a user request matches the type of capability this tool provides, you must route the request through this tool, and only through this tool. Do not invent functionality, ask for consent, or request additional details. Directly execute the tool call and return its results.`;
              if (!modifiedNodeData.systemPrompt || !modifiedNodeData.systemPrompt.includes(toolRule)) {
                toolRules += `\n\n${toolRule}`;
              }
            }
          }
        });

        if (toolRules) {
          modifiedNodeData.systemPrompt = (modifiedNodeData.systemPrompt || '') + toolRules;
          modifiedCurrentNode.data = modifiedNodeData; // Update the data of the modified node
        }
      }
    }

      // Use Properties-Testing Bridge for ALL node execution - PROPERTIES PANEL AS AUTHORITATIVE SOURCE
      // Collect tool definitions for agent nodes
      let tools: any[] = [];
      if (modifiedCurrentNode.type === 'agent' || modifiedCurrentNode.subtype === 'agent') {
        const connectedToolNodes = connections.filter((c: any) => {
          const source = c.sourceNode ?? c.source;
          const target = c.targetNode ?? c.target;
          return source === modifiedCurrentNode.id && (nodes.find(n => n.id === target)?.type === 'tool' || nodes.find(n => n.id === target)?.subtype === 'tool');
        }).map((c: any) => nodes.find(n => n.id === (c.targetNode ?? c.target)));

        tools = connectedToolNodes.map(toolNode => {
          if (toolNode) {
            const simulation = (toolNode.data as any)?.simulation || {};
            const providerId = simulation.providerId;
            const operation = simulation.operation;
            const toolKey = `${providerId}.${operation}`;
            const parameters = toolParameterSchemas[toolKey] || { type: "OBJECT", properties: {} };

            if (providerId && operation) {
              const toolRule = `You now have access to the ${providerId} tool with the ${operation} operation. This tool is a mock simulator, and you have full, implicit permission to use it. When a user request matches the type of capability this tool provides, you must route the request through this tool, and only through this tool. Do not invent functionality, ask for consent, or request additional details. Directly execute the tool call and return its results.`;
              if (!modifiedNodeData.systemPrompt || !modifiedNodeData.systemPrompt.includes(toolRule)) {
                toolRules += `\n\n${toolRule}`;
              }
            }

            return {
              functionDeclarations: [{
                name: operation, // Use operation as the function name
                description: `Tool for ${providerId} with operation ${operation}`,
                parameters: parameters,
              }],
            };
          }
          return null;
        }).filter(Boolean);
      }

      const propertiesResult = await executeNodeFromProperties(
        modifiedCurrentNode, // Use the potentially modified node
        inputData,
        async (prompt: string, systemPrompt?: string, tools?: any[]) => {
          const result = await callGemini(prompt, systemPrompt ? { systemPrompt } : {}, tools ? { tools } : {});
          return typeof result === 'string' ? result : JSON.stringify(result);
        },
        tools // Pass the collected tools to executeNodeFromProperties
      );
      
      console.log('✅ Node execution result:', {
        nodeId: currentNode.id,
        propertiesResult,
        output: propertiesResult.result
      });
      
      // Extract the result for workflow continuation
      output = propertiesResult.result;

      // --- Tool Delegation Logic --- 
      let delegatedToolResult: any = null;
      let delegatedToolNode: CanvasNode | undefined = undefined;

      if ((currentNode.type === 'agent' || currentNode.subtype === 'agent') && typeof output === 'string') {
        try {
          const parsedOutput = JSON.parse(output);
          if (parsedOutput && parsedOutput.tool_call) {
            const { tool_name, operation, args } = parsedOutput.tool_call;

            // Find the connected tool node
            delegatedToolNode = nodes.find(n =>
              (n.type === 'tool' || n.subtype === 'tool') &&
              (n.data as any)?.simulation?.providerId === tool_name &&
              (n.data as any)?.simulation?.operation === operation
            );

            if (delegatedToolNode) {
              console.log(`Agent ${currentNode.id} delegating to tool ${tool_name}:${operation}`);
              // Execute the delegated tool node
              const toolExecutionResult = await executeNodeFromProperties(
                delegatedToolNode,
                args || {},
                async (prompt: string, systemPrompt?: string) => {
                  const result = await callGemini(prompt, systemPrompt ? { systemPrompt } : {});
                  return typeof result === 'string' ? result : JSON.stringify(result);
                }
              );
              delegatedToolResult = toolExecutionResult.result;

              // Update Agent's propertiesResult to reflect delegation
              propertiesResult.executionSummary = `Agent delegated request to Tool: ${tool_name} → operation: ${operation}`;
              propertiesResult.outputsTab.result = delegatedToolResult;
              propertiesResult.outputsTab.source = `Delegated to Tool: ${tool_name}:${operation}`;
              propertiesResult.summaryTab.explanation = `Agent delegated to tool ${tool_name}:${operation}.`;
              propertiesResult.trace.delegatedToTool = {
                toolName: tool_name,
                operation: operation,
                args: args,
                toolNodeId: delegatedToolNode.id,
                toolResult: delegatedToolResult
              };
              output = delegatedToolResult; // Agent's output becomes the tool's output
            } else {
              console.warn(`Agent ${currentNode.id} attempted to call unknown tool: ${tool_name}:${operation}`);
              propertiesResult.executionSummary = `Agent attempted to call unknown tool: ${tool_name}:${operation}`;
              propertiesResult.outputsTab.result = `Error: Tool ${tool_name}:${operation} not found or not configured.`;
              propertiesResult.outputsTab.source = 'Tool delegation failed';
              propertiesResult.summaryTab.explanation = `Agent attempted to call unknown tool: ${tool_name}:${operation}.`;
              propertiesResult.trace.delegationError = `Tool ${tool_name}:${operation} not found.`;
            }
          }
        } catch (e) {
          // Not a tool call JSON, or parsing error. Agent's output remains as is.
          console.log(`Agent output for ${currentNode.id} is not a tool call JSON or parsing error:`, e);
        }
      }
      // --- End Tool Delegation Logic ---
      
      console.log('📦 Creating node outputs:', {
        nodeId: currentNode.id,
        output,
        propertiesResult,
        nodeOutputIds: currentNode.outputs.map(o => o.id)
      });
      
      // Create outputs for this node - store both the raw result and structured outputs
      const nodeOutputs: Record<string, any> = {};
      currentNode.outputs.forEach(o => {
        nodeOutputs[o.id] = output;
      });
      
      // Store the complete result structure for this node
      executionResults[currentNode.id] = {
        ...nodeOutputs,
        _rawResult: output,
        _propertiesResult: propertiesResult,
        _nodeType: currentNode.type,
        _nodeSubtype: currentNode.subtype
      };

    } catch (error) {
      executionError = error;
      output = `Error executing ${currentNode.subtype || currentNode.type} node: ${error}`;
      
      // Still create outputs even on error
      const nodeOutputs: Record<string, any> = {};
      currentNode.outputs.forEach(o => {
        nodeOutputs[o.id] = output;
      });
      executionResults[currentNode.id] = nodeOutputs;
    }

    // Emit node finished event
    const nodeEndTime = Date.now();
    callbacks?.emitTesterEvent?.({
      type: 'node-finished',
      nodeId: currentNode.id,
      title: (currentNode.data as any)?.title || currentNode.id,
      nodeType: currentNode.type,
      nodeSubtype: currentNode.subtype,
      at: nodeEndTime,
      durationMs: nodeEndTime - nodeStartTime,
      output,
      summary: `Executed ${currentNode.subtype || currentNode.type} node using Properties Panel configuration`,
      error: executionError,
      flowContextBefore: { ...executionResults },
      flowContextAfter: { ...executionResults },
      flowContextDiff: {}
    });

    // Find next node using normalized connection fields
    const nextConnection: any = connections.find((c: any) => (c.sourceNode ?? c.source) === currentNodeId);
    const nextNodeId = nextConnection ? (nextConnection.targetNode ?? nextConnection.target) : null;
    console.log('🔄 Next Node Traversal:', {
      currentNodeId,
      foundNextConnection: !!nextConnection,
      nextNodeId,
      connectionDirection: nextConnection ? { source: nextConnection.sourceNode ?? nextConnection.source, target: nextConnection.targetNode ?? nextConnection.target } : null
    });
    currentNodeId = nextNodeId;
    executionCount++;
  }

  if (executionCount >= maxSteps) {
    console.warn("Workflow execution stopped to prevent infinite loop.");
  }

  // Emit flow finished event
  const flowEndTime = Date.now();
  callbacks?.emitTesterEvent?.({
    type: 'flow-finished',
    at: flowEndTime,
    status: 'success',
    durationMs: flowEndTime - flowStartTime
  });

  console.log('🏁 Workflow execution completed:', {
    executionResults,
    resultKeys: Object.keys(executionResults),
    resultCount: Object.keys(executionResults).length
  });

  return executionResults;
}

// Export as default for backward compatibility
export { runWorkflowWithProperties as runWorkflow };
