import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) as string

if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL não foi configurada no arquivo .env.local')
}

if (!supabaseAnonKey) {
    throw new Error('VITE_SUPABASE_ANON_KEY (ou VITE_SUPABASE_PUBLISHABLE_KEY como fallback) não foi configurada no arquivo .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)