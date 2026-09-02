import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let clientInstance: SupabaseClient | null = null;
let adminClientInstance: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    supabaseUrl &&
    !supabaseUrl.includes('your-project-ref') &&
    (supabaseAnonKey || supabaseServiceRoleKey)
  );
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!clientInstance) {
    const key = supabaseAnonKey || supabaseServiceRoleKey;
    if (supabaseUrl && key) {
      clientInstance = createClient(supabaseUrl, key);
    }
  }

  return clientInstance;
}

export function getSupabaseAdminClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!adminClientInstance) {
    const key = supabaseServiceRoleKey || supabaseAnonKey;
    if (supabaseUrl && key) {
      adminClientInstance = createClient(supabaseUrl, key, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      });
    }
  }

  return adminClientInstance;
}
