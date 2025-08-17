import { CanvasNode, Connection } from "@/types";
import { callLLM } from "./llmClient";
import { executeNodeFromProperties } from "./propertiesTestingBridge";
import { defaultToolRule } from "../services/toolsim/toolRules";
import { normalizeCapability } from "@/lib/nodes/tool/capabilityMap";
import { getToolSchema } from "@/lib/nodes/tool/catalog";

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

      const modifiedCurrentNode = { ...currentNode }; // Create a shallow copy of the node
    const modifiedNodeData = { ...(currentNode.data as any) }; // Create a shallow copy of node data

    // Logic for injecting tool knowledge into Agent node data
    if (modifiedCurrentNode.type === 'agent' || modifiedCurrentNode.subtype === 'agent') {
      const connectedToolNodes = connections.filter((c: any) => {
        const source = c.sourceNode ?? c.source;
        const target = c.targetNode ?? c.target;
        const targetNode = nodes.find(n => n.id === target);
        return (
          source === modifiedCurrentNode.id &&
          (!!targetNode && (((targetNode as any).type === 'tool') || ((targetNode as any).subtype === 'tool')))
        );
      }).map((c: any) => nodes.find(n => n.id === (c.targetNode ?? c.target)));

      if (connectedToolNodes.length > 0) {
        let toolRules = '';
        connectedToolNodes.forEach(toolNode => {
          if (toolNode) {
            const providerId = (toolNode.data as any)?.simulation?.providerId;
            const operation = (toolNode.data as any)?.simulation?.operation;

            if (providerId && operation) {
              const toolRule = defaultToolRule(providerId, operation);
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
          const targetNode = nodes.find(n => n.id === target);
          return (
            source === modifiedCurrentNode.id &&
            (!!targetNode && (((targetNode as any).type === 'tool') || ((targetNode as any).subtype === 'tool')))
          );
        }).map((c: any) => nodes.find(n => n.id === (c.targetNode ?? c.target)));

        tools = connectedToolNodes.map(toolNode => {
          if (toolNode) {
            const provider = (toolNode.data as any)?.simulation?.providerId;
            const operation = (toolNode.data as any)?.simulation?.operation;
            const schema = provider ? getToolSchema(provider) : null;

            // Start with schema-declared capabilities (if any)
            let capabilities = [...(schema?.capabilities ?? [])];

            // Fallback: if schema has none, derive one from the node's configured provider/op
            if (capabilities.length === 0 && provider && operation) {
              capabilities.push(`${provider}.${operation}`);
            }

            // Normalize all caps (aliases / legacy)
            capabilities = capabilities.map(normalizeCapability);

            const toolKey = `${provider}.${operation}`;
            const parameters = toolParameterSchemas[toolKey] || { type: "OBJECT", properties: {} };

            return {
              toolNode: toolNode, // Include the actual tool node
              capabilities: capabilities, // Include capabilities
              functionDeclarations: [{
                name: operation, // Use operation as the function name
                description: `Tool for ${provider} with operation ${operation}`,
                parameters: parameters,
              }],
            };
          }
          return null;
        }).filter(Boolean);
      }

      // Create an llmExecutor that uses the unified LLM client
      const llmExecutor = async (prompt: string, systemPrompt?: string, toolsParam?: any[]) => {
        const result = await callLLM(prompt, {
          system: systemPrompt,
          temperature: 0.7,
          max_tokens: 1024
        });
        return result.text;
      };

      const propertiesResult = await executeNodeFromProperties(
        modifiedCurrentNode, // Use the potentially modified node
        inputData,
        llmExecutor,
        tools // Pass the collected tools to executeNodeFromProperties
      );
      
      console.log('✅ Node execution result:', {
        nodeId: currentNode.id,
        propertiesResult,
        output: propertiesResult.result
      });
      
      // Extract the result for workflow continuation
      output = propertiesResult.result;

      // --- Decide whether to delegate to a tool -------------------------------
      // Prefer intent capability; we’ll also try to parse an explicit tool_call
      // later. IMPORTANT: Do NOT throw if we have no capability; keep text.
      const agentIntent = propertiesResult.parsedIntent as
        | { capability?: string }
        | null
        | undefined;

      const agentCapability =
        agentIntent?.capability ? normalizeCapability(agentIntent.capability) : undefined;

      let matchedTool: any = null; // will be chosen only if we discover a capability
      // -----------------------------------------------------------------------

      // Match agent intent to the correct tool.
      matchedTool = agentCapability
        ? tools.find(t => (t.capabilities ?? []).includes(agentCapability))
        : null;

      // Debugging agent-to-tool routing logic.
      console.log("Agent parsed intent:", agentIntent);
      console.log("Available tools:", tools.map(t => t.capabilities));
      console.log("Matched tool:", matchedTool?.toolNode?.id);

      if (!matchedTool) {
        throw new Error(`No matching tool found for intent: ${agentIntent?.capability || 'N/A'}`);
      }

      // --- Tool Delegation Logic --- 
      let delegatedToolResult: any = null;
      let delegatedToolNode: CanvasNode | undefined = undefined;

      if (
        (currentNode.type === 'agent' || currentNode.subtype === 'agent') &&
        typeof output === 'string'
      ) {
        try {
          const parsedOutput = JSON.parse(output);

          console.log('DEBUG >> output (raw):', output);
          console.log('DEBUG >> parsedIntent:', agentIntent);
          console.log('DEBUG >> parsedOutput:', parsedOutput);
          console.log(
            'DEBUG >> availableTools:',
            tools.map(t => ({
              id: t.toolNode?.id,
              provider: (t.toolNode?.data as any)?.simulation?.providerId,
              op: (t.toolNode?.data as any)?.simulation?.operation,
              caps: t.capabilities
            }))
          );
          console.log('DEBUG >> matchedTool:', matchedTool?.toolNode?.id);

          // --- Choose routing source ---
          // 1) Intent capability wins
          let chosenCapability: string | undefined = agentCapability;

          // Debug chosen capability after it is computed
          console.log('DEBUG >> chosenCapability:', chosenCapability);

          // 2) Fallback to explicit tool_call JSON from the agent
          if (
            !chosenCapability &&
            parsedOutput?.tool_call?.tool_name &&
            parsedOutput?.tool_call?.operation
          ) {
            chosenCapability = normalizeCapability(
              `${parsedOutput.tool_call.tool_name}.${parsedOutput.tool_call.operation}`
            );
          }

          // 3) If still none and exactly ONE tool node is connected, pick its first capability.
          //    This makes simple flows (Agent -> Tool) “just work”.
          if (!chosenCapability && tools && tools.length === 1) {
            const onlyCaps = tools[0].capabilities ?? [];
            chosenCapability = onlyCaps[0];
          }

          // Debugging agent-to-tool routing logic.
          console.log('Agent parsed intent:', agentIntent);
          console.log('Chosen capability:', chosenCapability);
          console.log('Available tools:', tools.map((t) => t.capabilities));

          // If we STILL don’t have a capability, do not delegate. Keep text.
          if (!chosenCapability) {
            propertiesResult.executionSummary =
              'Agent returned text response (no tool delegation).';
            // Leave `output` as-is. Exit routing block.
          } else {
            // Ensure we actually have tool nodes connected
            if (!tools || tools.length === 0) {
              console.warn('Agent requested a tool, but no tool nodes are connected.');
              propertiesResult.executionSummary =
                'No tool nodes connected; returned text response.';
              // Leave `output` as-is. Exit routing block.
            } else {
              // Try to match by capability
              matchedTool = tools.find((t) => (t.capabilities ?? []).includes(chosenCapability!));

              // If agent didn't specify a capability but exactly one tool is connected,
              // route to that tool instead of throwing.
              if (!chosenCapability && tools.length === 1 && !matchedTool) {
                matchedTool = tools[0];
                console.warn('Routing fallback: no capability provided; using the only connected tool.');
              }
              
              if (!matchedTool) {
                throw new Error(`No matching tool found for intent: ${chosenCapability}`);
              }

              // When executing, prefer the matched tool node regardless of raw tool_call content.
              delegatedToolNode = matchedTool.toolNode;

              // Respect node configuration; args from JSON (if any) are inputs only.
              if (delegatedToolNode) {
                const delegatedSim = (delegatedToolNode.data as any)?.simulation || {};
                const toolProvider = delegatedSim.providerId;
                const toolOperation = delegatedSim.operation;
                const args = parsedOutput?.tool_call?.args ?? {};

                // Execute the chosen tool node (properties-driven; mock/latency respected).
                delegatedToolResult = await executeNodeFromProperties(
                  delegatedToolNode,
                  { inputs: { args } } as any,
                  llmExecutor,
                  tools
                );

                // Reflect delegation on the Agent node's properties result
                propertiesResult.executionSummary =
                  `Agent delegated request to Tool: ${toolProvider} → operation: ${toolOperation}`;
                propertiesResult.outputsTab.result = delegatedToolResult;
                propertiesResult.outputsTab.source =
                  `Delegated to Tool: ${toolProvider}: ${toolOperation}`;
                propertiesResult.summaryTab.explanation =
                  `Agent delegated to tool ${toolProvider}:${toolOperation}.`;
                propertiesResult.trace.delegatedToTool = {
                  toolName: toolProvider,
                  operation: toolOperation,
                  args,
                  toolNodeId: delegatedToolNode.id,
                  toolResult: delegatedToolResult,
                };

                // Agent’s output becomes the tool output
                output = delegatedToolResult;
              }
            }
          }
        } catch {
          // Not JSON (plain text agent reply) — keep NL output as-is.
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
