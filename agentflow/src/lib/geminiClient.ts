// Gemini API utility for workflow execution (v1beta)
export async function callGemini(prompt: string, params: Record<string, unknown> = {}) {
  const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    throw new Error('NEXT_PUBLIC_GEMINI_API_KEY environment variable is required');
  }
  // Resolve model into URL path; default to gemini-2.5-flash-lite
  const model = (params.model as string) || 'gemini-2.5-flash-lite';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  // Use passed-in contents array if provided
  const contents = (params as any).contents || [{ role: 'user', parts: [{ text: prompt }] }];

  // Map config fields into generationConfig (per Gemini spec); omit candidateCount
  const generationConfig: any = {};
  if (typeof (params as any).temperature === 'number') generationConfig.temperature = (params as any).temperature;
  if (typeof (params as any).topK === 'number') generationConfig.topK = (params as any).topK;
  if (typeof (params as any).topP === 'number') generationConfig.topP = (params as any).topP;
  if (Array.isArray((params as any).stopSequences)) generationConfig.stopSequences = (params as any).stopSequences;
  if (typeof (params as any).maxOutputTokens === 'number') generationConfig.maxOutputTokens = (params as any).maxOutputTokens;

  const body: any = {
    contents,
  };
  if (Object.keys(generationConfig).length) body.generationConfig = generationConfig;
  if ((params as any).safetySettings) body.safetySettings = (params as any).safetySettings;

  // DEBUG: Log the outgoing Gemini request body
  if (typeof window !== "undefined" && window?.localStorage) {
    window.localStorage.setItem("__gemini_debug_body__", JSON.stringify(body, null, 2));
  }
  // Also log to console (Node or browser)
  // eslint-disable-next-line no-console
  console.log("[Gemini Debug] Outgoing Gemini payload:", body);


  const res = await fetch(`${url}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  return data;
}
