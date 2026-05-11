import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL não foi configurada no arquivo .env.local')
}

if (!supabasePublishableKey) {
    throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY não foi configurada no arquivo .env.local')
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey)