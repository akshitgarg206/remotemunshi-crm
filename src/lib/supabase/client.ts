import { createBrowserClient } from '@supabase/ssr'

// NOTE: Add <Database> generic back when types are auto-generated from Supabase CLI
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
