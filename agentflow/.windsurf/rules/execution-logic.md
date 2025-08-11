---
trigger: manual
---

# Rule: Flow Execution Logic
## Applies to: src/lib/flow/FlowEngine.ts, workflow execution, test visualization
## Activation: Always

### Intent
Define deterministic, debuggable flow execution with visual feedback.

### Execution Model
1. **Topological Sort** - Build execution order respecting dependencies
2. **Start Node Priority** - User-designated start node executes first
3. **Parallel Capability** - Nodes with satisfied inputs can execute simultaneously
4. **Visual Delays** - 500ms between node executions for visibility

### FlowEngine Responsibilities
```typescript
class FlowEngine {
  // 1. Build execution graph from connections
  private buildExecutionOrder(): void
  
  // 2. Execute nodes in order
  async execute(): Promise<Record<string, NodeOutput>>
  
  // 3. Handle errors gracefully
  // 4. Maintain execution state for debugging
}
Execution Rules

Input Handling: By default, wait for ALL inputs before executing
Error Propagation: Errors don't stop flow, but are captured in output
State Persistence: StateMachine and KnowledgeBase nodes maintain state
Conditional Execution: If/Else and DecisionTree nodes route dynamically

Test Mode Behavior

Highlight currently executing node (blue glow)
Show input/output values in results panel
Display execution time per node
Log errors with full context
Support step-through debugging (future)

Node Output Display
typescript// Success: Show actual output
{ output: "Hello world" }

// Gemini Response: Extract text from response
{ gemini: { candidates: [...] } } → "Extracted text"

// Error: Show in red with context
{ error: "Connection timeout" }

// Complex: JSON stringify with formatting
{ data: {...}, metadata: {...} }