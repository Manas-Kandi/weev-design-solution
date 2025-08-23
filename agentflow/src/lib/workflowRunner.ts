import { CanvasNode, Connection, NodeOutput } from "@/types";
import { FlowEngine } from "@/lib/flow/FlowEngine";
import { logger } from "@/lib/logger";

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
interface WorkflowRunnerCallbacks {
  emitLog?: (
    nodeId: string,
    log: string,
    output?: NodeOutput,
    error?: string
  ) => void;
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
  if (!startNodeId) {
    throw new Error("Start node not set");
  }

  // Emit flow started event
  const flowStartTime = Date.now();

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

    // Call beforeNodeExecute callback if provided
    if (callbacks?.beforeNodeExecute) {
      await callbacks.beforeNodeExecute(currentNode);
    }

    // Prepare input data from connected nodes
    const inputData: Record<string, any> = {};
    const inputConnections = connections.filter(c => c.targetNode === currentNode.id);
    for (const conn of inputConnections) {
      if (executionResults[conn.sourceNode]) {
        inputData[conn.targetInput] = executionResults[conn.sourceNode][conn.sourceOutput];
      }
    }

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
      // Create LLM executor function for the properties testing bridge
      const llmExecutor = async () => { throw new Error('LLM is disabled in this build'); };

      // Use Properties-Testing Bridge for ALL node execution - PROPERTIES PANEL AS AUTHORITATIVE SOURCE
      const propertiesResult = await executeNodeFromProperties(
        currentNode,
        inputData,
        llmExecutor
      );
      
      // Extract the result for workflow continuation
      output = propertiesResult.result;
      
      // Store the full properties result for testing panel display
      executionResults[`${currentNode.id}_properties`] = propertiesResult;
      
      // Create outputs for all node output ports
      const nodeOutputs: Record<string, any> = {};
      currentNode.outputs.forEach(o => {
        nodeOutputs[o.id] = output;
      });
      executionResults[currentNode.id] = nodeOutputs;

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

    const nextConnection = connections.find((c) => c.sourceNode === currentNodeId);
    currentNodeId = nextConnection ? nextConnection.targetNode : null;
    executionCount++;
  }

  if (executionCount >= maxSteps) {
    console.warn("Workflow execution stopped to prevent infinite loop.");
  }

  // Emit flow finished event
  const flowEndTime = Date.now();

  return executionResults;
}

// Export as default for backward compatibility
export { runWorkflowWithProperties as runWorkflow };
