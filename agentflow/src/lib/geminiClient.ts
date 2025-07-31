// Gemini API utility for workflow execution
// Throw an explicit error if the API key is missing
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error('NEXT_PUBLIC_GEMINI_API_KEY environment variable is required');
}
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export async function callGemini(prompt: string, params: Record<string, unknown> = {}) {
  // Use passed-in contents array if provided
  const contents = params.contents || [{ role: 'user', parts: [{ text: prompt }] }];

  // Only allow Gemini-accepted fields in the payload
  const ALLOWED_FIELDS = [
    "model",
    "contents",
    "temperature",
    "topK",
    "topP",
    "candidateCount",
    "stopSequences",
    "safetySettings",
  ];
  const { contents: _, ...rest } = params;
  const filtered = Object.fromEntries(
    Object.entries(rest).filter(([k]) => ALLOWED_FIELDS.includes(k))
  );
  const body = {
    contents,
    ...filtered,
  };
  // DEBUG: Log the outgoing Gemini request body
  if (typeof window !== "undefined" && window?.localStorage) {
    window.localStorage.setItem("__gemini_debug_body__", JSON.stringify(body, null, 2));
  }
  // Also log to console (Node or browser)
  // eslint-disable-next-line no-console
  console.log("[Gemini Debug] Outgoing Gemini payload:", body);


  const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
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
