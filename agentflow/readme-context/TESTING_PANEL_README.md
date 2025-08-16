# Flow Execution Panel - Complete Technical Documentation

## Overview

The **Flow Execution Panel** (formerly Testing Panel) is a sophisticated workflow execution engine that runs entire node-based flows from start to finish, treating Properties Panel configurations as the authoritative source for all node behavior. It simulates what a connected agentic system would look like end-to-end, executing nodes sequentially according to their canvas connections.

## Purpose

The Flow Execution Panel serves three critical functions:

1. **End-to-End Workflow Simulation**: Execute complete workflows following node connections, not individual nodes in isolation
2. **Properties Panel Authority**: Use Properties Panel inputs as the single source of truth for node behavior and execution rules
3. **Deterministic Flow Testing**: Provide predictable, reproducible outputs based on user-configured rules rather than random mocks

## Core Principles & Rules

### 1. Properties Panel as Authoritative Source

**Rule**: Properties Panel configurations are treated as executable rules, not suggestions.

- **Generic Agents**: Use `node.data.rules.nl` field (natural language rules from Properties Panel)
- **System Prompts**: Use `node.data.systemPrompt` field
- **Behavior Rules**: Use `node.data.behavior` field  
- **Router Logic**: Use `node.data.llmRule` or `node.data.expression` fields
- **Mock Responses**: Use `node.data.mockResponse` when configured

**Implementation**: The system dynamically reads these fields and constructs LLM prompts or mock responses accordingly.

### 2. Flow Execution Order

**Rule**: Execute nodes following canvas connections, starting from nodes with no incoming connections.

- **Start Node Detection**: Automatically identifies entry points (nodes without incoming connections)
- **Sequential Execution**: Follows connection graph to determine execution order
- **Result Propagation**: Output from one node becomes input to connected nodes
- **Error Handling**: Stops execution on errors and reports failure state

### 3. LLM Integration Rules

**Rule**: When Properties Panel contains rules, execute them through LLM; otherwise use mocks or show errors.

- **Primary Execution**: Natural language rules (`rules.nl`) are sent directly to LLM as instructions
- **Fallback Execution**: System prompts + behavior rules are combined into structured prompts
- **Mock Override**: If `mockResponse` is configured, use it instead of LLM execution
- **Error State**: If no configuration exists, show "No info input in properties panel"

### 4. Tool Output Handling

**Rule**: Tools are mocked unless explicitly configured otherwise.

- **Mock Responses**: Use configured mock responses from Properties Panel
- **Latency Simulation**: Respect configured latency settings
- **Error Injection**: Support error injection for testing failure scenarios
- **Preset Support**: Use predefined mock presets when available

## Execution Flow Architecture

### Phase 1: Flow Analysis
1. **Node Discovery**: Scan all nodes and connections on canvas
2. **Start Node Identification**: Find nodes with no incoming connections
3. **Dependency Mapping**: Build execution order based on connection graph
4. **Properties Validation**: Check each node for Properties Panel configuration

### Phase 2: Sequential Execution
1. **Node Preparation**: Extract Properties Panel configuration for current node
2. **Input Gathering**: Collect outputs from predecessor nodes as inputs
3. **Execution Decision**: Choose between LLM execution, mock response, or error state
4. **Result Processing**: Process node output and prepare for next nodes
5. **State Management**: Update execution timeline and result tracking

### Phase 3: Result Aggregation
1. **Final Output**: Determine workflow's final result (typically last node's output)
2. **Timeline Construction**: Build complete execution timeline with timing
3. **Error Reporting**: Aggregate any errors or failures encountered
4. **UI Updates**: Update all three tabs (Flow, Output, Timeline) with results

## Codebase Architecture

### Core Components

#### 1. FlowExecutionPanel.tsx
**Location**: `/src/features/testing/FlowExecutionPanel.tsx`
**Purpose**: Main UI component and orchestration logic

**Key Responsibilities**:
- UI rendering for three tabs (Flow, Output, Timeline)
- Start node detection and workflow orchestration
- State management for execution results
- Copy-to-clipboard functionality for debugging

**Key Functions**:
- `findStartNode()`: Identifies workflow entry points
- `executeFlow()`: Orchestrates complete workflow execution
- `copyOutput()`: Enables debugging by copying results

#### 2. workflowRunnerPropertiesDriven.ts
**Location**: `/src/lib/workflowRunnerPropertiesDriven.ts`
**Purpose**: Core workflow execution engine

**Key Responsibilities**:
- Sequential node execution following connection graph
- Result propagation between connected nodes
- Error handling and execution state management
- Integration with Properties-Testing Bridge

**Key Functions**:
- `runWorkflowWithProperties()`: Main execution orchestrator
- Node traversal and dependency resolution
- Result aggregation and timeline construction

#### 3. propertiesTestingBridge.ts
**Location**: `/src/lib/propertiesTestingBridge.ts`
**Purpose**: Properties Panel interpretation and node execution

**Key Responsibilities**:
- Reading Properties Panel configurations dynamically
- Converting Properties Panel rules into executable logic
- LLM prompt construction and execution
- Mock response handling and error states

**Key Functions**:
- `executeNodeFromProperties()`: Main node execution entry point
- `executeAgentNode()`: Handles agent-type nodes with NL rules
- `executeRouterNode()`: Handles routing logic and decisions
- `executeToolNode()`: Handles tool execution and mocking
- `executeKnowledgeBaseNode()`: Handles knowledge base operations

#### 4. FloatingSidebarContainer.tsx
**Location**: `/src/components/canvas/FloatingSidebarContainer.tsx`
**Purpose**: UI integration and panel management

**Key Responsibilities**:
- Integrating Flow Execution Panel into main UI
- Managing panel visibility and layout
- Coordinating with Properties Panel for split-view

### Data Flow Architecture

```
Canvas Nodes & Connections
         ↓
FlowExecutionPanel (UI Layer)
         ↓
workflowRunnerPropertiesDriven (Orchestration Layer)
         ↓
propertiesTestingBridge (Execution Layer)
         ↓
Individual Node Executors (Agent, Router, Tool, etc.)
         ↓
LLM Integration (geminiClient) / Mock Responses
         ↓
Results Aggregation & UI Updates
```

## Properties Panel Integration

### Node Type Configurations

#### Generic Agents
- **Field**: `node.data.rules.nl`
- **Usage**: Direct natural language instructions sent to LLM
- **Example**: "define inflation" → LLM receives this as primary instruction

#### System Prompt Agents
- **Field**: `node.data.systemPrompt`
- **Usage**: Combined with user input in structured prompt format
- **Example**: System context + user query → structured LLM prompt

#### Router Nodes
- **Field**: `node.data.llmRule` or `node.data.expression`
- **Usage**: LLM-based routing decisions or JavaScript expression evaluation
- **Example**: "Route to next node if sentiment is positive" → LLM decision

#### Tool Nodes
- **Field**: `node.data.mockResponse`
- **Usage**: Predefined responses instead of actual tool execution
- **Example**: Mock API response for testing without external calls

#### Knowledge Base Nodes
- **Field**: `node.data.documents` and `node.data.operation`
- **Usage**: Document storage/retrieval simulation
- **Example**: Mock document search results

### Configuration Priority

1. **Mock Response** (highest priority): If configured, always use mock
2. **Natural Language Rules**: Primary execution method for agents
3. **System Prompt + Behavior**: Fallback structured approach
4. **Error State** (lowest priority): Show "No info input in properties panel"

## Error Handling Strategy

### Execution Errors
- **Missing Configuration**: Show clear error messages about missing Properties Panel setup
- **LLM Failures**: Catch and report LLM execution errors with context
- **Connection Issues**: Handle network failures gracefully
- **Invalid Configurations**: Validate Properties Panel inputs before execution

### User Experience
- **Clear Error Messages**: Specific guidance on what's missing or wrong
- **Partial Results**: Show successful nodes even if later nodes fail
- **Recovery Suggestions**: Actionable advice for fixing configuration issues
- **Debug Information**: Copy functionality for sharing error details

## UI Components Breakdown

### Flow Tab
**Purpose**: Visual representation of workflow structure and execution status

**Features**:
- Node execution status indicators (green=success, red=error, gray=pending)
- Properties Panel configuration preview for each node
- Connection visualization and execution path
- Real-time execution progress

### Output Tab
**Purpose**: Display final workflow results and enable debugging

**Features**:
- Final output display with formatting
- Success/failure status indicators
- Copy-to-clipboard functionality for debugging
- Execution timing information
- Error details when applicable

### Timeline Tab
**Purpose**: Detailed execution timeline and performance analysis

**Features**:
- Step-by-step execution order
- Individual node execution timing
- Total workflow execution time
- Success/failure status for each step
- Detailed execution metadata

## Development Guidelines

### Adding New Node Types

1. **Update propertiesTestingBridge.ts**:
   - Add new node type case in `executeNodeFromProperties()`
   - Create dedicated executor function (e.g., `executeNewNodeType()`)
   - Define Properties Panel field mappings

2. **Update FlowExecutionPanel.tsx**:
   - Add node type recognition in Flow Tab
   - Update Properties Panel configuration display
   - Add appropriate status indicators

3. **Test Integration**:
   - Verify Properties Panel → Execution flow
   - Test error handling for missing configurations
   - Validate UI updates and status indicators

### Debugging Workflow Issues

1. **Check Properties Panel Configuration**:
   - Verify correct field names (`rules.nl`, `systemPrompt`, etc.)
   - Ensure non-empty values in Properties Panel
   - Validate node type matches expected configuration

2. **Trace Execution Flow**:
   - Use browser dev tools to monitor execution
   - Check console for error messages
   - Verify start node detection logic

3. **Test LLM Integration**:
   - Verify `geminiClient` connectivity
   - Check prompt construction in `propertiesTestingBridge`
   - Test mock response fallbacks

## Future Enhancements

### Planned Features
- **Real-time Execution Streaming**: Show intermediate results as they're computed
- **Execution Branching**: Support for conditional flows and parallel execution
- **Result Caching**: Cache node results for faster re-execution
- **Advanced Error Recovery**: Automatic retry logic and fallback strategies

### Architecture Improvements
- **Plugin System**: Extensible node type registration
- **Performance Monitoring**: Detailed execution metrics and optimization
- **Advanced Mocking**: More sophisticated mock response generation
- **Integration Testing**: Automated testing of complete workflows

## Troubleshooting Guide

### Common Issues

**Issue**: "No info input in properties panel"
- **Cause**: Missing Properties Panel configuration
- **Solution**: Configure appropriate fields in Properties Panel for the node type

**Issue**: Flow doesn't start
- **Cause**: No start node detected or circular dependencies
- **Solution**: Ensure at least one node has no incoming connections

**Issue**: LLM execution fails
- **Cause**: Network issues or invalid API configuration
- **Solution**: Check `geminiClient` configuration and network connectivity

**Issue**: Mock responses not working
- **Cause**: Incorrect mock configuration or missing mock data
- **Solution**: Verify `mockResponse` field in Properties Panel

### Debug Information

The Flow Execution Panel provides comprehensive debug information through:
- Console logging of execution steps
- Detailed error messages with context
- Copy functionality for sharing execution results
- Timeline data for performance analysis

This documentation serves as the complete reference for understanding, maintaining, and extending the Flow Execution Panel system.
