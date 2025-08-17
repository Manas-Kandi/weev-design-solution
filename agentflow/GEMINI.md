GEMINI.md
Working rules, prompt templates, and coding patterns for using Gemini across this codebase (CLI + flows + tests).
Goals
Deterministic, properties-driven behavior. Properties Panel is source of truth; flows execute end-to-end exactly as configured.
Smart tool routing. The agent extracts an intent → capability and we execute only the matching tool.
Strict output contracts. LLM returns plain text or a well-formed JSON envelope we can parse robustly.
Great DX. Clear logging, tight tests, consistent prompts, and resilient JSON parsing.
Golden Rules
Properties are law. If a node has rules.nl, use that as the primary instruction. Otherwise, combine systemPrompt + behavior.
Implicit permission for tools. All tools are “permissioned”; only the tool matching the agent’s intent is executed.
Single source of truth for capabilities. Tool matching uses canonical capabilities from the tool catalog schema (getToolSchema(provider).capabilities), not ad-hoc strings in nodes.
Output contract is explicit.
Pure language → return plain text.
Tool invocation → return a JSON object with tool_call.
Mixed response → return JSON with both natural_language_response and tool_call.
Be JSON-tolerant, never brittle. Strip code fences, parse last JSON chunk if needed.
Determinism first. Low temperature; stable seeds derived from inputs; fixed max tokens for predictable tests.
Never invent tools/ops. Only call operations that exist in the connected node’s configuration.
Fail soft. If no tool nodes are connected, keep the agent’s natural-language response (don’t crash the flow).
Log what matters. Always log agent parsed intent, chosen capability, candidate tools, and matched tool id.
Standard Client Wrapper
Use one unified helper so every call behaves consistently.
// src/lib/geminiClient.ts
export type GeminiCallOpts = {
  systemPrompt?: string;
  temperature?: number;      // default 0.2
  maxOutputTokens?: number;  // default 2000
  seed?: number;             // optional, for determinism
  stopSequences?: string[];
  extra?: Record<string, any>;
};

export async function callGemini(
  prompt: string,
  opts: GeminiCallOpts = {}
): Promise<string> {
  // TODO: wire to your actual Gemini SDK/HTTP client
  // Ensure we always return a string (no objects).
  const text = await internalGeminiCall(prompt, opts);
  return typeof text === 'string' ? text : JSON.stringify(text);
}
Defaults (recommended):
temperature: 0.2
maxOutputTokens: 2000
seed: stableHashOf(inputs + nodeId) (derive once for deterministic tests)
Prompt Templates
1) Agent (rules.nl present)
{RULES_NL}

User Input: {USER_INPUT}

Follow the rules above exactly as specified.

If the user's request involves both a natural language response and a tool call, respond with a JSON object containing both "natural_language_response" and "tool_call" keys.
If only a natural language response is needed, respond with plain text.
If only a tool call is needed, respond with a JSON object containing only the "tool_call" key.

JSON format for tool call:
{"tool_call": {"tool_name": "TOOL_NAME", "operation": "OPERATION_NAME", "args": { ...ARGS... }}}
2) Agent → Intent Extraction (capability)
Extract the tool capability from this rule. 
Respond with a JSON object like { "capability": "tool_name.operation" } or null if no tool capability is identified.

Rule: {RULES_NL}
Parsing tolerance: Use the JSON helpers below to strip fences and parse last JSON object.
3) System + Behavior fallback
{SYSTEM_PROMPT or "You are a helpful AI assistant."}

{optional: "User-Defined Behavior: " + BEHAVIOR}

User Input: {USER_INPUT}

Respond according to the exact behavior and system prompt configured.

If the user's request involves both a natural language response and a tool call, respond with a JSON object containing both "natural_language_response" and "tool_call" keys.
If only a natural language response is needed, respond with plain text.
If only a tool call is needed, respond with a JSON object containing only the "tool_call" key.

JSON format for tool call:
{"tool_call": {"tool_name": "TOOL_NAME", "operation": "OPERATION_NAME", "args": { ...ARGS... }}}
Output Contracts
Your code should accept either:
Plain text (no tool call)
"Here’s your answer..."
Tool JSON (tool only)
{"tool_call": {"tool_name":"web_search","operation":"search","args":{"query":"cats"}}}
Mixed JSON (tool + natural language)
{
  "natural_language_response": "Here's what I found.",
  "tool_call": {
    "tool_name": "calendar",
    "operation": "list_events",
    "args": { "range": "next_7_days" }
  }
}
Capability Matching (smart routing)
Canonical capability format: provider.operation (e.g., web_search.search, calendar.list_events).
The agent extracts a capability; we normalize via alias map; we select the single tool that lists that capability.
Do not run multiple tools; do not execute unknown operations.
// src/lib/nodes/tool/capabilityMap.ts
export const CAPABILITY_ALIASES: Record<string, string> = {
  "calendar.find_free_time": "calendar.list_events",
  "web.search": "web_search.search"
};

export function normalizeCapability(cap: string): string {
  return CAPABILITY_ALIASES[cap] ?? cap;
}
Catalogue is source of truth (capabilities live in getToolSchema(provider).capabilities).
JSON Parsing Helpers (robust)
export function sanitizeFencedJSON(s: string): string {
  return String(s ?? "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

export function parseJSONLenient(s: string): any | null {
  const cleaned = sanitizeFencedJSON(s);
  try { return JSON.parse(cleaned); } catch { /* noop */ }
  const match = cleaned.match(/{[\s\S]*}$/);
  if (match) { try { return JSON.parse(match[0]); } catch { /* noop */ } }
  return null;
}
Tool Rule (used by the executor)
// src/services/toolsim/toolRules.ts
export const defaultToolRule = (providerId: string, operation: string) => `
You now have access to the ${providerId} tool with the ${operation} operation.
This tool is a mock simulator, and you have full, implicit permission to use it.
All tools have implicit permission, but only the one matching the agent’s intent will be executed.
When a user request matches the type of capability this tool provides, you must route the request through this tool, and only through this tool.
Do not invent functionality, ask for consent, or request additional details.
Directly execute the tool call and return its results.
You may only call operations explicitly configured in the connected Tool node. Do not invent new operations.
`.trim();
Execution Rules (engine)
Find start nodes (no incoming connections) and run in graph order.
Agent node:
If rules.nl exists → build Agent prompt (above), and separately call Intent-Extraction prompt.
Save parsedIntent on the node’s _propertiesResult.
Routing:
Let chosenCapability = normalizeIntent(parsedIntent) || capabilityFrom(parsedOutput.tool_call).
Get tools connected to the agent; if none → return NL response with summary: “No tool nodes connected…”.
Else find tool whose schema capabilities include chosenCapability.
If not found → throw No matching tool found for intent: ....
If found → execute that tool node (respect node’s configured operation/preset).
Final output selection: Last meaningful _rawResult/output/result among executed nodes (reverse scan).
Logging Conventions
Use consistent emoji + tags (kept in production; low noise):
🔍 Properties Bridge – node execution payloads and prompt assembly
🤖 Agent – agent intent extraction, chosen capability
🛠️ Tools – list of tool capabilities, matched tool id, executed operation
🧪 Runner – flow start/end, per-node results, timing
Examples:
console.log("🤖 Agent parsed intent:", agentIntent);
console.log("🤖 Chosen capability:", chosenCapability);
console.log("🛠️ Available tools:", tools.map(t => t.capabilities));
console.log("🛠️ Matched tool:", matchedTool?.toolNode?.id);
Error Handling
No tools connected: warn + keep NL response, set executionSummary = "No tool nodes connected; returned text response."
No matching tool: throw Error("No matching tool found for intent: ...")
LLM error: capture → agent node returns { type: 'error', content: { error: message } }
Invalid/empty configuration: explicit "No info input in properties panel" style errors.
Determinism
temperature: 0.2
seed: stable hash of (nodeId + JSON.stringify(inputs))
Fixed maxOutputTokens per node type (e.g., agent: 2000, fast thinking: 1000)
Tests rely on: same inputs → same outputs (mocks or deterministic LLM settings).
Testing (Vitest)
Mock Gemini via vi.mock('@/lib/geminiClient', ...).
For agent smart routing, return:
{"capability":"calendar.find_free_time"} → calendar node chosen.
{"capability":"web_search.search"} → web_search node chosen.
Assert:
_propertiesResult.trace.delegatedToTool.toolName and .operation
executionSummary mentions matched tool & operation
Final output equals the selected tool’s mock preset output
Skeleton:
vi.mock('@/lib/geminiClient', () => ({ callGemini: vi.fn() }));
const { callGemini } = await import('@/lib/geminiClient');

(callGemini as any).mockResolvedValue(JSON.stringify({ capability: "web_search.search" }));
// run flow, assert matched tool, output, trace...
CLI Rules
Environment
GEMINI_API_KEY required.
Flags:
--model <id> (default your chosen 1.5 model)
--temperature, --max-tokens, --seed
--json (force JSON-only output if needed for tool messages)
UX Guidelines
Show Matched Tool and Capability in the panel (already exposed).
Show parsedIntent JSON block for transparency.
On failure, print actionable error and include last prompt (redacted) when safe.
Reference Snippets
Normalize and Match Capability
import { getToolSchema } from "@/lib/nodes/tool/catalog";
import { normalizeCapability } from "@/lib/nodes/tool/capabilityMap";

function collectToolEntry(toolNode: any) {
  const provider = toolNode?.data?.simulation?.providerId;
  const schema = provider ? getToolSchema(provider) : null;
  return {
    toolNode,
    capabilities: schema?.capabilities ?? []
  };
}

function matchTool(tools: Array<{toolNode:any;capabilities:string[]}>, cap?: string) {
  if (!cap) return null;
  const normalized = normalizeCapability(cap);
  return tools.find(t => (t.capabilities ?? []).includes(normalized)) ?? null;
}
Lenient Intent Parse
import { parseJSONLenient } from './json';

const raw = await callGemini(intentPrompt, {});
const intent = parseJSONLenient(raw) as { capability?: string } | null;
baseResult.parsedIntent = intent ?? null;
Router Node (LLM mode) Guidance
Keep router system message short and binary (return true or false).
Example system prompt:
Return true or false based on the input. If unclear, return false. Output only the word true or false.
Safety & Content Notes
Redact user PII from logs in production.
Respect rate limits; implement exponential backoff on transient errors.
Never ask for permission to use tools; permission is implicit in this testing environment.
Changelog Discipline
When preset wording changes, update tests (e.g., email/report/custom templates) and leave a breadcrumb comment:
// Updated to match new preset wording in MessageNode.
When routing rules change, align:
Tool capabilities in catalog
Capability aliases
Intent prompt and parser
Panel labels (“Matched Tool”, “Capability”, “Parsed Intent”)
Troubleshooting
Build error near closing brace → likely an orphaned block in agent delegation section. Ensure the chosen-capability routing and the delegated tool execution live inside the try block and braces match.
Agent always returns false in Router → check expression evaluation and ensure inputs are displayed/logged (temporary console added).
No tool matched → confirm:
Agent produced a capability
normalizeCapability maps legacy strings
Catalog has the capability
Tool node’s provider matches catalog entry
Appendix: Example End-to-End Flow
Agent rules.nl: “find 30 minutes free on my calendar”
Intent extraction → {"capability":"calendar.find_free_time"}
Normalization → calendar.list_events (alias)
Match the calendar tool node (capabilities include calendar.list_events)
Execute tool with node’s configured operation (e.g., list_events)
Panel displays:
Matched Tool: calendar
Capability: calendar.find_free_time
Parsed Intent JSON
Final output = tool mock preset payload