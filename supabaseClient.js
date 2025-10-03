// Supabase client for Framer/React
import { createClient } from '@supabase/supabase-js';

// TODO: Replace with your actual Supabase project URL and public anon key
const SUPABASE_URL ="https://qqtvrjzvwsowfstujuqf.supabase.co";
const SUPABASE_ANON_KEY ="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxdHZyanp2d3Nvd2ZzdHVqdXFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkyNTA1MzcsImV4cCI6MjA3NDgyNjUzN30.XG1l0bVnVQItXfLZtzog3qXowtFb4Q2znrNRMiPQQKI";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;


