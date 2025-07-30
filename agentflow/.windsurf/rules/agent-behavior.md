---
trigger: manual
---

# Rule: Agent Behavior Modeling
## Applies to: All AI-powered nodes, Gemini integration, prompt engineering
## Activation: Always

### Intent
Ensure predictable, testable, and composable AI behavior across flows.

### Gemini Integration Pattern
```typescript
// Each node maintains isolated config
interface AgentConfig {
  model: 'gemini-pro' | 'gemini-2.5-flash-lite';
  temperature: number;      // 0-1, default 0.7
  maxTokens?: number;      
  systemPrompt: string;    // Node-specific instructions
  personality?: string;    // Behavioral traits
  escalationLogic?: string; // When to hand off
  confidenceThreshold?: number; // 0-1, triggers escalation
}
Prompt Construction Order

System prompt (role, constraints, behavior)
Personality traits (if defined)
Escalation rules (if defined)
Context from connected nodes
User input/prompt

Agent Node Types & Behaviors
Standard Agent

General reasoning and response generation
Configurable personality and escalation
Maintains conversation context

Tool Agent

Simulates API calls with realistic responses
Returns structured data
Handles: web search, calculator, code execution, database queries

Decision Nodes (If/Else, Decision Tree)

Use Gemini for natural language condition evaluation
Temperature = 0 for consistency
Return deterministic paths

Prompt Engineering Guidelines
typescript// Good: Specific, measurable
"You are a customer support agent. Be empathetic and solution-focused. 
If confidence < 0.7 or user expresses frustration, escalate."

// Bad: Vague, unmeasurable
"Be helpful and nice. Escalate when needed."
Context Preservation

Conversation history passed as structured data
State machines maintain state across executions
Knowledge bases provide persistent context
All context is explicit in prompts