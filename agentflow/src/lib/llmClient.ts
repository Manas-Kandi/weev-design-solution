// Unified LLM client for AgentFlow
// Supports NVIDIA (OpenAI-compatible) and Gemini. Defaults to NVIDIA.
// Configure via env:
// - NEXT_PUBLIC_LLM_PROVIDER = 'nvidia' | 'gemini' (default: 'nvidia')
// - NEXT_PUBLIC_NVIDIA_API_KEY
// - NEXT_PUBLIC_NVIDIA_MODEL (default: 'meta/llama-3.1-70b-instruct')
// - NEXT_PUBLIC_GEMINI_API_KEY (used by geminiClient)

import { callGemini } from "./geminiClient";

export type LLMProvider = "nvidia" | "gemini";

export interface CallLLMOptions {
  provider?: LLMProvider;
  model?: string;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  system?: string; // optional system prompt
  // If set to 'json', request JSON object responses via OpenAI-compatible response_format
  response_format?: 'json';
  // Optional deterministic seed (NVIDIA/OpenAI-compatible only). Ignored by Gemini.
  seed?: number | string;
}

function cleanAssistantText(text: string): string {
  if (!text) return text;
  let t = text.trim();
  // Strip markdown code fences
  t = t.replace(/^```(?:json)?\s*\n?/i, "");
  t = t.replace(/```\s*$/i, "");
  // Remove known control tokens like <|return|>, <|eot_id|>, etc.
  t = t.replace(/<\|[^>]+\|>/g, "");
  return t.trim();
}

export interface LLMResult {
  provider: LLMProvider;
  raw: any;
  text: string;
  reasoning?: string | null;
}

const DEFAULT_PROVIDER: LLMProvider = (process.env.NEXT_PUBLIC_LLM_PROVIDER as LLMProvider) || "nvidia";

function normalizeNvidiaBase(url?: string): string {
  const raw = url && url.trim().length ? url.trim() : "https://integrate.api.nvidia.com/v1";
  const noTrail = raw.replace(/\/$/, "");
  if (/\/v\d+$/.test(noTrail)) return noTrail;
  return `${noTrail}/v1`;
}
const NVIDIA_BASE_URL = normalizeNvidiaBase(process.env.NEXT_PUBLIC_NVIDIA_BASE_URL);
const NVIDIA_API_KEY = process.env.NEXT_PUBLIC_NVIDIA_API_KEY;
const NVIDIA_DEFAULT_MODEL = process.env.NEXT_PUBLIC_NVIDIA_MODEL || "meta/llama-3.1-70b-instruct";

function tryExtractJson(input: string): string | null {
  try {
    const start = input.indexOf("{");
    const end = input.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    const candidate = input.slice(start, end + 1).trim();
    JSON.parse(candidate);
    return candidate;
  } catch {
    return null;
  }
}

export async function callLLM(prompt: string, opts: CallLLMOptions = {}): Promise<LLMResult> {
  const provider: LLMProvider = opts.provider || DEFAULT_PROVIDER;

  if (provider === "nvidia") {
    if (!NVIDIA_API_KEY) {
      throw new Error("NVIDIA provider selected but NVIDIA_API_KEY/NEXT_PUBLIC_NVIDIA_API_KEY is not configured");
    }
    // Normalize NVIDIA model IDs: GPT-OSS models must be referenced as openai/gpt-oss-XXb per NIM
    const rawModel = opts.model || NVIDIA_DEFAULT_MODEL;
    const normalized = /^gpt-oss-\d+/i.test(rawModel) ? `openai/${rawModel}` : rawModel;
    const fallbackModel = "meta/llama-3.1-70b-instruct";
    // Default system; if JSON requested, enforce JSON-only, else be generic
    const defaultSystem = opts.response_format === 'json'
      ? "You are a helpful assistant. Return ONLY a single valid JSON object or array in the assistant message content. Do NOT include explanations, markdown, code fences, or control tokens like <|return|> or <|eot_id|>. Do NOT include chain-of-thought or reasoning."
      : "You are a helpful assistant.";
    const messages = [
      { role: "system", content: defaultSystem },
      ...(opts.system ? [{ role: "system", content: opts.system }] : []),
      { role: "user", content: prompt },
    ];
    const makeBody = (modelName: string) => ({
      model: modelName,
      messages,
      temperature: opts.temperature ?? 0.7,
      top_p: opts.top_p ?? 0.95,
      max_tokens: opts.max_tokens ?? 512,
      stream: false,
      // Prevent control tokens from appearing in content
      stop: ["<|return|>", "<|eot_id|>"],
      ...(opts.response_format === 'json' ? { response_format: { type: 'json_object' } } : {}),
      ...(typeof opts.seed !== 'undefined' && Number.isFinite(typeof opts.seed === 'string' ? Number(opts.seed) : (opts.seed as number))
        ? { seed: typeof opts.seed === 'string' ? Number(opts.seed) : opts.seed }
        : {}),
    });
    // (seed/response_format handled inside makeBody)

    // Use server-side direct call; client-side via Next.js proxy to avoid CORS
    const isBrowser = typeof window !== "undefined";
    const url = isBrowser ? "/api/llm/nvidia" : `${NVIDIA_BASE_URL}/chat/completions`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Accept": "application/json",
      ...(isBrowser ? {} : { Authorization: `Bearer ${NVIDIA_API_KEY}` }),
    };

    const doRequest = async (modelName: string) => {
      const resp = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(makeBody(modelName)),
      });
      const text = await resp.text();
      return { resp, text };
    };

    let attemptModel = normalized;
    let { resp, text } = await doRequest(attemptModel);
    if (!resp.ok) {
      // Detect model-not-found/404 and retry with fallback model once
      const status = resp.status;
      const looks404 = status === 404 || /404/i.test(text) || /model/i.test(text) && /not\s+found/i.test(text) || /page not found/i.test(text);
      if (looks404 && attemptModel !== fallbackModel) {
        attemptModel = fallbackModel;
        ({ resp, text } = await doRequest(attemptModel));
      }
    }

    if (!resp.ok) {
      throw new Error(`NVIDIA LLM error ${resp.status} (url=${url}): ${text}`);
    }
    const data = JSON.parse(text);
    const choice = data?.choices?.[0];
    let assistantText: string = choice?.message?.content ?? "";
    const reasoning: string | null = choice?.message?.reasoning_content ?? null;
    // Clean artifacts and ensure JSON extraction when requested
    assistantText = cleanAssistantText(assistantText);
    if (opts.response_format === 'json') {
      // If assistant content is empty or not valid JSON, try from reasoning
      let parsedOk = false;
      if (assistantText) {
        try { JSON.parse(assistantText); parsedOk = true; } catch {}
      }
      if (!parsedOk) {
        // First, try to extract from assistant text itself (handles trailing tokens)
        let extracted = tryExtractJson(assistantText);
        if (!extracted && reasoning) {
          extracted = tryExtractJson(reasoning);
        }
        if (extracted) {
          assistantText = cleanAssistantText(extracted);
          try { JSON.parse(assistantText); parsedOk = true; } catch {}
        }
      }
    }
    return { provider: "nvidia", raw: data, text: assistantText, reasoning };
  }

  // Gemini path (only when explicitly requested)
  const response = await callGemini(prompt, {
    model: opts.model || "gemini-2.5-flash-lite",
    temperature: opts.temperature,
    topP: opts.top_p,
    maxOutputTokens: opts.max_tokens,
  });
  const text = response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { provider: "gemini", raw: response, text };
}
