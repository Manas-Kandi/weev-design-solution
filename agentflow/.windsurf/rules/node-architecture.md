---
trigger: manual
---

# Rule: AgentFlow Node Architecture
## Applies to: src/lib/nodes/*, src/components/nodes/*, properties panels
## Activation: Always

### Intent
Define the structure, patterns, and responsibilities for all node implementations.

### Architecture Structure
src/lib/nodes/
├── base/
│   └── BaseNode.ts         # Abstract base class all nodes extend
├── agent/
│   ├── AgentNode.ts        # Main reasoning agent
│   └── ToolAgentNode.ts    # Tool/API execution agent
├── conversation/
│   ├── MessageNode.ts      # Simple message passing
│   ├── PromptTemplateNode.ts # Variable substitution
│   └── ConversationFlowNode.ts # Multi-turn dialogue
├── logic/
│   ├── IfElseNode.ts       # Binary conditions
│   ├── DecisionTreeNode.ts # Multi-branch decisions
│   └── StateMachineNode.ts # Stateful transitions
└── knowledge/
└── KnowledgeBaseNode.ts # Document storage/retrieval

### Node Implementation Pattern
```typescript
export class YourNode extends BaseNode {
  async execute(context: NodeContext): Promise<NodeOutput> {
    // 1. Extract node-specific data
    const data = this.node.data as YourNodeData;
    
    // 2. Get input values from connected nodes
    const inputContext = this.formatInputContext(context);
    
    // 3. Process according to node logic
    // 4. Return output (string, object, or error)
  }
}

Data Flow Contract
typescriptinterface NodeContext {
  nodes: CanvasNode[];
  connections: Connection[];
  nodeOutputs: Record<string, NodeOutput>;  // Previous node outputs
  currentNode: CanvasNode;
}

type NodeOutput = 
  | string 
  | { gemini: any } 
  | { error: string }
  | { [key: string]: any };  // Custom output objects


Node Categories & Responsibilities

Agent Nodes: LLM reasoning, personality, escalation logic
Tool Nodes: Simulate external APIs, return structured data
Logic Nodes: Conditional routing, no LLM calls unless necessary
Conversation Nodes: Format and manage dialogue state
Knowledge Nodes: Cache-based document storage (browser memory)