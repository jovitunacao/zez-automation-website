import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('your-project-id') &&
    !supabaseUrl.includes('your-project.supabase.co')
  );
};

let clientInstance: SupabaseClient | null = null;

if (isSupabaseConfigured()) {
  try {
    clientInstance = createClient(supabaseUrl!, supabaseAnonKey!);
    console.info('[ZEZ Supabase] Connected to Supabase PostgreSQL cloud database.');
  } catch (error) {
    console.warn('[ZEZ Supabase] Failed to initialize Supabase client:', error);
  }
} else {
  console.info('[ZEZ Supabase] Running in local demo mode. To connect Supabase, configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = clientInstance;
