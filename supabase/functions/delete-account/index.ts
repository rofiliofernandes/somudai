// delete-account: deletes the calling user, and only the calling user.
//
// 1. Verify the caller's sign-in token with Supabase Auth.
// 2. Delete that user with the service role key. The database cascades the
//    delete to their profile, matters and every Tap (see 0001_init.sql).
//
// The service role key comes from the function's environment, which Supabase
// fills in automatically. It never appears in the app, the repo or logs.
// Deploy: npx supabase functions deploy delete-account

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'Not signed in' }, 401);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) return json({ error: 'Server not configured' }, 500);

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verify the token: who is calling? (Never trust a user id sent in the body.)
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) return json({ error: 'Not signed in' }, 401);

  const { error: deleteError } = await admin.auth.admin.deleteUser(data.user.id);
  if (deleteError) {
    // Log only the error message, never the token or keys.
    console.error('delete-account failed:', deleteError.message);
    return json({ error: 'Could not delete account' }, 500);
  }

  return json({ deleted: true });
});
