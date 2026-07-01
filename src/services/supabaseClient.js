import { createClient } from '@supabase/supabase-js'

let rawUrl = import.meta.env.VITE_SUPABASE_URL || 'https://csyluyuklqxigtmqcyzo.supabase.co'
if (rawUrl) {
  rawUrl = rawUrl.replace(/\/rest\/v1\/?$/, '')
}

const supabaseUrl = rawUrl
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_O-Pj2voN2UUbw2FwSfwFXw_gT9CmuBe'

// Only initialize Supabase if URL and Anon Key are provided
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null
