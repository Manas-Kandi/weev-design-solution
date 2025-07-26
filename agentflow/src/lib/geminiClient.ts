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

  // Build body without re-including `contents` in the root of `params`
  const { contents: _, ...rest } = params;
  const body = {
    contents,
    ...rest,
  };

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
