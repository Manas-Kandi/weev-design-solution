import { supabaseAdmin } from '@/lib/supabaseAdmin';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

// GET /api/projects/[id]/files?project_id=...
export async function GET(req, { params }) {
  try {
    const { searchParams } = new URL(req.url);
    const awaitedParams = await params;
    const projectId = awaitedParams?.id || searchParams.get('project_id');
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

    // Ownership check (enforce if user_id column exists)
    try {
      const { data: proj, error: projErr } = await supabaseAdmin
        .from('projects')
        .select('id, user_id')
        .eq('id', projectId)
        .maybeSingle();
      if (projErr) throw projErr;
      if (proj && 'user_id' in proj && proj.user_id && proj.user_id !== userId) {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch {}

    // Download flow: return a signed URL for a given file_id
    const action = searchParams.get('action');
    if (action === 'download') {
      const fileId = searchParams.get('file_id');
      if (!fileId) {
        return new Response(
          JSON.stringify({ error: 'Missing file_id' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      const { data: fileRow, error: fileErr } = await supabaseAdmin
        .from('project_files')
        .select('id, file_path, project_id, name, file_type')
        .eq('id', fileId)
        .single();
      if (fileErr || !fileRow || fileRow.project_id !== projectId) {
        return new Response(
          JSON.stringify({ error: 'File not found' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }
      // Double-check ownership (if projects.user_id exists)
      try {
        const { data: proj, error: projErr } = await supabaseAdmin
          .from('projects')
          .select('id, user_id')
          .eq('id', projectId)
          .maybeSingle();
        if (projErr) throw projErr;
        if (proj && 'user_id' in proj && proj.user_id && proj.user_id !== userId) {
          return new Response(
            JSON.stringify({ error: 'Forbidden' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } catch {}
      const { data: signed, error: signedErr } = await supabaseAdmin.storage
        .from('project-files')
        .createSignedUrl(fileRow.file_path, 60 * 10); // 10 minutes
      if (signedErr) {
        return new Response(
          JSON.stringify({ error: signedErr.message }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(JSON.stringify({ signedUrl: signed?.signedUrl, name: fileRow.name, type: fileRow.file_type }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { data, error } = await supabaseAdmin
      .from('project_files')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

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

// POST /api/projects/[id]/files  (multipart/form-data with 'file')
export async function POST(req, { params }) {
  try {
    const awaitedParams = await params;
    const projectId = awaitedParams?.id;
    if (!projectId) {
      return new Response(
        JSON.stringify({ error: 'Missing project id in URL' }),
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

    // Ownership check (enforce if user_id column exists)
    try {
      const { data: proj, error: projErr } = await supabaseAdmin
        .from('projects')
        .select('id, user_id')
        .eq('id', projectId)
        .maybeSingle();
      if (projErr) throw projErr;
      if (proj && 'user_id' in proj && proj.user_id && proj.user_id !== userId) {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch {}

    const formData = await req.formData();
    const file = formData.get('file');
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'Missing file' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const path = `${projectId}/${Date.now()}-${safeName}`;

    const { data: uploaded, error: uploadErr } = await supabaseAdmin.storage
      .from('project-files')
      .upload(path, file, { cacheControl: '3600', upsert: false });
    if (uploadErr) {
      return new Response(
        JSON.stringify({ error: uploadErr.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const record = {
      project_id: projectId,
      user_id: userId,
      name: file.name,
      file_path: uploaded?.path || path,
      file_type: file.type || 'application/octet-stream',
      size_bytes: file.size ?? null,
    };

    const { data, error } = await supabaseAdmin
      .from('project_files')
      .insert(record)
      .select()
      .single();

    if (error) {
      // best-effort cleanup storage if DB insert fails
      try { await supabaseAdmin.storage.from('project-files').remove([path]); } catch {}
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

// DELETE /api/projects/[id]/files  (JSON body: { id })
export async function DELETE(req, { params }) {
  try {
    const awaitedParams = await params;
    const projectId = awaitedParams?.id;
    const body = await req.json().catch(() => ({}));
    const fileId = body?.id;
    if (!projectId || !fileId) {
      return new Response(
        JSON.stringify({ error: 'Missing id or project id' }),
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

    // Ownership check (enforce if user_id column exists)
    try {
      const { data: proj, error: projErr } = await supabaseAdmin
        .from('projects')
        .select('id, user_id')
        .eq('id', projectId)
        .maybeSingle();
      if (projErr) throw projErr;
      if (proj && 'user_id' in proj && proj.user_id && proj.user_id !== userId) {
        return new Response(
          JSON.stringify({ error: 'Forbidden' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    } catch {}

    // Load file to get path and ensure it belongs to project
    const { data: fileRow, error: fileErr } = await supabaseAdmin
      .from('project_files')
      .select('id, file_path, project_id')
      .eq('id', fileId)
      .single();
    if (fileErr || !fileRow || fileRow.project_id !== projectId) {
      return new Response(
        JSON.stringify({ error: 'File not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const filePath = fileRow.file_path;
    const { error: storageErr } = await supabaseAdmin.storage
      .from('project-files')
      .remove([filePath]);
    if (storageErr) {
      return new Response(
        JSON.stringify({ error: storageErr.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { error: dbErr } = await supabaseAdmin
      .from('project_files')
      .delete()
      .eq('id', fileId);
    if (dbErr) {
      return new Response(
        JSON.stringify({ error: dbErr.message }),
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
