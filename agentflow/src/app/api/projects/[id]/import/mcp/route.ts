import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { validateMcpExport } from "@/types/mcp.types";
import { mapFromMcpExport } from "@/lib/mcp/mapFromMcpExport";

function json(res: unknown, status = 200) {
  return new Response(JSON.stringify(res), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const projectId = params?.id || new URL(req.url).pathname.split("/").at(-2);
    if (!projectId) return json({ error: "Missing project id" }, 400);

    const body = await req.json();

    // 1) Validate MCP document
    const v = validateMcpExport(body);
    if (!v.valid) {
      return json({ error: "Invalid MCP document", errors: v.errors }, 400);
    }

    // 2) Map to internal structures
    const { nodes, connections, startNodeId } = mapFromMcpExport(body);

    // 3) Basic integrity checks (no duplicate ids, edges reference known nodes)
    const nodeIds = new Set(nodes.map((n) => n.id));
    if (nodeIds.size !== nodes.length) {
      return json({ error: "Duplicate node ids in MCP document" }, 400);
    }
    for (const c of connections) {
      if (!nodeIds.has(c.sourceNode) || !nodeIds.has(c.targetNode)) {
        return json({ error: `Edge references unknown node: ${c.id}` }, 400);
      }
    }

    // 4) Replace existing flow: delete connections first, then nodes
    const { error: delConnsErr } = await supabaseAdmin
      .from("connections")
      .delete()
      .eq("project_id", projectId);
    if (delConnsErr) return json({ error: delConnsErr.message }, 500);

    const { error: delNodesErr } = await supabaseAdmin
      .from("nodes")
      .delete()
      .eq("project_id", projectId);
    if (delNodesErr) return json({ error: delNodesErr.message }, 500);

    // 5) Insert nodes
    if (nodes.length > 0) {
      const { error: insNodesErr } = await supabaseAdmin.from("nodes").insert(
        nodes.map((n) => ({
          id: n.id,
          project_id: projectId,
          type: n.type,
          subtype: n.subtype,
          position: n.position,
          size: n.size,
          data: n.data,
          inputs: n.inputs,
          outputs: n.outputs,
        }))
      );
      if (insNodesErr) return json({ error: insNodesErr.message }, 500);
    }

    // 6) Insert connections
    if (connections.length > 0) {
      const { error: insConnsErr } = await supabaseAdmin.from("connections").insert(
        connections.map((c) => ({
          id: c.id,
          project_id: projectId,
          source_node: c.sourceNode,
          source_output: c.sourceOutput,
          target_node: c.targetNode,
          target_input: c.targetInput,
        }))
      );
      if (insConnsErr) return json({ error: insConnsErr.message }, 500);
    }

    // 7) Update start node id on project
    const { error: patchErr } = await supabaseAdmin
      .from("projects")
      .update({ start_node_id: startNodeId ?? null })
      .eq("id", projectId);
    if (patchErr) return json({ error: patchErr.message }, 500);

    // 8) Respond with summary
    return json({
      ok: true,
      projectId,
      counts: { nodes: nodes.length, connections: connections.length },
      startNodeId: startNodeId ?? null,
    });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "Unknown error" }, 500);
  }
}
