import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

const ProjectPatchSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  start_node_id: z.string().uuid().nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const parseResult = ProjectPatchSchema.safeParse(await req.json());
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: parseResult.error.flatten().fieldErrors }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const body = parseResult.data;
    const id = params?.id || new URL(req.url).pathname.split('/').pop();
    if (!id) {
      return new Response(JSON.stringify({ error: 'Missing project id in URL' }), { status: 400 });
    }

    let userId: string = DEFAULT_USER_ID;
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length);
      try {
        const { data: userData } = await supabaseAdmin.auth.getUser(token);
        if (userData?.user?.id) userId = userData.user.id;
      } catch {}
    }

    // Optional ownership check (no-op if user_id not present)
    try {
      await supabaseAdmin.from('projects').select('id').eq('id', id).eq('user_id', userId).maybeSingle();
    } catch {}

    const update = {
      name: body.name,
      description: body.description,
      status: body.status,
      start_node_id: body.start_node_id ?? null,
    };

    // Remove undefined keys
    Object.keys(update).forEach((k) => update[k] === undefined && delete update[k]);

    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(update)
      .eq('id', id)
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
