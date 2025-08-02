# AgentFlow – Copilot Coding Instructions

## Project Architecture & Patterns

- **Node-based Visual AI Design**: The core of AgentFlow is a modular, extensible node system. Nodes are defined in `src/lib/nodes/*` (logic, agent, knowledge, etc.) and rendered as React components in `src/components/nodes/*`. All nodes extend `BaseNode` and implement an `execute(context)` method for flow logic.
- **Flow Orchestration**: The `FlowEngine` (see `src/lib/flow/FlowEngine.ts`) executes nodes in topological order, with 500ms visual delays for clarity. Nodes can execute in parallel if inputs are satisfied. Errors are captured, not thrown.
- **Properties Panels**: Node configuration is handled via React panels in `src/components/propertiesPanels/`. All UI rules (colors, spacing, fonts) must come from `propertiesPanelTheme.ts`—never use Tailwind or global CSS for these.
- **Type Safety**: All node data is a union type. Always use type guards before accessing properties on `CanvasNode.data`. See `.windsurf/rules/common-errors.md` for safe access patterns.

## Key Conventions & Workflows

- **Zero-Code UX**: All node properties are edited via dropdowns, sliders, and text fields—never require code input from users.
- **Visual Feedback**: Nodes show real-time execution state (active, error, etc.) and data flow. Use color and animation as per `.windsurf/rules/design-principles.md`.
- **Gemini AI Integration**: Each agent node manages its own Gemini config (model, temperature, systemPrompt, etc.). Prompt construction follows the order: system prompt → personality → escalation → context → user input.
- **Testing & Debugging**: Use the FlowEngine's test mode for visual debugging. Highlight the currently executing node and show input/output in the results panel.
- **Build/Run**: Start the dev server with `npm run dev`. Set `NEXT_PUBLIC_GEMINI_API_KEY` in `.env.local` for Gemini integration.

## Error Handling & Best Practices

- **Type Guards**: Always check node data types before property access. Use helper functions for common property lookups.
- **No Error Suppression**: Never use `@ts-ignore` or blanket try/catch. Fix errors at the type or logic level.
- **Component Purity**: Never mutate props. Use pure functions and React state for all UI logic.
- **Visual Consistency**: All node and panel UI must use theme-based inline styles. See `propertiesPanelTheme.ts` for the source of truth.

## Examples

- **Node Implementation**:
  ```ts
  export class IfElseNode extends BaseNode {
    async execute(context: NodeContext): Promise<NodeOutput> {
      // Use type guards for node.data
      // ...node logic...
    }
  }
  ```
- **Panel Styling**:
  ```tsx
  <div
    style={{
      background: theme.colors.background,
      borderRadius: theme.borderRadius.section,
    }}
  >
    {/* ... */}
  </div>
  ```

## Reference Files

- `src/lib/nodes/` – Node logic and types
- `src/components/nodes/` – Node React components
- `src/components/propertiesPanels/` – Node property panels
- `src/lib/flow/FlowEngine.ts` – Flow orchestration
- `.windsurf/rules/` – Architecture, design, and error handling rules
- `propertiesPanelTheme.ts` – UI theme source

For more, see `.windsurf/rules/` and the project README.
