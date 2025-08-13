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
        // Enhanced agent reasoning with context awareness - using actual properties panel data
        const systemPrompt = (currentNode.data as any).systemPrompt || 'You are a helpful AI assistant.';
        const behavior = (currentNode.data as any).behavior || ''; // This comes from properties panel
        const userPrompt = inputData.input || testingOptions?.scenario?.description || '';
        
        // Gather context from connected knowledge base nodes
        let contextInfo = "";
        const kbConnections = connections.filter(c => c.targetNode === currentNode.id);
        for (const conn of kbConnections) {
          const sourceNode = nodes.find(n => n.id === conn.sourceNode);
          if (sourceNode?.subtype === 'knowledge-base' && executionResults[conn.sourceNode]) {
            const nodeName = (sourceNode.data as any)?.title || sourceNode.id;
            contextInfo += `\n\nContext from Knowledge Base (${nodeName}):\n${executionResults[conn.sourceNode][conn.sourceOutput]}`;
          }
        }
        
        // Gather context from other connected nodes
        let previousNodeOutputs = "";
        for (const conn of inputConnections) {
          const sourceNode = nodes.find(n => n.id === conn.sourceNode);
          if (sourceNode && executionResults[conn.sourceNode] && sourceNode.subtype !== 'knowledge-base') {
            const nodeName = (sourceNode.data as any)?.title || sourceNode.id;
            previousNodeOutputs += `\n\nOutput from ${nodeName} (${sourceNode.subtype}):\n${executionResults[conn.sourceNode][conn.sourceOutput]}`;
          }
        }
        
        // Build comprehensive prompt using properties panel data
        const fullPrompt = `${systemPrompt}

${behavior ? `User-Defined Behavior: ${behavior}` : 'No specific behavior defined - use general AI assistant capabilities.'}

${contextInfo}${previousNodeOutputs}

User Input: ${userPrompt}

Based on the behavior defined in the properties panel and the context provided, please provide a thoughtful, detailed response that demonstrates the specific behavior and capabilities described.`.trim();

        const llmResponse = await callGemini(fullPrompt);
        
        // Create enhanced output with friendly format + metadata
        output = {
          response: llmResponse,
          metadata: {
            nodeType: 'agent',
            nodeId: currentNode.id,
            behavior: behavior || 'No specific behavior defined',
            systemPrompt: systemPrompt,
            userInput: userPrompt,
            contextSources: kbConnections.length + inputConnections.length,
            executionTime: Date.now(),
            llmProvider: 'gemini'
          }
        };
        executionResults[currentNode.id] = { [currentNode.outputs[0].id]: llmResponse };
        
      } else if (currentNode.subtype === 'tool-agent') {
        // Enhanced tool execution with LLM reasoning - using actual properties panel data
        const toolBehavior = (currentNode.data as any).rules?.nl || ''; // This comes from properties panel
        const simulation = (currentNode.data as any).simulation || {};
        const providerId = simulation.providerId || 'generic';
        const operation = simulation.operation || 'execute';
        const userPrompt = inputData.input || testingOptions?.scenario?.description || '';
        
        // Gather context from connected nodes
        let previousNodeOutputs = "";
        for (const conn of inputConnections) {
          const sourceNode = nodes.find(n => n.id === conn.sourceNode);
          if (sourceNode && executionResults[conn.sourceNode]) {
            const nodeName = (sourceNode.data as any)?.title || sourceNode.id;
            previousNodeOutputs += `\n\nInput from ${nodeName} (${sourceNode.subtype}):\n${executionResults[conn.sourceNode][conn.sourceOutput]}`;
          }
        }
        
        // Use LLM to reason about tool usage based on properties panel behavior
        const toolReasoningPrompt = `You are a tool agent with the following behavior defined by the user:

Tool Behavior: ${toolBehavior || 'No specific behavior defined - act as a general tool agent.'}

Provider: ${providerId}
Operation: ${operation}
${previousNodeOutputs}

User Input: ${userPrompt}

Based on the behavior defined in the properties panel, simulate executing this tool and provide a realistic, detailed result. Make sure your response demonstrates the specific behavior and capabilities described by the user. Be specific and provide structured output that reflects what this tool would actually return.`;

        const toolResult = await callGemini(toolReasoningPrompt);
        
        // Create enhanced output with friendly format + metadata
        output = {
          response: toolResult,
          metadata: {
            nodeType: 'tool-agent',
            nodeId: currentNode.id,
            behavior: toolBehavior || 'No specific behavior defined',
            provider: providerId,
            operation: operation,
            userInput: userPrompt,
            contextSources: inputConnections.length,
            executionTime: Date.now(),
            llmProvider: 'gemini'
          }
        };
        executionResults[currentNode.id] = { [currentNode.outputs[0].id]: toolResult };
        
      } else if (currentNode.subtype === 'knowledge-base') {
        // Enhanced knowledge base with LLM-powered retrieval simulation - using actual properties panel data
        const query = inputData.input || testingOptions?.scenario?.description || '';
        const operation = (currentNode.data as any).operation || 'retrieve';
        const documents = (currentNode.data as any).documents || [];
        const metadata = (currentNode.data as any).metadata || {};
        
        const kbPrompt = `You are a knowledge base system performing a ${operation} operation.

Available documents: ${documents.map((doc: any) => `- ${doc.name || doc.title || 'Document'}: ${doc.content ? doc.content.substring(0, 100) + '...' : 'No content preview'}`).join('\n')}

Query: ${query}

Metadata: ${JSON.stringify(metadata, null, 2)}

Based on the documents uploaded in the properties panel, simulate retrieving relevant information and provide a comprehensive, well-structured response. Include specific details and examples that would realistically be found in these documents.`;

        const kbResult = await callGemini(kbPrompt);
        
        // Create enhanced output with friendly format + metadata
        output = {
          response: kbResult,
          metadata: {
            nodeType: 'knowledge-base',
            nodeId: currentNode.id,
            operation: operation,
            documentsCount: documents.length,
            query: query,
            metadata: metadata,
            executionTime: Date.now(),
            llmProvider: 'gemini'
          }
        };
        executionResults[currentNode.id] = { [currentNode.outputs[0].id]: kbResult };
        
      } else if (currentNode.subtype === 'decision-tree' || currentNode.subtype === 'router') {
        // Enhanced decision making with LLM reasoning for complex routing
        const conditions = (currentNode.data as any).conditions || [];
        const routingLogic = (currentNode.data as any).routingLogic || '';
        const expression = (currentNode.data as any).expression || '';
        
        // Analyze all connected output paths
        const outputConnections = connections.filter(c => c.sourceNode === currentNode.id);
        const availableRoutes = outputConnections.map(conn => {
          const targetNode = nodes.find(n => n.id === conn.targetNode);
          const targetNodeName = (targetNode?.data as any)?.title || targetNode?.id || 'Unknown';
          return {
            outputId: conn.sourceOutput,
            targetNode: targetNodeName,
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
