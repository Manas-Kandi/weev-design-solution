export interface TestingEvent {
  type: 'node_start' | 'node_complete' | 'node_error' | 'flow_start' | 'flow_complete';
  nodeId?: string;
  timestamp: number;
  data: any;
  reasoning?: string;
  properties?: Record<string, any>;
  inputs?: any;
  output?: any;
  technicalDetails?: Record<string, any>;
}

export interface ExecutionContext {
  sessionId: string;
  startTime: number;
  inputMode: 'user' | 'auto' | 'data' | 'test';
  inputValue: string;
  expertMode: boolean;
  events: TestingEvent[];
}