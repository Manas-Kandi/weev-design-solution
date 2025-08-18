# QWEN.md

## Agent Tool Routing Rules

Agent Tool Routing – Enhanced Functionality
This document defines how agents decide which tool(s) to call when multiple tools are connected. These rules prevent blind routing and ensure intelligent execution.

### 1. Tool Awareness

On execution, the Agent must gather a structured list of all connected tools.
Each tool is represented as an object with:
```json
{
  "id": "tool-node-id",
  "name": "Tool Display Name",
  "provider": "Provider Identifier",
  "operation": "Operation Name",
  "description": "Human-readable explanation",
  "capabilities": ["normalized.capability.strings"],
  "parameters": { "schema": "parameter definitions" }
}
```
This list is passed into the LLM during intent resolution.

### 2. LLM-Based Intent Selection

The Agent must never hard-route.
Instead, it sends a structured prompt to the LLM:

**Prompt Template:**
```
USER INPUT:
{user_input}

AVAILABLE TOOLS:
{list_of_tool_metadata}

QUESTION:
Based on the input and tool capabilities, which tool(s) should be used?
Return one of:
- {"tool_call": {...}}
- {"tool_calls": [{...}, {...}]}
- {"natural_language_response": "..."}
```

The LLM is responsible for selecting the best tool(s).

### 3. Multi-Tool Planning

The Agent supports multiple tool calls in sequence.
Valid response formats include:
- Single tool call
- Multiple tool calls in planned order
- Mixed response (NL text + tool call)

The execution runner must respect the planned order and pass outputs from one tool into the next.

### 4. Fallback Mechanisms

If the LLM selects a tool name that does not exist:
1. Run fuzzy match on capability strings.
2. Run substring partial match on tool names.
3. If no match is found, produce a structured error:
```json
{
  "error": "Agent could not determine a matching tool.",
  "connected_tools": ["web_search", "calendar"]
}
```
Execution should gracefully continue with other valid tools where possible.

### 5. Debugging & Logging

The system must log:
- User input
- Tool list presented to LLM
- LLM response (parsed vs. raw)
- Chosen tool(s) and execution order

This ensures transparent debugging inside the Testing Panel.

## Benefits

✅ Smarter routing based on capabilities, not connection order
✅ Support for complex, multi-tool workflows
✅ Resilient execution with fuzzy matching and clear errors
✅ Improved developer experience with detailed logging

## ✨ Example:

**Input:** "Who is Gibby from iCarly?"
**Tools:** web_search, calendar.list_events

**Before:** Routed blindly into calendar, error: "Invalid input…"
**Now:** LLM chooses web_search → success.

## Implementation Files

The enhanced agent-tool routing functionality is implemented across the following files:

1. **`src/lib/workflowRunnerPropertiesDriven.ts`**
   - Main workflow execution engine that orchestrates agent-to-tool routing
   - Enhanced tool collection logic that creates structured tool metadata
   - Improved routing logic with fuzzy matching and multi-tool planning
   - Delegation context management for tracking tool execution

2. **`src/lib/propertiesTestingBridge.ts`**
   - Properties panel to testing panel bridge that handles node execution
   - Enhanced agent execution with structured tool awareness
   - Intelligent LLM prompting with detailed tool metadata
   - Tool execution with proper error handling and fallbacks

3. **`src/lib/nodes/tool/catalog.ts`**
   - Tool schema definitions and capabilities mapping
   - Tool metadata used for intelligent routing decisions

4. **`src/lib/nodes/tool/capabilityMap.ts`**
   - Capability normalization and alias resolution
   - Fuzzy matching algorithms for tool identification

5. **Documentation:**
   - `readme-context/agent-tool-routing-enhancements.md` - Comprehensive technical documentation
   - `CLAUDE.md` - Updated with Agent-Tool Routing Enhancements section
   - `QWEN.md` - This file containing routing rules and implementation details