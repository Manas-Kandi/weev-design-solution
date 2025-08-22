import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, getClientIp } from "@/lib/utils";
import { canUserAccessModel, getTierRestrictionError, type UserTier } from "@/lib/subscriptionTiers";

// Prefer server-only env vars if present; fallback to NEXT_PUBLIC_* for now
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || process.env.NEXT_PUBLIC_NVIDIA_API_KEY;
const RAW_BASE = process.env.NVIDIA_BASE_URL || process.env.NEXT_PUBLIC_NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
// Normalize base URL to ensure it includes /v1
function normalizeBase(url: string): string {
  const trimmed = url.replace(/\/$/, "");
  if (/\/v\d+$/.test(trimmed)) return trimmed; // already ends with /v<digit>
  // If base doesn't include version segment, append /v1
  return `${trimmed}/v1`;
}

const NVIDIA_BASE_URL = normalizeBase(RAW_BASE);

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    console.warn(`Rate limit exceeded for ${ip} on GET /api/llm/nvidia`);
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!NVIDIA_API_KEY) {
    return NextResponse.json({ error: "NVIDIA API key not configured" }, { status: 400 });
  }
  try {
    const target = `${NVIDIA_BASE_URL.replace(/\/$/, "")}/models`;
    const res = await fetch(target, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
      },
    });
    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream NVIDIA error", status: res.status, target, body: text }, { status: res.status });
    }
    return new NextResponse(text, { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    console.warn(`Rate limit exceeded for ${ip} on POST /api/llm/nvidia`);
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  if (!NVIDIA_API_KEY) {
    return NextResponse.json({ error: "NVIDIA API key not configured" }, { status: 400 });
  }

  try {
    const body = await req.json();
    // Basic validation
    if (!body || typeof body !== "object" || !body.model || !Array.isArray(body.messages)) {
      return NextResponse.json({ error: "Invalid request body: expected { model, messages, ... }" }, { status: 400 });
    }

    // Handle free-models routing
    let requestedModel = body.model;
    if (requestedModel === 'free-models') {
      // Route through Nvidia LLM Router - use a default model that's known to be free
      requestedModel = "meta/llama-3.1-70b-instruct";
    }

    // Tier enforcement: Check if user can access the requested model
    const userTier: UserTier = body.userTier || 'basic'; // Default to basic if not specified
    
    if (!canUserAccessModel(userTier, body.model)) {
      const errorMessage = getTierRestrictionError(userTier, body.model);
      return NextResponse.json({ error: errorMessage }, { status: 403 });
    }

    // Create a new body object without the userTier parameter
    const { userTier: __userTier, ...nvidiaBody } = { ...body, model: requestedModel };

    const target = `${NVIDIA_BASE_URL.replace(/\/$/, "")}/chat/completions`;
    const res = await fetch(target, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        stream: false,
        ...nvidiaBody  // Use the body without userTier
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      // Forward error details to client with target URL context
      return NextResponse.json({ error: "Upstream NVIDIA error", status: res.status, target, body: text }, { status: res.status });
    }

    return new NextResponse(text, { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal error" }, { status: 500 });
  }
}
