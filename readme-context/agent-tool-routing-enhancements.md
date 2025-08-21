# Agent-Tool Routing Enhancements

This document describes the improvements made to the Agent-Tool routing system to make agents smarter when multiple tools are attached.

## Key Improvements

### 1. Enhanced Tool Awareness

Agents now collect a structured list of all available tools and their capabilities before making routing decisions. Each tool is represented with:

- **ID**: Unique identifier
- **Name**: Human-readable name/title
- **Provider**: Tool provider (e.g., web_search, calendar)
- **Operation**: Specific operation (e.g., search, list_events)
- **Description**: Detailed description of what the tool does
- **Capabilities**: List of normalized capability identifiers
- **Parameters**: Available parameters and their schemas

### 2. Intelligent LLM-Based Intent Selection

Instead of routing blindly, agents now ask the LLM to choose tools based on:

```
Given the user input and the following connected tool capabilities, which tool(s) should be used to answer this request?
```

This ensures routing happens through LLM-based intent resolution rather than hard-coded assumptions.

### 3. Multi-Tool Planning

Agents can now plan and execute:

- **Single Tool**: Simple case (e.g., web_search for "who is gibby from iCarly?")
- **Multiple Tools**: Complex workflows (e.g., "Find available flights → book a calendar event")
- **Sequential Execution**: Tools executed in planned order with proper data flow

### 4. Robust Fallback Mechanisms

When the LLM returns an invalid tool name or capability:

1. **Fuzzy Matching**: Attempts to match against known capabilities using loose string matching
2. **Partial Matching**: Looks for substring matches within capability lists
3. **Clear Error Messages**: Provides informative feedback when no matches are found:
   ```
   Agent could not determine a matching tool. Connected tools: [web_search, calendar]
   ```

## Implementation Details

### Tool Information Collection

When an agent node is executed, the system automatically collects information about all connected tool nodes:

```typescript
const connectedToolNodes = connections.filter(connection => {
  return connection.source === agentNodeId && 
         isToolNode(connection.target);
}).map(connection => getNodeById(connection.target));

const tools = connectedToolNodes.map(toolNode => {
  const provider = toolNode.data.simulation?.providerId;
  const operation = toolNode.data.simulation?.operation;
  const schema = getToolSchema(provider);
  
  return {
    id: toolNode.id,
    name: toolNode.data.title || provider,
    provider,
    operation,
    description: schema?.description || `Tool for ${provider}`,
    capabilities: normalizeCapabilities([
      ...schema?.capabilities || [],
      `${provider}.${operation}`
    ]),
    parameters: getToolParameters(provider, operation)
  };
});
```

### Enhanced Agent Prompt

Agents receive enhanced prompts that include structured tool information:

```
AVAILABLE TOOLS:
1. Web Search (web_search.search)
   Description: Search the web for information
   Capabilities: web_search.search, search.web
   
2. Calendar (calendar.list_events)
   Description: List calendar events
   Capabilities: calendar.list_events, calendar.events

INSTRUCTIONS FOR TOOL SELECTION:
1. Analyze the user's request and match it to the most appropriate tool
2. If multiple tools are needed, plan their sequential execution
3. If no tool matches, respond with a natural language response
```

### Multi-Tool Response Formats

Agents can now return various response formats:

1. **Natural Language Only**: Plain text response
2. **Single Tool Call**: `{ "tool_call": { ... } }`
3. **Multiple Tool Calls**: `{ "tool_calls": [ { ... }, { ... } ] }`
4. **Mixed Response**: `{ "natural_language_response": "...", "tool_call": { ... } }`

### Improved Error Handling

The system provides clear error messages when tool routing fails:

- **No Matching Tool**: Shows list of connected tools with their capabilities
- **Invalid Capability**: Attempts fuzzy matching before giving up
- **Multiple Matches**: Executes all matching tools in sequence
- **Execution Failures**: Continues with other tools if one fails

## Benefits

1. **Smarter Routing**: Agents make intelligent decisions based on actual tool capabilities
2. **Better User Experience**: Clear error messages instead of silent failures
3. **Flexible Workflows**: Support for complex multi-tool operations
4. **Robust Error Handling**: Graceful degradation when tools don't match
5. **Enhanced Debugging**: Detailed tracing of routing decisions

## Example Workflow

**User Request**: "Find flights to Paris and add to my calendar"

**Connected Tools**: 
- `web_search.search` 
- `calendar.create_event`

**Agent Process**:
1. Receives structured tool list
2. LLM analyzes request and identifies need for both search and calendar tools
3. Plans sequential execution: search → calendar
4. Returns: `{ "tool_calls": [ { "tool_name": "web_search", "operation": "search", ... }, { "tool_name": "calendar", "operation": "create_event", ... } ] }`
5. System executes tools in planned order with proper data flow

This enhancement significantly improves the Agent's ability to work intelligently with multiple tools while providing clear feedback when issues occur.