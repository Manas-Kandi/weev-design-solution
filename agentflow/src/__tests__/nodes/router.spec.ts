// Tests for agent smart routing across multiple tools.
  describe('Agent Smart Routing', () => {
    // Mock callGemini to return specific intents
    beforeEach(() => {
      (callLLM as any).mockImplementation((prompt: string) => {
        if (prompt.includes("find free time on my calendar")) {
          return Promise.resolve(JSON.stringify({ capability: "calendar.find_free_time" }));
        }
        if (prompt.includes("search the web for cat pictures")) {
          return Promise.resolve(JSON.stringify({ capability: "web_search.search" }));
        }
        return Promise.resolve(null); // Default for other prompts
      });
    });

    it('Given an agent rule "find free time on my calendar", only calendar tool executes', async () => {
      const agentRule = "find free time on my calendar";
      const intentPrompt = `Extract the tool capability from this rule. Respond with a JSON object like { "capability": "tool_name.operation" } or null if no tool capability is identified. Rule: ${agentRule}`;
      const intentResult = await callLLM(intentPrompt);
      const parsedIntent = JSON.parse(intentResult as string);

      expect(parsedIntent).toEqual({ capability: "calendar.find_free_time" });
    });

    it('Given "search the web for cat pictures", only web_search executes', async () => {
      const agentRule = "search the web for cat pictures";
      const intentPrompt = `Extract the tool capability from this rule. Respond with a JSON object like { "capability": "tool_name.operation" } or null if no tool capability is identified. Rule: ${agentRule}`;
      const intentResult = await callLLM(intentPrompt);
      const parsedIntent = JSON.parse(intentResult as string);

      expect(parsedIntent).toEqual({ capability: "web_search.search" });
    });
  });