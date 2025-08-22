/**
 * Execution Event System
 * 
 * Defines event types and utilities for real-time workflow execution monitoring
 */

export interface ExecutionEvent {
  type: 'node_start' | 'node_complete' | 'node_error' | 'llm_request' | 'llm_response' | 'flow_start' | 'flow_complete' | 'flow_pause' | 'flow_resume';
  nodeId?: string;
  timestamp: number;
  data?: any;
}

export interface LLMInteractionEvent {
  type: 'llm_request' | 'llm_response';
  nodeId: string;
  timestamp: number;
  data: {
    prompt?: string;
    response?: string;
    model?: string;
    tokens?: number;
    duration?: number;
  };
}

export interface NodeExecutionEvent {
  type: 'node_start' | 'node_complete' | 'node_error';
  nodeId: string;
  timestamp: number;
  data: {
    node?: any;
    inputData?: Record<string, any>;
    output?: any;
    error?: string;
    duration?: number;
    nodeType?: string;
    nodeSubtype?: string;
  };
}

export interface FlowExecutionEvent {
  type: 'flow_start' | 'flow_complete' | 'flow_pause' | 'flow_resume';
  timestamp: number;
  data: {
    startNodeId?: string;
    nodeId?: string;
    options?: any;
    results?: Record<string, any>;
  };
}

/**
 * Event aggregator for collecting and organizing execution events
 */
export class ExecutionEventAggregator {
  private events: ExecutionEvent[] = [];
  private nodeEvents: Map<string, ExecutionEvent[]> = new Map();
  private llmInteractions: LLMInteractionEvent[] = [];

  /**
   * Add an execution event
   */
  addEvent(event: ExecutionEvent): void {
    this.events.push(event);

    // Organize by node
    if (event.nodeId) {
      if (!this.nodeEvents.has(event.nodeId)) {
        this.nodeEvents.set(event.nodeId, []);
      }
      this.nodeEvents.get(event.nodeId)!.push(event);
    }

    // Track LLM interactions separately
    if (event.type === 'llm_request' || event.type === 'llm_response') {
      this.llmInteractions.push(event as LLMInteractionEvent);
    }
  }

  /**
   * Get all events
   */
  getAllEvents(): ExecutionEvent[] {
    return [...this.events];
  }

  /**
   * Get events for a specific node
   */
  getNodeEvents(nodeId: string): ExecutionEvent[] {
    return this.nodeEvents.get(nodeId) || [];
  }

  /**
   * Get LLM interactions
   */
  getLLMInteractions(): LLMInteractionEvent[] {
    return [...this.llmInteractions];
  }

  /**
   * Get events by type
   */
  getEventsByType(type: ExecutionEvent['type']): ExecutionEvent[] {
    return this.events.filter(event => event.type === type);
  }

  /**
   * Get execution timeline
   */
  getExecutionTimeline(): { nodeId: string; startTime: number; endTime?: number; duration?: number }[] {
    const timeline: { nodeId: string; startTime: number; endTime?: number; duration?: number }[] = [];
    const nodeStartTimes: Map<string, number> = new Map();

    for (const event of this.events) {
      if (event.nodeId) {
        if (event.type === 'node_start') {
          nodeStartTimes.set(event.nodeId, event.timestamp);
        } else if (event.type === 'node_complete' || event.type === 'node_error') {
          const startTime = nodeStartTimes.get(event.nodeId);
          if (startTime) {
            timeline.push({
              nodeId: event.nodeId,
              startTime,
              endTime: event.timestamp,
              duration: event.timestamp - startTime
            });
          }
        }
      }
    }

    return timeline.sort((a, b) => a.startTime - b.startTime);
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
    this.nodeEvents.clear();
    this.llmInteractions = [];
  }

  /**
   * Get execution statistics
   */
  getExecutionStats(): {
    totalEvents: number;
    nodeExecutions: number;
    llmInteractions: number;
    errors: number;
    totalDuration: number;
  } {
    const timeline = this.getExecutionTimeline();
    const totalDuration = timeline.reduce((sum, item) => sum + (item.duration || 0), 0);

    return {
      totalEvents: this.events.length,
      nodeExecutions: this.getEventsByType('node_complete').length + this.getEventsByType('node_error').length,
      llmInteractions: this.llmInteractions.length / 2, // Request/response pairs
      errors: this.getEventsByType('node_error').length,
      totalDuration
    };
  }
}

/**
 * Event formatter utilities
 */
export class ExecutionEventFormatter {
  /**
   * Format event for display
   */
  static formatEvent(event: ExecutionEvent): string {
    const time = new Date(event.timestamp).toLocaleTimeString();
    
    switch (event.type) {
      case 'flow_start':
        return `${time} - Flow started (${event.data?.startNodeId})`;
      case 'flow_complete':
        return `${time} - Flow completed`;
      case 'flow_pause':
        return `${time} - Flow paused at ${event.data?.nodeId}`;
      case 'flow_resume':
        return `${time} - Flow resumed from ${event.data?.nodeId}`;
      case 'node_start':
        return `${time} - Node ${event.nodeId} started (${event.data?.nodeType})`;
      case 'node_complete':
        return `${time} - Node ${event.nodeId} completed (${event.data?.duration}ms)`;
      case 'node_error':
        return `${time} - Node ${event.nodeId} failed: ${event.data?.error}`;
      case 'llm_request':
        return `${time} - LLM request to ${event.data?.model} (${event.data?.tokens} tokens)`;
      case 'llm_response':
        return `${time} - LLM response received (${event.data?.duration}ms)`;
      default:
        return `${time} - ${event.type}`;
    }
  }

  /**
   * Format duration in human-readable format
   */
  static formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(1);
      return `${minutes}m ${seconds}s`;
    }
  }

  /**
   * Get status color for event type
   */
  static getEventColor(eventType: ExecutionEvent['type']): string {
    switch (eventType) {
      case 'flow_start':
      case 'node_start':
        return 'text-blue-600';
      case 'flow_complete':
      case 'node_complete':
        return 'text-green-600';
      case 'node_error':
        return 'text-red-600';
      case 'flow_pause':
        return 'text-yellow-600';
      case 'flow_resume':
        return 'text-blue-600';
      case 'llm_request':
      case 'llm_response':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  }
}
