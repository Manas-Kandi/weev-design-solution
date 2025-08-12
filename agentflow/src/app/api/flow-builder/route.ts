import { NextResponse } from 'next/server';
import { callGemini } from '@/lib/geminiClient';
import { CanvasNode, Connection } from '@/types';

const SYSTEM_PROMPT = `
You are Weev, a visual agentic system builder. Your task is to take a user's natural language description of a workflow and convert it into a runnable FlowSpec JSON object. You must only use the supported node types and ensure the generated flow is valid and runnable.

**Supported Node Types:**
- **Agent**: An LLM-powered node that can reason, respond to prompts, and make decisions. (type: 'agent', subtype: 'agent')
- **ToolAgent**: An agent that uses a specific tool. (type: 'agent', subtype: 'tool-agent')
- **DecisionTree**: A node that routes the flow based on conditions. (type: 'logic', subtype: 'decision')
- **KnowledgeBase**: A node for retrieving information. (type: 'data', subtype: 'knowledge')

**ToolAgent - Supported Tools:**
- web_search
- calculator
- db_lookup
- book_appointment

**Instructions:**
1.  **Parse the user's request** to understand the desired workflow.
2.  **Select the appropriate nodes** from the supported list.
3.  **Define the nodes** with all necessary properties pre-filled. This includes:
    - A unique 'id' for each node.
    - 'type' and 'subtype'.
    - 'position' and 'size' for the canvas.
    - 'data' object with 'title', 'description', 'icon', 'color', and any type-specific properties (e.g., 'systemPrompt' for an Agent, 'toolConfig' for a ToolAgent).
4.  **Define the connections** between the nodes, specifying the 'sourceNode', 'sourceOutput', 'targetNode', and 'targetInput'.
5.  **Specify the 'startNodeId'**.
6.  **Return ONLY the raw JSON** of the FlowSpec object, with no extra text or markdown.

**Example Output Format:**
{
  "nodes": [
    { "id": "...", "type": "...", ... }
  ],
  "connections": [
    { "id": "...", "sourceNode": "...", ... }
  ],
  "startNodeId": "..."
}
`;

export async function POST(request: Request) {
  const { prompt } = await request.json();

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  try {
    const fullPrompt = `${SYSTEM_PROMPT}\n\nUser Request: ${prompt}`;
    const llmResponse = await callGemini(fullPrompt);

    // Clean the response to ensure it's valid JSON
    const jsonString = llmResponse.replace(/```json\n|```/g, '').trim();
    const flowSpec = JSON.parse(jsonString);

    // TODO: Add validation to ensure the flowSpec conforms to the required types

    return NextResponse.json(flowSpec);
  } catch (error) {
    console.error('Error calling LLM or parsing response:', error);
    return NextResponse.json({ error: 'Failed to generate flow from LLM.' }, { status: 500 });
  }
}
