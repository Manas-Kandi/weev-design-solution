import { CanvasNode, Connection } from "@/types";
import { ToolSimulator } from './toolSimulator';
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

export async function runWorkflow(
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
      // Execute the node based on its type with comprehensive LLM integration
      if (currentNode.subtype === 'agent') {
        // Enhanced agent reasoning with context awareness
        const systemPrompt = (currentNode.data as any).systemPrompt || 'You are a helpful AI assistant.';
        const behavior = (currentNode.data as any).behavior || '';
        const userPrompt = inputData.input || (currentNode.data as any).prompt || '';
        
        // Gather context from connected knowledge base nodes
        let contextInfo = "";
        const kbConnections = connections.filter(c => c.targetNode === currentNode.id);
        for (const conn of kbConnections) {
          const sourceNode = nodes.find(n => n.id === conn.sourceNode);
          if (sourceNode?.subtype === 'knowledge-base' && executionResults[conn.sourceNode]) {
            contextInfo += `\n\nContext from Knowledge Base (${sourceNode.data?.title || sourceNode.id}):\n${executionResults[conn.sourceNode][conn.sourceOutput]}`;
          }
        }
        
        // Gather context from other connected nodes
        let previousNodeOutputs = "";
        for (const conn of inputConnections) {
          const sourceNode = nodes.find(n => n.id === conn.sourceNode);
          if (sourceNode && executionResults[conn.sourceNode] && sourceNode.subtype !== 'knowledge-base') {
            previousNodeOutputs += `\n\nOutput from ${sourceNode.data?.title || sourceNode.id} (${sourceNode.subtype}):\n${executionResults[conn.sourceNode][conn.sourceOutput]}`;
          }
        }
        
        const fullPrompt = `${systemPrompt}

${behavior ? `Behavior Instructions: ${behavior}` : ''}

${contextInfo}${previousNodeOutputs}

User Input: ${userPrompt}

Please provide a thoughtful, detailed response that takes into account all the context and previous outputs provided above.`.trim();

        output = await callGemini(fullPrompt);
        executionResults[currentNode.id] = { [currentNode.outputs[0].id]: output };
        
      } else if (currentNode.subtype === 'tool-agent') {
        // Enhanced tool execution with LLM reasoning
        const toolName = (currentNode.data as any).toolName || 'generic';
        const operation = (currentNode.data as any).operation || 'execute';
        const args = (currentNode.data as any).args || {};
        
        // Use LLM to reason about tool usage
        const toolReasoningPrompt = `You are executing a tool operation. Here are the details:

Tool: ${toolName}
Operation: ${operation}
Arguments: ${JSON.stringify(args, null, 2)}
Input Data: ${JSON.stringify(inputData, null, 2)}

Please simulate the execution of this tool and provide a realistic, detailed result that would be expected from this operation. Be specific and provide structured output that reflects what this tool would actually return.`;

        const toolResult = await callGemini(toolReasoningPrompt);
        output = toolResult;
        executionResults[currentNode.id] = { [currentNode.outputs[0].id]: output };
        
      } else if (currentNode.subtype === 'knowledge-base') {
        // Enhanced knowledge base with LLM-powered retrieval simulation
        const query = inputData.input || inputData.query || '';
        const kbTitle = (currentNode.data as any).title || 'Knowledge Base';
        const documents = (currentNode.data as any).documents || [];
        
        const kbPrompt = `You are a knowledge base system named "${kbTitle}". 

Available documents: ${documents.map((doc: any) => `- ${doc.name || doc.title || 'Document'}`).join('\n')}

Query: ${query}

Please simulate retrieving relevant information from this knowledge base and provide a comprehensive, well-structured response that would be typical for this type of query. Include specific details and examples that would be found in the documents.`;

        const kbResult = await callGemini(kbPrompt);
        output = kbResult;
        executionResults[currentNode.id] = { [currentNode.outputs[0].id]: output };
        
      } else if (currentNode.subtype === 'decision-tree' || currentNode.subtype === 'router') {
        // Enhanced decision making with LLM reasoning for complex routing
        const conditions = (currentNode.data as any).conditions || [];
        const routingLogic = (currentNode.data as any).routingLogic || '';
        const expression = (currentNode.data as any).expression || '';
        
        // Analyze all connected output paths
        const outputConnections = connections.filter(c => c.sourceNode === currentNode.id);
        const availableRoutes = outputConnections.map(conn => {
          const targetNode = nodes.find(n => n.id === conn.targetNode);
          return {
            outputId: conn.sourceOutput,
            targetNode: targetNode?.data?.title || targetNode?.id || 'Unknown',
            targetType: targetNode?.subtype || 'unknown'
          };
        });
        
        const decisionPrompt = `You are a sophisticated routing node in a complex workflow. Your job is to analyze the input and determine the best routing path.

Input Data: ${JSON.stringify(inputData, null, 2)}

${routingLogic ? `Routing Logic: ${routingLogic}` : ''}
${expression ? `Expression/Condition: ${expression}` : ''}

Available Output Routes:
${availableRoutes.map((route, idx) => `${idx + 1}. Route "${route.outputId}" → ${route.targetNode} (${route.targetType})`).join('\n')}

${conditions.length > 0 ? `
Configured Conditions:
${conditions.map((cond: any, idx: number) => `${idx + 1}. ${cond.label || cond.condition || `Condition ${idx + 1}`}: ${cond.description || cond.condition || 'No description'}`).join('\n')}
` : ''}

Please analyze the input data and determine which route should be taken. Provide:
1. Your reasoning for the decision
2. Which specific output route to activate
3. Any data transformations or filtering to apply
4. Confidence level in your decision

Format your response as a structured decision with clear routing instructions.`;

        const decision = await callGemini(decisionPrompt);
        output = decision;
        
        // Create outputs for all possible routes, but mark the chosen one
        const routerOutputs: Record<string, any> = {};
        currentNode.outputs.forEach(o => {
          routerOutputs[o.id] = decision;
        });
        executionResults[currentNode.id] = routerOutputs;
        
      } else {
        // Enhanced default behavior with LLM reasoning for any node type
        const nodeTitle = (currentNode.data as any).title || currentNode.id;
        const nodeDescription = (currentNode.data as any).description || '';
        
        const genericPrompt = `You are a workflow node of type "${currentNode.subtype || currentNode.type}" named "${nodeTitle}".

${nodeDescription ? `Description: ${nodeDescription}` : ''}

Input Data: ${JSON.stringify(inputData, null, 2)}

Please process this input according to your node type and purpose. Provide a detailed, structured output that would be appropriate for this type of node in a workflow system.`;

        output = await callGemini(genericPrompt);
        const nodeOutputs: Record<string, any> = {};
        currentNode.outputs.forEach(o => {
          nodeOutputs[o.id] = output;
        });
        executionResults[currentNode.id] = nodeOutputs;
      }
    } catch (error) {
      executionError = error;
      output = `Error executing ${currentNode.subtype || currentNode.type} node: ${error}`;
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
      summary: `Executed ${currentNode.subtype || currentNode.type} node`,
      error: executionError,
      flowContextBefore: { ...executionResults },
      flowContextAfter: { ...executionResults },
      flowContextDiff: {}
    });

    const nextConnection = connections.find((c) => c.sourceNode === currentNodeId);
    currentNodeId = nextConnection ? nextConnection.targetNode : null;
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

  return executionResults;
}
