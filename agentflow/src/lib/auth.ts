import { supabaseAdmin } from '@/lib/supabaseAdmin';

export interface AuthedUser {
  id: string;
  email?: string;
}

export async function getAuthedUser(req: Request): Promise<AuthedUser | null> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length);
    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && data?.user) {
        return { id: data.user.id, email: data.user.email ?? undefined };
      }
    } catch {
      // ignore errors and fall through
    }
  }
  return null;
}
