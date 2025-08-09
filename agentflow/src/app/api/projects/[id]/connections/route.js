import { supabaseAdmin } from '@/lib/supabaseAdmin';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

// GET all connections for a project
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

    const { data, error } = await supabaseAdmin
      .from('connections')
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

// POST create new connection for a project
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

    try {
      await supabaseAdmin.from('projects').select('id').eq('id', body.project_id).eq('user_id', userId).maybeSingle();
    } catch {}

    const insert = {
      id: body.id,
      project_id: body.project_id,
      source_node: body.source_node,
      source_output: body.source_output ?? null,
      target_node: body.target_node,
      target_input: body.target_input ?? null,
    };

    const { data, error } = await supabaseAdmin
      .from('connections')
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

    const { error } = await supabaseAdmin
      .from('connections')
      .delete()
      .eq('id', id)
      .eq('project_id', projectId);

    if (error) {
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
