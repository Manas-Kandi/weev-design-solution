---
trigger: manual
---

# Rule: AgentFlow Design Philosophy
## Applies to: All design and UX-related files
## Activation: Always

### Intent
Ensure all UX/UI writing, interaction design, and documentation reflect AgentFlow's design-first, AI-native perspective.

### Core Principles
1. **Design behavior, not screens** - Focus on flow dynamics and agent interactions
2. **Visual clarity is paramount** - Flows must be self-evident without documentation
3. **Real-time feedback** - Every action should have immediate visual/textual response
4. **Dynamic representation** - Show state changes, conditions, and branching visually
5. **Zero-code configuration** - All node properties via dropdowns, sliders, text fields
6. **Context preservation** - Show data flow and transformations between nodes

### Visual Design Guidelines
- Node colors must be consistent with their function (e.g., #00c4ff for agents, #ff3b30 for logic)
- Connection lines should indicate data flow direction and type
- Active nodes during testing should have visual indicators (glow, animation)
- Error states must be immediately visible (red borders, error badges)
- Start nodes should have distinct visual markers (green play icon)

### Interaction Patterns
- Right-click context menus for node operations
- Drag-and-drop for node creation and connection
- Double-click for quick property access
- Hover states show port labels and node descriptions