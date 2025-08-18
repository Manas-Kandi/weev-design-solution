# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Weev is a visual AI agent design platform built with Next.js and Supabase. It provides a node-based workflow editor for creating and orchestrating AI agents, with support for testing, simulation, and real-time execution.

## Development Commands

**Development:**
```bash
npm run dev          # Start development server with Turbopack
npm run build        # Build for production
npm run start        # Start production server
```

**Code Quality:**
```bash
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run test         # Run Vitest tests
```

**MCP Server:**
```bash
npm run mcp          # Start MCP (Model Context Protocol) server
```

## Testing

- **Framework:** Vitest
- **Test files:** `src/**/*.{test,spec}.{ts,tsx}` and `__tests__/**/*.{test,spec}.{ts,tsx}`
- **Run single test:** `npm test -- path/to/test.spec.ts`
- **Test environment:** Node.js

## Architecture

### Core Systems

**FlowEngine** (`src/lib/flow/FlowEngine.ts`):
- Central execution engine for node-based workflows
- Handles node execution order, input/output management, and real-time logging
- Supports parallel execution and topological sorting
- Key method: `execute()` with emitLog callback for real-time feedback

**Node System** (`src/lib/nodes/`):
- Modular node architecture with base class `BaseNode`
- Node types: Agent, Tool, Logic (if-else, decision-tree), Memory, Router, Thinking
- Each node type has dedicated executor and properties panel
- Node definitions in `src/data/nodeDefinitions.ts`

**Type System** (`src/types/index.ts`):
- Comprehensive TypeScript interfaces for all node types
- `FlowIO` envelope for inter-node communication
- `NodeContext` for execution context
- Strict typing for node data, connections, and outputs

### Key Components

**Canvas System** (`src/components/canvas/`):
- `DesignerCanvas.tsx`: Main visual workflow editor
- `PropertiesPanel.tsx`: Node configuration UI
- `Connections.tsx`: Visual connection management

**Testing Framework** (`src/features/testing/`):
- `FlowExecutionPanel.tsx`: Real-time workflow execution monitoring
- `PropertiesDrivenTestingPanel.tsx`: Testing interface
- Tool simulation with mock/live modes

**MCP Integration** (`src/lib/mcp/`):
- Model Context Protocol export/import
- Schema validation and flow conversion
- MCP server implementation

### Data Flow

1. **Node Definitions** → Visual components in canvas
2. **Connections** → Data flow between nodes via FlowEngine
3. **Execution Context** → Shared state and inputs/outputs
4. **Real-time Updates** → UI feedback via event callbacks

## Environment Variables

Required in `.env.local`:
- `NEXT_PUBLIC_GEMINI_API_KEY` - Google Gemini API key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `NVIDIA_API_KEY` - NVIDIA AI endpoints key

## File Structure

- `src/app/` - Next.js app router pages and API routes
- `src/components/` - React components organized by feature
- `src/lib/` - Core business logic and utilities
- `src/types/` - TypeScript type definitions
- `src/features/` - Feature-specific code (testing, etc.)
- `src/data/` - Static data and configuration

## Development Guidelines

**Node Development:**
- Extend `BaseNode` for new node types
- Implement `execute(context: NodeContext)` method
- Add type definitions to `src/types/index.ts`
- Create properties panel in `src/components/panels/`

**Testing:**
- Test node executors in isolation
- Use mock data for external API calls
- Test workflow execution via FlowEngine
- Verify real-time event emission

**Type Safety:**
- All node data must have corresponding TypeScript interface
- Use strict typing for node inputs/outputs
- Validate data shapes at runtime when necessary

## Common Development Tasks

**Adding a new node type:**
1. Define interface in `src/types/index.ts`
2. Create executor in `src/lib/nodes/[category]/`
3. Add to FlowEngine switch statement
4. Create properties panel component
5. Add to node definitions in `src/data/nodeDefinitions.ts`

**Debugging workflow execution:**
- Use FlowExecutionPanel for real-time monitoring
- Check browser console for FlowEngine logs
- Verify node connections and input/output types
- Test individual nodes before full workflow

**Working with external APIs:**
- Use mock mode during development
- Implement proper error handling in node executors
- Add API configuration to node properties panels

## Flow Execution / Testing Panel Specification

### Purpose
The Testing Panel enables developers to dry-run canvas flows (Agent → Tool → ...) without modifying the canvas, providing clear visibility into execution flow, tool routing, and debugging information.

### Execution Model

**Start Node Detection:**
1. Auto-detect nodes with no incoming connections as start candidates
2. Prefer Agent nodes with `generic`/`thinking` subtypes
3. Allow manual override via dropdown
4. Log: ` Start Node Detection` and ` Selected {title} as start node`

**Input Resolution Priority:**
1. Properties Panel "Agent Rules (NL)" or test prompt (`pickedFrom: "properties-probe"`)
2. Selected node prompt override (`pickedFrom: "selection"`)
3. Manual panel input (`pickedFrom: "panel"`)

**Agent-to-Tool Routing:**
- Agents emit capability intents (e.g., `web_search.search`)
- Tools advertise capabilities via `providerId` and schema
- Router matches capabilities using normalized strings
- Fallback: Single tool auto-routes if no capability specified
- Error handling: Graceful failures with clear explanations

### Agent-Tool Routing Enhancements

The Agent-Tool routing system has been enhanced to make agents smarter when multiple tools are attached:

#### 1. Enhanced Tool Awareness
Agents collect a structured list of all available tools and their capabilities before making routing decisions, including:
- ID, Name, Provider, Operation
- Detailed descriptions
- Normalized capability identifiers
- Parameter schemas

#### 2. Intelligent LLM-Based Intent Selection
Agents ask the LLM to choose tools based on the structured list of available capabilities rather than routing blindly.

#### 3. Multi-Tool Planning
Agents can plan and execute:
- Single tools for simple requests
- Multiple tools in sequence for complex workflows
- Mixed responses with both natural language and tool calls

#### 4. Robust Fallback Mechanisms
When the LLM returns an invalid tool name:
- Uses fuzzy matching against known capabilities
- Provides clear error messages with connected tool information
- Prevents silent failures

### Event Lifecycle
```typescript
type ExecutionEvent =
  | { type: 'flow-started'; at: number; startNodeId: string }
  | { type: 'node-started'; nodeId: string; title: string; nodeType: string; nodeSubtype?: string }
  | { type: 'node-finished'; nodeId: string; title: string; nodeType: string; durationMs?: number }
  | { type: 'flow-finished'; at: number; status: 'success'|'error'; durationMs: number };
```

### Required Console Logs
Essential debugging logs to always emit:
- **Setup:** ` Start Node Detection`, ` Selected node`, ` Flow Execution Debug`
- **Execution:** ` Starting workflow`, ` Executing node`, ` Agent Node Execution`
- **Tool Routing:** ` Connected tool nodes`, `Available tools`, `Matched tool`
- **Results:** `✅ Node execution result`, ` Workflow execution completed`

### UI Layout

**Header:**
- "Execute Flow (N nodes)" button
- "Starting from: {Node Title}" with dropdown override
- Mode chip ("Mock tools" / "Live tools")

**Tabs:**
1. **Flow:** Execution order with status dots, inputs/outputs on hover
2. **Output:** Final result with copy button, error explanations
3. **Timeline:** Chronological event list with durations

### Error Handling (Never Crash)
- **No tools connected:** Return agent text response with summary
- **Capability mismatch:** Show available vs requested capabilities
- **JSON parse failure:** Set `parsedOutput = null`, continue execution
- **Tool misconfiguration:** Clear error messages with fix suggestions

### Tool Execution
- **Agent nodes:** Call LLM with system prompt, rules, and context
- **Tool nodes:** Execute mock/live providers (NOT LLM)
- Mock mode: Use presets with configurable latency
- Live mode: Call real APIs when enabled

### Type Definitions
```typescript
type ToolEntry = {
  toolNode: CanvasNode;
  providerId: string;
  schema?: ToolSchema;
  capabilities: string[];
};

type NodeExecutionResult = {
  result?: unknown;
  outputsTabResult?: unknown;
  executionSummary?: string;
  metadata?: unknown;
  errors?: { message: string; code?: string }[];
};
```

### Debugging Tool Routing Issues
1. Check `providerId` in Tool node configuration
2. Verify schema registration and capabilities array
3. Ensure capability normalization matches agent intent
4. Use Timeline tab to trace execution flow
5. Review console logs for routing decisions