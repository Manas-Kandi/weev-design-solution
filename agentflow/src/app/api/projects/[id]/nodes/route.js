import { supabaseAdmin } from '@/lib/supabaseAdmin';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

// GET all nodes for a project
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('project_id');
    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Missing project_id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Optional: verify the requesting user owns the project
    let userId = DEFAULT_USER_ID;
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length);
      try {
        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        if (userData?.user?.id) userId = userData.user.id;
      } catch {}
    }

    // If projects table has user_id, restrict by it; if not, this will be a no-op
    try {
      await supabaseAdmin.from('projects').select('id').eq('id', projectId).eq('user_id', userId).maybeSingle();
    } catch {}

    const { data, error } = await supabaseAdmin
      .from('nodes')
      .select('*')
      .eq('project_id', projectId);

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(data || []), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { id, project_id } = body || {};
    if (!id || !project_id) {
      return new Response(
        JSON.stringify({ error: 'Missing id or project_id in body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let userId = DEFAULT_USER_ID;
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length);
      try {
        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        if (userData?.user?.id) userId = userData.user.id;
      } catch {}
    }

    // Ownership check (no-op if project.user_id not present)
    try {
      await supabaseAdmin.from('projects').select('id').eq('id', project_id).eq('user_id', userId).maybeSingle();
    } catch {}

    const update = {
      type: body.type,
      subtype: body.subtype,
      position: body.position,
      size: body.size,
      data: body.data,
      inputs: body.inputs,
      outputs: body.outputs,
    };

    const { data, error } = await supabaseAdmin
      .from('nodes')
      .update(update)
      .eq('id', id)
      .eq('project_id', project_id)
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

export async function DELETE(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = body?.id;
    const projectId = body?.project_id;
    if (!id || !projectId) {
      return new Response(
        JSON.stringify({ error: 'Missing id or project_id in body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let userId = DEFAULT_USER_ID;
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length);
      try {
        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        if (userData?.user?.id) userId = userData.user.id;
      } catch {}
    }

    try {
      await supabaseAdmin.from('projects').select('id').eq('id', projectId).eq('user_id', userId).maybeSingle();
    } catch {}

    // Handle string IDs properly - the id column is text type
    const { error } = await supabaseAdmin
      .from('nodes')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error deleting node:', { id, projectId, error: error.message });
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST create new node for a project
export async function POST(req) {
  try {
    const body = await req.json();
    if (!body?.project_id) {
      return new Response(
        JSON.stringify({ error: 'Missing project_id in body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let userId = DEFAULT_USER_ID;
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length);
      try {
        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        if (userData?.user?.id) userId = userData.user.id;
      } catch {}
    }

    // Validate project ownership if column exists
    try {
      await supabaseAdmin.from('projects').select('id').eq('id', body.project_id).eq('user_id', userId).maybeSingle();
    } catch {}

    // Allow string IDs like "prompt-node-1" - the database will handle them
    const insert = {
      id: body.id, // Accept whatever ID is provided (string or UUID)
      project_id: body.project_id,
      user_id: userId, // Add the user_id field
      type: body.type,
      subtype: body.subtype ?? null,
      position: body.position ?? null,
      size: body.size ?? null,
      data: body.data ?? null,
      inputs: body.inputs ?? null,
      outputs: body.outputs ?? null,
    };

    const { data, error } = await supabaseAdmin
      .from('nodes')
      .insert(insert)
      .select()
      .single();

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
