// FlowIO types for normalized node output
export interface FlowIO {
  type: 'text' | 'json' | 'error';
  content: any;
  meta: {
    nodeType: string;
    model?: string;
    tokens?: number;
    toolIntents?: Array<{name: string, args: any}>;
    validation?: {
      schemaValid: boolean;
      error?: string;
    };
    [key: string]: unknown;
  };
  timestamp: number;
  nodeId: string;
}

export function createFlowIO(
  type: FlowIO['type'],
  content: any,
  meta: FlowIO['meta'],
  nodeId: string
): FlowIO {
  return {
    type,
    content,
    meta,
    timestamp: Date.now(),
    nodeId,
  };
}

export function isFlowIO(obj: any): obj is FlowIO {
  return (
    obj &&
    typeof obj === 'object' &&
    ['text', 'json', 'error'].includes(obj.type) &&
    obj.content !== undefined &&
    obj.meta &&
    typeof obj.meta === 'object' &&
    typeof obj.nodeId === 'string' &&
    typeof obj.timestamp === 'number'
  );
}
