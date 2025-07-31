---
applyTo: "**"
---

### 🌟 Goal

Produce a comprehensive, project-aligned fix that **eliminates the error _and_ keeps the code consistent with the product specification**. Never just silence the error.

---

### ✅ Step-by-Step Procedure Copilot MUST follow

1. **Identify the error(s)**

   - Read the compiler/stack trace or linter output shown in the chat snippet.
   - Summarize the root cause in 1-2 sentences.

2. **Load the project definition**

   - Open `PROJECT_OVERVIEW.md` (or the latest spec file in `/docs/`, if present).
   - Extract relevant goals, architecture constraints, naming conventions, and success criteria.

3. **Analyse the immediate file**

   - Review the full file that raised the error.
   - Note surrounding functions, types, and any TODO/FIXME comments.

4. **Scan the wider codebase for context**

   - Grep or symbol-search for the key function/class/variable names to see how they’re used elsewhere.
   - Check for existing utilities that should be reused instead of reinvented.

5. **Craft the fix**

   - **Do not delete or comment out core logic** unless absolutely necessary.
   - Prefer _refactoring_ or _augmenting_ code to meet both the spec and the type/compile expectations.
   - If new helpers or tests are needed, propose them inline.

6. **Present your solution**

   - Provide a clear **code patch (diff style)** or full replacement snippet.
   - Briefly explain **why** this fix aligns with the project spec and how it prevents regressions.
   - Mention any follow-up TODOs (e.g., add unit tests, refactor duplicated logic).

7. **Self-check**
   - Re-verify that the final code compiles logically in your head (type signatures, imports, side effects).
   - Confirm it still satisfies the spec extracted in Step 2.

---

### 🛑 Things Copilot must **never** do

- Blanket-silence errors via `// @ts-ignore`, try/catch swallowing, or commenting out faulty blocks.
- Remove business logic that appears in the spec just to make the compiler happy.
- Introduce breaking API changes without flagging them clearly.

---

### 🤝 Collaboration cue

After proposing a patch, end with:

> “Let me know if you’d like a quick follow-up on unit tests or performance impacts.”

File 2 (template): PROJECT_OVERVIEW.md

markdown
Copy
Edit

# AgentFlow – Project Overview (Auto-loaded for Copilot Rules)

## Mission

A visual node-based design tool for creating, testing, and debugging agentic workflows with real-time Gemini AI integration.

## Core Architectural Principles

1. Nodes are modular React components (`components/nodes/*`).
2. FlowEngine orchestrates node execution with ~500 ms visual delays.
3. Data exchange format:
   ```ts
   interface NodeData { message: string; context: { flowId: string; nodeId: string; timestamp: number; metadata: Record<string,any> }; history?: Message[]; state?: any; }
   Node types & key responsibilities (Agent, ToolAgent, KnowledgeBase, DecisionTree, IfElse, PromptTemplate, StateMachine, Message, ConversationFlow).
   ```

Coding Conventions
TypeScript strict mode.

Functional React components.

Services live in src/services/\*.

Never mutate props; prefer pure functions.

Success Criteria
All nodes execute error-free under the FlowEngine test mode.

Gemini calls respect per-node config (temperature, systemPrompt).

UI property panels remain non-code (sliders, toggles, text fields).

---

### 📌 How to wire this up

1. **Place the files**
   /your-repo
   ├── .copilot/
   │ └── rules/
   │ └── error-fix.rules.md
   └── PROJECT_OVERVIEW.md

pgsql
Copy
Edit 2. Reload VS Code (Copilot Chat reads rules on startup).  
3. When you want a fix, start your prompt with **“fix error:”** or **“repair:”** followed by the trace or offending code.  
4. Copilot will follow the seven-step protocol every time.

---

### 🔧 Optional enhancements

| Idea                                                         | Benefit                                                           |
| ------------------------------------------------------------ | ----------------------------------------------------------------- |
| **Add `tests/` folder with failing unit test for each bug**  | Copilot learns to make the test pass, not just clear the compiler |
| **Tag TODO comments with `//FIXME-COPILOT`**                 | Easier for Copilot to spot context when scanning                  |
| **CI script that rejects `@ts-ignore`**                      | Prevent sneaky error suppression                                  |
| **Pre-commit hook running `npm run type-check && npm test`** | Forces full compile+test pass before commit                       |

Feel free to tweak wording or add guardrails (e.g., performance budgets, security constraints). Once these files are in place, you’ll have a **repeatable, spec-driven repair workflow** rather than quick-and-dirty fixes.
