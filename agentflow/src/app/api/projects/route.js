import { supabase } from '@/lib/supabaseClient';

// GET all projects
export async function GET() {
  const { data, error } = await supabase
    .from('projects')
    .select();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data));
}

// POST create new project
export async function POST(req) {
  const body = await req.json();
  const { data, error } = await supabase
    .from('projects')
    .insert([body])
    .select();

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify(data[0]));
}
