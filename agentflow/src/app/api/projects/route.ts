import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getAuthedUser } from '@/lib/auth';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

// GET all projects
export async function GET(req: Request) {
  try {
    const authedUserId = (await getAuthedUser(req))?.id ?? null;

    // If we have a valid user, try to scope by user_id. If column missing, fall back to unscoped.
    if (authedUserId) {
      const scoped = await supabaseAdmin
        .from('projects')
        .select('*')
        .eq('user_id', authedUserId);
      if (!scoped.error) {
        return new Response(JSON.stringify(scoped.data || []), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // fall through to unscoped on error (e.g., missing column)
    }

    const unscoped = await supabaseAdmin.from('projects').select('*');
    if (unscoped.error) {
      return new Response(
        JSON.stringify({ error: unscoped.error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(JSON.stringify(unscoped.data || []), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// POST create new project
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const authedUserId = (await getAuthedUser(req))?.id ?? null;

    const baseInsert = {
      name: body?.name ?? 'Untitled Project',
      description: body?.description ?? '',
      status: body?.status ?? 'draft',
      start_node_id: body?.start_node_id ?? null,
    };

    // Insert priority:
    // 1) If authed, insert with user_id = authedUserId
    // 2) Else, try with DEFAULT_USER_ID (supports schemas requiring user_id)
    // 3) Fallback to insert without user_id (supports schemas without that column)
    if (authedUserId) {
      const first = await supabaseAdmin
        .from('projects')
        .insert({ ...baseInsert, user_id: authedUserId })
        .select()
        .single();
      if (!first.error) {
        return new Response(JSON.stringify(first.data), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // fall through to try without user_id
    } else {
      const withDefault = await supabaseAdmin
        .from('projects')
        .insert({ ...baseInsert, user_id: DEFAULT_USER_ID })
        .select()
        .single();
      if (!withDefault.error) {
        return new Response(JSON.stringify(withDefault.data), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      // fall through to try without user_id (covers schemas where user_id column doesn't exist)
    }

    const fallback = await supabaseAdmin
      .from('projects')
      .insert(baseInsert)
      .select()
      .single();
    if (fallback.error) {
      return new Response(
        JSON.stringify({ error: fallback.error.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(JSON.stringify(fallback.data), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
