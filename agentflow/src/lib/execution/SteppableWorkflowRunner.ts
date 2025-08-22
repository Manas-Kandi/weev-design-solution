import { CanvasNode, Connection } from "@/types";
import { executeNodeFromProperties } from "../propertiesTestingBridge";
import { type UserTier } from "../subscriptionTiers";
import { callLLM } from "../llmClient";
import { EventEmitter } from 'events';

// Execution state interface
export interface ExecutionState {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  currentNodeId: string | null;
  queuedNodes: string[];
  completedNodes: string[];
  breakpoints: Set<string>;
  speed: number;
  startTime: number | null;
  pauseTime: number | null;
  totalPauseTime: number;
}

// Execution step interface
export interface ExecutionStep {
  nodeId: string;
  node: CanvasNode;
  inputData: Record<string, any>;
  output?: any;
  error?: any;
  timestamp: number;
  duration?: number;
  status: 'queued' | 'executing' | 'completed' | 'error';
}

// Execution event interface
export interface ExecutionEvent {
  type: 'node_start' | 'node_complete' | 'node_error' | 'llm_request' | 'llm_response' | 'flow_start' | 'flow_complete' | 'flow_pause' | 'flow_resume';
  nodeId?: string;
  timestamp: number;
  data?: any;
}

// Options for workflow execution
interface RunExecutionOptions {
  inputs?: Record<string, any>;
  assertions?: any[];
  variables?: Record<string, any>;
}

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
 * Steppable Workflow Runner
 * 
 * Provides step-by-step execution capabilities with pause/resume/step controls,
 * breakpoints, and real-time event emission for debugging workflows.
 */
export class SteppableWorkflowRunner extends EventEmitter {
  private nodes: CanvasNode[];
  private connections: Connection[];
  private executionState: ExecutionState;
  private executionResults: Record<string, any> = {};
  private executionSteps: ExecutionStep[] = [];
  private pausePromise: Promise<void> | null = null;
  private pauseResolve: (() => void) | null = null;
  private stepPromise: Promise<void> | null = null;
  private stepResolve: (() => void) | null = null;
  private isStepMode = false;

  constructor(nodes: CanvasNode[], connections: Connection[]) {
    super();
    this.nodes = nodes;
    this.connections = connections;
    this.executionState = {
      status: 'idle',
      currentNodeId: null,
      queuedNodes: [],
      completedNodes: [],
      breakpoints: new Set(),
      speed: 1.0,
      startTime: null,
      pauseTime: null,
      totalPauseTime: 0
    };
  }

  /**
   * Start workflow execution with step-by-step capabilities
   */
  async executeWorkflow(
    startNodeId: string,
    options?: RunExecutionOptions,
    callbacks?: TestingCallbacks,
    testingOptions?: TestingOptions,
    userTier?: UserTier
  ): Promise<Record<string, any>> {
    console.log('🚀 Starting steppable workflow execution:', {
      startNodeId,
      nodeCount: this.nodes.length,
      connectionCount: this.connections.length,
      options,
      testingOptions
    });

    if (!startNodeId) {
      throw new Error("Start node not set");
    }

    // Initialize execution state
    this.executionState = {
      ...this.executionState,
      status: 'running',
      currentNodeId: startNodeId,
      startTime: Date.now(),
      pauseTime: null,
      totalPauseTime: 0
    };

    this.executionResults = { ...(options?.inputs ?? {}) };
    this.executionSteps = [];

    // Emit flow started event
    this.emitExecutionEvent({
      type: 'flow_start',
      timestamp: Date.now(),
      data: { startNodeId, options }
    });

    try {
      // Execute workflow step by step
      for await (const step of this.executeSteps(startNodeId, options, callbacks, testingOptions, userTier)) {
        // Handle speed control
        if (this.executionState.speed !== 1.0) {
          const delay = (1000 / this.executionState.speed) - 1000;
          if (delay > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      this.executionState.status = 'completed';
      this.emitExecutionEvent({
        type: 'flow_complete',
        timestamp: Date.now(),
        data: { results: this.executionResults }
      });

      return this.executionResults;
    } catch (error) {
      this.executionState.status = 'error';
      this.emitExecutionEvent({
        type: 'node_error',
        nodeId: this.executionState.currentNodeId || undefined,
        timestamp: Date.now(),
        data: { error: error instanceof Error ? error.message : String(error) }
      });
      throw error;
    }
  }

  /**
   * Generator function that yields execution steps
   */
  private async* executeSteps(
    startNodeId: string,
    options?: RunExecutionOptions,
    callbacks?: TestingCallbacks,
    testingOptions?: TestingOptions,
    userTier?: UserTier
  ): AsyncGenerator<ExecutionStep> {
    let currentNodeId: string | null = startNodeId;
    let executionCount = 0;
    const maxSteps = this.nodes.length * 2; // Prevent infinite loops

    while (currentNodeId && executionCount < maxSteps && this.executionState.status !== 'error') {
      const currentNode = this.nodes.find((n) => n.id === currentNodeId);
      if (!currentNode) {
        throw new Error(`Node with id ${currentNodeId} not found`);
      }

      // Check for breakpoints
      if (this.executionState.breakpoints.has(currentNodeId)) {
        await this.pause();
      }

      // Handle pause state
      if (this.executionState.status === 'paused') {
        await this.waitForResume();
      }

      // Handle step mode
      if (this.isStepMode) {
        await this.waitForStep();
      }

      this.executionState.currentNodeId = currentNodeId;

      // Create execution step
      const step: ExecutionStep = {
        nodeId: currentNodeId,
        node: currentNode,
        inputData: {},
        timestamp: Date.now(),
        status: 'executing'
      };

      // Prepare input data from connected nodes
      const inputConnections = this.connections.filter((c: any) => {
        const target = c.targetNode ?? c.target;
        return target === currentNode.id;
      });

      for (const raw of inputConnections as any[]) {
        const sourceNode = raw.sourceNode ?? raw.source;
        const targetInput = raw.targetInput ?? raw.targetHandle ?? 'input';
        const sourceOutput = raw.sourceOutput ?? raw.sourceHandle ?? Object.keys(this.executionResults[sourceNode] || {})[0];
        if (sourceNode && this.executionResults[sourceNode]) {
          step.inputData[targetInput] = this.executionResults[sourceNode][sourceOutput];
        }
      }

      // For the start node, merge any initial inputs from options
      if (currentNode.id === startNodeId && options?.inputs) {
        Object.assign(step.inputData, options.inputs);
      }

      // Add scenario input if this is the start node
      if (currentNode.id === startNodeId && testingOptions?.scenario?.description) {
        step.inputData.input = testingOptions.scenario.description;
      }

      // Emit node start event
      this.emitExecutionEvent({
        type: 'node_start',
        nodeId: currentNodeId,
        timestamp: step.timestamp,
        data: { 
          node: currentNode, 
          inputData: step.inputData,
          nodeType: currentNode.type,
          nodeSubtype: currentNode.subtype
        }
      });

      // Call beforeNodeExecute callback if provided
      if (callbacks?.beforeNodeExecute) {
        await callbacks.beforeNodeExecute(currentNode);
      }

      try {
        console.log('🔄 Executing node:', {
          nodeId: currentNode.id,
          nodeType: currentNode.type,
          nodeSubtype: currentNode.subtype,
          inputData: step.inputData,
          nodeData: currentNode.data
        });

        // Execute the node using the properties testing bridge
        const startTime = Date.now();
        
        // Create LLM executor function for the properties testing bridge
        const llmExecutor = async (prompt: string, systemPrompt?: string, tools?: any[]) => {
          // Emit LLM request event
          this.emitExecutionEvent({
            type: 'llm_request',
            nodeId: currentNodeId || undefined,
            timestamp: Date.now(),
            data: { prompt, systemPrompt, tools }
          });
          
          try {
            const llmResult = await callLLM(prompt, {
              system: systemPrompt,
              userTier: userTier || 'basic'
            });
            
            // Emit LLM response event
            this.emitExecutionEvent({
              type: 'llm_response',
              nodeId: currentNodeId || undefined,
              timestamp: Date.now(),
              data: { response: llmResult.text, prompt }
            });
            
            // Return the text content as expected by executeNodeFromProperties
            return llmResult.text;
          } catch (error) {
            // Emit LLM error event
            this.emitExecutionEvent({
              type: 'llm_response',
              nodeId: currentNodeId || undefined,
              timestamp: Date.now(),
              data: { error: error instanceof Error ? error.message : String(error), prompt }
            });
            throw error;
          }
        };

        const propertiesResult = await executeNodeFromProperties(
          currentNode,
          step.inputData,
          llmExecutor
        );
        
        // Extract the actual output from the properties result
        const output = propertiesResult.result;
        const endTime = Date.now();

        step.output = output;
        step.duration = endTime - startTime;
        step.status = 'completed';

        // Store execution results
        this.executionResults[currentNodeId] = output;
        this.executionState.completedNodes.push(currentNodeId);

        // Emit node complete event
        this.emitExecutionEvent({
          type: 'node_complete',
          nodeId: currentNodeId,
          timestamp: endTime,
          data: { 
            output, 
            duration: step.duration,
            inputData: step.inputData
          }
        });

        console.log('✅ Node execution completed:', {
          nodeId: currentNodeId,
          output,
          duration: step.duration
        });

      } catch (error) {
        step.error = error;
        step.status = 'error';
        step.duration = Date.now() - step.timestamp;

        this.emitExecutionEvent({
          type: 'node_error',
          nodeId: currentNodeId,
          timestamp: Date.now(),
          data: { 
            error: error instanceof Error ? error.message : String(error),
            inputData: step.inputData
          }
        });

        console.error('❌ Node execution failed:', {
          nodeId: currentNodeId,
          error,
          inputData: step.inputData
        });

        throw error;
      }

      this.executionSteps.push(step);
      yield step;

      // Find next node to execute
      currentNodeId = this.findNextNode(currentNodeId);
      executionCount++;
    }
  }

  /**
   * Find the next node to execute based on connections
   */
  private findNextNode(currentNodeId: string): string | null {
    const outgoingConnections = this.connections.filter((c: any) => {
      const source = c.sourceNode ?? c.source;
      return source === currentNodeId;
    });

    if (outgoingConnections.length === 0) {
      return null; // End of workflow
    }

    // For now, take the first connection (could be enhanced for routing logic)
    const nextConnection = outgoingConnections[0] as any;
    return nextConnection.targetNode ?? nextConnection.target;
  }

  /**
   * Pause execution
   */
  async pause(): Promise<void> {
    if (this.executionState.status === 'running') {
      this.executionState.status = 'paused';
      this.executionState.pauseTime = Date.now();
      
      this.emitExecutionEvent({
        type: 'flow_pause',
        timestamp: Date.now(),
        data: { nodeId: this.executionState.currentNodeId }
      });

      // Create a promise that will be resolved when resume is called
      this.pausePromise = new Promise((resolve) => {
        this.pauseResolve = resolve;
      });
    }
  }

  /**
   * Resume execution
   */
  resume(): void {
    if (this.executionState.status === 'paused') {
      this.executionState.status = 'running';
      
      if (this.executionState.pauseTime) {
        this.executionState.totalPauseTime += Date.now() - this.executionState.pauseTime;
        this.executionState.pauseTime = null;
      }

      this.emitExecutionEvent({
        type: 'flow_resume',
        timestamp: Date.now(),
        data: { nodeId: this.executionState.currentNodeId }
      });

      // Resolve the pause promise
      if (this.pauseResolve) {
        this.pauseResolve();
        this.pauseResolve = null;
        this.pausePromise = null;
      }

      this.isStepMode = false;
    }
  }

  /**
   * Execute one step when paused
   */
  async step(): Promise<void> {
    if (this.executionState.status === 'paused') {
      this.isStepMode = true;
      this.resume();
      
      // Create a promise that will be resolved after one step
      this.stepPromise = new Promise((resolve) => {
        this.stepResolve = resolve;
      });
      
      return this.stepPromise;
    }
  }

  /**
   * Reset execution state
   */
  reset(): void {
    this.executionState = {
      status: 'idle',
      currentNodeId: null,
      queuedNodes: [],
      completedNodes: [],
      breakpoints: this.executionState.breakpoints, // Preserve breakpoints
      speed: this.executionState.speed, // Preserve speed
      startTime: null,
      pauseTime: null,
      totalPauseTime: 0
    };

    this.executionResults = {};
    this.executionSteps = [];
    this.pausePromise = null;
    this.pauseResolve = null;
    this.stepPromise = null;
    this.stepResolve = null;
    this.isStepMode = false;
  }

  /**
   * Set execution speed
   */
  setSpeed(speed: number): void {
    this.executionState.speed = Math.max(0.1, Math.min(5.0, speed));
  }

  /**
   * Toggle breakpoint on a node
   */
  toggleBreakpoint(nodeId: string): void {
    if (this.executionState.breakpoints.has(nodeId)) {
      this.executionState.breakpoints.delete(nodeId);
    } else {
      this.executionState.breakpoints.add(nodeId);
    }
  }

  /**
   * Get current execution state
   */
  getExecutionState(): ExecutionState {
    return { ...this.executionState };
  }

  /**
   * Get execution steps
   */
  getExecutionSteps(): ExecutionStep[] {
    return [...this.executionSteps];
  }

  /**
   * Get execution results
   */
  getExecutionResults(): Record<string, any> {
    return { ...this.executionResults };
  }

  /**
   * Wait for resume when paused
   */
  private async waitForResume(): Promise<void> {
    if (this.pausePromise) {
      await this.pausePromise;
    }
  }

  /**
   * Wait for step when in step mode
   */
  private async waitForStep(): Promise<void> {
    if (this.stepPromise) {
      await this.stepPromise;
      
      // After step completes, pause again
      await this.pause();
      
      // Resolve step promise
      if (this.stepResolve) {
        this.stepResolve();
        this.stepResolve = null;
        this.stepPromise = null;
      }
    }
  }

  /**
   * Emit execution event
   */
  private emitExecutionEvent(event: ExecutionEvent): void {
    this.emit('executionEvent', event);
  }
}
