import { CanvasNode, Connection } from "@/types";
import { ToolSimulator } from './ToolSimulator.1';
import { callGemini } from "./geminiClient";

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

export async function runWorkflow(
  nodes: CanvasNode[],
  connections: Connection[],
  startNodeId: string | null,
  options?: RunExecutionOptions
): Promise<Record<string, unknown>> {
  if (!startNodeId) {
    throw new Error("Start node not set");
  }

  const executionResults: Record<string, any> = { ...(options?.inputs ?? {}) };
  let currentNodeId: string | null = startNodeId;
  let executionCount = 0;
  const maxSteps = nodes.length * 2; // Prevent infinite loops

  while (currentNodeId && executionCount < maxSteps) {
    const currentNode = nodes.find((n) => n.id === currentNodeId);
    if (!currentNode) {
      throw new Error(`Node with id ${currentNodeId} not found`);
    }

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

    let output: any;

    if (currentNode.subtype === 'agent') {
            const systemPrompt = (currentNode.data as any).systemPrompt || '';
            const userPrompt = inputData.input || (currentNode.data as any).prompt || '';
      const fullPrompt = `${systemPrompt}\n\n${userPrompt}`.trim();
      output = await callGemini(fullPrompt);
      executionResults[currentNode.id] = { [currentNode.outputs[0].id]: output };
    } else if (currentNode.subtype === 'tool-agent') {
            if (!currentNode.data) {
        throw new Error(`Data not specified for node ${currentNode.id}`);
      }
      const toolType = (currentNode.data as any).toolConfig?.toolType;
      if (!toolType) {
        throw new Error(`Tool type not specified for node ${currentNode.id}`);
      }
                        output = await new ToolSimulator().simulate(toolType, inputData);
      executionResults[currentNode.id] = { [currentNode.outputs[0].id]: output };
    } else {
      const nodeOutputs: Record<string, any> = {};
      currentNode.outputs.forEach(o => {
        nodeOutputs[o.id] = Object.values(inputData).length > 0 ? Object.values(inputData)[0] : undefined;
      });
      executionResults[currentNode.id] = nodeOutputs;
    }

    const nextConnection = connections.find((c) => c.sourceNode === currentNodeId);
    currentNodeId = nextConnection ? nextConnection.targetNode : null;
    executionCount++;
  }

  if (executionCount >= maxSteps) {
    console.warn("Workflow execution stopped to prevent infinite loop.");
  }

  return executionResults;
}
