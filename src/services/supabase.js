import { createClient } from '@supabase/supabase-js'

// Ensure these variable names match your Netlify setup AND local .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Add checks to ensure the variables are loaded correctly
if (!supabaseUrl) {
  console.error("VITE_SUPABASE_URL is missing. Check environment variables.");
  alert("Application configuration error: Supabase URL is missing.");
}
if (!supabaseAnonKey) {
  console.error("VITE_SUPABASE_ANON_KEY is missing. Check environment variables.");
  alert("Application configuration error: Supabase Anon Key is missing.");
}

// Initialize the client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default supabase
