# AgentFlow Data Flow Contract

This document formalizes the runtime data contracts between nodes and the FlowEngine for external developers and integrations.

Version: 1.0.0

## Execution Model (Deterministic & Visual)
- Topological sort of nodes respecting dependencies
- Start node priority (user-designated node executes first)
- Parallel execution when inputs are satisfied
- Visual delay of ~500ms between executions for clarity

## Node Context
A node executes with the following context:

```ts
interface NodeContext {
  nodes: CanvasNode[];
  connections: Connection[];
  nodeOutputs: Record<string, NodeOutput>; // Outputs of previously executed nodes
  currentNode: CanvasNode;                 // Node being executed
}
```

## CanvasNode Shape (simplified)
```ts
interface CanvasNode {
  id: string;
  type: 'agent' | 'conversation' | 'logic' | 'testing' | 'ui';
  subtype: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  data: unknown; // Node-specific configuration: model settings, prompts, tool params, etc.
  inputs: { id: string; label: string; type?: string }[];
  outputs: { id: string; label: string; type?: string }[];
  output?: NodeOutput; // populated during/after execution
  context?: Record<string, unknown>;
}
```

## NodeOutput Contract
Node outputs can be:

```ts
export type NodeOutput =
  | string
  | {
      // Standard fields
      gemini?: unknown;   // Raw Gemini response payload (if applicable)
      error?: string;     // Error message (non-fatal; flow continues)
      info?: string;      // UI nodes may use for messages

      // Backward-compatible fields used by specific nodes
      previousState?: string;
      currentState?: string;
      event?: string;
      transition?: string;
      output?: string;
      message?: string;

      // Arbitrary structured outputs from tool/custom nodes
      [key: string]: unknown;
    };
```

### Output Display Rules (Designer/Test UI)
- Success: show the actual output (string or JSON pretty-printed)
- Gemini response: extract/render the relevant text
- Error: show in red with full context
- Complex objects: JSON stringify with formatting

## Execution Rules
- Input handling: by default, wait for ALL required inputs
- Error propagation: errors are captured in output; flow does not stop
- State persistence: StateMachine and KnowledgeBase nodes maintain state
- Conditional execution: If/Else and DecisionTree nodes dynamically route

## Testing & Debugging
- Highlight current node (blue glow)
- Show input/output values in results panel
- Display execution time per node
- Log errors with full context
- Roadmap: step-through debugging and breakpoints

## Extending Nodes
All nodes extend an abstract base and implement an `execute(context)` method. Recommended pattern:

```ts
export class YourNode extends BaseNode {
  async execute(context: NodeContext): Promise<NodeOutput> {
    const data = this.node.data as YourNodeData;        // 1) extract config
    const inputContext = this.formatInputContext(context); // 2) gather inputs
    // 3) process according to node logic
    // 4) return output (string, object, or { error })
  }
}
```

## Versioning
This contract is stable and evolves conservatively. Breaking changes will result in a major version bump and updated JSON Schemas for exported flows.
