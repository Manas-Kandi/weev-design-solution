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

      // Use Properties-Testing Bridge for ALL node execution - PROPERTIES PANEL AS AUTHORITATIVE SOURCE
      const propertiesResult = await executeNodeFromProperties(
        currentNode,
        inputData,
        async (prompt: string, systemPrompt?: string) => {
          const result = await callGemini(prompt, systemPrompt ? { systemPrompt } : {});
          return typeof result === 'string' ? result : JSON.stringify(result);
        }
      );
      
      console.log('✅ Node execution result:', {
        nodeId: currentNode.id,
        propertiesResult,
        output: propertiesResult.result
      });
      
      // Extract the result for workflow continuation
      output = propertiesResult.result;
      
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
