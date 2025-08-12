import { featureFlags } from "@/config/featureFlags";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { mapToMcpExport } from "@/lib/mcp/mapToMcpExport";
import type { CanvasNode, Connection } from "@/types";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    if (!featureFlags.mcpExport.enabled) {
      return new Response(JSON.stringify({ error: "MCP export is disabled" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const projectId = params?.id || new URL(req.url).pathname.split("/").at(-3);
    if (!projectId) {
      return new Response(JSON.stringify({ error: "Missing project id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Optional: identify user (non-blocking)
    // Reuse pattern from existing routes if needed in the future.

    // Parse environment overrides from query params (Testing Panel settings)
    const url = new URL(req.url);
    const qp = url.searchParams;

    const mode = (qp.get("mode") as "mock" | "mixed" | "live" | null) || undefined;
    const mockProfile = qp.get("mockProfile") || undefined;
    const seed = (qp.get("seed") as string | null) || undefined;
    const latencyMin = qp.get("latencyMin") ? Number(qp.get("latencyMin")) : undefined;
    const latencyMax = qp.get("latencyMax") ? Number(qp.get("latencyMax")) : undefined;
    const errorType = qp.get("errorType") || undefined;
    const errorProbability = qp.get("errorProbability") ? Number(qp.get("errorProbability")) : undefined;
    const scenario = qp.get("scenario") || undefined;
    const llmProvider = qp.get("llmProvider") || undefined;
    const llmModel = qp.get("llmModel") || undefined;
    const llmTemperature = qp.get("llmTemperature") ? Number(qp.get("llmTemperature")) : undefined;

    // Fetch project and flow data without mutating anything
    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .select("id, name, description, start_node_id")
      .eq("id", projectId)
      .single();
    if (projectError) {
      return new Response(JSON.stringify({ error: projectError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: nodes, error: nodesError } = await supabaseAdmin
      .from("nodes")
      .select("*")
      .eq("project_id", projectId);
    if (nodesError) {
      return new Response(JSON.stringify({ error: nodesError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: connections, error: connectionsError } = await supabaseAdmin
      .from("connections")
      .select("*")
      .eq("project_id", projectId);
    if (connectionsError) {
      return new Response(JSON.stringify({ error: connectionsError.message }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Build MCP export document
    const { export: mcp, validation } = mapToMcpExport({
      projectId,
      projectName: (project as any)?.name || "Untitled Project",
      projectDescription: (project as any)?.description ?? null,
      startNodeId: (project as any)?.start_node_id ?? null,
      nodes: (nodes || []) as CanvasNode[],
      connections: (connections || []) as Connection[],
      env: {
        mode,
        mockProfile: mockProfile ?? undefined,
        seed: seed ?? "auto",
        latencyMin,
        latencyMax,
        errorType: errorType ?? undefined,
        errorProbability,
        scenario,
        llmProvider,
        llmModel,
        llmTemperature,
      },
    });

    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: "MCP export validation failed", details: validation.errors }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Return JSON with correct headers. Dates should be UTC ISO strings.
    // Our MCP schema defines numeric createdAt inside flows.meta; response headers include ISO timestamp.
    const exportedAt = new Date().toISOString();

    return new Response(JSON.stringify(mcp), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
        "X-Exported-At": exportedAt,
      },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
