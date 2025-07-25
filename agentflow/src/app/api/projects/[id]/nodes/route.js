import { supabase } from '@/lib/supabaseClient';

// GET all nodes for a project
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get('project_id');
  
  const { data, error } = await supabase
    .from('nodes')
    .select()
    .eq('project_id', projectId);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data));
}

// POST create new node for a project
export async function POST(req) {
  const body = await req.json();
  
  const { data, error } = await supabase
    .from('nodes')
    .insert([body])
    .select();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data[0]));
}
