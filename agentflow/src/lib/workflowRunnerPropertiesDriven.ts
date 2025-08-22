import { CanvasNode, Connection } from "@/types";
import { callLLM } from "./llmClient";
import { executeNodeFromProperties } from "./propertiesTestingBridge";
import { type UserTier } from "./subscriptionTiers";
import { defaultToolRule } from "../services/toolsim/toolRules";
import { normalizeCapability } from "@/lib/nodes/tool/capabilityMap";
import { getToolSchema } from "@/lib/nodes/tool/catalog";
import { generateExecutionReasoning } from "./testing/reasoningExtractor";

// Shared context for delegation information
const delegationContext: Record<string, any> = {};

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

// Placeholder for mock preset data retrieval. In a real scenario, this would load from a predefined source.
function getMockPresetData(presetName: string): any {
  switch (presetName) {
    case "list_success":
      return { success: true, data: ["item1", "item2", "item3"] };
    // Add more cases as needed
    default:
      return null;
  }
}

export async function runWorkflowWithProperties(
  nodes: CanvasNode[],
  connections: Connection[],
  startNodeId: string | null,
  options?: RunExecutionOptions,
  callbacks?: TestingCallbacks,
  testingOptions?: TestingOptions,
  userTier?: UserTier
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

    const nodeStartTime = Date.now();
    // Before node execution
    if (callbacks?.emitTesterEvent) {
      callbacks.emitTesterEvent({
        type: 'node-start',
        nodeId: currentNode.id,
        at: nodeStartTime,
        inputs: executionResults,
        properties: currentNode.data
      });
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
    let propertiesResult: any = null;
    
    try {
      // Execute node with reasoning capture
      const nodeResult = await executeNodeFromProperties(
        currentNode,
        executionResults,
        async (prompt: string, systemPrompt?: string) => {
          const result = await callLLM(prompt, 'basic', {
            systemPrompt,
            temperature: 0.7
          });
          
          // Generate reasoning for this LLM call
          const reasoning = await generateExecutionReasoning(
            currentNode,
            prompt,
            result,
            callLLM
          );
          
          return { result, reasoning };
        }
      );

      output = nodeResult.result;
      propertiesResult = nodeResult;

    } catch (error) {
      executionError = error;
      output = `Error executing ${currentNode.subtype || currentNode.type} node: ${error}`;
      
      // Still create outputs even on error and preserve propertiesResult if it exists
      const nodeOutputs: Record<string, any> = {};
      (currentNode.outputs || []).forEach(o => {
        nodeOutputs[o.id] = output;
      });
      
      // Store propertiesResult if it was captured before the error
      if (typeof propertiesResult !== 'undefined') {
        executionResults[currentNode.id] = {
          ...nodeOutputs,
          _rawResult: output,
          _propertiesResult: propertiesResult,
          _nodeType: currentNode.type,
          _nodeSubtype: currentNode.subtype,
        };
      } else {
        executionResults[currentNode.id] = nodeOutputs;
      }
    }

    // After node execution with enhanced event
    if (callbacks?.emitTesterEvent) {
      callbacks.emitTesterEvent({
        type: 'node-complete',
        nodeId: currentNode.id,
        at: Date.now(),
        duration: Date.now() - nodeStartTime,
        output: nodeResult.result,
        reasoning: nodeResult.reasoning,
        properties: currentNode.data,
        inputs: executionResults,
        technicalDetails: {
          model: currentNode.data.model || 'default',
          tokensUsed: nodeResult.propertiesUsed?.tokensUsed,
          confidence: nodeResult.propertiesUsed?.confidence
        }
      });
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

  // Check if there was a tier enforcement error during execution
  let workflowError = null;
  let finalStatus = 'success';
  
  // Look for tier enforcement errors in the execution results
  for (const [nodeId, nodeResult] of Object.entries(executionResults)) {
    if (nodeResult && typeof nodeResult === 'object' && '_propertiesResult' in nodeResult) {
      const propertiesResult = (nodeResult as any)._propertiesResult;
      if (propertiesResult?.executionSummary?.includes('Upgrade to Pro')) {
        workflowError = new Error(propertiesResult.executionSummary.replace('Error: ', ''));
        finalStatus = 'error';
        break;
      }
    }
  }

  // Emit flow finished event
  const flowEndTime = Date.now();
  callbacks?.emitTesterEvent?.({
    type: 'flow-finished',
    at: flowEndTime,
    status: finalStatus,
    durationMs: flowEndTime - flowStartTime
  });
  
  // Throw tier enforcement errors to fail the workflow
  if (workflowError) {
    throw workflowError;
  }

  console.log('🏁 Workflow execution completed:', {
    executionResults,
    resultKeys: Object.keys(executionResults),
    resultCount: Object.keys(executionResults).length
  });

  return executionResults;
}

// Export as default for backward compatibility
export { runWorkflowWithProperties as runWorkflow };
