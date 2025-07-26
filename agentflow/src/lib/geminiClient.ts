// Gemini API utility for workflow execution
// Replace 'YOUR_GEMINI_API_KEY' with your actual key in production

const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent';

export async function callGemini(prompt: string, params: Record<string, unknown> = {}) {
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    ...params
  };
  const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('Gemini API error: ' + res.status);
  const data = await res.json();
  return data;
}
